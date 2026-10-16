const assert=require('node:assert/strict');

module.exports=async page=>{
  const oldViewport=page.viewportSize();
  await page.setViewportSize({width:1280,height:900});
  await page.reload();
  const search=page.locator('#toolSearch');
  const categories=page.locator('#toolGrid > [data-tool-category]');
  const subgroups=page.locator('#toolGrid [data-tool-subgroup]');
  assert.equal(await categories.count(),8);
  assert.equal(await subgroups.count(),6);
  assert.deepEqual(await categories.evaluateAll(ns=>ns.map(n=>n.open)),Array(8).fill(false));
  assert.deepEqual(await subgroups.evaluateAll(ns=>ns.filter(n=>n.querySelector('.tool-subgroup-toggle')).map(n=>n.querySelector('.tool-subgroup-toggle').getAttribute('aria-expanded'))),Array(5).fill('false'));
  assert.equal(await page.locator('[data-tool-subgroup="vectoren"] .tool-subgroup-toggle').count(),0,'Vectoren is visible without an expand control');
  assert.equal(await page.locator('#sidebarLayersPanel').isVisible(),false,'The layers panel starts inactive');
  for(const summary of ['Illustratie','Bediening']){
    const section=page.locator('#sidebarLayersPanel details').filter({has:page.locator('summary', {hasText:summary})}).first();
    assert.equal(await section.evaluate(el=>el.open),false,summary);
  }
  const before=await page.evaluate(()=>JSON.stringify(FZI.MathIllustration.editor.engine.toJSON()));
  const constructs=page.locator('[data-tool-category="constructies"]');
  await constructs.locator(':scope > summary').click();
  const triangle=constructs.locator('[data-tool-subgroup="driehoekconstructies"]');
  const toggle=triangle.locator(':scope > .tool-subgroup-toggle');
  await toggle.focus();
  await page.keyboard.press('Enter');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await triangle.locator(':scope > .tool-grid').isVisible(),true);
  assert.equal(await constructs.locator('[data-tool-subgroup="kegelsneden"] .tool-subgroup-toggle').getAttribute('aria-expanded'),'false');

  await search.fill('Negenpuntscirkel');
  assert.equal(await page.locator('[data-tool="construct:ninePointCircle"]').isVisible(),true);
  assert.equal(await page.locator('[data-tool="construct:centroid"]').isVisible(),false);
  assert.equal(await page.locator('#toolSearchFeedback').textContent(),'1 gereedschap gevonden.');
  assert.equal(await categories.evaluateAll(ns=>ns.filter(n=>n.open).length),1);
  assert.equal(await page.locator('[data-tool-subgroup="driehoekconstructies"] .tool-subgroup-toggle').getAttribute('aria-expanded'),'true');
  await search.fill('punt op cirkel');
  const pointOnCircle=page.locator('[data-tool="construct:pointOnCircle"]');
  assert.equal(await pointOnCircle.isVisible(),true,'Search must include nested construction choices');
  assert.equal(await page.locator('[data-tool-subgroup="puntconstructies"] .tool-subgroup-toggle').getAttribute('aria-expanded'),'true');
  await search.fill('Gecombineerde meting');
  const combined=page.locator('.combined-measurement-placeholder');
  assert.equal(await combined.isVisible(),true);
  assert.equal(await page.locator('#toolSearchFeedback').textContent(),'1 gereedschap gevonden.');
  assert.equal(await page.locator('#toolGrid [data-tool="construct:area"], #toolGrid [data-tool="construct:perimeter"]').count(),0);
  await search.fill('Vectoren');assert.equal(await page.locator('[data-tool-subgroup="vectoren"]').isVisible(),true);assert.equal(await page.locator('#toolSearchFeedback').textContent(),'1 gereedschap gevonden.');
  await search.fill('niet-bestaande-meetkundige-tool');
  assert.equal(await page.locator('#toolSearchFeedback').textContent(),'Geen gereedschap gevonden.');
  assert.equal(await categories.evaluateAll(ns=>ns.filter(n=>n.open).length),0);
  await search.fill('Negenpuntscirkel');
  await search.press('Escape');
  assert.equal(await search.inputValue(),'');
  assert.equal(await constructs.evaluate(el=>el.open),true,'Restore pre-search category state');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true','Restore pre-search subgroup state');
  assert.equal(await page.locator('#toolSearchFeedback').isVisible(),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(FZI.MathIllustration.editor.engine.toJSON())),before,'Search must never mutate the document');

  for(const [name,width,height] of [['desktop',1280,900],['tablet',800,900],['mobile',390,844]]){
    await page.setViewportSize({width,height});
    await page.reload();
    if(await page.locator('#toolsToggle').isVisible()) await page.locator('#toolsToggle').click();
    await page.locator('#toolSearch').fill('Middelpunt omgeschreven cirkel');
    const button=page.locator('[data-tool="construct:circumcenter"]');
    assert.equal(await button.isVisible(),true,name);
    const sizes=await page.evaluate(()=>{
      const sidebar=document.querySelector('.sidebar'),tool=document.querySelector('[data-tool="construct:circumcenter"]');
      const a=sidebar.getBoundingClientRect(),b=tool.getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth>window.innerWidth,within:b.left>=a.left-1&&b.right<=a.right+1,toolOverflow:tool.scrollWidth>tool.clientWidth+1};
    });
    assert.equal(sizes.overflow,false,name);
    assert.equal(sizes.within,true,name);
    assert.equal(sizes.toolOverflow,false,name);
  }
  await page.setViewportSize(oldViewport);
  await page.reload();
  return {categories:8,subgroups:6,defaultCollapsed:'passed',keyboardDisclosure:'passed',liveSearch:'passed',splitSearch:'passed',restoreState:'passed',documentUnchanged:'passed',responsiveChecks:3};
};
