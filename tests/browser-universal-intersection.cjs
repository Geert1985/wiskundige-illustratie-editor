const assert=require('node:assert/strict');
module.exports=async page=>{
 await page.setViewportSize({width:1446,height:884});await page.reload();
 await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[{id:'L',type:'straight',x1:-3,y1:0,x2:3,y2:0},{id:'C',type:'circle',cx:0,cy:0,r:2}],presentation:{showGrid:false}}));
 const {choose}=require('./browser-tool-menu.cjs'),click=async(x,y)=>{const p=await page.evaluate(({x,y})=>FZI.MathIllustration.editor.transform().mathToScreen({x,y}),{x,y});await page.mouse.click(p.x,p.y);};
 for(const id of ['L','C'])assert.equal(await page.evaluate(id=>{const a=FZI.MathIllustration.editor;a.selectObject(id);const plan=a.intersectionContextPlans(a.engine.get(id))[0];return !!plan&&a.startContextConstruction('construct:intersection',id,plan.key)&&a.interaction.sources[0].objectId===id;},id),true);
 await choose(page,'[data-tool="construct:intersection"]');
 assert.equal(await page.evaluate(()=>{const a=FZI.MathIllustration.editor,p=a.transform().mathToScreen({x:-2.8,y:0});const hit=a.hoverAt({clientX:p.x,clientY:p.y});return hit?.object?.id==='L'&&a.cursorFor(hit)==='pointer';}),true);
 assert.equal(await page.locator('[data-tool="construct:intersection"]').count(),1);
 const instructions=page.locator('#toolInstructions');await click(-2.8,0);assert.ok(await instructions.locator('[data-intersection-source]').count()>=2);await instructions.locator('[data-intersection-source]').first().evaluate(button=>button.click());
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.interaction.sources),[{objectId:'L'}]);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),2);
 await choose(page,'[data-tool="construct:intersection"]');await click(-2.8,0);await instructions.locator('[data-intersection-source]').first().evaluate(button=>button.click());await click(1.8,0.87);
 const points=await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.filter(o=>o.construction?.kind==='lineCircleIntersection').map(o=>o.construction.branch));assert.deepEqual(points,[0,1]);
 assert.equal(await instructions.locator('[data-intersection-branch],[data-intersection-confirm]').count(),0);assert.equal(await page.locator('[data-intersection-candidate]').count(),0);
 assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.history.entries.length),1);
 await page.locator('#undoBtn').click();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),2);
 await page.locator('#redoBtn').click();assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.engine.model.objects.length),4);
 for(const count of [3,4,5])for(const reverse of [false,true]){
  const result=await page.evaluate(({count,reverse})=>{const a=FZI.MathIllustration.editor,vertices=[{x:-3,y:2},{x:-3,y:.4},{x:3,y:.4},{x:3,y:2},{x:0,y:3}].slice(0,count),edge={objectId:'P',part:'edge',index:1};a.loadDocument({objects:[{id:'P',type:'polygon',vertices},{id:'C',type:'circle',cx:0,cy:0,r:2}]});const first=reverse?'C':'P';a.selectObject(first);const ctx={type:'object',id:first,name:first,objects:[a.engine.get(first)],...(reverse?{}:{edgeRef:edge})},item=a.radialProperties.contextConstructions(ctx).find(item=>item.entry.id==='construct:intersection');if(!item)return {offered:false};const started=a.startContextConstruction(item.entry.id,first,item.plan.key,reverse?null:edge),prefill=a.interaction.sources[0];a.acceptIntersectionSource(reverse?edge:{objectId:'C'});return {offered:true,started,prefill,recipes:a.engine.model.objects.filter(o=>o.construction).map(o=>o.construction)};},{count,reverse});
  assert.equal(result.offered,true);assert.equal(result.started,true);assert.deepEqual(result.prefill,reverse?{objectId:'C'}:{objectId:'P',part:'edge',index:1});assert.equal(result.recipes.length,2);for(const recipe of result.recipes)assert.deepEqual(recipe.sources,[{objectId:'P',part:'edge',index:1},{objectId:'C'}]);
 }
 return {immediateAllBranches:'passed',noPreviewOrConfirm:'passed',cancelBeforeSecondSource:'passed',atomicUndoRedo:'passed'};
};
