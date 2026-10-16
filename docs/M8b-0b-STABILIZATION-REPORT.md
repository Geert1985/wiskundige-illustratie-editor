# M8b-0b — Preflightblokkades oplossen

**Datum:** 16 oktober 2026
**Basis:** `origin/main` `1c787c52ad24d01c5bcd161ebc1c4f27608e7460`
**Branch:** `codex/m8b-0b-stabilization`
**Status:** alleen test- en documentatiewijzigingen; M8b is niet geïmplementeerd.

## Wijzigingen

- `tests/browser-ellipse-interaction.cjs` gebruikt het zichtbare `ellipseByFociAndPoint`-gereedschap. Het verifieert de permanente derde bron Q, preview zonder documentmutatie, Escape-annulering, afgeleide S, Q-verplaatsing, afhankelijkheidsherberekening en undo/redo.
- De test blijft ook `ellipseByFociAndSum` rechtstreeks construeren, controleert JSON-documentroundtrip op schema 7 en verifieert dat het legacy-eigenschappenpaneel S nog kan wijzigen.
- `docs/M8b-PARALLELLOGRAMMEN-CONTRACT.md` is bijgewerkt naar v1.1.0 met de GEO-UI-metingen en het geverifieerde schema-/documentversiebeleid.

## Testimpactmatrix

| Test / gebied | Classificatie | Behouden of toegevoegde garantie |
|---|---|---|
| `tests/browser-ellipse-interaction.cjs` | Contractueel aangepast | Nieuwe zichtbare driebronneninteractie, permanente Q, live preview, annulering, derived S, bronverplaatsing en undo/redo; legacy recept blijft expliciet gedekt. |
| `tests/browser-ellipse-control-point.cjs` | Ongewijzigd | Besturingspuntflow, Q drag, één/ twee objectcreatieafhandeling, previewprestaties, restricted flow en legacy `sumDistance`-bediening. |
| `tests/ellipse-control-point.test.cjs` | Ongewijzigd | Receptwiskunde, schema 7, bronvolgorde, dynamiek, invalidatie, legacy recept in gemengde documenten, atomiciteit en replay. |
| `tests/ellipse-model.test.cjs`, `tests/ellipse-geometry.test.cjs`, `tests/ellipse-permissions.test.cjs` | Ongewijzigd | Legacy constructie, opgeslagen afstandsom, import/export, resolver, validatie en bron-/created-objectrechten. |
| `tests/browser-ellipse-render.cjs`, `tests/browser-ellipse-measurement-anchors.cjs`, `tests/browser-point-on-ellipse.cjs` | Ongewijzigd | Legacy opgeslagen recepten blijven renderbaar, meetbaar, exporteerbaar en bruikbaar als bron voor afhankelijke objecten. |
| `tests/geo-ui-measurements.test.cjs` en `tests/browser-geo-ui.cjs` | Ongewijzigd | Bestaande onafhankelijke meetinstellingen, formattering, labels, export en documentversie 10 blijven behouden. |
| Alle overige Node- en Edge-tests | Ongewijzigd | Geen M8b-productiegedrag geïntroduceerd; suite-uitkomsten hieronder zijn de regressiepoort voor deze preflightwijziging. |

## Validatie

| Commando | Resultaat |
|---|---|
| `node tests/browser-ellipse-interaction.cjs` | **PASS** — Edge; driebronnengereedschap, permanente Q-verplaatsing/undo/redo, preview-annulering, afgeleide S, legacy document-roundtrip en legacy S-bediening; geen page errors. |
| `npm test` | **PASS** — 673 tests, 673 geslaagd, 0 mislukt, 0 overgeslagen. |
| `npm run test:edge` | **PASS** — volledige Edge-run, alle gerapporteerde browserflows geslaagd, inclusief ellips-control-point, punt-op-ellips, GEO-UI-metingen, regio’s, permissies, import/export, geschiedenis en page errors (`[]`). |

De gerichte Edge-run rapporteerde voor 200 legacy-afhankelijke ellipsen 12 previewupdates voor 12 pointer bursts en geen volledige canvasrender tijdens die bursts. De volledige Edge-run bevestigde dezelfde previewprestatie in de aparte `browser-ellipse-control-point`-flow. Timings zijn diagnostisch en niet als harde drempel/assertie gebruikt.

## Schema- en milestone-status

`origin/main` bevat `constructionSchema:7` voor `ellipseByFociAndPoint`, documentversie 10 met `measurementSchema:1` voor individuele metingen en schema 5 voor REG-2. M8b reserveert in contract v1.1.0 `constructionSchema:8`; M8b-functionaliteit is niet geïmplementeerd. Documentversie 11 is niet voorgesteld voor M8b.

Deze stabilisatie commit geen parallellogramproductiecode en merge’t niet naar `main`. Een aparte gebruikers-GO blijft vereist vóór M8b-1.
