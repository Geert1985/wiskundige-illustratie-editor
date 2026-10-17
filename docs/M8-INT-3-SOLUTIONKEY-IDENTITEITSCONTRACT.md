# WIE — M8-INT.3-A: Dynamische trajectidentiteit van maximaal vier snijpunten

**Documentversie:** 2.0.1  
**Datum:** 17 oktober 2026  
**Historisch productbesluit:** optie B werd op 17 oktober 2026 oorspronkelijk gekozen als einddoel. **Dit besluit is voor de eerste implementatiefase vervangen door het recentere gebruikersbesluit: optie A als MVP, optie B uitsluitend als mogelijke afzonderlijke latere uitbreiding.**  
**Status:** **uitgesteld historisch research-/toekomstcontract; NIET normatief voor de A-MVP**. Dit document bevat de eerdere B-onderzoeksarchitectuur en is alleen opnieuw uitvoeringsnormatief na afzonderlijk expliciet gebruikersbesluit. Geen productiecode/schema-/merge-GO.  
**Repository:** [Geert1985/wiskundige-illustratie-editor](https://github.com/Geert1985/wiskundige-illustratie-editor)  
**Normatieve basis:** [M8-INT-hoofdcontract v1.1.6](M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md), [M8-INT.3-hoofdcontract v1.0.3](M8-INT-3-KEGELSNEDEN-SNIJPUNTEN-ONTWERPCONTRACT.md), [roadmap](DEVELOPMENT-ROADMAP.md), M8-INT.0/.1 op `main` via PR #27/#28.  
**Vervangt:** identiteitsvoorstel v1.0.0 op ditzelfde pad, dat een *stateless* plaatsidentiteit met immutable hoeksectoren aanraadde. Die eerdere voorgestelde beperking is **niet langer normatief**; de Git-historie blijft als ontwerpgeschiedenis beschikbaar.

---

## Actuele beslissing — voorrang van optie A als MVP

**Op 17 oktober 2026 heeft de gebruiker na A1, A2.1 en A2.1b expliciet gekozen om de eerste werkende M8-INT.3-versie met optie A te bouwen**, en een architecturale doorgroeimogelijkheid naar B open te laten. Vanaf dit besluit geldt **uitsluitend** het [nieuwe M8-INT.3-A-MVP-identiteitscontract](M8-INT-3-A-MVP-IDENTITEITSCONTRACT.md) als uitvoeringsrichting voor de eerste release. De onderstaande secties beschrijven de **voorheen voorgestelde** B-aanpak en zijn **niet verplicht** voor de A-MVP, ongeacht historische formuleringen als "normatief", "gekozen" of "verplicht".

A-MVP gebruikt een immutable plaatssector-`solutionKey` en **geen** `intersectionContinuations`-registry, mutable checkpoint, path event of workertrajectbewijs. De historische onderzoeken A1/A2.1/A2.1b zijn waardevolle referenties, maar geen A-MVP-acceptatiegates. Een eventueel later B-project vergt een expliciete product-, schema-/migratie-, permission-, history- en implementatie-GO; de originele A-point-ID's blijven behouden en niet-opgeslagen B-bewegingshistorie wordt nooit gefingeerd.

---

## 1. Waarom optie B en wat wordt gegarandeerd?

WIE is een **dynamische geometrie-editor**. Gebruikers mogen een cirkel, een vrije ellips of een via brandpunten/besturingspunt geconstrueerde ellips verslepen, roteren of vervormen. Snijpunten worden bij die bewerking opnieuw berekend en moeten hun afzonderlijke identiteit zoveel mogelijk **langs hun werkelijk doorlopen traject** behouden.

**Normatieve garantie:** als de hele bronbeweging langs een voldoende fijn, wiskundig gecertificeerd pad verloopt waarop een snijpunt **eenvoudig en geïsoleerd** blijft, volgt zijn oorspronkelijke `point.id` **ononderbroken die worteltak**. Grote cumulatieve rotaties, een overgang door de parameternaad \(0/2\pi\), het veranderen van de relatieve wortelvolgorde en een terugkeer naar dezelfde eindcontour zijn **geen aanleiding** om de identiteit te resetten.

**Begrenzing:** dit is **geen belofte van altijd unieke voortzetting bij elke singulariteit**. Een verdwijning van twee reële wortels bij een raakstand, een meervoudig contact, volledige coincidentie, plotselinge bronteleportatie zonder certificeerbaar pad of een gedegenereerde ellips kan verdere voortzetting onbepaald maken. Bij twijfel **wordt het bestaande punt herstelbaar ongeldig**; WIE verwisselt nooit ongemerkt puntnamen, ID's, labels of downstream constructies.

**Belangrijke correctie op optie A:** een snijpunt mag **niet** enkel omdat het buiten een ooit vastgelegde hoeksector komt ongeldig worden. Het moet zijn voortgezette traject volgen zolang dat bewijsbaar is. De limiet is **wiskundige ambiguïteit**, niet een arbitraire oude sectorgrens.

De goedgekeurde UX van het universele `Snijpunt` blijft: **twee ondubbelzinnige bronnen, onmiddellijk alle actuele 1–4 betrouwbare verschillende snijpunten in één atomaire actie, en bij succes terug naar `Selecteren`**. Bij nul oplossingen of onzekerheid geen constructie, en Snijpunt blijft actief.

## 2. Waarom een stateless sleutel niet voldoende is

Neem `C`: \(x^2+y^2=16\) en `E`: \(x^2/25+y^2/9=1\). Hun vier kruisingen zijn
\[
X=(\pm5\sqrt7/4,\pm9/4).
\]
Roteer `E` continu met \(180^\circ\) rond hetzelfde centrum. De eindcontour is geometrisch weer identiek aan de begincontour, maar de snijpunten zijn langs het rotatiepad naar andere geometrische plaatsen doorgelopen.

Een algoritme dat uitsluitend de **huidige twee contouren** leest, kan niet weten of het pad nul, een halve of een volledige omwenteling heeft gemaakt. Een actuele sortering op x/y, huidige parametrische hoek of 'oplossing 0–3' kan daardoor geldige bestaande IDs verwisselen. Dit is een *informatietekort*, niet louter een precisieprobleem.

**Oplossingsprincipe B:** sla een permanente identiteit én een **actueel persistent continuatiecheckpoint** op dat door **geautoriseerde bronmutaties** mee evolueert. De identiteit blijft immutable, maar het checkpoint verandert atomair met de bronnen. Twee documenten met geometrisch gelijke eindcontouren mogen verschillende geldige point–root-koppelingen hebben als hun **opgeslagen checkpoints** uit verschillende echte continuatiepaden stammen.

**Geen verborgen dynamische cache:** voor correcte import, Undo/Redo, JSON-export en het openen in een nieuwe sessie moet het checkpoint in de huidige documentstaat zijn opgeslagen. Een louter JavaScript-/pointergeheugen-gebaseerd algoritme is verboden.

## 3. Architectuurfeit en noodzakelijke integratiegrens

Op de gecontroleerde `main`:

- `ConstructionService` heeft `circleCircleIntersection`, `lineEllipseIntersection` en branches [0,1], maar geen familie- of checkpointstructuur voor vierwortelcontinuatie.
- `Engine.constructIntersection` en `RuntimeSession` behandelen getypeerde snijpuntconstructies. Er is één geautoriseerd command- en historypad.
- `IllustrationModel.update/load/toJSON` en `ConstructionService.resolve` lossen de volledige dependency-graaf vanuit opgeslagen recepten op; import valideert atomair.
- `EditorApp.pointerMove/commit/cancel` kennen live interactie, preview en één historytransactie per afgeronde gebruikersbewerking. Restricted mode gebruikt daarnaast runtime-preview en commit.
- `EllipseGeometry.fromDefinition` levert de actuele modelruimtecurven; samengestelde ellipsen kunnen afhankelijk zijn van meerdere punten.
- De huidige writer gebruikt `constructionSchema:10` bij `lineEllipseIntersection`. Een nieuwe `solutionKey` en continuatieregister eisen nieuwe expliciete reader-/writergates.

**Daarom:** niet de editor-muislistener als enige eigenaar van identiteit maken. De **geautoriseerde geometrische mutatie- en modeltransactielaag** coördineert de bronwijziging, één continuatiestap, dependent resolution en checkpointcommit. Zo werkt hetzelfde principe bij drag, numerieke eigenschapswijziging, groepsverplaatsing, Undo/Redo, import en runtimecommando's.

De geometrische wortelisolator blijft **zuiver** en herbruikbaar: hij krijgt een actueel bronpaar en retourneert de volledige gecertificeerde huidige rootset. De continuatie-/matchingcoördinator is een **kleine gespecialiseerde modelservice**, geen tweede algemene geometrie- of permissie-engine.

## 4. Twee afzonderlijke identiteitslagen

### 4.1 Immutable identiteit per punt

Voorgesteld getypeerd opgeslagen recept:

```json
{
  "kind": "circleEllipseIntersection",
  "sources": [{"objectId":"C1"},{"objectId":"E1"}],
  "solutionKey": {"schema":2,"familyId":"ix-42","slot":0}
}
```

Voor het tweede recept `ellipseEllipseIntersection` gelden twee `ellipse`-bronrollen. Bij cirkel–ellips is de opslagvolgorde **altijd [circle, ellipse]**; bij ellips–ellips blijft de **oorspronkelijke gebruikersbronvolgorde** bewaard. Verander die niet door ID-sortering, objectnaam of tekenvolgorde.

- `schema:2`: **nieuw sleutelcontract voor optie B**; schema 1 van het nooit geïmplementeerde optie-A-voorstel is geen geldige invoer.
- `familyId`: documentbreed unieke ID van één constructieactie met aanvankelijk 1–4 punten. Een familie behoudt haar ID bij partiële puntverwijdering.
- `slot`: immutable integer 0–3, uniek binnen dezelfde familie, toegekend bij **eerste constructie**; geen blijvend huidige geometrische wortelnummer.
- Geen `anchorT`, `leftReach`, `rightReach`, `guardT` of oude `crossing` als bindende plaatsidentiteit.
- Een sleutel is geen geautoriseerde gebruikersparameter: de vertrouwde command-engine kent hem toe; een client mag hem niet willekeurig veranderen.

### 4.2 Mutable persistent checkpoint per constructiefamilie

Ontwerpvoorstel voor een **nieuwe canonieke documentsectie**:

```json
{
  "intersectionContinuationsSchema": 1,
  "intersectionContinuations": [{
    "schema": 1,
    "familyId": "ix-42",
    "kind": "circleEllipseIntersection",
    "sources": [{"objectId":"C1"},{"objectId":"E1"}],
    "revision": 12,
    "phase": "CERTIFIED",
    "sourceFrame": {
      "first":  {"type":"circle","cx":0,"cy":0,"r":4},
      "second": {"type":"ellipse","cx":0,"cy":0,"a":5,"b":3,"rotation":0}
    },
    "witnesses": [
      {
        "slot":0,
        "state":"SIMPLE",
        "parameterUnwrapped":0.095,
        "x":3.307,
        "y":2.25,
        "crossing":"positive"
      }
    ]
  }]
}
```

**Voorbeeldwaarden zijn illustratief**, geen exacte berekeningsfixture of vrij instelbare instellingen. De definitieve schema-/veldstructuur wordt bij de verplichte preflight en proof-gate vastgezet.

| Veld | Normatieve functie |
|---|---|
| `familyId` + `sources` | Verbindt in dezelfde documentstaat de bestaande afhankelijke punten met de correcte broncurven |
| `revision` | Niet-negatieve monotone teller van **gecommitteerde** continue bron-/checkpointtransacties, geen transactieklok |
| `sourceFrame` | Volledig gevalideerde analytische brongeometrie waarmee het huidige checkpoint is berekend, geen getekende SVG-cache |
| `witnesses[].slot` | Originele point–root-koppeling, onafhankelijk van huidige rootsortering |
| `parameterUnwrapped` | Doorlopende hoekparameter op de eerste bron, **niet modulo één omwenteling gereset**; alleen opslag in eindig, gecontroleerd numeriek bereik |
| `x,y` | Huidige gecontroleerde puntlocatie als **continuatiegetuige**, nooit onafhankelijke of vrij bewerkbare authoritative pointgeometry |
| `crossing` | Geconditioneerde eenvoudige-worteloriëntatie (`positive`/`negative`) of gecertificeerd `tangent` |
| `phase`/`state` | Voortzetbaarheid: `CERTIFIED`, `MERGED`, `LOST`, `AMBIGUOUS`, `SOURCE_INVALID`, `NUMERIC_UNRESOLVED`, `COINCIDENT` volgens de exacte, nog te bewijzen toestandstabel |

**Geen onbeperkte log in een document:** alleen het **laatst gecommitteerde bronframe**, de huidige slotgetuigen en noodzakelijke *korte* contact-/ambiguïteitssignaturen worden bewaard. Undo/Redo bewaart de volledige **voor/na-documentmomentopname**, zoals nu. Een auditeerbaar optioneel log is niet vereist voor heropenen. Voor replay van een **commandstream** moet de stream wél exact dezelfde geautoriseerde continuatiestappen of gevalideerde resultaatgetuigen bevatten: zonder padinformatie kun je een pad-afhankelijke uitkomst niet betrouwbaar reproduceren.

**Strict invariant:** een `CERTIFIED` checkpoint bevat een `sourceFrame` dat overeenkomt met de **actuele via de bronketen opgeloste objectgeometrie** en unieke `witnesses` die geometrisch op **beide** analytische contouren liggen. Bij import worden snapshot en actuele bronnen samen onafhankelijk gevalideerd; corruptie wordt **atomair geweigerd**, niet als een 'oude positie' gehonoreerd. Voor tijdelijk ongeldige brongeometrie houdt de registry een getypeerde `lastCertified`-getuige apart, plus de expliciete ongeldige huidige status; geen fictieve huidige wortel.

**Documenttype/versie zijn nog niet gereserveerd.** Het normatieve voorstel is om nieuwe `constructionSchema:11` met een expliciete `intersectionContinuationsSchema:1`-featuregate te combineren. Of daarnaast `document.version` van 10 naar 11 moet stijgen, wordt beslist door de echte reader-/writerpreflight; het getal wordt **niet stilzwijgend ingevoerd**. Oude readers moeten de nieuwe definitie atomair afwijzen.

## 5. Betrouwbare trajectvolging: algoritme en bewijsvoorwaarden

### 5.1 Volledige rootsolver als basis

Voor iedere tussenconfiguratie moeten cirkel–ellips en ellips–ellips een **complete** verzameling van 0–4 **onderscheiden eindige reële** snijpunten krijgen. Gebruik de in het goedgekeurde hoofdcontract beschreven betrouwbare quartic-/trigonometrische reductie met afzonderlijke \(t=\pi\)-controle, veilige detectie van even-multipliciteitswortels, beide impliciete residuen, schaalnormalisatie en gecontroleerde coördinatenlimieten.

Als het volledige aantal of een raakstatus niet bewijsbaar is, geeft de solver `NUMERIC_UNRESOLVED`; hij mag geen hypothetische puntkandidaat aan een witness koppelen.

### 5.2 Lokale continuatie bij eenvoudige wortels

Laat de eerste bron \(X_A(\theta,\lambda)\) en de tweede impliciete contour \(F_B(X,\lambda)=0\) afhangen van de continue wijzigingsparameter \(\lambda\). Definieer

\[
g(\theta,\lambda)=F_B(X_A(\theta,\lambda),\lambda).
\]

Wanneer \(g(\theta_0,\lambda_0)=0\) en \(\partial g/\partial\theta\ne0\) geldt voor een eenvoudige wortel lokaal:

\[
\frac{d\theta}{d\lambda}=-\frac{\partial g/\partial\lambda}{\partial g/\partial\theta}.
\]

Die relatie motiveert een **predictor–corrector**, geen ongecontroleerde extrapolatie. Bij elke voldoende kleine bronstap:

1. Neem het **laatst gecertificeerde** bronframe en alle actieve familiegetuigen.
2. Bepaal een pad van dat frame naar het nieuwe bronframe dat overeenkomt met de **werkelijk geautoriseerde bronmutatie**; bij Pointer-drag mag de ingezamelde beweging dit pad vormen.
3. Verdeel het pad zo nodig **adaptief** in kleinere stappen totdat volledige rootisolatie en veilige matching aantoonbaar zijn.
4. Gebruik voor elke eenvoudige witness een lokale voorspelling van positie en georiënteerde, **niet geresette** eerste-bronparameter. Is de frame-oriëntatie van een ellips door `a=b`, samenvallende brandpunten of hoek-wrapping ambigu, volg dan de **door de wijziging vastgelegde continue frame-/parameterontwikkeling** of geef `AMBIGUOUS_BRANCH`; verzin geen as uit huidige eindtoestand.
5. Los op het volgende bronframe opnieuw **alle** wortels op. Match vervolgens **de hele familie als één injectieve toewijzing** met bewezen disjuncte kandidaatgebieden en geconditioneerde residuen. Eén actuele wortel mag nooit twee slot-IDs krijgen.
6. Accepteer de substep alleen als de gekozen matching **uniek en numeriek onderbouwd** is en geen ongecontroleerde singulariteit overslaat. Anders: stap verkleinen of de betrokken slots `AMBIGUOUS_BRANCH` / `NUMERIC_UNRESOLVED` verklaren.
7. Bereik bij voldoende certificeerbare stappen de nieuwe eindtoestand; schrijf geüpdatete witnesses en bronframe **samen met de bronmutatie**. Er is geen willekeurige beperking door een oude vaste sector.

**Intervalcertificering / bewijscheck verplicht:** een kleine Euclidische afstand tussen twee samples is **geen** bewijs van unieke continuatie. Preflight moet vastleggen welke isolatie- en scheidingsgrenzen, residuen, conditioning en tussentijdse singulariteitscontrole voldoende zijn om een stap veilig te verklaren. Bij onvoldoende zekerheid **fail closed**, niet gokken of rootindex-sorteren.

### 5.3 Grote bewegingen en interactieve previews

- **Live slepen:** gebruik doorlopende tussenstappen zodat punten zichtbaar blijven meebewegen zolang de stappen geldig zijn. Tussenbeelden maken nog **geen afzonderlijke Undo-entries**.
- **Pointer-up:** commit exact één autoritaire gebruikersmutatie en de bijbehorende continuatiecheckpointdelta. Esc, `pointercancel`, blur, nieuw document of afwijzing herstellen **zowel bronobjecten als oude checkpoints** atomair.
- **Preview autorisatie:** restricted mode mag alleen met geautoriseerde brongeometrie en dezelfde rules previewen; previewresultaten zijn tijdelijk. Een geweigerde commit laat nooit geadvanceerde identity-state achter.
- **Numerieke veldwijziging / programma-API / groepsverplaatsing / rebind:** er kan géén volledige pointerserie zijn. Construeer alleen een **contractueel gedefinieerd interpolatiepad van de werkelijke bronparameters**, met constraints, afhankelijke ellipsketens en rotatierichting. Kun je geen uniek en betrouwbaar pad vaststellen, dan mag WIE **niet** beweren dat de continuatie gelukt is: `AMBIGUOUS_BRANCH`, behoud object/ID en leg dit atomair vast.
- **Geen verplichte pixelafhankelijke nauwkeurigheid:** zoom/pan of CSS pixelafstand mogen de identiteit van een gecommitteerd pad niet veranderen. Een reële bronmutatie met grotere sampleafstand mag adaptief opnieuw worden onderverdeeld op modelruimteniveau.
- **Performance:** begrens maximale substeps/CPU en definieer een expliciete budget-exhaustion-status. Een time-out produceert geen half bijgewerkte familie. De budgetwaarden worden tijdens preflight gemeten en per test geaccepteerd; geen verzonnen vaste waarden in dit contract.

### 5.4 Pad-afhankelijkheid en terugkeren naar identieke broncontouren

Voer de centrale tegenproef uit: behoud een cirkel en roteer een niet-cirkelvormige ellips gedurende \(180^\circ\) met **vier altijd onderscheiden kruisingen**. Eindcontouren zijn gelijk aan de oorspronkelijke, maar de continuatiegetuigen moeten de vier roottrajecten correct blijven volgen. De uiteindelijke mapping mag dus een permutatie van de startmapping zijn. Opslaan/heropenen mag die permutatie **niet** terugzetten.

Dit is het kernverschil met optie A en een harde goedkeuringspoort.

## 6. Tangenties, verdwijnende takken en echte ambiguïteit

### 6.1 Toestandstabel (ontwerpkeuze; nog formeel te valideren)

| Vorige toestand → geometrisch event | Verplicht gedrag |
|---|---|
| `SIMPLE` → `SIMPLE` met uniek geverifieerd pad | Volgzelfde `slot`, object-ID en afhankelijkheden |
| Twee eenvoudige takken → bewezen tangentie | **Maximaal één zichtbaar punt** op de contactlocatie; kies zichtbaar eigenaarslot alleen via een exact gedocumenteerde en herhaalbare precontactregel. Andere slot `MERGED_INTERSECTION` |
| Tangentie → twee eenvoudige reële takken | Herstel beide oorspronkelijke slots **alleen wanneer postcontact-koppeling uit de bewaarde contact-/oriëntatiegetuigen bewijsbaar is**; anders `AMBIGUOUS_BRANCH`, geen stille willekeurige links/rechts-keuze |
| Twee reële takken → geen reële wortels | Betrokken slots `NO_REAL_INTERSECTION`/`LOST` met persistente laatste betrouwbare contactgegevens; geen puntcreatie |
| Geen reële takken → nieuw reëel paar | Maak **geen nieuwe punten**; herstel oude slots alleen met bewijsbare voortzetting van hun persistente merge-/verliesgetuigen, anders ongeldig |
| Meerwortelcontact / volledige coincidentie | `AMBIGUOUS_BRANCH` / `COINCIDENT_CONICS`; geen willekeurige owner of meerdere zichtbare punten op dezelfde plek |
| Eerste bron wordt tijdelijk geometrisch ongeldig | `SOURCE_INVALID` voor downstream; verlies geen immutable key of `lastCertified` |
| Numerieke isolatie of pad-matching onbeslisbaar | `NUMERIC_UNRESOLVED` en behoud laatste betrouwbare getuigen zonder gefingeerde sprong |

Bij één punt dat **oorspronkelijk** op een raakpunt is gecreëerd, is er geen tweede ID. Als later twee oplossingen verschijnen wordt niet automatisch een tweede punt gecreëerd. Voor de oorspronkelijke key definieert de proof-gate een voorspelbare contact-signatuur; als niet eenduidig welke nieuwe tak de voortzetting is, blijft dat punt herstelbaar ongeldig.

**Niet beloven:** dat twee punten na verdwijnen in het complexe vlak en later herontstaan altijd op exact hun oorspronkelijke 'fysieke' tak terugkomen. Een reële identiteit kan door de singulariteit fundamenteel onbepaald zijn. Het juiste productgedrag is zichtbaar blijven waar continuïteit certificeerbaar is en anders conservatief terugvallen.

### 6.2 Omkering, rebind en framewissel

- Bronomwisseling bij **reeds bestaande** conic-families mag niet automatisch: de eerste-bronparameter en continuatiegetuigen hebben een bronroloriëntatie. Bij nieuwe cirkel–ellipsparen wordt de volgorde altijd `[circle,ellipse]`; ellips–ellips bewaart de bij creatie gekozen volgorde.
- Wijzigingen van ellipsoriëntatie, waaronder een controlepunt dat brandpunten doet samenvallen of `a=b`, vereisen een **padgetuige** die de framekeuze veilig voortzet. Er is geen vaste-initiale-sectorblokkering meer. Zonder voortzetbaar frame wordt tijdelijk ongeldig, niet van sleutel gewisseld.
- Bij expliciet rebind naar **andere** bronnen wordt geen oude slot stilzwijgend op een willekeurige nieuwe wortel geplakt. Valideer bronrollen/permissies en vraag een bewijsbaar rebindpad; anders weigeren of key ongeldig laten en een expliciet nieuw Snijpunt laten construeren.
- Eerdere `circleCircleIntersection`-brancheconventies en `lineEllipseIntersection`-branch 0/1 blijven onaangeroerd.

## 7. Atomiciteit: model, history, import en replay

### 7.1 Centrale transactiegrens

Elke autoritaire wijziging die conic-bronnen kan veranderen moet in **dezelfde modeltransactie** vastleggen:

1. nieuwe directe objectdefinities / toegestane eigenschappen;
2. de juiste door topologische resolver berekende broncurven;
3. voortgang of ongeldigheid van de betrokken families (`intersectionContinuations`);
4. daarvan afhankelijke puntvaliditeit en hun transitive kinderen;
5. overeenkomstige history-/permission-/exportstate.

Een falende update mag nooit wel de bron wijzigen maar niet de continuation state, of omgekeerd. Dit geldt ook voor multi-object patches, vrije en constructieve ellipsen, undo, redo, import, duplicatie, restricted runtime en afgebroken previews.

**Responsibility split:** de bestaande `ConstructionService` en conic-solver blijven eigenaar van geometrie en validatie; de model-/engine-transaction manager roept een gespecialiseerde `ConicContinuation`-routine aan binnen de bestaande updatepaden. Een afzonderlijke `ConicContinuation` helper mag, maar **geen tweede persistent model of concurrerende resolver**.

### 7.2 Undo/Redo en commandreplay

- History bevat volledige consistente **voor/na-documentstates** inclusief continuatieregistry; Undo herstelt oude bronframes én oude koppelingen. Redo herstelt de nieuwe zonder nieuwe matchingdiscussie.
- Het gewone **opgeslagen document** hoeft geen onbeperkt padlog te hebben: het laatste geautoriseerde checkpoint is voldoende om correct verder te bewegen en dezelfde huidige bindings te reconstrueren.
- Als een aparte **command-replay API** exact dezelfde eindstate moet reproduceren, moet het geautoriseerde commando óf een deterministische padbeschrijving bevatten óf een gevalideerde checkpointdelta/continuatiecertificaat. Alleen een eindgeometrie zonder padgetuigen volstaat niet voor pad-afhankelijke identiteit. De runtime genereert/verifieert de delta; willekeurige clientvoorstellen gelden niet als bewijs.
- Ook preview-na-confirmation en heropenen van JSON volgen dezelfde branchmapping; re-evaluatie op identieke `sourceFrame` mag geen nieuw slot toewijzen.

### 7.3 Import- en schema-featuregate

`intersectionContinuations` is een nieuwe gestructureerde, gevalideerde top-level registersectie. Bij import:

- controleer `intersectionContinuationsSchema`, familiebatches, referentie-ID's, exacte `solutionKey`-vorm (schema 2), bronrolvolgorde, uniekheid van `slot`, checkpointrevision, numerieke velden en maximale grootte;
- controleer de **huidige** checkpointbronframe tegen de **actueel geautoriseerd opgeloste** brondefinities. `CERTIFIED` families moeten hun witnesses ondubbelzinnig aan de actuele volledige rootset koppelen; anders **atomair weigeren**. Tijdelijk ongeldige opgeslagen families hebben een expliciete status en een apart `lastCertified`-bewijs, geen onterecht huidige `VALID`;
- geen afhankelijkheden naar ontbrekende bronnen, onbeschikbare segmenten, verborgen verboden objecten of bronreceptcycli invoeren;
- geen nieuwe recepttypen via schema 10 toelaten; nieuw schema-11-voorstel moet alle eerdere constructies inclusief matchAB, lijn–ellips en gemengde documentversies kunnen dragen;
- als de laatste .3-punten verdwijnen, ruim het verwaisde registry-item op. Bij individuele delete, family copy, groepsduplicatie, cascade of restricted export blijft de registry **consistent en minimaal**.
- weigeren is **atomair**, geen gedeeltelijk geladen oude/fantasie-snijpunten.

Een secure/restricted export neemt alleen geautoriseerde en consistente familie-data mee, behoudt familie/slotbindingen van toegestaan geëxporteerde punten, en sluit niet-toegestane bronframes en getuigen **volledig** uit. Als dat niet kan zonder lek of kapotte referenties, weigert de export veilig.

### 7.4 Family-ID en duplicatie

- `familyId` krijgt een documentbreed unieke, deterministisch reproduceerbare identifier uit de **staged** bestaande ID-allocator of een bewezen equivalente geautoriseerde allocator.
- Duplicatie van slechts één gekoppeld snijpunt creëert een nieuwe onafhankelijke familie met één slot; duplicatie van een volledige familie kan een nieuwe batch maken met dezelfde onderlinge rootbindingen maar een **nieuwe familyId**.
- Als bronnen worden meegekopieerd moeten alle source refs, registry frames en checkpoints consequent opnieuw worden verbonden of de duplicatie wordt geweigerd. Geen halve oude/nieuwe families.
- Verwijderen van een punt maakt geen nieuwe root; verwijderen van een bron volgt de bestaande cascade. Overige slot-ID's worden nooit hernummerd.

## 8. Nauwkeurigheid en numerieke budgetten

- Bereken in modelruimte, onafhankelijk van zoom/pan. `Number` (IEEE-754) is de bestaande numerieke basis; waar dat geen betrouwbare volledige wortelisolatie en matchcertificaat mogelijk maakt, is `NUMERIC_UNRESOLVED` de juiste uitkomst.
- Verboden: naïef sampled polygoon-, SVG- of 'kortste afstand tussen twee huidige punten'-matchen als enige beslisser.
- Te testen: wortels met even multipliciteit, extreem dunne of bijna cirkelvormige ellipsen, bijna samenvallende contouren, enorme maar legale modelcoördinaten, langs elkaar bewegende roots, meerdere bijna-gelijktijdige contacten en rotaties van meer dan \(2\pi\).
- Unwrapped parameters en revisionvelden hebben bewezen grenzen nodig, inclusief extreme lange sessies (geen overflow / `Number.MAX_SAFE_INTEGER`-problematiek). De proof-gate kiest een veilige normalisatie van winding getal zonder identiteitsverlies.
- Geometrielimiet \(|x|,|y|\le10^{12}\) blijft behouden. Onder druk van een opgelegd rekenbudget: geen partiële family-commit of onjuiste geïsoleerdheid.

## 9. Verplichte M8-INT.3-A proof-/regressiematrix

**Dit zijn eisen voor toekomstige onafhankelijke bewijsfixtures en Node/Edge-tests, geen claim dat ze nu uitgevoerd zijn.**

| ID | Proef | Acceptatie |
|---|---|---|
| **BKEY-001** | C4 vs E(5,3), vier wortels | Vier unieke immutable keys en vier juiste actuele witnesses |
| **BKEY-002** | Roteer E 45° via voldoende fijne stappen | Alle vier IDs volgen door de \(0/2\pi\)-naad zonder indexswap |
| **BKEY-003** | Roteer E **180°** via continu gecertificeerd pad, zelfde eindcontour | **Geldige permutatie van slots naar andere puntlocaties**, na save/load behouden; niet reset naar beginsortering |
| **BKEY-004** | Roteer E 360° | Iedere slot volgt werkelijk doorlopen traject, inclusief eventuele winding |
| **BKEY-005** | Grote vloeiende translatie / vervorming zonder singulariteit | Geen invalidatie enkel wegens initiële hoeksector overschreden |
| **BKEY-006** | Plotselinge numerieke sprong zonder aantoonbaar bronpad | Conservatief `AMBIGUOUS_BRANCH`, geen fantoomcontinuatie |
| **BKEY-007** | 4→3→4 bij bewezen eenvoudige tangentie | Max. één zichtbaar punt op contact, twee IDs bewaard, postcontact alleen gecertificeerde voortzetting |
| **BKEY-008** | 4→2→4 over geen-reële-wortelinterval | Geen spontane nieuwe IDs; herstel met bewijs of ambigue status, niet willekeurig |
| **BKEY-009** | 4→1→4, meervoudig contact | Geen ongedocumenteerde continuation, geen swap |
| **BKEY-010** | Nieuwe constructie op één raakpunt → later twee roots | Slechts bestaande ene ID, juiste policy |
| **BKEY-011** | Cirkelformige ellips \(a=b\), foci samenvallen, framewisseling | Path-aware voortzetting of status, geen fase-reset |
| **BKEY-012** | Cirkel–ellips UI beide bronvolgordes | Opslag altijd [circle,ellipse] |
| **BKEY-013** | Ellips–ellips UI beide bronvolgordes | Bij creatie gekozen eerste ellips blijft eerste |
| **BKEY-014** | Twee roots worden heel nabij, met kleine tussenstappen | Nooit alleen op pixelafstand matchen; bewijs of unresolved |
| **BKEY-015** | Drag preview 100 substeps en pointer-up | Eén history-entry, checkpoint en bronframe gecommit |
| **BKEY-016** | Drag preview → Esc / pointercancel / blur | Bron én witnesses terug naar vorige commit |
| **BKEY-017** | Restricted runtime-preview; permission verandert vóór commit | Atomic cancel, geen ongeautoriseerde witness-advance |
| **BKEY-018** | Source property-edit zonder pointertrajectory | Gecontracteerd interpolatiepad of conservatieve invalidatie |
| **BKEY-019** | Construeerde ellips via F1/F2/Q; bron wordt invalid en herstelt | Downstream invalid/recovery zonder verloren key-ID |
| **BKEY-020** | Save/reload na permutatie 180° | Exact zelfde actuele identiteit uit opgeslagen checkpoint |
| **BKEY-021** | Undo/Redo over grote drag en tangentie | Oude/nieuwe checkpoint-permutaties exact hersteld |
| **BKEY-022** | Replay van commandstream zonder versus mét continuation-witness | Onvoldoende stream afgewezen; gevalideerde stream deterministisch |
| **BKEY-023** | Corrupt frame, slot, family, witness, revision en onbekende sleutelvelden | Atomair weigeren; geen stale-to-free fallback |
| **BKEY-024** | Schema met alleen conic-pair, en gemengd met schema10/matchAB | Correcte featuregate; oude lezers weigeren toekomstig schema |
| **BKEY-025** | Restricted export met verborgen bron / verdwenen family member | Geen lekkage en consistente gereduceerde registry |
| **BKEY-026** | Enkel slot delete en duplicate, volledig batch copy, layer/group | Nooit slots hernummeren of old-family checkpoint hergebruiken |
| **BKEY-027** | New document, load en Undo bij actieve preview | Geen stale continuation state |
| **BKEY-028** | Uitputting iteratie- of numeriek budget | Geen halve familycommit, expliciete unresolved |
| **BKEY-029** | `circleCircleIntersection` en `lineEllipseIntersection` legacydocs | Volledig oude branch 0/1 behouden |
| **BKEY-030** | Edge: 4 snijpunten, live rotatie, save/load, Undo, contextmenu | Gecontroleerde identiteit én behoud van Snijpunt→Selecteren |
| **BKEY-031** | Twee families van hetzelfde bronpaar afzonderlijk aangemaakt | Onafhankelijke familie-ID's/slots en consistente afzonderlijke deltas |
| **BKEY-032** | Zelfde huidige contouren, twee **verschillende** geldige continuatiecheckpoints | Elk checkpoint herstelt zijn **eigen** historische puntmapping; geen stateless hersortering |
| **BKEY-033** | Exact raakcontact, technisch exact/nabijheidsfalloff, wisseling van transversaalteken | Bewezen contact of `NUMERIC_UNRESOLVED`, geen fantoompunt |
| **BKEY-034** | Langdurige rotatie met winding door vele omwentelingen | Unwrapped witness/normalisatie blijft binnen veilige grenzen |
| **BKEY-035** | Bewerken van bron via model.update, engine.update, runtime, group, rebind | Eén consistent controlepad; geen wijzigingsroute kan checkpoint overslaan |

**Harde bewijschecks vóór productiecode:**

1. **Continuatie lokaal:** bewijs dat bij \(\partial g/\partial\theta\neq 0\) een unieke nabije worteltak bestaat; leg de numeriek afdwingbare scheidingsvoorwaarde per geaccepteerde stap vast.
2. **Globale matchinjectiviteit:** het geautoriseerde familie-algoritme koppelt nooit twee slots aan één huidige wortel.
3. **Monodromie-test:** bij een gesloten pad in configuratieruimte (zoals 180° centrale ellipsrotatie) kan een niet-triviale slotpermutatie ontstaan. Bewijs dat die via persistent checkpoint behouden blijft.
4. **Singulariteitsgrens:** documenteer welke raak-/meerwortelovergangen een unieke voortzetting hebben, welke afhankelijk zijn van gekozen voortzettingspolicy en welke fundamenteel ambigu zijn.
5. **Save/load en Undo:** volledige document- en checkpoint-invariant; geen hidden state, geen hersortering.
6. **Command/security-boundary:** alle mutatiepaden geaudit; preview is niet authoritative, commit alleen via vertrouwde engine.
7. **Finite resource policy:** numeriek foutbudget, maximum substeps, robuuste residualcheck en budget exhaustion zijn gedefinieerd en met onafhankelijke fixtures gevalideerd.

## 10. Architectuur- en implementatievolgorde

**M8-INT.3-A1 — onafhankelijke design-/proof-spike.** Op een aparte Codex-featurebranch of strikt geïsoleerde testomgeving: geometrisch tegenvoorbeeld, predictor/corrector-prototype, path checkpoint-spike en alle bovenstaande harde bewijschecks; **geen productiecode of schemawijziging**. Leg noodzakelijke precieze runtime- en opslagvelden vast in een formele implementatiebijlage. Lever inhoudelijk verantwoord **GO/NO-GO** aan gebruiker.

**M8-INT.3-A2 — finale identiteit-/schema-goedkeuring.** Na A1 bekijkt de gebruiker de bewijsrapportage, continuatiebeperkingen, schema-/history-/permission-impact en testgedrag. Alleen bij expliciete GO mogen de schema-/checkpoint-modelwijzigingen worden uitgevoerd.

**M8-INT.3-B — cirkel–ellips** achter het bestaande universele Snijpunt, met numeriek complete solver, continuatieregistry, permissions en Node/Edge.

**M8-INT.3-C — ellips–ellips** met rotaties en vrij/geconstrueerd ellipsobject, dezelfde identiteitsengine en extra degeneraties.

**M8-INT.3-D — acceptatie en merge.** Volledige regressies, gebruikersacceptatie, implementatieverslag en afzonderlijke merge-GO.

M8-INT.3 heeft **geen harde afhankelijkheid van M8-INT.2**: de bestaande cirkel en ellips volstaan.

## 11. Open technische bewijsbesluiten (geen impliciete defaults)

De gekozen **productrichting is optie B**. Vóór implementatie moeten Codex' proof-spike en een daaropvolgende expliciete gebruikersgoedkeuring nog exact vastleggen:

1. De gecertificeerde rootisolator, interval-/residualfoutbegroting en stapadaptatie; geen naïeve naaste-buurmatching.
2. Het concrete serialized checkpointformaat, family's `lastCertified`- en tangentmerge-getuigen, en minimale document-/construction-/continuation-schemaversies.
3. De foutgrens bij verlies van reële wortels en herstel na singulariteit, inclusief eventueel blijvende `AMBIGUOUS_BRANCH` als continuïteitsbewijs onmogelijk is.
4. Het transactionele pad van de bestaande runtime-preview, EditorApp-interactie en alle directe mutatie-API's; bij ontbrekende padrepresentatie de voorgestelde fail-closed policy.
5. De numerieke/ruimtecomplexiteitslimieten en testbewijzen op echte Node/Edge-executie.
6. De juiste bronframecontinuatie voor vrij/geconstrueerde bijna-cirkelvormige ellipsen, inclusief onbepaalde foci-oriëntatie.
7. Het gewenste beleid als een gebruiker bewust een volledige bronvervanging uitvoert, waarbij oude familie-identiteit geen betekenisvolle continuatie heeft.

**Niet toegestaan op basis van dit ontwerp alleen:** de vierwortel-solvers, documentschema's, UI of import/export implementeren; de bestaande M8-INT.0/.1-branches wijzigen; optie A-sectorinvalidatie blijven gebruiken; automatisch mergen naar `main`.

---

**Einde M8-INT.3-A identiteits-/researchcontract v2.0.1 — B uitgesteld; A-MVP v1.0.0 heeft voorrang.**
