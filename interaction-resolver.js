/* Explicit draw, rigid-translation and endpoint constraints. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  MI.InteractionResolver = {
    draw(engine, shape, start, raw, options = {}) {
      let result;
      const exact = options.exactDistance;
      if (Number.isFinite(exact) && exact > 0) {
        const dx = raw.x - start.x, dy = raw.y - start.y, length = Math.hypot(dx, dy);
        result = MI.SnapService.free({ x: start.x + (length > 1e-12 ? dx / length : 1) * exact, y: start.y + (length > 1e-12 ? dy / length : 0) * exact }, "exact-distance");
      } else result = MI.SnapService.resolve(engine, raw, options);
      const end = result.point, radius = Number.isFinite(exact) && exact > 0 ? exact : Math.hypot(end.x - start.x, end.y - start.y);
      const object = shape !== "circle" ? { type: shape, x1: start.x, y1: start.y, x2: end.x, y2: end.y } : { type: "circle", cx: start.x, cy: start.y, r: radius };
      return { result, preview: { type: shape, start: { ...start }, end: { ...end } }, object, length: radius };
    },
    translateLine(engine, line, delta, options = {}) {
      const starts = [{ x: line.x1 + delta.x, y: line.y1 + delta.y }, { x: line.x2 + delta.x, y: line.y2 + delta.y }];
      const resolved = starts.map((point, index) => ({ index, result: MI.SnapService.resolve(engine, point, { ...options, excludeId: line.id }) }));
      resolved.sort((a, b) => MI.SnapService.compare(a.result, b.result) || a.index - b.index);
      const winner = resolved[0], correction = winner.result.snapped ? { x: winner.result.point.x - starts[winner.index].x, y: winner.result.point.y - starts[winner.index].y } : { x: 0, y: 0 };
      const dx = delta.x + correction.x, dy = delta.y + correction.y, x1 = line.x1 + dx, y1 = line.y1 + dy;
      return { result: winner.result, patch: { x1, y1, x2: x1 + (line.x2 - line.x1), y2: y1 + (line.y2 - line.y1) }, delta: { x: dx, y: dy } };
    },
    endpoint(engine, line, endpoint, raw, options = {}) {
      const result = MI.SnapService.resolve(engine, raw, { ...options, excludeId: line.id });
      if (line.type === 'straight' || line.type === 'ray') {
        const other = endpoint === 'start' ? { x: line.x2, y: line.y2 } : { x: line.x1, y: line.y1 };
        if (result.point.x === other.x && result.point.y === other.y) {
          const original = endpoint === 'start' ? { x: line.x1, y: line.y1 } : { x: line.x2, y: line.y2 };
          return { result: MI.SnapService.free(original, 'nonzero-direction'), patch: endpoint === 'start' ? { x1: original.x, y1: original.y } : { x2: original.x, y2: original.y } };
        }
      }
      return { result, patch: endpoint === "start" ? { x1: result.point.x, y1: result.point.y } : { x2: result.point.x, y2: result.point.y } };
    }
  };
})(window);
