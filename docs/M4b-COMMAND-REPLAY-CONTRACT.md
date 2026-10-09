# M4b ? Semantic commands and deterministic replay

Approved work started 2026-10-09 from af01055f940ee74f64a6e781729ad0b6c810f87e.

Scope: an isolated authoring command sequence API for existing creation, geometry/property edits, translation, deletion, duplication, detachment and construction input changes. Add construction.setInputs to the shared command boundary and an author inspector for its typed source roles. The existing operator kind and tangent branch remain fixed; changing sources recomputes dependents, preserves object identity/style/group/layer membership, and refuses missing/wrong-role/cyclic references or locked targets atomically. Structurally valid degenerate inputs retain the M4a recoverable-invalid contract.

Sequence artifact: type geometry-command-sequence, version 1, normalized baseline geometry document, ordered entries {operation,payload,createdIds}. Commands use the existing author authorization/validation boundary. Created IDs are recorded and verified during replay. Replay starts in a new isolated engine, can return any prefix, and never imports into or mutates a live editor. Failed commands leave both document and log unchanged. Unknown operations, malformed artifacts, mismatched IDs and oversized/deep input are refused. No selection, pointer previews, undo/redo, exports, policy, view or document replacement operations are allowed in a sequence.

This authoring API is independent of snapshot undo/redo. Imported geometry has no inferred commands. Sequence artifacts are untrusted data and provide no assessment method proof, grants or provenance. Course/assessment cannot execute construction.setInputs. No document schema bump, geometry golden rewrite, new formulas, learner replay, timeline/animation UI or automatic recording of transient editor interactions; those remain separate milestones.

Acceptance: failing regression tests first; deterministic geometry and IDs across creation/deletion/replay, tangent multi-results, prefixes, invalidity recovery, source rebind/cycle/lock atomicity, malicious artifacts, restricted-mode denial, detached copies and unchanged legacy roundtrips. Author source dropdown edits must be one undo step; full Node and real Edge regressions.

## API example

Load semantic-sequence.js after index.js and permission-runtime.js (included in editor.html).

```js
const MI = FZI.MathIllustration;
const sequence = new MI.SemanticSequence({ objects: [] });
const point = sequence.execute('object.create', {
  toolId: 'create:point', object: { type: 'point', x: 1, y: 2 }
}).result;
sequence.execute('object.setGeometry', {
  id: point.id, fields: [{ path: 'x', value: 3 }]
});
const artifact = sequence.toJSON();
const initial = MI.SemanticSequence.replay(artifact, { steps: 0 });
const finalDocument = MI.SemanticSequence.replay(artifact);
```

The sequence owns its engine privately. document and toJSON() return detached copies. No live engine, runtime policy or undo entries are accepted. Application of a replayed result to a live document is a separate authorized import decision. Limits: 1000 commands, 4 Mi characters of serialized artifact, 100000 visited nodes and depth 64. Prefix replay validates artifact structure and only executes the requested prefix; a prefix is not a validation claim about later command semantics.
