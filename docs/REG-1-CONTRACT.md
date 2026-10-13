# REG-1 — Normatief contract voor dynamische gebieden

**Contractversie:** 1.0.1
**Datum:** 2026-10-13
**Status:** ontwerp ter expliciete gebruikersgoedkeuring; geen productie-implementatie
**Repositorybasis:** `main` op `f4039842c44885d739b624d9d67bbfdd75d2394e`
**Afhankelijk:** CORE-1-architectuur v1.1.0
**Volgende poort:** REG-2 mag uitsluitend starten na expliciete goedkeuring van dit contract.

Dit contract specificeert drie zelfstandige, dynamisch gekoppelde gebiedsobjecten: een gebied op een bestaande eenvoudige veelhoek, een cirkelsector en een cirkelsegment. Het specificeert geen toolinterface, radiaalmenu of implementatie. De UI- en interactie-uitvoering blijft REG-2; UI-R1/UI-R2 blijven afzonderlijke milestones.

## 1. Normatieve grenzen en hergebruik

1. `ConstructionService` blijft eigenaar van receptvalidatie, afhankelijkheden, topologische volgorde, herberekening en tijdelijke invaliditeit. De bestaande M6a/M6b-`triangle`-rol en G-TRI1 `triangleFromPoints` blijven ongewijzigd.
2. De bestaande `MI.ToolCatalog` blijft de enige toolcatalogus. REG-2 voegt de drie tools aan categorie `gebieden` toe en introduceert geen concurrerende catalogus of `buildToolCatalog`.
3. De bestaande command- en permissieruntime blijft de enige schrijf- en autorisatiegrens. Een bronadapter levert alleen actuele, getypeerde en door die runtime geautoriseerde snapshots; hij verleent zelf geen rechten.
4. `resolveRegionGeometry` en `computeRegionArea` zijn zuivere functies. Ze lezen geen DOM/SVG/pixels, formatteren geen tekst als input, muteren geen objecten en houden geen eigen cache.
5. De enige numerieke waarheid is de ruwe berekende gebiedsgeometrie en quantity. Labeltekst, inspectorweergave, SVG en PNG zijn afgeleide presentaties.
6. Geen holes, Boolean-operaties, zelfsnijdende gebieden, gebieden onder grafieken of andere REG-3-functies in de eerste release.

## 2. Objectidentiteit, JSON en schema's

### 2.1 Besluit: een getypeerd `region`-object

Een regio is één eigen objecttype `region`, niet een polygon met gesamplede boogpunten, een cirkel of een niet-persistente overlay. Dat is noodzakelijk omdat sectoren en segmenten een exacte cirkelboog als grens hebben, afzonderlijk selecteerbaar/opmaakbaar moeten zijn en een dynamische dependency moeten behouden. Een gesamplede polyline zou afhangen van tessellatie en zoom, is geen exacte bron voor area, en kan bij export afwijken.

Het object bewaart een stabiele `id`, algemene objecteigenschappen (`name`, `visible`, `locked`, `style`, laaglidmaatschap), een getypeerd `construction`-recept en optionele `areaDisplay`-instellingen. Berekende contour, `areaQuantity`, labeltekst en caches worden **niet** opgeslagen. Die worden opnieuw uit de actuele, resolved bronnen berekend. Herberekening, invaliditeit, herstel, undo/redo, JSON-roundtrip en replay behouden hetzelfde object-ID. Dupliceren wijst bron-ID's via de bestaande dependency-remapping om en geeft het duplicaat een nieuw eigen ID.

### 2.2 Besluit: expliciete schema-uitbreiding

Op de gecontroleerde basis is `region` geen toegestaan objecttype; de modelvalidator heeft een gesloten type-allowlist en accepteert documentversies tot en met 7. De ConstructionService kent constructionSchema 1–4. Een additieve regio kan daarom niet correct onder alleen de bestaande versies worden opgeslagen.

REG-2 moet, pas na contractgoedkeuring, introduceren:

- `document.version: 8` wanneer ten minste één regio aanwezig is; documenten zonder regio behouden de bestaande versie-selectie en blijven byte-/semantisch compatibel.
- `regionSchema: 1` voor de `region`-objectvelden en de strikte geometrie-/display-instellingen.
- `constructionSchema: 5` wanneer een document een van de drie nieuwe regiorecepten bevat. Een document met bestaande constructies en een regio gebruikt schema 5; bestaande receptpayloads blijven identiek.

Dit zijn drie verschillende versies met verschillende verantwoordelijkheden; geen ervan vervangt `textSchema`, `layerSchema` of `groupSchema`. Een reader die document v8, `regionSchema: 1` of `constructionSchema: 5` niet ondersteunt, weigert het document atomair en fail-closed. Hij laadt niet gedeeltelijk, verwijdert geen onbekende velden en downgrade't of herschrijft het bestand niet. Een bijgewerkte reader blijft oudere documenten en recepten ondersteunen. Een regio kan niet worden geëxporteerd naar een oudere schema-versie door booggrenzen te polygoniseren.

### 2.3 Canonieke payload

Object-ID's in dit voorbeeld zijn illustratief; sleutelvolgorde is niet normatief.

```json
{
  "type": "region",
  "id": "region-1",
  "name": "Gebied 1",
  "visible": true,
  "locked": false,
  "style": { "stroke": "#222222", "strokeWidth": 2, "fill": "#f4c84a", "opacity": 0.35, "dash": "" },
  "construction": {
    "kind": "circleSegmentRegion",
    "sources": [
      { "objectId": "circle-1" },
      { "objectId": "start-direction-point" },
      { "objectId": "end-direction-point" }
    ],
    "extent": "minor"
  },
  "areaDisplay": {
    "visible": true,
    "mode": "equation",
    "precision": null,
    "position": { "mode": "auto" }
  }
}
```

`areaDisplay` defaults naar `{visible:false, mode:'value', precision:null, position:{mode:'auto'}}`. Als `precision` een geheel getal 0–10 is, overschrijft die alleen de documentprecisie voor dit label; `null` gebruikt de bestaande `MeasurementUnits.settings`. `mode:'value'` toont alleen de opgemaakte waarde; `mode:'equation'` toont `A = ` gevolgd door dezelfde waarde. `position:{mode:'auto'}` gebruikt een deterministisch geometrisch anker; `position:{mode:'offset',dx,dy}` is een modelruimte-offset vanaf het automatische anker. `dx`/`dy` moeten eindig zijn en binnen de bestaande modelcoördinatenlimiet blijven. De labelinstelling wordt genegeerd als `visible:false` of als de regio ongeldig is.

De toegestane constructievormen zijn strikt:

```json
{ "kind": "polygonRegion", "sources": [{"objectId":"polygon-id"}] }
{ "kind": "circleSectorRegion", "sources": [{"objectId":"circle-id"},{"objectId":"point-a"},{"objectId":"point-b"}], "extent": "minor" }
{ "kind": "circleSegmentRegion", "sources": [{"objectId":"circle-id"},{"objectId":"point-a"},{"objectId":"point-b"}], "extent": "major" }
```

Onbekende sleutels, verkeerde bronvolgorde, onjuist aantal bronnen, een onbekende `extent` of ontbrekende regio-/constructieschema's worden atomair afgewezen. De twee puntbronnen zijn richtingsankers voor stralen vanuit het cirkelcentrum; zij hoeven niet op de cirkelomtrek te liggen. Het snijpunt van hun ray met de cirkel wordt exact berekend en is geen extra documentobject. Beide punten moeten een geldige niet-nulrichting vanaf het centrum geven. Omkeren van de puntreferenties verandert de regio niet; `extent` kiest expliciet de kleinere of complementaire regio. Bij gelijke richtingen is de minorvariant nul en dus degeneratief; de majorvariant is de volledige schijf.

## 3. Bronnen en geometrische semantiek

### 3.1 Bronrollen en validatie

| Recept | Bronvolgorde en rol | Geldigheid |
|---|---|---|
| `polygonRegion` | 1. `polygon` | Bestaand geldig, eenvoudig polygonobject met 3–256 vertices; een vrije of G-TRI1-driehoek is geldig. |
| `circleSectorRegion` | 1. `circle`, 2. `point`-richting A, 3. `point`-richting B | Cirkelradius `r > 0`; beide punten zijn bestaande hele point-objecten; centrum en beide richtingpunten leveren niet-nul vectoren. `extent` is `minor` of `major`. |
| `circleSegmentRegion` | Zelfde als sector | Zelfde bronregels. |

Alle referenties zijn hele objectreferenties `{objectId}`; polygon vertex-/edge-parts zijn hier geen zelfstandige bronnen. De bronobjecten moeten bestaan, actueel, beschikbaar en volgens de bestaande runtime voor het gevraagde `construct:*`-tool-ID leesbaar/gebruikt mogen worden. Een reeds afhankelijke bron blijft aan de bestaande construction DAG gekoppeld. Een bron mag niet dezelfde regio zijn of een downstream-afhankelijke cyclus vormen. `polygonRegion` kan een G-TRI1-driehoek gebruiken; zijn vertices volgen diens huidige drie puntbronnen transitief.

De drie nieuwe command/tool-ID's zijn `construct:polygonRegion`, `construct:circleSectorRegion` en `construct:circleSegmentRegion`. Ze worden in `MI.ToolCatalog` geclassificeerd onder de bestaande hoofdcategorie **Gebieden & opvulling**, in deze volgorde. Bestaande tool-ID's wijzigen niet.

### 3.2 Polygongebied

De contour volgt exact de huidige resolved `vertices` in bronvolgorde en sluit van de laatste naar de eerste vertex. Clockwise en counterclockwise winding geven dezelfde geometrie en niet-negatieve oppervlakte. Collineaire tussenvertices zijn toegestaan als de polygon validator ze toestaat; volledige nuloppervlakte is degeneratief. Zelfsnijding, overlappende niet-aangrenzende randen, holes en zelfcontact buiten het bestaande polygoncontract worden geweigerd. De bron wordt bij iedere wijziging opnieuw met `PolygonGeometry.validate` gecontroleerd; gebruik dezelfde bewezen grenzen in plaats van een tweede validator.

### 3.3 Sector en segment: sweepcontract

De hoek wordt in het modelradiaalstelsel in radialen berekend. Richtingsvectoren worden vertaald naar een lokaal frame rond het cirkelcentrum. Noem de genormaliseerde bronhoeken `α` en `β` en definieer `δ = mod(β−α, 2π)`, met `0 ≤ δ < 2π`. `θminor = atan2(abs(cross(u,v)), dot(u,v))`, met `0 ≤ θminor ≤ π`, is de kleinere ongerichte hoek.

`extent:'minor'` kiest sweep `θ=θminor`; `extent:'major'` kiest `θ=2π−θminor`. De bronvolgorde kiest niet stilzwijgend welke kant wordt gevuld. Voor een niet-nul, niet-diametrale hoek geldt de canonieke CCW-contour zo: bij `minor` start de sweep op A als `δ<π`, anders op B; bij `major` start de sweep op B als `δ<π`, anders op A. De sweep eindigt steeds op de andere grensrichting. Bij `δ=π` start beide varianten op de grensrichting met de kleinste genormaliseerde hoek `α`/`β` en sweepen π; deze order-onafhankelijke tie-break kiest één van de twee mogelijke halve cirkels. Dit is een bewuste deterministische conventie voor het exact ambigue geval. Bij een doorlopende beweging van een richtingpunt door `δ=π` wisselt het gekozen halve pad aan weerszijden van die grens. Dit zichtbare omschakelen hoort bij de `minor`/`major`-semantiek; er wordt geen hysterese of verborgen vorige-frame-status gebruikt. Bij `δ=0` gelden de expliciete degeneratie-/volledige-schijfregels hieronder. Zo blijft het contour CCW en levert omwisselen van A en B dezelfde geometrische regio op. Hoekwrap over 0 wordt door modulo 2π verwerkt; `extent` kiest expliciet de kleinere of complementaire regio.

- `θ=0` voor `minor` is `DEGENERATE_REGION` (sector met nul oppervlak of segment met samenvallende koorde).
- `θ=2π` voor `major` bij gelijke richtingen is de volledige schijf en is geldig zolang `r>0`.
- Bij `θ=π` leveren `minor` en `major` hetzelfde halve gebied; canonieke sweep is π en de winding wordt niet gebruikt om een andere betekenis te suggereren.
- Richtingen aan weerszijden van 0 worden via `atan2`/modulaire hoeklogica correct over de 0/2π-grens verwerkt; klik- of arrayvolgorde bepaalt geen stilzwijgende minor/major-keuze.
- De constructie bewaart dezelfde regio-ID bij veranderende hoeken, ook als de `extent`-instelling expliciet wordt gewijzigd. Een command voor die instelling is één undo-stap.

Een sectorcontour bestaat uit centrum → exacte cirkelboog met straal `r` en sweep `θ` → centrum. Een segmentcontour bestaat uit het ene boogdeel → koorde terug naar het beginpunt. Een kleine segmentboog en grote complementaire segmentboog gebruiken dezelfde `extent`-betekenis. De boog wordt analytisch opgeslagen/berekend; geen vaste schermpixel-tessellatie wordt model- of area-invoer.

## 4. Oppervlaktecontract

`computeRegionArea` retourneert een ruwe, niet-negatieve quantity `{value, dimension:'length^2', unit:'coordinate^2'}`. De waarde is in modelcoördinaat². Zij is onafhankelijk van documenteenheid, schaal, zoom, schermresolutie, SVG-pad, labelprecisie en afronding. Voor `value=0` wegens exact degeneratieve geometrie volgt de foutstatus; een positieve wiskundige area die binary64 naar nul onderloopt geeft `NUMERIC_UNDERFLOW`, niet een geldige nul-area.

De exacte functies zijn:

- Polygon: `A = abs(Σ(xᵢ−x₀)(yᵢ₊₁−y₀) − (xᵢ₊₁−x₀)(yᵢ−y₀)) / 2` met modulo-indexering, eerst lokaal vertaald en genormaliseerd. Resultaat is `scale² · A_normalized`; geen geformatteerde tekst als input.
- Sector: `A = r² θ / 2`, waarbij `θ` uit het sweepcontract komt.
- Kleine segmentdiskdeel: `Aminor = r²(θ − sin θ)/2` voor `0≤θ≤π`.
- Groot segmentdeel: `Amajor = πr² − A_minor(2π−θmajor)`. Bereken dus de kleine complementaire segmentvorm en trek die van de hele cirkel af; gebruik niet direct een cancellation-gevoelige grote boogformule.

Voor kleine `θ` gebruikt de segmentimplementatie de Taylorreeks van `θ−sin θ`, niet de directe aftrekking: bij `θ<0.5` minimaal `θ³(1/6 − θ²/120 + θ⁴/5040 − θ⁶/362880 + θ⁸/39916800 − θ¹⁰/6227020800)`. Voor `θ≥0.5` mag de directe functie worden gebruikt. De regressietests bewijzen continuïteit en relatieve nauwkeurigheid rond `0.5` en richting nul. Alle vermenigvuldigingen en uitkomsten worden op eindigheid, onderloop en toegestane coördinaat-/oppervlaktelimieten gecontroleerd.

`formatRegionArea(quantity,settings)` controleert dimension en gebruikt uitsluitend `MeasurementUnits.format(quantity.value,'area',settings)`. De bestaande documenteenheid, precisie en `scale²`-conversie worden exact eenmaal toegepast. Als instelling `dimensionless` geen suffix heeft, blijft ook hier het suffix weg. Labelmodus `equation` voegt alleen `A = ` toe; het getal blijft door dezelfde formatter gemaakt.

## 5. Numeriek, foutstatussen en caching

De implementatie gebruikt binary64, lokale vertaling rond een bronpunt/centrum en schaalnormalisatie vóór cross-products en shoelace-sommen. Cirkelhoeken gebruiken `atan2(abs(cross),dot)`, niet `acos(dot)`, om kleine hoeken stabiel te houden. Polygoncontrole delegeert aan `PolygonGeometry`; sector/segmentgeometrie gebruikt analytische cirkelparameters. Teruggetransformeerde coördinaten moeten eindig zijn en binnen de bestaande absolute modelgrens `|x|,|y|≤1e12` vallen. Geen grens wordt stilzwijgend geclamped.

`resolveRegionGeometry` en `computeRegionArea` onderscheiden minstens:

| Status | Betekenis en behandeling |
|---|---|
| `INVALID_REFERENCE` | Verkeerd brontype, aantal/volgorde, extent of structureel ongeldige recipe; create/import/replay weigert atomair. |
| `MISSING_REFERENCE` | Bron-ID bestaat niet; laad/replay weigert atomair, of een verwijdering via bestaand command voert bestaande cascade-/dependencyregels uit. |
| `PERMISSION_DENIED` | De runtime staat tool of bron niet toe; geen geometry/area of onthullende details worden teruggegeven. |
| `SOURCE_INVALID` | Bestaande bronconstructie is tijdelijk ongeldig; region blijft bestaan met hetzelfde ID maar toont geen oude contour/area/label. Herstel rekent opnieuw. |
| `DEGENERATE_REGION` | Exact nul-oppervlakte polygon, nul minor-sweep, nulkoorde-segment of onvoldoende numerieke oriëntatie; geen stale area. |
| `SELF_INTERSECTION` | Polygonbron is zelfsnijdend of anderszins in strijd met de eenvoudige polygonregels. |
| `ZERO_RADIUS` | Cirkelbron heeft radius nul. |
| `NON_FINITE_RESULT` | Een tussenresultaat is NaN/∞ of niet representabel; markeer invalid en geef niets ouds weer. |
| `NUMERIC_UNDERFLOW` | Wiskundig positieve oppervlakte wordt als binary64 nul/niet-representabel; contour mag alleen zichtbaar blijven als geometry valide en renderbaar is, maar area/label wordt niet als nul gepresenteerd. |
| `COORDINATE_LIMIT` | Bron/teruggetransformeerde geometrie overschrijdt `1e12`; geen clipping of saturatie in modelwaarden. |
| `RASTER_LIMIT` | Bestaande offline-PNG-limiet overschreden; SVG/model blijven ongewijzigd en PNG-export faalt gecontroleerd. |

Caches mogen alleen afgeleide resultaten bevatten met geldige bron-ID/revision, object availability en permission epoch. Iedere geometry- of relevante documenteenheidwijziging invalideert de juiste geometry/format-cache. Delete, invalid source, import, undo/redo, policy-revocation of veranderde permissions maken entries synchroon ongeldig vóór rendering, label, clipboard of export. Een cache is nooit bron van waarheid en wordt niet opgeslagen in JSON.

## 6. Autorisatie, eigenschappen en lifecycle

Tool-ID's zijn `construct:polygonRegion`, `construct:circleSectorRegion`, `construct:circleSegmentRegion`. Een restricted actor moet afzonderlijk de tool mogen uitvoeren, de bronobjecten via `sourceTools` voor dat exacte tool-ID mogen lezen/gebruiken en het nieuwe type mogen creëren met lees-/displayrechten. Er worden geen grants geërfd uit `construct:area`, `figure.area`, bestaande circle/polygon source-grants of een UI-entry. `region` wordt opgenomen in `createdObjectRules`; zonder expliciet `read:true` en `display:true` weigert policyvalidatie een policy die de tool toestaat. De contracttestmatrix moet minimumrechten voor create, follow, style, delete, duplicate, select en export vooraf vastleggen.

Voorgestelde standaardmatrix voor REG-2:

| Capability | Auteur | Restricted actor na expliciete grant |
|---|---|---|
| bron lezen/gebruiken voor het specifieke region-tool | bestaande author-regels | `read` + `display` + exact `sourceTools`-tool grant op iedere bron |
| tool uitvoeren / region creëren | author | exact `allowedTools`-tool en `createdObjectRules.region.read/display` |
| region weergeven/selecteren | bestaande author-regels | expliciet `read`, `display`, `selectCanvas` (en `selectList` voor lijstselectie) |
| region style-/areaDisplay aanpassen | bestaande author-regels | expliciete relevante `propertyFields`; show/hide label verleent geen extra bronread |
| translate source-derived region | niet toegestaan | niet toegestaan; positie verandert uitsluitend via bron |
| verwijderen/dupliceren | bestaande author-regels | expliciete objectcapability; dupliceren controleert opnieuw alle bronreferenties en toolgrant |
| export | bestaande author-regels | alleen volgens bestaande restricted exportclosure; geen regio of label als een bron read/display-recht mist |

Restricted output redigeert alle drie vormen van gegevens: bron-ID/namen, exact gebied en area-waarde. Bij onvoldoende bron- of regionrecht wordt geen oude of gedeeltelijke regio-contour, preview, label, tooltip/ARIA-waarde, JSON/SVG/PNG, clipboardtekst of foutdetail getoond. Export volgt de bestaande runtime/projectie en dependency-closure; nooit exporteren met een stale waarde. Policy/revisionwijzigingen invalideren open inspectoren en callbacks; commit valideert rechten opnieuw.

Region is zelf selecteerbaar, stylebaar en via bestaande layer/group/visibility/lock- en commandpaden te beheren. De berekende geometrie is immutable voor directe drag/geometryvelden: translation wordt geweigerd. Gebruiker verplaatst of vervormt bronnen. `areaDisplay` is optioneel; als zichtbaar, beweegt zijn automatische anker mee met geometry. Handmatig offset is een stijl-/presentatieproperty en staat los van region-geometry. Undo/redo en semantic replay bevatten precies de create-/property-/source-commands; geen render- of exportactie creëert history. Bronverwijdering gebruikt de bestaande cascadeguard en remap-/historyregels; bron-degeneratie is recoverable en verwijdert nooit de region.

## 7. Renderer en export

De regionrenderer consumeert de resolved contour: polygonen als gesloten contour; gewone sectoren als centrumlijnen plus exacte SVG-boog; gewone segmenten als exacte boog plus koorde. Fill, stroke en opacity gebruiken de bestaande style tokens. Hit testing is geometrisch in modelruimte met de bestaande schermtolerantie, niet gebaseerd op rasterpixels; selectievolgorde volgt de bestaande layer/paint order. Een area label is een renderer-output uit `computeRegionArea` → `formatRegionArea`, en wordt niet als extra tekstobject of bronveld toegevoegd.

**Volledige-schijfgeval:** bij `extent:'major'` en samenvallende richtingen (`δ=0`, `θ=2π`) renderen zowel `circleSectorRegion` als `circleSegmentRegion` als een volledige gevulde schijf met de broncirkel als exacte buitencontour. Gebruik een volwaardige cirkelcontour of twee niet-degeneratieve halve SVG-bogen. Genereer geen enkele elliptische `A`-boog met identiek begin- en eindpunt: die beschrijft geen volledige cirkel. De schijf krijgt geen zichtbare radiale naad, centrumlijn of koorde als binnenrand; area is `πr²`, en hit testing/selectie gebruikt de volledige schijf. SVG- en offline-PNG-export moeten dezelfde gesloten schijf tonen, zonder gat, seam of extra documentobject.

JSON bewaart bronrecept, objectidentiteit, stijl en `areaDisplay`, nooit afgeleide geometry/area. Import, replay en restore her-resolven de graph. SVG bevat geldige path/arc-geometrie en optioneel geformatteerde label; PNG rasteriseert de actuele SVG via de bestaande offline-exportroute. Beide exportpaden honoreren visibility, capabilities, source closure, invalidation en de bestaande rasterdimensie-/pixelgrenzen.

## 8. Onafhankelijke acceptatie- en regressietests

### 8.1 Golden fixtures

1. Rechthoekige polygon uit `(0,0),(4,0),(4,3),(0,3)` heeft `A=12`; 3-4-5-triangle `(0,0),(4,0),(0,3)` heeft `A=6`. CW/CCW en cyclic shift leveren dezelfde positieve area.
2. Cirkel `r=2`, richtingen 0° en 90°: kwartsector `A=π`; majorsector `A=3π`.
3. Dezelfde cirkel en richtingen: klein kwartsegment `A=π−2`; major/complementair segment `A=3π+2`.
4. `θ=0`, `π`, `2π`, net onder/boven deze grenzen en hoekwrap over 0 controleren bovenstaande sweep-/degeneratieregels. Exact π heeft voor minor/major dezelfde gekozen halve regio en area volgens de tie-break; leg ook vast dat het pad bij continue passage door π deterministisch naar de tegenoverliggende zijde omschakelt.
5. Interactieve grenswaardetest: houd een eenheidscirkel en richting A op 0° vast en sleep richting B door `π−1e−6`, exact `π`, en `π+1e−6`, voor zowel `minor` als `major`. Vergelijk resolved sweep/startzijde, contour/hit-test, ruwe area en label op elk punt met de contractuele regels. Verifieer dat de zijwissel voorspelbaar en zichtbaar is, het region-ID stabiel blijft, ieder drag-event de actuele SVG bijwerkt en geen stale cache, invalid status of extra history-items per render ontstaan. Herhaal met omgewisselde bronreferenties en verifieer dezelfde gekozen geometrische regio.
6. Volledige-schijftest: voor `major` met samenvallende richtingen test zowel sector als segment op area `πr²`, exacte cirkelcontour, gesloten vulling zonder radiale seam/centrumlijn/koorde, correcte hit testing/selectie, SVG en offline PNG. Test ook `minor` bij dezelfde richtingen als degeneratief zonder oude contour of area.
7. Segmenten voor `θ=1e-12`, onder/boven `1e-12`, `1e-6`, net onder/boven `0.5` en `π` worden vergeleken met onafhankelijke hoge-precisie-referenties; er is geen negatieve area, NaN, discontinuïteit of cancellation-zero voor representabele resultaten.
8. Polygonfixtures bevatten horizontale/verticale randen, collineaire tussenvertices, winding-reversal, een concave eenvoudige polygon, grote gemeenschappelijke translatie, zeer kleine/grote schalen, absolute coördinatenlimiet, herhaald punt, nularea en bow-tie-self-intersectie.
9. Documentinstellingen bewijzen raw `coordinate²`, eenmaal toegepaste scale², cm²-/andere ondersteunde eenheid, precision 0–10, custom override, dimensionless suffix en value/equation-labelpariteit.

### 8.2 Lifecycle-, rechten- en integratietests

- Dynamische bronupdates voor polygon, circle, en richtingpunten; afhankelijk bronobject; stabiel region-ID, undo/redo, replay, duplicatie/remap, bron verwijderen/undo, tijdelijke invalid/recovery en JSON-roundtrip.
- Type/arity/recipe/schema-validatie, v1–v7 legacydocumenten, atomair afwijzen van v8 onbekend schema in oude-readerfixture, malformed recipes en unsupported region type; bestaande document- en constructieschemafixtures blijven ongewijzigd.
- Author, volledig restricted, ontbrekende toolgrant, ontbrekende bron-read/display/sourceTools grant, locked/hidden source, policy epoch revocation, restricted inspector/DOM/ARIA, clipboard, JSON/SVG/PNG; assertie dat geen verborgen ID, broncoördinaat, contour of area uitlekt.
- Canvas- en lijstselectie, layer order, group, style/fill/opacity, label on/off, labelpositie, fullscreen, toetsenbord/focus, cancel, hit test op boog/sector/concave polygon, SVG en offline PNG. Renderer mag geen history of documentmutatie veroorzaken.
- Behoud regressies voor `tests/polygon.test.cjs`, `tests/construction-contract.test.cjs`, `tests/triangle-centers.test.cjs`, G-TRI1/M6b tests, `tests/units-scale.test.cjs`, `tests/permissions.test.cjs`, tool-catalogus/fullscreen en bestaande meet-/exporttests.

Node-tests bewijzen service-/schema-/numerieke contracts met onafhankelijk berekende fixtures. Edge-tests bewijzen toolbediening, dynamiek, permissions, focus/fullscreen en export in de echte runtime. Reports geven exacte uitgevoerde suites en aantallen; niet-uitgevoerde handmatige controles worden expliciet open gelaten. REG-1 zelf wijzigt en draait geen tests.

## 9. Out of scope en resterende goedkeuring

REG-1 definieert geen radiaalmenu, nieuwe property-inspector, plotter, Boolean-regio, holes, functiegebied, learner-facing editing, drag van een afgeleide regio of text-source binding voor region-area. UI-R1 gaat pas na REG-2 volgens de roadmap. Er zijn geen inhoudelijke sweep-/area- of schema-vragen meer opengelaten in dit voorstel. De gebruiker moet vóór implementatie expliciet goedkeuren: (a) de nieuwe `region`-type-/v8-/regionSchema1-/constructionSchema5-uitbreiding en (b) de restricted-rights-matrix in §6. Tot die goedkeuring is REG-2 geblokkeerd en is geen productiecode toegestaan.
