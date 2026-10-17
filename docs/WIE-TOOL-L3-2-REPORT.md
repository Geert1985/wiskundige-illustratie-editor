# WIE-TOOL-L3.2 — Centrale lifecycle voor generieke gekoppelde constructies

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l3-2-generic-constructions`.
Basis: `origin/main` commit `556ba7bcc2ff78eb5c934b024d93e3d758df1d61`, met L1, L2 en L3.1. L3.1 staat op deze basis via merge PR #35.

## Resultaat

De gewone canvasconstructieroute in `EditorApp.constructionClick()` laat een geslaagde `construction.create` nu afronden via de bestaande `completeToolInteraction()`. De oude succesafhandeling in deze gedeelde route — interactie wissen, preview/feedback opruimen, pointer loslaten, rechtstreeks naar Selecteren gaan en een successtatus zetten — is vervangen door de centrale completion. Het bestaande `single`-beleid blijft leidend: na succes gaat de actieve constructietool terug naar Selecteren.

Middenpunt gebruikte deze centrale route al sinds L2 en blijft dezelfde route volgen. Bij een geweigerd commando wordt geen completion aangeroepen. `changeDocument()` rapporteert het commandofalen; de canvasroute laat de tool actief, herstelt de bronlijst naar de laatst bruikbare invoer, geeft pointercapture vrij en laat retry of annulering toe. Ongeldige/ontbrekende broninvoer wordt vóór de commandgrens afgehandeld en voltooit de interactie niet. De bestaande validatie- en foutmeldingen van de constructieservice en commandogrens blijven intact.

De route geeft alle ID's uit de resultaatlijst door als selectie. Een test voor Raaklijn toonde dat één gewone constructie twee afhankelijke raaklijnen kan maken. Daarbij kwam een bestaande fout in `completeToolInteraction()` aan het licht: de setter voor `selectedId` reduceerde een vooraf ingestelde meervoudige selectie tot één ID. De centrale completion stelt nu eerst het primaire ID in en herstelt daarna de volledige selectie. Beide raaklijnen blijven geselecteerd, en creatie/undo/redo blijven één history-entry.

## Onderzochte routes en migratie

`constructionClick()` routeert Snijpunt, Punt op object/plaatsing, Ellips-Q-plaatsing en Parallellogram-plaatsing vóór de gewone generieke afhandeling. `construction.create` wordt voor de hieronder vermelde constructies bereikt nadat de bestaande bronselectie, optionele parameterinvoer en geometrische controle afgerond zijn. Er is geen nieuwe constructie- of historyroute toegevoegd.

| Constructie | Afhandeling in `constructionClick()` | L3.2-status |
|---|---|---|
| Middenpunt | Gewone generieke completion | Bestaande L2-route behouden; regressietest |
| Loodlijn | Generieke bronselectie en `construction.create` | Gemigreerd |
| Middelloodlijn | Generieke bronselectie; expliciete punt-/lijnstukbronafhandeling blijft | Gemigreerd |
| Bissectrice | Generieke route, met bestaande hoek-/vertexbronkeuze | Gemigreerd |
| Rechte door twee punten | Generieke route; bestaande controle op gelijke punten blijft | Gemigreerd |
| Evenwijdige | Generieke bronselectie en `construction.create` | Gemigreerd |
| Raaklijn | Generieke route; engine kan twee takken/objecten teruggeven | Gemigreerd; selectie van beide resultaten getest |
| Cirkel met middelpunt en punt | Generieke bronselectie en `construction.create` | Gemigreerd |
| Driehoek uit punten | Generieke route; bestaande drie verschillende puntbronnen blijven vereist | Gemigreerd |
| Zwaartepunt | Eén driehoekbron via generieke route | Gemigreerd |
| Omgeschreven middelpunt | Eén driehoekbron via generieke route | Gemigreerd |
| Hoogtepunt | Eén driehoekbron via generieke route | Gemigreerd |
| Ingeschreven middelpunt | Eén driehoekbron via generieke route | Gemigreerd |
| Ingeschreven cirkel | Eén driehoekbron via generieke route | Gemigreerd |
| Eulerrechte | Eén driehoekbron via generieke route | Gemigreerd |
| Negenpuntscirkel | Eén driehoekbron via generieke route | Gemigreerd |
| Hoek uit punten | Generieke meerstapsbronselectie | Gemigreerd |
| Hoek uit richtingen | Generieke route plus `anglePicks`/armselectie vóór commit | Gemigreerd; parameterpad getest |
| Veelhoekgebied | Eén veelhoekbron via generieke route | Gemigreerd |
| Cirkelsector | Cirkel en twee punten; bestaande `extent`-keuze blijft | Gemigreerd; invoerroute getest |
| Cirkelsegment | Cirkel en twee punten; bestaande `extent`-keuze blijft | Gemigreerd; invoerroute getest |

De productieaanpassing is bewust gedeeld: twintig constructies (inclusief Middenpunt) bereiken dezelfde completioncode. De testset voert representatieve concrete routes uit voor Loodlijn, Middelloodlijn, Bissectrice, Cirkel met middelpunt en punt, Driehoek uit punten, Zwaartepunt, Raaklijn, Hoek uit richtingen, Veelhoekgebied, Cirkelsector en Cirkelsegment. Omgeschreven middelpunt, Hoogtepunt, Ingeschreven middelpunt, Ingeschreven cirkel, Eulerrechte, Negenpuntscirkel, Hoek uit punten, Rechte door twee punten en Evenwijdige zijn via code-inspectie vastgesteld als gebruikers van dezelfde gedeelde succes-/fouttak; zij zijn niet ieder apart in deze fase getest.

## Uitzonderingen en scopegrenzen

Deze routes bleven ongewijzigd:

- **Universeel Snijpunt:** eigen `intersectionClick()`/`acceptIntersectionSource()`-route, met eigen afhandeling voor meerdere snijpunten en `intersectionCompleted`.
- **Punt op object:** aparte padplaatsing en tolerantie-/projectievalidatie.
- **Ellips:** aparte Q-preview-/plaatsingsroute en mogelijk samengestelde creatie van besturingspunt plus ellips.
- **Parallellogram:** numerieke velden, parameterpreview, bevestiging en optionele bronhernoeming.
- **Directe contextconstructies:** `startContextConstruction()`/context-complete voeren soms meteen uit en behouden de vorige toolmodus.
- **Vrije tools en tekst:** L3.1 heeft vrije tekengereedschappen behandeld; tekst houdt de eigen editor-/commitroute.
- **Esc/dialoogprioriteit:** niet gewijzigd.

`distributedPointOnCircle` is geen gewone generieke canvasroute: de constructieservice markeert de verdelingsworkflow als extern; de zichtbare toolcatalogus biedt die niet aan als gewone constructie. Geen van deze uitzonderingen is stilzwijgend via de nieuwe succesroute geleid.

## Architectuur en consistentie

`TOOL_LIFECYCLE` blijft het beleidregister; de betrokken constructies zijn `single`. `changeDocument()` blijft de grens die `construction.create` uitvoert, een expliciet succes-/foutresultaat teruggeeft en één history-entry registreert. `completeToolInteraction()` blijft eigenaar van de succesgedreven cleanup, selectieoverdracht en overgang naar Selecteren. `ConstructionService` blijft eigenaar van rolvalidatie en geometrische geldigheid. De canvasadapter beheert bronvolgorde en constructiespecifieke invoerstappen.

Voor de gemigreerde gewone route is de succesafsluiting nu uniform. De implementatie is daarmee consistenter en verwijdert de eerdere Middenpunt-versus-overige-constructiesplitsing. Gespecialiseerde routes hebben nog eigen afsluitcode en blijven bewust fasegrenzen; ze vormen geen tweede algemene lifecyclecontroller. De bestaande L2/L3.1-routes voor respectievelijk Middenpunt en vrije tools blijven compatibel.

Er is geen algemene atomiciteitsgarantie voor meerdere onafhankelijke commands toegevoegd. De onderzochte generieke route voert één `construction.create` uit. Voor de multi-resultaat-Raaklijn is die ene bestaande commandtransactie atomair; eventuele aparte optionele commands elders, zoals parallellogram-bronhernoeming, blijven buiten dit pad.

## Gerichte verificatie

Uitgevoerd:

```powershell
node --test --test-reporter=spec --test-name-pattern='WIE-TOOL-L3\.2|WIE-TOOL-L2 canvas midpoint|WIE-TOOL-L2 Snijpunt' tests/lifecycle.test.cjs
node --check editor.js
node --check tests/lifecycle.test.cjs
git diff --check
```

De lifecycleselectie slaagt met **5/5 geselecteerde tests**: drie nieuwe L3.2-proeven, Middenpunt als L2-regressie en Snijpunt/context als niet-gemigreerde regressie. De nieuwe proeven controleren representatieve generieke bronroutes, de extra arm-/extentinvoer, de twee raaklijnresultaten en hun volledige selectie, één undo-/redo-history-entry, cleanup van preview/pointercapture, commandweigering met bronbehoud/retry, en onvolledige/ongeldige invoer zonder completion. Alle drie de syntax-/diffcontroles slagen.

Geen volledige Node-suite, Edge-run, browserregressiesuite of prestatietest uitgevoerd. Testbewijs komt uit de bestaande gesimuleerde DOM-lifecyclefixture; echte browser-event-/focusvolgorde is niet opnieuw getest.

## Beoordeling en resterende risico's

**Technische beoordeling: GO voor de L3.2-scope.** De gewone generieke succesroute gebruikt nu de centrale `single`-completion, fouten voltooien niet, bronnen blijven herstelbaar en meervoudige resultaten blijven geselecteerd. De aangepaste centrale selectievolgorde is gericht getest met Raaklijn.

De belangrijkste resterende beperking is testbreedte: niet iedere constructiesoort is individueel uitgevoerd; voor de opgesomde niet-geteste constructies is migratie vastgesteld doordat zij de gedeelde codebranch gebruiken. Gespecialiseerde uitzonderingsroutes zijn alleen gecontroleerd op behoud van hun bestaande route met beperkte lifecycle-regressies. Echte browserinvoer is niet gevalideerd. L3.3 en verdere lifecycle-unificatie vallen buiten deze opdracht.

Status: geïmplementeerd en gericht automatisch getest op featurebranch. Handmatige acceptatie, PR-beoordeling en merge zijn afzonderlijke stappen. Commit-SHA en pushstatus worden na commit/push vermeld.
