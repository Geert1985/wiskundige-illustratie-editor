const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const {runtime,plain}=require('./helpers.cjs');
const services=['model.js','renderer.js','index.js','expression-numeric.js','expression-ast.js','expression-engine.js','expression-sources.js'];
const document=()=>({meta:{measurement:{schema:1,unit:'cm',scale:2,precision:2},angleMeasurement:{schema:1,unit:'rad',precision:3}},objects:[
 {id:'C',type:'circle',cx:0,cy:0,r:2,name:'Secret circle'},
 {id:'P',type:'point',x:3,y:-4},
 {id:'L',type:'line',x1:0,y1:0,x2:3,y2:4},
 {id:'A',type:'angle',vertices:[{x:1,y:0},{x:0,y:0},{x:0,y:1}]}
]});
const options=(d=document(),source={})=>({actorId:'student',assessmentKind:'practice',initialDocument:d,policy:{schema:2,activityId:'t5a',revision:'1',profile:'course',defaultCapabilities:{read:true,display:true},initialObjectRules:{C:{geometryFields:['r'],delete:true,textSourceProperties:['radius','perimeter','area'],...source},P:{textSourceProperties:['x','y']},L:{textSourceProperties:['length']},A:{textSourceProperties:['angle']}},createdObjectRules:{},allowedTools:[],document:{undo:true,redo:true,exportJSON:true,exportSVG:true},parameters:{},limits:{maxObjects:1000,maxCommandBytes:65536,maxBatchObjects:100,maxDependencyDepth:32}}});
function setup(d=document(),source={}){const {MI,context}=runtime(services),input=options(d,source),{session,owner}=MI.RuntimeSession.create(input);return {MI,context,session,owner,input,adapter:MI.ExpressionSources.createRestricted(session)};}
function ast(MI,id='C',property='radius'){return MI.ExpressionEngine.decode(JSON.stringify({schema:1,ast:{kind:'source',sourceId:id,property}}));}
const quantity=(r)=>plain(r.quantity);
test('Adapter A18/O13/O14: current raw geometry, SI scale once, squared area and signed coordinates',()=>{
 const {MI,session,owner,adapter}=setup(),before=plain(owner.inspect());
 assert.deepEqual(quantity(adapter.evaluate(ast(MI))),{value:.04,dimension:[1,0,0]});
 assert.deepEqual(quantity(adapter.evaluate(ast(MI,'P','y'))),{value:-.08,dimension:[1,0,0]});
 assert.deepEqual(quantity(adapter.evaluate(ast(MI,'L','length'))),{value:.1,dimension:[1,0,0]});
 assert.ok(Math.abs(adapter.evaluate(ast(MI,'C','area')).quantity.value-Math.PI*.04*.04)<1e-15);
 assert.ok(Math.abs(adapter.evaluate(ast(MI,'A','angle')).quantity.value-Math.PI/2)<1e-15);
 const angle={kind:'source',sourceId:'A',property:'angle'},digits={kind:'binary',op:'*',left:{kind:'number',value:2},right:{kind:'binary',op:'/',left:angle,right:angle}};
 const calculatedDigits=MI.ExpressionEngine.decode(JSON.stringify({schema:1,ast:{kind:'call',name:'round',args:[{kind:'number',value:1.234},digits]}}));
 assert.equal(adapter.evaluate(calculatedDigits).quantity.value,1.23);
 assert.deepEqual(plain(owner.inspect()),before);
 session.engine.update('C',{r:3});assert.equal(adapter.evaluate(ast(MI)).quantity.value,.06);
 session.execute(session.createCommand('history.undo'));assert.equal(adapter.evaluate(ast(MI)).quantity.value,.04);
 session.execute(session.createCommand('history.redo'));assert.equal(adapter.evaluate(ast(MI)).quantity.value,.06);
});
test('Adapter: physical unit variants, legacy abstract e/u, and dimensionless metadata',()=>{
 for(const [unit,expected,dimension] of [['mm',.004,[1,0,0]],['m',4,[1,0,0]],['km',4000,[1,0,0]],['e',4,[0,1,0]],['u',4,[0,1,0]],['dimensionless',4,[0,0,0]]]){
  const d=document();d.meta.measurement.unit=unit;const {MI,adapter}=setup(d);assert.deepEqual(quantity(adapter.evaluate(ast(MI))),{value:expected,dimension});
 }
 const d=document();delete d.meta.measurement;const {MI,adapter}=setup(d);assert.deepEqual(quantity(adapter.evaluate(ast(MI))),{value:2,dimension:[0,1,0]});
});
test('Adapter A19: read/display/property grants are all required; locked sources remain readable',()=>{
 for(const rule of [{read:false},{display:false},{textSourceProperties:[]}]){
  const {MI,session,adapter}=setup(document(),rule);assert.equal(session.getExpressionSource({sourceId:'C',property:'radius'}),null);
  assert.throws(()=>adapter.evaluate(ast(MI)),e=>e.code==='SOURCE_UNAVAILABLE'&&!e.message.includes('Secret'));
 }
 for(const change of ['locked','visible']){const d=document();d.objects[0][change]=change==='locked';const {MI,adapter}=setup(d);if(change==='locked')assert.equal(adapter.evaluate(ast(MI)).quantity.value,.04);else assert.throws(()=>adapter.evaluate(ast(MI)),e=>e.code==='SOURCE_UNAVAILABLE');}
});
test('Adapter A19: hidden document layers also deny display',()=>{
 const d=document();d.version=5;d.layerSchema=1;d.layers=[{id:'layer',name:'Hidden',visible:false,members:d.objects.map(o=>o.id)}];
 const {MI,adapter}=setup(d);assert.throws(()=>adapter.evaluate(ast(MI)),e=>e.code==='SOURCE_UNAVAILABLE');
});
test('Adapter U17: policy revocation and disposal invalidate every subsequent evaluation',()=>{
 const {MI,adapter,owner,input}=setup();assert.equal(adapter.evaluate(ast(MI)).quantity.value,.04);
 const next=plain(input.policy);next.initialObjectRules.C.textSourceProperties=[];owner.replacePolicy(next);
 assert.throws(()=>adapter.evaluate(ast(MI)),e=>e.code==='SOURCE_UNAVAILABLE');
 owner.replacePolicy(input.policy);assert.equal(adapter.evaluate(ast(MI)).quantity.value,.04);
 owner.dispose();assert.throws(()=>adapter.evaluate(ast(MI)),e=>e.code==='SOURCE_UNAVAILABLE');
});
test('Adapter: deletion/undo and forbidden property never reuse a value',()=>{
 const {MI,adapter,session}=setup();session.engine.remove('C');assert.throws(()=>adapter.evaluate(ast(MI)),e=>e.code==='SOURCE_UNAVAILABLE');
 session.execute(session.createCommand('history.undo'));assert.equal(adapter.evaluate(ast(MI)).quantity.value,.04);
 assert.throws(()=>adapter.evaluate(ast(MI,'P','radius')),e=>e.code==='SOURCE_UNAVAILABLE');
 assert.equal(session.getExpressionSource({sourceId:'C',property:'name'}),null);
});
test('Adapter U12/U13: own scale/angle conversions enforce range; supplied zero is accepted',()=>{
 const d=document();d.meta.measurement.scale=Number.MIN_VALUE;const {MI,adapter}=setup(d);
 assert.throws(()=>adapter.evaluate(ast(MI)),e=>e.code==='NUMERIC_UNDERFLOW');
 const z=document();z.objects[1].x=0;const s=setup(z);assert.equal(s.adapter.evaluate(ast(s.MI,'P','x')).quantity.value,0);
 const {context}=setup();assert.throws(()=>vm.runInContext('FZI.MathIllustration.ExpressionSources.convert({value:Number.MIN_VALUE,property:"angle",measurement:null})',context),e=>e.code==='NUMERIC_UNDERFLOW');
});
test('Adapter: author hidden sources allowed; restricted facade cannot spoof author context',()=>{
 const {MI,session}=setup(),d=document();d.objects[0].visible=false;const engine=new MI.Engine(d),adapter=MI.ExpressionSources.createAuthor(engine);
 assert.equal(adapter.evaluate(ast(MI)).quantity.value,.04);assert.throws(()=>MI.ExpressionSources.createAuthor(session.engine),e=>e.code==='INVALID_ARGUMENT');
});
test('Adapter: numeric read bridge rejects accessors, inherited data and extra keys without invoking them',()=>{
 const {session}=setup();let reads=0;assert.equal(session.getExpressionSource({get sourceId(){reads++;return 'C';},property:'radius'}),null);
 assert.equal(session.getExpressionSource({sourceId:'C',property:'radius',cachedValue:4}),null);
 assert.equal(session.getExpressionSource(Object.assign(Object.create({sourceId:'C'}),{property:'radius'})),null);assert.equal(reads,0);
});
test('Adapter: JSON/SVG/import and host history have no calculator/AST/result state',()=>{
 const {MI,session,owner,adapter}=setup(),before=plain(owner.inspect()),json=plain(session.engine.toJSON()),svg=session.engine.renderSVG();
 for(let i=0;i<10;i++)adapter.evaluate(ast(MI));
 assert.deepEqual(plain(owner.inspect()),before);assert.deepEqual(plain(session.engine.toJSON()),json);assert.equal(session.engine.renderSVG(),svg);
 assert.deepEqual(plain(new MI.Engine(json).toJSON()),plain(new MI.Engine(session.engine.toJSON()).toJSON()));
 assert.doesNotMatch(JSON.stringify(session.engine.toJSON()),/calculatedValue|expressionSchema|expectedBits/);
});
test('Adapter: geometrically invalid derived source refuses its previous radius and recovers',()=>{
 const {MI}=runtime(services),engine=new MI.Engine({objects:[{id:'O',type:'point',x:0,y:0},{id:'Q',type:'point',x:3,y:4}]}),circle=engine.construct('circleByCenterPoint',[{objectId:'O'},{objectId:'Q'}])[0],adapter=MI.ExpressionSources.createAuthor(engine);
 assert.equal(adapter.evaluate(ast(MI,circle.id)).quantity.value,5);engine.update('Q',{x:0,y:0});
 assert.throws(()=>adapter.evaluate(ast(MI,circle.id)),e=>e.code==='SOURCE_UNAVAILABLE');
 engine.update('Q',{x:6,y:8});assert.equal(adapter.evaluate(ast(MI,circle.id)).quantity.value,10);
});
test('Adapter: reentrant policy/revision changes discard the just-read snapshot',()=>{
 for(const kind of ['policy','revision']){
  const {MI,context,adapter,session,owner,input}=setup();
  context._t5Action=()=>{if(kind==='revision')session.engine.update('C',{r:3});else{const next=plain(input.policy);next.initialObjectRules.C.textSourceProperties=[];owner.replacePolicy(next);}};
  context._t5Original=MI.RuntimeSession.prototype.getExpressionSource;
  vm.runInContext('FZI.MathIllustration.RuntimeSession.prototype.getExpressionSource=function(binding){const value=_t5Original.call(this,binding);_t5Action();return value;}',context);
  try{assert.throws(()=>adapter.evaluate(ast(MI)),e=>e.code==='SOURCE_UNAVAILABLE');}
  finally{MI.RuntimeSession.prototype.getExpressionSource=context._t5Original;}
 }
});
