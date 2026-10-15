# WIE — M7a: Vectorfundament

**Contractversie:** 1.0.0  
**Datum:** 15 oktober 2026  
**Status:** ontwerp ter goedkeuring — niet geïmplementeerd  
**Project:** From Zero 2 Infinity — Wiskundige Illustratie Editor (WIE)  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Referentiebasis:** gecontroleerde standaardbranch `main` op 15 oktober 2026; bij implementatie opnieuw vergelijken met de daadwerkelijk uitgecheckte ontwikkelbranch.  
**Scope:** M7a — vrije vectoren, gekoppelde vector AB, componentinvoer en componentweergave.  
**Opvolging:** M7b (translatie met vector), M7f (vectoralgebra).

> **Statuswaarschuwing.** Dit document beschrijft overeengekomen/doelgedrag voor een toekomstige implementatie. Het is geen claim dat M7a al in de code staat of dat tests zijn uitgevoerd. Documentatie noemt de branch `codex/ui-radial-7-point-context-constructions`; die referentie kon tijdens deze contractsessie niet worden opgehaald. Codex moet bij de implementatiestart de effectieve branch, HEAD, broncode en het scriptmanifest inspecteren.

## 1. Doel en acceptatiegrens

M7a maakt het bestaande objecttype `vector` geschikt voor dynamische meetkunde, zonder een nieuw vectorsysteem. Na implementatie moet de gebruiker:

1. een **vrije vector** kunnen tekenen, verplaatsen en via zijn coördinaten/componenten wijzigen;
2. een vrije vector kunnen definiëren door beginpositie en twee getekende of numerieke componenten;
3. een **gekoppelde vector** `\overrightarrow{AB}` kunnen construeren op basis van twee bestaande `point`-objecten;
4. onmiddellijk de componenten, norm en richting kunnen raadplegen, inclusief expliciet gedrag van de nulvector;
5. desgewenst componenten als leesbaar label op het canvas tonen;
6. rekenen op automatische herberekening en bronrelaties, undo/redo en import/export;
7. deze vectoren in een latere M7b kunnen gebruiken als bron van een translatie, zonder migratie van vectorsemantiek.

**Niet inbegrepen:** translatie zelf, rotatie/spiegeling, vectoroptelling/-aftrekking, scalaire vermenigvuldiging, inproduct, kruisproduct, projectie, matrix/vector-calculator, nieuwe algemene constraintsolver, generieke expressiegestuurde vectoren, vectoren tussen willekeurige objectonderdelen, of automatisch gegenereerde bronpunten voor getekende vrije vectoren. Die behoren tot latere afzonderlijk goedgekeurde milestones. Ook geen brede UI-refactor.

## 2. Normatieve basis en ontwerpregels

Bestaande code en documenten: `model.js`, `linear-geometry.js`, `construction-service.js`, `index.js`, `renderer.js`, `editor.js`, `editor.html`, `CONSTRUCTIONS.md`, `LINEAR-OBJECTS.md`, `DOCUMENT-FORMAT.md`, `AGENTS.md`, `docs/UI-RADIAL-9-CONTRACT-DRIVEN.md`, `docs/CORE-1-ARCHITECTURE-DESIGN.md`, `docs/DEVELOPMENT-ROADMAP.md`.

- **Een objecttype:** `type: "vector"` blijft de enige grafische vectorrepresentatie.
- **Een geometrische waarheid:** opgeslagen coördinaten `x1,y1,x2,y2` zijn de canonieke opgeloste geometrie. Componenten/norm/richting zijn afgeleide waarden, geen parallel opgeslagen waarheid.
- **Een constructiegraaf:** gekoppelde vectoren gebruiken `ConstructionService` en de bestaande modelmutaties, inclusief graafvalidatie, bronreferenties, herberekening, historie en permissies.
- **Een UI-pad:** gereedschap via `ToolCatalog`, contextuele plannen via `ConstructionService.contextualPlans`, uitvoering via bestaande canvasconstructie/`startContextConstruction`, zonder vector-specifieke radialmenu-allowlist of aparte commandbus.
- **Een renderer:** hergebruik vectorpijl, selectie/snap, labels, SVG/PNG en de bestaande mathematische 1:1 x/y-schaal.
- **Bij conflicten:** bestaande werkende code en laatst goedgekeurde ontwerpafspraken onderzoeken vóór wijzigen; documentatie alleen is geen bewijs dat een branch al is gemerged.

## 3. Begrippen en mathematisch contract

### 3.1 Vrije vector met plaatsing

Een vrije vector `v` is mathematisch volledig bepaald door de verplaatsing `(vx, vy)`; zijn zichtbare beginpositie `P=(x1,y1)` is een presentatieve geometrische plaatsing. De getekende pijlpunt is `Q=(x2,y2)`.

```text
vx = x2 - x1
vy = y2 - y1
|v| = hypot(vx, vy)
Q = (x1 + vx, y1 + vy)
```

Verschuiven van het volledige vrije vectorobject verandert `(x1,y1)` en `(x2,y2)` met dezelfde delta; `(vx,vy)` blijft ongewijzigd. De componenten zijn georiënteerd volgens de wiskundige assen (`+y` omhoog) en staan los van viewport, zoom en panning.

### 3.2 Gekoppelde vector AB

Een gekoppelde vector heeft twee opgeslagen, geordende bronreferenties naar **bestaande afzonderlijke `point`-objectidentiteiten**: `A` en `B`. De resulterende zichtbare geometrie wordt berekend met:

```text
x1 = A.x; y1 = A.y
x2 = B.x; y2 = B.y
vx = B.x - A.x; vy = B.y - A.y
```

`A` en `B` mogen samenvallen of zelfs naar hetzelfde bronobject verwijzen: de resulterende nulvector blijft een **geldige** vectorconstructie. Bronvolgorde is betekenisvol: `AB = -BA` bij omwisseling van de bronnen; automatisch sorteren is verboden. Ook punten die zelf van eerdere constructies afhangen, mogen als bron dienen.

### 3.3 Nulvector

`vx===0 && vy===0` is geldige nulvector. Norm is exact `0`, de richtingshoek is **ongedefinieerd** (`null`/`undefined` in de reken-API; visueel `—` met toegankelijke uitleg). Geen richting `0°` suggereren. Een onafhankelijk getekende vector behoudt de huidige minimale muisbeweging voor het **aanmaken**; nulvectoren zijn wel mogelijk door getypeerde componenten of koppeling van samenvallende punten. Verplaatsen, bewaren, importeren en dupliceren ondersteunen nulvectoren.

### 3.4 Richtingshoek, norm en meeteenheden

Voor niet-nulvectoren is de richting `atan2(vy,vx)` t.o.v. de positieve x-as, tegen de wijzers van de klok in. Normaliseer naar `[0,2π)` voor radialen, of `[0,360)` voor graden. De UI volgt de bestaande documenthoekinstelling (deg/rad) en precisie; ongeacht gekozen weergave blijft de canonieke geometrie cartesisch. Norm en componenten gebruiken de **bestaande lengteeenheid/maatstaf en formatter** van het document; eenheden worden niet tweemaal omgerekend. Componenten zijn getekende/signed lengtes; norm is niet-negatief. Normaliseer weergave van `-0` naar `0` zonder opgeslagen geometrie onbedoeld te herschrijven.

**Rekenvoorbeeld:** `A=(1,2)`, `B=(4,0)` geeft `v=(3,-2)`, `|v|=√13≈3,605551275`, `θ≈326,309932474°` (of `-33,690067526°` vóór normalisatie). Bij `B=(5,5)` wordt `v=(4,3)`, `|v|=5`, `θ≈36,869897646°`.

## 4. Persistente objecttoestanden

Er bestaan **twee persistente semantische toestanden** en **drie invoerwijzen**:

| Persistent | Creatie/bewerking | Geometriegezag |
| --- | --- | --- |
| Vrij | Getekende staart en pijlpunt | `x1,y1,x2,y2` |
| Vrij | Invoer van beginpositie `x1,y1` plus componenten `vx,vy` | Zelfde `x1,y1,x2,y2`, atomair herberekend |
| Gekoppeld | Twee bronnen `A`,`B` kiezen | `construction.sources` en `ConstructionService` |

Er is **geen opgeslagen `inputMode`** nodig: wisselen tussen invoer via eindpunten en via componenten verandert het canonieke vrije object, niet zijn wiskundige identiteit. De actieve invoertab is een tijdelijke UI-instelling. Gekoppeld/vrij volgt uitsluitend uit de aanwezigheid van een geldige constructiedefinitie.

### 4.1 Vrije vector, voorbeeld

```json
{
  "id": "vector-1",
  "type": "vector",
  "name": "v",
  "x1": 1, "y1": 2,
  "x2": 4, "y2": 0
}
```

Bestaande optionele velden (`style`, `showLabel`, `visible`, `locked`, label-offsets, laag, enz.) blijven ongewijzigd ondersteund. M7a voegt voor vrij/componentinvoer **geen verplicht opslagveld** toe.

### 4.2 Gekoppelde vector, voorbeeld

```json
{
  "id": "vector-2",
  "type": "vector",
  "name": "AB",
  "x1": 1, "y1": 2,
  "x2": 4, "y2": 0,
  "construction": {
    "kind": "vectorBetweenPoints",
    "sources": [
      {"objectId": "point-A"},
      {"objectId": "point-B"}
    ]
  }
}
```

De opgeslagen `x1,y1,x2,y2` zijn **niet-autoritieve opgeloste caches**: bij import en iedere bronmutatie recomputeert het model ze uitsluitend vanuit de bronreferenties. Er komt geen bijkomende `vx/vy`-waarheid in het JSON-object. De `constructionValid`-status wordt door het bestaande model beheerd.

### 4.3 Optionele canvascomponentweergave

Om componenten zichtbaar en behoudbaar te kunnen maken zonder overlap met `showLabel`, komt één vector-specifieke optionele presentatie-eigenschap:

```json
"vectorComponents": {"schema": 1, "show": true, "precision": null}
```

- Afwezig betekent effectief `{schema:1, show:false, precision:null}`. Nieuwe en bestaande vectoren blijven visueel gelijk aan vóór M7a.
- `schema` is exact `1`; `show` is boolean; `precision` is `null` (= bestaande documentprecisie) of een geheel getal `0…6`. Onbekende/ongeldige velden in deze **bekende** structuur worden vóór commit/import geweigerd; vreemde top-level extensievelden blijven volgens de bestaande beleid behouden.
- Het vectorcomponentenlabel gebruikt de bestaande label-anchor en labelOffsetX/Y en één veilige labelrenderpipeline. Bij `showLabel=true` en `show=true` worden de naam en componenten **samengevoegd in één geordend labelblok**, zonder dubbel overlappende tekstobjecten.
- Componentlabel toont `(vx, vy)` in de documenteenheid, met teken en het bestaande veilig-ontsnapte SVG-tekstpad; er wordt geen vrij bewerkbare formule of tweede dynamisch tekstobject aangemaakt.
- `showMeasurement` blijft een afzonderlijke bestaande functie voor norm/lengteweergave; dubbelingen in het canvas worden door dezelfde labelplaatsing/consistent layout voorkomen. Wijziging aan die historische vlag of haar betekenis is buiten scope.
- `vectorComponents` is **presentatie**, niet geometrie: geen nieuw rootdocumenttype, geen extra vectorconstructor of constructiebron.

## 5. Constructiedefinitie `vectorBetweenPoints`

Voeg in de bestaande `ConstructionService` één nieuw recept toe:

```text
kind:             vectorBetweenPoints
resultType:       vector
sourceRoles:      [point, point]
computedFields:   [x1, y1, x2, y2]
branches:         []
parameters:       geen
```

**Bronselectiecontract**

1. Voor M7a uitsluitend gehele bestaande `type:'point'`-objecten, referentie `{objectId}` zonder `part`, `index`, `arm` of asreferentie. Daarmee vermijdt M7a onbedoelde koppeling aan de eindpunthandgrepen van een getekende lijn of vector. Ondersteuning voor objectonderdelen vergt later expliciete toestemming.
2. Eerste punt is **A**, tweede is **B**; de volgorde is blijvend en wordt opnieuw gevalideerd bij uitvoering. `A===B` en gelijke coördinaten zijn toegestaan.
3. `contract`, `referenceOptions`/`referencesForRole`, `validateReferences`, `evaluate`, `resolve`, `describe`, `descendants`, computed-fieldbeveiliging, snap exclusions en autorisatie blijven de gedeelde eigenaars.
4. `construction.create`/`Engine.construct` moet **één** vectorobject atomair maken, met normale constructiestijl en naam. Geen twee nieuwe verborgen puntobjecten, geen tweede command.
5. Niet-finite of buiten het bereik gelegen afgeleide eindcoördinaten vallen onder de bestaande numerieke veiligheidsgrens, maar `A=B` is géén geometrische degeneratie.
6. Ontbrekende of ongeschikte bron, cyclus, fout constructietype of ongeldig schema: **atomair afwijzen**, bestaand document intact.
7. Bron die zelf tijdelijk `constructionValid=false` is: gekoppelde vector wordt tijdelijk `SOURCE_INVALID`, verdwijnt uit tekenen/export/hit-test/snap, bewaart definitie en herstelt automatisch zodra de bron weer geldig is.

**Expliciete graph-regel:** bestaande `lineBetweenPoints` mag niet hergebruikt worden als recept: dat is een `line` en weigert samenvallende punten. Het nieuwe recept produceert `vector` en accepteert nulvectoren. Wiskundige rekenhelpers mogen gedeeld zijn.

## 6. Voorbereiding voor toekomstige translatie (zonder M7b uit te voeren)

- Definieer in `ConstructionService` de getypeerde **bronrol** `vector` die uitsluitend een volledig object `{objectId}` met `type:'vector'` accepteert. Neem deze rol op in `referenceOptions`/`referencesForRole`, zonder voorlopig een translatiegereedschap aan te zetten.
- Maak één zuivere gedeelde berekening voor `vectorComponents(object)` op basis van `x2-x1,y2-y1`; deze levert gecontroleerde, eindige waarden en mag geen permissies omzeilen. Dezelfde semantiek zal M7b en M7f later moeten hergebruiken. De helper kan in een bestaande geometrieservice worden opgenomen; geen onafhankelijke vector-engine nodig.
- Zowel een vrije als gekoppelde vector moet via deze rol precies dezelfde `(vx,vy)` opleveren; toekomstige translatie zal naar **vector-ID** verwijzen, niet alleen een eenmalige kopie van de getoonde cijfers.
- Er wordt **nog geen** `translate`-recept, nieuw transformatieobject of automatische beeldconstructie toegevoegd.

## 7. Editorinteractie

### 7.1 Vrij tekenen

Het bestaande gereedschap **Vrije objecten → Vector** blijft `data-tool="vector"` met de bestaande drag van staart naar pijlpunt, snapping, numerieke exacte lengte tijdens tekenen, pointer-capture en Escape/Cancel/Blur/Dispose. Niet-onderbroken drags maken één historyactie. De historische minimale tekenbeweging van circa `0,05` blijft voor muisaanmaak behouden.

### 7.2 Numerieke componentinvoer

Een gebruiker kan na selectie van een vrije vector in **Geometrie** kiezen tussen twee *tijdelijke* editpresentaties:

- **Eindpunten:** `x1, y1, x2, y2`;
- **Componenten:** `x1, y1, vx, vy`.

Daarnaast mag een nieuw vrij vectorobject via de bestaande vectorworkflow worden ingevoerd met beginpunt en twee componenten, zonder noodzaak van een tweede formeel objecttype of een apart duplicaatgereedschap. Codex moet het kleinste consistente UI-pad kiezen binnen bestaande gereedschap/inspector/commandarchitectuur en dat in het implementatieverslag motiveren.

Een complete invoerset wordt **in één geautoriseerde undo-stap** naar `x1,y1,x2,y2` vertaald, met `x2=x1+vx`, `y2=y1+vy`. Geen directe DOM-mutatie of gedeeltelijke documentcommit bij ongeldige invoer. Bestaande snapping is voor expliciet numeriek ingevoerde waarden **niet** stilzwijgend van toepassing. Bij overflow, coördinaten buiten de bestaande grenzen of een niet-representeerbare niet-nulcomponent (bijv. door precisieverlies bij zeer grote begincoördinaten) wordt invoer geweigerd met een begrijpelijke melding; niet ongemerkt afronden tot de nulvector. Normale binaire floating-pointafronding is toegestaan volgens een getoetste tolerantie; de zichtbare waarden weerspiegelen altijd de werkelijk opgeslagen geometrie.

### 7.3 Gekoppelde vector construeren

Gereedschap **Constructies → Gekoppelde vector AB**, ID `construct:vectorBetweenPoints` (een momenteel geplande placeholder wordt vervangen in de bestaande catalogus, zonder duplicaten):

1. selecteer bestaand punt **A**;
2. selecteer bestaand punt **B** (hetzelfde punt mag opnieuw);
3. toon preview van A naar B;
4. bevestig via bestaande pointer-up/constructiecommand; één nieuw vectorobject, één undo/redo-stap.

Rechtsklikken op een geschikt punt mag via het bestaande **Constructie**-segment een `prefill`-plan tonen voor rol A of, indien de generieke plannen dit ondersteunen, een expliciet plan voor rol B. Het vervolg gebruikt `startContextConstruction` en `constructionClick`. Geen hardcoded radiaalmenuvectorlijst. In het aparte **Relaties**-paneel staan bron A, bron B, de aard van de koppeling en bestaande mogelijkheden voor losmaken/navigeren voor zover de permissions het toelaten.

### 7.4 Vrij versus gekoppeld manipuleren

| Actie | Vrije vector | Gekoppelde vector |
| --- | --- | --- |
| Hele pijl verslepen | Ja, behoud `(vx,vy)` | Nee; bronpunten bepalen geometrie |
| Staart/pijlpunt handgrepen | Ja, volgens bestaande vectorcontroller | Nee |
| Eindpuntvelden bewerken | Ja | Alleen-lezen |
| Componenten bewerken | Ja | Alleen-lezen |
| Norm/richting raadplegen | Ja | Ja |
| Naam, zichtbaarheid, stijl, componentlabel | Volgens rechten | Volgens rechten |
| Constructie losmaken | Niet van toepassing | Ja, als bestaande `detachConstructions` dit toestaat |

Een gekoppelde vector mag nooit stilzwijgend losgekoppeld worden doordat de gebruiker probeert hem te verslepen of componenten te bewerken. Bij expliciet **Losmaken** worden de laatst geldige opgeloste coördinaten als nieuwe vrije vector behouden. Een ongeldige gekoppelde vector kan volgens de bestaande veiligheidsregel niet worden losgemaakt zonder geldige geometrische snapshot.

### 7.5 Eigenschappenpanelen en toegankelijkheid

- **Geometrie:** begin/eind, componenten, norm, richtingshoek, gekoppeld/vrij-status. Norm en richting zijn in M7a read-only; een nulvector toont `Geen richting`.
- **Relaties:** eventuele A/B-bronnen, afhankelijke objecten, losmaken binnen toegestane rechten.
- **Uiterlijk:** bestaande lijn/pijlkleur/dikte/zichtbaarheid plus toggle `Componenten tonen` en optionele precisie.
- **Acties:** bestaande label/dupliceren/verwijderen/focusacties.
- **Alles:** alle toepasselijke eigenschappen zonder aparte tweede editor.

Gebruik de bestaande uniforme donkerblauw-gouden sectiecomponenten in het **zwevende eigenschappenpaneel**, inclusief sticky titel, maximale viewporthoogte en scrollbar. De huidige zesdelige contextuele cirkel blijft intact. Labels, input IDs, focus- en toetsenbordgedrag, `aria-label`s, foutmeldingen en zichtbare/uitgeschakelde status moeten toegankelijk zijn; geen hover-only functie.

## 8. Numeriek, validatie en veiligheid

1. Bestaande coördinatengrens `|coordinate|<=1e12` en eindige getallen blijven gelden; check ook verschillen, optellingen, norm, gradenconversie en formatters vóór commit/render/export.
2. `Math.hypot(vx,vy)` voor numeriek stabiele norm. Een niet-finite uitkomst wordt afgewezen in editflow of veroorzaakt passende gecontroleerde ongeldigheid in een afgeleide evaluatie; geen `NaN`/`Infinity` in JSON/SVG.
3. **Exact nul** is geldig; geen algemene `1e-9`-afkap gebruiken om kleine maar valide vectoren als nul of ongeldig aan te merken. Floating-point overflow/precisionverlies is apart te controleren.
4. Componenten van een bestaande vector nooit uit geclipte SVG-punten of transform/zoom berekenen.
5. Bij veranderingen van bronpunten topologische herberekening uitvoeren zonder mutatie van de cached vector buiten het model.
6. Bestaande locks, lagen, groepen, zichtbaarheid, redo, restricted source policies en `PermissionRuntime` blijven autoritatief. Het aanmaken of tonen van A/B-bronlabels mag geen restricted objectidentiteit of geometry lekken.
7. Ververs inspector/radiaalmenu, canvas, SVG en eventuele berekende labels op basis van dezelfde actuele modelrevisie; geen oude UI-cache na undo/redo.
8. Canvaslabeltekst en namen escapen volgens de bestaande SVG-/text-safetycontracten; geen `innerHTML` met niet-gecontroleerde invoer.
9. Geen willekeurige JavaScript-expressie als componentinvoer; uitsluitend numerieke validatie in M7a. Koppeling naar latere calculator/K4 vergt apart contract.

## 9. Opslag, import/export en backwardscompatibiliteit

- Legacy vrije `vector`-objecten met uitsluitend `x1,y1,x2,y2` moeten pixel-/SVG- en JSON-compatibel blijven; een ontbrekende `vectorComponents` geeft exact het oude weergavegedrag.
- Vrije vectoren vereisen **geen nieuwe** documentversie of expliciete constructieschema-upgrade. Voor gekoppelde vectoren moet het bestaande document/exportmechanisme de vereiste ondersteunde constructieschemaversie declareren (minstens schema 2 voor het huidige typed-bronnenconcept), in combinatie met de werkelijk aanwezige andere features. Niet blind een bestaande hogere schema-/documentversie overschrijven of een tweede rootveldschema invoeren.
- Een oudere engine die het onbekende constructierecept `vectorBetweenPoints` niet kent, moet documenten daarmee **afwijzen**; mag gekoppelde vectoren niet als statische geometrie laden.
- Importvalidering weigert ongeldig recept, bronvolgorde, bronrol, verkeerd resultType, gebroken ID, cycle, ongeldige `vectorComponents` en niet-finite opgeloste geometrie **atomair**.
- Herimport berekent het eindpunt uit A/B opnieuw, ook als opgeslagen cache anders is. Geldige tekenstijlen, metadata, label-offsets, laagreferenties, groepen, historie waar relevant, en onbekende toegestane extensies blijven behouden.
- Gewone duplicate van alleen een gekoppelde vector blijft een **losgekoppelde onafhankelijke snapshot**, conform bestaand gedrag. Bij dupliceren van een volledige groep met alle bronnen mag de bestaande remapping opnieuw koppelen aan de gekopieerde A/B, zolang dat de al geldende groepsregels respecteert. Geen speciaal vectoralternatief introduceren.
- Bronverwijdering cascadeert door gekoppelde vector en zijn verdere afstammelingen in één historytransactie; undo herstelt alles. **Bron verbergen** verandert de geldigheid of opgeslagen referenties niet, wel de regels voor display/permissies.
- Restricted SVG/PNG/JSON-export mag geen vectorinformatie onthullen wanneer een daarvoor noodzakelijke bron niet geautoriseerd is; bestaande fail-closed/projectieregels behouden.

## 10. M7a service- en commandinterfaces

Geen nieuwe publieke enginefacade verplicht: `Engine.add`, `.update`, `.construct`, `.get`, `.move`, `.getConstructionInfo`, `.detachConstructions`, `.toJSON`, `.load` blijven leidend. Verwachte aanvullende semantiek:

```text
ConstructionService.contract('vectorBetweenPoints')
  -> { resultType:'vector', sourceRoles:['point','point'], ... }
ConstructionService.evaluate({kind:'vectorBetweenPoints',sources:[A,B]}, map)
  -> {valid:true, reasonCode:'VALID', geometry:{type:'vector',x1:A.x,y1:A.y,x2:B.x,y2:B.y}}
SharedGeometry.vectorComponents(vector)
  -> {x:vector.x2-vector.x1, y:vector.y2-vector.y1}
```

`SharedGeometry.vectorComponents` is een **conceptuele naam**, niet een verplicht nieuwe module/API. Plaats de zuivere berekening waar hij binnen de bestaande geometrische architectuur thuishoort; documenteer de definitieve naam. De command- en beveiligingslagen bepalen of de aanroepende actor brondata mag raadplegen of wijzigen.

## 11. Verplichte geautomatiseerde testscenario’s (Node/Edge volgens toepasselijkheid)

### MAT — mathematische eenheidstests

- **MAT-01:** vrije vector `(1,2)->(4,0)` geeft `(3,-2)`, norm `√13`, richting `326,309932474°` binnen vooraf vastgelegde floating-pointtolerantie.
- **MAT-02:** bronpunten A/B geven dezelfde componenten als een vrije vector met dezelfde zichtbare geometrie.
- **MAT-03:** bronvolgorde omkeren geeft `(-vx,-vy)`, behalve nulvector.
- **MAT-04:** A en B samenvallend, als twee punten of hetzelfde punt-ID, geeft geldige nulvector, norm `0`, ongedefinieerde richting.
- **MAT-05:** kardinale richtingen 0°, 90°, 180°, 270°; grens tussen -0 en 360°.
- **MAT-06:** document- en objectprecisie, schaal, lengte-eenheid en hoek-eenheid leveren consistente component-/normweergave.
- **MAT-07:** zeer kleine niet-nulvector blijft niet-nul zolang representabel; geen impliciete epsilon-collapse.
- **MAT-08:** grote/negatieve coördinaten en verschillen voldoen aan finite/±1e12-beleid; overflow/precisieverlies wordt gecontroleerd afgewezen.
- **MAT-09:** `x1+vx` wordt correct en atomair opgelost; gerapporteerde componenten weerspiegelen daadwerkelijk opgeslagen `x2-x1`.

### GRF — constructiegraaf en mutaties

- **GRF-01:** nieuw recept heeft exact resultaatvector en twee geordende bronrollen `point`.
- **GRF-02:** geen endpoints/polygonvertices/axis als bron in M7a, zelfs als generieke rol `point` die elders toestaat.
- **GRF-03:** wijzig A, wijzig B en wijzig beide atomair → herberekende vector en afgeleide labels.
- **GRF-04:** keten `bronconstructie -> A -> vector AB` recomputeert in topologische volgorde.
- **GRF-05:** wijzig `x1`, `x2` of `vx` op gekoppelde vector rechtstreeks → geweigerd zonder halfmutatie.
- **GRF-06:** wijzigen van stijl, naam, label, zichtbaarheid en `vectorComponents` op gekoppelde vector blijft toegestaan binnen rechten.
- **GRF-07:** actieve afhankelijke bron tijdelijk ongeldig → `SOURCE_INVALID`, geen SVG/hit/snap; herstel recomputeert.
- **GRF-08:** een geldige nulvector blijft `constructionValid=true`, niet `DEGENERATE_DIRECTION`.
- **GRF-09:** ontbrekende bron, onjuist type, verkeerde `sources.length`, cyclus, oneindige getallen → atomair afwijzen.
- **GRF-10:** verbergen bron behoudt constructie; verwijderen cascadeert; undo/redo herstelt.
- **GRF-11:** expliciet losmaken maakt vrije snapshot; ongeldig geval volgt bestaande weigering.
- **GRF-12:** duplicate alleen vector ontkoppelt; groepskopie met A/B remapt waar bestaande regels dat toestaan.
- **GRF-13:** lock op gekoppelde vector blokkeert auteurmanipulatie maar niet herberekening na bronwijziging.
- **GRF-14:** twee of meer afhankelijke vectoren delen bron zonder interferentie; lange keten veroorzaakt geen stack overflow.

### IO — document en rendering

- **IO-01:** historische vrije-vector-fixtures behouden hun JSON-/SVG-golden of expliciet equivalent gedrag.
- **IO-02:** vrije vector zonder `vectorComponents` blijft identiek; optional vectorComponents rondreist save/load.
- **IO-03:** gekoppelde vector roundtrip plus extra rootdocumentfeatures (lagen, groepen, rich text, regio's) blijft compatibel met de bestaande versie-/schemaselectie.
- **IO-04:** met opzettelijk vervalste cached coördinaten wordt na import opnieuw uit de A/B-bronnen berekend.
- **IO-05:** onbekend recept in een oudere implementatie wordt geweigerd, niet als vrije vector geladen.
- **IO-06:** malformed `vectorComponents` of gebroken referentie weigert import en behoudt bestaand document volledig.
- **IO-07:** vectorpijl buiten viewport behoudt bestaande clipping/arrowheadregels; geen ingebeelde randpijl.
- **IO-08:** nulvector, componentlabel, naamlabel, lengtemaat, labels verplaatsen, SVG/PNG veilig en zonder overlap.
- **IO-09:** snap/select/hittest gelden alleen voor zichtbare en geldige, geautoriseerde vectoren.
- **IO-10:** restricted exports en source-binding blokkeren ongeautoriseerde brondata.

### CMD — UI, historie en permissies

- **CMD-01:** één getekende vector = één commit; pointercancel/Escape/new/dispose rollen preview terug.
- **CMD-02:** componentenformulier = één geautoriseerde model/undo-actie, geen gedeeltelijke update.
- **CMD-03:** A/B-selectie met cancel op verschillende stappen laat het document ongemoeid.
- **CMD-04:** constructie via sidebar en radiale voorinvulling gebruiken hetzelfde commandresultaat.
- **CMD-05:** `ToolCatalog` heeft één geïmplementeerd gereedschap `construct:vectorBetweenPoints`; niet dubbel in radiaalmenu.
- **CMD-06:** opnieuw toetsen van rechten/bron bij uitvoer voorkomt TOCTOU of restricted-data-lekkage.
- **CMD-07:** bronpunten/gebonden vector gewijzigd via undo/redo → inspector, canvas, export en status synchroon.
- **CMD-08:** bestaande tabellen/teksten met dynamische vectorlengte blijven juist; er wordt geen nieuwe typed tekstbinding stilzwijgend geactiveerd.

## 12. Verplichte handmatige Edge-acceptatie

1. Teken een vrije vector in het canvas en versleep hem als geheel: componenten blijven gelijk.
2. Versleep afzonderlijk beide eindpunten: componenten wijzigen passend.
3. Typ start `(1,2)` en componenten `(3,-2)`: het eindpunt wordt `(4,0)`; één Undo herstelt de vorige vector.
4. Maak A `(1,2)` en B `(4,0)`, construeer `AB` en verplaats B naar `(5,5)`: vector verandert naar `(4,3)`, lengte `5`.
5. Verplaats A en B naar dezelfde positie: nulvector blijft aanwezig/selecteerbaar, geen richting, geen foutpopup.
6. Probeer een gekoppelde vector zelf te verslepen/het eindpunt aan te passen: geen wijziging of onbedoelde loskoppeling.
7. Open zwevende panelen Geometrie, Relaties, Uiterlijk, Alles; test toetsenbord, zichtbare validatie en componenttoggle.
8. Open Constructie via rechtsklikken op A: kies gekoppelde vector, selecteer B en controleer identieke uitkomst als via de gereedschapsbalk.
9. Zet naam en componentlabel samen aan; controleer leesbaarheid bij zoom, fullscreen en export.
10. Sla op als JSON, laad terug, wijzig bron en bevestig dat de vector gekoppeld blijft; controleer ook SVG/PNG.
11. Dupliceer, maak los, verwijder de bron en druk Ongedaan/Opnieuw; verifieer graaf- en selectieconsistentie.
12. Controleer een gemengd document (oude vrije vector, gekoppelde vector, polygon, lagen/groepen en rich text) op regressie.

Automatische suite: `npm test` en `npm run test:edge` volgens huidige `package.json`; rapporteer aantallen **alleen na werkelijke uitvoering**. Handmatige tests staan los van automatisch geslaagde tests.

## 13. Uitvoeringsvolgorde en release-gates

### M7a.0 — Implementatiebasis herbevestigen (read-only)

Verifieer geldige werkbranch en HEAD, gewijzigde bestanden, bestaand vectorgereedschap, `ConstructionService`, actuele schemawriter, `ToolCatalog`, contextuele radiaalinteractie, `AGENTS.md`, teststatus en open merges. Rapporteer verschillen met dit contract vóór codewijziging. Geen branch veronderstellen op basis van roadmaptekst.

### M7a.1 — Geometrie- en graaflaag

Voeg `vectorBetweenPoints`, vectorbronrol, pure component-/norm-/richtingberekening, nulvector- en importvalidatie toe. Schrijf MAT/GRF/IO-kerntests. Geen UI-implementatie vóór een groene kern.

### M7a.2 — Gereedschappen en bewerking

Koppel één nieuw constructiegereedschap aan normale catalogus/contextualPlans en bestaande commands; voeg vrije componentinvoer via bestaande inspector/command toe. Schrijf CMD-tests, inspecteer undo/redo, permissies, locks en cursorannulatie.

### M7a.3 — Componentpresentatie en afronding

Voeg `vectorComponents`-presentatie toe met labelconsolidatie/eenheden/accessibility en volledige SVG/PNG-verificatie. Voer volledige Node-/Edge-regressie, import/export en handmatige acceptatie uit.

### Stopcriteria

Niet afronden wanneer één van onderstaande geldt:

- onduidelijke actuele branch of mergeconflict met recente UI-ontwikkeling;
- parallelle vector-/constructie-/permission-engine of vector-specifiek radiaalmenu;
- niet atomair importeren of niet reproduceerbaar undo/redo;
- samenvallende punten ten onrechte ongeldig;
- gekoppelde geometrie direct bewerkbaar zonder expliciet losmaken;
- foutieve bronpermissies, restricted-data-lek of onbekend schema stilzwijgend geaccepteerd;
- verslechtering van legacy-rendering/JSON of bestaande testregressie zonder expliciet besluit;
- onduidelijke schemaselectie bij v8 en documenten die eerdere features combineren.

## 14. Definitie van 'klaar'

M7a mag pas **technisch voltooid** heten als:

- [ ] actuele branch/HEAD en verschillen met `main` zijn vastgelegd;
- [ ] schema-/receptbesluit en M7b-bronsemantiek zijn geïmplementeerd;
- [ ] MAT, GRF, IO en CMD-tests bestaan en slagen;
- [ ] volledige bestaande Node- en Edge-regressies zijn werkelijk uitgevoerd, of uitzonderingen expliciet als SKIP met reden gelogd;
- [ ] import/export, oude vector-fixtures, SVG/PNG, undo/redo, restricted bronnen en nullabels zijn gecontroleerd;
- [ ] rapport vermeldt gewijzigde bestanden, commando's, werkelijke aantallen/pass-fail/skip, risico's, open handmatige stappen en commit SHA;
- [ ] gebruiker heeft de functionele browseracceptatie gegeven;
- [ ] afzonderlijk besluit tot integratie/merge is genomen.

Statusbegrippen niet verwarren: **geïmplementeerd op branch**, **automatisch getest**, **handmatig geaccepteerd**, **naar main gemerged**.

## 15. Open ontwerpkeuzes en vastgelegde standaard

Dit v1.0.0-contract stelt de volgende defaults voor, onder voorbehoud van productgoedkeuring:

| Keuze | Contractstandaard |
| --- | --- |
| Gekoppelde bronnen | Twee volledige bestaande Point-objecten, A/B geordend |
| Samenvallende punten | Geldige nulvector |
| Vrije componentinvoer | Canonieke eindpunten, geen persistente invoermodus |
| Lengte/richting | Berekend, alleen-lezen in M7a |
| Richting van nulvector | Ongedefinieerd, visueel `—` |
| Canvascomponenten | Uit voor oude en nieuwe vectoren, expliciet aan/uit |
| Precisie componentlabel | Documentprecisie tenzij override 0–6 |
| Nieuw constructierecept | `vectorBetweenPoints` |
| Translatierol voorbereiden | Volledige vectorbronreferentie, nog geen translatie |
| Oude gekoppelde duplicatie | Onafhankelijke snapshot, behalve bestaande volledige groepsremapping |
| Nieuwe algemene schemas | Geen nieuw root-versiesysteem; bestaande mechanismen hergebruiken |

## 16. Codex-overdracht (pas na goedkeuring)

> Implementeer uitsluitend **WIE M7a Vectorfundament contract v1.0.0** op een nieuwe featurebranch vanaf de **daadwerkelijk actuele en relevante ontwikkelbranch**. Lees eerst `AGENTS.md`, `docs/UI-RADIAL-9-CONTRACT-DRIVEN.md`, `docs/CORE-1-ARCHITECTURE-DESIGN.md`, `CONSTRUCTIONS.md`, `LINEAR-OBJECTS.md`, `DOCUMENT-FORMAT.md`, `docs/DEVELOPMENT-ROADMAP.md` en de huidige broncode. Controleer branch/HEAD, import-/schemawriter, ToolCatalog en bestaande tests; rapporteer contractconflicten voordat je begint. Gebruik één `vector`-objecttype en de bestaande `ConstructionService`, model-/permission-/command-/history-/rendererarchitectuur. Werk in M7a.1–3 met gescheiden commits en test-gates, voeg concrete MAT/GRF/IO/CMD-tests toe, voer de volledige Node-/Edge-suite uit tenzij expliciet anders opgedragen, maak een gedetailleerd M7a-implementatieverslag en push uitsluitend naar die featurebranch. **Niet mergen naar main** en **niet starten met M7b/M7f** zonder afzonderlijke toestemming.

---

**Bronnen (repository; gecontroleerd op `main`, 15-10-2026):**
- <https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/AGENTS.md>
- <https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/CONSTRUCTIONS.md>
- <https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/LINEAR-OBJECTS.md>
- <https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/DOCUMENT-FORMAT.md>
- <https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/UI-RADIAL-9-CONTRACT-DRIVEN.md>
- <https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/CORE-1-ARCHITECTURE-DESIGN.md>
- <https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/DEVELOPMENT-ROADMAP.md>
