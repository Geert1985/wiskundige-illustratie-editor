/* From Zero 2 Infinity — geometric snapping and line endpoint handles */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  if (!MI.Engine || MI.Engine.prototype.__fziGeometrySnapInstalled) return;

  let activeEngine = null;
  let endpointDrag = null;

  function toleranceInMathUnits(engine) {
    const scale = engine && engine.renderer && engine.renderer.scale ? engine.renderer.scale() : 1;
    return 12 / Math.max(scale, 1e-9);
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function addCandidate(list, x, y, kind, ids) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    list.push({ x, y, kind, ids: ids || [] });
  }

  function segmentIntersection(a, b, c, d) {
    const r = { x: b.x - a.x, y: b.y - a.y };
    const s = { x: d.x - c.x, y: d.y - c.y };
    const cross = r.x * s.y - r.y * s.x;
    if (Math.abs(cross) < 1e-10) return null;
    const q = { x: c.x - a.x, y: c.y - a.y };
    const t = (q.x * s.y - q.y * s.x) / cross;
    const u = (q.x * r.y - q.y * r.x) / cross;
    if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) return null;
    return { x: a.x + t * r.x, y: a.y + t * r.y };
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
    const ts = [( -bb - root) / (2 * aa), ( -bb + root) / (2 * aa)];
    const result = [];
    ts.forEach(function (t) {
      if (t < -1e-9 || t > 1 + 1e-9) return;
      const p = { x: line.x1 + t * dx, y: line.y1 + t * dy };
      if (!result.some(function (q) { return distance(p, q) < 1e-8; })) result.push(p);
    });
    return result;
  }

  function snapCandidates(engine, excludeId) {
    const objects = engine.model.objects.filter(function (o) {
      return o.visible !== false && o.id !== excludeId;
    });
    const candidates = [];

    objects.forEach(function (o) {
      if (o.type === "point") addCandidate(candidates, o.x, o.y, "point", [o.id]);
      if (o.type === "line") {
        addCandidate(candidates, o.x1, o.y1, "line-endpoint", [o.id]);
        addCandidate(candidates, o.x2, o.y2, "line-endpoint", [o.id]);
      }
      if (o.type === "circle") addCandidate(candidates, o.cx, o.cy, "circle-center", [o.id]);
    });

    for (let i = 0; i < objects.length; i += 1) {
      for (let j = i + 1; j < objects.length; j += 1) {
        const a = objects[i], b = objects[j];
        if (a.type === "line" && b.type === "line") {
          const p = segmentIntersection(
            { x: a.x1, y: a.y1 }, { x: a.x2, y: a.y2 },
            { x: b.x1, y: b.y1 }, { x: b.x2, y: b.y2 }
          );
          if (p) addCandidate(candidates, p.x, p.y, "line-line-intersection", [a.id, b.id]);
        }
        if (a.type === "circle" && b.type === "circle") {
          circleCircleIntersections(a, b).forEach(function (p) {
            addCandidate(candidates, p.x, p.y, "circle-circle-intersection", [a.id, b.id]);
          });
        }
        if (a.type === "line" && b.type === "circle") {
          lineCircleIntersections(a, b).forEach(function (p) {
            addCandidate(candidates, p.x, p.y, "line-circle-intersection", [a.id, b.id]);
          });
        }
        if (a.type === "circle" && b.type === "line") {
          lineCircleIntersections(b, a).forEach(function (p) {
            addCandidate(candidates, p.x, p.y, "line-circle-intersection", [a.id, b.id]);
          });
        }
      }
    }

    return candidates;
  }

  MI.getSnapCandidates = function (engine, excludeId) {
    return snapCandidates(engine, excludeId);
  };

  MI.snapPoint = function (engine, point, excludeId) {
    if (!engine || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return { x: point && point.x, y: point && point.y, snapped: false, object: null, kind: null };
    }
    const tolerance = toleranceInMathUnits(engine);
    let best = null;
    let bestDistance = Infinity;
    snapCandidates(engine, excludeId).forEach(function (candidate) {
      const d = distance(point, candidate);
      if (d <= tolerance && d < bestDistance) {
        best = candidate;
        bestDistance = d;
      }
    });
    return best
      ? { x: best.x, y: best.y, snapped: true, object: null, kind: best.kind, ids: best.ids }
      : { x: point.x, y: point.y, snapped: false, object: null, kind: null, ids: [] };
  };

  const originalAdd = MI.Engine.prototype.add;
  const originalUpdate = MI.Engine.prototype.update;
  const originalRenderSVG = MI.Engine.prototype.renderSVG;

  MI.Engine.prototype.renderSVG = function () {
    activeEngine = this;
    return originalRenderSVG.apply(this, arguments);
  };

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
      if (object.type === "line") {
        if (Number.isFinite(next.x1) && Number.isFinite(next.y1)) {
          const p = MI.snapPoint(this, { x: next.x1, y: next.y1 }, id);
          next.x1 = p.x; next.y1 = p.y;
        }
        if (Number.isFinite(next.x2) && Number.isFinite(next.y2)) {
          const p = MI.snapPoint(this, { x: next.x2, y: next.y2 }, id);
          next.x2 = p.x; next.y2 = p.y;
        }
      }
    }
    return originalUpdate.call(this, id, next);
  };

  function eventToMath(event, engine) {
    const svg = document.querySelector("#canvas svg");
    if (!svg || !engine) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const r = engine.renderer, b = r.bounds, scale = r.scale();
    return { x: b.xMin + (p.x - r.padding) / scale, y: b.yMin + (r.height - r.padding - p.y) / scale };
  }

  function mathToSvg(point, engine) {
    const r = engine.renderer;
    return { x: r.mapX(point.x), y: r.mapY(point.y) };
  }

  function svgToScreen(point) {
    const svg = document.querySelector("#canvas svg");
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(point.x, point.y).matrixTransform(matrix);
  }

  function removeEndpointHandles() {
    document.querySelectorAll("#canvas .fzi-line-endpoint-layer").forEach(function (node) { node.remove(); });
  }

  function refreshEndpointHandles() {
    removeEndpointHandles();
    const svg = document.querySelector("#canvas svg");
    if (!svg || !activeEngine) return;
    const selected = svg.querySelector("g.selected[data-object-type=\"line\"]");
    if (!selected) return;
    const id = selected.getAttribute("data-object-id");
    const line = activeEngine.get(id);
    if (!line || line.type !== "line") return;

    const layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layer.setAttribute("class", "fzi-line-endpoint-layer");
    layer.setAttribute("aria-hidden", "true");
    [["x1", "y1", "start"], ["x2", "y2", "end"]].forEach(function (entry) {
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const p = mathToSvg({ x: line[entry[0]], y: line[entry[1]] }, activeEngine);
      handle.setAttribute("cx", p.x);
      handle.setAttribute("cy", p.y);
      handle.setAttribute("r", "7");
      handle.setAttribute("class", "fzi-line-endpoint");
      handle.setAttribute("data-line-id", line.id);
      handle.setAttribute("data-endpoint", entry[2]);
      handle.setAttribute("fill", "#fff");
      handle.setAttribute("stroke", "currentColor");
      handle.setAttribute("stroke-width", "2");
      handle.style.cursor = "crosshair";
      handle.style.pointerEvents = "all";
      layer.appendChild(handle);
    });
    svg.appendChild(layer);
  }

  function setHandlePosition(line, endpoint, point) {
    const svg = document.querySelector("#canvas svg");
    if (!svg) return;
    const handle = svg.querySelector('.fzi-line-endpoint[data-line-id="' + CSS.escape(line.id) + '"][data-endpoint="' + endpoint + '"]');
    if (!handle) return;
    const p = mathToSvg(point, activeEngine);
    handle.setAttribute("cx", p.x);
    handle.setAttribute("cy", p.y);
    const lineNode = svg.querySelector('g[data-object-id="' + CSS.escape(line.id) + '"] > line');
    if (!lineNode) return;
    if (endpoint === "start") {
      lineNode.setAttribute("x1", p.x);
      lineNode.setAttribute("y1", p.y);
    } else {
      lineNode.setAttribute("x2", p.x);
      lineNode.setAttribute("y2", p.y);
    }
  }

  function beginEndpointDrag(event, handle) {
    if (!activeEngine) return;
    const line = activeEngine.get(handle.getAttribute("data-line-id"));
    if (!line) return;
    endpointDrag = {
      lineId: line.id,
      endpoint: handle.getAttribute("data-endpoint"),
      original: {
        x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2
      }
    };
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.target.setPointerCapture) {
      try { event.target.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
    }
  }

  function moveEndpointDrag(event) {
    if (!endpointDrag || !activeEngine) return;
    const line = activeEngine.get(endpointDrag.lineId);
    if (!line) return;
    const mouse = eventToMath(event, activeEngine);
    if (!mouse) return;
    const snap = MI.snapPoint(activeEngine, mouse, line.id);
    const point = { x: snap.x, y: snap.y };
    if (endpointDrag.endpoint === "start") {
      line.x1 = point.x; line.y1 = point.y;
    } else {
      line.x2 = point.x; line.y2 = point.y;
    }
    setHandlePosition(line, endpointDrag.endpoint, point);
    const crosshair = document.getElementById("crosshair");
    if (crosshair) {
      const screen = svgToScreen(mathToSvg(point, activeEngine));
      const wrap = document.getElementById("canvasWrap");
      if (screen && wrap) {
        const rect = wrap.getBoundingClientRect();
        crosshair.style.left = (screen.x - rect.left) + "px";
        crosshair.style.top = (screen.y - rect.top) + "px";
        crosshair.classList.toggle("snapped", snap.snapped);
      }
    }
  }

  function endEndpointDrag() {
    if (!endpointDrag || !activeEngine) return;
    const line = activeEngine.get(endpointDrag.lineId);
    if (line) {
      const patch = { x1: line.x1, y1: line.y1, x2: line.x2, y2: line.y2 };
      const id = line.id;
      endpointDrag = null;
      activeEngine.update(id, patch);
      const selectedId = id;
      setTimeout(function () {
        const svg = document.querySelector("#canvas svg");
        if (svg) {
          const group = svg.querySelector('g[data-object-id="' + CSS.escape(selectedId) + '"]');
          if (group) group.classList.add("selected");
        }
        refreshEndpointHandles();
      }, 0);
      return;
    }
    endpointDrag = null;
  }

  /* Endpoint handles are deliberately implemented as a small interaction layer:
     the normal editor keeps ownership of selecting and moving whole objects. */
  const canvas = document.getElementById("canvas");
  if (canvas) {
    canvas.addEventListener("pointerdown", function (event) {
      const handle = event.target.closest ? event.target.closest(".fzi-line-endpoint") : null;
      if (handle) beginEndpointDrag(event, handle);
    }, true);

    canvas.addEventListener("click", function () {
      setTimeout(refreshEndpointHandles, 0);
    });
  }

  window.addEventListener("pointermove", function (event) {
    if (endpointDrag) {
      moveEndpointDrag(event);
      return;
    }
    if (!activeEngine) return;
    const toolButton = document.querySelector(".tool.active");
    if (toolButton && toolButton.dataset.tool !== "select") {
      const mouse = eventToMath(event, activeEngine);
      if (!mouse) return;
      const snap = MI.snapPoint(activeEngine, mouse, null);
      const crosshair = document.getElementById("crosshair");
      const wrap = document.getElementById("canvasWrap");
      if (crosshair && wrap && snap.snapped) {
        const screen = svgToScreen(mathToSvg({ x: snap.x, y: snap.y }, activeEngine));
        const rect = wrap.getBoundingClientRect();
        if (screen) {
          crosshair.style.left = (screen.x - rect.left) + "px";
          crosshair.style.top = (screen.y - rect.top) + "px";
          crosshair.classList.add("snapped");
        }
      }
    }
  });

  window.addEventListener("pointerup", function () {
    if (endpointDrag) endEndpointDrag();
  }, true);

  document.addEventListener("click", function () {
    setTimeout(refreshEndpointHandles, 0);
  });

  MI.Engine.prototype.__fziGeometrySnapInstalled = true;
})(window);