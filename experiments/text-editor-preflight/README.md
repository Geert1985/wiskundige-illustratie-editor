# P0-tech — isolated text editor preflight

Version 0.1.0. Research prototype only. No production module imports this directory. It does not implement T1, real geometry bindings, permissions, document v6 or a calculator.

## Reproduce on Windows / installed Edge

```powershell
cd experiments/text-editor-preflight
npm.cmd ci --cache .npm-cache --no-audit --no-fund
node acquire-fonts.cjs
npm.cmd run build
npm.cmd test
npm.cmd run test:edge
node reproduce-path-defects.cjs
node summarize.cjs
```

The Edge test currently exits **1 because a candidate check really fails**: OpenType.js 2.0.0 emits non-finite SVG coordinates for part of this font corpus. See edge.json and path-defects.json. Do not suppress this test or reinterpret PNG creation as glyph completeness. The experiment's plain model tests pass; that is not a production security guarantee.

Fonts are vendored from pinned Adobe repository commits, with SHA256 and upstream OFL licenses in fonts/. acquire-fonts verifies the recorded hashes; it needs network only to reacquire assets. Runtime/browser tests permit only localhost/data/blob and block external asset requests. npm dependencies and cache are local to this directory; the root package/lock/runtime remain unchanged.

Dependency copyright/license texts are retained in THIRD-PARTY-NOTICES.md; font licenses remain separately alongside the fonts. Build/summary/diagnostic scripts anchor their working directory to this experiment to prevent writes into the production root.

Build outputs are ignored and reproducible; results/build.json records raw/gzip sizes, hashes and modules. Local dependencies use package-lock.json. Saved result files contain environment, individual test statuses, raw timings and screenshots. The 72 transform-matrix raster files under results/generated/ are ignored to keep the repository bounded; the runner regenerates them. Selected corpus/inline screenshots and representative self-contained SVGs are committed.

The first run and intermediate runs are retained as edge-initial.json, edge-before-escape.json, edge-before-standalone.json. They document original performance/candidate issues and corrected test synchronization/Escape routing. Final qualification uses edge.json, not the most favorable historic timing.

## Scope and limitations

- ProseMirror stores only a private draft. OK simulates one host action; Cancel simulates zero. That does not prove integration with the application's history or permission runtime.
- The own storage adapter intentionally canonicalizes paragraph/run IDs by position. It proves independence from ProseMirror JSON, not production identity/migration semantics. Atom payloads are fictitious and not production validators.
- Clipboard tests dispatch ClipboardEvent with DataTransfer in real Edge. They verify the browser/editor paste handlers; OS clipboard integration is not claimed.
- Canvas-mode fullscreen is a CSS overlay, as required for Escape retention; browser/OS fullscreen is not exercised.
- Real OS-IME composition and manual screenreader reading are **not executed**. Synthetic composition events cannot replace them. Headless accessibility-tree checks are partial evidence only.
- Native SVG versus canvas PNG can differ in text antialiasing. Pixel results report all pixels, ink-relative differences and a 3×3 boundary-exclusion heuristic. This heuristic is not a proof of perfect glyph equality and cannot overrule observed glyph loss.
- Paths use OpenType.js's default glyph shaping/kerning and toPathData(3). No alternative library, font subset, custom path serializer or shaping-engine fix is implemented. Failure applies to this tested pipeline, not all possible glyph-path renderers.
- Prototype caches are unbounded and single-context. Production needs quotas, lifecycle/revision/authorization invalidation. The existing project's security boundaries are not implemented here.

For manual inspection serve **this directory only** (for example `python -m http.server 8091 --bind 127.0.0.1`) and open index.html. Do not change production startup files to load this demo. Run the IME and screenreader checklists in the preflight report before technical acceptance.

Report: [TEXT-EDITOR-PREFLIGHT-REPORT.md](../../docs/TEXT-EDITOR-PREFLIGHT-REPORT.md).
