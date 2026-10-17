# PERF-1.2a — Implementatierapport

- Repository: `Geert1985/wiskundige-illustratie-editor`
- Branch: `codex/perf-1-2a-render-invalidation`
- Basis: `939af5f86a60d6894a3e109a5c2396de31e315be` (PERF-1.1 gemerged in `main`)
- Uitvoering: 17 oktober 2026
- Implementatiecommit: `31f184a` (`perf: skip unchanged panels during navigation`)

## Resultaat

De centrale `EditorApp` gebruikt nu expliciete invalidatieredenen: `full` en `viewport`. De bestaande volledige render blijft de standaard. Alleen zuiver pannen en zoomen gebruiken de viewportroute; die rendert de canvas en actuele presentatie opnieuw, ververst zoom-/pan-/undo-/redo-bediening en slaat de ongewijzigde objectenlijst, objectenteller en inspector over. Pan-start en pan-commit gebruiken dezelfde route. Onbekende redenen, bestaande `invalidate(true)`-aanroepen en alle overige acties blijven volledig renderen. Bij uitgestelde renders wint een pending volledige invalidatie van een viewport-update.

Er is geen autorisatiecache toegevoegd. Canvasprojectie, selectieprojectie en de view.pan/view.zoom-controles raadplegen bij elke render nog steeds de actuele runtime-capabilities. Document-, selectie-, laag-, label-, tekst-/math-, undo/redo-, preview-, import- en restricted-mode-mutaties lopen via de bestaande volledige renderroute. Zoom blijft synchroon per wheel-event met dezelfde individuele geschiedenisopname; PERF-1.2b is niet uitgevoerd.

## Invalidatiematrix

| Reden / gebeurtenis | Canvas en overlays | Objectenlijst | Inspector | Navigatie- en geschiedenisbediening |
|---|---:|---:|---:|---:|
| `viewport`: pan en zoom | Ja | Behouden | Behouden | Bijgewerkt, inclusief actuele view-rechten en undo/redo |
| `full`: selectie, document, lagen, labels, permissie-epoch, geschiedenis, preview, fullscreen, import en standaardaanroep | Ja | Herbouwd | Herbouwd | Bijgewerkt |
| Onbekende reden | Ja | Herbouwd | Herbouwd | Bijgewerkt |
| Samengevoegde RAF met ten minste één volledige update | Ja | Herbouwd | Herbouwd | Bijgewerkt |

`renderCanvas()` blijft de enige SVG-renderaar en voert de bestaande zichtbaarheid-/capabilityprojecties uit. De viewportroute introduceert geen alternatieve geometrie- of documentwaarheid.

## Prestaties

De browsermeting gebruikte dezelfde deterministische PERF-1.1 mixed fixtures als de audit, in Edge 155 headless op 1280 × 900. Volledige render: 3 metingen. Pan en zoom: 10 metingen per actie. Tijden hieronder zijn medianen in ms. De volledige p95 uit drie samples is alleen het maximum; nav-p95 is gebaseerd op tien acties. Zoomtijd omvat de bestaande geschiedenis-/serialisatiekosten.

| Objecten | Volledige render totaal (lijst / SVG / DOM) | Pan totaal (lijstcalls / inspectorcalls; SVG / DOM) | Zoom totaal (lijstcalls / inspectorcalls; SVG / DOM) | Totale reductie t.o.v. volledige render: pan / zoom |
|---:|---:|---:|---:|---:|
| 10 | 30,4 (19,3 / 0,7 / 1,0) | 8,7 (0 / 0; 0,6 / 0,9) | 10,0 (0 / 0; 0,5 / 0,8) | 71,4% / 67,1% |
| 100 | 973,0 (934,4 / 2,1 / 2,2) | 33,6 (0 / 0; 1,7 / 2,1) | 44,1 (0 / 0; 2,0 / 2,2) | 96,5% / 95,5% |
| 500 | 22.299,0 (22.121,9 / 8,5 / 7,5) | 173,1 (0 / 0; 8,5 / 10,0) | 222,2 (0 / 0; 7,7 / 9,2) | 99,2% / 99,0% |

De PERF-1.1-audit mat bij 100 objecten 903,3 ms viewlist en 940,8 ms volledige render. De nieuwe gecontroleerde volledige render mat 934,4 ms lijst en 973,0 ms totaal; de kleine absolute afwijking is meetvariatie. Pan en zoom voeren in de nieuwe meting elk nul lijst- en inspectorrenders uit, in plaats van één render per volledige update. Bij 500 objecten bleef canvas/SVG zelf meetbaar duur (173 ms pan, 222 ms zoom inclusief history); deze wijziging maakt zulke documenten dus niet frame-vloeiend. Er is geen zichtbaar-venster-, compositor- of fysieke schermmeting gedaan.

Volledige samples en de reproduceerbare meetcode staan in [render-invalidation-results.json](../experiments/perf-1.2a/render-invalidation-results.json) en [render-invalidation-benchmark.cjs](../experiments/perf-1.2a/render-invalidation-benchmark.cjs). Herhaal met `node experiments/perf-1.2a/render-invalidation-benchmark.cjs` vanaf de repo-root. In deze geïsoleerde worktree gebruikte Node `NODE_PATH` naar de reeds aanwezige `repository/node_modules` omdat de nieuwe worktree geen `node_modules` bevatte.

## Testbewijs

- `node --test tests/lifecycle.test.cjs` — 88/88 PASS; bevat behoud van lijst-/inspector-DOM bij viewportinvalidatie, volledige terugval voor onbekende/legacy invalidaties en behoud van de sterkste deferred invalidatie.
- `PERF_1_2A_ONLY=1 node tests/browser.cjs` in Edge — PASS; echte wheel-zoom en pointer-pan met nul lijst-/inspectorrenders; een daaropvolgende volledige invalidatie herbouwde beide panelen. Geen page errors.
- `npm test` — 751/751 PASS.
- `npm run test:edge` — **FAIL**, bestaande test `browser-minimal-object-list.cjs` krijgt 2 acties waar de test 0 verwacht. Dezelfde geïsoleerde test faalt identiek op de ongewijzigde branchbasis `8f51c4c6cbd010917c39fde6de82f5980f3edbff`; dit is geen regressie uit PERF-1.2a. In de volledige run zijn snapping, lifecycle, performance (10/100/500), selectie (inclusief 500 objecten), auditFinal, linear, asset compatibility, history, rich text/math/layout, geometry, permissions, import/history, groups, layers en constructie-/UI-suites tot en met `postM5aUX` geslaagd voordat de suite bij deze baselinefout stopte. De gerichte `PERF_1_2A_ONLY=1` Edge-test slaagde afzonderlijk.

De repository-brede tests dekken bestaande regressies voor selectie, permissions/restricted mode, wijzigingen aan objecten/lagen/labels, geschiedenis, text/math, import en annulering. Nieuwe code wijzigt die routes niet; de expliciete fallbacktest bewaakt dat ze volledig blijven renderen.

## Gewijzigde bestanden

- `editor.js` — centrale render-invalidatie, viewportrender en navigatie-/geschiedenisbediening.
- `tests/lifecycle.test.cjs` — unit-karakterisering voor invalidatie en RAF-samenvoeging.
- `tests/browser.cjs` — ingang voor de gerichte PERF-1.2a Edge-test.
- `tests/browser-render-invalidation.cjs` — pan-/zoom-/fallbackkarakterisering in Edge.
- `experiments/perf-1.2a/render-invalidation-benchmark.cjs` — reproduceerbare benchmark op PERF-1.1 fixtures.
- `experiments/perf-1.2a/render-invalidation-results.json` — Edge-meetresultaten.
- `docs/PERF-1.2a-IMPLEMENTATION-REPORT.md` — dit rapport.

## Resterend risico en besluit

Pan/zoom vervangt de volledige SVG nog steeds en tekent alle zichtbare objecten opnieuw. Bij grote documenten blijft die canvasfase boven de 16,7 ms-framelimiet; de viewlist-herbouw was echter de dominante, nu vermeden kostenpost. Restricted mode blijft op actuele permissies controleren; er wordt niets van rechten gecachet. Onbekende invalidaties vallen conservatief terug op volledig.

**PERF-1.2a: GO. PERF-1.2b: GO voor een afzonderlijke, expliciet beoordeelde fase** om wheel-events per RAF te bundelen; die fase moet de bestaande zoom-/undo-semantiek eerst karakteriseren en mag niet stilzwijgend worden aangepast. Deze branch bevat geen 1.2b-implementatie en wordt niet naar `main` gemerged.

## Acceptatie

- [x] `npm test` geslaagd (751/751); de Edge-suite uitgevoerd met een identieke, op de basiscommit reproduceerbare fout in `browser-minimal-object-list.cjs`.
- [ ] Commit-SHA ingevuld.
- [ ] Naar `codex/perf-1-2a-render-invalidation` gepusht; niet gemerged.
