const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
const {runtime}=require('../../tests/helpers.cjs'),fixture=require('./fixtures.cjs'),MI=runtime().MI;
const rows=[];
for(const count of [10,100,500]){
  const engine=new MI.Engine(fixture(count)),transform=new MI.CoordinateTransform(engine.renderer),sample=()=>MI.SnapService.resolve(engine,{x:.23,y:.31},{transform});
  let t=performance.now();sample();const coldMs=performance.now()-t;
  const times=[];for(let i=0;i<15;i++){t=performance.now();sample();times.push(performance.now()-t);}const sorted=times.slice().sort((a,b)=>a-b);
  rows.push({objects:count,snapCandidates:MI.SnapService.candidates(engine).length,coldMs,warmMeanMs:times.reduce((a,b)=>a+b,0)/times.length,warmMedianMs:sorted[7],warmP95Ms:sorted[14]});
}
const result={node:process.version,warmSamples:15,rows};fs.writeFileSync(path.join(__dirname,'node-snap-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
