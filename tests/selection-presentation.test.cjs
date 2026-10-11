const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {runtime,root}=require('./helpers.cjs');
test('M1.1 selection presentation is an explicit overlay service without event handlers',()=>{
  const {MI,context}=runtime();vm.runInContext(fs.readFileSync(path.join(root,'editor-enhancements.js'),'utf8'),context);assert.equal(typeof MI.EditorOverlays.selection,'function');
  const source=fs.readFileSync(path.join(root,'editor-enhancements.js'),'utf8');assert.doesNotMatch(source,/addEventListener|innerHTML|prototype\.|style\.cursor/);assert.match(source,/pointer-events/);assert.match(source,/non-scaling-stroke/);assert.match(source,/data-selection-presentation/);
});
test('snap feedback stays injectable when presentation overlays share one module',()=>{
  const {MI,context}=runtime();vm.runInContext(fs.readFileSync(path.join(root,'editor-enhancements.js'),'utf8'),context);
  const svg={children:[],appendChild(node){this.children.push(node);}},nodes=[];
  const document={createElementNS(_ns,name){const attrs={};const node={name,attrs,children:[],setAttribute(key,value){attrs[key]=String(value);},appendChild(child){this.children.push(child);}};nodes.push(node);return node;}};
  const renderer={showSnapPoints:true,mapX:x=>x+10,mapY:y=>y-5};
  assert.equal(typeof MI.SnapFeedback.render,'function');
  MI.SnapFeedback.render(svg,renderer,{snapped:true,point:{x:2,y:3}},document);
  assert.equal(svg.children.length,1);assert.equal(svg.children[0].attrs.class,'fzi-snap-indicator');assert.equal(svg.children[0].attrs['pointer-events'],'none');
  assert.equal(svg.children[0].children[0].attrs.cx,'12');assert.equal(svg.children[0].children[0].attrs.cy,'-2');
  MI.SnapFeedback.render(svg,renderer,{snapped:false,point:{x:0,y:0}},document);assert.equal(svg.children.length,1);
  renderer.showSnapPoints=false;MI.SnapFeedback.render(svg,renderer,{snapped:true,point:{x:0,y:0}},document);assert.equal(svg.children.length,1);
});
test('M1.1 presentation never modifies renderer export or persistent styles',()=>{
  const {MI,context}=runtime();const e=new MI.Engine({objects:[{id:'p',type:'point',x:0,y:0,style:{stroke:'#aabbcc',opacity:.3}}]}),before=e.toJSONString(),svg=e.renderSVG();
  vm.runInContext(fs.readFileSync(path.join(root,'editor-enhancements.js'),'utf8'),context);MI.EditorOverlays.selection(null,{selectedIds:['p'],hoverId:'p'});assert.equal(e.toJSONString(),before);assert.equal(e.renderSVG(),svg);assert.doesNotMatch(svg,/selection-presentation|hover-highlight|selection-frame/);
});
