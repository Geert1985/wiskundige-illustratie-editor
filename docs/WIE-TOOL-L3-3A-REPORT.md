# WIE-TOOL-L3.3a — Centrale lifecycle voor Punt op object

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l3-3a-point-on-object`.
Basis: actuele `origin/main` commit `44418b261552370760894913bafcc61c7fd8bdcd`, waarin L3.2 via merge PR #36 is geïntegreerd.

## Callflow vóór en na de wijziging

De gewone canvasinvoer loopt via `pointerDown()` naar `constructionClick()`. Bij `construct:pointOnObject` doet de eerste klik het volgende:

1. `pointOnObjectCandidates()` vraagt de bestaande `constructionPick()` om bronnen voor `pointOnSegment`, `pointOnCircle` en `pointOnEllipse`.
2. `projectPath()` gebruikt `ConstructionService.projectParameter()` en de bestaande projectie voor lijnstuk/veelhoekzijde, cirkel en ellips. Kandidaten worden alleen aanvaard wanneer de geprojecteerde positie binnen 12 CSS-pixels ligt en de bron niet gedegenereerd of ongeldig is.
3. De gekozen bron en concrete receptsoort komen in `interaction`; `pathPlacement` wordt actief en `setPointPlacementPreview()` toont de projectie. Dit is een tussenstap, geen documentmutatie of voltooide constructie.

De tweede klik gaat door `radialPathPlacement()`. Deze route projecteert opnieuw op dezelfde vastgelegde bron, controleert de bestaande 12-pixeltolerantie en de actuele tool-/bronbeschikbaarheid, en bepaalt de bestaande `parameter`. Pas daarna roept `changeDocument(..., {cancelInteraction:false})` het geautoriseerde `construction.create`-commando aan met de concrete tool-ID, bronreferentie en parameter. Dat commitmoment is de definitieve constructie.

Voorheen ruimde de gespecialiseerde route na `outcome.ok` zelf de interactie en preview op, wees rechtstreeks `tool='select'` toe en zette de successtatus. Nu geeft de route de gecommitte resultaat-ID's aan `completeToolInteraction({toolId:'construct:pointOnObject', outcome, origin:'canvas', selection:createdIds})`. De centrale controller voert de cleanup, selectieoverdracht en policy `single` uit. `changeDocument()` blijft de command-/historygrens; de geometrische service en projectiefuncties zijn niet aangepast.

`startContextConstruction()` kan een bron vooraf invullen en `radialPlacement`/`pathPlacement` instellen voor hetzelfde Punt-op-object-gereedschap. Die plaatsing vervolgt via dezelfde `radialPathPlacement()` en eindigt dus eveneens via de centrale completion. De directe context-`complete`-route voor constructies zonder plaatsingsstap blijft ongewijzigd en behoudt de voorafgaande toolmodus.

## Bronobjecten en geometrische betekenis

De feitelijke selectiegrens staat in `pointOnObjectReference()` en `pointOnObjectCandidates()`:

| Bron in de universele Punt-op-object-picker | Recept | Teststatus |
|---|---|---|
| Lijnstukobject met modeltype `line` | `pointOnSegment`, volledige lijnstukreferentie | Getest |
| Zijde van een veelhoek (`polygon`, `part:'edge'`) | `pointOnSegment`, zijreferentie | Getest |
| Cirkel | `pointOnCircle`, volledige cirkelreferentie | Getest |
| Ellips | `pointOnEllipse`, volledige ellipsreferentie | Getest |

De code filtert andere lineaire objecten, waaronder `straight`, `ray`, `vector` en `dimension`, uit de universele picker. Een niet-ondersteund object levert geen constructie op; er is geen bronallowlist uitgebreid. De algemene `ConstructionService` kan sommige recepttypen buiten deze universele UI-route ruimer accepteren, maar dat verandert de feitelijke Punt-op-object-picker niet.

De service blijft eigenaar van de parametersemantiek: lijnstukparameter wordt door `normaliseParameter()` tot `[0,1]` begrensd, cirkelparameter wordt periodiek genormaliseerd en ellipsparameter blijft aan de ellipsprojectie gekoppeld. De opgeslagen constructie blijft naar dezelfde bron-ID verwijzen. Een bronwijziging herberekent het afhankelijke punt via de bestaande constructiegraaf.

## Fout-, retry- en annuleringsgedrag

- **Geen passende bron bij eerste klik:** `pointOnObjectCandidates()` retourneert geen bron; de bestaande instructie blijft zichtbaar, de tool blijft actief en er volgt geen documentcommando of completion.
- **Projectie buiten de tolerantie bij plaatsingsklik:** `radialPathPlacement()` toont de bestaande afstandsinstructie en laat de bronselectie/interactie beschikbaar voor een nieuwe klik. Er ontstaat geen document- of historymutatie.
- **Commandweigering:** `changeDocument()` retourneert `ok:false` en meldt de fout. De route roept geen completion aan, geeft de pointer veilig vrij en wist `pointerId`; bron en plaatsingsinteractie blijven bruikbaar voor retry. Er komt geen lege history-entry bij.
- **Retry:** een volgende geldige plaatsingsklik voert het commando opnieuw uit; bij succes vindt precies één centrale completion plaats.
- **Esc:** de bestaande `cancel()` wist interactie en preview en de bestaande toetsenbordhandler keert terug naar Selecteren. Deze algemene annulering is niet aangepast.

## Selectie en geschiedenis

De aangemaakte ID's uit de `construction.create`-resultaatlijst gaan als selectie naar de controller. Punt op object levert in de geteste recepten één afhankelijk punt. De geselecteerde punt-ID, de bronreferentie en parameter worden bij undo/redo respectievelijk verwijderd en met dezelfde constructierelatie hersteld. De aanmaak blijft één history-entry; er is geen tweede historyregistratie of geometrische mutatie toegevoegd.

## Gerichte verificatie

Uitgevoerd:

```powershell
node --test --test-reporter=spec --test-name-pattern='WIE-TOOL-L3\.3a|WIE-TOOL-L3\.2 generic|WIE-TOOL-L2 canvas midpoint|WIE-TOOL-L2 Snijpunt|WIE-TOOL-L1 pointOnObject|WIE-TOOL-L3\.1 free point' tests/lifecycle.test.cjs
node --check editor.js
node --check tests/lifecycle.test.cjs
git diff --check
```

**10/10 geselecteerde tests PASS.** De vier L3.3a-tests controleren de vier ondersteunde bronvormen, concrete recepten en parameters, selectie, centrale completion, cleanup, één history-entry, undo/redo, dynamische herberekening bij wijziging van de cirkel, geweigerde command/retry, ongeldige projectie/retry, niet-ondersteunde rechte en Esc. De geselecteerde bestaande tests controleren L3.2 generieke constructie, L2-Middenpunt, Snijpunt/context, L1-commandfout/retry voor Punt op object en `repeat`-gedrag van vrije punt-/draw-tools.

Syntax- en diffcontroles slagen. Geen volledige Node-suite, browserregressiesuite, Edge-run of performancetest uitgevoerd. De lifecycletests gebruiken de bestaande gesimuleerde DOM; echte browser-event-/focusvolgorde is niet opnieuw gevalideerd.

## Niet gemigreerde routes en beoordeling

De afzonderlijke universele Snijpunt-route, Ellips-Q-constructie, Parallellogramplaatsing, tekstworkflow en directe context-completeacties bleven buiten scope en behouden hun eerdere afhandeling. Vrije tekengereedschappen en generieke gekoppelde constructies volgen reeds L3.1/L3.2. Punt op object zelf gebruikt nu dezelfde centrale completioncontroller als die routes zonder zijn plaatsings-, projectie- of bronlogica te vervangen.

**Technische beoordeling: GO voor L3.3a.** De `single`-policy, bestaande bron-/parametersemantiek, dynamische afhankelijkheid, fout/retry, selectie en history zijn gericht gecontroleerd. Resterend risico is uitsluitend de beperkte testbreedte en het ontbreken van een echte browsercontrole; aanvullende objecttypen en andere gespecialiseerde routes vallen buiten deze fase.

Status: geïmplementeerd en gericht getest op featurebranch. Handmatige acceptatie, PR-beoordeling en main-integratie zijn afzonderlijke statussen; commit-SHA en pushbevestiging staan in de taakoplevering.
