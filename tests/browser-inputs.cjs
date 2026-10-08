const assert = require('node:assert/strict');
module.exports = async page => {
  await page.evaluate(() => FZI.MathIllustration.editor.loadDocument({ objects: [{ id: 'p', type: 'point', x: 0, y: 0 }], presentation: { showGrid: false } }));
  let nativeDialogs = 0;
  const unexpected = async dialog => { nativeDialogs++; await dialog.dismiss(); };
  page.on('dialog', unexpected);
  try {
    await page.locator('[data-tool="text"]').click();
    const p = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: 2, y: 1 }));
    await page.mouse.click(p.x, p.y);
    await page.locator('#textDialog').waitFor({ state: 'visible', timeout: 2000 });
    const position = await page.evaluate(() => FZI.MathIllustration.editor.pendingText.point);
    await page.locator('#textValue').fill('Hallo <wereld>');
    await page.locator('#textForm button[type="submit"]').click();
    const object = await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects.at(-1));
    assert.equal(object.type, 'text'); assert.equal(object.text, 'Hallo <wereld>');
    assert.equal(object.x, position.x); assert.equal(object.y, position.y);
    assert.ok(Math.abs(object.x - 2) < .02); assert.ok(Math.abs(object.y - 1) < .02);
    assert.equal(await page.locator(`[data-object-id="${object.id}"]`).textContent(), object.text);
    await page.locator('#undoBtn').click(); assert.equal(await page.locator(`[data-object-id="${object.id}"]`).count(), 0);
    await page.locator('#redoBtn').click(); assert.equal(await page.locator(`[data-object-id="${object.id}"]`).count(), 1);
    await page.mouse.click(p.x, p.y); await page.locator('#textValue').fill('Niet toevoegen'); await page.locator('#textValue').press('Escape');
    assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects.length), 2);
    for (const id of ['p', object.id]) {
      const before = await page.evaluate(id => FZI.MathIllustration.editor.engine.get(id).style, id);
      await page.locator(`[data-color-object="${id}"]`).click();
      await page.locator('#colorDialog').waitFor({ state: 'visible' });
      await page.locator('[data-editor-color]').fill('#123456');
      await page.locator('#colorApply').click();
      const style = await page.evaluate(id => FZI.MathIllustration.editor.engine.get(id).style, id);
      assert.equal(style.fill, '#123456'); if (id === 'p') assert.equal(style.stroke, '#123456');
      await page.locator('#undoBtn').click(); assert.deepEqual(await page.evaluate(id => FZI.MathIllustration.editor.engine.get(id).style, id), before);
      await page.locator('#redoBtn').click();
      await page.locator(`[data-color-object="${id}"]`).click();
      await page.locator('[data-editor-color]').fill('#abcdef'); await page.locator('#colorCancel').click();
      assert.deepEqual(await page.evaluate(id => FZI.MathIllustration.editor.engine.get(id).style, id), style);
    }
    assert.equal(nativeDialogs, 0);
    return { textAddUndoRedo: 'passed', textEscape: 'passed', pointAndTextColor: 'passed', colorCancel: 'passed', nativeDialogs };
  } finally { page.off('dialog', unexpected); }
};
