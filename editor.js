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
      this.inspectorTarget="objects";this.navigationMode="select";this.sectionState=new Map();this.tool = "select"; this.selectedIds = []; this.interaction = null; this.feedback = null;
      this.hoverId=null; this.hoverHit=null; this.hoverFrame=null; this.hoverPointer=null; this.presentationKey=null;
      this.listeners = []; this.initialized = false; this.axisMenuOpen = false; this.importSerial = 0; this.reader = null; this.renderFrame = null;this.richTextEditor=null;this.textEditId=null;this.textEditorRequest=0;
      this.history = new (this.runtime ? MI.RuntimeHistory : services.history || MI.EditorHistory)(this); this.editBefore = null;
      this.nodes = {};
      for (const id of ["toolInstructions", "canvasFullscreenBtn", "canvasToolsBtn", "canvasToolsMenu", "fullscreenHint", "canvas", "canvasWrap", "status", "objectCount", "selectionPanel", "titleInput", "descriptionInput", "crosshair", "viewList", "toolGrid", "resetViewBtn", "newBtn", "saveBtn", "loadBtn", "fileInput", "exportJsonBtn", "exportSvgBtn", "exportPngBtn", "undoBtn", "redoBtn", "textDialog", "textForm", "textValue", "textEditorStatus", "richTextSurface", "richFont", "richFontSize", "richColor", "richColorMenu", "richUndo", "richRedo", "colorDialog", "colorForm", "colorField", "colorPalette", "colorCancel", "viewControls", "navigationTools", "panBtn", "zoomInBtn", "zoomOutBtn", "zoomPercent", "fileMenu", "moreBtn", "propertiesSidebar", "toolsToggle", "propertiesToggle", "propertiesClose", "layersSection", "linearToolMain", "linearToolToggle", "linearToolMenu"]) this.nodes[id] = document.getElementById(id);
      for (const id of ["toolInstructions", "canvasFullscreenBtn", "canvasToolsBtn", "canvasToolsMenu", "fullscreenHint", "canvas", "canvasWrap", "status", "objectCount", "selectionPanel", "titleInput", "descriptionInput", "crosshair", "viewList", "toolGrid", "resetViewBtn", "newBtn", "saveBtn", "loadBtn", "fileInput", "exportJsonBtn", "exportSvgBtn", "exportPngBtn", "undoBtn", "redoBtn", "textDialog", "textForm", "textValue", "textEditorStatus", "richTextSurface", "richFont", "richFontSize", "richColor", "richColorMenu", "richUndo", "richRedo", "colorDialog", "colorForm", "colorField", "colorPalette", "colorCancel", "viewControls", "navigationTools", "panBtn", "zoomInBtn", "zoomOutBtn", "zoomPercent", "fileMenu", "moreBtn", "propertiesSidebar", "toolsToggle", "propertiesToggle", "propertiesClose", "layersSection", "linearToolMain", "linearToolToggle", "linearToolMenu"]) this.nodes[id] = document.getElementById(id);
      this.toolCatalog=MI.ToolCatalog.build(this.nodes.toolGrid);this.splitToolSelection=new Map();this.splitMenuOpen=null;
      for(const group of this.toolCatalog.splits)try{const saved=storage?.getItem('fzi-math-illustration-'+group.storageKey+'-tool'),legacy=saved==='construct:angleXAxis'&&group.id==='angle'?'construct:angleDirections':saved;if(group.toolIds.includes(legacy))this.splitToolSelection.set(group.id,legacy);}catch(_){}
      MI.EditorColor.renderPalette(this.nodes.colorPalette, { groupLabel: "Kleuren" });
      MI.EditorColor.renderPalette(this.nodes.richColorMenu, { buttonClass: "rich-color-swatch", groupLabel: "Tekstkleur kiezen" });
      if (this.nodes.richFontSize?.options && !this.nodes.richFontSize.options.length) for (const preset of MI.TextEditorUX.fontSizes) { const option = document.createElement("option"); option.value = String(preset.pixels); option.textContent = preset.label; this.nodes.richFontSize.add(option); }
    }
    renderCanvasTools() {
      const menu=this.nodes.canvasToolsMenu;if(!menu||typeof menu.append!=='function')return;
      if(!menu.childElementCount){for(const category of this.toolCatalog.list('fullscreen')){const section=this.document.createElement('section'),heading=this.document.createElement('strong');heading.textContent=category.label;section.append(heading);for(const entry of category.entries){if(entry.status==='planned'){const placeholder=this.document.createElement('div');placeholder.className='tool-placeholder';placeholder.innerHTML=entry.markup;section.append(placeholder);continue;}const button=this.document.createElement('button');button.type='button';button.className='tool';button.dataset.canvasTool=entry.id;button.innerHTML=entry.markup;section.append(button);}menu.append(section);}}
      for(const button of menu.querySelectorAll('[data-canvas-tool]')){button.disabled=!this.toolAllowed(button.dataset.canvasTool);button.classList.toggle('active',this.tool===button.dataset.canvasTool);button.setAttribute('aria-pressed',String(this.tool===button.dataset.canvasTool));}
    }
    closeCanvasTools(focus=false) {if(this.nodes.canvasToolsMenu)this.nodes.canvasToolsMenu.hidden=true;this.nodes.canvasToolsBtn?.setAttribute?.('aria-expanded','false');if(focus)this.nodes.canvasToolsBtn?.focus?.();}
    syncFullscreen(active) {
      const entering=active&&!this.canvasFullscreen;this.canvasFullscreen=active;if(entering)this.document.body?.classList.remove('properties-open','tools-open');this.document.body?.classList.toggle('canvas-fullscreen',active);
      const button=this.nodes.canvasFullscreenBtn;if(button){button.setAttribute('aria-pressed',String(active));button.title=active?'Volledig scherm verlaten':'Volledig scherm';button.setAttribute('aria-label',button.title);button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+(active?'M3 3h18v18H3zM17 7l-5 5M12 7v5h5':'M3 3h18v18H3zM10 14l7-7M12 7h5v5')+'"/></svg>';}
      if(this.nodes.fullscreenHint){this.nodes.fullscreenHint.hidden=!active;this.nodes.fullscreenHint.textContent=this.nodes.status.textContent;}
      this.invalidate();
    }
    async toggleCanvasFullscreen() {
      if(this.canvasFullscreen){this.syncFullscreen(false);if(this.document.fullscreenElement)try{await this.document.exitFullscreen();}catch(_){}return;}
      this.syncFullscreen(true);
      try{await this.document.documentElement.requestFullscreen?.();}catch(_){/* Canvas still fills the browser viewport when native fullscreen is unavailable. */}
    }
    selectAxes() { this.closeDialogs(true);this.cancel();this.flushEdits();this.selectedIds=[];this.inspectorTarget='axes';this.axisMenuOpen=true;this.document.body?.classList.remove('tools-open');this.nodes.toolsToggle?.setAttribute?.('aria-expanded','false');this.invalidate();this.radialProperties?.openForAxes(); }
    setNavigation(mode) { this.setTool('select');this.navigationMode=mode==='pan'?'pan':'select';this.clearHover();this.invalidate(); }
    setPresentationFlag(path,value) {
      if(!MI.PRESENTATION_FLAGS.includes(path)||typeof value!=='boolean')throw new MI.PermissionError('INVALID_COMMAND');
      this.changeDocument(()=>this.execute(this.runtime?'view.configure':'document.setPresentation',{fields:[{path,value}]}));
    }
    setCommonProperty(path,value) {
      if(!['style.stroke','style.fill','style.strokeWidth','style.dash','style.opacity','showLabel'].includes(path))throw new MI.PermissionError('INVALID_COMMAND');
      this.changeDocument(()=>this.execute('object.setProperties',{ids:this.selectedIds.slice(),fields:[{path,value}]}));
    }
    commonInspector() {
      const objects=this.selectedObjects(),esc=MI.escapeXml,fields=[['style.stroke','Lijnkleur','text'],['style.fill','Vulkleur','text'],['style.strokeWidth','Lijndikte','number'],['style.dash','Lijnpatroon','text'],['style.opacity','Dekking (%)','number']];
      const html=fields.filter(([path])=>objects.every(o=>path==='style.fill'?['point','circle','polygon','region','text'].includes(o.type):['style.stroke','style.strokeWidth','style.dash'].includes(path)?o.type!=='text':true)).map(([path,label,type])=>{
        const values=objects.map(o=>path.split('.').reduce((v,k)=>v?.[k],o)),same=values.every(v=>v===values[0]),value=same?(path==='style.opacity'?values[0]*100:values[0]):'';
        const enabled=this.allowed('object.setProperties',{ids:this.selectedIds,fields:[{path,value:values[0]}]});
        return '<label>'+label+'<input data-common="'+path+'" type="'+type+'" value="'+esc(value)+'" placeholder="Verschillend"'+(path==='style.opacity'?' min="0" max="100"':path==='style.strokeWidth'?' min="0" step="0.5"':'')+(!enabled?' disabled':'')+'></label>';
      }).join('');const labelAllowed=this.allowed('object.setProperties',{ids:this.selectedIds,fields:[{path:'showLabel',value:true}]}),labels=objects.map(o=>o.showLabel),mixed=labels.some(v=>v!==labels[0]);return '<details data-property-section="common" open><summary>Gemeenschappelijk uiterlijk</summary>'+html+'<label class="style-toggle"><input type="checkbox" data-common="showLabel"'+(labels.every(Boolean)?' checked':'')+(mixed?' data-mixed="true"':'')+(!labelAllowed?' disabled':'')+'>Labels tonen'+(mixed?' (verschillend)':'')+'</label></details>';
    }
    zoomBy(direction) { const b=this.engine.renderer.bounds,screen=this.transform().mathToScreen({x:(b.xMin+b.xMax)/2,y:(b.yMin+b.yMax)/2});this.zoom({deltaY:direction,clientX:screen.x,clientY:screen.y,preventDefault(){},stopImmediatePropagation(){}}); }
    renderSplitTools() {
      for(const group of this.toolCatalog.splits) {
        const main=this.document.getElementById(group.mainId),toggle=this.document.getElementById(group.toggleId),menu=this.document.getElementById(group.menuId);
        const items=Array.from(menu?.querySelectorAll?.('[data-tool]')||[]);if(!main||!toggle||!items.length)continue;
        const selected=this.splitToolSelection.get(group.id),enabled=items.filter(b=>this.toolAllowed(b.dataset.tool)),item=enabled.find(b=>b.dataset.tool===selected)||enabled[0]||items[0];
        main.innerHTML=item.innerHTML;main.dataset.choice=item.dataset.tool;main.disabled=!this.toolAllowed(item.dataset.tool);main.classList.toggle('active',this.tool===item.dataset.tool);
        main.setAttribute('aria-label',item.textContent.trim());main.setAttribute('title',item.textContent.trim());toggle.disabled=!enabled.length;toggle.setAttribute('aria-expanded',String(this.splitMenuOpen===group.id));menu.hidden=this.splitMenuOpen!==group.id;
        if(!menu.hidden){menu.style.left='0px';menu.style.right='auto';menu.style.top='calc(100% + 5px)';menu.style.bottom='auto';const side=main.closest('.sidebar')?.getBoundingClientRect(),anchor=main.getBoundingClientRect();if(side&&group.menuMaxHeight)menu.style.maxHeight=Math.max(0,Math.min(group.menuMaxHeight,Math.max(side.bottom-anchor.bottom-13,anchor.top-side.top-13)))+'px';const box=menu.getBoundingClientRect();if(side){menu.style.left=Math.max(side.left+8-anchor.left,Math.min(0,side.right-8-anchor.left-box.width))+'px';if(box.bottom>side.bottom && anchor.top-box.height-5>=side.top){menu.style.top='auto';menu.style.bottom='calc(100% + 5px)';}}}

      }
    }
    closeSplitMenu(focus=false) {const group=this.toolCatalog.getSplit(this.splitMenuOpen);this.splitMenuOpen=null;this.renderSplitTools();if(focus&&group)this.document.getElementById(group.toggleId)?.focus?.();}
    splitMenuKey(event) {
      const toggle=event.target.closest('[data-split-toggle]'),groupId=toggle?.dataset.splitToggle||this.splitMenuOpen,group=this.toolCatalog.getSplit(groupId);if(!group)return;
      const menu=this.document.getElementById(group.menuId),items=Array.from(menu?.querySelectorAll?.('[data-tool]')||[]).filter(b=>!b.disabled);if(!items.length)return;
      if(toggle && event.key==='ArrowDown'){event.preventDefault();this.splitMenuOpen=group.id;this.renderSplitTools();items[0].focus();return;}
      if(this.splitMenuOpen===group.id && menu.contains(event.target) && ['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const i=items.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?items.length-1:(i+(event.key==='ArrowUp'?-1:1)+items.length)%items.length;items[next].focus();}
    }
    closeFileMenu(returnFocus=false) { if(this.nodes.fileMenu){this.nodes.fileMenu.open=false;if(returnFocus)this.nodes.moreBtn?.focus?.();} }
    decorateInspector() {
      const panel=this.nodes.selectionPanel;if(!panel?.querySelectorAll)return;
      for(const node of panel.querySelectorAll('[data-property-section]')){const key=this.inspectorTarget+':'+node.dataset.propertySection;if(this.sectionState.has(key))node.open=this.sectionState.get(key);}
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
        for(const id of ['newBtn','saveBtn','loadBtn','exportJsonBtn','exportSvgBtn','exportPngBtn','titleInput','descriptionInput'])if(this.nodes[id])this.nodes[id].disabled=false;
        for(const button of this.document.querySelectorAll('[data-tool]'))button.disabled=false;
        return;
      }
      for(const button of this.document.querySelectorAll('[data-tool]'))button.disabled=!this.toolAllowed(button.dataset.tool);
      for(const [id,operation] of [['newBtn','document.reset'],['saveBtn','document.draftSave'],['loadBtn','document.replace'],['exportJsonBtn','document.exportJSON'],['exportSvgBtn','document.exportSVG'],['exportPngBtn','document.exportSVG']])if(this.nodes[id])this.nodes[id].disabled=!this.allowed(operation,operation==='document.replace'?{document:{}}:{});
      for(const [id,path] of [['titleInput','title'],['descriptionInput','description']])this.nodes[id].disabled=!this.allowed('document.setMeta',{fields:[{path,value:this.nodes[id].value}]});
      const object=this.engine.get(this.selectedId),caps=object&&this.capabilities(object.id);
      for(const control of this.nodes.selectionPanel.querySelectorAll('[data-edit], [data-style], [data-style-color], [data-fill-object], [data-region-display], [data-measurement-control]')) {
        let path=control.dataset.style?'style.'+(control.dataset.style==='fillEnabled'?'fill':control.dataset.style):control.dataset.vertex!=null?'vertices['+control.dataset.vertex+'].'+control.dataset.edit:control.dataset.edit;
        if(control.dataset.regionDisplay)path=control.dataset.regionDisplay.startsWith('position.')?'areaDisplay.position':'areaDisplay.'+control.dataset.regionDisplay;
        if(control.dataset.measurementControl!=null)path='measurements';
        if(control.dataset.styleColor)path=object?.type==='text'?'style.fill':'style.stroke';if(control.dataset.fillObject)path='style.fill';
        control.disabled=!caps || ![...(caps.geometryFields||[]),...(caps.propertyFields||[])].includes(path);
      }
      for(const button of this.document.querySelectorAll('[data-object-lock], [data-object-visibility], [data-lock-selection], [data-axis-setting], [data-axis-system], [data-view]'))button.disabled=true;
      for(const control of this.document.querySelectorAll('[data-axis-setting], [data-view]')){const key=control.dataset.axisSetting || {axes:'showAxes',grid:'showGrid'}[control.dataset.view];if(key)control.disabled=!this.allowed('view.configure',{fields:[{path:key,value:!this.engine.renderer[key]}]});}
      for(const button of this.document.querySelectorAll('[data-select-object]'))button.disabled=!this.capabilities(button.dataset.selectObject).selectList;
      for(const button of this.document.querySelectorAll('[data-toggle-label], [data-color-object]'))button.disabled=!this.capabilities(button.dataset.toggleLabel||button.dataset.colorObject).propertyFields?.includes(button.dataset.toggleLabel?'showLabel':this.engine.get(button.dataset.colorObject)?.type==='text'?'style.fill':'style.stroke');
      for(const [selector,operation] of [['[data-delete-selected]','object.delete'],['[data-duplicate-selection]','object.duplicate']])for(const button of this.document.querySelectorAll(selector))button.disabled=!this.selectedIds.length || !this.allowed(operation,{ids:this.selectedIds});
    }
    updateObject(id,patch) {
      const object=this.engine.get(id);if(!object)return null;if(!this.runtime){const candidate={...object,...patch,style:patch.style?{...object.style,...patch.style}:object.style};delete candidate.regionGeometry;delete candidate.regionArea;delete candidate.regionStatus;MI.normaliseObject(candidate);}
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
    set selectedId(id) { this.selectedIds=id ? this.groupLeaves(id) : [];this.openFullscreenObjectProperties(); }
    openFullscreenObjectProperties(){this.radialProperties?.sync();}
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
      this.cancel(); this.inspectorTarget="objects";this.navigationMode="select";this.tool='select';
      const leaves=this.groupLeaves(id);if(source==='canvas'&&!leaves.every(id=>this.canvasSelectable(this.engine.get(id))))return;
      if(additive)this.selectedIds=leaves.every(id=>this.selectedIds.includes(id))?this.selectedIds.filter(id=>!leaves.includes(id)):[...new Set([...this.selectedIds,...leaves])];else this.selectedIds=leaves;
      if(this.runtime)this.selectedIds=this.execute("object.select",{ids:this.selectedIds,source}).selectedIds;
      this.openFullscreenObjectProperties();this.invalidate();
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
      const selectedPathPoint=this.selectedIds.length===1&&this.engine.get(this.selectedId);
      if(!this.runtime&&this.tool==='select'&&this.canvasSelectable(selectedPathPoint)&&MI.ConstructionService.pathKind(selectedPathPoint.construction?.kind)) {
        const position=this.transform()?.mathToScreen({x:selectedPathPoint.x,y:selectedPathPoint.y});
        if(position&&Math.hypot(position.x-event.clientX,position.y-event.clientY)<=8)return {object:selectedPathPoint,kind:'object'};
      }
      const paintedObject=target?.closest?.('[data-object-id]'),painted=paintedObject&&n.canvas.contains(paintedObject)&&this.engine.get(paintedObject.getAttribute('data-object-id'));
      // A real SVG hit identifies the visually topmost overlapping point.
      // Use the enlarged radius only when the pointer is on empty canvas.
      if(painted?.type==='point'&&this.canvasSelectable(painted))return {object:painted};
      // Points can be visually small or partially obscured by nearby SVG.
      // Use the shared 8 CSS-pixel radius, without hijacking labels/endpoints.
      if(this.tool==='select'&&this.navigationMode!=='pan'&&
          !target?.closest?.('.object-label,.fzi-polygon-vertex,.fzi-line-endpoint')){
        const t=this.transform();let nearest=null,nearestDistance=8;
        for(const candidate of this.engine.model.objects){
          if(candidate.type!=='point'||!this.canvasSelectable(candidate))continue;
          const position=t?.mathToScreen({x:candidate.x,y:candidate.y});
          const distance=position?Math.hypot(position.x-event.clientX,position.y-event.clientY):Infinity;
          if(distance<nearestDistance){nearest=candidate;nearestDistance=distance;}
        }
        if(nearest)return {object:nearest,kind:'object'};
      }
      if(painted&&MI.LinearGeometry.isLinear(painted)) {
        let nearest=null,nearestDistance=8;
        for(const point of this.engine.model.objects) {
          if(point.type!=='point'||!this.canvasSelectable(point))continue;
          const position=this.transform()?.mathToScreen({x:point.x,y:point.y});
          const distance=position?Math.hypot(position.x-event.clientX,position.y-event.clientY):Infinity;
          if(distance<=nearestDistance){nearest=point;nearestDistance=distance;}
        }
        if(nearest)return {object:nearest,kind:'object'};
      }
      for(const [selector,attribute,kind] of [['.fzi-polygon-vertex','data-polygon-id','vertex'],['.fzi-line-endpoint','data-line-id','endpoint'],['.object-label','data-label-id','label']]) {
        const node=target?.closest?.(selector),object=node && n.canvas.contains(node) && this.engine.get(node.getAttribute(attribute));
        if(this.canvasSelectable(object))return {object,kind:kind==='label' && this.selectedIds.length>1 && this.selectedIds.includes(object.id)?'object':kind};
      }
      const transform=this.transform(),point=transform?.screenToMath({x:event.clientX,y:event.clientY});
      const object=painted;
      if(this.canvasSelectable(object))return {object};
      const hit=point&&this.engine.selectAt(point.x,point.y,{transform,tolerancePx:8});
      if(hit&&this.canvasSelectable(hit.object))return hit;
      // Keep thin circular and linear strokes on the same 8 CSS-pixel pickup
      // rule as other canvas geometry; labels and endpoints remain explicit.
      if(point&&this.tool==='select'&&this.navigationMode!=='pan'&&
          !target?.closest?.('.object-label,.fzi-polygon-vertex,.fzi-line-endpoint')){
        const nearby=this.engine.selectAt(point.x,point.y,{transform,tolerancePx:8});
        if(nearby&&['circle','line','straight','ray','vector'].includes(nearby.object?.type)&&
            this.canvasSelectable(nearby.object))return nearby;
      }
      return null;
    }
    cursorFor(hit) {
      const state=this.interaction;
      if(!state && this.navigationMode==='pan')return this.allowed('view.pan',{bounds:{...this.engine.renderer.bounds}})?'grab':'default';
      if(this.tool.startsWith('construct:') && (!state || state.mode==='construction'))return hit?'pointer':'crosshair';
       if(state)return ['object','group','label','pan','circleDistributionPoint'].includes(state.mode)?'grabbing':'crosshair';
      if(this.tool!=='select')return 'crosshair';
      if(!hit || !this.canvasSelectable(hit.object))return 'default';
      if(this.groupRoot(hit.object.id)!==hit.object.id && !this.groupCanvasSelectable(hit.object.id))return 'default';
      const o=hit.object;
       const distribution=this.circleDistributionForPoint(o.id),circle=distribution&&this.engine.get(distribution.circleId);
       if(!this.runtime&&distribution&&!o.locked&&!circle?.locked)return 'grab';
      if(!o.locked && !o.construction && (!this.runtime || this.capabilities(o.id).geometryFields.length) && this.groupRoot(o.id)===o.id && ['endpoint','vertex'].includes(hit.kind))return 'crosshair';
      if(!o.locked && (!this.runtime || ['labelOffsetX','labelOffsetY'].every(k=>this.capabilities(o.id).propertyFields.includes(k))) && this.groupRoot(o.id)===o.id && hit.kind==='label')return 'move';
      if(this.selectedIds.includes(o.id) && this.moveSelectionPlan())return 'grab';
      return 'pointer';
    }
     circleDistributionForPoint(id) { return this.engine.model.circleDistributions?.find(d=>d.pointIds.includes(id))||null; }
    hoverAt(event) {
      if(this.navigationMode==='pan')return null;
      if(this.tool.startsWith('construct:') && (!this.interaction || this.interaction.mode==='construction')) {
        const point=this.pointer(event);if(!point)return null;
        const previous=this.interaction?.sources||[],sources=this.constructionSourcesAt(point,event,previous),source=sources?.[previous.length];
        return source?{object:MI.AxisReferences.isAxis(source)?{...MI.AxisReferences.line(source),id:null}:this.engine.get(source.objectId),kind:'construction',source}:null;
      }
      const hit=this.tool==='select' && this.navigationMode!=='pan' && !this.interaction?this.hitAt(event):null;
      return hit && this.groupRoot(hit.object.id)!==hit.object.id && !this.groupCanvasSelectable(hit.object.id)?null:hit;
    }
    renderPresentation(force=false) {
      if(this.hoverId) {
        const object=this.engine.get(this.hoverId),valid=this.tool.startsWith('construct:')?this.constructionSelectable(object):this.canvasSelectable(object)&&this.groupCanvasSelectable(object.id);
        if(!valid){this.hoverId=null;this.hoverHit=null;}else this.hoverHit={...this.hoverHit,object};
      }
      if(force && this.hoverPointer && this.document.elementFromPoint) {
        this.hoverHit=this.hoverAt({...this.hoverPointer,target:this.document.elementFromPoint(this.hoverPointer.clientX,this.hoverPointer.clientY)});this.hoverId=this.hoverHit?.object?.id||null;
      }
      this.nodes.canvasWrap.style.cursor=this.cursorFor(this.hoverHit);
      const construction=this.tool.startsWith('construct:'),selectedIds=construction?[...new Set((this.interaction?.sources||[]).filter(s=>!MI.AxisReferences.isAxis(s)).map(s=>s.objectId))]:this.selectedIds;
      const axisSelected=(this.interaction?.sources||[]).filter(MI.AxisReferences.isAxis),axisHover=MI.AxisReferences.isAxis(this.hoverHit?.source)?this.hoverHit.source:null;const key=JSON.stringify([selectedIds,this.hoverId,construction,axisSelected,axisHover]);if(!force && key===this.presentationKey)return;
      this.presentationKey=key;
      const service=this.services.overlays||MI.EditorOverlays;
      this.renderAxisSourceOverlay(axisSelected,axisHover);
      if(service?.selection)service.selection(this.nodes.canvas.querySelector('svg'),{selectedIds,hoverId:this.hoverId,showFrame:!construction,transform:this.transform(),renderer:this.engine.renderer,document:this.document});
    }
    renderAxisSourceOverlay(selected,hover){
      const svg=this.nodes.canvas.querySelector('svg');if(!svg?.querySelectorAll)return;svg.querySelectorAll('[data-axis-source-overlay]').forEach(node=>node.remove());const r=this.engine.renderer,t=this.transform(),rect=this.nodes.canvas.getBoundingClientRect?.(),bounds=rect&&t?.visibleBounds(rect);if(!bounds)return;
      for(const ref of MI.AxisReferences.references){const chosen=selected.some(s=>s.axis===ref.axis),active=chosen||hover?.axis===ref.axis;if(!active||!r.showAxes||!(ref.axis==='x'?r.showXAxis:r.showYAxis))continue;const node=this.document.createElementNS('http://www.w3.org/2000/svg','line'),attrs=ref.axis==='x'?{x1:r.mapX(bounds.xMin),y1:r.mapY(0),x2:r.mapX(bounds.xMax),y2:r.mapY(0)}:{x1:r.mapX(0),y1:r.mapY(bounds.yMin),x2:r.mapX(0),y2:r.mapY(bounds.yMax)};for(const [key,value] of Object.entries({...attrs,'data-axis-source-overlay':ref.axis,'pointer-events':'none','aria-hidden':'true',stroke:chosen?'#f8cf61':'#55bad9','stroke-width':4,opacity:.8}))node.setAttribute(key,value);svg.appendChild(node);}
    }
    updateHover(event) {
      this.hoverPointer=event?{clientX:event.clientX,clientY:event.clientY,target:event.target}:null;
      const hit=this.hoverAt(event);this.hoverHit=hit;this.hoverId=hit?.object?.id||null;this.renderPresentation();
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
    constructionInputs(object){
      if(this.runtime||!object.construction)return '';
      const roles=MI.ConstructionService.contract(object.construction.kind).sourceRoles,esc=MI.escapeXml,labels={point:'Punt',line:'Lijn',segment:'Lijnstuk',ray:'Halfrechte',circle:'Cirkel',figure:'Figuur',triangle:'Driehoek'};
      return '<div class="construction-inputs"><p class="help-text">Constructiebronnen wijzigen</p>'+roles.map((role,i)=>{const current=object.construction.sources[i],canonical=ref=>JSON.stringify(MI.AxisReferences.isAxis(ref)?ref:{objectId:ref.objectId,...(ref.part!=null?{part:ref.part}:{}),...(ref.index!=null?{index:ref.index}:{})}),options=this.engine.model.objects.filter(o=>o.id!==object.id).flatMap(o=>MI.ConstructionService.referencesForRole(o,role,object.construction.kind).map(ref=>({ref,name:(o.name||o.id)+(ref.part?' ? '+({start:'beginpunt',end:'eindpunt',vertex:'hoekpunt',edge:'zijde'}[ref.part])+(ref.index!=null?' '+(ref.index+1):''):'' )})));if(MI.AxisReferences.supports(object.construction.kind,i))options.unshift(...MI.AxisReferences.references.map(ref=>({ref,name:'Positieve '+ref.axis+'-as'})));return '<label>'+labels[role]+' '+(i+1)+'<select data-construction-input="'+i+'" aria-label="Constructiebron '+(i+1)+'"'+(object.locked?' disabled':'')+'>'+options.map(({ref,name})=>'<option value="'+esc(canonical(ref))+'"'+(canonical(ref)===canonical(current)?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>';}).join('')+'</div>';
    }
    constructionPanel(object){
      const info=this.engine.getConstructionInfo(object.id);if(!info)return '';
      const messages={SOURCE_INVALID:'Een bronconstructie bestaat momenteel niet.',COINCIDENT_POINTS:'De twee bronpunten vallen samen.',DEGENERATE_DIRECTION:'De bronlijn heeft geen geldige richting.',DEGENERATE_ARM:'Een arm van de hoek heeft geen lengte.',DEGENERATE_TRIANGLE:'De driehoek is ontaard of te dicht bij een rechte lijn.',UNDEFINED_EULER_LINE:'De Eulerrechte is niet uniek bij deze gelijkzijdige driehoek.',INVALID_REFERENCE:'Deze constructie vereist een driehoek met precies drie hoekpunten.',INVARIANT_FAILURE:'De numerieke controle van de constructie is mislukt.',ZERO_RADIUS:'De broncirkel heeft straal nul.',POINT_INSIDE_CIRCLE:'Het bronpunt ligt binnen de cirkel.',NON_FINITE_RESULT:'De berekening geeft geen eindige meetwaarde.',COORDINATE_LIMIT:'De berekende positie ligt buiten het ondersteunde bereik.'};
      const link=id=>{const source=this.engine.get(id);return source?'<button type="button" class="secondary" data-construction-source="'+MI.escapeXml(id)+'"'+(this.runtime&&!this.capabilities(id).selectList?' disabled':'')+'>'+MI.escapeXml(source.name||id)+'</button>':'';};
      return '<div class="construction-info" data-construction-mode="'+info.mode+'"><p class="help-text">'+(info.mode==='linked'?'Gekoppelde constructie.':'Vrij object.')+'</p>'+(info.mode==='linked'?'<div>Bronnen: '+info.sources.map(ref=>MI.AxisReferences.isAxis(ref)?'<span>Positieve '+ref.axis+'-as</span>':link(ref.objectId)+(ref.part?'<span class="help-text"> '+({start:'beginpunt',end:'eindpunt',vertex:'hoekpunt',edge:'zijde'}[ref.part]||'')+(ref.index!=null?' '+(ref.index+1):'')+'</span>':'')).join(' ')+(info.hasRestrictedSources?' <span class="help-text">Andere bronnen zijn afgeschermd.</span>':'')+'</div>':'')+(info.dependents.length?'<div>Gebruikt door: '+info.dependents.map(link).join(' ')+'</div>':'')+(!info.valid?'<p class="help-text" data-construction-reason="'+info.reasonCode+'">'+MI.escapeXml(messages[info.reasonCode]||'Constructie bestaat momenteel niet.')+'</p>':'')+'</div>';
    }
    duplicateSelection() {
      if(!this.selectedIds.length)return;this.changeDocument(()=>{this.selectedIds=this.execute('object.duplicate',{ids:this.selectedIds}).result.map(o=>o.id);});
    }
    toggleLockSelection() {
      if(!this.selectedIds.length)return;this.changeDocument(()=>{const objects=this.selectedObjects(),locked=!objects.every(o=>o.locked);this.execute('object.setLock',{ids:objects.map(o=>o.id),value:locked});});
    }
    deleteSelection() {
      if(!this.selectedIds.length)return;if(!this.editableSelection()){this.status('Ontgrendel de selectie eerst.');return;}
      const memberDists=this.engine.model.circleDistributions.filter(d=>d.pointIds.some(id=>this.selectedIds.includes(id)));if(memberDists.length){if(memberDists.length!==1||memberDists[0].pointIds.some(id=>!this.selectedIds.includes(id))||this.selectedIds.some(id=>!memberDists[0].pointIds.includes(id))){this.status('Een distributiepunt kan niet afzonderlijk worden verwijderd. Pas het aantal punten aan of selecteer de volledige verdeling.');return;}const d=memberDists[0],desc=MI.ConstructionService.descendants(this.engine.model.objects,d.pointIds),dependents=[...desc].filter(id=>!d.pointIds.includes(id));if(dependents.length&&!this.window.confirm('Deze puntenverdeling wordt gebruikt door '+dependents.map(id=>this.engine.get(id)?.name||id).join(', ')+'. Verwijder ook deze afhankelijke objecten?'))return;this.changeDocument(()=>{this.execute('circleDistribution.delete',{id:d.id,cascadeDependents:dependents.length>0});this.selectedId=null;this.selectedIds=[];});return;}
      this.changeDocument(()=>{this.execute('object.delete',{ids:this.selectedIds});this.selectedId=null;});
    }
    on(target, type, fn, options) {
      if (!target) return;
      const guarded=event=>{try{fn(event);}catch(error){this.status(error.message);this.invalidate();}};
      target.addEventListener(type, guarded, options);
      this.listeners.push(() => target.removeEventListener && target.removeEventListener(type, guarded, options));
    }
    toolHint(tool) { return MI.ToolInstructions.toolHint(tool); }
    status(text) { if(this.nodes.textDialog?.open)this.nodes.textEditorStatus.textContent=text;this.nodes.status.textContent = text;this.instructionMessage=text;this.renderInstructions(); }
    renderInstructions() { MI.ToolInstructions.render(this); }
    hydrate() { this.nodes.titleInput.value = this.engine.model.meta.title || ""; this.nodes.descriptionInput.value = this.engine.model.meta.description || ""; }
    updateMeta() {const fields=[{path:'title',value:this.nodes.titleInput.value.trim()},{path:'description',value:this.nodes.descriptionInput.value.trim()}].filter(f=>this.engine.model.meta[f.path]!==f.value&&(f.value!==''||f.path in this.engine.model.meta));if(fields.length)this.execute('document.setMeta',{fields});}
    flushEdits() { if (this.editBefore) { this.history.record(this.editBefore); this.editBefore = null; } }
    stylePatch(input) {
      let key=input.dataset.style,value=['number','range'].includes(input.type) ? input.valueAsNumber : input.value;
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
      this.initialized = true; MI.TextFonts?.install?.(this.document); this.hydrate();
      const n = this.nodes;
      this.on(n.textForm, "submit", e => { e.preventDefault(); this.submitText(); });
      this.on(n.textDialog, "cancel", e => { e.preventDefault(); if(!this.textWorkspace?.handleCancel?.())this.closeText(); });this.on(n.textDialog.querySelector("#textDialogClose"),"click",()=>this.closeText());
      this.on(n.textDialog,"click",e=>{const b=e.target.closest('[data-rich-mark]');if(b&&this.richTextEditor){e.preventDefault();this.richTextEditor.toggle(b.dataset.richMark,b.dataset.richScript);}});
      this.on(n.richFont,'change',()=>this.richTextEditor?.setFont(n.richFont.value));this.on(n.richFontSize,'change',()=>{const value=Number(n.richFontSize.value);if(Number.isFinite(value)&&value>=6&&value<=120)this.richTextEditor?.setFontSize(value);});
      this.on(n.richColor,'click',()=>{const open=n.richColorMenu.hidden;n.richColorMenu.hidden=!open;n.richColor.setAttribute('aria-expanded',String(open));if(open)n.richColorMenu.querySelector('[data-color]')?.focus();});
      this.on(n.richColorMenu,'click',event=>{const swatch=event.target.closest('[data-color]');if(!swatch)return;this.richTextEditor?.setColor(swatch.dataset.color);n.richColorMenu.hidden=true;n.richColor.setAttribute('aria-expanded','false');this.richTextEditor?.focus();});
      this.on(n.richColorMenu,'keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();n.richColorMenu.hidden=true;n.richColor.setAttribute('aria-expanded','false');n.richColor.focus();}});
      this.on(n.textDialog,'click',event=>{const align=event.target.closest('[data-rich-align]');if(align)this.richTextEditor?.setAlign(align.dataset.richAlign);});
      this.on(n.richUndo,'click',()=>this.richTextEditor?.undo());this.on(n.richRedo,'click',()=>this.richTextEditor?.redo());
      this.on(n.colorForm, "submit", e => { e.preventDefault(); if (this.validColor()) { if(this.colorPickerChosen!=='none')this.setColor(this.colorId, this.colorInput.value); this.closeColor(); } });
      this.on(n.colorCancel, "click", () => this.closeColor(true));
      this.on(n.colorDialog, "cancel", e => { e.preventDefault(); this.closeColor(true); });
      this.on(n.colorPalette, "click", e => { const button = e.target.closest("[data-color]"); if (button) { this.colorInput.value = button.dataset.color; this.updateColorPicker(button.dataset.color); this.setColor(this.colorId, this.colorInput.value); } });
       const nativeColor=this.document.getElementById('colorNative');
       this.on(nativeColor,"input",()=>{if(!this.colorId)return;this.colorInput.value=nativeColor.value;this.updateColorPicker(nativeColor.value);this.setColor(this.colorId,nativeColor.value);});
      this.on(this.document.getElementById('colorNone'),'click',()=>{if(this.colorProperty==='fill'){this.setColor(this.colorId,'none');this.closeColor(false);}});
      this.on(n.undoBtn, "click", () => this.travelHistory());
      this.on(n.redoBtn, "click", () => this.travelHistory(true));
      this.on(n.canvasWrap, "pointerdown", e => this.pointerDown(e));
      this.on(n.canvasWrap,'pointerleave',()=>{if(!this.interaction)this.clearHover();});
      this.on(n.canvasWrap, 'contextmenu', e => {
        // The select canvas owns right-click: open the contextual radial menu,
        // never a simultaneous native browser menu. Preserve right-drag marquee.
        if((this.tool==='select'&&this.navigationMode!=='pan')||this.suppressMarqueeMenu||(this.interaction?.mode==='marquee'&&this.interaction.active)){
          e.preventDefault();
          this.suppressMarqueeMenu=false;
        }
      });
      this.on(this.window, "pointermove", e => this.pointerMove(e));
      this.on(this.window, "pointerup", e => this.pointerUp(e));
      this.on(this.window, "pointercancel", e => { if (this.interaction && e.pointerId === this.interaction.pointerId) this.cancel(); });
      this.on(n.canvasWrap, "lostpointercapture", e => { if (this.interaction && e.pointerId === this.interaction.pointerId) this.cancel(); });
      this.on(this.window, "blur", () => {if(this.runtime)this.closeDialogs(true);this.cancel();});
      this.on(this.window, "keydown", e => this.keyDown(e));
      this.on(n.canvasWrap, "wheel", e => this.zoom(e), { capture: true, passive: false });
      this.on(n.toolGrid,'toggle',()=>this.invalidate(),{capture:true});this.on(n.layersSection,'toggle',()=>this.invalidate());
      this.on(n.toolGrid,'keydown',e=>this.splitMenuKey(e));
      this.on(n.toolGrid, "click", e => {const toggle=e.target.closest('[data-split-toggle]');if(this.toolCatalog.getSplit(toggle?.dataset.splitToggle)){this.splitMenuOpen=this.splitMenuOpen===toggle.dataset.splitToggle?null:toggle.dataset.splitToggle;this.renderSplitTools();return;}const main=e.target.closest('[data-split-main]');if(main?.dataset.choice){this.setTool(main.dataset.choice);return;}const button=e.target.closest('[data-tool]');if(button)this.setTool(button.dataset.tool);});
      this.on(n.viewList, "click", e => this.viewClick(e));
      this.on(n.viewControls,"click",e=>this.viewClick(e));
      this.on(n.navigationTools,"click",e=>{if(e.target.closest('[data-view-select=axes]')){this.selectAxes();return;}const button=e.target.closest('[data-tool]');if(button)this.setTool(button.dataset.tool);});
      this.on(n.zoomInBtn,"click",()=>this.zoomBy(-1));this.on(n.zoomOutBtn,"click",()=>this.zoomBy(1));
      for(const [node,cls] of [[n.toolsToggle,'tools-open'],[n.propertiesToggle,'properties-open']])this.on(node,'click',()=>{this.cancel();const other=cls==='tools-open'?'properties-open':'tools-open',otherControl=cls==='tools-open'?n.propertiesToggle:n.toolsToggle;this.document.body?.classList.remove(other);otherControl?.setAttribute?.('aria-expanded','false');this.document.body?.classList.toggle(cls);node.setAttribute?.('aria-expanded',String(this.document.body?.classList.contains(cls)));this.invalidate();});
      this.on(n.propertiesClose,'click',()=>{this.cancel();this.document.body?.classList.remove('properties-open');n.propertiesToggle.setAttribute?.('aria-expanded','false');n.propertiesToggle.focus?.();});
      this.on(n.selectionPanel,'toggle',e=>{if(e.target.isConnected!==false && e.target.dataset?.propertySection)this.sectionState.set(this.inspectorTarget+':'+e.target.dataset.propertySection,e.target.open);},{capture:true});
      this.on(n.selectionPanel,'focusin',e=>{this.inspectorFocus=e.target;});this.on(n.selectionPanel,'focusout',()=>{this.inspectorFocus=null;});
      this.on(this.window,'resize',()=>{this.cancel();this.invalidate();});
      this.on(n.viewList, "change", e => {
        const layer=e.target.closest('[data-layer-name]');if(layer&&layer.dataset.layerName!=null){this.changeDocument(()=>this.execute('layer.rename',{id:layer.dataset.layerName,name:layer.value}));return;}
        const input = e.target.closest("[data-axis-setting]");
        if (input) { this.setPresentationFlag(input.dataset.axisSetting,input.checked); }
      });
      this.on(this.document,"click",e=>{if(this.splitMenuOpen&&!e.target.closest('.tool-split'))this.closeSplitMenu();if(n.fileMenu?.open && !e.target.closest('#fileMenu'))this.closeFileMenu();if(e.target.closest('#fileMenu button'))this.closeFileMenu();});
      this.on(n.selectionPanel, "input", e => {
        const distributionControl=e.target.closest('[data-circle-distribution]');if(distributionControl){if(!this.circleDistributionPreview)this.circleDistributionPreview={history:this.history.capture(),nextId:this.engine.model._nextId};const preview=this.circleDistributionPreview;this.engine.load(JSON.parse(preview.history.document));this.engine.model._nextId=preview.nextId;const object=this.engine.get(this.selectedId),prior=this.engine.model.circleDistributions.find(d=>d.pointIds.includes(object.id)),count=distributionControl.dataset.circleDistribution==='count'?distributionControl.valueAsNumber:(prior?.count||1),startAngle=distributionControl.dataset.circleDistribution==='startAngle'?distributionControl.valueAsNumber*Math.PI/180:(prior?.startAngle??2*Math.PI*(object.construction?.parameter||0));try{this.engine.setCircleDistribution(object.id,{count,startAngle});}catch(error){this.status(error.message);}const distributionCount=e.target.closest('[data-circle-distribution="count"]');if(distributionCount)distributionCount.parentElement.querySelector('output').textContent=distributionCount.value;this.renderCanvasPreview();return;}
        const regionPrecision=e.target.closest('[data-region-display="precision"]');
         if(regionPrecision?.type==='range'){
           const value=regionPrecision.parentElement.querySelector('output');
           if(value)value.textContent=regionPrecision.value;
         }
         const slider=e.target.closest('[data-style="strokeWidth"], [data-style="opacity"], [data-style="fontSize"]');
        const pathSlider=e.target.closest('[data-path-parameter]');if(pathSlider?.hasAttribute?.('data-path-parameter')){pathSlider.parentElement.querySelector('output').textContent=Number((pathSlider.valueAsNumber*100).toFixed(1))+'%';}
        if(slider?.type==='range'){const value=slider.parentElement.querySelector('output');if(value)value.textContent=slider.value+(slider.dataset.style==='opacity'?'%':' px');}
      });
      for(const node of [n.toolInstructions,n.fullscreenHint])this.on(node,"change",e=>{if(e.target.matches("[data-region-create-extent]")){this.regionExtent=e.target.value;this.renderInstructions();}});
      this.on(n.selectionPanel, "change", e => {
        const ellipseSum=e.target.closest('[data-ellipse-sum]');if(ellipseSum&&this.selectedId){const object=this.engine.get(this.selectedId),scale=this.engine.model.meta.measurement?.scale||1;try{if(!object||object.type!=='ellipse'||object.construction?.kind!=='ellipseByFociAndSum')throw Error('Alleen de afstandsom van een gekoppelde ellips kan hier worden gewijzigd.');this.changeDocument(()=>this.execute('construction.setSumDistance',{id:object.id,sumDistance:ellipseSum.valueAsNumber/scale}));}catch(error){this.status(error.message);this.invalidate();}return;}
        const individual=e.target.closest('[data-measurement-control]');if(individual&&this.selectedId){try{const object=this.engine.get(this.selectedId),key=individual.dataset.measurementKey,field=individual.dataset.measurementField,settings=object.measurements?MI.MeasurementGeometry.measurementSettings(object.measurements,object):MI.MeasurementGeometry.defaultMeasurementSettings(object);if(!settings.values[key])throw Error('Onbekende meetsoort.');settings.values[key][field]=field==='visible'?individual.checked:field==='precision'?(individual.value===''?null:individual.valueAsNumber):individual.value;this.changeDocument(()=>this.execute('object.setProperties',{ids:[object.id],fields:[{path:'measurements',value:settings}]}));}catch(error){this.status(error.message);this.invalidate();}return;}
        const extentControl=e.target.closest('[data-region-extent]');if(extentControl?.dataset?.regionExtent!=null&&this.selectedId){try{this.changeDocument(()=>this.execute('construction.setExtent',{id:this.selectedId,extent:extentControl.value}));}catch(error){this.status(error.message);}this.invalidate();return;}
        const regionControl=e.target.closest('[data-region-display]');if(regionControl?.dataset.regionDisplay&&this.selectedId){const key=regionControl.dataset.regionDisplay,object=this.engine.get(this.selectedId),value=regionControl.type==='checkbox'?regionControl.checked:key==='precision'?(regionControl.value===''?null:regionControl.valueAsNumber):key==='position.dx'||key==='position.dy'?regionControl.valueAsNumber:regionControl.value;let fields;if(key==='position.mode')fields=[{path:'areaDisplay.position',value:value==='offset'?{mode:'offset',dx:object.areaDisplay.position.dx||0,dy:object.areaDisplay.position.dy||0}:{mode:'auto'}}];else if(key==='position.dx'||key==='position.dy')fields=[{path:'areaDisplay.position',value:{mode:'offset',dx:key==='position.dx'?value:object.areaDisplay.position.dx||0,dy:key==='position.dy'?value:object.areaDisplay.position.dy||0}}];else fields=[{path:'areaDisplay.'+key,value}];try{this.changeDocument(()=>this.execute('object.setProperties',{ids:[object.id],fields}));}catch(error){this.status(error.message);}this.invalidate();return;}
        const distribution=e.target.closest('[data-circle-distribution]');if(distribution?.dataset.circleDistribution&&this.selectedId){const historyBefore=this.circleDistributionPreview?.history||this.history.capture();try{if(this.circleDistributionPreview){this.engine.load(JSON.parse(historyBefore.document));this.engine.model._nextId=this.circleDistributionPreview.nextId;}const object=this.engine.get(this.selectedId),prior=this.engine.model.circleDistributions.find(d=>d.pointIds.includes(object.id)),count=distribution.dataset.circleDistribution==='count'?distribution.valueAsNumber:(prior?.count||1),startAngle=distribution.dataset.circleDistribution==='startAngle'?distribution.valueAsNumber*Math.PI/180:(prior?.startAngle??2*Math.PI*(object.construction?.parameter||0));this.execute('circleDistribution.set',{pointId:object.id,count,startAngle});this.history.record(historyBefore);}catch(error){this.status(error.message);}this.circleDistributionPreview=null;this.invalidate();return;}
        const bindingInput=e.target.closest('[data-text-binding]');if(bindingInput?.dataset?.textBinding&&this.selectedId){const object=this.engine.get(this.selectedId),key=bindingInput.dataset.textBinding;let binding=object.textBinding?{...object.textBinding}:{schema:1,sourceId:'',property:'name',precision:null,prefix:'',suffix:''};if(key==='sourceId'){if(!bindingInput.value)binding=null;else{binding.sourceId=bindingInput.value;if(!MI.DynamicText.propertiesFor(this.engine.get(bindingInput.value)).includes(binding.property))binding.property='name';}}else binding[key]=key==='precision'?(bindingInput.value===''?null:Number(bindingInput.value)):bindingInput.value;try{this.changeDocument(()=>this.execute('object.setProperties',{ids:[object.id],fields:[{path:'textBinding',value:binding}]}));}catch(error){this.status(error.message);this.invalidate();}return;}
        const angleDoc=e.target.closest('[data-angle-document]');if(angleDoc?.dataset?.angleDocument){try{const settings=MI.AngleMeasurements.document({...this.engine.model.meta.angleMeasurement||{schema:1,unit:'deg',precision:this.engine.model.meta.measurement?.precision??2},[angleDoc.dataset.angleDocument]:angleDoc.dataset.angleDocument==='precision'?angleDoc.valueAsNumber:angleDoc.value});this.changeDocument(()=>this.execute('document.setAngleMeasurement',{settings}));}catch(error){this.status(error.message);this.invalidate();}return;}
        const angleControl=e.target.closest('[data-angle-setting]');if(angleControl?.dataset?.angleSetting&&this.selectedId){try{const object=this.engine.get(this.selectedId),key=angleControl.dataset.angleSetting,value=key==='showArc'?angleControl.checked:key==='precision'?(angleControl.value===''?null:angleControl.valueAsNumber):angleControl.value,settings=MI.AngleMeasurements.settings({...MI.AngleMeasurements.defaults,...object.angleSettings,[key]:value});this.changeDocument(()=>this.execute('object.setProperties',{ids:[object.id],fields:[{path:'angleSettings',value:settings},...(key==='showArc'&&object.measurementLabelOnly?[{path:'measurementLabelOnly',value:false}]:[])]}));}catch(error){this.status(error.message);this.invalidate();}return;}
        const projection=e.target.closest('[data-point-projection]');if(projection?.dataset?.pointProjection&&this.selectedId){try{const object=this.engine.get(this.selectedId),key=projection.dataset.pointProjection,settings=MI.PointProjections.settings({...MI.PointProjections.defaults,...object.coordinateProjections,[key]:key==='showValues'?projection.checked:projection.value});this.changeDocument(()=>this.execute('object.setProperties',{ids:[object.id],fields:[{path:'coordinateProjections',value:settings}]}));}catch(error){this.status(error.message);this.invalidate();}return;}
        const unitInput=e.target.closest('[data-measurement-setting]');if(unitInput?.dataset?.measurementSetting){try{const old=this.engine.model.meta.measurement||{schema:1,unit:'e',scale:1,precision:2},key=unitInput.dataset.measurementSetting,settings=key==='unit'?MI.MeasurementUnits.convert(old,unitInput.value):MI.MeasurementUnits.settings({...old,[key]:unitInput.valueAsNumber});this.changeDocument(()=>this.execute('document.setMeasurement',{settings}));}catch(error){this.status(error.message);this.invalidate();}return;}

        const position=e.target.closest('[data-path-parameter]');if(position?.hasAttribute?.('data-path-parameter')){try{this.changeDocument(()=>this.execute('construction.setParameter',{id:this.selectedId,value:position.valueAsNumber}));}catch(error){this.status(error.message);}this.invalidate();return;}
        const sourceInput=e.target.closest('[data-construction-input]');if(sourceInput?.dataset.constructionInput!=null){try{const object=this.engine.get(this.selectedId),sources=object.construction.sources.map((ref,i)=>i===Number(sourceInput.dataset.constructionInput)?JSON.parse(sourceInput.value):MI.AxisReferences.isAxis(ref)?{...ref}:{objectId:ref.objectId,...(ref.part!=null?{part:ref.part}:{}),...(ref.index!=null?{index:ref.index}:{}),...(ref.arm!=null?{arm:ref.arm}:{})});this.changeDocument(()=>this.execute('construction.setInputs',{id:object.id,sources}));}catch(error){this.status(error.message);}this.invalidate();return;}
        const layer=e.target.closest('[data-layer-assign]');if(layer&&layer.dataset.layerAssign!=null){this.assignSelectionLayer(layer.value);return;}
        const axis=e.target.closest('[data-axis-setting]');if(axis?.dataset.axisSetting){try{this.setPresentationFlag(axis.dataset.axisSetting,axis.checked);}catch(error){this.status(error.message);this.invalidate();}return;}
        const common=e.target.closest('[data-common]');if(common?.dataset.common){try{this.setCommonProperty(common.dataset.common,common.type==='checkbox'?common.checked:common.type==='number'?(common.dataset.common==='style.opacity'?common.valueAsNumber/100:common.valueAsNumber):common.value);}catch(error){this.status(error.message);this.invalidate();}return;}
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
        if(e.target.closest('[data-region-label-reset]')){try{const object=this.engine.get(this.selectedId);this.changeDocument(()=>this.execute('object.setProperties',{ids:[object.id],fields:[{path:'areaDisplay.position',value:{mode:'auto'}}]}));}catch(error){this.status(error.message);this.invalidate();}return;}
        const resetMeasurement=e.target.closest('[data-measurement-reset]');if(resetMeasurement&&this.selectedId){try{const object=this.engine.get(this.selectedId),key=resetMeasurement.dataset.measurementReset,settings=object.measurements?MI.MeasurementGeometry.measurementSettings(object.measurements,object):MI.MeasurementGeometry.defaultMeasurementSettings(object);settings.values[key].dx=0;settings.values[key].dy=0;this.changeDocument(()=>this.execute('object.setProperties',{ids:[object.id],fields:[{path:'measurements',value:settings}]}));}catch(error){this.status(error.message);this.invalidate();}return;}
        const symbolButton=e.target.closest('[data-measurement-symbol]');
        if(symbolButton){
          const measurementKey=symbolButton.dataset.measurementSymbolKey;
          const input=measurementKey?Array.from(n.selectionPanel.querySelectorAll('[data-measurement-control][data-measurement-field="text"]')).find(node=>node.dataset.measurementKey===measurementKey):n.selectionPanel.querySelector('[data-edit="measurementText"]');
          if(!input||input.disabled||!this.selectedId||!this.editableSelection())return;
          const symbol=symbolButton.dataset.measurementSymbol;
          const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
          input.setRangeText(symbol,start,end,'end');
          input.focus();
          input.dispatchEvent(new Event('change',{bubbles:true}));
          return;
        }
        const axisButton=e.target.closest('[data-axis-setting]');if(axisButton){this.setPresentationFlag(axisButton.dataset.axisSetting,!this.engine.renderer[axisButton.dataset.axisSetting]);return;}
        if(e.target.closest('[data-text-migrate]')){this.openRichText(e.target.closest('[data-text-migrate]').dataset.textMigrate,true);return;}if(e.target.closest('[data-text-restore]')){this.changeDocument(()=>this.execute('text.restoreStatic',{id:e.target.closest('[data-text-restore]').dataset.textRestore}));return;}
        if(e.target.closest('[data-rich-text-edit]')){this.openRichText(e.target.closest('[data-rich-text-edit]').dataset.richTextEdit);return;}
        if(e.target.closest('[data-label-selection]')){this.setCommonProperty('showLabel',!this.selectedObjects().every(o=>o.showLabel));return;}
        const dashButton=e.target.closest('[data-style-dash]');if(dashButton){this.changeDocument(()=>this.updateObject(this.selectedId,{style:{dash:dashButton.value}}));return;}
        const source=e.target.closest('[data-construction-source]');if(source){this.selectObject(source.dataset.constructionSource);return;}
        if(e.target.closest('[data-visibility-selection]')){this.changeDocument(()=>this.execute('object.setVisibility',{ids:this.selectedIds,value:!this.selectedObjects().every(o=>o.visible!==false)}));return;}
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
      this.on(n.canvasFullscreenBtn,'click',()=>this.toggleCanvasFullscreen());
      this.on(this.document,'fullscreenchange',()=>{if(this.document.fullscreenElement)this.syncFullscreen(true);else this.invalidate();});
      this.on(n.canvasToolsBtn,'click',()=>{const menu=n.canvasToolsMenu;this.renderCanvasTools();menu.hidden=!menu.hidden;n.canvasToolsBtn.setAttribute('aria-expanded',String(!menu.hidden));});
      this.on(n.canvasToolsMenu,'click',event=>{const button=event.target.closest('[data-canvas-tool]');if(button&&!button.disabled){this.setTool(button.dataset.canvasTool);this.closeCanvasTools(true);}});
      this.on(n.canvasToolsMenu,'keydown',event=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;const items=[...n.canvasToolsMenu.querySelectorAll('button:not(:disabled)')];if(!items.length)return;event.preventDefault();const i=items.indexOf(event.target),next=event.key==='Home'?0:event.key==='End'?items.length-1:(i+(event.key==='ArrowUp'?-1:1)+items.length)%items.length;items[next].focus();});
      this.on(n.canvasToolsBtn,'keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();this.renderCanvasTools();n.canvasToolsMenu.hidden=false;n.canvasToolsBtn.setAttribute('aria-expanded','true');n.canvasToolsMenu.querySelector('button:not(:disabled)')?.focus();}});
      this.on(this.document,'pointerdown',event=>{if(!event.target.closest('#canvasToolsMenu,#canvasToolsBtn'))this.closeCanvasTools();},true);
      this.on(n.resetViewBtn, "click", () => { this.changeDocument(() => this.execute('view.zoom',{bounds:{...DEFAULT_BOUNDS}})); });
      this.on(n.newBtn, "click", () => {if(this.runtime){this.newDocument();return;} if (this.window.confirm("Een nieuwe illustratie starten? Het opgeslagen concept en niet-opgeslagen wijzigingen worden verwijderd.")) this.newDocument(); });
      this.on(n.saveBtn, "click", () => { if(this.runtime)throw new MI.PermissionError("MODE_DENIED"); this.cancel(); this.flushEdits(); this.updateMeta(); try { if(this.runtime)this.execute('document.draftSave');else this.services.draft.save(this.engine, this.storage);this.savedDocument=JSON.stringify(this.engine.toJSON()); this.status("Concept opgeslagen in deze browser."); } catch (e) { this.status("Concept kon niet worden opgeslagen: " + e.message); } });
      this.on(n.loadBtn, "click", () => {if(this.runtime)throw new MI.PermissionError("MODE_DENIED");n.fileInput.click();});
      this.on(n.fileInput, "change", e => this.importFile(e));
      this.on(n.exportJsonBtn, "click", () => {if(this.runtime && !this.allowed("document.exportJSON"))throw new MI.PermissionError("PERMISSION_DENIED"); this.cancel(); this.flushEdits(); if(!this.runtime)this.updateMeta(); this.download("illustratie.json", this.engine.toJSONString(true), "application/json;charset=utf-8"); });
      this.on(n.exportSvgBtn,'click',()=>this.exportImage('svg'));
      this.on(n.exportPngBtn,'click',()=>this.exportImage('png'));
      if (this.document.createElement && this.document.body) {
        this.colorInput = this.document.createElement("input"); this.colorInput.type = "text"; this.colorInput.dataset.editorColor = "true";
        this.colorInput.id = "colorValue"; this.colorInput.required = true; this.colorInput.pattern = "#[0-9a-fA-F]{6}"; this.colorInput.maxLength = 7;
        (n.colorField || this.document.body).appendChild(this.colorInput);
        this.on(this.colorInput, "input", () => {
           const valid=this.validColor();
           this.colorInput.setAttribute("aria-invalid",String(!valid));
           const apply=this.document.getElementById('colorApply');if(apply)apply.disabled=!valid;
           if(valid){this.updateColorPicker(this.colorInput.value);this.setColor(this.colorId,this.colorInput.value);}
         });
        this.on(this.colorInput, "change", () => { if (!n.colorDialog || !n.colorDialog.open) { this.flushEdits(); this.colorId = null; this.invalidate(); } });
      }
      if(this.runtime)this.listeners.push(this.runtime.subscribe(event=>{
        if(event.type==='context-changed'||event.type==='disposed'){this.closeDialogs(true);}if(event.type==='context-changed'||event.type==='disposed'||this.interaction?.transaction){this.cancel();if(!this.toolAllowed(this.tool))this.tool='select';}
        this.selectedIds=this.selectedIds.filter(id=>this.capabilities(id).selectCanvas||this.capabilities(id).selectList);this.invalidate();
      }));
      this.radialProperties=new MI.RadialProperties(this);
      this.invalidate();if(!this.runtime)this.savedDocument=JSON.stringify(this.engine.toJSON()); return this;
    }
    dispose() {
      this.closeDialogs(true); this.cancel(); this.flushEdits(); this.closeSplitMenu();this.closeCanvasTools();if(this.canvasFullscreen){this.syncFullscreen(false);if(this.document.fullscreenElement)this.document.exitFullscreen?.().catch(()=>{});}this.initialized = false; this.invalidateImport();
      this.radialProperties?.dispose();this.radialProperties=null;
      for (const remove of this.listeners.splice(0)) remove();
      if (this.colorInput) this.colorInput.remove(); this.colorInput = null;
      this.engine.renderer.preview = null; this.feedback = null;
    }
    syncRichToolbar(state){if(!state)return;const syncSelect=(select,entry,values,labelFor)=>{select.querySelectorAll('[data-rich-state-option]').forEach(option=>option.remove());if(entry.mixed){const mixed=this.document.createElement('option');mixed.value='__mixed';mixed.textContent='Gemengde selectie';mixed.dataset.richStateOption='true';select.add(mixed);select.value='__mixed';return;}const value=String(entry.value??'');let option=[...select.options].find(item=>item.value===value);if(!option){option=this.document.createElement('option');option.value=value;option.textContent=`Aangepast (${labelFor(entry.value)})`;option.dataset.richStateOption='true';select.add(option);}select.value=value;};
      syncSelect(this.nodes.richFont,state.fontId,value=>value==='serif'?'Serif':'Sans',value=>value==='serif'?'Serif':'Sans');
      const sizeEntry=state.fontSize;syncSelect(this.nodes.richFontSize,sizeEntry,value=>value, value=>MI.TextEditorUX.pointLabel(value));
      for(const button of this.nodes.textDialog.querySelectorAll('[data-rich-mark]')){const key=button.dataset.richMark==='script'?'script':button.dataset.richMark,entry=state[key],pressed=key==='script'?entry.value===button.dataset.richScript:entry.value===true;button.setAttribute('aria-pressed',entry.mixed?'mixed':String(pressed));button.classList.toggle('is-mixed',entry.mixed);}
      for(const button of this.nodes.textDialog.querySelectorAll('[data-rich-align]')){const entry=state.align,pressed=entry.value===button.dataset.richAlign;button.setAttribute('aria-pressed',entry.mixed?'mixed':String(pressed));button.classList.toggle('is-mixed',entry.mixed);}
      const color=state.color,button=this.nodes.richColor,hex=typeof color.value==='string'?color.value:'#888888',known=MI.EditorColor.palette.some(item=>item.value.toLowerCase()===hex.toLowerCase());button.style.setProperty('--rich-text-color',hex);button.classList.toggle('is-mixed',color.mixed);button.classList.toggle('is-custom',!color.mixed&&!known);button.title=color.mixed?'Tekstkleur: gemengde selectie':!known?`Tekstkleur: Aangepast (${hex})`:`Tekstkleur: ${MI.EditorColor.palette.find(item=>item.value.toLowerCase()===hex.toLowerCase())?.label||hex}`;button.setAttribute('aria-label',button.title);for(const swatch of this.nodes.richColorMenu.querySelectorAll('[data-color]')){const active=!color.mixed&&swatch.dataset.color.toLowerCase()===hex.toLowerCase();swatch.setAttribute('aria-pressed',String(active));swatch.classList.toggle('active',active);}this.nodes.richUndo.disabled=!state.canUndo;this.nodes.richRedo.disabled=!state.canRedo;
    }
    async openRichText(id=null,migrateLegacy=false){const request=++this.textEditorRequest,object=id?this.engine.get(id):null;if(id&&(!object||object.type!=='text'||object.textBinding&&!migrateLegacy||object.construction))return;this.flushEdits();this.textExpectedRevision=this.command('text.commit',{}).expectedDocumentRevision;this.textReturnFocus=this.document.activeElement;this.textEditId=id;this.textMigrateLegacy=migrateLegacy;this.textPermissionEpoch=this.runtime?.permissionEpoch;let initial;try{initial=(migrateLegacy?MI.TextValues.migrate(object):null)||object?.textContent||{schema:1,defaults:{fontId:object?.style?.fontFamily?.includes('Serif')?'serif':'sans',fontSize:object?.style?.fontSize||16,color:object?.style?.fill&&/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(object.style.fill)?object.style.fill:'#222222'},width:null,paragraphs:[{id:'p1',align:'left',lineHeight:1.25,runs:object?.text?[{id:'r1',kind:'text',text:object.text,marks:{}}]:[]}]};}catch(error){this.closeText();this.status(error.message);return;}try{const adapter=await MI.RichTextEditor.load();if(MI.MathFragments.has([{textContent:initial}]))await MI.MathFragments.load();if(request!==this.textEditorRequest)return;this.nodes.richColorMenu.hidden=true;this.nodes.richColor?.setAttribute?.('aria-expanded','false');this.textInsertPanel?.destroy();this.richTextEditor?.destroy();this.richTextEditor=adapter.mount(this.nodes.richTextSurface,initial,content=>{if(content){const surface=this.nodes.richTextSurface.querySelector('.ProseMirror');if(surface)surface.style.maxWidth=content.width==null?'none':content.width+'px';}},{resolveValue:run=>this.resolveTextValue(run),onStateChange:state=>this.syncRichToolbar(state)});this.syncRichToolbar(this.richTextEditor.toolbarState?.());this.textInsertPanel=MI.TextInsertPanel.mount(this.nodes.textDialog,this.richTextEditor,{sourceOptions:()=>this.textSourceOptions(),precisionFor:binding=>this.textValuePrecision(binding),resolveValue:run=>this.resolveTextValue(run)});if(this.runtime){const target=id?{kind:'existing',id}:{kind:'new',position:{...this.pendingText.point}},payload={target,content:initial,...(migrateLegacy?{migrateLegacy:true}:{})};this.textTransaction=this.runtime.begin(this.command('text.commit',payload));}this.document.getElementById("textSubmit").textContent=id?"▣ Wijzigingen opslaan":"▣ Toevoegen";this.nodes.textEditorStatus.textContent='';this.textWorkspace=MI.TextWorkspace.mount(this.nodes.textDialog,{onClose:()=>this.closeText(),onEscape:()=>this.textInsertPanel?.cancelPending?.()||false});this.textWorkspace.open();const surface=this.nodes.richTextSurface.querySelector?.('.ProseMirror');if(surface)surface.style.maxWidth=initial.width==null?'none':initial.width+'px';this.richTextEditor.focus();}catch(error){if(request===this.textEditorRequest){this.closeText();this.status(error.code==='MISSING_SOURCE_PERMISSION'?'Deze tekst bevat momenteel niet-toegestane bronvelden.':'Teksteditor kon niet worden geladen.');}}}
    resolveTextValue(run){return MI.TextValues.resolve(run,new Map(this.engine.model.objects.map(o=>[o.id,o])),this.engine.model.meta,(id,property)=>!this.runtime||this.engine.textSourceAllowed(id,property));}
    textValuePrecision(binding){
      if(this.runtime&&!this.engine.textSourceAllowed(binding.sourceId,binding.property))return 2;
      const meta=this.engine.model.meta;
      if(binding.property==='angle')return this.engine.get(binding.sourceId)?.angleSettings?.precision??meta.angleMeasurement?.precision??meta.measurement?.precision??2;
      return meta.measurement?.precision??2;
    }
    textSourceOptions(){return this.engine.model.objects.filter(o=>MI.DynamicText.propertiesFor(o).length).map(o=>({id:o.id,name:o.name||o.id,properties:MI.DynamicText.propertiesFor(o).filter(property=>!this.runtime||this.engine.textSourceAllowed(o.id,property))})).filter(o=>o.properties.length);}
    closeText() { this.textWorkspace?.destroy();this.textWorkspace=null;if(this.textTransaction){this.runtime?.cancel(this.textTransaction);this.textTransaction=null;}this.nodes.richColorMenu&&(this.nodes.richColorMenu.hidden=true);this.nodes.richColor?.setAttribute?.('aria-expanded','false');this.textMigrateLegacy=false;this.textEditorRequest++;this.pendingText = null;this.textInsertPanel?.destroy();this.textInsertPanel=null;this.richTextEditor?.destroy();this.richTextEditor=null;this.textEditId=null;if (this.nodes.textDialog && this.nodes.textDialog.open) this.nodes.textDialog.close();const focus=this.textReturnFocus;this.textReturnFocus=null;if(focus?.isConnected)focus.focus(); this.renderInstructions(); }
    async submitText() {
      if(this.textInsertPanel?.isOpen()){this.textInsertPanel.announcePending();this.nodes.textEditorStatus.textContent='Bevestig of annuleer eerst de openstaande formule of dynamische waarde.';return;}if(this.runtime&&this.textPermissionEpoch!==this.runtime.permissionEpoch){this.status('De toegangsrechten zijn gewijzigd. Open de tekst opnieuw.');return;}
      const pending=this.pendingText,id=this.textEditId;let content;try{content=this.richTextEditor?.get();}catch(error){this.status(error.message);return;}if(!content&&this.nodes.textValue.value.trim()){content={schema:1,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:null,paragraphs:[{id:'p1',align:'left',lineHeight:1.25,runs:[{id:'r1',kind:'text',text:this.nodes.textValue.value.trim(),marks:{}}]}]};}if(!content)return;const text=MI.TextContent.plain(content);if(!text.trim())return;const request=this.textEditorRequest;try{if(MI.MathFragments.has([{textContent:content}])){await MI.MathFragments.load();for(const p of content.paragraphs)for(const r of p.runs)if(r.kind==='math')MI.MathFragments.box(r.source);}}catch(error){this.status(error.message);return;}if(request!==this.textEditorRequest)return;const target=id?{kind:'existing',id}:{kind:'new',position:{x:pending.point.x,y:pending.point.y}},command={schema:1,operation:'text.commit',expectedDocumentRevision:this.textExpectedRevision,payload:{target,content,...(this.textMigrateLegacy?{migrateLegacy:true}:{})}},decision=this.commands.canExecute(command);if(!decision.allowed){this.status(decision.code==='STALE_TRANSACTION'?'De illustratie is intussen gewijzigd. Sluit de teksteditor en open hem opnieuw.':'Tekstwijziging niet toegestaan: '+decision.code);return;}const handle=this.textTransaction;this.textTransaction=null;this.closeText();this.changeDocument(()=>{const result=handle?this.runtime.commit(handle,command.payload):this.commands.execute(command);this.selectedId=result.result.id;});
    }
    validColor() { return this.colorInput && /^#[0-9a-f]{6}$/i.test(this.colorInput.value); }
    updateColorPicker(color,{initial=false}={}) {
      const value=/^#[0-9a-f]{6}$/i.test(color)?color.toUpperCase():'none';
      const doc=this.document;
      const chip=doc.getElementById(initial?'colorPreviewCurrent':'colorPreviewNew');
      const label=doc.getElementById(initial?'colorPreviewCurrentValue':'colorPreviewNewValue');
      if(chip){
        chip.dataset.none=String(value==='none');
        chip.style.backgroundColor=value==='none'?'':value;
      }
      if(label)label.textContent=value==='none'?'Geen vulling':value;
      if(initial)return;
      this.colorPickerChosen=value;
      const native=doc.getElementById('colorNative');
      if(native&&value!=='none')native.value=value.toLowerCase();
      const palette=this.nodes.colorPalette;
      for(const button of palette?.querySelectorAll('[data-color]')||[])
        button.setAttribute('aria-pressed',String(button.dataset.color.toUpperCase()===value));
      const clear=doc.getElementById('colorNone');
      if(clear)clear.setAttribute('aria-pressed',String(value==='none'));
      if(this.colorInput)this.colorInput.setAttribute('aria-invalid','false');
      const apply=doc.getElementById('colorApply');if(apply)apply.disabled=false;
    }
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
    constructionHint(kind,index=0) { return MI.ToolInstructions.constructionHint(kind,index); }
     constructionPick(point,role,sourceIndex=0) {
      const kind=this.tool.slice(10),transform=this.transform(),screen=transform.mathToScreen(point),candidates=[];
      const distance=p=>{const q=transform.mathToScreen(p);return Math.hypot(q.x-screen.x,q.y-screen.y);};
      const segment=(o,s)=>{const l=MI.ConstructionService.line(o,s),a=transform.mathToScreen({x:l.x1,y:l.y1}),b=transform.mathToScreen({x:l.x2,y:l.y2}),dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;if(!length)return distance({x:l.x1,y:l.y1});const domain=o.type==='polygon'?[0,1]:MI.LinearGeometry.domain(o),t=Math.max(domain[0],Math.min(domain[1],((screen.x-a.x)*dx+(screen.y-a.y)*dy)/length));return Math.hypot(screen.x-a.x-t*dx,screen.y-a.y-t*dy);};
      for(const o of this.engine.model.objects) {
        if(kind==='triangleFromPoints'&&this.interaction?.sources?.some(ref=>ref.objectId===o.id))continue;
        if(!this.engine.isDisplayed(o.id)||o.visible===false||(o.construction && o.constructionValid===false)||(this.runtime && !this.capabilities(o.id).sourceTools.includes(this.tool)))continue;
        const add=(s,d)=>{if(d<=12)candidates.push({source:{objectId:o.id,...s},distance:d,priority:o.type==='point'?0:1});};
        const references=MI.ConstructionService.referencesForRole(o,role,kind).filter(ref=>kind!=='lineBetweenPoints'||o.type==='point'&&!ref.part);
        for(const ref of references) {
          if(role==='point')add(ref,distance(MI.ConstructionService.point(o,ref)));
          else if(role==='ellipse'){const nearest=MI.EllipseGeometry.nearest(o,screen,p=>transform.mathToScreen(p));add(ref,nearest?.distance??Infinity);}
          else if(role==='line'||role==='segment')add(ref,segment(o,ref));
          else if((role==='figure'||role==='triangle')&&o.type==='polygon')add(ref,MI.PolygonGeometry.contains(o.vertices,point)?0:Math.min(...o.vertices.map((v,index)=>segment(o,{part:'edge',index}))));
          else if(role==='polygon'&&o.type==='polygon')add(ref,MI.PolygonGeometry.contains(o.vertices,point)?0:Math.min(...o.vertices.map((v,index)=>segment(o,{part:'edge',index}))));
          else {const radial=Math.hypot(point.x-o.cx,point.y-o.cy),edge=radial?{x:o.cx+(point.x-o.cx)*o.r/radial,y:o.cy+(point.y-o.cy)*o.r/radial}:{x:o.cx+o.r,y:o.cy};add(ref,role==='figure'&&radial<=o.r?0:distance(edge));}
        }
      }
       if(role==='line'&&MI.AxisReferences.supports(kind,sourceIndex)){const r=this.engine.renderer,zero=transform.mathToScreen({x:0,y:0});for(const ref of MI.AxisReferences.references){if(!r.showAxes||!(ref.axis==='x'?r.showXAxis:r.showYAxis)||this.runtime&&!this.runtime.getAxisSourceTools(ref.axis).includes(this.tool))continue;const d=ref.axis==='x'?Math.abs(screen.y-zero.y):Math.abs(screen.x-zero.x);if(d<=12)candidates.push({source:ref,distance:d,priority:2});}}
      candidates.sort((a,b)=>(a.priority===2||b.priority===2?a.priority-b.priority:0)||a.distance-b.distance || a.priority-b.priority || String(a.source.objectId||a.source.axis).localeCompare(String(b.source.objectId||b.source.axis)));return candidates[0]&&candidates[0].source;
    }
    constructionSelectable(o) { return !!o && this.engine.isDisplayed(o.id) && o.visible!==false && !(o.construction && o.constructionValid===false) && (!this.runtime || this.capabilities(o.id).sourceTools.includes(this.tool)); }
    constructionSourcesAt(point,event,sources=[]) {
      const kind=this.tool.slice(10),state={sources:sources.slice()};
      const target=event.target&&event.target.closest&&event.target.closest('[data-object-id]'),hitObject=target&&this.engine.get(target.getAttribute('data-object-id')),painted=this.constructionSelectable(hitObject)?hitObject:null;
      if(['area','perimeter'].includes(kind)&&painted&&['polygon','circle'].includes(painted.type))state.sources=[{objectId:painted.id}];
      const angle=!state.sources.length&&kind==='bisector'&&(painted&&painted.type==='angle'?painted:(this.engine.selectAt(point.x,point.y,{transform:this.transform(),tolerancePx:12})||{}).object);
      if(angle&&angle.type==='angle'&&angle.visible!==false&&(!this.runtime || this.capabilities(angle.id).sourceTools.includes(this.tool)))state.sources=[0,1,2].map(index=>({objectId:angle.id,part:'vertex',index}));
       let source=state.sources.length<MI.ConstructionService.kinds[kind]?this.constructionPick(point,this.constructionRole(kind,state.sources.length),state.sources.length):null;
      if(kind==='bisector' && !state.sources.length && source && source.part==='vertex') {const polygon=this.engine.get(source.objectId);if(polygon.type==='polygon')state.sources=[(source.index+polygon.vertices.length-1)%polygon.vertices.length,source.index,(source.index+1)%polygon.vertices.length].map(index=>({objectId:polygon.id,part:'vertex',index}));}
      if(state.sources.length===MI.ConstructionService.kinds[kind]) {}
      else if(!source && !state.sources.length && ['midpoint','perpendicularBisector'].includes(kind)) {const line=this.constructionPick(point,'line');if(line){const o=this.engine.get(line.objectId);state.sources=o.type==='polygon'?[{objectId:o.id,part:'vertex',index:line.index},{objectId:o.id,part:'vertex',index:(line.index+1)%o.vertices.length}]:[{objectId:o.id,part:'start'},{objectId:o.id,part:'end'}];}}
      else if(source)state.sources.push(source);
      else return null;
      return state.sources;
    }
    constructionClick(point,event) {
      const kind=this.tool.slice(10),state=this.interaction||{mode:'construction',sources:[],selectionIdsBefore:this.selectedIds.slice()};
      if(state.radialPlacement||state.pathPlacement){this.radialPathPlacement(point,event,state);return;}
      if(kind==='ellipseByFociAndPoint'&&state.sources.length===2){
        const preview=this.ellipsePlacementPreview(point);if(!preview?.valid){this.status('Deze positie geeft geen geldige ellips ('+(preview?.reasonCode||'ONGELDIGE_GEOMETRIE')+'). Kies Q buiten het brandpuntsegment.');this.invalidate();return;}
        const payload={toolId:'construct:ellipseByFociAndPoint',sources:preview.source?[...state.sources.map(ref=>({...ref})),{...preview.source}]:state.sources.map(ref=>({...ref})),...(preview.source?{}:{controlPoint:{...preview.point}})};
        this.interaction=null;this.release(state);this.engine.renderer.preview=null;
        try{this.changeDocument(()=>{const created=this.execute('construction.create',payload).result,ellipse=created.find(o=>o.type==='ellipse');this.selectedIds=ellipse?[ellipse.id]:created.map(o=>o.id);});this.tool='select';this.status(preview.source?'Ellips gekoppeld aan bestaand besturingspunt Q.':'Besturingspunt Q en ellips toegevoegd.');}
        catch(error){this.status(error.message);}
        this.invalidate();return;
      }
      let sources=this.constructionSourcesAt(point,event,state.sources);
      if(!sources){this.status('Geen geschikte bron geraakt. '+this.constructionHint(kind,state.sources.length));return;}
      // The selected object may fill a later role (e.g. circle as the second
      // source of a line-circle intersection). Insert it immediately when its
      // role is reached; the shared geometry validator still owns validity.
      if(state.radialPrefill&&sources.length===state.radialPrefill.index)
        sources=[...sources,state.radialPrefill.source];
      const previousSources=state.sources.slice();state.sources=sources;if(['circleSectorRegion','circleSegmentRegion'].includes(kind)&&sources.length===MI.ConstructionService.kinds[kind])state.extent=this.regionExtent||(event.shiftKey?'major':'directed');
      if(kind==='lineBetweenPoints'&&sources.length===2) {
        const firstObject=this.engine.get(sources[0].objectId),secondObject=this.engine.get(sources[1].objectId),first=MI.ConstructionService.point(firstObject,sources[0]),second=MI.ConstructionService.point(secondObject,sources[1]);
        if(sources[0].objectId===sources[1].objectId||Math.hypot(second.x-first.x,second.y-first.y)<=1e-9) {
          this.interaction={...state,sources:previousSources.slice(0,1),pointerId:null};this.status('Kies twee verschillende punten met verschillende posities. '+this.constructionHint(kind,1));this.invalidate();return;
        }
      }
      if(kind==='angleDirections'){state.anglePicks=state.anglePicks||[];state.anglePicks.push({...point});}
      state.pointerId=event.pointerId; this.interaction=state;
      if(this.nodes.canvasWrap.setPointerCapture)try{this.nodes.canvasWrap.setPointerCapture(event.pointerId);}catch(_){}
      if(kind==='ellipseByFociAndPoint'&&state.sources.length===2){state.ellipsePlacement=true;this.interaction=state;this.status(this.constructionHint(kind,2));this.invalidate();return;}
      if(kind==='pointOnEllipse'&&state.sources.length===1){state.pathPlacement=true;this.interaction=state;this.status(this.constructionHint(kind,1));this.invalidate();return;}
      if(state.sources.length<MI.ConstructionService.kinds[kind]){this.status(this.constructionHint(kind,state.sources.length));this.invalidate();return;}
      if(kind==='angleDirections')state.sources=MI.ConstructionService.selectAngleArms(state.sources,state.anglePicks,new Map(this.engine.model.objects.map(o=>[o.id,o])));
      this.interaction=null;this.release(state);
      try {let created=false;this.changeDocument(()=>{this.selectedIds=this.execute('construction.create',{toolId:'construct:'+kind,sources:state.sources,...(MI.ConstructionService.pathKind(kind)?{parameter:MI.ConstructionService.projectParameter(kind,this.engine.get(state.sources[0].objectId),state.sources[0],point)}:{}),...(state.extent?{extent:state.extent}:{})}).result.map(o=>o.id);created=true;});if(created){this.tool='select';this.status('Gekoppelde constructie toegevoegd.');}else this.interaction={...state,sources:previousSources,pointerId:null};}
      catch(error){this.status(error.message);}
      this.invalidate();
    }
    ellipsePlacementPreview(point){
      const state=this.interaction;if(!state||!state.ellipsePlacement||state.sources.length!==2)return null;
      const foci=state.sources.map(ref=>this.engine.get(ref.objectId));if(foci.some(o=>!o||o.type!=='point'))return {valid:false,reasonCode:'INVALID_REFERENCE'};
      const source=this.constructionPick(point,'point',2),control=source?MI.ConstructionService.point(this.engine.get(source.objectId),source):point,sources=[...foci,{type:'point',x:control.x,y:control.y}],result=MI.EllipseGeometry.resolve({kind:'ellipseByFociAndPoint'},sources),valid=result.reasonCode==='VALID';
      state.previewReason=result.reasonCode;state.previewValid=valid;state.controlPointMode=source?'existing':'new';state.controlPoint=control;state.controlPointSource=source||null;
      this.engine.renderer.preview=valid?{type:'ellipse',cx:result.geometry.center.x,cy:result.geometry.center.y,a:result.geometry.a,b:result.geometry.b,rotation:result.geometry.rotation,controlPoint:{...control},controlPointMode:source?'existing':'new',style:{stroke:'#9a7a32',strokeWidth:2,opacity:1,dash:'7 5',fill:'none'}}:{type:'ellipse-invalid',foci:foci.map(o=>({x:o.x,y:o.y})),point:{...control}};
      return {valid,reasonCode:result.reasonCode,point:{...control},source:source||null};
    }
    renderEllipsePlacementPreview(){
      const svg=this.nodes.canvas.querySelector('svg');if(!svg)return;
      const r=this.engine.renderer,viewport=this.nodes.canvas.getBoundingClientRect?.(),transform=MI.CoordinateTransform.forViewport(r,viewport),clip=transform?.visibleBounds(viewport),markup=r.renderPreview(clip||r.bounds),current=svg.querySelector('[data-drawing-preview]');
      if(!markup){current?.remove();return;}
      const range=this.document.createRange();range.selectNodeContents(svg);const fragment=range.createContextualFragment(markup),next=fragment.firstElementChild;
      if(current)current.replaceWith(next);else svg.appendChild(next);
    }
    queueEllipsePlacementPreview(){
      if(this.ellipsePreviewFrame!=null||!this.window.requestAnimationFrame)return;
      this.ellipsePreviewFrame=this.window.requestAnimationFrame(()=>{this.ellipsePreviewFrame=null;if(this.initialized&&this.interaction?.ellipsePlacement)this.renderEllipsePlacementPreview();});
    }
    setTool(tool) { if(!this.toolAllowed(tool)){this.status("Deze tool is niet toegestaan.");return;} this.closeDialogs(true); this.cancel(); this.document.body?.classList.remove("properties-open","tools-open");this.nodes.propertiesToggle?.setAttribute?.("aria-expanded","false");this.nodes.toolsToggle?.setAttribute?.("aria-expanded","false");this.navigationMode="select";this.regionExtent=undefined;this.tool = tool;this.splitMenuOpen=null;const group=this.toolCatalog.getSplitForTool(tool);if(group){this.splitToolSelection.set(group.id,tool);try{this.storage?.setItem('fzi-math-illustration-'+group.storageKey+'-tool',tool);}catch(_){}} this.status(tool.startsWith('construct:')?this.constructionHint(tool.slice(10)):this.toolHint(tool)); this.invalidate(); }
    // UI-RADIAL-9: generic adapter for any document object accepted by a
    // registered construction contract. The service owns source matching;
    // this controller only stages the existing create/interaction workflow.
    startContextConstruction(toolId,objectId,planKey){
      const kind=typeof toolId==='string'&&toolId.startsWith('construct:')?
        toolId.slice(10):null;
      const source=kind&&this.engine.get(objectId);
      if(!source||this.selectedIds.length!==1||
          this.selectedIds[0]!==objectId||!this.canvasSelectable(source)||
          !this.toolCatalog.getTool(toolId)||!this.toolAllowed(toolId)||
          (this.runtime&&!this.capabilities(objectId).sourceTools.includes(toolId))){
        this.status('Deze constructie is niet beschikbaar voor het geselecteerde object.');
        return false;
      }
      const plan=MI.ConstructionService.contextualPlans(source,kind)
        .find(option=>option.key===planKey);
      if(!plan){
        this.status('De geselecteerde constructiebron past niet bij dit gereedschap.');
        return false;
      }
      // Single-source measurements and compound predefined endpoint plans
      // are already complete, so use the usual document command directly.
      if(plan.mode==='complete'){
        try{
          this.changeDocument(()=>{
            this.selectedIds=this.execute('construction.create',{
              toolId,sources:plan.sources.map(ref=>({...ref}))
            }).result.map(object=>object.id);
          });
          this.status('Gekoppelde constructie toegevoegd.');
          this.invalidate();
          return true;
        }catch(error){
          this.status(error.message);this.invalidate();return false;
        }
      }
      const selectionBefore=this.selectedIds.slice();
      this.setTool(toolId);
      if(this.tool!==toolId)return false;
      this.interaction={
        mode:'construction',
        sources:plan.sourceIndex===0?plan.sources.map(ref=>({...ref})):[],
        ...(plan.sourceIndex>0?{
          radialPrefill:{index:plan.sourceIndex,source:{...plan.sources[0]}}
        }:{}),
        ...(plan.mode==='placement'?{radialPlacement:true}:{}),
        selectionIdsBefore:selectionBefore,pointerId:null
      };
      const hint=plan.mode==='placement'
        ?(kind==='pointOnEllipse'?'Klik nabij de ellipscontour om de puntpositie vast te leggen.':'Klik op het bronobject om de puntpositie vast te leggen.')
        :this.constructionHint(kind,plan.sourceIndex===0?1:0);
      this.status((source.name||objectId)+' is vastgelegd. '+hint);
      this.invalidate();
      return true;
    }
    // A path-dependent point needs an explicit second click to choose its
    // parameter. The selected geometric source is already known.
    radialPathPlacement(point,event,state){
      const kind=this.tool.slice(10),ref=state.sources?.[0],source=this.engine.get(ref?.objectId);
      if(!source||!MI.ConstructionService.pathKind(kind)){
        this.status('De bron van deze constructie is niet beschikbaar.');return;
      }
      const screen=this.transform().mathToScreen(point);
      let distance=Infinity,parameter;
      if(kind==='pointOnCircle'&&source.type==='circle'){
        const edge=this.transform().mathToScreen({x:source.cx+source.r,y:source.cy});
        const center=this.transform().mathToScreen({x:source.cx,y:source.cy});
        distance=Math.abs(Math.hypot(screen.x-center.x,screen.y-center.y)-
          Math.hypot(edge.x-center.x,edge.y-center.y));
      }else if(kind==='pointOnSegment'){
        const line=MI.ConstructionService.line(source,ref);
        const a=this.transform().mathToScreen({x:line.x1,y:line.y1});
        const b=this.transform().mathToScreen({x:line.x2,y:line.y2});
        const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
        const t=length?Math.max(0,Math.min(1,
          ((screen.x-a.x)*dx+(screen.y-a.y)*dy)/length)):0;
        distance=Math.hypot(screen.x-a.x-t*dx,screen.y-a.y-t*dy);
      }else if(kind==='pointOnEllipse'&&source.type==='ellipse'){
        const nearest=MI.EllipseGeometry.nearest(source,screen,p=>this.transform().mathToScreen(p));
        if(nearest){distance=nearest.distance;parameter=nearest.parameter;}
      }
      if(distance>12){
        this.status(kind==='pointOnEllipse'?'Klik binnen 12 pixels van de ellipscontour.':'Klik binnen 12 pixels van de geselecteerde lijn of cirkelrand.');
        return;
      }
      if(parameter==null)parameter=MI.ConstructionService.projectParameter(kind,source,ref,point);
      try{
        this.changeDocument(()=>{
          this.selectedIds=this.execute('construction.create',{
            toolId:this.tool,sources:state.sources,parameter
          }).result.map(o=>o.id);
        });
        this.interaction=null;this.tool='select';this.engine.renderer.preview=null;
        this.status('Afhankelijk punt toegevoegd.');
      }catch(error){this.status(error.message);}
      this.invalidate();
    }
    ellipsePointPlacementPreview(point){
      const state=this.interaction,ref=state?.sources?.[0],source=ref&&this.engine.get(ref.objectId);
      if(!state||(!state.pathPlacement&&!state.radialPlacement)||this.tool!=='construct:pointOnEllipse'||!source)return null;
      const transform=this.transform(),screen=transform.mathToScreen(point),nearest=source.type==='ellipse'&&source.constructionValid!==false?MI.EllipseGeometry.nearest(source,screen,p=>transform.mathToScreen(p)):null;
      const valid=!!nearest&&nearest.distance<=12;
      this.engine.renderer.preview={type:'point-placement',point:valid?nearest.point:point,valid};
      return {valid,nearest};
    }
    renderPointPlacementPreview(){
      const svg=this.nodes.canvas.querySelector('svg');if(!svg)return;
      const markup=this.engine.renderer.renderPreview(),current=svg.querySelector('[data-point-placement-preview]');
      if(!markup){current?.remove();return;}
      const range=this.document.createRange();range.selectNodeContents(svg);const fragment=range.createContextualFragment(markup),next=fragment.firstElementChild;
      if(current)current.replaceWith(next);else svg.appendChild(next);
    }
    queuePointPlacementPreview(){
      if(this.pointPlacementPreviewFrame!=null||!this.window.requestAnimationFrame)return;
      this.pointPlacementPreviewFrame=this.window.requestAnimationFrame(()=>{this.pointPlacementPreviewFrame=null;if(this.initialized&&this.interaction?.mode==='construction'&&(this.interaction.pathPlacement||this.interaction.radialPlacement)&&this.tool==='construct:pointOnEllipse')this.renderPointPlacementPreview();});
    }
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
        const text=o.textContent?group?.querySelector('[data-rich-text]'):group?.querySelector(o.type==='text'?'text':'[data-measurement-label] text');
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
      this.navigationMode='select';this.inspectorTarget='objects';this.clearHover();
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
      if(this.initialized && !this.interaction && this.tool==='select' && this.navigationMode!=='pan' && event.button===2 && event.isPrimary!==false) {
        if(!this.pointer(event))return;
        this.suppressMarqueeMenu=false;
        this.begin({mode:'marquee',operation:this.rectangleService().operation(event),active:false,end:{x:event.clientX,y:event.clientY},textGeometry:this.textSelectionGeometry()},event);return;
      }
      if(!this.interaction)this.suppressMarqueeMenu=false;
      if (!this.initialized || (this.interaction && !['polygon','construction'].includes(this.interaction.mode)) || event.button !== 0 || event.isPrimary === false) return;
      const point = this.pointer(event); if (!point || !this.toolAllowed(this.tool)) return; event.preventDefault();
      if(this.navigationMode==='pan'){if(!this.allowed('view.pan',{bounds:{...this.engine.renderer.bounds}}))return;this.begin({mode:'pan',bounds:{...this.engine.renderer.bounds}},event);this.invalidate();return;}
      this.inspectorTarget='objects';this.axisMenuOpen=false;
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
        const id = (label || handle).getAttribute(label ? "data-label-id" : "data-line-id"), object = this.engine.get(id),measurementKey=label?.getAttribute('data-measurement-kind'),measurementMode=!!object&&MI.MeasurementGeometry.measurementKeys(object).includes(measurementKey);
        const measurementProperty=object?.type==='region'?'areaDisplay.position':'measurements',measurementAllowed=!this.runtime||this.capabilities(id).propertyFields.includes(measurementProperty),labelAllowed=!this.runtime||["labelOffsetX","labelOffsetY"].every(k=>this.capabilities(id).propertyFields.includes(k));
        if (!this.canvasSelectable(object) || object.locked || (handle && object.construction) || (this.runtime && (label?(measurementMode?!measurementAllowed:!labelAllowed):![handle.getAttribute("data-endpoint")==="start"?"x1":"x2",handle.getAttribute("data-endpoint")==="start"?"y1":"y2"].every(k=>this.capabilities(id).geometryFields.includes(k))))) return;
        const measurementConfig=measurementMode&&object.type!=='region'?(object.measurements?MI.MeasurementGeometry.measurementSettings(object.measurements,object):MI.MeasurementGeometry.defaultMeasurementSettings(object)):null,regionPosition=object.type==='region'&&object.areaDisplay?.position?.mode==='offset'?object.areaDisplay.position:{dx:0,dy:0},offset=measurementMode?object.type==='region'?{x:regionPosition.dx||0,y:regionPosition.dy||0}:{x:measurementConfig.values[measurementKey]?.dx||0,y:measurementConfig.values[measurementKey]?.dy||0}:this.labelOffset(object);
        this.begin({ mode: measurementMode?'measurement-label':label ? "label" : "endpoint", id, original: clone(object), endpoint: handle && handle.getAttribute("data-endpoint"),measurementKey,offset, resolved: null }, event);
        this.selectedId = id; this.invalidate(); return;
      }
      if (this.tool === "point" || this.tool === "text") {
        const result = this.snap(point); const object = { type: this.tool, x: result.point.x, y: result.point.y };
        if (this.tool === "text") {
          this.flushEdits(); this.pendingText = result; this.renderInstructions();this.nodes.textValue.value = "";this.openRichText();return;
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
       const distribution=hit&&this.circleDistributionForPoint(hit.object.id);
       if(distribution&&!this.runtime){const circle=this.engine.get(distribution.circleId);if(hit.object.locked||circle?.locked){this.selectObject(hit.object.id);this.status('Punt of broncirkel is vergrendeld.');return;}this.begin({mode:'circleDistributionPoint',id:hit.object.id,distributionId:distribution.id,index:distribution.pointIds.indexOf(hit.object.id),count:distribution.count,startAngle:distribution.startAngle,circleId:distribution.circleId},event);this.selectedId=hit.object.id;this.invalidate();return;}
      if(hit && this.runtime && !this.allowed("object.translate",{ids:[hit.object.id],delta:{x:0,y:0}})) {this.selectObject(hit.object.id);this.status("Verplaatsen is niet toegestaan.");return;}
      if(hit && hit.object.locked) { this.selectObject(hit.object.id);this.status('Object is vergrendeld.');return; }
      if(hit && !this.runtime && MI.ConstructionService.pathKind(hit.object.construction?.kind)) {
        this.begin({mode:'pathPoint',id:hit.object.id,original:clone(this.engine.get(hit.object.id))},event);
        this.selectedId=hit.object.id;this.invalidate();return;
      }
      if(hit && hit.object.construction) {this.selectObject(hit.object.id);this.status('Gekoppelde constructie: verplaats de bronobjecten.');return;}
      this.begin(hit ? { mode: "object", id: hit.object.id, original: clone(this.engine.get(hit.object.id)) } : { mode: "pan", bounds: { ...this.engine.renderer.bounds } }, event);
      this.selectedId = hit ? hit.object.id : null; this.invalidate();
    }
    labelOffset(object) {
      if (this.services.labels) return this.services.labels.read(object, this.engine.renderer);
      const scale = this.engine.renderer.scale();
      return { x: object.labelOffsetX != null ? object.labelOffsetX : object.labelDx / scale, y: object.labelOffsetY != null ? object.labelOffsetY : -object.labelDy / scale };
    }
    measurement() { const state = this.interaction, value = state && Number(state.typed); const distance=value/(this.engine.model.meta.measurement?.scale||1);return state && state.typed && Number.isFinite(distance) && distance > 0 ? distance : null; }
    resolveDraw() {
      const state = this.interaction;
      state.resolved = this.services.resolver.draw(this.engine, state.shape, state.start, state.lastRawPoint, { exactDistance: this.measurement(), transform: this.transform() });
      this.engine.renderer.preview = state.resolved.preview; this.feedback = state.resolved.result;
    }
    pointerMove(event) {
      if (!this.initialized) return;
      const state = this.interaction;
      if (!state) {
        if(this.tool==='select'||this.tool.startsWith('construct:'))this.queueHover(event);
        if (!this.tool.startsWith('construct:') && this.tool !== "select" && (!event.target || this.nodes.canvasWrap.contains(event.target))) { const point = this.pointer(event); if (point) { this.feedback = this.snap(point); this.invalidate(true); } }
        return;
      }
      if(state.mode==='construction'){if(state.ellipsePlacement){const point=this.pointer(event);if(point){this.ellipsePlacementPreview(point);this.queueEllipsePlacementPreview();}return;}if((state.pathPlacement||state.radialPlacement)&&this.tool==='construct:pointOnEllipse'){const point=this.pointer(event);if(point){this.ellipsePointPlacementPreview(point);this.queuePointPlacementPreview();}return;}this.queueHover(event);return;}
      if (state.mode==='polygon') { if(event.isPrimary===false || (state.pointerId!=null && event.pointerId!==state.pointerId)) return; const point=this.pointer(event); if(point) { state.result=this.polygonResult(point); this.polygonPreview(); } return; }
      if (event.pointerId !== state.pointerId) return;
      state.lastPointer={clientX:event.clientX,clientY:event.clientY};
      if(state.mode==='marquee'){this.updateRectangle({x:event.clientX,y:event.clientY});return;}
      const point = this.pointer(event); if (!point) return;
      const delta = state.transform.screenDelta(event.clientX - state.startScreen.x, event.clientY - state.startScreen.y); if (!delta) return;
      if(this.runtime && ['label','measurement-label','endpoint','vertex','group','object','pan'].includes(state.mode)) {
        let operation,payload;
        if(state.mode==='label'){operation='object.setProperties';payload={ids:[state.id],fields:[{path:'labelOffsetX',value:state.offset.x+delta.x},{path:'labelOffsetY',value:state.offset.y+delta.y}]};}
        else if(state.mode==='measurement-label'){operation='object.setProperties';if(state.original.type==='region')payload={ids:[state.id],fields:[{path:'areaDisplay.position',value:{mode:'offset',dx:state.offset.x+delta.x,dy:state.offset.y+delta.y}}]};else{const settings=state.original.measurements?MI.MeasurementGeometry.measurementSettings(state.original.measurements,state.original):MI.MeasurementGeometry.defaultMeasurementSettings(state.original);settings.values[state.measurementKey].dx=state.offset.x+delta.x;settings.values[state.measurementKey].dy=state.offset.y+delta.y;payload={ids:[state.id],fields:[{path:'measurements',value:settings}]};}}
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
      if(state.mode==='pathPoint') {
        const recipe=state.original.construction,ref=recipe.sources[0],source=this.engine.get(ref.objectId);
        try {const value=MI.ConstructionService.projectParameter(recipe.kind,source,ref,point);this.execute('construction.setParameter',{id:state.id,value});}
        catch(error){this.status(error.message);}
      }
       if(state.mode==='circleDistributionPoint') {
         const circle=this.engine.get(state.circleId),dx=point.x-circle.cx,dy=point.y-circle.cy;
         if(Math.hypot(dx,dy)>1e-9){const tau=2*Math.PI,startAngle=((Math.atan2(dy,dx)-state.index*tau/state.count)%tau+tau)%tau;try{this.execute('circleDistribution.set',{pointId:state.id,count:state.count,startAngle});}catch(error){this.status(error.message);}}
       }
      if (state.mode === "draw") { state.lastRawPoint = point; this.resolveDraw(); }
      if (state.mode === "label") this.updateObject(state.id, { labelOffsetX: state.offset.x + delta.x, labelOffsetY: state.offset.y + delta.y });
      if(state.mode==='measurement-label'){if(state.original.type==='region'){const current=this.engine.get(state.id);this.updateObject(state.id,{areaDisplay:{...current.areaDisplay,position:{mode:'offset',dx:state.offset.x+delta.x,dy:state.offset.y+delta.y}}});}else{const current=this.engine.get(state.id),settings=current.measurements?MI.MeasurementGeometry.measurementSettings(current.measurements,state.original):MI.MeasurementGeometry.defaultMeasurementSettings(state.original);settings.values[state.measurementKey].dx=state.offset.x+delta.x;settings.values[state.measurementKey].dy=state.offset.y+delta.y;this.updateObject(state.id,{measurements:settings});}}
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
      if(this.runtime && ['object','group','label','measurement-label','endpoint','vertex','pan'].includes(state.mode)){this.invalidate();return;}
      if(state.mode==='marquee'){this.suppressMarqueeMenu=!state.keyboard && state.active;this.invalidate();return;}
      if (state.mode === "draw") {
        if (state.resolved && state.resolved.length >= .05) {
          if(state.shape==='line'||state.shape==='ray')this.selectedId=this.execute('linear.draw',{shape:state.shape,x1:state.resolved.object.x1,y1:state.resolved.object.y1,x2:state.resolved.object.x2,y2:state.resolved.object.y2}).result[0].id;
          else this.selectedId = this.createObject(state.resolved.object,state.shape).id;
        }
        else this.status("Vorm te kort; geen object toegevoegd.");
      }
      if ((state.mode === "endpoint" || state.mode==='vertex') && state.resolved) { try { this.updateObject(state.id, state.resolved.patch); } catch (error) { this.status(error.message); } }
      this.history.record(state.historyBefore); this.invalidate();
      if(state.mode==='group')this.status('Selectie verplaatst.');
       if(state.lastPointer && ['object','group','label','pan','circleDistributionPoint'].includes(state.mode))this.updateHover(state.lastPointer);
    }
    cancel() {
      if(this.ellipsePreviewFrame!=null&&this.window.cancelAnimationFrame){this.window.cancelAnimationFrame(this.ellipsePreviewFrame);this.ellipsePreviewFrame=null;}
      if(this.pointPlacementPreviewFrame!=null&&this.window.cancelAnimationFrame){this.window.cancelAnimationFrame(this.pointPlacementPreviewFrame);this.pointPlacementPreviewFrame=null;}
      if(this.circleDistributionPreview){const preview=this.circleDistributionPreview;this.circleDistributionPreview=null;this.engine.load(JSON.parse(preview.history.document));this.engine.model._nextId=preview.nextId;}
      this.clearHover();
      const state = this.interaction; this.interaction = null;
      if (state) {
        if(this.runtime && state.transaction)try{this.runtime.cancel(state.transaction);}catch(_){}
        if (!this.runtime && (state.mode === "object" || state.mode === "label"||state.mode==='measurement-label') && this.engine.get(state.id)) this.engine.update(state.id, state.mode==="label"?{labelOffsetX:state.original.labelOffsetX,labelOffsetY:state.original.labelOffsetY}:state.original);
        if(!this.runtime && state.mode==='pathPoint')this.execute('construction.setParameter',{id:state.id,value:state.original.construction.parameter});
         if(!this.runtime && state.mode==='circleDistributionPoint')this.execute('circleDistribution.set',{pointId:state.id,count:state.count,startAngle:state.startAngle});
        if (!this.runtime && state.mode === "pan") this.engine.renderer.setBounds(state.bounds);
        if(!this.runtime && state.mode==='group')this.engine.updateMany(state.originals.map(o=>({id:o.id,patch:o})));
        this.selectedIds=state.selectionIdsBefore || (state.selectionBefore?[state.selectionBefore]:[]); this.release(state);
      }
      this.engine.renderer.preview = null; this.feedback = null;
      if (this.initialized) this.invalidate();
    }
    keyDown(event) {
      if(event.key==='Escape'&&this.nodes.textDialog?.open){event.preventDefault();this.closeText();return;}
      if(event.key==='Escape' && this.nodes.canvasToolsMenu && this.nodes.canvasToolsMenu.hidden===false){event.preventDefault();this.closeCanvasTools(true);return;}
      if(event.key==='Escape' && this.canvasFullscreen && this.document.body?.classList.contains('properties-open')){event.preventDefault();this.document.body.classList.remove('properties-open');this.nodes.propertiesToggle?.setAttribute?.('aria-expanded','false');this.nodes.navigationTools?.querySelector?.('[data-view-select=axes]')?.focus?.();return;}
      if(event.key==='Escape' && this.splitMenuOpen){event.preventDefault();this.closeSplitMenu(true);return;}
      if(event.key==='Escape' && this.nodes.fileMenu?.open){event.preventDefault();this.closeFileMenu(true);return;}
      const state = this.interaction;
      if(event.key==='Escape' && !state && this.document.body?.classList.contains('properties-open') && this.window.innerWidth<1000){this.document.body.classList.remove('properties-open');this.nodes.propertiesToggle?.setAttribute?.('aria-expanded','false');this.nodes.propertiesToggle?.focus?.();this.selectedIds=[];this.inspectorTarget='objects';this.clearHover();this.invalidate();return;}
      if(event.key==='Escape' && !state && this.document.body?.classList.contains('tools-open') && this.window.innerWidth<760){this.document.body.classList.remove('tools-open');this.nodes.toolsToggle?.setAttribute?.('aria-expanded','false');this.nodes.toolsToggle?.focus?.();this.selectedIds=[];this.inspectorTarget='objects';this.clearHover();this.invalidate();return;}
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
      if (event.key === "Escape") { this.cancel(); if(!state){this.selectedIds=[];this.inspectorTarget='objects';this.clearHover();}this.tool = "select";this.navigationMode='select'; this.axisMenuOpen = false; this.invalidate(); return; }
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
      if(this.runtime){if(!this.allowed('document.reset'))throw new MI.PermissionError('PERMISSION_DENIED');this.closeDialogs(true);this.cancel();this.execute('document.reset');this.selectedIds=[];this.inspectorTarget="objects";this.editBefore=null;this.hydrate();this.invalidate();return;}
      this.closeDialogs(true); this.cancel(); this.flushEdits(); this.invalidateImport();
      let failure = null; if (this.services.draft) try { this.services.draft.clear(this.storage); } catch (e) { failure = e; }
      const r = this.engine.renderer;
      this.execute("document.replace",{document:{ version: 5, layerSchema:1, layers:[{id:"layer-1",name:"Basislaag",visible:true,members:[]}], type: "geometry", meta: {measurement:{...MI.MeasurementUnits.defaults},angleMeasurement:{schema:1,unit:'deg',precision:2}}, objects: [], presentation: { bounds: { ...DEFAULT_BOUNDS }, showAxes: r.showAxes, showGrid: true, showXAxis: true, showYAxis: true, showAxisLabels: true, showOrigin: true, coordinateSystem: "cartesian" } }});
      this.history.clear(); this.editBefore = null; this.selectedId = null; this.inspectorTarget="objects";this.axisMenuOpen = false; this.hydrate(); this.invalidate(); this.status(failure ? "Concept kon niet worden gewist: " + failure.message : "Nieuwe illustratie gestart.");this.savedDocument=JSON.stringify(this.engine.toJSON());
    }
    loadDocument(data) { if(this.runtime)throw new MI.PermissionError("MODE_DENIED"); this.closeDialogs(true); this.cancel(); this.flushEdits(); this.execute("document.replace",{document:data}); this.invalidateImport(); this.history.clear(); this.editBefore = null; this.selectedId = null; this.inspectorTarget="objects";this.axisMenuOpen = false; this.hydrate(); this.invalidate(); this.status("Illustratie geladen.");this.savedDocument=JSON.stringify(this.engine.toJSON()); }
    invalidateImport() {
      this.importSerial++;const reader=this.reader;this.reader=null;
      if(reader && reader.readyState===1)reader.abort();
      if(this.nodes.fileInput)this.nodes.fileInput.value='';
    }
    importDocument(data,{confirmReplace=false}={}) {
      if(this.runtime)throw new MI.PermissionError('MODE_DENIED');
      // Validate the whole candidate before touching dialogs, captures or history.
      const renderer=this.engine.renderer;
      const options={width:renderer.width,height:renderer.height,padding:renderer.padding,
        bounds:this.interaction?.mode==='pan'?this.interaction.bounds:renderer.bounds,
        background:renderer.background,coordinateSystem:renderer.coordinateSystem,axisStep:renderer.axisStep};
      for(const key of MI.PRESENTATION_FLAGS)options[key]=renderer[key];
      const candidate=new MI.Engine(null,options);candidate.load(data);
      const imported=candidate.toJSON();
      if(confirmReplace && this.savedDocument!==JSON.stringify(this.engine.toJSON()) && JSON.stringify(imported)!==JSON.stringify(this.engine.toJSON()) && !this.window.confirm('Niet-opgeslagen wijzigingen vervangen door het geladen document? Je kunt de import ongedaan maken.')){this.invalidateImport();return;}
      this.closeDialogs(true);this.cancel();this.flushEdits();
      const before=this.history.capture();
      if(JSON.stringify(imported)===before.document){
        this.invalidateImport();this.hydrate();this.invalidate();this.status('Illustratie geladen.');return;
      }
      this.execute('document.replace',{document:imported});this.invalidateImport();
      this.editBefore=null;this.selectedIds=[];this.inspectorTarget='objects';this.axisMenuOpen=false;
      this.history.record(before);this.hydrate();this.invalidate();this.status('Illustratie geladen.');this.savedDocument=JSON.stringify(this.engine.toJSON());
    }
    importFile(event) {
      if(this.runtime)throw new MI.PermissionError("MODE_DENIED");
      const file = event.target.files && event.target.files[0]; if (!file) return;
      const serial = ++this.importSerial;
      if (this.reader && this.reader.readyState === 1) this.reader.abort();
      const reader = this.reader = new this.window.FileReader();
      reader.onload = () => { if (!this.initialized || serial !== this.importSerial) return; try { this.importDocument(JSON.parse(reader.result),{confirmReplace:true}); } catch (e) { this.window.alert("JSON kon niet worden geladen: " + e.message); } event.target.value = ""; this.reader = null; };
      reader.onerror = () => { if (this.initialized && serial === this.importSerial) {this.status("JSON kon niet worden gelezen.");event.target.value="";this.reader=null;} };
      reader.readAsText(file);
    }
    openColor(id,property=null) {
      this.cancel(); this.flushEdits(); const object=this.engine.get(id); if(!object || object.locked || !this.colorInput) return;
      // Region fill is the primary visible color. The inspector's separate
      // Randkleur button still requests stroke explicitly.
      if(property==null&&object.type==='region')property='fill';
      this.colorId=id; this.colorProperty=property;
      const none=this.document.getElementById('colorNone');if(none)none.hidden=property!=='fill';
      let color=property ? object.style[property] : this.services.color.value(object);
      // A missing fill value uses the renderer's default, not transparency.
      if(color==null)color=property==='fill'?'#f4c84a':'#222222';
      if(/^#[0-9a-f]{3}$/i.test(color)) color='#'+color.slice(1).split('').map(c=>c+c).join('');
      this.colorInput.value=/^#[0-9a-f]{6}$/i.test(color) ? color : '#222222';
      this.updateColorPicker(color,{initial:true});
      this.updateColorPicker(color);
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
      if ((button = find('[data-view-select="axes"]'))) { this.selectAxes(); return; }
      if ((button = find('[data-axis-system]')) && !button.disabled) { this.changeDocument(() => { this.execute("document.setPresentation",{fields:[{path:"coordinateSystem",value:button.dataset.axisSystem}]}); this.axisMenuOpen = false; }); return; }
      if ((button = find("[data-color-object]"))) { this.openColor(button.dataset.colorObject); return; }
      if ((button = find('[data-object-lock]'))) { this.changeDocument(()=>{const o=this.engine.get(button.dataset.objectLock);this.execute("object.setLock",{ids:[o.id],value:!o.locked});});return; }
      if ((button = find('[data-select-group]'))) {this.selectObject(button.dataset.selectGroup,event.shiftKey||event.ctrlKey||event.metaKey);return;}
      if ((button = find("[data-select-object]"))) { this.selectObject(button.dataset.selectObject,event.shiftKey || event.ctrlKey || event.metaKey); return; }
      if ((button = find("[data-object-visibility]"))) { this.changeDocument(() => { const object = this.engine.get(button.dataset.objectVisibility); this.execute("object.setVisibility",{ids:[object.id],value:object.visible===false}); }); return; }
      if ((button = find("[data-toggle-label]"))) { this.changeDocument(() => { const object = this.engine.get(button.dataset.toggleLabel); if(!object.locked)this.updateObject(object.id, { showLabel: !object.showLabel }); }); return; }
      if ((button = find("[data-view]"))) { this.cancel(); const key = { axes: "showAxes", grid: "showGrid", snapPoints: "showSnapPoints" }[button.dataset.view]; if (key) { this.setPresentationFlag(key,!this.engine.renderer[key]); } }
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
    renderCanvasPreview(){this.renderCanvas();}
    renderCanvas(){
      this.richTextEditor?.refreshValues?.();this.textInsertPanel?.refresh?.();
      const e=this.engine,r=e.renderer,n=this.nodes,objects=e.model.all().filter(o=>!this.runtime||this.capabilities(o.id).display).map(object=>this.viewObject(object.id)),viewport=n.canvas.getBoundingClientRect?.(),viewportTransform=MI.CoordinateTransform.forViewport(r,viewport),clipBounds=viewportTransform?.visibleBounds(viewport);
      if(MI.MathFragments.has(objects)&&!MI.MathFragments.ready()){
        if(!this.mathLoading){this.mathLoading=true;MI.MathFragments.load().then(()=>{this.mathLoading=false;if(this.initialized)this.invalidate();}).catch(()=>{this.mathLoading=false;this.status('Formule-assets konden niet worden geladen.');});}
        n.canvas.textContent='Formules laden…';return {objects,svg:null,object:null};
      }
      n.canvas.innerHTML=r.render({meta:e.model.meta,layers:e.model.layers,all:()=>objects},{editorCanvas:true,clipBounds});const svg=n.canvas.querySelector('svg'),object=this.selectedId&&this.viewObject(this.selectedId);if(svg)MI.SvgRenderer.fitCanvasAxes(svg,r,this.transform(),n.canvas.getBoundingClientRect?.());if(svg?.querySelectorAll)Array.from(svg.querySelectorAll('[data-object-id]')).filter(node=>this.selectedIds.includes(node.getAttribute('data-object-id'))).forEach(node=>node.classList.add('selected'));if(this.document.createElementNS){this.renderRectangle(svg,r);if(this.services.overlays)this.services.overlays.render(svg,r,this.selectedIds.length===1&&this.engine.isDisplayed(object?.id)&&(!this.runtime||this.capabilities(object?.id).geometryFields.length)?object:null,this.navigationMode==='pan'?'pan':this.tool,this.document);if(this.services.feedback)this.services.feedback.render(svg,r,this.feedback,this.document);}if(this.runtime&&svg)for(const handle of svg.querySelectorAll('.fzi-line-endpoint, .fzi-polygon-vertex')){const id=handle.getAttribute('data-line-id')||handle.getAttribute('data-polygon-id'),caps=this.capabilities(id),part=handle.getAttribute('data-endpoint'),fields=part?[part==='start'?'x1':'x2',part==='start'?'y1':'y2']:['x','y'].map(k=>'vertices['+handle.getAttribute('data-vertex')+'].'+k);if(!fields.every(k=>caps.geometryFields.includes(k)))handle.remove();}return {objects,svg,object};
    }
    render() {
      if(this.runtime)this.selectedIds=this.selectedIds.filter(id=>{const caps=this.capabilities(id);return caps.selectCanvas||caps.selectList;});
      const e = this.engine, r = e.renderer, n = this.nodes;
      if (this.services.grid) r.axisStep = this.services.grid.step(r);
      const {objects,svg,object}=this.renderCanvas();
      this.renderPresentation(true);
      n.objectCount.textContent = objects.length + (objects.length === 1 ? " object" : " objecten");
      const focused=this.document.activeElement,focusKey=focused && n.selectionPanel.contains?.(focused) && focused.dataset ? Object.entries(focused.dataset).filter(([k])=>['edit','style','common','vertex','axisSetting','pathParameter','constructionInput','measurementSetting','measurementControl','pointProjection','angleSetting','angleDocument','textBinding'].includes(k)):[],focusIds=JSON.stringify(this.selectedIds),caret=focused?.selectionStart;
      this.renderInstructions();this.renderViewList(); this.renderInspector(object);this.organizeGeometryInspector();this.decorateInspector();for(const checkbox of n.selectionPanel.querySelectorAll('[data-mixed]'))checkbox.indeterminate=true;
      if(focusKey.length && focusIds===JSON.stringify(this.selectedIds)){const replacement=Array.from(n.selectionPanel.querySelectorAll('input,select')).find(el=>focusKey.every(([k,v])=>el.dataset[k]===v));if(replacement && !replacement.disabled){replacement.focus?.({preventScroll:true});if(caret!=null && replacement.type==='text')replacement.setSelectionRange?.(caret,caret);}}
      if(n.zoomPercent)n.zoomPercent.textContent=Math.round(this.engine.renderer.scale()/((this.engine.renderer.width-2*this.engine.renderer.padding)/10)*100)+"%";
      if(n.panBtn){n.panBtn.classList.toggle("active",this.navigationMode==="pan");n.panBtn.disabled=!this.allowed("view.pan",{bounds:{...r.bounds}});}for(const node of [n.zoomInBtn,n.zoomOutBtn,n.resetViewBtn])if(node)node.disabled=!this.allowed("view.zoom",{bounds:{...r.bounds}});
      if (n.undoBtn) n.undoBtn.disabled = !this.history.canUndo && !this.editBefore;
      if (n.redoBtn) n.redoBtn.disabled = !this.history.canRedo || !!this.editBefore;
      this.document.querySelectorAll('[data-tool-category]').forEach(category=>{const active=Array.from(category.querySelectorAll('[data-tool]')).find(button=>button.dataset.tool===this.tool),label=category.querySelector('[data-active-tool]');if(label)label.textContent=active?' · '+active.textContent.trim():'';});
      this.document.querySelectorAll(".tool").forEach(button => button.classList.toggle("active", button.dataset.tool === this.tool && this.navigationMode!=="pan"));
      const navigationHeight=n.navigationTools?.parentElement?.offsetHeight;if(navigationHeight)this.document.documentElement?.style.setProperty("--navigation-height",navigationHeight+"px");
      this.restrictControls();this.renderSplitTools();this.renderCanvasTools();
      this.radialProperties?.sync();
      n.crosshair.hidden = !this.interaction || this.interaction.mode !== "draw" || (this.feedback && this.feedback.snapped && r.showSnapPoints !== false);
      if (this.feedback && this.interaction && this.interaction.mode === "draw") { const p = this.transform().mathToScreen(this.feedback.point), rect = n.canvasWrap.getBoundingClientRect(); n.crosshair.style.left = p.x - rect.left + "px"; n.crosshair.style.top = p.y - rect.top + "px"; }
    }
    renderViewList() {
      const r = this.engine.renderer;
      const axesButton=this.nodes.navigationTools?.querySelector?.('[data-view-select="axes"]');if(axesButton){axesButton.classList.toggle('active',this.inspectorTarget==='axes');axesButton.setAttribute('aria-pressed',String(this.inspectorTarget==='axes'));}
      const rows=[];
      const layers=this.engine.model.layers||[],esc=MI.escapeXml;
      const objectRow=object=>{
        return '<div class="view-row'+(this.selectedIds.includes(object.id)?' view-row-selected':'')+'" '+(this.runtime?'':'draggable="true" data-drag-object="'+esc(object.id)+'"')+'><button class="view-name view-select-btn" type="button" data-select-object="'+MI.escapeXml(object.id)+'">'+MI.escapeXml(objectName(object))+'<span class="view-type">'+MI.escapeXml(object.id)+'</span></button><button class="eye-btn" title="Object tonen/verbergen" aria-label="Object tonen/verbergen" type="button" data-object-visibility="'+MI.escapeXml(object.id)+'">'+eyeIcon(object.visible!==false)+'</button></div>';
      };
      const groupsFor=layerId=>{for(const g of this.engine.model.groups||[])if(this.groupRoot(g.id)===g.id && (!layerId||MI.DocumentLayers.index(layers).owner.get(this.groupLeaves(g.id)[0])?.id===layerId)){const leaves=this.groupLeaves(g.id);rows.push('<div class="view-row'+(leaves.every(id=>this.selectedIds.includes(id))?' view-row-selected':'')+'"><button class="view-name view-select-btn" type="button" data-select-group="'+esc(g.id)+'"'+(this.runtime&&!leaves.every(id=>this.capabilities(id).selectList)?' disabled':'')+'>'+esc(g.name)+'<span class="view-type">'+leaves.length+' objecten &middot; '+esc(g.id)+'</span></button></div>');}};

      if(layers.length){

        const byId=new Map(this.engine.model.objects.map(o=>[o.id,o]));
        for(const l of layers.slice().reverse()){
          const id=esc(l.id),i=layers.findIndex(layer=>layer.id===l.id);rows.push('<section data-layer-row="'+id+'" class="layer-section'+(!l.visible?' layer-hidden':'')+'"><div class="view-row layer-header">'+(this.runtime?'<strong class="view-name">'+esc(l.name)+'</strong>':'<input type="text" data-layer-name="'+id+'" aria-label="Laagnaam" maxlength="200" value="'+esc(l.name)+'"><button class="eye-btn" type="button" data-layer-visibility="'+id+'" title="Laag tonen/verbergen" aria-label="Laag tonen/verbergen" aria-pressed="'+l.visible+'">'+eyeIcon(l.visible)+'</button><button class="eye-btn" type="button" data-layer-forward="'+id+'" title="Laag naar voren" aria-label="Laag naar voren"'+(i===layers.length-1?' disabled':'')+'>&uarr;</button><button class="eye-btn" type="button" data-layer-backward="'+id+'" title="Laag naar achteren" aria-label="Laag naar achteren"'+(i===0?' disabled':'')+'>&darr;</button><button class="eye-btn" type="button" data-layer-delete="'+id+'" title="Laag verwijderen; objecten behouden" aria-label="Laag verwijderen; objecten behouden"'+(layers.length===1?' disabled':'')+'>&times;</button>')+'</div>');
          rows.push('<div class="layer-objects">');groupsFor(l.id);for(const objectId of l.members.slice().reverse()){const o=byId.get(objectId);if(o)rows.push(objectRow(o));}rows.push('</div></section>');
        }
      }else{rows.push('<section data-unlayered><div class="unlayered-title">Objecten zonder lagen</div>');groupsFor(null);for(const object of this.engine.model.objects)rows.push(objectRow(object));rows.push('</section>');}
      if(!this.engine.model.objects.length)rows.push('<p class="help-text" data-empty-objects>Nog geen objecten. Kies een gereedschap om te tekenen.</p>');
      if(!this.runtime)rows.push('<div class="view-divider"></div><div class="view-row layer-add"><input type="text" data-layer-new-name aria-label="Naam nieuwe laag" maxlength="200" value="Nieuwe laag"><button type="button" class="secondary" data-layer-add aria-label="Laag toevoegen" title="Laag toevoegen">+</button></div>');
      const host=this.document.getElementById('sidebarLayersPanel'),previousScroll=host?.scrollTop||0;this.nodes.viewList.innerHTML = rows.join("");
      if(host){host.scrollTop=previousScroll;const key=JSON.stringify(this.selectedIds);if(key!==this.layerScrollSelectionKey){this.layerScrollSelectionKey=key;const selected=Array.from(this.nodes.viewList.querySelectorAll('[data-select-object]')).find(node=>node.dataset.selectObject===this.selectedId);if(selected){const row=selected.getBoundingClientRect(),bounds=host.getBoundingClientRect();if(row.bottom>bounds.bottom)host.scrollTop+=row.bottom-bounds.bottom+4;else if(row.top<bounds.top)host.scrollTop-=bounds.top-row.top+4;}}}
    }
    dynamicTextInspector(object){
      if(object.type!=='text'||object.construction||object.textContent||this.selectedIds.length!==1)return '';
      const esc=MI.escapeXml,b=object.textBinding,source=this.engine.get(b?.sourceId),sources=this.engine.model.objects.filter(o=>MI.DynamicText.propertiesFor(o).length),labels={name:'Naam',label:'Label',length:'Lengte',radius:'Straal',perimeter:'Omtrek',area:'Oppervlakte',angle:'Hoek',x:'x-coordinaat',y:'y-coordinaat'},disabled=object.locked||!this.allowed('object.setProperties',{ids:[object.id],fields:[{path:'textBinding',value:null}]})?' disabled':'';
      const options='<option value="">Statische tekst</option>'+(!source&&b?'<option selected value="'+esc(b.sourceId)+'">Bron niet beschikbaar</option>':'')+sources.map(o=>'<option value="'+esc(o.id)+'"'+(b?.sourceId===o.id?' selected':'')+'>'+esc(o.name)+'</option>').join('');
      let html='<details data-property-section="dynamic-text" open><summary>Dynamische tekst</summary><label>Bronobject<select data-text-binding="sourceId"'+disabled+'>'+options+'</select></label>';
      if(b){html+='<label>Bronwaarde<select data-text-binding="property"'+disabled+'>'+MI.DynamicText.propertiesFor(source).map(k=>'<option value="'+k+'"'+(b.property===k?' selected':'')+'>'+labels[k]+'</option>').join('')+'</select></label><label>Decimalen<input type="number" min="0" max="10" step="1" placeholder="Documentstandaard" data-text-binding="precision" value="'+(b.precision??'')+'"'+disabled+'></label>';for(const [key,label] of [['prefix','Voorvoegsel'],['suffix','Achtervoegsel']])html+='<label>'+label+'<input type="text" maxlength="2000" data-text-binding="'+key+'" value="'+esc(b[key])+'"'+disabled+'></label>';html+='<p data-dynamic-text-value>'+esc(MI.DynamicText.value(object,new Map(this.engine.model.objects.map(o=>[o.id,o])),this.engine.model.meta))+'</p><p class="help-text">De waarde volgt de bron en documenteenheid. Een ontbrekende of ongeldige bron toont niet beschikbaar.</p>';}
      if(b){let candidate;try{candidate={target:{kind:'existing',id:object.id},content:MI.TextValues.migrate(object),migrateLegacy:true};}catch{}const enable=candidate&&this.allowed('text.commit',candidate);html+='<button type="button" data-text-migrate="'+esc(object.id)+'"'+(enable?'':' disabled')+'>Omzetten naar inline dynamische tekst</button>';}return html+'</details>';
    }
    angleInspector(object){
      if(object.type!=='angle'||this.selectedIds.length!==1)return '';const config=object.angleSettings||MI.AngleMeasurements.defaults,disabled=object.locked||!this.allowed('object.setProperties',{ids:[object.id],fields:[{path:'angleSettings',value:{...config}}]})?' disabled':'',select=(key,label,options,extra='')=>'<label>'+label+'<select data-angle-setting="'+key+'" aria-label="'+label+'"'+disabled+extra+'>'+options.map(([value,text])=>'<option value="'+value+'"'+(config[key]===value?' selected':'')+'>'+text+'</option>').join('')+'</select></label>';
      return '<details data-property-section="angle-measurement" open><summary>Hoekmeting</summary>'+select('mode','Hoekbereik',[['smallest','Kleinste (0-180&#176;)'],['directed','Gericht (0-360&#176;)']],object.angleMark==='right'?' disabled':'')+select('unit','Hoekeenheid',[['document','Documentstandaard'],['deg','Graden (&#176;)'],['rad','Radialen (rad)']])+'<label>Hoekdecimalen<input data-angle-setting="precision" aria-label="Hoekdecimalen" type="number" min="0" max="10" step="1" placeholder="Documentstandaard" value="'+(config.precision??'')+'"'+disabled+'></label><label class="style-toggle"><input type="checkbox" data-angle-setting="showArc"'+(config.showArc?' checked':'')+disabled+'>Hoekboog tonen</label><p class="help-text">Referentieframe: cartesische documentassen. Bij ongerichte lijnen bepaalt de aangeklikte kant de hoekarm. Assen, halfrechten en vectoren behouden hun richting. Een gerichte hoek loopt van de eerste naar de tweede arm, tegen de klok in.</p></details>';
    }
    ellipseInspector(object){
      if(object.type!=='ellipse'||this.selectedIds.length!==1)return '';
      const meta=this.engine.model.meta.measurement,info=this.engine.getConstructionInfo(object.id),valid=object.constructionValid!==false&&info?.valid!==false,esc=MI.escapeXml,format=(n,kind='length')=>Number.isFinite(n)?MI.MeasurementUnits.format(n,kind,meta):'niet beschikbaar';
      let html='';
      if(object.construction?.kind==='ellipseByFociAndSum'){
        const source=this.engine.get(object.construction.sources[0]?.objectId),scale=meta?.scale||1;
        html+='<label>Afstandsom S ('+esc(meta?.unit==='dimensionless'?'':meta?.unit||'u')+')<input data-ellipse-sum type="number" min="0" step="any" value="'+esc(Number((object.construction.sumDistance*scale).toFixed(meta?.precision??2)))+'" aria-label="Afstandsom S"'+(object.locked||this.runtime?' disabled':'')+'></label><p class="help-text">S = '+esc(format(object.construction.sumDistance))+'; invoer gebruikt de documenteenheid ('+esc(meta?.unit||'u')+'). Verandering wordt alleen opgeslagen als de ellips geldig blijft.</p>';
        if(source)html+='<p class="help-text">F₁: '+esc(source.name||source.id)+'; F₂: '+esc(this.engine.get(object.construction.sources[1]?.objectId)?.name||object.construction.sources[1]?.objectId||'niet beschikbaar')+'</p>';
      }
      if(object.construction?.kind==='ellipseByFociAndPoint'){
        const [f1,f2,q]=object.construction.sources.map(ref=>this.engine.get(ref.objectId)),sum=f1&&f2&&q?Math.hypot(q.x-f1.x,q.y-f1.y)+Math.hypot(q.x-f2.x,q.y-f2.y):NaN;
        html+='<p class="help-text">F₁: '+esc(f1?.name||f1?.id||'niet beschikbaar')+'; F₂: '+esc(f2?.name||f2?.id||'niet beschikbaar')+'; Q: '+esc(q?.name||q?.id||'niet beschikbaar')+'</p><p><strong>Afstandsom S:</strong> <output data-ellipse-derived-s>'+esc(format(sum))+'</output> <span class="help-text">(afgeleid uit F₁, F₂ en Q)</span></p>';
      }
      const geometry=valid?MI.EllipseGeometry.fromDefinition(object).geometry:null;
      const rows=[['Centrum C',geometry?'('+format(geometry.center.x)+', '+format(geometry.center.y)+')':'niet beschikbaar'],['Grote halve as a',format(geometry?.a)],['Kleine halve as b',format(geometry?.b)],['Excentriciteit e',geometry?Number(geometry.e.toFixed(6)).toString():'niet beschikbaar'],['Oppervlakte πab',format(object.ellipseArea,'area')]];
      html+='<details data-property-section="ellipse-geometry" open><summary>Ellipsgeometrie</summary>'+rows.map(([label,value])=>'<p><strong>'+label+':</strong> <output>'+esc(value)+'</output></p>').join('')+'<p class="help-text">a is de halve lange as; de volledige lange as is 2a.</p></details>';
      return html;
    }
    pointProjectionInspector(object) {
      if(object.type!=='point'||this.selectedIds.length!==1)return '';
      const config=object.coordinateProjections||MI.PointProjections.defaults,disabled=object.locked||!this.allowed('object.setProperties',{ids:[object.id],fields:[{path:'coordinateProjections',value:{...config}}]})?' disabled':'';
      return '<details data-property-section="point-projections" open><summary>Co&#246;rdinatenprojecties</summary><label>Projecties<select data-point-projection="mode" aria-label="Projecties"'+disabled+'>'+[['none','Geen'],['both','Beide'],['x','Alleen x'],['y','Alleen y']].map(([value,label])=>'<option value="'+value+'"'+(config.mode===value?' selected':'')+'>'+label+'</option>').join('')+'</select></label><label class="style-toggle"><input type="checkbox" data-point-projection="showValues"'+(config.showValues?' checked':'')+disabled+'>Co&#246;rdinaatwaarden tonen</label><p class="help-text">Referentieframe: cartesische documentassen. Waarden volgen de documenteenheid en schaal. Projecties verschijnen bij zichtbare assen.</p></details>';
    }
    distributionInspector(object){
      if(this.runtime||object.type!=='point')return '';const d=this.engine.model.circleDistributions.find(item=>item.pointIds.includes(object.id));if(!d&&object.construction?.kind!=='pointOnCircle')return '';
      const count=d?.count||1,angle=d?.startAngle??2*Math.PI*object.construction.parameter,degrees=((angle*180/Math.PI)%360+360)%360,disabled=object.locked?' disabled':'';
      return '<details data-property-section="circle-distribution" open><summary>Punten op cirkel</summary><label>Aantal punten<input data-circle-distribution="count" type="range" min="1" max="24" step="1" value="'+count+'"'+disabled+' aria-label="Aantal punten"><output>'+count+'</output></label><label>Beginhoek (graden)<input data-circle-distribution="startAngle" type="number" min="0" max="359.999999" step="0.1" value="'+Number(degrees.toFixed(6))+'"'+disabled+'></label><p class="help-text">Sleep een punt om de hele verdeling over de cirkel te draaien. Verdeel punten gelijkmatig tegen de klok in. Bestaande punt-ID’s blijven behouden.</p></details>';
    }
    renderInspector(object) {
      const panel = this.nodes.selectionPanel;
      if(this.inspectorTarget==='axes' && !this.selectedId){panel.className='selection-panel';panel.innerHTML=this.services.axis?.html(this.engine.renderer,{adaptive:!!this.services.grid,measurement:this.engine.model.meta.measurement,angleMeasurement:this.engine.model.meta.angleMeasurement,readOnly:!!this.runtime})||'';this.decorateInspector();return;}
      if (!object) { panel.className = "selection-empty"; panel.textContent = this.tool==='select'?"Selecteer een object of het assenstelsel.":""; return; }
      this.inspectorTarget='objects';

      this.inspectorObjectKey=JSON.stringify(this.selectedIds);
      panel.className = "selection-panel";
      const layers=this.engine.model.layers||[],owner=MI.DocumentLayers.index(layers).owner,current=owner.get(this.selectedIds[0])?.id,same=this.selectedIds.every(id=>owner.get(id)?.id===current),assignment=!this.runtime&&layers.length?'<label>Laag<select data-layer-assign aria-label="Laag van selectie">'+(!same?'<option value="">Verschillende lagen</option>':'')+layers.slice().reverse().map(l=>'<option value="'+MI.escapeXml(l.id)+'"'+(same&&l.id===current?' selected':'')+'>'+MI.escapeXml(l.name)+(l.visible?'':' (verborgen)')+'</option>').join('')+'</select></label>':'';
      const derived=this.selectedObjects().filter(o=>o.construction),detach=!this.runtime&&derived.length?'<button type="button" class="secondary" data-detach-construction'+(!this.allowed('construction.detach',{ids:derived.map(o=>o.id)})?' disabled':'')+'>Constructie losmaken</button>':'';
      const info=this.selectedIds.length===1?this.constructionPanel(object):'';
      const actionIcon=(attribute,label,path,disabled=false)=>'<button type="button" class="secondary" '+attribute+' title="'+label+'" aria-label="'+label+'"'+(disabled?' disabled':'')+'><svg viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg></button>';
      const labelVisible=this.selectedObjects().every(o=>o.showLabel),labelButton='<button type="button" class="secondary" data-label-selection aria-label="Label tonen/verbergen" title="Label tonen/verbergen" aria-pressed="'+labelVisible+'"'+(this.selectedObjects().some(o=>o.locked)||!this.allowed('object.setProperties',{ids:this.selectedIds,fields:[{path:'showLabel',value:!labelVisible}]})?' disabled':'')+'><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M12 5v15M8 20h8"/></svg></button>';
      const restore=object.textContent?.schema>=3&&typeof object.legacyStaticText==='string'?'<button type="button" data-text-restore="'+MI.escapeXml(object.id)+'"'+(this.allowed('text.restoreStatic',{id:object.id})?'':' disabled')+'>Oorspronkelijke statische tekst herstellen</button>':'';
      const richEdit=object.type==='text'&&!object.textBinding&&!object.construction?'<button type="button" class="secondary" data-rich-text-edit="'+MI.escapeXml(object.id)+'"'+(object.locked?' disabled':'')+'>Tekst bewerken</button>':'';
      const toolbar='<div class="object-toolbar">'+(richEdit?'<div class="object-edit-row">'+richEdit+'</div>':'')+'<div class="object-actions">'+restore+labelButton+(!this.runtime?actionIcon('data-group-selection','Groeperen','<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h5v5H7zM12 12h5v5h-5z"/>',this.selectedIds.length<2)+actionIcon('data-ungroup-selection','Groep opheffen','<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5M7 7h5v5H7zM12 12h5v5h-5z"/>',!this.selectedGroups().length):'')+actionIcon('data-visibility-selection',this.selectedObjects().every(o=>o.visible!==false)?'Selectie verbergen':'Selectie tonen',eyeIcon(this.selectedObjects().every(o=>o.visible!==false)),!this.allowed('object.setVisibility',{ids:this.selectedIds,value:true}))+actionIcon('data-duplicate-selection','Dupliceren','<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 8V4H4v11h4"/>')+actionIcon('data-lock-selection',this.selectedObjects().every(o=>o.locked)?'Ontgrendelen':'Vergrendelen','<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>')+actionIcon('data-delete-selected','Verwijder object','<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',!this.editableSelection())+'</div></div>';
      const isEllipsePath=object.construction?.kind==='pointOnEllipse',pathParameter=!this.runtime&&MI.ConstructionService.pathKind(object.construction?.kind)?'<label>'+(isEllipsePath?'Parameter op ellips':'Positie op pad')+'<input data-path-parameter type="'+(isEllipsePath?'number':'range')+'" min="0" max="'+(object.construction.kind==='pointOnSegment'?'1':'.9999999999999999')+'" step="'+(isEllipsePath?'any':'.001')+'" value="'+object.construction.parameter+'"'+(object.locked?' disabled':'')+' aria-label="'+(isEllipsePath?'Parameter op ellips':'Positie op pad')+'"><output>'+Number((object.construction.parameter*100).toFixed(4))+'%</output></label>':'';
      const distribution=this.distributionInspector(object);
      const actions=info+this.constructionInputs(object)+pathParameter+distribution+detach+assignment;
      const kind=MI.escapeXml(({point:'Punt',line:'Lijnstuk',straight:'Rechte',ray:'Halfrechte',vector:'Vector',circle:'Cirkel',text:'Tekst',polygon:'Veelhoek',region:'Gebied',dimension:'Lengtemaat',angle:'Hoek'})[object.type]||object.type);
      const heading='<div class="object-heading"><div>'+(this.selectedIds.length>1?'<strong>'+this.selectedIds.length+' objecten geselecteerd</strong>':'<input class="object-name-input" type="text" data-edit="name" aria-label="Objectnaam" value="'+MI.escapeXml(object.name)+'"'+(object.locked?' disabled':'')+'>')+'<span class="object-kind">'+(this.selectedIds.length>1?'Multiselectie':kind)+'</span></div>'+toolbar+'</div>';
      if(this.selectedIds.length>1 || object.locked) {panel.innerHTML=heading+'<p class="help-text">'+(this.editableSelection()?'Sleep een geselecteerd object om de hele selectie te verplaatsen.':'Ontgrendel om de selectie te bewerken.')+'</p>'+(this.selectedIds.length>1?this.commonInspector():'')+actions+this.pointProjectionInspector(object)+this.angleInspector(object)+this.dynamicTextInspector(object)+this.ellipseInspector(object)+this.independentMeasurementInspector(object);return;}
      const displayNumber=value=>String(Number(Number(value).toFixed(2)));
      let html = '';
      const keys = MI.LinearGeometry.isLinear(object) ? ['x1', 'y1', 'x2', 'y2'] : { point: ["x", "y"], circle: ["cx", "cy", "r"], text: ["x", "y"] }[object.type];
      for (const key of object.construction?[]:keys || []) html += '<label>' + key + '<input data-edit="' + key + '" type="number" step="0.01" value="' + displayNumber(object[key]) + '"></label>';
      if(!object.construction&&(object.type==='polygon' || object.type==='angle')) object.vertices.forEach((p,i)=>{ for(const key of ['x','y']) html+='<label>Hoekpunt '+(i+1)+' '+key+'<input data-vertex="'+i+'" data-edit="'+key+'" type="number" step="0.01" value="'+displayNumber(p[key])+'"></label>'; });
      if (object.type === "text" && !object.construction && !object.textBinding && !object.textContent) html += '<label>Tekst<input data-edit="text" value="' + MI.escapeXml(object.text) + '"></label>';
      html+='<details data-property-section="labels" open><summary>Label en meting</summary>';
      if(object.type==='dimension')html+='<label class="style-toggle"><input type="checkbox" data-edit="measurementLabelOnly"'+(object.measurementLabelOnly?' checked':'')+'>Alleen meetlabel tonen</label>';
      // Vectors stay on their legacy norm label until M7-VEC-FUND. Other
      // supported families use the independent controls below as their only UI.
      if(object.type==='vector'&&!object.measurements){
        html+='<label class="style-toggle"><input type="checkbox" data-edit="showMeasurement"'+(object.showMeasurement?' checked':'')+'>Maat tonen</label>';
        if(object.showMeasurement){const mode=object.measurementMode||'computed';html+='<label>Maatweergave<select data-edit="measurementMode"><option value="computed"'+(mode==='computed'?' selected':'')+'>Berekende waarde</option><option value="text"'+(mode==='text'?' selected':'')+'>Vrije tekst</option></select></label>';if(mode==='text')html+='<label>Maattekst<input data-edit="measurementText" value="'+MI.escapeXml(object.measurementText||'')+'"></label><div class="measurement-symbol-picker" role="group" aria-label="Symbool invoegen in maattekst">'+['α','β','γ','δ','θ','π','°'].map(symbol=>'<button type="button" class="secondary" data-measurement-symbol="'+symbol+'" aria-label="Symbool '+symbol+' invoegen" title="'+symbol+'">'+symbol+'</button>').join('')+'</div>';else html+='<p data-measurement-value>'+MI.escapeXml(MI.MeasurementGeometry.label(object,this.engine.model.meta.measurement,this.engine.model.meta.angleMeasurement))+'</p>';}
      }
      html+='</details>';
      const style=object.style,esc=MI.escapeXml;
      html+='<fieldset class="object-style"><legend>Stijl</legend><div class="inspector-color-row"><span>'+(object.type==='text'?'Tekstkleur':object.type==='region'?'Randkleur':'Lijnkleur')+'</span><button type="button" class="secondary inspector-color" data-style-color="'+esc(object.id)+'" aria-label="'+(object.type==='text'?'Tekstkleur wijzigen':'Lijnkleur wijzigen')+'" title="Kleur wijzigen" style="--object-color:'+esc(object.type==='text'?style.fill:style.stroke)+'"><span class="color-swatch" aria-hidden="true"></span></button></div>';
      if(object.type==='text') html+='<label>Tekstgrootte<span class="stroke-slider"><input aria-label="Tekstgrootte" data-style="fontSize" type="range" min="1" max="'+Math.max(96,style.fontSize)+'" step="1" value="'+esc(style.fontSize)+'"><output>'+esc(style.fontSize)+' px</output></span></label>';
      else {
        html+='<label>Lijndikte<span class="stroke-slider"><input aria-label="Lijndikte" data-style="strokeWidth" type="range" min="0" max="'+Math.max(20,style.strokeWidth)+'" step="0.1" value="'+esc(style.strokeWidth)+'"><output>'+esc(style.strokeWidth)+' px</output></span></label>';
        const options=[['','Doorgetrokken'],['8 5','Gestreept'],['2 5','Gestippeld'],['8 4 2 4','Streep-punt']];
        if(!options.some(o=>o[0]===style.dash)) options.push([style.dash,'Eigen patroon']);
        html+='<div class="line-pattern-row"><span>Lijnpatroon</span><div class="line-patterns" role="group" aria-label="Lijnpatroon">'+options.map(([value,label])=>'<button type="button" class="secondary" data-style="dash" data-style-dash value="'+esc(value)+'" aria-label="'+label+'" title="'+label+'" aria-pressed="'+(style.dash===value)+'"><svg viewBox="0 0 60 14" aria-hidden="true"><line x1="3" y1="7" x2="57" y2="7" stroke="currentColor" stroke-width="2"'+(value?' stroke-dasharray="'+esc(value)+'"':'')+'/></svg></button>').join('')+'</div></div>';
        if(['point','circle','polygon','region','ellipse'].includes(object.type)) html+='<div class="inspector-color-row"><span>Vulkleur</span><button type="button" class="secondary inspector-color" data-fill-object="'+esc(object.id)+'" aria-label="Vulkleur wijzigen" title="Vulkleur wijzigen" style="--object-color:'+esc(style.fill==='none'?'transparent':style.fill)+'"><span class="color-swatch" aria-hidden="true"></span></button></div>';
      }
      html+='<label>Dekking<span class="stroke-slider"><input aria-label="Dekking" data-style="opacity" type="range" min="0" max="100" step="1" value="'+esc(style.opacity*100)+'"><output>'+esc(Math.round(style.opacity*100))+'%</output></span></label><p class="help-text">0% is onzichtbaar, 100% is volledig zichtbaar.</p></fieldset>';
      const split=html.indexOf('<details data-property-section="labels"'),appearance=html.indexOf('<fieldset');
      if(object.type==='text')html='<details data-property-section="geometry" open><summary>Object en geometrie</summary>'+html.slice(0,split)+'</details>'+html.slice(split,appearance);
      else html='<details data-property-section="appearance" open><summary>Uiterlijk</summary>'+html.slice(appearance)+'</details><details data-property-section="geometry" open><summary>Object en geometrie</summary>'+html.slice(0,split)+'</details>'+html.slice(split,appearance);
      html=html.replace('<details data-property-section="labels" open><summary>Label en meting</summary></details>','');
      const regionDisplay=object.type==='region'?(()=>{
        const d=object.areaDisplay;
        // Null/legacy precision still has an effective default of 2 decimals;
        // old documents with values >3 remain loadable, but the current UI
        // intentionally exposes only the requested 0..3 range.
        const precision=Math.min(3,Math.max(0,d.precision??2));
        const extentControl=['circleSectorRegion','circleSegmentRegion'].includes(object.construction?.kind)&&!this.runtime
          ?MI.ToolInstructions.extentControl(object.construction.extent,'data-region-extent',object.construction.kind):'';
        const visible='<label class="style-toggle"><input type="checkbox" data-region-display="visible"'+(d.visible?' checked':'')+'>Oppervlakte weergeven</label>';
        const mode='<label>Weergave<select data-region-display="mode"><option value="value"'+(d.mode==='value'?' selected':'')+'>Alleen waarde</option><option value="equation"'+(d.mode==='equation'?' selected':'')+'>A = waarde</option></select></label>';
        const slider='<label>Precisie (decimalen)<span class="region-precision-slider"><input type="range" min="0" max="3" step="1" data-region-display="precision" aria-label="Precisie oppervlakte: aantal decimalen" value="'+precision+'"><output aria-live="polite">'+precision+'</output></span></label>';
        const help='<p class="help-text">Versleep het oppervlaktelabel rechtstreeks op het canvas om het te verplaatsen.</p>';
        const reset='<button type="button" class="secondary" data-region-label-reset'+(object.locked||!this.allowed('object.setProperties',{ids:[object.id],fields:[{path:'areaDisplay.position',value:{mode:'auto'}}]})?' disabled':'')+'>Labelpositie herstellen</button>';
        const output='<output>'+MI.escapeXml(object.constructionValid===false?'Niet beschikbaar':MI.RegionGeometry.format(object.regionArea,d,this.engine.model.meta.measurement))+'</output>';
        return extentControl+'<details data-property-section="region" open><summary>Oppervlakte</summary>'+visible+mode+slider+help+reset+output+'</details>';
      })():'';
      panel.innerHTML = heading+'<details data-property-section="relations" open><summary>Relaties en constructies</summary>'+actions+'</details>'+this.pointProjectionInspector(object)+this.angleInspector(object)+this.dynamicTextInspector(object)+regionDisplay+this.ellipseInspector(object)+this.independentMeasurementInspector(object)+html;
    }
    independentMeasurementInspector(object){
      const keys=MI.MeasurementGeometry.measurementKeys(object);
      if(!keys.length||this.selectedIds.length!==1)return '';
      const meta=this.engine.model.meta.measurement||MI.MeasurementUnits.defaults,config=object.measurements?MI.MeasurementGeometry.measurementSettings(object.measurements,object):MI.MeasurementGeometry.defaultMeasurementSettings(object),allowed=!object.locked&&this.allowed('object.setProperties',{ids:[object.id],fields:[{path:'measurements',value:config}]}),disabled=allowed?'':' disabled',esc=MI.escapeXml;
      const rows=keys.map(key=>{
        const entry=config.values[key]||{visible:false,precision:null,mode:'computed',text:'',dx:0,dy:0},title=key.startsWith('side:')?'Zijde '+(Number(key.slice(5))+1):key.startsWith('angle:')?'Hoek '+(Number(key.slice(6))+1):({radius:'Straal',diameter:'Diameter',circumference:'Omtrek',area:'Oppervlakte',semiMajor:'Grote halve as',semiMinor:'Kleine halve as',majorAxis:'Grote as',minorAxis:'Kleine as',eccentricity:'Excentriciteit',perimeter:'Omtrek',length:'Lengte',angle:'Hoek'}[key]||key),computedConfig={...config,values:{...config.values,[key]:{...entry,mode:'computed'}}},value=MI.MeasurementGeometry.measurementLabel(object,key,computedConfig,meta,this.engine.model.meta.angleMeasurement);
        const mode='<label>Weergave<select data-measurement-control data-measurement-key="'+esc(key)+'" data-measurement-field="mode"'+disabled+'><option value="computed"'+(entry.mode==='computed'?' selected':'')+'>Berekende waarde</option><option value="text"'+(entry.mode==='text'?' selected':'')+'>Vrije tekst</option></select></label>';
        const precision='<label>Precisie<input type="number" min="0" max="10" step="1" placeholder="Documentstandaard" value="'+(entry.precision??'')+'" data-measurement-control data-measurement-key="'+esc(key)+'" data-measurement-field="precision"'+disabled+'></label>';
        const freeText=entry.mode==='text'?'<label>Maattekst<input type="text" maxlength="2000" value="'+esc(entry.text)+'" data-measurement-control data-measurement-key="'+esc(key)+'" data-measurement-field="text"'+disabled+'></label><div class="measurement-symbol-picker" role="group" aria-label="Symbool invoegen in '+esc(title)+'">'+['α','β','γ','δ','θ','π','°'].map(symbol=>'<button type="button" class="secondary" data-measurement-symbol="'+symbol+'" data-measurement-symbol-key="'+esc(key)+'" aria-label="'+symbol+' invoegen" title="'+symbol+'"'+disabled+'>'+symbol+'</button>').join('')+'</div>':'';
        return '<div class="measurement-entry"><label class="style-toggle"><input type="checkbox" data-measurement-control data-measurement-key="'+esc(key)+'" data-measurement-field="visible"'+(entry.visible?' checked':'')+disabled+'><span>'+esc(title)+'</span></label><output>'+esc(value)+'</output><details><summary>Notatie en labelpositie</summary>'+mode+precision+freeText+'<button type="button" class="secondary" data-measurement-reset="'+esc(key)+'"'+disabled+'>Labelpositie herstellen</button></details></div>';
      }).join('');
      return '<div class="measurement-list" data-property-section="individual-measurements">'+rows+'</div>';
    }
    organizeGeometryInspector(){
      if(this.inspectorTarget!=='objects'||this.selectedIds.length!==1)return;
      const panel=this.nodes.selectionPanel;
      const groups=[
        {id:'object-geometry',title:'Object en geometrie',sections:['geometry','point-projections','circle-distribution','ellipse-geometry']},
        {id:'measurements',title:'Metingen',sections:['labels','angle-measurement','region','individual-measurements']}
      ];
      for(const group of groups){
        let wrapper=panel.querySelector(':scope > details[data-property-section="'+group.id+'"]');
        if(!wrapper){wrapper=this.document.createElement('details');wrapper.dataset.propertySection=group.id;wrapper.open=true;const summary=this.document.createElement('summary');summary.textContent=group.title;wrapper.appendChild(summary);}
        else wrapper.querySelector(':scope > summary').textContent=group.title;
        for(const section of group.sections){
          const node=Array.from(panel.children).find(child=>child.dataset?.propertySection===section);
          if(node){
            if(section==='geometry'&&node.children.length===1){node.remove();continue;}
            if(section==='geometry')node.querySelector(':scope > summary').textContent='Definitieparameters';
            if(section==='labels')node.querySelector(':scope > summary').textContent='Objectlabel en maat';
            wrapper.appendChild(node);
          }
        }
        if(wrapper.children.length>1){
          const anchor=group.id==='measurements'
            ?panel.querySelector(':scope > details[data-property-section="object-geometry"]')||panel.querySelector(':scope > .object-heading')
            :panel.querySelector(':scope > .object-heading');
          if(anchor)anchor.after(wrapper);else panel.prepend(wrapper);
        }else wrapper.remove();
      }
    }
    async exportImage(kind){
      try{
        if(!this.allowed('document.exportSVG'))throw Error('Export niet toegestaan.');
        this.cancel();this.flushEdits();
        const serial=this.exportSerial=(this.exportSerial||0)+1,revision=this.command('document.exportSVG',{}).expectedDocumentRevision,epoch=this.runtime?.permissionEpoch;
        const view=()=>JSON.stringify([this.engine.renderer.width,this.engine.renderer.height,this.engine.renderer.bounds]);const initialView=view();
        const guard=()=>this.initialized&&serial===this.exportSerial&&epoch===this.runtime?.permissionEpoch&&revision===this.command('document.exportSVG',{}).expectedDocumentRevision&&view()===initialView&&this.allowed('document.exportSVG');
        const svg=await MI.ExportService.svg(this.engine,{guard,document:this.document});
        const output=kind==='png'?await MI.ExportService.png(svg,{width:this.engine.renderer.width,height:this.engine.renderer.height,guard,document:this.document}):svg;
        if(!guard())throw Error('Exportcontext gewijzigd; exporteer opnieuw.');
        this.download('illustratie.'+kind,output,kind==='png'?'image/png':'image/svg+xml;charset=utf-8');this.status(kind.toUpperCase()+' geexporteerd.');
      }catch(error){if(this.initialized)this.status('Export mislukt: '+error.message);}
    }
    download(name, content, type) { const blob = new this.window.Blob([content], { type }), url = this.window.URL.createObjectURL(blob), link = this.document.createElement("a"); link.href = url; link.download = name; link.click(); this.window.setTimeout(() => this.window.URL.revokeObjectURL(url), 500); }
  }
  // Existing presentation helpers, copied without their old event/render owners.
    function eyeIcon(visible) { if (visible) return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" fill="currentColor"/></svg>'; return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M9.9 5.9C10.6 5.7 11.3 5.6 12 5.6c6.5 0 10 6.4 10 6.4-.8 1.2-1.8 2.4-3.1 3.4M6.1 6.1C3.5 7.7 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  function textIcon(active) { return '<span class="text-toggle' + (active ? ' active' : '') + '" aria-hidden="true">T</span>'; }
  function objectName(object) { const names = { point: "Punt", line: "Lijnstuk", circle: "Cirkel", text: "Tekst", straight: "Rechte", ray: "Halfrechte", vector: "Vector", polygon: "Veelhoek" }; return object.name || names[object.type] || object.type; }


  MI.EditorApp = EditorApp;
})(window);
