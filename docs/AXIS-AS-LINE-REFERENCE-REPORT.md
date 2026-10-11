# Cartesian axes as straight construction sources

**Branch:** `chatgpt/editor-development`
**Status:** Implemented on 2026-10-12. Node verification passed; the real Edge suite could not start in this environment.

## Inventory and design

The editor already stores typed Cartesian references as `{kind:'axis',frame:'cartesian',axis:'x'|'y'}`. `construction-service.js` resolves them as nonpersistent infinite straights through the origin; they have no object IDs and are intentionally skipped by document-object dependency traversal. Before this change, the central service admitted axes only for `angleDirections`, while the canvas picker, inspector, and restricted policy already had an axis-aware path to build on.

The central role matrix now allows axes only where a construction source role is `line` and the operation is geometrically defined for an infinite straight:

| Construction | Allowed axis slots | Result |
|---|---|---|
| `lineCircleIntersection` | 0 (line) | Existing branch-stable intersection point(s) |
| `lineIntersection` | 0 and 1 (line) | Intersection point |
| `parallel` | 0 (line) | Straight through the selected point |
| `perpendicular` | 0 (line) | Perpendicular straight through the selected point |
| `angleDirections` | 0 and 1 (line) | Existing angle result and modes |

Other roles and tools still reject axes. Ordinary line, ray, vector, segment and polygon-edge domains are unchanged. The same geometry resolvers handle axes as straight sources, so no separate intersection algorithm or schema version is needed.

## Interaction and permissions

The existing `constructionPick` remains the only picker. It now receives the active source index, uses the shared screen transform and 12-pixel tolerance, offers only visible axes for a compatible line slot, and keeps ordinary objects ahead of an axis on coincident hits. Hover/selected overlays and fullscreen use the existing presentation path. Inspector source options are slot-aware. Hidden axes remain valid references in saved constructions but cannot be picked from an invisible canvas stroke.

Restricted creation still requires both an allowed construction tool and an explicit per-axis `axisSourceTools` grant, in addition to ordinary object `sourceTools` grants. Read-only axis inspection does not introduce an object permission or synthetic object. Existing schema-3 axis references and `angleXAxis` remain readable; line constructions continue to use the existing schema-3 declaration when they contain an axis source.

## Related distribution-point dragging

The same release adds the requested interaction for circle distributions. Dragging any unlocked member sets the common phase to `pointerAngle - index × 2π/count`, so every point rotates around the source circle while preserving IDs, count and equal spacing. Pointer-up is one undo step and Escape restores the prior phase. The normal `pointOnCircle` drag remains unchanged. Restricted sessions do not receive this author-only mutation.

## Verification

The focused Node coverage checks x/y circle intersections, tangency and no-intersection recovery, negative coordinates, axis-axis and axis-line intersections, parallel/perpendicular results, schema/import roundtrip, deterministic replay, source-role rejection and explicit restricted grants. Lifecycle tests call the real editor pointer handlers to check axis source hit-testing and hidden-axis behavior, plus dragging a distribution point, the motion of all members, stable IDs, one-step undo/redo and Escape rollback.

`npm.cmd test`: **393 passed, 0 failed**. This includes the new axis geometry, permission, picker and distribution-drag tests. `git diff --check`: passed.

`npm.cmd run test:edge`: **blocked before test execution**. Playwright started Edge, but the browser closed during startup while creating its temporary isolated profile (`browserType.launch: Target page, context or browser has been closed`; crashpad pipe and temporary site-list write errors followed). No Edge test passed or ran. Manual browser acceptance for axis hover/selection in the app and real pointer dragging/save-reload has not been performed.

## Remaining acceptance checks

In the app, create a circle that crosses each axis and use `Snijpunt lijn-cirkel`, selecting the visible x-axis or y-axis and then the circle. Verify both points, tangent behavior and dynamic updates as the circle moves. Check `Snijpunt van lijnen`, `Evenwijdige` and `Loodlijn` with axis sources. Hide an axis and confirm it is no longer pickable. For a circle distribution, drag a non-first member around the circle; confirm all members stay evenly spaced and on the circle, then test Escape and undo/redo. Automated Node interaction tests cover these editor handlers, but real Edge/layout acceptance remains outstanding.

## Changed files

`construction-service.js`, `permission-runtime.js`, `editor.js`, `DOCUMENT-FORMAT.md`, `docs/AXIS-REFERENCES-CONTRACT.md`, `docs/CIRCLE-POINT-DISTRIBUTION-REPORT.md`, `tests/axis-references.test.cjs`, and `tests/lifecycle.test.cjs`.
