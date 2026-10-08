# Measurements and multiple selection

Tools: Lengtemaat draws a finite dimension with endpoint ticks. Typing a length during its drag retains the exact mathematical distance. Hoek takes three clicks in order: first arm endpoint, vertex, second arm endpoint. Rechte hoek projects the third point onto the perpendicular arm and preserves exactly 90 degrees. Angles are minor angles from 0 to 180 degrees.

Dimension and angle labels default to computed values rounded to two decimals. Existing linear objects can enable a length annotation; circles can enable a radius annotation. The inspector switches between computed values and free text. Free text is escaped in SVG and preserved in JSON. Measurement labels use the existing label-drag offsets, shared with the object's name label if both are enabled. These are independent geometric objects, with no dependency links to other objects.

Shift/Ctrl/Meta-click on the canvas or object list toggles selection. Ctrl/Meta+A selects visible objects; Ctrl/Meta+D duplicates the selection. Clicking a selected member then dragging moves the whole selection. Every member receives one common translation and one common snap correction; all selected IDs are excluded from snap candidates. Endpoints/vertex handles are available for a single unlocked selection.

Duplicate creates unique IDs, retains geometry, styles and extension data, translates by (0.5,0.5), and unlocks copies. Vergrendelen protects against geometry, label, style and delete commands; visibility can still change. A selection containing any locked member cannot move or delete until unlocked. Locks persist in documents, while multiple selection is transient and restored by undo/redo. There are no permanent groups or rectangle-selection tool in this step.

Batch updates and duplication stage a model and commit atomically. The existing interaction controller owns group drag, pointer capture, cancellation and history. Pointer cancellation, blur, Escape and lost capture restore every member and selection. A committed group gesture, duplication, lock or deletion creates one history command. No alternative render or pointer path was introduced.

Document version stays 2. New types are dimension (finite linear endpoints) and angle (three vertices plus angleMark arc/right). Optional measurementMode computed/text, measurementText, showMeasurement and locked survive roundtrip. Existing documents remain compatible. Builds predating these types reject documents containing them rather than silently losing them. A right-angle vertex edit that breaks 90 degrees is rejected.

Verification: complete Node suite (115 passing) and complete real Edge suite including exact dimension length, angle/right-angle preview and drawing, free text, radius annotations, multiple selection, rigid movement, cancellation, duplicate/lock/delete, history, SVG export and save/reload/import. No Edge page errors.

The angle/dimension inspector offers Alleen meetlabel tonen. The optional boolean measurementLabelOnly hides arms, arcs, right-angle squares, dimension lines and ticks in canvas and SVG export while retaining geometry, value, label offsets and label dragging. Default remains the full drawing. It persists with version 2 and undo/redo.

Triangle drawing previews show the active side length (two decimals) and, from the third point, the minor angle at the preceding vertex. These values follow the resolved snap point, are temporary and disappear on commit/cancel. They do not add stored annotations to the polygon.
