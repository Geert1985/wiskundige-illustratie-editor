const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function setup({selectedIds=['a','b'],groups=[],runtime=false}={}){
  const objectIds=['a','b','c','d'],objects=objectIds.map(id=>({id,type:'point',name:id}));
  const model={objects,groups,layers:[
    {id:'base',name:'Basislaag',visible:true,members:['a','b','c']},
    {id:'top',name:'Bovenlaag',visible:true,members:['d']}
  ]};
  const handlers=new Map(),operations=[],messages=[],rows=new Map(),layers=new Map();
  const classList=()=>{
    const classes=new Set();
    return {add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)};
  };
  for(const id of objectIds){
    const row={dataset:{dragObject:id},classList:classList()};
    row.closest=selector=>selector==='[data-drag-object]'?row:null;
    rows.set(id,row);
  }
  for(const id of ['base','top']){
    const target={dataset:{layerRow:id},classList:classList()};
    target.closest=selector=>selector==='[data-layer-row]'?target:null;
    layers.set(id,target);
  }
  const list={
    addEventListener:(name,handler)=>handlers.set(name,handler),
    querySelectorAll:selector=>selector==='[data-drag-object]'?[...rows.values()]:
      selector==='.object-dragging'?[...rows.values()].filter(row=>row.classList.contains('object-dragging')):[]
  };
  const dom=new Map([['viewList',list]]);
  for(const id of ['sidebarToolsTab','sidebarLayersTab','sidebarToolsPanel','sidebarLayersPanel'])
    dom.set(id,{hidden:false,tabIndex:0,setAttribute(){},addEventListener(){},focus(){}});
  const app={
    runtime,selectedIds:selectedIds.slice(),
    engine:{model,get:id=>model.objects.find(item=>item.id===id)},
    changeDocument:mutate=>mutate(),
    execute:(op,payload)=>{
      operations.push({op,payload});
      if(op!=='layer.assign')throw Error('unexpected operation');
      const ids=new Set(payload.ids);
      for(const layer of model.layers){
        layer.members=layer.members.filter(id=>!ids.has(id));
      }
      const target=model.layers.find(layer=>layer.id===payload.layerId);
      target.members.push(...payload.ids);
    },
    status:message=>messages.push(message),invalidate(){}
  };
  const context={document:{getElementById:id=>dom.get(id)},FZI:{MathIllustration:{editor:app}}};
  context.window=context;
  vm.createContext(context);
  const root=path.resolve(__dirname,'..');
  for(const script of ['persistent-groups.js','document-layers.js','editor-sidebar-tabs.js'])
    vm.runInContext(fs.readFileSync(path.join(root,script),'utf8'),context,{filename:script});
  const drag=(objectId,layerId)=>{
    const transfer={effectAllowed:'none',dropEffect:'none',setData(type,value){this.type=type;this.value=value;}};
    const state={prevented:false};
    handlers.get('dragstart')({target:rows.get(objectId),dataTransfer:transfer,
      preventDefault(){state.prevented=true;}});
    if(state.prevented)return state;
    const target=layers.get(layerId);
    handlers.get('dragover')({target,dataTransfer:transfer,preventDefault(){}});
    handlers.get('drop')({target,dataTransfer:transfer,preventDefault(){}});
    handlers.get('dragend')({});
    return state;
  };
  return {app,model,operations,messages,rows,layers,handlers,drag};
}

test('multi-selection drag assigns all selected objects atomically and preserves selection',()=>{
  const s=setup();
  s.drag('b','top');
  assert.equal(s.operations.length,1);
  assert.equal(s.operations[0].op,'layer.assign');
  assert.deepEqual(Array.from(s.operations[0].payload.ids),['a','b']);
  assert.deepEqual(s.model.layers[0].members,['c']);
  assert.deepEqual(s.model.layers[1].members,['d','a','b']);
  assert.deepEqual(s.app.selectedIds,['a','b']);
  assert.match(s.messages[0],/2 objecten verplaatst naar Bovenlaag/);
  assert.equal([...s.rows.values()].filter(row=>row.classList.contains('object-dragging')).length,0);
});

test('dragging an unselected object does not move the previous selection',()=>{
  const s=setup();
  s.drag('d','base');
  assert.deepEqual(Array.from(s.operations[0].payload.ids),['d']);
  assert.deepEqual(s.model.layers[0].members,['a','b','c','d']);
  assert.deepEqual(s.app.selectedIds,['a','b']);
});

test('selected partial group expands to all leaves without touching unrelated objects',()=>{
  const s=setup({selectedIds:['a','c'],groups:[{id:'group-1',name:'Groep',members:['a','b']}]});
  s.drag('a','top');
  assert.deepEqual(Array.from(s.operations[0].payload.ids),['a','b','c']);
  assert.deepEqual(s.model.layers[0].members,[]);
  assert.deepEqual(s.model.layers[1].members,['d','a','b','c']);
});

test('a multi-selection from different layers moves into one destination layer',()=>{
  const s=setup({selectedIds:['a','d']});
  s.drag('a','top');
  assert.equal(s.operations.length,1);
  assert.deepEqual(Array.from(s.operations[0].payload.ids),['a','d']);
  assert.deepEqual(s.model.layers[0].members,['b','c']);
  assert.deepEqual(s.model.layers[1].members,['a','d']);
  assert.deepEqual(s.app.selectedIds,['a','d']);
});

test('dropping a selection onto its current layer is a no-op',()=>{
  const s=setup();
  s.drag('b','base');
  assert.equal(s.operations.length,0);
  assert.equal(s.messages.length,0);
  assert.equal([...s.rows.values()].filter(row=>row.classList.contains('object-dragging')).length,0);
});

test('restricted editor prevents sidebar drag mutations',()=>{
  const s=setup({runtime:true});
  assert.equal(s.drag('a','top').prevented,true);
  assert.equal(s.operations.length,0);
});
