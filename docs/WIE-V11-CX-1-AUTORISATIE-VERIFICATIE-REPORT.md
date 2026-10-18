# WIE V11-CX-1 — autorisatie- en bronveiligheidsverificatie

**Status:** geïsoleerde technische verificatie, geen productie-integratie

**Branch:** `codex/v11-cx1-cortexjs-authorisatie`

**Gecontroleerde basis:** actuele remote `develop`, commit `506cdd213a79a9ad12451c94df08dce5a0c74249`

**Architectuurreferentie:** `chore/v11-cortexjs-first-architecture`, opgegeven commit `32eb556a97a702377726b9899876e5868e678dc3`
**POC-referentie:** `test/t5b-mathlive-poc`, commit `644da423a8d8a692fff32dbe26c20779d3d3194f`

## 1. Uitkomst

De geïsoleerde hostproef laat zien dat CortexJS berekeningen met geometrische waarden kan uitvoeren achter de bestaande T5a-bronautorisatie. Een restricted `RuntimeSession` en een echte `MI.Engine` zijn gebruikt. Alle 20 CX-1-tests en 12 direct betrokken bestaande autorisatietests slagen.

**Advies: CONDITIONAL GO voor het ontwerp van een productieve CortexJS-hostadapter.** Dit is geen productieacceptatie. Voor productie zijn een formele, atomaire snapshot- en broninstantiegarantie en een expliciete resultaatpublicatiegrens nodig. De proef gebruikt voor author-modus een inhoudsrevisiestempel en een interne objectreferentie; die zijn geen gegarandeerde publieke WIE-contracten.

De POC-CortexJS-versie is geïsoleerd en vastgezet op `@cortex-js/compute-engine` **0.156.0**. De proef bouwt geen calculatorinterface, wijzigt T5a niet en bewaart geen berekeningen in WIE-documenten.

## 2. Afgesloten CortexJS-façade

De nieuwe `experiments/v11-cx1/cortex-host.cjs` houdt bindingstokens en WIE-referenties in een private closure. Een token ontstaat alleen na `selectSource(sourceId, property)`. Een gewone `r` blijft een ongebonden variabele en wordt geweigerd. Een onbekend of nagebootst `wieSource_…`-token wordt eveneens geweigerd.

Vóór CortexJS wordt de gehele MathJSON-boom gecontroleerd op toegestane operatoren, ariteit, dimensies, maximaal 128 knopen, diepte 24, acht bronverwijzingen en exponenten tot acht. De allowlist is `Add`, `Subtract`, `Multiply`, `Divide`, `Power` en `Sqrt`. Onbekende operatoren, vrije symbolen, ongeldige machten, dimensieconflicten en domein-/niet-numerieke uitkomsten falen gesloten.

CortexJS krijgt alleen de gevalideerde MathJSON-expressie waarin geldige bronbindingen structureel zijn vervangen door getallen uit een eerder geautoriseerde, bevroren T5a-quantity-snapshot. CortexJS krijgt geen `RuntimeSession`, engine/kernel, document, bron-ID, broncallback of resolver. Er wordt geen LaTeX-tekst vervangen of uitgevoerd.

## 3. Gebruikte WIE-autorisatiegrenzen

- Author-modus gebruikt uitsluitend `MI.ExpressionSources.createAuthor(engine).evaluate(ast)` met een echte `MI.Engine`.
- Restricted-modus gebruikt uitsluitend `MI.ExpressionSources.createRestricted(session).evaluate(ast)` met een echte `MI.RuntimeSession`-fixture.
- Voor een bronselectie bouwt de proef een enkelvoudige, schema-gevalideerde T5a-bron-AST en vraagt die via de bestaande façade op. Zij behandelt `ExpressionSources` dus niet alsof deze een publieke `resolveSource()`-methode heeft.
- Restricted-bronwaarden vallen daarmee onder de bestaande read-, display-, property-, verborgen-laag-, documentrevision- en permission-epoch-controles.
- Een restrictie- of sessie-event wist de publicatie en maakt lopende aanvragen verouderd. Na evaluatie en opnieuw vóór kopiëren controleert de host revisie, epoch, sessiegeldigheid en actuele bronautorisatie opnieuw.

Author-modus is volgens bestaande WIE-semantiek bevoegd verborgen objecten te lezen; zichtbaarheid weigert daarom alleen in restricted-modus. Dit gedrag is ook door de bestaande autorisatietest bevestigd.

## 4. Snapshot, bronidentiteit en levenscyclus

De host bindt token, bron-ID, eigenschap, getypeerde quantity en instantie-/contextstempel intern samen. Bij elke evaluatie en kopieercontrole vergelijkt de host de actuele autorisatie, hoeveelheid en dimensie opnieuw.

Restricted-modus bindt aan `documentRevision` en `permissionEpoch` van de echte sessie. Elke modelwijziging, verwijdering, Undo of document-/beleidsverandering maakt een oude binding verouderd. Na delete plus Undo is een nieuwe expliciete selectie nodig. Dit voorkomt automatisch hergebruik van een bron-ID binnen de levensduur van deze sessie.

Author-modus gebruikt in deze proof-of-concept een JSON-stempel van het huidige document en de interne objectreferentie uit de engine. Het is een testconstructie, geen aanbevolen productie-API. Een gestructureerde, monotone broninstantie-generatie plus author-documentrevisie ontbreekt als expliciet contract. Zonder die garantie kan een ABA-geval (verwijderen en identiek herstellen tussen controles) niet formeel uitgesloten worden.

De beperkte publicatieguard registreert formulegeneratie en oplopende requestgeneratie, en verwerpt resultaatpublicatie wanneer een nieuwere aanvraag, formulewijziging, bronwijziging, revisiewijziging, epochwijziging of sessiebeëindiging ertussen kwam. `canCopy(result)` herhaalt de checks. Dit is alleen de geïsoleerde guard; er is geen echte UI- of klembordintegratie.

## 5. Testresultaten per veiligheidsscenario

| Scenario | Resultaat | Bewijs |
|---|---|---|
| Author-bronselectie | Geslaagd | Echte `MI.Engine` + `createAuthor`-façade |
| Restricted-bronselectie | Geslaagd | Echte `RuntimeSession` + `createRestricted`-façade |
| Verborgen/niet-toegestane bron | Geslaagd | Restricted-bronselectie geweigerd; generieke fout zonder bronlabel |
| Ongeldige broneigenschap | Geslaagd | Bronselectie geweigerd via T5a-validatie |
| Verwijderde bron | Geslaagd | Oude binding/evaluatie geweigerd |
| Verwijderen en Undo | Geslaagd | Oude binding geweigerd; nieuwe expliciete selectie werkt |
| Bron-ID door andere instantie hergebruikt | Geslaagd | Engine-document vervangen; oude binding geweigerd |
| Document vervangen | Geslaagd | Oude binding geweigerd op documentstempel |
| Permission epoch verandert | Geslaagd | `owner.replacePolicy()` verhoogt epoch en invalideert aanvraag |
| Policy ingetrokken | Geslaagd | Herselectie/evaluatie geweigerd door bestaande T5a-bronfaçade |
| RuntimeSession beëindigd | Geslaagd | Sessie wordt door RuntimeSession en host geweigerd |
| Bron verandert tijdens vertraagde berekening | Geslaagd | Vertraagde uitkomst verworpen na update/revisieverandering |
| Oudere aanvraag eindigt na nieuwere | Geslaagd | Oud resultaat verworpen; nieuwere aanvraag blijft publiceerbaar |
| Eerder resultaat ongeldig vóór kopiëren | Geslaagd | `canCopy()` geeft na bronwijziging `false` |
| Onbekend/nagebootst token en gewone `r` | Geslaagd | Fail closed; `r` wordt niet als bron geïnterpreteerd |
| Volledige structuur en complexiteitslimieten | Geslaagd | Operator-, diepte-, knoop-, bron- en exponentlimieten |

Daarnaast zijn SI-conversie, lengte², `r+r`, `r/r`, dimensieconflict en berekeningsdomeinfouten getest. Alle 20 CX-1-tests slagen. De 12 bestaande `expression-sources`-tests slagen eveneens.

### Exacte commando’s

```text
npm test --prefix experiments/v11-cx1
node --test tests/expression-sources.test.cjs
```

Resultaten: CX-1 **20/20 geslaagd**; bestaande bron-/autorisatie-fixtures **12/12 geslaagd**. Er is geen volledige Node- of Edge-suite gestart.

## 6. Eenheden en dimensies

De adapter hergebruikt T5a voor de echte bronsnapshot en SI-conversie. De host draagt de T5a-dimensievector mee en controleert optellen/aftrekken op compatibiliteit, telt dimensies bij vermenigvuldigen/delen op, begrenst gehele machten en vereist even dimensie-exponenten voor een vierkantswortel.

Bewezen door tests:

- Een bronradius van 2 bij schaal 2 wordt via T5a `0,04 m` bij centimeterinstelling.
- Dezelfde ruwe radius geeft `0,004 m` bij millimeterinstelling en `4 m` bij meterinstelling.
- `r²` heeft dimensie lengte² en bevat de kwadratische schaalconversie.
- De T5a-oppervlaktebron wordt als `m²` gelezen.
- `r+r` is geldig, `r/r` dimensieloos en `r+r²` onverenigbaar.

De proef is beperkt tot de T5a-quantity-dimensies. Er is geen volledige algebra voor samengestelde, abstracte of affine eenheden, conversie van presentatie-eenheden of een omvangrijke hoekbronmatrix geïmplementeerd. T5a blijft de referentie voor de bestaande meeteenheden en conversieregels; de experimentadapter herhaalt alleen de minimale dimensiecontrole die nodig is om de beperkte CortexJS-allowlist af te schermen.

## 7. Hergebruik van POC-3

| POC-3-onderdeel | Beoordeling voor CX-1 |
|---|---|
| Structurele operatorallowlist, volledige tree-walk en quota | Architectuur/patroon bruikbaar; opnieuw en beperkter geïmplementeerd voor de T5a-bound host |
| Tokenbinding en dimensie-analyse | Patroon bruikbaar; mock-bronopslag niet hergebruikt |
| MockGeometrySources / generaties | Alleen mockbewijs; geen productie- of echte WIE-autorisatie |
| POC-3c-publicatieguard | Algoritmisch patroon bruikbaar; CX-1-guard opnieuw gekoppeld aan echte session-epoch/revisie |
| De gerapporteerde 41 mocktests | Geen bewijs voor WIE-rechten; niet als acceptatiebewijs geteld |

## 8. Gegevenslekken en beveiligingsgrenzen

Geweigerde bronselecties geven een generieke statuscode en bevatten geen bronlabel of geometriewaarde. Bindingen, objectidentiteit en bronwaarden blijven in de hostclosure. Gepubliceerde waarden bevatten alleen numeriek/symbolisch resultaat en dimensie. De tests bevestigen dat het resultaatobject geen sessie of bron-ID bevat.

De beveiligingsgrens geldt zolang de hostmodule en het CortexJS-object in dezelfde vertrouwde JavaScript-realm draaien. Dit bewijst geen sandbox tegen kwaadaardige code in die realm, geen browserworker-isolatie en geen UI-, log-, telemetry-, clipboard- of timinglek. Een productiecaller moet kopieer- en presentatieroutes uitsluitend achter de publicatieguard plaatsen en errors niet verrijken met verborgen broninformatie.

De proef ontvangt al MathJSON. De veiligheid van MathLive-LaTeX-parsing en de omzetting van MathLive naar de toegestane WIE/Cortex MathJSON-structuur viel buiten CX-1; de adapter mag dus niet worden gezien als bewijs dat ruwe LaTeX veilig is.

## 9. POC-only wijzigingen en minimale productie-API

Alle implementatie en tests staan geïsoleerd onder `experiments/v11-cx1/`; het rapport staat onder `docs/`. Er zijn geen wijzigingen aangebracht aan `ExpressionSources`, `RuntimeSession`, T5a, calculator-UI, document- of tekstschema's.

Een productieadapter heeft ten minste een vertrouwde hostservice nodig die in één contract levert:

1. Expliciete, getypeerde bronselectie en ondoorzichtige bindingsidentiteit.
2. Een immutable bronwaardesnapshot met objectinstantie-generatie, documentrevisie, permission epoch en dimensie.
3. Een autorisatiebeslissing via bestaande WIE-policyregels; geen algemene publieke bronresolver.
4. Een atomaire `isCurrent(snapshot)`/revalidatiegrens vóór resultaatpresentatie en kopiëren, inclusief session lifetime.
5. Een monotone formule- en requestgeneratie om asynchrone resultaten te verwerpen.

De bestaande `ExpressionSources.evaluate(ast)` kan bronselectie nu veilig uitvoeren via een bron-AST, maar biedt geen multi-source immutable snapshot-object, geen expliciete broninstantiegeneratie en geen centrale publicatieguard. CX-1 voegt deze contracten uitsluitend in de experimentele host toe; het doet geen voorstel om `ExpressionSources` of `RuntimeSession` ongemerkt te wijzigen.

## 10. Bewijsbeperkingen en open risico's

- Author- en restricted-toegang zijn echte WIE-fixtures, maar `owner.inspect()` en tests zijn geen productie-UI-flow.
- Restricted-mutatietests gebruiken echte `RuntimeSession`-commando's. Author-replace gebruikt `MI.Engine.load()` in testcode.
- De tests tonen gecontroleerde ID-hergebruik- en revisiegevallen; ze bewijzen geen universele concurrency-eigenschappen van de applicatie.
- De experimentele host moet nog een afzonderlijke adversarial review krijgen voor limieten, CE-versie-updates en publicatieconsumenten.
- Maxima zijn proof-of-conceptkeuzes, niet gevalideerde UX- of performancebudgetten.
- CortexJS exactheid wordt als `exact`-veld behouden waar beschikbaar; geometrische waarden blijven meetwaarden en krijgen geen meetkundige exactheidsclaim.
- Offline distributie, CSP, licentiegoedkeuring, MathLive-integratie, worker-timeouts en blijvende operationele monitoring vallen buiten deze headless proef.

## 11. Minimale vervolgstappen voor productiehostontwerp

1. Contracteer atomair snapshot-object en monotone broninstantie-ID in de vertrouwde WIE-host.
2. Definieer author/restricted lifecycle-events en policy-epoch-garanties zonder de T5a-bronregels te dupliceren.
3. Bevries formeel MathJSON-allowlist, quota's, dimension-regels en foutcategorieën.
4. Ontwerp één resultaatpublicatie-interface waar UI én klembord dezelfde actuele-contextguard aanroepen.
5. Laat adversarial review en gerichte echte-WIE-tests uitvoeren voordat een UI-POC of productie-integratie wordt overwogen.

**CX-1 stopt hier.** Dit rapport autoriseert geen verdere productontwikkeling, schemawijzigingen, T5a-vervanging, PR of merge.
