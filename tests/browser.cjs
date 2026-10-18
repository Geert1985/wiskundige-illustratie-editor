// Optional real-browser smoke test: requires playwright and an installed Edge.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/editor.html`);
    if (process.env.PERF_1_2A_ONLY === '1') { const renderInvalidation = await require('./browser-render-invalidation.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', renderInvalidation, pageErrors: errors })); return; }
    if (process.env.PERF_1_2B1_ONLY === '1') { const dragInvalidation = await require('./browser-drag-invalidation.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', dragInvalidation, pageErrors: errors })); return; }
    if (process.env.OBJECT_RENAME_ONLY === '1') { const objectRename=await require('./browser-object-rename.cjs')(page);assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:'Edge',objectRename,pageErrors:errors}));return; }
    if (process.env.TEXT_LAYERS_ONLY === '1') { const textLayers=await require('./browser-automatic-text-layer.cjs')(page);assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:'Edge',textLayers,pageErrors:errors}));return; }
    if (process.env.LAYER_LABELS_ONLY === '1') { const labels=await require('./browser-layer-labels.cjs')(page);assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:'Edge',labels,pageErrors:errors}));return; }
    if (process.env.M6A_ONLY === '1') { const triangleCenters = await require('./browser-triangle-centers.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', triangleCenters, pageErrors: errors })); return; }
    if (process.env.M6B_ONLY === '1') { const triangleM6b = await require('./browser-triangle-m6b.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', triangleM6b, pageErrors: errors })); return; }
    if (process.env.GTRI1_ONLY === '1') { const gTri1TriangleFromPoints = await require('./browser-g-tri1-triangle-from-points.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', gTri1TriangleFromPoints, pageErrors: errors })); return; }
    if (process.env.M8B1_ONLY === '1') { const parallelogram = await require('./browser-parallelogram-m8b.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', parallelogram, pageErrors: errors })); return; }
    if (process.env.M8B2_ONLY === '1') { const parallelogramMeasurements = await require('./browser-parallelogram-measurements-m8b2.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', parallelogramMeasurements, pageErrors: errors })); return; }
    if (process.env.M8B2B_ONLY === '1') { const parallelogramUx = await require('./browser-parallelogram-ux-m8b2b.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', parallelogramUx, pageErrors: errors })); return; }
    if (process.env.M8B2C_ONLY === '1') { const parallelogramConstraints = await require('./browser-parallelogram-constraints-m8b2c.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', parallelogramConstraints, pageErrors: errors })); return; }
    if (process.env.M8_INT_ONLY === '1') { const universalIntersection = await require('./browser-universal-intersection.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', universalIntersection, pageErrors: errors })); return; }
    if (process.env.M8_INT_1_ONLY === '1') { const lineEllipseIntersection = await require('./browser-line-ellipse-intersection.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', lineEllipseIntersection, pageErrors: errors })); return; }
    if (process.env.M8B1_REVIEW_FIXES_ONLY === '1') { const m8bReviewFixes = await require('./browser-m8b-review-fixes.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', m8bReviewFixes, pageErrors: errors })); return; }
    if (process.env.POINT_ON_ELLIPSE_ONLY === '1') { const pointOnEllipse = await require('./browser-point-on-ellipse.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', pointOnEllipse, pageErrors: errors })); return; }
    if (process.env.ELLIPSE_CONTROL_POINT_ONLY === '1') { const ellipseControlPoint = await require('./browser-ellipse-control-point.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', ellipseControlPoint, pageErrors: errors })); return; }
    if (process.env.RADIAL_ONLY === '1') { const radialMenu = await require('./browser-radial-menu.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', radialMenu, pageErrors: errors })); return; }
    if (process.env.RADIAL_SELECTION_CONTEXT_ONLY === '1') { const radialSelectionContext = await require('./browser-radial-selection-context.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', radialSelectionContext, pageErrors: errors })); return; }
    if (process.env.LAYER_DND_ONLY === '1') { const multiLayerDrag = await require('./browser-layer-multidrag.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', multiLayerDrag, pageErrors: errors })); return; }
    if (process.env.UI_T1_ONLY === '1') { const toolPanelReorganization = await require('./browser-tool-panel-reorganization.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', toolPanelReorganization, pageErrors: errors })); return; }
    if (process.env.UI_LEFT_ONLY === '1') { const sidebarNavigation = await require('./browser-sidebar-navigation.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', pointOnObject, objectRename, sidebarNavigation, pageErrors: errors })); return; }
    if (process.env.REG2_ONLY === '1') { const regions = await require('./browser-regions.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', regions, pageErrors: errors })); return; }
    if (process.env.UI_RADIAL_10_ONLY === '1') { const regionPresentation = await require('./browser-region-presentation.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', regionPresentation, pageErrors: errors })); return; }
    if (process.env.SELECTION_ONLY === '1') { const selection = await require('./browser-selection.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', selection, pageErrors: errors })); return; }
    if (process.env.AUDIT_FINAL_ONLY === '1') { const auditFinal = await require('./browser-audit-final.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', auditFinal, pageErrors: errors })); return; }
    if (process.env.ASSET_COMPAT_ONLY === '1') { const assetCompat = await require('./browser-asset-compat.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', assetCompat, pageErrors: errors })); return; }
    if (process.env.HISTORY_ONLY === '1') { const history = await require('./browser-history.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', history, pageErrors: errors })); return; }
    if (process.env.INPUTS_ONLY === '1') { const inputs = await require('./browser-inputs.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', inputs, pageErrors: errors })); return; }
    if (process.env.RICH_TEXT_ONLY === '1') { const richText = await require('./browser-rich-text.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', richText, pageErrors: errors })); return; }
    if (process.env.RICH_MATH_EDIT_ONLY === '1') { const richMathEdit = await require('./browser-rich-math-edit.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', richMathEdit, pageErrors: errors })); return; }
    if (process.env.WIE_TXT_FORM_POC_ONLY === '1') { const wieTxtFormPoc = await require('./browser-rich-text-inline-code-poc.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', wieTxtFormPoc, pageErrors: errors })); return; }
    if (process.env.RICH_MATH_ONLY === '1') { const richMath = await require('./browser-rich-math.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', richMath, pageErrors: errors })); return; }
    if (process.env.RICH_VALUES_ONLY === '1') { const richValues = await require('./browser-rich-values.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', richValues, pageErrors: errors })); return; }
    if (process.env.RICH_LAYOUT_ONLY === '1') { const richLayout = await require('./browser-rich-layout.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', richLayout, pageErrors: errors })); return; }
    if (process.env.TEXT_MODERN_ONLY === '1') { const textEditorModernization = await require('./browser-text-editor-modernization.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', textEditorModernization, pageErrors: errors })); return; }
    if (process.env.POLYGON_ONLY === '1') { const polygon = await require('./browser-polygon.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', polygon, pageErrors: errors })); return; }
    if (process.env.STYLES_ONLY === '1') { const styles = await require('./browser-styles.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', styles, pageErrors: errors })); return; }
    if (process.env.MEASUREMENTS_ONLY === '1') { const measurementsGroups = await require('./browser-measurements-groups.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', measurementsGroups, pageErrors: errors })); return; }
    if (process.env.GEO_UI_ONLY === '1') { const geoUi = await require('./browser-geo-ui.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', geoUi, pageErrors: errors })); return; }
    if (process.env.ELLIPSE_MEASUREMENTS_ONLY === '1') { const ellipseMeasurementAnchors = await require('./browser-ellipse-measurement-anchors.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', ellipseMeasurementAnchors, pageErrors: errors })); return; }
    if (process.env.CONSTRUCTIONS_ONLY === '1') { const constructions = await require('./browser-constructions.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', constructions, pageErrors: errors })); return; }
    if (process.env.AREA_MENU_ONLY === '1') { const areaMenu = await require('./browser-area-menu.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', areaMenu, pageErrors: errors })); return; }
    if (process.env.RECT_SELECTION_ONLY === '1') { const rectangleSelection = await require('./browser-rectangle-selection.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', rectangleSelection, pageErrors: errors })); return; }
    if (process.env.PERMISSIONS_ONLY === '1') { const permissions = await require('./browser-permissions.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', permissions, pageErrors: errors })); return; }
    if (process.env.PERSISTENT_GROUPS_ONLY === '1') { const persistentGroups = await require('./browser-persistent-groups.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', persistentGroups, pageErrors: errors })); return; }
    if (process.env.LAYERS_ONLY === '1') { const layers = await require('./browser-layers.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', layers, pageErrors: errors })); return; }
    if (process.env.CONSTRUCTION_CONTRACT_ONLY === '1') { const constructionContract = await require('./browser-construction-contract.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', constructionContract, pageErrors: errors })); return; }
    if (process.env.UI_MODERN_ONLY === '1') { const uiModernization = await require('./browser-ui-modernization.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', uiModernization, pageErrors: errors })); return; }
    if (process.env.UI_REFINEMENTS_ONLY === '1') { const uiRefinements = await require('./browser-ui-refinements.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', uiRefinements, pageErrors: errors })); return; }
    if (process.env.INSPECTOR_ONLY === '1') { const inspectorFeedback = await require('./browser-inspector-feedback.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', inspectorFeedback, pageErrors: errors })); return; }
    if (process.env.AXES_GRID_ONLY === '1') { const axesGrid = await require('./browser-axes-grid.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', axesGrid, pageErrors: errors })); return; }
    if (process.env.FULL_CANVAS_AXES_ONLY === '1') { const fullCanvasAxes = await require('./browser-full-canvas-axes.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', fullCanvasAxes, pageErrors: errors })); return; }
    if (process.env.SPLIT_TOOLS_ONLY === '1') { const splitTools = await require('./browser-split-tools.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', splitTools, pageErrors: errors })); return; }
    if (process.env.BISECTOR_CLIP_ONLY === '1') { const bisectorClip = await require('./browser-bisector-clip.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', bisectorClip, pageErrors: errors })); return; }
    if (process.env.LINKED_PATHS_ONLY === '1') { const linkedPaths = await require('./browser-linked-paths.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', linkedPaths, pageErrors: errors })); return; }
    if (process.env.POINT_ON_OBJECT_ONLY === '1') { const pointOnObject = await require('./browser-point-on-object.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', pointOnObject, pageErrors: errors })); return; }
    if (process.env.SEMANTIC_SEQUENCE_ONLY === '1') { const semanticSequence = await require('./browser-semantic-sequence.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', semanticSequence, pageErrors: errors })); return; }
    if (process.env.CANVAS_FULLSCREEN_ONLY === '1') { const canvasFullscreen = await require('./browser-canvas-fullscreen.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', canvasFullscreen, pageErrors: errors })); return; }
    if (process.env.LINKED_TANGENT_ONLY === '1') { const linkedTangent = await require('./browser-linked-tangent.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', linkedTangent, pageErrors: errors })); return; }
    if (process.env.CONSTRUCTION_HOVER_ONLY === '1') { const constructionHover = await require('./browser-construction-hover.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', constructionHover, pageErrors: errors })); return; }
    if (process.env.POST_M5A_ONLY === '1') { const postM5aUX = await require('./browser-post-m5a-ux.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', postM5aUX, pageErrors: errors })); return; }
    if (process.env.MINIMAL_OBJECT_LIST_ONLY === '1') { const minimalObjectList = await require('./browser-minimal-object-list.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', minimalObjectList, pageErrors: errors })); return; }
    if (process.env.UNITS_SCALE_ONLY === '1') { const unitsScale = await require('./browser-units-scale.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', unitsScale, pageErrors: errors })); return; }
    if (process.env.POINT_PROJECTIONS_ONLY === '1') { const pointProjections = await require('./browser-point-projections.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', pointProjections, pageErrors: errors })); return; }
    if (process.env.DYNAMIC_ANGLES_ONLY === '1') { const dynamicAngles = await require('./browser-dynamic-angles.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', dynamicAngles, pageErrors: errors })); return; }
    if (process.env.DYNAMIC_TEXT_ONLY === '1') { const dynamicText = await require('./browser-dynamic-text.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', dynamicText, pageErrors: errors })); return; }
    if (process.env.AXIS_REFERENCES_ONLY === '1') { const axisReferences = await require('./browser-axis-references.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', axisReferences, pageErrors: errors })); return; }
    if (process.env.STACKED_TOOLS_ONLY === '1') { const stackedTools = await require('./browser-stacked-tools.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', stackedTools, pageErrors: errors })); return; }
    if (process.env.TOOL_PANEL_ONLY === '1') { const toolPanelReorganization = await require('./browser-tool-panel-reorganization.cjs')(page); assert.deepEqual(errors, []); console.log(JSON.stringify({ browser: 'Edge', toolPanelReorganization, pageErrors: errors })); return; }
    const before = await page.evaluate(() => FZI.MathIllustration.activeEngine.renderer.scale());
    const rect = await page.locator('#canvasWrap').boundingBox();
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.wheel(0, -100);
    await page.waitForFunction(value => FZI.MathIllustration.activeEngine.renderer.scale() > value, before);
    const result = await page.evaluate(() => {
      const e = FZI.MathIllustration.activeEngine, wrap = document.getElementById('canvasWrap'), rect = wrap.getBoundingClientRect();
      const wheel = deltaY => wrap.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY, clientX: rect.x + rect.width / 2, clientY: rect.y + rect.height / 2 }));
      for (let i = 0; i < 30; i++) wheel(-100);
      const maxScale = e.renderer.scale(), step = e.renderer.axisStep, bounds = JSON.stringify(e.renderer.bounds);
      wheel(-100); const blocked = bounds === JSON.stringify(e.renderer.bounds);
      wheel(100); const outScale = e.renderer.scale();
      e.renderer.showGrid = true;
      for (let i = 0; i < 250; i++) wheel(100);
      const svg = e.renderSVG();
      return { maxScale, step, blocked, outScale, finite: !/NaN|Infinity/.test(svg.replace(/data:font\/ttf;base64,[A-Za-z0-9+/=]+/g,'embedded-font')), lines: (svg.match(/<line /g) || []).length };
    });
    assert.ok(Math.abs(result.maxScale - 700) < 1e-8); assert.equal(result.step, .1);
    assert.ok(result.blocked); assert.ok(result.outScale < 700); assert.ok(result.finite); assert.ok(result.lines < 1000);
    // Reset and verify ordinary authoring still works with all feature scripts loaded.
    await page.locator('#resetViewBtn').click();
    await require('./browser-tool-menu.cjs').choose(page,'[data-tool="point"]');
    await page.locator('#canvasWrap').click({ position: { x: 200, y: 200 } });
    assert.equal(await page.evaluate(() => FZI.MathIllustration.activeEngine.model.objects.length), 1);
    const legacy = fs.readFileSync(path.join(__dirname, 'fixtures', 'legacy-v1.json'));
    page.once('dialog',dialog=>{assert.equal(dialog.type(),'confirm');dialog.accept();});
    await page.locator('#fileInput').setInputFiles({ name: 'legacy.json', mimeType: 'application/json', buffer: legacy });
    await page.waitForFunction(() => document.getElementById('status').textContent === 'Illustratie geladen.');
    assert.equal(await page.evaluate(() => FZI.MathIllustration.activeEngine.get('A').name), 'Alpha');
    await page.locator('#navigationTools [data-view-select="axes"]').click();
    await page.locator('#radialPropertiesWheel [data-radial-action="axes"]').click();
    await page.locator('#propertiesSidebar [data-axis-setting="showXAxis"]').click();
    await page.locator('#propertiesSidebar [data-axis-setting="showGrid"]').click();
    await page.locator('#propertiesClose').click();
    await page.locator('#sidebarLayersTab').click();
    await page.locator('#sidebarLayersPanel summary').filter({ hasText: /^Illustratie$/ }).click();
    await page.locator('#titleInput').fill('Opgeslagen test');
    const labelPositions = () => page.evaluate(() => Array.from(document.querySelectorAll('#canvas .object-label'), n => [n.dataset.labelId, n.getAttribute('x'), n.getAttribute('y')]));
    const labels = await labelPositions();
    const saved = await page.evaluate(() => FZI.MathIllustration.activeEngine.toJSON());
    await page.locator('#saveBtn').click();
    await page.reload();
    await page.waitForFunction(() => document.getElementById('status').textContent === 'Opgeslagen concept geladen.');
    assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.activeEngine.toJSON()), saved);
    assert.deepEqual(await labelPositions(), labels);
    const exportEvent = page.waitForEvent('download');
    await require('./browser-tool-menu.cjs').action(page,'#exportJsonBtn');
    const exported = await exportEvent;
    const exportedData = JSON.parse(fs.readFileSync(await exported.path(), 'utf8'));
    assert.deepEqual(exportedData, saved);
    await page.locator('#fileInput').setInputFiles({ name: 'roundtrip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exportedData)) });
    await page.waitForFunction(() => document.getElementById('status').textContent === 'Illustratie geladen.');
    assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.activeEngine.toJSON()), saved);
    assert.deepEqual(await labelPositions(), labels);
    const rejected = page.waitForEvent('dialog');
    await page.locator('#fileInput').setInputFiles({ name: 'duplicate.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ meta: { title: 'bad' }, objects: [{ id: 'x', type: 'point' }, { id: 'x', type: 'point' }] })) });
    const alert = await rejected; assert.match(alert.message(), /Object-id bestaat al/); await alert.accept();
    assert.deepEqual(await page.evaluate(() => FZI.MathIllustration.activeEngine.toJSON()), saved);
    const badDraft = '{bad';
    await page.evaluate(raw => localStorage.setItem(FZI.MathIllustration.DraftStore.key, raw), badDraft);
    await page.reload();
    assert.match(await page.locator('#status').textContent(), /gegevens zijn behouden/);
    assert.equal(await page.evaluate(() => localStorage.getItem(FZI.MathIllustration.DraftStore.key)), badDraft);
    assert.equal(await page.evaluate(() => FZI.MathIllustration.activeEngine.model.objects.length), 0);
    const confirmEvent = page.waitForEvent('dialog');
    const newClick = require('./browser-tool-menu.cjs').action(page,'#newBtn');
    const confirm = await confirmEvent; await confirm.accept(); await newClick;
    assert.equal(await page.evaluate(() => localStorage.getItem(FZI.MathIllustration.DraftStore.key)), null);
    await page.reload();
    assert.equal(await page.evaluate(() => FZI.MathIllustration.activeEngine.model.objects.length), 0);
    console.log('V2 suite: snapping');
    const snapping = await require('./browser-snapping.cjs')(page);
    console.log('V2 suite: lifecycle');
    const lifecycle = await require('./browser-lifecycle.cjs')(page);
    console.log('V2 suite: performance');
    const performance = await require('./browser-performance.cjs')(page, true);
    console.log('V2 suite: selection');
    const selection = await require('./browser-selection.cjs')(page);
    console.log('V2 suite: auditFinal');
    const auditFinal = await require('./browser-audit-final.cjs')(page);
    console.log('V2 suite: linear');
    const linear = await require('./browser-linear.cjs')(page);
    console.log('V2 suite: assetCompat');
    const assetCompat = await require('./browser-asset-compat.cjs')(page);
    console.log('V2 suite: history');
    const history = await require('./browser-history.cjs')(page);
    console.log('V2 suite: inputs');
    const inputs = await require('./browser-inputs.cjs')(page);
    console.log('V2 suite: richText');
    const richText = await require('./browser-rich-text.cjs')(page);
    console.log('V2 suite: richMath');
    const richMath = await require('./browser-rich-math.cjs')(page);
    console.log('V2 suite: richValues');
    const richValues = await require('./browser-rich-values.cjs')(page);
    console.log('V2 suite: richLayout');
    const richLayout = await require('./browser-rich-layout.cjs')(page);
    console.log('V2 suite: richUx');
    const richUx = await require('./browser-text-editor-ux.cjs')(page);
    console.log('V2 suite: textEditorModernization');
    const textEditorModernization = await require('./browser-text-editor-modernization.cjs')(page);
    console.log('V2 suite: polygon');
    const polygon = await require('./browser-polygon.cjs')(page);
    console.log('V2 suite: styles');
    const styles = await require('./browser-styles.cjs')(page);
    console.log('V2 suite: measurementsGroups');
    const measurementsGroups = await require('./browser-measurements-groups.cjs')(page);
    console.log('V2 suite: parallelogramMeasurementsM8b2');
    const parallelogramMeasurementsM8b2 = await require('./browser-parallelogram-measurements-m8b2.cjs')(page);
    console.log('V2 suite: parallelogramConstraintsM8b2c');
    const parallelogramConstraintsM8b2c = await require('./browser-parallelogram-constraints-m8b2c.cjs')(page);
    console.log('V2 suite: geoUi');
    const geoUi = await require('./browser-geo-ui.cjs')(page);
    console.log('V2 suite: ellipseMeasurementAnchors');
    const ellipseMeasurementAnchors = await require('./browser-ellipse-measurement-anchors.cjs')(page);
    console.log('V2 suite: constructions');
    const constructions = await require('./browser-constructions.cjs')(page);
    console.log('V2 suite: triangleCenters');
    const triangleCenters = await require('./browser-triangle-centers.cjs')(page);
    console.log('V2 suite: gTri1TriangleFromPoints');
    const gTri1TriangleFromPoints = await require('./browser-g-tri1-triangle-from-points.cjs')(page);
    console.log('V2 suite: triangleM6b');
    const triangleM6b = await require('./browser-triangle-m6b.cjs')(page);
    console.log('V2 suite: regions');
    const regions = await require('./browser-regions.cjs')(page);
    console.log('V2 suite: areaMenu');
    const areaMenu=await require('./browser-area-menu.cjs')(page);
    console.log('V2 suite: rectangleSelection');
    const rectangleSelection=await require('./browser-rectangle-selection.cjs')(page);
    console.log('V2 suite: selectionPresentation');
    const selectionPresentation=await require('./browser-selection-presentation.cjs')(page);
    console.log('V2 suite: permissions');
    const permissions=await require('./browser-permissions.cjs')(page);
    console.log('V2 suite: importHistory');
    const importHistory=await require('./browser-import-history.cjs')(page);
    console.log('V2 suite: persistentGroups');
    const persistentGroups=await require('./browser-persistent-groups.cjs')(page);
    console.log('V2 suite: layers');
    const layers=await require('./browser-layers.cjs')(page);
    console.log('V2 suite: constructionContract');
    const constructionContract=await require('./browser-construction-contract.cjs')(page);
    console.log('V2 suite: pointOnEllipse');
    const pointOnEllipse=await require('./browser-point-on-ellipse.cjs')(page);
    console.log('V2 suite: ellipseControlPoint');
    const ellipseControlPoint=await require('./browser-ellipse-control-point.cjs')(page);
    console.log('V2 suite: uiModernization');
    const uiModernization=await require('./browser-ui-modernization.cjs')(page);
    console.log('V2 suite: uiRefinements');
    const uiRefinements=await require('./browser-ui-refinements.cjs')(page);
    console.log('V2 suite: inspectorFeedback');
    const inspectorFeedback=await require('./browser-inspector-feedback.cjs')(page);
    console.log('V2 suite: axesGrid');
    const axesGrid=await require('./browser-axes-grid.cjs')(page);
    console.log('V2 suite: constructionHover');
    const constructionHover=await require('./browser-construction-hover.cjs')(page);
    console.log('V2 suite: fullCanvasAxes');
    const fullCanvasAxes=await require('./browser-full-canvas-axes.cjs')(page);
    console.log('V2 suite: splitTools');
    const splitTools=await require('./browser-split-tools.cjs')(page);
    console.log('V2 suite: bisectorClip');
    const bisectorClip=await require('./browser-bisector-clip.cjs')(page);
    console.log('V2 suite: linkedPaths');
    const linkedPaths=await require('./browser-linked-paths.cjs')(page);
    console.log('V2 suite: semanticSequence');
    const semanticSequence=await require('./browser-semantic-sequence.cjs')(page);
    console.log('V2 suite: canvasFullscreen');
    const canvasFullscreen=await require('./browser-canvas-fullscreen.cjs')(page);
    console.log('V2 suite: linkedTangent');
    const linkedTangent=await require('./browser-linked-tangent.cjs')(page);
    console.log('V2 suite: derivedCircle');
    const derivedCircle=await require('./browser-derived-circle.cjs')(page);
    console.log('V2 suite: circleCircle');
    const circleCircle=await require('./browser-circle-circle.cjs')(page);
    console.log('V2 suite: lineCircle');
    const lineCircle=await require('./browser-line-circle.cjs')(page);
    console.log('V2 suite: lineEllipseIntersection');
    const lineEllipseIntersection=await require('./browser-line-ellipse-intersection.cjs')(page);
    console.log('V2 suite: lineIntersection');
    const lineIntersection=await require('./browser-line-intersection.cjs')(page);
    console.log('V2 suite: postM5aUX');
    const postM5aUX=await require('./browser-post-m5a-ux.cjs')(page);
    console.log('V2 suite: minimalObjectList');
    const minimalObjectList=await require('./browser-minimal-object-list.cjs')(page);
    console.log('V2 suite: unitsScale');
    const unitsScale=await require('./browser-units-scale.cjs')(page);
    console.log('V2 suite: pointProjections');
    const pointProjections=await require('./browser-point-projections.cjs')(page);
    console.log('V2 suite: dynamicAngles');
    const dynamicAngles=await require('./browser-dynamic-angles.cjs')(page);
    console.log('V2 suite: dynamicText');
    const dynamicText=await require('./browser-dynamic-text.cjs')(page);
    console.log('V2 suite: axisReferences');
    const axisReferences=await require('./browser-axis-references.cjs')(page);
    console.log('V2 suite: angleArms');
    const angleArms=await require('./browser-angle-arms.cjs')(page);
    console.log('V2 suite: stackedTools');
    const stackedTools=await require('./browser-stacked-tools.cjs')(page);
    console.log('V2 suite: expressionEngine');
    const expressionEngine=await require('./browser-expression-engine.cjs')(page);
    console.log('V2 suite: toolPanelReorganization');
    const toolPanelReorganization=await require('./browser-tool-panel-reorganization.cjs')(page);
    console.log('V2 suite: sidebarNavigation');
    const sidebarNavigation=await require('./browser-sidebar-navigation.cjs')(page);
    console.log('V2 suite: radialMenu');
    const radialMenu=await require('./browser-radial-menu.cjs')(page);
    console.log('V2 suite: radialSelectionContext');
    const radialSelectionContext=await require('./browser-radial-selection-context.cjs')(page);
    console.log('V2 suite: multiLayerDrag');
    const multiLayerDrag=await require('./browser-layer-multidrag.cjs')(page);
    console.log('V2 suite: regionPresentation');
    const regionPresentation = await require('./browser-region-presentation.cjs')(page);
    console.log('V2 suite: pointOnObject');
    const pointOnObject=await require('./browser-point-on-object.cjs')(page);
    console.log('V2 suite: objectRename');
    const objectRename=await require('./browser-object-rename.cjs')(page);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ browser: 'Edge', pointOnObject, objectRename, sidebarNavigation, toolPanelReorganization, expressionEngine, ...result, pointCreation: 'passed', legacyImport: 'passed', saveReload: 'passed', labelRoundtrip: 'passed', presentationRestore: 'passed', exportImport: 'passed', atomicFailedImport: 'passed', corruptDraftRetained: 'passed', explicitNew: 'passed', snapping, lifecycle, performance, selection, auditFinal, linear, assetCompat, history, inputs, richText, richMath, richValues, richLayout, richUx, textEditorModernization, polygon, styles, measurementsGroups, geoUi, ellipseMeasurementAnchors, constructions, triangleCenters, gTri1TriangleFromPoints, triangleM6b, regions, regionPresentation, areaMenu, rectangleSelection, selectionPresentation, permissions, importHistory, persistentGroups, layers, constructionContract, pointOnEllipse, ellipseControlPoint, uiModernization, uiRefinements, inspectorFeedback, axesGrid, constructionHover, fullCanvasAxes, splitTools, bisectorClip, minimalObjectList,canvasFullscreen,semanticSequence,linkedPaths, postM5aUX, lineIntersection, lineCircle, lineEllipseIntersection, circleCircle, derivedCircle, linkedTangent, unitsScale, pointProjections, dynamicAngles, dynamicText, axisReferences, stackedTools, angleArms, radialMenu, radialSelectionContext, multiLayerDrag, pageErrors: errors }));
  } finally { if (browser) await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
