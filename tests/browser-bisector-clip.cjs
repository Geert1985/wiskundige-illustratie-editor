const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.setViewportSize({width:1159,height:668});await page.reload();
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.loadDocument({objects:[{id:'poly',type:'polygon',vertices:[{x:-3,y:3.4},{x:-2.9,y:2.5},{x:1.5,y:3.3}]}],presentation:{bounds:{xMin:-5,xMax:5,yMin:-3,yMax:3}}});a.engine.construct('bisector',[{objectId:'poly',part:'vertex',index:1},{objectId:'poly',part:'vertex',index:2},{objectId:'poly',part:'vertex',index:0}]);a.invalidate();});
 const geometry=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON().objects);
 const check=async()=>{
  const result=await page.evaluate(()=>{const a=FZI.MathIllustration.editor,o=a.engine.model.objects.find(o=>o.construction),line=document.querySelector('[data-object-id="'+o.id+'"] line'),t=a.transform(),r=a.engine.renderer,rect=document.getElementById('canvas').getBoundingClientRect(),v=t.mathToScreen({x:o.x1,y:o.y1}),m=line.getScreenCTM(),p={x:m.a*Number(line.getAttribute('x1'))+m.e,y:m.d*Number(line.getAttribute('y1'))+m.f},pred=FZI.MathIllustration.CoordinateTransform.forViewport(r,rect).mathToScreen({x:o.x1,y:o.y1});return {v,p,pred,rect:{left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom}};});
  assert.ok(Math.hypot(result.v.x-result.pred.x,result.v.y-result.pred.y)<.01,'math/screen transforms agree on the construction vertex');
  const inside=result.v.x>=result.rect.left&&result.v.x<=result.rect.right&&result.v.y>=result.rect.top&&result.v.y<=result.rect.bottom;
  if(inside)assert.ok(Math.hypot(result.v.x-result.p.x,result.v.y-result.p.y)<.01,'visible SVG endpoint matches the construction vertex');
  else {assert.ok(result.p.x>=result.rect.left-.5&&result.p.x<=result.rect.right+.5&&result.p.y>=result.rect.top-.5&&result.p.y<=result.rect.bottom+.5,'clipped SVG endpoint remains at the visible canvas edge');assert.ok(Math.min(Math.abs(result.p.x-result.rect.left),Math.abs(result.p.x-result.rect.right),Math.abs(result.p.y-result.rect.top),Math.abs(result.p.y-result.rect.bottom))<.5,'off-screen construction vertex is clipped to a canvas edge');}
  assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON().objects),geometry);
 };
 await check();await page.locator('#zoomInBtn').click();await check();await page.locator('#zoomOutBtn').click();await check();await page.setViewportSize({width:1480,height:900});await page.evaluate(()=>FZI.MathIllustration.editor.invalidate());await check();
 await require('./browser-tool-menu.cjs').choose(page,'[data-tool="construct:perpendicularBisector"]');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),'construct:perpendicularBisector');assert.ok(await page.locator('[data-tool="construct:perpendicularBisector"]').textContent().then(text=>text.includes('Middelloodlijn')));assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON().objects),geometry);return {bisectorStartsAtVertex:'passed',zoomResizeInvariant:'passed',viewportTransformMatchesDOM:'passed',fullConstructionName:'passed'};
};
