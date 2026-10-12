(function(global){
  'use strict';const MI=global.FZI.MathIllustration;
  const catalog=MI.TextSymbolCatalog;
  function mount(dialog,editor,options={}){
    const panel=dialog.querySelector('#textInsertPanel'),search=panel.querySelector('#symbolSearch'),category=panel.querySelector('#symbolCategory'),list=panel.querySelector('#symbolList'),source=panel.querySelector('#mathSource'),preview=panel.querySelector('#mathPreview'),error=panel.querySelector('#mathError'),apply=panel.querySelector('#mathInsert');
    let bookmark=null,position=null,serial=0,dead=false,currentItems=[];const listeners=[],disabled=[];
    const on=(node,event,fn,capture=false)=>{node.addEventListener(event,fn,capture);listeners.push(()=>node.removeEventListener(event,fn,capture));};
    category.replaceChildren();for(const item of [{id:'all',label:'Alle categorieën'},...catalog.categories]){const option=document.createElement('option');option.value=item.id;option.textContent=item.label;category.append(option);}
    function results(){list.replaceChildren();currentItems=catalog.search(search.value,category.value||'all');for(let i=0;i<currentItems.length;i++){const item=currentItems[i],button=document.createElement('button');button.type='button';button.textContent=item.unicode;button.title=`${catalog.categories.find(group=>group.id===item.category)?.label||item.category}: ${item.label}`;button.setAttribute('aria-label',`${item.label} (${item.unicode})`);button.dataset.symbolIndex=i;list.append(button);}}
    function freeze(){editor.setEditable(false);dialog.querySelectorAll('.rich-text-toolbar button,.rich-text-toolbar input,.rich-text-toolbar select,#textForm button[type="submit"]').forEach(node=>{disabled.push([node,node.disabled]);node.disabled=true;});}
    const formulaEditor=MI.TextFormulaEditor.mount({source,preview,error,onApply:value=>{try{editor.setEditable(true);MI.TextMathInput.insertFormula(editor,value,bookmark,position);close(false);return true;}catch(e){editor.setEditable(false);error.textContent=e.message;return false;}}});
    function close(restore=true){serial++;formulaEditor.cancel();panel.classList.remove('formula-symbol-picking');panel.hidden=true;editor.setEditable(true);for(const [node,prior] of disabled.splice(0))node.disabled=prior;if(restore&&bookmark)try{editor.restore(bookmark);}catch{}bookmark=null;position=null;if(!dead)editor.focus();}
    async function update(){const request=++serial;apply.disabled=true;error.textContent='';preview.textContent='Formule voorbereiden…';const ready=await formulaEditor.render();if(dead||panel.hidden||request!==serial)return;apply.disabled=!ready;}
    function showFormula(value,selection=null){panel.dataset.mode='formula';panel.classList.remove('formula-symbol-picking');panel.querySelector('#textInsertTitle').textContent='Formule';source.value=value;position=null;const range=selection||MI.TextMathInput.templateSelection(value);source.focus();source.setSelectionRange(range.start,range.end);update();}
    function beginMode(mode){
      if(!panel.hidden)close();bookmark=editor.bookmark();freeze();panel.hidden=false;panel.dataset.mode=mode;panel.classList.remove('formula-symbol-picking');error.textContent='';
      panel.querySelector('#textInsertTitle').textContent={symbols:'Symbolen',formula:'Formule',value:'Dynamische waarde'}[mode]||'Invoegen';
      return bookmark;
    }
    const valueEditor=MI.TextDynamicValueEditor.mount(panel,editor,options,{begin:beginMode,close,fail:exception=>{error.textContent=exception.message;}});
    on(dialog.querySelector('#richValues'),'click',()=>valueEditor.open());
    function open(mode,pos=null){
      beginMode(mode);
      const selected=editor.selectedMath(),node=pos!=null?editor.view.state.doc.nodeAt(pos):null;
      if(mode==='formula'){position=pos??selected?.position??null;source.value=node?.attrs.source||selected?.source||'x^2+y^2=r^2';source.focus();source.setSelectionRange(source.value.length,source.value.length);update();}
      else {position=null;search.value='';category.value='all';results();search.focus();}
    }
    on(dialog.querySelector('#richSymbols'),'click',()=>open('symbols'));on(dialog.querySelector('#richMath'),'click',()=>open('formula'));
    on(panel.querySelector('#formulaSymbols'),'click',()=>{panel.classList.toggle('formula-symbol-picking');search.value='';category.value='all';results();if(panel.classList.contains('formula-symbol-picking'))search.focus();else source.focus();});
    on(panel.querySelector('#textInsertClose'),'click',()=>close());on(search,'input',results);on(category,'change',results);on(source,'input',update);
    on(list,'click',async event=>{const button=event.target.closest('[data-symbol-index]');if(!button)return;const item=currentItems[Number(button.dataset.symbolIndex)];if(panel.dataset.mode==='formula'){const inserted=MI.TextMathInput.insertAtSelection(source.value,item,source.selectionStart,source.selectionEnd);source.value=inserted.value;source.focus();source.setSelectionRange(inserted.selectionStart,inserted.selectionEnd);panel.classList.remove('formula-symbol-picking');update();return;}const request=++serial;try{const result=await MI.TextMathInput.insertSymbol(editor,item,bookmark);if(dead||panel.hidden||request!==serial)return;if(result.mode==='formula'){showFormula(result.source,result.selection);return;}close(false);}catch(e){if(!dead&&request===serial)error.textContent=e.message;}});
    on(apply,'click',()=>{apply.disabled=true;formulaEditor.apply().finally(()=>{if(!dead&&!panel.hidden&&panel.dataset.mode==='formula'&&!error.textContent)apply.disabled=false;});});
    on(dialog,'keydown',event=>{if(panel.hidden)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}else if(event.key==='Enter'&&event.target===source){event.preventDefault();if(!apply.disabled)apply.click();}else if(event.key==='Enter'&&panel.dataset.mode==='value'&&event.target.tagName==='INPUT'){event.preventDefault();const valueApply=panel.querySelector('#valueInsert');if(!valueApply.disabled)valueApply.click();}else if(event.key==='Enter'&&event.target===search){event.preventDefault();}},true);
    editor.setMathEditHandler(pos=>open('formula',pos));
    return {isOpen:()=>!panel.hidden,refresh:valueEditor.refresh,destroy(){dead=true;formulaEditor.destroy();valueEditor.destroy();close(false);listeners.splice(0).forEach(remove=>remove());}};
  }
  MI.TextInsertPanel=Object.freeze({mount,categories:catalog.categories.map(item=>item.label)});
})(window);
