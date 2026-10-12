(function(global){
  'use strict';
  const categories=[
    {id:'greek',label:'Griekse letters'},
    {id:'operators',label:'Rekenkundige operatoren'},
    {id:'relations',label:'Vergelijkingen en ongelijkheden'},
    {id:'sets',label:'Verzamelingen'},
    {id:'geometry',label:'Meetkundige symbolen'},
    {id:'arrows',label:'Pijlen'},
    {id:'logic',label:'Logische operatoren'},
    {id:'powers-roots',label:'Machten en wortels'},
    {id:'fractions',label:'Breuken'},
    {id:'functions',label:'Functies'},
    {id:'analysis',label:'Analyse'},
    {id:'vectors',label:'Vectoren'},
    {id:'structures',label:'Structuren'}
  ];
  const entries=[];
  function add(category,id,unicode,label,keywords=[],latex=null,source=null,formula=latex){
    entries.push(Object.freeze({category,id,unicode,label,keywords:Object.freeze(keywords),latex,source,formula}));
  }
  const greek='alpha alfa α;beta β;gamma γ;delta δ;epsilon ε;zeta ζ;eta η;theta thèta θ;iota ι;kappa κ;lambda λ;mu μ;nu ν;xi ξ;omicron omikron ο;pi π;rho ρ;sigma σ;tau τ;upsilon υ;phi φ;chi χ;psi ψ;omega ω;Gamma Γ;Delta Δ;Theta Θ;Lambda Λ;Xi Ξ;Pi Π;Sigma Σ;Upsilon Υ;Phi Φ;Psi Ψ;Omega Ω'.split(';');
  for(const value of greek){const [name,aliasOrGlyph,glyph]=value.split(' ');const unicode=glyph||aliasOrGlyph;const aliases=glyph?[name,aliasOrGlyph,'grieks']:[name,'grieks'];const id=name[0].toUpperCase()===name[0]?`greek-${name}`:name;add('greek',id,unicode,name,aliases,null,null,name==='omicron'?null:`\\${name}`);}
  const categoryById={relations:['equals','not-equal','approx','less-than','greater-than','less-equal','greater-equal','equiv'],sets:['element','not-element','subset','subset-equal','union','intersection','empty-set','natural-numbers','integers','rationals','reals'],geometry:['angle','triangle','parallel','perpendicular','degree'],arrows:['right-arrow','left-arrow','both-arrows','implies','iff','mapsto'],logic:['forall','exists','not','and','or'],analysis:['infinity','integral','partial','nabla'],vectors:['vector-arrow']};
  for(const [id,glyph,label,latex,keywords] of [
    ['plus','+','plus',null,['optellen']],['minus','−','min',null,['aftrekken']],['plus-minus','±','plus of min','\\pm',['plus minus']],['times','×','maal','\\times',['keer','product']],['divide','÷','delen','\\div',['deling']],['cdot','·','product','\\cdot',['maal']],
    ['equals','=','gelijk',null,['is gelijk']],['not-equal','≠','niet gelijk','\\ne',['ongelijk']],['approx','≈','ongeveer','\\approx',['benadering']],['less-than','<','kleiner dan',null,['kleiner']],['greater-than','>','groter dan',null,['groter']],['less-equal','≤','kleiner of gelijk','\\leq',['kleiner gelijk']],['greater-equal','≥','groter of gelijk','\\geq',['groter gelijk']],['equiv','≡','equivalent','\\equiv',['identiek']],
    ['element','∈','element','\\in',['element van','behoort','verzameling']],['not-element','∉','geen element','\\notin',['behoort niet']],['subset','⊂','deelverzameling','\\subset',['subset']],['subset-equal','⊆','deelverzameling of gelijk','\\subseteq',['subset gelijk']],['union','∪','unie','\\cup',['samenvoeging']],['intersection','∩','doorsnede','\\cap',['snijverzameling']],['empty-set','∅','lege verzameling','\\emptyset',['leeg']],['natural-numbers','ℕ','natuurlijke getallen','\\mathbb{N}',['natuurlijke']],['integers','ℤ','gehele getallen','\\mathbb{Z}',['integer']],['rationals','ℚ','rationale getallen','\\mathbb{Q}',['rationaal']],['reals','ℝ','reële getallen','\\mathbb{R}',['reëel','reals']],
    ['angle','∠','hoek','\\angle',['meetkunde']],['triangle','△','driehoek','\\triangle',['meetkunde']],['parallel','∥','evenwijdig','\\parallel',['parallel']],['perpendicular','⊥','loodrecht','\\perp',['perpendiculair']],['degree','°','graden','\\degree',['hoek']],
    ['right-arrow','→','naar rechts','\\rightarrow',['pijl','vector']],['left-arrow','←','naar links','\\leftarrow',['pijl']],['both-arrows','↔','beide richtingen','\\leftrightarrow',['pijl']],['implies','⇒','impliceert','\\Rightarrow',['implicatie']],['iff','⇔','dan en slechts dan','\\Leftrightarrow',['equivalentie']],['mapsto','↦','afbeelding','\\mapsto',['toewijzing']],
    ['forall','∀','voor alle','\\forall',['logica','iedere']],['exists','∃','er bestaat','\\exists',['logica','bestaat']],['not','¬','niet','\\neg',['logica']],['and','∧','en','\\land',['logica']],['or','∨','of','\\lor',['logica']],
    ['infinity','∞','oneindig','\\infty',['infinity','oneindigheid']],['integral','∫','integraal','\\int',['integral','analyse']],['partial','∂','partiële afgeleide','\\partial',['afgeleide','analyse']],['nabla','∇','nabla','\\nabla',['gradient','analyse']],['vector-arrow','⃗','vectorpijl','\\vec{x}',['vector','vectoren']]
  ]){
    const cat=Object.keys(categoryById).find(key=>categoryById[key].includes(id))||'operators';
    add(cat,id,glyph,label,[...keywords,label],latex);
  }
  add('powers-roots','square','x²','kwadraat',['macht','square'],null,'x^2');
  add('powers-roots','power','xⁿ','macht',['exponent','macht'],null,'x^{n}');
  add('powers-roots','square-root','√','wortel',['root','radicaal'],null,'\\sqrt{x}');
  add('powers-roots','cube-root','∛','derdemachtswortel',['root','wortel'],null,'\\sqrt[3]{x}');
  add('fractions','fraction','a/b','breuk',['fraction','structuur'],null,'\\frac{a}{b}');
  add('fractions','half','½','een half',['breuk','half'],null,'\\frac{1}{2}');
  for(const name of ['sin','cos','tan','ln','log','exp','min','max'])add('functions',name,name,name,['functie',name==='sin'?'sinus':name==='cos'?'cosinus':name],null,`\\${name}(x)`);
  add('structures','summation','∑','som',['sommatie','sum'],'\\sum_{i=1}^{n} x_i');
  add('structures','integral-template','∫','bepaalde integraal',['integraal','integraltemplate'],'\\int_{a}^{b} f(x)\\,dx');
  const byId=new Set();for(const entry of entries){if(byId.has(entry.id))throw Error(`Dubbele symbool-ID: ${entry.id}`);byId.add(entry.id);}
  function normalize(value){return String(value).toLocaleLowerCase('nl').normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  function search(query='',category='all'){
    const q=normalize(query);
    return entries.filter(entry=>(category==='all'||entry.category===category)&&(!q||normalize([entry.id,entry.unicode,entry.label,entry.latex||'',entry.source||'',entry.formula||'',...entry.keywords].join(' ')).includes(q)));
  }
  global.FZI=global.FZI||{};global.FZI.MathIllustration=global.FZI.MathIllustration||{};
  global.FZI.MathIllustration.TextSymbolCatalog=Object.freeze({entries:Object.freeze(entries),categories:Object.freeze(categories.map(Object.freeze)),search});
})(window);
