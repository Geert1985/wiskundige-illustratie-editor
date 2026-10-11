import {parse} from 'opentype.js';
export const faces={regular:'SourceSans3-Regular.ttf',bold:'SourceSans3-Bold.ttf',italic:'SourceSans3-It.ttf',boldItalic:'SourceSans3-BoldIt.ttf',serif:'SourceSerif4-Regular.ttf'};
const parsed={},urls={},metricCache=new Map(),pathCache=new Map(),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
export const corpus=['Nederlands: café, naïef, één; e\u0301 en é','Grieks: αβθΩπ — ≤≥±×÷','Kerning: AV To Wa fi ffi','Lang: oppervlakte van cirkel met meerdere bronwaarden','Supplementair: 😀'];
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export async function prepareFonts(){const start=performance.now();await Promise.all(Object.entries(faces).map(async([id,file])=>{const bytes=await(await fetch('fonts/'+file)).arrayBuffer();parsed[id]=parse(bytes);const blob=new Blob([bytes],{type:'font/ttf'});urls[id]=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(blob);});const font=new FontFace('PF-'+id,`url(${urls[id]})`);await font.load();document.fonts.add(font);}));return performance.now()-start;}
export function coverage(text,face='regular'){return Array.from(text).filter(c=>!parsed[face].charToGlyphIndex(c)).map(c=>({character:c,codepoint:'U+'+c.codePointAt(0).toString(16).toUpperCase()}));}
export function metric(text,size,face){const key=JSON.stringify([text,size,face]);if(metricCache.has(key))return metricCache.get(key);ctx.font=`${size}px PF-${face}`;const m=ctx.measureText(text);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),node=document.createElementNS(svg.namespaceURI,'text');svg.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden';node.setAttribute('font-family','PF-'+face);node.setAttribute('font-size',size);node.setAttribute('font-kerning','normal');node.textContent=text;svg.append(node);document.body.append(svg);const svgNative=node.getComputedTextLength();svg.remove();const value={native:m.width,svgNative,path:parsed[face].getAdvanceWidth(text,size,{kerning:true}),ascent:m.actualBoundingBoxAscent,descent:m.actualBoundingBoxDescent};metricCache.set(key,value);return value;}
// Explicitly reject unsupported glyphs rather than silently use OS/emoji fallback.
function check(text,face){const missing=coverage(text,face);if(missing.length)throw Error('UNSUPPORTED_GLYPH '+missing.map(m=>m.codepoint).join(','));}
function primitive(kind,text,x,y,size,face,color){check(text,face);if(kind==='text')return `<text x="${x}" y="${y}" font-family="PF-${face}" font-size="${size}" fill="${color}" font-kerning="normal">${esc(text)}</text>`;const key=JSON.stringify([text,size,face]);if(!pathCache.has(key))pathCache.set(key,parsed[face].getPath(text,0,0,size,{kerning:true}).toPathData(3));return `<path transform="translate(${x} ${y})" d="${pathCache.get(key)}" fill="${color}"/>`;}
export function glyphProbe(kind,text,face='regular'){return primitive(kind,text,0,0,16,face,'#222');}
export function makeSvg(kind,{count=1,size=16,rotation=0,zoom=1,unique=false}={}){
 const used=new Set(),body=[],labels=[];let maxWidth=0;
 for(let i=0;i<count;i++){const face=Object.keys(faces)[i%5],texts=[corpus[i%4]+(unique?' '+i:''),'H', '2', 'O + x', '2', ' + α'];const y=40+i*110;
 used.add(face);labels.push(texts.join(''));let x=20;
 texts.forEach((text,j)=>{const script=j===2||j===4,sz=script?size*.7:size,base=y+(j===2?size*.3:j===4?-size*.45:0);body.push(primitive(kind,text,x,base,sz,face,'#222222'));x+=(kind==='text'?metric(text,sz,face).native:metric(text,sz,face).path);});
 body.push(primitive(kind,'Tweede regel — '+face,20,y+size*1.7,size,face,'#224466'));
 body.push(`<path d="M20 ${y+size*2.8}h${Math.max(30,x-20)}" fill="none" stroke="#888"/>`);maxWidth=Math.max(maxWidth,x+30);
 }
 // Fixed shared dimensions for a meaningful A/B pixel comparison. Bounds are still measured independently.
 const width=1100,height=count*110+80;
 const css=kind==='text'?`<style>${[...used].map(f=>`@font-face{font-family:PF-${f};src:url(${urls[f]}) format('truetype')}`).join('')}</style>`:'';
 // Fixed viewBox encloses rotated fixtures; accessibility annotation not claimed as screenreader proof.
 const w=rotation?width+height:width,h=rotation?width+height:height;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(w*zoom)}" height="${Math.ceil(h*zoom)}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc"><title id="title">P0-tech ${kind}</title><desc id="desc">${esc(labels.join('\n'))}</desc>${css}<rect width="100%" height="100%" fill="white"/><g id="content" aria-hidden="true" transform="translate(${rotation?height:0} 10) rotate(${rotation})">${body.join('')}</g></svg>`;
}
export async function raster(svg){const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d').drawImage(image,0,0);return {url:c.toDataURL('image/png'),width:c.width,height:c.height};}finally{URL.revokeObjectURL(url);}}
export async function compareScreens(kind,opts){const svg=makeSvg(kind,opts),area=document.querySelector('#renderArea');area.innerHTML=svg;await document.fonts.ready;const el=area.querySelector('#content'),box=el.getBBox();return {svg,bounds:{x:box.x,y:box.y,width:box.width,height:box.height},raster:await raster(svg)};}
export const ready=prepareFonts();
