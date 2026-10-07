/* One source for mathematical/SVG/screen transforms in snapping interactions. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  class CoordinateTransform {
    constructor(renderer, matrix) {
      const m = matrix || {};
      this.matrix = { a: m.a == null ? 1 : m.a, b: m.b == null ? 0 : m.b, c: m.c == null ? 0 : m.c, d: m.d == null ? 1 : m.d, e: m.e == null ? 0 : m.e, f: m.f == null ? 0 : m.f };
      const { a, b, c, d, e, f } = this.matrix;
      this.determinant = a * d - b * c;
      if (![a, b, c, d, e, f].every(Number.isFinite) || !Number.isFinite(this.determinant) || this.determinant === 0) throw new Error("Ongeldige schermtransformatie.");
      this.bounds = { ...renderer.bounds }; this.scale = renderer.scale(); this.padding = renderer.padding; this.height = renderer.height;
      if (!Number.isFinite(this.scale) || this.scale <= 0) throw new Error("Ongeldige mathematische schaal.");
    }
    mathToScreen(point) {
      const x = this.padding + (point.x - this.bounds.xMin) * this.scale, y = this.height - this.padding - (point.y - this.bounds.yMin) * this.scale;
      const m = this.matrix;
      return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
    }
    screenToMath(point) {
      if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
      const m = this.matrix, dx = point.x - m.e, dy = point.y - m.f;
      const x = (m.d * dx - m.c * dy) / this.determinant, y = (-m.b * dx + m.a * dy) / this.determinant;
      const result = { x: this.bounds.xMin + (x - this.padding) / this.scale, y: this.bounds.yMin + (this.height - this.padding - y) / this.scale };
      return Number.isFinite(result.x) && Number.isFinite(result.y) ? result : null;
    }
    screenDelta(dx, dy) {
      const origin = this.screenToMath({ x: 0, y: 0 }), next = this.screenToMath({ x: dx, y: dy });
      return next ? { x: next.x - origin.x, y: next.y - origin.y } : null;
    }
    distance(a, b) { const p = this.mathToScreen(a), q = this.mathToScreen(b); return Math.hypot(p.x - q.x, p.y - q.y); }
    static forCanvas(engine, ownerDocument) {
      if (!ownerDocument && typeof document === "undefined") return null;
      const source = ownerDocument || document;
      const canvas = source.getElementById("canvas"), svg = canvas && canvas.querySelector("svg"), matrix = svg && svg.getScreenCTM();
      if (!matrix) return null;
      try { return new CoordinateTransform(engine.renderer, matrix); } catch (_) { return null; }
    }
  }
  MI.CoordinateTransform = CoordinateTransform;
})(window);
