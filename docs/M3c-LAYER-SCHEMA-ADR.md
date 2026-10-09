# M3c: named presentation layers

Date: 2026-10-09. Scope: named layers, ordering, visibility, list integration, migration and history. No M4, mathematical transformations, new primitives or permission-policy migration.

## Schema and compatibility

Layers introduce explicit document semantics, so documents with layers use `version: 5`, `layerSchema: 1`, and `layers: [{id, name, visible, members}]`. Array order is back to front; member array order is back to front inside a layer. Members reference object IDs, never group IDs. Objects remain stored in their original geometry array. Every object belongs to exactly one layer, including hidden/invalid/locked/constructed objects. Empty layers are allowed; the layer array is nonempty. Names are nonblank strings, maximum 200 characters. IDs are unique across objects, groups and layers. Closed records reject unknown fields, nonboolean visibility, missing/duplicate/dangling references and split groups atomically.

Nested groups retain their version-4 schema and must have all leaves on one layer. Constructions retain `constructionSchema: 1`; dependencies may cross layers because layer visibility is presentation rather than geometry. Versions 1–4 keep their original serialization when layers are absent. No automatic layer creation on load. Legacy opaque `layers/layerSchema` extensions are preserved and cannot be overwritten by creating layers. Standalone loaders include `document-layers.js` after model/groups and before Engine initialization. Older builds reject v5; SVG remains interoperable.

## Operations and UX

The first create makes a Basislaag containing all existing objects in their existing paint order, plus the requested empty foreground layer. New objects/constructions are placed on the topmost visible layer; when all layers are hidden, creation is refused without changing document/allocator. There is no separate active-layer state in M3c. Duplicates retain the original layer and copied group hierarchy; locks keep their existing copy behavior.

The object list shows layers front to back, with editable names, eye buttons, forward/back arrows and delete. Inspector selection assignment moves complete groups together. Independent selected objects may come from multiple layers. Assignment to the existing layer is a no-op; a move appends to the target in existing paint order. Group creation across layers is refused; move the selected objects to the same layer first.

Deletion removes only the container and transfers its objects to the adjacent layer below, or above when deleting the bottom layer. Relative paint order is retained across that merge. The recipient's visibility applies, while every object's own visibility, geometry, style, locks and construction references remain unchanged. The last layer cannot be deleted. New/reset clears layer structure. All document operations use the existing command/history boundary and cancel active interactions before applying.

Effective display is object visibility AND layer visibility AND valid geometry. Hidden sources still recompute visible derived objects on other layers. Hiding/showing layers never changes object visibility. Canvas hit-testing, snapping, source picking, rectangle selection, hover, handles and SVG export use this effective display. The author's object list can still inspect hidden objects. Selection can remain for inspection while handles/movement are unavailable. Layer visibility changes invalidate cached movement/hover eligibility without a geometry mutation.

## Architecture and permissions

`DocumentLayers` owns pure validation, lookup and paint ordering. `IllustrationModel` owns frozen layer records and atomic mutations. Engine provides `createLayer`, `assignLayer`, `renameLayer`, `setLayerVisibility`, `reorderLayers`, `removeLayer`, `isDisplayed`, and the layer-aware snap filter. Renderer consumes the same order/visibility for standalone SVG and editor render. One pointercontroller, CoordinateTransform, SnapService, InteractionResolver and central render path remain.

Semantic commands are `layer.create`, `layer.assign`, `layer.rename`, `layer.setVisibility`, `layer.reorder`, `layer.delete`. These are author-only, including direct restricted-facade calls: `MODE_DENIED`. Layer assignment/order are presentation operations, not geometry/lock overrides. Locks continue to restrict geometry/deletion. No capability is inherited from a layer or group.

Restricted projections expose readable object membership only; completely unread nonempty layers are omitted. Layer presentation for readable members is visible in the readonly list. Hidden layers cannot be displayed, selected, snapped or manipulated through ordinary direct object commands. Explicit author-configured parameter bindings retain their existing authorization, including bindings on hidden sources; indirect recomputation still follows the existing policy. JSON export fails closed if original layer membership would reveal unread IDs. SVG includes only readable, effectively displayed objects. Existing document policy and server-authority boundary (M17) are unchanged.

## Acceptance

Keep all 238 Node tests, the full real Edge suite and golden fixtures. Test schema rejection/allocator atomicity, legacy documents/extensions, nested groups/locks/dependencies, create/rename/order/assignment/delete, stable paint-hit-export order, hidden snapping/source/hover/handles, effective visibility, preview/cancel/history, save/reload/import/export and negative restricted commands. Stop after M3c and await manual acceptance.
