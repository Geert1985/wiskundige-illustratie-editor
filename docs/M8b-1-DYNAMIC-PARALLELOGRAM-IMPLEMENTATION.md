# M8b-1 — Dynamische parallellogramconstructie

**Documentversie:** 1.0.1  
**Status:** door gebruiker handmatig geaccepteerd op 2026-10-16; via [PR #21](https://github.com/Geert1985/wiskundige-illustratie-editor/pull/21) geïntegreerd in `main`, mergecommit `adc66387ceb21ed99b2b1410834b4823d6fd76a1`  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Basis:** `origin/main` `133fd6c998262f7de1f330d358c2f0b3de301525` (PR #20 geïntegreerd)  
**Branch:** `codex/m8b-1-dynamic-parallelogram`  
**Normatief contract:** [M8b-PARALLELLOGRAMMEN-CONTRACT.md](M8b-PARALLELLOGRAMMEN-CONTRACT.md) v1.1.0

## 1. Uitgevoerde scope en architectuurbeslissingen

M8b-1 voegt het recept `parallelogramBySideAngle` toe aan `ConstructionService`. Het resultaat blijft één bestaand `polygon` met vier vaste indices `[A,B,C,D]`; de service leidt C en D af uit de volledige puntbronnen A/B en de autoritatieve parameters `sideLength` en `signedAngle`. De bestaande `PolygonGeometry`, dependency graph, polygonrenderer, selectie-, opslag-, export- en geschiedenisroutes blijven de eigenaars van hun bestaande verantwoordelijkheden. Tijdelijk ongeldige gekoppelde geometrie wordt niet als oude contour gerenderd en kan via dezelfde bronnen herstellen.

De sidebar en fullscreen delen `ToolCatalog`. Het contextuele bronplan vult A voor en gaat na B naar de bestaande plaatsingsinteractie. De derde pointerpositie Q bepaalt uitsluitend L en θ; één geautoriseerde `construction.create` maakt daarna het polygon. Dezelfde derde stap biedt numerieke lengte- en hoekvelden; documenteenheden worden bij invoer geconverteerd en de opgeslagen hoek blijft radialen. Preview gebruikt de bestaande rAF-previewroute en maakt geen modelobject of geschiedenisstap.

`PermissionRuntime` valideert expliciet het nieuwe constructiepayload en biedt `construction.setParallelogramParameters` als atomair author-commando. Het parametercommando is replaybaar via `SemanticSequence`; het bestaande padpositiecommando blijft beperkt tot padconstructies. Creatie en parameterwijziging gebruiken de bestaande locks-, bron- en autorisatiecontroles.

Er is geen nieuw objecttype, geen aparte `showMeasurement`-laag, geen M8b-meetweergave-editor, en geen nieuw `parallelogramSchema`. M8b-2 blijft eigenaar van het uitgebreide eigenschappenpaneel en de individuele standaardzichtbaarheid van metingen.

## 2. Schema- en compatibiliteitsbeleid

- `constructionSchema: 8` wordt alleen geschreven als ten minste één `parallelogramBySideAngle` in het document voorkomt. Een document zonder M8b houdt zijn bestaande hoogste vereiste schema.
- Schema 8 wordt door de importer expliciet herkend en alleen geaccepteerd wanneer het overeenkomt met het aanwezige parallellogramrecept. M8a-recepten, waaronder schema 6 en 7, blijven in gemengde documenten geldig.
- Er is geen nieuw `parallelogramSchema` en geen documentversie 11. Documentversie 10 en `measurementSchema: 1` blijven door GEO-UI-individuele metingen bepaald.
- Legacyconstructies, polygonen/driehoeken, REG-2, lagen/groepen, gestructureerde tekst en individuele metingen blijven binnen bestaande migratie- en roundtrippaden.
- Ongeldige parameterpayloads en schema/receptcombinaties worden vóór documentvervanging verworpen.

## 3. Testimpactmatrix

| Gebied | Testdekking | Resultaat |
|---|---|---|
| Onafhankelijke wiskundige fixtures | `tests/parallelogram-m8b.test.cjs`: 60° en −60° gouden waarden, omtrek/oppervlakte, rechthoek, ruit/vierkant | PASS, opgenomen in Node-suite |
| Recept, validatie en herstel | Bronrollen/aantal, parameters, numerieke grenzen, beweging, invaliditeit/herstel, renderonderdrukking | PASS, opgenomen in Node-suite |
| Commando's en geschiedenis | Eenmalige creatie, atomair parametercommando, Undo/Redo, SemanticSequence | PASS, opgenomen in Node-suite |
| Opslag en objectintegratie | Schema-8-roundtrip, GEO-UI-mixed document, detach/duplicatie, afhankelijke constructies, restricted grants | PASS, opgenomen in Node-suite |
| Browserinteractie M8b-1 | `tests/browser-parallelogram-m8b.cjs`: A/B/Q, preview, numerieke negatieve hoek, annulering, undo/redo, bronbeweging, JSON-roundtrip, SVG/PNG | Gerichte Edge-test PASS; geen page errors |
| Ellipsregressie | `node tests/browser-ellipse-interaction.cjs`: nieuw driebronstool, permanente Q, live preview/cancel, Undo/Redo, oud opgeslagen somrecept en directe legacyconstructie | PASS; geen page errors |
| Volledige Node-regressie | `npm test` | PASS: 681/681, 0 failed |
| Volledige Edge-regressie | `npm run test:edge` | PASS; volledige browserlijst doorlopen, nul page errors |

Tijdens Edge-validatie zijn bestaande UI-tests bijgewerkt om de actuele catalogus te weerspiegelen: één extra “Vierhoekconstructies”-subgroep, 43 geïmplementeerde tools en zes constructiesubgroepen. De testasserties blijven exact; ze zijn niet verwijderd of versoepeld.

## 4. Commando- en interactiepaden

- Gebruikersroute: `ToolCatalog` → bestaande A/B-broninteractie → derde plaatsingsstap → preview/numerieke invoer → `PermissionRuntime` `construction.create` → `ConstructionService` → één polygon.
- Parametereditiebasis voor M8b-2: author-command `construction.setParallelogramParameters`, met optionele `sideLength` en/of `signedAngle`; volledige UI-editor is buiten scope.
- Contextueel radiaalmenu: `ConstructionService.contextualPlans` geeft een placement-plan met A vooringevuld; gemeenschappelijke `EditorApp.startContextConstruction` blijft de starter.
- Q is ephemeral. Het verschijnt niet in `sources`, documentobjecten of constructieparameters.

## 5. Gewijzigde bestanden

Productie: `construction-service.js`, `model.js`, `index.js`, `permission-runtime.js`, `semantic-sequence.js`, `editor.js`, `editor-tool-instructions.js`, `editor.html`, `renderer.js`; code-reviewfollow-up: `measurement-geometry.js`.

Tests: `tests/parallelogram-m8b.test.cjs`, `tests/browser-parallelogram-m8b.cjs`, `tests/browser-m8b-review-fixes.cjs`, `tests/browser.cjs`, `tests/browser-sidebar-navigation.cjs`, `tests/browser-split-tools.cjs`, `tests/browser-tool-panel-reorganization.cjs`, `tests/left-sidebar-navigation.test.cjs`, `tests/tool-panel-reorganization.test.cjs`.

Documentatie: dit implementatieverslag en de feitelijke M8b-1 statusregel in `docs/DEVELOPMENT-ROADMAP.md`.

## 6. Bekende grenzen en handmatige acceptatie

- Volledige individuele lengtelabels, hoeklabelinstellingen en het uitgebreide eigenschappenpaneel zijn M8b-2; M8b-1 introduceert hiervoor geen tweede systeem.
- In deze fase is numerieke constructie-invoer beschikbaar tijdens de derde plaatsingsstap; een persistente bewerkingservaring komt met M8b-2.
- De gebruiker heeft de functionele test geslaagd verklaard op 2026-10-16; de acceptatiechecklist omvatte: selecteer twee bestaande punten; maak via Q en via numerieke L/θ een parallellogram; controleer beide hoekoriëntaties; versleep A/B; sla op en laad opnieuw; controleer Undo/Redo en export.
- M8b-2 en M8b-3 zijn niet geïmplementeerd en blijven open.

## 7. Commits, verificatie en besluit

Validatie op de featurebranch: `npm test` PASS (681/681); `npm run test:edge` PASS (volledige browserchecklijst, nul page errors); `M8B1_ONLY=1 npm run test:edge` PASS (click/Q, numerieke negatieve hoek, geen Q-object, ongeldige invoer/annulering, undo/redo, bronherberekening, schema-roundtrip en SVG/PNG); `node tests/browser-ellipse-interaction.cjs` PASS (nieuw driebronnengereedschap, legacyafstandsomrecepten, Undo/Redo en annulering, nul page errors).

De drie implementatiecommits zijn:

1. `c64b376` — `feat(model): add schema 8 parallelogram recipe`
2. `9e4a60a` — `feat(editor): add parallelogram placement and commands`
3. `af41927` — `test(m8b): cover parallelogram integration and regressions`

4. `a5297c5` — `docs(m8b): record implementation commit ledger`
5. `0ee2a77` — `fix(m8b): redact stale geometry and export schema 8`

De code-reviewfollow-up is na de oorspronkelijke oplevering toegevoegd op dezelfde featurebranch. Het huidige verslag bevat de bijgewerkte regressiestatus; de uiteindelijke branch-HEAD en pushbevestiging staan in het opleverbericht. De oorspronkelijke featurebranch-oplevering werd nog niet gemerged; de latere integratie gebeurde na expliciete gebruikersacceptatie via PR #21 op 2026-10-16.

**Eindoordeel:** M8b-1 is handmatig geaccepteerd en geïntegreerd via PR #21. Codex rapporteerde 683/683 Node PASS en de volledige Edge-suite PASS na de reviewcorrecties; deze testresultaten zijn niet onafhankelijk via GitHub Actions op de feature-HEAD geverifieerd. M8b-2 en M8b-3 blijven open en vereisen een nieuwe opdracht.

## 8. Code-reviewfollow-up — restricted export en ongeldige geometrie

Na de initiële M8b-1-oplevering zijn twee reviewbevindingen afzonderlijk gereproduceerd en opgelost:

1. `PermissionRuntime.exportData()` projecteerde de parallellogramparameters niet en koos bij gemengde schema's maximaal schema 7. Restricted JSON met M8b kon daardoor onjuist of onleesbaar zijn. De export projecteert nu `sideLength`/`signedAngle`, kiest schema 8 als het geëxporteerde document een M8b-recept bevat, en schrijft documentversie 10 plus `measurementSchema: 1` als GEO-UI-metingen aanwezig zijn. De bestaande controle op alle constructiebronnen blijft vóór export staan en weigert gedeeltelijke export fail-closed.
2. Bij ongeldige brongeometrie liet `ConstructionService.resolve()` oude parallellogramvertices in het model en daarmee in opslag/projectie/export staan. De resolver verwijdert nu uitsluitend de berekende `vertices` van een ongeldig gekoppeld parallellogram; ID, constructierecept, bronrelaties, parameters en afhankelijke objecten blijven bestaan. `PolygonGeometry.validate()` blijft de enige geldige-geometryvalidator. De importer accepteert voor dit recept een ontbrekende cache, waarna de resolver geldige vertices opnieuw berekent zodra de bronnen herstellen. `MeasurementGeometry` behoudt ondertussen de vaste meetinstellingssleutels `side:0..3` en `angle:0..3`, ook zolang de vertexcache ontbreekt.

De nieuwe Node-regressies zijn eerst uitgevoerd tegen de foutieve toestand: ze faalden doordat `vertices` nog aanwezig was en restricted export schema 7 koos in plaats van 8. Daarna slaagden ze na de correcties. De Edge-regressie controleert ook documentversie 10, metingschema 1, fail-closed bronrechten, het ontbreken van stale vertices in projectie/export/roundtrip en automatisch herstel.

**Nacontrole:** `npm test` PASS (683/683); `npm run test:edge` PASS (volledige Edge-suite, geen page errors); gerichte Node-test PASS (10/10); gerichte Edge-regressie PASS (4/4 reviewcontroles). De reviewcorrecties staan op dezelfde featurebranch en wijzigen geen M8b-2/M8b-3-presentatiecode.
