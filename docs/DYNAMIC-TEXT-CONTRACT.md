# Dynamic text contract

2026-10-10. Authorized next roadmap addition after units, projections and angles. One typed source field per free text object; templates containing multiple fields remain a later extension, as specified in POST-M5A-ENHANCEMENTS-SPEC.md section 1.

## Data and behavior

Optional text-only `textBinding` is null (static) or `{schema:1,sourceId,property,precision,prefix,suffix}`. ID is a nonempty string. Properties: name/label on non-text geometry; length on finite line/vector/dimension; radius on circle; perimeter/area on circle/polygon; angle on angle; x/y on point. Infinite line/ray has no finite length. Precision null inherits notation, integer 0..10 overrides decimals; prefix/suffix strings up to 2000 characters. Unknown keys/types/schema rejected atomically. No expressions or evaluation. Text sources and self references are excluded, so presentation introduces no dependency cycles.

Source geometry and name resolve by stable ID at render time, using the shared full-precision measurement formatter. Physical scale applies once to length/radius/coordinates and twice to area; angle uses source angle interpretation/unit and document angle standard, independently of physical scale. Explicit precision on a legacy length document uses abstract e/scale 1; unchanged legacy static text preserves its exact content. Prefix/suffix are literal, XML-escaped; authors control their own extra text (including any manually added suffix). Ordinary text and existing constructed perimeter/area labels retain their existing behavior.

A missing, temporarily invalid, inaccessible or mathematically incompatible source displays prefix + `niet beschikbaar` + suffix. Deleting a source does not cascade to the presentation text. Text position, identity, style and fallback static text are retained. Undo/source restoration with the same ID recovers automatically. Selecting Static text sets binding null and restores the stored ordinary text. This is a presentation reference, not a construction recipe: schema 2 recipes and topology are unaffected. Imports retain missing references visibly as unavailable rather than silently rebinding by name.

## UI and authorization

Select a free text object, then Dynamische tekst: source, applicable value, precision, prefix, suffix and live result. Source names are shown, IDs stored. Text property editing remains available in static mode. Normal translation/style editing, locks/history, save/reload, JSON/SVG and semantic command replay apply. Fullscreen text selection opens properties; Escape retains fullscreen.

Whole validated binding uses existing object.setProperties path with explicit textBinding property grant in restricted modes; locks still deny. Binding edits require an existing readable, mathematically applicable source. Read/display policy filters renderer source values. Public restricted object projections remove references to unreadable or missing sources and provide unavailable static fallback, avoiding disclosure of hidden source IDs or values. Author files preserve missing IDs for undo/recovery. No default learner grant or arbitrary code execution is introduced.

## Validation

Node: live values and names, all value families/scaling, escaping, strict validation/atomicity, missing/invalid recovery, static restoration, persistence/replay, locks, restricted source and property grants. Edge: actual inspector controls, live source edit, precision, undo/redo, missing source recovery, static mode, locks, fullscreen and save/reload. Run complete previous suites; manually test separately.
