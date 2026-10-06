/* From Zero 2 Infinity — visual snap feedback */
(function (global) {
  "use strict";

  const MI = global.FZI && global.FZI.MathIllustration;
  if (!MI || !MI.Engine || MI.Engine.prototype.__fziVisualSnapInstalled) return;

  let activeEngine = null;
  let drawStart = null;
  const previousRenderSVG = MI.Engine.prototype.renderSVG;
  const previousAdd = MI.Engine.prototype.add;

  MI.Engine.prototype.__fziVisualSnapInstalled = true;
  MI.Engine.prototype.renderSVG = function () {
    activeEngine = this;
    return previousRenderSVG.apply(this, arguments);
  };

  function eventToMath(event, engine) {
    const svg = document.querySelector("#canvas svg");
    if (!svg || !engine) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const r = engine.renderer;
    return {
      x: r.bounds.xMin + (p.x - r.padding) / r.scale(),
      y: r.bounds.yMin + (r.height - r.padding - p.y) / r.scale()
    };
  }

  function screenPosition(point, engine) {
    const svg = document.querySelector("#canvas svg");
    const wrap = document.getElementById("canvasWrap");
    if (!svg || !wrap || !engine) return null;
    const r = engine.renderer;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(r.mapX(point.x), r.mapY(point.y)).matrixTransform(matrix);
    const rect = wrap.getBoundingClientRect();
    return { x: p.x - rect.left, y: p.y - rect.top };
  }

  function gridSnap(engine, point) {
    if (!engine.renderer.showGrid) return null;
    const step = Number(engine.renderer.axisStep) || 1;
    const gx = Math.round(point.x / step) * step;
    const gy = Math.round(point.y / step) * step;
    const tolerance = Math.max(10 / engine.renderer.scale(), step * 0.08);
    if (Math.hypot(point.x - gx, point.y - gy) <= tolerance) {
      return { x: gx, y: gy, snapped: true, grid: true, kind: "grid" };
    }
    return null;
  }

  function bestSnap(engine, point, excludeId) {
    const geometric = MI.snapPoint ? MI.snapPoint(engine, point, excludeId) : null;
    if (geometric && geometric.snapped) {
      return { x: geometric.x, y: geometric.y, snapped: true, grid: false, kind: geometric.kind };
    }
    return gridSnap(engine, point) || { x: point.x, y: point.y, snapped: false, grid: false, kind: null };
  }

  function showCrosshair(event, snap) {
    const crosshair = document.getElementById("crosshair");
    const wrap = document.getElementById("canvasWrap");
    if (!crosshair || !wrap || !activeEngine) return;
    const screen = snap && snap.snapped ? screenPosition(snap, activeEngine) : null;
    const rect = wrap.getBoundingClientRect();
    crosshair.style.left = (screen ? screen.x : event.clientX - rect.left) + "px";
    crosshair.style.top = (screen ? screen.y : event.clientY - rect.top) + "px";
    crosshair.classList.toggle("snapped", Boolean(snap && snap.snapped));
    crosshair.hidden = false;
  }

  function updatePreview(point) {
    if (!activeEngine || !activeEngine.renderer.preview || !drawStart) return;
    activeEngine.renderer.preview.end = point;
    const svg = document.querySelector("#canvas svg");
    const preview = svg && svg.querySelector("[data-drawing-preview]");
    if (!preview) return;
    const line = preview.querySelector("line");
    const circles = preview.querySelectorAll("circle");
    const sx = activeEngine.renderer.mapX(activeEngine.renderer.preview.start.x);
    const sy = activeEngine.renderer.mapY(activeEngine.renderer.preview.start.y);
    const ex = activeEngine.renderer.mapX(point.x);
    const ey = activeEngine.renderer.mapY(point.y);
    if (line) {
      line.setAttribute("x2", ex);
      line.setAttribute("y2", ey);
    }
    if (circles.length >= 2) {
      circles[1].setAttribute("cx", ex);
      circles[1].setAttribute("cy", ey);
    }
    if (activeEngine.renderer.preview.type === "circle") {
      const circle = circles[0];
      if (circle) circle.setAttribute("r", Math.hypot(ex - sx, ey - sy));
    }
  }

  function finalSnap(engine, point) {
    return bestSnap(engine, point, null);
  }

  MI.Engine.prototype.add = function (object) {
    const next = JSON.parse(JSON.stringify(object));
    if (next.type === "line") {
      let snap = finalSnap(this, { x: next.x1, y: next.y1 });
      if (snap.snapped) { next.x1 = snap.x; next.y1 = snap.y; }
      snap = finalSnap(this, { x: next.x2, y: next.y2 });
      if (snap.snapped) { next.x2 = snap.x; next.y2 = snap.y; }
    }
    if (next.type === "point" || next.type === "text") {
      const snap = finalSnap(this, { x: next.x, y: next.y });
      if (snap.snapped) { next.x = snap.x; next.y = snap.y; }
    }
    if (next.type === "circle") {
      const snap = finalSnap(this, { x: next.cx, y: next.cy });
      if (snap.snapped) { next.cx = snap.x; next.cy = snap.y; }
    }
    return previousAdd.call(this, next);
  };

  const canvasWrap = document.getElementById("canvasWrap");
  if (!canvasWrap) return;

  canvasWrap.addEventListener("mousedown", function () {
    const button = document.querySelector(".tool.active");
    if (!button || (button.dataset.tool !== "line" && button.dataset.tool !== "circle")) return;
    setTimeout(function () {
      if (activeEngine && activeEngine.renderer.preview) {
        drawStart = { ...activeEngine.renderer.preview.start };
      }
    }, 0);
  });

  global.addEventListener("mousemove", function (event) {
    if (!activeEngine || !drawStart || !activeEngine.renderer.preview) return;
    const button = document.querySelector(".tool.active");
    if (!button || (button.dataset.tool !== "line" && button.dataset.tool !== "circle")) return;
    const mouse = eventToMath(event, activeEngine);
    if (!mouse) return;
    const snap = bestSnap(activeEngine, mouse, null);
    updatePreview(snap);
    showCrosshair(event, snap);
  });

  global.addEventListener("mouseup", function () {
    drawStart = null;
  });
})(window);
