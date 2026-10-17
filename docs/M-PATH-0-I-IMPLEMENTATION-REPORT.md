# M-PATH.0-I — Implementatierapport Punt op object

**Datum:** 17 oktober 2026  
**Branch:** `codex/m-path-0-universal-point-tool`  
**Basiscommit:** `9eb8165a2e3ab1acae65a592736add9e5204ae71` (`origin/main` lokaal bij branchstart)  
**Normatief contract:** `docs/WIE-M-PATH-0-Ontwerp-en-implementatiecontract-v1.0.1.md`  
**Implementatie:** alleen deze branch; geen merge naar `main`.

## Samenvatting

De catalogus heeft nu één zichtbare ingang **Punt op object** onder *Constructies → Puntconstructies*. De alias selecteert een lijn, een geïndexeerde polygonrand, cirkel of ellips; toont vervolgens dezelfde vastgelegde bron en live geprojecteerde puntpositie, en vraagt een afzonderlijke bevestigingsklik. Bevestiging routeert via het bestaande `construction.create` naar `pointOnSegment`, `pointOnCircle` of `pointOnEllipse`. De drie oude gereedschappen blijven beschikbaar.

Er is geen `pointOnObject`-recept, modeltype, documentveld, schemawijziging of nieuwe autorisatieregel toegevoegd. De basis blijft `ConstructionService`, het bestaande document-/dependency-model en de bestaande command- en historypaden.

## Bronbasis en branch

De featurebranch was schoon aangemaakt vanaf de lokaal beschikbare `origin/main` op `9eb8165a2e3ab1acae65a592736add9e5204ae71`. Latere `git fetch origin main`-pogingen zijn niet gelukt door `getaddrinfo() thread failed to start`; de lokaal bekende `origin/main` en `HEAD` wezen bij controle nog naar dezelfde SHA. De remote branchstatus is daarom niet met een succesvolle fetch opnieuw bevestigd.

De read-only P2-hercontrole op deze codebasis concludeerde dat bestaande polygonmutaties indices niet automatisch permuteren. De alias bindt `edge:i` expliciet en wisselt de vastgelegde bron tijdens plaatsing niet.

## Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| `editor.html` | Nieuwe catalogusknop; gezamenlijke cachetoken voor geladen assets verhoogd. Oude knoppen behouden. |
| `editor.js` | Aliasdetectie vóór generieke `tool.slice(10)`-afhandeling; bronselectie, staging, projectiepreview, bevestiging en concrete-permissiehercontrole. Radiale startadapter uitgebreid. |
| `editor-radial-properties.js` | Compositie van concrete `contextualPlans` voor de alias en filteren op concrete bronrechten. |
| `editor.css` | Zichtbare halo voor de vastgelegde hele-objectbron. |
| `tests/point-on-object-alias.test.cjs` | Node-regressie voor UI-alias/concreet dispatchcontract en afwezigheid van een persistent aliaskind. |
| `tests/tool-panel-reorganization.test.cjs` | Catalogustelling en plaatsing van de alias bewaakt. |
| `tests/left-sidebar-navigation.test.cjs` | Tooltellingen en gedeelde assetversie bijgewerkt. |
| `tests/browser-point-on-object.cjs` | Edge-scenario's voor catalogus, vier dragers, staging, preview, bevestiging, Undo/Redo, cancel, clamp en radiale edge-prefill. |
| `tests/browser-asset-compat.cjs` | Gedeelde cachetokenasserties bijgewerkt. |
| `tests/browser.cjs` | Gerichte Edge-schakelaar voor de nieuwe scenariosuite. |
| `docs/M-PATH-0-I-IMPLEMENTATION-REPORT.md` | Dit rapport. |

Geen productiegeometrie-, constructieservice-, model-, schema- of `permission-runtime.js`-bestand is gewijzigd.

## Dispatch en gedrag per drager

`construct:pointOnObject` bestaat alleen als UI-tool-ID. `toolAllowed` laat de alias toe wanneer minstens één concrete punt-op-padtool is toegestaan. De nieuwe aliasbranch wordt aan het begin van `constructionClick` behandeld, vóór generieke constructieafhandeling. Een brondetectie verzamelt concrete kandidaat-referenties, beperkt `pointOnSegment` tot `line` en expliciete polygonranden, en vereist bij restricted gebruik het bijbehorende concrete `sourceTools`-recht plus lees-/weergaverechten.

| Bron | Bronreferentie | Bestaand commando/recept |
|---|---|---|
| Lijn | `{objectId}` | `construction.create` met `construct:pointOnSegment` |
| Polygonzijde | `{objectId, part:'edge', index:i}` | `construction.create` met `construct:pointOnSegment` |
| Cirkel | `{objectId}` | `construction.create` met `construct:pointOnCircle` |
| Ellips | `{objectId}` | `construction.create` met `construct:pointOnEllipse` |

Na selectie wordt die bron in de interactiestatus vastgezet en visueel gemarkeerd. Polygonen tonen specifiek de gekozen rand als overlay; hele lijn-/cirkel-/ellipsbronnen krijgen een highlight. De plaatsingspreview gebruikt dezelfde concrete bron en `ConstructionService.projectParameter` als de commit. Ellipsprojectie blijft via de bestaande `EllipseGeometry.nearest` in die service lopen. Segmentparameters blijven geklemd op `[0,1]`; cirkel-/ellipsparameters behouden de bestaande periodieke normalisatie. Bevestiging hercontroleert de actuele toolgrant, bronrechten en bronbeschikbaarheid. Alleen het concrete tool-ID gaat naar `construction.create`.

Een nieuwe puntcreatie volgt de bestaande ene command/historyactie. Succes sluit de interactie en kiest Selecteren. Escape gebruikt de bestaande `cancel()`-route; er is geen creatie vóór bevestiging.

## Catalogus en radiaalmenu

`ToolCatalog` wordt verder opgebouwd vanuit `editor.html`; daarmee verschijnt dezelfde knop in sidebar, zoeken en fullscreen. De drie bestaande knop-ID's en flows blijven ongewijzigd.

Het radiaalmenu toont de alias als één gereedschap wanneer een van de concrete punt-op-padrechten en een bijbehorend serviceplan beschikbaar is. `RadialProperties.contextConstructions()` composeert bestaande `contextualPlans` van concrete recepten en labelt ieder plan met zijn concrete soort. `startContextConstruction` hercontroleert dit plan, legt de concrete bron en soort vast en gebruikt dezelfde plaatsings-/commitroute als de sidebar. Voor een polygon wordt de door de context geleverde `edgeRef` met exact dezelfde index behouden.

## Compatibiliteit en rechten

- Bestaande `pointOnSegment`, `pointOnCircle` en `pointOnEllipse` blijven de enige opgeslagen recepten voor deze functie.
- Geen document-/constructieschema of importmigratie gewijzigd.
- Bronreferentie en parameter blijven de bestaande identiteit; polygonzijde `i` kan bij plaatsing niet naar een buurzijde wisselen.
- De alias verleent geen nieuwe rechten. De bronselectie en bevestiging controleren concrete `allowedTools`/`sourceTools`, bronleesbaarheid en bronweergave; de bestaande `construction.create`-validator blijft laatste autoriteit.
- De bestaande restricted-parameterdragregels blijven gelden; deze implementatie voegt daar geen recht aan toe.
- JSON/SVG/PNG-opslag en rendering gebruiken dezelfde bestaande puntobjecten en recepten.

## Uitgevoerde tests

Exacte gerichte commando's en uitslagen:

- `node --test tests/point-on-object-alias.test.cjs tests/tool-panel-reorganization.test.cjs tests/left-sidebar-navigation.test.cjs` — **6/6 PASS**.
- `node --test tests/point-on-object-alias.test.cjs` — **2/2 PASS**, inclusief daadwerkelijke `projectPath`-uitkomsten voor vaste polygonrand/clamp, cirkel- en ellipsparameters.
- `$env:POINT_ON_OBJECT_ONLY='1'; npm run test:edge` — **PASS** op Edge; sidebar zoeken, fullscreencatalogus, vier dragers, staging zonder creatie, concrete receptdispatch, één Undo-stap, Escape- en pointercancel, projectiepreview, polygonclamp en radiale `edge:1`-prefill; geen browserconsolefouten.
- `npm test` — **744/744 PASS**, geen skips.
- `npm run test:edge` — één volledige poging faalde op de verouderde verwachte punttoollijst in `browser-split-tools.cjs`. Die testfixture is bijgewerkt; de gerichte hercontrole met `$env:SPLIT_TOOLS_ONLY='1'; npm run test:edge` slaagde. De daaropvolgende volledige herhaling is op verzoek van de gebruiker gestopt. **Geen volledige Edge-PASS geclaimd; geen nieuwe Edge-run gestart.**

Een niet-uitgevoerde handmatige gebruikersacceptatie wordt niet als testresultaat geclaimd.

## Resterende risico's en beslissing

Automatische UI-tests dekken de auteursmodus en de alias-bronrechten zijn statisch gecontroleerd; een afzonderlijke restricted-browserflow voor elke grantcombinatie en handmatige acceptatie op uiteenlopende schermschalen blijven voor de vervolgfase open. Reeds bestaande concrete recept-, degeneratie-, herberekenings-, import/export-, drag- en permissiontests blijven in de volledige regressiesuites meegenomen.

**Aanbeveling: GO naar de afzonderlijke M-PATH.0-V-verificatiepoort.** De implementatie en gerichte scenario's voldoen aan de contractuele alias-/bron-/topologie-eisen; de uitgevoerde regressie-uitkomsten en open acceptatiepunten zijn hierboven vastgelegd. Deze aanbeveling start M-PATH.0-V niet. De fase is hier niet uitgevoerd; aparte expliciete gebruikersgoedkeuring blijft vereist. Er is niets naar `main` gemerged en de drie oude toolknoppen zijn niet verwijderd.

## Opleverstatus

De gegenereerde wijzigingen aan bestaande testscreenshots zijn hersteld. De featurebranch blijft gebaseerd op de vermelde broncommit; de lokaal bekende origin/main bevat inmiddels zes latere commits (documentatie en inline objecthernoemen). Deze zijn niet in deze branch geïntegreerd. Integratiecompatibiliteit blijft een aandachtspunt voor de afzonderlijke vervolgpoort. Geen merge naar main en geen start van M-PATH.0-V. De gebruiker heeft opdracht gegeven deze implementatiestand met afgerond rapport naar de featurebranch te pushen, zonder nieuwe Edge-test.
