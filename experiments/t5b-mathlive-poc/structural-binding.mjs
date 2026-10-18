const OPS=new Set(['Add','Subtract','Multiply','Divide','Power','Sqrt','Sin','Cos','Tan']);
const RESERVED='wieSource';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function fail(code){throw Object.assign(new Error(code),{code});}
export function validateTree(node,table,{maxNodes=256,maxDepth=32,maxSources=64}={}){
 let count=0,sourceCount=0;const refs=[];
 function walk(n,depth=1){
  if(++count>maxNodes||depth>maxDepth)fail('INPUT_LIMIT');
  if(typeof n==='string'){if(own(table,n)){if(++sourceCount>maxSources)fail('INPUT_LIMIT');refs.push(n);return {length:1};}if(n.startsWith(RESERVED))fail('UNKNOWN_BINDING');return {};}
  if(typeof n==='number'){if(!Number.isFinite(n))fail('INVALID_NUMBER');return {};}
  if(!Array.isArray(n)||typeof n[0]!=='string'||!OPS.has(n[0]))fail('UNSUPPORTED_EXPRESSION');
  const [op,...args]=n;
  if((['Add','Multiply'].includes(op)&&args.length<2)||(['Subtract','Divide','Power'].includes(op)&&args.length!==2)||(['Sqrt','Sin','Cos','Tan'].includes(op)&&args.length!==1))fail('UNSUPPORTED_EXPRESSION');
  // Visit every operand before deriving the result dimension. Nothing reaches CortexJS until this completes.
  const childDimensions=args.map(arg=>walk(arg,depth+1));
  if(op==='Add'||op==='Subtract'){
   const first=childDimensions[0],keys=new Set(childDimensions.flatMap(d=>Object.keys(d)));
   if(childDimensions.some(d=>[...keys].some(k=>(d[k]||0)!==(first[k]||0))))fail('DIMENSION_CONFLICT');
   return first;
  }
  if(op==='Multiply'||op==='Divide'){
   const out={};for(let i=0;i<childDimensions.length;i++)for(const [k,v] of Object.entries(childDimensions[i])){out[k]=(out[k]||0)+(op==='Multiply'||i===0?v:-v);if(!out[k])delete out[k];}return out;
  }
  if(op==='Power'){
   const exponent=args[1];if(typeof exponent!=='number'||!Number.isInteger(exponent)||Math.abs(exponent)>8)fail('INVALID_POWER');
   return Object.fromEntries(Object.entries(childDimensions[0]).map(([k,v])=>[k,v*exponent]).filter(([,v])=>v));
  }
  if(op==='Sqrt'){if(Object.values(childDimensions[0]).some(v=>v%2))fail('DIMENSION_CONFLICT');return Object.fromEntries(Object.entries(childDimensions[0]).map(([k,v])=>[k,v/2]).filter(([,v])=>v));}
  if(['Sin','Cos','Tan'].includes(op)){const d=childDimensions[0];if(Object.keys(d).length&&!(Object.keys(d).length===1&&d.angle===1))fail('DIMENSION_CONFLICT');return {};}
 }
 const dimension=walk(node);return {dimension,refs:Object.freeze([...new Set(refs)]),sourceReferences:sourceCount,nodes:count};
}function substitute(node,values){if(typeof node==='string')return own(values,node)?values[node]:node;if(!Array.isArray(node))return node;return node.map((x,i)=>i===0?x:substitute(x,values));}
export function evaluateBoundMathJson(engine,tree,bindings,provider,options={}){
 if(!Array.isArray(bindings))fail('INVALID_BINDINGS');const table=Object.create(null);
 for(const b of bindings){if(!b||typeof b.token!=='string'||!b.token.startsWith(RESERVED)||typeof b.sourceId!=='string'||!Number.isSafeInteger(b.instanceGeneration)||typeof b.property!=='string'||own(table,b.token))fail('INVALID_BINDING');table[b.token]=b;}
 const analysis=validateTree(tree,table,options);const values=Object.create(null);
 for(const token of analysis.refs){const b=table[token];try{const q=provider.resolve(b);if(q.instanceGeneration!==b.instanceGeneration||!Number.isFinite(q.value))fail('SOURCE_UNAVAILABLE');values[token]=q.value;}catch{fail('SOURCE_UNAVAILABLE');}}
 const evaluated=engine.box(substitute(tree,values)).evaluate();if(!evaluated?.isValid||evaluated.isNaN||evaluated.isInfinity)fail('CALCULATION_FAILED');return {expression:evaluated,dimension:analysis.dimension,refs:analysis.refs,sourceQuality:analysis.refs.length?'measured':'symbolic'};
}
export function sourceLatex(token){if(!token?.startsWith(RESERVED)||!/^[A-Za-z0-9]+$/.test(token))fail('INVALID_BINDING');return `\\mathrm{${token}}`;}
export function evaluateMathLiveLatex(engine,latex,bindings,provider,options={}){if(typeof latex!=='string'||latex.length>(options.maxCharacters||2048))fail('INPUT_LIMIT');let parsed;try{parsed=engine.parse(latex);}catch{fail('INVALID_MATH');}if(!parsed?.isValid)fail('INVALID_MATH');return evaluateBoundMathJson(engine,parsed.json,bindings,provider,options);}
