(function () {
  'use strict';
  const $=selector=>document.querySelector(selector),panel=$('#contextPanel'),surface=$('#textSurface'),source=$('#formulaSource');
  const catalog=window.T5Prep.SymbolCatalog,input=window.T5Prep.MathInput;
  let textRange=null,lastTrigger=null,mode=null,activeTextCategory='all',activeFormulaCategory='all',previewRequest=0;
  const initialText=surface.innerHTML;
  const categoryButtons=(container,selected,onSelect)=>{
    container.replaceChildren();
    for(const category of catalog.categories){
      const button=document.createElement('button');button.type='button';button.className='filter-chip';button.textContent=category.label;button.dataset.category=category.id;button.setAttribute('aria-pressed',String(category.id===selected));button.addEventListener('click',()=>onSelect(category.id));container.append(button);
    }
  };
  function setFormulaCategory(value){activeFormulaCategory=value;paintFormulaFilters();formulaResults();}
  function paintFormulaFilters(){categoryButtons($('#formulaCategoryFilters'),activeFormulaCategory,setFormulaCategory);}
  function restoreTextFocus(){if(textRange){const selection=window.getSelection();selection.removeAllRanges();selection.addRange(textRange);}surface.focus();}
  function captureTextRange(){const selection=window.getSelection();if(selection?.rangeCount&&surface.contains(selection.anchorNode)&&surface.contains(selection.focusNode))textRange=selection.getRangeAt(0).cloneRange();}
  function renderSymbols(query,category,grid,empty,onPick){
    const items=catalog.search(query,category);grid.replaceChildren();empty.hidden=items.length>0;
    for(const item of items){const button=document.createElement('button');button.type='button';button.className='symbol-tile';button.dataset.symbolId=item.id;button.setAttribute('aria-label',item.id+' '+item.unicode);button.title=item.id+' · '+item.latex;const glyph=document.createElement('strong');glyph.textContent=item.unicode;const label=document.createElement('small');label.textContent=item.id;button.append(glyph,label);button.addEventListener('click',()=>onPick(item));grid.append(button);}
  }
  function textResults(){renderSymbols($('#symbolSearch').value,activeTextCategory,$('#symbolGrid'),$('#emptySearch'),item=>{if(textRange)textRange=input.insertTextAtRange(surface,textRange,item.unicode);closePanel(false);updateWords();});}
  function formulaResults(){renderSymbols($('#formulaSymbolSearch').value,activeFormulaCategory,$('#formulaSymbolGrid'),$('#emptySearch'),item=>{input.insertFormulaAtSelection(source,item.latex);updateFormula();});}
  function openPanel(next,trigger){
    if(mode==='formula'&&next==='symbols-formula'){$('#formulaCatalog').hidden=false;$('#formulaSymbolSearch').value='';activeFormulaCategory='all';paintFormulaFilters();formulaResults();$('#formulaSymbolSearch').focus();return;}
    mode=next;lastTrigger=trigger||document.activeElement;panel.hidden=false;panel.dataset.mode=next;
    $('#symbolView').hidden=next!=='symbols-text';$('#formulaView').hidden=next!=='formula';$('#valuesView').hidden=next!=='values';
    $('#panelTitle').textContent=next==='formula'?'Formule bewerken':next==='values'?'Dynamische waarde':'Symbolen';
    $('#panelEyebrow').textContent=next==='formula'?'WISKUNDIGE INVOER':'INVOEGEN';
    $('#symbolContext').textContent=next==='symbols-text'?'Kies een symbool om Unicode in je tekst in te voegen.':'Kies een symbool voor de LaTeX-formule.';
    if(next==='symbols-text'){$('#symbolSearch').value='';activeTextCategory='all';categoryButtons($('#categoryFilters'),activeTextCategory,value=>{activeTextCategory=value;paintTextFilters();textResults();});paintTextFilters();textResults();$('#symbolSearch').focus();}
    if(next==='formula'){$('#formulaCatalog').hidden=true;$('#structureTray').hidden=true;$('#formulaStructures').setAttribute('aria-expanded','false');updateFormula();source.focus();}
    if(next==='values'){$('#valueSource').focus();updateValuePreview();}
  }
  function paintTextFilters(){categoryButtons($('#categoryFilters'),activeTextCategory,value=>{activeTextCategory=value;paintTextFilters();textResults();});}
  function closePanel(restore=true){
    if(mode==='formula'&&!$('#formulaCatalog').hidden){$('#formulaCatalog').hidden=true;$('#formulaSymbolSearch').value='';formulaResults();source.focus();return;}
    const closedMode=mode;
    panel.hidden=true;mode=null;$('#formulaCatalog').hidden=true;$('#structureTray').hidden=true;
    if(restore){if(closedMode==='formula')restoreTextFocus();else if(lastTrigger&&lastTrigger.isConnected)lastTrigger.focus();else surface.focus();}
  }
  async function updateFormula(){
    const request=++previewRequest,preview=$('#formulaPreview'),error=$('#formulaError'),state=$('#formulaState'),apply=$('#formulaApply');
    error.hidden=true;error.textContent='';apply.disabled=true;state.textContent='Controleren…';
    try{const tex=window.FZI.MathIllustration.MathSource.validate(source.value);await window.FZI.MathIllustration.MathFragments.load();if(request!==previewRequest||mode!=='formula')return;const svg=window.FZI.MathIllustration.MathFragments.svg(tex,24,'#e8e3d7');preview.innerHTML=svg;const node=preview.firstElementChild;node.removeAttribute('x');node.removeAttribute('y');node.setAttribute('aria-hidden','true');state.textContent='Geldig';apply.disabled=false;}
    catch(exception){if(request!==previewRequest||mode!=='formula')return;preview.replaceChildren();error.textContent=exception.message||'Formule kan niet worden weergegeven.';error.hidden=false;state.textContent='Controleer de invoer';}
  }
  function insertFormula(){
    const tex=window.FZI.MathIllustration.MathSource.validate(source.value),atom=document.createElement('span');atom.className='inline-math-atom';atom.contentEditable='false';atom.setAttribute('role','img');atom.setAttribute('aria-label','Formule: '+tex);atom.title=tex;atom.textContent='ƒ  '+tex;
    if(textRange)textRange=input.insertTextAtRange(surface,textRange,'');
    const selection=window.getSelection();if(textRange){selection.removeAllRanges();selection.addRange(textRange);textRange.deleteContents();textRange.insertNode(atom);textRange.setStartAfter(atom);textRange.collapse(true);selection.removeAllRanges();selection.addRange(textRange);}else surface.append(atom);
    closePanel(false);updateWords();
  }
  function insertTemplate(name){
    const templates={fraction:{source:'\\frac{x}{y}',slotStart:6,slotLength:1},root:{source:'\\sqrt{x}',slotStart:6,slotLength:1},sum:{source:'\\sum_{i=1}^{n} x_i',slotStart:8,slotLength:1},integral:{source:'\\int_{a}^{b} f(x)\\,dx',slotStart:6,slotLength:1}};
    const item=templates[name];if(!item)return;input.insertFormulaAtSelection(source,item.source,item.slotStart,item.slotLength);$('#structureTray').hidden=true;$('#formulaStructures').setAttribute('aria-expanded','false');updateFormula();
  }
  function valueText(){const sourceName=$('#valueSource').value,property=$('#valueProperty').value,precision=Number($('#valuePrecision').value),unit=$('#valueUnit').value;const values={P:{x:1.25,y:2.5},c:{radius:3.2,length:8.1}};const label={x:'x',y:'y',radius:'r',length:'L'}[property]||property;const raw=values[sourceName]?.[property]??2.4;const formatted=raw.toLocaleString('nl-NL',{minimumFractionDigits:precision,maximumFractionDigits:precision});const suffix=unit==='Documentstandaard'?'u':unit==='Geen eenheid'?'':unit;return $('#valuePrefix').value+label+' = '+formatted+(suffix?' '+suffix:'')+$('#valueSuffix').value;}
  function updateValuePreview(){$('#valuePreview').textContent=valueText();}
  function updateWords(){const text=surface.innerText.trim();$('#wordCount').textContent=(text?text.split(/\s+/).length:0)+' woorden';}
  function insertValue(){const node=document.createElement('span');node.className='inline-value-atom';node.contentEditable='false';node.setAttribute('role','img');node.setAttribute('aria-label','Voorbeeld dynamische waarde');node.textContent=valueText();if(textRange)textRange=input.insertTextAtRange(surface,textRange,'');const selection=window.getSelection();if(textRange){selection.removeAllRanges();selection.addRange(textRange);textRange.insertNode(node);textRange.setStartAfter(node);textRange.collapse(true);selection.removeAllRanges();selection.addRange(textRange);}else surface.append(node);closePanel(false);updateWords();}
  function closeFormula(){panel.hidden=true;mode=null;$('#formulaCatalog').hidden=true;$('#structureTray').hidden=true;restoreTextFocus();}
  document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',event=>{captureTextRange();const next=event.currentTarget.dataset.panel==='symbols-text'?'symbols-text':event.currentTarget.dataset.panel;openPanel(next,event.currentTarget);}));
  document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('mousedown',event=>event.preventDefault()));
  document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('mousedown',event=>event.preventDefault()));
  document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{surface.focus();document.execCommand(button.dataset.command,false,null);}));
  $('#fontFamily').addEventListener('change',event=>{surface.focus();document.execCommand('fontName',false,event.target.value);});
  $('#fontSize').addEventListener('change',event=>{surface.focus();document.execCommand('fontSize',false,'4');surface.querySelectorAll('font[size="4"]').forEach(node=>{node.removeAttribute('size');node.style.fontSize=event.target.value+'px';});});
  $('#textColor').addEventListener('input',event=>{surface.focus();document.execCommand('foreColor',false,event.target.value);});
  document.querySelectorAll('[data-align]').forEach(button=>button.addEventListener('click',()=>{surface.style.textAlign=button.dataset.align;document.querySelectorAll('[data-align]').forEach(other=>other.classList.toggle('active',other===button));}));
  $('#textWidth').addEventListener('input',event=>{surface.style.maxWidth=event.target.value?Math.min(1000000,Number(event.target.value))+'px':'none';});
  $('#symbolSearch').addEventListener('input',textResults);$('#formulaSymbolSearch').addEventListener('input',formulaResults);
  $('#formulaSymbols').addEventListener('click',()=>openPanel('symbols-formula',$('#formulaSymbols')));
  $('#formulaStructures').addEventListener('click',()=>{const tray=$('#structureTray');tray.hidden=!tray.hidden;$('#formulaStructures').setAttribute('aria-expanded',String(!tray.hidden));});
  $('#structureTray').addEventListener('click',event=>{const button=event.target.closest('[data-template]');if(button)insertTemplate(button.dataset.template);});
  source.addEventListener('input',updateFormula);$('#formulaApply').addEventListener('click',()=>{try{insertFormula();}catch(error){$('#formulaError').textContent=error.message;$('#formulaError').hidden=false;}});
  $('#formulaCancel').addEventListener('click',closeFormula);$('#panelClose').addEventListener('click',()=>closePanel(true));
  $('#valueCancel').addEventListener('click',()=>closePanel(true));$('#valueApply').addEventListener('click',insertValue);
  ['valueSource','valueProperty','valuePrecision','valueUnit','valueAngle','valuePrefix','valueSuffix'].forEach(id=>$('#'+id).addEventListener('input',updateValuePreview));
  $('#textSurface').addEventListener('input',updateWords);$('#textSurface').addEventListener('keyup',captureTextRange);$('#textSurface').addEventListener('mouseup',captureTextRange);
  const dialog=$('.editor-dialog');document.querySelector('.appbar').inert=true;document.querySelector('.canvas-context').inert=true;surface.focus();
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopPropagation();closePanel(true);return;}
    if(event.key==='Escape'&&panel.hidden){event.preventDefault();$('#cancelDialog').click();return;}
    if(event.key==='Tab'){
      const focusable=[...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[contenteditable="true"]')].filter(node=>!node.closest('[hidden]')&&node.getClientRects().length);
      if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus();}
    }
  },true);
  $('#cancelDialog').addEventListener('click',()=>{surface.innerHTML=initialText;panel.hidden=true;mode=null;$('#saveStatus').textContent='Geannuleerd · demo-inhoud hersteld';});
  $('#closeDialog').addEventListener('click',()=>$('#cancelDialog').click());
  $('#applyDialog').addEventListener('click',()=>{panel.hidden=true;mode=null;$('#saveStatus').textContent='Toegepast · voorbeeld wordt niet opgeslagen';$('#toast').hidden=false;$('#toast').textContent='Prototype: de inhoud is niet naar het document opgeslagen.';setTimeout(()=>$('#toast').hidden=true,3000);});
  updateWords();updateValuePreview();
  if(window.FZI?.MathIllustration?.MathFragments){window.FZI.MathIllustration.MathFragments.load().then(updateFormula).catch(()=>{$('#formulaState').textContent='Preview niet beschikbaar';});}
  window.T5Prep.prototype={openPanel,closePanel,insertTemplate,updateFormula};
})();
