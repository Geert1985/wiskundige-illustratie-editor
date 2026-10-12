# Mathematical Illustration Platform — Development Roadmap

Version: 1.6.0 (T5-prep design/prototype checkpoint, 2026-10-12)
Status: proposed sequencing; validate against repository
Date: 2026-10-12

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
| M7a | Linked vector AB and component representation | Useful input for vector translation; fixed/free vector semantics |
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

De modernisering krijgt milestone-ID **T5-prep**, na formele T4-gebruikersacceptatie en vóór T5a. De nummering T5a–T5d blijft uitsluitend voor de wetenschappelijke rekenmachine. T4 handmatige acceptatie is nog open; de hieronder beschreven voorbereiding verandert dat niet.

Het T5-prep-ontwerp is voorwaardelijk goedgekeurd en als voorbereidende stap is een geïsoleerd prototype gebouwd voor ontwerpbeoordeling. De formele T5-prep-productie-integratie blijft na T4-gebruikersacceptatie en afzonderlijke prototype-acceptatie. Het prototype is geen productie-integratie. Geen bestaande teksteditor, opslag/schema, ProseMirror-runtime, MathSource of exportpad is gewijzigd. Zie [moderniseringsvoorstel v1.1.0](T5-TEXT-EDITOR-MODERNIZATION-PROPOSAL.md) en [prototype-rapport](T5-PREP-UI-PROTOTYPE-REPORT.md).

Vastgelegde keuzes: desktopoverlay en begrensde mobiele sheet; één zoekveld plus categoriechips; Nederlandse UI met Nederlandse/Engelse zoektermen; expliciete Unicode/LaTeX-route per symbool; betrouwbare selectie van het eerste sjabloonargument. Tab-navigatie wordt alleen toegevoegd na aparte geslaagde proef. Documentmodel blijft onveranderd; rekenfunctionaliteit is buiten scope.

| Volgende gate | Vereiste |
|---|---|
| T4-acceptatie | Gebruiker voltooit open handmatige controles en accepteert T4; eventuele correcties vóór verder werk afronden. |
| T5-prep-review | Gebruiker beoordeelt ontwerp, prototype en rapport; afzonderlijke toestemming vereist vóór productie-integratie. |
| T5a | Alleen na T5-prep-gate én definitieve goedkeuring van het mathematische contract; bouwt de UI-onafhankelijke parser/AST en evaluatie-engine. |
| T5b–T5d | Behouden gedeelde calculator UI, typed inline calculatedValue en integratie-audit, elk met eigen start/acceptatiepoort. |

De prototypescreenshots tonen de bestaande dialoog ter vergelijking en de geïsoleerde nieuwe editor, symbolen, formule en mock dynamische waarden. Edge-tests van dit prototype zijn geen volledige T4-regressie of handmatige gebruikersacceptatie. Ongeteste IME, assistieve technologie, echte bronautorisatie en externe SVG/PNG-viewers blijven open.