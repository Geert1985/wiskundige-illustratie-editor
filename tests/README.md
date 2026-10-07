# Editor regression tests

Run from the repository root with Node.js 20 or later:

```sh
node --test math-illustration/tests/*.test.cjs
```

No npm install is required for the 17 default tests. They execute the actual browser scripts in isolated Node VM contexts. The wheel/pan integration harness supplies a minimal DOM and invokes the real editor handlers; it is not a replacement for browser layout/event testing.

The seven baseline tests passed before any production changes. `fixtures/geometry.json` includes all four supported types, styles, explicit mathematical label offsets, text rotation and escaped text. `fixtures/geometry.svg` was generated from the original branch at commit `40c2ad9ea73cfa292f4be707aba10613b230e48c` before the F01/F02 fixes and is compared byte-for-byte. Do not regenerate it to make a failing test pass. The baseline deliberately does not assert known broken behavior such as null-label migration or automatic snapping preserving exact lengths.

Safety tests cover zoom crossing the maximum, blocking further zoom-in while allowing zoom-out, cursor anchoring, aspect ratio, invalid bounds/steps, pan rollback, extreme zoom-out, safe decimal ticks and tick budgets. Adversarial dense/stalled-loop cases run in a subprocess with a 3-second timeout so a regression cannot freeze the test runner indefinitely.

## Numerical safety contract (F01/F02)

- The adaptive grid retains its 1-2-5 ladder and minimum step 0.1. Zoom-in is clamped to renderer scale 700, including the last wheel step. Roundoff tolerance is 1e-12 at ladder boundaries.
- Bounds must contain finite numeric coordinates within ±1e12. Both spans must be between 1e-6 and 1e12. These limits are safety guards, not additional document-model validation.
- Drawable width and resulting scale/height must be positive and finite; padding must be finite and nonnegative. Raster steps must be positive and finite.
- There are at most 1000 tick positions per axis per grid/axis layer. Tick indices must be safe integers. Tick generation uses a bounded index count, never repeated floating-point addition.
- An unsupported dense step raises RangeError rather than silently choosing a different grid (which would disagree with snapping). Ordinary editor zoom uses the adaptive step and stays below this budget.
- `renderer.setBounds` validates before committing and preserves the previous bounds on failure. Editor zoom/pan display the existing status message mechanism when rejected. Direct renderer mutations are checked again on rendering.

## Optional real-browser smoke test

With Playwright resolvable by Node and Microsoft Edge installed:

```sh
node math-illustration/tests/browser.cjs
```

The test starts a temporary loopback HTTP server, loads the full editor with all existing feature layers, sends a real wheel input plus repeated DOM wheel events, verifies the 0.1/700 boundary and zoom-out safety, then resets the view and creates a point. It collects page errors and closes the browser/server. It does not change user browser profiles or repository files. External Google Fonts are blocked to keep the smoke test independent of font downloads.

This scope does not fix F03–F17 or comprehensively test all interactions. In particular, the snapping wrappers, labels, storage policy and feature-layer architecture remain unchanged.
