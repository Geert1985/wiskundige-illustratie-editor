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
  { file: 'model.js', provides: ['PointProjections', 'DynamicText', 'MODEL_VERSION', 'OBJECT_TYPES', 'LINEAR_OBJECT_TYPES', 'IllustrationModel', 'normaliseObject', 'PRESENTATION_FLAGS'], after: ['regular-geometry.js'] },
  { file: 'persistent-groups.js', provides: ['PersistentGroups'], after: ['model.js'] },
  { file: 'document-layers.js', provides: ['DocumentLayers'], after: ['model.js', 'persistent-groups.js'] },
  { file: 'polygon-geometry.js', provides: ['PolygonGeometry'], after: ['model.js'] },
  { file: 'linear-geometry.js', provides: ['LinearGeometry'], after: ['model.js'] },
  { file: 'measurement-geometry.js', provides: ['AngleMeasurements', 'MeasurementUnits', 'MeasurementGeometry'], after: ['model.js', 'polygon-geometry.js', 'linear-geometry.js'] },
  { file: 'construction-service.js', provides: ['AxisReferences', 'ConstructionService'], after: ['model.js', 'polygon-geometry.js', 'linear-geometry.js', 'measurement-geometry.js'] },
  { file: 'renderer.js', provides: ['SvgRenderer', 'escapeXml'], after: ['model.js', 'document-layers.js', 'polygon-geometry.js', 'linear-geometry.js', 'measurement-geometry.js', 'construction-service.js'] },
  { file: 'index.js', provides: ['CONSTRUCTION_COLOR', 'Engine', 'distancePointToSegment'], after: ['model.js', 'persistent-groups.js', 'document-layers.js', 'polygon-geometry.js', 'linear-geometry.js', 'measurement-geometry.js', 'construction-service.js', 'renderer.js'] },
  { file: 'semantic-sequence.js', provides: ['SemanticSequence'], after: ['index.js'] },
  { file: 'coordinate-transform.js', provides: ['CoordinateTransform'], after: ['renderer.js'] },
  { file: 'snap-service.js', provides: ['SnapService', 'getSnapCandidates', 'snapPoint', 'publishSnapResult'], after: ['index.js', 'coordinate-transform.js', 'construction-service.js', 'measurement-geometry.js', 'linear-geometry.js'] },
  { file: 'interaction-resolver.js', provides: ['InteractionResolver'], after: ['index.js', 'snap-service.js', 'measurement-geometry.js', 'polygon-geometry.js'] },
  { file: 'rectangle-selection.js', provides: ['RectangleSelection'], after: ['linear-geometry.js', 'measurement-geometry.js', 'polygon-geometry.js', 'coordinate-transform.js'] },
  { file: 'permission-runtime.js', provides: ['PermissionError', 'PermissionPolicy', 'PermissionEvaluator', 'RuntimeSession', 'PermissionFields', 'AuthorCommands'], after: ['index.js', 'construction-service.js', 'measurement-geometry.js', 'document-layers.js', 'persistent-groups.js'] },
  { file: 'editor-startup.js', provides: ['DraftStore'], after: ['model.js'] },
  { file: 'editor-adaptive-grid.js', provides: ['adaptiveGridStep', 'adaptiveGridMinStep', 'adaptiveGridMaxScale'], after: ['renderer.js'] },
  { file: 'editor-label-drag.js', provides: ['LabelOffsets'], after: ['linear-geometry.js'] },
  { file: 'editor-enhancements.js', provides: ['EditorOverlays', 'SnapFeedback'], after: ['linear-geometry.js'] },
  { file: 'editor-color.js', provides: ['EditorColor'], after: ['model.js'] },
  { file: 'editor-axis-settings.js', provides: ['AxisSettings'], after: ['renderer.js'] },
  { file: 'editor-history.js', provides: ['EditorHistory', 'RuntimeHistory'], after: ['index.js', 'permission-runtime.js'] },
  { file: 'editor-tool-instructions.js', provides: ['ToolInstructions'], after: ['renderer.js'] },
  { file: 'editor.js', provides: ['EditorApp'], after: modulesBeforeEditor() },
  { file: 'editor-bootstrap.js', provides: ['bootstrapEditor', 'editor', 'activeEngine', 'bootstrapRestrictedEditor'], after: ['editor.js'] },
];

function modulesBeforeEditor() {
  return [
    'model.js', 'persistent-groups.js', 'document-layers.js', 'polygon-geometry.js',
    'linear-geometry.js', 'measurement-geometry.js', 'construction-service.js',
    'renderer.js', 'index.js', 'semantic-sequence.js', 'coordinate-transform.js',
    'snap-service.js', 'interaction-resolver.js', 'rectangle-selection.js',
    'permission-runtime.js', 'editor-startup.js', 'editor-adaptive-grid.js',
    'editor-label-drag.js', 'editor-enhancements.js', 'editor-color.js',
    'editor-axis-settings.js', 'editor-history.js', 'editor-tool-instructions.js',
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
