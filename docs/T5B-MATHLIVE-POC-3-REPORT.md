# WIE MathLive + CortexJS POC-3 — autorisatie, revisies en publicatie

## 1. Samenvatting

POC-3a, 3b en 3c verkennen een geïsoleerde route van MathLive-LaTeX naar een structureel gevalideerde MathJSON-expressie, getypeerde geometrische waarden, dimensiecontrole en voorwaardelijke resultaatpublicatie. In deze POC wordt CortexJS alleen met een momentopname van de mockbronwaarden aangeroepen. De UI gebruikt één publicatieguard; er is geen productie-integratie.

POC-3c voegt immutable evaluatiecontext, snapshotcontrole vóór en na berekening, invalidatie bij mutaties en bescherming tegen verouderde of ingehaalde requests toe. Alle 41 gerichte POC-2/3a/3b/3c-tests zijn geslaagd. Dit bewijst de geïsoleerde adapter- en mockcontracten, niet dat de MathLive/CortexJS-route al onder WIE's echte autorisatiegrens draait.

## 2. Adapterarchitectuur

De actieve POC-route is:

1. MathLive levert de formule als LaTeX.
2. De structurele adapter parseert de LaTeX naar MathJSON, valideert de volledige toegestane expressiestructuur en dimensies en controleert expliciete interne brontokens.
3. `MockGeometrySources` valideert binding, objectgeneratie, eigenschap, bronstatus en eenheid. De bronprovider maakt een immutable snapshot van getypeerde waarden en revisies.
4. CortexJS evalueert de gevalideerde MathJSON met uitsluitend die snapshotresolver; de adapter verzorgt dimensies, canonieke eenheden en resultaatpresentatie.
5. De publicatieguard controleert de snapshot opnieuw. Alleen de nieuwste nog geldige request publiceert een resultaat.

De zichtbare formule en binding-identiteit blijven gescheiden. Gewone letters zoals `r` zijn geen bron. Een bronbinding vereist expliciete selectie en de interne tokens `wieSourceA`/`wieSourceB`. Een verwijderde en opnieuw aangemaakte mockbron krijgt een nieuwe instantie-generatie; oude bindings voldoen dan niet.

## 3. Evaluatiecontext en guard

De guard maakt per request een bevroren context met formulegeneratie en -snapshot, bindings met broninstantiegeneraties, bron- en documentrevisie, permission epoch, requestgeneratie en geselecteerde instellingen. De provider, niet de UI, verzamelt en controleert de mockbronstatus.

De guard controleert bronrechten bij het maken van de snapshot, verifieert de snapshot direct vóór evaluatie en controleert na de berekening requestgeneratie en snapshot opnieuw. De provider meldt bronmutaties; daardoor wordt de zichtbare uitkomst direct gewist en wordt een lopende request ongeldig. Een hogere requestgeneratie voorkomt dat een oude berekening een nieuwere overschrijft. Fouten worden vertaald naar beperkte Nederlandstalige statussen. De UI-publicatiecallback toont geen bron-ID of bronwaarde.

De mock gebruikt één `createPublicationGuard`; de eerdere losse `createRevisionGuard` is verwijderd. De daadwerkelijke geometrische UI-route gebruikt deze guard en de snapshotresolver, zonder directe evaluatie via de live mockprovider.

## 4. POC-3a en POC-3b

**POC-3a:** MathLive-LaTeX wordt met CortexJS naar MathJSON geparseerd. Een volledige structurele validatie staat alleen expliciete, begrensde operatoren en bindings toe. Bronnen worden via een getypeerde bindingstabel en instantie-generatie gekoppeld; regexsubstitutie is geen onderdeel van het actieve evaluatiepad.

**POC-3b:** mockbronnen leveren getypeerde lengte- en hoekwaarden. Lengtes worden naar meters genormaliseerd; de proef presenteert onder andere mm/cm/m. Optellen en aftrekken vereisen compatibele dimensies; vermenigvuldigen, delen, begrensde machten en geldige wortels analyseren dimensies vóór evaluatie. Hoeken worden als hoekdimensie behandeld en DEG/RAD wordt expliciet verwerkt. Eenheden worden niet als vrije CortexJS-symbolen ingevoerd.

Numerieke geometriewaarden zijn meetwaarden en worden niet als exact geclaimd. Symbolische expressies waarvan dimensie niet kan worden bewezen, worden niet als dimensioneel geldig gerapporteerd. Presentatie toont dimensie, gekozen eenheid, algebraïsche/exacte vorm waar beschikbaar en een Nederlandse numerieke benadering met maximaal acht decimalen.

## 5. Verificatiematrix POC-3c

| Test | Gecontroleerd gedrag | Resultaat |
|---|---|---|
| C3-01 | Immutable context bevat formule-identiteit/generatie, bindings, revisies, epoch, requestgeneratie en instellingen | Geslaagd |
| C3-02 | Rechten worden vóór berekening gecontroleerd; geweigerde brongegevens lekken niet | Geslaagd |
| C3-03 | Evaluatie gebruikt uitsluitend de geautoriseerde getypeerde snapshot | Geslaagd |
| C3-04 | Bronwijziging tijdens vertraagde berekening wist en verwerpt uitkomst | Geslaagd |
| C3-05 | Bronverwijdering tijdens evaluatie verhindert publicatie | Geslaagd |
| C3-06 | Intrekking tijdens evaluatie maakt uitkomst ongeldig | Geslaagd |
| C3-07 | Permission epoch wordt vastgelegd en opnieuw gecontroleerd | Geslaagd |
| C3-08 | Nieuwe formulegeneratie maakt oudere lopende formule ongeldig | Geslaagd |
| C3-09 | Oudere request kan een nieuwere uitkomst niet overschrijven | Geslaagd |
| C3-10 | Verwijderen en opnieuw aanmaken met dezelfde ID voldoet niet aan oude binding | Geslaagd |
| C3-11 | Mislukte vervangende berekening laat geen oude actuele uitkomst staan | Geslaagd |
| C3-12 | Eindcontrole verwerpt mutatie na evaluatie maar vóór publicatie | Geslaagd |
| C3-13 | Succes wordt pas gepubliceerd na bron-, document- en rechtencontrole | Geslaagd |
| C3-14 | Fouten worden veilige lokale statussen zonder brongegevens | Geslaagd |
| C3-15 | Actieve UI-route gebruikt de publicatieguard en snapshot-evaluator | Geslaagd |

## 6. Tests en browsercontrole

Uitgevoerd vanaf de POC-directory:

```text
node --test --test-reporter=spec test/poc3c.test.cjs test/poc3b.test.cjs test/poc3a.test.cjs test/poc2.test.cjs
41 tests: 41 geslaagd, 0 mislukt, 0 overgeslagen
```

De set omvat 4 tests voor POC-2, 14 voor POC-3a (inclusief structurele regressies), 8 voor POC-3b en 15 voor POC-3c. Er zijn daarnaast `node --check`-controles uitgevoerd voor `app.js`, `geometry-poc.mjs`, `structural-binding.mjs` en `poc3c.test.cjs`; `git diff --check` is schoon.

Een browser-smoketest is niet uitgevoerd: Edge is niet op PATH beschikbaar en het Playwright-pakket ontbreekt in deze omgeving. Er wordt dus geen browsersucces geclaimd.

## 7. WIE-garanties versus mockgedrag

De echte WIE-implementatie heeft een beperkte `ExpressionSources`-interface met `evaluate(ast)`. De restricted facade controleert `RuntimeSession`, documentrevisie en permission epoch, en leest bronnen via `RuntimeSession.getExpressionSource()`. Dat pad hergebruikt WIE's bestaande bronrechten en geeft geen kernelobject of ongeautoriseerde bronwaarde terug. De author-facade accepteert alleen een echte `MI.Engine` en controleert dat evaluatie de engine niet wijzigt. De relevante implementaties staan in `expression-sources.js` en `permission-runtime.js`; author/restricted, revocation, lifecycle en bronvalidatie worden door de bestaande expression-sources-tests gecontroleerd.

De MathLive/CortexJS-POC roept deze productie-facades niet aan. De POC gebruikt eigen `MockGeometrySources`, eigen revisies en een lokaal gesimuleerde `permissionEpoch`. De 41 geslaagde tests tonen daarom aan dat de POC-guard races en mocktoestanden correct afhandelt. Zij bewijzen niet dat WIE-rechten, verborgen bronnen, policyvervanging, disposed sessions of echte documentmutaties door deze nieuwe route worden beveiligd. De expliciete status “POC-mockbron gecontroleerd” voorkomt dat de interface die garantie suggereert.

De veilige kleinste vervolgstap is geen directe `resolveSource()`-bridge naar CortexJS. De bestaande WIE-facade accepteert de gevalideerde T5a-`ExpressionAST` en bezit zelf de autorisatie- en revisiecontrole. Een productiepad moet daarom óf MathLive-invoer veilig vertalen naar die bestaande AST en via `ExpressionSources.evaluate(ast)` evalueren, óf een afzonderlijk geautoriseerd hostcontract ontwerpen en reviewen. De productie-API is in deze proef niet uitgebreid.

## 8. Vergelijking met T5a

T5a is de bestaande WIE-engine voor strikte ExpressionAST-validatie, numerieke/dimensionele rekenregels, bronproperties, eenheden en restricted/author-semantiek. De WIE-bronfacade controleert rechten en revisies binnen de gecontroleerde evaluatorroute. T5a blijft ongewijzigd en vormt de autorisatie-/semantiekreferentie.

CortexJS biedt MathLive/MathJSON-integratie en symbolische vormen die voor interactieve formule-invoer aantrekkelijk zijn. De POC-adapter vult daar structurele bronbinding, eenheden, dimensies, revisies en presentatie omheen in, maar staat nog buiten het echte WIE-autorisatiecontract. Het advies is niet om T5a op basis van deze proef te vervangen. Een eventuele toekomstige vergelijking moet dezelfde geldige bronrechten, AST-semantiek, eenheden en foutcategorieën gebruiken.

## 9. Openstaande beperkingen en besluit

- De mock publicatieguard is geen WIE-beveiligingsgrens; koppeling aan de bestaande beperkte facade ontbreekt.
- Er is geen gevalideerde MathJSON-naar-ExpressionAST-vertaling en geen productie-interface die ruwe MathJSON onder WIE-rechten evalueert.
- Echte `RuntimeSession`-mutaties en permission-epochveranderingen zijn niet gekoppeld aan de POC-UI-guard.
- Geen browsercontrole mogelijk in deze omgeving.
- Formuleopslag, document-/tekstschemas, exports en resultaatpersistentie vielen buiten de scope en zijn niet aangepast.

**Advies: CONDITIONAL GO uitsluitend voor het formele architectuurbesluit en een afgebakend vervolgonderzoek. NO GO voor productie-integratie op basis van deze POC-resultaten alleen.** Voor productievoorbereiding zijn eerst een door WIE geautoriseerde AST-adapterroute, aantoonbare restricted/author-equivalentie, echte revisie-/permission-tests en een aparte security- en architectuurreview nodig.

## 10. Bestanden binnen deze oplevering

- `experiments/t5b-mathlive-poc/app.js` — actieve geometrische UI-route via guard en snapshotresolver.
- `experiments/t5b-mathlive-poc/geometry-poc.mjs` — mockrevisies, instantie-generaties, immutable snapshots en publicatieguard.
- `experiments/t5b-mathlive-poc/structural-binding.mjs` — MathJSON-bindingreferenties voor de guard-context.
- `experiments/t5b-mathlive-poc/test/poc3a.test.cjs` — integratieassertie bijgewerkt voor de guarded route.
- `experiments/t5b-mathlive-poc/test/poc3c.test.cjs` — deterministische publicatie- en concurrencytests C3-01 t/m C3-15.

