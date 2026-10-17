# M8-INT.1 — preflight

Datum: 17 oktober 2026  
Featurebranch: `codex/m8-int-1-line-ellipse`  
Startpunt: `origin/main` / `9577be5dc346b4dd74739495a01e925a555cb34c`  
Oorspronkelijke branch: `codex/m8-int-0-universal-intersection`  
Oorspronkelijke working tree: schoon. Remote featurebranch bestond niet.

## Gecontroleerde basis

De goedgekeurde M8-INT.1 v1.0.0-contractfile staat op actuele `origin/main`; het hoofdcontract is v1.1.1. Ook `AGENTS.md`, `CONSTRUCTIONS.md`, `LINEAR-OBJECTS.md`, `DOCUMENT-FORMAT.md`, CORE-1, UI-RADIAL-9, M8a en het M8-INT.0-implementatieverslag zijn aanwezig en gelezen. De instructies vereisen de bestaande model-, service-, command-, permission- en UI-paden te hergebruiken.

- `EllipseGeometry.fromDefinition` levert de canonieke actuele geometrie; `LinearGeometry` levert line/ray/segment/vector-domeinen en `ConstructionService.line` lost polygonranden op.
- `ConstructionService` heeft al bronrollen voor `line` en `ellipse`, getypeerde polygonranden en contextplan-prefill. De editor/radial integratie gebruikt `intersectionContextPlans` en de bestaande `startContextConstruction`-ingang.
- Intersection dispatcher, editor-toolallowlists, engine-intersectioncommand, runtime `construction.create`, schemawriter/importvalidator en axis-role registry kennen op dit startpunt uitsluitend de drie M8-INT.0-recepten.
- `editor.html` laadt `ellipse-geometry.js`, daarna `construction-service.js` en `intersection-dispatcher.js`; beide nieuwe logica kan binnen die bestaande volgorde blijven.
- Modelwriter en restricted exportprojectie leiden constructionSchema af tot maximaal 9 (`matchAB`). Schema 10 moet alleen worden gekozen als minstens één `lineEllipseIntersection`-recept aanwezig is en moet alle eerdere gates toelaten.
- `RuntimeSession` wordt geïmplementeerd in `permission-runtime.js`; definitieve bron-/tool-/asrechten blijven in het bestaande `construction.create`-pad afdwingbaar.

## Startnulmeting

- `npm test`: **713 pass, 0 fail, 0 skipped** (Node 22).
- `npm run test:edge`: **PASS**, exit code 0; volledige Edge-matrix afgerond, `pageErrors: []`. De runner rapporteert per scenario PASS, niet één geaggregeerd testtotaal.

## Beperkte wijzigingskandidaat

Zuivere solver en onafhankelijke fixtures; ConstructionService-recept/resolve/strict-validatie; engine- en runtimecommand; schema-10-afleiding/validatie en restricted exports; axis-role grant; dispatcher en toolbronselectie/contextplan; Node- en Edge-acceptatie, gemengde legacy/replay/lifecycle tests; scriptcacheversies; roadmapstatus en implementatieverslag. Geen nieuwe zichtbare tool, solver voor andere conic-paren, parallelle permission/UI/service-engine of merge naar `main`.

## Preflightafwijking

Er is geen service- of contractafwijking gevonden. De contractueel vereiste lijn–ellips-functionaliteit is nog niet geregistreerd op `main`, zoals verwacht. De bestaande `line`-rol accepteert al expliciete polygon-edge-referenties. De oplossing kan daarom de bestaande architectuur uitbreiden zonder gewijzigd productgedrag buiten M8-INT.1.
