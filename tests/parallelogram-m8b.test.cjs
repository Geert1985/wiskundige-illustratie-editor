const test=require('node:test');
const assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

function setup(){const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI;return {MI,e:new MI.Engine({type:'geometry',version:2,objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]})};}
const refs=[{objectId:'A'},{objectId:'B'}],sqrt3=Math.sqrt(3);
function make(e,L=3,theta=Math.PI/3){return e.construct('parallelogramBySideAngle',refs,undefined,undefined,{sideLength:L,signedAngle:theta})[0];}
function close(actual,expected,epsilon=1e-11){assert.ok(Math.abs(actual-expected)<=epsilon*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);}

test('parallelogram has independent golden vertices and preserves signed orientation and invariants',()=>{
 const {e}=setup(),p=make(e),v=p.vertices;assert.equal(p.type,'polygon');assert.equal(p.construction.kind,'parallelogramBySideAngle');const expected=[[0,0],[4,0],[5.5,3*sqrt3/2],[1.5,3*sqrt3/2]];v.forEach((q,i)=>{close(q.x,expected[i][0]);close(q.y,expected[i][1]);});
 close(2*(Math.hypot(v[1].x-v[0].x,v[1].y-v[0].y)+3),14);close(Math.abs((v[1].x-v[0].x)*(v[3].y-v[0].y)-(v[1].y-v[0].y)*(v[3].x-v[0].x)),6*sqrt3);
 const negative=make(e,3,-Math.PI/3);assert.ok(negative.vertices[2].y<0);close(Math.abs((negative.vertices[1].x-negative.vertices[0].x)*(negative.vertices[3].y-negative.vertices[0].y)-(negative.vertices[1].y-negative.vertices[0].y)*(negative.vertices[3].x-negative.vertices[0].x)),6*sqrt3);
});

test('rectangles, rhombi and squares are the same polygon recipe',()=>{
 const {e}=setup();const rectangle=make(e,3,Math.PI/2);close(rectangle.vertices[2].x,4);close(rectangle.vertices[2].y,3);close(rectangle.vertices[3].x,0);close(rectangle.vertices[3].y,3);
 const rhombus=make(e,4,Math.PI/3);assert.equal(rhombus.type,'polygon');close(Math.hypot(rhombus.vertices[2].x-rhombus.vertices[1].x,rhombus.vertices[2].y-rhombus.vertices[1].y),4);
 const square=make(e,4,Math.PI/2);assert.equal(square.construction.kind,'parallelogramBySideAngle');
});

test('source motion retains side length and signed angle, invalidity clears stale vertices and recovers',()=>{
 const {MI,e}=setup(),p=make(e);e.update('B',{x:8,y:0});const moved=e.get(p.id).vertices;close(moved[2].x,9.5);close(moved[2].y,3*sqrt3/2);e.update('B',{x:0,y:0});assert.equal(e.get(p.id).constructionValid,false);assert.equal(e.renderer.renderObject(e.get(p.id)),'');e.update('B',{x:8,y:0});assert.equal(e.get(p.id).constructionValid,true);assert.equal(e.get(p.id).id,p.id);
});

test('strict parameters, sources, schema 8 and mixed GEO-UI document version roundtrip',()=>{
 const {MI,e}=setup();const p=make(e);const doc=plain(e.toJSON());assert.equal(doc.constructionSchema,8);assert.equal(doc.version,3);assert.equal(new MI.Engine(doc).get(p.id).vertices.length,4);
 const measured=plain(doc);measured.version=10;measured.measurementSchema=1;measured.objects.find(o=>o.id===p.id).measurements={schema:1,values:{}};assert.equal(new MI.Engine(measured).toJSON().constructionSchema,8);assert.equal(new MI.Engine(measured).toJSON().version,10);
 for(const recipe of [{sideLength:0,signedAngle:1},{sideLength:-1,signedAngle:1},{sideLength:2,signedAngle:0},{sideLength:2,signedAngle:Math.PI},{sideLength:2,signedAngle:Infinity},{sideLength:2,signedAngle:1,extra:true}])assert.throws(()=>e.construct('parallelogramBySideAngle',refs,undefined,undefined,recipe));
 const wrong=plain(doc);wrong.constructionSchema=7;assert.throws(()=>new MI.Engine(wrong));const bad=plain(doc);bad.constructionSchema=8;bad.objects.find(o=>o.id===p.id).construction.sideLength=0;assert.throws(()=>new MI.Engine(bad));
});

test('contextual plan pre-fills point A and enters an explicit placement step',()=>{
 const {MI,e}=setup();const plans=MI.ConstructionService.contextualPlans(e.get('A'),'parallelogramBySideAngle');assert.equal(plans[0].mode,'placement');assert.equal(plans[0].sourceIndex,0);assert.deepEqual(plain(plans[0].sources),[{objectId:'A'}]);
});

test('polygon snapshots duplicate and detach independently while linked edges retain fixed topology',()=>{
 const {e}=setup(),p=make(e),edgePoint=e.construct('midpoint',[{objectId:p.id,part:'vertex',index:0},{objectId:p.id,part:'vertex',index:1}])[0];assert.equal(edgePoint.x,2);e.update('B',{x:8});assert.equal(e.get(p.id).vertices[1].x,8);assert.equal(e.get(edgePoint.id).x,4,'derived edge point should follow the updated A-B edge');assert.equal(e.get(p.id).vertices.length,4);const duplicate=e.duplicateMany([p.id])[0];assert.equal(duplicate.type,'polygon');assert.equal(duplicate.construction,undefined);assert.equal(duplicate.vertices.length,4);const detached=e.detachConstructions([p.id])[0];assert.equal(detached.construction,undefined);assert.equal(detached.vertices.length,4);
});

test('restricted creation denies the new tool and source capabilities before document mutation',()=>{
 const {MI}=runtime(),{fixture}=require('./permission-fixtures.cjs'),changes=[f=>{f.policy.allowedTools=f.policy.allowedTools.filter(t=>t!=='construct:parallelogramBySideAngle');},f=>{f.policy.initialObjectRules.B.sourceTools=[];}];
 for(const change of changes){const f=fixture('course');f.policy.allowedTools.push('construct:parallelogramBySideAngle');f.policy.initialObjectRules.A.sourceTools.push('construct:parallelogramBySideAngle');f.policy.initialObjectRules.B.sourceTools.push('construct:parallelogramBySideAngle');f.policy.createdObjectRules.polygon={read:true,display:true,selectCanvas:true,selectList:true,delete:true,snap:true};change(f);const {session,owner}=MI.RuntimeSession.create(f),before=plain(owner.inspect());assert.throws(()=>session.execute(session.createCommand('construction.create',{toolId:'construct:parallelogramBySideAngle',sources:refs,sideLength:3,signedAngle:Math.PI/3})));assert.deepEqual(plain(owner.inspect()),before);}
});

test('parallelogram parameters have an atomic author command and deterministic semantic replay',()=>{
 const {MI,e}=setup(),commands=MI.AuthorCommands(e),run=(op,p)=>commands.execute(commands.createCommand(op,p)),p=make(e),before=plain(e.toJSON());assert.throws(()=>run('construction.setParallelogramParameters',{id:p.id,sideLength:0}));assert.deepEqual(plain(e.toJSON()),before);
 run('construction.setParallelogramParameters',{id:p.id,sideLength:5,signedAngle:-Math.PI/2});assert.equal(e.get(p.id).construction.sideLength,5);assert.ok(e.get(p.id).vertices[2].y<0);
 const sequence=new MI.SemanticSequence({type:'geometry',version:2,objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]});const id=sequence.execute('construction.create',{toolId:'construct:parallelogramBySideAngle',sources:refs,sideLength:3,signedAngle:Math.PI/3}).result[0].id;sequence.execute('construction.setParallelogramParameters',{id,sideLength:5});assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())),plain(sequence.document));
});
