/* From Zero 2 Infinity — coordinate-system settings menu */
(function (global) {
  "use strict";

  const MI = global.FZI && global.FZI.MathIllustration;
  if (!MI || !MI.Engine || MI.Engine.prototype.__fziAxisSettingsInstalled) return;

  let activeEngine = null;
  let installed = false;

  function trackEngine() {
    if (installed) return;
    installed = true;
    const originalRenderSVG = MI.Engine.prototype.renderSVG;
    MI.Engine.prototype.renderSVG = function () {
      activeEngine = this;
      return originalRenderSVG.apply(this, arguments);
    };
  }

  function renderer() {
    return activeEngine ? activeEngine.renderer : null;
  }

  function checked(value) {
    return value ? ' checked' : '';
  }

  function menuHtml() {
    const r = renderer() || {};
    const cartesian = (r.coordinateSystem || "cartesian") === "cartesian";
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
      '<div class="axis-settings-label">Assen</div>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showXAxis"' + checked(r.showXAxis !== false) + '> <span>X-as zichtbaar</span></label>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showYAxis"' + checked(r.showYAxis !== false) + '> <span>Y-as zichtbaar</span></label>' +
      '<div class="axis-settings-label">Labels en nulpunt</div>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showAxisLabels"' + checked(r.showAxisLabels !== false) + '> <span>Aslabels en getallen</span></label>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showOrigin"' + checked(r.showOrigin !== false) + '> <span>Nulpunt (0) tonen</span></label>' +
      '<div class="axis-settings-label">Raster</div>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showGrid"' + checked(r.showGrid === true) + '> <span>Raster zichtbaar</span></label>' +
      '<div class="axis-settings-current">Automatische rasterverdeling · 1–2–5</div>' +
      '<p class="axis-settings-help">De rasterverdeling past zich automatisch aan de zoom aan. Snapping gebruikt dezelfde verdeling.</p>' +
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

  function installViewListCleanup() {
    const style = document.createElement("style");
    style.textContent = '#viewList > .view-row:has([data-view-select="grid"]) { display: none; }';
    document.head.appendChild(style);
  }

  function installOriginFix() {
    if (!MI.SvgRenderer || MI.SvgRenderer.prototype.__fziOriginFixInstalled) return;
    const originalRenderAxes = MI.SvgRenderer.prototype.renderAxes;
    MI.SvgRenderer.prototype.renderAxes = function () {
      const output = originalRenderAxes.apply(this, arguments);
      if (!this.showAxes || this.coordinateSystem !== "cartesian" || !this.showOrigin) return output;

      const b = this.bounds;
      const hasXAxis = this.showXAxis && b.yMin <= 0 && b.yMax >= 0;
      const hasYAxis = this.showYAxis && b.xMin <= 0 && b.xMax >= 0;
      if ((hasXAxis && hasYAxis) || (!hasXAxis && !hasYAxis)) return output;

      const x0 = this.mapX(0);
      const y0 = this.mapY(0);
      const origin = '<text x="' + (x0 + 7) + '" y="' + (y0 + 16) + '" fill="#666" font-size="11" font-family="Source Sans 3, sans-serif">0</text>';
      return output.replace('</g>', origin + '</g>');
    };
    MI.SvgRenderer.prototype.__fziOriginFixInstalled = true;
  }

  function start() {
    trackEngine();
    installViewListCleanup();
    installOriginFix();
    const viewList = document.getElementById("viewList");
    if (!viewList) return;

    viewList.addEventListener("click", function (event) {
      const settingsButton = event.target.closest('[data-view-select="axes"]');
      if (settingsButton) {
        event.preventDefault();
        event.stopPropagation();
        openMenu(settingsButton);
        return;
      }

      const option = event.target.closest("[data-axis-system]");
      if (option && !option.disabled) {
        if (activeEngine) activeEngine.renderer.coordinateSystem = option.dataset.axisSystem;
        refreshCanvas();
        closeMenus();
        return;
      }

      const input = event.target.closest("[data-axis-setting]");
      if (input && activeEngine) {
        const property = input.dataset.axisSetting;
        activeEngine.renderer[property] = input.checked;
        refreshCanvas();
        return;
      }
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest('[data-view-select="axes"], [data-axis-settings]')) closeMenus();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  MI.Engine.prototype.__fziAxisSettingsInstalled = true;
})(window);
