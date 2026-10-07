/* Pure snap overlay; consumes the stored result through the central render. */
(function(global) {
  global.FZI.MathIllustration.SnapFeedback = {
    render(svg, renderer, result, document) {
      if (!svg || !result || !result.snapped || renderer.showSnapPoints === false) return;
      const ns = "http://www.w3.org/2000/svg", layer = document.createElementNS(ns, "g"), circle = document.createElementNS(ns, "circle");
      layer.setAttribute("class", "fzi-snap-indicator"); layer.setAttribute("pointer-events", "none");
      circle.setAttribute("cx", renderer.mapX(result.point.x)); circle.setAttribute("cy", renderer.mapY(result.point.y));
      circle.setAttribute("r", "8"); circle.setAttribute("fill", "none"); circle.setAttribute("stroke", "#2563eb"); circle.setAttribute("stroke-width", "4");
      layer.appendChild(circle); svg.appendChild(layer);
    }
  };
})(window);
