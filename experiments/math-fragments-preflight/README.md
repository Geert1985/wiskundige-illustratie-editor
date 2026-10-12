# T2 math-fragment probe

Pinned comparison: MathJax 3.2.2 SVG paths versus KaTeX 0.19.0 HTML.

```sh
cd experiments/math-fragments-preflight
npm ci --ignore-scripts
npm run probe
npm audit
cd ../text-editor-preflight
npm ci --ignore-scripts
cd ../..
npm run build:text
npm test
npm run test:edge
```

`results.json` contains local comparison timings and dimensions. `build-results.json` records runtime bundle sizes/hashes/inputs. `verification.json` contains the final T2 Node/Edge results; `t2-fullscreen.png` is a screenshot taken during the fullscreen child-panel test. `audit-results.json` records the dependency audit.

The probe's intermediate `probe-bundle.mjs` and all node_modules are ignored. Production loads the generated local `math-renderer.bundle.js` only when needed. KaTeX is not included in that bundle. MathJax license: `../../licenses/MathJax-Apache-2.0.txt`; KaTeX comparison license: `KaTeX-MIT.txt`. Existing editor/font licenses remain in `../text-editor-preflight/THIRD-PARTY-NOTICES.md` and `../text-editor-preflight/fonts/`.

See `../../docs/T2-REPORT.md` and architecture section 20 for the source whitelist, quotas, synchronous export readiness, capability categories and remaining manual checks. Math is presentation notation, not the future T5 evaluator.
