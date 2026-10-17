const assert=require('node:assert/strict'),path=require('node:path');
const {choose}=require('./browser-tool-menu.cjs');
module.exports=async page=>{
 const originalViewport=page.viewportSize();await page.setViewportSize({width:1280,height:900});await page.reload();
 const ids=await page.locator('#toolGrid [data-tool]').evaluateAll(nodes=>nodes.map(n=>n.dataset.tool));
 assert.equal(ids.length,39);assert.equal(new Set(ids).size,39);
 assert.equal(ids.filter(id=>id==='construct:intersection').length,1);
 for(const id of ['construct:lineIntersection','construct:lineCircleIntersection','construct:circleCircleIntersection'])assert.ok(!ids.includes(id),id+' must stay out of the visible tool catalog.');
 const snapshot=()=>page.evaluate(()=>{const a=FZI.MathIllustration.editor;return {document:a.engine.toJSON(),tool:a.tool,selected:a.selectedIds,interaction:a.interaction,history:a.history.entries,cursor:a.history.cursor,status:a.nodes.status.textContent,storage:Object.entries(localStorage)};});
 await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[]}));
 const documentBefore=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
 for(const id of ids){await choose(page,'#toolGrid [data-tool="'+id+'"]');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),id);assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),documentBefore);}
 await page.keyboard.press('Escape');
 const categories=page.locator('#toolGrid > [data-tool-category]');assert.equal(await categories.count(),8);assert.deepEqual(await categories.evaluateAll(nodes=>nodes.map(node=>node.querySelector(':scope > summary').childNodes[0].textContent.trim())),['Vrije objecten','Constructies','Meten & analyseren','Gebieden & opvulling','Transformeren','Functies & grafieken','Tekst & interactie','Verzamelingen']);
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.toolCatalog.list('sidebar').map(category=>category.id)),['vrije-objecten','constructies','meten','gebieden','transformeren','functies','tekst','verzamelingen']);
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.toolCatalog.list('sidebar').map(category=>category.entries.filter(entry=>entry.status==='implemented').map(entry=>entry.id)).flat().sort()),ids.slice().sort());
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.toolCatalog.list('fullscreen').flatMap(category=>category.entries.filter(entry=>entry.status==='implemented').map(entry=>entry.id)).filter(id=>id.startsWith('construct:')&&id.toLowerCase().includes('intersection'))),['construct:intersection']);
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.toolCatalog.list('sidebar').find(category=>category.id==='gebieden').entries.filter(entry=>entry.status==='implemented').map(entry=>entry.commandToolId).sort()),['construct:circleSectorRegion','construct:circleSegmentRegion','construct:polygonRegion'].sort());
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.toolCatalog.list('fullscreen').find(category=>category.id==='constructies').emptySubgroups.map(group=>group.label)),['Vectoren']);
 assert.equal(await page.locator('[data-tool-category="constructies"] [data-tool-subgroup="cirkelconstructies"]').count(),0);
 for(let i=0;i<8;i++){const category=categories.nth(i),wasOpen=await category.evaluate(n=>n.open),others=await categories.evaluateAll(ns=>ns.map(n=>n.open));await category.locator(':scope > summary').focus();await page.keyboard.press('Enter');assert.equal(await category.evaluate(n=>n.open),!wasOpen);const after=await categories.evaluateAll(ns=>ns.map(n=>n.open));for(let j=0;j<8;j++)if(i!==j)assert.equal(after[j],others[j]);if(wasOpen)await category.locator(':scope > summary').click();}
 const placeholders=page.locator('#toolGrid .tool-placeholder'),before=await snapshot();
 const combinedSidebar=page.locator('#toolGrid .combined-measurement-placeholder');assert.equal(await combinedSidebar.count(),1);assert.equal(await combinedSidebar.getAttribute('title'),'Binnenkort beschikbaar');
 await page.locator('#toolSearch').fill('Gecombineerde meting');assert.equal(await combinedSidebar.isVisible(),true);assert.equal(await page.locator('#toolSearchFeedback').textContent(),'1 gereedschap gevonden.');await page.locator('#toolSearch').fill('');
 await page.locator('#toolSearch').fill('Snijpunt');assert.equal(await page.locator('#toolGrid [data-tool]:visible').count(),1);assert.equal(await page.locator('#toolGrid [data-tool]:visible').getAttribute('data-tool'),'construct:intersection');
 for(const query of ['Snijpunt van lijnen','Snijpunt lijn-cirkel','Snijpunt cirkels']){await page.locator('#toolSearch').fill(query);assert.equal(await page.locator('#toolSearchFeedback').textContent(),'Geen gereedschap gevonden.',query);}
 await page.locator('#toolSearch').fill('');
 for(let i=0;i<await placeholders.count();i++){await placeholders.nth(i).click();assert.deepEqual(await snapshot(),before);}
 assert.equal(await placeholders.locator('button,a,input,select,[tabindex],[data-tool]').count(),0);
 await page.locator('#canvasFullscreenBtn').click();await page.locator('#canvasToolsBtn').click();
 assert.equal(await page.locator('#canvasToolsMenu > section').count(),8);
 assert.equal(await page.locator('#canvasToolsMenu .tool-subgroup-empty').count(),1);
 assert.deepEqual((await page.locator('#canvasToolsMenu [data-canvas-tool]').evaluateAll(ns=>ns.map(n=>n.dataset.canvasTool))).sort(),ids.slice().sort());
 const fullscreenBefore=await snapshot(),fullscreenPlans=page.locator('#canvasToolsMenu .tool-placeholder');
 const combinedFullscreen=page.locator('#canvasToolsMenu .tool-placeholder').filter({hasText:'Gecombineerde meting'});assert.equal(await combinedFullscreen.getAttribute('title'),'Binnenkort beschikbaar');
 assert.equal(await fullscreenPlans.count(),await placeholders.count());
 for(let i=0;i<await fullscreenPlans.count();i++){await fullscreenPlans.nth(i).click();assert.deepEqual(await snapshot(),fullscreenBefore);}
 await page.keyboard.press('Escape');assert.equal(await page.locator('#canvasToolsMenu').isVisible(),false);await page.locator('#canvasFullscreenBtn').click();
 // The existing preference key is reused for static angles; no new preference storage is introduced.
 await page.evaluate(()=>localStorage.setItem('fzi-math-illustration-linear-tool','rightAngle'));await page.reload();
  assert.equal(await page.locator('#toolGrid [data-tool="rightAngle"]').count(),1);
  assert.equal(await page.locator('#toolGrid [data-tool="line"]').count(),1);
 await page.evaluate(()=>localStorage.removeItem('fzi-math-illustration-linear-tool'));
 for(const [name,width,height] of [['desktop',1280,900],['tablet',768,900],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.reload();if(await page.locator('#toolsToggle').isVisible())await page.locator('#toolsToggle').click();
  await page.locator('[data-tool-category="constructies"] > summary').click();
  await page.locator('[data-tool-category="constructies"] .tool-subgroup-toggle').evaluateAll(buttons=>buttons.forEach(button=>button.click()));
  const bounds=await page.evaluate(()=>{const s=document.querySelector('.sidebar'),b=s.getBoundingClientRect();return {sidebar:b.toJSON(),overflow:document.documentElement.scrollWidth>innerWidth,rows:[...document.querySelectorAll('#toolGrid .tool-subgroup > .tool-grid > .tool')].map(n=>n.getBoundingClientRect().toJSON())};});
  assert.equal(bounds.overflow,false);for(const row of bounds.rows){assert.ok(row.x>=bounds.sidebar.x);assert.ok(row.right<=bounds.sidebar.right+1);}
  await page.screenshot({path:path.resolve(__dirname,'../test-results/tool-panel-'+name+'.png')});
 }
 await page.setViewportSize(originalViewport);await page.reload();await page.screenshot({path:path.resolve(__dirname,'../test-results/tool-panel-overview.png')});
 return {allTools:39,categories:8,visibleIntersectionTools:1,legacyIntersectionToolsVisible:0,intersectionSearch:'passed',fullscreenIntersectionCatalog:'passed',plannedTools:await placeholders.count(),placeholderInertness:'passed',fullscreenPlaceholders:'passed',independentKeyboardCollapse:'passed',legacyAnglePreference:'passed',responsiveScreenshots:4};
};
