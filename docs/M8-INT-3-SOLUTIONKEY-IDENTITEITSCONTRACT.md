# WIE — M8-INT.3-A: Duurzame identiteit van maximaal vier snijpunten

**Documentversie:** 1.0.0  
**Datum:** 17 oktober 2026  
**Status:** technisch identiteitsvoorstel **ter afzonderlijke gebruikersgoedkeuring** — **geen productiecode-GO**  
**Repository:** [Geert1985/wiskundige-illustratie-editor](https://github.com/Geert1985/wiskundige-illustratie-editor)  
**Normatieve basis:** [M8-INT-hoofdcontract v1.1.3](M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md); [goedgekeurd M8-INT.3-hoofdontwerpcontract v1.0.1](M8-INT-3-KEGELSNEDEN-SNIJPUNTEN-ONTWERPCONTRACT.md); M8-INT.0/.1 geïntegreerd via PR #27/#28.  
**Afbakening:** dit document werkt de **open identiteitsgate M8-INT.3-A** uit. Solverimplementatie, gereedschapintegratie, schemawijziging, commit van productiecode en merge behoren nog **niet** tot deze opdracht.

---

## 0. Samenvatting en besluitpunt

Eén geometrisch snijpunt is geen vast bestaand object van de twee broncurven: het wordt berekend uit hun **huidige** stand. Bij vier, later twee, daarna opnieuw vier kruisingen kan een simpele rangorde (`branch:0..3`) een bestaande punt-ID aan een ander geometrisch punt verbinden.

Het bestaande WIE-model herberekent gekoppelde objecten **deterministisch uit hun opgeslagen recept en de huidige brongeometrie**. Het kent geen persistent traject van elke gesleepte tussenpositie. Daarom stellen we een expliciet **begrensd identiteitsmodel** voor:

> **Optie A (aanbevolen als veilige eerste implementatie): vaste, opgeslagen hoeksectoren op de eerste canonieke kegelsnede, aangevuld met een transversale oriëntatiesignatuur, een guard-band en conservatieve invalidatie.** Het `solutionKey` identificeert een **geometrische oplossingsplaats in het brongebonden referentiestelsel**, niet onder alle mogelijke verplaatsingspaden een 'materieel' worteltraject.

Dat onderscheid is essentieel: een dynamisch punt blijft alleen zichtbaar zolang de huidige configuratie zijn vaste sleutel **ondubbelzinnig** vervult. Als de koppeling niet bewijsbaar is, blijft het bestaande object bewaard maar wordt het `AMBIGUOUS_BRANCH` (of `NUMERIC_UNRESOLVED`). Het volgt **nooit stilzwijgend de op dit moment 2e/3e/4e wortel**.

Deze beperkte, stateless definitie is bewust strenger dan een onvoorwaardelijke 'volg elke mogelijke beweging'-belofte. **De gebruiker moet deze afweging afzonderlijk goedkeuren.** Wie absoluut vloeiende wortelvolging over onbeperkte bewegingen eist, heeft een ander (stateful en persistente gebeurtenisgeschiedenis bevattend) productcontract nodig; dat mag Codex niet zelfstandig invoeren.

## 1. Architectuurfeiten op huidige main

Gecontroleerd in `construction-service.js`, `index.js`, `model.js`, `ellipse-geometry.js`, `intersection-dispatcher.js` en `permission-runtime.js`:

1. `ConstructionService.definitions` bevat `circleCircleIntersection` en `lineEllipseIntersection` met `branches:[0,1]`, maar **geen** vierwortelrecept of `solutionKey`-validator.
2. `Engine.constructIntersection(kind,sources,selectedBranches)` accepteert nu uitsluitend de bestaande vier gespecialiseerde snijpuntrecepten, en evalueert maximaal branches 0 en 1.
3. `ConstructionService.evaluate/resolve` herleidt afhankelijke coördinaten uit het recept en de actuele bronnen. `IllustrationModel` controleert documenten atomair en de schrijver kent `constructionSchema:10` wanneer `lineEllipseIntersection` bestaat.
4. `EllipseGeometry.fromDefinition` levert de canonieke actuele contour en parametrisatie; vrije en geconstrueerde ellipsen gebruiken dezelfde geometrische waarheid.
5. `PermissionRuntime` controleert de gespecialiseerde tool-ID en bronrechten; `IntersectionDispatcher` normaliseert bronvolgorde. Er mag geen tweede autorisatie-, resolver- of historiepad worden geïntroduceerd.
6. De goedgekeurde UX blijft: **twee ondubbelzinnige bronnen → alle geldige oplossingen in één command → terug naar Selecteren**. Bij nul bewezen punten of onzekerheid: **geen commit, tool blijft actief**.

Dit contract introduceert alleen een **nieuw opslag- en oplossingsidentiteitsprincipe** voor de nieuwe recepten `circleEllipseIntersection` en `ellipseEllipseIntersection`. De bestaande branches en documenten veranderen **niet**.

## 2. Waarom actuele wortels sorteren onjuist is

### 2.1 Parameternaad: reproduceerbaar tegenvoorbeeld

Neem `C`: \(x^2+y^2=16\) en `E`: \(x^2/25+y^2/9=1\). De vier punten zijn

\[
(\pm5\sqrt7/4,\ \pm9/4).
\]

Op de eerste bron `C` liggen zij op hoeken \(\pm\alpha,\pi\pm\alpha\), met

\[
\alpha=\arctan\!\left(\frac{9}{5\sqrt7}\right)\approx34.2^\circ.
\]

Roteer alleen de ellips continu met bijvoorbeeld \(45^\circ\). De vier snijpunten draaien mee op de cirkel en blijven afzonderlijk; **er is geen tangentie**. Eén hoek passeert toch de grens \(0^\circ/360^\circ\), waardoor sortering op genormaliseerde hoek \([0,2\pi)\) onmiddellijk het eerste/laatste label verwisselt. Een opgeslagen rangnummer van 0–3 is dus geen duurzame identiteit.

### 2.2 Geometrisch identieke eindcontour, verschillende wortelverhalen

Bij dezelfde centrale cirkel en een niet-cirkelvormige ellips geeft een **rotatie van de ellips met \(180^\circ\)** weer exact dezelfde **geometrische contour**. De vier afzonderlijke snijpunten hebben langs het continue rotatiepad echter een halve omwenteling op de cirkel doorlopen en elkaars aanvankelijke plaatsen ingenomen. Een louter uit de **eindcontouren** afgeleide labelregel kan niet tegelijk alle langs-het-pad-identiteiten en dezelfde geometrische eindtoestand als één universeel feit reconstrueren.

Een ruwe opgeslagen ellips-rotatiewaarde kan bepaalde paden onderscheiden, maar niet alle equivalente parametreringen, bronherbindingen, foci-degeneraties of sprongen tussen opgeslagen toestanden. Daarom is 'geometrisch hetzelfde punt langs om het even welk pad' **geen onvoorwaardelijk bewijsbare stateless eis**.

### 2.3 Wat wél aangetoond kan worden

Een opgeslagen **vaste sector met aanvullende signatuur** definieert een **reproduceerbare, padonafhankelijke plaatsidentiteit**. Zij kan worden gevalideerd zonder verborgen scherm-/sleepgeschiedenis. Deze identiteit beweert niet dat hetzelfde analytische worteltraject onbeperkt gevolgd wordt.

**Acceptatiegrens:** tijdens onafgebroken ondubbelzinnige geldigheid mag het punt niet springen. Na een expliciete fase `AMBIGUOUS_BRANCH` kan een oplossing weer verschijnen op de **persistente plaatsidentiteit**; dat is geen bewijs dat de voorheen gevolgde continu-wiskundige tak dezelfde is gebleven. Deze beperking moet in producttests en gebruikersdocumentatie zichtbaar zijn.

## 3. Voorstel voor persistente `solutionKey`

### 3.1 Exacte conceptvorm

Voor ieder gecreëerd punt (dus niet op de broncurven zelf):

```json
{
  "kind": "circleEllipseIntersection",
  "sources": [
    {"objectId": "C1"},
    {"objectId": "E1"}
  ],
  "solutionKey": {
    "schema": 1,
    "familyId": "ix-42",
    "slot": 0,
    "firstFrame": "canonical-conic-v1",
    "frameKind": "circle-world",
    "anchorT": 0.0947,
    "leftReach": 0.072,
    "rightReach": 0.080,
    "guardT": 0.004,
    "crossing": "positive"
  }
}
```

**Voorbeeldgetallen zijn illustratief, geen hardcoded productieparameters.** Waarden worden tijdens de ene geautoriseerde constructietransactie volledig **deterministisch uit de gecertificeerde initiële wortels** afgeleid. Er komt geen vrije slider, instelling of zichtbare rootselector.

| Veld | Betekenis / strikte validatie |
|---|---|
| `schema` | Exact integer `1`; onbekende versies atomair afwijzen |
| `familyId` | Door de transactie toegekende unieke, onveranderlijke batchidentiteit; niet afhankelijk van een nog bestaand ander punt-ID |
| `slot` | Integer in `[0,3]`, unieke index binnen de creatiefamilie; **geen** dynamische rootrang |
| `firstFrame` | Exact `canonical-conic-v1`; definieert de parameterconventie |
| `frameKind` | Exact `circle-world` of `ellipse-local`; immutable keuze op creatietijdstip, voorkomt stilzwijgende fasewissel bij `a=b` |
| `anchorT` | Initiële genormaliseerde \(t=\theta/(2\pi)\), eindig in \([0,1)\) |
| `leftReach`, `rightReach` | Positieve, eindige cyclische reikwijdten; samen **hoogstens 1**, waarbij de waarde **exact 1 alleen voor een enkelvoudige creatie-root** is toegestaan |
| `guardT` | Positieve eindige veiligheidszone; `guardT < min(leftReach,rightReach)` |
| `crossing` | `positive`, `negative` of `tangent`; sign van de afgeleide van de tweede contourfunctie langs de positief gerichte eerste contour op creatietijdstip |

**Strikt:** geen extra onbekende velden, `NaN`/`Infinity`, negatieve sectorbreedten, afwijkende bronvolgorde, ongeldige `familyId`, dubbele `slot` binnen een batch, overlappende kernsectoren binnen een familie, gefingeerde `branch` of ongecontroleerd mixen van `branch` en `solutionKey`.

Het volledige puntobject blijft het bestaande `point`-type met berekende `x,y`, `constructionValid`, stijl en labels. `solutionKey` is een **onderdeel van `construction`**, geen vrij wijzigbaar objectveld.

### 3.2 Referentiestelsel

`firstFrame: canonical-conic-v1` betekent:

- **Eerste bron is een cirkel:** gebruik `frameKind:'circle-world'`; \(\theta=\operatorname{atan2}(y-c_y,x-c_x)\), tegen de klok in vanaf de globale positieve x-richting.
- **Eerste bron is een niet-cirkelvormige ellips:** gebruik `frameKind:'ellipse-local'`; gebruik de actuele canonieke `u/v`-asbasis uit `EllipseGeometry.fromDefinition`; voor contourpunt \(X\):
  \[
  \theta=\operatorname{atan2}\!\left(\frac{(X-C)\cdot v}{b},\frac{(X-C)\cdot u}{a}\right).
  \]
  De opgeslagen vorm van de **eerste** ellips (inclusief rotatie en bronrolvolgorde) bepaalt de framebetekenis. Verander die niet door object-ID-sortering.
- **Eerste bron is een cirkelvormige ellips \((a=b)\):** gebruik bij creatie `frameKind:'circle-world'`; neem een ondubbelzinnige, gedocumenteerde canonieke wereldgeoriënteerde fase (\(u=(1,0),v=(0,1)\)) en negeer een fysiek betekenisloze weergaverotatie. Een **overgang** van niet-cirkelvormig naar exact circulair, en omgekeerd, kan de referentiefase discontinu veranderen: bestaande keys worden daar conservatief `AMBIGUOUS_BRANCH` tot de vaste framemapping opnieuw ondubbelzinnig is.
- **Frameguard:** wanneer een opgeslagen `frameKind` niet overeenkomt met de **actuele** toestand van de eerste bron, is de key `AMBIGUOUS_BRANCH` en is geen nieuwe phase-choice toegestaan. Als de oorspronkelijke geometrische klasse terugkeert, mag de originele key zonder wijziging opnieuw worden beoordeeld.
- **Geconstrueerde ellips met samenvallende brandpunten:** wanneer de eerdere intrinsieke oriëntatie niet uit de actuele bron kan worden gereconstrueerd, **geen verzonnen voortzetting**; gebruik de equivalente ambiguïteitsstatus in plaats van een willekeurige as.

De implementatiebijlage moet de exacte grens `a≈b` versus `a=b` en de bijbehorende binaire getalcondities met onafhankelijke fixtures vastleggen. Geen ongedocumenteerde epsilon of verborgen last-frame-cache. Alle cyclische vergelijkingen gebeuren **modulo 1**; de parameternaad \(t=0/1\) is geen speciaal geometrisch punt.

### 3.3 Initieel sectorontwerp

Stel dat na volledige rootisolatie de **N unieke reële** roots bekend zijn, met \(N\in\{1,2,3,4\}\). Bereken hun georiënteerde \(t\)-waarden op de **eerste** bron, sorteer éénmalig bij creatie cyclisch en laat de resulterende `slot`-identiteit daarna **nooit meer variëren**.

Voor \(N\ge2\):
- Voor slot \(i\) is \(\Delta^-_i\) de positieve cyclische afstand van de vorige wortel naar \(t_i\), \(\Delta^+_i\) die naar de volgende wortel.
- Definieer `leftReach = Δ^-_i / 2` en `rightReach = Δ^+_i / 2`. Daarmee vormen alle creatieslots **aaneensluitende gesloten geometrische Voronoi-sectoren** rond hun initiële anchors. Een root mag een sector niet overschrijden zonder een guard-/ambiguïteitspoort te passeren.
- Definieer een conservatieve guard, bijvoorbeeld `guardT = min(Δ^-_i, Δ^+_i)/16`. De **feitelijk geldige kernsector** is \(t_i-\mathrm{leftReach}+\mathrm{guardT} < t < t_i+\mathrm{rightReach}-\mathrm{guardT}\) modulo 1. Rand- en guardpunten zijn **ambigu**, niet automatisch een andere slot.
- **Bewijsvereiste:** de gekozen guard moet groter zijn dan aantoonbare parameterisolatiefout. Bij niet-certificeerbare nauwe initiële wortels wordt de **hele creatie geweigerd** met `NUMERIC_UNRESOLVED`.

Voor \(N=1\): gebruik één geankerde sector met `leftReach=rightReach=1/2` en een kleine geconditioneerde guard rond de antipodale rand. Voor \(N=0\): geen sleutel of mutatie. Bij nieuw tangentiepunt: `crossing:'tangent'` en één sleutel, niet twee identieke slots.

**Batches:** iedere constructieactie heeft één `familyId`. Later separaat dezelfde bronparen opnieuw construeren geeft een **andere** familie; punt-/familie-identiteit wordt niet uit het geordende paar bron-ID's afgeleid. Een familie houdt de oorspronkelijke ankers ook wanneer enkele aangemaakte punten afzonderlijk worden gewist.

## 4. Deterministische evaluatie zonder bewegingshistoriek

### 4.1 Volledige roots vóór enige matching

`IntersectionDispatcher` en de nieuwe gespecialiseerde conic-solver berekenen **alle** geldige reële wortels van de huidige bronnen, met volledige root-isolatie, residu- en conditietoets. Een onbetrouwbaar aantal roots geeft `NUMERIC_UNRESOLVED` voor de **hele familie**; men mag niet het dichtstbijzijnde pixelpunt accepteren als ersatz-oplossing.

Bereken voor elke wortel:
- modelpositie \(X\) en de eerste-bronparameter \(t(X)\) modulo 1;
- geconditioneerde transversale afgeleide \(g'(t)\), met \(g(t)=F_B(X_A(t))\);
- `positive`/`negative` bij overtuigend niet-nul teken, anders `tangent` of `NUMERIC_UNRESOLVED` wanneer de tangentiestatus niet kan worden bepaald;
- bewezen uniekheid ten opzichte van de andere roots (geen dubbele geometrische kandidaat).

### 4.2 Match per opgeslagen familie, niet door wortelindex

Evaluatie is een **zuivere deterministische functie** van `{huidige bronnen, persistente keys}`. De familieleden worden uit het model getypeerd gegroepeerd op `familyId`; documentvolgorde, tijdelijke renderer-state en history mogen het resultaat niet beïnvloeden.

1. Valideer dat elke key bij dezelfde twee persistente, correct geordende bronrefs hoort en dat familieleden verschillende slots hebben.
2. Bereken de volledige rootset éénmaal per bronpaar (optioneel binnen een puur per-resolve cache).
3. Bepaal voor elke key haar **opgeslagen kernsector** op basis van `anchorT`, `leftReach`, `rightReach`, `guardT`. Een kandidaat is alleen lid van de kernsector als die met een bewezen foutmarge **strikt binnen beide grenzen** ligt.
4. Een **enkele** ruimtelijk en algebraïsch geïsoleerde huidige wortel in precies één kernsector is kandidaat voor die key. Meerdere wortels in dezelfde sector → `AMBIGUOUS_BRANCH`; geen wortel → `AMBIGUOUS_BRANCH` of bewezen `NO_REAL_INTERSECTION` wanneer er globaal geen reële roots zijn.
5. Voor een simpele wortel moet `crossing` overeenkomen met de oorspronkelijke `positive`/`negative`-signatuur. Een tekenwissel zonder aantoonbare overgang via tangentie betekent **geen match**. Voor initiële tangentie geldt §4.3.
6. Controleer globale één-op-één-toewijzing: een actuele wortel mag **niet** aan twee verschillende keys uit één familie worden toegekend. Bij dubbele claim of onbeslisbare grens krijgt **geen** van de conflicterende keys een willekeurige winnaar.
7. Alleen bij een gecertificeerde één-op-één-match wordt `constructionValid=true` en het punt naar die wortel verplaatst. Anders blijft de bestaande definitie, ID, styling en dependency-graaf bewaard en komt de expliciete redenstatus terug.

**Geen dynamische hernummering:** `slot` is **uitsluitend de creatiefamilie-index**, niet 'het huidige k-de punt'. Er worden nooit 'ontbrekende' keys in een eerder gecreëerde familie geïmproviseerd.

### 4.3 Tangentie- en mergebeleid (voorgesteld; proof-gate)

Een dubbelwortelcontact is één zichtbaar geometrisch punt. Op de dynamische herberekeningsstap:

- Een unieke, numeriek bewezen raakwortel **binnen precies één ondubbelzinnige kernsector** kan zichtbaar blijven voor die ene key, als de gespecificeerde tangent-/oriëntatievoorwaarden zijn voldaan.
- Andere familiekeys mogen niet op dezelfde contactcoördinaat worden weergegeven. Alleen als het aangetoonde combinatorische model aantoont dat zij de **samengevallen buurwortels** representeren, krijgen ze `MERGED_INTERSECTION`; anders **`AMBIGUOUS_BRANCH`**.
- Ligt het contact in een guard-band of is onbekend welke key een voortzetting heeft, dan is **ook nul zichtbare herstelde keys mogelijk**, en worden zij herstelbaar `AMBIGUOUS_BRANCH`. De **onafhankelijke nieuwe constructieactie op exact die stand** maakt wél één raakpunt aan. Dit is een **expliciete beperking tegenover de sterkere dynamische wens** uit het hoofdcontract; de gebruiker moet ze afzonderlijk accepteren of een ander identiteitsmodel kiezen.
- `crossing:'tangent'` ontstaat bij een **nieuw** raakpunt. Bij later opsplitsen naar twee simpele roots mag dit bestaande object **hoogstens één** vooraf contractueel gekozen signatuur volgen; de default van dit **voorstel** is **`positive`**, uitsluitend wanneer die wortel uniek in dezelfde kernsector ligt en de continuïteits-/residucontrole dit dekt. De andere wortel creëert geen punt. Zonder bewezen keuze blijft de tangent-key `AMBIGUOUS_BRANCH`.
- Bij volledig samenvallende broncontouren zijn alle bestaande keys `COINCIDENT_CONICS`, bij herstel worden ze opnieuw beoordeeld vanuit hun onveranderde keys.

**Geen fictieve tangentie:** contact wordt algebraïsch/residugebaseerd vastgesteld, niet door afronding op dezelfde schermpixels of door het blind klemmen van een kleine negatieve discriminant op nul.

## 5. Welke garantie wordt wel/niet gegeven?

| Gewenste eigenschap | Optie A — vaste sectorsleutel |
|---|---|
| Opnieuw openen / replay met exact hetzelfde document | **Ja**, deterministische matching zonder cache |
| Undo/Redo en identieke bron-/keydata | **Ja** |
| 0/2π-parameternaad binnen eigen sector | **Ja**, modulo-aritmetiek, geen re-sortering |
| Geen toewijzing van dezelfde actuele root aan twee keys | **Ja**, bewezen een-op-een-check |
| Geen zichtbare willekeurige wissel tijdens **onafgebroken geldige, gecertificeerde kernsectorsituatie** | **Ja**, vast lidmaatschap + signatuur |
| Beperkte bronbeweging binnen initieel geldig slot | **Ja** |
| Grote bronbeweging; eigen wortel buiten oorspronkelijke sector | **Tijdelijk ongeldig**, geen automatische 'volg de volgende root' |
| Terugkeer van de oorspronkelijke geometrische configuratie | **Ja**, dezelfde stateless slotkoppeling herstelt |
| Continue fysieke wortelidentiteit bij **alle** mogelijke verplaatsingspaden | **Nee, niet te bewijzen zonder een sterker stateful/path-contract** |
| Altijd één oorspronkelijk gekoppeld punt zichtbaar bij elke latere tangentie | **Niet gegarandeerd**; bij sectorambiguïteit conservatieve invalidatie |
| Alle nieuwe, eenduidige 1–4 punten bij een nieuwe constructie | **Ja**, na certificatie van de volledige rootset |

**Belangrijk:** `AMBIGUOUS_BRANCH` is een **status van een bestaand afhankelijk punt**, geen opdracht om het te wissen of naar een nieuwe wortel te verplaatsen. Tijdens zulke fases bestaat er geen gegarandeerde 'materiële' voortzetting. De gebruiker behoudt de mogelijkheid om een nieuwe constructie te starten op de actuele geometrie.

### 5.1 Alternatief B — onbeperkt vloeiende trajectvolging

Een ander productontwerp kan tijdens verplaatsingen incrementele gecertificeerde matching gebruiken en **persistente branch-events/continuatiegetuigen** bij bronmutaties bijhouden. Dan:
- verandert meer van het model-/command-/Undo-contract;
- worden keyhistorie en transitie-events onderdeel van het **opgeslagen document** (niet louter lokale muiscache);
- moeten undo, redo, replay, import/export en de permissieruntime die events autoriseren;
- moet ook dit model bij echte monodromie of meervoudige degeneratie een vastgelegde continuatie-/ambiguïteitsregel hebben.

**Alternatief B is niet gekozen, niet gespecificeerd en niet goedgekeurd.** Noem het alleen als bewuste vervolgkeuze wanneer Optie A bij handmatige UX-proeven te beperkend blijkt.

## 6. Samenhang met WIE-opslag, schema, autorisatie en history

### 6.1 Featuregate

Actuele `main` kan `constructionSchema:10` gebruiken voor `lineEllipseIntersection`. De **normatieve ontwerpvoorkeur** is `constructionSchema:11` wanneer ten minste één van de nieuwe .3-recepten aanwezig is; dit is **onder voorbehoud van preflight en afzonderlijke schema-GO**, geen reeds geïmplementeerde waarde.

- Schema 11 moet alle geldige eerdere recepten en schema-10-documenten kunnen lezen.
- Een document met schema 11 hoeft **niet** een lijn–ellipsrecept te bevatten; het moet minstens één nieuw `solutionKey`-recept bevatten.
- Zonder nieuwe recepten schrijven oud/nieuw identieke minimaal noodzakelijke schema's. De writer mag legacydocumenten niet ongevraagd naar 11 verhogen.
- Onbekende sleutelversie/-velden, dubbele slots, ongeldig family-/bronverband, NaN en kapotte sectoren zijn atomair af te wijzen.
- Oude readers moeten de nieuwe versies/recepten atomair weigeren, niet afhankelijke punten als vrije punten laden.
- Import van een familiedocument vereist **geen oorspronkelijke creatiegeometrie**; de opgeslagen sleutel is de identiteit en de huidige geautoriseerde geometrie bepaalt validiteit.

### 6.2 Familie-identiteit en duplicatie

- `familyId` verwijst **niet** naar een object en veroorzaakt geen verborgen dependency-edge; het is een value-key voor de bij dezelfde constructieactie gecreëerde punten.
- De ID ontstaat als onderdeel van de **staged** geautoriseerde constructieactie, op een deterministische, botsingsvrije manier volgens het bestaande model-ID-schema. Hij mag niet afhankelijk zijn van `Math.random`, datum of een lokale editor-cache als replay dezelfde documentuitkomst moet geven.
- Als een enkel punt uit een familie gewist wordt, blijven de overige sleutels geldig. Overige slots worden niet hernummerd.
- Bij duplicatie van één sleutel moet die duplicaatconstructie een eigen nieuwe `familyId` krijgen; bij atomaire duplicatie van een volledige familie mogen onderling opnieuw gekoppelde kopieën een gezamenlijk **nieuw** `familyId` krijgen. Geen families met dubbele `slot` creëren.
- Bronherbinding kan de framebetekenis veranderen: herbereken **niet stilzwijgend** de immutable `anchorT` of sector. Als de nieuwe bronnen de opgeslagen sleutel niet eenduidig ondersteunen, is de rebind te weigeren of de bestaande key herstelbaar ongeldig; een expliciete functie 'nieuwe constructie maken' is een afzonderlijke useractie.
- Een gekoppelde bron die tijdelijk `constructionValid=false` wordt, veroorzaakt `SOURCE_INVALID` downstream, zonder informatieverlies. Layers, locks, labels, stijlen en kinderen blijven behouden.

### 6.3 Beveiliging, transacties en runtime

- De concrete gespecialiseerde interne tools worden `construct:circleEllipseIntersection` en `construct:ellipseEllipseIntersection`; één zichtbare `construct:intersection` blijft de UI.
- Permissies moeten per recept en beide bronobjecten gelden bij **contextueel aanbieden, bronselectie, volledige creatie en exportprojectie**. Een `familyId` is **geen** autorisatiebewijs en mag geen restricted-bronnen verklappen.
- Volledige uitkomsten en keys worden opnieuw berekend tijdens de definitieve `construction.create`-commit. Geen clientvoorgelegde vervalste keys vertrouwen; de engine bepaalt het sleutelstel serverzijdig/binnen de trusted commando-engine.
- Rootset onbeslisbaar of bronrechten geweigerd → **geen gedeeltelijke objecten, geen Undo-item**, gereedschap blijft actief. Succes → alle keys in **één** history-transactie, terug naar `select`, selectie van alle nieuw gecreëerde punten.
- Een later ongeldig punt verschijnt niet in SVG/PNG, snap, hit, canvas of restricted JSON-projectie buiten de bestaande rechtenscope. Export houdt de vereiste schema- en familie-integriteit of weigert veilig.

## 7. Verificatiematrix voor M8-INT.3-A

**Deze zijn voorlopige ontwerpcases**, geen reeds gedraaide code-/Edge-tests. Gebruik onafhankelijke analytische referenties en bewijs-/eigenschapstests, niet dezelfde implementatieformule aan beide kanten van een assertion.

| ID | Proef | Acceptatie |
|---|---|---|
| **SKEY-001** | `C_4` met \(E:x²/25+y²/9=1\) → 4 wortels | Vier unieke keys, slots 0..3, disjuncte kernsectoren |
| **SKEY-002** | Roteer E \(45^\circ\) bij eerste bron C4 | Oude genormaliseerde-hoeksortering zou labels wisselen; nieuwe sleutel volgt uitsluitend sector-/guardcontract |
| **SKEY-003** | Rotatie \(\approx 180^\circ\) van E rond C4 | Onderscheid geometrische plaatsidentiteit van onbewijsbare globale trajectidentiteit; geen ongedocumenteerde swapgarantie |
| **SKEY-004** | Vier roots, elk een andere kernsector, zonder raakpunten | Deterministische 1:1-toewijzing en juiste `crossing`-signatuur |
| **SKEY-005** | Eén actuele root gaat een guard-band binnen | Betrokken key `AMBIGUOUS_BRANCH`; ID en bronrecept intact |
| **SKEY-006** | Meerdere roots vallen binnen één opgeslagen sector | Geen willekeurig 'dichtstbijzijnde' keuze; betrokken key ongeldig |
| **SKEY-007** | Root kruist \(\theta=0/2π\) **binnen dezelfde opgeslagen cyclische sector** | Geen labelwisseling op de parameternaad |
| **SKEY-008** | \(4\to2\to4\) terug naar initiële stand | Identieke IDs/keys, herstel na veilige matching, geen spontane nieuwe punten |
| **SKEY-009** | \(4\to3\to4\) met bewezen tangentie binnen een kernsector | Max. één zichtbare contactroot per familie, overig `MERGED_INTERSECTION` alleen wanneer bewezen |
| **SKEY-010** | \(4\to3\to4\) contact in guard-band | `AMBIGUOUS_BRANCH` toegestaan; geen willekeurige keeper |
| **SKEY-011** | \(4\to1\to4\) meervoudig contact | Nooit onvoorwaardelijk alle vier herstelbaar; expliciete ambiguity-status waar nodig |
| **SKEY-012** | Nieuwe constructie op exact tangentcontact | Eén key en één punt; geen duplicate keys |
| **SKEY-013** | Eén tangent-key gevolgd door twee gescheiden roots | Hoogstens contractuele `positive`-voortzetting, anders `AMBIGUOUS_BRANCH`; geen extra nieuw punt |
| **SKEY-014** | Cirkel–ellips bronvolgorde omgekeerd in UI | Opgeslagen `[circle,ellipse]`, eerste-frame = cirkel |
| **SKEY-015** | Ellips–ellips met omgekeerde gebruikersbronvolgorde | Volgorde blijft bewaard binnen nieuwe recepten; geen herschrijven van oude branches |
| **SKEY-016** | Construeerde ellips degeneratief en terug | `SOURCE_INVALID`, key/IDs blijven, herstel zonder verborgen frame-cache |
| **SKEY-017** | Ellips wordt exact cirkelvormig of krijgt onbepaalde intrinsieke oriëntatie | `frameKind`-guard: geen impliciete fasewissel; conservatieve status en reproduceerbare heropening |
| **SKEY-018** | Writer + import van uitsluitend nieuw conic-conic-recept | Nieuwe featuregate zonder verplichte `lineEllipseIntersection`; pure roundtrip |
| **SKEY-019** | Gemengd document met schema-10-lijn–ellips, matchAB en conic-conic | Correct minimaal schema, oude recipes/branches ongewijzigd |
| **SKEY-020** | Corrupt/duplicate key, verkeerde familie/slot/sector, onbekende versie | Atomaire weigering; bestaande model onveranderd |
| **SKEY-021** | Dezelfde keys met omgekeerde documentobjectvolgorde | Identieke evaluatie en zichtbare resultaten |
| **SKEY-022** | Individuele sleutel wissen, kopiëren, herbind en Undo/Redo | Geen sleutelhernummering, nieuwe family-id waar nodig |
| **SKEY-023** | Restricted ellips/cirkel, ongeautoriseerde `construction.create` | Geen tool/command/exportlekkage |
| **SKEY-024** | Onzekerheid in rootisolatie, nauwkeurige bijna-tangent | `NUMERIC_UNRESOLVED` en geen gedeeltelijke nieuwe familie |
| **SKEY-025** | Nieuwe/legacy snijpuntrecepten in één document, heropenen/replay | `circleCircleIntersection` 0/1, `lineEllipseIntersection` 0/1 blijven exact historisch |
| **SKEY-026** | Ononderbroken rotatie waarbij twee wortels na guardpassage posities wisselen | Eerst expliciete invalidatie, nooit een ongekwalificeerde geldige handover |
| **SKEY-027** | Eén bronobject verborgen, beide bronobjecten gelockt, laag verborgen | Bestaande zichtbaarheids-/permissionsemantiek, géén ongeautoriseerde bronselectie |
| **SKEY-028** | Zelfde opgeslagen document + bronnen na import en na Undo/Redo | Dezelfde punten of dezelfde reasoncodes, onafhankelijk van sessiehistory |

### Verplichte formele bewijsverplichtingen voor de Codex-preflight

1. **Wiskundig tegenvoorbeeld** voor hoekindex-sortering, inclusief getalsmatige C4/E45°-fixture en aantoonbaar vier eenvoudige roots vóór/na naadpassage.
2. **Sectoren-invariant:** kerngrenzen van verschillende slots uit dezelfde creatiefamilie zijn disjunct; een huidige root kan niet gelijktijdig door twee geldige kernen worden geclaimd.
3. **Padonafhankelijke determinisme:** gelijke brondefinities en keys leveren dezelfde mapping en statuses (onder dezelfde numerieke afrondingsconventie).
4. **Geen ongecertificeerde wortel:** solver garandeert volledigheid en scheidt bewezen nultal van numerieke onbeslisbaarheid.
5. **Begrensde garantie expliciet:** lever een tegenvoorbeeld waar voortzetting van een fysieke wortel buiten de oorspronkelijke sector valt. De implementatie mag die gebeurtenis niet verhullen als 'sleutel blijft globaal fysiek dezelfde wortel'.
6. **Transversaalteken:** bewijs dat een niet-nul \(g'(t)\)-teken lokaal behouden blijft langs een eenvoudige worteltak zolang geen tangentie of relevante frame-/rolsingulariteit passeert.
7. **Stateful-alternatief:** motiveer waarom een onbeperkte voortzettingsgarantie andere persistente/transactionele informatie vereist, en maak dit niet stilzwijgend onderdeel van Optie A.

## 8. Implementatiepoort, versies en uitvoer

De technische **M8-INT.3-A-voorbereiding** kan later een aparte Codex-opdracht krijgen voor:
- actuele branch/HEAD en preflight tegen `AGENTS.md`, `ConstructionService`, `Engine`, `model.js`, `EllipseGeometry`, `RuntimeSession`, dispatcher, UI en browserrunner;
- read-only bewijs-/counterexampleprototypes en onafhankelijke fixturedata **zonder productiemutaties**;
- finale, geteste numerieke guard-/sector- en tangentietoewijzingsregels;
- voorstel voor exact `constructionSchema:11` en family-validation, inclusief formele deserialisatiegates;
- risicoanalyse van de **bewust beperkte** continue-volgsemantiek.

Pas **na** expliciete goedkeuring van deze identiteitskeuze en proof-gate mogen aparte opdrachten voor M8-INT.3-B (cirkel–ellips), M8-INT.3-C (ellips–ellips) en M8-INT.3-D (acceptatie/merge) worden uitgegeven.

**Huidige status:** `docs/M8-INT-3-KEGELSNEDEN-SNIJPUNTEN-ONTWERPCONTRACT.md` is door de gebruiker goedgekeurd. **Dit afzonderlijke M8-INT.3-A-identiteitscontract v1.0.0 is nog uitsluitend een ontwerpvoorstel.** De voorgestelde beperkte slot-identiteit, `solutionKey`-velden, tangent-uitzondering en schema 11 zijn **niet** stilzwijgend reeds geaccepteerd.

---

**Einde M8-INT.3-A solutionKey-identiteitscontract v1.0.0 — ter afzonderlijke goedkeuring; geen productiecode-GO.**
