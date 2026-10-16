# WIE M8b-2 — Meetweergave en eigenschappen

**Documentversie:** 1.0.0  
**Status:** featurebranch ter gebruikersacceptatie; niet geïntegreerd in `main`  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Gecontroleerde basis:** `origin/main` `26d33c0065ed77f9189fe7b9fb69f6ab71733610`  
**Branch:** `codex/m8b-2-measurements-inspector`  
**M8b-1-integratie:** PR #21, mergecommit `adc66387ceb21ed99b2b1410834b4823d6fd76a1`

## Architectuurbeslissingen

- De parallellogram blijft één bestaand `polygon` met recept `parallelogramBySideAngle`, bronnen A/B en canonieke `sideLength`/`signedAngle`.
- Maatwaarden en labels hergebruiken `MeasurementGeometry`, `MeasurementUnits`, `object.measurements`, de bestaande individuele-labelrenderer en het bestaande `object.setProperties`-commando.
- De drie zichtbare standaardmetingen worden in de bestaande `Engine.construct()`-aanmaak als polygoninstellingen opgenomen. Daardoor staan figuur en labels in dezelfde documentmutatie, Undo-stap en redo-snapshot.
- Nieuwe parallellogrammen slaan documentversie 10, `measurementSchema:1` en `constructionSchema:8` op. De bestaande writer bepaalt deze versies automatisch. Oude M8b-1-bestanden zonder `measurements` blijven zonder migratie leesbaar en behouden hun oorspronkelijke zichtbaarheid.
- De bestaande `construction.setParallelogramParameters` route wordt vanuit de gespecialiseerde geometriesectie aangeroepen. Lengte wordt met de document-schaal één keer omgerekend; de hoek wordt met de documentinstelling tussen graden/radialen en intern radialen omgerekend.
- De inspector toont constructieparameters apart van berekende waarden. De labels `angle:0` enzovoort blijven binnenhoeken; `signedAngle` is uitsluitend de gerichte invoerparameter.
- Voor ongeldige gekoppelde geometrie tonen berekende inspectorwaarden `Niet beschikbaar`. De bestaande renderer verbergt individuele labels zolang het recept ongeldig is. Bronidentificatie wordt in restricted modus als afgeschermd getoond wanneer de bronrechten ontbreken.
- De geometriesectie gebruikt dezelfde bestaande `organizeGeometryInspector()`-groep; de metingen blijven in de gedeelde GEO-UI-sectie en de radiale filters tonen dezelfde controls.
- Restricted projectie controleert parallellogrambronrechten expliciet: zonder lees-, weergave- en constructiebronrechten verdwijnen figuur, maatwaarden en labels uit de projectie en SVG. JSON-export weigert een zichtbaar gekoppeld parallellogram waarvan bronrechten ontbreken, conform fail-closed gedrag.

## Gewijzigde bestanden

- `index.js` — atomaire standaardinstellingen voor nieuw geconstrueerde parallellogrammen.
- `editor.js` — gespecialiseerde parameters en afgeleide meetwaarden, commandobediening, duidelijke polygon-meetnamen.
- `editor-radial-properties.js` — geometrie-icoon voor de nieuwe inspectorsectie.
- `permission-runtime.js` — expliciete bronrechten in parallellogramprojectie en fail-closed JSON-export.
- `tests/parallelogram-m8b.test.cjs` — M8b-1 roundtripverwachting aangepast aan de goedgekeurde M8b-2 standaardmetingen.
- `tests/parallelogram-m8b2.test.cjs` — gerichte mathematische, model-, command-, historie-, roundtrip-, invaliditeits-, restricted-projectie/export- en snapshottests.
- `tests/browser-parallelogram-measurements-m8b2.cjs` — Edge-test voor creatie, standaardlabels, parameters, labelinstellingen, graden/radialen, invaliditeit/herstel en export.
- `tests/browser.cjs` — gerichte Edge-test beschikbaar als aparte suite en opgenomen in de volledige suite.
- `docs/DEVELOPMENT-ROADMAP.md` — actuele featurebranchstatus.
- Dit implementatieverslag.

## Testimpactmatrix

| Gebied | Testdekking | Resultaat |
|---|---|---|
| Wiskundige waarden | Positieve/negatieve hoek, alle vier binnenhoeken, zijden, omtrek, oppervlakte en gedraaide AB | 6 gerichte Node-tests geslaagd |
| Defaults en historie | Exact `side:0`, `side:3`, `angle:0` zichtbaar; één constructie-object; creatie-/parameter-Undo/Redo | 6 gerichte Node-tests geslaagd |
| GEO-UI-opslag | Individuele zichtbaarheid, vrije tekst, precisie, offset en JSON-roundtrip | Gerichte Node-dekking toegevoegd |
| Ongeldig/herstel | Geen oude vertices/meetwaarden of labels; stabiele keys na herstel | Gerichte Node-dekking toegevoegd |
| Polygoninteractie | Duplicatie en detach behouden toepasselijke maatinstellingen | Gerichte Node-dekking toegevoegd |
| Restricted rechten en projectie | Meetinstellingen en afgeschermde parallellogrambronnen | PASS — bronrechten filteren projectie en SVG; JSON faalt gesloten |
| Volledige Node-suite | `npm test` | PASS — 691/691 |
| Gerichte Edge-suite | `M8B2_ONLY=1 npm run test:edge` | PASS — labels, parameters, eenheden, lock, Undo/Redo, bronverplaatsing, invaliditeit/herstel, schema-roundtrip en SVG/PNG; geen page errors |
| Volledige Edge-suite | `npm run test:edge` | PASS — volledige bestaande suite inclusief M8b-2; geen page errors |

## Bekende beperkingen en acceptatie

- De Edge-suite dekt het zwevende inspectorpad, de radiale geometriekeuze, label slepen/reset en lockbediening. Handmatige visuele acceptatie in normaal en fullscreen blijft gewenst.
- Restricted bronprojectie en fail-closed JSON-export zijn gericht in Node getest; de bestaande browser-permission regressiesuite slaagde in de volledige Edge-run.

### Handmatige acceptatiechecklist

1. Maak een parallellogram en controleer dat AB, DA en binnenhoek A standaard zichtbaar zijn.
2. Wijzig L en θ in de geometriesectie en controleer beide oriëntaties en de read-only waarden.
3. Selecteer de radiale keuzes Geometrie en Meting; controleer dat dezelfde bediening zichtbaar blijft.
4. Schakel individuele zijden/hoeken in en uit, pas notatie aan, verplaats een label en herstel de positie.
5. Test documenteenheden, hoekeenheden, Undo/Redo en bronverplaatsing.
6. Controleer tijdelijk ongeldige brongeometrie en automatisch herstel.
7. Controleer lock/restricted gedrag, opslaan/herladen en SVG/PNG-export.
8. Herhaal de paneelcontrole in fullscreen.

## Technisch oordeel

**GO voor gebruikersacceptatie.** De volledige Node- en Edge-suites zijn groen. De implementatie blijft binnen de bestaande meet-, renderer-, command-, historie- en inspectorarchitectuur. Er zijn geen M8b-3-wijzigingen of nieuwe constructie-/objecttypen toegevoegd. Integratie op `main` wacht op gebruikersacceptatie.

## Validatielog

| Commando | Werkelijk resultaat |
|---|---|
| `node --test tests/parallelogram-m8b.test.cjs tests/parallelogram-m8b2.test.cjs` | PASS — 18/18 |
| `npm test` | PASS — 691/691 |
| `M8B2_ONLY=1 npm run test:edge` | PASS — gerichte suite; geen page errors |
| `npm run test:edge` | PASS — volledige Edge-suite; geen page errors |
