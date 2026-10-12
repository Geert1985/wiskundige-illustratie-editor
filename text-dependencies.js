// Ephemeral reverse index over immutable object snapshots; never serialized values.
(function(global){
  'use strict';const MI=global.FZI.MathIllustration,cache=new WeakMap();
  function forSource(objects,id){
    if(!cache.has(objects)){const index=new Map();for(const object of objects){for(const run of MI.TextValues.runs(object.textContent)){const list=index.get(run.binding.sourceId)||[];list.push(Object.freeze({objectId:object.id,fragmentId:run.id}));index.set(run.binding.sourceId,list);}if(object.textBinding){const list=index.get(object.textBinding.sourceId)||[];list.push(Object.freeze({objectId:object.id,fragmentId:null}));index.set(object.textBinding.sourceId,list);}}cache.set(objects,index);}
    return Object.freeze((cache.get(objects).get(id)||[]).slice());
  }
  MI.TextDependencies=Object.freeze({forSource});
})(window);
