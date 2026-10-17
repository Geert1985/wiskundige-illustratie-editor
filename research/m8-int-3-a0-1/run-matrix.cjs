'use strict';
const assert=require('node:assert/strict');
const {solveConicIntersections:solve}=require('./conic-intersections.cjs');
const S=require('./quartic-isolator.cjs');
global.window={FZI:{MathIllustration:{}}};
require('../../ellipse-geometry.js');
const EG=window.FZI.MathIllustration.EllipseGeometry;
const pi=Math.PI,deg=x=>x*pi/180;
const circle=(cx,cy,r)=>({type:'circle',cx,cy,r});
const ellipse=(cx,cy,a,b,rotation=0)=>({type:'ellipse',cx,cy,a,b,rotation});
function resolveEllipse(source){const r=EG.fromDefinition(source);return r.reasonCode==='VALID'?{...source,u:r.geometry.u,v:r.geometry.v}:source;}
function setupResolvedEllipse(){
  const g=EG.resolve({kind:'ellipseByFociAndSum',sumDistance:10},[
    {type:'point',x:-3,y:1},{type:'point',x:3,y:1}
  ]).geometry;
  return {type:'ellipse',cx:g.center.x,cy:g.center.y,a:g.a,b:g.b,rotation:g.rotation,u:g.u,v:g.v};
}
const qv=(v)=>{const [lo,hi]=v;return S.interval(S.parse(lo),S.parse(hi));};
function residualBox(coeff,x,y){
  const [xx,xy,yy,lx,ly,k]=coeff;
  const x2=S.imul(x,x),y2=S.imul(y,y),xyv=S.imul(x,y);
  return [S.imul(S.interval(xx),x2),S.imul(S.interval(xy),xyv),S.imul(S.interval(yy),y2),S.imul(S.interval(lx),x),S.imul(S.interval(ly),y),S.interval(k)].reduce(S.iadd,S.interval(S.zero()));
}
const closeDelta=2**-53;
const cases=[
  {id:'NUM-001',name:'circle ellipse disjoint',a:circle(0,0,1),b:ellipse(4,0,2,1),status:'CERTIFIED_NONE',count:0},
  {id:'NUM-002',name:'ordinary two intersections',a:circle(0,0,2),b:ellipse(1,0,2,2),status:'CERTIFIED_ROOTS',count:2},
  {id:'NUM-003',name:'four crossings',a:circle(0,0,1.25),b:ellipse(0,0,2,.5),status:'CERTIFIED_ROOTS',count:4},
  {id:'NUM-004',name:'one external tangent',a:circle(0,0,1),b:ellipse(.5,0,.5,.4),status:'CERTIFIED_ROOTS',count:1,multiplicities:[2]},
  {id:'NUM-005',name:'two separate tangencies',a:circle(0,0,1),b:ellipse(0,0,2,1),status:'CERTIFIED_ROOTS',count:2,multiplicities:[2,2]},
  {id:'NUM-006',name:'one tangent and two simple crossings',a:circle(0,0,1),b:ellipse(-1,0,2,.5),status:'CERTIFIED_ROOTS',count:3,multiplicities:[1,1,2]},
  {id:'NUM-007',name:'fourth-order contact',a:circle(0,0,1),b:ellipse(0,.75,.5,.25),status:'CERTIFIED_ROOTS',count:1,multiplicities:[4]},
  {id:'NUM-008',name:'15 degree resolved rotation',a:circle(0,0,1.25),b:ellipse(0,0,2,.5,deg(15)),status:'CERTIFIED_ROOTS',count:4},
  {id:'NUM-009',name:'45 degree resolved rotation',a:circle(0,0,1.25),b:ellipse(0,0,2,.5,deg(45)),status:'CERTIFIED_ROOTS',count:4},
  {id:'NUM-010',name:'60 degree resolved rotation',a:circle(0,0,1.25),b:ellipse(0,0,2,.5,deg(60)),status:'CERTIFIED_ROOTS',count:4},
  {id:'NUM-011',name:'90 degree resolved rotation',a:circle(0,0,1.25),b:ellipse(0,0,2,.5,deg(90)),status:'CERTIFIED_ROOTS',count:4},
  {id:'NUM-012',name:'differently rotated ellipses; bounded exploratory edge',a:ellipse(-.25,.1,2,.75,deg(15)),b:ellipse(.25,-.1,1.7,.6,deg(60)),status:'NUMERIC_UNRESOLVED',count:null,options:{operations:4000}},
  {id:'NUM-013',name:'identical contours',a:ellipse(1,-2,3,1,deg(45)),b:ellipse(1,-2,3,1,deg(45)),status:'COINCIDENT_CONICS',count:0},
  {id:'NUM-014',name:'near-coincident contours',a:ellipse(0,0,2,1,0),b:ellipse(2**-40,0,2,1,0),status:'CERTIFIED_ROOTS',count:2},
  {id:'NUM-015',name:'close pair next to former tangent',a:circle(0,0,1),b:ellipse(.5+closeDelta,0,.5,.4),status:'CERTIFIED_ROOTS',count:2},
  {id:'NUM-016',name:'roots on rational chart boundary',a:circle(0,0,1),b:ellipse(0,0,2,1,0),status:'CERTIFIED_ROOTS',count:2,multiplicities:[2,2]},
  {id:'NUM-017',name:'circle-shaped ellipse',a:circle(0,0,1),b:ellipse(.25,-.1,.8,.8,deg(37)),status:'CERTIFIED_ROOTS',count:2},
  {id:'NUM-018',name:'resolved focus-defined ellipse',a:circle(0,1,4.5),b:setupResolvedEllipse(),status:'CERTIFIED_ROOTS',count:4},
  {id:'NUM-019',name:'invalid overflow source',a:circle(0,0,1),b:ellipse(0,0,Number.MAX_VALUE,1,0),status:'SOURCE_INVALID',count:null},
  {id:'NUM-020',name:'operation budget exhaustion',a:circle(0,0,1.25),b:ellipse(0,0,2,.5,deg(45)),status:'NUMERIC_UNRESOLVED',count:null,options:{operations:8}}
];
const selected=process.env.MATRIX_ONLY?cases.filter(t=>t.id===process.env.MATRIX_ONLY):cases;

function run(){
 const outputPath=require('node:path').join(__dirname,'fixtures','matrix-results.json');
 const previous=selected.length<cases.length&&require('node:fs').existsSync(outputPath)?JSON.parse(require('node:fs').readFileSync(outputPath,'utf8')).results:[];
 const selectedIds=new Set(selected.map(t=>t.id));
 const results=previous.filter(r=>!selectedIds.has(r.id));
 for(const t of selected){
   process.stdout.write(`${t.id} start\n`);
   const sourceA=t.a.type==='ellipse'?resolveEllipse(t.a):t.a;
   const sourceB=t.b.type==='ellipse'?resolveEllipse(t.b):t.b;
   const r=solve(sourceA,sourceB,{precision:t.id==='NUM-015'?80:48,operations:150000,bits:16384,...t.options});
   const expectedStatus=t.id==='NUM-020'?'NUMERIC_UNRESOLVED':t.status;
   assert.equal(r.status,expectedStatus,`${t.id} status: ${r.status} ${r.reason||''}`);
   if(t.count!==null){assert.equal(r.distinctRootCount,t.count,`${t.id} root count`);assert.equal(r.roots.length,t.count,`${t.id} root list`);}
   else assert.equal(r.roots,null,`${t.id} must not expose a partial root set`);
   if(t.multiplicities)assert.deepEqual([...r.multiplicities].sort((a,b)=>a-b),[...t.multiplicities].sort((a,b)=>a-b),`${t.id} multiplicity`);
   if(r.roots)for(const root of r.roots){
     const x=qv(root.position.x),y=qv(root.position.y);
     for(const source of [sourceA,sourceB]){
       const residual=residualBox(require('./conic-intersections.cjs').implicit(source).coefficients,x,y);
       assert(S.cmp(residual.lo,S.zero())<=0&&S.cmp(residual.hi,S.zero())>=0,`${t.id} output box excludes a source conic`);
     }
   }
   const frame=(s)=>s.type==='ellipse'&&s.u?{c:s.u.x,s:s.u.y}:null;
   results.push({id:t.id,name:t.name,input:{a:t.a,b:t.b,options:t.options??{}},resolvedFrames:{a:frame(sourceA),b:frame(sourceB)},status:r.status,count:r.distinctRootCount??null,multiplicities:r.multiplicities??null,reason:r.reason??null,operations:r.stats?.operations??null,rootBoxes:r.roots?.map(x=>({chart:x.chart,parameter:x.parameter,position:x.position,multiplicity:x.multiplicity}))??null});
   require('node:fs').writeFileSync(outputPath,JSON.stringify({node:process.version,tests:results.length,passed:results.length,results},null,2)+'\n');
   process.stdout.write(`${t.id} ${r.status}\n`);
 }
 const report={node:process.version,tests:results.length,passed:results.length,results};
 require('node:fs').writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
 process.stdout.write(`SUMMARY ${results.length}/${results.length} assertions passed\n`+results.map(x=>`${x.id}\t${x.status}\t${x.count??'—'}\t${x.multiplicities?.join(',')??'—'}\t${x.operations??'—'}`).join('\n')+'\n');
}
run();
