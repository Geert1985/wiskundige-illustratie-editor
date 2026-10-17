# WIE — M8-INT.3: Snijpunten tussen twee kegelsneden — ontwerp- en implementatiecontract

**Documentversie:** 1.0.1  
**Datum:** 17 oktober 2026  
**Status:** **hoofdontwerp goedgekeurd door gebruiker op 17 oktober 2026**; de afzonderlijke identiteitsbijlage M8-INT.3-A v1.0.0 is opgesteld **ter afzonderlijke goedkeuring** — **geen productiecode- of merge-GO**  
**Project:** From Zero 2 Infinity — Wiskundige Illustratie Editor  
**Repository:** [Geert1985/wiskundige-illustratie-editor](https://github.com/Geert1985/wiskundige-illustratie-editor)  
**Normatieve basis:** [M8-INT-hoofdcontract v1.1.3](M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md), [M8-INT.1-contract v1.0.1](M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md), [Development Roadmap](DEVELOPMENT-ROADMAP.md), M8a-ellipsen, M8-INT.0 en M8-INT.1 geïntegreerd op `main` via PR #27 en PR #28.  
**Besluitgrens:** het hoofdontwerp is door de gebruiker goedgekeurd. De [M8-INT.3-A `solutionKey`-identiteitsbijlage v1.0.0](M8-INT-3-SOLUTIONKEY-IDENTITEITSCONTRACT.md) is nu als **afzonderlijk ontwerpvoorstel** opgesteld. Haar conservatieve plaatsidentiteit, beperkingen bij grote bronbeweging en tangent-/ambiguïteitspolicy zijn nog **niet** goedgekeurd of bewezen door uitvoerbare tests. Productiecode, schema's, bestaande tests en merge naar `main` blijven ongewijzigd totdat daarvoor apart GO is gegeven.

---

## 1. Doel

Breid het **bestaande universele gereedschap Snijpunt** uit met de paren:

- **Cirkel–ellips** (`circle` + `ellipse`);
- **Ellips–ellips** (`ellipse` + `ellipse`).

De gebruiker krijgt **alle verschillende, eindige, reële en betrouwbaar vastgestelde geïsoleerde snijpunten**. Voor twee verschillende niet-ontaarde kegelsneden is het maximum **vier**; wiskundige multipliciteit van een raakpunt levert geen extra zichtbaar punt op.

De uitbreiding gebruikt uitsluitend de op `main` bestaande cirkel- en ellipsobjecten. Een `ellipse` met \(a=b\) is een geldige cirkelvormige ellips en blijft een **ellipsobject**. Parabolen/hyperbolen, andere conic-objecten en de algemene M8-INT.2-adapter zijn **buiten scope**.

De nieuwe solvers worden toegevoegd achter `construct:intersection`; er komt **geen aparte zichtbare knop**.

## 2. Product- en interactiecontract

1. De gebruiker activeert **Constructies → Puntconstructies → Snijpunt**, of kiest **Constructie → Snijpunt** in het contextuele radiaalmenu van een cirkel of ellips.
2. Eerste bron: een geschikte, geautoriseerde cirkel of ellips. Selecteren van deze bron verandert het document niet.
3. Tweede bron: een andere geschikte cirkel of ellips, in willekeurige UI-selectievolgorde. Alleen bij overlap mag de gebruiker tussen *bronobjecten* kiezen; **nooit tussen individuele oplossingspunten**.
4. Bij **1–4 volledig en betrouwbaar bepaalde unieke snijpunten** creëert één `construction.create`-commando onmiddellijk **precies die punten**, elk met een eigen persistent recept, ID en gevalideerde `solutionKey`, in **één atomaire Undo/Redo-transactie**.
5. Na de **daadwerkelijk geslaagde** transactie: terug naar **Selecteren**, nieuwe punten blijven geselecteerd, successmelding blijft zichtbaar, bronkeuze/overlays verdwijnen.
6. Bij **nul bewezen oplossingen**, **volledig samenvallende contouren**, **ongeldige bron** of **onvoldoende numerieke zekerheid**: geen nieuwe objecten, geen geschiedenisactie. Het gereedschap blijft actief zodat de gebruiker een andere bron kan kiezen.
7. Een oude, bestaande afhankelijkheidsconstructie mag nooit als vrij punt worden gedowngraded. Later door bronbeweging ontstane extra wortels creëren **geen** nieuwe punt-ID's; alleen aanvankelijk gecommitteerde oplossingen bestaan als object.

**Normatieve continuïteit:** de in M8-INT.1 goedgekeurde automatische terugkeer naar `select` na **succes** blijft bestaan. Dit contract mag dat gedrag niet terugdraaien.

## 3. Bronmatrix, canonieke volgorde en persistente recepttypen

### 3.1 Nieuwe gespecialiseerde recepten (voorstel)

| `construction.kind` | `resultType` | `sourceRoles` | Oplossingen |
|---|---|---|---:|
| `circleEllipseIntersection` | `point` | `['circle','ellipse']` | 0–4 |
| `ellipseEllipseIntersection` | `point` | `['ellipse','ellipse']` | 0–4 |

De voorgestelde namen volgen de reeds bestaande `lineEllipseIntersection`-, `lineCircleIntersection`- en `circleCircleIntersection`-recepten. Ze worden tijdens read-only implementatiepreflight nog tegen de feitelijke registry gecontroleerd. Kies geen brede, onbegrensde `construction.kind:'intersection'` en geen nieuwe tweede constructie-engine.

- **Cirkel–ellips:** ongeacht UI-volgorde zijn opgeslagen bronnen altijd `[circle, ellipse]`. De **cirkel** is in de analytische parametrisatie de eerste curve.
- **Ellips–ellips:** opgeslagen bronnen bewaren **de door de gebruiker gekozen eerste en tweede ellips**. Sorteer niet op object-ID, naam, coördinaten of renderingvolgorde: die zouden bij hernoemen of dupliceren branchsemantiek veranderen.
- `circleCircleIntersection` blijft in zijn **oude recept en zijn historische linker-/rechterbranchsemantiek**; maak voor cirkel–cirkel geen nieuw `solutionKey`-recept.
- Hetzelfde fysieke object tweemaal kiezen is geen toegestaan bronpaar voor een nieuw zelfsnijpunt. Twee **verschillende object-ID's** met geometrisch samenvallende contouren worden wel geclassificeerd, maar produceren de status `COINCIDENT_CONICS` zonder objectcreatie.
- Volledige conic-bronreferenties zijn `{objectId:'...'}`. Geen `part`, `index`, asref, polygonrand, of andere extra bronvelden in deze nieuwe recepten.

De UI vertaalt beide bronvolgordes vóór het constructiecommando naar de contractvolgorde. `ToolCatalog` toont precies één zichtbare Snijpunt-ingang; de twee nieuwe gespecialiseerde IDs zijn interne command-/permissionrecepten.

## 4. Wiskundige grondslag

### 4.1 Geometrie van de broncontouren

Herbruik `EllipseGeometry.fromDefinition` voor iedere geldige, actuele ellips, vrij of afhankelijk van brandpunten/Q. Die levert centrum \(C\), halve assen \(a,b\), orthonormale richtingen \(u,v\) en parametrisatie

\[
X(\theta)=C+a\cos\theta\,u+b\sin\theta\,v,\qquad 0\le\theta<2\pi.
\]

Een bestaande cirkel wordt intern analytisch als \(a=b=r\) met vaste orthonormale richtingen geïnterpreteerd; maak daarvoor **geen tweede opgeslagen ellipsobject** en muteer nooit `type:'circle'`.

De impliciete contourvoorwaarde voor een ellips met centrum \(D\), assen \(A,B\) en richtingen \(p,q\) is

\[
F_E(X)=\left(\frac{(X-D)\cdot p}{A}\right)^2+
\left(\frac{(X-D)\cdot q}{B}\right)^2-1=0.
\]

Voor een cirkel met centrum \(D\), straal \(r>0\):

\[
F_C(X)=\frac{\|X-D\|^2}{r^2}-1=0.
\]

De solver werkt uitsluitend met de **actuele modelgeometrie**, niet met SVG, pixels, de viewport of geapproximeerde polygonen.

### 4.2 Oplossingsaantal en gevallen

Volgens Bézout kunnen twee verschillende niet-ontaarde vlakke kegelsneden zonder gemeenschappelijke component maximaal vier punten hebben, **geteld met multipliciteit** over het complexe projectieve vlak. WIE construeert alleen de **onderscheiden reële eindige punten**, dus 0, 1, 2, 3 of 4.

Behandel onderscheiden situaties met aparte reden/status:
- `VALID`: één of meer betrouwbaar geïsoleerde oplossingen (volledige oplossingsverzameling bekend);
- `NO_REAL_INTERSECTION`: bewezen nul reële geïsoleerde oplossingen;
- `COINCIDENT_CONICS`: gelijke volledige contouren en daardoor oneindig veel gedeelde punten;
- `SOURCE_INVALID`, `ZERO_RADIUS`, `COORDINATE_LIMIT` of bestaande bronfout: ongeldige invoergeometrie;
- `NUMERIC_UNRESOLVED`: solver kan het **volledige** unieke puntenaantal niet betrouwbaar bepalen;
- `AMBIGUOUS_BRANCH`: wortels zijn geometrisch vastgesteld, maar hun persistente identiteit is niet voldoende zeker.

**Fail-closed creatie:** als niet **alle** roots van het actuele bronpaar gecertificeerd kunnen worden, **geen gedeeltelijke gebruikersconstructie**. Een valide geometrie met numeriek onvolledig root-antwoord mag niet stilzwijgend als 'geen snijpunten' of 'alle gevonden' worden gepresenteerd.

### 4.3 Voorgesteld rekenpad

Parametriseer de **eerste canonieke bron** als \(X(\theta)\) en vervang die in \(F_B(X)=0\). Dit geeft een trigonometische vergelijking tot de tweede graad in \(\sin\theta,\cos\theta\). Pas

\[
z=\tan(\theta/2)
\]

toe om een polynoom **van graad hoogstens vier** te verkrijgen. Het punt \(\theta=\pi\) moet expliciet in de tweede parameterkaart / als afzonderlijk projectief wortelgeval worden behandeld; het mag niet verloren gaan door delen door een polynoomfactor of wegvallen van de hoogste coëfficiënt.

Vereisten aan de **beslissende** solver:

1. Construeer de coëfficiënten met een beheersbare schaling/conditionering, zonder onnodig grote tussenwaarden; lokaal verschuiven en normaliseren.
2. Isoleer **alle** reële wortels met bracketing/refinement of gelijkwaardig betrouwbaar polynoomalgoritme, inclusief wortels met **even multipliciteit** (raakpunten), dubbele of hogere samenval, nul/lagere effectieve polynoomgraad en wortels bij de parameterkaartgrens.
3. Bewijs volledigheid van het teruggegeven kandidaatstel binnen de expliciet gedocumenteerde numerieke foutbegroting; bij onzekerheid return `NUMERIC_UNRESOLVED`, niet een geraden aantal.
4. Herbereken ieder punt op de parametrische eerste curve; toets **beide onafhankelijke impliciete residuen** en de tangentiële/normalenconditie indien raakpuntdetectie vereist is.
5. Dedupliceer alleen werkelijk samenvallende geometrische wortels met schaal-/conditioneringsbewuste tests. Nabije maar verschillende wortels mogen niet op basis van één vaste afstandsepsilon worden samengevoegd.
6. Bij cirkelvormige ellipsen (\(a=b\)) en twee geometrisch identieke contouren: detecteer exact/geconditioneerd `COINCIDENT_CONICS` of numerieke onbeslisbaarheid. Dat mag geen continuüm aan 'snijpunten' creëren.
7. Coördinaten moeten eindig en binnen \(|x|,|y|\le 10^{12}\) blijven; behandel degeneraties en numerieke overflow expliciet.
8. Gebruik onafhankelijke analytische testorakels. Een uniforme stapgrootte in \(\theta\) met alleen tekenwissels is **niet voldoende**, omdat een raakpunt bij een even-multipliciteitswortel geen tekenwisseling veroorzaakt.

Een gecertificeerde alternatieve strategie (resultant + gecertificeerde isolatie, interval-/Sturm-methode of een equivalent algoritme) mag worden voorgesteld wanneer de tests dezelfde volledige resultaten opleveren. Een schermpixel- of polygon-approximatie is géén solver.

## 5. Kernvraag: duurzame `solutionKey` van maximaal vier punten

**Dit is de expliciet nog niet opgeloste architectuurgate.** Een actuele sortering op `x`, `y`, ellipshoek of 'eerste/vierde oplossing' voldoet **niet** als permanente identiteit:

- Twee **verschillende** snijpunten kunnen dezelfde x-coördinaat hebben en van volgorde wisselen zonder samenvallen.
- De hoek van het snijpunt op ellips A kan de grens \(0/2\pi\) passeren zonder topologische verandering.
- Bij tangentie kunnen twee roots tijdelijk samenvallen en later opnieuw ontstaan.
- Bij beweging of rotatie kunnen vier punten via 4→2→4 of 4→3→4 veranderen; opnieuw nummeren verwisselt dan bestaande point-ID's.
- Een cirkelvormige ellips kan geen niet-fysieke, impliciete voorkeursas krijgen die na import van betekenis verandert.

### 5.1 Verplichte invarianten

1. Elk bij de oorspronkelijke constructie gecommitteerd punt krijgt één **permanente `id` en immutable `solutionKey`** met strikt gevalideerde vorm en vastgelegde bronrolvolgorde.
2. Hetzelfde complete document en dezelfde brongeometrie leveren na opnieuw openen/replay altijd **dezelfde sleutel→wortel-koppeling**, onafhankelijk van editorgeheugen, pointerbewegingen, history-lengte en hovervolgorde.
3. Verdwijnen of verschijnen van **andere** wortels mag een bestaande key nooit naar een willekeurige andere, op dit ogenblik beschikbare oplossing verschuiven.
4. Bij bewezen contact/samenvallen bestaat **één geometrisch zichtbaar punt**. Andere opgeslagen betrokken keys blijven herstelbaar ongeldig als `MERGED_INTERSECTION`; geen ID-/stijl-/label-/dependentverlies.
5. Bij `AMBIGUOUS_BRANCH` of `NUMERIC_UNRESOLVED` wordt de betreffende reeds opgeslagen key herstelbaar ongeldig; geen stille sleutelverwisseling en geen spontaan nieuwe objecten.
6. Na beweging naar een ondubbelzinnige configuratie mag een ongeldige key **alleen** herstelbaar geldig worden op basis van zijn contractuele identiteit. Niets mag uit een niet-persistent muistraject of eerdere schermcoördinaten worden afgeleid.
7. Source rebind, duplicatie, verwijderen/herstellen via Undo, verborgen/locked objecten, lagen en restricted export behouden hetzelfde identiteitsschema.

### 5.2 Ontwerprichting voor de nog te schrijven bijlage

Onderzoek een **immutable, gevalideerde verankering** aan de initiële analytische parameter van de eerste bron, aangevuld met onderscheidende tak-/transversaliteitinformatie en een **deterministische, conservatieve matchingregel**. Dit is een **kandidaatontwerp**, **geen reeds goedgekeurde of bewezen solutionKey**.

Onderzoek minstens:
- een stabiel `anchorParameter` op de **canonieke eerste bron** plus zo nodig gestructureerde signatuur/isolatiegegevens;
- matching van het **volledige stel bestaande sleutels** tegen alle actuele wortels als één gemeenschappelijk probleem, niet onafhankelijk 'dichtstbijzijnde punt per object', en geen afhankelijkheid van modelobjectvolgorde;
- noodzakelijke overlap-/winding-/oriëntatie-/discriminantinformatie en de beperking daarvan wanneer bronnen roteren of rootbanen rond de contour bewegen;
- eenduidige uitkomst bij import in een willekeurige toestand **zonder** opgeslagen bewegingshistoriek;
- herstel/afwijzing bij 4→2→4, 4→3→4, 4→1→4, passage over \(\theta=0\) en bij herhaald heen-en-weer bewegen;
- vergelijking met een exact/algebraïsch alternatief voor stateless sleutelmatching en de aantoonbare grenzen van beide benaderingen.

**Bewijsverplichting:** lever expliciete tegenvoorbeelden én positieve invarianten. Als globale stateless tracking bij een bepaalde geometrische configuratie **niet identificeerbaar** is, moet de bijlage die grens aantonen en een duidelijke, door de gebruiker goed te keuren **conservatieve invalidatiepolicy** specificeren. Claim geen onvoorwaardelijke globale branchcontinuïteit zonder bewijs; forceer bij onzekerheid geen willekeurige oplossing.

### 5.3 Afzonderlijke goedkeuringsgate: M8-INT.3-A

Maak vóór productie-implementatie het document:

[`docs/M8-INT-3-SOLUTIONKEY-IDENTITEITSCONTRACT.md`](M8-INT-3-SOLUTIONKEY-IDENTITEITSCONTRACT.md)

Dit document moet minstens bevatten:
- exacte persistente vorm/versie van `solutionKey`, bronroloriëntatie, validatie en normalisatie;
- toetsbare deterministische sleuteltoewijzing bij creatie van 1–4 punten;
- getypeerd algoritme voor re-evaluatie **zonder opgeslagen dynamische cache**;
- voorschriften voor raakpunt, verdwijnende sleutel, terugkerende sleutel, nahechte wortels, 4→2→4, 4→3→4 en 0/2π-overgang;
- gedrag bij bronrebind/source swap, import/export, duplicates, undo/redo, transitive dependencies en permissions;
- bewijs/tegenvoorbeelden en onafhankelijke fixtures die aantonen dat sleutelverwisseling niet kan optreden in de ondersteunde gevallen;
- expliciete restbeperkingen en een acceptatiebesluit voor onoplosbare ambiguïteit;
- de bijbehorende exacte schema-featuregate en command/engine-lifecycle.

**M8-INT.3-A is verplicht en vereist afzonderlijke inhoudelijke gebruikersgoedkeuring vóór M8-INT.3-B/C.** Dit fasecontract autoriseert Codex dus niet alvast een `branch:0..3`-oplossing te bouwen.

## 6. Dynamische afhankelijkheden, transacties en herstel

- Bewaar iedere snijpuntconstructie als afzonderlijk afhankelijk `point`-object met gespecialiseerd `construction.kind`, twee bronrefs en gevalideerde `solutionKey`.
- De bestaande topologische `ConstructionService.resolve/evaluate` blijft de enige bron voor herberekende afgeleide coördinaten en `constructionValid/reasonCode`.
- Bronupdate, rotatie, vrije/brandpuntgestuurde ellipsbeweging, tijdelijke ellipsdegeneratie en recovery moeten afhankelijke puntobjecten en hun kinderen correct meenemen.
- `COINCIDENT_CONICS` betekent nul *geïsoleerde* nieuwe punten; bestaande sleutelobjecten kunnen tijdelijk ongeldig worden en later herstellen. Dit is geen vernietiging van hun recepten.
- Een nieuwe geometrische oplossing die ontstaat **ná** het maken van de oorspronkelijke 1–3 punten krijgt **niet automatisch** een nieuw persistent object.
- Create van 1–4 onafhankelijke constructiepunten gebeurt in **één atomaire commando-/historytransactie**. Nulresultaat, numerieke onzekerheid of permission-failure creëert niets.
- Herbinding mag geen ongemerkte source swap, wijziging van key, promotie van invalid branches of privilege-escalatie veroorzaken. Een rebind waarbij een bestaande sleutel niet betekenisvol aan de nieuwe geometrie gekoppeld kan worden, volgt expliciet de te ontwerpen invalidatiepolicy.
- Handmatige verwijdering van een apart snijpunt is toegestaan via normale objectacties; de resterende punten blijven volgen. Bronverwijdering cascades volgens bestaande dependencyregels. Ongedaan en Opnieuw herstellen bestaande graaf en IDs.
- Geldige zichtbare afgeleide punten blijven selecteerbaar; **ongeldige** punten mogen niet in SVG, PNG, hit testing, snapping, instructiebronkeuze of restricted projecties lekken.

## 7. Compatibiliteit, bestandsschema en permissies

### 7.1 Opslagcontract

De actuele `main` gebruikt `constructionSchema:10` zodra minstens één `lineEllipseIntersection` in het document voorkomt. Nieuwe recepten met `solutionKey` moeten een **nieuwe expliciete featuregate** krijgen. **Voorstel** `constructionSchema:11` voor documenten met ten minste één `circleEllipseIntersection` of `ellipseEllipseIntersection`.

Dit voorstel is **niet gereserveerd of definitief goedgekeurd**; de preflight en de M8-INT.3-A-bijlage leggen het exacte benodigde schema vast. Onderlinge combinatie van 10/11 én legacyrecepten moet aantoonbaar correct werken.

Voorwaarden:
- Het gekozen nieuwe schema ondersteunt daarnaast alle eerdere geldige `constructionSchema:1..10`-constructies, inclusief `matchAB`, bestaande lijn–ellips-branches, gekoppelde ellipsen, regio's en asreferenties.
- `constructionSchema:11` mag **niet** een `lineEllipseIntersection` als voorwaarde hebben; gemengde documenten met of zonder lijn–ellips zijn geldig zolang ten minste één .3-recept bestaat.
- Oudere documenten behouden hun **minimaal noodzakelijke schema**; géén onbedoelde schema-upgrade na roundtrip.
- `document.version` en `ellipseSchema:1` volgen bestaande featuregates; nieuw documenttype/-versie alleen als het daadwerkelijke readercontract dat bewezen vereist.
- Elke opgeslagen key heeft een **strict schema**; onbekende velden, NaN, ongeldige source refs/rolvolgorde/keys, oude schema 10 met nieuwe conic-recepten, cycles, ontbrekende objecten en beschadigde gemengde data worden **atomair geweigerd**.
- Alle toegelaten `construction.kind`-recepten, source keys en documentmetadata moeten import/export, replay, duplication, history en inspector/rebind intact doorlopen. Een oude parser mag de nieuwe dependenten nooit stilzwijgend als vrije punten laden.

### 7.2 Command-/autoriseringscontract

- Interne gereedschap-ID's zijn `construct:circleEllipseIntersection` en `construct:ellipseEllipseIntersection`. De UI biedt ze **niet** afzonderlijk als zichtbaar gereedschap aan.
- Autorisatie op UI-aanbod, bronselectie, `construction.create`, property-inspector, rebind, restricted export en undo/replay blijft bestaande `RuntimeSession`-/permissioncode gebruiken.
- Permissies zijn **receptspecifiek**: mogen lijn–ellips of cirkel–cirkel bouwen geeft niet automatisch het recht op circle–ellipse of ellipse–ellipse.
- Hergebruik `ToolCatalog`, `IntersectionDispatcher`, `EditorApp.intersectionContextPlans/startContextConstruction`, `Engine.constructIntersection`, `ConstructionService`, `IllustrationModel`; voeg geen parallelle autorisatie- of lifecyclelaag toe.
- In een restricted document mogen niet-geautoriseerde bronnen of ongeldig geworden sleutels niet via zoeken, contextmenu, preview, statusdetail of export worden onthuld.
- Geen `selectedBranches`-UI of individuele oplossingskeuze introduceren. Een eventueel compatibel intern multi-key command moet strikte schema- en permissionvalidatie hebben.

## 8. Implementatieopdeling na afzonderlijke GO

| Fase | Resultaat | Voorwaarde |
|---|---|---|
| **M8-INT.3-A** | Formele `solutionKey`-bijlage, bewijs/tegenvoorbeelden, exacte schema- en lifecyclekeuze; optioneel read-only numerieke prototypefixtures buiten productie | **Afzonderlijke inhoudelijke GO** op identiteit vóór verdere implementatie |
| **M8-INT.3-B** | Analytische/numeriek betrouwbare cirkel–ellips-solvers (0–4), gespecialiseerde persistente recepten en tests, geïntegreerd in bestaande Snijpunt-workflow | Goedkeuring .3-A en aparte Codex-opdracht |
| **M8-INT.3-C** | Ellips–ellips inclusief geroteerde/gestuurde ellipsen, degeneraties, 0–4 roots, tangenties en alle getypeerde commando-/permissionpaden | Bewezen werking .3-A/B; kan technisch in dezelfde featurebranch na apart beslismoment |
| **M8-INT.3-D** | Volledige Node/Edge-, security-, mixed-schema-, lifecycle- en handmatige acceptatie; implementatieverslag en merge | Technische en handmatige acceptatie, expliciete merge-GO |

**Geen impliciete afhankelijkheid van M8-INT.2.** .3 gebruikt uitsluitend de reeds geïmplementeerde `circle`- en `ellipse`-geometrie. Later toegevoegde conic-objecttypen blijven onder afzonderlijke contracten vallen.

## 9. Onafhankelijke wiskundige acceptatiematrix

Verplichte analytisch onafhankelijke testorakels — controleer behalve coördinaten ook **aantal unieke punten**, redenstatus, gekozen bronrolvolgorde, sleutels, persistente IDs, Undo/Redo en herstel. `C_r` duidt de cirkel met straal \(r\) in de oorsprong aan; `E` is de ellips \(x^2/25+y^2/9=1\), tenzij anders vermeld.

| Test | Geometrie | Verwachte verschillende reële oplossingen |
|---|---|---|
| **INT-301** | `C_4` met `E` | **4:** \((\pm 5\sqrt7/4,\ \pm9/4)\) in alle vier tekencombinaties |
| **INT-302** | `C_2` met `E` | **0**, gescheiden |
| **INT-303** | `C_3` met `E` | **2 raakpunten:** \((0,\pm3)\); geen duplicaten |
| **INT-304** | Cirkel centrum \((7,0)\), straal 2 met `E` | **1 raakpunt:** \((5,0)\) |
| **INT-305** | Cirkel centrum \((1,0)\), straal 4 met `E` | **3:** \((5,0)\) (raak) en \((-15/8,\pm3\sqrt{55}/8)\) |
| **INT-306** | `circle` centrum O straal 4 vs. `ellipse` centrum O met `a=b=4` | **COINCIDENT_CONICS**, nul gecreëerde punten |
| **INT-307** | `E` vs. dezelfde ellips, tweede object 90° geroteerd met `a=5,b=3` | **4:** \((\pm15/\sqrt{34},\pm15/\sqrt{34})\) |
| **INT-308** | Twee identieke `E`-vormen, centra \((0,0)\) en \((2,0)\) | **2:** \((1,\pm6\sqrt6/5)\) |
| **INT-309** | Twee identieke `E`-vormen, centra \((0,0)\) en \((10,0)\) | **1 raakpunt:** \((5,0)\) |
| **INT-310** | Twee identieke `E`-vormen, centra \((0,0)\) en \((12,0)\) | **0** |
| **INT-311** | Ellips `E` vs. tweede `ellipse` met `a=b=4` en centrum \((1,0)\) | **3** als INT-305; zelfde resultaat onafhankelijk van objecttype van tweede conic |
| **INT-312** | Twee ellipsen met dezelfde analytische contour maar equivalente rotatie/assenrepresentatie | **COINCIDENT_CONICS** |
| **INT-313** | Cirkel–ellips en ellips–ellips, elk in beide UI-selectievolgordes | Zelfde punten; canonieke rolvolgorde conform §3; keys/IDs zonder swap |
| **INT-314** | 4→2→4, 4→3→4 en 4→1→4 door gecontroleerde bronbeweging | Bestaande IDs/keys behouden, ongeldige takken herstelbaar; geen spontane punten |
| **INT-315** | Root kruist \(\theta=0\) op eerste curve; twee wortels met dezelfde x of y | Geen key-wissel door sortering of periodegrens |
| **INT-316** | Rotatie \(0^\circ,15^\circ,45^\circ,60^\circ,90^\circ\), vrije en brandpuntgestuurde ellipsen | Volledige oplossingen, raakpunten en residuals; bij onzekerheid expliciet `NUMERIC_UNRESOLVED` |
| **INT-317** | Zeer dunne ellips, grote maar legale offsets, bijna raak/nabij samenvallend | Geen fictieve punten of ongefundeerde samensmelting |
| **INT-318** | Opslaan, heropenen, replay, Undo/Redo, rebind, duplicatie, layers en downstream punt-afhankelijken | Identieke keys, ID's, referenties en reproduceerbare resolver |
| **INT-319** | Mixed legacy + schema11, onjuiste schema11/keys/refs, import zonder nieuwe featuregate | Juiste schema-/strictvalidatie; atomair weigeren zonder dataverlies |
| **INT-320** | Restricted mode, meerdere permissieprofielen, verborgen/locked conics, denied export | Geen object-, command-, menu- of metadata-lek |
| **INT-321** | Sidebar, fullscreen, radiaalmenu cirkel/ellips, bronambiguïteit, succes/geen oplossing | Eén Snijpunt-tool; direct atomair; na succes Selecteren, bij nul actief |
| **INT-322** | Ongeldige afhankelijke ellips, herstel, SVG/PNG/hit/snap | Alleen geldige geautoriseerde points; herstelbare keys en afgeleiden |
| **INT-323** | Regressie `lineIntersection`, `lineCircleIntersection`, `circleCircleIntersection`, `lineEllipseIntersection` | Bestaande recepten, branches, schema 1–10 en editor-UX ongewijzigd |

**Opmerking over dynamische identiteit:** INT-314/315 kunnen pas definitief als **PASS** gelden na de goedgekeurde `solutionKey`-bijlage en de daar exact vastgelegde ondersteunde/ambiguïteitsgevallen. Codex mag niet achteraf een falende identiteitstest verzwakken om de solver als af te tekenen.

## 10. UI- en handmatige acceptatie

Minimaal door gebruiker te controleren na toekomstige implementatie:

1. Cirkel selecteren → radiaalmenu Constructie → Snijpunt → ellips: bij vier kruisingen vier punten in één actie.
2. Ellips selecteren → Constructie → Snijpunt → cirkel: dezelfde oplossingen.
3. Twee ellipsen kruisen op vier plaatsen: alle vier onmiddellijk; na constructie automatisch terug naar **Selecteren**.
4. Raakcontact: slechts één punt voor enkelvoudige tangentie; geen dubbele punten op dezelfde locatie.
5. Geen kruising/samenvallende contouren: geen documentmutatie en Snijpunt blijft actief.
6. Versleep/roteer een bron door 4→2→4: gecreëerde punt-ID's en hun labels/stijl blijven op hun contractuele tak, of betrokken takken worden zichtbaar als herstelbaar ongeldig gemarkeerd zonder swap.
7. Eén Undo verwijdert alle bij één actie gecreëerde punten; Redo herstelt die exact; JSON export/import behoudt keys en bronrelaties.

## 11. Test-, documentatie- en acceptatiepoorten

**Verplichte preflight** na implementatie-GO: lees `AGENTS.md`, `CONSTRUCTIONS.md`, `DOCUMENT-FORMAT.md`, `docs/UI-RADIAL-9-CONTRACT-DRIVEN.md`, `docs/CORE-1-ARCHITECTURE-DESIGN.md`, `ellipse-geometry.js`, `construction-service.js`, `intersection-dispatcher.js`, `model.js`, `index.js`, `permission-runtime.js`, `editor.js`, hoofdcontract 1.1.2, .1-contract 1.0.1, dit .3-contract en actuele roadmap. Geen productiecode aanpassen voor de preflight is vastgelegd.

Na de goedgekeurde identiteitsbijlage en **afzonderlijke implementatie-GO**:
- `npm test` volledig, inclusief onafhankelijke solver-/schema-/security-/lifecycle-fixtures;
- `npm run test:edge` volledig, inclusief cirkel-/ellipsradiaalmenu, twee bronvolgordes, atomic Undo/Redo en geen `pageErrors`;
- regressies voor alle 4 eerdere snijpuntrecepten, schemata 1–10 en reeds ondersteunde M8a/M8b-constructies;
- werkelijk uitvoerbewijs en codewijzigingen in `docs/M8-INT-3-IMPLEMENTATION-REPORT.md`;
- **handmatige gebruikersacceptatie vóór merge**.

Codex rapporteert het exacte aantal tests, mislukkingen, skips, wijzigingen aan de schema-featuregate, nieuwe reasoncodes, numerieke beperkingen en restambiguïteit. Tests worden niet afgezwakt om groen te worden.

## 12. Nog openstaande besluiten

1. **Verplicht vóór implementatie:** exacte, bewezen `solutionKey`-representatie en bijbehorende matching-/ambiguïteitspolicy in het afzonderlijke M8-INT.3-A-identiteitscontract.
2. Exacte nieuwe constructionSchema-gate (voorstel 11) en strikt export-/import-/replaygedrag na actuele preflight.
3. Concreet quartic-isolatiealgoritme en bewijs van volledige enumeratie/tangentiedetectie onder de numerieke foutbegroting.
4. Definitieve opsplitsing van cirkel–ellips en ellips–ellips in Codex-branches/commits, met behoud van de huidige universele Snijpunt-architectuur.

**Geen implementatie-GO:** dit door de gebruiker goedgekeurde hoofdontwerp geeft geen impliciete GO voor de afzonderlijke identiteitsbijlage of de productie-implementatie. Geen code, schema, tests, bestaande documenten of UI wijzigen op grond van dit document alleen.

---

**Einde M8-INT.3-hoofdcontract v1.0.1 — inhoudelijk goedgekeurd; identiteitsbijlage M8-INT.3-A ter afzonderlijke goedkeuring; geen implementatie-GO.**
