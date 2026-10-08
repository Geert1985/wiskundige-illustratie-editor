# Linked geometric constructions

Six tools create ordinary rendered point/straight/ray objects with explicit construction references. Select sources by clicking existing geometry:

- Middenpunt: two points/endpoints/vertices; a click in a segment or polygon side constructs its midpoint immediately.
- Middelloodlijn: the same source choices; result is an infinite perpendicular through the midpoint.
- Loodlijn / Evenwijdige: first a line or polygon side, then an existing point/endpoint/vertex.
- Bissectrice: arm endpoint, vertex, second arm endpoint; result is the internal angle-bisector ray.
- Raaklijn: first a circle boundary, then an existing point on/outside the circle. One tangent on the circle; two outside. Inside/zero-radius circles are rejected when creating. The original two branches remain linked if they later coincide on the circle.

Source selection uses CoordinateTransform and a 12-CSS-pixel tolerance. Points win exact-distance ties against endpoints. Escape, blur, pointercancel, New and disposal use the existing controller cancellation; each source click has pointer capture released on pointer-up. Completed constructions are one history command, including both tangent branches.

ConstructionService validates kind, source references, output type and an acyclic graph. An iterative postorder resolver recomputes dependencies from current source geometry. Model add/update/load resolves before committing immutable state. Missing sources, cycles or wrong reference types reject atomically. Direct model operations and editor gestures both recompute results. Temporary geometric degeneracy marks constructionValid false, suppressing canvas/export/hit testing/snapping; definitions and last finite geometry stay available and recover automatically. Hiding a source does not delete/invalidate its dependents.

Derived geometry cannot be directly dragged or edited through coordinates. Its labels, style, visibility and name can be edited normally. Group movement translates selected independent sources once; selected derived members recompute. Snap exclusion includes all downstream objects, avoiding feedback into a moving source's own constructions. Endpoint handles are absent for derived lines.

Deleting a source cascades through its dependent constructions; undo restores them together. Duplicating a constructed object creates an independent translated snapshot, deliberately removing the construction definition. Locking does not block recomputation from a source; it protects editor edits.

Persistence: plain illustrations continue to export version 2. Documents with constructions export version 3 plus constructionSchema:1, so older engines reject them instead of loading stale geometry and losing links. The constructor accepts v1/v2 and the declared v3 schema. Existing unknown JSON fields/styles remain preserved. References are stored as objectId, optional part start/end/vertex/edge and vertex/edge index. Polygon vertex/edge indices refer to the current vertex order. Kind is midpoint, perpendicular, parallel, perpendicularBisector, bisector or tangent; tangent branch is 0/1. Cached coordinates are recomputed on import.

Numerical policy: collapsed arms/lines below 1e-9 are invalid; straight angles use a perpendicular bisector ray. Tangency uses a scale-aware 1e-9 tolerance. Derived coordinates must remain finite and within ±1e12. No symbolic arithmetic, arbitrary constraint solver, auto-generated free source points or tangent to non-circular curves is included.

Verification: Node regression tests cover six constructions, transitive updates, tangent orthogonality/degeneracy/recovery, graph validation/atomicity, cascade deletion, polygon references, snap exclusions and controller cancellation. Real Edge probes click all six tools, change source coordinates, undo/redo, reject direct derived manipulation, cancel source selection, save/reload/import, cascade-delete and SVG export. Full pre-existing suites remain enabled.
