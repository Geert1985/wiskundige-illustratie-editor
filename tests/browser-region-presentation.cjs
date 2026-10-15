const assert=require('node:assert/strict');

module.exports=async page=>{
  const activate=async filter=>{
    await page.evaluate(filter=>{
      const a=FZI.MathIllustration.editor;
      a.radialProperties.openAt({x:Math.round(innerWidth/2),y:Math.round(innerHeight/2)},false);
    },filter);
    await page.locator(`#radialPropertiesWheel [data-radial-action="${filter}"]`).click();
    await page.waitForFunction(()=>!document.getElementById('propertiesSidebar').hidden);
  };
  await page.setViewportSize({width:420,height:390});
  await page.evaluate(()=>{
    const a=FZI.MathIllustration.editor;
    const polygon={id:'source',type:'polygon',vertices:[{x:-2,y:-1},{x:2,y:-1},{x:2,y:1},{x:-2,y:1}]};
    a.loadDocument({objects:[polygon],presentation:{bounds:{xMin:-5,xMax:5,yMin:-4,yMax:4}}});
    const region=a.engine.construct('polygonRegion',[{objectId:'source'}])[0];
    a.engine.update(region.id,{name:'Oppervlakte',showLabel:true,areaDisplay:{visible:true,mode:'value',precision:null,position:{mode:'auto'}},style:{fill:'#dfaa33',stroke:'#314159',strokeWidth:2,opacity:.8,dash:''}});
    a.selectObject(region.id);a.invalidate();
  });
  const regionId=await page.evaluate(()=>FZI.MathIllustration.editor.selectedId);
  await activate('appearance');
  const pane=page.locator('#propertiesSidebar');
  const precision=pane.locator('[data-region-display="precision"]');
  assert.equal(await precision.getAttribute('min'),'0');assert.equal(await precision.getAttribute('max'),'3');assert.equal(await precision.getAttribute('step'),'1');assert.equal(await precision.inputValue(),'2');
  const fillButton=pane.locator(`[data-fill-object="${regionId}"]`);
  assert.equal(await fillButton.count(),1);
  await fillButton.click();
  await page.locator('#colorValue').fill('#33aa77');
  const pickerState=await page.evaluate(()=>({open:document.getElementById('colorDialog').open,value:document.getElementById('colorValue').value,property:FZI.MathIllustration.editor.colorProperty,id:FZI.MathIllustration.editor.colorId,style:FZI.MathIllustration.editor.engine.get(FZI.MathIllustration.editor.colorId)?.style,status:document.getElementById('status').textContent}));
  assert.equal(pickerState.style.fill,'#33aa77',JSON.stringify(pickerState));
  await page.locator('#colorApply').click();
  let style=await page.evaluate(()=>{const a=FZI.MathIllustration.editor;return a.engine.get(a.selectedId).style;});
  assert.equal(style.fill,'#33aa77');assert.equal(style.stroke,'#314159');
  await precision.evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await precision.locator('xpath=..').locator('output').textContent(),'3');
  await pane.locator('[data-style="opacity"]').evaluate(el=>{el.value='35';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});
  style=await page.evaluate(()=>FZI.MathIllustration.editor.engine.get(FZI.MathIllustration.editor.selectedId).style);
  assert.equal(style.opacity,.35);assert.equal(style.stroke,'#314159');
  await page.evaluate(id=>FZI.MathIllustration.editor.openColor(id,'fill'),regionId);await page.locator('#colorNone').click();
  style=await page.evaluate(()=>FZI.MathIllustration.editor.engine.get(FZI.MathIllustration.editor.selectedId).style);
  assert.equal(style.fill,'none');assert.equal(style.stroke,'#314159');
  await page.evaluate(()=>FZI.MathIllustration.editor.radialProperties.close());
  const label=pane.page().locator(`#canvas .object-label[data-label-id="${regionId}"]`),box=await label.boundingBox();
  assert.ok(box,'visible area label is rendered through the shared object-label path');
  await page.evaluate(id=>{const a=FZI.MathIllustration.editor;a.updateObject(id,{labelOffsetX:1.25,labelOffsetY:-.75});a.invalidate();},regionId);
  assert.equal(await page.locator(`#canvas .object-label[data-label-id="${regionId}"]`).count(),1);
  assert.deepEqual(await page.evaluate(id=>{const o=FZI.MathIllustration.editor.engine.get(id);return [o.labelOffsetX,o.labelOffsetY,o.areaDisplay.position.mode];},regionId),[1.25,-.75,'auto']);
  await page.locator('#undoBtn').click();await page.locator('#redoBtn').click();
  await page.locator('#saveBtn').click();const saved=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
  await page.reload();assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),saved);
  await page.evaluate(id=>{const a=FZI.MathIllustration.editor,o=a.engine.get(id);a.engine.update(id,{areaDisplay:{...o.areaDisplay,precision:7}});a.selectObject(id);a.invalidate();},regionId);
  await activate('appearance');
  assert.equal(await page.locator('#propertiesSidebar [data-region-display="precision"]').inputValue(),'3');
  assert.equal((await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).areaDisplay,regionId)).precision,7);

  // The construction card must keep its own scrollport and sticky heading at a small viewport.
  await page.evaluate(()=>{
    const a=FZI.MathIllustration.editor;a.loadDocument({objects:[{id:'P',type:'point',x:0,y:0,name:'P'}]});
    a.selectObject('P');a.invalidate();a.radialProperties.openAt({x:innerWidth/2,y:innerHeight/2},false);
  });
  await page.locator('#radialPropertiesWheel [data-radial-action="construct"]').click();
  const constructPane=page.locator('#propertiesSidebar'),list=page.locator('#propertiesSidebar .radial-construction-options');
  await page.waitForFunction(()=>!document.querySelector('#propertiesSidebar .radial-construction-options').hidden);
  const dimensions=await constructPane.evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,overflow:getComputedStyle(el).overflowY,title:el.querySelector('.radial-detail-heading').getBoundingClientRect().top}));
  assert.ok(dimensions.scroll>dimensions.height);assert.match(dimensions.overflow,/auto|scroll/);
  await constructPane.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  const sticky=await constructPane.evaluate(el=>({title:el.querySelector('.radial-detail-heading').getBoundingClientRect().top,top:el.getBoundingClientRect().top}));
  assert.ok(Math.abs(sticky.title-sticky.top)<3);
  await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.radialProperties.closeDetail();a.radialProperties.openAt({x:innerWidth/2,y:innerHeight/2},false);});
  await page.locator('#radialPropertiesWheel [data-radial-action="appearance"]').click();
  assert.equal(await constructPane.evaluate(el=>el.scrollTop),0);
  await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
  return {regionFillStrokeOpacity:'passed',fillNone:'passed',precisionAndLegacyClamp:'passed',areaLabelDragHistoryAndPersistence:'passed',constructionScrollStickyAndReset:'passed'};
};
