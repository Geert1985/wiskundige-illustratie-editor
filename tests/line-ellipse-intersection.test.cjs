const test=require('node:test'),assert=require('node:assert/strict'),{runtime}=require('./helpers.cjs');
function service(){return runtime(['model.js','renderer.js','index.js']).MI.ConstructionService;}
const ellipse={type:'ellipse',cx:0,cy:0,a:5,b:3,rotation:0};
function line(x1,y1,x2,y2,type='straight'){return {type,x1,y1,x2,y2};}
function solve(solver,l,e=ellipse,branch=0,ref={objectId:'L'}){return solver.lineEllipseIntersection({kind:'lineEllipseIntersection',sources:[ref,{objectId:'E'}],branch},[l,e]);}
function point(result,expected){assert.equal(result.reasonCode,'VALID');assert.ok(result.geometry);assert.ok(Math.abs(result.geometry.x-expected[0])<1e-10,`x ${result.geometry.x} != ${expected[0]}`);assert.ok(Math.abs(result.geometry.y-expected[1])<1e-10,`y ${result.geometry.y} != ${expected[1]}`);}

test('INT-101 exact horizontal ellipse intersections use directed branches',()=>{const s=service(),l=line(-6,0,6,0);point(solve(s,l,ellipse,0),[-5,0]);point(solve(s,l,ellipse,1),[5,0]);});
test('INT-102 exact tangent produces one unique branch 0',()=>{const s=service(),l=line(5,-4,5,4);point(solve(s,l,ellipse,0),[5,0]);assert.equal(solve(s,l,ellipse,1).reasonCode,'MERGED_INTERSECTION');});
test('INT-103 separated line has no real solution',()=>{const s=service();assert.equal(solve(s,line(-6,4,6,4)).reasonCode,'NO_REAL_INTERSECTION');});
test('INT-104 shifted rotated major-axis intersections use directed order',()=>{const s=service(),theta=Math.PI/4,u={x:Math.cos(theta),y:Math.sin(theta)},e={...ellipse,cx:7,cy:-2,rotation:theta},l=line(e.cx-8*u.x,e.cy-8*u.y,e.cx+8*u.x,e.cy+8*u.y);point(solve(s,l,e,0),[e.cx-5*u.x,e.cy-5*u.y]);point(solve(s,l,e,1),[e.cx+5*u.x,e.cy+5*u.y]);});
test('INT-105 finite segment preserves branch 1 after domain filtering',()=>{const s=service(),r=solve(s,line(0,0,6,0,'line'),ellipse,1);point(r,[5,0]);assert.equal(solve(s,line(0,0,6,0,'line'),ellipse,0).reasonCode,'OUTSIDE_DOMAINS');});
test('INT-106 leftward ray filters branch 0 and retains branch 1',()=>{const s=service(),l=line(0,0,-1,0,'ray');point(solve(s,l,ellipse,1),[-5,0]);assert.equal(solve(s,l,ellipse,0).reasonCode,'OUTSIDE_DOMAINS');});
test('INT-107 exact top tangency is one branch 0 point',()=>{const s=service(),e={...ellipse,b:3},l=line(-6,3,6,3);point(solve(s,l,e,0),[0,3]);assert.equal(solve(s,l,e,1).reasonCode,'MERGED_INTERSECTION');});
test('near-tangent discriminant inside its floating-point error bound is unresolved, never a phantom',()=>{const s=service(),r=solve(s,line(-6,3+1e-14,6,3+1e-14));assert.equal(r.reasonCode,'NUMERIC_UNRESOLVED');assert.equal(r.geometry,null);});
test('INT-110 thin ellipse with large legal translation remains finite with small residual',()=>{const s=service(),theta=.3,e={type:'ellipse',cx:1000000,cy:-2000000,a:5,b:1e-5,rotation:theta},v={x:-Math.sin(theta),y:Math.cos(theta)},l=line(e.cx-10*v.x,e.cy-10*v.y,e.cx+10*v.x,e.cy+10*v.y);const r=solve(s,l,e,0);assert.equal(r.reasonCode,'VALID');assert.ok(Math.abs(r.geometry.x-e.cx)<1e-3);assert.ok(Math.abs(r.geometry.y-(e.cy-1e-5))<1e-3);});
test('INT-111 circle-shaped ellipse intersections match exact radius',()=>{const s=service(),e={type:'ellipse',cx:2,cy:-1,a:4,b:4,rotation:1.2};point(solve(s,line(2,-8,2,8),e,0),[2,-5]);point(solve(s,line(-5,-1,10,-1),e,1),[6,-1]);});
test('zero direction, invalid ellipse and coordinate-limit results fail closed',()=>{const s=service();assert.equal(solve(s,line(1,1,1,1)).reasonCode,'DEGENERATE_DIRECTION');assert.equal(solve(s,line(-6,0,6,0),{...ellipse,b:0}).reasonCode,'SOURCE_INVALID');assert.equal(solve(s,line(-6,0,6,0),{...ellipse,cx:1e12}).reasonCode,'COORDINATE_LIMIT');});

function setupEngine(type='straight'){
 const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js','intersection-dispatcher.js']).MI;
 const base={type:'geometry',version:9,ellipseSchema:1,meta:{title:'',description:''},objects:[{id:'L',type,x1:-6,y1:0,x2:6,y2:0},{id:'E',type:'ellipse',cx:0,cy:0,a:5,b:3,rotation:0}]};
 return {MI,base,e:new MI.Engine(base)};
}
test('INT-114 dispatcher accepts both source orders and stores canonical line then ellipse',()=>{
 const {MI}=setupEngine(),objects=new Map([{id:'L',type:'line',x1:-6,y1:0,x2:6,y2:0},{id:'E',type:'ellipse',cx:0,cy:0,a:5,b:3,rotation:0}].map(o=>[o.id,o]));
 for(const refs of [[{objectId:'L'},{objectId:'E'}],[{objectId:'E'},{objectId:'L'}]]){const result=MI.IntersectionDispatcher.evaluate(refs,objects);assert.equal(result.kind,'lineEllipseIntersection');assert.equal(result.candidates.length,2);assert.deepEqual(JSON.parse(JSON.stringify(result.sources)),[{objectId:'L'},{objectId:'E'}]);}
});
test('INT-108 persistent branches survive two→tangent→none→two, roundtrip and keep style',()=>{
 const {MI,e}=setupEngine(),created=e.construct('lineEllipseIntersection',[{objectId:'L'},{objectId:'E'}]);assert.equal(created.length,2);const ids=created.map(o=>o.id);e.update(ids[1],{style:{fill:'#123456'}});
 assert.equal(e.toJSON().constructionSchema,10);assert.equal(e.toJSON().version,9);e.update('E',{cy:3});assert.equal(e.getConstructionInfo(ids[0]).reasonCode,'VALID');assert.equal(e.getConstructionInfo(ids[1]).reasonCode,'MERGED_INTERSECTION');e.update('E',{cy:4});assert.equal(e.getConstructionInfo(ids[0]).reasonCode,'NO_REAL_INTERSECTION');e.update('E',{cy:0});assert.deepEqual(e.model.objects.filter(o=>o.construction?.kind==='lineEllipseIntersection').map(o=>o.id),ids);assert.ok(Math.abs(e.get(ids[1]).x-5)<1e-10);assert.equal(e.get(ids[1]).style.fill,'#123456');
 const doc=JSON.parse(JSON.stringify(e.toJSON())),loaded=new MI.Engine(doc);assert.deepEqual(JSON.parse(JSON.stringify(loaded.toJSON())),doc);
});
test('INT-105/106 domain filtering retains branch 1 for finite segments and leftward rays',()=>{
 const {e}=setupEngine('line');e.update('L',{x1:0,y1:0,x2:6,y2:0});let p=e.construct('lineEllipseIntersection',[{objectId:'L'},{objectId:'E'}]);assert.equal(p.length,1);assert.equal(p[0].x,5);assert.equal(p[0].construction.branch,1);
 const ray=setupEngine('ray').e;ray.update('L',{x1:0,y1:0,x2:-1,y2:0});p=ray.construct('lineEllipseIntersection',[{objectId:'L'},{objectId:'E'}]);assert.equal(p.length,1);assert.equal(p[0].x,-5);assert.equal(p[0].construction.branch,1);
});
test('INT-112 polygon edge reference remains exact in persisted recipe and follows vertices',()=>{
 const {e}=setupEngine(),triangle=e.add({id:'T',type:'polygon',vertices:[{x:-6,y:0},{x:6,y:0},{x:0,y:6}]}),refs=[{objectId:triangle.id,part:'edge',index:0},{objectId:'E'}],p=e.construct('lineEllipseIntersection',refs);assert.equal(p.length,2);assert.deepEqual(JSON.parse(JSON.stringify(p[0].construction.sources)),refs);e.update('T',{vertices:[{x:-6,y:1},{x:6,y:1},{x:0,y:6}]});assert.ok(Math.abs(e.get(p[0].id).y-1)<1e-10);
});
test('INT-116/118 schema 10 accepts combined recipes and rejects missing or downgraded feature gates atomically',()=>{
 const {MI,e}=setupEngine();e.construct('lineEllipseIntersection',[{objectId:'L'},{objectId:'E'}]);const valid=JSON.parse(JSON.stringify(e.toJSON())),before=JSON.stringify(e.toJSON());
 for(const schema of [9,undefined]){const bad=JSON.parse(JSON.stringify(valid));if(schema===undefined)delete bad.constructionSchema;else bad.constructionSchema=schema;assert.throws(()=>e.load(bad));assert.equal(JSON.stringify(e.toJSON()),before);}
 const noRecipe=JSON.parse(JSON.stringify(valid));noRecipe.objects=noRecipe.objects.filter(o=>o.construction?.kind!=='lineEllipseIntersection');assert.throws(()=>new MI.Engine(noRecipe));
 const badBranch=JSON.parse(JSON.stringify(valid));badBranch.objects.find(o=>o.construction?.kind==='lineEllipseIntersection').construction.branch=2;assert.throws(()=>e.load(badBranch));assert.equal(JSON.stringify(e.toJSON()),before);
});
test('ellipse and explicit polygon-edge context plans prefill lineEllipseIntersection sources',()=>{
 const {MI}=setupEngine(),service=MI.ConstructionService,ellipse={id:'E',type:'ellipse',cx:0,cy:0,a:5,b:3,rotation:0};
 const ellipsePlan=service.contextualPlans(ellipse,'lineEllipseIntersection')[0];assert.equal(ellipsePlan.mode,'prefill');assert.equal(ellipsePlan.sourceIndex,1);assert.deepEqual(JSON.parse(JSON.stringify(ellipsePlan.sources)),[{objectId:'E'}]);
 for(const [id,vertices] of [['T',[{x:0,y:0},{x:4,y:0},{x:0,y:4}] ],['Q',[{x:0,y:0},{x:4,y:0},{x:5,y:3},{x:0,y:3}] ],['P',[{x:0,y:0},{x:4,y:0},{x:5,y:3},{x:2,y:5},{x:-1,y:3}]]]){const polygon={id,type:'polygon',vertices};for(let index=0;index<vertices.length;index++){const plan=service.contextualPlans(polygon,'lineEllipseIntersection',{objectId:id,part:'edge',index})[0];assert.equal(plan.mode,'prefill');assert.deepEqual(JSON.parse(JSON.stringify(plan.sources)),[{objectId:id,part:'edge',index}]);}}
});
test('INT-119 restricted grants remain recipe-specific and Cartesian-axis access is explicit',()=>{
 const {MI,base}=setupEngine(),{fixture}=require('./permission-fixtures.cjs'),tool='construct:lineEllipseIntersection',restricted=fixture('course',{allowedTools:[tool],initialObjectRules:{L:{sourceTools:[tool]},E:{sourceTools:[tool]}}});restricted.initialDocument=base;restricted.policy.parameters={};const session=MI.RuntimeSession.create(restricted).session;
 assert.equal(session.engine.construct('lineEllipseIntersection',[{objectId:'L'},{objectId:'E'}]).length,2);
 const lineCircleOnly=fixture('course',{allowedTools:['construct:lineCircleIntersection'],initialObjectRules:{L:{sourceTools:[tool]},E:{sourceTools:[tool]}}});lineCircleOnly.initialDocument=base;lineCircleOnly.policy.parameters={};const denied=MI.RuntimeSession.create(lineCircleOnly).session;assert.throws(()=>denied.engine.construct('lineEllipseIntersection',[{objectId:'L'},{objectId:'E'}]),error=>error.code==='PERMISSION_DENIED');
 const axisPolicy=fixture('course',{allowedTools:[tool],axisSourceTools:{x:[tool]},initialObjectRules:{E:{sourceTools:[tool]}}});axisPolicy.initialDocument={...base,objects:base.objects.filter(o=>o.id==='E')};axisPolicy.policy.parameters={};const axisSession=MI.RuntimeSession.create(axisPolicy).session;assert.equal(axisSession.engine.construct('lineEllipseIntersection',[{kind:'axis',frame:'cartesian',axis:'x'},{objectId:'E'}]).length,2);
 const noAxisGrant=fixture('course',{allowedTools:[tool],initialObjectRules:{E:{sourceTools:[tool]}}});noAxisGrant.initialDocument=axisPolicy.initialDocument;noAxisGrant.policy.parameters={};const noAxis=MI.RuntimeSession.create(noAxisGrant).session;assert.throws(()=>noAxis.engine.construct('lineEllipseIntersection',[{kind:'axis',frame:'cartesian',axis:'x'},{objectId:'E'}]),error=>error.code==='MISSING_SOURCE_PERMISSION');
});
