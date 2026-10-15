const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs'),{fixture}=require('./permission-fixtures.cjs');
const refs=(...ids)=>ids.map(objectId=>({objectId})),kind='ellipseByFociAndPoint',toolId='construct:ellipseByFociAndPoint';
function setup(){const MI=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']).MI,e=new MI.Engine({objects:[{id:'F1',type:'point',x:-3,y:0},{id:'F2',type:'point',x:3,y:0},{id:'Q',type:'point',x:0,y:4}]});return {MI,e};}
function equation(point,f1,f2){return Math.hypot(point.x-f1.x,point.y-f1.y)+Math.hypot(point.x-f2.x,point.y-f2.y);}

test('ellipseByFociAndPoint derives S through the shared geometry resolver for rotated, horizontal and circular cases',()=>{
 const {MI}=setup(),f1={type:'point',x:-3,y:0},f2={type:'point',x:3,y:0};
 for(const q of [{type:'point',x:0,y:4},{type:'point',x:3,y:4},{type:'point',x:0,y:-4}]){const result=MI.EllipseGeometry.resolve({kind},[f1,f2,q]);assert.equal(result.reasonCode,'VALID');assert.equal(2*result.geometry.a,equation(q,f1,f2));assert.ok(result.geometry.b>0);}
 const circle=MI.EllipseGeometry.resolve({kind},[{type:'point',x:2,y:2},{type:'point',x:2,y:2},{type:'point',x:5,y:6}]);assert.equal(circle.reasonCode,'VALID');assert.equal(circle.geometry.rotation,0);assert.equal(circle.geometry.a,5);
 const rotated=MI.EllipseGeometry.resolve({kind},[{type:'point',x:0,y:-3},{type:'point',x:0,y:3},{type:'point',x:4,y:0}]);assert.equal(rotated.reasonCode,'VALID');assert.equal(rotated.geometry.rotation,Math.PI/2);assert.equal(rotated.geometry.a,5);assert.equal(rotated.geometry.b,4);
 for(const q of [{type:'point',x:0,y:0},{type:'point',x:-3,y:0},{type:'point',x:NaN,y:1},{type:'point',x:1e13,y:0}])assert.notEqual(MI.EllipseGeometry.resolve({kind},[f1,f2,q]).reasonCode,'VALID');
});

test('three full point sources persist in schema 7, follow Q and foci, recover without stale geometry, and retain pointOnEllipse p',()=>{
 const {MI,e}=setup(),ellipse=e.construct(kind,refs('F1','F2','Q'))[0],p=e.construct('pointOnEllipse',[{objectId:ellipse.id}],.23)[0];
 assert.equal(ellipse.construction.sumDistance,undefined);assert.deepEqual(plain(ellipse.construction.sources),refs('F1','F2','Q'));assert.ok(Math.abs(equation(e.get('Q'),e.get('F1'),e.get('F2'))-2*ellipse.a)<1e-12);
 const before=plain(e.toJSON()),loaded=new MI.Engine(before);assert.equal(before.version,9);assert.equal(before.ellipseSchema,1);assert.equal(before.constructionSchema,7);assert.deepEqual(plain(loaded.toJSON()),before);
 e.update('Q',{x:1,y:5});assert.ok(Math.abs(e.get(ellipse.id).a-ellipse.a)>1e-3);assert.equal(e.get(p.id).construction.parameter,.23);assert.ok(Math.abs(equation(e.get(p.id),e.get('F1'),e.get('F2'))-equation(e.get('Q'),e.get('F1'),e.get('F2')))<1e-8);
 e.update('F1',{x:-4,y:1});assert.equal(e.get(p.id).construction.parameter,.23);assert.ok(Math.abs(equation(e.get('Q'),e.get('F1'),e.get('F2'))-2*e.get(ellipse.id).a)<1e-10);e.update('F2',{x:4,y:-1});assert.equal(e.get(p.id).construction.parameter,.23);assert.ok(Math.abs(equation(e.get('Q'),e.get('F1'),e.get('F2'))-2*e.get(ellipse.id).a)<1e-10);
 e.update('Q',{x:0,y:0});assert.equal(e.get(ellipse.id).id,ellipse.id);assert.equal(e.get(ellipse.id).constructionValid,false);assert.equal('a'in e.get(ellipse.id),false);assert.equal(e.get(p.id).constructionValid,false);assert.equal('x'in e.get(p.id),false);
 e.update('Q',{x:0,y:4});assert.equal(e.get(ellipse.id).constructionValid,true);assert.equal(e.get(p.id).constructionValid,true);assert.equal(e.get(p.id).construction.parameter,.23);
 const legacy=e.construct('ellipseByFociAndSum',refs('F1','F2'),10)[0],mixed=plain(e.toJSON());assert.equal(mixed.constructionSchema,7);assert.equal(mixed.objects.find(o=>o.id===legacy.id).construction.sumDistance,10);assert.equal(new MI.Engine(mixed).get(legacy.id).a,5);
});

test('new control point imports and source rebinding reject direct or indirect cycles atomically',()=>{
 const {MI,e}=setup(),ellipse=e.construct(kind,refs('F1','F2','Q'))[0],p=e.construct('pointOnEllipse',[{objectId:ellipse.id}],.4)[0],before=plain(e.toJSON());
 assert.throws(()=>e.update(ellipse.id,{construction:{kind,sources:refs('F1','F2',p.id)}}),/Cyclische constructie/i);assert.deepEqual(plain(e.toJSON()),before);
 const cyclic=plain(before);cyclic.objects.find(o=>o.id===ellipse.id).construction.sources[2]={objectId:p.id};assert.throws(()=>new MI.Engine(cyclic),/Cyclische constructie/i);
 for(const malformed of [data=>{data.constructionSchema=6;},data=>{data.objects.find(o=>o.id===ellipse.id).construction.sumDistance=10;},data=>{data.constructionSchema=8;}]){const data=plain(before);malformed(data);assert.throws(()=>new MI.Engine(data));}
});

test('free Q and ellipse are one author command, atomic on failure, undoable as one semantic step, and replay deterministically',()=>{
 const {MI}=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']);
 const base={objects:[{id:'F1',type:'point',x:-3,y:0},{id:'F2',type:'point',x:3,y:0}]},engine=new MI.Engine(base),commands=MI.AuthorCommands(engine),run=(op,payload)=>commands.execute(commands.createCommand(op,payload));
 const result=run('construction.create',{toolId,sources:refs('F1','F2'),controlPoint:{x:0,y:4}}).result;assert.deepEqual(plain(result.map(o=>o.type)),['point','ellipse']);const [q,ellipse]=result,after=plain(engine.toJSON());assert.equal(after.constructionSchema,7);assert.deepEqual(plain(ellipse.construction.sources),refs('F1','F2',q.id));
 const failed=()=>run('construction.create',{toolId,sources:refs('F1','F2'),controlPoint:{x:0,y:0}});assert.throws(failed);assert.deepEqual(plain(engine.toJSON()),after);
 const sequence=new MI.SemanticSequence(base);const seqResult=sequence.execute('construction.create',{toolId,sources:refs('F1','F2'),controlPoint:{x:0,y:4}}).result;assert.deepEqual(plain(seqResult.map(o=>o.type)),['point','ellipse']);assert.deepEqual(plain(MI.SemanticSequence.replay(sequence.toJSON())),plain(sequence.document));
 const policy=fixture('course');policy.initialDocument=base;policy.policy.parameters={};policy.policy.allowedTools=[toolId,'create:point'];policy.policy.initialObjectRules={F1:{sourceTools:[toolId]},F2:{sourceTools:[toolId]}};policy.policy.createdObjectRules.point.sourceTools=[toolId];policy.policy.createdObjectRules.ellipse={read:true,display:true,selectCanvas:true,selectList:true};const {session}=MI.RuntimeSession.create(policy),create=payload=>session.execute(session.createCommand('construction.create',payload));
 const made=create({toolId,sources:refs('F1','F2'),controlPoint:{x:0,y:4}}).result;assert.equal(session.engine.model.objects.length,4);session.execute(session.createCommand('history.undo',{}));assert.deepEqual(plain(session.engine.model.objects.map(o=>o.id)),['F1','F2']);session.execute(session.createCommand('history.redo',{}));assert.deepEqual(plain(session.engine.model.objects.map(o=>o.id)),['F1','F2',...plain(made.map(o=>o.id))]);
});

test('restricted mode permits existing Q with source grants but never creates Q without create:point',()=>{
 const control={id:'Q',type:'point',x:0,y:4},base={type:'geometry',objects:[{id:'F1',type:'point',x:-3,y:0},{id:'F2',type:'point',x:3,y:0},control]},f=fixture('course');f.initialDocument=base;f.policy.parameters={};f.policy.allowedTools=[toolId];f.policy.initialObjectRules={F1:{sourceTools:[toolId]},F2:{sourceTools:[toolId]},Q:{sourceTools:[toolId]}};f.policy.createdObjectRules.ellipse={read:true,display:true,selectCanvas:true,selectList:true};
 const {MI}=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']),{session,owner}=MI.RuntimeSession.create(f),run=(payload)=>session.execute(session.createCommand('construction.create',payload)),before=plain(owner.inspect());
 assert.throws(()=>run({toolId,sources:refs('F1','F2'),controlPoint:{x:0,y:5}}),error=>error.code==='PERMISSION_DENIED');assert.deepEqual(plain(owner.inspect()),before);
 const existing=run({toolId,sources:refs('F1','F2','Q')}).result[0];assert.equal(existing.type,'ellipse');assert.deepEqual(plain(existing.construction.sources),refs('F1','F2','Q'));assert.equal(session.engine.toJSON().constructionSchema,7);
 const noPointSource=fixture('course');noPointSource.initialDocument={objects:[{id:'F1',type:'point',x:-3,y:0},{id:'F2',type:'point',x:3,y:0}]};noPointSource.policy.parameters={};noPointSource.policy.allowedTools=[toolId,'create:point'];noPointSource.policy.initialObjectRules={F1:{sourceTools:[toolId]},F2:{sourceTools:[toolId]}};noPointSource.policy.createdObjectRules.point={read:true,display:true,selectCanvas:true,selectList:true,sourceTools:[]};noPointSource.policy.createdObjectRules.ellipse={read:true,display:true,selectCanvas:true,selectList:true};const denied=MI.RuntimeSession.create(noPointSource),snapshot=plain(denied.owner.inspect());assert.throws(()=>denied.session.execute(denied.session.createCommand('construction.create',{toolId,sources:refs('F1','F2'),controlPoint:{x:0,y:4}})),error=>error.code==='MISSING_SOURCE_PERMISSION');assert.deepEqual(plain(denied.owner.inspect()),snapshot);
});

test('new recipe duplication detaches to an independent ellipse, preserves layers, and source deletion cascades dependents',()=>{
 const {e}=setup(),ellipse=e.construct(kind,refs('F1','F2','Q'))[0],p=e.construct('pointOnEllipse',[{objectId:ellipse.id}],.31)[0],shape={cx:ellipse.cx,cy:ellipse.cy,a:ellipse.a,b:ellipse.b,rotation:ellipse.rotation};
 const copy=e.duplicateMany([ellipse.id])[0];assert.equal(copy.type,'ellipse');assert.equal(copy.construction,undefined);assert.equal(copy.cx,shape.cx+.5);assert.equal(copy.cy,shape.cy+.5);for(const key of ['a','b','rotation'])assert.equal(copy[key],shape[key]);
 const layer=e.createLayer('Ellipse sources');e.assignLayer(['Q',ellipse.id],layer.id);const saved=plain(e.toJSON());assert.ok(saved.layers.find(l=>l.id===layer.id).members.includes('Q'));assert.ok(saved.layers.find(l=>l.id===layer.id).members.includes(ellipse.id));
 e.detachConstructions([ellipse.id]);assert.equal(e.get(ellipse.id).construction,undefined);assert.equal(e.get('Q').x,0);assert.equal(e.get('F1').x,-3);assert.equal(e.get('F2').x,3);assert.ok(Math.abs(e.get(ellipse.id).a-shape.a)<1e-12);assert.equal(e.get(p.id).construction.sources[0].objectId,ellipse.id);
 const {e:removed}=setup(),gone=removed.construct(kind,refs('F1','F2','Q'))[0],point=removed.construct('pointOnEllipse',[{objectId:gone.id}],.5)[0];removed.remove('Q');assert.equal(removed.get('Q'),null);assert.equal(removed.get(gone.id),null);assert.equal(removed.get(point.id),null);assert.ok(removed.get('F1')&&removed.get('F2'));
});
