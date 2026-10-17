const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),fixture=require('../perf-1.1/fixtures.cjs'),root=path.resolve(__dirname,'../..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(e,data)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});
const stats=values=>{if(!values.length)return {count:0,median:null,p95:null};const sorted=values.slice().sort((a,b)=>a-b),at=p=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)];return {count:values.length,median:+at(.5).toFixed(3),p95:+at(.95).toFixed(3)};};
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});await page.route('https://fonts.googleapis.com/**',route=>route.abort());await page.goto(`http://127.0.0.1:${server.address().port}/editor.html`);
 const results=[];
 for(const count of [10,100,500]){
  const data=fixture(count),result=await page.evaluate(async data=>{
   const MI=FZI.MathIllustration,app=MI.editor,measure={render:[],canvas:[],svg:[],dom:[],list:[],inspector:[]},restore=[];
   const stat=values=>{if(!values.length)return {count:0,median:null,p95:null};const sorted=values.slice().sort((a,b)=>a-b),at=p=>sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1)];return {count:values.length,median:+at(.5).toFixed(3),p95:+at(.95).toFixed(3)};};
   const wrap=(owner,key,name)=>{const original=owner[key];owner[key]=function(...args){const start=performance.now();try{return original.apply(this,args);}finally{measure[name].push(performance.now()-start);}};restore.push(()=>owner[key]=original);};
   wrap(app,'render','render');wrap(app,'renderCanvas','canvas');wrap(app,'renderViewList','list');wrap(app,'renderInspector','inspector');wrap(MI.SvgRenderer.prototype,'render','svg');
   const descriptor=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');Object.defineProperty(Element.prototype,'innerHTML',{...descriptor,set(value){const start=performance.now();try{return descriptor.set.call(this,value);}finally{if(this.id==='canvas')measure.dom.push(performance.now()-start);}}});
   const reset=()=>Object.values(measure).forEach(values=>values.length=0),summarize=()=>Object.fromEntries(Object.entries(measure).map(([key,values])=>[key,stat(values)]));
   app.loadDocument(data);await new Promise(requestAnimationFrame);reset();
   const full=[];for(let i=0;i<3;i++){const start=performance.now();app.render();full.push(performance.now()-start);}const fullPhase=summarize();reset();
   const bounds=app.engine.renderer.bounds,pan=[];for(let i=0;i<10;i++){const t=performance.now(),dx=(bounds.xMax-bounds.xMin)*.001*i;app.engine.renderer.setBounds({xMin:bounds.xMin+dx,xMax:bounds.xMax+dx,yMin:bounds.yMin,yMax:bounds.yMax});app.invalidate('viewport');pan.push(performance.now()-t);}const panPhase=summarize();reset();
   const rect=app.nodes.canvas.getBoundingClientRect(),zoom=[];for(let i=0;i<10;i++){const t=performance.now();app.zoom({deltaY:1,clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2,preventDefault(){},stopImmediatePropagation(){}});zoom.push(performance.now()-t);}const zoomPhase=summarize();
   const output={objects:data.objects.length,fullRender:{external:stat(full),parts:fullPhase},pan:{external:stat(pan),parts:panPhase},zoom:{external:stat(zoom),parts:zoomPhase},svgElements:app.nodes.canvas.querySelector('svg')?.querySelectorAll('*').length||0};
   Object.defineProperty(Element.prototype,'innerHTML',descriptor);restore.reverse().forEach(fn=>fn());return output;
  },data);results.push(result);console.log(JSON.stringify(result));
 }
 const report={browser:await page.evaluate(()=>navigator.userAgent),viewport:{width:1280,height:900},fixture:'PERF-1.1 mixed',repetitions:{full:3,pan:10,zoom:10},results};
 fs.writeFileSync(path.join(__dirname,'render-invalidation-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser?.close();server.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
