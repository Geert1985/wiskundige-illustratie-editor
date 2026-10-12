// Presentation notation only: never an evaluator or a source-reference language.
(function(global){
  'use strict';
  global.FZI=global.FZI||{};global.FZI.MathIllustration=global.FZI.MathIllustration||{};
  const limits=Object.freeze({source:2048,tokens:256,depth:32,fragments:128,documentTokens:8192,documentFragments:512});
  const simple=new Set(('alpha beta gamma delta epsilon varepsilon zeta eta theta vartheta iota kappa lambda mu nu xi pi varpi rho sigma varsigma tau upsilon phi varphi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega sin cos tan asin acos atan arcsin arccos arctan sinh cosh tanh log ln exp min max lim sum prod int infty pm mp times div cdot le leq ge geq ne neq approx equiv sim simeq propto in notin ni subset subseteq supset supseteq cup cap emptyset varnothing forall exists neg land lor wedge vee implies iff to rightarrow leftarrow leftrightarrow Rightarrow Leftarrow Leftrightarrow mapsto uparrow downarrow angle triangle parallel perp degree circ prime partial nabla ell lbrace rbrace langle rangle lvert rvert vert mid ldots cdots dots quad qquad').split(' '));
  const args=new Map(Object.entries({frac:2,dfrac:2,tfrac:2,sqrt:1,mathrm:1,mathbf:1,mathit:1,mathbb:1,mathcal:1,operatorname:1,overline:1,underline:1,vec:1,hat:1,bar:1}));
  function validate(source){
    if(typeof source!=='string'||!source.trim()||source.length>limits.source||/[\x00-\x08\x0b-\x1f<>$%#&~]|https?:|javascript:/i.test(source))throw Error('Ongeldige of onveilige formule.');
    const tokens=source.match(/\\[a-zA-Z]+|\\[^a-zA-Z]|[^\s]/g)||[];
    if(tokens.length>limits.tokens)throw Error('Formule bevat te veel tokens.');
    let i=0,visible=0;
    const delimiters=new Set(['(',')','[',']','|','.','\\{','\\}','\\lbrace','\\rbrace','\\langle','\\rangle','\\vert','\\lvert','\\rvert']);
    function sequence(depth,end){const start=i;while(i<tokens.length&&tokens[i]!==end)atom(depth);if(end){if(tokens[i++]!==end||i===start+1)throw Error('Lege of niet-gesloten formulegroep.');}}
    function unit(depth){
      if(depth>limits.depth||i>=tokens.length)throw Error('Onvolledige of te diepe formule.');
      const t=tokens[i++];
      if(t==='{'){sequence(depth+1,'}');return;}
      if(t==='}'||t==='^'||t==='_')throw Error('Onverwacht reken- of groepteken.');
      if(t.startsWith('\\')){
        const command=t.slice(1);
        if(['{','}',',',';',':','!',' '].includes(command)||simple.has(command)){if(![',',';',':','!',' ','quad','qquad'].includes(command))visible++;return;}
        if(command==='left'){if(!delimiters.has(tokens[i++]))throw Error('Ongeldige formulehaak.');sequence(depth+1,'\\right');if(!delimiters.has(tokens[i++]))throw Error('Ongeldige formulehaak.');visible++;return;}
        if(!args.has(command))throw Error('Niet-toegestane formuleopdracht.');
        if(command==='sqrt'&&tokens[i]==='['){i++;sequence(depth+1,']');}
        for(let n=0;n<args.get(command);n++)unit(depth+1);
        visible++;
      }else{if(!/^[a-zA-Z0-9+\-*/=.,:;!|()[\]'\u0370-\u03ff\u2200-\u22ff]$/.test(t))throw Error('Gebruik een ondersteunde formuleopdracht voor dit symbool.');visible++;}
    }
    function atom(depth){unit(depth);const scripts=new Set();while(['^','_'].includes(tokens[i])){const t=tokens[i++];if(scripts.has(t))throw Error('Dubbel superscript of subscript.');scripts.add(t);unit(depth+1);}}
    sequence(0);if(!visible)throw Error('De formule bevat geen zichtbare inhoud.');
    return source.trim();
  }
  function checkDocument(objects){let count=0,tokens=0;for(const o of objects)for(const p of o.textContent?.paragraphs||[])for(const r of p.runs)if(r.kind==='math'){count++;tokens+=(r.source.match(/\\[a-zA-Z]+|\\[^a-zA-Z]|[^\s]/g)||[]).length;}if(count>limits.documentFragments||tokens>limits.documentTokens)throw Error('Document bevat te veel formulewerk.');}
  global.FZI.MathIllustration.MathSource=Object.freeze({validate,limits,checkDocument});
})(window);
