/* From Zero 2 Infinity — Mathematical Illustration SVG Renderer */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  const SVG_NS = "http://www.w3.org/2000/svg";
  const MAX_TICKS_PER_AXIS = 1000;
  const MAX_COORDINATE = 1e12;

  function validateBounds(bounds) {
    if (!bounds || ![bounds.xMin, bounds.xMax, bounds.yMin, bounds.yMax].every(value => Number.isFinite(value) && Math.abs(value) <= MAX_COORDINATE)) {
      throw new RangeError("Ongeldige viewport: coördinaten moeten eindig zijn en binnen ±1e12 liggen.");
    }
    const xSpan = bounds.xMax - bounds.xMin, ySpan = bounds.yMax - bounds.yMin;
    if (xSpan < 1e-6 || ySpan < 1e-6 || xSpan > MAX_COORDINATE || ySpan > MAX_COORDINATE) {
      throw new RangeError("Ongeldige viewport: positieve asbereiken tussen 1e-6 en 1e12 vereist.");
    }
  }

  function tickValues(min, max, step) {
    if (!Number.isFinite(step) || step <= 0) throw new RangeError("Rasterstap moet positief en eindig zijn.");
    const first = Math.ceil(min / step), last = Math.floor((max + 1e-9) / step);
    const count = Math.max(0, last - first + 1);
    if (!Number.isSafeInteger(first) || !Number.isSafeInteger(last) || count > MAX_TICKS_PER_AXIS) {
      throw new RangeError("Te veel rasterlijnen of asmarkeringen; vergroot de rasterstap.");
    }
    return Array.from({ length: count }, (_, index) => (first + index) * step);
  }

  function esc(value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
  function number(value, digits) { return Number(Number(value).toFixed(digits == null ? 6 : digits)); }
  function axisNumber(value) { const n = Number(Number(value).toFixed(1)); return Object.is(n, -0) ? 0 : n; }
  function dash(style) { return style.dash ? ' stroke-dasharray="' + esc(style.dash) + '"' : ""; }
  function strokeAttrs(style) { return ['stroke="' + esc(style.stroke) + '"','stroke-width="' + esc(number(style.strokeWidth)) + '"','stroke-linecap="round"','stroke-linejoin="round"','opacity="' + esc(number(style.opacity)) + '"',dash(style)].join(" "); }

  class SvgRenderer {
    constructor(options) {
      const opts = options || {};
      this.width = Number(opts.width == null ? 800 : opts.width); this.height = Number(opts.height == null ? 500 : opts.height);
      this.bounds = Object.assign({ xMin: -5, yMin: -3, xMax: 5, yMax: 3 }, opts.bounds || {});
      this.background = opts.background || "transparent"; this.padding = Number(opts.padding || 0);
      this.showAxes = opts.showAxes !== false; this.showGrid = opts.showGrid === true; this.axisStep = Number(opts.axisStep == null ? 1 : opts.axisStep);
      this.showXAxis = opts.showXAxis !== false; this.showYAxis = opts.showYAxis !== false;
      this.showAxisLabels = opts.showAxisLabels !== false; this.showOrigin = opts.showOrigin !== false;
      this.coordinateSystem = opts.coordinateSystem || "cartesian";
      this.preview = null; this.syncAspectRatio();
    }

    syncAspectRatio() {
      validateBounds(this.bounds);
      if (!Number.isFinite(this.width) || !Number.isFinite(this.padding) || this.padding < 0 || this.width <= this.padding * 2) throw new RangeError("Ongeldige viewportbreedte of padding.");
      if (!Number.isFinite(this.axisStep) || this.axisStep <= 0) throw new RangeError("Rasterstap moet positief en eindig zijn.");
      const b = this.bounds, xSpan = b.xMax - b.xMin, ySpan = b.yMax - b.yMin, drawableWidth = this.width - this.padding * 2;
      const height = this.padding * 2 + drawableWidth * (ySpan / xSpan);
      const scale = drawableWidth / xSpan;
      if (!Number.isFinite(height) || !Number.isFinite(scale) || height <= 0 || scale <= 0) throw new RangeError("Viewport kan niet veilig worden afgebeeld.");
      this.height = height;
    }
    setBounds(bounds) {
      validateBounds(bounds);
      const previous = this.bounds;
      this.bounds = Object.assign({}, bounds);
      try { this.syncAspectRatio(); } catch (error) { this.bounds = previous; throw error; }
    }
    scale() { return (this.width - this.padding * 2) / (this.bounds.xMax - this.bounds.xMin); }
    mapX(x) { return this.padding + (x - this.bounds.xMin) * this.scale(); }
    mapY(y) { return this.height - this.padding - (y - this.bounds.yMin) * this.scale(); }

    renderGrid() {
      if (!this.showGrid) return "";
      this.syncAspectRatio();
      const b = this.bounds, parts = [], step = this.axisStep;
      for (const x of tickValues(b.xMin, b.xMax, step)) { const sx = this.mapX(x); parts.push('<line x1="' + number(sx) + '" y1="' + this.padding + '" x2="' + number(sx) + '" y2="' + (this.height - this.padding) + '" stroke="#dfe1dd" stroke-width="0.7"/>'); }
      for (const y of tickValues(b.yMin, b.yMax, step)) { const sy = this.mapY(y); parts.push('<line x1="' + this.padding + '" y1="' + number(sy) + '" x2="' + (this.width - this.padding) + '" y2="' + number(sy) + '" stroke="#dfe1dd" stroke-width="0.7"/>'); }
      return '<g data-illustration-grid aria-hidden="true">' + parts.join("") + '</g>';
    }

    renderAxes() {
      if (!this.showAxes || this.coordinateSystem !== "cartesian") return "";
      this.syncAspectRatio();
      const b = this.bounds, parts = [], axisStroke = "#777", tickStroke = "#aaa", labelFill = "#666", x0 = this.mapX(0), y0 = this.mapY(0), step = this.axisStep;
      const canDrawX = this.showXAxis && b.yMin <= 0 && b.yMax >= 0;
      const canDrawY = this.showYAxis && b.xMin <= 0 && b.xMax >= 0;
      if (canDrawX) {
        parts.push('<line x1="' + this.mapX(b.xMin) + '" y1="' + y0 + '" x2="' + this.mapX(b.xMax) + '" y2="' + y0 + '" stroke="' + axisStroke + '" stroke-width="1.4"/>');
        for (const x of tickValues(b.xMin, b.xMax, step)) {
          if (Math.abs(x) < 1e-9) continue;
          const sx = this.mapX(x);
          parts.push('<line x1="' + sx + '" y1="' + (y0 - 4) + '" x2="' + sx + '" y2="' + (y0 + 4) + '" stroke="' + tickStroke + '" stroke-width="1"/>');
          if (this.showAxisLabels) parts.push('<text x="' + sx + '" y="' + (y0 + 18) + '" fill="' + labelFill + '" font-size="12" font-family="Source Sans 3, sans-serif" text-anchor="middle">' + esc(axisNumber(x)) + '</text>');
        }
        if (this.showAxisLabels) parts.push('<text x="' + (this.mapX(b.xMax) - 8) + '" y="' + (y0 - 8) + '" fill="' + labelFill + '" font-size="13" font-family="Source Sans 3, sans-serif" text-anchor="end">x</text>');
      }
      if (canDrawY) {
        parts.push('<line x1="' + x0 + '" y1="' + this.mapY(b.yMin) + '" x2="' + x0 + '" y2="' + this.mapY(b.yMax) + '" stroke="' + axisStroke + '" stroke-width="1.4"/>');
        for (const y of tickValues(b.yMin, b.yMax, step)) {
          if (Math.abs(y) < 1e-9) continue;
          const sy = this.mapY(y);
          parts.push('<line x1="' + (x0 - 4) + '" y1="' + sy + '" x2="' + (x0 + 4) + '" y2="' + sy + '" stroke="' + tickStroke + '" stroke-width="1"/>');
          if (this.showAxisLabels) parts.push('<text x="' + (x0 - 8) + '" y="' + (sy + 4) + '" fill="' + labelFill + '" font-size="12" font-family="Source Sans 3, sans-serif" text-anchor="end">' + esc(axisNumber(y)) + '</text>');
        }
        if (this.showAxisLabels) parts.push('<text x="' + (x0 + 8) + '" y="' + (this.mapY(b.yMax) + 12) + '" fill="' + labelFill + '" font-size="13" font-family="Source Sans 3, sans-serif">y</text>');
      }
      if (this.showOrigin && (canDrawX || canDrawY)) {
        parts.push('<text x="' + (x0 + 7) + '" y="' + (y0 + 16) + '" fill="' + labelFill + '" font-size="11" font-family="Source Sans 3, sans-serif">0</text>');
      }
      return '<g data-illustration-axes aria-hidden="true">' + parts.join("") + '</g>';
    }

    renderPreview() {
      const preview = this.preview; if (!preview) return "";
      if(preview.type==='angle' && preview.vertices.length===3) { try { MI.MeasurementGeometry.validateAngle(preview.vertices,preview.angleMark); return '<g data-drawing-preview>'+this.renderObject({type:'angle',angleMark:preview.angleMark,vertices:preview.vertices,id:'preview',style:{stroke:'#9a7a32',strokeWidth:2,opacity:1,dash:'7 5'}})+'</g>'; } catch(_) {} }
      if (preview.type === "polygon" || preview.type==='angle') return '<g data-drawing-preview><polyline points="'+preview.vertices.map(p=>this.mapX(p.x)+','+this.mapY(p.y)).join(' ')+'" fill="none" stroke="#9a7a32" stroke-width="2" stroke-dasharray="7 5"/>'+this.renderPolygonMeasurements(preview)+preview.vertices.map(p=>'<circle cx="'+this.mapX(p.x)+'" cy="'+this.mapY(p.y)+'" r="4" fill="#9a7a32"/>').join('')+'</g>';
      const sx = this.mapX(preview.start.x), sy = this.mapY(preview.start.y), ex = this.mapX(preview.end.x), ey = this.mapY(preview.end.y), dx = preview.end.x - preview.start.x, dy = preview.end.y - preview.start.y, length = Math.hypot(dx, dy);
      if(preview.type==='dimension') return '<g data-drawing-preview>'+this.renderObject({type:'dimension',id:'preview',name:'',x1:preview.start.x,y1:preview.start.y,x2:preview.end.x,y2:preview.end.y,style:{stroke:'#9a7a32',strokeWidth:2,opacity:1,dash:'7 5',fill:'none'}})+'</g>';
      if (length < 1e-9) return "";
      const mx = (sx + ex) / 2, my = (sy + ey) / 2 - 10, label = esc(axisNumber(length));
      if (["straight", "ray", "vector"].includes(preview.type)) return '<g data-drawing-preview>' + this.renderDirected({ type: preview.type, x1: preview.start.x, y1: preview.start.y, x2: preview.end.x, y2: preview.end.y, style: { stroke: "#9a7a32", strokeWidth: 2, opacity: 1, dash: "7 5" } }) + '<text x="' + mx + '" y="' + my + '" fill="#6f5925" font-size="12">' + label + '</text></g>';
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

    renderLabel(object, label, defaultDx, defaultDy, line) {
      let x, y;
      if (line) { x = this.mapX((object.x1 + object.x2) / 2); y = this.mapY((object.y1 + object.y2) / 2); }
      else if (object.type === "circle") { x = this.mapX(object.cx); y = this.mapY(object.cy); }
      else { x = this.mapX(object.x); y = this.mapY(object.y); }
      const style = object.style || {};
      const labelColor = style.stroke && style.stroke !== "none" ? style.stroke : (style.fill || "#222");
      const scale = this.scale();
      const legacyDx = Number.isFinite(Number(object.labelDx)) ? Number(object.labelDx) : defaultDx;
      const legacyDy = Number.isFinite(Number(object.labelDy)) ? Number(object.labelDy) : defaultDy;
      const dx = object.labelOffsetX != null && Number.isFinite(Number(object.labelOffsetX)) ? Number(object.labelOffsetX) * scale : legacyDx;
      const dy = object.labelOffsetY != null && Number.isFinite(Number(object.labelOffsetY)) ? -Number(object.labelOffsetY) * scale : legacyDy;
      return '<text class="object-label" data-label-id="' + esc(object.id) + '" x="' + number(x + dx) + '" y="' + number(y + dy) + '" fill="' + esc(labelColor) + '" font-size="14" font-family="Source Sans 3, sans-serif">' + esc(label) + '</text>';
    }

    renderDirected(object) {
      const clipped = global.FZI.MathIllustration.LinearGeometry.clip(object, this.bounds); if (!clipped) return '';
      const style = object.style || {}, sx = this.mapX(clipped.start.x), sy = this.mapY(clipped.start.y), ex = this.mapX(clipped.end.x), ey = this.mapY(clipped.end.y);
      const dx = ex - sx, dy = ey - sy, length = Math.hypot(dx, dy);
      if (!length) return '<circle cx="' + number(sx) + '" cy="' + number(sy) + '" r="3" ' + strokeAttrs(style) + ' fill="' + esc(style.stroke) + '"/>';
      const ux = dx / length, uy = dy / length;
      const head = Math.min(10, length * .7), wing = head * .4;
      const arrow = (x, y, direction) => '<path data-direction-arrow d="M ' + number(x) + ' ' + number(y) + ' L ' + number(x - direction * ux * head - uy * wing) + ' ' + number(y - direction * uy * head + ux * wing) + ' L ' + number(x - direction * ux * head + uy * wing) + ' ' + number(y - direction * uy * head - ux * wing) + ' Z" fill="' + esc(style.stroke) + '" opacity="' + esc(style.opacity) + '"/>';
      let svg = '<line x1="' + number(sx) + '" y1="' + number(sy) + '" x2="' + number(ex) + '" y2="' + number(ey) + '" ' + strokeAttrs(style) + ' fill="none"/>';
      if (object.type === 'straight') svg += arrow(sx, sy, -1);
      if (object.type !== 'vector' || Math.abs(clipped.high - 1) < 1e-12) svg += arrow(ex, ey, 1);
      return svg;
    }

    renderObject(object) {
      if (object.visible === false) return "";
      const opacity=object.style && object.style.opacity != null ? object.style.opacity : 1;
      const style = {...(object.style || {}),opacity:1}; let svg = "";
      if (object.type === "point") {
        svg = '<circle cx="' + number(this.mapX(object.x)) + '" cy="' + number(this.mapY(object.y)) + '" r="' + number(style.radius || 4) + '" ' + strokeAttrs(style) + ' fill="' + esc(style.fill || style.stroke) + '"/>';
        if (object.showLabel) svg += this.renderLabel(object, object.name || object.label || object.id, 8, -8);
      }
      if (object.type === "line" || object.type==='dimension') {
        svg = '<line x1="' + number(this.mapX(object.x1)) + '" y1="' + number(this.mapY(object.y1)) + '" x2="' + number(this.mapX(object.x2)) + '" y2="' + number(this.mapY(object.y2)) + '" ' + strokeAttrs(style) + ' fill="none"/>';
        if (object.showLabel) svg += this.renderLabel(object, object.name || object.label || object.id, 6, -6, true);
      }
      if (['straight', 'ray', 'vector'].includes(object.type)) {
        svg = this.renderDirected({...object,style});
        if (svg && object.showLabel) svg += this.renderLabel(object, object.name || object.id, 6, -6, true);
      }
      if (object.type === "circle") {
        const cx = this.mapX(object.cx), cy = this.mapY(object.cy), r = object.r * this.scale();
        svg = '<circle cx="' + number(cx) + '" cy="' + number(cy) + '" r="' + number(r) + '" ' + strokeAttrs(style) + ' fill="' + esc(style.fill || "none") + '"/>';
        svg += '<circle cx="' + number(cx) + '" cy="' + number(cy) + '" r="3.2" fill="#222" stroke="#fff" stroke-width="1.2"/>';
        if (object.showLabel) svg += this.renderLabel(object, object.name || object.label || object.id, 8, -8);
      }
      if (object.type === "polygon") {
        svg = '<polygon points="'+object.vertices.map(p=>number(this.mapX(p.x))+','+number(this.mapY(p.y))).join(' ')+'" fill="'+esc(style.fill)+'" '+strokeAttrs(style)+'/>';
        if (object.showLabel) { const anchor=MI.PolygonGeometry.anchor(object); svg += this.renderLabel({...object,...anchor},object.name || object.id,8,-8); }
      }
      if(object.type==='angle') {
        svg=MI.MeasurementGeometry.edges(object).map(edge=>'<line x1="'+number(this.mapX(edge.x1))+'" y1="'+number(this.mapY(edge.y1))+'" x2="'+number(this.mapX(edge.x2))+'" y2="'+number(this.mapY(edge.y2))+'" '+strokeAttrs(style)+'/>').join('');
      }
      if (object.type === "text") {
        const transform = object.rotation ? ' transform="rotate(' + number(object.rotation) + ' ' + number(this.mapX(object.x)) + ' ' + number(this.mapY(object.y)) + ')"' : "";
        svg = '<text x="' + number(this.mapX(object.x)) + '" y="' + number(this.mapY(object.y)) + '" fill="' + esc(style.fill || style.stroke || "#222") + '" font-size="' + number(style.fontSize || 16) + '" font-family="' + esc(style.fontFamily || "Source Sans 3, sans-serif") + '" text-anchor="' + esc(style.anchor || "start") + '"' + transform + '>' + esc(object.text) + '</text>';
        if (object.showLabel) svg += this.renderLabel(object, object.name || object.id, 6, -6);
      }
      if(object.measurementLabelOnly && ['dimension','angle'].includes(object.type)) svg='';
      if(object.type==='angle'||object.type==='dimension'||(object.showMeasurement && (MI.LinearGeometry.isLinear(object)||object.type==='circle'))) svg+=this.renderMeasurement({...object,style});
      return '<g data-object-id="' + esc(object.id) + '" data-object-type="' + esc(object.type) + '" aria-label="' + esc(object.name || object.id) + '"'+(opacity!==1?' opacity="'+esc(number(opacity))+'"':'')+'>' + svg + '</g>';
    }
    renderPolygonMeasurements(preview) {
      if(!preview.showMeasurements || preview.vertices.length<2)return '';
      const points=preview.vertices,a=points[points.length-2],b=points[points.length-1];
      const text=(attribute,x,y,label)=>'<text '+attribute+' x="'+number(this.mapX(x))+'" y="'+number(this.mapY(y)-10)+'" fill="#6f5925" font-size="12" text-anchor="middle">'+esc(label)+'</text>';
      let svg=text('data-preview-length',(a.x+b.x)/2,(a.y+b.y)/2,Number(Math.hypot(b.x-a.x,b.y-a.y).toFixed(2)));
      if(points.length>=3 && Math.hypot(b.x-a.x,b.y-a.y)>1e-9) {
        const c=points[points.length-3];if(Math.hypot(c.x-a.x,c.y-a.y)>1e-9)svg+=text('data-preview-angle',a.x,a.y,MI.MeasurementGeometry.label({type:'angle',vertices:[c,a,b]}));
      }
      return svg;
    }
    renderMeasurement(object) {
      const style=object.style||{},label=MI.MeasurementGeometry.label(object);let svg='',anchor;
      if(object.type==='angle') {
        const [a,v,b]=object.vertices,map=p=>({x:this.mapX(p.x),y:this.mapY(p.y)}),c=map(v),pa=map(a),pb=map(b),la=Math.hypot(pa.x-c.x,pa.y-c.y),lb=Math.hypot(pb.x-c.x,pb.y-c.y);
        const ua={x:(pa.x-c.x)/la,y:(pa.y-c.y)/la},ub={x:(pb.x-c.x)/lb,y:(pb.y-c.y)/lb},r=Math.min(28,la*.35,lb*.35);
        const p={x:c.x+ua.x*r,y:c.y+ua.y*r},q={x:c.x+ub.x*r,y:c.y+ub.y*r};
        const path=object.angleMark==='right'?'M '+number(p.x)+' '+number(p.y)+' L '+number(p.x+ub.x*r)+' '+number(p.y+ub.y*r)+' L '+number(q.x)+' '+number(q.y):'M '+number(p.x)+' '+number(p.y)+' A '+number(r)+' '+number(r)+' 0 0 '+(ua.x*ub.y-ua.y*ub.x>=0?1:0)+' '+number(q.x)+' '+number(q.y);
        svg='<path '+(object.angleMark==='right'?'data-right-angle':'data-angle-arc')+' d="'+path+'" fill="none" '+strokeAttrs(style)+'/>';
        let ux=ua.x+ub.x,uy=ua.y+ub.y,l=Math.hypot(ux,uy);if(l<1e-9){ux=-ua.y;uy=ua.x;l=1;}
        anchor={x:v.x+ux/l*(r+16)/this.scale(),y:v.y-uy/l*(r+16)/this.scale()};
      } else if(object.type==='circle') anchor={x:object.cx+object.r,y:object.cy};
      else {
        anchor={x:(object.x1+object.x2)/2,y:(object.y1+object.y2)/2};
        if(object.type==='dimension') {const dx=this.mapX(object.x2)-this.mapX(object.x1),dy=this.mapY(object.y2)-this.mapY(object.y1),l=Math.hypot(dx,dy)||1;
          for(const [x,y] of [[this.mapX(object.x1),this.mapY(object.y1)],[this.mapX(object.x2),this.mapY(object.y2)]]) svg+='<line data-dimension-tick x1="'+number(x-dy/l*6)+'" y1="'+number(y+dx/l*6)+'" x2="'+number(x+dy/l*6)+'" y2="'+number(y-dx/l*6)+'" '+strokeAttrs(style)+'/>';
        }
      }
      return (object.measurementLabelOnly?'':svg)+'<g data-measurement-label>'+this.renderLabel({...object,...anchor,type:'text'},label,6,-6)+'</g>';
    }
  }

  MI.SvgRenderer = SvgRenderer;
  MI.escapeXml = esc;
})(window);
