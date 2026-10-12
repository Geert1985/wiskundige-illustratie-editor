(function(global){
  'use strict';const MI=global.FZI.MathIllustration;
  const groups=[
    ['Griekse letters',[...'αβγδεζηθικλμνξοπρστυφχψωΓΔΘΛΞΠΣΥΦΨΩ'].map(text=>({text,label:text}))],
    ['Rekenkundige operatoren',[['+','plus'],['−','min'],['±','plus of min'],['×','maal'],['÷','delen'],['·','product']].map(([text,label])=>({text,label}))],
    ['Vergelijkingen en ongelijkheden',[['=','gelijk'],['≠','niet gelijk'],['≈','ongeveer'],['<','kleiner'],['>','groter'],['≤','kleiner of gelijk'],['≥','groter of gelijk'],['≡','equivalent']].map(([text,label])=>({text,label}))],
    ['Verzamelingen',[['∈','element'],['∉','geen element'],['⊂','deelverzameling'],['⊆','deelverzameling of gelijk'],['∪','unie'],['∩','doorsnede'],['∅','lege verzameling'],['ℕ','natuurlijke getallen'],['ℤ','gehele getallen'],['ℚ','rationale getallen'],['ℝ','reële getallen']].map(([text,label])=>({text,label}))],
    ['Meetkundige symbolen',[['∠','hoek'],['△','driehoek'],['∥','evenwijdig'],['⊥','loodrecht'],['°','graden']].map(([text,label])=>({text,label}))],
    ['Pijlen',[['→','naar rechts'],['←','naar links'],['↔','beide richtingen'],['⇒','implicatie'],['⇔','equivalentie'],['↦','afbeelding']].map(([text,label])=>({text,label}))],
    ['Logische operatoren',[['∀','voor alle'],['∃','er bestaat'],['¬','niet'],['∧','en'],['∨','of']].map(([text,label])=>({text,label}))],
    ['Machten en wortels',[{text:'x²',label:'kwadraat',source:'x^2'},{text:'xⁿ',label:'macht',source:'x^{n}'},{text:'√',label:'wortel',source:'\\sqrt{x}'},{text:'∛',label:'derdemachtswortel',source:'\\sqrt[3]{x}'}]],
    ['Breuken',[{text:'a/b',label:'breuk',source:'\\frac{a}{b}'},{text:'½',label:'een half',source:'\\frac{1}{2}'}]],
    ['Functies',['sin','cos','tan','ln','log','exp','min','max'].map(text=>({text,label:text,source:`\\${text}(x)`}))]
  ];
  const greekNames='alfa beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omikron pi rho sigma tau upsilon phi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega'.split(' ');
  groups[0][1].forEach((item,i)=>item.label=greekNames[i]);
  const glyphSources={'≡':'\\equiv','∩':'\\cap','↔':'\\leftrightarrow','⇒':'\\Rightarrow','∀':'\\forall','∃':'\\exists','∈':'\\in','∉':'\\notin','⊂':'\\subset','⊆':'\\subseteq','∪':'\\cup','∅':'\\emptyset','ℕ':'\\mathbb{N}','ℤ':'\\mathbb{Z}','ℚ':'\\mathbb{Q}','ℝ':'\\mathbb{R}','∠':'\\angle','∥':'\\parallel','⊥':'\\perp','⇔':'\\Leftrightarrow','↦':'\\mapsto','∧':'\\land','∨':'\\lor'};
  for(const [,items] of groups)for(const item of items)if(glyphSources[item.text])item.glyphSource=glyphSources[item.text];
  function mount(dialog,editor){
    const panel=dialog.querySelector('#textInsertPanel'),search=panel.querySelector('#symbolSearch'),category=panel.querySelector('#symbolCategory'),list=panel.querySelector('#symbolList'),source=panel.querySelector('#mathSource'),preview=panel.querySelector('#mathPreview'),error=panel.querySelector('#mathError'),apply=panel.querySelector('#mathInsert');
    let bookmark=null,position=null,serial=0,dead=false,currentItems=[];const listeners=[],disabled=[];
    const on=(node,event,fn,capture=false)=>{node.addEventListener(event,fn,capture);listeners.push(()=>node.removeEventListener(event,fn,capture));};
    category.innerHTML='<option value="">Alle categorieën</option>'+groups.map(([name])=>`<option>${name}</option>`).join('');
    function results(){list.replaceChildren();currentItems=[];const query=search.value.toLocaleLowerCase('nl');for(const [name,items] of groups){if(category.value&&name!==category.value)continue;for(const item of items){if(!`${name} ${item.text} ${item.label}`.toLocaleLowerCase('nl').includes(query))continue;const button=document.createElement('button');button.type='button';button.textContent=item.text;button.title=`${name}: ${item.label}`;button.setAttribute('aria-label',`${item.label} (${item.text})`);button.dataset.symbolIndex=currentItems.length;currentItems.push(item);list.append(button);}}}
    function freeze(){editor.setEditable(false);dialog.querySelectorAll('.rich-text-toolbar button,.rich-text-toolbar input,.rich-text-toolbar select,#textForm button[type="submit"]').forEach(node=>{disabled.push([node,node.disabled]);node.disabled=true;});}
    function close(restore=true){serial++;panel.hidden=true;editor.setEditable(true);for(const [node,prior] of disabled.splice(0))node.disabled=prior;if(restore&&bookmark)try{editor.restore(bookmark);}catch{}bookmark=null;position=null;if(!dead)editor.focus();}
    async function update(){const request=++serial;apply.disabled=true;error.textContent='';preview.textContent='Formule voorbereiden…';try{const notation=MI.MathSource.validate(source.value);await MI.MathFragments.load();if(dead||panel.hidden||request!==serial)return;preview.innerHTML=MI.MathFragments.svg(notation,24,'#ffffff');const svg=preview.firstChild;svg.removeAttribute('x');svg.removeAttribute('y');apply.disabled=false;}catch(e){if(dead||panel.hidden||request!==serial)return;preview.replaceChildren();error.textContent=e.message;}}
    function showFormula(value){panel.dataset.mode='formula';source.value=value;position=null;source.focus();update();}
    function open(mode,pos=null){
      if(!panel.hidden)close();bookmark=editor.bookmark();freeze();panel.hidden=false;error.textContent='';
      const selected=editor.selectedMath(),node=pos!=null?editor.view.state.doc.nodeAt(pos):null;
      if(mode==='formula'){panel.dataset.mode='formula';position=pos??selected?.position??null;source.value=node?.attrs.source||selected?.source||'x^2+y^2=r^2';source.focus();update();}
      else {position=null;panel.dataset.mode='symbols';search.value='';category.value='';results();search.focus();}
    }
    on(dialog.querySelector('#richSymbols'),'click',()=>open('symbols'));on(dialog.querySelector('#richMath'),'click',()=>open('formula'));
    on(panel.querySelector('#textInsertClose'),'click',()=>close());on(search,'input',results);on(category,'change',results);on(source,'input',update);
    on(list,'click',async event=>{const button=event.target.closest('[data-symbol-index]');if(!button)return;const item=currentItems[Number(button.dataset.symbolIndex)];if(item.source){showFormula(item.source);return;}const request=++serial;try{if(item.glyphSource){await MI.MathFragments.load();if(dead||panel.hidden||request!==serial)return;editor.setEditable(true);editor.insertMath(item.glyphSource,bookmark);}else{editor.setEditable(true);editor.insertText(item.text,bookmark);}close(false);}catch(e){if(!dead&&request===serial)error.textContent=e.message;}});
    on(apply,'click',()=>{try{editor.setEditable(true);editor.insertMath(source.value,bookmark,position);close(false);}catch(e){editor.setEditable(false);error.textContent=e.message;}});
    on(dialog,'keydown',event=>{if(panel.hidden)return;if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}else if(event.key==='Enter'&&event.target===source){event.preventDefault();if(!apply.disabled)apply.click();}else if(event.key==='Enter'&&event.target===search){event.preventDefault();}},true);
    editor.setMathEditHandler(pos=>open('formula',pos));
    return {isOpen:()=>!panel.hidden,destroy(){dead=true;close(false);listeners.splice(0).forEach(remove=>remove());}};
  }
  MI.TextInsertPanel=Object.freeze({mount,categories:groups.map(([name])=>name)});
})(window);
