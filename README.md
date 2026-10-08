# Mathematical Illustration Engine

Stabilized standalone mathematical illustration editor (Milestones 0A–0E).

## Purpose

This module is an independent mathematical layer. It does **not** depend on the current seven-phase curriculum, milestones, exams, game progression or admin screens.

The same model is intended to become the source for:

- static SVG illustrations;
- interactive lesson figures;
- exercise figures;
- animations;
- game components.

## Current object scope

Supported mathematical objects:

- point;
- line segment;
- circle;
- text label.
- straight line (`straight`);
- ray (`ray`);
- vector (`vector`).

Supported engine operations:

- create/load a model;
- add, update and remove objects;
- select the nearest object at mathematical coordinates;
- move supported objects;
- serialize to JSON;
- render the model to SVG.

The first authoring editor now provides:

- a select tool;
- point, line-segment, circle and text tools;
- click/drag editing;
- a selected-object inspector;
- object deletion;
- title and description metadata;
- browser-local draft saving;
- JSON import/export;
- SVG export.

## Mathematical coordinate invariant

A fundamental design decision for the illustration engine is that **mathematical coordinates must retain equal scale in both directions**.

One unit on the x-axis therefore represents exactly the same number of screen pixels as one unit on the y-axis. The renderer uses an equal-aspect-ratio coordinate system and centers the mathematical drawing inside the available SVG viewport when the viewport and coordinate-range aspect ratios differ.

This is deliberately treated as a mathematical invariant rather than merely a visual styling choice. It ensures that:

- a circle remains a true visual circle;
- a square remains a visual square;
- right angles remain visually correct;
- distances are not stretched differently in x and y;
- geometric constructions can be interpreted directly from the drawing.

For example, a circle with

`center = (0, 2)`

and

`radius = 2`

must pass exactly through `(0, 0)` and `(0, 4)`. The renderer must therefore never compensate for a non-square screen coordinate scale by changing the mathematical radius. Instead, the viewport itself is fitted to the mathematical aspect ratio.

This principle should be preserved when zooming, panning, changing the coordinate range, adding geometric constraints, and implementing future objects such as polygons, angles, perpendiculars, vectors and transformations.

## Files

- `model.js` — mathematical data model and JSON representation.
- `linear-geometry.js` — shared domains, clipping and intersections for two-point linear objects.
- `renderer.js` — SVG renderer; converts mathematical coordinates to screen coordinates while preserving equal x/y scale.
- `index.js` — public engine facade and interaction-neutral operations.
- `editor.html` — standalone authoring entry point for the first editor.
- `editor.js` — authoring interaction layer.
- `editor.css` — editor presentation.
- `coordinate-transform.js`, `snap-service.js`, `interaction-resolver.js` — shared screen transforms, explicit snap results and invariant-preserving constraints.
- `editor-startup.js` — explicit draft save/restore policy.
- `editor-adaptive-grid.js` — passive adaptive-grid utility.
- `editor-label-drag.js`, `editor-enhancements.js`, `snap-indicator.js`, `editor-color.js`, `editor-axis-settings.js` — passive label/overlay/feedback/color/axis helpers.
- `editor-bootstrap.js` — constructs/restores the engine and injects all services into the application.

The exact editor script order is: model → linear-geometry → renderer → index → coordinate-transform → snap-service → interaction-resolver → editor-startup → editor-adaptive-grid → editor-label-drag → editor-enhancements → snap-indicator → editor-color → editor-axis-settings → editor → editor-bootstrap. The bootstrap runs last. Helpers do not install competing event/render owners. See [LINEAR-OBJECTS.md](LINEAR-OBJECTS.md) for new-type semantics and older-reader compatibility.

## Opening the editor

The editor is deliberately a standalone entry point during this development phase:

`math-illustration/editor.html`

It can be opened directly from the GitHub Pages deployment once the branch is deployed, or locally from the repository. It is not yet exposed through the main application's routing/admin navigation.

## Deliberate boundary

The illustration files are not loaded by the current main application. This keeps the first editor non-invasive: `main` remains untouched and the existing application continues to be the only production runtime entry point.

The next development step should be to test the editor itself before adding more mathematical objects. After the basic interaction is stable, the engine can be connected to an admin route and later to lessons/exercises.

## Minimal example

```js
const engine = new FZI.MathIllustration.Engine(null, {
  width: 800,
  height: 500,
  bounds: { xMin: 0, yMin: 0, xMax: 10, yMax: 6 }
});

engine.add({ id: "A", type: "point", x: 2, y: 2, name: "A" });
engine.add({ id: "B", type: "point", x: 8, y: 2, name: "B" });
engine.add({ id: "AB", type: "line", x1: 2, y1: 2, x2: 8, y2: 2 });
engine.add({ id: "c1", type: "circle", cx: 5, cy: 3, r: 2 });

const json = engine.toJSONString(true);
const svg = engine.renderSVG();
```

Coordinates are mathematical: positive `y` points upward. The renderer handles conversion to SVG's downward screen axis while preserving equal scale in x and y.

## Public contracts and verification

- `Engine.add/update/remove/get/move/selectAt/load`, `toJSON/toJSONString/renderSVG` remain the facade. Add/update never implicitly snap; use SnapService/InteractionResolver explicitly. Load validates atomically. Version-2 presentation and legacy migration are described in [DOCUMENT-FORMAT.md](DOCUMENT-FORMAT.md).
- `get()` returns a detached snapshot. `model.objects` is a deeply immutable read-only view; use add/update/remove/clear/load for mutations. Partial style patches merge recursively and preserve unspecified fields. Known numeric geometry/styles are validated before commit. See [MUTATION-SELECTION.md](MUTATION-SELECTION.md) for the F16/F17 contract and compatibility changes.
- Numeric `selectAt(x, y, tolerance)` keeps its mathematical legacy API. The editor uses `selectAt(x, y, { transform, tolerancePx: 8 })` for constant CSS-pixel selection; visible DOM targets take precedence and equal screen-distance ties follow painting order.
- `CoordinateTransform.forCanvas(engine, document?)` is the shared browser transform. SnapService `resolve/candidates/free/compare` preserve [SNAPPING.md](SNAPPING.md)'s priorities and screen tolerance. Candidate/result objects are detached from the private cache.
- `MI.bootstrapEditor({ engine?, services?, document?, window?, storage?, restoreDraft? })` creates one app and disposes the previous app. `MI.editor` exposes `init/dispose`, `setTool`, `loadDocument`, `newDocument` and `invalidate`. The app uses its injected engine; `MI.activeEngine` is only a bootstrap compatibility reference.
- Pointer moves update the mathematical result synchronously and coalesce visual invalidation until the next animation frame. Commands, keyboard measurement, commit and cancel render immediately and clear any pending frame. See [INTERACTION-RENDER.md](INTERACTION-RENDER.md).

Run `node --test math-illustration/tests/*.test.cjs`. With Playwright and Edge installed, run `node math-illustration/tests/browser.cjs`; it includes the complete functional suite and 10/100/500-object pointer benchmarks. See [PERFORMANCE.md](PERFORMANCE.md) and [tests/README.md](tests/README.md) for methodology, measured limits and regression gates. No new mathematical object types were added during stabilization.
