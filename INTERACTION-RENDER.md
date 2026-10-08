# Editor interaction and rendering contract — Milestone 0D

`editor-bootstrap.js` runs after all services have loaded. It constructs/restores the engine, then injects it and the services into `EditorApp`. `MI.editor` is the application. `MI.activeEngine` is a compatibility reference assigned only by bootstrap; creating or rendering another Engine cannot change it. Feature modules never discover engines through rendering.

The 0C `SnapService` and `InteractionResolver` APIs and priorities are unchanged. `CoordinateTransform.forCanvas(engine, document?)` accepts an optional injected document; existing callers retain their contract.

## One interaction owner

`EditorApp.interaction` is either null (idle) or one state with `mode`, `pointerId`, initial screen position, initial CoordinateTransform, rollback snapshot, and the applicable resolver result/last mathematical pointer. Modes are object, label, endpoint, draw and pan. Only the owning pointer can move, commit or cancel. A second down cannot replace the state.

Pointer capture is held by the stable `canvasWrap`, which survives SVG replacement. Pointer-up is also listened for on window, so release outside the canvas commits. Pointercancel, unexpected lostpointercapture, window blur and Escape roll back. Tool changes, New, import/load, reset and dispose terminate any active interaction. Capture is released after clearing ownership so its lostpointercapture event cannot cancel a finished transaction.

- Object and label movement and pan have a live display/model update plus an initial rollback snapshot.
- Endpoint movement keeps a staged resolver patch; the model receives that exact patch only on commit.
- Drawing stores the last valid mathematical pointer and resolver output. Keyboard measurement resolves without sampling coordinates from a KeyboardEvent. Commit uses the displayed result; rejected short shapes leave no state/preview.
- Line translation and exact length/radius use the existing 0C invariants. Label movement uses CoordinateTransform.screenDelta, with legacy pixel offsets converted once through the renderer scale. Label and endpoint dragging are available only in the select tool.
- Escape cancels and selects the select tool. Cancel restores selection as it was before the gesture. Successful object/label/endpoint interaction retains its selected object.

`init` is idempotent. Every installed listener records its removal; `dispose` rolls back, removes listeners/color input and aborts/invalidate pending import readers. Calling `init` again rebuilds one listener set. Bootstrap disposes the previous app before creating another. New loads an empty document into the same injected engine and applies the existing draft-clearing policy.

## One render owner

All application invalidations use `EditorApp.render`, the only canvas.innerHTML writer. Since 0E, high-frequency pointer moves schedule one animation-frame render; their mathematical state/resolver updates stay synchronous. Commands, keyboard input, commit and cancel clear a pending frame and render immediately. Disposal leaves no pending callback. Rendering uses the current model plus any staged endpoint patch to create a single view, then updates:

1. SVG geometry/labels and renderer-owned axes/grid/visibility;
2. selection highlight, endpoint handles and snap feedback from that view;
3. object list, inspector, active tool and drawing crosshair.

The endpoint line, label, handles and numeric inspector therefore share the same staged coordinates before commit. Selection is matched by data attribute equality, not by interpolating IDs into CSS selectors.

`EditorColor`, `AxisSettings`, `LabelOffsets`, `EditorOverlays`, `SnapFeedback` and the adaptive-grid utility are passive functions. They have no listeners, render wrappers or MutationObservers. The app owns their events and supplies their state explicitly. Ordinary pointer-up outside an active gesture does not rebuild sidebar controls before their click event.

SvgRenderer excludes hidden objects and draws origin when either visible axis crosses the viewport. Standalone render/export therefore agrees with document presentation without DOM hiding or an axis monkey-patch. SVG export excludes application selection/handles. Document version remains 2.

## Verification and remaining boundaries

The original 49 Node test cases and geometry SVG fixture are retained. Harness event transport uses PointerEvents and explicit bootstrap instead of the removed mouse/engine-tracker path. New lifecycle tests cover ownership, rollback, responsive label deltas/tool gating, disposal/re-init, standalone rendering and source ownership.

The complete Edge runner also covers restored startup, actual mouse capture/release outside canvas, three cancellation reasons across all five modes, lost capture, New/dispose across all five modes, repeated init/bootstrap, responsive and zoomed labels, staged endpoint consistency, hidden-object color/axis changes and downloaded SVG.

Each rendered frame still replaces the full SVG and panels. 0E adds frame coalescing and measured geometric candidate reuse; it does not introduce incremental rendering or spatial indexes. See PERFORMANCE.md for remaining cold/dense costs. Pointercancel and blur are dispatched in a real Edge document; this does not simulate operating-system focus changes or physical multi-touch hardware. Responsive window sizes and zoom are tested between gestures; resizing during a gesture is not a new supported interaction in this milestone.
