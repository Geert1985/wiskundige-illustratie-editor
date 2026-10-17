# WIE — M8-INT: Universeel snijpuntgereedschap en snijpunten van kegelsneden

**Documentversie:** 1.1.1  
**Datum:** 17 oktober 2026  
**Status:** normatief hoofdcontract — M8-INT.0 afgerond en geïntegreerd op `main`; voor M8-INT.1/.2/.3 afzonderlijke implementatie-GO vereist  
**Project:** From Zero 2 Infinity — Wiskundige Illustratie Editor (WIE)  
**Repository:** [`Geert1985/wiskundige-illustratie-editor`](https://github.com/Geert1985/wiskundige-illustratie-editor)  
**Referentie:** M8-INT.0 is op 17 oktober 2026 handmatig geaccepteerd en op `main` geïntegreerd (PR #27); roadmap v2.8.25. Het afzonderlijke [M8-INT.1-lijn–ellipscontract v1.0.0](M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md) is opgesteld ter goedkeuring. Verifieer bij vervolgwerk opnieuw branch, HEAD en feitelijke code.  
**Afhankelijkheid:** bestaande M5b-constructies en M8a-ellipsen; M8b blijft buiten scope.  
**Gerelateerde afzonderlijke roadmapbeslissing:** *Punt op object*; dit is niet hetzelfde als *Snijpunt* en valt buiten M8-INT.

> **Normatieve status.** Versie 1.1.1 actualiseert de M8-INT.0-status en verwijst naar het nieuwe afzonderlijke .1-fasecontract. De goedgekeurde UX blijft voor **alle M8-INT-fasen**: **onmiddellijk alle geldige unieke snijpunten aanmaken na twee ondubbelzinnige bronselecties**, zonder individuele puntkeuze of aparte bevestiging. M8-INT.0 is geïmplementeerd, handmatig geaccepteerd en op `main` geïntegreerd. M8-INT.1 heeft een ontwerpvoorstel maar **nog geen implementatie-GO**; .2/.3 blijven toekomstig. Bestaande persistente recepten blijven compatibel.

---

## 1. Doel, productbesluit en acceptatiegrens

De gebruiker kiest **één gereedschap `Snijpunt`** en selecteert twee geometrische bronnen in willekeurige volgorde. Zodra de tweede bron ondubbelzinnig vastligt, maakt WIE **onmiddellijk alle actuele, eindige, geïsoleerde en geldige snijpunten** als afhankelijke `point`-objecten in **één atomaire Undo/Redo-transactie**. Er is geen individuele puntselectie, kandidatenpreview of afzonderlijke bevestigingsknop. Bij overlappende klikbare geometrie mag uitsluitend een keuze tussen bedoelde **bronnen** worden gevraagd.

Een **uniforme gebruikersinterface betekent niet één universele algebraïsche solver of één nieuwe persistente `construction.kind`**. Elke opgeslagen snijpuntconstructie behoudt een gevalideerde, gespecialiseerde receptsoort en een reproduceerbare takidentiteit. De bestaande `ConstructionService`, de dependency graph, autorisatie, commando's, geschiedenis, renderer en documentserialisatie blijven de enige eigenaars van hun respectieve verantwoordelijkheden.

**Minimale release-definitie M8-INT.0:** na bewezen gelijkwaardigheid vervangt één zichtbare menuvermelding `Snijpunt` de drie gespecialiseerde snijpuntknoppen, zonder bestaand document, recept, brononderdeel of functiepad te breken. **Volledig traject:** uitbreiding naar lijn–ellips, later andere geregistreerde kegelsneden en ten slotte paren kegelsneden.

Niet inbegrepen: algemene algebra-/CAS-engine, grafieken van willekeurige functies, symbolische exacte wortels, automatisch toevoegen van nieuwe punt-ID's bij latere bronbeweging zonder nieuwe expliciete bronpaarselectie, snijpunten met de **gevulde oppervlakte** van een vlakobject, 3D-intersecties, een tweede dependency graph, algemene topologische booleans, automatische typeconversie van parabolische/hyperbolische objecten die nog niet bestaan, of de afzonderlijke functie *Punt op object*.

## 2. Oorspronkelijke M8-INT.0-codebasis (historische inventarisatie; .0 inmiddels geïntegreerd op `main`)

### 2.1 Reeds aanwezig

- In `construction-service.js` staan de recepten `lineIntersection` (`point`, `['line','line']`), `lineCircleIntersection` (`point`, `['line','circle']`) en `circleCircleIntersection` (`point`, `['circle','circle']`). De twee laatstgenoemde ondersteunen expliciete `branch` 0 en 1; `lineIntersection` heeft geen branch.
- `ConstructionService.contract`, `referencesForRole`, `referenceOptions`, `validateReferences`, `evaluate`, `resolve`, `describe` en `contextualPlans` verzorgen bronrollen, getypeerde onderdelen, validatie en herstelbaar ongeldige afgeleide objecten.
- `MI.LinearGeometry.domain/accepts`: `straight` heeft `(-∞,+∞)`, `ray` `[0,+∞)`, en `line` (lijnstuk), `vector`, `dimension` en de als `line` behandelde veelhoekrand `[0,1]`.
- De lijnrol laat volledige lineaire objecten en `{objectId,part:'edge',index}` voor een bestaande veelhoekzijde toe. Assen zijn specifieke `{kind:'axis',frame:'cartesian',axis:'x'|'y'}`-bronnen, met receptafhankelijke roltoelating; zij zijn **geen gewone object-ID's**.
- `MI.EllipseGeometry.fromDefinition` geeft voor een geldige ellips o.a. centrum, `a`, `b`, basisvectoren `u`,`v`, grenzen en `pointAt(t)`. Ook zelfstandige ellipsen bestaan; bronrecepten voor ellipsen zijn `ellipseByFociAndSum` en `ellipseByFociAndPoint`.
- `Engine.construct` bouwt momenteel voor lijn–cirkel en cirkel–cirkel alle op dat moment geldige oplossingen in één modeltransactie. Individuele oplossingselectie is geen vereiste; de eerste featurebranchimplementatie met selectieve knoppen moet worden vereenvoudigd.
- De sidebar bevat nu de drie afzonderlijke menu-ingangen `construct:lineIntersection`, `construct:lineCircleIntersection` en `construct:circleCircleIntersection` onder `Constructies > Puntconstructies`. `ToolCatalog` wordt gedeeld door sidebar en fullscreen.
- `model.js`, `index.js`, `editor.js`, `editor.html`, de SVG/PNG-export en history/command-paden ondersteunen al gekoppelde puntobjecten; zij mogen niet worden vervangen.

### 2.2 Huidige semantiek die ongewijzigd moet blijven

- `lineCircleIntersection`: branch **0** is de kleinere en branch **1** de grotere positie langs de **gerichte lijnparameter**; een raakgeval houdt alleen branch 0 geldig.
- `circleCircleIntersection`: branch **0** is links en branch **1** rechts bekeken in de georiënteerde richting van centrum cirkel A naar centrum cirkel B (gekruist product positief/negatief); een raakgeval houdt alleen branch 0 geldig.
- `lineIntersection`: maximaal één geïsoleerd snijpunt, geen branch.
- Bestaande `construction.kind`, opgeslagen `branch`, bronnen, point-ID's en referenties blijven geldig, ook nadat oude UI-knoppen verdwijnen.

### 2.3 Verplichte implementatiepreflight

Voordat productiecode wordt veranderd moet Codex de actuele branch/HEAD, `AGENTS.md`, werkelijke scriptlaadvolgorde, `ConstructionService`, de `Engine.construct`-transactie, huidige `ToolCatalog` en permissies, de daadwerkelijke selectiecontroller, documentversies en bestaande Node/Edge-tests **read-only** inventariseren. Bij een afwijking van §2: documenteer het verschil en kies de kleinste compatibele aanpassing; geen stille contractomkering.

## 3. Fasering en afhankelijkheden

| Fase | Verplichte levering | Beperking | Exitgate |
|---|---|---|---|
| **M8-INT.0** | Eén werkend universeel `Snijpunt`-gereedschap voor **bestaande lijn–lijn, lijn–cirkel en cirkel–cirkel** | Geen nieuwe kegelsnede-solver; legacyrecepten behouden | Functionele pariteit, directe atomaire creatie van alle geldige punten, UX, Node/Edge, bestaande documenttests |
| **M8-INT.1** | Analytische **lijn–ellips**-berekening, dispatch en gekoppelde puntrecepten | Bestaande ellipsen van M8a; 0/1/2 oplossingen | Analytische fixtures, raakpunt/domein/branches, rondreisdocumenten en herstel |
| **M8-INT.2** | Gedeelde lijn–kegelsnede-adapter voor later werkelijk geïmplementeerde kegelsneden | Parabool/hyperbool **niet** bouwen zonder eigen goedgekeurd objectcontract | Contract-/capabilitytests voor ieder werkelijk toegevoegd type |
| **M8-INT.3** | Cirkel–ellips en ellips–ellips (eventueel verdere bestaande kegelsnedeparen) | Reële geïsoleerde punten, max. 4 bij twee verschillende niet-ontaarde kwadrieken | 0–4 oplossingen, raakpunten, samenvallen, numerieke regressie en takidentiteit |

De exitgate van een fase is tevens de instapvoorwaarde voor de daaropvolgende. **M8-INT.0 eerst afronden en accepteren**; geen vermenging met de afzonderlijke migratie *Punt op object*.

## 4. Universele bron- en capabilitymatrix

`L` staat voor een door de actuele bronrol geaccepteerde rechte/lijncomponent, met fysieke domeinbegrenzing; `C` voor cirkel; `E` voor ellips; `K` voor later goedgekeurde kegelsnede. De matrix classificeert de **contour**, niet het binnengebied.

| Bron A | Bron B | Algoritme / recept | Eerste release | Aantal geïsoleerde punten |
|---|---|---|---|---|
| `L` | `L` | `lineIntersection` (hergebruik) | .0 | 0–1 |
| `L` | `C` | `lineCircleIntersection` (hergebruik) | .0 | 0–2 |
| `C` | `C` | `circleCircleIntersection` (hergebruik) | .0 | 0–2 |
| `L` | `E` | nieuwe `lineEllipseIntersection` | .1 | 0–2 |
| `L` | `K` | gecontracteerde typeadapter, alleen indien objecttype bestaat | .2 | bij niet-ontaarde kegelsnede max. 2 |
| `C` | `E` | nieuwe `conicConicIntersection`-familie, concrete receptnaam bij schema-audit vastleggen | .3 | 0–4 |
| `E` | `E` | idem | .3 | 0–4 |
| overige `K`–`K` | waar ondersteund | expliciete geregistreerde solver, niet impliciet aan | latere .3-uitbreiding | gevalspecifiek |

**Lineaire onderdelen:** `straight`, `ray`, `line` (lijnstuk), `vector`, `dimension` en `polygon.edge` zijn in .0 kandidaatlijnen conform hun bestaande `line`-rol en hun werkelijke domein. Een driehoekzijde is de randreferentie van een polygon met drie punten, geen nieuw objecttype. Een *volledige* driehoek, vierhoek, polygoon, cirkelsector, gevuld gebied of tekstobject wordt **niet stilzwijgend als één vlakke contourbron geaccepteerd**. Voor volledige polygonen is eventueel later een expliciet `alle randen`-contract nodig, met meervoudige source references en deduplicatie van gedeelde hoekpunten.

**Assen:** x-/y-as zijn enkel bron als de gekozen bestaande receptrol dit expliciet toelaat (`lineIntersection` rollen 0/1; `lineCircleIntersection` lijnrol 0). Voor de nieuwe lijn–ellips-uitbreiding wordt de asrol pas na tests expliciet geregistreerd. Een niet-toegestane as is **niet** te omzeilen door hem tijdelijk als `straight` te materialiseren.

**Overige gevallen:** niet-ondersteund is iets anders dan geen snijpunten. `POINT`–`CIRCLE`, `ELLIPSE`–`REGION`, `POLYGON`–`POLYGON` als gehele objecten enz. krijgen geen fictieve kruising. Exact hetzelfde brononderdeel als beide bronrollen heeft geen geïsoleerd resultaat; twee verschillende randen van hetzelfde polygon-object mogen wel een paar vormen mits beide referenties volledig gevalideerd zijn.

## 5. Architectuur en interfacecontract

### 5.1 Lagen en verantwoordelijkheid

```text
ToolCatalog: één zichtbare tool Snijpunt
       ↓
Editor-interactie: kies bron A → kies bron B (los enkel bronambiguïteit op) → construeer onmiddellijk alle geldige punten
       ↓
Intersection dispatcher / capability-adapter (puur; geen modelmutatie)
       ↓
Bestaande ConstructionService-recepten en gespecialiseerde geometriehelpers
       ↓
Bestaande Engine/commands/model/history/resolver → afgeleide point-objecten
       ↓
Bestaande renderer, hit-test, snap, inspector, SVG/PNG en JSON
```

- **Één bron van waarheid:** dispatcher gebruikt `ConstructionService.contract/referencesForRole` of hun contractgestuurde adapter en bewaart de bestaande bronreferentieobjecten (`objectId`, `part`, `index` of de expliciet toegelaten asreferentie).
- **Geen nieuwe parallelle graaf, permissiedienst, commandbus, modelstore of renderer.** Solvers zijn zuivere rekenfuncties op valide modelruimtegeometrie.
- De dispatcher levert een gesloten resultaatspecificatie zoals `{kind,sources,candidates:[{branch?,x,y,reasonCode}],status}`. Dit is een **interfaceconcept**, geen verplicht nieuwe globale API-naam; de bestaande runtime bepaalt de kleinste passende modulegrens.
- De dispatcher **normaliseert de bronvolgorde naar het receptcontract**: lijn vóór cirkel/ellips; bij twee cirkels blijft de **door gebruiker gekozen volgorde** behouden om de links/rechts-definitie van nieuwe constructies te bepalen. Voor bestaande cirkel–cirkel-documenten worden bronvolgorde en branch absoluut niet herschreven.
- De tweede ondubbelzinnige bronselectie start direct één geautoriseerde constructieopdracht met actuele modelgeometrie. Die bepaalt en creëert **alle** geldige unieke punten. Geen schermruimteformules, opgeslagen kandidaatkeuze of tussenpreview. Rechten, bronnen en oplossingen worden vóór commit opnieuw gevalideerd.
- Zelfstandige ellipsen en geconstrueerde ellipsen worden identiek behandeld via de opgeloste `EllipseGeometry.fromDefinition`; het snijpunt koppelt aan het **ellips-object-ID**, niet rechtstreeks aan de brandpunten. Zo blijft de transitive dependency graph eigenaar.

### 5.2 Persistente objecten

- Elk aangemaakt snijpunt is één bestaand objecttype `type:'point'`, met eigen duurzame `id`, eigen stijl/label/layer/lock en een `construction`-recept met **precies de relevante twee bronnen**.
- M8-INT.0 maakt **geen nieuwe** `construction.kind`. Oude recepten worden rechtstreeks gebruikt; externe tool-ID `construct:intersection` (voorgesteld, vóór productiecode definitief te controleren) is **geen** nieuw opslagrecept.
- M8-INT.1 maakt één `lineEllipseIntersection` met `resultType:'point'`, `sourceRoles:['line','ellipse']`, `computedFields:['x','y']`, `branches:[0,1]`, zonder vrij parameterobject.
- M8-INT.3 maakt gevalideerde, specifieke recepten of een getypeerd conic-pair-recept met bronrolrestricties en een vastgelegd brancheschema. **Geen onbegrensd generiek `construction.kind:'intersection'`** en geen willekeurige `kind`-tekst uit UI-invoer.
- De **opslag-schema-evolutie** wordt uitsluitend geactiveerd als een nieuw persistente receptsoort dat vereist. De feitelijke huidige import-/exportwriter bepaalt de minimaal compatibele verhoging en featuregating. Geen onnodige documentversiemigratie in .0.
- Herberekende (`x`,`y`) zijn computed fields: geen vrij slepen of directe coördinatenbewerking zolang gekoppeld. Ontkoppelen blijft bestaande gedocumenteerde handeling.

### 5.3 Selectie en permissies

- `toolAllowed` en bestaande capability-/restricted-source-/lockregels gelden **bij tonen, bronselectie en definitieve uitvoering**. Verborgen bronnen zijn niet automatisch ongeldig als constructiebron; niet-selecteerbare of onbevoegde bronnen mogen geen ongeautoriseerde brongegevens, statusinformatie of export lekken.
- Geïndexeerde veelhoekranden (`part:'edge'`, `index`) worden als referentie bewaard en bij iedere evaluatie opnieuw gecontroleerd. Bron-herbinding gebruikt alleen het bestaande inspector- of constructiepad; valideer opnieuw.
- Werkelijke canvas-hitdetectie, z-volgorde en 12-CSS-pixel-achtige bestaande bronselectietolerantie worden gerespecteerd. Bij overlappende kandidaten verschijnt een ondubbelzinnige keuzemogelijkheid, zonder willekeurige verborgen bron te kiezen.
- Cyclus, ontbrekende bron, onjuiste rol, ongeldige `branch`, niet-eindige data, ontoegestane asreferentie en permission failure veroorzaken een **atomaire weigering**, niet een deels geconstrueerd document.

## 6. Exact UX-contract voor M8-INT.0 — automatisch alle snijpunten

### 6.1 Eén herkenbaar gereedschap

De zichtbare vermelding is **Snijpunt** onder `Constructies > Puntconstructies`, gedeeld via `ToolCatalog` in sidebar, zoeken en fullscreen. De oude gespecialiseerde knoppen verdwijnen pas **na** bewezen pariteit, groene regressies en expliciete handmatige gebruikersacceptatie. Hun persistente recepten en oude tool-ID's blijven compatibel.

### 6.2 Stappen, interactiestaat en atomair commitmoment

1. **Activeren:** de gebruiker kiest `Snijpunt`; status: `Selecteer het eerste object.` Geen mutatie.
2. **Bron A:** kies een geschikte geometrische drager, as of specifieke polygonzijde. Status: `Selecteer het tweede object.` Een ongeschikte bron wordt afgewezen met feedback.
3. **Bron B:** kies de tweede geschikte bron in willekeurige volgorde. Bij meerdere overlappende **bron**-kandidaten wordt uitsluitend de bronambiguïteit opgelost met een toegankelijke keuzelijst. Dat is geen keuze tussen snijpunten. Zodra de bron ondubbelzinnig is, volgt stap 4 **zonder extra klik**.
4. **Onmiddellijk maken:** classificeer het bronpaar; valideer bronnen en rechten opnieuw via de bestaande commandketen; bepaal alle eindige, geïsoleerde, geldige punten met behouden branchidentiteit. Bij `N>0` maakt **één atomaire Undo/Redo-actie precies alle N punten**; bij `N=0` komt er geen punt of geschiedenisitem bij. Er is geen voorafgaande resultatenpreview en geen bevestigingsknop.
5. **Na uitvoering:** toon `N snijpunt(en) toegevoegd.` of specifieke geen-oplossingfeedback. Het gereedschap blijft actief voor een **nieuw** paar; oude bronkeuzes worden niet automatisch opnieuw gebruikt.
6. **Annuleren:** `Esc`, toolwisseling, `pointercancel`, toepasselijk focusverlies, nieuw document en dispose annuleren een **nog onvoltooide** bronselectie zonder modelmutatie. **Na succesvolle constructie** draait alleen normaal `Ongedaan` de ene aangemaakte transactie terug.

**Geen afzonderlijke puntkeuze:** geen `Snijpunt 1/2/3/4`-keuzeknoppen, geen `Geselecteerde snijpunten maken`, geen selecteerbare kandidatenoverlay, geen tijdelijke `selectedBranches`-UI-staat, en geen tweede commitmoment. Een korte hover- of selectiehighlight van een **bron** mag blijven en creëert nooit geometrische previewobjecten.

**Toegankelijkheid:** behoud toetsenbordselectie van objecten en de bestaande focusregeling. Indien nodig is uitsluitend de lijst van overlappende **bronobjecten** bedienbaar via Tab, Enter/Spatie en Escape, met duidelijke ARIA-labels en focusretour. De statusmelding mag niet alleen door kleur worden overgebracht. Contextueel starten gebruikt de bestaande `contextualPlans` / `startContextConstruction` waar toepasselijk; geen omweg langs de gewone bron-/permissionvalidatie.

**Stabiele IDs:** ieder op dat moment geldig snijpunt krijgt een eigen duurzaam punt-ID en eigen gevalideerd bronrecept en branch. Later door beweging ontstane extra takken genereren **geen spontane punt-ID's**. Eerder aangemaakte, tijdelijk ongeldige takken behouden hun identiteit en kunnen herstellen. Een ongewenst punt afzonderlijk wissen blijft een gewone objectactie.

### 6.3 Fout- en grensgevalmeldingen

| Situatie | Resultaat | Mutatie |
|---|---|---|
| Geldig bronpaar met 1–4 unieke punten (faseafhankelijk) | Direct `N snijpunt(en) toegevoegd.` | **Alle N in één actie** |
| Geen kruising of alleen buiten het objectdomein | `Geen snijpunt binnen de gekozen objecten.` | Geen |
| Exact/numeriek betrouwbaar raakpunt | Eén punt | Eén |
| Niet-ondersteund bronpaar | `Deze combinatie wordt nog niet ondersteund.` | Geen |
| Evenwijdige niet-samenvallende lijnen | `Deze lijnen hebben geen snijpunt.` | Geen |
| Samenvallende dragers/krommen (oneindige verzameling) | `De objecten vallen samen; er is geen afzonderlijk snijpunt.` | Geen |
| Ongeldige bron, degeneratie of numerieke onzekerheid | Begrijpelijke specifieke reden | Geen |
| Bron/rechten ongeldig geworden vóór uitvoeren | Opnieuw valideren; atomaire weigering | Geen gedeeltelijke commit |

**Legacy-afspraak (normatief):** een bestaand gespecialiseerd `construction.create`-commando **zonder** `selectedBranches` betekent **alle geldige takken**. Bij tangent of begrensde lijn met slechts één geldige tak blokkeert een andere ongeldige tak niet. Behoud de oorspronkelijke `branch` (dus eventueel alleen branch 1). Een reeds aanwezige expliciete `selectedBranches`-commandoptie mag intern voor compatibiliteit blijven, maar hoort **niet** bij de universele gebruikersinterface; expliciet ongeldige opgegeven branches worden atomair geweigerd.

## 7. Wiskundig contract M8-INT.0 — hergebruik

### 7.1 Lijn–lijn

Beschouw in modelruimte `P(t)=A+t(B−A)` en `Q(s)=C+s(D−C)`. De bestaande `lineIntersection`-oplosser bepaalt bij niet-parallelle dragers één kandidaat en filtert beide parameters met `MI.LinearGeometry.accepts`. Twee parallelle, verschillende dragers hebben geen snijpunt; samenvallende dragers hebben geen **uniek geïsoleerd** snijpunt. Neem deze bestaande semantiek integraal over; verander niet ongevraagd de historisch vastgelegde tolerantie of resultaatscode.

### 7.2 Lijn–cirkel

Neem de bestaande lijnparameter als georiënteerde takbasis: branch 0 is de eerste en branch 1 de tweede langs de toenemende parameter. Bereken voor het **onbegrensde** lijnverlengde beide takken en pas vervolgens per tak het geldige domein toe. Daardoor mag een lijnstuk of halfrechte slechts één van de twee takken behouden **zonder die tot branch 0 te hernummeren**. Bij raakpunt blijft branch 0, branch 1 krijgt herstelbare ongeldigheid `MERGED_INTERSECTION`. Ongeldige/straalnul-cirkels leveren geen kandidaat.

### 7.3 Cirkel–cirkel

Behoud de bestaande middelpuntvolgorde en linker-/rechtertakken. Tangentie levert maximaal één zichtbaar, uniek punt; samenvallende cirkels geen geïsoleerd snijpunt. Een configuratie met afzonderlijke of ingesloten cirkels heeft nul oplossingen. Geen automatische canonieke sortering van bestaande opgeslagen bron-ID's of omwisseling van `branch`.

### 7.4 Domeinsemantiek

Voor een parameter `t` t.o.v. `x1,y1` en richtingsvector `x2−x1,y2−y1`:

| Object | Toegelaten parameter |
|---|---|
| `straight` | `t ∈ ℝ` |
| `ray` | `t ≥ 0` |
| `line`, `vector`, `dimension`, `polygon.edge` | `0 ≤ t ≤ 1` |
| x-/y-as (alleen toegelaten rollen) | oneindige rechte |

De bestaande kleine domeintolerantie kan afrondingsverschillen nabij eindpunten opvangen; zij mag geen materieel buiten het domein gelegen snijpunt toelaten. Een vector wordt voor snijpuntgeometrie beschouwd als **eindig georiënteerd lijnstuk**, niet als vrije oneindige drager. De bronrand blijft aan zijn geordende polygonhoekpunten gekoppeld.

## 8. Wiskundig contract M8-INT.1 — lijn–ellips

### 8.1 Basisvergelijkingen

Voor een valide, eventueel geroteerde ellips met centrum `C`, halve assen `a ≥ b > 0`, orthonormale vectoren `u` (grote as), `v` (kleine as), geldt:

\[
\left(\frac{(X-C)\cdot u}{a}\right)^2 +
\left(\frac{(X-C)\cdot v}{b}\right)^2=1.
\]

Een onbegrensde lijn wordt voorgesteld door `X(s)=P+s d`, met `d` een eenheidsrichtingsvector. Definieer

\[
\alpha=\frac{(P-C)\cdot u}{a},\quad
\beta=\frac{(P-C)\cdot v}{b},\quad
p=\frac{d\cdot u}{a},\quad
q=\frac{d\cdot v}{b}.
\]

Substitutie geeft:

\[
As^2+Bs+D=0,\qquad
A=p^2+q^2>0,\quad
B=2(\alpha p+\beta q),\quad
D=\alpha^2+\beta^2-1.
\]

- `Δ=B²−4AD < 0`: nul reële snijpunten;
- `Δ=0`: één raakpunt, **branch 0**;
- `Δ>0`: twee oplossingen, na oplopend sorteren van **dezelfde gerichte lijnparameter** `s`: branch 0 en branch 1.

De implementatie mag in plaats van de gewone kwadratische formule een **numeriek stabiele projectie-/voetpuntmethode** of stabiele kwadratische formule gebruiken. Het referentiecontract blijft de oplosverzameling van bovenstaande vergelijking, niet een grafische benadering van de getekende SVG-contour. Rekenkern is in modelruimte onafhankelijk van zoom/pan.

### 8.2 Robuustheid

- Normaliseer eerst lijnrichting en lokale ellipscoördinaten; vermijd direct kwadrateren van extreem grote wereldcoördinaten en onbeschermd aftrekken van bijna gelijke getallen. Laat `EllipseGeometry.fromDefinition` geldig zijn vóór verdere oplossing.
- Gebruik schaalbewuste discriminant-/tangentietolerantie en onafhankelijke **residucontrole** in zowel de lijn- als de ellipsvergelijking. Een `Δ` die binnen de machine-onnauwkeurigheid valt is geen vrijbrief om automatisch een fictieve raakwortel te maken.
- Valideer de werkelijk gevonden modelcoördinaten op eindigheid en de bestaande coördinatenlimiet `±10¹²`. Een niet betrouwbaar te onderscheiden dubbelwortel krijgt `NUMERIC_UNRESOLVED` in plaats van twee willekeurige punten.
- Bepaal de twee takken op de **onbegrensde drager**, **daarna** domeinfiltering voor `straight`, `ray`, `line`, `vector`, `dimension`, polygonrand of expliciet toegelaten as. Filteren mag branch 1 nooit naar branch 0 verschuiven.
- Afgeleide lijnrichting die tot een punt degenereert (`≤` bestaande richtinggrens) geeft `DEGENERATE_DIRECTION`; ongeldige ellips geeft `SOURCE_INVALID` of de relevante bestaande reden.
- Een zeer smalle maar geldige ellips die binnen binary64 nog betrouwbaar kan worden opgelost, moet behouden blijven. Vaste absolute discriminantgrenzen zonder schaalnormalisatie zijn verboden.

### 8.3 Constructierecept

```text
kind:            lineEllipseIntersection
resultType:      point
sourceRoles:     [line, ellipse]
computedFields:  [x, y]
branches:        [0, 1]
parameters:      geen
source order:    line, ellipse
branch 0:        kleinere gerichte lijnparameter (raakpunt bij samenvallen)
branch 1:        grotere gerichte lijnparameter (bij raakpunt herstelbaar ongeldig)
```

Bij beweging door raakstand blijven beide reeds gemaakte `point`-ID's behouden: branch 0 geeft het raakpunt; branch 1 wordt tijdelijk `MERGED_INTERSECTION` en kan later op dezelfde tak terugkomen. Wanneer een punt het eindpunt van een segment passeert, wordt **alleen zijn eigen tak** `OUTSIDE_DOMAINS`. Het andere punt mag niet op de vrijgekomen branch springen.

## 9. Contract M8-INT.2 — uitbreiding naar andere kegelsneden

Het algemene cartesische model van een niet-ontaarde kegelsnede is

\[
Ax^2+Bxy+Cy^2+Dx+Ey+F=0,
\]

met gevalideerde, niet-triviale coëfficiënten en geometrische definitie. M8-INT.2 levert een **type- en capability-adapter** voor deze vorm; de toekomstige parabool en hyperbool worden alleen aangesloten nadat hun eigen objecttype-, geldigheids-, hit-/selectie-, export- en documentcontract daadwerkelijk geïmplementeerd en goedgekeurd zijn.

Substitutie van een parametrische lijn levert een polynoom van graad hoogstens twee; sommige ontwaarde/limietgevallen vallen terug naar lagere graad. Rootmultipliciteit en het lijnobjectdomein worden expliciet afgehandeld. Een geen-tweede-graadsgeval is **niet per definitie** een lege oplossingsverzameling. Ondersteuning wordt per objecttype geregistreerd met eigen bronnormalisatie, solver, redenstatussen en acceptatietests; een niet-geregistreerd type blijft zichtbaar niet-ondersteund.

M8-INT.2 is **geen goedkeuring** om parabool/hyperbool als object te bouwen. Zonder die objectcontracten kan .2 uitsluitend voorbereidende adapter-/contracttests opleveren en **niet** als volledig functioneel gereed worden aangemerkt.

## 10. Contract M8-INT.3 — snijpunten van twee kegelsneden

### 10.1 Reële oplossingen

Voor twee verschillende niet-ontaarde vlakke kwadratische krommen bestaan over de complexe projectieve getallen volgens Bézout in totaal vier snijpunten **geteld met multipliciteit**, mits zij geen gemeenschappelijke component hebben. WIE toont uitsluitend de **verschillende, eindige, reële** punten en dus maximaal vier. Multipliciteit telt **niet** als meerdere zichtbare punten. Twee volledig samenvallende contouren leveren oneindig veel punten en worden niet als 4 geïsoleerde snijpunten geïnterpreteerd.

Een cirkel is mathematisch een speciale kegelsnede, maar zijn huidige WIE-objecttype blijft `circle`. Een ellips met `a=b` is geldig en kan geometrisch samenvallen met een cirkel. De tool moet deze situatie onderscheiden van vier eindige kruisingen.

### 10.2 Oplosstrategie

Voor de huidige cirkel/ellipsparen is het voorgestelde rekenpad:

1. Herleid de eerste valide ellips (of cirkel) naar zijn analytische parametrisatie `X(t)=C+a cos(t)u+b sin(t)v`, `t ∈ [0,2π)`.
2. Vul `X(t)` in de impliciete vergelijking van de **tweede** kegelsnede in. Dit geeft een trigonometische vergelijking met termen tot graad twee in `sin(t)` en `cos(t)`.
3. Reduceer met `z=tan(t/2)` tot een polynoom van graad hoogstens vier; onderzoek `t=π` **afzonderlijk**, omdat dit door de substitutie naar het oneindige z-punt gaat.
4. Gebruik een aantoonbaar robuuste methode voor **alle reële wortels** (isolatie/bounding, schaalnormalisatie, bracketing en verfijning), met expliciete detectie van wortels met even multipliciteit en bijna-tangenties. Een naïef uniform polygoonmonster dat raakpunten kan overslaan is **niet toegestaan** als beslissende solver.
5. Bereken de kandidaatpunten opnieuw uit de analytische geometrie. Controleer beide impliciete residuen, eindigheid en limieten. Dedupliceer geometrisch samenvallende wortels binnen expliciet schaalbewust gecontroleerde toleranties, zonder twee werkelijk verschillende nabije wortels willekeurig samen te voegen.
6. Vergelijk de genormaliseerde kegelsnededefinities op samenvallen, inclusief cirkelvormige ellipsen; behandel indeterminate/numeriek instabiele situaties expliciet en **produceer geen verzonnen punten**.

Equivalent robuuste alternatieven (bijv. resultant met gecertificeerde reële wortelisolatie) mogen alleen na aantoonbare gelijkwaardige numerieke acceptatietests worden gekozen. Een robuuste implementatie kan een extra gespecialiseerde tangentiedetector nodig hebben.

### 10.3 Identiteit van 0–4 oplossingstakken

Het eenvoudige opnieuw sorteren van de **momenteel zichtbare** 0–4 punten kan een bestaande point-ID aan een ander punt koppelen zodra een andere wortel verdwijnt. Dat is **verboden**. Hier geldt een strengere eis dan voor éénmalig tekenen:

- Elke gecommitteerde oplossing bewaart een gevalideerde identiteit (`branch`/`solutionKey`) gekoppeld aan de **oorspronkelijke, onveranderde bronrolvolgorde** en een gedocumenteerde, reproduceerbare branchdefinitie.
- Voor nieuwe recepten mag een **immutabele, in het recept opgeslagen selectiemarkering** (bijv. initiële parametrische positie plus onderscheidende takinformatie) worden gebruikt, mits exact gespecificeerd en veilig gevalideerd. Zij is geen willekeurig intern UI-cacheveld.
- Re-evaluatie moet een al bestaand object deterministisch aan **dezelfde onderscheidbare oplossingscomponent** koppelen; verschijnen of verdwijnen van andere kandidaten hernummert dit object nooit.
- Bij dubbel- of meervoudige wortels is slechts één **uniek zichtbaar geometrisch punt** toegestaan. Andere reeds bestaande takken blijven in de graaf bestaan maar zijn tijdelijk `MERGED_INTERSECTION`, zodat hun ID, stijl, labels en afgeleide kinderen herstelbaar zijn.
- Bij een topologisch overgangsgeval waar de branchcorrespondentie wiskundig of numeriek niet met voldoende zekerheid kan worden vastgesteld, wordt de betrokken tak **herstelbaar ongeldig** (`AMBIGUOUS_BRANCH` of `NUMERIC_UNRESOLVED`) in plaats van een stilzwijgende puntwissel.
- Dezelfde opgeslagen documenttoestand geeft bij import, undo/redo, export en heropenen dezelfde branchmapping **zonder verborgen geschiedenis van muisbewegingen**.

**Verplichte gate binnen .3:** vóór implementatie van de finale 4-wortelconstructies krijgt de gekozen concrete `solutionKey`-representatie en toewijzingsregel een afzonderlijke, testbare schema-/takidentiteitsbijlage. Dit is een expliciet nog open algoritmisch subbesluit, geen toestemming om met simpele rangnummers tot vier te implementeren. De implementatie mag .3 niet afvinken vóór de bijlage en bijbehorende tests geslaagd zijn.

## 11. Dynamische afhankelijkheid, geometrische geldigheid en lifecycle

1. **Geometriewijziging:** bij iedere wijziging van bron A of B recalculeert de bestaande resolver alle afgeleide punten topologisch. Behoud persistente IDs, oorspronkelijke `construction.sources`, `branch/solutionKey`, stijl, naam, label, laag, lock en afhankelijke kinderen.
2. **Tijdelijke ongeldigheid:** als een oplossing de contour of het domein verlaat, samenvloeit, of de bron onoplosbaar wordt, blijft de definitie opgeslagen; `constructionValid=false`, met een betekenisvolle `reasonCode`. Het punt verdwijnt uit canvas/SVG/PNG/hit/snap en wordt later automatisch hersteld.
3. **Brononzichtbaarheid:** `visible=false` op een bron leidt **niet automatisch** tot ongeldigheid van gekoppelde punten; de bestaande zichtbaarheid/afhankelijkheidssemantiek geldt. Een bron die zelf `constructionValid=false` is veroorzaakt `SOURCE_INVALID` downstream.
4. **Wissen:** verwijderen van een bron volgt de bestaande cascade voor alle afgeleiden, inclusief downstream kinderen; één undo herstelt de volledige betrokken graaf.
5. **Detach en duplicatie:** bestaande detachregels blijven. Een gewone duplicatie volgt de bestaande expliciete snapshot-/groepremappingregels, zonder heimelijke gedeelde bronkoppeling. Een gepaste transactie voor meerdere snijpunten behoudt atomariteit.
6. **Herbinding:** nieuwe bronrollen en hun indices/assen worden vóór commit gevalideerd; bij omwisseling van oude cirkel–cirkelbronnen mag de oorspronkelijke branchsemantiek niet stilzwijgend omkeren.
7. **Bestaand punt op kruising:** de tool levert de afhankelijke constructies zodra beide bronnen expliciet en ondubbelzinnig zijn gekozen. Het bestaande onafhankelijke punt wordt niet automatisch tot gekoppeld object omgezet of vervangen.
8. **Geen kandidatenpreview:** de universele tool toont geen berekende snijpuntmarkers vóór de commit. Eventuele hoveraccenten van bronnen zijn geen objecten en worden nooit geëxporteerd.

## 12. Numeriek beleid en statuscodes

### 12.1 Principes

- Berekeningen in `Number` (IEEE 754 binary64) op **modelcoördinaten**; lokaal transleren en normaliseren vóór gevoelige algebra.
- `Math.hypot` en schaalaanpasbare criteria waar dit de betrouwbaarheid verhoogt. Geen numeriek onderscheid puur op gezoomde schermpixels.
- Bestaande grens voor afgeleide modelcoördinaten `|x|,|y| ≤ 10¹²`, eindige bron- en oplossingswaarden, en reeds vastgelegde minimumrichting-/domainregels behouden.
- Voor nagenoeg samenvallende kandidaten geldt een **residugebaseerde** beslissing: geometrische afstand alleen is onvoldoende om dubbele wortels van twee vlakbij gelegen echte wortels te onderscheiden.
- Afronding voor labels of export is **presentatie**; reken met ongeronde waarden en exporteer bestaande numerieke documentwaarden volgens de writer.
- Bij exact grensgevallen: **geen** `NaN`, `Infinity`, infiniteloops, stille clamping of fictieve preview. Onbetrouwbare uitkomsten geven expliciet hersteldbare status.

### 12.2 Status-taxonomie

Bestaande codes behouden voor bestaande recepten: `VALID`, `SOURCE_INVALID`, `DEGENERATE_DIRECTION`, `PARALLEL_LINES`, `COINCIDENT_LINES`, `OUTSIDE_DOMAINS`, `NO_REAL_INTERSECTION`, `ZERO_RADIUS`, `MERGED_INTERSECTION`, `CONCENTRIC_CIRCLES`, `COINCIDENT_CIRCLES`, `SEPARATE_CIRCLES`, `CONTAINED_CIRCLES`, `COORDINATE_LIMIT`, `NON_FINITE_RESULT` waar toepasselijk. Voor nieuwe paren kan de gedeelde UI/solver aanvullend `UNSUPPORTED_PAIR`, `COINCIDENT_CONICS`, `NUMERIC_UNRESOLVED`, `AMBIGUOUS_BRANCH` onderscheiden. **Geen wijziging van oude codebetekenis of bestaand opslagcontract** alleen voor een nettere UI-tekst.

Het resultaat `geen oplossing` verschilt van `oplosser onbekend`, `oneindig veel oplossingen`, `ongeldige bron` en `onvoldoende numerieke precisie`; die categorieën moeten in unit- en UI-tests afzonderlijk terugkomen.

## 13. Documentformaat, historie, beveiliging en compatibiliteit

- **.0:** geen `constructionSchema`- of documentversiebump, geen importmigratie en geen omzetten van oude recepten. Alle bestaande opgeslagen M5b-snijpunten blijven identiek interpreteerbaar; als het oude gereedschap wordt verborgen, blijft bewerken van die objecten in `Relaties`/inspector mogelijk.
- **.1/.3:** de **minimaal noodzakelijke**, expliciet gedocumenteerde schema-/featurecompatibiliteit bij nieuwe `construction.kind`/`solutionKey`; writer markeert nieuwe features zodanig dat een oudere parser ze **niet** stilzwijgend als vrije/statische punten laadt. Bestaande documentwriter en JSON-validatie bepalen de exacte schemawaarde; geen nummer reserveren zonder broncodeaudit.
- `toJSON`/`fromJSON`, reload, Undo/Redo, replay en volledige groepering bewaren bronrefs, ongebruikte maar herstelbare takken, stijl, ID en correcte objectvolgorde. Import van gemanipuleerde branchcodes, cycle-, missing-source- en permission-gevallen weigert atomair.
- De bronreferenties worden nooit vanuit een tool-label afgeleid. Autorisatie hercontroleert beide actuele objecten, hun onderdelen, locks/restricties en de bevoegde commandactie.
- SVG/PNG, presentatie, selectie, snappen en hit testing bevatten **uitsluitend actuele geldige afgeleide snijpunten**; ongeldige oude coördinatencaches worden niet zichtbaar of klikbaar.
- Behoud de bestaande bewerkings- en consistentiecontracten voor `constructionValid`, cascade delete, groepsduplicatie, lock, laagbeheer, style, undo/redo en tekst-/meetafhankelijkheden.

## 14. Verplichte verificatie- en regressiematrix

Elke testcase controleert behalve posities ook bronrecept, branch, validiteitscode, aantal aangemaakte objecten en duurzame ID's. Gebruik waar mogelijk **onafhankelijke wiskundige referentiewaarden**, niet uitsluitend dezelfde productieformule in tests.

| ID | Fase | Test | Verwacht resultaat |
|---|---|---|---|
| INT-001 | .0 | Twee snijdende rechten en beide bronvolgordes | 1 punt, bestaande `lineIntersection`, zelfde coördinaat |
| INT-002 | .0 | Evenwijdige vs. samenvallende lijnen | 0 en onderscheiden statussen; geen commit |
| INT-003 | .0 | Lijnstuk, halfrechte, vector, maatlijn en polygonrand | Alleen punten binnen het echte domein |
| INT-004 | .0 | Rechte–cirkel met 0/1/2 oplossingen | 0/1/2, branch 0 vóór branch 1, tangent 1 |
| INT-005 | .0 | Rechte–cirkel waarbij alleen **branch 1** op het lijnstuk ligt | Alleen branch 1, **geen hernummering** |
| INT-006 | .0 | Cirkel–cirkel: 0/1/2, concentrisch, samenvallend | Correcte unieke aantallen/statussen |
| INT-007 | .0 | Twee bronnen kiezen en **automatisch alle oplossingen**; undo/redo | Geen kandidaatkeuzes of confirm; alle geldige punten, één history-item |
| INT-008 | .0 | Oude M5b-documenten, legacy recepten, bronrebind | Ongewijzigde semantiek en zichtbare bewerkbaarheid |
| INT-009 | .0 | As x/y versus toegelaten/onmogelijke rol | Correcte asidentiteit, geen phantom object-ID |
| INT-010 | .0 | Beperkte rechten, lock, restricted en verborgen bron | Geen autorisatiebypass of bronlek; semantische zichtbaarheid behouden |
| INT-011 | .0 | Onvoltooide bronselectie annuleren via Esc, toolwissel, pointercancel, nieuw, dispose | Geen documentmutatie; na commit alleen Undo |
| INT-012 | .0 | Sidebar, zoeken, fullscreen, radiaal, toetsenbord, overlappende bronnen | Alleen **bron**keuze, geen puntkeuze/confirm; dezelfde rechten |
| INT-013 | .0 | Legacy `construction.create` zonder `selectedBranches`, tangent lijn–cirkel/cirkel–cirkel | Eén punt; ongeldige tweede tak niet blokkerend |
| INT-014 | .0 | Legacy `construction.create`, lijnstuk met alleen branch 1 geldig | Eén punt met originele `branch:1` |
| INT-015 | .0 | Universeel: twee geldige takken, daarna tijdelijke ongeldigheid/extra nieuwe tak | Alle punten direct; IDs behouden; geen spontaan nieuw punt |
| INT-016 | .0 | Interne expliciete `selectedBranches`-route indien behouden | Geldige selectie strikt; ongeldige tak atomair geweigerd |
| INT-101 | .1 | Ellips `x²/25+y²/9=1` en `y=0` | `(-5,0)` branch 0 en `(5,0)` branch 1 bij richting +x |
| INT-102 | .1 | Dezelfde ellips en `x=5` | `(5,0)`, één raakpunt branch 0 |
| INT-103 | .1 | Dezelfde ellips en `y=4` | Nul reële oplossingen |
| INT-104 | .1 | Geroteerde/verplaatste ellips en lijn in twee richtingen | Juiste punten; branchvolgorde keert alleen om bij gerichte lijnomkering |
| INT-105 | .1 | Lijnstuk kruist slechts één van twee ellipswortels | Juiste oorspronkelijke branch, geen nieuw branchnummer |
| INT-106 | .1 | Eén/twee takken bewegen door tangent en domeingrens | Bestaande IDs blijven en herstellen na bronbeweging |
| INT-107 | .1 | Ellipsbronnen wijzigen of worden tijdelijk ongeldig | Downstream `SOURCE_INVALID` en automatische recovery |
| INT-108 | .1 | Zeer dunne ellips, grote offset en bijna-raakpunt | Gestabiliseerde residuen of expliciet onbeslisbaar |
| INT-109 | .1 | JSON rondreis, legacy import, ongeldige branch | Nieuwe receptpersistente staat correct; corrupte data geweigerd |
| INT-201 | .2 | Niet-geïmplementeerde parabool/hyperbool | Geen schijnondersteuning; `UNSUPPORTED_PAIR` |
| INT-202 | .2 | Nieuw gecontracteerde conic-adapter | Quadratisch/lineair/grensgevallen en domeinfilters getest |
| INT-301 | .3 | Ellips `x²/25+y²/9=1` en cirkel `x²+y²=16` | Vier punten `(±5√7/4, ±9/4)` |
| INT-302 | .3 | Ellipsen `x²/25+y²/9=1` en `x²/9+y²/25=1` | Vier punten `(±15/√34, ±15/√34)` |
| INT-303 | .3 | Buitenliggende, raakliggende, twee-/vierpuntconfiguraties | Respectievelijk 0/1/2/4 unieke punten waar geometrisch van toepassing |
| INT-304 | .3 | Cirkelstraal 4 en cirkelvormige ellips `a=b=4` met gelijk centrum | Oneindige verzameling: `COINCIDENT_CONICS`, geen commit |
| INT-305 | .3 | Tangent dubbelwortel en extra onderscheiden snijpunten | Tangent zichtbaar eenmaal, overige onafhankelijke punten bewaard |
| INT-306 | .3 | Punt verdwijnt en keert terug terwijl andere blijven | Alle bewaarde oplossing-IDs blijven aan hun eigen tak gekoppeld |
| INT-307 | .3 | Reopen/replay/undo bij niet-triviale branchbeweging | Identieke deterministische branchmatching zonder muishistorie |
| INT-308 | .3 | Nauwe wortels en bijna samenvallende krommen | Geen fantoompunten of onterechte deduplicatie; anders `NUMERIC_UNRESOLVED` |

**Verplichte technische tests:** aparte pure solvertests; `ConstructionService`-contract-/resolver-/cycle-tests; `Engine`-transactietests; model-/schema-/rondreis-/permissietests; renderer/hit/snap/SVG/PNG-tests; echte Edge-interactietests inclusief canvas-bronselectie, directe constructie van alle oplossingen, geen resultatenpreview/confirm, zoom/pan en annuleren vóór tweede bron. Tests voor oude lijn-/cirkelconstructies blijven actief.

**Poort per fase:** doelgerichte nieuwe tests → bestaande Node-suite `npm test` → volledige Edge-suite `npm run test:edge` → documentatie/architectuurcheck → handmatige gebruikersacceptatie. Rapporteer aantallen, commit-SHA, betrokken branch en failures; beweer geen groene poort zonder werkelijk gelopen testuitvoer. De omvang van de suites wordt niet in dit ontwerp vastgezet.

## 15. Af te leveren werk per fase

### M8-INT.0

- Read-only preflight-/baselineverslag met capabilitymatrix voor actuele bronnen, onderdeelreferenties, assen, permissies en oude constructies.
- Generieke tweebron-dispatch/selectie en **directe volledige constructie** na tweede ondubbelzinnige bron: geen kandidatenpreview, puntselectie of confirm.
- Eén geautoriseerde atomaire commit voor **alle geldige takken**, nulresultaat zonder mutatie; behoud van `construction.kind` en `branch` en herstel van legacycommands zonder `selectedBranches`.
- Pariteits- en regressietests in Node/Edge; documentatie van eventuele zichtbare toolmigratie, inclusief zoek- en fullscreenweergave.
- Bestaande drie zichtbare tools **niet** verwijderen vóór expliciete eindacceptatie .0.

### M8-INT.1

- Analytische `lineEllipseIntersection`-solver en getypeerde constructie-registratie.
- Dynamisch tak-/domein-/degeneratiegedrag en hermetische nauwkeurigheidsfixtures.
- Minimale import-/exportcompatibiliteit en volledige regressie-/acceptatiepoort.

### M8-INT.2

- Type-adapter/spec voor extra werkelijk aanwezige kegelsneden; afzonderlijke goedkeuring en bewijs voor elke nieuwe curve.
- Geen ongedocumenteerde implementatie van parabool of hyperbool.

### M8-INT.3

- Robuuste snijpuntsolver voor cirkel–ellips en ellips–ellips, reële wortelisolatie en samenvaldetectie.
- Vooraf goedgekeurde, **concrete** opslag-/toewijzingsbijlage voor 0–4 takidentiteiten.
- Geautomatiseerde transitie-/ID-/replaytests en handmatige acceptatie.

## 16. Risico's, open gates en wijzigingsbeleid

| Risico | Contractmaatregel |
|---|---|
| Bestaande menu's verdwijnen vóór pariteit | Oude UI-ingangen pas na .0-acceptatie verbergen; recepten nooit schrappen |
| Universal tool omzeilt bronrollen of permissies | Dispatch via servicebroncontract en commit-hercontrole |
| Alleen branch 1 geldig, maar wordt hernummerd | Eerst tak bepalen op oneindige drager, daarna domeinfilter |
| Tangent lijkt twee punten | Multipliciteit scheiden van unieke geometrische punten; tweede tak herstelbaar ongeldig |
| 4-puntsconfiguratie springt bij dynamische beweging | Expliciete deterministische `solutionKey`-bijlage vóór .3-implementatie |
| Numerieke grens geeft schijnzekerheid | Genormaliseerde geometrie, residucontrole, expliciet `NUMERIC_UNRESOLVED` |
| Oude parser verliest nieuwe afhankelijkheid | Minimaal maar verplicht schema-/featuregating van nieuwe recepten |
| Contextueel menu en sidebar divergeren | Één `ToolCatalog` plus `ConstructionService`/autorisatie; geen hardcoded radiaal-whitelist |
| Constructie start vóór ondubbelzinnige tweede bron | Pas na bronambiguïteitsresolutie atomair uitvoeren; annuleringstest |
| Legacytool krijgt een ongeldige tweede oplossingstak | Zonder `selectedBranches` alle **geldige** takken maken; branchidentiteit behouden |

**Nog te beslissen op implementatieniveau:** compacte bronambiguïteits-UI, concrete modulenaam van de dispatcher, minimale schemawaarde voor nieuwe recepten, precieze numerieke toleranties op basis van onafhankelijke fixtures, en de definitieve .3-branchidentiteitsbijlage. Deze open punten wijzigen **niet** het nu vastgelegde gebruikersgedrag en zijn geen impliciete machtiging om implementatierisico's te negeren.

## 17. Historische Codex-overdracht M8-INT.0 (reeds uitgevoerd; niet opnieuw starten)

**Historische toelichting:** de onderstaande M8-INT.0-opdracht is inmiddels uitgevoerd, getest, handmatig geaccepteerd en naar `main` gemerged. Ze blijft alleen als traceerbare ontwerphistorie staan en mag niet opnieuw worden uitgevoerd. Voor M8-INT.1 geldt het afzonderlijke [lijn–ellipsfasecontract v1.0.0](M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md) en een toekomstige expliciete implementatieopdracht:

1. Vervang de bestaande kandidaatselectie/preview/confirm-flow door onmiddellijk **alle geldige punten** aanmaken bij tweede ondubbelzinnige bronselectie. Alleen bronambiguïteitskeuze mag overblijven.
2. Herstel de geconstateerde legacyregressie: zonder `selectedBranches` filtert `Engine.constructIntersection` ongeldige takken in plaats van de hele constructie af te wijzen; expliciet ongeldige selectie blijft atomair weigeren; behoud branch 1 wanneer alleen die geldig is.
3. Controleer permissies, types, asrollen, Undo/Redo, nulresultaten, annulering vóór commit, stabiele IDs, geen spontane puntcreatie en alle testcases `INT-001` t/m `INT-016`.
4. Lees actuele `origin/main`, `AGENTS.md`, dit contract v1.1.0 en de roadmap. Rapporteer eventuele conflicten; neem de nieuwe contractdocumentatie over zonder andere trajecten te vermengen.
5. Voer `npm test` en `npm run test:edge` uit, pas verouderde UI-tests aan zonder geometrische/securityregressies te verzwakken, werk `docs/M8-INT-0-IMPLEMENTATION-REPORT.md` bij met feitelijke testuitvoer en push uitsluitend naar dezelfde featurebranch.
6. **Niet naar `main` mergen, de oude gespecialiseerde menuknoppen nog niet verwijderen en M8-INT.1/.2/.3 en M-PATH niet starten.**

---

## 18. Normatieve bronverwijzingen

Repositoryreferenties, geraadpleegd op 16 oktober 2026; controleer bij implementatie de actuele versies:

- [AGENTS.md](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/AGENTS.md)
- [CONSTRUCTIONS.md](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/CONSTRUCTIONS.md)
- [LINEAR-OBJECTS.md](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/LINEAR-OBJECTS.md)
- [DOCUMENT-FORMAT.md](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/DOCUMENT-FORMAT.md)
- [docs/DEVELOPMENT-ROADMAP.md](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/DEVELOPMENT-ROADMAP.md)
- [docs/UI-RADIAL-9-CONTRACT-DRIVEN.md](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/UI-RADIAL-9-CONTRACT-DRIVEN.md)
- [docs/CORE-1-ARCHITECTURE-DESIGN.md](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/CORE-1-ARCHITECTURE-DESIGN.md)
- [docs/M8a-ELLIPSEN-CONTRACT.md](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/docs/M8a-ELLIPSEN-CONTRACT.md)
- [construction-service.js](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/construction-service.js), [linear-geometry.js](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/linear-geometry.js), [ellipse-geometry.js](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/ellipse-geometry.js), [index.js](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/index.js), [tool-catalog.js](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/tool-catalog.js), [editor.html](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/main/editor.html).

**Einde hoofdcontract v1.1.1 — M8-INT.0 geïntegreerd op main; M8-INT.1-contract ter goedkeuring.**