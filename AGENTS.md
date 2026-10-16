# AGENTS.md — Wiskundige Illustratie Editor (WIE)

**Versie:** 1.0.6 · **Datum:** 2026-10-16 · **Geldigheid:** deze repository/branch en afgeleide featurebranches.  
**Doel:** persistente instructies voor Codex en andere code-assistenten, zonder eerder goedgekeurde implementaties onbedoeld terug te draaien.

## Eerst lezen en bronvoorrang

1. Controleer **altijd de actuele uitgecheckte branch, de bestaande broncode en het werkelijk geladen `editor.html`-manifest**. Neem niet aan dat een feature al op `main` staat omdat hij op een ontwikkelbranch werkt.
2. Lees **[docs/UI-RADIAL-9-CONTRACT-DRIVEN.md](docs/UI-RADIAL-9-CONTRACT-DRIVEN.md)** voor de actuele contextuele constructie- en radialmenuarchitectuur en **[docs/DEVELOPMENT-ROADMAP.md](docs/DEVELOPMENT-ROADMAP.md)** voor projectscope en ontwikkelstatus.
3. Lees **[docs/CORE-1-ARCHITECTURE-DESIGN.md](docs/CORE-1-ARCHITECTURE-DESIGN.md)** voor de gedeelde servicegrenzen en **[CONSTRUCTIONS.md](CONSTRUCTIONS.md)** voor constructieafhankelijkheden.
4. Oudere UI-RADIAL-1/4/7-rapporten, `docs/GEOMETRY-TOOLS-REGIONS-RADIAL-ARCHITECTURE-v1.0.0.md` en `docs/CODEX-EXECUTION-PLAN-TOOLS-RADIAL-REGIONS-TRIANGLE-v1.0.0.md` beschrijven **historische fasen**, niet de huidige UI-eisen wanneer ze met het actuele contract botsen.
5. Bij verschil tussen document en code: rapporteer de afwijking vóór een ingrijpende aanpassing. De code bepaalt de **feitelijke status**, de laatste uitdrukkelijk goedgekeurde productafspraak bepaalt het **doelgedrag**. Corrigeer geen werkende implementatie enkel om een ouder document te laten kloppen.

## Verplichte ontwerpprincipes

- **Eén geometrische/documentwaarheid:** gebruik het bestaande model, `ConstructionService`, afhankelijkheidsgraaf, validatie, renderer, import/export en Undo/Redo. Bouw geen parallelle constructie-, meet-, reken-, opslag- of permissie-engine.
- **Contextuele constructies zijn contractgestuurd.** `ConstructionService.contextualPlans(object, kind)` bepaalt bronplannen op basis van `contract(kind).sourceRoles` en `referencesForRole`; `ToolCatalog` bepaalt welke gereedschappen bestaan; autorisatie bepaalt wat de gebruiker mag zien/doen.
- Het radiaalmenu (`editor-radial-properties.js`) **bevat geen vaste objecttype-allowlist** om te beslissen of Constructie beschikbaar is. Nieuwe typen krijgen aanbod via hun correct geregistreerde rolreferenties; voor een nieuw soort onderdeelbron of plaatsingsinteractie is een expliciet service-/interaction-contract nodig.
- Eén invoerpad: `EditorApp.startContextConstruction(toolId, objectId, planKey)`, gevolgd door bestaande `constructionClick`/`construction.create`-afhandeling. Introduceer geen nieuwe `startConstructionFromPoint/FromCircle/FromLine`-varianten.
- **Presentatie is geen autorisatie:** controleer bij aanbieden én uitvoeren de actuele objectbeschikbaarheid, `toolAllowed`, capabilities/restricted sources en de originele commando-validatie. Verwijs nooit ongeautoriseerde bronnen via menu-items, tooltips, labels, export of caches.
- **Bediening:** rechtsklikken op een object opent het radiaalmenu; links selecteert/versleept; er is geen automatisch verschijnend eigenschappenicoon en geen permanente rechter eigenschappenkolom. Numerieke en complexe velden blijven bereikbaar via het zwevende eigenschappenpaneel, inclusief `Alles`.
- **Compact visueel contract:** zes segmenten, gebogen donkerblauw/goud, maximaal circa 322 px waar plaats is, sleepgreep; categorieklikken verplaatsen het menu niet. De actieve categorie is reeds bewust vormgegeven: verander die niet zonder opdracht.
- **Eigenschappen:** voor objecten met een toepasselijk contract Constructie / Uiterlijk / Geometrie / Relaties / Acties / Alles. Geen dubbele velden tussen gespecialiseerde categorieën: labels behoren bij Acties; `Alles` is bewust het totaaloverzicht. Hergebruik de bestaande inspector en geautoriseerde commando's; pas objectafhankelijke secties zorgvuldig toe.
- **Groepen en lagen:** behoud bestaande groepsnaam, laagtoewijzing, verslepen tussen lagen, selectie-, lock- en geschiedenissemantiek.
- **Beperkte uitbreiding:** implementeer alleen gevraagde wijzigingen; geen grootschalige refactoring, schemawijziging, nieuwe permissions, merge of implementatie van toekomstige milestones zonder expliciete opdracht.

## UI-RADIAL-10 — lang contextmenu en dynamische regiolabels (2026-10-14)

- **Viewport:** het zwevende constructie-/eigenschappenpaneel moet zelf scrolbaar zijn en zijn `maxHeight` berekenen **ná** het vaststellen van de verticale positie, binnen canvas en werkelijk zichtbaar browservenster. Titel sticky, scrollbar zichtbaar en scrollpositie resetten bij nieuwe categorie. Zie [UI-RADIAL-10-verslag](docs/UI-RADIAL-10-REGION-LABEL-AND-SCROLL.md).
- **Regiostijl:** bij `region` is de standaard kleuractie **Vulkleur** (`style.fill`), randkleur (`style.stroke`) is apart; expliciet `fill='none'` blijft transparant. Hergebruik de bestaande kleurenpicker, validatie en Undo/Redo.
- **Oppervlakteweergave:** precisie voor cirkelsector/-segment en overige regio-oppervlakten via **slider 0–3 hele decimalen, standaard effectief 2**. De oude `precision:null` en `areaDisplay.position` mogen zonder schema-breaking migratie worden gelezen.
- **Labelpositie:** de oppervlakte van een regio is geen apart besturingsmechanisme. `renderer.renderLabel`, `.object-label`, `data-label-id`, de bestaande muiscontroller en de normale `labelOffsetX/Y`-eigenschappen verzorgen selectie, versleping, permissies en Undo/Redo. **Geen Labelpositie-dropdown/offsetvelden** voor regiogebieden opnieuw introduceren. Behoud oude opgeslagen offsets bij import voor visuele compatibiliteit.
- **Status:** UI-RADIAL-10 is via PR #12 naar `main` gemerged, en de nieuwe fixes zijn nog niet handmatig beoordeeld of geautomatiseerd getest.

## UI-TOOLBAR-1 — Geschiedenis en consistente iconen (2026-10-14)

- **Document Ongedaan/Opnieuw:** uitsluitend als twee icoonknoppen in de lichte werkvlakbalk, niet in de hoofdtitelbalk. IDs `undoBtn`/`redoBtn`, documenthistory, sneltoetsen en disabled-state behouden.
- **Teksteditor Ongedaan/Opnieuw:** als twee icoonknoppen in de rijke tekstopmaakbalk **direct na Rechts uitlijnen**, niet in de teksteditortitelbalk. IDs `richUndo`/`richRedo`, afzonderlijke rich-texthistory en sneltoetsen behouden.
- **Titel:** `Wiskundige Illustratie Editor`. Knop **Opslaan** toont diskette-SVG; beide **Meer**-menu's hebben een passend driepuntjes-SVG en gelijke titelbalktypografie; **Toevoegen** in teksteditor gebruikt een plusteken-SVG.
- De knoppen blijven toegankelijk (`aria-label`, tooltip, focus) en gebruiken **inline SVG**, gedeelde CSS en bestaande handlers; voeg geen dubbele/parallelle undo-implementatie toe. Zie [UI-TOOLBAR-1](docs/UI-TOOLBAR-1-HISTORY-AND-ICONS.md).
- **Status:** via PR #12 in `main` geïntegreerd; handmatige acceptatie en afzonderlijke regressietests staan nog open.

## UI-COLOR-1 — Gedeelde kleurkiezer (2026-10-14)

- De bestaande **Kleur wijzigen**-dialoog blijft de enige stijl-kleurkiezer. Gebruik `EditorColor`, bestaande `style.fill`/`style.stroke`-commando's, permissies en Undo/Redo; introduceer geen alternatieve kleurenengine.
- De kleurkiezer heeft **Huidig/Nieuw**-preview, twaalf benoemde presets in een 6×2-raster, een HEX-veld en een native kleurkiezer. Alle keuzes synchroniseren met dezelfde live objectpreview. Presets krijgen `aria-pressed`; HEX-validatie voorkomt bevestiging van ongeldige codes.
- **Geen vulling** is alleen voor `style.fill`; bewaar `none` en onderscheid het van een ontbrekende fill (rendererstandaard). **Annuleren** moet de oorspronkelijke stijl herstellen, **Toepassen** moet bestaande transacties correct afsluiten.
- Bewaar responsiviteit, focus, toetsenbordbediening en het visuele donkerblauw/gouden ontwerpsysteem. Zie [UI-COLOR-1](docs/UI-COLOR-1-PALETTE-REDESIGN.md).
- **Status:** via PR #12 in `main` geïntegreerd; handmatige acceptatie en afzonderlijke regressietests staan nog open.

## UI-PANEL-1 — Uniforme contextuele eigenschappenpanelen (2026-10-14)

- De door de gebruiker goedgekeurde **Geometrie**-preview is de **standaard voor alle eigenschappenpanelen** (o.a. Uiterlijk, Relaties, Acties, Metingen, Labels, Alles, regio's en andere objecttypes). Gebruik de gedeelde donkerblauw/gouden sectiekaarten, SVG-sectieiconen, duidelijke labels en focusstates. Zie [UI-PANEL-1](docs/UI-PANEL-1-UNIFIED-PROPERTY-DESIGN.md).
- **Geen paneelkopieën:** definieer styling centraal in `editor.css` onder `.radial-detail-pane`. `RadialProperties.decoratePropertySections()` voegt idempotent decoratieve SVG-iconen toe aan bestaande `<details data-property-section><summary>`-secties, zonder nieuwe eventhandlers of duplicaatcontrols.
- Behoud de **compacte paneelbreedte**, UI-RADIAL-10 viewportveilige scrollhoogte en sticky titel; de preview is visuele referentie, geen vergrotingsopdracht. Houd coördinatenvelden compact met naam links en waarde rechts.
- Behoud native `details/summary`, toegankelijkheid, data-attributen, permissies, bestaande inspector-handler, Undo/Redo, open/dicht-status en filtergedrag. Nieuwe objecteigenschappen gebruiken dezelfde presentatiecomponenten.
- **Status:** via PR #12 in `main` geïntegreerd; handmatige acceptatie en afzonderlijke regressietests staan nog open.

## Goedgekeurde ontwerpcontracten — status 2026-10-15

- **M8a Ellipsen:** [contract v1.1.0](docs/M8a-ELLIPSEN-CONTRACT.md) is de normatieve basis. M8a-1/STAB-1 (PR #15), M8a-2 Punt op ellips (PR #16) en M8a-1b Ellips met permanent besturingspunt Q (PR #17) staan op `main`. De actuele code gebruikt document v9/`ellipseSchema:1`, `constructionSchema:6` voor legacy somafstand en punt-op-ellips, en schema 7 voor het driebronnenrecept. Behoud `ellipseByFociAndSum` voor legacydocumenten en -recepttests; zie [M8a-1b-verslag](docs/M8a-1b-ELLIPSE-CONTROL-POINT-IMPLEMENTATION.md).
- **M8b Parallellogrammen:** [contract v1.1.0](docs/M8b-PARALLELLOGRAMMEN-CONTRACT.md) is de normatieve basis. M8b-0/0b zijn afgerond; **M8b-1 is handmatig geaccepteerd en via PR #21 (`adc6638`) naar `main` gemerged**. Bestaand `polygon` met vier vaste vertices, twee puntbronnen, `sideLength` en `signedAngle`, `constructionSchema:8`; Q is alleen een tijdelijke plaatsingspositie. [M8b-1-verslag](docs/M8b-1-DYNAMIC-PARALLELOGRAM-IMPLEMENTATION.md). M8b-2 (GEO-UI-standaardmetingen en uitgebreid eigenschappenpaneel) en M8b-3 (consolidatie) zijn **nog niet uitgevoerd**; aparte gebruikers-GO vereist.
- **M7-VEC-FUND — Vectorfundament:** [contract v1.0.0](docs/M7-VEC-FUND-CONTRACT.md) op 15 oktober 2026 **goedgekeurd als ontwerp**; identifier **M7-VEC-FUND definitief vastgesteld**. Het historische vectorlabel `M7a` vervalt; de bestaande **M7a–c — Starre transformaties** blijven ongewijzigd. `M7b` en `M7f` in het oorspronkelijke contract zijn historische labels voor toekomstige werkzaamheden, geen autorisatie of definitieve toewijzing. **Niet geïmplementeerd**: vóór Codex-productiecode eerst read-only preflight en aparte gebruikers-GO; geen automatische merge.
- **Main-integratie:** PR #12 (`63ab45acc7`), PR #15 (`000399af`) en PR #16 (`ac3dc29`) vormen de gecontroleerde historische checkpoints. Volgende integraties volgen eigen PR en actuele tests; branchstatus, gebruikersacceptatie en daadwerkelijke merge blijven afzonderlijke feiten.
- **Voorrang:** documentgoedkeuring betekent **geen** implementatieautorisatie, en schema-voorstellen zijn geen geïmplementeerde documentversies.

## Nieuwe gereedschappen en objecttypen — ontwikkelchecklist

1. Registreer het object en de geometrische/constructiesemantiek in de **bestaande** model-/servicecontracten.
2. Leg getypeerde bronrollen en `referenceOptions`/`referencesForRole` vast. Controleer ook meervoudige, onderdeel- en latere bronrollen; ga niet uit van “altijd eerste bron”.
3. Registreer het gereedschap in de gedeelde `ToolCatalog` met stabiele ID en correcte `implemented`/gepland-status; geen afzonderlijke radiale gereedschapslijst.
4. Bepaal of `contextualPlans` de nieuwe bronvorm met een bestaand `complete`, `prefill` of `placement`-plan ondersteunt. Speciale workflows vragen een expliciete adapter, geen willekeurige fallback.
5. Bewaar import/export, documentcompatibiliteit, permissies, afhankelijkheidsupdates, historie, SVG/PNG en toegankelijkheid.
6. Actualiseer de roadmap en het normatieve contract; vermeld gewijzigde bestanden, branch/commit, open risico's, handmatige acceptatie en **daadwerkelijk** uitgevoerde testcommando's.

## Test- en statusrapportage

**Geïmplementeerd op branch**, **handmatig door de gebruiker beoordeeld**, **geautomatiseerd getest** en **gemerged naar main** zijn vier verschillende statussen. Voor UI-RADIAL-1 t/m 9 is eerder op verzoek **geen automatische test-/browser-suite door de assistent gedraaid**; gebruikersfeedback bevestigt werking van onderdelen, niet volledige regressie. Een documentatie-only wijziging mag geen fictieve PASS claimen. Respecteer expliciete verzoeken om tests over te slaan en markeer SKIP met reden.

**Documentatiehiërarchie:** dit bestand (werkafspraken) → UI-RADIAL-9 (actueel functioneel/technisch contract) → CORE-1 (servicearchitectuur) → roadmap (status en planning) → tijdgebonden historische rapporten.
