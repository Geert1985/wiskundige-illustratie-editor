# WIE — M-PATH.0: Universeel Punt op object

**Documenttype:** normatief ontwerp- en implementatiecontract  
**Contract-ID:** WIE-M-PATH.0  
**Versie:** 1.0.1  
**Datum:** 17 oktober 2026  
**Status:** technisch verduidelijkt na preflight-NO-GO; **nog geen GO voor productiecode**  
**Roadmapreferentie:** `docs/DEVELOPMENT-ROADMAP.md`, M-PATH.0 in de actuele roadmap (v2.8.35 bij deze wijziging)  
**Preflightreferentie:** `docs/M-PATH-0-PREFLIGHT-REPORT.md` op `codex/m-path-0-preflight` (17 oktober 2026; onderzocht `main` op `6f66082c06b50b2b57077f410ecd55f56cdb9ad8`)  
**Eerste gecontroleerde uitgangsbasis:** `main`, mergecommit `9fba519a02d34a29c18158b3277c4e2b49f5cbb3` (16 oktober 2026)  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Reikwijdte:** uitsluitend M-PATH.0; M-PATH.1–3 zijn geen impliciete opdracht.

> **Kernbesluit.** `Punt op object` is één **gebruikersgereedschap** dat, afhankelijk van de gekozen geometrische drager, een van de **bestaande persistente constructierecepten** `pointOnSegment`, `pointOnCircle` of `pointOnEllipse` uitvoert. `pointOnObject` wordt **niet** een nieuw opgeslagen `construction.kind`. Voor veelhoeken geldt **optie A**: het punt is gekoppeld aan precies één geselecteerde zijde en mag tijdens slepen niet naar een andere zijde overspringen.

---

## 1. Doel, besluitvorming en begrenzing

### 1.1 Doel

De gebruiker heeft onder **Constructies → Puntconstructies** één gereedschap **Punt op object**. Hij of zij selecteert een bestaande geschikte geometrische drager, ziet een geprojecteerde puntpositie en bevestigt één dynamisch afhankelijk punt. De editor verzorgt herkenning, bronreferentie, passende projectie, plaatsing en verdere aanpassingen via de bestaande constructiearchitectuur.

### 1.2 Reeds vastgelegde productbesluiten

1. Eén herkenbare gereedschapsingang; de onderliggende mathematische constructies mogen gespecialiseerd blijven.
2. Bij veelhoeken volgt het punt **één expliciet gekozen randsegment**: optie A.
3. Het **gevulde binnengebied** van een driehoek/vierkant/veelhoek is géén drager voor M-PATH.0; eventueel `Punt in gebied` behoort tot een ander contract.
4. De aparte menu-ingangen voor punt-op-cirkel, punt-op-ellips en eventueel punt-op-lijnstuk verdwijnen **pas na bewezen functiepariteit, regressietests én gebruikersacceptatie**.
5. Oude documenten, bestaande recepten en de gebruikte `ConstructionService` blijven werken.

### 1.3 Wel binnen M-PATH.0

- Gewoon lijnstuk (`type: 'line'`): de gesloten drager tussen begin- en eindpunt.
- Expliciet geselecteerde zijde van `type: 'polygon'`, inclusief driehoeken, vierkanten, rechthoeken, parallellogrammen en andere geldige veelhoeken; **geen impliciete schakeling tussen zijden**.
- Omgevingsrand van een `circle` met strikt positieve straal.
- Contour van een geldige `ellipse`, zowel zelfstandig als gekoppeld aan brandpunten en eventueel besturingspunt Q.
- Eén gedeelde selectie-, preview-, bevestigings- en drag-UX, in sidebar én de bestaande contextuele constructiebediening.
- Ondersteuning voor bestaand model, commando's, afhankelijkheden, permissies, historie, JSON, SVG/PNG en gereedschapscatalogus.

**Compatibiliteitsnoot:** de huidige bronrol `segment` accepteert technisch óók `vector` en `dimension`. Hun bestaande recepten blijven intact, maar M-PATH.0 verplicht niet tot het publiek aanbieden van deze twee extra dragers. Codex inventariseert tijdens de preflight hun bestaande gebruikersgedrag; ondersteuning toevoegen is pas toegestaan na expliciete scope-afweging zonder nieuwe geometrie- of schemaregels. Rechte en halfrechte blijven onverkort M-PATH.1.

### 1.4 Uitdrukkelijk buiten scope

Een punt in een gevuld gebied; punt op de volledige veelhoekomtrek met zijdeovergang; rechten/halfrechten; nieuwe parabolen, hyperbolen, Bézierpaden, functiegrafieken en willekeurige krommen; vrije snijpuntconstructies (M8-INT); distributies van meerdere punten (`distributedPointOnCircle`); een nieuwe algemene constraint solver; globale herbouw van de canvasinteractie, permissielaag of modelarchitectuur.

## 2. Gecontroleerde bestaande architectuur

De code op de gecontroleerde `main` bevat:

- `construction-service.js`: de drie recepten en `pathKind`, `normaliseParameter`, `projectParameter`, `referencesForRole`, `contextualPlans`, `evaluate`, `resolve`, bronvalidatie en de afhankelijkheidsgraaf.
- `ellipse-geometry.js`: `fromDefinition`, `pointAt` en de afstandsgebaseerde `nearest`-projectie voor een ellips.
- `polygon-geometry.js`: veelhoekvalidatie en randsegmenten.
- `editor.js`: `constructionClick`, `startContextConstruction`, de padpunt-drag, de bestaande contourplaatsing en specifieke ellipspreview.
- `tool-catalog.js` en `editor.html`: uit de zichtbare gereedschappen afgeleide catalogus en afzonderlijke knoppen voor onder andere `construct:pointOnCircle` en `construct:pointOnEllipse`.
- `index.js`: `Engine.construct` als bestaande constructiefaçade.
- `AGENTS.md`, `CONSTRUCTIONS.md`, `docs/UI-RADIAL-9-CONTRACT-DRIVEN.md`: respectievelijk implementatieregels, afhankelijkheidscontract en contextuele bronplannen.

**Geconstateerde integratiekloof:** een naïeve zichtbare tool-ID `construct:pointOnObject` zou in de huidige `editor.js` via `tool.slice(10)` ten onrechte als een **bestaande constructiesoort** worden behandeld. De universele UI vereist daarom een expliciete, kleine **dispatchadapter** vóór het aanroepen van een bestaand concreet `construction.kind`. Dezelfde adapter moet sidebar, radial, bronselectie, preview, autorisatie en commit bedienen. Ook de bestaande ellips-specifieke preview- en plaatsingsvertakkingen moeten op het gedeelde gedrag aansluiten; hun wiskundige projectie wordt hergebruikt, niet opnieuw geïmplementeerd.

**Code versus contract:** dit document schrijft het doelgedrag voor. Vóór wijziging van productiecode moet een nieuwe **read-only preflight** eventuele afwijkingen ten opzichte van de dan actuele branch opnieuw vaststellen. Een afwijking is geen toestemming voor een bredere refactor.

## 3. Functionele gebruikersinteractie

### 3.1 Normaal plaatsingsverloop

1. Activeer **Constructies → Puntconstructies → Punt op object**.
2. Wijs een **geschikte zichtbare drager of ondubbelzinnig gekozen veelhoekzijde** aan. Er wordt nog geen punt opgeslagen.
3. De editor legt de bronreferentie voor deze interactie vast, toont welke bron actief is en geeft een **live preview** van de dichtstbijzijnde toegestane positie op die drager.
4. Bevestig met een klik op of **binnen de geldige plaatsingstolerantie van de drager**. Exact één nieuw `point`-object wordt via `construction.create` aangemaakt in **één geschiedenisactie**.
5. De gekoppelde puntpositie blijft op dezelfde drager wanneer de bronnen wijzigen. Daarna geldt weer de normale selectiegereedschap-/editorgedragsregel; geen automatisch tweede punt aanmaken zonder nieuwe gebruikersactie.

De voorgestelde tweestapsinteractie (bronkeuze → plaatsingsklik) is voor alle vier dragers gelijk, ongeacht eventuele bestaande snelkoppelingen van oude gereedschappen. Snellere plaatsing kan later afzonderlijk worden ontworpen, maar mag deze semantiek niet veranderen.

### 3.2 Preview, hitselectie en ambiguïteit

- De gebruiker moet vóór bevestiging kunnen zien **welke drager** gebruikt wordt en **waar** het punt terechtkomt. Highlight enkel de geselecteerde polygonzijde, niet noodzakelijk de hele veelhoek.
- Vergelijk plaatsingsafstand in **CSS-schermpixels**, niet in wiskundige model-eenheden. Gebruik als uitgangspunt de bestaande **12 CSS-px contourtolerantie**; introduceer geen afwijkende hardcoded waarde per objectsoort. Hergebruik `CoordinateTransform` en de bestaande snap-/hitsemantiek.
- Vulling of nabijheid van een veelhoekinterieur op zichzelf is geen geldige contourhit. Een klik vlak bij de rand mag wel naar die rand worden geprojecteerd wanneer de contour daadwerkelijk binnen de tolerantie ligt.
- Op een gedeeld hoekpunt kunnen twee zijden even dichtbij zijn. Kies niet onzichtbaar een willekeurige zijde: gebruik een expliciet bekende geselecteerde edge/hoverhit, vraag een ondubbelzinnige nadere randklik of bied een zichtbare keuze. De tie-break wordt in de preflight tegen de bestaande selectievolgorde bepaald en getest.
- Wanneer meerdere verschillende objecten precies dezelfde contour bedekken, moet de gehanteerde selectie voorspelbaar en zichtbaar zijn; geen stilzwijgende bronwisseling tussen preview en commit.
- Een bron die ontbreekt, ontoegankelijk, verborgen voor de rol of constructief ongeldig is, mag niet als plaatsingsbron worden geaccepteerd.
- Onduidelijke of niet-ondersteunde selecties geven een begrijpelijke statusmelding en **geen wijziging** in document of historie.

### 3.3 Bewerken van een bestaand gekoppeld punt

- In **Selecteren** kan een niet-vergrendeld gekoppeld punt worden gesleept: wijzig **uitsluitend `construction.parameter`** via het bestaande getypeerde commando, niet `x/y` en niet de bronvorm.
- De pointerpositie wordt tijdens het slepen opnieuw op de **oorspronkelijke bronreferentie** geprojecteerd; zoom en pan wijzigen de opgeslagen parameter niet.
- Een lijnstuk en een veelhoekzijde klemmen het punt op beide eindpunten vast; geen overschrijding van `t∈[0,1]` en geen sprong naar een aangrenzende zijde.
- Op cirkel en ellips loopt de genormaliseerde parameter periodiek rond. De naad `0 ≡ 1` mag geen zichtbaar contourgat, dubbele geometrie of ongeldige opslag veroorzaken.
- `pointerup` bevestigt het laatste geldige resultaat als **één** Undo-stap; Escape, `pointercancel`, annulering, verlies van focus, nieuwe tekening en disposal gebruiken de bestaande rollback-/cancelregels. Een mislukte commit laat geen gedeeltelijke creatie achter.
- Een vergrendeld doelpunt is niet versleepbaar. Vergrendelde bronobjecten mogen volgens het bestaande model wél als onveranderbare bron fungeren voor berekening; lock is niet hetzelfde als een bronleesverbod.
- Bestaande zelfstandige en gekoppelde label-, stijl- en zichtbaarheidsinstellingen blijven geldig.

### 3.4 Sidebar en contextueel radiaalmenu

De **éne zichtbare tool** staat in *Constructies → Puntconstructies*. Alle zichtbare gereedschapssurfaces komen uit dezelfde `ToolCatalog`. Bij rechtsklikken op een geschikte contour moet het radiaalmenu **Punt op object** als normale contextuele constructie aanbieden, mits bronkeuze en rechten daadwerkelijk geldig zijn. `EditorApp.startContextConstruction(toolId, objectId, planKey)` blijft de enige startadapter voor contextuele constructies; er komt geen `startPointFromCircle`, `startPointFromEllipse` of vergelijkbare parallelle starter.

Voor polygonen is een **getypeerde onderdeelreferentie** verplicht: een rechtsklik op het polygoninterieur mag niet impliciet zijde `0` kiezen. De bestaande `contextualPlans(..., partRef)`-voorziening moet voor dit doel worden hergebruikt of centraal, getypeerd worden aangevuld. Het radiaalmenu krijgt **geen afzonderlijke objecttype-whitelist**. Het huidige zesdelige radiaalwiel, de zwevende eigenschappenpanelen en fullscreen blijven behouden.

## 4. Wiskundig contract

Alle berekeningen gebeuren in modelcoördinaten; het scherm levert enkel invoer, afstandstoleranties en weergave. Bewaar de bestaande gelijke x/y-schaal, finite- en coördinatielimietregels.

### 4.1 Lijnstuk en vaste veelhoekzijde

Voor `A=(Ax,Ay)`, `B=(Bx,By)`, `d=B−A` en parameter `t`:

`P(t) = A + t(B−A)`, met `t ∈ [0,1]`.

De Euclidisch dichtstbijzijnde puntprojectie van pointerpositie `Q` is:

`t = clamp(((Q−A)·d)/(d·d), 0, 1)`.

Een zijde van een veelhoek met `n` hoekpunten gebruikt `A=vertices[i]`, `B=vertices[(i+1) mod n]`, waarbij `i` de expliciet geselecteerde en opgeslagen **edge-index** is. Voor `|d|` onder de bestaande tolerantie voor een gedegenereerd segment (huidige resolver: ongeveer `1e−9` model-eenheden) is de constructie tijdelijk ongeldig; vermijd deling door nul, pseudo-endpoints en niet-eindige waarden.

### 4.2 Cirkel

Voor `C=(cx,cy)`, straal `r>0`, `p ∈ [0,1)` en `θ=2πp`:

`P(p) = (cx + r cos θ, cy + r sin θ)`.

Projectie op de cirkelcontour bepaalt de hoek van `Q−C`, niet een oppervlakteparameter. Indien `Q=C` is de hoek onbepaald: plaats niet op basis van toevallige floating-point-artefacten. Gebruik de normale contourafstand om een centrale klik af te wijzen, of kies bij expliciet toegelaten randplaatsing een **gedocumenteerde deterministische** nulrichting. De bestaande parameter-normalisatie (`1 → 0`) en positieve-straalregel blijven geldig.

### 4.3 Ellips

Gebruik de door `EllipseGeometry.fromDefinition` opgeloste ellips met centrum `C`, halve assen `a ≥ b > 0` en een orthonormale basis `u, v`. Voor `p ∈ [0,1)`:

`P(p) = C + a cos(2πp) u + b sin(2πp) v`.

`p` is de **genormaliseerde elliptische parameter**, niet de poolhoek, niet de booglengtefractie. De projectie van een muispositie gebruikt de bestaande `EllipseGeometry.nearest` met de werkelijke kortste afstand in de relevante schermmetriek; enkel `atan2(y−cy, x−cx)` is onjuist voor een algemene ellips. Meerduidige minima en de cirkelvormige ellips bij samenvallende brandpunten worden deterministisch behandeld. Behoud de bestaande limieten voor iteraties, finite-waarden en numerieke degeneratie.

### 4.4 Parameterinvariant en herstel

De canonieke opgeslagen parameter wordt bij **bronverplaatsing niet opnieuw berekend**; alleen de afgeleide puntcoördinaten worden opnieuw geëvalueerd. Bij een ongeldig geworden bron bewaart de constructie zijn ID, `sources` en parameter, wordt zij `constructionValid:false` en verdwijnt zij uit zichtbare/geautoriseerde geometrische interacties overeenkomstig bestaand beleid. Na herstel van de bron volgt automatische herberekening met dezelfde parameter. Er is geen zelfherstellende koppeling naar een alternatief object of een andere veelhoekzijde.

## 5. Bronidentiteit en topologie (optie A) — verduidelijkt in v1.0.1

### 5.1 Canonieke identiteit: een geïndexeerde zijde

De persistent opgeslagen referentie voor een punt op de zijde van een veelhoek luidt:

```json
{"objectId":"V1","part":"edge","index":1}
```

Voor een veelhoek met `n` in volgorde opgeslagen hoekpunten `V[0] … V[n−1]` is **zijde `i` op elk evaluatiemoment** het geordende lijnstuk van `V[i]` naar `V[(i+1) mod n]`. Het afhankelijke punt heeft de bestaande `pointOnSegment`-parameter `t ∈ [0,1]` en wordt berekend als:

```text
A = V[i]
B = V[(i + 1) mod n]
P(t) = A + t * (B - A)
```

**Contractuele identiteit = `(objectId, edge-index i, paramater t)`, niet de ruimtelijke locatie of een geometrisch herkende “oorspronkelijke rand”.** Tijdens gewone vervorming blijven `objectId`, `i` en `t` behouden. De actuele coördinaten van `A`, `B` en `P` mogen veranderen. Puntdrag verandert uitsluitend `t`, nooit `i`; bij de eindpunten wordt `t` geklemd.

Deze betekenis geldt identiek voor vrije driehoeken, vierhoeken en veelhoeken én voor toegestane berekende polygonen (bijvoorbeeld dynamisch bepaalde parallellogrammen), voor zover de bestaande bron- en topologyvalidatie hun geëvalueerde vertices beschikbaar stelt.

### 5.2 Onderscheid: vervorming, herordening en bronvervanging

| Bewerking | Betekenis in M-PATH.0 | Vereist gedrag |
|---|---|---|
| Een of meer `V[i].x/y` wijzigen via bestaande vertexdrag/eigenschappen | **Geometrische vervorming bij vaste indexidentiteit** | Toegestaan indien bestaande validatie/rechten dit toestaan; gekoppeld punt herberekenen met dezelfde `i` en `t`. |
| Translatie, rotatie, schaling of constructiegedreven wijziging die vertices bij hun indices bijwerkt | **Geometrische vervorming** | Bestaande bron- en afhankelijkheidsregels behouden, geen extra topologiebeperking. |
| `vertices` vervangen door een geldige array **van gelijke lengte** via een bestaand generiek updatepad, zonder expliciet herordeningscommando | **Geïndexeerde coördinatenupdate** | Interpreteer elk array-element als de nieuwe positie van **dezelfde index**. Geen heuristische detectie of remapping. |
| Bestaande vertexvolgorde expliciet permuteren/zijde-indices hernummeren als afzonderlijke gebruikersactie | **Topologische herordening** | **Niet aangeboden in M-PATH.0**. Indien al een expliciete route bestaat: bij afhankelijke vertex-/edge-referenties atomair weigeren tenzij alle betrokken referenties aantoonbaar correct worden herleid. |
| Aantal vertices wijzigen | **Topologische structuurwijziging** | Bestaande `ConstructionService.validateUpdate`-bescherming en documentvalidatie blijven gelden; niet versoepelen. |
| Bronobject verwijderen, door andere ID vervangen of volledige documentimport | **Verwijderen/vervangen/inlezen**, geen geometrische vervorming van dezelfde bron | Bestaande cascade-, ID-, import-, validatie- en autorisatieregels blijven gelden; geen automatische visuele rebind. |

Een **kale `vertices`-array bevat geen bewerkingsintentie**. Het systeem kan niet wiskundig betrouwbaar afleiden of een gebruiker bewust een lijst heeft gepermuteerd of de hoekpunten alleen naar nieuwe coördinaten heeft verplaatst. In M-PATH.0 geldt daarom de ondubbelzinnige API-conventie: **gelijke index betekent dezelfde geïndexeerde vertexpositie binnen het object**. Een generieke coördinatenupdate wordt niet wegens een vermoede herordening geblokkeerd.

Dat is een bewuste grens: wanneer een externe caller bijvoorbeeld de vier hoekpuntcoördinaten in omgekeerde lijstvolgorde aanlevert, blijven opgeslagen referenties naar de **nieuwe inhoud op dezelfde indices** wijzen. M-PATH.0 kan daarbij niet bewijzen dat een fysieke rand zijn vroegere identiteit behoudt. Een garantie voor semantisch dezelfde *materiële* rand bij willekeurige herschikkingen vereist een **apart, expliciet topologie-/vertex-identiteitscontract** en valt buiten dit traject.

### 5.3 Geen nieuw topologiemodel voor M-PATH.0

1. **Geen** nieuwe persistente vertex-ID's, edge-ID's, indexmapping, heuristische nearest-edge-remap, constructierecepten of document-/schemasprong invoeren.
2. **Geen** algemene blokkade van `object.update({vertices})`, `object.setGeometry`, `object.setProperties`, `object.patchBatch` of bestaande vertex-/groepsbewerkingen uitsluitend omdat er een afhankelijk `edge`-punt bestaat.
3. **Geen** nieuwe, zichtbare functie *Hoekpunten herordenen* maken binnen M-PATH.0. Indien er op actuele `main` al een expliciete herordeningsactie aanwezig blijkt, moet Codex haar identificeren en aantonen dat deze niet stilzwijgend een bestaande edge- of vertexreferentie omlegt; zo nodig is alleen een gerichte command-guard toegelaten.
4. **Geen** nieuwe model- of UI-mutatie plaatsen buiten de bestaande model-, command-, autorisatie- en historypaden.
5. Gekoppelde, berekende polygonen mogen hun vertices overeenkomstig hun bestaande constructierecept opnieuw berekenen. M-PATH.0 eist geen kunstmatig bewerkbaar `vertices`-veld voor zo'n polygon.
6. Bestaande validatie van zelfdoorsnijdingen, degeneratie, vertex-aantal, dependencies, locks en rechten behoudt voorrang. Deze verduidelijking legaliseert **geen** anders ongeldige veelhoek.

### 5.4 Voorbeeld en expliciete grensgevallen

Vierhoek `V1` heeft aanvankelijk `V=[(0,0),(4,0),(4,3),(0,3)]`. Voor `edge:1` en `t=0.25` volgt `P=(4,0.75)`. Na een gewone indexgebonden update naar `V[1]=(5,0)` en `V[2]=(6,3)` wordt `P=(5.25,0.75)`, met **ongewijzigde** referentie `{objectId:'V1',part:'edge',index:1}` en `t=0.25`.

Bij dragging van P voorbij `V[2]` blijft `edge:1` vast en klemt `t` tot 1. Bij een tijdelijk ongeldige bron blijft het recept bestaan, wordt `constructionValid:false` overeenkomstig het bestaande model en volgt bij herstel herberekening op dezelfde index.

Bij een expliciete permutatie die de logische volgorde van vertices wil veranderen, is **geen stilzwijgende automatische remap** toegestaan. Dit is géén bewerkingsmogelijkheid van M-PATH.0; de toekomstige topologieoperatie beslist vooraf tussen veilig weigeren en volledige atomaire referentiemigratie.

### 5.5 Verplichte gerichte hercontrole na het NO-GO (M-PATH.0-P2)

De read-only preflight van 17 oktober 2026 gaf **NO-GO** omdat het oude contract een onderscheid naar *bedoeling* vereiste dat het model niet kon waarnemen. Dit amendement maakt dat onderscheid **operationeel** (geïndexeerde update versus expliciet topologiecommando), zonder nieuwe engine.

Codex voert vóór een implementatie-GO een **gerichte, read-only P2-hercontrole** uit van alle polygonmutatiepaden in de dan actuele `main`:

- `model.update` en `ConstructionService.validateUpdate`; `vertices`-validatie, projectie en resolve.
- `editor.js` vertexdrag, polygontranslatie, eigenschappen-/batchupdates en historiek.
- `permission-runtime.js` geometrie-/properties-/patchBatch-commando's en autorisatie.
- Import, documentvervanging, duplicate/detach, groepstransacties en constructiegestuurde polygonen.
- Eventuele **feitelijk bestaande** functie die indices herordent (onderscheiden van louter coördinaten veranderen).

**Uitkomst per pad:** classificeer `indexgebonden vervorming`, `expliciete herordening`, `bronvervanging` of `geen polygonmutatie`; noteer concreet bestand/functie, bestaande bescherming, maximaal benodigde gerichte maatregel en test. Controleer in het bijzonder of een bestaand pad onzichtbaar **indices permuteert** zonder expliciete topologie-intentie. Een vastgestelde verborgen herschikking is opnieuw een **gerichte NO-GO**, totdat de specifieke route gecorrigeerd of apart gecontracteerd is. Een hypothetisch denkbare, nog niet aangeboden herordeningsfunctie is **geen** reden voor een nieuwe brede blokkering.

**P2-gate:** een positief rapport sluit alleen dit topologische ontwerpvraagstuk. P2 geeft **niet automatisch** productiecode-GO: gebruiker beslist daarna afzonderlijk over M-PATH.0-I. Bij een materiële afwijking van deze vereenvoudigde indexsemantiek eerst een gericht amendement, geen stille implementatie.

## 6. Technisch integratiecontract

### 6.1 Eén UI-dispatch, drie persistente recepten

De centrale adapter vertaalt een geldig getypeerd selectieresultaat naar exact één bestaand recept:

| Gekozen bron | Opgeslagen `construction.kind` | `sources[0]` | Parameterdomein |
|---|---|---|---|
| Lijnstuk (`line`) | `pointOnSegment` | `{objectId}` | `[0,1]` |
| Veelhoekzijde | `pointOnSegment` | `{objectId,part:'edge',index:i}` | `[0,1]` |
| Cirkelcontour | `pointOnCircle` | `{objectId}` | `[0,1)` |
| Ellipscontour | `pointOnEllipse` | `{objectId}` | `[0,1)` |

**Voorgestelde zichtbare tool-ID:** `construct:pointOnObject` als **UI-alias**, uitdrukkelijk **geen** contract voor `ConstructionService.contract('pointOnObject')` en geen nieuwe `construction.create`-receptsoort. Codex valideert tijdens de preflight de feitelijke ToolCatalog-/commandToolId-/permissie-integratie, omdat die ID met de huidige `construct:`-dispatch zou botsen. Alternatieve interne aliasnamen zijn toegestaan als de zichtbare naam, één-tool-semantiek en bestaande persistente recepten behouden blijven; leg een eventuele definitieve keuze vast vóór productiecode.

**Pseudo-algoritme (contractueel, geen letterlijk productiecode-API):**

```text
startPointOnObject(sourceHit):
  assert selectable, visible, source-authorized and unambiguous
  concreteKind, concreteReference := classifyTypedCarrier(sourceHit)
  assert concreteKind is one of existing path kinds
  assert toolAllowed(concreteKind) and source capability for concreteKind
  stage { concreteKind, concreteReference } without document mutation

onPointerPreview(pointer):
  candidate := projectOnCarrier(concreteKind, concreteReference, pointer)
  show candidate only if finite, valid, accessible and within contour tolerance

onConfirm(pointer):
  revalidate source, concrete tool grant, dependency rules and projection
  execute existing construction.create({
    toolId: 'construct:' + concreteKind,
    sources: [concreteReference],
    parameter: candidate.parameter
  }) as one history transaction
```

### 6.2 Bronnen en contextplannen

Gebruik `ConstructionService.referenceOptions` / `referencesForRole` en hun getypeerde referenties in plaats van getypte checks verspreid in sidebar, radial en pointercontroller. Het bestaande `contextualPlans` ondersteunt `placement` en expliciete polygon-`edge`-referenties. De universele alias moet zulke concrete plannen **componeren**, niet `contract('pointOnObject')` proberen op te vragen. Een afgeleide bron is slechts beschikbaar zolang haar `constructionValid` en vereiste rechten geldig zijn.

### 6.3 Eén projectieadapter

Gebruik `ConstructionService.projectParameter` voor parameterbepaling en de bestaande geometrieservices voor afstand en positie. Indien er een gedeelde previewfunctie wordt geïntroduceerd, laat die **een zuiver resultaat** produceren, bijvoorbeeld `{sourceRef, kind, parameter, projectedPoint, distancePx, valid, reasonCode}`; geen DOM- of commandmutaties in de rekenkern. Hergebruik `EllipseGeometry.nearest` en de bestaande lineaire segmentprojectie. Een *preview* en de bevestigde constructie moeten hetzelfde onderliggende rekenpad volgen.

### 6.4 Historie en eigenaarschap

- `ConstructionService` blijft exclusief eigenaar van bronrollen, constructiegeometrie, bronvalidatie en afhankelijkheidsresolutie.
- `Engine.construct` / `construction.create` blijft het enige productiecommando voor het aanmaken van het nieuwe punt; `construction.setParameter` blijft de bestaande bewerkingsroute.
- `EditorApp` regelt staging, pointerinteractie en visualisatie en schrijft niet rechtstreeks afgeleide `x/y` in het model.
- De bestaande `EditorHistory` en commandtransacties regelen commit, cancel, Undo/Redo en selectieherstel.
- Geen extra `PathEngine`, tweede dependency graph, duplicaatconstrueercommando, globale allowlist of eigen opslaglaag.
- Aparte puntverdelingen over een cirkel (`distributedPointOnCircle`) blijven een eigen workflow en recept.

## 7. Validatie, permissies en vergrendeling

Het UI-alias is **nooit een autorisatiesnelkoppeling**. De zichtbaarheid van het universele gereedschap geeft niet automatisch toestemming voor alle drie concrete constructies.

1. **Bij tonen/activeren:** bied het gereedschap alleen aan volgens het geldige catalogus- en runtimebeleid. Als de gebruiker geen enkele toegelaten concrete constructie kan maken, is het niet actief.
2. **Bij bronselectie:** verifieer het concrete `construct:pointOnSegment`, `construct:pointOnCircle` of `construct:pointOnEllipse`, het recht om het bronobject als constructiebron te gebruiken, de relevante `sourceTools`, getypeerde onderdelen en zichtbaarheid voor de huidige rol.
3. **Bij bevestigen:** herhaal alle permissie- en bronchecks, ook wanneer bron/rechten tussen hover en click wijzigen. Gebruik de bestaande `construction.create`-validatie; falen is atomair.
4. **Bij slepen:** controleer eigenaarschap, doelpunt-lock en getypeerde `construction.setParameter`-rechten opnieuw; laat geen verborgen brondata vrij via voorspellende preview.
5. **Bij import/export:** dezelfde restricted-projection- en redaction-regels blijven gelden voor de gekoppelde bron, afgeleide puntcoördinaten, DOM, ARIA-labels, hints, SVG, PNG en JSON. Verberg ongeautoriseerde bron-ID's en caches; een zichtbare generieke toolnaam is geen recht om details te lekken.
6. **Bron-lock:** een vergrendelde bron wordt niet onvrijwillig verplaatst; bestaande geldige afhankelijke constructies mogen er wel van herberekenen. **Doel-lock:** puntparameter niet wijzigen.

## 8. Documentformaat en migratie

### 8.1 Geen nieuwe persistente soort

Een nieuw door M-PATH.0 gemaakt punt gebruikt precies hetzelfde objectmodel en hetzelfde opgeslagen recept als een bestaand punt van het overeenkomende type. Er verschijnt **nooit** `"kind":"pointOnObject"` in een document en ook geen nieuw veld voor bronvorm, edge-identiteit of projectiecache.

**Voorbeeld — punt op zijde BC** van vierhoek `V1` (`B` is index 1):

```json
{
  "type": "point",
  "id": "P1",
  "construction": {
    "kind": "pointOnSegment",
    "sources": [{"objectId":"V1", "part":"edge", "index":1}],
    "parameter": 0.25
  }
}
```

**Voorbeeld — punt op ellips:**

```json
{
  "type": "point",
  "id": "P2",
  "construction": {
    "kind":"pointOnEllipse",
    "sources":[{"objectId":"E1"}],
    "parameter":0.25
  }
}
```

Deze voorbeelden geven de **relevante object- en constructievelden** weer, niet noodzakelijk een volledig standalone JSON-document met alle huidige metadata.

### 8.2 Compatibiliteitsregels

- **Geen nieuwe `document.version`, `constructionSchema` of `ellipseSchema` uitsluitend wegens dit UI-gereedschap.** De bestaande exportlogica leidt versies/schema's af uit de werkelijk aanwezige objecten en recepten. Documenten met M8b-constructies kunnen nog steeds de bestaande hogere schemavariant vereisen.
- Oude `pointOnSegment`, `pointOnCircle` en `pointOnEllipse` blijven zonder betekeniswijziging leesbaar, versleepbaar, opslaanbaar en exporteerbaar. Geen verplichte migratie of heropslag.
- Import weigert onbekende recepten en ongeldige bronreferenties volgens de bestaande atomische validatie. Een eventueel abusievelijk opgeslagen `pointOnObject` moet **niet** als geldig recept worden toegevoegd.
- Een bestaande constructie blijft gekoppeld aan haar oorspronkelijke ID en edge-index; de nieuwe UI alias wijzigt de parameters of bronverwijzingen niet op zichzelf.
- Dupliceren, detach, bronverwijdering met cascade, Undo/Redo, groepen, lagen en restricted export volgen hun al bestaande semantiek. Test combinaties met ellipsconstructies, parallellogrammen en andere constructiesoorten.

## 9. Foutgevallen en herstelregels

| Situatie | Voorgeschreven gedrag |
|---|---|
| Klik op vrij punt, tekst, assenstelsel of niet-ondersteund object | Geen creatie; specifieke, leesbare feedback. |
| Klik diep binnen gevulde driehoek | Geen punt in het gebied, ook niet op willekeurige zijde. |
| Klik op twee even geschikte polygonranden/overlappende objecten | Bron verduidelijken of gedocumenteerde, zichtbare deterministische keuze; geen stille wissel. |
| Lengte lijnstuk/zijde wordt nul | Geen deling door nul; tijdelijk ongeldig, bestaande identiteit/parameter behouden en herstel testen. |
| Cirkelstraal nul of negatief | Geen geldige plaatsing; bron-/modelvalidatie respecteren. |
| Ellips wordt tijdelijk gedegenereerd | Afhankelijk punt ongeldig en niet zichtbaar als geldig punt; herstel na geldige bronvorm. |
| Uit projectie volgt NaN, oneindig of resultaat buiten modelgrenzen | Geen documentmutatie; geldige foutenstatus of herstelbare invaliditeit. |
| Bron verdwenen tijdens preview | Plaatsing annuleren of veilig laten falen, zonder half punt. |
| Bron of toolgrant ingetrokken vóór commit | Geen commit en geen broninformatie in UI/export. |
| Pointer ver buiten eindpunt van zijde | Parameter exact geklemd tot 0 of 1; nooit volgende zijde. |
| Expliciete vertexherordening als afzonderlijke actie | Buiten M-PATH.0. Als al aanwezig: atomair blokkeren bij afhankelijke referenties of correct, volledig remappen; geen stille bronwissel. |
| Gelijke-lengte vertices-update met veranderde coördinaten | Interpretatie per vaste index; geen heuristische reorder-detectie of algemene blokkering. |
| Escape/Annuleren/`pointercancel` | Preview en staging weg; geen historieactie bij niet-gecommitteerde plaatsing. |

## 10. Test- en acceptatiematrix

### 10.1 Reproduceerbare wiskundige fixtures

| Case | Invoer | Verwachte uitkomst |
|---|---|---|
| Segment | `A=(0,0)`, `B=(8,0)`, `t=0.25` | `P=(2,0)` |
| Segment eindpunten | voorgaande, pointer links/rechts buiten | `t=0` respectievelijk `t=1` |
| Vaste zijde | `V=[(0,0),(4,0),(4,3),(0,3)]`, edge `1`, `t=0.25` | `P=(4,0.75)` |
| Zijde vervormt | voorgaande, `V[1]=(5,0)`, `V[2]=(6,3)` | `P=(5.25,0.75)`, `edge:1` blijft |
| Cirkel | `C=(2,3)`, `r=5`, `p=0.25` | `P=(2,8)` |
| Cirkelnormalisatie | `p=1` als interactie-invoer | canoniek `p=0` |
| Ellips | `C=(0,0)`, `a=5`, `b=3`, rotatie `0`, `p=0.25` | `P=(0,3)` |
| Ellips, algemene projectie | schuin geplaatste pointer, niet-cirkelvormige ellips | numeriek dichtstbijzijnde contourpositie, niet gewone centrum-poolhoek |
| Afhankelijke ellips | geldig brandpuntenpaar en Q, daarna bronverplaatsing | `p` blijft vast; `P` wordt herberekend; geen nieuwe bron-ID |

Gebruik aangepaste absolute én schaalrelatieve fouttoleranties passend bij de bestaande geometrieservices. Toets bij periodieke parameters modulo 1 en bij polygonranden op **bronreferentie én** positie.

### 10.2 Verplichte Node-tests

**N1.** Dispatcher-matrix: correcte bronsoort → correct bestaand recept; andere objecten en ongeldige subonderdelen geweigerd; geen constructierecept `pointOnObject`.

**N2.** Parameterdomeinen, segmentclamping, periodieke naad, punt-op-ellips-projectie en endpointgevallen.

**N3.** Edge-index `i` en parameter `t` blijven vast bij indexgebonden coördinatenupdates (afzonderlijke vertex, meerdere vertices, translatie, constructiegedreven update en geldige gelijke-lengte array). Bestaande bescherming bij ander aantal vertices blijft intact. Indien een expliciete herordeningsroute bestaat: met afhankelijke edge/vertex-referenties atomair weigeren of volledig juist remappen. Geen nieuwe algemene blokkering.

**N4.** Zero-length, ongeldige cirkel/ellips, tijdelijke degeneratie, downstream dependency chain, herstel en uitsluiting van ongeldige snap-/renderresultaten.

**N5.** Bronverdwijning, bron-ID-verwisseling, cascade delete, detach, dupliceren, source rebind volgens bestaande regels en cyclusdetectie.

**N6.** Canonieke serialize/reload/replay-vergelijking; documentversie-/schema-afleiding ongewijzigd; historische JSON-documenten met alle drie recepten importeren identiek.

**N7.** Undo/Redo van creatie, parametermutatie, bronversleping, cancel en gecombineerde groepsacties.

**N8.** Lock en bestaande author/restricted-permissies; controle vóór en tijdens constructie en vóór commit; geen verborgen gegevens in restricted/projected exports.

**N9.** Pure previewberekeningen muteren model, commandlog en history niet; deterministische ambigue hits.

**N10.** Mixed-doc-regressie met lijnstuk, polygonen, M8a-ellipsen, M8b-parallellogrammen, punten op paden, andere constructies, lagen en groepen.

### 10.3 Verplichte Edge-/browsertests

**E1.** Eén knop in gereedschapscatalogus, correcte classificatie, zoeken, sidebar en fullscreen; geen dubbele zichtbare punt-op-* knoppen na definitieve omschakeling.

**E2.** Vier plaatsingsflows: lijnstuk, polygonzijde, cirkel en ellips; geselecteerde bron plus live geprojecteerde preview; bevestiging maakt precies één punt.

**E3.** Driehoek/vierkant/parallellogram: exacte geïndexeerde zijde highlighten; het punt volgt die indexgebonden zijde bij vertexdrag en constructiegedreven vervorming; drag over een hoek stopt bij endpoint, zonder overgang naar buurzijde.

**E4.** Polygoninterieur, hoekpuntambiguïteit, overlappende contouren, verborgen en locked objecten, buiten-tolerantiekliks en niet-ondersteunde objecten.

**E5.** Zoomen, pannen, verschillende beeldschermschalen en geroteerde ellipsen: 12-CSS-px hit/preview blijft consistent.

**E6.** Drag/update, ESC, pointercancel, blur, Undo/Redo, New, dispose, historie en tijdelijke ghost-preview.

**E7.** Radiaalmenu via rechtsklik op een geschikte contour; voor een polygon wordt **exact die edge** ge-prefilled, niet de polygon als geheel.

**E8.** Eigenschappenpaneel, positieparameter, bestaande label- en stijlfuncties, lagen/groepen en source-/targetlock.

**E9.** JSON opslaan/importeren, SVG-export, PNG-export, restricted-weergave, geen JS-consolefouten of lekken in DOM/ARIA.

**E10.** Regressie van oude `Punt op cirkel`, `Punt op ellips`, bestaand punt-op-segmentgedrag en `distributedPointOnCircle` voordat de oude menu-items verdwijnen.

### 10.4 Meetbare acceptatievoorwaarden

1. Alle verplichte tests uit de gecontroleerde basis plus nieuwe gerichte tests slagen; eventuele bekende baselinefouten worden afzonderlijk gedocumenteerd en niet als nieuwe PASS voorgesteld.
2. Alle vier dragers volgen dezelfde zichtbare gebruikerslogica, maar bewaren hun **oude** concrete receptsoort.
3. Een punt op polygonzijde `i` blijft op `i` bij gewone vervorming, en kan tijdens slepen niet naar `i±1` springen.
4. Bij aanmaak, slepen, annuleren en herhalen ontstaan geen extra objecten, extra history-records of achtergebleven previews.
5. Bestaande documenten, getypeerde commando's, restricted-permissies en exportformaten blijven compatibel.
6. Sidebar/radial gebruiken dezelfde dispatch/bronlogica; geen wederzijdse verschillen in toestemming of rekenresultaat.
7. Handmatige gebruikersacceptatie van de vier dragers, minstens één driehoek en één vierkant/parallellogram is geregistreerd voordat oude knoppen worden verwijderd of de feature als voltooid geldt.
8. De gerichte topologiehercontrole P2 heeft alle werkelijk bestaande polygonmutatiepaden geclassificeerd; er is geen ongemerkte indexpermutatie door een huidig WIE-commando. Eventuele expliciete reordering is veilig afgeschermd. Een hypothetische, niet-bestaande herordenings-API is geen blokkering.

## 11. Uitvoering, rapportage en afzonderlijke GO's

### M-PATH.0-P — read-only technische preflight (**verplicht vóór productiecode**)

Codex inspecteert de **op dat moment actuele `main`** en rapporteert minimaal:

- Werking en paden van `pointOnSegment`, `pointOnCircle`, `pointOnEllipse`; contractrollen en bron-/edge-referenties.
- `ToolCatalog`, `toolAllowed`, `commandToolId`, `construction.create`, `sourceTools`, radial aanbod en `startContextConstruction`.
- Bestaande preview voor ellips en varianten van `constructionClick` en `pathPoint`-drag; verschillen tussen sidebar- en radialflow.
- Pointer-hit, CSS-schermtolerantie en snap-prioriteiten; overlap/edge-ambiguïteit.
- Alle actuele polygonmutatiepaden, polygonedge-index, herordening/remapping en invaliditeit van bronvormen.
- Version-/schema- en legacy-importregels, mede in gemengde M8a/M8b-documenten.
- Bestaande Node-/Edge-tests en het kleinste relevante implementatieplan, inclusief te wijzigen bestanden, risico's en eventueel benodigde contractafwijkingen.

**Uitkomst:** een versiebeheerd preflightrapport met expliciete GO/NO-GO-aanbeveling, **geen productiecodewijzigingen**. Indien de noodzakelijke UI-alias- of permissieaanpak ingrijpend van dit contract afwijkt, eerst contractamendement ter goedkeuring.

### M-PATH.0-P2 — gerichte NO-GO-opvolging (**read-only; uitsluitend topologie**)

De oorspronkelijke P-preflight is op 17 oktober 2026 met **NO-GO** afgesloten. De enige daarvoor als implementatiestart-blokkerend geïdentificeerde kwestie is in §5 normatief verduidelijkt. Laat Codex een gerichte P2-hercontrole uitvoeren conform §5.5 en die vastleggen in `docs/M-PATH-0-P2-TOPOLOGIE-HERCONTROLE.md` op een aparte branch. **Geen productiecode, geen nieuwe brede audit, geen tests als PASS voorstellen indien niet uitgevoerd, geen automatische merge.** Het oude preflightrapport blijft historisch geldig en wordt niet achteraf herschreven. De P2-uitkomst kan `GO-aanbeveling voor afzonderlijke implementatiebeslissing` of `NO-GO met exacte resterende blocker` zijn.

### M-PATH.0-I — implementatie (**uitsluitend na afzonderlijk GO**)

Bouw de gedeelde UI-dispatch, bronselectie, contourpreview, polygonedge-keuze en bevestiging. Hergebruik bestaande concrete recepten en commandflow. Schrijf gerichte Node-/Edge-tests mee. **Verwijder oude menu-ingangen nog niet** in deze fase.

### M-PATH.0-V — verificatie en pariteit

Draai de toepasselijke bestaande suites, typisch `npm test` en `npm run test:edge` (voor zover afhankelijkheden/Edge aanwezig zijn), plus de contracttests; rapporteer exacte commando's, aantallen, uitslagen, eventuele skips en regressierisico's. Corrigeer alleen M-PATH.0-gerelateerde fouten. Vergelijk oude en nieuwe UI expliciet. Pas na gebruikersacceptatie verdwijnen de dubbele oude knoppen; de **onderliggende recepten blijven bestaan**.

### M-PATH.0-A — acceptatie en merge

Lever een eindrapport met branch, commit(s), gewijzigde bestanden, compatibiliteitsmatrix, testbewijs en open punten. Merge naar `main` gebeurt **alleen na aparte gebruikersgoedkeuring**. Actualiseer daarna roadmapstatus en documentatielinks, zonder M-PATH.1 of M8-INT impliciet uit te voeren.

## 12. Niet-onderhandelbare architectuurinvarianten

- Eén documentwaarheid en één bestaande `ConstructionService`/afhankelijkheidsgraaf.
- Eén zichtbaar punt-op-objectgereedschap; gespecialiseerde **persistente** recepten behouden.
- **Optie A**: vaste polygonzijde, geen onbedoelde edge-overgang.
- Geen punt op gevuld interieur via M-PATH.0.
- Geen schema-bump vanwege enkel de universele UI.
- Geen autorisatie-uitbreiding door een generieke naam of UI-alias.
- Geen stale preview of geldige export van ongeldige/verborgen geometrie.
- Geen parallelle pointer-/history-/snap-/geometrie-engine.
- Geen productiecode, oude-tool-verwijdering of merge zonder de expliciete bijbehorende GO.

## 13. Status, referenties en versiehistoriek

**Geraadpleegde implementatiebronnen (gecontroleerde `main`, 16 oktober 2026):**

- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/AGENTS.md`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/CONSTRUCTIONS.md`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/construction-service.js`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/editor.js`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/editor.html`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/tool-catalog.js`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/ellipse-geometry.js`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/polygon-geometry.js`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/UI-RADIAL-9-CONTRACT-DRIVEN.md`
- `https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/DEVELOPMENT-ROADMAP.md`

**Versiehistoriek**

| Versie | Datum | Wijziging | Status |
|---|---|---|---|
| 1.0.0 | 2026-10-16 | Eerste volledig normatieve ontwerpuitwerking, op basis van roadmap v2.8.21 en codecontrole van `main` | Opgevolgd door v1.0.1 |
| 1.0.1 | 2026-10-17 | Amendement §5: vaste-indexsemantiek, onderscheid update/herordening/import, geen topologie-engine, gerichte P2-hercontrole en aangepaste tests/gate na NO-GO | Ter technische hercontrole; geen implementatie-GO |

**Goedkeuringspoort:** v1.0.1 verduidelijkt uitsluitend het topologiecontract na het NO-GO van M-PATH.0-P. De eerstvolgende uitvoeringsopdracht is uitsluitend **M-PATH.0-P2: gerichte read-only topologiehercontrole**. Een positief P2-rapport geeft op zichzelf geen implementatieautorisatie; M-PATH.0-I, oude-tool-verwijdering en merge vereisen elk de toepasselijke afzonderlijke GO.