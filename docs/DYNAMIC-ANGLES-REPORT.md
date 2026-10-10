# Dynamic angle measurements and angle units report

2026-10-10. Implementation 78d0259 on chatgpt/math-illustration-m5b. User explicitly authorized specification 1.5.0 section 10. Technical scope complete; manual acceptance pending. Main unchanged. See DYNAMIC-ANGLES-CONTRACT.md.

## Delivered behavior

Three linked measurement recipes in Meten's angle split menu: Hoek via punten, Hoek tussen richtingen, Hoek t.o.v. x-as. Fresh angle tool preference defaults to linked points; previous remembered choices and explicit Hoek (statisch)/Rechte hoek retained. All use existing source picking, hover, step instructions, graph, stable IDs, permissions and semantic replay; new recipes require constructionSchema 2. Labels follow moves and parent/source edits; computed vertices cannot be edited directly while linked. Source selection can include point objects, line endpoints, polygon vertices/edges and supported linear directions. No broader dynamic-length or dynamic-text implementation introduced.

Smallest angle 0..180 degrees or counterclockwise first-to-second directed angle 0..360 exclusive. Normalized atan2(det,dot). Explicit Cartesian document frame: point triples preserve their vertex; two directions use the supporting-line intersection regardless of finite domains, or first direction start when parallel/antiparallel; x-axis angles anchor at the chosen direction start and reference positive x. Stored endpoint order defines each direction even for straight lines. Zero and 180-degree angles valid; null directions/arms recoverably invalid. Out-of-range intersection geometry invalid with COORDINATE_LIMIT. Invalid results retain last valid cached geometry/settings/styles/identity, hide on canvas/export and show niet beschikbaar in inspector; recovery restores them. Source deletion uses existing cascade; detach first to keep a static measurement.

Document default at Assenstelsel > Hoekeenheid: degrees/radians and precision 0..10. New author documents default deg/2; old absent-metadata documents preserve degree formatting and existing measurement precision. Optional meta.angleMeasurement schema 1, author-only document.setAngleMeasurement with atomic import/history/replay/export. Per-angle angleSettings schema 1 independently override mode, unit, precision (blank = document) and arc visibility. Units/precision do not mutate geometry, graph or manual styles/label offsets. Physical scale never multiplies an angle; rad = deg*pi/180. Explicit settings use fixed decimals/comma; free maattekst untouched. Degree labels rounded to 360 in directed mode wrap to zero.

Directed reflex arc uses matching large-arc/sweep flags and label on the measured sector. Linked measurements display arc/label without duplicated full arms; arc radius is 28 renderer pixels, independent of zoom. Zero angles suppress collapsed arcs. showArc independent of label and existing label-only setting. Label drag offsets and style overrides remain preserved. Point/angle selection in fullscreen opens the inspector; Escape closes it while retaining canvas fullscreen. Expanded angle split spans the sidebar grid for complete tool names.

Restricted profiles require allowedTools/sourceTools for construction and explicit angleSettings propertyFields grant for changes. Document default changes denied by mode ceiling, with read-only UI. Document metadata/settings preserved in permitted exports; hidden/invalid geometry and source read closure remain governed by existing policy. No privilege or direct computed geometry grant added.

## Evidence

PASS: full 346/346 Node tests, 42 full Edge modules, zero page errors; git diff --check clean. Eight new Node tests first established missing linked recipes, then covered directed/radian calculations, parallel/antiparallel/null cases, metadata overrides, geometry invariance, legacy/free text, schema/roundtrip, replay, source rebinding, cycles, bounds, recovery, style/offset identity, locks, cascade/detach, restricted gates/denials/export, correct reflex arc and no duplicate arms.

Real Edge module covers source clicks for all three modes, 270-degree sector, radians/document defaults/overrides, one-step undo/redo, parent pointer drag, invalidity and recovery, geometry read-only inspector, locks, fullscreen, storage/reload, XML-valid SVG and actual SVG-to-PNG rasterization. Full preceding construction, units/projection, history, permissions, responsive and interaction regressions pass. Visual review at 1446x884 completed; final focused UI rerun also passes.

Task outputs: dynamic-angles-node.txt, dynamic-angles-edge.json and dynamic-angles.png. No new standalone PNG-export button; the existing SVG output is rasterizable to PNG and was tested that way.

## Manual acceptance

1. Refresh the editor; create existing points A=(2,0), V=(0,0), B=(0,-2). Under Meten choose Hoek via punten, then A, V, B. Expect 90,00 degrees.
2. In Hoekmeting choose Gericht: expect 270,00 degrees, counterclockwise from VA to VB. Choose radians, precision 3: 4,712 rad. Toggle Hoekboog tonen; label remains.
3. Move B to (0,2): expect 90 degrees or 1,571 rad. Undo/redo; move A onto V to invalidate, then undo to recover the same measurement.
4. Set Hoekeenheid to Documentstandaard and clear Hoekdecimalen. At Assenstelsel > Hoekeenheid choose radians/default precision 4; expect 4,7124 rad for 270 degrees. Geometry stays unchanged. Check independent overrides.
5. Test Hoek tussen richtingen and Hoek t.o.v. x-as with a line/vector; endpoint order matters. Parallel = 0, opposite = 180, zero vector temporarily unavailable. Lock, save/reload, fullscreen and SVG export.

## Retained scope and limits

Multiple/skew frames remain future work; no silent frame reinterpretation. Existing bisectors retain their geometric arm-based semantics; measurement mode changes do not rewrite other construction recipes. Near-parallel supporting-line intersections may be outside viewport or coordinate bounds, following the explicit vertex policy. Broad dynamic lengths/perimeters/areas and dynamic text remain separate future checkpoints. User-owned FEATURE-GAP-ANALYSIS.md untouched.
