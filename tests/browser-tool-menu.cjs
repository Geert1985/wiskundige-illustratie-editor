// Open the category by a real summary click before choosing its tool.
exports.choose=async(page,selector)=>{
 const button=page.locator(selector),category=await button.evaluate(el=>el.closest('[data-tool-category]')?.dataset.toolCategory||null);
 if(category && !(await page.locator(`[data-tool-category="${category}"]`).getAttribute('open')!==null))await page.locator(`[data-tool-category="${category}"]>summary`).click();
 const subgroup=await button.evaluate(el=>el.closest('[data-tool-subgroup]')?.dataset.toolSubgroup||null);
 if(subgroup && await page.locator(`[data-tool-subgroup="${subgroup}"] > .tool-subgroup-toggle`).getAttribute('aria-expanded')==='false')await page.locator(`[data-tool-subgroup="${subgroup}"] > .tool-subgroup-toggle`).click();
 const split=await button.evaluate(el=>el.closest('[data-split-menu]')?.dataset.splitMenu||null);if(split && !(await page.locator('#'+split+'ToolMenu').isVisible()))await page.locator('#'+split+'ToolToggle').click();
 await button.click();
};

exports.action=async(page,selector)=>{if(!(await page.locator('#fileMenu').evaluate(el=>el.open)))await page.locator('#moreBtn').click();await page.locator(selector).click();};

exports.importFile=async(page,file)=>{const confirm=d=>{if(d.type()==='confirm')d.accept();};page.on('dialog',confirm);try{await page.locator('#fileInput').setInputFiles(file);await page.waitForFunction(()=>FZI.MathIllustration.editor.reader===null);}finally{page.off('dialog',confirm);}};

// Base64 font bytes may contain the letters NaN/Infinity; they are not numeric SVG values.
exports.numericSVG=svg=>svg.replace(/data:font\/ttf;base64,[A-Za-z0-9+/=]+/g,'embedded-font');
