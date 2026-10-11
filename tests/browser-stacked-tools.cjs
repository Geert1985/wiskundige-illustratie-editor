const assert=require('node:assert/strict');
module.exports=async page=>{
 const viewport=page.viewportSize();
 for(const width of [1446,1159,1024,760,390]){
  await page.setViewportSize({width,height:668});await page.reload();
  if(width<760)await page.evaluate(()=>document.body.classList.add('tools-open'));
  await page.locator('#toolGrid details').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
  const layout=await page.evaluate(()=>{const sidebar=document.querySelector('.sidebar'),box=sidebar.getBoundingClientRect();const grids=[...document.querySelectorAll('#toolGrid .tool-grid')];return {width:box.width,groups:grids.map(g=>[...g.children].filter(n=>n.matches('.tool,.tool-split')).map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,bottom:r.bottom};}))};});
  assert.ok(layout.width<=222,JSON.stringify(layout));
  for(const group of layout.groups)for(let i=1;i<group.length;i++){assert.ok(Math.abs(group[i].x-group[0].x)<1);assert.ok(Math.abs(group[i].width-group[0].width)<1);assert.ok(group[i].y>=group[i-1].bottom);}
  const toggle=page.locator('#linearToolMain').locator('..').locator('[data-split-toggle]');await toggle.click();
  const menu=await page.locator('#linearToolMain').locator('..').locator('.split-tool-menu').boundingBox();const sidebar=await page.locator('.sidebar').boundingBox();assert.ok(menu.x>=sidebar.x&&menu.x+menu.width<=sidebar.x+sidebar.width);
  if(width===1159)await page.screenshot({path:require('node:path').resolve(__dirname,'../../../../outputs/stacked-tools.png')});
 }
 await page.setViewportSize(viewport);await page.reload();return {singleColumn:'passed',equalWidths:'passed',narrowSidebar:'passed',splitMenuBounds:'passed',viewports:5};
};
