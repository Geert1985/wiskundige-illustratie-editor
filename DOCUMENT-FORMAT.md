# Illustration documents — version 2

The editor imports legacy version 1 and exports version 2. A missing version is treated as legacy version 1. Future versions, unsupported document/object types and malformed known fields are rejected before replacing existing state. Older engines intentionally reject version 2 instead of silently dropping newer data.

## Schema and atomic loading

- Root: a JSON object with an `objects` array. `type` may be omitted in a legacy file, otherwise it must be `geometry`. `version` is 1 or 2 (legacy numeric strings are accepted).
- `meta` is an optional object; `title` and `description`, when non-null, must be strings. Other metadata fields are retained.
- Each object has a supported type (`point`, `line`, `circle`, `text`, `straight`, `ray`, `vector`, `polygon`, `dimension`, `angle`) and a nonblank string ID or finite legacy numeric ID. IDs are canonicalized to strings and must be unique after canonicalization. Numeric ID `1` and string ID `"1"` conflict. Missing geometry fields retain the existing defaults; supplied coordinates must be finite numbers or nonempty numeric strings. A supplied circle radius cannot be negative. Straight/ray require distinct definition points; the new linear types require finite direction length.
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

## F16 validation follow-up

Version 2 is unchanged. Supplied numeric object/style values are now validated before normalization/commit; invalid styles formerly accepted silently are rejected atomically. Valid numeric strings and opaque JSON extensions remain compatible. Style patches merge recursively and retain unspecified fields. See [MUTATION-SELECTION.md](MUTATION-SELECTION.md) for numeric ranges, detached get and immutable stored objects.

## New linear types

`straight`, `ray` and `vector` use the existing x1/y1/x2/y2 fields; version 2 and earlier four-type documents remain unchanged. Older builds without these type values reject documents containing them instead of dropping their geometry. See [LINEAR-OBJECTS.md](LINEAR-OBJECTS.md) for domains, zero-vector policy and clipping/arrow semantics.

## Polygons

Version 2 additionally supports `polygon` with an ordered `vertices` array of 3–256 finite `{x, y}` objects. A triangle is a polygon with three vertices. Vertices must be distinct, coordinates remain within ±1e12, the polygon must have nonzero area, and its boundary must not cross or overlap itself. Concave polygons and both winding directions are supported. No closing duplicate is stored. Vertex extension fields, style and label offsets survive roundtrip. Older builds without this object type reject new polygon documents. Existing document types and migration rules retain their meaning. See [POLYGONS.md](POLYGONS.md).

## Measurements and editor locks

See MEASUREMENTS-GROUPS.md. Version 2 retains optional locked, showMeasurement, measurementMode and measurementText fields. Angle objects have three normalized vertices and angleMark arc/right; polygons retain normalized vertices. Locking protects editor commands; direct model operations remain available for import and history. Selection is transient.

## Linked construction documents (version 3)

Documents containing construction definitions export version 3 and constructionSchema:1. The editor still reads v1/v2 illustrations and writes v2 when no constructions are present. This feature declaration makes older builds reject linked documents rather than silently losing dependencies. See CONSTRUCTIONS.md for references, validation, recalculation, deletion and duplication policy.

Version-3 construction kinds area/perimeter create linked text labels from one circle/polygon source. Text is recomputed on source edits/import; label offsets and style remain persistent.


## Cartesian axis source extension

Documents containing built-in source references `{kind:"axis",frame:"cartesian",axis:"x"|"y"}` use constructionSchema 3. These constants are accepted by angleDirections and by lineCircleIntersection (line source slot 0), lineIntersection (either line slot), parallel/perpendicular (line source slot 0); they are not emitted as objects and have no objectId/parts/index or editable geometry. Schema 1/2 documents and legacy angleXAxis remain supported unchanged. Older readers lacking schema 3 must reject new files rather than treat axes as missing objects. See docs/AXIS-REFERENCES-CONTRACT.md.

Construction schema 4: angleDirections object sources may carry arm:start/end, selecting the negative/positive stored endpoint direction from the intersection. Only undirected line, straight, dimension and polygon edge sources allow this; axis, ray and vector references reject it. Explicit-arm documents require schema 4; schemas 1-3 remain readable.

2026-10-11 axis-arm extension: explicit clicked start/end arms now apply to undirected lines in angleDirections axis combinations as well. The Cartesian axis remains positive; axis sources never carry arm. Legacy combinations without an explicit arm preserve their stored-direction behavior. Rays/vectors retain orientation. Schema 4 persists the line arm and schema 3 remains unchanged for axis-only/legacy refs.

## Circle point distribution documents (version 6)

Documents containing a canonical `circleDistributions` registry use version 6 and `circleDistributionSchema: 1`. A distribution stores `{id,circleId,count,startAngle,pointIds}`; `startAngle` is a finite radian value in `[0,2π)`. Each member remains a normal point object whose `distributedPointOnCircle` construction stores the same `distributionId`, its exact zero-based index and the source circle reference. The model validates this relationship in both directions and rejects partial or orphaned records atomically.

Versions 1–5 remain readable without automatic conversion. Layers in v5 and v6 use `layerSchema: 1`; groups in v4–v6 use `groupSchema: 1`. v6 may contain groups and/or layers without dropping either collection. Restricted JSON export includes a distribution only when its circle and every member are readable and displayable; otherwise it fails closed. See `docs/CIRCLE-POINT-DISTRIBUTION-ARCHITECTURE-PROPOSAL.md` and `docs/CIRCLE-POINT-DISTRIBUTION-REPORT.md`.


## Rich text documents (version 7)

T3 extension (2026-10-12): v7 accepts textSchema 1/2/3. Schema 3 adds `dynamicValue` with typed binding `{sourceId,property}`, format `{precision,unitMode,angleMode,prefix,suffix}` and marks. Only binding/format is stored; current values and source names are not caches or document fields. Missing author source IDs remain for recovery; known incompatible sources/self-reference are rejected. Restricted projections replace denied atoms with plain unavailable text and omit backup metadata. Schema 4/calculatedValue remains rejected. See [docs/T3-CONTRACT.md](docs/T3-CONTRACT.md) and [docs/T3-REPORT.md](docs/T3-REPORT.md); this supersedes the historical schema-1/2-only statements below.

Explicit legacy migration requires schema 3 and removes textBinding while adding a validated `legacyStaticText` backup. Backup is server-derived original `.text`, not a computed value. It is used only by explicit static restoration. Legacy opaque keys of that name in schema 1/2 or plain objects remain inert and roundtrip unchanged; an upgrade collision is refused rather than silently reinterpreted or overwritten. New schema-3 backups must be strings within the rich-text limit. Inline duplication remaps only copied sources; legacy textBinding duplication retains prior behavior. Writer declares the maximum retained text schema, even if a schema-3 object currently contains only plain/redacted text.

T2 extension (2026-10-12): v7 accepts `textSchema: 1 | 2`. Schema 2 adds `{id,kind:"math",source,marks}`; formula source is authoritative presentation notation. JSON stores no SVG/HTML/glyphcache or editor-specific state. Each rich object's schema must not exceed the document declaration. The writer declares the maximum retained object schema, including restricted export; an object may keep schema 2 after removal of its last formula. Schema 3/4 and future fragment types are rejected. Formula-work quotas are checked atomically on load/add/update. `.text` is a derived readable fallback including math source. Existing schema-1 documents remain readable; v7 schema-1-only readers must reject schema 2. See [docs/T2-REPORT.md](docs/T2-REPORT.md). This extension supersedes the schema-1-only statements in the historical T1 paragraph below.

Documents containing at least one `textContent` fragment use version 7 and `textSchema: 1`. Schema 1 stores safe typed paragraphs, text runs and hard breaks; formatting is represented by validated marks, never HTML. v7 also accepts the version-6 circle-distribution registry and the v4/v5 group/layer schemas, so mixed files preserve all these features. The v7 loader rejects missing/unknown text schema, malformed fragments and rich fragments in versions 1?6. Files without rich text keep the existing minimal writer-version selection (v6 distribution, v5 layers, v4 groups, v3 constructions, otherwise v2). Older readers that do not know v7 reject it instead of dropping text formatting. Import remains atomic. See [docs/TEXT-EDITOR-ARCHITECTURE.md](docs/TEXT-EDITOR-ARCHITECTURE.md) and [docs/TEXT-EDITOR-T1-REPORT.md](docs/TEXT-EDITOR-T1-REPORT.md).
