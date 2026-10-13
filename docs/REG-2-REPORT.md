# REG-2 — Implementatie- en testrapport

**Status:** geïmplementeerd op `codex/reg-2-dynamic-regions`; wacht op gebruikersacceptatie  
**Basis:** `main` op `0575365c16962238a14f27fe4cc76ab6c57b0594`  
**Contract:** `docs/REG-1-CONTRACT.md` v1.0.1

## Implementatie

REG-2 voegt drie afzonderlijke constructierecepten toe: `polygonRegion`, `circleSectorRegion` en `circleSegmentRegion`. Elk resultaat is één zelfstandig `region`-object met een stabiele ID. De bestaande `ConstructionService` resolveert de bronobjecten en volgt afhankelijkheden; herberekening, tijdelijke ongeldigheid en herstel wijzigen de identiteit van het resultaat niet.

Veelhoekgebieden gebruiken de bestaande `PolygonGeometry.validate`-regels en actuele vertexvolgorde. Sectoren en segmenten bewaren analytische cirkelgeometrie, niet een gepolygonaliseerde benadering. De bronrichtingen worden lokaal ten opzichte van het cirkelcentrum genormaliseerd. `minor` en `major` volgen de canonieke sweep en deterministische exact-180°-tie-break uit REG-1. Een majorconstructie met samenvallende richtingen wordt een volledige schijf; de renderer gebruikt daarvoor een apart cirkelpad zonder radiale naad of degeneratieve SVG-boog.

De geometrie en oppervlakte zijn berekende, niet-persistente velden. De JSON bewaart recept, bronreferenties, stijl en `areaDisplay`; de bestaande renderer, hit testing, semantic commands, geschiedenis en exportpaden worden hergebruikt. Gebieden kunnen worden geselecteerd en gestileerd, maar directe verplaatsing van hun berekende vorm wordt geweigerd. De inspector biedt vulling, rand, transparantie, optionele oppervlakteschrijfwijze en automatische of handmatige labeloffset.

De numerieke implementatie gebruikt lokale vertaling en schaalnormalisatie voor polygonoppervlakte en `atan2(abs(cross), dot)` voor cirkelhoeken. Kleine segmentoppervlakken gebruiken een reeks voor `θ−sin(θ)`; grote segmenten worden als complement van de kleine vorm berekend. `MeasurementUnits.format(..., 'area', ...)` past documenteenheid en schaal² eenmaal toe. Afgeleide geometry en oppervlakte worden bij ongeldige bron niet als stale waarde weergegeven.

## Gewijzigde bestanden

- `region-geometry.js` — zuivere regioresolutie, area, status, sweep en formattering.
- `construction-service.js` — drie recepten, bronrollen en dynamische evaluatie via de bestaande dependency graph.
- `model.js` — strikte `region`-validatie, migratie-/roundtripregels en schema-afleiding.
- `renderer.js`, `index.js` — contouren, labels, volledige schijf en canvas-hittest/selectie.
- `permission-runtime.js` — regio-rechten, bronclosure, redacties en schema-veilige restricted export.
- `editor.html`, `editor.js`, `editor-tool-instructions.js` — modulevolgorde, catalogusinvoer en inspector-/toolbediening.
- `tests/architecture.test.cjs`, `tests/helpers.cjs`, `tests/construction-contract.test.cjs`, `tests/tool-panel-reorganization.test.cjs`, `tests/browser-tool-panel-reorganization.cjs`, `tests/browser.cjs` — integratie van modulemanifest en catalogus-/runnerverwachtingen.
- `tests/region-geometry.test.cjs`, `tests/regions-contract.test.cjs`, `tests/browser-regions.cjs` — nieuwe numerieke, model-, rechten- en browserregressies.

## Schema en compatibiliteit

Een document zonder `region`-object behoudt de bestaande documentversie en het bestaande constructieschema. Met regio-objecten schrijft het model documentversie **8** en `regionSchema: 1`. Zodra een nieuw regiorecept aanwezig is, schrijft het `constructionSchema: 5`. Import valideert de combinatie strikt; onbekende of inconsistente schema's worden afgewezen. Bestaande document- en constructierecepten blijven ongewijzigd. Tijdelijke geometry-, area- en statusvelden worden nooit opgeslagen en worden na import/replay opnieuw berekend.

## Numerieke keuzes en foutafhandeling

Polygonen worden rond de eerste vertex genormaliseerd voordat de shoelace-som wordt uitgevoerd; eenvoudige polygonvalidatie blijft gedelegeerd aan `PolygonGeometry`. Cirkelrichting, radius-extremen en teruggetransformeerde coördinaten worden gecontroleerd tegen de bestaande absolute modelgrens `1e12`. De implementatie onderscheidt `INVALID_REFERENCE`, `SOURCE_INVALID`, `DEGENERATE_REGION`, `ZERO_RADIUS`, `DEGENERATE_DIRECTION`, `NUMERIC_UNDERFLOW`, `NON_FINITE_RESULT` en `COORDINATE_LIMIT`. Er wordt niet geclamped.

Bij exact 180° kiest de contractuele hoek-tie-break één halve regio. Bij continue passage door die grens wisselt de gekozen kant volgens de vastgelegde minor/major-semantiek, zonder hysterese. Volledige major-schijven worden analytisch berekend als `πr²` en via het afzonderlijke cirkelrenderpad getekend.

## Beveiliging

De drie nieuwe tool-ID's vereisen de bestaande expliciete tool- en bronrechten, inclusief de exacte `sourceTools`-grant. Regioncreatie vereist expliciete `read`- en `display`-rechten voor het nieuwe objecttype. Inspector, canvas, label en exports volgen dezelfde projectie- en dependency-closure. Bij ingetrokken of onvoldoende rechten wordt de regio en haar berekende informatie geredigeerd; restricted export leidt het constructieschema af uit de daadwerkelijk geprojecteerde recepten. Directe geometry-translatie is niet toegestaan.

## Testresultaten

- **Node:** `node --test tests/*.test.cjs` — **608 geslaagd, 0 mislukt, 0 overgeslagen**.
- **Edge:** `node tests/browser.cjs` — proces geëindigd met exitcode **0**; de volledige browserregressierunner meldde geen paginafouten. Deze runner publiceert geen enkel geaggregeerd aantal tests.
- Gerichte REG-2 Edge-scenario's geslaagd: canvasgereedschap en selectie, alle drie recepten, onafhankelijke oppervlaktefixtures, dynamische ongeldigheid/herstel met JSON-roundtrip, blokkeren van directe drag, volledige-schijf-SVG, offline PNG en JSON-roundtrip.
- De volledige Edge-run omvatte ook bestaande expressie-enginefixtures: contract 73/73, onafhankelijke afrondingsreferenties 912/912, transcendentale referenties 19/19 en bronadapter 14/14.
- UI-T1-toolpanel Edge-controle geslaagd: 40 actieve tools, 8 categorieën en responsive controles op vier viewports.
- `git diff --check` slaagde.

De Edge-suite heeft visuele PNG-bestanden onder `docs/images/t5-prep-final-ux` aangeraakt. Deze testbijwerkingen zijn niet onderdeel van de REG-2-commit. De automatische review blokkeerde het terugzetten van die bestanden omdat de wijziging meerdere bestaande bestanden buiten de REG-2-scope zou weggooien; ze zijn daarom lokaal ongemoeid gelaten.

## Bekende beperkingen en handmatige acceptatie

De Edge-runner geeft geen totaal aantal scenario's, zodat alleen de exitcode en de door de runner gerapporteerde groepen kunnen worden vermeld. De ingestelde tests controleren de wiskundige fixtures en interacties, maar gebruikersacceptatie moet nog bevestigen dat toolplaatsing, opmaak, labels en grenswisseling in de daadwerkelijke workflow begrijpelijk zijn.

- [ ] Maak een polygongebied en controleer selectie, vulling, rand en labelinstellingen.
- [ ] Maak sector en segment met zowel `minor` als `major`; beweeg richtingpunten door 180° en controleer de zichtbare zijdewisseling.
- [ ] Controleer de volledige schijf bij samenvallende richtingen en de degeneratieve minorvariant.
- [ ] Beweeg bronobjecten, forceer tijdelijke degeneratie, herstel de bron en controleer dat regio-ID en undo/redo behouden blijven.
- [ ] Controleer restricted grants en intrekking in de gebruikersworkflow.
- [ ] Exporteer JSON, SVG en offline PNG en controleer labels, eenheden, schaal en volledige-schijfcontour.

Er zijn geen wijzigingen aan REG-1-contracten, M6a/M6b-constructies, documentrechten buiten de noodzakelijke regio-integratie, of volgende milestones beoogd. REG-2 stopt hier; UI-R1 en REG-3 zijn niet gestart.
