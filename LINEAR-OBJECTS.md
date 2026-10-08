# Straight lines, rays and vectors

The existing `line` remains a finite segment. Three new types share x1/y1/x2/y2 mathematical coordinates:

| Type | Geometry | Rendering |
|---|---|---|
| straight | P1 + t(P2−P1), all real t | viewport-clipped line with arrows at both edges |
| ray | P1 + t(P2−P1), t ≥ 0 | begins at P1 and extends forward; arrow at far viewport edge |
| vector | P1 + t(P2−P1), 0 ≤ t ≤ 1 | finite shaft; arrow at actual P2 only |

Straight/ray require distinct definition points. All new types require a finite direction length. A zero vector is valid in the model and renders as a small point; the drawing tool retains the existing 0.05 minimum-gesture rule, so typing a zero-length shape does not create one. If the vector's tip is outside the viewport, its clipped shaft does not invent a new arrow tip at the viewport border.

## Shared geometry and interactions

Load `linear-geometry.js` immediately after model.js and before renderer/index. `LinearGeometry` supplies type classification, parameter domains, viewport clipping and line/line intersections. Rendering and selection use the same domains. SnapService retains existing tiers/kinds: definition points are line-endpoint candidates, all linear-linear intersections are line-line-intersection and linear-circle intersections line-circle-intersection. Straight extensions participate; rays reject intersections behind the origin; vector/segment extensions do not participate. Collinear overlaps retain the earlier policy of no infinitely many snap candidates.

Select/drag uses the existing controller. Moving the whole object applies one rigid translation to both definition points. Handles edit the two points independently with snapping; for a ray the second handle defines direction, not a finite endpoint. If an endpoint snap would collapse a straight/ray, the resolver retains the original endpoint and returns a nonzero-direction constraint, preserving preview=commit and validity.

Draw by dragging from the first to the second point. Numeric keyboard input uses the existing exact-distance constraint. For vectors this is vector magnitude; for straight/ray this is the distance between definition points, not the total extent of the infinite object. Labels anchor at the midpoint of definition points and use the existing mathematical offsets/drag lifecycle.

Styles, object visibility, selection/inspector, cancel/dispose, explicit mutations and draft/import/export share existing services. Arrowheads inherit stroke color/opacity, have a bounded SVG size and shrink for very short visible shafts. No prototype patches, alternate snapping or drag states were added.

## Serialization and compatibility

The version-2 object schema gains three supported type values; no coordinate fields, root version, migration rules or presentation format changed. Existing four-type illustrations and the original SVG fixture are unchanged. Older builds that do not support these type values reject new documents atomically; new documents containing these types are not readable by such builds. A version bump would not make those builds understand the new geometry, so no version 3 is introduced.

`tests/fixtures/linear-objects-v2.json` is a small demo. For engine use:

```js
engine.add({ id: 'g', type: 'straight', x1: 0, y1: 0, x2: 1, y2: 1 });
engine.add({ id: 'h', type: 'ray', x1: 0, y1: 0, x2: 1, y2: 0 });
engine.add({ id: 'v', type: 'vector', x1: 0, y1: 0, x2: 2, y2: 1 });
```

## Verification and limits

80 Node tests: previous 73 plus seven linear-object cases for roundtrip, exact distance, translation/endpoint, domains/intersections, clipping/arrowheads, zero/invalid direction, safe endpoint-collapse and reversed/vertical/diagonal clipping.

The complete Edge suite adds real tool drawing, exact keyboard measurement, rigid drag, Escape rollback, grid-snapped control-point drag, labeldrag, downloaded SVG and save/reload/import for each new type. Existing stabilization, selection and performance suites remain included. Rendering was also inspected in Edge at 1280×900.

No undo/redo, polygons/angles, new coordinate systems, dynamic constraints or function plots are included. The earlier quadratic cold-intersection cost remains a limit. Extreme/subnormal coordinate cases retain the numerical precision limits of the existing intersection formulas; unsupported collinear constructions do not acquire implicit dependencies.
