# PERF-1.2b.1 — Drag-invalidatie

- Repository: `Geert1985/wiskundige-illustratie-editor`
- Branch: `codex/perf-1-2b1-drag-invalidation`
- Basis: `5bdd482` (`main`, opgehaald van GitHub op 17 oktober 2026)
- Uitvoering: 17 oktober 2026

## Resultaat

De bestaande render-invalidatie heeft nu drie redenen: `full`, `viewport` en `drag`. Een actieve, bekende geometrische sleepbeweging rendert de canvas opnieuw, inclusief overlays en snappingfeedback, en werkt de inspector bij. De objectenlijst blijft staan zolang de interactie alleen geometrie, labelpositie, meetlabelpositie of een constructieparameter wijzigt. Het documentmodel en de bestaande afhankelijkheidsresolver blijven de geometrie en afhankelijke constructies bijwerken.

De dragroute vereist een actieve toegestane sleepmodus. In restricted mode moet de permissie-epoch overeenkomen met de waarde bij het starten van de sleep. Een onbekende reden, inactieve of onveilige interactie en gewijzigde permissie-epoch voeren een volledige render uit. Bij samengevoegde RAF-updates heeft `full` voorrang op `drag`, en `drag` op `viewport`. Bestaande `full`- en `viewport`-routes blijven behouden.

De sleepcontroller, canvasrenderer, documentmodel, snappingservice, autorisatie en geschiedenis blijven de bestaande eigenaren. Er zijn geen geometrische algoritmen, snapregels, documentversies, undo/redo-semantiek, exportpaden of productieafhankelijkheden gewijzigd.

## Code en meetbestanden

- `editor.js` — drag-invalidatieroute, RAF-prioriteit en veilige-terugvalcontrole.
- `tests/lifecycle.test.cjs` — behoud van lijst- en inspectorroutes, afhankelijke geometrie, RAF-samenvoeging en restricted-mode-preview.
- `tests/browser.cjs`, `tests/browser-drag-invalidation.cjs` — gerichte Edge-interactiecontrole.
- `experiments/perf-1.2b1/drag-invalidation-benchmark.cjs` — reproduceerbare vergelijking met PERF-1.1-fixtures.
- `experiments/perf-1.2b1/drag-invalidation-results.json` — volledige samples en omgeving.

## Beperkte prestatiemeting

De meting gebruikte de deterministische gemengde PERF-1.1-fixtures in headless Edge 155 op 1280 × 900. De `before`-variant forceerde voor iedere sleepmove de voormalige volledige renderroute; de `after`-variant gebruikte de nieuwe dragroute. Tijden zijn de gemeten JavaScript-verwerking van de pointermove plus de bijbehorende render; frametijd bevat niet de hardwarepresentatie. De 10- en 100-objectmetingen bevatten vijf moves; bij 500 objecten is één move per variant gemeten vanwege de kostbare volledige objectenlijst.

| Fixture | Puntsoort | Moves | Totaal vóór (ms) | Totaal na (ms) | Lijst vóór → na | Inspector vóór → na | Canvas vóór → na |
|---:|---|---:|---:|---:|---:|---:|---:|
| 10 | Gewoon punt | 5 | 226,9 | 82,8 | 5 → 0 | 5 → 5 | 5 → 5 |
| 100 | Bronpunt met afhankelijke constructies | 5 | 4.954,1 | 289,8 | 5 → 0 | 5 → 5 | 5 → 5 |
| 500 | Gewoon punt | 1 | 20.935,7 | 313,1 | 1 → 0 | 1 → 1 | 1 → 1 |
| 500 | Bronpunt met afhankelijke constructies | 1 | 20.760,5 | 338,9 | 1 → 0 | 1 → 1 | 1 → 1 |

Deze runs maten voor de volledige verwerking een reductie van 63,5% bij de 10-objectfixture, 94,2% bij de afhankelijke 100-objectfixture en 98,4–98,5% bij de twee 500-objectmetingen. Dat zijn uitsluitend de resultaten van deze headless proef. De 100-objectfixture heeft geen vrij sleepbaar punt zonder downstream-afhankelijkheden; daarom is daar alleen de afhankelijke variant gemeten. De 10-objectfixture bevat geen afhankelijke constructies. De 500-objectfixture bevat beide puntsoorten.

Bij 500 objecten kostte de volledige lijst-render in deze run circa 20,5 seconden. Na de wijziging bleef één canvas- en één inspectorrender nodig; samen met pointerverwerking kostte dat circa 313–339 ms. Dat blijft boven een frame van 16,7 ms. Deze optimalisatie voorkomt de gemeten lijstkosten, maar bewijst geen vloeiende 60fps-presentatie.

Herhaal vanaf de repository-root met:

```sh
node experiments/perf-1.2b1/drag-invalidation-benchmark.cjs
```

De benchmark is bewust beperkt; layout, paint, compositorpresentatie en zichtbare schermframetijden zijn niet gemeten.

## Tests

- `node --test --test-reporter=dot tests/lifecycle.test.cjs` — **PASS**, alle lifecycle-tests.
- `PERF_1_2B1_ONLY=1 node tests/browser.cjs` — **PASS** in Edge 155: bronpunt en midpoint bewegen samen, snapping is actief, de inspectorcoördinaat wordt bijgewerkt, lijst-DOM blijft gelijk, undo/redo werkt en Escape/pointercancel rollen terug. Geen paginafouten.
- `npm test` — **754/754 PASS** op de definitieve code.
- Volledige Edge-suite niet uitgevoerd. Die browserrun is buitensporig lang (eerder circa 55 minuten); de gerichte sleepcontrole is uitgevoerd. Volledige browserregressie blijft een open acceptatiepunt.

## Resterende risico's

- De canvasrender en inspector blijven per geverwerkte dragframe werken. Grote documenten kunnen daardoor nog steeds langer dan één schermframe verwerken.
- De beperkte benchmark telt slechts één move per variant bij 500 objecten en meet geen gebruikerslatentie op een zichtbaar venster.
- De volledige Edge-regressiesuite is niet opnieuw gedraaid; de gerichte Edge-test en volledige Node-suite zijn de uitgevoerde validatie.

## Status

Branchwerk is niet gemerged naar `main`. PERF-1.2b.2 is niet gestart.
