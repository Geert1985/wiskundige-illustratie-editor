/* Pure selection handles; no interaction handlers or render patches. */
(function(global) {
  global.FZI.MathIllustration.EditorOverlays = {
    // Editor-only contrast halos. The source groups and standalone renderer stay untouched.
    selection(svg, { selectedIds=[], hoverId=null, showFrame=true, transform, renderer, document }={}) {
      if(!svg || !document || !transform)return;
      svg.querySelector('[data-selection-presentation]')?.remove();
      const groups=Array.from(svg.querySelectorAll('[data-object-id]'));
      const selected=groups.filter(group=>selectedIds.includes(group.getAttribute('data-object-id')));
      const hover=groups.find(group=>group.getAttribute('data-object-id')===hoverId);
      if(!selected.length && !hover)return;
      const ns='http://www.w3.org/2000/svg',layer=document.createElementNS(ns,'g');
      layer.setAttribute('data-selection-presentation','');layer.setAttribute('pointer-events','none');layer.setAttribute('aria-hidden','true');
      function halo(source,isHover) {
        const holder=document.createElementNS(ns,'g');holder.setAttribute(isHover?'data-hover-highlight':'data-selection-highlight',source.getAttribute('data-object-id'));
        for(const [color,width] of [['#ffffff',isHover?8:14],[isHover?'#087d92':'#f0bd45',isHover?4:10]]) {
          const copy=source.cloneNode(true);
          for(const helper of copy.querySelectorAll('[data-point-projections]'))helper.remove();
          for(const node of [copy,...copy.querySelectorAll('*')]) {
            for(const name of Array.from(node.attributes,n=>n.name))if(name==='id'||name==='class'||name.startsWith('data-'))node.removeAttribute(name);
            node.setAttribute('opacity','1');node.setAttribute('pointer-events','none');
          }
          for(const shape of copy.querySelectorAll('line,path,circle,ellipse,polyline,polygon,text,rect')) {
            shape.setAttribute('fill','none');shape.setAttribute('stroke',color);shape.setAttribute('stroke-width',width);shape.setAttribute('vector-effect','non-scaling-stroke');shape.setAttribute('stroke-linejoin','round');shape.setAttribute('stroke-linecap','round');shape.removeAttribute('stroke-dasharray');
          }
          copy.setAttribute('opacity',isHover?'0.4':'0.5');holder.appendChild(copy);
        }
        layer.appendChild(holder);
      }
      selected.forEach(group=>halo(group,false));if(hover && !selected.includes(hover))halo(hover,true);
      // A labelled dashed screen-space frame is presentation, never a transform handle.
      if(showFrame && selected.length>1) {
        const m=transform.matrix,points=selected.flatMap(group=>{let b;if(group.querySelector('[data-point-projections]')){const copy=group.cloneNode(true);for(const helper of copy.querySelectorAll('[data-point-projections]'))helper.remove();copy.setAttribute('visibility','hidden');svg.appendChild(copy);try{b=copy.getBBox();}finally{copy.remove();}}else b=group.getBBox();return [[b.x,b.y],[b.x+b.width,b.y],[b.x+b.width,b.y+b.height],[b.x,b.y+b.height]].map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}));});
        const left=Math.min(...points.map(p=>p.x))-8,right=Math.max(...points.map(p=>p.x))+8,top=Math.min(...points.map(p=>p.y))-8,bottom=Math.max(...points.map(p=>p.y))+8;
        const map=(x,y)=>{const p=transform.screenToMath({x,y});return [renderer.mapX(p.x),renderer.mapY(p.y)];};
        for(const [color,width] of [['#fff',4],['#b88715',1.5]]) {
          const frame=document.createElementNS(ns,'polygon');frame.setAttribute('data-selection-frame','');frame.setAttribute('points',[[left,top],[right,top],[right,bottom],[left,bottom]].map(([x,y])=>map(x,y).join(',')).join(' '));frame.setAttribute('fill','none');frame.setAttribute('stroke',color);frame.setAttribute('stroke-width',width);frame.setAttribute('stroke-dasharray','5 4');frame.setAttribute('vector-effect','non-scaling-stroke');layer.appendChild(frame);
        }
        const label=document.createElementNS(ns,'text'),p=map(left,top-4);label.setAttribute('x',p[0]);label.setAttribute('y',p[1]);label.setAttribute('font-size',12/Math.hypot(m.a,m.b));label.setAttribute('fill','#956b13');label.setAttribute('stroke','#fff');label.setAttribute('stroke-width','3');label.setAttribute('vector-effect','non-scaling-stroke');label.setAttribute('paint-order','stroke');label.textContent='Selectie · '+selected.length;layer.appendChild(label);
      }
      svg.insertBefore(layer,groups[0] || null);
    },
    render(svg, renderer, object, tool, document) {
      if (!svg || !object || object.visible === false || object.locked || object.construction || (object.construction && object.constructionValid===false) || tool !== "select") return;
      if(object.type === 'polygon' || object.type === 'angle') {
        const layer=document.createElementNS('http://www.w3.org/2000/svg','g'); layer.setAttribute('class','fzi-polygon-handles');
        object.vertices.forEach((p,index)=>{ const handle=document.createElementNS('http://www.w3.org/2000/svg','circle');
          handle.setAttribute('cx',renderer.mapX(p.x)); handle.setAttribute('cy',renderer.mapY(p.y)); handle.setAttribute('r','7');
          handle.setAttribute('class','fzi-polygon-vertex'); handle.setAttribute('data-polygon-id',object.id); handle.setAttribute('data-vertex',index);
          handle.setAttribute('fill','#fff'); handle.setAttribute('stroke','currentColor'); handle.setAttribute('stroke-width','2'); layer.appendChild(handle);
        }); svg.appendChild(layer); return;
      }
      if (!global.FZI.MathIllustration.LinearGeometry.isLinear(object)) return;
      const ns = "http://www.w3.org/2000/svg", layer = document.createElementNS(ns, "g");
      layer.setAttribute("class", "fzi-line-endpoint-layer");
      for (const [x, y, endpoint] of [["x1", "y1", "start"], ["x2", "y2", "end"]]) {
        const handle = document.createElementNS(ns, "circle");
        handle.setAttribute("cx", renderer.mapX(object[x])); handle.setAttribute("cy", renderer.mapY(object[y]));
        handle.setAttribute("r", "7"); handle.setAttribute("class", "fzi-line-endpoint");
        handle.setAttribute("data-line-id", object.id); handle.setAttribute("data-endpoint", endpoint);
        handle.setAttribute("fill", "#fff"); handle.setAttribute("stroke", "currentColor"); handle.setAttribute("stroke-width", "2");
        layer.appendChild(handle);
      }
      svg.appendChild(layer);
    }
  };
})(window);
