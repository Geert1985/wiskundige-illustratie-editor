# WIE — M8-INT.1: Snijpunt lijn–ellips — ontwerp- en implementatiecontract

**Documentversie:** 1.0.1
**Datum:** 17 oktober 2026  
**Status:** **ontwerpcontract goedgekeurd door gebruiker op 17 oktober 2026** — uitvoerbaar uitsluitend met afzonderlijke Codex-opdracht; geen merge-GO  
**Project:** From Zero 2 Infinity — Wiskundige Illustratie Editor (WIE)  
**Repository:** [Geert1985/wiskundige-illustratie-editor](https://github.com/Geert1985/wiskundige-illustratie-editor)  
**Basis:** M8-INT-ontwerpcontract v1.1.0 (statusgecorrigeerd naar v1.1.1), M8a-ellipscontract v1.1.0, M8-INT.0 geïntegreerd op main via PR #27.  
**Doel:** lijn–ellips toevoegen aan het **bestaande** universele gereedschap `Snijpunt`, zonder een tweede tool of tweede geometrie-engine.

> **Besluitgrens.** Dit is een zelfstandig fasecontract, uitgewerkt op basis van de reeds goedgekeurde M8-INT-gebruikersafspraak: **twee ondubbelzinnige bronnen kiezen → onmiddellijk alle geldige, afzonderlijke snijpunten construeren**. Het vastleggen van dit document geeft Codex nog geen toestemming productiecode te wijzigen. Implementatie, featurebranch, schemawijziging en merge vereisen een afzonderlijke GO. Bestaande M8-INT.0-functionaliteit blijft ongewijzigd.

---

## 1. Doel en productgedrag

M8-INT.1 ondersteunt het snijpunt van **één reeds ondersteunde lineaire bron** en **één reeds geïmplementeerd ellipsobject**. Zowel vrije als geometrisch geconstrueerde ellipsen zijn geldig als zij actueel niet ongeldige geometrie hebben.

De gebruiker gebruikt uitsluitend de zichtbare ingang **Constructies → Puntconstructies → Snijpunt** (`construct:intersection`):

1. Selecteer een lijn, rechte, halfrechte, vector, maatlijn, specifiek gekozen veelhoekzijde of ellips; de eerste bron is nog geen documentmutatie.
2. Selecteer het tweede geschikte object, ongeacht bronvolgorde. Bij overlappende objecten wordt **alleen de bedoelde bron** verduidelijkt.
3. Zodra beide bronnen eenduidig gekozen en geautoriseerd zijn, bepaalt WIE **0, 1 of 2** eindige, unieke en domeingeldige snijpunten.
4. Bij één of twee geldige uitkomsten maakt WIE **alle uitkomsten in één atomaire history-transactie** als afzonderlijke afhankelijke `point`-objecten.
5. Bij nul uitkomsten geeft WIE een begrijpelijke status; er wordt **geen** leeg commando, object of history-item opgeslagen. Het gereedschap blijft gereed voor een volgende constructie.

**Niet toegestaan:** kandidaatselectie, een extra knop *Snijpunten maken*, een aparte zichtbare tool *Snijpunt lijn–ellips*, een onbevoegde preview, automatische aanmaak van nieuwe punten bij latere bronverplaatsing of een nieuwe generieke persistente `construction.kind:'intersection'`.

**Visuele acceptatie:** na implementatie is **Constructie → Snijpunt** vanuit de geselecteerde ellips beschikbaar wanneer de gebruiker daartoe gerechtigd is. De omgekeerde start (lineaire bron eerst) werkt identiek; bij polygonen blijft de **specifieke aangeklikte zijde** de bron. Cirkel–ellips en ellips–ellips zijn nog **niet** ondersteund en vallen onder M8-INT.3.

## 2. Afbakening en verifieerbare huidige basis

### 2.1 Bestaande componenten op main

- `intersection-dispatcher.js` classificeert momenteel lijn–lijn, lijn–cirkel en cirkel–cirkel; gemengde bronvolgorde wordt genormaliseerd vóór het persistente recept.
- `editor.js` biedt bronkeuze, bronambiguïteitsafhandeling, `intersectionSourceOptions`, `acceptIntersectionSource`, `intersectionContextPlans` en één commandotransactie na tweede bron.
- `construction-service.js` definieert bronrol `line`, bronrol `ellipse`, `referenceOptions`, `referencesForRole`, `contextualPlans`, `evaluate`, `resolve`, `validate` en `MI.AxisReferences`.
- `EllipseGeometry.fromDefinition(object)` levert bij een geldige ellips de canonieke `center`, `a`, `b`, een orthonormaal assenpaar `u/v`, rotatie en bounds. De geometrie komt van het **actuele ellipsobject**; een geconstrueerde ellips wordt niet via zijn brandpuntobjecten rechtstreeks als bron opgeslagen.
- `LinearGeometry` bewaart de domeinen van `straight`, `ray`, `line`, `vector`, `dimension` en veelhoekranden; `ConstructionService.line` kan een gekozen `polygon.edge` naar zijn actuele eindpunten oplossen.
- Het bestaande `Engine.constructIntersection` en het geautoriseerde `construction.create`-pad ondersteunen meerdere oplossingen in één model-/historytransactie en behouden branchidentiteit.
- De huidige documentwriter kent `constructionSchema` tot en met **9**, onder meer voor de dynamische `matchAB`-parallellogramvariant. Een extra recept is dus **niet** stilzwijgend compatibel met oudere lezers; modelwriter, importer, permissie-export, validatie en replay moeten gelijkgericht worden aangepast.

Deze opsomming is een gecontroleerde **ontwerpbasis**, geen claim dat `lineEllipseIntersection` al bestaat. Codex moet bij uitvoeringsstart `origin/main` en de exacte code opnieuw read-only verifiëren.

### 2.2 Binnen scope

- Analytische, numeriek robuuste lijn–ellips-oplossingen: nul, één raakpunt of twee punten.
- Richtingsafhankelijke, persistente oplossingen `branch:0` en `branch:1`.
- Domeinfiltering van rechte, halfrechte, eindig lijnstuk, vector, maatlijn en expliciete polygonzijde.
- Beide bronvolgordes, ellips-eerst en lijn-eerst; contextueel aanbod vanuit ellips én lijn/zijde.
- Ondersteuning van cartesische x-/y-as **uitsluitend als lijnrol** na expliciete registratie en rechten-/roltests; geen niet-toegestane asmaterialisatie.
- Herberekening, tijdelijk ongeldige punten, recovery, downstream dependency, Undo/Redo, permissions, veilige import/export en schema-/legacycompatibiliteit.

### 2.3 Buiten scope

- Cirkel–ellips, ellips–ellips (M8-INT.3); parabool/hyperbool als nieuw objecttype (afzonderlijk contract); lijn tegen volledige polygoncontour; *Punt op object* (M-PATH); gevulde gebieden; numerieke CAS; SVG-snijpunten als vervanging voor modelruimtegeometrie; ongeautoriseerde wijzigingen van bestaande M8-INT.0-gedragingen.

## 3. Bron- en dispatchcontract

### 3.1 Gespecialiseerd persistent recept

```text
construction.kind:    lineEllipseIntersection
resultType:            point
sourceRoles:           ['line', 'ellipse']
computedFields:        ['x', 'y']
branches:              [0, 1]
extra parameters:      geen
sources[0]:            lineaire bron, polygon.edge of geautoriseerde cartesische as
sources[1]:            volledig ellipse-object met objectId; geen part/index
```

De externe zichtbare tool blijft `construct:intersection`. Het backend-commando gebruikt `construct:lineEllipseIntersection` als intern, getypeerd recept/tool-ID, conform de bestaande autorisatiearchitectuur. Er komt **geen** tweede zichtbare knop.

### 3.2 Getypeerde bronnen

| Bron | Referentie | Geometrisch parameterdomein |
|---|---|---|
| `straight` | `{objectId}` | Onbegrensde rechte |
| `ray` | `{objectId}` | Vanaf beginpunt, gerichte halfrechte |
| `line` | `{objectId}` | Gesloten lijnstuk |
| `vector` | `{objectId}` | Eindige, gerichte verbinding; géén oneindige drager |
| `dimension` | `{objectId}` | Eindige verbinding |
| `polygon.edge` | `{objectId, part:'edge', index}` | Specifieke eindige zijde, ook van driehoek/vierhoek |
| Cartesische x-/y-as | `{kind:'axis',frame:'cartesian',axis:'x'|'y'}` | Onbegrensd; **uitsluitend na contract- en permissionregistratie** |
| `ellipse` | `{objectId}` | Gehele ellipsomtrek, geen gevulde binnenzijde |

De dispatcher accepteert `[ellipse,line]` en `[line,ellipse]` in de UI, maar slaat altijd bronnen op als **`[line,ellipse]`**. De lijnrichting wordt **niet** stilzwijgend omgekeerd, omdat de richting de branchidentiteit bepaalt. Geen toegelaten combinatie gebruikt het volledige polygonobject als één lineaire bron.

### 3.3 Bronselectie en contextmenu

- Breid de bestaande `IntersectionDispatcher.classify/evaluate` uit, zonder de drie .0-recepten te veranderen.
- Haal bronopties via `ConstructionService.referencesForRole` en per recept toegelaten asreferenties op. Geen vrij te interpreteren objecttype-string uit UI-input.
- `EditorApp.intersectionSourceOptions` moet ellipsen als eerste én als tweede bron herkennen.
- `ConstructionService.contextualPlans`, bestaande radiale catalogus en `EditorApp.startContextConstruction` moeten een gekozen ellips als bron 1 kunnen invullen. De omgekeerde richting moet mogelijk blijven.
- Voor een geselecteerde polygonzijde wordt exact `part:'edge'` plus de oorspronkelijke `index` ingevuld en persistent bewaard; de volledige polygon selecteren is geen impliciete keuze voor één zijde.
- De bestaande `ToolCatalog` toont nog steeds **precies één** zichtbare tool *Snijpunt*. Sidebar, zoeken, fullscreen, contextuele UI en toetsenbord volgen dezelfde capability- en permissieregels.

## 4. Wiskundig model

### 4.1 Ellips in lokale coördinaten

Voor de gevalideerde ellips: centrum \(C\), halve assen \(a\ge b>0\), ortho-normale vectoren \(u\) en \(v\) met \(u\perp v\). Een modelpunt \(X\) ligt op de contour wanneer

\[
F(X)=\left(\frac{(X-C)\cdot u}{a}\right)^2+
\left(\frac{(X-C)\cdot v}{b}\right)^2-1=0.
\]

Laat de lijn gedefinieerd zijn door de gerichte bronpunten \(P,Q\), met \(d=(Q-P)/\|Q-P\|\). De oneindige drager is

\[
X(s)=P+s\,d .
\]

Met
\[
\alpha=\frac{(P-C)\cdot u}{a},\quad
\beta=\frac{(P-C)\cdot v}{b},\quad
p=\frac{d\cdot u}{a},\quad
q=\frac{d\cdot v}{b}
\]
volgt
\[
As^2+Bs+D=0,\quad
A=p^2+q^2>0,\quad
B=2(\alpha p+\beta q),\quad
D=\alpha^2+\beta^2-1.
\]

De wiskundige oplossing is onafhankelijk van schermzoom, SVG-curve, meeteenheden en viewport. De implementatie mag dezelfde resultaten robuuster met een genormaliseerde voetpunt-/chordmethode of stabiele kwadratische oplossingsformule berekenen.

### 4.2 Aantal unieke oplossingen

- Twee onderscheiden reële wortels: **twee** snijpunten.
- Reële dubbele wortel/raakpunt: **één** snijpunt.
- Geen reële wortels: **nul** snijpunten.
- Geen betrouwbare numerieke conclusie: **geen fictieve snijpunten**; geef `NUMERIC_UNRESOLVED` of een passende bestaand gecontracteerde status.

**Tangentiedetectie** gebeurt schaalbewust en residugecontroleerd. Een kleine negatieve discriminant door afronding wordt niet automatisch naar een raakpunt geklemd; evenmin worden echt twee zeer nabije reële snijpunten zonder onderbouwing samengevoegd.

### 4.3 Branchidentiteit vóór domeinfilter

Bepaal op de **onbegrensde, gerichte** lijn eerst de wortels \(s_0 \le s_1\):

- `branch:0`: kleinste gerichte lijnparameter \(s_0\).
- `branch:1`: grootste gerichte lijnparameter \(s_1\).
- Bij betrouwbare tangentie ontstaat **alleen branch 0** als uniek nieuw punt. Een reeds opgeslagen branch 1 blijft herstelbaar ongeldig met `MERGED_INTERSECTION`.
- Bij omkering van de **werkelijke lijnrichting** wisselen in een tweepuntsconfiguratie de geometrische branchpunten. Dat is de bestaande richtingssemantiek; wijzig niet stilzwijgend de bronrichting of bron-ID.
- Filter pas **na** deze branchtoewijzing tegen het objectdomein. Een lijnstuk of halfrechte kan uitsluitend `branch:1` bevatten: deze blijft `branch:1`, nooit hernummeren.

Voor een segment met bronpunten \(P,Q\) en lengte \(L=\|Q-P\|\) accepteer \(s\) binnen de bestaande domeintolerantie rond \([0,L]\). Een halfrechte accepteert \(s\ge0\) binnen dezelfde genormaliseerde regel; een rechte of toegelaten as accepteert alle eindige \(s\). Koppel de tolerantie aan de bestaande `LinearGeometry.accepts`-semantiek; maak geen apart afwijkend domeinsysteem.

### 4.4 Numerieke betrouwbaarheid

- Valideer `EllipseGeometry.fromDefinition` op de **actuele** brondefinitie; detecteer ontbrekende, cyclische of tijdelijk ongeldige geconstrueerde ellipsen via de bestaande resolver.
- Normaliseer de richting vóór algebra. Werk zoveel mogelijk in lokaal, getransleerd ellipscoördinatenstelsel; schaal termen zodat tussenresultaten niet onnodig over-/underflowen.
- Vermijd de instabiele standaardformule \((-B\pm\sqrt{\Delta})/(2A)\) zonder passende numerieke waarborgen; gebruik een stabiele twee-wortelprocedure of equivalente orthogonale projectie.
- Controleer kandidaatcoördinaten en intermediates op eindigheid en de bestaande \(|x|,|y|\le 10^{12}\)-limiet; controleer zowel de lijnresidu als \(|F(X)|\), met nauwkeurigheidscriteria die rekening houden met de conditionering van de invoer.
- Markeer een oplossing alleen als geldig wanneer de residuen én domeincontrole overtuigend slagen. Gebruik geen vaste absolute epsilon als universele tangentietest.
- Een gedegenereerde lijnrichting volgt de bestaande `DEGENERATE_DIRECTION`-regel; een gedegenereerde of ongeldige ellips geeft een passende, herstelbare bronstatus. Een numeriek onbeslisbaar bijna-raakgeval mag geen spookpunt genereren.
- Circle-shaped ellipse (\(a=b\)) en rotaties \(0^\circ,45^\circ,90^\circ,135^\circ\) blijven numeriek valide.

## 5. Dynamische constructie en lifecycle

1. **Durable recipe:** elk gecreëerd punt bewaart alleen het getypeerde recept, `sources:[line,ellipse]` en `branch`; `x/y` zijn afgeleid, niet rechtstreeks te bewerken.
2. **Bronbeweging:** na wijziging van lijn, veelhoekzijde of ellips worden alle bestaande afhankelijke snijpunten herberekend in de bestaande topologische resolver.
3. **Bij tangentie:** van twee reeds opgeslagen branches blijft één zichtbaar geldig; de samengevallen andere branch blijft met zijn **zelfde ID** en `MERGED_INTERSECTION` in het model.
4. **Bij verdwijnen:** een tak buiten het segmentdomein of zonder reële oplossing wordt `constructionValid=false` met bruikbare `reasonCode`. Bewaar oorspronkelijke `sources`, `branch`, `id`, naam, stijl, label, laag en dependenten.
5. **Herstel:** als de geometrie opnieuw geldig wordt, komt hetzelfde punt op dezelfde branch terug met dezelfde ID. Er worden nooit spontaan nieuwe, eerder niet aangemaakte branchobjecten gecreëerd.
6. **Ongeldige ellipsketen:** als de ellips van gekoppelde brandpunten en besturingspunt Q afhankelijk is, moet een tijdelijk ongeldige ellips `SOURCE_INVALID` downstream veroorzaken en volledig kunnen herstellen.
7. **Zichtbaarheid:** `visible=false` van een bron heeft de bestaande semantiek; verwar verborgen met ongeldig. Niet geautoriseerd zichtbaar maken of gebruiken wordt niet toegestaan.
8. **Delete/detach/rebind:** behoud bestaande cascade-, lock-, inspector-/rebind-, duplicatie- en historysemantiek. Rebind naar een andere geldige lijn of ellips mag branch-ID niet stilzwijgend herschrijven; cycluscontrole blijft verplicht.
9. **Rendering:** invalid branches mogen niet in canvas, SVG/PNG, hit/snap, exportprojecties of autorisatielekken zichtbaar worden.

## 6. Command, atomariteit en permissies

- Uitvoering gebeurt na tweede ondubbelzinnige bron via **één bestaand** `construction.create`-commando met `toolId:'construct:lineEllipseIntersection'` en de genormaliseerde getypeerde bronrefs.
- Zonder `selectedBranches` betekent: **alle actueel geldige takken maken**. Ongeldige tweede tak blokkeert een geldige eerste tak **niet**; een expliciet bestaande, intern geselecteerde ongeldige branch mag de transactie wel strikt atomair doen mislukken. Het universele gereedschap toont nooit zo'n individuele selectie.
- Herbereken en valideer tijdens definitieve uitvoering. **Geen gedeeltelijke commit** wanneer de autorisatie, het documentenrecht, het opgegeven recept of de source refs ongeldig zijn. Nul geometrische oplossingen is een niet-mutatieve status, geen history-entry.
- De runtime moet dezelfde grants toepassen op tonen, bronselectie, `toolAllowed` en uitvoeren. Bij onvoldoende recht voor alleen het nieuwe lijn–ellipsrecept mag de gebruiker geen elliptische snijpunten creëren, zelfs als andere snijpuntrecepten toegestaan zijn.
- `axisSourceTools` op x/y vereist expliciete grant voor `construct:lineEllipseIntersection`. Geen privilegeverhoging via de universele tool, contextmenu of een verzonnen `straight`-object.
- Geen ongeoorloofd lek van restricted ellipsgeometrie in kandidaatkeuze, status, inspector, hit-/snapindex of exports. `sourceTools`-beperking en documentrechten gelden ook bij tijdelijke bronstatuswijziging.

## 7. Documentformaat, schema en legacy

### 7.1 Nieuw persistent schema

M8-INT.1 voegt een nieuw opgeslagen recept `lineEllipseIntersection` toe. De **actuele basiswriter op main** gaat tot `constructionSchema:9`; daarvoor is een **nieuwe expliciete featuregate** nodig. Normatief voorstel:

- `constructionSchema:10` voor documenten die ten minste één `lineEllipseIntersection`-recept bevatten. Dit is een **voorstel voor de implementatie**, na read-only actualiteitsaudit te bevestigen; hergebruik geen schema 6/7/8/9 voor een nieuwe receptsoort.
- De gewone `document.version` en `ellipseSchema:1` volgen het bestaande documentwriterbeleid; **geen extra globale documentversieverhoging** uitsluitend omdat een snijpunt bestaat, tenzij een bewezen noodzakelijke reader-gate dit vereist.
- `constructionSchema:10` moet alle reeds geldige oudere constructiesoorten en combinaties kunnen verwerken, **ook** gemengde documenten met schema-9 `matchAB`-parallellogrammen, M8a-ellipsen, regio's, rijke tekst, hoeken, asreferenties en gekoppelde meetobjecten.
- De importeur valideert `construction.kind`, `sourceRoles`, exact `branch\in\{0,1\}`, toegelaten bronrefvelden en de correcte schemavereisten. Oude readers die schema 10 niet herkennen moeten het document **atomair afwijzen**, nooit de afhankelijke punten als statische vrijpunten downgraden.
- Documenten zonder dit nieuwe recept behouden de bestaande **minimaal noodzakelijke** `constructionSchema` en mogen door roundtrip niet ongewenst naar schema 10 worden gepromoveerd.
- Restricted `document.exportJSON` en exportprojecties bepalen hun schema op basis van uitsluitend de toegestane gerepresenteerde objecten; geen ongeautoriseerde dependency leakage.

### 7.2 Relatie met bestaande constructies

Oude M5b-recepten, M8-INT.0-commando's en M8a-ellipsen behouden hun naam, bronsemantiek, branch en schema-eisen. `lineEllipseIntersection` is een vierde getypeerde snijpuntsoort achter **hetzelfde zichtbare gereedschap**. Geen bulkdocumentmigratie of vervanging van bestaande `lineCircleIntersection`-recepten door het nieuwe type, ook niet bij een cirkelvormige ellips.

## 8. Onafhankelijke wiskundige acceptatiegevallen

Gebruik **onafhankelijk berekende exacte of analytische referenties**. De solver mag deze tests niet implementeren door dezelfde productieformule in de assertion nog eens uit te voeren.

| Test | Geometrie | Verwachting |
|---|---|---|
| INT-101 | \(x^2/25+y^2/9=1\), gerichte \(y=0\) van links naar rechts | \((-5,0)\) branch 0, \((5,0)\) branch 1 |
| INT-102 | Dezelfde ellips, rechte \(x=5\) | \((5,0)\), één raakpunt branch 0 |
| INT-103 | Dezelfde ellips, rechte \(y=4\) | Geen snijpunten; geen mutatie |
| INT-104 | Ellips geroteerd over \(45^\circ\), lijn door centrum onder \(45^\circ\) | Exact \(C\pm5u\); juiste tak bij beide lijnrichtingen |
| INT-105 | Ellips \(a=5,b=3\), segment \(x\in[0,6], y=0\) | Alleen \((5,0)\), **branch 1** |
| INT-106 | Ellips \(a=5,b=3\), ray start bij \((0,0)\) naar links | Alleen \((-5,0)\), **branch 1** voor een van \((0,0)\) naar links gerichte ray (de eerste wortel op de onbegrensde drager ligt buiten de ray) |
| INT-107 | Lijn van \((-6,3)\) naar \((6,3)\) raak aan \(a=5,b=3\) | \((0,3)\), branch 0, één object |
| INT-108 | Beweeg van twee snijpunten via tangentie naar geen oplossing en terug | IDs/branches/stijl/recept behouden; geen extra ID |
| INT-109 | Verplaats ellips via geconstrueerde F1/F2/Q en maak Q tijdelijk degeneratief | Downstream ongeldig, herstel met oorspronkelijke IDs |
| INT-110 | Zeer dunne valide ellips, grote maar legale offset, nagenoeg tangentie | Juiste residuen of `NUMERIC_UNRESOLVED`; nooit fantoompunten |
| INT-111 | Cirkelvormige ellips \(a=b=4\), verticale/horizontale lijnen | Correcte punten en branchvolgorde |
| INT-112 | Lijnstuk, vector, maatlijn, polygonrand op/naast eindpunt | Exact bestaande domeinsemantiek en oorspronkelijke branches |
| INT-113 | x-/y-as, indien geregistreerd voor lijnrol | Juiste asref, geen phantom object-ID; grant vereist |
| INT-114 | Omgekeerde UI-bronselectievolgorde ellips→lijn en lijn→ellips | Zelfde oplossing, opgeslagen bronnen altijd `[line,ellipse]` |
| INT-115 | Rebind van lijn/ellips; bron wissen/herstellen via Undo | Volledige dependency-/historyconsistentie |
| INT-116 | Mixed JSON met `lineEllipseIntersection`, `matchAB`-parallellogram en M8a-ellips | Geschikte nieuwe schema-featuregate, correcte replay/roundtrip |
| INT-117 | Oud document zonder lijn–ellips | Identieke bestaande schemakeuze en receptgedrag |
| INT-118 | Ongeldige branch, onbekende bronref, schema-9-document met nieuwe receptsoort | Atomaire importweigering |
| INT-119 | Restricted/locked, geautoriseerde en niet-geautoriseerde as/ellips | Geen command-, select-, context- of exportbypass |
| INT-120 | Sidebar/zoeken/fullscreen/radiaal, ellips- en polygonzijde-eerst | Eén tool, onmiddellijke constructie, toegankelijk bronambiguïteitsmenu |
| INT-121 | SVG/PNG/render/hit/snap tijdens ongeldige en herstelde branches | Alleen geldige, geautoriseerde punten zichtbaar |
| INT-122 | Lijn–lijn, lijn–cirkel, cirkel–cirkel uit M8-INT.0 | Geen regressie, ook tangent en alleen branch 1 |

**Branchcontrole INT-106:** voor de naar links gerichte lijn vanaf \((0,0)\) ligt \((5,0)\) op negatieve lijnparameter en is **branch 0**, maar buiten de ray; \((-5,0)\) is **branch 1** en ligt binnen de ray. Dit bevestigt dat branchnummering vóór domeinfiltering plaatsvindt.

## 9. UI- en browseracceptatie

Volg de reeds goedgekeurde M8-INT.0-bediening: eerste bron → tweede bron → alle geldige punten direct. Geen kandidaatmarker/-toggle of confirm, geen nieuwe menu-ingang. Na succesvolle creatie wordt de broninteractie afgesloten en keert WIE automatisch terug naar Selecteren; de nieuwe punten blijven geselecteerd. Bij nul geldige oplossingen blijft het gereedschap actief.

Verplicht handmatig én in Edge te verifiëren:

1. **Ellips → radiaalmenu Constructie → Snijpunt → rechte:** twee gekoppelde punten zonder extra bevestiging.
2. **Rechte → radiaalmenu Constructie → Snijpunt → ellips:** dezelfde oplossingen.
3. **Vierhoekzijde → Snijpunt → ellips** én **ellips → Snijpunt → specifieke vierhoekzijde**: dezelfde exact geadresseerde `polygon.edge`.
4. **Raaklijn → ellips:** één punt; bij uitwendige lijn geen punt en geen history-mutatie.
5. Verplaats een bron, heropen en exporteer een document, test Undo/Redo en een temporarily-invalid/recover-situatie.
6. Test bronambiguïteit, toetsenbord/ARIA, beperkte viewport, restricted mode en contextmenu-permissies.

## 10. Architectuur- en teststrategie

**Preflight op de actuele HEAD is verplicht** vóór productiecode. Lees `AGENTS.md`, `CONSTRUCTIONS.md`, `LINEAR-OBJECTS.md`, `DOCUMENT-FORMAT.md`, `docs/CORE-1-ARCHITECTURE-DESIGN.md`, `docs/UI-RADIAL-9-CONTRACT-DRIVEN.md`, `docs/M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md`, dit fasecontract, M8a-ellipscontract en het M8-INT.0-implementatieverslag. Verifieer servicegrenzen, scripts en permission-paden in de concrete code. Leg noodzakelijke schema-/policywijzigingen en een kandidaatwijzigingslijst vast vóór uitvoering.

Implementatievolgorde na aparte GO:

1. **Preflight / baseline:** registreer HEAD, schemamaxima, registry, scriptvolgorde en de bestaande Node/Edge-teststatus.
2. **Zuivere geometrie:** implementeer en test gespecialiseerde lijn–ellips-solver met schaalbewuste robuustheid en vastgelegde branch- en domeinregels.
3. **Service/model/schema:** voeg receptregistratie, `evaluate/resolve`, strict validation, computed fields, schema-featuregate, constructiecommando, replay/JSON/import/export toe.
4. **Universele dispatcher/UI:** breid het bestaande bronpaarcontract, ellipscontext en bronprefill uit; behoud één `Snijpunt`-tool en M8-INT.0-gedrag.
5. **Permissions:** valideer nieuw recept, bronrollen, asgrants en runtime/exportprojection aan dezelfde servicegrenzen.
6. **Verificatie:** onafhankelijke solver-fixtures, `INT-101`–`INT-122`, legacytests, `npm test`, `npm run test:edge`; rapporteer échte aantallen en page errors. Test gemengde documenten en zoom/pan.
7. **Oplevering:** ontwerpafwijkingen, commit-SHA's, testuitvoer, restpunten, browseracceptatiechecklist en implementatieverslag `docs/M8-INT-1-IMPLEMENTATION-REPORT.md`.

**Niet aanmaken:** parallelle `ConstructionService`, tweede menu-/UI-engine, gekopieerde ellipsdefinitie-engine, algemene polynoom-/CAS-engine of aparte autorisatieservice.

## 11. Acceptatie- en mergepoort

M8-INT.1 is pas implementatiegereed indien:

- alle wiskundige oplossingen correct en stabiel zijn, inclusief nul/raak/twee, domeinfilters en stabiele branchidentiteit;
- alle nieuwe gemengde import-/schema-/securitytests slagen, zonder regressies op M8-INT.0, M8a of M8b;
- Node en Edge volledig slagen, met werkelijke uitvoer en foutaantallen in het implementatieverslag;
- het **bestaande universele gereedschap** in beide selectievolgordes en vanuit de ellipscontext werkt;
- de gebruiker de echte browserinteractie handmatig heeft geaccepteerd;
- het implementatiewerk op een eigen branch staat, en **niet** zonder afzonderlijke opdracht naar `main` is gemerged.

Een doorlopende beschrijving op `main` is **geen** impliciete GO voor code, schema 10, verdere conic-paren of deploy.

## 12. Relatie met vervolgfasen en open beslissingen

- **M8-INT.2** mag alleen werkelijk geïmplementeerde andere conic-objecten via getypeerde rolregistratie aansluiten; parabool/hyperbool zijn niet stilzwijgend inbegrepen.
- **M8-INT.3** behandelt circle–ellipse, ellipse–ellipse en maximaal vier afzonderlijke oplossingen; hiervoor is nog steeds een **afzonderlijke, goedgekeurde `solutionKey`-bijlage** nodig.
- **M-PATH** is een eigen traject en heeft geen relatie met de persistente lijn–ellips-snijpuntrecepten.
- De implementatiepreflight bevestigt het concrete schema-10-minimum, eventuele nieuwe reason codes en de numerieke tolerantie-/foutbegroting op basis van onafhankelijke wiskundige fixtures. Wijzigingen aan dit ontwerp met impact op publiek gedrag of opslag worden eerst expliciet voorgelegd.

---

**Einde M8-INT.1-ontwerp- en implementatiecontract v1.0.0 — ontwerp goedgekeurd op 17 oktober 2026; implementatie uitsluitend via afzonderlijke Codex-opdracht en featurebranch, geen zelfstandige merge-GO.**
