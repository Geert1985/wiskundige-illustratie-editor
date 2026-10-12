# Mathematical Illustration Platform — Complete Feature Backlog

Version: 1.6.0
Status: proposed; reconcile with repository before implementation. T5a and the full text workspace are accepted and integrated; calculator F11 and future TI-36X Pro parity remain unimplemented. M6 geometry precedes the separately gated calculator milestones.
Date: 2026-10-12

Priority is implementation sequence, not permission to omit any feature. All entries are in scope for the long-term product. Status: proposed / existing-to-verify / implemented / tested / released.

## F01 — Selection and editing
- Right-mouse drag rectangle to select one or many objects; define containment vs intersection, additive selection modifiers, context-menu suppression, right-click accessibility alternative, and interaction cancellation.
- Group objects; multi-object drag and transform; object locks; visibility; layer ordering; object list and selection synchronization.
- Undo/redo and reversible command history, including geometry, style, imports and grouped operations.
- Properties inspector for exact coordinates, lengths, angles, expressions and relations.
- Reusable construction templates and component library.

## F02 — Geometric primitives and construction tools
- Ellipse by focus F1, focus F2, then a third parameter (point on ellipse or major-axis sum); validate sum > distance between foci; editable foci and dimensions.
- Parallelogram with two side lengths and included angle, with live length/angle labels and exact numeric input; preserve parallel sides.
- Existing constructions to inventory and verify: angle bisectors, parallel/perpendicular lines, tangents, circumference, area.
- Special triangle constructions: centroid, orthocenter, circumcenter, incenter, Euler line and nine-point circle.
- Geometric locus/traces, including dependent points constrained to a path.
- Consistent snapping and exact measurement behavior for all new primitives.

## F03 — Transformations and vectors
- Reflection: select object(s), then choose a line segment as reflection axis (mathematically the supporting infinite line); live preview and choice of copy vs replace.
- Translation by vector or specified horizontal/vertical displacement.
- Rotation about selectable center, with exact angle and live preview.
- Uniform and nonuniform scaling about selectable center; clear behavior for negative and zero factors.
- Transformation composition, history and inverse transformations.
- Vector drawing, addition, subtraction, scalar multiplication, dot product and projections.
- Matrix-driven 2D linear transforms: rotation, scaling, shear and reflection; visualize transformed basis and unit square.

## F04 — Coordinate systems and grid
- Grid on/off toggle directly accessible in coordinate-system menu; preserve axis/grid independence.
- Multiple coordinate systems per document, each with origin, labels, grid and presentation.
- User-drawn basis vectors e1/e2 defining direction, orientation, units and angle; reject linearly dependent vectors and handle nonorthogonal coordinates.
- Interactive basis-vector editor with grid and vector transformations.
- Explicit conversions between world coordinates and coordinate-system coordinates.

## F05 — Functions and calculus
- Cartesian function plotting y=f(x).
- Parametric curves x(t), y(t).
- Implicit curves F(x,y)=0, with reliable numerical methods and domain warnings.
- Zeros, intersections and extrema, with numerical accuracy disclosure.
- Movable graph point, tangent, slope and derivative visualization; secant-to-tangent limiting demonstration.
- Definite integral, adjustable integration bounds and Riemann sums; comparison of approximation and area.

## F06 — Dynamic geometry
- Construction dependency graph: derived points, lines, circles, intersections, midpoints, perpendicular bisectors, etc. recompute when parents move.
- Dependency inspection tree; cycle prevention; invalidity and degenerate geometry handling.
- Invariants exploration and dynamic theorems; distinguish experimental observation from formal proof.
- Geometric loci, animation of free or constrained points and traces.

## F07 — Course interaction
- Author-defined draggable points and adjustable parameters/sliders.
- Animation timeline, keyframes, playback speed, pause, loop and step-through construction.
- Guided exploration, progressive hints and explanatory overlays.
- Interactive demonstrations: Pythagorean rearrangement, inscribed angle theorem, circle/triangle properties, derivatives, integrals.
- One figure usable as static illustration, interactive course widget and assessment task.
- Math/LaTeX labels, annotations and accessibility descriptions.

## F08 — Assessment and validation
- Assessment authoring: prompt, initial state, allowed tools, movable/locked/hidden objects, goals, hints, feedback and scoring rules.
- Mathematical answer evaluation by properties rather than pixel equality; geometric tolerance, equivalent solutions and degenerate cases.
- Separate result-based validation from method-based validation (allowed construction sequence).
- Record attempts, evidence and progress via the host game/assessment system.
- Secure authoritative evaluation outside the learner's browser for scored assessments.
- Versioned assessment artifacts and reproducibility when editor versions change.

## F09 — Proofs and explanation
- Visual proof sequences, including geometric rearrangements.
- Explicit formal proof-step representation with assumptions and cited theorems; do not treat sampled configurations as proof.
- Interactive invariant exploration and teacher-authored guided investigations.

## F10 — Author workflow and publishing
- Object layers, templates, library and reuse.
- Step-by-step construction replay and undo/redo history.
- SVG and PNG export presets for Markdown courses and presentations.
- Interactive embed package and versioned document/activity/assessment formats.
- Publication workflow: draft, review, test, publish, freeze assessment version.
- Performance budgets for large documents; keyboard accessibility and touch/mobile acceptance matrix.

## Cross-cutting acceptance rules
For each feature specify geometry, interaction, persistence, preview/commit, permissions, import/export, browser tests, performance, accessibility, and failure states. No unbounded feature implementation prompts. Avoid duplication of already-implemented features.

## Amendment 1.1.0 - UI/UX modernization tracking

Date: 2026-10-09. Additive tracking only: no existing feature requirement is removed or marked released by this amendment. See M2c-UX-SPEC-v1.1.md (UX01-UX16) and M2c-IMPLEMENTATION-PLAN.md for evidence, scope and acceptance.

| Related requirement | UI deliverable / remaining gap | Status |
|---|---|---|
| F01, F10 | Compact tool categories, central selection/navigation, right inspector, accessible file menu, layers | Proposed M2c.1-4; approval pending |
| F01, F06 | Preserve construction inspection, detach, computed-field guards, groups/locks/history | Existing foundation; UI migration must retain regression coverage |
| F04 | Direct grid toggle and existing Cartesian axes properties in context panel | Existing functionality to relocate / presentation to improve |
| F04 | Logarithmic, semilogarithmic and polar coordinate systems | Missing; mathematical follow-up required, not a UI switch |
| F04 | Separate labels/numbers, axes style/arrowheads, major/minor grid and independent origin marker | Proposed extensions; persistence/export/permission contract needed first |
| F07, F08 | New controls honor M2b runtime grants, learner-view isolation and trusted baseline | Mandatory cross-cutting acceptance, no new course/assessment host feature |
| F10 | Responsive panels, keyboard/focus/contrast, visual reference comparison | Proposed M2c integration gate; explicit user visual acceptance required |

Origin marker styling must remain separate from geometric point style.radius. Generic arrow/type/equation editing shown in the visual reference is not currently implemented and is not silently introduced by layout changes. All original long-term requirements remain retained.

## M2c implementation status

The proposed M2c UI items above are implemented and technically tested; user visual/functional acceptance is pending. Existing coordinate-system and presentation-extension gaps remain unchanged and retained. No requirement is removed. Evidence: M2c-REPORT.md.

## Post-M5a product additions (2026-10-10)

See [functional specification](POST-M5A-ENHANCEMENTS-SPEC.md) and the sequencing table in [roadmap](DEVELOPMENT-ROADMAP.md). These are additions, not replacements of existing requirements.

- Current authorized work: grid enabled for new editor documents; red default construction styles; central accessible step instructions for every tool.
- M5b addition: tangent through a linked point on a circle, preserving current tangent cases.
- Before dynamic text: document units/scale/precision in axis properties, default cm for new documents; preserve absent-metadata legacy display. Then safe typed dynamic text bindings with explicit source-deletion behavior.
- M8: regular polygons from center/vertex/n; possible independent checkpoint after M5b.
- M7a/M7f: linked/component vectors, then vector operations and their visualizations.
- Dedicated sets stream: shared typed semantics, Venn/Euler, interval number line; coordinate-plane sets at/after M11 numeric/expression groundwork. All three representations retained.

The later items remain planned until individually requested. No milestone number is silently reassigned.

## Units/scale/notation implementation status (2026-10-10)

Document units, positive physical scale and fixed decimal precision are delivered before dynamic text, with explicit legacy preservation. New author editor documents use cm, scale 1, two decimal places. Length, radius, perimeter, area, angle and live polygon labels share validated notation; free measurement text is preserved. Source geometry/graph, coordinate axes and zoom remain independent. Author-only settings command with undo/replay and restricted display/export; see UNITS-SCALE-CONTRACT.md and UNITS-SCALE-REPORT.md. Manual acceptance pending. Dynamic text references, formulas/templates, source deletion/invalidity behavior and additional mathematical notation remain planned, not included in this checkpoint.

## Coordinate projections implementation status (2026-10-10)

Specification 1.4.0 section 9 implemented at a39a779: optional x/y/both point projections, separately controlled signed values using document units, explicit Cartesian document frame, clipped dotted presentation, persistence/history/replay and existing property grants. Full 338 Node tests and 41 Edge modules pass; manual acceptance pending. See POINT-PROJECTIONS-REPORT.md. Future multiple/skew coordinate frames remain retained; this presentation adds no construction graph objects. Dynamic text remains next separately scoped addition.

## Dynamic angle measurement implementation (2026-10-10)

Specification 1.5.0 section 10 delivered at 78d0259 with 346 Node tests and 42 Edge modules passing. Stable source-based three-point, direction/direction and direction/Cartesian-positive-x angles; explicit smallest/directed interpretation; degree/radian document standard and per-angle overrides/precision/arc. Existing static options retained. See DYNAMIC-ANGLES-REPORT.md for contract, compatibility, policy and acceptance. Future multiple frames, broad length/perimeter/area measurement architecture and dynamic text remain retained, not implemented by this checkpoint.


## Dynamic text delivered (2026-10-10)

One typed value reference per free text object implemented with source/value/precision/prefix/suffix UI and shared notation. Missing/invalid/inaccessible sources remain visibly unavailable; deletion does not cascade to text. 352 Node tests, 43 Edge modules pass; manual acceptance pending. DYNAMIC-TEXT-CONTRACT.md defines persistence/locks/permissions/replay. Multi-field templates, formulas and later broad measurement architecture remain planned.


## Typed axis sources (2026-10-11)

User angle-feedback revision implements Cartesian axis constants as angleDirections sources, not document objects. Fixed positive orientation and origin for parallel axis combinations; supporting intersection otherwise. Dedicated menu entry superseded, saved angleXAxis retained. Axis selection is gated per tool, axis visibility and explicit course/assessment grant. ConstructionSchema 3 and graph/export/replay adaptations documented in AXIS-REFERENCES-CONTRACT.md. Other axis-based constructions, skew/multiple frames and wider measurement work remain separate. Manual acceptance pending.

- 2026-10-11 sidebar refinement: vertically stacked, equally wide tool buttons in a 220px sidebar; long names and split-menu bounds verified at desktop, tablet and mobile widths.


## F11 — Scientific calculator: standalone and inline (amendment 1.2.0)

Status: **functionally approved; not implemented**. Documentation-only scope; no T3/T4/T5 milestone is started or restarted. Normative technical contract: [TEXT-EDITOR-ARCHITECTURE.md, section 22](TEXT-EDITOR-ARCHITECTURE.md#22-t5--zelfstandige-en-inline-wetenschappelijke-rekenmachine-150); separate acceptance gates and tasks: [TEXT-EDITOR-IMPLEMENTATION-PLAN.md](TEXT-EDITOR-IMPLEMENTATION-PLAN.md).

- A standalone application feature opens from the main toolbar without creating/selecting text; inline opens through ∑ in the text editor. Build **one UI-independent safe calculation engine and one reusable interface**, not separate calculators. The engine has no ProseMirror, DOM, text-object or calculator-UI dependency.
- Both contexts share scientific functions, fixed numeric values, a single authorized geometry-source adapter, automatic recalculation, precision, units/document scale, degrees/radians, clear errors and explicitly requested result copying. Respect read/display/property/visibility grants, legacy units, policy changes, deleted/invalid sources and stale results; no forbidden IDs/names/values through UI, errors, clipboard, caches or export.
- Standalone has private session state and must create no document objects, document mutations or undo items. T5b inline only prepares/evaluates formulas; insertion is unavailable.
- T5c enables insertion/editing of typed calculatedValue/schema 4 within v7 through the same component. Keep result-only, formula+result and substituted-values+result modes. Private draft changes commit only with outer text-editor OK; preserve content/format/reference/expression permissions, locks/revision/epoch, undo/redo, JSON/replay, SVG/PNG and existing legacy/schema compatibility.
- T5a: retain safe parser/AST, dimensions/units/evaluation and definitive mathematical approval. T5b: both hosts and result parity. T5c: inline integration with immediate storage/export gate. T5d: audit both modes, permissions, accessibility, fullscreen and export. Separate acceptance/start gates remain mandatory.

Required future acceptance evidence: empty-document toolbar `2+3*4=14` with unchanged objects/revision/history; `sin(30 deg)=0.5`; circle radius→area live update with scale applied once; identical quantities/results in both modes; restricted non-disclosure including revocation; T5c insertion/edit/undo/redo/JSON/SVG/all three modes; focus/keyboard/Escape/fullscreen/Cancel in both contexts. Test explicit clipboard success/denial and offline SVG→PNG; manual IME/AT/OS-clipboard checks are not PASS until performed.

**Future reuse, not implementation:** F05 function graphs, F06 parametric constructions and F07/F08 exercises may consume the same engine via independently validated adapters. No plotting, parametric feature or exercise evaluation is marked implemented by this amendment. Toolbar/icon/responsive details and clipboard notation remain decisions before T5b; exact calculatedValue payload/grants before T5c. The T5a mathematical contract remains an independent definitive approval requirement.

### T5-prep UX delivery note (2026-10-12, superseded by Deel A below)

The rich-text editor has four point-based size presets mapped to its existing SVG-pixel values, one palette source shared by geometry and text, three paragraph alignment controls, visible mixed/active marks, local ProseMirror undo/redo, and the label “Symbolen & structuren”. The earlier width-slider UI was removed by Deel A; its stored `textContent.width` field remains compatible and is not rewritten. See the latest Deel A report for the current UI and verification state. This does not implement F11 or authorize T5a.

### T5-prep Deel A — permanent editor workspace (2026-10-12, backlog 1.5.0)

The active insertion UI is a permanent panel with exactly two tabs: **Formula** and **Values**. The Formula tab combines LaTeX source editing, catalog search/category, live preview and explicit insertion/update. Catalog items insert into the saved LaTeX cursor/selection; structure templates select their first placeholder; catalog clicks alone never create a formula atom. The Values tab retains the existing authorized dynamic-value flow. The text composition surface is white with dark text for readability. Overlay insertion panels and the text-width slider are removed. Existing `textContent.width` is preserved in the document model/render/export to keep older documents stable; it is not normalized by open, cancel or save. This is UI-only and changes no document schema, permission or export contract. Deel B canvas resizing is separate and not delivered. Manual acceptance remains open; see [T5-PREP-FINAL-UX-DEEL-A-REPORT.md](T5-PREP-FINAL-UX-DEEL-A-REPORT.md).


## TI-36X Pro long-term extension (2026-10-12, v1.6.0)

User-supplied checklist v2.1.0 extends F11 with future TI-36X Pro functional parity. It retains all original 54 backlog requirements and M1–M20: this is additional planning, not replacement or implementation. [Roadmap v2.4.0](DEVELOPMENT-ROADMAP.md) preserves the source task references/statuses and full new package checklists.

- First M6a/M6b geometry; then separately approved T5b/T5c/T5d. T5b phase 1 uses only existing T5a functions and one shared floating draggable panel in toolbar/inline hosts. No graph canvas or document/selection/history/text-draft mutations.
- K1: exact real types, fractions/radicals/π and future notation/function extensions. K2: typed variables, Ans, private memory and bounded function/table services. K3: statistics, lists, regression and probability distributions.
- K4: typed matrix/vector services coordinated with M7. K5: numerical derivatives/integrals/solvers shared with M12; K2/K4/K6 dependencies explicitly reviewed. K6: separate complex-value semantics.
- K7: integer bases/bit widths, added physical dimensions, affine/unit conversions and versioned constants. K8: evidence-based TI-manual/inventory reconciliation, including deviations and FZI-only cases.
- F05/M11 graphing and F06 parametric visualization remain in the existing illustration canvas; reuse K2 evaluation and K5 analysis where valid, without a second interpreter. Tables can have multiple presentation hosts with one evaluation contract.

No exact-value, complex, matrix, variable or dimension extension silently changes accepted T5a binary64/angle/round/underflow behavior. Each package requires its own typed mathematical/schema/security contract, independent reference tests and explicit acceptance. The cited 105-item concept inventory is not an official TI function count; manual reconciliation remains open. No new parity, implementation or test PASS claimed by this document-only update.
