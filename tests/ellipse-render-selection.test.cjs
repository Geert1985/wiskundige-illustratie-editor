const test=require('node:test'),assert=require('node:assert/strict');
const {runtime,plain}=require('./helpers.cjs'),{fixture}=require('./permission-fixtures.cjs');
function setup(){const {MI}=runtime(),e=new MI.Engine({objects:[]},{width:800,bounds:{xMin:-6,xMax:6,yMin:-6,yMax:6},showGrid:false,showAxes:false});return {MI,e};}
const definition={type:'ellipse',cx:0,cy:0,a:5,b:2,rotation:0};
const close=(a,b,tolerance=1e-7)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} != ${b}`);

test('analytic ellipse SVG has exact axes, inverse-y rotation, normal labels, clipping and no polygonization',()=>{
 const {MI,e}=setup();
 for(const angle of [0,45,90,135]){const o=e.add({...definition,rotation:angle*Math.PI/180,showLabel:true,name:'Ellips <&>',style:{fill:'none',stroke:'#123456',strokeWidth:3,opacity:.4}});const before=plain(e.toJSON()),svg=e.renderSVG(),tag=svg.match(/<ellipse [^>]*\/>/g).at(-1);
  close(Number(tag.match(/rx="([^"]+)/)[1]),5*e.renderer.scale());close(Number(tag.match(/ry="([^"]+)/)[1]),2*e.renderer.scale());close(Number(tag.match(/rotate\(([^ ]+)/)[1]),-angle);
  assert.ok(tag.includes('fill="none"'));assert.ok(tag.includes('stroke="#123456"'));assert.ok(svg.includes('opacity="0.4"'));assert.ok(svg.includes('Ellips &lt;&amp;&gt;'));assert.ok(svg.includes(`data-label-id="${o.id}"`));assert.ok(svg.includes('clipPathUnits="userSpaceOnUse"'));assert.ok(!tag.includes('polygon'));assert.ok(!/NaN|Infinity|undefined/.test(svg));assert.deepEqual(plain(e.toJSON()),before);
 }
 const thin=e.add({...definition,a:1,b:1e-12,rotation:1e308});const tag=e.renderer.renderObject(thin).match(/<ellipse [^>]*\/>/)[0];assert.ok(Number(tag.match(/ry="([^"]+)/)[1])>0);assert.ok(!/NaN|Infinity/.test(tag));
});

test('nearest ellipse uses the Euclidean contour, with deterministic center/axis handling',()=>{
 const {MI}=setup();const g=MI.EllipseGeometry;
 close(g.nearest(definition,{x:0,y:0}).distance,2);close(g.nearest(definition,{x:6,y:0}).distance,1);close(g.nearest(definition,{x:0,y:3}).distance,1);
 const axis=g.nearest(definition,{x:1,y:0});close(axis.point.x,25/21);close(axis.point.y,2*Math.sqrt(1-(5/21)**2));
 const circle={...definition,b:5};close(g.nearest(circle,{x:0,y:0}).point.x,5);close(g.nearest(circle,{x:3,y:4}).distance,0);
 for(const q of [{x:NaN,y:0},{x:Infinity,y:0}])assert.equal(g.nearest(definition,q),null);
});

test('seeded affine projections agree with independent normal-offset oracles and dense global bounds',()=>{
 const {MI}=setup();let seed=872341;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 for(let i=0;i<120;i++){
  const a=.1+random()*10,b=a*(.005+.995*random()),rotation=random()*Math.PI*2,t=random()*Math.PI*2,co=Math.cos(rotation),si=Math.sin(rotation);
  const o={...definition,cx:random()*4,cy:random()*4,a,b,rotation};const matrix={a:.5+random()*2,b:random()*.4,c:random()*.5,d:1+random()*2};
  const map=p=>({x:matrix.a*p.x+matrix.c*p.y+13,y:matrix.b*p.x+matrix.d*p.y-7});
  const point={x:o.cx+a*Math.cos(t)*co-b*Math.sin(t)*si,y:o.cy+a*Math.cos(t)*si+b*Math.sin(t)*co};
  const tangent={x:-a*Math.sin(t)*co-b*Math.cos(t)*si,y:-a*Math.sin(t)*si+b*Math.cos(t)*co},dt={x:matrix.a*tangent.x+matrix.c*tangent.y,y:matrix.b*tangent.x+matrix.d*tangent.y};
  const p=map(point),center=map({x:o.cx,y:o.cy});let nx=dt.y,ny=-dt.x;if(nx*(p.x-center.x)+ny*(p.y-center.y)<0){nx=-nx;ny=-ny;}const length=Math.hypot(nx,ny),offset=.01+random()*3,query={x:p.x+nx/length*offset,y:p.y+ny/length*offset};
  const found=MI.EllipseGeometry.nearest(o,query,map);assert.ok(found&&found.iterations<=96);close(found.distance,offset);close(found.point.x,point.x);close(found.point.y,point.y);
  // Interior and exterior queries: a separate dense contour must never beat the result.
  const q={x:center.x+(random()-.5)*20,y:center.y+(random()-.5)*20},near=MI.EllipseGeometry.nearest(o,q,map);let sampled=Infinity;
  for(let j=0;j<2048;j++){const angle=j*2*Math.PI/2048,s=map({x:o.cx+a*Math.cos(angle)*co-b*Math.sin(angle)*si,y:o.cy+a*Math.cos(angle)*si+b*Math.sin(angle)*co});sampled=Math.min(sampled,Math.hypot(q.x-s.x,q.y-s.y));}
  assert.ok(near.distance<=sampled+1e-7);
 }
});

test('CSS-pixel selection follows affine zoom/pan, contour tolerance and point priority',()=>{
 const {MI,e}=setup(),o=e.add({...definition,rotation:.63,style:{fill:'#abcdef'}}),g=MI.EllipseGeometry.fromDefinition(o).geometry;
 for(const matrix of [{a:.5,d:.5,e:17,f:5},{a:2,d:1.3,b:.4,c:.2,e:45,f:-12}]){const transform=new MI.CoordinateTransform(e.renderer,matrix),p=g.pointAt(.17),screen=transform.mathToScreen(p),center=transform.mathToScreen(g.center),dx=screen.x-center.x,dy=screen.y-center.y,l=Math.hypot(dx,dy),q=transform.screenToMath({x:screen.x+dx/l*5,y:screen.y+dy/l*5});assert.equal(e.selectAt(q.x,q.y,{transform,tolerancePx:6}).object.id,o.id);assert.equal(e.selectAt(q.x,q.y,{transform,tolerancePx:1}),null);assert.equal(e.selectAt(0,0,{transform,tolerancePx:5}),null);}
 const p=g.pointAt(.3);e.add({id:'point',type:'point',...p});assert.equal(e.selectAt(p.x,p.y,{transform:new MI.CoordinateTransform(e.renderer),tolerancePx:6}).object.id,'point');
});

test('ellipse snapping projects one virtual contour point with cache freshness, exclusions and tolerance',()=>{
 const {MI,e}=setup(),o=e.add(definition),transform=new MI.CoordinateTransform(e.renderer),before=plain(e.toJSON());
 const snap=MI.SnapService.resolve(e,{x:5.05,y:0},{transform});assert.equal(snap.kind,'ellipse-contour');close(snap.point.x,5);close(snap.point.y,0);assert.deepEqual(plain(snap.ids),[o.id]);assert.deepEqual(plain(e.toJSON()),before);assert.equal(MI.SnapService.candidates(e).length,0);
 assert.equal(MI.SnapService.resolve(e,{x:5.05,y:0},{transform,excludeIds:[o.id]}).snapped,false);assert.equal(MI.SnapService.resolve(e,{x:0,y:0},{transform}).snapped,false);
 e.update(o.id,{rotation:Math.PI/2});assert.equal(MI.SnapService.resolve(e,{x:5.05,y:0},{transform}).snapped,false);assert.equal(MI.SnapService.resolve(e,{x:0,y:5.05},{transform}).kind,'ellipse-contour');
 e.update(o.id,{visible:false});assert.equal(MI.SnapService.resolve(e,{x:0,y:5.05},{transform}).snapped,false);
});

test('dynamic ellipses disappear from rendering/selection/snap while invalid and recover with identity',()=>{
 const {MI,e}=setup();e.add({id:'A',type:'point',x:-3,y:0});e.add({id:'B',type:'point',x:3,y:0});const o=e.construct('ellipseByFociAndSum',[{objectId:'A'},{objectId:'B'}],10)[0];
 e.update('B',{x:8});assert.ok(!e.renderSVG().includes(`data-object-id="${o.id}"`));assert.equal(e.selectAt(0,4,.01),null);assert.equal(MI.SnapService.resolve(e,{x:0,y:4}).snapped,false);
 e.update('B',{x:3});assert.ok(e.renderSVG().includes(`data-object-id="${o.id}"`));assert.equal(MI.SnapService.resolve(e,{x:0,y:4}).ids[0],o.id);assert.equal(MI.SnapService.resolve(e,{x:0,y:4},{excludeIds:['A']}).snapped,false);
});

test('restricted SVG, labels, selectable objects and snap candidates share revoked-source projection',()=>{
 const {MI,e}=setup();e.add({id:'A',type:'point',x:-3,y:0});e.add({id:'B',type:'point',x:3,y:0});const o=e.construct('ellipseByFociAndSum',[{objectId:'A'},{objectId:'B'}],10)[0];e.update(o.id,{name:'HiddenEllipseName',showLabel:true});
 const f=fixture();f.initialDocument=plain(e.toJSON());f.policy.parameters={};f.policy.allowedTools=[];f.policy.initialObjectRules={A:{sourceTools:['construct:ellipseByFociAndSum']},B:{sourceTools:['construct:ellipseByFociAndSum']}};const {session,owner}=MI.RuntimeSession.create(f);
 assert.ok(session.engine.renderSVG().includes('<ellipse '));assert.equal(MI.SnapService.resolve(session.engine,{x:0,y:4}).kind,'ellipse-contour');
 const policy=plain(f.policy);policy.initialObjectRules.B.sourceTools=[];owner.replacePolicy(policy);const svg=session.engine.renderSVG();assert.ok(!svg.includes('<ellipse '));assert.ok(!svg.includes(o.id));assert.ok(!svg.includes('HiddenEllipseName'));assert.equal(session.engine.selectAt(0,4,.01),null);assert.equal(MI.SnapService.resolve(session.engine,{x:0,y:4}).snapped,false);
});

test('ellipse marquee selection uses analytic bounds and contour intersections under affine transforms',()=>{
 const {MI,e}=setup(),o=e.add({...definition,rotation:.7}),transform=new MI.CoordinateTransform(e.renderer,{a:.8,d:1.1,b:.1,c:.3,e:21,f:14}),g=MI.EllipseGeometry.fromDefinition(o).geometry,p=transform.mathToScreen(g.pointAt(.2)),center=transform.mathToScreen(g.center),options={transform,bounds:e.renderer.bounds};
 assert.equal(MI.RectangleSelection.hits(o,{left:p.x-2,right:p.x+2,top:p.y-2,bottom:p.y+2},'cross',options),true);
 assert.equal(MI.RectangleSelection.hits(o,{left:center.x-2,right:center.x+2,top:center.y-2,bottom:center.y+2},'cross',options),false);
 assert.equal(MI.RectangleSelection.hits(o,{left:-1000,right:2000,top:-1000,bottom:2000},'contain',options),true);
 assert.equal(MI.RectangleSelection.hits(o,{left:p.x-2,right:p.x+2,top:p.y-2,bottom:p.y+2},'contain',options),false);
});

test('coincident-focus circles render as ellipses and hidden layers suppress rendering and contour snapping',()=>{
 const {MI,e}=setup();e.add({id:'A',type:'point',x:0,y:0});e.add({id:'B',type:'point',x:0,y:0});const o=e.construct('ellipseByFociAndSum',[{objectId:'A'},{objectId:'B'}],8)[0],tag=e.renderer.renderObject(o).match(/<ellipse [^>]*\/>/)[0];close(Number(tag.match(/rx="([^"]+)/)[1]),Number(tag.match(/ry="([^"]+)/)[1]));
 const layer=e.createLayer('Ellipses');e.assignLayer([o.id],layer.id);e.setLayerVisibility(layer.id,false);assert.ok(!e.renderSVG().includes(`data-object-id="${o.id}"`));assert.equal(e.selectAt(0,4,.01),null);assert.equal(MI.SnapService.resolve(e,{x:0,y:4}).snapped,false);
});
