/*
 * From Zero 2 Infinity — Mathematical Illustration Engine facade
 *
 * Public API for the first engine version. UI/editor code should depend on
 * this facade rather than on the model or renderer internals.
 */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  MI.CONSTRUCTION_COLOR = '#e63946';
  function presentationOptions(presentation) {
    const options = {showMinorGrid:presentation?.showMinorGrid===true};
    [...MI.PRESENTATION_FLAGS, "bounds", "background", "coordinateSystem", "axisStep"].forEach(key => {
      if (presentation && key in presentation) options[key] = presentation[key];
    });
    return options;
  }
  function createDocumentRenderer(options) {
    const renderer = new MI.SvgRenderer(options);
    renderer.showSnapPoints = options.showSnapPoints !== false;
    // Validate the presentation before the engine replaces a document. In the
    // editor the existing adaptive-grid policy remains authoritative.
    if (MI.adaptiveGridStep) renderer.axisStep = MI.adaptiveGridStep(renderer);
    renderer.renderGrid(); renderer.renderAxes();
    return renderer;
  }

  function distancePointToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const x = x1 + t * dx;
    const y = y1 + t * dy;
    return Math.hypot(px - x, py - y);
  }

  function hitDistance(object, x, y) {
    if(object.type === "angle") return Math.min(...MI.MeasurementGeometry.edges(object).map(edge=>linearDistance(edge,{x,y})));
    if (object.type === "polygon") return MI.PolygonGeometry.contains(object.vertices,{x,y}) ? 0 : Math.min(...MI.PolygonGeometry.edges(object).map(edge=>linearDistance(edge,{x,y})));
    if (object.type === "point") return Math.hypot(x - object.x, y - object.y);
    if (MI.LinearGeometry.isLinear(object)) return linearDistance(object, { x, y });
    if (object.type === "circle") return Math.abs(Math.hypot(x - object.cx, y - object.cy) - object.r);
    if (object.type === "text") return Math.hypot(x - object.x, y - object.y);
    return Infinity;
  }
  function linearDistance(object, point, transform) {
    const a = transform ? transform.mathToScreen({ x: object.x1, y: object.y1 }) : { x: object.x1, y: object.y1 };
    const b = transform ? transform.mathToScreen({ x: object.x2, y: object.y2 }) : { x: object.x2, y: object.y2 };
    const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    if (!length) return Math.hypot(point.x - a.x, point.y - a.y);
    const [low, high] = MI.LinearGeometry.domain(object), t = Math.max(low, Math.min(high, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length));
    return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
  }

  function screenHit(object, point, transform) {
    const map = (x, y) => transform.mathToScreen({ x, y });
    if(object.type === 'angle') return Math.min(...MI.MeasurementGeometry.edges(object).map(edge=>linearDistance(edge,point,transform)));
    if (object.type === 'polygon') return MI.PolygonGeometry.contains(object.vertices.map(p=>map(p.x,p.y)), point) ? 0 : Math.min(...MI.PolygonGeometry.edges(object).map(edge=>linearDistance(edge,point,transform)));
    if (object.type === 'point' || object.type === 'text') { const p = map(object.x, object.y); return Math.hypot(point.x - p.x, point.y - p.y); }
    if (MI.LinearGeometry.isLinear(object)) return linearDistance(object, point, transform);
    if (object.type === 'circle') {
      const center = map(object.cx, object.cy);
      const a = map(object.cx + object.r, object.cy), b = map(object.cx, object.cy + object.r);
      const ax = a.x - center.x, ay = a.y - center.y, bx = b.x - center.x, by = b.y - center.y;
      const radius = Math.hypot(ax, ay), other = Math.hypot(bx, by), centerDistance = Math.hypot(point.x - center.x, point.y - center.y);
      if (Math.abs(radius - other) <= 1e-9 * Math.max(1, radius) && Math.abs(ax * bx + ay * by) <= 1e-9 * Math.max(1, radius * other)) return Math.min(centerDistance, Math.abs(centerDistance - radius));
      const distance = angle => { const p = map(object.cx + Math.cos(angle) * object.r, object.cy + Math.sin(angle) * object.r); return Math.hypot(point.x - p.x, point.y - p.y); };
      // Find/refine the nearest point on the transformed circle, including affine SVG transforms.
      const step = Math.PI * 2 / 32; let best = 0;
      for (let i = 1; i < 32; i++) if (distance(i * step) < distance(best)) best = i * step;
      let low = best - step, high = best + step;
      for (let i = 0; i < 48; i++) { const a = low + (high - low) / 3, b = high - (high - low) / 3; if (distance(a) < distance(b)) high = b; else low = a; }
      return Math.min(centerDistance, distance((low + high) / 2));
    }
    return Infinity;
  }

  class Engine {
    constructor(data, rendererOptions) {
      this.model = data instanceof MI.IllustrationModel
        ? data
        : new MI.IllustrationModel(data);
      this.renderer = createDocumentRenderer(Object.assign({}, presentationOptions(this.model.presentation), rendererOptions || {}));
    }

    updateMany(updates) {
      const model=new MI.IllustrationModel(this.model.toJSON());
      updates.forEach(({id,patch})=>model.update(id,patch)); this.model=model; return updates.map(({id})=>model.get(id));
    }
    duplicateMany(ids,delta={x:.5,y:.5}) {
      const model=new MI.IllustrationModel(this.model.toJSON());
      const copies=ids.map(id=>{const original=model.get(id);if(!original)throw Error('Object niet gevonden: '+id);const {id:ignored,construction:ignoredConstruction,constructionValid:ignoredValidity,...data}=original;return model.add({...data,...MI.MeasurementGeometry.translate(original,delta),name:original.name+' (kopie)',locked:false});});
      const mapping=new Map(ids.map((id,i)=>[id,copies[i].id]));
      if(model.layers.length)for(const id of ids)model.assignLayer([mapping.get(id)],MI.DocumentLayers.index(this.model.layers).owner.get(id).id);
      const pending=this.model.groups.filter(g=>this.groupMembers(g.id).every(id=>mapping.has(id)));
      const grouped=new Set(pending.flatMap(g=>this.groupMembers(g.id)));
      for(const id of ids){const original=this.get(id);if(grouped.has(id)&&original.construction&&original.construction.sources.every(r=>mapping.has(r.objectId)))model.update(mapping.get(id),{construction:{...original.construction,sources:original.construction.sources.map(r=>({...r,objectId:mapping.get(r.objectId)}))}});}
      while(pending.length){const i=pending.findIndex(g=>g.members.every(id=>mapping.has(id)));if(i<0)throw Error('Ongeldige groepshierarchie.');const [g]=pending.splice(i,1);mapping.set(g.id,model.createGroup(g.members.map(id=>mapping.get(id)),g.name+' (kopie)').id);}
      this.model=model;return copies.map(o=>model.get(o.id));
    }
    construct(kind,sources,parameter) {
      if(parameter!==undefined&&!MI.ConstructionService.pathKind(kind))throw Error('Deze constructie heeft geen padparameter.');const recipe={kind,sources,...(MI.ConstructionService.pathKind(kind)?{parameter:MI.ConstructionService.normaliseParameter(kind,parameter)}:{})};
      if(['lineCircleIntersection','circleCircleIntersection'].includes(kind)) {
        const map=new Map(this.model.all().map(o=>[o.id,o])),solutions=[0,1].map(branch=>({recipe:{...recipe,branch},evaluation:MI.ConstructionService.evaluate({...recipe,branch},map)})).filter(s=>s.evaluation.valid);
        if(!solutions.length)throw Error('Geen uniek snijpunt binnen de gekozen objecten.');
        const model=new MI.IllustrationModel(this.model.toJSON()),created=solutions.map(s=>model.add({...s.evaluation.geometry,style:{stroke:MI.CONSTRUCTION_COLOR,fill:MI.CONSTRUCTION_COLOR},construction:s.recipe}));
        this.model=model;return created;
      }
      const map=new Map(this.model.all().map(o=>[o.id,o])),first=MI.ConstructionService.evaluate(recipe,map).geometry;
      if(!first)throw Error('Deze constructie bestaat niet voor de gekozen geometrie.');
      const data=this.model.toJSON(),model=new MI.IllustrationModel(data),count=kind==='tangent'&&!MI.ConstructionService.tangentOnCircle(map.get(sources[0].objectId),{x:first.x1,y:first.y1})?2:1;
      const created=[];for(let branch=0;branch<count;branch++)created.push(model.add({...first,style:{...first.style,stroke:MI.CONSTRUCTION_COLOR,...(first.type==='point'?{fill:MI.CONSTRUCTION_COLOR}:{})},construction:{...recipe, ...(kind==='tangent'?{branch}:{})}}));this.model=model;return created;
    }
    getConstructionInfo(id){return MI.ConstructionService.describe(this.model.objects,id);}
    detachConstructions(ids){return this.model.detachConstructions(ids);}
    createLayer(name){return this.model.createLayer(name);}
    assignLayer(ids,layerId){return this.model.assignLayer(ids,layerId);}
    renameLayer(id,name){return this.model.renameLayer(id,name);}
    setLayerVisibility(id,value){return this.model.setLayerVisibility(id,value);}
    reorderLayers(ids){return this.model.reorderLayers(ids);}
    removeLayer(id){return this.model.removeLayer(id);}
    isDisplayed(id){const o=this.get(id);return !!o&&o.visible!==false&&!(o.construction&&o.constructionValid===false)&&MI.DocumentLayers.visible(this.model.layers||[],id);}
    canSnap(id){return MI.DocumentLayers.visible(this.model.layers||[],id);}
    group(members,name) { return this.model.createGroup(members,name); }
    ungroup(ids) { return this.model.ungroup(ids); }
    groupMembers(id) { return MI.PersistentGroups.members(this.model.groups,id); }
    add(object) { return this.model.add(object); }
    update(id, patch) { return this.model.update(id, patch); }
    remove(id) { return this.model.remove(id); }
    get(id) { return this.model.get(id); }

    selectAt(x, y, tolerance) {
      const options = tolerance && typeof tolerance === 'object' ? tolerance : null;
      const maxDistance = options ? (options.tolerancePx == null ? 8 : options.tolerancePx) : Number.isFinite(Number(tolerance)) ? Number(tolerance) : 0.25;
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(maxDistance) || maxDistance < 0) return null;
      if (options && (!options.transform || !options.transform.mathToScreen)) throw new Error('Schermselectie vereist CoordinateTransform.');
      const screen = options && options.transform.mathToScreen({ x, y });
      let best = null;
      let bestDistance = Infinity;

      MI.DocumentLayers.ordered(this.model.objects,this.model.layers||[]).forEach((object) => {
        if (!MI.DocumentLayers.visible(this.model.layers||[],object.id) || object.visible === false || (object.construction && object.constructionValid===false)) return;
        const distance = options ? screenHit(object, screen, options.transform) : hitDistance(object, x, y);
        if (distance <= maxDistance + (options ? 1e-9 : 0) && (options || this.model.layers?.length ? distance <= bestDistance + 1e-9 : distance < bestDistance)) {
          best = object;
          bestDistance = distance;
        }
      });

      return best ? { object: JSON.parse(JSON.stringify(best)), distance: bestDistance } : null;
    }

    move(id, x, y) {
      const object = this.model.get(id);
      if (!object) throw new Error("Object niet gevonden: " + id);

      if (object.type === "point" || object.type === "text") return this.update(id, { x: x, y: y });
      if (object.type === "circle") return this.update(id, { cx: x, cy: y });
      if (MI.LinearGeometry.isLinear(object)) {
        const dx = x - object.x1;
        const dy = y - object.y1;
        return this.update(id, { x1: x, y1: y, x2: object.x2 + dx, y2: object.y2 + dy });
      }
      if (object.type === "angle") return this.update(id,MI.MeasurementGeometry.translate(object,{x:x-object.vertices[1].x,y:y-object.vertices[1].y}));
      if (object.type === "polygon") { const delta={x:x-object.vertices[0].x,y:y-object.vertices[0].y}; return this.update(id,{vertices:object.vertices.map(p=>({...p,x:p.x+delta.x,y:p.y+delta.y}))}); }
      throw new Error("Verplaatsen wordt nog niet ondersteund voor: " + object.type);
    }

    toJSON() {
      const document = this.model.toJSON(), r = this.renderer;
      const presentation = { ...(document.presentation || {}), bounds: { ...(document.presentation && document.presentation.bounds || {}), ...r.bounds }, coordinateSystem: r.coordinateSystem, background: r.background, axisStep: r.axisStep };
      MI.PRESENTATION_FLAGS.forEach(key => { presentation[key] = key === "showSnapPoints" ? r[key] !== false : r[key]; });
      // Opt-in extension: default documents retain their previous JSON shape.
      if(!r.showMinorGrid)delete presentation.showMinorGrid;
      document.presentation = presentation;
      return document;
    }
    toJSONString(pretty) { return JSON.stringify(this.toJSON(), null, pretty ? 2 : 0); }
    load(data) {
      const model = new MI.IllustrationModel().load(data), current = this.renderer;
      const options = { width: current.width, height: current.height, padding: current.padding, bounds: { ...current.bounds }, background: current.background, axisStep: current.axisStep, coordinateSystem: current.coordinateSystem };
      MI.PRESENTATION_FLAGS.forEach(key => { options[key] = key === "showSnapPoints" ? current[key] !== false : current[key]; });
      Object.assign(options, presentationOptions(model.presentation));
      const renderer = createDocumentRenderer(options);
      this.model = model; this.renderer = renderer;
      return this;
    }
    renderSVG() {
      if (MI.adaptiveGridStep) this.renderer.axisStep = MI.adaptiveGridStep(this.renderer);
      return this.renderer.render(this.model);
    }
  }

  MI.Engine = Engine;
  MI.distancePointToSegment = distancePointToSegment;
})(window);
