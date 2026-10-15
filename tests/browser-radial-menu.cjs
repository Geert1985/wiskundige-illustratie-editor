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
  const hub=wheel.locator('.radial-center');
  const input=hub.locator('.radial-center-input');
  const label=hub.locator('[data-radial-toggle="label"]');
  const lock=hub.locator('[data-radial-toggle="lock"]');
  assert.equal(await label.count(),1);
  assert.equal(await lock.count(),1);
  assert.equal(await hub.locator('.radial-center-lower-skin path').count(),3);
  const bounds=await page.evaluate(() => {
    const hub=document.querySelector('.radial-center').getBoundingClientRect();
    const input=document.querySelector('.radial-center-input').getBoundingClientRect();
    return {hub:{left:hub.left,right:hub.right},input:{left:input.left,right:input.right}};
  });
  assert.ok(bounds.input.left>bounds.hub.left && bounds.input.right<bounds.hub.right,
    'object name remains entirely within the center disc');
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
