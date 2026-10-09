const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {runtime,root}=require('./helpers.cjs');
test('M1.1 selection presentation is an explicit overlay service without event handlers',()=>{
  const {MI,context}=runtime();vm.runInContext(fs.readFileSync(path.join(root,'editor-enhancements.js'),'utf8'),context);assert.equal(typeof MI.EditorOverlays.selection,'function');
  const source=fs.readFileSync(path.join(root,'editor-enhancements.js'),'utf8');assert.doesNotMatch(source,/addEventListener|innerHTML|prototype\./);assert.match(source,/pointer-events/);assert.match(source,/non-scaling-stroke/);assert.match(source,/data-selection-presentation/);
});
test('M1.1 presentation never modifies renderer export or persistent styles',()=>{
  const {MI,context}=runtime();const e=new MI.Engine({objects:[{id:'p',type:'point',x:0,y:0,style:{stroke:'#aabbcc',opacity:.3}}]}),before=e.toJSONString(),svg=e.renderSVG();
  vm.runInContext(fs.readFileSync(path.join(root,'editor-enhancements.js'),'utf8'),context);MI.EditorOverlays.selection(null,{selectedIds:['p'],hoverId:'p'});assert.equal(e.toJSONString(),before);assert.equal(e.renderSVG(),svg);assert.doesNotMatch(svg,/selection-presentation|hover-highlight|selection-frame/);
});
