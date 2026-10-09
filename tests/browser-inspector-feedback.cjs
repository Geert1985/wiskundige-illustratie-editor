const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.setViewportSize({width:1011,height:668});await page.reload();
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.loadDocument({objects:[{id:'poly',name:'Driehoek',type:'polygon',vertices:[{x:1.23456789,y:2.3456789},{x:3,y:0},{x:0,y:0}],style:{fill:'#abcdef'}}]});a.selectObject('poly');});
 const before=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
 assert.equal(await page.locator('[data-property-section]').first().getAttribute('data-property-section'),'relations');
 assert.equal(await page.locator('[data-edit=x][data-vertex="0"]').inputValue(),'1.23');
 await page.locator('[data-edit=x][data-vertex="0"]').focus();await page.keyboard.press('Tab');
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),before);
 assert.equal(await page.locator('#selectionPanel code').count(),0);
 assert.equal(await page.locator('.object-heading [data-edit=name]').inputValue(),'Driehoek');
 for(const attr of ['group-selection','ungroup-selection','visibility-selection','duplicate-selection','lock-selection','delete-selected']){const b=page.locator('.object-actions [data-'+attr+']');assert.equal(await b.count(),1);assert.ok(await b.getAttribute('aria-label'));assert.equal(await b.textContent(),'');}
 assert.equal(await page.locator('[data-fill-object]').textContent(),'');assert.equal(await page.locator('[data-fill-object]').evaluate(el=>el.style.getPropertyValue('--object-color')),'#abcdef');
 assert.equal(await page.locator('[data-style=opacity]').getAttribute('type'),'range');
 const palette=await page.locator('.sidebar>.sidebar-section').first().evaluate(el=>({overflow:getComputedStyle(el).overflowY,max:getComputedStyle(el).maxHeight}));assert.equal(palette.overflow,'visible');assert.equal(palette.max,'none');
 const slider=page.locator('[data-style=opacity]');await slider.focus();await slider.press('ArrowLeft');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get('poly').style.opacity),.99);await page.locator('#undoBtn').click();assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),before);
 const name=page.locator('.object-heading [data-edit=name]');await name.fill('Mijn driehoek');await name.press('Tab');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get('poly').name),'Mijn driehoek');await page.locator('#undoBtn').click();assert.equal(await page.locator('.object-heading [data-edit=name]').inputValue(),'Driehoek');
 return {headingRenameUndo:'passed',relationsFirst:'passed',precisionDisplayOnly:'passed',actionIcons:'passed',fillSwatch:'passed',opacityKeyboardUndo:'passed',paletteNoNestedScroll:'passed'};
};
