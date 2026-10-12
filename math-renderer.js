// Build-only MathJax adapter. The generated ESM bundle has no network/font loader.
import {mathjax} from 'mathjax-full/js/mathjax.js';
import {TeX} from 'mathjax-full/js/input/tex.js';
import {SVG} from 'mathjax-full/js/output/svg.js';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js';
import 'mathjax-full/js/input/tex/base/BaseConfiguration.js';
import 'mathjax-full/js/input/tex/ams/AmsConfiguration.js';
import 'mathjax-full/js/input/tex/boldsymbol/BoldsymbolConfiguration.js';

const adaptor=liteAdaptor();
RegisterHTMLHandler(adaptor);
const document=mathjax.document('',{InputJax:new TeX({packages:['base','ams','boldsymbol'],maxBuffer:4096,maxMacros:512,formatError:()=>{throw Error('Ongeldige formule.');}}),OutputJax:new SVG({fontCache:'none'})});
const tags=new Set(['svg','g','path','rect','line','polygon','polyline']);
const attributes=new Set(['viewBox','transform','d','x','y','x1','y1','x2','y2','width','height','points','fill','stroke','stroke-width','opacity']);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function convert(source,marks={}){
  if(marks.italic)source='\\mathit{'+source+'}';if(marks.bold)source='\\boldsymbol{'+source+'}';
  const container=document.convert(source,{display:false}),svg=adaptor.firstChild(container);
  const [x,y,width,height]=String(adaptor.getAttribute(svg,'viewBox')).split(/\s+/).map(Number);
  if(![x,y,width,height].every(Number.isFinite)||width<=0||height<=0)throw Error('Formule heeft geen geldige afmetingen.');
  let count=0;
  function serialize(node){
    if(++count>4096)throw Error('Formule bevat te veel glyphs.');
    const tag=adaptor.kind(node);
    if(!tags.has(tag)||adaptor.getAttribute(node,'data-mjx-error'))throw Error('Niet-ondersteunde formule-uitvoer.');
    const attrs=adaptor.allAttributes(node).filter(a=>attributes.has(a.name)).map(a=>{
      if(/url\(|[<>]|https?:|javascript:/i.test(a.value))throw Error('Onveilige formule-uitvoer.');
      return `${a.name}="${escape(a.value)}"`;
    });
    return `<${tag}${attrs.length?' '+attrs.join(' '):''}>${adaptor.childNodes(node).map(serialize).join('')}</${tag}>`;
  }
  const body=adaptor.childNodes(svg).map(serialize).join('');
  if(body.length>65536)throw Error('Formule-uitvoer is te groot.');
  return Object.freeze({body,viewBox:[x,y,width,height].join(' '),width:width/1000,ascent:-y/1000,descent:(y+height)/1000,nodes:count});
}
