# M3c - Benoemde lagen, volgorde en zichtbaarheid

Datum: 2026-10-09. Oordeel: **M3c PASS** voor automatische verificatie. Handmatige acceptatie staat nog open.

## Uitgangspunt en scope

Branch: `chatgpt/math-illustration-stabilization`. Lokale en opgehaalde remote startcommit: `98771537bc1d41104d2341ae7f035e24583dc4f1`, inclusief de handmatig geaccepteerde constructievisibility-correctie. Remote en lokaal waren gelijk; de productie-werkboom was schoon. Baseline: **238/238 Node-tests**. De bestaande untracked FEATURE-GAP-ANALYSIS.md is behouden en niet gecommit.

Alleen M3c uit de goedgekeurde roadmap is uitgevoerd: named layers/order/visibility/lijst, gelijke paint/hit/export-semantiek, migration en history. M4, nieuwe wiskundige objecttypen, transformaties en policy-inheritance zijn niet gestart.

## Nieuwe architectuur en gedrag

`DocumentLayers` biedt validatie, layer lookup en tekenvolgorde. Het model bewaart frozen laagrecords los van objectgeometrie en groepen. Engine geeft laagbewerkingen en effectieve zichtbaarheid door. De bestaande renderer gebruikt dezelfde laagvolgorde voor canvas en zelfstandige SVG-export. Editorselectie, hover, handles, constructiebronkeuze en snapping respecteren laagzichtbaarheid.

De objectlijst toont lagen vooraan bovenaan. De auteur kan toevoegen, hernoemen, verbergen/tonen, naar voren/achteren verplaatsen en verwijderen. In de inspector kan de selectie naar een laag worden verplaatst. Een groep blijft volledig op dezelfde laag; groeperen over meerdere lagen of een gedeeltelijke groep verplaatsen wordt atomair geweigerd. Objectlocks blijven de bestaande geometrische bewerkingen en verwijdering begrenzen.

De eerste laagbewerking maakt een Basislaag voor de bestaande objecten plus de nieuwe lege laag. Nieuwe objecten en constructies komen op de bovenste zichtbare laag. Er is geen aparte actieve-laagmodus. Zijn alle lagen verborgen, dan wordt creatie geweigerd zonder state-/ID-verandering. Duplicaten blijven op de oorspronkelijke laag en behouden de gekopieerde groepsstructuur.

Verbergen van een laag verandert geen objectoogknop, stijl, coördinaat of constructierelatie. Verborgen bronnen blijven zichtbare constructies op andere lagen bijwerken. De auteur kan verborgen objecten via de lijst inspecteren; ze hebben geen canvas-hit, hover, handles of drag. Laagstatus invalideert movement/hover-caches ook als de geometrische objectsnapshot onveranderd is.

Toewijzing aan de huidige laag is een no-op. Verwijderen behoudt alle objecten op de aangrenzende lagere laag, of de hogere laag wanneer de onderste wordt verwijderd. De onderlinge tekenvolgorde blijft bij samenvoegen behouden; de zichtbaarheid van de ontvangende laag geldt. De laatste laag kan niet worden verwijderd. Nieuw/reset verwijdert de laagstructuur. Bewerkingen lopen via de bestaande command/historygrens, inclusief annulering van een actieve sleepbeweging.

## Schema, compatibiliteit en autorisatie

Zie `M3c-LAYER-SCHEMA-ADR.md` voor het volledige contract.

Documenten met lagen gebruiken versie 5 en `layerSchema: 1`. Elke laag heeft exact `id`, `name`, `visible`, `members`. Laag- en membervolgorde lopen achter naar voor. Elk object heeft exact één laag; lege lagen zijn toegestaan. IDs zijn uniek over objecten/groepen/lagen, namen niet leeg en maximaal 200 tekens, visibility boolean. Imports controleren het schema, alle referenties en groep/laagconsistentie vóór documentvervanging.

Documenten zonder lagen behouden versie 2/3/4 en hun oude inhoud. Groups behouden groupSchema 1; constructies constructionSchema 1. Legacy opaque layer-extensies worden niet automatisch geïnterpreteerd of overschreven. Geen golden fixtures gewijzigd. Standalone loaders moeten document-layers.js vóór Engine-initialisatie laden; oudere builds ondersteunen versie 5 niet.

`layer.create/assign/rename/setVisibility/reorder/delete` zijn author-only, ook via directe restricted-facade-aanroepen: MODE_DENIED. Restricted readonly projecties bevatten alleen leesbare objectreferenties; geheel onleesbare niet-lege lagen worden weggelaten. JSON-export weigert onleesbare oorspronkelijke membership. SVG bevat uitsluitend leesbare, effectief zichtbare objecten. Gewone directe mutaties op verborgen objects worden geweigerd; expliciete author-configured parameterbindings behouden hun bestaande rechten op verborgen bronnen. Serverautoriteit blijft M17.

## Tests-first en verificatie

De eerste tien nieuwe laageisen faalden allemaal vóór implementatie. Een tweede red-run reproduceerde drie aanvullende gaten: ontbrekende editorbediening/effectieve zichtbaarheid en onstabiele no-op/samenvoegvolgorde. Aanvullende compatibiliteitstests controleren reeds correct gedrag voor atomair annuleren, private read closure en expliciete parameterbindingen.

**Volledige Node-suite: 255/255 PASS**, zonder failures of skips. Alle 238 oorspronkelijke tests blijven slagen. Nieuw:

| Bestand | Nieuwe tests | Dekking |
|---|---:|---|
| tests/layers.test.cjs | 14 | Eerste laag/legacy paint, gezamenlijke paint-hit-export-volgorde, hidden snap/select/SVG, groepsatomiciteit, rename/reorder/delete/clear, nested group/dependency/lock-roundtrip, ongeldig schema, opaque legacy metadata, new/duplicate/delete membership, restricted commandgrens, no-op/mergevolgorde, allocator/all-hidden creation, readonly read closure, hidden-source parameterbinding |
| tests/lifecycle.test.cjs | 3 | Hidden-layer cache/hover/movement/render/history, UI/inspectorassignment/history, annulering van actieve groepsdrag vóór laagbewerking |

**Volledige echte Edge-suite: PASS**, alle 19 bestaande browsermodules plus browser-layers.cjs en de bestaande startup/import/exportcontroles. `pageErrors: []`.

De nieuwe Edge-proeven controleren toevoegen/hernoemen/toewijzen, overlapselectie na reorder, canvasvolgorde, undo/redo, laagvisibility zonder objectwijziging, snapping, cross-layer groepsweigering, volledige groepstoewijzing, locks, verborgen bronnen en gekoppelde midpoint-update, save/reload, JSON/SVG-downloads, import met undo/redo, actieve dragannulering, layerdelete/mergehistory en restricted readonly startup.

De lagenbediening is visueel gecontroleerd met een echte Edge-screenshot: naamvelden, oogknoppen, pijlen en objectrijen passen in het bestaande zijpaneel.

Broncodesearch bevestigt één pointerdown-eigenaar en één canvas.innerHTML-renderpad in editor.js. CoordinateTransform, SnapService en InteractionResolver blijven behouden. `git diff --check` slaagt; de bestaande fixtures zijn ongewijzigd.

```text
node --test math-illustration/tests/*.test.cjs
node math-illustration/tests/browser.cjs
git diff --check
git diff --name-only <startcommit> -- math-illustration/tests/fixtures
```

## Gewijzigde bestanden

- document-layers.js: pure laagregels, lookup en volgorde.
- model.js: frozen lagen, atomic mutation/import, gedeelde ID-namespace, membership en versie 5.
- index.js: laag-API, layer-aware selectie/snapping en duplicatiemembership.
- renderer.js: gedeelde tekenvolgorde en laagzichtbaarheid.
- permission-runtime.js: layer commands, private visibility/read/exportprojecties en guardrails.
- editor.js: laagbediening, inspectorassignment, list ordering, source/selection/overlaygates en cache-invalidation.
- editor.html/editor.css: expliciete service-load, gezamenlijk cachetoken, bedieningstekst en laagrijen.
- tests/helpers.cjs: expliciete service-load in Node.
- tests/layers.test.cjs, tests/lifecycle.test.cjs: 17 regressietests.
- tests/browser-layers.cjs, tests/browser.cjs: echte Edge-proeven en suite-integratie.
- docs/M3c-LAYER-SCHEMA-ADR.md, docs/M3c-REPORT.md: contract en rapport.

## Resterende beperkingen en acceptatie

M3c bevat geen laaglocks, nested layers, actieve-laagselector of afzonderlijke object-orderknoppen binnen een laag. Objectlocks en blijvende groepen blijven beschikbaar. Nieuwe objecten komen op de bovenste zichtbare laag; kies daarna desgewenst een andere laag in de inspector. Het verwijderen van een laag erft de zichtbaarheid van de ontvangende laag en is omkeerbaar.

Handmatig: vernieuw de preview, voeg twee lagen toe, verplaats een object/groep via de inspector, test de pijlen bij overlappende objecten, verberg/toon een laag en controleer undo/redo en save/reload.

**M3c PASS** voor de afgebakende automatische criteria. Stop hier en wacht op handmatige acceptatie; M4 is niet gestart.

## Exacte commits

```text
e18839c30e17b79f261d6f36d081dfa86093c941 test(editor): define named layer ordering visibility and migration contracts
5f696f8a7c4b9dade05a8a41e76013aeb2b95fff test(editor): cover layer controls history lifecycle and stable ordering
710f566fef064fac2f1d7ffa630ca1d006cab9fc test(editor): verify layer allocator atomicity and restricted read closure
f028ab9dbbeb0e00875c16c796b4c483d2f3db1a feat(editor): persist validated layers with shared paint and visibility semantics
072aaa0a1d59513a2508f233f73499cfad49ab12 feat(editor): add named layer controls ordering and selection assignment
76008c0c6d4ab2899fd868ffd2b3cf059e470fbb test(editor): preserve explicit parameter grants on hidden source layers
```

Geteste functionele code: `072aaa0a1d59513a2508f233f73499cfad49ab12`; volledige Node-test-HEAD na extra compatibiliteitstest: `76008c0c6d4ab2899fd868ffd2b3cf059e470fbb`.
