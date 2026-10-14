/* UI-TABS-1: accessible sidebar tabs and native layer list drag/drop.
 * All document mutations pass through the existing layer.assign command.
 */
(function (global) {
  'use strict';
  const doc=global.document;
  const tools=doc?.getElementById('sidebarToolsTab');
  const layers=doc?.getElementById('sidebarLayersTab');
  const toolsPanel=doc?.getElementById('sidebarToolsPanel');
  const layersPanel=doc?.getElementById('sidebarLayersPanel');
  const list=doc?.getElementById('viewList');
  if (!tools||!layers||!toolsPanel||!layersPanel||!list)return;

  const tabs=[tools,layers];
  function activate(tab,focus=false){
    for(const node of tabs){
      const selected=node===tab;
      node.setAttribute('aria-selected',String(selected));
      node.tabIndex=selected?0:-1;
      (node===tools?toolsPanel:layersPanel).hidden=!selected;
    }
    if(focus)tab.focus();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activate(tab));
    tab.addEventListener('keydown',event=>{
      const direction=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
      if(!direction&&event.key!=='Home'&&event.key!=='End')return;
      event.preventDefault();
      const selected=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+direction+tabs.length)%tabs.length;
      activate(tabs[selected],true);
    });
  });
  activate(tools);

  let dragged=null;
  let highlighted=null;
  const clear=()=>{
    if(highlighted)highlighted.classList.remove('layer-drop-target');
    highlighted=null;
    dragged=null;
  };
  list.addEventListener('dragstart',event=>{
    const row=event.target.closest?.('[data-drag-object]');
    const app=global.FZI?.MathIllustration?.editor;
    if(!row||!app||app.runtime){event.preventDefault();return;}
    const id=row.dataset.dragObject,object=app.engine.get(id);
    if(!object){event.preventDefault();return;}
    dragged={id};
    event.dataTransfer.effectAllowed='move';
    event.dataTransfer.setData('text/plain',id);
    row.classList.add('object-dragging');
  });
  list.addEventListener('dragover',event=>{
    const target=event.target.closest?.('[data-layer-row]');
    if(!dragged||!target)return;
    const app=global.FZI?.MathIllustration?.editor;
    if(!app||app.runtime||!app.engine.model.layers.some(layer=>layer.id===target.dataset.layerRow))return;
    event.preventDefault();
    event.dataTransfer.dropEffect='move';
    if(highlighted!==target){
      if(highlighted)highlighted.classList.remove('layer-drop-target');
      highlighted=target;
      target.classList.add('layer-drop-target');
    }
  });
  list.addEventListener('drop',event=>{
    if(!dragged)return;
    event.preventDefault();
    const target=event.target.closest?.('[data-layer-row]');
    const app=global.FZI?.MathIllustration?.editor;
    const id=dragged.id;
    clear();
    if(!target||!app||app.runtime||!app.engine.get(id))return;
    const layerId=target.dataset.layerRow;
    const model=app.engine.model;
    if(!model.layers.some(layer=>layer.id===layerId))return;
    const groups=model.groups||[];
    const root=global.FZI.MathIllustration.PersistentGroups.top(groups,id);
    const ids=global.FZI.MathIllustration.PersistentGroups.members(groups,root);
    const owner=global.FZI.MathIllustration.DocumentLayers.index(model.layers).owner;
    if(ids.every(objectId=>owner.get(objectId)?.id===layerId))return;
    try{
      app.changeDocument(()=>app.execute('layer.assign',{ids,layerId}));
      app.status((ids.length>1?'Groep':'Object')+' verplaatst naar '+model.layers.find(layer=>layer.id===layerId).name+'.');
    }catch(error){
      app.status('Verplaatsen naar laag mislukt: '+error.message);
      app.invalidate();
    }
  });
  list.addEventListener('dragend',()=>{
    list.querySelectorAll('.object-dragging').forEach(row=>row.classList.remove('object-dragging'));
    clear();
  });
})(window);
