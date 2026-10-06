/* From Zero 2 Infinity — Mathematical Illustration Editor */
(function (global) {
  "use strict";

  const MI = global.FZI.MathIllustration;
  const STORAGE_KEY = "fzi.mathIllustration.draft";
  const canvas = document.getElementById("canvas");
  const canvasWrap = document.getElementById("canvasWrap");
  const status = document.getElementById("status");
  const objectCount = document.getElementById("objectCount");
  const selectionPanel = document.getElementById("selectionPanel");
  const titleInput = document.getElementById("titleInput");
  const descriptionInput = document.getElementById("descriptionInput");
  const crosshair = document.getElementById("crosshair");
  const viewList = document.getElementById("viewList");
  const DEFAULT_BOUNDS = { xMin: -5, yMin: -3, xMax: 5, yMax: 3 };

  let engine = createEngine();
  let tool = "select";
  let selectedId = null;
  let drag = null;
  let typedMeasurement = "";

  function createEngine() { return new MI.Engine(null, { width: 1000, height: 650, bounds: { ...DEFAULT_BOUNDS }, background: "#f7f7f4", padding: 30, showAxes: true, showGrid: false, axisStep: 1 }); }
  function setStatus(message) { status.textContent = message; }
  function fmt(value) { return Number(value).toFixed(1); }
  function eyeIcon(visible) { if (visible) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" fill="currentColor"/></svg>'; return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M9.9 5.9C10.6 5.7 11.3 5.6 12 5.6c6.5 0 10 6.4 10 6.4-.8 1.2-1.8 2.4-3.1 3.4M6.1 6.1C3.5 7.7 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function textIcon(active) { return '<span class="text-toggle' + (active ? ' active' : '') + '" aria-hidden="true">T</span>'; }
  function objectName(object) { const names = { point: "Punt", line: "Lijnstuk", circle: "Cirkel", text: "Tekst" }; return object.name || names[object.type] || object.type; }

  function applyVisibilityToCanvas() { engine.model.objects.forEach((object) => { const group = canvas.querySelector('[data-object-id="' + CSS.escape(object.id) + '"]'); if (group) group.style.display = object.visible === false ? "none" : ""; }); }

  function renderViewList() {
    const rows = [];
    rows.push('<div class="view-row"><button class="view-name view-system-btn" type="button" data-view-select="axes">Assenstelsel</button><button class="eye-btn" type="button" data-view="axes" aria-label="Assenstelsel zichtbaar">' + eyeIcon(engine.renderer.showAxes) + '</button></div>');
    rows.push('<div class="view-row"><button class="view-name view-system-btn" type="button" data-view-select="grid">Raster</button><button class="eye-btn" type="button" data-view="grid" aria-label="Raster zichtbaar">' + eyeIcon(engine.renderer.showGrid) + '</button></div>');
    if (engine.model.objects.length) rows.push('<div class="view-divider"></div>');
    engine.model.objects.forEach((object) => {
      const visible = object.visible !== false, selected = selectedId === object.id;
      rows.push('<div class="view-row' + (selected ? ' view-row-selected' : '') + '">' +
        '<button class="view-name view-select-btn" type="button" data-select-object="' + MI.escapeXml(object.id) + '" title="Selecteer ' + MI.escapeXml(objectName(object)) + '">' + MI.escapeXml(objectName(object)) + '<span class="view-type">' + MI.escapeXml(object.id) + '</span></button>' +
        '<button class="text-btn" type="button" data-toggle-label="' + MI.escapeXml(object.id) + '" aria-label="Label tonen of verbergen">' + textIcon(object.showLabel === true) + '</button>' +
        '<button class="eye-btn' + (visible ? '' : ' hidden-eye') + '" type="button" data-object-visibility="' + MI.escapeXml(object.id) + '" aria-label="' + (visible ? 'Verberg ' : 'Toon ') + MI.escapeXml(objectName(object)) + '">' + eyeIcon(visible) + '</button></div>');
    });
    viewList.innerHTML = rows.join("");
  }

  function render() {
    updateMeta(); canvas.innerHTML = engine.renderSVG(); applyVisibilityToCanvas();
    objectCount.textContent = engine.model.objects.length + (engine.model.objects.length === 1 ? " object" : " objecten");
    renderViewList();
    if (selectedId) { const selected = canvas.querySelector('[data-object-id="' + CSS.escape(selectedId) + '"]'); if (selected) selected.classList.add("selected"); }
    renderSelectionPanel();
  }

  function renderSelectionPanel() {
    const object = selectedId ? engine.get(selectedId) : null;
    if (!object) { selectionPanel.className = "selection-empty"; selectionPanel.textContent = "Geen object geselecteerd."; return; }
    selectionPanel.className = "selection-panel";
    let html = '<div><strong>' + MI.escapeXml(objectName(object)) + '</strong> <code>' + MI.escapeXml(object.id) + '</code></div>';
    html += '<label>Naam<input data-edit="name" type="text" value="' + MI.escapeXml(object.name || object.id) + '"></label>';
    if (object.type === "point" || object.type === "text") html += field("x", object.x, "x") + field("y", object.y, "y");
    if (object.type === "line") html += field("x₁", object.x1, "x1") + field("y₁", object.y1, "y1") + field("x₂", object.x2, "x2") + field("y₂", object.y2, "y2");
    if (object.type === "circle") html += field("cx", object.cx, "cx") + field("cy", object.cy, "cy") + field("r", object.r, "r");
    if (object.type === "text") html += '<label>Tekst<input data-edit="text" value="' + MI.escapeXml(object.text) + '"></label>';
    html += '<button class="delete-btn" id="deleteSelected">Verwijder object</button>';
    selectionPanel.innerHTML = html;
    selectionPanel.querySelectorAll("[data-edit]").forEach((input) => input.addEventListener("change", () => { const patch = {}; patch[input.dataset.edit] = input.type === "number" ? Number(input.value) : input.value; engine.update(object.id, patch); render(); }));
    const deleteButton = document.getElementById("deleteSelected");
    if (deleteButton) deleteButton.addEventListener("click", () => { engine.remove(object.id); selectedId = null; render(); setStatus("Object verwijderd."); });
  }

  function field(label, value, key) { return '<div class="row"><span>' + label + '</span><input data-edit="' + key + '" type="number" step="0.1" value="' + fmt(value) + '"></div>'; }
  function updateMeta() { engine.model.meta.title = titleInput.value.trim(); engine.model.meta.description = descriptionInput.value.trim(); }
  function activateTool(next) { tool = next; typedMeasurement = ""; document.querySelectorAll(".tool").forEach((button) => button.classList.toggle("active", button.dataset.tool === tool)); setStatus(tool === "select" ? "Selecteer een object of verschuif het canvas." : "Teken: " + tool + "."); }

  function svgScreenScale() { const svg = canvas.querySelector("svg"); if (!svg) return null; const matrix = svg.getScreenCTM(); if (!matrix) return null; const p0 = new DOMPoint(0, 0).matrixTransform(matrix), p1 = new DOMPoint(1, 0).matrixTransform(matrix); return Math.hypot(p1.x - p0.x, p1.y - p0.y) * engine.renderer.scale(); }
  function mathDeltaFromScreen(dx, dy, screenPerMath) { const s = screenPerMath || svgScreenScale() || 1; return { x: dx / s, y: -dy / s }; }
  function mathUnitsPerPixel() { const s = svgScreenScale(); return s ? 1 / s : 0.01; }

  function snapToGrid(point) {
    if (!engine.renderer.showGrid) return null;
    const step = Number(engine.renderer.axisStep) || 1, gx = Math.round(point.x / step) * step, gy = Math.round(point.y / step) * step, tolerance = mathUnitsPerPixel() * 12;
    return Math.hypot(point.x - gx, point.y - gy) <= tolerance ? { point: { x: gx, y: gy }, snapped: true, object: null, grid: true } : null;
  }

  function snapToPoint(point, excludeId) {
    const tolerance = mathUnitsPerPixel() * 14; let best = null, bestDistance = Infinity;
    engine.model.objects.forEach((object) => { if (object.type !== "point" || object.visible === false || object.id === excludeId) return; const distance = Math.hypot(point.x - object.x, point.y - object.y); if (distance <= tolerance && distance < bestDistance) { best = object; bestDistance = distance; } });
    if (best) return { point: { x: best.x, y: best.y }, snapped: true, object: best, grid: false };
    return snapToGrid(point) || { point: point, snapped: false, object: null, grid: false };
  }

  function pointerPosition(event) {
    const svg = canvas.querySelector("svg"); if (!svg) return null; const matrix = svg.getScreenCTM(); if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()), r = engine.renderer, b = r.bounds, dw = r.width - r.padding * 2;
    return { x: b.xMin + ((p.x - r.padding) / dw) * (b.xMax - b.xMin), y: b.yMin + ((r.height - r.padding - p.y) / dw) * (b.xMax - b.xMin) };
  }

  function screenPosition(point) {
    const svg = canvas.querySelector("svg"); if (!svg) return null; const matrix = svg.getScreenCTM(); if (!matrix) return null;
    const r = engine.renderer, b = r.bounds, scale = r.scale(), svgX = r.padding + (point.x - b.xMin) * scale, svgY = r.height - r.padding - (point.y - b.yMin) * scale, p = new DOMPoint(svgX, svgY).matrixTransform(matrix), wrap = canvasWrap.getBoundingClientRect();
    return { x: p.x - wrap.left, y: p.y - wrap.top };
  }
  function updateCrosshair(event, snap) { const r = canvasWrap.getBoundingClientRect(); let position = { x: event.clientX - r.left, y: event.clientY - r.top }; if (snap && snap.snapped) position = screenPosition(snap.point) || position; crosshair.style.left = position.x + "px"; crosshair.style.top = position.y + "px"; crosshair.classList.toggle("snapped", Boolean(snap && snap.snapped)); }

  function measurementValue() { if (!typedMeasurement) return null; const value = Number(typedMeasurement.replace(",", ".")); return Number.isFinite(value) && value > 0 ? value : null; }
  function constrainedEndpoint(start, mousePoint) { const value = measurementValue(); if (value == null) return mousePoint; let dx = mousePoint.x - start.x, dy = mousePoint.y - start.y, length = Math.hypot(dx, dy); if (length < 1e-9) { dx = 1; dy = 0; } else { dx /= length; dy /= length; } return { x: start.x + dx * value, y: start.y + dy * value }; }
  function measurementStatus() { const value = measurementValue(); if (value == null) return null; return drag && drag.shape === "circle" ? "Straal: " + value : "Lengte: " + value; }

  function finishLine(start, end) { if (Math.hypot(end.x - start.x, end.y - start.y) < 0.05) return; const requestedLength = measurementValue(); engine.renderer.preview = null; selectedId = engine.add({ type: "line", x1: start.x, y1: start.y, x2: end.x, y2: end.y }).id; render(); setStatus(requestedLength != null ? "Lijnstuk met lengte " + requestedLength + " toegevoegd." : "Lijnstuk toegevoegd."); }
  function finishCircle(center, end) { const requestedRadius = measurementValue(), radius = requestedRadius != null ? requestedRadius : Math.hypot(end.x - center.x, end.y - center.y); if (radius < 0.05) return; engine.renderer.preview = null; selectedId = engine.add({ type: "circle", cx: center.x, cy: center.y, r: radius }).id; render(); setStatus(requestedRadius != null ? "Cirkel met straal " + requestedRadius + " toegevoegd." : "Cirkel toegevoegd."); }

  function updateDrawPreview(event) { if (!drag || drag.mode !== "draw") return; const mousePoint = pointerPosition(event); if (!mousePoint) return; const snap = snapToPoint(mousePoint); drag.lastPoint = snap.point; const end = constrainedEndpoint(drag.start, snap.point); engine.renderer.preview.end = end; updateCrosshair(event, measurementValue() == null ? snap : { point: end, snapped: false }); setStatus(measurementStatus() || (drag.shape === "circle" ? "Typ een straal, bijvoorbeeld 2." : "Typ een lengte, bijvoorbeeld 3.")); render(); }
  function zoomAt(event) { if (drag) return; event.preventDefault(); const p = pointerPosition(event); if (!p) return; const b = engine.renderer.bounds, factor = event.deltaY < 0 ? 0.85 : 1 / 0.85, nx = (b.xMax - b.xMin) * factor, ny = (b.yMax - b.yMin) * factor, fx = (p.x - b.xMin) / (b.xMax - b.xMin), fy = (p.y - b.yMin) / (b.yMax - b.yMin); engine.renderer.bounds = { xMin: p.x - fx * nx, xMax: p.x + (1 - fx) * nx, yMin: p.y - fy * ny, yMax: p.y + (1 - fy) * ny }; render(); }
  function resetView() { engine.renderer.bounds = { ...DEFAULT_BOUNDS }; render(); setStatus("Weergave hersteld."); }

  canvasWrap.addEventListener("wheel", zoomAt, { passive: false });

  canvas.addEventListener("mousedown", function (event) {
    if (event.button !== 0 || tool !== "select") return;
    const label = event.target && event.target.closest ? event.target.closest(".object-label") : null;
    if (!label) return;
    const object = engine.get(label.getAttribute("data-label-id"));
    if (!object) return;
    const scale = engine.renderer.scale() || 1;
    const defaultDx = (object.type === "line" || object.type === "text" ? 6 : 8) / scale;
    const defaultDy = (object.type === "line" || object.type === "text" ? -6 : -8) / -scale;
    let originalOffsetX = Number(object.labelOffsetX);
    let originalOffsetY = Number(object.labelOffsetY);
    if (!Number.isFinite(originalOffsetX)) {
      const legacyDx = Number.isFinite(Number(object.labelDx)) ? Number(object.labelDx) : (object.type === "line" || object.type === "text" ? 6 : 8);
      originalOffsetX = legacyDx / scale;
    }
    if (!Number.isFinite(originalOffsetY)) {
      const legacyDy = Number.isFinite(Number(object.labelDy)) ? Number(object.labelDy) : (object.type === "line" || object.type === "text" ? -6 : -8);
      originalOffsetY = -legacyDy / scale;
    }
    drag = { mode: "label", objectId: object.id, startClientX: event.clientX, startClientY: event.clientY, originalOffsetX: originalOffsetX, originalOffsetY: originalOffsetY };
    selectedId = object.id;
    event.preventDefault();
    event.stopImmediatePropagation();
    setStatus("Label verplaatsen.");
  }, true);

  canvasWrap.addEventListener("mousedown", function (event) {
    if (event.button !== 0) return; event.preventDefault(); const p = pointerPosition(event); if (!p) return; const screenPerMath = svgScreenScale();
    if (tool === "point") { const snap = snapToPoint(p); selectedId = engine.add({ type: "point", x: snap.point.x, y: snap.point.y }).id; render(); setStatus(snap.snapped ? (snap.grid ? "Punt vastgeklikt op rasterpunt." : "Punt vastgeklikt aan bestaand punt.") : "Punt toegevoegd."); return; }
    if (tool === "text") { const text = global.prompt("Tekst voor de illustratie:", "A"); if (text !== null && text.trim()) { const snap = snapToPoint(p); selectedId = engine.add({ type: "text", x: snap.point.x, y: snap.point.y, text: text.trim() }).id; render(); setStatus("Tekst toegevoegd."); } return; }
    if (tool === "line" || tool === "circle") { const snap = snapToPoint(p); drag = { mode: "draw", shape: tool, start: snap.point, screenPerMath: screenPerMath, lastPoint: snap.point }; engine.renderer.preview = { type: tool, start: snap.point, end: snap.point }; crosshair.hidden = false; updateCrosshair(event, snap); render(); return; }
    const hit = engine.selectAt(p.x, p.y, 0.18);
    if (hit) { const object = engine.get(hit.object.id); drag = { mode: "object", objectId: object.id, objectType: object.type, startClientX: event.clientX, startClientY: event.clientY, screenPerMath: screenPerMath, original: JSON.parse(JSON.stringify(object)) }; selectedId = object.id; setStatus("Object geselecteerd."); }
    else { drag = { mode: "pan", startClientX: event.clientX, startClientY: event.clientY, screenPerMath: screenPerMath, bounds: { ...engine.renderer.bounds } }; selectedId = null; setStatus("Canvas verschuiven."); }
    render();
  });

  global.addEventListener("mousemove", function (event) {
    if (!drag) return;
    if (drag.mode === "label") {
      const object = engine.get(drag.objectId);
      if (!object) return;
      const scale = engine.renderer.scale() || 1;
      engine.update(object.id, { labelOffsetX: drag.originalOffsetX + (event.clientX - drag.startClientX) / scale, labelOffsetY: drag.originalOffsetY - (event.clientY - drag.startClientY) / scale });
      render();
      return;
    }
    if (drag.mode === "draw") { updateDrawPreview(event); return; }
    const delta = mathDeltaFromScreen(event.clientX - drag.startClientX, event.clientY - drag.startClientY, drag.screenPerMath);
    if (drag.mode === "object") { const o = drag.original; if (drag.objectType === "point" || drag.objectType === "text") { const target = snapToPoint({ x: o.x + delta.x, y: o.y + delta.y }, drag.objectId); engine.update(drag.objectId, { x: target.point.x, y: target.point.y }); } else if (drag.objectType === "circle") { const target = snapToPoint({ x: o.cx + delta.x, y: o.cy + delta.y }, drag.objectId); engine.update(drag.objectId, { cx: target.point.x, cy: target.point.y }); } else if (drag.objectType === "line") engine.update(drag.objectId, { x1: o.x1 + delta.x, y1: o.y1 + delta.y, x2: o.x2 + delta.x, y2: o.y2 + delta.y }); render(); return; }
    if (drag.mode === "pan") { const original = drag.bounds, dx = delta.x, dy = delta.y; engine.renderer.bounds = { xMin: original.xMin - dx, xMax: original.xMax - dx, yMin: original.yMin - dy, yMax: original.yMax - dy }; render(); }
  });

  global.addEventListener("mouseup", function () { if (!drag) return; const current = drag; drag = null; crosshair.hidden = true; crosshair.classList.remove("snapped"); if (current.mode === "draw") { const end = current.lastPoint || current.start, constrained = constrainedEndpoint(current.start, end); if (current.shape === "line") finishLine(current.start, constrained); if (current.shape === "circle") finishCircle(current.start, constrained); return; } if (current.mode === "pan") setStatus("Canvas verschoven."); if (current.mode === "label") setStatus("Label verplaatst."); });

  viewList.addEventListener("click", function (event) {
    const eye = event.target.closest("[data-object-visibility]"); if (eye) { const object = engine.get(eye.dataset.objectVisibility); if (object) { engine.update(object.id, { visible: object.visible === false }); render(); } return; }
    const labelButton = event.target.closest("[data-toggle-label]"); if (labelButton) { const object = engine.get(labelButton.dataset.toggleLabel); if (object) { engine.update(object.id, { showLabel: object.showLabel !== true }); render(); } return; }
    const selector = event.target.closest("[data-select-object]"); if (selector) { selectedId = selector.dataset.selectObject; render(); setStatus("Object geselecteerd."); return; }
  });
  viewList.addEventListener("click", function (event) { const system = event.target.closest("[data-view]"); if (!system) return; if (system.dataset.view === "axes") engine.renderer.showAxes = !engine.renderer.showAxes; if (system.dataset.view === "grid") engine.renderer.showGrid = !engine.renderer.showGrid; render(); });

  document.getElementById("toolGrid").addEventListener("click", (event) => { const button = event.target.closest("[data-tool]"); if (button) activateTool(button.dataset.tool); });
  document.getElementById("resetViewBtn").addEventListener("click", resetView);
  titleInput.addEventListener("input", render); descriptionInput.addEventListener("input", render);

  document.getElementById("newBtn").addEventListener("click", function () { if (!global.confirm("Een nieuwe illustratie starten? Niet-opgeslagen wijzigingen gaan verloren.")) return; const r = engine.renderer; engine = createEngine(); engine.renderer.showAxes = r.showAxes; engine.renderer.showGrid = r.showGrid; selectedId = null; titleInput.value = ""; descriptionInput.value = ""; render(); setStatus("Nieuwe illustratie gestart."); });
  document.getElementById("saveBtn").addEventListener("click", () => { updateMeta(); localStorage.setItem(STORAGE_KEY, engine.toJSONString(true)); setStatus("Concept opgeslagen in deze browser."); });
  document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());
  document.getElementById("fileInput").addEventListener("change", function (event) { const file = event.target.files && event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function () { try { engine.load(JSON.parse(reader.result)); titleInput.value = engine.model.meta.title || ""; descriptionInput.value = engine.model.meta.description || ""; selectedId = null; render(); setStatus("Illustratie geladen."); } catch (error) { global.alert("JSON kon niet worden geladen: " + error.message); } event.target.value = ""; }; reader.readAsText(file); });

  function download(name, content, type) { const blob = new Blob([content], { type: type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
  document.getElementById("exportJsonBtn").addEventListener("click", () => { updateMeta(); download("illustratie.json", engine.toJSONString(true), "application/json;charset=utf-8"); setStatus("JSON geëxporteerd."); });
  document.getElementById("exportSvgBtn").addEventListener("click", () => { updateMeta(); download("illustratie.svg", engine.renderSVG(), "image/svg+xml;charset=utf-8"); setStatus("SVG geëxporteerd."); });

  global.addEventListener("keydown", function (event) {
    if (drag && drag.mode === "draw" && /^[0-9.,]$/.test(event.key)) { typedMeasurement += event.key === "," ? "." : event.key; updateDrawPreview({ clientX: event.clientX, clientY: event.clientY }); event.preventDefault(); return; }
    if (drag && drag.mode === "draw" && event.key === "Backspace") { typedMeasurement = typedMeasurement.slice(0, -1); updateDrawPreview({ clientX: event.clientX, clientY: event.clientY }); event.preventDefault(); return; }
    if (drag && drag.mode === "draw" && event.key === "Enter") { global.dispatchEvent(new MouseEvent("mouseup", { clientX: event.clientX, clientY: event.clientY })); event.preventDefault(); return; }
    if ((event.key === "Delete" || event.key === "Backspace") && selectedId && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { engine.remove(selectedId); selectedId = null; render(); setStatus("Object verwijderd."); }
    if (event.key === "Escape") { drag = null; typedMeasurement = ""; engine.renderer.preview = null; crosshair.hidden = true; crosshair.classList.remove("snapped"); activateTool("select"); render(); }
  });

  try { const draft = localStorage.getItem(STORAGE_KEY); if (draft) { engine.load(JSON.parse(draft)); titleInput.value = engine.model.meta.title || ""; descriptionInput.value = engine.model.meta.description || ""; setStatus("Opgeslagen concept geladen."); } } catch (error) { localStorage.removeItem(STORAGE_KEY); setStatus("Nieuw werkvlak."); }
  render();
})(window);