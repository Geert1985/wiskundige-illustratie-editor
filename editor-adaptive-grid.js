/* From Zero 2 Infinity — adaptive mathematical grid */
(function (global) {
  "use strict";

  const MI = global.FZI && global.FZI.MathIllustration;
  if (!MI) return;

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

    if (normalized <= 1 + 1e-12) nice = 1;
    else if (normalized <= 2 + 1e-12) nice = 2;
    else if (normalized <= 5 + 1e-12) nice = 5;
    else nice = 10;

    return Math.max(MIN_GRID_STEP, nice * magnitude);
  }

  MI.adaptiveGridStep = adaptiveGridStep;
  MI.adaptiveGridMinStep = MIN_GRID_STEP;
  MI.adaptiveGridMaxScale = MAX_ZOOM_SCALE;


})(window);
