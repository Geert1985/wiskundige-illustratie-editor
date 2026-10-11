# JavaScript-refactoringrapport — R1–R3

**Repository:** `Geert1985/wiskundige-illustratie-editor`
**Branch:** `chatgpt/editor-development`
**Uitgangs-HEAD vóór R1:** `123c40b744ccaa70b51367a743201b350c2b4697`
**Rapportstatus:** R1, R2 en R3 uitgevoerd; R4 is niet gestart.

## Samenvatting

De refactoring is uitgevoerd in drie afzonderlijke commits. R1 verwijderde één aantoonbaar ongebruikt stubbestand. R2 bracht twee tijdelijke SVG-presentatieoverlays onder in één module met behoud van hun bestaande service-interfaces. R3 haalde toolinstructies en de presentatie daarvan uit `editor.js` naar een kleine, expliciete instructiemodule. Er zijn geen wiskundige algoritmen, opgeslagen documentstructuren, permissies, canvasrender-eigenaars of pointerinteracties gewijzigd.

De volledige Node-suite slaagde na elke fase. De volledige Edge-regressiesuite slaagde na elke fase; de browseruitvoer rapporteerde `pageErrors: []`. Handmatige gebruikersacceptatiecontroles zijn niet uitgevoerd.

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

R4 (afhankelijkheden, laadvolgorde en automatische architectuurcontrole) is niet gestart.
