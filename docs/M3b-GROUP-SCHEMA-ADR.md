# M3b: persistent groups and document version 4

Date: 2026-10-09. Status: implemented for M3b, awaiting manual acceptance.

## Decision and scope

Groups are persistent document structure, separate from mathematical objects and their dependency graph. They do not change geometry, paint order, renderer ownership, object types, coordinate transforms, or object permissions. Temporary multiselection remains editor state. Layers, group transformations, policy inheritance and new geometry are outside M3b.

A document with persistent groups writes `version: 4`, `groupSchema: 1`, and a `groups` array:

```json
{
  "type": "geometry",
  "version": 4,
  "groupSchema": 1,
  "groups": [{ "id": "group-1", "name": "Groep", "members": ["a", "b"] }],
  "objects": [
    { "id": "a", "type": "point", "x": 0, "y": 0 },
    { "id": "b", "type": "point", "x": 1, "y": 0 }
  ]
}
```

Constructed objects still require `constructionSchema: 1`. Group-free documents continue to serialize as version 2, or version 3 when they contain constructions. There is no silent migration or fixture rewrite. Older editors cannot open version 4; export SVG when only presentation is needed. Removing all groups restores the applicable group-free version.

## Validation and ownership

`IllustrationModel` owns frozen group records. `PersistentGroups` implements validation, hierarchy lookup, leaf expansion, complete-root selection and pruning. `Engine.group(members, name)`, `ungroup(groupIds)` and `groupMembers(id)` expose this structure. Semantic commands are `group.create` and `group.ungroup`; the existing command boundary enforces mode restrictions. IDs share the object namespace and allocator.

Standalone script loaders must load `persistent-groups.js` after `model.js` and before constructing an Engine. The editor entry point and Node test loader include it explicitly. Existing SnapService and InteractionResolver contracts remain unchanged; descendant exclusion already prevents snapping to selected derived geometry.

Each record has exactly `id`, `name`, `members`. IDs are nonempty strings, names are strings, and members contain at least two unique existing object/group IDs. Object and group IDs cannot collide. Every object/subgroup has at most one parent. Dangling references, overlaps, duplicate IDs, cycles, additional fields and depth greater than 64 are rejected before state replacement. Traversal is iterative. Failed creation restores the allocator; failed load leaves objects, groups, renderer and metadata unchanged.

Legacy version 1–3 fields named `groups` or `groupSchema` remain opaque preserved extensions. Group creation refuses to overwrite them. There is no automatic interpretation of previously untyped extension data.

## Selection and interaction rules

- Clicking a member selects the leaves of its topmost group. Modifier clicks toggle the complete unit, following the existing click-selection behavior. Rectangle selection retains Ctrl/Meta precedence over Shift.
- Containment requires all leaves to meet the existing geometric containment resolver. Crossing requires any leaf to hit. Both require every member to be canvas-selectable; hidden/invalid members cannot be silently selected through the canvas. The author's object list can select such a group for inspection or structural operations.
- Group movement uses the existing single interaction controller, `CoordinateTransform`, `InteractionResolver.translateGroup` and central render path. A grouped label starts group movement. Individual endpoint/vertex handles are not shown for the group selection.
- One resolved translation is applied to all free roots through `object.translate`. Constructed members recompute from their sources. Movement requires every selected member to be valid, visible and unlocked, and every free source of selected derived geometry to be present. Otherwise the entire movement is refused. Internal distances and directions are preserved, including offsets and dependencies.
- Preview and commit use the same geometry. Escape, pointer cancellation, blur, capture loss, tool changes, New and dispose use the existing teardown. History records a completed drag once.
- Grouping packs complete selected top-level units. It cannot take a partial member out of an existing group. Groups can nest. Ungroup removes one selected top-level level and promotes children; child groups survive.
- Delete follows the existing dependency cascade, then prunes group membership. Groups with zero/one surviving direct member dissolve; the remaining member is promoted into the parent. Whole-group UI deletion retains existing lock gates.
- Duplicate copies every completely selected group and its hierarchy. Internal construction references whose sources are all copied are remapped to copies. Incomplete/external-source constructions retain the pre-existing detached-copy behavior. Ungrouped duplicates retain existing behavior.
- Ctrl/Meta+G groups; Ctrl/Meta+Shift+G ungroups. Editable inputs and active pointer operations do not trigger these shortcuts. Inspector buttons provide the same commands; top-level groups appear in the object list.

## Permission and trust contract

Group creation/ungrouping are author-only, including direct restricted-facade calls; they fail with `MODE_DENIED`. Group records are not authorization rules. Restricted projections expose only groups with readable member closure; a child may remain readable when its parent is not. Selection requires the entire private topmost group to be selectable, preventing partial selection through a filtered projection. Translation requires the complete private group membership and then the existing per-object/root grants. Missing members fail with `INCOMPLETE_GROUP`; locks and indirect-update rules retain their existing denial codes.

JSON export fails closed when group structure would reveal unread member IDs. SVG export remains governed by readable/displayable objects and contains no group or editor selection overlays. Authorized duplication may copy complete readable groups as part of the existing object-duplicate operation; it grants no rights on original members.

Groups are organizational units, not rigid mathematical constraints on arbitrary API edits. Independently authorized geometry/property edits and parameter updates retain their permission semantics. Rigid movement is guaranteed by `object.translate` and the editor interaction. Existing indirect dependency updates may change members independently of group membership; no permission is inherited from a container. Server authority remains M17.

## Acceptance gate

Existing Node/Edge regressions and golden fixtures must remain intact. New checks cover schema rejection and atomicity, nested hierarchy, ID allocation, legacy extensions, selection/modifiers, directional rectangles at multiple zooms, rigid movement, linked geometry, locks, cancellation, history, duplication/deletion, save/reload, JSON/SVG and restricted-mode closure. M3b stops after delivery and manual acceptance.
