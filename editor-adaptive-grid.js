/* From Zero 2 Infinity — adaptive mathematical grid */
(function (global) {
  "use strict";

  const MI = global.FZI && global.FZI.MathIllustration;
  if (!MI || !MI.Engine || MI.Engine.prototype.__fziAdaptiveGridInstalled) return;

  const TARGET_SCREEN_SPACING = 70;

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

    return nice * magnitude;
  }

  MI.adaptiveGridStep = adaptiveGridStep;

  const originalRenderSVG = MI.Engine.prototype.renderSVG;
  MI.Engine.prototype.renderSVG = function () {
    this.renderer.axisStep = adaptiveGridStep(this.renderer);
    return originalRenderSVG.apply(this, arguments);
  };

  MI.Engine.prototype.__fziAdaptiveGridInstalled = true;
})(window);
