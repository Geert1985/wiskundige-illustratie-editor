/* Shared presentation constants for the rich-text editor; document values remain SVG px. */
(function(global) {
  const MI = global.FZI.MathIllustration;
  const pointsToSvgPixels = points => points * 96 / 72;
  const fontSizes = Object.freeze([
    Object.freeze({ id: "small", label: "Klein", points: 12, pixels: pointsToSvgPixels(12) }),
    Object.freeze({ id: "normal", label: "Normaal", points: 16, pixels: pointsToSvgPixels(16) }),
    Object.freeze({ id: "large", label: "Groot", points: 20, pixels: pointsToSvgPixels(20) }),
    Object.freeze({ id: "title", label: "Titel", points: 28, pixels: pointsToSvgPixels(28) })
  ]);
  const number = value => new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 2 }).format(value);
  const pointLabel = pixels => `${number(pixels * 72 / 96)} pt`;
  MI.TextEditorUX = Object.freeze({ fontSizes, pointLabel });
})(window);
