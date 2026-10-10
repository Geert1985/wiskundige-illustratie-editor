# Grouped point construction tools

2026-10-10. User requested one split-button for all point-producing constructions. Includes midpoint, point on segment/circle, line-line, line-circle and circle-circle intersections. Linked segment remains separate because it produces a line.

Reuses existing split-menu keyboard/outside-close, independent saved preference, permission fallback and fullscreen tool discovery. Main button immediately activates remembered choice. Wide button preserves long labels; menu is constrained to available sidebar height with scrolling where needed. No geometry or document format changes.

Validation: full 37 Edge modules passed. Final targeted split-tool rerun after sizing refinement passed; verifies six entries, real choice and main-button activation, saved choice after reload, narrow-sidebar containment, existing keyboard and restricted-tool behavior. Screenshot reviewed. Syntax and git diff --check pass. Existing untracked FEATURE-GAP-ANALYSIS.md untouched. No next geometry milestone started.
