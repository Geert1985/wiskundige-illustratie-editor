# JavaScript-afhankelijkheden en klassieke scriptvolgorde

**Status:** bijgewerkt voor STAB-1 op 15 oktober 2026
**Applicatie-entrypoint:** `editor.html`
**Runtimevorm:** 49 synchrone klassieke scripts; geen `type="module"` en geen bundler.
**Gedeelde cacheversie:** `stab-1-20261015` voor alle 49 lokale JavaScript-URL’s.

## Contract

De volgorde hieronder is de feitelijk geladen volgorde in `editor.html` en wordt gecontroleerd door `tests/architecture.test.cjs`. De tabel registreert de door die test bewaakte namespace-exports en evaluatievoorgangers. UI-side-effectmodules die geen namespace-service publiceren staan expliciet als zodanig vermeld. Runtime-aanroepen na het laden zijn geen evaluatieafhankelijkheid.

| Volgorde | Script | Namespace-exports / rol | Laden na |
| ---: | --- | --- | --- |
| 1 | `regular-geometry.js` | `RegularGeometry` | — |
| 2 | `math-source.js` | `MathSource` | — |
| 3 | `text-values.js` | `TextValues` | — |
| 4 | `text-dependencies.js` | `TextDependencies` | `text-values.js` |
| 5 | `model.js` | `PointProjections`, `DynamicText`, `TextContent`, `MODEL_VERSION`, `OBJECT_TYPES`, `LINEAR_OBJECT_TYPES`, `IllustrationModel`, `normaliseObject`, `PRESENTATION_FLAGS` | `regular-geometry.js`, `math-source.js`, `text-values.js` |
| 6 | `rich-text-editor-loader.js` | `RichTextEditor` | `model.js` |
| 7 | `font-assets.js` | `TextFontData` | `model.js` |
| 8 | `text-fonts.js` | `TextFonts` | `font-assets.js` |
| 9 | `persistent-groups.js` | `PersistentGroups` | `model.js` |
| 10 | `document-layers.js` | `DocumentLayers` | `model.js`, `persistent-groups.js` |
| 11 | `polygon-geometry.js` | `PolygonGeometry` | `model.js` |
| 12 | `linear-geometry.js` | `LinearGeometry` | `model.js` |
| 13 | `measurement-geometry.js` | `AngleMeasurements`, `MeasurementUnits`, `MeasurementGeometry` | `model.js`, `polygon-geometry.js`, `linear-geometry.js` |
| 14 | `region-geometry.js` | `RegionGeometry` | `model.js`, `polygon-geometry.js`, `measurement-geometry.js` |
| 15 | `construction-service.js` | `AxisReferences`, `ConstructionService` | `model.js`, `polygon-geometry.js`, `linear-geometry.js`, `measurement-geometry.js`, `region-geometry.js` |
| 16 | `math-fragments.js` | `MathFragments` | `math-source.js`, `model.js` |
| 17 | `text-metrics.js` | `TextMetrics` | `model.js` |
| 18 | `rich-text-renderer.js` | `RichTextRenderer` | `math-fragments.js`, `text-metrics.js`, `model.js` |
| 19 | `text-math-input.js` | `TextMathInput` | `math-source.js`, `math-fragments.js` |
| 20 | `text-formula-editor.js` | `TextFormulaEditor` | `math-source.js`, `math-fragments.js` |
| 21 | `text-dynamic-value-editor.js` | `TextDynamicValueEditor` | `text-values.js` |
| 22 | `text-symbol-catalog.js` | `TextSymbolCatalog` | — |
| 23 | `text-insert-panel.js` | `TextInsertPanel` | `math-fragments.js`, `text-symbol-catalog.js`, `text-math-input.js`, `text-formula-editor.js`, `text-dynamic-value-editor.js` |
| 24 | `renderer.js` | `SvgRenderer`, `escapeXml` | `model.js`, `document-layers.js`, `polygon-geometry.js`, `linear-geometry.js`, `measurement-geometry.js`, `region-geometry.js`, `construction-service.js` |
| 25 | `index.js` | `CONSTRUCTION_COLOR`, `Engine`, `distancePointToSegment` | `model.js`, `persistent-groups.js`, `document-layers.js`, `polygon-geometry.js`, `linear-geometry.js`, `measurement-geometry.js`, `region-geometry.js`, `construction-service.js`, `renderer.js` |
| 26 | `semantic-sequence.js` | `SemanticSequence` | `index.js` |
| 27 | `coordinate-transform.js` | `CoordinateTransform` | `renderer.js` |
| 28 | `snap-service.js` | `SnapService`, `getSnapCandidates`, `snapPoint`, `publishSnapResult` | `index.js`, `coordinate-transform.js`, `construction-service.js`, `measurement-geometry.js`, `linear-geometry.js` |
| 29 | `interaction-resolver.js` | `InteractionResolver` | `index.js`, `snap-service.js`, `measurement-geometry.js`, `polygon-geometry.js` |
| 30 | `rectangle-selection.js` | `RectangleSelection` | `linear-geometry.js`, `measurement-geometry.js`, `polygon-geometry.js`, `coordinate-transform.js` |
| 31 | `text-content-diff.js` | `TextContentDiff` | `model.js` |
| 32 | `permission-runtime.js` | `PermissionError`, `PermissionPolicy`, `PermissionEvaluator`, `RuntimeSession`, `PermissionFields`, `AuthorCommands` | `index.js`, `construction-service.js`, `measurement-geometry.js`, `region-geometry.js`, `document-layers.js`, `persistent-groups.js` |
| 33 | `editor-startup.js` | `DraftStore` | `model.js` |
| 34 | `editor-adaptive-grid.js` | `adaptiveGridStep`, `adaptiveGridMinStep`, `adaptiveGridMaxScale` | `renderer.js` |
| 35 | `editor-label-drag.js` | `LabelOffsets` | `linear-geometry.js` |
| 36 | `editor-enhancements.js` | `EditorOverlays`, `SnapFeedback` | `linear-geometry.js` |
| 37 | `editor-color.js` | `EditorColor` | `model.js` |
| 38 | `text-editor-ux.js` | `TextEditorUX` | `editor-color.js` |
| 39 | `editor-axis-settings.js` | `AxisSettings` | `renderer.js` |
| 40 | `editor-history.js` | `EditorHistory`, `RuntimeHistory` | `index.js`, `permission-runtime.js` |
| 41 | `editor-tool-instructions.js` | `ToolInstructions` | `renderer.js` |
| 42 | `export-service.js` | `ExportService` | `index.js`, `math-fragments.js` |
| 43 | `text-workspace.js` | `TextWorkspace` | `model.js` |
| 44 | `tool-catalog.js` | `ToolCatalog` | — |
| 45 | `editor-radial-properties.js` | `RadialProperties` | `tool-catalog.js`, `editor-tool-instructions.js`, `permission-runtime.js` |
| 46 | `editor.js` | `EditorApp` | `modulesBeforeEditor()` |
| 47 | `editor-tool-search.js` | Side-effectmodule; geen namespace-export | `editor.js` |
| 48 | `editor-sidebar-tabs.js` | Side-effectmodule; geen namespace-export | `editor.js`, `document-layers.js`, `persistent-groups.js` |
| 49 | `editor-bootstrap.js` | `bootstrapEditor`, `editor`, `activeEngine`, `bootstrapRestrictedEditor` | `editor.js` |

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
