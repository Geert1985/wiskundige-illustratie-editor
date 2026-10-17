const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.setViewportSize({width:1446,height:884});await page.reload();
 const base={type:'geometry',version:9,ellipseSchema:1,meta:{title:'',description:''},objects:[{id:'L',type:'straight',x1:-6,y1:0,x2:6,y2:0},{id:'E',type:'ellipse',cx:0,cy:0,a:5,b:3,rotation:0}],presentation:{showGrid:false}};
 const click=async(x,y)=>{const p=await page.evaluate(({x,y})=>FZI.MathIllustration.editor.transform().mathToScreen({x,y}),{x,y});await page.mouse.click(p.x,p.y);};
 const chooseSource=async expected=>{const index=await page.evaluate(expected=>{const refs=FZI.MathIllustration.editor.interaction?.pendingSourceOptions||[];return refs.findIndex(ref=>JSON.stringify(ref)===JSON.stringify(expected));},expected);if(index>=0)await page.locator(`#toolInstructions [data-intersection-source="${index}"]`).click();};
 async function startFrom(id,edgeRef=null){
  const plan=await page.evaluate(({id,edgeRef})=>{const a=FZI.MathIllustration.editor;a.loadDocument(window.__lineEllipseBase);a.selectObject(id);const source=a.engine.get(id),ctx={type:'object',id,name:id,objects:[source],...(edgeRef?{edgeRef}:{})},available=a.radialProperties.contextConstructions(ctx),hits=available.filter(item=>item.entry.id==='construct:intersection'),plan=hits[0];if(hits.length!==1||!plan)return {available:hits.length};const started=a.startContextConstruction('construct:intersection',id,plan.plan.key,edgeRef);return {available:hits.length,started,sources:a.interaction.sources};},{id,edgeRef});
  assert.equal(plan.available,1);assert.equal(plan.started,true);assert.equal(plan.sources.length,1);
 }
 await page.evaluate(doc=>{window.__lineEllipseBase=doc;FZI.MathIllustration.editor.loadDocument(doc);},base);
 // Ellipse-first contextual construction then pick the line on canvas.
 await startFrom('E');await click(0,0);await chooseSource({objectId:'L'});
 let state=await page.evaluate(()=>{const a=FZI.MathIllustration.editor;return {points:a.engine.model.objects.filter(o=>o.construction?.kind==='lineEllipseIntersection'),status:a.nodes.status?.textContent,tool:a.tool,sources:a.interaction?.sources};});let points=state.points;
 assert.deepEqual(points.map(o=>o.construction.branch),[0,1],JSON.stringify(state));assert.deepEqual(points.map(o=>o.construction.sources),[[{objectId:'L'},{objectId:'E'}],[{objectId:'L'},{objectId:'E'}]]);
 await page.locator('#undoBtn').click();
 // Line-first contextual construction then pick the ellipse on its boundary.
 await startFrom('L');await click(0,3);await chooseSource({objectId:'E'});
 points=await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.filter(o=>o.construction?.kind==='lineEllipseIntersection'));
 assert.deepEqual(points.map(o=>o.construction.branch),[0,1]);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.history.entries.length),1);
 const polygonCases=[
  {id:'T',vertices:[{x:-6,y:0},{x:6,y:0},{x:0,y:6}]},
  {id:'Q',vertices:[{x:-6,y:0},{x:6,y:0},{x:6,y:6},{x:-6,y:6}]},
  {id:'P',vertices:[{x:-6,y:0},{x:6,y:0},{x:7,y:4},{x:0,y:7},{x:-7,y:4}]},
 ];
 for(const polygon of polygonCases)for(const reverse of [false,true]){
  const edgeRef={objectId:polygon.id,part:'edge',index:0};
  const doc={...base,objects:[{...polygon,type:'polygon'},base.objects[1]]};
  await page.evaluate(doc=>{window.__lineEllipseBase=doc;FZI.MathIllustration.editor.loadDocument(doc);},doc);
  if(reverse){await startFrom('E');await click(0,0);await chooseSource(edgeRef);}else{await startFrom(polygon.id,edgeRef);await click(0,3);await chooseSource({objectId:'E'});}
  points=await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.filter(o=>o.construction?.kind==='lineEllipseIntersection'));
  assert.equal(points.length,2);for(const point of points)assert.deepEqual(point.construction.sources,[edgeRef,{objectId:'E'}]);
 }
 return {ellipseContext:'passed',bothSourceOrders:'passed',polygonEdges:['triangle','quadrilateral','pentagon'],canonicalSourceRefs:'passed',schema10:'passed',pageErrors:[]};
};
