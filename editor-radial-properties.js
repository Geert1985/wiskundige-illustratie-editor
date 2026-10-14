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
    appearance:['appearance'],
    measurement:['labels','angle-measurement','region'],
    relations:['relations','dynamic-text'],
    labels:['labels','point-projections'],
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
      this.bound=[];this.anchor=null;this.identity='';this.opened=false;this.detailMode=null;
      this.menuType='';
      this.renderWheel();
      this.listen(this.trigger,'click',e=>{e.preventDefault();this.openAt(this.anchor,true);});
      this.listen(this.closeBtn,'click',e=>{e.stopPropagation();this.closeDetail();this.wheel.querySelector('.radial-center-input')?.focus();});
      this.listen(this.wheel,'click',e=>{const button=e.target.closest('[data-radial-action]');if(button&&!button.disabled)this.choose(button.dataset.radialAction);});
      this.listen(this.wheel,'change',e=>{if(e.target.matches('.radial-center-input'))this.rename(e.target.value);});
      this.listen(this.wheel,'keydown',e=>{if(e.target.matches('.radial-center-input')&&e.key==='Enter'){e.preventDefault();this.rename(e.target.value);e.target.blur();}});
      this.listen(this.doc,'keydown',e=>{
        if(e.key!=='Escape'||this.doc.querySelector('dialog[open]'))return;
        if(!this.opened&&!this.detailMode)return;
        e.preventDefault();e.stopPropagation();this.close();
        this.trigger.focus?.({preventScroll:true});
      },true);
      this.listen(this.doc,'pointerdown',e=>{
        if(!this.opened&&!this.detailMode)return;
        if(e.target.closest('#radialPropertiesWheel,#propertiesSidebar,#radialPropertiesTrigger'))return;
        this.close();
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
        if(e.button!==0||this.app.tool!=='select'||!this.app.nodes.canvasWrap.contains(e.target))return;
        if(!this.app.selectedIds.length)return;
        this.anchor={x:e.clientX,y:e.clientY};
        this.positionTrigger();
      });
      this.listen(this.win,'resize',()=>{if(this.opened||this.detailMode)this.place();else this.positionTrigger();});
      this.listen(this.area,'click',e=>{const b=e.target.closest('[data-radial-quick]');if(b)this.quick(b.dataset.radialQuick);});
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
      if(!ctx||this.doc.querySelector('dialog[open]'))return false;
      if(this.app.tool!=='select'&&ctx.type!=='axes')return false;
      return ctx.type==='axes'||ctx.objects.some(o=>o&&(!this.app.runtime||this.app.capabilities(o.id).selectCanvas||this.app.capabilities(o.id).selectList));
    }
    sync(){
      if(!this.trigger)return;
      const ctx=this.context(),valid=this.allowedContext(ctx);
      const id=valid?ctx.type+':'+ctx.id:'';
      if(id!==this.identity){this.identity=id;this.close();this.anchor=null;}
      this.trigger.hidden=!valid;
      if(!valid)return;
      if(!this.anchor)this.anchor=this.defaultAnchor();
      this.positionTrigger();
      if(this.opened){
        if(ctx.type!==this.menuType)this.renderWheel();
        const input=this.wheel.querySelector('.radial-center-input');
        if(input&&this.doc.activeElement!==input)input.value=ctx.name;
        const cap=this.wheel.querySelector('.radial-center-caption');
        if(cap)cap.textContent=ctx.type==='axes'?'Document':ctx.type==='multiple'? 'Selectie':ctx.type==='group'?'Groep':ctx.type==='linked'?'Constructie':ctx.type==='text'?'Tekst':'Object';
      }
      if(this.detailMode)this.applyFilter(this.detailMode);
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
      const ctx=this.context()||{type:'object',name:''},items=CONTENT[ctx.type]||CONTENT.object;
      this.menuType=ctx.type;
      this.wheel.replaceChildren();
      const circle=text('div','radial-disc','',this.doc);circle.setAttribute('aria-hidden','true');this.wheel.append(circle);
      items.forEach(([action,label,symbol],i)=>{
        const node=this.doc.createElement('button');node.type='button';node.className='radial-segment';node.dataset.radialAction=action;
        const angle=(-Math.PI/2)+i*2*Math.PI/items.length;
        node.style.setProperty('--radial-x',Math.round(Math.cos(angle)*112)+'px');
        node.style.setProperty('--radial-y',Math.round(Math.sin(angle)*112)+'px');
        const ico=text('span','radial-segment-icon',symbol,this.doc);
        const caption=text('span','radial-segment-text',label,this.doc);
        node.append(ico,caption);node.title=label;
        this.wheel.append(node);
      });
      const hub=text('div','radial-center','',this.doc);
      const label=text('span','radial-center-caption',ctx.type==='axes'?'Document':ctx.type==='multiple'?'Selectie':ctx.type==='group'?'Groep':'Object',this.doc);
      const input=this.doc.createElement('input');input.type='text';input.className='radial-center-input';input.value=ctx.name;
      input.setAttribute('aria-label','Naam geselecteerd object');input.maxLength=200;
      const editable=ctx.type!=='axes'&&ctx.type!=='multiple'&&ctx.type!=='group'&&ctx.objects?.length===1&&!ctx.objects[0].locked&&this.app.allowed('object.setProperties',{ids:[ctx.objects[0].id],fields:[{path:'name',value:ctx.objects[0].name}]});
      input.readOnly=!editable;
      if(!editable){input.title=ctx.type==='group'?'Groepsnaam wijzigen is nog niet beschikbaar':ctx.type==='axes'?'Assenstelsel':'Niet wijzigbaar';}
      hub.append(label,input);this.wheel.append(hub);
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
      const offset=Math.max(0,Math.min(142,(Math.min(area.width,area.height)-320)/2));
      const x=clamp(p.x,155,Math.max(155,area.width-155));
      const y=clamp(p.y,155,Math.max(155,area.height-155));
      this.wheel.style.left=x+'px';this.wheel.style.top=y+'px';
      const width=Math.min(360,Math.max(270,area.width-18));
      const left=(x+168+width<=area.width-8)?x+168:(x-168-width>=8?x-168-width:clamp(x-width/2,8,Math.max(8,area.width-width-8)));
      this.detail.style.left=left+'px';
      this.detail.style.top=clamp(y-110,72,Math.max(72,area.height-235))+'px';
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
      if(action==='actions'){this.showDetail('actions');return;}
      this.showDetail(action);
    }
    showDetail(filter){
      this.detailMode=filter;this.detail.hidden=false;this.detail.dataset.radialFilter=filter;
      this.applyFilter(filter);this.place();
      this.detail.querySelector('.radial-detail-title').textContent=filter==='all'?'Alle eigenschappen':({
        appearance:'Uiterlijk',geometry:'Geometrie',measurement:'Metingen',labels:'Labels',
        relations:'Relaties',organization:'Organisatie',axes:'Assen',grid:'Raster',units:'Schaal en eenheden',
        angleUnits:'Hoekeenheid',actions:'Acties'
      }[filter]||'Eigenschappen');
      if(filter==='actions')this.renderQuickActions();
    }
    applyFilter(filter){
      if(!this.panel||this.detail.hidden)return;
      const sectionNames=SECTIONS[filter];
      for(const el of this.panel.children){
        if(el.classList.contains('object-heading')){el.hidden=filter!=='all'&&filter!=='actions'&&filter!=='organization';continue;}
        if(filter==='all'){el.hidden=false;continue;}
        const section=el.dataset.propertySection;
        if(filter==='appearance'&&el.classList.contains('object-style')){el.hidden=false;continue;}
        el.hidden=!(sectionNames&&sectionNames.includes(section));
      }
      if(filter==='actions')this.renderQuickActions();
    }
    renderQuickActions(){
      const target=this.detail.querySelector('.radial-quick-actions');
      if(!target)return;
      target.replaceChildren();target.hidden=this.detailMode!=='actions';
      if(target.hidden)return;
      const c=this.context(),objects=this.app.selectedObjects();
      if(!c||c.type==='axes')return;
      const actions=[
        ['labels','Label wisselen',objects.every(o=>!o.locked)],
        ['visibility',objects.every(o=>o.visible!==false)?'Verbergen':'Tonen',true],
        ['lock',objects.every(o=>o.locked)?'Ontgrendelen':'Vergrendelen',!this.app.runtime],
        ['duplicate','Dupliceren',!this.app.runtime],
        ['group','Groeperen',objects.length>1&&!this.app.runtime],
        ['ungroup','Groep opheffen',!!this.app.selectedGroups?.()?.length&&!this.app.runtime],
        ['delete','Verwijderen',!this.app.runtime&&objects.every(o=>!o.locked)]
      ];
      for(const [id,title,enabled] of actions){
        if(!enabled)continue;
        const button=text('button','secondary radial-quick-action',title,this.doc);
        button.type='button';button.dataset.radialQuick=id;
        target.append(button);
      }
    }
    quick(id){
      const app=this.app,objects=app.selectedObjects(),ids=app.selectedIds.slice();
      if(!ids.length||objects.length!==ids.length)return;
      try{
        if(id==='labels')app.setCommonProperty('showLabel',!objects.every(o=>o.showLabel));
        else if(id==='visibility')app.changeDocument(()=>app.execute('object.setVisibility',{ids,value:!objects.every(o=>o.visible!==false)}));
        else if(id==='lock')app.toggleLockSelection();
        else if(id==='duplicate')app.duplicateSelection();
        else if(id==='group')app.groupSelection();
        else if(id==='ungroup')app.ungroupSelection();
        else if(id==='delete')app.deleteSelection();
        this.sync();
      }catch(error){app.status(error.message);app.invalidate();}
    }
    rename(name){
      const ctx=this.context();if(!ctx||!ctx.objects||ctx.objects.length!==1||ctx.type==='group')return;
      const obj=ctx.objects[0],value=name.trim();
      if(!value||value===obj.name)return;
      try{
        if(!this.app.allowed('object.setProperties',{ids:[obj.id],fields:[{path:'name',value}]}))return;
        this.app.changeDocument(()=>this.app.execute('object.setProperties',{ids:[obj.id],fields:[{path:'name',value}]}));
        this.sync();
      }catch(error){this.app.status(error.message);this.app.invalidate();}
    }
    closeDetail(){
      this.detailMode=null;this.detail.hidden=true;
      this.detail.querySelector('.radial-quick-actions')?.replaceChildren();
    }
    close(){
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
