# M5a ? Linked geometry and path parameters

Start: accepted M4b local checkpoint 46ec863, 2026-10-09. Scope: lineBetweenPoints, pointOnSegment, pointOnCircle in the existing graph and command boundary.

Linked segment endpoints equal their ordered point sources. Coincident endpoints yield a recoverable invalid construction. Point-on-segment position is A+t(B-A), t in [0,1]; author commands clamp finite inputs. Circle position is center+r(cos(2*pi*t),sin(2*pi*t)); finite command inputs wrap to [0,1). The circle parameter is turns, not degrees. Zero-length paths/zero-radius circles invalidate without losing t or identity, and recover on parent edits. Direct calculated coordinate edits remain refused. Source rebinding preserves parameter; detach keeps current point geometry. Existing snapshot/history and M4b replay routes remain.

No new object types or coordinate transforms. New recipes require constructionSchema 2; old-only documents retain schema 1 and existing golden output. Geometry model versions 1?5 remain supported, with explicit schema validation for new recipes. Imported noncanonical/nonfinite parameters or schema mismatches are structural errors, refused atomically. Segment roles accept finite segment/vector/dimension geometry and polygon edges, not infinite lines/rays.

UI: three construction tools; pick sources through the existing owner and hit/highlight path. Path click initializes t by projection/angle. Author inspector provides the existing source choices plus a position slider. Parameter edits use a dedicated author-only command, obey locks and form one undo step. Restricted runtimes may create recipes only with tool/source grants and may follow permitted parent edits; direct parameter changes/source rebinding remain denied. No learner parameter binding or new drag controller. M5b intersections, derived circles and M9 locus/trace remain out of scope.

Acceptance: failing tests first; parent motion, endpoints/clamp/wrap, invalidity/recovery, schema/legacy roundtrip, cycles, immutable calculated fields, atomic failures, permissions, deterministic replay, creation and slider undo/redo in real Edge, full regressions.

## Mathematical conventions and API

Lengths at or below 1e-9 are treated as collapsed for the two segment recipes. Circle parameter 0 is the rightmost point, .25 the top, .5 the left and .75 the bottom in mathematical coordinates; increasing t runs counterclockwise. Rebinding keeps t, rather than the old world-space point. The editor slider quantizes subsequent edits to .001; stored/imported canonical parameters retain their full precision until edited. Author selection mode also supports direct path-point dragging through the existing pointer owner. Movement projects the mathematical pointer onto the source segment (clamped) or circle (wrapped), using construction.setParameter. A gesture records one undo step; Escape and pointer cancellation restore the original parameter and dependent geometry. Locks and restricted-runtime denials remain in effect.

```js
const MI = FZI.MathIllustration;
const commands = MI.AuthorCommands(engine);
const create = (toolId, sources, parameter) => commands.execute(
  commands.createCommand('construction.create', {
    toolId, sources, ...(parameter !== undefined ? { parameter } : {})
  })
).result[0];
const segment = create('construct:lineBetweenPoints', [
  { objectId: 'A' }, { objectId: 'B' }
]);
const point = create('construct:pointOnSegment', [{ objectId: segment.id }], .25);
commands.execute(commands.createCommand('construction.setParameter', {
  id: point.id, value: .75
}));
```

Engine.construct(kind, sources, parameter) and M4b SemanticSequence use the same recipes. A newly-created construction must exist geometrically; invalid creation retains the error message, adds nothing and allows retry. Existing invalid linked objects keep their last coordinate snapshot and their parameter, stay out of rendering/hit/snap, and can recover after a parent edit.
