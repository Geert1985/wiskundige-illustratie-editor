/* From Zero 2 Infinity — adaptive mathematical grid */
(function (global) {
  "use strict";

  const MI = global.FZI && global.FZI.MathIllustration;
  if (!MI || !MI.Engine || MI.Engine.prototype.__fziAdaptiveGridInstalled) return;

  const TARGET_SCREEN_SPACING = 70;
  const MIN_GRID_STEP = 0.1;
  const MAX_ZOOM_SCALE = TARGET_SCREEN_SPACING / MIN_GRID_STEP;

  function adaptiveGridStep(renderer) {
    if (!renderer || !Number.isFinite(renderer.scale()) || renderer.scale() <= 0) return 1;

    const rawStep = TARGET_SCREEN_SPACING / renderer.scale();
    const exponent = Math.floor(Math.log10(rawStep));
    const magnitude = Math.pow(10, exponent);
    const normalized = rawStep / magnitude;
    let nice;

    if (normalized <= 1) nice = 1;
    else if (normalized <= 2) nice = 2;
    else if (normalized <= 5) nice = 5;
    else nice = 10;

    return Math.max(MIN_GRID_STEP, nice * magnitude);
  }

  MI.adaptiveGridStep = adaptiveGridStep;
  MI.adaptiveGridMinStep = MIN_GRID_STEP;
  MI.adaptiveGridMaxScale = MAX_ZOOM_SCALE;

  const originalRenderSVG = MI.Engine.prototype.renderSVG;
  MI.Engine.prototype.renderSVG = function () {
    this.renderer.axisStep = adaptiveGridStep(this.renderer);
    return originalRenderSVG.apply(this, arguments);
  };

  // Stop zooming in once the finest intended educational grid is reached.
  // We do this in the capture phase so the editor's normal wheel handler
  // never receives a blocked zoom event.
  function installZoomLimit() {
    const canvasWrap = document.getElementById("canvasWrap");
    if (!canvasWrap) return;
    canvasWrap.addEventListener("wheel", function (event) {
      if (!global.FZI || !global.FZI.MathIllustration) return;
      const engine = global.FZI.MathIllustration.__adaptiveGridEngine;
      if (!engine || event.deltaY >= 0) return;
      if (engine.renderer.scale() >= MAX_ZOOM_SCALE * 0.999 || adaptiveGridStep(engine.renderer) <= MIN_GRID_STEP) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const status = document.getElementById("status");
        if (status) status.textContent = "Maximale zoom bereikt (raster: 0,1).";
      }
    }, true);
  }

  const originalRenderTracker = MI.Engine.prototype.renderSVG;
  MI.Engine.prototype.renderSVG = function () {
    MI.adaptiveGridEngine = this;
    MI.Engine.prototype.__fziAdaptiveGridActiveEngine = this;
    return originalRenderTracker.apply(this, arguments);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installZoomLimit);
  else installZoomLimit();

  MI.Engine.prototype.__fziAdaptiveGridInstalled = true;
})(window);
