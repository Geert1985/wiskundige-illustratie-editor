# WIE-TXT-FORM — Dynamische formules en meetwaarden

**Ontwerpcontract v1.2.0 — 17 oktober 2026**  
**Status:** functioneel concept door gebruiker bevestigd; vastgelegd als documentatie. **Geen implementatie-GO; TXT-FORM.0 (read-only preflight) verplicht.**  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Relaties:** [WIE-FORM — gedeelde Formule-editor](WIE-FORM-FORMULE-EDITOR-ONTWERPCONTRACT.md); [WIE-ALG — interactieve algebra](WIE-ALG-INTERACTIEVE-ALGEBRA-ONTWERPCONTRACT.md); [ontwikkelroadmap](DEVELOPMENT-ROADMAP.md).

## 1. Productdoel

Een gekoppelde geometrische eigenschap kan in de bestaande Wiskundige Teksteditor op drie manieren worden getoond, zonder verschillende berekeningswaarheden:

1. **Waarde:** `A = 24 cm²`.
2. **Symbolische formule:** `A = a·b` of bij aantoonbare puntreferenties `A = |AB|·|BC|`.
3. **Uitwerking:** symbolische formule, gecontroleerde substitutie en eindresultaat, bijvoorbeeld `A = a·b`, `a = 6 cm, b = 4 cm`, `A = 24 cm²`.

De presentatie blijft dynamisch gekoppeld aan bronobject, broneigenschap, de relevante zijderollen, de eenheden en de toegestane labels. Een ongeldige of verboden bron toont **niet beschikbaar**, zonder identiteit te verliezen of informatie prijs te geven.

**Aangescherpt ontwerpbesluit v1.2.0:** TXT-FORM is de dynamische geometrische **inhouds- en presentatieadapter** voor de gedeelde **WIE-FORM-werkruimte**, met behoud van het bestaande waarde-invoegpad. De basisfuncties kunnen gefaseerd al in de huidige teksteditor beschikbaar komen vóór de aparte FORM-werkruimte is gebouwd. WIE-ALG wordt later als interactieve algebraïsche uitbreidingslaag **in dezelfde WIE-FORM-werkruimte** geïntegreerd. TXT-FORM bevat zelf **geen** termselectie, slepen tussen leden, vergelijkingoplossing, automatische vereenvoudiging, symbolisch bewijzen, CAS of tweerichtingsbewerkingen op geometrie.

## 2. Bestaande basis en integratie

Actuele relevante code (te verifiëren tegen HEAD in TXT-FORM.0): `text-values.js`, `text-dynamic-value-editor.js`, `text-insert-panel.js`, `rich-text-editor.js`, `text-dependencies.js`, `rich-text-renderer.js`, `text-content-diff.js`, `math-source.js`, `math-fragments.js`; daarnaast `expression-ast.js`, `expression-engine.js`, `expression-sources.js` en het bestaande meet- en eenhedensysteem.

- `dynamicValue` is reeds een gekoppeld inline-atoom; `math` is een statische, veilige presentatieformule. Die bestaande typen **niet** verbreken.
- De huidige `MathSource`/LaTeX-laag is **presentatie**, geen semantisch bronmodel of algebra-engine.
- Hergebruik de bestaande meetberekening, getypeerde numerieke AST, autorisatie, afhankelijkheidsindex, ProseMirror-transacties, rich-text-layout en export. Bouw geen parallelle calculator, geometrieengine of formule-evaluator.
- Bestaande legacy `textBinding`, tekstschema's, rijke tekstopmaak, rich-text-Undo/Redo, import/export en toegangsrechten behouden hun huidige gedrag.

## 3. Gebruikerservaring

**Eerste invoerpad:** `Wiskundige Teksteditor → Toevoegen → Waarde` uitbreiden, zonder de huidige tab `Formule` voor handmatige LaTeX te verwijderen. **Toekomstige gedeelde invoerroute:** nieuwe of bestaande getypeerde formule openen via WIE-FORM en het resultaat via een hostadapter atomair invoegen/terugplaatsen; de eenvoudige TXT-FORM-waarde-invoer mag onafhankelijk eerder worden geleverd.

1. Selecteer bronobject (bijv. rechthoek ABCD).
2. Selecteer toegestane broneigenschap (oppervlakte, omtrek, lengte enz.).
3. Kies `Waarde`, `Formule` of `Uitwerking`.
4. Kies voor formule/uitwerking: `Automatisch`, `Zijdesymbolen` of `Puntnamen`, alleen wanneer de benodigde semantische referenties beschikbaar zijn.
5. Kies eventueel grootheidslabel, precisie, eenheden en toegelaten rolgebonden symbolen.
6. Bekijk de live-preview, bevestig via één commit of annuleer zonder documentwijziging.

Een ingevoegd veld is één dynamisch inline-element met bewerkbare instellingen; Enter/dubbelklik op de selectie heropent de bestaande invoegbediening. De cursor, teksthistory, tabnavigatie, focus, kopiëren/plakken en toegankelijkheid blijven correct.

## 4. Referenties en naamgeving

Maak onderscheid tussen **stabiele object-ID**, **geometrische onderdeel-/zijderol**, **echte puntreferentie**, **symbolische alias** en **grootheidslabel**. Een alias `a` is geen numerieke waarde of object-ID.

- `|AB|` alleen als A en B aantoonbaar de overeenkomstige, stabiel gekoppelde eindpunten zijn. Geen puntnamen afleiden uit toevallig nabijgelegen punten of labels.
- Zonder betrouwbare puntbinding blijft een rolgebonden formule zoals `a·b` mogelijk.
- Een gebruiker mag `a` naar bijvoorbeeld `l` aanpassen, met behoud van de **rolbinding**. Puntnaamnotatie volgt hernoemde echte punten; dubbele namen geven geen ambiguë bronbinding.
- Bij herordening, vervangen of vervormen van vertices blijft de formule alleen geldig als het recept en de bronrollen nog aantoonbaar overeenkomen; geen stille herbinding naar een willekeurige zijde.

**WIE-ALG-voorbereiding:** leg de semantische identiteit van formuleonderdelen vast via getypeerde operatoren, rolverwijzingen en versievaste formule-/receptidentiteit; sla **niet uitsluitend gerenderde LaTeX** op als latere enige bron voor structurele algebra. TXT-FORM.0 bepaalt de kleinste compatibele representatie; dit is geen opdracht om meteen een algemene symbolische AST in te voeren.

## 5. Formulecatalogus en wiskundige juistheid

| Bewezen geometrische bron | Eigenschap | Mogelijke formule | Vereiste |
|---|---|---|---|
| Rechthoek | oppervlakte | `A=a·b` | rechthoekconstraint en twee aangrenzende stabiele zijderollen |
| Rechthoek | omtrek | `P=2(a+b)` | dezelfde constraint |
| Vierkant | oppervlakte | `A=a²` | vierkantconstraint bewezen |
| Cirkel | oppervlakte/omtrek | `A=πr²` / `P=2πr` | geldige cirkel en straal |
| Ellips | oppervlakte | `A=πab` | a en b zijn **halve** aslengten |
| Driehoek | oppervlakte | `A=½bh` | ondubbelzinnige basis en loodrechte hoogte |
| Lijnstuk | lengte | `L=|AB|` | echte eindpuntreferenties voor die notatie |

Dit is een **doelcatalogus**, niet de gegarandeerde eerste leveringsscope. Een willekeurige vierhoek is geen rechthoek; een visueel gelijkende vorm levert geen bewezen vierkant. Een recept dat niet geldig of niet aantoonbaar is wordt niet aangeboden.

**Dimensies:** lengten schalen met `scale`, oppervlaktes met `scale²`; fysieke, abstracte en dimensionloze eenheden volgen de bestaande meet- en expressiekern. Gebruik dezelfde numerieke bron voor eindwaarde en substitutie. Bereken met volledige interne precisie; afronding is uitsluitend presentatie. Toon `≈` indien gepresenteerde afgeronde factoren of resultaten geen exacte gelijkheid rechtvaardigen. Gebruik `=` uitsluitend bij een geldige exacte getoonde relatie. Geen dimensie-onjuiste algebra.

## 6. Doelarchitectuur en persistente vorm

**Logische componenten** (namen zijn richting, geen verplichte nieuwe modules):

- `FormulaRecipeRegistry`: gevalideerde, getypeerde recepten met voorwaarden, semantische rolreferenties en versievaste identiteit.
- `FormulaPresentationResolver`: autorisatie- en bronbewuste omzetting van hetzelfde recept naar waarde, symbolische formule of uitwerking.
- **Bestaande** `TextValues`/`MeasurementUnits`/`Expression*`: numerieke waarheid en eenheidscontrole.
- **Bestaande** `MathSource`/`MathFragments`/rich-text-renderer: veilige presentatie, inline-atomen en export.
- **Bestaande** `TextDependencies`: tijdig bijwerken bij bron-, label-, naam-, rol- en meetinstellingswijzigingen.

Een voorgesteld `dynamicMeasurement`-inlineveld kan bron en presentatie gescheiden opslaan. **Alternatief:** `dynamicValue` compatibel uitbreiden. TXT-FORM.0 moet beide opties vergelijken en een minimaal, expliciet versie-/migratiecontract kiezen. Voorbeeld, **niet vastgestelde schema-API**:

```json
{
  "kind": "dynamicMeasurement",
  "binding": { "sourceId": "geometry-5", "property": "area" },
  "presentation": {
    "mode": "worked",
    "notation": "sideSymbols",
    "formulaId": "rectangle.area",
    "formulaVersion": 1,
    "roleAliases": { "base": "a", "adjacent": "b" },
    "precision": null,
    "unitMode": "document"
  }
}
```

Een veld slaat geen gerenderde SVG, verouderde numerieke waarheid of niet-geautoriseerde brondata op. Wijzig de huidige document-/tekstschemaversies pas na audit, met strikt atomair importgedrag en laagst mogelijke exportversie. Nieuwe velden mogen door oude lezers niet ongemerkt worden weggegooid. Als een recept na software-upgrade anders zou worden geïnterpreteerd, is expliciete migratie/versionering nodig.

## 7. Veiligheid, dynamiek en documenten

Bronautorisatie geldt bij selecteren, preview, toepassen, herberekenen, kopiëren en SVG-/PNG-export. Geen lekken via namen, verborgen labels, formules, caches of alternatieve teksten. Respecteer revisie-/permission-epoch bij asynchrone previews en exports.

Verplaatste/geschaalde bronnen berekenen opnieuw; ontbrekende of ongeldige bron blijft herstelbaar. `Toepassen` schrijft één toegestane transactie; `Annuleren` niets; Undo/Redo herstelt de volledige binding. Bestaande statische math, numerieke dynamische velden, permissies en histories blijven ongewijzigd functioneren. Geen wijziging van de geometrie door een formulepresentatie.

## 8. Fasen en formele poorten

| Fase | Afbakening | Status |
|---|---|---|
| **TXT-FORM.0** | Read-only audit: daadwerkelijke `main`-HEAD, tekstschema's, exacte object-/zijderollen, proven-shape capabilities, formulemodel, scriptmanifest, opslag, renderer, veiligheid en tests; keuze nieuw veld versus uitbreiding | **volgende aanbevolen stap, geen productiecode** |
| **TXT-FORM.1** | Eerste end-to-end dynamische numerieke/symbolische presentaties op aantoonbaar geschikte typen; beperkte catalogus, live-preview, SVG, JSON, tests | gepland, aparte GO |
| **TXT-FORM.2** | Uitwerking, factorwaarden, dimensies, precisie, rolnamen, puntnamen, uitbreiding catalogus, vollediger UI | gepland, aparte GO |
| **TXT-FORM.3** | Integratieadapter naar **WIE-FORM**, rekenmachine, gecombineerde meting; gereedmaken voor WIE-ALG zonder eigen editor/CAS | gereserveerd |

**Afhankelijkheidsregel:** TXT-FORM mag een uitbreidbare semantische formulerepresentatie voorbereiden, maar bouwt **geen tweede formulewerkruimte** en geen WIE-ALG-transformatie-engine. FORM.0 en TXT-FORM.0 moeten de datagrenzen coördineren; de eerste dynamische waarde-/formuleweergave hoeft niet op FORM.1 te wachten. WIE-ALG bouwt later in WIE-FORM op de gevalideerde structuur voort, niet op losgesleepte LaTeX-fragmenten.

## 9. Verplichte test- en acceptatiematrix

1. Rechthoek 6 cm × 4 cm = 24 cm², met juiste schaal² en symbolische bronrol.
2. Dynamische wijziging van geometrie, labels, aliassen en echte puntnamen.
3. Ellips `a,b` als halve assen; willekeurige vierhoek **niet** als rechthoek.
4. Verlies van bewezen type/constructiegeldigheid, bronverwijdering, herstel, duplicatie, herordening en Undo/Redo.
5. Exact versus benaderend, fysiek/abstract/dimensionloos, eenheden, afronding en numerieke tolerantie.
6. Restricted-source autorisatie, snapshot/revision/epoch, gecancelde previews, kopiëren en veilige SVG/PNG.
7. Legacy `textBinding`, `dynamicValue`, `math`, document- en tekstschema's, JSON roundtrip, import/replay.
8. Identieke betekenis op canvas, rijke editor en export, met toegankelijkheid, toetsenbord en volledige Node-/Edge-regressies.
9. Formule-/receptidentiteit over opslaan/herladen en toekomstige formulecataloguswijzigingen.
10. Geen veronderstelde algebra-bewerkingen, drag/drop van termen of geometrische mutaties in TXT-FORM.1/.2.

**Definitie gereed:** afzonderlijke contract-GO, implementatie, werkelijk uitgevoerde tests, handmatige acceptatie en merge naar `main` worden elk expliciet onderscheiden. Dit document creëert **geen** van die volgende statussen.
