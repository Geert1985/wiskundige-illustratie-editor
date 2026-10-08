/* Label offset interpretation; pointer lifecycle belongs to EditorApp. */
(function(global) {
  global.FZI.MathIllustration.LabelOffsets = {
    read(object, renderer) {
      const scale = renderer.scale(), offset = global.FZI.MathIllustration.LinearGeometry.isLinear(object) || object.type === "text" ? 6 : 8;
      return {
        x: object.labelOffsetX != null ? object.labelOffsetX : (object.labelDx == null ? offset : object.labelDx) / scale,
        y: object.labelOffsetY != null ? object.labelOffsetY : -(object.labelDy == null ? -offset : object.labelDy) / scale
      };
    }
  };
})(window);
