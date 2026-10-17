// Deterministic mixed geometry fixtures for PERF-1.1. Deliberately spans
// primitives, labels, polygons, ellipses, and static text.
module.exports = count => {
  const objects = [];
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963229728653, x = Math.cos(a) * 3, y = Math.sin(a) * 2, id = `p${i}`;
    const common = { id, name: `Object ${i}`, showLabel: i % 5 === 0, labelOffsetX: .05, labelOffsetY: .03 };
    switch (i % 6) {
      case 0:
        if (i >= 12 && i % 12 === 0) objects.push({ ...common, type: 'point', construction: { kind: 'midpoint', sources: [{ objectId: `p${i - 12}` }, { objectId: `p${i - 6}` }] } });
        else objects.push({ ...common, type: 'point', x, y });
        break;
      case 1: objects.push({ ...common, type: 'line', x1: -4, y1: y, x2: 4, y2: y + .01 }); break;
      case 2: objects.push({ ...common, type: 'circle', cx: x, cy: y, r: .35 + i % 5 / 10 }); break;
      case 3: objects.push({ ...common, type: 'ellipse', cx: x, cy: y, a: .7, b: .3, rotation: a }); break;
      case 4: objects.push({ ...common, type: 'polygon', vertices: [{ x, y }, { x: x + .4, y: y + .1 }, { x: x + .1, y: y + .45 }] }); break;
      case 5: objects.push({ ...common, type: 'text', x, y, text: `Label ${i}: α = 2π / 3`, style: { fontSize: 14 } }); break;
    }
  }
  return { version: 9, ellipseSchema: 1, ...(objects.some(o => o.construction) ? { constructionSchema: 1 } : {}), type: 'geometry', meta: { title: `PERF-1.1 mixed ${count}` }, objects,
    presentation: { bounds: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 }, showGrid: true } };
};
