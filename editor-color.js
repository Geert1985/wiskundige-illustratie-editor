/* From Zero 2 Infinity — safe object color control */
(function (global) {
  "use strict";

  const MI = global.FZI.MathIllustration;
  if (!MI || !MI.Engine) return;
  let activeEngine = null;
  let installed = false;

  function installEngineTracker() {
    if (installed) return;
    installed = true;
    const originalRender = MI.Engine.prototype.renderSVG;
    MI.Engine.prototype.renderSVG = function () {
      activeEngine = this;
      return originalRender.apply(this, arguments);
    };
  }

  function objectColor(object) {
    if (!object || !object.style) return "#222222";
    return object.type === "text" ? (object.style.fill || "#222222") : (object.style.stroke || object.style.fill || "#222222");
  }

  function applyColor(id, color) {
    if (!activeEngine) return;
    const object = activeEngine.get(id);
    if (!object) return;
    const style = Object.assign({}, object.style || {});
    if (object.type === "text") {
      style.fill = color;
      style.stroke = "none";
    } else if (object.type === "point") {
      style.stroke = color;
      style.fill = color;
    } else {
      style.stroke = color;
    }
    activeEngine.update(id, { style: style });
    const canvas = document.getElementById("canvas");
    if (canvas) canvas.innerHTML = activeEngine.renderSVG();
    const button = document.querySelector('[data-color-object="' + CSS.escape(id) + '"]');
    if (button) button.style.setProperty("--object-color", color);
  }

  function addColorControls() {
    const list = document.getElementById("viewList");
    if (!list) return;
    list.querySelectorAll("[data-select-object]").forEach(function (selectButton) {
      const id = selectButton.dataset.selectObject;
      const row = selectButton.parentElement;
      if (!row || row.querySelector("[data-color-object]")) return;
      const object = activeEngine && activeEngine.get(id);
      if (!object) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "color-btn";
      button.dataset.colorObject = id;
      button.title = "Kleur wijzigen";
      button.setAttribute("aria-label", "Kleur wijzigen");
      button.style.setProperty("--object-color", objectColor(object));
      button.innerHTML = '<span class="color-swatch" aria-hidden="true"></span>';
      row.insertBefore(button, row.lastElementChild);
    });
  }

  function start() {
    installEngineTracker();
    const list = document.getElementById("viewList");
    if (!list) return;
    list.addEventListener("click", function (event) {
      const button = event.target.closest("[data-color-object]");
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      const id = button.dataset.colorObject;
      const object = activeEngine && activeEngine.get(id);
      if (!object) return;
      const input = document.createElement("input");
      input.type = "color";
      input.value = /^#[0-9a-f]{6}$/i.test(objectColor(object)) ? objectColor(object) : "#222222";
      input.style.position = "fixed";
      input.style.left = "-1000px";
      input.style.top = "-1000px";
      document.body.appendChild(input);
      input.addEventListener("input", function () { applyColor(id, input.value); });
      input.addEventListener("change", function () { input.remove(); });
      input.click();
    });
    new MutationObserver(addColorControls).observe(list, { childList: true, subtree: true });
    addColorControls();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window);
