# WIE-TOOL-L1 — Betrouwbare succes- en foutafhandeling

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l1-command-results`.
Basis: opgehaalde `origin/main`, `e0b157fce4a17368016982193cdf9d5f0f04f911`.

## Resultaat en afbakening

L1 is geïmplementeerd en gericht getest. Een geweigerde constructie rapporteert geen succes en veroorzaakt geen succesgedreven terugkeer naar Selecteren. Padpunt, ellips-Q en parallellogram bewaren bruikbare bronnen en tijdelijke invoer zodat opnieuw bevestigen mogelijk blijft. Generieke constructies behouden de bronnen vóór de mislukte laatste klik. Directe contextconstructies retourneren bij commandfalen `false`.

De expliciete gebruikersopdracht geeft implementatie-GO voor L1 en bevestigt optie A. De meegeleverde [contractkopie v1.0.0](WIE-GEREEDSCHAPSLEVENSCYCLUS-Contract-v1.0.0.md) is ongewijzigd opgenomen, inclusief de historische statusregel “Ontwerpvoorstel ter goedkeuring”. Die regel beperkt de latere uitdrukkelijke L1-opdracht niet. L2 is niet geïmplementeerd; geen policyregister of centrale lifecyclecontroller toegevoegd. Geen geometrie-, schema-, rechten- of UI-herontwerp.

## Techniek

`changeDocument(fn, options)` retourneert nu `{ok:true,result:fnResult,error:null}` of `{ok:false,result:null,error}`. Commandexceptions blijven als foutmelding zichtbaar en worden ook aan de aanroeper teruggegeven. Bestaande aanroepen zonder opties behouden annuleren-vóór-bewerken en de bestaande historygrens. Callbacks die geen waarde retourneren mogen een geslaagde actie met `result:undefined` opleveren; nul nieuwe objecten is niet automatisch een fout.

Constructieplaatsingen gebruiken lokaal `{cancelInteraction:false}`. Daardoor wist de documentactie niet langer vóór commanduitvoering de bronnen, preview en numerieke waarden. De betrokken aanroepers beëindigen de interactie pas wanneer `outcome.ok` bevestigd is. Pointercapture wordt expliciet vrijgegeven; mislukte plaatsing kan opnieuw bevestigd of normaal geannuleerd worden. Succes wist tijdelijke preview en feedback en behoudt de bestaande selectiebedoeling.

De Snijpunt-route gebruikt dezelfde resultaatcontrole om na een commandfout de eerste bron te behouden. Bij succes blijven het bestaande `setTool('select')`, alle nieuwe snijpunten als selectie en `intersectionCompleted=true` intact. Er is geen nieuwe dispatcher of gewijzigde snijpuntberekening.

Parallellogramcreatie en optionele bronhernoeming waren al afzonderlijke commando's. Een hernoemfout na geslaagde geometriecreatie mag niet als mislukte creatie worden behandeld: anders kan opnieuw bevestigen een tweede parallellogram maken. Daarom sluit deze situatie af met een expliciete melding dat het parallellogram is toegevoegd maar de bronpunten niet konden worden hernoemd. De bestaande commandvalidatie blijft voor elke hernoeming gelden.

`changeDocument()` is geen algemene transactionele wrapper voor willekeurige callbacks die meerdere commando's uitvoeren. Atomiciteit van één geautoriseerd commando blijft bij de bestaande command-/modelgrens. Er is geen extra snapshotrollback of tweede history-engine toegevoegd. Een eventueel alles-of-niets-contract voor geometrie plus meerdere optionele hernoemingen vraagt afzonderlijke scope.

## Gewijzigde bestanden

- `editor.js`: expliciet documentresultaat; lokale succescontrole en invoerbehoud voor generieke constructies, padpunt, ellips-Q, parallellogram, context-complete en Snijpunt.
- `tests/lifecycle.test.cjs`: bestaande fixture laadt nu ook de echte intersection-dispatcher; dertien gerichte L1-tests.
- `docs/WIE-GEREEDSCHAPSLEVENSCYCLUS-Contract-v1.0.0.md`: exacte kopie van aangeleverd ontwerpcontract.
- `docs/WIE-TOOL-L1-REPORT.md`: dit verslag.
- `docs/DEVELOPMENT-ROADMAP.md`: L1-branchstatus en vervolgpoort; geen main-integratieclaim.

## Uitgevoerde verificatie

Definitieve gerichte commandoregel, vanuit de branchcheckout:

```powershell
node --test --test-reporter=spec --test-name-pattern='WIE-TOOL-L1|construction source selection|bisector accepts|bisector of a triangle|PERF-1.2b1 restricted' tests/lifecycle.test.cjs
```

**19/19 PASS:** dertien nieuwe L1-tests en zes geselecteerde bestaande controles. De nieuwe tests dekken:

| Onderwerp | Bewijs |
|---|---|
| Documentresultaat | Callbackwaarde en exception-identiteit teruggegeven; geen lege history-entry; ook succes zonder nieuwe objecten |
| Vrije creatie | Twee opeenvolgende lijnstukken en een driehoek behouden hun tool |
| Padpunt, ellips en parallellogram | Foutinjectie: nul documentmutaties, nul history, bronnen/selectie behouden, geen succesmelding/toolreset; retry exact één history-stap, undo/redo en geen dubbele commit |
| Numerieke invoer | Parallellogramvelden blijven na commandfalen behouden; NaN-invoer blokkeert commit |
| Generieke constructie | Eerste bron blijft bij fout; retry creëert en selecteert juiste gekoppelde object |
| Context-complete | `false` en echte foutmelding bij weigering; vorige tool en selectie behouden; succesvolle retry bewaart tool |
| Snijpunt | Geforceerde commandfout behoudt eerste bron; retry maakt twee snijpunten, selecteert beide en sluit eenmaal af |
| PermissionRuntime | Echte niet-toegestane commanduitvoering laat volledige owner-inspectie/history ongewijzigd; toegestaan Middenpunt kan in één runtimehistorystap worden ongedaan gemaakt |
| Annulering | Esc na mislukte ellipsplaatsing wist bronnen, preview en capture zonder document/historymutatie |
| Ongeldige plaatsing | Padpunt buiten tolerantie commit niet; echte onmogelijke raaklijncommand weigert en behoudt cirkelbron |
| Optionele naamgeving | Fout ná geslaagde parallellogramcreatie meldt onderscheid en opent geen duplicerende retry |

De zes bestaande tests betreffen Esc/blur/pointercancel tijdens bronselectie, bissectrice vanuit bestaande hoek en driehoekvertex, en restricted drag/preview/annulering.

Aanvullende controles:

```powershell
node --check editor.js
git diff --check
```

Beide geslaagd. De Git-waarschuwing over automatische LF→CRLF-conversie betreft lokale line-endingconfiguratie, geen inhoudelijke fout.

Tijdens testontwikkeling zijn foutieve fixtureverwachtingen gecorrigeerd: een nooit gecapturede pointer heeft geen `capture:null`-veld nodig; na runtime-undo blijven auditlog/revisie en redohistorie terecht bestaan; een nieuwe onmogelijke raaklijn wordt door de bestaande engine geweigerd. De definitieve tests controleren respectievelijk daadwerkelijke capture-status, hersteld document plus historycursor en echte commandweigering. Er zijn geen productieacceptatiecriteria versoepeld.

**Niet uitgevoerd:** volledige Node-suite, browserregressiesuite of Edge-run, conform opdracht. De tests gebruiken de bestaande gesimuleerde DOM-fixture, niet een echte browser.

## L1-acceptatie en vervolg

| Criterium | Beoordeling |
|---|---|
| Betrouwbaar resultaat voor documentcallback/commandexception | PASS binnen bestaande synchrone documentactiegrens |
| Geen valse succesmelding of reset voor onderzochte L1-constructiepaden | PASS gericht getest |
| Bruikbare bronnen en numerieke invoer bij herstelbare fout | PASS gericht getest |
| Geen extra mutatie/history na geweigerd commando | PASS foutinjectie en echte runtimeweigering |
| Succesbeleid vrije/gekoppelde/contextactie behouden | PASS representatieve controllerpaden |
| Snijpuntselectie en afsluitgedrag | PASS, twee resultaten |
| Preview/capture na definitieve annulering | PASS gericht getest; geen browserclaim |
| Geen parallelle mutatie-/autorisatie-/history-engine | PASS bronreview; bestaande grenzen behouden |
| Geen wijzigingen buiten L1 | PASS; teksteditor, centrale cleanup/policy en Esc-instructies blijven vervolgwerk |

**Advies voor L2: CONDITIONAL GO.** De technische resultaatgrens is beschikbaar. Voor daadwerkelijke L2-uitvoering blijven afzonderlijke opdracht en beoordeling/acceptatie van deze branch nodig. Niet automatisch mergen of L2 starten.

Resterende risico's: echte browser-eventvolgorde en focus/capture zijn niet opnieuw gevalideerd; alleen geselecteerde Node-tests zijn gedraaid. Bronverwijdering/permissierevocation tijdens een geopende plaatsing volgt de bestaande cancel/runtimepaden en is niet voor elk adaptertype opnieuw getest. Tekstcommitfouten ná validatie en algemene instructiesynchronisatie zijn bewust niet in deze L1-opdracht uitgebreid; die horen bij latere fasen. Optionele bronhernoemingen blijven afzonderlijke geautoriseerde commando's.

Status: geïmplementeerd op branch en gericht automatisch getest; nog niet handmatig geaccepteerd en niet gemerged naar main. De codecommit-SHA en pushbevestiging worden bij oplevering vermeld; dit voorkomt een zelfverwijzende SHA in dit commitbestand.
