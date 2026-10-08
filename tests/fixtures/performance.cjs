// Deterministic mixed geometry, deliberately rich in intersections.
module.exports = count => ({ version: 2, type: 'geometry', meta: { title: `Performance ${count}` }, objects: Array.from({ length: count }, (_, i) => {
  const angle = i * 2.399963229728653, x = Math.cos(angle), y = Math.sin(angle), id = `o-${i}`;
  if (i % 3 === 0) return { id, type: 'point', x: x * 3, y: y * 2 };
  if (i % 3 === 1) return { id, type: 'line', x1: x * -4, y1: y * -2.5, x2: x * 4 + .01, y2: y * 2.5 + .02 };
  return { id, type: 'circle', cx: x, cy: y, r: 1 + (i % 7) / 10 };
}), presentation: { bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, showGrid: true } });
