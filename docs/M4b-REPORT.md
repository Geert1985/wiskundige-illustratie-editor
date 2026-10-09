# M4b ? Semantic commands and replay report

Date: 2026-10-09. Technical outcome: PASS. User acceptance pending.
Start: af01055f940ee74f64a6e781729ad0b6c810f87e, verified on GitHub branch chatgpt/math-illustration-stabilization.
Implementation: ea95ba10b9891b2c1c4847a1075f4254826b8b5e. Saved locally; not pushed.

## Delivered

SemanticSequence is an isolated author API for ordered creation, edits, source-input changes and existing group/layer operations. It stores a normalized baseline plus semantic payloads and generated IDs; replay reconstructs the whole sequence or a prefix via the existing AuthorCommands validation boundary. Failed operations never change the committed sequence. Returned documents/artifacts are detached copies. IDs from multiple tangent results, duplication, deletion/recreation, groups and layers are verified during replay.

construction.setInputs is an author-only shared command. It preserves construction kind, tangent branch, object identity, styles and organization; unchanged reference annotations remain intact. Typed reference roles are validated before graph recomputation, and cyclic, missing, wrong-role, malformed and locked edits are atomic failures. Structurally valid geometric degeneracy remains recoverable. The inspector exposes role-specific source dropdowns for a single linked construction; changes form one undo step. Restricted course and assessment contexts refuse the command and have no input editor.

## Compatibility and limits

No geometry document version change or golden update. Geometry imports do not fabricate a construction history. Sequences are separate untrusted version-1 artifacts, not method proof or policy grants. Replay never imports into the live editor or runtime. Limits: 1000 commands, 4 Mi serialized characters, 100000 nodes, depth 64. Timeline/animation, automatic editor recording, learner replay and authoritative scoring remain later work. This milestone supplies the replay API and source editor, not a playback UI.

## Verification

Three new specification tests were first run red (0/3 passed) because the implementation was absent. Final complete Node suite: 293/293 PASS, including seven M4b tests. Full Edge suite: all 32 modules PASS and no page errors. Final targeted M4b Edge rerun after reference validation tightening: PASS for source editing, undo/redo, locking, deterministic replay and live-editor isolation. Inspector visually reviewed at 1543x884. git diff --check PASS. Existing untracked FEATURE-GAP-ANALYSIS.md was untouched and not staged.

## Files

Production: permission-runtime.js, semantic-sequence.js, editor.js, editor.html.
Tests: semantic-sequence.test.cjs, browser-semantic-sequence.cjs, browser.cjs.
Contract/API example: docs/M4b-COMMAND-REPLAY-CONTRACT.md.

Stop after M4b. No M5a or further milestone started.
