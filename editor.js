/* Explicit editor application: one pointer state and one render owner. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  const DEFAULT_BOUNDS = { xMin: -5, xMax: 5, yMin: -3, yMax: 3 };
  const clone = value => JSON.parse(JSON.stringify(value));
  class EditorApp {
    constructor({ engine, services, document, window, storage }) {
      this.engine = engine; this.services = services; this.document = document; this.window = window; this.storage = storage;
      this.tool = "select"; this.selectedId = null; this.interaction = null; this.feedback = null;
      this.listeners = []; this.initialized = false; this.axisMenuOpen = false; this.importSerial = 0; this.reader = null; this.renderFrame = null;
      this.nodes = {};
      for (const id of ["canvas", "canvasWrap", "status", "objectCount", "selectionPanel", "titleInput", "descriptionInput", "crosshair", "viewList", "toolGrid", "resetViewBtn", "newBtn", "saveBtn", "loadBtn", "fileInput", "exportJsonBtn", "exportSvgBtn"]) this.nodes[id] = document.getElementById(id);
    }
    on(target, type, fn, options) {
      if (!target) return;
      target.addEventListener(type, fn, options);
      this.listeners.push(() => target.removeEventListener && target.removeEventListener(type, fn, options));
    }
    status(text) { this.nodes.status.textContent = text; }
    hydrate() { this.nodes.titleInput.value = this.engine.model.meta.title || ""; this.nodes.descriptionInput.value = this.engine.model.meta.description || ""; }
    updateMeta() { this.engine.model.meta.title = this.nodes.titleInput.value.trim(); this.engine.model.meta.description = this.nodes.descriptionInput.value.trim(); }
    transform() { return this.services.transform.forCanvas(this.engine, this.document); }
    pointer(event) { const transform = this.transform(); return transform && transform.screenToMath({ x: event.clientX, y: event.clientY }); }
    snap(point, excludeId) { return this.services.snap.resolve(this.engine, point, { transform: this.transform(), excludeId }); }
    init() {
      if (this.initialized) return this;
      this.initialized = true; this.hydrate();
      const n = this.nodes;
      this.on(n.canvasWrap, "pointerdown", e => this.pointerDown(e));
      this.on(this.window, "pointermove", e => this.pointerMove(e));
      this.on(this.window, "pointerup", e => this.pointerUp(e));
      this.on(this.window, "pointercancel", e => { if (this.interaction && e.pointerId === this.interaction.pointerId) this.cancel(); });
      this.on(n.canvasWrap, "lostpointercapture", e => { if (this.interaction && e.pointerId === this.interaction.pointerId) this.cancel(); });
      this.on(this.window, "blur", () => this.cancel());
      this.on(this.window, "keydown", e => this.keyDown(e));
      this.on(n.canvasWrap, "wheel", e => this.zoom(e), { capture: true, passive: false });
      this.on(n.toolGrid, "click", e => { const button = e.target.closest("[data-tool]"); if (button) this.setTool(button.dataset.tool); });
      this.on(n.viewList, "click", e => this.viewClick(e));
      this.on(n.viewList, "change", e => {
        const input = e.target.closest("[data-axis-setting]");
        if (input) { this.cancel(); this.engine.renderer[input.dataset.axisSetting] = input.checked; this.invalidate(); }
      });
      this.on(this.document, "click", e => { if (this.axisMenuOpen && !e.target.closest('[data-view-select="axes"], [data-axis-settings]')) { this.axisMenuOpen = false; this.invalidate(); } });
      this.on(n.selectionPanel, "change", e => {
        const input = e.target.closest("[data-edit]"); if (!input || !this.selectedId) return;
        this.cancel(); this.engine.update(this.selectedId, { [input.dataset.edit]: input.type === "number" ? Number(input.value) : input.value }); this.invalidate();
      });
      this.on(n.selectionPanel, "click", e => { if (e.target.closest("[data-delete-selected]") && this.selectedId) { this.cancel(); this.engine.remove(this.selectedId); this.selectedId = null; this.invalidate(); } });
      for (const input of [n.titleInput, n.descriptionInput]) this.on(input, "input", () => { this.updateMeta(); this.invalidate(); });
      this.on(n.resetViewBtn, "click", () => { this.cancel(); this.engine.renderer.setBounds({ ...DEFAULT_BOUNDS }); this.invalidate(); });
      this.on(n.newBtn, "click", () => { if (this.window.confirm("Een nieuwe illustratie starten? Het opgeslagen concept en niet-opgeslagen wijzigingen worden verwijderd.")) this.newDocument(); });
      this.on(n.saveBtn, "click", () => { this.cancel(); this.updateMeta(); try { this.services.draft.save(this.engine, this.storage); this.status("Concept opgeslagen in deze browser."); } catch (e) { this.status("Concept kon niet worden opgeslagen: " + e.message); } });
      this.on(n.loadBtn, "click", () => n.fileInput.click());
      this.on(n.fileInput, "change", e => this.importFile(e));
      this.on(n.exportJsonBtn, "click", () => { this.cancel(); this.updateMeta(); this.download("illustratie.json", this.engine.toJSONString(true), "application/json;charset=utf-8"); });
      this.on(n.exportSvgBtn, "click", () => { this.cancel(); this.updateMeta(); this.download("illustratie.svg", this.engine.renderSVG(), "image/svg+xml;charset=utf-8"); });
      if (this.document.createElement && this.document.body) {
        this.colorInput = this.document.createElement("input"); this.colorInput.type = "color"; this.colorInput.dataset.editorColor = "true";
        this.colorInput.style.position = "fixed"; this.colorInput.style.left = "-1000px"; this.document.body.appendChild(this.colorInput);
        this.on(this.colorInput, "input", () => this.setColor(this.colorId, this.colorInput.value));
        this.on(this.colorInput, "change", () => { this.colorId = null; });
      }
      this.invalidate(); return this;
    }
    dispose() {
      this.cancel(); this.initialized = false; this.importSerial++;
      if (this.reader && this.reader.readyState === 1) this.reader.abort(); this.reader = null;
      for (const remove of this.listeners.splice(0)) remove();
      if (this.colorInput) this.colorInput.remove(); this.colorInput = null;
      this.engine.renderer.preview = null; this.feedback = null;
    }
    setTool(tool) { this.cancel(); this.tool = tool; this.invalidate(); }
    begin(state, event) {
      this.interaction = { ...state, pointerId: event.pointerId, selectionBefore: this.selectedId, startScreen: { x: event.clientX, y: event.clientY }, transform: this.transform(), typed: "" };
      if (this.nodes.canvasWrap.setPointerCapture) try { this.nodes.canvasWrap.setPointerCapture(event.pointerId); } catch (_) {}
    }
    release(state) { if (state && this.nodes.canvasWrap.hasPointerCapture && this.nodes.canvasWrap.hasPointerCapture(state.pointerId)) try { this.nodes.canvasWrap.releasePointerCapture(state.pointerId); } catch (_) {} }
    pointerDown(event) {
      if (!this.initialized || this.interaction || event.button !== 0 || event.isPrimary === false) return;
      const point = this.pointer(event); if (!point) return; event.preventDefault();
      const label = event.target && event.target.closest && event.target.closest(".object-label"), handle = event.target && event.target.closest && event.target.closest(".fzi-line-endpoint");
      if (this.tool === "select" && (label || handle)) {
        const id = (label || handle).getAttribute(label ? "data-label-id" : "data-line-id"), object = this.engine.get(id);
        if (!object || object.visible === false) return;
        this.begin({ mode: label ? "label" : "endpoint", id, original: clone(object), endpoint: handle && handle.getAttribute("data-endpoint"), offset: this.labelOffset(object), resolved: null }, event);
        this.selectedId = id; this.invalidate(); return;
      }
      if (this.tool === "point" || this.tool === "text") {
        const result = this.snap(point); const object = { type: this.tool, x: result.point.x, y: result.point.y };
        if (this.tool === "text") { const text = this.window.prompt("Tekst voor de illustratie:", "A"); if (!text || !text.trim()) return; object.text = text.trim(); }
        this.selectedId = this.engine.add(object).id; this.feedback = result; this.invalidate(); return;
      }
      if (this.tool === "line" || this.tool === "circle") {
        const result = this.snap(point);
        this.begin({ mode: "draw", shape: this.tool, start: result.point, lastRawPoint: { ...result.point }, resolved: null }, event);
        this.resolveDraw(); this.invalidate(); return;
      }
      const group = event.target && event.target.closest && event.target.closest('[data-object-id]');
      const painted = group && this.nodes.canvas.contains(group) && this.engine.get(group.getAttribute('data-object-id'));
      const hit = painted && painted.visible !== false ? { object: painted } : this.engine.selectAt(point.x, point.y, .18);
      this.begin(hit ? { mode: "object", id: hit.object.id, original: clone(this.engine.get(hit.object.id)) } : { mode: "pan", bounds: { ...this.engine.renderer.bounds } }, event);
      this.selectedId = hit ? hit.object.id : null; this.invalidate();
    }
    labelOffset(object) {
      if (this.services.labels) return this.services.labels.read(object, this.engine.renderer);
      const scale = this.engine.renderer.scale();
      return { x: object.labelOffsetX != null ? object.labelOffsetX : object.labelDx / scale, y: object.labelOffsetY != null ? object.labelOffsetY : -object.labelDy / scale };
    }
    measurement() { const state = this.interaction, value = state && Number(state.typed); return state && state.typed && Number.isFinite(value) && value > 0 ? value : null; }
    resolveDraw() {
      const state = this.interaction;
      state.resolved = this.services.resolver.draw(this.engine, state.shape, state.start, state.lastRawPoint, { exactDistance: this.measurement(), transform: this.transform() });
      this.engine.renderer.preview = state.resolved.preview; this.feedback = state.resolved.result;
    }
    pointerMove(event) {
      if (!this.initialized) return;
      const state = this.interaction;
      if (!state) {
        if (this.tool !== "select" && (!event.target || this.nodes.canvasWrap.contains(event.target))) { const point = this.pointer(event); if (point) { this.feedback = this.snap(point); this.invalidate(true); } }
        return;
      }
      if (event.pointerId !== state.pointerId) return;
      const point = this.pointer(event); if (!point) return;
      const delta = state.transform.screenDelta(event.clientX - state.startScreen.x, event.clientY - state.startScreen.y); if (!delta) return;
      if (state.mode === "draw") { state.lastRawPoint = point; this.resolveDraw(); }
      if (state.mode === "label") this.engine.update(state.id, { labelOffsetX: state.offset.x + delta.x, labelOffsetY: state.offset.y + delta.y });
      if (state.mode === "endpoint") { state.resolved = this.services.resolver.endpoint(this.engine, state.original, state.endpoint, point, { transform: this.transform() }); this.feedback = state.resolved.result; }
      if (state.mode === "object") {
        const o = state.original;
        if (o.type === "line") { state.resolved = this.services.resolver.translateLine(this.engine, o, delta, { transform: this.transform() }); this.engine.update(state.id, state.resolved.patch); this.feedback = state.resolved.result; }
        else { const result = this.snap(o.type === "circle" ? { x: o.cx + delta.x, y: o.cy + delta.y } : { x: o.x + delta.x, y: o.y + delta.y }, state.id); this.engine.update(state.id, o.type === "circle" ? { cx: result.point.x, cy: result.point.y } : { x: result.point.x, y: result.point.y }); this.feedback = result; }
      }
      if (state.mode === "pan") try { this.engine.renderer.setBounds({ xMin: state.bounds.xMin - delta.x, xMax: state.bounds.xMax - delta.x, yMin: state.bounds.yMin - delta.y, yMax: state.bounds.yMax - delta.y }); } catch (e) { this.status(e.message); return; }
      this.invalidate(true);
    }
    pointerUp(event) {
      if (this.interaction && event.pointerId === this.interaction.pointerId) this.commit();
      else if (!this.interaction && this.feedback && (!event.target || this.nodes.canvasWrap.contains(event.target))) { this.feedback = null; this.invalidate(); }
    }
    commit() {
      const state = this.interaction; if (!state) return;
      this.interaction = null; this.release(state); this.engine.renderer.preview = null; this.feedback = null;
      if (state.mode === "draw") {
        if (state.resolved && state.resolved.length >= .05) this.selectedId = this.engine.add(state.resolved.object).id;
        else this.status("Vorm te kort; geen object toegevoegd.");
      }
      if (state.mode === "endpoint" && state.resolved) this.engine.update(state.id, state.resolved.patch);
      this.invalidate();
    }
    cancel() {
      const state = this.interaction; this.interaction = null;
      if (state) {
        if ((state.mode === "object" || state.mode === "label") && this.engine.get(state.id)) this.engine.update(state.id, state.original);
        if (state.mode === "pan") this.engine.renderer.setBounds(state.bounds);
        this.selectedId = state.selectionBefore; this.release(state);
      }
      this.engine.renderer.preview = null; this.feedback = null;
      if (this.initialized) this.invalidate();
    }
    keyDown(event) {
      const state = this.interaction;
      if (event.key === "Escape") { this.cancel(); this.tool = "select"; this.axisMenuOpen = false; this.invalidate(); return; }
      if (state && state.mode === "draw") {
        if (/^[0-9.,]$/.test(event.key)) state.typed += event.key === "," ? "." : event.key;
        else if (event.key === "Backspace") state.typed = state.typed.slice(0, -1);
        else if (event.key === "Enter") { this.commit(); event.preventDefault(); return; }
        else return;
        this.resolveDraw(); this.invalidate(); event.preventDefault(); return;
      }
      const focused = this.document.activeElement && this.document.activeElement.tagName;
      if ((event.key === "Delete" || event.key === "Backspace") && this.selectedId && focused !== "INPUT" && focused !== "TEXTAREA") { this.cancel(); this.engine.remove(this.selectedId); this.selectedId = null; this.invalidate(); }
    }
    zoom(event) {
      if (this.interaction) return; event.preventDefault();
      if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return;
      const r = this.engine.renderer, grid = this.services.grid, point = this.pointer(event); if (!point) return;
      if (event.deltaY < 0 && grid && (r.scale() >= grid.maxScale * (1 - 1e-12) || grid.step(r) <= .1)) { event.stopImmediatePropagation(); this.status("Maximale zoom bereikt (raster: 0,1)."); return; }
      let factor = event.deltaY < 0 ? .85 : 1 / .85;
      if (event.deltaY < 0 && grid) factor = Math.max(factor, r.scale() / grid.maxScale);
      const b = r.bounds, nx = (b.xMax - b.xMin) * factor, ny = (b.yMax - b.yMin) * factor, fx = (point.x - b.xMin) / (b.xMax - b.xMin), fy = (point.y - b.yMin) / (b.yMax - b.yMin);
      try { r.setBounds({ xMin: point.x - fx * nx, xMax: point.x + (1 - fx) * nx, yMin: point.y - fy * ny, yMax: point.y + (1 - fy) * ny }); } catch (e) { this.status(e.message); return; }
      this.feedback = null; this.invalidate();
    }
    newDocument() {
      this.cancel(); this.importSerial++;
      if (this.reader && this.reader.readyState === 1) this.reader.abort(); this.reader = null;
      let failure = null; if (this.services.draft) try { this.services.draft.clear(this.storage); } catch (e) { failure = e; }
      const r = this.engine.renderer;
      this.engine.load({ version: 2, type: "geometry", meta: {}, objects: [], presentation: { bounds: { ...DEFAULT_BOUNDS }, showAxes: r.showAxes, showGrid: r.showGrid, showXAxis: true, showYAxis: true, showAxisLabels: true, showOrigin: true, coordinateSystem: "cartesian" } });
      this.selectedId = null; this.axisMenuOpen = false; this.hydrate(); this.invalidate(); this.status(failure ? "Concept kon niet worden gewist: " + failure.message : "Nieuwe illustratie gestart.");
    }
    loadDocument(data) { this.cancel(); this.engine.load(data); this.selectedId = null; this.axisMenuOpen = false; this.hydrate(); this.invalidate(); this.status("Illustratie geladen."); }
    importFile(event) {
      const file = event.target.files && event.target.files[0]; if (!file) return;
      this.cancel(); const serial = ++this.importSerial;
      if (this.reader && this.reader.readyState === 1) this.reader.abort();
      const reader = this.reader = new this.window.FileReader();
      reader.onload = () => { if (!this.initialized || serial !== this.importSerial) return; try { this.loadDocument(JSON.parse(reader.result)); } catch (e) { this.window.alert("JSON kon niet worden geladen: " + e.message); } event.target.value = ""; this.reader = null; };
      reader.onerror = () => { if (this.initialized && serial === this.importSerial) this.status("JSON kon niet worden gelezen."); };
      reader.readAsText(file);
    }
    setColor(id, color) { const object = this.engine.get(id); if (!object) return; this.cancel(); this.engine.update(id, this.services.color.patch(object, color)); this.invalidate(); }
    viewClick(event) {
      const target = event.target, find = selector => target.closest(selector); let button;
      if ((button = find('[data-view-select="axes"]'))) { this.axisMenuOpen = !this.axisMenuOpen; this.invalidate(); return; }
      if ((button = find('[data-axis-system]')) && !button.disabled) { this.cancel(); this.engine.renderer.coordinateSystem = button.dataset.axisSystem; this.axisMenuOpen = false; this.invalidate(); return; }
      if ((button = find("[data-color-object]"))) { this.colorId = button.dataset.colorObject; const object = this.engine.get(this.colorId); if (object && this.colorInput) { const color = this.services.color.value(object); this.colorInput.value = /^#[0-9a-f]{6}$/i.test(color) ? color : "#222222"; this.colorInput.click(); } return; }
      if ((button = find("[data-select-object]"))) { this.cancel(); this.tool = "select"; this.selectedId = button.dataset.selectObject; this.invalidate(); return; }
      if ((button = find("[data-object-visibility]"))) { this.cancel(); const object = this.engine.get(button.dataset.objectVisibility); this.engine.update(object.id, { visible: object.visible === false }); this.invalidate(); return; }
      if ((button = find("[data-toggle-label]"))) { this.cancel(); const object = this.engine.get(button.dataset.toggleLabel); this.engine.update(object.id, { showLabel: !object.showLabel }); this.invalidate(); return; }
      if ((button = find("[data-view]"))) { this.cancel(); const key = { axes: "showAxes", grid: "showGrid", snapPoints: "showSnapPoints" }[button.dataset.view]; if (key) { this.engine.renderer[key] = !this.engine.renderer[key]; this.invalidate(); } }
    }
    viewObject(id) { const object = this.engine.get(id), state = this.interaction; return object && state && state.mode === "endpoint" && state.id === id && state.resolved ? { ...object, ...state.resolved.patch } : object; }
    invalidate(defer = false) {
      if (!this.initialized) return;
      if (defer && this.window.requestAnimationFrame && this.window.cancelAnimationFrame) {
        if (this.renderFrame === null) this.renderFrame = this.window.requestAnimationFrame(() => { this.renderFrame = null; if (this.initialized) this.render(); });
        return;
      }
      if (this.renderFrame !== null) { this.window.cancelAnimationFrame(this.renderFrame); this.renderFrame = null; }
      this.render();
    }
    render() {
      const e = this.engine, r = e.renderer, n = this.nodes;
      if (this.services.grid) r.axisStep = this.services.grid.step(r);
      const objects = e.model.all().map(object => this.viewObject(object.id));
      n.canvas.innerHTML = r.render({ meta: e.model.meta, all: () => objects });
      const svg = n.canvas.querySelector("svg"), object = this.selectedId && this.viewObject(this.selectedId);
      if (svg && svg.querySelectorAll) { const group = Array.from(svg.querySelectorAll('[data-object-id]')).find(node => node.getAttribute('data-object-id') === this.selectedId); if (group) group.classList.add("selected"); }
      if (this.document.createElementNS) {
        if (this.services.overlays) this.services.overlays.render(svg, r, object, this.tool, this.document);
        if (this.services.feedback) this.services.feedback.render(svg, r, this.feedback, this.document);
      }
      n.objectCount.textContent = objects.length + (objects.length === 1 ? " object" : " objecten");
      this.renderViewList(); this.renderInspector(object);
      this.document.querySelectorAll(".tool").forEach(button => button.classList.toggle("active", button.dataset.tool === this.tool));
      n.crosshair.hidden = !this.interaction || this.interaction.mode !== "draw" || (this.feedback && this.feedback.snapped && r.showSnapPoints !== false);
      if (this.feedback && this.interaction && this.interaction.mode === "draw") { const p = this.transform().mathToScreen(this.feedback.point), rect = n.canvasWrap.getBoundingClientRect(); n.crosshair.style.left = p.x - rect.left + "px"; n.crosshair.style.top = p.y - rect.top + "px"; }
    }
    renderViewList() {
      const r = this.engine.renderer;
      const rows = ['<div class="view-row"><button class="view-name view-system-btn" type="button" data-view-select="axes">Assenstelsel</button><button class="eye-btn" type="button" data-view="axes">' + eyeIcon(r.showAxes) + '</button>' + (this.axisMenuOpen && this.services.axis ? this.services.axis.html(r) : "") + '</div>', '<div class="view-row"><span class="view-name">Snappunten</span><button class="eye-btn" type="button" data-view="snapPoints">' + eyeIcon(r.showSnapPoints !== false) + '</button></div>'];
      for (const object of this.engine.model.objects) {
        const color = this.services.color ? this.services.color.value(object) : "#222222";
        rows.push('<div class="view-row' + (object.id === this.selectedId ? ' view-row-selected' : '') + '"><button class="view-name view-select-btn" type="button" data-select-object="' + MI.escapeXml(object.id) + '">' + MI.escapeXml(objectName(object)) + '<span class="view-type">' + MI.escapeXml(object.id) + '</span></button><button class="text-btn" title="Label tonen/verbergen" data-toggle-label="' + MI.escapeXml(object.id) + '">' + textIcon(object.showLabel) + '</button><button class="color-btn" title="Kleur wijzigen" aria-label="Kleur wijzigen" type="button" data-color-object="' + MI.escapeXml(object.id) + '" style="--object-color:' + MI.escapeXml(color) + '"><span class="color-swatch"></span></button><button class="eye-btn" title="Object tonen/verbergen" type="button" data-object-visibility="' + MI.escapeXml(object.id) + '">' + eyeIcon(object.visible !== false) + '</button></div>');
      }
      this.nodes.viewList.innerHTML = rows.join("");
    }
    renderInspector(object) {
      const panel = this.nodes.selectionPanel;
      if (!object) { panel.className = "selection-empty"; panel.textContent = "Geen object geselecteerd."; return; }
      panel.className = "selection-panel";
      let html = '<strong>' + MI.escapeXml(object.name) + '</strong><code>' + MI.escapeXml(object.id) + '</code><label>Naam<input data-edit="name" value="' + MI.escapeXml(object.name) + '"></label>';
      const keys = { point: ["x", "y"], line: ["x1", "y1", "x2", "y2"], circle: ["cx", "cy", "r"], text: ["x", "y"] }[object.type];
      for (const key of keys) html += '<label>' + key + '<input data-edit="' + key + '" type="number" step="0.1" value="' + MI.escapeXml(object[key]) + '"></label>';
      if (object.type === "text") html += '<label>Tekst<input data-edit="text" value="' + MI.escapeXml(object.text) + '"></label>';
      panel.innerHTML = html + '<button class="delete-btn" data-delete-selected>Verwijder object</button>';
    }
    download(name, content, type) { const blob = new this.window.Blob([content], { type }), url = this.window.URL.createObjectURL(blob), link = this.document.createElement("a"); link.href = url; link.download = name; link.click(); this.window.setTimeout(() => this.window.URL.revokeObjectURL(url), 500); }
  }
  // Existing presentation helpers, copied without their old event/render owners.
    function eyeIcon(visible) { if (visible) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" fill="currentColor"/></svg>'; return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M9.9 5.9C10.6 5.7 11.3 5.6 12 5.6c6.5 0 10 6.4 10 6.4-.8 1.2-1.8 2.4-3.1 3.4M6.1 6.1C3.5 7.7 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function textIcon(active) { return '<span class="text-toggle' + (active ? ' active' : '') + '" aria-hidden="true">T</span>'; }
  function objectName(object) { const names = { point: "Punt", line: "Lijnstuk", circle: "Cirkel", text: "Tekst" }; return object.name || names[object.type] || object.type; }


  MI.EditorApp = EditorApp;
})(window);
