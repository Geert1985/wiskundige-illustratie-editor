# M5b line-circle intersection contract

2026-10-10. Recipe lineCircleIntersection -> point, sources line then circle. Finite segments/vectors/dimensions/polygon edges and ray domains respected. Requires constructionSchema 2. No new document version.

Use normalized line direction and orthogonal projection of circle center. Branch 0 is the smaller line parameter; branch 1 is the larger. Endpoint reversal intentionally reverses geometric branch order. Coincident tangent solutions merge: branch 0 valid, existing branch 1 recoverably invalid (MERGED_INTERSECTION). Tangency tolerance is 1e-9 * max(1,r,perpendicular distance), collapsed direction <=1e-9. Circle radius <=0 invalid. Standard coordinate/nonfinite checks still apply.

Create all currently valid distinct solutions in one atomic command and undo step. If only branch 1 lies on a finite source, create branch 1. No valid solutions means no mutation. A single-point creation does not later spawn new object IDs when geometry acquires another solution, consistent with existing tangent creation. Existing branch IDs, styles and references remain stable during invalidity and recover; reasons include NO_REAL_INTERSECTION, OUTSIDE_DOMAINS, MERGED_INTERSECTION, ZERO_RADIUS and DEGENERATE_DIRECTION.

Existing graph, source inspector/rebind, locks, detachment, cascade, immutable computed coordinates, source grants, export/import and replay remain authoritative. UI tool Snijpunt lijn-cirkel uses existing source hover/controller and central two-step instructions. Circle-circle/derived circles are separate following checkpoints.
