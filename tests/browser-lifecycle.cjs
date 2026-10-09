const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/lifecycle-v2.json'), 'utf8'));
module.exports = async function verifyLifecycle(page) {
  const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
  const app = fn => page.evaluate(fn);
  // Keep the helper argument explicit rather than depending on page globals.
  const reset = async () => { await page.mouse.up(); await page.evaluate(data => FZI.MathIllustration.editor.loadDocument(data), fixture); await require('./browser-tool-menu.cjs').choose(page,'[data-tool="select"]'); };
  const doc = () => app(() => FZI.MathIllustration.editor.engine.toJSON());
  const screen = point => page.evaluate(point => FZI.MathIllustration.CoordinateTransform.forCanvas(FZI.MathIllustration.editor.engine).mathToScreen(point), point);
  const move = async point => { const p = await screen(point); await page.mouse.move(p.x, p.y); };
  const select = id => page.locator(`[data-select-object="${id}"]`).click();
  const center = async locator => { const b = await locator.boundingBox(); assert.ok(b); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const begin = async mode => {
    if (mode === 'endpoint') await select('l'); else await select('p');
    if (mode === 'draw') await require('./browser-tool-menu.cjs').choose(page,'[data-tool="line"]');
    if (mode === 'label' || mode === 'endpoint') {
      const p = await center(page.locator(mode === 'label' ? '[data-label-id="p"]' : '.fzi-line-endpoint[data-endpoint="end"]'));
      await page.mouse.move(p.x, p.y);
    } else await move(mode === 'pan' ? { x: 4, y: -2 } : mode === 'draw' ? { x: -2, y: -2 } : { x: 0, y: -1 });
    await page.mouse.down();
    assert.equal(await app(() => FZI.MathIllustration.editor.interaction.mode), mode);
    assert.equal(await app(() => document.getElementById('canvasWrap').hasPointerCapture(FZI.MathIllustration.editor.interaction.pointerId)), true);
    await page.mouse.move(...await app(() => { const s = FZI.MathIllustration.editor.interaction.startScreen; return [s.x + 35, s.y - 25]; }));
  };
  // Startup: all services are injected before the first render, including restored documents.
  await page.evaluate(data => localStorage.setItem(FZI.MathIllustration.DraftStore.key, JSON.stringify(data)), fixture);
  await page.reload();
  assert.equal(await page.locator('[data-color-object="p"]').count(), 1);
  assert.equal(await app(() => !!FZI.MathIllustration.editor.services.axis && !!FZI.MathIllustration.editor.services.resolver), true);
  await page.locator('[data-color-object="p"]').evaluate(button => button.click());
  await page.locator('[data-editor-color]').evaluate(input => { input.value = '#123456'; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); });
  await page.locator('#colorApply').click();
  assert.equal(await app(() => FZI.MathIllustration.editor.engine.get('p').style.fill), '#123456');
  await page.locator('[data-view-select="axes"]').click();
  await page.locator('[data-axis-setting="showXAxis"]').uncheck();
  assert.equal(await app(() => FZI.MathIllustration.editor.engine.renderer.showXAxis), false);
  await page.locator('[data-view-select="axes"]').click();
  await require('./browser-tool-menu.cjs').choose(page,'[data-tool="point"]'); await move({ x: -2, y: -2 }); await page.mouse.down(); await page.mouse.up();
  assert.equal((await doc()).objects.length, 4);
  // CSS/SVG scaling and viewport zoom use the same CoordinateTransform for label deltas.
  for (const [width, zoom] of [[1280, false], [820, false], [1280, true]]) {
    await page.setViewportSize({ width, height: 900 }); await reset();
    if (zoom) { await move({ x: 0, y: 0 }); await page.mouse.wheel(0, -100); await page.waitForFunction(() => FZI.MathIllustration.editor.engine.renderer.scale() > 94); }
    const start = await center(page.locator('[data-label-id="p"]'));
    const delta = await page.evaluate(() => FZI.MathIllustration.CoordinateTransform.forCanvas(FZI.MathIllustration.editor.engine).screenDelta(30, -18));
    await page.mouse.move(start.x, start.y); await page.mouse.down(); await page.mouse.move(start.x + 30, start.y - 18); await page.mouse.up();
    const point = (await doc()).objects.find(o => o.id === 'p'); close(point.labelOffsetX, .3 + delta.x); close(point.labelOffsetY, .2 + delta.y);
    assert.equal(await app(() => FZI.MathIllustration.editor.selectedId), 'p');
    assert.equal(await page.locator('#selectionPanel [data-edit="x"]').inputValue(), '0');
    assert.equal(await page.locator('[data-object-id="p"].selected').count(), 1);
    const saved = await doc();
    await require('./browser-tool-menu.cjs').choose(page,'[data-tool="line"]');
    const label = await center(page.locator('[data-label-id="p"]'));
    await page.mouse.move(label.x, label.y); await page.mouse.down();
    assert.equal(await app(() => FZI.MathIllustration.editor.interaction.mode), 'draw');
    await page.mouse.move(label.x + 35, label.y); await page.keyboard.press('Escape'); await page.mouse.up();
    assert.deepEqual(await doc(), saved);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  const modes = ['object', 'label', 'endpoint', 'draw', 'pan'];
  for (const mode of modes) for (const reason of ['pointercancel', 'blur', 'Escape']) {
    await reset(); const before = await doc(); await begin(mode);
    if (mode === 'draw') await page.keyboard.press('1');
    if (reason === 'Escape') await page.keyboard.press('Escape');
    else await page.evaluate(reason => {
      const state = FZI.MathIllustration.editor.interaction;
      window.dispatchEvent(reason === 'blur' ? new Event('blur') : new PointerEvent('pointercancel', { pointerId: state.pointerId }));
    }, reason);
    await page.mouse.up();
    assert.deepEqual(await doc(), before, `${mode}/${reason} rollback`);
    assert.equal(await app(() => FZI.MathIllustration.editor.interaction), null);
    assert.equal(await app(() => FZI.MathIllustration.editor.engine.renderer.preview), null);
    assert.equal(await page.locator('.fzi-snap-indicator').count(), 0);
    assert.equal(await app(() => FZI.MathIllustration.editor.selectedId), mode === 'endpoint' ? 'l' : 'p');
  }
  await reset(); const beforeCaptureLoss = await doc(); await begin('endpoint');
  await app(() => document.getElementById('canvasWrap').releasePointerCapture(FZI.MathIllustration.editor.interaction.pointerId));
  await page.mouse.move(700, 500); await page.mouse.up();
  assert.equal(await app(() => FZI.MathIllustration.editor.interaction), null); assert.deepEqual(await doc(), beforeCaptureLoss);
  // Another pointer cannot steal ownership or finish an existing drag.
  await reset(); await begin('object');
  const current = await doc();
  await app(() => { const s = FZI.MathIllustration.editor.interaction; window.dispatchEvent(new PointerEvent('pointermove', { pointerId: s.pointerId + 1, clientX: 50, clientY: 50 })); window.dispatchEvent(new PointerEvent('pointerup', { pointerId: s.pointerId + 1 })); });
  assert.deepEqual(await doc(), current); assert.equal(await app(() => FZI.MathIllustration.editor.interaction.mode), 'object');
  await page.mouse.move(20, 200); await page.mouse.up(); // Actual pointer-up outside the canvas.
  assert.equal(await app(() => FZI.MathIllustration.editor.interaction), null);
  const committed = await doc(); await page.mouse.move(700, 500); assert.deepEqual(await doc(), committed);
  close(Number(await page.locator('#selectionPanel [data-edit="x"]').inputValue()), committed.objects.find(o => o.id === 'p').x);
  // New and dispose terminate every interaction type. Re-init and bootstrap cannot duplicate listeners.
  for (const mode of modes) {
    await reset(); await begin(mode);
    page.once('dialog', dialog => dialog.accept()); await page.locator('#newBtn').evaluate(button => button.click());
    await page.mouse.up(); assert.equal((await doc()).objects.length, 0); assert.equal(await app(() => FZI.MathIllustration.editor.interaction), null);
    await reset(); const before = await doc(); await begin(mode);
    await app(() => FZI.MathIllustration.editor.dispose()); await page.mouse.up();
    assert.deepEqual(await doc(), before); await app(() => FZI.MathIllustration.editor.init());
  }
  await reset();
  await app(() => { const MI = FZI.MathIllustration, engine = MI.editor.engine; MI.bootstrapEditor({ engine, restoreDraft: false }); MI.editor.init(); });
  await require('./browser-tool-menu.cjs').choose(page,'[data-tool="point"]'); await move({ x: -2, y: -2 }); await page.mouse.down(); await page.mouse.up();
  assert.equal((await doc()).objects.length, 4);
  assert.equal(await page.locator('[data-editor-color]').count(), 1);
  // Endpoint preview renders one consistent transient state without mutating the document early.
  await reset(); await select('l');
  const handle = await center(page.locator('.fzi-line-endpoint[data-endpoint="end"]'));
  await page.mouse.move(handle.x, handle.y); await page.mouse.down(); await move({ x: 2, y: 0 });
  assert.equal((await doc()).objects.find(o => o.id === 'l').x2, 1);
  const view = await app(() => {
    const editor = FZI.MathIllustration.editor, r = editor.engine.renderer, object = editor.viewObject('l');
    const line = document.querySelector('[data-object-id="l"] line'), label = document.querySelector('[data-label-id="l"]'), handle = document.querySelector('.fzi-line-endpoint[data-endpoint="end"]');
    return { patch: editor.interaction.resolved.patch, object, lineX: +line.getAttribute('x2'), lineY: +line.getAttribute('y2'), handleX: +handle.getAttribute('cx'), handleY: +handle.getAttribute('cy'), labelX: +label.getAttribute('x'), labelY: +label.getAttribute('y'), expectedX: r.mapX(object.x2), expectedY: r.mapY(object.y2), expectedLabelX: r.mapX((object.x1 + object.x2) / 2) + object.labelOffsetX * r.scale(), expectedLabelY: r.mapY((object.y1 + object.y2) / 2) - object.labelOffsetY * r.scale() };
  });
  close(view.lineX, view.expectedX, 1e-4); close(view.lineY, view.expectedY, 1e-4);
  close(view.handleX, view.expectedX); close(view.handleY, view.expectedY);
  close(view.labelX, view.expectedLabelX, 1e-4); close(view.labelY, view.expectedLabelY, 1e-4);
  close(Number(await page.locator('[data-edit="x2"]').inputValue()), view.object.x2);
  close(Number(await page.locator('[data-edit="y2"]').inputValue()), view.object.y2);
  await page.mouse.up();
  for (const [key, value] of Object.entries(view.patch)) close((await doc()).objects.find(o => o.id === 'l')[key], value);
  // Color/as changes go through full rendering, preserving hidden state and selection overlays.
  await page.locator('[data-color-object="hidden"]').evaluate(button => button.click());
  await page.locator('[data-editor-color]').evaluate(input => { input.value = '#abcdef'; input.dispatchEvent(new Event('input')); input.dispatchEvent(new Event('change')); });
  await page.locator('#colorApply').click();
  await page.locator('[data-view-select="axes"]').click(); await page.locator('[data-axis-setting="showXAxis"]').uncheck();
  assert.equal(await page.locator('[data-object-id="hidden"]').count(), 0);
  assert.equal(await page.locator('[data-object-id="l"].selected').count(), 0); // Axes configuration is a distinct context.
  await select('l');
  assert.equal(await page.locator('[data-object-id="l"].selected').count(), 1);
  assert.equal(await page.locator('.fzi-line-endpoint').count(), 2);
  close(Number(await page.locator('[data-edit="x2"]').inputValue()), view.object.x2);
  const download = page.waitForEvent('download'); await require('./browser-tool-menu.cjs').action(page,'#exportSvgBtn');
  const exported = fs.readFileSync(await (await download).path(), 'utf8');
  assert.doesNotMatch(exported, /data-object-id="hidden"|fzi-line-endpoint|class="selected"/);
  assert.match(exported, />0<\/text>/);
  assert.match(exported, /data-object-id="l"/);
  // Explicitly injected engine remains the owner even after rendering a different standalone engine.
  await app(() => { const MI = FZI.MathIllustration; new MI.Engine({ objects: [] }).renderSVG(); });
  assert.equal(await app(() => FZI.MathIllustration.editor.engine.get('hidden').style.stroke), '#abcdef');
  assert.equal(await app(() => FZI.MathIllustration.activeEngine === FZI.MathIllustration.editor.engine), true);
  // IDs are data, not CSS selectors.
  await page.evaluate(() => { const e = FZI.MathIllustration.editor; const id = 'quoted"[id]'; e.engine.add({ id, type: 'point', x: 0, y: 0 }); e.selectedId = id; e.invalidate(); });
  assert.equal(await page.locator('#canvas g.selected').count(), 1);
  await page.evaluate(() => localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
  return { startup: 'passed', responsiveLabelDrag: 'passed', toolGate: 'passed', cancelCases: 15, lostCapture: 'passed', pointerOwnership: 'passed', pointerUpOutside: 'passed', newDuringInteraction: 5, disposeDuringInteraction: 5, reinit: 'passed', endpointRenderConsistency: 'passed', selectionAndInspector: 'passed', visibilityColorAxisExport: 'passed', engineInjection: 'passed', opaqueIds: 'passed' };
};
