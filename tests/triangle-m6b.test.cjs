const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

const triangle={id:'T',type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:0,y:3}]};
const source=[{objectId:'T'}],kinds=['incenter','incircle','eulerLine','ninePointCircle'];
function setup(vertices=triangle.vertices){const {MI}=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']);return {MI,e:new MI.Engine({objects:[{...triangle,vertices:plain(vertices)}]})};}
const close=(actual,expected,tolerance=2e-12)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(actual),Math.abs(expected)),`${actual} != ${expected}`);

test('M6b registers four schema-2 triangle recipes with the existing triangle role',()=>{
 const {MI,e}=setup(),expected={incenter:['point',['x','y']],incircle:['circle',['cx','cy','r']],eulerLine:['straight',['x1','y1','x2','y2']],ninePointCircle:['circle',['cx','cy','r']]};
 for(const kind of kinds){const contract=MI.ConstructionService.contract(kind);assert.equal(contract.resultType,expected[kind][0]);assert.deepEqual(plain(contract.sourceRoles),['triangle']);assert.deepEqual(plain(contract.computedFields),expected[kind][1]);assert.equal(MI.ConstructionService.schema2(kind),true);assert.equal(e.construct(kind,source).length,1);}
 const data=plain(e.toJSON());assert.equal(data.version,3);assert.equal(data.constructionSchema,2);assert.deepEqual(plain(new MI.Engine(data).toJSON()),data);
});

test('independent 3-4-5 references give the incenter, incircle, Euler line and nine-point circle',()=>{
 const {MI,e}=setup(),created=Object.fromEntries(kinds.map(kind=>[kind,e.construct(kind,source)[0]]));
 close(created.incenter.x,1);close(created.incenter.y,1);
 close(created.incircle.cx,1);close(created.incircle.cy,1);close(created.incircle.r,1);
 // This right triangle has O=(2,1.5), H=A=(0,0); the Euler line is OH.
 const line=created.eulerLine;assert.equal(line.type,'straight');
 close(line.x1,2);close(line.y1,1.5);close(line.x2,0);close(line.y2,0);
 const circle=created.ninePointCircle;close(circle.cx,1);close(circle.cy,.75);close(circle.r,1.25);
 for(const midpoint of [{x:2,y:0},{x:0,y:1.5},{x:2,y:1.5}])close(Math.hypot(midpoint.x-circle.cx,midpoint.y-circle.cy),circle.r);
 for(const id of Object.values(created).map(o=>o.id)){assert.match(e.renderer.renderObject(e.get(id)),/<(circle|line)/);}
 assert.equal(e.toJSON().constructionSchema,2);assert.deepEqual(plain(new MI.Engine(plain(e.toJSON())).toJSON()),plain(e.toJSON()));
});

test('M6b follows a G-TRI1 triangle, keeps IDs, becomes invalid on degeneration and recovers',()=>{
 const {MI}=setup(),e=new MI.Engine({objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0},{id:'C',type:'point',x:0,y:3}]}),t=e.construct('triangleFromPoints',[{objectId:'A'},{objectId:'B'},{objectId:'C'}])[0],derived=kinds.map(kind=>e.construct(kind,[{objectId:t.id}])[0]),ids=derived.map(o=>o.id);
 e.update('B',{x:6});assert.ok(derived.every((o,i)=>e.get(o.id).id===ids[i]&&e.getConstructionInfo(o.id).valid));const updatedRadius=18/(9+Math.hypot(6,3));close(e.get(derived[1].id).cx,updatedRadius);close(e.get(derived[1].id).cy,updatedRadius);close(e.get(derived[1].id).r,updatedRadius);
 e.update('C',{y:0});for(const o of derived)assert.equal(e.getConstructionInfo(o.id).reasonCode,'SOURCE_INVALID');
 const bad=plain(e.toJSON()),loaded=new MI.Engine(bad);for(const o of derived)assert.equal(loaded.getConstructionInfo(o.id).reasonCode,'SOURCE_INVALID');
 loaded.update('C',{y:3});for(const [i,o] of derived.entries()){assert.equal(loaded.get(o.id).id,ids[i]);assert.equal(loaded.getConstructionInfo(o.id).reasonCode,'VALID');}
});

test('the 1e-12 degeneracy boundary is shared and M6b distinguishes equilateral Euler ambiguity',()=>{
 const {MI}=setup(),base=[{x:0,y:0},{x:1,y:0},{x:0,y:1}],evaluate=(vertices,kind)=>MI.ConstructionService.evaluate({kind,sources:source},new Map([['T',{id:'T',type:'polygon',vertices}]]));
 for(const [height,reason] of [[1e-12,'DEGENERATE_TRIANGLE'],[1e-12*(1-2**-10),'DEGENERATE_TRIANGLE']])for(const kind of kinds)assert.equal(evaluate([{x:0,y:0},{x:1,y:0},{x:0,y:height}],kind).reasonCode,reason);
 for(const kind of kinds)assert.equal(evaluate([{x:0,y:0},{x:1,y:0},{x:0, y:1e-12*(1+2**-10)}],kind).reasonCode,'VALID');
 const equilateral=[{x:0,y:0},{x:2,y:0},{x:1,y:Math.sqrt(3)}];
 for(const kind of ['incenter','incircle','ninePointCircle'])assert.equal(evaluate(equilateral,kind).reasonCode,'VALID');
 assert.equal(evaluate(equilateral,'eulerLine').reasonCode,'UNDEFINED_EULER_LINE');
});

test('M6b reports coordinate overflow and unrepresentable subnormal circle radii safely',()=>{
 const {MI}=setup(),evalAt=(vertices,kind)=>MI.ConstructionService.evaluate({kind,sources:source},new Map([['T',{id:'T',type:'polygon',vertices}]]));
 const far=[{x:0,y:0},{x:1e12,y:0},{x:5e11,y:2}];
 for(const kind of ['incenter','incircle'])assert.equal(evalAt(far,kind).reasonCode,'VALID');
 for(const kind of ['eulerLine','ninePointCircle'])assert.equal(evalAt(far,kind).reasonCode,'COORDINATE_LIMIT');
 const tiny=[{x:0,y:0},{x:Number.MIN_VALUE,y:0},{x:0,y:Number.MIN_VALUE}];
 assert.equal(evalAt(tiny,'incircle').reasonCode,'NON_FINITE_RESULT');assert.equal(evalAt(tiny,'ninePointCircle').reasonCode,'NON_FINITE_RESULT');
});

test('M6b semantic replay, undo/redo, restricted source permissions and M6a coexistence',()=>{
 const {MI}=setup(),sequence=new MI.SemanticSequence({objects:[triangle]});
 for(const kind of kinds)sequence.execute('construction.create',{toolId:'construct:'+kind,sources:source});
 const saved=plain(sequence.document);assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())),saved);
 const policy=require('./permission-fixtures.cjs').fixture('course',{parameters:{},allowedTools:['construct:incenter','construct:incircle','construct:eulerLine','construct:ninePointCircle'],createdObjectRules:{point:{read:true,display:true,selectCanvas:true,selectList:true},circle:{read:true,display:true,selectCanvas:true,selectList:true},straight:{read:true,display:true,selectCanvas:true,selectList:true}},initialObjectRules:{T:{sourceTools:kinds.map(kind=>'construct:'+kind)}}});
 policy.initialDocument={objects:[triangle]};const session=MI.RuntimeSession.create(policy).session;for(const kind of kinds)assert.equal(session.engine.construct(kind,source)[0].constructionValid,true);
 policy.policy.initialObjectRules.T={};assert.throws(()=>MI.RuntimeSession.create(policy).session.engine.construct('incircle',source),error=>error.code==='MISSING_SOURCE_PERMISSION');
 const e=new MI.Engine({objects:[triangle]});for(const kind of ['centroid','circumcenter','orthocenter',...kinds])assert.equal(e.construct(kind,source).length,1);
});
