/* From Zero 2 Infinity — visual snap indicator */
(function (global) {
  "use strict";

  const NS = global.FZI = global.FZI || {};
  const MI = NS.MathIllustration = NS.MathIllustration || {};
  if (!MI.Engine || MI.Engine.prototype.__fziSnapIndicatorInstalled) return;

  let activeEngine = null;

  function eventToMath(event, engine) {
    const svg = document.querySelector("#canvas svg");
    if (!svg || !engine) return null;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    const r = engine.renderer, b = r.bounds, scale = r.scale();
    return { x: b.xMin + (p.x - r.padding) / scale, y: b.yMin + (r.height - r.padding - p.y) / scale };
  }

  function removeIndicator() {
    document.querySelectorAll("#canvas .fzi-snap-indicator").forEach(function (node) { node.remove(); });
  }

  function showIndicator(event) {
    if (!activeEngine || !MI.snapPoint) return;
    const tool = document.querySelector(".tool.active");
    if (!tool || tool.dataset.tool === "select") {
      removeIndicator();
      return;
    }

    const mouse = eventToMath(event, activeEngine);
    const svg = document.querySelector("#canvas svg");
    if (!mouse || !svg) return;

    const snap = MI.snapPoint(activeEngine, mouse, null);
    removeIndicator();
    if (!snap.snapped) return;

    const p = { x: activeEngine.renderer.mapX(snap.x), y: activeEngine.renderer.mapY(snap.y) };
    const layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layer.setAttribute("class", "fzi-snap-indicator");
    layer.setAttribute("pointer-events", "none");

    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    ring.setAttribute("cx", p.x);
    ring.setAttribute("cy", p.y);
    ring.setAttribute("r", "8");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "#2563eb");
    ring.setAttribute("stroke-width", "2");

    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", p.x);
    dot.setAttribute("cy", p.y);
    dot.setAttribute("r", "2.5");
    dot.setAttribute("fill", "#2563eb");

    layer.appendChild(ring);
    layer.appendChild(dot);
    svg.appendChild(layer);
  }

  const originalRenderSVG = MI.Engine.prototype.renderSVG;
  MI.Engine.prototype.renderSVG = function () {
    activeEngine = this;
    return originalRenderSVG.apply(this, arguments);
  };

  const canvas = document.getElementById("canvas");
  if (canvas) {
    canvas.addEventListener("pointermove", showIndicator);
    canvas.addEventListener("pointerleave", removeIndicator);
  }

  MI.Engine.prototype.__fziSnapIndicatorInstalled = true;
})(window);
