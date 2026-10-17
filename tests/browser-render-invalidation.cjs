const assert=require('node:assert/strict');

module.exports=async page=>{
 await page.evaluate(()=>{const app=FZI.MathIllustration.editor;app.loadDocument({version:5,layerSchema:1,layers:[{id:'layer-1',name:'Basislaag',visible:true,members:['p']}],type:'geometry',objects:[{id:'p',type:'point',x:0,y:0,name:'P'}],presentation:{bounds:{xMin:-5,xMax:5,yMin:-3,yMax:3},showGrid:true}});window.__renderInvalidationCounts={list:0,inspector:0};for(const [key,name] of [['renderViewList','list'],['renderInspector','inspector']]){const original=app[key];app[key]=function(...args){window.__renderInvalidationCounts[name]++;return original.apply(this,args);};}});
 const wrap=page.locator('#canvasWrap'),rect=await wrap.boundingBox();
 const initialScale=await page.evaluate(()=>FZI.MathIllustration.editor.engine.renderer.scale());
 await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.wheel(0,-100);
 await page.waitForFunction(before=>FZI.MathIllustration.editor.engine.renderer.scale()>before,initialScale);
 assert.deepEqual(await page.evaluate(()=>window.__renderInvalidationCounts),{list:0,inspector:0},'zoom must retain object-list and inspector DOM');
 const percent=await page.evaluate(()=>FZI.MathIllustration.editor.nodes.zoomPercent.textContent);assert.notEqual(percent,'100%');
 await page.evaluate(()=>{FZI.MathIllustration.editor.navigationMode='pan';});
 await page.mouse.move(rect.x+rect.width-30,rect.y+rect.height-30);await page.mouse.down();await page.mouse.move(rect.x+rect.width-60,rect.y+rect.height-55,{steps:4});await page.mouse.up();await page.waitForTimeout(50);
 assert.deepEqual(await page.evaluate(()=>window.__renderInvalidationCounts),{list:0,inspector:0},'pan must retain object-list and inspector DOM');
 const boundsAfterPan=await page.evaluate(()=>FZI.MathIllustration.editor.engine.renderer.bounds);
 await page.evaluate(()=>{const app=FZI.MathIllustration.editor;app.navigationMode='select';app.invalidate();});
 assert.deepEqual(await page.evaluate(()=>window.__renderInvalidationCounts),{list:1,inspector:1},'full invalidation must still refresh both panels');
 return {zoomPercent:percent,boundsAfterPan,counts:await page.evaluate(()=>window.__renderInvalidationCounts)};
};
