const test=require('node:test');
const assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

function setup(a={x:0,y:0,name:'P'},b={x:4,y:0,name:'B'}){const MI=runtime(['model.js','renderer.js','index.js']).MI,e=new MI.Engine({objects:[{id:'A',type:'point',...a},{id:'B',type:'point',...b}]});return {MI,e};}
function create(e,L=3,theta=Math.PI/3){return e.construct('parallelogramBySideAngle',[{objectId:'A'},{objectId:'B'}],undefined,undefined,{sideLength:L,signedAngle:theta})[0];}
function close(a,b){assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);}

test('M8b-2b all ten measures default hidden and saved visibility survives roundtrip',()=>{
 const {MI,e}=setup(),p=create(e),settings=MI.MeasurementGeometry.measurementSettings(p.measurements,p);assert.equal(Object.keys(settings.values).length,10);assert.ok(Object.values(settings.values).every(v=>!v.visible));const saved=plain(settings);saved.values['angle:0'].visible=true;e.update(p.id,{measurements:saved});const loaded=new MI.Engine(e.toJSON()),copy=loaded.get(p.id);assert.equal(copy.measurements.values['angle:0'].visible,true);assert.equal(copy.measurements.values['side:0'].visible,false);
});

test('polygon angle mark uses interior geometry, right angle square and suppressed invalid geometry',()=>{
 const {MI,e}=setup({x:1,y:2,name:'A'},{x:5,y:2,name:'B'}),p=create(e,3,Math.PI/2),settings=MI.MeasurementGeometry.defaultMeasurementSettings(p);settings.values['angle:0'].visible=true;e.update(p.id,{measurements:settings});let svg=e.renderSVG();assert.match(svg,/data-measurement-arc="angle:0"/);assert.match(svg,/data-angle-mark="right"/);close(MI.MeasurementGeometry.measurementValue(e.get(p.id),'angle:0'),90);e.update('B',{x:1,y:2});svg=e.renderSVG();assert.doesNotMatch(svg,/data-measurement-arc=/);assert.doesNotMatch(svg,/data-measurement-kind=/);e.update('B',{x:5,y:2});assert.match(e.renderSVG(),/data-angle-mark="right"/);
});

test('M8b names resolve from live source names and update side and angle labels',()=>{
 const {MI,e}=setup(),p=create(e),objects=new Map(e.model.objects.map(o=>[o.id,o])),settings=MI.MeasurementGeometry.defaultMeasurementSettings(p);for(const key of ['side:0','side:3','angle:0'])settings.values[key].visible=true;e.update(p.id,{measurements:settings});let svg=e.renderSVG();assert.match(svg,/Zijde PB/);assert.match(svg,/Zijde DP/);assert.match(svg,/∠DPB/);close(MI.MeasurementGeometry.measurementValue(e.get(p.id),'side:0'),4);e.update('A',{name:'X'});objects.set('A',e.get('A'));svg=e.renderSVG();assert.match(svg,/Zijde XB/);assert.match(svg,/Zijde DX/);assert.match(svg,/∠DXB/);assert.equal(MI.MeasurementGeometry.vertexNames(e.get(p.id),objects).join(','),'X,B,C,D');
});

test('polygon edge contextual plans use stable endpoint or edge references without new line objects',()=>{
 const {MI,e}=setup(),p=create(e,3,Math.PI/2),edge={objectId:p.id,part:'edge',index:1},mid=MI.ConstructionService.contextualPlans(p,'midpoint',edge)[0],bisector=MI.ConstructionService.contextualPlans(p,'perpendicularBisector',edge)[0],path=MI.ConstructionService.contextualPlans(p,'pointOnSegment',edge)[0],parallel=MI.ConstructionService.contextualPlans(p,'parallel',edge)[0],perpendicular=MI.ConstructionService.contextualPlans(p,'perpendicular',edge)[0];assert.deepEqual(plain(mid.sources),[{objectId:p.id,part:'vertex',index:1},{objectId:p.id,part:'vertex',index:2}]);assert.equal(mid.mode,'complete');assert.equal(bisector.mode,'complete');assert.deepEqual(plain(path.sources),[edge]);assert.equal(path.mode,'placement');assert.deepEqual(plain(parallel.sources),[edge]);assert.equal(parallel.mode,'prefill');assert.deepEqual(plain(perpendicular.sources),[edge]);const m=e.construct('midpoint',mid.sources)[0];close(m.x,(p.vertices[1].x+p.vertices[2].x)/2);close(m.y,(p.vertices[1].y+p.vertices[2].y)/2);e.update('B',{x:8,y:0});close(e.get(m.id).x,(e.get(p.id).vertices[1].x+e.get(p.id).vertices[2].x)/2);assert.equal(e.model.objects.filter(o=>o.type==='line').length,0);
});

test('restricted polygon edge construction requires tool and source grants and rejects atomically',()=>{
 const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI,{fixture}=require('./permission-fixtures.cjs'),author=new MI.Engine({objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]}),p=create(author),doc=plain(author.toJSON()),tool='construct:midpoint',paraTool='construct:parallelogramBySideAngle',refs=[{objectId:p.id,part:'vertex',index:1},{objectId:p.id,part:'vertex',index:2}],make=grant=>{const f=fixture('course');f.initialDocument=doc;f.policy.parameters={};f.policy.allowedTools=[...(grant?[tool]:[]),paraTool];f.policy.createdObjectRules.polygon={read:true,display:true,selectCanvas:true,selectList:true};f.policy.initialObjectRules={A:{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:[paraTool]},B:{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:[paraTool]},[p.id]:{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:grant?[tool]:[]}};return MI.RuntimeSession.create(f);};for(const grant of [false,true]){const {session,owner}=make(grant),before=plain(owner.inspect().document);if(!grant){assert.throws(()=>session.execute(session.createCommand('construction.create',{toolId:tool,sources:refs})),error=>['PERMISSION_DENIED','MISSING_SOURCE_PERMISSION'].includes(error.code));assert.deepEqual(plain(owner.inspect().document),before);}else{const result=session.execute(session.createCommand('construction.create',{toolId:tool,sources:refs})).result[0];assert.equal(result.construction.kind,'midpoint');assert.deepEqual(plain(result.construction.sources),refs);}}
});

test('negative rotated parallelogram keeps the geometric interior angle mark in SVG',()=>{
 const {MI,e}=setup({x:1,y:1,name:'A'},{x:1,y:5,name:'B'}),p=create(e,3,-Math.PI/3),settings=MI.MeasurementGeometry.defaultMeasurementSettings(p);settings.values['angle:0'].visible=true;e.update(p.id,{measurements:settings});const svg=e.renderSVG();assert.match(svg,/data-measurement-arc="angle:0"/);assert.doesNotMatch(svg,/data-measurement-arc="angle:0"[^>]*data-angle-mark="right"/);close(MI.MeasurementGeometry.measurementValue(e.get(p.id),'angle:0'),60);assert.doesNotMatch(svg,/NaN|Infinity/);
});

test('all four polygon-edge midpoints preserve stable vertex references',()=>{
 const {MI,e}=setup(),p=create(e,3,Math.PI/3);for(let i=0;i<4;i++){const plan=MI.ConstructionService.contextualPlans(p,'midpoint',{objectId:p.id,part:'edge',index:i})[0];assert.deepEqual(plain(plan.sources),[{objectId:p.id,part:'vertex',index:i},{objectId:p.id,part:'vertex',index:(i+1)%4}]);const midpoint=e.construct('midpoint',plan.sources)[0],a=e.get(p.id).vertices[i],b=e.get(p.id).vertices[(i+1)%4];close(midpoint.x,(a.x+b.x)/2);close(midpoint.y,(a.y+b.y)/2);}
});

