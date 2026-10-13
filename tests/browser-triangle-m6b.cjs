const assert=require('node:assert/strict');
module.exports=async page=>{
 const doc=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),
  expected=['incenter','incircle','eulerLine','ninePointCircle'];
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.loadDocument({version:3,objects:[{id:'A',type:'point',x:0,y:0},{id:'B',type:'point',x:4,y:0},{id:'C',type:'point',x:0,y:3}],presentation:{bounds:{xMin:-5,xMax:8,yMin:-4,yMax:7}}});});
 const catalog=await page.evaluate(()=>FZI.MathIllustration.editor.toolCatalog.list('sidebar').find(c=>c.id==='constructies').entries.filter(x=>['construct:incenter','construct:incircle','construct:eulerLine','construct:ninePointCircle'].includes(x.id)).map(x=>x.id));
 assert.deepEqual(catalog,expected.map(kind=>'construct:'+kind));
 const click=async p=>{const at=await page.evaluate(p=>FZI.MathIllustration.editor.transform().mathToScreen(p),p);await page.mouse.click(at.x,at.y);};
 // Create a dependent source using the G-TRI1 canvas flow, then use each M6b tool.
 await require('./browser-tool-menu.cjs').choose(page,'[data-tool="construct:triangleFromPoints"]');
 await click({x:0,y:0});await click({x:0,y:0});assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.sources.length),1);
 await click({x:4,y:0});await click({x:0,y:3});
 let saved=await doc(),triangle=saved.objects.find(o=>o.construction?.kind==='triangleFromPoints');assert.ok(triangle);const triangleId=triangle.id;
 await require('./browser-tool-menu.cjs').choose(page,'[data-tool="construct:incenter"]');await click({x:1,y:1});
 saved=await doc();const incenter=saved.objects.find(o=>o.construction?.kind==='incenter');assert.ok(incenter);
 const created=await page.evaluate(({triangleId,kinds})=>{const a=FZI.MathIllustration.editor,result={};for(const kind of kinds){let row;a.changeDocument(()=>row=a.execute('construction.create',{toolId:'construct:'+kind,sources:[{objectId:triangleId}]}).result[0]);result[kind]=row.id;}return result;},{triangleId,kinds:['incircle','eulerLine','ninePointCircle']});
 const ids={incenter:incenter.id,...created},close=(actual,expectedValue)=>assert.ok(Math.abs(actual-expectedValue)<1e-10,`${actual} != ${expectedValue}`);
 let m6b=await page.evaluate(ids=>Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,FZI.MathIllustration.editor.engine.get(id)])),ids);
 close(m6b.incenter.x,1);close(m6b.incenter.y,1);close(m6b.incircle.r,1);close(m6b.incircle.cx,1);close(m6b.incircle.cy,1);
 assert.equal(m6b.eulerLine.type,'straight');close(m6b.eulerLine.x1,2);close(m6b.eulerLine.y1,1.5);
 close(m6b.ninePointCircle.r,1.25);close(m6b.ninePointCircle.cx,1);close(m6b.ninePointCircle.cy,.75);
 assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON().constructionSchema),2);
 // A source point edit moves every result; undo/redo follows normal history.
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.execute('object.setGeometry',{id:'B',fields:[{path:'x',value:6}]}));});
 m6b=await page.evaluate(ids=>Object.fromEntries(Object.entries(ids).map(([kind,id])=>[kind,FZI.MathIllustration.editor.engine.get(id)])),ids);assert.equal(m6b.incircle.id,ids.incircle);assert.notEqual(m6b.incircle.r,1);
 await page.locator('#undoBtn').click();close(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).r,ids.incircle),1);
 await page.locator('#redoBtn').click();assert.notEqual(await page.evaluate(id=>FZI.MathIllustration.editor.engine.get(id).r,ids.incircle),1);
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.execute('object.setGeometry',{id:'C',fields:[{path:'y',value:0}]}));});
 const invalidReasons=await page.evaluate(ids=>Object.values(ids).map(id=>FZI.MathIllustration.editor.engine.getConstructionInfo(id).reasonCode),ids);assert.deepEqual(invalidReasons,['SOURCE_INVALID','SOURCE_INVALID','SOURCE_INVALID','SOURCE_INVALID']);
 saved=await doc();await page.evaluate(d=>FZI.MathIllustration.editor.loadDocument(d),saved);assert.ok(await page.evaluate(ids=>Object.values(ids).every(id=>FZI.MathIllustration.editor.engine.getConstructionInfo(id).reasonCode==='SOURCE_INVALID'),ids));
 await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.execute('object.setGeometry',{id:'C',fields:[{path:'y',value:3}]}));});
 assert.ok(await page.evaluate(ids=>Object.values(ids).every(id=>FZI.MathIllustration.editor.engine.getConstructionInfo(id).valid),ids));
 const svg=await page.evaluate(()=>FZI.MathIllustration.editor.engine.renderSVG());assert.doesNotMatch(require('./browser-tool-menu.cjs').numericSVG(svg),/NaN|Infinity/);assert.match(svg,new RegExp('data-object-id="'+ids.incircle+'"'));
 const png=await page.evaluate(async svg=>{const a=FZI.MathIllustration.editor,b=await FZI.MathIllustration.ExportService.png(svg,{width:a.engine.renderer.width,height:a.engine.renderer.height});return {type:b.type,size:b.size};},svg);assert.equal(png.type,'image/png');assert.ok(png.size>100);
 const equilateral=[{x:0,y:0},{x:2,y:0},{x:1,y:Math.sqrt(3)}],reason=await page.evaluate(vertices=>FZI.MathIllustration.ConstructionService.evaluate({kind:'eulerLine',sources:[{objectId:'T'}]},new Map([['T',{id:'T',type:'polygon',vertices}]] )).reasonCode,equilateral);assert.equal(reason,'UNDEFINED_EULER_LINE');
 await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
 return {tools:catalog,incenter:'passed',incircle:'passed',eulerLine:'passed',ninePointCircle:'passed',dynamicHistory:'passed',degeneracyJsonRecovery:'passed',svgExport:'passed',offlinePngExport:'passed',equilateralEulerAmbiguity:reason};
};
