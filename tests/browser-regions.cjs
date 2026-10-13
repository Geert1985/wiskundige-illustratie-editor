const assert=require('node:assert/strict');
module.exports=async page=>{
 const saved=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
 await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[
  {id:'poly',type:'polygon',vertices:[{x:-2,y:-1},{x:0,y:-1},{x:0,y:1},{x:-2,y:1}]},
  {id:'circle',type:'circle',cx:2,cy:0,r:2},
  {id:'east',type:'point',x:4,y:0},{id:'north',type:'point',x:2,y:2}
 ],presentation:{bounds:{xMin:-5,xMax:6,yMin:-4,yMax:4}}}));
 await require('./browser-tool-menu.cjs').choose(page,'[data-tool="construct:polygonRegion"]');
 const click=async(p,modifiers=[])=>{const at=await page.evaluate(p=>FZI.MathIllustration.editor.transform().mathToScreen(p),p);await page.mouse.click(at.x,at.y,{modifiers});};
 await click({x:-1,y:0});
 let doc=await saved(),polygon=doc.objects.find(o=>o.construction?.kind==='polygonRegion');assert.ok(polygon);assert.equal(polygon.type,'region');assert.deepEqual(polygon.construction.sources,[{objectId:'poly'}]);assert.equal(doc.version,8);assert.equal(doc.regionSchema,1);assert.equal(doc.constructionSchema,5);
 const polygonId=polygon.id;
 await require('./browser-tool-menu.cjs').choose(page,'[data-tool="construct:circleSegmentRegion"]');await click({x:2,y:-2});await click({x:4,y:0});await page.keyboard.down('Shift');await click({x:2,y:2});await page.keyboard.up('Shift');
 let uiDoc=await saved(),uiSegment=uiDoc.objects.find(o=>o.construction?.kind==='circleSegmentRegion');assert.ok(uiSegment);assert.equal(uiSegment.construction.extent,'major');assert.ok(Math.abs((await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).regionArea,uiSegment.id))-(3*Math.PI+2))<1e-12);
 const uiSegmentId=uiSegment.id;await page.locator('#undoBtn').click();assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id),uiSegmentId),null);await page.locator('#redoBtn').click();assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).id,uiSegmentId),uiSegmentId);
 const create=async(kind,sources,extent)=>page.evaluate(({kind,sources,extent})=>{const a=FZI.MathIllustration.editor;let result;a.changeDocument(()=>result=a.execute('construction.create',{toolId:'construct:'+kind,sources:sources.map(objectId=>({objectId})),...(extent?{extent}:{})}).result[0]);return result.id;},{kind,sources,extent});
 const sectorId=await create('circleSectorRegion',['circle','east','north'],'minor');
 const segmentId=await create('circleSegmentRegion',['circle','east','north'],'minor');
 const diskId=await create('circleSectorRegion',['circle','east','east'],'major');
 let values=await page.evaluate(ids=>ids.map(id=>{const e=FZI.MathIllustration.editor.engine,o=e.get(id);return {id,area:o.regionArea,geometry:o.regionGeometry,reason:e.getConstructionInfo(id).reasonCode};}),[polygonId,sectorId,segmentId,diskId]);
 assert.equal(values[0].area,4);assert.ok(Math.abs(values[1].area-Math.PI)<1e-12);assert.ok(Math.abs(values[2].area-(Math.PI-2))<1e-12);assert.ok(Math.abs(values[3].area-4*Math.PI)<1e-12);assert.ok(values.every(v=>v.reason==='VALID'));
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.execute('object.setGeometry',{id:'north',fields:[{path:'x',value:0},{path:'y',value:-1}]}));});
 values=await page.evaluate(ids=>ids.map(id=>FZI.MathIllustration.editor.engine.get(id).regionArea),[sectorId,segmentId]);assert.ok(values[0]>Math.PI);assert.ok(values[1]>0);assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).id,sectorId),sectorId);
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.execute('object.setGeometry',{id:'north',fields:[{path:'x',value:4},{path:'y',value:0}]}));});
 assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.getConstructionInfo(id).reasonCode,sectorId),'DEGENERATE_REGION');
 const invalidSnapshot=await saved();await page.evaluate(data=>FZI.MathIllustration.editor.loadDocument(data),invalidSnapshot);assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.getConstructionInfo(id).reasonCode,sectorId),'DEGENERATE_REGION');
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.execute('object.setGeometry',{id:'north',fields:[{path:'x',value:2},{path:'y',value:2}]}));});assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.getConstructionInfo(id).reasonCode,sectorId),'VALID');
 await page.evaluate(id=>{const a=FZI.MathIllustration.editor;a.selectObject(id);},polygonId);assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.moveSelectionPlan()),null);
 const before=await page.evaluate(()=>{const a=FZI.MathIllustration.editor;return a.engine.get(a.selectedId).regionGeometry.vertices;});
 const at=await page.evaluate(()=>FZI.MathIllustration.editor.transform().mathToScreen({x:-1,y:0}));await page.mouse.move(at.x,at.y);await page.mouse.down();await page.mouse.move(at.x+80,at.y+40);await page.mouse.up();assert.deepEqual(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).regionGeometry.vertices,polygonId),before);
 const svg=await page.evaluate(()=>FZI.MathIllustration.editor.engine.renderSVG());assert.match(svg,new RegExp('data-object-id="'+diskId+'"'));assert.match(svg,/<circle[^>]*data-region-full-disk=/);assert.doesNotMatch(require('./browser-tool-menu.cjs').numericSVG(svg),/NaN|Infinity/);
 const png=await page.evaluate(async svg=>{const e=FZI.MathIllustration.editor.engine,b=await FZI.MathIllustration.ExportService.png(svg,{width:e.renderer.width,height:e.renderer.height});return {type:b.type,size:b.size};},svg);assert.equal(png.type,'image/png');assert.ok(png.size>100);
 const snapshot=await saved(),encoded=JSON.stringify(snapshot);await page.evaluate(data=>FZI.MathIllustration.editor.loadDocument(JSON.parse(data)),encoded);assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.getConstructionInfo(id).reasonCode,sectorId),'VALID');
 await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
 return {canvasToolAndSelection:'passed',threeRegionRecipes:'passed',independentAreaReferences:'passed',dynamicInvalidRecoveryRoundtrip:'passed',directDragBlocked:'passed',fullDiskSvg:'passed',offlinePng:'passed',jsonRoundtrip:'passed'};
};
