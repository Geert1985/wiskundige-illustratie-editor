# Point coordinate projections report

2026-10-10. Implementation a39a779 on chatgpt/math-illustration-m5b. User explicitly requested section 9 of specification 1.4.0, fetched from main f166078. Only that new section was incorporated into the local specification; previously completed units decisions are preserved. No merge into main. Technical implementation complete; manual acceptance pending.

## Delivered

Point inspector section Coordinatenprojecties (UI uses accented spelling), none/x/y/both options and independent values toggle. Optional point-only coordinateProjections schema 1 with explicit cartesian document frame; missing property remains off and legacy data is not migrated. Strict atomic validation rejects unsupported frames, versions, invalid values and non-point use.

Vertical dotted line to the x axis and horizontal dotted line to the y axis, with signed unit/scale/precision labels. Zero-length helpers suppressed, zero values retained. Correct negative rounded zero, axis visibility, clipping and inside-viewport labels; duplicate identical axis/value labels suppressed. Values placed opposite ordinary ticks, with additional origin/axis spacing. Point stroke/fill color, opacity and bounded helper stroke width reused. Source changes, invalidity/recovery, movement previews/cancel, layers and zoom/pan use existing render/graph/transform ownership.

Helpers are point presentation, not independent geometry, snap sources, selection targets, graph dependencies or draggable labels. Selection/hover halo and multi-object selection frame exclude projection helpers. Locked points retain their display and disable edits. Selecting a point in fullscreen opens its inspector so the new controls are reachable; Escape closes the panel without leaving canvas fullscreen.

Settings use existing object.setProperties and its permissions/history/semantic replay. Course/assessment may display/export published projections, but editing requires an explicit coordinateProjections propertyFields grant; default denied, locks respected. JSON roundtrip, duplicate/detach and source recalculation preserve settings. Hidden/unreadable/layer-hidden/invalid points omit helpers.

SVG includes clipped helpers and the same values. SVG-to-PNG rasterization tested and visually reviewed; no new standalone PNG export button added. Testing discovered legacy valueless data attributes that made standalone SVG invalid XML. Renderer now emits explicit empty attribute values; quoted labels/text are preserved. The representative SVG golden was amended only for two empty attributes (grid/axes), preserving its geometry, styles, labels and layout; newline normalization makes the comparison portable. Node and Edge tests verify this correction, DOMParser XML validity and actual PNG rasterization.

## Validation

PASS: 338/338 Node tests, 41 full Edge modules, zero page errors, git diff --check. Seven new Node tests cover validation/atomicity, geometry/formatting, origin/axis cases, clipping, read/display and explicit edit grants, locks, linked follow/recovery, layers, replay/roundtrip/detach and XML serialization safety. New Edge module uses real controls and pointer events for choices, values toggle, drag/history, helper hit exclusion, lock controls, linked parent following, fullscreen, wheel zoom/pan, storage/reload, restricted controls and SVG/PNG. Existing regressions preserved.

Artifacts in task outputs: point-projections-node.txt, point-projections-edge.json, point-projections.png (editor), point-projections.svg and point-projections-export.png (actual rasterized export). Visual review at 1446x884 and standalone exported PNG completed.

## Manual acceptance

1. Refresh the editor; create/select a point, open Coordinatenprojecties. Default is Geen. Choose Beide, Alleen x, Alleen y; toggle coordinate values independently.
2. For P=(-2,1) with cm scale 1 precision 2, expect x = -2,00 cm and y = 1,00 cm. Change units/scale/precision at Assenstelsel; coordinates stay unchanged, values update.
3. Drag the point; helpers and values follow. Check undo/redo, a linked midpoint or point-on-circle, save/reload and zoom/pan.
4. Test points on either axis and at the origin; no collapsed helper lines or misleading duplicate origin labels. Hide an axis or point; corresponding helpers disappear. Lock the point; settings disable while helpers remain.
5. Click a helper away from the actual point: it is not selected. In fullscreen, click the point to open its properties; Escape keeps fullscreen. Check SVG export if desired.

## Scope retained

Only the existing Cartesian document frame is implemented, explicitly stored to prevent future silent reinterpretation. Multiple/skew frames require their own coordinate transform milestone. Dynamic text and all remaining roadmap items are retained and have not started here. FEATURE-GAP-ANALYSIS.md remains user-owned and untouched.
