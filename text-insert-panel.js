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
    function close(restore=true){serial++;panel.hidden=true;editor.setEditable(true);for(const [node,prior] of disabled.splice(0))node.disabled=prior;if(restore&&bookmark)try{editor.restore(bookmark);}catch{}bookmark=null;position=null;if(!dead)editor.focus();}
    async function update(){const request=++serial;apply.disabled=true;error.textContent='';preview.textContent='Formule voorbereiden…';try{const notation=MI.MathSource.validate(source.value);await MI.MathFragments.load();if(dead||panel.hidden||request!==serial)return;preview.innerHTML=MI.MathFragments.svg(notation,24,'#ffffff');const svg=preview.firstChild;svg.removeAttribute('x');svg.removeAttribute('y');apply.disabled=false;}catch(e){if(dead||panel.hidden||request!==serial)return;preview.replaceChildren();error.textContent=e.message;}}
    function showFormula(value){panel.dataset.mode='formula';source.value=value;position=null;source.focus();update();}
    const vSource=panel.querySelector('#valueSource'),vProperty=panel.querySelector('#valueProperty'),vPrecision=panel.querySelector('#valuePrecision'),vUnit=panel.querySelector('#valueUnit'),vAngle=panel.querySelector('#valueAngle'),vPrefix=panel.querySelector('#valuePrefix'),vSuffix=panel.querySelector('#valueSuffix'),vApply=panel.querySelector('#valueInsert'),vPreview=panel.querySelector('#valuePreview');
    const labels={name:'Naam',label:'Label',length:'Lengte',radius:'Straal',perimeter:'Omtrek',area:'Oppervlakte',angle:'Hoek',x:'x-coordinaat',y:'y-coordinaat'};
    const fillOptions=(node,items,value)=>{node.replaceChildren();for(const item of items){const option=document.createElement('option');option.value=item.value;option.textContent=item.label;node.append(option);}node.value=value;if(!node.value&&items.length)node.value=items[0].value;};
    fillOptions(vUnit,MI.TextValues.units.map(value=>({value,label:{document:'Documentstandaard',none:'Geen eenheidssuffix',u:'Abstract (u)',dimensionless:'Dimensieloos'}[value]||value})),'document');
    function valueData(){return MI.TextValues.validate({sourceId:vSource.value,property:vProperty.value},{precision:vPrecision.value===''?null:vPrecision.valueAsNumber,unitMode:vUnit.value,angleMode:vAngle.value,prefix:vPrefix.value,suffix:vSuffix.value});}
    function valuePreview(){if(panel.hidden||panel.dataset.mode!=='value')return;try{const data=valueData(),result=options.resolveValue?.({...data,kind:'dynamicValue'})||{status:'missing',text:'niet beschikbaar'};vPreview.textContent=result.text;vPreview.dataset.valueStatus=result.status;vApply.disabled=result.status==='denied';error.textContent=result.status==='denied'?'Bronwaarde niet toegestaan.':'';}catch(e){vPreview.textContent='niet beschikbaar';vApply.disabled=true;error.textContent=e.message;}}
    function properties(value){const source=(options.sourceOptions?.()||[]).find(o=>o.id===vSource.value),items=source?.properties|| (value?[value]:[]);fillOptions(vProperty,items.map(value=>({value,label:labels[value]})),value);valuePreview();}
    function openValue(pos=null){
      if(!panel.hidden)close();bookmark=editor.bookmark();freeze();panel.hidden=false;panel.dataset.mode='value';error.textContent='';
      const selected=editor.selectedValue(),node=pos!=null?editor.view.state.doc.nodeAt(pos):null,existing=node?.type.name==='dynamicValue'?node.attrs:selected;
      position=pos??selected?.position??null;const data=existing||{binding:{},format:{precision:null,unitMode:'document',angleMode:'document',prefix:'',suffix:''}},choices=(options.sourceOptions?.()||[]).map(o=>({value:o.id,label:o.name}));
      if(data.binding.sourceId&&!choices.some(o=>o.value===data.binding.sourceId))choices.unshift({value:data.binding.sourceId,label:'Bron niet beschikbaar'});
      fillOptions(vSource,choices,data.binding.sourceId);vPrecision.value=data.format.precision??'';vUnit.value=data.format.unitMode;vAngle.value=data.format.angleMode;vPrefix.value=data.format.prefix;vSuffix.value=data.format.suffix;properties(data.binding.property);vSource.focus();
    }
    on(dialog.querySelector('#richValues'),'click',()=>openValue());on(vSource,'change',()=>properties(vProperty.value));for(const node of [vProperty,vPrecision,vUnit,vAngle,vPrefix,vSuffix])on(node,'input',valuePreview);
    on(vApply,'click',()=>{try{const data=valueData();editor.setEditable(true);editor.insertValue(data.binding,data.format,bookmark,position);close(false);}catch(e){editor.setEditable(false);error.textContent=e.message;}});editor.setValueEditHandler(pos=>openValue(pos));
    function open(mode,pos=null){
      if(!panel.hidden)close();bookmark=editor.bookmark();freeze();panel.hidden=false;error.textContent='';
      const selected=editor.selectedMath(),node=pos!=null?editor.view.state.doc.nodeAt(pos):null;
      if(mode==='formula'){panel.dataset.mode='formula';position=pos??selected?.position??null;source.value=node?.attrs.source||selected?.source||'x^2+y^2=r^2';source.focus();update();}
      else {position=null;panel.dataset.mode='symbols';search.value='';category.value='all';results();search.focus();}
    }
    on(dialog.querySelector('#richSymbols'),'click',()=>open('symbols'));on(dialog.querySelector('#richMath'),'click',()=>open('formula'));
    on(panel.querySelector('#textInsertClose'),'click',()=>close());on(search,'input',results);on(category,'change',results);on(source,'input',update);
    on(list,'click',async event=>{const button=event.target.closest('[data-symbol-index]');if(!button)return;const item=currentItems[Number(button.dataset.symbolIndex)];if(item.source){showFormula(item.source);return;}const request=++serial;try{if(item.latex){await MI.MathFragments.load();if(dead||panel.hidden||request!==serial)return;MI.MathSource.validate(item.latex);editor.setEditable(true);editor.insertMath(item.latex,bookmark);}else{editor.setEditable(true);editor.insertText(item.unicode,bookmark);}close(false);}catch(e){if(!dead&&request===serial)error.textContent=e.message;}});
    on(apply,'click',()=>{try{editor.setEditable(true);editor.insertMath(source.value,bookmark,position);close(false);}catch(e){editor.setEditable(false);error.textContent=e.message;}});
    on(dialog,'keydown',event=>{if(panel.hidden)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}else if(event.key==='Enter'&&event.target===source){event.preventDefault();if(!apply.disabled)apply.click();}else if(event.key==='Enter'&&panel.dataset.mode==='value'&&event.target.tagName==='INPUT'){event.preventDefault();if(!vApply.disabled)vApply.click();}else if(event.key==='Enter'&&event.target===search){event.preventDefault();}},true);
    editor.setMathEditHandler(pos=>open('formula',pos));
    return {isOpen:()=>!panel.hidden,refresh:valuePreview,destroy(){dead=true;close(false);listeners.splice(0).forEach(remove=>remove());}};
  }
  MI.TextInsertPanel=Object.freeze({mount,categories:catalog.categories.map(item=>item.label)});
})(window);
