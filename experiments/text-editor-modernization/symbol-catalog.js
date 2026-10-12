(function (global) {
  'use strict';
  const entries = [
    ['greek','theta','θ','\\theta',['theta','thèta','grieks','hoek']],['greek','alpha','α','\\alpha',['alpha','alfa','grieks']],['greek','beta','β','\\beta',['beta','grieks']],['greek','pi','π','\\pi',['pi','grieks']],['greek','omega','ω','\\omega',['omega','oneindig','grieks']],
    ['operators','plus-minus','±','\\pm',['plus minus','operator']],['operators','times','×','\\times',['maal','keer']],['operators','divide','÷','\\div',['delen']],['operators','infinity','∞','\\infty',['oneindig','infinity']],
    ['relations','not-equal','≠','\\ne',['ongelijk','niet gelijk']],['relations','less-equal','≤','\\leq',['kleiner gelijk']],['relations','greater-equal','≥','\\geq',['groter gelijk']],['relations','approx','≈','\\approx',['ongeveer','benadering']],
    ['sets','element','∈','\\in',['element van','verzameling']],['sets','union','∪','\\cup',['unie']],['sets','empty','∅','\\emptyset',['leeg','verzameling']],['sets','reals','ℝ','\\mathbb{R}',['reële getallen']],
    ['logic','forall','∀','\\forall',['voor alle','logica']],['logic','exists','∃','\\exists',['bestaat','logica']],['logic','and','∧','\\land',['en','logica']],
    ['analysis','integral','∫','\\int',['integraal','integral','analyse']],['analysis','partial','∂','\\partial',['partieel','afgeleide']],['analysis','nabla','∇','\\nabla',['nabla','gradient']],
    ['vectors','right-arrow','→','\\rightarrow',['pijl','vector','rechts']],['vectors','vector-arrow','⃗','\\vec{x}',['vectorpijl','vector']],['vectors','iff-arrow','⇔','\\Leftrightarrow',['equivalent']],
    ['geometry','angle','∠','\\angle',['hoek','meetkunde']],['geometry','parallel','∥','\\parallel',['evenwijdig']],['geometry','perpendicular','⊥','\\perp',['loodrecht']],['geometry','degrees','°','\\degree',['graden','hoek']],
    ['structures','fraction','a⁄b','\\frac{x}{y}',['breuk','fraction','structuur']],['structures','root','√','\\sqrt{x}',['wortel','root','structuur']],['structures','sum','∑','\\sum_{i=1}^{n} x_i',['som','sommatie','sum']],['structures','integral-template','∫','\\int_{a}^{b} f(x)\\,dx',['integraal','integraaltemplate']]
  ].map(([category,id,unicode,latex,keywords]) => Object.freeze({category,id,unicode,latex,keywords:Object.freeze(keywords)}));
  const categories = Object.freeze([
    ['all','Alle'],['greek','Grieks'],['operators','Rekenen'],['relations','Relaties'],['sets','Verzamelingen'],['logic','Logica'],['analysis','Analyse'],['vectors','Vectoren'],['geometry','Meetkunde'],['structures','Structuren']
  ].map(([id,label])=>Object.freeze({id,label})));
  function search(query='',category='all') {
    const normalized=String(query).toLocaleLowerCase('nl').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    return entries.filter(item=>(category==='all'||item.category===category)&&(!normalized||[item.id,item.unicode,item.latex,...item.keywords].join(' ').toLocaleLowerCase('nl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(normalized)));
  }
  global.T5Prep=global.T5Prep||{};
  global.T5Prep.SymbolCatalog=Object.freeze({entries:Object.freeze(entries),categories,search});
})(window);
