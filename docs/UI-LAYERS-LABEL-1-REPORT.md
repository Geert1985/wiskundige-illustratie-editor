# UI-LAYERS-LABEL-1 — Implementatierapport

Datum: 17 oktober 2026. Branch: `codex/ui-layers-label-toggle`.
Basis: nieuwste opgehaalde `origin/main`, `7a67837`.
Implementatiecommit: `f52fe7d`. Dit rapport wordt in een volgende documentatiecommit toegevoegd.
Status: geïmplementeerd en geautomatiseerd getest op featurebranch; gebruikersacceptatie open. Geen merge naar main.

## Bediening en toestand

Iedere objectregel heeft naast het oog een native T-knop. Iedere laagkop heeft dezelfde knop. Alleen de bestaande `showLabel` wordt gewijzigd; selectie, geometrie en object-/laagzichtbaarheid blijven behouden. Geen modelvelden of opslagwijzigingen.

Alle labels zichtbaar: laagklik verbergt alles. Minstens één verborgen: laagklik toont alles. `aria-pressed` is `true`, `false` of `mixed`; gemengd heeft een subtiele gouden, gestippelde onderstreping. Actief is goud, inactief neutraal. Tooltips, aria-labels, hover, focus-visible en native Enter/Spatie zijn aanwezig. Focus wordt na vervanging van de lijst teruggezet op dezelfde T-knop. Knopafmetingen volgen de bestaande oogknoppen (laag 22×24, gelaagd object 22×22).

## Commando's en autorisatie

`labelToggleState` bepaalt de actuele leden via `engine.get`, capabilities (`propertyFields` met `showLabel`), lockstatus en `allowed('object.setProperties', payload)`. De uitvoering berekent dit opnieuw; verouderde UI of synthetische clicks omzeilen de controle niet. Het bestaande commando valideert ook zelf.

Een laagklik gebruikt één `object.setProperties` met alle IDs uit `layer.members` en één veld `showLabel`. Veilige afhandeling: alles of niets; lege lagen, ontbrekende objecten, vergrendeling of ontbrekende rechten schakelen de knop uit. Er wordt geen bewerkbare subset aangepast. De tooltip verklaart de uitgeschakelde laagknop. Restricted sessies volgen de bestaande gefilterde documentweergave en commandolimieten; verborgen/niet-geautoriseerde bronnen worden niet extra opgevraagd of getoond.

`changeDocument` en de bestaande command-/historyroute maken één laagklik één Undo/Redo-stap. De bestaande render/invalidatie leest iedere keer de actuele documenttoestand, ook na eigenschappenwijzigingen, history, laden en laagtoewijzing. De restricted control-pass respecteert dezelfde labelautorisatie.

## Uitgevoerde tests

- `node --check editor.js`: PASS.
- `node --test --test-name-pattern=UI-LAYERS-LABEL tests/lifecycle.test.cjs`: 2/2 PASS.
- `npm test`: 737/737 PASS, nul skips of failures.
- PowerShell `$env:LAYER_LABELS_ONLY='1'; node tests/browser.cjs`: gerichte headless Edge PASS, geen page errors. Opnieuw uitgevoerd na laatste CSS-aanpassing.
- `git diff --check`: PASS.

Node-dekking: onafhankelijk object, gemengde/volledige laag, tweede laag onaangetast, verplaatsen tussen lagen, Undo/Redo in één stap, selectie/geometrie/visibility behouden, JSON-roundtrip, lege/missende leden, locks en beperkte propertyrechten zonder gedeeltelijke mutaties.

Edge-dekking: drie punten, object-/laagknoppen, mixed aria-state, Enter/Spatie en focusbehoud, Undo/Redo, oog onafhankelijk van label, verplaatsen, locks en disabled states. 680×720 viewport met geopende mobiele zijbalk: beide laagkoppen clientWidth/scrollWidth 300/300, alle vijf knoppen 22 px breed. Screenshot `test-results/ui-layers-label-narrow.png` visueel beoordeeld: lange namen afgekapt, controls zichtbaar.

## Beperkingen en handmatige acceptatie

Volledige bestaande Edge-suite niet uitgevoerd; de volledige Node-suite en gerichte Edge-suite wel. Handmatige gebruikersacceptatie voor verschillende objecttypen en eigen documenten blijft open. Een label kan door andere bestaande weergavevoorwaarden (bijvoorbeeld verborgen object/laag) onzichtbaar blijven terwijl `showLabel` aan staat; de T-knop weerspiegelt uitsluitend deze eigenschap. Geen tweede labelsysteem.

## Gewijzigde bestanden

- `editor.js`: gedeelde status/markup/actie, object-/laagknoppen, autorisatie en focusherstel.
- `editor.css`: compacte labelknoppen en status/focusstyling.
- `tests/lifecycle.test.cjs`: gerichte regressies met echte command-/historyroute.
- `tests/browser-layer-labels.cjs`: Edge-acceptatie.
- `tests/browser.cjs`: gerichte suitekeuze `LAYER_LABELS_ONLY`.
- `AGENTS.md`, `docs/DEVELOPMENT-ROADMAP.md`: actuele afspraken en status.
- `docs/UI-LAYERS-LABEL-1-REPORT.md`: dit rapport.
