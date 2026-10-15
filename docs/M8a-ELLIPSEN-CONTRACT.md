# From Zero 2 Infinity — Wiskundige Illustratie Editor
## M8a — Dynamische ellipsen: wiskundig, functioneel en technisch ontwerpcontract

**Documentversie:** 1.0.0 — **als ontwerp goedgekeurd op 15 oktober 2026**  
**Datum:** 15 oktober 2026  
**Repository:** [`Geert1985/wiskundige-illustratie-editor`](https://github.com/Geert1985/wiskundige-illustratie-editor)  
**Gecontroleerde basis:** `main` op `63ab45acc7e94b120a5fb052840c199816399afd`  
**Status:** goedgekeurd ontwerpcontract; geen implementatie- of mergeautorisatie en geen tests uitgevoerd door deze publicatie  
**Roadmappositie:** M8a — Ellipsen; behoud M7a–c (starre transformaties) en M8b (parallellogram) ongewijzigd.

---

## 1. Doel, leveringen en scope

Een ellips wordt een **zelfstandig, selecteerbaar geometrisch object** waarvan de actuele vorm uitsluitend afhangt van twee bestaande getypeerde brandpunten en een positieve, in modelcoördinaten opgeslagen **afstandsom**. Het object heeft een stabiele ID en integreert in de bestaande `ConstructionService`, dependency graph, toolcatalogus, command-/permission-runtime, documentvalidatie, viewporttransformatie, geschiedenis en SVG/PNG-export. Een daarop geconstrueerd punt blijft dynamisch op de ellips.

De roadmap noemt vier expliciete M8a-onderdelen:

1. Brandpunten en afstandsom.
2. Punt-op-ellips en brandpuntbewerking.
3. Hit testing, snapping, rendering en import/export.
4. Eigen testen, documentatie en gebruikersacceptatie.

**Binnen scope:** tweebrandpuntenconstructie, instelbare afstandsom, bronwijziging en herstel, punt op ellips met parameter, objectstijl/naam/zichtbaarheid/lock, elementaire geometrische eigenschappen, nauwkeurige SVG-contour, selectie/snapping op de ellips, JSON/undo/replay, beperkte toegang en exports. De oppervlakte `πab` wordt als read-only eigenschap en optionele bestaande meetwaarde voorbereid; toevoeging aan het bestaande *Meten & analyseren* gebeurt alleen als dezelfde bron-/permissiesemantiek aantoonbaar wordt behouden.

**Buiten M8a:** parabool/hyperbool (afzonderlijk M8c/M8d-ontwerp), algemene kegelsneden op basis van kwadratische vergelijkingen, ellips-ellips/ellips-lijnsnijpunten, brandpunt- of raaklijnconstructies als aparte objecten, loci, analytische functiegrafieken, driedimensionale sneden, exacte symbolische omtrek, matrixtransformaties en willekeurige affiene ellipsbewerking. Deze uitbreidingen worden niet stilzwijgend als M8a-onderdeel geïmplementeerd.

## 2. Wiskundig contract

### 2.1 Definitie en parameters

Gegeven brandpunten `F₁=(x₁,y₁)` en `F₂=(x₂,y₂)` en een eindige afstandsom `S>0` is de ellips de verzameling

\[
E=\{P\in\mathbb R^2:\|P-F_1\|+\|P-F_2\|=S\}.
\]

Definieer

\[
C=F_1+\tfrac12(F_2-F_1),\quad 2c=\|F_2-F_1\|,\quad a=S/2,
\]
\[
b=\sqrt{(a-c)(a+c)},\qquad e=c/a.
\]

Een niet-ontaarde ellips vereist `S > 2c`, equivalent met `a > c`, en `a,b > 0`. Dan is `0 ≤ e < 1`. Bij `S = 2c` bestaat slechts het brandpuntsegment als grensgeval, **geen valide M8a-ellips**; bij `S < 2c` bestaat geen punt dat aan de definitie voldoet.

Voor `c>0`: `u=(F₂−F₁)/(2c)` is de eenheidsvector in de richting van de grote as en `v=(-u_y,u_x)` de loodrechte eenheidsvector. Bij samenvallende brandpunten (`c=0`) is de ellips een cirkel met straal `a`; kies canoniek `u=(1,0)`, `v=(0,1)` zonder verborgen historietoestand.

De contour heeft parametrisatie

\[
P(t)=C+a\cos(t)u+b\sin(t)v,\qquad t\in[0,2\pi).
\]

Hierin is `t` de **ellipsparameter** (*eccentric anomaly*), niet de poolhoek rond het centrum en niet de booglengteparameter. De oppervlakte in modelcoördinaat² is exact `A=πab`. Een eventuele weergegeven fysieke oppervlakte gebruikt éénmaal de bestaande documentschaal² en eenheidsformatter.

### 2.2 Regressie-invarianten

Voor ieder geldig punt `P(t)` geldt, binnen onafhankelijk vastgelegde numerieke tolerantie:

- `|P−F₁| + |P−F₂| = S`;
- `((P−C)·u/a)² + ((P−C)·v/b)² = 1`;
- `a≥b>0`, `c²=a²−b²`, `0≤e<1`;
- uiterste grote-as-punten `C±au` en kleine-as-punten `C±bv`;
- bronvolgorde omwisselen wijzigt **de ellips als verzameling niet**; de parameterisatie van een gekoppeld punt kan hierdoor wel heroriënteren en krijgt een aparte test.

Rotatie en translatie van de bronnen veranderen de intrinsieke eigenschappen `a`, `b`, `e`, `S` en `A` niet. Zoom/pan veranderen nooit modelwaarden.

### 2.3 Numerieke veiligheid

Gebruik JavaScript binary64 met lokale translatie/normalisatie en `Math.hypot` voor afstanden. Bereken `b` **via `(a−c)(a+c)`**, niet door onbeheerst `a*a-c*c` af te trekken. Bereken het centrum als `F₁ + (F₂−F₁)/2` om onnodige som-overflow te vermijden. Controleer iedere tussen- en eindwaarde op eindigheid.

Bestaande modelcoördinatenlimiet `|x|,|y|≤10¹²` blijft gelden. Controleer niet alleen brandpunten en centrum, maar de **volledige ellips-extremen**:

\[
X_{\max}=\sqrt{(au_x)^2+(bv_x)^2},\quad
Y_{\max}=\sqrt{(au_y)^2+(bv_y)^2}.
\]

De waarden `C_x±Xmax` en `C_y±Ymax` moeten binnen de bestaande limiet vallen. Geen clamping en geen stilzwijgende afvlakking.

Maak onderscheid tussen exact degeneratief (`S≤2c`), numeriek niet oplosbaar bij onvoldoende machineprecisie, niet-eindige uitkomst en overschrijding van de coördinatenlimiet. **Voorstel om te kalibreren in tests:** een zeer dunne ellips met `a−c` binnen circa `32·Number.EPSILON·max(a,c)` krijgt `NUMERIC_UNRESOLVED` in plaats van een schijnnauwkeurige contour; dit is een ontwerptolerantie, geen universele wiskundige grens. Gebruik schaalrelatieve criteria, nooit een willekeurige absolute grens op `S` die kleine maar geldige illustraties uitsluit.

Samenvallende brandpunten blijven een **geldige cirkelvormige ellips**. De richting `u` wordt dan canoniek de positieve x-as. De parametrisatie van een gekoppeld punt kan daardoor precies bij dit grensgeval verspringen; meld dit expliciet en maak de uitkomst deterministisch, zonder geheime sleepgeschiedenis. Een toekomstig contract kan optioneel continue puntparametertracking ontwerpen.

### 2.4 Tijdelijke ongeldigheid

Wanneer de **brandpunten** zodanig worden verplaatst dat `S≤2c` of een numeriek veiligheidscriterium faalt, blijft de ellips-ID behouden, maar verdwijnt de verouderde contour en verdwijnen afgeleide metingen/gekoppelde puntposities. Na herstel wordt alles opnieuw berekend via de dependency graph. Een **handmatige S-wijziging** die onmiddellijk een ongeldige toestand zou opslaan, wordt vóór commit geweigerd met uitleg; dit verschilt van tijdelijk ongeldige bronverplaatsingen.

Voorgestelde statussen: `VALID`, `SOURCE_INVALID`, `INVALID_REFERENCE`, `DEGENERATE_ELLIPSE`, `SUM_TOO_SMALL`, `NUMERIC_UNRESOLVED`, `NON_FINITE_RESULT`, `COORDINATE_LIMIT`, `PERMISSION_DENIED`. Exacte codes en UI-teksten zijn onderdeel van de implementatiereview.

## 3. Interactie- en UX-contract

### 3.1 Ellips construeren

**Gebruikersroute:** *Vrije objecten* blijft voor bestaande vrij getekende objecten; het nieuwe gereedschap **Ellips via twee brandpunten** hoort onder *Constructies* als afgeleide geometrie.

1. Kies het gereedschap.
2. Klik een bestaand getypeerd punt `F₁`.
3. Klik een bestaand getypeerd punt `F₂`.
4. Beweeg de muis om de vorm te bepalen. Het voorlopige punt `Q` legt `S=|Q−F₁|+|Q−F₂|` vast; de preview toont de werkelijke ellips. `Q` wordt **geen derde opgeslagen bronpunt**.
5. Klik om te bevestigen; commit gebeurt als één geautoriseerd constructiecommando met één undo-stap. Een optionele numerieke invoer van `S` vóór commit is toegestaan wanneer die dezelfde validatie gebruikt.

Bij `Q` op het brandpuntsegment is `S=2c`; toon een niet-commitbare degeneratieve preview. Bij `F₁=F₂` leidt de gekozen afstandsom tot een cirkelvormige ellips. Escape, toolwissel, nieuw document, blur, pointercancel en dispose moeten voorlopige toestand annuleren zonder documentmutatie.

De selectiecontroller en bestaande radiale `ConstructionService.contextualPlans` bepalen welke bronpunten bruikbaar zijn. Voor de derde **plaatsingsstap** is een expliciete, geteste gespecialiseerde adapter toegestaan; bouw geen tweede constructiemachine en voorkom automatisch committen na alleen twee bronklikken.

### 3.2 Ellips bewerken

- Bestaande brandpunten verslepen: ellips en gekoppelde punten herberekenen live; bronpunten blijven zelfstandige objecten.
- Ellips selecteren: naam, zichtbaarheid, vergrendeling, randkleur, lijndikte, patroon en optionele vulling gebruiken bestaande stijl-/propertycommando's.
- **Afstandsom S** is via het eigenschappenpaneel te wijzigen door een expliciet getypeerd, author-only constructieparametercommando; dit is **geen rechtstreekse mutatie** van afgeleide `cx`, `cy`, `a`, `b` of rotatie.
- Optionele read-only eigenschappen: `F₁`, `F₂`, centrum `C`, `S`, grote halve as `a`, kleine halve as `b`, excentriciteit `e`, exacte oppervlakte `πab`. Toon afstanden/eindwaarden via de bestaande documentschaal- en eenhedenlogica. Maak duidelijk dat de volledige grote as `2a` is, niet `a`.
- Direct slepen van de ellips als geheel is geblokkeerd zolang het een gekoppelde constructie is. Duplicatie, groepsverplaatsing en source-ID-remapping volgen het bestaande dependencybeleid en worden apart getest.

### 3.3 Punt op ellips

Onder *Constructies* een tweede gereedschap **Punt op ellips**:

1. Kies een bestaande, geldige ellipsbron of start vanuit het radiaalmenu op de ellips.
2. Klik nabij de ellipscontour. De dichtstbijzijnde geldige ellipspositie bepaalt de genormaliseerde parameter `p∈[0,1)` met `t=2πp`.
3. Maak één afhankelijk `point`-object met een stabiele ID en opgeslagen bronreferentie + `p`.
4. Bij slepen van dit punt verandert alleen de **parameter** via het bestaande gekoppelde-padmechanisme; de bronellips wordt niet geometrisch verplaatst.
5. Bij verplaatsing van de brandpunten of wijziging van S blijft `p` behouden en wordt de positie opnieuw berekend.

Het kiezen van de dichtstbijzijnde positie vereist een begrensde numerieke zoekprocedure voor de **werkelijke Euclidische afstand tot de ellips**; uitsluitend de poolhoek met `atan2` gebruiken is onvoldoende. Gebruik deterministische tie-breaks, expliciete tolerantie, maximaal aantal iteraties en eindigheidscontroles. Bij een klik exact in het centrum kan een meerduidige dichtstbijzijnde positie ontstaan: de bronselectie moet een gedocumenteerde deterministische keuze maken of de klik als ambigu weigeren; nooit willekeurige branches.

De circulaire grens `p→1/0` moet bij dragging zonder verouderde positie werken. Er is geen koppeling aan booglengte in M8a.

## 4. Architectuurcontract

### 4.1 Eén model, één graaf, geen parallelle engine

Voeg getypeerd `ellipse` toe aan `IllustrationModel`. Voor M8a bestaat dit object **alleen als gekoppelde constructie**. Maak een zuivere, UI-onafhankelijke `EllipseGeometry`-service voor validatie, parameters, contourpunten, extrema, oppervlakte en dichtstbijzijnde-puntprojectie; `ConstructionService` blijft exclusief eigenaar van recepten, bronrollen, dependency resolution, invalid/recovery en computed fields. SVG, snapping, inspector en exports consumeren dezelfde afgeleide geometrie.

Voorgestelde recepten (contractnamen voorlopig):

```json
{
  "kind": "ellipseByFociAndSum",
  "sources": [{"objectId":"F1"},{"objectId":"F2"}],
  "sumDistance": 10
}
```

```json
{
  "kind": "pointOnEllipse",
  "sources": [{"objectId":"E1"}],
  "parameter": 0.25
}
```

`sumDistance` wordt opgeslagen in **modelafstand**, niet in schermpixels of naar fysieke eenheden omgerekend in de geometrische kernel. De UI mag de waarde via het bestaande `MeasurementUnits`-contract weergeven en bij author-invoer precies eenmaal omrekenen. Laat het voorgestelde `sumDistance`-veld niet zonder expliciete command- en normalisatievalidatie meelopen op het oudere generieke `parameter`-pad van punt-op-segment/cirkel.

### 4.2 Object en documentformaat: voorlopig schemabesluit

**Voorstel voor goedkeuring vóór code:**

- `type:'ellipse'` met eigen ID, stijl, naam, zichtbaarheid, lock, laaglidmaatschap, labelvelden en getypeerd constructierecept.
- Berekende `ellipseGeometry`, `a`, `b`, `e`, `area`, contour en hit-testcaches **niet als onafhankelijke opgeslagen waarheid** opnemen. Actuele waarden komen van de bronnen na import/replay.
- `document.version: 9` zodra een ellips aanwezig is, `ellipseSchema: 1` en `constructionSchema: 6` wanneer nieuwe M8a-recepten aanwezig zijn. Een eventueel aanwezige REG-2-regio behoudt zijn `regionSchema:1`, bestaande gestructureerde tekst zijn `textSchema` en lagen/groepen hun eigen schema's.
- `constructionSchema:6` moet ook geldige recepten uit 1–5, asreferenties en expliciete hoekarmen accepteren; de importeur weigert inconsistente combinaties atomair. Een document zonder M8a-object behoudt dezelfde schema-afleiding als vóór M8a.
- Oude readers die v9, `ellipseSchema:1` of constructionSchema 6 niet begrijpen, moeten atomair weigeren; geen impliciete downgrade naar polygonen of SVG-paden.
- Legacydocumenten v1–v8 behouden betekenis en blijven leesbaar. Restricted export leidt versie/schemas af uit **alleen geprojecteerde**, toegestane objecten en recepten.

De combinatie *ellips + REG-2-regio + rijke tekst + asreferenties + lagen* is een verplichte integratietest. Documentversie 9 en schema 6 zijn hier **een ontwerpvoorstel**, geen bestaand productiecontract; eventuele afwijking vereist aparte expliciete review.

### 4.3 Renderer, selectie, snap en export

- Render één wiskundig correcte ellipse-contour via SVG `<ellipse>` met centrum, twee schaalgetransformeerde halve assen en **correcte rotatie bij de omgekeerde SVG-y-as**. Geen 64-zijdige bronpolygonisatie.
- Canvascoördinaten en export gebruiken dezelfde `CoordinateTransform`; de SVG-ellipse mag geen verschuivende boog of foutief geroteerde as tonen. Test ook rotaties bij 0°, 45°, 90° en 135°.
- Stijl, opacity, showLabel, laagvolgorde en `fill='none'` worden beheerd via bestaande renderer/stijlpaden. Een gevulde ellips mag niet onbedoeld tot een `region` worden geconverteerd.
- Hit testing gebruikt de werkelijke elliptische afstand in **CSS-schermpixels** en de bestaande selectieprioriteit. Bij `fill='none'` is de rand selecteerbaar, niet zomaar het hele binnengebied. Bij een expliciete vulling mag interieurselectie alleen als dat strookt met bestaand modelgedrag.
- Snap op de ellipscontour is een **virtueel kandidaatpunt**, geen opgeslagen documentobject en geen onbeperkte samplelijst. Respecteer uitsluiting van eigen/downstream-objecten, verborgen/vergrendelde bronregels, snaptolerantie en constructiecontext.
- SVG en offline PNG moeten overeenkomen met de canvasgeometrie en mogen geen ongeldige path-attributen of stale geometry bevatten. Bewaar een vaste renderbudget- en foutgrens.
- M8a introduceert geen algemene ellips-lijn/ellips-ellipsintersectie. De bestaande snappers mogen dit niet onterecht claimen.

### 4.4 Autorisatie

Twee nieuwe ToolCatalog/command-IDs (namen voorlopig):

- `construct:ellipseByFociAndSum` — bronnen: twee hele `point`-objecten; expliciete `read`, `display`, `sourceTools` en rechten voor het nieuw aangemaakte `ellipse`-object.
- `construct:pointOnEllipse` — bron: een hele `ellipse` met dezelfde autorisatie-eisen; aangemaakt objecttype `point`.

M8a-geometrie en constructieparameters blijven author-only bewerkbaar tenzij een later getypeerd leerparametercontract wordt goedgekeurd. Stijl- en labelwijzigingen werken uitsluitend via bestaande property grants; niet via een vrij intern kernelpad. Bij ingetrokken rechten of ontbrekende/verborgen bron wordt ellips, geconstrueerd punt en afgeleide numerieke informatie geredigeerd volgens bestaand restricted-beleid. Geen bron-ID's, geheime geometrie of maten via SVG, PNG, JSON, ARIA, tooltips, DOM, clipboard, historische caches of foutdetails. Controleer capabilities opnieuw vóór commit en vóór export.

## 5. Testimpact vóór implementatie

Maak als eerste technische tussenresultaat een **testimpactmatrix** van bestaande tests die behouden of door de goedgekeurde uitbreiding aangepast moeten worden. Verander nooit een oude verwachting om louter een FAIL te laten verdwijnen. Leg per aangepaste assertion uit welk formeel contract veranderd is en welke oude garantie behouden blijft.

### 5.1 Onafhankelijke gouden fixtures

| Geval | Bronnen en instelling | Onafhankelijke verwachting |
|---|---|---|
| Klassieke ellips | F₁=(-3,0), F₂=(3,0), S=10 | C=(0,0), a=5, b=4, c=3, e=0,6, A=20π |
| Parametervoorbeeld | vorige ellips, p=0,25 | P=(0,4); beide brandpuntafstanden 5 |
| Geroteerde ellips | F₁=(0,-3), F₂=(0,3), S=10 | a=5, b=4, uiteinden grote as (0,±5) |
| Cirkelgrensgeval | F₁=F₂=(0,0), S=10 | a=b=5, e=0, A=25π, canonieke oriëntatie |
| Degeneratie | F₁=(-3,0), F₂=(3,0), S=6 | geen geldige ellips; herstel na S>6 |
| Onmogelijke som | dezelfde brandpunten, S=5 | `SUM_TOO_SMALL`; geen gefingeerde contour |
| Translatie | vorige klassieke ellips plus (+1000,-2000) | gelijke a,b,e,area; verplaatst centrum |
| Rotatie | identieke ellips geroteerd met 45° | zelfde intrinsieke waarden; SVG-contour en hit-test liggen goed |

Gebruik onafhankelijke formules als testorakel, seeded property-tests binnen geldige numerieke bereiken en expliciete extremescenario's rond machineprecisie/coördinatenlimieten. Vermijd pixel-only tests die een wiskundige fout kunnen maskeren.

### 5.2 Verplichte Node-/Edge-matrix

**Node:** object- en schema-validatie; beide recepten; gesloten sourceRoles; exacte fixturewaarden; schaal- en precisiepresentatie; `p`-normalisatie en de 0/1-grens; nearest-pointprojectie en tie-break; focusvolgorde; degeneratie en herstel; verbonden bronketens; dupliceren/remapping; cascade, undo/redo, replay; lock; invalid/revoked projection; mixed v9-documenten; v1–v8 legacy; atomair afwijzen van onbekende velden/schemas; finite SVG.

**Edge:** twee focuspunten kiezen + derde bevestigingsklik; live preview en Escape; numerieke S-invoer, direct slepen van F₁/F₂ en S-wijziging; ellips geen directe drag; punt op contour creëren/verslepen; precieze randselectie bij zoom en verschillende rotaties; snap/zelfsnapping; contextueel radiaalmenu, propertypaneel, labels; fullscreen en touch/keyboard waar ondersteund; stijlen/geen vulling; lagen; JSON, SVG en offline PNG; restricted zonder DOM-/exportlek; paginafouten `[]`.

**Testvolgorde:** gerichte Node-fixtures → gerichte browserinteracties → module-integratie → volledige Node-suite → volledige Edge-suite **eenmaal aan de mergepoort** en opnieuw na een daadwerkelijke productiefix. Alleen documentatiecorrecties zonder gedragswijziging vragen niet automatisch twee volledige runs. Meld elke werkelijk gewijzigde bestaande test en de reden.

## 6. Milestones en expliciete goedkeuringspoorten

| Stap | Leveren | Gate |
|---|---|---|
| **M8a-D — Ontwerp** | Dit ontwerpcontract, semantiek, schema, UX, toegangs- en testimpactmatrix | Gebruiker en technische review keuren contract expliciet goed; **geen code** |
| **M8a-1 — Ellipsbron** | Getypeerd ellipse-object, tweebrandpuntenrecept, S-invoer, dynamiek, SVG, JSON/undo/permissies | Onafhankelijke Node/Edge-verificatie en praktische gebruikersacceptatie |
| **M8a-2 — Punt op ellips** | Parameterpunt, dichtstbijzijnde contourprojectie, slepen, snapping, alle historiek- en toegangsregels | Onafhankelijke Node/Edge-verificatie en gebruikersacceptatie |
| **M8a-3 — Consolidatie** | Oppervlakte/eigenschappen, hardening, mixed-doc compatibiliteit, volle regressie en rapport | GO/NO-GO en pas daarna merge |

Bij elke stap: aparte branch vanaf een gecontroleerde `main`-commit, bounded commits, rapport in `docs/`, geen ongevraagde refactoring of andere kegelsnedefamilies. De eerste Codex-opdracht na goedkeuring is **uitsluitend** een concrete implementatieplanning en testimpactanalyse voor M8a-1; nog niet M8a-1 t/m M8a-3 tegelijk.

## 7. Beslispunten voor expliciete ontwerpgoedkeuring

1. **Voorkeursinteractie:** twee bestaande brandpunten plus een derde *plaatsingsklik* om `S` te bepalen; de plaatsingsklik maakt geen bronobject. Alternatief: eerst numeriek S invoeren.
2. **Cirkelgrensgeval:** samenvallende brandpunten blijven een geldige ellips (cirkel) met canonieke oriëntatie; wees expliciet over mogelijke parameteroriëntatiesprong voor gekoppelde punten.
3. **Opslagvoorstel:** nieuwe type/versie 9, `ellipseSchema:1` en `constructionSchema:6`, met strikte compatibiliteit en gemengde schema's.
4. **Uitbreidingen:** de oppervlakte `πab` is toegestaan als read-only meetwaarde; exacte ellipsomtrek, ellipslijnsnijpunten en raaklijnen worden uitgesteld.
5. **Volgorde:** eerst ellipsconstructie, daarna punt-op-ellips, daarna afronding/acceptatie; parabool en hyperbool blijven afzonderlijke vervolgcontracten.

**Besluit 15 oktober 2026:** ontwerp goedgekeurd; Codex maakt eerst uitsluitend een gerichte testimpact- en implementatieplanning. Dit document creëert zelf geen implementatie- of mergeautorisatie.

## 8. Gecontroleerde bronbasis

- [`docs/DEVELOPMENT-ROADMAP.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/DEVELOPMENT-ROADMAP.md): M8a als ellipsen-milestone; brandpunten, afstandsom, punt-op-ellips, hit/snap/render/import/export; M7 voor transformaties.
- [`AGENTS.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/AGENTS.md): één geometrische/documentwaarheid, één constructiegraaf en gedeelde ToolCatalog/commandgrens.
- [`construction-service.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/construction-service.js): typed `sourceRoles`, dependency- en construction-resolver, huidige recepten.
- [`model.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/model.js), [`permission-runtime.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/permission-runtime.js): gesloten objecttypen, huidige versie- en schrijf-/auth-grenzen.
- [`renderer.js`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/renderer.js), [`POLYGONS.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/POLYGONS.md): bestaande objectrendering, selectie, snapping en exportconventies.
- [`docs/CORE-1-ARCHITECTURE-DESIGN.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/CORE-1-ARCHITECTURE-DESIGN.md) en [`docs/REG-1-CONTRACT.md`](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/REG-1-CONTRACT.md): hergebruik servicegrenzen en bestaande versionerings-/permissieprincipes.

**Bronstatus:** de genoemde punten uit roadmap en repository zijn gecontroleerde bestaande uitgangspunten. Nieuwe receptnamen, elliptische numerieke policies, docversie 9/schema 6, UX en fasering zijn **goedgekeurde ontwerpuitgangspunten**, niet reeds aanwezige productiecode; definitieve schema-aanpak vereist preflight.
