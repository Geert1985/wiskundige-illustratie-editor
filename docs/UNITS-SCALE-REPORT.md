# Units, scale and measurement notation report

2026-10-10. Implementation commit 77733a7 on chatgpt/math-illustration-m5b. Main unchanged. Full requested units step technically complete; user manual acceptance pending. See UNITS-SCALE-CONTRACT.md.

## Delivered behavior

- New author documents: centimeter, one coordinate unit = 1 cm, two decimal places. Explicit axis-properties section with e/mm/cm/m/km, finite positive scale and integer precision 0..10; also available in fullscreen.
- Length, radius and perimeter multiply by scale; area by scale squared. Degree angles are independent of length scale. Shared formatter uses fixed decimals, Dutch comma and correct squared-unit suffix. Physical-unit conversion preserves physical quantities. Abstract transitions retain numeric scale.
- Computed labels, live polygon labels, SVG and measurement inspector use document notation. Free measurement text is untouched. Exact typed drawing length/radius uses display units, converts back to coordinates and rejects nonfinite distances.
- Validated meta.measurement schema 1 persists in JSON, drafts, SVG rendering and semantic sequences. Author-only document.setMeasurement is atomic and undoable; malformed metadata leaves the document intact. Geometry IDs, source graph, styles and coordinates are unchanged by settings and zoom.
- Missing metadata preserves original unitless formatting until explicit edit. Standalone Engine creation remains legacy-compatible; new editor author documents opt into cm. Cached area/perimeter text remains coordinate-space data; displayed labels are calculated at full source precision before formatting.
- Course/assessment display and permitted export retain the settings, without settings edit grants. Private renderer computes permitted derived measurements even when source geometry is hidden, including transaction previews/cancellation, without exposing hidden source geometry or accepting fabricated measurement objects.

## Validation

PASS: full Node suite 331/331; full Edge suite 40 modules; zero page errors; git diff --check clean. Visual review completed at 1446x884. Logs and screenshot saved in task outputs as units-scale-node.txt, units-scale-edge.json and units-scale.png.

New tests cover formatting, radius/length semantics, area square scaling, unaffected angles, physical/abstract conversion, legacy/free text, invalid metadata and command atomicity, geometry and zoom invariance, semantic replay, hidden-source precision, course/assessment denial/export and preview/cancellation isolation. Real Edge UI covers startup defaults, legacy loading, all settings, undo/redo, invalid-scale restoration, pointer drawing with display-unit keyboard length, save/reload and fullscreen settings/Escape behavior. Existing construction, permissions, history, import/export and interaction regressions remain passing.

## Manual acceptance

1. Refresh the editor. Start a new document and open Assenstelsel > Eenheden en schaal: cm, scale 1, decimals 2.
2. Create a length of three coordinate units and show its measurement; expect 3,00 cm. Set scale 2: expect 6,00 cm, with unchanged geometry. A circle of coordinate radius 1 has area 12,57 cm2 at this scale (the UI uses superscript 2).
3. Switch cm to mm: scale becomes 20 and the same length becomes 60,00 mm. Set decimals 3 and verify 60,000 mm. An angle keeps its degree value; zoom does not change quantities.
4. At scale 2 cm per coordinate unit, type length 6 while drawing: resulting coordinate length is 3. Check undo/redo, save/reload, JSON/SVG export and fullscreen axis settings.
5. Load an old document without units: original notation remains. Free maattekst is not modified. Invalid scale zero does not overwrite the current setting.

## Remaining scope

Dynamic text bindings, expression templates and additional mathematical notation are the next separate addition; not silently implemented here. Published old JSON consumers may ignore new metadata and continue showing coordinate-space cached text. Axis ticks/geometry inspector values intentionally remain coordinates. Extremely large scaled values that overflow show niet beschikbaar. No migration or new restricted-mode permission grant was introduced.
