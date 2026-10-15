# M8a-2 — Punt op ellips

**Documentversie:** 1.0.0
**Uitgangsbasis:** `origin/main` op `000399afc52eb82519ff1a1832c1bb73b0169d15`
**Featurebranch:** `codex/m8a-2-point-on-ellipse`
**Status:** geïmplementeerd op featurebranch; regressieverificatie voltooid

## Architectuurcontrole en testimpactmatrix

De gecontroleerde basis bevat M8a-1 en STAB-1 op `main`. `EllipseGeometry.nearest()` levert al de werkelijke Euclidische contourprojectie en canonieke parameter. `ConstructionService` bezit getypeerde recepten, bronrollen, parameter-normalisatie, contextplannen en dependency resolution. `EditorApp` bezit bronselectie, de gedeelde plaatsingsinteractie, het bestaande `construction.setParameter`-sleepcommando, annulering en geschiedenis. `ToolCatalog`, `RadialProperties`, `PermissionRuntime` en modelimport/export blijven de bestaande eigenaren voor catalogus, presentatie, rechten en opslag.

| Onderdeel | Bestaande eigenaar/mechanisme | Gevolg voor M8a-2 | Testimpact |
|---|---|---|---|
| Projectie/positie | `EllipseGeometry.nearest()` en `pointAt()` | Nearest-projectie levert `p`; resolutie blijft in modelruimte en gebruikt de bestaande affine schermmapping voor CSS-pixeltolerantie. | Nieuwe onafhankelijke fixtures voor rotatie, cirkel, smalle ellips, centrum/ties en de `p≈1/0`-grens. |
| Recept en afhankelijkheden | `ConstructionService.contract`, bronrollen, `normaliseParameter`, `evaluate`, `resolve` | Voeg `pointOnEllipse` met exact één volledige ellipsbron toe; herbereken hetzelfde punt-ID bij bronwijziging en herstel. | Breid construction-, ellipse-model- en permission-tests uit; voeg gerichte parameter- en invarianttests toe. |
| Tool en context | Gedeelde `ToolCatalog`, `contextualPlans`, `RadialProperties` | Eén geregistreerde tool voor sidebar/fullscreen/radiaal; expliciete plaatsingsmodus voor deze kromme. | Breid catalogus-, constructiepresentatie- en radial-tests uit; geen tweede toolmapping. |
| Pointerinteractie | `EditorApp.constructionClick`, `pathPoint`, `construction.setParameter`, lifecycle-cancel | Plaats en sleep via het bestaande construction-pad; één commit/geschiedenisstap en bestaande cancel-semantiek. | Gerichte lifecycletests en nieuwe echte Edge-interactiecontrole. |
| Rechten en document | `PermissionRuntime`, document v9, ellipse/construction schema-afleiding | Hergebruik actuele tool-/bronrechten en commitvalidatie; geen nieuwe documentversie of schema. | Breid restricted-, revocatie-, import/export-, replay- en Undo/Redo-tests uit. |
| Presentatie en export | Bestaande zwevende properties, renderer, SVG/PNG-export | Toon relatie/parameter via bestaande properties; alle geometrische uitvoer blijft uit de gedeelde resolutie komen. | Edge-controle van properties, JSON, SVG/PNG en afwezigheid van restricted lekken. |

UI-RADIAL-9 documenteert dat nieuwe krommen een plaatsingsadapter kunnen vereisen. Dit is een afgebakende uitbreiding van de bestaande service-/interactiegrens, geen reden voor een tweede constructiemachine. Er is geen contract- of architectuurtegenstrijdigheid gevonden die de opdracht blokkeert.

## Implementatie

- `ConstructionService` registreert `pointOnEllipse` als een point-recept met exact één volledige ellipsbron. Opslag bevat alleen de bronreferentie en canonieke parameter; validatie weigert extra geometrische cachevelden of delen/asreferenties.
- Het nieuwe recept gebruikt de bestaande dependency resolution, `construction.create`, `construction.setParameter`, history/replay en detach/cascade-mechanismen. De parameter is periodiek genormaliseerd in `[0,1)`. Documentversie 9, `ellipseSchema:1` en `constructionSchema:6` blijven gelden.
- Het gedeelde gereedschapscatalogus exposeert `construct:pointOnEllipse` onder Kegelsneden, links, fullscreen en via de bestaande contextplannen vanaf een ellips.
- De bestaande plaatsingscontroller vraagt eerst de ellipsbron, daarna een punt nabij de contour. Hit tolerance is 12 CSS-pixels. Het afhankelijke punt wordt exact op de ellips gemaakt. De preview vervangt uitsluitend het preview-SVG-element en muteert de documentdata niet.
- Verslepen loopt via het bestaande linked-path-mechanisme en `construction.setParameter`; de parameter verandert, de ellipsbron niet. De bestaande Escape-, pointercancel-, toolwissel-, blur- en Undo/Redo-afhandeling blijft eigenaar van annuleren en commit.
- Het eigenschappenpaneel toont de bronrelatie en parameter via de bestaande constructie-inspector. Lock- en author/restricted-controles blijven via de bestaande commando- en permissielaag lopen. Bij ingetrokken bronrechten wordt het afhankelijke punt uit restricted projecties verwijderd.
- Aangepaste bestanden: `construction-service.js`, `editor-radial-properties.js`, `editor-tool-instructions.js`, `editor.html`, `editor.js`, `model.js`, `permission-runtime.js`, `renderer.js`, `tests/browser-tool-panel-reorganization.cjs`, `tests/browser.cjs`, `tests/construction-contract.test.cjs`, `tests/left-sidebar-navigation.test.cjs`, `tests/tool-panel-reorganization.test.cjs`; toegevoegd `tests/browser-point-on-ellipse.cjs` en `tests/point-on-ellipse.test.cjs`.
- Implementatie- en testcommit: `0eae47c` — `feat: add point on ellipse construction`.
- Roadmap- en verslagwijzigingen worden vastgelegd in de volgende commit op dezelfde featurebranch.

## Numeriek beleid

Parameterbepaling gebruikt `EllipseGeometry.nearest()` en bewaart de resulterende canonieke `p`; er is geen `atan2`-radiale benadering of opgeslagen sampling. Deze bestaande solver gebruikt een vaste bovengrens van 96 bisectiestappen voor de stationaire vergelijking en kan projectieafstand na de affine schermmapping meten. Previewacceptatie gebruikt een grens van 12 CSS-pixels. Parameterperiodiciteit bewaart de seam als `[0,1)`, zodat `p=1` naar `0` normaliseert.

De Edge-previewmeting voerde 120 opeenvolgende dichtstbijzijnde projecties plus preview-SVG-updates uit: **22,9 ms totaal**, **0,191 ms gemiddeld**, **0,2 ms mediaan**, **0,3 ms p95**, **1,1 ms maximum** in deze run. De `toJSON()`-uitvoer bleef gelijk voor en na de previewreeks. Dit is een gerichte browsermeting van het productiepreviewpad, geen brede hardwarebenchmark.

## Tests en commits

Gerichte tests:

- `node --test tests/point-on-ellipse.test.cjs tests/tool-panel-reorganization.test.cjs tests/construction-contract.test.cjs` — **26/26 geslaagd** na bijwerken van de verwachte ellipsrol/toolcatalogus.
- `npm test` — **659 geslaagd, 0 fouten**.
- `$env:POINT_ON_ELLIPSE_ONLY='1'; npm run test:edge` — **geslaagd** in Edge; toolkeuze, plaatsing/tolerantie, contextueel menu, sleep/Undo/Redo, parameterseam, annulering, focus-/S-wijzigingen, lock, restricted constructie en bronrevocatie, opslag/herladen, SVG/PNG en geen page errors. De restricted-revocatiecontrole bevestigt dat puntdata daarna ontbreken in JSON, SVG en DOM.
- `npm run test:edge` — **volledige Edge-suite geslaagd** op de uiteindelijke featuretests; alle bestaande browseronderdelen doorliepen tot `pageErrors: []`. De suite rapporteerde 42 gereedschappen en slaagde ook voor de nieuwe restricted bronrevocatie-, M8a-2-interactie- en previewcontroles.
- `$env:POINT_ON_ELLIPSE_ONLY='1'; npm run test:edge` — gerichte Edge-suite geslaagd, met 120 previewcycli: 22,9 ms totaal, 0,191 ms gemiddeld, p95 0,3 ms, maximum 1,1 ms; document-JSON bleef ongewijzigd.
- `git diff --check` — schoon.

Eerste volledige Edge-poging stopte vóór alle tests omdat het al gelockte `experiments/text-editor-preflight`-pakket niet geïnstalleerd was (`pngjs` ontbrak). De bestaande `npm ci --prefix experiments/text-editor-preflight` herstelde de gedeclareerde testomgeving; de volledige suite slaagde daarna. Deze installatie wijzigde geen tracked manifests.

## Handmatige acceptatiechecklist

- [x] Gereedschap via linker- en fullscreen-kiezer kiezen.
- [x] Ellipsbron kiezen; klik buiten 12 CSS-pixels afwijzen; contourpunt plaatsen.
- [x] Contextueel radiaalmenu vanaf een ellips gebruiken.
- [x] Punt slepen, ook over de `p≈1/0`-grens; bronellips blijft staan.
- [x] Brandpunten en `S` wijzigen; parameter en punt-ID blijven behouden.
- [x] Ongeldigheid/herstel, annuleren, lock en restricted bronrevocatie controleren.
- [x] Opslaan/herladen en SVG/PNG-presentatie controleren.
- [x] Geen browserfouten; previewmutaties veranderen de documentdata niet.
- [ ] Handmatige visuele acceptatie door de gebruiker.

## Technisch oordeel

**GO voor technische review van M8a-2 op de featurebranch.** De gerichte en volledige Node/Edge-tests zijn geslaagd. **Geen merge naar `main`**; M8a-2-eindacceptatie en integratie wachten op gebruikersgoedkeuring. Handmatige visuele acceptatie blijft open.
