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
 await require('./browser-tool-menu.cjs').choose(page,'[data-tool="construct:circleSectorRegion"]');
 await click({x:2,y:-2});await click({x:4,y:0});await click({x:2,y:2});
 const directedDoc=await saved(),directed=directedDoc.objects.find(o=>o.construction?.kind==='circleSectorRegion');
 assert.ok(directed);assert.equal(directed.construction.extent,'directed');
 assert.ok(Math.abs(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).regionArea,directed.id)-Math.PI)<1e-12);
 await page.locator('#undoBtn').click();assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id),directed.id),null);
 await page.locator('#redoBtn').click();assert.equal(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).construction.extent,directed.id),'directed');
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
 const compatibility=await page.evaluate(()=>{
  const MI=FZI.MathIllustration,a=MI.editor,e=a.engine;
  e.construct('angleDirections',[{kind:'axis',frame:'cartesian',axis:'x'},{kind:'axis',frame:'cartesian',axis:'y'}]);
  e.add({id:'rich-reg2',type:'text',x:0,y:3,textContent:{schema:3,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:null,paragraphs:[{id:'p1',align:'left',lineHeight:1.25,runs:[{id:'r1',kind:'text',text:'Straal = ',marks:{bold:true}},{id:'d1',kind:'dynamicValue',binding:{sourceId:'circle',property:'radius'},format:{precision:2,unitMode:'document',angleMode:'document',prefix:'',suffix:''},marks:{}}]}]}});
  const saved=e.toJSON(),encoded=JSON.stringify(saved);a.loadDocument(JSON.parse(encoded));
  let rejected=0,atomic=true;
  for(const textSchema of [undefined,null,0,1,2,4,'3',true]){try{a.engine.load({...saved,textSchema});}catch{rejected++;}atomic=atomic&&JSON.stringify(a.engine.toJSON())===encoded;}
  const hits=[];
  const concave=new MI.Engine({objects:[{id:'p',type:'polygon',vertices:[{x:0,y:0},{x:4,y:0},{x:4,y:1},{x:1,y:1},{x:1,y:4},{x:0,y:4}]}]});
  const region=concave.construct('polygonRegion',[{objectId:'p'}])[0];
  const select=(engine,p)=>engine.selectAt(p.x,p.y,{transform:new MI.CoordinateTransform(engine.renderer),tolerancePx:.01})?.object.id;
  hits.push(select(concave,{x:.5,y:3})===region.id,select(concave,{x:1,y:2})===region.id,select(concave,{x:2,y:2})===undefined);
  for(const extent of ['minor','major']){
   const s=new MI.Engine({objects:[{id:'c',type:'circle',cx:0,cy:0,r:2},{id:'a',type:'point',x:2,y:0},{id:'b',type:'point',x:0,y:2}]}),r=s.construct('circleSegmentRegion',['c','a','b'].map(objectId=>({objectId})),undefined,extent)[0];
   for(const o of s.model.objects)if(o.id!==r.id)s.update(o.id,{visible:false});
   const inside=extent==='minor'?{x:1.3,y:1.3}:{x:0,y:0},outside=extent==='minor'?{x:0,y:0}:{x:1.3,y:1.3};
   hits.push(select(s,inside)===r.id,select(s,outside)===undefined,select(s,{x:1,y:1})===r.id,select(s,{x:Math.SQRT2,y:extent==='minor'?Math.SQRT2:-Math.SQRT2})===r.id);
   s.update(r.id,{visible:false});hits.push(select(s,inside)===undefined);
  }
  return {version:saved.version,textSchema:saved.textSchema,constructionSchema:saved.constructionSchema,roundtrip:JSON.stringify(a.engine.toJSON())===encoded,rejected,atomic,hits,richRendered:/data-rich-text=/.test(a.engine.renderSVG())&&/2,00/.test(a.engine.renderSVG()),kinds:saved.objects.map(o=>o.construction?.kind).filter(Boolean)};
 });
 assert.equal(compatibility.version,8);assert.equal(compatibility.textSchema,3);assert.equal(compatibility.constructionSchema,5);assert.equal(compatibility.roundtrip,true);assert.equal(compatibility.rejected,8);assert.equal(compatibility.atomic,true);assert.ok(compatibility.hits.every(Boolean));assert.equal(compatibility.richRendered,true);assert.ok(compatibility.kinds.includes('polygonRegion'));assert.ok(compatibility.kinds.includes('circleSectorRegion'));assert.ok(compatibility.kinds.includes('angleDirections'));
 for(const kind of ['circleSectorRegion','circleSegmentRegion']){
  await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[{id:'C',type:'circle',cx:0,cy:0,r:2},{id:'A',type:'point',x:2,y:0},{id:'B',type:'point',x:0,y:-2}]}));
  await require('./browser-tool-menu.cjs').choose(page,'[data-tool="construct:'+kind+'"]');
  await page.locator('#toolInstructions [data-region-create-extent]').selectOption('minor');
  await click({x:-2,y:0});await click({x:2,y:0});await click({x:0,y:-2});
  let doc=await saved(),r=doc.objects.find(o=>o.type==='region');assert.ok(r);assert.equal(r.construction.extent,'minor');
  assert.ok(Math.abs(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).regionArea,r.id)-(kind==='circleSectorRegion'?Math.PI:Math.PI-2))<1e-12);
  await page.evaluate(id=>FZI.MathIllustration.editor.selectObject(id),r.id);
  await page.locator('[data-region-extent]').selectOption('directed');
  assert.equal((await saved()).objects.find(o=>o.id===r.id).construction.extent,'directed');
  assert.ok(Math.abs(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).regionArea,r.id)-(kind==='circleSectorRegion'?3*Math.PI:3*Math.PI+2))<1e-12);
  await page.locator('#undoBtn').click();assert.equal((await saved()).objects.find(o=>o.id===r.id).construction.extent,'minor');
  await page.locator('#redoBtn').click();assert.equal((await saved()).objects.find(o=>o.id===r.id).construction.extent,'directed');
  await page.locator('[data-region-extent]').selectOption('minor');
  const pixels=await page.evaluate(async({id,kind})=>{
   const a=FZI.MathIllustration.editor,e=a.engine;e.renderer.showGrid=false;e.renderer.showAxes=false;
   for(const o of e.model.objects)if(o.id!==id)e.update(o.id,{visible:false});
   e.update(id,{style:{fill:'#ff0000',stroke:'#ff0000',opacity:1}});
   const svg=e.renderSVG(),blob=await FZI.MathIllustration.ExportService.png(svg,{width:e.renderer.width,height:e.renderer.height});
   const bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);
   const red=p=>{const pixel=ctx.getImageData(Math.round(e.renderer.mapX(p.x)),Math.round(e.renderer.mapY(p.y)),1,1).data;return pixel[0]>200&&pixel[1]<80&&pixel[2]<80;};
   return {inside:red(kind==='circleSectorRegion'?{x:.8,y:-.8}:{x:1.3,y:-1.3}),outside:red({x:-.8,y:.8}),outsideDisk:red({x:2.2,y:-2.2}),svg};
  },{id:r.id,kind});
  assert.equal(pixels.inside,true);assert.equal(pixels.outside,false);assert.equal(pixels.outsideDisk,false);assert.match(pixels.svg,/data-region-contour/);
 }
 await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
 return {canvasToolAndSelection:'passed',threeRegionRecipes:'passed',independentAreaReferences:'passed',dynamicInvalidRecoveryRoundtrip:'passed',directDragBlocked:'passed',fullDiskSvg:'passed',offlinePng:'passed',jsonRoundtrip:'passed',schema5AxesAndRichV8Roundtrip:'passed',invalidTextSchemaAtomic:'passed',concaveAndSegmentBoundarySelection:'passed',sectorSvgAndOfflinePng:'passed'};
};
