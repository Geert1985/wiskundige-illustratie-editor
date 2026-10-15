const test=require('node:test');
const assert=require('node:assert/strict');
const {runtime}=require('./helpers.cjs');

function core(){return runtime(['model.js','ellipse-geometry.js']).MI.EllipseGeometry;}
const recipe=sumDistance=>({kind:'ellipseByFociAndSum',sumDistance});
const point=(x,y)=>({type:'point',x,y});

test('classic ellipse agrees with independent focus-sum and area oracles',()=>{
  const g=core().assertCreatable(recipe(10),[point(-3,0),point(3,0)]);
  assert.equal(g.geometry.center.x,0);assert.equal(g.geometry.center.y,0);
  assert.equal(g.geometry.a,5);assert.equal(g.geometry.b,4);assert.equal(g.geometry.c,3);assert.equal(g.geometry.e,.6);
  assert.ok(Math.abs(g.area-20*Math.PI)<1e-13);
  for(let i=0;i<32;i++){
    const p=g.geometry.pointAt(i/32),d1=Math.hypot(p.x+3,p.y),d2=Math.hypot(p.x-3,p.y);
    assert.ok(Math.abs(d1+d2-10)<1e-12);
  }
});

test('vertical foci rotate major axis and preserve canonical circle orientation',()=>{
  const vertical=core().resolve(recipe(10),[point(0,-3),point(0,3)]);
  assert.equal(vertical.reasonCode,'VALID');assert.ok(Math.abs(vertical.geometry.rotation-Math.PI/2)<1e-15);
  assert.ok(Math.abs(vertical.geometry.pointAt(0).x)<1e-14);assert.equal(vertical.geometry.pointAt(0).y,5);
  const circle=core().resolve(recipe(10),[point(0,0),point(0,0)]);
  assert.equal(circle.reasonCode,'VALID');assert.equal(circle.geometry.a,circle.geometry.b);
  assert.equal(circle.geometry.u.x,1);assert.equal(circle.geometry.u.y,0);assert.equal(circle.geometry.v.x,0);assert.equal(circle.geometry.v.y,1);
  assert.equal(circle.geometry.e,0);assert.equal(circle.area,25*Math.PI);
});

test('new creation rejects impossible and degenerate sums while resolution reports reasons',()=>{
  const sources=[point(-3,0),point(3,0)];
  assert.equal(core().resolve(recipe(5),sources).reasonCode,'SUM_TOO_SMALL');
  assert.equal(core().resolve(recipe(6),sources).reasonCode,'DEGENERATE_ELLIPSE');
  assert.throws(()=>core().assertCreatable(recipe(5),sources),e=>e.code==='SUM_TOO_SMALL');
  assert.throws(()=>core().assertCreatable(recipe(6),sources),e=>e.code==='DEGENERATE_ELLIPSE');
  assert.equal(core().assertCreatable(recipe(6+Number.EPSILON*8),sources).reasonCode,'VALID');
});

test('translation preserves intrinsic geometry and rotates the contour analytically',()=>{
  const a=core().resolve(recipe(10),[point(-3,0),point(3,0)]),b=core().resolve(recipe(10),[point(997,-2000),point(1003,-2000)]);
  for(const key of ['a','b','c','e'])assert.equal(a.geometry[key],b.geometry[key]);
  assert.equal(b.geometry.center.x,1000);assert.equal(b.geometry.center.y,-2000);
  const p=b.geometry.pointAt(.25);assert.ok(Math.abs(p.x-1000)<1e-12);assert.ok(Math.abs(p.y+1996)<1e-12);
  const rotated=core().resolve(recipe(10),[point(-3/Math.sqrt(2),-3/Math.sqrt(2)),point(3/Math.sqrt(2),3/Math.sqrt(2))]);
  assert.equal(rotated.reasonCode,'VALID');assert.equal(rotated.geometry.a,5);assert.equal(rotated.geometry.b,4);
});

test('validity uses strict representable inequality instead of a broad epsilon rejection',()=>{
  const f1=point(-1e6,0),f2=point(1e6,0),sum=2e6+Number.EPSILON*2e6;
  const result=core().resolve(recipe(sum),[f1,f2]);
  assert.equal(result.reasonCode,'VALID');assert.ok(result.geometry.b>0);assert.ok(result.geometry.b<1e6);
});

test('full ellipse bounds enforce coordinate limits and reject malformed sources',()=>{
  assert.equal(core().resolve(recipe(10),[point(1e12-1,0),point(1e12-1,0)]).reasonCode,'COORDINATE_LIMIT');
  assert.equal(core().resolve(recipe(10),[point(0,0),point(NaN,0)]).reasonCode,'SOURCE_INVALID');
  assert.equal(core().resolve({kind:'other',sumDistance:10},[point(0,0),point(1,0)]).reasonCode,'INVALID_REFERENCE');
  assert.equal(core().resolve(recipe(0),[point(0,0),point(0,0)]).reasonCode,'SUM_NOT_POSITIVE');
});
