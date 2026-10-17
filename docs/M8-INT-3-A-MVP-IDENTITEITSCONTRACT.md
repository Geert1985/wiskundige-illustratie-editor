# WIE — M8-INT.3-A (MVP): Beperkte deterministische snijpuntidentiteit met doorgroeipad naar B

**Documentversie:** 1.0.0  
**Datum:** 17 oktober 2026  
**Productbesluit:** **Optie A eerst implementeren** als bruikbare basisversie voor cirkel–ellips en ellips–ellips, met een **expliciet toekomstig, afzonderlijk te besluiten migratiepad naar optie B**. Door gebruiker besloten op 17 oktober 2026.  
**Status:** normatief **productrichting-/ontwerpkader**; details van schema, numeriek algoritme en branchsleutel nog **te controleren in een korte implementatiepreflight**. **Geen productiecode-GO** en **geen merge-GO** door dit document.  
**Normatieve basis:** [algemeen M8-INT-contract](M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md), [M8-INT.3-hoofdontwerp](M8-INT-3-KEGELSNEDEN-SNIJPUNTEN-ONTWERPCONTRACT.md), [roadmap](DEVELOPMENT-ROADMAP.md), bestaande M8-INT.0/.1 op \`main\`.  
**Toekomstige, niet voor MVP geldende onderzoeksbijlage:** [M8-INT.3-A trajectidentiteit optie B, v2.0.0](M8-INT-3-SOLUTIONKEY-IDENTITEITSCONTRACT.md). Die versie is **historisch/research en géén verplichte implementatie-eis** voor de eerste A-versie. De reeds gemaakte A1, A2.1 en A2.1b researchbranches blijven als bewijs en referentiemateriaal bewaard.

---

## 1. Doel en bewust begrensd gedrag

De bestaande universele knop **Snijpunt** ondersteunt in deze eerste M8-INT.3-productversie twee nieuwe bronparen:
- \`circle\` + \`ellipse\` (ook in omgekeerde UI-selectievolgorde), opgeslagen canoniek \`[circle, ellipse]\`;
- \`ellipse\` + \`ellipse\`, opgeslagen in de **oorspronkelijke, bij creatie gekozen bronvolgorde**.

Voor niet-gedegenereerde, niet samenvallende conics: maximaal **vier onderscheiden eindige reële** snijpunten. Het gereedschap maakt bij **succes** alle betrouwbaar berekende afzonderlijke punten **zonder individuele keuze** aan binnen één atomaire Undo/Redo-actie, selecteert de aangemaakte punten en keert terug naar **Selecteren**. Bij bewezen nul snijpunten, samenvallende conics, ongeldige geometrie of numeriek onbesliste volledige rootset: **geen creatie** en Snijpunt blijft actief. Geen extra zichtbare tool.

**Identiteit — optie A:** ieder eenmaal aangemaakt punt bewaart een vaste **plaatsidentiteit** binnen het intrinsieke, bij creatie vastgelegde parameterkader van de eerste canonieke conic-bron. Na beweging wordt de **hele huidige oplossingsverzameling opnieuw berekend** en uitsluitend waar ondubbelzinnig een wortel bij de opgeslagen plaatsidentiteit past, wordt het gekoppelde punt geldig weergegeven. Bij overschrijding van een oorspronkelijke sectorgrens, signatuurambiguïteit, samenvallen of numerieke onzekerheid kan het punt **tijdelijk verdwijnen / ongeldig worden**, ook als ergens anders op de bronconic nog snijpunten bestaan. Bij herstel van de oorspronkelijke geometrische configuratie kan het punt vanuit zijn **opgeslagen sleutel** opnieuw verschijnen.

Dit is een **bewuste, voor de gebruiker aanvaarde functionele beperking**. Optie A garandeert **geen permanente trajectcontinuïteit** bij willekeurig grote vervormingen, rotaties, tangenties of configuratie-loops; de 180°-rotatieproef van optie B is daarom **niet** een A-acceptatiecriterium. Er mag ook geen ongedocumenteerde belofte worden gedaan dat een plaatsidentiteit na grote beweging dezelfde fysieke tak is gebleven.

**Belangrijke eis:** geen vrij punt maken van een bestaande afhankelijke constructie; geen punt-ID wissen of opnieuw aanmaken wegens tijdelijke ongeldigheid; geen spontane nieuwe punten bij latere beweging.

## 2. Strikte scheiding van drie identiteiten

1. **Objectidentiteit:** de bestaande \`point.id\` blijft permanent, samen met naam, labels, stijl, laag, lock en downstream relaties.
2. **Persistente oplossingsplaats:** een getypeerde immutable \`solutionKey\` in het **bestaande point-construction-recept**; bij iedere resolve dezelfde vaste regels, onafhankelijk van editor-, pointer- of historycache.
3. **Actuele numerieke wortels:** tijdelijke solveroutput voor een gegeven bronpaar. Een actuele sorted index van de 0–4 wortels is **geen** \`solutionKey\`.

**Voorstel voor receptsoorten:**
- \`circleEllipseIntersection\`: bronnen \`['circle','ellipse']\`;
- \`ellipseEllipseIntersection\`: bronnen \`['ellipse','ellipse']\`.

Bestaande \`lineIntersection\`, \`lineCircleIntersection\`, \`circleCircleIntersection\`, \`lineEllipseIntersection\` en hun historische \`branch:0/1\` blijven **ongewijzigd**.

### 2.1 V1-\`solutionKey\` — technisch voorstel dat preflight moet valideren

\`\`\`json
{
  "kind": "circleEllipseIntersection",
  "sources": [{"objectId":"C1"},{"objectId":"E1"}],
  "solutionKey": {
    "schema": 1,
    "slot": 0,
    "firstFrame": "canonical-conic-v1",
    "frameKind": "circle-world",
    "anchorT": 0.095,
    "leftReach": 0.08,
    "rightReach": 0.08,
    "guardT": 0.005,
    "crossing": "positive"
  }
}
\`\`\`

**Alle getallen zijn illustratief**; niet hardcoden. De daadwerkelijke waarden moeten éénmalig en deterministisch uit de initiële **volledige en gevalideerde** rootset worden afgeleid. \`slot\` is de **initiële index** 0..3 binnen één gecreëerde set, geen index in latere solveroutput. Omdat iedere sleutel zijn eigen volledige vorm draagt, is een **aparte persistente batch-/familietabel voor de MVP niet vereist**. Als een familyID of ander metadata-type voor strikte validatie noodzakelijk blijkt, moet dat vóór productimplementatie in het finale preflightschema verantwoord worden, zonder een B-checkpointregister in te voeren.

**\`schema:1\` is een voorgesteld nieuw A-formaat** en nooit eerder daadwerkelijk ingevoerd. De oudere onderzoeksvariant B gebruikte voorgesteld \`schema:2\`; dit is niet een reeds gereserveerd of compatibel feit. Tijdens preflight moeten schema-/keyversies conflictvrij gereserveerd worden.

- \`firstFrame\` en \`frameKind\` bepalen de gedocumenteerde analytische parameterconventie van de **eerste** opgeslagen bron.
- \`anchorT\` is de bij creatie genormaliseerde parameter op \([0,1)\) modulo 1.
- \`leftReach\`/\`rightReach\` bepalen samen met \`guardT\` een **vast, exclusief kerngebied** rond die anchor, cyclisch modulo 1. Bij meerdere creatieroots dienen de sectoren onderling **disjunct** te zijn (naar analogie van halve cyclische buurafstanden).
- \`crossing\`: geconditioneerd teken van \(dF_B(X_A(t))/dt\) bij creatie, of \`tangent\` voor een bewezen veelvoudige wortel.
- \`slot\` en alle anchor-/frame-/sector-/signatuurvelden zijn **immutable** zodra de constructie is gemaakt; herordenen bij latere beweging is verboden.
- **N=1:** kernsector kan zich cyclisch over bijna de volledige parameteromtrek uitstrekken, maar met een ondubbelzinnige grens/guard. Een eenmaal tangent singleton mag niet willekeurig een van twee latere oplossingen kiezen.
- Een volledig circulaire ellips \((a=b)\) gebruikt een **gedocumenteerd, gedetermineerd wereldframe**; bij overgang van anisotroop naar circulair of bij onbepaalde focusrichting **geen verborgen askeuze**. Een niet te reconstrueren frame leidt tot \`AMBIGUOUS_BRANCH\`.
- Strikte validatie op type, bereik, eindigheid, sleutelversie, bronrolvolgorde, verboden onbekende velden en bronreferenties. Exacte numerieke guardwaarden en singleton-/tangentpolicy worden in de korte preflight vastgesteld en daarna onafhankelijk getest.

### 2.2 Toewijzing bij nieuwe brongeometrie

1. Valideer de actuele geometrie en bereken voor beide conics de **volledige onderscheiden reële rootset**, of rapporteer \`NUMERIC_UNRESOLVED\`.
2. Bepaal voor iedere root de cyclische analytische eerste-bronparameter, lokale transversaliteit/multipliciteit en fout-/scheidingsindicatie.
3. Toets alle bestaande keys van hetzelfde bronpaar **als één vaste plaatsindeling**, onafhankelijk van modelvolgorde. Evalueer de opgeslagen sectoren, signaturen en guards; **ga niet** per punt op zoek naar de dichtstbijzijnde huidige root buiten de eigen kernsector.
4. Een kandidaat is geldig voor een key **uitsluitend als één actuele root ondubbelzinnig binnen precies die sleutelplaats past**. Meerdere roots, guardgrens, zwakke signatuur of onvoldoende numerieke zekerheid betekenen \`AMBIGUOUS_BRANCH\` of \`NUMERIC_UNRESOLVED\`.
5. Een actuele root mag niet tegelijk twee keys binnen dezelfde oorspronkelijke constructieset krijgen. **Individueel opnieuw uitgevoerde constructies zijn onafhankelijke sets** en kunnen bewust op dezelfde geometrische plaats bestaan.
6. Bij contact is hoogstens één zichtbaar geometrisch punt **per constructieset** toegestaan. Leg een deterministische keeper-/invalidatiepolicy vast; als identificatie niet bewijsbaar is mogen beide betrokken keys ongeldig zijn. Bestaande niet-zichtbare point-/downstream-identiteiten blijven bewaard.
7. Bij terugkeer in het herkenbare sleutelgebied herstelt dezelfde key automatisch, zonder geheugen van het afgelegde pad.

**Precisering van de garantie:** vaste plaatsidentiteit voorkomt **hernummeren door de actuele oplossingsteller**, niet een topologisch bewezen continuïteit langs willekeurige paden. De gebruiker mag zien dat punten bij grote bewerkingen verdwijnen en opnieuw verschijnen. Dit is het uitdrukkelijk goedgekeurde A-compromis.

## 3. Numerieke kern: MVP zonder schijnzekerheid

Het eerder uitgevoerde onderzoek **A1 → A2.1 → A2.1b** heeft concrete grenzen aangetoond:

- A1: trajectvolging mogelijk, maar één fout bij een vierde-orde raakcontact.
- A2.1: exact-rationele referentiesolver correct in onderzochte scope (52/52 tests; 44 onafhankelijke controles), maar niet geschikt voor alle WIE-rotaties of live-prestaties.
- A2.1b: geteste intervalomhullingen voor ideale sinus/cosinus, **nog geen** globale intervalrootcount voor actuele geroteerde conics. Snelle rootkandidaten zijn **nooit** certificaten.
- Alle onderzoeksbranches blijven **historische research**, niet productiemodules; hun code mag niet blind naar WIE worden gekopieerd.

**A verlicht de identiteits-/history-eis, maar lost de vierwortelgeometrie niet op.** Codex mag daarom niet doen alsof een snelle sign-scan vier complete wortels bewijst. Ontwerp een onafhankelijke pure conic-pair solver met:
- analytisch quartic- of equivalente methode;
- aandacht voor \(\theta=\pi\), parameternaad, lagere effectieve graad, tangent/even-multipliciteitswortels, inclusief tot multipliciteit vier;
- detectie van samenvallende conics;
- controle op finitude, coördinatenlimieten, residuen, conditionering, rootcount en afzonderlijkheid;
- een **duidelijk gedocumenteerd ondersteund invoer-/conditioneringsdomein** voor de eerste versie. Buiten het ondersteunde gebied **fail-closed** met \`NUMERIC_UNRESOLVED\`, geen onbetrouwbaar of gedeeltelijk aantal;
- onafhankelijke analytische orakels voor ten minste 0/1/2/3/4 wortels, gewone tangentie, vierdegraag contact en geroteerde representatieve gevallen, plus tests voor geconditioneerde foutafhandeling.

**Niet claimen:** dat algemene geroteerde WIE-ellipsen al door A2.1b volledig gecertificeerd zijn. Een realistische eerste implementatie mag **niet** iedere extreme of bijna-singuliere toestand ondersteunen, maar mag een onbekend aantal nooit als volledig bewezen presenteren. Als de gekozen routine niet aan deze beperkte fail-closed eis voldoet, moet Codex dat als blocker rapporteren en niet alsnog onbewezen punten creëren.

**Vervang niet automatisch alle numerieke rekenkunde door zware BigInt bij iedere pointermove.** Behoud een zuivere solverinterface die later een sterker interval-/exact-certificaat kan leveren; een snelle schatting is nooit op zichzelf een constructieresultaat.

## 4. Architectuur: nu eenvoudig, later uitbreidbaar

MVP gebruikt de bestaande WIE-paden:
- \`ConstructionService\`: gespecialiseerde recepten, keyvalidatie, zuivere afhankelijke herberekening;
- \`IntersectionDispatcher\`: classificatie, bronvolgorde, volledige puntcreatiebeslissing;
- \`Engine\`: één atomaire \`construction.create\`-actie / Undo/Redo;
- \`IllustrationModel\`: strikt documentformaat en topologische dependency resolution;
- \`RuntimeSession\`: dezelfde permission- en restricted-projectieregels;
- \`EditorApp\`: bestaande één-tool-, contextmenu-, preview-/cancel- en terug-naar-Selecteren-UX.

**Wat nu NIET wordt ingevoerd:** \`intersectionContinuations\`, \`intersectionContinuationsSchema\`, mutable per-family checkpoint, pad-/winding-/revisionlog, nieuwe dragtransacties, workerdependency voor rootidentiteit, nieuwe algemene resolver of onnodige wijziging aan historische .0/.1-branchnummering.

**Doorgroeireservering naar optie B:**
1. Versioneer \`solutionKey\` en houd bronrollen, point-ID's en bouwstenen voor een nieuwe solver abstract/getypeerd.
2. Leg een **kleine getypeerde resolver-adapter** vast (\`resolveKey(kind,sources,key,roots)\` voor A), zodat B in een **toekomstige afzonderlijke, expliciete versie** een andere resolver kan gebruiken zonder het bestaande puntmodel op te geven.
3. Houd numerieke roots gescheiden van persistent ID-/sleutelbeheer; vermeng geen editorhover/pointercoördinaten met de solver.
4. Voor toekomstige B is **een nieuwe versieerbare keyvariant en eventueel een aparte continuation registry** nodig; reserveer dat niet stilzwijgend door nu ongebruikte metadata in documenten te schrijven.
5. Bij een echte latere B-migratie: behoud \`point.id\`, naam, stijl, layers en dependencies; behoud originele bronrollen; converteer de huidige **A-binding naar B als expliciete nieuwe initialisatie van een trajectcheckpoint vanuit een ondubbelzinnig huidig punt**.
6. **Geen reconstructie van niet-opgeslagen historische bewegingen:** migratie garandeert geen terugwerkende fysieke takidentiteit voor eerder ongeldige A-punten. Bij ambiguïteit behoud A of markeer ongeldig; nooit heimelijk gokken.
7. **Geen automatische conversie bij normale documentload.** Een migratie is een nieuwe, geteste en geautoriseerde transactie met apart schema-/history-/permissioncontract, gebruikersbesluit en volledige rollback.
8. Het bestaan van toekomstige B is **geen acceptatiepoort** voor de eerste A-implementatie.

## 5. Opslag en compatibiliteit

**Voorstel, pas definitief na actuele preflight:**
- Twee nieuwe \`construction.kind\`-waarden, elk met een strikt immutable \`solutionKey\`-object.
- Nieuwe expliciete \`constructionSchema\`-featuregate, **voorstel 11**, voor documenten met minstens één A-conic-pair-recept; schema 1–10 ongewijzigd.
- Bij enkel A-recept hoeft geen \`lineEllipseIntersection\` aanwezig te zijn; bij gemengde documenten alle eerdere recepten behouden.
- Geen \`intersectionContinuations\`/continuationSchema in A-documenten, geen verhoging van top-level \`document.version\` tenzij de preflight een feitelijke compatibiliteitsnoodzaak aantoont.
- Strikte import van bronreferenties en sleutel; zonder geldige key **atomair weigeren**, nooit stilzwijgend omzetting naar onafhankelijk vrij punt.
- Oude documenten blijven met het **minimaal noodzakelijke** schema schrijven; één lege A-activiteit maakt niet automatisch een nieuwe documentschemaversie.
- Schema-featuregate, per-recept permissions, duplicate/rebind, restricted export, semantic replay, security-rollback en verwijdering moeten worden getest voordat de feature afgerond wordt.

**Open technisch besluit voor Codex-preflight:** exacte \`solutionKey\`-representatie incl. \`slot\`, guardian/sectorvalidering, oude schema-/documentversievalidatie en eventueel noodzakelijke batchvalidatie. De eenvoudige MVP mag alleen zo eenvoudig worden genoemd nadat deze punten concreet aangetoond zijn.

## 6. Gefaseerde uitvoering en beslispoorten

| Fase | Doel | Huidige status |
|---|---|---|
| **M8-INT.3-A0 — gerichte preflight** | Audit van recept-/model-/dispatcher-/commandpaden; maak korte finale keyspecificatie en het ondersteunde numerieke domein, met Codex-opdracht **zonder codewijziging** | **Eerstvolgende stap**, aparte toestemming voor Codex |
| **M8-INT.3-B — cirkel–ellips (A-MVP)** | Volledige rootset binnen gedocumenteerde veilige scope; vaste key, herberekening, één-tool-UX, schema-/permission-/history-tests | Nog niet gestart; eigen implementatie-GO |
| **M8-INT.3-C — ellips–ellips (A-MVP)** | Zelfde A-mechanisme met volledige geroteerde objecten binnen de bewezen veilige scope; tangent-/degeneratie-/importregressies | Nog niet gestart; eigen implementatie-GO |
| **M8-INT.3-D — regressie en acceptatie** | Full Node/Edge, onafhankelijk analytische tests, manual acceptance, docreport en aparte merge-GO | Nog niet gestart |
| **M8-INT.3-E — optie B (later)** | Eventuele persistente continue roottrajecten en expliciete migratie van A-keys, na bewezen noodzaak en aparte productbeslissing | **Backlog, geen huidige gate** |

**M8-INT.2 is geen harde afhankelijkheid** voor de bestaande cirkel/ellips-typen.

## 7. Verplichte MVP-acceptatiematrix (A-ID en geometrie)

- **A-ID-001:** vier startroots → vier persistente punten, verschillende keys, één Undo-item, \`Selecteren\` na succes.
- **A-ID-002:** kleine bronbeweging → ondubbelzinnige roots in vaste plaatsen bewegen mee, object-ID's, namen en labels behouden.
- **A-ID-003:** 4→2→4 → slots verdwijnen/herstellen volgens opgeslagen plaatsbeleid, nooit willekeurige actuele rootnummering of spontane creatie.
- **A-ID-004:** 4→3→4 → maximaal één zichtbaar contactpunt per constructieset; betrokken keys kunnen herstelbaar ongeldig blijven.
- **A-ID-005:** grote rotatie over initiële sectorgrens → sleutel wordt volgens gedocumenteerde A-regel ongeldig; geen garantie van volledige fysieke trajectvolging; zonder foutstatus geen ongedocumenteerde sprong.
- **A-ID-006:** parameternaad \(0/2\pi\) midden in geldige cyclische sector → geen kunstmatige keywissel.
- **A-ID-007:** dezelfde huidige geometrie en opgeslagen keys na export/import/Undo/Redo → exact dezelfde deterministische mapping/reasoncodes.
- **A-ID-008:** herhaalde update met identieke documentstaat, onafhankelijke objectvolgorde → zelfde keymatches, zonder verborgen cache.
- **A-ID-009:** afhankelijk punt dat via geconstrueerde ellips invalide wordt en herstelt → bestaande definitie/point-ID en children behouden.
- **A-ID-010:** circle–ellipse in beide UI-volgordes en ellipse–ellipse in beide UI-volgordes; correcte bronrolopslag.
- **A-ID-011:** nul/geen oplossing, coincidentie, \`NUMERIC_UNRESOLVED\`, denied permission → geen object, geen Undo-item; Snijpunt blijft actief.
- **A-ID-012:** mixed legacy en nieuwe schema, duplicate/rebind, security/restricted export, snap/hit/SVG/PNG → geen regressies of lekken.
- **A-ID-013:** wiskundige fixtures 0/1/2/3/4, vierdegraag contact, nabijgelegen wortels, geroteerde gewone ellipsen en safe-fail bij extreme twijfel.
- **A-ID-014:** twee onafhankelijke creatieacties op hetzelfde bronpaar mogen onafhankelijke duplicate punten opleveren zonder gedeelde verborgen familiecache.
- **A-ID-015:** automatische B-upgrade gebeurt **niet** bij load/export, en A-docs blijven zonder B-runtime bruikbaar.

Gebruik ook de eerdere INT-301 t/m INT-323 uit het hoofdcontract **waar ze met de bewust beperkte A-plaatssemantiek verenigbaar zijn**. Pas tests voor **ononderbroken 180°-trajectcontinuatie** niet toe op A: die horen bij toekomstige optie B en mogen niet ten onrechte als A-regressie worden uitgelegd.

## 8. Uitvoeringskwaliteit en grens

Bij een toekomstige Codex-implementatie:
- eerst read-only preflight en **exacte definitieve key-/schema-/numeriek-policy** ter goedkeuring;
- alleen na afzonderlijke GO productiecode op een nieuwe, van actuele \`main\` vertrokken featurebranch;
- \`npm test\`, \`npm run test:edge\`, alle M8-INT.0/.1-regressies, strict import en levenscyclus, onafhankelijk wiskundige orakels en zonder afgezwakte tests;
- geen ongeautoriseerde bronselectie/metadata, geen phantom roots;
- werkelijke uitvoerresultaten in een nieuw implementatierapport, handmatige acceptatie vóór merge.

**A-goedkeuring vandaag = productkeuze + architecturale grens, niet impliciete uitvoerings- of merge-GO.** Nog geen schemawijzigingen, nieuwe recepten of toolaanpassing gecommitteerd.

---

**Einde M8-INT.3-A MVP-identiteitscontract v1.0.0 — optie A eerst, B als expliciet toekomstige uitbreiding.**
