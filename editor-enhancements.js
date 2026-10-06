/* From Zero 2 Infinity — reliable point snapping */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  if (!MI.Engine || MI.Engine.prototype.__fziPointSnapInstalled) return;

  function toleranceInMathUnits(engine) {
    const scale = engine && engine.renderer && engine.renderer.scale ? engine.renderer.scale() : 1;
    return 12 / Math.max(scale, 1e-9);
  }

  function nearestPoint(engine, point, excludeId) {
    if (!engine || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
    const tolerance = toleranceInMathUnits(engine);
    let best = null;
    let bestDistance = Infinity;

    engine.model.objects.forEach(function (object) {
      if (object.type !== "point" || object.visible === false || object.id === excludeId) return;
      const distance = Math.hypot(point.x - object.x, point.y - object.y);
      if (distance <= tolerance && distance < bestDistance) {
        best = object;
        bestDistance = distance;
      }
    });

    return best ? { x: best.x, y: best.y, object: best } : null;
  }

  MI.snapPoint = function (engine, point, excludeId) {
    const hit = nearestPoint(engine, point, excludeId);
    return hit ? { x: hit.x, y: hit.y, snapped: true, object: hit.object } : { x: point.x, y: point.y, snapped: false, object: null };
  };

  const originalAdd = MI.Engine.prototype.add;
  const originalUpdate = MI.Engine.prototype.update;

  MI.Engine.prototype.add = function (object) {
    const next = JSON.parse(JSON.stringify(object));
    const snap = function (x, y) {
      return MI.snapPoint(this, { x: x, y: y }, null);
    }.bind(this);

    if (next.type === "point" || next.type === "text") {
      const p = snap(next.x, next.y);
      next.x = p.x; next.y = p.y;
    } else if (next.type === "line") {
      let p = snap(next.x1, next.y1); next.x1 = p.x; next.y1 = p.y;
      p = snap(next.x2, next.y2); next.x2 = p.x; next.y2 = p.y;
    } else if (next.type === "circle") {
      const p = snap(next.cx, next.cy);
      next.cx = p.x; next.cy = p.y;
    }

    return originalAdd.call(this, next);
  };

  MI.Engine.prototype.update = function (id, patch) {
    const next = Object.assign({}, patch);
    const object = this.get(id);
    if (object) {
      if ((object.type === "point" || object.type === "text") && Number.isFinite(next.x) && Number.isFinite(next.y)) {
        const p = MI.snapPoint(this, { x: next.x, y: next.y }, id);
        next.x = p.x; next.y = p.y;
      }
      if (object.type === "circle" && Number.isFinite(next.cx) && Number.isFinite(next.cy)) {
        const p = MI.snapPoint(this, { x: next.cx, y: next.cy }, id);
        next.cx = p.x; next.cy = p.y;
      }
    }
    return originalUpdate.call(this, id, next);
  };

  MI.Engine.prototype.__fziPointSnapInstalled = true;
})(window);