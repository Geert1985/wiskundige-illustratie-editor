'use strict';
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
global.window={FZI:{MathIllustration:{}}};require('../../ellipse-geometry.js');
const EG=window.FZI.MathIllustration.EllipseGeometry,solve=require('./conic-intersections.cjs').solveConicIntersections;
const deg=x=>x*Math.PI/180, circle=(cx,cy,r)=>({type:'circle',cx,cy,r}), ellipse=(cx,cy,a,b,rotation=0)=>({type:'ellipse',cx,cy,a,b,rotation});
const resolved=x=>{if(x.type!=='ellipse')return x;const g=EG.fromDefinition(x).geometry;return {...x,u:g.u,v:g.v};};
const cases=[
 {id:'P1-four-roots',a:circle(0,0,1.25),b:ellipse(0,0,2,.5),status:'CERTIFIED_ROOTS',count:4},
 {id:'P2-45-degree',a:circle(0,0,1.25),b:ellipse(0,0,2,.5,deg(45)),status:'CERTIFIED_ROOTS',count:4},
 {id:'P3-one-tangent',a:circle(0,0,1),b:ellipse(.5,0,.5,.4),status:'CERTIFIED_ROOTS',count:1},
 {id:'P4-fourth-order',a:circle(0,0,1),b:ellipse(0,.75,.5,.25),status:'CERTIFIED_ROOTS',count:1},
 {id:'P5-close-pair',a:circle(0,0,1),b:ellipse(.5+2**-53,0,.5,.4),status:'CERTIFIED_ROOTS',count:2,options:{precision:80}}
];
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
const results=[];
for(const t of cases){
 const a=resolved(t.a),b=resolved(t.b),options={precision:48,operations:150000,bits:16384,...t.options};
 const warm=solve(a,b,options);
 const samples=[],counts=[];let status=warm.status;
 for(let i=0;i<5;i++){const start=performance.now(),r=solve(a,b,options),elapsed=performance.now()-start;samples.push(Number(elapsed.toFixed(3)));counts.push(r.stats?.operations??null);status=r.status;if(r.status!==t.status||r.distinctRootCount!==t.count)throw Error(`${t.id}: ${r.status} ${r.reason||''}`);}
 const row={id:t.id,warmupStatus:warm.status,warmupOperations:warm.stats?.operations??null,status,rootCount:warm.distinctRootCount??null,measuredRuns:5,medianMs:median(samples),maxMs:Math.max(...samples),samplesMs:samples,operations:counts};
 results.push(row);fs.writeFileSync(path.join(__dirname,'fixtures','performance-results.json'),JSON.stringify({node:process.version,results},null,2)+'\n');
 process.stdout.write(JSON.stringify(row)+'\n');
}
