const { performance } = require('node:perf_hooks');
const { runtime } = require('./helpers.cjs');
const fixture = require('./fixtures/performance.cjs');
const { MI } = runtime();
const rows = [];
for (const count of [10, 100, 500]) {
  const e = new MI.Engine(fixture(count));
  const transform = new MI.CoordinateTransform(e.renderer);
  const sample = () => MI.SnapService.resolve(e, { x: .23, y: .31 }, { transform });
  let start = performance.now(); sample(); const coldMs = performance.now() - start;
  const times = []; for (let i = 0; i < 15; i++) { start = performance.now(); sample(); times.push(performance.now() - start); }
  times.sort((a, b) => a - b);
  start = performance.now(); const svg = e.renderSVG(); const renderMs = performance.now() - start;
  rows.push({ count, candidates: MI.SnapService.candidates(e).length, coldMs, warmMedianMs: times[7], renderMs, svgBytes: Buffer.byteLength(svg) });
}
console.log(JSON.stringify({ runtime: process.version, rows }, null, 2));
