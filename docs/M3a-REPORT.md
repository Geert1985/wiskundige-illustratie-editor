# M3a - History en omkeerbare JSON-import

Datum: 2026-10-09. Oordeel: **M3a PASS**.

## Uitgangspunt en akkoord

Branch: `chatgpt/math-illustration-stabilization`.
Lokale en opgehaalde remote HEAD bij start: `40e126234f5f26580c3433c35bc9a2895636398c`, de handmatig geaccepteerde M2b-versie.
Baseline: 206/206 Node-tests. De productie-werkboom was schoon; de bestaande untracked FEATURE-GAP-ANALYSIS.md is behouden en niet gecommit.

De gebruiker koos expliciet: JSON-import wordt een undo/redo-stap; Nieuw blijft de geschiedenis wissen. Alleen roadmapcheckpoint M3a is uitgevoerd. M3b, groepen, layers en andere milestones zijn niet gestart.

## Compatibiliteitsbesluit en gedrag

| Pad | Geschiedenis |
|---|---|
| JSON-bestand importeren via de interface | Een omkeerbare documentvervanging; eerdere geschiedenis blijft beschikbaar |
| EditorApp.importDocument(data) | Hetzelfde gevalideerde importpad |
| Identiek document importeren | Geen extra stap; bestaande selectie en redo behouden |
| Ongeldige JSON/schema, dubbele IDs of ongeldige presentatie | Geen document- of historywijziging |
| Nieuw | Leeg document en gewiste auteurgeschiedenis, zoals voorheen |
| Programmatisch loadDocument(data) | Bestaande resetsemantiek blijft behouden |
| Directe legacy Engine.load(data) | Bestaande engine-API; geen editorhistory-eigenaar |
| Cursus/toets importDocument/importFile | MODE_DENIED; M2b-beperkingen blijven gelden |

Import is vervanging, geen samenvoeging van objecten. Undo herstelt het vorige document met metadata, presentatie en selectie; redo herstelt het geimporteerde document. Een actieve preview wordt bij een geldige import geannuleerd voordat de committed basisstate voor undo wordt vastgelegd. Bestaande afzonderlijke blur/pointercancel-regels blijven gelden.

## Implementatie

EditorApp.importDocument valideert eerst een los kandidaatdocument met de bestaande Engine/model/presentatievalidatie. Daarna gebruikt het de bestaande semantische document.replace-opdracht en EditorHistory. Er is geen nieuwe pointercontroller of renderroute.

Bij ontbrekende presentatievelden blijft de bestaande fallbackpresentatie behouden. Een actieve pan levert daarbij zijn oorspronkelijke bounds als fallback, zodat tijdelijke panstate niet onbedoeld wordt geimporteerd.

Bestandslezingen krijgen een serial. Nieuwe import, Nieuw, succesvolle programmatische load en dispose maken oudere reads ongeldig. Een late callback mag het nieuwere document niet overschrijven. Leesfouten ruimen de reader en het bestandsveld op zodat opnieuw proberen mogelijk blijft.

De assetversie is consequent bijgewerkt naar `20261009-m3a-import-history`. Documentversie, permissiecontract, bestaande objecttypen, golden fixtures en bestaande tests zijn behouden.

## Tests-first en verificatie

Vijf nieuwe importregressietests faalden voor implementatie. Een aanvullende test toonde vervolgens een late-read-overschrijving na programmatisch laden aan. Beide rode testlogs zijn bij de oplevering bewaard.

**Node: 212/212 PASS**: alle bestaande 206 plus zes nieuwe tests.
Commando: `node --test math-illustration/tests/*.test.cjs`.

Nieuwe gevallen:

1. Een undo/redo-stap herstelt document, presentatie en multiselectie.
2. Weigering behoudt actieve drag, pointer capture, geometry, historycursor en redo.
3. Geldige import annuleert preview en bewaart de committed basis; identieke import behoudt redo.
4. Eerdere geschiedenis blijft beschikbaar achter de importstap.
5. Restricted import blijft verboden en verandert sessie/context/history niet.
6. Late reads na load, Nieuw, dispose of nieuwere import kunnen geen document overschrijven.

**Echte Edge-suite: PASS**, inclusief alle bestaande groepen en M2b-permissieproeven; geen pageErrors.
Commando: `node math-illustration/tests/browser.cjs`, Playwright met geinstalleerde Edge.
Nieuwe browsergroep: echte file-input, een historyentry, document/presentatie/selectie, v3 gekoppelde constructies bij roundtrip, undo/redo, ongeldige JSON, dubbele IDs met behoud van redo, identieke import en Nieuw.

De Edge-test vond dat een identieke import de selectie leegmaakte. Dat is hersteld zonder fixtures of bestaande assertions aan te passen. Bronsearch bevestigt een pointerdown-owner en een canvas.innerHTML-renderpad. git diff --check slaagt; de bestaande fixturesdirectory heeft geen wijzigingen.

## Bestanden en commits

- `d70e80b60aff0c67e5a3949d858dc6684b53036b`: tests-first voor omkeerbare import en foutafhandeling.
- `12fac4902fa3f739f9c9bf77aa723cb089f9fdbe`: import/history, serial/read-cleanup, cacheversie en browserregressies.
- De documentatiecommit die dit rapport toevoegt.

Gewijzigd: editor.js, editor.html, tests/lifecycle.test.cjs, tests/browser.cjs.
Toegevoegd: tests/browser-import-history.cjs en docs/M3a-REPORT.md.

## Resterende grenzen

Geschiedenis blijft lokaal en tijdelijk, met de bestaande entry-/geheugenlimieten. Ze wordt niet in documenten opgeslagen. Nieuw, loadDocument en herladen van de pagina zijn bewust geschiedenisgrenzen. Een groot document kan door de bestaande historybudgetten oudere entries verdringen; de nieuwste stap blijft behouden.

Import geeft learners geen nieuwe rechten en telt niet als wiskundig methodebewijs. Additive learnerimport, beveiligde servervalidatie, blijvende groepen en layers vallen buiten M3a.

Stop bij M3a. Handmatige controle: teken een object, importeer een ander JSON-document, druk Ctrl+Z en Ctrl+Y; controleer daarna dat Nieuw de geschiedenis wist.
