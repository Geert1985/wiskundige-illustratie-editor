# M-PATH.0-P — Technische preflight

**Status:** read-only technische preflight; geen productiecode gewijzigd
**Datum:** 17 oktober 2026
**Repository:** `Geert1985/wiskundige-illustratie-editor`
**Preflightbranch:** `codex/m-path-0-preflight`
**Lokale broncommit:** `6f66082c06b50b2b57077f410ecd55f56cdb9ad8` (`Record successful user acceptance and approved main integration`, 2026-10-17)
**Remote refresh:** bevestigd met een geslaagde retry van `git fetch origin main`; `origin/main` resolveerde naar `6f66082c06b50b2b57077f410ecd55f56cdb9ad8`, exact de onderzochte broncommit. De eerste fetch faalde tijdelijk met `getaddrinfo() thread failed to start`.
**Normatief ontwerp:** `docs/WIE-M-PATH-0-Ontwerp-en-implementatiecontract-v1.0.0.md`, contract v1.0.0, status “ontwerp ter goedkeuring; geen productiecode-GO”.

## 1. Samenvatting en advies

De drie vereiste persistente constructies bestaan al. `ConstructionService` ondersteunt `pointOnSegment`, `pointOnCircle` en `pointOnEllipse`, getypeerde polygon-`edge`-referenties, parameterprojectie, evaluatie, bronvalidatie en afhankelijkheidsherberekening. Er is geen nieuw recept of schema nodig om een universeel gebruikersgereedschap op deze bestaande recepten te laten landen.

De huidige UI voldoet nog niet aan het nieuwe doelcontract. De catalogus toont drie gespecialiseerde gereedschappen. De standaard plaatsingscode maakt lijnstuk- en cirkelpunten direct aan; ellips heeft een speciale staging/preview; contextuele radiale plaatsing loopt via een eigen pad. Een `construct:pointOnObject`-ID zou momenteel door `tool.slice(10)` als het onbekende persistente kind `pointOnObject` worden gelezen. De runtime kent bovendien uitsluitend concrete gereedschapsrechten. Een dunne aliasadapter is dus noodzakelijk en moet bij iedere bron/commit routeren naar én opnieuw autoriseren voor één concreet recept.

**Advies: NO-GO voor M-PATH.0-I op basis van deze preflight.** Het contract vereist onderscheid tussen polygonvervorming en expliciete vertex-herordening, terwijl het huidige model alleen een kale `vertices`-array-update kent en geen intentie/operatie bevat. Beslis vóór implementatie hoe herordening atomair wordt onderscheiden zonder normale vervormingen of bestaande polygonconstructies te blokkeren. Dit is geen afwijzing van de voorgestelde architectuur; het is een implementatiepoort.

Er zijn geen tests, build of browserverificaties uitgevoerd. De volgende secties scheiden gecontroleerde codefeiten van voorstellen en resterende aannames.

## 2. Onderzochte basis en geladen architectuur

### Gecontroleerde bron

- Lokale Git-checkout was schoon op `main`, commit `6f66082c06b50b2b57077f410ecd55f56cdb9ad8`; die commit is een descendant van de contractueel genoemde checkpointcommit volgens de beschikbare lokale geschiedenis.
- `git switch -c codex/m-path-0-preflight origin/main` is gelukt en de branch volgt de lokaal aanwezige `origin/main`-ref.
- `git fetch origin main` faalde eerst tijdelijk met `getaddrinfo() thread failed to start`; een retry slaagde. `origin/main` resolveerde naar `6f66082c06b50b2b57077f410ecd55f56cdb9ad8`, gelijk aan de onderzochte broncommit.
- Ingelezen: M-PATH.0-contract, `AGENTS.md`, `CONSTRUCTIONS.md`, `docs/DEVELOPMENT-ROADMAP.md`, `docs/UI-RADIAL-9-CONTRACT-DRIVEN.md` en `docs/CORE-1-ARCHITECTURE-DESIGN.md`.

### Feitelijk geladen scripts

`editor.html` laadt onder andere `polygon-geometry.js`, `linear-geometry.js`, `ellipse-geometry.js`, daarna `construction-service.js`; vervolgens `index.js`, `coordinate-transform.js`, `snap-service.js`, `interaction-resolver.js`, `permission-runtime.js`, en later `tool-catalog.js`, `editor-radial-properties.js`, `editor.js`, zoek-/sidebar-modules en `editor-bootstrap.js`. De geometrie- en constructieservices staan dus vóór de editorconsumers. Er is geen afzonderlijke M-PATH- of tweede geometrie-engine geladen.

`index.js` exposeert `Engine.construct` en `Engine.constructIntersection` als façades. De editor voert constructies via `construction.create` uit; `PermissionRuntime` maakt op zijn beurt een tijdelijke engine-kopie en valideert bronnen en concrete rechten voordat het resultaat wordt gepubliceerd. `ConstructionService` blijft eigenaar van constructiecontracten, validatie en resolve-graaf.

## 3. Dragers en bestaande geometrie

| Drager | Huidig servicecontract | Huidige uitkomst | M-PATH.0-doel | Beoordeling |
|---|---|---|---|---|
| Lijnstuk (`line`) | `pointOnSegment`, rol `segment`, volledige bron `{objectId}` | `P=A+t(B−A)`; `t` wordt geklemd op `[0,1]`; degeneratie bij lengte `≤1e−9` geeft geen geometrie | Ondersteund | Hergebruik volledig; projectie-preview kan lineaire projectie centraliseren |
| Veelhoekzijde | `pointOnSegment`, rol `segment`, bron `{objectId,part:'edge',index:i}` | `line(o,ref)` pakt `vertices[i]` en `vertices[(i+1)%n]`; parameter blijft behouden bij vervorming | Ondersteund, één vaste zijde | Hergebruik volledig; expliciete zijdehit en vaste bronref verplicht |
| Cirkel | `pointOnCircle`, rol `circle`, volledige bron | `P=C+r(cos 2πp,sin 2πp)`; alleen `r>0`; `p` modulo 1; projectie gebruikt de hoek van Q−C | Ondersteund | Hergebruik recept en `projectParameter`; centrumklik wordt door contourafstand normaal buiten 12 px afgewezen |
| Ellips | `pointOnEllipse`, rol `ellipse`, volledige bron | `EllipseGeometry.fromDefinition` en `pointAt(p)`; ongeldige/gedegenereerde bron levert geen punt | Ondersteund | Hergebruik `EllipseGeometry.nearest` voor preview en parameter; geen nieuwe solver |
| Rechte | Geen `segment`-acceptatie voor rechte; bestaande lineaire rollen zijn anders | Geen punt-op-rechte-recept | M-PATH.1 | Buiten scope |
| Halfrechte | Geen `segment`-acceptatie voor halfrechte | Geen punt-op-halfrechte-recept | M-PATH.1 | Buiten scope |

**Codefeiten.** `construction-service.js` definieert alle drie soorten in `recipes`, `pathKind`, `normaliseParameter`, `projectParameter`, `referencesForRole`, `evaluate` en `calculate`. `pointOnSegment` accepteert polygon-edge-ref én hele `line`, `vector` en `dimension`; `pointOnCircle` en `pointOnEllipse` accepteren hele objectrefs. `normaliseParameter` klemt segmenten en normaliseert cirkel/ellips naar `[0,1)`. `projectParameter('pointOnEllipse',…)` roept `EllipseGeometry.nearest` aan. Segmentprojectie is de dot-productprojectie en de resolver weigert een segmentlengte `≤1e−9`.

`ConstructionService.validateReferences` controleert bronsoort en edge-index. `resolve` evalueert afhankelijke objecten opnieuw na bronwijziging; opgeslagen parameter en bronref blijven onderdeel van het constructierecept. Een tijdelijk ongeldige afhankelijke bron maakt het object `constructionValid:false`; er is geen alternatieve bronrebind.

**Vector/dimension.** De bestaande `segment`-rol accepteert `vector` en `dimension` als volledige refs, en `pointOnSegment` kan dus ook op die lineaire dragers worden gebruikt. De catalogus toont het reeds bestaande gereedschap Punt op lijnstuk; de contractuele nieuwe M-PATH.0-capabilitymatrix beperkt het universele gereedschap tot `line` en polygon edge. Advies: behoud bestaande servicegedragingen en geef bij de nieuwe alias alleen de vier contractueel bedoelde carrierfamilies vrij; voeg vector/dimension niet stilzwijgend toe aan de alias.

### Projectie- en tolerantiebeoordeling

- Pointer-hits worden in `constructionPick` met schermcoördinaten gemeten en de bestaande contourtolerantie is 12 CSS-px. Segmenthit gebruikt schermsegmentprojectie; cirkel gebruikt contourafstand; ellips gebruikt `EllipseGeometry.nearest` in de schermtransformatie.
- `ConstructionService.projectParameter` rekent in modelcoördinaten. De huidige editor bewaart gelijke x/y-schaal; een gedeelde projectieadapter moet dezelfde gevalideerde transformatie/afstand als preview gebruiken en daarna exact dezelfde parameterfunctie gebruiken als commit.
- Cirkelprojectie bij `Q=C` resulteert via JavaScript `atan2(0,0)` in parameter 0 (oostelijke nulrichting). In de normale UI maakt 12-px-contourafstand een centrumklik ongeldig voor een cirkel met straal groter dan de tolerantie. De service zelf documenteert deze UI-invariant niet; hou de bronafstandcheck in de adapter.
- Ellipsprojectie bewaart elliptische parameter, niet poolhoek. Bestaande `nearest` is de wiskundige en schermafstandautoriteit. Bij gelijke minima/naad moet de bestaande solver zijn determinisme behouden.
- Segmentdegeneratie wordt niet gedeeld met circle/ellipse-regels. Cirkelstraal 0 wordt `ZERO_RADIUS`; ongeldige ellips is via `fromDefinition` tijdelijk niet berekenbaar. Alle previews moeten non-finite/out-of-range uitkomsten afwijzen vóór command.

## 4. Universele dispatcher, catalogus, context en rechten

### Feitelijke architectuur

- `tool-catalog.js` bouwt de catalogus uit zichtbare `data-tool`-elementen. Een werkend item krijgt `id` plus `commandToolId`; voor `construct:*` is dat standaard dezelfde ID. Sidebar/fullscreen gebruiken dezelfde catalogus.
- `editor.html` toont nu aparte entries `construct:pointOnSegment`, `construct:pointOnCircle` en `construct:pointOnEllipse`.
- `EditorApp.toolAllowed` vergelijkt constructie-ID's met `getAllowedTools()`. De standaard picker bepaalt de receptsoort met `this.tool.slice(10)`; `constructionClick` doet hetzelfde en voert aan het eind `construction.create({toolId:'construct:'+kind,…})` uit.
- `startContextConstruction` haalt op dit moment `kind=toolId.slice(10)`, controleert catalogus/rechten en vraagt `contextualPlans(source,kind)`. De catalogus en service plannen dus per bestaand recept, niet per UI-alias.
- `PermissionRuntime` valideert `construction.create` tegen een bekende `construct:*`-tool, `allowedTools` en elke bron separeert via `sourceTools.includes(p.toolId)`, daarna roept het `Engine.construct(kind,…)` aan. Een UI-alias is geen concrete grant en mag niet in de plaats komen van die controles.
- `contextualPlans` kan expliciete polygon-`edge` refs als `placement` voor `pointOnSegment` leveren. Een polygon als geheel biedt geen willekeurige randkeuze; die moet door de pointer-hit als getypeerde `partRef` worden vastgesteld. Radiale code heeft een padplaatsingsspecialisatie.

### Conclusie en kleinste correcte uitbreiding — voorstel

`construct:pointOnObject` kan uitsluitend als **catalogus-/UI-alias** bestaan. Er mag geen `ConstructionService.contract('pointOnObject')`, modelkind, history-command of JSON-kind bij komen. De dispatchadapter moet vóór `tool.slice(10)` herkennen dat het huidige tool een alias is. Na bronhit classificeert hij de geautoriseerde, zichtbare carrier naar uitsluitend één van:

| Getypeerde hit | Concrete tool/commando | Persistente kind | Bronref |
|---|---|---|---|
| `line` | `construct:pointOnSegment` | `pointOnSegment` | `{objectId}` |
| polygon edge `i` | `construct:pointOnSegment` | `pointOnSegment` | `{objectId,part:'edge',index:i}` |
| `circle` | `construct:pointOnCircle` | `pointOnCircle` | `{objectId}` |
| `ellipse` | `construct:pointOnEllipse` | `pointOnEllipse` | `{objectId}` |

Aliasbronselectie, preview en confirm moeten een immutable staged record met concrete `toolId`, `kind` en exacte `sourceRef` delen. Bij confirm worden zichtbaarheid, bronvaliditeit, objectrechten, `toolAllowed(concreteToolId)`, `sourceTools` en de create-command opnieuw gecontroleerd. Eén `construction.create`-commando maakt één punt in één history-actie. Toolzichtbaarheid mag worden bepaald door ten minste één concrete toegestane route, maar de geselecteerde concrete route moet afzonderlijk zijn toegestaan; geen aliasgrant toevoegen aan `sourceTools` of `allowedTools`.

De `ToolCatalog`-entry kan `commandToolId` niet simpelweg als aliasdispatch laten fungeren: huidige catalogusrendering/editor-events zijn gebaseerd op `id`, en runtime kent alleen concrete commando's. De kleinste oplossing is een expliciete aliasresolver in de editorlaag, terwijl `commandToolId` voor de alias óf een herkenbaar UI-alias blijft dat nooit rechtstreeks naar runtime wordt gestuurd, óf apart een `dispatchKind`/routebeleid krijgt. Kies één vorm en test dat `commandToolId` niet onbedoeld een nieuwe persisted kind oplevert.

Sidebar en fullscreen komen automatisch uit de catalogus. Radiaal moet het universele item aan de hand van concrete plans aanbieden zonder `contextualPlans(object,'pointOnObject')` te vragen. De kleinste centrale uitbreiding is een service-/interactionadapter die per carrier de bestaande concrete `contextualPlans` composeert tot één aliasplan met exact bronref. Geen objecttype-whitelist in het radiaalmenu. De bestaande zesdelige radial UI blijft ongemoeid.

## 5. Polygonzijde, identiteit en topologie

**Bewezen gedrag.** `referenceOptions(polygon)` levert een `line`-ref per geordende zijde. `line(polygon,{part:'edge',index:i})` resolveert naar hoekpunt `i` en `(i+1)%n`. `contextualPlans(...,'pointOnSegment',edgeRef)` bewaart die ref in een expliciet placement-plan. Constructieresolutie behoudt parameters bij vertexcoördinaatupdates; dus driehoeken, vierkanten, rechthoeken, parallellogrammen en overige geldige polygonen volgen dezelfde zijde-index. Bij `t=0`/`t=1` blijft het punt op de eindpunten; `projectParameter` clamping voorkomt overschrijding naar een buurzijde.

**Hitgedrag en ambiguïteit.** `constructionPick` sorteert kandidaten op afstand en vervolgens stabiele object-ID/priority; polygon-edge refs op gelijke afstand worden niet als keuze aan de gebruiker getoond. Dezelfde deterministische sortering kan bij een hoekpunt dus één edge kiezen zonder zichtbare verduidelijking. Overlappende bronnen krijgen ook een deterministische winnaar, niet een expliciete picker. M-PATH.0 vereist zichtbare, consistente bronidentiteit; maak bij gelijke edge-/objecthits een keuze of highlight op basis van de exact gekozen candidate, en freeze die sourceRef tot confirm/drag-einde.

Polygonranden en gevuld binnengebied zijn verschillende betekenissen. `constructionPick` role `segment` meet afzonderlijke randrefs; `role polygon`/`figure` kan polygon-interieur als afstand 0 tellen. De universele adapter mag alleen `segment`-edge kandidaten gebruiken. Geen `selectAt`/gevulde `polygon`-rol als contourfallback.

**Open topologiepunt.** `ConstructionService.validateUpdate` blokkeert een gewijzigd aantal vertices wanneer vertex-, edge- of triangle-bronnen bestaan. Het blokkeert geen gelijke-count herordening. `model.js` normaliseert/valideert polygoncoördinaten maar heeft geen expliciete vertex-reorder- of edge-renumber-operatie. Een wijziging van dezelfde `vertices[]`-array is op zichzelf niet te onderscheiden als gewone vervorming of intentie om indices te herordenen. Een algemene blokkade van gelijke-count updates schaadt normale vervormingen en bestaande polygonconstructies; automatische heuristische remapping kan een geldige vervorming fout classificeren.

**Voorstel, onder voorbehoud van besluit.** Houd edge-index als identiteit. Voeg geen globale polygonregel toe. Een toekomstige expliciete topologieoperatie moet een reorder-intentie aangeven en de modelcommandlaag moet die atomair weigeren wanneer afhankelijke edge refs bestaan (remapping hoeft niet in M-PATH.0). Normale `object.setProperties`/vertex-drag blijft coördinatenvervorming. Voor implementatie moet bevestigd zijn dat alle polygonmutaties die semantische reordering kunnen doen via deze expliciete commandintentie lopen; import/replace en interne rebuilds moeten hun bestaande validatie behouden.

## 6. Preview, pointerinteractie en rechten

### Huidige workflows

- `constructionClick` verzamelt bronnen met `constructionSourcesAt`; reguliere `pointOnSegment` en `pointOnCircle` gaan door de generieke create-tak en berekenen de parameter op de bevestigingsklik. Na bronselectie wordt geen gedeelde tweede stap voor deze recepten gestart.
- `pointOnEllipse` start expliciet `pathPlacement`; de `ellipsePointPlacementPreview` gebruikt `EllipseGeometry.nearest`, toont een preview-point en staat bevestiging binnen 12 px toe.
- Radiale `startContextConstruction` ondersteunt `placement` plannen voor `pointOnSegment`/`pointOnEllipse`; `radialPathPlacement` rekent afzonderlijke segment-, circle- en ellipse-afstanden/parameters uit, maar de radial circle route wordt niet gekozen door de huidige service-planregel voor een circle (dat is `pointOnCircle`'s bestaande workflow; adapter moet een placement-plan componeren).
- `radialPathPlacement` berekent bij ellipse `nearest.parameter`; bij segment/circle berekent afstand in editor en roept daarna `projectParameter` aan. Staged bron en commit-ref zijn dezelfde, maar editorbranches hebben verschillende previewtaugelijkheid. De ellips hover-preview is apart en er is geen zichtbare overeenkomstige segment/cirkel live projected point preview.
- `constructionPick` gebruikt 12 CSS-px voor objecthit. Voor ellips gebruikt nearest in schermmetriek; circle contourdistantie gebruikt getransformeerde straal. Circle `projectParameter` gebruikt modelhoek, geldig bij de bestaande uniforme x/y-schaal. De bestaande snap-service prioriteiten en selectietolerantie blijven onafhankelijk; de alias moet voorkomen dat vrije snap de vastgelegde carrier of edge vervangt.
- `pathPoint`-drag wordt in `begin` alleen gestart voor auteurmodus (`!this.runtime`). Pointermove verandert enkel `construction.parameter` via `construction.setParameter`; bij pointerup wordt de bestaande geschiedenis afgesloten. Restricted runtime kan op deze basis nog geen gekoppeld padpunt slepen, hoewel de commandruntime de `construction.setParameter`-operatie heeft. Het contract vraagt dezelfde lock-/permission-hercontrole voor drag; dit is een functiepariteitsgat, niet automatisch autorisatie-uitbreiding.
- Cancel-infrastructuur bestaat: Escape roept `cancel`, `pointercancel`, `lostpointercapture`, window blur en resize annuleren; construction pointerup laat bestaande staging doorlopen. `setTool`, document reset/load, context change, dispose en nieuwe tekenflows roepen `cancel`. Behoud `pointerId`, capture/release en geschiedenissemantiek.

### Voorgesteld interactiecontract

Gebruik één stagingrecord plus één zuivere projectiefunctie voor alle vier dragers. Elke pointermove levert bijvoorbeeld `{sourceRef,kind,parameter,projectedPoint,distancePx,valid,reasonCode}`; preview en confirm consumeren dezelfde helper. De service blijft parameter/geometry-eigenaar; de editor bepaalt CSS-pixelafstand, highlight en staging. Confirm re-resolveert de sourceRef, herberekent dezelfde projectie op pointerup en voert één concrete `construction.create` uit. Preview mutatievrij; geen preview op verborgen, ontoegankelijke of ongeldige source.

Voor geselecteerde polygon edge moet de visuele highlight exact `edge:i` aanduiden. Op vertex ties en exact overlappende contouren wordt vóór staging zichtbaar verduidelijkt; tijdens preview/commit wisselt source niet. Aan de hand van de contractuele twee-stapsflow wordt eerst bron gekozen en daarna de puntpositie bevestigd, ook voor cirkel. Bestaande gespecialiseerde tools blijven in M-PATH.0-I zichtbaar totdat acceptatie en aparte M-PATH.0-A dit toestaan.

## 7. Compatibiliteit, import/export en permissies

- `pointOnSegment`, `pointOnCircle`, `pointOnEllipse` zijn bekende constructiesoorten; onbekende `construction.kind` wordt door `ConstructionService.contract/validate` geweigerd. Een alias blijft dus uit JSON.
- `model.js` leidt versie/schema af uit aanwezige recepten; segment/circle/ellipse path constructs zijn schema2-recepten. Ellipsen/recepten activeren reeds bestaande ellipse/document/construction schema's (huidige hoogste branches in deze snapshot: document 10 en construction 10 door andere features). Geen bump vanwege UI-alias.
- JSON reload/resolve en history replay lopen via hetzelfde model/ConstructionService. De alias introduceert geen migratie, opgeslagen field, broncache of nieuwe dependency graph.
- Bronverplaatsing herberekent via bestaande dependency resolve met vaste parameter en ref; cascade deletion gebruikt `ConstructionService.descendants`; detach en dupliceren volgen bestaande model-/commandroutes. Gemengde ellips/parallellogramdocumenten zijn al toegestane objecten en blijven onveranderd.
- `PermissionRuntime` controleert concrete `allowedTools`, bron-`sourceTools`, read/display/availability en create-object policies. Toon geen bron/hover details vóór capability check; revalidate bij confirm. Alias mag alleen de gebruikersentry uniformeren, nooit grants verruimen.
- Vergrendelde bron is niet per definitie onleesbaar; bestaand `requireObject`-beleid moet als broncheck gezaghebbend blijven. Doelpunt-lock en parameterrechten gelden bij drag. Exportredactie is door bestaande runtime projecties en Engine-exportpaden geregeld; alias mag geen extra bron-ID, tooltip, ARIA of cacheveld introduceren.
- Tests voor ellipse-permissies behandelen bronrechten, invaliditeit/herstel en restricted exports expliciet. Voor punt-op-segment en circle is er testimpact vanuit `permissions.test.cjs`/browser suites, maar in deze audit is geen bestaand end-to-end restricted alias-scenario uitgevoerd.

Geen documentmigratie of schemawijziging vereist als de adapter bestaande recipes blijft gebruiken.

## 8. Testimpactmatrix

De inventory hieronder is gebaseerd op testbestandsnamen en statische inhoudszoeking; suites zijn niet uitgevoerd. “Bestaande dekking” betekent gerichte tests zijn aanwezig, geen bewijs dat elk normatief scenario al is afgedekt.

| Onderwerp | Bestaande relevante dekking | Nieuw noodzakelijk voor M-PATH | Duplicatie vermijden |
|---|---|---|---|
| 1. Wiskunde/parameters | `construction-contract.test.cjs`, `linked-paths.test.cjs`, `point-projections.test.cjs`, `point-on-ellipse.test.cjs`, `ellipse-geometry.test.cjs` | Dispatcher carrier→recept; endpoint/clamp; circle center/tie; ellipse preview result==commit; parameter modulo-naad | Hergebruik bestaande golden fixtures voor puntprojecties/ellipsnearest |
| 2. Plaatsen/verslepen vier dragers | `browser-linked-paths.cjs`, `browser-point-on-ellipse.cjs`, `browser-point-projections.cjs` | Eén tweestaps aliasflow voor line/edge/circle/ellipse; bronhighlight en live preview; pointer drag edge endpoint clamp | Voeg aliasgevallen toe aan bestaande suites i.p.v. parallelle complete suites |
| 3. Vaste polygonzijde/vervorming | `constructions.test.cjs` polygon edge refs; `polygon.test.cjs`; browser polygon suites | pointOnSegment edge blijft exact `i` bij vervormen; drag over vertex houdt edge; expliciete reorder atomair geweigerd | Bestaande polygon-validatieherordeningstests uitbreiden alleen voor afhankelijke edge |
| 4. Degeneratie/herstel | `linked-paths.test.cjs`, `ellipse-geometry.test.cjs`, `point-on-ellipse.test.cjs` | segment ≤1e−9, circle radius zero, ellipse degenerate; geen stale preview en herstel met identieke ref/parameter | Reuse bestaande `constructionValid` herstelpatronen |
| 5. Bronwijziging/verwijdering | `constructions.test.cjs`, `linked-paths.test.cjs`, `history.test.cjs`, `mutation-selection.test.cjs` | Bron intrekking tijdens staging; cascade/undo; preview source ID blijft exact | Bestaande graph/deletion tests blijven autoritatief |
| 6. JSON/roundtrip | `documents.test.cjs`, `constructions.test.cjs`, `point-on-ellipse.test.cjs`, `ellipse-model.test.cjs` | Mixed fixture vier dragers plus M8a-ellips/M8b-parallellogram; geen `pointOnObject`, schema unchanged | Eén gemengd rondtriptest, geen snapshots per volledig document |
| 7. Undo/Redo/cancel | `history.test.cjs`, `browser-history.cjs`, `browser-lifecycle.cjs`, path browser suites | Eén create/history action; cancel Escape/pointercancel/blur vóór confirm is nul; preview state clean; drag één undo | Bestaande history/lifecycle assertions uitbreiden |
| 8. Sidebar/radial/fullscreen/zoeken | `tool-catalog.test.cjs`, `browser-sidebar-navigation.cjs`, `browser-tool-menu.cjs`, `browser-canvas-fullscreen.cjs`, `browser-radial-menu.cjs` | Eén zichtbare alias, dezelfde ID in sidebar/fullscreen/search; radial aanbod via composed plan; geen alias `slice(10)` dispatch | Test generieke catalogus en bestaande radial geometrie-layout hergebruiken |
| 9. Rechten/locks/restricted export | `permissions.test.cjs`, `ellipse-permissions.test.cjs`, `browser-permissions.cjs`, `browser-point-on-ellipse.cjs` | Concrete-route autorisatie per carrier; grant revocation vóór confirm; restricted parameter drag; bronlock vs doel-lock; geen DOM/ARIA/SVG/PNG/JSON lek | Breid bestaande permission fixtures uit; geen nieuw permission-framework |
| 10. Regressie oude recipes | `linked-paths.test.cjs`, `point-on-ellipse.test.cjs`, `point-projections.test.cjs`, `browser-linked-paths.cjs`, `browser-point-on-ellipse.cjs` | Oude drie toolflows blijven onaangetast in I/V; `distributedPointOnCircle` regressie expliciet in V | Niet dupliceren van wiskundige recipe-tests; behoud legacy tools in I |

**Gerichte verificatie in deze preflight:** geen. De opdracht vraagt inventarisatie en vermeldt dat geen volledige regressietestrun nodig is; tevens is geen test als preflightbewijs nodig om het architectuuroordeel te vormen.

## 9. Gefaseerd implementatievoorstel

### M-PATH.0-I — implementatie, pas na afzonderlijk GO

| Stap | Bestanden/functies | Exacte wijziging | Afhankelijkheden/risico | Toepasselijke tests en acceptatie |
|---|---|---|---|---|
| I-1 UI-alias/catalogus | `editor.html`, `tool-catalog.js`, `editor.js` (`toolAllowed`, `setTool`, `constructionRole`, `constructionClick`) | Vervang/voeg catalogusingang toe als `construct:pointOnObject`; maak expliciete aliasresolver vóór `slice(10)`; behoud concrete tool-ID per staged route; geen constructiekind alias | Catalogus `id` en command ID zijn nu gekoppeld; aparte aliasdispatch kan toolpermission UI verwarren | Node tool catalog + nieuwe dispatcher matrix; sidebar/fullscreen exact 1 alias, onbekend aliaskind blijft geweigerd |
| I-2 Carrierbronselectie | `construction-service.js` (`referenceOptions`, `referencesForRole`, `contextualPlans`) of dunne bestaande interaction API; `editor.js` (`constructionPick`, `constructionSourcesAt`, `startContextConstruction`) | Compositie uit bestaande concrete plans; hergebruik typed refs; alleen line, polygon edge, circle, ellipse; polygon interior uitgesloten; expliciete tie resolver/highlight | Contextual plans zijn per kind; polygon `partRef` moet exact behouden blijven; radial aanbod mag geen whitelist krijgen | N1/N9 + E4/E7; bronselectie in sidebar/radial geeft identieke ref en rechten |
| I-3 Eén projectie/preview/confirm | `construction-service.js` (`projectParameter`) en `editor.js` (`constructionClick`, `radialPathPlacement`, `ellipsePointPlacementPreview`, preview render) | Zuivere gedeelde projectieresultaatfunctie; segment/circle/ellipse gebruiken dezelfde output voor preview en commit; 12 CSS-px contourdistance; staged source immutable; één tweede klik, één command | Schermafstand/modelparameter; center circle; endpoint en tie semantics; preview stale state | N2/E2/E3/E5/E6/N9; vier dragers tonen juiste projected point; commit identieke bron/parameter en één history item |
| I-4 Edge identity/topology besluit | `construction-service.js` (`validateUpdate`), model/command updatepad in `model.js`/`permission-runtime.js`, polygon mutation UI `editor.js` | Alleen nadat reorder-intentie onderscheid is gespecificeerd: explicit reorder operation atomair weigeren bij afhankelijke edge refs; gewone vertex coordinate changes blijven toegelaten | Huidig patchmodel bevat geen intentie. Zonder besluit kan guard óf vereiste niet afdwingen óf normale mutaties blokkeren | N3/E3; reorder weigert zonder mutatie/history; gewone vervorming en bestaande constructies ongewijzigd |
| I-5 Rechten/historie/cancel parity | `permission-runtime.js`, `editor.js` (`pathPoint`, `cancel`, `commit`) | Alias wordt niet als grant gebruikt; concrete create en parameter rights worden hercontroleerd; restricted path drag alleen toevoegen als bestaand policy het toestaat; cancel lifecycle ongewijzigd | Runtime drag is nu niet actief; UI integratie kan een policy-gat tonen | N5–N8/E6/E8/E9; revocation fail closed; locked target niet beweegbaar; één undo; export geen nieuw veld |

### M-PATH.0-V — verificatie en pariteit

1. Voeg gerichte Node-/Edge-tests uit matrix toe en voer relevante bestaande punt-/permissions-/polygon-/radial-/fullscreen suites uit.
2. Vergelijk oude gespecialiseerde flows met de nieuwe alias voor geometrie, parameter, history, locks en export. Houd drie bestaande tools intact.
3. Leg command, aantallen PASS/FAIL/SKIP en handmatige scenarios vast; geen dubbele UI-ingangen verwijderen.

Acceptatie: alle vier carriers volgen dezelfde bron→preview→confirm-stappen; concrete recepten blijven exact bestaand; edge `i` blijft vast; previews en commits delen sourceRef/projectieregels; geen schema-/permissionbreuk; geen bestaande regressies.

### M-PATH.0-A — aparte gebruikersacceptatie

Handmatige gebruikersacceptatie van line, circle, ellipse en minimaal driehoek plus vierkant/parallellogram; daarna pas besluit over weghalen van de oude menutoegang. Eventuele menuverwijdering en merge vereisen afzonderlijke goedkeuring. M-PATH.1–3 en M8-INT blijven buiten scope.

## 10. Open risico's, contractafwijkingen en besluitpoorten

1. **Remote branch freshness:** bevestigd; na een tijdelijke eerste fetchfout is de retry geslaagd en is `origin/main` exact `6f66082…`.
2. **Polygon topology intent (blokkerend voor implementatiestart):** hetzelfde aantal vertices + nieuwe array kan vervorming of herordening betekenen. Huidige API draagt die intentie niet. Ontwerp eerst een commandgrens/regel die gewone vervorming en oude polygonconstructies niet beperkt.
3. **Radial plan compositie:** bestaande contextual plans ondersteunen concrete kinds; alias moet samengesteld worden vóór `startContextConstruction`-contractmapping en moet de exacte polygon edge prefill bevatten.
4. **Restricted padpoint drag:** huidige canvas `pathPoint`-drag is auteur-only. Het contract vraagt drag met actuele setParameter-rechten; bepaal of dit al door runtimebeleid wordt ondersteund vóór UI enablement.
5. **Ambigue hits:** huidige candidate sortering levert deterministische maar soms stille tie-break. Contract wil expliciete/zichtbare keuze voor polygonhoekpunten en overlappende contouren.
6. **Testbewijs:** alleen statische inventory gedaan; geen testuitslagen geclaimd.

### GO/NO-GO

**NO-GO voor M-PATH.0-I totdat polygon-herordening versus vervorming is opgelost in een expliciet, niet-breed beperkend mutatiecontract.** De actuele `origin/main` is bevestigd als `6f66082…`. Na het topologiebesluit kan een smalle alias-/interactionadapter op basis van bestaande recipes naar verwachting verder zonder schemawijziging, nieuwe constructiesoort of geometriesolver.

## 11. Verwijzingen naar gecontroleerde code

Belangrijkste locaties in de onderzochte snapshot:

- `editor.html`: scriptmanifest (services vóór editor) en gereedschappen rond regels 44–46.
- `tool-catalog.js`: `create`, `build`, `commandToolId` (regels 12–90).
- `construction-service.js`: `recipes`/`pathKind`/parameterregels (regels 14–35); `contextualPlans` (regels 53–81); `projectParameter` en references (regels 87–90); `validateUpdate` (regels 90–96); point-receptberekening (rond regels 306–309); `resolve` en service-export (rond 320–335).
- `editor.js`: `toolAllowed` (rond regel 88); `constructionPick`/`constructionSourcesAt` (rond 595–632); `constructionClick` (rond 662–705); `ellipsePlacementPreview` (rond 706); `startContextConstruction` (rond 758); `radialPathPlacement`/ellips-preview (rond 817–865); `pathPoint` drag (rond 1030, 1078–1081); `cancel` en event wiring (rond 396–399, 1127–1140).
- `permission-runtime.js`: concrete tool-, sourceTools- en `Engine.construct`-validatie binnen `construction.create` (rond regels 193–194); `construction.setParameter` (rond regel 134); restricted projectie/export in het pad vanaf circa 220.
- `model.js`: update via `ConstructionService.validateUpdate` (rond regels 230–244), serialization/schema-afleiding (`toJSON`, rond regel 320) en import schema-validatie (rond regels 330–374).
- Relevante bestaande tests: `tests/linked-paths.test.cjs`, `tests/point-projections.test.cjs`, `tests/point-on-ellipse.test.cjs`, `tests/constructions.test.cjs`, `tests/polygon.test.cjs`, `tests/permissions.test.cjs`, `tests/ellipse-permissions.test.cjs`, `tests/tool-catalog.test.cjs`, `tests/browser-linked-paths.cjs`, `tests/browser-point-on-ellipse.cjs`.
