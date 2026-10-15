# WIE — Uniform Geometrie- en Metingencontract

**Document-ID:** WIE-GEO-UI  
**Documentversie:** 1.1.0  
**Datum:** 15 oktober 2026  
**Project:** From Zero 2 Infinity — Wiskundige Illustratie Editor  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Referentie:** `main`, codeonderzoek op 15 oktober 2026  
**Status:** ontwerpvoorstel, ter goedkeuring; geen implementatieautorisatie  
**Soort wijziging:** UI/UX-contract, met expliciet afgebakende latere rekenfuncties.  
**Wijzigingsstatus v1.1.0:** uitbreiding van het *doelcontract* voor individueel selecteerbare metingen en onafhankelijke maatlabels; geen implementatieautorisatie.  
**Voorgaande versie:** 1.0.0 (15 oktober 2026).

## 1. Aanleiding en doel

De huidige radiale keuze **Geometrie** toont een combinatie van `Object en geometrie`, `Metingen` en (voor punten) projectie-/verdelingssecties. Andere geometrisch of meetkundig relevante secties (`angle-measurement`, `region`, `ellipse-geometry`) worden afzonderlijk opgebouwd en staan niet consequent in de geometriepresentatie. Het doel is een uniforme, wiskundig correcte, objectafhankelijke inspecteur zonder dubbele opgeslagen waarheid en zonder wijziging van bestaande constructiebetekenis.

**Expliciete basiscode:** `editor.js` (`renderInspector`, `pointProjectionInspector`, `angleInspector`, `ellipseInspector`), `editor-radial-properties.js` (`SECTIONS`, `applyContextFilter`), `measurement-geometry.js`, `construction-service.js`, `tool-catalog.js`, `editor.html`, `model.js`. Huidige code heeft voor vrije punten `x/y`, lineaire objecten `x1/y1/x2/y2`, cirkels `cx/cy/r`, vrije veelhoeken/hoeken hoekpuntcoördinaten en tekst `x/y`. Voor constructies worden directe coördinaatvelden onderdrukt.

## 2. Hoofdstructuur en navigatie

Bij selectie van één geometrisch object en radiale keuze **Geometrie** verschijnen in deze volgorde, voor zover toepasselijk:

1. **Object en geometrie** — bewerkbare definitieparameters bij vrije objecten; berekende/read-only eigenschappen bij afgeleide objecten; specifieke geometrische projectie- en distributieregelaars.
2. **Metingen** — aanwezige of berekende meetwaarden, hun zichtbaarheid, notatie, schaal/eenheid en bijbehorende maatlabels. Alleen toepasselijke grootheden.

De afzonderlijke radiale actie **Meting** (waar aanwezig) blijft behouden als sneltoegang tot dezelfde onderliggende metingensecties. Zij mag geen alternatieve state, andere defaults of afwijkende waardeberekening introduceren. **Uiterlijk**, **Relaties**, **Acties**, **Labels** en **Alles** blijven beschikbaar volgens hun bestaande context. De interne sectie-ID's mogen gemigreerd worden via een zuivere presentatielaag; bestaande opslagformaten mogen niet ongemotiveerd wijzigen.

De hoofdonderdelen mogen afzonderlijk worden ingeklapt. Instellingen binnen een onderdeel worden indien nodig per categorie gegroepeerd. Het systeem toont géén lege rubrieken of inactieve meetsoorten alsof ze ondersteund zijn. Bij een niet-geldige afhankelijke constructie worden afgeleide waarden `Niet beschikbaar`, zonder `NaN`, `Infinity` of verouderde waarden.

## 3. Normatieve uitgangspunten

- **G1 — Eén waarheid:** coördinaten, constructiebronnen en canonieke parameters blijven in het bestaande model; afgeleide waarden worden berekend en alleen opgeslagen als het bestaande modelschema dat reeds vereist.
- **G2 — Afhankelijkheid:** afgeleide objecten zijn niet via directe coördinaatinvoer te ontkoppelen; daarvoor blijft de expliciete actie `Constructie losmaken` gelden.
- **G3 — Correcte dimensie:** lengten hebben dimensie L, oppervlakten L², hoeken rad/°, verhoudingen en excentriciteit zijn dimensieloos. Documenteenheden/schaal worden precies eenmaal toegepast.
- **G4 — Geen schijnmeting:** een oneindige rechte of halfrechte krijgt geen eindige lengte. Vectornorm is niet automatisch identiek aan 'lengte van een lijnstuk' als UI-label; de onderliggende berekening mag worden hergebruikt.
- **G5 — Niet nul:** ongedefinieerde richting van de nulvector krijgt een expliciete weergave, nooit een gefingeerde hoek.
- **G6 — Labels gescheiden:** objectnaam, objectlabel, meetlabel en meetwaarde zijn verschillende concepten; zichtbaarheid van een objectlabel wijzigt de geometrie niet.
- **G7 — Getrouwheid:** wijzigingen doorlopen bestaande permission/command/history-replay, undo/redo, documentimport/export en SVG/PNG-export.
- **G8 — Geen ongewenste regressie:** bestaande `showMeasurement`, `measurementMode`, `measurementText`, `angleSettings`, `coordinateProjections`, `areaDisplay`, `ellipse`- en `construction`-velden behouden hun betekenis tenzij een afzonderlijke migratie is ontworpen en getest.
- **G9 — Aangegeven status:** elk veld uit de toekomstige doelmatrix is gelabeld als B (bestaand), H (hergroepering van bestaand) of N (nieuwe functionaliteit, afzonderlijke milestone).
- **G10 — Per meting onafhankelijk:** elke ondersteunde meetgrootheid kan afzonderlijk worden getoond of verborgen; meerdere grootheden kunnen tegelijkertijd actief zijn.
- **G11 — Labels onafhankelijk:** voor iedere ingeschakelde meetgrootheid bestaat een eigen labelidentiteit en plaatsing, onafhankelijk van andere maatlabels en van de geometrie.
- **G12 — Controleerbare notatie:** per grootheid zijn (waar relevant) precisie en weergavevorm te bepalen, met gedocumenteerde fallback op documentinstellingen en zonder dubbele eenheid- of schaalconversie.
- **G13 — Modelintegriteit:** nieuwe configuratie en maatlabelposities zijn compatibel met bestaande documenten en volgen de bestaande command-, permissie-, historie- en exportarchitectuur.

## 4. Matrix: Object en geometrie

| Object | Bestaande invoer voor vrij object (B) | Gewenste berekende informatie / extra bediening | Opmerking |
|---|---|---|---|
| Punt | `x`, `y` | Coördinatenprojecties: geen/beide/alleen x/alleen y; waarden tonen (B/H) | Afgeleide punten: read-only positie, eventueel padparameter bij bestaande constructies |
| Lijnstuk | `x1`, `y1`, `x2`, `y2` | Begin- en eindpunt, richting (N als uitlezing) | Lengte bij Metingen |
| Rechte | `x1`, `y1`, `x2`, `y2` | Twee definitiepunten, richtingsinformatie (N) | Oneindig object |
| Halfrechte | `x1`, `y1`, `x2`, `y2` | Oorsprong en richtingspunt (H) | Oneindig object met beginpunt |
| Vector | `x1`, `y1`, `x2`, `y2` | Componenten, norm, richting conform **M7-VEC-FUND** (N, niet reeds uitgevoerd) | Norm en richting zijn afgeleid uit componenten |
| Cirkel | `cx`, `cy`, `r` | Middelpunt en straal, eventueel diameter als uitlezing (N) | Geconstrueerde cirkel: bronnen blijven canoniek |
| Driehoek | Drie hoekpunten x/y, modeltype `polygon` (B) | Zijden, classificatie en centra alleen als afzonderlijk uitgewerkte doelen (N) | Geen los parallel driehoekmodel introduceren |
| Veelhoek | Alle hoekpunten x/y (B) | Aantal hoekpunten (N uitlezing) | Zowel vrije als geconstrueerde contour |
| Hoek | Drie hoekpunten x/y (B) | Hoekpunt, benen, hoekbereik (B/H bij hoekmeting) | Rechtehoekmarkering behouden |
| Lengtemaat (`dimension`) | Geen vrije coördinaatinvoer in het algemene paneel (B) | Definitie vanuit meetbronnen (B via relaties) | Geen vrije geometrische 'lengte' verzinnen |
| Gebied (`region`) | Geen algemene vrije coördinaatinvoer (B) | Vorm-/bronparameters en extent waar reeds ondersteund (B/H) | Cirkelboogsector/segment via bestaande constructiesoorten |
| Ellips (`ellipse`) | Geen algemene directe invoer (B) | Centrum, a, b, excentriciteit (B als read-only); afstandsom S bij tweebrandpuntenconstructie (B) | Contract M8a blijft normatief; geen directe asbewerkingen toevoegen zonder nieuw contract |
| Tekst (`text`) | x, y; legacy statische tekstinvoer waar van toepassing (B) | Positie onder bestaande tekstcontext (B) | Geen meetkundig meetobject; tekstbinding elders |

De weergave van x/y-getallen blijft in cartesische documentcoördinaten, met bestaande as- en eenheidsconventies. Alle vrije invoervelden blijven bewerkbaar binnen hun bestaande permissies.

## 5. Matrix: Metingen per objecttype

| Objecttype | Wiskundig toepasselijke grootheden | Huidige relevante bediening | Contractstatus |
|---|---|---|---|
| Punt | (x,y) als coördinaatinformatie, geen lengte/oppervlakte | Coördinatenprojecties en zichtbaarheidsoptie (B) | H; eventueel afzonderlijke coördinaten-notatie N |
| Lijnstuk | Lengte L | `Maat tonen`, `Berekende waarde`/`Vrije tekst`, symboolinvoer (B) | H |
| Rechte | Richting/helling, géén eindige lengte | Generiek `Maat tonen` bestaat momenteel (B) | Aanpassen onder N na goedkeuring: generieke lengtebediening verwijderen/vervangen |
| Halfrechte | Richting/hoek, géén eindige lengte | Generiek `Maat tonen` (B) | Aanpassen onder N |
| Vector | Componenten vx,vy; norm; richting | Generiek maatveld in huidig objecttype (B) | N; na uitvoering vectorfundament |
| Cirkel | Straal, diameter, omtrek, oppervlakte | Momenteel generiek `Maat tonen` met straal `(r)` (B) | Straal H; extra waarden N |
| Driehoek | Drie zijden, hoeken, omtrek, oppervlakte | Geen generieke maatsectie op polygon (B); aparte meetgereedschappen bestaan | N, afzonderlijk afgebakend |
| Veelhoek | Zijdes, omtrek, oppervlakte | Aparte meetconstructies en gebiedsweergave (B) | Nieuwe geïntegreerde presentatie N |
| Hoek | Hoekgrootte, eenheid, precisie, hoekbereik | `Hoekmeting` en maattekst (B) | H |
| Lengtemaat | Lengte of brongebonden maat | `Alleen meetlabel tonen`, berekend/vrije tekst (B) | H |
| Gebied | Oppervlakte | `Oppervlakte weergeven`, weergave, precisie 0–3 (B) | H |
| Ellips | a,b,e als geometrie; oppervlakte πab | `Ellipsgeometrie` toont oppervlakte (B) | Herplaatsing H; eventuele omtrek N (geen elementaire exacte formule) |
| Tekst | Geen intrinsieke geometrische grootheid | Statische/dynamische tekst, geen standaardmaat (B) | Geen meetpaneel |

Voor cirkeloppervlakte, omtrek, veelhoekmetingen en andere aanvullende meetwaarden mag de implementatie alleen bestaande betrouwbare berekeningen aansluiten waar aanwezig en model-/permissiecontracten dat toelaten. Nieuwe UI-keuzen en persisterende instellingen vallen buiten de eerste hergroeperingsfase.

## 5A. GEO-UI-3 — normatief contract voor afzonderlijk selecteerbare metingen (nieuw in v1.1.0)

**Status:** **N — toekomstig doelgedrag, niet bestaande functionaliteit en niet inbegrepen in GEO-UI-1**. Deze eisen gelden voor alle objecttypen waarvoor meerdere zinvolle grootheden zijn vastgesteld. De implementatie van elke objectfamilie volgt een afzonderlijk goedgekeurde scope en passende rekentests.

### 5A.1 Zichtbaarheid en combinaties

1. Onder **Metingen** krijgt iedere **ondersteunde, toepasselijke grootheid** een eigen duidelijk gelabelde **aan/uit-schakelaar** (bijvoorbeeld `Straal tonen`, `Diameter tonen`, `Omtrek tonen`, `Oppervlakte tonen`).
2. De schakelaars zijn **onafhankelijk**: 0, 1, meerdere of alle ondersteunde metingen mogen tegelijk zichtbaar zijn. De keuze voor één grootheid wijzigt de toestand van andere grootheden niet.
3. Een uitgeschakelde grootheid wordt **niet als meetlabel op het canvas getoond**, maar haar berekende waarde mag wel als read-only informatie in het eigenschappenpaneel staan. Uitschakelen mag de meetconfiguratie/positie niet vernietigen.
4. De schakelaar **Objectlabel tonen** blijft onafhankelijk van alle meetschakelaars. De bestaande globale `Maat tonen`-velden krijgen een expliciet compatibiliteitsbeleid, zonder stilzwijgende wijziging van bestaande documenten.
5. De keuzes worden bij wijziging van de geometrie automatisch herberekend en visueel bijgewerkt; een afhankelijke constructie volgt wijzigingen van haar bronnen.

### 5A.2 Normatief cirkelvoorbeeld

Voor elke vrije **en** afhankelijke cirkel (onder andere een cirkel door middelpunt en punt, ingeschreven cirkel en negenpuntscirkel) gelden dezelfde vier afzonderlijke opties:

| Schakelaar | Canonieke grootheid | Formule | Dimensie |
|---|---|---|---|
| `Straal tonen` | straal `r` | `r` | L |
| `Diameter tonen` | diameter `d` | `d = 2r` | L |
| `Omtrek tonen` | omtrek `O` | `O = 2πr` | L |
| `Oppervlakte tonen` | oppervlakte `A` | `A = πr²` | L² |

**Acceptatievoorbeeld:** bij een cirkel met `r = 3 cm` en actieve schakelaars *Straal*, *Omtrek* en *Oppervlakte* staan drie **afzonderlijke** maatlabels op de tekening; de diameter blijft verborgen. Bij 2 decimalen zijn de getoonde waarden respectievelijk `3,00 cm`, `18,85 cm` en `28,27 cm²`. Een wijziging van `r` of een bronpunt vernieuwt alle actieve waarden, zonder hun individuele zichtbaarheidskeuzen te veranderen.

### 5A.3 Onafhankelijke labelidentiteit en -plaatsing

- Elke maatsoort wordt binnen het bronobject geïdentificeerd door een **stabiele meetsoort-sleutel** (bijvoorbeeld `radius`, `diameter`, `circumference`, `area`), niet door de actuele numerieke waarde of schermtekst. Welke persistente representatie hiervoor nodig is, wordt in GEO-UI-3 apart ontworpen.
- Elk actief maatlabel is **afzonderlijk selecteerbaar en versleepbaar** op het canvas, onafhankelijk van het objectlabel, overige meetlabels en de cirkel of figuur zelf. Een labelverplaatsing wijzigt nooit geometrie of bronreferenties.
- De plaatsing is gekoppeld aan het geometrisch bronobject in **document- of objectgerelateerde coördinaten**, niet uitsluitend aan schermpixels, zodat zoomen/pannen, bronupdates en export voorspelbaar blijven. De precieze anker-/offsetsemantiek wordt vóór implementatie vastgelegd en getest.
- Verbergen en opnieuw tonen herstelt de laatst opgeslagen labelpositie; meerdere actieve labels mogen niet automatisch worden samengevoegd tot één niet-afzonderlijk verplaatsbaar tekstblok.
- Er is een voorspelbare standaardpositie voor nieuw ingeschakelde labels en een herstelactie voor handmatig verplaatste labels. Het algoritme voor botsingsvermijding en precieze standaardankers worden in GEO-UI-3 gespecificeerd; **geen stilzwijgende automatische herschikking** van eerder handmatig geplaatste labels.

### 5A.4 Waardepresentatie en precisie

- Voor **iedere ondersteunde meetsoort** is de zichtbaarheid onafhankelijk instelbaar; waar relevant kan ook **per meetsoort** de precisie (aantal decimalen) en weergavevorm worden ingesteld. Een instelling `Documentstandaard` laat de bestaande documentprecisie gelden.
- Minimaal voorziet het GEO-UI-3-ontwerp `Berekende waarde` en, indien technisch en semantisch passend, `Vrije tekst` **per maatsoort**, met behoud van de bestaande symboleninvoer (α, β, γ, δ, θ, π, °). Vrije tekst verandert de geometrisch berekende waarde niet.
- Lengtematen en oppervlakten gebruiken consequent de bestaande documenteenheid en schaal, respectievelijk schaalfactor `s` en `s²`. De formattering gebeurt op de berekende fysieke grootheid, niet op tussentijds afgeronde geometrie.
- Bij ongeldige afhankelijke constructies toont een actief maatlabel `Niet beschikbaar` of wordt conform een vooraf vastgelegde uniforme invaliditeitsregel verborgen; nooit `NaN`, `Infinity` of een verouderde waarde. De gebruikerskeuze blijft bewaard.

### 5A.5 Reikwijdte naar andere objecttypen

| Familie | Afzonderlijke relevante meetsoorten (doelcontract; waar wiskundig gedefinieerd) |
|---|---|
| Lijnstuk / lengtemaat | Lengte; geen gefingeerde omtrek of oppervlakte |
| Rechte / halfrechte | Richting/helling volgens GEO-UI-2; **geen** eindige lengte |
| Vector | Component x, component y, norm, richting; pas na M7-VEC-FUND en met nulvectorregel |
| Driehoek | Drie zijden, toepasselijke hoeken, omtrek, oppervlakte |
| Veelhoek | Zijden, relevante binnenhoeken, omtrek, oppervlakte (voor geldige gesloten figuur) |
| Cirkel | Straal, diameter, omtrek, oppervlakte |
| Ellips | Grote/kleine halve as, eventuele volledige aslengtes, excentriciteit, oppervlakte; **omtrek pas na afzonderlijke numerieke nauwkeurigheidsafspraak** |
| Hoek | Hoekgrootte; overige presentatieregelaars blijven consistent met `angleSettings` |
| Gebied | Oppervlakte, waar een geldige oppervlakteberekening bestaat |
| Punt / tekst | Geen gefingeerde lengtes of oppervlakten; puntcoördinaten blijven geometrische informatie |

**Geen verplichte blinde uniformiteit:** alleen daadwerkelijk ondersteunde en zinvolle metingen worden als schakelaar weergegeven. Er worden geen nieuwe wiskundige algoritmen geïmpliceerd door het tonen van deze doelmatrix.

### 5A.6 Persistente toestand, compatibiliteit en acceptatie

1. De per-meetsoort-toestand (zichtbaarheid, optionele precisie/weergave en labelpositie) is **deterministisch** en doorloopt permissions, undo/redo, redo-replay, opslaan/heropenen, JSON-import/export en SVG/PNG-export.
2. Nieuwe documenten krijgen expliciet gedocumenteerde defaults; **bestaande documenten behouden hun zichtbare maatlabels en interpretatie**. De eventuele migratie van `showMeasurement`, `measurementMode`, `measurementText` en `areaDisplay` wordt met concrete regressiegevallen goedgekeurd vóór schemawijziging.
3. Een object verwijderen verwijdert zijn bijbehorende meetlabels; dupliceren volgt een vooraf gedocumenteerde, consistente clone-regel; vergrendeling en verborgen lagen respecteren de bestaande toegangs- en zichtbaarheidsregels.
4. Tests omvatten minimaal alle 16 zichtbaarheidstoestanden voor de vier cirkelgrootheden, gelijktijdige labels, individuele drag, behoud van posities na uit/aan, afhankelijke bronupdates, schaal/eenheden, precisie, ongeldige constructies en roundtrips via historie/import/export.
5. **GEO-UI-1 mag deze eisen niet alvast gedeeltelijk implementeren**. GEO-UI-3 vereist een afzonderlijke implementatiepreflight, detailontwerp en expliciete GO.

## 6. Matrix: alle gereedschappen en constructies uit `editor.html`

Een gereedschap krijgt het eigenschappenprofiel van het resulterende objecttype, niet een tweede implementatie van zijn eigen meetpaneel.

| Gereedschap / constructie | Profiel | Specifieke eigenschappen / uitzondering |
|---|---|---|
| Punt | Punt | x/y en projecties |
| Lijnstuk | Lijnstuk | x1/y1/x2/y2, maat |
| Rechte | Rechte | x1/y1/x2/y2, zonder eindige lengte in doelontwerp |
| Halfrechte | Halfrechte | Oorsprong, richting, zonder eindige lengte |
| Vector | Vector | Bestaande endpointinvoer; M7-VEC-FUND uitbreidingen apart |
| Driehoek | Veelhoek/driehoek | 3 hoekpunten; geen nieuw modeltype |
| Veelhoek | Veelhoek | N hoekpunten |
| Cirkel | Cirkel | cx/cy/r, straalmeting |
| Hoek | Hoek | Vrije hoekpunten, hoekmetingen |
| Rechte hoek | Hoek | 90°-markering en bijhorende hoekbeperkingen |
| Middelpunt | Punt | Read-only opgelost punt; constructiebron |
| Punt op lijnstuk | Punt | Bestaande padparameter |
| Punt op cirkel | Punt | Padparameter; puntverdeling indien van toepassing |
| Punt op ellips | Punt | Ellipsparameter, niet poolhoek/booglengte |
| Snijpunt van lijnen | Punt | Afgeleide positie |
| Snijpunt lijn–cirkel | Punt | Afgeleide positie en branch/keuze vanuit constructie |
| Snijpunt cirkel–cirkel | Punt | Afgeleide positie en branch/keuze |
| Loodlijn | Rechte | Bronrelatie; geen vrije coördinaatbewerking |
| Middelloodlijn | Rechte | Bronrelatie |
| Bissectrice | Rechte | Bronrelatie, geen extra maat zonder bestaande implementatie |
| Rechte door twee punten | Rechte | Twee bronpunten |
| Evenwijdige | Rechte | Referentierichting en referentiepunt |
| Raaklijn | Rechte | Bronrelatie |
| Cirkel door middelpunt en punt | Cirkel | Bronpunt(en), berekende straal |
| Ellips door brandpunten en afstandsom | Ellips | Afstandsom S; read-only C,a,b,e,πab |
| Driehoek uit drie punten | Veelhoek | Afhankelijke hoekpunten |
| Zwaartepunt | Punt | Afgeleide positie |
| Middelpunt omgeschreven cirkel | Punt | Afgeleide positie |
| Hoogtepunt | Punt | Afgeleide positie |
| Middelpunt ingeschreven cirkel | Punt | Afgeleide positie |
| Ingeschreven cirkel | Cirkel | Afhankelijk centrum en straal |
| Rechte van Euler | Rechte | Afhankelijke rechte |
| Negenpuntscirkel | Cirkel | Afhankelijke cirkel |
| Lengtemaat | Lengtemaat | Alleen meetlabel; meetwaarde/vrije tekst |
| Omtrekmeting | Profiel van het aangemaakte meetobject | Huidige meetconstructie behouden |
| Oppervlaktemeting | Profiel van het aangemaakte meetobject | Huidige meetconstructie behouden |
| Hoek uit drie punten | Hoek | Bronpunten, hoekmeting |
| Hoek uit richtingen | Hoek | Bronnen, gericht/ongericht bereik |
| Veelhoekgebied | Gebied | Oppervlakte-instellingen |
| Cirkelsector | Gebied | Oppervlakte-instellingen + bestaande extent-control |
| Cirkelsegment | Gebied | Oppervlakte-instellingen + bestaande extent-control |
| Tekst | Tekst | Positie en tekstbinding, geen intrinsieke meting |
| Selectie | Niet van toepassing | Actie, geen creatietype |

De precieze resulterende objecttypes van `construct:perimeter` en `construct:area` worden in de implementatiepreflight gecontroleerd voordat zij met een UI-profiel worden gekoppeld. Dit contract verzint hiervoor geen niet-gecontroleerde interne types.

## 7. Faseplan en grens tussen hergroepering en nieuwe functionaliteit

### GEO-UI-1 — Herordenen, bestaande functies zichtbaar maken (eerste uitvoeringsfase)

- Voeg een zuivere presentatie-/filterlaag toe voor twee herkenbare hoofdsecties: **Object en geometrie** en **Metingen**.
- Neem bestaande `angle-measurement`, `region`, `ellipse-geometry` en puntprojectie-/verdelingssecties consequent op in de juiste hoofdsectie, afhankelijk van toepasselijkheid.
- Behoud de bestaande radiale snelkeuze **Meting** als navigatie naar dezelfde metingen; voorkom duplicatie.
- Verplaats geen constructiebronnen uit **Relaties** zonder expliciete UX-behoefte; constructieparameters die de geometrie bepalen mogen contextueel zichtbaar zijn, maar mogen niet dubbel worden bewerkt.
- Wijzig geen schemas, constructieberekeningen, maatbetekenissen of waardefuncties; geen wijziging aan model/renderer/geschiedenis anders dan strikt nodig en gedocumenteerd.
- Corrigeer lege rubrieken en onjuist hernoemde samenvattingen; respecteer vergrendeling, multi-selectie, read-only runtime.

### GEO-UI-2 — Meetsemantiek van lineaire objecten (afzonderlijke GO)

- Verwijder misleidende eindige lengte van rechte/halfrechte; vervang uitsluitend na mathematisch/UI-contract voor richtingsgrootheden.
- Norm/componenten/richting van vectoren integreren **pas na M7-VEC-FUND**.
- Behoud legacy-documenten en bestaande `showMeasurement`-waarden zonder datavernietiging; bepaal compatibiliteit en migratiebeleid vooraf.

### GEO-UI-3 — Uitgebreide grootheden en onafhankelijke meetlabels (afzonderlijke contracten/GO)

- **Normatief doel:** implementeer sectie **5A**: per toepasselijke meetsoort onafhankelijke schakelaars, meerdere gelijktijdige maatlabels, eigen selecteerbare/versleepbare labelpositie en optionele precisie en weergavevorm per meetsoort.
- Cirkel: straal, diameter, omtrek en oppervlakte als vier afzonderlijke selecteerbare meetsoorten.
- Veelhoek/driehoek: omtrek, oppervlakte, relevante zijden en hoeken.
- Vector: componenten, norm en richting pas na M7-VEC-FUND.
- Ellips: eventuele aanvullende eigenschappen, waaronder omtrek met numerieke nauwkeurigheidsafspraak.
- Definieer vooraf documentdefaults, compatibiliteit, schema-/historiegedrag en precieze labelanker-/offsetsemantiek; geen implementatie zonder afzonderlijke GO.

## 8. Acceptatiecriteria GEO-UI-1

1. Voor elk geïmplementeerd objecttype is de inhoud van de radiale keuze **Geometrie** aantoonbaar correct geordend.
2. De secties `angle-measurement`, `region` en `ellipse-geometry` zijn bereikbaar via het bedoelde onderdeel; bestaande velden blijven functioneel.
3. Bestaande `Meting`-snelkeuze toont dezelfde meetvelden en dezelfde state; er ontstaat geen tweede controlepad.
4. Geen lege `Metingen`-sectie wanneer geen intrinsieke maat ondersteund wordt; geen schijnbare bewerkbaarheid van afgeleide coördinaten.
5. Herhaald openen/sluiten, objectwissel, wijzigen van velden, lock/unlock en undo/redo veroorzaken geen verdubbelde controls of stateverlies.
6. Bestaande labels, maatweergaven en symbolen (α β γ δ θ π °) werken onveranderd.
7. Constructies met ongeldige/opnieuw geldige bronnen tonen consistente status zonder crash en zonder ongeldige getallen.
8. Validatie omvat bestaande tests (`npm test`, `npm run test:edge` waar uitvoerbaar) én doelgerichte UI-tests voor punt, lijnstuk, rechte, halfrechte, vector, cirkel, hoek, veelhoek, gebied, ellips en afgeleide varianten.
9. De implementatierapportage vermeldt branch, base/HEAD-commit, gewijzigde bestanden, testresultaten en iedere bewust niet aangepakte uitbreiding.
10. Geen push naar `main`, geen merge zonder expliciete gebruikersgoedkeuring.

## 9. Codex-preflight en gefaseerde uitvoering

1. Controleer actuele `main` HEAD en of op dat moment andere featurebranches UI-/geometriecode wijzigen.
2. Breng daadwerkelijk rendergedrag in kaart; toets alle `data-property-section`-identifiers en de bestaande contextmodi.
3. Maak read-only inventaris met screenshots of DOM-asserties voor de 12 basisobjecttypes en een steekproef van alle afhankelijke constructies.
4. Stel één minimale implementatiebranch vanaf de afgesproken SHA voor en vraag **GO** voor `GEO-UI-1`.
5. Implementeer slechts GEO-UI-1; GEO-UI-2/-3 zijn expliciet niet geautoriseerd.
6. Rapporteer en valideer; laat gebruiker visueel testen voordat integratie in `main` wordt voorgesteld.

## 10. Open beslispunten

- **D1:** Wordt de radiale keuze **Meting** behouden als sneltoegang? **Voorstel: ja**, zonder duplicatie.
- **D2:** Wordt `Hoekmeting` onder **Metingen** geplaatst? **Voorstel: ja**, inclusief hoekboog tonen, hoewel de boogweergave presentatie beïnvloedt.
- **D3:** Wordt `Ellipsgeometrie` onder **Object en geometrie** gezet, met oppervlakte ook bereikbaar onder **Metingen**? **Voorstel: ja**, maar een gedeelde read-only waarde, geen dubbele instelling.
- **D4:** Mag **Object en geometrie** leeg zijn voor een afhankelijk object als er geen losse velden zijn? **Voorstel: nee**; toon bronafgeleide, read-only informatie voor zover betrouwbaar beschikbaar, anders compacte toelichting met link naar Relaties; dit deel kan extra UI-werk impliceren en moet tijdens preflight op haalbaarheid worden beoordeeld.


## 11. Versiehistoriek

| Versie | Datum | Wijziging |
|---|---|---|
| 1.0.0 | 15 oktober 2026 | Eerste objectmatrix, filter-/hergroeperingscontract en faseplan |
| **1.1.0** | **15 oktober 2026** | **Sectie 5A toegevoegd: onafhankelijke meetschakelaars, gelijktijdige labels, afzonderlijke labelplaatsing, individuele precisie/weergave, cirkelvoorbeeld, compatibiliteit en testcriteria; GEO-UI-3 aangescherpt** |

---

**Toestand:** contract v1.1.0 opgesteld als voorstel. Goedkeuring van dit document betekent niet automatisch opdracht aan Codex om aan `main` te schrijven.