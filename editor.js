/*
 * From Zero 2 Infinity — Mathematical Illustration Editor
 *
 * Thin authoring UI around the Mathematical Illustration Engine.
 * It stores the mathematical model, not a screenshot of the canvas.
 */
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

  let engine = new MI.Engine(null, {
    width: 1000,
    height: 650,
    bounds: { xMin: 0, yMin: 0, xMax: 10, yMax: 6 },
    background: "#f7f7f4",
    padding: 30
  });
  let tool = "select";
  let selectedId = null;
  let drag = null;

  function setStatus(message) { status.textContent = message; }

  // Convert browser coordinates to the SVG user coordinate system first,
  // then invert the renderer's mathematical mapping. This accounts for
  // both CSS scaling and the renderer's internal padding.
  function pointerPosition(event) {
    const svg = canvas.querySelector("svg");
    if (!svg) return null;

    const matrix = svg.getScreenCTM();
    if (!matrix) return null;

    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const renderer = engine.renderer;
    const b = renderer.bounds;
    const drawableWidth = renderer.width - renderer.padding * 2;
    const drawableHeight = renderer.height - renderer.padding * 2;

    return {
      x: b.xMin + ((point.x - renderer.padding) / drawableWidth) * (b.xMax - b.xMin),
      y: b.yMin + ((renderer.height - renderer.padding - point.y) / drawableHeight) * (b.yMax - b.yMin)
    };
  }

  function updateMeta() {
    engine.model.meta.title = titleInput.value.trim();
    engine.model.meta.description = descriptionInput.value.trim();
  }

  function objectLabel(object) {
    return object.label ? " · " + object.label : "";
  }

  function render() {
    updateMeta();
    canvas.innerHTML = engine.renderSVG();
    objectCount.textContent = engine.model.objects.length + (engine.model.objects.length === 1 ? " object" : " objecten");

    if (selectedId) {
      const selected = canvas.querySelector('[data-object-id="' + CSS.escape(selectedId) + '"]');
      if (selected) selected.classList.add("selected");
    }
    renderSelectionPanel();
  }

  function select(id) {
    selectedId = id || null;
    render();
  }

  function renderSelectionPanel() {
    const object = selectedId ? engine.get(selectedId) : null;
    if (!object) {
      selectionPanel.className = "selection-empty";
      selectionPanel.textContent = "Geen object geselecteerd.";
      return;
    }

    selectionPanel.className = "selection-panel";
    let html = "<div><strong>" + object.type + "</strong> <code>" + object.id + "</code>" + objectLabel(object) + "</div>";

    if (object.type === "point" || object.type === "text") {
      html += field("x", object.x, "x") + field("y", object.y, "y");
    }
    if (object.type === "line") {
      html += field("x₁", object.x1, "x1") + field("y₁", object.y1, "y1") + field("x₂", object.x2, "x2") + field("y₂", object.y2, "y2");
    }
    if (object.type === "circle") {
      html += field("cx", object.cx, "cx") + field("cy", object.cy, "cy") + field("r", object.r, "r");
    }
    if (object.type === "text") {
      html += '<label>Tekst<input data-edit="text" value="' + MI.escapeXml(object.text) + '"></label>';
    }
    if (object.label != null) {
      html += '<label>Label<input data-edit="label" value="' + MI.escapeXml(object.label) + '"></label>';
    }
    html += '<button class="delete-btn" id="deleteSelected">Verwijder object</button>';
    selectionPanel.innerHTML = html;

    selectionPanel.querySelectorAll("[data-edit]").forEach(function (input) {
      input.addEventListener("change", function () {
        const patch = {};
        patch[input.dataset.edit] = input.type === "text" ? input.value : Number(input.value);
        engine.update(object.id, patch);
        render();
      });
    });
    const deleteButton = document.getElementById("deleteSelected");
    if (deleteButton) deleteButton.addEventListener("click", function () {
      engine.remove(object.id);
      selectedId = null;
      render();
      setStatus("Object verwijderd.");
    });
  }

  function field(label, value, key) {
    return '<div class="row"><span>' + label + '</span><input data-edit="' + key + '" type="number" step="any" value="' + Number(value) + '"></div>';
  }

  function activateTool(next) {
    tool = next;
    document.querySelectorAll(".tool").forEach(function (button) {
      button.classList.toggle("active", button.dataset.tool === tool);
    });
    setStatus(tool === "select" ? "Selecteer een object." : "Teken: " + tool + ".");
  }

  function finishLine(start, end) {
    if (Math.hypot(end.x - start.x, end.y - start.y) < 0.05) return;
    selectedId = engine.add({ type: "line", x1: start.x, y1: start.y, x2: end.x, y2: end.y }).id;
    render();
    setStatus("Lijnstuk toegevoegd.");
  }

  function finishCircle(center, edge) {
    const r = Math.hypot(edge.x - center.x, edge.y - center.y);
    if (r < 0.05) return;
    selectedId = engine.add({ type: "circle", cx: center.x, cy: center.y, r: r }).id;
    render();
    setStatus("Cirkel toegevoegd.");
  }

  canvasWrap.addEventListener("mousedown", function (event) {
    if (event.button !== 0) return;
    const p = pointerPosition(event);
    if (!p) return;

    if (tool === "point") {
      selectedId = engine.add({ type: "point", x: p.x, y: p.y }).id;
      render();
      setStatus("Punt toegevoegd.");
      return;
    }

    if (tool === "text") {
      const text = global.prompt("Tekst voor de illustratie:", "A");
      if (text !== null && text.trim()) {
        selectedId = engine.add({ type: "text", x: p.x, y: p.y, text: text.trim() }).id;
        render();
        setStatus("Tekst toegevoegd.");
      }
      return;
    }

    if (tool === "line" || tool === "circle") {
      drag = { start: p };
      crosshair.hidden = false;
      crosshair.style.left = event.clientX - canvasWrap.getBoundingClientRect().left + "px";
      crosshair.style.top = event.clientY - canvasWrap.getBoundingClientRect().top + "px";
      return;
    }

    const hit = engine.selectAt(p.x, p.y, 0.18);
    if (hit) {
      selectedId = hit.object.id;
      drag = { start: p, objectId: selectedId };
      setStatus("Object geselecteerd.");
    } else {
      selectedId = null;
      setStatus("Geen object geselecteerd.");
    }
    render();
  });

  global.addEventListener("mousemove", function (event) {
    if (!drag) return;
    const p = pointerPosition(event);
    if (!p) return;

    if (tool === "line" || tool === "circle") {
      crosshair.hidden = false;
      const rect = canvasWrap.getBoundingClientRect();
      crosshair.style.left = event.clientX - rect.left + "px";
      crosshair.style.top = event.clientY - rect.top + "px";
      return;
    }

    if (tool === "select" && drag.objectId) {
      engine.move(drag.objectId, p.x, p.y);
      render();
    }
  });

  global.addEventListener("mouseup", function (event) {
    if (!drag) return;
    const end = pointerPosition(event);
    const current = drag;
    drag = null;
    crosshair.hidden = true;
    if (!end) return;

    if (tool === "line") finishLine(current.start, end);
    if (tool === "circle") finishCircle(current.start, end);
  });

  document.getElementById("toolGrid").addEventListener("click", function (event) {
    const button = event.target.closest("[data-tool]");
    if (button) activateTool(button.dataset.tool);
  });

  titleInput.addEventListener("input", render);
  descriptionInput.addEventListener("input", render);

  document.getElementById("newBtn").addEventListener("click", function () {
    if (!global.confirm("Een nieuwe illustratie starten? Niet-opgeslagen wijzigingen gaan verloren.")) return;
    engine = new MI.Engine(null, engine.renderer);
    selectedId = null;
    titleInput.value = "";
    descriptionInput.value = "";
    render();
    setStatus("Nieuwe illustratie gestart.");
  });

  document.getElementById("saveBtn").addEventListener("click", function () {
    updateMeta();
    localStorage.setItem(STORAGE_KEY, engine.toJSONString(true));
    setStatus("Concept opgeslagen in deze browser.");
  });

  document.getElementById("loadBtn").addEventListener("click", function () {
    document.getElementById("fileInput").click();
  });

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
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  document.getElementById("exportJsonBtn").addEventListener("click", function () {
    updateMeta();
    download("illustratie.json", engine.toJSONString(true), "application/json;charset=utf-8");
    setStatus("JSON geëxporteerd.");
  });

  document.getElementById("exportSvgBtn").addEventListener("click", function () {
    updateMeta();
    download("illustratie.svg", engine.renderSVG(), "image/svg+xml;charset=utf-8");
    setStatus("SVG geëxporteerd.");
  });

  global.addEventListener("keydown", function (event) {
    if ((event.key === "Delete" || event.key === "Backspace") && selectedId && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
      engine.remove(selectedId);
      selectedId = null;
      render();
      setStatus("Object verwijderd.");
    }
    if (event.key === "Escape") {
      drag = null;
      crosshair.hidden = true;
      activateTool("select");
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
