const assert=require('node:assert/strict');
module.exports=async page=>{
  const ids=await page.evaluate(()=>{const app=FZI.MathIllustration.editor;app.loadDocument({objects:['a','b','c'].map((id,i)=>({id,type:'point',name:'Een zeer lange objectnaam '+id,x:i,y:0,showLabel:false}))});app.addLayer('Een zeer lange laagnaam voor smalle zijbalk');return app.engine.model.layers.map(l=>l.id);});
  await page.locator('#sidebarLayersTab').click();
  const layer=()=>page.locator('[data-layer-label="'+ids[0]+'"]'),object=id=>page.locator('[data-toggle-label="'+id+'"]');
  await object('a').click();assert.equal(await object('a').getAttribute('aria-pressed'),'true');assert.equal(await layer().getAttribute('aria-pressed'),'mixed');
  await layer().focus();await page.keyboard.press('Enter');assert.equal(await layer().getAttribute('aria-pressed'),'true');assert.equal(await layer().evaluate(n=>document.activeElement===n),true);
  await page.keyboard.press('Space');assert.equal(await layer().getAttribute('aria-pressed'),'false');
  await page.evaluate(()=>FZI.MathIllustration.editor.travelHistory());assert.equal(await layer().getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>FZI.MathIllustration.editor.travelHistory(true));assert.equal(await layer().getAttribute('aria-pressed'),'false');
  await page.locator('[data-object-visibility="a"]').click();await object('a').click();
  assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.get('a').visible),false);
  await page.evaluate(id=>{const app=FZI.MathIllustration.editor;app.changeDocument(()=>app.execute('layer.assign',{ids:['a'],layerId:id}));},ids[1]);
  await layer().click();assert.equal(await object('a').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{const app=FZI.MathIllustration.editor;app.changeDocument(()=>app.execute('object.setLock',{ids:['b'],value:true}));});assert.equal(await layer().isDisabled(),true);assert.equal(await object('b').isDisabled(),true);
  await page.setViewportSize({width:680,height:720});await page.locator('#toolsToggle').click();await page.locator('#sidebarLayersTab').click();
  const layout=await page.locator('.layer-header').evaluateAll(rows=>rows.map(row=>({width:row.clientWidth,scroll:row.scrollWidth,buttons:[...row.querySelectorAll('button')].map(b=>b.getBoundingClientRect().width)})));
  assert.ok(layout.every(row=>row.scroll<=row.width+1&&row.buttons.every(w=>w>=22)));
  await page.screenshot({path:'test-results/ui-layers-label-narrow.png'});
  return {keyboard:true,focus:true,mixed:true,history:true,locks:true,narrow:layout};
};

