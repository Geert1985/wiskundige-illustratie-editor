const assert=require('node:assert/strict');

module.exports=async page=>{
 const documentState=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());

 await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[]}));
 await page.evaluate(()=>FZI.MathIllustration.editor.setTool('text'));
 let point=await page.evaluate(()=>FZI.MathIllustration.editor.transform().mathToScreen({x:1,y:1}));
 await page.mouse.click(point.x,point.y);await page.locator('#textDialog').waitFor({state:'visible'});
 const surface=page.locator('#richTextSurface .ProseMirror');await surface.fill('Bewaarde tekst');
 await page.locator('#insertTabFunctions').click();await page.locator('#mathSource').fill('x+1');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#textDialog').isVisible(),true);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.textInsertPanel.isOpen()),false);assert.equal((await page.evaluate(()=>FZI.MathIllustration.editor.richTextEditor.get())).paragraphs[0].runs[0].text,'Bewaarde tekst');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#textDialog').isHidden(),true);assert.equal((await documentState()).objects.length,0);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.history.entries.length),0);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),'text');

 await page.evaluate(()=>FZI.MathIllustration.editor.setTool('line'));point=await page.evaluate(()=>FZI.MathIllustration.editor.transform().mathToScreen({x:-2,y:0}));await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+35,point.y+20);await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),'select');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction),null);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.renderer.preview),null);assert.equal((await documentState()).objects.length,0);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.history.entries.length),0);

 await page.evaluate(()=>{const e=FZI.MathIllustration.editor;e.engine.add({id:'L4P',type:'point',x:0,y:0});e.setTool('line');e.openColor('L4P');});await page.locator('#colorDialog').waitFor({state:'visible'});await page.keyboard.press('Escape');assert.equal(await page.locator('#colorDialog').isHidden(),true);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),'line');assert.equal((await documentState()).objects.find(o=>o.id==='L4P').x,0);
 return {textSubeditorBeforeTextEditor:'passed',textDraftPreserved:'passed',canvasGestureCancelled:'passed',nativeColorDialogOwnsEscape:'passed'};
};
