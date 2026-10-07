# Illustration documents — version 2

The editor imports legacy version 1 and exports version 2. A missing version is treated as legacy version 1. Future versions, unsupported document/object types and malformed known fields are rejected before replacing existing state. Older engines intentionally reject version 2 instead of silently dropping newer data.

## Schema and atomic loading

- Root: a JSON object with an `objects` array. `type` may be omitted in a legacy file, otherwise it must be `geometry`. `version` is 1 or 2 (legacy numeric strings are accepted).
- `meta` is an optional object; `title` and `description`, when non-null, must be strings. Other metadata fields are retained.
- Each object has a supported type (`point`, `line`, `circle`, `text`) and a nonblank string ID or finite legacy numeric ID. IDs are canonicalized to strings and must be unique after canonicalization. Numeric ID `1` and string ID `"1"` conflict. Missing geometry fields retain the existing defaults; supplied coordinates must be finite numbers or nonempty numeric strings. A supplied circle radius cannot be negative.
- Optional visibility/label flags are booleans or legacy null. Label offsets are finite numbers/numeric strings or null. Styles are objects. Names, labels and text are strings or finite legacy numbers, which retain their textual meaning.
- Unknown JSON fields at root, metadata, object, style and presentation level survive roundtrips. Unknown fields are retained as data, not executed as editor options. Unsupported object types and future versions are rejected, not discarded.
- `IllustrationModel.load` stages validation, migrations, cloned data, unique IDs and the next ID before one state commit. `Engine.load` additionally stages a renderer and checks whether the presentation can be rendered within the 0A safety contract. Neither a parse/schema error nor a rejected presentation changes the old model or renderer.
- IDs with unsafe numeric suffixes do not poison automatic ID generation. The generator wraps to a safe integer counter and still checks collisions.

## Names and legacy labels

For version 1, a nonempty legacy `label` becomes `name` when `name` is missing, empty or equal to the ID. Version 1 filled missing names with IDs, so `name === id` cannot distinguish a default name from an explicitly chosen one. We consistently prefer the distinct legacy label in that ambiguous case. A different explicit name wins. The original legacy label field is retained.

Version 2 records the migrated name and does not repeat this ID-name heuristic. Renaming an object back to its ID therefore survives another save/load even if an old label field is still present. `showLabel: false` continues to win over legacy label visibility.

## Label positions

- `labelOffsetX/Y: null` (or missing): use legacy `labelDx/Dy` SVG-pixel offsets. Missing legacy offsets default to `(8,-8)` for points/circles and `(6,-6)` for lines/text.
- Numeric `0`: explicitly place the label at its object's anchor along that axis. Never infer null from zero.
- Other numeric values: mathematical offsets; positive Y points upward. They survive normalization, unrelated object updates and JSON roundtrip.
- Label renderer and both existing drag paths use this null distinction. Pointer scaling and the competing drag architecture are unchanged; those issues belong to later milestones.

Already exported numeric zeros cannot be automatically distinguished from zeros created by the previous null bug. This migration preserves all explicit numeric zeros rather than guessing.

## Persistent presentation policy

`Engine.toJSON()` captures `presentation` with bounds, background, cartesian coordinate system, `axisStep`, axis/grid visibility, individual axis visibility, axis labels, origin and snap-marker visibility. The editor's existing adaptive-grid policy remains authoritative and recalculates the step for the restored viewport. A standalone engine without that feature layer retains its explicit static step.

Bounds obey the 0A limits (finite coordinates within ±1e12; spans between 1e-6 and 1e12). Steps must be positive and finite; rendered grid/axis layers obey the 1000-position budget. Non-cartesian systems remain unsupported.

Selection, drag state, previews, actual window dimensions, renderer width/height/padding and the active tool are not newly saved. Unknown fields with those names are retained inertly if present in imported extension data. Renderer options explicitly supplied by a caller override persisted presentation at construction. Importing a legacy file without presentation retains the current renderer's settings; restoring such a draft after startup uses the normal initial viewport.

## Saved draft policy

The draft key remains `fzi.mathIllustration.draft`.

- Startup attempts to restore the saved draft through the same atomic import path.
- Save explicitly replaces it with the current version-2 document and presentation.
- A missing draft starts an empty editor.
- Corrupt JSON, rejected schema or unavailable storage produces a status message and does not delete recovery data.
- New confirms deletion of both the saved draft and current unsaved work, then starts a new illustration. If draft deletion fails, the editor reports it explicitly.
- Storage/quota errors are reported in the existing status area. No `Storage.prototype` methods are replaced.
