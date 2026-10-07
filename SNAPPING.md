# Milestone 0C — one explicit snap/constraint chain

## Responsibilities

`coordinate-transform.js` captures the current renderer bounds/scale and SVG `getScreenCTM()` in one `CoordinateTransform`. It handles mathematical ↔ CSS-screen coordinates, screen deltas and screen distances. Every interactive snap passes this transform. Headless callers can supply a matrix; the default uses a current canvas transform if available, otherwise SVG-user-pixel identity.

`snap-service.js` owns the existing segment/segment, segment/circle and circle/circle formulas, point/endpoint/center candidates, grid candidates, visibility, exclusion, screen tolerance and deterministic selection. The original geometry formulas and their segment boundary/tangency behavior are retained. Coincident circles and collinear overlap have no isolated intersection candidate.

`interaction-resolver.js` resolves drawing, whole-line translation and independent endpoint movement explicitly. It returns both the actual object/patch to commit and the result/preview to display. The editor stores the last valid raw mathematical pointer plus the resolved drawing. Keyboard edits update that drawing from stored data, never from KeyboardEvent client coordinates.

`editor-enhancements.js` retains endpoint handles and their existing pointer listeners. It previews the explicit resolver patch without mutating the model and commits the same stored patch at pointer-up. `snap-indicator.js` only displays the `fzi:snap-result` event. It neither snaps coordinates nor modifies previews. Other event/label architecture remains for 0D.

## Deterministic priority

All candidates must be within **12 CSS pixels**, measured by the same transform. Within that region the ranking is:

1. Existing explicit point.
2. Any supported intersection.
3. Line-segment endpoint.
4. Circle center.
5. Grid point (only when the grid is visible, using the renderer's actual `axisStep`).

Within one tier, the closest screen distance wins. Distance ties within 1e-9 pixels are broken by sorted source IDs and kind, then coordinates. Geometry objects are sorted by ID before pair generation, so reversing object array order does not change the result. Visibility and `excludeId` remove both an object's anchors and intersections involving that object.

The snap result has `point`, `snapped`, `kind`, `ids`, `grid`, `priority`, `distancePx` and `constraint`. The marker consumes that result; geometry and model callers do not make a second snap decision. Compatibility helpers `getSnapCandidates` and `snapPoint` delegate to this service and contain no independent policy.

## Constraint rules

- Without a numeric exact measurement, line/circle endpoints use the SnapService result directly.
- An exact positive length/radius overrides endpoint snapping. Its endpoint is projected along the last raw pointer direction, and no second snap runs after projection. A zero direction uses +X. The start/center can still snap normally. The marker does not claim an incompatible endpoint snap.
- A whole line considers both translated endpoints, chooses one result with the same deterministic priority, and applies one correction vector to both endpoints. It never independently snaps both endpoints. This preserves the original segment vector/length within normal double precision.
- A dragged single endpoint can independently snap to any permitted point, intersection or grid candidate, excluding its own line. The other endpoint remains unchanged.
- Preview and commit reuse the stored result. Mouse-up/Enter do not resolve or constrain it again. Exact circle radius is stored as the entered number; exact line length is represented by the projected coordinates.
- Shapes shorter than the existing 0.05 minimum are rejected after cleanup. Preview, measurement text, crosshair and snap feedback are cleared even on rejection.

Both old `Engine.add` and both old `Engine.update` snapping wrappers have been removed. Direct add/update/move and numeric inspector edits therefore retain the supplied mathematical coordinates, regardless of viewport/grid. Snap intent belongs to the interaction layer.

## Verification and remaining boundaries

Run `node --test math-illustration/tests/*.test.cjs` for the existing 30 tests plus the snapping/keyboard regressions. With Playwright and Edge, `node math-illustration/tests/browser.cjs` runs the 0A/0B checks and the 0C checks from `browser-snapping.cjs`.

The browser checks compare the actual preview/start/end, because native mouse events may round to screen pixels. The canonical Node regression proves that the previous requested length 1 near candidate 1.05 remains exactly 1; browser checks verify the same length invariant within 1e-9 mathematical units and identical preview/committed coordinates.

Document version 2 and its migration/persistence policy are unchanged. Labeldrag, general pointer cancellation, engine/render trackers, general render scheduling and spatial indexing are not refactored. Candidate generation remains O(n²); this milestone consolidates correctness rather than introducing an indexing/performance subsystem.
