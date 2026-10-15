# WIE — T5b wetenschappelijke rekenmachine: UX- en integratiecontract

**Versie:** 1.0.2 — visuele basis goedgekeurd, implementatie nog niet vrijgegeven  
**Datum:** 15 oktober 2026  
**Status:** T5b-0 visuele basis geaccepteerd; detailuitwerking en STAB-1 nog vereist; geen implementatie-GO of codewijzigingen  
**Project:** From Zero 2 Infinity · Wiskundige Illustratie Editor  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Geverifieerde GitHub-baseline:** `main` op `3c53e7a8d29dfa18deda653eb74ee9139e9ac055`  
**Doel:** één gedeelde wetenschappelijke rekenmachine, beschikbaar vanuit WIE én vanuit de teksteditor.

> **Documentstatus:** dit is een concreet ontwerpvoorstel binnen de bestaande, eerder goedgekeurde T5a–T5d-architectuur. Nieuwe keuzes in dit document vereisen nog gebruikersacceptatie en zijn geen beschrijving van reeds geïmplementeerde functionaliteit. Eerst de STAB-1-baseline verifiëren voordat Codex productiecode voor T5b mag wijzigen.

## 1. Gecontroleerde uitgangssituatie

Op de opgegeven `main` bestaan `expression-numeric.js`, `expression-ast.js`, `expression-engine.js` en `expression-sources.js`, met T5a-tests en bronadapter. De normale `editor.html`-scriptlijst laadt die vier modules **nog niet**; de browsertests laden ze afzonderlijk. Een zelfstandige of inline wetenschappelijke calculatorinterface is nog niet geleverd. De huidige documentimplementatie accepteert onder andere document v8 met `regionSchema:1`, naast rich text met schemas 1–3. De oude T5c-documentatie verwijst nog naar document v7/textSchema 4; dit is een toekomstig schema-/compatibiliteitspunt, geen T5b-wijziging.

Historisch bewijs: `docs/test-evidence/T5a.json` registreert 573 Node-tests PASS en specifieke Edge-controles van 12 oktober 2026. Dit document claimt **geen** nieuwe Node-, Edge-, visuele of toegankelijkheidstest op de opgegeven HEAD. Recente UI/REG-2-merge vereist aanvullende STAB-1-verificatie.

## 2. Afbakening en voortgangspoorten

| Fase | Opdracht | Huidige toestand |
|---|---|---|
| T5a | Veilige parser, AST, evaluatie, eenheden en geautoriseerde bronadapter | Geïntegreerd in `main` |
| STAB-1 | Controle van actuele geïntegreerde Node-/Edge-baseline en open handmatige checks | Nog te bewijzen op actuele HEAD |
| **T5b-0** | Dit UX-, keyboard-, venster-, adapter- en interactiecontract goedkeuren | **Dit document: ontwerpvoorstel** |
| T5b | Eén calculatorcomponent met twee hosts; **alleen** invoeren, evalueren, tonen, kopiëren | Niet gestart |
| T5c | `calculatedValue` inline invoegen, bestaande velden heropenen, drie weergavemodi | Niet gestart; aparte GO |
| T5d | Integratie-, privacy-, accessibility- en exportaudit | Niet gestart; aparte GO |
| K1–K8 | Stapsgewijs aanvullende TI-36X Pro-achtige rekenfuncties | Apart gepland, buiten T5b |

**Niet in T5b:** nieuwe rekenkundige semantiek; exact-rationele CAS; vrije `f(x)`-variabelen; matrix/complex/statistische pakketten; grafiekcanvas/plotter; automatische opslag; documentobjecten of documenthistory; invoegen van een berekend tekstfragment; wijzigingen aan `textSchema` of documentversie. T5b bevat uitsluitend de reeds door T5a ondersteunde operatoren, constanten, functies en typen.

## 3. Product- en visuele principes

- Eén **zwevend, versleepbaar** paneel, in WIE-stijl: donkerblauw met ingetogen goudaccenten en Nederlandstalige labels.
- Dezelfde component krijgt twee dunne hostadapters: `standalone` via de algemene werkbalk en `inline-preview` via `∑` in de teksteditor. Geen dubbele keypad, formatter of evaluator.
- De illustratie blijft zichtbaar achter het paneel; het paneel vermijdt automatisch positie buiten het zichtbare werkvlak.
- Het resultatendisplay is altijd leesbaar. Een formule kan meerdere regels innemen en heeft een aparte invoer-/resultaatpresentatie; horizontaal overlopen gebeurt binnen het invoerveld, niet over de omringende werkbalk.
- Fouten worden lokaal, herkenbaar en Nederlandstalig getoond, zonder interne bronidentiteiten, parserdetails of stack traces.
- De UI kan later uitbreiden naar K1–K8 met een **configuratiegestuurd, modulair toetsenbord** (zie §5.3), maar toont **nooit een niet-werkende functietoets als beschikbaar**.

### 3.1 Voorgesteld bureaubladformaat

**Ontwerpvoorstel ter acceptatie:** initiële paneelbreedte 400 CSS-pixels; configureerbare CSS-grenzen 340–460 px; paneelhoogte naar inhoud, met maximale hoogte `min(720px, beschikbare werkvlakhoogte − 24px)`. Bij smalle schermen verdwijnt de vaste breedte en werkt het paneel als een viewport-begrensde sheet. Dit zijn geen reeds geverifieerde afmetingen.

**Plaatsing:** standaard rechtsboven in het **zichtbare werkvlak**, met 12 px binnenmarge. Niet de pagina of canvastransformatie gebruiken als coordinate-space. Het paneel kan via een duidelijk handvat in de titelbalk worden versleept; knoppen binnen de titelbalk blijven onafhankelijk bedienbaar. Slepen mag geen objectselectie, canvaspan, tekenen of documentmutatie veroorzaken. Na resize/fullscreen/inzoomen wordt de positie binnen de nieuwe viewport begrensd. Paneelpositie blijft slechts de huidige sessie bewaard.

### 3.2 Schets van de indeling (visuele richting geaccepteerd; toetsmatrix nog verfijnbaar)

```text
┌───────────────────────────────────────────────┐
│ ◈ Wetenschappelijke rekenmachine          ×   │  ← sleepbare titel
├───────────────────────────────────────────────┤
│ Invoer                                        │
│ π × [Straal · cirkel C] ^ 2                   │  ← bronchip in formule
│                                        ↔  ⌫  │
├───────────────────────────────────────────────┤
│ RESULTAAT                                    │
│ ≈ 12,57 cm²                                   │
│                         Resultaat kopiëren   │
├───────────────────────────────────────────────┤
│ Hoek: DEG/RAD     Eenheid: cm   Precisie: 2   │
├───────────────────────────────────────────────┤
│ SHIFT  ◀  ▶    (      )                      │
│ sin    cos   tan   √     ÷                    │
│ ln     log   exp   xʸ    ×                    │
│ 7      8     9    π      −                    │
│ 4      5     6    e      +                    │
│ 1      2     3    Bron   =                    │
│ C      0     ,    ±      ⌫                    │
└───────────────────────────────────────────────┘
```

De keypad-schets is **informatief**, geen definitieve toetsmatrix. De posities en toetsfuncties zijn via de in §5.3 vastgelegde declaratieve configuratie wijzigbaar; de getoonde knop `√` heeft in T5b enkel `sqrt` en krijgt **pas vanaf een afzonderlijk goedgekeurde K1-implementatie** een secundaire `SHIFT + √` voor de n-de machtswortel. Bijvoorbeeld `±` is een invoertransformatie voor unary `-`, geen nieuwe motoroperator; `log` verwijst naar bestaande `log10` en `xʸ` naar `^`. De getoonde bronchip en het resultaat zijn een voorbeeld bij de geautoriseerde bron `r=2 cm`. Gebruik een werkelijke ontwerpreview en keyboardmapping vóór de Codex-GO.

### 3.3 Visuele ontwerpbesluiten — v1.0.2 (goedgekeurde basis)

- **Leidende visuele richting:** de **eerste, ruimere T5b-mock-up** met centraal zwevend donkerblauw calculatorpaneel, gouden accenten, duidelijk formule-/resultatendisplay en gescheiden functiegroepen. De tweede vereenvoudigde mock-up is **niet** de leidende lay-out. De basis is geaccepteerd; pixelniveau, toetsenafmetingen en micro-interacties mogen tijdens implementatie verder worden gefinetuned.
- **Numeriek klavier:** toetsen `0–9` en de decimale komma zijn **wit/licht met donkerblauwe cijfers**; alle numerieke toetsen hebben gelijke breedte en hoogte. Het toetsenblok vormt een herkenbaar aaneengesloten 3-koloms raster.
- **Operatorgroep:** `×`, `÷`, `+` en `−` worden **direct bij elkaar** in één compacte, visueel samenhangende groep geplaatst, aansluitend op het numerieke klavier. De vier operatoren krijgen onderling gelijke toetsafmetingen; geen verspreiding over de wetenschappelijke functierijen.
- **Gelijkteken:** de `=`-toets heeft **dezelfde breedte als één cijferknop**, niet breder; goud als actieaccent is toegestaan. Ook bij responsieve herindeling blijft deze breedteregel gelden.
- **Functienavigatie:** de knoppen **Functies**, **Bron**, **Eenheden** en **Sjablonen** krijgen **gelijke breedte** en gelijke hoogte, bij voorkeur in een 4-koloms grid. Op smallere schermen mogen ze als 2×2-grid worden herschikt, maar blijven onderling even breed. De actieve toestand is duidelijk herkenbaar.
- **SHIFT-feedback:** de SHIFT-toets krijgt een expliciete actieve toestand; bij activering tonen alle toetsen met een *werkende* secundaire T5b-actie hun alternatieve functie duidelijk in goud of als primaire zichtbare actie. Secundaire functies die pas in K1–K8 komen, waaronder `ⁿ√x`, worden niet als beschikbare actie getoond. SHIFT vervalt na één geldige secundaire actie; visuele toestand, toegankelijk label en actie-dispatch blijven synchroon.
- **Uitbreidbare indeling:** numeriek raster, operatorgroep, wetenschappelijke functiegroep en functienavigatie zijn afzonderlijke layoutgroepen in het declaratieve toetsenregister (§5.3). Knoppen kunnen later zonder wijziging aan de rekenmotor worden herschikt. De vier operatoren blijven een groep bij toekomstige K1–K8-uitbreidingen.
- **Correctheid van mock-ups:** illustraties zijn visuele referenties, geen normatieve uitkomsten. Een cirkel met straal `2 cm` heeft omtrek `≈ 12,57 cm` en oppervlakte `≈ 12,57 cm²`; toon de juiste formule en eenheid, zonder de twee te verwarren.

## 4. Twee gebruiksmodi

### 4.1 Standalone vanuit WIE

1. Een herkenbare calculatoractie wordt aan de huidige hoofdwerkbalk toegevoegd; exacte iconenplaatsing wordt in de visuele review goedgekeurd.
2. Openen kan zonder tekstobject, bestaande geselecteerde objecten of documentobjecten; ook bij een leeg document.
3. De gebruiker voert een formule in, kan geautoriseerde geometrische bronwaarden selecteren, bekijkt live het resultaat en kan bewust **Resultaat kopiëren** kiezen.
4. Sluiten/annuleren reset uitsluitend de private calculatorsessie. Er ontstaat geen nieuw object, documentversie, documentundo-entry, gewijzigde selectie, documentrevisie of exportbare calculatorstaat.
5. Voor bronwaarden wordt een actuele geautoriseerde snapshot gelezen; externe geometriewijzigingen mogen de **weergave** herberekenen maar worden nooit door de calculator zelf uitgevoerd.

### 4.2 Inline vanuit de teksteditor via `∑`

1. De `∑`-actie opent exact dezelfde calculatorcomponent vanuit de tekstwerkruimte, met vooraf bewaarde rich-text selectie/bookmark.
2. In **T5b** mag men rekenen, maar **niet** berekende waarden invoegen; toon dus geen actieve actie `Invoegen in tekst`.
3. Sluiten of annuleren herstelt focus en bookmark zonder de rich-textdraft, selectie-inhoud, documenthistory of document-JSON te wijzigen.
4. **Vanaf T5c, na aparte GO:** activeer `Invoegen in tekst` met één getypeerd `calculatedValue`-fragment. Eén buitenste teksteditor-OK vormt de enige documenttransactie. Gebruik dezelfde component om berekende fragmenten later te bewerken.

## 5. Rekeninvoer en toetsencontract

### 5.1 Toegestane motorfuncties in fase 1

**Operatoren:** `+`, `−`, `×`, `÷`, macht `^`, haakjes, negatieve waarden. De getypeerde AST blijft canoniek voor `+ - * / ^`.  
**Constanten:** `π`, `e`.  
**Functies:** `sqrt`, `abs`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `ln`, `log10`, `exp`, `round`, `floor`, `ceil`, `trunc`.  
**Getypeerde units:** `mm`, `cm`, `m`, `km`, `deg`, `rad`, `unit` conform bestaande T5a-semantiek.  
**Bronproperties:** `length`, `radius`, `perimeter`, `area`, `angle`, `x`, `y`, alleen wanneer bronobject en policy dit toestaan.

Ontwerp scheidt zichtbare, natuurlijke invoer van de uitvoerbare AST. Bronnen zijn niet vrij getypte objectnamen; ze zijn geselecteerde typed tokens `{sourceId, property}`. LaTeX/MathPrint-formuleweergave wordt nooit als evaluatietaal doorgegeven. Er is geen autonome evaluator of parser in de UI.

### 5.2 Keyboard, SHIFT, ALPHA en navigatie

- Numeriek toetsenbord en fysiek toetsenbord bieden identieke grammatica. Toetsen `0–9`, `+`, `-`, `*`, `/`, `^`, haakjes, Backspace, Delete, pijlen, Home/End en Enter ondersteunen voor zover de bestaande invoercontracten dit toelaten.
- **SHIFT** heeft een echte functie: secundaire toegestane keuzes, bijvoorbeeld `sin ↔ asin`, `cos ↔ acos`, `tan ↔ atan`. Actieve SHIFT-status is zichtbaar, via toetsenbord bereikbaar en wordt na één secundaire keuze opgeheven.
- **ALPHA is een toekomstig TI-ontwerpdoel, geen automatisch werkende toets.** Het huidige T5a ondersteunt geen vrije letters/variabelen. **Voorstel:** toon in T5b een duidelijke knop **Bron**, niet een misleidende algemene ALPHA-variabelenmodus. Reserveer ALPHA pas voor K2 na een apart contract. Dit is een expliciete UX-goedkeuringskeuze.
- Pijlen verplaatsen de invoercursor; navigatietoetsen en Tab volgorde zijn geverifieerd te definiëren in de component- en browseracceptatie. Geen ongeteste 2D MathPrint-cursorsemantiek claimen.
- Formuletemplates zijn alleen actief waar ze veilig naar bestaande tokens/AST normaliseren: haakjes, macht, `sqrt`, trigonometrische argumenten. Een meerregelig visueel scherm is geen tweede parser of volledig CAS.
- Kopieerresultaat wordt als aparte knop duidelijk onderscheiden van `=`/bereken. `=` evalueert; het schrijft niets naar document of clipboard.

### 5.3 Modulair en uitbreidbaar toetsenbord — besluit v1.0.1

**Doel:** T5b levert een aanpasbare invoerinterface. Het toevoegen, verplaatsen of herlabelen van toetsen mag geen herimplementatie van de rekenmotor, geen kopie van de keypadcontroller en geen wijzigingen aan document-/tekstschema's vergen. **Nieuwe wiskundige functionaliteit vereist wél** een eigen goedgekeurd contract, typed AST/evaluatie, foutregels en tests.

#### 5.3.1 Declaratief toetsenregister en dispatch

- Elke fysieke of visuele toets heeft een **stabiele technische ID** (onafhankelijk van de positie of het getoonde label), een primaire actie, een optionele secundaire `SHIFT`-actie, toegankelijke labels en een toetsgroep. De indeling (rij/kolom, responsieve groepering) is presentatieconfiguratie, niet evaluatielogica.
- Alle werkende acties verwijzen naar een **gesloten, gevalideerd actieregister**: invoer van goedgekeurde tokens, AST-compatibele sjablonen, cursor-/wisacties, een bronkiezer, evaluate, kopiëren of UI-instellingen. Geen vrije JavaScript-callbacks, code-evaluatie, willekeurige functienamen of direct documentcommando vanuit configuratie.
- **Eén dispatcher** verwerkt virtuele toetsen én fysieke toetsen. De dispatcher valideert actuele toestanden (SHIFT, focus, invoerselectie, paneelcontext en beschikbaarheid), normaliseert naar de bestaande `ExpressionAST`-invoer en geeft alleen die aan T5a door. Er komt geen tweede parser of evaluator.
- Een actie krijgt een vereiste **capability/fasemijlpaal** die overeenstemt met daadwerkelijk geïmplementeerde en geaccepteerde functionaliteit. Een gewone featureflag, configuratie- of CSS-wijziging mag een niet-ondersteunde rekenfunctie niet vrijschakelen.
- Toetsen en secundaire labels van **toekomstige** functies zijn in de normale T5b-layout afwezig of expliciet niet beschikbaar; ze mogen nooit de indruk wekken dat zij werken. Geen dode toetsen in T5b. Stabiele IDs van bestaande toetsen blijven behouden wanneer hun positie of optionele tweede functie later wijzigt.

**Conceptueel configuratievoorbeeld** (specificatie van acties, **geen** huidige T5a-API en geen productiecode):

```js
{
  id: 'sqrt',
  label: '√x',
  primary: { action: 'insertTemplate', template: 'sqrt', requires: 'T5a' },
  shift: { label: 'ⁿ√x', action: 'insertTemplate', template: 'nthRoot', requires: 'K1' }
}
```

In T5b is uitsluitend de primaire actie `sqrt` bruikbaar. De `nthRoot`-actie is **een gereserveerde conceptuele actie**, geen bestaande parserfunctie. De secundaire `ⁿ√x`-aanduiding wordt pas getoond en geactiveerd wanneer K1 daadwerkelijk is geïmplementeerd, getest en vrijgegeven. De `SHIFT`-toets blijft in T5b gewoon werken voor bestaande secundaire functies zoals `asin`, `acos` en `atan`.

#### 5.3.2 N-de machtswortel en K1-grens

- **T5b:** vierkantswortel via `√x` → de bestaande `sqrt(...)`-functie; willekeurige machten via `xʸ` → de bestaande `^`-operator. Een *positief* grondtal kan bijvoorbeeld als `27^(1/3)` worden ingevoerd. De numerieke uitkomst valt onder de bestaande binary64-regels; het is **geen** bewijs van exacte algebraïsche notatie of een algemene n-dewortelfunctie.
- **K1 (latere afzonderlijke mijlpaal):** `SHIFT + √x` activeert een n-dewortelsjabloon met **twee expliciete invulposities**, eerst wortelgraad `n`, vervolgens grondtal `x` (visueel `ⁿ√x`). De navigatietoetsen kunnen veilig tussen de twee posities bewegen, met correcte focus, toegankelijke aankondigingen en roundtrip naar een dan goedgekeurde typed AST.
- Het aparte K1-wiskundecontract moet wortelgraden, domeinen, nul, negatieve grondtallen en even/oneven `n`, dimensies/eenheden, exactheid versus benadering, overflow/underflow, formattering en grensgevallen definiëren. Bijvoorbeeld `∛(-8) = -2` is een gewenste **reële** K1-case; er mag niet worden aangenomen dat `(-8)^(1/3)` in de bestaande T5a-`^`-semantiek hetzelfde uitvoert. Er worden geen complexe resultaten of CAS-functionaliteit stilzwijgend toegevoegd.
- Als K1 niet vrijgegeven is, blijft `SHIFT + √x` **zonder n-dewortelactie**; T5b moet geen onbewezen fallback gebruiken. Een toekomstige K1-activering mag bestaande `sqrt`, `^`, operatorprecedentie en tekst-/bronrechten niet regressief wijzigen.

#### 5.3.3 Uitbreidingen en compatibiliteit

1. **Verplaatsen of herlabelen:** pas uitsluitend de layout-/labelconfiguratie aan; behoud toets-ID, actiecontract, focusvolgorde en semantiek.
2. **Bestaande functie als SHIFT-actie toevoegen:** registreer een reeds ondersteunde actie met expliciete mapping en aangepaste toetsenbord-, focus- en weergavetests; geen rekenenginewijziging.
3. **Nieuwe rekenfunctie toevoegen:** eerst een eigen wiskundig contract, getypeerde AST/parser-/evaluatieondersteuning, eenheden, beveiligings- en onafhankelijke tests; pas na acceptatie het register en de bijbehorende knop uitbreiden.
4. **Nieuwe functiegroepen/rijen:** configureerbaar zonder dubbele component; bewaak leesbaarheid, bereikbaarheid, viewportbegrenzing en natuurlijke toetsenbordnavigatie voor desktop en mobiel.
5. **ALPHA en geheugen:** blijven pas K2. Geen impliciete `Ans`, geheugenwaarde of opslag omdat hiervoor UI-plaatsen zijn gereserveerd.

**Implementatiepoort:** tijdens T5b moet Codex het toetsenregister, de actie-dispatch en de scheiding tussen layout, UI-state en rekenmotor aantoonbaar realiseren. Uitvoering van K1/K2/K3–K8, of uitbreiding van de T5a-wiskundesemantiek, valt uitdrukkelijk buiten de opdracht.

### 5.4 Invoerfouten

Toon ten minste onderscheid tussen: onvolledige formule, ongeldige bewerking, dimensiefout, domeinfout, limietoverschrijding en niet-beschikbare bron. Technische foutcodes worden naar korte Nederlandstalige berichten vertaald; **restricted** bronfouten geven één generieke tekst (`Berekening niet beschikbaar`), zonder bronidentiteit, waarde of oorzaak die rechten kan verraden. Corrigeerbare invoer blijft in de private sessie beschikbaar indien geautoriseerd.

## 6. Display, formatering en eenheden

- **T5b-standaard:** twee decimalen in documenteenheid; deze default is een voorstel en volgt de gebruikelijke WIE-documentprecisie. Kiesbare precisie `0–10` volgt de bestaande `ExpressionEngine.format`-grenzen; een beheerst UX-bereik wordt in de preview beoordeeld.
- Toon `≈` alleen waar de formatter daadwerkelijk afrondt; verwar circa-resultaat niet met bewezen exactheid. Voor volledig niet-afgeronde displays geeft de bestaande engine het passende resultaat.
- De calculator toont de geautoriseerde huidige formule en het bijbehorende resultaat; schaal wordt exact één keer toegepast bij geometrische bronwaarden, schaal² bij oppervlaktes en hoeken eenmaal geconverteerd naar radialen.
- Een `30 deg`-literal blijft 30° onafhankelijk van de gekozen calculatorinstelling. Voor `sin(30)` zonder expliciete unit bepaalt de overeengekomen DEG/RAD-evaluatieoptie de interpretatie.
- **DEG/RAD-ontwerpbesluit:** calculatorinstelling is **privé** en mag de documenthoekinstelling niet wijzigen. De huidige `ExpressionSources`-adapter leest de documenthoekmodus, zonder eigen publieke override. T5b vereist daarom een minimale, afzonderlijk te reviewen adapteruitbreiding die de privé-override expliciet doorgeeft terwijl bronautorisatie, bronrevisie en permission epoch ongewijzigd blijven; **geen tweede evaluator en geen autorisatiebypass**.
- Voor het klembord wordt het **geformatteerde zichtbare resultaat inclusief eenheid en `≈` waar toepasselijk** voorgesteld als `text/plain` (voorbeeld `≈12,57 cm²`). Geen bron-ID of formule-JSON. De keuze van het clipboardformaat is een T5b-0-reviewpunt.

## 7. Dynamische bronselectie en levenscyclus

1. **Bron** opent een binnen het calculatorpaneel blijvende, toetsenbordtoegankelijke lijst met alleen geautoriseerde, toepasselijke geometrische objecten en eigenschappen. Geen vrije objectnaamherkenning in de parser.
2. Selectie plaatst één typed bronchip op de actieve invoerpositie. Een chip is een samenhangend, niet-fragmentarisch token; voor verwijdering, navigatie en kopiëren gelden expliciete regels.
3. Een bronchip toont alleen een geautoriseerd label. De engine evalueert op een actuele model-/autorisatiesnapshot, niet vanuit het label of een cached numerieke tekst.
4. Bij geometrische wijziging volgt herberekening vanuit de nieuwe snapshot. Bij verborgen, ontbrekende, ongeldige, ingetrokken of door een andere laag ontoegankelijke bronnen verdwijnt het oude resultaat onmiddellijk; toon `Berekening niet beschikbaar`, blokkeer kopiëren en toon geen vervangende nul.
5. Tijdens `New`, import, documentwissel, sessie-einde, vernietiging van het paneel of wijziging van de permission epoch wordt de berekening ongeldig en wordt de private context gesloten of veilig gereset.
6. Een beveiligde sessie mag nooit overschakelen naar de author-bronadapter. Bronlabel, identiteiten, clipboard, foutmeldingen, ARIA, DOM en diagnostics mogen nooit afgeschermde gegevens prijsgeven.
7. **Geen persistente rekenhistorie.** Eventuele vorige berekeningen zijn private, vluchtige sessiestaat; geen import/export of opslag in document-JSON, localStorage of globale shared cache.

## 8. Paneelgedrag, toegankelijkheid en fullscreen

- De titelbalk heeft duidelijke naam en sluitknop, het sleepgebied is visueel herkenbaar, de toetsenbordroute voor paneelverplaatsing krijgt een functioneel alternatief of begrensde positieherstelactie.
- Het paneel respecteert bestaande WIE-viewport, browserzoom, canvaszoom, kleine vensterhoogte en de reeds geïntegreerde zwevende eigenschappenpanelen. Geen extra globale viewportcontroller introduceren.
- Bij grote schermen blijft de canvasillustratie zichtbaar. Op mobiel/tablet wordt het paneel als begrensde sheet met intern scrollbare toetsen bediend, zonder buiten de viewport vallende resultaten.
- Het calculatorpaneel heeft correcte toegankelijke naam, programmatische labels, live-resultaatstatus zonder overmatige aankondigingen en betrouwbare focus-terugkeer naar de initiële werkbalkactie of rich-text-invoegknop.
- `Escape` sluit in de applicatie eerst een bronkiezer/child-paneel, vervolgens de calculator, en bij inline daarna pas de teksteditor. Documentundo blijft gescheiden van private invoerundo. **Technische kanttekening:** browsers kunnen de Escape-toets reserveren voor de native Fullscreen API. Garanties over native browserfullscreen worden pas na echte Edge-browserproeven geclaimd; bij applicatiebeheerd canvasfullscreen blijft de interne sluitvolgorde leidend.
- Zonder muis: openen, alle werkende functies uitvoeren, bron selecteren, resultaat kopiëren, sluiten en focus herstellen. Visuele feedback voor actieve SHIFT, DEG/RAD, fouten en disabled state. Echte screenreader/IME-tests worden afzonderlijk gerapporteerd.

## 9. Vereiste architectuurgrenzen

1. **Rekenkern**: uitsluitend `ExpressionAST`/`ExpressionEngine`/`ExpressionNumeric`; geen eigen evaluatieregels in calculator of teksteditor.
2. **Bronnen**: bestaande `ExpressionSources` + `RuntimeSession`-autorisatie; een private DEG/RAD-optie mag nooit autorisatierevisie of `permissionEpoch` omzeilen.
3. **UI**: één herbruikbare calculatorview/controller, twee dunne hosts. In T5b wordt `∑` bereikbaar vanuit de huidige teksteditor zonder die editor inhoudelijk te muteren.
4. **Scripts**: vier bestaande T5a-modules veilig in de normale editor laden in de juiste afhankelijkheidsvolgorde; T5b voegt alleen UI-/hostmodules toe, geen dubbele evaluatorbundels. Het declaratieve toetsenregister en de gedeelde actiedispatch zijn UI-/invoercomponenten, geen extra mathematische engine.
5. **Scope**: in T5b geen document-, model-, constructionSchema-, textSchema-, regionSchema-, permissionschema- of exportformatwijzigingen. Geen `calculatedValue` op de T5b-codepaden.
6. **Review**: monitor pariteit tussen standalone en inline voor dezelfde AST, bron-/eenheidskeuzes en actueel geldige snapshot.
7. **T5c-vooruitblik**: huidige `main` kent documenten t/m v8 en rich text t/m schema 3. Ontwerp voor T5c later expliciet of textSchema 4 ook in v8 is toegestaan; controleer combinaties van regio's en berekende tekst. **Dit wordt niet geïmplementeerd als onderdeel van T5b**.

## 10. Acceptatiecriteria voor T5b (nog uit te voeren)

| ID | Controle | Verwachting |
|---|---|---|
| B-01 | Open via hoofdwerkbalk in leeg document, voer `2+3*4` in | Exact `14`; document/selectie/revisie/history ongewijzigd |
| B-02 | Open vanuit teksteditor via `∑`, dezelfde invoer | Zelfde quantity en display; rich-textdraft/bookmark bij Cancel onveranderd |
| B-03 | `sin(30 deg)` in DEG en RAD | Beide `0,5`, numerieke tolerantie conform T5a, geen documenthoekmutatie |
| B-04 | `sin(30)` met privé DEG/RAD-overrides | Privémodus wijzigt evaluatie volgens contract; documentsetting gelijk |
| B-05 | `π × r²`, r=2 cm →3 cm | Ongeveer 12,57 →28,27 cm² bij toegestane dynamische bron |
| B-06 | Bron wissen, ongeldig maken, bron herstellen via Undo | Oude resultaat onmiddellijk weg, kopiëren geweigerd, na herstel verse toegestane evaluatie |
| B-07 | Restricted read/display/property/layer/epoch-revocation | Geen bronwaarde/-naam/-ID in UI, DOM, AT, clipboard of fouttekst |
| B-08 | Resultaat kopiëren | Alleen expliciet en na verse autorisatie; geen documentmutatie |
| B-09 | Paneel verslepen, resize, zoom, fullscreen | Binnen viewport, bronkiezer en invoer toegankelijk, geen canvasactie |
| B-10 | Escape/focus/pointercancel | Child eerst, dan calculator; focusherstel; browserfullscreen-afwijkingen eerlijk rapporteren |
| B-11 | Schrijven in private calculatorhistorie; sluiten | Geen JSON/history/undo-/exportmutatie; geen persistente opslag |
| B-12 | Node-/Edge-regressie plus legacy JSON/SVG/PNG | Werkelijk uitgevoerde aantallen/logs, geen nieuwe schema-4-functies |
| B-13 | Toetsenbord, toetsenbordbronselectie, tabvolgorde, IME/ARIA | Alleen PASS met daadwerkelijk bewijs; overige expliciet open |
| B-14 | Uitgeschakelde/ongeïmplementeerde K-functies | Geen onterecht actieve knoppen of functies, geen TI-pariteitsclaim |
| B-15 | Toetsregister: toets verplaatsen, herlabelen, knopgroep herschikken | Dezelfde stabiele toets-ID/actie en T5a-uitkomst, geen nieuwe evaluator of documentmutatie |
| B-16 | SHIFT-mapping voor bestaande functies (`sin`/`asin`, `cos`/`acos`, `tan`/`atan`) | Correcte toets-/focus-/keyboardpariteit; SHIFT-reset na toegestane secundaire actie |
| B-17 | `SHIFT + √` vóór K1-activering | Geen actieve n-dewortelactie, geen zichtbaar werkend `ⁿ√x`-label, geen parserfallback of ongeautoriseerde featureflag-ontgrendeling |
| B-18 | Toekomstige K1-registry-uitbreiding (contractuele compatibiliteit, **niet implementeren**) | T5b-register heeft een expliciet extensiepunt voor `nthRoot`, zonder bestaande `sqrt`, `^`, autorisatie, layout of actiedispatch te moeten dupliceren |

**Meetmethode voor nulmutatie:** neem vóór en ná T5b-open/evaluatie/sluitstappen een snapshot van document-JSON, documentrevisie, objectaantal, selectie, historycursor, rich-textdraft en relevante semantische replaypositie. Maak een **afzonderlijke** baseline wanneer tijdens B-05 bewust een geometrisch bronobject verandert; uitsluitend dát geometriecommando mag een documentactie veroorzaken.

| B-19 | SHIFT visueel geactiveerd en gedeactiveerd | Actieve SHIFT duidelijk zichtbaar; bestaande tweede functies leesbaar op de betreffende toetsen; labels en toegankelijkheidsstatus kloppen; K1-functies blijven afwezig |
| B-20 | Numerieke toetsen en `=` in desktop-/mobiele layout | `0–9` en komma licht met donkerblauwe tekst; gelijke cijferbreedte; `=` exact één cijferknop breed |
| B-21 | Operatorgroep en functienavigatie | `×`, `÷`, `+`, `−` vormen één herkenbare groep; Functies/Bron/Eenheden/Sjablonen zijn onderling even breed, ook na responsieve herschikking |
| B-22 | Layoutconfiguratie na herschikking | Toets-IDs en dispatcheracties blijven identiek; geen regressie in focus, pointer, toetsenbordbediening, evaluatie of documentstatus |

## 11. STAB-1 — gecontroleerde startvoorwaarde (nog geen uitvoering)

**Read-only/reproduceerbare controle op actuele `main`, door Codex of lokaal:**

1. Noteer branch, HEAD, `git status`, Node-versie en geïnstalleerde browser-/Playwright-afhankelijkheden. Werk niet in een verouderde historische T5a-branch.
2. Voer `npm test` en `npm run test:edge` op de huidige samenstelling uit (na benodigde normale lokale dependencyinstallatie). Registreer aantallen PASS/FAIL/SKIP, commando's en omgeving. Indien Edge niet beschikbaar is, markeer **NIET UITGEVOERD**, niet PASS.
3. Inspecteer `editor.html`-scriptmanifest en de aanwezigheid van de T5a-bronmodules; verifieer dat ze niet reeds door andere nieuwe code worden ingeladen.
4. Controleer integratierisico's na PR #12, bestaande UI-fouten en open handmatige acceptaties, met name paneel/focus/fullscreen, texteditor en regio's.
5. Schrijf een kort STAB-1-rapport met commit-SHA, testlogs, blockers, eventuele regressies en aanbeveling **GO / NO GO** voor T5b-code. Fixes alleen na aparte toestemming; laat code in deze rapportagestap onveranderd.

**Poort:** T5b-0-ontwerpgoedkeuring **én** STAB-1-bewijs zijn vereist vóór Codex-opdracht voor T5b-productiecode. Maak daarna een nieuwe featurebranch vanaf de dan actuele en gecontroleerde `main`; geen automatische merge.

## 12. Nog expliciet te beoordelen bij de ontwerpacceptatie

1. **Paneelafmetingen/positie**: voorgestelde startbreedte 400 px, compacte zwevende interface; mobiele sheet.
2. **Toetsenmatrix**: visuele basis en groep-/breedteregels uit §3.3 zijn goedgekeurd; exacte posities, toetsenlabeling, natuurlijke sjablonen en fysieke keyboardmapping worden verder verfijnd.
3. **ALPHA en uitbreidbaarheid**: voorstel is geen werkloze ALPHA-toets in T5b; knop **Bron** voor typed bronnen, variabele ALPHA later via K2. De toetsindeling is declaratief, met stabiele toets-IDs, gesloten dispatcher, capability-gates en `SHIFT + √` als gereserveerde K1-uitbreiding (§5.3).
4. **DEG/RAD**: private adapteroverride zonder documentmutatie en zonder omzeiling van bronrechten.
5. **Resultaat kopiëren**: voorstel `text/plain` als zichtbare geformatteerde waarde met unit en `≈` indien van toepassing.
6. **Bronselectie**: eerst toegankelijk lijstpaneel met geautoriseerde keuzes; geen onbewezen canvas-pickermodus.
7. **Compatibiliteit**: T5c met regio-documenten v8 uitwerken onder eigen milestone; T5b houdt alle documentversies gelijk.
8. **STAB-1**: alleen na gecontroleerde regressiepoort toestemming om T5b-productiecode te starten.

---

## Bronverwijzingen en statusgrenzen

- [WIE — Teksteditorarchitectuur, secties 14, 22, 30 en 31](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/TEXT-EDITOR-ARCHITECTURE.md)
- [WIE — Implementatieplan teksteditor, T5b–T5d](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/TEXT-EDITOR-IMPLEMENTATION-PLAN.md)
- [WIE — Development Roadmap v2.8.7](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/DEVELOPMENT-ROADMAP.md)
- [Bestaande expression-sources.js](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/expression-sources.js), [expression-engine.js](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/expression-engine.js) en [editor.html](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/editor.html)
- [T5a-testbewijs (historisch, 12 oktober)](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/test-evidence/T5a.json)

**Wijzigingshistoriek:**
- **v1.0.0 (2026-10-15):** eerste volledige UX-/integratiecontractversie ter beoordeling; geen implementatie of testuitvoering.
- **v1.0.1 (2026-10-15):** besluit toegevoegd voor een modulair, configuratiegestuurd toetsenbord met stabiele toets-IDs, centrale dispatcher, SHIFT-acties en capability-gates; `SHIFT + √` gereserveerd voor de n-de machtswortel in K1, inclusief wiskundige scopegrens en testcriteria B-15–B-18. Geen productiecode, GitHub-commit, K1-implementatie of nieuwe testuitvoering.

- **v1.0.2 (2026-10-15):** visuele basis geaccepteerd; expliciete SHIFT-feedback, lichte cijferknoppen met donkerblauwe cijfers, aaneengesloten operatorgroep, gelijke breedte voor Functies/Bron/Eenheden/Sjablonen en `=` even breed als één cijferknop; aanvullende criteria B-19–B-22. Geen implementatie-GO.
