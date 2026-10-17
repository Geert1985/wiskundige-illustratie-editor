'use strict';
// RESEARCH ONLY: exact rational arithmetic; no production imports.
let work=0,limit=1000000,maxBits=16384;
function budget(options={}){work=0;
limit=options.operations??1000000;
maxBits=options.bits??16384;
}
function gcd(a,b){a=a<0n?-a:a;
b=b<0n?-b:b;
while(b){[a,b]=[b,a%b];
}return a;
}
function R(n,d=1n){if(++work>limit)throw Error('BUDGET');
n=BigInt(n);
d=BigInt(d);
if(!d)throw Error('DIV_ZERO');
if(d<0n){n=-n;
d=-d;
}const g=gcd(n,d);
n/=g;
d/=g;
if(n.toString(2).length>maxBits||d.toString(2).length>maxBits)throw Error('BIT_BUDGET');
return {n,d};
}
function parse(x){if(x&&typeof x.n==='bigint')return x;
if(typeof x==='bigint')return R(x);
if(typeof x==='number'){if(!Number.isFinite(x))throw Error('SOURCE_INVALID');
if(x===0)return R(0);
const view=new DataView(new ArrayBuffer(8));
view.setFloat64(0,x);
const bits=view.getBigUint64(0),sign=bits>>63n?-1n:1n,exp=Number((bits>>52n)&2047n),mant=(bits&((1n<<52n)-1n))+(exp?1n<<52n:0n),power=(exp||1)-1023-52;
return power>=0?R(sign*mant*(1n<<BigInt(power))):R(sign*mant,1n<<BigInt(-power));
}if(typeof x!=='string')throw Error('SOURCE_INVALID');
if(x.includes('/')){const [a,b,...extra]=x.split('/');
if(extra.length)throw Error('SOURCE_INVALID');
return R(a,b);
}if(!/^-?\d+(\.\d+)?$/.test(x))throw Error('SOURCE_INVALID');
const [a,b='']=x.split('.');
return R(BigInt(a+b),10n**BigInt(b.length));
}
const add=(a,b)=>R(a.n*b.d+b.n*a.d,a.d*b.d),neg=a=>R(-a.n,a.d),sub=(a,b)=>add(a,neg(b)),mul=(a,b)=>R(a.n*b.n,a.d*b.d),div=(a,b)=>R(a.n*b.d,a.d*b.n),cmp=(a,b)=>{const d=a.n*b.d-b.n*a.d;
return d<0n?-1:d>0n?1:0;
},str=a=>a.d===1n?String(a.n):a.n+'/'+a.d;
const zero=()=>R(0),one=()=>R(1);
function trim(p){while(p.length>1&&!p.at(-1).n)p.pop();
return p;
}
const poly=p=>trim(p.map(parse));
function plus(a,b){return trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>add(a[i]||zero(),b[i]||zero())));
}
const scale=(p,c)=>trim(p.map(x=>mul(x,c)));
function times(a,b){const r=Array.from({length:a.length+b.length-1},zero);
a.forEach((x,i)=>b.forEach((y,j)=>r[i+j]=add(r[i+j],mul(x,y))));
return trim(r);
}
const derivative=p=>p.length===1?[zero()]:p.slice(1).map((x,i)=>mul(x,R(i+1)));
const evaluate=(p,x)=>p.reduceRight((v,c)=>add(mul(v,x),c),zero());
function division(a,b){a=a.slice();
if(b.length===1&&!b[0].n)throw Error('DIV_ZERO');
const q=Array.from({length:Math.max(1,a.length-b.length+1)},zero);
while(a.length>=b.length&&a.some(c=>c.n)){const i=a.length-b.length,c=div(a.at(-1),b.at(-1));
q[i]=c;
for(let j=0;
j<b.length;
j++)a[i+j]=sub(a[i+j],mul(c,b[j]));
trim(a);
}return [trim(q),trim(a)];
}
const monic=p=>scale(p,div(one(),p.at(-1)));
function pgcd(a,b){while(b.some(x=>x.n)){[a,b]=[b,division(a,b)[1]];
}return monic(a);
}
function sturm(p){const seq=[p,derivative(p)];
while(seq.at(-1).some(c=>c.n)){const r=scale(division(seq.at(-2),seq.at(-1))[1],R(-1));
if(!r.some(c=>c.n))break;
seq.push(r);
}return seq;
}
function variation(seq,x){const signs=seq.map(p=>evaluate(p,x).n).filter(n=>n!==0n).map(n=>n>0n?1:-1);
return signs.slice(1).filter((s,i)=>s!==signs[i]).length;
}
function count(p,a,b){const seq=sturm(p);
return variation(seq,a)-variation(seq,b);
}
function isolate(input,precision=40){const original=poly(input);
if(original.length===1)return {polynomial:original,intervals:[],squarefree:original};
const common=pgcd(original,derivative(original)),sf=division(original,common)[0],lo=R(-1),hi=R(1),intervals=[];
let p=sf.slice();
for(const endpoint of [lo,hi])if(!evaluate(p,endpoint).n){intervals.push({lo:endpoint,hi:endpoint});
p=division(p,[neg(endpoint),one()])[0];
}
 const target=R(1,1n<<BigInt(precision));
 function walk(f,a,b,depth=0,sequence=sturm(f)){if(depth>4096)throw Error('DEPTH_BUDGET');
const n=variation(sequence,a)-variation(sequence,b);
if(!n)return;
if(n===1&&evaluate(sf,a).n&&evaluate(sf,b).n&&cmp(sub(b,a),target)<=0){intervals.push({lo:a,hi:b});
return;
}const m=div(add(a,b),R(2));
if(!evaluate(f,m).n){intervals.push({lo:m,hi:m});
const q=division(f,[neg(m),one()])[0];
const qSequence=sturm(q);
walk(q,a,m,depth+1,qSequence);
walk(q,m,b,depth+1,qSequence);
return;
}walk(f,a,m,depth+1);
walk(f,m,b,depth+1);
}
 if(p.length>1)walk(p,lo,hi);
intervals.sort((a,b)=>cmp(a.lo,b.lo));
for(const box of intervals){let multiplicity=1,g=common;
while(g.length>1){const h=division(g,pgcd(g,derivative(g)))[0],contains=cmp(box.lo,box.hi)===0?!evaluate(h,box.lo).n:count(h,box.lo,box.hi)>0;
if(!contains)break;
multiplicity++;
g=pgcd(g,derivative(g));
}box.multiplicity=multiplicity;
}return {polynomial:original,squarefree:sf,intervals};
}
const interval=(lo,hi=lo)=>({lo,hi});
const iadd=(a,b)=>interval(add(a.lo,b.lo),add(a.hi,b.hi));
function imul(a,b){const v=[mul(a.lo,b.lo),mul(a.lo,b.hi),mul(a.hi,b.lo),mul(a.hi,b.hi)].sort(cmp);
return interval(v[0],v[3]);
}
function idiv(a,b){if(cmp(b.lo,zero())<=0&&cmp(b.hi,zero())>=0)throw Error('INTERVAL_ZERO');
return imul(a,interval(div(one(),b.hi),div(one(),b.lo)));
}
function ieval(p,x){return p.reduceRight((a,c)=>iadd(imul(a,x),interval(c)),interval(zero()));
}
module.exports={R,parse,add,sub,mul,div,neg,cmp,str,zero,one,poly,plus,times,scale,derivative,evaluate,division,pgcd,isolate,count,interval,iadd,imul,idiv,ieval,budget,stats:()=>({operations:work})};
