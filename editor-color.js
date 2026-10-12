/* Pure color operations; no DOM ownership or engine discovery. */
(function(global) {
  const MI = global.FZI.MathIllustration;
  const palette = Object.freeze([
    Object.freeze({ value: "#222222", label: "Zwart" }),
    Object.freeze({ value: "#e63946", label: "Rood" }),
    Object.freeze({ value: "#f4a261", label: "Oranje" }),
    Object.freeze({ value: "#e9c46a", label: "Geel" }),
    Object.freeze({ value: "#2a9d8f", label: "Groen" }),
    Object.freeze({ value: "#457b9d", label: "Blauw" }),
    Object.freeze({ value: "#8b5cf6", label: "Paars" })
  ]);
  function renderPalette(container, { buttonClass = "", groupLabel = "Kleuren" } = {}) {
    if (!container || typeof container.replaceChildren !== "function") return;
    const noFill = container.querySelector("#colorNone");
    container.replaceChildren();
    container.setAttribute("role", "group");
    container.setAttribute("aria-label", groupLabel);
    if (noFill) container.append(noFill);
    for (const color of palette) {
      const button = container.ownerDocument.createElement("button");
      button.type = "button";
      button.dataset.color = color.value;
      button.setAttribute("aria-label", color.label);
      button.setAttribute("title", color.label);
      if (buttonClass) button.className = buttonClass;
      const swatch = container.ownerDocument.createElement("span");
      swatch.className = "palette-swatch";
      swatch.style.backgroundColor = color.value;
      swatch.setAttribute("aria-hidden", "true");
      button.append(swatch);
      container.append(button);
    }
  }
  MI.EditorColor = {
    palette,
    renderPalette,
    value(object) { return object.type === "text" ? object.style.fill || "#222222" : object.style.stroke || object.style.fill || "#222222"; },
    patch(object, color) {
      const style = { ...object.style };
      if (object.type === "text") { style.fill = color; style.stroke = "none"; }
      else { style.stroke = color; if (object.type === "point") style.fill = color; }
      return { style };
    }
  };
})(window);
