# M5b circle-circle checkpoint report

2026-10-10. Implementation 785c10f9a37bee0808862ddd897a9814def65a44 on chatgpt/math-illustration-m5b. Main unchanged. User accepted the line-circle checkpoint and requested the next step.

Added circleCircleIntersection with ordered circle sources, point result and constructionSchema 2. Two ordered branches created atomically; external/internal tangent contact creates one branch. Existing second branch merges recoverably at contact, both branches hide on separation/containment and recover with original IDs/styles. Concentric/coincident circles have no unique point. Zero radius invalid; normalized lengths used for calculation. Coordinate limits and tolerance documented in contract. Swapping source order reverses branch geometry. Single-point creation does not later spawn new IDs, consistent with prior intersection/tangent creation.

Existing graph, source grants, lock/immutable-coordinate rules, source inspector, replay and two-step hover/controller reused. Tool Snijpunt cirkels. No circle-radius UI, new controller or later-milestone implementation.

Validation: five new Node tests; specifications first failed before implementation. Full Node 316/316 and full Edge 37 modules pass, no page errors. Coverage: branch geometry/order, internal/external tangency, containment, concentric/coincident, radius zero, failed creation atomicity, invalidity recovery, style preservation, computed-field protection, strict branch imports, replay, both-source grants, oblique/translated/unequal-radius circle invariants. Browser actual clicks verify same-circle retry, two points, one-step undo/redo, tangent merge, separation recovery and roundtrip. Syntax and diff checks pass; screenshot reviewed. Existing untracked FEATURE-GAP-ANALYSIS.md untouched.

Manual acceptance: refresh; draw crossing circles, choose Snijpunt cirkels and click each rim away from crossings. Move a parent: points follow. Separate and restore circles; points disappear/recover. Tangency shows one point. Undo/redo creation affects both together. User acceptance pending.

Next M5b checkpoint: derived circles. Linked-point tangent audit remains a separate pending checkpoint. Main remains unchanged; branch pushed under existing user authorization.
