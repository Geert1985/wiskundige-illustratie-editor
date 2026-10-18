'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain } = require('../../../tests/helpers.cjs');
const { createCortexHost } = require('../cortex-host.cjs');

const services = ['model.js','renderer.js','index.js','expression-numeric.js','expression-ast.js','expression-engine.js','expression-sources.js'];
function doc() { return { meta:{measurement:{schema:1,unit:'cm',scale:2,precision:2},angleMeasurement:{schema:1,unit:'rad',precision:3}}, objects:[{id:'C',type:'circle',cx:0,cy:0,r:2,name:'Private source'},{id:'P',type:'point',x:3,y:-4}] }; }
function policy() { return {schema:2,activityId:'cx1',revision:'1',profile:'course',defaultCapabilities:{read:true,display:true},initialObjectRules:{C:{geometryFields:['r'],delete:true,textSourceProperties:['radius','area','perimeter']},P:{textSourceProperties:['x','y']}},createdObjectRules:{},allowedTools:[],document:{undo:true,redo:true,exportJSON:true,exportSVG:true},parameters:{},limits:{maxObjects:100,maxCommandBytes:65536,maxBatchObjects:100,maxDependencyDepth:32}}; }
function restricted(options = {}) { const { MI, context } = runtime(services), input = {actorId:'student',assessmentKind:'practice',initialDocument:doc(),policy:policy(),...options}; const {session,owner}=MI.RuntimeSession.create(input); return {MI,context,input,session,owner,host:createCortexHost({MI,mode:'restricted',session})}; }
function author(document = doc(), compute) { const {MI}=runtime(services), engine=new MI.Engine(document); return {MI,engine,host:createCortexHost({MI,mode:'author',engine,compute})}; }
const fakeCompute = async mathjson => ({ exact: JSON.stringify(mathjson), numeric: typeof mathjson === 'number' ? mathjson : 1 });
function token(host, source='C', property='radius') { return host.selectSource(source,property); }
function deferred() { let resolve; const promise=new Promise(r=>resolve=r); return {promise,resolve}; }

test('CX-1: echte WIE author-toegang via T5a-bronfaçade en dimensiebehoud',async()=>{
 const {host}=author(); const r=token(host); const result=await host.evaluate(['Power',r,2]);
 assert.equal(result.value,0.0016); assert.deepEqual(result.dimension,[2,0,0]);
});
test('CX-1: echte RuntimeSession restricted-toegang en correcte SI-bronsnapshot',async()=>{
 const {host}=restricted(); const r=token(host); const result=await host.evaluate(['Add',r,r]);
 assert.equal(result.value,.08); assert.deepEqual(result.dimension,[1,0,0]);
});
test('CX-1: verborgen of niet-toegestane bron wordt fail closed geweigerd zonder brondata',()=>{
 const d=doc(); d.objects[0].visible=false; const {MI}=runtime(services),engine=new MI.Engine(d),authorHost=createCortexHost({MI,mode:'author',engine});
 // Author mode follows WIE's author policy; visibility restrictions apply in restricted mode.
 assert.doesNotThrow(()=>token(authorHost));
 const r=restricted({policy:{...policy(),initialObjectRules:{C:{read:false,display:false,textSourceProperties:['radius']}}}});
 assert.throws(()=>token(r.host),e=>e.code==='SOURCE_UNAVAILABLE'&&!e.message.includes('Private source'));
});
test('CX-1: ongeldige broneigenschap wordt geweigerd',()=>{ const {host}=restricted(); assert.throws(()=>token(host,'C','name'),e=>e.code==='SOURCE_UNAVAILABLE'); });
test('CX-1: verwijderde bron en oude binding worden geweigerd',async()=>{
 const {host,session}=restricted(); const r=token(host); session.engine.remove('C'); await assert.rejects(host.evaluate(['Add',r,r]));
});
test('CX-1: delete plus Undo herstelt geometrie maar vereist nieuwe expliciete binding',async()=>{
 const {host,session}=restricted(); const old=token(host); session.engine.remove('C'); session.execute(session.createCommand('history.undo'));
 await assert.rejects(host.evaluate(['Add',old,old])); const fresh=token(host); assert.equal((await host.evaluate(['Add',fresh,fresh])).value,.08);
});
test('CX-1: hergebruik van object-ID door andere instantie maakt binding ongeldig',async()=>{
 const {MI,engine,host}=author(); const r=token(host); const next=doc(); next.objects[0].r=9; engine.load(next);
 await assert.rejects(host.evaluate(['Add',r,r]));
});
test('CX-1: documentvervanging maakt eerder resultaat en binding ongeldig',async()=>{
 const {MI,engine,host}=author(); const r=token(host); const next=doc(); next.objects[0].r=5; engine.load(next);
 await assert.rejects(host.evaluate(['Add',r,r]));
});
test('CX-1: permission epoch wijziging en beleidsintrekking weigeren oude binding',async()=>{
 const {host,owner,input}=restricted(); const r=token(host); const next=plain(input.policy); next.initialObjectRules.C.textSourceProperties=[]; owner.replacePolicy(next);
 await assert.rejects(host.evaluate(['Add',r,r]));
});
test('CX-1: beëindigde RuntimeSession blokkeert evaluatie',async()=>{
 const {host,owner}=restricted(); const r=token(host); owner.dispose(); await assert.rejects(host.evaluate(['Add',r,r]));
});
test('CX-1: bronwijziging tijdens vertraagde evaluatie verwerpt antwoord',async()=>{
 const gate=deferred(), started=deferred(); const {MI,session}=restricted(); const host=createCortexHost({MI,mode:'restricted',session,compute:async()=>{started.resolve();await gate.promise;return {exact:7,numeric:7};}}); const r=token(host);
 const pending=host.evaluate(['Add',r,r]); await started.promise; session.engine.update('C',{r:3}); gate.resolve(); await assert.rejects(pending,e=>e.code==='STALE_RESULT'||e.code==='RESULT_UNAVAILABLE');
});
test('CX-1: oudere aanvraag die later eindigt overschrijft nieuwere aanvraag niet',async()=>{
 const first=deferred(),started=deferred(); let calls=0; const {MI,session}=restricted(); const host=createCortexHost({MI,mode:'restricted',session,compute:async math=>{if(++calls===1){started.resolve();await first.promise;return {exact:'old',numeric:1};}return {exact:'new',numeric:2};}}); const r=token(host);
 const older=host.evaluate(['Add',r,r]); await started.promise; const newer=await host.evaluate(['Add',r,r,r]); first.resolve(); await assert.rejects(older,e=>e.code==='STALE_RESULT'); assert.equal(newer.value,2); assert.equal(host.canCopy(newer),true);
});
test('CX-1: resultaat wordt vóór kopiëren opnieuw op rechten en revisie gecontroleerd',async()=>{
 const {host,session}=restricted(); const r=token(host); const result=await host.evaluate(['Add',r,r]); assert.equal(host.canCopy(result),true); session.engine.update('C',{r:3}); assert.equal(host.canCopy(result),false);
});
test('CX-1: formulegeneratie en gewijzigde authorisatie blokkeren publicatie en kopiëren',async()=>{
 const {host,session,owner,input}=restricted(); const r=token(host); const result=await host.evaluate(['Add',r,r]);
 host.setFormulaGeneration(1); assert.equal(host.canCopy(result),false);
 const next=plain(input.policy); next.initialObjectRules.C.textSourceProperties=[]; owner.replacePolicy(next);
 await assert.rejects(host.evaluate(['Add',r,r]));
});
test('CX-1: onbekend of nagebootst token wordt afgewezen; gewone r blijft ongebonden',async()=>{
 const {host}=restricted(); await assert.rejects(host.evaluate(['Add','wieSource_forged',1]),e=>e.code==='UNKNOWN_BINDING'); await assert.rejects(host.evaluate(['Add','r',1]),e=>e.code==='UNBOUND_SYMBOL');
});
test('CX-1: volledige structuur, operatorallowlist, diepte, knopen en bronlimiet worden gecontroleerd',async()=>{
 const {host}=restricted(); const r=token(host); await assert.rejects(host.evaluate(['Add',r,['Unsupported',1]])); await assert.rejects(host.evaluate(['Power',r,9]),e=>e.code==='INVALID_POWER');
 let deep=1; for(let i=0;i<25;i++) deep=['Sqrt',deep]; await assert.rejects(host.evaluate(deep),e=>e.code==='INPUT_LIMIT');
 const broad=['Add',...Array(129).fill(1)]; await assert.rejects(host.evaluate(broad),e=>e.code==='INPUT_LIMIT');
 const many=['Add',...Array(9).fill(r)]; await assert.rejects(host.evaluate(many),e=>e.code==='INPUT_LIMIT');
});
test('CX-1: CortexJS domeinfouten en niet-eindige uitkomsten worden niet gepubliceerd',async()=>{
 const {host}=restricted(); await assert.rejects(host.evaluate(['Divide',1,0])); await assert.rejects(host.evaluate(['Sqrt',-1]));
});
test('CX-1: mm/cm/m-conversies en oppervlakte gebruiken de T5a-SI-schaal inclusief schaal²',async()=>{
 for(const [unit,expected] of [['mm',.004],['cm',.04],['m',4]]){
  const d=doc(); d.meta.measurement.unit=unit; const {MI}=runtime(services),engine=new MI.Engine(d),host=createCortexHost({MI,mode:'author',engine}); const r=token(host); assert.equal((await host.evaluate(r)).value,expected);
 }
 const {host}=author(); const area=token(host,'C','area'); const got=await host.evaluate(area); assert.deepEqual(got.dimension,[2,0,0]); assert.ok(Math.abs(got.value-Math.PI*.04*.04)<1e-14);
});
test('CX-1: compatibele lengtebronnen en dimensieloze r/r worden aan de dimensieanalyse getoetst',async()=>{
 const {MI}=runtime(services),d=doc(); d.objects.push({id:'C2',type:'circle',cx:0,cy:0,r:1}); const engine=new MI.Engine(d),host=createCortexHost({MI,mode:'author',engine});
 const r1=token(host,'C'),r2=token(host,'C2'); assert.deepEqual((await host.evaluate(['Add',r1,r2])).dimension,[1,0,0]); assert.deepEqual((await host.evaluate(['Divide',r1,r1])).dimension,[0,0,0]); await assert.rejects(host.evaluate(['Add',r1,['Power',r2,2]]),e=>e.code==='DIMENSION_MISMATCH');
});
test('CX-1: echte WIE-fixture blijft bronautoriteit; adapter bevat geen RuntimeSession voor CortexJS',async()=>{
 const {MI,session,host}=restricted(); const r=token(host); const value=await host.evaluate(['Add',r,r]); assert.equal(value.value,.08);
 assert.equal(MI.RuntimeSession.isSession(session),true); assert.equal(Object.hasOwn(value,'session'),false); assert.equal(Object.hasOwn(value,'sourceId'),false);
});
