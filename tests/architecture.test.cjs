const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');

// `after` records load/evaluation prerequisites. Late-bound runtime calls are
// documented separately and must not be mistaken for initialization edges.
const modules = [
  { file: 'regular-geometry.js', provides: ['RegularGeometry'], after: [] },
  { file: 'math-source.js', provides: ['MathSource'], after: [] },
  { file: 'text-values.js', provides: ['TextValues'], after: [] },
  { file: 'text-dependencies.js', provides: ['TextDependencies'], after: ['text-values.js'] },
  { file: 'model.js', provides: ['PointProjections', 'DynamicText', 'TextContent', 'MODEL_VERSION', 'OBJECT_TYPES', 'LINEAR_OBJECT_TYPES', 'IllustrationModel', 'normaliseObject', 'PRESENTATION_FLAGS'], after: ['regular-geometry.js','math-source.js','text-values.js'] },
  { file: 'rich-text-editor-loader.js', provides: ['RichTextEditor'], after: ['model.js'] },
  { file: 'font-assets.js', provides: ['TextFontData'], after: ['model.js'] },
  { file: 'text-fonts.js', provides: ['TextFonts'], after: ['font-assets.js'] },
  { file: 'persistent-groups.js', provides: ['PersistentGroups'], after: ['model.js'] },
  { file: 'document-layers.js', provides: ['DocumentLayers'], after: ['model.js', 'persistent-groups.js'] },
  { file: 'polygon-geometry.js', provides: ['PolygonGeometry'], after: ['model.js'] },
  { file: 'linear-geometry.js', provides: ['LinearGeometry'], after: ['model.js'] },
  { file: 'measurement-geometry.js', provides: ['AngleMeasurements', 'MeasurementUnits', 'MeasurementGeometry'], after: ['model.js', 'polygon-geometry.js', 'linear-geometry.js'] },
  { file: 'region-geometry.js', provides: ['RegionGeometry'], after: ['model.js', 'polygon-geometry.js', 'measurement-geometry.js'] },
  { file: 'ellipse-geometry.js', provides: ['EllipseGeometry'], after: ['model.js'] },
  { file: 'construction-service.js', provides: ['AxisReferences', 'ConstructionService'], after: ['model.js', 'polygon-geometry.js', 'linear-geometry.js', 'measurement-geometry.js', 'region-geometry.js', 'ellipse-geometry.js'] },
  { file: 'math-fragments.js', provides: ['MathFragments'], after: ['math-source.js','model.js'] },
  { file: 'text-metrics.js', provides: ['TextMetrics'], after: ['model.js'] },
  { file: 'rich-text-renderer.js', provides: ['RichTextRenderer'], after: ['math-fragments.js','text-metrics.js','model.js'] },
  { file: 'text-math-input.js', provides: ['TextMathInput'], after: ['math-source.js','math-fragments.js'] },
  { file: 'text-formula-editor.js', provides: ['TextFormulaEditor'], after: ['math-source.js','math-fragments.js'] },
  { file: 'text-dynamic-value-editor.js', provides: ['TextDynamicValueEditor'], after: ['text-values.js'] },
  { file: 'text-symbol-catalog.js', provides: ['TextSymbolCatalog'], after: [] },
  { file: 'text-insert-panel.js', provides: ['TextInsertPanel'], after: ['math-fragments.js','text-symbol-catalog.js','text-math-input.js','text-formula-editor.js','text-dynamic-value-editor.js'] },
  { file: 'renderer.js', provides: ['SvgRenderer', 'escapeXml'], after: ['model.js', 'document-layers.js', 'polygon-geometry.js', 'linear-geometry.js', 'measurement-geometry.js', 'region-geometry.js', 'ellipse-geometry.js', 'construction-service.js'] },
  { file: 'index.js', provides: ['CONSTRUCTION_COLOR', 'Engine', 'distancePointToSegment'], after: ['model.js', 'persistent-groups.js', 'document-layers.js', 'polygon-geometry.js', 'linear-geometry.js', 'measurement-geometry.js', 'region-geometry.js', 'construction-service.js', 'renderer.js'] },
  { file: 'semantic-sequence.js', provides: ['SemanticSequence'], after: ['index.js'] },
  { file: 'coordinate-transform.js', provides: ['CoordinateTransform'], after: ['renderer.js'] },
  { file: 'snap-service.js', provides: ['SnapService', 'getSnapCandidates', 'snapPoint', 'publishSnapResult'], after: ['index.js', 'coordinate-transform.js', 'construction-service.js', 'measurement-geometry.js', 'linear-geometry.js'] },
  { file: 'interaction-resolver.js', provides: ['InteractionResolver'], after: ['index.js', 'snap-service.js', 'measurement-geometry.js', 'polygon-geometry.js'] },
  { file: 'rectangle-selection.js', provides: ['RectangleSelection'], after: ['linear-geometry.js', 'measurement-geometry.js', 'polygon-geometry.js', 'coordinate-transform.js'] },
  { file: 'text-content-diff.js', provides: ['TextContentDiff'], after: ['model.js'] },
  { file: 'permission-runtime.js', provides: ['PermissionError', 'PermissionPolicy', 'PermissionEvaluator', 'RuntimeSession', 'PermissionFields', 'AuthorCommands'], after: ['index.js', 'construction-service.js', 'measurement-geometry.js', 'region-geometry.js', 'document-layers.js', 'persistent-groups.js'] },
  { file: 'editor-startup.js', provides: ['DraftStore'], after: ['model.js'] },
  { file: 'editor-adaptive-grid.js', provides: ['adaptiveGridStep', 'adaptiveGridMinStep', 'adaptiveGridMaxScale'], after: ['renderer.js'] },
  { file: 'editor-label-drag.js', provides: ['LabelOffsets'], after: ['linear-geometry.js'] },
  { file: 'editor-enhancements.js', provides: ['EditorOverlays', 'SnapFeedback'], after: ['linear-geometry.js'] },
  { file: 'editor-color.js', provides: ['EditorColor'], after: ['model.js'] },
  { file: 'text-editor-ux.js', provides: ['TextEditorUX'], after: ['editor-color.js'] },
  { file: 'editor-axis-settings.js', provides: ['AxisSettings'], after: ['renderer.js'] },
  { file: 'editor-history.js', provides: ['EditorHistory', 'RuntimeHistory'], after: ['index.js', 'permission-runtime.js'] },
  { file: 'editor-tool-instructions.js', provides: ['ToolInstructions'], after: ['renderer.js'] },
  { file: 'export-service.js', provides: ['ExportService'], after: ['index.js','math-fragments.js'] },
  { file: 'text-workspace.js', provides: ['TextWorkspace'], after: ['model.js'] },
  { file: 'tool-catalog.js', provides: ['ToolCatalog'], after: [] },
  { file: 'editor-radial-properties.js', provides: ['RadialProperties'], after: ['tool-catalog.js','construction-service.js','editor-tool-instructions.js','permission-runtime.js'] },
  { file: 'editor.js', provides: ['EditorApp'], after: modulesBeforeEditor() },
  { file: 'editor-tool-search.js', provides: [], after: ['editor.js'] },
  { file: 'editor-sidebar-tabs.js', provides: [], after: ['editor.js','document-layers.js','persistent-groups.js'] },
  { file: 'editor-bootstrap.js', provides: ['bootstrapEditor', 'editor', 'activeEngine', 'bootstrapRestrictedEditor'], after: ['editor.js'] },
];

function modulesBeforeEditor() {
  return [
    'math-source.js', 'text-values.js', 'text-dependencies.js', 'math-fragments.js', 'text-metrics.js', 'rich-text-renderer.js', 'text-math-input.js', 'text-formula-editor.js', 'text-dynamic-value-editor.js', 'text-symbol-catalog.js', 'text-insert-panel.js', 'export-service.js', 'model.js', 'rich-text-editor-loader.js', 'font-assets.js', 'text-fonts.js', 'persistent-groups.js', 'document-layers.js', 'polygon-geometry.js',
    'linear-geometry.js', 'measurement-geometry.js', 'region-geometry.js', 'ellipse-geometry.js', 'construction-service.js',
    'renderer.js', 'index.js', 'semantic-sequence.js', 'coordinate-transform.js',
    'snap-service.js', 'interaction-resolver.js', 'rectangle-selection.js', 'text-content-diff.js',
    'permission-runtime.js', 'editor-startup.js', 'editor-adaptive-grid.js',
    'editor-label-drag.js', 'editor-enhancements.js', 'editor-color.js', 'text-editor-ux.js',
    'editor-axis-settings.js', 'editor-history.js', 'editor-tool-instructions.js', 'export-service.js', 'text-workspace.js', 'tool-catalog.js','editor-radial-properties.js',
  ];
}

function htmlScripts() {
  const html = fs.readFileSync(path.join(root, 'editor.html'), 'utf8');
  return [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
    .map(match => new URL(match[1], 'http://localhost/').pathname.split('/').pop());
}

test('classic script inventory matches the architecture manifest and all files exist', () => {
  const scripts = htmlScripts();
  assert.deepEqual(scripts, modules.map(module => module.file), 'editor.html script list/order changed; update the dependency contract deliberately');
  for (const module of modules) assert.ok(fs.existsSync(path.join(root, module.file)), `missing module ${module.file}`);
});

test('dependency providers are unique, declared, present, and loaded before consumers', () => {
  const positions = new Map(modules.map((module, index) => [module.file, index]));
  const providers = new Map();
  for (const module of modules) {
    for (const symbol of module.provides) {
      assert.ok(!providers.has(symbol), `duplicate provider ${symbol}: ${providers.get(symbol)} and ${module.file}`);
      providers.set(symbol, module.file);
      const source = fs.readFileSync(path.join(root, module.file), 'utf8');
      assert.match(source, new RegExp(`(?:\\bMI|global\\.FZI\\.MathIllustration)\\.${symbol}\\s*=`), `${module.file} no longer assigns declared export MI.${symbol}`);
    }
    for (const dependency of module.after) {
      assert.ok(positions.has(dependency), `${module.file} declares unknown dependency ${dependency}`);
      assert.ok(positions.get(dependency) < positions.get(module.file), `${dependency} must load before ${module.file}`);
    }
  }

  // Static namespace reads are checked against the inventory. Runtime method
  // calls are late-bound, but their provider must still exist in the page.
  for (const module of modules) {
    const source = fs.readFileSync(path.join(root, module.file), 'utf8');
    for (const match of source.matchAll(/\b(?:MI|global\.FZI\.MathIllustration)\.([A-Za-z_$][\w$]*)/g)) {
      assert.ok(providers.has(match[1]), `${module.file} references MI.${match[1]} without a declared provider`);
    }
  }

  // Catch cycles in the explicitly declared initialization/load prerequisites.
  const visiting = new Set();
  const visited = new Set();
  function visit(file) {
    assert.ok(!visiting.has(file), `cyclic load dependency at ${file}`);
    if (visited.has(file)) return;
    visiting.add(file);
    for (const dep of modules.find(entry => entry.file === file).after) visit(dep);
    visiting.delete(file);
    visited.add(file);
  }
  for (const module of modules) visit(module.file);
});

test('all classic scripts evaluate in browser load order without a DOM bootstrap', () => {
  const context = {
    console,
    setTimeout,
    clearTimeout,
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; }, querySelector() { return null; } },
    addEventListener() {},
  };
  context.window = context;
  vm.createContext(context);
  for (const file of htmlScripts()) {
    assert.doesNotThrow(() => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }), `failed while evaluating ${file}`);
  }
  assert.ok(context.FZI?.MathIllustration?.EditorApp);
  assert.ok(context.FZI?.MathIllustration?.bootstrapEditor);
});
