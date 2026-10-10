# M5b circle-circle intersection contract

2026-10-10. circleCircleIntersection -> point, ordered circle/circle sources. constructionSchema 2. Branch 0 lies to the left of the directed center line C1->C2, branch 1 to the right. Swapping sources reverses branch geometry intentionally.

Normalized lengths avoid squaring huge raw radii. Two solutions, one for external/internal tangent contact, none for separation/strict containment/concentric/coincident circles. Radius <=0 invalid. Center distance <=1e-9 treated concentric; equal radii within contact tolerance treated coincident, no unique point. Contact tolerance 1e-9*max(1,r1,r2,d). Standard finite/coordinate limits remain authoritative. Reason codes ZERO_RADIUS, CONCENTRIC_CIRCLES, COINCIDENT_CIRCLES, SEPARATE_CIRCLES, CONTAINED_CIRCLES, MERGED_INTERSECTION and existing graph/coordinate reasons.

Creation adds currently valid distinct branches atomically. Tangency only creates branch 0. For an existing pair, tangent contact hides branch 1 recoverably; separation hides both; later crossing restores original IDs and styles. A single-point creation does not later spawn another ID, consistent with prior intersection/tangent checkpoints. Computed coordinates immutable; graph/rebind/detach/cascade/locks/grants/import/replay reused.

Tool Snijpunt cirkels: first circle then second circle, existing hover and two-step instructions. Failed second selection keeps first source. Next: derived circles and linked-point tangent audit as separate checkpoints, not included here.
