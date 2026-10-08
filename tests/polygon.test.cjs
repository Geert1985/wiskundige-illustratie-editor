const test = require('node:test');
const assert = require('node:assert/strict');
const { runtime, plain, fixture } = require('./helpers.cjs');
const vertices = [{x:0,y:0},{x:2,y:0},{x:2,y:2},{x:0,y:2}];
test('polygon geometry roundtrips as immutable version 2 geometry with styles and extensions', () => {
  const {MI}=runtime(); const e=new MI.Engine(); const o=e.add({type:'polygon',vertices,extra:{tag:'keep'},style:{fill:'#abcdef'}});
  vertices[0].x=99; assert.equal(e.get(o.id).vertices[0].x,0); vertices[0].x=0;
  assert.equal(Object.isFrozen(e.model.objects[0].vertices[0]),true);
  const copy=new MI.Engine(e.toJSON()); assert.deepEqual(plain(copy.toJSON()),plain(e.toJSON()));
  assert.match(e.renderSVG(),/<polygon /); assert.match(e.renderSVG(),/fill="#abcdef"/);
});
test('invalid, repeated, collapsed, crossed and excessive polygons are rejected atomically',()=>{
  const {MI}=runtime(); const e=new MI.Engine(); const before=plain(e.toJSON());
  for(const points of [[],vertices.slice(0,2),[{x:0,y:0},{x:1,y:0},{x:2,y:0}], [{x:0,y:0},{x:1,y:1},{x:0,y:1},{x:1,y:0}], [{x:0,y:0},{x:1,y:0},{x:0,y:0}], [{x:NaN,y:0},...vertices], Array(257).fill({x:0,y:0})]) {
    assert.throws(()=>e.add({type:'polygon',vertices:points})); assert.deepEqual(plain(e.toJSON()),before);
  }
  const o=e.add({type:'polygon',vertices}); assert.throws(()=>e.update(o.id,{vertices:[]})); assert.deepEqual(plain(e.get(o.id).vertices),vertices);
});
test('polygon selection covers boundary and interior and rigid moves preserve all edge vectors',()=>{
  const {MI}=runtime(); const e=new MI.Engine({objects:[{id:'poly',type:'polygon',vertices}]});
  assert.equal(e.selectAt(1,1,.01).object.id,'poly'); assert.equal(e.selectAt(2.005,1,.01).object.id,'poly'); assert.equal(e.selectAt(3,3,.01),null);
  const transform=new MI.CoordinateTransform(e.renderer); assert.equal(e.selectAt(1,1,{transform,tolerancePx:8}).object.id,'poly');
  e.move('poly',3,4); assert.deepEqual(plain(e.get('poly').vertices),vertices.map(p=>({x:p.x+3,y:p.y+4})));
  e.update('poly',{visible:false}); assert.equal(e.selectAt(4,5),null); assert.doesNotMatch(e.renderSVG(),/data-object-id="poly"/);
});
test('polygon vertices and edge intersections use the existing priorities, exclusion and cache invalidation',()=>{
  const {MI}=runtime(); const e=new MI.Engine({objects:[{id:'poly',type:'polygon',vertices},{id:'l',type:'line',x1:1,y1:-1,x2:1,y2:3},{id:'c',type:'circle',cx:2,cy:1,r:.5}]},{showGrid:false});
  const list=MI.SnapService.candidates(e); assert.ok(list.some(c=>c.kind==='line-endpoint'&&c.x===0&&c.y===0));
  assert.ok(list.some(c=>c.kind==='line-line-intersection'&&c.x===1&&c.y===0)); assert.ok(list.some(c=>c.kind==='line-circle-intersection'&&c.x===2&&c.y===.5));
  assert.ok(MI.SnapService.candidates(e,'poly').every(c=>!c.ids.includes('poly')));
  e.move('poly',5,5); assert.ok(!MI.SnapService.candidates(e).some(c=>c.kind==='line-endpoint'&&c.x===0&&c.y===0));
});
test('polygon resolver translates rigidly and refuses invalid vertex moves with preview matching commit',()=>{
  const {MI}=runtime(); const e=new MI.Engine({objects:[{id:'poly',type:'polygon',vertices}]},{showGrid:true}); const polygon=e.get('poly');
  const result=MI.InteractionResolver.translatePolygon(e,polygon,{x:.99,y:1.01});
  assert.deepEqual(plain(result.patch.vertices),vertices.map(p=>({x:p.x+1,y:p.y+1})));
  const valid=MI.InteractionResolver.polygonVertex(e,polygon,0,{x:-.98,y:-1.01}); assert.equal(valid.patch.vertices[0].x,-1);
  const invalid=MI.InteractionResolver.polygonVertex(e,polygon,0,{x:2,y:2}); assert.deepEqual(plain(invalid.patch.vertices),vertices); assert.equal(invalid.result.constraint,'valid-polygon');
});
test('triangle and concave fixtures preserve winding, label anchor and extension data',()=>{
  const {MI}=runtime();const e=new MI.Engine(fixture('polygons-v2.json'));
  assert.ok(e.selectAt(.5,1,.01));assert.equal(e.selectAt(2.5,1,.01),null);
  const before=plain(e.toJSON());e.update('concave',{vertices:e.get('concave').vertices.reverse()});assert.ok(e.selectAt(.5,1,.01));
  assert.match(e.renderSVG(),/data-label-id="triangle"/);e.load(before);assert.deepEqual(plain(e.toJSON()),before);
});
