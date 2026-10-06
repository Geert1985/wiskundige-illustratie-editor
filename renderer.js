/*
 * From Zero 2 Infinity — Mathematical Illustration SVG Renderer
 *
 * Renders the model without knowing anything about lessons, phases,
 * milestones or game progression.
 */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  const SVG_NS = "http://www.w3.org/2000/svg";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function number(value) {
    return Number(Number(value).toFixed(6));
  }

  function dash(style) {
    return style.dash ? ' stroke-dasharray="' + esc(style.dash) + '"' : "";
  }

  function strokeAttrs(style) {
    return [
      'stroke="' + esc(style.stroke) + '"',
      'stroke-width="' + esc(number(style.strokeWidth)) + '"',
      'stroke-linecap="round"',
      'stroke-linejoin="round"',
      'opacity="' + esc(number(style.opacity)) + '"',
      dash(style)
    ].join(" ");
  }

  class SvgRenderer {
    constructor(options) {
      const opts = options || {};
      this.width = Number(opts.width || 800);
      this.height = Number(opts.height || 500);
      this.bounds = Object.assign({ xMin: -5, yMin: -3, xMax: 5, yMax: 3 }, opts.bounds || {});
      this.background = opts.background || "transparent";
      this.padding = Number(opts.padding || 0);
      this.showAxes = opts.showAxes !== false;
      this.axisStep = Number(opts.axisStep || 1);
    }

    mapX(x) {
      const b = this.bounds;
      return this.padding + ((x - b.xMin) / (b.xMax - b.xMin)) * (this.width - this.padding * 2);
    }

    mapY(y) {
      const b = this.bounds;
      return this.height - this.padding - ((y - b.yMin) / (b.yMax - b.yMin)) * (this.height - this.padding * 2);
    }

    renderAxes() {
      if (!this.showAxes) return "";
      const b = this.bounds;
      const parts = [];
      const axisStroke = "#888";
      const tickStroke = "#aaa";
      const labelFill = "#666";
      const x0 = this.mapX(0);
      const y0 = this.mapY(0);

      if (b.yMin <= 0 && b.yMax >= 0) {
        parts.push('<line x1="' + number(this.mapX(b.xMin)) + '" y1="' + number(y0) + '" x2="' + number(this.mapX(b.xMax)) + '" y2="' + number(y0) + '" stroke="' + axisStroke + '" stroke-width="1.4" />');
        for (let x = Math.ceil(b.xMin / this.axisStep) * this.axisStep; x <= b.xMax + 1e-9; x += this.axisStep) {
          if (Math.abs(x) < 1e-9) continue;
          const sx = this.mapX(x);
          parts.push('<line x1="' + number(sx) + '" y1="' + number(y0 - 4) + '" x2="' + number(sx) + '" y2="' + number(y0 + 4) + '" stroke="' + tickStroke + '" stroke-width="1" />');
          parts.push('<text x="' + number(sx) + '" y="' + number(y0 + 18) + '" fill="' + labelFill + '" font-size="12" font-family="Source Sans 3, sans-serif" text-anchor="middle">' + esc(number(x)) + '</text>');
        }
        parts.push('<text x="' + number(this.mapX(b.xMax) - 8) + '" y="' + number(y0 - 8) + '" fill="' + labelFill + '" font-size="13" font-family="Source Sans 3, sans-serif" text-anchor="end">x</text>');
      }

      if (b.xMin <= 0 && b.xMax >= 0) {
        parts.push('<line x1="' + number(x0) + '" y1="' + number(this.mapY(b.yMin)) + '" x2="' + number(x0) + '" y2="' + number(this.mapY(b.yMax)) + '" stroke="' + axisStroke + '" stroke-width="1.4" />');
        for (let y = Math.ceil(b.yMin / this.axisStep) * this.axisStep; y <= b.yMax + 1e-9; y += this.axisStep) {
          if (Math.abs(y) < 1e-9) continue;
          const sy = this.mapY(y);
          parts.push('<line x1="' + number(x0 - 4) + '" y1="' + number(sy) + '" x2="' + number(x0 + 4) + '" y2="' + number(sy) + '" stroke="' + tickStroke + '" stroke-width="1" />');
          parts.push('<text x="' + number(x0 - 8) + '" y="' + number(sy + 4) + '" fill="' + labelFill + '" font-size="12" font-family="Source Sans 3, sans-serif" text-anchor="end">' + esc(number(y)) + '</text>');
        }
        parts.push('<text x="' + number(x0 + 8) + '" y="' + number(this.mapY(b.yMax) + 12) + '" fill="' + labelFill + '" font-size="13" font-family="Source Sans 3, sans-serif">y</text>');
      }

      return '<g data-illustration-axes aria-hidden="true">' + parts.join("\n") + '</g>';
    }

    render(model) {
      const b = this.bounds;
      const body = model.all().map((object) => this.renderObject(object)).join("\n");
      const background = this.background === "transparent"
        ? ""
        : '<rect x="0" y="0" width="' + esc(this.width) + '" height="' + esc(this.height) + '" fill="' + esc(this.background) + '" />';

      return [
        '<svg xmlns="' + SVG_NS + '" viewBox="0 0 ' + esc(this.width) + ' ' + esc(this.height) + '" width="' + esc(this.width) + '" height="' + esc(this.height) + '" role="img">',
        '<title>' + esc(model.meta && model.meta.title ? model.meta.title : "Wiskundige illustratie") + '</title>',
        '<desc>' + esc(model.meta && model.meta.description ? model.meta.description : "") + '</desc>',
        '<!-- mathematical bounds: ' + [b.xMin, b.yMin, b.xMax, b.yMax].map(number).join(", ") + ' -->',
        background,
        this.renderAxes(),
        body,
        '</svg>'
      ].join("\n");
    }

    renderObject(object) {
      const style = object.style || {};
      let svg = "";

      if (object.type === "point") {
        svg = '<circle cx="' + esc(number(this.mapX(object.x))) + '" cy="' + esc(number(this.mapY(object.y))) + '" r="' + esc(number(style.radius || 4)) + '" ' + strokeAttrs(style) + ' fill="' + esc(style.fill || style.stroke) + '" />';
        if (object.label) svg += this.renderLabel(object, object.label, 8, -8);
      }

      if (object.type === "line") {
        svg = '<line x1="' + esc(number(this.mapX(object.x1))) + '" y1="' + esc(number(this.mapY(object.y1))) + '" x2="' + esc(number(this.mapX(object.x2))) + '" y2="' + esc(number(this.mapY(object.y2))) + '" ' + strokeAttrs(style) + ' fill="none" />';
        if (object.label) svg += this.renderLabel(object, object.label, 6, -6, true);
      }

      if (object.type === "circle") {
        const scaleX = (this.width - this.padding * 2) / (this.bounds.xMax - this.bounds.xMin);
        const scaleY = (this.height - this.padding * 2) / (this.bounds.yMax - this.bounds.yMin);
        const radius = object.r * Math.min(scaleX, scaleY);
        svg = '<circle cx="' + esc(number(this.mapX(object.cx))) + '" cy="' + esc(number(this.mapY(object.cy))) + '" r="' + esc(number(radius)) + '" ' + strokeAttrs(style) + ' fill="' + esc(style.fill || "none") + '" />';
        if (object.label) svg += this.renderLabel(object, object.label, 6, -6);
      }

      if (object.type === "text") {
        const transform = object.rotation ? ' transform="rotate(' + esc(number(object.rotation)) + ' ' + esc(number(this.mapX(object.x))) + ' ' + esc(number(this.mapY(object.y))) + ')"' : "";
        svg = '<text x="' + esc(number(this.mapX(object.x))) + '" y="' + esc(number(this.mapY(object.y))) + '" fill="' + esc(style.fill || style.stroke || "#222") + '" font-size="' + esc(number(style.fontSize || 16)) + '" font-family="' + esc(style.fontFamily || "sans-serif") + '" text-anchor="' + esc(style.anchor || "start") + '" opacity="' + esc(number(style.opacity == null ? 1 : style.opacity)) + '"' + transform + '>' + esc(object.text) + '</text>';
      }

      return '<g data-object-id="' + esc(object.id) + '" data-object-type="' + esc(object.type) + '">' + svg + '</g>';
    }

    renderLabel(object, text, dx, dy, midpoint) {
      let x = object.x;
      let y = object.y;
      if (midpoint) {
        x = (object.x1 + object.x2) / 2;
        y = (object.y1 + object.y2) / 2;
      }
      return '<text x="' + esc(number(this.mapX(x) + dx)) + '" y="' + esc(number(this.mapY(y) + dy)) + '" fill="#222" font-size="14" font-family="Source Sans 3, sans-serif">' + esc(text) + '</text>';
    }
  }

  MI.SvgRenderer = SvgRenderer;
  MI.escapeXml = esc;
})(window);
