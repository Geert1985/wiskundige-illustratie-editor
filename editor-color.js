/* Pure color operations; no DOM ownership or engine discovery. */
(function(global) {
  const MI = global.FZI.MathIllustration;
  MI.EditorColor = {
    value(object) { return object.type === "text" ? object.style.fill || "#222222" : object.style.stroke || object.style.fill || "#222222"; },
    patch(object, color) {
      const style = { ...object.style };
      if (object.type === "text") { style.fill = color; style.stroke = "none"; }
      else { style.stroke = color; if (object.type === "point") style.fill = color; }
      return { style };
    }
  };
})(window);
