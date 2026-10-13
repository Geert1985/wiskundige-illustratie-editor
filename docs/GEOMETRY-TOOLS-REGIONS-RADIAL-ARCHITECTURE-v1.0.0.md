# From Zero 2 Infinity — Geometrie, gereedschappen en radiaal eigenschappenmenu
Versie: 1.0.1 — 2026-10-13
Status: **ontwerp en implementatiecontract ter goedkeuring; geen productie-implementatie in deze wijziging**
Bron: GitHub main op SYNC-0 SHA `54b2f55027b69c39875f7ea4a5ebe8b16f1d2bde` (roadmap v2.5.0, backlog v1.7.0). Gereedschapspaneelherstructurering én M6a-centra zijn al op main geïntegreerd. Hun historische rapporten en contracten blijven referenties; hun oude pre-implementatiestatus is achterhaald.

## 0. Omvang, prioriteit en implementatiepoorten
Vier afzonderlijk te accepteren trajecten: **UI-T1** gereedschapsindeling; **G-TRI1** driehoek via drie bestaande punten; **UI-R1–R3** contextueel radiaal eigenschappenmenu; **REG-1–REG-3** dynamisch opgevulde gebieden + optionele oppervlakteweergave. Het herbruikbaarheidsontwerp **CORE-1** is een architectuurpoort vóór risicovolle UI/geometry-implementaties, geen afzonderlijke tweede wiskundige engine. SYNC-0 heeft integratie van M6a en de bestaande toolpanelbasis op main bevestigd; de nieuw geplande uitbreidingen zijn niet geïmplementeerd. M6b en bestaande M7–M20, T5b–T5d, K1–K8 blijven bestaan. Geen feature automatisch vrijgeven door deze documenten. Alle implementaties op afzonderlijke branch; eerst bestaande code en tests inventariseren; expliciete GO voor schema- en permissiewijzigingen; na bewijs en review pas mergen.

**Normatieve principes:** hergebruik getypeerde geometrie, één dependency graph / model truth, bestaande commando- en undo/redo-paden, bestaande selectie/hit-testing, rechten en restricted-redactie, bestaande render/SVG/PNG. Geen tweede parser, polygon renderer, documentmodel of permissie-engine. Geen zelfstandige visuele demo/prototype.

## 1. UI-T1 — Definitieve gereedschapsindeling (Codex: GPT-6.1 Sol Medium; audit GPT-6 High)
### Doelstructuur en volgorde
1. **Vrije objecten** (vervangt Basisobjecten én de afzonderlijke Figuren-groep): vrije punten, lijnstuk, rechte, halfrechte, vector, cirkel, driehoek, veelhoek. Behoud relevante reeds werkende andere vrije gereedschappen; plaats statische hoeken volgens reeds goedgekeurd tool-panel contract onder Meten & analyseren; plaats tekst onder Tekst & interactie.
2. **Constructies** onmiddellijk onder Vrije objecten: Puntconstructies; Lijnconstructies; Cirkelconstructies; **Driehoekconstructies** met nieuwe tool **Driehoek via 3 punten** plus bestaande M6a zwaartepunt/circumcentrum/orthocentrum; M6b en meetkundige plaatsen alleen als gepland waar nog niet geïmplementeerd.
3. **Meten & analyseren**: bestaande metingen en statische hoeken; toekomstige vector-/functieanalyse.
4. **Gebieden & opvulling**: veelhoekgebied, cirkelsector, cirkelsegment; pas functioneel bij REG-2; optionele oppervlakte is een eigenschap van het gebied, geen los canvas-objecttool.
5. **Transformeren**.
6. **Functies & grafieken**.
7. **Tekst & interactie**.
8. **Verzamelingen**.

In de op `main` geïntegreerde paneelimplementatie aanwezige acht categorieën omvatten een aparte `Figuren`-groep; migreer haar bestaande `triangle`, `polygon`, `circle` **zonder ID-wijziging** naar Vrije objecten. Het worden acht hoofdcategorieën na verwijdering van Figuren en toevoeging van Gebieden & opvulling. Verander niet de opslag- of constructietypen om een menunaam. Zorg dat sidebar en fullscreenkiezer exact dezelfde bron gebruiken; geen dubbele werkende tool-ID's. Behoud onafhankelijk inklapbare groepen, splitmenu's, werkende shortkeys, touch, keyboard, aria, actieve toolhint en huidige responsieve stijl. Toekomstige placeholders zijn statische inert gelabelde items zonder `button`, `tabindex`, `data-canvas-tool` of event handlers. Wat al bestaat mag nooit als placeholder terugvallen.

### UI-acceptatie
Alle bestaande tool-ID's verschijnen precies één keer; werkende tool blijft functioneel in sidebar én fullscreen; geen document/selection/revision/history-effect door inert placeholder; testen op desktop/tablet/mobiel, Escape en pointercancel; full Node/Edge waar beschikbaar.

## 2. G-TRI1 — Driehoek via drie bestaande punten (Codex: GPT-6 High)
De *vrije* `triangle` blijft vrij bewerkbaar zoals nu; de *constructiedriehoek* is één geometrische driehoek, rechtstreeks **niet versleepbaar**. Bij activeren selecteert gebruiker drie bestaande geautoriseerde puntobjecten A→B→C; geen nieuwe punten aanmaken. Na drie geldige, verschillende, niet-collineaire punten ontstaat één gekoppeld `polygon`-object met exact drie vertices, zodat de reeds bestaande M6a-`triangle`-bronrol (`polygon`, `vertices.length===3`) de constructie **zonder speciale uitzondering** kan gebruiken. Gebruik bestaande driehoekrenderer/metingen en de constructiegraaf; geen drie losse permanente lijnstukobjecten of tweede renderer. **De creatieflow verwijst naar bronpoint-ID's**, terwijl het polygon-geometrieresultaat resolved vertices exposeert. Het recept, de bronvolgorde en validatie worden getypeerd en versioned binnen het bestaande constructionSchema-mechanisme; wijzig documentversie alleen wanneer vereist en na review.

### Selectie en edit-contract
Bronpunt A, B, C elk als referentie volgens bestaande picker/bronrechten, zonder ongevraagde snapping of nieuwe puntcreatie. Duplicate selectie of initieel collineair = duidelijke weigering; herstel derde puntselectie, geen half documentobject. Bronpunten mogen op hun beurt afhankelijk zijn, als acyclic graph toestaat. Validatie gebruikt de projectbrede **genormaliseerde schaalonafhankelijke degeneratieregel** waar toepasselijk; geen nieuwe vaste pixel-/absolute epsilon. Start van constructie, hoverpreview en einde volgen bestaande toolcontroller; Escape/blur/pointercancel/toolwissel/new/dispose annuleren preview en private bronkeuze volledig zonder history-write.

### Levenscyclus
Wijzigen van A/B/C herberekent dezelfde `polygon`-ID met dezelfde referenties. Tijdelijke degeneratie markeert `constructionValid=false` (recoverable invalid) en kan herstellen, geen NaN/Infinity of stale metingen; verwijderde bron volgt bestaande cascade/undo. Verbergen/locken/restricted-bronnen volgen bestaande semantiek. De geconstrueerde driehoek mag wel worden geselecteerd, gestyled, hernoemd, verborgen en als M6a-`triangle`-bron dienen; **direct slepen, vertexhandles en onafhankelijke coördinatenbewerking zijn niet toegelaten**. Geen impliciete verplaatsing van de drie bronpunten. M6a-centra op constructed triangle moeten dynamisch meebewegen; verifieer transitive dependencies en volgorde.

### Verplichte bewijsgevallen
Gewone driehoek, collineair/collapsed & grenswaarde, bronpuntuitwisselen/duplicate, bronpunten op afhankelijke punten, bron verplaatsen en terugzetten, onafhankelijk identiteitsbehoud, direct-drag geblokkeerd, selectie boven aangrenzende lijn, cascade/undo/redo/replay, JSON roundtrip met reject unknown/broken recipe, SVG/offline PNG en restricted/grants, volledig werkende vrije driehoek. Implementatie pas als document/schema/permission plan is goedgekeurd.

## 3. UI-R1–R3 — Contextueel **radiaal eigenschappenmenu**
### Intentie en afbakening
Ontwerp een **herbruikbaar radiaalmenu als snelle contextlaag voor de geselecteerde canvasobjecten**. Vervang niet stilzwijgend de complete bestaande **rechter eigenschappenbalk**: die biedt veel parameters, numerieke velden, constructiebronnen, gegroepeerde selecties, permissies en toegankelijkheid. De initiële UI-R2-release kan de radiale bediening als primair compact menu aanbieden **terwijl de volledige rechter inspector beschikbaar blijft** via een duidelijk commando “Alle eigenschappen”. Verwijder of verberg de rechterkolom pas in UI-R3 na expliciet UX-akkoord én gelijkwaardige bereikbaarheid/functionaliteit; geen informatieverlies, geen verplicht pointer-only pad.

### UI-R1 — Interaction contract (GPT-6 High)
Bepaal trigger (object selecteren + expliciet eigenschappenicoon; contextmenu/long-press alleen met platformveilige fallback), ankerpositie en viewportclamping, toetsenbordfocus/roving tabindex, Escape, klik buiten, submenu's, scroll, IME en schermlezeralternatief als gewone lijst. Het canvas mag niet onbedoeld verschuiven/selecteren als menu wordt gebruikt. Geen radiaalmenu tijdens actief tekenen/bronselectie/draft of wanneer target ongeldig wordt. Tijdens documentwissel, undo/redo, source-delete, permissie-epoch en fullscreenovergang moet de host menucontext veilig sluiten of opnieuw valideren.

### UI-R2 — Reusable component and properties adapter (GPT-6 High for architecture, Sol Medium for UI)
Maak een generieke UI-component `RadialMenu`, **DOM/presentatie-only** met: stabiele actie-ID, label, icoon, `enabled/disabled` met reden, optionele children/submenu, selected/mixed indicator, uitvoercallback naar bestaande geautoriseerde `EditorApp`-commands. Menu bevat **geen** canvasobject-API, eigen modelwrite, globale documentstate, inline permissieengine of tweede inspectorbusinesslogica. Pure `getApplicableProperties(context, capabilities, selection)`-adapter bouwt een korte, geautoriseerde actiecatalogus uit bestaande inspectorcommands, met behoud van actual validation bij commit. Acties: kleur, lijn/omlijning, vulling/transparantie, lijnstijl/dikte, labelzichtbaarheid en gebiedsoppervlakte-toggle (alleen als REG-2 bestaat), plus “Alle eigenschappen”. Alleen toepasbare acties per object; mixed selection en locked/restricted rechtmatig behandelen; geen verboden naam/waarde in DOM/ARIA/hover/export.
Voor numerieke vrije invoervelden (coördinaten, radius, precisie, namen, afgeleide bronnen, laagbeheer) opent "Alle eigenschappen" de reguliere inspector of een gecontroleerde toegankelijke detailweergave, **niet** het radiaalmenu zelf. UI mag geen disabled mock-controls weergeven als werkend.

### UI-R3 — Optional inspector-layout decision (GPT-6 High)
Eerst gebruikerstest op desktop/tablet/touch/keyboard; inventariseer volledige rechten-/veldenmatrix tussen oude rechterbar en nieuwe compacte toegang. Alleen na aantoonbare parity en afzonderlijke GO rechterpaneel verbergen/omvormen. Responsiviteit, canvasoppervlak en mobiel drawer-alternatief horen expliciet in acceptatie. Geen gedwongen verwijdering van inspector door UI-R2.

### Testmatrix
Objecselectie, empty/multi/mixed selecties, groepsobject, vrije en afgeleide driehoek, cirkel/sector, assencontext, tekst, restricted/locked; pointer/keyboard/touch/fullscreen/Escape/blur/scroll; menu reopen na source delete/undo; geen DOM-documentlek en geen stale writes; JSON/undo/renderer onveranderd; Edge-a11y handmatige controles expliciet open indien niet uitgevoerd.

## 4. CORE-1 — Herbruikbare functies en API-contracten (Codex: GPT-6 High)
**Doel:** onafhankelijk van het uiterlijk of concrete figurentypen herbruikbare functies ontwerpen, maar **geen generieke allesomvattende frameworkherschrijving**.

1. **Geometrische `resolvePointSources` / `getTriangleVertices`-adapter:** centraal autoritatief bronvalideren, referenties en genormaliseerde coördinaten (niet rechtstreeks vanuit DOM/SVG). M6a en gekoppelde driehoek gebruiken het `polygon`-`triangle`-contract.
2. **`resolveRegionGeometry(recipe, sourceSnapshot)`**: pure, begrensde service om zichtbare contour + geldige gebiedsgeometrie uit getypeerde bronnen op te bouwen (sector, segment, simple polygon) met stabiele sweepconventie. Geen eigen objectgraaf/renderloop.
3. **`computeRegionArea(typedRegionGeometry, unitScale)`**: pure numerieke functie, lengte-kwadraat dimensies, kleine/grote sector/segment en simpele polygonen; onafhankelijk van renderer en label. Eén oppervlaktewaarheid voor inspector, label en toekomstige typed source property.
4. **`formatRegionArea(quantity, options)`**: hergebruik bestaande unit/precision/canonical value formatter; nooit herberekenen vanuit geformatteerde tekst. Exports gebruiken actuele door rechten geautoriseerde resultaat.
5. **`getApplicableProperties(selection, permissions, objectCapabilities)`**: pure presentatiedata voor zowel radiaalmenu als rechter inspector, maar altijd bestaande commandvalidatie als laatste autoriteitsgrens.
6. **`buildToolCatalog`**: één stabiele declaratieve menutoewijzing voor sidebar/fullscreen, werkend versus placeholder expliciet, bestaande `data-canvas-tool`-IDs ongewijzigd.

De hierboven gebruikte API-namen zijn **ontwerpinterfaces**, geen verplicht nieuwe bestandsnamen of claims dat ze bestaan. Eerst huidige modellen/services inspecteren en verantwoord hergebruiken. Contractbeschrijving inclusief input/output, error states, unit/permission invariants, complexity/quota en testen vóór implementatie. Documenteer afhankelijkheden: `Geometry/ConstructionService → region/triangle calculations → command model → renderer/inspector/radial/menu`. Radiaalmenu en tekenrenderer zijn **consumenten**, geen auteurs van geometrische waarheid. Geen dubbele implementatie van bestaande `construct:area`-meting.

## 5. REG-1–REG-3 — Gebieden inkleuren en oppervlakte tonen
**REG-1 (spec, GPT-6 High):** getypeerd afhankelijk `region`-object; bronnen en pick-order; kleine/grote sector en segment incl gerichtheid, 0°/180°/360°/overgang over 0°, samenvallende/collineaire punten, geen ongedefinieerde “klik in willekeurig gesloten vlak”-inferentie. Bestaande eenvoudige polygonen; zelfdoorsnijding/holes expliciet buiten eerste scope. Rechten, versies, autorisatie, undo, JSON, SVG/offline PNG, overlay/hit/laagpositie, font/label, semantische foutstatus en degeneratie vooraf contractueel bepalen. **Regionen krijgen eigen identiteit**, geen mutatie van onderliggende driehoek/cirkel/bronpunten.
**REG-2 (implementatie, GPT-6 High math + Sol Medium UI):** **gebied vulling en optioneel berekende oppervlakte samen verplicht in eerste release**. Veelhoekgebied, cirkelsector, cirkelsegment; kleur, transparantie, randstijl, kleine/grote keuze, automatische dynamische bronvolging, selecteerbaar maar bronpunten niet ongemerkt draggen. `Oppervlakte weergeven` aan/uit; `A = 12,57 cm²` of `12,57 cm²`; labelpositie auto of versleept, precisie, unit, typografie; update bij elke bronwijziging. Via rechter inspector en wanneer aanwezig geautoriseerd radiaalmenu toegankelijk.
  - Sector: `A = ½r²θ` waarbij θ radialen; grote sector is complement als kleine gekozen.
  - Klein cirkelsegment: `A = ½r²(θ − sin θ)` met θ radialen; groot segment is complement op volle cirkel.
  - Veelhoek: shoelace voor eenvoudige polygon, met degenerate en windingbeleid.
  - Area is **niet-negatief**, physical/abstract eenheid², lengte schaal exact eenmaal en area-schaal kwadratisch; niet uit pixels/raster en nooit uit afgeronde tekst.
  - Exacte π/radicalen-notatie is pas mogelijk wanneer de toekomstige K1 getypeerde exact-arithmetic-contracten bestaan; nu correcte numerieke display met ≈ waar nodig.
**REG-2 acceptatie:** drag/undo/redo/JSON/export, grensgevallen minor/major, near-collinear, r=0, geblokkeerde/verborgen/revoked bron, SVG/PNG, layer-hit priority, fullscreen en alle huidige angle/area metingen behouden. Restricted maakt onbereikbare labels/waarden niet zichtbaar. Gebied als `area`-source voor T5a/T5c **niet automatisch** autoriseren; apart geversioneerd adapter/permission-contract.
**REG-3 (later, GPT-6 High):** doorsnede/vereniging/verschil, overlap, ongelijkheidsgebieden, gebieden onder/tussen functiegrafieken na M11/M12; aparte numerieke topologie en evaluatiecontracten.

## 6. Geordende Codex-werkpakketten en stopcriteria
| Werkpakket | Startvoorwaarde | Op te leveren bewijs | Model |
|---|---|---|---|
| **SYNC-0** actuele main en M6a/toolpanelstatus | voltooid; rapport van Codex, geen tests opnieuw gedraaid | bestaande implementatie bevestigd; verdere nieuwe uitbreidingen open | GPT-6 High |
| **CORE-1** gedeelde helpers/spec-contracten | SYNC-0 | ontwerp met risico's, unit/permission model en API-acceptatie | GPT-6 High |
| **UI-T1** gereedschapsindeling | start vanaf actuele main met geïntegreerd paneel | 8 categorieën, ID-mapping en screenshot/Edge | GPT-6.1 Sol Medium |
| **G-TRI1** driehoek via 3 punten | M6a-rol en schema-consistentie geverifieerd | Node/Edge, undo/import/export en M6a op nieuwe bron | GPT-6 High |
| **UI-R1** radiaalmenu-interactiecontract | CORE-1 | type-/capabilitymatrix en UX/keyboard spec | GPT-6 High |
| **UI-R2** radiaalmenu + volledig toegangspad tot inspector | UI-R1 akkoord | UI integratie, focus/security/Edge, geen verlies inspector | GPT-6 High + Sol Medium |
| **UI-R3** optionele rechterbar-layoutvervanging | UI-R2 geaccepteerd | bewijs parity + UX-goedkeuring | GPT-6 High |
| **REG-1** gebieds-/eenhedencontract | CORE-1, basisgeometry | onafhankelijke numerieke golden fixtures en schema-plan | GPT-6 High |
| **REG-2** gebieden + optioneel live oppervlakte | REG-1 GO, en passend UI-paneel | gerichte/full regressie plus gebruikersacceptatie | GPT-6 High + Sol Medium |
| **REG-3** analytische regio's | M11/M12 waar vereist | apart voorstel en GO | GPT-6 High |

**Elke mijlpaal:** eerst codeaudit, dan ontwerp/validatie waar nodig, afgebakende implementatie op eigen branch, gerichte tests plus relevante volledige Node/Edge, vastlegging versie en exacte PASS/FAIL/SKIP, een enkel geconsolideerd rapport per mijlpaal, push, **niet automatisch mergen naar main**. Testaantallen uit een ontwikkelbranch mogen niet als actuele main-stand worden gerapporteerd. M6a/M6b en andere bestaande roadmapgates worden niet automatisch gesloten.
