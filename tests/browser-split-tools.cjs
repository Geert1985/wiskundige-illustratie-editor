const assert=require('node:assert/strict');
const {choose}=require('./browser-tool-menu.cjs');
module.exports=async page=>{
 await page.reload();
 const category=page.locator('[data-tool-category="constructies"]');
 if(!(await category.evaluate(node=>node.open)))await category.locator(':scope > summary').click();
 const groups=category.locator(':scope > .tool-grid > .tool-subgroup');
 assert.deepEqual(await groups.evaluateAll(nodes=>nodes.map(node=>node.querySelector(':scope > .tool-subgroup-toggle').textContent.trim())),['Puntconstructies','Lijnconstructies','Cirkelconstructies','Kegelsneden','Vierhoekconstructies','Driehoekconstructies']);
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.toolCatalog.list('sidebar').find(item=>item.id==='constructies').entries.filter(item=>item.status==='implemented').map(item=>item.id).filter(id=>['construct:circleByCenterPoint','construct:parallel','construct:tangent','construct:lineBetweenPoints'].includes(id)).sort()),['construct:circleByCenterPoint','construct:lineBetweenPoints','construct:parallel','construct:tangent'].sort());
 for(const id of ['construct:circleByCenterPoint','construct:parallel','construct:tangent','construct:lineBetweenPoints'])assert.equal(await category.locator(`[data-tool="${id}"]`).count(),1);
 const doc=()=>page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());
 await page.evaluate(()=>FZI.MathIllustration.editor.loadDocument({objects:[]}));const before=await doc();
 await choose(page,'[data-tool="construct:lineBetweenPoints"]');assert.equal(await page.evaluate(()=>FZI.MathIllustration.editor.tool),'construct:lineBetweenPoints');assert.deepEqual(await doc(),before);
 const subgroup=category.locator('[data-tool-subgroup="lijnconstructies"] > .tool-subgroup-toggle');if(await subgroup.getAttribute('aria-expanded')==='true')await subgroup.click();await subgroup.focus();await page.keyboard.press('Enter');assert.equal(await subgroup.getAttribute('aria-expanded'),'true');assert.equal(await category.locator('[data-tool="construct:parallel"]').isVisible(),true);await page.keyboard.press('Escape');
 return {constructionSubgroups:'passed',catalogToolIds:'passed',directToolSelection:'passed',documentInvariant:'passed',keyboardSubgroup:'passed'};
};
