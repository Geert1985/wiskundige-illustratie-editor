/* Explicit editor application: one pointer state and one render owner. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  const DEFAULT_BOUNDS = { xMin: -5, xMax: 5, yMin: -3, yMax: 3 };
  const clone = value => JSON.parse(JSON.stringify(value));
  class EditorApp {
    constructor({ engine, services, document, window, storage }) {
      this.engine = engine; this.services = services; this.document = document; this.window = window; this.storage = storage;
      this.tool = "select"; this.selectedIds = []; this.interaction = null; this.feedback = null;
      this.listeners = []; this.initialized = false; this.axisMenuOpen = false; this.importSerial = 0; this.reader = null; this.renderFrame = null;
      this.history = new (services.history || MI.EditorHistory)(this); this.editBefore = null;
      this.nodes = {};
      for (const id of ["canvas", "canvasWrap", "status", "objectCount", "selectionPanel", "titleInput", "descriptionInput", "crosshair", "viewList", "toolGrid", "resetViewBtn", "newBtn", "saveBtn", "loadBtn", "fileInput", "exportJsonBtn", "exportSvgBtn", "undoBtn", "redoBtn", "textDialog", "textForm", "textValue", "textCancel", "colorDialog", "colorForm", "colorField", "colorPalette", "colorCancel"]) this.nodes[id] = document.getElementById(id);
    }
    get selectedId() { return this.selectedIds[this.selectedIds.length-1] || null; }
    set selectedId(id) { this.selectedIds=id ? [id] : []; }
    selectedObjects() { return this.selectedIds.map(id=>this.engine.get(id)).filter(Boolean); }
    selectObject(id,additive=false) {
      this.cancel(); this.tool='select';
      if(additive) this.selectedIds=this.selectedIds.includes(id)?this.selectedIds.filter(x=>x!==id):[...this.selectedIds,id]; else this.selectedId=id;
      this.invalidate();
    }
    editableSelection() { return !this.selectedObjects().some(o=>o.locked); }
    duplicateSelection() {
      if(!this.selectedIds.length)return;this.changeDocument(()=>{this.selectedIds=this.engine.duplicateMany(this.selectedIds).map(o=>o.id);});
    }
    toggleLockSelection() {
      if(!this.selectedIds.length)return;this.changeDocument(()=>{const objects=this.selectedObjects(),locked=!objects.every(o=>o.locked);this.engine.updateMany(objects.map(o=>({id:o.id,patch:{locked}})));});
    }
    deleteSelection() {
      if(!this.selectedIds.length)return;if(!this.editableSelection()){this.status('Ontgrendel de selectie eerst.');return;}
      this.changeDocument(()=>{const remove=MI.ConstructionService.descendants(this.engine.model.objects,this.selectedIds);const data=this.engine.toJSON();data.objects=data.objects.filter(o=>!remove.has(o.id));this.engine.load(data);this.selectedId=null;});
    }
    on(target, type, fn, options) {
      if (!target) return;
      target.addEventListener(type, fn, options);
      this.listeners.push(() => target.removeEventListener && target.removeEventListener(type, fn, options));
    }
    status(text) { this.nodes.status.textContent = text; }
    hydrate() { this.nodes.titleInput.value = this.engine.model.meta.title || ""; this.nodes.descriptionInput.value = this.engine.model.meta.description || ""; }
    updateMeta() { this.engine.model.meta.title = this.nodes.titleInput.value.trim(); this.engine.model.meta.description = this.nodes.descriptionInput.value.trim(); }
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
      try { fn(); } finally { this.history.record(before); this.invalidate(); }
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
      this.on(n.canvasWrap, 'contextmenu', e => { if(this.suppressMarqueeMenu || (this.interaction?.mode==='marquee' && this.interaction.active)) { e.preventDefault(); this.suppressMarqueeMenu=false; } });
      this.on(this.document.getElementById('rectangleSelectBtn'), 'click', e => this.startKeyboardRectangle(e));
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
        if (input) { this.changeDocument(() => { this.engine.renderer[input.dataset.axisSetting] = input.checked; }); }
      });
      this.on(this.document, "click", e => { if (this.axisMenuOpen && !e.target.closest('[data-view-select="axes"], [data-axis-settings]')) { this.axisMenuOpen = false; this.invalidate(); } });
      this.on(n.selectionPanel, "change", e => {
        const input = e.target.closest("[data-edit], [data-style]"); if (!input || !this.selectedId || !this.editableSelection()) return;
        this.cancel();
        try { this.changeDocument(() => {
          const value=input.type === 'checkbox' ? input.checked : input.type === 'number' ? input.valueAsNumber : input.value;
          let patch;
          if(input.dataset.style) {
            patch={style:this.stylePatch(input)};
          } else patch=input.dataset.vertex != null ? {vertices:this.engine.get(this.selectedId).vertices.map((p,i)=>i===Number(input.dataset.vertex) ? {...p,[input.dataset.edit]:value} : p)} : {[input.dataset.edit]:value};
          this.engine.update(this.selectedId,patch);
        }); }
        catch (error) { this.status(error.message); }
        this.invalidate();
      });
      this.on(n.selectionPanel, "click", e => {
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
      this.on(n.resetViewBtn, "click", () => { this.changeDocument(() => this.engine.renderer.setBounds({ ...DEFAULT_BOUNDS })); });
      this.on(n.newBtn, "click", () => { if (this.window.confirm("Een nieuwe illustratie starten? Het opgeslagen concept en niet-opgeslagen wijzigingen worden verwijderd.")) this.newDocument(); });
      this.on(n.saveBtn, "click", () => { this.cancel(); this.flushEdits(); this.updateMeta(); try { this.services.draft.save(this.engine, this.storage); this.status("Concept opgeslagen in deze browser."); } catch (e) { this.status("Concept kon niet worden opgeslagen: " + e.message); } });
      this.on(n.loadBtn, "click", () => n.fileInput.click());
      this.on(n.fileInput, "change", e => this.importFile(e));
      this.on(n.exportJsonBtn, "click", () => { this.cancel(); this.flushEdits(); this.updateMeta(); this.download("illustratie.json", this.engine.toJSONString(true), "application/json;charset=utf-8"); });
      this.on(n.exportSvgBtn, "click", () => { this.cancel(); this.flushEdits(); this.updateMeta(); this.download("illustratie.svg", this.engine.renderSVG(), "image/svg+xml;charset=utf-8"); });
      if (this.document.createElement && this.document.body) {
        this.colorInput = this.document.createElement("input"); this.colorInput.type = "text"; this.colorInput.dataset.editorColor = "true";
        this.colorInput.id = "colorValue"; this.colorInput.required = true; this.colorInput.pattern = "#[0-9a-fA-F]{6}"; this.colorInput.maxLength = 7;
        (n.colorField || this.document.body).appendChild(this.colorInput);
        this.on(this.colorInput, "input", () => { if (this.validColor()) this.setColor(this.colorId, this.colorInput.value); });
        this.on(this.colorInput, "change", () => { if (!n.colorDialog || !n.colorDialog.open) { this.flushEdits(); this.colorId = null; this.invalidate(); } });
      }
      this.invalidate(); return this;
    }
    dispose() {
      this.closeDialogs(true); this.cancel(); this.flushEdits(); this.initialized = false; this.importSerial++;
      if (this.reader && this.reader.readyState === 1) this.reader.abort(); this.reader = null;
      for (const remove of this.listeners.splice(0)) remove();
      if (this.colorInput) this.colorInput.remove(); this.colorInput = null;
      this.engine.renderer.preview = null; this.feedback = null;
    }
    closeText() { this.pendingText = null; if (this.nodes.textDialog && this.nodes.textDialog.open) this.nodes.textDialog.close(); }
    submitText() {
      const text = this.nodes.textValue.value.trim(), pending = this.pendingText;
      if (!pending || !text) return;
      this.closeText(); this.changeDocument(() => { this.selectedId = this.engine.add({ type: "text", x: pending.point.x, y: pending.point.y, text }).id; });
    }
    validColor() { return this.colorInput && /^#[0-9a-f]{6}$/i.test(this.colorInput.value); }
    closeColor(cancel = false) {
      if (this.colorId) {
        if (cancel && this.editBefore) { this.history.restore(this.editBefore); this.editBefore = null; this.hydrate(); }
        else this.flushEdits();
      }
      this.colorId = null; this.colorProperty=null; if (this.nodes.colorDialog && this.nodes.colorDialog.open) this.nodes.colorDialog.close();
      this.invalidate();
    }
    closeDialogs(cancel = false) { this.closeText(); if (this.colorId) this.closeColor(cancel); }
    constructionRole(kind,index) { return ['area','perimeter'].includes(kind)?'figure':['parallel','perpendicular'].includes(kind)&&index===0?'line':kind==='tangent'&&index===0?'circle':'point'; }
    constructionHint(kind,index=0) { return ({area:'Klik een cirkel, driehoek of veelhoek voor de oppervlakte.',perimeter:'Klik een cirkel, driehoek of veelhoek voor de omtrek.',midpoint:'Middenpunt: kies twee punten, of klik een lijnstuk.',perpendicularBisector:'Middelloodlijn: kies twee punten, of klik een lijnstuk.',parallel:index?'Kies het punt waar de evenwijdige rechte doorheen gaat.':'Kies een lijn of zijde.',perpendicular:index?'Kies het punt waar de loodlijn doorheen gaat.':'Kies een lijn of zijde.',bisector:['Bissectrice: klik een bestaande hoek of een veelhoekhoekpunt, of kies een bestaand punt op de eerste arm.','Kies nu het hoekpunt (waar beide armen samenkomen).','Kies nu een bestaand punt op de tweede arm.'][index],tangent:index?'Kies een punt op of buiten de cirkel.':'Kies een cirkel.'})[kind]; }
    constructionPick(point,role) {
      const transform=this.transform(),screen=transform.mathToScreen(point),candidates=[];
      const distance=p=>{const q=transform.mathToScreen(p);return Math.hypot(q.x-screen.x,q.y-screen.y);};
      const segment=(o,s)=>{const l=MI.ConstructionService.line(o,s),a=transform.mathToScreen({x:l.x1,y:l.y1}),b=transform.mathToScreen({x:l.x2,y:l.y2}),dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(!length)return distance({x:l.x1,y:l.y1});const domain=o.type==='polygon'?[0,1]:MI.LinearGeometry.domain(o),t=Math.max(domain[0],Math.min(domain[1],((screen.x-a.x)*dx+(screen.y-a.y)*dy)/length));return Math.hypot(screen.x-a.x-t*dx,screen.y-a.y-t*dy);};
      for(const o of this.engine.model.objects) {
        if(o.visible===false||(o.construction && o.constructionValid===false))continue;
        const add=(s,d)=>{if(d<=12)candidates.push({source:{objectId:o.id,...s},distance:d,priority:o.type==='point'?0:1});};
        if(role==='figure') {
          if(o.type==='polygon')add({},MI.PolygonGeometry.contains(o.vertices,point)?0:Math.min(...o.vertices.map((v,index)=>segment(o,{part:'edge',index}))));
          if(o.type==='circle'){const radial=Math.hypot(point.x-o.cx,point.y-o.cy),edge=radial?{x:o.cx+(point.x-o.cx)*o.r/radial,y:o.cy+(point.y-o.cy)*o.r/radial}:{x:o.cx+o.r,y:o.cy};add({},radial<=o.r?0:distance(edge));}
        }
        else if(role==='point') {
          if(o.type==='point')add({},distance(o));
          if(MI.LinearGeometry.isLinear(o))for(const part of ['start','end'])add({part},distance(MI.ConstructionService.point(o,{part})));
          if(o.vertices)o.vertices.forEach((v,index)=>add({part:'vertex',index},distance(v)));
        } else if(role==='line') {
          if(MI.LinearGeometry.isLinear(o))add({},segment(o,{}));
          if(o.type==='polygon')o.vertices.forEach((v,index)=>add({part:'edge',index},segment(o,{part:'edge',index})));
        } else if(o.type==='circle') {const radial=Math.hypot(point.x-o.cx,point.y-o.cy);const edge=radial?{x:o.cx+(point.x-o.cx)*o.r/radial,y:o.cy+(point.y-o.cy)*o.r/radial}:{x:o.cx+o.r,y:o.cy};add({},distance(edge));}
      }
      candidates.sort((a,b)=>a.distance-b.distance || a.priority-b.priority || a.source.objectId.localeCompare(b.source.objectId));return candidates[0]&&candidates[0].source;
    }
    constructionClick(point,event) {
      const kind=this.tool.slice(10),state=this.interaction||{mode:'construction',sources:[],selectionIdsBefore:this.selectedIds.slice()};
      const target=event.target&&event.target.closest&&event.target.closest('[data-object-id]'),painted=target&&this.engine.get(target.getAttribute('data-object-id'));
      if(['area','perimeter'].includes(kind)&&painted&&['polygon','circle'].includes(painted.type))state.sources=[{objectId:painted.id}];
      const angle=!state.sources.length&&kind==='bisector'&&(painted&&painted.type==='angle'?painted:(this.engine.selectAt(point.x,point.y,{transform:this.transform(),tolerancePx:12})||{}).object);
      if(angle&&angle.type==='angle'&&angle.visible!==false)state.sources=[0,1,2].map(index=>({objectId:angle.id,part:'vertex',index}));
      let source=this.constructionPick(point,this.constructionRole(kind,state.sources.length));
      if(kind==='bisector' && !state.sources.length && source && source.part==='vertex') {const polygon=this.engine.get(source.objectId);if(polygon.type==='polygon')state.sources=[(source.index+polygon.vertices.length-1)%polygon.vertices.length,source.index,(source.index+1)%polygon.vertices.length].map(index=>({objectId:polygon.id,part:'vertex',index}));}
      if(state.sources.length===MI.ConstructionService.kinds[kind]) {}
      else if(!source && !state.sources.length && ['midpoint','perpendicularBisector'].includes(kind)) {const line=this.constructionPick(point,'line');if(line){const o=this.engine.get(line.objectId);state.sources=o.type==='polygon'?[{objectId:o.id,part:'vertex',index:line.index},{objectId:o.id,part:'vertex',index:(line.index+1)%o.vertices.length}]:[{objectId:o.id,part:'start'},{objectId:o.id,part:'end'}];}}
      else if(source)state.sources.push(source);
      else {this.status('Geen geschikte bron geraakt. '+this.constructionHint(kind,state.sources.length));return;}
      state.pointerId=event.pointerId; this.interaction=state;
      if(this.nodes.canvasWrap.setPointerCapture)try{this.nodes.canvasWrap.setPointerCapture(event.pointerId);}catch(_){}
      if(state.sources.length<MI.ConstructionService.kinds[kind]){this.status(this.constructionHint(kind,state.sources.length));return;}
      this.interaction=null;this.release(state);
      try {this.changeDocument(()=>{this.selectedIds=this.engine.construct(kind,state.sources).map(o=>o.id);});this.tool='select';this.status('Gekoppelde constructie toegevoegd.');}
      catch(error){this.status(error.message);}
      this.invalidate();
    }
    setTool(tool) { this.closeDialogs(true); this.cancel(); this.tool = tool; if(tool.startsWith('construct:'))this.status(this.constructionHint(tool.slice(10))); this.invalidate(); }
    begin(state, event) {
      this.flushEdits();
      this.interaction = { ...state, historyBefore: this.history.capture(), pointerId: event.pointerId, selectionBefore: this.selectedId, selectionIdsBefore:this.selectedIds.slice(), startScreen: { x: event.clientX, y: event.clientY }, transform: this.transform(), typed: "" };
      if (this.nodes.canvasWrap.setPointerCapture) try { this.nodes.canvasWrap.setPointerCapture(event.pointerId); } catch (_) {}
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
      state.result=this.rectangleService().resolve(this.engine.model.objects,state.startScreen,end,{transform:state.transform,bounds:this.engine.renderer.bounds,textGeometry:state.textGeometry,base:state.selectionIdsBefore,operation:state.operation,mode:state.keyboard?state.rule:undefined});
      this.selectedIds=state.result.ids;
      this.status('Kader: '+(state.result.mode==='contain'?'omsluiten':'raken')+' · '+state.result.found.length+' objecten'+(state.keyboard?' · pijlen, Alt voor fijn, C wisselt, Enter bevestigt, Escape annuleert.':''));
      this.invalidate(true);
    }
    startKeyboardRectangle(event={}) {
      if(this.tool!=='select' || this.interaction)return;
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
      this.selectedId=this.engine.add({type:angle?'angle':'polygon',vertices:state.vertices,...(angle?{angleMark:state.shape==='rightAngle'?'right':'arc'}:{})}).id;
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
      const point = this.pointer(event); if (!point) return; event.preventDefault();
      if(this.tool.startsWith('construct:')) {this.constructionClick(point,event);return;}
      if(this.interaction && this.interaction.mode==='polygon') { this.polygonClick(point,event); return; }
      const vertex=event.target && event.target.closest && event.target.closest('.fzi-polygon-vertex');
      if(this.tool==='select' && vertex) {
        const id=vertex.getAttribute('data-polygon-id'),object=this.engine.get(id);
        if(!object || object.visible===false || object.locked) return;
        this.begin({mode:'vertex',id,original:clone(object),vertex:Number(vertex.getAttribute('data-vertex')),resolved:null},event);
        this.selectedId=id; this.invalidate(); return;
      }
      const label = event.target && event.target.closest && event.target.closest(".object-label"), handle = event.target && event.target.closest && event.target.closest(".fzi-line-endpoint");
      if (this.tool === "select" && (label || handle)) {
        const id = (label || handle).getAttribute(label ? "data-label-id" : "data-line-id"), object = this.engine.get(id);
        if (!object || object.visible === false || object.locked) return;
        this.begin({ mode: label ? "label" : "endpoint", id, original: clone(object), endpoint: handle && handle.getAttribute("data-endpoint"), offset: this.labelOffset(object), resolved: null }, event);
        this.selectedId = id; this.invalidate(); return;
      }
      if (this.tool === "point" || this.tool === "text") {
        const result = this.snap(point); const object = { type: this.tool, x: result.point.x, y: result.point.y };
        if (this.tool === "text") {
          this.flushEdits(); this.pendingText = result; this.nodes.textValue.value = "";
          this.nodes.textDialog.showModal(); this.nodes.textValue.focus(); return;
        }
        this.changeDocument(() => { this.selectedId = this.engine.add(object).id; }); this.feedback = result; this.invalidate(); return;
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
      const group = event.target && event.target.closest && event.target.closest('[data-object-id]');
      const painted = group && this.nodes.canvas.contains(group) && this.engine.get(group.getAttribute('data-object-id'));
      const hit = painted && painted.visible !== false ? { object: painted } : this.engine.selectAt(point.x, point.y, { transform: this.transform(), tolerancePx: 8 });
      if(hit && (event.shiftKey || event.ctrlKey || event.metaKey)) { this.selectObject(hit.object.id,true);return; }
      if(hit && this.selectedIds.includes(hit.object.id) && this.selectedIds.length>1) {
        if(!this.editableSelection()){this.status('Ontgrendel de selectie eerst.');return;}
        const originals=this.selectedObjects().filter(o=>!o.construction);if(!originals.length){this.status('Gekoppelde constructies: verplaats de bronobjecten.');return;}this.begin({mode:'group',originals},event);this.invalidate();return;
      }
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
        if (this.tool !== "select" && (!event.target || this.nodes.canvasWrap.contains(event.target))) { const point = this.pointer(event); if (point) { this.feedback = this.snap(point); this.invalidate(true); } }
        return;
      }
      if(state.mode==='construction')return;
      if (state.mode==='polygon') { if(event.isPrimary===false || (state.pointerId!=null && event.pointerId!==state.pointerId)) return; const point=this.pointer(event); if(point) { state.result=this.polygonResult(point); this.polygonPreview(); } return; }
      if (event.pointerId !== state.pointerId) return;
      if(state.mode==='marquee'){this.updateRectangle({x:event.clientX,y:event.clientY});return;}
      const point = this.pointer(event); if (!point) return;
      const delta = state.transform.screenDelta(event.clientX - state.startScreen.x, event.clientY - state.startScreen.y); if (!delta) return;
      if (state.mode === "draw") { state.lastRawPoint = point; this.resolveDraw(); }
      if (state.mode === "label") this.engine.update(state.id, { labelOffsetX: state.offset.x + delta.x, labelOffsetY: state.offset.y + delta.y });
      if (state.mode === "endpoint") { state.resolved = this.services.resolver.endpoint(this.engine, state.original, state.endpoint, point, { transform: this.transform() }); this.feedback = state.resolved.result; }
      if(state.mode==='vertex') { state.resolved=this.services.resolver.polygonVertex(this.engine,state.original,state.vertex,point,{transform:this.transform()}); this.feedback=state.resolved.result; }
      if(state.mode==='group') { state.resolved=this.services.resolver.translateGroup(this.engine,state.originals,delta,{transform:this.transform()});try{this.engine.updateMany(state.resolved.patches);this.feedback=state.resolved.result;}catch(error){this.status(error.message);} }
      if (state.mode === "object") {
        const o = state.original;
        if(o.type==='angle') { const r=this.services.resolver.translateGroup(this.engine,[o],delta,{transform:this.transform()});this.engine.updateMany(r.patches);this.feedback=r.result; }
        else if(o.type==='polygon') { state.resolved=this.services.resolver.translatePolygon(this.engine,o,delta,{transform:this.transform()}); try { this.engine.update(state.id,state.resolved.patch); this.feedback=state.resolved.result; } catch(error) { this.status(error.message); } }
        else if (MI.LinearGeometry.isLinear(o)) { state.resolved = this.services.resolver.translateLine(this.engine, o, delta, { transform: this.transform() }); this.engine.update(state.id, state.resolved.patch); this.feedback = state.resolved.result; }
        else { const result = this.snap(o.type === "circle" ? { x: o.cx + delta.x, y: o.cy + delta.y } : { x: o.x + delta.x, y: o.y + delta.y }, state.id); this.engine.update(state.id, o.type === "circle" ? { cx: result.point.x, cy: result.point.y } : { x: result.point.x, y: result.point.y }); this.feedback = result; }
      }
      if (state.mode === "pan") try { this.engine.renderer.setBounds({ xMin: state.bounds.xMin - delta.x, xMax: state.bounds.xMax - delta.x, yMin: state.bounds.yMin - delta.y, yMax: state.bounds.yMax - delta.y }); } catch (e) { this.status(e.message); return; }
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
      if(state.mode==='marquee'){this.suppressMarqueeMenu=!state.keyboard && state.active;this.invalidate();return;}
      if (state.mode === "draw") {
        if (state.resolved && state.resolved.length >= .05) this.selectedId = this.engine.add(state.resolved.object).id;
        else this.status("Vorm te kort; geen object toegevoegd.");
      }
      if ((state.mode === "endpoint" || state.mode==='vertex') && state.resolved) { try { this.engine.update(state.id, state.resolved.patch); } catch (error) { this.status(error.message); } }
      this.history.record(state.historyBefore); this.invalidate();
    }
    cancel() {
      const state = this.interaction; this.interaction = null;
      if (state) {
        if ((state.mode === "object" || state.mode === "label") && this.engine.get(state.id)) this.engine.update(state.id, state.original);
        if (state.mode === "pan") this.engine.renderer.setBounds(state.bounds);
        if(state.mode==='group')this.engine.updateMany(state.originals.map(o=>({id:o.id,patch:o})));
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
      if(!editable && (event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='a') {event.preventDefault();this.cancel();this.tool='select';this.selectedIds=this.engine.model.objects.filter(o=>o.visible!==false).map(o=>o.id);this.invalidate();return;}
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
      try { r.setBounds({ xMin: point.x - fx * nx, xMax: point.x + (1 - fx) * nx, yMin: point.y - fy * ny, yMax: point.y + (1 - fy) * ny }); } catch (e) { this.status(e.message); return; }
      this.feedback = null; this.history.record(before); this.invalidate();
    }
    newDocument() {
      this.closeDialogs(true); this.cancel(); this.flushEdits(); this.importSerial++;
      if (this.reader && this.reader.readyState === 1) this.reader.abort(); this.reader = null;
      let failure = null; if (this.services.draft) try { this.services.draft.clear(this.storage); } catch (e) { failure = e; }
      const r = this.engine.renderer;
      this.engine.load({ version: 2, type: "geometry", meta: {}, objects: [], presentation: { bounds: { ...DEFAULT_BOUNDS }, showAxes: r.showAxes, showGrid: r.showGrid, showXAxis: true, showYAxis: true, showAxisLabels: true, showOrigin: true, coordinateSystem: "cartesian" } });
      this.history.clear(); this.editBefore = null; this.selectedId = null; this.axisMenuOpen = false; this.hydrate(); this.invalidate(); this.status(failure ? "Concept kon niet worden gewist: " + failure.message : "Nieuwe illustratie gestart.");
    }
    loadDocument(data) { this.closeDialogs(true); this.cancel(); this.flushEdits(); this.engine.load(data); this.history.clear(); this.editBefore = null; this.selectedId = null; this.axisMenuOpen = false; this.hydrate(); this.invalidate(); this.status("Illustratie geladen."); }
    importFile(event) {
      const file = event.target.files && event.target.files[0]; if (!file) return;
      this.cancel(); const serial = ++this.importSerial;
      if (this.reader && this.reader.readyState === 1) this.reader.abort();
      const reader = this.reader = new this.window.FileReader();
      reader.onload = () => { if (!this.initialized || serial !== this.importSerial) return; try { this.loadDocument(JSON.parse(reader.result)); } catch (e) { this.window.alert("JSON kon niet worden geladen: " + e.message); } event.target.value = ""; this.reader = null; };
      reader.onerror = () => { if (this.initialized && serial === this.importSerial) this.status("JSON kon niet worden gelezen."); };
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
    setColor(id, color) { const object = this.engine.get(id); if (!object || object.locked) return; this.cancel(); if (!this.editBefore) this.editBefore = this.history.capture(); this.engine.update(id, this.colorProperty ? {style:{[this.colorProperty]:color}} : this.services.color.patch(object, color)); this.invalidate(); }
    viewClick(event) {
      const target = event.target, find = selector => target.closest(selector); let button;
      if ((button = find('[data-view-select="axes"]'))) { this.axisMenuOpen = !this.axisMenuOpen; this.invalidate(); return; }
      if ((button = find('[data-axis-system]')) && !button.disabled) { this.changeDocument(() => { this.engine.renderer.coordinateSystem = button.dataset.axisSystem; this.axisMenuOpen = false; }); return; }
      if ((button = find("[data-color-object]"))) { this.openColor(button.dataset.colorObject); return; }
      if ((button = find('[data-object-lock]'))) { this.changeDocument(()=>{const o=this.engine.get(button.dataset.objectLock);this.engine.update(o.id,{locked:!o.locked});});return; }
      if ((button = find("[data-select-object]"))) { this.selectObject(button.dataset.selectObject,event.shiftKey || event.ctrlKey || event.metaKey); return; }
      if ((button = find("[data-object-visibility]"))) { this.changeDocument(() => { const object = this.engine.get(button.dataset.objectVisibility); this.engine.update(object.id, { visible: object.visible === false }); }); return; }
      if ((button = find("[data-toggle-label]"))) { this.changeDocument(() => { const object = this.engine.get(button.dataset.toggleLabel); if(!object.locked)this.engine.update(object.id, { showLabel: !object.showLabel }); }); return; }
      if ((button = find("[data-view]"))) { this.cancel(); const key = { axes: "showAxes", grid: "showGrid", snapPoints: "showSnapPoints" }[button.dataset.view]; if (key) { this.changeDocument(() => { this.engine.renderer[key] = !this.engine.renderer[key]; }); } }
    }
    viewObject(id) { const object = this.engine.get(id), state = this.interaction; return object && state && (state.mode === "endpoint" || state.mode==='vertex') && state.id === id && state.resolved ? { ...object, ...state.resolved.patch } : object; }
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
      if (svg && svg.querySelectorAll) { Array.from(svg.querySelectorAll('[data-object-id]')).filter(node=>this.selectedIds.includes(node.getAttribute('data-object-id'))).forEach(node=>node.classList.add('selected')); }
      if (this.document.createElementNS) {
        this.renderRectangle(svg,r);
        if (this.services.overlays) this.services.overlays.render(svg, r, this.selectedIds.length===1?object:null, this.tool, this.document);
        if (this.services.feedback) this.services.feedback.render(svg, r, this.feedback, this.document);
      }
      n.objectCount.textContent = objects.length + (objects.length === 1 ? " object" : " objecten");
      this.renderViewList(); this.renderInspector(object);
      if (n.undoBtn) n.undoBtn.disabled = !this.history.canUndo && !this.editBefore;
      if (n.redoBtn) n.redoBtn.disabled = !this.history.canRedo || !!this.editBefore;
      this.document.querySelectorAll('[data-tool-category]').forEach(category=>{const active=Array.from(category.querySelectorAll('[data-tool]')).find(button=>button.dataset.tool===this.tool),label=category.querySelector('[data-active-tool]');if(label)label.textContent=active?' · '+active.textContent.trim():'';});
      this.document.querySelectorAll(".tool").forEach(button => button.classList.toggle("active", button.dataset.tool === this.tool));
      n.crosshair.hidden = !this.interaction || this.interaction.mode !== "draw" || (this.feedback && this.feedback.snapped && r.showSnapPoints !== false);
      if (this.feedback && this.interaction && this.interaction.mode === "draw") { const p = this.transform().mathToScreen(this.feedback.point), rect = n.canvasWrap.getBoundingClientRect(); n.crosshair.style.left = p.x - rect.left + "px"; n.crosshair.style.top = p.y - rect.top + "px"; }
    }
    renderViewList() {
      const r = this.engine.renderer;
      const rows = ['<div class="view-row"><button class="view-name view-system-btn" type="button" data-view-select="axes">Assenstelsel</button><button class="eye-btn" type="button" data-view="axes">' + eyeIcon(r.showAxes) + '</button>' + (this.axisMenuOpen && this.services.axis ? this.services.axis.html(r) : "") + '</div>', '<div class="view-row"><span class="view-name">Snappunten</span><button class="eye-btn" type="button" data-view="snapPoints">' + eyeIcon(r.showSnapPoints !== false) + '</button></div>'];
      for (const object of this.engine.model.objects) {
        const color = this.services.color ? this.services.color.value(object) : "#222222";
        rows.push('<div class="view-row' + (this.selectedIds.includes(object.id) ? ' view-row-selected' : '') + '"><button class="view-name view-select-btn" type="button" data-select-object="' + MI.escapeXml(object.id) + '">' + MI.escapeXml(objectName(object)) + '<span class="view-type">' + MI.escapeXml(object.id) + '</span></button><button class="text-btn" title="Label tonen/verbergen" data-toggle-label="' + MI.escapeXml(object.id) + '">' + textIcon(object.showLabel) + '</button><button class="color-btn" title="Kleur wijzigen" aria-label="Kleur wijzigen" type="button" data-color-object="' + MI.escapeXml(object.id) + '" style="--object-color:' + MI.escapeXml(color) + '"><span class="color-swatch"></span></button><button class="eye-btn" title="Object tonen/verbergen" type="button" data-object-visibility="' + MI.escapeXml(object.id) + '">' + eyeIcon(object.visible !== false) + '</button><button class="eye-btn" type="button" data-object-lock="' + MI.escapeXml(object.id) + '" title="' + (object.locked?'Ontgrendelen':'Vergrendelen') + '" aria-label="' + (object.locked?'Ontgrendelen':'Vergrendelen') + '">' + (object.locked?'🔒':'🔓') + '</button></div>');
      }
      this.nodes.viewList.innerHTML = rows.join("");
    }
    renderInspector(object) {
      const panel = this.nodes.selectionPanel;
      if (!object) { panel.className = "selection-empty"; panel.textContent = "Geen object geselecteerd."; return; }
      panel.className = "selection-panel";
      const actions='<div class="selection-actions"><button type="button" data-duplicate-selection>Dupliceren</button><button type="button" class="secondary" data-lock-selection>'+ (this.selectedObjects().every(o=>o.locked)?'Ontgrendelen':'Vergrendelen')+'</button></div>';
      if(this.selectedIds.length>1 || object.locked) {panel.innerHTML='<strong>'+ (this.selectedIds.length>1?this.selectedIds.length+' objecten geselecteerd':MI.escapeXml(object.name))+'</strong><p class="help-text">'+(this.editableSelection()?'Sleep een geselecteerd object om de hele selectie te verplaatsen.':'Ontgrendel om de selectie te bewerken.')+'</p>'+actions+'<button class="delete-btn" data-delete-selected'+(!this.editableSelection()?' disabled':'')+'>Verwijder selectie</button>';return;}
      let html = '<strong>' + MI.escapeXml(object.name) + '</strong><code>' + MI.escapeXml(object.id) + '</code><label>Naam<input data-edit="name" value="' + MI.escapeXml(object.name) + '"></label>';
      if(object.construction) html+='<p class="help-text">Gekoppeld aan: '+object.construction.sources.map(s=>MI.escapeXml(s.objectId)).join(', ')+'.</p>'+((object.construction && object.constructionValid===false)?'<p>Constructie bestaat momenteel niet; wijzig de bronobjecten om te herstellen.</p>':'');
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
