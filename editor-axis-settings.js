/* Pure axis UI; engine and rendering belong to EditorApp. */
(function(global) {
  const MI = global.FZI.MathIllustration;
  function checked(value) {
    return value ? ' checked' : '';
  }

  function menuHtml(renderer) {
    const r = renderer || {};
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


  MI.AxisSettings = { html: menuHtml };
})(window);
