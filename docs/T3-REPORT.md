# T3 — Meerdere dynamische inlinevelden

Versie 1.0.1, 2026-10-12. Repository `Geert1985/wiskundige-illustratie-editor`, branch `chatgpt/editor-development`. Baseline: `b006b1fce018af0e1366dd6990af0f24462ac4f2`.

Uitgevoerd na expliciete toestemming “T3 mag je starten”. Het implementatiecontract is vooraf vastgelegd in [T3-CONTRACT.md](T3-CONTRACT.md). T3 is opgeleverd voor gebruikersacceptatie; **T4 is niet gestart**. Eerdere handmatige IME/AT-controles zijn niet als geslaagd aangemerkt.

## Geleverde functies

- `{}` opent een bron-/eigenschap-/notatiepaneel. Meerdere velden in dezelfde tekst behouden hun eigen bron, precisie, eenheid, prefix/suffix en marks. Een coördinatenpaar is twee velden met gewone interpunctie.
- Bronnen leveren bestaande DynamicText-eigenschappen: naam/label, lengte, straal, omtrek, oppervlakte, hoek en punt-x/y. Diameter, vectorcomponenten en assen zijn niet nieuw toegevoegd.
- `dynamicValue` is een atomisch schema-3-fragment: selecteren, dubbelklik/Enter om te openen, verplaatsen, verwijderen en lokale undo. Bookmarks behouden de invoegpositie. Eén bevestiging is één documentcommit; annuleren wijzigt niets.
- Waarden worden uit de actuele geautoriseerde snapshot berekend. Geometry drag, eenheden/schaal, bronverwijdering/herstel en autorisatie-intrekking gebruiken geen opgeslagen waarde. Breedteverandering verplaatst het tekstanker niet.
- Bestaande legacytekst krijgt een expliciete “Omzetten naar inline dynamische tekst”-actie. De draft vertaalt prefix/veld/suffix en behoudt bindingsprecisie, kleur, font en anchor. OK verwijdert textBinding, bewaart de oorspronkelijke statische `.text` als server-owned `legacyStaticText` en behoudt positie/rotatie/organisatie. Cancel doet niets. Documentundo herstelt de oorspronkelijke volledige binding; statisch herstellen is een aparte bewuste actie.
- Dupliceren van inline tekst alleen behoudt bronnen; meegekopieerde bronnen worden omgebonden naar hun kopie. Legacyduplicatie blijft op het eerdere pad.
- JSON/import, typed commands/replay, history, restricted projecties, SVG en offline SVG→PNG ondersteunen schema 3. De gewone tekstinput in de inspector wordt bij rijke tekst verborgen; bewerken verloopt via de rich editor.

Geen automatische legacyconversie bij openen, nieuw rekencommando, dynamic-expression-engine, automatische wrapping of nieuwe productie-PNG-exportknop. Deze blijven buiten T3.

## Model, formattering en compatibiliteit

Document v7 accepteert textSchema 1/2/3 en declareert het hoogste behouden objectschema. Schema 4/calculatedValue blijft afgewezen. Schema 3 bewaart uitsluitend binding/format/marks, geen source name, HTML/SVG, computedValue of editor-JSON. `.text` is een veilige afgeleide fallback met unavailable-plaatsaanduidingen.

unitMode: document; none (suffix verbergen, schaal behouden); u/dimensionless; mm/cm/m/km. Fysieke omzetting gebruikt MeasurementUnits eenmaal, met kwadratische schaal voor oppervlakte. Onverenigbare fysieke/abstracte keuzes leveren een placeholder. angleMode=document volgt bestaande bron-/documentinstellingen; deg/rad zijn veldspecifieke overrides. Precisie null of 0–10. Ongeldige constructies, verwijderde bronnen, overflow en ongeldige legacy-eenheidsmetadata tonen “niet beschikbaar”. Bronwaarden boven 4096 codepunten worden begrensd tot een invalid-placeholder. Maximaal 128 velden/tekst en 512/document, naast bestaande tekst-/commandquota.

`legacyStaticText` is vanaf schema 3 getypeerde herstelmetadata, geen cache van een bronwaarde. Oudere opaque extensions met dezelfde key blijven inert en roundtrip behouden. Een upgradecollision wordt geweigerd; data wordt niet overschreven. Unsupported legacyfonts of opmaak buiten de rich allowlist worden eveneens geweigerd in plaats van stil vervangen. Restricted projectie laat de private backup weg; trusted state/undo bewaart hem.

## Autorisatie en levenscyclus

In restricted mode vereist elk actief veld effectieve bron-read/display inclusief laag/objectbeschikbaarheid en een eigenschapgrant in textSourceProperties. Locks van bronnen blokkeren lezen niet; een targetlock blokkeert wijziging. Author mag hidden/locked bronnen lezen en missing IDs bewaren voor herstel.

Content+references is vereist voor invoegen/verwijderen/rebinden; format voor gewijzigde marks/notatie. Een onveranderde opgemaakte atom verplaatsen vergt content. Nieuwe objecten en duplicaten controleren created grants afzonderlijk. Eerdere en voorgestelde references worden bij text.commit opnieuw gevalideerd. Restricted rich bewerken en statisch herstellen worden geweigerd zolang eerdere velden niet-toegestane of onbeschikbare bronnen hebben; dit voorkomt dat een geredigeerde DTO private bindings stil verwijdert. Een trusted author kan deze wel herstellen. Geweigerde operaties zijn atomair. Source-propertyallowlists worden niet meer door de oude geometrieveldvalidator afgewezen.

Geweigerde restricted waarden worden als hele atom vervangen door plain “niet beschikbaar”, zonder binding-ID/property/naam/format/eerdere uitkomst. Dit geldt voor facade, JSON/SVG, preview en commandresultaten. De bestaande legacybinding-readpolicy blijft ongewijzigd.

Runtime-editor drafts gebruiken een opaque begin/commit-handle, documentrevision en permission epoch. Policywijziging sluit de draft; geometriewijziging maakt een eerdere commit stale en behoudt de draft voor annuleren/heropenen. Author-drafts bewaren de openingsrevisie. Geen automatische rebase.

## Onderhoudbaarheid en build

| Onderdeel | Verdeling |
|---|---|
| `text-values.js` | Getypeerde binding/format, actuele waarde/status, redactie en expliciete legacyvertaling |
| `text-dependencies.js` | Tijdelijke reverse index over immutable snapshots; `Engine.getTextDependents` |
| `model.js`, `index.js` | Schema/quotas/atomische tekstcommit en statisch herstel; selectieve source remap |
| `permission-runtime.js`, `text-content-diff.js` | Categories/sourcegrants, veilige projectie, revision/epoch en canonical diff |
| `renderer.js`, bestaande rich renderer | Geautoriseerde waardeoplossing vóór gedeelde lay-out; geen opgeslagen waardecache |
| `rich-text-editor.js`, `text-insert-panel.js`, `editor.js` | Atomadapter, child pane en host-dialoog/commanddispatch |

Er zijn geen nieuwe dependencies geïnstalleerd. Bestaande gepinde ProseMirror/MathJax-buildtools worden hergebruikt. Nieuwste buildmetadata staat in `experiments/text-editor-build/build-results.json`; historische T2-proeven blijven intact. Herbouw via `npm run build:text` is opnieuw uitgevoerd met dezelfde hashes:

- Editorbundle: 217220 raw bytes / 67660 gzip; SHA-256 `201147efd84883b1e090c8f746a3018b817b90f1d92f1ee1198cd397537ea16a`.
- Formulebundle ongewijzigd: 1645994 raw bytes / 569782 gzip; SHA-256 `4428d112a106fa821f941475ba868dd674b4f9ca142335f6c0d23c7cca0b1815`.

De reverse index is ephemeral en ontdekt dependencies; geen claim van incrementele renderoptimalisatie. Rendering blijft de bestaande snapshotpipeline. Nodeviews vervangen alleen gewijzigde previewwaarden en negeren interne presentatie-mutaties bij terugparsen naar ProseMirror. Dit houdt draftinhoud en lokale history onafhankelijk van bronbeweging.

## Werkelijk uitgevoerde tests

Omgeving: Windows, Node 22.18.0, npm 10.9.3, headless Microsoft Edge 155.0.4283.45. Definitieve machineleesbare resultaten: `experiments/text-editor-build/T3-verification.json`. Lokale ruwe logs: `test-results/t3-node-full.log`, `t3-edge-full.log`, `t3-edge-focused.log`; deze logs zijn genegeerd. Screenshotbewijs: `experiments/text-editor-build/t3-fullscreen.png`.

| Run | Definitief resultaat |
|---|---|
| Volledige `npm test` | **437/437 PASS**, exit 0; 0 fail/cancelled/skipped/todo; duur 11598,9712 ms |
| Volledige `npm run test:edge` | **PASS**, exit 0; 49 testmodules naast de hoofdproef; pageErrors leeg |
| Nieuwe Node-module | 19 tests, opgenomen in de volledige suite |
| Gerichte T3-Edge-module na bronrechtencorrectie | 20 benoemde controles PASS; exit 0; pageErrors leeg |
| Bestaande gerichte T2-Edge-module | 16 controles PASS; 4 offline rasterfixtures; pageErrors leeg |
| `npm run build:text` | Exit 0; identieke bundlehashes bij laatste herbouw |
| `git diff --check` | Geen whitespacefouten |

De 19 Node-tests dekken schema/source-only opslag, formattering/schaal/oppervlakte/conversie/hoeken, live rendering en stabiele anchors, dependencies/source-remap, de 12-fixture legacy-migratiematrix, implicit-migration denial en typography, category/sourcegrants, gemarkeerde atomverplaatsing, volledige redactie/revocation, create/duplicate grants, hidden lagen/locked bronnen, restricted migratie/undo/redo/statisch herstel, replay/revision/epoch/targetlock, quotas/self-reference/type, linked invalidity/recovery, overflow/metadata/naamlimiet, opaque extensioncollisions en geweigerde commits/herstelacties vanuit geredigeerde DTOs.

De 20 browsercontroles zijn: threeFieldsTwoSources, sourceChooser, notation, atomicStyleDeleteUndo, atomDrag, mathMixed, documentHistory, pointDrag, deleteRecovery, scale, cancel, saveReload, offlineSvgPng, fullscreenEscape, legacyMigration, legacyStaticRestore, restrictedChooser, staleRevision, epochRevocationRedaction en redactedDraftPreservesBinding.

Browserbewijs omvat drie velden uit twee bronnen, plus een radiaalhoek en formule; actual stepped mouse drag van een atom met behoud van ID/binding/format/marks; echte bronpuntversleping; source delete/undo; schaalwijziging zonder geometrywijziging; Cancel; JSON/draft herladen met koude formule-assets; fullscreen Escape kindpaneel→editor zonder exit; bewuste legacyomzetting met private Cancel/één OK/exacte undo; en een echte restricted host met bronallowlist/revisionconflict/epochrevocation.

Offline mixed export gebruikt embedded fonts en formulepaden: SVG decodeert naar Image/canvas/PNG terwijl de browsercontext offline staat. PNG, ink-pixels, actuele dynamische waarde en zelfstandige SVG zijn geverifieerd. Dit is een rastergate, geen geleverde productie-PNG-bediening. De laatste volledige suite telde 2504 ink-pixels; alle vier rasterchecks zijn true in T3-verification.json.

Tijdens uitvoering werden echte codecorrecties aangebracht: sourceallowlists kregen hun eigen validatorpad; dynamic-reference/notationgrants en commandresultredactie werden toegevoegd; drafts kregen begin/commit-context; preview-DOM blijft stabiel bij dezelfde waarde; backup-extensioncollisions blijven compatibel; geredigeerde drafts kunnen eerdere private velden niet meer impliciet afvlakken bij bevestigen of statisch herstellen; en de inactieve inspector-fallbackinput voor rich text werd verborgen. Testfixtures zijn gecorrigeerd voor een TeX-backslash, SVG-tekst verspreid over meerdere runs en keyboardcursorpositie na atomselectie. De dragcheck gebruikt een volledige muisbeweging en controleert daadwerkelijk gewijzigde volgorde, niet een gesimuleerde statewijziging. Functionaliteit is niet verwijderd om een test te laten slagen.

## Resterende controles en grenzen

**NIET UITGEVOERD:** echte Windows-IME-compositie naast bronvelden; schermlezer/AT-navigatie; OS-clipboard in externe toepassingen; handmatige visuele acceptatie op fysieke apparaten; externe SVG-viewers; de volledige handmatige twaalf-fixture legacy-lifecyclematrix. Headless testbewijs vervangt die controles niet. Unicode/shaping buiten de bestaande lokale fontdekking wordt niet volledig geclaimd.

Bekende grenzen: conservatieve formatgrants bij verschoven gemengde tekstgrenzen; afwijzing van onverenigbare unitfamilies en unsupported legacyopmaak; synchrone SVG vereist geladen formule-assets wanneer math aanwezig is; private backups worden in restricted uitvoer weggelaten. Bestaande MathJax-bundelomvang/fontkeuze blijft zoals in T2. T4-wrapping/exportbediening en T5-rekenen zijn nog niet begonnen.

Praktische acceptatie: maak een cirkel en een punt. Voeg in één tekst straal, x en y via `{}` toe. Sleep het punt, wijzig de straal/schaal, verwijder een bron en herstel met undo. Controleer decimalen/eenheid, veldkleur, JSON herladen en SVG. Zet een bestaande legacybinding expliciet om; Cancel moet alles behouden, OK moet met één undo teruggaan. Herhaal bronveld bewerken in fullscreen; Escape sluit eerst het paneel, dan de editor, met behoud van fullscreen.

Wacht op gebruikersacceptatie. Start T4 pas na afzonderlijke toestemming.
