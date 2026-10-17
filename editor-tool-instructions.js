/* Tool guidance content and instruction-panel presentation. */
(function (global) {
  "use strict";
  const MI = global.FZI.MathIllustration;
  const definitions = {
    point: ['Klik op het werkvlak om een punt te plaatsen.'],
    text: ['Klik waar de tekst moet komen.', 'Voer de tekst in en bevestig met Toevoegen.'],
    line: ['Druk op de beginpositie.', 'Sleep naar de eindpositie en laat los. Dit is een vrij lijnstuk zonder losse eindpuntobjecten. Typ eventueel een exacte lengte.'],
    straight: ['Druk op een punt van de rechte.', 'Sleep naar een tweede punt en laat los.'],
    ray: ['Druk op het beginpunt en sleep in de richting van de halfrechte. Alleen het beginpunt wordt als Punt-object aangemaakt.'],
    vector: ['Druk op de staart van de vector.', 'Sleep naar de pijlpunt en laat los.'],
    circle: ['Druk op het middelpunt.', 'Sleep voor de straal en laat los. Typ eventueel een exacte straal.'],
    dimension: ['Druk op het eerste meetpunt.', 'Sleep naar het tweede meetpunt en laat los.'],
    triangle: ['Klik het eerste hoekpunt.', 'Klik het tweede hoekpunt.', 'Klik het derde hoekpunt om af te sluiten.'],
    polygon: ['Klik het eerste hoekpunt.', 'Klik het volgende hoekpunt. Vanaf drie punten: Enter of klik het beginpunt om af te sluiten. Backspace verwijdert het laatste punt.'],
    'construct:anglePoints': ['Kies een bestaand punt op de eerste arm.', 'Kies het bestaande hoekpunt.', 'Kies een bestaand punt op de tweede arm.'],
    'construct:angleDirections': ['Klik op de eerste hoekarm, aan de gewenste kant van het snijpunt, of kies een as.', 'Klik op de tweede hoekarm, aan de gewenste kant van het snijpunt, of kies een as.'],
    'construct:angleXAxis': ['Kies de richting voor de hoek van de positieve x-as naar deze richting.'],
    angle: ['Klik een punt op de eerste arm.', 'Klik het hoekpunt.', 'Klik een punt op de tweede arm.'],
    rightAngle: ['Klik een punt op de eerste arm.', 'Klik het hoekpunt.', 'Klik een punt op de tweede arm voor de rechtehoekmarkering.'],
    'construct:circleByCenterPoint': ['Kies een bestaand punt als middelpunt.', 'Kies een tweede bestaand punt op de cirkel. De cirkel blijft beide punten volgen.'],
    'construct:ellipseByFociAndSum': ['Alleen voor bestaande documenten: de historische ellips gebruikt twee brandpunten en een bewerkbare afstandsom S.'],
    'construct:ellipseByFociAndPoint': ['Kies het eerste bestaande brandpunt.', 'Kies het tweede bestaande brandpunt.', 'Kies een bestaand punt als Q of klik vrij om Q en de ellips samen te maken. Q blijft de ellips besturen.'],
    'construct:pointOnEllipse': ['Kies een bestaande, geldige ellips.', 'Klik nabij de contour om het afhankelijke punt te plaatsen. Escape annuleert.'],
    'construct:circleCircleIntersection': ['Kies de eerste cirkel.', 'Kies de tweede cirkel. Kruisende cirkels geven twee punten, raakcontact een; samenvallende cirkels hebben geen uniek snijpunt.'],
    'construct:intersection': ['Kies een lijn, veelhoekzijde of cirkel.', 'Kies een tweede bron en selecteer daarna de gewenste snijpunten.'],
    'construct:lineCircleIntersection': ['Kies een lijn, halfrechte, lijnstuk of veelhoekzijde.', 'Kies de cirkel. Alle bereikbare snijpunten worden toegevoegd; bij raakcontact is er een punt.'],
    'construct:lineIntersection': ['Kies de eerste lijn of veelhoekzijde.', 'Kies de tweede lijn of zijde. Alleen een uniek snijpunt binnen beide objecten is mogelijk.'],
    'construct:lineBetweenPoints': ['Selecteer het eerste punt.', 'Selecteer het tweede punt.'],
    'construct:rayOrigin': ['Kies de halfrechte waarvan het beginpunt als punt wordt weergegeven.'],
    'construct:pointOnSegment': ['Klik op een lijnstuk of veelhoekzijde waar het gekoppelde punt moet komen.'],
    'construct:pointOnCircle': ['Klik op de cirkel waar het gekoppelde punt moet komen.'],
    'construct:distributedPointOnCircle': ['Internal recipe for a point in a canonical circle distribution.'],
    'construct:midpoint': ['Kies het eerste punt, of klik een lijnstuk of zijde om meteen het middenpunt te maken.', 'Kies het tweede punt.'],
    'construct:centroid': ['Klik een driehoek voor het zwaartepunt.'],
    'construct:circumcenter': ['Klik een driehoek voor het middelpunt van de omgeschreven cirkel.'],
    'construct:orthocenter': ['Klik een driehoek voor het hoogtepunt.'],
    'construct:incenter': ['Klik een driehoek voor het incentrum.'],
    'construct:incircle': ['Klik een driehoek voor de ingeschreven cirkel.'],
    'construct:eulerLine': ['Klik een driehoek voor de Eulerrechte. Bij een gelijkzijdige driehoek is de Eulerrechte niet uniek.'],
    'construct:ninePointCircle': ['Klik een driehoek voor de negenpuntscirkel.'],
    'construct:triangleFromPoints': ['Selecteer het eerste bestaande punt (A).', 'Selecteer het tweede bestaande punt (B).', 'Selecteer het derde bestaande punt (C).'],
    'construct:parallelogramBySideAngle': ['Selecteer het eerste bestaande punt (A).','Selecteer het tweede bestaande punt (B).','Beweeg naar Q om de preview te plaatsen, of voer exact AD en de gerichte hoek in. Bevestig met de knop of klik.'],
    'construct:polygonRegion': ['Klik op een bestaande eenvoudige veelhoek om er een dynamisch gebied van te maken.'],
    'construct:circleSectorRegion': ['Kies een bestaande cirkel en de gewenste gebiedsmodus.', 'Kies richtingpunt A (beginarm).', 'Kies richtingpunt B (eindarm). Gericht volgt A naar B in tegenwijzerzin.'],
    'construct:circleSegmentRegion': ['Kies een bestaande cirkel en de gewenste gebiedsmodus.', 'Kies richtingpunt A (begin van de boog).', 'Kies richtingpunt B (einde van de boog). Gericht volgt A naar B in tegenwijzerzin.'],
    'construct:perpendicularBisector': ['Kies het eerste punt, of klik een lijnstuk of zijde om meteen de middelloodlijn te maken.', 'Kies het tweede punt.'],
    'construct:parallel': ['Kies een rechte, lijnstuk, halfrechte, vector of veelhoekzijde.', 'Kies het punt waar de evenwijdige rechte doorheen gaat.'],
    'construct:perpendicular': ['Kies een rechte, lijnstuk, halfrechte, vector of veelhoekzijde.', 'Kies het punt waar de loodlijn doorheen gaat.'],
    'construct:bisector': ['Kies een punt op de eerste arm, of klik een bestaande hoek of veelhoekhoekpunt om meteen de bissectrice te maken.', 'Kies het hoekpunt waar de armen samenkomen.', 'Kies een punt op de tweede arm.'],
    'construct:tangent': ['Kies een cirkel.', 'Kies een bestaand punt op deze cirkel, ook een gekoppeld Punt op cirkel. Buiten de cirkel geeft twee raaklijnen, op de cirkel één, binnen de cirkel geen reële raaklijn.'],
    'construct:area': ['Klik een cirkel of veelhoek voor de oppervlakte.'],
    'construct:perimeter': ['Klik een cirkel of veelhoek voor de omtrek.']
  };
  Object.values(definitions).forEach(Object.freeze);
  Object.freeze(definitions);

  function describe(tool, state, pendingText = false) {
    const definition = definitions[tool];
    if (!definition) return null;
    let index = state?.mode === 'construction' ? state.sources.length : state?.mode === 'polygon' ? state.vertices.length : state?.mode === 'draw' ? 1 : tool === 'text' && pendingText ? 1 : 0;
    const variable = tool === 'polygon', steps = variable ? Array.from({ length: index + 1 }, (_, i) => i === 0 ? definition[0] : definition[1]) : definition;
    index = Math.min(index, steps.length - 1);
    return { steps, index, total: variable ? null : steps.length };
  }
  function toolHint(tool) {
    return ({ point: 'Klik op het werkvlak om een punt te plaatsen.', line: 'Sleep voor een vrij lijnstuk zonder losse eindpuntobjecten. Typ voor een exacte lengte.', straight: 'Sleep tussen twee punten voor een rechte.', ray: 'Sleep vanaf het beginpunt in de richting van de halfrechte; alleen het beginpunt is een Punt-object.', vector: 'Sleep van staart naar pijlpunt voor een vector.', circle: 'Klik het middelpunt en sleep voor de straal. Typ voor een exacte straal.', triangle: 'Klik drie hoekpunten. Escape annuleert.', polygon: 'Klik de hoekpunten; Enter sluit af, Backspace verwijdert het laatste punt, Escape annuleert.', dimension: 'Sleep tussen twee punten om de lengte te meten.', angle: 'Klik arm, hoekpunt en tweede arm voor een hoek.', rightAngle: 'Klik arm, hoekpunt en tweede arm voor een rechte hoek.', text: 'Klik op het werkvlak en voer de tekst in.', select: 'Selecteer een object of het assenstelsel.' })[tool] || '';
  }
  function constructionHint(kind, index = 0) {
    if(kind==='parallelogramBySideAngle')return ['Selecteer punt A.','Selecteer punt B.','Plaats Q voor de preview of voer exact zijde AD en de gerichte hoek in.'][Math.min(index,2)];
    if(kind==='ellipseByFociAndPoint')return ['Kies het eerste brandpunt.','Kies het tweede brandpunt.','Kies een bestaand besturingspunt Q of plaats Q vrij.'][Math.min(index,2)];
    if(kind==='pointOnEllipse')return index===0?'Kies een bestaande, geldige ellips.':'Klik nabij de ellipscontour om het afhankelijke punt te plaatsen.';
    if(kind==='intersection')return index===0?'Kies een lijn, veelhoekzijde of cirkel.':'Kies een tweede bron.';
    return ({ anglePoints: ['Kies de eerste armbron.', 'Kies het hoekpunt.', 'Kies de tweede armbron.'][index], angleDirections: index ? 'Kies de tweede richting.' : 'Kies de eerste richting (begin naar einde).', angleXAxis: 'Kies de richting tegenover de positieve x-as.', circleByCenterPoint: index ? 'Kies het punt op de cirkel.' : 'Kies het middelpunt.', circleCircleIntersection: index ? 'Kies de tweede cirkel.' : 'Kies de eerste cirkel.', intersection: index===0?'Kies een lijn, veelhoekzijde of cirkel.':index===1?'Kies een tweede bron.':'Selecteer de gewenste snijpunten en bevestig.', lineCircleIntersection: index ? 'Kies de cirkel.' : 'Kies een lijn of veelhoekzijde.', lineIntersection: index ? 'Kies de tweede lijn of zijde.' : 'Kies de eerste lijn of zijde.', lineBetweenPoints: index ? 'Selecteer het tweede punt.' : 'Selecteer het eerste punt.', polygonRegion: 'Klik op een bestaande veelhoek.', circleSectorRegion: index===0?'Kies de cirkel.':index===1?'Kies het eerste richtingpunt.':'Kies het tweede richtingpunt; Shift kiest de majorsector.', circleSegmentRegion: index===0?'Kies de cirkel.':index===1?'Kies het eerste richtingpunt.':'Kies het tweede richtingpunt; Shift kiest het majorsegment.', centroid: 'Klik een driehoek voor het zwaartepunt.', circumcenter: 'Klik een driehoek voor het middelpunt van de omgeschreven cirkel.', orthocenter: 'Klik een driehoek voor het hoogtepunt.', triangleFromPoints: ['Selecteer het eerste bestaande punt (A).', 'Selecteer het tweede bestaande punt (B).', 'Selecteer het derde bestaande punt (C).'][index], rayOrigin: 'Kies de halfrechte waarvan het beginpunt als punt wordt weergegeven.', pointOnSegment: 'Klik een lijnstuk of veelhoekzijde voor een gekoppeld punt.', pointOnCircle: 'Klik op een cirkel voor een gekoppeld punt.', distributedPointOnCircle: 'Internal point within a circle distribution.', area: 'Klik een cirkel, driehoek of veelhoek voor de oppervlakte.', perimeter: 'Klik een cirkel, driehoek of veelhoek voor de omtrek.', midpoint: 'Middenpunt: kies twee punten, of klik een lijnstuk.', perpendicularBisector: 'Middelloodlijn: kies twee punten, of klik een lijnstuk.', parallel: index ? 'Kies het punt waar de evenwijdige rechte doorheen gaat.' : 'Kies een lijn of zijde.', perpendicular: index ? 'Kies het punt waar de loodlijn doorheen gaat.' : 'Kies een lijn of zijde.', bisector: ['Bissectrice: klik een bestaande hoek of een veelhoekhoekpunt, of kies een bestaand punt op de eerste arm.', 'Kies nu het hoekpunt (waar beide armen samenkomen).', 'Kies nu een bestaand punt op de tweede arm.'][index], tangent: index ? 'Kies een punt op of buiten de cirkel.' : 'Kies een cirkel.' })[kind];
  }
  function extentControl(extent,attribute,kind) {
    const options=[['directed',kind==='circleSegmentRegion'?'Gerichte segmentboog':'Gerichte sector'],['minor','Altijd kleinste gebied'],['major','Altijd grootste gebied']];
    return '<label>Gebiedsmodus<select '+attribute+'>'+options.map(([value,label])=>'<option value="'+value+'"'+(extent===value?' selected':'')+'>'+label+'</option>').join('')+'</select></label>';
  }
  function render(app) {
    const guide = describe(app.tool, app.interaction, !!app.pendingText), esc = MI.escapeXml;
    let html = guide ? '<div class="tool-step-counter">Stap ' + (guide.index + 1) + (guide.total ? ' van ' + guide.total : ' - veelhoek') + '</div><ol>' + guide.steps.map((text, i) => '<li' + (i === guide.index ? ' aria-current="step" class="active-step"' : i < guide.index ? ' class="completed-step"' : '') + '><span aria-hidden="true">' + (i < guide.index ? '&#10003;' : i + 1) + '</span> ' + esc(text) + '</li>').join('') + '</ol><p class="tool-cancel-help">Escape annuleert; kies een ander gereedschap om te wisselen.</p>' + ((app.instructionMessage && app.instructionMessage !== toolHint(app.tool) && app.instructionMessage !== constructionHint(app.tool.slice(10), app.interaction?.sources?.length || 0)) ? '<p class="tool-message">' + esc(app.instructionMessage) + '</p>' : '') : '';
    if(guide&&['construct:circleSectorRegion','construct:circleSegmentRegion'].includes(app.tool))html+=extentControl(app.regionExtent||'directed','data-region-create-extent',app.tool.slice(10));
    if(guide&&app.interaction?.parallelogramPlacement){const s=app.interaction,u=app.interaction.angleUnit||'deg',angle=Number.isFinite(s.signedAngle)?(u==='rad'?s.signedAngle:s.signedAngle*180/Math.PI):s.angleInput||'',side=Number.isFinite(s.matchAB?s.previewSideLength:s.sideLength)?(s.matchAB?s.previewSideLength:s.sideLength)*(s.lengthScale||1):s.sideInput||'',escValue=v=>esc(String(v));html+='<div class="parallelogram-placement" data-parallelogram-placement><label>Zijde AD ('+esc(s.lengthUnit||'e')+')<input type="number" step="any" data-parallelogram-param="sideLength" value="'+escValue(side)+'" aria-label="Zijde AD"'+(s.matchAB?' disabled':'')+'></label><label class="parallelogram-match-ab"><input type="checkbox" data-parallelogram-match-ab'+(s.matchAB?' checked':'')+'> Gelijke zijden behouden</label><label>Gerichte hoek θ ('+esc(u==='rad'?'rad':'°')+')<input type="number" step="any" data-parallelogram-param="signedAngle" value="'+escValue(angle)+'" aria-label="Gerichte hoek theta"></label><p data-parallelogram-status>'+esc(s.previewReason||'Beweeg de aanwijzer om te plaatsen.')+'</p><button type="button" data-parallelogram-confirm'+(!s.previewValid?' disabled':'')+'>Parallellogram maken</button></div>';}
    if(guide&&app.tool==='construct:intersection'){
      const s=app.interaction||{},name=ref=>{if(MI.AxisReferences.isAxis(ref))return 'as '+ref.axis;const object=app.engine.get(ref.objectId);return (object?.name||object?.type||'object')+(ref.part==='edge'?' · zijde '+(Number(ref.index)+1):'');};
      if(s.pendingSourceOptions?.length)html+='<div class="intersection-source-choices" role="group" aria-label="Bron kiezen">'+s.pendingSourceOptions.map((ref,index)=>'<button type="button" data-intersection-source="'+index+'">'+esc(name(ref))+'</button>').join('')+'</div>';
      if(s.intersectionPreview){const selected=new Set(s.selectedBranches||[]);html+='<div class="intersection-candidates" role="group" aria-label="Snijpunten selecteren">'+s.candidates.map(item=>{const branch=item.branch??0,label='('+Number(item.x.toPrecision(5))+', '+Number(item.y.toPrecision(5))+')';return '<button type="button" data-intersection-branch="'+branch+'" aria-pressed="'+selected.has(branch)+'">'+(selected.has(branch)?'✓ ':'')+'Snijpunt '+(branch+1)+': '+esc(label)+'</button>';}).join('')+'</div><p role="status" aria-live="polite">'+(s.candidates.length?selected.size+' van '+s.candidates.length+' geselecteerd.':'Geen geldige snijpunten gevonden.')+'</p><button type="button" data-intersection-confirm'+(!selected.size?' disabled':'')+'>Geselecteerde snijpunten maken</button>';}
    }
    const node = app.nodes.toolInstructions;
    if (node) { node.hidden = !guide; if (node.innerHTML !== html) node.innerHTML = html; }
    if (app.nodes.fullscreenHint) { const hint = guide ? html : esc(app.nodes.status.textContent); if (app.nodes.fullscreenHint.innerHTML !== hint) app.nodes.fullscreenHint.innerHTML = hint; }
  }

  MI.ToolInstructions = Object.freeze({ definitions, describe, toolHint, constructionHint, render, extentControl });
})(window);
