# M5a ? Linked geometry and path parameters

Start: accepted M4b local checkpoint 46ec863, 2026-10-09. Scope: lineBetweenPoints, pointOnSegment, pointOnCircle in the existing graph and command boundary.

Linked segment endpoints equal their ordered point sources. Coincident endpoints yield a recoverable invalid construction. Point-on-segment position is A+t(B-A), t in [0,1]; author commands clamp finite inputs. Circle position is center+r(cos(2*pi*t),sin(2*pi*t)); finite command inputs wrap to [0,1). The circle parameter is turns, not degrees. Zero-length paths/zero-radius circles invalidate without losing t or identity, and recover on parent edits. Direct calculated coordinate edits remain refused. Source rebinding preserves parameter; detach keeps current point geometry. Existing snapshot/history and M4b replay routes remain.

No new object types or coordinate transforms. New recipes require constructionSchema 2; old-only documents retain schema 1 and existing golden output. Geometry model versions 1?5 remain supported, with explicit schema validation for new recipes. Imported noncanonical/nonfinite parameters or schema mismatches are structural errors, refused atomically. Segment roles accept finite segment/vector/dimension geometry and polygon edges, not infinite lines/rays.

UI: three construction tools; pick sources through the existing owner and hit/highlight path. Path click initializes t by projection/angle. Author inspector provides the existing source choices plus a position slider. Parameter edits use a dedicated author-only command, obey locks and form one undo step. Restricted runtimes may create recipes only with tool/source grants and may follow permitted parent edits; direct parameter changes/source rebinding remain denied. No learner parameter binding or new drag controller. M5b intersections, derived circles and M9 locus/trace remain out of scope.

Acceptance: failing tests first; parent motion, endpoints/clamp/wrap, invalidity/recovery, schema/legacy roundtrip, cycles, immutable calculated fields, atomic failures, permissions, deterministic replay, creation and slider undo/redo in real Edge, full regressions.
