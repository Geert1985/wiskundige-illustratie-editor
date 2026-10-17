/* Ordered presentation containers. Geometry and dependency resolution stay separate. */
(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration,cache=new WeakMap();
  function index(layers){let result=cache.get(layers);if(!result){const byId=new Map(),owner=new Map();for(const l of layers){byId.set(l.id,l);for(const id of l.members)owner.set(id,l);}result={byId,owner};cache.set(layers,result);}return result;}
  function visible(layers,id){return index(layers).owner.get(id)?.visible!==false;}
  function ordered(objects,layers){if(!layers.length)return objects.slice();const byId=new Map(objects.map(o=>[o.id,o]));return layers.flatMap(l=>l.members.map(id=>byId.get(id)).filter(Boolean));}
  function validate(layers,objects,groups=[]){
    if(!Array.isArray(layers)||!layers.length)throw Error('Minstens een laag vereist.');
    const objectIds=new Set(objects.map(o=>o.id)),ids=new Set([...objectIds,...groups.map(g=>g.id)]),owner=new Map();
    for(const l of layers){if(!l||typeof l!=='object'||Array.isArray(l)||Object.keys(l).some(k=>!['id','name','visible','members'].includes(k))||typeof l.id!=='string'||!l.id.trim()||ids.has(l.id)||typeof l.name!=='string'||!l.name.trim()||l.name.length>200||typeof l.visible!=='boolean'||!Array.isArray(l.members))throw Error('Ongeldige laag.');ids.add(l.id);for(const id of l.members){if(typeof id!=='string'||!objectIds.has(id)||owner.has(id))throw Error('Ongeldige of dubbele laagreferentie.');owner.set(id,l.id);}}
    if(owner.size!==objectIds.size)throw Error('Elk object moet op precies een laag staan.');
    for(const g of groups){const leaves=MI.PersistentGroups.members(groups,g.id);if(new Set(leaves.map(id=>owner.get(id))).size!==1)throw Error('Een groep moet op dezelfde laag staan.');}
    return layers.map(l=>({id:l.id,name:l.name,visible:l.visible,members:l.members.slice()}));
  }
  function automaticTextLayer(layers,meta){
    if(!Object.prototype.hasOwnProperty.call(meta,'automaticTextLayerId'))return null;
    const id=meta.automaticTextLayerId;
    if(typeof id!=='string'||!id.trim()||!layers.some(l=>l.id===id))throw Error('Ongeldige automatische tekstlaagreferentie.');
    return layers.find(l=>l.id===id);
  }
  // Pure creation plan: callers validate and commit objects, layers and metadata together.
  // Explicit copy placement preserves the original layer, including legacy unlayered groups.
  function creationPlan(type,layers,meta,objects,allocate,options={}){
    const automatic=automaticTextLayer(layers,meta);
    if(options.preserveLayer){
      const target=options.layerId?layers.find(l=>l.id===options.layerId):null;
      if(layers.length&&!target)throw Error('Ongeldige doellaag voor kopie.');
      if(type==='text'&&target&&!target.visible)throw Error('De doellaag voor tekst is verborgen. Maak deze eerst zichtbaar.');
      return {layers,targetId:target?.id,meta};
    }
    if(type==='text'){
      if(automatic){if(!automatic.visible)throw Error('De tekstlaag is verborgen. Maak deze eerst zichtbaar.');return {layers,targetId:automatic.id,meta};}
      const base=layers.length?layers:[{id:allocate(),name:'Basislaag',visible:true,members:objects.map(o=>o.id)}];
      const layer={id:allocate(),name:'Tekst',visible:true,members:[]};
      return {layers:[...base,layer],targetId:layer.id,meta:{...meta,automaticTextLayerId:layer.id}};
    }
    if(!layers.length)return {layers,meta};
    const target=layers.slice().reverse().find(l=>l.visible&&l.id!==automatic?.id);
    if(!target)throw Error('Maak eerst een gewone tekenlaag zichtbaar.');
    return {layers,targetId:target.id,meta};
  }
  MI.DocumentLayers=Object.freeze({index,visible,ordered,validate,automaticTextLayer,creationPlan});
})(window);
