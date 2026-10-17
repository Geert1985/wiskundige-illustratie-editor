'use strict';
// Research-only exact conic solver. Inputs are WIE-resolved Number values;
// each Number is interpreted as its exact IEEE-754 dyadic value.
const Q=require('./quartic-isolator.cjs');
const {R,parse:P,add:A,sub:S,mul:M,div:D,neg:N,cmp:C,poly,plus,scale,times}=Q;

function sourceFrame(source){
  if(!source||typeof source!=='object')throw Error('SOURCE_INVALID');
  let cx,cy,a,b,c,s,kind;
  if(source.type==='circle'){
    ({cx,cy}=source);a=b=source.r;c=1;s=0;kind='circle';
  }else if(source.type==='ellipse'){
    ({cx,cy,a,b}=source);
    if(![cx,cy,a,b].every(Number.isFinite))throw Error('SOURCE_INVALID');
    if(source.u&&source.v){
      c=source.u.x;s=source.u.y;
      if(![c,s,source.v.x,source.v.y].every(Number.isFinite)||source.v.x!==-s||source.v.y!==c)throw Error('SOURCE_INVALID');
    }else if(Number.isFinite(source.rotation)){c=Math.cos(source.rotation);s=Math.sin(source.rotation);}
    else throw Error('SOURCE_INVALID');
    if(b>a)throw Error('SOURCE_INVALID');
    kind='ellipse';
  }else throw Error('SOURCE_INVALID');
  if(![cx,cy,a,b,c,s].every(Number.isFinite)||!(a>0)||!(b>0))throw Error('SOURCE_INVALID');
  if(Math.max(Math.abs(cx),Math.abs(cy),a,b)>1e12)throw Error('SOURCE_INVALID');
  const halfX=kind==='circle'?a:Math.hypot(a*c,b*s),halfY=kind==='circle'?a:Math.hypot(a*s,b*c);
  if(!Number.isFinite(halfX)||!Number.isFinite(halfY)||cx-halfX < -1e12||cx+halfX > 1e12||cy-halfY < -1e12||cy+halfY > 1e12)throw Error('SOURCE_INVALID');
  const t={cx:P(cx),cy:P(cy),a:P(a),b:P(b),c:P(c),s:P(s),kind};
  const q=A(M(t.c,t.c),M(t.s,t.s));
  if(C(q,R(0))<=0)throw Error('SOURCE_INVALID');
  return t;
}

// Exact conic for the actual EllipseGeometry.pointAt affine frame. WIE computes
// u=(cos(rotation),sin(rotation)), v=(-u.y,u.x) in binary64. It does not
// renormalize u; q=c²+s² therefore remains in the equation.
function implicit(source){
  const t=sourceFrame(source),q=A(M(t.c,t.c),M(t.s,t.s));
  const ia=D(R(1),M(M(t.a,t.a),M(q,q))),ib=D(R(1),M(M(t.b,t.b),M(q,q)));
  const xx=A(M(M(t.c,t.c),ia),M(M(t.s,t.s),ib));
  const xy=M(R(2),M(M(t.c,t.s),S(ia,ib)));
  const yy=A(M(M(t.s,t.s),ia),M(M(t.c,t.c),ib));
  const x=N(A(M(R(2),M(xx,t.cx)),M(xy,t.cy)));
  const y=N(A(M(xy,t.cx),M(R(2),M(yy,t.cy))));
  const k=S(A(A(M(xx,M(t.cx,t.cx)),M(xy,M(t.cx,t.cy))),M(yy,M(t.cy,t.cy))),R(1));
  return {source:t,coefficients:[xx,xy,yy,x,y,k]};
}

function chart(t,B,sign){
  const den=poly([1,0,1]),cos=poly([sign,0,-sign]),sin=poly([0,2*sign]);
  const x=plus(scale(den,t.cx),plus(scale(cos,M(t.a,t.c)),scale(sin,N(M(t.b,t.s)))));
  const y=plus(scale(den,t.cy),plus(scale(cos,M(t.a,t.s)),scale(sin,M(t.b,t.c))));
  const terms=[times(x,x),times(x,y),times(y,y),times(x,den),times(y,den),times(den,den)];
  const p=terms.reduce((r,v,i)=>plus(r,scale(v,B[i])),poly([0]));
  return {p,x,y,den};
}
const encode=i=>[Q.str(i.lo),Q.str(i.hi)];

function solveConicIntersections(sourceA,sourceB,options={}){
  Q.budget(options);
  let first,second;
  try{first=sourceFrame(sourceA);second=implicit(sourceB).coefficients;}
  catch(e){return {status:e.message==='BUDGET'||e.message==='BIT_BUDGET'?'NUMERIC_UNRESOLVED':'SOURCE_INVALID',roots:null,reason:e.message,stats:Q.stats()};}
  try{
    const charts=[chart(first,second,1),chart(first,second,-1)];
    if(charts[0].p.every(c=>!c.n))return {status:'COINCIDENT_CONICS',roots:[],distinctRootCount:0,multiplicities:[],proof:'exact dyadic substitution is identically zero on a non-degenerate source conic',stats:Q.stats()};
    const roots=[];
    for(let index=0;index<2;index++){
      const ch=charts[index],isolated=Q.isolate(ch.p,options.precision??48);
      for(const box of isolated.intervals){
        // Charts meet at z=1 and z=-1. The right endpoint is excluded so each
        // shared geometric point is owned exactly once, without tolerances.
        if(C(box.lo,R(1))===0&&C(box.hi,R(1))===0)continue;
        const z=Q.interval(box.lo,box.hi),den=Q.iadd(Q.interval(R(1)),Q.imul(z,z));
        if(C(z.lo,R(0))<=0&&C(z.hi,R(0))>=0)den.lo=R(1);
        const lx=plus(ch.x,scale(ch.den,N(first.cx))),ly=plus(ch.y,scale(ch.den,N(first.cy)));
        const x=Q.iadd(Q.interval(first.cx),Q.idiv(Q.ieval(lx,z),den));
        const y=Q.iadd(Q.interval(first.cy),Q.idiv(Q.ieval(ly,z),den));
        if([x.lo,x.hi,y.lo,y.hi].some(v=>C(v,R(-1000000000000n))<0||C(v,R(1000000000000n))>0))throw Error('POSITION_ENCLOSURE_LIMIT');
        roots.push({chart:index,parameter:encode(z),position:{x:encode(x),y:encode(y)},multiplicity:box.multiplicity,proof:'exact dyadic source frame; exact quartic; squarefree Sturm root isolation; rational interval image'});
      }
    }
    roots.sort((a,b)=>a.chart-b.chart||Q.cmp(P(a.parameter[0]),P(b.parameter[0])));
    return {status:roots.length?'CERTIFIED_ROOTS':'CERTIFIED_NONE',roots,distinctRootCount:roots.length,multiplicities:roots.map(r=>r.multiplicity),sourceSemantics:'resolved Number fields interpreted as exact IEEE-754 dyadics; ellipse frame uses the unnormalized Math.cos/Math.sin outputs used by EllipseGeometry.pointAt',charts:charts.map(c=>c.p.map(Q.str)),stats:Q.stats()};
  }catch(e){return {status:'NUMERIC_UNRESOLVED',roots:null,reason:e.message,stats:Q.stats()};}
}

module.exports={solveConicIntersections,sourceFrame,implicit,chart};
