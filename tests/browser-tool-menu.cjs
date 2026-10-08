// Open the category by a real summary click before choosing its tool.
exports.choose=async(page,selector)=>{
 const button=page.locator(selector),category=await button.evaluate(el=>el.closest('[data-tool-category]')?.dataset.toolCategory||null);
 if(category && !(await page.locator(`[data-tool-category="${category}"]`).getAttribute('open')!==null))await page.locator(`[data-tool-category="${category}"]>summary`).click();
 await button.click();
};
