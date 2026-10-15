const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);});
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1360,height:900}}),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**',route=>route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/editor.html`);
    await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.newDocument();a.execute('document.setMeasurement',{settings:{schema:1,unit:'cm',scale:2,precision:2}});a.engine.add({id:'F1',type:'point',x:-3,y:0});a.engine.add({id:'F2',type:'point',x:3,y:0});a.invalidate();});
    await page.locator('[data-tool-subgroup="kegelsneden"] > button').evaluate(button=>{button.closest('details').open=true;});
    await page.locator('[data-tool-subgroup="kegelsneden"] > button').click();
    await page.locator('[data-tool="construct:ellipseByFociAndSum"]').click();
    const screen=point=>page.evaluate(({x,y})=>FZI.MathIllustration.editor.transform().mathToScreen({x,y}),point);
    await page.mouse.click((await screen({x:-3,y:0})).x,(await screen({x:-3,y:0})).y);
    await page.mouse.click((await screen({x:3,y:0})).x,(await screen({x:3,y:0})).y);
    assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.ellipsePlacement),true);
    assert.equal((await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON())).objects.length,2,'choosing both foci commits nothing');
    let q=await screen({x:0,y:0});await page.mouse.click(q.x,q.y);
    assert.equal((await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON())).objects.length,2,'degenerate third click is rejected');
    assert.equal(await page.locator('[data-preview-valid="false"]').count(),1);
    q=await screen({x:0,y:4});await page.mouse.move(q.x,q.y);
    await page.waitForSelector('#canvas [data-drawing-preview] ellipse');
    const preview=await page.evaluate(()=>({count:document.querySelectorAll('#canvas [data-drawing-preview] ellipse').length,document:FZI.MathIllustration.editor.engine.toJSON().objects.length}));
    assert.deepEqual(preview,{count:1,document:2});
    const before=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON().objects.length);await page.mouse.click(q.x,q.y);
    assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON().objects.length),before+1);
    let ellipse=await page.evaluate(()=>{const a=FZI.MathIllustration.editor,o=a.engine.get(a.selectedId);return {type:o.type,sumDistance:o.construction.sumDistance,sources:o.construction.sources,undo:a.history.canUndo};});
    assert.equal(ellipse.type,'ellipse');assert.ok(Math.abs(ellipse.sumDistance-10)<1e-6);assert.deepEqual(ellipse.sources,[{objectId:'F1'},{objectId:'F2'}]);assert.equal(ellipse.undo,true);
    await page.evaluate(()=>FZI.MathIllustration.editor.radialProperties.showDetail('all'));
    const sum=page.locator('[data-ellipse-sum]');assert.equal(await sum.inputValue(),'20');await sum.fill('24');await sum.press('Tab');
    assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get(FZI.MathIllustration.editor.selectedId).construction.sumDistance),12);
    await page.locator('#undoBtn').click();assert.ok(Math.abs(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get(FZI.MathIllustration.editor.selectedId).construction.sumDistance)-10)<1e-6);
    await page.locator('#redoBtn').click();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get(FZI.MathIllustration.editor.selectedId).construction.sumDistance),12);
    await page.evaluate(()=>FZI.MathIllustration.editor.radialProperties.showDetail('all'));
    await page.locator('[data-lock-selection]').click();assert.equal(await page.locator('[data-ellipse-sum]').isDisabled(),true);await page.locator('[data-lock-selection]').click();

    // Benchmark the real placement preview: 200 additional dependent ellipses,
    // bursts of 40 pointer moves per animation frame, and an isolated preview update.
    await page.evaluate(()=>{const a=FZI.MathIllustration.editor,e=a.engine;for(let i=0;i<200;i++)e.construct('ellipseByFociAndSum',[{objectId:'F1'},{objectId:'F2'}],10+i*.01);a.invalidate();});
    await page.locator('[data-tool="construct:ellipseByFociAndSum"]').click();
    for(const f of ['F1','F2']){const p=await page.evaluate(id=>{const a=FZI.MathIllustration.editor,o=a.engine.get(id);return a.transform().mathToScreen({x:o.x,y:o.y});},f);await page.mouse.click(p.x,p.y);}
    const cancelBefore=JSON.stringify(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()));await page.keyboard.press('Escape');assert.equal(JSON.stringify(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON())),cancelBefore,'Escape cancels without changing the document');
    await page.locator('[data-tool="construct:ellipseByFociAndSum"]').click();
    for(const f of ['F1','F2']){const p=await page.evaluate(id=>{const a=FZI.MathIllustration.editor,o=a.engine.get(id);return a.transform().mathToScreen({x:o.x,y:o.y});},f);await page.mouse.click(p.x,p.y);}
    const timing=await page.evaluate(async()=>{
      const a=FZI.MathIllustration.editor,renders=[],updates=[],originalRender=a.renderCanvas.bind(a),originalPreview=a.renderEllipsePlacementPreview.bind(a);a.renderCanvas=function(){const start=performance.now(),value=originalRender();renders.push(performance.now()-start);return value;};a.renderEllipsePlacementPreview=function(){const start=performance.now(),value=originalPreview();updates.push(performance.now()-start);return value;};
      const baseline=[];for(let i=0;i<5;i++){const start=performance.now();originalRender();baseline.push(performance.now()-start);}renders.length=0;
      const wrap=a.nodes.canvasWrap,base=a.transform().mathToScreen({x:0,y:4}),work=[];
      for(let round=0;round<12;round++){
        const start=performance.now();for(let i=0;i<40;i++)a.pointerMove({pointerId:91,isPrimary:true,clientX:base.x+i*.15,clientY:base.y,target:wrap});work.push(performance.now()-start);
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      }
      a.renderCanvas=originalRender;a.renderEllipsePlacementPreview=originalPreview;const sorted=x=>x.slice().sort((m,n)=>m-n);return {objects:a.engine.model.objects.length,movesPerBurst:40,bursts:12,pointerBurstP50Ms:sorted(work)[Math.floor(work.length/2)],pointerBurstMaxMs:Math.max(...work),previewUpdateP50Ms:sorted(updates)[Math.floor(updates.length/2)],previewUpdateMaxMs:Math.max(...updates),previewUpdateCount:updates.length,fullCanvasRenderP50Ms:sorted(baseline)[Math.floor(baseline.length/2)],fullCanvasRenderMaxMs:Math.max(...baseline),fullCanvasRendersDuringMoves:renders.length};
    });
    assert.equal(timing.objects,203);assert.equal(timing.previewUpdateCount,12);assert.equal(timing.fullCanvasRendersDuringMoves,0);
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction),null);
    assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:'Edge',interaction:'passed',properties:'passed',degenerateRecovery:'passed',performance:timing,pageErrors:errors}));
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
