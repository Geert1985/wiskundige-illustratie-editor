// Browser export boundary. No document writes, permissions or persisted caches.
(function(global){
  'use strict';const MI=global.FZI.MathIllustration;
  const limits=Object.freeze({side:8192,pixels:16777216,scale:4,decodeMs:30000});
  function dimensions(width,height,scale=1){
    if(!Number.isFinite(scale)||scale<=0||scale>limits.scale)throw Error('Ongeldige PNG-schaal.');
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw Error('Ongeldige exportafmetingen.');
    const w=Math.ceil(width*scale),h=Math.ceil(height*scale);
    if(w>limits.side||h>limits.side||w*h>limits.pixels)throw Error('PNG overschrijdt de rasterlimiet (8192 px per zijde, 16 megapixels).');
    return {width:w,height:h};
  }
  function check(guard){if(guard&&!guard())throw Error('Exportcontext gewijzigd; exporteer opnieuw.');}
  async function svg(engine,{guard,document:doc=global.document}={}){
    check(guard);
    if(MI.MathFragments.has(engine.model.all()))await MI.MathFragments.load();
    if(doc?.fonts)await doc.fonts.ready;
    check(guard);const result=engine.renderSVG();check(guard);return result;
  }
  // Chromium SVG Image decoding ignores embedded web fonts. Rasterize each
  // authorized text element with loaded local fonts, then replace it in-place
  // with a local bitmap. SVG still controls transforms, opacity and layer order.
  async function nativeText(source,doc,guard,density=1){
    if(!doc?.body||!global.DOMParser)return source;
    const parsed=new global.DOMParser().parseFromString(source,'image/svg+xml'),svg=parsed.documentElement;
    if(svg.localName!=='svg'||parsed.querySelector('parsererror,script,foreignObject,image,iframe'))throw Error('Ongeldige zelfstandige SVG.');
    for(const node of [svg,...svg.querySelectorAll('*')])for(const attr of node.attributes){if(/^on/i.test(attr.name)||/href$/i.test(attr.name)&&!attr.value.startsWith('#')||/url\((?!['"]?#)/i.test(attr.value))throw Error('Externe SVG-inhoud niet toegestaan.');}
    for(const style of svg.querySelectorAll('style'))if(/@import|url\((?!data:font\/ttf;base64,)/i.test(style.textContent))throw Error('Externe SVG-fonts niet toegestaan.');
    const host=doc.createElement('div');host.setAttribute('aria-hidden','true');host.style.cssText='position:fixed;left:-100000px;top:0;pointer-events:none;opacity:0';host.append(doc.importNode(svg,true));doc.body.append(host);
    const live=host.firstChild,targets=[...parsed.querySelectorAll('text')];let glyphCount=0,pixelCount=0;
    try{
      if(doc.fonts)await doc.fonts.ready;check(guard);
      const texts=[...live.querySelectorAll('text')];
      for(let ti=0;ti<texts.length;ti++){
        const text=texts[ti],box=text.getBBox(),pad=4,x=Math.floor(box.x)-pad,y=Math.floor(box.y)-pad;
        const size=dimensions(Math.ceil(box.x+box.width)-x+pad,Math.ceil(box.y+box.height)-y+pad);const raster=dimensions(size.width,size.height,density);pixelCount+=raster.width*raster.height;if(pixelCount>limits.pixels)throw Error('PNG-tekst overschrijdt de rasterlimiet.');
        const canvas=doc.createElement('canvas');canvas.width=raster.width;canvas.height=raster.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('PNG-canvas niet beschikbaar.');ctx.scale(density,density);
        let index=0;const count=text.getNumberOfChars(),walker=doc.createTreeWalker(text,4);let leaf;
        while((leaf=walker.nextNode())){
          const style=global.getComputedStyle(leaf.parentElement);let value=leaf.textContent;if(count<text.textContent.length&&text.children.length===0)value=value.replace(/\s+/g,' ').trim();
          const clusters=global.Intl?.Segmenter?[...new global.Intl.Segmenter('und',{granularity:'grapheme'}).segment(value)].map(s=>s.segment):Array.from(value);
          for(const cluster of clusters){
            if(index>=count)throw Error('Tekst kan niet verliesvrij worden gerasterd.');const point=text.getStartPositionOfChar(index),rotation=text.getRotationOfChar(index);let opacity=1;
            for(let parent=leaf.parentElement;parent&&parent!==text.parentElement;parent=parent.parentElement)opacity*=Number(global.getComputedStyle(parent).opacity);
            ctx.save();ctx.translate(point.x-x,point.y-y);ctx.rotate(rotation*Math.PI/180);ctx.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;ctx.fontKerning='none';ctx.fillStyle=style.fill;ctx.globalAlpha=opacity;ctx.textBaseline='alphabetic';if(style.fill!=='none')ctx.fillText(cluster,0,0);
            const fontSize=parseFloat(style.fontSize),advance=ctx.measureText(cluster).width;for(const dy of [style.textDecorationLine.includes('underline')?fontSize*.12:null,style.textDecorationLine.includes('line-through')?-fontSize*.3:null].filter(v=>v!=null))ctx.fillRect(0,dy,advance,Math.max(1,fontSize/16));ctx.restore();
            index+=cluster.length;if(++glyphCount>65536)throw Error('PNG bevat te veel teksttekens.');
          }
        }
        const image=parsed.createElementNS('http://www.w3.org/2000/svg','image');for(const [key,value] of Object.entries({x,y,width:size.width,height:size.height,href:canvas.toDataURL('image/png')}))image.setAttribute(key,String(value));if(text.hasAttribute('transform'))image.setAttribute('transform',text.getAttribute('transform'));targets[ti].replaceWith(image);
      }
      check(guard);for(const style of parsed.querySelectorAll('style'))style.remove();return new global.XMLSerializer().serializeToString(parsed);
    }finally{host.remove();}
  }
  async function png(source,{width,height,scale=1,guard,document:doc=global.document}={}){
    const size=dimensions(width,height,scale);check(guard);
    const native=await nativeText(source,doc,guard,Math.max(scale,1));check(guard);
    const url=global.URL.createObjectURL(new global.Blob([native],{type:'image/svg+xml'}));let timer;
    try{
      const img=new global.Image();img.src=url;
      await Promise.race([img.decode(),new Promise((_,reject)=>{timer=global.setTimeout(()=>reject(Error('SVG laden voor PNG duurde te lang.')),limits.decodeMs);})]);
      global.clearTimeout(timer);check(guard);
      const canvas=doc.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
      const ctx=canvas.getContext('2d');if(!ctx)throw Error('PNG-canvas niet beschikbaar.');ctx.drawImage(img,0,0,size.width,size.height);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('PNG kon niet worden aangemaakt.')),'image/png'));
      check(guard);return blob;
    }finally{global.clearTimeout(timer);global.URL.revokeObjectURL(url);}
  }
  MI.ExportService=Object.freeze({limits,dimensions,svg,png});
})(window);
