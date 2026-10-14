# AGENTS.md — Wiskundige Illustratie Editor (WIE)

**Versie:** 1.0.0 · **Datum:** 2026-10-14 · **Geldigheid:** deze repository/branch en afgeleide featurebranches.  
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
- **Status:** UI-RADIAL-10 is op ontwikkelbranch geïmplementeerd, niet naar `main` gemerged, en de nieuwe fixes zijn nog niet handmatig beoordeeld of geautomatiseerd getest.

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
