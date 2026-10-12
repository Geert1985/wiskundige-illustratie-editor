const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),reference=require('./fixtures/expression-reference.json');
async function run(page){
 for(const file of ['expression-numeric.js','expression-ast.js','expression-engine.js','expression-sources.js','tests/expression-cases.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
 const report=await page.evaluate(reference=>{
  const MI=FZI.MathIllustration,E=MI.ExpressionEngine,N=MI.ExpressionNumeric,A=MI.ExpressionAST,failed=[];
  const checks=ExpressionContractCases.cases(E,N,A);
  for(const c of checks)try{c.run();}catch(error){failed.push({id:c.id,error:error.message});}
  const buffer=new ArrayBuffer(8),view=new DataView(buffer),bits=value=>{view.setFloat64(0,value);return view.getBigUint64(0).toString(16).padStart(16,'0');};
  let roundPassed=0,transcendentalPassed=0;
  for(const f of reference.rounds){try{const value=N.quantize(f.value,f.digits,f.factor);if(f.code||bits(value)!==f.expectedBits)throw Error('round reference mismatch');roundPassed++;}catch(error){if(f.code&&error.code===f.code)roundPassed++;else failed.push({id:'oracle-round',error:error.message});}}
  for(const f of reference.transcendentals){try{
   const value=E.evaluate({kind:'call',name:f.function,args:[{kind:'number',value:f.value}]}).quantity.value;
   if(f.code)throw Error('missing underflow');const actual=BigInt('0x'+bits(value)),target=BigInt('0x'+f.expectedBits),difference=actual>target?actual-target:target-actual;
   view.setBigUint64(0,target);const expected=view.getFloat64(0);
   if(difference>2n||(value===0)!==(expected===0)||(value!==0&&Math.abs(value)<N.NORMAL_MIN)!==(expected!==0&&Math.abs(expected)<N.NORMAL_MIN))throw Error('transcendental reference/classification mismatch');
   transcendentalPassed++;
  }catch(error){if(f.code&&error.code===f.code)transcendentalPassed++;else failed.push({id:'oracle-'+f.function,error:error.message});}}
  let adapterPassed=0;
  const check=(name,fn)=>{try{fn();adapterPassed++;}catch(error){failed.push({id:name,error:error.message});}};
  const must=(value)=>{if(!value)throw Error('adapter invariant');};
  const denied=fn=>{let error;try{fn();}catch(e){error=e;}must(error?.code==='SOURCE_UNAVAILABLE'&&!/Secret/.test(error.message));};
  const doc=()=>({meta:{measurement:{schema:1,unit:'cm',scale:2,precision:2},angleMeasurement:{schema:1,unit:'rad',precision:3}},objects:[{id:'C',type:'circle',cx:0,cy:0,r:2,name:'Secret circle'},{id:'P',type:'point',x:3,y:-4},{id:'A',type:'angle',vertices:[{x:1,y:0},{x:0,y:0},{x:0,y:1}]}]});
  const options=(d=doc(),rule={})=>({actorId:'student',assessmentKind:'practice',initialDocument:d,policy:{schema:2,activityId:'t5a',revision:'1',profile:'course',defaultCapabilities:{read:true,display:true},initialObjectRules:{C:{geometryFields:['r'],delete:true,textSourceProperties:['radius','area','perimeter'],...rule},P:{textSourceProperties:['x','y']},A:{textSourceProperties:['angle']}},createdObjectRules:{},allowedTools:[],document:{undo:true,redo:true,exportJSON:true,exportSVG:true},parameters:{},limits:{maxObjects:1000,maxCommandBytes:65536,maxBatchObjects:100,maxDependencyDepth:32}}});
  const source=(id='C',property='radius')=>({kind:'source',sourceId:id,property});
  check('adapter-empty-author',()=>{const engine=new MI.Engine({objects:[]}),before=JSON.stringify(engine.toJSON());must(MI.ExpressionSources.createAuthor(engine).evaluate(E.parse('2+3*4')).quantity.value===14);must(JSON.stringify(engine.toJSON())===before);});
  check('adapter-revision-history-export',()=>{
   const {session,owner}=MI.RuntimeSession.create(options()),adapter=MI.ExpressionSources.createRestricted(session),before=JSON.stringify(owner.inspect()),json=JSON.stringify(session.engine.toJSON()),svg=session.engine.renderSVG();
   must(adapter.evaluate(source()).quantity.value===.04);must(JSON.stringify(owner.inspect())===before);must(JSON.stringify(session.engine.toJSON())===json&&session.engine.renderSVG()===svg);
   const angle=source('A','angle'),digits={kind:'binary',op:'*',left:{kind:'number',value:2},right:{kind:'binary',op:'/',left:angle,right:angle}};
   must(adapter.evaluate({kind:'call',name:'round',args:[{kind:'number',value:1.234},digits]}).quantity.value===1.23);
   session.engine.update('C',{r:3});must(adapter.evaluate(source()).quantity.value===.06);session.execute(session.createCommand('history.undo'));must(adapter.evaluate(source()).quantity.value===.04);session.execute(session.createCommand('history.redo'));must(adapter.evaluate(source()).quantity.value===.06);
  });
  check('adapter-permissions',()=>{for(const rule of [{read:false},{display:false},{textSourceProperties:[]}]){const {session}=MI.RuntimeSession.create(options(doc(),rule));denied(()=>MI.ExpressionSources.createRestricted(session).evaluate(source()));}});
  check('adapter-hidden-locked',()=>{let d=doc();d.objects[0].visible=false;let {session}=MI.RuntimeSession.create(options(d));denied(()=>MI.ExpressionSources.createRestricted(session).evaluate(source()));d=doc();d.objects[0].locked=true;({session}=MI.RuntimeSession.create(options(d)));must(MI.ExpressionSources.createRestricted(session).evaluate(source()).quantity.value===.04);});
  check('adapter-hidden-layer',()=>{const d=doc();d.version=5;d.layerSchema=1;d.layers=[{id:'hidden',name:'Hidden',visible:false,members:d.objects.map(o=>o.id)}];const {session}=MI.RuntimeSession.create(options(d));denied(()=>MI.ExpressionSources.createRestricted(session).evaluate(source()));});
  check('adapter-policy-revocation',()=>{const input=options(),{session,owner}=MI.RuntimeSession.create(input),adapter=MI.ExpressionSources.createRestricted(session);must(adapter.evaluate(source()).quantity.value===.04);const next=JSON.parse(JSON.stringify(input.policy));next.initialObjectRules.C.textSourceProperties=[];owner.replacePolicy(next);denied(()=>adapter.evaluate(source()));owner.dispose();denied(()=>adapter.evaluate(source()));});
  check('adapter-source-deletion',()=>{const {session}=MI.RuntimeSession.create(options()),adapter=MI.ExpressionSources.createRestricted(session);session.engine.remove('C');denied(()=>adapter.evaluate(source()));session.execute(session.createCommand('history.undo'));must(adapter.evaluate(source()).quantity.value===.04);});
  check('adapter-directed-angle',()=>{const d=doc();d.objects[2].vertices[2].y=-1;d.objects[2].angleSettings={schema:1,frame:'cartesian',mode:'directed',unit:'deg',precision:2,showArc:true};const engine=new MI.Engine(d),adapter=MI.ExpressionSources.createAuthor(engine);must(Math.abs(adapter.evaluate(source('A','angle')).quantity.value-3*Math.PI/2)<1e-12);});
  check('adapter-author-spoof',()=>{const {session}=MI.RuntimeSession.create(options());let error;try{MI.ExpressionSources.createAuthor(session.engine);}catch(e){error=e;}must(error?.code==='INVALID_ARGUMENT');});
  check('adapter-own-underflow',()=>{const d=doc();d.meta.measurement.scale=Number.MIN_VALUE;const {session}=MI.RuntimeSession.create(options(d));let error;try{MI.ExpressionSources.createRestricted(session).evaluate(source());}catch(e){error=e;}must(error?.code==='NUMERIC_UNDERFLOW');});
  check('adapter-legacy-dimensionless',()=>{const d=doc();delete d.meta.measurement;let e=new MI.Engine(d),a=MI.ExpressionSources.createAuthor(e);must(JSON.stringify(a.evaluate(source()).quantity.dimension)==='[0,1,0]');d.meta.measurement={schema:1,unit:'dimensionless',scale:2,precision:2};e=new MI.Engine(d);a=MI.ExpressionSources.createAuthor(e);must(JSON.stringify(a.evaluate(source()).quantity.dimension)==='[0,0,0]');});
  check('adapter-accessors',()=>{const {session}=MI.RuntimeSession.create(options());let calls=0;must(session.getExpressionSource({get sourceId(){calls++;return 'C';},property:'radius'})===null);must(calls===0);});
  check('adapter-invalid-source',()=>{const engine=new MI.Engine({objects:[{id:'O',type:'point',x:0,y:0},{id:'Q',type:'point',x:3,y:4}]}),circle=engine.construct('circleByCenterPoint',[{objectId:'O'},{objectId:'Q'}])[0],adapter=MI.ExpressionSources.createAuthor(engine);must(adapter.evaluate(source(circle.id)).quantity.value===5);engine.update('Q',{x:0,y:0});denied(()=>adapter.evaluate(source(circle.id)));engine.update('Q',{x:6,y:8});must(adapter.evaluate(source(circle.id)).quantity.value===10);});
  check('adapter-stale-snapshot',()=>{for(const kind of ['policy','revision']){const input=options(),{session,owner}=MI.RuntimeSession.create(input),adapter=MI.ExpressionSources.createRestricted(session),original=MI.RuntimeSession.prototype.getExpressionSource;MI.RuntimeSession.prototype.getExpressionSource=function(binding){const value=original.call(this,binding);if(kind==='revision')session.engine.update('C',{r:3});else{const next=JSON.parse(JSON.stringify(input.policy));next.initialObjectRules.C.textSourceProperties=[];owner.replacePolicy(next);}return value;};try{denied(()=>adapter.evaluate(source()));}finally{MI.RuntimeSession.prototype.getExpressionSource=original;}}});
  return {contract:{total:checks.length,passed:checks.length-failed.filter(f=>/^[ARUO]\d/.test(f.id)).length},roundReference:{total:reference.rounds.length,passed:roundPassed},transcendentalReference:{total:reference.transcendentals.length,passed:transcendentalPassed},adapter:{total:14,passed:adapterPassed},failed,userAgent:navigator.userAgent};
 },reference);
 assert.deepEqual(report.failed,[],JSON.stringify(report.failed));
 return report;
}
module.exports=run;
if(require.main===module){
 const http=require('node:http'),{chromium}=require('playwright');
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
 (async()=>{let browser;try{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();await page.route('https://**',route=>route.abort());await page.goto(`http://127.0.0.1:${server.address().port}/editor.html`,{waitUntil:'domcontentloaded'});const report=await run(page);report.browserVersion=browser.version();fs.mkdirSync(path.join(root,'test-results'),{recursive:true});fs.writeFileSync(path.join(root,'test-results','t5a-edge.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));}catch(error){console.error(error);process.exitCode=1;}finally{if(browser)await browser.close();server.close();}})();
}
