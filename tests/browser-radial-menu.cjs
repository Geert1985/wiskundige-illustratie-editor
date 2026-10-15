// Browser regression: curved hub, native controls and hidden-point Actions.
const assert = require('node:assert/strict');
module.exports = async page => {
  await page.evaluate(() => {
    const app=FZI.MathIllustration.editor;
    app.loadDocument({objects:[{id:'point-3',type:'point',name:'point-3',x:0,y:0,showLabel:false,visible:true,locked:false}]});
    app.setTool('select');
    app.selectObject('point-3');
    app.radialProperties.openAt(null);
  });
  const wheel=page.locator('#radialPropertiesWheel');
  // UI-RADIAL-11: all six buttons use one shared shape and independent
  // SVG paint servers, with intact counter-rotation and native interactions.
  const petals=wheel.locator('.radial-segment');
  assert.equal(await petals.count(),6);
  assert.equal(await wheel.locator('.radial-segment-silhouette').count(),6);
  assert.equal(await wheel.locator('.radial-segment-inset').count(),6);
  assert.equal(await wheel.locator('.radial-segment-sheen').count(),6);
  const outer=await page.evaluate(()=>{
    const nodes=[...document.querySelectorAll('#radialPropertiesWheel .radial-segment')];
    return nodes.map((node,i)=>{
      const shape=node.querySelector('.radial-segment-silhouette');
      const defs=[...node.querySelectorAll('linearGradient')];
      const fill=getComputedStyle(shape).fill,stroke=getComputedStyle(shape).stroke;
      const face=node.querySelector('.radial-segment-content');
      return {action:node.dataset.radialAction,name:node.getAttribute('aria-label'),
        contour:shape.getAttribute('d'),
        servers:defs.map(gradient=>gradient.id),fill,stroke,
        angle:node.style.getPropertyValue('--radial-angle'),
        counterAngle:face.style.getPropertyValue('--radial-counter-angle')||
          node.style.getPropertyValue('--radial-counter-angle')};
    });
  });
  assert.equal(new Set(outer.map(item=>item.contour)).size,1,
    'all categories must share precisely the same Bezier geometry');
  const petalWidth=await wheel.locator('.radial-segment-silhouette').first()
    .evaluate(shape=>shape.getBBox().width);
  assert.ok(petalWidth<=168,
    'outer petals should be narrow enough to leave a visible gap');
  assert.equal(new Set(outer.flatMap(item=>item.servers)).size,12,
    'surface and gold rim gradient IDs must be unique');
  assert.ok(outer.every(item=>item.servers.length===2 &&
    item.fill.includes('url(') && item.stroke.includes('url(')));
  for(let i=0;i<outer.length;i++){
    assert.equal(outer[i].angle,(i*60)+'deg');
    assert.equal(outer[i].counterAngle,(-i*60)+'deg');
  }
  const appearanceButton=wheel.locator('[data-radial-action="appearance"]');
  const topStop=appearanceButton.locator('.radial-segment-stop-top');
  const beforeHover=await topStop.evaluate(node=>getComputedStyle(node).stopColor);
  await appearanceButton.hover();
  await page.waitForTimeout(250);
  const duringHover=await topStop.evaluate(node=>getComputedStyle(node).stopColor);
  assert.notEqual(duringHover,beforeHover,'hover should highlight the navy gradient');
  await appearanceButton.click();
  assert.equal(await appearanceButton.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#propertiesSidebar .radial-detail-title').textContent(),'Uiterlijk');
  const hub=wheel.locator('.radial-center');
  const input=hub.locator('.radial-center-input');
  const label=hub.locator('[data-radial-toggle="label"]');
  const lock=hub.locator('[data-radial-toggle="lock"]');
  assert.equal(await label.count(),1);
  assert.equal(await lock.count(),1);
  assert.equal(await hub.locator('.radial-center-lower-skin path').count(),4);
  const bounds=await page.evaluate(() => {
    const hub=document.querySelector('.radial-center').getBoundingClientRect();
    const input=document.querySelector('.radial-center-input').getBoundingClientRect();
    return {hub:{left:hub.left,right:hub.right},input:{left:input.left,right:input.right}};
  });
  assert.ok(bounds.input.left>bounds.hub.left && bounds.input.right<bounds.hub.right,
    'object name remains entirely within the center disc');
  assert.equal(await hub.locator('.radial-center-name-shape').count(),1);
  assert.equal(await hub.locator('.radial-center-control-left').count(),1);
  assert.equal(await hub.locator('.radial-center-control-right').count(),1);
  assert.equal(await hub.locator('.radial-center-divider').count(),1);
  const separator=await page.evaluate(()=>{
    const hub=document.querySelector('.radial-center-lower-skin');
    const name=hub.querySelector('.radial-center-name-shape');
    const wedges=[...hub.querySelectorAll('.radial-center-control-left,.radial-center-control-right')];
    return {nameStroke:getComputedStyle(name).stroke,
      wedgesWithoutStroke:wedges.every(node=>getComputedStyle(node).stroke==='none'),
      divider:getComputedStyle(hub.querySelector('.radial-center-divider')).stroke};
  });
  assert.ok(separator.wedgesWithoutStroke,'wedges must not duplicate the gold name border');

  const geometry=await page.evaluate(() => {
    const input=document.querySelector('#radialPropertiesWheel input.radial-center-input');
    const control=document.querySelector('#radialPropertiesWheel button.radial-center-control-label');
    const style=getComputedStyle(input),buttonStyle=getComputedStyle(control);
    return {background:style.backgroundColor,border:style.borderTopWidth,
      inputBottom:input.getBoundingClientRect().bottom,
      controlTop:control.getBoundingClientRect().top,
      width:input.getBoundingClientRect().width,controlWidth:control.getBoundingClientRect().width,
      buttonBackground:buttonStyle.backgroundColor};
  });
  assert.match(geometry.background,/^(transparent|rgba\\(0, 0, 0, 0\\))$/,
    'the name input must not paint an opaque rectangular backdrop');
  assert.equal(geometry.border,'0px','the name input has no rectangular border');
  assert.ok(geometry.inputBottom+3<geometry.controlTop,
    'label and lock hit targets sit strictly below the name input');
  assert.ok(geometry.controlWidth<geometry.width*.6,
    'lower buttons must occupy separate halves of the hub');
  const wedges=await page.evaluate(()=>{
    const hub=document.querySelector('.radial-center').getBoundingClientRect();
    return [...document.querySelectorAll('[data-radial-toggle]')].map(button=>{
      const rect=button.getBoundingClientRect();
      return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,
        centerX:(rect.left+rect.right)/2,hubCenterX:(hub.left+hub.right)/2};
    });
  });
  assert.equal(wedges.length,2);
  assert.ok(wedges[0].right<=wedges[1].left,'button hit targets cannot overlap');
  assert.ok(wedges[0].centerX<wedges[0].hubCenterX &&
    wedges[1].centerX>wedges[1].hubCenterX,'icons belong to different semicircles');
  assert.equal(await input.inputValue(),'point-3');
  await label.click();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.get('point-3').showLabel),true);
  await label.click();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.get('point-3').showLabel),false);
  await lock.click();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.get('point-3').locked),true);
  assert.equal(await label.isDisabled(),true,'locked object cannot edit its label');
  assert.equal(await input.isEditable(),false);
  await lock.click();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.get('point-3').locked),false);
  await wheel.locator('[data-radial-action="actions"]').click();
  const detail=page.locator('#propertiesSidebar');
  const hide=detail.locator('[data-visibility-selection]');
  assert.equal(await detail.getAttribute('data-radial-context'),'point');
  assert.equal(await detail.locator('.object-heading>div:first-child').isVisible(),false);
  await hide.click();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.get('point-3').visible),false);
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.get('point-3').showLabel),false);
  assert.equal(await detail.getAttribute('data-radial-context'),'point',
    'hide does not change point identity');
  assert.equal(await detail.locator('.object-heading>div:first-child').isVisible(),false,
    'hiding a point must not reveal an extra name field');
  await hide.click();
  assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.get('point-3').visible),true);
  return {curvedHub:'passed',labelToggle:'passed',positionLock:'passed',hiddenPointName:'passed'};
};
