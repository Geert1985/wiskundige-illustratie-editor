# Mathematical Illustration Platform — Development Roadmap

Version: 1.1.0
Status: proposed sequencing; validate against repository
Date: 2026-10-09

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
| After M5b, before dynamic text | Units, scale and measurement notation | New default cm, 1 coordinate unit = 1 cm, precision 2; axis inspector; length scale and area scale squared; decide legacy migration first |
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
