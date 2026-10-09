const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
function runtime(files = ['model.js', 'renderer.js', 'index.js'], additions = {}) {
  const context = { console, setTimeout, document: {
    readyState: 'loading', addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }
  }, addEventListener() {}, ...additions };
  context.window = context;
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'persistent-groups.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'polygon-geometry.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'linear-geometry.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'measurement-geometry.js'), 'utf8'), context);
    if (file === 'model.js') vm.runInContext(fs.readFileSync(path.join(root, 'construction-service.js'), 'utf8'), context);
    if (file === 'editor.js') vm.runInContext(fs.readFileSync(path.join(root, 'editor-bootstrap.js'), 'utf8'), context);
    if (file === 'index.js') for (const service of ['editor-history.js', 'coordinate-transform.js', 'snap-service.js', 'interaction-resolver.js', 'rectangle-selection.js', 'permission-runtime.js']) {
      vm.runInContext(fs.readFileSync(path.join(root, service), 'utf8'), context, { filename: service });
    }
  }
  return { context, MI: context.FZI.MathIllustration };
}
function fixture(name) { return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8')); }
function plain(value) { return JSON.parse(JSON.stringify(value)); }
module.exports = { runtime, fixture, plain, root };
