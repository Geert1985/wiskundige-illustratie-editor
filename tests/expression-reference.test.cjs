const test=require('node:test'),assert=require('node:assert/strict');
const N=require('../expression-numeric.js'),E=require('../expression-engine.js');
const reference=require('./fixtures/expression-reference.json');
const bits=value=>{const b=Buffer.alloc(8);b.writeDoubleBE(value);return b.toString('hex');};
test('Independent rational oracle: decimal quantization and final ties-to-even binary64 conversion',()=>{
 for(const f of reference.rounds){
  if(f.code)assert.throws(()=>N.quantize(f.value,f.digits,f.factor),e=>e.code===f.code);
  else assert.equal(bits(N.quantize(f.value,f.digits,f.factor)),f.expectedBits,JSON.stringify(f));
 }
});
for(const f of reference.transcendentals)test('Independent Decimal oracle: '+f.function+'('+f.value+')',()=>{
 const run=()=>E.evaluate({kind:'call',name:f.function,args:[{kind:'number',value:f.value}]}).quantity.value;
 if(f.code){assert.throws(run,e=>e.code===f.code);return;}
 const value=run(),expected=Buffer.from(f.expectedBits,'hex').readDoubleBE();
 assert.equal(value===0,expected===0,'zero classification');
 assert.equal(value!==0&&Math.abs(value)<N.NORMAL_MIN,expected!==0&&Math.abs(expected)<N.NORMAL_MIN,'normal/subnormal classification');
 const actual=BigInt('0x'+bits(value)),target=BigInt('0x'+f.expectedBits),difference=actual>target?actual-target:target-actual;
 assert.ok(difference<=2n,'maximum 2 ULP vs independent reference');
});
