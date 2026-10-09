# M1 — Rechthoekselectie: PASS

Datum: 9 oktober 2026. Uitsluitend M1 uitgevoerd; M2 is niet gestart.

## Uitgangspunt en commits

Branch: `chatgpt/math-illustration-stabilization`, repository `Geert1985/from-zero-2-infinity`. Na fetch fast-forward naar actuele remote HEAD `3cd56e31a84ac02c9f85ccae639b2c09c06bc7cc`. Geen bestaande tracked wijzigingen. Het vooraf aanwezige, untracked `docs/FEATURE-GAP-ANALYSIS.md` is behouden en niet meegenomen in de M1-commits.

| Commit | Inhoud |
|---|---|
| `ae5860d57910e78358cf6a044355ac20109f5754` | Wiskundige/UX-regels en eerste 17 Node-regressietests |
| `72d8e9305898936370e33a471a3eb1745d675dea` | Pure resolver, bestaande controller, injectie, overlay en toetsenbordroute |
| `541214267c5b240280c30c1af44fd57c56d9d656` | Edge-proeven, extra contextmenu-regressietest en zichtbare toetsenbordcursor |

Dit rapport en een verduidelijking van de tekstbegrenzing worden in een afzonderlijke documentatiecommit vastgelegd; de uiteindelijke push-HEAD wordt bij oplevering vermeld.

## Architectuur en gedrag

`RectangleSelection` is een pure service met `hits`, `resolve`, `operation` en `combine`. Zij krijgt objecten, viewport, CoordinateTransform, originele selectie en gerenderde tekstbegrenzingen expliciet aangeleverd. Zij muteert geen engine/document en registreert geen events. Bootstrap injecteert de service.

De bestaande EditorApp bezit één nieuwe `marquee`-state met pointerId/capture, oorspronkelijke selectie, bevroren modifierpolicy, transform en resolverresultaat. Geen tweede pointercontroller. Preview en commit gebruiken hetzelfde resultaat; pointer-up verwerkt ook de laatste coördinaat buiten het canvas. Pointercancel, captureverlies, blur, Escape, Nieuw en dispose gebruiken de bestaande cancel/teardown. Annuleren herstelt de oorspronkelijke selectie. Selectie schrijft geen geometrie en maakt geen undo-stap.

Links→rechts omsluit; rechts→links raakt. Geen modifier vervangt; Shift voegt toe; Ctrl/Meta wisselt. Ctrl/Meta heeft voorrang op Shift. Iedere preview rekent vanaf de originele selectie. Verborgen en geometrisch ongeldige objecten worden uitgesloten. Locks verhinderen selectie niet, maar blijven bewerken blokkeren.

Geometrische tests gebruiken inclusieve grenzen, echte segmenten, polygonen en cirkelgebieden; geen algemene bounding-boxselectie. Rechten/halfrechten worden op de zichtbare viewport geknipt. Hoekbogen hebben analytische grenssnijpunten en extrema; rechtehoekmarkeringen gebruiken hun segmenten. Tekst gebruikt een geroteerde getBBox-vierhoek. Label-only maatobjecten worden via hun zichtbare meetlabel geselecteerd. Decoratieve namen, lijndikte, pointmarkers, pijlpunten en maatstreepjes vergroten de mathematische selectiegeometrie niet. Deze regels staan volledig in `M1-RECTANGLE-SELECTION.md`.

K of Kaderselectie start het toetsenbordalternatief. Pijlen: 10 CSS-pixels; Alt+pijl: 1. Enter zet het beginpunt en daarna het einde vast. C wisselt omsluiten/raken. Een kruisje toont de cursor, statusmeldingen beschrijven bediening/fase. Escape annuleert. Dezelfde resolver wordt gebruikt; invoervelden worden ontzien.

De kaderoverlay loopt door het bestaande centrale renderpad. Dezelfde actuele selectedIds voeden highlights, lijst en inspector. Bronsearch en bestaande architectuurtests bevestigen één pointerdown-eigenaar en één canvas.innerHTML-renderpad. SnapService/InteractionResolver en het documentformaat zijn ongewijzigd. Geen nieuwe mathematische objecttypen, transforms of golden fixtures.

## Gewijzigde bestanden

- `docs/M1-RECTANGLE-SELECTION.md`: regels vóór implementatie.
- `docs/M1-REPORT.md`: deze oplevering.
- `rectangle-selection.js`: pure geometrie/modifierresolver.
- `editor-bootstrap.js`: expliciete service-injectie.
- `editor.js`: marquee binnen bestaande lifecycle, tekstbegrenzingen, centrale overlay, keyboard en contextmenu.
- `editor.html`: keyboardknop, bediening, live status en consistente assetversie.
- `tests/rectangle-selection.test.cjs`: 11 pure geometrie-/modifiertests.
- `tests/lifecycle.test.cjs`: 7 aanvullende controller/lifecycle-tests.
- `tests/helpers.cjs`: service laden in het Node-testharnas.
- `tests/browser-rectangle-selection.cjs`: echte Edge-proeven.
- `tests/browser.cjs`: nieuwe browsermodule in de volledige suite.

## Tests-first en volledige resultaten

| Verificatie | Resultaat |
|---|---|
| Node-baseline op remote HEAD | 133/133 PASS |
| Volledige bestaande Edge-baseline | PASS; pageErrors=[] |
| Eerste negen nieuwe geometrietests vóór implementatie | 0 PASS, 9 FAIL: ontbrekende resolver |
| Twee aanvullende hoekboogtests vóór reparatie | 9 PASS, 2 FAIL in geometriesuite |
| Geïsoleerde archive van testcommit ae5860d, zonder productie-implementatie | 133 bestaande PASS, alle 17 nieuwe FAIL |
| Extra terug-naar-start/contextmenu-test vóór reparatie | lifecycle: 41 PASS, 1 FAIL |
| Definitieve volledige Node-suite | **151/151 PASS**, 0 FAIL/SKIP/CANCEL |
| Definitieve volledige echte Edge-suite op codecommit 5412142 | **PASS**, pageErrors=[] |
| git diff --check | PASS |
| Golden fixtures ten opzichte van remote uitgangspunt | Geen wijzigingen |

Nieuwe Node-tests omvatten grenspunten, segmenten zonder bounding-boxfalsepositives, cirkelhoeken/tangentie/interior, concave polygonen, straight/ray-domeinen, visibility/invalidity/locks, deterministische gecombineerde modifiers, affine schermtransforms, geroteerde tekstbegrenzingen, boog/rechtehoekmarkeringen, 180°-extrema, selection/list/history-sync, laatste pointer-up zonder move, add/toggle-preview, alle cancelroutes, contextmenu/toolgate, keyboard/invoervelden en terugkeer naar start na een echte drag.

De volledige Edge-suite behoudt startup/zoom/bounds, creation, legacy import, save→reload, labelroundtrip, presentation restore, export/import, atomic failed import, draft/New, snapping/exacte lengte en radius, lifecycle, performance, selecteren bij 500 objecten, eerdere auditproeven, linear objects, cachecompatibiliteit, history, inputs, polygonen, styles, measurements/groups, constructies en area/toolmenu. De bestaande performancechecks slagen eveneens.

Nieuwe Edge-proeven controleren containment versus crossing, lijnen/cirkels/polygonen/rechten/halfrechten/punten, verborgen en locked objecten, Shift/Ctrl/Meta plus gecombineerde modifiers, behoud van lockbeperkingen, geroteerde tekst, label-only metingen, verschillende schermbreedtes en mathematische bounds/zoomschalen, pointercancel/Escape/blur/captureverlies/Nieuw/dispose→init, gewoon versus gesleept contextmenu, echte mouse-up buiten het canvas, keyboardcursor/C/fijne stappen/cancel en synchrone highlights/lijst/inspector. Er zijn geen browserfouten.

Reproduceerbaar: `node --test math-illustration/tests/*.test.cjs`; voor Edge: `node math-illustration/tests/browser.cjs` met Playwright via de bestaande NODE_PATH en geïnstalleerde msedge. Bij oplevering zijn de volledige Node-log en Edge-JSON naast het rapport beschikbaar.

## Resterende grenzen

- Tekstselectie gebruikt de werkelijke SVG-tekstbegrenzing, niet afzonderlijke lettercontouren; fontmetrics kunnen per systeem verschillen.
- Omsluiten van rechten/halfrechten betekent omsluiten van de zichtbare viewportgeometrie; het betekent niet een oneindige mathematische rechte omsluiten.
- Echte browserverificatie is uitgevoerd in geïnstalleerde Windows Edge, headless. Andere browsers/platforms zijn niet geclaimd.
- M1 introduceert geen permanente groepen, transformaties, lagen of permissionmodel. Bestaande documentversies en locks blijven behouden.

**Oordeel: M1 PASS. Stop na M1; geen M2 zonder nieuwe goedkeuring.**
