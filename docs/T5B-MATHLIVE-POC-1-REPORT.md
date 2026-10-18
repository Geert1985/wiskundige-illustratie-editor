# WIE MathLive + CortexJS POC-1

**Branch:** `test/t5b-mathlive-poc`
**Begintoestand:** HEAD `17c0350e68cf3f024f1d7d07cc0d06fbde01e5c2` op `test/t5b-mathlive-poc`; deze bevat formatteringscommit `b5c46a87c633c7c334a39940520403460e4037bc` en latere toetsenbordwijzigingen. Werkboom was schoon vóór deze opdracht.
**Status:** geïsoleerde haalbaarheidsproef; geen WIE-productiecode of documentformaat gewijzigd.

## Architectuur

- MathLive is de visuele invoer voor de bestaande calculator en de aparte formule-in-tekstsimulatie.
- CortexJS Compute Engine parseert MathLive-LaTeX naar MathJSON, evalueert exact waar mogelijk en levert afzonderlijk een numerieke benadering. De UI toont afzonderlijk of MathLive invoer bevat, CortexJS die kan parsen en evaluatie een exact, benaderd, symbolisch of ongeldig resultaat oplevert.
- T5a blijft een aparte, bestaande referentieroute voor numerieke expressies. De bestaande compacte formatter blijft op die route actief; T5a is niet aangepast.
- Een formule in de gesimuleerde tekst is een tijdelijk `span` met `data-formula-type="mathlive-latex"`, `data-formula-schema="1"` en de heropenbare LaTeX in `data-latex`. De formule wordt als read-only MathLive-element getoond. Klikken opent een inline bewerkpaneel met een bewerkbaar Mathfield; terugplaatsen vervangt het payload, annuleren laat het origineel ongemoeid. De editor kan meer dan één token bevatten.
- De tekstsimulatie leeft alleen in de huidige pagina. Ze gebruikt geen WIE-model, document, import/export of persistent opslag.

## Werkende proefonderdelen

- Invoegen van een formule bij de tekstcursor, opnieuw openen, wijzigen en terugplaatsen, annuleren en een tekstvoorbeeld met meerdere formule-elementen.
- Heropenbare formulepayloads voor breuken, machten en matrices.
- MathLive Nederlandse locale `nl`, decimale-kommainvoer en gerichte Nederlandstalige overrides voor veelgebruikte toetsenbordtooltips.
- CortexJS basisbewerkingen, breuken, machten, wortels, DEG/RAD-trigonometrie, symbolische expressies, matrices en determinant. Een geldige symbolische uitdrukking of matrix wordt niet als fout gepresenteerd.
- Bestaande A/B-toetsenbordkeuze blijft beschikbaar op hetzelfde hoofd-Mathfield.

## Nederlandse configuratie

MathLive biedt via de officiële API `MathfieldElement.locale`, `MathfieldElement.strings` en `MathfieldElement.decimalSeparator`. De POC kiest `nl`, voegt Nederlandstalige overrides voor veelgebruikte toetsenbordtooltips toe en stelt de komma in als decimaalteken. CortexJS krijgt de corresponderende LaTeX-configuratie `decimalSeparator: '{,}'`; zo wordt `1{,}25` als decimaal getal gelezen. Een argumentlijst zoals `\max(1{,}25,2)` behoudt de gewone scheidingskomma. Matrixcellen worden in LaTeX met `&` en `\\` gescheiden.

De geïnstalleerde MathLive-versie heeft geen volledige ingebouwde Nederlandse vertaling. Deze proef vertaalt de relevante tooltips, maar niet elke beschikbare menu-, hulp- of fouttekst. De komma als MathLive-decimaaltoets wordt als `{,}` gecodeerd. Een los getypte/geplakte komma kan in wiskundige context een lijstscheiding zijn; om ambiguïteit te vermijden gebruikt de WIE-POC-decimaaltoets expliciet `{,}`. Gewone argumentkomma's en matrixscheiding blijven daardoor onderscheiden. Downstream T5a ASCIIMath blijft afhankelijk van de bestaande T5a-notatie en semantiek.

## CortexJS versus T5a

| Onderdeel | CortexJS-proef | Bestaande T5a-referentie |
| --- | --- | --- |
| Invoer | MathLive-LaTeX → MathJSON | MathLive-ASCIIMath → bestaande parser/AST |
| Bereik in deze proef | Exacte breuken/radicalen, numerieke evaluatie, symbolische expressies, matrixen en determinant | Bestaande beperkte numerieke grammatica |
| Hoeken | Instelbare RAD/DEG op de Compute Engine | Bestaande POC-adapter gebruikt expliciet DEG |
| Niet-numerieke uitkomst | Geldige symbolische expressie/matrix is een aparte resultaatcategorie | Niet-ondersteunde symboliek wordt door de beperkte parser afgewezen |
| Presentatie | Exact resultaat plus optionele hoge-precisiebenadering | Bestaande WIE-formattering, maximaal acht decimalen en `≈` volgens de bestaande benaderingsbeslissing |

Dit is een gerichte functieproef, geen volledigheids- of prestatiesvergelijking. Een specifieke `\det`-matrix en de knop *Bereken determinant* zijn de enige determinantproef; zij bewijzen geen algemene lineaire-algebradekking.

## Architectuurverantwoordelijkheden

**CortexJS kan in een toekomstige technische laag** LaTeX naar MathJSON parsen, expressies normaliseren/evalueren, exacte en benaderde resultaten onderscheiden en algemene numerieke/symbolische operatoren aanbieden. De POC laat zien dat reële evaluaties en symbolische resultaten via één Compute Engine bruikbaar zijn.

**WIE moet eigenaar blijven van**:

- het veilig en geautoriseerd ophalen van geometrische bronwaarden, bronidentiteit en actuele geldigheid;
- WIE-dimensies, eenheden en conversies, inclusief aansluiting op de bestaande meetsemantiek;
- productbeleid voor hoekstand, precisie, afronding en compacte weergave;
- afhankelijkheidsgraaf en dynamische herberekening wanneer geometrie of bronwaarden veranderen;
- toegang/rechten, validatie en weigeren van verouderde of niet-toegankelijke bronnen;
- versieerbare opslag van bewerkbare inline-formules en hun betekenis, compatibiliteit en export;
- invoerlimieten en veilige omgang met onbetrouwbare LaTeX/MathJSON.

CortexJS is een expressie-engine en geen eigenaar van WIE-documenten, geometrische autorisatie, dependency graph, gebruikersinstellingen of opslag. De POC voert LaTeX alleen door de bibliotheekparser; hij voert geen door de formule gegenereerde JavaScript uit. Er is geen echte WIE-objectkoppeling.

## Haalbaarheid van bewerkbare formules in WIE

Een formule als getypeerd inline-element met bewaarde MathLive-LaTeX is technisch haalbaar: de proef toont wiskundige opmaak, heropenen en wijzigen zonder ruwe LaTeX aan de lezer te tonen. Voor WIE-productie is dit nog geen schema- of integratievoorstel. Er moet eerst worden bepaald hoe inline-formulemarks/nodes samenwerken met de bestaande teksteditor, selectie, undo/redo, dynamische waarden, autorisatie, import/export, rendering, versiecompatibiliteit en toegankelijkheid. De `data-*`-payload in deze proef is alleen tijdelijk DOM-staat en mag niet als productieschema worden overgenomen zonder apart ontwerpbesluit.

## Beperkingen en open vragen

- De teksteditor is een `contenteditable`-simulatie; er zijn geen echte WIE-teksteditorcommando's, selectiehistorie, undo/redo of persistentie.
- Nederlandse vertaling is gedeeltelijk; MathLive-bibliotheeklabels buiten de overrides kunnen Engels blijven.
- T5a blijft beperkt tot zijn bestaande expressiegrammatica en rekensemantiek; getalnotatie met komma moet vóór productiekoppeling end-to-end worden afgestemd.
- De POC gebruikt voor CortexJS alleen de geselecteerde RAD/DEG-instelling; geen geometrische hoekbron of eenhedenbron wordt opgehaald.
- Een losse matrix werkt; ongeldige dimensies, complexe matrices en brede matrixoperatoren vereisen vervolgdekking.
- Browserautomatisering is op deze host niet beschikbaar: Edge sluit af en Playwright Chromium is niet geïnstalleerd. De gerichte browser-smoketest is daarom niet geslaagd/uitgevoerd. Een beperkte handmatige controle is met de in-app browser gedaan; er is geen volledige Edge-regressiesuite gedraaid.
- Er zijn screenshots van de interactieve proefweergave gemaakt en in het Codex-taskgesprek getoond. De beschikbare in-app browser bood geen export naar versieerbare PNG-bestanden.

## Testresultaten

- `npm run test:poc`: bestaande T5a/formatter/Cortex-referentieset **4/4 PASS**.
- `npm run test:poc1`: configureerbare NL-decimaal, argument-/matrixkomma's, basis exact, breuk, wortel, DEG/RAD, symbolische uitkomst, matrix/determinant, foutcategorie en formulepayload **4/4 PASS**.
- `node --check app.js`, `node --check cortex-analysis.mjs`, `node --check test/poc1.test.cjs` en `node --check test/browser-smoke.cjs`: **PASS**.
- `npm run test:poc:browser`: geprobeerd; op deze host kon geen bruikbare Edge-sessie starten; de fallback meldt dat de Playwright Chromium-executable ontbreekt. Geen browserresultaat wordt als PASS geclaimd.
- Gerichte handmatige in-app browsercontrole: formule invoegen en als MathLive weergegeven zien; meerdere formules plus een matrix in één tekstvoorbeeld; matrixpayload opnieuw openen; formule wijzigen en terugplaatsen; een nieuwe wijziging annuleren en de bewaarde versie opnieuw openen; CortexJS matrixcategorie en determinant `-2`; symbolische expressie als geldig; `sin(30)` als RAD-benadering en DEG exact `1/2`; WIE-decimaaltoets geeft `≈1,25`. Geen volledige browserregressie.

## Voorstel voor POC-2

1. Herhaal de browser-smoketest op een host met Edge of een reeds geïnstalleerde Playwright-browser; controleer inline-invoegcursor, selectie, annuleren/terugplaatsen, undo en toetsenbord-/focusgedrag.
2. Maak een aparte integratieproef met een adapter die een mock-geometriebron omzet naar getypeerde numerieke waarden en expliciete eenheden, zonder WIE-documentmutatie.
3. Leg vooraf het WIE-resultaatcontract vast voor formulepayload, hoekstand, herberekening, precisie en parse-/rekenfouten; houd MathJSON/Compute Engine achter een dunne POC-adapter.
4. Onderzoek selectie, toegankelijkheid en mobile-layout van inline-formules met het echte teksteditormodel, nog steeds zonder productie-schemawijziging.

## Officiële API-bronnen

- [MathLive Mathfield API — localization en decimal separator](https://mathlive.io/mathfield/api/)
- [MathLive virtual keyboard — container en layouts](https://mathlive.io/mathlive/guides/virtual-keyboard/)
- [CortexJS Compute Engine — exact en benaderd evalueren](https://cortexjs.io/compute-engine/guides/numeric-evaluation/)
- [CortexJS Compute Engine — matrices en determinant](https://cortexjs.io/compute-engine/reference/linear-algebra/)
