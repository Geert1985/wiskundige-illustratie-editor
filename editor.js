/* Explicit editor application: one pointer state and one render owner. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  const DEFAULT_BOUNDS = { xMin: -5, xMax: 5, yMin: -3, yMax: 3 };
  const clone = value => JSON.parse(JSON.stringify(value));
  class EditorApp {
    constructor({ engine, services, document, window, storage }) {
      this.engine = engine; this.services = services; this.document = document; this.window = window; this.storage = storage;
      this.runtime=services.runtime || null; if(this.runtime && (!MI.RuntimeSession.isSession(this.runtime) || engine!==this.runtime.engine))throw new MI.PermissionError("INVALID_POLICY"); this.commands=this.runtime || MI.AuthorCommands(engine);
      this.tool = "select"; this.selectedIds = []; this.interaction = null; this.feedback = null;
      this.hoverId=null; this.hoverHit=null; this.hoverFrame=null; this.hoverPointer=null; this.presentationKey=null;
      this.listeners = []; this.initialized = false; this.axisMenuOpen = false; this.importSerial = 0; this.reader = null; this.renderFrame = null;
      this.history = new (this.runtime ? MI.RuntimeHistory : services.history || MI.EditorHistory)(this); this.editBefore = null;
      this.nodes = {};
      for (const id of ["canvas", "canvasWrap", "status", "objectCount", "selectionPanel", "titleInput", "descriptionInput", "crosshair", "viewList", "toolGrid", "resetViewBtn", "newBtn", "saveBtn", "loadBtn", "fileInput", "exportJsonBtn", "exportSvgBtn", "undoBtn", "redoBtn", "textDialog", "textForm", "textValue", "textCancel", "colorDialog", "colorForm", "colorField", "colorPalette", "colorCancel"]) this.nodes[id] = document.getElementById(id);
    }
    command(operation,payload={}) { return this.commands.createCommand(operation,payload); }
    execute(operation,payload={}) { return this.commands.execute(this.command(operation,payload)); }
    allowed(operation,payload={}) { return this.commands.canExecute(this.command(operation,payload)).allowed; }
    capabilities(id) { return this.commands.getObjectCapabilities(id); }
    toolAllowed(tool) { return !this.runtime || tool==='select' || this.commands.getAllowedTools().some(t=>t.enabled && t.toolId===(tool.startsWith('construct:')?tool:'create:'+tool)); }
    createObject(object,tool=this.tool) { return this.execute('object.create',{toolId:'create:'+tool,object}).result; }
    restrictControls() {
      if(!this.runtime){
        // Static controls survive a runtime re-mount; derive their state again.
        for(const id of ['newBtn','saveBtn','loadBtn','exportJsonBtn','exportSvgBtn','titleInput','descriptionInput'])if(this.nodes[id])this.nodes[id].disabled=false;
        for(const button of this.document.querySelectorAll('[data-tool]'))button.disabled=false;
        return;
      }
      for(const button of this.document.querySelectorAll('[data-tool]'))button.disabled=!this.toolAllowed(button.dataset.tool);
      for(const [id,operation] of [['newBtn','document.reset'],['saveBtn','document.draftSave'],['loadBtn','document.replace'],['exportJsonBtn','document.exportJSON'],['exportSvgBtn','document.exportSVG']])if(this.nodes[id])this.nodes[id].disabled=!this.allowed(operation,operation==='document.replace'?{document:{}}:{});
      for(const [id,path] of [['titleInput','title'],['descriptionInput','description']])this.nodes[id].disabled=!this.allowed('document.setMeta',{fields:[{path,value:this.nodes[id].value}]});
      const object=this.engine.get(this.selectedId),caps=object&&this.capabilities(object.id);
      for(const control of this.nodes.selectionPanel.querySelectorAll('[data-edit], [data-style], [data-style-color], [data-fill-object]')) {
        let path=control.dataset.style?'style.'+(control.dataset.style==='fillEnabled'?'fill':control.dataset.style):control.dataset.vertex!=null?'vertices['+control.dataset.vertex+'].'+control.dataset.edit:control.dataset.edit;
        if(control.dataset.styleColor)path=object?.type==='text'?'style.fill':'style.stroke';if(control.dataset.fillObject)path='style.fill';
        control.disabled=!caps || ![...(caps.geometryFields||[]),...(caps.propertyFields||[])].includes(path);
      }
      for(const button of this.document.querySelectorAll('[data-object-lock], [data-object-visibility], [data-lock-selection], [data-axis-setting], [data-axis-system], [data-view]'))button.disabled=true;
      for(const button of this.document.querySelectorAll('[data-select-object]'))button.disabled=!this.capabilities(button.dataset.selectObject).selectList;
      for(const button of this.document.querySelectorAll('[data-toggle-label], [data-color-object]'))button.disabled=!this.capabilities(button.dataset.toggleLabel||button.dataset.colorObject).propertyFields?.includes(button.dataset.toggleLabel?'showLabel':this.engine.get(button.dataset.colorObject)?.type==='text'?'style.fill':'style.stroke');
      for(const [selector,operation] of [['[data-delete-selected]','object.delete'],['[data-duplicate-selection]','object.duplicate']])for(const button of this.document.querySelectorAll(selector))button.disabled=!this.selectedIds.length || !this.allowed(operation,{ids:this.selectedIds});
    }
    updateObject(id,patch) {
      const object=this.engine.get(id);if(!object)return null;if(!this.runtime)MI.normaliseObject({...object,...patch,style:patch.style?{...object.style,...patch.style}:object.style});
      const fields=MI.PermissionFields.patch(object,Object.fromEntries(Object.entries(patch).filter(([key])=>key!=='id'&&key!=='type'&&key!=='visible'&&key!=='locked'&&key!=='construction'&&key!=='constructionValid'))).filter(f=>{
        const match=f.path.match(/^vertices\[(\d+)\]\.(x|y)$/),value=match?object.vertices[Number(match[1])][match[2]]:f.path.split('.').reduce((o,k)=>o?.[k],object);return JSON.stringify(value)!==JSON.stringify(f.value);
      });
      if(!fields.length)return object;
      const geometry=MI.PermissionFields.geometry(object),geometric=fields.filter(f=>geometry.includes(f.path)),properties=fields.filter(f=>!geometry.includes(f.path));
      if(geometric.length && !properties.length)this.execute('object.setGeometry',{id,fields:geometric});
      else if(properties.length && !geometric.length)this.execute('object.setProperties',{ids:[id],fields:properties});
      else this.execute('object.patchBatch',{updates:[{id,patch}]});
      return this.engine.get(id);
    }
    updateObjects(updates) {this.execute('object.patchBatch',{updates});}
    runtimePreview(state,operation,payload) {
      try { if(!state.transaction)state.transaction=this.runtime.begin(this.command(operation,payload));this.runtime.preview(state.transaction,payload);state.finalPayload=payload;state.rejected=false; }
      catch(error) {state.rejected=true;this.status(error.message);}
    }
    get selectedId() { return this.selectedIds[this.selectedIds.length-1] || null; }
    set selectedId(id) { this.selectedIds=id ? this.groupLeaves(id) : []; }
    selectedObjects() { return this.selectedIds.map(id=>this.engine.get(id)).filter(Boolean); }
    groupIndex() {
      const groups=this.engine.model.groups||[],objects=this.engine.model.objects;
      if(this.groupCache?.groups!==groups)this.groupCache={groups,...MI.PersistentGroups.index(groups),leaves:new Map()};
      if(this.groupCache.objects!==objects||this.groupCache.layers!==this.engine.model.layers){this.groupCache.layers=this.engine.model.layers;this.groupCache.objects=objects;this.groupCache.byId=new Map(objects.map(o=>[o.id,o]));this.groupCache.selectable=new Map();}
      return this.groupCache;
    }
    groupRoot(id) {const {parent}=this.groupIndex();while(parent.has(id))id=parent.get(id);return id;}
    groupLeaves(id) {
      const cache=this.groupIndex(),root=this.groupRoot(id);
      if(!cache.leaves.has(root)){const result=[],stack=[root];while(stack.length){const current=stack.pop(),g=cache.map.get(current);if(g)stack.push(...g.members.slice().reverse());else result.push(current);}cache.leaves.set(root,result);}
      return cache.leaves.get(root).slice();
    }
    selectedGroups() {try{return MI.PersistentGroups.roots(this.engine.model.groups||[],this.selectedIds).filter(id=>this.groupIndex().map.has(id));}catch(_){return [];}}
    addLayer(name='Nieuwe laag'){this.changeDocument(()=>this.execute('layer.create',{name}));}
    assignSelectionLayer(layerId){if(layerId&&this.selectedIds.length)this.changeDocument(()=>this.execute('layer.assign',{ids:this.selectedIds,layerId}));}
    moveLayer(id,offset){const ids=this.engine.model.layers.map(l=>l.id),i=ids.indexOf(id),j=i+offset;if(i<0||j<0||j>=ids.length)return;[ids[i],ids[j]]=[ids[j],ids[i]];this.changeDocument(()=>this.execute('layer.reorder',{ids}));}
    groupSelection() {
      this.changeDocument(()=>{const members=MI.PersistentGroups.roots(this.engine.model.groups||[],this.selectedIds);if(members.length<2)throw Error('Selecteer minstens twee objecten of groepen.');const g=this.execute('group.create',{members,name:'Groep'}).result;this.selectedIds=this.engine.groupMembers(g.id);});
    }
    ungroupSelection() {const ids=this.selectedGroups();if(ids.length)this.changeDocument(()=>this.execute('group.ungroup',{ids}));}
    selectObject(id,additive=false,source='list') {
      this.cancel(); this.tool='select';
      const leaves=this.groupLeaves(id);if(source==='canvas'&&!leaves.every(id=>this.canvasSelectable(this.engine.get(id))))return;
      if(additive)this.selectedIds=leaves.every(id=>this.selectedIds.includes(id))?this.selectedIds.filter(id=>!leaves.includes(id)):[...new Set([...this.selectedIds,...leaves])];else this.selectedIds=leaves;
      if(this.runtime)this.selectedIds=this.execute("object.select",{ids:this.selectedIds,source}).selectedIds;
      this.invalidate();
    }
    editableSelection() { return !this.selectedObjects().some(o=>o.locked); }
    canvasSelectable(o) { return !!o && o.visible!==false && !(o.construction && o.constructionValid===false) && this.engine.isDisplayed(o.id) && (!this.runtime || this.capabilities(o.id).selectCanvas); }
    groupCanvasSelectable(id) {const cache=this.groupIndex(),root=this.groupRoot(id);if(!cache.selectable.has(root))cache.selectable.set(root,this.groupLeaves(root).every(member=>this.canvasSelectable(cache.byId.get(member))));return cache.selectable.get(root);}
    moveSelectionPlan() {
      const snapshot=this.engine.model.objects,key=JSON.stringify(this.selectedIds),cache=this.movementCache;
      if(cache && cache.snapshot===snapshot && cache.groups===this.engine.model.groups && cache.layers===this.engine.model.layers && cache.key===key)return cache.plan;
      const byId=new Map(snapshot.map(o=>[o.id,o])),objects=this.selectedIds.map(id=>byId.get(id));
      const free=objects.filter(o=>o && !o.construction),ids=new Set(free.map(o=>o.id));
      const covered=(o,seen=new Set())=>{if(!this.canvasSelectable(o)||o.locked||seen.has(o.id))return false;if(!o.construction)return ids.has(o.id);const next=new Set([...seen,o.id]);return o.construction.sources.every(ref=>covered(byId.get(ref.objectId),next));};
      let complete=true;try{MI.PersistentGroups.roots(this.engine.model.groups||[],this.selectedIds);}catch(_){complete=false;}
      const plan=complete && objects.length && free.length && objects.every(o=>covered(o)) && (!this.runtime || this.allowed("object.translate",{ids:this.selectedIds,delta:{x:0,y:0}}))?Object.freeze(free):null;
      this.movementCache={snapshot,groups:this.engine.model.groups,layers:this.engine.model.layers,key,plan};return plan;
    }
    hitAt(event) {
      if(!event || !Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
      const n=this.nodes,target=event.target;
      if(target && !n.canvasWrap.contains(target))return null;
      const rect=n.canvasWrap.getBoundingClientRect();
      if(Number.isFinite(rect.right) && (event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom))return null;
      for(const [selector,attribute,kind] of [['.fzi-polygon-vertex','data-polygon-id','vertex'],['.fzi-line-endpoint','data-line-id','endpoint'],['.object-label','data-label-id','label'],['[data-object-id]','data-object-id','object']]) {
        const node=target?.closest?.(selector),object=node && n.canvas.contains(node) && this.engine.get(node.getAttribute(attribute));
        if(this.canvasSelectable(object))return {object,kind:kind==='label' && this.selectedIds.length>1 && this.selectedIds.includes(object.id)?'object':kind};
      }
      const transform=this.transform(),point=transform?.screenToMath({x:event.clientX,y:event.clientY});
      return point ? this.engine.selectAt(point.x,point.y,{transform,tolerancePx:8}):null;
    }
    cursorFor(hit) {
      const state=this.interaction;
      if(state)return ['object','group','label','pan'].includes(state.mode)?'grabbing':'crosshair';
      if(this.tool!=='select')return 'crosshair';
      if(!hit || !this.canvasSelectable(hit.object))return 'default';
      if(this.groupRoot(hit.object.id)!==hit.object.id && !this.groupCanvasSelectable(hit.object.id))return 'default';
      const o=hit.object;
      if(!o.locked && !o.construction && (!this.runtime || this.capabilities(o.id).geometryFields.length) && this.groupRoot(o.id)===o.id && ['endpoint','vertex'].includes(hit.kind))return 'crosshair';
      if(!o.locked && (!this.runtime || ['labelOffsetX','labelOffsetY'].every(k=>this.capabilities(o.id).propertyFields.includes(k))) && this.groupRoot(o.id)===o.id && hit.kind==='label')return 'move';
      if(this.selectedIds.includes(o.id) && this.moveSelectionPlan())return 'grab';
      return 'pointer';
    }
    renderPresentation(force=false) {
      if(this.hoverId) {
        const object=this.engine.get(this.hoverId);
        if(!this.canvasSelectable(object)||!this.groupCanvasSelectable(object.id)){this.hoverId=null;this.hoverHit=null;}else this.hoverHit={...this.hoverHit,object};
      }
      if(force && this.hoverPointer && !this.interaction && this.tool==='select' && this.document.elementFromPoint) {
        this.hoverHit=this.hitAt({...this.hoverPointer,target:this.document.elementFromPoint(this.hoverPointer.clientX,this.hoverPointer.clientY)});if(this.hoverHit&&!this.groupCanvasSelectable(this.hoverHit.object.id))this.hoverHit=null;this.hoverId=this.hoverHit?.object.id||null;
      }
      this.nodes.canvasWrap.style.cursor=this.cursorFor(this.hoverHit);
      const key=JSON.stringify([this.selectedIds,this.hoverId]);if(!force && key===this.presentationKey)return;
      this.presentationKey=key;
      const service=this.services.overlays||MI.EditorOverlays;
      if(service?.selection)service.selection(this.nodes.canvas.querySelector('svg'),{selectedIds:this.selectedIds,hoverId:this.hoverId,transform:this.transform(),renderer:this.engine.renderer,document:this.document});
    }
    updateHover(event) {
      this.hoverPointer=event?{clientX:event.clientX,clientY:event.clientY,target:event.target}:null;
      let hit=this.tool==='select' && !this.interaction?this.hitAt(event):null;
      if(hit && this.groupRoot(hit.object.id)!==hit.object.id && !this.groupCanvasSelectable(hit.object.id))hit=null;
      this.hoverHit=hit;this.hoverId=hit?.object.id||null;this.renderPresentation();
    }
    queueHover(event) {
      this.hoverPointer={clientX:event.clientX,clientY:event.clientY,target:event.target};
      if(!this.window.requestAnimationFrame){this.updateHover(this.hoverPointer);return;}
      if(this.hoverFrame===null)this.hoverFrame=this.window.requestAnimationFrame(()=>{this.hoverFrame=null;if(this.initialized)this.updateHover(this.hoverPointer);});
    }
    clearHover() {
      if(this.hoverFrame!==null && this.window.cancelAnimationFrame)this.window.cancelAnimationFrame(this.hoverFrame);
      this.hoverFrame=null;this.hoverPointer=null;this.hoverId=null;this.hoverHit=null;this.renderPresentation();
    }
    detachSelection(){const ids=this.selectedObjects().filter(o=>o.construction).map(o=>o.id);if(ids.length)this.changeDocument(()=>{this.execute('construction.detach',{ids});this.status('Constructie losgemaakt; het object volgt zijn bronnen niet meer.');});}
    constructionPanel(object){
      const info=this.engine.getConstructionInfo(object.id);if(!info)return '';
      const messages={SOURCE_INVALID:'Een bronconstructie bestaat momenteel niet.',COINCIDENT_POINTS:'De twee bronpunten vallen samen.',DEGENERATE_DIRECTION:'De bronlijn heeft geen geldige richting.',DEGENERATE_ARM:'Een arm van de hoek heeft geen lengte.',ZERO_RADIUS:'De broncirkel heeft straal nul.',POINT_INSIDE_CIRCLE:'Het bronpunt ligt binnen de cirkel.',NON_FINITE_RESULT:'De berekening geeft geen eindige meetwaarde.',COORDINATE_LIMIT:'De berekende positie ligt buiten het ondersteunde bereik.'};
      const link=id=>{const source=this.engine.get(id);return source?'<button type="button" class="secondary" data-construction-source="'+MI.escapeXml(id)+'"'+(this.runtime&&!this.capabilities(id).selectList?' disabled':'')+'>'+MI.escapeXml(source.name||id)+'</button>':'';};
      return '<div class="construction-info" data-construction-mode="'+info.mode+'"><p class="help-text">'+(info.mode==='linked'?'Gekoppelde constructie.':'Vrij object.')+'</p>'+(info.mode==='linked'?'<div>Bronnen: '+info.sources.map(ref=>link(ref.objectId)+(ref.part?'<span class="help-text"> '+({start:'beginpunt',end:'eindpunt',vertex:'hoekpunt',edge:'zijde'}[ref.part]||'')+(ref.index!=null?' '+(ref.index+1):'')+'</span>':'')).join(' ')+(info.hasRestrictedSources?' <span class="help-text">Andere bronnen zijn afgeschermd.</span>':'')+'</div>':'')+(info.dependents.length?'<div>Gebruikt door: '+info.dependents.map(link).join(' ')+'</div>':'')+(!info.valid?'<p class="help-text" data-construction-reason="'+info.reasonCode+'">'+MI.escapeXml(messages[info.reasonCode]||'Constructie bestaat momenteel niet.')+'</p>':'')+'</div>';
    }
    duplicateSelection() {
      if(!this.selectedIds.length)return;this.changeDocument(()=>{this.selectedIds=this.execute('object.duplicate',{ids:this.selectedIds}).result.map(o=>o.id);});
    }
    toggleLockSelection() {
      if(!this.selectedIds.length)return;this.changeDocument(()=>{const objects=this.selectedObjects(),locked=!objects.every(o=>o.locked);this.execute('object.setLock',{ids:objects.map(o=>o.id),value:locked});});
    }
    deleteSelection() {
      if(!this.selectedIds.length)return;if(!this.editableSelection()){this.status('Ontgrendel de selectie eerst.');return;}
      this.changeDocument(()=>{this.execute('object.delete',{ids:this.selectedIds});this.selectedId=null;});
    }
    on(target, type, fn, options) {
      if (!target) return;
      const guarded=event=>{try{fn(event);}catch(error){this.status(error.message);this.invalidate();}};
      target.addEventListener(type, guarded, options);
      this.listeners.push(() => target.removeEventListener && target.removeEventListener(type, guarded, options));
    }
    status(text) { this.nodes.status.textContent = text; }
    hydrate() { this.nodes.titleInput.value = this.engine.model.meta.title || ""; this.nodes.descriptionInput.value = this.engine.model.meta.description || ""; }
    updateMeta() {const fields=[{path:'title',value:this.nodes.titleInput.value.trim()},{path:'description',value:this.nodes.descriptionInput.value.trim()}].filter(f=>this.engine.model.meta[f.path]!==f.value);if(fields.length)this.execute('document.setMeta',{fields});}
    flushEdits() { if (this.editBefore) { this.history.record(this.editBefore); this.editBefore = null; } }
    stylePatch(input) {
      let key=input.dataset.style,value=input.type==='number' ? input.valueAsNumber : input.value;
      if(key==='opacity') { const current=this.engine.get(this.selectedId).style.opacity; value=value===current*100 ? current : value/100; }
      if(key==='fillEnabled') { key='fill'; const object=this.engine.get(this.selectedId),stroke=object.style.stroke;
        value=input.checked ? (object.style.fill && object.style.fill!=='none' ? object.style.fill : stroke && stroke!=='none' ? stroke : '#222222') : 'none';
      }
      return {[key]:value};
    }
    changeDocument(fn) {
      this.cancel(); this.flushEdits(); const before = this.history.capture();
      try { fn(); } catch(error) {this.status(error.message);} finally { this.history.record(before); this.invalidate(); }
    }
    travelHistory(redo = false) {
      this.closeDialogs(true); this.cancel(); this.flushEdits();
      try { if (redo) this.history.redo(); else this.history.undo(); this.hydrate(); }
      catch (error) { this.status(error.message); }
      this.invalidate();
    }
    transform() { return this.services.transform.forCanvas(this.engine, this.document); }
    pointer(event) { const transform = this.transform(); return transform && transform.screenToMath({ x: event.clientX, y: event.clientY }); }
    snap(point, excludeId) { return this.services.snap.resolve(this.engine, point, { transform: this.transform(), excludeId }); }
    init() {
      if (this.initialized) return this;
      this.initialized = true; this.hydrate();
      const n = this.nodes;
      this.on(n.textForm, "submit", e => { e.preventDefault(); this.submitText(); });
      this.on(n.textCancel, "click", () => this.closeText());
      this.on(n.textDialog, "cancel", e => { e.preventDefault(); this.closeText(); });
      this.on(n.colorForm, "submit", e => { e.preventDefault(); if (this.validColor()) { this.setColor(this.colorId, this.colorInput.value); this.closeColor(); } });
      this.on(n.colorCancel, "click", () => this.closeColor(true));
      this.on(n.colorDialog, "cancel", e => { e.preventDefault(); this.closeColor(true); });
      this.on(n.colorPalette, "click", e => { const button = e.target.closest("[data-color]"); if (button) { this.colorInput.value = button.dataset.color; this.setColor(this.colorId, this.colorInput.value); } });
      this.on(n.undoBtn, "click", () => this.travelHistory());
      this.on(n.redoBtn, "click", () => this.travelHistory(true));
      this.on(n.canvasWrap, "pointerdown", e => this.pointerDown(e));
      this.on(n.canvasWrap,'pointerleave',()=>{if(!this.interaction)this.clearHover();});
      this.on(n.canvasWrap, 'contextmenu', e => { if(this.suppressMarqueeMenu || (this.interaction?.mode==='marquee' && this.interaction.active)) { e.preventDefault(); this.suppressMarqueeMenu=false; } });
      this.on(this.document.getElementById('rectangleSelectBtn'), 'click', e => this.startKeyboardRectangle(e));
      this.on(this.window, "pointermove", e => this.pointerMove(e));
      this.on(this.window, "pointerup", e => this.pointerUp(e));
      this.on(this.window, "pointercancel", e => { if (this.interaction && e.pointerId === this.interaction.pointerId) this.cancel(); });
      this.on(n.canvasWrap, "lostpointercapture", e => { if (this.interaction && e.pointerId === this.interaction.pointerId) this.cancel(); });
      this.on(this.window, "blur", () => {if(this.runtime)this.closeDialogs(true);this.cancel();});
      this.on(this.window, "keydown", e => this.keyDown(e));
      this.on(n.canvasWrap, "wheel", e => this.zoom(e), { capture: true, passive: false });
      this.on(n.toolGrid, "click", e => { const button = e.target.closest("[data-tool]"); if (button) this.setTool(button.dataset.tool); });
      this.on(n.viewList, "click", e => this.viewClick(e));
      this.on(n.viewList, "change", e => {
        const layer=e.target.closest('[data-layer-name]');if(layer&&layer.dataset.layerName!=null){this.changeDocument(()=>this.execute('layer.rename',{id:layer.dataset.layerName,name:layer.value}));return;}
        const input = e.target.closest("[data-axis-setting]");
        if (input) { this.changeDocument(() => { this.execute('document.setPresentation',{fields:[{path:input.dataset.axisSetting,value:input.checked}]}); }); }
      });
      this.on(this.document, "click", e => { if (this.axisMenuOpen && !e.target.closest('[data-view-select="axes"], [data-axis-settings]')) { this.axisMenuOpen = false; this.invalidate(); } });
      this.on(n.selectionPanel, "change", e => {
        const layer=e.target.closest('[data-layer-assign]');if(layer&&layer.dataset.layerAssign!=null){this.assignSelectionLayer(layer.value);return;}
        const input = e.target.closest("[data-edit], [data-style]"); if (!input || !this.selectedId || !this.editableSelection()) return;
        this.cancel();
        try { this.changeDocument(() => {
          const value=input.type === 'checkbox' ? input.checked : input.type === 'number' ? input.valueAsNumber : input.value;
          let patch;
          if(input.dataset.style) {
            patch={style:this.stylePatch(input)};
          } else patch=input.dataset.vertex != null ? {vertices:this.engine.get(this.selectedId).vertices.map((p,i)=>i===Number(input.dataset.vertex) ? {...p,[input.dataset.edit]:value} : p)} : {[input.dataset.edit]:value};
          if(this.runtime && input.dataset.vertex!=null)this.execute('object.setGeometry',{id:this.selectedId,fields:[{path:'vertices['+input.dataset.vertex+'].'+input.dataset.edit,value}]});else this.updateObject(this.selectedId,patch);
        }); }
        catch (error) { this.status(error.message); }
        this.invalidate();
      });
      this.on(n.selectionPanel, "click", e => {
        const source=e.target.closest('[data-construction-source]');if(source){this.selectObject(source.dataset.constructionSource);return;}
        if(e.target.closest('[data-detach-construction]')){this.detachSelection();return;}
        if(e.target.closest('[data-group-selection]')) {this.groupSelection();return;}
        if(e.target.closest('[data-ungroup-selection]')) {this.ungroupSelection();return;}
        if(e.target.closest('[data-duplicate-selection]')) { this.duplicateSelection(); return; }
        if(e.target.closest('[data-lock-selection]')) { this.toggleLockSelection(); return; }
        const color=e.target.closest('[data-style-color], [data-fill-object]');
        if(color) { const id=color.dataset.fillObject || color.dataset.styleColor; this.openColor(id,color.dataset.fillObject ? 'fill' : this.engine.get(id).type==='text' ? null : 'stroke'); return; }
        if (e.target.closest("[data-delete-selected]") && this.selectedId) this.deleteSelection();
      });
      for (const input of [n.titleInput, n.descriptionInput]) {
        this.on(input, "input", () => { if (!this.editBefore) this.editBefore = this.history.capture(); this.updateMeta(); this.invalidate(); });
        this.on(input, "change", () => { this.flushEdits(); this.invalidate(); });
      }
      this.on(n.resetViewBtn, "click", () => { this.changeDocument(() => this.execute('view.zoom',{bounds:{...DEFAULT_BOUNDS}})); });
      this.on(n.newBtn, "click", () => {if(this.runtime){this.newDocument();return;} if (this.window.confirm("Een nieuwe illustratie starten? Het opgeslagen concept en niet-opgeslagen wijzigingen worden verwijderd.")) this.newDocument(); });
      this.on(n.saveBtn, "click", () => { if(this.runtime)throw new MI.PermissionError("MODE_DENIED"); this.cancel(); this.flushEdits(); this.updateMeta(); try { if(this.runtime)this.execute('document.draftSave');else this.services.draft.save(this.engine, this.storage); this.status("Concept opgeslagen in deze browser."); } catch (e) { this.status("Concept kon niet worden opgeslagen: " + e.message); } });
      this.on(n.loadBtn, "click", () => {if(this.runtime)throw new MI.PermissionError("MODE_DENIED");n.fileInput.click();});
      this.on(n.fileInput, "change", e => this.importFile(e));
      this.on(n.exportJsonBtn, "click", () => {if(this.runtime && !this.allowed("document.exportJSON"))throw new MI.PermissionError("PERMISSION_DENIED"); this.cancel(); this.flushEdits(); if(!this.runtime)this.updateMeta(); this.download("illustratie.json", this.engine.toJSONString(true), "application/json;charset=utf-8"); });
      this.on(n.exportSvgBtn, "click", () => {if(this.runtime && !this.allowed("document.exportSVG"))throw new MI.PermissionError("PERMISSION_DENIED"); this.cancel(); this.flushEdits(); if(!this.runtime)this.updateMeta(); this.download("illustratie.svg", this.engine.renderSVG(), "image/svg+xml;charset=utf-8"); });
      if (this.document.createElement && this.document.body) {
        this.colorInput = this.document.createElement("input"); this.colorInput.type = "text"; this.colorInput.dataset.editorColor = "true";
        this.colorInput.id = "colorValue"; this.colorInput.required = true; this.colorInput.pattern = "#[0-9a-fA-F]{6}"; this.colorInput.maxLength = 7;
        (n.colorField || this.document.body).appendChild(this.colorInput);
        this.on(this.colorInput, "input", () => { if (this.validColor()) this.setColor(this.colorId, this.colorInput.value); });
        this.on(this.colorInput, "change", () => { if (!n.colorDialog || !n.colorDialog.open) { this.flushEdits(); this.colorId = null; this.invalidate(); } });
      }
      if(this.runtime)this.listeners.push(this.runtime.subscribe(event=>{
        if(event.type==='context-changed'||event.type==='disposed'){this.closeDialogs(true);}if(event.type==='context-changed'||event.type==='disposed'||this.interaction?.transaction){this.cancel();if(!this.toolAllowed(this.tool))this.tool='select';}
        this.selectedIds=this.selectedIds.filter(id=>this.capabilities(id).selectCanvas||this.capabilities(id).selectList);this.invalidate();
      }));
      this.invalidate(); return this;
    }
    dispose() {
      this.closeDialogs(true); this.cancel(); this.flushEdits(); this.initialized = false; this.invalidateImport();
      for (const remove of this.listeners.splice(0)) remove();
      if (this.colorInput) this.colorInput.remove(); this.colorInput = null;
      this.engine.renderer.preview = null; this.feedback = null;
    }
    closeText() { this.pendingText = null; if (this.nodes.textDialog && this.nodes.textDialog.open) this.nodes.textDialog.close(); }
    submitText() {
      const text = this.nodes.textValue.value.trim(), pending = this.pendingText;
      if (!pending || !text) return;
      this.closeText(); this.changeDocument(() => { this.selectedId = this.createObject({ type: "text", x: pending.point.x, y: pending.point.y, text },"text").id; });
    }
    validColor() { return this.colorInput && /^#[0-9a-f]{6}$/i.test(this.colorInput.value); }
    closeColor(cancel = false) {
      if (this.colorId) {
        if(this.runtime && this.colorTransaction){try{if(cancel)this.runtime.cancel(this.colorTransaction);else this.runtime.commit(this.colorTransaction,this.colorPayload);}catch(error){this.status(error.message);}this.colorTransaction=null;this.colorPayload=null;this.editBefore=null;}
        else if (cancel && this.editBefore) { this.history.restore(this.editBefore); this.editBefore = null; this.hydrate(); }
        else this.flushEdits();
      }
      this.colorId = null; this.colorProperty=null; if (this.nodes.colorDialog && this.nodes.colorDialog.open) this.nodes.colorDialog.close();
      this.invalidate();
    }
    closeDialogs(cancel = false) { this.closeText(); if (this.colorId) this.closeColor(cancel); }
    constructionRole(kind,index) { return MI.ConstructionService.contract(kind).sourceRoles[index]; }
    constructionHint(kind,index=0) { return ({area:'Klik een cirkel, driehoek of veelhoek voor de oppervlakte.',perimeter:'Klik een cirkel, driehoek of veelhoek voor de omtrek.',midpoint:'Middenpunt: kies twee punten, of klik een lijnstuk.',perpendicularBisector:'Middelloodlijn: kies twee punten, of klik een lijnstuk.',parallel:index?'Kies het punt waar de evenwijdige rechte doorheen gaat.':'Kies een lijn of zijde.',perpendicular:index?'Kies het punt waar de loodlijn doorheen gaat.':'Kies een lijn of zijde.',bisector:['Bissectrice: klik een bestaande hoek of een veelhoekhoekpunt, of kies een bestaand punt op de eerste arm.','Kies nu het hoekpunt (waar beide armen samenkomen).','Kies nu een bestaand punt op de tweede arm.'][index],tangent:index?'Kies een punt op of buiten de cirkel.':'Kies een cirkel.'})[kind]; }
    constructionPick(point,role) {
      const transform=this.transform(),screen=transform.mathToScreen(point),candidates=[];
      const distance=p=>{const q=transform.mathToScreen(p);return Math.hypot(q.x-screen.x,q.y-screen.y);};
      const segment=(o,s)=>{const l=MI.ConstructionService.line(o,s),a=transform.mathToScreen({x:l.x1,y:l.y1}),b=transform.mathToScreen({x:l.x2,y:l.y2}),dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(!length)return distance({x:l.x1,y:l.y1});const domain=o.type==='polygon'?[0,1]:MI.LinearGeometry.domain(o),t=Math.max(domain[0],Math.min(domain[1],((screen.x-a.x)*dx+(screen.y-a.y)*dy)/length));return Math.hypot(screen.x-a.x-t*dx,screen.y-a.y-t*dy);};
      for(const o of this.engine.model.objects) {
        if(!this.engine.isDisplayed(o.id)||o.visible===false||(o.construction && o.constructionValid===false)||(this.runtime && !this.capabilities(o.id).sourceTools.includes(this.tool)))continue;
        const add=(s,d)=>{if(d<=12)candidates.push({source:{objectId:o.id,...s},distance:d,priority:o.type==='point'?0:1});};
        for(const ref of MI.ConstructionService.referenceOptions(o)[role]) {
          if(role==='point')add(ref,distance(MI.ConstructionService.point(o,ref)));
          else if(role==='line')add(ref,segment(o,ref));
          else if(role==='figure'&&o.type==='polygon')add(ref,MI.PolygonGeometry.contains(o.vertices,point)?0:Math.min(...o.vertices.map((v,index)=>segment(o,{part:'edge',index}))));
          else {const radial=Math.hypot(point.x-o.cx,point.y-o.cy),edge=radial?{x:o.cx+(point.x-o.cx)*o.r/radial,y:o.cy+(point.y-o.cy)*o.r/radial}:{x:o.cx+o.r,y:o.cy};add(ref,role==='figure'&&radial<=o.r?0:distance(edge));}
        }
      }
      candidates.sort((a,b)=>a.distance-b.distance || a.priority-b.priority || a.source.objectId.localeCompare(b.source.objectId));return candidates[0]&&candidates[0].source;
    }
    constructionClick(point,event) {
      const kind=this.tool.slice(10),state=this.interaction||{mode:'construction',sources:[],selectionIdsBefore:this.selectedIds.slice()};
      const target=event.target&&event.target.closest&&event.target.closest('[data-object-id]'),hitObject=target&&this.engine.get(target.getAttribute('data-object-id')),painted=hitObject && (!this.runtime || this.capabilities(hitObject.id).sourceTools.includes(this.tool))?hitObject:null;
      if(['area','perimeter'].includes(kind)&&painted&&['polygon','circle'].includes(painted.type))state.sources=[{objectId:painted.id}];
      const angle=!state.sources.length&&kind==='bisector'&&(painted&&painted.type==='angle'?painted:(this.engine.selectAt(point.x,point.y,{transform:this.transform(),tolerancePx:12})||{}).object);
      if(angle&&angle.type==='angle'&&angle.visible!==false&&(!this.runtime || this.capabilities(angle.id).sourceTools.includes(this.tool)))state.sources=[0,1,2].map(index=>({objectId:angle.id,part:'vertex',index}));
      let source=state.sources.length<MI.ConstructionService.kinds[kind]?this.constructionPick(point,this.constructionRole(kind,state.sources.length)):null;
      if(kind==='bisector' && !state.sources.length && source && source.part==='vertex') {const polygon=this.engine.get(source.objectId);if(polygon.type==='polygon')state.sources=[(source.index+polygon.vertices.length-1)%polygon.vertices.length,source.index,(source.index+1)%polygon.vertices.length].map(index=>({objectId:polygon.id,part:'vertex',index}));}
      if(state.sources.length===MI.ConstructionService.kinds[kind]) {}
      else if(!source && !state.sources.length && ['midpoint','perpendicularBisector'].includes(kind)) {const line=this.constructionPick(point,'line');if(line){const o=this.engine.get(line.objectId);state.sources=o.type==='polygon'?[{objectId:o.id,part:'vertex',index:line.index},{objectId:o.id,part:'vertex',index:(line.index+1)%o.vertices.length}]:[{objectId:o.id,part:'start'},{objectId:o.id,part:'end'}];}}
      else if(source)state.sources.push(source);
      else {this.status('Geen geschikte bron geraakt. '+this.constructionHint(kind,state.sources.length));return;}
      state.pointerId=event.pointerId; this.interaction=state;
      if(this.nodes.canvasWrap.setPointerCapture)try{this.nodes.canvasWrap.setPointerCapture(event.pointerId);}catch(_){}
      if(state.sources.length<MI.ConstructionService.kinds[kind]){this.status(this.constructionHint(kind,state.sources.length));return;}
      this.interaction=null;this.release(state);
      try {this.changeDocument(()=>{this.selectedIds=this.execute('construction.create',{toolId:'construct:'+kind,sources:state.sources}).result.map(o=>o.id);});this.tool='select';this.status('Gekoppelde constructie toegevoegd.');}
      catch(error){this.status(error.message);}
      this.invalidate();
    }
    setTool(tool) { if(!this.toolAllowed(tool)){this.status("Deze tool is niet toegestaan.");return;} this.closeDialogs(true); this.cancel(); this.tool = tool; if(tool.startsWith('construct:'))this.status(this.constructionHint(tool.slice(10))); this.invalidate(); }
    begin(state, event) {
      this.clearHover();
      this.flushEdits();
      this.interaction = { ...state, historyBefore: this.history.capture(), pointerId: event.pointerId, selectionBefore: this.selectedId, selectionIdsBefore:this.selectedIds.slice(), startScreen: { x: event.clientX, y: event.clientY }, transform: this.transform(), typed: "" };
      if (this.nodes.canvasWrap.setPointerCapture) try { this.nodes.canvasWrap.setPointerCapture(event.pointerId); } catch (_) {}
      this.renderPresentation();
    }
    release(state) { if (state && this.nodes.canvasWrap.hasPointerCapture && this.nodes.canvasWrap.hasPointerCapture(state.pointerId)) try { this.nodes.canvasWrap.releasePointerCapture(state.pointerId); } catch (_) {} }
    rectangleService() { return this.services.selection || MI.RectangleSelection; }
    textSelectionGeometry() {
      const result={},svg=this.nodes.canvas.querySelector('svg');
      if(!svg?.querySelectorAll)return result;
      const groups=new Map(Array.from(svg.querySelectorAll('[data-object-id]'),n=>[n.getAttribute('data-object-id'),n]));
      for(const o of this.engine.model.objects) {
        if(o.type!=='text' && !o.measurementLabelOnly)continue;
        const group=groups.get(o.id);
        const text=group?.querySelector(o.type==='text'?'text':'[data-measurement-label] text');
        if(!text?.getBBox)continue;
        const box=text.getBBox(),matrix=text.getScreenCTM();if(!matrix || !box.width || !box.height)continue;
        result[o.id]=[[box.x,box.y],[box.x+box.width,box.y],[box.x+box.width,box.y+box.height],[box.x,box.y+box.height]].map(([x,y])=>({x:matrix.a*x+matrix.c*y+matrix.e,y:matrix.b*x+matrix.d*y+matrix.f}));
      }
      return result;
    }
    updateRectangle(end) {
      const state=this.interaction;if(!state || state.mode!=='marquee')return;
      if(!Number.isFinite(end.x)||!Number.isFinite(end.y))return;
      state.end={...end};
      if(!state.keyboard)state.active=state.active || Math.hypot(end.x-state.startScreen.x,end.y-state.startScreen.y)>=3;
      if(!state.active)return;
      state.result=this.rectangleService().resolve(this.engine.model.objects.filter(o=>this.canvasSelectable(o)),state.startScreen,end,{transform:state.transform,bounds:this.engine.renderer.bounds,textGeometry:state.textGeometry,base:state.selectionIdsBefore,operation:state.operation,mode:state.keyboard?state.rule:undefined});
      const hitIds=new Set(state.result.found),seen=new Set(),found=[];
      for(const id of state.result.found){const root=this.groupRoot(id);if(seen.has(root))continue;seen.add(root);const leaves=this.groupLeaves(root);if(leaves.every(id=>this.canvasSelectable(this.engine.get(id)))&&(state.result.mode==='cross'||leaves.every(id=>hitIds.has(id))))found.push(...leaves);}
      state.result.found=found;state.result.ids=this.rectangleService().combine(state.selectionIdsBefore,found,state.operation);
      this.selectedIds=this.runtime?this.execute("object.select",{ids:state.result.ids,source:"canvas"}).selectedIds:state.result.ids;
      this.status('Kader: '+(state.result.mode==='contain'?'omsluiten':'raken')+' · '+state.result.found.length+' objecten'+(state.keyboard?' · pijlen, Alt voor fijn, C wisselt, Enter bevestigt, Escape annuleert.':''));
      this.invalidate(true);
    }
    startKeyboardRectangle(event={}) {
      if(this.tool!=='select' || this.interaction)return;
      this.clearHover();
      const b=this.engine.renderer.bounds,t=this.transform();if(!t)return;
      const p=t.mathToScreen({x:(b.xMin+b.xMax)/2,y:(b.yMin+b.yMax)/2});
      this.flushEdits();this.interaction={mode:'marquee',keyboard:true,phase:'anchor',pointerId:null,active:true,rule:'contain',transform:t,startScreen:p,end:{...p},selectionIdsBefore:this.selectedIds.slice(),operation:this.rectangleService().operation(event),textGeometry:this.textSelectionGeometry()};
      this.status('Kaderselectie: pijlen kiezen beginpunt, Enter zet vast; C wisselt omsluiten/raken; Escape annuleert.');this.invalidate();
    }
    renderRectangle(svg,r) {
      const state=this.interaction;if(!svg || state?.mode!=='marquee' || !state.active)return;
      const a=state.startScreen,b=state.end||a,points=[[a.x,a.y],[b.x,a.y],[b.x,b.y],[a.x,b.y]].map(([x,y])=>state.transform.screenToMath({x,y})).map(p=>r.mapX(p.x)+','+r.mapY(p.y)).join(' ');
      const polygon=this.document.createElementNS('http://www.w3.org/2000/svg','polygon');
      polygon.setAttribute('data-selection-rectangle','');polygon.setAttribute('points',points);polygon.setAttribute('fill',state.result?.mode==='cross'||state.rule==='cross'?'#16803b22':'#2463b422');polygon.setAttribute('stroke','#2463b4');polygon.setAttribute('stroke-width','1');polygon.setAttribute('vector-effect','non-scaling-stroke');polygon.setAttribute('stroke-dasharray',state.result?.mode==='cross'||state.rule==='cross'?'5 3':'none');polygon.setAttribute('pointer-events','none');svg.appendChild(polygon);
      if(state.keyboard) {
        const cursor=this.document.createElementNS('http://www.w3.org/2000/svg','path');
        const map=(x,y)=>{const p=state.transform.screenToMath({x,y});return r.mapX(p.x)+' '+r.mapY(p.y);};
        cursor.setAttribute('data-selection-cursor','');cursor.setAttribute('d','M '+map(b.x-6,b.y)+' L '+map(b.x+6,b.y)+' M '+map(b.x,b.y-6)+' L '+map(b.x,b.y+6));cursor.setAttribute('stroke','#2463b4');cursor.setAttribute('stroke-width','2');cursor.setAttribute('vector-effect','non-scaling-stroke');cursor.setAttribute('pointer-events','none');svg.appendChild(cursor);
      }
    }
    polygonResult(point) {
      const state=this.interaction; let result=this.snap(point);
      if(state.shape==='rightAngle' && state.vertices.length===2) result=this.services.snap.free(MI.MeasurementGeometry.rightPoint(state.vertices,result.point),'right-angle');
      if(state.shape==='polygon' && state.vertices.length>=3) {
        const a=this.transform().mathToScreen(state.vertices[0]),b=this.transform().mathToScreen(point);
        if(Math.hypot(a.x-b.x,a.y-b.y)<=this.services.snap.tolerancePx) return {...this.services.snap.free(state.vertices[0]),snapped:true,kind:'line-endpoint',priority:2,ids:[],distancePx:Math.hypot(a.x-b.x,a.y-b.y),close:true};
      }
      return result;
    }
    polygonPreview() {
      const state=this.interaction; this.feedback=state.result;
      this.engine.renderer.preview={type:['angle','rightAngle'].includes(state.shape)?'angle':'polygon',angleMark:state.shape==='rightAngle'?'right':'arc',showMeasurements:state.shape==='triangle',vertices:[...state.vertices,state.result.point]}; this.invalidate();
    }
    polygonClick(point,event) {
      const state=this.interaction; state.pointerId=event.pointerId; state.result=this.polygonResult(point);
      if(this.nodes.canvasWrap.setPointerCapture) try { this.nodes.canvasWrap.setPointerCapture(event.pointerId); } catch (_) {}
      if(state.result.close) { this.finishPolygon(); return; }
      if(state.vertices.some(p=>Math.hypot(p.x-state.result.point.x,p.y-state.result.point.y)<.05)) { this.status('Kies een verschillend hoekpunt (afstand minstens 0,05).'); return; }
      if(state.vertices.length>=256) { this.status('Maximaal 256 hoekpunten; sluit af met Enter.'); return; }
      state.vertices.push({...state.result.point}); this.polygonPreview();
      if(['triangle','angle','rightAngle'].includes(state.shape) && state.vertices.length===3) this.finishPolygon();
    }
    finishPolygon() {
      const state=this.interaction; if(!state || state.mode!=='polygon') return;
      const angle=['angle','rightAngle'].includes(state.shape);
      try { if(angle)MI.MeasurementGeometry.validateAngle(state.vertices,state.shape==='rightAngle'?'right':'arc');else MI.PolygonGeometry.validate(state.vertices); }
      catch(error) { this.status(error.message); return; }
      this.selectedId=this.createObject({type:angle?'angle':'polygon',vertices:state.vertices,...(angle?{angleMark:state.shape==='rightAngle'?'right':'arc'}:{})},state.shape).id;
      this.interaction=null; this.release(state); this.engine.renderer.preview=null; this.feedback=null;
      this.history.record(state.historyBefore); this.invalidate(); this.status(angle?'Hoek toegevoegd.':'Veelhoek toegevoegd.');
    }
    pointerDown(event) {
      if(this.initialized && !this.interaction && this.tool==='select' && event.button===2 && event.isPrimary!==false) {
        if(!this.pointer(event))return;
        this.suppressMarqueeMenu=false;
        this.begin({mode:'marquee',operation:this.rectangleService().operation(event),active:false,end:{x:event.clientX,y:event.clientY},textGeometry:this.textSelectionGeometry()},event);return;
      }
      if(!this.interaction)this.suppressMarqueeMenu=false;
      if (!this.initialized || (this.interaction && !['polygon','construction'].includes(this.interaction.mode)) || event.button !== 0 || event.isPrimary === false) return;
      const point = this.pointer(event); if (!point || !this.toolAllowed(this.tool)) return; event.preventDefault();
      if(this.tool.startsWith('construct:')) {this.constructionClick(point,event);return;}
      if(this.interaction && this.interaction.mode==='polygon') { this.polygonClick(point,event); return; }
      if(this.tool==='select') {
        const hit=this.hitAt(event);
        if(hit && this.groupRoot(hit.object.id)!==hit.object.id){
          const leaves=this.groupLeaves(hit.object.id);if(!leaves.every(id=>this.canvasSelectable(this.engine.get(id)))){this.status('Groep bevat verborgen of ongeldige objecten; gebruik de objectlijst.');return;}
          if(event.shiftKey||event.ctrlKey||event.metaKey){this.selectObject(hit.object.id,true,'canvas');return;}
          const before=this.selectedIds.slice();if(!leaves.every(id=>this.selectedIds.includes(id)))this.selectedIds=leaves;
          const originals=this.moveSelectionPlan();if(!originals){this.status('Groep kan niet bewegen: controleer locks en bronobjecten.');this.invalidate();return;}
          this.begin({mode:'group',originals},event);this.interaction.selectionIdsBefore=before;this.invalidate();return;
        }
      }
      const vertex=event.target && event.target.closest && event.target.closest('.fzi-polygon-vertex');
      if(this.tool==='select' && vertex) {
        const id=vertex.getAttribute('data-polygon-id'),object=this.engine.get(id);
        if(!this.canvasSelectable(object) || object.locked || object.construction || (this.runtime && !this.capabilities(id).geometryFields.some(k=>k.startsWith("vertices[")))) return;
        this.begin({mode:'vertex',id,original:clone(object),vertex:Number(vertex.getAttribute('data-vertex')),resolved:null},event);
        this.selectedId=id; this.invalidate(); return;
      }
      const label = event.target && event.target.closest && event.target.closest(".object-label"), handle = event.target && event.target.closest && event.target.closest(".fzi-line-endpoint");
      if (this.tool === "select" && (label || handle) && !(label && this.selectedIds.length>1 && this.selectedIds.includes(label.getAttribute('data-label-id')))) {
        const id = (label || handle).getAttribute(label ? "data-label-id" : "data-line-id"), object = this.engine.get(id);
        if (!this.canvasSelectable(object) || object.locked || (handle && object.construction) || (this.runtime && (label?!["labelOffsetX","labelOffsetY"].every(k=>this.capabilities(id).propertyFields.includes(k)):![handle.getAttribute("data-endpoint")==="start"?"x1":"x2",handle.getAttribute("data-endpoint")==="start"?"y1":"y2"].every(k=>this.capabilities(id).geometryFields.includes(k))))) return;
        this.begin({ mode: label ? "label" : "endpoint", id, original: clone(object), endpoint: handle && handle.getAttribute("data-endpoint"), offset: this.labelOffset(object), resolved: null }, event);
        this.selectedId = id; this.invalidate(); return;
      }
      if (this.tool === "point" || this.tool === "text") {
        const result = this.snap(point); const object = { type: this.tool, x: result.point.x, y: result.point.y };
        if (this.tool === "text") {
          this.flushEdits(); this.pendingText = result; this.nodes.textValue.value = "";
          this.nodes.textDialog.showModal(); this.nodes.textValue.focus(); return;
        }
        this.changeDocument(() => { this.selectedId = this.createObject(object).id; }); this.feedback = result; this.invalidate(); return;
      }
      if (MI.LinearGeometry.isLinear({ type: this.tool }) || this.tool === "circle") {
        const result = this.snap(point);
        this.begin({ mode: "draw", shape: this.tool, start: result.point, lastRawPoint: { ...result.point }, resolved: null }, event);
        this.resolveDraw(); this.invalidate(); return;
      }
      if(['triangle','polygon','angle','rightAngle'].includes(this.tool)) {
        const result=this.snap(point); this.begin({mode:'polygon',shape:this.tool,vertices:[{...result.point}],result},event);
        this.polygonPreview(); this.status(['angle','rightAngle'].includes(this.tool)?'Klik een punt op de eerste arm, het hoekpunt en een punt op de tweede arm.':'Klik voor hoekpunten; Enter sluit af, Backspace verwijdert het laatste punt, Escape annuleert.'); return;
      }
      if (this.tool !== 'select') { this.status('Deze tekentool is niet beschikbaar. Vernieuw de editor.'); return; }
      const hit = this.hitAt(event);
      if(hit && (event.shiftKey || event.ctrlKey || event.metaKey)) { this.selectObject(hit.object.id,true,'canvas');return; }
      if(hit && this.selectedIds.includes(hit.object.id) && this.selectedIds.length>1) {
        if(!this.editableSelection()){this.status('Ontgrendel de selectie eerst.');return;}
        const originals=this.moveSelectionPlan();if(!originals){this.status('Selectie kan niet rigide bewegen: selecteer ook alle ontgrendelde bronobjecten.');return;}this.begin({mode:'group',originals},event);this.status('Verplaats selectie.');this.invalidate();return;
      }
      if(hit && this.runtime && !this.allowed("object.translate",{ids:[hit.object.id],delta:{x:0,y:0}})) {this.selectObject(hit.object.id);this.status("Verplaatsen is niet toegestaan.");return;}
      if(hit && hit.object.locked) { this.selectObject(hit.object.id);this.status('Object is vergrendeld.');return; }
      if(hit && hit.object.construction) {this.selectObject(hit.object.id);this.status('Gekoppelde constructie: verplaats de bronobjecten.');return;}
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
        if(this.tool==='select')this.queueHover(event);
        if (this.tool !== "select" && (!event.target || this.nodes.canvasWrap.contains(event.target))) { const point = this.pointer(event); if (point) { this.feedback = this.snap(point); this.invalidate(true); } }
        return;
      }
      if(state.mode==='construction')return;
      if (state.mode==='polygon') { if(event.isPrimary===false || (state.pointerId!=null && event.pointerId!==state.pointerId)) return; const point=this.pointer(event); if(point) { state.result=this.polygonResult(point); this.polygonPreview(); } return; }
      if (event.pointerId !== state.pointerId) return;
      state.lastPointer={clientX:event.clientX,clientY:event.clientY};
      if(state.mode==='marquee'){this.updateRectangle({x:event.clientX,y:event.clientY});return;}
      const point = this.pointer(event); if (!point) return;
      const delta = state.transform.screenDelta(event.clientX - state.startScreen.x, event.clientY - state.startScreen.y); if (!delta) return;
      if(this.runtime && ['label','endpoint','vertex','group','object','pan'].includes(state.mode)) {
        let operation,payload;
        if(state.mode==='label'){operation='object.setProperties';payload={ids:[state.id],fields:[{path:'labelOffsetX',value:state.offset.x+delta.x},{path:'labelOffsetY',value:state.offset.y+delta.y}]};}
        else if(state.mode==='pan'){operation='view.pan';payload={bounds:{xMin:state.bounds.xMin-delta.x,xMax:state.bounds.xMax-delta.x,yMin:state.bounds.yMin-delta.y,yMax:state.bounds.yMax-delta.y}};}
        else if(['endpoint','vertex'].includes(state.mode)) {
          state.resolved=state.mode==='endpoint'?this.services.resolver.endpoint(this.engine,state.original,state.endpoint,point,{transform:this.transform()}):this.services.resolver.polygonVertex(this.engine,state.original,state.vertex,point,{transform:this.transform()});
          operation='object.setGeometry';payload={id:state.id,fields:MI.PermissionFields.patch(state.original,state.resolved.patch).filter(f=>MI.PermissionFields.geometry(state.original).includes(f.path))};this.feedback=state.resolved.result;
        }else {
          const originals=state.mode==='group'?state.originals:[state.original];state.resolved=this.services.resolver.translateGroup(this.engine,originals,delta,{transform:this.transform()});
          const a=MI.MeasurementGeometry.anchors(originals[0])[0],b=MI.MeasurementGeometry.anchors({...originals[0],...state.resolved.patches[0].patch})[0];
          operation='object.translate';payload={ids:state.mode==='group'?this.selectedIds:[state.id],delta:{x:b.x-a.x,y:b.y-a.y}};this.feedback=state.resolved.result;
        }
        this.runtimePreview(state,operation,payload);this.invalidate(true);return;
      }
      if (state.mode === "draw") { state.lastRawPoint = point; this.resolveDraw(); }
      if (state.mode === "label") this.updateObject(state.id, { labelOffsetX: state.offset.x + delta.x, labelOffsetY: state.offset.y + delta.y });
      if (state.mode === "endpoint") { state.resolved = this.services.resolver.endpoint(this.engine, state.original, state.endpoint, point, { transform: this.transform() }); this.feedback = state.resolved.result; }
      if(state.mode==='vertex') { state.resolved=this.services.resolver.polygonVertex(this.engine,state.original,state.vertex,point,{transform:this.transform()}); this.feedback=state.resolved.result; }
      if(state.mode==='group') { state.resolved=this.services.resolver.translateGroup(this.engine,state.originals,delta,{transform:this.transform()});try{const desired=MI.MeasurementGeometry.anchors({...state.originals[0],...state.resolved.patches[0].patch})[0],current=MI.MeasurementGeometry.anchors(this.engine.get(state.originals[0].id))[0];this.execute('object.translate',{ids:this.selectedIds,delta:{x:desired.x-current.x,y:desired.y-current.y}});this.feedback=state.resolved.result;}catch(error){this.status(error.message);} }
      if (state.mode === "object") {
        const o = state.original;
        if(o.type==='angle') { const r=this.services.resolver.translateGroup(this.engine,[o],delta,{transform:this.transform()});this.updateObjects(r.patches);this.feedback=r.result; }
        else if(o.type==='polygon') { state.resolved=this.services.resolver.translatePolygon(this.engine,o,delta,{transform:this.transform()}); try { this.updateObject(state.id,state.resolved.patch); this.feedback=state.resolved.result; } catch(error) { this.status(error.message); } }
        else if (MI.LinearGeometry.isLinear(o)) { state.resolved = this.services.resolver.translateLine(this.engine, o, delta, { transform: this.transform() }); this.updateObject(state.id, state.resolved.patch); this.feedback = state.resolved.result; }
        else { const result = this.snap(o.type === "circle" ? { x: o.cx + delta.x, y: o.cy + delta.y } : { x: o.x + delta.x, y: o.y + delta.y }, state.id); this.updateObject(state.id, o.type === "circle" ? { cx: result.point.x, cy: result.point.y } : { x: result.point.x, y: result.point.y }); this.feedback = result; }
      }
      if (state.mode === "pan") try { this.execute("view.pan",{bounds:{ xMin: state.bounds.xMin - delta.x, xMax: state.bounds.xMax - delta.x, yMin: state.bounds.yMin - delta.y, yMax: state.bounds.yMax - delta.y }}); } catch (e) { this.status(e.message); return; }
      this.invalidate(true);
    }
    pointerUp(event) {
      if(this.interaction?.mode==='marquee' && !this.interaction.keyboard && event.pointerId===this.interaction.pointerId){this.updateRectangle({x:event.clientX,y:event.clientY});this.commit();return;}
      if(this.interaction && ['polygon','construction'].includes(this.interaction.mode) && event.pointerId===this.interaction.pointerId) { const state=this.interaction,id=state.pointerId; state.pointerId=null; this.release({...state,pointerId:id}); return; }
      if (this.interaction && event.pointerId === this.interaction.pointerId) this.commit();
      else if (!this.interaction && this.feedback && (!event.target || this.nodes.canvasWrap.contains(event.target))) { this.feedback = null; this.invalidate(); }
    }
    commit() {
      const state = this.interaction; if (!state) return;
      this.interaction = null; this.release(state); this.engine.renderer.preview = null; this.feedback = null;
      if(this.runtime && state.transaction) {try {if(state.rejected)this.runtime.cancel(state.transaction);else this.runtime.commit(state.transaction,state.finalPayload);}catch(error){this.status(error.message);}this.invalidate();return;}
      if(this.runtime && ['object','group','label','endpoint','vertex','pan'].includes(state.mode)){this.invalidate();return;}
      if(state.mode==='marquee'){this.suppressMarqueeMenu=!state.keyboard && state.active;this.invalidate();return;}
      if (state.mode === "draw") {
        if (state.resolved && state.resolved.length >= .05) this.selectedId = this.createObject(state.resolved.object,state.shape).id;
        else this.status("Vorm te kort; geen object toegevoegd.");
      }
      if ((state.mode === "endpoint" || state.mode==='vertex') && state.resolved) { try { this.updateObject(state.id, state.resolved.patch); } catch (error) { this.status(error.message); } }
      this.history.record(state.historyBefore); this.invalidate();
      if(state.mode==='group')this.status('Selectie verplaatst.');
      if(state.lastPointer && ['object','group','label','pan'].includes(state.mode))this.updateHover(state.lastPointer);
    }
    cancel() {
      this.clearHover();
      const state = this.interaction; this.interaction = null;
      if (state) {
        if(this.runtime && state.transaction)try{this.runtime.cancel(state.transaction);}catch(_){}
        if (!this.runtime && (state.mode === "object" || state.mode === "label") && this.engine.get(state.id)) this.engine.update(state.id, state.mode==="label"?{labelOffsetX:state.original.labelOffsetX,labelOffsetY:state.original.labelOffsetY}:state.original);
        if (!this.runtime && state.mode === "pan") this.engine.renderer.setBounds(state.bounds);
        if(!this.runtime && state.mode==='group')this.engine.updateMany(state.originals.map(o=>({id:o.id,patch:o})));
        this.selectedIds=state.selectionIdsBefore || (state.selectionBefore?[state.selectionBefore]:[]); this.release(state);
      }
      this.engine.renderer.preview = null; this.feedback = null;
      if (this.initialized) this.invalidate();
    }
    keyDown(event) {
      const state = this.interaction;
      if (event.key === "Escape" && (this.pendingText || this.colorId)) { event.preventDefault(); this.closeDialogs(true); return; }
      const active = this.document.activeElement;
      const editable = active && (/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable);
      if(!editable && !state && event.key.toLowerCase()==='k' && this.tool==='select'){event.preventDefault();this.startKeyboardRectangle(event);return;}
      if(!editable && state?.mode==='marquee' && state.keyboard) {
        const step=event.altKey?1:10,delta={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];
        if(delta){event.preventDefault();const end={x:state.end.x+delta[0],y:state.end.y+delta[1]};if(state.phase==='anchor'){state.startScreen=end;state.end=end;this.invalidate();}else this.updateRectangle(end);return;}
        if(event.key.toLowerCase()==='c'){event.preventDefault();state.rule=state.rule==='contain'?'cross':'contain';if(state.phase!=='anchor')this.updateRectangle(state.end);else{this.status('Kader: '+(state.rule==='contain'?'omsluiten':'raken')+'; pijlen kiezen beginpunt, Enter zet vast.');this.invalidate();}return;}
        if(event.key==='Enter'){event.preventDefault();if(state.phase==='anchor'){state.phase='end';this.updateRectangle(state.end);}else this.commit();return;}
      }
      if (!editable && (event.ctrlKey || event.metaKey) && ["z", "y"].includes(event.key.toLowerCase())) {
        event.preventDefault(); this.travelHistory(event.key.toLowerCase() === "y" || event.shiftKey); return;
      }
      if(!editable && !this.interaction && (event.ctrlKey||event.metaKey) && event.key.toLowerCase()==='g'){event.preventDefault();if(event.shiftKey)this.ungroupSelection();else this.groupSelection();return;}
      if(!editable && (event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='a') {event.preventDefault();this.cancel();this.tool='select';this.selectedIds=this.engine.model.objects.filter(o=>this.canvasSelectable(o)&&this.groupCanvasSelectable(o.id)).map(o=>o.id);this.invalidate();return;}
      if(!editable && (event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='d') {event.preventDefault();this.duplicateSelection();return;}
      if (event.key === "Escape") { this.cancel(); this.tool = "select"; this.axisMenuOpen = false; this.invalidate(); return; }
      if(state && state.mode==='polygon') {
        if(event.key==='Enter') { event.preventDefault(); this.finishPolygon(); }
        if(event.key==='Backspace') { event.preventDefault(); if(state.vertices.length>1) { state.vertices.pop(); this.polygonPreview(); } else this.cancel(); }
        return;
      }
      if (state && state.mode === "draw") {
        if (/^[0-9.,]$/.test(event.key)) state.typed += event.key === "," ? "." : event.key;
        else if (event.key === "Backspace") state.typed = state.typed.slice(0, -1);
        else if (event.key === "Enter") { this.commit(); event.preventDefault(); return; }
        else return;
        this.resolveDraw(); this.invalidate(); event.preventDefault(); return;
      }
      const focused = this.document.activeElement && this.document.activeElement.tagName;
      if ((event.key === "Delete" || event.key === "Backspace") && this.selectedId && focused !== "INPUT" && focused !== "TEXTAREA") { this.deleteSelection(); }
    }
    zoom(event) {
      if (this.interaction) return; event.preventDefault();
      if (!Number.isFinite(event.deltaY) || event.deltaY === 0) return;
      this.flushEdits(); const before = this.history.capture();
      const r = this.engine.renderer, grid = this.services.grid, point = this.pointer(event); if (!point) return;
      if (event.deltaY < 0 && grid && (r.scale() >= grid.maxScale * (1 - 1e-12) || grid.step(r) <= .1)) { event.stopImmediatePropagation(); this.status("Maximale zoom bereikt (raster: 0,1)."); return; }
      let factor = event.deltaY < 0 ? .85 : 1 / .85;
      if (event.deltaY < 0 && grid) factor = Math.max(factor, r.scale() / grid.maxScale);
      const b = r.bounds, nx = (b.xMax - b.xMin) * factor, ny = (b.yMax - b.yMin) * factor, fx = (point.x - b.xMin) / (b.xMax - b.xMin), fy = (point.y - b.yMin) / (b.yMax - b.yMin);
      try { const bounds={ xMin: point.x - fx * nx, xMax: point.x + (1 - fx) * nx, yMin: point.y - fy * ny, yMax: point.y + (1 - fy) * ny };this.execute("view.zoom",{bounds}); } catch (e) { this.status(e.message); return; }
      this.feedback = null; this.history.record(before); this.invalidate();
    }
    newDocument() {
      if(this.runtime){if(!this.allowed('document.reset'))throw new MI.PermissionError('PERMISSION_DENIED');this.closeDialogs(true);this.cancel();this.execute('document.reset');this.selectedIds=[];this.editBefore=null;this.hydrate();this.invalidate();return;}
      this.closeDialogs(true); this.cancel(); this.flushEdits(); this.invalidateImport();
      let failure = null; if (this.services.draft) try { this.services.draft.clear(this.storage); } catch (e) { failure = e; }
      const r = this.engine.renderer;
      this.execute("document.replace",{document:{ version: 2, type: "geometry", meta: {}, objects: [], presentation: { bounds: { ...DEFAULT_BOUNDS }, showAxes: r.showAxes, showGrid: r.showGrid, showXAxis: true, showYAxis: true, showAxisLabels: true, showOrigin: true, coordinateSystem: "cartesian" } }});
      this.history.clear(); this.editBefore = null; this.selectedId = null; this.axisMenuOpen = false; this.hydrate(); this.invalidate(); this.status(failure ? "Concept kon niet worden gewist: " + failure.message : "Nieuwe illustratie gestart.");
    }
    loadDocument(data) { if(this.runtime)throw new MI.PermissionError("MODE_DENIED"); this.closeDialogs(true); this.cancel(); this.flushEdits(); this.execute("document.replace",{document:data}); this.invalidateImport(); this.history.clear(); this.editBefore = null; this.selectedId = null; this.axisMenuOpen = false; this.hydrate(); this.invalidate(); this.status("Illustratie geladen."); }
    invalidateImport() {
      this.importSerial++;const reader=this.reader;this.reader=null;
      if(reader && reader.readyState===1)reader.abort();
      if(this.nodes.fileInput)this.nodes.fileInput.value='';
    }
    importDocument(data) {
      if(this.runtime)throw new MI.PermissionError('MODE_DENIED');
      // Validate the whole candidate before touching dialogs, captures or history.
      const renderer=this.engine.renderer;
      const options={width:renderer.width,height:renderer.height,padding:renderer.padding,
        bounds:this.interaction?.mode==='pan'?this.interaction.bounds:renderer.bounds,
        background:renderer.background,coordinateSystem:renderer.coordinateSystem,axisStep:renderer.axisStep};
      for(const key of MI.PRESENTATION_FLAGS)options[key]=renderer[key];
      const candidate=new MI.Engine(null,options);candidate.load(data);
      const imported=candidate.toJSON();
      this.closeDialogs(true);this.cancel();this.flushEdits();
      const before=this.history.capture();
      if(JSON.stringify(imported)===before.document){
        this.invalidateImport();this.hydrate();this.invalidate();this.status('Illustratie geladen.');return;
      }
      this.execute('document.replace',{document:imported});this.invalidateImport();
      this.editBefore=null;this.selectedIds=[];this.axisMenuOpen=false;
      this.history.record(before);this.hydrate();this.invalidate();this.status('Illustratie geladen.');
    }
    importFile(event) {
      if(this.runtime)throw new MI.PermissionError("MODE_DENIED");
      const file = event.target.files && event.target.files[0]; if (!file) return;
      const serial = ++this.importSerial;
      if (this.reader && this.reader.readyState === 1) this.reader.abort();
      const reader = this.reader = new this.window.FileReader();
      reader.onload = () => { if (!this.initialized || serial !== this.importSerial) return; try { this.importDocument(JSON.parse(reader.result)); } catch (e) { this.window.alert("JSON kon niet worden geladen: " + e.message); } event.target.value = ""; this.reader = null; };
      reader.onerror = () => { if (this.initialized && serial === this.importSerial) {this.status("JSON kon niet worden gelezen.");event.target.value="";this.reader=null;} };
      reader.readAsText(file);
    }
    openColor(id,property=null) {
      this.cancel(); this.flushEdits(); const object=this.engine.get(id); if(!object || object.locked || !this.colorInput) return;
      this.colorId=id; this.colorProperty=property;
      let color=property ? object.style[property] : this.services.color.value(object);
      if(/^#[0-9a-f]{3}$/i.test(color)) color='#'+color.slice(1).split('').map(c=>c+c).join('');
      this.colorInput.value=/^#[0-9a-f]{6}$/i.test(color) ? color : '#222222';
      this.nodes.colorDialog.showModal(); this.colorInput.focus();
    }
    setColor(id, color) { const object = this.engine.get(id); if (!object || object.locked) return; this.cancel(); if (!this.editBefore) this.editBefore = this.history.capture(); const patch=this.colorProperty ? {style:{[this.colorProperty]:color}} : this.services.color.patch(object,color);if(patch.style)patch.style=Object.fromEntries(Object.entries(patch.style).filter(([k,v])=>MI.PermissionFields.properties.includes('style.'+k) && JSON.stringify(v)!==JSON.stringify(object.style[k])));if(this.runtime){const paths=this.colorProperty?[this.colorProperty]:object.type==='text'?['fill','stroke']:object.type==='point'?['fill','stroke']:['stroke'];const style=(this.colorProperty?{style:{[this.colorProperty]:color}}:this.services.color.patch(object,color)).style;const fields=paths.map(k=>({path:'style.'+k,value:style[k]}));const payload={ids:[id],fields};if(!this.colorTransaction)this.colorTransaction=this.runtime.begin(this.command('object.setProperties',payload));this.runtime.preview(this.colorTransaction,payload);this.colorPayload=payload;}else this.updateObject(id,patch); this.invalidate(); }
    viewClick(event) {
      const target = event.target, find = selector => target.closest(selector); let button;
      if((button=find('[data-layer-add]'))){this.addLayer(this.nodes.viewList.querySelector('[data-layer-new-name]').value);return;}
      if((button=find('[data-layer-visibility]'))){const l=this.engine.model.layers.find(l=>l.id===button.dataset.layerVisibility);this.changeDocument(()=>this.execute('layer.setVisibility',{id:l.id,value:!l.visible}));return;}
      if((button=find('[data-layer-forward]'))){this.moveLayer(button.dataset.layerForward,1);return;}
      if((button=find('[data-layer-backward]'))){this.moveLayer(button.dataset.layerBackward,-1);return;}
      if((button=find('[data-layer-delete]'))){this.changeDocument(()=>this.execute('layer.delete',{id:button.dataset.layerDelete}));return;}
      if ((button = find('[data-view-select="axes"]'))) { this.axisMenuOpen = !this.axisMenuOpen; this.invalidate(); return; }
      if ((button = find('[data-axis-system]')) && !button.disabled) { this.changeDocument(() => { this.execute("document.setPresentation",{fields:[{path:"coordinateSystem",value:button.dataset.axisSystem}]}); this.axisMenuOpen = false; }); return; }
      if ((button = find("[data-color-object]"))) { this.openColor(button.dataset.colorObject); return; }
      if ((button = find('[data-object-lock]'))) { this.changeDocument(()=>{const o=this.engine.get(button.dataset.objectLock);this.execute("object.setLock",{ids:[o.id],value:!o.locked});});return; }
      if ((button = find('[data-select-group]'))) {this.selectObject(button.dataset.selectGroup,event.shiftKey||event.ctrlKey||event.metaKey);return;}
      if ((button = find("[data-select-object]"))) { this.selectObject(button.dataset.selectObject,event.shiftKey || event.ctrlKey || event.metaKey); return; }
      if ((button = find("[data-object-visibility]"))) { this.changeDocument(() => { const object = this.engine.get(button.dataset.objectVisibility); this.execute("object.setVisibility",{ids:[object.id],value:object.visible===false}); }); return; }
      if ((button = find("[data-toggle-label]"))) { this.changeDocument(() => { const object = this.engine.get(button.dataset.toggleLabel); if(!object.locked)this.updateObject(object.id, { showLabel: !object.showLabel }); }); return; }
      if ((button = find("[data-view]"))) { this.cancel(); const key = { axes: "showAxes", grid: "showGrid", snapPoints: "showSnapPoints" }[button.dataset.view]; if (key) { this.changeDocument(() => { this.execute("document.setPresentation",{fields:[{path:key,value:!this.engine.renderer[key]}]}); }); } }
    }
    viewObject(id) {if(this.runtime && this.colorTransaction){const p=this.runtime.previewObject(this.colorTransaction,id);if(p)return p;}if(this.runtime && this.interaction?.transaction && !this.interaction.rejected){const preview=this.runtime.previewObject(this.interaction.transaction,id);if(preview)return preview;} const object = this.engine.get(id), state = this.interaction; return object && !this.runtime && state && (state.mode === "endpoint" || state.mode==='vertex') && state.id === id && state.resolved ? { ...object, ...state.resolved.patch } : object; }
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
      if(this.runtime)this.selectedIds=this.selectedIds.filter(id=>{const caps=this.capabilities(id);return caps.selectCanvas||caps.selectList;});
      const e = this.engine, r = e.renderer, n = this.nodes;
      if (this.services.grid) r.axisStep = this.services.grid.step(r);
      const objects = e.model.all().filter(o=>!this.runtime || this.capabilities(o.id).display).map(object => this.viewObject(object.id));
      n.canvas.innerHTML = r.render({ meta: e.model.meta, layers:e.model.layers, all: () => objects });
      const svg = n.canvas.querySelector("svg"), object = this.selectedId && this.viewObject(this.selectedId);
      if (svg && svg.querySelectorAll) { Array.from(svg.querySelectorAll('[data-object-id]')).filter(node=>this.selectedIds.includes(node.getAttribute('data-object-id'))).forEach(node=>node.classList.add('selected')); }
      if (this.document.createElementNS) {
        this.renderRectangle(svg,r);
        if (this.services.overlays) this.services.overlays.render(svg, r, this.selectedIds.length===1 && this.engine.isDisplayed(object?.id) && (!this.runtime || this.capabilities(object?.id).geometryFields.length)?object:null, this.tool, this.document);
        if (this.services.feedback) this.services.feedback.render(svg, r, this.feedback, this.document);
      }
      if(this.runtime && svg)for(const handle of svg.querySelectorAll('.fzi-line-endpoint, .fzi-polygon-vertex')){const id=handle.getAttribute('data-line-id')||handle.getAttribute('data-polygon-id'),caps=this.capabilities(id),part=handle.getAttribute('data-endpoint'),fields=part?[part==='start'?'x1':'x2',part==='start'?'y1':'y2']:['x','y'].map(k=>'vertices['+handle.getAttribute('data-vertex')+'].'+k);if(!fields.every(k=>caps.geometryFields.includes(k)))handle.remove();}
      this.renderPresentation(true);
      n.objectCount.textContent = objects.length + (objects.length === 1 ? " object" : " objecten");
      this.renderViewList(); this.renderInspector(object);
      if (n.undoBtn) n.undoBtn.disabled = !this.history.canUndo && !this.editBefore;
      if (n.redoBtn) n.redoBtn.disabled = !this.history.canRedo || !!this.editBefore;
      this.document.querySelectorAll('[data-tool-category]').forEach(category=>{const active=Array.from(category.querySelectorAll('[data-tool]')).find(button=>button.dataset.tool===this.tool),label=category.querySelector('[data-active-tool]');if(label)label.textContent=active?' · '+active.textContent.trim():'';});
      this.document.querySelectorAll(".tool").forEach(button => button.classList.toggle("active", button.dataset.tool === this.tool));
      this.restrictControls();
      n.crosshair.hidden = !this.interaction || this.interaction.mode !== "draw" || (this.feedback && this.feedback.snapped && r.showSnapPoints !== false);
      if (this.feedback && this.interaction && this.interaction.mode === "draw") { const p = this.transform().mathToScreen(this.feedback.point), rect = n.canvasWrap.getBoundingClientRect(); n.crosshair.style.left = p.x - rect.left + "px"; n.crosshair.style.top = p.y - rect.top + "px"; }
    }
    renderViewList() {
      const r = this.engine.renderer;
      const rows = ['<div class="view-row"><button class="view-name view-system-btn" type="button" data-view-select="axes">Assenstelsel</button><button class="eye-btn" type="button" data-view="axes">' + eyeIcon(r.showAxes) + '</button>' + (this.axisMenuOpen && this.services.axis ? this.services.axis.html(r) : "") + '</div>', '<div class="view-row"><span class="view-name">Snappunten</span><button class="eye-btn" type="button" data-view="snapPoints">' + eyeIcon(r.showSnapPoints !== false) + '</button></div>'];
      const layers=this.engine.model.layers||[],esc=MI.escapeXml;
      const objectRow=object=>{
        const color = this.services.color ? this.services.color.value(this.viewObject(object.id)) : "#222222";
        return '<div class="view-row' + (this.selectedIds.includes(object.id) ? ' view-row-selected' : '') + '"><button class="view-name view-select-btn" type="button" data-select-object="' + MI.escapeXml(object.id) + '">' + MI.escapeXml(objectName(object)) + '<span class="view-type">' + MI.escapeXml(object.id) + '</span></button><button class="text-btn" title="Label tonen/verbergen" data-toggle-label="' + MI.escapeXml(object.id) + '">' + textIcon(object.showLabel) + '</button><button class="color-btn" title="Kleur wijzigen" aria-label="Kleur wijzigen" type="button" data-color-object="' + MI.escapeXml(object.id) + '" style="--object-color:' + MI.escapeXml(color) + '"><span class="color-swatch"></span></button><button class="eye-btn" title="Object tonen/verbergen" type="button" data-object-visibility="' + MI.escapeXml(object.id) + '">' + eyeIcon(object.visible !== false) + '</button><button class="eye-btn" type="button" data-object-lock="' + MI.escapeXml(object.id) + '" title="' + (object.locked?'Ontgrendelen':'Vergrendelen') + '" aria-label="' + (object.locked?'Ontgrendelen':'Vergrendelen') + '">' + (object.locked?'🔒':'🔓') + '</button></div>';
      };
      const groupsFor=layerId=>{for(const g of this.engine.model.groups||[])if(this.groupRoot(g.id)===g.id && (!layerId||MI.DocumentLayers.index(layers).owner.get(this.groupLeaves(g.id)[0])?.id===layerId)){const leaves=this.groupLeaves(g.id);rows.push('<div class="view-row'+(leaves.every(id=>this.selectedIds.includes(id))?' view-row-selected':'')+'"><button class="view-name view-select-btn" type="button" data-select-group="'+esc(g.id)+'"'+(this.runtime&&!leaves.every(id=>this.capabilities(id).selectList)?' disabled':'')+'>'+esc(g.name)+'<span class="view-type">'+leaves.length+' objecten &middot; '+esc(g.id)+'</span></button></div>');}};
      if(!this.runtime)rows.push('<div class="view-divider"></div><div class="view-row layer-add"><input type="text" data-layer-new-name aria-label="Naam nieuwe laag" maxlength="200" value="Nieuwe laag"><button type="button" class="secondary" data-layer-add>Laag toevoegen</button></div>');
      if(layers.length){
        rows.push('<p class="help-text">Lagen: bovenaan staat vooraan. Nieuwe objecten komen op de bovenste zichtbare laag.</p>');
        const byId=new Map(this.engine.model.objects.map(o=>[o.id,o]));
        for(const l of layers.slice().reverse()){
          const id=esc(l.id),i=layers.findIndex(layer=>layer.id===l.id);rows.push('<section data-layer-row="'+id+'" class="layer-section'+(!l.visible?' layer-hidden':'')+'"><div class="view-row layer-header">'+(this.runtime?'<strong class="view-name">'+esc(l.name)+'</strong>':'<input type="text" data-layer-name="'+id+'" aria-label="Laagnaam" maxlength="200" value="'+esc(l.name)+'"><button class="eye-btn" type="button" data-layer-visibility="'+id+'" title="Laag tonen/verbergen" aria-label="Laag tonen/verbergen" aria-pressed="'+l.visible+'">'+eyeIcon(l.visible)+'</button><button class="eye-btn" type="button" data-layer-forward="'+id+'" title="Laag naar voren" aria-label="Laag naar voren"'+(i===layers.length-1?' disabled':'')+'>&uarr;</button><button class="eye-btn" type="button" data-layer-backward="'+id+'" title="Laag naar achteren" aria-label="Laag naar achteren"'+(i===0?' disabled':'')+'>&darr;</button><button class="eye-btn" type="button" data-layer-delete="'+id+'" title="Laag verwijderen; objecten behouden" aria-label="Laag verwijderen; objecten behouden"'+(layers.length===1?' disabled':'')+'>&times;</button>')+'</div>');
          groupsFor(l.id);for(const objectId of l.members.slice().reverse()){const o=byId.get(objectId);if(o)rows.push(objectRow(o));}rows.push('</section>');
        }
      }else{groupsFor(null);for(const object of this.engine.model.objects)rows.push(objectRow(object));}
      this.nodes.viewList.innerHTML = rows.join("");
    }
    renderInspector(object) {
      const panel = this.nodes.selectionPanel;
      if (!object) { panel.className = "selection-empty"; panel.textContent = "Geen object geselecteerd."; return; }
      panel.className = "selection-panel";
      const grouping=this.runtime?'':'<div class="selection-actions"><button type="button" data-group-selection'+(this.selectedIds.length<2?' disabled':'')+'>Groeperen</button><button type="button" data-ungroup-selection'+(!this.selectedGroups().length?' disabled':'')+'>Groep opheffen</button></div>';
      const layers=this.engine.model.layers||[],owner=MI.DocumentLayers.index(layers).owner,current=owner.get(this.selectedIds[0])?.id,same=this.selectedIds.every(id=>owner.get(id)?.id===current),assignment=!this.runtime&&layers.length?'<label>Laag<select data-layer-assign aria-label="Laag van selectie">'+(!same?'<option value="">Verschillende lagen</option>':'')+layers.slice().reverse().map(l=>'<option value="'+MI.escapeXml(l.id)+'"'+(same&&l.id===current?' selected':'')+'>'+MI.escapeXml(l.name)+(l.visible?'':' (verborgen)')+'</option>').join('')+'</select></label>':'';
      const derived=this.selectedObjects().filter(o=>o.construction),detach=!this.runtime&&derived.length?'<button type="button" class="secondary" data-detach-construction'+(!this.allowed('construction.detach',{ids:derived.map(o=>o.id)})?' disabled':'')+'>Constructie losmaken</button>':'';
      const info=this.selectedIds.length===1?this.constructionPanel(object):'';
      const actions=info+detach+assignment+grouping+'<div class="selection-actions"><button type="button" data-duplicate-selection>Dupliceren</button><button type="button" class="secondary" data-lock-selection>'+ (this.selectedObjects().every(o=>o.locked)?'Ontgrendelen':'Vergrendelen')+'</button></div>';
      if(this.selectedIds.length>1 || object.locked) {panel.innerHTML='<strong>'+ (this.selectedIds.length>1?this.selectedIds.length+' objecten geselecteerd':MI.escapeXml(object.name))+'</strong><p class="help-text">'+(this.editableSelection()?'Sleep een geselecteerd object om de hele selectie te verplaatsen.':'Ontgrendel om de selectie te bewerken.')+'</p>'+actions+'<button class="delete-btn" data-delete-selected'+(!this.editableSelection()?' disabled':'')+'>Verwijder selectie</button>';return;}
      let html = '<strong>' + MI.escapeXml(object.name) + '</strong><code>' + MI.escapeXml(object.id) + '</code><label>Naam<input data-edit="name" value="' + MI.escapeXml(object.name) + '"></label>';
      const keys = MI.LinearGeometry.isLinear(object) ? ['x1', 'y1', 'x2', 'y2'] : { point: ["x", "y"], circle: ["cx", "cy", "r"], text: ["x", "y"] }[object.type];
      for (const key of object.construction?[]:keys || []) html += '<label>' + key + '<input data-edit="' + key + '" type="number" step="0.1" value="' + MI.escapeXml(object[key]) + '"></label>';
      if(object.type==='polygon' || object.type==='angle') object.vertices.forEach((p,i)=>{ for(const key of ['x','y']) html+='<label>Hoekpunt '+(i+1)+' '+key+'<input data-vertex="'+i+'" data-edit="'+key+'" type="number" step="0.1" value="'+MI.escapeXml(p[key])+'"></label>'; });
      if (object.type === "text" && !object.construction) html += '<label>Tekst<input data-edit="text" value="' + MI.escapeXml(object.text) + '"></label>';
      if(MI.LinearGeometry.isLinear(object)||['circle','angle'].includes(object.type)) {
        if(['dimension','angle'].includes(object.type)) html+='<label class="style-toggle"><input type="checkbox" data-edit="measurementLabelOnly"'+(object.measurementLabelOnly?' checked':'')+'>Alleen meetlabel tonen</label>';
        if(!['dimension','angle'].includes(object.type)) html+='<label class="style-toggle"><input type="checkbox" data-edit="showMeasurement"'+(object.showMeasurement?' checked':'')+'>Maat tonen</label>';
        if(object.showMeasurement || ['dimension','angle'].includes(object.type)) {const mode=object.measurementMode||'computed';html+='<label>Maatweergave<select data-edit="measurementMode"><option value="computed"'+(mode==='computed'?' selected':'')+'>Berekende waarde</option><option value="text"'+(mode==='text'?' selected':'')+'>Vrije tekst</option></select></label>';if(mode==='text')html+='<label>Maattekst<input data-edit="measurementText" value="'+MI.escapeXml(object.measurementText||'')+'"></label>';else html+='<p data-measurement-value>'+MI.escapeXml(MI.MeasurementGeometry.label(object))+'</p>';}
      }
      const style=object.style,esc=MI.escapeXml;
      html+='<fieldset class="object-style"><legend>Stijl</legend><button type="button" class="secondary" data-style-color="'+esc(object.id)+'">'+(object.type==='text'?'Tekstkleur':'Lijnkleur')+'</button>';
      if(object.type==='text') html+='<label>Tekstgrootte<input data-style="fontSize" type="number" min="1" step="1" value="'+esc(style.fontSize)+'"></label>';
      else {
        html+='<label>Lijndikte<input data-style="strokeWidth" type="number" min="0" step="0.5" value="'+esc(style.strokeWidth)+'"></label>';
        const options=[['','Doorgetrokken'],['8 5','Gestreept'],['2 5','Gestippeld'],['8 4 2 4','Streep-punt']];
        if(!options.some(o=>o[0]===style.dash)) options.push([style.dash,'Eigen patroon']);
        html+='<label>Lijnpatroon<select data-style="dash">'+options.map(([value,label])=>'<option value="'+esc(value)+'"'+(style.dash===value?' selected':'')+'>'+label+'</option>').join('')+'</select></label>';
        if(['point','circle','polygon'].includes(object.type)) html+='<label class="style-toggle"><input type="checkbox" data-style="fillEnabled"'+(style.fill && style.fill!=='none'?' checked':'')+'>Vulling</label><button type="button" class="secondary" data-fill-object="'+esc(object.id)+'">Vulkleur kiezen</button>';
      }
      html+='<label>Dekking (%)<input data-style="opacity" type="number" min="0" max="100" step="1" value="'+esc(style.opacity*100)+'"></label><p class="help-text">0% is onzichtbaar, 100% is volledig zichtbaar.</p></fieldset>';
      panel.innerHTML = html + actions + '<button class="delete-btn" data-delete-selected>Verwijder object</button>';
    }
    download(name, content, type) { const blob = new this.window.Blob([content], { type }), url = this.window.URL.createObjectURL(blob), link = this.document.createElement("a"); link.href = url; link.download = name; link.click(); this.window.setTimeout(() => this.window.URL.revokeObjectURL(url), 500); }
  }
  // Existing presentation helpers, copied without their old event/render owners.
    function eyeIcon(visible) { if (visible) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" fill="currentColor"/></svg>'; return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M9.9 5.9C10.6 5.7 11.3 5.6 12 5.6c6.5 0 10 6.4 10 6.4-.8 1.2-1.8 2.4-3.1 3.4M6.1 6.1C3.5 7.7 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function textIcon(active) { return '<span class="text-toggle' + (active ? ' active' : '') + '" aria-hidden="true">T</span>'; }
  function objectName(object) { const names = { point: "Punt", line: "Lijnstuk", circle: "Cirkel", text: "Tekst", straight: "Rechte", ray: "Halfrechte", vector: "Vector", polygon: "Veelhoek" }; return object.name || names[object.type] || object.type; }


  MI.EditorApp = EditorApp;
})(window);
