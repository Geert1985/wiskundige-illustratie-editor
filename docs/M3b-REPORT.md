# M3b - Blijvende groepen

Datum: 2026-10-09. Oordeel: **M3b PASS** voor automatische verificatie. Handmatige acceptatie staat nog open.

## Uitgangspunt en scope

Branch: `chatgpt/math-illustration-stabilization`.
Gecontroleerde lokale en remote startcommit: `afad4bbe4af40d48004b70270b738864e5fdc3b6`, de gevalideerde M3a-versie. Baseline: **212/212 Node-tests**. De productie-werkboom was schoon. De bestaande untracked `docs/FEATURE-GAP-ANALYSIS.md` is behouden en niet gecommit.

Alleen M3b uit de goedgekeurde roadmap is uitgevoerd: blijvende groeps-ID's en membership, groepsselectie, nesting, opheffen, verwijderen, rigide verplaatsen, dupliceren en behoud via history/import/export. M3c/lagen en andere milestones zijn niet gestart.

## Resultaat en architectuur

Groepen zijn aparte, onveranderlijke documentrecords; geometrische objecten behouden hun type, stijl, volgorde en afhankelijkheden. `PersistentGroups` valideert de groepsboom en levert expansion, volledige selectie-eenheden en pruning. Model/Engine beheren opslag; `group.create` en `group.ungroup` lopen door de bestaande autorisatiegrens.

De editor gebruikt dezelfde interaction-controller, CoordinateTransform, centrale render/invalidation, selectiepresentatie en geschiedenis. Klikken op een lid selecteert de bovenliggende groep. Sleepbewegingen gebruiken één resolvervector en de semantische `object.translate`-operatie. Locked/hidden/invalid leden of ontbrekende vrije bronnen verhinderen gedeeltelijke verplaatsing. Afgeleide objecten blijven hun bronnen volgen.

De inspector biedt Groeperen en Groep opheffen, met Ctrl/Meta+G en Ctrl/Meta+Shift+G. De objectlijst toont top-level groepen. Groepen kunnen worden gecombineerd tot een bovenliggende groep. Opheffen verwijdert één niveau en behoudt subgroepen. Delete ruimt lege of enkelvoudige groepen op. Dupliceren van een volledige groep kopieert de hiërarchie en remapt interne constructiebronnen wanneer die mee worden gekopieerd.

Containment vereist alle leden; crossing één geraakt lid. Beide gebruiken de bestaande geometrische resolver en vereisen volledige canvas-selecteerbaarheid. Ctrl+A slaat onvolledige verborgen groepen over. Groepen met verborgen/ongeldige leden kunnen door de auteur via de lijst worden geïnspecteerd. Hover en verplaatscursor respecteren deze beschikbaarheid; membership/eligibility worden per onveranderlijke modelsnapshot hergebruikt.

Restricted runtimes weigeren groepsstructuurwijzigingen, ook via directe facade-aanroepen. Read-projecties bevatten geen onleesbare member-ID's. Selectie en translatie beoordelen de volledige private groep. JSON-export met onleesbare groepsreferenties wordt geweigerd. Er is geen permissie-inheritance of nieuw policyformaat.

Een browserproef ontdekte dat statische auteurknoppen na restricted mounting uitgeschakeld bleven. Een tests-first correctie leidt hun status bij author initialization opnieuw af, zodat groepsdocumenten na die overgang kunnen worden opgeslagen en geëxporteerd.

Broncontrole: één `pointerdown`-eigenaar en één `canvas.innerHTML`-render-eigenaar in editor.js. Geen tweede pointercontroller/renderpad. De bestaande SnapService/InteractionResolver-contracten blijven behouden; SnapService sluit de descendants van verplaatste bronnen al uit. De extra snappingtest borgt dit bestaande gedrag. `interaction-resolver.js` heeft geen netto wijziging ten opzichte van de startcommit.

## Documentcompatibiliteit

Zie `M3b-GROUP-SCHEMA-ADR.md` voor de volledige regels en API's.

- Documenten met groepen: versie 4, `groupSchema: 1`, gesloten groepsrecords met `id/name/members`.
- Documenten zonder groepen: bestaande versie 2/3. Constructies behouden `constructionSchema: 1`.
- Legacy ongetypeerde `groups/groupSchema`-extensies blijven intact; creëren weigert overschrijven.
- Unieke gedeelde ID-namespace, maximaal één parent, bestaande referenties, geen cycles/overlaps, diepte maximaal 64. Validatie gebeurt vóór statevervanging; bij weigering blijven document en allocator intact.
- Geen golden fixtures gewijzigd. SVG-export verandert niet door membership of selectie.

## Tests-first en resultaten

De eerste nieuwe Node-run gaf 9 failures van 10 tests: de groeps-API en schema/permissionprojectie ontbraken. Graph-rejectiontests zijn daarna versterkt met een eerst succesvolle geldige v4-load, zodat een algemene onbekende-versiefout geen graph-validation kan simuleren. De vijf nieuwe editor-lifecycleproeven faalden vóór UI-implementatie. Aparte red-runs reproduceerden achterblijvende disabled auteurknoppen, gedeeltelijke hidden select-all en ontbrekende hover-invalidation. Bestaand correct gedrag, waaronder descendant snap-exclusion, heeft aanvullende compatibiliteitstests.

**Volledige Node-suite: 235/235 PASS, 0 failures/skips**. Dit zijn de 212 oorspronkelijke tests plus 23 nieuwe regressietests:

| Bestand | Nieuwe tests | Dekking |
|---|---:|---|
| tests/persistent-groups.test.cjs | 15 | Geometrie/SVG onveranderd, nesting/ungroup, corrupt schema/cycles/overlap, allocator, roundtrip, pruning, duplicate hierarchy, legacy extensions, author commands/locks, restricted structuur/read/export, diepte, rigide dependencies, remappen van copied sources, snapping |
| tests/lifecycle.test.cjs | 8 | Klik/modifier unit selection, shortcuts/inspector/list/history, contain/cross/cancel, grouped labeldrag/Escape, locks/hidden roots, author controls, hidden select-all, hover invalidation/cache |

**Volledige echte Microsoft Edge-suite: PASS**, alle bestaande 18 browsermodules plus de nieuwe persistent-groups-module en de bestaande startup/import/exportcontroles. `pageErrors: []`.

De nieuwe browserproeven toetsen inspector/shortcuts, klik op leden en labels, selectieaccenten/geen handles, rigide preview=commit, nested ungroup/duplicate/delete, undo/redo, save/reload, JSON-download/import met undo, SVG zonder editoroverlays, directionele kaderselectie op twee zoomniveaus, zes cancellationroutes, Nieuw tijdens drag, pointer-up buiten het canvas, locks, hidden hover/select-all, gekoppelde midpoint-translatie en restricted structuurwijzigingen.

Uitgevoerd:

```text
node --test math-illustration/tests/*.test.cjs
node math-illustration/tests/browser.cjs
git diff --check
git diff --name-only <startcommit> -- math-illustration/tests/fixtures
```

Testlogs worden als UTF-8 deliverables naast dit verslag beschikbaar gesteld. De Edge-run gebruikt Playwright met channel `msedge`, echte muis/toetsenbordinteracties en downloads; Node-tests alleen worden niet als browserbewijs geteld.

## Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| persistent-groups.js | Nieuwe pure groepsregels en iteratieve traversal/pruning |
| model.js | Frozen groups, atomic schema-load, allocator, create/ungroup/delete/clear/serialize |
| index.js | Groeps-API en duplication met hierarchy/source remapping |
| permission-runtime.js | Semantische commands, mode-grens, read/selection/translation/export closure |
| editor.js | Groepsselectie, rigide commanddrag, inspector/list/shortcuts, rectangle/hover/cache, author control reset |
| editor.html | Expliciete service-load, gezamenlijk assettoken, bedieningstekst |
| tests/helpers.cjs | Service-load in Node-runtime |
| tests/persistent-groups.test.cjs | 15 nieuwe regressietests |
| tests/lifecycle.test.cjs | 8 nieuwe regressietests |
| tests/browser-persistent-groups.cjs | Nieuwe echte Edge-proeven |
| tests/browser.cjs | Integratie in volledige suite |
| docs/M3b-GROUP-SCHEMA-ADR.md | Schema-, UX-, permissie- en compatibiliteitscontract |
| docs/M3b-REPORT.md | Dit rapport |

## Resterende beperkingen en handmatige acceptatie

Oudere builds kunnen versie-4-documenten niet openen. Standalone loaders moeten de nieuwe groepsservice vóór Engine-initialisatie laden. Groepsdiepte is bewust begrensd op 64.

Er is geen aparte tool om een object binnen een groep te bewerken; hef de gewenste groepslaag op om individueel te editen. De UI gebruikt de standaard groepsnaam en biedt nog geen groepsnaam-editor. Externe constructiebronnen die bij dupliceren niet mee worden gekopieerd houden het bestaande detached-copygedrag. Groepen zijn organisatorisch: zelfstandig geautoriseerde geometry/parameterupdates blijven hun eigen contract volgen en zijn geen groeps-transformatie.

Handmatige controle: groepeer twee objecten, klik/sleep één lid, controleer undo/redo; groepeer die groep samen met een derde object, hef één niveau op; controleer save/reload en een locked lid. Vernieuw de editorpagina om het nieuwe assettoken te laden.

**M3b PASS** voor de afgebakende automatische acceptatiecriteria. Stop na dit checkpoint; wacht op handmatige acceptatie voordat M3c wordt gestart.

## Exacte ontwikkelcommits

De onderstaande reeks bevat de tests-first checkpoints, implementatie en verificatie. De reportcommit volgt op deze geteste code-HEAD; die wijzigt uitsluitend documentatie.

```text
8b603843a5328a3b46dd096219efd9908584d8ea test(editor): reproduce persistent group schema hierarchy and permission requirements
bef398ef5c7371e9c92f24b2bcd17d91c71242f1 test(editor): cover persistent group selection lifecycle and history
03a3f655540aba853c47112b3d1c3a841860a3b0 test(editor): cover group permission closure and linked duplicate sources
a3073a86193b4dca9edd4997fb6435cb6f0273e5 test(editor): reproduce author controls retained from restricted mount
9236b92f8705a0d09f7ef1b32cb03faad5c5531c test(editor): reject partial hidden groups in select-all
f98837d18833fb1847c8f6d8af2b287d844f9ca3 test(editor): cover grouped hover invalidation and shared eligibility
9e17f41c290a6303ec9afd502c8a18b1247ede6a feat(editor): persist nested groups with v4 schema and authorization guards
fd811ab14d991d09f4cbcc93e7ad0fa22694ddb1 feat(editor): integrate persistent group selection movement and history
944a35b2e301fa2f230cc7496e255ee116803e2d test(editor): exclude derived selection members from group snap candidates
ca16a45d40f34dfb555e02f3d8a7c1e313b12af3 fix(editor): exclude all selected members during rigid group snapping
baba2571061f8aff7ab8192282ea9132452afeda Revert "fix(editor): exclude all selected members during rigid group snapping"
dc9272c9059a86566994519e4d32aaa2c5a87a95 test(editor): verify linked group dragging with geometric snapping enabled
```

Geteste code-HEAD: `dc9272c9059a86566994519e4d32aaa2c5a87a95`.
