/* Feedback consumes the interaction result; it never resolves or alters a preview. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  if (MI.Engine.prototype.__fziSnapIndicatorInstalled) return;
  function removeIndicator() {
    document.querySelectorAll("#canvas .fzi-snap-indicator").forEach(node => node.remove());
  }
  function showResult(event) {
    removeIndicator();
    const { engine, result } = event.detail;
    if (!result || !result.snapped || engine.renderer.showSnapPoints === false) return;
    const svg = document.querySelector("#canvas svg"); if (!svg) return;
    const layer = document.createElementNS("http://www.w3.org/2000/svg", "g"), circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    layer.setAttribute("class", "fzi-snap-indicator"); layer.setAttribute("pointer-events", "none");
    circle.setAttribute("cx", engine.renderer.mapX(result.point.x)); circle.setAttribute("cy", engine.renderer.mapY(result.point.y));
    circle.setAttribute("r", "8"); circle.setAttribute("fill", "none"); circle.setAttribute("stroke", "#2563eb"); circle.setAttribute("stroke-width", "4");
    layer.appendChild(circle); svg.appendChild(layer);
  }
  function installViewToggle() {
    const viewList = document.getElementById("viewList");
    if (!viewList || viewList.querySelector("[data-view='snapPoints']")) return;
    const raster = viewList.querySelector("[data-view='grid']");
    if (!raster) return;
    const row = document.createElement("div");
    row.className = "view-row";
    row.innerHTML = '<button class="view-name view-system-btn" type="button">Snappunten</button><button class="eye-btn" type="button" data-view="snapPoints" aria-label="Snappunten zichtbaar"></button>';
    const button = row.querySelector("[data-view='snapPoints']");
    const updateButton = function () {
      const activeEngine = MI.activeEngine;
      const visible = !activeEngine || activeEngine.renderer.showSnapPoints !== false;
      button.innerHTML = visible
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.7" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M9.9 5.9C10.6 5.7 11.3 5.6 12 5.6c6.5 0 10 6.4 10 6.4-.8 1.2-1.8 2.4-3.1 3.4M6.1 6.1C3.5 7.7 2 12 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    };
    button.addEventListener("click", function () {
      const activeEngine = MI.activeEngine;
      if (!activeEngine) return;
      activeEngine.renderer.showSnapPoints = activeEngine.renderer.showSnapPoints === false;
      updateButton();
      removeIndicator();
      const crosshair = document.getElementById("crosshair");
      if (crosshair) { crosshair.classList.remove("snapped"); crosshair.hidden = false; }
    });
    updateButton();
    raster.closest(".view-row")?.after(row);
  }


  const viewList = document.getElementById("viewList");
  if (viewList) { new MutationObserver(installViewToggle).observe(viewList, { childList: true }); installViewToggle(); }
  global.addEventListener("fzi:snap-result", showResult);
  global.addEventListener("mouseleave", removeIndicator);
  MI.Engine.prototype.__fziSnapIndicatorInstalled = true;
})(window);
