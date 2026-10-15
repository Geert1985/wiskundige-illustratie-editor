# M8a-1 — Ellipsinteractie en eigenschappen

**Datum:** 15 oktober 2026
**Branch:** `Codex/M8a`
**Scope:** driestapsconstructie en ellips-eigenschappen; geen M8a-2, definitieve exportacceptatie of merge naar `main`.

## Implementatie

- Het gereedschap **Ellips via twee brandpunten** staat in de ToolCatalog onder *Constructies → Kegelsneden*.
- De stappen kiezen twee bestaande punten, tonen tijdens bewegen de analytische ellipspreview en bevestigen met de derde klik. Het richtpunt `Q` wordt niet opgeslagen.
- Een klik op het brandpuntsegment toont de degeneratieve preview, laat de constructie open en verandert het document niet. Bewegen buiten het segment herstelt de preview. Toolwissel, Escape en bestaande cancel-lifecycle werken zonder tussentijdse objectmutatie.
- De preview gebruikt `EllipseGeometry.resolve` en de bestaande SVG-ellipsrenderer. Previewwijzigingen worden per animatieframe gebundeld en wijzigen alleen het preview-SVG-element; de objectlaag wordt tijdens de muisbeweging niet opnieuw opgebouwd.
- De eigenschappen tonen de afstandsom S en de actuele centrum-, as-, excentriciteits- en oppervlaktewaarden. S-invoer volgt de documentschaal precies eenmaal en loopt via het author-only `construction.setSumDistance`-commando. Ongeldige S-waarden worden door de bestaande commandovalidatie geweigerd.
- Bestaande naam-, zichtbaarheid-, lock-, randstijl-, lijndikte-, lijnpatroon- en vulkleurbediening is beschikbaar via de inspector. S blijft vergrendeld in beperkte sessies en bij een gelockte ellips.

## Controle

Uitgevoerd op Edge (Playwright, headless, viewport 1360 × 900):

- Twee focuspunten kiezen commit geen object; een degeneratieve derde klik wordt afgewezen; een geldige derde klik maakt één afhankelijke ellips met stabiele focusreferenties.
- Escape annuleert zonder documentwijziging.
- S wordt met documentschaal 2 weergegeven en terug omgerekend: invoer `24 cm` wordt modelafstand `12`.
- Eigenschap bewerken, Undo/Redo en lockgedrag slagen. Er waren geen browserfouten.
- Performanceproef bij 203 objecten (200 afhankelijke ellipsen), 12 bursts van 40 pointerbewegingen:

| Maatstaf | p50 | Maximum |
| --- | ---: | ---: |
| Verwerking van één burst met 40 pointerbewegingen | 1,3 ms | 1,8 ms |
| Preview-SVG-update per animatieframe | 0,4 ms | 0,5 ms |
| Volledige `renderCanvas()` bij dezelfde scène (referentiemeting, vijf runs) | 33,8 ms | 38,3 ms |

Er waren **12 previewupdates voor 12 bursts** en **0 volledige canvasredraws tijdens die pointerbursts**. Dit is een lokale headless Edge-meting; andere hardware, browser, echte pointerfrequentie en schermverversing kunnen andere resultaten geven. De referentierender blijft boven een 16,7 ms-framebudget, maar wordt niet meer bij iedere ellipspreviewbeweging uitgevoerd.

Gerichte bestaande ellipstests: `node --test tests/ellipse-geometry.test.cjs tests/ellipse-model.test.cjs tests/ellipse-permissions.test.cjs tests/ellipse-render-selection.test.cjs` — 28/28 geslaagd.
Nieuwe browsercontrole: `node tests/browser-ellipse-interaction.cjs` — geslaagd op Edge.

## Status en resterend werk

De driestapsinteractie en eigenschappen zijn geïmplementeerd en gericht getest op `Codex/M8a`. De volledige M8a-1-acceptatie blijft open. M8a-2 (punt op ellips), definitieve SVG/PNG-exportcontrole en merge naar `main` zijn niet uitgevoerd of goedgekeurd. De prestatiecijfers zijn een gerichte lokale controle, geen algemene browserbenchmark.

### Volledige regressiesuite


`npm test` rapporteerde 643 geslaagde en 9 gefaalde tests van 652. De failures zitten in bestaande sidebar-navigatie (2), legacy M1-interactie/inspector (3), een verouderde radial-menu cacheverwachting (1), tekstpalet (1) en toolcategorisatie/splitmenus (2). De gerichte ellipstests en de Edge-browsercontrole zijn geslaagd. De volledige suite is dus niet groen; de negen bestaande afwijkingen moeten apart worden opgevolgd.
