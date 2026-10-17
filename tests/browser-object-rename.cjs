const assert = require('node:assert/strict');

module.exports = async page => {
  const snapshot = () => page.evaluate(() => FZI.MathIllustration.editor.engine.toJSON());
  const historyCount = () => page.evaluate(() => FZI.MathIllustration.editor.history.entries.length);
  const selected = () => page.evaluate(() => FZI.MathIllustration.editor.selectedIds.slice());
  await page.evaluate(() => FZI.MathIllustration.editor.loadDocument({
    objects: [{ id: 'point-a', type: 'point', name: 'A', x: 1, y: 2, showLabel: true }],
    presentation: { showGrid: false }
  }));
  await page.locator('#sidebarLayersTab').click();
  const name = page.locator('[data-select-object="point-a"]');

  await name.dblclick();
  const cancelled = page.locator('[data-rename-object="point-a"]');
  assert.equal(await cancelled.inputValue(), 'A');
  assert.deepEqual(await cancelled.evaluate(el => [el.selectionStart, el.selectionEnd]), [0, 1]);
  const original = await snapshot(), beforeCancelHistory = await historyCount();
  await cancelled.fill('Niet bewaren');
  await cancelled.press('Escape');
  assert.deepEqual(await snapshot(), original, 'Escape cancels the name change');
  assert.equal(await historyCount(), beforeCancelHistory, 'Escape does not add history');
  assert.equal(await page.locator('[data-rename-object]').count(), 0);

  await page.locator('[data-select-object="point-a"]').dblclick();
  const editor = page.locator('[data-rename-object="point-a"]');
  await editor.fill('Punt Alfa');
  const beforeRenameHistory = await historyCount();
  await editor.press('Enter');
  let saved = await snapshot();
  assert.equal(saved.objects[0].name, 'Punt Alfa');
  assert.equal(saved.objects[0].id, 'point-a', 'rename keeps the object identity');
  assert.deepEqual(await selected(), ['point-a'], 'rename keeps the selection');
  assert.equal(await historyCount(), beforeRenameHistory + 1, 'rename is one history action');
  assert.match(await page.locator('[data-select-object="point-a"]').innerText(), /^Punt Alfa/);
  assert.match(await page.locator('#canvas').innerText(), /Punt Alfa/);

  await page.locator('#undoBtn').click();
  assert.equal((await snapshot()).objects[0].name, 'A', 'undo restores the previous name');
  await page.locator('#redoBtn').click();
  assert.equal((await snapshot()).objects[0].name, 'Punt Alfa', 'redo reapplies the name');

  await page.locator('[data-select-object="point-a"]').dblclick();
  const blank = page.locator('[data-rename-object="point-a"]');
  await blank.fill('   ');
  const beforeBlankHistory = await historyCount();
  await blank.press('Enter');
  assert.equal((await snapshot()).objects[0].name, 'Punt Alfa', 'blank names are ignored');
  assert.equal(await historyCount(), beforeBlankHistory, 'invalid names do not add history');

  await page.locator('#saveBtn').click();
  saved = await snapshot();
  await page.reload();
  assert.deepEqual(await snapshot(), saved, 'save and reload preserve the name');
  assert.match(await page.locator('[data-select-object="point-a"]').innerText(), /^Punt Alfa/);
  return { inlineRename: 'passed', selectionAndIdentity: 'passed', escape: 'passed', undoRedo: 'passed', persistenceAndDisplay: 'passed' };
};
