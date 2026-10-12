const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');

function setup(){
  const context={};context.window=context;vm.createContext(context);
  for(const file of ['math-source.js','text-symbol-catalog.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return context.FZI.MathIllustration;
}

test('symbol catalog exposes stable unique entries and categories with valid formula notation',()=>{
  const MI=setup(),catalog=MI.TextSymbolCatalog;
  assert.ok(catalog.entries.length>=90);
  assert.equal(new Set(catalog.entries.map(item=>item.id)).size,catalog.entries.length);
  assert.deepEqual(Array.from(catalog.categories,category=>category.id),['greek','operators','relations','sets','geometry','arrows','logic','powers-roots','fractions','functions','analysis','vectors','structures']);
  for(const item of catalog.entries){
    assert.ok(catalog.categories.some(category=>category.id===item.category),item.id);
    assert.ok(item.unicode&&item.label&&Array.isArray(item.keywords),item.id);
    if(item.latex)assert.equal(MI.MathSource.validate(item.latex),item.latex,item.id);
    if(item.source)assert.equal(MI.MathSource.validate(item.source),item.source,item.id);
    if(item.formula)assert.equal(MI.MathSource.validate(item.formula),item.formula,item.id);
  }
});

test('symbol search matches Dutch accents, English synonyms, labels and category filters',()=>{
  const catalog=setup().TextSymbolCatalog;
  assert.ok(catalog.search('thèta').some(item=>item.id==='theta'));
  assert.ok(catalog.search('root','powers-roots').some(item=>item.id==='square-root'));
  assert.ok(catalog.search('oneindig').some(item=>item.id==='infinity'));
  assert.ok(catalog.search('integraal','analysis').some(item=>item.id==='integral'));
  assert.equal(catalog.search('integraal','greek').length,0);
  assert.ok(catalog.search('½','fractions').some(item=>item.id==='half'));
});
