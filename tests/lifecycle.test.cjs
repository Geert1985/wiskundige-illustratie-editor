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
  for (const file of ['editor-adaptive-grid.js', 'editor-label-drag.js', 'editor-enhancements.js', 'snap-indicator.js', 'editor-color.js', 'editor-axis-settings.js']) {
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
  const files = ['editor.js', 'editor-bootstrap.js', 'editor-adaptive-grid.js', 'editor-axis-settings.js', 'editor-color.js', 'editor-label-drag.js', 'editor-enhancements.js', 'snap-indicator.js'];
  const source = files.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.equal((source.match(/canvas\.innerHTML\s*=/g) || []).length, 1);
  assert.equal((source.match(/"pointerdown"/g) || []).length, 1);
  assert.doesNotMatch(source, /prototype\.renderSVG|prototype\.renderAxes|MutationObserver|installEngineTracker|trackEngine|adaptiveGridEngine|"mousedown"|"mousemove"|"mouseup"/);
  assert.equal((source.match(/MI\.activeEngine\s*=/g) || []).length, 1);
});

// The lifecycle API is exercised without relying on a real DOM parser.
function appRuntime() {
  const { MI, context } = runtime();
  vm.runInContext(fs.readFileSync(path.join(root, 'editor.js'), 'utf8'), context);
  const events = new Map();
  function target() { return { value: '', style: {}, dataset: {}, events: new Map(), classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(type, fn) { (this.events.get(type) || (this.events.set(type, new Set()), this.events.get(type))).add(fn); },
    removeEventListener(type, fn) { this.events.get(type)?.delete(fn); },
    querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0 }), contains: () => true,
    setPointerCapture(id) { this.capture = id; }, hasPointerCapture(id) { return this.capture === id; }, releasePointerCapture() { this.capture = null; } }; }
  const nodes = new Map(), win = target();
  const doc = { getElementById(id) { if (!nodes.has(id)) nodes.set(id, target()); return nodes.get(id); }, querySelectorAll: () => [], addEventListener() {}, removeEventListener() {}, activeElement: { tagName: 'BODY' } };
  doc.getElementById('canvas').querySelector = selector => selector === 'svg' ? { getScreenCTM: () => ({ a: .5, d: .5, b: 0, c: 0, e: 0, f: 0 }), querySelector: () => null } : null;
  const engine = new MI.Engine({ objects: [{ id: 'p', type: 'point', x: 0, y: 0, showLabel: true }, { id: 'l', type: 'line', x1: 0, y1: 1, x2: 1, y2: 1, showLabel: true }] });
  const app = new MI.EditorApp({ engine, document: doc, window: win, storage: { getItem: () => null }, services: { transform: MI.CoordinateTransform, snap: MI.SnapService, resolver: MI.InteractionResolver } });
  app.init();
  const emit = (node, type, values = {}) => [...(node.events.get(type) || [])].forEach(fn => fn({ pointerId: 1, button: 0, preventDefault() {}, ...values }));
  const screen = p => new MI.CoordinateTransform(engine.renderer, { a: .5, d: .5 }).mathToScreen(p);
  const down = (point, target = null, pointerId = 1) => { const p = screen(point); emit(doc.getElementById('canvasWrap'), 'pointerdown', { clientX: p.x, clientY: p.y, target, pointerId }); };
  const move = (point, pointerId = 1) => { const p = screen(point); emit(win, 'pointermove', { clientX: p.x, clientY: p.y, pointerId }); };
  return { MI, engine, app, doc, win, emit, down, move };
}
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
  h.emit(h.doc.getElementById('canvasWrap'),'contextmenu',{preventDefault(){blocked=true;}});assert.equal(blocked,false);
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
test('style inspector edits font size and stroke without replacing other style fields',()=>{
  const {app,engine,emit,doc}=appRuntime();const o=engine.add({type:'text',x:1,y:1,text:'T',style:{fontSize:16,extension:{keep:true}}});app.selectedId=o.id;app.invalidate();
  assert.match(doc.getElementById('selectionPanel').innerHTML,/data-style="fontSize"/);
  const input={dataset:{style:'fontSize'},type:'number',valueAsNumber:30};input.closest=()=>input;
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
test('text form commits the captured snap position once and Escape discards pending text', () => {
  const { app, engine, down, emit, win } = appRuntime();
  app.nodes.textDialog.showModal = function() { this.open = true; };
  app.nodes.textDialog.close = function() { this.open = false; };
  app.nodes.textValue.focus = () => {};
  app.setTool('text'); down({ x: 2, y: 2 });
  const position = plain(app.pendingText.point); assert.equal(app.interaction, null);
  app.nodes.textValue.value = '  Testtekst  '; app.submitText();
  const object = engine.get(app.selectedId); assert.equal(object.text, 'Testtekst');
  assert.equal(object.x, position.x); assert.equal(object.y, position.y); assert.equal(app.history.entries.length, 1);
  app.travelHistory(); assert.equal(engine.get(object.id), null); app.travelHistory(true); assert.ok(engine.get(object.id));
  down({ x: 3, y: 2 }); emit(win, 'keydown', { key: 'Escape' });
  assert.equal(app.pendingText, null); assert.equal(app.nodes.textDialog.open, false); assert.equal(app.history.entries.length, 1);
});
test('empty text is not committed and New clears a pending text form', () => {
  const { app, engine, down } = appRuntime();
  app.nodes.textDialog.showModal = function() { this.open = true; };
  app.nodes.textDialog.close = function() { this.open = false; };
  app.nodes.textValue.focus = () => {};
  app.setTool('text'); down({ x: 2, y: 2 }); app.nodes.textValue.value = '   '; app.submitText();
  assert.equal(engine.model.objects.length, 2); assert.equal(app.history.canUndo, false);
  app.newDocument(); assert.equal(app.pendingText, null); assert.equal(app.nodes.textDialog.open, false); assert.equal(engine.model.objects.length, 0);
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
