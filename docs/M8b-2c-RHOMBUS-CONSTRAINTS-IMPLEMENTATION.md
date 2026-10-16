# M8b-2c — Meetkundige snaps en blijvende vormvoorwaarden

**Documentversie:** 1.0.0  
**Status:** geïmplementeerd op featurebranch; wacht op code-review en handmatige gebruikersacceptatie  
**Basisbranch:** `codex/m8b-2b-ux-geometry-integration`  
**Gecontroleerde basiscommit:** `5f5551cc589ed0aff8ad83b9154f3ceb086dc7e0`  
**Featurebranch:** `codex/m8b-2c-rhombus-constraints`  
**Merge:** niet uitgevoerd

De implementatie is opgesplitst in drie controleerbare commits: persistente geometrie/schema/commandvalidatie; interactie, snaps en inspector; tests en statusdocumentatie.

| Commit | Inhoud |
|---|---|
| `5b2aee4` | Persistente gelijkheidsmodus, resolver, schema 9, commandvalidatie en Node-regressies |
| `b3df595` | Snapinteractie, preview, eigenschappenbediening en Edge-regressies |
| `8a381b7` | Contract/roadmap/statusdocumentatie en mixed-schema-testfixtures |

## Ontwerp- en opslagbeslissingen

M8b-2c gebruikt uitsluitend het bestaande `polygon`-object, `parallelogramBySideAngle`-recept, de bestaande dependency graph en de bestaande polygon-/render-/commandoinfrastructuur. Een ontbrekende `sideLengthMode` blijft vaste `sideLength` betekenen. De nieuwe persistente modus `sideLengthMode:"matchAB"` lost bij iedere berekening de lengte exact op als actuele `|AB|`; de optionele bewaarde `sideLength` is dan alleen compatibiliteitsinformatie en stuurt de geometrie niet.

Documenten met alleen vaste parallellogrammen blijven `constructionSchema:8` gebruiken. Een document met ten minste één `matchAB`-recept gebruikt `constructionSchema:9`; schema 8 met dat veld wordt geweigerd. Gemengde M8a-, regio-, polygon- en GEO-UI-documenten blijven ondersteund. GEO-UI-metingen blijven documentversie 10 met `measurementSchema:1`; M8b-2c introduceert geen documentversie 11.

Het bestaande `construction.setParallelogramParameters`-commando accepteert nu de getypeerde `sideLengthMode`-wijziging. De modusovergang wordt atomair gevalideerd en blijft één command-/historie-/SemanticSequence-pad. Bij `fixed → matchAB` blijven A, B en θ behouden. Bij `matchAB → fixed` wordt de actuele geldige `|AB|` eerst naar `sideLength` gekopieerd, zodat de figuur niet springt. Een ongeldige AB-bron blokkeert deze laatste overgang.

## Snap, preview en vormweergave

Vrije Q-plaatsing gebruikt een gelijke-zijdensnap met activering op 8 CSS-pixels en loslating op 12 CSS-pixels, omgerekend met de actuele schermtransformatie. De Q-positie wordt radiaal op `|AB|` geprojecteerd; de opgeslagen lengte is dus exact gelijk aan AB. Deze snap kan onafhankelijk met de bestaande ±90°-snap werken. Automatische snaps blijven uit bij expliciet bestaand Q en exacte numerieke invoer. De preview toont de aanduiding **Gelijke zijden** en de bestaande D-positie krijgt een tijdelijke markering; die UI-markeringen worden niet opgeslagen.

De eigenschappensectie biedt **Gelijke zijden behouden** aan. In matchAB-modus is L niet vrij bewerkbaar en wordt de actuele afgeleide lengte getoond. De vormclassificatie Parallellogram/Ruit/Rechthoek/Vierkant is alleen-lezen en wijzigt de geometrie niet. De parallellogramsectie gebruikt de live bronpuntnamen; verouderde polygonrandcontext wordt verwijderd terwijl een bij de actuele selectie passende randreferentie behouden blijft.

Wanneer een parallellogram tijdelijk ongeldig wordt, blijven recept en objectidentiteit bestaan en wordt de verouderde vertexgeometrie verwijderd. De bestaande index-/randafhankelijkheden behouden hun bronrol tijdens deze ongeldigheid; afhankelijke constructies lossen ongeldig op en herstellen automatisch zodra de bron weer geldig is.

## Gewijzigde bestanden

- `construction-service.js` — matchAB-oplossing, modusvalidatie, vormclassificatie en stabiele polygononderdeelreferenties bij herstelbare ongeldigheid.
- `model.js` — schrijf-/importregels voor schema 8 en 9.
- `permission-runtime.js` — geautoriseerde moduswissel en correcte commandopayload-/restricted-exportondersteuning.
- `editor.js`, `editor-tool-instructions.js`, `renderer.js` — gelijke-zijdensnap, hysterese, gecombineerde hoek-snap, schakeloptie, previewfeedback en inspectorweergave.
- `editor-radial-properties.js` — validatie en opruimen van verouderde randcontext.
- `tests/parallelogram-m8b2c.test.cjs` — onafhankelijke numerieke fixtures, modi, commandoreplay, schema/export, invaliditeit en afhankelijke randpunten.
- `tests/browser-parallelogram-constraints-m8b2c.cjs`, `tests/browser.cjs` — echte Edge-interactie en volledige suite-integratie.
- `docs/M8b-PARALLELLOGRAMMEN-CONTRACT.md` — bijgewerkt naar v1.3.0.
- `docs/DEVELOPMENT-ROADMAP.md` — branchstatus bijgewerkt; M8b-3 blijft open.
- `AGENTS.md` — actieve M8b-contract- en branchstatus gelijkgetrokken.

## Testimpactmatrix

| Gebied | Dekking |
|---|---|
| Onafhankelijke wiskunde | Exacte dynamische vierkantfixture (4×4 en na verplaatsing 6×6), vier zijden, omtrek, oppervlakte, geroteerde basis en negatieve hoek |
| Modus en historie | Vaste lengte, `matchAB`, overgang zonder sprong, atomair afwijzen, SemanticSequence-replay; Edge Undo/Redo van de inspectoroptie |
| Snapinteractie | Edge vrije plaatsing, gelijke-zijdensnap, gecombineerde ±90°-snap, bestaande Q-voorrang en exacte numerieke invoer |
| Opslag en rechten | Schema 8/9, documentversie 10 met metingen, gemengde recept roundtrip en restricted export met ontbrekende bronrechten |
| Afhankelijkheden | `pointOnSegment`-randreferentie wordt ongeldig bij samenvallende A/B en herstelt met dezelfde identiteit |
| M8b-2b-reviewpunten | Live puntnamen in inspector; geldige randcontext blijft aanwezig en context naar ander object wist de randreferentie |
| Regressies | Bestaande suites `npm test` en `npm run test:edge`, plus gerichte Edge-module |

## Uitgevoerde verificatie

| Commando | Resultaat |
|---|---|
| `node --test tests/parallelogram-m8b2c.test.cjs` | PASS — 7/7 Node-tests |
| `$env:M8B2C_ONLY='1'; node tests/browser.cjs` | PASS — gerichte Microsoft Edge-module, geen page errors |
| `npm test` | PASS — 705/705 Node-tests |
| `npm run test:edge` | PASS — volledige Edge-suite; alle opgenomen modules geslaagd en `pageErrors: []` |

De gerichte Node-run was PASS — 7/7. De gerichte Edge-module was PASS voor gelijke-zijdensnap, gecombineerde 90°-snap, matchAB-herberekening, Q-/numerieke prioriteit, dynamische namen/randcontext, inspector Undo/Redo, schema-9-roundtrip en nul page errors. Tijdens de eerste volledige Node-run faalde een bestaande T3-test voor dynamische auteurstekst bij een verborgen bron. De oorzaak was een te brede rendererfilter; die filter is verwijderd en de volledige Node-suite is daarna opnieuw uitgevoerd met 705/705 PASS. De Edge-suite genereerde screenshots in bestaande documentatiemappen; deze testartefacten zijn teruggezet en zijn niet onderdeel van de featurewijzigingen.

De Edge-run gebruikt lokaal Microsoft Edge via Playwright. De browsermodule rapporteert de daadwerkelijke interactieresultaten en `pageerror`s. Er zijn geen bestaande tests verwijderd of verzwakt.

## Bekende beperkingen en handmatige acceptatie

- Het classificatielabel gebruikt een kleine numerieke tolerantie voor presentatie. De classificatie is geen constraint en verandert geen opgeslagen parameters.
- In `matchAB` blijft de historische `sideLength`-compatibiliteitswaarde mogelijk achter bij latere bronverplaatsingen; de actuele geometrie is uitsluitend gebaseerd op `|AB|`.
- Automatische snaps worden alleen toegepast bij vrije plaatsing. Bestaand punt Q en exacte numerieke invoer blijven expliciet leidend.

Handmatige acceptatiechecklist:

1. Plaats een vrije aanwijzer binnen en daarna buiten de gelijke-zijdensnapzone; controleer de markering, schakelaar en 8/12-pixel-hysterese.
2. Construeer een ruit en een vierkant met gecombineerde lengtesnap en 90°-snap.
3. Versleep A en B; controleer gelijkheid, vaste vertexindices, randafhankelijke punten en automatisch herstel na tijdelijk samenvallen.
4. Schakel **Gelijke zijden behouden** uit en weer in; controleer dat de vorm bij de overgang niet springt en dat Undo/Redo één stap gebruikt.
5. Controleer bestaand Q, exacte L-/θ-invoer, dynamische bronpuntnamen en contextuele randconstructies.
6. Sla vaste schema-8- en gekoppelde schema-9-documenten op en laad ze opnieuw; controleer ook export en restricted bronrechten.

## UX-correctie na branchreview

Tijdens stap 3 van de constructie toont het lengteveld nu de effectieve AD-lengte wanneer **Gelijke zijden behouden** is ingeschakeld. De waarde wordt alleen bijgewerkt als het veld niet actief bewerkt wordt. Uitschakelen toont de vaste lengte die de bestaande omschakelactie heeft overgenomen, zodat veld, preview en statusregel overeenkomen.

De Edge-regressie voert tijdens dezelfde plaatsingsstap `L = 2,5` in met `AB = 4`, schakelt de voorwaarde in en controleert dat het uitgeschakelde veld én de status `AD = 4` tonen. Na uitschakelen controleert de test dat het veld weer actief is en nog steeds `4` toont. Daarna wordt de plaatsing geannuleerd en de bestaande numerieke constructiechecks gaan door met de oorspronkelijke documentfixture.

| Verificatie na de UX-correctie | Resultaat |
|---|---|
| `$env:M8B2C_ONLY='1'; node tests/browser.cjs` | PASS — gerichte Edge-module, beide toggleovergangen en nul page errors |
| `npm test` | PASS — 705/705 Node-tests |
| `npm run test:edge` | PASS — volledige Microsoft Edge-suite, `pageErrors: []` |

Deze correctie wijzigt alleen het plaatsingsveld en voegt geen aparte meet- of snaparchitectuur toe.

## Technisch oordeel

**Technisch GO voor code-review en handmatige gebruikersacceptatie; geen merge-GO.** Alle gerichte regressies, de volledige Node-suite en de volledige Edge-suite zijn geslaagd. De browsermodule rapporteerde nul page errors. Gebruikersacceptatie en merge blijven open.
