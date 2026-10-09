# M2c - Analyse en implementatieplan

Planversie: 1.0. Specificatie: 1.1. Datum: 2026-10-09.
Status: **door gebruiker goedgekeurd; volledig uitgevoerd, gebruikersacceptatie open**.

## 1. Gecontroleerd uitgangspunt

Repository From Zero 2 Infinity, branch `chatgpt/math-illustration-stabilization`; lokale en opnieuw gefetchte remote HEAD `3ffefff1784d6a148ca6208289747744cf146e16` (M4a). Geen gewijzigde getrackte bestanden bij start. Bestaande ongevolgde FEATURE-GAP-ANALYSIS.md blijft onaangeroerd. Geen AGENTS.md gevonden in de werkcheckout/werkmap.

Onderzocht: editor.html/css/js, editor-bootstrap.js, editor-axis-settings.js, editor-adaptive-grid.js, editor-history.js, editor-startup.js, editor-color.js via integratie, model.js, index.js, renderer.js, permission-runtime.js; M2a/M2b/M4a-documenten, feature-backlog, roadmap en gap-analyse; Node-suite en browserrunner/modules, waaronder categorie-, lifecycle-, permission-, lagen-, selectie- en constructietests.

Node-baseline opnieuw uitgevoerd: **275/275 PASS**, nul failures/skips. Echte Microsoft Edge-baseline opnieuw uitgevoerd: volledige suite PASS, 21 browsermodules plus startup/import/save-proeven; pageErrors: []. Productiecode en fixtures zijn niet gewijzigd.

## 2. Inventaris versus specificatie

| Onderdeel | Huidige implementatie | Classificatie en plan |
|---|---|---|
| Titelbalk | Alle zeven documentacties zichtbaar, browserconcept opslaan | Verplaats secundaire acties naar Meer; behoud IDs en handlers. Opslaan blijft lokaal concept, geen cloudclaim. |
| Logo | Tekstbranding zonder infinity-icoon | Nieuwe visuele UI: inline vectoricoon, geen engineasset. |
| Categorieen | Vier native details met gedeelde name=editor-tools: exclusief accordion | Bestaande bediening aanpassen naar onafhankelijk openen; actieve tool zichtbaar houden. |
| Selectie/kader | Links grote selecttool en K-knop; rechterdrag en keyboardkader bestaan | Naar centrale werkbalk; dezelfde resolver en pointercontroller. |
| Pannen | Linkerdrag op leeg canvas in selecttool | Nieuwe expliciete navigatiebediening; bestaande leeg-canvas-pan behouden. |
| Zoom | Wheel, rasterlimiet, reset; geen percentage/knoppen | Nieuwe UI-adapter op dezelfde zoomvalidatie/commandroute. |
| Weergave | Asnaam met popup en aparte oogknop; Snappunten; objecten/groepen/lagen in dezelfde viewList | Asnaam wordt configuratieselectie. Raster krijgt directe toggle. Snappunten alleen zichtbaar verwijderen. Object-/groeplijst naar lagengebied; niets laten verdwijnen. |
| Inspector | Links; enkel object rijk, multiselect/locked voornamelijk acties | Naar rechts, contextueel en secties; beperkte gemeenschappelijke stijl toevoegen via bestaand atomair command. |
| Coordinatenstelsels | Alleen Cartesian; model weigert iedere andere waarde. Andere drie disabled met binnenkort | Specificatie-aanname onjuist. Keuzelijst met 1 actieve en 3 disabled opties; echte implementatie apart vervolg. |
| Assen | showAxes, showXAxis/YAxis, showAxisLabels gezamenlijk labels/getallen; showOrigin is 0-tekst | Bestaand verplaatsen. Geen splitsing of oorsprongscirkel suggereren. |
| Raster | showGrid, axisStep; auteur adaptive 1-2-5, min0.1, schaalmax700 | Toggle en uitlezen effectieve stap. Geen tweede handmatige stapbesturing tegen adaptive grid. |
| As-/rasterstijl | Renderer hardcoded kleuren/diktes/fonts; geen configureerbare pijlen of primary/secondary grid | Nieuwe documentsemantiek, geen pure UI. Uitstellen met apart voorstel. |
| Objectpijlen/type | Vector/rechte/halfrechte renderer bepaalt gedrag; geen generieke arrow-field of type-conversie-UI | Afbeelding niet behandelen als reeds bestaande editorfunctie. Toon type read-only; geen niet-werkende dropdown/pijlkeuze. |
| Objectpuntstijl | style.radius en fill bestaan model/API; radius nog niet als inspectorveld | Eventueel klein objectveld via goedgekeurde style.radius-route, los van oorsprong. Niet onderdeel verplichte eerste UI-migratie. |
| Lagen | Namen, visibility, voor/achter, delete met behoud objecten, assignment; groups/object rows | Visueel aanpassen, pijlen behouden; geen nieuwe reorder-dragcontroller. |
| Illustratie/bediening | Titel/beschrijving en uitgebreide help links | Bereikbaar houden als inklapbare secties; op kleine schermen toegankelijke drawers. |

### Volledige inspectorinventaris

Behoud naam, ID/type, x/y, x1/y1/x2/y2, cx/cy/r, polygon-/anglevertices, vrije tekst, measurementLabelOnly, showMeasurement, computed/text measurementMode en measurementText. Behoud stroke/fill (afzonderlijk), strokeWidth, dash incl. eigen patroon, opacity en fontSize voor tekst. Behoud showLabel, labeldrag en offsets; er is nu geen algemene label-fonteditor.

Behoud M4a vrij/gekoppeld-status, redenen, bron-/dependentnavigatie en detach; group/ungroup, dupliceren, lock/unlock, laagtoewijzing en delete. Zichtbaarheid/kleur/showLabel zitten deels in objectlijst en blijven daar bereikbaar plus passend in inspector. Exacte getypte lengtes/radii blijven bestaande tekeninteracties; geen nieuwe constraintvelden of vergelijkingeditor. Multiselectie heeft nu geen gemeenschappelijke stijleditor: dat is nieuwe UI-functionaliteit, geen simpele verplaatsing.

## 3. Visuele vertaling van de referentie

Desktopbasis: header circa72px, links236px, midden flex met min-width0, rechts280px; 12px gutters, afgeronde panelen. Kleuren als voorlopige CSS-tokens: application #101820, panels #16212a/#1c2933, border #30404c, text #edf1f3, muted #a4b0ba, accent #f6cf65, canvas behoudt documentachtergrond. De afbeelding is de visuele maatstaf; contrast controleren voor goudtekst, focus en disabled states.

Infinityteken links als zorgvuldig getekend inline SVG met witte dubbele lus, daarnaast goudkleurige uppercase merknaam en witte titel. Consistente inline lijniconen met toegankelijke buttonnamen; decoratieve SVGs aria-hidden. Geen iconfont/dependency vereist. Tools in tweekoloms compacte tegels; active gouden rand/vulling. Sectieheaders met icoon/chevron. Geselecteerde asrij/geselecteerde laag duidelijk accent, niet verwarren met geometrische selectie.

Rechts secties Algemeen/Geometrie, Label en meting, Uiterlijk, Constructierelaties, Organisatie/geavanceerd. Alleen toepasselijke secties. De voorbeeldsectie Vergelijking wordt niet nagebouwd met fictieve functionaliteit. Geen duplicate lijndiktevelden. Objectkleur uit document behouden; nieuwe UIkleuren gelden alleen voor chrome.

Op1280x720 drie kolommen zonder body-scroll; zijpanelen onafhankelijk scrollen. Op1024x768 compacte breedtes circa220/260. Onder circa1000px eigenschappen als optionele drawer, onder760px ook toolsdrawer; centrale toolbar blijft bereikbaar. Desktop is verplicht, mobiele bediening is responsive UI, geen nieuwe touchgeometryfeatures.

## 4. Componentstructuur en eigenaars

Behoud gewone scripts en huidige bootstrap. DOM-shell in editor.html: Header/FileMenu, ToolSidebar met categories/DisplaySection/LayerBrowser/Illustration/Help, CanvasNavigation + bestaande canvasWrap/canvas, PropertiesSidebar. editor.css bevat tokens/layout/responsive/states. Geen framework of ES-modules.

EditorApp blijft enige interaction-controller, lifecycle-owner en invalideerder. Nieuwe kleine pure HTML-builders mogen in editor-ui.js als injecteerbare service; geen listeners, engine-discovery of eigen renderloop. AxisSettings blijft pure renderfunctie, nu bruikbaar binnen propertieshost in plaats van popup. Eventdelegatie van EditorApp naar vaste hosts; handlers init/dispose symmetrisch.

Voorgestelde tijdelijke EditorApp-status:
- inspectorTarget: null | {kind:objects} | {kind:axes}; geometrische IDs blijven selectedIds, nooit een pseudo-object-ID.
- navigationMode: select | pan; Kaderselectie is de bestaande marquee-lifecycle, geen tweede persistent toolcontroller.
- fileMenuOpen, sidebarOpen, propertiesOpen en sectionOpen keyed per context: alleen UIstate.

Assen selecteren sluit/annuleert actieve bewerking via bestaande lifecycle, maakt geometrische selectie leeg, stelt axes-context in en invalideert. Het vorige selectiebeeld wordt niet als verborgen actieve selectie behouden. Click/objectlist/marquee activeert objects-context. Nieuw/load/reset clear context; undo/redo reconcilieert objectcontext met herstelde IDs, axes-context alleen als nog geldig. Paneel sluiten bewaart context maar verandert geen document. Asoog verandert zichtbaarheid en laat inspectorcontext/selectedIds ongemoeid.

Open-/sluitstatus niet bewaren in geometrie-JSON/draft. Bij render geen focusverlies van actief veld; inputs valideren via bestaande handlers en restore na denied/invalidcommand. Native details buiten vervangen innerHTML of keyed sectionstate herstelt openstate. Pointerevents van bediening bereiken canvas niet.

### Gegevensstroom

UI-intent -> EditorApp commandadapter -> allowed/capabilities (adviserend) -> execute (autoritatief) -> history/transactie -> centrale invalidate/render -> canvas/overlays, object-/lagenlijst, inspector, toolbar. Pure presentatie mag geen model.update of rendererwrites toevoegen. Queryresultaten zijn geen authorisatietickets.

Selectieconfiguratie is geen mutatie. Objectediting gebruikt bestaande object.setGeometry/setProperties/patchBatch; atomair multiselect via ids/fields, alle targets/velden geldig en toegestaan of alles geweigerd. Mixed waarden tonen Verschillend; geen gemiddelden toepassen. Linked computedfields niet bewerkbaar; locked selectie alleen bestaande toegestane acties. Geen nieuwe multiselectgeometry/constraintoperaties.

## 5. Instellingen, opslag en permissies

| Instelling | Auteur | Cursus/toets | JSON/draft | SVG | Historie |
|---|---|---|---|---|---|
| showAxes/Grid/XAxis/YAxis/AxisLabels/Origin | document.setPresentation via changeDocument | view.configure alleen met viewConfigure; documentmutatie uitsluitend expliciete setPresentationFields-grant | Auteur document; learner-view niet opslaan in baseline | Effectieve exportpresentatie via bestaande runtime | Auteur bestaande undo; learner-view geen documentundo |
| bounds/pan/zoom/resetview | view.pan/zoom, bestaande commandadapter | Zelfde op, expliciete grants | Auteur huidige documentpresentatie; learner aparte view | Bestaande effectieve view | Auteur bestaande undo; learner-view geen documentundo |
| axisStep | Adaptive auteurservice bezit effectieve waarde; display read-only | Geen adaptiveservice in huidige restrictedbootstrap; bestaande sessiewaarde | Huidige serialisatie/historiecapture behouden | Renderer gebruikt effectieve stap | Geen nieuwe stapmutatie |
| showSnapPoints | Ongewijzigde opgeslagen vlag; geen zichtbare switch | Huidige policy/renderersemantiek | Behouden inclusief false | Bestaande definitieve export, geen editorindicator | Geen nieuwe UIwijziging |
| label/style/visible/locked | Bestaande objectcommands en locks | Alleen capabilities/grants; geen verborgendata uitlekken | Bestaande objectvelden | Bestaande renderer | Bestaande undo/transacties |
| groepen/lagen | Huidige structuuropdrachten | Huidige verboden structurele mutaties blijven | Bestaande v4/v5 | Bestaande visibility/paintorder | Bestaand |
| panels/menu/axes-context | Tijdelijk editorstatus | Tijdelijk editorstatus | Nee | Nee | Geen documenthistory |

Belangrijk M2b-afhankelijkheid: huidige asUI roept document.setPresentation aan. Bij migratie moet actorview expliciet view.configure gebruiken wanneer alleen viewConfigure is toegestaan. Zonder dat recht toggles disabled en geforceerde events alsnog geweigerd. Publicatie/baselinepresentatie niet stil aanpassen. Controls voor verborgen/ongeldige/onleesbare objecten niet genereren; toolbar en nieuwe panes gebruiken dezelfde restrictControls/capabilities.

Opslaan betekent lokale DraftStore.save, geen filedownload/publicatie. Nieuw behoudt bestaande vernietigingsconfirm en wist auteurhistorie/draft. Import is reeds atomair en een undo-stap; huidige import heeft geen vernietigingsconfirm. Voorstel: extra confirm alleen bij afwijking van laatst opgeslagen/geladen uitgangsdocument, annuleren behoudt document/redo; deze dirtyvergelijking is UIstate, geen documentveld. Metadata/help blijven beschikbaar. Geen verlaten-pagina-waarschuwing toevoegen zonder verdere goedkeuring.

## 6. Kleine submilestones

### M2c.1 - Titelbalk en linkerpaneel

Bestanden: editor.html/css/js, eventueel pure editor-ui.js en bootstrapinjectie; nieuwe ui-shell Node/Edge-proeven. Maak eerst tests voor bereikbaarheid/categorieen/menu/draftconfirm/snapvlag.

Headerbranding/Meer met bestaande actionIDs; native details-disclosure met gewone buttons (geen role=menu zonder volledig menu-keyboardcontract). Enter/Space openen, Tab volgt buttons, Escape/buitenklik sluit en focus terug naar trigger. Verplaats select/kader naar voorlopige centrale toolbar zodat ze vanaf deze stap bereikbaar blijven. Onafhankelijke categorieen; compact icons, Display axes/grid, aparte LayerBrowser met bestaande objecten/groepen. Geen inspectorverplaatsing of enginewijziging in deze stap.

Acceptatie: alle 20 teken-/meet-/constructietools plus Selectie bereikbaar; alle documentacties keyboard/muis; meerdere categorieen tegelijk open; Snappunten verborgen en gedrag/JSON gelijk; visibility/grants/lagen intact. Rapport en checkpoint voor handmatige test.

### M2c.2 - Contextueel rechterpaneel

Bestanden: editor.html/css/js, editor-axis-settings.js, pure builders indien nodig, bootstrapservices; permission-runtime uitsluitend als bestaande API onvoldoende blijkt (eerst apart aantonen, geen policyuitbreiding gepland).

Tests eerst axes-context vs visibility, geen selectiefakeobject, complete propertyinventaris, locks/grants en mixed styles. Verplaats bestaande inspector; voeg contexttarget en sectionstate toe. Asnaam opent rechts; toggle onafhankelijk. Cartesiaans-keuzelijst met overige disabled opties. ShowAxisLabels heet Aslabels en getallen; showOrigin heet Nulpunt (0) tonen. Rastertoggle links/rechts toont dezelfde effectieve waarde. Atomair common stroke/fill waar toepasselijk, width/dash/opacity en labelvisibility; geen stille deelbewerking van locks/denied/mixedtypes. Bestaande features blijven beschikbaar voor single object, groepen/lagen en M4a-info.

Acceptatie: alle contexten correct, geen focus/openstateverlies, authorundo/JSON/SVG, course/assessmentviewconfigure zonder baselinewijziging, directcommandnegatieven. Geen nieuwe asstijl/pijl-/originvelden. Rapport en handmatige acceptatie.

### M2c.3 - Navigatie en responsiviteit

Bestanden: editor.js/html/css, CoordinateTransform uitsluitend als aantoonbaar noodzakelijk (contract behouden). Tests eerst pan/zoomknoppenpercentage/panelresize/cancel/permissions.

Zoombuttons delen math-anchor/limits/commands met wheel via kleine extractie; anchor midden van zichtbare SVG. Percentage = renderer.scale()/scale van DEFAULT_BOUNDS bij dezelfde width/padding *100; uitlezing geen vrij tekstveld. Reset behoudt DEFAULT_BOUNDS. CSSresize kan CSSpx per eenheid veranderen; documentbounds en geometrie blijven exact gelijk, percentage representeert documentzoom. Geen automatische boundscompensatie die resize tot documentmutatie maakt.

Explicit panroute binnen bestaande pointerDown/interaction.mode=pan; niet setTool(pan) zonder toegestane-toolcontract. Pan nooit objectselect/drag; selectie/layers behouden. Actieve toolwisseling annuleert volgens huidige lifecycle. Bij paneelresize tijdens capture veilig cancel/rollback voor wijziging van transform; anders up-to-date CoordinateTransform gebruiken. Geen tweede pointercontroller of ResizeObserver die documentstate schrijft.

Acceptatie:1280x720/1440x900/1920x1080/1024x768 en small760/390, 200% browserzoom, geen horizontale clipping/verborgen acties; drawing, capture, keyboardmetingen, snapping, exact1, selected multitranslation/labeldrag behouden. Rapport/checkpoint.

### M2c.4 - Integratie en visuele acceptatie

Nieuwe browser-ui-modernization.cjs, uitbreiding relevante bestaande modules, docs/report en screenshotfixtures apart van mathematische goldens. Alle Node en echte Edge-modules, screenshotreferenties voor neutral/object/multi/axes/menu/locked/restricted en compact layouts. Controleer contrast, Tabvolgorde, labels, focus, Escape, disabled, dialogfocus; automated checks plus keyboardproeven. Vergelijk sidebar/header/spacing/icons/canvas/rechts met referentie.

Bestaande browser-area-menu.cjs verwacht exclusief accordion: verander uitsluitend die expliciete oude UXverwachting naar onafhankelijk open, behoud alle meet-/constructieassertions. Bestaande browsertests die JSON/SVG-buttons direct klikken moeten eerst Meer openen; selectors/actionIDs behouden. As-popupverwachtingen vervangen door contextpaneeltests. Dit zijn transparante intentional UXmigraties, geen verwijderen van regressiedekking of aanpassen van geometrische goldens.

Acceptatie: volledige suites PASS, geen ongewenste documentdiff bij presentatie-only navigation, sourcezoekbewijs een controller/renderowner, visuele afwijkingen gerapporteerd; daarna gebruiker functionele EN visuele acceptatie. Nog geen M4b starten.

## 7. Uitgestelde uitbreidingen en voorstellen

Log/semilog/pool zijn echte nieuwe transformaties: afzonderlijk geometriespecificatie voor domeinen, snapping, hit/selection/drag/tolerance, bounds/import/export en compatibiliteit. Deze requirement blijft behouden en is geen M2c-implementatie.

Split labels/getallen vereist expliciete presentatievelden met fallback van oude showAxisLabels. Asstijl/fonts/pijlen/rastermajor-minor vereisen renderer/export/normalisatie en permissie-whitelists; extensievelden die import toevallig behoudt zijn geen goedgekeurd contract. Niet toevoegen als CSSoverride: export zou anders afwijken. Afzonderlijk compatibiliteitsvoorstel en tests, geen automatische versiebumps.

Originontwerp: latere originMarker met none/filledCircle/openCircle/cross/dot plus eigen size/color, los van geometrisch style.radius. showOrigin blijft 0-tekst. Nieuwe markersemantiek niet over bestaande vlag leggen. Voor objectpunten kan radius via bestaand style.radius zonder formaatwijziging; optioneel pas expliciet goedgekeurd. Generieke objectarrowheads/typeconversion/vergelijkingeditor eveneens apart.

## 8. Risico's en gerichte testmatrix

| Risico | Verplichte proef en verwachte uitkomst |
|---|---|
| Huidige viewList-delegatie gaat verloren | Alle laag/group/objectacties via nieuwe hosts werken eenmaal; init-dispose-init geen dubbele mutatie. |
| Paneelrender verliest focus/openstate | Getypte input behoudt focus/caret, validatie rollback, detailsstate percontext. |
| Meer verbergt bestaande acties | KeyboardTab/Enter/Escape plus alle import/download/draft tests via zichtbare UI. |
| Axesselect togglet visibility | Voor/na toJSON exact gelijk; toggle wijzigt alleen juiste presentatie en niet context. |
| Selectie en keyboard conflict | Objectclick/kader/multiselect, K,pijlen/Enter/C, Delete, Ctrl+A/D/G/Z/Y, polygon/typedmetingen en dialogen blijven werken; formtoetsen niet onderschept. |
| Snapvlag verdwijnt uit opslag | True en false documenten roundtrip gelijk; punt/raster/snijpunten/previewcommit gelijk. |
| RestrictedUI bypass | Geforceerde changes en directecommands denied atomair; viewgrant zonder presentatiegrant verandert alleen sessieview; hidden source niet inspecteerbaar. |
| Resize en screen tolerance | Verschillende CSS/SVGschalen, labels/endpoints/marquee/hover/captureoutside; CSSpixel-tolerance onveranderd, geen NaN of nieuwe geometry. |
| Locks/linked multistyle | All-or-nothing met locked/deniedmembers; computedgeometry niet editable; sources/dependents blijven exact gelijk. |
| Importconfirm/undo | Annuleren behoudt doc/history/redo; succesvolle import een stap; Nieuw confirmed reset; malformed import atomair. |
| Exportui lekt | Definitieve SVG zonder overlays/goldselection; zichtbaarheid/lagen/presentatie gelijk; JSON v1-5 zonder UIvelden. |

Per submilestone tests eerst rood aantonen, minimale implementatie, volledige Node en Edge-suite. Geen tests weglaten wegens nieuwe layout; intentional UXwijzigingen aantoonbaar documenteren. Screenshotpixelverschillen beoordelen afzonderlijk van geometrygoldens. Bronsearch op pointerdown/canvas.innerHTML/engine-discovery plus runtimeprojection/commandcalls.

## 9. Goedkeuringsgate

Gevraagd besluit: plan M2c.1-4 goedkeuren met de genoemde inventarisafwijkingen en uitgestelde geometrische/nieuwe presentatie-eigenschappen. Geen productiecode nu wijzigen. Gebruiker heeft daarna expliciet alle vier submilestones tot het eindresultaat geautoriseerd. Zie M2c-REPORT.md; geen vervolgmilestone gestart.
