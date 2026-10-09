# M2a — Testplan voor M2b en latere servervalidatie

Datum: 2026-10-09. Dit is een testontwerp, geen nieuwe uitgevoerde permissietests. De actuele bestaande suite op `03d4582bd0deb429c3e05da8baa847189c7d0825` telt **162** Node-tests plus de volledige echte Edge-suite. Oude aantallen 133/151 of oudere branches zijn geen uitgangspunt.

Normatieve semantiek/codes: [M2a-PERMISSION-CONTRACT.md](M2a-PERMISSION-CONTRACT.md). Testuitkomsten gelden zowel voor pure evaluatie als voor het execute-pad. De bestaande auteur-API en author-ui zijn bewust verschillende compatibiliteitsprofielen; test die niet als learnerrechten.

## 1. Gemeenschappelijke fixtures en denial-oracle

Nieuwe fixtures voor M2b, niet wijzigingen van bestaande golden fixtures:

- G0: vrije punten A(0,0), B(4,0), locked punt L(3,0), hidden helperpunt H(1,1), cirkel C met centrum (0,3) en r=1, lijn S van A naar B, polygon P[(0,0),(2,0),(0,2)], midpoint M(A,B), tangent T(C,A) branch 0, gekoppelde area-text AP(P). Alle initial constructs geldig; policy bepaalt read/display/select/source los van mutation.
- C0: course default-deny; expliciet publieke A/B/C/S/P/L/M, alleen A.translate, M follow, select voor A/L, construct:midpoint met bronnen A/B, created point-class read/display/select/translate, bounded parameter rC in [1,3] stap .25 op C.r. Geen algemene C.geometryFields-grant.
- C1: C0 plus B.translate, group M(A,B) toegestaan wanneer beide roots geselecteerd. M.indirectGeometry=freeze-variant en T.allowIndirectInvalid=true/false-varianten.
- E0: assessment default-deny, initial identities/graph/geometry protected; alleen benoemde A.translate, allowed construct:midpoint/perpendicular en hun resultclasses, create:point, undo=true, redo=false, reset=true; import=false. Practice/summative trusted hostvarianten.
- A0/A1: author-ui en standalone author-legacy-api met bestaande locks/visibility/duplicate/cascade/history/opaque extensions, dezelfde oude documenten.

Policyfixtures moeten volledig schema/budgetvelden hebben; geen fictief unsupported widget of geometrisch type activeren. Afzonderlijke fake parameteradaptertest mag de binding controleren; geen sliderfeature als onderdeel van M2b bouwen.

Iedere negatieve mutatietest bewaart vóór de call: private canonical geometry + renderer/documentpresentatie, documentrevision, model-IDcounter, created registry, historyentries/cursor, policyrevision/epoch, transactionregistry en selectie. Na weigering: **alle gelijk**, geen committed/evidence-event, geen gedeeltelijke resultaten. Alleen generieke statusmelding mag veranderen. Unauthorized selection is een gefilterde read/UX-actie: inspecteer dat verboden IDs niet in hover/highlight/list/inspector staan, zonder onterechte geschiedenisstap. Bij rejected commit wordt de transient preview verwijderd en de geautoriseerde basisstate getoond.

## 2. Unit-tests — evaluator, compiler en operation registry

| ID | Geval | Verwachte uitkomst |
|---|---|---|
| U01 | course/assessment zonder policy/context, ontbrekende principal/baseline/revision | INVALID_POLICY/contextweigering; geen authorfallback |
| U02 | Iedere matrix-mutatie zonder grant, per course/practice/summative | PERMISSION_DENIED of betreffende mode ceiling; allowed=false |
| U03 | Eén exacte grant, objecttype/fields/recept geldig | ALLOWED uitsluitend voor benoemde capability/velden |
| U04 | Onbekende policykey, operator, field, prototypekey, JS predicate | INVALID_POLICY/UNSUPPORTED_POLICY; startup geweigerd |
| U05 | default grant + initial override false; immutable-unie + override poging | Grant false wint; immutable blijft; conflict INVALID_POLICY |
| U06 | Lock plus translate/property/delete grant | LOCKED; select met read/display blijft ALLOWED |
| U07 | Locked author duplicate en author visibility/locktoggle; author-legacy raw update | Bestaand authorgedrag toegestaan; author-ui directe lockbewerkingen blijven denied |
| U08 | hidden/invalid canvasobject, zelfs met select grant | OBJECT_NOT_AVAILABLE; geen canvas-hover/select/source |
| U09 | author lijst selecteert hidden/invalid versus learnerlijst | Author beheerselectie allowed; learner geweigerd/gefilterd |
| U10 | read/display maar geen select, snap wel; select maar geen write | Snap only wanneer snap grant; selectie geen mutatierecht |
| U11 | sourceTool grant op locked visible uitgangspunt | Construct-source allowed zonder direct-editgrant |
| U12 | Ontbrekende sourceTool/hidden source/invalid ref/index/cycle | MISSING_SOURCE_PERMISSION of OBJECT_NOT_AVAILABLE/INVALID_COMMAND; geen construct |
| U13 | AllowedTools bevat triangle, client add(polygon met 4/3 vertices) | create:polygon verboden; expliciete triangle alleen met drie geldige vertices |
| U14 | rightAngle-tag op andere hoek, vervalste tangentbranch/resultcoords | INVALID_COMMAND; geen tag-only privilege |
| U15 | Construct grant zonder created-resultclass/read/display | INVALID_POLICY; geen invisible/ongeclassificeerd outputobject |
| U16 | Propertygrant zonder geometrygrant; mixed style+x patch | Hele command PERMISSION_DENIED; geen styledeelcommit |
| U17 | Translate toegestaan; absolute setGeometry/radius/vertexaantal/graphpatch | Geometry zonder fieldgrant denied; topologie/graph unsupported/mode denied |
| U18 | Parameter binnen bounds/min/max en geldige stap | ALLOWED via binding; geen algemene geometryFields-vereiste |
| U19 | Parameter buiten bounds, off-step, NaN/Infinity, unknown binding | OUT_OF_RANGE/INVALID_COMMAND; geen clamp of write |
| U20 | Parameter op locked, explicit immutable of derived output | Config INVALID_POLICY of runtime LOCKED/IMMUTABLE_FIELD; geen write |
| U20b | Zelfde gebonden veld veranderen via permitted translate/update, numeric strings, overlappende bindings | Grenzen/step blijven enforced; buiten bereik OUT_OF_RANGE; string INVALID_COMMAND; overlappende binding INVALID_POLICY |
| U21 | Parameter op expliciet hidden helper, andere generic hidden move/select | Bounded binding allowed; geen generic select/translate-grant |
| U22 | Frozen initial geometry/global created-rule/createdBy spoof | Initial beschermd; payload spoof INVALID_COMMAND; geen created-class |
| U22b | Assessment initial delete:true of globale initial mutationgrant | INVALID_POLICY; geen actorstartup met afgezwakte uitgangsconstructie |
| U23 | Alle groepsleden toegestaan versus één denied/locked/hidden/invalid | ALLOWED versus gehele batch geweigerd; nooit partial group |
| U24 | Geselecteerde derived zonder alle free roots / met alle roots | INCOMPLETE_GROUP versus één rigid plan |
| U25 | Protected derived follow + toegestaan bronmove | Indirect output ALLOWED; direct patch op die derived denied |
| U26 | Derived freeze met gewijzigd/niet-gewijzigd calculatoroutput | INDIRECT_FROZEN versus allowed zonder changed effect |
| U27 | Toegestaan bronmove maakt T ongeldig; validity true/false | Allowed invalid+recover versus WOULD_INVALIDATE atomair |
| U28 | Indirect effect probeert style/locks/refs/labeloffsets te wijzigen | PERMISSION_DENIED/INVALID_COMMAND; calculatoroutput-whitelist blijft gelden |
| U29 | Deleteclosure met één protected/locked descendant | CASCADE_DENIED; bron blijft staan, ook wanneer follow is toegestaan |
| U30 | Allowed delete op hele closure | Alle leden verdwijnen één keer, één history/event |
| U31 | Free duplicate toegestaan maar output-create verboden / derived-detach | Hele duplicate denied; learner-derived detach MODE_DENIED |
| U32 | Export zonder formaatrecht, SVG vs JSON afzonderlijk | PERMISSION_DENIED voor ontbrekend formaat |
| U33 | Readonly construct verwijst bij JSON-export naar niet-readable helper | Hele export denied; geen hidden source toevoegen/flattenen |
| U34 | Imported role/policy/fixed/createdBy, objectID van baseline, reserved keys | INVALID_COMMAND; geen rights/ownership/initial replacement |
| U35 | Learner .load/clear/replace of assessment import ondanks grant | MODE_DENIED; onveranderde baseline/session |
| U36 | Course policy enablet additive import/resume zonder adapter in M2b | UNSUPPORTED_POLICY; geen Engine.load/DraftStore fallback |
| U37 | Undo/redo/reset policies elk apart | Alleen expliciet granted operatie allowed; ontbrekende grant denied |
| U38 | Unknown future group/layer/template/transformation operator | UNSUPPORTED_COMMAND; geen objectpropertypatchfallback |
| U39 | Negative/Infinite budgets of teveel objects/payload/depth/batch | INVALID_POLICY of INVALID_COMMAND budgetweigering; geen gedeeltelijke allocation |
| U40 | Self-asserted actor/role/origin/fromHistory/effectlist/allow-ticket | INVALID_COMMAND of genegeerde diagnostische origin; nooit extra recht |

## 3. Integratietests — echte engine/facade/executor

| ID | Geval | Verwachte uitkomst en negatieve oracle |
|---|---|---|
| I01 | Alle bestaande add/update/updateMany/move/remove/duplicateMany/construct direct op restricted engine | Zelfde decision als semantic/UI command; geen onbeveiligde shortcut |
| I02 | Movegrant A; direct update A.x; direct move A | update denied zonder setGeometry; move allowed en één delta |
| I03 | .model.update/add/remove/load/clear; assign .model/.renderer/meta; raw snapshot aanpassen | Geen muterend kernelobject; readonly/throw/detached; echte state gelijk |
| I04 | Nieuwe losse author Engine maken en als learner-state terug injecteren | Bestaande learner facade/baseline onveranderd; geen accepted attempt override |
| I05 | Batch A toegestaan, B denied, ongeacht volgorde | Beide niet gewijzigd; IDcounter/revision/history gelijk |
| I06 | Tangent maakt twee branches, tweede resultbudget/grant ontbreekt | Hele command weigeren, geen eerste tangent of consumed IDs |
| I07 | Atomic roots A/B/M move, shared/chain dependencies | Eén delta roots, afstanden gelijk, M opnieuw berekend; refs/labeloffsets/style identiek |
| I08 | Missing selected root, frozen descendant of hidden/locked member | Hele move denied; unchanged canonical state |
| I09 | Indirect invalid en recovery bij allowed validity | Geometrie recoverable; hover/snap/selectprojectie excludes invalid; style/refs behouden |
| I10 | Delete bron met protected descendant versus hele closuregrant | Denied/no deletion versus atomair volledige authorized cascade |
| I11 | Public get/model.objects/selectAt vs public toJSON/renderSVG | Read/selectprojectie respecteert policy; export extra gate; internal snapshot zonder exportgrant werkt private |
| I12 | History.undo eigen approved create zonder deletegrant | Alleen met undogrant approved inverse allowed; unauthorized arbitrary deletion blijft denied |
| I13 | Public EditorHistory.restore(snapshot), entries injection, old snapshot na policyepoch | UNTRUSTED_HISTORY/MODE_DENIED/STALE_TRANSACTION; historycursor/state gelijk |
| I14 | Undo/redo met changed policy, artifact of actor | Oude learnerentries invalid; geen oude policy/rights terughalen |
| I15 | Reset toegestaan/niet toegestaan tijdens gesture | Allowed: cancel + original published baseline, registry/history leeg, epoch/attemptpolicy behouden; denied: baseline unchanged, geen draftwipe |
| I16 | Tool-/policy-/rolewissel tussen begin-preview-commit | Handle cancel/stale; geen stale mutation, capture/preview cleanup |
| I17 | Commit payload verschilt van authorized preview/targets/op; copied handle naar tweede session | STALE_TRANSACTION/INVALID_COMMAND; geen extra fields of tweede actorwrite |
| I18 | Public cancel met vervalst before-state/handle | Geen arbitrary inverse: invalid handle denied; eigen handle alleen cleanup |
| I19 | Import/draft van author onder dezelfde globale storagekey | Learnerstartup negeert authoredraft; geen load/policy/elevation; opgeslagen author recoverydata intact |
| I20 | Future learner resume met wrong artifact/actor/revision/tampered replay | Future adapter weigert volledig; in M2b unsupported startupconfig |
| I21 | SVG/JSON daadwerkelijke output met hover, selection, hidden source, _extra.answers | Geen UI/privatedata; JSON met unavailable source denied, author roundtrip volledig behouden |
| I22 | Policy configure door learner; authoredraft wijzigingen terwijl learnerpreview draait | Learner configure MODE_DENIED; preview context/policy verandert niet zonder vertrouwde nieuwe epoch |
| I23 | Successful / rejected / canceled / undo / reset commands aan eventhook | Success één canonical event; rejected/cancel nul committed; undo/reset append, geen wissen |
| I24 | Legacy v1 labels, v2 styles/offsetnull/0, v3 graph in authorprofielen | Exact bestaande migratie/golden/export semantics; policy zit niet in docsnapshot |
| I25 | Learner create met forged locked/visible/style/ID/ownership | Reserved fields rejected; optional propertyfields alleen volgens created-rule; geen sourcepermissions erven |
| I25b | Engine.add raw object met construction-tag/resultgeometry terwijl construct-tool verboden is | INVALID_COMMAND; geen graphobject of vrij detached resultaat |
| I26 | Learner pan/zoom en persistente presentation-api | View granted: sessionview verandert, documentgeometry/baseline gelijk; directe rendererwrite denied |

## 4. Echte Edge-tests

Gebruik de bestaande Playwright/msedge infrastructuur, nieuwe isolated sessions/contexten, geen userdraft gebruiken. Fake pure-policy tests vervangen geen browserproef. Iedere UI-negative heeft tevens een directe facade-call om disabled controls als enige grens uit te sluiten.

| ID | Interactie | Acceptatie / negatieve uitkomst |
|---|---|---|
| B01 | Toolbar, programmatic setTool, sneltoets en engine.construct voor verboden tool | Alle commitpaden denied; geen vorm/ghostpreview/history |
| B02 | Cursus A mag bewegen, B/L niet; hover overlap/7 vs 9 CSS-pixels/zoom | Hover en klik dezelfde toegestane resolver; grab/grabbing alleen bij allowed move; pointer bij selectable protected |
| B03 | M1 rectangle beide richtingen + Shift/Ctrl/Meta/Ctrl+A/objectlijst | Alleen policy-selectable IDs; selection/list/inspector/highlights synchroon |
| B04 | Multi allowed vs partial allowed vs missing roots; klik op selected label | IDs blijven behouden; één rigid authorized move of gehele deniedactie |
| B05 | Inspector/color/labeldrag/vertex/endpointdrag via DOM en API | Exact fieldpermissions; locked/frozen velden nooit veranderd |
| B06 | Parameter input binnen/buiten min/max/step plus directe API | Allowed exactwaarde; invalid waarden rejected, oorspronkelijke waarde/panels hersteld |
| B07 | Drag preview en finale pointer-up buiten canvas | Zelfde resolvergeometry als approved preview; herautoriseer commit |
| B08 | Escape, pointercancel, blur, captureverlies, Nieuw, dispose→init | Geen preview/kernelmutation na cancel; geen dubbele listeners of stale commit |
| B09 | Policy/tool change tijdens object/group/label/endpoint/polygon/construction gesture | Handle invalide, hover/cursor/selection cleanup; commit denied |
| B10 | Undo/redo buttons/shortcuts/API en injected historysnapshot | Alleen granted private approved entries; snapshot injectie blocked |
| B11 | Nieuw/reset allowed en denied, fileInput/drop/API import | Reset herstelt trusted learnerbaseline; import geen attempt/policy/initial replacement |
| B12 | Exportknoppen/API download per formaat | Niet granted geen download; granted gefilterde SVG/JSON, geen UI/secretdata |
| B13 | Startup met vervalste localStorage draft / mode=author query / imported role | Restricted context unchanged/default deny; geen auteurbaseline of privilegefallback |
| B14 | Nieuw author activity-policydraft + afzonderlijke learnerpreview | Author kan blijven bewerken/unlocken; learner rights nooit impliciet auteur |
| B15 | M1.1 hover op object waarvan rights/visibility/validity tijdens hover verdwijnen | Highlight/cursor/inspector direct ververst, geen denied target in hit/snap |
| B16 | Legacy auteursworkflow tekenen/stijl/lock/duplicatie/deletecascade/save/import/export/undo | Alle bestaande Node/Edge regressies behouden; geen nieuwe learnerconstraints op authorlegacy |

Responsive viewport, verschillende zoomschalen, text/labels, alle huidige geometrische types en gekoppelde constructies blijven in de volledige oude suite aanwezig. Rightschecks mogen niet tot een tweede pointercontroller, renderpad of concurrerende previewstate leiden.

## 5. M17 — toekomstige autoritatieve servertests

Deze tests zijn **niet** uitgevoerd en geen voorwaarde om M2a-documentatie als compleet te beoordelen. Een summative release mag zonder deze serveracceptatie niet als beveiligd worden gepresenteerd.

| ID | Aanval / gebeurtenis | Autoritatief verwacht resultaat |
|---|---|---|
| S01 | Client stuurt authorrole, alternatieve policy, andere initialDocument | Server gebruikt eigen identity/attempt/artifact; request denied |
| S02 | Command op initial frozen object of forbidden recipe met perfect eindplaatje | Denied command/method check; pixel/final equality geeft geen procedurecredit |
| S03 | Vervalste source/effectlist/calculatoroutput/createdBy/score/client digest | Server recompute + ownership; clientwaarden geen authority |
| S04 | Duplicate sequence, replay commandId, stale state/policyrevision, verkeerde actor/attempt | Replay/STALE reject, geen dubbele mutatie/score/event |
| S05 | Undo/reset om eerdere evidence te wissen of nieuwe attempt te claimen | Ledger append-only; nieuwe attempt alleen trusted serverflow |
| S06 | Direct raw modelresult zonder replay van toegestane semantic commands | Geen method-based credit; result-check apart volgens trusted assessmentpolicy |
| S07 | Bounded parameter off-step/nonfinite/foreign target of budgetoverflow | Zelfde contractdeny als client; geen float/serialization-escalatie |
| S08 | Source move veroorzaakt protected indirect freeze/deletion/invalidity | Server hanteert follow/freeze/cascade/validity onafhankelijk |
| S09 | Policy/artifact/geometrykernelversie gewijzigd tijdens assessment | Frozen versioned attempt of expliciete trusted migration; geen stil herinterpreteren |
| S10 | Client localStorage resume checkpoint met andere actor/policy/baseline | Servercheckpoint/replay validation; geen trust op localStorage |
| S11 | Hidden answers/policysecrets via export/get/errorpayload | Secrets worden nooit naar client meegestuurd; projection/errorcontract gecontroleerd |
| S12 | Deterministic replay (twee tangents/ID allocation/batch) en equivalent resultaat | Zelfde canonical operations/effects met versiegebonden tolerances; geen pixel-based scoring |

Transport/authenticatie, multi-device concurrency, formele evidence-retentie en scoretolerances worden in M17 uitgewerkt. Deny/mode/ownership/operationsemantiek uit dit contract blijft het gemeenschappelijke fundament.

## 6. Uitvoervolgorde en regressiepoort

1. M2b eerst U01–U40 red; pure evaluator/registry/closed policy compiler.
2. I01–I11/I19/I25/I26 red; sealed restricted facade + atomic executor. Authorlegacy blijven testen.
3. I12–I18/I22/I23 red; private history/transactions/epoch/eventhooks; geen snapshotloader als shortcut.
4. B01–B16; adapters gebruiken evaluator voor capabilities, cursor/hit/filtering en command-dispatch.
5. Volledige actuele Node-suite én volledige echte Edge-suite; **alle 162 huidige tests** behouden. Nieuwe goldens toevoegen wanneer noodzakelijk, huidige goldens niet veranderen om regressie te verbergen.
6. Negatieve matrix coverage per modus/operatie, unchanged-state oracle en public-API inventory vergelijken met M2a-REPORT. Ontbrekende facade-route = M2b FAIL.

M2a schrijft alleen dit plan en voert de bestaande regressies uit. M2b-tests worden pas na expliciete goedkeuring geïmplementeerd.
