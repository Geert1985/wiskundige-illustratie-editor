# M5b linked-circle-point tangent audit

2026-10-10. Reuse tangent recipe (circle then point), not a new recipe/schema. Existing pointOnCircle and circleByCenterPoint dependency graphs are valid sources. On-circle point yields one tangent through P perpendicular to CP. External point yields two; interior or zero-radius cases have no tangent. Existing invalidity/recovery and branch identity retained.

Fix discrepancy: tangent calculation uses contact tolerance 1e-9*max(1,d,r), while creation count used absolute 1e-9. Centralize on-circle classification so contact geometry and initial result count agree at all scales. Preserve legacy tangent formulas, both existing branches' behavior when they later touch, command signatures and constructionSchema. No auto-spawning new result IDs.

All existing source selection, point dragging via parameter projection, source editing, locks/grants, one-step undo, imports and replay remain authoritative. Instructions explicitly mention a linked point on the selected circle. Validate actual pointer dragging, parent center/radius changes, perpendicularity, invalidity recovery, legacy cases and scaled near-contact counting. Audit closes the specified M5b tangent extension after manual acceptance; M6 and units/dynamic-text additions are separate future work.
