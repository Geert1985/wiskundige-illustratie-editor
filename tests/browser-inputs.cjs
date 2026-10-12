const assert = require('node:assert/strict');
module.exports = async page => {
  await page.evaluate(() => FZI.MathIllustration.editor.loadDocument({ objects: [{ id: 'p', type: 'point', x: 0, y: 0 }], presentation: { showGrid: false } }));
  let nativeDialogs = 0;
  const unexpected = async dialog => { nativeDialogs++; await dialog.dismiss(); };
  page.on('dialog', unexpected);
  try {
    await require('./browser-tool-menu.cjs').choose(page,'[data-tool="text"]');
    const p = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: 2, y: 1 }));
    await page.mouse.click(p.x, p.y);
    await page.locator('#textDialog').waitFor({ state: 'visible', timeout: 2000 });
    const position = await page.evaluate(() => FZI.MathIllustration.editor.pendingText.point);
    await page.locator('#richTextSurface .ProseMirror').fill('Hallo <wereld>');
    await page.locator('#textForm button[type="submit"]').click();
    const object = await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects.at(-1));
    assert.equal(object.type, 'text'); assert.equal(object.text, 'Hallo <wereld>');
    assert.equal(object.x, position.x); assert.equal(object.y, position.y);
    assert.ok(Math.abs(object.x - 2) < .02); assert.ok(Math.abs(object.y - 1) < .02);
    assert.equal(await page.locator(`[data-object-id="${object.id}"]`).textContent(), object.text);
    await page.locator('#undoBtn').click(); assert.equal(await page.locator(`[data-object-id="${object.id}"]`).count(), 0);
    await page.locator('#redoBtn').click(); assert.equal(await page.locator(`[data-object-id="${object.id}"]`).count(), 1);
    await page.mouse.click(p.x, p.y); await page.locator('#richTextSurface .ProseMirror').fill('Niet toevoegen'); await page.locator('#richTextSurface .ProseMirror').press('Escape');
    assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects.length), 2);
    for (const id of ['p']) {
      const before = await page.evaluate(id => FZI.MathIllustration.editor.engine.get(id).style, id);
      await page.locator(`[data-select-object="${id}"]`).click();await page.locator(id==='p'?'[data-fill-object]':'[data-style-color]').click();
      await page.locator('#colorDialog').waitFor({ state: 'visible' });
      await page.locator('[data-editor-color]').fill('#123456');
      await page.locator('#colorApply').click();
      const style = await page.evaluate(id => FZI.MathIllustration.editor.engine.get(id).style, id);
      assert.equal(style.fill, '#123456'); if (id === 'p') assert.equal(style.stroke, before.stroke);
      await page.locator('#undoBtn').click(); assert.deepEqual(await page.evaluate(id => FZI.MathIllustration.editor.engine.get(id).style, id), before);
      await page.locator('#redoBtn').click();
      await page.locator(`[data-select-object="${id}"]`).click();await page.locator(id==='p'?'[data-fill-object]':'[data-style-color]').click();
      await page.locator('[data-editor-color]').fill('#abcdef'); await page.locator('#colorCancel').click();
      assert.deepEqual(await page.evaluate(id => FZI.MathIllustration.editor.engine.get(id).style, id), style);
    }
    // Approved main UX: text styles belong to Text bewerken, using the shared palette.
    const beforeText=await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id),object.id);
    await page.locator(`[data-select-object="${object.id}"]`).click();
    assert.equal(await page.locator('#selectionPanel [data-style-color]').count(),0);
    await page.locator('[data-rich-text-edit]').click();await page.locator('#textDialog').waitFor({state:'visible'});
    await page.evaluate(()=>{const view=FZI.MathIllustration.editor.richTextEditor.view,Selection=view.state.selection.constructor;view.dispatch(view.state.tr.setSelection(Selection.create(view.state.doc,1,view.state.doc.content.size-1)));});
    await page.locator('#richColor').click();await page.locator('#richColorMenu [data-color="#457b9d"]').click();
    await page.locator('#textForm button[type="submit"]').click();
    const afterText=await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id),object.id);
    assert.ok(afterText.textContent.paragraphs.flatMap(p=>p.runs).every(r=>r.marks.color==='#457b9d'));
    assert.equal(afterText.textContent.defaults.fontSize,beforeText.textContent.defaults.fontSize);
    assert.deepEqual(afterText.style,beforeText.style);
    await page.locator('#undoBtn').click();assert.deepEqual(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id),object.id),beforeText);
    await page.locator('#redoBtn').click();assert.deepEqual(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id),object.id),afterText);
    await page.locator(`[data-select-object="${object.id}"]`).click();await page.locator('[data-rich-text-edit]').click();
    await page.locator('#richColor').click();await page.locator('#richColorMenu [data-color="#f4a261"]').click();await page.locator('#textCancel').click();
    assert.deepEqual(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id),object.id),afterText);
    assert.equal(nativeDialogs, 0);
    return { textAddUndoRedo: 'passed', textEscape: 'passed', pointAndTextColor: 'passed', colorCancel: 'passed', nativeDialogs };
  } finally { page.off('dialog', unexpected); }
};
