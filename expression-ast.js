/* Safe expression language, typed source tokens, canonical AST and printers. */
(function (root, factory) {
  'use strict';
  const numeric = typeof module === 'object' && module.exports ? require('./expression-numeric.js') : root.FZI.MathIllustration.ExpressionNumeric;
  const api = factory(numeric);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FZI.MathIllustration.ExpressionAST = api;
})(globalThis, function (N) {
  'use strict';
  const limits = Object.freeze({characters: 2048, tokens: 512, nodes: 256, depth: 32, steps: 1024, sources: 64, bytes: 65536});
  const functions = Object.freeze(['sqrt','abs','sin','cos','tan','asin','acos','atan','ln','log10','exp','round','floor','ceil','trunc']);
  const properties = Object.freeze(['length','radius','perimeter','area','angle','x','y']);
  const unitNames = Object.freeze(['mm','cm','m','km','deg','rad','unit']);
  const fail = N.fail;
  function object(value, allowed, required = allowed) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_AST');
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) fail('INVALID_AST');
    const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
    if (keys.some(k => typeof k !== 'string' || !allowed.includes(k) || !('value' in descriptors[k])) || required.some(k => !Object.hasOwn(descriptors, k))) fail('INVALID_AST');
  }
  function unit(value) {
    if(value&&typeof value==='object'&&Object.hasOwn(value,'factors')){
      object(value,['factors']);list(value.factors,3);
      if(value.factors.length<2)fail('INVALID_AST');
      return {factors:value.factors.map(factor=>{object(factor,['name','exponent']);return unit(factor);})};
    }
    object(value, ['name','exponent']);
    if (!unitNames.includes(value.name) || !Number.isInteger(value.exponent) || value.exponent < -8 || value.exponent > 8) fail('INVALID_AST');
    return {name: value.name, exponent: value.exponent};
  }
  function list(value, maximum) {
    if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype)fail('INVALID_AST');
    const descriptors=Object.getOwnPropertyDescriptors(value),length=descriptors.length.value,keys=Reflect.ownKeys(descriptors);
    if(length>maximum||keys.length!==length+1||keys.some(k=>k!=='length'&&(typeof k!=='string'||!/^\d+$/.test(k)||String(Number(k))!==k||Number(k)>=length||!('value'in descriptors[k]))))fail('INVALID_AST');
  }
  function validate(input) {
    let nodes = 0, sources = 0; const seen = new Set();
    function visit(node, depth = 1, unitArgument = false) {
      if (++nodes > limits.nodes || depth > limits.depth) fail('QUOTA_EXCEEDED');
      object(node, ['kind','value','unit','name','sourceId','property','op','argument','left','right','args'], ['kind']);
      if (seen.has(node)) fail('INVALID_AST'); seen.add(node);
      let result;
      switch (node.kind) {
        case 'number':
          object(node,['kind','value','unit'],['kind','value']); N.finite(node.value);
          result = {kind:'number',value:node.value === 0 ? 0 : node.value};
          if (node.unit != null) result.unit = unit(node.unit);
          if(result.value<0){if(++nodes>limits.nodes||depth===limits.depth)fail('QUOTA_EXCEEDED');result={kind:'unary',op:'-',argument:{...result,value:-result.value}};}
          break;
        case 'constant':
          object(node,['kind','name']); if (!['pi','e'].includes(node.name)) fail('INVALID_AST');
          result = {kind:'constant',name:node.name}; break;
        case 'unit':
          if(!unitArgument)fail('INVALID_AST');object(node,['kind','unit']);result={kind:'unit',unit:unit(node.unit)};break;
        case 'source':
          object(node,['kind','sourceId','property']);
          if (++sources > limits.sources) fail('QUOTA_EXCEEDED');
          if (typeof node.sourceId !== 'string' || !node.sourceId.trim() || node.sourceId.length > 128 || !properties.includes(node.property)) fail('INVALID_AST');
          result={kind:'source',sourceId:node.sourceId,property:node.property}; break;
        case 'unary':
          object(node,['kind','op','argument']); if (!['+','-'].includes(node.op)) fail('INVALID_AST');
          result={kind:'unary',op:node.op,argument:visit(node.argument,depth+1)}; break;
        case 'binary':
          object(node,['kind','op','left','right']); if (!['+','-','*','/','^'].includes(node.op)) fail('INVALID_AST');
          result={kind:'binary',op:node.op,left:visit(node.left,depth+1),right:visit(node.right,depth+1)}; break;
        case 'call':
          object(node,['kind','name','args']);
          if (!functions.includes(node.name) || !Array.isArray(node.args) || node.args.length < 1 || node.args.length > 3) fail('INVALID_AST');
          // Read descriptors first: sparse arrays, extra keys and accessors are not trusted AST.
          list(node.args,3);
          result={kind:'call',name:node.name,args:node.args.map((a,i)=>visit(a,depth+1,['round','floor','ceil','trunc'].includes(node.name)&&i===(node.name==='round'?2:1)))}; break;
        default: fail('INVALID_AST');
      }
      seen.delete(node); return result;
    }
    const result = visit(input);
    if (JSON.stringify(result).length > limits.bytes) fail('QUOTA_EXCEEDED');
    const canonical=buildPrint(result);if(canonical.text.length>limits.characters)fail('QUOTA_EXCEEDED');
    let tokenCount=0;
    for(const segment of canonical.text.split(/(@\d+)/)){if(segment)tokenCount+=/^@\d+$/.test(segment)?1:tokenize(segment).length;}
    if(tokenCount>limits.tokens)fail('QUOTA_EXCEEDED');
    return result;
  }
  function tokenize(input) {
    if (typeof input !== 'string' || input.length > limits.characters) fail('QUOTA_EXCEEDED');
    let at=0; const tokens=[];
    while(at<input.length){
      if (/\s/u.test(input[at])) {at++; continue;}
      const rest=input.slice(at);
      const superscript=unitNames.includes(tokens.at(-1)?.text)&&/^[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/.exec(rest);
      if(superscript){
        const alphabet={'⁻':'-','⁺':'+','⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'},value=Array.from(superscript[0],c=>alphabet[c]).join('');
        tokens.push({type:'^',text:'^'});if(value[0]==='-'||value[0]==='+')tokens.push({type:value[0],text:value[0]});
        const magnitude=value.replace(/^[+-]/,'');tokens.push({type:'number',text:magnitude,value:N.literal(magnitude)});
        at+=superscript[0].length;if(tokens.length>limits.tokens)fail('QUOTA_EXCEEDED');continue;
      }
      const number=/^(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?/.exec(rest);
      let token;
      if(number)token={type:'number',text:number[0],value:N.literal(number[0])};
      else {const name=/^[A-Za-z][A-Za-z0-9]*|^π/.exec(rest);if(name)token={type:'name',text:name[0]};
        else if('+-*/^();'.includes(input[at]))token={type:input[at],text:input[at]};
        else fail('INVALID_SYNTAX');}
      tokens.push(token);at+=token.text.length;if(tokens.length>limits.tokens)fail('QUOTA_EXCEEDED');
    }
    return tokens;
  }
  function parseTokens(input) {
    if (!Array.isArray(input) || input.length > limits.tokens) fail('QUOTA_EXCEEDED');
    list(input,limits.tokens);
    // Tokens are an input boundary, not library/editor objects.
    const tokens=input.map(t=>{
      object(t,['type','text','value','sourceId','property'],['type']);
      if(t.type==='source'){const node=validate({kind:'source',sourceId:t.sourceId,property:t.property});return {type:'source',node};}
      if(t.type==='number'){N.finite(t.value);return {type:'number',value:t.value};}
      if(t.type==='name'&&typeof t.text==='string'&&t.text.length<=32)return {type:'name',text:t.text};
      if('+-*/^();'.split('').includes(t.type))return {type:t.type};fail('INVALID_SYNTAX');
    });
    let at=0,depth=0;
    const peek=()=>tokens[at]||{type:'end'},take=type=>{if(peek().type!==type)fail('INVALID_SYNTAX');return tokens[at++];};
    function nested(fn){if(++depth>limits.depth)fail('QUOTA_EXCEEDED');try{return fn();}finally{depth--;}}
    function readUnit(){
      function part(sign=1){const name=take('name').text;if(!unitNames.includes(name))fail('INVALID_SYNTAX');let exponent=1;
        if(peek().type==='^'){at++;let direction=1;if(peek().type==='-'){at++;direction=-1;}else if(peek().type==='+')at++;exponent=direction*take('number').value;}
        return unit({name,exponent:exponent*sign});}
      const factors=[part()];
      while(['*','/'].includes(peek().type)&&tokens[at+1]?.type==='name'&&unitNames.includes(tokens[at+1].text)){const sign=tokens[at++].type==='*'?1:-1;factors.push(part(sign));if(factors.length>3)fail('QUOTA_EXCEEDED');}
      return factors.length===1?factors[0]:unit({factors});
    }
    function primary(){
      const t=peek();
      if(t.type==='number'){at++;const node={kind:'number',value:t.value};if(peek().type==='name'&&unitNames.includes(peek().text))node.unit=readUnit();return node;}
      if(t.type==='source'){at++;return t.node;}
      if(t.type==='('){at++;const node=sum();take(')');return node;}
      if(t.type==='name'){
        at++;if(['pi','π','e'].includes(t.text))return {kind:'constant',name:t.text==='π'?'pi':t.text};
        if(!functions.includes(t.text))fail('INVALID_SYNTAX');take('(');const args=[];
        if(peek().type!==')')do{if(peek().type===';')at++;args.push(peek().type==='name'&&unitNames.includes(peek().text)?{kind:'unit',unit:readUnit()}:sum());}while(peek().type===';');
        take(')');return {kind:'call',name:t.text,args};
      }fail('INVALID_SYNTAX');
    }
    function power(){const left=primary();if(peek().type==='^'){at++;return {kind:'binary',op:'^',left,right:unary()};}return left;}
    function unary(){return nested(()=>{if(['+','-'].includes(peek().type)){const op=tokens[at++].type;return {kind:'unary',op,argument:unary()};}return power();});}
    function product(){let left=unary();while(['*','/'].includes(peek().type)){const op=tokens[at++].type;left={kind:'binary',op,left,right:unary()};}return left;}
    function sum(){let left=product();while(['+','-'].includes(peek().type)){const op=tokens[at++].type;left={kind:'binary',op,left,right:product()};}return left;}
    const ast=sum();if(peek().type!=='end')fail('INVALID_SYNTAX');return validate(ast);
  }
  const parse=input=>parseTokens(tokenize(input));
  function normalizeInput(input) {
    const tokens=typeof input==='string'?tokenize(input):input;
    if(!Array.isArray(tokens)||tokens.length>limits.tokens)fail('QUOTA_EXCEEDED');
    list(tokens,limits.tokens);for(const token of tokens)object(token,['type','text','value','sourceId','property'],['type']);
    const output=[];
    for(let i=0;i<tokens.length;i++){
      const a=tokens[i-1],b=tokens[i],constant=t=>t?.type==='name'&&['π','pi'].includes(t.text);
      const permitted=a&&(a.type==='number'&&(constant(b)||b.type==='('||b.type==='source') || a.type===')'&&b.type==='(' || constant(a)&&b.type==='source');
      if(permitted)output.push({type:'*'});output.push(b);
    }
    return {ast:parseTokens(output),tokens:output};
  }
  function canonicalNumber(value){const decimal=String(value),scientific=value.toExponential();return scientific.length<decimal.length?scientific:decimal;}
  function buildPrint(ast) {
    const bindings=[];
    function visit(node){
      if(node.kind==='number')return canonicalNumber(node.value)+(node.unit?' '+unitText(node.unit):'');
      if(node.kind==='constant')return node.name;
      if(node.kind==='unit')return unitText(node.unit);
      if(node.kind==='source'){const index=bindings.push({sourceId:node.sourceId,property:node.property})-1;return '@'+index;}
      const precedence=n=>n.kind==='binary'?n.op==='^'?4:['*','/'].includes(n.op)?2:1:n.kind==='unary'?3:5;
      if(node.kind==='unary'){let text=visit(node.argument);if(precedence(node.argument)<3)text='('+text+')';return node.op+text;}
      if(node.kind==='binary'){
        const p=precedence(node),lp=precedence(node.left),rp=precedence(node.right);
        let left=visit(node.left),right=visit(node.right);
        if(lp<p||node.op==='^'&&(lp===p||node.left.kind==='number'&&node.left.unit))left='('+left+')';
        if(node.op==='^'?rp<3:rp<=p)right='('+right+')';
        return left+node.op+right;
      }
      return node.name+'('+node.args.map(visit).join(';')+')';
    }
    return Object.freeze({text:visit(ast),bindings:Object.freeze(bindings.map(Object.freeze))});
  }
  const print=input=>buildPrint(validate(input));
  function parsePrinted(input) {
    object(input,['text','bindings']);
    if(typeof input.text!=='string'||input.text.length>limits.characters||!Array.isArray(input.bindings)||input.bindings.length>limits.sources)fail('QUOTA_EXCEEDED');
    list(input.bindings,limits.sources);for(const binding of input.bindings)object(binding,['sourceId','property']);
    // References are positional typed tokens, never identifier/name lookup.
    const segments=input.text.split(/(@\d+)/),tokens=[];
    for(const segment of segments){if(!segment)continue;if(/^@\d+$/.test(segment)){const b=input.bindings[Number(segment.slice(1))];object(b,['sourceId','property']);tokens.push({type:'source',...b});}else tokens.push(...tokenize(segment));}
    return parseTokens(tokens);
  }
  const unitText=u=>u.factors?u.factors.map(unitText).join('*'):u.name+(u.exponent===1?'':'^'+u.exponent);
  const encode=ast=>JSON.stringify({schema:1,ast:validate(ast)});
  function decode(text){if(typeof text!=='string'||text.length>limits.bytes)fail('QUOTA_EXCEEDED');let v;try{v=JSON.parse(text);}catch{fail('INVALID_AST');}object(v,['schema','ast']);if(v.schema!==1)fail('INVALID_AST');return validate(v.ast);}
  return Object.freeze({limits,functions,properties,unitNames,object,list,unit,validate,tokenize,parseTokens,parse,normalizeInput,print,parsePrinted,encode,decode,unitText});
});
