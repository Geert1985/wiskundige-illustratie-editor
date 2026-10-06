/*
 * From Zero 2 Infinity — Mathematical Illustration Engine facade
 *
 * Public API for the first engine version. UI/editor code should depend on
 * this facade rather than on the model or renderer internals.
 */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};

  function distancePointToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const x = x1 + t * dx;
    const y = y1 + t * dy;
    return Math.hypot(px - x, py - y);
  }

  function hitDistance(object, x, y) {
    if (object.type === "point") return Math.hypot(x - object.x, y - object.y);
    if (object.type === "line") return distancePointToSegment(x, y, object.x1, object.y1, object.x2, object.y2);
    if (object.type === "circle") return Math.abs(Math.hypot(x - object.cx, y - object.cy) - object.r);
    if (object.type === "text") return Math.hypot(x - object.x, y - object.y);
    return Infinity;
  }

  class Engine {
    constructor(data, rendererOptions) {
      this.model = data instanceof MI.IllustrationModel
        ? data
        : new MI.IllustrationModel(data);
      this.renderer = new MI.SvgRenderer(rendererOptions || {});
      MI.activeEngine = this;
    }

    add(object) { return this.model.add(object); }
    update(id, patch) { return this.model.update(id, patch); }
    remove(id) { return this.model.remove(id); }
    get(id) { return this.model.get(id); }

    selectAt(x, y, tolerance) {
      const maxDistance = Number.isFinite(Number(tolerance)) ? Number(tolerance) : 0.25;
      let best = null;
      let bestDistance = Infinity;

      this.model.objects.forEach((object) => {
        if (object.visible === false) return;
        const distance = hitDistance(object, x, y);
        if (distance <= maxDistance && distance < bestDistance) {
          best = object;
          bestDistance = distance;
        }
      });

      return best ? { object: JSON.parse(JSON.stringify(best)), distance: bestDistance } : null;
    }

    move(id, x, y) {
      const object = this.model.get(id);
      if (!object) throw new Error("Object niet gevonden: " + id);

      if (object.type === "point" || object.type === "text") return this.update(id, { x: x, y: y });
      if (object.type === "circle") return this.update(id, { cx: x, cy: y });
      if (object.type === "line") {
        const dx = x - object.x1;
        const dy = y - object.y1;
        return this.update(id, { x1: x, y1: y, x2: object.x2 + dx, y2: object.y2 + dy });
      }
      throw new Error("Verplaatsen wordt nog niet ondersteund voor: " + object.type);
    }

    toJSON() { return this.model.toJSON(); }
    toJSONString(pretty) { return JSON.stringify(this.toJSON(), null, pretty ? 2 : 0); }
    load(data) { this.model.load(data); return this; }
    renderSVG() { return this.renderer.render(this.model); }
  }

  MI.Engine = Engine;
  MI.distancePointToSegment = distancePointToSegment;
})(window);
