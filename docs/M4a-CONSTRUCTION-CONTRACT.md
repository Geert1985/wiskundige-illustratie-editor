# M4a - Construction contract, version 1

Date: 2026-10-09. Scope: existing construction recipes, geometric capabilities, stable references/topology, diagnostics, linked/free transition. No new object types, dynamic relationships, replay engine or M4b operator-input editor.

## One recipe registry

ConstructionService owns immutable definitions. `contract(kind)` returns `{kind, sourceRoles, resultType, computedFields, branches}`. The existing `kinds` arities are derived from that registry. Engine creation, source picking, result-type validation and permission checking of indirect output fields consume it. Mathematical calculators remain unchanged.

| Kind | Ordered source roles | Result | Computed fields |
|---|---|---|---|
| midpoint | point, point | point | x, y |
| perpendicularBisector | point, point | straight | x1, y1, x2, y2 |
| parallel / perpendicular | line, point | straight | x1, y1, x2, y2 |
| bisector | point, point, point | ray | x1, y1, x2, y2 |
| tangent | circle, point | straight | x1, y1, x2, y2 |
| area / perimeter | figure | text | x, y, text |

Tangent branches 0/1 retain their declared identity through invalidity, coincidence on the circle and recovery. Creation retains the existing one-on-circle/two-outside behavior. The existing straight-angle bisector fallback remains valid. No tolerance or formula change is introduced.

`referenceOptions(object)` exposes intrinsic geometric addresses, not permission grants or current interaction availability. Locked objects can still be mathematical sources. Visibility, validity, source-tool permissions and selection rights are checked separately by the existing editor/runtime boundary.

## Stable references and topology

References identify an object ID plus an optional part/index:

- Point object: whole object as a point source.
- Linear objects: whole supporting geometry as a line source; start/end as point sources.
- Polygon: vertex/index as point source, edge/index as line source, whole polygon as a figure.
- Angle: vertex/index as point source.
- Circle: whole circle as circle or figure source. Center anchors are not added in M4a.

Source roles, supported parts, index presence and bounds are validated before geometry calculation or document replacement. A part that happens to be ignored by an old calculator is not a valid reference. Missing IDs, mismatched roles and meaningless indices are structural errors, not recoverable geometric degeneracy. Existing reference extensions such as legacy `anchor`/host tags remain preserved in the document; unrelated extension fields do not become geometric topology.

Positional vertex/edge indices remain the current identity model. Same-cardinality coordinate edits retain those addresses. Changing vertex count is refused with `TOPOLOGY_REFERENCED` when any construction holds an indexed reference to that object, even when the construction is currently invalid. Whole-figure area/perimeter references allow valid vertex-count changes. Same-cardinality coordinate arrays cannot be interpreted as an implicit semantic reorder; explicit topology editing/ID-based vertices require a later design. Object IDs and types remain immutable under update.

## Validity and diagnostics

`evaluate(construction, objectsById)` returns `{valid, reasonCode, geometry}`. The iterative resolver consumes this result. Invalid constructions retain their previous coordinate snapshot and `constructionValid: false`; they are excluded from render/hit/snap by existing rules and recover when sources become valid.

Reasons: `VALID`, `SOURCE_INVALID`, `COINCIDENT_POINTS`, `DEGENERATE_DIRECTION`, `DEGENERATE_ARM`, `ZERO_RADIUS`, `POINT_INSIDE_CIRCLE`, `NON_FINITE_RESULT`, `COORDINATE_LIMIT`. The existing 1e12 computed-coordinate boundary and degeneracy tolerances remain. New construction creation requires a valid result; existing/imported degenerate constructions remain recoverable.

`Engine.getConstructionInfo(id)` returns null for an absent object, otherwise a frozen snapshot: mode (`free`/`linked`), kind, validity/reason, tangent branch when applicable, intrinsic geometryEditable/canDetach, computedFields, canonical sources and direct dependent IDs. A free object has reason `FREE`. Queries do not mutate state or serialize additional fields. The inspector translates reasons into mathematical explanations, with source/dependent navigation through the existing selection controller.

Computed fields cannot be changed directly while linked. A different value is refused with `COMPUTED_FIELD` by model/engine update; command-level computed edits are MODE_DENIED. Equal-value fields in existing complete snapshots remain compatible. Removing a link with a null/undefined update is refused with `CONSTRUCTION_LINK_MANAGED`; use the explicit detachment operation. Style, visibility, locks and label offsets retain their existing editing rules. Label cancellation restores only edited offsets, preserving newer geometry from indirect source updates. Imports recompute geometry from validated sources instead of trusting stored calculated coordinates or validity flags.

## Linked to free: explicit detachment

`Engine.detachConstructions(ids)` / model detach and the author-only semantic command `construction.detach {ids}` remove construction/constructionValid from valid, unlocked linked objects. The batch is atomic: missing, free, duplicate, invalid or locked targets refuse the complete operation. There is no detachment of stale invalid geometry.

IDs, type, current geometry, styles, visibility, locks, label offsets, group/layer membership and incoming dependent references remain. Dependents continue to follow the same now-free object ID. Former sources no longer affect or cascade-delete it; deleting the detached object still cascades to its dependents. The inspector detaches the linked members of the current selection in one undo step. Undo reinstates the links and redo removes them again. Active interactions are canceled before the command.

Detached is a transition to the existing free-object state, not a new persistent object mode or proof of construction method. Historical provenance/replay belongs to M4b/M14. There is no general source-rebinding/relink editor in M4a.

## Authorization and compatibility

Detachment is author-only, including direct restricted-facade calls: MODE_DENIED. Geometry capabilities do not imply construction or graph-edit permissions. Locks and indirect follow/freeze/invalidity rules keep their existing semantics.

Restricted inspection uses private validated geometry for diagnostics but filters sources/dependents by read rights; unread objects return null and unread source addresses are omitted with hasRestrictedSources. canDetach is always false, geometryEditable is bounded by actual geometry-field grants. Source-navigation buttons respect selectList rights. This is a local authorization contract; authoritative scoring remains M17.

No new document version or stored reason/provenance is introduced. Existing versions 1–5, groups, layers and unknown reference extensions retain their format. Well-formed documents and golden fixtures remain unchanged. References previously accepted only because the calculator ignored an incompatible part/index now fail explicitly; no silent migration or guessed repair is performed.

## Acceptance gate

Preserve all 255 existing Node tests and the full real Edge suite. Verify atomic invalid references/imports/computed edits/detach batches, positional topology, branch identity, label/style/visibility compatibility, deep iterative graphs, source/dependent inspection, undo/redo, group/layer roundtrip, downstream links after detach and restricted course/assessment denials. Stop after M4a and await manual acceptance; M4b is not started.
