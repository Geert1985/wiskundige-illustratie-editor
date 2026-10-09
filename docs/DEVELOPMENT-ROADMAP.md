# Mathematical Illustration Platform — Development Roadmap

Version: 1.0.0
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
