/* From Zero 2 Infinity — Mathematical Illustration SVG Renderer */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  const SVG_NS = "http://www.w3.org/2000/svg";

  function esc(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
  function number(value, digits) { return Number(Number(value).toFixed(digits == null ? 6 : digits)); }
  function axisNumber(value) { const n = Number(Number(value).toFixed(1)); return Object.is(n, -0) ? 0 : n; }
  function dash(style) { return style.dash ? ' stroke-dasharray="' + esc(style.dash) + '"' : ""; }
  function strokeAttrs(style) { return ['stroke="' + esc(style.stroke) + '"','stroke-width="' + esc(number(style.strokeWidth)) + '"','stroke-linecap="round"','stroke-linejoin="round"','opacity="' + esc(number(style.opacity)) + '"',dash(style)].join(" "); }

  class SvgRenderer {
    constructor(options) {
      const opts = options || {};
      this.width = Number(opts.width || 800); this.height = Number(opts.height || 500);
      this.bounds = Object.assign({ xMin: -5, yMin: -3, xMax: 5, yMax: 3 }, opts.bounds || {});
      this.background = opts.background || "transparent"; this.padding = Number(opts.padding || 0);
      this.showAxes = opts.showAxes !== false; this.showGrid = opts.showGrid === true; this.axisStep = Number(opts.axisStep || 1);
      this.preview = null; this.syncAspectRatio();
    }

    syncAspectRatio() {
      const b = this.bounds, xSpan = b.xMax - b.xMin, ySpan = b.yMax - b.yMin, drawableWidth = Math.max(1, this.width - this.padding * 2);
      this.height = Math.max(1, this.padding * 2 + drawableWidth * (ySpan / xSpan));
    }
    scale() { return (this.width - this.padding * 2) / (this.bounds.xMax - this.bounds.xMin); }
    mapX(x) { return this.padding + (x - this.bounds.xMin) * this.scale(); }
    mapY(y) { return this.height - this.padding - (y - this.bounds.yMin) * this.scale(); }

    renderGrid() {
      if (!this.showGrid) return "";
      const b = this.bounds, parts = [], step = this.axisStep;
      for (let x = Math.ceil(b.xMin / step) * step; x <= b.xMax + 1e-9; x += step) { const sx = this.mapX(x); parts.push('<line x1="' + number(sx) + '" y1="' + this.padding + '" x2="' + number(sx) + '" y2="' + (this.height - this.padding) + '" stroke="#dfe1dd" stroke-width="0.7"/>'); }
      for (let y = Math.ceil(b.yMin / step) * step; y <= b.yMax + 1e-9; y += step) { const sy = this.mapY(y); parts.push('<line x1="' + this.padding + '" y1="' + number(sy) + '" x2="' + (this.width - this.padding) + '" y2="' + number(sy) + '" stroke="#dfe1dd" stroke-width="0.7"/>'); }
      return '<g data-illustration-grid aria-hidden="true">' + parts.join("") + '</g>';
    }

    renderAxes() {
      if (!this.showAxes) return "";
      const b = this.bounds, parts = [], axisStroke = "#777", tickStroke = "#aaa", labelFill = "#666", x0 = this.mapX(0), y0 = this.mapY(0), step = this.axisStep;
      if (b.yMin <= 0 && b.yMax >= 0) {
        parts.push('<line x1="' + this.mapX(b.xMin) + '" y1="' + y0 + '" x2="' + this.mapX(b.xMax) + '" y2="' + y0 + '" stroke="' + axisStroke + '" stroke-width="1.4"/>');
        for (let x = Math.ceil(b.xMin / step) * step; x <= b.xMax + 1e-9; x += step) { if (Math.abs(x) < 1e-9) continue; const sx = this.mapX(x); parts.push('<line x1="' + sx + '" y1="' + (y0 - 4) + '" x2="' + sx + '" y2="' + (y0 + 4) + '" stroke="' + tickStroke + '" stroke-width="1"/>'); parts.push('<text x="' + sx + '" y="' + (y0 + 18) + '" fill="' + labelFill + '" font-size="12" font-family="Source Sans 3, sans-serif" text-anchor="middle">' + esc(axisNumber(x)) + '</text>'); }
        parts.push('<text x="' + (this.mapX(b.xMax) - 8) + '" y="' + (y0 - 8) + '" fill="' + labelFill + '" font-size="13" font-family="Source Sans 3, sans-serif" text-anchor="end">x</text>');
      }
      if (b.xMin <= 0 && b.xMax >= 0) {
        parts.push('<line x1="' + x0 + '" y1="' + this.mapY(b.yMin) + '" x2="' + x0 + '" y2="' + this.mapY(b.yMax) + '" stroke="' + axisStroke + '" stroke-width="1.4"/>');
        for (let y = Math.ceil(b.yMin / step) * step; y <= b.yMax + 1e-9; y += step) { if (Math.abs(y) < 1e-9) continue; const sy = this.mapY(y); parts.push('<line x1="' + (x0 - 4) + '" y1="' + sy + '" x2="' + (x0 + 4) + '" y2="' + sy + '" stroke="' + tickStroke + '" stroke-width="1"/>'); parts.push('<text x="' + (x0 - 8) + '" y="' + (sy + 4) + '" fill="' + labelFill + '" font-size="12" font-family="Source Sans 3, sans-serif" text-anchor="end">' + esc(axisNumber(y)) + '</text>'); }
        parts.push('<text x="' + (x0 + 8) + '" y="' + (this.mapY(b.yMax) + 12) + '" fill="' + labelFill + '" font-size="13" font-family="Source Sans 3, sans-serif">y</text>');
      }
      return '<g data-illustration-axes aria-hidden="true">' + parts.join("") + '</g>';
    }

    renderPreview() {
      const preview = this.preview; if (!preview) return "";
      const sx = this.mapX(preview.start.x), sy = this.mapY(preview.start.y), ex = this.mapX(preview.end.x), ey = this.mapY(preview.end.y), dx = preview.end.x - preview.start.x, dy = preview.end.y - preview.start.y, length = Math.hypot(dx, dy);
      if (length < 1e-9) return "";
      const mx = (sx + ex) / 2, my = (sy + ey) / 2 - 10, label = esc(axisNumber(length));
      if (preview.type === "line") return '<g data-drawing-preview><line x1="' + sx + '" y1="' + sy + '" x2="' + ex + '" y2="' + ey + '" stroke="#9a7a32" stroke-width="2" stroke-dasharray="7 5"/><circle cx="' + sx + '" cy="' + sy + '" r="3" fill="#9a7a32"/><circle cx="' + ex + '" cy="' + ey + '" r="3" fill="#9a7a32"/><text x="' + mx + '" y="' + my + '" fill="#6f5925" font-size="12" font-family="Source Sans 3, sans-serif" text-anchor="middle">' + label + '</text></g>';
      if (preview.type === "circle") return '<g data-drawing-preview><circle cx="' + sx + '" cy="' + sy + '" r="' + (length * this.scale()) + '" fill="none" stroke="#9a7a32" stroke-width="1.5" stroke-dasharray="7 5"/><line x1="' + sx + '" y1="' + sy + '" x2="' + ex + '" y2="' + ey + '" stroke="#9a7a32" stroke-width="2"/><circle cx="' + sx + '" cy="' + sy + '" r="3" fill="#9a7a32"/><circle cx="' + ex + '" cy="' + ey + '" r="3" fill="#9a7a32"/><text x="' + mx + '" y="' + my + '" fill="#6f5925" font-size="12" font-family="Source Sans 3, sans-serif" text-anchor="middle">r = ' + label + '</text></g>';
      return "";
    }

    render(model) {
      this.syncAspectRatio();
      const b = this.bounds, body = model.all().map((object) => this.renderObject(object)).join("\n");
      const background = this.background === "transparent" ? "" : '<rect x="0" y="0" width="' + esc(this.width) + '" height="' + esc(this.height) + '" fill="' + esc(this.background) + '"/>';
      return ['<svg xmlns="' + SVG_NS + '" viewBox="0 0 ' + esc(this.width) + ' ' + esc(this.height) + '" width="' + esc(this.width) + '" height="' + esc(this.height) + '" preserveAspectRatio="xMidYMid meet" role="img">','<title>' + esc(model.meta && model.meta.title ? model.meta.title : "Wiskundige illustratie") + '</title>','<desc>' + esc(model.meta && model.meta.description ? model.meta.description : "") + '</desc>','<!-- mathematical bounds: ' + [b.xMin,b.yMin,b.xMax,b.yMax].map(number).join(", ") + ' -->',background,this.renderGrid(),this.renderAxes(),body,this.renderPreview(),'</svg>'].join("\n");
    }

    renderLabel(object, label, dx, dy, line) {
      let x, y;
      if (line) { x = this.mapX((object.x1 + object.x2) / 2); y = this.mapY((object.y1 + object.y2) / 2); }
      else if (object.type === "circle") { x = this.mapX(object.cx); y = this.mapY(object.cy); }
      else { x = this.mapX(object.x); y = this.mapY(object.y); }
      const style = object.style || {};
      const labelColor = style.stroke && style.stroke !== "none" ? style.stroke : (style.fill || "#222");
      return '<text x="' + number(x + dx) + '" y="' + number(y + dy) + '" fill="' + esc(labelColor) + '" font-size="14" font-family="Source Sans 3, sans-serif">' + esc(label) + '</text>';
    }

    renderObject(object) {
      const style = object.style || {}; let svg = "";
      if (object.type === "point") {
        svg = '<circle cx="' + number(this.mapX(object.x)) + '" cy="' + number(this.mapY(object.y)) + '" r="' + number(style.radius || 4) + '" ' + strokeAttrs(style) + ' fill="' + esc(style.fill || style.stroke) + '"/>';
        if (object.showLabel) svg += this.renderLabel(object, object.name || object.label || object.id, 8, -8);
      }
      if (object.type === "line") {
        svg = '<line x1="' + number(this.mapX(object.x1)) + '" y1="' + number(this.mapY(object.y1)) + '" x2="' + number(this.mapX(object.x2)) + '" y2="' + number(this.mapY(object.y2)) + '" ' + strokeAttrs(style) + ' fill="none"/>';
        if (object.showLabel) svg += this.renderLabel(object, object.name || object.label || object.id, 6, -6, true);
      }
      if (object.type === "circle") {
        const cx = this.mapX(object.cx), cy = this.mapY(object.cy), r = object.r * this.scale();
        svg = '<circle cx="' + number(cx) + '" cy="' + number(cy) + '" r="' + number(r) + '" ' + strokeAttrs(style) + ' fill="' + esc(style.fill || "none") + '"/>';
        svg += '<circle cx="' + number(cx) + '" cy="' + number(cy) + '" r="3.2" fill="#222" stroke="#fff" stroke-width="1.2"/>';
        if (object.showLabel) svg += this.renderLabel(object, object.name || object.label || object.id, 8, -8);
      }
      if (object.type === "text") {
        const transform = object.rotation ? ' transform="rotate(' + number(object.rotation) + ' ' + number(this.mapX(object.x)) + ' ' + number(this.mapY(object.y)) + ')"' : "";
        svg = '<text x="' + number(this.mapX(object.x)) + '" y="' + number(this.mapY(object.y)) + '" fill="' + esc(style.fill || style.stroke || "#222") + '" font-size="' + number(style.fontSize || 16) + '" font-family="' + esc(style.fontFamily || "Source Sans 3, sans-serif") + '" text-anchor="' + esc(style.anchor || "start") + '"' + transform + '>' + esc(object.text) + '</text>';
        if (object.showLabel) svg += this.renderLabel(object, object.name || object.id, 6, -6);
      }
      return '<g data-object-id="' + esc(object.id) + '" data-object-type="' + esc(object.type) + '" aria-label="' + esc(object.name || object.id) + '">' + svg + '</g>';
    }
  }

  MI.SvgRenderer = SvgRenderer;
  MI.escapeXml = esc;
})(window);
