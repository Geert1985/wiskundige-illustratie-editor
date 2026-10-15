# Mathematical Illustration Platform — Development Roadmap

Version: 2.8.10 (M8a-2 geaccepteerd en geïntegreerd, 2026-10-15)
Status: gecontroleerde integratiebasis `main` = `ac3dc29` (M8a-2 PR #16 bovenop M8a-1/STAB-1 PR #15). M8a-2 is door de gebruiker geaccepteerd en na de volledige Node/Edge-regressies gemerged. Historische checkpoints hieronder blijven tijdgebonden momentopnamen.
Date: 2026-10-15

> **Lees eerst:** [AGENTS.md](../AGENTS.md), [UI-RADIAL-9-CONTRACT-DRIVEN.md](UI-RADIAL-9-CONTRACT-DRIVEN.md) en de nieuwste toevoegingen hieronder. De volledige eerdere M1–M20-backlog, FUN-OBJ/MAT-OBJ-voorstellen en historische tests blijven behouden.

## Roadmap v2.8.5 — beslissingen en open kwaliteitsgates op 15 oktober 2026

| Traject | Ontwerpstatus | Implementatie-/acceptatiestatus |
|---|---|---|
| **M8a — Ellipsen** | **Goedgekeurd**: [contract v1.0.0](M8a-ELLIPSEN-CONTRACT.md) | M8a-1 staat op `main` via PR #15. **M8a-2 Punt op ellips** is door de gebruiker geaccepteerd en via [PR #16](https://github.com/Geert1985/wiskundige-illustratie-editor/pull/16) op `main` geïntegreerd: gekoppelde parametrische contourpunten, radiale/sidebar/fullscreen-bediening, verslepen, restricted projectie, historie, opslag en export. GitHub Actions bevestigde **659/659 Node-tests** en de volledige Edge-suite inclusief afzonderlijke ellips-rendering/-interactie ([run](https://github.com/Geert1985/wiskundige-illustratie-editor/actions/runs/38790665076), poging 2); SVG-puntcoördinaten en gewijzigde PNG-pixels worden expliciet gecontroleerd. Zie [M8a-2-verslag](M8a-2-POINT-ON-ELLIPSE-IMPLEMENTATION.md). De nieuw besproken besturingspunt-Q-constructie is een afzonderlijke, nog niet geïmplementeerde vervolgwijziging; M8a-3 blijft een aparte consolidatiestap. |
| **M8b — Parallellogrammen** | **Goedgekeurd**: [contract v1.0.0](M8b-PARALLELLOGRAMMEN-CONTRACT.md) | M8b-ontwerp voltooid; M8b-0 preflight, M8b-1 constructie, M8b-2 maten/UI en M8b-3 regressie/acceptatie **nog niet geïmplementeerd**; standaard na M8a-1-acceptatie |
| **M7-VEC-FUND — Vectorfundament** | **Ontwerp v1.0.0 goedgekeurd** op 15 oktober 2026: [contract](M7-VEC-FUND-CONTRACT.md). Historisch label `M7a` vervalt uitsluitend voor vectorfundament. | **Niet geïmplementeerd.** Read-only preflight vereist; afzonderlijke GO nodig voor productiecode, tests en branchwerk. `tasks-146` en `tasks-147` behoren inhoudelijk tot dit traject. |
| **Parabolen/hyperbolen** | Architectuurvoorstel besproken in *WIE - Kegelsneden* | Nog **geen** afzonderlijk goedgekeurde ontwerpcontracten of implementatieopdrachten |
| **UI-RADIAL/REG-2** | Bestaande contracten en implementaties | Gemerged op `main` via PR #12; nieuw volledig regressie- en handmatig acceptatiebewijs niet uit deze docs-update afleidbaar |
| **STAB-1** | Integratie-/regressiecontrole | Opgenomen in de goedgekeurde basis `main` via PR #15; latere featurebranches krijgen hun eigen regressieresultaten |

**Schema-grens:** `origin/main` bevat document v9, `ellipseSchema:1` en `constructionSchema:6` uit M8a-1. M8a-2 gebruikt dezelfde grens; er is geen nieuwe schema- of documentversie toegevoegd. M8b's uitbreiding blijft een ontwerpbesluit.

**Nummerbeleid M7 (besloten voor vectorfundament, 15 oktober 2026):** **M7-VEC-FUND** is de definitieve unieke identifier voor [Vectorfundament v1.0.0](M7-VEC-FUND-CONTRACT.md). Het oudere vectorlabel `M7a` is uitsluitend een historisch synoniem en wordt niet meer voor deze milestone gebruikt. **M7a–c — Starre transformaties** (`tasks-118`–`tasks-123`) behouden hun bestaande nummering. De oorspronkelijke tekst noemt `M7b` voor translatie en `M7f` voor vectoralgebra; de uiteindelijke namen en volgorde van die vervolgtrajecten vereisen nog aparte besluitvorming. De bestaande taakrefs blijven behouden; contractgoedkeuring is geen implementatie-GO.

**Historische notitie:** v2.8.8 was documentatie-only; v2.8.9 registreerde de featurebranchimplementatie; v2.8.10 registreert de gebruikersacceptatie, onafhankelijk groen GitHub CI-bewijs en integratie via PR #16.

## Baseline
User-reported 0A–0D PASS on chatgpt/math-illustration-stabilization, 0D HEAD 297b4d7c834fe0cd9f9b01bc3a43a7d592ef2713, 60/60 Node tests and Edge tests. Verify repository and user's manual acceptance before proceeding. User reports development has advanced beyond phase 0 and already includes bisectors, parallels, perpendiculars, tangents, area and circumference. Do not assume 0E is still pending; inspect actual HEAD and current backlog.

## Gate A — Repository inventory and product contract
Read existing source, tests, docs and roadmap. Map backlog items to implemented, partial, missing, and blocked. Record exact branch/commit, risks and dependencies. Produce an inventory and milestone proposal; do not edit production code in this gate.

## Gate B — Authoring usability foundation
Selection rectangle, group selection, undo/redo, locks/layers, grid toggle and property editing. Preserve interaction ownership, render path, exact geometry and export.

## Gate C — Parametric and dynamic geometry foundation
Versioned construction dependencies, recomputation, invalid-state handling, dynamic triangle centers, loci and trace. Treat this as a critical architectural milestone with tests and migrations.

## Gate D — Additional primitives and transformations
Ellipse, parallelogram, reflection, translation, rotation, scaling, composition, vectors and matrix transformations. Each as small isolated milestones.

## Gate E — Coordinate systems and analytic mathematics
Multiple basis-defined coordinate systems; function plotting, derivatives/tangents and integrals/Riemann sums. Use numeric robustness and performance acceptance gates.

## Gate F — Reusable learning runtime
Viewer mode, parameter sliders, animation, guided hints, construction replay, interactive embedding and publication artifacts.

## Gate G — Assessment runtime
Task authoring, permission model, mathematical validation, result-vs-method scoring, attempt tracking, authoritative server-side checking, accessibility and reproducible published versions.

## Gate H — Proof tools and publishing maturity
Formal proof-step layer, visual demonstrations, templates, LaTeX labels, export presets, accessibility/mobile and large-figure optimization.

## Codex operating protocol
1. Work on a dedicated branch from a verified checkpoint; never assume old branch is current.
2. For each milestone, begin with a written mathematical and UX specification, edge cases, compatibility policy and failing regression tests.
3. Make minimal coherent changes; avoid broad refactors unless the milestone explicitly targets architecture.
4. Preserve and run existing tests; add unit, integration and real browser tests.
5. Report exact commits, changed files, test outcomes, compatibility decisions, remaining risks and PASS/FAIL.
6. Commit/push only with explicit authorization or established project workflow; stop after the agreed milestone and await user acceptance.
7. Never implement the entire backlog in one pass.

## First instruction to Codex
Read these three documents and the current repository. Perform a READ-ONLY gap analysis: existing vs partial vs missing for every feature; propose a dependency-aware milestone sequence, identify mathematical/schema/security risks, and recommend the smallest next milestone. Do not change code, commit, or push until the plan is reviewed.

## Amendment 1.1.0 - M2c UI/UX modernization proposal

Date: 2026-10-09. Analysis checkpoint: 3ffefff1784d6a148ca6208289747744cf146e16. M1/M1.1, M2b, M3a/b/c and M4a have been delivered; this amendment records the current UI proposal without replacing the original M1-M20 roadmap. M4a automated verification passed; user requested this separate UX trajectory next. M4b has not started.

Normative UX requirements: [M2c specification 1.1](M2c-UX-SPEC-v1.1.md). Proposed architecture, dependencies and tests: [M2c plan 1.0](M2c-IMPLEMENTATION-PLAN.md).

| Checkpoint | Scope | Acceptance gate |
|---|---|---|
| M2c.1 | Header, accessible file disclosure, compact independent tool categories, Display/layer presentation | All controls reachable, unchanged snapping/document semantics; full regressions and manual checkpoint |
| M2c.2 | Contextual right properties panel, axes configuration selection, existing properties and atomic common style | Axis selection separate from visibility; author/course/assessment command enforcement |
| M2c.3 | Shared navigation controls, zoom readout, responsive panels | One controller/render path; geometry/bounds invariant on resize |
| M2c.4 | Integrated browser, visual, keyboard and accessibility verification | Explicit functional AND visual user acceptance |

Status: plan awaiting explicit approval; no production implementation authorized by this document. Logarithmic, semilogarithmic and polar systems are currently absent, not migrated existing features. Their mathematical implementation and new persistent axes/origin style semantics remain separate follow-up proposals. Existing product requirements and all 54 gap-analysis entries remain in scope.

## M2c implementation checkpoint

All four UX checkpoints delivered against specification1.1 after explicit full-milestone approval. Technical Node/Edge verification PASS; user functional and visual acceptance pending. See M2c-REPORT.md. M4b and deferred geometry/presentation extensions have not started.

## M4b implementation checkpoint ? 2026-10-09

User accepted the complete M2c/UI trajectory and explicitly requested M4b. Semantic command sequences and deterministic isolated replay, plus author-only construction source editing, are delivered; see M4b-COMMAND-REPLAY-CONTRACT.md and M4b-REPORT.md. Technical validation PASS (293 Node tests, full Edge suite and final targeted source/replay check). User acceptance pending. No automatic editor recording or playback UI; M14 remains separate. M5a has not started.

## M5a implementation checkpoint ? 2026-10-09

User accepted M4b and explicitly requested M5a. Linked segments between existing points and parameterized points on finite segments/polygon edges and circles are delivered in the existing graph and command path. New recipes use constructionSchema 2; old recipes and geometry golden fixtures retain their format. Author tools/source editor/position slider and deterministic replay are included. No constrained drag controller, learner parameter grant, intersections, derived circles, locus or trace added. See M5a-LINKED-PATH-CONTRACT.md and M5a-REPORT.md. User acceptance pending; M5b has not started.

## Post-M5a additions - agreed sequencing (2026-10-10)

Product source: [Post-M5a specification 1.3.0](POST-M5A-ENHANCEMENTS-SPEC.md). All original milestones remain in scope. The user authorized the first two additions and roadmap documentation only. Later rows are planned, not implementation authorization.

| Placement | Addition | Dependencies and acceptance |
|---|---|---|
| Before M5b: defaults | New editor document grid on; centrally red newly created constructions | Preserve saved presentation, existing styles and overrides; no import recoloring |
| Before M5b: instructions | Declarative step instructions for every draw/measure/construction tool | Existing interaction owner; valid/invalid source progress, alternatives, cancel, keyboard/screen reader and fullscreen |
| M5b, separate checkpoint | Tangent at a linked point on circle | Preserve existing external/on/interior cases, branches, identity and schema; audit what already works before extending |
| After M5b, before dynamic text | Units, scale and measurement notation | New default cm, 1 coordinate unit = 1 cm, precision 2; axis inspector; length scale and area scale squared; preserve legacy display without migration (see UNITS-SCALE-CONTRACT.md) |
| Directly after units | Dynamic text bindings | Stable typed references and common unit formatting; define invalid/deleted source semantics first; templates later |
| M8 alongside parallelogram, optionally separate after M5b | Regular polygon | Center/vertex/n contract, consistent side/angle/area, zero-radius policy and referenced topology policy |
| M7-VEC-FUND | Linked vector AB and component representation | Approved design v1.0.0; future translation consumes vector source, implementation still pending |
| M7f | Vector algebra and visualizations | Add/subtract/scalar/dot/angle/projection; units and zero-vector cases; small checkpoints |
| Separate stream after M5-M6 | Sets: semantic core, then Venn/Euler and number-line views separately | Typed operations; mathematically valid conversions only; intervals/open boundaries/unbounded components |
| At/after M11 | Sets in coordinate plane | Reuse safe expression/numeric groundwork where appropriate; robust boundary and region evaluation, no arbitrary code |

Each checkpoint requires its own contract, tests and manual acceptance. Unit legacy behavior, dynamic-text deletion, vector degeneracy and set schemas are design decisions rather than implicit defaults. No M5b or later feature is implemented by this addition.

The M5a status above is historical: direct author dragging of path points has since been added in the existing pointer lifecycle, with parameter projection, cancellation and one-step undo. Inspector heading names are editable and relations precede appearance. Both changes were pushed at bfc5c79.

Defaults and tool instructions delivered at 29f4d49: 302 Node tests and 34 Edge modules pass; manual acceptance pending. See [report](POST-M5A-UX-REPORT.md). Later additions remain planned.

## M5b first family checkpoint (2026-10-10)

Main baseline e3db593 was published after merging the accepted authoring work with main. New branch chatgpt/math-illustration-m5b. Linked line intersection delivered at cdc6f0a; 306 Node tests and 35 Edge modules pass. See [report](M5b-LINE-INTERSECTION-REPORT.md) and [contract](M5b-LINE-INTERSECTION-CONTRACT.md). Manual acceptance pending. Next separate families: line-circle, circle-circle and derived circles, plus tangent-at-linked-circle-point audit. M5b as a whole remains in progress. New changes may be pushed to this development branch under user authorization; merging future changes into main requires another request.

## M5b line-circle checkpoint (2026-10-10)

User accepted line-line intersections. Line-circle intersections delivered at f218e47 on chatgpt/math-illustration-m5b: 311 Node tests, 36 Edge modules pass. See [report](M5b-LINE-CIRCLE-REPORT.md) and [contract](M5b-LINE-CIRCLE-CONTRACT.md). Manual acceptance pending. Next separate checkpoint: circle-circle, then derived circles and tangent-at-linked-circle-point audit. Main unchanged.

## M5b circle-circle checkpoint (2026-10-10)

Line-circle manually accepted. Circle-circle delivered at 785c10f on chatgpt/math-illustration-m5b: 316 Node tests and 37 Edge modules pass, visual review complete. See [report](M5b-CIRCLE-CIRCLE-REPORT.md) and [contract](M5b-CIRCLE-CIRCLE-CONTRACT.md). Manual acceptance pending. Next checkpoint: derived circles; linked-point tangent audit still pending. Main unchanged.

## Point construction menu refinement (2026-10-10)

At user request, all six point-producing construction tools are grouped in one remembered split-button, preserving full-screen and permission behavior. Browser validation and visual review pass; see [report](POINT-CONSTRUCTION-MENU-REPORT.md). Geometry milestone sequencing unchanged.

## M5b derived circle checkpoint (2026-10-10)

Center/perimeter-source circle delivered at a502c55 on chatgpt/math-illustration-m5b, with 321 Node tests and 38 Edge modules passing. See [report](M5b-DERIVED-CIRCLE-REPORT.md) and [contract](M5b-DERIVED-CIRCLE-CONTRACT.md). Manual acceptance pending. Next: linked-point tangent audit/extension; M6 triangle circles remain separate. Main unchanged.

## Linked shape menu refinement (2026-10-10)

Cirkel via punten and Lijnstuk door twee punten are now separate visible choices in Constructies. The linked segment is available directly instead of only inside the former split menu; see [line segment behavior report](LINE-SEGMENT-BEHAVIOR-REPORT.md). Geometry milestone sequencing unchanged.

## M5b technical completion (2026-10-10)

Final linked-point tangent audit completed at 42fd06e: shared contact-count tolerance and selected path-point hit priority fix, existing tangent recipe/schema preserved. Full 326 Node tests and 39 Edge modules pass; see [report](M5b-LINKED-TANGENT-REPORT.md). M5b technical scope complete; manual acceptance pending for final checkpoint. After acceptance, agreed next addition is units/scale/measurement notation, then dynamic text, with explicit legacy policy first. M6 remains retained. Main unchanged; branch publication authorized.

## Units, scale and measurement notation checkpoint (2026-10-10)

User accepted the M5b checkpoint and authorized the full units/scale/notation step. Delivered at 77733a7, with 331 Node tests and 40 Edge modules passing: document meta.measurement schema 1 with cm/1/2 defaults for new author documents; absent metadata preserves legacy display until an explicit edit. Length/radius/perimeter scale linearly; area scales quadratically; angles remain degrees. Axis inspector, display-unit exact drawing, physical-unit conversion, author command/history/replay, JSON/SVG persistence and restricted read-only display/export included. See [contract](UNITS-SCALE-CONTRACT.md) and [report](UNITS-SCALE-REPORT.md) for test evidence and manual acceptance. Dynamic text bindings are next, separately scoped; M6 and all later roadmap requirements remain retained. Publication on chatgpt/math-illustration-m5b authorized; main unchanged.

## Point coordinate projections checkpoint (2026-10-10)

User authorized specification 1.4.0 section 9, newly added on main f166078. Implemented at a39a779 as a standalone post-units checkpoint: point presentation options, explicit Cartesian frame, signed document-unit values, clipped dotted helpers, lock/permission/history/replay/export support and fullscreen inspector access. 338 Node tests and 41 Edge modules pass; see [contract](POINT-PROJECTIONS-CONTRACT.md) and [report](POINT-PROJECTIONS-REPORT.md). Manual acceptance pending. Helpers add no objects or graph dependencies. Multiple/skew frames and dynamic text remain separate future work; all other roadmap requirements retained. Development-branch publication authorized, main unchanged.

## Dynamic angles and angle units checkpoint (2026-10-10)

User authorized specification 1.5.0 section 10. Delivered at 78d0259: linked three-point, two-direction and positive-x-axis measurements, smallest/directed range, document degree/radian defaults with independent measurement overrides, precision and arc controls. Existing graph/identity, style/label offsets, locks, policy, schema 2, history/replay and exports retained. Full 346 Node tests and 42 Edge modules pass; see [contract](DYNAMIC-ANGLES-CONTRACT.md) and [report](DYNAMIC-ANGLES-REPORT.md). Manual acceptance pending. Multiple/skew frames, broad dynamic measurement expansion and dynamic text remain separately scoped; all other roadmap requirements retained. Publication to development branch authorized; main unchanged.


## Dynamic text checkpoint (2026-10-10)

User authorized the next step while postponing manual angle testing. Dynamic text bindings delivered: one stable geometry-source value per free text object, source/value/precision/prefix/suffix inspector, shared units and angle notation, explicit unavailable-on-deletion policy, locks/property permissions/history/replay/persistence/fullscreen. 352 Node tests and 43 Edge modules pass; see DYNAMIC-TEXT-CONTRACT.md and DYNAMIC-TEXT-REPORT.md. Both current manual tests remain pending. Multi-field templates are deferred as specified. Next retained original geometry milestone: M6 triangle centers/circles. Development branch publication authorized; main unchanged.


## Cartesian axis-source angle revision (2026-10-11)

After manual angle feedback, user authorized inventory/contract-first revision: typed positive x/y sources in angleDirections only, origin/intersection policy, explicit restricted per-axis grants, constructionSchema 3, interaction feedback and legacy angleXAxis compatibility. Separate x-axis menu entry removed. See AXIS-REFERENCES-CONTRACT.md and AXIS-REFERENCES-REPORT.md. Manual acceptance pending; this feedback is not a PASS for the earlier angle step. Original M6 and later additions remain retained; dynamic text acceptance also pending. Publication authorized on chatgpt/math-illustration-m5b only; main unchanged.

- 2026-10-11 sidebar refinement: vertically stacked, equally wide tool buttons in a 220px sidebar; long names and split-menu bounds verified at desktop, tablet and mobile widths.

- Sidebar follow-up: static angle and right-angle drawing moved into the basic linear split button; measuring retains linked angle tools. All editor assets receive version 20261011-tool-sidebar to refresh cached CSS/JavaScript.
  Validation: complete Edge regression suite passed; stacked layout and menu containment checked at five widths, including 1159 pixels; zero page errors.

2026-10-11 angle-arm correction: for object-only angleDirections, finite undirected line/dimension/polygon-edge sources whose intersection lies within their segment use the outward arm toward the farther endpoint (midpoint tie retains stored direction). This makes shared endpoint angles independent of endpoint order and chooses the longer arm for interior crossings. Ray/vector and axis combinations retain directed semantics; supporting intersection and outside-domain fallback remain unchanged. Smallest/directed settings continue to use the resolved arms. Saved angleDirections measurements recalculate using this corrected policy; angleXAxis remains unchanged.

2026-10-11 clicked-arm follow-up: object-only angleDirections captures each click transiently, then persists arm:start/end on undirected line/straight/dimension/polygon-edge references according to the clicked side of the supporting intersection. Positive ray/vector and axis semantics remain unchanged. Arm identity follows source endpoint order during recomputation; click coordinates are not saved. Schema 4 is required for explicit arms; legacy recipes without arm retain the previous outward/farther-end fallback. Exactly at the intersection uses that fallback. Source rebinding resets the changed slot to fallback; unchanged slots preserve their arm.

## Standalone repository (2026-10-11)

Editor moved to Geert1985/wiskundige-illustratie-editor with 244 historical editor commits and latest implementation from 73333a0. New project root replaces math-illustration/. Source-main cleanup: 94a6d4a; standalone baseline: c4bf129. All future editor changes belong on chatgpt/editor-development in the new repository; earlier main-publication restrictions referred to the old repository. Roadmap scope and pending manual acceptance remain unchanged. See REPOSITORY-MIGRATION.md.

2026-10-11 axis-arm extension: explicit clicked start/end arms now apply to undirected lines in angleDirections axis combinations as well. The Cartesian axis remains positive; axis sources never carry arm. Legacy combinations without an explicit arm preserve their stored-direction behavior. Rays/vectors retain orientation. Schema 4 persists the line arm and schema 3 remains unchanged for axis-only/legacy refs.

## Geavanceerde teksteditor T1–T5 (2026-10-11)

Status: fase 0 onderzocht; architectuur en plan voorgesteld, gebruikersgoedkeuring vereist. Dit vervangt de vage toekomstige uitbreiding naar tekstsjablonen door afzonderlijke checkpoints, zonder bestaande milestones voltooid te verklaren.

- Fase 0: TEXT-EDITOR-ARCHITECTURE.md en TEXT-EDITOR-IMPLEMENTATION-PLAN.md; baseline 364 Node-tests en 1 volledige Edge-suite geslaagd.
- T1: gestructureerde rich text, dialoog, fragmentopmaak, gedeelde SVG-preview, migratie/permissies/history.
- T2: inline symbolen en veilige formules, inclusief offline exportproeven.
- T3: meerdere dynamische bronvelden en gecontroleerde afhankelijkheden.
- T4: gemengde lay-out, zelfstandige SVG/PNG en toegankelijkheid.
- T5a: UI-onafhankelijke veilige parser/AST, dimensies, eenheden en numeriek contract; gedeelde geautoriseerde geometriebronadapter buiten de kern.
- T5b: één herbruikbare wetenschappelijke calculator-interface; zelfstandig via hoofdwerkbalk en inline via ∑, uitsluitend voorbereiden/evalueren.
- T5c: calculatedValue-inlinevelden invoegen/bewerken via dezelfde calculator; drie weergavemodi, v7/textSchema 4.
- T5d: audit van beide calculatormodi, inclusief export, security, toegankelijkheid en fullscreen.

Elke stap vereist afzonderlijke technische verificatie, rapport en expliciete gebruikersacceptatie. T1 is nog niet gestart. Werk uitsluitend op chatgpt/editor-development; geen automatische merge naar main. Zie de architectuur voor open ontwerpkeuzes en het plan voor concrete taken en handmatige acceptatie.


## T2 checkpoint (2026-10-12)

User explicitly authorized T2 after T1. Delivered: symbols/search/bookmarks, atomic inline math with safe source notation, textSchema 2 in v7, shared offline glyph renderer, bounded local assets, permission categories and reproducible builds. See [T2-REPORT.md](T2-REPORT.md) for the measured MathJax/KaTeX comparison and exact regression evidence. Real IME/AT and manual visual/external-viewer acceptance remain open; historical statements that T1 has not started are superseded by the T1/T2 reports. Await T2 acceptance; T3 not started. No main merge.


## T3 checkpoint (2026-10-12)

Explicit user authorization superseded the T2 stop gate. Delivered: schema-3 inline source values, source/property/notation chooser, current snapshot resolution and reverse dependency index, explicit legacy migration/static backup, category/source grants, redacted export, copied-source remapping and history/replay. See T3-CONTRACT.md and T3-REPORT.md for actual tests and remaining manual controls. No new dependencies; no T4 wrapping/PNG UI or T5 expression engine. Await T3 user acceptance before the next step; development branch only.


## T5 shared calculator design checkpoint (2026-10-12)

Functionally approved, **not implemented**. This documentation-only checkpoint starts/restarts no T3, T4 or T5 implementation. Normative contract and seven required acceptance scenarios: [architecture section 22](TEXT-EDITOR-ARCHITECTURE.md#22-t5--zelfstandige-en-inline-wetenschappelijke-rekenmachine-150); sequencing: [implementation plan](TEXT-EDITOR-IMPLEMENTATION-PLAN.md). These clarify all earlier generic T5 calculator entries.

The scientific calculator becomes a **standalone application feature** as well as a text-editor tool. Develop only **one UI-independent calculation engine and one reusable calculator interface**, with thin host adapters. Standalone opens from the main toolbar without a text object/selection, including on an empty document and in fullscreen. Inline opens through ∑. Both share scientific functions, authorized dynamic geometric quantities, automatic recalculation, units/scale, precision, degrees/radians, errors and explicit result copying. Standalone must create no document objects, mutations or undo items.

| Checkpoint | Required scope / gate |
|---|---|
| T5a | Safe parser/AST, dimension/unit/evaluation contract without ProseMirror/DOM/text-object/UI dependencies; retain definitive mathematical contract approval before start |
| T5b | Both entry points, shared component/source adapter, private drafts, identical numeric results and authorization; inline prepare/evaluate only, no insertion |
| T5c | Enable insertion/editing of typed calculatedValue in the same component; result / formula+result / substituted formula+result; one outer text commit, JSON/history/SVG/PNG and legacy compatibility |
| T5d | Audit standalone and inline, restricted leaks/revocation/stale caches, keyboard/focus/Escape/Cancel, fullscreen, accessibility and offline export |

Each step retains its own technical report, tests, explicit acceptance and separately authorized start. The functional extension does not grant blanket implementation permission or waive the T5a mathematical gate. Test toolbar `2+3*4=14` without history/object changes; `sin(30 deg)=0.5`; changing a circle radius and its computed area; parity between contexts; restricted data denial; T5c editing/history/JSON/SVG/three modes; and focus/keyboard/Escape/fullscreen/cancellation in both contexts. These are future required tests, not current PASS claims.

Future function graphs, parametric constructions and exercises may reuse this engine through their own validated adapters and permissions. They remain future backlog work, not delivered by T5 calculator design. Existing v7 structured text, legacy support, mathematical requirements and unrelated geometry milestones remain retained.


## T4 implementation checkpoint (2026-10-12)

Explicitly authorized and delivered for user acceptance: optional fixed text width with mixed wrapping, local width history/format grants, atomic math/source values, shared canvas/export layout and stable anchors; production SVG/PNG controls with local asset readiness, native-font PNG rastering, layer preservation, quotas and revision/epoch delivery guards. Legacy v7/schema 1–3 and metadata/binding compatibility retained. See [T4 contract](T4-CONTRACT.md) and [T4 report](T4-REPORT.md) for actual test/measurement evidence and remaining manual controls. No new dependencies. Await T4 acceptance; T5a additionally requires definitive mathematical contract approval and explicit start. The approved standalone/inline shared calculator design remains unimplemented.

## T5-prep — Modernisering teksteditor en gedeelde wiskundige invoer (2026-10-12)

I1-I4 zijn technisch geïntegreerd en gepusht naar chatgpt/editor-development na gerichte T4-regressiecontrole. Dit sluit de afzonderlijke handmatige T4-acceptatie niet af. De uitvoering wacht op T5-prep-acceptatie. De mijlpaal T5a–T5d blijft uitsluitend gereserveerd voor de wetenschappelijke rekenmachine.

De geïntegreerde UI gebruikt een compacte responsieve teksteditor met contextuele overlay, stabiele actiezone, centrale symboolcatalogus met stabiele IDs en een gedeelde invoeglaag voor gewone tekst en formules. Formulecursorselecties blijven gescheiden van ProseMirror-bookmarks; sjablonen selecteren het eerste argument. Dynamische waarden gebruiken alleen bestaande geautoriseerde sourceOptions/resolveTextValue- en TextValues-paden. Document v7, textSchema 1-3, legacy textBinding en exportschema's zijn niet gewijzigd. Zie [T5-PREP-INTEGRATION-REPORT.md](T5-PREP-INTEGRATION-REPORT.md), [voorstel v1.2.0](T5-TEXT-EDITOR-MODERNIZATION-PROPOSAL.md) en [prototype-rapport](T5-PREP-UI-PROTOTYPE-REPORT.md).

| Statuspoort | Huidige status |
|---|---|
| T4 handmatige acceptatie | Open; regressietests alleen sluiten deze poort niet. |
| T5-prep I1-I4 | Technisch geleverd, automatische tests groen, wacht op handmatige gebruikersacceptatie. |
| T5a | Niet gestart. Vereist T4-acceptatie, T5-prep-acceptatie, definitieve goedkeuring van het mathematische contract en expliciete starttoestemming. |

Niet uitgevoerd: echte IME-/schermlezeracceptatie, finale handmatige visuele review en vergelijking op meerdere besturingssystemen. De prototype-mock is niet in productie gebruikt.

### T5-prep UX-verfijning (2026-10-12)

De editor gebruikt nu vier semantische lettergroottepresetknoppen binnen de bestaande SVG-pixelschaal, één gedeelde palettebron voor geometrie en tekst, een logaritmische breedteslider over de bestaande 1–1.000.000 px grenzen, drie alineauitlijningsiconen, actuele/mixed opmaakstatus en lokale undo/redo-bediening. “Symbolen & structuren” hergebruikt de centrale catalogus en bestaande formule-/invoegarchitectuur. Geen documentmodel-, schema-, permissie-, opslag- of exportcontract is aangepast.

Status: code- en regressiewerk technisch geleverd; wacht op handmatige gebruikersacceptatie. Rapport: [T5-PREP-UX-REFINEMENT-REPORT.md](T5-PREP-UX-REFINEMENT-REPORT.md). De exacte geautomatiseerde Node-/Edge-resultaten en resterende handmatige punten staan daar. T4-acceptatie blijft apart open. T5a is niet gestart en houdt de bestaande voorwaarden: T4-acceptatie, T5-prep-acceptatie, definitieve mathematische-contractgoedkeuring en expliciete starttoestemming.

### T5-prep Deel A — definitieve editorwerkruimte (2026-10-12, documentatie 2.0.0)

Het permanente invoegpaneel heeft exact twee tabs: Formule en Waarden. De Formule-tab bevat de LaTeX-bron, zoek-/categoriegestuurde symbolen- en formulecatalogus, preview en expliciete invoeg-/bijwerkactie. Een catalogusklik schrijft LaTeX op de actieve bronselectie/cursorpositie; structuursjablonen selecteren het eerste invulveld. De catalogus maakt nooit op zichzelf een tekstformule-atoom aan. Waarden behoudt de bestaande dynamische-broneditor en rechten. Het ProseMirror-tekstvlak staat blijvend naast het paneel op wit met donkere tekst. De eerdere contextoverlay is verwijderd. De UI-breedteslider is verwijderd, terwijl bestaand `textContent.width` behouden blijft in opslag, rendering en export, zonder automatische wijziging. Deel A wijzigt geen documentversie, schema, permissies of exportcontract. De desktop tweekolomsindeling volgt de aangeleverde visuele referentie; small-screen fallback blijft ondersteund maar is geen primaire ontwerpdoelstelling.

Status: technisch geleverd en gepusht na regressiecontrole; wacht op handmatige acceptatie. Rapport en screenshotset: [T5-PREP-FINAL-UX-DEEL-A-REPORT.md](T5-PREP-FINAL-UX-DEEL-A-REPORT.md). T4-acceptatie blijft afzonderlijk open. Deel B canvas-resizing vereist afzonderlijke toestemming. T5a blijft onder de bestaande acceptatie- en mathematische-gates.

## T5a — independent calculation engine (2026-10-12)

Executed after definitive approval of architecture section 14 v1.12.0 and numeric acceptance v1.0.0, followed by explicit GO. Branch: `chatgpt/t5-calculator`, based on main. Current T5a status here supersedes historical not-started notes; earlier unexecuted manual checks are not claimed as performed.

Delivered: UI/document-independent safe parser, typed/canonical AST and codec, dimensional quantities, exact binary64 decimal quantization, unit conversion, principal angles, domain/range guards and printers. A separate shared geometry source adapter reuses current read/display/property/layer rights and enforces revision/epoch freshness. One pure engine remains reusable by later calculators, graphs, parametric geometry and exercises; those future functions are not implemented.

The 56 additional scenarios and original mathematical matrix are automated, with independent numerical references and Node/Edge regression evidence. [T5a-REPORT.md](T5a-REPORT.md) records actual outcomes and limitations. No T5b calculator interface, T5c calculatedValue fields or schema-4 document change. Stop for T5a user acceptance; T5b still requires an explicit start instruction.

## Text editor full workspace — separate UX delivery (2026-10-12)

Implemented on `chatgpt/text-editor-full-workspace`, based on the user-selected `chatgpt/t5-calculator` commit `ec750d3`. Full application workspace mode, three desktop columns, context preview/actions, top-level text commit and a More menu for the existing disabled text-JSON placeholders. Calculator engine and mathematical contract unchanged; T5b/T5c not started. No tests or verification sessions performed by explicit user instruction; manual acceptance remains open. See [implementation report](TEXT-EDITOR-FULL-WORKSPACE-REPORT.md). Historical T5a test evidence applies to its own delivery, not to this untested UX change.

## T5b calculator versus future function plotting — product boundary (2026-10-12, v2.3.0)

**Confirmed architecture decision:** build **one scientific calculator, not a second graphing calculator or parallel graphing canvas**. T5b reuses the existing T5a numerical/AST/unit engine and source-policy adapter; its Texas Instruments-inspired keypad/display are UI inspiration, not a replacement for the current app's appearance or a literal clone. Keep the established standalone toolbar and inline `∑` entry points, one shared component, private state, authorized source chips, re-evaluation, unit/angle/precision options and explicit result copying. A compact panel is preferred; exact placement, optional dragging, mobile behavior, accessibility/focus, Escape order and clipboard formatting still require user review before an implementation request.

**Function-plotting direction (future, separate milestone to be scoped):** render `f(x)` and parametric/geometric visualizations on the **existing illustration canvas and coordinate system**; integrate parameters, interactive sliders, tabular values and geometric analysis into that editor rather than duplicating them inside the calculator. The present T5a AST does not yet provide a free variable/function-definition language. Any variable-aware evaluator, domain/sampling/discontinuity policy and graph-object/document contract require separate design, numerical tests, user approval and implementation authorization. Do **not** count this capability as part of T5b/T5c/T5d or mark it delivered.

**Milestone gates unchanged:** T5b = calculate/preview only in both hosts, no graphing and no document/inline-draft mutations; T5c = `calculatedValue` with textSchema 4 and three result displays only after separate acceptance; T5d = independent integration/security/accessibility/export audit. Keep document v7, old text schemas and the mathematical contract intact. Existing acceptance scenarios in [architecture section 22](TEXT-EDITOR-ARCHITECTURE.md#22-t5--zelfstandige-en-inline-wetenschappelijke-rekenmachine-150) remain mandatory when implementing T5b. This update is documentation-only, **not an instruction to start T5b code**.

**Latest project status:** T5a audited and accepted, two audit corrections resolved, full text workspace manually accepted, Node suite user-reported **573 PASS / 0 FAIL / 0 SKIP**, all merged into `main`. The latest combined Edge suite has **not** been rerun; historical Edge PASS figures belong to earlier T5a checkpoints. Earlier unaccepted/unmerged status notes above are preserved as history and superseded by this checkpoint. Next decision: approve the detailed calculator interface, then authorize a dedicated implementation branch from `main`.


## TI-36X Pro roadmap amendment (2026-10-12, v2.4.0)

Source: user-provided `From_Zero_2_Infinity_Wiskunde_Illustrator_Roadmap_TI36X_Pro_v2.1.0.json` (My Project Manager checklist v2.1.0, formatVersion 1, exported 2026-10-12T18:03:21.598Z). This is a planning export, not a unified-diff patch. The subsequently supplied DEVELOPMENT-ROADMAP_TI36X_v2.4.0.patch is incorporated below, preserving the detailed JSON checklists and source status ledger. No project-manager account was imported or synchronized.

### Order, scope and acceptance

1. Retain accepted T5a and the integrated text workspace on main. The latest combined Node result is 573 PASS / 0 FAIL / 0 SKIP; no new execution in this documentation update. Latest combined Edge execution and historical manual T4/T5-prep gates remain open.
2. Next geometry milestones: **M6a** centroid/circumcenter/orthocenter and **M6b** incenter/incircle/Euler line/nine-point circle, with dynamic dependencies, degeneracy handling, test evidence and separate acceptance. No M6 implementation is started here.
3. After the M6 geometry checkpoints, separately design and approve **T5b**, then accept it before **T5c**, and accept T5c before **T5d**. A sufficiently stable illustration basis is required, not completion of every M1–M20 feature.
4. T5b is one **floating draggable scientific calculator** in two hosts (toolbar and inline `∑`), with no graph canvas, no document/selection/history/text-draft mutations and no second evaluator. Detailed dimensions, focus/Escape, viewport containment and clipboard contract remain design gates. This updates the earlier optional-dragging preference: dragging is now a planned requirement, not implemented behavior.
5. T5b phase 1 exposes only the existing T5a language: abs/sqrt/sin/cos/tan/asin/acos/atan/ln/log10/exp/round/floor/ceil/trunc, approved operators, π/e, units and typed geometry sources. Natural templates, multiline input, SHIFT/ALPHA and navigation are design directions; no nonfunctional future-function keys may be presented as working. Private DEG/RAD overrides require a reviewed adapter contract; do not mutate document angle settings.
6. Functional TI-36X Pro parity is a long-term objective in **K1–K8**. Exact numbers, complex values, variables, matrices and extra dimensions require new separately approved typed contracts. They do not silently expand or change accepted T5a binary64 semantics.
7. M7 geometry/vector services, M11 plots and M12 calculus coordinate with K2/K4/K5. One shared safe function/evaluation service; graph document objects, domain/sampling/discontinuities and rendering remain in the illustrator. Tables may have different hosts but share evaluation, quota and authorization rules.

All M1–M20, sets, vector, viewer/course/assessment and publishing requirements remain retained. The 105-point inventory mentioned in the export is a **concept work register including FZI requirements and out-of-scope items**, not an official TI function count and not attached here. Verification against the official TI manual remains open; this update makes no hardware parity claim.

### Future calculator packages (all not started)

| Package | Planned scope | Dependencies/contract gate |
|---|---|---|
| K1 — Exacte getallen, reële functies en TI-notaties | Breuken, algebraïsche wortel-/π-notatie en nieuwe getypeerde exacte waarden. Gaat verder dan huidige binary64-engine. | Separate exact-value/AST/codec/format contract; preserve binary64 compatibility |
| K2 — Gebonden variabelen, geheugen en functies | Ans, calculatorgeheugen en een veilige gedeelde f(x)-dienst voor TI-tabellen en M11-plots. | Typed binding/scope, private memory/history, bounded functions shared with M11 |
| K3 — Statistiek, regressie en verdelingen | TI-lijsten L1–L3, 1-/2-variabelestatistiek, regressiemodellen en kansverdelingen. | Typed lists, statistical definitions and independent numerical oracles |
| K4 — Matrices en vectoren | Rekenservices voor numerieke matrix-/vectorobjecten; hergebruik waar mogelijk geometrische M7-vectorwiskunde. | Typed matrix/vector dimensions, units, conditioning; coordinate with M7 |
| K5 — Numerieke analyse en vergelijkingoplossers | nDeriv, bepaalde integraal, numerieke solve, veeltermgraad 2/3, lineaire 2×2/3×3; afhankelijk K2 en voor stelsels K4. | K2; K4 for linear systems; K6 for complex outputs; shared M12 routines |
| K6 — Complexe getallen | Complex a+bi, polar/rect en complexe berekeningen als apart getypeerd waardemodel. | Separate complex type and branch-cut/domain rules; no implicit coercion |
| K7 — Getallenstelsels, constanten en conversies | TI-DEC/BIN/OCT/HEX, bitlogica, natuurkundige constanten, bredere SI/US-conversies. | Integer widths and additional SI dimensions; versioned constants/conversions |
| K8 — Definitieve TI-36X Pro functionele pariteitsaudit | Inventaris en officiële handleiding systematisch vergelijken; alle niet-ondersteunde cases zichtbaar openhouden. | Evidence and official-manual reconciliation after relevant package acceptances |

Every K package requires contract approval, independent mathematical/technical cases, Node/Edge and security/compatibility evidence, documentation/review and explicit user acceptance. K8 must classify each inventory point as supported, deviation, exception, FZI-only or outside scope; absence remains visible. No release can be marked parity-complete by checklist status alone.

### Detailed new package checklist

#### T5b — TI-geïnspireerde wetenschappelijke rekenmachine (fase 1) — `not_started`

Een gedeelde standalone/inline calculatorcomponent op basis van de bestaande T5a-API; uitsluitend bestaande functies, GEEN tweede grafiekcanvas en GEEN documentmutatie. Zwevend en versleepbaar venster gekozen. Niet gestart; eerst apart ontwerp- en startakkoord. Afhankelijkheid: illustratorbasis voldoende stabiel, maar niet volledige M1–M20.

- **Nieuw definitief UX-contract ontwerpen en goedkeuren** (`not_started`): Vervang het eerdere compacte T5b v1.0.0-ontwerp: TI-36X Pro-achtige invoer, natuurlijke templates, meerregelige weergave, SHIFT/ALPHA en navigatietoetsen; geen niet-werkende functietoetsen.
- **Toetsen-/functie-inventaris koppelen aan T5a-AST** (`not_started`): Toegestane knoppen abs/sqrt/sin/cos/tan/asin/acos/atan/ln/log10/exp/round/floor/ceil/trunc, bewerkingen, π/e en units; toekomstige functies pas tonen zodra ze werken.
- **Floating draggable calculator en responsief gedrag** (`not_started`): Blijft binnen viewport, werkt bij zoom/browserfullscreen, kan versleept en gesloten worden; sluit zonder canvasselectie te veranderen.
- **Fysiek toetsenbord, toegankelijkheid en focus/Escape-contract** (`not_started`): Cursor, selectie, undo/redo privaat, toetsenmapping, SR/ARIA, IME, Escape-kindpaneel eerst en focusherstel in twee hosts.
- **Typed geometrische bronkiezer ontwikkelen** (`not_started`): Bronselectie via geautoriseerde IDs/properties, nooit vrij objectnaamzoeken; bronlabels pas na read/display autorisatie.
- **Private DEG/RAD-instelling zonder documentmutatie** (`not_started`): Adapter gebruikt nu documenthoekinstelling; expliciete calculatoroverride met volledige revisie/epoch-autorisatie en legacydefaults ontwerpen.
- **Natuurlijke invoer en lineaire AST-normalisatie laten samenwerken** (`not_started`): Eerst gevalideerde inputtokens en roundtrip; geen TeX als uitvoerbare evaluator-taal. Geef geldige parsefouten en quota.
- **Resultaatpaneel, unit/precisie, foutcode en copy-contract** (`not_started`): Zichtbare ≈/afgeronde nul; kopieer uitsluitend bij expliciete klik na actuele autorisatie en zonder verboden labels.
- **Twee hostadapters en private berekeningsgeschiedenis** (`not_started`): Hoofdwerkbalk/standalone plus ∑ binnen tekst; calculator-undo los van document undo; zonder eigen berekeningsmotor.
- **Security- en invarianttests in Node/Edge** (`not_started`): Geen document-JSON/revision/selectie/history/TextDraft-mutaties; bewijs hostpariteit, bronintrekking, permissiies, quota, clipboard en fullscreen.
- **Afzonderlijke T5b-rapportage en gebruikersacceptatie** (`not_started`): Meet echte testresultaten, registreer browsertests vs handmatige nog open controles, ontvang GO voor T5c.

#### T5c — Berekende velden in tekst (bestaande milestone) — `not_started`

Na afzonderlijke T5b-acceptatie; calculatedValue onder textSchema 4 binnen document v7; één gedeelde calculatorcomponent, geen tweede implementatie.

- **Schema-4 calculatedValue payload en permissies definitief ontwerpen** (`not_started`): Versionering, typed bronnen, AST/format/marks, geen cached truth of illegale writes.
- **Invoegen vanuit ∑ alleen na expliciete T5c-GO** (`not_started`): Resultaat/formule+resultaat/substitutie+resultaat als getypeerd fragment in private tekstdraft.
- **Bestaand berekend tekstveld heropenen en bewerken** (`not_started`): Annuleren exact ongewijzigd; commit is één teksttransactie met correct undo/redo.
- **Live bronupdate en autorisatieregressie** (`not_started`): Onbeschikbare en revoked bron geeft redactie; geen data in clipboard/DOM/offline export.
- **JSON v7, history, remap, offline SVG/PNG en legacy** (`not_started`): Volledig roundtripbewijs voor oud/nieuw document en drie weergavemodi.
- **T5c rapport en afzonderlijke acceptatie** (`not_started`): Stop voor T5d tot gebruiker akkoord geeft.

#### T5d — Calculatorintegratie en beveiligingsaudit (bestaande milestone) — `not_started`

Integratieaudit na T5c. Niet gebruiken als uitstel van tests die al bij T5b/T5c verplicht zijn.

- **Node/Edge-matrix in beide calculatorhosts** (`not_started`): Exacte bron-, unit-, hoek- en binary64-pariteit plus volledige regressies.
- **Restricted privacy, bronintrekking en session epoch** (`not_started`): Geen verboden ID/naam/waarde via clipboard, DOM, foutmelding, diagnostics of export.
- **Accessible keyboard, focus, IME en Escape bij fullscreen** (`not_started`): Browsers, schermgroottes en keyboardroutes aantoonbaar testen, handmatige bevindingen expliciet.
- **Opslag/export, documenthistory en legacy regressie** (`not_started`): Geen ongeautoriseerde mutaties, duplicate evaluator of verborgen documentdata.
- **Rapport, resterende risico’s en finale gebruikersacceptatie** (`not_started`): T5d-REPORT met exacte resultaten, beperkingen en expliciete finale GO.

#### Gedeelde functieservice — M11/M12 en K2/K5 — `not_started`

De calculator heeft geen grafiekcanvas; functiedefinities en numerieke analysemethoden mogen gedeeld worden met de illustrator. Coördineer vooral met de bestaande M11- en M12-taken.

- **Eén veilig functiedefinitie- en variabelencontract** (`not_started`): K2 definieert getypeerde f(x), variabelen en begrensde evaluatie; M11 kan dit hergebruiken zonder nieuwe evaluator.
- **Documentobject voor functiegrafiek uitsluitend in illustrator** (`not_started`): M11 beheert sampling, domein, discontinuïteiten, rendering, assen en export; calculator beheert geen canvas.
- **TI-functietabel hergebruikt dezelfde K2-service** (`not_started`): Calculator en editor kunnen tabellen presenteren, maar delen evaluatielogica en numerieke quota.
- **Afgeleiden, integralen en nulpuntberekeningen delen K5-services** (`not_started`): Beveiligde algemene numerieke routine; verschil tussen numerieke benadering en exact wiskundig bewijs tonen.
- **Matrix/vector-lagen afstemmen op M7 geometrie** (`not_started`): Geen tweede onafhankelijke vectorformuleketen; scheid numerieke objecten van tekenobjecten.

#### K1 — Exacte getallen, reële functies en TI-notaties — `not_started`

Breuken, algebraïsche wortel-/π-notatie en nieuwe getypeerde exacte waarden. Gaat verder dan huidige binary64-engine. Voor productie: afzonderlijk goedgekeurd contract, onafhankelijke mathematische/technische testcases, Node/Edge-testresultaten, security/regressie, documentatie, review en expliciete acceptatie; niets stilzwijgend als voltooid markeren.

- **Contract voor getypeerde exacte reële resultaten ontwerpen** (`not_started`): Rationaal, wortel/π, afronding, vereenvoudiging, grenzen, negatief nul, mixed physical/abstract dimensions.
- **AST/schema/serialisatie en veilige exacte conversie ontwerpen** (`not_started`): Versioneer parser en printers; scheid getoond exact van binary64; compatibel met T5a-invariant en T5c.
- **Reële extra functies en getaltheorie implementeren** (`not_started`): n-de wortel, factorial, nPr/nCr, gcd/lcm, min/max, iPart/fPart, modulo; quotas.
- **Notaties MathPrint/CLASSIC, fraction/decimal, FIX/FLOAT/SCI/ENG** (`not_started`): Verschil tussen TI-classic en huidige operatorprioriteit expliciet; geen stille parserbreuk.
- **Node/Edge + onafhankelijke exacte oracles** (`not_started`): Exactheid bij half-way, grote getallen, dimensiemismatch, onderloop en nooit floats als exacte wortels verkopen.
- **K1-acceptatie en documentatie** (`not_started`): Eerst vrijgave poort na contract-, review- en testresultaten.

#### K2 — Gebonden variabelen, geheugen en functies — `not_started`

Ans, calculatorgeheugen en een veilige gedeelde f(x)-dienst voor TI-tabellen en M11-plots. Voor productie: afzonderlijk goedgekeurd contract, onafhankelijke mathematische/technische testcases, Node/Edge-testresultaten, security/regressie, documentatie, review en expliciete acceptatie; niets stilzwijgend als voltooid markeren.

- **Typed locals, Ans en naam-/scopebeleid ontwerpen** (`not_started`): Scheid functies/variabelen van geometrische ID-bronnen; geen vrij source name lookup.
- **Geheugen, herhaalde operatie en private historie implementeren** (`not_started`): Session-only tenzij latere privacytoestemming; veilige evaluatie/undo zonder document mutatie.
- **Functies f(x), evaluatie en bounded iteratie Σ/Π** (`not_started`): Geen eval/new Function; limieten voor diepte, stappen, iteraties en parameterwaarden.
- **Functietabellen en evaluatiedienst voor M11** (`not_started`): Delen van kern met illustrator, onafhankelijke hostadapter en veilige formatting.
- **Tests variabelenbinding/kwota/pariteit/revocation** (`not_started`): Floating calc ↔ tekst ↔ grafiek; geen actor-/documentlekkage.
- **K2-acceptatie** (`not_started`): Een release die niet stilzwijgend M11 als voltooid markeert.

#### K3 — Statistiek, regressie en verdelingen — `not_started`

TI-lijsten L1–L3, 1-/2-variabelestatistiek, regressiemodellen en kansverdelingen. Voor productie: afzonderlijk goedgekeurd contract, onafhankelijke mathematische/technische testcases, Node/Edge-testresultaten, security/regressie, documentatie, review en expliciete acceptatie; niets stilzwijgend als voltooid markeren.

- **Getypeerde lijsten en datastructuurcontract** (`not_started`): List memory, toegelaten grootte en missing/invalid behavior.
- **1D- en 2D-statistiek implementeren** (`not_started`): Populatie-/steekproef SD, quartielen, frequenties en correlaties.
- **Lineair, kwadratisch, kubisch, log, macht en exponentieel regressie** (`not_started`): Numerieke conditionering, domeinen en residudiagnostiek.
- **Normal-, binomiale en Poisson-pdf/cdf/inverse** (`not_started`): TI-getrouwe parameter- en foutsemantiek, tails en integergrenzen.
- **Datapresentatie, tabellen en modebediening** (`not_started`): Alleen de goedgekeurde statistiekfuncties zichtbaar als werkend.
- **Onafhankelijke referentietests en acceptatie** (`not_started`): Vergelijk betrouwbaar orakel plus handmatige scenario’s.

#### K4 — Matrices en vectoren — `not_started`

Rekenservices voor numerieke matrix-/vectorobjecten; hergebruik waar mogelijk geometrische M7-vectorwiskunde. Voor productie: afzonderlijk goedgekeurd contract, onafhankelijke mathematische/technische testcases, Node/Edge-testresultaten, security/regressie, documentatie, review en expliciete acceptatie; niets stilzwijgend als voltooid markeren.

- **Matrix- en vectortypecontracten vastleggen** (`not_started`): Toelaatbare dimensies, numerieke grenzen, unit-regels, serialisatie/formatter.
- **Basisalgebra: plus/min/scalair, matrixproduct en matrix × vector** (`not_started`): Valideer maten, associativiteit en geconditioneerde gevallen.
- **Determinant, inverse, transpose, REF/RREF** (`not_started`): Pivoting, rank, tolerantie en singulariteit expliciet.
- **Vector dot/cross/norm en coördinaatvormen** (`not_started`): M7 geometrie behouden, geen mutatie via calculatorwaarde.
- **Aparte matrix-/vectoreditor en resultatenpaneel** (`not_started`): A11y keyboard; geen dubbele wiskundekern.
- **Nummerieke grensgevallen en acceptatie** (`not_started`): Onafhankelijke matrixoracles en compatibiliteit.

#### K5 — Numerieke analyse en vergelijkingoplossers — `not_started`

nDeriv, bepaalde integraal, numerieke solve, veeltermgraad 2/3, lineaire 2×2/3×3; afhankelijk K2 en voor stelsels K4. Voor productie: afzonderlijk goedgekeurd contract, onafhankelijke mathematische/technische testcases, Node/Edge-testresultaten, security/regressie, documentatie, review en expliciete acceptatie; niets stilzwijgend als voltooid markeren.

- **Convergentie-/domein- en foutcontract ontwerpen** (`not_started`): Root finding, integrator, derivative; budgetten, singulariteit, status/residual, geen schijnexactheid.
- **Numerieke afgeleiden en integralen implementeren** (`not_started`): Gezamenlijke diensten met illustrator M12 zonder tweede evaluator.
- **Numerieke nulpunten en iteratieve solvers** (`not_started`): Bisection/newton-bracket veilige fallbacks; detectie van niet-convergentie.
- **Kwadraatische en kubische oplossingen incl complex beleid** (`not_started`): Roots, degenerate coefficients, multipliciteit, stabiele formules; afhankelijk K6 waar complex nodig.
- **Lineaire stelsels 2×2 en 3×3 via K4 matrixdiensten** (`not_started`): Unieke, onmogelijke en oneindige oplossingen onderscheiden.
- **Crosschecks M11 grafieken/M12 calculus en tests** (`not_started`): Eén algoritmisch contract; tests met onafhankelijke referenties en units.
- **K5-acceptatie** (`not_started`): Per solver bewijs residu; gebruiker accepteert expliciet.

#### K6 — Complexe getallen — `not_started`

Complex a+bi, polar/rect en complexe berekeningen als apart getypeerd waardemodel. Voor productie: afzonderlijk goedgekeurd contract, onafhankelijke mathematische/technische testcases, Node/Edge-testresultaten, security/regressie, documentatie, review en expliciete acceptatie; niets stilzwijgend als voltooid markeren.

- **Complex type, eenheden, ronding en foutregels ontwerpen** (`not_started`): T5a blijft een reële kern; geen stille coercie van complexe waarden.
- **Complexe rekenoperatoren en machten implementeren** (`not_started`): Re/im/magnitude/conjugate/arg met onafhankelijke oracles.
- **RECT/POLAR en complexe numerieke formatkeuzes** (`not_started`): Betrouwbare conversies, branch cuts en hoekmodus.
- **Koppelen aan geheugen, vergelijkingen en matrixdiensten** (`not_started`): Expliciete feature gates per typecombinatie.
- **K6-test- en acceptatiematrix** (`not_started`): Near-zero, branch cuts, overflow/underflow en foutsemantiek.

#### K7 — Getallenstelsels, constanten en conversies — `not_started`

TI-DEC/BIN/OCT/HEX, bitlogica, natuurkundige constanten, bredere SI/US-conversies. Voor productie: afzonderlijk goedgekeurd contract, onafhankelijke mathematische/technische testcases, Node/Edge-testresultaten, security/regressie, documentatie, review en expliciete acceptatie; niets stilzwijgend als voltooid markeren.

- **Getypte gehele getallen en bitbreedtecontract** (`not_started`): TI-gedrag, signed/unsigned en 2-complement; geen onbedoelde JavaScript bitwise 32-bit.
- **DEC/BIN/OCT/HEX, AND/OR/XOR/NOT en verdere bitfuncties** (`not_started`): UI-modi, veilig parserpad en testbare grenzen.
- **Extra fysieke dimensies massa/tijd/temperatuur enz.** (`not_started`): SI-dimensiemodel buiten (Lphysical,Labstract,A); schema versie en compatibiliteit bepalen.
- **Temperatuur en samengestelde/US-eenheden** (`not_started`): Affine conversies, snelheid, energie, druk en volume zonder dimensiefouten.
- **Versioneerde natuurkundige constantencatalogus** (`not_started`): Kies expliciet historische TI-pariteit vs actuele CODATA-waarden; bron en datum vastleggen.
- **UI-menu en onafhankelijke referentietests** (`not_started`): Alleen geïmplementeerde modi activeren, grensconversies controleren.
- **K7-acceptatie** (`not_started`): Bevestig dat bestaande geometry scale unit en T5a parser niet regressief veranderd zijn.

#### K8 — Definitieve TI-36X Pro functionele pariteitsaudit — `not_started`

Inventaris en officiële handleiding systematisch vergelijken; alle niet-ondersteunde cases zichtbaar openhouden. Voor productie: afzonderlijk goedgekeurd contract, onafhankelijke mathematische/technische testcases, Node/Edge-testresultaten, security/regressie, documentatie, review en expliciete acceptatie; niets stilzwijgend als voltooid markeren.

- **Elk inventarispunt classificeren met implementatie- en testbewijs** (`not_started`): 105 items zijn werkregister incl projectrequirements; markeer TI-norm, afwijking, uitzondering, buiten-scope.
- **TI-handleiding voorbeeldmatrix en onafhankelijke oracles** (`not_started`): Pariteit testen voor invoer/resultaat/domeinen/modes; ontbrekende functies blijven open.
- **Restricted security, clipboard, session, lifecycle, privacy** (`not_started`): Objectrechten, revocation en caching overal uniform; geen bronlekken.
- **Node- en Edge-regressies per pakket plus volledig geïntegreerd** (`not_started`): Leg exacte aantallen, platforms, regressies, visueel/hardwarematig bewijs vast.
- **Toegankelijkheid, keyboard, MathPrint, fullscreen en offline export** (`not_started`): Realistische manual IME/AT/OS clipboard, geen verzonnen PASS.
- **Eindrapport en gebruikersacceptatie** (`not_started`): TI-doel alleen voltooid als functionele pariteit aantoonbaar is.

### Codex model advice in the supplied plan

The export recommends GPT-6 Hoog for mathematics, architecture, security and critical tests; GPT-6.1 Sol Medium for bounded UI work; GPT-6.1 Sol Licht only for simple documentation/styling. These are user-supplied planning recommendations, not a guarantee of availability/quality and not evidence of which model performed historical work. Actual model choice does not bypass review, tests or milestone authorization.

### Source-status ledger (not a new verification)

Statuses below reproduce the supplied export and preserve stable task references, including duplicate names with different references. They do not overwrite the individual evidence in existing reports. In particular parent completed status may coexist with an open manual-acceptance child; historical test totals are historical, not current-suite results. The export's not-started publication task describes the situation before this commit; successful publication of this documentation will be reported by commit SHA, without editing the external export or claiming project-manager synchronization.

<details>
<summary>Task references, names and original statuses</summary>

| Ref | Task | Export status |
|---|---|---|
| `tasks-1` | Geverifieerde huidige basis — 9 oktober 2026 | `completed` |
| `tasks-2` | ↳ Gap-analyse M1–M20 afgerond | `completed` |
| `tasks-3` | ↳ 133 Node-tests PASS | `completed` |
| `tasks-4` | ↳ Edge-suite PASS | `completed` |
| `tasks-5` | ↳ Basisconstructies en metingen aanwezig | `completed` |
| `tasks-6` | M1 — Rechthoekselectie (marquee) | `completed` |
| `tasks-7` | ↳ Regels en falende tests | `completed` |
| `tasks-8` | ↳ Selectieresolver en overlay | `completed` |
| `tasks-9` | ↳ Pointer- en toetsenbordbediening | `completed` |
| `tasks-10` | ↳ M1 en M1.1 — handmatig aanvaard | `completed` |
| `tasks-11` | ↳ M1 en M1.1 — handmatig aanvaard | `completed` |
| `tasks-12` | M2a — Permissiecontract | `completed` |
| `tasks-13` | ↳ Rollen en capabilities definiëren | `completed` |
| `tasks-14` | ↳ Negatieve contracttests | `completed` |
| `tasks-15` | ↳ Technische verificatie PASS; handmatige acceptatie waar nodig bevestigen | `not_started` |
| `tasks-16` | M2b — Permissiehandhaving | `completed` |
| `tasks-17` | ↳ Centrale command-/capabilitygrens | `completed` |
| `tasks-18` | ↳ API-bypass en UI-tests | `completed` |
| `tasks-19` | ↳ Technische verificatie PASS; handmatige acceptatie waar nodig bevestigen | `not_started` |
| `tasks-20` | M2c — Editor UI/UX modernisering | `completed` |
| `tasks-21` | ↳ M2c.1 — Header, gereedschapscategorieën, lagen | `completed` |
| `tasks-22` | ↳ M2c.2 — Contextuele eigenschappen en assenstelsel | `completed` |
| `tasks-23` | ↳ M2c.3 — Navigatie, zoom, responsieve panelen | `completed` |
| `tasks-24` | ↳ M2c.4 — Browser-, visuele en toegankelijkheidstests | `completed` |
| `tasks-25` | ↳ Documenteer expliciete gebruikersacceptatie per M2c-checkpoint | `not_started` |
| `tasks-26` | M3a — History- en importbeleid | `completed` |
| `tasks-27` | ↳ Beslis undo/redo voor import/Nieuw | `completed` |
| `tasks-28` | ↳ Compatibiliteits- en historytests | `completed` |
| `tasks-29` | ↳ Technische verificatie PASS; handmatige acceptatie waar nodig bevestigen | `not_started` |
| `tasks-30` | M3b — Blijvende groepen | `completed` |
| `tasks-31` | ↳ Groepsmodel en schema-ADR | `completed` |
| `tasks-32` | ↳ Groepsselectie en rigid move | `completed` |
| `tasks-33` | ↳ Roundtrip, undo/redo en Edge | `completed` |
| `tasks-34` | ↳ Technische verificatie PASS; handmatige acceptatie waar nodig bevestigen | `not_started` |
| `tasks-35` | M3c — Lagen | `completed` |
| `tasks-36` | ↳ Laagmodel en beheer | `completed` |
| `tasks-37` | ↳ Rendering/hit/export controleren | `completed` |
| `tasks-38` | ↳ Technische verificatie PASS; handmatige acceptatie waar nodig bevestigen | `not_started` |
| `tasks-39` | M4a — Constructiecontract | `completed` |
| `tasks-40` | ↳ Schema/capabilities/stabiele referenties | `completed` |
| `tasks-41` | ↳ Foutdiagnostiek en graphstress | `completed` |
| `tasks-42` | ↳ Dependencyboom en relationeditor | `completed` |
| `tasks-43` | ↳ Technische verificatie PASS; handmatige acceptatie waar nodig bevestigen | `not_started` |
| `tasks-44` | M4b — Semantische commando’s | `completed` |
| `tasks-45` | ↳ Versioned create/update/operator events | `completed` |
| `tasks-46` | ↳ Methodebewijs versus undo scheiden | `completed` |
| `tasks-47` | ↳ Replay- en permissietests | `completed` |
| `tasks-48` | ↳ Technische verificatie PASS; handmatige acceptatie waar nodig bevestigen | `not_started` |
| `tasks-49` | M5a — Gekoppelde geometrie en paden | `completed` |
| `tasks-50` | ↳ Lijn tussen gekoppelde punten | `completed` |
| `tasks-51` | ↳ Punt op segment/cirkel | `completed` |
| `tasks-52` | ↳ Roundtrip, cycles en rechten | `completed` |
| `tasks-53` | ↳ Technische verificatie PASS; handmatige acceptatie waar nodig bevestigen | `not_started` |
| `tasks-54` | Post-M5a UX — Raster, constructiekleuren en instructies | `completed` |
| `tasks-55` | ↳ Raster standaard aan bij nieuw document | `completed` |
| `tasks-56` | ↳ Constructieobjecten standaard rood; stijloverrides bewaren | `completed` |
| `tasks-57` | ↳ Stapsgewijze instructies in eigenschappenpaneel voor alle tools | `completed` |
| `tasks-58` | ↳ Node 302/302 en Edge 34 modules PASS | `completed` |
| `tasks-59` | ↳ Handmatige acceptatie: raster, kleuren, instructies, Escape, fullscreen | `completed` |
| `tasks-60` | M5b — Dynamische snijpunten en cirkels | `completed` |
| `tasks-61` | ↳ Lijn-lijn snijpunten | `completed` |
| `tasks-62` | ↳ Lijn-cirkel en cirkel-cirkel | `completed` |
| `tasks-63` | ↳ Afgeleide cirkels | `completed` |
| `tasks-64` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `completed` |
| `tasks-65` | M5b uitbreiding — Raaklijn op gekoppeld cirkelpunt | `completed` |
| `tasks-66` | ↳ Technisch en wiskundig contract voor raaklijngevallen | `completed` |
| `tasks-67` | ↳ Implementatie tangent op gekoppeld cirkelpunt | `completed` |
| `tasks-68` | ↳ Node/Edge-regressies en gebruikersacceptatie | `completed` |
| `tasks-69` | Eenheden, schaal en meetnotatie | `completed` |
| `tasks-70` | ↳ Legacy-documenten en schema/migratiebeleid bepalen | `completed` |
| `tasks-71` | ↳ Instellingen eenheid, schaal, decimalen in assenstelseleigenschappen | `completed` |
| `tasks-72` | ↳ ↳ Abstracte eenheid veranderen van e naar u | `completed` |
| `tasks-73` | ↳ ↳ Demensiloze eenheid invoeren | `completed` |
| `tasks-74` | ↳ Lengte, omtrek, oppervlakte, hoeken en labels correct formatteren | `completed` |
| `tasks-75` | ↳ Zoom onafhankelijk van schaal; regressies en acceptatie | `completed` |
| `tasks-76` | Architectuuraudit en consolidatie | `completed` |
| `tasks-77` | ↳ Stap 1 — ChatGPT Online voert architectuuraudit uit. | `completed` |
| `tasks-78` | ↳ Stap 2 — Codex voert de goedgekeurde refactoring uit. | `completed` |
| `tasks-79` | ↳ ↳ R1 — Verwijderen van overbodige bestanden | `completed` |
| `tasks-80` | ↳ ↳ R2 — Consolidatie van kleine helpermodules | `completed` |
| `tasks-81` | ↳ ↳ R3 — Modularisering van editor.js | `completed` |
| `tasks-82` | ↳ ↳ R4 — Afhankelijkheden en scriptlaadvolgorde | `completed` |
| `tasks-83` | ↳ Stap 3 — Ik controleer onafhankelijk het resultaat. | `completed` |
| `tasks-84` | Gelijkmatige puntenverdeling op cirkel en herbruikbare geometrische kern | `completed` |
| `tasks-85` | ↳ 1 - Architectuurcontrole | `completed` |
| `tasks-86` | ↳ 2 - Implementatie | `completed` |
| `tasks-87` | ↳ 3 - Controle | `completed` |
| `tasks-88` | X-as en Y-as als universele geometrische referenties | `completed` |
| `tasks-89` | Dynamische tekstobjecten | `in_progress` |
| `tasks-90` | ↳ T0: Verplichte architectuuranalyse | `completed` |
| `tasks-91` | ↳ T1 — Rich-texteditor en gestructureerd tekstmodel | `completed` |
| `tasks-92` | ↳ T2 — Inline wiskundige symbolen en formules | `completed` |
| `tasks-93` | ↳ T3 — Inline dynamische waarden | `completed` |
| `tasks-94` | ↳ T4 — Live preview, export en editorafwerking | `not_started` |
| `tasks-95` | ↳ Modernisering teksteditor en herbruikbare wiskundige invoerarchitectuur | `not_started` |
| `tasks-96` | ↳ T5 — Wetenschappelijke rekenmachine en dynamische berekeningen | `not_started` |
| `ti26-4004` | T5a en tekstwerkruimte — actuele basis (12 oktober 2026) | `completed` |
| `ti26-4001` | ↳ T5a — Veilige rekenmotor en bronadapter geaccepteerd | `completed` |
| `ti26-4002` | ↳ Volledige driekoloms tekstwerkruimte goedgekeurd en gemerged | `completed` |
| `ti26-4003` | ↳ Laatste Node-regressie: 573 PASS volgens gebruikersrapport | `completed` |
| `ti26-4010` | TI-36X Pro — Productplanning en roadmappublicatie (v2.4.0) | `in_progress` |
| `ti26-4005` | ↳ Conceptfunctie-inventaris v1.0.0 opgesteld | `completed` |
| `ti26-4006` | ↳ Roadmaptoevoeging v2.4.0 inhoudelijk uitgewerkt | `completed` |
| `ti26-4007` | ↳ Documentatiepatch laten toepassen op GitHub main | `not_started` |
| `ti26-4008` | ↳ TI-handleiding per controlegroep verifiëren | `not_started` |
| `ti26-4009` | ↳ Synchroniseer roadmappaden en My Project Manager zonder doublures | `not_started` |
| `ti26-4013` | Nog open kwaliteits- en acceptatiecontroles | `not_started` |
| `ti26-4011` | ↳ Gecombineerde Edge-regressies op actuele main uitvoeren | `not_started` |
| `ti26-4012` | ↳ Handmatige T4/T5-prep en tekst/focus/exportpunten nalopen | `not_started` |
| `tasks-97` | M6a — Driehoekcentra | `not_started` |
| `tasks-98` | ↳ Zwaartepunt | `not_started` |
| `tasks-99` | ↳ Middelpunt omgeschreven cirkel | `not_started` |
| `tasks-100` | ↳ Hoogtepunt | `not_started` |
| `tasks-101` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-102` | M6b — Uitgebreide driehoekconstructies | `not_started` |
| `tasks-103` | ↳ Incenter en ingeschreven cirkel | `not_started` |
| `tasks-104` | ↳ Eulerrechte | `not_started` |
| `tasks-105` | ↳ Negenpuntscirkel | `not_started` |
| `tasks-106` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `ti26-4025` | T5b — TI-geïnspireerde wetenschappelijke rekenmachine (fase 1) | `not_started` |
| `ti26-4014` | ↳ Nieuw definitief UX-contract ontwerpen en goedkeuren | `not_started` |
| `ti26-4015` | ↳ Toetsen-/functie-inventaris koppelen aan T5a-AST | `not_started` |
| `ti26-4016` | ↳ Floating draggable calculator en responsief gedrag | `not_started` |
| `ti26-4017` | ↳ Fysiek toetsenbord, toegankelijkheid en focus/Escape-contract | `not_started` |
| `ti26-4018` | ↳ Typed geometrische bronkiezer ontwikkelen | `not_started` |
| `ti26-4019` | ↳ Private DEG/RAD-instelling zonder documentmutatie | `not_started` |
| `ti26-4020` | ↳ Natuurlijke invoer en lineaire AST-normalisatie laten samenwerken | `not_started` |
| `ti26-4021` | ↳ Resultaatpaneel, unit/precisie, foutcode en copy-contract | `not_started` |
| `ti26-4022` | ↳ Twee hostadapters en private berekeningsgeschiedenis | `not_started` |
| `ti26-4023` | ↳ Security- en invarianttests in Node/Edge | `not_started` |
| `ti26-4024` | ↳ Afzonderlijke T5b-rapportage en gebruikersacceptatie | `not_started` |
| `ti26-4032` | T5c — Berekende velden in tekst (bestaande milestone) | `not_started` |
| `ti26-4026` | ↳ Schema-4 calculatedValue payload en permissies definitief ontwerpen | `not_started` |
| `ti26-4027` | ↳ Invoegen vanuit ∑ alleen na expliciete T5c-GO | `not_started` |
| `ti26-4028` | ↳ Bestaand berekend tekstveld heropenen en bewerken | `not_started` |
| `ti26-4029` | ↳ Live bronupdate en autorisatieregressie | `not_started` |
| `ti26-4030` | ↳ JSON v7, history, remap, offline SVG/PNG en legacy | `not_started` |
| `ti26-4031` | ↳ T5c rapport en afzonderlijke acceptatie | `not_started` |
| `ti26-4038` | T5d — Calculatorintegratie en beveiligingsaudit (bestaande milestone) | `not_started` |
| `ti26-4033` | ↳ Node/Edge-matrix in beide calculatorhosts | `not_started` |
| `ti26-4034` | ↳ Restricted privacy, bronintrekking en session epoch | `not_started` |
| `ti26-4035` | ↳ Accessible keyboard, focus, IME en Escape bij fullscreen | `not_started` |
| `ti26-4036` | ↳ Opslag/export, documenthistory en legacy regressie | `not_started` |
| `ti26-4037` | ↳ Rapport, resterende risico’s en finale gebruikersacceptatie | `not_started` |
| `tasks-107` | Verzamelingen — semantische kern en Venn/Euler | `not_started` |
| `tasks-108` | ↳ Getypeerd semantisch verzamelingenmodel | `not_started` |
| `tasks-109` | ↳ Venn-diagrammen met 2–3 verzamelingen | `not_started` |
| `tasks-110` | ↳ Euler-diagrammen voor inclusie en disjunctie | `not_started` |
| `tasks-111` | ↳ Correcte gebiedsinkleuring en elementplaatsing | `not_started` |
| `tasks-112` | ↳ Toegankelijkheid, toetsen, opslag en acceptatie | `not_started` |
| `tasks-113` | Verzamelingen — getallenlijn | `not_started` |
| `tasks-114` | ↳ Intervalmodel en grenssemantiek | `not_started` |
| `tasks-115` | ↳ Getallenlijnweergave met eindpuntmarkeringen | `not_started` |
| `tasks-116` | ↳ Unie, doorsnede, verschil en losse componenten | `not_started` |
| `tasks-117` | ↳ Interacties, zoom, tests en acceptatie | `not_started` |
| `tasks-118` | M7a–c — Starre transformaties | `not_started` |
| `tasks-119` | ↳ Verschuiven via vector of dx/dy | `not_started` |
| `tasks-120` | ↳ Spiegelen in lijn(stuk) | `not_started` |
| `tasks-121` | ↳ Draaien om gekozen centrum | `not_started` |
| `tasks-122` | ↳ Transformatietests | `not_started` |
| `tasks-123` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-124` | M8a — Ellipsen | `not_started` |
| `tasks-125` | ↳ Brandpunten en afstandsom | `not_started` |
| `tasks-126` | ↳ Punt-op-ellips en brandpuntbewerking | `not_started` |
| `tasks-127` | ↳ Hit, snap, render, import/export | `not_started` |
| `tasks-128` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-129` | M8b — Parallellogram | `not_started` |
| `tasks-130` | ↳ Twee zijden en ingesloten hoek | `not_started` |
| `tasks-131` | ↳ Live lengte-/hoekaanduiding | `not_started` |
| `tasks-132` | ↳ Degeneraties en roundtrip | `not_started` |
| `tasks-133` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-134` | Regelmatige veelhoeken | `not_started` |
| `tasks-135` | ↳ Contract n>=3, degeneratie, bronkoppelingen | `not_started` |
| `tasks-136` | ↳ Constructietool en inspector voor n, straal en rotatie | `not_started` |
| `tasks-137` | ↳ Zijden, hoeken, omtrek en oppervlakte verifiëren | `not_started` |
| `tasks-138` | ↳ Node/Edge, undo/redo, import/export en acceptatie | `not_started` |
| `tasks-139` | M7d–g — Algemene transformaties en vectoren | `not_started` |
| `tasks-140` | ↳ Uniform en niet-uniform schalen | `not_started` |
| `tasks-141` | ↳ Compositie, inverse en geschiedenis | `not_started` |
| `tasks-142` | ↳ Vectorbewerkingen | `not_started` |
| `tasks-143` | ↳ Matrixtransformaties | `not_started` |
| `tasks-144` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-145` | Vectoren — gekoppelde vectoren en vectoralgebra | `not_started` |
| `tasks-146` | ↳ M7-VEC-FUND: vrije versus gebonden vector en componentencontract | `not_started` |
| `tasks-147` | ↳ M7-VEC-FUND: dynamische vector AB en componentweergave | `not_started` |
| `tasks-148` | ↳ M7f: som, verschil en scalair vermenigvuldigen | `not_started` |
| `tasks-149` | ↳ M7f: inproduct, hoek en projectie; nulvectorgevallen | `not_started` |
| `tasks-150` | ↳ Kop-staart, parallellogramregel en projectievisualisatie | `not_started` |
| `tasks-151` | ↳ Node/Edge, permissies, replay en acceptatie | `not_started` |
| `tasks-152` | M9 — Meetkundige plaatsen | `not_started` |
| `tasks-153` | ↳ Padparameter en trace | `not_started` |
| `tasks-154` | ↳ Locus van afhankelijk punt | `not_started` |
| `tasks-155` | ↳ Numerieke en prestatietests | `not_started` |
| `tasks-156` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-157` | M10a–b — Meerdere assenstelsels | `not_started` |
| `tasks-158` | ↳ Meerdere coördinatenframes | `not_started` |
| `tasks-159` | ↳ Vrije basisvectoren e1/e2 | `not_started` |
| `tasks-160` | ↳ Interactieve basis-editor | `not_started` |
| `tasks-161` | ↳ Numerieke validatie | `not_started` |
| `tasks-162` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-163` | M11a — Veilige functiegrafieken | `not_started` |
| `tasks-164` | ↳ Veilige formuleparser | `not_started` |
| `tasks-165` | ↳ Cartesiaanse grafiek y=f(x) | `not_started` |
| `tasks-166` | ↳ Functies als gedeeld object | `not_started` |
| `tasks-167` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `ti26-4044` | Gedeelde functieservice — M11/M12 en K2/K5 | `not_started` |
| `ti26-4039` | ↳ Eén veilig functiedefinitie- en variabelencontract | `not_started` |
| `ti26-4040` | ↳ Documentobject voor functiegrafiek uitsluitend in illustrator | `not_started` |
| `ti26-4041` | ↳ TI-functietabel hergebruikt dezelfde K2-service | `not_started` |
| `ti26-4042` | ↳ Afgeleiden, integralen en nulpuntberekeningen delen K5-services | `not_started` |
| `ti26-4043` | ↳ Matrix/vector-lagen afstemmen op M7 geometrie | `not_started` |
| `tasks-168` | M11b — Parametrische functies | `not_started` |
| `tasks-169` | ↳ x(t), y(t) met domein | `not_started` |
| `tasks-170` | ↳ Dynamisch grafiekpunt | `not_started` |
| `tasks-171` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-172` | M11c — Impliciete krommen | `not_started` |
| `tasks-173` | ↳ F(x,y)=0 solvercontract | `not_started` |
| `tasks-174` | ↳ Impliciete contouren | `not_started` |
| `tasks-175` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-176` | Verzamelingen — coördinatenvlak | `not_started` |
| `tasks-177` | ↳ Veilige expressies en gebiedscontract na M11 | `not_started` |
| `tasks-178` | ↳ Open/gesloten grenzen en arcering | `not_started` |
| `tasks-179` | ↳ Unie, doorsnede, verschil in vlak | `not_started` |
| `tasks-180` | ↳ Numerieke randgevallen, browser-tests en acceptatie | `not_started` |
| `tasks-181` | M12a–c — Analyse en calculus | `not_started` |
| `tasks-182` | ↳ Nulpunten, snijpunten en extrema | `not_started` |
| `tasks-183` | ↳ Secant, raaklijn en afgeleide | `not_started` |
| `tasks-184` | ↳ Integralen en Riemannsommen | `not_started` |
| `tasks-185` | ↳ Wiskundige grensgevallen testen | `not_started` |
| `tasks-186` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `ti26-4051` | K1 — Exacte getallen, reële functies en TI-notaties | `not_started` |
| `ti26-4045` | ↳ Contract voor getypeerde exacte reële resultaten ontwerpen | `not_started` |
| `ti26-4046` | ↳ AST/schema/serialisatie en veilige exacte conversie ontwerpen | `not_started` |
| `ti26-4047` | ↳ Reële extra functies en getaltheorie implementeren | `not_started` |
| `ti26-4048` | ↳ Notaties MathPrint/CLASSIC, fraction/decimal, FIX/FLOAT/SCI/ENG | `not_started` |
| `ti26-4049` | ↳ Node/Edge + onafhankelijke exacte oracles | `not_started` |
| `ti26-4050` | ↳ K1-acceptatie en documentatie | `not_started` |
| `ti26-4058` | K2 — Gebonden variabelen, geheugen en functies | `not_started` |
| `ti26-4052` | ↳ Typed locals, Ans en naam-/scopebeleid ontwerpen | `not_started` |
| `ti26-4053` | ↳ Geheugen, herhaalde operatie en private historie implementeren | `not_started` |
| `ti26-4054` | ↳ Functies f(x), evaluatie en bounded iteratie Σ/Π | `not_started` |
| `ti26-4055` | ↳ Functietabellen en evaluatiedienst voor M11 | `not_started` |
| `ti26-4056` | ↳ Tests variabelenbinding/kwota/pariteit/revocation | `not_started` |
| `ti26-4057` | ↳ K2-acceptatie | `not_started` |
| `ti26-4065` | K3 — Statistiek, regressie en verdelingen | `not_started` |
| `ti26-4059` | ↳ Getypeerde lijsten en datastructuurcontract | `not_started` |
| `ti26-4060` | ↳ 1D- en 2D-statistiek implementeren | `not_started` |
| `ti26-4061` | ↳ Lineair, kwadratisch, kubisch, log, macht en exponentieel regressie | `not_started` |
| `ti26-4062` | ↳ Normal-, binomiale en Poisson-pdf/cdf/inverse | `not_started` |
| `ti26-4063` | ↳ Datapresentatie, tabellen en modebediening | `not_started` |
| `ti26-4064` | ↳ Onafhankelijke referentietests en acceptatie | `not_started` |
| `ti26-4072` | K4 — Matrices en vectoren | `not_started` |
| `ti26-4066` | ↳ Matrix- en vectortypecontracten vastleggen | `not_started` |
| `ti26-4067` | ↳ Basisalgebra: plus/min/scalair, matrixproduct en matrix × vector | `not_started` |
| `ti26-4068` | ↳ Determinant, inverse, transpose, REF/RREF | `not_started` |
| `ti26-4069` | ↳ Vector dot/cross/norm en coördinaatvormen | `not_started` |
| `ti26-4070` | ↳ Aparte matrix-/vectoreditor en resultatenpaneel | `not_started` |
| `ti26-4071` | ↳ Nummerieke grensgevallen en acceptatie | `not_started` |
| `ti26-4080` | K5 — Numerieke analyse en vergelijkingoplossers | `not_started` |
| `ti26-4073` | ↳ Convergentie-/domein- en foutcontract ontwerpen | `not_started` |
| `ti26-4074` | ↳ Numerieke afgeleiden en integralen implementeren | `not_started` |
| `ti26-4075` | ↳ Numerieke nulpunten en iteratieve solvers | `not_started` |
| `ti26-4076` | ↳ Kwadraatische en kubische oplossingen incl complex beleid | `not_started` |
| `ti26-4077` | ↳ Lineaire stelsels 2×2 en 3×3 via K4 matrixdiensten | `not_started` |
| `ti26-4078` | ↳ Crosschecks M11 grafieken/M12 calculus en tests | `not_started` |
| `ti26-4079` | ↳ K5-acceptatie | `not_started` |
| `ti26-4086` | K6 — Complexe getallen | `not_started` |
| `ti26-4081` | ↳ Complex type, eenheden, ronding en foutregels ontwerpen | `not_started` |
| `ti26-4082` | ↳ Complexe rekenoperatoren en machten implementeren | `not_started` |
| `ti26-4083` | ↳ RECT/POLAR en complexe numerieke formatkeuzes | `not_started` |
| `ti26-4084` | ↳ Koppelen aan geheugen, vergelijkingen en matrixdiensten | `not_started` |
| `ti26-4085` | ↳ K6-test- en acceptatiematrix | `not_started` |
| `ti26-4094` | K7 — Getallenstelsels, constanten en conversies | `not_started` |
| `ti26-4087` | ↳ Getypte gehele getallen en bitbreedtecontract | `not_started` |
| `ti26-4088` | ↳ DEC/BIN/OCT/HEX, AND/OR/XOR/NOT en verdere bitfuncties | `not_started` |
| `ti26-4089` | ↳ Extra fysieke dimensies massa/tijd/temperatuur enz. | `not_started` |
| `ti26-4090` | ↳ Temperatuur en samengestelde/US-eenheden | `not_started` |
| `ti26-4091` | ↳ Versioneerde natuurkundige constantencatalogus | `not_started` |
| `ti26-4092` | ↳ UI-menu en onafhankelijke referentietests | `not_started` |
| `ti26-4093` | ↳ K7-acceptatie | `not_started` |
| `ti26-4101` | K8 — Definitieve TI-36X Pro functionele pariteitsaudit | `not_started` |
| `ti26-4095` | ↳ Elk inventarispunt classificeren met implementatie- en testbewijs | `not_started` |
| `ti26-4096` | ↳ TI-handleiding voorbeeldmatrix en onafhankelijke oracles | `not_started` |
| `ti26-4097` | ↳ Restricted security, clipboard, session, lifecycle, privacy | `not_started` |
| `ti26-4098` | ↳ Node- en Edge-regressies per pakket plus volledig geïntegreerd | `not_started` |
| `ti26-4099` | ↳ Toegankelijkheid, keyboard, MathPrint, fullscreen en offline export | `not_started` |
| `ti26-4100` | ↳ Eindrapport en gebruikersacceptatie | `not_started` |
| `tasks-187` | M13a — Herbruikbare viewer | `not_started` |
| `tasks-188` | ↳ Scoped runtime | `not_started` |
| `tasks-189` | ↳ Cursus-/toetsweergavemodus | `not_started` |
| `tasks-190` | ↳ Multi-instance Edge-tests | `not_started` |
| `tasks-191` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-192` | M13b — Parameters en cursusintegratie | `not_started` |
| `tasks-193` | ↳ Author-defined sliders | `not_started` |
| `tasks-194` | ↳ Embed in cursushost | `not_started` |
| `tasks-195` | ↳ Cursusacceptatie | `not_started` |
| `tasks-196` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-197` | M14 — Constructieafspelen en animatie | `not_started` |
| `tasks-198` | ↳ Constructiestappen afspelen | `not_started` |
| `tasks-199` | ↳ Keyframes en tijdlijn | `not_started` |
| `tasks-200` | ↳ Animatietests | `not_started` |
| `tasks-201` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-202` | M15 — Onderzoek en demonstraties | `not_started` |
| `tasks-203` | ↳ Hints en overlays | `not_started` |
| `tasks-204` | ↳ Pythagoras-demonstratie | `not_started` |
| `tasks-205` | ↳ Omtrekshoek en driehoeksinvarianten | `not_started` |
| `tasks-206` | ↳ Analyse-demonstraties | `not_started` |
| `tasks-207` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-208` | M16a — Toetsopgave-artifact | `not_started` |
| `tasks-209` | ↳ Versieerbaar opgaveschema | `not_started` |
| `tasks-210` | ↳ Auteurpreview en frozen release | `not_started` |
| `tasks-211` | ↳ Resultaat- versus methodecriteria | `not_started` |
| `tasks-212` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-213` | M16b — Geometrische validator | `not_started` |
| `tasks-214` | ↳ Middelpunt, evenwijdig en loodrecht | `not_started` |
| `tasks-215` | ↳ Equivalente oplossingen en toleranties | `not_started` |
| `tasks-216` | ↳ Verdere constructiecriteria | `not_started` |
| `tasks-217` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-218` | M17a — Pogingen en hostadapter | `not_started` |
| `tasks-219` | ↳ Attempt/evidence protocol | `not_started` |
| `tasks-220` | ↳ Voortgang naar spel/toetshost | `not_started` |
| `tasks-221` | ↳ Core evaluator adapter | `not_started` |
| `tasks-222` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-223` | M17b — Vertrouwde toetsbeoordeling | `not_started` |
| `tasks-224` | ↳ Backend-/auth-keuze vastleggen | `not_started` |
| `tasks-225` | ↳ Server-side validatie en opslag | `not_started` |
| `tasks-226` | ↳ Tamper- en replaytests | `not_started` |
| `tasks-227` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-228` | M18a–c — Auteursworkflow en publiceren | `not_started` |
| `tasks-229` | ↳ Templates en herbruikbare subgraphs | `not_started` |
| `tasks-230` | ↳ LaTeX-labels en toegankelijkheid | `not_started` |
| `tasks-231` | ↳ SVG/PNG exportpresets | `not_started` |
| `tasks-232` | ↳ Review en publicatie | `not_started` |
| `tasks-233` | ↳ Embed en assets | `not_started` |
| `tasks-234` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-235` | M19 — Visuele en formele bewijzen | `not_started` |
| `tasks-236` | ↳ Visuele bewijssequenties | `not_started` |
| `tasks-237` | ↳ Stellingen en aannames | `not_started` |
| `tasks-238` | ↳ Formele bewijsstappen | `not_started` |
| `tasks-239` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-240` | M20 — Platformkwaliteit en toegankelijkheid | `not_started` |
| `tasks-241` | ↳ Toetsenbord en screenreader | `not_started` |
| `tasks-242` | ↳ Touch en mobiele interactie | `not_started` |
| `tasks-243` | ↳ Cross-browser en performancematrix | `not_started` |
| `tasks-244` | ↳ Releaseacceptatie | `not_started` |
| `tasks-245` | ↳ Milestone-gate: testen, documenteren, gebruikersacceptatie | `not_started` |
| `tasks-246` | Doorlopende kwaliteitsprocedure | `not_started` |
| `tasks-247` | ↳ Wiskunde, UX, foutgevallen en permissiematrix vastleggen | `not_started` |
| `tasks-248` | ↳ Eerst falende tests voor nieuwe functionaliteit | `not_started` |
| `tasks-249` | ↳ Minimale implementatie zonder parallelle controllers | `not_started` |
| `tasks-250` | ↳ Node- en Edge-regressies volledig groen | `not_started` |
| `tasks-251` | ↳ Schema-/migratie- en exportcompatibiliteit beoordelen | `not_started` |
| `tasks-252` | ↳ Commits, testbewijs, resterende risico’s en PASS/FAIL rapporteren | `not_started` |
| `tasks-253` | ↳ Handmatige acceptatie en expliciete toestemming voor volgende milestone | `not_started` |
| `tasks-254` | Productdoel en volledige backlog bewaken | `not_started` |
| `tasks-255` | ↳ Controleer elke milestone tegen PRODUCT-VISION.md | `not_started` |
| `tasks-256` | ↳ Controleer alle 54 eisen uit FEATURE-BACKLOG.md | `not_started` |
| `tasks-257` | ↳ Werk roadmap bij na acceptatie zonder features stilzwijgend te schrappen | `not_started` |
| `tasks-258` | ↳ Beslis backend voor summatieve toetsbeoordeling vóór M17b | `not_started` |

</details>

## TI-36X Pro scientific-calculator functional parity — approved roadmap direction (2026-10-12, v2.4.0)

**Decision and sequence (planning only):** the long-term calculator target is full **functional coverage comparable to the Texas Instruments TI-36X Pro**, as an accessible, original FZI product rather than a literal branded/hardware emulator. This expands the *product roadmap*, **not** the already approved T5a mathematical contract or the authorized scope of T5b. The 105-item working inventory `T5b_TI36X_Pro_functieinventaris_v1.0.0.md` was prepared on 2026-10-12; it mixes TI function groups, FZI integration requirements and explicit out-of-scope markers, so 105 is **not** an official count of TI functions. Its individual claims and parities remain subject to guidebook and implementation acceptance. Official reference: [TI-36X Pro Guidebook (TI)](https://education.ti.com/html/eguides/scientifics/PDFs/EN/TI-36X-PRO-Guidebook_EN.pdf).

**Immediate implementation priority:** resume the existing illustrator roadmap, starting from currently pending M6 triangle centers/circles after the relevant unfinished acceptance checks. Preserve M1–M20, transformations, linked vectors, coordinate systems, M11 graphing, M12 calculus/analysis, sets and all subsequent milestones. Do not block M6 or other illustrator work on completion of the advanced calculator. Reassess the earliest useful T5b start after the nearby illustrator milestones are stable; T5b need **not** wait for every M1–M20 milestone.

**Integration gates:** T5a is accepted and on `main`. First finalize/approve the *revised* TI-inspired T5b UX with a **floating draggable scientific calculator** (not the earlier compact v1.0.0 mock), natural-entry-ready structure, accessible keyboard/SHIFT/ALPHA/navigation, private history and typed geometry sources. **T5b** implements one shared standalone/inline interface for **already supported T5a functions only** and remains read-only with respect to canvas/text/document state. Do not show unsupported keys or calculation modes as operational. After its separate tests and acceptance, **T5c** enables typed `calculatedValue` inline fields (document v7/textSchema 4), and **T5d** audits integration, authorization, focus, fullscreen, clipboard and exports. New TI-functionality is delivered in separate, versioned, gated packages; do not defer T5c/T5d until the entire TI target is finished.

| Package / workstream | Planned scope | Dependencies and boundaries | Recommended Codex model |
|---|---|---|---|
| **T5b (existing)** | TI-inspired scientific keyboard and natural-input-ready UI; current reals, units, trig, sources, standalone/inline; floating/dragging; history; copy | New UX/design approval; no new mathematics, no document mutation, no graph canvas | **GPT-6 High** for architecture/security; **GPT-6.1 Sol Medium** for bounded UI components |
| **T5c–T5d (existing)** | CalculatedValue text fields, then complete integration/security/export/accessibility audit | Separate GO for each; preserve existing T5a AST/quantity, T1–T4 invariants | **GPT-6 High** |
| **K1 — Exact real values** | Fractions, radicals/π exact display, rational/exact types, additional real functions, factorial/nPr/nCr, SCI/ENG and TI-compatible presentation | First design versioned AST/value semantics; never infer exactness from binary64 strings; preserve T5a numeric contract | **GPT-6 High** |
| **K2 — Variables and function definitions** | Typed local variables, Ans, memory, bound `f(x)`, controlled sequences/Σ/Π, function evaluation | Validated variable scope/quotas; never treat geometry object names as untyped variables | **GPT-6 High** |
| **K3 — Lists, statistics, distributions** | List editor, one-/two-variable statistics, regression, normal/binomial/Poisson distributions | Typed lists; independent numeric oracles and boundary proofs | **GPT-6 High** |
| **K4 — Matrix and vector arithmetic** | Typed matrices/vectors, determinant, inverse, RREF, dot/cross and norms | Coordinate with M7 vector work; share tested algebra without mutating geometry objects | **GPT-6 High** |
| **K5 — Calculus and solvers** | Numeric derivative/integral, numerical equations, polynomial 2/3 and linear 2×2/3×3 solvers | Depends on K2; use K4 for linear algebra; coordinate with M11 graphing and M12 analysis; explicit convergence/error contract | **GPT-6 High** |
| **K6 — Complex values** | Complex Cartesian/polar forms, arithmetic, components and solver compatibility | New typed complex model; no silent coercion into T5a reals | **GPT-6 High** |
| **K7 — Other TI modes** | Base-N and bit operations, physical constants, extra units/conversions, SI extensions | Explicit integer width, unit dimensions and affine temperature conversion; versioned constant catalog | **GPT-6 High** |
| **K8 — Final TI-parity audit** | Compare function inventory and guidebook examples; recheck integration, restricted sources, Node/Edge, accessibility and offline export | All intended K deliverables accepted; no unexecuted checks marked PASS | **GPT-6 High** |
| **Documentation/UX-only follow-ups** | Normalize docs, labels, menu organization, checklist sync | Content-only, no mathematical rules changed | **GPT-6.1 Sol Light** (review with GPT-6 High for contracts) |

**Shared mathematics, no duplicate systems:** the calculator has **no graph plotter**. Functiegrafieken, sliders and visual analysis remain in the existing illustrator canvas (M11/M12); the TI-style function table can reuse the shared K2 function service. Matrix/vector and solver services should be reused where their mathematical contracts coincide, with independent presentation/authorization adapters. Never introduce a second independent evaluator or bypass `expression-sources.js` authorization. Numerical parity, exactness, permissions, stale-value invalidation, result-copy semantics and binary64 restrictions require explicit acceptance per package.

**Codex selection guideline:** GPT-6 **High** for architectural design, mathematics, security, schema or high-risk tests; GPT-6.1 **Sol Medium** for ordinary bounded UI integration after design approval; GPT-6.1 **Sol Light** only for low-risk styling/documentation changes. These are task recommendations subject to the models available in Codex, **not** evidence of implementation quality: Node/Edge/manual tests and independent review remain obligatory. No T5b/K-package implementation or tests were started by this documentation update. The original illustrator milestones and their current recorded status remain unchanged.


## Roadmap v2.5.0 — Historische planningssnapshot, gesynchroniseerd door v2.6.0 hieronder

**Normatieve specificatie ten tijde van deze snapshot:** [GEOMETRY-TOOLS-REGIONS-RADIAL-ARCHITECTURE-v1.0.0.md](GEOMETRY-TOOLS-REGIONS-RADIAL-ARCHITECTURE-v1.0.0.md). Deze sectie plande werk en status op SYNC-0 (`54b2f55`); de statements dat UI-T1/G-TRI1 ontbraken en alle `not_started`-statussen in de matrix hieronder zijn historisch en worden voor de actuele status vervangen door Roadmap v2.6.0 aan het einde van dit bestand. Oorspronkelijke scope, acceptatiepoorten en M1–M20/T5/K-milestonehistorie blijven behouden. Historische testresultaten zijn niet opnieuw uitgevoerd tijdens SYNC-1; resterende handmatige acceptatie blijft open.

**Gebruikersbesluiten:** eerste gereedschapsgroep wordt **Vrije objecten** (vrije punten/lijnen/vectoren + bestaande cirkel, driehoek, veelhoek; afzonderlijke **Figuren**-groep vervalt); onmiddellijk daaronder **Constructies** met **Driehoekconstructies → Driehoek via 3 punten**. Extra groep **Gebieden & opvulling**. Een driehoek geconstrueerd uit drie bestaande puntobjecten is **één dynamisch afhankelijk driehoek-/polygon-object**, zelf selecteerbaar en stijlbaar maar **nooit rechtstreeks versleepbaar**; verplaatsen van A/B/C is de enige geometrische bewerkingsroute. Uit bestaande M6a-broncontracten volgt `type='polygon'` en exact drie vertices; hergebruik dit, geen tweede driehoekrenderer. De eigenschappenbediening ontwikkelt richting een **contextueel radiaalmenu met herbruikbare acties**, met behoud van bereikbare volledige inspector totdat expliciete UX-pariteit en gebruikersacceptatie zijn vastgesteld. Gebieden inkleuren omvat in de **eerste werkende release** een optionele dynamisch berekende oppervlakte en labelweergave, niet slechts decoratieve vulling.

| Werkpakket | Scope en acceptatie | Startvoorwaarde | Codex-advies | Status |
|---|---|---|---|---|
| **SYNC-0** | Main-geschiedenis en geïntegreerde M6a/panel gecontroleerd; ontbrekende uitbreidingen en open acceptaties benoemd; geen nieuwe tests | Afgerond op SHA 54b2f55 | **GPT-6 High** | `completed` (documentstatus; geen nieuwe test-run) |
| **CORE-1** | Ontwerp gedeelde bron-/geometry-/gebied-/oppervlaktefuncties, declaratieve toolcatalogus en generieke inspectoractie-adapter; géén dubbele rekenmotor | SYNC-0 | **GPT-6 High** | `not_started` |
| **UI-T1** | Wijzig 8 categorieën: Vrije objecten → Constructies → Meten & analyseren → Gebieden & opvulling → Transformeren → Functies & grafieken → Tekst & interactie → Verzamelingen; behoud alle tool-ID's, splitmenus, fullscreen en inert placeholders | Vanaf actuele `main`; bestaand paneel hergebruiken | **GPT-6.1 Sol Medium**, audit GPT-6 High | `not_started` |
| **G-TRI1** | Driehoek via **drie bestaande punt-ID's**; getypeerd recept, recompute, dynamic M6a-centra, unsupported direct drag, degeneratie, undo/replay/JSON/SVG/PNG/restricted | Bestaand M6a role `polygon`/3 vertices & schema geratificeerd | **GPT-6 High** | `not_started` |
| **UI-R1** | Radiaal eigenschappenmenu: UX/keyboard/touch/ARIA/focus/context/lifecycle/viewport ontwerp; complete inspectorinventaris | CORE-1 | **GPT-6 High** | `not_started` |
| **UI-R2** | Generieke RadialMenu UI + gedeelde property-applicability adapter; geautoriseerde bestaande editorcommands; volledig paneel via “Alle eigenschappen” bereikbaar | UI-R1 GO | **GPT-6 High** voor adapter, **GPT-6.1 Sol Medium** voor UI | `not_started` |
| **UI-R3** | Eventueel rechter eigenschappenbalk herontwerpen/verbergen **alleen** als alle velden/toegankelijkheid/rechten equivalent bereikbaar zijn en gebruiker afzonderlijk akkoord geeft | UI-R2 gebruikersacceptatie | **GPT-6 High** | `not_started` |
| **REG-1** | Contract getypeerde gebieden, bronreferenties, minor/major sector/segment, units², numerieke degenerate/arc-gevallen, export, rights, labels | CORE-1; M6 vervolgoverleg | **GPT-6 High** | `not_started` |
| **REG-2** | Eigen afhankelijke **veelhoekgebied, cirkelsector, cirkelsegment** met stijl/kleur/transparantie, minor/major, selecteren + **Oppervlakte weergeven aan/uit** (`A = 12,57 cm²`); live bronupdates, undo/export/restricted, onafhankelijke numerieke golden tests | REG-1 expliciete GO | **GPT-6 High** math/architectuur, **GPT-6.1 Sol Medium** presentatie | `not_started` |
| **REG-3** | Geavanceerde Boolean-overlap en gebieden onder/tussen functiegrafieken of ongelijkheden; nog niet in REG-2 | M11/M12 en regio-topologie-contracten | **GPT-6 High** | `not_started` |

**Prioriteiten en synchronisatie:** vervolg bestaande geometrie (M6) en hergebruik de al op main geïntegreerde gereedschapspaneelcode; UI-T1 kan daarna als begrensde UX-mijlpaal. G-TRI1 ondersteunt M6a/M6b als bron, zonder automatische voltooiing van M6. CORE-1/UI-R1/REG-1 worden eerst als **ontwerp-/architectuurpoort** aangeboden. UI-R2 en REG-2 starten na expliciete goedkeuring en op aparte branches, niet in één grote Codex-run. Rechter inspector blijft bereikbaar, zodat numerieke input, groeps-/laagacties, geautoriseerde broninformatie en accessibility behouden blijven. Regiogebieden zijn wiskundige gekoppelde objecten met één getypeerde oppervlaktewaarheid; geen nieuwe canvasplotter of automatische T5a-source-grant.

**Kwaliteitsgates per implementatie:** inventaris van bestaande knoppen, objecttypen, command/permissieroutes en tests; test-first acceptancefixtures waar mathematisch relevant; gerichte Node & Edge en relevante volledige regressies; dynamic source drag, degeneratie, selection/focus/keyboard/fullscreen, restricted privacy, import/legacy/replay/undo en SVG/offline PNG; concreet report met echte aantallen en unexecuted controls; gebruikersacceptatie vóór merge. **Geen oude teststand claimen als nieuwe main-teststand.**

## Roadmap v2.6.0 — SYNC-1 status en REG-1 contractpoort (2026-10-13)

Deze actuele status vult de historische roadmap v2.5.0 aan; eerdere plannen, milestonevoorwaarden en uitvoeringsrapporten blijven behouden. De sync-basis is `main` commit `f4039842c44885d739b624d9d67bbfdd75d2394e`, waarin M6b `b5e693f` is geïntegreerd naast M6a, G-TRI1 en UI-T1. Branchintegratie is verifieerbaar in Git, maar is geen gebruikersacceptatie. De rapporten voor M6a, M6b, G-TRI1 en UI-T1 houden de reeds genoemde handmatige controles open; status hieronder betekent uitsluitend code-/documentatie-integratie.

| Mijlpaal | Actuele status op de sync-basis | Acceptatie-/startpoort |
|---|---|---|
| M6a — driehoekcentra | Geïntegreerd op `main`; bestaand rapport behouden | Handmatige controles uit `M6a-REPORT.md` blijven open; geen heracceptatie geclaimd. |
| M6b — uitgebreide driehoekconstructies | Geïntegreerd op `main` via `b5e693f`; eerder gerapporteerd 599/599 Node en volledige Edge-suite geslaagd | Handmatige acceptatie uit `M6B-REPORT.md` blijft open; deze historische aantallen zijn geen nieuwe SYNC-1-rerun. |
| CORE-1 | Architectuurdocument geactualiseerd tegen bestaande M6a/M6b/G-TRI1/ToolCatalog-code | Documentatiepoort geleverd; acceptatie van het ontwerp blijft expliciet. |
| UI-T1 — toolcatalogus en paneel | Geïntegreerd op `main`; acht categorieën en bestaande tool-ID's behouden | Handmatige UX-controle uit `UI-T1-REPORT.md` blijft open. |
| G-TRI1 — driehoek uit drie punten | Geïntegreerd op `main` via de mergegeschiedenis vóór `f403984` | Handmatige controles uit `G-TRI1-REPORT.md` blijven open. |
| REG-1 — dynamische regio's | Contract v1.0.1 voorgesteld in `REG-1-CONTRACT.md`; niet geïmplementeerd | Wacht op expliciete goedkeuring van document v8, `regionSchema:1`, `constructionSchema:5` en restricted-rights-matrix. |
| REG-2 — regio-objecten | Niet gestart | Alleen na REG-1-goedkeuring én aparte uitvoerings-GO; behoud alle contractgates. |
| UI-R1 — radiaalmenuontwerp | Niet gestart | Start na REG-2 als aparte ontwerp-/acceptatiepoort. |
| UI-R2 — radiale bediening | Niet gestart | Start na UI-R1-goedkeuring; inspector blijft bereikbaar tot afzonderlijke UX-acceptatie. |

**Definitieve volgorde:** **CORE-1 → REG-1 → REG-2 → UI-R1 → UI-R2**. M6a/M6b, G-TRI1 en UI-T1 zijn gerealiseerde basis en geen reden de volgorde om te keren. REG-2 bouwt dynamische polygongebieden, sectoren en segmenten volgens het goed te keuren REG-1-contract. Het voegt geen rekenengine, autorisatiepad of toolcatalogus toe: het hergebruikt `ConstructionService`, de bestaande graph/commands/permission runtime en `MI.ToolCatalog`.

**Gereedschapsclassificatie:** categorie volgt primaire taak, niet de prefix van een ID of alleen het resultaatobjecttype. `Vrije objecten` bevat handmatig getekende primaire geometrie; `Constructies` bevat afgeleide meetkundige punten/lijnen/cirkels en de G-TRI1-driehoek; `Meten & analyseren` bevat meet-/analyseacties; `Gebieden & opvulling` bevat selecteerbare afhankelijke gevulde polygon-, sector- en segmentgebieden. Overige bestaande topgroepen behouden hun betekenis. Een actief catalogusitem vereist een bestaande stabiele tool-ID, passend command-ID en bestaande autorisatie. `planned` is inert en heeft geen `data-tool`, command-ID, focusstop of uitvoeractie. Bestaande ID's wijzigen niet; nieuwe REG-2-ID's zijn `construct:polygonRegion`, `construct:circleSectorRegion` en `construct:circleSegmentRegion`.

De normatieve numerieke, geometrische, schema-, permission- en exportgates staan in REG-1 v1.0.1. Deze roadmapstatus start REG-2, UI-R1 of UI-R2 niet en markeert geen resterende handmatige acceptatie als voltooid.


## Roadmap v2.7.0 — expliciete functie- en matrixobjecten (2026-10-14)

**Status:** roadmap- en productcontractaanvulling; geen productiecode, schemas, commandtypes of tests gewijzigd. Bron voor deze aanvulling: de bestaande v2.6.0-roadmap op branch \`codex/reg-2-dynamic-regions\`, die bij het opstellen vier commits vóór op \`main\` lag. De status van REG-2 in de historische SYNC-1-sectie is een momentopname en wordt door deze documentatie niet achteraf herschreven. Deze uitbreiding vormt **geen** impliciete GO voor implementatie of merge.

**Productbesluit:** functies en matrices mogen niet uitsluitend verborgen rekenresultaten of getekende SVG-vormen zijn. Ze moeten als **getypeerde, benoemde, herbruikbare wiskundige entiteiten** kunnen functioneren. Hun definitieve opslagvorm (top-level object, apart documentregister of gedeelde waardebron) wordt pas na een afzonderlijke architectuur-/permissieaudit gekozen. Vermijd twee onafhankelijke mathematische bronnen van waarheid.

### FUN-OBJ — Herbruikbaar functieobject (plaatsing bij M11; analyse bij M12; interactie bij M13)

| Werkpakket | Geplande scope | Afhankelijkheden/acceptatie | Status |
|---|---|---|---|
| **FUN-OBJ-1: contract** | Stabiele functie-ID en zichtbare naam; getypeerd voorschrift/AST; parameters; domein; geldigheid/undefined-regio's; koppeling met bestaande K2-functieservice en expression-engine | M11, K2 en bestaande T5a-parser/evaluator verifiëren; geen tweede interpreter, geen JavaScript-eval; eenheden, numerieke grenzen en versiebeheer expliciet definiëren | \`planned\` |
| **FUN-OBJ-2: grafische representatie** | Functies \`y=f(x)\` als selecteerbare, stijlbare grafiek op het bestaande illustratorcanvas; kleur, lijndikte/patroon, zichtbaarheid, naamlabel, segmentatie/discontinuïteiten, viewport en eventueel asymptoten | M11a; robuuste adaptive sampling/clipping, geen koppeling van de functie-identiteit aan een tijdelijke SVG-path; SVG/PNG, hit-test, zoom, pan, beperkingen/rechten | \`planned\` |
| **FUN-OBJ-3: afgeleide analyses** | Gekoppelde nulpunten, functiedoorsneden, extrema, raaklijn/afgeleide, integraalgrenzen en Riemannsom; behoud van dynamische bronreferenties | M12a–c; numerieke foutcontracten, degeneratie/geen oplossing, stale recalculations, dependency graph en Undo/Redo | \`planned\` |
| **FUN-OBJ-4: parameterkoppeling** | Functieparameters koppelen aan bestaande/geplande sliders, interactieve lessen en getypeerde tekstwaarden | M13, M14, T5c en permissiemodel; geen direct DOM-to-model pad; export/replay deterministisch | \`planned\` |

**Minimale zichtbare eigenschappen van een functie:** identiteit/naam (bv. \`f\`), voorschrift, domein, parameterdefinities, kleur, lijnpatroon/dikte, label, zichtbaarheid en document-/asreferentie. **Afgeleide/read-only** eigenschappen zoals functiewaarde op een punt, intercepts of asymptoten komen pas beschikbaar volgens het passende M12-contract. Parametrische/impliciete functies (M11b/c) gebruiken dezelfde gedeelde functie- en evaluatieprincipes maar vereisen eigen getypeerde varianten; forceer ze niet in de \`y=f(x)\`-vorm.

### MAT-OBJ — Getypeerde matrixwaarde en visueel matrixobject (K4, M7, teksteditor)

| Werkpakket | Geplande scope | Afhankelijkheden/acceptatie | Status |
|---|---|---|---|
| **MAT-OBJ-1: matrixwaarde** | Stabiele ID/naam, getypeerde dimensies \`m×n\`, celwaarden/expressies en expliciet numeriek/exact contract; validatie van afmetingen, overflow en singulariteit | K4; één centrale matrix-/vectoralgebraservice, compatibel met bestaande T5a/K1/K2 waardecontracten; geen tweede evaluator | \`planned\` |
| **MAT-OBJ-2: rekenen** | Optellen, vermenigvuldigen, transponeren, determinant, inverse, RREF en waar van toepassing rang; gecontroleerde dimensie- en singulariteitsfouten | K4, numerieke golden tests/onafhankelijke orakels; veilige dimensie-/geheugenlimieten en versiebeheer | \`planned\` |
| **MAT-OBJ-3: visuele editor** | Matrix als leesbaar én bewerkbaar object/waarde op het canvas via de bestaande tekstwerkruimte: cellen, haken, lettertype, stijl, schaal, labels en selectie | T1–T4 tekst-layout/export, toekomstige T5c bronbinding; geen tweede rich-text-editor, geen gecachte onafhankelijke matrixwaarheid | \`planned\` |
| **MAT-OBJ-4: geometrische koppeling** | Typisch 2×2 voor lineaire vlaktransformaties; 3×3 homogene matrices voor affiene transformaties als afzonderlijk goedgekeurd contract; dynamische koppeling aan objecten | M7; expliciete conventie rij-/kolomvector, volgorde van vermenigvuldiging, affine versus projectieve semantiek, degeneratie en bronafhankelijkheid | \`planned\` |

**Minimale eigenschappen:** naam, afmetingen, individuele elementen, weergavenotatie, precisie/exactheid waar ondersteund, label en stijleigenschappen. Een **matrixwaarde** is niet automatisch een geometrisch canvasobject. De editor toont een gecontroleerde visuele projectie van diezelfde waarde, bij voorkeur via de bestaande tekst-/formulelayout. Bij matrixgestuurde geometrie mag wijziging van een cel na geldige commit een afhankelijke transformatie opnieuw berekenen; matrixopslag en grafische weergave blijven gescheiden.

### Overkoepelende ontwerp- en veiligheidsgates

1. **Eén rekenwaarheid:** hergebruik \`expression-engine\`, bestaande typed source adapters en geplande K2/K4-services; geen aparte functieparser, vector-/matrixengine of grafiekcalculator.
2. **Eén geometrische waarheid:** M7/M11/M12 integreren met bestaande model-/constructie-/transformatiecontracten, selectie, undo/redo, documentvalidatie en persistente IDs.
3. **Schema- en permissiepoort vóór implementatie:** documentversie, bronnen/capabilities, restricted projections, author/course/assessment, locks, duplicatie, verwijdercascade, import, export en semantic replay moeten expliciet worden ontworpen en goedgekeurd.
4. **Presentatie:** objecten en resultaten zijn bereikbaar via de bestaande inspector en later de contextuele radiale eigenschappenbediening; keyboard/touch/screenreader/fullscreen moeten werken; geen uitsluitend visuele representatie.
5. **Numerieke veiligheid:** ongedefinieerde functies, discontinuïteiten, divergente evaluatie, dimensiemismatch, singuliere matrices, zeer grote getallen, schaal en eenheden hebben gedefinieerd fout- of invalid-beleid; geen stilzwijgende fictieve precisie.
6. **Relevante tests:** onafhankelijke algebra- en functietests, bronafhankelijkheden, matrixtransformatie, Undo/Redo, duplicatie, import/legacy, restricted-permissies, deterministische SVG/PNG en real-browser regressies. Rapporteer werkelijk uitgevoerde tests; documentatie-only is niet hetzelfde als PASS.
7. **Geregisseerde uitvoering:** FUN-OBJ en MAT-OBJ zijn **aanvullingen op** M7/M11/M12/M13 en K4/T5; ze vervangen geen bestaande milestone en geven geen toestemming voor implementatie. Neem ze mee bij de latere milestone-specificaties, in kleine afzonderlijk te accepteren pakketten.

**Voorgestelde plaats in gereedschappen:** grafische functies onder **Functies & grafieken**; matrices als wiskundige waardebron via **Tekst & interactie** en calculator/K4, met **Matrixtransformaties** onder **Transformeren**. Geen duplicaat-ID of tweede eigenaar voor dezelfde matrixfunctie. Voor een functionele matrixeditor pas een afzonderlijk nieuw gereedschap toe na een catalogus-/UX-besluit.


## Roadmap v2.8.0 — DOC-RADIAL-1: consolidatie van UI-RADIAL-1–9 (2026-10-14)

**Type:** documentatie- en statusconsolidatie. Geen nieuwe geometrische productiecode, tests of permissiewijzigingen. **Actuele bron:** featurebranch `codex/ui-radial-7-point-context-constructions` na UI-RADIAL-9; `main` is hiermee niet impliciet bijgewerkt.

### Actueel statusoverzicht (featurebranch, niet historisch herinterpreteren)

| Werkpakket | Inhoud en actuele bron | Implementatie | Handmatige beoordeling | Automatische tests | Merge |
|---|---|---|---|---|---|
| UI-RADIAL-1–3 | Contextueel wiel, zwevende inspector in plaats van permanente rechterbalk, pointer-/contextafhandeling; [oorspronkelijk verslag](UI-RADIAL-1-REPORT.md) | Op featurebranch | Iteratief bijgestuurd | Niet uitgevoerd in dit UI-RADIAL-traject | Niet op `main` |
| UI-RADIAL-4–6 | Compacte navy/gold-ring met zes gebogen segmenten (ongeveer 322 px), sleepgreep en goedgekeurde actieve indicator; [vormgevingsverslag](UI-RADIAL-4-REPORT.md) | Op featurebranch | Iteratief beoordeeld | Niet uitgevoerd | Niet op `main` |
| UI-RADIAL-7A/B/C | Exclusieve puntcategorieën, contextuele puntconstructies, grotere aanklikzone, uitsluitend rechtsklik; [historisch pilotverslag](UI-RADIAL-7-POINT-PILOT.md) | Op featurebranch | Gebruiker bevestigt werking | Niet uitgevoerd | Niet op `main` |
| UI-RADIAL-8 | Cirkel en lineaire objecten: gedeelde constructies, voorinvulling van latere bronnen, eindpuntpaar; [pilotverslag](UI-RADIAL-7-POINT-PILOT.md) | Op featurebranch | Gebruiker bevestigt werking | Niet uitgevoerd | Niet op `main` |
| UI-RADIAL-9 | Generieke contractgestuurde bronplannen, één starter, ook driehoeken/veelhoeken via normale rollen; [actueel normatief contract](UI-RADIAL-9-CONTRACT-DRIVEN.md) | Op featurebranch | Gebruiker bevestigt werking | Niet uitgevoerd | Niet op `main` |
| DOC-RADIAL-1 | Architectuurafspraken, statussen en Codex-bronvoorrang consolideren; [AGENTS.md](../AGENTS.md) en dit addendum | Documentatie-only | Nog niet apart afgetekend | Geen tests uitgevoerd | Niet op `main` |

**Normatief:** [UI-RADIAL-9-CONTRACT-DRIVEN.md](UI-RADIAL-9-CONTRACT-DRIVEN.md) en [AGENTS.md](../AGENTS.md); [CORE-1](CORE-1-ARCHITECTURE-DESIGN.md) is de onderliggende geometrische architectuur. De vroegere UI-R1–R3-voorstellen en hun instructies om een permanente **rechter inspector** te behouden zijn **historische ontwerpbeslissingen**, vervangen door de later afzonderlijk goedgekeurde zwevende detailweergave.

### Product- en architectuurafspraken die voortaan moeten blijven gelden

1. Voor één geselecteerd object met geldige bronplannen: **Constructie, Uiterlijk, Geometrie, Relaties, Acties, Alles**. `Alles` blijft de volledige inspector; labelzichtbaarheid is een bestaande actie en er wordt geen extra Labels-categorie voor dergelijke objecten aangemaakt.
2. Het radiaalmenu opent alleen met **rechtsklikken op de geometrie**. Normale linkermuisklikselectie en verslepen tonen geen los eigenschappenicoon; rechts-sleep kan kaderselectie blijven. Het compacte wiel wordt alleen via de greep verplaatst; categorieklikken houden het anker vast.
3. **Niet de UI maar de constructieservice bepaalt toepasselijkheid**: `ConstructionService.contextualPlans(object,kind)` gebruikt bestaande bronrollen en referenties. `ToolCatalog` beperkt tot geïmplementeerde gereedschappen; permissies bepalen zichtbaarheid en uitvoering.
4. **Eén startfunctie**, `EditorApp.startContextConstruction(toolId,objectId,planKey)`, gebruikt `prefill`, `complete` en `placement`. Alle modelmutaties blijven via bestaande geautoriseerde `construction.create`-commands en geschiedenis.
5. Voor **nieuwe objecttypen** blijft implementatie van de nodige geometrische rol-/onderdeelreferenties, geldige toolregistratie en soms gespecialiseerde interactie vereist. Er mag geen radiale objecttype-whitelist opnieuw verschijnen. De bestaande keuze van maximaal één plan per gereedschap en uitzonderingen zoals cirkelverdeling/gerichte hoekarmen zijn expliciete grenzen, geen reeds opgeloste functionaliteit.
6. Houd **gebruikersacceptatie en automatische verificatie gescheiden**. Gebruikersfeedback bevestigt dat de huidige radiale constructiewerkwijze functioneert; er is daarmee niet verklaard dat alle regressie-, toegangs-, mobiele of exportscenario's automatisch getest of gemerged zijn.

### Vervolgpoort

UI-RADIAL-9 vraagt **geen automatische uitbreiding** naar nieuwe constructies of schemawijzigingen. Wanneer nieuwe objecten of bronsoorten worden geïmplementeerd: model en broncontract → catalogus → `contextualPlans` → bestaande starter/commando en rechten → gerichte verificatie volgens gebruikersopdracht. Een toekomstige merge naar `main` moet als afzonderlijke beslissing worden behandeld.

**Behouden oudere plannen:** M7/M11–M13 en K4/T5 voor functies/matrices (v2.7.0) blijven ongewijzigd gepland. Dit addendum verandert geen historische testresultaten of eerdere beslissingen.


## Roadmap v2.8.1 — UI-RADIAL-10: constructielijst en regiolabels (2026-10-14)

**Implementatie:** featurebranch `codex/ui-radial-7-point-context-constructions`, **niet** naar `main` gemerged. Technisch verslag: [UI-RADIAL-10 — scroll, kleur en regiolabel](UI-RADIAL-10-REGION-LABEL-AND-SCROLL.md). Dit is een vervolg op UI-RADIAL-9, zonder nieuwe geometrische engine, objecttypes of afhankelijkheidschema's.

| Werkpunt | Branchstatus | Handmatige gebruikersacceptatie | Tests |
|---|---|---|---|
| Contextuele constructielijst valt onder beeld | Paneelhoogte wordt geklemd op beschikbare canvas-/viewporthoogte; zichtbare scroll en sticky heading | **Open** voor UI-RADIAL-10 | **Niet uitgevoerd** |
| Vulkleur cirkelsector/-segment | Bestaande kleurbediening richt zich voor regio standaard op `style.fill`; rand afzonderlijk; `fill='none'` wordt geëerbiedigd | **Open** | **Niet uitgevoerd** |
| Oppervlakteprecisie | Regioslider 0–3 met effectieve standaard 2, labelupdate via bestaande properties | **Open** | **Niet uitgevoerd** |
| Labelpositie oppervlakte | Het gewone selecteerbare/versleepbare `object-label` gebruikt `labelOffsetX/Y`; oude `areaDisplay.position`-waarden blijven voor laden/weergave ondersteund maar verschijnen niet meer als instelling | **Open** | **Niet uitgevoerd** |

**Vaste ontwerpeis:** alle berekende regiolabels gebruiken de gedeelde labeldragcontroller en behoud van positie bij dynamische bronwijzigingen; bouw geen aparte regio-labeldragcode. Voor toekomstig regio- of labelwerk [AGENTS.md](../AGENTS.md), [UI-RADIAL-9](UI-RADIAL-9-CONTRACT-DRIVEN.md) en het nieuwe [UI-RADIAL-10-verslag](UI-RADIAL-10-REGION-LABEL-AND-SCROLL.md) raadplegen. Automatische regressietests en gebruikersbeoordeling van deze wijzigingen moeten apart worden gerapporteerd. Historische eerdere statusregels worden niet terugwerkend gewijzigd.

## Roadmap v2.8.2 — UI-TOOLBAR-1: geschiedenis- en icoonconsistentie (2026-10-14)

**Branch:** `codex/ui-radial-7-point-context-constructions`. **Status:** geïmplementeerd op featurebranch, handmatige acceptatie nog open, geen regressietests in deze taak, niet naar `main` gemerged. Specificatie: [UI-TOOLBAR-1-HISTORY-AND-ICONS.md](UI-TOOLBAR-1-HISTORY-AND-ICONS.md).

| Bediening | Normatieve positie en gedrag |
|---|---|
| Document `undoBtn` / `redoBtn` | Alleen iconen in de canvaswerkbalk, niet meer in de hoofdtitelbalk; bestaande documentgeschiedenis en sneltoetsen |
| Tekst `richUndo` / `richRedo` | Alleen iconen in de rijke tekstopmaakbalk, direct rechts van **Rechts uitlijnen**; bestaande, afzonderlijke tekstgeschiedenis |
| Hoofdproducttitel | **Wiskundige Illustratie Editor** |
| Opslaan | Herkenbaar diskette-SVG met label **Opslaan** |
| Meer (hoofd- en teksttitelbalk) | Zelfde ellipsis-SVG en typografie; `details/summary`-semantiek behouden |
| Toevoegen (teksteditor) | Plus-SVG met label **Toevoegen**; bestaande submit behouden |

**Architectuur:** verplaats de bestaande semantische elementen met ongewijzigde IDs en handlers; bouw geen tweede historycontroller en voorkom dubbele knoppen of conflicterende keyboardkortsluitingen. Iconen zijn inline SVG met gedeelde CSS, zonder visuele emoji/Unicode-plaatsvervangers. UI-RADIAL-9 en UI-RADIAL-10 blijven normatief voor constructies en regiolabels.

**Validatie:** GitHub-broncontrole uitgevoerd; geen Node/Edge/browsertests uitgevoerd op verzoek uit de eerdere ontwikkelreeks.

## Roadmap v2.8.3 — UI-COLOR-1: kleurenpalet en kleurkiezer (2026-10-14)

**Branch:** `codex/ui-radial-7-point-context-constructions`. **Status:** geïmplementeerd op featurebranch; handmatige acceptatie en browserregressie **open**, geen automatische tests uitgevoerd, niet naar `main` gemerged. Normatief verslag: [UI-COLOR-1-PALETTE-REDESIGN.md](UI-COLOR-1-PALETTE-REDESIGN.md).

- **Visueel:** kleurenvenster in donkerblauw/goud, oorspronkelijke en nieuwe kleur naast elkaar, 12 grotere kleurstalen in 6×2, gouden selectie- en focusindicator, responsief.
- **Interactie:** gedeelde HEX-invoer, native systeemkleurkiezer, presetkeuze en live preview synchroniseren. Bestaande Apply/Cancel-, Undo/Redo- en permission-contracten blijven behouden.
- **Regio's:** `Geen vulling` alleen bij `style.fill`, transparantie en expliciete `style.fill='none'` behouden; bij ontbrekende fill rendererstandaard tonen.
- **Geen nieuwe kleurenengine:** `EditorColor`, de bestaande `object.setProperties`-paden en de gedeelde dialoog blijven de eigenaars. De teksteditor deelt het bijgewerkte presetpalet.

**Validatie:** statische code-/GitHub-verificatie; gebruiker moet nieuwe kleurkiezer en geschiedenisgedrag nog in browser beoordelen.

## Roadmap v2.8.4 — UI-PANEL-1: uniforme eigenschappenpanelen (2026-10-14)

**Status:** geïmplementeerd op `codex/ui-radial-7-point-context-constructions`; niet naar `main` gemerged, gebruikersacceptatie en browserregressie nog open. Normatief ontwerp: [UI-PANEL-1 — gedeelde vormgeving](UI-PANEL-1-UNIFIED-PROPERTY-DESIGN.md).

De goedgekeurde **Geometrie**-preview wordt de **visuele standaard** voor alle eigenschappenpanelen: Uiterlijk, Relaties, Acties, Metingen, Labels, Alles, regio-eigenschappen en andere bestaande `data-property-section`-secties. Dezelfde navy/gold-kaarten, SVG-sectieiconen, chevrons, invoervelden, informatievakken, sliders en focusstates worden centraal toegepast. De bestaande compacte afmetingen, viewport-veilige scroll en native `details/summary`-interactie blijven behouden.

**Architectuur:** één gescopeerd CSS-systeem onder `.radial-detail-pane`, en één idempotente `RadialProperties.decoratePropertySections()`-presentatiehelper die de bestaande `SEGMENT_ICONS` hergebruikt. Geen duplicatie van object-specifieke propertypanels, geen nieuwe model-/commandopaden, geen aanpassing van bestaande permissies of Undo/Redo.

**Validatie:** GitHub-broncontrole uitgevoerd; handmatige toetsing op verschillende objecttypes, fullscreen, kleine vensters en keyboardnavigatie vereist; geen automatische/browsertests uitgevoerd.

## Roadmap v2.8.8 — STAB-1: integratie en regressie (2026-10-15)

**Uitgangsbasis:** branch `codex/stab-1-integration-regression` fast-forward bijgewerkt naar actuele `origin/main` `ccacb0ddeb54d561fe0eddbc5d2280515fd67f74` (PR #13). De audit `WIE-STAB-1-Architectuur-en-Testdekkingsaudit-v1.0.0.md` onderzocht de eerdere `main`-HEAD `8603355`; verschillen zijn vóór aanpassing opnieuw gecontroleerd.

- Vijf auditconflicten zijn op actuele code en tests herbeoordeeld; het scriptmanifest en de nieuwe tabstructuur zijn bijgewerkt en blijven door regressieasserties bewaakt.
- JavaScript-cache-invalidering gebruikt één gedeeld release-token voor de 49 klassieke scripts; de Edge-test blijft een verouderde gecachte `model.js` injecteren en controleert tekencompatibiliteit.
- Gerichte Edge-dekking omvat radiale eigenschappen/bronrollen, UI-TABS, kleurenpalet, lagen, undo/redo en regio-label/scroll. UI-RADIAL-11/12 en layer-multidrag van PR #13 zijn in de volledige suite meegenomen.
- Technisch testbesluit en open handmatige acceptatie: [STAB-1-implementatie- en testrapport](STAB-1-IMPLEMENTATION-AND-TEST-REPORT.md). Geen merge naar `main` vanuit STAB-1.

## M8a-1b — Ellips met permanent besturingspunt Q (2026-10-15)

**Basis:** actuele `origin/main` `9da6e2a50d8aa08a1e11ee95e3b8a46e8f650da7`; M8a-1 en M8a-2 zijn geïntegreerd via PR #15 en #16. **Branch:** `codex/m8a-1b-ellipse-control-point`. De normatieve contractaanvulling is [M8a-ELLIPSEN-CONTRACT.md](M8a-ELLIPSEN-CONTRACT.md) v1.1.0.

M8a-1b vervangt alleen de gebruikersgerichte nieuwe ellipsconstructie: drie puntbronnen F₁, F₂ en blijvend Q; `S=|QF₁|+|QF₂|` wordt afgeleid. Bestaande `ellipseByFociAndSum`-documenten en hun numerieke S-invoer blijven intact. De nieuwe bronconstructie gebruikt dezelfde `EllipseGeometry`, `ConstructionService`, permission-/history-, inspector-, render- en exportpaden. Schema 7 wordt uitsluitend geactiveerd wanneer een object van het nieuwe recept wordt opgeslagen; document v9, `ellipseSchema:1` en schema-6-lezing blijven behouden.

| Deel | Status bij branchstart | Acceptatiepoort |
|---|---|---|
| Architectuurcontrole en testimpactmatrix | Afgerond vóór productiecode | Vastgelegd in implementatieverslag en commit `ce20ffc` |
| Contractaddendum v1.1.0 | Normatief, vóór productiecode vastgelegd | Schema-, compatibiliteits- en interactiebeleid expliciet |
| Driebronrecept, cycles, schema 7, atomische Q+ellips | Geïmplementeerd | `npm test`: 665/665 geslaagd; replay, undo/redo en rollback gedekt |
| Tool, preview, bestaande-Q/vrije-Q-interactie en eigenschappen | Geïmplementeerd | Gerichte Edge-acceptatie geslaagd; preview p50/p95/max 0.4/0.5/0.5 ms; volledige browserregressie en handmatige bediening staan open voor gebruiker |
| `pointOnEllipse`, restricted rechten, legacy en exports | Gericht gecontroleerd | Node en gerichte Edge-check groen, inclusief SVG/PNG en restricted automatic Q; volledige Edge-regressie nog open |
| Gebruikersacceptatie en integratie naar `main` | Open | Gebruiker voert browsercontrole uit; geen merge naar `main` |

Historische M8a-1/M8a-2 testresultaten en acceptatiestatussen blijven ongewijzigd. Uitgevoerde testresultaten voor M8a-1b worden alleen in het afzonderlijke [implementatieverslag](M8a-1b-ELLIPSE-CONTROL-POINT-IMPLEMENTATION.md) bijgehouden.
