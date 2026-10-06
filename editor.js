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
  const xMinInput = document.getElementById("xMinInput");
  const xMaxInput = document.getElementById("xMaxInput");
  const yMinInput = document.getElementById("yMinInput");
  const yMaxInput = document.getElementById("yMaxInput");

  let engine = new MI.Engine(null, {
    width: 1000,
    height: 650,
    bounds: { xMin: -5, yMin: -3, xMax: 5, yMax: 3 },
    background: "#f7f7f4",
    padding: 30,
    showAxes: true,
    showGrid: false,
    axisStep: 1
  });

  let tool = "select";
  let selectedId = null;
  let drag = null;
  let typedMeasurement = "";

  function setStatus(message) { status.textContent = message; }
  function fmt(value) { return Number(value).toFixed(1); }

  function eyeIcon(visible) {
    if (visible) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" fill="currentColor"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M9.9 5.9C10.6 5.7 11.3 5.6 12 5.6c6.5 0 10 6.4 10 6.4-.8 1.2-1.8 2.4-3.1 3.4M6.1 6.1C3.5 7.7 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function objectName(object) {
    const names = { point: "Punt", line: "Lijnstuk", circle: "Cirkel", text: "Tekst" };
    return (object.label ? names[object.type] + " " + object.label : names[object.type]) || object.type;
  }

  function updateBoundsInputs() {
    const b = engine.renderer.bounds;
    xMinInput.value = fmt(b.xMin);
    xMaxInput.value = fmt(b.xMax);
    yMinInput.value = fmt(b.yMin);
    yMaxInput.value = fmt(b.yMax);
  }

  function applyVisibilityToCanvas() {
    engine.model.objects.forEach((object) => {
      const group = canvas.querySelector('[data-object-id="' + CSS.escape(object.id) + '"]');
      if (group) group.style.display = object.visible === false ? "none" : "";
    });
  }

  function renderViewList() {
    const rows = [];
    rows.push('<div class="view-row"><span class="view-name">Assenstelsel</span><button class="eye-btn" type="button" data-view="axes" aria-label="Assenstelsel zichtbaar">' + eyeIcon(engine.renderer.showAxes) + '</button></div>');
    rows.push('<div class="view-row"><span class="view-name">Raster</span><button class="eye-btn" type="button" data-view="grid" aria-label="Raster zichtbaar">' + eyeIcon(engine.renderer.showGrid) + '</button></div>');
    if (engine.model.objects.length) rows.push('<div class="view-divider"></div>');

    engine.model.objects.forEach((object) => {
      const visible = object.visible !== false;
      rows.push('<div class="view-row"><span class="view-name" title="' + MI.escapeXml(objectName(object)) + '">' +
        MI.escapeXml(objectName(object)) + '<span class="view-type">' + MI.escapeXml(object.id) + '</span></span>' +
        '<button class="eye-btn' + (visible ? "" : " hidden-eye") + '" type="button" data-object-visibility="' +
        MI.escapeXml(object.id) + '" aria-label="' + (visible ? "Verberg " : "Toon ") + MI.escapeXml(objectName(object)) + '">' +
        eyeIcon(visible) + '</button></div>');
    });

    viewList.innerHTML = rows.join("");
  }

  function render() {
    updateMeta();
    canvas.innerHTML = engine.renderSVG();
    applyVisibilityToCanvas();
    objectCount.textContent = engine.model.objects.length + (engine.model.objects.length === 1 ? " object" : " objecten");
    updateBoundsInputs();
    renderViewList();

    if (selectedId) {
      const selected = canvas.querySelector('[data-object-id="' + CSS.escape(selectedId) + '"]');
      if (selected) selected.classList.add("selected");
    }
    renderSelectionPanel();
  }

  function renderSelectionPanel() {
    const object = selectedId ? engine.get(selectedId) : null;
    if (!object) {
      selectionPanel.className = "selection-empty";
      selectionPanel.textContent = "Geen object geselecteerd.";
      return;
    }

    selectionPanel.className = "selection-panel";
    let html = "<div><strong>" + object.type + "</strong> <code>" + object.id + "</code>" + (object.label ? " · " + object.label : "") + "</div>";
    if (object.type === "point" || object.type === "text") html += field("x", object.x, "x") + field("y", object.y, "y");
    if (object.type === "line") html += field("x₁", object.x1, "x1") + field("y₁", object.y1, "y1") + field("x₂", object.x2, "x2") + field("y₂", object.y2, "y2");
    if (object.type === "circle") html += field("cx", object.cx, "cx") + field("cy", object.cy, "cy") + field("r", object.r, "r");
    if (object.type === "text") html += '<label>Tekst<input data-edit="text" value="' + MI.escapeXml(object.text) + '"></label>';
    if (object.label != null) html += '<label>Label<input data-edit="label" value="' + MI.escapeXml(object.label) + '"></label>';
    html += '<button class="delete-btn" id="deleteSelected">Verwijder object</button>';
    selectionPanel.innerHTML = html;

    selectionPanel.querySelectorAll("[data-edit]").forEach((input) => {
      input.addEventListener("change", () => {
        const patch = {};
        patch[input.dataset.edit] = input.type === "text" ? input.value : Number(input.value);
        engine.update(object.id, patch);
        render();
      });
    });

    const deleteButton = document.getElementById("deleteSelected");
    if (deleteButton) deleteButton.addEventListener("click", () => {
      engine.remove(object.id);
      selectedId = null;
      render();
      setStatus("Object verwijderd.");
    });
  }

  function field(label, value, key) {
    return '<div class="row"><span>' + label + '</span><input data-edit="' + key + '" type="number" step="0.1" value="' + fmt(value) + '"></div>';
  }

  function updateMeta() {
    engine.model.meta.title = titleInput.value.trim();
    engine.model.meta.description = descriptionInput.value.trim();
  }

  function activateTool(next) {
    tool = next;
    typedMeasurement = "";
    document.querySelectorAll(".tool").forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
    setStatus(tool === "select" ? "Selecteer een object of verschuif het canvas." : "Teken: " + tool + ".");
  }

  function mathUnitsPerPixel() {
    const r = engine.renderer;
    const b = r.bounds;
    return Math.max((b.xMax - b.xMin) / (r.width - r.padding * 2), (b.yMax - b.yMin) / (r.height - r.padding * 2));
  }

  function snapToPoint(point, excludeId) {
    const tolerance = mathUnitsPerPixel() * 14;
    let best = null;
    let bestDistance = Infinity;
    engine.model.objects.forEach((object) => {
      if (object.type !== "point" || object.visible === false || object.id === excludeId) return;
      const distance = Math.hypot(point.x - object.x, point.y - object.y);
      if (distance <= tolerance && distance < bestDistance) {
        best = object;
        bestDistance = distance;
      }
    });
    return best ? { point: { x: best.x, y: best.y }, snapped: true, object: best } : { point: point, snapped: false, object: null };
  }

  function pointerPosition(event) {
    const svg = canvas.querySelector("svg");
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const r = engine.renderer;
    const b = r.bounds;
    const dw = r.width - r.padding * 2;
    const dh = r.height - r.padding * 2;
    return {
      x: b.xMin + ((p.x - r.padding) / dw) * (b.xMax - b.xMin),
      y: b.yMin + ((r.height - r.padding - p.y) / dh) * (b.yMax - b.yMin)
    };
  }

  function screenPosition(point) {
    const svg = canvas.querySelector("svg");
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const r = engine.renderer;
    const b = r.bounds;
    const dw = r.width - r.padding * 2;
    const dh = r.height - r.padding * 2;
    const svgX = r.padding + ((point.x - b.xMin) / (b.xMax - b.xMin)) * dw;
    const svgY = r.height - r.padding - ((point.y - b.yMin) / (b.yMax - b.yMin)) * dh;
    const p = new DOMPoint(svgX, svgY).matrixTransform(matrix);
    const wrap = canvasWrap.getBoundingClientRect();
    return { x: p.x - wrap.left, y: p.y - wrap.top };
  }

  function updateCrosshair(event, snap) {
    const r = canvasWrap.getBoundingClientRect();
    let position = { x: event.clientX - r.left, y: event.clientY - r.top };
    if (snap && snap.snapped) position = screenPosition(snap.point) || position;
    crosshair.style.left = position.x + "px";
    crosshair.style.top = position.y + "px";
    crosshair.classList.toggle("snapped", Boolean(snap && snap.snapped));
  }

  function measurementValue() {
    if (!typedMeasurement) return null;
    const value = Number(typedMeasurement);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function constrainedEndpoint(start, mousePoint) {
    const value = measurementValue();
    if (value == null) return mousePoint;

    let dx = mousePoint.x - start.x;
    let dy = mousePoint.y - start.y;
    const directionLength = Math.hypot(dx, dy);
    if (directionLength < 1e-9) {
      dx = 1;
      dy = 0;
    } else {
      dx /= directionLength;
      dy /= directionLength;
    }
    return { x: start.x + dx * value, y: start.y + dy * value };
  }

  function measurementStatus() {
    const value = measurementValue();
    if (value == null) return null;
    return drag && drag.shape === "circle" ? "Straal: " + value : "Lengte: " + value;
  }

  function finishLine(start, end) {
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    if (length < 0.05) return;
    const requestedLength = measurementValue();
    engine.renderer.preview = null;
    selectedId = engine.add({ type: "line", x1: start.x, y1: start.y, x2: end.x, y2: end.y }).id;
    render();
    setStatus(requestedLength != null ? "Lijnstuk met lengte " + requestedLength + " toegevoegd." : "Lijnstuk toegevoegd.");
  }

  function finishCircle(center, end) {
    const requestedRadius = measurementValue();
    const radius = requestedRadius != null ? requestedRadius : Math.hypot(end.x - center.x, end.y - center.y);
    if (radius < 0.05) return;
    engine.renderer.preview = null;
    selectedId = engine.add({ type: "circle", cx: center.x, cy: center.y, r: radius }).id;
    render();
    setStatus(requestedRadius != null ? "Cirkel met straal " + requestedRadius + " toegevoegd." : "Cirkel toegevoegd.");
  }

  function updateDrawPreview(event) {
    if (!drag || drag.mode !== "draw") return;
    const mousePoint = pointerPosition(event);
    if (!mousePoint) return;

    const snap = snapToPoint(mousePoint);
    const end = constrainedEndpoint(drag.start, snap.point);
    engine.renderer.preview.end = end;
    updateCrosshair(event, measurementValue() == null ? snap : { point: end, snapped: false });
    setStatus(measurementStatus() || (drag.shape === "circle" ? "Typ een straal, bijvoorbeeld 2." : "Typ een lengte, bijvoorbeeld 3."));
    render();
  }

  function applyBounds() {
    const xmin = Number(xMinInput.value);
    const xmax = Number(xMaxInput.value);
    const ymin = Number(yMinInput.value);
    const ymax = Number(yMaxInput.value);
    if (!Number.isFinite(xmin) || !Number.isFinite(xmax) || !Number.isFinite(ymin) || !Number.isFinite(ymax) || xmin >= xmax || ymin >= ymax) {
      setStatus("Ongeldig coördinatenbereik.");
      updateBoundsInputs();
      return;
    }
    engine.renderer.bounds = { xMin: xmin, yMin: ymin, xMax: xmax, yMax: ymax };
    render();
    setStatus("Coördinatenbereik toegepast.");
  }

  function zoomAt(event) {
    if (drag) return;
    event.preventDefault();
    const p = pointerPosition(event);
    if (!p) return;
    const b = engine.renderer.bounds;
    const factor = event.deltaY < 0 ? 0.85 : 1 / 0.85;
    const nx = (b.xMax - b.xMin) * factor;
    const ny = (b.yMax - b.yMin) * factor;
    const fx = (p.x - b.xMin) / (b.xMax - b.xMin);
    const fy = (p.y - b.yMin) / (b.yMax - b.yMin);
    engine.renderer.bounds = {
      xMin: p.x - fx * nx,
      xMax: p.x + (1 - fx) * nx,
      yMin: p.y - fy * ny,
      yMax: p.y + (1 - fy) * ny
    };
    render();
  }

  function toggleView(kind) {
    if (kind === "axes") engine.renderer.showAxes = !engine.renderer.showAxes;
    if (kind === "grid") engine.renderer.showGrid = !engine.renderer.showGrid;
    render();
  }

  viewList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-view], button[data-object-visibility]");
    if (!button) return;
    if (button.dataset.view) {
      toggleView(button.dataset.view);
      return;
    }
    const object = engine.get(button.dataset.objectVisibility);
    if (!object) return;
    engine.update(object.id, { visible: object.visible === false });
    render();
  });

  canvasWrap.addEventListener("wheel", zoomAt, { passive: false });

  canvasWrap.addEventListener("mousedown", function (event) {
    if (event.button !== 0) return;
    event.preventDefault();
    const p = pointerPosition(event);
    if (!p) return;

    if (tool === "point") {
      const snap = snapToPoint(p);
      selectedId = engine.add({ type: "point", x: snap.point.x, y: snap.point.y }).id;
      render();
      setStatus(snap.snapped ? "Punt vastgeklikt aan bestaand punt." : "Punt toegevoegd.");
      return;
    }

    if (tool === "text") {
      const text = global.prompt("Tekst voor de illustratie:", "A");
      if (text !== null && text.trim()) {
        const snap = snapToPoint(p);
        selectedId = engine.add({ type: "text", x: snap.point.x, y: snap.point.y, text: text.trim() }).id;
        render();
        setStatus("Tekst toegevoegd.");
      }
      return;
    }

    if (tool === "line" || tool === "circle") {
      const snap = snapToPoint(p);
      drag = { mode: "draw", shape: tool, start: snap.point };
      typedMeasurement = "";
      engine.renderer.preview = { type: tool, start: snap.point, end: snap.point };
      crosshair.hidden = false;
      updateCrosshair(event, snap);
      render();
      setStatus(tool === "circle" ? "Typ tijdens het tekenen een straal, bijvoorbeeld 2." : "Typ tijdens het tekenen een lengte, bijvoorbeeld 3.");
      return;
    }

    const hit = engine.selectAt(p.x, p.y, 0.18);
    if (hit) {
      selectedId = hit.object.id;
      drag = { mode: "object", objectId: selectedId, start: p, objectType: hit.object.type };
      setStatus("Object geselecteerd.");
    } else {
      selectedId = null;
      drag = { mode: "pan", start: p, bounds: { ...engine.renderer.bounds } };
      setStatus("Canvas verschuiven.");
    }
    render();
  });

  global.addEventListener("mousemove", function (event) {
    if (!drag) return;
    const p = pointerPosition(event);
    if (!p) return;

    if (drag.mode === "draw") {
      updateDrawPreview(event);
      return;
    }

    if (drag.mode === "object") {
      if (drag.objectType === "point") {
        const snap = snapToPoint(p, drag.objectId);
        engine.move(drag.objectId, snap.point.x, snap.point.y);
      } else {
        engine.move(drag.objectId, p.x, p.y);
      }
      render();
      return;
    }

    if (drag.mode === "pan") {
      const start = drag.start;
      const original = drag.bounds;
      const dx = start.x - p.x;
      const dy = start.y - p.y;
      engine.renderer.bounds = {
        xMin: original.xMin + dx,
        xMax: original.xMax + dx,
        yMin: original.yMin + dy,
        yMax: original.yMax + dy
      };
      render();
    }
  });

  global.addEventListener("mouseup", function (event) {
    if (!drag) return;
    const current = drag;
    const end = pointerPosition(event);
    drag = null;
    crosshair.hidden = true;
    crosshair.classList.remove("snapped");

    if (current.mode === "draw") {
      if (!end) {
        engine.renderer.preview = null;
        typedMeasurement = "";
        render();
        return;
      }

      const snap = snapToPoint(end);
      const finalEnd = measurementValue() != null ? constrainedEndpoint(current.start, snap.point) : snap.point;
      if (current.shape === "line") finishLine(current.start, finalEnd);
      if (current.shape === "circle") finishCircle(current.start, finalEnd);
      typedMeasurement = "";
      return;
    }

    if (current.mode === "pan") setStatus("Canvas verschoven.");
  });

  document.getElementById("toolGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tool]");
    if (button) activateTool(button.dataset.tool);
  });

  document.getElementById("applyBoundsBtn").addEventListener("click", applyBounds);
  [xMinInput, xMaxInput, yMinInput, yMaxInput].forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") applyBounds();
    });
  });

  titleInput.addEventListener("input", render);
  descriptionInput.addEventListener("input", render);

  document.getElementById("newBtn").addEventListener("click", function () {
    if (!global.confirm("Een nieuwe illustratie starten? Niet-opgeslagen wijzigingen gaan verloren.")) return;
    const r = engine.renderer;
    engine = new MI.Engine(null, {
      width: r.width,
      height: r.height,
      bounds: { xMin: -5, yMin: -3, xMax: 5, yMax: 3 },
      background: r.background,
      padding: r.padding,
      showAxes: r.showAxes,
      showGrid: r.showGrid,
      axisStep: r.axisStep
    });
    selectedId = null;
    drag = null;
    typedMeasurement = "";
    titleInput.value = "";
    descriptionInput.value = "";
    render();
    setStatus("Nieuwe illustratie gestart.");
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    updateMeta();
    localStorage.setItem(STORAGE_KEY, engine.toJSONString(true));
    setStatus("Concept opgeslagen in deze browser.");
  });

  document.getElementById("loadBtn").addEventListener("click", () => document.getElementById("fileInput").click());

  document.getElementById("fileInput").addEventListener("change", function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        engine.load(JSON.parse(reader.result));
        titleInput.value = engine.model.meta.title || "";
        descriptionInput.value = engine.model.meta.description || "";
        selectedId = null;
        drag = null;
        typedMeasurement = "";
        render();
        setStatus("Illustratie geladen.");
      } catch (error) {
        global.alert("JSON kon niet worden geladen: " + error.message);
      }
      event.target.value = "";
    };
    reader.readAsText(file);
  });

  function download(name, content, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  document.getElementById("exportJsonBtn").addEventListener("click", () => {
    updateMeta();
    download("illustratie.json", engine.toJSONString(true), "application/json;charset=utf-8");
    setStatus("JSON geëxporteerd.");
  });

  document.getElementById("exportSvgBtn").addEventListener("click", () => {
    updateMeta();
    download("illustratie.svg", engine.renderSVG(), "image/svg+xml;charset=utf-8");
    setStatus("SVG geëxporteerd.");
  });

  global.addEventListener("keydown", function (event) {
    if (drag && drag.mode === "draw") {
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        typedMeasurement += event.key;
        const value = measurementValue();
        setStatus(drag.shape === "circle" ? "Straal: " + (value == null ? typedMeasurement : value) : "Lengte: " + (value == null ? typedMeasurement : value));
        return;
      }

      if (event.key === "." || event.key === ",") {
        event.preventDefault();
        if (!typedMeasurement.includes(".")) typedMeasurement = typedMeasurement || "0";
        typedMeasurement += ".";
        setStatus(drag.shape === "circle" ? "Straal: " + typedMeasurement : "Lengte: " + typedMeasurement);
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();
        typedMeasurement = typedMeasurement.slice(0, -1);
        const value = measurementValue();
        setStatus(value == null ? "Voer een positieve lengte in." : (drag.shape === "circle" ? "Straal: " + value : "Lengte: " + value));
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const value = measurementValue();
        if (value != null && engine.renderer.preview) {
          const mousePoint = pointerPosition(event);
          const previewEnd = mousePoint ? constrainedEndpoint(drag.start, mousePoint) : engine.renderer.preview.end;
          if (drag.shape === "line") finishLine(drag.start, previewEnd);
          else finishCircle(drag.start, previewEnd);
          drag = null;
          typedMeasurement = "";
          engine.renderer.preview = null;
          crosshair.hidden = true;
          crosshair.classList.remove("snapped");
        }
        return;
      }
    }

    if ((event.key === "Delete" || event.key === "Backspace") && selectedId &&
        document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      engine.remove(selectedId);
      selectedId = null;
      render();
      setStatus("Object verwijderd.");
    }

    if (event.key === "Escape") {
      drag = null;
      typedMeasurement = "";
      engine.renderer.preview = null;
      crosshair.hidden = true;
      crosshair.classList.remove("snapped");
      activateTool("select");
      render();
    }
  });

  try {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      engine.load(JSON.parse(draft));
      titleInput.value = engine.model.meta.title || "";
      descriptionInput.value = engine.model.meta.description || "";
      setStatus("Opgeslagen concept geladen.");
    }
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    setStatus("Nieuw werkvlak.");
  }

  render();
})(window);
