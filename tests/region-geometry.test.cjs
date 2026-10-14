const test=require('node:test');
const assert=require('node:assert/strict');
const {runtime}=require('./helpers.cjs');

function env(){return runtime(['model.js','renderer.js','index.js']);}
test('polygonRegion computes stable positive area and preserves polygon sources',()=>{
  const {MI}=env();
  for(const vertices of [
    [{x:0,y:0},{x:4,y:0},{x:4,y:3},{x:0,y:3}],
    [{x:1e9,y:-1e9},{x:1e9+4,y:-1e9},{x:1e9+4,y:-1e9+3},{x:1e9,y:-1e9+3}],
    [{x:0,y:0},{x:4,y:0},{x:2,y:1},{x:4,y:3},{x:0,y:3}],
  ]){const result=MI.RegionGeometry.resolve({kind:'polygonRegion',sources:[{objectId:'p'}]},[{type:'polygon',vertices}]);assert.equal(result.reasonCode,'VALID');assert.ok(result.area>0);}
  const r=MI.RegionGeometry.resolve({kind:'polygonRegion',sources:[{objectId:'p'}]},[{type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:4,y:3},{x:0,y:3}]}]);assert.equal(r.area,12);
});
test('circle sector and segment use minor, major, half-turn and full-disk rules',()=>{
  const {MI}=env(),circle={type:'circle',cx:0,cy:0,r:2},a={type:'point',x:2,y:0},b={type:'point',x:0,y:2};
  const run=(kind,extent,x=b)=>MI.RegionGeometry.resolve({kind,sources:[{objectId:'c'},{objectId:'a'},{objectId:'b'}],extent},[circle,a,x]);
  assert.ok(Math.abs(run('circleSectorRegion','minor').area-Math.PI)<1e-14);
  assert.ok(Math.abs(run('circleSectorRegion','major').area-3*Math.PI)<1e-14);
  assert.ok(Math.abs(run('circleSegmentRegion','minor').area-(Math.PI-2))<1e-14);
  assert.ok(Math.abs(run('circleSegmentRegion','major').area-(3*Math.PI+2))<1e-14);
  const opposite={type:'point',x:-2,y:0};assert.ok(Math.abs(run('circleSectorRegion','minor',opposite).area-2*Math.PI)<1e-14);
  const full=run('circleSegmentRegion','major',a);assert.equal(full.reasonCode,'VALID');assert.equal(full.geometry.fullDisk,true);assert.equal(full.area,4*Math.PI);
  assert.equal(run('circleSegmentRegion','minor',a).reasonCode,'DEGENERATE_REGION');
});
test('the 180-degree tie and moving side choice are deterministic for minor and major extents',()=>{
  const {MI}=env(),circle={type:'circle',cx:0,cy:0,r:2},a={type:'point',x:2,y:0};
  const resolve=(kind,extent,angle)=>MI.RegionGeometry.resolve({kind,extent},[circle,a,{type:'point',x:2*Math.cos(angle),y:2*Math.sin(angle)}]);
  const eps=1e-6;
  for(const kind of ['circleSectorRegion','circleSegmentRegion']){
    const beforeMinor=resolve(kind,'minor',Math.PI-eps),tieMinor=resolve(kind,'minor',Math.PI),afterMinor=resolve(kind,'minor',Math.PI+eps);
    const beforeMajor=resolve(kind,'major',Math.PI-eps),tieMajor=resolve(kind,'major',Math.PI),afterMajor=resolve(kind,'major',Math.PI+eps);
    assert.ok(beforeMinor.geometry.sweep<Math.PI);assert.equal(tieMinor.geometry.sweep,Math.PI);assert.ok(afterMinor.geometry.sweep<Math.PI);
    assert.equal(tieMinor.geometry.startAngle,0);assert.ok(beforeMinor.geometry.startAngle<1e-12);assert.ok(afterMinor.geometry.startAngle>Math.PI);
    assert.ok(beforeMajor.geometry.sweep>Math.PI);assert.equal(tieMajor.geometry.sweep,Math.PI);assert.ok(afterMajor.geometry.sweep>Math.PI);
    assert.ok(beforeMajor.geometry.startAngle<Math.PI);assert.equal(tieMajor.geometry.startAngle,0);assert.ok(afterMajor.geometry.startAngle<1e-12);
    for(const result of [beforeMinor,tieMinor,afterMinor,beforeMajor,tieMajor,afterMajor])assert.equal(result.reasonCode,'VALID');
  }
});
test('tiny segment uses cancellation-safe series and rejects underflow explicitly',()=>{
  const {MI}=env(),circle={type:'circle',cx:0,cy:0,r:1},a={type:'point',x:1,y:0},theta=1e-4,b={type:'point',x:Math.cos(theta),y:Math.sin(theta)};
  const result=MI.RegionGeometry.resolve({kind:'circleSegmentRegion',extent:'minor'},[circle,a,b]);
  const expected=theta**3/12-theta**5/240+theta**7/10080;
  assert.equal(result.reasonCode,'VALID');assert.ok(Math.abs(result.area-expected)<expected*1e-12);
  const tiny=MI.RegionGeometry.resolve({kind:'circleSegmentRegion',extent:'minor'},[{...circle,r:1e-200},a,b]);assert.equal(tiny.reasonCode,'NUMERIC_UNDERFLOW');
});
test('source coordinates outside the shared model limit report COORDINATE_LIMIT',()=>{
  const {MI}=env(),recipe={kind:'polygonRegion',sources:[{objectId:'p'}]};
  assert.equal(MI.RegionGeometry.resolve(recipe,[{type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:4,y:3e12}]}]).reasonCode,'COORDINATE_LIMIT');
  const circle={type:'circle',cx:1e12,cy:0,r:1},a={type:'point',x:1e12+1,y:0},b={type:'point',x:1e12,y:1};
  assert.equal(MI.RegionGeometry.resolve({kind:'circleSectorRegion',extent:'minor'},[circle,a,b]).reasonCode,'COORDINATE_LIMIT');
});
