# M5b line-circle intersection report

Date 2026-10-10. Implementation f218e47aa6aee565982470c802cfa3fba7b161d3. Branch chatgpt/math-illustration-m5b; main unchanged. Previous line-line checkpoint manually accepted by user.

Added recipe lineCircleIntersection (line then circle), point result, constructionSchema 2. Creates currently valid distinct ordered branches in one atomic command. Finite segment, ray, vector, dimension and polygon-edge domains respected. Tangency yields branch 0; an existing second branch becomes recoverably MERGED_INTERSECTION, avoiding overlapping visible points. No-solution, collapsed direction, zero radius and out-of-domain states invalidate without deleting IDs/styles. Existing objects recover as sources move. Single-branch creation does not later spawn a missing branch, matching current tangent creation behavior. Endpoint reversal reverses root ordering; documented in contract.

Existing source editing, immutable coordinates, permission/source grants, locks, import/export and deterministic replay reused. Inspector exposes source roles; two-step instructions and hover use existing owner. Tool: Constructies -> Snijpunt lijn-cirkel.

Validation: five new Node specifications, initially red before implementation. Final full Node 311/311, full Edge 36 modules and zero page errors. Browser verifies two branches, atomic undo/redo, tangent merge, no-intersection invalidity/recovery and roundtrip using real pointer clicks. Node adds domains, branch-1-only creation, edge sources, collapse/radius recovery, strict branch imports, replay, allowed/denied grants and oblique/translated/reversed geometry. Syntax/diff checks pass; screenshot reviewed. Existing untracked FEATURE-GAP-ANALYSIS.md unchanged.

Manual test: refresh, draw a straight crossing a circle, choose Snijpunt lijn-cirkel and click line then circle. Two red points should appear and follow source movement. Move the circle until tangent and then separated; one then zero points visible, restoring the sources recovers the original two. Undo/redo creation affects both together. Finite lines only create roots within their domain. Manual acceptance pending.

Next checkpoint: circle-circle intersections. Derived circles and linked-point tangent audit remain later M5b checkpoints; no later milestone implemented.
