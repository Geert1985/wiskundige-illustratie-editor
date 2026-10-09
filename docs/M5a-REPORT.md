# M5a ? Linked geometry and path parameters

Date: 2026-10-09. Technical outcome: PASS; manual user acceptance pending.
Start: accepted M4b local checkpoint 46ec863. Branch: chatgpt/math-illustration-stabilization.
Implementation: 290912f72aceb50a91f4a3d2ac367c1c9658633a.
Creation-error correction: ecf2dac. Saved locally, not pushed.

## Delivered

- Lijnstuk via punten: ordered endpoints follow existing point/vertex/endpoint sources. Collapsed segments invalidate and recover.
- Punt op lijnstuk: point uses A+t(B-A) on a finite segment/vector/dimension or polygon edge. Finite command inputs clamp to [0,1].
- Punt op cirkel: point uses center+r(cos(2*pi*t),sin(2*pi*t)); finite command inputs wrap into [0,1). Parameter 0 is right, .25 top, .5 left, .75 bottom.
- Existing graph recomputation, source picking/highlight, source editor, locks, undo/redo, detachment, cascading deletion and M4b semantic replay are reused. Click projection initializes the parameter. A selected path point has a position slider under Relaties en organisatie. Subsequent slider edits use .001 increments; imported parameter precision is retained until editing.
- Wrong roles, missing/cyclic sources, malformed parameters and locked edits are refused atomically. Invalid geometry retains identity, parameter and its last snapshot, stays out of rendering/hit/snap and recovers on parent changes. Failed creation adds nothing and preserves its error so the user can retry.

## Compatibility and permissions

New recipes require constructionSchema 2. Existing geometry object types and model versions 1?5 remain; documents using only old constructions retain schema 1 and old golden fixtures are unchanged. New-format documents require the updated engine. Imported parameters must already be canonical and finite; no silent clamp/wrap during import. Groups and layers support schema 2 roundtrips.

Restricted course/assessment creation requires both recipe/tool and source grants. Explicit parameter editing and source rebinding are author-only; direct computed coordinate edits remain forbidden. Restricted exports preserve the parameter. No separate drag controller, learner parameter binding, intersection operators, derived circles, locus or trace included; these remain later scope.

## Verification

Two new specification tests first ran red because the recipes/commands were absent. Final Node suite: 300/300 PASS (seven M5a tests). Final full Edge suite: all 33 modules PASS, pageErrors empty. Browser coverage includes real source clicks, linked-line creation, segment projection, circle creation, position slider undo/redo, parent following, locking, schema 2 roundtrip and failed-create retry. Node coverage adds clamp/wrap, invalidity recovery, cycle/role/topology checks, strict imports, restricted denials, replay, groups/layers, detachment and cascade. Visual review at 1543x884 confirms the tools and inspector. git diff --check PASS. User's existing untracked FEATURE-GAP-ANALYSIS.md untouched.

## Manual acceptance

Refresh the editor. Under Constructies choose Lijnstuk via punten, click two existing points and move/edit a parent. Then choose Punt op lijnstuk or Punt op cirkel and click the source path. Select the resulting point and adjust Positie op pad under Relaties en organisatie; check undo/redo and parent motion. The path point can also be dragged directly with the selection tool; test segment endpoints, circle motion, Escape cancellation and undo/redo.

Stop after M5a; M5b has not started.

## Direct dragging extension (2026-10-09)

At user request, author selection mode now drags linked path points directly using the existing pointer lifecycle and construction.setParameter. Circle angle projection wraps; finite segment projection clamps. Dependent constructions recompute live. Locks remain effective, restricted modes unchanged. Escape/lost capture cancel the gesture by restoring the original parameter. History records one completed gesture.

Validation: Node 300/300; full Edge 33 modules with no page errors; targeted linked-path suite rerun after final code cleanup. Real-pointer coverage checks circle dragging, segment endpoint clamp, one-step undo/redo and Escape rollback.
