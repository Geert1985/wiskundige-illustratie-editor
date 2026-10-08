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

Bissectrice also accepts a direct click on an existing angle (arm, arc or right-angle mark). All three vertices are referenced, so the bisector follows subsequent angle edits. Three-point selection remains available with specific instructions after each click.

For a triangle or polygon, clicking a vertex with Bissectrice constructs the bisector of its two neighboring sides. The neighboring vertex references remain linked.

## Tool categories and whole-figure measurements

Selecteren stays outside the four tool accordions. Basisobjecten is initially open; Figuren, Meten and Constructies start closed. Native details/name grouping allows at most one open category. The central render updates the active tool suffix even when that category is collapsed. Category state is transient; no extra editor listeners or document fields are needed.

Meten includes Omtrek and Oppervlakte. Click inside/on a circle or polygon (including triangles); a 12-CSS-pixel boundary tolerance is accepted. A directly clicked figure wins when overlapping figures are painted; other candidates follow deterministic distance/ID ordering. The tool creates one linked text object, construction kind perimeter/area, with the figure's objectId as its sole source. Source geometry changes recompute the value automatically. Labels can be dragged, styled, resized, hidden and undone without detaching the reference. Text/coordinates are computed and are not editable as free text.

Circle formulas: perimeter 2πr, area πr². Polygon perimeter sums all closed sides; area is the absolute shoelace sum computed relative to the first vertex, preserving orientation independence and reducing large-coordinate cancellation. Concave simple polygons are supported; holes/self-crossing polygons are outside the existing model. Values are displayed to two decimals in the document's mathematical units (squared units for area). No physical-unit picker is added. Label anchors use circle center or the existing polygon mean-vertex anchor and preserve mathematical drag offsets.

The existing declared version-3 construction document schema remains unchanged. Older builds that do not know the new kinds reject these linked definitions. Save/reload and SVG use the same current label state. Source deletion and duplicate snapshot rules remain as described above.
