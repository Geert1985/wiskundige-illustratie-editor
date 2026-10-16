# M8b-1 — Dynamische parallellogramconstructie

**Documentversie:** 1.0.0  
**Status:** implementatie op featurebranch; niet gemerged; handmatige gebruikersacceptatie open  
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

Productie: `construction-service.js`, `model.js`, `index.js`, `permission-runtime.js`, `semantic-sequence.js`, `editor.js`, `editor-tool-instructions.js`, `editor.html`, `renderer.js`.

Tests: `tests/parallelogram-m8b.test.cjs`, `tests/browser-parallelogram-m8b.cjs`, `tests/browser.cjs`, `tests/browser-sidebar-navigation.cjs`, `tests/browser-split-tools.cjs`, `tests/browser-tool-panel-reorganization.cjs`, `tests/left-sidebar-navigation.test.cjs`, `tests/tool-panel-reorganization.test.cjs`.

Documentatie: dit implementatieverslag en de feitelijke M8b-1 statusregel in `docs/DEVELOPMENT-ROADMAP.md`.

## 6. Bekende grenzen en handmatige acceptatie

- Volledige individuele lengtelabels, hoeklabelinstellingen en het uitgebreide eigenschappenpaneel zijn M8b-2; M8b-1 introduceert hiervoor geen tweede systeem.
- In deze fase is numerieke constructie-invoer beschikbaar tijdens de derde plaatsingsstap; een persistente bewerkingservaring komt met M8b-2.
- De gebruiker moet de acceptatiechecklist handmatig doorlopen: selecteer twee bestaande punten; maak via Q en via numerieke L/θ een parallellogram; controleer beide hoekoriëntaties; versleep A/B; sla op en laad opnieuw; controleer Undo/Redo en export.
- M8b-2 en M8b-3 zijn niet geïmplementeerd en blijven open.

## 7. Commits, verificatie en besluit

Validatie op de featurebranch: `npm test` PASS (681/681); `npm run test:edge` PASS (volledige browserchecklijst, nul page errors); `M8B1_ONLY=1 npm run test:edge` PASS (click/Q, numerieke negatieve hoek, geen Q-object, ongeldige invoer/annulering, undo/redo, bronherberekening, schema-roundtrip en SVG/PNG); `node tests/browser-ellipse-interaction.cjs` PASS (nieuw driebronnengereedschap, legacyafstandsomrecepten, Undo/Redo en annulering, nul page errors).

Commit-ID's, definitieve HEAD en pushstatus worden na commits/push ingevuld. Er is niet naar `main` gemerged.

**Technisch oordeel:** GO voor code-review en handmatige gebruikersacceptatie van M8b-1: de volledige Node- en Edge-regressies zijn geslaagd. Dit is geen productacceptatie en geen autorisatie voor M8b-2 of M8b-3.
