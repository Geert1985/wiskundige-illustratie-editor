const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
function runtime(files = ['model.js', 'renderer.js', 'index.js'], additions = {}) {
  const defaultDocument = {
    readyState: 'loading', addEventListener() {}, getElementById() { return null; }, querySelector() { return null; },
    createElement(tagName) { return { tagName, classList: { add() {}, remove() {}, toggle() {} }, dataset: {}, style: {}, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } }; }
  };
  const { document: documentOverride, ...otherAdditions } = additions;
  const context = { console, setTimeout, document: documentOverride ? { ...defaultDocument, ...documentOverride } : defaultDocument, addEventListener() {}, ...otherAdditions };
  const getElementById = context.document.getElementById?.bind(context.document);
  if (getElementById) context.document.getElementById = id => {
    const element = getElementById(id);
    if (element && typeof element.insertBefore !== 'function') element.insertBefore = () => {};
    if (element?.classList && typeof element.classList.remove !== 'function') element.classList.remove = () => {};
    return element;
  };
  context.window = context;
  vm.createContext(context);
  for (const file of files) {
    if(file==='model.js')for(const service of ['math-source.js','text-values.js','text-dependencies.js'])vm.runInContext(fs.readFileSync(path.join(root,service),'utf8'),context,{filename:service});
    if (file === 'renderer.js') for(const service of ['math-fragments.js','text-metrics.js','rich-text-renderer.js'])vm.runInContext(fs.readFileSync(path.join(root,service),'utf8'),context,{filename:service});
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'regular-geometry.js'), 'utf8'), context, { filename: 'regular-geometry.js' });
    if (file === 'editor.js') for (const service of ['editor-color.js', 'text-editor-ux.js', 'editor-tool-instructions.js', 'tool-catalog.js', 'editor-radial-properties.js']) vm.runInContext(fs.readFileSync(path.join(root, service), 'utf8'), context, { filename: service });
    if (file === 'editor.js' && !context.FZI.MathIllustration.RadialProperties) context.FZI.MathIllustration.RadialProperties = class { sync() {} dispose() {} close() {} openForAxes() {} };
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'persistent-groups.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'document-layers.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'polygon-geometry.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'linear-geometry.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'measurement-geometry.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'region-geometry.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'ellipse-geometry.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'construction-service.js'), 'utf8'), context);
    if (file === 'editor.js') vm.runInContext(fs.readFileSync(path.join(root, 'editor-bootstrap.js'), 'utf8'), context);
    if (file === 'index.js') for (const service of ['editor-history.js', 'coordinate-transform.js', 'snap-service.js', 'interaction-resolver.js', 'rectangle-selection.js', 'text-content-diff.js', 'permission-runtime.js']) {
      vm.runInContext(fs.readFileSync(path.join(root, service), 'utf8'), context, { filename: service });
    }
  }
  return { context, MI: context.FZI.MathIllustration };
}
function fixture(name) { return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')); }
function plain(value) { return JSON.parse(JSON.stringify(value)); }
module.exports = { runtime, fixture, plain, root };
