/* Pure axis UI; engine and rendering belong to EditorApp. */
(function(global) {
  const MI = global.FZI.MathIllustration;
  function checked(value) {
    return value ? ' checked' : '';
  }

  function menuHtml(renderer,{adaptive=true}={}) {
    const r = renderer || {};

    return '<div class="axis-settings" data-axis-settings>' +
      '<div class="axis-settings-title">Assenstelsel</div>' +
      '<label>Coördinatenstelsel<select id="coordinateSystem" aria-label="Coördinatenstelsel"><option value="cartesian">Cartesiaans</option><option disabled>Logaritmisch - nog niet beschikbaar</option><option disabled>Semilogaritmisch - nog niet beschikbaar</option><option disabled>Poolcoördinaten - nog niet beschikbaar</option></select></label>' +
      '<details data-property-section="axes" open><summary>Assen en oorsprong</summary>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showXAxis"' + checked(r.showXAxis !== false) + '> <span>X-as zichtbaar</span></label>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showYAxis"' + checked(r.showYAxis !== false) + '> <span>Y-as zichtbaar</span></label>' +
      '<div class="axis-settings-label">Labels en nulpunt</div>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showAxisLabels"' + checked(r.showAxisLabels !== false) + '> <span>Aslabels en getallen</span></label>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showOrigin"' + checked(r.showOrigin !== false) + '> <span>Nulpunt (0) tonen</span></label>' +
      '</details><details data-property-section="grid" open><summary>Raster en schaalverdeling</summary>' +
      '<label class="axis-setting-toggle"><input type="checkbox" data-axis-setting="showGrid"' + checked(r.showGrid === true) + '> <span>Raster zichtbaar</span></label>' +
      '<div class="axis-settings-current">'+(r.axisStep!=null?'Stap: '+MI.escapeXml(r.axisStep)+' · ':'')+'Rasterverdeling</div>' +
      '<p class="axis-settings-help">'+(adaptive?'De rasterverdeling past zich automatisch aan de zoom aan.':'De sessie gebruikt de ingestelde documentverdeling.')+' Snapping gebruikt dezelfde verdeling.</p>' +
    '</details></div>';
  }


  MI.AxisSettings = { html: menuHtml };
})(window);
