const assert=require('node:assert/strict');const fs=require('node:fs');
const path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
module.exports=async page=>{const screenshots=path.join(__dirname,'..','experiments','text-editor-integration','screenshots');fs.mkdirSync(screenshots,{recursive:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(async()=>{await FZI.MathIllustration.MathFragments.load();FZI.MathIllustration.editor.loadDocument({version:7,textSchema:3,objects:[{id:'T',type:'text',name:'Lesnotitie',x:0,y:0,textContent:{schema:3,defaults:{fontId:'sans',fontSize:16,color:'#222222'},width:120,paragraphs:[{id:'p',align:'left',lineHeight:1.25,runs:[{id:'r',kind:'text',text:'Wrapbare tekst voor controle van de nieuwe teksteditor en de bestaande inhoud.',marks:{bold:true}}]}]}}]});await FZI.MathIllustration.editor.openRichText('T');});
 await page.locator('#textDialog').waitFor({state:'visible'});
 assert.equal(await page.locator('#textDialogTitle').textContent(),'Tekst bewerken');
 assert.equal(await page.locator('#textDialogContext').textContent(),'Lesnotitie');
 assert.equal(await page.locator('#textSubmit').textContent(),'Toepassen');
 assert.equal(await page.locator('.rich-toolbar-group').count(),4);
 const initial=await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON());await page.screenshot({path:path.join(screenshots,'01-editor-desktop.png')});
 const responsive=[];
 for(const viewport of [{width:1280,height:900},{width:768,height:900},{width:390,height:844},{width:1280,height:580}]){
   await page.setViewportSize(viewport);
   const before=await page.locator('#textDialog').boundingBox();
   await page.locator('#richSymbols').click();
   const open=await page.locator('#textDialog').boundingBox();
   const metrics=await page.evaluate(()=>{const d=document.querySelector('#textDialog'),actions=document.querySelector('.text-editor-actions').getBoundingClientRect(),panel=document.querySelector('#textInsertPanel').getBoundingClientRect();return {viewportWidth:innerWidth,documentWidth:document.documentElement.scrollWidth,dialog:{x:Math.round(d.getBoundingClientRect().x),y:Math.round(d.getBoundingClientRect().y),width:Math.round(d.getBoundingClientRect().width),height:Math.round(d.getBoundingClientRect().height)},actionsVisible:actions.top>=0&&actions.bottom<=innerHeight+1,panelVisible:panel.left>=0&&panel.right<=innerWidth+1};});
   assert.ok(metrics.documentWidth<=metrics.viewportWidth,JSON.stringify(metrics));
   assert.equal(Math.round(before.height),Math.round(open.height));
   assert.ok(metrics.actionsVisible,JSON.stringify(metrics));assert.ok(metrics.panelVisible,JSON.stringify(metrics));if(viewport.width===1280&&viewport.height===900)assert.ok(metrics.dialog.width>=900,JSON.stringify(metrics));
   responsive.push({...viewport,...metrics});if(viewport.width===1280&&viewport.height===900)await page.screenshot({path:path.join(screenshots,'02-symbol-panel-desktop.png')});if(viewport.width===390)await page.screenshot({path:path.join(screenshots,'03-editor-mobile.png')});if(viewport.height===580)await page.screenshot({path:path.join(screenshots,'04-editor-short-window.png')});
   await page.locator('#textInsertClose').click();
 }
 await page.setViewportSize({width:1280,height:900});
 await page.locator('#textDialogClose').click();
 assert.equal(await page.locator('#textDialog').isVisible(),false);
 assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),initial,'Close button must cancel the draft without committing.');
 await page.evaluate(()=>FZI.MathIllustration.editor.openRichText('T'));
 await page.locator('#richSymbols').click();
 assert.equal(await page.locator('#symbolCategory option').count(),14);
 await page.locator('#symbolSearch').fill('thèta');
 await page.getByRole('button',{name:'theta (θ)',exact:true}).click();
 assert.ok(await page.evaluate(()=>FZI.MathIllustration.editor.richTextEditor.get().paragraphs.flatMap(p=>p.runs).some(run=>run.kind==='text'&&run.text.includes('θ'))),'Unicode symbols should insert at the saved rich-text cursor.');
 await page.locator('#richSymbols').click();await page.locator('#symbolCategory').selectOption('powers-roots');await page.locator('#symbolSearch').fill('root');
 await page.getByRole('button',{name:/^wortel \(√\)/}).click();
 assert.equal(await page.locator('#textInsertPanel').getAttribute('data-mode'),'formula');assert.equal(await page.locator('#mathSource').inputValue(),'\\sqrt{x}');
 await page.locator('#textCancel').click();assert.deepEqual(await page.evaluate(()=>FZI.MathIllustration.editor.engine.toJSON()),initial,'Cancel should leave symbol/formula drafts uncommitted.');
 assert.deepEqual(errors,[]);
 return {titleAndObjectContext:'passed',groupedToolbar:'passed',closeCancels:'passed',unicodeCatalogInsertion:'passed',accentInsensitiveSearch:'passed',categoryFilter:'passed',formulaTemplateRoute:'passed',symbolCancel:'passed',panelOverlayPreservesDialogHeight:'passed',responsive,actionBar:'passed',screenshots:fs.readdirSync(screenshots),browserErrors:errors};
};
if(require.main===module){
 const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}require('node:fs').readFile(file,(e,d)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(d);});});
 (async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;try{browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});await page.route('https://fonts.googleapis.com/**',r=>r.abort());await page.goto('http://127.0.0.1:'+server.address().port+'/editor.html');console.log(JSON.stringify(await module.exports(page),null,2));}finally{if(browser)await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
}
