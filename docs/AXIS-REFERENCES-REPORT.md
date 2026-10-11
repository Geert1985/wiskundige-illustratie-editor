# Cartesian axis references report

2026-10-11. User requested this limited angle-measurement revision after manual testing. Branch chatgpt/math-illustration-m5b; main remains unchanged. Inventory and AXIS-REFERENCES-CONTRACT.md were written before implementation.

## Delivered

Stable built-in `{kind:'axis',frame:'cartesian',axis:'x'|'y'}` source references for angleDirections only. No document objects, IDs, locks or editable geometry are created for axes. Explicit constructionSchema 3 is emitted only when axes occur; schemas 1/2, old angleXAxis and their geometry remain compatible without migration. The separate angleXAxis sidebar/pencil entry is removed and its remembered menu choice falls back to angleDirections.

Directions are fixed positive Cartesian axes or stored begin-to-end object direction. Supporting-line intersection anchors nonparallel cases. Parallel cases containing an axis anchor at origin, independent of source order; object-only cases retain first-start semantics. Smallest/directed, degrees/radians, precision, arc visibility and label/style settings retain their existing path. Unit-circle OP follows P continuously with the vertex at O, including parallel endpoints.

Screen-transform axis hit testing only runs for angleDirections, visible axes and authorized sources. A real eligible object wins overlaps; free axis span or author source inspector provides disambiguation. Dedicated pointer-free hover/selected overlays and positive-axis source names are included. Pan remains higher priority and axis-properties navigation unchanged. Fullscreen uses the same picker/pencil palette. Native fullscreen confirmation is idempotent and cannot close an already opened properties pane.

Author source editing, graph traversal/depth budgets, public source inspection, grouped duplication/remapping, import/export and semantic replay handle the built-in reference explicitly. No other recipe accepts axes. Optional restricted policy axisSourceTools grants x/y separately, default denied, with allowedTools and ordinary object sourceTools independently enforced. Existing baseline axes measurements remain renderable/exportable without a new creation grant. Invalid/malformed refs and incompatible tools fail before commit.

The tool sidebar now uses one column of equally wide buttons and a 220px panel (previously 280/300px). Long names wrap when necessary and split menus stay within the panel. The fullscreen pencil palette retains its existing layout.

## Validation

Full Node suite: 360/360 passed. Full Edge suite: all modules passed, including axisReferences and stackedTools; zero page errors. Stacked-tool layout and split-menu containment passed at widths 1446, 1159, 1024, 760 and 390 pixels. Screenshot stacked-tools.png was visually checked. Eight new Node tests and a real Edge module cover unit-circle movement, fixed origin, x/y and y/x directed orientation, parallel policy, strict types/frame/schema, other-tool rejection, grouped/layer persistence, ID collision safety, legacy angleXAxis, source rebinding, deterministic replay, cascade, restricted grants, undo/redo and exports. Edge additionally checks actual hover/click, object/axis overlap, hidden axes, pan/properties, fullscreen and remembered choice. All earlier regression modules passed before publication.

## Remaining limits

Axes are Cartesian and fixed at the global origin; no skew/multiple frames or extra construction tools are enabled. Selecting at an overlap deliberately prefers a document object. New schema 3 documents require a schema-3-capable reader; legacy files retain their old schemas. Nearly parallel directions retain the existing 1e-12 supporting-line tolerance and coordinate-limit invalidity. Multiple measurement labels can still overlap and use existing manual label offsets. Manual user acceptance remains pending; dynamic text manual acceptance is not inferred from angle feedback.

Local evidence: axis-references-node.txt, axis-references-edge.json, axis-references.png, stacked-tools.png and Assen-als-hoekbronnen-testen.md.
