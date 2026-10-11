# Circle point distribution — implementation report

**Branch:** `chatgpt/editor-development`
**Contract:** `docs/CIRCLE-POINT-DISTRIBUTION-ARCHITECTURE-PROPOSAL.md` (conditional phase-B approval)
**Status:** Implemented; automated Node suite passes. Browser acceptance remains unverified because the Edge runner failed during browser startup.

## Final architecture

The document now has a top-level `circleDistributions` register under document version 6 and `circleDistributionSchema: 1`. Each record owns the source circle, count, canonical radian start angle, and ordered point IDs. Distribution members remain normal, usable point objects with a dedicated linked construction recipe storing the distribution ID and zero-based index. `RegularGeometry.pointsOnCircle` is a pure geometry function; the construction resolver caches one computed point array per distribution during each resolution pass.

Existing `pointOnCircle` objects are converted only after an explicit user action. The first member reuses the original point ID and keeps style, label, and dependent construction references. Its prior loop parameter `p` becomes `2πp`; the index-zero calculation uses the same floating-point expression as the prior recipe. Reducing a distribution to one point retains the register.

The inspector exposes a 1–24 count slider and start angle in degrees. Slider/angle input previews through temporary model state and redraws the canvas only. Confirming restores the baseline and executes one command, recording one undo step; cancellation restores the baseline and allocator. Any selected member displays the same central settings.

## Lifecycle and permissions

- Count increase preserves the prefix IDs and allocates only new tail IDs. Count decrease removes only tail members and is rejected before mutation when a removed point is a source of another construction.
- Individual member deletion and detach are blocked. Full distribution deletion is one command; the inspector names downstream objects and asks before cascading. Deleting the source circle follows normal dependency-cascade removal and clears its registry entry.
- Full distribution duplication creates a new distribution and point IDs. It shares the circle unless the circle is included in the selected duplication, in which case it uses the copied circle. Partial distribution duplication is blocked.
- Restricted sessions cannot mutate the registry. Rendering hides all members if the circle or any member lacks display access. JSON export fails closed unless the full set is readable/displayable; SVG rendering similarly suppresses inaccessible members.

## Schema compatibility

| Version | Existing meaning | Distribution behavior |
|---|---|---|
| v1 | legacy names/labels | Loads unchanged; no implicit conversion |
| v2 | base geometry | Loads unchanged |
| v3 | linked constructions | Loads unchanged |
| v4 | groups (`groupSchema: 1`) | Loads unchanged |
| v5 | layers (`layerSchema: 1`) | Loads unchanged |
| v6 | distributions (`circleDistributionSchema: 1`) | Strict bidirectional point/register validation; groups and layers are retained when present |

v6 rejects missing/empty registries, duplicate or colliding IDs, invalid source circles, counts, angles, point IDs, point indices, mismatched recipes, and orphaned distribution points. Loading is staged, so rejected input leaves the existing engine intact.

## Changed files

`regular-geometry.js`, `construction-service.js`, `model.js`, `index.js`, `permission-runtime.js`, `semantic-sequence.js`, `editor.js`, `editor.html`, `editor-tool-instructions.js`, `DOCUMENT-FORMAT.md`, the architecture proposal, `tests/architecture.test.cjs`, `tests/helpers.cjs`, and `tests/circle-point-distribution.test.cjs`.

## Verification

`npm test`: **385 passed, 0 failed**. This includes ten new distribution-focused Node tests for pure geometry and counts above 24, conversion and identity, downstream references and dynamic recomputation, atomic count-reduction refusal, delete/detach/duplicate policy, v1–v6 import behavior, v6 layers/groups, JSON roundtrip, semantic replay, history undo/redo, and restricted exports/commands.

`npm run test:edge`: **not executed to completion**. Playwright launched the installed Edge process, which closed during startup before tests could run (`browserType.launch: Target page, context or browser has been closed`; Windows crashpad/Edge profile startup errors followed). This is an environment/runner limitation, not a passing browser test. Manual browser checks for slider drag preview, Escape cancellation, delete confirmation, save/reload, and export are **not performed**.

`git diff --check`: no whitespace errors after cleanup.

## Complexity audit and limitations

The implementation adds one internal recipe kind and one cached geometry path. The model has one strict v6 registry-validation branch and generalizes layer validation/export gates to include v6; no parallel geometry-object type or hierarchy was added. Geometry math and persistence remain separated. Existing construction dependency traversal is reused, as are command authorization, document history, and import/export.

The current UI is intentionally capped at 24 even though the pure function allows up to 100000. Selection of all points is required to delete a distribution; there is no separate “delete distribution” control. The Edge interaction test remains the main unverified behavior. A future cleanup could generalize batch-derived object ownership if multiple regular-geometry features are added; no refactor is needed for this feature alone. No regular polygon or star constructor is included.

## Open acceptance risk

The Node evidence supports the model, command, identity, permission, and replay contracts, but it does not prove the real browser interaction sequence. Do not treat phase B as fully user-accepted until the browser preview/cancel/confirm and save/reload flows have been exercised in a working Edge session.
