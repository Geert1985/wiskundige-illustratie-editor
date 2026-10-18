const assert=require('node:assert/strict');

module.exports=async page=>{
 const documentState=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());

 await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[]}));
 await page.evaluate(()=>FZI.MathIllustration.editor.setTool('text'));
 let point=await page.evaluate(()=>FZI.MathIllustration.editor.transform().mathToScreen({x:1,y:1}));
 await page.mouse.click(point.x,point.y);await page.locator('#textDialog').waitFor({state:'visible'});
 const surface=page.locator('#richTextSurface .ProseMirror');await surface.click();await page.keyboard.type('Bewaarde tekst ');
 await page.locator('#symbolSearch').fill('pi');await page.locator('#symbolList button').first().click();
 await page.waitForFunction(()=>FZI.MathIllustration.editor.richTextEditor.get().paragraphs[0].runs.some(run=>run.kind==='math'));
 const draft=await page.evaluate(()=>FZI.MathIllustration.editor.richTextEditor.get());assert.equal(draft.paragraphs[0].runs.map(run=>run.text||`\\(${run.source}\\)`).join(''),'Bewaarde tekst \\(\\pi\\)');
 await page.evaluate(()=>{window.__l4TextReturnFocus=FZI.MathIllustration.editor.textReturnFocus;});
 await page.keyboard.press('Escape');await page.locator('#textDialog').waitFor({state:'hidden'});
 assert.equal((await documentState()).objects.length,0);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.history.entries.length),0);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),'select');
 assert.equal(await page.evaluate(()=>document.activeElement===window.__l4TextReturnFocus),true,'Closing the text editor restores its original focus target.');

 await page.evaluate(()=>FZI.MathIllustration.editor.setTool('line'));point=await page.evaluate(()=>FZI.MathIllustration.editor.transform().mathToScreen({x:-2,y:0}));await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+35,point.y+20);await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),'select');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction),null);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.renderer.preview),null);assert.equal(await page.evaluate(()=>document.querySelector('#canvas').hasPointerCapture?.(1)??false),false);assert.equal((await documentState()).objects.length,0);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.history.entries.length),0);

 await page.evaluate(()=>{const e=FZI.MathIllustration.editor;e.engine.add({id:'L4P',type:'point',x:0,y:0});e.setTool('line');e.openColor('L4P');});const colorBefore=await documentState();await page.locator('#colorDialog').waitFor({state:'visible'});await page.keyboard.press('Escape');assert.equal(await page.locator('#colorDialog').isHidden(),true);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),'line');assert.deepEqual(await documentState(),colorBefore);
 return {formulaCatalogInlineInsert:'passed',textDraftCancelledWithoutCommit:'passed',textEditorFocusRestored:'passed',canvasGestureCancelled:'passed',nativeColorDialogOwnsEscape:'passed'};
};
