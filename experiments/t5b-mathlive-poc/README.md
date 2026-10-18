# T5b MathLive POC

An isolated browser experiment comparing two routes from the same MathLive field:

- **A — MathLive + Compute Engine:** MathLive's expanded LaTeX is parsed and numerically evaluated by `@cortex-js/compute-engine`.
- **B — MathLive input + WIE T5a:** MathLive's ASCIIMath output passes through a small adapter to the existing `ExpressionEngine` parser/evaluator.

This experiment does not load from `editor.html`, write to the WIE document, touch editor selection/history, or implement either T5b host. Typed geometry sources, units, permissions, clipboard, focus lifecycle and responsive floating-panel behavior are not implemented here. The purpose is to test the math-input/evaluation boundary and inspect the formats each engine receives.

Dependencies are isolated and pinned in this folder. MathLive and Compute Engine are MIT. A and B are not equivalent feature sets: A evaluates MathLive's accepted expression language while B intentionally inherits the narrower, typed T5a grammar and numeric semantics. In particular, MathLive ASCIIMath output is treated as untrusted input and still passes through the existing parser whitelist.

## Run

```sh
npm ci
npm run serve
```

Open `http://localhost:4178`. Choose the same sample in the shared field and compare both results and their displayed input representations. The POC server is a small static Node server and serves only files inside this experiment directory.

## Targeted checks

```sh
npm run test:poc
```

The browser check covers the shared MathLive field and four arithmetic/trigonometric examples only. It is not an Edge regression suite and does not prove WIE host lifecycle, source authorization, accessibility with assistive technology, or production readiness.
