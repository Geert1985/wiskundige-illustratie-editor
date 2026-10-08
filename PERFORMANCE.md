# Milestone 0E: measured changes and remaining limits

Measured on the user's Windows host on 2026-10-08, Node 22.18.0 and headless Microsoft Edge 154.0.4258.62, viewport 1280×900. Functional Edge tests use actual input/capture; the benchmark dispatches 20 primary-pointer moves in one JavaScript task to measure a burst deterministically. This is not a physical pointer latency or FPS benchmark.

`tests/fixtures/performance.cjs` creates 10/100/500 mixed points, segments and circles, deliberately dense in intersections. The 500-object fixture has 94,760 snap candidates. `tests/benchmark.cjs` measures cold resolve, median of 15 warm resolves and standalone SVG rendering in Node VM contexts. `tests/browser-performance.cjs` measures warm/cold resolution and synchronous pointer-burst work, and counts actual full renders before the next animation frame. The complete Edge suite invokes it with regression assertions.

## Before/after measurements

Before: validated 0D `297b4d7`. After: geometry cache and frame coalescing, same fixture/host. Timings vary with JIT, GC and host load; these are measured samples, not portable service-level guarantees.

| Objects | Edge warm snap median, before → after (ms) | Burst synchronous work, before → after (ms) | Renders per burst |
|---|---|---|---|
| 10 | 0.10 → below timer resolution | 113.6 → 3.3 | 20 → 1 |
| 100 | 2.80 → 0.80 | 395.9 → 7.7 | 20 → 1 |
| 500 | 42.50 → 8.10 | 2475.1 → 148.0 | 20 → 1 |

The burst work excludes the scheduled render and display latency. It measures removal of repeated DOM construction, not a claim that the complete interaction takes 148 ms or one frame. Node warm medians: 0.326 → 0.099 ms (10), 10.678 → 3.890 ms (100), 330.472 → 86.028 ms (500). Node VM costs differ substantially from the browser and should not be presented as browser latency.

Edge cold resolution at 500 remains approximately 67 ms (before 74.6 ms). That is still a long synchronous calculation. Standalone Node SVG output keeps identical byte lengths before/after (7,750 / 31,341 / 137,003); rendering itself is not made incremental.

## Implementation and compatibility

- A WeakMap has one cached geometry entry per model. The key records visible, non-excluded object IDs/types/coordinates/radii. The candidate list is rebuilt only when that geometry changes. Excluding a translated/dragged object permits reuse of the remaining geometry. Changing exclusions can replace the entry; the cache does not grow with all exclusion combinations.
- A geometry key was chosen in 0E because `get()` then exposed live mutation. The F16 follow-up makes get detached and the object view immutable. The key remains compatible with injected service-input views. Add/remove/update and imported model replacement cannot silently retain stale candidates. Style, label, metadata, viewport and grid changes do not alter static geometry; grid positions and screen distances are resolved afresh.
- Private cache arrays never receive grid candidates. Public candidate lists and result IDs are detached so callers cannot poison later resolutions.
- Resolution creates results only for candidates within screen tolerance, computes the input screen point once and retains the existing comparator/priority and constraint contracts.
- Pointer moves still compute the latest result synchronously. Only canvas/panel rendering is coalesced with requestAnimationFrame. Immediate commands clear the callback and render current state; fallback environments without RAF stay synchronous. This preserves last-pointer keyboard input, exact length/radius and preview/commit.

Regression gates are deterministic: one full render per single-task pointer burst, latest preview equals saved coordinates, immediate keyboard/commit remains exact, canceled frames do not resurrect state, cached results match a fresh model after every relevant mutation, and all previous Node/Edge behavior remains green. There is no newly invented fixed millisecond acceptance limit.

## Remaining risks / separate work

Cold intersections and invalidated geometry are still O(n²), cached storage can also be O(n²), and each resolve still scans candidates. One frame render still rebuilds full SVG and panels. A burst of 500 dense objects still does measurable synchronous work. No spatial index, worker, incremental DOM renderer or document object-count limit was introduced. Sustained frame-rate targets need an explicit target-device/illustration-size acceptance criterion before claiming general large-document responsiveness.

F16/F17 were not part of the measured F13 changes; their subsequent implementation is documented in MUTATION-SELECTION.md. Document version remains 2; object types and snapping/constraint semantics are unchanged.
