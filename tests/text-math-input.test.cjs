const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');

function setup(){
  const context={};context.window=context;vm.createContext(context);
  for(const file of ['math-source.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  context.FZI.MathIllustration.MathFragments={load:async()=>{},svg:source=>`<svg data-source="${source}"></svg>`};
  for(const file of ['text-math-input.js','text-formula-editor.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return context.FZI.MathIllustration;
}

test('math input replaces UTF-16 selections and selects the first argument of structural templates',()=>{
  const input=setup().TextMathInput;
  assert.deepEqual({...input.templateSelection('\\frac{a}{b}')},{start:6,end:7});
  assert.deepEqual({...input.templateSelection('\\sqrt[3]{x}')},{start:9,end:10});
  assert.deepEqual({...input.templateSelection('x^{n}')},{start:3,end:4});
  assert.deepEqual({...input.templateSelection('x+y')},{start:3,end:3});
  const replacement=input.insertAtSelection('x+y=z',{source:'\\frac{a}{b}'},2,3);
  assert.equal(replacement.value,'x+\\frac{a}{b}=z');
  assert.equal(replacement.selectionStart,8);assert.equal(replacement.selectionEnd,9);
  assert.equal(replacement.asFormula,true);
  const glyph=input.insertAtSelection('α + β',{latex:'\\theta'},4,5);
  assert.equal(glyph.value,'α + \\theta');assert.equal(glyph.selectionStart,glyph.selectionEnd);
});

test('delimited input consumes only a closed math expression and preserves adjacent text ranges',()=>{
  const input=setup().TextMathInput;
  const before='before text \\(x+1\\',from=before.length,to=from;
  const inline=input.delimitedInput(before,from,to,')');
  assert.deepEqual({...inline},{source:'x+1',from:12,to:from+1,delimiter:'inline'});
  const document=before.slice(0,inline.from)+'ATOM'+before.slice(inline.to)+' after text';
  assert.equal(document,'before text ATOM after text');
  const displayBefore='left \\[x\\';assert.equal(input.delimitedInput(displayBefore,displayBefore.length,displayBefore.length,']').delimiter,'display');
  assert.equal(input.delimitedInput('keep \\(unfinished',18,18,'!'),null);
});

test('symbol insertion keeps ProseMirror bookmarks and validates formula atoms before insertion',async()=>{
  const MI=setup(),inserted=[];MI.MathFragments.load=async()=>{};
  const editor={insertText:(value,bookmark)=>inserted.push(['text',value,bookmark]),insertMath:(value,bookmark,position)=>inserted.push(['math',value,bookmark,position])};
  const bookmark={id:'bookmark'};
  assert.equal((await MI.TextMathInput.insertSymbol(editor,{unicode:'θ'},bookmark)).kind,'text');
  assert.equal((await MI.TextMathInput.insertSymbol(editor,{latex:'\\in'},bookmark)).kind,'math');
  assert.equal((await MI.TextMathInput.insertSymbol(editor,{source:'\\sqrt{x}'},bookmark)).mode,'formula');
  assert.deepEqual(inserted.map(value=>value.slice(0,3)),[['text','θ',bookmark],['math','\\in',bookmark]]);
  assert.throws(()=>MI.TextMathInput.insertFormula(editor,'\\href{x}{x}',bookmark),/Ongeldige|Niet-toegestane/);
  assert.equal(MI.TextMathInput.insertFormula(editor,'x^2',bookmark,4),'x^2');
  assert.deepEqual(inserted[2],['math','x^2',bookmark,4]);
});

test('formula editor drops stale async previews and refuses apply when source is invalid',async()=>{
  const MI=setup(),resolvers=[];MI.MathFragments.load=()=>new Promise(resolve=>resolvers.push(resolve));MI.MathFragments.svg=source=>`<svg data-source="${source}"></svg>`;
  const source={value:'x'},preview={innerHTML:'',children:[],set innerHTML(value){this._html=value;this.children=[{removeAttribute(){},setAttribute(){}}];},get innerHTML(){return this._html;},get firstElementChild(){return this.children[0]||null;},replaceChildren(){this._html='';this.children=[];}};
  const error={textContent:''};let applied='';
  const controller=MI.TextFormulaEditor.mount({source,preview,error,onApply:value=>{applied=value;return true;}});
  const stale=controller.render();source.value='y';const current=controller.render();
  resolvers[1]();assert.equal(await current,true);resolvers[0]();assert.equal(await stale,false);assert.equal(preview.innerHTML,'<svg data-source="y"></svg>');
  source.value='\\href{x}{x}';assert.equal(await controller.apply(),false);assert.equal(applied,'');assert.ok(error.textContent.length>0);
  controller.destroy();
});
