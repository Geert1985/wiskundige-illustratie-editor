# M5b derived circle checkpoint

2026-10-10. Implementation a502c55fe48546ab19ab77aacc37c0c45a176f45, branch chatgpt/math-illustration-m5b. Main unchanged. User authorized the next checkpoint after point-tool grouping.

Delivered circleByCenterPoint: existing center point and perimeter point produce a linked circle. Accepts point/endpoint/vertex references, computes center and radius via hypot, uses constructionSchema 2. Computed cx/cy/r immutable; radius <=1e-9 invalidates recoverably, with downstream constructions receiving SOURCE_INVALID. Finite/coordinate-limit checks now include circle output fields. IDs/styles/references retained on parent updates and recovery. Default red outline/unfilled interior. Existing locks, source editing, detach/cascade and source grants reused. Circle via punten is separate from the point-producing split-button and has two-step instructions.

Validation: five new Node specifications; initially red before implementation. Final full Node 321/321, full Edge 38 modules pass, no page errors. Covers source movement, radius/center calculation, style retention, immutable outputs, source rebind, locks, cycle rejection, downstream point/intersection recovery, endpoint inputs, strict roundtrip, replay, detach/cascade, source grants and output radius limit. Real browser source clicks verify failed retry, creation, undo/redo, source updates, zero-radius recovery, read-only calculated radius and roundtrip. Syntax/diff checks pass and screenshot reviewed. Existing untracked FEATURE-GAP-ANALYSIS.md untouched.

Manual acceptance: refresh; draw two points. Constructies -> Cirkel via punten, select center then perimeter point. Move either source; center/radius follow. Bring sources together, then separate: circle and downstream objects hide/recover. Undo/redo creation. User acceptance pending.

Next M5b checkpoint: audit/complete tangent through linked point on circle. Circle through three points and triangle-center circles remain separate scope; no M6 implemented.
