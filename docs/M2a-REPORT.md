# M2a — Rapport permissiecontract en autorisatiearchitectuur

Datum: 9 oktober 2026. **M2a PASS voor volledigheid van het ontwerp.** Dit oordeel betreft de documentatie en bestaande regressieverificatie, niet een geïmplementeerd of beveiligd permissiesysteem. M2b is niet gestart.

## 1. Branch, werkboom en verificatie

- Repository: `Geert1985/from-zero-2-infinity`; remote https://github.com/Geert1985/from-zero-2-infinity.git.
- Branch: `chatgpt/math-illustration-stabilization`.
- Lokale HEAD en via fetch bevestigde actuele remote/FETCH_HEAD: **`03d4582bd0deb429c3e05da8baa847189c7d0825`**.
- Geen tracked wijzigingen bij aanvang. Het bestaande untracked `math-illustration/docs/FEATURE-GAP-ANALYSIS.md` is behouden en wordt niet meegecommit.
- M1/M1.1 door gebruiker geaccepteerd. M1.1-inspectie omvat actuele shared hitAt, tijdelijke hover/presentation, cursor-eigenaar, movementCache/source-rootcoverage en centrale render. Geen oudere commit/testtelling overgenomen.
- Volledige Node-suite uitgevoerd: **162/162 PASS**, 0 FAIL/SKIP/CANCEL.
- Volledige bestaande echte Edge-suite uitgevoerd: **PASS**, `pageErrors=[]`, inclusief M1-kaderselectie en M1.1-visualisatie/hover/cursors/dependencies/export. Bestaande performancechecks slagen.
- Geen productiecode, nieuwe permissietests, golden fixtures, documentversie of bestaande docs gewijzigd. Nieuwe M2a-docs zijn de enige commitinhoud.

Commands: `git fetch origin chatgpt/math-illustration-stabilization`, `node --test math-illustration/tests/*.test.cjs`, `node math-illustration/tests/browser.cjs` met bestaande Playwright NODE_PATH en geïnstalleerde msedge. Volledige Node-log en Edge-JSON worden naast de opleveringsrapporten beschikbaar gemaakt.

## 2. Onderzochte bestanden en feitelijke architectuur

| Bestand | Bevinding |
|---|---|
| model.js | Private frozen object-array en detached reads; schema/numeric/style-validatie, atomic load, v1/v2/v3-migratie, openbare mutators en mutable meta/presentation/extra; locks zijn data, geen autorisatie |
| index.js | Publieke Engine met add/update/move/remove/construct/updateMany/duplicateMany/load, openbare model/renderer, screen-space selectAt en export; geen actor/policygrens |
| editor.js | Eén pointercontroller/renderpad; locks/visibility op verschillende UI-plaatsen; directe enginewrites in pointers/inspector/colors, directe renderer/meta writes, snapshots/history, import/draft/export/New |
| editor-bootstrap.js | Expliciete engine/services-injectie; standaard author startup met globale draftrestore en MI.editor/activeEngine; geen learnercontext |
| construction-service.js | Validated source refs, iterative acyclic resolve, recoverable invalidity, descendantcascade; recompute is geometrie, niet actorpermission |
| editor-history.js | Publieke entries/cursor/capture/restore/undo/redo; snapshotrestore roept engine.load aan; sessionhistory, geen method evidence |
| editor-startup.js | Eén globale author draftkey; restore voert parsed data aan engine.load; save via volledige toJSON; geen actor/artifact binding |
| coordinate-transform.js, snap-service.js, interaction-resolver.js | Gedeelde CSS/mathtransform en expliciete snap/constraintketen; candidates filteren zichtbaarheid/invalidity, geen policyselect/sourcefilter |
| rectangle-selection.js | Pure geometrische selectie/modifiers; visibility/invalidity, geen actorcapabilities |
| editor-enhancements.js, editor.css | M1.1-transiente contrastmarkering/frame; geen persistent datawijziging, cursor erft van EditorApp |
| renderer.js | Standalone documentvisibility/origin/axes/invalidity; geen toegangsprojector voor policy/read |
| editor-color.js, editor-axis-settings.js, editor-label-drag.js, editor-adaptive-grid.js | Diensten voor presentatie/coördinaat/labels; geen autorisatie-eigenaar |
| tests/*.test.cjs, tests/browser*.cjs, fixtures/ | Actuele 162 Node-tests en volledige Edge-suite; geen modespecifieke autorisatietests of serversecurityclaim |
| docs/PRODUCT-VISION.md, FEATURE-BACKLOG.md, DEVELOPMENT-ROADMAP.md, FEATURE-GAP-ANALYSIS.md, M1.1-RULES.md/M1.1-REPORT.md | Productcontext drie toepassingen, M2a/M2b-sequencing en recente geaccepteerde UX/graphsemantiek |
| index.html, course.js, widgets.js, app.js | Host laadt eigen cursus/widgets; mountGauss in widgets.js:2886 gebruikt zelfstandige SVG-widgetlogica, niet MathIllustration-runtime |
| exam.js, exam-ui.js, exam-widgets.js, exam-bank-fase1.js, store.js | Bestaande vraag/response/evaluatieflow en lokale voortgang; examGradeList (exam.js:117), renderExam (exam-ui.js:38), Redux MILESTONE_RESULT/localStorage (store.js:31/132) zijn geen geometry-commandautorisatie of trusted method ledger |

Search naar `MathIllustration`/`math-illustration` in host course/exam/widgets/app/store/index.html vond geen engine-integratie. De huidige toetsvragen en widgets bewijzen daarom niet dat dezelfde illustratie al in author/course/assessment runtimes met gedeelde rechten werkt. In de onderzochte hostmodules is geen autoritatieve geometric permission/replay-server aangetroffen. Courseadapter/assessmentadapter en server horen bij latere milestones, niet M2a.

## 3. Concrete autorisatie-omwegen in huidige code

Dit zijn bestaande, nog niet gerepareerde paden. Het permissiecontract specificeert hun toekomstige gecontroleerde adapter of weigering.

| ID | Pad / API | Omweg / gevolg | Verplichte M2b-afdekking |
|---|---|---|---|
| O01 | Engine.add/update/move/remove, index.js:105–107/131 | Geen rol, locks of fieldpermissions; direct API kan UI-locks omzeilen | Restricted facade -> typed command/evaluator; authorlegacy expliciet behouden |
| O02 | updateMany/duplicateMany/construct, index.js:90/94/99 | Atomic geometry is niet atomic authorisatie; duplicate detacht graph/unlockt; construct omzeilt toolbuttons | Hele batch/result/cascade/source gates; learner-derived detach denied |
| O03 | engine.model.add/update/remove/load/clear, model.js:135–158 | Frozen reads verhinderen niet openbare mutators | Private restricted kernel, readonly detached modelprojectie; geen writehandle |
| O04 | engine.model vervangen; engine.renderer vervangen/flags/setBounds | Rechten omzeilen of baseline/presentation vervangen | Geen public setters; typed view/doc commands; authorlegacy trusted toegang |
| O05 | model.meta/presentation/_extra/_nextId | Geen private principal/ownership; direct meta/revision/IDmanipulatie mogelijk | Runtime registry private; geen authorization uit extra/meta/IDclaims |
| O06 | EditorApp.pointerMove/commit/cancel | Object/label/group/pan livewrites; cancel gebruikt originele rawpatches | Restricted transaction branch + checked commit; cancel is private cleanup, geen authorized raw rollback |
| O07 | changeDocument(fn), editor.js:114 | Generic callback met finally-history; geen algemene atomic rollback/permissionplan | Typed commands; geen arbitrary callback aan learner; stage geheel plan |
| O08 | Inspector/color/viewClick/title/description/axes | Verspreide UI-lockguards, vrije data-edit/style fields, directe renderer/meta mutaties | Capability queries + exact fields + commitguard; exports mogen learner-meta niet eerst onbevoegd normaliseren |
| O09 | setTool/toolGrid/keyboard/constructionClick/finishPolygon/add | Toolbutton/toollabel is geen autorisatie; via API/keyboard alsnog creëren | Operation recipe + result/type/source authorization, ook keyboard/programmatic |
| O10 | selectObject/selectedIds/Ctrl+A/sidebar/hitAt/RectangleSelection/SnapService | Intrinsic visibility/invalidity maar geen read/select/sourcepolicy; Ctrl+A filtert niet alle invalidity/capabilities | Dezelfde capabilityprojectie in hover/klik/kader/lijst/cursors/snap; geen privilege via selectie |
| O11 | deleteSelection -> descendantfilter -> engine.load | Controleert geselecteerde locks, niet alle beschermde descendants | Learner deleteclosure volledig autoriseren; authorcascadelegacy expliciet |
| O12 | EditorHistory.entries/restore/undo/redo, editor-history.js | Caller-snapshot via engine.load; rechten kunnen als oude data terugkeren | Private issued historyentries/approved inverse; epoch + resetbeleid; geen publieke restoregrant |
| O13 | loadDocument/importFile/fileInput/Engine.load | Valideert documentschema, niet actor/initial provenance; arbitrary replacement | Learner replace/import denied; authorreplace blijft atomic; payloadpolicy nooit bindend |
| O14 | Bootstrap DraftStore.restore, startup.js | Global authoredraft startup kan elk beginmodel vervangen | Restricted initial hostload; geen author-draftfallback; toekomstige verified resume apart |
| O15 | Save/toJSON/toJSONString/renderSVG/download | Volledige kerneldata kan via API geëxporteerd worden ondanks UI-disabled | Public formatgrant + readprojectie; private internal snapshots afzonderlijk |
| O16 | newDocument -> draftclear + blank engine.load | Reset kan uitgangsconstructie verwijderen of storage wissen | Vooraf autoriseren; learnerreset published baseline/zelfde attempt, geen blank/loadpayload |
| O17 | MI.editor/MI.activeEngine/global classconstructors | Iedere script heeft huidige raw engine; authorcontext kan lokaal gemaakt worden | Learner globals alleen facades, geen gedeelde auteurskernel; geen securityclaim tegen DevTools |
| O18 | Host examGradeList/Redux/localStorage | Lokale eindscore/progress is manipuleerbaar; geen trusted constructionprocedure | Method/result scheiden; M17 serverinitialstate/policy/replay/ledger |

Schema-/mathvalidatie blijft noodzakelijk maar is geen autorisatie. M1.1 movementPlan controleert locks/rootcoverage als UX/geometrie, maar directe enginecalls kunnen dat nu omzeilen. Er wordt niet beweerd dat M1.1 dit beveiligingsprobleem al oplost.

## 4. Vastgelegde architectuurbeslissingen

1. Drie modes, trusted factory-bound context, default deny voor learner; author-UI en bestaande authorlegacy raw-API expliciet onderscheiden zodat bestaande documenten/API niet stil andere semantics krijgen.
2. Eén pure PermissionEvaluator plus typed CommandExecutor; capabilities/toollijsten zijn hints, commit herautoriseert.
3. Policy eigen aparte activity-envelope/revision; geen geometrie-v4, geen rol/ownership uit documentextensies of import.
4. Private restricted kernel en read-only facade/projector sluiten model/renderer/history/draft-bypasses af. Nieuwe losse authorengine verkrijgt geen toegang tot de learner-attempt.
5. Read/display/select/source/snap/translate/fieldwrite/delete/policyadministration zijn afzonderlijk; protected locked uitgangsobject kan wel source/snap zijn zonder editrecht.
6. Direct locks beschermen edit; trusted indirect calculatorupdates volgen graph. follow/freeze en indirectinvalidity worden expliciet geconfigureerd; geen client-effectlist als bewijs.
7. Alle groepsmutaties en deletecascades atomair. Geselecteerde derived krijgt geen direct patch: alle vrije roots moeten geselecteerd en allowed zijn, waarna indirect output gevalideerd wordt.
8. Parameters zijn vaste numeric bindings met grenzen/step, geen arbitrary patches; dezelfde bounds gelden ook via andere mutatieroutes op die velden. Hidden helperbinding kan toegestaan zijn zonder read/selectrecht. Geen slider UI geïmplementeerd.
9. Learner-history is private issued transitions; undo vereist expliciete undogrant maar geen losse deletegrant voor undo van eigen create. Policyepochwissel invalideert history/transacties. Reset herstelt trusted baseline en wist serverbewijs niet.
10. Course additive import/resume/draftsave zijn nog niet geregistreerd in M2b; enable-config wordt UNSUPPORTED_POLICY. Assessmentimport is hard verboden. Geen fallback naar authorloader.
11. Public learner export heeft eigen formaatgrant/readprojectie; niet-readable constructsources blokkeren JSON-export in plaats van stil flattenen/leaken. Author volledige legacyroundtrip blijft intact.
12. Een geslaagd semantisch command kan een canonical event leveren. Snapshots/pointerevents/client-score zijn geen methodebewijs. M17 valideert dezelfde operations onafhankelijk vanaf eigen frozen baseline/policy/version.

Definitieve matrix, interfaces, priority/denialcodes, typed field/toolregister, transactions en acceptatiecriteria staan in [M2a-PERMISSION-CONTRACT.md](M2a-PERMISSION-CONTRACT.md). Concrete unit/integratie/browser/server-negatieven staan in [M2a-TEST-PLAN.md](M2a-TEST-PLAN.md). Ze zijn ontworpen, nog niet geïmplementeerd/uitgevoerd als permissiontests.

## 5. Ontwerpvragen, risico's en afhankelijkheden

**Geen fundamentele M2b-autorisatiekeuze blijft open.** De contractdefaults/ceilings en actor-/dependency-/historysemantiek zijn vastgelegd. Welke punten/tools/parametergrenzen een concrete auteur wil toestaan is activiteitconfiguratie, geen ad-hoc beslissing van M2b. Onderstaande latere vragen mogen M2b niet tot permissieve fallbacks leiden:

| Onderwerp | Status / veilige huidige beslissing | Latere afhankelijkheid |
|---|---|---|
| Course/toets hosting / meerdere runtimes | Nu geen gedeelde embedding; M2b maakt controleerbare sessiefacade, geen productintegratie | M13/M16 |
| Secure actor/auth/sessiontransport en signed checkpoints | Browserclaims onbetrouwbaar; geen secure summative release | M17 |
| Procedurecredit/equivalenties/tolerances/replayretentie | Canonical semantic eventcontract, nog geen scoringclaim | M4/M16/M17 |
| Graph reconnect/topology/stable vertexrefs | Learner unsupported/deny; bestaande refs validate; geen herindexeer-escalatie | M4/M5 |
| Persistent groups/layers/templates | Unsupported; geen rights-inheritance of gedeeltelijke mutation | M3/M18 |
| Additive courseimport en resume | Expliciet niet geregistreerd, enableconfig refused | Nieuwe approved adaptermilestone |
| Sliders/animations/dynamische parameters | Numeric fieldbindings gespecificeerd; geen nieuwe UI/objecttypes | M13/M14 |
| Author-legacy mutators | Historisch trusted, niet restricted; private learnerfacade moet echt losstaan | M2b facade-inventorytests |
| Huidige live-preview en publieke historysnapshots | Geen learnerreuse zonder transaction/private-historyguard | M2b integratiestap |
| Read/display en hidden secrets | Projection is UX/API hygiene; al geleverde browserdata is niet geheim | M17 serverdataminimalisatie |
| Verschil authorcascade en learnercascade | Expliciet compatibiliteitsprofiel, negative tests voorkomen rolemisbruik | M2b regressionpoort |

Geen externe securitybron of commerciële recommendation nodig: dit ontwerp is op lokale repository en productvereisten gebaseerd. Er is geen claim dat een readonly JS-object een beveiligde browsergrens oplevert.

## 6. Advies en kleine implementatiestappen voor M2b

M2b alleen starten na expliciete goedkeuring. Voorgestelde afzonderlijk testbare commits:

1. Closed policy compiler, mode/operation/field/toolregister en pure evaluator; alle matrixnegatieven red→green. Geen UI-first permissiechecks.
2. Restricted RuntimeSession/facade met private kernel/readprojectie en atomic commandplanner; directe engine/model/renderer/duplicate/cascade/schema-escalatietests. Authorlegacy blijft buiten restricted raw-access.
3. Private transaction/history/epoch guards en canonical eventhook; preview/cancel/undo/reset tests; learnerdraft/importfailclosed en format-exportgates.
4. Bestaande editoradapter migreert huidige callers naar semantic dispatch, bestaande één pointercontroller/renderpad behouden; M1.1 hover/cursors/selection delen capabilities; geen nieuwe slider/hostcourseframework.
5. Volledige actuele Node+Edge regressies, public-API denyinventory, authorcompat/goldens en negatieve browserproeven; rapport PASS/FAIL en stop. Geen implementatie van M3/M17 mee laten glijden.

Een incomplete commandgrens of onbeveiligde raw state op een restricted facade betekent M2b FAIL, ook als alle knoppen disabled zijn. Unsupported futureoperator betekent geen ontwerpvrijheid om alsnog load of unrestricted update te gebruiken.

## 7. Oplevering en oordeel

Uitsluitend nieuw: `docs/M2a-PERMISSION-CONTRACT.md`, `docs/M2a-TEST-PLAN.md`, `docs/M2a-REPORT.md`. De documentatiecommit en remote push-HEAD worden bij de oplevering vermeld; dit rapport bevat geen fictieve self-referential commithash.

Completeness check: alle gevraagde inspectiebestanden en M1.1 onderzocht; drie toepassingen/matrix beschreven; publieke bypasses geïnventariseerd; interfaces/trust/ownership/locks/direct-versus-indirect/atomicity/undo/reset/import/export/method-evidence/compatibiliteit expliciet; negatieve tests inclusief expected denials ontworpen; bestaande suites groen; geen productie- of fixturewijziging.

**M2a PASS. Alleen ontwerp en verificatie. Stop na documentatiecommit/push; begin niet aan M2b zonder expliciete goedkeuring.**
