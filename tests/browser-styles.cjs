const assert=require('node:assert/strict'),fs=require('node:fs');
module.exports=async page=>{
  await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[
    {id:'p',type:'point',x:-3,y:0}, {id:'l',type:'line',x1:-3,y1:-1,x2:3,y2:-1,style:{dash:'3 7',extension:{keep:true}}},
    {id:'c',type:'circle',cx:0,cy:0,r:1}, {id:'poly',type:'polygon',vertices:[{x:1,y:1},{x:3,y:1},{x:2,y:2}]},
    {id:'t',type:'text',x:0,y:2,text:'Tekstgrootte',style:{extension:{keep:true}}}
  ]}));
  const doc=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
  async function select(id,filter='appearance'){await page.evaluate(({id,filter})=>{const a=FZI.MathIllustration.editor;a.selectObject(id);a.radialProperties.openAt({x:innerWidth/2,y:innerHeight/2},false);a.radialProperties.choose(filter);},{id,filter});}
  async function edit(key,value) {const input=page.locator(`[data-style="${key}"]`);if(await input.getAttribute('type')==='range'){await input.evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},String(value));}else{await input.fill(String(value));await input.press('Tab');}}
  async function roundtrip(action) {const before=await doc();await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.radialProperties.openAt({x:innerWidth/2,y:innerHeight/2},false);a.radialProperties.choose('appearance');});await action();const after=await doc();assert.notDeepEqual(after,before);await page.evaluate(()=>FZI.MathIllustration.editor.travelHistory(false));assert.deepEqual(await doc(),before);await page.evaluate(()=>FZI.MathIllustration.editor.travelHistory(true));assert.deepEqual(await doc(),after);}
  await select('l');
  assert.equal(await page.locator('[data-style-dash][aria-pressed=true]').getAttribute('value'),'3 7');
  assert.equal(await page.locator('[data-style="strokeWidth"]').getAttribute('type'),'range');
  assert.equal(await page.locator('[data-style-color]').textContent(),'');
  assert.equal(await page.locator('[data-style-color]').getAttribute('aria-label'),'Lijnkleur wijzigen');
  await roundtrip(async()=>{const slider=page.locator('[data-style="strokeWidth"]');await slider.focus();await slider.press('ArrowRight');});
  assert.match(await page.locator('[data-style=strokeWidth]+output').textContent(),/px/);
  await roundtrip(()=>edit('strokeWidth',4));await roundtrip(()=>page.locator('[data-style-dash][value="8 5" ]').click());
  assert.equal(await page.locator('[data-object-id="l"] line').getAttribute('stroke-width'),'4');assert.equal(await page.locator('[data-object-id="l"] line').getAttribute('stroke-dasharray'),'8 5');
  assert.equal((await doc()).objects.find(o=>o.id==='l').style.extension.keep,true);
  for(const id of ['p','c','poly']) {
    await select(id);

    const stroke=(await doc()).objects.find(o=>o.id===id).style.stroke;
    await roundtrip(async()=>{await page.locator('[data-fill-object]').click();await page.locator('[data-editor-color]').fill('#abcdef');await page.locator('#colorApply').click();});
    assert.equal((await doc()).objects.find(o=>o.id===id).style.fill,'#abcdef');assert.equal((await doc()).objects.find(o=>o.id===id).style.stroke,stroke);
    await roundtrip(async()=>{await page.locator('[data-style-color]').click();await page.locator('[data-editor-color]').fill('#e63946');await page.locator('#colorApply').click();});
    assert.equal((await doc()).objects.find(o=>o.id===id).style.fill,'#abcdef');assert.equal((await doc()).objects.find(o=>o.id===id).style.stroke,'#e63946');
    await roundtrip(()=>edit('opacity',40));assert.equal(await page.locator(`[data-object-id="${id}"]`).getAttribute('opacity'),'0.4');
    await roundtrip(async()=>{await page.locator('[data-fill-object]').click();await page.locator('#colorNone').click();});
    assert.equal((await doc()).objects.find(o=>o.id===id).style.fill,'none');
  }
  await select('t');assert.equal(await page.locator('[data-style="strokeWidth"]').count(),0);
  assert.equal(await page.locator('#selectionPanel [data-style="fontSize"]').count(),0);
  async function textSize(value){await select('t','editText');await page.locator('#textDialog').waitFor({state:'visible'});await page.evaluate(()=>{const view=FZI.MathIllustration.editor.richTextEditor.view,Selection=view.state.selection.constructor;view.dispatch(view.state.tr.setSelection(Selection.create(view.state.doc,1,view.state.doc.content.size-1)));});await page.locator('#richFontSize').selectOption(String(value));await page.locator('#textForm button[type="submit"]').click();}
  const textOpacity=value=>page.evaluate(value=>{const app=FZI.MathIllustration.editor;app.changeDocument(()=>app.engine.update('t',{style:{opacity:value}}));},value);
  await roundtrip(()=>textSize(80/3));await roundtrip(()=>textOpacity(.5));
  assert.equal((await doc()).objects.find(o=>o.id==='t').textContent.paragraphs[0].runs[0].marks.fontSize,80/3);assert.equal(await page.locator('[data-object-id="t"]').getAttribute('opacity'),'0.5');
  assert.equal((await doc()).objects.find(o=>o.id==='t').style.extension.keep,true);
  assert.equal(await page.locator('[data-style-apply]').count(),0);
  await roundtrip(()=>textSize(112/3));await roundtrip(()=>textOpacity(.6));
  assert.equal((await doc()).objects.find(o=>o.id==='t').textContent.paragraphs[0].runs[0].marks.fontSize,112/3);
  const valid=await doc();assert.equal(await page.evaluate(()=>{try{FZI.MathIllustration.editor.engine.update('t',{style:{fontSize:0}});return false;}catch{return true;}}),true);assert.deepEqual(await doc(),valid);
  assert.equal(await page.locator('#selectionPanel [data-style="opacity"]').count(),0);
  assert.equal(await page.evaluate(()=>{try{FZI.MathIllustration.editor.engine.update('t',{style:{opacity:1.01}});return false;}catch{return true;}}),true);assert.deepEqual(await doc(),valid);
  const download=page.waitForEvent('download');await require('./browser-tool-menu.cjs').action(page,'#exportSvgBtn');const svg=fs.readFileSync(await(await download).path(),'utf8');assert.match(svg,/font-size="37\.333/);assert.match(svg,/stroke-dasharray="8 5"/);assert.match(svg,/opacity="0.6"/);
  await page.locator('#saveBtn').click();const saved=await doc();await page.reload();assert.deepEqual(await doc(),saved);
  await page.locator('#fileInput').setInputFiles({name:'styles.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await page.waitForFunction(()=>document.getElementById('status').textContent==='Illustratie geladen.');assert.deepEqual(await doc(),saved);
  await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
  return {strokeWidthDash:'passed',customDashPreserved:'passed',fillAndSeparateColor:'passed',opacity:'passed',fontSize:'passed',undoRedo:'passed',invalidValues:'passed',SVGSaveReloadImport:'passed'};
};
