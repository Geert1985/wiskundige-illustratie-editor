/* Pure selection handles; no interaction handlers or render patches. */
(function(global) {
  global.FZI.MathIllustration.EditorOverlays = {
    render(svg, renderer, object, tool, document) {
      if (!svg || !object || object.visible === false || tool !== "select") return;
      if(object.type === 'polygon') {
        const layer=document.createElementNS('http://www.w3.org/2000/svg','g'); layer.setAttribute('class','fzi-polygon-handles');
        object.vertices.forEach((p,index)=>{ const handle=document.createElementNS('http://www.w3.org/2000/svg','circle');
          handle.setAttribute('cx',renderer.mapX(p.x)); handle.setAttribute('cy',renderer.mapY(p.y)); handle.setAttribute('r','7');
          handle.setAttribute('class','fzi-polygon-vertex'); handle.setAttribute('data-polygon-id',object.id); handle.setAttribute('data-vertex',index);
          handle.setAttribute('fill','#fff'); handle.setAttribute('stroke','currentColor'); handle.setAttribute('stroke-width','2'); handle.style.cursor='crosshair'; layer.appendChild(handle);
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
        handle.style.cursor = "crosshair"; layer.appendChild(handle);
      }
      svg.appendChild(layer);
    }
  };
})(window);
