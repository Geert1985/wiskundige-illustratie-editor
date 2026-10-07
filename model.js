/*
 * From Zero 2 Infinity — Mathematical Illustration Model
 *
 * Mathematical objects are stored independently from the editor and renderer.
 */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  const MODEL_VERSION = 2;
  const TYPES = new Set(["point", "line", "circle", "text"]);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function finite(value, fallback) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
  function record(value) { return value != null && Object.prototype.toString.call(value) === "[object Object]"; }
  function optionalNumber(value) { return value == null ? null : finite(value, null); }
  const PRESENTATION_FLAGS = ["showAxes", "showGrid", "showXAxis", "showYAxis", "showAxisLabels", "showOrigin", "showSnapPoints"];

  function normalisePresentation(input) {
    if (input == null) return null;
    if (!record(input)) throw new Error("Ongeldige presentatie-instellingen.");
    const result = clone(input);
    PRESENTATION_FLAGS.forEach(key => {
      if (key in input && typeof input[key] !== "boolean") throw new Error("Ongeldige presentatie-instelling: " + key);
    });
    if (input.coordinateSystem != null && input.coordinateSystem !== "cartesian") throw new Error("Niet-ondersteund coördinatenstelsel.");
    if (input.background != null && typeof input.background !== "string") throw new Error("Ongeldige achtergrond.");
    if ("axisStep" in input) {
      if (!numeric(input.axisStep) || Number(input.axisStep) <= 0) throw new Error("Ongeldige rasterstap.");
      result.axisStep = Number(input.axisStep);
    }
    if (input.bounds != null) {
      if (!record(input.bounds)) throw new Error("Ongeldige presentatie-bounds.");
      result.bounds = { ...clone(input.bounds) };
      ["xMin", "xMax", "yMin", "yMax"].forEach(key => {
        if (!numeric(input.bounds[key])) throw new Error("Ongeldige presentatie-bounds: " + key);
        result.bounds[key] = Number(input.bounds[key]);
      });
      const b = result.bounds, xSpan = b.xMax - b.xMin, ySpan = b.yMax - b.yMin;
      if ([b.xMin, b.xMax, b.yMin, b.yMax].some(value => Math.abs(value) > 1e12) || xSpan < 1e-6 || ySpan < 1e-6 || xSpan > 1e12 || ySpan > 1e12) throw new Error("Ongeldige presentatie-bounds.");
    }
    return result;
  }

  function numeric(value) {
    return (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value));
  }
  function validateImportedObject(input) {
    if (!record(input) || !TYPES.has(input.type)) throw new Error("Onbekend illustratie-object: " + (input && input.type));
    if (!((typeof input.id === "string" && input.id.trim() !== "") || (typeof input.id === "number" && Number.isFinite(input.id)))) throw new Error("Elk illustratie-object heeft een geldige id nodig.");
    const fields = { point: ["x", "y"], line: ["x1", "y1", "x2", "y2"], circle: ["cx", "cy", "r"], text: ["x", "y", "rotation"] }[input.type];
    fields.forEach(key => {
      if (key in input && !numeric(input[key])) throw new Error("Ongeldige objectcoördinaat: " + key);
    });
    if (input.type === "circle" && input.r != null && Number(input.r) < 0) throw new Error("Straal mag niet negatief zijn.");
    ["visible", "showLabel"].forEach(key => {
      if (input[key] != null && typeof input[key] !== "boolean") throw new Error("Ongeldige objectinstelling: " + key);
    });
    ["labelDx", "labelDy", "labelOffsetX", "labelOffsetY"].forEach(key => {
      if (input[key] != null && !numeric(input[key])) throw new Error("Ongeldige labeloffset: " + key);
    });
    if (input.style != null && !record(input.style)) throw new Error("Ongeldige objectstijl.");
    ["name", "label", "text"].forEach(key => {
      if (input[key] != null && typeof input[key] !== "string" && !(typeof input[key] === "number" && Number.isFinite(input[key]))) throw new Error("Ongeldige objecttekst: " + key);
    });
  }

  function defaultStyle(type) {
    const base = { stroke: "#222", strokeWidth: 2, fill: "none", opacity: 1, dash: "" };
    if (type === "point") return Object.assign(base, { fill: "#222", radius: 4 });
    if (type === "text") return Object.assign(base, { fill: "#222", stroke: "none", fontSize: 16, fontFamily: "Source Sans 3, sans-serif", anchor: "start" });
    return base;
  }
  function normaliseStyle(type, style) { return { ...defaultStyle(type), ...clone(style || {}) }; }

  function normaliseObject(input) {
    if (!input || !TYPES.has(input.type)) throw new Error("Onbekend illustratie-object: " + (input && input.type));
    const type = input.type;
    const id = String(input.id == null ? "" : input.id);
    if (!id) throw new Error("Elk illustratie-object heeft een id nodig.");
    const hasLegacyLabel = input.showLabel == null && input.label != null;
    const offset = type === "line" || type === "text" ? 6 : 8;
    const object = {
      ...clone(input),
      id: id,
      name: String(input.name == null || input.name === "" ? (input.label == null || input.label === "" ? id : input.label) : input.name),
      type: type,
      visible: input.visible !== false,
      showLabel: input.showLabel === true || hasLegacyLabel,
      labelDx: input.labelDx == null ? offset : finite(input.labelDx, offset),
      labelDy: input.labelDy == null ? -offset : finite(input.labelDy, -offset),
      labelOffsetX: optionalNumber(input.labelOffsetX),
      labelOffsetY: optionalNumber(input.labelOffsetY),
      style: normaliseStyle(type, input.style)
    };

    if (type === "point") { object.x = finite(input.x, 0); object.y = finite(input.y, 0); if (input.label != null) object.label = String(input.label); }
    if (type === "line") { object.x1 = finite(input.x1, 0); object.y1 = finite(input.y1, 0); object.x2 = finite(input.x2, 1); object.y2 = finite(input.y2, 0); if (input.label != null) object.label = String(input.label); }
    if (type === "circle") { object.cx = finite(input.cx, 0); object.cy = finite(input.cy, 0); object.r = Math.max(0, finite(input.r, 1)); if (input.label != null) object.label = String(input.label); }
    if (type === "text") { object.x = finite(input.x, 0); object.y = finite(input.y, 0); object.text = String(input.text == null ? "" : input.text); object.rotation = finite(input.rotation, 0); }
    return object;
  }

  class IllustrationModel {
    constructor(data) { this.version = MODEL_VERSION; this.type = "geometry"; this.objects = []; this.meta = {}; this.presentation = null; this._extra = {}; this._nextId = 1; if (data != null) this.load(data); }
    _generateId(type) { let id; do { id = (type || "object") + "-" + this._nextId; this._nextId = this._nextId >= Number.MAX_SAFE_INTEGER - 1 ? 1 : this._nextId + 1; } while (this.get(id)); return id; }
    add(input) { const data = clone(input || {}); if (data.id == null || data.id === "") data.id = this._generateId(data.type); const object = normaliseObject(data); if (this.get(object.id)) throw new Error("Object-id bestaat al: " + object.id); this.objects.push(object); return clone(object); }
    update(id, patch) { const index = this.objects.findIndex((object) => object.id === id); if (index === -1) throw new Error("Object niet gevonden: " + id); const next = normaliseObject({ ...this.objects[index], ...(patch || {}), id: id, type: this.objects[index].type }); this.objects[index] = next; return clone(next); }
    remove(id) { const before = this.objects.length; this.objects = this.objects.filter((object) => object.id !== id); return this.objects.length !== before; }
    get(id) { return this.objects.find((object) => object.id === id) || null; }
    all() { return clone(this.objects); }
    clear() { this.objects = []; }
    toJSON() { return { ...clone(this._extra), type: this.type, version: MODEL_VERSION, meta: clone(this.meta), objects: clone(this.objects), ...(this.presentation == null ? {} : { presentation: clone(this.presentation) }) }; }
    load(data) {
      if (!record(data) || !Array.isArray(data.objects)) throw new Error("Ongeldig illustratiemodel: objects-array vereist.");
      const version = data.version == null ? 1 : Number(data.version);
      if ((data.version != null && !numeric(data.version)) || !Number.isInteger(version) || version < 1 || version > MODEL_VERSION) throw new Error("Niet-ondersteunde illustratiemodelversie.");
      if (data.type != null && data.type !== "geometry") throw new Error("Niet-ondersteund documenttype.");
      if (data.meta != null && !record(data.meta)) throw new Error("Ongeldige documentmetadata.");
      const meta = clone(data.meta || {}), presentation = normalisePresentation(data.presentation);
      ["title", "description"].forEach(key => {
        if (meta[key] != null && typeof meta[key] !== "string") throw new Error("Ongeldige documentmetadata: " + key);
      });
      const extra = clone(Object.fromEntries(Object.entries(data).filter(([key]) => !["type", "version", "meta", "objects", "presentation"].includes(key))));
      const seen = new Set();
      let nextId = 1;
      const objects = data.objects.map(input => {
        validateImportedObject(input);
        const migrated = { ...input };
        // v1 automatically filled name with id; recover a distinct legacy label once.
        if (version === 1 && input.label != null && input.label !== "" && (input.name == null || input.name === "" || String(input.name) === String(input.id))) migrated.name = input.label;
        const object = normaliseObject(migrated);
        if (seen.has(object.id)) throw new Error("Object-id bestaat al: " + object.id);
        seen.add(object.id);
        const match = object.id.match(/-(\d+)$/), suffix = match ? Number(match[1]) : 0;
        if (Number.isSafeInteger(suffix) && suffix < Number.MAX_SAFE_INTEGER - 1) nextId = Math.max(nextId, suffix + 1);
        return object;
      });
      // Commit only after every object, migration and document field has succeeded.
      this.type = "geometry"; this.version = MODEL_VERSION; this.meta = meta;
      this.objects = objects; this.presentation = presentation; this._extra = extra; this._nextId = nextId;
      return this;
    }
  }

  MI.MODEL_VERSION = MODEL_VERSION;
  MI.OBJECT_TYPES = Array.from(TYPES);
  MI.IllustrationModel = IllustrationModel;
  MI.normaliseObject = normaliseObject;
  MI.PRESENTATION_FLAGS = PRESENTATION_FLAGS;
})(window);
