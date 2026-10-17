# M8-INT.3-A0.1 research prototype

Pure research-only code. It imports no production solver, writes no document
objects, and is not in the editor manifest. Inputs are resolved WIE circle or
ellipse geometry; for ellipses the caller should pass the exact resolved
`u`/`v` vectors returned by `EllipseGeometry.fromDefinition` or
`EllipseGeometry.resolve`.

Run the bounded NUM matrix and analytic cross-checks from the repository root:

```powershell
node research/m8-int-3-a0-1/run-matrix.cjs
node research/m8-int-3-a0-1/independent-oracles.cjs
node research/m8-int-3-a0-1/performance.cjs
```

`matrix-results.json` stores each fixture, the resolved frame used, certified
parameter/position boxes, multiplicities, operation counts, and fail-closed
statuses. The solver uses exact rational arithmetic for the supplied IEEE-754
values. Default research limits: 150,000 operations per matrix case, 16,384
bits per rational component, and 48 bisection bits (80 for NUM-015). NUM-012
and NUM-020 intentionally use smaller budgets.

No full `npm test`, browser regression, or Edge suite is needed or run for this
isolated spike.
