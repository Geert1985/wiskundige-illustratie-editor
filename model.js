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
  const TYPES = new Set(["point", "line", "circle", "text", "straight", "ray", "vector", "polygon", "dimension", "angle"]);
  const LINEAR = new Set(['line', 'straight', 'ray', 'vector', 'dimension']);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function finite(value, fallback) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
  function record(value) { return value != null && Object.prototype.toString.call(value) === "[object Object]"; }
  function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  function mergeStyle(base, patch) {
    return Object.fromEntries([...new Set([...Object.keys(base), ...Object.keys(patch)])].map(key => [key, Object.prototype.hasOwnProperty.call(patch, key) ? (record(base[key]) && record(patch[key]) ? mergeStyle(base[key], patch[key]) : patch[key]) : base[key]]));
  }
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
    const fields = LINEAR.has(input.type) ? ['x1', 'y1', 'x2', 'y2'] : { point: ["x", "y"], circle: ["cx", "cy", "r"], text: ["x", "y", "rotation"] }[input.type];
    if (input.type === "polygon") MI.PolygonGeometry.validate(input.vertices);
    if (input.type === "angle") MI.MeasurementGeometry.validateAngle(input.vertices,input.angleMark || "arc");
    if(input.measurementMode!=null && !["computed","text"].includes(input.measurementMode)) throw Error("Ongeldige meetmodus.");
    if(input.measurementText!=null && typeof input.measurementText!=="string") throw Error("Ongeldige maattekst.");
    (fields || []).forEach(key => {
      if (key in input && !numeric(input[key])) throw new Error("Ongeldige objectcoördinaat: " + key);
    });
    if (input.type === "circle" && input.r != null && Number(input.r) < 0) throw new Error("Straal mag niet negatief zijn.");
    ["visible", "showLabel", "locked", "showMeasurement"].forEach(key => {
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
  function normaliseStyle(type, style) {
    if (style != null && !record(style)) throw new Error('Ongeldige objectstijl.');
    const input = style || {};
    for (const key of ['strokeWidth', 'radius', 'fontSize', 'opacity']) if (key in input) {
      const value = Number(input[key]);
      if (!numeric(input[key]) || value < 0 || ((key === 'radius' || key === 'fontSize') && value === 0) || (key === 'opacity' && value > 1)) throw new Error('Ongeldige stijlwaarde: ' + key);
    }
    const result = { ...defaultStyle(type), ...clone(input) };
    for (const key of ['strokeWidth', 'radius', 'fontSize', 'opacity']) if (key in result) result[key] = Number(result[key]);
    return result;
  }

  function normaliseObject(input) {
    validateImportedObject(input);
    if (!input || !TYPES.has(input.type)) throw new Error("Onbekend illustratie-object: " + (input && input.type));
    const type = input.type;
    const id = String(input.id == null ? "" : input.id);
    if (!id) throw new Error("Elk illustratie-object heeft een id nodig.");
    const hasLegacyLabel = input.showLabel == null && input.label != null;
    const offset = LINEAR.has(type) || type === "text" ? 6 : 8;
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
    if (LINEAR.has(type)) { object.x1 = finite(input.x1, 0); object.y1 = finite(input.y1, 0); object.x2 = finite(input.x2, 1); object.y2 = finite(input.y2, 0); if (input.label != null) object.label = String(input.label); }
    if (['straight', 'ray', 'vector','dimension'].includes(type) && !Number.isFinite(Math.hypot(object.x2 - object.x1, object.y2 - object.y1))) throw new Error('Ongeldige richting: afstand tussen de punten moet eindig zijn.');
    if ((type === 'straight' || type === 'ray') && Math.hypot(object.x2 - object.x1, object.y2 - object.y1) === 0) throw new Error('Een rechte of halfrechte vereist twee verschillende punten.');
    if (type === "circle") { object.cx = finite(input.cx, 0); object.cy = finite(input.cy, 0); object.r = Math.max(0, finite(input.r, 1)); if (input.label != null) object.label = String(input.label); }
    if (type === "text") { object.x = finite(input.x, 0); object.y = finite(input.y, 0); object.text = String(input.text == null ? "" : input.text); object.rotation = finite(input.rotation, 0); }
    if (type === 'polygon') object.vertices = MI.PolygonGeometry.validate(object.vertices);
    if (type === 'angle') { object.angleMark = input.angleMark || 'arc'; object.vertices = MI.MeasurementGeometry.validateAngle(object.vertices, object.angleMark); }
    return object;
  }

  class IllustrationModel {
    #objects = Object.freeze([]);
    get objects() { return this.#objects; }
    constructor(data) { this.version = MODEL_VERSION; this.type = "geometry"; this.meta = {}; this.presentation = null; this._extra = {}; this._nextId = 1; if (data != null) this.load(data); }
    _generateId(type) { let id; do { id = (type || "object") + "-" + this._nextId; this._nextId = this._nextId >= Number.MAX_SAFE_INTEGER - 1 ? 1 : this._nextId + 1; } while (this.get(id)); return id; }
    add(input) {
      if (!record(input)) throw new Error('Ongeldig illustratie-object.');
      const nextId = this._nextId;
      try {
        const data = { ...input }; if (data.id == null || data.id === '') data.id = this._generateId(data.type);
        const object = freeze(normaliseObject(data)); if (this.#objects.some(o => o.id === object.id)) throw new Error('Object-id bestaat al: ' + object.id);
        this.#objects = Object.freeze([...this.#objects, object]); return clone(object);
      } catch (error) { this._nextId = nextId; throw error; }
    }
    update(id, patch) {
      const index = this.#objects.findIndex(o => o.id === id); if (index === -1) throw new Error('Object niet gevonden: ' + id);
      if (patch != null && !record(patch)) throw new Error('Ongeldige objectupdate.'); patch = patch || {};
      const current = this.#objects[index];
      if (('id' in patch && patch.id !== id) || ('type' in patch && patch.type !== current.type)) throw new Error('ID en objecttype kunnen niet worden gewijzigd.');
      if ('style' in patch && !record(patch.style)) throw new Error('Ongeldige objectstijl.');
      const next = freeze(normaliseObject({ ...current, ...patch, style: 'style' in patch ? mergeStyle(current.style, patch.style) : current.style }));
      const objects = this.#objects.slice(); objects[index] = next; this.#objects = Object.freeze(objects); return clone(next);
    }
    remove(id) { const before = this.#objects.length; this.#objects = Object.freeze(this.#objects.filter(o => o.id !== id)); return this.#objects.length !== before; }
    get(id) { const object = this.#objects.find(o => o.id === id); return object ? clone(object) : null; }
    all() { return clone(this.objects); }
    clear() { this.#objects = Object.freeze([]); }
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
      this.#objects = freeze(objects); this.presentation = presentation; this._extra = extra; this._nextId = nextId;
      return this;
    }
  }

  MI.MODEL_VERSION = MODEL_VERSION;
  MI.OBJECT_TYPES = Array.from(TYPES);
  MI.LINEAR_OBJECT_TYPES = Object.freeze(Array.from(LINEAR));
  MI.IllustrationModel = IllustrationModel;
  MI.normaliseObject = normaliseObject;
  MI.PRESENTATION_FLAGS = PRESENTATION_FLAGS;
})(window);
