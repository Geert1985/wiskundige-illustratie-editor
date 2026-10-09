/* Persistent document groups; geometry and paint order remain owned by objects. */
(function(global) {
  'use strict';
  const MI=global.FZI.MathIllustration;
  function validate(groups,objects) {
    if(!Array.isArray(groups))throw Error('Groepen-array vereist.');
    const objectIds=new Set(objects.map(o=>o.id)),map=new Map(),parent=new Map();
    for(const g of groups){
      if(!g||typeof g!=='object'||Array.isArray(g)||Object.keys(g).some(k=>!['id','name','members'].includes(k))||typeof g.id!=='string'||!g.id.trim()||typeof g.name!=='string'||!Array.isArray(g.members)||g.members.length<2||g.members.some(id=>typeof id!=='string'||!id.trim())||new Set(g.members).size!==g.members.length||objectIds.has(g.id)||map.has(g.id))throw Error('Ongeldige groep.');
      map.set(g.id,g);
    }
    for(const g of groups)for(const id of g.members){if((!objectIds.has(id)&&!map.has(id))||parent.has(id))throw Error('Ongeldige of dubbele groepsreferentie.');parent.set(id,g.id);}
    // Iterative traversal: cyclic and excessively deep input never reaches recursion.
    const seen=new Set(),stack=groups.filter(g=>!parent.has(g.id)).map(g=>[g.id,1]);
    while(stack.length){const [id,depth]=stack.pop();if(depth>64||seen.has(id))throw Error('Ongeldige groepshiërarchie.');seen.add(id);for(const child of map.get(id).members)if(map.has(child))stack.push([child,depth+1]);}
    if(seen.size!==map.size)throw Error('Cyclische groepsreferentie.');
    return groups.map(g=>({id:g.id,name:g.name,members:g.members.slice()}));
  }
  function index(groups){const map=new Map(groups.map(g=>[g.id,g])),parent=new Map();for(const g of groups)for(const id of g.members)parent.set(id,g.id);return {map,parent};}
  function members(groups,id){const {map}=index(groups),result=[],stack=[id];while(stack.length){const current=stack.pop(),g=map.get(current);if(g)stack.push(...g.members.slice().reverse());else result.push(current);}return result;}
  function top(groups,id){const {parent}=index(groups);let current=id;while(parent.has(current))current=parent.get(current);return current;}
  function roots(groups,ids){const selected=new Set(ids),result=[];for(const id of ids){const root=top(groups,id);if(result.includes(root))continue;if(!members(groups,root).every(member=>selected.has(member)))throw Error('Selecteer de volledige groep.');result.push(root);}return result;}
  function prune(groups,objectIds,removedGroups=new Set()){
    const {map}=index(groups),resolved=new Map(),stack=groups.map(g=>[g.id,false]);
    while(stack.length){const [id,exit]=stack.pop();if(resolved.has(id))continue;const g=map.get(id);if(!exit){stack.push([id,true]);for(const child of g.members)if(map.has(child)&&!resolved.has(child))stack.push([child,false]);}else{const refs=g.members.flatMap(child=>map.has(child)?resolved.get(child).refs:objectIds.has(child)?[child]:[]);const keep=!removedGroups.has(id)&&refs.length>=2;resolved.set(id,{refs:keep?[id]:refs,group:keep?{...g,members:refs}:null});}}
    return groups.map(g=>resolved.get(g.id).group).filter(Boolean);
  }
  MI.PersistentGroups=Object.freeze({validate,members,top,roots,prune,index});
})(window);
