# Triangles and polygons

The triangle tool creates a three-vertex `polygon`. The polygon tool creates a simple closed polygon with 3–256 vertices. Both are one document object and one undo command. No independent triangle schema or dependent construction objects are introduced.

## Authoring

Click vertices in order. A triangle finishes on its third click. A polygon finishes with Enter or a click within the existing 12 CSS-pixel snapping tolerance of its first vertex. That closing click does not duplicate the first vertex. Hover previews the next provisional edge; Enter commits the vertices already clicked. Backspace removes the last vertex; Escape, window blur and an active pointercancel discard the unfinished shape. New, import and dispose also clear it.

Drawing requires distinct clicked vertices at least 0.05 mathematical units apart. Model validation requires finite coordinates within ±1e12, 3–256 distinct vertices, nonzero normalized signed area, and no crossing/overlapping boundary edges. Concave polygons and either winding are accepted. Collinear intermediate vertices are accepted when they do not backtrack. A rejected completed drawing remains editable via Backspace or can be cancelled.

## Geometry, interaction and presentation

`PolygonGeometry` supplies validation, boundary segments, interior hit testing and the arithmetic mean of vertices as label anchor. This anchor is not a claim about the polygon's area centroid and may lie outside a concave polygon. Coordinates use the existing CoordinateTransform. Whole-object dragging resolves snap candidates at all vertices, chooses by the existing deterministic priority, and applies one translation to every vertex. Dragging one vertex resolves independently with excludeId; an invalid deformation falls back to the original valid vertex. Preview, handles, inspector and commit use that same patch.

The inspector exposes coordinates per vertex. Interior and boundary can select the object. Selection handles are editor-only and are absent from SVG export. Existing color, visibility, labels, save/import/export and undo/redo apply. Default fill is `none`; an explicit JSON `style.fill` renders and survives roundtrip. No fill-control UI is added.

SnapService uses polygon vertices as existing `line-endpoint` candidates and finite polygon edges for existing line-line and line-circle intersections, including polygon-polygon edges. It excludes the whole object and dependent intersections for excludeId/visibility. Geometry cache keys include vertices. Existing priorities remain point > intersection > endpoint > circle center > grid. No geometric dependencies between snapped objects are stored.

## Format and integration

Version 2 adds `{type: "polygon", vertices: [{x, y}, ...]}`. Vertex extension fields are preserved. Existing documents retain their meaning. Older builds without polygon support reject these objects; they cannot open new polygon documents. Load `model.js`, `polygon-geometry.js`, `linear-geometry.js`, `renderer.js`, then `index.js` before constructing an Engine containing polygons. The editor entry point includes all dependencies before bootstrap.

Bounds, history and rendering use the existing safeguards. The per-polygon vertex count bounds validation work; many polygons still increase intersection-candidate cost. No spatial index, dependency graph or non-cartesian coordinate system is introduced.
