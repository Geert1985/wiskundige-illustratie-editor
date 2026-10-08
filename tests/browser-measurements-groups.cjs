const assert=require('node:assert/strict'),fs=require('node:fs');
module.exports=async page=>{
  const doc=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
  const move=async(x,y)=>{const p=await page.evaluate(p=>FZI.MathIllustration.editor.transform().mathToScreen(p),{x,y});await page.mouse.move(p.x,p.y);};
  const click=async(x,y)=>{await move(x,y);await page.mouse.down();await page.mouse.up();};
  const reset=()=>page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[],presentation:{bounds:{xMin:-5,xMax:5,yMin:-3,yMax:3},showGrid:true}}));
  await reset();await require('./browser-tool-menu.cjs').choose(page,'[data-tool="dimension"]');await move(0,0);await page.mouse.down();await move(1.05,0);await page.keyboard.press('1');await page.mouse.up();
  let o=(await doc()).objects[0];assert.equal(o.type,'dimension');assert.ok(Math.abs(Math.hypot(o.x2-o.x1,o.y2-o.y1)-1)<1e-9);assert.equal(await page.locator('[data-measurement-label]').textContent(),'1');
  await page.locator('[data-edit="measurementMode"]').selectOption('text');await page.locator('[data-edit="measurementText"]').fill('a < b');await page.locator('[data-edit="measurementText"]').press('Tab');assert.equal(await page.locator('[data-measurement-label]').textContent(),'a < b');
  await page.locator('#undoBtn').click();assert.equal(await page.locator('[data-measurement-label]').textContent(),'');await page.locator('#redoBtn').click();assert.equal(await page.locator('[data-measurement-label]').textContent(),'a < b');
  await page.locator('[data-edit="measurementLabelOnly"]').check();
  assert.equal(await page.locator('#canvas [data-object-type="dimension"] line').count(),0);
  await require('./browser-tool-menu.cjs').choose(page,'[data-tool="select"]');
  const labelBox=await page.locator('#canvas [data-measurement-label] text').boundingBox();
  await page.mouse.move(labelBox.x+labelBox.width/2,labelBox.y+labelBox.height/2);await page.mouse.down();await page.mouse.move(labelBox.x+labelBox.width/2+30,labelBox.y+labelBox.height/2+20);await page.mouse.up();
  assert.ok((await doc()).objects[0].labelOffsetX!==null);await page.locator('#undoBtn').click();assert.equal((await doc()).objects[0].labelOffsetX,null);await page.locator('#redoBtn').click();
  await reset();await require('./browser-tool-menu.cjs').choose(page,'[data-tool="triangle"]');await click(1,0);await move(0,0);assert.equal(await page.locator('[data-preview-length]').textContent(),'1');await click(0,0);await move(0,1);assert.equal(await page.locator('[data-preview-angle]').textContent(),'90°');await click(0,1);assert.equal(await page.locator('[data-preview-length]').count(),0);
  for(const tool of ['angle','rightAngle']) {
    await reset();await require('./browser-tool-menu.cjs').choose(page,`[data-tool="${tool}"]`);await click(1,0);await click(0,0);await move(.2,1);
    assert.equal(await page.locator('[data-drawing-preview]').count(),1);await page.mouse.down();await page.mouse.up();o=(await doc()).objects[0];assert.equal(o.type,'angle');
    if(tool==='rightAngle') {assert.equal(await page.locator('[data-right-angle]').count(),1);assert.equal(await page.locator('[data-measurement-label]').textContent(),'90°');assert.ok(Math.abs(o.vertices[2].x)<1e-9);}
    else assert.equal(await page.locator('[data-angle-arc]').count(),1);
    await page.locator('#undoBtn').click();assert.equal((await doc()).objects.length,0);await page.locator('#redoBtn').click();assert.equal((await doc()).objects.length,1);
  }
  await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[{id:'p',type:'point',x:0,y:0},{id:'l',type:'line',x1:2,y1:0,x2:3,y2:0},{id:'c',type:'circle',cx:-2,cy:0,r:1}]}));
  await page.locator('[data-select-object="l"]').click();await page.locator('[data-edit="showMeasurement"]').check();assert.equal(await page.locator('[data-measurement-label]').textContent(),'1');
  await page.locator('[data-select-object="c"]').click();await page.locator('[data-edit="showMeasurement"]').check();assert.match(await page.locator('[data-object-id="c"] [data-measurement-label]').textContent(),/1.*r/);
  await page.locator('[data-select-object="p"]').click();await page.locator('[data-select-object="l"]').click({modifiers:['Shift']});
  assert.equal(await page.locator('#canvas .selected').count(),2);assert.equal(await page.locator('.fzi-line-endpoint').count(),0);
  const before=await doc();await move(0,0);await page.mouse.down();await move(1,1);await page.mouse.up();let after=await doc();assert.equal(after.objects[0].x,1);assert.equal(after.objects[1].x1,3);assert.equal(after.objects[1].x2,4);
  await page.locator('#undoBtn').click();assert.deepEqual(await doc(),before);assert.equal(await page.locator('#canvas .selected').count(),2);await page.locator('#redoBtn').click();assert.deepEqual(await doc(),after);
  await move(1,1);await page.mouse.down();await move(2,2);await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual(await doc(),after);
  await page.locator('[data-duplicate-selection]').click();assert.equal((await doc()).objects.length,5);assert.equal(await page.locator('#canvas .selected').count(),2);
  await page.locator('#undoBtn').click();assert.equal((await doc()).objects.length,3);await page.locator('#redoBtn').click();assert.equal((await doc()).objects.length,5);
  await page.locator('[data-lock-selection]').click();const locked=await doc();const ids=await page.evaluate(()=>FZI.MathIllustration.editor.selectedIds);assert.ok(locked.objects.filter(o=>ids.includes(o.id)).every(o=>o.locked));
  const p=locked.objects.find(o=>o.id===ids[0]);await move(p.x,p.y);await page.mouse.down();await move(p.x+1,p.y+1);await page.mouse.up();assert.deepEqual(await doc(),locked);
  assert.equal(await page.locator('[data-delete-selected]').isDisabled(),true);await page.keyboard.press('Delete');assert.deepEqual(await doc(),locked);
  await page.locator('[data-lock-selection]').click();await page.locator('[data-delete-selected]').click();assert.equal((await doc()).objects.length,3);await page.locator('#undoBtn').click();assert.equal((await doc()).objects.length,5);
  const download=page.waitForEvent('download');await page.locator('#exportSvgBtn').click();const svg=fs.readFileSync(await(await download).path(),'utf8');assert.match(svg,/data-measurement-label/);assert.doesNotMatch(svg,/NaN|Infinity|fzi-line-endpoint/);
  await page.locator('#saveBtn').click();const saved=await doc();await page.reload();assert.deepEqual(await doc(),saved);
  await page.locator('#fileInput').setInputFiles({name:'measurements.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>document.getElementById('status').textContent==='Illustratie geladen.');assert.deepEqual(await doc(),saved);
  await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
  return {dimensionExactLength:'passed',computedAndFreeText:'passed',angleAndRightAngle:'passed',lineAndRadiusAnnotations:'passed',shiftSelection:'passed',rigidGroupDrag:'passed',cancelGroupDrag:'passed',duplicateLockDelete:'passed',undoRedoSelection:'passed',SVGSaveReloadImport:'passed'};
};
