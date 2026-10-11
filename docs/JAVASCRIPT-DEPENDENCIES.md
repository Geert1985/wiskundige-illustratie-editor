# JavaScript-afhankelijkheden en klassieke scriptvolgorde

**Status:** R4 inventarisatie
**Applicatie-entrypoint:** `editor.html`
**Runtimevorm:** synchrone klassieke scripts; geen `type="module"` en geen bundler.

## Contract

`editor.html` laadt 25 lokale scripts synchroon in de hieronder vermelde volgorde. Zij publiceren hun services onder `window.FZI.MathIllustration` (in de broncode meestal afgekort tot `MI`). `tests/architecture.test.cjs` legt de inventaris en de laadvoorwaarden vast. Nieuwe, verwijderde of verplaatste scripts en gewijzigde exports moeten de inventaris en deze tabel bewust bijwerken.

De tabel noemt per module de belangrijkste exports, services die zij gebruikt en de expliciete `load after`-voorwaarden. “Gebruikt” omvat runtime-aanroepen die pas plaatsvinden nadat alle scripts geladen zijn. De `after`-relatie is alleen voor evaluatie-/initialisatieafhankelijkheden: een runtime-aanroep is op zichzelf geen reden om een script eerder te laden.

| Volgorde | Script | Belangrijkste exports | Belangrijkste gebruikte services | Laden na |
| ---: | --- | --- | --- | --- |
| 1 | `model.js` | `IllustrationModel`, `normaliseObject`, modeltypen en flags, `DynamicText`, `PointProjections` | Geen applicatiemodules | — |
| 2 | `persistent-groups.js` | `PersistentGroups` | Model | `model.js` |
| 3 | `document-layers.js` | `DocumentLayers` | Model, persistente groepen | `model.js`, `persistent-groups.js` |
| 4 | `polygon-geometry.js` | `PolygonGeometry` | Model | `model.js` |
| 5 | `linear-geometry.js` | `LinearGeometry` | Model | `model.js` |
| 6 | `measurement-geometry.js` | `AngleMeasurements`, `MeasurementUnits`, `MeasurementGeometry` | Model, lineaire en polygoongeometrie | `model.js`, `polygon-geometry.js`, `linear-geometry.js` |
| 7 | `construction-service.js` | `AxisReferences`, `ConstructionService` | Model, geometrie en meetregels | `model.js`, `polygon-geometry.js`, `linear-geometry.js`, `measurement-geometry.js` |
| 8 | `renderer.js` | `SvgRenderer`, `escapeXml` | Model, lagen, geometrie, metingen en constructieregels | Alle hiervoor genoemde diensten die voor renderberekening nodig zijn |
| 9 | `index.js` | `Engine`, `distancePointToSegment`, `CONSTRUCTION_COLOR` | Model, groepen, lagen, geometrie, metingen, constructies en renderer | Services 1–8 |
| 10 | `semantic-sequence.js` | `SemanticSequence` | Engine; autorisatiecommando's worden bij uitvoering opgezocht | `index.js` |
| 11 | `coordinate-transform.js` | `CoordinateTransform` | Renderer/viewport-geometrie | `renderer.js` |
| 12 | `snap-service.js` | `SnapService` en snaphelpers | Engine, coördinatentransformatie, constructie-, meet- en lineaire geometrie | `index.js`, `coordinate-transform.js`, `construction-service.js`, `measurement-geometry.js`, `linear-geometry.js` |
| 13 | `interaction-resolver.js` | `InteractionResolver` | Engine, snapping, metingen en polygoongeometrie | `index.js`, `snap-service.js`, `measurement-geometry.js`, `polygon-geometry.js` |
| 14 | `rectangle-selection.js` | `RectangleSelection` | Lineaire, meet- en polygoongeometrie; coördinatentransformatie | `linear-geometry.js`, `measurement-geometry.js`, `polygon-geometry.js`, `coordinate-transform.js` |
| 15 | `permission-runtime.js` | `PermissionError`, `PermissionPolicy`, `PermissionEvaluator`, `RuntimeSession`, `PermissionFields`, `AuthorCommands` | Engine, constructies, metingen, lagen en groepen | `index.js`, `construction-service.js`, `measurement-geometry.js`, `document-layers.js`, `persistent-groups.js` |
| 16 | `editor-startup.js` | `DraftStore` | Modelnormalisatie | `model.js` |
| 17 | `editor-adaptive-grid.js` | Rasterstaphelpers | Renderer/viewportschaal | `renderer.js` |
| 18 | `editor-label-drag.js` | `LabelOffsets` | Lineaire geometrie | `linear-geometry.js` |
| 19 | `editor-enhancements.js` | `EditorOverlays`, `SnapFeedback` | Lineaire geometrie; SVG-presentation | `linear-geometry.js` |
| 20 | `editor-color.js` | `EditorColor` | Model-/presentatievlaggen | `model.js` |
| 21 | `editor-axis-settings.js` | `AxisSettings` | Renderer en assenpresentatie | `renderer.js` |
| 22 | `editor-history.js` | `EditorHistory`, `RuntimeHistory` | Engine en permission runtime | `index.js`, `permission-runtime.js` |
| 23 | `editor-tool-instructions.js` | `ToolInstructions` | Escaping/renderhelpers; EditorApp wordt als argument aangeleverd | `renderer.js` |
| 24 | `editor.js` | `EditorApp` | Alle model-, engine-, render-, interactie-, permissie- en UI-services | Scripts 1–23 |
| 25 | `editor-bootstrap.js` | `bootstrapEditor`, actieve editor/engine-referenties, restricted bootstrap | `EditorApp` en alle door bootstrap geïnjecteerde services | `editor.js` |

## Globale services en runtimekoppelingen

De applicatie heeft één gedeelde namespace. Modules definiëren hun services eenmaal en andere modules lezen die via `MI`. `EditorApp` is de coördinator voor UI-status en interacties; `Engine` beheert documentmutaties en geschiedenis; `SvgRenderer` verzorgt de SVG-weergave. De bootstrap injecteert geschiedenis, transformatie, snapping, resolutie, drafts, raster, labels, overlays, kleur, assen en selectie in `EditorApp`.

Een deel van de koppeling is bewust laat gebonden. Zo gebruikt `SemanticSequence` autorisatiecommando's wanneer een replay wordt uitgevoerd, hoewel `permission-runtime.js` later in de HTML-volgorde staat. Ook service-aanroepen vanuit editor-eventhandlers vinden pas na het laden van alle scripts plaats. De architectuurtest behandelt dit als runtimegebruik en registreert het niet als een laadcyclus. Dit voorkomt een onjuiste eis om diensten vóór hun definities te evalueren, maar betekent ook dat de test geen volledige runtime-callgraph bewijst.

## Automatische architectuurcontrole

`npm test` voert `tests/architecture.test.cjs` uit. De test controleert:

- dat de lokale scriptlijst en -volgorde in `editor.html` exact overeenkomen met de goedgekeurde inventaris;
- dat elke module aanwezig is, elke opgegeven export in de genoemde provider wordt toegewezen, en geen export twee providers heeft;
- dat alle gevonden statische `MI.X`-namespaceverwijzingen een provider hebben;
- dat elke gedeclareerde `after`-voorwaarde eerder in de HTML staat en de expliciete load-graaf geen cyclus bevat;
- dat de klassieke scripts in volgorde zonder evaluatiefout laden in een minimale VM-browsercontext, zonder de echte editor-bootstrap te starten.

Deze statische controle ontdekt ontbrekende scripts, vergeten manifestupdates, dubbele of ontbrekende providers, verbroken laadvoorwaarden en initialisatievolgordeproblemen die bij script-evaluatie zichtbaar zijn. Dynamisch opgebouwde propertynamen, eventpaden, cyclische runtime-aanroepen, visuele defecten en browsergedrag zijn hiermee niet bewezen; daarvoor blijven de functionele Node- en Edge-tests nodig. De test is geen dependency-injectie- of module-isolatiegarantie.

## Huidige compatibiliteit

De app gebruikt reguliere scripts zonder imports, exports, bundelstappen of moduleloader. De volgorde is daarom onderdeel van de runtimecompatibiliteit. Alle script-URL's zijn lokale relatieve bestanden met een gedeelde cacheversie. Bootstrap start pas wanneer het canvas-element op de pagina aanwezig is. Productiecode, documentformaat en deploymentpad blijven in R4 ongewijzigd.

## Mogelijke latere ES-module- of bundlermigratie

ES-modules zouden afhankelijkheden expliciet maken, globale naamruimtevervuiling verminderen en cycli beter zichtbaar maken voor tooling. Een bundler kan daarnaast statische analyse, gedeelde chunks, minificatie en source maps leveren. Een testomgeving kan services afzonderlijk importeren zonder de volledige globale runtime op te bouwen.

Daar staan migratie- en onderhoudskosten tegenover: elke huidige globale koppeling moet worden omgezet, importcycli moeten worden opgelost of bewust ontworpen, en buildconfiguratie en gegenereerde artefacten komen bij het project. `defer`/module-evaluatie, foutmeldingen en chunking veranderen laadsemantiek. Offline- en lokale deployment, relatieve assets, cache-invalidatie, CSP en eventuele beperkte runtimes moeten opnieuw worden gevalideerd. Een bundler introduceert een extra toolchain en reproduceerbare buildverantwoordelijkheid.

R4 voert deze migratie niet uit en kiest geen bundler. Een eventuele toekomstige stap vereist een apart besluit, een deploy- en offlineproef en regressiebewijs voor normale, fullscreen- en restricted runtime.
