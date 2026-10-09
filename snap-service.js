/* Central geometric/grid resolver; never modifies model coordinates. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

  function addCandidate(list, x, y, kind, ids) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    list.push({ x, y, kind, ids: ids || [] });
  }

  function circleCircleIntersections(a, b) {
    const dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy);
    if (d < 1e-10 || d > a.r + b.r + 1e-10 || d < Math.abs(a.r - b.r) - 1e-10) return [];
    const along = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
    const h2 = a.r * a.r - along * along;
    if (h2 < -1e-10) return [];
    const h = Math.sqrt(Math.max(0, h2));
    const ux = dx / d, uy = dy / d;
    const px = a.cx + along * ux, py = a.cy + along * uy;
    const ox = -uy * h, oy = ux * h;
    const p1 = { x: px + ox, y: py + oy };
    if (h < 1e-10) return [p1];
    return [p1, { x: px - ox, y: py - oy }];
  }

  function lineCircleIntersections(line, circle) {
    const dx = line.x2 - line.x1, dy = line.y2 - line.y1;
    const fx = line.x1 - circle.cx, fy = line.y1 - circle.cy;
    const aa = dx * dx + dy * dy;
    if (aa < 1e-12) return [];
    const bb = 2 * (fx * dx + fy * dy);
    const cc = fx * fx + fy * fy - circle.r * circle.r;
    const discriminant = bb * bb - 4 * aa * cc;
    if (discriminant < -1e-10) return [];
    const root = Math.sqrt(Math.max(0, discriminant));
    const ts = [(-bb - root) / (2 * aa), (-bb + root) / (2 * aa)];
    const result = [];
    ts.forEach(function (t) {
      if (!MI.LinearGeometry.accepts(line, t)) return;
      const p = { x: line.x1 + t * dx, y: line.y1 + t * dy };
      if (!result.some(function (q) { return distance(p, q) < 1e-8; })) result.push(p);
    });
    return result;
  }

  const geometryCache = new WeakMap();
  function snapCandidates(engine, excludeId) {
    const excluded=MI.ConstructionService.descendants(engine.model.objects,Array.isArray(excludeId)?excludeId:excludeId?[excludeId]:[]);
    const objects = engine.model.objects.filter(o => o.visible !== false && !(o.construction && o.constructionValid===false) && !excluded.has(o.id) && (!engine.canSnap || engine.canSnap(o.id)));
    // Inspect geometry rather than trusting a revision counter: injected
    // service-input views may differ from the immutable production model.
    // One entry per model bounds cache lifetime even when exclusions change.
    const key = JSON.stringify(objects.map(o => [o.id, o.type, o.x, o.y, o.x1, o.y1, o.x2, o.y2, o.cx, o.cy, o.r, o.vertices]));
    const cached = geometryCache.get(engine.model);
    if (cached && cached.key === key) return cached.candidates;
    objects.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const candidates = [];

    objects.forEach(function (o) {
      if (o.type === "point") addCandidate(candidates, o.x, o.y, "point", [o.id]);
      if (MI.LinearGeometry.isLinear(o)) {
        addCandidate(candidates, o.x1, o.y1, "line-endpoint", [o.id]);
        addCandidate(candidates, o.x2, o.y2, "line-endpoint", [o.id]);
      }
      if (o.type === "polygon" || o.type === "angle") o.vertices.forEach(p=>addCandidate(candidates,p.x,p.y,"line-endpoint",[o.id]));
      if (o.type === "circle") addCandidate(candidates, o.cx, o.cy, "circle-center", [o.id]);
    });

    const shapes = objects.flatMap(o=>MI.MeasurementGeometry.edges(o));
    for (let i = 0; i < shapes.length; i += 1) {
      for (let j = i + 1; j < shapes.length; j += 1) {
        const a = shapes[i], b = shapes[j];
        if (a.id === b.id) continue;
        if (MI.LinearGeometry.isLinear(a) && MI.LinearGeometry.isLinear(b)) {
          const p = MI.LinearGeometry.intersect(a, b);
          if (p) addCandidate(candidates, p.x, p.y, "line-line-intersection", [a.id, b.id]);
        }
        if (a.type === "circle" && b.type === "circle") {
          circleCircleIntersections(a, b).forEach(function (p) { addCandidate(candidates, p.x, p.y, "circle-circle-intersection", [a.id, b.id]); });
        }
        if (MI.LinearGeometry.isLinear(a) && b.type === "circle") {
          lineCircleIntersections(a, b).forEach(function (p) { addCandidate(candidates, p.x, p.y, "line-circle-intersection", [a.id, b.id]); });
        }
        if (a.type === "circle" && MI.LinearGeometry.isLinear(b)) {
          lineCircleIntersections(b, a).forEach(function (p) { addCandidate(candidates, p.x, p.y, "line-circle-intersection", [a.id, b.id]); });
        }
      }
    }
    geometryCache.set(engine.model, { key, candidates });
    return candidates;
  }


  const PRIORITY = Object.freeze({ point: 0, "line-line-intersection": 1, "line-circle-intersection": 1, "circle-circle-intersection": 1, "line-endpoint": 2, "circle-center": 3, grid: 4 });
  function valid(point) { return point && Number.isFinite(point.x) && Number.isFinite(point.y); }
  function compare(a, b) {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (Math.abs(a.distancePx - b.distancePx) > 1e-9) return a.distancePx - b.distancePx;
    const ak = a.ids.join("\u0000") + ":" + a.kind, bk = b.ids.join("\u0000") + ":" + b.kind;
    return ak < bk ? -1 : ak > bk ? 1 : a.point.x - b.point.x || a.point.y - b.point.y;
  }
  const SnapService = {
    tolerancePx: 12,
    priorities: PRIORITY,
    compare,
    free(point, constraint = null) {
      if (!valid(point)) throw new Error("Ongeldige pointercoördinaat.");
      return { point: { x: point.x, y: point.y }, snapped: false, kind: null, ids: [], grid: false, priority: Infinity, distancePx: Infinity, constraint };
    },
    candidates(engine, excludeId) { return snapCandidates(engine, excludeId).map(c => ({ ...c, ids: c.ids.slice() })); },
    resolve(engine, point, options = {}) {
      if (!valid(point)) throw new Error("Ongeldige pointercoördinaat.");
      const transform = options.transform || MI.CoordinateTransform.forCanvas(engine) || new MI.CoordinateTransform(engine.renderer);
      const candidates = snapCandidates(engine, options.excludeIds || options.excludeId);
      const results = [], screen = transform.mathToScreen(point);
      const consider = candidate => {
        const target = transform.mathToScreen(candidate), distancePx = Math.hypot(screen.x - target.x, screen.y - target.y);
        if (Number.isFinite(distancePx) && distancePx <= SnapService.tolerancePx + 1e-9) results.push({ point: { x: candidate.x, y: candidate.y }, snapped: true, kind: candidate.kind, ids: candidate.ids.slice(), grid: candidate.kind === "grid", priority: PRIORITY[candidate.kind], distancePx, constraint: null });
      };
      candidates.forEach(consider);
      const step = engine.renderer.axisStep;
      if (engine.renderer.showGrid && Number.isFinite(step) && step > 0) consider({ x: Math.round(point.x / step) * step, y: Math.round(point.y / step) * step, kind: "grid", ids: [] });
      results.sort(compare);
      return results[0] || SnapService.free(point);
    }
  };
  MI.SnapService = SnapService;
  // Compatibility entry points delegate; no second resolver or tolerance policy.
  MI.getSnapCandidates = (engine, excludeId) => SnapService.candidates(engine, excludeId);
  MI.snapPoint = (engine, point, excludeId) => {
    const result = SnapService.resolve(engine, point, { excludeId });
    return { ...result, x: result.point.x, y: result.point.y, object: null };
  };
  MI.publishSnapResult = (engine, result) => {
    if (global.dispatchEvent && global.CustomEvent) global.dispatchEvent(new CustomEvent("fzi:snap-result", { detail: { engine, result } }));
  };
})(window);
