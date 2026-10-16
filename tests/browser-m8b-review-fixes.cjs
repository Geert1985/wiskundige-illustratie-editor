const assert=require('node:assert/strict');
module.exports=async page=>{
 const result=await page.evaluate(()=>{
  const MI=FZI.MathIllustration,engine=new MI.Engine({type:'geometry',version:2,objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0}]}),para=engine.construct('parallelogramBySideAngle',[{objectId:'A'},{objectId:'B'}],undefined,undefined,{sideLength:3,signedAngle:Math.PI/3})[0];
  engine.update(para.id,{measurements:{schema:1,values:{}}});const document=engine.toJSON(),rules=Object.fromEntries(document.objects.map(o=>[o.id,{read:true,display:true,selectCanvas:true,selectList:true,...(o.id==='B'?{translate:true}:{})}])),create=hideB=>MI.RuntimeSession.create({actorId:'student',assessmentKind:'practice',initialDocument:document,policy:{schema:1,activityId:'m8b-review',revision:'1',profile:'course',defaultCapabilities:{read:true,display:true,selectCanvas:true,selectList:true},initialObjectRules:{...rules,...(hideB?{B:{...rules.B,read:false,display:false}}:{})},createdObjectRules:{},allowedTools:[],document:{exportJSON:true},parameters:{},limits:{maxObjects:100,maxCommandBytes:65536,maxBatchObjects:100,maxDependencyDepth:32}}}).session;
  let stage='create-session';try{
   const session=create(false);stage='export-valid';const exported=session.execute(session.createCommand('document.exportJSON')).result;
   stage='hidden-source';const hidden=create(true);let deniedCode=null;try{hidden.execute(hidden.createCommand('document.exportJSON'));}catch(error){deniedCode=error.code;}
   stage='invalidate-source';session.execute(session.createCommand('object.translate',{ids:['B'],delta:{x:-4,y:0}}));
   stage='project-invalid';const invalidProjection=session.engine.get(para.id);
   stage='export-invalid';const invalidJSON=session.execute(session.createCommand('document.exportJSON')).result;
   stage='find-invalid-object';const invalidExport=invalidJSON.objects.find(o=>o.id===para.id);
   stage='roundtrip-invalid';const roundtrip=new MI.Engine(invalidJSON);
   stage='restore-source';session.execute(session.createCommand('object.translate',{ids:['B'],delta:{x:4,y:0}}));const recovered=session.engine.get(para.id);
   return {schema:exported.constructionSchema,version:exported.version,measurementSchema:exported.measurementSchema,sourceIds:exported.objects.find(o=>o.id===para.id).construction.sources.map(s=>s.objectId),hiddenSourceDenied:deniedCode==='PERMISSION_DENIED',invalidProjectionHasVertices:'vertices'in invalidProjection,invalidExportHasVertices:'vertices'in invalidExport,invalidRoundtripHasVertices:'vertices'in roundtrip.get(para.id),invalidFlag:invalidExport.constructionValid,recovered:recovered.constructionValid&&recovered.vertices.length===4&&recovered.construction.kind==='parallelogramBySideAngle'};
  }catch(error){return {failure:stage+':'+error.code+':'+error.message,stack:error.stack};}
 });
 assert.equal(result.failure,undefined,JSON.stringify(result));assert.equal(result.schema,8);assert.equal(result.version,10);assert.equal(result.measurementSchema,1);assert.deepEqual(result.sourceIds,['A','B']);assert.equal(result.hiddenSourceDenied,true);assert.equal(result.invalidProjectionHasVertices,false);assert.equal(result.invalidExportHasVertices,false);assert.equal(result.invalidRoundtripHasVertices,false);assert.equal(result.invalidFlag,false);assert.equal(result.recovered,true);
 return {restrictedSchema8AndMeasurementV10:'passed',hiddenSourceFailClosed:'passed',invalidGeometryRedaction:'passed',automaticRecovery:'passed'};
};
