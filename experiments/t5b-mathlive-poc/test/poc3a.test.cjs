const test=require('node:test'); const assert=require('node:assert/strict');
(async()=>{
 const {ComputeEngine}=await import('@cortex-js/compute-engine');
 const {evaluateBoundMathJson,evaluateMathLiveLatex,sourceLatex,validateTree}=await import('../structural-binding.mjs');
 const ce=new ComputeEngine(); let provider;
 const bindings=[{token:'wieSourceA',sourceId:'same-id',property:'radius',instanceGeneration:1},{token:'wieSourceB',sourceId:'circle-b',property:'radius',instanceGeneration:4}];
 function reset(){provider={items:new Map([['same-id',{instanceGeneration:1,value:2}],['circle-b',{instanceGeneration:4,value:3}]]),resolve(b){const s=this.items.get(b.sourceId);if(!s||s.instanceGeneration!==b.instanceGeneration)throw Error('private detail');return s;}};}
 function evaluate(latex,bs=bindings){const p=ce.parse(latex);assert.ok(p.isValid,JSON.stringify(p.json));return evaluateBoundMathJson(ce,p.json,bs,provider);}
 test('explicitly inserted source token binds structurally and computes via CortexJS',()=>{reset();const r=evaluate(`${sourceLatex('wieSourceA')}^2`);assert.equal(r.expression.toString(),'4');assert.deepEqual(r.dimension,{length:2});});
 test('two separately bound sources can appear in one formula',()=>{reset();const r=evaluate(`${sourceLatex('wieSourceA')}+${sourceLatex('wieSourceB')}`);assert.equal(r.expression.toString(),'5');assert.deepEqual(r.dimension,{length:1});});
 test('ordinary variable with a similar visible name remains unbound',()=>{reset();const p=ce.parse('r+2');const r=evaluateBoundMathJson(ce,p.json,bindings,provider);assert.equal(r.refs.length,0);assert.match(r.expression.toString(),/r/);});
 test('bare r never binds without explicit source token',()=>{reset();const r=evaluate('r+1',[]);assert.equal(r.refs.length,0);assert.match(r.expression.toString(),/r/);});
 test('removed source cannot bind after same ID is reused with a new generation',()=>{reset();provider.items.set('same-id',{instanceGeneration:2,value:9});assert.throws(()=>evaluate(sourceLatex('wieSourceA')),e=>e.code==='SOURCE_UNAVAILABLE');});
 test('unknown reserved binding token is rejected',()=>{reset();const p=ce.parse('\\mathrm{wieSourceUnknown}');assert.throws(()=>evaluateBoundMathJson(ce,p.json,bindings,provider),e=>e.code==='UNKNOWN_BINDING');});
 test('unsupported structures and oversized/deep trees are rejected before evaluation',()=>{reset();assert.throws(()=>validateTree(['Foo',1],Object.create(null)),e=>e.code==='UNSUPPORTED_EXPRESSION');assert.throws(()=>validateTree(['Power','x',99],Object.create(null)),e=>e.code==='INVALID_POWER');});
 test('invalid binding records and private source errors fail closed',()=>{reset();assert.throws(()=>evaluate(sourceLatex('wieSourceA'),[{token:'wieSourceA',sourceId:'missing',property:'radius',instanceGeneration:1}]),e=>e.code==='SOURCE_UNAVAILABLE'&&!/missing|private/.test(e.message));});
 test('active UI evaluation function computes explicit circle area and reacts to source changes',()=>{reset();const latex=`\\pi ${sourceLatex('wieSourceA')}^2`;let out=evaluateMathLiveLatex(ce,latex,bindings,provider);assert.equal(out.expression.toString(),'4pi');provider.items.get('same-id').value=3;out=evaluateMathLiveLatex(ce,latex,bindings,provider);assert.equal(out.expression.toString(),'9pi');});
 test('active UI evaluation keeps an unbound r symbolic',()=>{reset();const out=evaluateMathLiveLatex(ce,'\\pi r^2',bindings,provider);assert.equal(out.refs.length,0);assert.match(out.expression.toString(),/r/);});
 test('UI source selection uses structural tokens and render path has no regex substitution',()=>{const fs=require('node:fs');const app=fs.readFileSync(require('node:path').join(__dirname,'..','app.js'),'utf8');assert.match(app,/evaluateMathLiveLatex\(ce,latex,geoBindings,geoSources\)/);assert.match(app,/sourceLatex\('wieSourceA'\)/);assert.doesNotMatch(app,/getValue\('latex-expanded'\)\.replace/);});})();

