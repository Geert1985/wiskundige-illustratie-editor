/* UI-independent quantity evaluator. Caller supplies authorized snapshots/options explicitly. */
(function (root, factory) {
  'use strict';
  const common = typeof module === 'object' && module.exports;
  const N = common ? require('./expression-numeric.js') : root.FZI.MathIllustration.ExpressionNumeric;
  const A = common ? require('./expression-ast.js') : root.FZI.MathIllustration.ExpressionAST;
  const api = factory(N, A);
  if (common) module.exports = api; else root.FZI.MathIllustration.ExpressionEngine = api;
})(globalThis, function (N, A) {
  'use strict';
  const fail=N.fail, zero=[0,0,0], factors=Object.freeze({mm:.001,cm:.01,m:1,km:1000,deg:Math.PI/180,rad:1,unit:1});
  const same=(a,b)=>a.every((v,i)=>v===b[i]), dimensionless=d=>same(d,zero);
  const superscript={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸'};
  const unitLabel=u=>u.factors?u.factors.map(unitLabel).join('·'):(u.name==='unit'?'u':u.name)+(u.exponent===1?'':String(u.exponent).split('').map(c=>superscript[c]).join(''));
  function quantity(value, dimension=zero) {
    A.list(dimension,3);
    if(!Array.isArray(dimension)||dimension.length!==3||dimension.some(v=>!Number.isInteger(v)||Math.abs(v)>8))fail('INVALID_DIMENSION_POWER');
    if(dimension[0]!==0&&dimension[1]!==0)fail('UNIT_SPACE_MISMATCH');
    return Object.freeze({value:N.finite(value),dimension:Object.freeze(dimension.map(v=>v===0?0:v))});
  }
  function unit(input) {
    const u=A.unit(input),dimension=[0,0,0];let factor=1;
    for(const part of u.factors||[u]){
      const axis=part.name==='unit'?1:['deg','rad'].includes(part.name)?2:0;
      dimension[axis]+=part.exponent;quantity(0,dimension);
      factor=N.multiply(factor,N.finite(Math.pow(factors[part.name],part.exponent),true));
    }
    return Object.freeze({factor,dimension:Object.freeze(dimension)});
  }
  function checkedQuantity(value) {
    A.object(value,['value','dimension']);
    A.list(value.dimension,3);return quantity(value.value,value.dimension);
  }
  function evaluate(input, options={}) {
    A.object(options,['angleMode','resolveSource'],[]);
    if(options.angleMode!=null&&!['deg','rad'].includes(options.angleMode)||options.resolveSource!=null&&typeof options.resolveSource!=='function')fail('INVALID_ARGUMENT');
    const ast=A.validate(input);let steps=0;const warnings=new Set();
    const sources=new Map(),staticSources=new WeakMap();
    function observe(q){if(q.value!==0&&Math.abs(q.value)<N.NORMAL_MIN)warnings.add('SUBNORMAL_RESULT');return q;}
    function containsSource(node){
      if(staticSources.has(node))return staticSources.get(node);
      if(++steps>A.limits.steps)fail('QUOTA_EXCEEDED');
      const result=node.kind==='source'||node.kind==='unary'&&containsSource(node.argument)||node.kind==='binary'&&(containsSource(node.left)||containsSource(node.right))||node.kind==='call'&&node.args.some(containsSource);
      staticSources.set(node,!!result);return !!result;
    }
    function visit(node){
      if(++steps>A.limits.steps)fail('QUOTA_EXCEEDED');
      let q;
      if(node.kind==='number'){
        if(node.unit){const u=unit(node.unit);q=quantity(N.multiply(node.value,u.factor),u.dimension);}else q=quantity(node.value);
      }else if(node.kind==='constant')q=quantity(node.name==='pi'?Math.PI:Math.E);
      else if(node.kind==='source'){
        const key=JSON.stringify([node.sourceId,node.property]);
        if(!sources.has(key)){
          if(!options.resolveSource)fail('SOURCE_UNAVAILABLE');
          let resolved;try{resolved=options.resolveSource(Object.freeze({sourceId:node.sourceId,property:node.property}));}catch(error){fail(error instanceof N.ExpressionError&&['NUMERIC_UNDERFLOW','NON_FINITE_RESULT'].includes(error.code)?error.code:'SOURCE_UNAVAILABLE');}
          if(!resolved)fail('SOURCE_UNAVAILABLE');sources.set(key,checkedQuantity(resolved));
        }q=sources.get(key);
      }else if(node.kind==='unit')fail('INVALID_ARGUMENT');
      else if(node.kind==='unary'){const v=visit(node.argument);q=quantity(node.op==='-'?-v.value:v.value,v.dimension);}
      else if(node.kind==='binary'){
        const left=visit(node.left);
        if(node.op==='^'&&!dimensionless(left.dimension)&&containsSource(node.right))fail('INVALID_DIMENSION_POWER');
        const right=visit(node.right),a=left.value,b=right.value;
        if(['+','-'].includes(node.op)){
          if(!same(left.dimension,right.dimension))fail(left.dimension[0]&&right.dimension[1]||left.dimension[1]&&right.dimension[0]?'UNIT_SPACE_MISMATCH':'DIMENSION_MISMATCH');
          q=quantity(N.finite(node.op==='+'?a+b:a-b),left.dimension);
        }else if(node.op==='^'){
          if(!dimensionless(right.dimension))fail('INVALID_DIMENSION_POWER');
          if(!dimensionless(left.dimension)&&(!Number.isInteger(b)||Math.abs(b)>8))fail('INVALID_DIMENSION_POWER');
          if(a===0&&b<=0||a<0&&!Number.isInteger(b))fail('DOMAIN_ERROR');
          q=quantity(N.finite(Math.pow(a,b),a!==0),left.dimension.map(v=>v*b));
        }else{
          const dimension=left.dimension.map((v,i)=>v+(node.op==='*'?1:-1)*right.dimension[i]);
          // Validate combined dimensions before any arithmetic or quantization.
          quantity(0,dimension);
          q=quantity(node.op==='*'?N.multiply(a,b):N.divide(a,b),dimension);
        }
      }else{
        const name=node.name,rounding=['round','floor','ceil','trunc'].includes(name);
        if(!rounding&&node.args.length!==1)fail('INVALID_ARGUMENT');
        const value=visit(node.args[0]),d=value.dimension;
        if(rounding){
          const base=name==='round'?2:1,dimensional=!dimensionless(d);
          if(node.args.length!==base+(dimensional?1:0))fail('INVALID_ARGUMENT');
          let digits=0;
          if(name==='round'){const arg=visit(node.args[1]);digits=arg.value;if(!dimensionless(arg.dimension)||!Number.isInteger(digits)||digits<0||digits>10)fail('INVALID_ARGUMENT');}
          let factor=1;
          if(dimensional){const arg=node.args[base];if(arg.kind!=='unit')fail('INVALID_ARGUMENT');const u=unit(arg.unit);if(!same(d,u.dimension))fail(d[0]&&u.dimension[1]||d[1]&&u.dimension[0]?'UNIT_SPACE_MISMATCH':'DIMENSION_MISMATCH');factor=u.factor;}
          q=quantity(N.quantize(value.value,digits,factor,name),d);
        }else if(name==='abs')q=quantity(Math.abs(value.value),d);
        else if(name==='sqrt'){
          if(d.some(v=>v%2!==0))fail('NON_INTEGER_DIMENSION');q=quantity(N.transcendental(name,value.value),d.map(v=>v/2));
        }else if(['sin','cos','tan'].includes(name)){
          if(!dimensionless(d)&&!same(d,[0,0,1]))fail('DIMENSION_MISMATCH');
          const radians=dimensionless(d)&&options.angleMode==='deg'?N.multiply(value.value,Math.PI/180):value.value;
          q=quantity(N.transcendental(name,radians));
        }else{
          if(!dimensionless(d))fail('DIMENSION_MISMATCH');
          q=quantity(N.transcendental(name,value.value),['asin','acos','atan'].includes(name)?[0,0,1]:zero);
        }
      }
      return observe(q);
    }
    const result=visit(ast);
    return Object.freeze({quantity:result,warnings:Object.freeze([...warnings]),steps});
  }
  function format(input, options={}) {
    const q=checkedQuantity(input);
    A.object(options,['precision','unit','units'],[]);
    const precision=options.precision??2;
    if(!Number.isInteger(precision)||precision<0||precision>10)fail('INVALID_ARGUMENT');
    let factor=1,suffix=[];
    if(options.unit){const u=unit(options.unit);if(!same(u.dimension,q.dimension))fail('DIMENSION_MISMATCH');factor=u.factor;suffix=[unitLabel(options.unit)];}
    else{
      const choices=options.units||{};A.object(choices,['length','angle'],[]);
      const length=choices.length||'m',angle=choices.angle||'rad';
      if(!['mm','cm','m','km','unit'].includes(length)||!['deg','rad'].includes(angle))fail('INVALID_ARGUMENT');
      for(let i=0;i<3;i++)if(q.dimension[i]){const name=i===0?length:i===1?'unit':angle;if(i===0&&name==='unit')fail('UNIT_SPACE_MISMATCH');const u={name,exponent:q.dimension[i]};factor=N.multiply(factor,unit(u).factor);suffix.push(unitLabel(u));}
    }
    const value=N.divide(q.value,factor),rounded=N.quantize(value,precision),approximate=rounded!==value;
    const text=(Math.abs(rounded)<1e21?rounded.toFixed(precision):String(rounded)).replace('.',',');
    return Object.freeze({text:(approximate?'≈':'')+text+(suffix.length?' '+suffix.join('·'):''),approximate,
      roundedNonzero:value!==0&&rounded===0,canonical:String(value),quantity:q});
  }
  function formula(input, options={}) {
    A.object(options,['mode','sourceLabel','resolveSource','precision','units'],[]);
    const ast=A.validate(input),mode=options.mode||'symbolic';if(!['symbolic','substituted'].includes(mode))fail('INVALID_ARGUMENT');
    const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    function visit(node){
      if(node.kind==='source'){
        if(!options.resolveSource)fail('SOURCE_UNAVAILABLE');let value;try{value=options.resolveSource({sourceId:node.sourceId,property:node.property});}catch{fail('SOURCE_UNAVAILABLE');}
        if(!value)fail('SOURCE_UNAVAILABLE');const q=checkedQuantity(value);
        if(mode==='substituted')return '('+escape(format(q,{precision:options.precision??2,units:options.units||{}}).text)+')';
        let label;try{label=options.sourceLabel?.({sourceId:node.sourceId,property:node.property});}catch{fail('SOURCE_UNAVAILABLE');}
        if(typeof label!=='string'||label.length>256)fail('SOURCE_UNAVAILABLE');return '('+escape(label)+')';
      }
      if(node.kind==='number')return String(node.value)+(node.unit?' '+unitLabel(node.unit):'');
      if(node.kind==='constant')return node.name==='pi'?'π':'e';
      if(node.kind==='unit')return unitLabel(node.unit);
      if(node.kind==='unary')return '('+node.op+visit(node.argument)+')';
      if(node.kind==='binary')return '('+visit(node.left)+' '+node.op+' '+visit(node.right)+')';
      return node.name+'('+node.args.map(visit).join('; ')+')';
    }
    return visit(ast);
  }
  return Object.freeze({quantity,checkedQuantity,unit,evaluate,format,formula,parse:A.parse,parseTokens:A.parseTokens,
    normalizeInput:A.normalizeInput,validate:A.validate,print:A.print,parsePrinted:A.parsePrinted,encode:A.encode,decode:A.decode,limits:A.limits});
});
