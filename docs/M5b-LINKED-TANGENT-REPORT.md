# M5b linked-point tangent completion

2026-10-10. Implementation 42fd06ea2e144821058900492d4a314f7b9ce1cf on chatgpt/math-illustration-m5b. Main unchanged. User requested final M5b extension.

Audit confirmed existing tangent recipe already accepts linked pointOnCircle sources and follows their parameter, circle center/radius and derived-circle parents. No new recipe, command or schema needed. Added explicit linked-point instruction text.

Two proven corrections: initial tangent result count now shares the solver's scaled contact predicate (1e-9*max(1,d,r)), preventing duplicate on-circle tangents at larger scales; selected author path point takes hit priority within the existing 8px selection tolerance so an overlapping dependent tangent cannot intercept its drag. Priority restricted to single selected pointOnCircle/pointOnSegment in author selection mode; existing runtime grants/locked-object rules stay authoritative. One interaction/controller and existing history retained.

Validation: five new Node tests. Scaled contact count failed before correction. Real center-of-point dragging failed without selected-point hit priority (parameter stayed .25); passed after fix. Full Node 326/326 and full Edge 39 modules pass with no page errors. Coverage includes one tangent, perpendicularity, actual point drag and undo/redo, parent changes, invalidity recovery/style retention, derived-circle chain, schema compatibility, deterministic replay and allowed/denied source grants. Diff/syntax checks pass; screenshot reviewed. Existing untracked FEATURE-GAP-ANALYSIS.md untouched.

M5b technical scope complete: line-line, line-circle, circle-circle, center/perimeter derived circle and linked-point tangent. Manual acceptance pending for this checkpoint. Single-result creation does not auto-spawn new IDs if later moved to a two-solution state, as documented in the respective contracts. Circle through three points/triangle circles remain M6 or future separately scoped work.

Manual test: refresh; create circle and linked Punt op cirkel. Raaklijn: select circle then that point. One tangent appears. Select point in object list and drag it along circle; tangent stays through point, perpendicular to radius. Move center/change radius, test undo/redo. Outside free points still yield two tangents; interior points yield none.

Next agreed addition after acceptance: document units, scale and measurement notation, followed by dynamic text; M6 remains in original roadmap. Legacy-unit behavior must be specified before implementation.
