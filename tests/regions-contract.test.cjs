const test=require('node:test');
const assert=require('node:assert/strict');
const {runtime}=require('./helpers.cjs');
function make(){const {MI}=runtime(['model.js','renderer.js','coordinate-transform.js','index.js']);return {MI,e:new MI.Engine({type:'geometry',version:2,objects:[]},{width:600,bounds:{xMin:-5,yMin:-5,xMax:5,yMax:5}})};}
test('region tools use typed construction recipes, schema v8 and omit calculated geometry from JSON',()=>{
  const {MI,e}=make(),p=e.add({type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:4,y:3},{x:0,y:3}]}),region=e.construct('polygonRegion',[{objectId:p.id}])[0];
  assert.equal(region.type,'region');assert.equal(region.regionArea,12);assert.equal(region.construction.kind,'polygonRegion');
  const json=e.toJSON();assert.equal(json.version,8);assert.equal(json.regionSchema,1);assert.equal(json.constructionSchema,5);
  const saved=json.objects.find(o=>o.id===region.id);assert.equal('regionArea'in saved,false);assert.equal('regionGeometry'in saved,false);
  const loaded=new MI.Engine(json);assert.equal(loaded.get(region.id).regionArea,12);assert.equal(loaded.get(region.id).id,region.id);
  assert.throws(()=>new MI.IllustrationModel({...json,regionSchema:2}),/Ongeldige regio|regionSchema/);
  assert.throws(()=>new MI.IllustrationModel({...json,version:7}),/versie/i);
  assert.throws(()=>new MI.IllustrationModel({objects:[{id:'p',type:'point',x:0,y:0,areaDisplay:{visible:true,mode:'value',precision:null,position:{mode:'auto'}}}]}),/alleen geldig voor een gebied/);
});
test('sector and segment recipes dynamically resolve with stable IDs through invalidation and recovery',()=>{
  const {MI,e}=make(),circle=e.add({type:'circle',cx:0,cy:0,r:2}),a=e.add({type:'point',x:2,y:0}),b=e.add({type:'point',x:0,y:2});
  const sector=e.construct('circleSectorRegion',[{objectId:circle.id},{objectId:a.id},{objectId:b.id}],undefined,'minor')[0],segment=e.construct('circleSegmentRegion',[{objectId:circle.id},{objectId:a.id},{objectId:b.id}],undefined,'major')[0];
  assert.equal(sector.regionArea,Math.PI);assert.ok(Math.abs(segment.regionArea-(3*Math.PI+2))<1e-14);
  e.update(a.id,{x:0,y:0});assert.equal(e.get(sector.id).constructionValid,false);assert.equal(e.get(sector.id).regionStatus,'DEGENERATE_DIRECTION');assert.equal(e.get(sector.id).id,sector.id);
  e.update(a.id,{x:2,y:0});assert.equal(e.get(sector.id).constructionValid,true);assert.equal(e.get(sector.id).id,sector.id);
  e.model.update(sector.id,{areaDisplay:{visible:true,mode:'equation',precision:null,position:{mode:'auto'}}});const svg=e.renderSVG();assert.match(svg,/data-region-contour/);assert.match(svg,/A =/);
  const whole=e.construct('circleSectorRegion',[{objectId:circle.id},{objectId:a.id},{objectId:a.id}],undefined,'major')[0];assert.equal(whole.regionGeometry.fullDisk,true);
  assert.match(e.renderSVG(),/data-region-full-disk/);
});
test('region boundary hit testing, fill formatting, identity and render purity',()=>{
  const {MI,e}=make(),p=e.add({type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:4,y:3},{x:0,y:3}]}),region=e.construct('polygonRegion',[{objectId:p.id}])[0],before=e.toJSONString();
  const transform=new MI.CoordinateTransform(e.renderer),screen=transform.mathToScreen({x:2,y:1});assert.equal(e.selectAt(2,1,{transform,tolerancePx:8}).object.id,region.id);assert.equal(e.selectAt(5,5,{transform,tolerancePx:8}),null);
  e.model.update(region.id,{areaDisplay:{visible:true,mode:'equation',precision:1,position:{mode:'auto'}}});
  assert.match(e.renderSVG(),/A = 12,0/);assert.equal(e.get(region.id).id,region.id);assert.notEqual(e.toJSONString(),before);
  assert.equal(MI.ConstructionService.contract('polygonRegion').computedFields.includes('regionArea'),true);
});

test('sector SVG arcs follow the source circle in screen coordinates for minor and major regions',()=>{
  const {MI,e}=make(),circle=e.add({id:'SC',type:'circle',cx:1,cy:-.5,r:2}),a=e.add({id:'SA',type:'point',x:3,y:-.5}),b=e.add({id:'SB',type:'point',x:1,y:1.5});
  const sectors=['minor','major'].map(extent=>e.construct('circleSectorRegion',[{objectId:circle.id},{objectId:a.id},{objectId:b.id}],undefined,extent)[0]);
  const scale=e.renderer.scale(),centerX=e.renderer.mapX(1),centerY=e.renderer.mapY(-.5),radius=2*scale;
  for(const sector of sectors){
    const circleSvg=e.renderer.renderObject(e.get(circle.id)).match(/<circle[^>]*cx="[^"]+"[^>]*cy="[^"]+"[^>]*r="[^"]+"[^>]*>/)?.[0],path=e.renderer.renderObject(e.get(sector.id)).match(/<path data-region-contour(?:="")? d="([^"]+)"/)?.[1];
    assert.ok(circleSvg);assert.ok(path);
    assert.match(circleSvg,new RegExp('cx="'+centerX+'"'));assert.match(circleSvg,new RegExp('cy="'+centerY+'"'));assert.match(circleSvg,new RegExp('r="'+radius+'"'));
    assert.match(path,new RegExp(' A '+radius+' '+radius+' 0 '+(sector.regionGeometry.sweep>Math.PI?1:0)+' 0 '));
    // Both direction arms are real source radii; the closed sector contour strokes each edge.
    assert.match(path,/^M .* L .* A .* Z$/);assert.equal(sector.regionGeometry.center.x,1);assert.equal(sector.regionGeometry.center.y,-.5);assert.equal(sector.regionGeometry.radius,2);
  }
  const old=sectors.map(s=>e.renderer.renderObject(e.get(s.id)));
  e.update('SB',{x:-1,y:-.5});
  for(let i=0;i<sectors.length;i++)assert.notEqual(e.renderer.renderObject(e.get(sectors[i].id)),old[i]);
});

test('restricted region visibility, styling, source revocation and JSON export stay fail-closed',()=>{
  const {MI}=runtime(),{fixture}=require('./permission-fixtures.cjs'),f=fixture();
  f.initialDocument={type:'geometry',version:8,regionSchema:1,constructionSchema:5,meta:{title:'',description:''},objects:[
    ...f.initialDocument.objects,
    {id:'RC',type:'circle',cx:0,cy:0,r:2},
    {id:'RA',type:'point',x:2,y:0},{id:'RB',type:'point',x:0,y:2},
    {id:'RR',type:'region',construction:{kind:'circleSectorRegion',sources:[{objectId:'RC'},{objectId:'RA'},{objectId:'RB'}],extent:'minor'},areaDisplay:{visible:true,mode:'equation',precision:null,position:{mode:'auto'}}}
  ]};
  f.policy.allowedTools.push('construct:circleSectorRegion');
  f.policy.createdObjectRules.region={read:true,display:true,selectCanvas:true,selectList:true,propertyFields:['areaDisplay.visible','areaDisplay.mode','areaDisplay.precision','areaDisplay.position','style.fill','style.opacity']};
  f.policy.initialObjectRules.RR={read:true,display:true,selectCanvas:true,selectList:true,propertyFields:['areaDisplay.visible','areaDisplay.mode','areaDisplay.precision','areaDisplay.position','style.fill','style.opacity']};
  for(const id of ['RC','RA','RB'])f.policy.initialObjectRules[id]={sourceTools:['construct:circleSectorRegion']};
  const {session,owner}=MI.RuntimeSession.create(f);
  assert.equal(session.getObjectCapabilities('RR').display,true);
  assert.ok(session.engine.model.objects.some(o=>o.id==='RR'));
  assert.match(session.engine.renderSVG(),/data-object-id="RR"/);
  const exported=session.engine.toJSON();assert.equal(exported.version,8);assert.equal(exported.regionSchema,1);assert.equal(exported.constructionSchema,5);
  assert.equal(exported.objects.find(o=>o.id==='RR').regionArea,undefined);
  const region=session.engine.get('RR');session.engine.update('RR',{areaDisplay:{visible:false}});assert.equal(session.engine.get('RR').areaDisplay.visible,false);
  const revoked=JSON.parse(JSON.stringify(f.policy));revoked.initialObjectRules.RB.sourceTools=[];owner.replacePolicy(revoked);
  assert.equal(session.getObjectCapabilities('RR').display,false);assert.equal(session.engine.get('RR'),null);assert.equal(session.engine.getConstructionInfo('RR'),null);assert.doesNotMatch(session.engine.renderSVG(),/data-object-id="RR"|A =/);
  const safe=session.engine.toJSON();assert.equal(safe.objects.some(o=>o.id==='RR'),false);assert.notEqual(safe.constructionSchema,5);assert.equal(region.id,'RR');
});
