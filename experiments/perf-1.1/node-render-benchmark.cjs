const { performance } = require('node:perf_hooks');
const fs = require('node:fs'), path = require('node:path');
const { runtime } = require('../../tests/helpers.cjs');
const fixture = require('./fixtures.cjs'), MI = runtime().MI;
const rows=[];
for(const count of [10,100,500,1000,2000]){
  const engine=new MI.Engine(fixture(count));
  for(let i=0;i<2;i++)engine.renderSVG();
  const times=[],sizes=[];
  for(let i=0;i<7;i++){const t=performance.now(),svg=engine.renderSVG();times.push(performance.now()-t);sizes.push(Buffer.byteLength(svg));}
  const sorted=times.slice().sort((a,b)=>a-b);rows.push({objects:count,svgBytes:sizes[0],meanMs:times.reduce((a,b)=>a+b,0)/times.length,medianMs:sorted[3],p95Ms:sorted[6],heapUsedBytes:process.memoryUsage().heapUsed});
}
const result={node:process.version,repetitions:7,warmups:2,rows};
fs.writeFileSync(path.join(__dirname,'node-render-results.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
