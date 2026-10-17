# WIE-TOOL-L3.1 — Migratie vrije tekengereedschappen

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l3-1-free-tools`.
Basis: actuele `origin/main`, `dcb631ec3614e0456e7b23e267cba14e333faa13` (L1 en L2 gemerged).

## Resultaat

Alle tien gereedschappen in scope gebruiken bij succesvolle creatie de bestaande `completeToolInteraction()`. Hun `repeat`-policy blijft ongewijzigd: de tijdelijke interactie wordt beëindigd, pointercapture/preview/feedback worden opgeruimd, het nieuwe object blijft geselecteerd en hetzelfde gereedschap blijft actief. De bestaande lijnroute uit L2 blijft werken. Tekst en gekoppelde constructies zijn niet aangepast.

## Migratiestatus per gereedschap

| Gereedschap | Bestaande creatieroute en commandogrens | Migratie en completion | Selectie en invoergedrag | Gerichte dekking |
|---|---|---|---|---|
| Punt | `pointerDown()` → `snap()` → `changeDocument()` → `object.create` | Gemigreerd; afrondt na succesvolle documentactie | Nieuw punt geselecteerd; punttool blijft actief | Twee opeenvolgende punten; geweigerd `object.create`; retry en undo/redo |
| Rechte | `draw`-interactie → `resolveDraw()` → `create:straight` / `object.create` | Gemigreerd in gedeelde draw-commit | Nieuw object geselecteerd; herhaalbare draw-preview | Tweemaal tekenen; fout, retry, preview/capture, undo/redo |
| Halfrechte | `draw`-interactie → `resolveDraw()` → `linear.draw` | Gemigreerd in gedeelde draw-commit | Nieuw object geselecteerd; halfrechtegeometrie blijft bij bestaande resolver | Tweemaal tekenen; gedeelde draw-route en lijnregressie |
| Vector | `draw`-interactie → `resolveDraw()` → `create:vector` / `object.create` | Gemigreerd in gedeelde draw-commit | Nieuw object geselecteerd; vectorgeometrie blijft bij bestaande resolver | Tweemaal tekenen; undo/redo |
| Cirkel | `draw`-interactie → `resolveDraw()` → `create:circle` / `object.create` | Gemigreerd in gedeelde draw-commit | Nieuw object geselecteerd; straal en bestaande previewsemantiek blijven behouden | Tweemaal tekenen; preview/capture en undo/redo |
| Driehoek | `polygonClick()` verzamelt drie vertices; `finishPolygon()` valideert en voert `create:triangle` / `object.create` uit | Gemigreerd; completion pas na drie punten, geometrievalidatie en geslaagde command | Driehoek blijft als polygonmodel; nieuwe polygon geselecteerd; tool blijft actief. Geometriefout laat vertices herstelbaar | Succesvolle driepuntinvoer; ongeldige collineaire invoer en herstel; commandweigering op gedeeld polygonpad |
| Veelhoek | `polygonClick()` verzamelt vertices; expliciete Enter/klik-sluiting roept `finishPolygon()` aan; `object.create` | Gemigreerd; tussenpunten completeren niet; completion na definitieve validatie/commit | Vertices blijven bij commandfout behouden; tool blijft actief | Enter-afsluiting; commandweigering, capture-release, retry, undo/redo |
| Hoek | `polygonClick()` verzamelt arm–hoekpunt–arm; `finishPolygon()` gebruikt `MeasurementGeometry.validateAngle`; `object.create` | Gemigreerd; completion op het derde geldige punt na hoekvalidatie | Hoekmodel/markering en selectie blijven hetzelfde; tool blijft actief | Drie invoerpunten; completion en cleanup |
| Rechte hoek | Dezelfde hoekroute; validator vereist de bestaande 90°-voorwaarde | Gemigreerd; geen completion vóór drie punten en succesvolle validatie/commit | `rightPoint()` en `right`-markering blijven ongewijzigd; tool blijft actief | Driepuntsconstructie, bestaande geometrische voorwaarden, cleanup |
| Lengtemaat | `draw`-interactie → `resolveDraw()` → `create:dimension` / `object.create` | Gemigreerd in gedeelde draw-commit | Dimension-type en bestaande meetlabelinstellingen blijven behouden; nieuwe maat geselecteerd; tool blijft actief | Twee maten; zichtbare standaardlengtemeting en berekende lengte; undo/redo |
| Lijnstuk (L2-regressie) | `draw`-interactie → `linear.draw` | Al gemigreerd in L2; route opgenomen in de gedeelde draw-commit zonder commandwijziging | Repeat-policy en selectie van nieuw lijnstuk behouden | L2-tests blijven slagen, inclusief tweemaal lijnstuk en commandweigering |

## Architectuur en foutgedrag

De creatiepaden komen na de bestaande geometrie- en invoerstappen samen bij twee grenzen. Punt gebruikt zijn bestaande documentactie. Lijnstuk en halfrechte blijven `linear.draw` gebruiken; rechte, vector, cirkel en Lengtemaat behouden `object.create`. Driehoek, veelhoek en beide hoekgereedschappen gebruiken `finishPolygon()`, dat eerst de bestaande geometrische validator aanroept. Er is geen tweede dispatcher of historymechanisme toegevoegd.

Voor draw-tools levert `changeDocument()` het commandresultaat en de historygrens. De route roept daarna de centrale completion aan; bij fout weigert de controller de lifecycle-afronding en blijft de geselecteerde tool beschikbaar voor een nieuwe gesture. `finishPolygon()` gebruikt `changeDocument(..., {cancelInteraction:false})` zodat een geweigerd objectcreate de opgeslagen vertices niet wist. Bij die commandfout wordt pointercapture vrijgegeven, maar de polygooninteractie blijft herstelbaar. Een ongeldige driehoek/hoek wordt vóór `changeDocument()` door de geometrische validator afgewezen: er is dan geen command, completion of history-entry. Daarmee blijft invoervalidatie herkenbaar verschillend van commandweigering.

Een geslaagde creatie is één history-entry. Undo verwijdert alleen het nieuwe object; redo herstelt dezelfde documenttoestand. De geselecteerde object-ID wordt expliciet aan `completeToolInteraction()` gegeven, zodat selectie ook bij de meervoudige polygon-/hoekroute gelijkloopt met het nieuwe object.

## Niet gemigreerd

- Tekst blijft buiten L3.1 vanwege de rijke tekstdialoog, invoerbehoud en afzonderlijke commitfouten.
- Alle `construct:*`-routes blijven zoals in L2/L1; deze fase heeft hun lifecyclebeleid niet gewijzigd.
- Snijpunt en objectafhankelijke contextacties blijven op hun bestaande gespecialiseerde routes.
- Ellips, Parallellogram, Punt op object en andere meerstapsconstructies zijn niet gewijzigd.

## Verificatie

Gerichte commandoregel:

```powershell
node --test --test-reporter=spec --test-name-pattern='WIE-TOOL-L3.1|WIE-TOOL-L2|WIE-TOOL-L1.*(intersection|generic)|triangle and multi-click polygon|unfinished polygons|Escape rolls back object' tests/lifecycle.test.cjs
```

**16/16 geselecteerde tests PASS.** Daarvan zijn vier nieuwe L3.1-tests. De overige tests dekken bestaand L1/L2-gedrag, Snijpunt/context, driehoek-/polygoonafsluiting, annulering en polygonrollback.

Aanvullend uitgevoerd:

```powershell
node --check editor.js
node --check tests/lifecycle.test.cjs
git diff --check
```

Alle drie controles slagen. Geen volledige Node-suite, browserregressiesuite, Edge-run of brede performancetest uitgevoerd, conform opdracht. De lifecycleproeven gebruiken de bestaande gesimuleerde DOM-fixture; echte browser-eventvolgorde/focus is dus niet opnieuw bewezen.

## Beoordeling

**GO voor technische L3.1-migratie.** Alle tien gevraagde gereedschappen zijn centraal afgerond op succesvolle creatie, de bestaande `repeat`-semantiek blijft behouden, meervoudige invoer sluit pas definitief af en geselecteerde foutgevallen hebben geen valse completion of historymutatie. Lijnstuk, Middenpunt en Snijpuntregressies blijven groen. Dit is branchstatus en geen handmatige gebruikersacceptatie of main-merge.

Resterend risico: de gerichte tests bevestigen controllerlogica met een gesimuleerde DOM, niet met echte pointer-/focusgebeurtenissen in Edge. Eventuele verdere migratie van tekst, gekoppelde constructies en Esc-prioriteit valt buiten L3.1.
