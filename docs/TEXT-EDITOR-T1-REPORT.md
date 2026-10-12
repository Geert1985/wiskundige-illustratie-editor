# T1-rapport — Rich-texteditor en gestructureerd tekstmodel

Versie 1.1.0 — 2026-10-12
Branch: `chatgpt/editor-development`
Status: technische regressiesuite geslaagd; wacht op handmatige controles en expliciete acceptatie. T2 is niet gestart.

## Resultaat

De gepushte T1-baseline (`d47ab7670ae64a31ebc71da7da860243e5ed78f1`) is gecontroleerd. De volledige Node-suite en volledige Edge-suite zijn na de correcties opnieuw uitgevoerd en geslaagd. De Edge-run valideerde de rich-textfunctie, fullscreeninteractie en zelfstandige SVG naar PNG-rastering in offline omstandigheden. De suite meldde `pageErrors: []`.

De controle leverde één echte productieregressie en meerdere verouderde/niet-deterministische browserasserties op. De productieregressie is opgelost in `editor.js`: het slepen van een object in restricted modus probeerde onvoorwaardelijk `circleDistributions.find(...)` te gebruiken. De restricted model-facade exposeert die auteursfunctie bewust niet. De editor behandelt de lijst nu als optioneel; slepen, preview en commit werken weer onder permissiecontrole.

De browserproeven zijn aangescherpt zodat ze de bedoelde scenario's meten: de rich-textproef maakt de ProseMirror-selectie expliciet en controleert dat invoer in een bestaande rich-texteditor wordt opgeslagen zonder een vaste cursorpositie te veronderstellen; de fullscreenproef wacht op het asynchroon geladen tekstvenster; de toolcount verwacht de vier werkelijk aangeboden lijnconstructies; de eenhedenproef opent de asseneigenschappen na documentinvoer en zet de startschaal voor de ongeldige-schaalcontrole expliciet; de asreferentieproef gebruikt `tangent` als tool die volgens het contract geen asreferentie accepteert (`parallel` is wél een geldige asbron).

## Exacte verificatie

Omgeving: Node `v22.18.0`, npm `10.9.3`, Microsoft Edge `155.0.4283.45`.

| Uitvoering | Resultaat |
|---|---|
| `npm.cmd test` (`node --test tests/*.test.cjs`) | exit 0; 402 geslaagd, 0 mislukt, 0 geannuleerd, 0 overgeslagen; totale gerapporteerde duur 7.670 ms |
| `npm.cmd run test:edge` (`node tests/browser.cjs`) | exit 0; alle 49 browsermodules uitgevoerd; `pageErrors: []` |
| Rich text (`browser-rich-text.cjs`) | `schemaAndSVG`, `embeddedFonts`, `offlinePngRaster`, `paragraphsAndHardBreak`, `formatting`, `inspectorEditor`, `cancel`, `undoRedo`, `jsonRoundtrip`: alle 9 `passed` |
| Fullscreen (`browser-canvas-fullscreen.cjs`) | `fullscreenAxesPanel`, `distinctIcon`, `nativeFullscreen`, `documentInvariant`, `allTools`, `drawingAndTextDialog`, `keyboardAndOutsideClose`, `escapeKeepsCanvasFullscreen`, `mobileMenu`: alle 9 `passed` |
| Eenheden/fullscreen (`browser-units-scale.cjs`) | `newDefaults`, `legacy`, `lengthAreaAngle`, `freeText`, `unitConversion`, `geometryPreserved`, `undoRedo`, `invalidScale`, `exactDistance`, `saveReload`, `fullscreen`: alle 11 `passed` |
| Puntprojecties (`browser-point-projections.cjs`) | 12 resultaten, inclusief `svgAndPngRasterization`, allemaal `passed` |
| Dynamische hoeken (`browser-dynamic-angles.cjs`) | 14 resultaten, inclusief `fullscreen` en `svgPng`, allemaal `passed` |
| Dynamische tekst (`browser-dynamic-text.cjs`) | 9 resultaten, inclusief `fullscreen` en `persistence`, allemaal `passed` |
| Asreferenties (`browser-axis-references.cjs`) | 18 resultaten, inclusief asselectie, oorsprong, drag/herberekening, modus/permissies, fullscreen, geschiedenis, schema/legacy en XML-export, allemaal `passed` |
| Restricted permissies (`browser-permissions.cjs`) | alle gerapporteerde categorieën `passed`, inclusief zes annuleringstypen, slepen/preview/commit, autorisatie-intrekking en exportredactie |

De Edge-hoofdproef rapporteerde daarnaast: `maxScale=699.9999999999999`, `step=0.1`, maximale zoomcorrect begrensd (`blocked=true`), uitzoomen naar `594.9999999999999`, eindige SVG (`finite=true`) en 28 rasterlijnen. De prestatieproef voor 10/100/500 objecten en alle overige browsermodules eindigden met `passed`.

## Architectuurbeoordeling voor T2–T5

De huidige verdeling is geschikt om T1 te onderhouden en vormt een bruikbare basis voor vervolgstappen, met een expliciet aandachtspunt vóór uitbreiding van de renderer:

- `model.js` houdt het gestructureerde tekstschema, validatie, quota en documentversie bij de domeinlaag. Het model is onafhankelijk van ProseMirror-JSON; dit is de juiste grens voor import, replay en toekomstige expressie-/referentietypen. Houd toekomstige fragmenttypen getypeerd en valideer ze hier, in plaats van editor-JSON op te slaan.
- `rich-text-editor.js`, `rich-text-editor-loader.js` en `rich-text-editor.bundle.js` isoleren ProseMirror achter `mount/get/destroy` en een asynchrone loader. T2 kan de adapter uitbreiden met een formule-atom zonder ProseMirror-afhankelijkheden in model of command/runtime te introduceren. T3 moet dynamische bronwaarden als expliciete getypeerde fragmenten behandelen; de huidige legacy `textBinding` mag niet door een volledige editor-serialisatie worden vervangen.
- `permission-runtime.js` blijft eigenaar van het getypeerde `text.commit`-commando, autorisatie, rebase/revisie en restricted redactie. T3/T5 voegen alleen capability- en payloadregels toe aan die grens; zij horen niet in de visuele editorcomponent.
- `renderer.js` rendert de schemafragmenten naar SVG en deelt font-resolutie met `text-fonts.js`/`font-assets.js`. De uitvoer is onafhankelijk van de rich editor, wat offline SVG/PNG-export mogelijk maakt. Rich-textlayout zit nu als methode in de algemene renderer. Dat is nog beperkt genoeg voor T1, maar T2-mathlay-out en T4-wrapping zullen dit onderdeel aanzienlijk vergroten. Vóór T2-renderintegratie verdient extractie naar een `rich-text-renderer.js`/layoutmodule de voorkeur, met één getypeerde input en gedeelde SVG-fontcontext; voer die extractie alleen uit als de T2-contracten de extra laag rechtvaardigen.
- De UI-/dialooglevenscyclus is in `editor.js` geïntegreerd. Houd daar alleen openen/sluiten, actuele documentselectie en commandodispatch. Verplaats editorinteractie niet naar de model- of rendererlaag.

Het belangrijkste onderhoudbaarheidsrisico is de synchronisatie van de bronmodule met de circa 210.489-byte gebundelde runtime (`rich-text-editor.bundle.js`). De bundle is een gegenereerd bestand; toekomstige wijzigingen moeten de adapter en distributiebundle als één wijziging behandelen en de architectuur-/assetinventaris laten controleren. Dit is tijdens T1-tests gedekt door de laadvolgorde- en assetcompatibiliteitscontroles. Voor T2 is een reproduceerbare buildinstructie of buildscript aan te bevelen voordat meerdere adaptermodules ontstaan.

## Handmatige controles en grenzen

Deze punten zijn niet door de headless Edge-suite te vervangen en zijn **NIET UITGEVOERD**:

1. Echte OS-IME-compositie in een interactieve sessie, inclusief invoer midden in bestaande opmaak.
2. Een handmatige schermlezercontrole met toetsenbordnavigatie, fragmentopmaak en dialooglabels.
3. Handmatige visuele beoordeling van lettervormen/Unicode en antialiasing in gewone en fullscreenweergave op de ondersteunde apparaten.
4. Handmatige open-/annuleer-/bevestig-/undo-/redo-cyclus van een bestaand rijk tekstobject en een exportbestand in een externe viewer.

Automatisch is wel bewezen dat Edge rijke tekst met lokaal ingesloten fonts als zelfstandige SVG kan renderen, die SVG zonder netwerk als PNG kan rasteren, en JSON undo/redo en rondtrip behoudt. De handmatige controles zijn nog vereist voor volledige productacceptatie. De volledige T1-functieset is niet verwijderd of verkleind.

## Volgende stap

T1 blijft open totdat de gebruiker de handmatige controles heeft uitgevoerd en T1 expliciet accepteert. T2 is niet gestart. Begin pas daarna aan T2; voeg vóór de formule-rendering de renderergrens/buildreproduceerbaarheid opnieuw toe aan de review.
