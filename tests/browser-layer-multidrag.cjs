// UI-LAYERS: native DragEvent integration against the full editor runtime.
const assert=require('node:assert/strict');

module.exports=async page=>{
  const prepared=await page.evaluate(()=>{
    const app=FZI.MathIllustration.editor;
    app.loadDocument({objects:[
      {id:'a',type:'point',name:'A',x:-1,y:0},
      {id:'b',type:'point',name:'B',x:0,y:0},
      {id:'c',type:'point',name:'C',x:1,y:0}
    ]});
    app.addLayer('Doellaag');
    app.selectObject('a');
    app.selectObject('b',true);
    return {base:app.engine.model.layers[0].id,target:app.engine.model.layers[1].id,
      objects:JSON.stringify(app.engine.toJSON().objects)};
  });
  await page.locator('#sidebarLayersTab').click();
  const drag=async(id,layerId)=>page.evaluate(({id,layerId})=>{
    const row=document.querySelector('[data-drag-object="'+id+'"]');
    const target=document.querySelector('[data-layer-row="'+layerId+'"]');
    if(!row||!target)throw Error('Drag source or layer target missing');
    const dataTransfer=new DataTransfer();
    for(const type of ['dragstart','dragover','drop']){
      const element=type==='dragstart'?row:target;
      element.dispatchEvent(new DragEvent(type,{
        bubbles:true,cancelable:true,dataTransfer
      }));
    }
    row.dispatchEvent(new DragEvent('dragend',{bubbles:true,dataTransfer}));
  },{id,layerId});
  const state=()=>page.evaluate(()=>{
    const app=FZI.MathIllustration.editor;
    return {layers:app.engine.model.layers.map(l=>({id:l.id,members:[...l.members]})),
      selected:[...app.selectedIds],objects:JSON.stringify(app.engine.toJSON().objects),
      staleDragClasses:document.querySelectorAll('.object-dragging').length};
  });
  await drag('b',prepared.target);
  const moved=await state();
  assert.deepEqual(moved.layers.find(l=>l.id===prepared.target).members,['a','b']);
  assert.deepEqual(moved.selected,['a','b']);
  assert.equal(moved.objects,prepared.objects,'layer assignment must not edit geometry');
  assert.equal(moved.staleDragClasses,0);
  await drag('a',prepared.target);
  assert.deepEqual(await state(),moved,'same-layer drag must not mutate document');
  await page.locator('#undoBtn').click();
  const undone=await state();
  assert.deepEqual(undone.layers.find(l=>l.id===prepared.base).members,['a','b','c']);
  assert.deepEqual(undone.layers.find(l=>l.id===prepared.target).members,[]);
  assert.deepEqual(undone.selected,['a','b']);
  await drag('c',prepared.target);
  const single=await state();
  assert.deepEqual(single.layers.find(l=>l.id===prepared.target).members,['c']);
  assert.deepEqual(single.selected,['a','b'],'dragging an unselected object keeps selection intact');
  assert.equal(single.objects,prepared.objects);
  return {multiDrag:'passed',singleDrag:'passed',sameLayerNoop:'passed',
    undoAtomic:'passed',selectionPreserved:'passed',geometryPreserved:'passed'};
};
