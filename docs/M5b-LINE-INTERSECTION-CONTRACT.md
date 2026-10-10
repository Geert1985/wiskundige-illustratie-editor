# M5b first checkpoint: linked line intersection

2026-10-10. Recipe lineIntersection, result point, ordered source roles line/line. Allowed: straight, ray, line, vector, dimension and finite polygon edges. Respect the actual domains rather than silently extending finite segments. Existing coordinate/zoom transform remains authoritative.

Normalized direction determinant threshold 1e-12; collapsed direction length <=1e-9. Parallel and coincident lines have no unique point. Domain inclusion uses existing 1e-9 parameter tolerance. Parallel coincidence uses perpendicular separation <=1e-9 coordinate units. Reasons: DEGENERATE_DIRECTION, PARALLEL_LINES, COINCIDENT_LINES, OUTSIDE_DOMAINS; existing NON_FINITE_RESULT/COORDINATE_LIMIT/SOURCE_INVALID remain applicable. Near-parallel directions below the threshold are deliberately classified parallel. Results above the model coordinate limit are invalid.

Creation without a unique valid intersection fails atomically. Parent changes invalidate an existing result recoverably while keeping ID, last geometry, style and references; hide invalid result from render/hit/snap. Recovery recomputes. Calculated coordinates stay read-only; detach, source rebind, lock, delete cascade, undo/redo and deterministic replay reuse existing APIs. Recipe requires constructionSchema 2; old schemas unchanged. Author/course/assessment creation uses existing tool and both-source grants.

UI: Snijpunt van lijnen under Constructies, first line then second line; existing hover/highlight and central step instructions. Invalid second selection keeps first source for retry. No new controller. This checkpoint does not include circle intersections or derived circles; next M5b checkpoints remain separate. Tangent-at-linked-circle-point audit is still pending.
