# M4a-REPORT ? Constructiecontract

## Oordeel

**M4a PASS.** Automatische verificatie voltooid. Handmatige acceptatie blijft het volgende checkpoint; M4b is niet gestart.

## Uitgangspunt

Branch: `chatgpt/math-illustration-stabilization`.
Gecontroleerde lokale en opgehaalde remote startcommit: `239f64746619c732f8525f085852faf883c539eb`.
Baseline: 255/255 Node-tests geslaagd. Het bestaande ongevolgde FEATURE-GAP-ANALYSIS.md is niet gewijzigd of opgenomen.

## Architectuur en gedrag

ConstructionService heeft nu een onveranderlijk register voor de acht bestaande constructierecepten, hun bronrollen, resultaattypen, berekende velden en tangenttakken. ReferenceOptions, validatie, evaluatie en inspectie gebruiken dit contract. De bestaande wiskundige calculators blijven behouden.

De inspector toont bronnen, vervolgobjecten en specifieke ongeldigheidsredenen. Navigatie gebruikt de bestaande selectie. Constructie losmaken maakt de huidige geometrie vrij met behoud van ID, presentatie, groep en laag. Afhankelijke objecten blijven aan hetzelfde ID gekoppeld. De operatie is atomair en vormt een undo/redo-stap. Ongeldige of vergrendelde constructies kunnen niet worden losgemaakt.

Direct wijzigen van berekende velden en impliciet verwijderen van de constructielink worden geweigerd. Auteurmodus gebruikt de expliciete detach-operatie. Cursus- en toetsmodus weigeren losmaken; inspectie projecteert uitsluitend leesbare bronnen en vervolgobjecten. Een indirecte bronwijziging blijft toegestaan volgens het bestaande permissiecontract.

Labelannulering herstelt alleen labeloffsets, zodat een tussentijdse bronwijziging niet wordt teruggedraaid en pointer capture correct vrijkomt. Er blijft een interaction-controller en centraal renderpad. CoordinateTransform, SnapService en InteractionResolver zijn niet gewijzigd.

## Compatibiliteit en beperkingen

Geen documentversiewijziging: bestaande versies 1?5 en bronextensies blijven behouden. Geen golden fixtures aangepast. Een losgemaakt object wordt als vrij object opgeslagen; historische constructieherkomst wordt niet bewaard.

Vertex- en edge-referenties blijven positionele indices. Aantalwijzigingen worden geweigerd zolang zulke referenties bestaan; gelijkblijvende aantallen behouden indexidentiteit. Een herordening met hetzelfde aantal is niet te onderscheiden van coordinatenbewerking. Stabiele vertex-IDs vereisen een latere, expliciete migratie.

Onjuiste bronrollen en betekenisloze onderdelen/indices worden nu atomair geweigerd bij import. Oudere documenten die dergelijke ongeldige referenties bevatten moeten eerst worden gecorrigeerd; er is geen stille reparatie. Nieuwe bronankers, UI voor opnieuw koppelen, command replay en methodebewijs behoren niet tot M4a.

## Tests-first en verificatie

De nieuwe regressies zijn voor implementatie uitgevoerd: het versterkte contractpakket had 10 failures en 1 bestaande positieve testcase; het aanvullende UI-pakket had 5 failures; linkverwijdering en labelrollback hadden 2 failures. Daarna zijn de minimale oplossingen toegevoegd.

20 nieuwe Node-tests dekken contractimmutabiliteit, bronrollen, topology, invaliditeit/herstel, detach-atomiciteit, legacy-extensies, permissies, berekende velden, tangenttakken, een keten van 2500 constructies, inspector/navigatie, undo/redo en labelrollback.

- Volledige Node-suite: **275/275 PASS**, 0 failures, 0 skips; alle 255 eerdere tests behouden.
- Volledige echte Microsoft Edge-suite: **PASS**, inclusief alle bestaande modules en nieuwe constructionContract-proeven; `pageErrors: []`.
- Nieuwe browserproeven: bron-/vervolgnavigatie, recompute, labelannulering met bronwijziging, losmaken met groep/laag, undo/redo, downstream links, save/reload/import/SVG, ongeldige tangent en herstel, locks, topology-atomiciteit, ongeldige import en cursus-/toetsautorisatie met bronredactie.
- `git diff --check`: PASS.
- Broncodesearch: een canvas-pointerdown-eigenaar en een canvas.innerHTML-renderpad; geen tweede interactie- of renderdienst toegevoegd.

## Gewijzigde bestanden

- construction-service.js: register, referenties, evaluatie, inspectie en mutatieguards.
- model.js: referentievalidatie, atomaire detach en berekende-veld/topology-guards.
- index.js: engine-inspectie en detach-API.
- permission-runtime.js: contractgestuurde outputs en expliciete autorisatie/projectie.
- editor.js, editor.css, editor.html: inspector, bronselectie, detach, labelrollback en assetversie.
- tests/construction-contract.test.cjs, tests/lifecycle.test.cjs: 20 regressies.
- tests/browser-construction-contract.cjs, tests/browser.cjs: echte Edge-proeven en suite-integratie.
- docs/M4a-CONSTRUCTION-CONTRACT.md en dit rapport.

## Exacte ontwikkelcommits

```
d26edfbb0e92817b3bf99cf7bbe8d278281b3731 test(editor): define construction capabilities references reasons and detachment
ee58a5e92e4dbf5d6deeae8339a86de919e1f7ee test(editor): reject calculated-field mutation and require explicit detach API
bbb8d77d05c24de5f62db8d712d475578ab6e598 test(editor): cover construction inspection undo and stable tangent branches
f617b3576a2d237ecd5d3ffe5785abb4cc3a5c03 test(editor): cover link removal bypass and label rollback with changing sources
f4f8e3604640f0743ddf0eb6048d086549e5ce1b feat(editor): centralize construction capabilities references and detachment
58dfe753452a07eeef750146d937a2df90ac3e30 feat(editor): inspect construction sources reasons and reversible unlinking
```

De rapportcommit is uitsluitend documentatie. De bovenstaande productiecode is de volledig geteste versie.

## Handmatige acceptatie

Maak een middenpunt, selecteer het en navigeer naar een bron. Maak de constructie los: bronverplaatsing mag het vrije punt niet meer verplaatsen; undo moet de koppeling herstellen. Controleer ook een tangent met het bronpunt binnen de cirkel: de inspector toont de reden en de constructie herstelt zodra het punt weer geldig staat.

Na acceptatie kan M4b afzonderlijk worden gestart. Er is nog geen M4b-implementatie uitgevoerd.
