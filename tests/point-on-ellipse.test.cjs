const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

function setup(data={objects:[]}){const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI;return {MI,e:new MI.Engine(data)};}
const ref=objectId=>({objectId});
function ellipseSource(e,id='E'){return e.add({id,type:'ellipse',cx:2,cy:-1,a:5,b:3,rotation:Math.PI/5});}
function focusEllipse(e,sum=10){e.add({id:'F1',type:'point',x:-3,y:0});e.add({id:'F2',type:'point',x:3,y:0});return e.construct('ellipseByFociAndSum',[ref('F1'),ref('F2')],sum)[0];}
function focusSum(point,foci){return Math.hypot(point.x-foci[0].x,point.y-foci[0].y)+Math.hypot(point.x-foci[1].x,point.y-foci[1].y);}

test('pointOnEllipse registers one whole ellipse source role and contextual placement plans',()=>{
 const {MI,e}=setup();const source=ellipseSource(e),service=MI.ConstructionService;
 assert.equal(service.contract('pointOnEllipse').resultType,'point');assert.deepEqual(plain(service.contract('pointOnEllipse').sourceRoles),['ellipse']);
 assert.deepEqual(plain(service.referencesForRole(source,'ellipse','pointOnEllipse')),[{objectId:'E'}]);
 assert.deepEqual(plain(service.contextualPlans(source,'pointOnEllipse')),[{key:'whole:0',mode:'placement',sourceIndex:0,sources:[{objectId:'E'}]}]);
 for(const bad of [{objectId:'E',part:'edge',index:0},{objectId:'E',part:null},{objectId:'missing'}])assert.throws(()=>e.construct('pointOnEllipse',[bad],.25));
 assert.throws(()=>service.validate({kind:'pointOnEllipse',sources:[ref('E')],parameter:.25,cache:{x:1,y:2}}),error=>error.code==='INVALID_REFERENCE');
 assert.throws(()=>service.validate({kind:'pointOnEllipse',sources:[{...ref('E'),part:'edge'}],parameter:.25}),error=>error.code==='INVALID_REFERENCE');
});

test('ellipse path parameters normalize to [0,1) and saved noncanonical values are rejected',()=>{
 const {MI,e}=setup();ellipseSource(e);const service=MI.ConstructionService;
 assert.equal(service.normaliseParameter('pointOnEllipse',1),0);assert.equal(service.normaliseParameter('pointOnEllipse',-0.25),0.75);assert.equal(service.normaliseParameter('pointOnEllipse',2.25),0.25);
 const point=e.construct('pointOnEllipse',[ref('E')],1)[0];assert.equal(point.construction.parameter,0);
 assert.ok(Math.hypot(point.x-(2+5*Math.cos(Math.PI/5)),point.y-(-1+5*Math.sin(Math.PI/5)))<1e-12);
 for(const value of [NaN,Infinity,-Infinity,'0.2'])assert.throws(()=>service.normaliseParameter('pointOnEllipse',value),error=>error.code==='INVALID_PARAMETER');
 const saved=plain(e.toJSON());assert.equal(saved.version,9);assert.equal(saved.ellipseSchema,1);assert.equal(saved.constructionSchema,6);
 const recipe=saved.objects.find(o=>o.id===point.id).construction;assert.deepEqual(recipe,{kind:'pointOnEllipse',sources:[ref('E')],parameter:0});
 for(const value of [-0.01,1,NaN]){const bad=plain(saved);bad.objects.find(o=>o.id===point.id).construction.parameter=value;assert.throws(()=>new MI.IllustrationModel(bad));}
 assert.deepEqual(plain(new MI.Engine(saved).toJSON()),saved);
});

test('parameterized points match independent focus-sum fixtures for horizontal, vertical and rotated ellipses',()=>{
 const {e}=setup();
 const horizontal=focusEllipse(e,10),top=e.construct('pointOnEllipse',[ref(horizontal.id)],.25)[0],foci=[e.get('F1'),e.get('F2')];
 assert.ok(Math.abs(top.x)<1e-12);assert.ok(Math.abs(top.y-4)<1e-12);assert.ok(Math.abs(focusSum(top,foci)-10)<1e-12);
 e.update('F1',{x:0,y:-3});e.update('F2',{x:0,y:3});
 const vertical=e.construct('pointOnEllipse',[ref(horizontal.id)],.25)[0];assert.ok(Math.abs(vertical.x+4)<1e-12);assert.ok(Math.abs(vertical.y)<1e-12);assert.ok(Math.abs(focusSum(vertical,[e.get('F1'),e.get('F2')])-10)<1e-12);
 const standalone=ellipseSource(e,'S'),p=e.construct('pointOnEllipse',[ref(standalone.id)],.125)[0],t=Math.PI/4,c=Math.cos(standalone.rotation),s=Math.sin(standalone.rotation);
 const expected={x:standalone.cx+standalone.a*Math.cos(t)*c-standalone.b*Math.sin(t)*s,y:standalone.cy+standalone.a*Math.cos(t)*s+standalone.b*Math.sin(t)*c};
 assert.ok(Math.hypot(p.x-expected.x,p.y-expected.y)<1e-12);
});

test('nearest projection uses Euclidean contour distance after rotation and retains the circular parameter seam',()=>{
 const {MI}=setup(),service=MI.ConstructionService,source={type:'ellipse',cx:11,cy:-7,a:8,b:3,rotation:Math.PI/4};
 for(const rotation of [0,Math.PI/4,Math.PI/2,3*Math.PI/4]){
  const t=.237,cx=11,cy=-7,a=8,b=3,cs=Math.cos(rotation),sn=Math.sin(rotation),ct=Math.cos(2*Math.PI*t),st=Math.sin(2*Math.PI*t);
  const q={x:cx+a*ct*cs-b*st*sn,y:cy+a*ct*sn+b*st*cs},dx=-a*st*cs-b*ct*sn,dy=-a*st*sn+b*ct*cs,len=Math.hypot(dx,dy),query={x:q.x-.2*dy/len,y:q.y+.2*dx/len};
  const def={...source,rotation},nearest=MI.EllipseGeometry.nearest(def,query),projected=service.projectParameter('pointOnEllipse',def,ref('E'),query);
  assert.ok(nearest);assert.ok(Math.abs(projected-t)<1e-8,`rotation=${rotation}, p=${projected}`);assert.ok(Math.abs(nearest.distance-.2)<1e-8);
 }
 const circle={type:'ellipse',cx:0,cy:0,a:5,b:5,rotation:0};assert.ok(Math.abs(service.projectParameter('pointOnEllipse',circle,ref('C'),{x:0,y:5})-.25)<1e-12);
 const thin={type:'ellipse',cx:0,cy:0,a:5,b:1e-6,rotation:.3},thinPoint=MI.EllipseGeometry.fromDefinition(thin).geometry.pointAt(.31),thinParameter=service.projectParameter('pointOnEllipse',thin,ref('T'),thinPoint);
 assert.ok(Math.abs(thinParameter-.31)<1e-7);
 const nearSeam={x:5*Math.cos(2*Math.PI*(1-1e-8)),y:4*Math.sin(2*Math.PI*(1-1e-8))};assert.ok(service.projectParameter('pointOnEllipse',{type:'ellipse',cx:0,cy:0,a:5,b:4,rotation:0},ref('E'),nearSeam)>.999999);
 const tieEllipse={type:'ellipse',cx:2,cy:-3,a:7,b:2,rotation:.41},tieA=MI.EllipseGeometry.nearest(tieEllipse,{x:2,y:-3}),tieB=MI.EllipseGeometry.nearest(tieEllipse,{x:2,y:-3});assert.deepEqual(tieA,tieB);
});

test('linked points preserve parameter and identity through source edits, invalidity, recovery, detach and cascade',()=>{
 const {e}=setup(),source=focusEllipse(e,10),point=e.construct('pointOnEllipse',[ref(source.id)],.25)[0],id=point.id;
 assert.ok(Math.abs(point.x)<1e-12);assert.ok(Math.abs(point.y-4)<1e-12);
 e.update('F1',{x:-4,y:1});assert.equal(e.get(id).construction.parameter,.25);assert.equal(e.get(id).id,id);assert.ok(Math.abs(focusSum(e.get(id),[e.get('F1'),e.get('F2')])-10)<1e-10);
 e.update('F1',{x:-3,y:0});e.update('F2',{x:12});assert.equal(e.get(source.id).constructionValid,false);assert.equal(e.get(id).constructionValid,false);
 assert.doesNotMatch(e.renderSVG(),new RegExp(`data-object-id="${id}"`));
 e.update('F2',{x:3});assert.equal(e.get(id).constructionValid,true);assert.equal(e.get(id).construction.parameter,.25);assert.equal(e.get(id).id,id);assert.ok(Math.abs(e.get(id).y-4)<1e-12);
 e.update(source.id,{locked:true});assert.equal(e.get(id).construction.parameter,.25);e.update(source.id,{locked:false});
 const detached=e.detachConstructions([id])[0];assert.equal(detached.id,id);assert.equal(detached.construction,undefined);assert.ok(Math.abs(detached.y-4)<1e-12);
 const other=e.construct('pointOnEllipse',[ref(source.id)],.5)[0];e.remove(source.id);assert.equal(e.get(other.id),null);assert.ok(e.get(id),'detached point survives source deletion');
});

test('parameter commands, JSON schema and semantic replay keep the point recipe canonical',()=>{
 const {MI}=setup(),sequence=new MI.SemanticSequence({version:9,ellipseSchema:1,objects:[{id:'E',type:'ellipse',cx:0,cy:0,a:5,b:4,rotation:.4}]});
 const point=sequence.execute('construction.create',{toolId:'construct:pointOnEllipse',sources:[ref('E')],parameter:.25}).result[0];
 sequence.execute('construction.setParameter',{id:point.id,value:1.25});assert.equal(sequence.document.objects.find(o=>o.id===point.id).construction.parameter,.25);
 const saved=plain(sequence.document);assert.equal(saved.version,9);assert.equal(saved.ellipseSchema,1);assert.equal(saved.constructionSchema,6);
 assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())),saved);
});

test('restricted creation rechecks tool and ellipse grants and redacts the point on source revocation',()=>{
 const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI,{fixture}=require('./permission-fixtures.cjs'),tool='construct:pointOnEllipse',initial={version:9,ellipseSchema:1,type:'geometry',meta:{title:'',description:''},objects:[{id:'E',type:'ellipse',cx:2,cy:-1,a:5,b:3,rotation:.3}]};
 const make=({allowed=true,source=true}={})=>{const f=fixture('course');f.initialDocument=initial;f.policy.parameters={};f.policy.allowedTools=allowed?[tool]:[];f.policy.initialObjectRules={E:{sourceTools:source?[tool]:[]}};f.policy.createdObjectRules.point={read:true,display:true,selectCanvas:true,selectList:true,translate:true,delete:true,snap:true};return {...MI.RuntimeSession.create(f),policy:f.policy};};
 const {session,owner,policy}=make(),run=(op,p)=>session.execute(session.createCommand(op,p)),point=run('construction.create',{toolId:tool,sources:[ref('E')],parameter:.125}).result[0];
 assert.equal(point.construction.kind,'pointOnEllipse');assert.equal(session.engine.toJSON().constructionSchema,6);assert.throws(()=>run('construction.setParameter',{id:point.id,value:.5}),error=>error.code==='MODE_DENIED');
 const before=plain(owner.inspect());for(const opts of [{allowed:false},{source:false}]){const blocked=make(opts);const snapshot=plain(blocked.owner.inspect());assert.throws(()=>blocked.session.execute(blocked.session.createCommand('construction.create',{toolId:tool,sources:[ref('E')],parameter:.25})));assert.deepEqual(plain(blocked.owner.inspect()),snapshot);}
 const revoked=plain(policy);revoked.initialObjectRules.E.sourceTools=[];owner.replacePolicy(revoked);
 assert.equal(session.engine.get(point.id),null);assert.equal(session.getObjectCapabilities(point.id).read,false);assert.ok(!JSON.stringify(session.engine.toJSON()).includes('pointOnEllipse'));assert.ok(!JSON.stringify(session.engine.renderSVG()).includes('data-point-placement'));
 assert.notDeepEqual(before,plain(owner.inspect()));
});
