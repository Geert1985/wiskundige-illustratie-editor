/* UI-RADIAL-1 — Contextual properties presentation.
 * Reuses EditorApp's existing inspector, commands, permission checks and history.
 * Does not own geometry, model writes, canvas pointer gestures or document rendering.
 */
(function (global) {
  'use strict';
  const MI=global.FZI?.MathIllustration;
  if(!MI)return;

  const SECTIONS={
    geometry:['geometry','point-projections','circle-distribution'],
    appearance:['appearance','common'],
    measurement:['labels','angle-measurement','region'],
    relations:['relations','dynamic-text'],
    labels:['labels','point-projections','common'],
    axes:['axes'],
    grid:['grid'],
    units:['units'],
    angleUnits:['angle-units'],
    organization:['relations'],
    all:null
  };
  const CONTENT={
    object:[
      ['geometry','Geometrie','◇'],['appearance','Uiterlijk','◉'],
      ['measurement','Meting','∠'],['relations','Relaties','⌁'],
      ['actions','Acties','⚙'],['all','Alles','⋯']
    ],
    linked:[
      ['relations','Bronnen','⌁'],['appearance','Uiterlijk','◉'],
      ['measurement','Meting','∠'],['labels','Labels','T'],
      ['actions','Acties','⚙'],['all','Alles','⋯']
    ],
    text:[
      ['editText','Tekst','T'],['appearance','Opmaak','◉'],
      ['geometry','Positie','⊕'],['relations','Binding','⌁'],
      ['actions','Acties','⚙'],['all','Alles','⋯']
    ],
    axes:[
      ['axes','Assen','┼'],['grid','Raster','▦'],
      ['units','Schaal','↔'],['angleUnits','Hoeken','∠'],
      ['actions','Acties','⚙'],['all','Alles','⋯']
    ],
    multiple:[
      ['appearance','Stijl','◉'],['labels','Labels','T'],
      ['group','Groeperen','▣'],['organization','Ordenen','☷'],
      ['actions','Acties','⚙'],['all','Alles','⋯']
    ],
    group:[
      ['appearance','Stijl','◉'],['labels','Labels','T'],
      ['ungroup','Opheffen','□'],['organization','Groep','▣'],
      ['actions','Acties','⚙'],['all','Alles','⋯']
    ]
  };
  // UI-RADIAL-4: native SVG icon shapes reproduce the approved navy/gold
  // concept without bitmaps, duplicate action engines or network dependencies.
  const SEGMENT_ICONS=Object.freeze({
    relations:'<path d="m13.3 1.5-8.5 12H12l-1.2 9 8.5-12h-6.6l.6-9Z" fill="currentColor" stroke="none"/>',
    appearance:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="6.4"/>',
    measurement:'<path d="m2.8 16.5 13.7-13.7 4.7 4.7L7.5 21.2l-4.7-4.7Z"/><path d="m13.5 6 3.1 3.1M10.6 8.9l1.8 1.8M8 11.5l3.1 3.1M5.3 14.2l1.8 1.8"/>',
    labels:'<path d="M4 4.5h16M12 4.5V20M9 20h6" stroke-width="2.8"/>',
    actions:'<path d="M10 2.4h4l.65 2.7a8 8 0 0 1 2.1 1.2l2.6-1 2 3.5-2 1.9a8.5 8.5 0 0 1 0 2.5l2 1.9-2 3.5-2.6-1a8 8 0 0 1-2.1 1.2L14 21.6h-4l-.65-2.8a8 8 0 0 1-2.1-1.2l-2.6 1-2-3.5 2-1.9a8.5 8.5 0 0 1 0-2.5l-2-1.9 2-3.5 2.6 1a8 8 0 0 1 2.1-1.2L10 2.4Z"/><circle cx="12" cy="12" r="3.15"/>',
    all:'<circle cx="5.5" cy="12" r="2.15" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2.15" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="2.15" fill="currentColor" stroke="none"/>',
    geometry:'<path d="m12 2 9 10-9 10-9-10 9-10Z"/><path d="m3 12 18 0"/>',
    editText:'<path d="M4 5h16M12 5v15M8 20h8" stroke-width="2.5"/>',
    grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    axes:'<path d="M4 20V3M4 20h17M2 6l2-3 2 3M18 18l3 2-3 2"/>',
    units:'<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>',
    angleUnits:'<path d="M4 20V5M4 20h15M4 12a8 8 0 0 1 8 8"/>',
    group:'<rect x="2.5" y="2.5" width="19" height="19" rx="2"/><path d="M7 7h5v5H7zM12 12h5v5h-5z"/>',
    ungroup:'<path d="M3 8V3h5M16 3h5v5M21 16v5h-5M8 21H3v-5"/><path d="M7 7h5v5H7zM12 12h5v5h-5z"/>',
    organization:'<path d="M3 5h18M3 12h18M3 19h18"/>'
  });
  const CENTER_CAPTIONS=Object.freeze({object:'OBJECT',linked:'CONSTRUCTIE',text:'TEKST',axes:'ASSENSTELSEL',multiple:'SELECTIE',group:'GROEP'});
  const SVG_NS='http://www.w3.org/2000/svg';
  const SEGMENT_SHAPE='M39 10 Q105 -1 171 10 Q201 14 191 48 L175 112 Q170 133 148 122 Q105 110 62 122 Q40 133 35 112 L19 48 Q9 14 39 10 Z';
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const text=(tag,cls,value,doc)=>{const el=doc.createElement(tag);if(cls)el.className=cls;el.textContent=value;return el;};
  const editableTarget=target=>!!target?.closest?.('input,textarea,select,[contenteditable="true"],dialog[open]');

  class RadialProperties {
    constructor(app){
      this.app=app;this.doc=app.document;this.win=app.window;
      this.area=this.doc.querySelector('.canvas-area');
      this.trigger=this.doc.getElementById('radialPropertiesTrigger');
      this.wheel=this.doc.getElementById('radialPropertiesWheel');
      this.detail=this.doc.getElementById('propertiesSidebar');
      this.panel=app.nodes.selectionPanel;
      this.closeBtn=app.nodes.propertiesClose;
      if(!this.area||!this.trigger||!this.wheel||!this.detail||!this.panel)return;
      this.bound=[];this.anchor=null;this.identity='';this.opened=false;this.detailMode=null;this.drag=null;
      this.menuType='';
      this.renderWheel();
      this.listen(this.trigger,'click',e=>{e.preventDefault();this.openAt(this.anchor,true);});
      this.listen(this.closeBtn,'click',e=>{e.stopPropagation();this.closeDetail();this.wheel.querySelector('.radial-center-input')?.focus();});
      this.listen(this.wheel,'click',e=>{const button=e.target.closest('[data-radial-action]');if(button&&!button.disabled)this.choose(button.dataset.radialAction);});
      this.listen(this.wheel,'change',e=>{if(e.target.matches('.radial-center-input'))this.rename(e.target.value);});
      this.listen(this.wheel,'keydown',e=>{if(e.target.matches('.radial-center-input')&&e.key==='Enter'){e.preventDefault();this.rename(e.target.value);e.target.blur();}});
      // Explicit drag handle only: clicking another radial segment must never
      // move the wheel. Store positions in viewport coordinates.
      this.listen(this.wheel,'pointerdown',e=>{
        const grip=e.target.closest('[data-radial-drag]');
        if(e.button!==0||!grip||!this.opened)return;
        e.preventDefault();e.stopPropagation();
        this.drag={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,
          anchor:{...(this.anchor||this.defaultAnchor())}};
        grip.setPointerCapture?.(e.pointerId);
        this.wheel.classList.add('radial-is-dragging');
      });
      this.listen(this.wheel,'keydown',e=>{
        if(!e.target.closest('[data-radial-drag]'))return;
        const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
        if(!delta)return;
        e.preventDefault();e.stopPropagation();
        const anchor=this.anchor||this.defaultAnchor(),step=e.shiftKey?36:12;
        this.anchor={x:anchor.x+delta[0]*step,y:anchor.y+delta[1]*step};
        this.place();
      });
      this.listen(this.win,'pointermove',e=>{
        if(!this.drag||e.pointerId!==this.drag.pointerId)return;
        this.anchor={x:this.drag.anchor.x+e.clientX-this.drag.startX,
          y:this.drag.anchor.y+e.clientY-this.drag.startY};
        this.place();
      });
      const stopDrag=e=>{
        if(!this.drag||e.pointerId!==this.drag.pointerId)return;
        this.drag=null;this.wheel.classList.remove('radial-is-dragging');
      };
      this.listen(this.win,'pointerup',stopDrag);
      this.listen(this.win,'pointercancel',stopDrag);
      this.listen(this.doc,'keydown',e=>{
        if(e.key!=='Escape'||this.doc.querySelector('dialog[open]'))return;
        if(!this.opened&&!this.detailMode)return;
        const editingName=this.wheel.querySelector('.radial-center-input');
        if(editingName&&this.doc.activeElement===editingName)editingName.value=this.context()?.name||'';
        e.preventDefault();e.stopPropagation();this.close();
        this.trigger.focus?.({preventScroll:true});
      },true);
      this.listen(this.doc,'pointerdown',e=>{
        if(!this.opened&&!this.detailMode)return;
        if(e.target.closest('#radialPropertiesWheel,#propertiesSidebar,#radialPropertiesTrigger'))return;
        this.close();
      },true);
      // A right-click on selected geometry may open the wheel at pointerup,
      // before the browser sends contextmenu. Its hit target may consequently
      // be the overlay rather than canvasWrap. Capture it at document level.
      this.listen(this.doc,'contextmenu',e=>{
        if(this.app.tool!=='select'||this.app.navigationMode==='pan')return;
        const rect=this.app.nodes.canvasWrap.getBoundingClientRect();
        const inCanvas=e.clientX>=rect.left&&e.clientX<=rect.right&&
          e.clientY>=rect.top&&e.clientY<=rect.bottom;
        const onMenu=!!e.target.closest?.('#radialPropertiesWheel,#radialPropertiesTrigger,#propertiesSidebar');
        if(inCanvas||onMenu)e.preventDefault();
      },true);
      this.listen(this.app.nodes.canvasWrap,'contextmenu',e=>{
        if(e.defaultPrevented||this.app.tool!=='select'||this.app.navigationMode==='pan'||this.app.interaction)return;
        const hit=this.app.hitAt(e);
        if(!hit?.object)return;
        if(!this.app.canvasSelectable(hit.object))return;
        e.preventDefault();
        this.app.selectObject(hit.object.id,false,'canvas');
        this.openAt({x:e.clientX,y:e.clientY},true);
      });
      // EditorApp's pointerup handler is registered earlier, so selection/drag
      // has already committed when this listener places the contextual trigger.
      this.listen(this.win,'pointerup',e=>{
        // Popup pointer events must never rewrite the canvas anchor. The wheel
        // stays stationary until the user uses its dedicated drag handle.
        if(this.drag||this.opened||this.detailMode||
          e.target.closest?.('#radialPropertiesWheel,#propertiesSidebar,#radialPropertiesTrigger'))return;
        const bounds=this.app.nodes.canvasWrap.getBoundingClientRect();
        const inside=e.clientX>=bounds.left&&e.clientX<=bounds.right&&e.clientY>=bounds.top&&e.clientY<=bounds.bottom;
        if(!inside||this.app.tool!=='select')return;
        if(e.button===2){
          // The existing right-drag rectangle selector owns active drags.
          // A simple right click with no active marquee opens the wheel.
          if(this.app.suppressMarqueeMenu||this.app.interaction)return;
          const hit=this.app.hitAt(e);
          if(!hit?.object||!this.app.canvasSelectable(hit.object))return;
          this.app.selectObject(hit.object.id,false,'canvas');
          this.openAt({x:e.clientX,y:e.clientY},false);
          return;
        }
        if(e.button!==0||!this.app.selectedIds.length)return;
        this.anchor={x:e.clientX,y:e.clientY};
        this.positionTrigger();
      });
      this.listen(this.win,'resize',()=>{if(this.opened||this.detailMode)this.place();else this.positionTrigger();});
      this.sync();
    }
    listen(node,type,fn,options){if(!node)return;node.addEventListener(type,fn,options);this.bound.push(()=>node.removeEventListener(type,fn,options));}
    context(){
      const app=this.app;
      if(app.inspectorTarget==='axes'&&!app.selectedIds.length)return {type:'axes',name:'Assenstelsel',id:'axes'};
      const objects=app.selectedObjects(),ids=app.selectedIds;
      if(!ids.length||objects.length!==ids.length)return null;
      if(objects.length>1){
        const groups=app.selectedGroups?.()||[];
        const group=groups.length===1?app.engine.model.groups.find(g=>g.id===groups[0]):null;
        if(group)return {type:'group',name:group.name,id:group.id,objects};
        return {type:'multiple',name:ids.length+' objecten',id:ids.join('|'),objects};
      }
      const obj=objects[0];
      const groupId=app.selectedGroups?.()?.[0];
      const group=groupId&&app.engine.model.groups.find(g=>g.id===groupId);
      if(group&&app.groupLeaves(group.id).length>1)return {type:'group',name:group.name,id:group.id,objects};
      return {type:obj.type==='text'?'text':obj.construction?'linked':'object',name:obj.name,id:obj.id,objects};
    }
    allowedContext(ctx){
      if(!ctx||this.doc.querySelector('dialog[open]')||this.app.interaction)return false;
      if(this.app.tool!=='select'&&ctx.type!=='axes')return false;
      return ctx.type==='axes'||ctx.objects.some(o=>o&&(!this.app.runtime||this.app.capabilities(o.id).selectCanvas||this.app.capabilities(o.id).selectList));
    }
    sync(){
      if(!this.trigger)return;
      const ctx=this.context(),valid=this.allowedContext(ctx);
      const id=valid?ctx.type+':'+ctx.id:'';
      if(id!==this.identity){this.identity=id;this.close();this.anchor=null;}
      this.trigger.hidden=!valid||this.opened;
      if(!valid)return;
      if(!this.anchor)this.anchor=this.defaultAnchor();
      this.positionTrigger();
      if(this.opened){
        if(ctx.type!==this.menuType)this.renderWheel();
        const input=this.wheel.querySelector('.radial-center-input');
        if(input&&this.doc.activeElement!==input)input.value=ctx.name;
        const cap=this.wheel.querySelector('.radial-center-caption');
        if(cap)cap.textContent=CENTER_CAPTIONS[ctx.type]||'OBJECT';
      }
      if(this.detailMode){
        this.applyFilter(this.detailMode);
        // Reuse the inspector's existing small action toolbar.
      }
    }
    defaultAnchor(){
      const rect=this.app.nodes.canvasWrap.getBoundingClientRect();
      return {x:rect.left+Math.min(rect.width-28,Math.max(28,rect.width*.65)),y:rect.top+Math.min(rect.height-36,Math.max(36,rect.height*.34))};
    }
    relative(p){const r=this.area.getBoundingClientRect();return {x:clamp(p.x-r.left,18,Math.max(18,r.width-18)),y:clamp(p.y-r.top,18,Math.max(18,r.height-18))};}
    positionTrigger(){
      if(this.trigger.hidden)return;
      const {x,y}=this.relative(this.anchor||this.defaultAnchor());
      this.trigger.style.left=clamp(x+17,12,Math.max(12,this.area.clientWidth-42))+'px';
      this.trigger.style.top=clamp(y-39,64,Math.max(64,this.area.clientHeight-46))+'px';
      this.trigger.setAttribute('aria-label','Eigenschappen van '+(this.context()?.name||'selectie')+' openen');
    }
    renderWheel(){
      const ctx=this.context()||{type:'object',name:''};
      const items=(CONTENT[ctx.type]||CONTENT.object).map(item=>item.slice());
      if(ctx.type==='object'&&['point','polygon'].includes(ctx.objects?.[0]?.type)){
        const i=items.findIndex(item=>item[0]==='measurement');
        if(i>=0)items[i]=['labels','Labels','T'];
      }
      this.menuType=ctx.type;
      this.wheel.replaceChildren();
      // Cream ivory background, discrete spokes and golden outside circle.
      // SVG geometry is a scalable decorative layer; real HTML buttons own input.
      const backdrop=this.doc.createElementNS(SVG_NS,'svg');
      backdrop.setAttribute('viewBox','0 0 460 460');
      backdrop.setAttribute('class','radial-disc');
      backdrop.setAttribute('aria-hidden','true');
      backdrop.innerHTML='<defs><radialGradient id="fziRadialIvory"><stop offset="0%" stop-color="#fffdf6"/><stop offset="100%" stop-color="#ece7d8"/></radialGradient></defs>'
        +'<circle cx="230" cy="230" r="209" fill="url(#fziRadialIvory)" stroke="#e8c35f" stroke-width="3.5"/>';
      for(let i=0;i<6;i++){
        const angle=(-120+i*60)*Math.PI/180;
        const x1=230+Math.cos(angle)*90,y1=230+Math.sin(angle)*90;
        const x2=230+Math.cos(angle)*207,y2=230+Math.sin(angle)*207;
        const line=this.doc.createElementNS(SVG_NS,'line');
        for(const [key,value] of Object.entries({x1,y1,x2,y2,stroke:'#aeb0ac','stroke-width':1.2,'stroke-opacity':.8}))line.setAttribute(key,String(value));
        backdrop.append(line);
      }
      this.wheel.append(backdrop);
      items.forEach(([action,label],i)=>{
        const node=this.doc.createElement('button');
        node.type='button';node.className='radial-segment';
        node.dataset.radialAction=action;node.title=label;
        node.setAttribute('aria-label',label);
        node.setAttribute('aria-pressed',String(this.detailMode===action));
        node.style.setProperty('--radial-angle',(360*i/items.length)+'deg');
        if(i===0)node.classList.add('radial-segment-primary');

        const frame=this.doc.createElementNS(SVG_NS,'svg');
        frame.setAttribute('viewBox','0 0 210 140');
        frame.setAttribute('class','radial-segment-skin');
        frame.setAttribute('aria-hidden','true');
        const shape=this.doc.createElementNS(SVG_NS,'path');
        shape.setAttribute('d',SEGMENT_SHAPE);shape.setAttribute('class','radial-segment-silhouette');
        frame.append(shape);
        // Counter-rotation keeps the icon and text upright while the sculpted
        // segment itself rotates around the hub.
        const face=text('span','radial-segment-content','',this.doc);
        const graphic=text('span','radial-segment-icon','',this.doc);
        const svg=this.doc.createElementNS(SVG_NS,'svg');
        svg.setAttribute('viewBox','0 0 24 24');
        svg.setAttribute('aria-hidden','true');
        svg.innerHTML=SEGMENT_ICONS[action]||SEGMENT_ICONS.geometry;
        graphic.append(svg);
        face.append(graphic,text('span','radial-segment-text',label,this.doc));
        node.append(frame,face);this.wheel.append(node);
      });
      const hub=text('div','radial-center','',this.doc);
      const label=text('span','radial-center-caption',CENTER_CAPTIONS[ctx.type]||'OBJECT',this.doc);
      const input=this.doc.createElement('input');
      input.type='text';input.className='radial-center-input';input.value=ctx.name;
      input.setAttribute('aria-label','Naam geselecteerd object');input.maxLength=200;
      const editable=ctx.type==='group'
        ?!this.app.runtime&&this.app.allowed('group.rename',{id:ctx.id,name:ctx.name})
        :ctx.type!=='axes'&&ctx.type!=='multiple'&&ctx.objects?.length===1&&!ctx.objects[0].locked&&this.app.allowed('object.setProperties',{ids:[ctx.objects[0].id],fields:[{path:'name',value:ctx.objects[0].name}]});
      input.readOnly=!editable;
      if(!editable)input.title=ctx.type==='axes'?'Assenstelsel':'Niet wijzigbaar';
      const grip=this.doc.createElement('button');
      grip.type='button';grip.className='radial-drag-handle';grip.dataset.radialDrag='';
      grip.title='Sleep om het radiaalmenu te verplaatsen';
      grip.setAttribute('aria-label','Radiaalmenu verplaatsen');
      const dots=text('span','radial-grip-dots','',this.doc);
      dots.setAttribute('aria-hidden','true');
      for(let i=0;i<6;i++)dots.append(text('i','radial-grip-dot','',this.doc));
      grip.append(dots);
      hub.append(grip,label,input);this.wheel.append(hub);
    }
    openAt(anchor,focus=false){
      const ctx=this.context();if(!this.allowedContext(ctx))return;
      this.anchor=anchor||this.anchor||this.defaultAnchor();
      this.opened=true;this.renderWheel();this.wheel.hidden=false;this.trigger.hidden=true;
      this.place();
      if(focus)this.wheel.querySelector('.radial-segment')?.focus?.({preventScroll:true});
    }
    openForAxes(){
      this.anchor=this.defaultAnchor();
      this.openAt(this.anchor,false);
    }
    place(){
      const area=this.area.getBoundingClientRect(),p=this.relative(this.anchor||this.defaultAnchor());
      // A viewport-scaled 460px design keeps its proportions in the editor.
      // Clamp to available room without rewriting the user's chosen anchor.
      const scale=Math.min(1,Math.max(.48,Math.min((area.width-12)/460,(area.height-76)/460)));
      this.wheel.style.setProperty('--radial-scale',String(scale));
      const radius=230*scale;
      const x=clamp(p.x,Math.min(radius+8,area.width/2),Math.max(area.width/2,area.width-radius-8));
      const y=clamp(p.y,Math.min(radius+8,area.height/2),Math.max(area.height/2,area.height-radius-8));
      this.wheel.style.left=x+'px';this.wheel.style.top=y+'px';
      const width=Math.min(365,Math.max(270,area.width-18));
      const margin=radius+14;
      const left=(x+margin+width<=area.width-8)?x+margin:
        (x-margin-width>=8?x-margin-width:clamp(x-width/2,8,Math.max(8,area.width-width-8)));
      this.detail.style.left=left+'px';
      this.detail.style.top=clamp(y-108,70,Math.max(70,area.height-245))+'px';
      this.detail.style.width=width+'px';
      this.positionTrigger();
    }
    choose(action){
      const ctx=this.context();if(!ctx)return;
      if(action==='editText'){
        if(ctx.objects?.length===1&&!ctx.objects[0].locked&&!ctx.objects[0].construction&&!ctx.objects[0].textBinding){this.close();this.app.openRichText(ctx.objects[0].id);}
        else this.showDetail('relations');
        return;
      }
      if(action==='group'){if(ctx.objects?.length>=2){this.close();this.app.groupSelection();}return;}
      if(action==='ungroup'){this.close();this.app.ungroupSelection();return;}
      if(action==='appearance'&&ctx.type==='text'){
        if(ctx.objects?.length===1&&!ctx.objects[0].locked&&!ctx.objects[0].construction&&!ctx.objects[0].textBinding){this.close();this.app.openRichText(ctx.objects[0].id);}
        else this.showDetail('relations');
        return;
      }
      if(action==='actions'){this.showDetail(ctx.type==='axes'?'all':'actions');return;}
      this.showDetail(action);
    }
    showDetail(filter){
      this.detailMode=filter;this.detail.hidden=false;this.detail.dataset.radialFilter=filter;
      for(const button of this.wheel.querySelectorAll('[data-radial-action]'))
        button.setAttribute('aria-pressed',String(button.dataset.radialAction===filter));
      this.applyFilter(filter);this.place();
      this.detail.querySelector('.radial-detail-title').textContent=filter==='all'?'Alle eigenschappen':({
        appearance:'Uiterlijk',geometry:'Geometrie',measurement:'Metingen',labels:'Labels',
        relations:'Relaties',organization:'Organisatie',axes:'Assen',grid:'Raster',units:'Schaal en eenheden',
        angleUnits:'Hoekeenheid',actions:'Acties'
      }[filter]||'Eigenschappen');
      // The existing compact object-action toolbar is the sole action surface.
    }
    applyFilter(filter){
      if(!this.panel||this.detail.hidden)return;
      const axesRoot=this.panel.querySelector('.axis-settings');
      if(axesRoot&&this.app.inspectorTarget==='axes'){
        axesRoot.hidden=false;
        for(const el of axesRoot.children){
          const section=el.dataset.propertySection;
          if(filter==='all'){el.hidden=false;continue;}
          if(filter==='axes')el.hidden=!!section&&section!=='axes';
          else if(filter==='grid')el.hidden=section!=='axes'&&section!=='grid';
          else if(filter==='units')el.hidden=section!=='units';
          else if(filter==='angleUnits')el.hidden=section!=='angle-units';
          else el.hidden=false;
        }
        return;
      }
      const sectionNames=SECTIONS[filter];
      for(const el of this.panel.children){
        if(el.classList.contains('object-heading')){
          el.hidden=!['all','actions','organization','labels'].includes(filter);
          continue;
        }
        if(filter==='all'){el.hidden=false;continue;}
        const section=el.dataset.propertySection;
        if(filter==='appearance'&&el.classList.contains('object-style')){el.hidden=false;continue;}
        el.hidden=!(sectionNames&&sectionNames.includes(section));
      }
    }
    rename(name){
      const ctx=this.context();if(!ctx)return;
      const value=name.trim();
      if(!value||value===ctx.name)return;
      try{
        if(ctx.type==='group'){
          if(!this.app.allowed('group.rename',{id:ctx.id,name:value}))return;
          this.app.changeDocument(()=>this.app.execute('group.rename',{id:ctx.id,name:value}));
        }else{
          if(ctx.objects?.length!==1)return;
          const obj=ctx.objects[0];
          if(!this.app.allowed('object.setProperties',{ids:[obj.id],fields:[{path:'name',value}]}))return;
          this.app.changeDocument(()=>this.app.execute('object.setProperties',{ids:[obj.id],fields:[{path:'name',value}]}));
        }
        this.sync();
      }catch(error){this.app.status(error.message);this.app.invalidate();}
    }
    closeDetail(){
      this.detailMode=null;this.detail.hidden=true;
    }
    close(){
      this.drag=null;this.wheel.classList.remove('radial-is-dragging');
      this.opened=false;this.wheel.hidden=true;this.closeDetail();
      this.trigger.hidden=!this.allowedContext(this.context());
      if(!this.trigger.hidden)this.positionTrigger();
    }
    dispose(){
      this.close();
      this.bound.splice(0).forEach(fn=>fn());
      this.trigger.hidden=true;
    }
  }
  MI.RadialProperties=RadialProperties;
})(window);
