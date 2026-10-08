const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
module.exports = async page => {
  const cachedModel = fs.readFileSync(path.join(__dirname, '..', 'model.js'), 'utf8').replace(/^\s*MI\.LINEAR_OBJECT_TYPES\s*=.*;\r?\n/m, '');
  const pattern = /\/model\.js(?:\?.*)?$/;
  await page.route(pattern, route => route.fulfill({ contentType: 'text/javascript', body: cachedModel }));
  try {
    await page.reload();
    const versions = await page.evaluate(() => Array.from(document.scripts, script => new URL(script.src).searchParams.get('v')));
    assert.ok(versions.every(Boolean)); assert.equal(new Set(versions).size, 1);
    for (const type of ['line', 'straight', 'ray', 'vector']) {
      await page.locator(`[data-tool="${type}"]`).click();
      const start = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: -2, y: -1 }));
      const end = await page.evaluate(() => FZI.MathIllustration.editor.transform().mathToScreen({ x: 1, y: 1 }));
      const bounds = await page.evaluate(() => FZI.MathIllustration.editor.engine.renderer.bounds);
      await page.mouse.move(start.x, start.y); await page.mouse.down();
      assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.interaction.mode), 'draw', type);
      await page.mouse.move(end.x, end.y); await page.mouse.up();
      assert.equal(await page.evaluate(() => FZI.MathIllustration.editor.engine.model.objects.at(-1).type), type);
      assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.editor.engine.renderer.bounds), bounds);
    }
  } finally { await page.unroute(pattern); }
  return { cachedModelWithoutRegistry: 'passed', allFourDrawingTools: 'passed', noPan: 'passed', consistentAssetVersion: 'passed' };
};
