const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

const sources=[{objectId:'A'},{objectId:'B'},{objectId:'C'}];
const points=[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0},{id:'C',type:'point',x:1,y:3}];
function setup(){const {MI}=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']);return {MI,e:new MI.Engine({objects:points})};}

test('G-TRI1 registers a schema-2 polygon recipe with three ordered point roles',()=>{
 const {MI,e}=setup(),definition=MI.ConstructionService.contract('triangleFromPoints');
 assert.equal(definition.resultType,'polygon');assert.deepEqual(plain(definition.sourceRoles),['point','point','point']);assert.deepEqual(plain(definition.computedFields),['vertices']);assert.equal(MI.ConstructionService.schema2('triangleFromPoints'),true);
 const triangle=e.construct('triangleFromPoints',sources)[0];assert.equal(triangle.type,'polygon');assert.deepEqual(plain(triangle.construction.sources),sources);assert.deepEqual(plain(triangle.vertices),points.map(({x,y})=>({x,y})));assert.equal(triangle.constructionValid,true);
 const data=plain(e.toJSON());assert.equal(data.version,3);assert.equal(data.constructionSchema,2);assert.deepEqual(plain(new MI.Engine(data).toJSON()),data);
 const rich=new MI.Engine({version:7,textSchema:1,objects:[...points,{id:'TXT',type:'text',x:0,y:0,textContent:{schema:1,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:null,paragraphs:[{id:'p1',align:'left',lineHeight:1.25,runs:[{id:'r1',kind:'text',text:'compatibiliteit',marks:{}}]}]}}]});rich.construct('triangleFromPoints',sources);const richData=plain(rich.toJSON());assert.equal(richData.version,7);assert.equal(richData.constructionSchema,2);assert.deepEqual(plain(new MI.Engine(richData).toJSON()),richData);
});
test('G-TRI1 follows the three source points, retains one identity and exports a polygon',()=>{
 const {e}=setup(),triangle=e.construct('triangleFromPoints',sources)[0],id=triangle.id;e.update('B',{x:8,y:0});
 assert.equal(e.get(id).id,id);assert.deepEqual(plain(e.get(id).vertices),[{x:0,y:0},{x:8,y:0},{x:1,y:3}]);
 for(const patch of [{vertices:[{x:0,y:0},{x:1,y:0},{x:0,y:1}]},{construction:null}])assert.throws(()=>e.update(id,patch));
 const svg=e.renderSVG();assert.match(svg,new RegExp('data-object-id="'+id+'"'));assert.match(svg,/<polygon\b/);
});

test('G-TRI1 degeneracy tracks current vertices, survives JSON roundtrip and recovers in place',()=>{
 const {MI,e}=setup(),triangle=e.construct('triangleFromPoints',sources)[0],id=triangle.id;
 e.update('C',{x:2,y:0});assert.equal(e.getConstructionInfo(id).reasonCode,'DEGENERATE_TRIANGLE');assert.equal(e.getConstructionInfo(id).valid,false);assert.deepEqual(plain(e.get(id).vertices),[{x:0,y:0},{x:4,y:0},{x:2,y:0}]);assert.equal(e.isDisplayed(id),false);
 const data=plain(e.toJSON()),loaded=new MI.Engine(data);assert.equal(loaded.getConstructionInfo(id).reasonCode,'DEGENERATE_TRIANGLE');assert.deepEqual(plain(loaded.get(id).vertices),[{x:0,y:0},{x:4,y:0},{x:2,y:0}]);
 loaded.update('C',{x:1,y:3});assert.equal(loaded.getConstructionInfo(id).reasonCode,'VALID');assert.equal(loaded.get(id).id,id);assert.equal(loaded.isDisplayed(id),true);
 loaded.update('C',{x:0,y:0});assert.equal(loaded.getConstructionInfo(id).reasonCode,'DEGENERATE_TRIANGLE');const coincident=new MI.Engine(plain(loaded.toJSON()));assert.equal(coincident.getConstructionInfo(id).reasonCode,'DEGENERATE_TRIANGLE');
});

test('G-TRI1 uses the inclusive scale-normalized 1e-12 degeneracy boundary',()=>{
 const {MI}=setup();
 for(const [height,status] of [[1e-12,'DEGENERATE_TRIANGLE'],[1e-12*(1-2**-10),'DEGENERATE_TRIANGLE'],[1e-12*(1+2**-10),null]]){
  const vertices=[{x:0,y:0},{x:1,y:0},{x:0,y:height}];assert.equal(MI.ConstructionService.triangleShapeStatus(vertices),status);
  const engine=new MI.Engine({objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:1,y:0},{id:'C',type:'point',x:0,y:height}]});
  if(status)assert.throws(()=>engine.construct('triangleFromPoints',sources));else assert.equal(engine.construct('triangleFromPoints',sources).length,1);
 }
});

test('G-TRI1 rejects repeated, missing, non-point and unauthorized source IDs atomically',()=>{
 const {MI,e}=setup();
 e.add({id:'P',type:'polygon',vertices:[{x:-2,y:-1},{x:-1,y:-1},{x:-1,y:0}]});const before=plain(e.toJSON());
 for(const refs of [[sources[0],sources[0],sources[2]],[sources[0],sources[1],{objectId:'missing'}]])assert.throws(()=>e.construct('triangleFromPoints',refs));
 assert.throws(()=>e.construct('triangleFromPoints',[sources[0],sources[1],{objectId:'P',part:'vertex',index:0}]));
 assert.deepEqual(plain(e.toJSON()),before);
 const bad=plain(before);bad.objects.push({id:'T',type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:1,y:3}]});assert.throws(()=>new MI.Engine(bad).construct('triangleFromPoints',[sources[0],sources[1],{objectId:'T'}]));
 const unknown=plain(before);unknown.version=3;unknown.constructionSchema=2;unknown.objects.push({id:'U',type:'polygon',vertices:[{x:0,y:0},{x:1,y:0},{x:0,y:1}],construction:{kind:'futureTriangleRecipe',sources:[{objectId:'A'}]}});assert.throws(()=>new MI.Engine(unknown));
 const {fixture}=require('./permission-fixtures.cjs'),policy=fixture('course',{parameters:{},allowedTools:['construct:triangleFromPoints'],createdObjectRules:{polygon:{read:true,display:true}},initialObjectRules:{A:{sourceTools:['construct:triangleFromPoints']},B:{sourceTools:['construct:triangleFromPoints']},C:{sourceTools:['construct:triangleFromPoints']}}});policy.initialDocument={objects:points};
 const session=MI.RuntimeSession.create(policy).session;assert.equal(session.engine.construct('triangleFromPoints',sources)[0].type,'polygon');policy.policy.initialObjectRules.C={};assert.throws(()=>MI.RuntimeSession.create(policy).session.engine.construct('triangleFromPoints',sources),error=>error.code==='MISSING_SOURCE_PERMISSION');
});

test('G-TRI1 semantic replay, history commands and existing M6a centers remain compatible',()=>{
 const {MI}=setup(),sequence=new MI.SemanticSequence({objects:points}),triangle=sequence.execute('construction.create',{toolId:'construct:triangleFromPoints',sources}).result[0];
 sequence.execute('object.setGeometry',{id:'B',fields:[{path:'x',value:8}]});assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())),plain(sequence.document));
 const engine=new MI.Engine(sequence.document),centers=['centroid','circumcenter','orthocenter'].map(kind=>engine.construct(kind,[{objectId:triangle.id}])[0]);assert.equal(centers.length,3);assert.ok(centers.every(center=>center.constructionValid));
 engine.update('C',{y:0});assert.ok(centers.every(center=>engine.getConstructionInfo(center.id).reasonCode==='SOURCE_INVALID'));engine.update('C',{y:3});assert.ok(centers.every(center=>engine.getConstructionInfo(center.id).valid));
 const old=new MI.Engine({objects:[{id:'T',type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:1,y:3}]}]}),snapshot=plain(old.toJSON());for(const kind of ['centroid','circumcenter','orthocenter'])assert.equal(old.construct(kind,[{objectId:'T'}]).length,1);assert.equal(snapshot.objects[0].type,'polygon');
});

