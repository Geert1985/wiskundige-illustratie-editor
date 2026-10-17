const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { runtime, plain, root } = require('./helpers.cjs');

test('standalone renderer respects visibility and origin with either axis independently', () => {
  const { MI } = runtime();
  const e = new MI.Engine({ objects: [{ id: 'hidden', type: 'line', visible: false, showLabel: true, x1: 0, y1: 0, x2: 1, y2: 0 }] });
  assert.doesNotMatch(e.renderSVG(), /data-object-id="hidden"/);
  e.renderer.showXAxis = false;
  assert.match(e.renderSVG(), />0<\/text>/);
  e.renderer.showYAxis = false;
  assert.doesNotMatch(e.renderSVG(), />0<\/text>/);
});
test('loading feature modules never installs render-based engine trackers or drag listeners', () => {
  const { MI, context } = runtime(); const render = MI.Engine.prototype.renderSVG, axes = MI.SvgRenderer.prototype.renderAxes;
  let listeners = 0; context.addEventListener = () => listeners++;
  context.document.addEventListener = () => listeners++;
  for (const file of ['editor-adaptive-grid.js', 'editor-label-drag.js', 'editor-enhancements.js', 'editor-color.js', 'editor-axis-settings.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  assert.equal(MI.Engine.prototype.renderSVG, render); assert.equal(MI.SvgRenderer.prototype.renderAxes, axes);
  assert.equal(listeners, 0);
});

test('standalone engine construction/render cannot replace an explicit editor compatibility reference', () => {
  const { MI } = runtime(); const owner = new MI.Engine(); MI.activeEngine = owner;
  new MI.Engine().renderSVG(); assert.equal(MI.activeEngine, owner);
});

test('source has one canvas render owner and no alternative feature interaction/engine trackers', () => {
  const files = ['editor.js', 'editor-bootstrap.js', 'editor-adaptive-grid.js', 'editor-axis-settings.js', 'editor-color.js', 'editor-label-drag.js', 'editor-enhancements.js', 'editor-tool-instructions.js'];
  const source = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.equal((source.match(/canvas\.innerHTML\s*=/g) || []).length, 1);
  assert.equal((source.match(/"pointerdown"/g) || []).length, 1);
  assert.doesNotMatch(source, /prototype\.renderSVG|prototype\.renderAxes|MutationObserver|installEngineTracker|trackEngine|adaptiveGridEngine|"mousedown"|"mousemove"|"mouseup"/);
  assert.equal((source.match(/MI\.activeEngine\s*=/g) || []).length, 1);
});

// The lifecycle API is exercised without relying on a real DOM parser.
function appRuntime() {
  const { MI, context } = runtime();
  for (const file of ['editor-color.js', 'text-editor-ux.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  vm.runInContext(fs.readFileSync(path.join(root, 'intersection-dispatcher.js'), 'utf8'), context, { filename: 'intersection-dispatcher.js' });
  vm.runInContext(fs.readFileSync(path.join(root, 'editor-tool-instructions.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'tool-catalog.js'), 'utf8'), context, { filename: 'tool-catalog.js' });
  vm.runInContext(fs.readFileSync(path.join(root, 'editor-radial-properties.js'), 'utf8'), context, { filename: 'editor-radial-properties.js' });
  // This fixture exercises canvas lifecycle only; the radial view is covered by browser tests.
  MI.RadialProperties=class { constructor() {} sync() {} openForAxes() {} dispose() {} };
  vm.runInContext(fs.readFileSync(path.join(root, 'editor.js'), 'utf8'), context);
  const events = new Map();
  function target() { return { value: '', style: { setProperty() {} }, dataset: {}, attributes: {}, events: new Map(), children: [], classList: { add() {}, remove() {}, toggle() {} }, insertBefore() {}, appendChild(child) { this.children.push(child); return child; }, remove() {},
    setAttribute(name, value) { this.attributes[name] = String(value); }, getAttribute(name) { return this.attributes[name] ?? null; },
    addEventListener(type, fn) { (this.events.get(type) || (this.events.set(type, new Set()), this.events.get(type))).add(fn); },
    removeEventListener(type, fn) { this.events.get(type)?.delete(fn); },
    querySelector: () => null, querySelectorAll: () => [], focus() {}, getBoundingClientRect: () => ({ left: 0, top: 0 }), contains: () => true,
    setPointerCapture(id) { this.capture = id; }, hasPointerCapture(id) { return this.capture === id; }, releasePointerCapture() { this.capture = null; } }; }
  const nodes = new Map(), win = target();
  const doc = { getElementById(id) { if (!nodes.has(id)) nodes.set(id, target()); return nodes.get(id); }, createElement: () => target(), querySelector: () => null, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, activeElement: { tagName: 'BODY' } };
  doc.getElementById('canvas').querySelector = selector => selector === 'svg' ? { getScreenCTM: () => ({ a: .5, d: .5, b: 0, c: 0, e: 0, f: 0 }), querySelector: () => null } : null;
  const engine = new MI.Engine({ objects: [{ id: 'p', type: 'point', x: 0, y: 0, showLabel: true }, { id: 'l', type: 'line', x1: 0, y1: 1, x2: 1, y2: 1, showLabel: true }] });
  const dialog=doc.getElementById('textDialog');
  dialog.open=false;
  dialog.show=function(){this.open=true;};
  dialog.close=function(){this.open=false;};
  // Only the presentation boundary is mocked: real submit/cancel/history stay in EditorApp.
  const workspace={active:false};
  MI.TextWorkspace={mount(node){assert.equal(node,dialog);return{open(){node.show();workspace.active=true;},destroy(){workspace.active=false;}};}};
  MI.TextInsertPanel={mount:()=>({destroy(){},isOpen:()=>false})};
  MI.RichTextEditor={load:async()=>({mount(){return{get(){const value=doc.getElementById('textValue').value.trim();return value?{schema:1,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:null,paragraphs:[{id:'p1',align:'left',lineHeight:1.25,runs:[{id:'r1',kind:'text',text:value,marks:{}}]}]}:null;},focus(){},destroy(){}};}})};
  const app = new MI.EditorApp({ engine, document: doc, window: win, storage: { getItem: () => null }, services: { transform: MI.CoordinateTransform, snap: MI.SnapService, resolver: MI.InteractionResolver } });
  app.init();
  const emit = (node, type, values = {}) => [...(node.events.get(type) || [])].forEach(fn => fn({ pointerId: 1, button: 0, preventDefault() {}, ...values }));
  const screen = p => new MI.CoordinateTransform(engine.renderer, { a: .5, d: .5 }).mathToScreen(p);
  const down = (point, target = null, pointerId = 1) => { const p = screen(point); emit(doc.getElementById('canvasWrap'), 'pointerdown', { clientX: p.x, clientY: p.y, target, pointerId }); };
  const move = (point, pointerId = 1) => { const p = screen(point); emit(win, 'pointermove', { clientX: p.x, clientY: p.y, pointerId }); };
  return { MI, engine, app, doc, win, emit, down, move, workspace };
}
test('axis line-source hover and hit testing are role-aware, visible-only, and use the shared picker',()=>{
  const h=appRuntime();h.engine.add({id:'C',type:'circle',cx:2,cy:0,r:1});h.app.setTool('construct:lineCircleIntersection');
  assert.deepEqual(plain(h.app.constructionSourcesAt({x:4,y:0},{target:null},[])[0]),{kind:'axis',frame:'cartesian',axis:'x'});
  assert.deepEqual(plain(h.app.constructionSourcesAt({x:0,y:4},{target:null},[])[0]),{kind:'axis',frame:'cartesian',axis:'y'});
  assert.deepEqual(plain(h.app.constructionSourcesAt({x:1,y:0},{target:null},[{kind:'axis',frame:'cartesian',axis:'x'}])[1]),{objectId:'C'});
  const axisScreen=h.app.transform().mathToScreen({x:4,y:0});h.app.updateHover({clientX:axisScreen.x,clientY:axisScreen.y,target:null});assert.deepEqual(plain(h.app.hoverHit.source),{kind:'axis',frame:'cartesian',axis:'x'});
  h.engine.renderer.showXAxis=false;assert.equal(h.app.constructionSourcesAt({x:4,y:0},{target:null},[]),null);h.app.updateHover({clientX:axisScreen.x,clientY:axisScreen.y,target:null});assert.equal(h.app.hoverHit,null);
  const options=h.app.constructionInputs({id:'I',type:'point',construction:{kind:'lineCircleIntersection',sources:[{kind:'axis',frame:'cartesian',axis:'x'},{objectId:'C'}]}});
  assert.match(options,/<option value="\{&quot;kind&quot;:&quot;axis&quot;,&quot;frame&quot;:&quot;cartesian&quot;,&quot;axis&quot;:&quot;x&quot;\}"/);
});
test('dragging any distributed circle point rotates the entire distribution in one undo step',()=>{
  const h=appRuntime();h.engine.add({id:'C',type:'circle',cx:0,cy:0,r:1});const p=h.engine.construct('pointOnCircle',[{objectId:'C'}],0)[0],d=h.engine.setCircleDistribution(p.id,{count:4,startAngle:0}),ids=plain(d.pointIds.slice());
  h.app.updateHover({clientX:h.app.transform().mathToScreen({x:1,y:0}).x,clientY:h.app.transform().mathToScreen({x:1,y:0}).y,target:null});assert.equal(h.doc.getElementById('canvasWrap').style.cursor,'grab');
  h.down({x:1,y:0});assert.equal(h.app.interaction.mode,'circleDistributionPoint');h.move({x:0,y:1});
  assert.ok(Math.abs(h.engine.model.circleDistributions[0].startAngle-Math.PI/2)<1e-10);assert.deepEqual(plain(h.engine.model.circleDistributions[0].pointIds),ids);
  const coords=ids.map(id=>h.engine.get(id));for(let i=0;i<4;i++){assert.ok(Math.abs(coords[i].x-Math.cos(Math.PI/2+i*Math.PI/2))<1e-10);assert.ok(Math.abs(coords[i].y-Math.sin(Math.PI/2+i*Math.PI/2))<1e-10);}
  const end=h.app.transform().mathToScreen({x:0,y:1});h.emit(h.win,'pointerup',{clientX:end.x,clientY:end.y});assert.equal(h.app.history.entries.length,1);assert.equal(h.app.history.undo(),true);assert.equal(h.engine.model.circleDistributions.length,1);assert.ok(Math.abs(h.engine.model.circleDistributions[0].startAngle)<1e-10);assert.equal(h.engine.get(p.id).construction.kind,'distributedPointOnCircle');assert.equal(h.app.history.redo(),true);assert.deepEqual(plain(h.engine.model.circleDistributions[0].pointIds),ids);assert.ok(Math.abs(h.engine.get(ids[0]).y-1)<1e-10);
});
test('Escape cancellation restores the original circle distribution phase',()=>{
  const h=appRuntime();h.engine.add({id:'C',type:'circle',cx:0,cy:0,r:2});const p=h.engine.construct('pointOnCircle',[{objectId:'C'}],.125)[0],d=h.engine.setCircleDistribution(p.id,{count:4,startAngle:Math.PI/4});const before=plain(h.engine.toJSON());h.down({x:Math.SQRT2,y:Math.SQRT2});h.move({x:-2,y:0});assert.notEqual(h.engine.model.circleDistributions[0].startAngle,d.startAngle);h.app.cancel();assert.deepEqual(plain(h.engine.toJSON()),before);
});
test('dragging a non-first distribution member derives the shared phase from its index',()=>{
  const h=appRuntime();h.engine.add({id:'C',type:'circle',cx:0,cy:0,r:1});const p=h.engine.construct('pointOnCircle',[{objectId:'C'}],0)[0],d=h.engine.setCircleDistribution(p.id,{count:4,startAngle:0}),memberId=d.pointIds[2];h.down({x:-1,y:0});h.move({x:0,y:1});assert.ok(Math.abs(h.engine.model.circleDistributions[0].startAngle-3*Math.PI/2)<1e-10);assert.ok(Math.abs(h.engine.get(memberId).x)<1e-10);assert.ok(Math.abs(h.engine.get(memberId).y-1)<1e-10);h.app.cancel();
});
test('locked source circles prevent distribution-point dragging',()=>{
  const h=appRuntime();h.engine.add({id:'C',type:'circle',cx:0,cy:0,r:1,locked:true});const p=h.engine.construct('pointOnCircle',[{objectId:'C'}],0)[0],d=h.engine.setCircleDistribution(p.id,{count:3,startAngle:0});h.down({x:1,y:0});assert.equal(h.app.interaction,null);assert.equal(h.engine.model.circleDistributions[0].startAngle,d.startAngle);
});
test('M1.1 hover and click share the same hit at eight CSS pixels and clear outside',()=>{
  const h=appRuntime(),p=h.app.transform().mathToScreen({x:0,y:0}),event={clientX:p.x+7,clientY:p.y,target:null};
  assert.equal(h.app.hitAt(event).object.id,'p');h.app.updateHover(event);assert.equal(h.app.hoverId,'p');assert.equal(h.doc.getElementById('canvasWrap').style.cursor,'pointer');
  h.app.selectObject('p');h.app.updateHover(event);assert.equal(h.doc.getElementById('canvasWrap').style.cursor,'grab');
  h.app.updateHover({...event,clientX:p.x+9});assert.equal(h.app.hoverId,null);h.app.clearHover();assert.equal(h.doc.getElementById('canvasWrap').style.cursor,'default');
});
test('M1.1 idle hover updates presentation without rendering geometry or inspector',()=>{
  const h=appRuntime();let renders=0;const render=h.app.render.bind(h.app);h.app.render=()=>{renders++;render();};
  const p=h.app.transform().mathToScreen({x:0,y:0});for(let i=0;i<20;i++)h.app.updateHover({clientX:p.x+i/100,clientY:p.y,target:null});assert.equal(renders,0);assert.equal(h.app.hoverId,'p');
});
test('M1.1 locks show selection pointer but never a move cursor',()=>{
  const h=appRuntime();h.engine.update('p',{locked:true});h.app.selectedIds=['p'];const p=h.app.transform().mathToScreen({x:0,y:0});h.app.updateHover({clientX:p.x,clientY:p.y});assert.equal(h.app.cursorFor(h.app.hoverHit),'pointer');assert.equal(h.app.moveSelectionPlan(),null);
});
test('M1.1 group cursor and drag retain all IDs and cancel restores geometry',()=>{
  const h=appRuntime();h.app.selectedIds=['p','l'];const before=plain(h.engine.toJSON());assert.equal(h.app.moveSelectionPlan().length,2);h.down({x:0,y:0});assert.deepEqual(Array.from(h.app.selectedIds),['p','l']);assert.equal(h.doc.getElementById('canvasWrap').style.cursor,'grabbing');h.move({x:1,y:0});h.app.cancel();assert.deepEqual(plain(h.engine.toJSON()),before);assert.notEqual(h.doc.getElementById('canvasWrap').style.cursor,'grabbing');
});
test('M1.1 dependent group movement requires all free source roots and respects locks',()=>{
  const h=appRuntime();h.engine.add({id:'q',type:'point',x:2,y:0});const mid=h.engine.construct('midpoint',[{objectId:'p',anchor:'point'},{objectId:'q',anchor:'point'}])[0];
  h.app.selectedIds=['p',mid.id];assert.equal(h.app.moveSelectionPlan(),null);
  h.app.selectedIds=['p','q',mid.id];assert.deepEqual(Array.from(h.app.moveSelectionPlan(),o=>o.id),['p','q']);
  const old=h.engine.get(mid.id);h.down({x:0,y:0});h.move({x:1,y:1});assert.equal(h.engine.get(mid.id).x,old.x+1);assert.equal(h.engine.get(mid.id).y,old.y+1);h.app.cancel();
  h.engine.update('q',{locked:true});assert.equal(h.app.moveSelectionPlan(),null);
});
test('M1.1 hover is tool gated and teardown never retains hover state',()=>{
  const h=appRuntime(),p=h.app.transform().mathToScreen({x:0,y:0});h.app.updateHover({clientX:p.x,clientY:p.y});h.app.setTool('line');assert.equal(h.app.hoverId,null);assert.equal(h.doc.getElementById('canvasWrap').style.cursor,'crosshair');h.app.setTool('select');h.app.updateHover({clientX:p.x,clientY:p.y});h.app.dispose();assert.equal(h.app.hoverId,null);
});
test('M1.1 movement eligibility is cached until selection or immutable model changes',()=>{
  const h=appRuntime();h.app.selectedIds=['p','l'];const plan=h.app.moveSelectionPlan();assert.equal(h.app.moveSelectionPlan(),plan);h.engine.update('l',{locked:true});assert.equal(h.app.moveSelectionPlan(),null);h.engine.update('l',{locked:false});assert.notEqual(h.app.moveSelectionPlan(),plan);h.app.selectedIds=['p','missing'];assert.equal(h.app.moveSelectionPlan(),null);
});
test('M1.1 hidden and invalid painted targets cannot override the shared hit resolver',()=>{
  const h=appRuntime();h.engine.add({id:'c',type:'circle',cx:0,cy:0,r:1});h.engine.update('p',{x:2});const tangent=h.engine.construct('tangent',[{objectId:'c'},{objectId:'p'}])[0];const node={getAttribute:()=>tangent.id},target={closest:selector=>selector==='[data-object-id]'?node:null},p=h.app.transform().mathToScreen({x:0,y:0});
  assert.equal(h.app.hitAt({clientX:p.x,clientY:p.y,target}).object.id,tangent.id);h.engine.update('p',{x:0});assert.equal(h.engine.get(tangent.id).constructionValid,false);assert.notEqual(h.app.hitAt({clientX:p.x,clientY:p.y,target})?.object.id,tangent.id);h.engine.update('c',{visible:false});assert.notEqual(h.app.hitAt({clientX:p.x,clientY:p.y})?.object.id,'c');
});
test('M1.1 handles labels pan and marquee have gated cursors and clear hover',()=>{
  const h=appRuntime(),object=h.engine.get('l');assert.equal(h.app.cursorFor({object,kind:'endpoint'}),'crosshair');assert.equal(h.app.cursorFor({object,kind:'label'}),'move');assert.equal(h.app.cursorFor({object:{...object,locked:true},kind:'endpoint'}),'pointer');h.app.interaction={mode:'pan'};assert.equal(h.app.cursorFor(null),'grabbing');h.app.interaction=null;const p=h.app.transform().mathToScreen({x:0,y:0});h.app.updateHover({clientX:p.x,clientY:p.y});h.app.startKeyboardRectangle();assert.equal(h.app.hoverId,null);assert.equal(h.doc.getElementById('canvasWrap').style.cursor,'crosshair');h.app.cancel();
});

function rightRectangle(h,a,b,modifiers={}) {
  const t=h.app.transform(),p=t.mathToScreen(a),q=t.mathToScreen(b);
  h.emit(h.doc.getElementById('canvasWrap'),'pointerdown',{button:2,clientX:p.x,clientY:p.y,...modifiers});
  h.emit(h.win,'pointermove',{clientX:q.x,clientY:q.y});
  return q;
}
test('M1 right rectangle previews synchronize selection list inspector without document/history writes',()=>{
  const h=appRuntime(),before=plain(h.engine.toJSON());
  const q=rightRectangle(h,{x:-.5,y:.5},{x:.5,y:-.5});
  assert.equal(h.app.interaction.mode,'marquee');assert.deepEqual(Array.from(h.app.selectedIds),['p']);
  assert.match(h.doc.getElementById('viewList').innerHTML,/view-row-selected/);
  h.emit(h.win,'pointerup',{clientX:q.x,clientY:q.y});assert.equal(h.app.interaction,null);
  assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);
});
test('M1 final pointer-up sample is resolved without a move and outside target is accepted',()=>{
  const h=appRuntime(),t=h.app.transform(),a=t.mathToScreen({x:-.5,y:.5}),b=t.mathToScreen({x:.5,y:-.5});
  h.emit(h.doc.getElementById('canvasWrap'),'pointerdown',{button:2,clientX:a.x,clientY:a.y});
  h.emit(h.win,'pointerup',{clientX:b.x,clientY:b.y,target:{outside:true}});
  assert.deepEqual(Array.from(h.app.selectedIds),['p']);assert.equal(h.doc.getElementById('canvasWrap').capture,null);
});
test('M1 add and combined toggle modifiers resolve from original IDs on repeated moves',()=>{
  const h=appRuntime();h.app.selectedIds=['l'];let q=rightRectangle(h,{x:-.5,y:.5},{x:.5,y:-.5},{shiftKey:true});h.emit(h.win,'pointerup',{clientX:q.x,clientY:q.y});assert.deepEqual(Array.from(h.app.selectedIds),['l','p']);
  q=rightRectangle(h,{x:-.5,y:.5},{x:.5,y:-.5},{ctrlKey:true,shiftKey:true});h.emit(h.win,'pointermove',{clientX:q.x,clientY:q.y});assert.deepEqual(Array.from(h.app.selectedIds),['l']);h.app.cancel();assert.deepEqual(Array.from(h.app.selectedIds),['l','p']);
});
test('M1 all cancellation paths restore original selection and release capture',()=>{
  for(const action of ['pointercancel','blur','lostpointercapture','Escape','dispose','new']) {
    const h=appRuntime();h.app.selectedIds=['l'];rightRectangle(h,{x:-.5,y:.5},{x:.5,y:-.5});
    if(action==='Escape')h.emit(h.win,'keydown',{key:'Escape'});
    else if(action==='dispose')h.app.dispose();else if(action==='new')h.app.newDocument();
    else h.emit(action==='lostpointercapture'?h.doc.getElementById('canvasWrap'):h.win,action);
    assert.equal(h.app.interaction,null,action);assert.equal(h.doc.getElementById('canvasWrap').capture,null,action);
    assert.deepEqual(Array.from(h.app.selectedIds),action==='new'?[]:['l'],action);
  }
});
test('M1 right click retains context menu and drawing tools never start marquee',()=>{
  const h=appRuntime();let blocked=false;const p=h.app.transform().mathToScreen({x:0,y:0});
  h.emit(h.doc.getElementById('canvasWrap'),'pointerdown',{button:2,clientX:p.x,clientY:p.y});h.emit(h.win,'pointerup',{clientX:p.x,clientY:p.y});
  h.emit(h.doc.getElementById('canvasWrap'),'contextmenu',{preventDefault(){blocked=true;}});assert.equal(blocked,true);
  h.app.setTool('line');h.emit(h.doc.getElementById('canvasWrap'),'pointerdown',{button:2,clientX:p.x,clientY:p.y});assert.equal(h.app.interaction,null);
});
test('M1 keyboard rectangle uses same resolver and does not intercept text entry',()=>{
  const h=appRuntime();h.doc.activeElement={tagName:'INPUT'};h.emit(h.win,'keydown',{key:'k'});assert.equal(h.app.interaction,null);
  h.doc.activeElement={tagName:'BODY'};h.emit(h.win,'keydown',{key:'k',shiftKey:true});assert.equal(h.app.interaction.mode,'marquee');
  h.emit(h.win,'keydown',{key:'ArrowLeft'});h.emit(h.win,'keydown',{key:'ArrowUp'});h.emit(h.win,'keydown',{key:'Enter'});
  for(let i=0;i<2;i++){h.emit(h.win,'keydown',{key:'ArrowRight'});h.emit(h.win,'keydown',{key:'ArrowDown'});}
  assert.deepEqual(Array.from(h.app.selectedIds),['p']);h.emit(h.win,'keydown',{key:'Enter'});assert.equal(h.app.interaction,null);assert.equal(h.app.history.entries.length,0);
});
test('M1 once a drag starts returning to its origin still suppresses its contextmenu',()=>{
  const h=appRuntime();rightRectangle(h,{x:0,y:0},{x:.5,y:-.5});const p=h.app.transform().mathToScreen({x:0,y:0});h.emit(h.win,'pointermove',{clientX:p.x,clientY:p.y});assert.equal(h.app.interaction.active,true);h.emit(h.win,'pointerup',{clientX:p.x,clientY:p.y});let blocked=false;h.emit(h.doc.getElementById('canvasWrap'),'contextmenu',{preventDefault(){blocked=true;}});assert.equal(blocked,true);
});
test('legacy style patches preserve fields/history; text inspector delegates to text editor',()=>{
  const {app,engine,emit,doc}=appRuntime();const o=engine.add({type:'text',x:1,y:1,text:'T',style:{fontSize:16,extension:{keep:true}}});app.selectedId=o.id;app.invalidate();
  assert.doesNotMatch(doc.getElementById('selectionPanel').innerHTML,/data-style="fontSize"/);
  assert.match(doc.getElementById('selectionPanel').innerHTML,/data-rich-text-edit/);
  // Legacy patch/history compatibility remains tested even though text has no duplicate UI.
  const input={dataset:{style:'fontSize'},type:'number',valueAsNumber:30};input.closest=selector=>selector.includes('[data-style]')?input:null;
  emit(doc.getElementById('selectionPanel'),'change',{target:input});assert.equal(engine.get(o.id).style.fontSize,30);assert.equal(engine.get(o.id).style.extension.keep,true);
  app.travelHistory();assert.equal(engine.get(o.id).style.fontSize,16);app.travelHistory(true);assert.equal(engine.get(o.id).style.fontSize,30);
  input.valueAsNumber=0;emit(doc.getElementById('selectionPanel'),'change',{target:input});assert.equal(engine.get(o.id).style.fontSize,30);
  assert.equal(app.history.entries.length,1);
});
test('style patches retain existing fill when editing multiple presentation fields',()=>{
  const {app,engine,doc}=appRuntime();const o=engine.add({type:'circle',cx:0,cy:0,r:1,style:{fill:'#abcdef'}});app.selectedId=o.id;
  doc.getElementById('selectionPanel').querySelectorAll=()=>[{dataset:{style:'fillEnabled'},type:'checkbox',checked:true},{dataset:{style:'strokeWidth'},type:'number',valueAsNumber:5},{dataset:{style:'opacity'},type:'number',valueAsNumber:75}];
  app.changeDocument(()=>engine.update(o.id,{style:Object.assign({},...doc.getElementById('selectionPanel').querySelectorAll().map(input=>app.stylePatch(input)))}));assert.equal(engine.get(o.id).style.fill,'#abcdef');assert.equal(engine.get(o.id).style.strokeWidth,5);assert.equal(engine.get(o.id).style.opacity,.75);
  assert.equal(app.history.entries.length,1);app.travelHistory();assert.equal(engine.get(o.id).style.strokeWidth,2);
});
test('multi-selection moves rigidly as one history step and undo restores every selected ID',()=>{
  const {app,engine,down,move,emit,win}=appRuntime();app.selectObject('p');app.selectObject('l',true);
  assert.deepEqual(Array.from(app.selectedIds),['p','l']);down({x:0,y:0});move({x:1,y:0});emit(win,'pointerup');
  assert.equal(engine.get('p').x,1);assert.equal(engine.get('l').x1,1);assert.equal(engine.get('l').x2,2);assert.equal(app.history.entries.length,1);
  app.travelHistory();assert.equal(engine.get('p').x,0);assert.deepEqual(Array.from(app.selectedIds),['p','l']);app.travelHistory(true);assert.equal(engine.get('p').x,1);
});
test('duplicate and lock are atomic commands; locked selections refuse dragging and deletion',()=>{
  const {app,engine,down,move,emit,win}=appRuntime();app.selectObject('p');app.selectObject('l',true);app.duplicateSelection();
  assert.equal(engine.model.objects.length,4);assert.equal(app.selectedIds.length,2);assert.equal(app.history.entries.length,1);
  app.toggleLockSelection();assert.ok(app.selectedIds.every(id=>engine.get(id).locked));const before=plain(engine.toJSON());
  down({x:.5,y:.5});move({x:2,y:2});emit(win,'pointerup');assert.deepEqual(plain(engine.toJSON()),before);app.deleteSelection();assert.deepEqual(plain(engine.toJSON()),before);
  app.toggleLockSelection();app.deleteSelection();assert.equal(engine.model.objects.length,2);
});
test('angle tools create measured and exact right angles as one complete interaction',()=>{
  for(const tool of ['angle','rightAngle']) {
    const {app,engine,down,emit,win}=appRuntime();app.setTool(tool);
    for(const p of [{x:1,y:0},{x:0,y:0},{x:.1,y:1}]){down(p);emit(win,'pointerup');}
    const angle=engine.model.objects.at(-1);assert.equal(angle.type,'angle');if(tool==='rightAngle')assert.ok(Math.abs(app.services.resolver ? app.engine.get(angle.id).vertices[2].x : 1)<1e-9);
    assert.equal(app.interaction,null);assert.equal(app.history.entries.length,1);
  }
});

test('history records a whole drag once, restores selection and ignores cancelled/noop gestures', () => {
  const { app, engine, down, move, emit, win } = appRuntime();
  down({ x: 0, y: 0 }); move({ x: 1, y: 0 }); move({ x: 2, y: 0 }); emit(win, 'pointerup');
  assert.equal(app.history.entries.length, 1);
  app.travelHistory(); assert.equal(engine.get('p').x, 0); assert.equal(app.selectedId, null);
  app.travelHistory(true); assert.equal(engine.get('p').x, 2); assert.equal(app.selectedId, 'p');
  down({ x: 2, y: 0 }); move({ x: 3, y: 0 }); emit(win, 'pointercancel');
  assert.equal(engine.get('p').x, 2); assert.equal(app.history.entries.length, 1);
  down({ x: 2, y: 0 }); emit(win, 'pointerup'); assert.equal(app.history.entries.length, 1);
});
test('text form commits the captured snap position once and Escape discards pending text', async () => {
  const { app, engine, down, emit, win, workspace } = appRuntime();
  app.nodes.textValue.focus = () => {};
  app.setTool('text'); down({ x: 2, y: 2 }); await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(workspace.active,true);assert.equal(app.nodes.textDialog.open,true);
  const position = plain(app.pendingText.point); assert.equal(app.interaction, null);
  app.nodes.textValue.value = '  Testtekst  '; app.submitText();
  const object = engine.get(app.selectedId); assert.equal(object.text, 'Testtekst');assert.equal(workspace.active,false);
  assert.equal(object.x, position.x); assert.equal(object.y, position.y); assert.equal(app.history.entries.length, 1);
  app.travelHistory(); assert.equal(engine.get(object.id), null); app.travelHistory(true); assert.ok(engine.get(object.id));
  down({ x: 3, y: 2 }); await new Promise(resolve=>setTimeout(resolve,0)); emit(win, 'keydown', { key: 'Escape' });
  assert.equal(app.pendingText, null); assert.equal(app.nodes.textDialog.open, false); assert.equal(workspace.active,false);assert.equal(app.history.entries.length, 1);
});
test('empty text is not committed and New clears a pending text form', async () => {
  const { app, engine, down, workspace } = appRuntime();
  app.nodes.textValue.focus = () => {};
  app.setTool('text'); down({ x: 2, y: 2 }); await new Promise(resolve=>setTimeout(resolve,0)); app.nodes.textValue.value = '   '; app.submitText();
  assert.equal(workspace.active,true);assert.equal(app.nodes.textDialog.open,true);assert.equal(engine.model.objects.length, 2); assert.equal(app.history.canUndo, false);
  app.newDocument(); assert.equal(app.pendingText, null); assert.equal(app.nodes.textDialog.open, false);assert.equal(workspace.active,false); assert.equal(engine.model.objects.length, 0);
});
test('triangle and multi-click polygon use one owner and one undo step; Enter and Escape clean up',()=>{
  for(const tool of ['triangle','polygon']) {
    const {app,engine,down,emit,win}=appRuntime(); app.setTool(tool);
    for(const p of [{x:-2,y:-2},{x:0,y:-2},{x:-1,y:-1}]) { down(p); emit(win,'pointerup'); }
    if(tool==='polygon') { assert.equal(app.interaction.mode,'polygon'); emit(win,'keydown',{key:'Enter'}); }
    assert.equal(app.interaction,null); assert.equal(engine.model.objects.at(-1).type,'polygon'); assert.equal(engine.model.objects.at(-1).vertices.length,3);
    assert.equal(app.history.entries.length,1); app.travelHistory(); assert.equal(engine.model.objects.length,2); app.travelHistory(true); assert.equal(engine.model.objects.length,3);
    down({x:3,y:2}); emit(win,'pointerup'); emit(win,'keydown',{key:'Escape'}); assert.equal(app.interaction,null); assert.equal(app.history.entries.length,1);
  }
});
test('unfinished polygons roll back on blur, pointercancel, New and dispose without a history step',()=>{
  for(const end of ['blur','pointercancel','New','dispose']) {
    const {app,engine,down,emit,win}=appRuntime();app.setTool('polygon');down({x:3,y:2});
    if(end==='New') app.newDocument();else if(end==='dispose')app.dispose();else emit(win,end);
    assert.equal(app.interaction,null);assert.equal(engine.renderer.preview,null);assert.equal(app.history.canUndo,false);
    assert.equal(engine.model.objects.length,end==='New'?0:2);
  }
});
test('draw/delete history, shortcuts, new/import reset and failed import retain a usable history', () => {
  const { app, engine, down, move, emit, win, doc } = appRuntime();
  app.setTool('line'); down({ x: -2, y: -2 }); move({ x: -1, y: -2 }); emit(win, 'pointerup');
  const id = app.selectedId; assert.ok(engine.get(id));
  emit(win, 'keydown', { key: 'z', ctrlKey: true }); assert.equal(engine.get(id), null);
  emit(win, 'keydown', { key: 'Z', ctrlKey: true, shiftKey: true }); assert.ok(engine.get(id));
  doc.activeElement = { tagName: 'INPUT' };
  emit(win, 'keydown', { key: 'z', ctrlKey: true }); assert.ok(engine.get(id));
  doc.activeElement = { tagName: 'BODY' };
  app.setTool('select'); emit(win, 'keydown', { key: 'Delete' }); assert.equal(engine.get(id), null);
  app.travelHistory(); assert.ok(engine.get(id));
  assert.throws(() => app.loadDocument({ objects: [{ type: 'bogus' }] })); assert.equal(app.history.canUndo, true);
  app.loadDocument({ objects: [] }); assert.equal(app.history.canUndo, false); assert.equal(app.history.canRedo, false);
  app.setTool('point'); down({ x: 0, y: 0 }); assert.equal(app.history.canUndo, true);
  app.newDocument(); assert.equal(app.history.canUndo, false);
});
test('one pointer owner commits outside canvas; other pointers cannot replace a drag', () => {
  const { app, engine, down, move, emit, win } = appRuntime();
  down({ x: 0, y: 0 }); down({ x: 4, y: 2 }, null, 2); move({ x: 1, y: 0 }, 2);
  assert.equal(engine.get('p').x, 0); assert.equal(app.interaction.pointerId, 1);
  move({ x: 1, y: 0 }); emit(win, 'pointerup', { target: null });
  assert.equal(engine.get('p').x, 1); assert.equal(app.interaction, null); assert.equal(app.selectedId, 'p');
});
for (const cancel of ['pointercancel', 'blur', 'Escape', 'lostpointercapture']) test(`${cancel} rolls back object/label/endpoint/draw/pan and clears ownership`, () => {
  for (const mode of ['object', 'label', 'endpoint', 'draw', 'pan']) {
    const { app, engine, down, move, emit, win, doc } = appRuntime(); const before = plain(engine.toJSON());
    let target = null, point = { x: 0, y: 0 };
    if (mode === 'label') target = { closest: selector => selector === '.object-label' ? { getAttribute: () => 'p' } : null };
    if (mode === 'endpoint') { target = { closest: selector => selector === '.fzi-line-endpoint' ? { getAttribute: key => key === 'data-line-id' ? 'l' : 'end' } : null }; point = { x: 1, y: 1 }; }
    if (mode === 'draw') app.setTool('line');
    if (mode === 'pan') point = { x: 4, y: 2 };
    down(point, target); move({ x: 2, y: 2 });
    assert.equal(app.interaction.mode, mode);
    emit(cancel === 'lostpointercapture' ? doc.getElementById('canvasWrap') : win, cancel === 'Escape' ? 'keydown' : cancel, { key: 'Escape' });
    assert.equal(app.interaction, null); assert.deepEqual(plain(engine.toJSON()), before);
  }
});
test('responsive labeldrag uses screen transform and obeys tool gating', () => {
  const { app, engine, down, move, emit, win } = appRuntime();
  const label = { closest: selector => selector === '.object-label' ? { getAttribute: () => 'p' } : null };
  const before = engine.get('p').labelDx / engine.renderer.scale();
  down({ x: 0, y: 0 }, label); move({ x: 1, y: 1 }); emit(win, 'pointerup');
  assert.ok(Math.abs(engine.get('p').labelOffsetX - before - 1) < 1e-10);
  const saved = engine.get('p').labelOffsetX;
  app.setTool('line'); down({ x: 0, y: 0 }, label); move({ x: 2, y: 2 }); emit(win, 'keydown', { key: 'Escape' });
  assert.equal(engine.get('p').labelOffsetX, saved);
});
test('New cancels an active drag; dispose/init does not duplicate listeners', () => {
  const { app, engine, doc, win, down, move, emit } = appRuntime();
  down({ x: 0, y: 0 }); move({ x: 1, y: 0 }); app.newDocument();
  assert.equal(app.interaction, null); assert.equal(engine.model.objects.length, 0);
  app.dispose();
  assert.ok([...win.events.values()].every(set => set.size === 0));
  assert.ok([...doc.getElementById('canvasWrap').events.values()].every(set => set.size === 0));
  app.init(); app.setTool('point'); down({ x: 0, y: 0 }); emit(win, 'pointerup');
  assert.equal(engine.model.objects.length, 1);
});

test('painted object target selects and moves a circle center despite mathematical hit-test missing it', () => {
  const { app, engine, down, move, emit, win } = appRuntime();
  engine.add({ id: 'circle', type: 'circle', cx: -2, cy: -1, r: .5 });
  const group = { getAttribute: () => 'circle' };
  down({ x: -2, y: -1 }, { closest: selector => selector === '[data-object-id]' ? group : null });
  assert.equal(app.selectedId, 'circle'); assert.equal(app.interaction.mode, 'object');
  move({ x: -1, y: -1 }); emit(win, 'pointerup');
  assert.ok(Math.abs(engine.get('circle').cx + 1) < 1e-10);
});

test('selecting an object in the sidebar after drawing activates selection and subsequent drag adds no shape', () => {
  const { app, engine, down, move, emit, win } = appRuntime(); app.setTool('point');
  app.viewClick({ target: { closest: selector => selector === '[data-select-object]' ? { dataset: { selectObject: 'p' } } : null } });
  assert.equal(app.tool, 'select'); assert.equal(app.selectedId, 'p');
  const count = engine.model.objects.length;
  down({ x: 0, y: 0 }); move({ x: 1, y: 0 }); emit(win, 'pointerup');
  assert.equal(engine.model.objects.length, count); assert.equal(engine.get('p').x, 1);
});

test('unrecognized drawing tools never fall through into canvas pan', () => {
  const { app, engine, down } = appRuntime(); const before = plain(engine.renderer.bounds);
  app.setTool('unsupported-tool'); down({ x: 4, y: 2 });
  assert.equal(app.interaction, null); assert.deepEqual(plain(engine.renderer.bounds), before);
});

for(const cancellation of ['pointercancel','blur','Escape','lostpointercapture']) test(`group ${cancellation} rolls back every member and selection`,()=>{
  const {app,engine,down,move,emit,win,doc}=appRuntime();app.selectObject('p');app.selectObject('l',true);
  const before=plain(engine.toJSON());down({x:0,y:0});move({x:2,y:2});assert.equal(app.interaction.mode,'group');
  emit(cancellation==='lostpointercapture'?doc.getElementById('canvasWrap'):win,cancellation==='Escape'?'keydown':cancellation,{key:'Escape'});
  assert.equal(app.interaction,null);assert.deepEqual(plain(engine.toJSON()),before);assert.deepEqual(plain(app.selectedIds),['p','l']);
});

test('selection containing only derived constructions refuses group drag without throwing',()=>{const {app,engine,down,move}=appRuntime();const m=engine.construct('midpoint',[{objectId:'l',part:'start'},{objectId:'l',part:'end'}])[0];const n=engine.construct('midpoint',[{objectId:m.id},{objectId:'p'}])[0];app.selectObject(m.id);app.selectObject(n.id,true);down({x:m.x,y:m.y});move({x:2,y:2});assert.equal(app.interaction,null);});
for(const cancellation of ['Escape','blur','pointercancel'])test(`construction source selection ${cancellation} cleans up without adding an object`,()=>{const {app,engine,down,emit,win}=appRuntime();app.setTool('construct:parallel');down({x:.5,y:1});assert.equal(app.interaction.mode,'construction');emit(win,cancellation==='Escape'?'keydown':cancellation,{key:'Escape'});assert.equal(app.interaction,null);assert.equal(engine.model.objects.length,2);});

test('bisector accepts a direct click on an existing angle and keeps its vertex references',()=>{const {app,engine,down}=appRuntime();const angle=engine.add({type:'angle',vertices:[{x:1,y:0},{x:0,y:0},{x:0,y:1}]});app.setTool('construct:bisector');down({x:.2,y:.2},{closest:selector=>selector==='[data-object-id]'?{getAttribute:()=>angle.id}:null});const result=engine.model.objects.find(o=>o.construction);assert.ok(result);assert.equal(result.construction.kind,'bisector');assert.equal(result.construction.sources.length,3);assert.ok(result.construction.sources.every(s=>s.objectId===angle.id));assert.equal(app.interaction,null);});

test('bisector of a triangle is constructed by clicking its vertex',()=>{const {app,engine,down}=appRuntime();const p=engine.add({type:'polygon',vertices:[{x:2,y:2},{x:4,y:2},{x:2,y:4}]});app.setTool('construct:bisector');down({x:2,y:2});const result=engine.model.objects.find(o=>o.construction);assert.ok(result);assert.equal(result.x1,2);assert.equal(result.y1,2);assert.ok(Math.abs(result.x2-result.x1-result.y2+result.y1)<1e-9);assert.ok(result.construction.sources.every(s=>s.objectId===p.id));});


test('M3a author import is one reversible replacement restoring document presentation and selection',()=>{
  const {app,engine}=appRuntime();app.selectedIds=['p','l'];engine.renderer.showAxes=false;const before=plain(engine.toJSON());
  app.importDocument({version:2,meta:{title:'Imported'},objects:[{id:'new',type:'circle',cx:1,cy:2,r:2}],presentation:{showAxes:true,bounds:{xMin:-2,xMax:2,yMin:-2,yMax:2}}});
  const after=plain(engine.toJSON());assert.equal(app.history.entries.length,1);assert.deepEqual(plain(app.selectedIds),[]);assert.equal(app.history.undo(),true);assert.deepEqual(plain(engine.toJSON()),before);assert.deepEqual(plain(app.selectedIds),['p','l']);assert.equal(app.history.redo(),true);assert.deepEqual(plain(engine.toJSON()),after);assert.deepEqual(plain(app.selectedIds),[]);
});
test('M3a rejected import preserves active drag history redo document and pointer capture',()=>{
  const {app,engine,down,move,doc}=appRuntime();const before=app.history.capture();engine.add({type:'point',x:2,y:2});app.history.record(before);app.history.undo();down({x:0,y:0});move({x:1,y:1});assert.equal(typeof app.importDocument,'function');const state=app.interaction,data=plain(engine.toJSON()),entries=plain(app.history.entries),cursor=app.history.cursor,capture=doc.getElementById('canvasWrap').capture;
  for(const imported of [{objects:[{id:'x',type:'point'},{id:'x',type:'point'}]},{objects:[],presentation:{bounds:{xMin:1,xMax:0,yMin:0,yMax:1}}}])assert.throws(()=>app.importDocument(imported));
  assert.equal(app.interaction,state);assert.deepEqual(plain(engine.toJSON()),data);assert.deepEqual(plain(app.history.entries),entries);assert.equal(app.history.cursor,cursor);assert.equal(doc.getElementById('canvasWrap').capture,capture);assert.equal(app.history.canRedo,true);
});
test('M3a accepted import cancels preview then captures committed base, and no-op retains redo',()=>{
  const {app,engine,down,move}=appRuntime();const before=plain(engine.toJSON());down({x:0,y:0});move({x:1,y:1});app.importDocument({objects:[]});assert.equal(app.interaction,null);app.history.undo();assert.deepEqual(plain(engine.toJSON()),before);assert.equal(app.history.canRedo,true);app.importDocument(before);assert.equal(app.history.canRedo,true);
});
test('M3a import retains earlier history, replacing redo only on a changed document',()=>{
  const {app,engine}=appRuntime();const old=app.history.capture();engine.add({type:'point',x:2,y:2});app.history.record(old);const previous=plain(engine.toJSON());app.importDocument({objects:[]});assert.equal(app.history.entries.length,2);app.history.undo();assert.deepEqual(plain(engine.toJSON()),previous);app.history.undo();assert.equal(engine.model.objects.length,2);
});
test('M3a restricted direct import remains forbidden without changing context or history',()=>{
  const {app,MI}=appRuntime(),{fixture}=require('./permission-fixtures.cjs');const {session,owner}=MI.RuntimeSession.create(fixture());app.runtime=session;app.engine=session.engine;app.commands=session;const before=plain(owner.inspect());assert.throws(()=>app.importDocument({objects:[]}),e=>e.code==='MODE_DENIED');assert.deepEqual(plain(owner.inspect()),before);
});

test('M3a stale file reads cannot overwrite explicit load New dispose or a newer import',()=>{
  for(const action of ['load','new','dispose','newer']){const {app,engine,win}=appRuntime(),readers=[];win.FileReader=class{readAsText(){this.readyState=1;readers.push(this);}abort(){this.readyState=2;}};const first={files:[{}],value:'first.json'};app.importFile({target:first});if(action==='load')app.loadDocument({objects:[]});if(action==='new')app.newDocument();if(action==='dispose')app.dispose();if(action==='newer')app.importFile({target:{files:[{}],value:'second.json'}});const before=plain(engine.toJSON());readers[0].result=JSON.stringify({objects:[{id:'stale',type:'point',x:1,y:1}]});readers[0].onload();assert.deepEqual(plain(engine.toJSON()),before,action);}
});


test('M3b clicking and modifier selection treat persistent groups as one unit',()=>{
  const h=appRuntime();h.engine.group(['p','l']);h.app.selectObject('p');assert.deepEqual(Array.from(h.app.selectedIds),['p','l']);h.app.selectObject('l',true);assert.deepEqual(Array.from(h.app.selectedIds),[]);
  h.down({x:0,y:0});assert.deepEqual(Array.from(h.app.selectedIds),['p','l']);assert.equal(h.app.interaction.mode,'group');h.app.cancel();
});
test('M3b grouping shortcuts inspector history and one-level ungroup share command path',()=>{
  const h=appRuntime();h.app.selectedIds=['p','l'];h.emit(h.win,'keydown',{key:'g',ctrlKey:true});assert.equal(h.engine.model.groups.length,1);assert.match(h.doc.getElementById('selectionPanel').innerHTML,/data-ungroup-selection/);assert.match(h.doc.getElementById('viewList').innerHTML,/data-select-group/);
  h.emit(h.win,'keydown',{key:'g',ctrlKey:true,shiftKey:true});assert.equal(h.engine.model.groups.length,0);assert.equal(h.app.history.entries.length,2);h.app.travelHistory();assert.equal(h.engine.model.groups.length,1);h.app.travelHistory(true);assert.equal(h.engine.model.groups.length,0);
});
test('M3b group crossing selects all members containment requires all and cancel restores selection',()=>{
  const h=appRuntime();h.engine.group(['p','l']);rightRectangle(h,{x:-.5,y:.5},{x:.5,y:-.5});assert.deepEqual(Array.from(h.app.selectedIds),[]);h.app.cancel();
  rightRectangle(h,{x:.5,y:.5},{x:-.5,y:-.5});assert.deepEqual(Array.from(h.app.selectedIds),['p','l']);h.app.cancel();assert.deepEqual(Array.from(h.app.selectedIds),[]);
});
test('M3b persistent group label drag moves group rigidly and Escape restores geometry',()=>{
  const h=appRuntime();h.engine.group(['p','l']);const before=plain(h.engine.toJSON()),node={getAttribute:()=> 'p'},target={closest:s=>s==='.object-label'?node:null};
  h.down({x:0,y:0},target);assert.equal(h.app.interaction.mode,'group');h.move({x:1,y:1});assert.equal(h.engine.get('l').x1,1);assert.equal(h.engine.get('p').x,1);h.emit(h.win,'keydown',{key:'Escape'});assert.deepEqual(plain(h.engine.toJSON()),before);
});
test('M3b locks hidden members and incomplete construction roots prevent partial group translation',()=>{
  const h=appRuntime();h.engine.group(['p','l']);h.engine.update('l',{locked:true});h.down({x:0,y:0});assert.deepEqual(Array.from(h.app.selectedIds),['p','l']);assert.equal(h.app.interaction,null);h.engine.update('l',{locked:false,visible:false});h.down({x:0,y:0});assert.equal(h.app.interaction,null);assert.deepEqual(Array.from(h.app.selectedIds),['p','l']);
});

test('M3b author initialization restores persistent document controls after restricted mounting',()=>{
  const h=appRuntime();for(const id of ['saveBtn','loadBtn','exportJsonBtn','exportSvgBtn','titleInput','descriptionInput'])h.doc.getElementById(id).disabled=true;h.app.dispose();h.app.init();for(const id of ['saveBtn','loadBtn','exportJsonBtn','exportSvgBtn','titleInput','descriptionInput'])assert.equal(h.doc.getElementById(id).disabled,false);
});

test('M3b select-all skips incomplete hidden groups while author list can inspect them',()=>{
  const h=appRuntime();h.engine.group(['p','l']);h.engine.update('l',{visible:false});h.emit(h.win,'keydown',{key:'a',ctrlKey:true});assert.deepEqual(Array.from(h.app.selectedIds),[]);h.app.selectObject('p');assert.deepEqual(Array.from(h.app.selectedIds),['p','l']);
});

test('M3b hidden group members clear hover on render and eligibility is cached per immutable snapshot',()=>{
  const h=appRuntime();h.engine.group(['p','l']);h.app.updateHover({...h.app.transform().mathToScreen({x:0,y:0}),clientX:h.app.transform().mathToScreen({x:0,y:0}).x,clientY:h.app.transform().mathToScreen({x:0,y:0}).y});assert.equal(h.app.hoverId,'p');h.engine.update('l',{visible:false});h.app.renderPresentation(true);assert.equal(h.app.hoverId,null);
  h.engine.update('l',{visible:true});let queries=0;const original=h.app.canvasSelectable.bind(h.app);h.app.canvasSelectable=o=>{queries++;return original(o);};assert.equal(h.app.groupCanvasSelectable('p'),true);const first=queries;assert.equal(h.app.groupCanvasSelectable('l'),true);assert.equal(queries,first);
});


test('M3c editor hidden layer invalidates hover and movement and undo restores presentation',()=>{
  const h=appRuntime();h.engine.group(['p','l']);const layer=h.engine.createLayer('Top');h.engine.assignLayer(['p','l'],layer.id);h.app.selectObject('p');assert.equal(h.app.moveSelectionPlan().length,2);assert.equal(h.app.groupCanvasSelectable('p'),true);
  h.app.changeDocument(()=>h.app.execute('layer.setVisibility',{id:layer.id,value:false}));assert.equal(h.app.canvasSelectable(h.engine.get('p')),false);assert.equal(h.app.moveSelectionPlan(),null);assert.equal(h.app.groupCanvasSelectable('p'),false);assert.doesNotMatch(h.doc.getElementById('canvas').innerHTML,/data-object-id="p"/);h.app.travelHistory();assert.equal(h.app.canvasSelectable(h.engine.get('p')),true);
});
test('M3c author layer controls and inspector assignment share existing document history',()=>{
  const h=appRuntime();h.app.addLayer('Hulplijnen');assert.equal(h.engine.model.layers.length,2);assert.match(h.doc.getElementById('viewList').innerHTML,/data-layer-name/);h.app.selectObject('p');assert.match(h.doc.getElementById('selectionPanel').innerHTML,/data-layer-assign/);h.app.assignSelectionLayer(h.engine.model.layers.at(-1).id);assert.ok(h.engine.model.layers.at(-1).members.includes('p'));assert.equal(h.app.history.entries.length,2);h.app.travelHistory();assert.ok(h.engine.model.layers[0].members.includes('p'));h.app.travelHistory();assert.equal(h.engine.model.layers.length,0);
});
test('M3c layer edits cancel active group interaction before history changes',()=>{
  const h=appRuntime();h.engine.group(['p','l']);const layer=h.engine.createLayer('Top');h.engine.assignLayer(['p','l'],layer.id);const before=plain(h.engine.model.objects);h.down({x:0,y:0});h.move({x:1,y:1});h.app.changeDocument(()=>h.app.execute('layer.setVisibility',{id:layer.id,value:false}));assert.equal(h.app.interaction,null);assert.deepEqual(plain(h.engine.model.objects),before);assert.equal(h.app.history.entries.length,1);
});


test('M4a inspector detach preserves groups and layers and is fully undoable',()=>{
  const h=appRuntime();h.engine.add({id:'q',type:'point',x:2,y:0});const m=h.engine.construct('midpoint',[{objectId:'p'},{objectId:'q'}])[0],l=h.engine.createLayer('Constructies');h.engine.group([m.id,'q']);h.engine.assignLayer([m.id,'q'],l.id);h.app.selectObject(m.id);const before=plain(h.engine.toJSON());assert.match(h.doc.getElementById('selectionPanel').innerHTML,/data-detach-construction/);h.app.detachSelection();assert.equal(h.engine.get(m.id).construction,undefined);assert.equal(h.app.history.entries.length,1);h.app.travelHistory();assert.deepEqual(plain(h.engine.toJSON()),before);h.app.travelHistory(true);assert.equal(h.engine.get(m.id).construction,undefined);
});
test('M4a inspector explains invalid construction and refuses detachment',()=>{
  const h=appRuntime();h.engine.add({id:'q',type:'point',x:2,y:0});h.engine.add({id:'c',type:'circle',cx:0,cy:0,r:1});const t=h.engine.construct('tangent',[{objectId:'c'},{objectId:'q'}])[0];h.engine.update('q',{x:.5});h.app.selectObject(t.id);assert.match(h.doc.getElementById('selectionPanel').innerHTML,/binnen de cirkel/);assert.match(h.doc.getElementById('selectionPanel').innerHTML,/data-detach-construction disabled/);const before=plain(h.engine.toJSON());h.app.detachSelection();assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);
});
test('M4a inspector source navigation uses existing selection and has no document mutation',()=>{
  const h=appRuntime();h.engine.add({id:'q',type:'point',x:2,y:0});const m=h.engine.construct('midpoint',[{objectId:'p'},{objectId:'q'}])[0];h.app.selectObject(m.id);assert.match(h.doc.getElementById('selectionPanel').innerHTML,/data-construction-source="p"/);const before=plain(h.engine.toJSON()),node={dataset:{constructionSource:'p'}},target={closest:s=>s==='[data-construction-source]'?node:null};h.emit(h.doc.getElementById('selectionPanel'),'click',{target});assert.equal(h.app.selectedId,'p');assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);
});

test('M4a label cancellation preserves newer computed geometry from an indirect source update',()=>{const h=appRuntime();h.engine.add({id:'q',type:'point',x:2,y:0});const m=h.engine.construct('midpoint',[{objectId:'p'},{objectId:'q'}])[0];h.engine.update(m.id,{showLabel:true});const node={getAttribute:()=>m.id},target={closest:s=>s==='.object-label'?node:null};h.down({x:1,y:0},target);assert.equal(h.app.interaction.mode,'label');h.move({x:1.5,y:.5});h.engine.update('q',{x:4});h.app.cancel();assert.equal(h.engine.get(m.id).x,2);assert.equal(h.engine.get(m.id).labelOffsetX,null);assert.equal(h.engine.get(m.id).labelOffsetY,null);assert.equal(h.doc.getElementById('canvasWrap').capture,null);});


test('M2c axes configuration selection is temporary and independent of visibility',()=>{
 const h=appRuntime(),before=JSON.stringify(h.engine.toJSON());h.app.selectAxes();
 assert.equal(h.app.inspectorTarget,'axes');assert.deepEqual(plain(h.app.selectedIds),[]);assert.equal(JSON.stringify(h.engine.toJSON()),before);
 h.app.setPresentationFlag('showAxes',false);assert.equal(h.app.inspectorTarget,'axes');assert.equal(h.engine.renderer.showAxes,false);
 h.app.selectObject('p');assert.equal(h.app.inspectorTarget,'objects');
});
test('M2c explicit pan uses existing interaction and preserves selected geometry',()=>{
 const h=appRuntime();h.app.selectedId='p';h.app.setNavigation('pan');h.down({x:0,y:0});assert.equal(h.app.interaction.mode,'pan');assert.equal(h.app.selectedId,'p');
 h.move({x:1,y:1});h.app.cancel();assert.equal(h.engine.get('p').x,0);assert.equal(h.engine.get('p').y,0);
});
test('M2c centered zoom buttons share bounded zoom and undo behavior',()=>{
 const h=appRuntime(),before=JSON.stringify(h.engine.renderer.bounds);h.app.zoomBy(-1);assert.notEqual(JSON.stringify(h.engine.renderer.bounds),before);assert.ok(h.app.history.canUndo);h.app.travelHistory(false);assert.equal(JSON.stringify(h.engine.renderer.bounds),before);
});
test('M2c common style changes are atomic and reject locked members',()=>{
 const h=appRuntime();h.app.selectedIds=['p','l'];h.app.setCommonProperty('style.opacity',.5);assert.equal(h.engine.get('p').style.opacity,.5);assert.equal(h.engine.get('l').style.opacity,.5);
 h.engine.update('l',{locked:true});const before=JSON.stringify(h.engine.toJSON());h.app.setCommonProperty('style.opacity',.2);assert.equal(JSON.stringify(h.engine.toJSON()),before);
});

test('M2c restricted view settings mutate only authorized session view',()=>{
 const h=appRuntime(),f=require('./permission-fixtures.cjs').fixture('course',{document:{viewConfigure:true,undo:true,pan:true,zoom:true}}),{session,owner}=h.MI.RuntimeSession.create(f);
 h.app.dispose();h.doc.getElementById('canvas').querySelector=()=>null;h.app.runtime=session;h.app.engine=session.engine;h.app.commands=session;h.app.history=new h.MI.RuntimeHistory(h.app);h.app.selectedIds=[];h.app.init();
 const before=JSON.stringify(owner.inspect().document);h.app.selectAxes();h.app.setPresentationFlag('showGrid',true);assert.equal(session.engine.renderer.showGrid,true);assert.equal(JSON.stringify(owner.inspect().document),before);assert.equal(session.canUndo,false);
});
test('M2c restricted denied axis setting leaves document and view unchanged',()=>{
 const h=appRuntime(),f=require('./permission-fixtures.cjs').fixture(),{session,owner}=h.MI.RuntimeSession.create(f);h.app.dispose();h.doc.getElementById('canvas').querySelector=()=>null;h.app.runtime=session;h.app.engine=session.engine;h.app.commands=session;h.app.history=new h.MI.RuntimeHistory(h.app);h.app.selectedIds=[];h.app.init();const before=JSON.stringify(owner.inspect());h.app.setPresentationFlag('showGrid',true);assert.equal(JSON.stringify(owner.inspect()),before);assert.equal(session.engine.renderer.showGrid,false);
});

test('UI-LAYERS-LABEL-1 objects, mixed layers, history, membership and roundtrip',()=>{
  const {app,engine,MI}=appRuntime();
  engine.add({id:'q',type:'point',x:3,y:2,showLabel:false});
  const layer=engine.createLayer('Long layer name');engine.assignLayer(['q'],layer.id);const base=engine.model.layers[0];
  const before=plain(engine.toJSON()),selection=plain(app.selectedIds);
  const click=(selector,dataset)=>app.viewClick({target:{closest:s=>s===selector?{dataset}:null}});
  click('[data-toggle-label]',{toggleLabel:'p'});
  assert.equal(engine.get('p').showLabel,false);assert.equal(engine.get('l').showLabel,true);
  assert.equal(app.labelToggleState(base.members).pressed,'mixed');
  click('[data-layer-label]',{layerLabel:base.id});
  assert.ok(base.members.every(id=>engine.get(id).showLabel));assert.equal(engine.get('q').showLabel,false);
  app.travelHistory();assert.equal(engine.get('p').showLabel,false);assert.equal(engine.get('l').showLabel,true);
  app.travelHistory(true);assert.ok(base.members.every(id=>engine.get(id).showLabel));
  click('[data-layer-label]',{layerLabel:base.id});assert.ok(base.members.every(id=>!engine.get(id).showLabel));
  engine.assignLayer(['p'],layer.id);app.toggleLabels(engine.model.layers.find(l=>l.id===layer.id).members);
  assert.equal(engine.get('p').showLabel,true);assert.equal(engine.get('q').showLabel,true);assert.equal(engine.get('l').showLabel,false);
  assert.deepEqual(plain(app.selectedIds),selection);
  assert.deepEqual(plain(new MI.Engine(engine.toJSON()).toJSON()),plain(engine.toJSON()));
  for(const o of engine.model.objects){const original=before.objects.find(v=>v.id===o.id);for(const key of ['x','y','x1','y1','x2','y2','visible'])assert.equal(o[key],original[key]);}
  app.renderViewList();assert.match(app.nodes.viewList.innerHTML,/data-toggle-label="p"[^>]*aria-pressed="true"/);
});

test('UI-LAYERS-LABEL-1 empty, locked and restricted batches have no partial effects',()=>{
  const {app,engine,MI}=appRuntime();assert.equal(app.labelToggleState([]).enabled,false);
  engine.update('l',{locked:true});const before=plain(engine.toJSON());
  assert.equal(app.labelToggleState(['p','l']).enabled,false);app.toggleLabels(['p','l']);assert.deepEqual(plain(engine.toJSON()),before);
  assert.match(app.labelToggleButton(['p','l'],'data-layer-label','layer'),/ disabled/);
  assert.equal(app.labelToggleState(['missing']).enabled,false);
  const options=require('./permission-fixtures.cjs').fixture();options.policy.initialObjectRules.A.propertyFields=['showLabel'];
  const {session}=MI.RuntimeSession.create(options);app.commands=session;app.engine=session.engine;app.runtime=session;
  assert.equal(app.labelToggleState(['A']).enabled,true);assert.equal(app.labelToggleState(['A','B']).enabled,false);
  const saved=plain(session.engine.get('A'));app.toggleLabels(['A','B']);assert.deepEqual(plain(session.engine.get('A')),saved);
});

test('PERF-1.2a viewport invalidation redraws canvas and navigation while retaining unchanged list and inspector',()=>{
  const {app,engine}=appRuntime(),counts={canvas:0,list:0,inspector:0};
  for(const [name,key] of [['canvas','renderCanvas'],['list','renderViewList'],['inspector','renderInspector']]){
    const original=app[key].bind(app);app[key]=(...args)=>{counts[name]++;return original(...args);};
  }
  const before={list:app.nodes.viewList.innerHTML,inspector:app.nodes.selectionPanel.innerHTML};
  engine.renderer.setBounds({xMin:-6,xMax:6,yMin:-4,yMax:4});
  app.invalidate('viewport');
  assert.deepEqual(counts,{canvas:1,list:0,inspector:0});
  assert.equal(app.nodes.viewList.innerHTML,before.list);assert.equal(app.nodes.selectionPanel.innerHTML,before.inspector);
  app.invalidate();
  assert.deepEqual(counts,{canvas:2,list:1,inspector:1});
});

test('PERF-1.2a unknown and legacy invalidations conservatively perform a full render',()=>{
  const {app}=appRuntime(),counts={list:0,inspector:0};
  for(const [name,key] of [['list','renderViewList'],['inspector','renderInspector']]){const original=app[key].bind(app);app[key]=(...args)=>{counts[name]++;return original(...args);};}
  app.invalidate('unknown-reason');assert.deepEqual(counts,{list:1,inspector:1});
  app.invalidate(true);assert.deepEqual(counts,{list:2,inspector:2});
});

test('PERF-1.2a deferred invalidations preserve the strongest pending reason',()=>{
  const {app}=appRuntime(),counts={list:0,inspector:0};let callback,frame=0;
  app.window.requestAnimationFrame=fn=>{callback=fn;return ++frame;};app.window.cancelAnimationFrame=()=>{};
  for(const [name,key] of [['list','renderViewList'],['inspector','renderInspector']]){const original=app[key].bind(app);app[key]=(...args)=>{counts[name]++;return original(...args);};}
  app.invalidate('viewport',true);
  app.invalidate(true);callback();
  assert.deepEqual(counts,{list:1,inspector:1});
});

test('PERF-1.2b1 geometry drag refreshes canvas and inspector while retaining the object list',()=>{
  const h=appRuntime(),q=h.engine.add({id:'q',type:'point',x:3,y:0}),mid=h.engine.construct('midpoint',[{objectId:'p'},{objectId:q.id}])[0],counts={canvas:0,list:0,inspector:0},inspected=[];
  for(const [name,key] of [['canvas','renderCanvas'],['list','renderViewList'],['inspector','renderInspector']]){
    const original=h.app[key].bind(h.app);h.app[key]=(...args)=>{counts[name]++;if(name==='inspector')inspected.push(h.engine.get('p').x);return original(...args);};
  }
  h.app.selectObject('p');const list=h.app.nodes.viewList.innerHTML;counts.canvas=counts.list=counts.inspector=0;inspected.length=0;
  h.down({x:0,y:0});counts.canvas=counts.list=counts.inspector=0;inspected.length=0;h.move({x:.4,y:.3});
  assert.ok(Math.abs(h.engine.get('p').x-.4)<1e-10);assert.ok(Math.abs(h.engine.get(mid.id).x-1.7)<1e-10);
  assert.deepEqual(counts,{canvas:1,list:0,inspector:1});assert.equal(inspected.length,1);assert.ok(Math.abs(inspected[0]-.4)<1e-10);assert.equal(h.app.nodes.viewList.innerHTML,list);
  h.emit(h.win,'pointerup');assert.equal(h.app.history.entries.length,1);h.app.travelHistory();assert.equal(h.engine.get('p').x,0);assert.equal(h.engine.get(mid.id).x,1.5);h.app.travelHistory(true);assert.ok(Math.abs(h.engine.get(mid.id).x-1.7)<1e-10);
});

test('PERF-1.2b1 deferred drag escalates viewport invalidation and preserves full fallback',()=>{
  const {app}=appRuntime();let callback,frame=0;app.window.requestAnimationFrame=fn=>{callback=fn;return ++frame;};app.window.cancelAnimationFrame=()=>{};
  const counts={list:0,inspector:0};for(const [name,key] of [['list','renderViewList'],['inspector','renderInspector']]){const original=app[key].bind(app);app[key]=(...args)=>{counts[name]++;return original(...args);};}
  app.interaction={mode:'object'};
  app.invalidate('drag',true);app.invalidate('viewport',true);callback();assert.deepEqual(counts,{list:0,inspector:1});
  app.invalidate('drag',true);app.invalidate('unknown-reason',true);callback();assert.deepEqual(counts,{list:1,inspector:2});
  app.invalidate('drag',true);app.invalidate('viewport');assert.deepEqual(counts,{list:1,inspector:3});
  app.interaction={mode:'draw'};app.invalidate('drag');assert.deepEqual(counts,{list:2,inspector:4});
});

test('PERF-1.2b1 restricted drag retains current permissions, preview inspector and cancellation',()=>{
  const h=appRuntime(),{session,owner}=h.MI.RuntimeSession.create(require('./permission-fixtures.cjs').fixture());
  h.app.dispose();h.doc.getElementById('canvas').querySelector=()=>null;h.app.runtime=session;h.app.engine=session.engine;h.app.commands=session;h.app.history=new h.MI.RuntimeHistory(h.app);h.app.selectedIds=[];h.app.init();h.app.selectObject('A');
  const counts={list:0,inspector:0};for(const [name,key] of [['list','renderViewList'],['inspector','renderInspector']]){const original=h.app[key].bind(h.app);h.app[key]=(...args)=>{counts[name]++;return original(...args);};}
  counts.list=counts.inspector=0;const saved=plain(owner.inspect()),payload={ids:['A'],delta:{x:1,y:0}},transaction=session.begin(h.app.command('object.translate',payload));session.preview(transaction,payload);
  h.app.selectedIds=['A'];h.app.interaction={mode:'object',id:'A',original:session.engine.get('A'),transaction,finalPayload:payload,rejected:false,permissionEpoch:session.permissionEpoch};h.app.invalidate('drag');
  assert.equal(h.app.viewObject('A').x,1);assert.deepEqual(plain(owner.inspect()),saved);assert.deepEqual(counts,{list:0,inspector:1});
  h.app.cancel();assert.equal(h.app.interaction,null);assert.deepEqual(plain(owner.inspect()),saved);
});

test('UI-LAYERS-TEXT-1 first creation and layer deletion undo/redo atomically restore identity',()=>{
 const {app,engine}=appRuntime(),before=plain(engine.toJSON());let created;
 app.changeDocument(()=>{created=app.createObject({type:'text',x:1,y:2,text:'Eerste tekst'},'text');});
 const saved=plain(engine.toJSON()),id=engine.model.meta.automaticTextLayerId;
 assert.equal(app.history.entries.length,1);assert.ok(saved.layers.find(l=>l.id===id).members.includes(created.id));
 app.travelHistory();assert.deepEqual(plain(engine.toJSON()),before);
 app.travelHistory(true);assert.deepEqual(plain(engine.toJSON()),saved);
 app.changeDocument(()=>app.execute('layer.delete',{id}));assert.equal(engine.model.meta.automaticTextLayerId,undefined);
 app.travelHistory();assert.deepEqual(plain(engine.toJSON()),saved);
 app.travelHistory(true);assert.equal(engine.model.meta.automaticTextLayerId,undefined);
 app.changeDocument(()=>app.createObject({type:'text',x:2,y:2,text:'Nieuwe laag'},'text'));
 assert.ok(engine.model.layers.some(l=>l.id===engine.model.meta.automaticTextLayerId));
 app.newDocument();assert.equal(engine.model.meta.automaticTextLayerId,undefined);assert.equal(engine.model.layers.length,1);assert.equal(engine.model.layers[0].name,'Basislaag');
});

test('WIE-TOOL-L1 document actions return committed values and exceptions without empty history entries',()=>{
 const h=appRuntime(),error=new Error('command failed');
 const success=h.app.changeDocument(()=>h.app.execute('object.create',{toolId:'create:point',object:{type:'point',x:3,y:3}}));
 assert.equal(success.ok,true);assert.equal(success.error,null);assert.ok(h.engine.get(success.result.result.id));assert.equal(h.app.history.entries.length,1);
 const before=plain(h.engine.toJSON()),failed=h.app.changeDocument(()=>{throw error;});
 assert.equal(failed.ok,false);assert.equal(failed.error,error);assert.equal(failed.result,null);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,1);
 const noObjects=h.app.changeDocument(()=>17);assert.equal(noObjects.ok,true);assert.equal(noObjects.result,17);assert.equal(h.app.history.entries.length,1);
});

test('WIE-TOOL-L1 repeated free lines and a free triangle keep their tool',()=>{
 const h=appRuntime();h.app.setTool('line');
 for(const y of [2,3]){h.down({x:2,y});h.move({x:4,y});h.app.commit();assert.equal(h.app.tool,'line');assert.equal(h.app.interaction,null);}
 assert.equal(h.app.history.entries.length,2);
 h.app.setTool('triangle');for(const p of [{x:2,y:5},{x:4,y:5},{x:3,y:7}])h.down(p);
 assert.equal(h.app.tool,'triangle');assert.equal(h.app.interaction,null);assert.equal(h.app.history.entries.length,3);
});

function l1Placement(kind){
 const h=appRuntime();h.engine.add({id:'A',type:'point',x:2,y:2});h.engine.add({id:'B',type:'point',x:4,y:2});h.app.selectedId='p';h.app.setTool('construct:'+kind);
 if(kind==='pointOnObject')h.down({x:.5,y:1});
 else {h.down({x:2,y:2});h.down({x:4,y:2});}
 return h;
}
for(const kind of ['pointOnObject','ellipseByFociAndPoint','parallelogramBySideAngle'])test('WIE-TOOL-L1 '+kind+' command failure preserves placement and retry commits once',()=>{
 const h=l1Placement(kind),state=h.app.interaction,refs=plain(state.sources),before=plain(h.engine.toJSON()),selection=plain(h.app.selectedIds),execute=h.app.execute.bind(h.app);let attempts=0;
 if(kind==='parallelogramBySideAngle'){state.numericPinned=true;state.sideLength=3;state.signedAngle=Math.PI/3;state.sideInput='3';state.angleInput='60';}
 h.app.execute=(op,payload)=>{if(op==='construction.create'){attempts++;throw Error('L1 rejected');}return execute(op,payload);};
 const click=()=>kind==='pointOnObject'?h.down({x:.6,y:1}):h.down({x:3,y:4});click();
 assert.equal(attempts,1);assert.equal(h.app.tool,'construct:'+kind);assert.equal(h.app.interaction,state);assert.deepEqual(plain(state.sources),refs);assert.deepEqual(plain(h.app.selectedIds),selection);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);assert.match(h.app.nodes.status.textContent,/L1 rejected/);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);
 if(kind==='parallelogramBySideAngle'){assert.equal(state.numericPinned,true);assert.equal(state.sideInput,'3');assert.equal(state.angleInput,'60');}
 h.app.execute=execute;click();assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.engine.renderer.preview,null);assert.equal(h.app.history.entries.length,1);assert.ok(h.app.selectedIds.length);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);
 const saved=plain(h.engine.toJSON());h.app.commit();assert.deepEqual(plain(h.engine.toJSON()),saved);assert.equal(h.app.history.entries.length,1);
 h.app.travelHistory();assert.deepEqual(plain(h.engine.toJSON()),before);h.app.travelHistory(true);assert.deepEqual(plain(h.engine.toJSON()),saved);
});

test('WIE-TOOL-L1 generic construction failure retains first source and success selects result',()=>{
 const h=appRuntime();h.app.selectedId='p';h.app.setTool('construct:parallel');h.down({x:.5,y:1});const before=plain(h.engine.toJSON()),state=h.app.interaction,execute=h.app.execute.bind(h.app);
 h.app.execute=()=>{throw Error('L1 denied');};h.down({x:0,y:0});assert.equal(h.app.tool,'construct:parallel');assert.deepEqual(plain(state.sources),[{objectId:'l'}]);assert.match(h.app.nodes.status.textContent,/L1 denied/);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);
 h.app.execute=execute;h.down({x:0,y:0});assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.app.history.entries.length,1);assert.equal(h.engine.get(h.app.selectedId).construction.kind,'parallel');
});

test('WIE-TOOL-L1 context complete reports failure and preserves previous tool and selection',()=>{
 const h=appRuntime();h.app.setTool('line');h.app.selectedId='l';h.app.toolCatalog={...h.app.toolCatalog,getTool:id=>({id})};const plan=h.MI.ConstructionService.contextualPlans(h.engine.get('l'),'midpoint').find(p=>p.mode==='complete'),before=plain(h.engine.toJSON()),execute=h.app.execute.bind(h.app);
 h.app.execute=()=>{throw Error('L1 context denied');};assert.equal(h.app.startContextConstruction('construct:midpoint','l',plan.key),false);assert.equal(h.app.tool,'line');assert.equal(h.app.selectedId,'l');assert.match(h.app.nodes.status.textContent,/L1 context denied/);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);
 h.app.execute=execute;assert.equal(h.app.startContextConstruction('construct:midpoint','l',plan.key),true);assert.equal(h.app.tool,'line');assert.equal(h.app.history.entries.length,1);assert.equal(h.engine.get(h.app.selectedId).construction.kind,'midpoint');
});

test('WIE-TOOL-L1 intersection refusal retains source and success selects all new points',()=>{
 const h=appRuntime();h.engine.add({id:'S',type:'straight',x1:-3,y1:1,x2:3,y2:1});h.engine.add({id:'C',type:'circle',cx:0,cy:1,r:2});const before=plain(h.engine.toJSON()),execute=h.app.execute.bind(h.app);
 h.app.setTool('construct:intersection');h.app.interaction={mode:'construction',sources:[],selectionIdsBefore:['p']};h.app.acceptIntersectionSource({objectId:'S'});
 h.app.execute=()=>{throw Error('L1 intersection denied');};h.app.acceptIntersectionSource({objectId:'C'});assert.equal(h.app.tool,'construct:intersection');assert.deepEqual(plain(h.app.interaction.sources),[{objectId:'S'}]);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);assert.match(h.app.nodes.status.textContent,/L1 intersection denied/);
 h.app.execute=execute;h.app.acceptIntersectionSource({objectId:'C'});assert.equal(h.app.tool,'select');assert.equal(h.app.intersectionCompleted,true);assert.equal(h.app.interaction,null);assert.equal(h.app.selectedIds.length,2);assert.equal(h.app.history.entries.length,1);assert.ok(h.app.selectedIds.every(id=>h.engine.get(id).construction.kind==='lineCircleIntersection'));
});

test('WIE-TOOL-L1 real runtime denial leaves document and runtime history unchanged',()=>{
 const h=appRuntime(),{session,owner}=h.MI.RuntimeSession.create(require('./permission-fixtures.cjs').fixture());
 h.app.dispose();h.doc.getElementById('canvas').querySelector=()=>null;h.app.runtime=session;h.app.engine=session.engine;h.app.commands=session;h.app.history=new h.MI.RuntimeHistory(h.app);h.app.selectedIds=[];h.app.init();
 const before=plain(owner.inspect()),outcome=h.app.changeDocument(()=>h.app.execute('construction.create',{toolId:'construct:parallel',sources:[{objectId:'A'},{objectId:'B'}]}),{cancelInteraction:false});
 assert.equal(outcome.ok,false);assert.equal(outcome.error.code,'PERMISSION_DENIED');assert.deepEqual(plain(owner.inspect()),before);assert.equal(session.canUndo,false);
 const accepted=h.app.changeDocument(()=>h.app.execute('construction.create',{toolId:'construct:midpoint',sources:[{objectId:'A'},{objectId:'B'}]}),{cancelInteraction:false});
 assert.equal(accepted.ok,true);assert.equal(accepted.result.result.length,1);assert.equal(session.canUndo,true);h.app.travelHistory();const undone=plain(owner.inspect());assert.deepEqual(undone.document,before.document);assert.equal(undone.history.length,1);assert.equal(undone.cursor,0);assert.equal(session.canUndo,false);assert.equal(session.canRedo,true);
});

test('WIE-TOOL-L1 Esc after failed placement cleans preview capture and sources without history',()=>{
 const h=l1Placement('ellipseByFociAndPoint'),before=plain(h.engine.toJSON());h.app.execute=()=>{throw Error('L1 failed');};h.down({x:3,y:4});assert.ok(h.app.interaction);h.app.keyDown({key:'Escape',preventDefault(){}});
 assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.engine.renderer.preview,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);
});

test('WIE-TOOL-L1 invalid path placement and numeric input never commit or reset',()=>{
 const path=l1Placement('pointOnObject'),pathState=path.app.interaction,before=plain(path.engine.toJSON());path.down({x:20,y:20});assert.equal(path.app.interaction,pathState);assert.equal(path.app.tool,'construct:pointOnObject');assert.deepEqual(plain(path.engine.toJSON()),before);assert.equal(path.app.history.entries.length,0);
 const h=l1Placement('parallelogramBySideAngle'),state=h.app.interaction;state.numericPinned=true;state.sideLength=NaN;state.sideInput='';assert.equal(h.app.commitParallelogramPlacement(),false);assert.equal(h.app.interaction,state);assert.equal(h.app.tool,'construct:parallelogramBySideAngle');assert.equal(h.app.history.entries.length,0);
});

test('WIE-TOOL-L1 optional source naming failure cannot turn committed geometry into a retry',()=>{
 const h=l1Placement('parallelogramBySideAngle');h.app.nameGenericParallelogramSources=()=>{throw Error('naming denied');};h.down({x:3,y:4});
 assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.app.history.entries.length,1);assert.equal(h.engine.get(h.app.selectedId).construction.kind,'parallelogramBySideAngle');assert.match(h.app.nodes.status.textContent,/bronpunten konden niet worden hernoemd/);
});

test('WIE-TOOL-L1 geometrically impossible tangent is rejected by the real command and keeps the circle',()=>{
 const h=appRuntime();h.engine.add({id:'C',type:'circle',cx:0,cy:0,r:2});const before=plain(h.engine.toJSON());h.app.setTool('construct:tangent');h.down({x:2,y:0});h.down({x:0,y:0});
 assert.equal(h.app.tool,'construct:tangent');assert.deepEqual(plain(h.app.interaction.sources),[{objectId:'C'}]);assert.equal(h.app.history.entries.length,0);assert.deepEqual(plain(h.engine.toJSON()),before);assert.match(h.app.nodes.status.textContent,/bestaat niet/);
});

test('WIE-TOOL-L2 registers every visible catalog tool explicitly',()=>{
 const {MI,context}=runtime();vm.runInContext(fs.readFileSync(path.join(root,'editor.js'),'utf8'),context);
 const html=fs.readFileSync(path.join(root,'editor.html'),'utf8'),ids=[...html.matchAll(/data-tool="([^"]+)"/g)].map(match=>match[1]).filter(id=>id!=='select');
 assert.equal(ids.length,37);assert.deepEqual([...ids].sort(),Object.keys(MI.ToolLifecyclePolicies).sort());
 assert.equal(MI.ToolLifecyclePolicies.line,'repeat');assert.equal(MI.ToolLifecyclePolicies.dimension,'repeat');assert.equal(MI.ToolLifecyclePolicies.text,'repeat');
 assert.equal(MI.ToolLifecyclePolicies['construct:midpoint'],'single');assert.equal(MI.ToolLifecyclePolicies['construct:intersection'],'single');
});

test('WIE-TOOL-L2 completion requires success and rejects unknown policies',()=>{
 const {app}=appRuntime();app.setTool('line');
 assert.equal(app.completeToolInteraction({toolId:'line',outcome:{ok:false,error:Error('denied')},origin:'canvas'}),false);assert.equal(app.tool,'line');
 assert.throws(()=>app.completeToolInteraction({toolId:'construct:legacy',outcome:{ok:true},origin:'canvas'}),/Onbekend lifecyclebeleid/);
});

test('WIE-TOOL-L2 first and second line use central repeat completion exactly once',()=>{
 const h=appRuntime();h.app.setTool('line');const completion=h.app.completeToolInteraction.bind(h.app);let completed=0;
 h.app.completeToolInteraction=(args)=>{completed++;return completion(args);};
 for(const [index,y] of [2,3].entries()){h.down({x:2,y});h.move({x:4,y});h.app.commit();assert.equal(completed,index+1);assert.equal(h.app.tool,'line');assert.equal(h.app.interaction,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.engine.renderer.preview,null);}
 assert.equal(h.engine.model.objects.filter(o=>o.type==='line').length,3);assert.equal(h.app.history.entries.length,2);
});

test('WIE-TOOL-L2 failed line command never completes or creates history',()=>{
 const h=appRuntime();h.app.setTool('line');h.down({x:2,y:2});h.move({x:4,y:2});const before=plain(h.engine.toJSON()),complete=h.app.completeToolInteraction.bind(h.app);let completions=0;h.app.completeToolInteraction=args=>{completions++;return complete(args);};
 h.app.execute=()=>{throw Error('L2 line denied');};h.app.commit();
 assert.equal(completions,1);assert.equal(h.app.tool,'line');assert.match(h.app.nodes.status.textContent,/L2 line denied/);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);
});

test('WIE-TOOL-L2 canvas midpoint uses single completion, preserves selection and retries once',()=>{
 const h=appRuntime();h.engine.add({id:'Q',type:'point',x:2,y:0});h.app.setTool('construct:midpoint');h.down({x:0,y:0});const source=plain(h.app.interaction.sources),before=plain(h.engine.toJSON()),selection=plain(h.app.selectedIds),complete=h.app.completeToolInteraction.bind(h.app);let completions=0;h.app.completeToolInteraction=args=>{completions++;return complete(args);};
 h.app.execute=()=>{throw Error('L2 midpoint denied');};h.down({x:2,y:0});
 assert.equal(completions,0);assert.equal(h.app.tool,'construct:midpoint');assert.equal(h.app.interaction.sources.length,1);assert.deepEqual(plain(h.app.interaction.sources),source);assert.deepEqual(plain(h.app.selectedIds),selection);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);assert.match(h.app.nodes.status.textContent,/L2 midpoint denied/);
 h.app.execute=h.MI.EditorApp.prototype.execute.bind(h.app);h.down({x:2,y:0});
 assert.equal(completions,1);assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.engine.get(h.app.selectedId).construction.kind,'midpoint');assert.deepEqual(plain(h.app.selectedIds),[h.app.selectedId]);assert.equal(h.app.history.entries.length,1);assert.equal(h.app.engine.renderer.preview,null);h.app.travelHistory();assert.deepEqual(plain(h.engine.toJSON()),before);h.app.travelHistory(true);assert.equal(h.engine.get(h.app.selectedId).construction.kind,'midpoint');
});

test('WIE-TOOL-L2 non-migrated parallel retains its L1 completion route',()=>{
 const h=appRuntime();h.app.setTool('construct:parallel');h.down({x:.5,y:1});const complete=h.app.completeToolInteraction.bind(h.app);let completions=0;h.app.completeToolInteraction=args=>{completions++;return complete(args);};h.down({x:0,y:0});
 assert.equal(completions,0);assert.equal(h.app.tool,'select');assert.equal(h.engine.get(h.app.selectedId).construction.kind,'parallel');assert.equal(h.app.history.entries.length,1);
});

test('WIE-TOOL-L3.2 generic linked constructions use central single completion and select every result',()=>{
 const cases=[
  {tool:'perpendicular',prepare(h){h.engine.add({id:'Q',type:'point',x:2,y:2});},clicks:[{x:.5,y:1},{x:2,y:2}]},
  {tool:'parallel',prepare(h){h.engine.add({id:'Q',type:'point',x:2,y:2});},clicks:[{x:.5,y:1},{x:2,y:2}]},
  {tool:'perpendicularBisector',prepare(h){h.engine.add({id:'Q',type:'point',x:2,y:0});},clicks:[{x:0,y:0},{x:2,y:0}]},
  {tool:'bisector',prepare(h){h.engine.add({id:'Q',type:'point',x:1,y:0});h.engine.add({id:'R',type:'point',x:1,y:1});},clicks:[{x:0,y:0},{x:1,y:0},{x:1,y:1}]},
  {tool:'circleByCenterPoint',prepare(h){h.engine.add({id:'Q',type:'point',x:2,y:0});},clicks:[{x:0,y:0},{x:2,y:0}]},
  {tool:'triangleFromPoints',prepare(h){h.engine.add({id:'Q',type:'point',x:4,y:0});h.engine.add({id:'R',type:'point',x:0,y:3});},clicks:[{x:0,y:0},{x:4,y:0},{x:0,y:3}]},
  {tool:'centroid',prepare(h){h.engine.add({id:'T',type:'polygon',vertices:[{x:5,y:0},{x:8,y:0},{x:5,y:3}]});},clicks:[{x:6,y:1}]},
  {tool:'tangent',prepare(h){h.engine.add({id:'C',type:'circle',cx:0,cy:0,r:2});h.engine.add({id:'Q',type:'point',x:4,y:0});},clicks:[{x:2,y:0},{x:4,y:0}],expectedCount:2},
  {tool:'angleDirections',prepare(h){h.engine.add({id:'H',type:'line',x1:-10,y1:0,x2:10,y2:0});h.engine.add({id:'V',type:'line',x1:0,y1:-10,x2:0,y2:10});},clicks:[{x:5,y:0},{x:0,y:5}]},
  {tool:'polygonRegion',prepare(h){h.engine.add({id:'P',type:'polygon',vertices:[{x:2,y:0},{x:4,y:0},{x:4,y:2},{x:2,y:2}]});},clicks:[{x:3,y:1}]},
  {tool:'circleSectorRegion',prepare(h){h.engine.add({id:'C',type:'circle',cx:0,cy:0,r:100});h.engine.add({id:'A',type:'point',x:100,y:0});h.engine.add({id:'B',type:'point',x:0,y:100});},clicks:[{x:100,y:0},{x:100,y:0},{x:0,y:100}]},
  {tool:'circleSegmentRegion',prepare(h){h.engine.add({id:'C',type:'circle',cx:0,cy:0,r:100});h.engine.add({id:'A',type:'point',x:100,y:0});h.engine.add({id:'B',type:'point',x:0,y:100});},clicks:[{x:100,y:0},{x:100,y:0},{x:0,y:100}]}
 ];
 for(const scenario of cases){
  const h=appRuntime();scenario.prepare(h);h.app.setTool('construct:'+scenario.tool);const complete=h.app.completeToolInteraction.bind(h.app);let completions=0,lastCompletion=null;
  h.app.completeToolInteraction=args=>{completions++;lastCompletion=args;return complete(args);};
  for(const point of scenario.clicks)h.down(point);
  const created=h.engine.model.objects.filter(o=>o.construction?.kind===scenario.tool);
  const createdIds=Array.from(created,o=>o.id);assert.equal(created.length,scenario.expectedCount||1,scenario.tool);assert.equal(completions,1,scenario.tool);assert.equal(lastCompletion.toolId,'construct:'+scenario.tool);assert.equal(lastCompletion.outcome.ok,true);assert.deepEqual(plain(lastCompletion.selection),createdIds,scenario.tool);
  assert.equal(h.app.tool,'select',scenario.tool);assert.equal(h.app.interaction,null,scenario.tool);assert.equal(h.app.selectedId,created[created.length-1].id,scenario.tool);assert.deepEqual(plain(h.app.selectedIds),createdIds,scenario.tool);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false,scenario.tool);assert.equal(h.engine.renderer.preview,null,scenario.tool);assert.equal(h.app.history.entries.length,1,scenario.tool);
  const after=plain(h.engine.toJSON());assert.equal(h.app.history.undo(),true,scenario.tool);assert.equal(h.engine.model.objects.some(o=>o.construction?.kind===scenario.tool),false,scenario.tool);assert.equal(h.app.history.redo(),true,scenario.tool);assert.deepEqual(plain(h.engine.toJSON()),after,scenario.tool);
 }
});

test('WIE-TOOL-L3.2 generic construction command refusal preserves sources for retry without completion',()=>{
 const h=appRuntime();h.engine.add({id:'Q',type:'point',x:2,y:2});h.app.setTool('construct:parallel');h.down({x:.5,y:1});const sources=plain(h.app.interaction.sources),before=plain(h.engine.toJSON()),execute=h.app.execute.bind(h.app),complete=h.app.completeToolInteraction.bind(h.app);let completions=0;
 h.app.completeToolInteraction=args=>{completions++;return complete(args);};h.app.execute=(operation,...args)=>{if(operation==='construction.create')throw Error('L3.2 denied');return execute(operation,...args);};h.down({x:2,y:2});
 assert.equal(completions,0);assert.equal(h.app.tool,'construct:parallel');assert.deepEqual(plain(h.app.interaction.sources),sources);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.match(h.app.nodes.status.textContent,/L3\.2 denied/);
 h.app.execute=execute;h.down({x:2,y:2});assert.equal(completions,1);assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.app.history.entries.length,1);assert.equal(h.engine.model.objects.filter(o=>o.construction?.kind==='parallel').length,1);
});

test('WIE-TOOL-L3.2 incomplete and invalid generic inputs do not complete',()=>{
 const h=appRuntime();h.app.setTool('construct:lineBetweenPoints');let completions=0;const complete=h.app.completeToolInteraction.bind(h.app);h.app.completeToolInteraction=args=>{completions++;return complete(args);};
 h.down({x:0,y:0});assert.equal(completions,0);assert.equal(h.app.tool,'construct:lineBetweenPoints');assert.equal(h.app.interaction.sources.length,1);assert.equal(h.app.history.entries.length,0);
 h.down({x:0,y:0});assert.equal(completions,0);assert.equal(h.app.tool,'construct:lineBetweenPoints');assert.equal(h.app.interaction.sources.length,1);assert.equal(h.app.history.entries.length,0);assert.match(h.app.nodes.status.textContent,/verschillende punten/);
});

test('WIE-TOOL-L3.3a point-on-object routes complete centrally for every supported source type',()=>{
 const cases=[
  {kind:'pointOnSegment',source:{id:'L',type:'line',x1:10,y1:10,x2:14,y2:10},sourceId:'L',first:{x:11,y:10},place:{x:12,y:10},parameter:.5},
  {kind:'pointOnSegment',source:{id:'P',type:'polygon',vertices:[{x:30,y:0},{x:34,y:0},{x:34,y:4},{x:30,y:4}]},sourceId:'P',part:'edge',first:{x:31,y:0},place:{x:32,y:0},parameter:.5},
  {kind:'pointOnCircle',source:{id:'C',type:'circle',cx:10,cy:0,r:2},sourceId:'C',first:{x:12,y:0},place:{x:10,y:2},parameter:.25},
  {kind:'pointOnEllipse',source:{id:'E',type:'ellipse',cx:20,cy:0,a:3,b:2,rotation:0},sourceId:'E',first:{x:23,y:0},place:{x:20,y:2},parameter:.25}
 ];
 for(const scenario of cases){
  const h=appRuntime();h.engine.add(scenario.source);h.app.setTool('construct:pointOnObject');const complete=h.app.completeToolInteraction.bind(h.app);let completions=0,last=null;h.app.completeToolInteraction=args=>{completions++;last=args;return complete(args);};
  h.down(scenario.first);assert.equal(h.app.tool,'construct:pointOnObject');assert.equal(h.app.interaction.pathPlacement,true);assert.equal(h.app.interaction.concreteKind,scenario.kind);assert.equal(h.app.history.entries.length,0);
  h.down(scenario.place);const created=h.engine.model.objects.find(o=>o.construction?.kind===scenario.kind&&o.construction?.sources?.[0]?.objectId===scenario.sourceId);
  assert.ok(created,scenario.kind);assert.equal(completions,1,scenario.kind);assert.equal(last.toolId,'construct:pointOnObject');assert.equal(last.outcome.ok,true);assert.deepEqual(plain(last.selection),[created.id]);assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.deepEqual(plain(h.app.selectedIds),[created.id]);assert.equal(h.engine.renderer.preview,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.app.history.entries.length,1);
  assert.ok(Math.abs(created.construction.parameter-scenario.parameter)<1e-8,scenario.kind);if(scenario.part)assert.equal(created.construction.sources[0].part,scenario.part);
  const saved=plain(h.engine.toJSON());h.app.travelHistory();assert.equal(h.engine.get(created.id),null);h.app.travelHistory(true);assert.deepEqual(plain(h.engine.toJSON()),saved);assert.equal(h.engine.get(created.id).construction.kind,scenario.kind);
 }
});

test('WIE-TOOL-L3.3a point-on-circle remains dynamically dependent on its source',()=>{
 const h=appRuntime();h.engine.add({id:'C',type:'circle',cx:10,cy:0,r:2});h.app.setTool('construct:pointOnObject');h.down({x:12,y:0});h.down({x:10,y:2});
 const point=h.engine.model.objects.find(o=>o.construction?.kind==='pointOnCircle');assert.ok(point);assert.equal(point.construction.sources[0].objectId,'C');assert.equal(point.construction.parameter,.25);assert.equal(point.x,10);assert.equal(point.y,2);
 h.engine.update('C',{cx:11,cy:3,r:4});assert.equal(h.engine.get(point.id).x,11);assert.equal(h.engine.get(point.id).y,7);assert.equal(h.engine.get(point.id).construction.sources[0].objectId,'C');
});

function ellipseByFociPlacement(existingControlPoint=false){
 const h=appRuntime();h.engine.add({id:'F2',type:'point',x:100,y:0});if(existingControlPoint)h.engine.add({id:'Q',type:'point',x:50,y:40});h.app.setTool('construct:ellipseByFociAndPoint');h.down({x:0,y:0});h.down({x:100,y:0});return h;
}

test('WIE-TOOL-L3.3b ellipse completes centrally for new and existing control points',()=>{
 for(const existingQ of [false,true]){
  const h=ellipseByFociPlacement(existingQ),complete=h.app.completeToolInteraction.bind(h.app);let completions=0,last=null;h.app.completeToolInteraction=args=>{completions++;last=args;return complete(args);};
  assert.equal(h.app.tool,'construct:ellipseByFociAndPoint');assert.equal(h.app.interaction.ellipsePlacement,true);assert.equal(h.app.history.entries.length,0);assert.equal(completions,0);
  const before=plain(h.engine.toJSON()),objectCount=h.engine.model.objects.length;
  if(!existingQ){h.move({x:50,y:40});assert.equal(h.engine.renderer.preview.type,'ellipse');assert.equal(h.engine.model.objects.length,objectCount);assert.equal(h.app.history.entries.length,0);}
  h.down({x:50,y:40});
  const ellipse=h.engine.model.objects.find(o=>o.construction?.kind==='ellipseByFociAndPoint');assert.ok(ellipse);assert.equal(completions,1);assert.equal(last.toolId,'construct:ellipseByFociAndPoint');assert.equal(last.origin,'canvas');assert.equal(last.outcome.ok,true);assert.deepEqual(plain(last.selection),[ellipse.id]);
  const sourceIds=plain(ellipse.construction.sources.map(ref=>ref.objectId));assert.deepEqual(sourceIds.slice(0,2),['p','F2']);if(existingQ)assert.equal(sourceIds[2],'Q');
  const controlId=ellipse.construction.sources[2].objectId,control=h.engine.get(controlId);assert.equal(control.type,'point');assert.deepEqual(plain(h.app.selectedIds),[ellipse.id]);assert.equal(h.app.selectedId,ellipse.id);assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.engine.renderer.preview,null);assert.equal(h.app.feedback,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.app.history.entries.length,1);
  if(!existingQ){assert.equal(h.engine.model.objects.length,objectCount+2);assert.equal(control.x,50);assert.equal(control.y,40);}
  else assert.equal(h.engine.model.objects.length,objectCount+1);
  const saved=plain(h.engine.toJSON());h.app.travelHistory();assert.deepEqual(plain(h.engine.toJSON()),before);h.app.travelHistory(true);assert.deepEqual(plain(h.engine.toJSON()),saved);assert.equal(h.engine.get(ellipse.id).construction.sources[2].objectId,controlId);
  const original=h.engine.get(ellipse.id),oldCx=original.cx,oldA=original.a;h.engine.update('F2',{x:110});assert.notEqual(h.engine.get(ellipse.id).cx,oldCx);assert.notEqual(h.engine.get(ellipse.id).a,oldA);const changedA=h.engine.get(ellipse.id).a;h.engine.update(controlId,{y:45});assert.notEqual(h.engine.get(ellipse.id).a,changedA);
 }
});

test('WIE-TOOL-L3.3b invalid Q stays in placement and Escape cancels without completion',()=>{
 const h=ellipseByFociPlacement(),complete=h.app.completeToolInteraction.bind(h.app);let completions=0;h.app.completeToolInteraction=args=>{completions++;return complete(args);};const before=plain(h.engine.toJSON()),state=h.app.interaction;
 h.down({x:50,y:0});assert.equal(h.app.tool,'construct:ellipseByFociAndPoint');assert.equal(h.app.interaction,state);assert.equal(h.engine.renderer.preview.type,'ellipse-invalid');assert.equal(h.app.history.entries.length,0);assert.equal(completions,0);assert.deepEqual(plain(h.engine.toJSON()),before);
 h.move({x:50,y:40});assert.equal(h.engine.renderer.preview.type,'ellipse');h.emit(h.win,'keydown',{key:'Escape'});assert.equal(completions,0);assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.engine.renderer.preview,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.app.history.entries.length,0);assert.deepEqual(plain(h.engine.toJSON()),before);
});

test('WIE-TOOL-L3.3b failure after candidate Q creation is atomic and retry completes once',()=>{
 const h=ellipseByFociPlacement(),before=plain(h.engine.toJSON()),state=h.app.interaction,complete=h.app.completeToolInteraction.bind(h.app);let completions=0,candidateQAdded=false,constructCalls=0;h.app.completeToolInteraction=args=>{completions++;return complete(args);};
 const add=h.MI.Engine.prototype.add,construct=h.MI.Engine.prototype.construct;
 h.MI.Engine.prototype.add=function(object){const created=add.call(this,object);if(object.type==='point'&&object.x===50&&object.y===40)candidateQAdded=true;return created;};
 h.MI.Engine.prototype.construct=function(kind,...args){if(kind==='ellipseByFociAndPoint'){constructCalls++;assert.equal(candidateQAdded,true);assert.ok(this.model.objects.some(object=>object.type==='point'&&object.x===50&&object.y===40));throw Error('L3.3b injected ellipse failure after candidate Q');}return construct.call(this,kind,...args);};
 try{h.down({x:50,y:40});}finally{h.MI.Engine.prototype.add=add;h.MI.Engine.prototype.construct=construct;}
 assert.equal(constructCalls,1);assert.equal(completions,0);assert.equal(h.app.tool,'construct:ellipseByFociAndPoint');assert.equal(h.app.interaction,state);assert.deepEqual(plain(state.sources),[{objectId:'p'},{objectId:'F2'}]);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.engine.renderer.preview.type,'ellipse');assert.match(h.app.nodes.status.textContent,/injected ellipse failure/);
 h.down({x:50,y:40});const ellipse=h.engine.model.objects.find(object=>object.construction?.kind==='ellipseByFociAndPoint');assert.ok(ellipse);assert.equal(completions,1);assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.engine.renderer.preview,null);assert.equal(h.app.history.entries.length,1);assert.equal(h.engine.model.objects.filter(object=>object.type==='point'&&object.x===50&&object.y===40).length,1);
});

test('WIE-TOOL-L3.3a point-on-object command failure and invalid projection preserve retry state',()=>{
 const h=appRuntime();const before=plain(h.engine.toJSON());h.app.setTool('construct:pointOnObject');h.down({x:.5,y:1});const state=h.app.interaction,execute=h.app.execute.bind(h.app),complete=h.app.completeToolInteraction.bind(h.app);let completions=0;
 h.app.completeToolInteraction=args=>{completions++;return complete(args);};h.app.execute=(operation,...args)=>{if(operation==='construction.create')throw Error('L3.3a denied');return execute(operation,...args);};h.down({x:.6,y:1});
 assert.equal(completions,0);assert.equal(h.app.tool,'construct:pointOnObject');assert.equal(h.app.interaction,state);assert.deepEqual(plain(state.sources),[{objectId:'l'}]);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.match(h.app.nodes.status.textContent,/L3\.3a denied/);
 h.app.execute=execute;h.down({x:.6,y:1});assert.equal(completions,1);assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.app.history.entries.length,1);assert.equal(h.engine.model.objects.filter(o=>o.construction?.kind==='pointOnSegment').length,1);

 const invalid=appRuntime();invalid.engine.add({id:'C',type:'circle',cx:0,cy:0,r:1000});invalid.app.setTool('construct:pointOnObject');const original=plain(invalid.engine.toJSON()),finish=invalid.app.completeToolInteraction.bind(invalid.app);let invalidCompletions=0;invalid.app.completeToolInteraction=args=>{invalidCompletions++;return finish(args);};
 invalid.down({x:1000,y:0});const placement=invalid.app.interaction;invalid.down({x:0,y:0});assert.equal(invalidCompletions,0);assert.equal(invalid.app.tool,'construct:pointOnObject');assert.equal(invalid.app.interaction,placement);assert.deepEqual(plain(invalid.engine.toJSON()),original);assert.equal(invalid.app.history.entries.length,0);assert.match(invalid.app.nodes.status.textContent,/binnen 12 pixels/);
 invalid.down({x:0,y:1000});assert.equal(invalidCompletions,1);assert.equal(invalid.app.tool,'select');assert.equal(invalid.engine.model.objects.filter(o=>o.construction?.kind==='pointOnCircle').length,1);assert.equal(invalid.app.history.entries.length,1);
});

test('WIE-TOOL-L3.3a unsupported source and Escape never complete point-on-object placement',()=>{
 const h=appRuntime();h.engine.add({id:'S',type:'straight',x1:40,y1:40,x2:50,y2:40});h.app.setTool('construct:pointOnObject');let completions=0;const complete=h.app.completeToolInteraction.bind(h.app);h.app.completeToolInteraction=args=>{completions++;return complete(args);};const before=plain(h.engine.toJSON());
 h.down({x:45,y:40});assert.equal(h.app.tool,'construct:pointOnObject');assert.equal(h.app.interaction,null);assert.equal(completions,0);assert.deepEqual(plain(h.engine.toJSON()),before);assert.equal(h.app.history.entries.length,0);assert.match(h.app.nodes.status.textContent,/lijn, veelhoekzijde, cirkel of ellips/);
 h.down({x:.5,y:1});assert.equal(h.app.interaction.pathPlacement,true);h.emit(h.win,'keydown',{key:'Escape'});assert.equal(completions,0);assert.equal(h.app.tool,'select');assert.equal(h.app.interaction,null);assert.equal(h.engine.renderer.preview,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.app.history.entries.length,0);
});

test('WIE-TOOL-L2 Snijpunt and context-complete remain outside central completion',()=>{
 const h=appRuntime();h.engine.add({id:'S',type:'straight',x1:-3,y1:1,x2:3,y2:1});h.engine.add({id:'C',type:'circle',cx:0,cy:1,r:2});const complete=h.app.completeToolInteraction.bind(h.app);let completions=0;h.app.completeToolInteraction=args=>{completions++;return complete(args);};
 h.app.setTool('construct:intersection');h.app.interaction={mode:'construction',sources:[],selectionIdsBefore:[]};h.app.acceptIntersectionSource({objectId:'S'});h.app.acceptIntersectionSource({objectId:'C'});assert.equal(completions,0);assert.equal(h.app.intersectionCompleted,true);assert.equal(h.app.selectedIds.length,2);
 const g=appRuntime();g.app.setTool('line');g.app.selectedId='l';g.app.toolCatalog={...g.app.toolCatalog,getTool:id=>({id})};const plan=g.MI.ConstructionService.contextualPlans(g.engine.get('l'),'midpoint').find(p=>p.mode==='complete');assert.equal(g.app.startContextConstruction('construct:midpoint','l',plan.key),true);assert.equal(completions,0);assert.equal(g.app.tool,'line');
});

test('WIE-TOOL-L3.1 free point and shared draw routes keep repeat tools active',()=>{
 const point=appRuntime();point.app.setTool('point');for(const p of [{x:3,y:1},{x:3,y:-1}]){point.down(p);assert.equal(point.app.tool,'point');assert.equal(point.app.interaction,null);assert.equal(point.engine.renderer.preview,null);}assert.equal(point.engine.model.objects.filter(o=>o.type==='point').length,3);assert.equal(point.app.history.entries.length,2);
 for(const tool of ['straight','ray','vector','circle','dimension']){
  const h=appRuntime();h.app.setTool(tool);
  for(const [index,y] of [1,-1].entries()){h.down({x:2,y});h.move({x:4,y:y+.75});h.app.commit();assert.equal(h.app.tool,tool,tool+' completion '+index);assert.equal(h.app.interaction,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.engine.renderer.preview,null);}
  assert.equal(h.engine.model.objects.filter(o=>o.type===tool).length,2,tool);assert.equal(h.app.history.entries.length,2,tool);
  if(tool==='dimension'){const measured=h.engine.model.objects.filter(o=>o.type==='dimension'),settings=h.MI.MeasurementGeometry.defaultMeasurementSettings(measured[0]);assert.equal(h.MI.MeasurementGeometry.measurementValue(measured[0],'length'),Math.hypot(measured[0].x2-measured[0].x1,measured[0].y2-measured[0].y1));assert.equal(settings.values.length.visible,true);}
  const after=plain(h.engine.toJSON());assert.equal(h.app.history.undo(),true,tool+' undo');assert.equal(h.engine.model.objects.filter(o=>o.type===tool).length,1,tool);assert.equal(h.app.history.redo(),true,tool+' redo');assert.deepEqual(plain(h.engine.toJSON()),after,tool);
 }
});

test('WIE-TOOL-L3.1 triangle polygon angle and right angle complete only on their final input',()=>{
 for(const tool of ['triangle','angle','rightAngle']){
  const h=appRuntime();h.app.setTool(tool);h.down({x:2,y:-1});assert.ok(h.app.interaction);h.down({x:3,y:0});assert.ok(h.app.interaction);h.down({x:4,y:-1});
  assert.equal(h.app.tool,tool);assert.equal(h.app.interaction,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.engine.renderer.preview,null);assert.equal(h.app.history.entries.length,1);
  const created=h.engine.model.objects.filter(o=>o.type===(tool==='triangle'?'polygon':'angle'));assert.equal(created.length,1);assert.equal(h.app.selectedId,created[0].id);assert.deepEqual(plain(h.app.selectedIds),[created[0].id]);
 }
 const h=appRuntime();h.app.setTool('polygon');for(const p of [{x:2,y:-1},{x:4,y:-1},{x:4,y:1}])h.down(p);assert.ok(h.app.interaction);assert.equal(h.app.history.entries.length,0);h.app.keyDown({key:'Enter',preventDefault(){}});
 assert.equal(h.app.tool,'polygon');assert.equal(h.app.interaction,null);assert.equal(h.app.engine.renderer.preview,null);assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);assert.equal(h.engine.model.objects.filter(o=>o.type==='polygon').length,1);assert.equal(h.app.history.entries.length,1);
});

test('WIE-TOOL-L3.1 command failures do not complete or add geometry and can be retried',()=>{
 const cases=[
  {tool:'point',place(h){h.down({x:3,y:1});}},
  {tool:'line',place(h){h.down({x:2,y:-1});h.move({x:4,y:0});h.app.commit();}},
  {tool:'straight',place(h){h.down({x:2,y:-1});h.move({x:4,y:0});h.app.commit();}},
  {tool:'polygon',place(h){for(const p of [{x:2,y:-1},{x:4,y:-1},{x:4,y:1}])h.down(p);h.app.keyDown({key:'Enter',preventDefault(){}});},retry(h){h.app.keyDown({key:'Enter',preventDefault(){}});}}
 ];
 for(const scenario of cases){
  const h=appRuntime();h.app.setTool(scenario.tool);const before=plain(h.engine.toJSON()),execute=h.app.execute.bind(h.app),completion=h.app.completeToolInteraction.bind(h.app);let successes=0;
  h.app.completeToolInteraction=args=>{const result=completion(args);if(args.outcome?.ok&&result)successes++;return result;};h.app.execute=()=>{throw Error('L3.1 denied '+scenario.tool);};scenario.place(h);
  assert.equal(h.app.tool,scenario.tool,scenario.tool);assert.equal(successes,0,scenario.tool);assert.deepEqual(plain(h.engine.toJSON()),before,scenario.tool);assert.equal(h.app.history.entries.length,0,scenario.tool);assert.match(h.app.nodes.status.textContent,/L3\.1 denied/);
  if(scenario.tool==='polygon'){assert.equal(h.app.interaction.mode,'polygon');assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);}
  h.app.execute=execute;(scenario.retry||scenario.place)(h);assert.equal(successes,1,scenario.tool);assert.equal(h.app.tool,scenario.tool,scenario.tool);assert.equal(h.app.interaction,null,scenario.tool);assert.equal(h.app.history.entries.length,1,scenario.tool);
  const after=plain(h.engine.toJSON());assert.equal(h.app.history.undo(),true,scenario.tool);assert.deepEqual(plain(h.engine.toJSON()),before,scenario.tool);assert.equal(h.app.history.redo(),true,scenario.tool);assert.deepEqual(plain(h.engine.toJSON()),after,scenario.tool);
 }
});

test('WIE-TOOL-L3.1 invalid triangle geometry remains distinct from a command refusal',()=>{
 const h=appRuntime();h.app.setTool('triangle');let successes=0;const completion=h.app.completeToolInteraction.bind(h.app);h.app.completeToolInteraction=args=>{const result=completion(args);if(args.outcome?.ok&&result)successes++;return result;};
 for(const p of [{x:2,y:0},{x:3,y:0},{x:4,y:0}])h.down(p);assert.equal(h.app.tool,'triangle');assert.equal(h.app.interaction.mode,'polygon');assert.equal(successes,0);assert.equal(h.app.history.entries.length,0);assert.match(h.app.nodes.status.textContent,/driehoek|hoekpunt|oppervlakte|geldig|zijden mogen niet teruglopen/i);
 h.emit(h.win,'pointerup',{pointerId:1});assert.equal(h.app.nodes.canvasWrap.hasPointerCapture(1),false);h.app.keyDown({key:'Backspace',preventDefault(){}});h.down({x:3,y:1});
 assert.equal(h.app.tool,'triangle');assert.equal(h.app.interaction,null);assert.equal(successes,1);assert.equal(h.engine.model.objects.filter(o=>o.type==='polygon').length,1);assert.equal(h.app.history.entries.length,1);
});
