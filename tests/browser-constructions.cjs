const assert=require('node:assert/strict'),fs=require('node:fs');
module.exports=async page=>{
 const doc=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
 const click=async(x,y)=>{const p=await page.evaluate(p=>FZI.MathIllustration.editor.transform().mathToScreen(p),{x,y});await page.mouse.click(p.x,p.y);};
 const reset=()=>page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[{id:'a',type:'point',x:-2,y:0},{id:'b',type:'point',x:2,y:0},{id:'p',type:'point',x:2,y:2},{id:'l',type:'line',x1:-2,y1:0,x2:2,y2:0},{id:'c',type:'circle',cx:-2,cy:-1.5,r:.75}],presentation:{bounds:{xMin:-5,xMax:5,yMin:-3,yMax:3}}}));
 for(const [kind,points] of [['midpoint',[[0,0]]],['perpendicularBisector',[[0,0]]],['parallel',[[0,0],[2,2]]],['perpendicular',[[0,0],[2,2]]],['bisector',[[-2,0],[2,0],[2,2]]],['tangent',[[-2,-.75],[2,2]]]]) {
  await reset();await page.locator(`[data-tool="construct:${kind}"]`).click();for(const [x,y] of points)await click(x,y);
  let d=await doc(),made=d.objects.filter(o=>o.construction);assert.equal(made.length,kind==='tangent'?2:1,kind);assert.equal(d.version,3);assert.ok(made.every(o=>o.constructionValid));
  await page.locator('#undoBtn').click();assert.equal((await doc()).objects.length,5);await page.locator('#redoBtn').click();assert.equal((await doc()).objects.length,d.objects.length);
  const id=made[0].id;await page.locator(`[data-select-object="${id}"]`).click();assert.equal(await page.locator('.fzi-line-endpoint').count(),0);assert.equal(await page.locator('[data-edit="x1"]').count(),0);
 }
 await reset();await page.locator('[data-tool="construct:midpoint"]').click();await click(-2,0);await page.keyboard.press('Escape');await click(0,0);assert.equal((await doc()).objects.length,5);
 await page.locator('[data-tool="construct:midpoint"]').click();await click(0,0);let made=(await doc()).objects.find(o=>o.construction);await page.locator('[data-select-object="l"]').click();await page.locator('[data-edit="x2"]').fill('4');await page.locator('[data-edit="x2"]').press('Tab');assert.equal((await doc()).objects.find(o=>o.id===made.id).x,1);
 await page.locator('#undoBtn').click();assert.equal((await doc()).objects.find(o=>o.id===made.id).x,0);await page.locator('#redoBtn').click();
 await page.locator('#saveBtn').click();const saved=await doc();await page.reload();assert.deepEqual(await doc(),saved);
 const download=page.waitForEvent('download');await page.locator('#exportSvgBtn').click();const svg=fs.readFileSync(await(await download).path(),'utf8');assert.doesNotMatch(svg,/NaN|Infinity/);
 await page.locator('#fileInput').setInputFiles({name:'construction.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>document.getElementById('status').textContent==='Illustratie geladen.');assert.deepEqual(await doc(),saved);
 await page.locator('[data-select-object="l"]').click();await page.locator('[data-delete-selected]').click();assert.ok(!(await doc()).objects.some(o=>o.id==='l'||o.id===made.id));await page.locator('#undoBtn').click();assert.deepEqual(await doc(),saved);
 await reset();await page.locator('[data-tool="construct:parallel"]').click();const q=await page.evaluate(()=>FZI.MathIllustration.editor.transform().mathToScreen({x:0,y:0}));await page.mouse.move(q.x,q.y);await page.mouse.down();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.mode),'construction');await page.evaluate(()=>{const a=FZI.MathIllustration.editor;window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:a.interaction.pointerId}));});await page.mouse.up();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction),null);assert.equal((await doc()).objects.length,5);
 await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));return {sixTools:'passed',linkedUpdate:'passed',noDerivedHandles:'passed',Escape:'passed',history:'passed',cascadeDelete:'passed',saveReloadImportExport:'passed'};
};

