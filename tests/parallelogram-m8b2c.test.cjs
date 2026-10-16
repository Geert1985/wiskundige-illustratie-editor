const test=require('node:test');
const assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

const refs=[{objectId:'A'},{objectId:'B'}];
function setup(files=['model.js','renderer.js','index.js','semantic-sequence.js','editor-history.js']){
 const MI=runtime(files).MI,e=new MI.Engine({type:'geometry',version:2,objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]});
 return {MI,e};
}
function create(e,sideLength=3,signedAngle=Math.PI/3,sideLengthMode){return e.construct('parallelogramBySideAngle',refs,undefined,undefined,{sideLength,signedAngle,...(sideLengthMode?{sideLengthMode}:{})})[0];}
function close(actual,expected,tol=1e-10){assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);}
function sides(v){return v.map((p,i)=>Math.hypot(v[(i+1)%4].x-p.x,v[(i+1)%4].y-p.y));}

test('M8b-2c matchAB is an exact persistent rhombus and square under source motion',()=>{
 const {MI,e}=setup(),p=create(e,4,Math.PI/2,'matchAB');
 for(const side of sides(p.vertices))close(side,4);p.vertices.forEach((q,i)=>{close(q.x,[[0,0],[4,0],[4,4],[0,4]][i][0]);close(q.y,[[0,0],[4,0],[4,4],[0,4]][i][1]);});
 close(2*(sides(p.vertices)[0]+sides(p.vertices)[1]),16);close(Math.abs((p.vertices[1].x-p.vertices[0].x)*(p.vertices[3].y-p.vertices[0].y)-(p.vertices[1].y-p.vertices[0].y)*(p.vertices[3].x-p.vertices[0].x)),16);
 assert.equal(MI.ConstructionService.parallelogramShape(p),'Vierkant');
 e.update('B',{x:6,y:0});const moved=e.get(p.id);moved.vertices.forEach((q,i)=>{close(q.x,[[0,0],[6,0],[6,6],[0,6]][i][0]);close(q.y,[[0,0],[6,0],[6,6],[0,6]][i][1]);});for(const side of sides(moved.vertices))close(side,6);close(2*(sides(moved.vertices)[0]+sides(moved.vertices)[1]),24);close(Math.abs((moved.vertices[1].x-moved.vertices[0].x)*(moved.vertices[3].y-moved.vertices[0].y)-(moved.vertices[1].y-moved.vertices[0].y)*(moved.vertices[3].x-moved.vertices[0].x)),36);
 assert.equal(MI.ConstructionService.parallelogramShape(moved),'Vierkant');
});

test('fixed, rhombus, rotated basis and signed right-angle classifications share the polygon recipe',()=>{
 const {MI,e}=setup();let p=create(e,3,-Math.PI/3,'matchAB');assert.equal(MI.ConstructionService.parallelogramShape(p),'Ruit');assert.ok(p.vertices[2].y<0);
 e.update('B',{x:0,y:4});p=e.get(p.id);assert.equal(MI.ConstructionService.parallelogramShape(p),'Ruit');assert.deepEqual(plain(sides(p.vertices).map(x=>Math.round(x*1e9)/1e9)),[4,4,4,4]);
 const right=create(e,3,Math.PI/2,'matchAB');assert.equal(MI.ConstructionService.parallelogramShape(right),'Vierkant');
 const fixed=create(e,4,Math.PI/2);assert.equal(fixed.construction.sideLengthMode,undefined);assert.equal(MI.ConstructionService.parallelogramShape(fixed),'Vierkant');
 e.update('B',{x:0,y:6});assert.equal(e.get(fixed.id).construction.sideLength,4);assert.equal(MI.ConstructionService.parallelogramShape(e.get(fixed.id)),'Rechthoek');
});

test('matchAB mode transitions are atomic, preserve shape on exit, and replay with one semantic command',()=>{
 const {MI,e}=setup(),commands=MI.AuthorCommands(e),run=(op,p)=>commands.execute(commands.createCommand(op,p)),p=create(e,2,Math.PI/3),before=plain(e.toJSON());
 assert.throws(()=>run('construction.setParallelogramParameters',{id:p.id,sideLengthMode:'matchAB',sideLength:7}));assert.deepEqual(plain(e.toJSON()),before);
 run('construction.setParallelogramParameters',{id:p.id,sideLengthMode:'matchAB'});assert.equal(e.get(p.id).construction.sideLengthMode,'matchAB');for(const side of sides(e.get(p.id).vertices))close(side,4);
 e.update('B',{x:7,y:0});const matched=plain(e.get(p.id).vertices);run('construction.setParallelogramParameters',{id:p.id,sideLengthMode:'fixed'});assert.equal(e.get(p.id).construction.sideLengthMode,undefined);close(e.get(p.id).construction.sideLength,7);assert.deepEqual(plain(e.get(p.id).vertices),matched);
 const sequence=new MI.SemanticSequence({objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]});const id=sequence.execute('construction.create',{toolId:'construct:parallelogramBySideAngle',sources:refs,sideLength:4,signedAngle:Math.PI/2,sideLengthMode:'matchAB'}).result[0].id;sequence.execute('construction.setParallelogramParameters',{id,signedAngle:-Math.PI/2});assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())),plain(sequence.document));
});

test('schema 8 remains fixed; schema 9 stores matchAB and mixes measurements, ellipses and regions',()=>{
 const {MI,e}=setup();const fixed=create(e);assert.equal(e.toJSON().constructionSchema,8);const dynamic=create(e,4,Math.PI/2,'matchAB');assert.equal(e.toJSON().constructionSchema,9);const ellipse=e.construct('ellipseByFociAndSum',refs,10)[0],region=e.construct('polygonRegion',[{objectId:fixed.id}])[0];e.add({id:'Q',type:'point',x:2,y:5});const controlEllipse=e.construct('ellipseByFociAndPoint',[...refs,{objectId:'Q'}])[0],ellipsePoint=e.construct('pointOnEllipse',[{objectId:controlEllipse.id}],.25)[0],edgePoint=e.construct('pointOnSegment',[{objectId:dynamic.id,part:'edge',index:1}],.5)[0];e.update(dynamic.id,{measurements:{schema:1,values:{}}});
 const doc=plain(e.toJSON());assert.equal(doc.version,10);assert.equal(doc.measurementSchema,1);assert.equal(doc.ellipseSchema,1);assert.equal(doc.regionSchema,1);assert.equal(doc.constructionSchema,9);const loaded=new MI.Engine(doc);assert.deepEqual(plain(loaded.toJSON()),doc);assert.equal(loaded.get(dynamic.id).construction.sideLengthMode,'matchAB');assert.equal(loaded.get(fixed.id).construction.sideLengthMode,undefined);assert.equal(loaded.get(ellipse.id).construction.kind,'ellipseByFociAndSum');assert.equal(loaded.get(controlEllipse.id).construction.kind,'ellipseByFociAndPoint');assert.equal(loaded.get(ellipsePoint.id).construction.kind,'pointOnEllipse');assert.equal(loaded.get(region.id).construction.kind,'polygonRegion');assert.deepEqual(plain(loaded.get(edgePoint.id).construction.sources),[{objectId:dynamic.id,part:'edge',index:1}]);close(loaded.get(edgePoint.id).x,4);close(loaded.get(edgePoint.id).y,2);loaded.update('B',{x:6,y:0});close(loaded.get(edgePoint.id).x,6);close(loaded.get(edgePoint.id).y,3);assert.equal(loaded.get(dynamic.id).constructionValid,true);
 const invalid=plain(doc);invalid.constructionSchema=8;assert.throws(()=>new MI.Engine(invalid));const unknown=plain(doc);unknown.constructionSchema=10;assert.throws(()=>new MI.Engine(unknown));
});

test('restricted schema-9 export includes matchAB only when both source grants remain available',()=>{
 const {MI,e}=setup(),para=create(e,4,Math.PI/2,'matchAB');e.update(para.id,{measurements:{schema:1,values:{}}});const document=plain(e.toJSON()),tool='construct:parallelogramBySideAngle',rules=Object.fromEntries(document.objects.map(o=>[o.id,{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:[tool]}]));
 const make=hideB=>{const {fixture}=require('./permission-fixtures.cjs'),f=fixture('course',{parameters:{},initialObjectRules:{...rules,...(hideB?{B:{...rules.B,read:false,display:false}}:{})}});f.initialDocument=document;return MI.RuntimeSession.create(f).session;};
 const session=make(false),json=session.execute(session.createCommand('document.exportJSON')).result;assert.equal(json.version,10);assert.equal(json.measurementSchema,1);assert.equal(json.constructionSchema,9);assert.equal(json.objects.find(o=>o.id===para.id).construction.sideLengthMode,'matchAB');assert.deepEqual(plain(new MI.Engine(json).toJSON()),plain(json));
 const denied=make(true);assert.throws(()=>denied.execute(denied.createCommand('document.exportJSON')),error=>error.code==='PERMISSION_DENIED');
});

test('matched parallelogram invalidity clears dependent geometry and recovers with stable identity',()=>{
 const {MI,e}=setup(),p=create(e,2,Math.PI/2,'matchAB'),mid=e.construct('pointOnSegment',[{objectId:p.id,part:'edge',index:1}],.5)[0],id=p.id;
 e.update('B',{x:0,y:0});assert.equal(e.get(id).constructionValid,false);assert.equal('vertices'in e.get(id),false);assert.equal(e.get(mid.id).constructionValid,false);assert.equal('vertices'in plain(e.toJSON()).objects.find(o=>o.id===id),false);
 e.update('B',{x:6,y:0});assert.equal(e.get(id).id,id);assert.equal(e.get(id).construction.sideLengthMode,'matchAB');assert.equal(e.get(id).constructionValid,true);assert.equal(e.get(id).vertices[2].x,6);assert.equal(e.get(mid.id).constructionValid,true);close(e.get(mid.id).x,6);close(e.get(mid.id).y,3);
});

test('matchAB rejects invalid modes and values without mutating the document',()=>{
 const {e}=setup(),before=plain(e.toJSON());
 for(const options of [{sideLength:3,signedAngle:Math.PI/3,sideLengthMode:'other'},{sideLength:3,signedAngle:Math.PI/3,sideLengthMode:'matchAB',unknown:true},{sideLength:0,signedAngle:Math.PI/3,sideLengthMode:'matchAB'},{sideLength:3,signedAngle:0,sideLengthMode:'matchAB'}])assert.throws(()=>e.construct('parallelogramBySideAngle',refs,undefined,undefined,options));
 assert.deepEqual(plain(e.toJSON()),before);
});

