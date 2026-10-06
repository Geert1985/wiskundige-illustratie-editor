/*
 * From Zero 2 Infinity — Mathematical Illustration Model
 *
 * Mathematical objects are stored independently from the editor and renderer.
 */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  const MODEL_VERSION = 1;
  const TYPES = new Set(["point", "line", "circle", "text"]);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function finite(value, fallback) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }

  function defaultStyle(type) {
    const base = { stroke: "#222", strokeWidth: 2, fill: "none", opacity: 1, dash: "" };
    if (type === "point") return Object.assign(base, { fill: "#222", radius: 4 });
    if (type === "text") return Object.assign(base, { fill: "#222", stroke: "none", fontSize: 16, fontFamily: "Source Sans 3, sans-serif", anchor: "start" });
    return base;
  }
  function normaliseStyle(type, style) { return Object.assign(defaultStyle(type), style || {}); }

  function normaliseObject(input) {
    if (!input || !TYPES.has(input.type)) throw new Error("Onbekend illustratie-object: " + (input && input.type));
    const type = input.type;
    const id = String(input.id || "");
    if (!id) throw new Error("Elk illustratie-object heeft een id nodig.");
    const hasLegacyLabel = input.showLabel == null && input.label != null;
    const object = {
      id: id,
      name: String(input.name == null || input.name === "" ? id : input.name),
      type: type,
      visible: input.visible !== false,
      showLabel: input.showLabel === true || hasLegacyLabel,
      style: normaliseStyle(type, input.style)
    };

    if (type === "point") { object.x = finite(input.x, 0); object.y = finite(input.y, 0); if (input.label != null) object.label = String(input.label); }
    if (type === "line") { object.x1 = finite(input.x1, 0); object.y1 = finite(input.y1, 0); object.x2 = finite(input.x2, 1); object.y2 = finite(input.y2, 0); if (input.label != null) object.label = String(input.label); }
    if (type === "circle") { object.cx = finite(input.cx, 0); object.cy = finite(input.cy, 0); object.r = Math.max(0, finite(input.r, 1)); if (input.label != null) object.label = String(input.label); }
    if (type === "text") { object.x = finite(input.x, 0); object.y = finite(input.y, 0); object.text = String(input.text == null ? "" : input.text); object.rotation = finite(input.rotation, 0); }
    return object;
  }

  class IllustrationModel {
    constructor(data) { this.version = MODEL_VERSION; this.type = "geometry"; this.objects = []; this.meta = {}; this._nextId = 1; if (data) this.load(data); }
    _generateId(type) { let id; do { id = (type || "object") + "-" + this._nextId++; } while (this.get(id)); return id; }
    add(input) { const data = clone(input || {}); if (!data.id) data.id = this._generateId(data.type); if (this.get(data.id)) throw new Error("Object-id bestaat al: " + data.id); const object = normaliseObject(data); this.objects.push(object); return clone(object); }
    update(id, patch) { const index = this.objects.findIndex((object) => object.id === id); if (index === -1) throw new Error("Object niet gevonden: " + id); const next = normaliseObject(Object.assign({}, this.objects[index], patch || {}, { id: id, type: this.objects[index].type })); this.objects[index] = next; return clone(next); }
    remove(id) { const before = this.objects.length; this.objects = this.objects.filter((object) => object.id !== id); return this.objects.length !== before; }
    get(id) { return this.objects.find((object) => object.id === id) || null; }
    all() { return clone(this.objects); }
    clear() { this.objects = []; }
    toJSON() { return { type: this.type, version: MODEL_VERSION, meta: clone(this.meta), objects: clone(this.objects) }; }
    load(data) {
      if (!data || typeof data !== "object") throw new Error("Ongeldig illustratiemodel.");
      if (data.version && Number(data.version) > MODEL_VERSION) throw new Error("Illustratiemodel is nieuwer dan deze engine ondersteunt.");
      this.type = data.type || "geometry"; this.version = MODEL_VERSION; this.meta = clone(data.meta || {});
      this.objects = (Array.isArray(data.objects) ? data.objects : []).map(normaliseObject);
      const ids = this.objects.map((object) => String(object.id).match(/-(\d+)$/)).filter(Boolean).map((match) => Number(match[1]));
      this._nextId = ids.length ? Math.max.apply(null, ids) + 1 : 1; return this;
    }
  }

  MI.MODEL_VERSION = MODEL_VERSION;
  MI.OBJECT_TYPES = Array.from(TYPES);
  MI.IllustrationModel = IllustrationModel;
  MI.normaliseObject = normaliseObject;
})(window);
