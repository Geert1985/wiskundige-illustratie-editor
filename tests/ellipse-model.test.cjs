const test=require('node:test');
const assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs');

function setup(){const MI=runtime(['model.js','renderer.js','index.js']).MI;return {MI,e:new MI.Engine({type:'geometry',version:2,objects:[]})};}
const pts=[{objectId:'F1'},{objectId:'F2'}];

test('ellipseByFociAndSum is typed, persisted as v9 schema 1 / construction schema 6, and recomputed dynamically',()=>{
  const {MI,e}=setup();e.add({id:'F1',type:'point',x:-3,y:0});e.add({id:'F2',type:'point',x:3,y:0});
  const ellipse=e.construct('ellipseByFociAndSum',pts,10)[0];
  assert.equal(ellipse.type,'ellipse');assert.equal(ellipse.a,5);assert.equal(ellipse.b,4);assert.equal(ellipse.ellipseArea,20*Math.PI);
  let json=plain(e.toJSON());assert.equal(json.version,9);assert.equal(json.ellipseSchema,1);assert.equal(json.constructionSchema,6);
  const saved=json.objects.find(o=>o.id===ellipse.id);for(const key of ['cx','cy','a','b','rotation','c','e','ellipseArea','ellipseBounds'])assert.equal(key in saved,false);
  const loaded=new MI.Engine(json);assert.equal(loaded.get(ellipse.id).b,4);assert.equal(loaded.get(ellipse.id).id,ellipse.id);
  e.update('F2',{x:7});assert.equal(e.get(ellipse.id).constructionValid,false);assert.equal(e.getConstructionInfo(ellipse.id).reasonCode,'DEGENERATE_ELLIPSE');
  assert.equal('a' in e.get(ellipse.id),false);
  e.update('F2',{x:3});assert.equal(e.get(ellipse.id).constructionValid,true);assert.equal(e.get(ellipse.id).id,ellipse.id);assert.equal(e.get(ellipse.id).b,4);
  assert.throws(()=>e.construct('ellipseByFociAndSum',pts,6),/bestaat niet|constructie/i);
});

test('ellipse import rejects cached linked geometry and inconsistent schema atomically',()=>{
  const {MI,e}=setup();e.add({id:'F1',type:'point',x:-3,y:0});e.add({id:'F2',type:'point',x:3,y:0});const linked=e.construct('ellipseByFociAndSum',pts,10)[0],saved=plain(e.toJSON());
  const stale=plain(saved);stale.objects.find(o=>o.id===linked.id).a=5;assert.throws(()=>new MI.IllustrationModel(stale),/berekende geometrie/i);
  for(const bad of [{version:8},{ellipseSchema:2},{constructionSchema:5}]){const data=plain(saved);Object.assign(data,bad);assert.throws(()=>new MI.IllustrationModel(data));}
  const target=plain(e.toJSON());assert.throws(()=>e.load({...target,ellipseSchema:2}));assert.deepEqual(plain(e.toJSON()),target);
});

test('standalone ellipse definition is valid data; detaching and duplicating linked ellipses preserve shape without focus links',()=>{
  const {MI,e}=setup();e.add({id:'F1',type:'point',x:-3,y:0});e.add({id:'F2',type:'point',x:3,y:0});
  const linked=e.construct('ellipseByFociAndSum',pts,10)[0],detached=e.detachConstructions([linked.id])[0];
  assert.equal(detached.type,'ellipse');assert.equal(detached.construction,undefined);assert.equal(detached.a,5);assert.equal(detached.b,4);
  const free=e.add({type:'ellipse',cx:10,cy:20,a:5,b:4,rotation:Math.PI/3});assert.equal(free.c,3);assert.ok(Math.abs(free.ellipseArea-20*Math.PI)<1e-13);
  const copies=e.duplicateMany([linked.id,free.id]);
  assert.equal(copies[0].construction,undefined);assert.equal(copies[0].cx,linked.cx+.5);assert.equal(copies[0].cy,linked.cy+.5);assert.equal(copies[0].a,linked.a);assert.equal(copies[0].b,linked.b);
  assert.equal(copies[1].construction,undefined);assert.equal(copies[1].rotation,free.rotation);assert.equal(copies[1].cx,free.cx+.5);
  e.group(['F1','F2',linked.id],'ellipse group');const grouped=e.duplicateMany(['F1','F2',linked.id]);assert.equal(grouped[2].construction,undefined);assert.equal(grouped[2].a,linked.a);
  const json=plain(e.toJSON());assert.equal(json.version,9);assert.ok(json.objects.filter(o=>o.type==='ellipse'&&!o.construction).every(o=>Number.isFinite(o.cx)&&Number.isFinite(o.a)));
});

test('free ellipses enforce canonical definition parameters and full coordinate bounds',()=>{
  const {e}=setup();
  for(const patch of [{a:0},{b:6},{rotation:Infinity},{cx:1e12,a:5}])assert.throws(()=>e.add({type:'ellipse',cx:0,cy:0,a:5,b:4,rotation:0,...patch}));
});
