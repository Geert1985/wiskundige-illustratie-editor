const assert=require('node:assert/strict');
module.exports=async page=>{
 const choose=require('./browser-tool-menu.cjs').choose;
 await page.setViewportSize({width:1400,height:900});await page.reload();
 for(const legacy of ['pointOnSegment','pointOnCircle','pointOnEllipse']){
  assert.equal(await page.locator('[data-tool="construct:'+legacy+'"]').count(),0);
  assert.equal(await page.locator('#canvasToolsMenu [data-canvas-tool="construct:'+legacy+'"]').count(),0);
 }
 for(const query of ['Punt op lijnstuk','Punt op cirkel','Punt op ellips']){await page.locator('#toolSearch').fill(query);assert.equal(await page.locator('#toolGrid [data-tool]:visible').count(),0,query);}
 await page.locator('#toolSearch').fill('');
 await page.locator('#toolSearch').fill('Punt op object');assert.equal(await page.locator('#toolGrid [data-tool]:visible').count(),1);assert.equal(await page.locator('#toolGrid [data-tool]:visible').getAttribute('data-tool'),'construct:pointOnObject');await page.locator('#toolSearch').fill('');await page.locator('#canvasToolsBtn').click();assert.equal(await page.locator('#canvasToolsMenu [data-canvas-tool="construct:pointOnObject"]').count(),1);await page.keyboard.press('Escape');
 const cases=[
  {name:'line',objects:[{id:'L',type:'line',x1:-2,y1:0,x2:2,y2:0}],point:{x:0,y:0},kind:'pointOnSegment',source:{objectId:'L'}},
  {name:'polygon edge',objects:[{id:'P',type:'polygon',vertices:[{x:1,y:-1},{x:3,y:-1},{x:3,y:1},{x:1,y:1}]}],point:{x:3,y:0},kind:'pointOnSegment',source:{objectId:'P',part:'edge',index:1}},
  {name:'circle',objects:[{id:'C',type:'circle',cx:0,cy:2,r:1}],point:{x:0,y:3},kind:'pointOnCircle',source:{objectId:'C'}},
  {name:'ellipse',objects:[{id:'E',type:'ellipse',cx:3,cy:2,a:1,b:.5,rotation:0}],point:{x:4,y:2},kind:'pointOnEllipse',source:{objectId:'E'}}
 ];
 for(const fixture of cases){
  await page.evaluate(data=>FZI.MathIllustration.editor.loadDocument({...(data.some(o=>o.type==='ellipse')?{version:9,ellipseSchema:1}:{version:4}),objects:data}),fixture.objects);
  await choose(page,'[data-tool="construct:pointOnObject"]');
  const screen=await page.evaluate(p=>FZI.MathIllustration.editor.transform().mathToScreen(p),fixture.point);
  await page.mouse.click(screen.x,screen.y);
  const staged=await page.evaluate(()=>({count:FZI.MathIllustration.editor.engine.model.objects.length,tool:FZI.MathIllustration.editor.tool,placement:FZI.MathIllustration.editor.interaction?.pathPlacement,source:FZI.MathIllustration.editor.interaction?.sources?.[0]}));
  assert.equal(staged.count,fixture.objects.length,fixture.name+' stages without creating');assert.equal(staged.placement,true,fixture.name+': '+JSON.stringify(staged));assert.deepEqual(staged.source,fixture.source);
  if(fixture.name==='polygon edge')assert.equal(await page.locator('#canvas [data-point-source-highlight]').count(),1,'the chosen polygon edge is highlighted');
  if(fixture.name==='line'){
   await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),fixture.objects.length);
   await choose(page,'[data-tool="construct:pointOnObject"]');await page.mouse.move(screen.x,screen.y);await page.mouse.down();await page.waitForFunction(()=>FZI.MathIllustration.editor.interaction?.pathPlacement===true);const pointerId=await page.evaluate(()=>FZI.MathIllustration.editor.interaction.pointerId);await page.evaluate(id=>window.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:id})),pointerId);await page.mouse.up();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction),null);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),fixture.objects.length);
   await choose(page,'[data-tool="construct:pointOnObject"]');await page.mouse.click(screen.x,screen.y);
  }
  await page.mouse.move(screen.x+2,screen.y+2);await page.waitForTimeout(25);
  assert.equal(await page.locator('#canvas [data-point-placement-preview]').count(),1);
  await page.mouse.click(screen.x,screen.y);
  const result=await page.evaluate(()=>{const a=FZI.MathIllustration.editor,p=a.engine.model.objects.find(o=>o.type==='point'&&o.construction);return {count:a.engine.model.objects.length,kind:p?.construction?.kind,source:p?.construction?.sources?.[0],aliasStored:a.engine.model.objects.some(o=>o.construction?.kind==='pointOnObject'),tool:a.tool};});
  assert.equal(result.count,fixture.objects.length+1,fixture.name+' creates exactly one point');assert.equal(result.kind,fixture.kind);assert.deepEqual(result.source,fixture.source);assert.equal(result.aliasStored,false);assert.equal(result.tool,'select');
  if(fixture.name==='line'){await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),fixture.objects.length);await page.locator('#redoBtn').click();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),fixture.objects.length+1);}
 }
 await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({version:4,objects:[{id:'P',type:'polygon',vertices:[{x:1,y:-1},{x:3,y:-1},{x:3,y:1},{x:1,y:1}]}]}));await choose(page,'[data-tool="construct:pointOnObject"]');const endpointScreens=await page.evaluate(()=>{const t=FZI.MathIllustration.editor.transform();return [t.mathToScreen({x:3,y:0}),t.mathToScreen({x:3,y:1.02})];});await page.mouse.click(endpointScreens[0].x,endpointScreens[0].y);await page.mouse.click(endpointScreens[1].x,endpointScreens[1].y);const endpoint=await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.find(o=>o.construction?.kind==='pointOnSegment'));assert.equal(endpoint.construction.sources[0].index,1);assert.equal(endpoint.construction.parameter,1);assert.equal(endpoint.x,3);assert.equal(endpoint.y,1);
 const radial=await page.evaluate(()=>{const a=FZI.MathIllustration.editor,source={id:'P',type:'polygon',vertices:[{x:1,y:-1},{x:3,y:-1},{x:3,y:1},{x:1,y:1}]};a.loadDocument({version:4,objects:[source]});a.selectObject('P');const edgeRef={objectId:'P',part:'edge',index:1},ctx={type:'object',id:'P',name:'P',objects:[a.engine.get('P')],edgeRef},item=a.radialProperties.contextConstructions(ctx).find(x=>x.entry.id==='construct:pointOnObject');return {item:item&&item.plan,started:item&&a.startContextConstruction(item.entry.id,'P',item.plan.key,edgeRef),source:a.interaction?.sources?.[0]};});
 assert.ok(radial.started);assert.equal(radial.source.index,1);const edgeScreen=await page.evaluate(()=>FZI.MathIllustration.editor.transform().mathToScreen({x:3,y:0}));await page.mouse.click(edgeScreen.x,edgeScreen.y);const radialResult=await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.find(o=>o.construction?.kind==='pointOnSegment')?.construction.sources[0]);assert.deepEqual(radialResult,{objectId:'P',part:'edge',index:1});
 return {sidebarSearch:'passed',fullscreenCatalog:'passed',fourCarriers:'passed',stagedPlacement:'passed',concreteRecipes:'passed',singleUndo:'passed',escape:'passed',pointerCancel:'passed',projectionPreview:'passed',endpointClamp:'passed',radialEdgePrefill:'passed'};
};
