# WIE — UI-RADIAL-11 Buitenste segmenten

**Versie:** 1.0.0  
**Datum:** 2026-10-15  
**Branch:** `WIE/Radiaalmenu`  
**Status:** Implementatie gepusht; gerichte codecontrole geslaagd; volledige editor- en Edge-regressie nog te draaien.

## Scope en ontwerpbeslissingen

- Uitsluitend de zes buitenste SVG-segmenten vernieuwen in overeenstemming met de goedgekeurde marineblauwe/gouden referentie.
- De bestaande `renderWheel()`-architectuur behouden: één gedeelde SVG-contour, zes rotaties van 60°, en een onafhankelijke tegenrotatie van iconen/labels.
- Eén gesloten Bézier-contour (`SEGMENT_SHAPE`), één verzonken binnencontour (`SEGMENT_INSET`) en één discrete bovenlichtlijn (`SEGMENT_SHEEN`) voor alle categorieën.
- Per segment een unieke SVG `linearGradient` voor marineblauwe oppervlaktekleur en gouden rand. Unieke ID's voorkomen interferentie van paint servers.
- Hover, keyboard-focus en `aria-pressed` wijzigen uitsluitend de SVG-oppervlakte, accentuering en schaduw; de categorie-acties en eigenlijke klikoppervlakken blijven HTML `button`-elementen.
- De goedgekeurde centrale cirkel (naamveld, labelknop, vergrendelknop, sleepgreep), de contextacties, documentmutaties, model en renderer zijn niet gewijzigd.

## Aangepaste code

- `editor-radial-properties.js`: SVG-contouren, per-knop defs, silhouette, binnencontour en lichtlijn.
- `editor.css`: SVG-gradient stops, gouden accentrand, schaduwen en uniforme iconen en tekst.
- `editor.html`: cacheversies `radialmenu-3`.
- `tests/radial-petals.test.cjs`: uniforme contouren en unieke gradient-ID's, behoud van HTML-knoppen.
- `tests/browser-radial-menu.cjs`: extra controles op contouren, zichtbare gradients, hover en geselecteerde toestand.

## Verificatie

1. Twee codegerichte tests geslaagd op exact de branchbestanden via een gemockte DOM-/Node-omgeving.
2. Een geïsoleerde Chromium-preview met dezelfde gedeelde segmentgeometrie, SVG-kleurverlopen en CSS-toestanden werd visueel gecontroleerd. Hover verandert aantoonbaar de SVG-gradientstops.
3. **Niet uitgevoerd:** `npm test`, de echte volledige-editor-browsertest en `npm run test:edge`. De geslaagde controles mogen niet als een volledige regressiecertificatie worden beschouwd.

## Handmatige acceptatie

1. Open het radiaalmenu bij een punt, cirkel, lijn, afhankelijke constructie, tekst en meervoudige selectie. Alle zes segmenten volgen dezelfde contour en hebben gelijkmatige tussenruimten.
2. Vergelijk de buitenste segmenten met de goedgekeurde ontwerpafbeelding op de werkelijk getoonde menuschaal.
3. Hover en toetsenbordfocus moeten duidelijk maar niet overdreven oplichten; geselecteerde categorie blijft herkenbaar.
4. Open elke categorie en controleer dat de bestaande detailpanelen werken.
5. Controleer de centrale cirkel op regressies, inclusief label tonen/verbergen, positievergrendeling en slepen.
6. Controleer een klein browservenster en volledig-schermmodus.
7. Draai `npm test` en `npm run test:edge` voordat de branch naar `main` gaat.
