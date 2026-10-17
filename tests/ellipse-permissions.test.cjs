const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs'),{fixture}=require('./permission-fixtures.cjs');
const sources=[{objectId:'A'},{objectId:'B'}],toolId='construct:ellipseByFociAndSum';
const base={objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]};
function author(){const {MI}=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']),e=new MI.Engine(base),c=MI.AuthorCommands(e);return {MI,e,run:(op,p)=>c.execute(c.createCommand(op,p))};}
function restricted(profile='course',change=()=>{}){const {MI,e}=author();const linked=e.construct('ellipseByFociAndSum',sources,6)[0];e.add({id:'free',type:'ellipse',cx:10,cy:0,a:3,b:2,rotation:0});const f=fixture(profile);f.initialDocument=plain(e.toJSON());f.policy.parameters={};f.policy.allowedTools=[toolId];f.policy.initialObjectRules={A:{translate:true,sourceTools:[toolId]},B:{sourceTools:[toolId]}};f.policy.createdObjectRules={ellipse:{read:true,display:true,selectCanvas:true,selectList:true,snap:true,propertyFields:['name','style.fill']}};change(f,linked.id);const {session:s,owner}=MI.RuntimeSession.create(f);return {MI,s,owner,id:linked.id,run:(op,p)=>s.execute(s.createCommand(op,p))};}
function atomic(owner,fn,code){const before=plain(owner.inspect());assert.throws(fn,e=>!code||e.code===code);assert.deepEqual(plain(owner.inspect()),before);}

test('ellipse author commands require typed sumDistance, preserve recovery, locks and atomic failures',()=>{
 const {e,run}=author();const ellipse=run('construction.create',{toolId,sources,sumDistance:6}).result[0];
 run('construction.setSumDistance',{id:ellipse.id,sumDistance:10});assert.equal(e.get(ellipse.id).a,5);
 e.update(ellipse.id,{style:{fill:'#123456'}});assert.equal(e.get(ellipse.id).style.fill,'#123456');
 for(const payload of [{toolId,sources,parameter:6},{toolId,sources,sumDistance:6,parameter:0},{toolId,sources,sumDistance:'6'},{toolId,sources,sumDistance:4},{toolId:'construct:midpoint',sources,sumDistance:6}]){const before=plain(e.toJSON());assert.throws(()=>run('construction.create',payload));assert.deepEqual(plain(e.toJSON()),before);}
 for(const value of [0,-1,4,NaN,Infinity,'10']){const before=plain(e.toJSON());assert.throws(()=>run('construction.setSumDistance',{id:ellipse.id,sumDistance:value}));assert.deepEqual(plain(e.toJSON()),before);}
 assert.throws(()=>run('construction.setParameter',{id:ellipse.id,value:12}));
 assert.throws(()=>run('object.setGeometry',{id:ellipse.id,fields:[{path:'a',value:9}]}));
 e.update('B',{x:12});assert.equal(e.get(ellipse.id).constructionValid,false);run('construction.setSumDistance',{id:ellipse.id,sumDistance:14});assert.equal(e.get(ellipse.id).constructionValid,true);
 run('object.setLock',{ids:[ellipse.id],value:true});assert.throws(()=>run('construction.setSumDistance',{id:ellipse.id,sumDistance:16}),e=>e.code==='LOCKED');
});

test('ellipse semantic sequence replays typed creation, parameter edit, style and detach',()=>{
 const {MI}=author(),sequence=new MI.SemanticSequence(base);const id=sequence.execute('construction.create',{toolId,sources,sumDistance:6}).result[0].id;
 sequence.execute('construction.setSumDistance',{id,sumDistance:10});sequence.execute('object.setProperties',{ids:[id],fields:[{path:'name',value:'Ellipse'}]});sequence.execute('construction.detach',{ids:[id]});sequence.execute('object.setGeometry',{id,fields:[{path:'rotation',value:.5}]});
 assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())),plain(sequence.document));assert.equal(sequence.document.objects.find(o=>o.id===id).rotation,.5);
});

test('restricted ellipse creation requires tool and both source grants; geometry and parameters stay author-only',()=>{
 for(const profile of ['course','assessment']){const {s,owner,id,run}=restricted(profile);const made=run('construction.create',{toolId,sources,sumDistance:8}).result[0];assert.equal(made.construction.sumDistance,8);assert.equal(made.a,4);
  for(const [op,payload] of [['construction.setSumDistance',{id,sumDistance:10}],['construction.setInputs',{id,sources}],['construction.detach',{ids:[id]}],['construction.setParameter',{id,value:.5}]])atomic(owner,()=>run(op,payload),'MODE_DENIED');
  for(const path of ['cx','cy','a','b','rotation'])atomic(owner,()=>run('object.setGeometry',{id:'free',fields:[{path,value:1}]}),'MODE_DENIED');
  atomic(owner,()=>s.engine.update('free',{rotation:1}),'MODE_DENIED');
  assert.deepEqual(plain(s.getObjectCapabilities('free').geometryFields),[]);assert.equal(s.getObjectCapabilities('free').translate,false);
  run('object.setProperties',{ids:[made.id],fields:[{path:'style.fill',value:'#abcdef'}]});assert.equal(s.engine.get(made.id).style.fill,'#abcdef');
  const doc=s.engine.toJSON();assert.equal(doc.version,9);assert.equal(doc.ellipseSchema,1);assert.equal(doc.constructionSchema,6);assert.equal(doc.objects.find(o=>o.id===id).a,undefined);assert.equal(new (author().MI.Engine)(doc).get(id).a,3);
 }
 for(const change of [f=>{f.policy.allowedTools=[];},f=>{f.policy.initialObjectRules.B.sourceTools=[];}]){const {owner,run}=restricted('course',change);atomic(owner,()=>run('construction.create',{toolId,sources,sumDistance:8}));}
});

test('restricted projection hides ellipses when focus read/display/source rights or visibility are missing',()=>{
 for(const change of [f=>{f.policy.initialObjectRules.B.read=false;},f=>{f.policy.initialObjectRules.B.display=false;},f=>{f.policy.initialObjectRules.B.sourceTools=[];},f=>{f.initialDocument.objects.find(o=>o.id==='B').visible=false;}]){
  const {s,id}=restricted('course',change);assert.equal(s.engine.get(id),null);assert.equal(s.engine.getConstructionInfo(id),null);assert.equal(s.getObjectCapabilities(id).read,false);assert.equal(s.getObjectCapabilities(id).snap,false);
  const json=s.engine.toJSON();assert.ok(!json.objects.some(o=>o.id===id));assert.ok(!JSON.stringify(json).includes('ellipseByFociAndSum'));
 }
 const {s,id}=restricted('course',(f,id)=>{f.policy.initialObjectRules[id]={read:false};f.policy.initialObjectRules.free={read:false};});const json=s.engine.toJSON();assert.notEqual(json.version,9);assert.equal(json.ellipseSchema,undefined);assert.notEqual(json.constructionSchema,6);
});

test('ellipse policies cannot grant geometry, translation, rotation properties or learner parameters',()=>{
 for(const change of [f=>{f.policy.initialObjectRules.free={geometryFields:['a']};},f=>{f.policy.initialObjectRules.free={translate:true};},f=>{f.policy.initialObjectRules.free={propertyFields:['rotation']};},f=>{f.policy.parameters.e={targets:[{objectId:'free',fieldPath:'a'}],min:1,max:4,initialValue:3};},f=>{f.policy.createdObjectRules.ellipse.geometryFields=['a'];}])assert.throws(()=>restricted('course',change),e=>e.code==='INVALID_POLICY');
});

test('revoked focus permissions invalidate cached projections and preview handles; undo/redo recomputes ellipses',()=>{
 let policy;const {s,owner,id,run}=restricted('course',f=>{policy=plain(f.policy);});
 assert.equal(s.engine.get(id).a,3);
 const handle=s.begin(s.createCommand('object.translate',{ids:['A'],delta:{x:0,y:0}}));
 const preview=s.preview(handle,{ids:['A'],delta:{x:1,y:0}});assert.ok(preview.objects.some(o=>o.id===id));s.cancel(handle);
 run('object.translate',{ids:['A'],delta:{x:1,y:0}});assert.equal(s.engine.get(id).cx,2.5);
 run('history.undo',{});assert.equal(s.engine.get(id).cx,2);run('history.redo',{});assert.equal(s.engine.get(id).cx,2.5);
 const stale=s.begin(s.createCommand('object.translate',{ids:['A'],delta:{x:0,y:0}}));policy.initialObjectRules.B.sourceTools=[];owner.replacePolicy(policy);
 assert.equal(s.engine.get(id),null);assert.equal(s.engine.getConstructionInfo(id),null);assert.throws(()=>s.commit(stale,{ids:['A'],delta:{x:1,y:0}}),e=>e.code==='STALE_TRANSACTION');
 assert.ok(!s.engine.toJSON().objects.some(o=>o.id===id));
});

test('restricted indirect invalidity follows course/assessment rules and remains recoverable',()=>{
 const course=restricted();course.run('object.translate',{ids:['A'],delta:{x:11,y:0}});assert.equal(course.s.engine.get(course.id),null);
 assert.equal(course.owner.inspect().document.objects.find(o=>o.id===course.id).constructionValid,false);
 course.run('object.translate',{ids:['A'],delta:{x:-11,y:0}});assert.equal(course.s.engine.get(course.id).constructionValid,true);
 const assessment=restricted('assessment');atomic(assessment.owner,()=>assessment.run('object.translate',{ids:['A'],delta:{x:11,y:0}}),'WOULD_INVALIDATE');
 const frozen=restricted('course',(f,id)=>{f.policy.initialObjectRules[id]={indirectGeometry:'freeze'};});atomic(frozen.owner,()=>frozen.run('object.translate',{ids:['A'],delta:{x:1,y:0}}),'INDIRECT_FROZEN');
});

test('mixed ellipse, region, rich text, axis references and layers roundtrip through restricted JSON',()=>{
 const {MI,e}=author();const ellipse=e.construct('ellipseByFociAndSum',sources,6)[0];
 const polygon=e.add({type:'polygon',vertices:[{x:0,y:0},{x:2,y:0},{x:0,y:2}]});const region=e.construct('polygonRegion',[{objectId:polygon.id}])[0];
 e.construct('parallel',[{kind:'axis',frame:'cartesian',axis:'x'},{objectId:'A'}]);
 e.add({type:'text',x:0,y:0,textContent:{schema:1,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:null,paragraphs:[{id:'p',align:'left',lineHeight:1.25,runs:[{id:'r',kind:'text',text:'Mixed document',marks:{}}]}]}});
 e.createLayer('Scene');const f=fixture();f.initialDocument=plain(e.toJSON());f.policy.parameters={};f.policy.allowedTools=[];f.policy.initialObjectRules={A:{sourceTools:[toolId]},B:{sourceTools:[toolId]},[polygon.id]:{sourceTools:['construct:polygonRegion']}};
 const {session}=MI.RuntimeSession.create(f);const doc=session.engine.toJSON();assert.equal(doc.version,9);assert.equal(doc.ellipseSchema,1);assert.equal(doc.regionSchema,1);assert.equal(doc.textSchema,1);assert.equal(doc.layerSchema,1);assert.equal(doc.constructionSchema,6);
 const loaded=new MI.Engine(doc);assert.equal(loaded.get(ellipse.id).a,3);assert.equal(loaded.get(region.id).regionArea,2);assert.deepEqual(plain(loaded.toJSON()),plain(doc));
});

test('revoked ellipse sources redact dynamic text bindings as well as the curve',()=>{
 const {MI,e}=author();const ellipse=e.construct('ellipseByFociAndSum',sources,6)[0];e.update(ellipse.id,{name:'Private ellipse'});e.add({id:'caption',type:'text',x:0,y:0,text:'',textBinding:{schema:1,sourceId:ellipse.id,property:'name',prefix:'',suffix:'',precision:null}});
 const f=fixture();f.initialDocument=plain(e.toJSON());f.policy.parameters={};f.policy.allowedTools=[];f.policy.initialObjectRules={A:{sourceTools:[toolId]},B:{read:false}};const {session}=MI.RuntimeSession.create(f);
 const text=session.engine.get('caption');assert.equal(text.textBinding,null);assert.equal(text.text,'niet beschikbaar');assert.ok(!JSON.stringify(session.engine.model.objects).includes('Private ellipse'));assert.throws(()=>session.engine.toJSON(),e=>e.code==='PERMISSION_DENIED');
});
