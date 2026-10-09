# M2b ? Permission Contract ge?mplementeerd

Datum: 9 oktober 2026. **Oordeel: M2b PASS.** Alleen M2b is uitgevoerd; M3 en M17 zijn niet gestart.

## Uitgangspunt en scope

Branch: `chatgpt/math-illustration-stabilization`. Vooraf gefetcht en lokale/remote HEAD gecontroleerd: `b4125d4defbb85f93b01b2d80cd361bb4f1c226d`. Productiecode was schoon. Het reeds aanwezige, niet-getrackte `docs/FEATURE-GAP-ANALYSIS.md` is behouden en niet meegenomen in de commits.

Normatief uitgangspunt: M2a-PERMISSION-CONTRACT.md en M2a-TEST-PLAN.md. De baseline was daadwerkelijk **162/162 Node-tests**, plus de volledige geslaagde echte Edge-suite. Geen geometrische documentversie of bestaande golden fixture is aangepast.

## Architectuur en vertrouwensgrens

`permission-runtime.js` bevat de policycompiler, de gedeelde beslislogica, het interne `authorizeCommand` en de sessie-executor. Een beperkte sessie heeft ??n private kernel in een WeakMap. Policy, actor, initial IDs, tijdens de sessie gemaakte IDs, geschiedenis, transacties en methode-events komen niet uit actor-commands of ge?mporteerde objectvelden.

De actor krijgt een frozen RuntimeSession en een gecontroleerde enginefacade. De facade exposeert geen muterende Model, rendererinstellingen, snapshots voor restore of private AuthorizedPlan. `Engine.add/update/updateMany/move/remove/duplicateMany/construct` op deze facade autoriseren opnieuw; queryresultaten zijn geen tickets. Nieuwe losse auteursengines vervangen deze kernel niet.

`PermissionEvaluator` exposeert uitsluitend adviserend canExecute/getAllowedTools/getObjectCapabilities. authorizeCommand blijft intern, zoals M2a vereist. Decisions bevatten allowed/code en geprojecteerde deniedTargets/deniedFields; generieke weigeringen geven geen verborgen objectdetails. Capabilities bieden de normatieve setGeometryFields/setPropertyFields/labelMove/reasonCodes, plus geometryFields/propertyFields als interne editoraliases.

De bestaande EditorApp blijft de enige pointercontroller en render-eigenaar. bootstrapRestrictedEditor injecteert de sessiefacade. Er is geen tweede canvas of alternatieve interactiepatch. CoordinateTransform, SnapService en InteractionResolver blijven behouden. SnapService filtert candidates met het afzonderlijke snaprecht; construct-sourcekeuze gebruikt het exacte sourceTools-recht, onafhankelijk van selecteerbaarheid.

Auteurs gebruiken AuthorCommands voor semantische object-, constructie-, metadata-, presentatie- en viewbewerkingen. Locks blijven in author-ui gelden. De standalone auteur-Engine/Model behoudt de legacysemantiek. Auteurgeschiedenis, draftopslag en de vertrouwde rollback van live auteurpreviews blijven bestaande auteurvoorzieningen; zij worden niet aan beperkte sessies gegeven.

## Afgedwongen regels

- Course en assessment: ontbrekende grants weigeren; ontbrekende/ongeldige hostcontext valt niet terug op auteur.
- Selectie en hover filteren hidden/invalid/unreadable/geweigerde objects. Locked objects blijven selecteerbaar bij een grant; direct bewerken blijft geblokkeerd.
- Translate is een eigen operatie. Een translategrant autoriseert geen absolute inspectorpatch, radiuswijziging of endpointbewerking.
- Een groep beweegt atomair, met ??n delta op vrije roots. Geselecteerde derived objects vereisen alle roots; rechten op ??n lid zijn onvoldoende. Locks, hidden/invalid leden en frozen indirect effects blokkeren de hele mutatie.
- Beschermde afgeleide geometrie mag onder follow meeberekenen. freeze en allowIndirectInvalid worden op daadwerkelijk berekende effecten gecontroleerd. Calculatorupdates mogen geen graph, stijl of labeloffsets wijzigen.
- Delete controleert de volledige cascade. Assessment initial objects kunnen niet verwijderd worden. Learners mogen derived duplicaten niet losmaken van de graph.
- Create heeft exacte toolrecepten. Alleen de executor kent IDs toe. triangle is geen alias voor willekeurige polygon; rightAngle vereist werkelijk 90?. Constructieresultaten worden door de calculator berekend. Twee tangenten vormen ??n atomaire mutatie.
- Fieldpatches zijn gesloten, met echte numerieke/boolean/stringwaarden. Gemengde grants moeten allemaal aanwezig zijn; vertices blijven even talrijk. Final-shapevalidatie gebeurt atomair, ook voor rechte hoeken.
- Parameters zijn expliciete numerieke bindings met strikte min/max/step. Een hidden helper kan via zijn binding veranderen zonder read/select/algemene geometrygrant. Ook andere schrijfroutes moeten het parameterdomein respecteren.
- Beperkte drag- en kleurpreviews blijven los van committed geometry. Preview en commit gebruiken hetzelfde resolverresultaat. Targets/fields/revision/epoch worden bij commit opnieuw gecontroleerd. Escape, blur, pointercancel, captureverlies, toolwissel, toegestaan reset, policywijziging en dispose ruimen previews op.
- RuntimeHistory bevat geen publieke snapshots. Undo/redo gebruiken eigen private entries en afzonderlijke grants. Er is geen inverse-create/deletegrant nodig voor eigen historie. Reset herstelt de gepubliceerde baseline, parameters en view; het wist geen reeds geregistreerde methode-events.
- Learner view is aparte sessiestate, geen stil gewijzigde documentpresentatie. Export vereist een formaatrecht en read-projectie. SVG bevat alleen read/display/visible/valid geometry, zonder selectie/hover/preview. JSON weigert een constructie waarvan een source niet readable is. Opaque object/style/meta-extensies worden niet als learnerdata teruggegeven.
- Load/replace, draftSave/draftResume en policy-/lock-/visibilitywijzigingen zijn via learnercommands verboden. Restricted bootstrap leest/wist geen auteursdraft. Additive learnerimport en resume worden niet stil geactiveerd.
- Committed methode-events gaan uitsluitend naar de hosthook: actor/artifact/epoch, canonieke input, revision, directe/indirecte effecten, verwijderingen, lokale digests en undo/redo-relatie. Denied/cancel/view/select maken geen documentevent. Reset en historie blijven append-only.

## Hostintegratie

De hoofd-editor blijft een auteursentrypoint. De host van een toekomstige cursus/toets moet een gepubliceerde baseline/policy kiezen en expliciet het restricted entrypoint gebruiken. Het onderstaande is een host-API, geen moduskeuze uit leerling-JSON:

```js
const {session, owner} = FZI.MathIllustration.RuntimeSession.create({
  actorId: trustedActorId,
  initialDocument: publishedGeometry,
  policy: publishedPermissionPolicy,
  assessmentKind: 'practice', // verplicht voor profile assessment
  onCommitted: hostLedgerCallback
});
FZI.MathIllustration.bootstrapRestrictedEditor({runtimeSession: session});
// Alleen de vertrouwde host houdt owner; geef dit object niet aan actoradapters.
```

De sessie biedt createCommand, canExecute, execute, getAllowedTools, getObjectCapabilities en begin/preview/commit/cancel. Parameteradapters gebruiken `parameter.set`; er is nog geen sliderfeature toegevoegd. Authoring/publicatie-UI, volledige cursus-/toetscontainers en servervalidatie behoren tot latere milestones. Policies staan buiten geometrie JSON v1/v2/v3.

## Tests-first en resultaten

De eerste twaalf nieuwe tests faalden v??r implementatie wegens ontbrekende runtime. Vervolgens zijn aanvullende rode gevallen vastgelegd voor publieke plan-/kernelomwegen, target/fieldbinding, immutable-conflicten, hidden selectie, propertytypes, dispose en atomaire rechtehoekpatches. Deze zijn opgelost zonder bestaande golden fixtures te wijzigen.

**Definitieve Node-suite: 206/206 PASS**, inclusief alle oorspronkelijke 162 en **44 nieuwe permissietests**. Commando: `node --test math-illustration/tests/*.test.cjs`.

De nieuwe Node-tests dekken de compiler, gesloten commandregister, default-deny per modus, directe facademethoden, rol-/ID-/policyspoofing, locks en visibility, source-grants, toolrecepten, properties/geometry, parameters, batches/cascades, roots/dependencies, twee tangenten, invaliditeit/herstel/freeze, history/reset, exportprojectie, readonly state, transacties/revocation, budgets, events/digests en auteurcompatibiliteit. Negatieve tests vergelijken canonical geometry, revision, IDcounter, created registry, history/cursor, epoch, events en selectie v??r/na de weigering.

**Definitieve echte Edge-suite: PASS**, inclusief alle bestaande groepen en de nieuwe permissiongroep; **geen pageErrors**. Commando: `node math-illustration/tests/browser.cjs`, Playwright met ge?nstalleerde `msedge`, geen browsermock.

De nieuwe browserproeven omvatten draftisolatie/startup, verboden tools, detached preview/commit en indirecte preview, zes annuleringsroutes, epochrevocation, denied en toegestane multiselectie, geforceerde inspector-/API-omwegen, undo/redo, bounded parameter/reset, visibility/snap/export, course/assessment, labeldrag op 760 en 1280 CSS-pixels viewportbreedte, kleurpreview/cancel/commit/history, toegestane individuele inspectorvelden, gedeeltelijk toegestane endpointvelden, locked niet-selecteerbare constructiebronnen en pointer-up buiten het canvas. De volledige auteursregressiesuite behoudt onder meer tekst, kleur, snapping, constructies, import/export, 500-objectselectie, M1 en M1.1.

## Bestanden en commits

| Commit | Inhoud |
|---|---|
| `24859c32d970ad59ff2765ae398c3c22a65d6166` | Tests-first: nieuwe permissiefixture en eerste twaalf regressietests |
| `ad445cf59bf17215740b8e596cceaba14ceeef36` | Private runtime, compiler, executor, facade, policy-snapping, uitgebreide Node-tests |
| `adad8ba1d5c7a77883836c083628e712154b12ed` | Bootstrap, bestaande controller/render/inspector, RuntimeHistory, kleurtransacties, volledige browserintegratie |
| Documentatiecommit die dit rapport toevoegt | M2b-rapport |

Gewijzigd/toegevoegd: permission-runtime.js, snap-service.js, editor-bootstrap.js, editor-history.js, editor.js, editor.html, tests/helpers.cjs, tests/permission-fixtures.cjs, tests/permissions.test.cjs, tests/browser.cjs, tests/browser-permissions.cjs en dit rapport. Broncontrole bevestigt dat er ??n pointerdown-owner en ??n canvas.innerHTML-renderpad blijft. Bestaande fixtures zijn ongewijzigd.

## Grenzen en resterende risico?s

Dit is applicatieautorisatie en API-isolatie in de browser, geen beveiliging tegen een gemanipuleerde browser. Summatieve beveiliging, actorverificatie, cryptografische bewijsketen en onafhankelijke servervalidatie blijven M17. De lokale FNV1a-digests zijn uitsluitend deterministische integriteits-/diagnostische waarden, geen veilige handtekening.

De hostcapability owner moet in de host blijven. Een host die zelf een ruimere policy publiceert, geeft daarmee bewust ruimere rechten. De evaluator/executor gebruikt bestaande geometriekernelmodules en geen DOM; een toekomstige serveradapter moet dezelfde semantiek met een eigen vertrouwde context aanroepen en onafhankelijk valideren.

Er zijn geen nieuwe course/toetscontainer, policyconfiguratie-interface, slider, objecttypen, layers/groups/templates, algemene transformaties of performanceprojecten toegevoegd. Grote commandbatches hebben expliciete budgets en gebruiken kandidaatkopie?n voor atomiciteit; dit vervangt geen latere schaalbaarheidsmilestone. Additive learnerimport/resume blijven bewust unsupported.

**Conclusie: M2b PASS voor het goedgekeurde lokale permissiecontract. Stop na M2b; handmatige acceptatie en expliciete toestemming zijn nodig voor de volgende milestone.**
