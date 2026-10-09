const assert=require('node:assert/strict');
module.exports=async page=>{
  const objects=[{id:'p',type:'point',x:0,y:0},{id:'l',type:'line',x1:-2,y1:1,x2:2,y2:1},{id:'c',type:'circle',cx:2,cy:-1,r:.5},{id:'poly',type:'polygon',vertices:[{x:-3,y:-1},{x:-2,y:-1},{x:-2,y:-2}]},{id:'straight',type:'straight',x1:0,y1:2,x2:1,y2:2},{id:'ray',type:'ray',x1:0,y1:-2,x2:1,y2:-2},{id:'hidden',type:'point',x:0,y:0,visible:false},{id:'locked',type:'point',x:.2,y:0,locked:true},{id:'text',type:'text',x:3,y:1,text:'Rotated',rotation:45,style:{fontSize:24}}];
  const load=()=>page.evaluate(objects=>{const app=FZI.MathIllustration.editor;app.loadDocument({objects,presentation:{bounds:{xMin:-5,xMax:5,yMin:-3,yMax:3},showGrid:false}});app.setTool('select');window.m1Menus=[];document.getElementById('canvasWrap').addEventListener('contextmenu',e=>window.m1Menus.push(e.defaultPrevented),{once:true});},objects);
  const ids=()=>page.evaluate(()=>FZI.MathIllustration.editor.selectedIds);
  const screen=p=>page.evaluate(p=>FZI.MathIllustration.editor.transform().mathToScreen(p),p);
  const drag=async(a,b,modifier)=>{if(modifier)await page.keyboard.down(modifier);a=await screen(a);b=await screen(b);await page.mouse.move(a.x,a.y);await page.mouse.down({button:'right'});await page.mouse.move(b.x,b.y,{steps:5});await page.mouse.up({button:'right'});if(modifier)await page.keyboard.up(modifier);};
  await load();const before=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
  await drag({x:-.5,y:.5},{x:.5,y:-.5});assert.deepEqual(await ids(),['p','locked']);
  assert.deepEqual(await page.evaluate(()=>window.m1Menus),[true],'only dragged contextmenu suppressed');
  assert.equal(await page.locator('#canvas .selected').count(),2);assert.equal(await page.locator('#viewList .view-row-selected').count(),2);assert.match(await page.locator('#selectionPanel').textContent(),/2/);
  await drag({x:-.5,y:1.2},{x:.5,y:.8});assert.deepEqual(await ids(),[],'contain does not select partially enclosed line');
  await drag({x:.5,y:1.2},{x:-.5,y:.8});assert.deepEqual(await ids(),['l'],'cross selects touched line');
  await drag({x:-.5,y:.5},{x:.5,y:-.5},'Shift');assert.deepEqual(await ids(),['l','p','locked']);
  await page.keyboard.down('Shift');await drag({x:-.5,y:.5},{x:.5,y:-.5},'Control');await page.keyboard.up('Shift');assert.deepEqual(await ids(),['l']);
  await page.keyboard.down('Shift');await drag({x:-.5,y:.5},{x:.5,y:-.5},'Meta');await page.keyboard.up('Shift');assert.deepEqual(await ids(),['l','p','locked']);
  const lockedBefore=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),lockStart=await screen({x:0,y:0});await page.mouse.move(lockStart.x,lockStart.y);await page.mouse.down();await page.mouse.move(lockStart.x+20,lockStart.y);await page.mouse.up();assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),lockedBefore,'marquee does not bypass locked group editing');
  await drag({x:2.4,y:-.6},{x:2.5,y:-.5});assert.deepEqual(await ids(),[],'circle corner is not shape');
  await drag({x:-3.2,y:-.8},{x:-1.8,y:-2.2});assert.deepEqual(await ids(),['poly']);
  await drag({x:-3,y:2.1},{x:-3.5,y:1.9});assert.deepEqual(await ids(),['straight']);
  await drag({x:-3,y:-1.9},{x:-3.5,y:-2.1});assert.deepEqual(await ids(),[],'ray does not extend backwards');
  await drag({x:1,y:-1.9},{x:.5,y:-2.1});assert.deepEqual(await ids(),['ray']);
  assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),before);
  // Actual rendered text (font size and rotation), and label-only dimensions.
  const textBox=await page.locator('[data-object-id="text"] text').first().boundingBox();
  await page.mouse.move(textBox.x-3,textBox.y-3);await page.mouse.down({button:'right'});await page.mouse.move(textBox.x+textBox.width+3,textBox.y+textBox.height+3);await page.mouse.up({button:'right'});assert.ok((await ids()).includes('text'));
  await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.engine.add({id:'labelOnly',type:'dimension',x1:-3,y1:0,x2:-2,y2:0,measurementLabelOnly:true,labelOffsetX:0,labelOffsetY:1});a.invalidate();});
  const labelBox=await page.locator('[data-object-id="labelOnly"] [data-measurement-label] text').boundingBox();
  await page.mouse.move(labelBox.x-2,labelBox.y-2);await page.mouse.down({button:'right'});await page.mouse.move(labelBox.x+labelBox.width+2,labelBox.y+labelBox.height+2);await page.mouse.up({button:'right'});assert.ok((await ids()).includes('labelOnly'));
  await drag({x:-2.1,y:.05},{x:-2.9,y:-.05});assert.ok(!(await ids()).includes('labelOnly'),'invisible measurement arms do not select');
  await page.evaluate(()=>FZI.MathIllustration.editor.engine.remove('labelOnly'));await page.evaluate(()=>FZI.MathIllustration.editor.invalidate());
  // Real responsive viewport and changed mathematical bounds.
  for(const width of [980,1440]){
    await page.setViewportSize({width,height:900});await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.engine.renderer.setBounds({xMin:-4,xMax:4,yMin:-3,yMax:3});a.invalidate();});
    await drag({x:-.5,y:.5},{x:.5,y:-.5});assert.deepEqual(await ids(),['p','locked']);
  }
  await page.setViewportSize({width:1280,height:900});await load();
  // Every teardown uses the single controller cancellation path.
  for(const action of ['Escape','pointercancel','blur','capture','dispose','new']){
    await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.selectedIds=['l'];a.invalidate();});
    const a=await screen({x:-.5,y:.5}),b=await screen({x:.5,y:-.5});await page.mouse.move(a.x,a.y);await page.mouse.down({button:'right'});await page.mouse.move(b.x,b.y);
    if(action==='Escape')await page.keyboard.press('Escape');else await page.evaluate(action=>{const app=FZI.MathIllustration.editor;if(action==='dispose'){app.dispose();app.init();}else if(action==='new')app.newDocument();else if(action==='capture'){document.getElementById('canvasWrap').releasePointerCapture(app.interaction.pointerId);}else if(action==='blur')window.dispatchEvent(new Event('blur'));else window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:app.interaction.pointerId}));},action);
    await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction),null,action);assert.deepEqual(await ids(),action==='new'?[]:['l'],action);if(action==='new')await load();
  }
  // Native right click retains its contextmenu, while real mouseup outside commits.
  await page.evaluate(()=>{window.m1Click=null;document.getElementById('canvasWrap').addEventListener('contextmenu',e=>window.m1Click=e.defaultPrevented,{once:true});});
  const a=await screen({x:-.5,y:.5});await page.mouse.click(a.x,a.y,{button:'right'});assert.equal(await page.evaluate(()=>window.m1Click),false);
  await page.mouse.move(a.x,a.y);await page.mouse.down({button:'right'});await page.mouse.move(1270,880);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction),null);assert.ok((await ids()).includes('p'));
  // Keyboard route: same resolver, no pointer event or geometry mutation.
  await load();await page.locator('#canvasWrap').click({position:{x:10,y:10}});await page.keyboard.press('k');assert.equal(await page.locator('[data-selection-cursor]').count(),1);await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');for(let i=0;i<2;i++){await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');}await page.keyboard.press('Enter');assert.deepEqual(await ids(),['p']);
  await page.keyboard.press('k');await page.keyboard.press('c');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.rule),'cross');await page.keyboard.press('Alt+ArrowRight');await page.keyboard.press('Escape');assert.deepEqual(await ids(),['p']);assert.equal(await page.locator('[data-selection-cursor]').count(),0);
  assert.equal(await page.locator('[data-selection-rectangle]').count(),0);
  return {geometry:'passed',direction:'passed',modifiers:'passed',hiddenLocked:'passed',responsiveZoom:'passed',cancelEscapeBlurCaptureNewDispose:'passed',contextmenu:'passed',outsideMouseup:'passed',keyboard:'passed',renderSync:'passed'};
};
