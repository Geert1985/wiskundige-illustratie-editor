const assert=require('node:assert/strict');
module.exports=async page=>{
 const editor=()=>page.evaluate(()=>FZI.MathIllustration.editor);
 const doc=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
 const reset=()=>page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[{id:'triangle',type:'polygon',vertices:[{x:-2,y:-1},{x:2,y:-1},{x:0,y:2}]}],presentation:{bounds:{xMin:-5,xMax:5,yMin:-4,yMax:4}}}));
 const click=async(x,y)=>{const p=await page.evaluate(p=>FZI.MathIllustration.editor.transform().mathToScreen(p),{x,y});await page.mouse.click(p.x,p.y);};
 const expected={centroid:{x:0,y:0},circumcenter:{x:0,y:-1/6},orthocenter:{x:0,y:1/3}};
 for(const kind of Object.keys(expected)){
  await reset();
  await require('./browser-tool-menu.cjs').choose(page,`[data-tool="construct:${kind}"]`);
  await click(0,0);
  const first=(await doc()).objects.filter(o=>o.construction?.kind===kind);
  assert.equal(first.length,1,`${kind} creates one point`);
  assert.equal(first[0].type,'point');assert.equal(first[0].construction.sources[0].objectId,'triangle');assert.equal(first[0].constructionValid,true);
  assert.ok(Math.abs(first[0].x-expected[kind].x)<1e-10);assert.ok(Math.abs(first[0].y-expected[kind].y)<1e-10);
  assert.equal((await doc()).constructionSchema,2);
  await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.engine.update('triangle',{vertices:[{x:-2,y:-1},{x:2,y:-1},{x:0,y:3}]}));});
  const changed=(await doc()).objects.find(o=>o.construction?.kind===kind);assert.equal(changed.constructionValid,true);assert.notEqual(changed.y,first[0].y);
  await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.engine.update('triangle',{vertices:[{x:-2,y:-1},{x:0,y:-1},{x:2,y:-1}]}));});
  assert.equal((await doc()).objects.find(o=>o.construction?.kind===kind).constructionValid,false);
  assert.equal((await page.evaluate(id=>FZI.MathIllustration.editor.engine.getConstructionInfo(id).reasonCode,first[0].id)),'DEGENERATE_TRIANGLE');
  const invalidSvg=await page.evaluate(()=>FZI.MathIllustration.editor.engine.renderSVG());assert.equal(invalidSvg.includes('data-object-id="'+first[0].id+'"'),false);
  await page.evaluate(()=>{const a=FZI.MathIllustration.editor;a.changeDocument(()=>a.engine.update('triangle',{vertices:[{x:-2,y:-1},{x:2,y:-1},{x:0,y:2}]}));});
  assert.equal((await doc()).objects.find(o=>o.construction?.kind===kind).constructionValid,true);
  const svg=await page.evaluate(()=>FZI.MathIllustration.editor.engine.renderSVG());assert.doesNotMatch(require('./browser-tool-menu.cjs').numericSVG(svg),/NaN|Infinity/);
  await page.locator('#undoBtn').click();assert.equal((await doc()).objects.find(o=>o.id===first[0].id).constructionValid,false);
  await page.locator('#redoBtn').click();assert.equal((await doc()).objects.find(o=>o.id===first[0].id).constructionValid,true);
 }
 await page.evaluate(()=>localStorage.removeItem(FZI.MathIllustration.DraftStore.key));
 return {triangleCenters:'passed',dynamicRecovery:'passed',degenerateStatus:'passed',historyAndSVG:'passed'};
};
