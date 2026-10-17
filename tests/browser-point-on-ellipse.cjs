// Real Edge coverage for M8a-2 source placement, contextual construction and linked dragging.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const {fixture}=require('./permission-fixtures.cjs');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});});

module.exports=async page=>{
 const errors=[];const onError=error=>errors.push(error.message);page.on('pageerror',onError);
 try{
  await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.newDocument();a.engine.add({id:'F1',type:'point',x:-3,y:0});a.engine.add({id:'F2',type:'point',x:3,y:0});const e=a.engine.construct('ellipseByFociAndSum',[{objectId:'F1'},{objectId:'F2'}],10)[0];window.__ellipseId=e.id;a.invalidate();});
  assert.equal(await page.locator('[data-tool="construct:pointOnObject"]').count(),1);
  assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.toolCatalog.list('fullscreen').some(c=>c.entries.some(t=>t.id==='construct:pointOnObject'))),true);
  await page.locator('#canvasToolsBtn').click();await page.locator('[data-canvas-tool="construct:pointOnObject"]').click();
  const screen=point=>page.evaluate(({x,y})=>FZI.MathIllustration.editor.transform().mathToScreen({x,y}),point);
  const curve=async t=>{const id=await page.evaluate(()=>window.__ellipseId);return page.evaluate(({id,t})=>{const e=FZI.MathIllustration.editor.engine.get(id),g=FZI.MathIllustration.EllipseGeometry.fromDefinition(e).geometry;return FZI.MathIllustration.editor.transform().mathToScreen(g.pointAt(t));},{id,t});};
  let p=await curve(0);await page.mouse.click(p.x,p.y);
  assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.pathPlacement),true);
  const count=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length);
  assert.equal(await count(),3,'source selection must not create a point');
  let q=await screen({x:0,y:0});await page.mouse.move(q.x,q.y);await page.waitForSelector('#canvas [data-point-placement-preview][data-preview-valid="false"]');await page.mouse.click(q.x,q.y);
  assert.equal(await count(),3,'a click outside the CSS contour tolerance must be rejected');
  q=await curve(.25);await page.mouse.move(q.x,q.y);await page.waitForSelector('#canvas [data-point-placement-preview][data-preview-valid="true"]');
  const previewPerformance=await page.evaluate(()=>{const a=FZI.MathIllustration.editor,source=a.engine.get(window.__ellipseId),geometry=FZI.MathIllustration.EllipseGeometry.fromDefinition(source).geometry,before=JSON.stringify(a.engine.toJSON()),times=[];for(let i=0;i<120;i++){const start=performance.now();a.ellipsePointPlacementPreview(geometry.pointAt(i/120));a.renderPointPlacementPreview();times.push(performance.now()-start);}times.sort((x,y)=>x-y);return {iterations:times.length,totalMs:Number(times.reduce((x,y)=>x+y,0).toFixed(2)),meanMs:Number((times.reduce((x,y)=>x+y,0)/times.length).toFixed(3)),p50Ms:Number(times[Math.floor(times.length*.5)].toFixed(3)),p95Ms:Number(times[Math.floor(times.length*.95)].toFixed(3)),maxMs:Number(times.at(-1).toFixed(3)),documentUnchanged:JSON.stringify(a.engine.toJSON())===before};});
  assert.equal(previewPerformance.documentUnchanged,true,'preview must not mutate document JSON');
  await page.mouse.click(q.x,q.y);
  let point=await page.evaluate(()=>{const a=FZI.MathIllustration.editor,o=a.engine.get(a.selectedId);return {id:o.id,kind:o.construction?.kind,parameter:o.construction?.parameter,source:o.construction?.sources[0]?.objectId,x:o.x,y:o.y};});
  assert.equal(point.kind,'pointOnEllipse');assert.equal(point.source,await page.evaluate(()=>window.__ellipseId));assert.ok(Math.abs(point.parameter-.25)<1e-7);assert.ok(Math.abs(point.x)<1e-7);assert.ok(Math.abs(point.y-4)<1e-7);
  assert.equal(await page.locator('[data-path-parameter][aria-label="Parameter op ellips"]').count(),1);
  assert.match(await page.locator('#selectionPanel').innerText(),/Ellipsgeometrie|ellipse|Constructie/i);

  // One complete drag is one history entry and changes only the path parameter.
  let from=await curve(.25),to=await curve(.5);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:12});await page.mouse.up();
  assert.ok(Math.abs(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.parameter,point.id)-.5)<1e-7);
  await page.locator('#undoBtn').click();assert.ok(Math.abs(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.parameter,point.id)-.25)<1e-7);
  await page.locator('#redoBtn').click();assert.ok(Math.abs(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.parameter,point.id)-.5)<1e-7);

  // The periodic parameter crosses 1/0 without jumping to another branch.
  const seam=await page.evaluate(()=>{const a=FZI.MathIllustration.editor,e=a.engine.construct('pointOnEllipse',[{objectId:window.__ellipseId}],.98)[0];a.invalidate();return e.id;});
  from=await curve(.98);to=await curve(.02);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:8});await page.mouse.up();
  assert.ok((await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.parameter,seam))<.03);

  // Escape and pointercancel restore the original parameter and source geometry.
  const readParam=id=>page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.parameter,id);
  const original=await readParam(seam);from=await curve(original);to=await curve(.2);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:4});await page.keyboard.press('Escape');await page.mouse.up();assert.ok(Math.abs(await readParam(seam)-original)<1e-10);
  await page.evaluate(()=>{window.__lastCanvasPointer=null;document.getElementById('canvasWrap').addEventListener('pointerdown',e=>{window.__lastCanvasPointer=e.pointerId;},{once:true,capture:true});});
  from=await curve(original);to=await curve(.3);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:4});
  const pointerId=await page.evaluate(()=>window.__lastCanvasPointer);await page.evaluate(id=>window.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:id,isPrimary:true})),pointerId);await page.mouse.up();assert.ok(Math.abs(await readParam(seam)-original)<1e-10);

  // The parameter survives moving a focus and changing the linked ellipse's S.
  const beforeMove=await readParam(point.id),focus=await screen({x:-3,y:0}),focusTo=await screen({x:-2,y:1});await page.mouse.move(focus.x,focus.y);await page.mouse.down();await page.mouse.move(focusTo.x,focusTo.y,{steps:6});await page.mouse.up();
  assert.equal(await readParam(point.id),beforeMove);
  await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.selectObject(window.__ellipseId);a.radialProperties.showDetail('all');});
  const sum=page.locator('[data-ellipse-sum]');await sum.fill('12');await sum.press('Tab');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get(window.__ellipseId).construction.sumDistance),12);assert.equal(await readParam(point.id),beforeMove);
  const invariant=await page.evaluate(id=>{const a=FZI.MathIllustration.editor,p=a.engine.get(id),ellipse=a.engine.get(window.__ellipseId),f1=a.engine.get('F1'),f2=a.engine.get('F2');return {parameter:p.construction.parameter,focusSum:Math.hypot(p.x-f1.x,p.y-f1.y)+Math.hypot(p.x-f2.x,p.y-f2.y),S:ellipse.construction.sumDistance};},point.id);assert.ok(Math.abs(invariant.focusSum-invariant.S)<1e-8);

  // Start the same construction from the ellipse's radial construction menu.
  await page.locator('#resetViewBtn').click();
  await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.selectObject(window.__ellipseId);a.radialProperties.openAt({x:400,y:250});});
  await page.locator('#radialPropertiesWheel [data-radial-action="construct"]').click();
  const contextual=page.locator('#propertiesSidebar [data-radial-construct="construct:pointOnObject"]');await contextual.waitFor();await contextual.click();
  assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.radialPlacement),true);
  let contextualParameter=null;const wrap=await page.locator('#canvasWrap').boundingBox(),candidates=[];
  for(const t of [0,.125,.25,.375,.5,.625,.75,.875]){const candidate=await curve(t);candidates.push({t,...candidate});if(candidate.x>=wrap.x+8&&candidate.x<=wrap.x+wrap.width-8&&candidate.y>=wrap.y+8&&candidate.y<=wrap.y+wrap.height-8){q=candidate;contextualParameter=t;break;}}
  assert.notEqual(contextualParameter,null,`the ellipse must have a visible contour point for contextual placement: ${JSON.stringify({wrap,candidates})}`);
  await page.mouse.move(q.x,q.y);await page.mouse.click(q.x,q.y);
  const contextualState=await page.evaluate(()=>{const a=FZI.MathIllustration.editor;return {selected:a.selectedId,count:a.engine.model.objects.length,status:document.getElementById('status')?.textContent,interaction:a.interaction&&{mode:a.interaction.mode,pathPlacement:a.interaction.pathPlacement,radialPlacement:a.interaction.radialPlacement,sources:a.interaction.sources}};});
  const contextualPoint=await page.evaluate(()=>FZI.MathIllustration.editor.engine.get(FZI.MathIllustration.editor.selectedId).construction);assert.equal(contextualPoint.kind,'pointOnEllipse',JSON.stringify(contextualState));assert.ok(Math.abs(contextualPoint.parameter-contextualParameter)<1e-7);

  // Lock gates parameter editing. Save/reload and both export consumers keep the ellipse point.
  const contextualId=await page.evaluate(()=>FZI.MathIllustration.editor.selectedId);
  await page.evaluate(id=>{const a=FZI.MathIllustration.editor;a.execute('object.setLock',{ids:[id],value:true});a.selectObject(id);a.radialProperties.showDetail('all');},contextualId);
  assert.equal(await page.locator('[data-path-parameter]').isDisabled(),true);
  await page.locator('#saveBtn').click();const saved=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());await page.reload();await page.waitForFunction(()=>!!FZI.MathIllustration.editor);assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),saved);
  // Verify the linked point itself, not merely the source ellipse, in SVG and rendered PNG pixels.
  const exports=await page.evaluate(async id=>{
    const a=FZI.MathIllustration.editor,point=a.engine.get(id),svg=await FZI.MathIllustration.ExportService.svg(a.engine,{document}),parsed=new DOMParser().parseFromString(svg,'image/svg+xml');
    const group=Array.from(parsed.querySelectorAll('g[data-object-id]')).find(node=>node.getAttribute('data-object-id')===id),circle=group?.querySelector('circle');
    const x=Number(circle?.getAttribute('cx')),y=Number(circle?.getAttribute('cy')),positionCorrect=!!circle&&Math.abs(x-a.engine.renderer.mapX(point.x))<1e-6&&Math.abs(y-a.engine.renderer.mapY(point.y))<1e-6;
    const settings={width:a.engine.renderer.width,height:a.engine.renderer.height,document},png=await FZI.MathIllustration.ExportService.png(svg,settings);
    let pointPixelsChanged=false;
    if(group&&circle){group.remove();const withoutPoint=new XMLSerializer().serializeToString(parsed.documentElement),control=await FZI.MathIllustration.ExportService.png(withoutPoint,settings);
      const sample=async blob=>{const bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext('2d'),sx=Math.max(0,Math.min(canvas.width-7,Math.round(x)-3)),sy=Math.max(0,Math.min(canvas.height-7,Math.round(y)-3));context.drawImage(bitmap,0,0);bitmap.close();return Array.from(context.getImageData(sx,sy,7,7).data);};
      const [withPoint,without]=await Promise.all([sample(png),sample(control)]);pointPixelsChanged=withPoint.some((value,i)=>value!==without[i]);
    }
    return {ellipseInSvg:svg.includes('data-object-type="ellipse"'),pointInSvg:!!group,positionCorrect,pointPixelsChanged,pngType:png.type,pngBytes:png.size};
  },contextualId);
  assert.equal(exports.ellipseInSvg,true);assert.equal(exports.pointInSvg,true);assert.equal(exports.positionCorrect,true,'SVG circle must match the linked model point');
  assert.equal(exports.pointPixelsChanged,true,'removing the linked point must change PNG pixels around its position');
  assert.equal(exports.pngType,'image/png');assert.ok(exports.pngBytes>0);
  const options=fixture('course'),restrictedTool='construct:pointOnEllipse';options.initialDocument={version:9,ellipseSchema:1,type:'geometry',meta:{title:'',description:''},objects:[{id:'E',type:'ellipse',cx:0,cy:0,a:5,b:4,rotation:.2}]};options.policy.parameters={};options.policy.allowedTools=[restrictedTool];options.policy.initialObjectRules={E:{read:true,display:true,selectCanvas:true,selectList:true,sourceTools:[restrictedTool]}};options.policy.createdObjectRules.point={read:true,display:true,selectCanvas:true,selectList:true,translate:true,delete:true,snap:true};
  await page.evaluate(o=>{window.__ellipseId='E';window.__pointRestricted=FZI.MathIllustration.RuntimeSession.create(o);window.__pointPolicy=o.policy;FZI.MathIllustration.bootstrapRestrictedEditor({runtimeSession:window.__pointRestricted.session});},options);
  const restrictedToolButton=page.locator('[data-canvas-tool="construct:pointOnObject"]');await page.locator('#canvasToolsBtn').click();await restrictedToolButton.waitFor({state:'visible'});assert.equal(await restrictedToolButton.isDisabled(),false);await restrictedToolButton.click();
  p=await curve(0);await page.mouse.click(p.x,p.y);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.pathPlacement),true);
  q=await curve(.25);await page.mouse.click(q.x,q.y);
  const restrictedId=await page.evaluate(()=>FZI.MathIllustration.editor.selectedId);assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.kind,restrictedId),'pointOnEllipse');
  await page.evaluate(()=>{const policy=structuredClone(window.__pointPolicy);policy.initialObjectRules.E.sourceTools=[];window.__pointRestricted.owner.replacePolicy(policy);});
  const redaction=await page.evaluate(id=>({present:FZI.MathIllustration.editor.engine.get(id)!==null,json:JSON.stringify(FZI.MathIllustration.editor.engine.toJSON()),svg:FZI.MathIllustration.editor.engine.renderSVG(),dom:document.querySelector(`[data-object-id="${id}"]`)!==null}),restrictedId);
  assert.equal(redaction.present,false);assert.doesNotMatch(redaction.json,/pointOnEllipse/);assert.equal(redaction.dom,false);assert.doesNotMatch(redaction.svg,new RegExp(`data-object-id="${restrictedId}"`));assert.deepEqual(errors,[]);
  return {toolCatalog:'passed',sidebarAndFullscreen:'passed',placementAndTolerance:'passed',previewPerformance,contextualRadial:'passed',dragUndoRedo:'passed',seam:'passed',cancellation:'passed',sourceAndSumUpdates:'passed',lock:'passed',restrictedCreationAndRevocation:'passed',saveReload:'passed',svgPng:exports,pageErrors:errors};
 }finally{page.off('pageerror',onError);}
};

if(require.main===module){(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;try{browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});await page.route('https://fonts.googleapis.com/**',route=>route.abort());await page.goto(`http://127.0.0.1:${server.address().port}/editor.html`);console.log(JSON.stringify(await module.exports(page)));}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}})().catch(error=>{console.error(error);process.exitCode=1;});}
