# F16/F17 — mutation and selection contracts

## Object ownership and atomic mutation

IllustrationModel keeps its object array in a private class field. `model.objects` is a deeply frozen read-only view, including styles/unknown extension fields. Hot-path readers (renderer, snapping, hit testing and panels) retain safe access without cloning the entire document on each resolve. `get(id)`, `all()`, add/update return values and JSON exports are detached snapshots. Modifying these snapshots cannot change the document.

Use `add`, `update`, `remove`, `clear` or atomic `load` to change objects. Model metadata/presentation and renderer settings retain their existing APIs; this change protects object ownership, not every public engine property. Unknown JSON extension fields remain supported. Document version remains 2.

Add/update validate the original values before they could be silently replaced by defaults or converted by JSON cloning. Supplied coordinates must be finite numeric values (compatible numeric strings normalize to numbers). Negative circle radius is rejected. Missing fields retain existing defaults. Null mathematical label offsets still mean legacy pixel positioning; explicit zero is preserved.

Known numeric style fields: strokeWidth ≥ 0, radius > 0, fontSize > 0, opacity between 0 and 1 inclusive. NaN/Infinity, booleans, blanks/null and invalid ranges are rejected when supplied for these fields. Compatible finite numeric strings are accepted. Unknown style extensions remain opaque JSON data. Arrays/non-record style patches are rejected.

Style patches merge recursively for nested records; arrays/scalars replace the corresponding field. Unspecified radius/dash/opacity/custom fields remain intact. Null may be an opaque extension value, but is not a numeric style value or an entire style reset. Supply explicit defaults if resetting known fields. Existing object IDs/types are immutable in update: changing identity requires explicit remove/add. Failed add/update/import preserve document state; failed generated-ID adds also restore the ID counter.

Existing files with valid geometry/styles retain their version-2 representation. Invalid styles that were previously silently accepted now produce a validation error before import commits. Direct get-mutation is an intentional API compatibility change: migrate `engine.get(id).x = value` to `engine.update(id, { x: value })`.

Inspector edits use the numeric input's valueAsNumber, so a blank numeric field cannot silently become zero. Invalid values display a status error and restore the inspector from current state, without throwing an unhandled browser error.

## Selection

The editor keeps explicit visible DOM target selection as its first choice. This selects the actually painted object (including text body and circle center) and respects SVG painting order at overlap. Label/endpoint dragging retains its earlier priority; hidden objects are never eligible. Sidebar object selection activates the select tool.

The geometric fallback uses the existing CoordinateTransform with **8 CSS pixels** of tolerance:

```js
engine.selectAt(mathX, mathY, { transform, tolerancePx: 8 });
```

Point/text anchor distances and line projection are calculated in screen space. Circle center and outline are eligible. Uniformly transformed circles use exact radial screen distance; nonuniform affine transforms use bounded nearest-outline refinement on the transformed ellipse. Equal screen-distance candidates choose the last painted object. The returned `distance` is in CSS pixels for this options form.

The numeric legacy `selectAt(x, y, tolerance)` contract is retained: mathematical tolerance/distance and first nearest candidate. This keeps standalone callers compatible. Text extent comes from actual DOM hit targets; the geometry-only fallback does not estimate font glyph bounding boxes.

Snapping still uses its independent existing 12-pixel policy and exact-length/radius/rigid-translation contracts. Selection does not mutate/snap mathematical coordinates. No new object types, dependencies or document fields were added.

## Regression coverage

73 Node cases: all prior 67 plus six new object/style/atomicity/screen-selection tests. The cache instrumentation test now observes a service-input fixture rather than trying to attach a getter to a live production get-object; all cache reuse/invalidation assertions are retained, and detached mutations are explicitly tested.

The full Edge suite retains all earlier checks and adds 24 selection clicks (7/9 pixels, two widths, three zoom ranges, point/line), actual text-body drag, blank/negative inspector rollback, detached get and nested style roundtrip. Remaining performance limits in PERFORMANCE.md and physical multi-touch/OS-focus/resize-during-gesture test boundaries are unchanged.
