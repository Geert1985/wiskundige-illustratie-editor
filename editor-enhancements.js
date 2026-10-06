/* From Zero 2 Infinity — editor interaction enhancements */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  const canvas = document.getElementById("canvas");
  const canvasWrap = document.getElementById("canvasWrap");
  const viewList = document.getElementById("viewList");
  const SNAP_KEY = "fzi.mathIllustration.snapSettings";

  const defaults = { grid: true, point: true, endpoint: true, midpoint: true, center: true, intersection: true };
  let snapSettings = loadSettings();
  let labelDrag = null;
  let activeCandidate = null;
  let snapMarker = null;
  let uiObserver = null;

  function loadSettings() { try { return Object.assign({}, defaults, JSON.parse(localStorage.getItem(SNAP_KEY) || "{}")); } catch (_) { return Object.assign({}, defaults); } }
  function saveSettings() { localStorage.setItem(SNAP_KEY, JSON.stringify(snapSettings)); }
  function activeEngine() { return MI.activeEngine || null; }
  function esc(value) { return MI.escapeXml ? MI.escapeXml(value) : String(value); }

  const labelRenderer = MI.SvgRenderer && MI.SvgRenderer.prototype;
  if (labelRenderer && labelRenderer.renderLabel) {
    const originalRenderLabel = labelRenderer.renderLabel;
    labelRenderer.renderLabel = function (object, label, dx, dy, line) {
      const x = Number(dx || 0) + Number(object.labelDx || 0);
      const y = Number(dy || 0) + Number(object.labelDy || 0);
      const result = originalRenderLabel.call(this, object, label, x, y, line);
      return result.replace("<text ", '<text class="object-label" data-label-id="' + esc(object.id) + '" ');
    };
  }

  function ensureStyle() {
    if (document.getElementById("fzi-editor-enhancements-style")) return;
    const style = document.createElement("style");
    style.id = "fzi-editor-enhancements-style";
    style.textContent = [
      '.object-label{cursor:move;user-select:none;pointer-events:all}',
      '.fzi-snap-marker{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border:2px solid #1565c0;border-radius:50%;box-sizing:border-box;pointer-events:none;z-index:20}',
      '.fzi-snap-marker::after{content:"";position:absolute;left:5px;top:5px;width:2px;height:2px;background:#1565c0;border-radius:50%}',
      '.fzi-snap-button{border:1px solid transparent;background:transparent;cursor:pointer;font-size:14px;padding:2px 6px;line-height:1;border-radius:4px;min-width:27px}',
      '.fzi-snap-button.active{background:#dbeafe;border-color:#7aa7e8;box-shadow:inset 0 0 0 1px #fff;color:#0b4f9c}',
      '.fzi-snap-button.inactive{opacity:.45;background:#f1f1ee;border-color:#d7d7d2;text-decoration:line-through}',
      '.fzi-snap-popover{position:absolute;z-index:100;background:#fff;border:1px solid #cfd2ce;border-radius:6px;box-shadow:0 4px 14px rgba(0,0,0,.12);padding:8px;min-width:150px;font-size:12px}',
      '.fzi-snap-popover label{display:block;margin:4px 0;cursor:pointer}',
      '.fzi-color-button{width:24px;height:24px;padding:2px;border:1px solid #bbb;border-radius:4px;background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}',
      '.fzi-color-button input{width:18px;height:18px;padding:0;border:0;cursor:pointer;background:transparent}'
    ].join("");
    document.head.appendChild(style);
  }

  function ensureMarker() {
    if (snapMarker) return snapMarker;
    snapMarker = document.createElement("div"); snapMarker.className = "fzi-snap-marker"; snapMarker.hidden = true; canvasWrap.appendChild(snapMarker); return snapMarker;
  }

  function mathPoint(event) {
    const engine = activeEngine(), svg = canvas && canvas.querySelector("svg"); if (!engine || !svg) return null;
    const matrix = svg.getScreenCTM(); if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()), r = engine.renderer, b = r.bounds, scale = r.scale();
    return { x: b.xMin + (p.x - r.padding) / scale, y: b.yMin + (r.height - r.padding - p.y) / scale };
  }

  function screenPoint(point) {
    const engine = activeEngine(), svg = canvas && canvas.querySelector("svg"); if (!engine || !svg) return null;
    const r = engine.renderer, b = r.bounds, scale = r.scale(), svgPoint = new DOMPoint(r.padding + (point.x - b.xMin) * scale, r.height - r.padding - (point.y - b.yMin) * scale), matrix = svg.getScreenCTM();
    if (!matrix) return null; const p = svgPoint.matrixTransform(matrix), rect = canvasWrap.getBoundingClientRect(); return { x: p.x - rect.left, y: p.y - rect.top };
  }
  function screenDistance(a, b) { const pa = screenPoint(a), pb = screenPoint(b); return pa && pb ? Math.hypot(pa.x - pb.x, pa.y - pb.y) : Infinity; }

  function lineIntersection(a, b) {
    const x1=a.x1,y1=a.y1,x2=a.x2,y2=a.y2,x3=b.x1,y3=b.y1,x4=b.x2,y4=b.y2, den=(x1-x2)*(y3-y4)-(y1-y2)*(x3-x4);
    if (Math.abs(den)<1e-10) return null;
    const px=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/den, py=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/den;
    const within=(p,a,b)=>p>=Math.min(a,b)-1e-9&&p<=Math.max(a,b)+1e-9;
    return within(px,x1,x2)&&within(px,x3,x4)&&within(py,y1,y2)&&within(py,y3,y4)?{x:px,y:py}:null;
  }

  function circleIntersections(a, b) {
    const dx=b.cx-a.cx, dy=b.cy-a.cy, d=Math.hypot(dx,dy);
    if (d < 1e-10 || d > a.r+b.r+1e-9 || d < Math.abs(a.r-b.r)-1e-9) return [];
    const aa=(a.r*a.r-b.r*b.r+d*d)/(2*d), h2=a.r*a.r-aa*aa; if(h2 < -1e-9) return [];
    const h=Math.sqrt(Math.max(0,h2)), ux=dx/d, uy=dy/d, px=a.cx+aa*ux, py=a.cy+aa*uy;
    if(h<1e-9) return [{x:px,y:py}];
    return [{x:px-h*uy,y:py+h*ux},{x:px+h*uy,y:py-h*ux}];
  }

  function candidates(point) {
    const engine = activeEngine(); if (!engine) return [];
    const result=[], add=(type,p,priority,id)=>{ const d=screenDistance(point,p); if(d<=10) result.push({type,point:p,d,priority:priority||0,id:id||null}); }, objects=engine.model.objects.filter(o=>o.visible!==false), step=Number(engine.renderer.axisStep)||1;
    if(snapSettings.grid && engine.renderer.showGrid) add("grid",{x:Math.round(point.x/step)*step,y:Math.round(point.y/step)*step},20);
    for(const o of objects){
      if(o.type==="point" && snapSettings.point) add("punt",{x:o.x,y:o.y},0,o.id);
      if(o.type==="line"){
        if(snapSettings.endpoint){ add("eindpunt",{x:o.x1,y:o.y1},0,o.id); add("eindpunt",{x:o.x2,y:o.y2},0,o.id); }
        if(snapSettings.midpoint) add("midden",{x:(o.x1+o.x2)/2,y:(o.y1+o.y2)/2},1,o.id);
      }
      if(o.type==="circle" && snapSettings.center) add("centrum",{x:o.cx,y:o.cy},1,o.id);
    }
    if(snapSettings.intersection){
      const lines=objects.filter(o=>o.type==="line");
      for(let i=0;i<lines.length;i++) for(let j=i+1;j<lines.length;j++){ const p=lineIntersection(lines[i],lines[j]); if(p) add("snijpunt",p,2,lines[i].id+":"+lines[j].id); }
      const circles=objects.filter(o=>o.type==="circle");
      for(let i=0;i<circles.length;i++) for(let j=i+1;j<circles.length;j++) for(const p of circleIntersections(circles[i],circles[j])) add("snijpunt",p,2,circles[i].id+":"+circles[j].id);
    }
    result.sort((a,b)=>a.d-b.d||a.priority-b.priority); return result;
  }

  function setClientPosition(event, point) {
    const sp=screenPoint(point); if(!sp) return; const rect=canvasWrap.getBoundingClientRect(), x=rect.left+sp.x, y=rect.top+sp.y;
    try { Object.defineProperty(event,"clientX",{value:x,configurable:true}); Object.defineProperty(event,"clientY",{value:y,configurable:true}); } catch (_) {}
  }
  function updateSnap(event) {
    const p=mathPoint(event); if(!p){activeCandidate=null;ensureMarker().hidden=true;return;}
    const list=candidates(p); activeCandidate=list[0]||null, marker=ensureMarker();
    if(activeCandidate){ const sp=screenPoint(activeCandidate.point); marker.hidden=!sp; if(sp){marker.style.left=sp.x+"px";marker.style.top=sp.y+"px";marker.title=activeCandidate.type;} setClientPosition(event,activeCandidate.point); }
    else marker.hidden=true;
  }

  function colorForObject(object){ const style=object.style||{}; return style.stroke && style.stroke!=="none" ? style.stroke : (style.fill||"#222222"); }
  function repaintCanvas(){
    const engine=activeEngine(); if(!engine) return; canvas.innerHTML=engine.renderSVG();
    if(engine.model && engine.model.objects) engine.model.objects.forEach(o=>{ const g=canvas.querySelector('[data-object-id="'+CSS.escape(o.id)+'"]'); if(g && o.visible===false) g.style.display="none"; });
    if(activeCandidate){ const marker=ensureMarker(); const sp=screenPoint(activeCandidate.point); if(sp){marker.style.left=sp.x+"px";marker.style.top=sp.y+"px";} }
  }
  function updateColorControls(){
    if(!viewList) return;
    viewList.querySelectorAll("[data-fzi-color]").forEach(el=>el.remove());
    const selected=viewList.querySelector(".view-row-selected"); if(!selected) return;
    const selector=selected.querySelector("[data-select-object]"); if(!selector) return;
    const id=selector.dataset.selectObject, engine=activeEngine(), object=engine&&engine.get(id); if(!object) return;
    const wrapper=document.createElement("span"); wrapper.className="fzi-color-button"; wrapper.dataset.fziColor="1";
    const input=document.createElement("input"); input.type="color"; input.value=colorForObject(object); input.title="Kleur van geselecteerd object"; input.setAttribute("aria-label","Kleur van geselecteerd object");
    input.addEventListener("click",e=>e.stopPropagation());
    input.addEventListener("change",e=>{ const current=activeEngine()&&activeEngine().get(id); if(!current)return; const value=e.target.value, style=Object.assign({},current.style||{},{stroke:value}); if(current.type==="point"||current.type==="text") style.fill=value; activeEngine().update(id,{style}); repaintCanvas(); });
    wrapper.appendChild(input); const labelButton=selected.querySelector("[data-toggle-label]"); if(labelButton) selected.insertBefore(wrapper,labelButton); else selected.appendChild(wrapper);
  }

  function refreshSnapButtons(){
    const grid=viewList&&viewList.querySelector("[data-fzi-snap=grid]"), objects=viewList&&viewList.querySelector("[data-fzi-snap=objects]");
    if(grid){ grid.classList.toggle("active",snapSettings.grid); grid.classList.toggle("inactive",!snapSettings.grid); grid.textContent=snapSettings.grid?"🧲":"⊘"; grid.setAttribute("aria-label",snapSettings.grid?"Rasterpunten snappen aan":"Rasterpunten snappen uit"); grid.title=snapSettings.grid?"Rasterpunten snappen is aan":"Rasterpunten snappen is uit"; }
    if(objects){ const on=objectSnapEnabled(); objects.classList.toggle("active",on); objects.classList.toggle("inactive",!on); objects.textContent=on?"⌁":"⊘"; objects.title=on?"Object-snappen is aan":"Object-snappen is uit"; }
  }

  function injectSnapUI(){
    ensureStyle();
    const row=viewList&&viewList.querySelector('[data-view="grid"]')?.closest(".view-row");
    if(row&&!row.querySelector("[data-fzi-snap=grid]")){
      const button=document.createElement("button"); button.className="fzi-snap-button"; button.type="button"; button.dataset.fziSnap="grid";
      row.insertBefore(button,row.lastElementChild); button.addEventListener("click",e=>{e.stopPropagation();snapSettings.grid=!snapSettings.grid;saveSettings();refreshSnapButtons();});
    }
    if(row&&!row.querySelector("[data-fzi-snap=objects]")){
      const os=document.createElement("button"); os.className="fzi-snap-button"; os.type="button"; os.dataset.fziSnap="objects"; row.insertBefore(os,row.lastElementChild); os.addEventListener("click",e=>{e.stopPropagation();togglePopover(os);});
    }
    refreshSnapButtons(); updateColorControls();
  }

  function objectSnapEnabled(){ return snapSettings.point||snapSettings.endpoint||snapSettings.midpoint||snapSettings.center||snapSettings.intersection; }
  function togglePopover(anchor){
    const old=document.querySelector(".fzi-snap-popover"); if(old){old.remove();return;}
    const pop=document.createElement("div"); pop.className="fzi-snap-popover";
    const items=[['point','Punten'],['endpoint','Eindpunten'],['midpoint','Middelpunten'],['center','Centra'],['intersection','Snijpunten']];
    pop.innerHTML='<strong>Object-snappen</strong>'+items.map(([k,t])=>'<label><input type="checkbox" data-snap-choice="'+k+'" '+(snapSettings[k]?"checked":"")+'> '+t+'</label>').join("");
    document.body.appendChild(pop); const a=anchor.getBoundingClientRect(); pop.style.left=a.left+"px"; pop.style.top=(a.bottom+4)+"px";
    pop.addEventListener("change",e=>{const input=e.target.closest("[data-snap-choice]");if(!input)return;snapSettings[input.dataset.snapChoice]=input.checked;saveSettings();refreshSnapButtons();});
  }

  function labelDown(event){
    const target=event.target.closest&&event.target.closest(".object-label"); if(!target)return false;
    const engine=activeEngine(), id=target.dataset.labelId, object=engine&&engine.get(id); if(!object)return false;
    event.preventDefault();event.stopImmediatePropagation();
    labelDrag={id,target,startX:event.clientX,startY:event.clientY,baseDx:Number(object.labelDx)||0,baseDy:Number(object.labelDy)||0,baseSvgX:Number(target.getAttribute("x")),baseSvgY:Number(target.getAttribute("y"))}; return true;
  }

  canvasWrap.addEventListener("mousedown",event=>{if(labelDown(event))return;updateSnap(event);},true);
  global.addEventListener("mousemove",event=>{
    if(labelDrag){ event.preventDefault();event.stopImmediatePropagation(); const engine=activeEngine(),object=engine&&engine.get(labelDrag.id);if(!object)return; const dx=event.clientX-labelDrag.startX,dy=event.clientY-labelDrag.startY; object.labelDx=labelDrag.baseDx+dx;object.labelDy=labelDrag.baseDy+dy;object.showLabel=true; labelDrag.target.setAttribute("x",String(labelDrag.baseSvgX+dx));labelDrag.target.setAttribute("y",String(labelDrag.baseSvgY+dy)); return; }
    if(canvasWrap.contains(event.target)) updateSnap(event);
  },true);
  global.addEventListener("mouseup",event=>{
    if(!labelDrag)return; event.preventDefault();event.stopImmediatePropagation(); const engine=activeEngine(); if(engine){const o=engine.get(labelDrag.id);if(o){engine.update(o.id,{labelDx:labelDrag.baseDx+(event.clientX-labelDrag.startX),labelDy:labelDrag.baseDy+(event.clientY-labelDrag.startY),showLabel:true});try{localStorage.setItem("fzi.mathIllustration.draft",engine.toJSONString(true));}catch(_){}}} labelDrag=null;
  },true);

  ensureStyle();
  if(viewList){ uiObserver=new MutationObserver(injectSnapUI); uiObserver.observe(viewList,{childList:true,subtree:true}); injectSnapUI(); }
})(window);
