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
  function presentationOptions(presentation) {
    const options = {};
    [...MI.PRESENTATION_FLAGS, "bounds", "background", "coordinateSystem", "axisStep"].forEach(key => {
      if (presentation && key in presentation) options[key] = presentation[key];
    });
    return options;
  }
  function createDocumentRenderer(options) {
    const renderer = new MI.SvgRenderer(options);
    renderer.showSnapPoints = options.showSnapPoints !== false;
    // Validate the presentation before the engine replaces a document. In the
    // editor the existing adaptive-grid policy remains authoritative.
    if (MI.adaptiveGridStep) renderer.axisStep = MI.adaptiveGridStep(renderer);
    renderer.renderGrid(); renderer.renderAxes();
    return renderer;
  }

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

  function screenHit(object, point, transform) {
    const map = (x, y) => transform.mathToScreen({ x, y });
    if (object.type === 'point' || object.type === 'text') { const p = map(object.x, object.y); return Math.hypot(point.x - p.x, point.y - p.y); }
    if (object.type === 'line') { const a = map(object.x1, object.y1), b = map(object.x2, object.y2); return distancePointToSegment(point.x, point.y, a.x, a.y, b.x, b.y); }
    if (object.type === 'circle') {
      const center = map(object.cx, object.cy);
      const a = map(object.cx + object.r, object.cy), b = map(object.cx, object.cy + object.r);
      const ax = a.x - center.x, ay = a.y - center.y, bx = b.x - center.x, by = b.y - center.y;
      const radius = Math.hypot(ax, ay), other = Math.hypot(bx, by), centerDistance = Math.hypot(point.x - center.x, point.y - center.y);
      if (Math.abs(radius - other) <= 1e-9 * Math.max(1, radius) && Math.abs(ax * bx + ay * by) <= 1e-9 * Math.max(1, radius * other)) return Math.min(centerDistance, Math.abs(centerDistance - radius));
      const distance = angle => { const p = map(object.cx + Math.cos(angle) * object.r, object.cy + Math.sin(angle) * object.r); return Math.hypot(point.x - p.x, point.y - p.y); };
      // Find/refine the nearest point on the transformed circle, including affine SVG transforms.
      const step = Math.PI * 2 / 32; let best = 0;
      for (let i = 1; i < 32; i++) if (distance(i * step) < distance(best)) best = i * step;
      let low = best - step, high = best + step;
      for (let i = 0; i < 48; i++) { const a = low + (high - low) / 3, b = high - (high - low) / 3; if (distance(a) < distance(b)) high = b; else low = a; }
      return Math.min(centerDistance, distance((low + high) / 2));
    }
    return Infinity;
  }

  class Engine {
    constructor(data, rendererOptions) {
      this.model = data instanceof MI.IllustrationModel
        ? data
        : new MI.IllustrationModel(data);
      this.renderer = createDocumentRenderer(Object.assign({}, presentationOptions(this.model.presentation), rendererOptions || {}));
    }

    add(object) { return this.model.add(object); }
    update(id, patch) { return this.model.update(id, patch); }
    remove(id) { return this.model.remove(id); }
    get(id) { return this.model.get(id); }

    selectAt(x, y, tolerance) {
      const options = tolerance && typeof tolerance === 'object' ? tolerance : null;
      const maxDistance = options ? (options.tolerancePx == null ? 8 : options.tolerancePx) : Number.isFinite(Number(tolerance)) ? Number(tolerance) : 0.25;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(maxDistance) || maxDistance < 0) return null;
      if (options && (!options.transform || !options.transform.mathToScreen)) throw new Error('Schermselectie vereist CoordinateTransform.');
      const screen = options && options.transform.mathToScreen({ x, y });
      let best = null;
      let bestDistance = Infinity;

      this.model.objects.forEach((object) => {
        if (object.visible === false) return;
        const distance = options ? screenHit(object, screen, options.transform) : hitDistance(object, x, y);
        if (distance <= maxDistance + (options ? 1e-9 : 0) && (options ? distance <= bestDistance + 1e-9 : distance < bestDistance)) {
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

    toJSON() {
      const document = this.model.toJSON(), r = this.renderer;
      const presentation = { ...(document.presentation || {}), bounds: { ...(document.presentation && document.presentation.bounds || {}), ...r.bounds }, coordinateSystem: r.coordinateSystem, background: r.background, axisStep: r.axisStep };
      MI.PRESENTATION_FLAGS.forEach(key => { presentation[key] = key === "showSnapPoints" ? r[key] !== false : r[key]; });
      document.presentation = presentation;
      return document;
    }
    toJSONString(pretty) { return JSON.stringify(this.toJSON(), null, pretty ? 2 : 0); }
    load(data) {
      const model = new MI.IllustrationModel().load(data), current = this.renderer;
      const options = { width: current.width, height: current.height, padding: current.padding, bounds: { ...current.bounds }, background: current.background, axisStep: current.axisStep, coordinateSystem: current.coordinateSystem };
      MI.PRESENTATION_FLAGS.forEach(key => { options[key] = key === "showSnapPoints" ? current[key] !== false : current[key]; });
      Object.assign(options, presentationOptions(model.presentation));
      const renderer = createDocumentRenderer(options);
      this.model = model; this.renderer = renderer;
      return this;
    }
    renderSVG() {
      if (MI.adaptiveGridStep) this.renderer.axisStep = MI.adaptiveGridStep(this.renderer);
      return this.renderer.render(this.model);
    }
  }

  MI.Engine = Engine;
  MI.distancePointToSegment = distancePointToSegment;
})(window);
