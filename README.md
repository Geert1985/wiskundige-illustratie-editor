# Mathematical Illustration Engine

First technical slice of the From Zero 2 Infinity mathematical illustration system.

## Purpose

This module is an independent mathematical layer. It does **not** depend on the current seven-phase curriculum, milestones, exams, game progression or admin screens.

The same model is intended to become the source for:

- static SVG illustrations;
- interactive lesson figures;
- exercise figures;
- animations;
- game components.

## Current v0.2 scope

Supported mathematical objects:

- point;
- line segment;
- circle;
- text label.

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
- `renderer.js` — SVG renderer; converts mathematical coordinates to screen coordinates while preserving equal x/y scale.
- `index.js` — public engine facade and interaction-neutral operations.
- `editor.html` — standalone authoring entry point for the first editor.
- `editor.js` — authoring interaction layer.
- `editor.css` — editor presentation.

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

engine.add({ id: "A", type: "point", x: 2, y: 2, label: "A" });
engine.add({ id: "B", type: "point", x: 8, y: 2, label: "B" });
engine.add({ id: "AB", type: "line", x1: 2, y1: 2, x2: 8, y2: 2 });
engine.add({ id: "c1", type: "circle", cx: 5, cy: 3, r: 2 });

const json = engine.toJSONString(true);
const svg = engine.renderSVG();
```

Coordinates are mathematical: positive `y` points upward. The renderer handles conversion to SVG's downward screen axis while preserving equal scale in x and y.
