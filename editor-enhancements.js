/* Line endpoint controls; snapping is explicit in InteractionResolver. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  if (MI.Engine.prototype.__fziGeometrySnapInstalled) return;
  let activeEngine = MI.activeEngine;
  let endpointDrag = null;
  const originalRenderSVG = MI.Engine.prototype.renderSVG;
  MI.Engine.prototype.renderSVG = function () { activeEngine = this; return originalRenderSVG.apply(this, arguments); };
  function mathToSvg(point, engine) { return { x: engine.renderer.mapX(point.x), y: engine.renderer.mapY(point.y) }; }
  function removeEndpointHandles() { document.querySelectorAll("#canvas .fzi-line-endpoint-layer").forEach(function (node) { node.remove(); }); }

  function refreshEndpointHandles() {
    removeEndpointHandles();
    const svg = document.querySelector("#canvas svg"); if (!svg || !activeEngine) return;
    const selected = svg.querySelector('g.selected[data-object-type="line"]'); if (!selected) return;
    const line = activeEngine.get(selected.getAttribute("data-object-id")); if (!line) return;
    const layer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    layer.setAttribute("class", "fzi-line-endpoint-layer"); layer.setAttribute("aria-hidden", "true");
    [["x1", "y1", "start"], ["x2", "y2", "end"]].forEach(function (entry) {
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const p = mathToSvg({ x: line[entry[0]], y: line[entry[1]] }, activeEngine);
      handle.setAttribute("cx", p.x); handle.setAttribute("cy", p.y); handle.setAttribute("r", "7");
      handle.setAttribute("class", "fzi-line-endpoint"); handle.setAttribute("data-line-id", line.id); handle.setAttribute("data-endpoint", entry[2]);
      handle.setAttribute("fill", "#fff"); handle.setAttribute("stroke", "currentColor"); handle.setAttribute("stroke-width", "2");
      handle.style.cursor = "crosshair"; handle.style.pointerEvents = "all"; layer.appendChild(handle);
    });
    svg.appendChild(layer);
  }

  function setHandlePosition(line, endpoint, point) {
    const svg = document.querySelector("#canvas svg"); if (!svg) return;
    const handle = svg.querySelector('.fzi-line-endpoint[data-line-id="' + CSS.escape(line.id) + '"][data-endpoint="' + endpoint + '"]');
    const lineNode = svg.querySelector('g[data-object-id="' + CSS.escape(line.id) + '"] > line');
    if (!handle || !lineNode) return;
    const p = mathToSvg(point, activeEngine); handle.setAttribute("cx", p.x); handle.setAttribute("cy", p.y);
    if (endpoint === "start") { lineNode.setAttribute("x1", p.x); lineNode.setAttribute("y1", p.y); }
    else { lineNode.setAttribute("x2", p.x); lineNode.setAttribute("y2", p.y); }
  }

  function beginEndpointDrag(event, handle) {
    if (!activeEngine) return;
    const line = activeEngine.get(handle.getAttribute("data-line-id")); if (!line) return;
    endpointDrag = { lineId: line.id, endpoint: handle.getAttribute("data-endpoint"), original: { ...line }, resolved: null };
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.target.setPointerCapture) { try { event.target.setPointerCapture(event.pointerId); } catch (_) {} }
  }

  function moveEndpointDrag(event) {
    if (!endpointDrag || !activeEngine) return;
    const transform = MI.CoordinateTransform.forCanvas(activeEngine);
    const raw = transform && transform.screenToMath({ x: event.clientX, y: event.clientY });
    if (!raw) return;
    endpointDrag.resolved = MI.InteractionResolver.endpoint(activeEngine, endpointDrag.original, endpointDrag.endpoint, raw, { transform });
    setHandlePosition(endpointDrag.original, endpointDrag.endpoint, endpointDrag.resolved.result.point);
    MI.publishSnapResult(activeEngine, endpointDrag.resolved.result);
  }

  function endEndpointDrag() {
    if (!endpointDrag || !activeEngine) return;
    const current = endpointDrag; endpointDrag = null;
    if (current.resolved) {
      activeEngine.update(current.lineId, current.resolved.patch);
      global.dispatchEvent(new CustomEvent("fzi:geometry-changed"));
    }
    MI.publishSnapResult(activeEngine, null);
    setTimeout(refreshEndpointHandles, 0);
  }

  const canvas = document.getElementById("canvas");
  if (canvas) {
    canvas.addEventListener("pointerdown", function (event) {
      const handle = event.target.closest ? event.target.closest(".fzi-line-endpoint") : null;
      if (handle) beginEndpointDrag(event, handle);
    }, true);
    canvas.addEventListener("click", function () { setTimeout(refreshEndpointHandles, 0); });
  }

  window.addEventListener("pointermove", function (event) {
    if (endpointDrag) { moveEndpointDrag(event); return; }
    if (!activeEngine) return;
    const toolButton = document.querySelector(".tool.active");
    if (event.buttons === 1 && toolButton && toolButton.dataset.tool === "select") {
      const svg = document.querySelector("#canvas svg");
      if (svg && svg.querySelector('g.selected[data-object-type="line"]')) setTimeout(refreshEndpointHandles, 0);
    }
  });


  window.addEventListener("pointerup", function () { if (endpointDrag) endEndpointDrag(); }, true);
  document.addEventListener("click", function () { setTimeout(refreshEndpointHandles, 0); });

  MI.Engine.prototype.__fziGeometrySnapInstalled = true;
})(window);