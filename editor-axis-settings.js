/* Pure axis UI; engine and rendering belong to EditorApp. */
(function(global){
 const MI=global.FZI.MathIllustration;
 function eye(visible){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.7"/>'+(visible?'':'<path d="M3 3l18 18"/>')+'</svg>';}
 function toggle(key,label,value,view){return '<div class="axis-visibility-row"><span>'+label+'</span><button type="button" class="eye-btn" data-axis-setting="'+key+'"'+(view?' data-view="'+view+'"':'')+' aria-label="'+label+'" title="'+label+' tonen/verbergen" aria-pressed="'+value+'">'+eye(value)+'</button></div>';}
 function menuHtml(renderer,{adaptive=true}={}){const r=renderer||{};return '<div class="axis-settings" data-axis-settings><div class="axis-settings-title"><span>Assenstelsel</span>'+toggle('showAxes','Assenstelsel zichtbaar',r.showAxes!==false,'axes')+'</div>'+
 '<label>Co&#246;rdinatenstelsel<select id="coordinateSystem" aria-label="Co&#246;rdinatenstelsel"><option value="cartesian">Cartesiaans</option><option disabled>Logaritmisch - nog niet beschikbaar</option><option disabled>Semilogaritmisch - nog niet beschikbaar</option><option disabled>Poolco&#246;rdinaten - nog niet beschikbaar</option></select></label>'+
 '<details data-property-section="axes" open><summary>Assen en raster</summary>'+toggle('showXAxis','X-as',r.showXAxis!==false)+toggle('showYAxis','Y-as',r.showYAxis!==false)+toggle('showGrid','Raster',r.showGrid===true,'grid')+toggle('showMinorGrid','Kleinere rasterverdeling',r.showMinorGrid===true)+
 '<div class="axis-settings-label">Labels en nulpunt</div>'+toggle('showAxisLabels','Aslabels en getallen',r.showAxisLabels!==false)+toggle('showOrigin','Nulpunt (0)',r.showOrigin!==false)+
 '</details><details data-property-section="grid" open><summary>Schaalverdeling</summary><div class="axis-settings-current">'+(r.axisStep!=null?'Stap: '+MI.escapeXml(r.axisStep)+' &middot; ':'')+'Rasterverdeling</div><p class="axis-settings-help">'+(adaptive?'De rasterverdeling past zich automatisch aan de zoom aan.':'De sessie gebruikt de ingestelde documentverdeling.')+' Snapping gebruikt de hoofdverdeling. Het kleinere raster verdeelt elke stap in vijf delen en wordt bij een te dichte weergave weggelaten.</p></details></div>';}
 MI.AxisSettings={html:menuHtml};
})(window);
