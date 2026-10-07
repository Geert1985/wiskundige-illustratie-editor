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
  function activateTool(next) { MI.publishSnapResult(engine, null); tool = next; typedMeasurement = ""; document.querySelectorAll(".tool").forEach((button) => button.classList.toggle("active", button.dataset.tool === tool)); setStatus(tool === "select" ? "Selecteer een object of verschuif het canvas." : "Teken: " + tool + "."); }

  function mathDeltaFromScreen(dx, dy, transform) { return (transform || MI.CoordinateTransform.forCanvas(engine)).screenDelta(dx, dy); }
  function snapToPoint(point, excludeId) { return MI.SnapService.resolve(engine, point, { excludeId, transform: MI.CoordinateTransform.forCanvas(engine) }); }
  function pointerPosition(event) {
    const transform = MI.CoordinateTransform.forCanvas(engine);
    return transform && transform.screenToMath({ x: event.clientX, y: event.clientY });
  }
  function screenPosition(point) {
    const transform = MI.CoordinateTransform.forCanvas(engine); if (!transform) return null;
    const screen = transform.mathToScreen(point), wrap = canvasWrap.getBoundingClientRect();
    return { x: screen.x - wrap.left, y: screen.y - wrap.top };
  }
  function updateCrosshair(result) {
    const position = screenPosition(result.point); if (!position) return;
    crosshair.style.left = position.x + "px"; crosshair.style.top = position.y + "px";
    crosshair.classList.toggle("snapped", result.snapped);
    crosshair.hidden = result.snapped && engine.renderer.showSnapPoints !== false;
  }

  function measurementValue() { if (!typedMeasurement) return null; const value = Number(typedMeasurement.replace(",", ".")); return Number.isFinite(value) && value > 0 ? value : null; }

  function measurementStatus() { const value = measurementValue(); if (value == null) return null; return drag && drag.shape === "circle" ? "Straal: " + value : "Lengte: " + value; }

  function finishDrawing(current) {
    const resolved = current.resolved;
    engine.renderer.preview = null; typedMeasurement = ""; crosshair.hidden = true; crosshair.classList.remove("snapped");
    MI.publishSnapResult(engine, null);
    if (!resolved || resolved.length < 0.05) { render(); setStatus("Vorm te kort; geen object toegevoegd."); return; }
    selectedId = engine.add(resolved.object).id;
    render();
    setStatus(resolved.result.constraint ? (current.shape === "circle" ? "Cirkel met straal " : "Lijnstuk met lengte ") + resolved.length + " toegevoegd." : (current.shape === "circle" ? "Cirkel toegevoegd." : "Lijnstuk toegevoegd."));
  }
  function updateDrawPreview(event) {
    if (!drag || drag.mode !== "draw") return;
    const point = event ? pointerPosition(event) : null;
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) drag.lastRawPoint = point;
    drag.resolved = MI.InteractionResolver.draw(engine, drag.shape, drag.start, drag.lastRawPoint, { exactDistance: measurementValue(), transform: MI.CoordinateTransform.forCanvas(engine) });
    engine.renderer.preview = drag.resolved.preview;
    setStatus(measurementStatus() || (drag.shape === "circle" ? "Typ een straal, bijvoorbeeld 2." : "Typ een lengte, bijvoorbeeld 3."));
    render(); updateCrosshair(drag.resolved.result); MI.publishSnapResult(engine, drag.resolved.result);
  }

  function zoomAt(event) {
    if (drag) return;
    event.preventDefault();
    if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return;
    const p = pointerPosition(event); if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const r = engine.renderer, b = r.bounds;
    let factor = event.deltaY < 0 ? 0.85 : 1 / 0.85;
    if (event.deltaY < 0 && Number.isFinite(MI.adaptiveGridMaxScale)) {
      factor = Math.max(factor, r.scale() / MI.adaptiveGridMaxScale);
      if (factor >= 1) return;
    }
    const nx = (b.xMax - b.xMin) * factor, ny = (b.yMax - b.yMin) * factor;
    const fx = (p.x - b.xMin) / (b.xMax - b.xMin), fy = (p.y - b.yMin) / (b.yMax - b.yMin);
    try {
      r.setBounds({ xMin: p.x - fx * nx, xMax: p.x + (1 - fx) * nx, yMin: p.y - fy * ny, yMax: p.y + (1 - fy) * ny });
    } catch (error) { setStatus(error.message); return; }
    render();
  }
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
    let originalOffsetX = object.labelOffsetX == null ? NaN : Number(object.labelOffsetX);
    let originalOffsetY = object.labelOffsetY == null ? NaN : Number(object.labelOffsetY);
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
    if (event.button !== 0) return; event.preventDefault(); const p = pointerPosition(event); if (!p) return; const transform = MI.CoordinateTransform.forCanvas(engine);
    if (tool === "point") { const snap = snapToPoint(p); selectedId = engine.add({ type: "point", x: snap.point.x, y: snap.point.y }).id; render(); setStatus(snap.snapped ? (snap.grid ? "Punt vastgeklikt op rasterpunt." : "Punt vastgeklikt aan bestaand punt.") : "Punt toegevoegd."); return; }
    if (tool === "text") { const text = global.prompt("Tekst voor de illustratie:", "A"); if (text !== null && text.trim()) { const snap = snapToPoint(p); selectedId = engine.add({ type: "text", x: snap.point.x, y: snap.point.y, text: text.trim() }).id; render(); setStatus("Tekst toegevoegd."); } return; }
    if (tool === "line" || tool === "circle") {
      const snap = snapToPoint(p); typedMeasurement = "";
      drag = { mode: "draw", shape: tool, start: snap.point, transform, lastRawPoint: { ...snap.point }, resolved: null };
      updateDrawPreview(); return;
    }
    const hit = engine.selectAt(p.x, p.y, 0.18);
    if (hit) { const object = engine.get(hit.object.id); drag = { mode: "object", objectId: object.id, objectType: object.type, startClientX: event.clientX, startClientY: event.clientY, transform: transform, original: JSON.parse(JSON.stringify(object)) }; selectedId = object.id; setStatus("Object geselecteerd."); }
    else { drag = { mode: "pan", startClientX: event.clientX, startClientY: event.clientY, transform: transform, bounds: { ...engine.renderer.bounds } }; selectedId = null; setStatus("Canvas verschuiven."); }
    render();
  });

  global.addEventListener("mousemove", function (event) {
    if (!drag) {
      if (tool !== "select" && (!event.target || canvasWrap.contains(event.target))) {
        const point = pointerPosition(event); if (point) MI.publishSnapResult(engine, snapToPoint(point));
      }
      return;
    }
    if (drag.mode === "label") {
      const object = engine.get(drag.objectId);
      if (!object) return;
      const scale = engine.renderer.scale() || 1;
      engine.update(object.id, { labelOffsetX: drag.originalOffsetX + (event.clientX - drag.startClientX) / scale, labelOffsetY: drag.originalOffsetY - (event.clientY - drag.startClientY) / scale });
      render();
      return;
    }
    if (drag.mode === "draw") { updateDrawPreview(event); return; }
    const delta = mathDeltaFromScreen(event.clientX - drag.startClientX, event.clientY - drag.startClientY, drag.transform);
    if (drag.mode === "object") {
      const o = drag.original; let result;
      if (o.type === "line") {
        const resolved = MI.InteractionResolver.translateLine(engine, o, delta, { transform: MI.CoordinateTransform.forCanvas(engine) });
        engine.update(drag.objectId, resolved.patch); result = resolved.result;
      } else {
        const raw = o.type === "circle" ? { x: o.cx + delta.x, y: o.cy + delta.y } : { x: o.x + delta.x, y: o.y + delta.y };
        result = snapToPoint(raw, drag.objectId);
        engine.update(drag.objectId, o.type === "circle" ? { cx: result.point.x, cy: result.point.y } : { x: result.point.x, y: result.point.y });
      }
      render(); MI.publishSnapResult(engine, result); return;
    }
    if (drag.mode === "pan") {
      const original = drag.bounds, dx = delta.x, dy = delta.y;
      try { engine.renderer.setBounds({ xMin: original.xMin - dx, xMax: original.xMax - dx, yMin: original.yMin - dy, yMax: original.yMax - dy }); }
      catch (error) { setStatus(error.message); return; }
      render();
    }
  });

  global.addEventListener("mouseup", function () {
    if (!drag) { MI.publishSnapResult(engine, null); return; }
    const current = drag; drag = null; crosshair.hidden = true; crosshair.classList.remove("snapped");
    if (current.mode === "draw") { finishDrawing(current); return; }
    MI.publishSnapResult(engine, null);
    if (current.mode === "pan") setStatus("Canvas verschoven.");
    if (current.mode === "label") setStatus("Label verplaatst.");
  });
  global.addEventListener("fzi:geometry-changed", render);

  viewList.addEventListener("click", function (event) {
    const eye = event.target.closest("[data-object-visibility]"); if (eye) { const object = engine.get(eye.dataset.objectVisibility); if (object) { engine.update(object.id, { visible: object.visible === false }); render(); } return; }
    const labelButton = event.target.closest("[data-toggle-label]"); if (labelButton) { const object = engine.get(labelButton.dataset.toggleLabel); if (object) { engine.update(object.id, { showLabel: object.showLabel !== true }); render(); } return; }
    const selector = event.target.closest("[data-select-object]"); if (selector) { selectedId = selector.dataset.selectObject; render(); setStatus("Object geselecteerd."); return; }
  });
  viewList.addEventListener("click", function (event) { const system = event.target.closest("[data-view]"); if (!system) return; if (system.dataset.view === "axes") engine.renderer.showAxes = !engine.renderer.showAxes; if (system.dataset.view === "grid") engine.renderer.showGrid = !engine.renderer.showGrid; render(); });

  document.getElementById("toolGrid").addEventListener("click", (event) => { const button = event.target.closest("[data-tool]"); if (button) activateTool(button.dataset.tool); });
  document.getElementById("resetViewBtn").addEventListener("click", resetView);
  titleInput.addEventListener("input", render); descriptionInput.addEventListener("input", render);

  document.getElementById("newBtn").addEventListener("click", function () {
    if (!global.confirm("Een nieuwe illustratie starten? Het opgeslagen concept en niet-opgeslagen wijzigingen worden verwijderd.")) return;
    let storageError = null;
    try { MI.DraftStore.clear(localStorage); } catch (error) { storageError = error; }
    const r = engine.renderer; engine = createEngine(); engine.renderer.showAxes = r.showAxes; engine.renderer.showGrid = r.showGrid;
    selectedId = null; titleInput.value = ""; descriptionInput.value = ""; render();
    setStatus(storageError ? "Nieuwe illustratie gestart. Opgeslagen concept kon niet worden gewist: " + storageError.message : "Nieuwe illustratie gestart.");
  });
  document.getElementById("saveBtn").addEventListener("click", () => {
    updateMeta();
    try { MI.DraftStore.save(engine, localStorage); setStatus("Concept opgeslagen in deze browser."); }
    catch (error) { setStatus("Concept kon niet worden opgeslagen: " + error.message); }
  });
  document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());
  document.getElementById("fileInput").addEventListener("change", function (event) { const file = event.target.files && event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = function () { try { engine.load(JSON.parse(reader.result)); titleInput.value = engine.model.meta.title || ""; descriptionInput.value = engine.model.meta.description || ""; selectedId = null; render(); setStatus("Illustratie geladen."); } catch (error) { global.alert("JSON kon niet worden geladen: " + error.message); } event.target.value = ""; }; reader.readAsText(file); });

  function download(name, content, type) { const blob = new Blob([content], { type: type }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 500); }
  document.getElementById("exportJsonBtn").addEventListener("click", () => { updateMeta(); download("illustratie.json", engine.toJSONString(true), "application/json;charset=utf-8"); setStatus("JSON geëxporteerd."); });
  document.getElementById("exportSvgBtn").addEventListener("click", () => { updateMeta(); download("illustratie.svg", engine.renderSVG(), "image/svg+xml;charset=utf-8"); setStatus("SVG geëxporteerd."); });

  global.addEventListener("keydown", function (event) {
    if (drag && drag.mode === "draw" && /^[0-9.,]$/.test(event.key)) { typedMeasurement += event.key === "," ? "." : event.key; updateDrawPreview(); event.preventDefault(); return; }
    if (drag && drag.mode === "draw" && event.key === "Backspace") { typedMeasurement = typedMeasurement.slice(0, -1); updateDrawPreview(); event.preventDefault(); return; }
    if (drag && drag.mode === "draw" && event.key === "Enter") { const current = drag; drag = null; finishDrawing(current); event.preventDefault(); return; }
    if ((event.key === "Delete" || event.key === "Backspace") && selectedId && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { engine.remove(selectedId); selectedId = null; render(); setStatus("Object verwijderd."); }
    if (event.key === "Escape") { drag = null; typedMeasurement = ""; engine.renderer.preview = null; crosshair.hidden = true; crosshair.classList.remove("snapped"); MI.publishSnapResult(engine, null); activateTool("select"); render(); }
  });

  try {
    if (MI.DraftStore.restore(engine, localStorage)) {
      titleInput.value = engine.model.meta.title || ""; descriptionInput.value = engine.model.meta.description || "";
      setStatus("Opgeslagen concept geladen.");
    }
  } catch (error) { setStatus("Concept kon niet worden geladen; opgeslagen gegevens zijn behouden: " + error.message); }
  render();
})(window);