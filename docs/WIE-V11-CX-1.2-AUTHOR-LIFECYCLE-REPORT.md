# WIE V11-CX-1.2 — Author lifecycle-verificatie

**Status:** geïsoleerde verificatie; geen productie-integratie
**Werkbranch:** `codex/v11-cx1-2-author-lifecycle`
**Basis:** actuele `origin/develop`, commit `506cdd213a79a9ad12451c94df08dce5a0c74249`
**CX-1-referentie:** `codex/v11-cx1-cortexjs-authorisatie` op `1780c48f5eca12d7b552d6e8b8d81df2d7d12de0`
**Architectuurreferentie:** `chore/v11-cortexjs-first-architecture` op `32eb556a97a702377726b9899876e5868e678dc3`, contract v0.3.0
**CX-1.1:** het in de opdrachtcontext aangeleverde productie-autorisatievoorstel; dit voorstel is hier als ontwerpinput gebruikt, niet als bestaand repositorybestand.

## 1. Conclusie

De proef toont dat monotone author-revisies, hostcontextidentiteiten en broninstantie-generaties eenvoudig buiten document-JSON en buiten Undo kunnen worden bijgehouden **als alle mutaties door één vertrouwde hostgrens gaan**. Een afgeschermde coördinator kan dan commits, history-restore en tijdelijke previews conservatief invalideren.

De huidige WIE-code biedt die exclusieve grens niet. `MI.Engine` houdt publieke mutatiemethoden beschikbaar; `MI.AuthorCommands` heeft geen abonnements-/commit-event-API; `EditorHistory` herstelt direct via `engine.load()`; en author-preview-/annuleerroutes gebruiken directe Engine-mutaties. De geïsoleerde test demonstreert dat een binding na een niet-geobserveerde `engine.update()` en `engine.load()` geldig lijkt te blijven.

**Advies: NO GO voor CX-1.3 als productieve CalculationHost.** Eerst is een afzonderlijk goedgekeurd, afdwingbaar mutatiegrenscontract nodig. De lifecycle-module in deze branch is uitsluitend een technische proef en maakt de huidige productiemutaties niet veilig.

## 2. Onderzochte mutatiepaden

| Pad | Huidige code en gedrag | Lifecycle-dekking |
|---|---|---|
| `AuthorCommands`-transacties | `permission-runtime.js`: `MI.AuthorCommands.execute()` valideert een command, vervangt `engine.model` door een kandidaat en houdt een private teller bij die document-JSON vergelijkt. De teller is niet publiek en er is geen commit-event. Editorcommando's lopen via `EditorApp.execute()` in `editor.js`. | Goed omwikkelbaar, maar de huidige façade publiceert geen betrouwbare author-revisie of lifecycle-event. De proef coördineert alleen calls die door haar eigen `execute()` lopen. |
| Directe Engine-mutaties | `index.js` biedt o.a. `add`, `update`, `updateMany`, `remove`, `duplicateMany`, groeps-/laagmutaties, constructiehelpers en `load`. Deze roepen modelmutaties aan of vervangen model/renderer rechtstreeks. | **Ongedekt.** Een caller met de Engine-referentie kan de host omzeilen. |
| Author-interactie-preview | `editor.js` `updateObject()` gebruikt voor author wijzigingen `this.execute(...)`; pointerinteracties wijzigen echter tijdens slepen Engine-objecten rechtstreeks. De pointerbeweging toont daarmee tijdelijke geometrie voordat `commit()` de history-entry registreert. | Niet als aparte author-transactie afgeschermd. Tijdelijke mutaties kunnen langs de hostgrens gaan. |
| Annuleren | `EditorApp.cancel()` herstelt object-/groepsgeometrie met `engine.update()`/`updateMany()`; cirkelverdelingspreview herlaadt het document via `engine.load()`. Preview-start, herstel en annulering leveren geen algemene lifecycle-event. | Ongedekt in productie. De proef-preview-wrapper invalideert bij begin én einde, ook bij annuleren, maar de bestaande editor roept die wrapper niet aan. |
| Undo/Redo | `editor-history.js` `EditorHistory.restore()` roept `app.engine.load()` aan; `undo()`/`redo()` wijzigen daarna alleen de historycursor. `EditorApp.travelHistory()` roept history direct aan. Dit is geen `AuthorCommands`-transactie. | Ongedekt in productie. De proef toont correcte invalidatie wanneer dezelfde history-module uitsluitend via `lifecycle.undo()`/`redo()` wordt aangeroepen. |
| Import en documentvervanging | `EditorApp.importDocument()` bouwt eerst een tijdelijke kandidaat-Engine en valideert die. De daadwerkelijke vervanging loopt daarna via `document.replace`. `loadDocument()` en `newDocument()` gebruiken eveneens author commands. | Het commandpad is omwikkelbaar; de voorafgaande kandidaat-load is geïsoleerd en wijzigt het actieve document niet. Directe externe `Engine.load()` blijft ongedekt. Vervanging moet hostcontext roteren. |
| Objectcreatie/verwijderen/hergebruik ID | Commandgebaseerde creatie, duplicatie en verwijdering lopen via `AuthorCommands`; model-ID's worden binnen een document gegenereerd. Verwijderen en history/import kunnen een eerdere ID later terugbrengen. `Engine.add/remove` zijn ook publiek. | De proef registreert generaties voor geobserveerde aanwezigheidswissels. Zonder gegarandeerde mutatiegrens kan rechtstreeks verwijderen/hercreëren met dezelfde ID niet betrouwbaar worden waargenomen. |
| Andere documentmutaties | Metadata, instellingen, groepen, lagen, cirkelverdelingen en constructie-updates lopen in de UI grotendeels via commands. Documentpreview van cirkelverdeling gebruikt daarnaast raw `load()` en `setCircleDistribution()`. | Commandmutaties zijn met een expliciete lijst te omwikkelen; een lijst alleen vangt geen nieuwe of rechtstreekse paden af. |

### Restricted-modus afzonderlijk

`RuntimeSession` in `permission-runtime.js` heeft al een eigen `documentRevision` en `permissionEpoch`. `#apply()` verhoogt revisie bij gewijzigde kandidaat of reset, invalideert transacties, en publiceert commit-events; policyvervanging verhoogt de epoch en wist handles. Preview werkt op een kandidaat en commit controleert revisie/epoch opnieuw. De nieuwe author-teller mag deze restricted-semantiek niet vervangen of met haar teller verwarren. Bestaande restricted-testresultaten hieronder bevestigen alleen de betrokken bestaande cases.

## 3. Lifecycle-contract in de proef

`experiments/v11-cx1-2/lifecycle-coordinator.cjs` implementeert een geïsoleerde coördinator met:

- Een willekeurige, niet-herbruikbare hostcontext-ID per context.
- Een strikt oplopende documentrevisie in geheugen, onafhankelijk van document-JSON.
- Een afzonderlijke oplopende generatie per bron-ID. De high-watermark blijft buiten documentstate bestaan; verwijdering wist de teller niet.
- Ondoorzichtige bindings met context-ID, documentrevisie, invalidatiegeneratie, bron-ID en broninstantie-generatie.
- Eén controle die oude context, revisie, bronaanwezigheid, generatie, actieve preview en gesloten host afwijst.
- Previewbegin en -einde invalideren eerder uitgegeven bindings. Annuleren zet geen generatie terug.
- History-restore via de coördinator verhoogt revisie; een door Undo teruggebrachte bron krijgt door afwezigheid/herstel een nieuwe instantie-generatie. Redo maakt die bron weer afwezig.
- Documentvervanging/reset wist de huidige aanwezigheidsset, verhoogt generaties van terugkerende ID's en roteert de hostcontext.
- `dispose()` sluit de host en maakt verdere selectie/controle onmogelijk.

De module vereist bij selectie expliciet `mutationBoundaryClosed: true`; zonder die verklaring weigert zij fail closed bindings te maken. Dit is nadrukkelijk een testcontract, geen verifieerbare eigenschap van de huidige applicatie. De module kan niet zelf detecteren of er elders nog een alias naar `Engine` bestaat. De direct-mutatie-regressietest bewijst die beperking.

Revisie wordt bij elk succesvol command uit de documentmutatielijst verhoogd, ook als de uiteindelijke wijziging mogelijk een no-op blijkt. Dat is bewust conservatief: een onnodige herberekening is veiliger dan een geldig blijvend oud resultaat. Voor productie is een gezaghebbende commit-event met expliciete `changed`/revision-semantiek beter.

## 4. Wat de proef bewijst en niet bewijst

De tests gebruiken echte `MI.Engine`, `MI.AuthorCommands` en `MI.EditorHistory`-implementaties geladen via `tests/helpers.cjs`. Ze bewijzen dat de lifecyclelogica de vereiste monotone metadata kan beheren wanneer author command-, preview- en historybewerkingen door één wrapper lopen.

De proef bewijst **niet** dat huidige productiepaden die wrapper gebruiken. De test `directe Engine-mutaties zijn expliciet ongedekt` doet opzettelijk een raw `engine.update()` en `engine.load()` nadat een binding is aangemaakt: de revisie verandert niet en de coördinator verklaart de oude binding nog geldig. Dit is een reproductie van de beveiligingsblokkade, niet een geslaagde veiligheidsacceptatie. De wrapper kan alleen veilig zijn als de host de enige eigenaar van de Engine is en geen muterende alias aan editor-/plugincode aanbiedt.

Dezelfde JSON in twee Engine-instanties wordt niet als identiteit gebruikt; de hostcontext-ID verschilt. Bij documentvervanging roteert context, ook als dezelfde bron-ID en dezelfde JSON terugkomen. Een ABA-cyclus van waarde wijzigen en herstellen invalideert het oude resultaat via revisie, ongeacht de eindwaarde.

## 5. ABA en bron-ID-hergebruik

| Geval | Resultaat in de proef |
|---|---|
| Geometrische update | Generatie blijft gelijk; documentrevisie stijgt; oude binding wordt ongeldig. |
| Verwijderen | Binding ongeldig en bronselectie faalt. |
| Undo van verwijderen | Geometrie keert terug, maar de herstelde ID krijgt een hogere generatie; oude binding blijft ongeldig. |
| Redo | Bron wordt opnieuw afwezig; ook de na Undo gemaakte binding wordt ongeldig. |
| Document vervangen met dezelfde bron-ID | Context roteert en generatie stijgt; geen automatische herbinding. |
| Twee identieke documenten | Verschillende context-ID's; bindings zijn niet uitwisselbaar. |
| Waarde wijzigen en identiek herstellen (ABA) | Revisie stijgt voor beide commits; oude binding blijft ongeldig. |
| Raw `Engine.update()`/`load()` | Geen revisie-event; bestaande binding blijft schijnbaar geldig. **Blokkade.** |

## 6. Minimale productie-uitbreidingen

Voordat CX-1.3 begint, is minimaal een afzonderlijk goedgekeurde productiewijziging nodig:

1. **Eén gezaghebbende author-host eigenaar** beheert de actieve Engine, hostcontext, documentrevisie en brongeneraties buiten documentgeschiedenis. De Engine-mutator mag niet publiek beschikbaar blijven naast de host.
2. **Alle canonieke commits** moeten via die host lopen. `AuthorCommands` kan behouden blijven als validator/commandservice, maar moet aan de host een betrouwbare commit-uitkomst/event leveren of alleen vanuit de host bereikbaar zijn. Een private JSON-stempel of objectreferentie is geen mutatiecontract.
3. **History/import/reset** moeten dezelfde hostgrens gebruiken. `EditorHistory.restore()` mag niet ongeobserveerd `engine.load()` uitvoeren. Undo/Redo verhogen author-revisie nooit terugwaarts; terugkeer van een verwijderd ID krijgt een nieuwe broninstantie-generatie.
4. **Preview wordt expliciet transient.** De veilige minimale route is preview-state los van de canonieke Engine, met preview-token/generatie. Bestaande directe muterende previews en rollback moeten via die grens lopen of door niet-mutatieve overlay-state worden vervangen. Elke preview-start invalideert bestaande berekeningsresultaten; annuleren herstelt hun geldigheid niet.
5. **Mutatievolledigheid afdwingen.** Een facade-only wrapper volstaat niet zolang `EditorApp` en andere code de raw Engine houden. De host moet Engine-operaties afschermen of ownership zo organiseren dat alleen hostfuncties kunnen muteren. Elke niet-ondersteunde mutator moet de host sluiten/markeren als onbetrouwbaar, niet stilzwijgend doorgaan.
6. **Batchsnapshotservice** gebruikt de hostcontext, monotone revisie, epoch waar restricted van toepassing is, bron-ID + generatie en actuele rechten in één atomaire snapshot. Publicatie controleert dezelfde stempels opnieuw.

Dit is de kleinste beveiligingsuitbreiding; geen brede editorrefactoring is nodig als de ownershipgrens smal kan worden ingebracht. Bestaande UI-commandvalidatie, Engine/modelwaarheid, importformaat en T5a-metingen blijven behouden. Voor restricted-modus blijft `RuntimeSession` eigenaar van zijn reeds bestaande revisie-, epoch- en autorisatiecontract.

## 7. Blokkades en aandachtspunten

- De bestaande `AuthorCommands` interne revisie vergelijkt JSON en is alleen op aanvraag gesynchroniseerd; ze is niet monotone bewijsmetadata met publieke eventgarantie.
- Directe mutators en raw Engine-referenties maken author-invalidatie onvolledig. Alleen documenthashes of objectreferenties zouden dit niet oplossen.
- `EditorHistory` doet raw documentload bij Undo/Redo; preview-annulering kan ook raw load/update uitvoeren. Een levenscycluscoördinator naast deze code voldoet niet.
- UI-preview is in author-modus niet overal een aparte kandidaat. Als een berekening tijdens een tijdelijke wijziging kan lopen, moet deze eerst ongeldig worden en na annulering ongeldig blijven.
- Voor productie moeten muterende paden uit de volledige runtime/editor worden opgesomd en gecontroleerd; deze proef inventariseert de belangrijkste public API- en editorpaden, geen plugin-/toekomstige code.
- Bron-generatie is host-lokaal en mag niet worden geserialiseerd of hersteld uit document/history. Hostcontextrotatie voorkomt cross-document hergebruik.

## 8. Testresultaten

Alleen de afgesproken lifecycle- en direct betrokken autorisatietests zijn uitgevoerd.

| Commando | Resultaat |
|---|---|
| `node --test experiments/v11-cx1-2/test/lifecycle.test.cjs` | 11/11 geslaagd. Omvat author-commandrevisie, update, delete/Undo/Redo, ID-hergebruik, contextrotatie, identieke JSON, ABA, raw mutator-tegenvoorbeeld, preview-cancel, dispose en fail-closed grensverklaring. |
| `node --test --test-name-pattern="M2b preview never mutates committed state|M2b transaction belongs to one session|M2b author-ui commands enforce locks" tests/permissions.test.cjs` | 3/3 geselecteerde tests geslaagd. Bestaande restricted-preview/revisie/handle-invalidation en AuthorCommands-locktests. |
| `git diff --check` | Geslaagd. |

Geen volledige Node- of Edge-suite, browserproef, productiecodewijziging of dependency-installatie uitgevoerd.

## 9. Gewijzigde bestanden

- `experiments/v11-cx1-2/lifecycle-coordinator.cjs` — geïsoleerde lifecycle-coördinator.
- `experiments/v11-cx1-2/test/lifecycle.test.cjs` — elf gerichte lifecycle- en blokkeringsproeven.
- `docs/WIE-V11-CX-1.2-AUTHOR-LIFECYCLE-REPORT.md` — dit rapport.

## 10. Contractcorrectie en besluit

CX-1.1's host-/snapshotvoorstel moet voor author-modus expliciet vereisen dat de host **exclusieve mutatie-eigendom** heeft, inclusief EditorHistory-restore, previews, annulering, documentimport/-vervanging en publieke Engine-mutators. Een event/teller die alleen `AuthorCommands`-transacties observeert is onvoldoende. Als exclusieve ownership niet haalbaar is, moet hostsnapshotselectie fail closed zijn.

**Eindadvies: NO GO voor CX-1.3 totdat deze grens als afzonderlijk productiecontract is goedgekeurd en de ongedekte paden gesloten zijn.** De lifecycle-invarianten zelf zijn in de geïsoleerde wrapper reproduceerbaar; de huidige productiearchitectuur levert nog niet de benodigde volledigheidsgarantie.
