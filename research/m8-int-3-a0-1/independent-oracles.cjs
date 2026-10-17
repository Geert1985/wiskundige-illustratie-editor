'use strict';
// Independent analytic checks; intentionally does not import the solver.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const matrix=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures','matrix-results.json'),'utf8'));
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b)[a,b]=[b,a%b];return a;}
function R(n,d=1n){n=BigInt(n);d=BigInt(d);if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
function dyadic(x){const b=new ArrayBuffer(8),v=new DataView(b);v.setFloat64(0,x);const bits=v.getBigUint64(0),sign=(bits>>63n)?-1n:1n,ex=Number((bits>>52n)&2047n),m=(bits&((1n<<52n)-1n))+(ex?1n<<52n:0n),p=(ex||1)-1023-52;return p>=0?R(sign*m*(1n<<BigInt(p))):R(sign*m,1n<<BigInt(-p));}
function add(a,b){return R(a.n*b.d+b.n*a.d,a.d*b.d);}
function mul(a,b){return R(a.n*b.n,a.d*b.d);}
function cmp(a,b){const d=a.n*b.d-b.n*a.d;return d<0n?-1:d>0n?1:0;}
const byId=new Map(matrix.results.map(r=>[r.id,r]));
const rotationRows=[];
for(const id of ['NUM-008','NUM-009','NUM-010','NUM-011']){
  const row=byId.get(id),c=dyadic(row.resolvedFrames.b.c),s=dyadic(row.resolvedFrames.b.s);
  const q=add(mul(c,c),mul(s,s)),a=dyadic(row.input.b.a),b=dyadic(row.input.b.b),radius=dyadic(row.input.a.r);
  const min2=mul(mul(b,b),q),max2=mul(mul(a,a),q),r2=mul(radius,radius);
  assert(cmp(min2,r2)<0&&cmp(r2,max2)<0,`${id}: circle radius must lie strictly between ellipse radial extrema`);
  assert.equal(row.status,'CERTIFIED_ROOTS');assert.equal(row.count,4);
  const delta=Number(q.n-q.d)/Number(q.d),rhoDelta=delta/(Math.sqrt(1+delta)+1),angleDeg=-Math.atan2(row.resolvedFrames.b.s,row.resolvedFrames.b.c)*180/Math.PI,roundedDeg=Math.round(angleDeg*1e6)/1e6;
  const frameScaleError=Math.max(row.input.b.a,row.input.b.b)*Math.abs(rhoDelta);
  const svgAngleError=Math.max(row.input.b.a,row.input.b.b)*Math.abs((angleDeg-roundedDeg)*Math.PI/180);
  rotationRows.push({id,oracle:'radial norm is strictly monotone on each principal quadrant; endpoint radii bracket the circle exactly',qMinusOne:delta,distinctIntersections:4,pointAtVsSvgFrameBound:frameScaleError,svgSixDecimalAngleBound:svgAngleError});
}
// For NUM-007: on the unit circle, the second conic differs by 3(y-1)^2.
// It meets at (0,1) only, and y-1 has a quadratic zero in the circle's local
// tangent parameter there, giving intersection multiplicity four.
const fourth=byId.get('NUM-007');
assert.equal(fourth.status,'CERTIFIED_ROOTS');assert.equal(fourth.count,1);assert.deepEqual(fourth.multiplicities,[4]);
assert.deepEqual(fourth.input.b,{type:'ellipse',cx:0,cy:.75,a:.5,b:.25,rotation:0});
const result={oracle:'independent exact-rational endpoint comparison plus analytic quadrant monotonicity; fourth-order case by explicit contour identity',rotations:rotationRows,fourthOrder:{id:'NUM-007',distinctIntersections:1,multiplicity:4,identity:'F_ellipse-F_circle = 3(y-1)^2 on the unit circle'} };
fs.writeFileSync(path.join(__dirname,'fixtures','independent-oracles.json'),JSON.stringify(result,null,2)+'\n');
process.stdout.write(JSON.stringify(result,null,2)+'\n');
