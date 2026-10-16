# From Zero 2 Infinity — Wiskundige Illustratie Editor
## M8b — Dynamische parallellogrammen: wiskundig, functioneel en technisch ontwerpcontract

**Documentversie:** 1.2.0
**Datum:** 16 oktober 2026
**Status:** ontwerp goedgekeurd; M8b-1 is geïntegreerd op `main`; M8b-2/M8b-2b zijn featurebranchwerk en wachten op gebruikersacceptatie
**Repository:** [Geert1985/wiskundige-illustratie-editor](https://github.com/Geert1985/wiskundige-illustratie-editor)  
**Technisch geverifieerde basis voor versiebeleid:** oorsprong `origin/main` bevat M8b-1 met `constructionSchema:8`; de M8b-2-basisbranch is `c608cbc567edd566c0c68c55473def221cfade78`. M8b-2b-contractwijzigingen vereisen geen schemawijziging.
**Roadmapreferenties:** `tasks-129` t/m `tasks-133` — M8b: twee zijden en ingesloten hoek, live lengte-/hoekaanduiding, degeneraties en roundtrip, test-/acceptatiepoort.  
**Relatie tot M8a:** M8a-ontwerpcontract v1.0.0 werd op 15 oktober 2026 door de gebruiker goedgekeurd. **M8b verandert dat contract niet**. Schema- en implementatieafhankelijkheden moeten vóór Codex-codering opnieuw op de dan actuele branch worden gecontroleerd.

---

## 1. Doel en ontwerpbesluit

De editor moet een **meetkundig exact en dynamisch parallellogram** kunnen maken op basis van twee aangrenzende zijden en hun ingesloten hoek. Wanneer bronpunten verschuiven of de instelbare zijde/hoek wijzigt, blijft de figuur een parallellogram. Zijde-, hoek-, omtrek- en oppervlaktewaarden worden uit dezelfde opgeloste geometrie afgeleid.

### 1.1 Eén bestaand objecttype, één rekenwaarheid

- **Resultaatobject:** één bestaand `polygon`-object met **exact vier hoekpunten**, in vaste volgorde `A, B, C, D`.
- **Constructie:** één nieuw getypeerd recept in de bestaande `ConstructionService`, **niet** een nieuw vrij aanpasbaar `parallelogram`-objecttype en **niet** vier afzonderlijk opgeslagen lijnen en/of hoekpunten.
- **Bronnen:** twee reeds bestaande, geautoriseerde puntobjecten `A` en `B` (ook punten die zelf dynamisch geconstrueerd zijn, mits geldig). De tweede zijlengte en ingesloten *gerichte* hoek zijn constructieparameters.
- **Herberekening:** via de bestaande dependency graph. `PolygonGeometry`, `MeasurementUnits`, `renderer`, `SnapService`, `ToolCatalog`, `PermissionRuntime`, `history` en documentexport blijven gezaghebbend voor hun bestaande verantwoordelijkheden.
- **Verboden:** zelfstandig parallellogram-rekenpad in de UI, onbeheerde modelmutaties, ongekoppelde hulpobjecten, een tweede renderer, een tweede permissielaag of impliciete conversie naar een ander objecttype.

### 1.2 Expliciete scope

**Binnen M8b:** constructie uit twee puntbronnen plus gekozen/ingevoerde lengte en hoek; live preview; exacte numerieke invoer; bronherberekening; stabiele selectie en bronvolgorde; maatweergave; styling/lagen/groepen; zoom/snap/hit-test; ongeldigheid en herstel; documentopslag; undo/redo; bestaande dynamische meetobjecten en polygongebieden; beperkte gebruikersrechten; SVG/PNG/JSON; volledige milestone-acceptatie.

**Buiten M8b:** een tweede recept **via drie permanent gekoppelde bronpunten** (mogelijk later `M8b+`, afzonderlijk akkoord), automatische vierhoekherkenning, vrije sleepgrepen op berekende hoekpunten, willekeurige hoekpuntgewijze vervorming die parallellogram-eigenschap kan schenden, gekoppelde transformaties van M7, constraint solver, symbolische lengtes/algebra, zelfstandige diagonalen/hoogtelijnen, verzamelingen en andere kegelsneden. Rechthoeken, ruiten en vierkanten zijn **bijzondere waarden** van dezelfde constructie; er komen geen nieuwe objecttypes voor.

## 2. Wiskundige definitie en invarianten

### 2.1 Parameters

Gegeven twee bronpunten `A=(Aₓ,Aᵧ)` en `B=(Bₓ,Bᵧ)` met `A≠B`, een zijlengte `L>0` en een gerichte hoek `θ` van de vector `AB` naar `AD`, waarbij `−π<θ<π`, `θ≠0` en `sin θ ≠ 0` (binnen numerieke resolutie):

\[
\mathbf v=B-A,\quad a=\|\mathbf v\|,\quad
\mathbf u=\frac{\mathbf v}{a},\quad
\mathbf w=L\begin{pmatrix}\cos\theta&-\sin\theta\\\sin\theta&\cos\theta\end{pmatrix}\mathbf u.
\]

Definieer:

\[
D=A+\mathbf w,\qquad C=B+\mathbf w.
\]

De gesloten vierhoek loopt in de opgeslagen volgorde `A → B → C → D → A`. Het getekende punt `Q` bij de derde plaatsingsklik levert eenmalig de beginparameters `L=|Q−A|` en `θ=atan2(cross(B−A,Q−A),dot(B−A,Q−A))`, maar `Q` is **geen opgeslagen of blijvend gekoppelde derde bron**.

**Belangrijke semantiek:** bij het verslepen van `B` blijft `L` in modelcoördinaten vast en blijft de gerichte hoek ten opzichte van de **nieuwe** richting `AB` gelijk. De zijde `AB` kan dan van lengte veranderen, maar de zijde `AD` blijft `L`. Dit is niet hetzelfde als het achteraf verslepen van een onafhankelijk derde bronpunt; dat is bewust buiten scope.

### 2.2 Invarianten en metingen

Voor iedere geldige figuur geldt, onafhankelijk van zoom en opgeslagen beeldpunten:

- `B−A = C−D` en `D−A = C−B` (gelijke, evenwijdige tegenoverliggende zijdevectoren).
- `|AB|=|CD|=a`, `|AD|=|BC|=L`.
- De diagonalen hebben hetzelfde midden: `(A+C)/2=(B+D)/2`; numeriek berekenen in een lokale oorsprong.
- `∠DAB=|θ|` als binnenhoek (in radialen; gebruikersweergave volgens documenthoekeenheid). De binnenhoek bij `B` is `π−|θ|`.
- De omtrek `P=2(a+L)` en de niet-negatieve oppervlakte `S=aL|sin θ|`.
- `|AC|²=a²+L²+2aL cosθ` en `|BD|²=a²+L²−2aL cosθ` (optionele testinvarianten; geen verplichte UI-eigenschappen in deze milestone).
- Zowel met `θ>0` (tegenwijzerzin) als `θ<0` (wijzerzin) is de figuur geldig. Het teken bepaalt de oriëntatie, **niet** de gerapporteerde oppervlakte.
- Dezelfde `A`, `B`, `L` en `θ` leveren steeds dezelfde vier hoekpunten; **geen verborgen toestand**, geen afhankelijkheid van preview- of sleepgeschiedenis.

**Bijzondere gevallen zonder apart type:** `|θ|=90°` geeft een rechthoek; `a=L` geeft een ruit; beide tegelijk geven een vierkant. Gebruik eventuele toleranties alleen voor informatieve classificatie, nooit om de parameters stilzwijgend af te ronden of de geometrie aan te passen.

### 2.3 Rekennauwkeurigheid en degeneratie

- Modelwaarden zijn JavaScript binary64 met de bestaande limiet `|x|, |y| ≤ 10¹²`. Alle broncoördinaten, `L`, `θ`, tussenvectoren, hoekpunten, afstanden, oppervlakte en gemapte numerieke outputs moeten eindig zijn. Geen `NaN`, `Infinity`, clamping of stilzwijgend overstromen.
- Gebruik `Math.hypot` en lokale verschilvectoren. Vorm `D=A+w`, `C=B+w` en controleer alle vier werkelijk berekende hoekpunten tegen de limiet. Gebruik de bestaande schaal-/normalisatietechnieken voor wiskundige controles; geef geen numerieke garanties die binary64 niet kan waarmaken.
- Hergebruik de huidige `PolygonGeometry.validate` voor geldige niet-kruisende vierhoeken. **Calibreer** extra condities voor bijna nul-lengte en bijna collineariteit met bestaande polygonvalidatie en onafhankelijke numerieke fixtures; vervang de bestaande globale tolerantie niet zonder apart regressieonderzoek.
- `θ` wordt intern bewaard in **radialen**, als eindige getypeerde waarde in het open interval `(-π,π)`. Exact `0`, `±π` en waarden die binnen de gekozen numerieke policy niet van collineariteit te onderscheiden zijn, zijn ongeldig. Het paneel toont/aanvaardt expliciet graden of radialen volgens de bestaande documentinstellingen.
- Nieuwe invoer `L≤0`, een ongeldige hoek of een ongeldige berekende figuur wordt **vóór commit afgewezen**; geen gedeeltelijke wijziging. Een reeds bestaande constructie kan daarentegen *tijdelijk ongeldig* worden doordat `A` of `B` dynamisch samenvalt of brongeometrie ongeldig wordt.
- In zo'n tijdelijke ongeldigheid blijven constructie- en object-ID bewaard; geen oude zichtbare figuur, afgeleid label of meetwaarde. Bij herstel wordt dezelfde figuur opnieuw berekend. Reeds gematerialiseerde hoekpunten in interne/backward-compatible opslag zijn **nooit** een vervanging voor de actuele constructie-resolver of een reden om oude geometrie aan restricted gebruikers te tonen.

**Voorgestelde foutcodes:** `VALID`, `SOURCE_INVALID`, `INVALID_REFERENCE`, `COINCIDENT_BASE_POINTS`, `INVALID_SIDE_LENGTH`, `DEGENERATE_PARALLELOGRAM`, `NUMERIC_UNRESOLVED`, `NON_FINITE_RESULT`, `COORDINATE_LIMIT`, `PERMISSION_DENIED`. De implementatie koppelt deze aan bestaande fout- en invalidatieconventies; labels van foutcodes zijn voorstel, geen bestaande API-claims.

## 3. Gebruikerservaring en interactie

### 3.1 Gereedschap en primaire aanmaakroute

**Plaatsing:** *Constructies → Vierhoekconstructies → Parallellogram via zijde en hoek*, of een passende, gelijkwaardig ingedeelde bestaande Constructies-subgroep. Het gereedschap is alleen *implemented* nadat er een werkende geautoriseerde commandroute is. De gedeelde `ToolCatalog` is de enige gereedschapsbron voor sidebar, fullscreen en contextueel radiaalmenu.

1. Kies **Parallellogram via zijde en hoek**.
2. Selecteer **bestaand punt A** als eerste hoekpunt.
3. Selecteer **bestaand punt B** als aangrenzend hoekpunt; de preview toont zijde `AB`.
4. Beweeg de pointer naar een voorlopig punt `Q`. De preview toont `A–B–C–D`, lengte `AD` en gerichte hoek. `Q` bepaalt slechts de initiële parameters en wordt niet automatisch als punt gecreëerd.
5. Bevestig door een derde klik, of voer **exact numeriek** `L` en de hoek in en bevestig vanuit dezelfde previewstap. Eén bevestiging leidt tot **één geautoriseerd constructiecommando en één undo-stap**.

Kies `A` en `B` via bestaande bronreferenties; voor deze eerste variant **uitsluitend volledige `point`-objectreferenties** (`{objectId}`), geen willekeurige polygonvertex, halve lijn of as. Hetzelfde object mag niet tweemaal als bron gekozen worden. Als twee verschillende punten dezelfde coördinaten hebben, kan de gebruiker niet geldig bevestigen.

**Annuleren:** Escape, toolwissel, blur, pointercancel, nieuw document, reset en dispose ruimen de voorlopige interactie zonder schrijfcommando op. Selectie, pans, canvasgeschiedenis en pointer capture blijven consistent met de bestaande toolcontrollers. Voor een nog ongeldige preview wordt geen definitieve creatie toegelaten.

**Contextueel radiaalmenu:** als een geldige puntbron geselecteerd is, mag `ConstructionService.contextualPlans` de eerste bron voorinvullen. `placement` na twee bronnen moet een **expliciet geautoriseerde en geteste** interactiestap gebruiken; laat het generieke `complete`-pad **niet automatisch** al na `B` committen. Gebruik `EditorApp.startContextConstruction` en de bestaande `construction.create`-route, zonder tweede voorinvul- of modelmutatie-engine.

### 3.2 Eigenschappen en bewerken

De geselecteerde afgeleide vierhoek gebruikt het **bestaande zwevende eigenschappenpaneel** in de donkerblauw/gouden gedeelde UI-PANEL-1-stijl; geen herintroductie van een permanente rechterkolom. In *Geometrie*:

| Veld | Aard | Gedrag |
|---|---|---|
| `A`, `B` | bronreferenties, alleen lezen in M8b | tonen wanneer rechten dit toelaten, inclusief bronstatus |
| `|AB|` | berekend, alleen lezen | wijzigt wanneer een bronpunt beweegt |
| `|AD| = L` | **bewerkbare constructieparameter** | positieve lengte, eenhedenconversie exact eenmaal; geautoriseerd author-commando |
| `∠DAB` | **bewerkbare gerichte parameter** | intern `θ` in rad; UI kiest links-/rechtsdraaiing en toont `|θ|` in actuele hoekeenheid |
| `|BC|`, `|CD|` | berekend, alleen lezen | gelijk aan `L` resp. `|AB|` |
| `∠ABC` | berekend, alleen lezen | `π−|θ|` |
| Omtrek | berekend | bestaande `MeasurementUnits.figureValue` / formatter |
| Oppervlakte | berekend | bestaande `MeasurementUnits.figureValue` / formatter; documentschaal² **eenmaal** |

Stijlvelden (randkleur, dikte, vulling, opacity, naam, showLabel, zichtbaarheid en lock) blijven bestaande propertycommando's. `locked` blokkeert directe gebruikerbewerking maar **niet** de herberekening wanneer een geautoriseerd bronpunt wijzigt. De vierhoek zelf en de berekende vertices `C`, `D` zijn **niet direct vrij versleepbaar**. Een wijziging van `L` of `θ` verloopt uitsluitend via een expliciet gevalideerd constructieparametercommando. Misbruik `construction.setParameter` voor gekoppelde padpunten niet als die API alleen één padpositie beheert; voeg een klein getypeerd parameterveldcommando toe en toets permissions/undo apart.

**Uitwisselen van A en B** is geen triviale naamwijziging: het kan de constructieoriëntatie en de positie van `C`, `D` veranderen. In M8b is bronvolgorde daarom vast tijdens de constructie; een later “wissel bron”-commando vraagt aparte acceptatie.

### 3.3 Live lengte- en hoekaanduiding

- Toon de twee **verschillende** zijlengtes (`a=|AB|` en `L=|AD|`) en ten minste de **ingesloten binnenhoek `|θ|`** als live read-only gegevens in het paneel.
- Hergebruik `MeasurementGeometry` en de individuele `object.measurements`-instellingen uit GEO-UI. Implementeer geen aparte M8b-weergave of betekenis voor `showMeasurement`.
- Stel voor nieuwe M8b-objecten de metingen `side:0`, `side:3` en `angle:0` standaard zichtbaar in. Deze tonen respectievelijk `AB`, `AD` en de binnenhoek bij A. Andere zijden, hoeken, omtrek en oppervlakte blijven afzonderlijk instelbaar via dezelfde meetinstellingen.
- Behoud voor deze labels de bestaande zichtbaarheid, precisie, tekstmodus, labelpositie en verplaatsbaarheid. Gebruik geen extra persistente punt-, lijn- of tekstobjecten per label. De labels volgen de actuele opgeloste polygonvertices en worden met bestaande meet- en hoekformatters weergegeven.
- De bewerkbare gerichte constructieparameter `θ` blijft onderscheiden van de zichtbare **binnenhoek** `|θ|`. De labelwaarde is afgeleid van polygongeometrie; zij is geen opslagplaats of editor voor de gerichte parameter.
- Houd labels toetsenbord- en screenreader-veilig, zonder canvaspointerevents over te nemen of ongeautoriseerde waarden te tonen.

### 3.4 Rechten, organisatie, kopiëren en ontkoppelen

- Selecteerbaarheid en bewerkbaarheid volgen bestaande `PermissionRuntime` en autoritatieve commando's. Voor gecreëerde polygonen gelden het geldende `createdObjectRules.polygon`-beleid plus nieuwe expliciete tool/source grants.
- Bronpunten blijven afzonderlijk selecteerbare objecten. Bij bronverplaatsing herberekenen alle dependents topologisch; bij verwijderen van een bron volgt de bestaande cascade met herstelfunctie via undo.
- Dupliceren van een gekoppelde vierhoek volgt het bestaande beleid: een onafhankelijk, vertaald **polygon-snapshot** zonder constructiekoppeling; dat snapshot hoeft bij latere vrije hoekpuntwijziging niet langer parallellogram te blijven. Dit onderscheid moet in de UI begrijpelijk zijn. Een beschikbare “constructie losmaken”-actie heeft dezelfde bewuste ontkoppeling.
- Reeds bestaande polygon-edge- en vertexreferenties voor volgende constructies blijven gekoppeld aan de **stabiele vertexindexen 0=A, 1=B, 2=C, 3=D**. Voor gekoppelde gebieden, perimeter/area, `pointOnSegment`, snapping en lagen is dit essentieel. Een bronbeweging mag vertexindexen nooit herschikken.

## 4. Architectuur-, commando- en opslagcontract

### 4.1 Bestaand constructierecept en documentfragment

De productiecode gebruikt dit recept. `vertices` zijn afgeleide polygongeometrie; de autoritatieve constructiegegevens blijven twee puntbronnen plus `sideLength` en `signedAngle`. Bij nieuwe parallellogrammen zijn alle tien bestaande individuele meetinstellingen standaard verborgen; eerder opgeslagen instellingen blijven ongewijzigd.

```json
{
  "type": "polygon",
  "id": "polygon-21",
  "vertices": [
    {"x": 0, "y": 0},
    {"x": 4, "y": 0},
    {"x": 5.5, "y": 2.598076211353316},
    {"x": 1.5, "y": 2.598076211353316}
  ],
  "measurements": {
    "schema": 1,
    "values": {
      "side:0": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "side:1": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "side:2": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "side:3": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "angle:0": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "angle:1": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "angle:2": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "angle:3": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "perimeter": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0},
      "area": {"visible": false, "precision": null, "mode": "computed", "text": "", "dx": 0, "dy": 0}
    }
  },
  "construction": {
    "kind": "parallelogramBySideAngle",
    "sources": [
      {"objectId": "point-A"},
      {"objectId": "point-B"}
    ],
    "sideLength": 3,
    "signedAngle": 1.0471975511965976
  }
}
```

`vertices` zijn de **op het moment van oplossen berekende** materialisatie die het bestaande polygon-ecosysteem nodig heeft. De autoritatieve bron is uitsluitend `sources + sideLength + signedAngle`; bij load, replay en wijziging worden de vertices door `ConstructionService` opnieuw opgelost. Genereer geen tweede canonieke maat- of vertexopslag. Geen bronpunt voor `Q`, geen in JSON opgeslagen preview, oppervlakte, formatteruitkomst of schermcoördinaten.

Het recept is strikt: exacte bronaantallen/rollen en parameterkeys, getypeerde, eindige waarden, geen onbekende sleutels, geen as- of willekeurige partreferenties, geen cycli. Een nieuw constructiecommando voert **alle** validatie inclusief permissies vóór de atomaire commit uit. Het voorgestelde tool-ID is `construct:parallelogramBySideAngle`; de commandroute blijft `construction.create` met expliciet getypeerde `sideLength`/`signedAngle`-velden. Codex moet zo nodig de bestaande commandpayload **klein en veilig** uitbreiden, niet parameterdata langs ongevalideerde object properties doorsmokkelen.

### 4.2 Versies: afstemmen met goedgekeurd M8a-contract

De actuele `origin/main` is gecontroleerd op commit `1c787c52ad24d01c5bcd161ebc1c4f27608e7460`. De code gebruikt documentversie 10 met `measurementSchema:1` voor individuele metingen, documentversie 9 met `ellipseSchema:1` voor ellipsen en `constructionSchema:7` voor `ellipseByFociAndPoint`. REG-2 gebruikt documentversie 8 en constructieschema 5. M8a-1, M8a-2 en M8a-1b zijn bestaande code, geen toekomstig voorstel.

Voor M8b:

1. Een extra objecttype of eigen `parallelogramSchema` is **niet nodig**. Het resultaat blijft een bestaand polygon met bestaande GEO-UI-meetinstellingen.
2. Reserveer **`constructionSchema:8`** voor het recept `parallelogramBySideAngle`. Een reader die schema 8 niet kent, weigert het document atomair en zonder downgrade.
3. M8b vereist op zichzelf **geen documentversie 11**. Documentversie 10 met `measurementSchema:1` blijft van toepassing wanneer de individuele `object.measurements`-instellingen zijn opgeslagen. Documentversies blijven bepaald door de aanwezige featurecombinatie volgens de bestaande hoogste-feature-regels.
4. Ondersteun gemengde documenten met M8a, REG-2, GEO-UI en M8b. Breid `model.js`-acceptatietabellen, schema-combinatieregels, schrijver, importer, restricted projectie en roundtriptests uit zodat M8b-schema 8 naast M8a, regio’s en metingen geldig is. Verhoog feature-specifieke controles naar schema 8 waar dit betekent “schema 8 of hoger”; behoud checks die een vereist recept exact identificeren.
5. Behoud alle bestaande legacy-importgaranties en bestaande interpretatie van documenten v1–v10, ellips- en regiorecepten en oude metingen. Onbekende schema’s of onbegrepen constructies worden fail-closed afgewezen, nooit stilzwijgend gedowngraded.
6. Deze vastgelegde matrix is de verplichte implementatiebasis; zij autoriseert geen wijziging aan M8a- of REG-2-semantiek buiten compatibiliteitsuitbreidingen.

### 4.3 Teken-/snaphandhaving

- `ConstructionService.contract('parallelogramBySideAngle')`: `resultType:'polygon'`, bronrollen `['point','point']`, uitsluitend hele puntobjecten; het result-object gebruikt bestaande dependency-resolve/recovery.
- Voor een **geldige** vierhoek gebruiken `renderer` en `hit-testing` de bestaande polygoncontour; afzonderlijke SVG-lijnen of pathcaches zijn niet nodig. Vulling, rand en renderorde volgen polygonregels. Zichtbare annotaties zijn apart afgeleide presentatie.
- `SnapService` ziet vier vertex-kandidaten en vier randsegmenten via bestaande polygonregels. Verwijder geen kandidaten door een extra `parallelogram`-type te introduceren. Self/downstream-snap uitsluitingen blijven bestaan.
- Een vrije plaatsingspositie gebruikt het bestaande punt-/object-/raster-snapbeleid; de parallellogramworkflow voegt uitsluitend een hoekgebonden snap op exact `+π/2` en `−π/2` toe. Een bestaand, geautoriseerd punt `Q` binnen de bestaande puntselectietolerantie en numerieke invoer gaan vóór deze hoeksnap. `Q` blijft een eenmalige plaatsingspositie, geen opgeslagen bron.
- Gebruik de huidige lagen-/groepsvolgorde, bewaar `fill:'none'` waar expliciet gekozen; `region`/`polygonRegion` blijft een afzonderlijke bronafhankelijke gebiedsconstructie indien gewenst.
- JSON roundtrip, SVG en offline PNG gebruiken dezelfde actuele resolved vertices; geen verborgen hulppunten of onjuiste zelfkruising bij `θ<0`.
- Maandelijkse/latere meetfuncties mogen niet uit geformatteerde tekst rekenen; `figureValue(polygon,'area'|'perimeter')` blijft de eigenaarsroute, inclusief schaling door `MeasurementUnits.format`.

### 4.4 Restricted gebruikers en bronlekken

Het gereedschap mag alleen aangeboden/gebruikt worden wanneer het actuele permissieprofiel de tool en beide bronrollen toestaat. Controleer `read`, `display`, `sourceTools`, `createdObjectRules.polygon`, source-epoch, revision, directe en indirecte effecten, documentbudgets en historygrenzen. Controleer **opnieuw bij finaliseren**, niet alleen bij preview. Een niet-toegankelijke, verborgen, verwijderde of ingetrokken bron mag niet via contour, label, getoonde parameters, ARIA, SVG, PNG, JSON, clipboard, cache, foutrapport of radiaalmenu uitlekken. Een mislukte commandvalidatie is atomair; bij onbekende schema- of permissiegevallen **fail closed**.

## 5. Onafhankelijke mathematische acceptatiefixtures

| Geval | Bronnen/parameters | Vereiste uitkomst |
|---|---|---|
| Scheve standaard | `A=(0,0)`, `B=(4,0)`, `L=3`, `θ=+60°` | `D=(1.5,3√3/2)`, `C=(5.5,3√3/2)`, `P=14`, `S=6√3`, binnenhoek B `120°` |
| Rechthoek | `A=(1,2)`, `B=(5,2)`, `L=3`, `θ=+90°` | `D=(1,5)`, `C=(5,5)`, `P=14`, `S=12` |
| Spiegeloriëntatie | `A=(0,0)`, `B=(4,0)`, `L=3`, `θ=−60°` | `D=(1.5,−3√3/2)`, `C=(5.5,−3√3/2)`, zelfde positieve oppervlakte `6√3` |
| Ruit | `A=(0,0)`, `B=(5,0)`, `L=5`, `θ=+60°` | alle zijden 5, `P=20`, `S=25√3/2` |
| Vierkant | `A=(0,0)`, `B=(2,0)`, `L=2`, `θ=+90°` | `C=(2,2)`, `D=(0,2)`, `P=8`, `S=4` |
| 90° gedraaide zijde | `A=(0,0)`, `B=(0,4)`, `L=3`, `θ=+90°` | `D=(−3,0)`, `C=(−3,4)`, `P=14`, `S=12` |
| Bronwijziging | wijzig `B=(4,0)` naar `(8,0)` bij `L=3`, `θ=60°` | `D` blijft `(1.5,3√3/2)`; `C=(9.5,3√3/2)`; oppervlakte verdubbelt, `L`/`θ` blijven |
| Collineariteit | `θ=0`, `θ=±180°` of numeriek onoplosbaar | geen commit of recoverable invalid, nooit een geldig parallellogram met nuloppervlakte |
| Samenvallende bronnen | `A=B` door bronverplaatsing | tijdelijke ongeldigheid met stabiele ID, geen oude zichtbare maatlabels, herstel mogelijk |

**Controle-instructie:** onafhankelijke tests moeten de verwachte waarden als afzonderlijk berekende orakels vastleggen en niet de productieformule simpelweg opnieuw kopiëren.

Aanvullend: kleine/grote geldige modelschalen, coördinaten rond ±10¹², cancellation, `L` extreem klein/groot, hoeken dicht bij `0/π`, bronverwijdering, lokale translatie, routewisseling van hoekeenheid en begrensde seeded invarianttests. Rapporteer per geval zowel ruwe geometrie als geformatteerde waarde.

## 6. Testimpact en regressiematrix

**Testimpactmatrix voor implementatie:** classificeer per geraakte bestaande test `ongewijzigd`, `uitbreiden`, `contractueel aanpassen` of `vervangen`, met oorspronkelijke garantie, nieuwe verwachting, onafhankelijke tegencontrole en risico. Een rode test door echt defect gedrag wordt opgelost in **productiecode**, nooit door versoepeling van een assertion. M8b-0b heeft de bestaande ellipsbrowserflow contractueel bijgewerkt; dit is geen M8b-functionaliteit.

### 6.1 Nieuwe gerichte Node-tests

1. Wiskunde: standaard-, geroteerde-, spiegel-, rechthoek-, ruit- en vierkantfixtures; elke vector-, diagonaal- en oppervlakte-invariant.
2. Bronnen: precies twee geldige hele puntbronnen, bronvolgorde, duplicate IDs, ongeldige/ontbrekende bronnen, acyclische dependency, bronketens, topology-stabiliteit en beide oriëntaties.
3. Parameters: `L>0`, radiaal/graduele inputconversie, signed hoekbeleid, verboden extra keys, typechecks, niet-eindige waarden, veel te kleine hoeken, coördinatenlimiet en recoverable invalid/recovery.
4. Integratie: `PolygonGeometry.validate`, polygonmetingen, `polygonRegion`, `pointOnSegment` met vaste randen, `referencesForRole`, bijwerken van afgeleide objecten.
5. Commando/geschiedenis: één creatie-undo, twee atomair bewerkbare parameters, wijziging van bronnen, undo/redo, replay, duplicatie-snapshot, detach, cascade-delete, lagen/groepen, lock.
6. Schema: `constructionSchema:8`, documentversie 10/`measurementSchema:1` wanneer individuele metingen aanwezig zijn, legacy v1–v10, documenten met/zonder M8a en REG-2, mixed roundtrip, atomair afwijzen van onbegrepen readers, restricted JSON zonder bronlek en geen half gecommitte import.
7. Beveiliging: denied source/created-object grants, ingetrokken rechten, verborgen bron, gewijzigde epoch, indirecte effecten, DOM/exportredactie en geen afgeleide stale waarden.

### 6.2 Gerichte Edge-tests

1. Aanklikken A→B→Q, correcte preview en één creatiecommando; numerieke L/hoek vóór confirm; foutieve preview niet commitbaar.
2. Annulering: Escape, pointercancel, toolwissel, blur, reset, fullscreen, dispose. Geen verborgen preview, spookpunten, pointer captures of extra undo-stappen.
3. Bron A/B verslepen: correcte vierhoek, live lengte/hoek/oppervlakte; hoekoriëntatie behouden wanneer AB roteert; herstel na tijdelijke coincidentie.
4. Paneel: bestaande navy/gold-layout, precieze input, graden/radialen, `side:0`/`side:3`/`angle:0`-standaardlabels, individuele overige metingen, label/naam, vulling/geen vulling, lock, permissies en focus.
5. Selectie, viewport/zoom, 4 hoeken/4 randen snap, geen zelf- of downsteam-feedback, verborgen laag, groepsselectie, contextmenu en touchscreen-/keyboardpaden voor zover ondersteund.
6. JSON save/reload, SVG en offline PNG, gebiedsopvulling + metingen, restricted read/denial, mixed documenten, nul page errors/console exceptions.

### 6.3 Efficiënte testvolgorde

Gebruik **gerichte wiskundige Node-fixtures tijdens ontwikkeling**, daarna gerichte browserinteractie en integratietests; voer **de volledige Node- en Edge-suites aan de mergepoort** uit, en opnieuw na een relevante correctie. Geen volledige suite na elke cosmetische bewerking. Per bestaande testwijziging: leg oorzaak en behouden invariant vast. Werkelijke PASS/FAIL-aantallen, runs, platform, exacte commando's en beperkingen worden gedocumenteerd; geen fictieve resultaten.

## 7. Uitvoering in kleinere mijlpalen (na ontwerpgoedkeuring)

| Stap | Scope | Stop-/acceptatiepoort |
|---|---|---|
| **M8b-D — Ontwerp** | Dit contract, UX, mathematische semantiek, beveiliging, versiebeleid en testmatrix | **Gebruiker keurt ontwerp expliciet goed; geen code** |
| **M8b-0 — Read-only technische planning** | Controleer actuele branch, status M8a/schema's; verifieer bestaande command-/render-/snapcontracten; lever impactmatrix, versievoorstel en uitvoeringsplan | Afgerond; afzonderlijke GO vereist voor M8b-1 |
| **M8b-0b — Preflightblokkades oplossen** | Werk verouderde ellipsbrowserflow bij zonder regressieverzwakking; actualiseer dit contract met GEO-UI-meet- en schema-afspraken; voer voorgeschreven suites uit | Afgerond; resultaten in [M8b-0b-rapport](M8b-0b-STABILIZATION-REPORT.md); geen M8b-productiecode |
| **M8b-1 — Dynamisch vierhoekrecept** | `parallelogramBySideAngle`, A/B/Q-interactie en numerieke parameters, recoverable invalid, bestaand polygon-renderpad, JSON/history/permission | Gerichte Node/Edge PASS en gebruikersbeoordeling |
| **M8b-2 — Meetweergave en integratie** | Twee lengte-/hoeklabels, inspector, live maten, overige polygoncontructies, styling, snapping, restricted en mixed schema's | Gerichte Node/Edge PASS en visuele gebruikersacceptatie |
| **M8b-3 — Consolidatie** | Volledige suites, legacy/mixed roundtrip, regressie-audit, docs, exact rapport, acceptatiescenario's | **Expliciete GO/NO-GO vóór merge naar `main`** |

Voor de uitvoering: nieuwe featurebranch vanaf een **op dat moment geverifieerde** `main`-basis, geen overlap met open M8a-wijzigingen, géén automatische merge. Vanwege afhankelijkheidsconcurrentie is het niet verstandig M8a en M8b tegelijk aan dezelfde schema- en constructiebestanden te laten wijzigen. Parallel **ontwerpen** mag wel; parallel **implementeren** alleen na concrete branch-/schema-isolatie.

## 8. Beslispunten voor gebruikersgoedkeuring

1. **Aanmaakmethode:** kies twee bestaande punten `A`,`B`, vervolgens een derde *plaatsingsklik* `Q` voor initiële `L`/`θ`, of typ die waarden exact in dezelfde stap; `Q` wordt geen bronpunt.
2. **Dynamiek:** `L` en `θ` blijven vast bij verplaatsing van `A/B`; `|AB|` is bronafhankelijk. Het resultaat heeft vier vaste vertexindexen.
3. **Objectmodel:** één gekoppeld `polygon` van vier punten, geen nieuw geometrisch objecttype.
4. **Hoekbeleid:** gerichte `θ` met beide draairichtingen, intern radialen, gebruikersweergave in de gekozen hoekeenheid; nul/180° zijn ongeldig.
5. **Maten:** hergebruik `MeasurementGeometry` en individuele `object.measurements`; bij nieuwe parallellogrammen zijn **alle** individuele labels standaard verborgen. De tien polygonmetingen blijven individueel instelbaar. Er is geen aparte M8b-implementatie van `showMeasurement`.
6. **Versiebeheer:** `constructionSchema:8`; geen nieuw objecttype, `parallelogramSchema` of documentversie 11 uitsluitend voor M8b. GEO-UI-metingen gebruiken documentversie 10/`measurementSchema:1`.
7. **Scopegrens:** drie *blijvend* gekoppelde bronpunten en vrij slepen van berekende hoekpunten blijven aparte latere uitbreidingen.
8. **Proces:** ontwerpacceptatie **is geen Codex-implementatieautorisatie**; eerst M8b-0, dan afzonderlijke GO voor M8b-1, geen ongeautoriseerde merge.

9. **Hoeknotatie:** zichtbare individuele polygonbinnenhoeken krijgen een afgeleide geometrische boog; exact 90° gebruikt een rechtehoekmarkering. De waarde/tekst blijft een individueel versleepbaar GEO-UI-label. De boog is geen opgeslagen object en `signedAngle` blijft apart van de binnenhoek.
10. **Naamresolutie:** parallellogramvertex 0/1 gebruikt live de werkelijke namen van de A/B-bronobjecten; vertex 2/3 krijgt de weergavenamen C/D. Zijde- en hoeklabelnamen worden uit deze vier namen afgeleid. Generieke automatische bronnamen mogen bij aanmaak naar A/B worden hernoemd wanneer geen naamconflict bestaat en het bestaande naamcommando is geautoriseerd; bewuste namen blijven staan.
11. **Randcontext:** polygonranden worden via de bestaande `{objectId,part:"edge",index}`-referentie en contextuele constructieplannen gebruikt. Rand-middenpunten refereren aan de twee stabiele vertexindices; `pointOnSegment` bewaart de parameter. Geen permanente losse lijnstukken.

**Besluitgeschiedenis:** 15 oktober 2026: v1.0.0 als ontwerpbasis goedgekeurd. 16 oktober 2026: v1.1.0 legde GEO-UI-metingen en versiebeleid vast. 16 oktober 2026: v1.2.0 wijzigt nieuwe parallellogramlabels naar standaard verborgen en voegt de goedgekeurde hoekboog, naamresolutie, tijdelijke bestaande-Q-plaatsing, ±90°-snap en polygonrandcontext toe. Schema 8/documentversie 10 blijven ongewijzigd. Dit contract op zichzelf markeert geen branch als geaccepteerd of geïntegreerd.

## 9. Bronbasis en herkomst van besluiten

**Repo-onderbouwde bestaande feiten:**

- [`docs/DEVELOPMENT-ROADMAP.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/DEVELOPMENT-ROADMAP.md): M8b staat gepland voor twee zijden/hoek, live maten, degeneraties/roundtrip en finale milestone-gate.
- [`docs/FEATURE-BACKLOG.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/FEATURE-BACKLOG.md): parallellogram met twee zijden, ingesloten hoek, exacte invoer en evenwijdigheidsinvariant.
- [`AGENTS.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/AGENTS.md), [`docs/CORE-1-ARCHITECTURE-DESIGN.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/CORE-1-ARCHITECTURE-DESIGN.md): één document-/constructiewaarheid, ToolCatalog, contextconstructie, rechten en geautoriseerd commandpad.
- [`construction-service.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/construction-service.js): sourceRoles, resolver, dependents, `triangleFromPoints`, `construction.setParameter`-gerelateerde bestaande paden.
- [`polygon-geometry.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/polygon-geometry.js), [`model.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/model.js): polygonvalidatie, vierhoekvertices, bestaande versie/constructie-schemaregels.
- [`measurement-geometry.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/measurement-geometry.js), [`renderer.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/renderer.js), [`snap-service.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/snap-service.js): polygonmetingen, contourweergave en vertices-/rand-snapping.
- [`permission-runtime.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/permission-runtime.js): geautoriseerde creatie, constructieparameters en bronrechten.
- **Goedgekeurde M8a-basis:** lokaal opgesteld document `M8a-Ellipsen-Ontwerpcontract-v1.0.0.md`, door gebruiker in dit project op 15 oktober 2026 goedgekeurd; **geen claim** dat zijn nieuwe schema's al op `main` zijn geïmplementeerd.

**Implementatiestatus:** M8b-1 is op `main`; M8b-2 is geïmplementeerd op de niet-geaccepteerde M8b-2-featurebranch. M8b-2b betreft aanvullende acceptatiewijzigingen op een afzonderlijke featurebranch en is niet in de basisbranch geïntegreerd zolang gebruikersacceptatie ontbreekt.
