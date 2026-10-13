/*
 * From Zero 2 Infinity â€” Mathematical Illustration Model
 *
 * Mathematical objects are stored independently from the editor and renderer.
 */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  const MODEL_VERSION = 2;
  const TYPES = new Set(["point", "line", "circle", "text", "straight", "ray", "vector", "polygon", "dimension", "angle", "region"]);
  const LINEAR = new Set(['line', 'straight', 'ray', 'vector', 'dimension']);
  const TEXT_LIMITS = Object.freeze({ codePoints: 20000, runs: 2048, paragraphs: 128, bytes: 1048576 });
  const TEXT_MARKS = new Set(['bold','italic','underline','strike','script','fontId','fontSize','color']);
  const TEXT_FONTS = new Set(['sans','serif']);
  const TEXT_COLORS = /^(#[0-9a-f]{6}|#[0-9a-f]{3})$/i;
  function textColor(value){const color=value.toLowerCase();return color.length===4?'#'+[...color.slice(1)].map(c=>c+c).join(''):color;}
  function richUpgradeConflict(extra){return ['groups','groupSchema','layers','layerSchema','circleDistributionSchema','circleDistributions','textSchema'].some(k=>Object.prototype.hasOwnProperty.call(extra||{},k));}
  function utf8Length(value){let bytes=0;for(const c of value){const n=c.codePointAt(0);bytes+=n<0x80?1:n<0x800?2:n<0x10000?3:4;}return bytes;}

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function finite(value, fallback) { return Number.isFinite(Number(value)) ? Number(value) : fallback; }
  function record(value) { return value != null && Object.prototype.toString.call(value) === "[object Object]"; }
  function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  function mergeStyle(base, patch) {
    return Object.fromEntries([...new Set([...Object.keys(base), ...Object.keys(patch)])].map(key => [key, Object.prototype.hasOwnProperty.call(patch, key) ? (record(base[key]) && record(patch[key]) ? mergeStyle(base[key], patch[key]) : patch[key]) : base[key]]));
  }
  function optionalNumber(value) { return value == null ? null : finite(value, null); }
  const PRESENTATION_FLAGS = ["showAxes", "showGrid", "showXAxis", "showYAxis", "showAxisLabels", "showOrigin", "showSnapPoints", "showMinorGrid"];

  function normalisePresentation(input) {
    if (input == null) return null;
    if (!record(input)) throw new Error("Ongeldige presentatie-instellingen.");
    const result = clone(input);
    PRESENTATION_FLAGS.forEach(key => {
      if (key in input && typeof input[key] !== "boolean") throw new Error("Ongeldige presentatie-instelling: " + key);
    });
    if (input.coordinateSystem != null && input.coordinateSystem !== "cartesian") throw new Error("Niet-ondersteund coÃ¶rdinatenstelsel.");
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
  function validateTextContent(input) {
    if(!record(input) || Object.keys(input).some(k=>!['schema','defaults','width','paragraphs'].includes(k)) || ![1,2,3].includes(input.schema) || !record(input.defaults) || Object.keys(input.defaults).some(k=>!['fontId','fontSize','color'].includes(k)) || !Array.isArray(input.paragraphs) || !input.paragraphs.length || input.paragraphs.length>TEXT_LIMITS.paragraphs) throw Error('Ongeldige gestructureerde tekst.');
    const defaults={fontId:input.defaults.fontId,fontSize:input.defaults.fontSize,color:typeof input.defaults.color==='string'&&TEXT_COLORS.test(input.defaults.color)?textColor(input.defaults.color):input.defaults.color};
    if(!TEXT_FONTS.has(defaults.fontId)||!Number.isFinite(defaults.fontSize)||defaults.fontSize<6||defaults.fontSize>120||!TEXT_COLORS.test(defaults.color))throw Error('Ongeldige standaardopmaak voor tekst.');
    if(input.width!==null&&(!Number.isFinite(input.width)||input.width<=0||input.width>1e6))throw Error('Ongeldige tekstbreedte.');
    let chars=0,runs=0,maths=0;const ids=new Set();
    const paragraphs=input.paragraphs.map(p=>{
      if(!record(p)||Object.keys(p).some(k=>!['id','align','lineHeight','runs'].includes(k))||typeof p.id!=='string'||!p.id.trim()||ids.has(p.id)||!['left','center','right'].includes(p.align)||!Number.isFinite(p.lineHeight)||p.lineHeight<0.75||p.lineHeight>3||!Array.isArray(p.runs))throw Error('Ongeldige tekstalinea.');ids.add(p.id);
      const out=[];for(const r of p.runs){if(!record(r)||Object.keys(r).some(k=>!(r.kind==='math'?['id','kind','source','marks']:r.kind==='dynamicValue'?['id','kind','binding','format','marks']:['id','kind','text','marks']).includes(k))||typeof r.id!=='string'||!r.id.trim()||ids.has(r.id)||!['text','hardBreak',...(input.schema>=2?['math']:[]),...(input.schema>=3?['dynamicValue']:[])].includes(r.kind)||(r.kind!=='hardBreak'&&!record(r.marks))||(r.kind==='hardBreak'&&r.marks!=null)||Object.keys(r.marks||{}).some(k=>!TEXT_MARKS.has(k)))throw Error('Ongeldig tekstfragment.');ids.add(r.id);if(++runs>TEXT_LIMITS.runs)throw Error('Tekst bevat te veel fragmenten.');
        if(r.kind==='hardBreak'){if('text'in r)throw Error('Ongeldige regeleinde.');out.push({id:r.id,kind:'hardBreak'});continue;}
        const source=r.kind==='math'?MI.MathSource.validate(r.source):null,value=r.kind==='dynamicValue'?MI.TextValues.validate(r.binding,r.format):null;
        if(r.kind==='math'&&++maths>MI.MathSource.limits.fragments)throw Error('Tekst bevat te veel formules.');
        if(r.kind==='text'&&typeof r.text!=='string')throw Error('Ongeldige tekstinhoud.');chars+=Array.from(value?value.format.prefix+value.format.suffix:source||r.text).length;if(chars>TEXT_LIMITS.codePoints)throw Error('Tekst is te lang.');
        const marks={};for(const [k,v] of Object.entries(r.marks)){if(k==='bold'||k==='italic'||k==='underline'||k==='strike'){if(typeof v!=='boolean')throw Error('Ongeldige tekstopmaak.');if(v)marks[k]=true;}else if(k==='script'){if(!['super','sub'].includes(v))throw Error('Ongeldig superscript of subscript.');marks[k]=v;}else if(k==='fontId'){if(!TEXT_FONTS.has(v))throw Error('Ongeldig lettertype.');marks[k]=v;}else if(k==='fontSize'){if(!Number.isFinite(v)||v<6||v>120)throw Error('Ongeldige lettergrootte.');marks[k]=v;}else if(k==='color'){if(typeof v!=='string'||!TEXT_COLORS.test(v))throw Error('Ongeldige tekstkleur.');marks[k]=textColor(v);}}
        out.push({id:r.id,kind:r.kind,...(value?value:r.kind==='math'?{source}:{text:r.text}),marks});
      }return {id:p.id,align:p.align,lineHeight:p.lineHeight,runs:out};
    });
    const canonical={schema:input.schema,defaults,width:input.width,paragraphs};if(utf8Length(JSON.stringify(canonical))>TEXT_LIMITS.bytes)throw Error('Gestructureerde tekst overschrijdt de opslaglimiet.');return canonical;
  }
  MI.TextContent=Object.freeze({validate:validateTextContent,limits:TEXT_LIMITS,plain:content=>content.paragraphs.map(p=>p.runs.map(r=>r.kind==='text'?r.text:r.kind==='math'?r.source:r.kind==='dynamicValue'?'niet beschikbaar':'\n').join('')).join('\n')});
  const projectionDefaults=Object.freeze({schema:1,frame:'cartesian',mode:'none',showValues:true});
  function projectionSettings(value) {
    if(!record(value)||Object.keys(value).some(k=>!['schema','frame','mode','showValues'].includes(k))||value.schema!==1||value.frame!=='cartesian'||!['none','x','y','both'].includes(value.mode)||typeof value.showValues!=='boolean')throw Error('Ongeldige co'+String.fromCharCode(246)+'rdinatenprojecties.');
    return {...value};
  }
  MI.PointProjections=Object.freeze({defaults:projectionDefaults,settings:projectionSettings});
  const textProperties=['name','label','length','radius','perimeter','area','angle','x','y'];
  function textBinding(value){
    if(value===null)return null;
    if(!record(value)||Object.keys(value).some(k=>!['schema','sourceId','property','precision','prefix','suffix'].includes(k))||value.schema!==1||typeof value.sourceId!=='string'||!value.sourceId.trim()||!textProperties.includes(value.property)||value.precision!==null&&(!Number.isInteger(value.precision)||value.precision<0||value.precision>10)||['prefix','suffix'].some(k=>typeof value[k]!=='string'||value[k].length>2000))throw Error('Ongeldige dynamische tekstverwijzing.');
    return {...value};
  }
  function textPropertiesFor(o){if(!o||o.type==='text')return [];return ['name','label',...(['line','vector','dimension'].includes(o.type)?['length']:[]),...(o.type==='circle'?['radius','perimeter','area']:[]),...(o.type==='polygon'?['perimeter','area']:[]),...(o.type==='angle'?['angle']:[]),...(o.type==='point'?['x','y']:[])];}
  function dynamicText(o,sources,meta={}){
    if(!o.textBinding)return o.text;
    const b=textBinding(o.textBinding),source=sources?.get(b.sourceId);let result='niet beschikbaar';
    if(source&&source.constructionValid!==false&&textPropertiesFor(source).includes(b.property)){
      if(['name','label'].includes(b.property))result=String(source[b.property]||source.name||source.id);
      else if(b.property==='angle'){const settings={...(source.angleSettings||MI.AngleMeasurements.defaults),...(b.precision===null?{}:{precision:b.precision})};result=MI.AngleMeasurements.label({...source,angleSettings:settings},meta.measurement,meta.angleMeasurement);}
      else {const amount=['area','perimeter'].includes(b.property)?MI.MeasurementUnits.figureValue(source,b.property):b.property==='length'?MI.MeasurementGeometry.value(source):b.property==='radius'?source.r:source[b.property],config=b.precision===null?meta.measurement:{...(meta.measurement||{schema:1,unit:'e',scale:1,precision:2}),precision:b.precision};result=MI.MeasurementUnits.format(amount,b.property==='area'?'area':'length',config);}
    }
    return b.prefix+result+b.suffix;
  }
  MI.DynamicText=Object.freeze({settings:textBinding,propertiesFor:textPropertiesFor,value:dynamicText});
  function validateImportedObject(input, options={}) {
    if (!record(input) || !TYPES.has(input.type)) throw new Error("Onbekend illustratie-object: " + (input && input.type));
    if('areaDisplay' in input&&input.type!=='region')throw new Error('Oppervlakteweergave is alleen geldig voor een gebied.');
    if (!((typeof input.id === "string" && input.id.trim() !== "") || (typeof input.id === "number" && Number.isFinite(input.id)))) throw new Error("Elk illustratie-object heeft een geldige id nodig.");
    const fields = LINEAR.has(input.type) ? ['x1', 'y1', 'x2', 'y2'] : { point: ["x", "y"], circle: ["cx", "cy", "r"], text: ["x", "y", "rotation"] }[input.type];
    if (input.type === "polygon") MI.PolygonGeometry.validate(input.vertices, options);
    if(input.type==='region'){
      if(!input.construction||!['polygonRegion','circleSectorRegion','circleSegmentRegion'].includes(input.construction.kind)||Object.keys(input).some(k=>['vertices','regionGeometry','regionArea','regionStatus','x','y','cx','cy','r'].includes(k)))throw Error('Ongeldig regio-object.');
      if(Object.keys(input).some(k=>!['type','id','name','label','visible','locked','showLabel','labelDx','labelDy','labelOffsetX','labelOffsetY','style','construction','areaDisplay','layerId','constructionValid'].includes(k)))throw Error('Onbekend regio-objectveld.');
      if('areaDisplay'in input)MI.RegionGeometry.areaDisplay(input.areaDisplay);
    }
    if (input.type === "angle") MI.MeasurementGeometry.validateAngle(input.vertices,input.angleMark || "arc");
    if('textBinding' in input){if(input.type!=='text'||input.construction||input.textContent)throw Error('Dynamische tekst vereist een vrij tekstobject zonder rich text.');textBinding(input.textBinding);if(input.textBinding?.sourceId===String(input.id))throw Error('Tekst kan niet naar zichzelf verwijzen.');}
    if('textContent' in input){if(input.type!=='text'||input.construction||'textBinding' in input)throw Error('Gestructureerde tekst vereist een vrij, niet-gebonden tekstobject.');validateTextContent(input.textContent);}
    if(input.textContent?.schema>=3&&'legacyStaticText' in input&&(input.type!=='text'||typeof input.legacyStaticText!=='string'||Array.from(input.legacyStaticText).length>TEXT_LIMITS.codePoints))throw Error('Ongeldige legacy-tekstbackup.');
    if('angleSettings' in input){if(input.type!=='angle')throw Error('Hoekinstellingen zijn alleen voor hoeken.');MI.AngleMeasurements.settings(input.angleSettings);if(input.angleMark==='right'&&input.angleSettings.mode==='directed')throw Error('Een rechtehoekmarkering gebruikt de kleinste hoek.');}
    if('coordinateProjections' in input){if(input.type!=='point')throw Error('Projecties zijn alleen beschikbaar voor punten.');projectionSettings(input.coordinateProjections);}
    if(input.measurementMode!=null && !["computed","text"].includes(input.measurementMode)) throw Error("Ongeldige meetmodus.");
    if(input.measurementText!=null && typeof input.measurementText!=="string") throw Error("Ongeldige maattekst.");
    (fields || []).forEach(key => {
      if (key in input && !numeric(input[key])) throw new Error("Ongeldige objectcoördinaat: " + key);
    });
    if (input.type === "circle" && input.r != null && Number(input.r) < 0) throw new Error("Straal mag niet negatief zijn.");
    ["visible", "showLabel", "locked", "showMeasurement", "measurementLabelOnly"].forEach(key => {
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
    if (type === "region") return Object.assign(base, { fill: "#f4c84a", opacity: 0.35 });
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

  function normaliseObject(input, options={}) {
    const validationOptions=input?.type==='polygon'&&input.construction?.kind==='triangleFromPoints'?{...options,allowDegenerateConstructedTriangle:true}:options;
    validateImportedObject(input, validationOptions);
    if (!input || !TYPES.has(input.type)) throw new Error("Onbekend illustratie-object: " + (input && input.type));
    const type = input.type;
    if(input.construction) MI.ConstructionService.validate(input.construction);
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
    if (type === "text") { object.x = finite(input.x, 0); object.y = finite(input.y, 0); object.text = String(input.text == null ? "" : input.text); object.rotation = finite(input.rotation, 0); if(input.textContent){object.textContent=validateTextContent(input.textContent);object.text=MI.TextContent.plain(object.textContent);} }
    if (type === 'polygon') object.vertices = MI.PolygonGeometry.validate(object.vertices, validationOptions);
    if(type==='region')object.areaDisplay=MI.RegionGeometry.areaDisplay(input.areaDisplay);
    if (type === 'angle') { object.angleMark = input.angleMark || 'arc'; object.vertices = MI.MeasurementGeometry.validateAngle(object.vertices, object.angleMark); }
    return object;
  }

  class IllustrationModel {
    #objects = Object.freeze([]);
    get objects() { return this.#objects; }
    #groups = Object.freeze([]);
    get groups() { return this.#groups; }
    #layers=Object.freeze([]);
    get layers(){return this.#layers;}
    #circleDistributions=Object.freeze([]);
    get circleDistributions(){return this.#circleDistributions;}
    constructor(data) { this.version = MODEL_VERSION; this.type = "geometry"; this.meta = {}; this.presentation = null; this._extra = {}; this._nextId = 1; if (data != null) this.load(data); }
    _generateId(type) { let id; do { id = (type || "object") + "-" + this._nextId; this._nextId = this._nextId >= Number.MAX_SAFE_INTEGER - 1 ? 1 : this._nextId + 1; } while (this.get(id) || this.#groups.some(g=>g.id===id) || this.#layers.some(l=>l.id===id)||this.#circleDistributions.some(d=>d.id===id)); return id; }
    add(input) {
      if (!record(input)) throw new Error('Ongeldig illustratie-object.');
      if(input.textContent&&richUpgradeConflict(this._extra))throw Error('Rijke tekst kan niet worden toegevoegd zolang legacy documentvelden botsen met het tekstformaat.');
      if(input.construction?.kind==='distributedPointOnCircle')throw Error('Distributiepunten worden uitsluitend via de centrale puntenverdeling beheerd.');
      const nextId = this._nextId;
      try {
        const data = { ...input }; if (data.id == null || data.id === '') data.id = this._generateId(data.type);
        const object = freeze(normaliseObject(data)); if ((this.#objects.some(o => o.id === object.id) || this.#groups.some(g=>g.id===object.id) || this.#layers.some(l=>l.id===object.id)||this.#circleDistributions.some(d=>d.id===object.id))) throw new Error('Object-id bestaat al: ' + object.id);
        MI.MathSource.checkDocument([...this.#objects,object]);MI.TextValues.checkDocument([...this.#objects,object]);
        const resolved=freeze(MI.ConstructionService.resolve([...this.#objects, object],this.#circleDistributions));
        let layers=this.#layers;if(layers.length){const target=layers.slice().reverse().find(l=>l.visible);if(!target)throw Error('Maak eerst een laag zichtbaar.');layers=freeze(MI.DocumentLayers.validate(layers.map(l=>l.id===target.id?{...l,members:[...l.members,object.id]}:l),resolved,this.#groups));}
        this.#objects=resolved;this.#layers=layers;return this.get(object.id);
      } catch (error) { this._nextId = nextId; throw error; }
    }
    update(id, patch) {
      const index = this.#objects.findIndex(o => o.id === id); if (index === -1) throw new Error('Object niet gevonden: ' + id);
      if (patch != null && !record(patch)) throw new Error('Ongeldige objectupdate.'); patch = patch || {};
      const current = this.#objects[index];
      if(patch.textContent?.schema>=3&&!(current.textContent?.schema>=3)&&'legacyStaticText'in current)throw Error('Legacy objectvelden botsen met de tekstbackup.');
      if(patch.textContent&&!current.textContent&&richUpgradeConflict(this._extra))throw Error('Rijke tekst kan niet worden toegevoegd zolang legacy documentvelden botsen met het tekstformaat.');
      if(patch.construction?.kind==='distributedPointOnCircle'||current.construction?.kind==='distributedPointOnCircle'&&'construction' in patch)throw Error('Distributiepunten worden uitsluitend via de centrale puntenverdeling beheerd.');
      MI.ConstructionService.validateUpdate(this.#objects,current,patch);
      if (('id' in patch && patch.id !== id) || ('type' in patch && patch.type !== current.type)) throw new Error('ID en objecttype kunnen niet worden gewijzigd.');
      if ('style' in patch && !record(patch.style)) throw new Error('Ongeldige objectstijl.');
      const triangleCenterSource = this.#objects.some(object => MI.ConstructionService.triangleCenterKinds.includes(object.construction?.kind) && object.construction.sources.some(ref => ref.objectId === current.id && ref.part == null && ref.index == null));
      const nextData = { ...current, ...patch, style: 'style' in patch ? mergeStyle(current.style, patch.style) : current.style };
      delete nextData.regionGeometry;delete nextData.regionArea;delete nextData.regionStatus;
      const next = freeze(normaliseObject(nextData, triangleCenterSource && nextData.type === 'polygon' && nextData.vertices?.length === 3 ? {allowDegenerateTriangle:true} : {}));
      const objects = this.#objects.slice(); objects[index] = next;MI.MathSource.checkDocument(objects);MI.TextValues.checkDocument(objects); this.#objects = freeze(MI.ConstructionService.resolve(objects,this.#circleDistributions)); return this.get(id);
    }
    commitText(id,content,migrateLegacy=false){
      const current=this.get(id);if(!current||current.type!=='text'||current.construction||current.textBinding&&!migrateLegacy||migrateLegacy&&!current.textBinding)throw Error('Ongeldig doel voor tekstcommit.');
      if(content.schema>=3&&!(current.textContent?.schema>=3)&&'legacyStaticText'in current)throw Error('Legacy objectvelden botsen met de tekstbackup.');
      if(migrateLegacy&&content.schema!==3)throw Error('Omzetting vereist tekstschema 3.');
      if(!current.textContent&&richUpgradeConflict(this._extra))throw Error('Legacy documentvelden botsen met het tekstformaat.');
      const {textBinding,...data}=current,next=freeze(normaliseObject({...data,textContent:content,...(migrateLegacy?{legacyStaticText:current.text}:{}),text:MI.TextContent.plain(content)}));
      const objects=this.#objects.map(o=>o.id===id?next:o);MI.MathSource.checkDocument(objects);MI.TextValues.checkDocument(objects);this.#objects=freeze(MI.ConstructionService.resolve(objects,this.#circleDistributions));return this.get(id);
    }
    restoreStaticText(id){
      const current=this.get(id);if(!current||typeof current.legacyStaticText!=='string'||!(current.textContent?.schema>=3))throw Error('Geen oorspronkelijke statische tekst beschikbaar.');
      const {textContent,legacyStaticText,...data}=current,next=freeze(normaliseObject({...data,text:legacyStaticText}));this.#objects=freeze(MI.ConstructionService.resolve(this.#objects.map(o=>o.id===id?next:o),this.#circleDistributions));return this.get(id);
    }
    detachConstructions(ids){
      if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)throw Error('Ongeldige selectie van constructies.');
      for(const id of ids){if(this.#circleDistributions.some(d=>d.pointIds.includes(id)))throw Error('Een distributiepunt kan niet afzonderlijk worden losgemaakt.');const info=MI.ConstructionService.describe(this.#objects,id);if(!info||info.mode!=='linked')throw Error('Selecteer een gekoppelde constructie.');if(!info.canDetach)throw Error('Een vergrendelde of ongeldige constructie kan niet worden losgemaakt.');}
      const selected=new Set(ids),objects=this.#objects.map(o=>{if(!selected.has(o.id))return o;const {construction,constructionValid,...free}=o;return free;});this.#objects=freeze(MI.ConstructionService.resolve(objects,this.#circleDistributions));return ids.map(id=>this.get(id));
    }
    createGroup(members,name='Groep') {
      if ('groups' in this._extra || 'groupSchema' in this._extra) throw Error('Legacy groepsgegevens moeten eerst expliciet worden gemigreerd.');
      const counter=this._nextId;
      try {const group={id:this._generateId('group'),name,members};const groups=MI.PersistentGroups.validate([...this.#groups,group],this.#objects);if(this.#layers.length)MI.DocumentLayers.validate(this.#layers,this.#objects,groups);this.#groups=freeze(groups);return clone(groups.at(-1));}catch(error){this._nextId=counter;throw error;}
    }
    createLayer(name) {
      if('layers' in this._extra || 'layerSchema' in this._extra)throw Error('Legacy laaggegevens moeten eerst expliciet worden gemigreerd.');
      const counter=this._nextId;try{const base=this.#layers.length?this.#layers:[{id:this._generateId('layer'),name:'Basislaag',visible:true,members:this.#objects.map(o=>o.id)}],layer={id:this._generateId('layer'),name,visible:true,members:[]};const layers=MI.DocumentLayers.validate([...base,layer],this.#objects,this.#groups);this.#layers=freeze(layers);return clone(layers.at(-1));}catch(error){this._nextId=counter;throw error;}
    }
    _replaceLayers(layers){this.#layers=freeze(MI.DocumentLayers.validate(layers,this.#objects,this.#groups));}
    assignLayer(ids,layerId){
      if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!this.get(id))||!this.#layers.some(l=>l.id===layerId))throw Error('Ongeldige laagtoewijzing.');
      MI.PersistentGroups.roots(this.#groups,ids);if(ids.every(id=>this.#layers.find(l=>l.id===layerId).members.includes(id)))return ids.slice();const selected=new Set(ids),moving=MI.DocumentLayers.ordered(this.#objects,this.#layers).filter(o=>selected.has(o.id)).map(o=>o.id);
      this._replaceLayers(this.#layers.map(l=>({...l,members:l.id===layerId?[...l.members.filter(id=>!selected.has(id)),...moving]:l.members.filter(id=>!selected.has(id))})));return ids.slice();
    }
    renameLayer(id,name){if(!this.#layers.some(l=>l.id===id))throw Error('Laag niet gevonden.');this._replaceLayers(this.#layers.map(l=>l.id===id?{...l,name}:l));}
    setLayerVisibility(id,value){if(!this.#layers.some(l=>l.id===id))throw Error('Laag niet gevonden.');this._replaceLayers(this.#layers.map(l=>l.id===id?{...l,visible:value}:l));}
    reorderLayers(ids){if(!Array.isArray(ids)||ids.length!==this.#layers.length||new Set(ids).size!==ids.length||ids.some(id=>!this.#layers.some(l=>l.id===id)))throw Error('Ongeldige laagvolgorde.');this._replaceLayers(ids.map(id=>this.#layers.find(l=>l.id===id)));}
    removeLayer(id){const i=this.#layers.findIndex(l=>l.id===id);if(i<0||this.#layers.length<2)throw Error('De laatste laag kan niet worden verwijderd.');const target=this.#layers[i>0?i-1:1].id,members=this.#layers[i].members;this._replaceLayers(this.#layers.filter(l=>l.id!==id).map(l=>l.id===target?{...l,members:i===0?[...members,...l.members]:[...l.members,...members]}:l));}
    ungroup(ids) {
      if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length||ids.some(id=>!this.#groups.some(g=>g.id===id)))throw Error('Groep niet gevonden.');
      this.#groups=freeze(MI.PersistentGroups.prune(this.#groups,new Set(this.#objects.map(o=>o.id)),new Set(ids)));return ids.slice();
    }
    setCircleDistribution(pointId,{count,startAngle}={}) {
      if(!Number.isSafeInteger(count)||count<1||count>MI.RegularGeometry.MAX_COUNT||!Number.isFinite(startAngle))throw Error('Ongeldige puntenverdeling.');
      if(startAngle<0||startAngle>=2*Math.PI)startAngle=((startAngle%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
      const point=this.#objects.find(o=>o.id===String(pointId));if(!point||point.type!=='point')throw Error('Selecteer een punt op een cirkel.');
      const existing=this.#circleDistributions.find(d=>d.pointIds.includes(point.id));
      if(!existing&&point.construction?.kind!=='pointOnCircle')throw Error('Alleen een bestaand punt op een cirkel kan worden uitgebreid.');
      const nextId=this._nextId;
      try {
        const dist=existing||{id:this._generateId('circle-distribution'),circleId:point.construction.sources[0].objectId,count:1,startAngle:2*Math.PI*point.construction.parameter,pointIds:[point.id]};
        if(existing&&count<existing.count){const removed=new Set(existing.pointIds.slice(count));const members=new Set(existing.pointIds);const used=this.#objects.some(o=>!members.has(o.id)&&o.construction?.sources.some(s=>removed.has(s.objectId)));if(used)throw Error('Aantal punten kan niet worden verlaagd: een te verwijderen punt wordt door een andere constructie gebruikt.');}
        const ids=dist.pointIds.slice(0,count);while(ids.length<count)ids.push(this._generateId('point'));
        const nextDist={...dist,count,startAngle,pointIds:ids};const distributions=this.#circleDistributions.filter(d=>d.id!==dist.id).concat(nextDist);
        const objects=this.#objects.filter(o=>!existing||!existing.pointIds.includes(o.id)||ids.includes(o.id)).map(o=>ids.includes(o.id)?freeze(normaliseObject({...o,construction:{kind:'distributedPointOnCircle',sources:[{objectId:dist.circleId}],distributionId:dist.id,index:ids.indexOf(o.id)}})):o);
        for(let i=existing?existing.count:1;i<count;i++){const newPoint=freeze(normaliseObject({id:ids[i],type:'point',name:point.name+' '+(i+1),visible:point.visible,showLabel:point.showLabel,style:point.style,construction:{kind:'distributedPointOnCircle',sources:[{objectId:dist.circleId}],distributionId:dist.id,index:i}}));objects.push(newPoint);}
        const resolved=freeze(MI.ConstructionService.resolve(objects,distributions));
        let layers=this.#layers;if(layers.length){const owner=this.#layers.find(l=>l.members.includes(point.id));layers=freeze(MI.DocumentLayers.validate(layers.map(l=>l.id===owner.id?{...l,members:[...l.members,...ids.filter(id=>!this.#objects.some(o=>o.id===id))]}:l),resolved,this.#groups));}
        this.#objects=resolved;this.#circleDistributions=freeze(distributions);this.#layers=layers;return clone(nextDist);
      }catch(error){this._nextId=nextId;throw error;}
    }
    deleteCircleDistribution(id,{cascadeDependents=false}={}) {
      const d=this.#circleDistributions.find(item=>item.id===id);if(!d)throw Error('Puntenverdeling niet gevonden.');const removed=MI.ConstructionService.descendants(this.#objects,d.pointIds),downstream=[...removed].filter(x=>!d.pointIds.includes(x));if(downstream.length&&!cascadeDependents)throw Error('Deze verdeling heeft afhankelijke constructies; bevestig eerst het verwijderen ervan.');
      this.#objects=freeze(this.#objects.filter(o=>!removed.has(o.id)));this.#circleDistributions=freeze(this.#circleDistributions.filter(x=>x.id!==id));this.#groups=freeze(MI.PersistentGroups.prune(this.#groups,new Set(this.#objects.map(o=>o.id))));if(this.#layers.length)this.#layers=freeze(this.#layers.map(l=>({...l,members:l.members.filter(x=>!removed.has(x))})));return [...removed];
    }
    remove(id) { if(this.#circleDistributions.some(d=>d.pointIds.includes(String(id))))throw Error('Een distributiepunt kan niet afzonderlijk worden verwijderd. Pas het aantal punten aan in Eigenschappen.');const before = this.#objects.length; const removed=MI.ConstructionService.descendants(this.#objects,[id]); this.#objects = Object.freeze(this.#objects.filter(o => !removed.has(o.id))); this.#circleDistributions=freeze(this.#circleDistributions.filter(d=>!d.pointIds.some(pointId=>removed.has(pointId)))); this.#groups=freeze(MI.PersistentGroups.prune(this.#groups,new Set(this.#objects.map(o=>o.id)))); if(this.#layers.length)this.#layers=freeze(this.#layers.map(l=>({...l,members:l.members.filter(id=>!removed.has(id))}))); return this.#objects.length !== before; }
    get(id) { const object = this.#objects.find(o => o.id === id); return object ? clone(object) : null; }
    all() { return clone(MI.DocumentLayers.ordered(this.objects,this.#layers)); }
    clear() { this.#objects = Object.freeze([]); this.#groups=Object.freeze([]); this.#layers=Object.freeze([]);this.#circleDistributions=Object.freeze([]); }
    toJSON() { const hasDistributions=this.#circleDistributions.length>0,hasRichText=this.#objects.some(o=>o.textContent),hasRegions=this.#objects.some(o=>o.type==='region'),hasRegionRecipes=this.#objects.some(o=>['polygonRegion','circleSectorRegion','circleSegmentRegion'].includes(o.construction?.kind)),version=hasRegions?8:hasRichText?7:hasDistributions?6:this.#layers.length?5:this.#groups.length?4:this.#objects.some(o=>o.construction)?3:MODEL_VERSION,objects=clone(this.objects).map(o=>{delete o.regionGeometry;delete o.regionArea;delete o.regionStatus;return o;});return { ...clone(this._extra), type: this.type, version, ...(hasRegions?{regionSchema:1}:{}), ...(hasRichText?{textSchema:Math.max(...this.#objects.filter(o=>o.textContent).map(o=>o.textContent.schema))}:{}), ...(this.#layers.length?{layerSchema:1,layers:clone(this.#layers)}:{}), ...(this.#groups.length?{groupSchema:1,groups:clone(this.#groups)}:{}), ...(hasDistributions?{circleDistributionSchema:1,circleDistributions:clone(this.#circleDistributions)}:{}), ...(this.#objects.some(o=>o.construction)?{constructionSchema:hasRegionRecipes?5:this.#objects.some(o=>o.construction?.sources.some(r=>r.arm!=null))?4:this.#objects.some(o=>o.construction?.sources.some(MI.AxisReferences.isAxis))?3:this.#objects.some(o=>o.construction&&MI.ConstructionService.schema2(o.construction.kind))?2:1}:{}), meta: clone(this.meta), objects, ...(this.presentation == null ? {} : { presentation: clone(this.presentation) }) }; }
    load(data) {
      if (!record(data) || !Array.isArray(data.objects)) throw new Error("Ongeldig illustratiemodel: objects-array vereist.");
      const version = data.version == null ? 1 : Number(data.version);
      if ((data.version != null && !numeric(data.version)) || !Number.isInteger(version) || version < 1 || version>8 || (version===6&&(data.circleDistributionSchema!==1||!Array.isArray(data.circleDistributions))) || (version===7&&![1,2,3].includes(data.textSchema))) throw new Error("Niet-ondersteunde illustratiemodelversie.");
      if (data.type != null && data.type !== "geometry") throw new Error("Niet-ondersteund documenttype.");
      if (data.meta != null && !record(data.meta)) throw new Error("Ongeldige documentmetadata.");
      const meta = clone(data.meta || {}), presentation = normalisePresentation(data.presentation);
      if('measurement' in meta)meta.measurement=MI.MeasurementUnits.settings(meta.measurement);if('angleMeasurement' in meta)meta.angleMeasurement=MI.AngleMeasurements.document(meta.angleMeasurement);
      ["title", "description"].forEach(key => {
        if (meta[key] != null && typeof meta[key] !== "string") throw new Error("Ongeldige documentmetadata: " + key);
      });
      const extra = clone(Object.fromEntries(Object.entries(data).filter(([key]) => !["type", "version", "meta", "objects", "presentation", ...(version>=4?["groups","groupSchema"]:[]), ...(version>=5?["layers","layerSchema"]:[]), ...(version>=6?["circleDistributionSchema","circleDistributions"]:[]), ...(version>=7?["textSchema"]:[]), ...(version>=8?["regionSchema"]:[])].includes(key))));
      const seen = new Set();
      const triangleSourceIds = new Set(data.objects.filter(input => MI.ConstructionService.triangleCenterKinds.includes(input?.construction?.kind)).flatMap(input => Array.isArray(input?.construction?.sources) ? input.construction.sources.filter(ref => ref && ref.part == null && ref.index == null && typeof ref.objectId === 'string').map(ref => ref.objectId) : []));
      const constructedTriangleIds = new Set(data.objects.filter(input => input?.construction?.kind === 'triangleFromPoints' && input.type === 'polygon').map(input => String(input.id)));
      let nextId = 1;
      const objects = data.objects.map(input => {
        const allowDegenerateTriangle = input?.type === 'polygon' && input.vertices?.length === 3 && triangleSourceIds.has(String(input.id));
        const allowDegenerateConstructedTriangle = input?.type === 'polygon' && input.vertices?.length === 3 && constructedTriangleIds.has(String(input.id));
        const objectOptions = {...(allowDegenerateTriangle ? {allowDegenerateTriangle:true} : {}),...(allowDegenerateConstructedTriangle?{allowDegenerateConstructedTriangle:true}:{})};
        validateImportedObject(input, objectOptions);
        const migrated = { ...input };
        // v1 automatically filled name with id; recover a distinct legacy label once.
        if (version === 1 && input.label != null && input.label !== "" && (input.name == null || input.name === "" || String(input.name) === String(input.id))) migrated.name = input.label;
        const object = normaliseObject(migrated, objectOptions);
        if (seen.has(object.id)) throw new Error("Object-id bestaat al: " + object.id);
        seen.add(object.id);
        const match = object.id.match(/-(\d+)$/), suffix = match ? Number(match[1]) : 0;
        if (Number.isSafeInteger(suffix) && suffix < Number.MAX_SAFE_INTEGER - 1) nextId = Math.max(nextId, suffix + 1);
        return object;
      });
      const hasRegion=objects.some(o=>o.type==='region'),hasRegionRecipe=objects.some(o=>['polygonRegion','circleSectorRegion','circleSegmentRegion'].includes(o.construction?.kind));
      if(hasRegion&&(version!==8||data.regionSchema!==1||!hasRegionRecipe))throw Error('Regio-objecten vereisen documentversie 8, regionSchema 1 en een regiorecept.');
      if(!hasRegion&&(data.regionSchema!=null||version===8))throw Error('regionSchema 1 is alleen toegestaan met regio-objecten.');
      if(objects.some(o=>o.construction?.sources.some(r=>r.arm!=null))&&data.constructionSchema!==4&&data.constructionSchema!==5)throw Error('Hoekarmen vereisen constructieschema 4 of hoger.');
      if(objects.some(o=>o.construction?.sources.some(MI.AxisReferences.isAxis))&&![3,4,5].includes(data.constructionSchema))throw Error('Asreferenties vereisen constructieschema 3 of hoger.');
      if(objects.some(o=>o.construction&&MI.ConstructionService.schema2(o.construction.kind))&&![2,3,4,5].includes(data.constructionSchema))throw Error('Deze gekoppelde geometrie vereist constructieschema 2.');
      if(hasRegionRecipe&&data.constructionSchema!==5||!hasRegionRecipe&&data.constructionSchema===5)throw Error('Regiorecepten vereisen constructieschema 5.');
      const distributions=[],distIds=new Set();if(version===6||data.circleDistributionSchema!=null||data.circleDistributions!=null){if(!Array.isArray(data.circleDistributions)||data.circleDistributionSchema!==1||(version===6&&!data.circleDistributions.length))throw Error('Ongeldige cirkelpuntenverdeling.');const pointIds=new Set();for(const d of data.circleDistributions){if(!record(d)||Object.keys(d).some(k=>!['id','circleId','count','startAngle','pointIds'].includes(k))||typeof d.id!=='string'||!d.id.trim()||typeof d.circleId!=='string'||!d.circleId.trim()||!Number.isSafeInteger(d.count)||d.count<1||d.count>MI.RegularGeometry.MAX_COUNT||!Number.isFinite(d.startAngle)||d.startAngle<0||d.startAngle>=2*Math.PI||!Array.isArray(d.pointIds)||d.pointIds.length!==d.count||new Set(d.pointIds).size!==d.count||distIds.has(d.id)||seen.has(d.id))throw Error('Ongeldige cirkelpuntenverdeling.');distIds.add(d.id);seen.add(d.id);const dsuffix=Number(d.id.match(/-(\d+)$/)?.[1]||0);if(Number.isSafeInteger(dsuffix)&&dsuffix<Number.MAX_SAFE_INTEGER-1)nextId=Math.max(nextId,dsuffix+1);const circle=objects.find(o=>o.id===d.circleId);if(!circle||circle.type!=='circle')throw Error('Puntenverdeling verwijst naar een ongeldige cirkel.');d.pointIds.forEach((id,index)=>{const p=objects.find(o=>o.id===id),c=p?.construction;if(!p||p.type!=='point'||!c||c.kind!=='distributedPointOnCircle'||c.distributionId!==d.id||c.index!==index||Object.keys(c).some(k=>!['kind','sources','distributionId','index'].includes(k))||c.sources.length!==1||Object.keys(c.sources[0]).some(k=>k!=='objectId')||c.sources[0].objectId!==d.circleId||pointIds.has(id))throw Error('Puntenverdeling en puntconstructie komen niet overeen.');pointIds.add(id);});distributions.push(clone(d));}if(objects.some(o=>o.construction?.kind==='distributedPointOnCircle'&&!pointIds.has(o.id)))throw Error('Los distributiepunt zonder register gevonden.');}
      else if(objects.some(o=>o.construction?.kind==='distributedPointOnCircle'))throw Error('Distributiepunten vereisen documentschema 6.');
      MI.MathSource.checkDocument(objects);MI.TextValues.checkDocument(objects);
      const resolved = MI.ConstructionService.resolve(objects,distributions);
      if(version>=4 && objects.some(o=>o.construction) && ![1,2,3,4,5].includes(data.constructionSchema))throw Error("Constructieschema vereist.");
      if(version>=4 && data.groups!=null && data.groupSchema!==1)throw Error("Groepsschema vereist.");
      const groups=version>=4&&data.groups!=null?MI.PersistentGroups.validate(data.groups,resolved):[];
      if(version===5&&(!Array.isArray(data.layers)||data.layerSchema!==1))throw Error('Laagschema vereist.');if(version>=5&&data.layers!=null&&data.layerSchema!==1)throw Error('Laagschema vereist.');const layers=version>=5&&data.layers!=null?MI.DocumentLayers.validate(data.layers,resolved,groups):[];
      if(version===7||version===8&&objects.some(o=>o.textContent)){if(![1,2,3].includes(data.textSchema)||!objects.some(o=>o.textContent)||objects.some(o=>o.textContent&&o.textContent.schema>data.textSchema)||objects.some(o=>o.textContent&&o.textBinding))throw Error('Documentversie 7 of 8 vereist geldige gestructureerde tekst en textSchema.');if(data.groups!=null&&data.groupSchema!==1||data.layers!=null&&data.layerSchema!==1)throw Error('Organisatieschema vereist voor documentversie 7 of 8.');}
      if(version<7&&(data.textSchema!=null||objects.some(o=>o.textContent)))throw Error('Gestructureerde tekst vereist documentversie 7.');
      for(const group of [...groups,...layers]){if(distIds.has(group.id))throw Error('Document-ID is niet uniek.');}
      for(const group of [...groups,...layers]){const suffix=Number(group.id.match(/-(\d+)$/)?.[1]||0);if(Number.isSafeInteger(suffix)&&suffix<Number.MAX_SAFE_INTEGER-1)nextId=Math.max(nextId,suffix+1);}
      // Commit only after every object, migration and document field has succeeded.
      this.type = "geometry"; this.version = MODEL_VERSION; this.meta = meta;
      this.#objects = freeze(resolved); this.#groups=freeze(groups); this.#layers=freeze(layers);this.#circleDistributions=freeze(distributions); this.presentation = presentation; this._extra = extra; this._nextId = nextId;
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
