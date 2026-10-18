const OPS=new Set(['Add','Subtract','Multiply','Divide','Power','Sqrt','Sin','Cos','Tan']);
const RESERVED='wieSource';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function fail(code){throw Object.assign(new Error(code),{code});}
export function validateTree(node,table,{maxNodes=256,maxDepth=32,maxSources=64}={}){
 let count=0,refs=[];
 function walk(n,d=1){if(++count>maxNodes||d>maxDepth)fail('INPUT_LIMIT');if(typeof n==='string'){if(own(table,n)){refs.push(n);return {length:1};}if(n.startsWith(RESERVED))fail('UNKNOWN_BINDING');return {};}
 if(typeof n==='number')return {};if(!Array.isArray(n)||!OPS.has(n[0]))fail('UNSUPPORTED_EXPRESSION');const [op,...args]=n;const want=['Sqrt','Sin','Cos','Tan'].includes(op)?1:op==='Power'||op==='Subtract'||op==='Divide'?2:null;if((want!==null&&args.length!==want)||((op==='Add'||op==='Multiply')&&args.length<2))fail('UNSUPPORTED_EXPRESSION');const a=walk(args[0],d+1);
 if(op==='Sqrt'){if(Object.values(a).some(v=>v%2))fail('DIMENSION_CONFLICT');return Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v/2]).filter(([,v])=>v));}
 if(['Sin','Cos','Tan'].includes(op)){if(Object.keys(a).length&&!a.angle)fail('DIMENSION_CONFLICT');return {};}
 if(op==='Power'){const e=args[1];if(!Number.isInteger(e)||Math.abs(e)>8)fail('INVALID_POWER');return Object.fromEntries(Object.entries(a).map(([k,v])=>[k,v*e]).filter(([,v])=>v));}
 const b=walk(args[1],d+1);if(op==='Add'||op==='Subtract'){const keys=new Set([...Object.keys(a),...Object.keys(b)]);if([...keys].some(k=>(a[k]||0)!==(b[k]||0)))fail('DIMENSION_CONFLICT');return a;}
 const out={...a};for(const k of new Set([...Object.keys(a),...Object.keys(b)])){out[k]=(a[k]||0)+(op==='Multiply'?1:-1)*(b[k]||0);if(!out[k])delete out[k];}return out;
 }
 const dimension=walk(node);if(refs.length>maxSources)fail('INPUT_LIMIT');return {dimension,refs:Object.freeze([...new Set(refs)]),nodes:count};
}
function substitute(node,values){if(typeof node==='string')return own(values,node)?values[node]:node;if(!Array.isArray(node))return node;return node.map((x,i)=>i===0?x:substitute(x,values));}
export function evaluateBoundMathJson(engine,tree,bindings,provider,options={}){
 if(!Array.isArray(bindings))fail('INVALID_BINDINGS');const table=Object.create(null);
 for(const b of bindings){if(!b||typeof b.token!=='string'||!b.token.startsWith(RESERVED)||typeof b.sourceId!=='string'||!Number.isSafeInteger(b.instanceGeneration)||typeof b.property!=='string'||own(table,b.token))fail('INVALID_BINDING');table[b.token]=b;}
 const analysis=validateTree(tree,table,options);const values=Object.create(null);
 for(const token of analysis.refs){const b=table[token];try{const q=provider.resolve(b);if(q.instanceGeneration!==b.instanceGeneration||!Number.isFinite(q.value))fail('SOURCE_UNAVAILABLE');values[token]=q.value;}catch{fail('SOURCE_UNAVAILABLE');}}
 const evaluated=engine.box(substitute(tree,values)).evaluate();if(!evaluated?.isValid||evaluated.isNaN||evaluated.isInfinity)fail('CALCULATION_FAILED');return {expression:evaluated,dimension:analysis.dimension,refs:analysis.refs,sourceQuality:analysis.refs.length?'measured':'symbolic'};
}
export function sourceLatex(token){if(!token?.startsWith(RESERVED)||!/^[A-Za-z0-9]+$/.test(token))fail('INVALID_BINDING');return `\\mathrm{${token}}`;}
export function evaluateMathLiveLatex(engine,latex,bindings,provider,options={}){if(typeof latex!=='string'||latex.length>(options.maxCharacters||2048))fail('INPUT_LIMIT');let parsed;try{parsed=engine.parse(latex);}catch{fail('INVALID_MATH');}if(!parsed?.isValid)fail('INVALID_MATH');return evaluateBoundMathJson(engine,parsed.json,bindings,provider,options);}
