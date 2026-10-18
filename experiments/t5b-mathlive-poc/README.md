# T5b MathLive POC

An isolated browser experiment with two interchangeable keyboards operating the same MathLive field:

- **A — Standaard MathLive:** the built-in virtual keyboard and its standard layouts.
- **B — WIE-toetsenbord:** a compact dark-blue keypad that sends insert/edit commands to the same MathLive field through its supported API.

The CortexJS and WIE T5a result cards remain visible as technical references; keyboard A/B does not select or alter an evaluator. Variant B retains the isolated T5a adapter and compact result formatter. A separate temporary section tests editable MathLive formulas in ordinary text and labels CortexJS input, parsing and evaluation outcomes.

This experiment does not load from `editor.html`, write to the WIE document, touch editor selection/history, or implement either T5b host. Typed geometry sources, units, permissions, clipboard, and calculator-panel lifecycle are not implemented here.

Dependencies are isolated and pinned in this folder. MathLive and Compute Engine are MIT. A and B are not equivalent feature sets: A evaluates MathLive's accepted expression language while B intentionally inherits the narrower, typed T5a grammar and numeric semantics. In particular, MathLive ASCIIMath output is treated as untrusted input and still passes through the existing parser whitelist.

## Run

```sh
npm ci
npm run serve
```

Open `http://localhost:4178`. Use the radio choice above the shared formula field to switch keyboards without clearing the formula. The WIE keyboard provides numeric/operator keys, fractions, powers, roots, π, trigonometric functions and one-shot SHIFT inverse functions. The POC server is a small static Node server and serves only files inside this experiment directory. Set `PORT` to choose another local port when 4178 is already in use.

## Targeted checks

```sh
npm run test:poc
npm run test:poc1
```

The POC-1 checks cover Dutch decimal-comma configuration, exact/numeric/symbolic CortexJS outcomes, RAD/DEG, matrices and determinant, plus the temporary formula payload contract. The browser check exercises keyboard switching, formula retention, MathLive editing commands, formula insertion/edit/cancel, CortexJS examples, exclusive keyboard visibility and a small viewport. On a host with Playwright's Edge channel or bundled Chromium installed it writes comparison screenshots to `artifacts/`. It is not an Edge regression suite and does not prove WIE host lifecycle, source authorization, accessibility with assistive technology, or production readiness. See [`docs/T5B-MATHLIVE-POC-1-REPORT.md`](../../docs/T5B-MATHLIVE-POC-1-REPORT.md) for scope and architecture findings.
