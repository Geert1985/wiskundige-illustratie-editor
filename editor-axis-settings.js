/* From Zero 2 Infinity — coordinate-system settings menu */
(function (global) {
  "use strict";

  const MI = global.FZI && global.FZI.MathIllustration;
  if (!MI || !MI.Engine || MI.Engine.prototype.__fziAxisSettingsInstalled) return;

  let activeEngine = null;
  let installed = false;
  let coordinateSystem = "cartesian";

  function trackEngine() {
    if (installed) return;
    installed = true;
    const originalRenderSVG = MI.Engine.prototype.renderSVG;
    MI.Engine.prototype.renderSVG = function () {
      activeEngine = this;
      return originalRenderSVG.apply(this, arguments);
    };
  }

  function menuHtml() {
    const cartesian = coordinateSystem === "cartesian";
    return '<div class="axis-settings" data-axis-settings>' +
      '<div class="axis-settings-title">Assenstelsel</div>' +
      '<div class="axis-settings-label">Coördinatenstelsel</div>' +
      '<div class="axis-setting-options" role="group" aria-label="Coördinatenstelsel">' +
        '<button type="button" class="axis-option' + (cartesian ? ' active' : '') + '" data-axis-system="cartesian">' +
          '<span class="axis-option-mark">' + (cartesian ? '●' : '○') + '</span> Cartesiaans' +
        '</button>' +
        '<button type="button" class="axis-option disabled" disabled title="Wordt later toegevoegd."><span class="axis-option-mark">○</span> Logaritmisch <small>binnenkort</small></button>' +
        '<button type="button" class="axis-option disabled" disabled title="Wordt later toegevoegd."><span class="axis-option-mark">○</span> Semilogaritmisch <small>binnenkort</small></button>' +
        '<button type="button" class="axis-option disabled" disabled title="Wordt later toegevoegd."><span class="axis-option-mark">○</span> Poolcoördinaten <small>binnenkort</small></button>' +
      '</div>' +
      '<div class="axis-settings-label">Rasterverdeling</div>' +
      '<div class="axis-settings-current">Automatisch · 1–2–5</div>' +
      '<p class="axis-settings-help">De rasterverdeling past zich automatisch aan de zoom aan.</p>' +
    '</div>';
  }

  function closeMenus(except) {
    document.querySelectorAll("[data-axis-settings]").forEach((menu) => {
      if (menu !== except) menu.remove();
    });
  }

  function openMenu(button) {
    const row = button.closest(".view-row");
    if (!row) return;
    const existing = row.querySelector("[data-axis-settings]");
    if (existing) {
      existing.remove();
      return;
    }
    closeMenus();
    row.insertAdjacentHTML("beforeend", menuHtml());
  }

  function refreshCanvas() {
    if (!activeEngine) return;
    const canvas = document.getElementById("canvas");
    if (canvas) canvas.innerHTML = activeEngine.renderSVG();
  }

  function start() {
    trackEngine();
    const viewList = document.getElementById("viewList");
    if (!viewList) return;

    viewList.addEventListener("click", function (event) {
      const settingsButton = event.target.closest("[data-view-select=\"axes\"]");
      if (settingsButton) {
        event.preventDefault();
        event.stopPropagation();
        openMenu(settingsButton);
        return;
      }

      const option = event.target.closest("[data-axis-system]");
      if (!option || option.disabled) return;
      coordinateSystem = option.dataset.axisSystem;
      if (activeEngine) activeEngine.renderer.coordinateSystem = coordinateSystem;
      refreshCanvas();
      closeMenus();
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-view-select=\"axes\"], [data-axis-settings]")) closeMenus();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  MI.Engine.prototype.__fziAxisSettingsInstalled = true;
})(window);
