# M2c — Assen, raster en compacte objectbediening

Datum: 9 oktober 2026. Branch: chatgpt/math-illustration-stabilization. Uitgangspunt: dea823474d28d9215e345ba86f64df70f0e49339.

## Geleverde wijzigingen

- Assenstelsel is een icoon in de canvaswerkbalk. Selecteren van de configuratie wijzigt geen zichtbaarheid. Weergave en de rasterrij zijn verwijderd uit de linkerzijbalk.
- Naast Assenstelsel staat een oogicoon. X-as, Y-as, raster, kleinere rasterverdeling, labels/getallen en nulpunt hebben eveneens oogknoppen met aria-pressed en tooltips.
- Assen en oorsprong heet Assen en raster; de rasteropties staan in dezelfde sectie. Schaalverdeling behoudt de bestaande adaptieve stapinformatie.
- Kleinere rasterverdeling verdeelt de hoofdstap in vijf delen. Hoofdlijnen worden niet dubbel getekend. Snapping, assen en transformaties gebruiken de ongewijzigde hoofdstap.
- De fijne lijnen worden niet getekend wanneer er meer dan 1000 kandidaatposities per as zijn of hun SVG-afstand kleiner dan 2 eenheden is. De bestaande harde grenzen op hoofdverdeling blijven behouden.
- Kaderselectie en Pannen zijn verwijderd uit de werkbalk. Rechtermuisknop en K blijven kaderselectie aanbieden; in de selectietool blijft slepen op lege ruimte pannen. Tekengereedschappen behouden hun bestaande gedrag.
- Eenmalig Escape na voltooid tekenen wist selectie en zet de selectietool aan. Bij een actieve interactie blijft Escape de bestaande annulering en rollback uitvoeren. Dialoogannulering blijft afzonderlijk.
- Geen aparte Vulling-checkbox. De vulkleurkiezer bevat Geen vulling als wit kleurstaal met rood kruis, tussen de kleuren; alleen voor de vulkleur. Bestaande colortransactions en undo/redo worden hergebruikt.
- Lijnpatronen zijn klikbare SVG-voorbeelden. Tooltips, toegankelijke namen, keyboardbediening en aangepaste legacy-patronen blijven behouden.
- Label tonen/verbergen staat als T-icoon bij de objectnaam, met zichtbare actieve toestand en bestaande autorisatie. Metingsopties blijven in de betreffende sectie; lege labelsecties verdwijnen.

## Opslag en permissies

De enige nieuwe documentinstelling is de optionele booleaanse presentatievlag showMinorGrid. Ontbrekend betekent false. Bij false wordt de vlag uit engine-JSON weggelaten zodat standaarddocumenten hun oude JSON-vorm behouden; true wordt bewaard. Geen documentversieverhoging. JSON-load valideert het type atomair. SVG-export volgt dezelfde renderer. Oudere versies kunnen de extra vlag bewaren maar tekenen geen fijn raster.

Auteurwijzigingen volgen document.setPresentation en de bestaande geschiedenis. In cursus-/toetscontext gaat het om view.configure met de bestaande vereiste viewConfigure-grant; de gezaghebbende documentbaseline blijft intact. Geen nieuwe bypass of parallelle state.

## Verificatie

284 Node-tests (alle 281 bestaande plus 3 nieuwe) slagen. De 3 nieuwe rastertests faalden vooraf alle drie. Ze dekken opt-in/defaultcompatibiliteit, roundtrip/export, begrensde rendering, ontbreken van dubbel getekende hoofdposities, rasterzichtbaarheid en atomaire afwijzing van ongeldige import.

Nieuwe browser-axes-grid.cjs controleert werkbalk, alle oogknoppen en undo, fijn raster/JSON/SVG, eenmalig Escape na echt cirkeltekenen, paleticoon Geen vulling met undo, visuele lijnpatronen via keyboard, labelicoon en undo, en toegestane/geweigerde runtimeweergave zonder baselinewijziging. Bestaande browsertests bedienen de nieuwe knoppen in plaats van verwijderde controls; alle oorspronkelijke geometrische en historiecontroles blijven behouden. Geen golden fixtures gewijzigd.

De volledige echte Edge-suite met 25 browsermodules slaagt; pageErrors is leeg. Desktop-, mobiele en kleurpaletscreenshots zijn visueel gecontroleerd. git diff --check slaagt. Technisch oordeel: PASS. Visuele gebruikersacceptatie blijft open.

## Bestanden en grenzen

model.js, renderer.js, index.js, editor.js, editor-axis-settings.js, editor.html, editor.css; minor-grid.test.cjs, browser-axes-grid.cjs, browser.cjs en aangepaste browser-history/lifecycle/rectangle-selection/styles/ui-modernization tests.

Fijn raster is presentatie, geen nieuwe snapverdeling. De bestaande gekoppelde aslabels/getallen blijven gekoppeld. Geen nieuwe coördinatenstelsels, geometrische objecttypen of volgende milestone.

## Implementatiecommit

acab5c063daf582c9b8fb6e85d71fc3011379e60 — feat(editor): consolidate axes controls and compact object presentation.
