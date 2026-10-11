# JavaScript-refactoringrapport — R1–R4

**Repository:** `Geert1985/wiskundige-illustratie-editor`
**Branch:** `chatgpt/editor-development`
**Uitgangs-HEAD vóór R1:** `123c40b744ccaa70b51367a743201b350c2b4697`
**Rapportstatus:** R1, R2, R3 en R4 uitgevoerd.

## Samenvatting

De refactoring is uitgevoerd in drie afzonderlijke commits. R1 verwijderde één aantoonbaar ongebruikt stubbestand. R2 bracht twee tijdelijke SVG-presentatieoverlays onder in één module met behoud van hun bestaande service-interfaces. R3 haalde toolinstructies en de presentatie daarvan uit `editor.js` naar een kleine, expliciete instructiemodule. Er zijn geen wiskundige algoritmen, opgeslagen documentstructuren, permissies, canvasrender-eigenaars of pointerinteracties gewijzigd.

De volledige Node-suite slaagde na elke fase. De volledige Edge-regressiesuite slaagde na elke fase; de browseruitvoer rapporteerde `pageErrors: []`. Handmatige gebruikersacceptatiecontroles zijn niet uitgevoerd.

R4 heeft de klassieke scriptarchitectuur geïnventariseerd, een afhankelijkheidscontract vastgelegd en een automatische controle toegevoegd. Het wijzigt geen productiecode of runtimefunctionaliteit.

## R1 — Verwijderen van het ongebruikte stubbestand

### Oorspronkelijke situatie en wijziging

`editor-controls.js` bevatte uitsluitend `/* Temporarily disabled. */`. Een repositorybrede zoekactie naar `editor-controls.js` en `editor-controls` leverde geen verwijzingen op in getrackte broncode, tests, documentatie of scripts. Alleen dit bestand is verwijderd. De bestaande ongetrackte `docs/FEATURE-GAP-ANALYSIS.md` bleef onaangeroerd.

### Gewijzigde bestanden

- Verwijderd: `editor-controls.js`.

### Tests

| Controle | Resultaat |
| --- | --- |
| Baseline `npm test`, vóór verwijdering | **PASS** — 364 tests, 364 geslaagd, 0 mislukt, 0 overgeslagen |
| `npm test`, na verwijdering | **PASS** — 364 tests, 364 geslaagd, 0 mislukt, 0 overgeslagen |
| `npm run test:edge`, na verwijdering | **PASS** — volledige browserregressiesuite; gerapporteerde browserchecks geslaagd en `pageErrors: []` |
| Handmatige gebruikersacceptatie | **Niet uitgevoerd** |

### Risico en compatibiliteit

Laag risico: het bestand had geen repositoryverwijzingen en geen uitvoerbare code. Er zijn geen afhankelijkheden of publieke interfaces aangepast. Edge moest buiten de sandbox worden gestart omdat Playwright anders geen tijdelijke Edge-profielbestanden kon schrijven; de test zelf slaagde.

### Commit

`a12ca6fbb2576808467ff3d6eae45d7f202d60fc` — `refactor: remove unused editor-controls stub` — gepusht naar de ontwikkelbranch.

## R2 — Consolidatie van SVG-presentatieoverlays

### Afhankelijkheids- en impactanalyse

`editor-enhancements.js` tekent editor-only selectie- en greepoverlays. `snap-indicator.js` tekende een tijdelijke SVG-ring bij een snapresultaat. Beide zijn stateless SVG-presentatie en worden vanuit de centrale rendercyclus aangeroepen. Geen van beide beheert events, documentmutaties, geometry of een alternatieve rendercyclus. Daarom konden ze veilig één presentatiemodule delen.

`editor-color.js` blijft een kleurtransformatie-helper, `editor-label-drag.js` blijft labeloffsetinterpretatie en `editor-adaptive-grid.js` blijft rasterberekening. Deze hebben andere verantwoordelijkheden; samenvoegen zou die domeinen vermengen zonder aangetoonde onderhoudswinst.

### Interface en wijziging

De snapoverlay is naar `editor-enhancements.js` verplaatst. De bestaande interface `MI.SnapFeedback.render(svg, renderer, result, document)` en service-injectie in de bootstrap zijn behouden. De scriptverwijzing naar `snap-indicator.js` is verwijderd, de gezamenlijke asset-cacheversie is bijgewerkt en testlaadlijsten zijn aangepast.

### Gewijzigde bestanden

- Aangepast: `editor-enhancements.js`, `editor.html`, `tests/lifecycle.test.cjs`, `tests/selection-presentation.test.cjs`, `tests/snapping.test.cjs`.
- Verwijderd: `snap-indicator.js`.

### Tests

| Controle | Resultaat |
| --- | --- |
| Gerichte Node-controle `tests/selection-presentation.test.cjs`, `tests/snapping.test.cjs`, `tests/lifecycle.test.cjs` | **PASS** — 96 tests, 96 geslaagd, 0 mislukt |
| `npm test` | **PASS** — 365 tests, 365 geslaagd, 0 mislukt, 0 overgeslagen |
| `npm run test:edge` | **PASS** — volledige browserregressiesuite; gerapporteerde snapping-, lifecycle-, selectie-, export- en andere browserchecks geslaagd, `pageErrors: []` |
| Handmatige gebruikersacceptatie | **Niet uitgevoerd** |

### Risico en compatibiliteit

Laag risico: alleen de plaats waar SVG-presentatiecode wordt gedefinieerd en de scriptlaadlijst zijn gewijzigd. De publiek gebruikte snapfeedbackinterface, centrale render-eigendom en object-/documentgegevens zijn behouden. De nieuwe gerichte test controleert snapring-attributen, schermcoördinaten en de bestaande guardcondities.

### Commit

`e9265273e7f80b9fd9dcf81a8c05c20a6ba90439` — `refactor: consolidate SVG presentation overlays` — gepusht naar de ontwikkelbranch.

## R3 — Instructiepresentatie uit `editor.js`

### Bestaande verantwoordelijkheid en afhankelijkheden

`editor.js` bevatte de declaratieve stappen voor gereedschappen en constructies, logica voor stapprogressie, korte toolhints en HTML-presentatie van instructies voor het zijpaneel en fullscreen. Deze presentatie hoort niet bij de pointerlifecycle of documentmutaties. De instructiecode gebruikte `MI.escapeXml` en ontving de benodigde editorstatus en DOM-nodes van `EditorApp`; zij had geen afhankelijkheid van model- of renderimplementaties.

### Interface en wijziging

Deze verantwoordelijkheid staat nu in `editor-tool-instructions.js`, onder `MI.ToolInstructions` met `definitions`, `describe`, `toolHint`, `constructionHint` en `render(app)`. `EditorApp` behoudt de bestaande wrappermethoden `toolHint`, `constructionHint` en `renderInstructions`, zodat de bestaande interne en testinterfaces bruikbaar blijven. Het nieuwe script wordt vóór `editor.js` geladen. De test-runtime laadt hetzelfde script expliciet.

`EditorApp` blijft coördinator en behoudt eigenaarschap van status, interactiestatus, eventhandlers, canvasrendering en documentmutaties. Er is geen volledige herschrijving uitgevoerd.

### Gewijzigde bestanden

- Toegevoegd: `editor-tool-instructions.js`, `tests/editor-tool-instructions.test.cjs`.
- Aangepast: `editor.js`, `editor.html`, `tests/helpers.cjs`, `tests/lifecycle.test.cjs`.

### Tests

| Controle | Resultaat |
| --- | --- |
| Gerichte Node-controle `tests/editor-tool-instructions.test.cjs`, `tests/post-m5a-ux.test.cjs`, `tests/lifecycle.test.cjs` | **PASS** — 82 tests, 82 geslaagd, 0 mislukt |
| `npm test` | **PASS** — 367 tests, 367 geslaagd, 0 mislukt, 0 overgeslagen |
| `npm run test:edge` | **PASS** — volledige browserregressiesuite; toolstappen, fullscreen en andere browserchecks geslaagd, `pageErrors: []` |
| Handmatige gebruikersacceptatie | **Niet uitgevoerd** |

### Risico en compatibiliteit

Laag risico: de bestaande instructieteksten en voortgangslogica zijn verplaatst zonder inhoudelijke wijziging. De compatibility wrappers blijven in `EditorApp`; de scriptvolgorde en escaped instructieweergave zijn door Node- en Edge-tests gecontroleerd. Pointerinteracties, permissies, engine-prototypes en render-eigenaarschap zijn niet aangepast.

### Commit

`2292f5b3fabfc1fcbc9b6c255ddc3061d01949c5` — `refactor: extract editor tool instructions` — gepusht naar de ontwikkelbranch.

## Prestatie, beperkingen en resterend werk

Er zijn geen prestatieverschillen gemeten; deze fasen wijzigen geen geometrieberekeningen of hoofd-renderpad. De Edge-suite bevat algemene prestatiechecks, maar die vormen geen gecontroleerde benchmarkvergelijking voor deze refactoring.

Niet uitgevoerd: handmatige controle van elk gereedschap, alle schermformaten, fullscreen-interacties en visuele verschillen door een gebruiker. De geautomatiseerde Edge-tests dekken daarvoor bestaande scenario's, maar vervangen geen gebruikersacceptatie.

R3 beperkte zich tot een aantoonbaar laagrisico UI-extractie. De complexere pointerlifecycle, documentmutaties, inspectoren, dialoogvensters en navigatie zijn niet opgesplitst omdat de extractiegrenzen en karakterisering daarvan meer risico vragen. Er zijn geen productieafhankelijkheden toegevoegd. Playwright is uit de bestaande lockfile geïnstalleerd als reeds gedeclareerde ontwikkeldependency om de verplichte Edge-suite te kunnen uitvoeren; packagebestanden zijn niet gewijzigd.

## R4 — Afhankelijkheden, laadvolgorde en architectuurcontrole

### Inventaris en contract

`editor.html` laadt 25 lokale klassieke scripts synchroon en die publiceren samen 53 geïnventariseerde services/helpers. `docs/JAVASCRIPT-DEPENDENCIES.md` documenteert per module de belangrijkste exports, servicegebruik, laadvoorwaarden, laat gebonden runtimekoppelingen, grenzen van de controle en voor- en nadelen van een mogelijke latere ES-module-/bundlermigratie. Er is geen migratie of bundlerkeuze gemaakt.

`tests/architecture.test.cjs` controleert de scriptinventaris en volgorde, bestandsexistentie, unieke en daadwerkelijk toegewezen providers, statische `MI.X`-referenties, verklaarde load-afhankelijkheden en cycli in die graaf. Ook evalueert de test de scripts in volgorde in een minimale VM-browsercontext zonder de editor-bootstrap te starten. Dynamische runtime-callgraphs en visuele output vallen buiten deze statische controle en worden door bestaande functionele/Edge-tests gedekt.

### Tests

| Controle | Resultaat |
| --- | --- |
| Gerichte architectuurtest `node --test tests/architecture.test.cjs` | **PASS** — 3 tests, 3 geslaagd, 0 mislukt |
| Volledige Node-suite `npm.cmd test` | **PASS** — 370 tests, 370 geslaagd, 0 mislukt, 0 overgeslagen |
| Volledige Edge-suite `npm.cmd run test:edge` | **PASS** — browserregressie-uitvoer rapporteerde alle opgenomen checks als geslaagd en `pageErrors: []` |
| Handmatige gebruikersacceptatie | **Niet uitgevoerd** |

PowerShell blokkeerde de `.ps1`-shim voor `npm`; de gelijkwaardige `npm.cmd`-commando's zijn gebruikt. Edge moest buiten de sandbox worden uitgevoerd omdat Playwright anders de tijdelijke Edge-profielbestanden niet kon schrijven. De eerste sandboxrun kon de browser daardoor niet starten; de toegestane herhaling buiten de sandbox slaagde.

### Beperkingen en risico

De architectuurtest is bewust gekoppeld aan de expliciete inventaris: bij een bewuste scriptwijziging moet de manifestvolgorde worden bijgewerkt. Statische analyse kan dynamische naamopbouw of alle runtime-relaties niet bewijzen. De test detecteert alleen cycli in gedeclareerde laad-/evaluatievoorwaarden; wederzijdse late runtime-aanroepen moeten afzonderlijk worden beoordeeld. De huidige globale namespace, klassieke scriptsemantiek, documentformaten en deployment zijn behouden.

### Commit

R4-implementatiecommit: `df3e88fe45d9bcbf19bd6fd4f0eae74ec7a0e849` — `test: add JavaScript architecture inventory`. De rapportwijziging wordt als afzonderlijke documentatiecommit vastgelegd.
