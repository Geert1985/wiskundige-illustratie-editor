const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');
test('directed sectors and segments pass the semantic command boundary and follow A to B',()=>{
 const {MI}=runtime(['model.js','renderer.js','index.js','semantic-sequence.js']);
 const base={objects:[{id:'C',type:'circle',cx:0,cy:0,r:2},{id:'A',type:'point',x:2,y:0},{id:'B',type:'point',x:0,y:2}]};
 for(const kind of ['circleSectorRegion','circleSegmentRegion']){
  const seq=new MI.SemanticSequence(base),result=seq.execute('construction.create',{toolId:'construct:'+kind,sources:['C','A','B'].map(objectId=>({objectId})),extent:'directed'});
  const id=seq.document.objects.find(o=>o.type==='region').id;
  assert.equal(seq.document.objects.find(o=>o.id===id).construction.extent,'directed');
  for(const degrees of [90,180,240,300,179.99,180.01,359.99,.01]){
   const theta=degrees*Math.PI/180;
   seq.execute('object.setGeometry',{id:'B',fields:[{path:'x',value:2*Math.cos(theta)},{path:'y',value:2*Math.sin(theta)}]});
   const e=new MI.Engine(seq.document),r=e.get(id);
   assert.ok(Math.abs(r.regionGeometry.sweep-theta)<1e-12);
   assert.ok(Math.abs(r.regionArea-(kind==='circleSectorRegion'?2*theta:2*(theta-Math.sin(theta))))<1e-12);
   e.update(id,{areaDisplay:{visible:true,mode:'equation',precision:2,position:{mode:'auto'}}});assert.match(e.renderSVG(),/A =/);
   const radius=kind==='circleSectorRegion'?1:1.99999999;
   for(const source of ['C','A','B'])e.update(source,{visible:false});
   assert.equal(e.selectAt(radius*Math.cos(theta/2),radius*Math.sin(theta/2),{transform:new MI.CoordinateTransform(e.renderer),tolerancePx:.01})?.object.id,id);
   assert.deepEqual(plain(new MI.Engine(e.toJSON()).toJSON()),plain(e.toJSON()));
   assert.deepEqual(plain(MI.SemanticSequence.replay(seq.toJSON())),plain(seq.document));
  }
  seq.execute('object.setGeometry',{id:'B',fields:[{path:'x',value:2},{path:'y',value:0}]});
  assert.equal(new MI.Engine(seq.document).get(id).regionStatus,'DEGENERATE_REGION');
  const e=new MI.Engine(base),forward=e.construct(kind,['C','A','B'].map(objectId=>({objectId})))[0],reverse=e.construct(kind,['C','B','A'].map(objectId=>({objectId})))[0];
  assert.ok(Math.abs(forward.regionGeometry.sweep+reverse.regionGeometry.sweep-2*Math.PI)<1e-12);
  const commands=MI.AuthorCommands(e),before=plain(e.toJSON());
  for(const extent of ['minor','major']){
   commands.execute(commands.createCommand('construction.setExtent',{id:forward.id,extent}));
   assert.equal(e.get(forward.id).construction.extent,extent);
   const saved=plain(e.toJSON());assert.deepEqual(plain(new MI.Engine(saved).toJSON()),saved);
  }
  assert.throws(()=>commands.execute(commands.createCommand('construction.setExtent',{id:forward.id,extent:'invalid'})));
 }
});

test('restricted directed creation retains source grants and denies mode changes and revoked sources',()=>{
 const {MI}=runtime(),{fixture}=require('./permission-fixtures.cjs'),f=fixture();
 f.initialDocument={objects:[{id:'C',type:'circle',cx:0,cy:0,r:2},{id:'A',type:'point',x:2,y:0},{id:'B',type:'point',x:0,y:2}]};
 f.policy.initialObjectRules={};f.policy.parameters={};f.policy.allowedTools.push('construct:circleSectorRegion');f.policy.createdObjectRules.region={read:true,display:true,selectCanvas:true,selectList:true};
 for(const id of ['C','A','B'])f.policy.initialObjectRules[id]={read:true,display:true,sourceTools:['construct:circleSectorRegion']};
 const {session,owner}=MI.RuntimeSession.create(f),r=session.engine.construct('circleSectorRegion',['C','A','B'].map(objectId=>({objectId})),undefined,'directed')[0];
 assert.equal(r.construction.extent,'directed');assert.equal(session.engine.toJSON().objects.find(o=>o.id===r.id).construction.extent,'directed');
 const before=plain(owner.inspect());assert.throws(()=>session.execute(session.createCommand('construction.setExtent',{id:r.id,extent:'minor'})),err=>err.code==='MODE_DENIED');assert.deepEqual(plain(owner.inspect()),before);
 const policy=plain(f.policy);policy.initialObjectRules.B.sourceTools=[];owner.replacePolicy(policy);
 assert.equal(session.engine.get(r.id),null);assert.equal(session.engine.toJSON().objects.some(o=>o.id===r.id),false);
});
