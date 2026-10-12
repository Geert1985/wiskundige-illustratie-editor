// Pure shared mixed-inline layout. Input is the application schema, never editor JSON.
(function(global){
  'use strict';const MI=global.FZI.MathIllustration;
  const num=n=>String(Number(n.toFixed(4)));
  function layout(c){
    const lines=[];let line;
    const newLine=p=>{line={align:p.align,lineHeight:p.lineHeight,width:0,ascent:c.defaults.fontSize*.8,descent:c.defaults.fontSize*.25,boxes:[]};lines.push(line);};
    for(const p of c.paragraphs){newLine(p);for(const run of p.runs){
      if(run.kind==='hardBreak'){newLine(p);continue;}
      const marks=run.marks||{},nominal=marks.fontSize||c.defaults.fontSize,size=nominal*(marks.script ? 0.7 : 1),shift=marks.script==='super'?-nominal*.4:marks.script==='sub'?nominal*.2:0,color=marks.color||c.defaults.color,fontId=marks.fontId||c.defaults.fontId;
      const face=fontId==='serif'?'serifRegular':marks.bold?(marks.italic?'sansBoldItalic':'sansBold'):(marks.italic?'sansItalic':'sansRegular'),metrics=MI.TextMetrics[face];
      const math=run.kind==='math'?MI.MathFragments.box(run.source,marks):null;
      const measure=text=>Array.from(text).reduce((n,ch)=>n+(metrics.advances[ch.codePointAt(0)]??1)*size,0);
      const append=(part,width)=>{if(c.width!=null&&line.boxes.length&&line.width+width>c.width)newLine(p);line.boxes.push({run:part,marks,size,shift,color,fontId,width,offset:line.width});line.width+=width;line.ascent=Math.max(line.ascent,(math?math.ascent:metrics.ascent)*size-shift);line.descent=Math.max(line.descent,(math?math.descent:metrics.descent)*size+shift);};
      if(math||run.atomic||c.width==null){append(run,math?math.width*size:measure(run.text));continue;}
      for(const token of run.text.match(/\s+|\S+/gu)||[]){
        if(measure(token)<=c.width){append({...run,text:token},measure(token));continue;}
        const clusters=global.Intl?.Segmenter?[...new global.Intl.Segmenter('und',{granularity:'grapheme'}).segment(token)].map(s=>s.segment):Array.from(token);
        let text='',width=0;
        for(const cluster of clusters){const w=measure(cluster);if(text&&width+w>c.width){append({...run,text},width);text='';width=0;}text+=cluster;width+=w;}
        if(text)append({...run,text},width);
      }
    }}
    return lines;
  }
  function render(object,x,y){
    const c=object.textContent,esc=MI.escapeXml,lines=layout(c);
    let baseline=0,out='';
    for(let i=0;i<lines.length;i++){
      const l=lines[i];if(i){const previous=lines[i-1];baseline+=Math.max(c.defaults.fontSize*previous.lineHeight,previous.descent+l.ascent);}
      const offset=l.align==='center'?-l.width/2:l.align==='right'?-l.width:0;
      for(const b of l.boxes){const bx=x+offset+b.offset,by=y+baseline+b.shift;
        if(b.run.kind==='math'){out+=MI.MathFragments.svg(b.run.source,b.size,b.color,bx,by,b.marks);if(b.marks.underline||b.marks.strike)for(const sy of [b.marks.underline?by+b.size*.12:null,b.marks.strike?by-b.size*.3:null].filter(v=>v!=null))out+=`<line x1="${num(bx)}" x2="${num(bx+b.width)}" y1="${num(sy)}" y2="${num(sy)}" stroke="${esc(b.color)}"/>`;}
        else {const m=b.marks,attrs=[`x="${num(bx)}"`,`y="${num(by)}"`,`fill="${esc(b.color)}"`,`font-size="${num(b.size)}"`,`font-family="${esc(b.fontId==='serif'?'"Source Serif 4", serif':'"Source Sans 3", sans-serif')}"`,`font-kerning="none"`];if(m.bold)attrs.push('font-weight="700"');if(m.italic)attrs.push('font-style="italic"');if(m.underline||m.strike)attrs.push(`text-decoration="${[m.underline?'underline':'',m.strike?'line-through':''].filter(Boolean).join(' ')}"`);if(m.script)attrs.push(`data-script="${m.script}"`);out+=`<text ${attrs.join(' ')}>${esc(b.run.text)}</text>`;}
      }
    }
    const transform=object.rotation?` transform="rotate(${num(object.rotation)} ${num(x)} ${num(y)})"`:'';
    return `<g data-rich-text="2" xml:space="preserve" style="font-variant-ligatures:none" role="group" aria-label="${esc(MI.TextContent.plain(c))}"${transform}>${out}</g>`;
  }
  function legacy(object) {
      const esc=MI.escapeXml,c=object.textContent,s=object.style||{},x=this.mapX(object.x),y=this.mapY(object.y),baseSize=c.defaults.fontSize||s.fontSize||16,baseColor=c.defaults.color||s.fill||'#222222',family=id=>id==='serif'?'"Source Serif 4", serif':'"Source Sans 3", sans-serif';
      const transform=object.rotation?' transform="rotate('+num(object.rotation)+' '+num(x)+' '+num(y)+')"':'';let out='<text data-rich-text="1" xml:space="preserve" x="'+num(x)+'" y="'+num(y)+'" fill="'+esc(baseColor)+'" font-size="'+num(baseSize)+'" font-family="'+esc(family(c.defaults.fontId))+'" text-anchor="start"'+transform+'>';
      c.paragraphs.forEach((p,pi)=>{if(pi)out+='<tspan x="'+num(x)+'" dy="'+num(baseSize*(c.paragraphs[pi-1].lineHeight||1.25))+'"></tspan>';const anchor=p.align==='center'?'middle':p.align==='right'?'end':'start';let first=true;for(const r of p.runs){if(r.kind==='hardBreak'){out+='<tspan x="'+num(x)+'" dy="'+num(baseSize*p.lineHeight)+'"></tspan>';first=true;continue;}const m=r.marks||{},attrs=[];if(m.bold)attrs.push('font-weight="700"');if(m.italic)attrs.push('font-style="italic"');if(m.underline||m.strike)attrs.push('text-decoration="'+[m.underline?'underline':'',m.strike?'line-through':''].filter(Boolean).join(' ')+'"');if(m.color)attrs.push('fill="'+esc(m.color)+'"');if(m.fontId)attrs.push('font-family="'+esc(family(m.fontId))+'"');if(m.fontSize)attrs.push('font-size="'+num(m.fontSize)+'"');if(m.script)attrs.push('baseline-shift="'+(m.script==='super'?'super':'sub')+'"');out+='<tspan'+(first?' text-anchor="'+anchor+'"':'')+(attrs.length?' '+attrs.join(' '):'')+'>'+esc(r.text)+'</tspan>';first=false;}});return out+'</text>';
    }
  MI.RichTextRenderer=Object.freeze({render,legacy,layout});
})(window);
