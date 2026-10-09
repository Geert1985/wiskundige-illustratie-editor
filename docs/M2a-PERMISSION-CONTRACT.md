# M2a — Permission Contract

Datum: 2026-10-09. Contractversie: 1. Ontwerp, geen huidige implementatie. Uitgangspunt: stabilisatiebranch HEAD `03d4582bd0deb429c3e05da8baa847189c7d0825`. M2a verandert geen productiecode of documentversie.

Normatieve woorden: **MOET**, **MAG NIET**, **WEIGER**. Dit contract beslist de autorisatiesemantiek voor M2b. Een toegestane actie moet bovendien mathematisch geldig en door het huidige runtime-register ondersteund zijn.

## 1. Grenzen en architectuur

```text
Vertrouwde activiteitseigenaar / later server
  -> gepubliceerd initialDocument + policy + revision
  -> RuntimeSession (gebonden principal, mode, artifact, epoch)
       -> PermissionEvaluator (één pure beslisfunctie)
       -> CommandExecutor (normaliseren, plannen, autoriseren, atomaire commit)
            -> private geometriekernel + bestaande ConstructionService
       -> gecontroleerde Engine-facade / gefilterde read-projectie
       -> editor/cursus/toets-adapter (capabilities als UX, geen tweede regels)
```

De geometriekernel blijft schema/geometrie valideren. De commandgrens bepaalt of een geldige operatie is toegestaan. Toolbar, inspector, M1/M1.1-hit/hover/kaderselectie, pointercontroller, keyboard, draft/history en directe engine-facade gebruiken dezelfde evaluator en commandregistratie. Een disabled knop, lock of bevroren object-array vervangt die grens niet.

CommandExecutor is de enige schrijver van een **restricted** sessie. Een publieke model- of rendererreferentie mag zijn kernel niet blootleggen. M2b moet daarvoor state in een private closure/private fields bewaren en een readonly, detached projectie aanbieden. Geen framework-/ES-modulemigratie nodig. Een losse IllustrationModel blijft een geometrische bouwsteen; zelf zo'n model aanmaken geeft geen toegang tot de kern van een bestaande restricted sessie.

### Vertrouwensgrenzen

1. **Auteur** is vertrouwde configuratie-eigenaar. Hij kan activiteitspolicies maken, valideren en nieuwe revisies publiceren. Zijn eigen bewerkingssessie blijft auteur; het kiezen van leerlingrechten verlaagt zijn eigen rechten niet. Een learner-preview is een afzonderlijke sessie met een kopie van initialDocument.
2. **Cursus/oefentoetsbrowser** dwingt gedrag af voor de applicatie en voorkomt normale API/UI-omwegen. JavaScript, lokale bestanden, globals, DevTools en localStorage zijn geen beveiligde omgeving. Een gebruiker kan een eigen losse auteursengine maken; die mag niet als de geldige learner-session/attempt worden geaccepteerd.
3. **Summatieve toets** is pas betrouwbaar met M17: server bezit initialDocument, policy, actor/attempt, versies en commandvolgorde en valideert onafhankelijk. Een lokale uitkomst of clientlog is geen betrouwbaar methodebewijs.

Geen rol/modus wordt afgeleid uit objectdata, import, URL-query, eventtype of localStorage. Rol/beleid worden uitsluitend bij de vertrouwde hostfactory gebonden. Een ontbrekende of ongeldige context op een cursus/toets-entrypoint leidt tot weigering, nooit terugval naar auteur. De bestaande auteurseditor-entrypoint blijft bewust auteur; dit is geen veilige generieke learner-bootstrap.

## 2. Staat gescheiden houden

| Staat | Eigenaar | Vertrouwd voor autorisatie? |
|---|---|---|
| Geometriedocument v1/v2/v3: objecten, graph, stijl, locks, visibility | Auteur/kernel | Alleen het vertrouwd geladen initialDocument plus goedgekeurde commandstate |
| Selectie, hover, cursors, actieve tool, preview | Editoradapter | Nee; tijdelijke UX-state |
| Activiteitsconfiguratie: policy, parameters, startdocumentbinding | Vertrouwde auteur/host | Ja, na schemavalidatie en revision-binding |
| Oefentoets: allowed tools, initial protections, history/evidencebeleid | Auteur/host | Ja voor lokaal gedrag; niet als beveiligd bewijs |
| Summatieve attempt, actor, policyrevision, commandledger | M17-server | Ja, serverautoritatief |
| object.createdBy, document.permissions, document.mode, ingevoerde role | Onvertrouwde documentextensies | Nee, ook niet als ze in author-roundtrip worden behouden |

Een activiteit bewaart `initialDocument` naast `permissionPolicy`, niet als impliciete nieuwe geometrievelden. Gebruik een afzonderlijke activity-envelope met `activitySchema:1`, `activityId`, `revision`, `initialDocument`, `permissionPolicy`; de identifier van de policy is geen authenticatiemiddel. M2b behoeft geen v4-geometriedocument. Onbekende geometrie-extensies blijven in auteur-roundtrip behouden, maar worden nooit tot rechten of ownership gepromoveerd.

## 3. Definitieve modus-/operatiematrix

**A** = toegestaan in auteur, met onderstaande lock-/APIcompatibiliteit. **G** = uitsluitend expliciete grant én geldige ondersteunde operatie; ontbreken = weigering. **N** = mode ceiling, niet met een objectgrant te overrulen. Course en assessment defaults geven geen mutatierechten. Assessment heeft bovendien immutable uitgangsvelden en een expliciet toolregister.

| Semantische operatie | Auteur | Cursus | Toets (practice / summative) |
|---|---|---|---|
| Object lezen/tonen | A; valid canvasgeometrie | G; zichtbare projectie | G; geen antwoord-/policygeheimen naar client |
| Selecteren/hover/highlight op canvas | A; visible+valid, ook locked | G, visible+valid | G, visible+valid |
| Selecteren in objectlijst | A, ook hidden/invalid voor beheer | G, alleen zichtbare beschikbare objecten | G, alleen zichtbare beschikbare objecten |
| Object rigide verplaatsen | A volgens UI-locks/graph | G: object.translate | G: object.translate + geen frozen initial field |
| Eindpunt/vertex/coördinaten/radius wijzigen | A volgens locks/derived-regels | G: object.setGeometry met exacte veldgrants | Default N; alleen expliciete, scoped G zonder frozen fields |
| Stijl/naam/tekst/meetpresentatie/labeloffset wijzigen | A volgens bestaande locks | G: object.setProperties per veld | Default N; expliciete veldgrants mogelijk, afzonderlijk van geometrie |
| Object maken | A, geldige huidige tool | G: tool + created-class + budget | Alleen G in expliciete allowedTools |
| Constructie maken | A, geldige bronnen | G: tool + source-capabilities | G volgens allowedTools + source-capabilities |
| Dupliceren | A, ook locked bron; bestaande detached copy | G: duplicate én create-resulttype; derived-detach N | Default N; dezelfde gates bij G, derived-detach N |
| Verwijderen | A, directe UI-locks blijven; zie cascadebeleid | G op **gehele verwijderclosure** | G op gehele closure; fixed initial deletion N |
| Parameter/sliderwaarde | Alleen geregistreerde bestaande binding | G: parameter.set met bounds/binding | G: dezelfde bounds, geen frozen targets |
| Undo / redo | A; sessiegeschiedenis | Afzonderlijke G per undo/redo | Beide expliciet; serverledger blijft append-only |
| JSON replace/import via load | A, bestaande atomische load | N | N |
| Additieve objectimport | Niet nodig voor bestaande replace-UX | Default verboden; toekomstige expliciete G + creatierechten per object, zie §9 | N, ook in practice |
| SVG-/JSON-export | A, bestaande volledige auteur-export | Afzonderlijke expliciete G per formaat | Afzonderlijke expliciete G; nooit policy/answer secrets |
| Document resetten | A: bestaande Nieuw | G: terug naar published initialDocument | G: terug naar published initialDocument, geen nieuw attempt |
| Draft save/restore | A: bestaande DraftStore | Alleen expliciete veilige resume/save adapter, geen globale authoredraft | Alleen expliciete veilige resume/save adapter; geen globale authoredraft |
| Pan/zoom | A, bestaande grenzen | Expliciete view.pan/view.zoom G, alleen sessieview | Zelfde; view geen methodebewijs |
| Persistente assen/grid/background/meta wijzigen | A, bestaande regels | G per documentveld; defaults deny | Defaults deny; expliciete G zonder frozen fields |
| Eigen view wijzigen zonder documentmutatie | A | G: view.configure, geen reveal of invariantomzeiling | G: view.configure, geen reveal |
| Objectlock/author visibility wijzigen | A; locks zijn auteursbediening | N | N |
| Graphrefs/kind/tak/topologie reconnect/detach | Author huidige updatecompatibiliteit | N in M2b; alleen nieuwe expliciete constructie | N in M2b; toekomstige operator vereist eigen contract |
| Policy aanpassen / role wijzigen / baseline vervangen | A via ActivityAuthoringContext, niet documentpatch | N | N |

Een practice-toets mag ruimere **expliciete** tools/history/export/resetgrants hebben, maar import of policywijziging wordt er niet stil toegestaan. Summative gebruikt dezelfde operatiesemantiek; alleen host/servertrust en registratie verschillen. `assessmentKind` is een vertrouwd hostveld, geen client-toggle.

### Auteurscompatibiliteit en bestaande locks

- Een **author-ui** command honoreert de bestaande lockbediening: directe geometrie/stijl/labelbewerking en verwijderen van geselecteerde locked objecten worden geweigerd. Locked objecten blijven selecteerbaar en duplicatie van een locked bron blijft toegestaan. Auteur kan visibility en locks beheren zoals nu.
- De bestaande standalone `new Engine(...)`/IllustrationModel zijn momenteel vertrouwde, onbeveiligde auteur-API's. Hun bestaande `update/load/remove/model`-semantiek (waaronder advisory locks) wordt **alleen in author-legacy-api** behouden. Dit expliciete compatibiliteitsprofiel wordt door een vertrouwde auteursfactory gekozen; nooit via learner-commanddata. Het is geen learner-autorisatiegrens.
- De auteurseditor gaat semantische UI-commands gebruiken, niet legacy raw-patches als verkapte learner-commands. Lockregels staan in de evaluator voor dit commandprofiel. Legacy en UI zijn bewust verschillende interfaces, geen verborgen DOM-afhankelijke beslissing. Directe aanroepen op een **restricted engine** gebruiken altijd de learner-bound context en kunnen nooit naar legacy overschakelen.
- Bestaande author-deletecascade kan ook een niet-geselecteerd locked afgeleid object verwijderen. Voor backward compatibility blijft dit in author-profielen mogelijk; de delete-preview vermeldt de cascade. Cursus/toets eisen delete-permissie en geen lock voor elk verwijderd lid. Deze expliciete uitzondering is geen grant voor learnercascade.
- Author undo mag bestaande locks/presentatie terugzetten volgens zijn oude historygedrag. Learner history gebruikt §8; er is geen algemene snapshot-loadgrant.

## 4. Policy v1: gesloten declaratief schema

Geen JavaScriptpredicates, eval, wildcard-regexvelden of willekeurige functies. Onbekende keys/operations/velden/profiles geven `INVALID_POLICY` of `UNSUPPORTED_POLICY`, nooit permissieve fallback. Alle niet-auteurprofielen zijn default-deny.

Normatieve structuur (beschrijving, nog geen geserialiseerde productie-API):

```text
PermissionPolicyV1 = {
  schema: 1,
  activityId, revision,
  profile: course | assessment,
  defaultCapabilities: Partial<ObjectRule>,
  initialObjectRules: Map<existingObjectId, Partial<ObjectRule>>,
  createdObjectRules: Map<supportedResultType, Partial<ObjectRule>>,
  allowedTools: exact ToolId[],
  document: {
    undo, redo, reset, draftSave, draftResume,
    exportSVG, exportJSON, pan, zoom, viewConfigure,
    setMetaFields: FieldPath[], setPresentationFields: FieldPath[]
  },
  parameters: Map<parameterId, {
    targets: exact numeric FieldBinding[], min, max, step?, initialValue
  }>,
  limits: {maxObjects, maxCommandBytes, maxBatchObjects, maxDependencyDepth}
}
ObjectRule = {
  read, display, selectCanvas, selectList, translate, duplicate, delete,
  geometryFields: FieldPath[], propertyFields: FieldPath[],
  sourceTools: exact ToolId[], snap,
  immutableFields: FieldPath[],
  indirectGeometry: follow | freeze,
  allowIndirectInvalid: boolean
}
```

Alle ontbrekende booleans en lijsten betekenen false/leeg. Afwijkingen: `indirectGeometry` default `follow` omdat een bestaande dependency-update geen nieuwe directe mutatie is; `allowIndirectInvalid` default true in course, false in assessment. Dit is structurele resolutiesemantiek, geen toestemming om rechtstreeks een afgeleid object te patchen. Budgetvelden zijn verplicht, positieve eindige integers; maxCommandBytes telt UTF-8 payload. De host kiest bij nieuwe learner-activiteiten expliciet ten minste `maxObjects=1000`, `maxCommandBytes=65536`, `maxBatchObjects=1000`, `maxDependencyDepth=256`; bestaande authorlimieten worden hierdoor niet veranderd. Hogere/lagere gepubliceerde limieten zijn mogelijk als de host ze accepteert.

FieldBinding is exact `{objectId:string, fieldPath:string}`; geen offset/scale/expressionfunctie. activityId/revision/actorId zijn niet-lege strings uit de host. Documentrevision/epoch zijn niet-negatieve safe integers, monotonisch door executor beheerd. Caps zijn echte booleans; lists bevatten unieke geregistreerde strings; policyrecords zijn plain records zonder prototypekeys. Parameters hebben eindige min<=max, optionele eindige step>0 en een eindige initialValue. Mapkeys zijn expliciet gevalideerde IDs, niet objectprototype-indexering. Het hele policy/baseline-paar moet valideren voordat learnercallbacks beschikbaar zijn.

Grants: initial overrides vervangen alleen expliciet genoemde defaults; createdObjectRules geldt uitsluitend voor runtime-geregistreerde, in deze sessie gemaakte objecten. Geen automatische inheritance van bronrechten. Ieder enabled create-/constructrecept vereist een createdObjectRules-entry voor zijn resultaattypen met read/display=true; anders INVALID_POLICY. Een constructrecept vereist niet daarnaast het onafhankelijke vrije create-toolrecht voor dat type. Created-object-grants gelden niet retrospectief voor initial objects. `immutableFields` is de unie van defaults en overrides; een override kan de unie niet verkleinen. Deze velden blokkeren directe writes/parameterbindings. Calculator-outputgeometry onder follow is de expliciete indirecte uitzondering; freeze blokkeert ook die verandering. Niet-outputvelden blijven ook indirect immutable. Mode ceiling, ontbrekende references, immutable fields en intrinsic locks gaan altijd vóór grants. In deze v1 zijn geen algemene allow/deny-regellijsten: een override-false is een expliciete weigering, er is één effectieve ObjectRule per object. Display/select/source/snap hebben steeds een effectieve read-grant nodig; zonder read is de desbetreffende capability false, niet alsnog een writeright. Een display-grant zet authored visible=false nooit aan.

Ownership/baselineklasse komt uit de private sessieregistratie: oorspronkelijke ID-set versus tijdens deze attempt toegekende IDs. `createdBy`/`locked:false`/policyvelden in JSON krijgen die status niet. ID's worden door executor toegekend; clients mogen geen initial ID overschrijven of user-created status claimen. Redo herstelt dezelfde geregistreerde IDs. Reset wist de created-registry.

### Assessment uitgangsconstructie

De policycompiler materialiseert voor **elk initial object** delete=false, graph/identity/author-state immutable en geometry immutable. Initial delete:true is INVALID_POLICY in assessment: deletegrants daar zijn voor toegestane learner-created objecten, niet voor de uitgangsconstructie. Alleen expliciet `translate:true` of geometryFields/parameterbindings voor een benoemd initial object maken precies de benodigde **directe** geometrievelden mutable bij compile. Globale default mutationgrants die assessment-initial geometry zouden vrijgeven zijn INVALID_POLICY; gebruik benoemde initialObjectRules of bindings. Een expliciet opgegeven immutableField kan nooit zo worden verwijderd: conflicterende configuratie wordt geweigerd. Afgeleide geometrie wordt niet als direct patchbaar vrijgegeven; `follow` of `freeze` bepaalt haar indirect gedrag. Auteur kiest movable initial objects daarmee expliciet, zonder dat een globale created-rule ze vrijgeeft.

Alle initial constructs moeten geldig zijn bij learner-start. Ontbrekende refs, cycles, inconsistent baseline/policy en ongeldige initial geometry verhinderen startup; author kan zulke documenten blijven onderzoeken. Geometrydegeneracy tijdens een toegestane manipulatie volgt de expliciete indirect-validitypolicy hieronder.

### Veld-/toolregister

- Identity `id/type`, graph `construction.*`, ownership, `constructionValid`, mode/policy, prototypekeys zijn niet user-patchbaar in learnercontext, ook niet via propertyFields.
- Geometryvelden zijn de bestaande x/y, x1/y1/x2/y2, cx/cy/r en benoemde vertices[i].x/y; bestaande objectvalidatie blijft verplicht. Wijzigen van vertexaantal is topologie en wordt in M2b geweigerd.
- Policy wordt pas na de bestaande geometrie/migratievalidatie gecompileerd; objectIDs zijn de genormaliseerde strings uit die baseline. Dubbele/ontbrekende policyreferenties of type-incompatibele object-/parameterbindings zijn INVALID_POLICY. Defaults met geregistreerde veldnamen worden op de velden van het betreffende type geïntersecteerd; een expliciete objectoverride met een niet-bestaand veld wordt geweigerd.
- Propertyvelden zijn de bestaande name/text/rotation, label-offsets, label/measurementflags/text en style-leafvelden die kernel registreert. `locked` en `visible` zijn geen gewone learner-propertyvelden. Geen brede `style.*` of extensie-whitelist. Een gemengd patch wordt volledig geweigerd als één veld niet toegestaan is.
- Huidige ToolIds zijn `create:point`, `create:line`, `create:straight`, `create:ray`, `create:vector`, `create:circle`, `create:text`, `create:polygon`, `create:triangle`, `create:dimension`, `create:angle`, `create:rightAngle`, en `construct:midpoint`, `construct:perpendicular`, `construct:parallel`, `construct:perpendicularBisector`, `construct:bisector`, `construct:tangent`, `construct:area`, `construct:perimeter`.
- ToolId is een gevalideerd recept: triangle vereist drie geldige vertices; rightAngle vereist 90° volgens bestaande validatie. Een client-toolId bewijst geen muisprocedure. Engine.add van polygon normaliseert naar create:polygon, nooit automatisch een toegestaan triangle-recept. Construct-tools vereisen geldige graphrefs en hun bestaande resultaattypen/takken. Twee tangentresultaten worden één atomair command.
- Snap/construct-source zijn aparte capabilities. Een read/display/snap toegestaan maar niet-selecteerbaar locked uitgangspunt kan snaptarget zijn; `sourceTools` moet de exacte constructie toestaan. Direct gebruik als source vereist visible+valid+read; hidden helpers mogen alleen via bestaande graphresolutie intern meedoen. SnapService mag geen onzichtbare of policy-geweigerde candidates/IDs teruggeven.
- Create-recepten bepalen hun verplichte geometry/text-input; caller mag geen IDs, ownership, policy, locks, visibility of arbitrary extensions toevoegen. Initiële stijl/namen komen uit vertrouwde tooldefaults; optionele caller-style/name/labelvelden vereisen dezelfde expliciete property-fieldgrants voor de created-class. construct-resultgeometry komt uitsluitend van de calculator. Geen create als omweg om beschermde metadata/velden mee te geven.
- Parameters zijn numerieke bindings op bestaande vrije geometrievelden, nooit willekeurige patches. `parameter.set` autoriseert de binding als geheel, niet het recht om die velden vrij in de inspector te bewerken. Targets moeten bestaan, unlocked en niet immutable zijn. Een expliciet gebonden hidden helper is toegestaan: dit geeft alleen het benoemde bounded parameterrecht, geen read/select/translate-recht op dat object. Afgeleide outputvelden, vertexaantal, strings en willekeurige functies zijn verboden bindings. Min/max zijn inclusief en strikt; geen clamp: buiten bereik, NaN/Infinity of off-step wordt geweigerd. Stepgrid: k=round((value-min)/step), expected=min+k*step, afwijking maximaal min(step*1e-6, 32*Number.EPSILON*max(1,abs(value),abs(min))); dit is geen geometrische evaluatietolerance. Payloadwaarden moeten echte eindige numbers zijn, geen numeric-stringcoercion. Domein/step gelden ook wanneer een anderszins geautoriseerd translate/setGeometry-command datzelfde gebonden veld verandert: geen omweg rond de parametergrenzen. Overlappende parameterbindings op hetzelfde veld zijn INVALID_POLICY. Alle targets committen atomair. Parametergrant is de aanwezigheid van een geldige binding; niet daarnaast een algemene geometryFields-grant. InitialValue moet bij initialDocument passen. In assessment compile maakt deze expliciete binding uitsluitend die numerieke inputvelden mutable, tenzij een expliciet immutableField ermee conflicteert.

## 5. Definitieve interfaces

### Pure kernelonafhankelijke evaluator

```text
PermissionEvaluator.canExecute(command, trustedContext) -> Decision
PermissionEvaluator.authorizeCommand(command, trustedContext) -> AuthorizedPlan | PermissionError
PermissionEvaluator.getAllowedTools(trustedContext) -> ToolCapability[]
PermissionEvaluator.getObjectCapabilities(objectId, trustedContext) -> ObjectCapabilities
```

`trustedContext` is een door host/executor geconstrueerde readonly waarde: actorId, profile, assessmentKind?, activityId/revision, policyRevision, epoch, documentRevision, compiledPolicy, authoritative baseline/created registry, state/projector/operation registry. De pure evaluator kan op server dezelfde semantiek gebruiken; publieke browsercalls mogen zulke velden niet als override invullen.

```text
RuntimeSession.canExecute(command) -> Decision
RuntimeSession.execute(command) -> CommandResult
RuntimeSession.getAllowedTools() -> ToolCapability[]
RuntimeSession.getObjectCapabilities(id) -> ObjectCapabilities
RuntimeSession.begin(command) -> opaque TransactionHandle
RuntimeSession.preview(handle, newPayload) -> PreviewResult
RuntimeSession.commit(handle, finalPayload) -> CommandResult
RuntimeSession.cancel(handle) -> void
```

De sessie bindt zelf context/policy; `execute(command, arbitraryPolicy)` bestaat niet. `authorizeCommand` is intern: de actor kan geen serialized allow-ticket aan een engine toevoegen. Query-Decision is adviserend en mag geen commit autoriseren.

Commands hebben `schema:1`, `operation`, `payload`, `expectedDocumentRevision`; id/sequence worden door runtime vastgesteld. Payloads zijn gesloten per operation. `origin` (pointer/keyboard/api/import) mag alleen diagnostiek zijn. Actor/role/policy/effectlist/ownership/fromHistory/inverse mogen nooit uit payload komen.

Mutatie-IDlijsten zijn niet-leeg, uniek en verwijzen naar genormaliseerde string-IDs; doublures worden INVALID_COMMAND, niet tweemaal uitgevoerd. Selectie mag leeg zijn en dedupliceert. Source-reflijsten behouden de mathematische betekenis/volgorde van het bestaande constructrecept (een mathematisch geoorloofde herhaalde source is niet automatisch een IDlijstfout).

| Operation | Payload / effect |
|---|---|
| object.select | ids, source canvas/list; gefilterde selectie, geen documentmutatie |
| object.translate | ids, één mathematische delta; planner berekent roots/closure |
| object.setGeometry | id, exacte geometry field-value lijst; geen generieke graphpatch |
| object.setProperties | ids, exacte property field-value lijst |
| object.setLock / object.setVisibility | ids, boolean; uitsluitend author-ui/author-legacy-api |
| object.create | toolId, gevalideerde primitieve geometry/style volgens allowed recipe |
| construction.create | toolId, bestaande source refs; resultaten executor-berekend |
| object.duplicate | ids, delta; gates op bron én resultaattypen; learner derived-detach verboden |
| object.delete | ids; volledige cascade door planner, niet caller-effectlijst |
| parameter.set | parameterId, value; binding komt uit compiledPolicy |
| history.undo / history.redo | geen caller-snapshot; één private goedgekeurde entry |
| document.reset | geen caller-document; gepubliceerde initial snapshot |
| document.setMeta / document.setPresentation | exacte geregistreerde velden; geen object/policydata |
| document.exportSVG / document.exportJSON | geen raw kernel; goedgekeurde read-projectie |
| view.pan / view.zoom / view.configure | viewstate; geen geometrische invariant- of revealmutatie |
| document.draftSave / document.draftResume | gescopete gevalideerde sessiestate, §9 |
| policy.configure | uitsluitend vertrouwde ActivityAuthoringContext; geen learner-sessioncommand |

`Decision = {allowed, code, deniedTargets, deniedFields}`; generieke actorfouten bevatten geen verborgen objectdetails. Codes: ALLOWED, PERMISSION_DENIED, MODE_DENIED, LOCKED, IMMUTABLE_FIELD, OBJECT_NOT_AVAILABLE, MISSING_SOURCE_PERMISSION, INCOMPLETE_GROUP, CASCADE_DENIED, INDIRECT_FROZEN, WOULD_INVALIDATE, OUT_OF_RANGE, INVALID_COMMAND, INVALID_POLICY, UNSUPPORTED_COMMAND, UNSUPPORTED_POLICY, STALE_TRANSACTION, UNTRUSTED_HISTORY. De volgorde is deterministisch: schema/register/context -> mode -> references -> grants/locks/frozen/bounds -> berekende effecten -> revisioncheck. Geen partial success.

Publieke Decision/CommandResult worden geprojecteerd: geen onbekende/unreadable descendant-IDs of raw private diff teruggeven; deniedTargets omvat hoogstens actor-aangeleverde/beschikbare IDs. CommandResult heeft status/commandId/documentRevision en readable create/result IDs/projectie. De volledige berekende effects/ledger gaan uitsluitend naar de vertrouwde executor/hosthook, niet een publieke export- of windowevent met raw engine. Dit is API-isolatie, geen claim dat de browser vertrouwelijke gegevens kan bewaren.

ObjectCapabilities bevatten read/display/selectCanvas/selectList/translate/setGeometryFields/setPropertyFields/delete/duplicate/sourceTools/snap/labelMove plus reasonCodes. **Capabilities zijn geen tickets.** Toolresultaat bevat enabled/reason; niet ondersteunde tools zijn absent of disabled, nooit uitvoerbaar. Group eligibility is één canExecute(object.translate) op de volledige set; geen simpele OR van memberrechten. M1.1-cursor gebruikt precies die beslissing.

### Directe engine-facade

Een restricted Engine-facade houdt source-compatible methoden waar veilig:

- move -> object.translate; add -> toolrecept afgeleid uit resultaat/type; construct -> construction.create; remove -> object.delete; duplicateMany -> object.duplicate. Restricted add met een caller-construction/afgeleid resultaat wordt INVALID_COMMAND; gebruik construct zodat kind/sources/results via de calculator worden geautoriseerd, niet een raw object met constructietag.
- update classificeert elk veld als geometry/properties; updateMany is een atomair samengesteld plan. Een movegrant impliceert **geen** setGeometry-grant. Gemengde patch moet alle deelrechten hebben. Unknown/graph/policyfields worden geweigerd.
- load/replace/clear zijn in restrictedcontext verboden. document.reset is geen clear/load van callerdata.
- get/all/model.objects/selectAt render/readen slechts volgens read/display/select/sourcecapabilities. Geen mutable meta/presentation, muterende modelmethoden of setter voor model/renderer in restrictedcontext. toJSON/toJSONString/renderSVG zijn public exportoperaties en eisen overeenkomstige exportgrant; intern history/planning gebruikt een private snapshotreader, niet de publieke exportmethode.
- Mutable rendererflags en setBounds gaan via view/document-commands; de facade biedt een readonly rendererprojectie. Engine-methoden mogen niet via private kernel-API's om de grens heen publiceren.

Author-legacy-api behoudt historische trusted-kernel toegang; deze is niet beschikbaar via de restricted facade. De host geeft aan learner-adapters geen referentie naar de originale auteursengine of dezelfde mutable state. MI.activeEngine/MI.editor mogen in learner-entrypoints hoogstens gecontroleerde facades bevatten. Geen beveiligingsclaim tegen een volledig gemanipuleerde browser.

## 6. Autoriseren, preview en commit

1. Normalizeer via commandregister, controleer context/schema/mode en documentrevision.
2. Plan op een detached kandidaatstate. Bepaal directe targets/velden, sourcegebruik, cascade, create-resultaten, budgets en indirecte graphclosure zelf.
3. Controleer grants, locks, immutable fields en groups. Resolve met bestaande ConstructionService; bepaal actual diff, validity en indirecte effecten.
4. Controleer alle effecten en policy/epoch/documentrevision opnieuw. Wissel kernelstate atomair, of weiger zonder wijzigingen.
5. Pas alleen na geslaagde commit history, created registry, event/evidence en panels toe. Model, rendererstate, selectie, historycursor, ID-allocation en policy blijven ongewijzigd bij weigering; toegestane statusmelding mag veranderen.

Begin/preview maken geen autorisatieticket voor later. Een preview mag uitsluitend een detached kandidaat of geregistreerde gecontroleerde transient branch wijzigen; de committed kernel blijft ongewijzigd in restrictedcontext. De author bestaande live-preview kan tijdens migratie behouden blijven, maar niet hergebruikt worden als onbeveiligde learner-engine-write. Eén bestaande pointercontroller en centraal renderpad blijven eigenaar. commit gebruikt het laatste gevalideerde resolverresultaat; herautorisatie mag weigeren, nooit opnieuw snappen of een andere geometrie stil committen.

TransactionHandle is niet serializeerbaar als recht: alleen de private sessie kent hem, gebonden aan actor, basisrevision, policyepoch en toegestane operation. Andere actor/engine, verlopen handle, andere targets/operation of vervalste finalPayload worden geweigerd. Policy/role/epochwijziging, toolwisseling, Escape/pointercancel/blur/captureverlies, een toegestaan Nieuw/reset en dispose annuleren de handle. Een geweigerde reset/import mutatie verandert de bestaande transactie niet. Cancel verwijdert preview en herstelt UX-state; het is geen publieke inversepatch met extra rechten. Geen ghost history/evidence.

## 7. Locks, dependencies en groepen

### Direct versus indirect

Locked object blijft selectable als select/read/display toegestaan is. Locked is een intrinsieke restriction op **directe** learner geometry/properties/delete/labelchange; policygrant kan dit niet overrulen. Unlock is auteursbeheer. Locked is geen geheimhouding en geen baseline-identiteit.

Een toegestaan vrij bronpunt mag een locked/protected afgeleid object beïnvloeden via de geregistreerde bestaande graph. Hiervoor hoeft die afgeleide geen translate/setGeometry-grant te hebben. Planner kent de indirecte effecten, niet de client. Alleen calculator-outputvelden (typegebonden coördinaten of berekende meettext) en constructionValid mogen hierdoor veranderen. Style, labeloffsets, graphrefs, IDs, locks, visibility en policy blijven gelijk. Indirecte berekende verandering van een bronkoppeling is dus geen ongeautoriseerde directe edit.

`indirectGeometry:freeze` op één geraakt afgeleid object weigert het **gehele** broncommand indien zijn berekende output zou wijzigen. `follow` laat dat toe; expliciete immutable fields buiten calculatoroutputs blijven protected. Bij `follow` zijn outputgeometryvelden uitsluitend direct immutable; bij `freeze` ook indirect. `allowIndirectInvalid=false` weigert een geldig->ongeldig effect atomair met WOULD_INVALIDATE. Bij true mag invalidity optreden en later herstellen; invalid object verdwijnt uit canvas/hover/select/snap/sourcegebruik en wordt uit een learnerselectie verwijderd. Structuurfouten/missing refs/cycles blijven altijd fouten, geen permissieve invalid-state.

### Multiselectie

Alle geselecteerde leden moeten read/display toegestaan, visible/valid/unlocked zijn. De vrije roots zijn de directe geometrytargets en moeten translate toegestaan hebben; ze krijgen één delta. Voor een geselecteerde constructie moeten **alle vrije bronwortels** in de directe selectie zitten en translate toegestaan zijn; anders INCOMPLETE_GROUP. De geselecteerde afgeleide vereist geen rechtstreeks translate/setGeometry-grant: haar effect wordt onder follow/freeze/invalidity geautoriseerd. Afgeleiden worden gerecomputeerd, niet onafhankelijk gesnapt of gepatcht. M1.1-bestaande rootcoverage blijft een geometrische plannerregel; PermissionEvaluator voegt rechten toe. Eén geweigerd lid/closure-effect weigert de hele groep. Geen stil wegfilteren bij drag/delete/stylebatch/duplicate.

Selectie zelf is anders: canvas/list/rectangle/Ctrl+A verzamelen alleen toegestane selectable IDs; geweigerde kandidaten worden niet geselecteerd. object.select filtert zijn ID-set (ook onbekende IDs vallen weg); een lege set/deselect is toegestaan en verandert geen document. canExecute/query-capabilities op een afzonderlijk object melden het ontbrekende selectrecht, terwijl de selectieplanner alleen de toegestane subset naar UX-state schrijft. Deze read/UX-filtering is geen gedeeltelijke geometrische mutatie. Modifier- en M1-prioriteitsregels blijven gelijk op die gefilterde set. HitAt kiest de topmost **toegestane** painted candidate, anders de bestaande afstandsresolver op de gefilterde kandidaten; hover en klik gebruiken datzelfde resultaat. Construct-sourcekeuze gebruikt sourceTools, niet selectrechten als substituut.

### Delete, copy en toekomstige containers

Deleteclosure wordt uit huidige graph berekend. Ieder te verwijderen object is een deletioneffect en vereist delete plus geen lock/fixed initial identity; zelfs als het indirect afgeleid is. follow verleent nooit delete. Alleen volledig geautoriseerde cascade is toegestaan.

Leerlingduplicatie vereist source read/display/duplicate en creatierecht voor ieder outputtype, nieuwe IDs, created-rules, limits en geen copie van policy/ownership. De huidige duplicateMany maakt afgeleiden vrij en unlocked: dat blijft uitsluitend authorcompat; learner derived-detachment wordt MODE_DENIED tot een apart goedgekeurd semantisch operatorcontract bestaat.

Toekomstige groepen/lagen/templates verlenen geen extra rechten. Bij een geregistreerde containeroperator expandeert de planner de member/effectclosure en gelden alle individuele rechten en atomiciteit. Geen policy-inheritance door groepslidmaatschap of templates uit import. Layers die objecten tonen/hiden kunnen alleen de zichtbare view verkleinen; tonen buiten authored visibility/policy is verboden. Nieuwe containers/topologie zijn nu UNSUPPORTED_COMMAND, niet automatisch object.setProperties.

## 8. History, policywissel en bewijs

Learnerhistory is private runtime-owned history van geslaagde commands, gebonden aan artifactrevision/actor/epoch. Alleen eigen recente goedgekeurde entry kan undo/redo; caller-JSON of een aangepast EditorHistory.entries/restore mag geen kernelstate schrijven. Een inverse is intern berekend op de echte entry en gecontroleerd op chainhash/revision en protected baseline, met budgetvalidatie.

Learnerhistory bevat uitsluitend geslaagde documentmutaties, geen hover/select/viewcommands. Bestaande authorhistory blijft inclusief author-pan/zoom. Geometrievalidatie en parameter/budgetconstraints worden ook bij inverse/redo gecontroleerd, geen history-uitzondering daarop.

Undo-grant betekent toestemming de eigen goedgekeurde overgang te annuleren; daarvoor is niet bovendien object.delete vereist voor undo van een eigen create, of create voor undo van delete. Het is geen algemene inversepatchgrant. Zelfde voor redo. Dit expliciete onderscheid voorkomt dat undo onmogelijk wordt of snapshotload alle objectrechten omzeilt. Intrinsic locks die onderdeel van een author-historycommand waren kunnen door authorundo worden hersteld. Leerlingpolicywissel wist/invalideert history en active transactions; oude snapshots kunnen nooit rechten of policy terugzetten.

Reset met grant herstelt de private **published** initialDocument + initial parameterwaarden en initial sessionview, wist learner-created registry/selection/preview/history, maar houdt actor/attempt/policyrevision. Geen blank Nieuwe-illustratie en geen nieuwe poging of schone serverledger. Auteur Nieuw/draftgedrag blijft zoals nu.

Evidencecontract: iedere geslaagde documentmutatie kan één `CommittedCommand` leveren met commandId/sequence, operation, canonical input, actor/attempt/artifact/policyrevision, pre/post revision/digest en executor-berekende directe/indirecte effecten. Alle learner documentcommands inclusief parameter, duplicate/delete, undo/redo en reset worden geregistreerd wanneer de activiteit evidence vereist. Views/selectie/hover en geannuleerde of geweigerde previews zijn geen geslaagde methodestap; rejected events mogen diagnostisch apart worden gelogd. Undo wist eerdere bewijsevents niet: het voegt een nieuw event toe dat de eerdere commandId adresseert.

M2b moet dit eventcontract kunnen produceren, maar semantisch replay/scoring hoort bij M4/M16/M17. EditorHistory's documentsnapshots zijn nu geen methodebewijs. M17 replayt allowed semantic commands vanaf eigen baseline, vergelijkt geometry met versiegebonden tolerances en vertrouwt geen client-effecten/score/hash/createdBy. Clientmethodes als raw direct coordinate-create zijn alleen bewijs van dát toegestane recept, nooit bewijs dat bijvoorbeeld een middelloodlijnconstructie is gevolgd.

## 9. Import, export, startup en resume

Auteur behoudt atomische v1/v2/v3-migratie/replace, opaque extension roundtrip, DraftStore en volledige SVG/JSON-export. Policy blijft buiten die geometrie-import. In restricted factories zijn authored global draftrestore en DraftStore.save/clear uitgeschakeld; startup laadt uitsluitend de hostbaseline voordat publieke callbacks worden gegeven.

Course/toets `.load`, `.model.load/clear`, willekeurige history restore en `document.replace` blijven verboden, ongeacht payload. Policyvelden met authorrole, ownership, grants of bekende initial IDs in documentdata worden nooit actief. In restricted command/importpayloads zijn zulke reserveringen INVALID_COMMAND. Bij vertrouwd initialDocument kunnen opaque legacyextensions worden bewaard maar nooit gecompileerd als policy.

Additieve course-import is een toekomstige expliciet geregistreerde `document.importObjects`-operatie: initialDocument/policy blijven staan, ieder object krijgt nieuwe executor-ID, iedere create/construct moet afzonderlijk toegestaan zijn, refs worden veilig geremapd en extern sourcegebruik gecontroleerd, geen policy/meta/presentation/locks/ownership uit file. Eén verboden element weigert alles. **M2b registreert deze operator niet** en weigert een policy die hem enablet met UNSUPPORTED_POLICY; hij mag nooit naar bestaande Engine.load terugvallen. Assessment-import is een mode ceiling. Daarmee hoeft M2b geen ongevraagde importfeature te bouwen of permissies te improviseren.

Public SVG-export projecteert alleen read+display objecten en verwijdert hover/selection/handles. Public learner JSON-export projecteert alleen readable objecten en mag geen private policy/answer/history/ownershipregistry bevatten: serializeer uitsluitend de geregistreerde geometrie/constructie/stylevelden, publieke title/description en goedgekeurde presentatie; geen opaque _extra/meta/objectextensions. Als een exported construct naar een niet-readable source verwijst, wordt gehele JSON-export geweigerd (`PERMISSION_DENIED`), niet stil afgebroken/flattened en niet met verborgen source aangevuld. Auteur volledige export ongewijzigd. Read/display kunnen nooit vertrouwelijkheid van gegevens garanderen die al naar de browser zijn verstuurd; summative secrets blijven op server.

Draft-resume/save hebben een afzonderlijk contract: course/assessment kunnen pas enablet worden wanneer een resumeadapter is geregistreerd. M2b schakelt learner draftResume/draftSave uit en weigert een enable-policy met UNSUPPORTED_POLICY. Geen globale authoredraft als fallback. Een toekomstige resumeadapter herkent artifact/actor/epoch, replayt/valideert commands tegen baseline en policy, en vertrouwt nooit alleen een localStorage-documentsnapshot. M17 bepaalt serverresume/signed checkpointdetails.

Pan/zoom in learnercontext wijzigen uitsluitend session view, niet baseline/persistent presentation, en staan buiten methodebewijs. viewConfigure mag geen objecten buiten read/display reveal-en of policyconstraints aanpassen. Meta/persistent axes/grid zijn afzonderlijke documentcommands als expliciet toegestaan. Numerieke/snap/geometrygrenzen worden niet opgeheven door viewgrants.

Adaptive-grid-/scale-/rendercachewaarden zijn afgeleide sessionview en mogen niet stil als persistent documentwrite worden gecommit in restrictedcontext. Private snapshots bevatten de canonical approved documentpresentatie; export gebruikt de expliciet toegestane projectie/view. Het bestaande auteur-toJSON/renderer/adaptive-gridgedrag blijft apart legacycompatibel.

## 10. M2b-implementatiegrens en acceptatiecriteria

### Concrete contractproef (geen uitgevoerd permissiesysteem)

Neem publieke vrije A/B en een locked midpoint M(A,B). Coursepolicy declareert read/display/select voor de drie objecten, A.translate=true, B.translate=false, M.indirectGeometry=follow; construct:midpoint is toegestaan met sourceTools-grants op A/B en een read/display created-point-rule. document.undo=true, reset=true, exportSVG=true; alle overige rechten ontbreken. Daaruit volgt deterministisch:

| Verzoek | Uitkomst |
|---|---|
| move A | Allowed; M volgt ondanks lock, geen direct M-write |
| move B / direct update M.x / delete A | Denied: ontbrekende movegrant / locked-derived geometry / deletegrant |
| construct midpoint A/B | Allowed als valid en binnen budget; beide sources blijven readonly respectievelijk vrij volgens hun eigen regels |
| create los point of duplicate M | Denied: tool ontbreekt / learner derived-detach mode ceiling |
| group A+B+M | Geheel denied: B niet movable en M is geselecteerd locked |
| source A move met M=freeze | Geheel denied zodra de midpointoutput verandert |
| undo eigen approved A-move | Allowed onder private entry; B/delete/M direct-writegrants niet nodig |
| load extern JSON of role=author in payload | Mode/schema denied; geen baseline/policywijziging |
| export SVG / export JSON | Allowed publieke SVG / denied ontbrekend JSON-formaatrecht |
| reset | Approved baseline terug, actor/policy/attempt en evidenceketen behouden |

Deze proef controleert dat readonly/selectable/source/indirect/history geen onderlinge ongewenste writegrants produceren. M2a-TEST-PLAN maakt deze gevallen uitvoerbaar in M2b.

M2b registreert huidige create-/constructtools, select/read, translate/setGeometry/setProperties, duplicate voor vrije objecten, delete, bestaande documentpresentation/meta, export/reset/history/view en parameter.set voor numerieke bestaande vrije veldbindings. Geen sliders/UI, containers, reconnect/detach, leerlingimport/resume, hostcourseembedding of server toegevoegd. Unsupported config wordt bij startup geweigerd; capabilities adverteren geen onverwezenlijkte rechten.

PASS M2b vereist:

1. Restricted factory zonder geldig vertrouwd policy/baseline/context start niet; default-deny in course/assessment.
2. Eén evaluator per semantische operatie, gebruikt door UI/keyboard/M1.1 en directe facade; buttons zijn nooit de commitguard.
3. Alle huidige publieke restricted engine/model/renderer/history/draft-omwegen uit M2a-REPORT worden afgedekt door deny of controlled dispatch; geen raw mutable kernelreferentie naar learneradapter.
4. Mutaties/batches/cascades en twee-tangentresultaten zijn atomair; deny verandert geen geometry, IDcounter, historycursor, ownership of policy.
5. Direct/indirect/follow/freeze/invalidity/locks en geselecteerde rootcoverage voldoen aan §7; preview=commit, commit herautoriseert.
6. Undo/reset/export/import/config-escalatie volgen §8/9; policy zit niet in geometriesnapshots.
7. Huidige author-UI en standalone author-legacy-api behouden hun beschreven gedrag, golden fixtures en actuele bestaande Node/Edge-tests; eventuele noodzakelijke aanpassing aan testharnas mag geen geometrische golden herschrijven.
8. Alle negatieve testgevallen uit M2a-TEST-PLAN hebben hun expliciete denial en unchanged-statecheck. Browser-only resultaten claimen geen summative beveiliging.

Er zijn geen fundamentele M2b-permissievragen open: beslissingen hierboven zijn normatief. M17 transport/authenticatie/replay-tolerances en toekomstige niet-geregistreerde operators vragen later ontwerp, maar hun huidige gedrag is expliciet weigeren. Alleen productkeuzes zoals welke specifieke punten/tools de auteur enablet zijn activiteitsconfiguratie, geen implementatiebeslissing.
