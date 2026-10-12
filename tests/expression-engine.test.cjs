const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../expression-engine.js'),N=require('../expression-numeric.js'),A=require('../expression-ast.js');
for(const entry of require('./expression-cases.js').cases(E,N,A))test(entry.id+' '+entry.label,entry.run);

test('Security: getters, prototypes, cycles, unknown AST keys and cached results rejected',()=>{
 let reads=0;const getter={kind:'number',get value(){reads++;return 1;}};
 const cyclic={kind:'unary',op:'-'};cyclic.argument=cyclic;
 for(const input of [getter,cyclic,{kind:'number',value:1,cachedValue:2},Object.assign(Object.create({hidden:1}),{kind:'number',value:1}),JSON.parse('{"kind":"number","value":1,"__proto__":{}}')])assert.throws(()=>E.validate(input));
 const args=[];Object.defineProperty(args,'0',{get(){reads++;return {kind:'number',value:1};},enumerable:true});
 assert.throws(()=>E.validate({kind:'call',name:'abs',args}));assert.equal(reads,0);
});
test('Security: token and quantity accessors never executed',()=>{
 let reads=0;const token={type:'number',get value(){reads++;return 2;}};
 assert.throws(()=>E.parseTokens([token]));assert.throws(()=>E.normalizeInput([token]));
 const value={get value(){reads++;return 2;},dimension:[0,0,0]};
 assert.throws(()=>E.evaluate({kind:'source',sourceId:'S',property:'radius'},{resolveSource:()=>value}));
 const tokens=[];Object.defineProperty(tokens,'0',{get(){reads++;return token;},enumerable:true});assert.throws(()=>E.parseTokens(tokens));assert.equal(reads,0);
});
test('Security: JavaScript, assignments, arbitrary calls and unsupported units are not language constructs',()=>{
 for(const input of ['globalThis','constructor(1)','Math.sin(1)','1;alert(1)','x=2','2 inch','sin(1,2;3)','import(1)','1[0]','__proto__','Infinity','NaN','abs(1;2)'])assert.throws(()=>E.evaluate(E.parse(input)));
});
test('Quotas: input, tokens, nodes, semantic depth, sources and encoded bytes',()=>{
 for(const input of ['1'.repeat(2049),'1+'.repeat(256)+'1','('.repeat(1000)+'1'+')'.repeat(1000)])assert.throws(()=>E.parse(input));
 let node={kind:'number',value:1};for(let i=0;i<33;i++)node={kind:'unary',op:'-',argument:node};assert.throws(()=>E.validate(node));
 assert.throws(()=>E.decode(' '.repeat(65537)));
 const source=()=>({kind:'source',sourceId:'S',property:'radius'});
 const balanced=list=>list.length===1?list[0]:{kind:'binary',op:'+',left:balanced(list.slice(0,list.length>>1)),right:balanced(list.slice(list.length>>1))};
 assert.throws(()=>E.validate(balanced(Array.from({length:65},source))),e=>e.code==='QUOTA_EXCEEDED');
 const deepCalls=()=>{let node={kind:'number',value:1};for(let i=0;i<28;i++)node={kind:'call',name:'abs',args:[node]};return node;};
 assert.throws(()=>E.validate(balanced(Array.from({length:8},deepCalls))),e=>e.code==='QUOTA_EXCEEDED');
});
test('Canonical schema, signed literals, finite units and parser/printer tree identity',()=>{
 for(const input of ['1-(2-3)','1/(2/3)','(2^3)^2','2^(3^2)','(-2)^2','(2 cm)^2','-2 cm^2','round(1.2 m;1;m)','sqrt((1 m)^2)','floor(-1.2 cm;cm)']){
  const ast=E.parse(input);assert.deepEqual(E.parsePrinted(E.print(ast)),ast);assert.deepEqual(E.decode(E.encode(ast)),ast);
 }
 assert.equal(E.decode(E.encode({kind:'number',value:-0})).value,0);assert.throws(()=>E.decode('{"schema":2,"ast":{"kind":"number","value":1}}'));
});
test('Typed source chips and normalization never resolve free display names',()=>{
 const tokens=[...A.tokenize('2'),{type:'source',sourceId:'C',property:'radius'}];
 const ast=E.normalizeInput(tokens).ast;assert.equal(E.evaluate(ast,{resolveSource:()=>E.quantity(3)}).quantity.value,6);
 assert.deepEqual(E.parsePrinted(E.print(ast)),ast);assert.throws(()=>E.parse('C.radius'));
});
test('Formula presentation escapes labels, brackets negatives and cannot display denied sources',()=>{
 const ast={kind:'binary',op:'^',left:{kind:'source',sourceId:'C',property:'radius'},right:{kind:'number',value:2}};
 const options={resolveSource:()=>E.quantity(-2,[1,0,0]),sourceLabel:()=>'<Secret & "x"> radius'};
 assert.match(E.formula(ast,options),/&lt;Secret &amp; &quot;x&quot;&gt;/);
 assert.match(E.formula(ast,{...options,mode:'substituted'}),/\(-2,00 m\)/);
 assert.throws(()=>E.formula(ast,{...options,resolveSource:()=>null}),e=>e.code==='SOURCE_UNAVAILABLE');
});
test('Source reads are immutable snapshots within a run but refreshed for each calculation',()=>{
 let reads=0;const source={kind:'source',sourceId:'C',property:'radius'},ast={kind:'binary',op:'+',left:source,right:{...source}};
 const options={resolveSource:()=>E.quantity(++reads)};
 assert.equal(E.evaluate(ast,options).quantity.value,2);assert.equal(reads,1);
 assert.equal(E.evaluate(ast,options).quantity.value,4);assert.equal(reads,2);
});
test('Dimensions and display options cannot claim inferred dimensions or silently convert spaces',()=>{
 assert.throws(()=>E.quantity(1,[1,1,0]),e=>e.code==='UNIT_SPACE_MISMATCH');
 assert.throws(()=>E.evaluate({kind:'number',value:1,dimension:[1,0,0]}));
 for(const text of ['(1 m)^9','(1 m^8)^2','sqrt(1 rad)','exp(1 rad)'])assert.throws(()=>E.evaluate(E.parse(text)));
 assert.throws(()=>E.format(E.quantity(1,[1,0,0]),{units:{length:'unit'}}));
});
test('Compound-unit rounding and printing retain complete dimensions and explicit unit order',()=>{
 const ast=E.parse('round(1.25 m*rad;1;m*rad)'),result=E.evaluate(ast).quantity;
 assert.equal(result.value,1.3);assert.deepEqual(result.dimension,[1,0,1]);assert.deepEqual(E.parsePrinted(E.print(ast)),ast);
 assert.equal(E.evaluate(E.parse('round(1.25 m/rad;1;m/rad)')).quantity.value,1.3);
 assert.throws(()=>E.evaluate(E.parse('round(1 m*rad;1;m)')),e=>e.code==='DIMENSION_MISMATCH');
 assert.throws(()=>E.evaluate(E.parse('1 m*unit')),e=>e.code==='UNIT_SPACE_MISMATCH');
 assert.throws(()=>E.normalizeInput('2e'));assert.equal(E.evaluate(E.parse('2*e')).quantity.value,2*Math.E);
});
test('Unicode unit suffixes normalize without adding general implicit powers or unknown units',()=>{
 for(const [unicode,canonical] of [['9 cm²','9 cm^2'],['1 rad⁻¹','1 rad^-1'],['round(1.25 m²;1;m²)','round(1.25 m^2;1;m^2)']])assert.deepEqual(E.parse(unicode),E.parse(canonical));
 for(const text of ['1 cm⁹','1 cm⁻','2²','1 inch²'])assert.throws(()=>E.parse(text));
});
