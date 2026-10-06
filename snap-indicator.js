/* From Zero 2 Infinity — visual geometric and grid snap feedback */
(function (global) {
  "use strict";

  const MI = global.FZI && global.FZI.MathIllustration;
  if (!MI || !MI.Engine || MI.Engine.prototype.__fziSnapIndicatorInstalled) return;

  let activeEngine = null;
  let drawStart = null;
  const originalRenderSVG = MI.Engine.prototype.renderSVG;
  const originalAdd = MI.Engine.prototype.add;
  const originalUpdate = MI.Engine.prototype.update;

  function eventToMath(event, engine) {
    const svg = document.querySelector("#canvas svg");
    if (!svg || !engine) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const r = engine.renderer;
    return { x: r.bounds.xMin + (p.x - r.padding) / r.scale(), y: r.bounds.yMin + (r.height - r.padding - p.y) / r.scale() };
  }

  function gridSnap(engine, point) {
    if (!engine.renderer.showGrid) return null;
    const step = Number(engine.renderer.axisStep) || 1;
    const gx = Math.round(point.x / step) * step;
    const gy = Math.round(point.y / step) * step;
    const tolerance = 12 / Math.max(engine.renderer.scale(), 1e-9);
    return Math.hypot(point.x - gx, point.y - gy) <= tolerance
      ? { x: gx, y: gy, snapped: true, grid: true, kind: "grid" }
      : null;
  }

  function bestSnap(engine, point, excludeId) {
    const geometric = MI.snapPoint ? MI.snapPoint(engine, point, excludeId) : null;
    if (geometric && geometric.snapped) return { x: geometric.x, y: geometric.y, snapped: true, grid: false, kind: geometric.kind };
    return gridSnap(engine, point) || { x: point.x, y: point.y, snapped: false, grid: false, kind: null };
  }

  function screenPosition(point, engine) {
    const svg = document.querySelector("#canvas svg");
    const wrap = document.getElementById("canvasWrap");
    if (!svg || !wrap || !engine) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(engine.renderer.mapX(point.x), engine.renderer.mapY(point.y)).matrixTransform(matrix);
    const rect = wrap.getBoundingClientRect();
    return { x: p.x - rect.left, y: p.y - rect.top };
  }

  function updateCrosshair(event, snap) {
    const crosshair = document.getElementById("crosshair");
    const wrap = document.getElementById("canvasWrap");
    if (!crosshair || !wrap || !activeEngine) return;
    const rect = wrap.getBoundingClientRect();
    const screen = snap && snap.snapped ? screenPosition(snap, activeEngine) : null;
    crosshair.style.left = (screen ? screen.x : event.clientX - rect.left) + "px";
    crosshair.style.top = (screen ? screen.y : event.clientY - rect.top) + "px";
    crosshair.classList.toggle("snapped", Boolean(snap && snap.snapped));
    crosshair.hidden = false;
  }

  function updatePreview(snap) {
    if (!activeEngine || !activeEngine.renderer.preview || !drawStart) return;
    activeEngine.renderer.preview.end = { x: snap.x, y: snap.y };
    const svg = document.querySelector("#canvas svg");
    const preview = svg && svg.querySelector("[data-drawing-preview]");
    if (!preview) return;
    const start = activeEngine.renderer.preview.start;
    const sx = activeEngine.renderer.mapX(start.x), sy = activeEngine.renderer.mapY(start.y);
    const ex = activeEngine.renderer.mapX(snap.x), ey = activeEngine.renderer.mapY(snap.y);
    const line = preview.querySelector("line");
    if (line) { line.setAttribute("x2", ex); line.setAttribute("y2", ey); }
    const circles = preview.querySelectorAll("circle");
    if (circles.length >= 2) { circles[1].setAttribute("cx", ex); circles[1].setAttribute("cy", ey); }
    if (activeEngine.renderer.preview.type === "circle" && circles[0]) {
      circles[0].setAttribute("cx", sx); circles[0].setAttribute("cy", sy);
      circles[0].setAttribute("r", Math.hypot(ex - sx, ey - sy));
    }
  }

  function removeIndicator() {
    document.querySelectorAll("#canvas .fzi-snap-indicator").forEach(function (node) { node.remove(); });
  }

  function showIndicator(event) {
    if (!activeEngine || activeEngine.renderer.showSnapPoints === false) { removeIndicator(); return; }
    const toolButton = document.querySelector(".tool.active");
    if (!toolButton) { removeIndicator(); return; }
    const toolName = toolButton.dataset.tool;
    const canvasWrap = document.getElementById("canvasWrap");
    const movingObject = toolName === "select" && canvasWrap?.dataset.snapDragging === "true";
    if (toolName === "select" && !movingObject) { removeIndicator(); return; }
    if (toolName !== "select" && toolName !== "line" && toolName !== "circle" && toolName !== "point" && toolName !== "text") { removeIndicator(); return; }

    const mouse = eventToMath(event, activeEngine);
    const svg = document.querySelector("#canvas svg");
    if (!mouse || !svg) return;
    const excludeId = movingObject ? canvasWrap.dataset.snapExcludeId || null : null;
    const snap = bestSnap(activeEngine, mouse, excludeId);
    removeIndicator();
    if (!snap.snapped) {
      if (activeEngine.renderer.preview && drawStart) updateCrosshair(event, snap);
      return;
    }

    const p = { x: activeEngine.renderer.mapX(snap.x), y: activeEngine.renderer.mapY(snap.y) };
    const layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layer.setAttribute("class", "fzi-snap-indicator");
    layer.setAttribute("pointer-events", "none");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", "8");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#2563eb");
    circle.setAttribute("stroke-width", "4");
    layer.appendChild(circle);
    svg.appendChild(layer);
    updateCrosshair(event, snap);
    if (activeEngine.renderer.preview && drawStart) updatePreview(snap);
  }

  function installViewToggle() {
    const viewList = document.getElementById("viewList");
    if (!viewList || viewList.querySelector("[data-view='snapPoints']")) return;
    const raster = viewList.querySelector("[data-view='grid']");
    if (!raster) return;
    const row = document.createElement("div");
    row.className = "view-row";
    row.innerHTML = '<button class="view-name view-system-btn" type="button">Snappunten</button><button class="eye-btn" type="button" data-view="snapPoints" aria-label="Snappunten zichtbaar"></button>';
    const button = row.querySelector("[data-view='snapPoints']");
    const updateButton = function () {
      const visible = !activeEngine || activeEngine.renderer.showSnapPoints !== false;
      button.innerHTML = visible
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M9.9 5.9C10.6 5.7 11.3 5.6 12 5.6c6.5 0 10 6.4 10 6.4-.8 1.2-1.8 2.4-3.1 3.4M6.1 6.1C3.5 7.7 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    };
    button.addEventListener("click", function () {
      if (!activeEngine) return;
      activeEngine.renderer.showSnapPoints = activeEngine.renderer.showSnapPoints === false;
      updateButton();
      removeIndicator();
      const crosshair = document.getElementById("crosshair");
      if (crosshair) crosshair.classList.remove("snapped");
    });
    updateButton();
    raster.closest(".view-row")?.after(row);
  }

  MI.Engine.prototype.renderSVG = function () {
    activeEngine = this;
    return originalRenderSVG.apply(this, arguments);
  };

  MI.Engine.prototype.add = function (object) {
    const next = JSON.parse(JSON.stringify(object));
    const snapCoordinate = (x, y, excludeId) => bestSnap(this, { x, y }, excludeId);
    if (next.type === "line") {
      let snap = snapCoordinate(next.x1, next.y1, null); if (snap.snapped) { next.x1 = snap.x; next.y1 = snap.y; }
      snap = snapCoordinate(next.x2, next.y2, null); if (snap.snapped) { next.x2 = snap.x; next.y2 = snap.y; }
    } else if (next.type === "point" || next.type === "text") {
      const snap = snapCoordinate(next.x, next.y, null); if (snap.snapped) { next.x = snap.x; next.y = snap.y; }
    } else if (next.type === "circle") {
      const snap = snapCoordinate(next.cx, next.cy, null); if (snap.snapped) { next.cx = snap.x; next.cy = snap.y; }
    }
    return originalAdd.call(this, next);
  };

  MI.Engine.prototype.update = function (id, patch) {
    const next = Object.assign({}, patch);
    const object = this.get(id);
    if (object) {
      if ((object.type === "point" || object.type === "text") && Number.isFinite(next.x) && Number.isFinite(next.y)) {
        const snap = bestSnap(this, { x: next.x, y: next.y }, id);
        if (snap.snapped) { next.x = snap.x; next.y = snap.y; }
      }
      if (object.type === "circle" && Number.isFinite(next.cx) && Number.isFinite(next.cy)) {
        const snap = bestSnap(this, { x: next.cx, y: next.cy }, id);
        if (snap.snapped) { next.cx = snap.x; next.cy = snap.y; }
      }
      if (object.type === "line") {
        if (Number.isFinite(next.x1) && Number.isFinite(next.y1)) {
          const snap = bestSnap(this, { x: next.x1, y: next.y1 }, id);
          if (snap.snapped) { next.x1 = snap.x; next.y1 = snap.y; }
        }
        if (Number.isFinite(next.x2) && Number.isFinite(next.y2)) {
          const snap = bestSnap(this, { x: next.x2, y: next.y2 }, id);
          if (snap.snapped) { next.x2 = snap.x; next.y2 = snap.y; }
        }
      }
    }
    return originalUpdate.call(this, id, next);
  };

  const canvas = document.getElementById("canvas");
  if (canvas) {
    canvas.addEventListener("mousedown", function () {
      const button = document.querySelector(".tool.active");
      if (!button || (button.dataset.tool !== "line" && button.dataset.tool !== "circle")) return;
      setTimeout(function () {
        if (activeEngine && activeEngine.renderer.preview) drawStart = { ...activeEngine.renderer.preview.start };
      }, 0);
    });
  }

  const canvasWrap = document.getElementById("canvasWrap");
  if (canvasWrap) {
    canvasWrap.addEventListener("mousedown", function (event) {
      const button = document.querySelector(".tool.active");
      if (!button || button.dataset.tool !== "select") return;
      const target = event.target && event.target.closest ? event.target.closest("[data-object-id]") : null;
      if (!target) return;
      canvasWrap.dataset.snapDragging = "true";
      canvasWrap.dataset.snapExcludeId = target.dataset.objectId || "";
    }, true);
    global.addEventListener("mouseup", function () {
      canvasWrap.dataset.snapDragging = "false";
      canvasWrap.dataset.snapExcludeId = "";
    });
  }

  const viewList = document.getElementById("viewList");
  if (viewList) {
    const observer = new MutationObserver(installViewToggle);
    observer.observe(viewList, { childList: true });
    installViewToggle();
  }

  global.addEventListener("mousemove", showIndicator);
  global.addEventListener("mouseup", function () { drawStart = null; removeIndicator(); });
  global.addEventListener("mouseleave", removeIndicator);

  MI.Engine.prototype.__fziSnapIndicatorInstalled = true;
})(window);
