# Object styles

The selected-object inspector includes a Stijl fieldset. Non-text objects offer line color, nonnegative line width and solid/dashed/dotted/dash-dot patterns. Points, circles and polygons additionally offer fill visibility and an independent fill color. Text objects offer text color and positive font size. All types offer coverage (Dekking) from 0–100%.

Changes commit on the existing change event. The redundant Stijl toepassen button has been removed; unchanged values do not create an undo step. Color choices use the existing in-page palette/hex dialog and its apply/cancel lifecycle. Inspector stroke color preserves fill, and fill color preserves stroke. The existing sidebar color action retains its compatibility behavior, including updating point outline and fill together.

Existing JSON fields remain `style.strokeWidth`, `style.dash`, `style.fill`, `style.opacity` and `style.fontSize`; document version is still 2. Coverage is translated between percent in the editor and 0–1 in the model. Imported custom dash patterns appear as Eigen patroon and are preserved until changed. Other style fields and nested extensions are retained by the existing recursive style merge. Unrelated edits preserve precise opacity values and an existing enabled fill.

Fill defaults to the current stroke color when newly enabled, or #222222 if there is no stroke. Turning fill off stores `none`; a later enable uses the then-current stroke color. The editor does not add a separate remembered fill field.

Opacity applies once to the whole rendered object group, including text, labels, arrowheads and a circle's center marker. Editor selection handles remain visible separately, allowing a 0%-coverage object to be edited after selection in the sidebar. SVG export uses the same presentation. Fully opaque SVG fixtures retain their previous output.

Font size and line width use the existing SVG units; they are presentation values, not mathematical distances. There is no font picker, rich text, separate fill/stroke opacity, dependent geometry or new coordinate system in this change.
