(function(global){
  'use strict';
  const MI=global.FZI.MathIllustration,cache=new Map();let converter=null,loading=null,cacheBytes=0;
  function install(convert){converter=convert;cache.clear();cacheBytes=0;}
  function load(){if(converter)return Promise.resolve();if(!loading)loading=import('./math-renderer.bundle.js?v=text-t4-1').then(module=>install(module.convert)).catch(error=>{loading=null;throw error;});return loading;}
  function box(source,marks={}){source=MI.MathSource.validate(source);const key=JSON.stringify([source,!!marks.bold,!!marks.italic]);if(!converter)throw Error('Formule-assets zijn nog niet geladen.');if(!cache.has(key)){const result=converter(source,{bold:!!marks.bold,italic:!!marks.italic});while(cache.size>=128||cacheBytes+result.body.length>4194304){const first=cache.keys().next().value;cacheBytes-=cache.get(first).body.length;cache.delete(first);}cache.set(key,result);cacheBytes+=result.body.length;}return cache.get(key);}
  function svg(source,size,color,x=0,y=0,marks={}){const b=box(source,marks),esc=MI.escapeXml||String;return `<svg data-math-fragment="1" x="${x}" y="${y-b.ascent*size}" width="${b.width*size}" height="${(b.ascent+b.descent)*size}" viewBox="${b.viewBox}" color="${esc(color)}" fill="${esc(color)}" stroke="${esc(color)}" role="img" aria-label="${esc(source)}"><title>${esc(source)}</title>${b.body}</svg>`;}
  function has(objects){return objects.some(o=>o.textContent?.paragraphs.some(p=>p.runs.some(r=>r.kind==='math')));}
  MI.MathFragments=Object.freeze({load,install,box,svg,has,ready:()=>!!converter});
})(window);
