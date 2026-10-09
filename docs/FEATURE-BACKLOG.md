# Mathematical Illustration Platform — Complete Feature Backlog

Version: 1.0.0
Status: proposed; reconcile with repository before implementation
Date: 2026-10-09

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
