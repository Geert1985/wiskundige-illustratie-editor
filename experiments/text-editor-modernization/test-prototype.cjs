const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const root=path.resolve(__dirname,'../..');
const shots=path.join(__dirname,'screenshots');
fs.mkdirSync(shots,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf'};
const server=http.createServer((req,res)=>{
  let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400).end();return;}
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(data);});
});

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://fonts.googleapis.com/**',route=>route.abort());

    await page.goto('http://127.0.0.1:'+server.address().port+'/editor.html');
    await page.evaluate(()=>{const editor=FZI.MathIllustration.editor;editor.setTool('text');editor.pendingText={point:{x:0,y:0}};editor.openRichText();});
    await page.locator('#textDialog').waitFor({state:'visible'});
    await page.screenshot({path:path.join(shots,'01-existing-editor.png')});

    await page.goto('http://127.0.0.1:'+server.address().port+'/experiments/text-editor-modernization/index.html');
    await page.waitForFunction(()=>FZI.MathIllustration.MathFragments.ready(),null,{timeout:15000});
    const state=await page.evaluate(()=>({catalog:window.T5Prep.SymbolCatalog.entries.length,categories:window.T5Prep.SymbolCatalog.categories.length,parser:typeof FZI.MathIllustration.MathSource.validate,renderer:typeof FZI.MathIllustration.MathFragments.svg}));
    assert.ok(state.catalog>=30);assert.equal(state.categories,10);assert.equal(state.parser,'function');assert.equal(state.renderer,'function');
    const rejectedCatalog=await page.evaluate(()=>window.T5Prep.SymbolCatalog.entries.filter(item=>{try{FZI.MathIllustration.MathSource.validate(item.latex);return false;}catch{return true;}}).map(item=>item.id));
    assert.deepEqual(rejectedCatalog,[],'Every catalog LaTeX representation must pass the existing production whitelist.');
    await page.screenshot({path:path.join(shots,'02-prototype-text.png')});

    // Text symbols replace the saved selection and use Unicode.
    await page.evaluate(()=>{const surface=document.getElementById('textSurface'),walker=document.createTreeWalker(surface,NodeFilter.SHOW_TEXT);let node;while(node=walker.nextNode()){if(node.nodeValue.startsWith('Een wiskundige')){const range=document.createRange();range.setStart(node,4);range.collapse(true);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);break;}}});
    await page.locator('[data-panel="symbols-text"]').click();
    await page.locator('#symbolSearch').fill('theta');
    assert.equal(await page.locator('#symbolGrid [data-symbol-id="theta"]').count(),1);
    await page.locator('#categoryFilters [data-category="greek"]').click();
    await page.locator('#symbolSearch').fill('');
    assert.ok(await page.locator('#symbolGrid [data-symbol-id]').count()>=5);
    await page.locator('#symbolSearch').fill('theta');
    await page.locator('#symbolGrid [data-symbol-id="theta"]').click();
    assert.match(await page.locator('#textSurface').innerText(),/^Een θwiskundige/);
    await page.locator('[data-panel="symbols-text"]').click();
    await page.locator('#symbolSearch').fill('wortel');
    await page.screenshot({path:path.join(shots,'03-prototype-symbol-picker.png')});
    assert.equal(await page.locator('#symbolGrid [data-symbol-id="root"]').count(),1);

    // Formula preview uses production MathSource and MathJax adapter offline.
    await page.locator('#panelClose').click();
    await page.locator('[data-panel="formula"]').click();
    await page.waitForFunction(()=>document.getElementById('formulaState').textContent==='Geldig');
    await page.locator('#formulaSource').fill('a+bad+b');
    await page.locator('#formulaSource').evaluate(node=>node.setSelectionRange(2,5));
    await page.locator('#formulaSymbols').click();
    await page.locator('#formulaSymbolSearch').fill('theta');
    await page.locator('#formulaSymbolGrid [data-symbol-id="theta"]').click();
    assert.equal(await page.locator('#formulaSource').inputValue(),'a+\\theta+b');
    await page.locator('#contextPanel').evaluate(node=>{document.activeElement.blur();node.scrollTop=0;});
    await page.screenshot({path:path.join(shots,'04-prototype-formula-catalog.png')});

    // The fraction template selects its first editable slot; typing replaces it.
    await page.locator('#formulaSource').fill('x^2');
    await page.locator('#formulaSource').evaluate(node=>node.setSelectionRange(3,3));
    await page.locator('#formulaStructures').click();
    await page.locator('[data-template="fraction"]').click();
    const slot=await page.locator('#formulaSource').evaluate(node=>({selected:node.value.slice(node.selectionStart,node.selectionEnd),start:node.selectionStart}));
    assert.deepEqual(slot,{selected:'x',start:9});
    await page.keyboard.type('m');
    assert.equal(await page.locator('#formulaSource').inputValue(),'x^2\\frac{m}{y}');
    await page.waitForFunction(()=>document.getElementById('formulaState').textContent==='Geldig');
    await page.screenshot({path:path.join(shots,'05-prototype-formula-template.png')});

    await page.locator('#formulaSource').fill('a+b');
    await page.locator('#formulaSource').evaluate(node=>node.setSelectionRange(2,2));
    await page.locator('#formulaStructures').click();
    await page.locator('[data-template="root"]').click();
    const rootSlot=await page.locator('#formulaSource').evaluate(node=>({selected:node.value.slice(node.selectionStart,node.selectionEnd),start:node.selectionStart}));
    assert.deepEqual(rootSlot,{selected:'x',start:8});
    await page.keyboard.type('5');
    assert.equal(await page.locator('#formulaSource').inputValue(),'a+\\sqrt{5}b');
    await page.waitForFunction(()=>document.getElementById('formulaState').textContent==='Geldig');
    await page.locator('#formulaApply').click();
    assert.equal(await page.locator('#textSurface .inline-math-atom').getAttribute('aria-label'),'Formule: a+\\sqrt{5}b');

    // Unsupported TeX fails closed; nested Escape leaves formula mode open.
    await page.locator('#formulaSource').fill('\\href{https://bad}{x}');
    await page.waitForFunction(()=>!document.getElementById('formulaError').hidden);
    assert.equal(await page.locator('#formulaApply').isDisabled(),true);
    await page.locator('#formulaSource').fill('\\sqrt{x}');
    await page.waitForFunction(()=>document.getElementById('formulaState').textContent==='Geldig');
    await page.locator('#formulaSymbols').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#formulaCatalog').isHidden(),true);
    assert.equal(await page.locator('#formulaView').isHidden(),false);
    await page.screenshot({path:path.join(shots,'06-prototype-formula.png')});
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#contextPanel').isHidden(),true);

    // Dynamic values are explicitly demo-only and do not call the document model.
    await page.locator('[data-panel="values"]').click();
    await page.locator('#valueSource').selectOption('c');
    await page.locator('#valueProperty').selectOption('radius');
    await page.locator('#valueUnit').selectOption({label:'cm'});
    await page.locator('#valuePrefix').fill('r = ');
    assert.match(await page.locator('#valuePreview').innerText(),/r = 3,20 cm/);
    await page.locator('#contextPanel').evaluate(node=>node.scrollTop=0);
    await page.screenshot({path:path.join(shots,'07-prototype-values.png')});
    await page.locator('#valueApply').click();
    assert.equal(await page.locator('#textSurface .inline-value-atom').count(),1);

    // Stable dialog dimensions, no horizontal overflow, action bar visible at target sizes.
    const responsive=[];
    for(const viewport of [{width:1280,height:900},{width:768,height:900},{width:390,height:844},{width:1280,height:580}]){
      await page.setViewportSize(viewport);
      const before=await page.locator('.editor-dialog').boundingBox();
      await page.locator('[data-panel="symbols-text"]').click();
      const open=await page.locator('.editor-dialog').boundingBox();
      const metrics=await page.evaluate(()=>{const dialog=document.querySelector('.editor-dialog'),actions=document.querySelector('.dialog-actions').getBoundingClientRect(),rect=dialog.getBoundingClientRect();return {width:document.documentElement.scrollWidth,innerWidth:innerWidth,dialogScrollWidth:dialog.scrollWidth,dialogClientWidth:dialog.clientWidth,actionsInViewport:actions.bottom<=innerHeight+1&&actions.top>=0,dialogHeight:Math.round(rect.height)};});
      assert.ok(metrics.width<=metrics.innerWidth,JSON.stringify({viewport,metrics}));assert.ok(metrics.dialogScrollWidth<=metrics.dialogClientWidth+1,JSON.stringify({viewport,metrics}));assert.ok(metrics.actionsInViewport,JSON.stringify({viewport,metrics}));assert.equal(Math.round(before.height),Math.round(open.height));
      responsive.push({...viewport,...metrics});
      if(viewport.width===390)await page.screenshot({path:path.join(shots,'08-prototype-mobile.png')});
      if(viewport.height===580)await page.screenshot({path:path.join(shots,'09-prototype-short-window.png')});
      await page.locator('#panelClose').click();
    }
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(()=>document.querySelector('.editor-dialog').contains(document.activeElement)));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#saveStatus').innerText(),'Geannuleerd · demo-inhoud hersteld');
    assert.deepEqual(errors,[]);
    process.stdout.write(JSON.stringify({status:'PASS',browser:await browser.version(),checks:['existing-editor comparison screenshot','34 catalog LaTeX entries accepted by production MathSource','10 symbol categories and search/filter','Unicode inserted at saved text cursor','formula symbol inserted at cursor replacing selection','fraction/root template first-slot selection and typing','offline MathJax formula preview and safe-source denial','nested Escape and dialog cancel restore','demo dynamic value update and insertion','Tab focus containment','responsive/no-horizontal-overflow/action-bar visible at four viewport sizes','no page errors'],state,responsive,screenshots:fs.readdirSync(shots),pageErrors:errors},null,2)+'\n');
  }catch(error){process.stderr.write((error.stack||String(error))+'\n');process.exitCode=1;}
  finally{if(browser)await browser.close();server.close();}
})();
