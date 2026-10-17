# M-PATH.0-V2 — Definitieve regressieverificatie

Datum: 17 oktober 2026. Branch: `codex/m-path-0-universal-point-tool`.
Normatief: `WIE-M-PATH-0-Ontwerp-en-implementatiecontract-v1.0.1.md`.

## Broncontrole

- Begincommit: `1e831f54a982dbff1e8c901ec4b43953511b8525`, gelijk aan de opgehaalde remote featurebranch. Werkboom bij aanvang schoon.
- Eindcommit van de testcode: `39a46ff619ddfa2b5f407d44cfde86570c061d8b` (na `7846a7b`, `fa8ea3e` en `c16f5bc`). De aansluitende rapportcommit verandert uitsluitend dit verslag; zijn SHA staat in de oplevermelding en de remote HEAD-controle.
- `origin/main`: `a734048ba7822aa504ece7294383a9e54077cb81`. Na expliciet ophalen van beide refs: `git rev-list --left-right --count HEAD...origin/main` = `6 0`; main is volledig voorouder van deze branch. Geen synchronisatie of merge nodig.
- De eerdere main-integratie, inline objecthernoemen en definitieve A2-interface zijn behouden. Geen productiecode, manifest, cachetoken, schema of permissiemodel gewijzigd.
- Gelezen: AGENTS, contract v1.0.1, I-/V-/A-/A2-rapporten, roadmap, UI-RADIAL-9, CORE-1 en CONSTRUCTIONS. Historische open acceptatiestatussen in I/V zijn opgevolgd door de afzonderlijke A-/A2-besluiten; deze documenten zijn niet herschreven.
- Omgeving: Windows, Node `v22.18.0`, npm `10.9.3`, Playwright `1.62.1`, Edge `155.0.4283.45` headless.

### Isolatie wegens gelijktijdig branchgebruik

Tijdens de verificatie schakelde een andere taak de oorspronkelijke checkout naar `codex/perf-1-baseline-audit`, eveneens vanaf `1e831f5`. Dit bleek bij de testcommit. De eigen commit is naar de gevraagde featurebranch overgebracht; de andere branchref is met een compare-and-swap alleen van die eigen commit teruggezet naar zijn voorafgaande HEAD. De werkbestanden van die taak zijn behouden. Eigen tests en gegenereerde referentiescreenshots zijn uit de oorspronkelijke checkout opgeruimd.

V2 gaat verder in `../m-path-v2-verification`, een aparte werkboom op uitsluitend `codex/m-path-0-universal-point-tool`. De Node-suite en zes gerichte tests zijn daar opnieuw uitgevoerd: opnieuw 748/748 en 6/6 PASS. De eerste volledige Edge-poging is uit voorzorg onderbroken; geen PASS of testfout geclaimd. De volledige suite is geïsoleerd opnieuw gestart. De tien eerdere gerichte suites gebruikten dezelfde ongewijzigde A2-productiebasis; de geïsoleerde volledige runner voert daarnaast de universele V2-flow en inline hernoemen expliciet uit.

## Stashinspectie

`git stash list`, `git stash show --stat 'stash@{0}'`, `git stash show -p 'stash@{0}'` en `git ls-tree -r 'stash@{0}^3' --name-only` uitgevoerd.

De stash **V2 browser regressions preserved before A2 UI switch** bevat een ongetrackte `browser-point-on-object-v2.cjs`, een aanroep vanuit de universele suite en een oude catalogustelling 40. Alleen de V2-testmodule is uitgelezen en gericht geïntegreerd; de bestaande A2-test is alleen met de moduleaanroep uitgebreid. De telling blijft 37. Beide stashes zijn bewaard; geen pop, reset of geforceerde push. De oudere catalogusstash is niet toegepast.

## Node

| Exact commando | PASS | FAIL | SKIP |
|---|---:|---:|---:|
| `npm test` | 748 | 0 | 0 |
| `node --test tests/point-on-object-alias.test.cjs tests/point-on-object-ui-switch.test.cjs` | 6 | 0 | 0 |

De volledige run omvat bestaande recepten, afhankelijkheden, documentcompatibiliteit, historie, polygonvalidatie en inline objecthernoemen. De aanvullende zes tests controleren expliciet aliasdispatch, vier dragers, geïndexeerde polygonzijde, projectie/clamping, niet-ondersteunde dragers, SVG-highlight, één A2-catalogusingang en JSON-roundtrip zonder persistent aliasrecept.

## Gerichte Edge-runs

Voor iedere selectie: `$env:SELECTOR='1'; npm run test:edge`, met de hieronder letterlijk genoemde bestaande variabele op de plaats van SELECTOR. Iedere variabele is in `finally` uit de procesomgeving verwijderd.

De uitgevoerde selectiecommando's, inclusief herhalingen waar hieronder vermeld:

```powershell
$env:POINT_ON_OBJECT_ONLY='1'; npm run test:edge
$env:LINKED_PATHS_ONLY='1'; npm run test:edge
$env:LINKED_TANGENT_ONLY='1'; npm run test:edge
$env:POINT_ON_ELLIPSE_ONLY='1'; npm run test:edge
$env:ELLIPSE_CONTROL_POINT_ONLY='1'; npm run test:edge
$env:M8B2B_ONLY='1'; npm run test:edge
$env:OBJECT_RENAME_ONLY='1'; npm run test:edge
$env:UI_LEFT_ONLY='1'; npm run test:edge
$env:UI_T1_ONLY='1'; npm run test:edge
$env:SPLIT_TOOLS_ONLY='1'; npm run test:edge
```

| Selectievariabele | Definitieve uitslag | Dekking |
|---|---|---|
| `POINT_ON_OBJECT_ONLY` | PASS | A2-sidebar, zoeken, fullscreen, vier dragers, staging, preview, bevestiging, één creatie en beëindiging, Undo/Redo, Escape/pointercancel, vaste edge, clamp, radial-prefill; uitgebreide V2-matrix hieronder. |
| `LINKED_PATHS_ONLY` | PASS | Lijnstuk/cirkel via universele UI, parameterdrag en -slider, clamp, bronvolgen, Undo/Redo, cancel, lock, oude schema-2-roundtrip. |
| `LINKED_TANGENT_ONLY` | PASS | Punt via universele UI, afhankelijke raaklijn, puntdrag, loodrechtheid, bronvolgen, Undo/Redo, roundtrip. |
| `POINT_ON_ELLIPSE_ONLY` | PASS | Sidebar/fullscreen/radiaal, contourtolerantie, preview, parameterdrag/naad, bronwijzigingen, lock, restricted/revocation, save/reload, SVG/PNG. |
| `ELLIPSE_CONTROL_POINT_ONLY` | PASS | Bestaande/vrije Q, gekoppeld punt via universele UI, legacy somafstand, atomair Undo/Redo, save/reload, restricted Q en preview-performance. |
| `M8B2B_ONLY` | PASS | Geconstrueerde polygonrand via universeel radiaalmenu, afhankelijke updates en bestaande parallellogram-UX. |
| `OBJECT_RENAME_ONLY` | PASS | Inline hernoemen, selectie/identiteit, Escape, Undo/Redo en persistentie. |
| `UI_LEFT_ONLY` | PASS | Sidebar, live zoeken, toetsenbord, toestandherstel en responsiviteit. |
| `UI_T1_ONLY` | PASS | 37 unieke gereedschappen, catalogus/zoeken/fullscreen en inerte geplande items. |
| `SPLIT_TOOLS_ONLY` | PASS | Punttool-lijst na A2, subgroepen, directe selectie, documentinvariant en toetsenbord. |
| `RICH_LAYOUT_ONLY` | PASS | Gerichte hercontrole na koppelen bestaande PNG-testdependency: tekstlayout, fullscreen, offline SVG/PNG, pixelvergelijking en restricted exports. |

**11 verschillende gerichte suites PASS**, nul definitief falende of overgeslagen gerichte suites; alle eindresultaten hebben `pageErrors: []`. Dit zijn suiteaantallen; de runner telt afzonderlijke asserts niet als testcases. Het elfde aanvullende commando was `$env:RICH_LAYOUT_ONLY='1'; npm run test:edge`, eveneens met cleanup van de variabele.

### Uitgebreide universele V2-controles

- Vier viewport/zoomcombinaties: breedte 900/1400 CSS-px, zoomfactor 1/2. SVG-eindpunt via `getScreenCTM` vergeleken met de bestaande schermtransformatie; fout kleiner dan 0,01 CSS-px. Previewparameter gelijk aan opgeslagen parameter; edge-index 1 behouden.
- Twee afzonderlijke browsercontexten met `deviceScaleFactor` 1/2, viewport 1100×800 en verschoven bounds (pan): highlight, geprojecteerde parameter en dezelfde edge gecontroleerd.
- Alle vier dragers starten en bevestigen via het bestaande universele radiale plan. Vector, maatlijn, rechte en halfrechte leveren zowel in sidebarselectie als radiaal geen aliasaanbod.
- Echte muisdrag van polygonpunt voorbij het eindpunt richting aangrenzende zijde: clamp tot 1 zonder indexwisseling. Undo/Redo herstelt parameter; getypeerde vertexcoördinatenupdate herberekent het punt op dezelfde edge en parameter.
- Ellipscontour, rotatie/bronwijzigingen, parameternaad en exports vallen tevens onder de gespecialiseerde ellipssuite; geen tweede projectie- of geometrie-engine toegevoegd.

## Restricted-permissiematrix

Uitgevoerd in echte Edge-app, profielen `course` en `assessment`, telkens lijnstuk, polygonzijde, cirkel en ellips. UI-interactiestappen worden waar passend via bestaande editor-methoden gestart; dit is geen claim dat iedere matrixcel met fysieke muisklikken is bediend.

| Controle | Aantal | Uitslag |
|---|---:|---|
| Concrete `allowedTools` plus bijbehorende `sourceTools` toegestaan: selectie, preview, bevestiging, concrete bron en parameter gelijk | 8 | PASS |
| Passende concrete tool ontbreekt, terwijl een ander puntrecept wél toegestaan is en de alias dus beschikbaar blijft | 8 | PASS: geen kandidaat voor de verkeerde drager; direct commando geweigerd |
| Concrete `sourceTools` ontbreekt | 8 | PASS: geen kandidaat; direct commando geweigerd |
| Bron `read:false` | 8 | PASS: geen kandidaat; direct commando geweigerd |
| Bron `display:false` | 8 | PASS: geen kandidaat; direct commando geweigerd |
| Bron `visible:false` | 8 | PASS: geen kandidaat; direct commando geweigerd |
| Bronrecht ingetrokken na staging, vóór bevestiging | 8 | PASS: geen creatie |
| Vergrendelde bron met geldige concrete bronrechten | 8 | PASS: bestaand contract staat gebruik als onveranderbare bron toe |
| Canoniek document opgeslagen als JSON-snapshot en in nieuwe restricted sessie met dezelfde concrete bronrechten en expliciete doelregels ingelezen | 8 | PASS: één concreet recept en toegestaan bronaanbod behouden |
| Parameterwijziging via `construction.setParameter` in restricted modus | 8 | PASS: bestaande `MODE_DENIED` behouden |

De **48 weigeringen** controleren telkens document en documentrevisie; de directe geweigerde commando's ook historybeschikbaarheid, revocation ook geen Undo. De alias blijft uitsluitend UI: concrete grants zijn vereist en de runtime controleert het concrete commando. Doelregels blijven bestaande regels voor gemaakte punten; de alias verleent geen parameterdragrecht. Save/reload betreft document + expliciete sessiepolicy, niet een nieuw permissie-opslagformaat. De bestaande gespecialiseerde ellipsflow controleert tevens beperkte creatie en intrekking van toolrechten vóór commit.

## Gevonden testproblemen en correcties

1. De eerste gerichte ellipsbesturingspuntrun is tijdens de zware fixture onderbroken voor diagnose, zonder PASS-claim. Herhaling met `$env:ELLIPSE_CONTROL_POINT_ONLY='1'; $env:DEBUG='pw:api'; npm run test:edge` slaagde volledig. De fixture met 205 objecten is behouden; geen performance-eis afgezwakt. DEBUG en selectie zijn daarna verwijderd.
2. Nieuwe polygon-dragassertie faalde eerst met parameter `0.9999999288427208` tegenover exact 1: de muiscoördinaat lag op het eindpunt en werd afgerond. De fixture sleept nu daadwerkelijk voorbij het eindpunt (`y=2.2`), conform de bedoelde clampcontrole.
3. De nieuwe bronwijzigingsfixture gebruikte aanvankelijk `fields:[{path:'vertices',...}]`, wat geen geldig getypeerd geometrieveld is. De verwachte nieuwe x-coördinaat bleef daardoor 2 in plaats van 4. De test gebruikt nu bestaande `vertices[1].x`, `vertices[2].x/y`-velden. Geen productiecorrectie of API-uitbreiding.

Na beide fixturecorrecties is `POINT_ON_OBJECT_ONLY` opnieuw uitgevoerd en geslaagd; daarna nogmaals met vier expliciete radiale dragercontroles, eveneens PASS. Eerdere falende pogingen zijn geen eind-PASS en hierboven afzonderlijk geregistreerd.

In totaal acht uitvoeringen van `POINT_ON_OBJECT_ONLY`: zes PASS en twee hierboven verklaarde fixture-FAILs. De geïsoleerde runs controleren ook het verdwijnen van overlays en acht weigeringen met een ander toegestaan puntrecept. `ELLIPSE_CONTROL_POINT_ONLY` heeft één onderbroken poging en één volledige PASS. De overige acht gerichte selectiecommando's zijn elk eenmaal geslaagd. `npm test` en het gerichte Node-commando zijn elk zowel vóór als na isolatie uitgevoerd, met dezelfde uitslagen. Aanvullend `node --check tests/browser-point-on-object-v2.cjs`, `node --check tests/browser.cjs` en `git diff --check`: PASS.

De eerste geïsoleerde volledige run bereikte `richLayout` na twaalf geslaagde modules en stopte met `MODULE_NOT_FOUND: '../experiments/text-editor-preflight/node_modules/pngjs'`. **BLOCKED door testomgeving**, niet als PASS geboekt. De aparte werkboom had de bestaande lokale experimentdependency nog niet. De aanwezige `pngjs` 7.0.0 is via een lokale `node_modules`-junction beschikbaar gemaakt, net als de bestaande root-Playwrightdependency. Geen package-, productie- of testlogica veranderd om de fout te omzeilen. `RICH_LAYOUT_ONLY` is daarna daadwerkelijk geslaagd; vervolgens is de volledige suite vanaf het begin herhaald.

## Volledige Edge-regressie en besluit

De laatste volledige run `npm run test:edge` is op uitdrukkelijk gebruikersverzoek gestopt tijdens `ellipseControlPoint`. De 37 voortgangsregels bevestigen 36 afgeronde modules zonder testfout; de lopende module en de resterende modules hebben in deze volledige poging geen eindresultaat. De afzonderlijke gerichte `ELLIPSE_CONTROL_POINT_ONLY`-run is eerder wél volledig geslaagd.

| Onderdeel | Eindstatus |
|---|---|
| Volledige Node-regressie | PASS: 748 geslaagd, 0 gefaald, 0 skips |
| Aanvullende gerichte Node-tests | PASS: 6 geslaagd, 0 gefaald, 0 skips |
| Gerichte Edge-verificatie | PASS: 11 verschillende suites, inclusief restricted-matrix |
| Volledige Edge-regressie | SKIP voor de niet-afgeronde rest: run op gebruikersverzoek onderbroken; geen volledige PASS |
| Eerdere ontbrekende PNG-testdependency | BLOCKED tijdens eerdere poging; lokaal opgelost en gericht opnieuw PASS |
| Handmatige gebruikersacceptatie | Bestaand GO behouden, niet herschreven |

**NO-GO voor een onvoorwaardelijke technische vrijgave van M-PATH.0-A3 op basis van V2.** Er is geen aangetoonde open M-PATH.0-productiefout, maar een volledig afgeronde Edge-regressie ontbreekt. Dit is de resterende verificatiebeperking. De positieve Node-, gerichte Edge- en handmatige resultaten blijven geldig; zij worden niet als volledige Edge-PASS gepresenteerd.

De gebruiker heeft expliciet gevraagd het rapport te pushen en deze stap te beëindigen. Er worden geen nieuwe tests, merge of vervolgmilestone gestart. De schermschaalcontrole is uitgevoerd via browsercontexten met deviceScaleFactor 1/2; fysieke Windows-DPI-instellingen zijn niet gewijzigd. Gegenereerde wijzigingen aan bestaande referentiescreenshots zijn hersteld en worden niet meegecommit.

## Gewijzigde bestanden

- `tests/browser-point-on-object.cjs`: V2-module aan bestaande gerichte universele suite gekoppeld en expliciete controles dat preview/highlight na bevestiging verdwijnen.
- `tests/browser-point-on-object-v2.cjs`: gerichte rendering-, pariteits-, polygon-drag- en restrictedcontroles uit stash geïntegreerd en aangevuld.
- `tests/browser.cjs`: voortgang per bestaande volledige suite; universele V2-flow en inline hernoemen ook in de volledige run opgenomen. Geen bestaande suite verwijderd of overgeslagen en geen nieuwe selectievariabele.
- `docs/M-PATH-0-V2-EINDVERIFICATIE.md`: dit rapport.

Andere tijdens het werk verschenen ongetrackte bestanden onder `experiments/perf-1.1` zijn buiten scope, niet door deze opdracht gemaakt of opgenomen en worden behouden. Historische acceptatiedocumenten blijven intact. Geen merge naar main, geen nieuwe functionaliteit of vervolgmilestone.
