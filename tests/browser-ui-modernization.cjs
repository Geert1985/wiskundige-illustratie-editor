const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.reload();const doc=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
 assert.ok(await page.locator('#propertiesSidebar').isVisible());assert.equal(await page.locator('[data-view="snapPoints"]').count(),0);
 await page.locator('[data-tool-category="meten"]>summary').click();assert.equal(await page.locator('[data-tool-category][open]').count(),2);
 const before=await doc();await page.locator('[data-view-select="axes"]').click();assert.deepEqual(await doc(),before);assert.equal(await page.locator('#coordinateSystem option:disabled').count(),3);
 await page.locator('[data-view="axes"]').click();assert.equal(await page.locator('[data-axis-settings]').isVisible(),true);assert.equal((await doc()).presentation.showAxes,!before.presentation.showAxes);
 await page.locator('[data-view="grid"]').click();assert.equal(await page.locator('[data-axis-setting="showGrid"]').isChecked(),(await doc()).presentation.showGrid);
 await page.locator('#moreBtn').focus();await page.keyboard.press('Enter');assert.ok(await page.locator('#exportSvgBtn').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('#fileMenu').getAttribute('open'),null);assert.equal(await page.locator('#moreBtn').evaluate(el=>el===document.activeElement),true);
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.loadDocument({objects:[{id:'a',type:'point',x:0,y:0},{id:'b',type:'circle',cx:2,cy:1,r:1}]});a.selectedIds=['a','b'];a.invalidate();});
 await page.locator('[data-common="style.opacity"]').fill('50');await page.locator('[data-common="style.opacity"]').dispatchEvent('change');assert.ok((await doc()).objects.every(o=>o.style.opacity===.5));await page.locator('#undoBtn').click();assert.ok((await doc()).objects.every(o=>o.style.opacity===1));
 const b=(await doc()).presentation.bounds;await page.locator('#zoomInBtn').click();assert.notDeepEqual((await doc()).presentation.bounds,b);await page.locator('#resetViewBtn').click();
 await page.locator('#panBtn').click();const t=await page.evaluate(()=>FZI.MathIllustration.editor.transform().mathToScreen({x:0,y:0}));const geometry=(await doc()).objects;await page.mouse.move(t.x,t.y);await page.mouse.down();await page.mouse.move(t.x+25,t.y+10);await page.mouse.up();assert.deepEqual((await doc()).objects,geometry);await page.locator('[data-tool="select"]').click();
 const fixed=await doc();for(const [width,height] of [[1280,720],[1024,768],[760,800],[390,844]]){await page.setViewportSize({width,height});assert.deepEqual(await doc(),fixed);assert.ok(await page.locator('#zoomInBtn').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));return {independentCategories:'passed',axesContextVisibility:'passed',gridSync:'passed',menuKeyboard:'passed',commonStyleUndo:'passed',panZoom:'passed',responsiveDocumentInvariant:'passed'};
};
