# M5b line intersection checkpoint

Date 2026-10-10. Implementation cdc6f0a561b08691b896916c857fd075a02bbafa on chatgpt/math-illustration-m5b. Previous accepted implementation was merged with main (including main's new product specification) and pushed at e3db593. New work is confined to the new branch.

Delivered recipe lineIntersection requiring constructionSchema 2, point result, ordered line sources. Respects straight/ray/finite segment/vector/dimension/polygon edge domains. Normalized directions avoid raw determinant scale dependence. Degenerate, parallel, coincident and outside-domain cases do not create a point. Existing points invalidate recoverably, retain geometry/ID/style and recover when parents cross again. Read-only computed fields, rebinding, graph cycles, delete cascade, replay and source grants reuse existing boundaries.

UI: Constructies -> Snijpunt van lijnen, two steps, existing source hover and inspector. Failed second selection retains first source. Red result follows parents; undo/redo and schema roundtrip verified with real pointer clicks.

Validation: specification tests first failed; final 306/306 Node and 35 full Edge modules pass, pageErrors empty. Four Node tests cover following, invalidity/recovery, styles, strict import, domains, polygon edge, ray, atomic failure, replay, cycles, delete cascade, allowed and denied source grants, collapsed directions, scale/zoom and near-parallel tolerance. Browser coverage includes actual source selection, parallel retry, one-step undo/redo, parent motion, invalidity recovery and roundtrip. Syntax and git diff --check pass. Screenshot visually reviewed. Existing untracked FEATURE-GAP-ANALYSIS.md unchanged.

Scope: first M5b construction family only, as required by the per-family roadmap checkpoints. Next: line-circle, then circle-circle and derived circles as separate checkpoints. Tangent through a linked circle point remains a separate audit/extension in M5b. No units/text/vector/set additions implemented here.

Manual test: refresh; draw two crossing lines, choose Snijpunt van lijnen and click each away from the crossing. Move a source and check the point follows. Make the lines parallel and restore them; point disappears and returns. Check undo/redo. Finite segments that do not meet must not create a point. Manual acceptance pending.
