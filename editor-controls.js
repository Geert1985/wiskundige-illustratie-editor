/* From Zero 2 Infinity — editor interaction and object color controls */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  if (!MI.Engine || MI.Engine.prototype.__fziEditorControlsInstalled) return;

  let activeEngine = MI.activeEngine || null;
  const originalRenderSVG = MI.Engine.prototype.renderSVG;
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
    return Math.hypot(point.x - gx, point.y - gy) <= tolerance ? { x: gx, y: gy, snapped: true, kind: "grid" } : null;
  }

  function bestSnap(engine, point, excludeId) {
    const geometric = MI.snapPoint ? MI.snapPoint(engine, point, excludeId) : null;
    if (geometric && geometric.snapped) return geometric;
    return gridSnap(engine, point) || { x: point.x, y: point.y, snapped: false, kind: null };
  }

  function lineMoveSnap(engine, original, dx, dy) {
    const proposed = [
      { x: original.x1 + dx, y: original.y1 + dy, endpoint: "start" },
      { x: original.x2 + dx, y: original.y2 + dy, endpoint: "end" }
    ];
    let best = null;
    proposed.forEach(function (candidate) {
      const snap = bestSnap(engine, candidate, original.id);
      if (!snap.snapped) return;
      const distance = Math.hypot(candidate.x - snap.x, candidate.y - snap.y);
      if (!best || distance < best.distance) best = { snap: snap, candidate: candidate, distance: distance };
    });
    if (!best) return { x1: proposed[0].x, y1: proposed[0].y, x2: proposed[1].x, y2: proposed[1].y, snap: null };
    const tx = best.snap.x - best.candidate.x;
    const ty = best.snap.y - best.candidate.y;
    return { x1: proposed[0].x + tx, y1: proposed[0].y + ty, x2: proposed[1].x + tx, y2: proposed[1].y + ty, snap: best.snap };
  }

  function setLineDom(line) {
    const svg = document.querySelector("#canvas svg");
    if (!svg) return;
    const node = svg.querySelector('g[data-object-id="' + CSS.escape(line.id) + '"] > line');
    if (!node || !activeEngine) return;
    node.setAttribute("x1", activeEngine.renderer.mapX(line.x1));
    node.setAttribute("y1", activeEngine.renderer.mapY(line.y1));
    node.setAttribute("x2", activeEngine.renderer.mapX(line.x2));
    node.setAttribute("y2", activeEngine.renderer.mapY(line.y2));
    const label = svg.querySelector('.object-label[data-label-id="' + CSS.escape(line.id) + '"]');
    if (label) {
      const style = line.style || {};
      const color = style.stroke && style.stroke !== "none" ? style.stroke : (style.fill || "#222");
      const x = activeEngine.renderer.mapX((line.x1 + line.x2) / 2) + (Number(line.labelDx) || 6);
      const y = activeEngine.renderer.mapY((line.y1 + line.y2) / 2) + (Number(line.labelDy) || -6);
      label.setAttribute("x", x); label.setAttribute("y", y); label.setAttribute("fill", color);
    }
    svg.querySelectorAll('.fzi-line-endpoint[data-line-id="' + CSS.escape(line.id) + '"]').forEach(function (handle) {
      const isStart = handle.dataset.endpoint === "start";
      const x = isStart ? line.x1 : line.x2, y = isStart ? line.y1 : line.y2;
      handle.setAttribute("cx", activeEngine.renderer.mapX(x));
      handle.setAttribute("cy", activeEngine.renderer.mapY(y));
    });
  }

  function showMarker(snap) {
    const svg = document.querySelector("#canvas svg");
    if (!svg) return;
    svg.querySelectorAll(".fzi-snap-indicator").forEach(function (node) { node.remove(); });
    if (!snap || !snap.snapped) return;
    const layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layer.setAttribute("class", "fzi-snap-indicator");
    layer.setAttribute("pointer-events", "none");
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", activeEngine.renderer.mapX(snap.x));
    circle.setAttribute("cy", activeEngine.renderer.mapY(snap.y));
    circle.setAttribute("r", "8");
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#2563eb");
    circle.setAttribute("stroke-width", "4");
    layer.appendChild(circle); svg.appendChild(layer);
  }

  MI.Engine.prototype.renderSVG = function () {
    activeEngine = this;
    return originalRenderSVG.apply(this, arguments);
  };

  MI.Engine.prototype.update = function (id, patch) {
    const object = this.get(id);
    const next = Object.assign({}, patch);
    if (object && object.type === "line" && ["x1", "y1", "x2", "y2"].every(function (key) { return Number.isFinite(next[key]); })) {
      const unchanged = next.x1 === object.x1 && next.y1 === object.y1 && next.x2 === object.x2 && next.y2 === object.y2;
      if (unchanged) return this.model.update(id, next);
      const startChanged = next.x1 !== object.x1 || next.y1 !== object.y1;
      const endChanged = next.x2 !== object.x2 || next.y2 !== object.y2;
      if (startChanged && endChanged) {
        const dx = next.x1 - object.x1, dy = next.y1 - object.y1;
        const sameTranslation = Math.abs((next.x2 - object.x2) - dx) < 1e-8 && Math.abs((next.y2 - object.y2) - dy) < 1e-8;
        if (sameTranslation) {
          const moved = lineMoveSnap(this, object, dx, dy);
          return this.model.update(id, { x1: moved.x1, y1: moved.y1, x2: moved.x2, y2: moved.y2 });
        }
      }
    }
    return originalUpdate.call(this, id, next);
  };

  function objectColor(object) {
    const style = object.style || {};
    const value = object.type === "text" ? style.fill : style.stroke;
    return /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#222222";
  }

  function refreshCanvas() {
    if (!activeEngine) return;
    const canvas = document.getElementById("canvas");
    if (!canvas) return;
    const selected = canvas.querySelector("g.selected");
    const selectedId = selected && selected.dataset.objectId;
    canvas.innerHTML = activeEngine.renderSVG();
    if (selectedId) {
      const node = canvas.querySelector('[data-object-id="' + CSS.escape(selectedId) + '"]');
      if (node) node.classList.add("selected");
    }
  }

  function setObjectColor(id, color) {
    const object = activeEngine && activeEngine.get(id);
    if (!object) return;
    const style = Object.assign({}, object.style || {});
    if (object.type === "text") { style.fill = color; style.stroke = "none"; }
    else { style.stroke = color; if (object.type === "point") style.fill = color; }
    activeEngine.update(id, { style: style });
    refreshCanvas();
  }

  function installColorControls() {
    const viewList = document.getElementById("viewList");
    if (!viewList || !activeEngine) return;
    viewList.querySelectorAll("[data-color-object]").forEach(function (button) {
      if (button.dataset.colorBound === "true") return;
      button.dataset.colorBound = "true";
      const object = activeEngine.get(button.dataset.colorObject);
      if (!object) return;
      button.querySelector(".color-swatch").style.backgroundColor = objectColor(object);
      button.addEventListener("click", function (event) {
        event.preventDefault(); event.stopPropagation();
        const current = activeEngine.get(button.dataset.colorObject);
        if (!current) return;
        const input = document.createElement("input");
        input.type = "color"; input.value = objectColor(current); input.style.position = "fixed"; input.style.left = "-1000px";
        document.body.appendChild(input);
        input.addEventListener("input", function () { setObjectColor(button.dataset.colorObject, input.value); });
        input.addEventListener("change", function () { input.remove(); });
        input.click();
      });
    });
  }

  function removeSnapPointsRow() {
    const viewList = document.getElementById("viewList");
    if (!viewList) return;
    viewList.querySelectorAll("[data-view='snapPoints']").forEach(function (button) {
      const row = button.closest(".view-row"); if (row) row.remove();
    });
  }

  function augmentViewList() {
    const viewList = document.getElementById("viewList");
    if (!viewList || !activeEngine) return;
    removeSnapPointsRow();
    viewList.querySelectorAll("[data-select-object]").forEach(function (selector) {
      if (selector.parentElement.querySelector("[data-color-object]")) return;
      const id = selector.dataset.selectObject;
      const button = document.createElement("button");
      button.type = "button"; button.className = "color-btn"; button.dataset.colorObject = id;
      button.setAttribute("aria-label", "Kleur van " + selector.textContent.trim());
      button.innerHTML = '<span class="color-swatch" aria-hidden="true"></span>';
      selector.parentElement.insertBefore(button, selector.parentElement.querySelector(".text-btn"));
    });
    installColorControls();
  }

  const canvasWrap = document.getElementById("canvasWrap");
  if (canvasWrap) {
    canvasWrap.addEventListener("mousedown", function (event) {
      const tool = document.querySelector(".tool.active");
      if (!tool || tool.dataset.tool !== "select") return;
      const target = event.target && event.target.closest ? event.target.closest('g[data-object-id][data-object-type="line"]') : null;
      if (!target || event.target.closest(".fzi-line-endpoint")) return;
      const line = activeEngine && activeEngine.get(target.dataset.objectId);
      if (!line) return;
      canvasWrap.dataset.controlLineDrag = "true";
      canvasWrap.dataset.controlLineId = line.id;
      canvasWrap.dataset.controlLineStartX = event.clientX;
      canvasWrap.dataset.controlLineStartY = event.clientY;
      canvasWrap.dataset.controlLineOriginal = JSON.stringify(line);
    }, true);

    global.addEventListener("mousemove", function (event) {
      if (canvasWrap.dataset.controlLineDrag !== "true" || event.buttons !== 1 || !activeEngine) return;
      const original = JSON.parse(canvasWrap.dataset.controlLineOriginal || "null");
      if (!original) return;
      const scale = Math.max(activeEngine.renderer.scale(), 1e-9);
      const dx = (event.clientX - Number(canvasWrap.dataset.controlLineStartX)) / scale;
      const dy = -(event.clientY - Number(canvasWrap.dataset.controlLineStartY)) / scale;
      const moved = lineMoveSnap(activeEngine, original, dx, dy);
      activeEngine.model.update(original.id, { x1: moved.x1, y1: moved.y1, x2: moved.x2, y2: moved.y2 });
      setLineDom(activeEngine.get(original.id));
      showMarker(moved.snap);
    });

    global.addEventListener("mouseup", function () {
      canvasWrap.dataset.controlLineDrag = "false";
      canvasWrap.dataset.controlLineId = "";
      canvasWrap.dataset.controlLineOriginal = "";
      canvasWrap.dataset.controlLineStartX = "";
      canvasWrap.dataset.controlLineStartY = "";
    });
  }

  let endpointState = null;
  global.addEventListener("pointerdown", function (event) {
    const handle = event.target && event.target.closest ? event.target.closest(".fzi-line-endpoint") : null;
    if (!handle) return;
    endpointState = { id: handle.dataset.lineId, endpoint: handle.dataset.endpoint };
  }, true);

  global.addEventListener("pointermove", function (event) {
    if (!endpointState || !activeEngine) return;
    const line = activeEngine.get(endpointState.id);
    const mouse = eventToMath(event, activeEngine);
    if (!line || !mouse) return;
    const snap = bestSnap(activeEngine, mouse, line.id);
    if (endpointState.endpoint === "start") { line.x1 = snap.x; line.y1 = snap.y; }
    else { line.x2 = snap.x; line.y2 = snap.y; }
    setLineDom(line);
    showMarker(snap);
  }, true);

  global.addEventListener("pointerup", function () { endpointState = null; showMarker(null); }, true);

  const viewList = document.getElementById("viewList");
  if (viewList) {
    const observer = new MutationObserver(augmentViewList);
    observer.observe(viewList, { childList: true, subtree: true });
    augmentViewList();
  }

  MI.Engine.prototype.__fziEditorControlsInstalled = true;
})(window);
