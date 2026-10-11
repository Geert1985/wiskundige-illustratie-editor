const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.reload();await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[{id:'AC',type:'line',x1:-2,y1:0,x2:.5,y2:0},{id:'BC',type:'line',x1:-2,y1:-1,x2:.5,y2:.25}]}));
 await require('./browser-tool-menu.cjs').choose(page,'[data-tool="construct:angleDirections"]');
 const click=async(x,y)=>{const p=await page.evaluate(p=>FZI.MathIllustration.editor.transform().mathToScreen(p),{x,y});await page.mouse.click(p.x,p.y);};
 await click(-1.5,0);await click(-1.5,-.75);
 const state=()=>page.evaluate(()=>{const a=FZI.MathIllustration.editor,o=a.engine.model.objects.find(o=>o.type==='angle');return {id:o.id,vertices:o.vertices,value:FZI.MathIllustration.MeasurementGeometry.value(o)};});
 const angle=await state();assert.ok(Math.abs(angle.value-26.565051177)<1e-8);assert.deepEqual(angle.vertices[1],{x:0,y:0});assert.ok(angle.vertices[0].x<0&&angle.vertices[2].x<0);
 await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),2);await page.locator('#redoBtn').click();assert.ok(Math.abs((await state()).value-angle.value)<1e-8);
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.engine.update('BC',{x1:-2,y1:-2,x2:.5,y2:.5});a.invalidate();});assert.ok(Math.abs((await state()).value-45)<1e-8);
 await page.locator('#saveBtn').click();await page.reload();assert.ok(Math.abs((await state()).value-45)<1e-8);return {actualPicking:'passed',interiorArms:'passed',history:'passed',dynamicUpdate:'passed',saveReload:'passed'};
};
