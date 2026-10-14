# REG-2 — Implementatie- en testrapport

**Status:** gerichte correctieronde uitgevoerd op `codex/reg-2-dynamic-regions`; klaar voor nieuwe onafhankelijke code-review
**Basis:** `main` op `0575365c16962238a14f27fe4cc76ab6c57b0594`  
**Contract:** `docs/REG-1-CONTRACT.md` v1.1.0

### Gerichte sectoren/segmenten en expliciete gebiedskeuze — 14 oktober 2026

Nieuwe creatie schrijft expliciet `extent: directed`. Het recept blijft schema 5, de regio schema 1 en het document versie 8; de uitbreiding is één gesloten enumwaarde, geen nieuw veld of brontype. Een oudere reader weigert deze onbekende enumwaarde atomair. Bestaande `minor`-/`major`-bestanden worden zonder migratie gelezen en blijven inhoudelijk identiek. Bron A is begin, B einde; de standaardboog loopt tegenwijzerzin met modulo 2π. Exact gelijke richtingen zijn degeneratief, en alleen de expliciete `major`-modus maakt bij gelijke richtingen een volle schijf. Rond 180° ontstaat geen zijdewisseling; rond 0/360° geldt de contractuele modulo-overgang, zonder verborgen geschiedenis.

De instructiepanelen bieden nu een zichtbare Gebiedsmodus-keuze: Gerichte sector / Gerichte segmentboog, Altijd kleinste gebied en Altijd grootste gebied. De keuze wordt expliciet in het recept opgeslagen. Een gekozen modus heeft voorrang op de behouden Shift-sneltoets voor major; elke nieuwe gereedschapskeuze start weer in directed. De author-inspector kan een bestaande regio via `construction.setExtent` wijzigen als één undo-stap, met behoud van ID. Locked objecten en ongeldige waarden worden geweigerd; restricted actors kunnen geen bestaande modus wijzigen en behouden de bestaande tool-/bron-grants voor creatie.

De nieuwe Node-regressies controleren ook omwisseling van A/B, labels/selectie, legacy-roundtrips en source-revocation. De Edge-regressie klikt beide tools daadwerkelijk aan met een gerichte bronhoek van 270° en kiest expliciet minor: het opgeslagen recept en de ruwe area worden klein. Een inspectorwissel naar directed geeft 270° en werkt met undo/redo. Onafhankelijke pixels uit de offline-PNG-export bewijzen dat de kleine sector/het kleine segment op de juiste zijde wordt gevuld, het complement niet wordt gevuld en niets buiten de broncirkel wordt gekleurd. De bestaande SVG-boogtest is aangescherpt om iedere regio afzonderlijk te controleren in plaats van steeds het eerste pad.

Verificatie na deze uitbreiding: volledige Node-suite **614/614 geslaagd**; gerichte Node-suite (regio's + lifecycle) **90/90 geslaagd**, aanvullende gerichte checks **2/2 geslaagd**; gerichte Edge-suite exitcode **0**, `pageErrors: []`. `git diff --check` slaagt. De volledige Edge-suite is eveneens geslaagd (exitcode 0, pageErrors: []), inclusief de nieuwe klik- en PNG-pixelregressies. Geen bestaande assertions verwijderd of verzwakt. UI-R1 niet gestart; de branch stopt voor review en wordt niet naar main gemerged.

De nieuwe `directed`-waarde werd door de commandruntime afgewezen bij de laatste puntkeuze (`INVALID_COMMAND`). De allowlist van `construction.create` accepteert nu die waarde naast `minor` en `major`. Een eerder ingeslopen letterlijke `\n` in `region-geometry.js` is hersteld: deze syntaxfout verhinderde het laden van `RegionGeometry` en veroorzaakte de eerdere `resolve`-melding. De standaardcreatie vanuit de editor gebruikt nu `directed`.

Gerichte Node-controle: **6/6 geslaagd**, inclusief semantische commands, oppervlakten bij 90/180/240/300 graden, passage door 180 en 0/360, exacte degeneratie, JSON-roundtrip en replay. De gerichte Edge-suite is geslaagd met `pageErrors: []`; de nieuwe echte klikfixture kiest cirkel, A en B, controleert `extent: directed`, de oppervlakte en undo/redo. Bestaande SVG/PNG- en restricted controles in die suite slagen eveneens. Contract v1.1.0 en de modekeuze-UI zijn nu geïmplementeerd.

### Correctie sectorboog — 14 oktober 2026

`renderer.js` tekende de sectorboog met SVG-sweepflag 1. De modelhoeken draaien in wiskundige coördinaten met y omhoog, terwijl `Renderer.mapY` y voor SVG omkeert. De boog liep daardoor in schermcoördinaten de andere kant op dan de hoekgeometrie, waardoor het gekleurde deel niet met de bedoelde zijde van de broncirkel samenviel. De sweepflag is nu 0. Middelpunt en radii blijven getransformeerd via respectievelijk `mapX/mapY` en `radius * scale()`, gelijk aan de broncirkel. De gesloten sectorkontour bevat beide armen als gestreken begrenzingen.

Gerichte regressie in `tests/regions-contract.test.cjs` controleert minor- en majorboogpaden, gelijke centrumcoördinaten en straal met de broncirkel, de scherm-sweepflag, zichtbare radiale begrenzingen en herberekening na wijziging van een richtingpunt. De Edge-regressierunner meldt `sectorSvgAndOfflinePng` naast de bestaande SVG- en offline-PNG-controles. Gerichte Node-controle: **5/5 geslaagd**; `git diff --check`: geslaagd. Deze wijziging wacht op nieuwe onafhankelijke review.

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

### Correctieronde na code-review — 13 oktober 2026

- `model.js`: asreferenties accepteren nu constructieschema 3, 4 en 5. De afzonderlijke controle blijft schema 5 uitsluitend toestaan met een regiorecept. Hoekarmen blijven schema 4/5 vereisen en bestaande schema-2-constructies blijven schema 2–5 accepteren.
- `model.js`: de gedeelde rijke-tekstcontrole voor documentversie 7/8 controleert expliciet `textSchema` tegen de numerieke waarden 1, 2 en 3, voordat de vereiste inhoudsschemaversie wordt vergeleken. Ontbrekende, ongeldige en ontoereikende waarden worden vóór de modelcommit afgewezen; string- en booleanwaarden worden niet geconverteerd.
- `tests/regions-schema.test.cjs`: afzonderlijke combinaties van polygongebied met asreferentie, expliciete hoekarmen en `lineBetweenPoints` (schema 2), inclusief volledige JSON-roundtrip en semantische replay. Ongeldige constructieschema's worden via zowel `Engine.load` als `IllustrationModel.load` afgewezen met behoud van de volledige voorafgaande JSON. Schema 5 zonder regiorecept blijft verboden. Dezelfde constructies zonder regio behouden hun oorspronkelijke schema.
- Tekstregressies controleren schema 1 (opgemaakte tekst), schema 2 (wiskundefragment) en schema 3 (dynamische waarde), zowel zonder regio als gecombineerd met polygongebied en cirkelsector. Volledige opgeslagen JSON blijft na herladen gelijk; semantische replay van een radiuswijziging behoudt tekstinhoud en bindings en toont de actuele dynamische waarde. Hogere ondersteunde tekstschema's blijven leesbaar en worden bij opslag zoals voorheen canoniek afgeleid uit de inhoud. Versie 8 zonder rijke tekst vereist geen `textSchema`.
- `tests/browser-regions.cjs`: versie 8 met asreferentie, rijke tekst/dynamische radius, polygongebied en sector wordt opgeslagen en via de editor herladen zonder informatieverlies; acht ontbrekende/ongeldige/ontoereikende tekstschemavarianten worden atomair afgewezen.
- Node en Edge controleren concave polygoninterieurs en de uitgesloten inkeping, polygonranden, minor/major-segmentinterieurs en uitgesloten zijden, koorde- en booggrenzen, en selecteerbaarheid bij zichtbaarheid/intrekking. Hit-testimplementatie hoefde niet te worden gewijzigd.

Er zijn geen bestaande assertions verwijderd of verzwakt. REG-1 is ongewijzigd; er is geen contractafwijking, UI-R1 is niet gestart en er wordt niet naar `main` gemerged.

## Numerieke keuzes en foutafhandeling

Polygonen worden rond de eerste vertex genormaliseerd voordat de shoelace-som wordt uitgevoerd; eenvoudige polygonvalidatie blijft gedelegeerd aan `PolygonGeometry`. Cirkelrichting, radius-extremen en teruggetransformeerde coördinaten worden gecontroleerd tegen de bestaande absolute modelgrens `1e12`. De implementatie onderscheidt `INVALID_REFERENCE`, `SOURCE_INVALID`, `DEGENERATE_REGION`, `ZERO_RADIUS`, `DEGENERATE_DIRECTION`, `NUMERIC_UNDERFLOW`, `NON_FINITE_RESULT` en `COORDINATE_LIMIT`. Er wordt niet geclamped.

Bij exact 180° kiest de contractuele hoek-tie-break één halve regio. Bij continue passage door die grens wisselt de gekozen kant volgens de vastgelegde minor/major-semantiek, zonder hysterese. Volledige major-schijven worden analytisch berekend als `πr²` en via het afzonderlijke cirkelrenderpad getekend.

## Beveiliging

De drie nieuwe tool-ID's vereisen de bestaande expliciete tool- en bronrechten, inclusief de exacte `sourceTools`-grant. Regioncreatie vereist expliciete `read`- en `display`-rechten voor het nieuwe objecttype. Inspector, canvas, label en exports volgen dezelfde projectie- en dependency-closure. Bij ingetrokken of onvoldoende rechten wordt de regio en haar berekende informatie geredigeerd; restricted export leidt het constructieschema af uit de daadwerkelijk geprojecteerde recepten. Directe geometry-translatie is niet toegestaan.

## Testresultaten

- **Node na correctie:** `node --test tests/*.test.cjs` — **611 geslaagd, 0 mislukt, 0 overgeslagen**.
- **Gerichte Node-regressies:** `node --test tests/region-geometry.test.cjs tests/regions-contract.test.cjs tests/regions-schema.test.cjs tests/axis-references.test.cjs tests/text-editor-t1.test.cjs tests/text-editor-t2.test.cjs tests/text-editor-t3.test.cjs` — **69 geslaagd, 0 mislukt, 0 overgeslagen**.
- **Gerichte Edge-regressies:** `REG2_ONLY=1 node tests/browser.cjs` — exitcode **0**, alle elf gerapporteerde REG-2-controlecategorieën geslaagd, `pageErrors: []`.
- **Volledige Edge-suite na correctie:** `node tests/browser.cjs` — proces geëindigd met exitcode **0**, `pageErrors: []`; de volledige browserregressierunner omvat de uitgebreide REG-2-scenario's. Deze runner publiceert geen enkel geaggregeerd aantal tests.
- Gerichte REG-2 Edge-scenario's geslaagd: canvasgereedschap en selectie, alle drie recepten, onafhankelijke oppervlaktefixtures, dynamische ongeldigheid/herstel met JSON-roundtrip, blokkeren van directe drag, volledige-schijf-SVG, offline PNG en JSON-roundtrip.
- De volledige Edge-run omvatte ook bestaande expressie-enginefixtures: contract 73/73, onafhankelijke afrondingsreferenties 912/912, transcendentale referenties 19/19 en bronadapter 14/14.
- UI-T1-toolpanel Edge-controle geslaagd: 40 actieve tools, 8 categorieën en responsive controles op vier viewports.
- `git diff --check` slaagde.

De correctieronde gebruikte Node v22.18.0 en de reeds geïnstalleerde Playwright 1.62.1 uit de lokale hoofdcheckout via `NODE_PATH`. Voor de bestaande pixelvergelijking is de lokale `pngjs`-dependency naar de genegeerde preflight-`node_modules` van deze checkout gekopieerd. Er zijn geen dependencybestanden of testassertions aangepast om de suite te laten draaien. Edge moest buiten de sandbox worden gestart; de eerste sandboxstart en de eerste volledige run zonder `pngjs` bereikten geen volledige verificatie en tellen niet als geslaagde runs. De ruwe logs staan lokaal in `test-results/reg2-correction-{node,node-targeted,edge-full,edge-targeted}.log` (genegeerde testuitvoer).

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
