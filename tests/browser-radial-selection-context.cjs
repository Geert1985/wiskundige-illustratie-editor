const assert=require('node:assert/strict');

module.exports=async page=>{
  const ids=()=>page.evaluate(()=>FZI.MathIllustration.editor.selectedIds);
  const doc=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
  const screen=point=>page.evaluate(point=>FZI.MathIllustration.editor.transform().mathToScreen(point),point);
  const reset=()=>page.evaluate(()=>{
    const a=FZI.MathIllustration.editor;
    a.setTool('select');
    a.loadDocument({objects:[
      {id:'p',type:'point',x:-1,y:0},
      {id:'q',type:'point',x:1,y:0},
      {id:'r',type:'point',x:0,y:1}
    ],presentation:{showGrid:false,bounds:{xMin:-4,xMax:4,yMin:-3,yMax:3}}});
    a.engine.renderer.showSnapPoints=false;a.invalidate();
  });
  const click=async(point,button='left')=>{
    const p=await screen(point);
    await page.mouse.click(p.x,p.y,{button});
  };
  const selectPair=async()=>{
    await click({x:-1,y:0});
    await page.keyboard.down('Shift');
    await click({x:1,y:0});
    await page.keyboard.up('Shift');
    assert.deepEqual(await ids(),['p','q']);
  };
  const wheel=page.locator('#radialPropertiesWheel');

  await reset();
  await selectPair();
  await click({x:-1,y:0},'right');
  await wheel.waitFor({state:'visible'});
  assert.deepEqual(await ids(),['p','q'],'right-clicking a selected member preserves the complete selection');
  assert.equal(await wheel.locator('.radial-center-caption').textContent(),'SELECTIE');
  await wheel.locator('[data-radial-action="group"]').click();
  let saved=await doc();
  assert.equal(saved.groups.length,1,'radial Groeperen creates a persistent group');
  assert.deepEqual(await ids(),['p','q']);
  assert.deepEqual(saved.groups[0].members,['p','q']);

  // The regular contextmenu route retains a different current selection too.
  await reset();
  await selectPair();
  await click({x:0,y:1},'right');
  await wheel.waitFor({state:'visible'});
  assert.deepEqual(await ids(),['p','q'],'contextmenu outside the selection keeps the existing selection');
  await page.keyboard.press('Escape');

  // Exercise the pointerup fallback directly; real right-click above exercises contextmenu.
  await reset();
  await selectPair();
  const outside=await screen({x:0,y:1});
  await page.locator('#canvasWrap').evaluate((node,point)=>node.dispatchEvent(new PointerEvent('pointerup',{
    bubbles:true,button:2,pointerId:7,pointerType:'mouse',clientX:point.x,clientY:point.y
  })),outside);
  await wheel.waitFor({state:'visible'});
  assert.deepEqual(await ids(),['p','q'],'pointerup fallback retains the existing selection');
  await page.keyboard.press('Escape');

  // With no prior selection, right-clicking an unselected object selects it.
  await reset();
  await click({x:0,y:1},'right');
  await wheel.waitFor({state:'visible'});
  assert.deepEqual(await ids(),['r']);
  assert.equal(await wheel.locator('.radial-center-caption').textContent(),'OBJECT');
  await page.keyboard.press('Escape');

  // Right-button drag remains a marquee gesture and must not open the wheel.
  await reset();
  const start=await screen({x:-2,y:.5}),end=await screen({x:2,y:-.5});
  await page.mouse.move(start.x,start.y);
  await page.mouse.down({button:'right'});
  await page.mouse.move(end.x,end.y,{steps:5});
  await page.mouse.up({button:'right'});
  assert.deepEqual(await ids(),['p','q']);
  assert.equal(await wheel.isHidden(),true,'right-drag marquee does not open the radial menu');
  saved=await doc();
  assert.equal(saved.groups,undefined,'selection gestures do not mutate the document');
  return {selectedMultiRightClickGroupsPersistently:'passed',contextmenuKeepsOtherSelection:'passed',pointerupFallbackKeepsSelection:'passed',unselectedObjectRightClick:'passed',rightDragMarquee:'passed'};
};
