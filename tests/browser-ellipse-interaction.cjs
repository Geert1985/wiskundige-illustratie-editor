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
    await page.evaluate(()=>{
      const a=FZI.MathIllustration.editor;a.newDocument();
      a.execute('document.setMeasurement',{settings:{schema:1,unit:'cm',scale:2,precision:2}});
      for(const point of [{id:'F1',x:-3,y:0},{id:'F2',x:3,y:0},{id:'Q',x:0,y:4}])a.engine.add({id:point.id,type:'point',x:point.x,y:point.y});
      a.invalidate();
    });
    await page.locator('[data-tool-subgroup="kegelsneden"] > button').evaluate(button=>{button.closest('details').open=true;});
    await page.locator('[data-tool-subgroup="kegelsneden"] > button').click();
    const tool='construct:ellipseByFociAndPoint';
    assert.equal(await page.locator(`[data-tool="${tool}"]`).count(),1,'three-source ellipse is the visible ellipse construction');
    assert.equal(await page.locator('[data-tool="construct:ellipseByFociAndSum"]').count(),0,'legacy sum recipe is not presented as a tool');
    await page.locator(`[data-tool="${tool}"]`).click();

    const screen=point=>page.evaluate(point=>FZI.MathIllustration.editor.transform().mathToScreen(point),point);
    const click=async point=>{const p=await screen(point);await page.mouse.click(p.x,p.y);};
    await click({x:-3,y:0});await click({x:3,y:0});
    assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.ellipsePlacement),true);
    assert.equal((await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON())).objects.length,3,'choosing both foci does not create objects');

    const qScreen=await screen({x:0,y:4});await page.mouse.move(qScreen.x,qScreen.y);
    await page.waitForSelector('#canvas [data-preview-control-point="existing"]');
    assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),3,'live preview does not persist a temporary Q');
    const cancelBefore=JSON.stringify(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()));
    await page.keyboard.press('Escape');
    assert.equal(JSON.stringify(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON())),cancelBefore,'Escape cancels preview without changing the document');
    assert.equal(await page.locator('#canvas [data-drawing-preview]').count(),0,'cancellation removes live preview');

    await page.locator(`[data-tool="${tool}"]`).click();await click({x:-3,y:0});await click({x:3,y:0});
    await page.mouse.move(qScreen.x,qScreen.y);await page.waitForSelector('#canvas [data-preview-control-point="existing"]');
    const beforeCommit=await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length);
    await page.mouse.click(qScreen.x,qScreen.y);
    const ellipseId=await page.evaluate(()=>FZI.MathIllustration.editor.selectedId);
    assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),beforeCommit+1,'selecting an existing Q creates only the ellipse');
    let ellipse=await page.evaluate(id=>{
      const a=FZI.MathIllustration.editor,o=a.engine.get(id),[f1,f2,q]=o.construction.sources.map(source=>a.engine.get(source.objectId));
      return {kind:o.construction.kind,sources:o.construction.sources.map(source=>source.objectId),storedS:o.construction.sumDistance,derivedS:Math.hypot(q.x-f1.x,q.y-f1.y)+Math.hypot(q.x-f2.x,q.y-f2.y),a:o.a};
    },ellipseId);
    assert.equal(ellipse.kind,'ellipseByFociAndPoint');assert.deepEqual(ellipse.sources,['F1','F2','Q']);
    assert.equal(ellipse.storedS,undefined,'new recipe does not persist an editable sumDistance');
    assert.ok(Math.abs(ellipse.derivedS-10)<1e-10);assert.ok(Math.abs(2*ellipse.a-ellipse.derivedS)<1e-10,'S is derived from the permanent third source');

    await page.evaluate(id=>{const a=FZI.MathIllustration.editor;a.selectObject(id);a.radialProperties.showDetail('all');a.invalidate();},ellipseId);
    assert.equal(await page.locator('[data-ellipse-derived-s]').count(),1,'properties expose derived S');
    assert.equal(await page.locator('[data-ellipse-sum]').count(),0,'properties do not expose a directly editable S');
    assert.equal(await page.locator('[data-lock-selection]').count(),1);

    const q0=await screen({x:0,y:4}),q1=await screen({x:1,y:5});
    await page.mouse.move(q0.x,q0.y);await page.mouse.down();await page.mouse.move(q1.x,q1.y,{steps:8});await page.mouse.up();
    ellipse=await page.evaluate(id=>{const a=FZI.MathIllustration.editor,o=a.engine.get(id),q=a.engine.get('Q'),[f1,f2]=o.construction.sources.slice(0,2).map(s=>a.engine.get(s.objectId));return {q:{x:q.x,y:q.y},S:Math.hypot(q.x-f1.x,q.y-f1.y)+Math.hypot(q.x-f2.x,q.y-f2.y),a:o.a};},ellipseId);
    assert.ok(Math.abs(ellipse.q.x-1)<.15&&Math.abs(ellipse.q.y-5)<.15,'Q remains the movable permanent source');
    assert.ok(Math.abs(2*ellipse.a-ellipse.S)<1e-9,'moving Q recomputes the ellipse from derived S');
    await page.locator('#undoBtn').click();
    assert.ok(Math.abs(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get('Q').x))<.01,'undo restores Q and its dependent ellipse');
    await page.locator('#redoBtn').click();
    assert.ok(Math.abs(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get('Q').x)-1)<.15,'redo reapplies Q movement and dependent recomputation');
    await page.locator('#undoBtn').click();await page.locator('#undoBtn').click();
    assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id),ellipseId),null,'undo removes the three-source ellipse in one creation step');
    await page.locator('#redoBtn').click();
    assert.ok(await page.evaluate(id=>!!FZI.MathIllustration.editor.engine.get(id),ellipseId),'redo restores the three-source construction');

    // The legacy recipe remains constructible and roundtrips as stored data;
    // it retains its old editable sumDistance semantics.
    const legacy=await page.evaluate(()=>{
      const a=FZI.MathIllustration.editor,e=a.engine.construct('ellipseByFociAndSum',[{objectId:'F1'},{objectId:'F2'}],10)[0],saved=a.engine.toJSON();
      const loaded=new FZI.MathIllustration.Engine(saved),copy=loaded.get(e.id);a.selectObject(e.id);a.radialProperties.showDetail('all');a.invalidate();
      return {id:e.id,schema:saved.constructionSchema,version:saved.version,kind:copy.construction.kind,sources:copy.construction.sources.map(s=>s.objectId),sumDistance:copy.construction.sumDistance,roundtrip:JSON.stringify(loaded.toJSON())===JSON.stringify(saved)};
    });
    assert.equal(legacy.schema,7);assert.equal(legacy.version,9);assert.equal(legacy.kind,'ellipseByFociAndSum');
    assert.deepEqual(legacy.sources,['F1','F2']);assert.equal(legacy.sumDistance,10);assert.equal(legacy.roundtrip,true,'legacy document import/export preserves the old recipe');
    assert.equal(await page.locator('[data-ellipse-sum]').count(),1,'legacy recipe retains its editable S control');
    const legacySum=page.locator('[data-ellipse-sum]');assert.equal(await legacySum.inputValue(),'20');
    await legacySum.fill('24');await legacySum.press('Tab');
    assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.sumDistance,legacy.id),12);
    await page.locator('#undoBtn').click();assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.sumDistance,legacy.id),10);
    await page.locator('#redoBtn').click();assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.sumDistance,legacy.id),12);

    await page.evaluate(()=>{const a=FZI.MathIllustration.editor;for(let i=0;i<200;i++)a.engine.construct('ellipseByFociAndSum',[{objectId:'F1'},{objectId:'F2'}],10+i*.01);a.invalidate();});
    await page.locator(`[data-tool="${tool}"]`).click();await click({x:-3,y:0});await click({x:3,y:0});
    const timing=await page.evaluate(async()=>{
      const a=FZI.MathIllustration.editor,renders=[],updates=[],originalRender=a.renderCanvas.bind(a),originalPreview=a.renderEllipsePlacementPreview.bind(a);
      a.renderCanvas=function(){const start=performance.now(),value=originalRender();renders.push(performance.now()-start);return value;};
      a.renderEllipsePlacementPreview=function(){const start=performance.now(),value=originalPreview();updates.push(performance.now()-start);return value;};
      const target=a.nodes.canvasWrap,base=a.transform().mathToScreen({x:0,y:4}),work=[];
      for(let round=0;round<12;round++){
        const start=performance.now();for(let i=0;i<40;i++)a.pointerMove({pointerId:91,isPrimary:true,clientX:base.x+i*.15,clientY:base.y,target});work.push(performance.now()-start);
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      }
      a.renderCanvas=originalRender;a.renderEllipsePlacementPreview=originalPreview;
      const sorted=values=>values.slice().sort((a,b)=>a-b);
      return {objects:a.engine.model.objects.length,movesPerBurst:40,bursts:12,pointerBurstP50Ms:sorted(work)[6],pointerBurstMaxMs:Math.max(...work),previewUpdateP50Ms:sorted(updates)[Math.floor(updates.length/2)],previewUpdateMaxMs:Math.max(...updates),previewUpdateCount:updates.length,fullCanvasRendersDuringMoves:renders.length};
    });
    assert.equal(timing.objects,205,'three source points, one restored new ellipse, one legacy ellipse and 200 legacy benchmark ellipses');
    assert.equal(timing.previewUpdateCount,12);assert.equal(timing.fullCanvasRendersDuringMoves,0,'pointer bursts update only the live preview');
    await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction),null);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({browser:'Edge',threeSourceTool:'passed',permanentQMoveUndoRedo:'passed',previewCancellation:'passed',derivedSum:'passed',legacyRecipeAndDocumentRoundtrip:'passed',legacyEditableSum:'passed',performance:timing,pageErrors:errors}));
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
