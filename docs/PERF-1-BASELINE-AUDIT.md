# WIE PERF-1.1 — Performance-audit nulmeting

- Datum: 17 oktober 2026
- Onderzochte repository: `Geert1985/wiskundige-illustratie-editor`
- Onderzochte commit: `1e831f54a982dbff1e8c901ec4b43953511b8525` (`codex/m-path-0-universal-point-tool`)
- Auditbranch: `codex/perf-1-baseline-audit`
- Scope: diagnose, benchmarks en rapportage. Geen productiecode gewijzigd.

## 1. Samenvatting en advies

De sterkste gemeten bottleneck in de bestaande browser-editor is het opnieuw opbouwen van de objectenlijst. Bij het gemengde document met 100 objecten duurde `renderViewList()` mediaan **903 ms** in headless Edge, terwijl `SvgRenderer.render()` mediaan **1,9 ms** en de canvasfase mediaan **9,3 ms** duurde. De volledige synchronische `EditorApp.render()` duurde mediaan **941 ms**. Bij 10 objecten was de lijst mediaan 20,7 ms en de volledige render 31,5 ms.

Los daarvan groeit SVG-stringgeneratie van mediaan **1,4 ms bij 10 objecten** naar **123 ms bij 2.000 objecten** in Node 22.18.0. Snapping op dezelfde gemengde dataset groeit tot mediaan **16,6 ms** bij 500 objecten (7.184 kandidaten); de cold run duurde 101 ms. De bestaande 0E-dataset is dichter op snijpunten en haar eerder vastgelegde metingen laten zien dat dit pad nog zwaarder kan worden.

**Advies PERF-1.2: GO, beperkt tot render-invalidatie en framecoalescing (A en B), met objectenlijstherbouw als eerste doel.** Meet opnieuw op een zichtbaar Edge-venster en een benoemd doelapparaat. Stel vóór bredere uitrol een frame-acceptatiecriterium vast. Onderzoek caching (E) pas per berekening met expliciete invalidatieregels. Geen GO voor een brede incrementele SVG-renderer (D) op basis van deze audit alleen.

## 2. Onderzochte code en vastgestelde renderpaden

- `EditorApp.invalidate(defer)` rendert synchroon tenzij `defer=true`; in uitgestelde modus wordt één callback per aangevraagd animation frame bijgehouden.
- `pointerMove()` voor pannen werkt de view bij en roept `invalidate(true)` aan. Meerdere events vóór dezelfde RAF delen dus één volledige render. Het selectiehoverpad gebruikt eveneens één pending RAF via `queueHover()`.
- `zoom()` verwerkt elk wheel-event afzonderlijk: capture van de geschiedenis vóór de zoom, zoomcommando, history capture na de zoom, daarna synchroon `invalidate()`. Een eventburst kan dus meermaals dezelfde visuele boom reconstrueren en tweemaal per stap de documenttoestand serialiseren.
- Elke volledige `render()` roept `renderCanvas()`, `renderViewList()` en `renderInspector()` aan, ook bij navigatie. De canvas vervangt zijn inhoud met `innerHTML`; `SvgRenderer.render()` loopt alle zichtbare objecten af en maakt een volledige SVG-string.
- `renderCanvas()` past na de vervanging selectieklassen, assen, rechthoekselectie en overlays toe. Het gemeten overlaypad was bij ongeslecteerde fixtures praktisch nul; dat zegt niets over een geselecteerd object met handvatten.
- Iedere objectrij bouwt onder meer een labelknop. `labelToggleState()` haalt de objecten opnieuw op en vraagt per object de schrijfbevoegdheid op. Dit pad is een plausibele bron van de sterke objectlijstgroei en de browsermeting identificeert de lijst als oorzaak, maar de audit heeft de interne kosten van iedere autorisatie-aanroep niet afzonderlijk getimed. Autorisatie blijft de autoritatieve uitvoeringscontrole.
- `EditorHistory.capture()` gebruikt `engine.toJSON()` en `JSON.stringify()`. Daardoor is navigatiezoom een aantoonbaar serialisatiepad; de exacte serialisatietijd is niet apart gemeten.

## 3. Testomgeving en reproduceerbaarheid

- Vastgelegde Git-basis: bovenstaande commit; de auditbranch is daarvan afgeleid.
- Windows-host, Node `v22.18.0`, viewport `1280 × 900` CSS-pixels.
- Browsermetingen: Microsoft Edge headless, user agent rapporteert Edge `155.0.0.0` / Chromium `155`. Google Fonts zijn geblokkeerd. Het is geen fysieke muis- of zichtbare browserlatencymeting.
- Node SVG-benchmark: 2 opwarmrenders en 7 meetrenders per documentgrootte.
- Node snapbenchmark: 1 cold resolve en 15 warme resolves per grootte.
- Browser renderbenchmark: document laden en één RAF-opwarmfase, daarna 3 expliciete volledige renders. De gerapporteerde p95 over drie samples is alleen het maximum van die drie en is daarom indicatief.
- De fixture is deterministisch en bevat punten, lijnen, cirkels, ellipsen, driehoekige veelhoeken, statische labels/tekst en, vanaf grotere documenten, afhankelijke midpoint-punten. Iedere fixture zet dezelfde view bounds en rasterinstellingen. Rich-math-formules en een lange afhankelijkheidsketen zijn niet in deze fixture opgenomen.
- Reproduceerbare commando's vanaf de repository-root:

```sh
node experiments/perf-1.1/node-render-benchmark.cjs
node experiments/perf-1.1/node-snap-benchmark.cjs
node experiments/perf-1.1/render-benchmark.cjs
npm test
```

De benchmarkresultaten staan naast de scripts in `experiments/perf-1.1/`.

## 4. Meetresultaten

### 4.1 SVG-generatie en snapping — Node 22

Tijden in ms. SVG gebruikt 2 warmups en 7 meetrenders. Snapping gebruikt dezelfde mixed fixtures, 15 warme samples; kandidaat-aantal is het statische kandidaatvolume.

| Objecten | SVG median | SVG p95 | SVG-bytes | Snap-kandidaten | Snap cold | Snap warm median | Snap warm p95 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 1,37 | 1,74 | 8.828 | 13 | 4,73 | 0,49 | 1,41 |
| 100 | 7,38 | 8,76 | 38.918 | 374 | 13,85 | 3,46 | 5,30 |
| 500 | 33,36 | 37,49 | 173.898 | 7.184 | 101,13 | 16,58 | 21,41 |
| 1.000 | 63,18 | 69,53 | 343.139 | — | — | — | — |
| 2.000 | 122,96 | 134,51 | 684.480 | — | — | — | — |

De 1.000- en 2.000-objectmetingen betreffen uitsluitend SVG-generatie. Snapping is niet gemeten boven 500 objecten.

### 4.2 Browsereditor: volledige render en deelpaden — Edge headless

Tijden in ms; drie samples na opwarming. `renderCanvas` omvat de editorcanvasfase; `SVG` is de stringgeneratie; `DOM` is de synchronische `innerHTML`-vervanging. De JavaScript-timers meten niet de latere browserlayout, rasterisatie of schermpresentatie.

| Objecten | SVG mediaan (p95) | DOM-vervanging mediaan (p95) | Canvasfase mediaan (p95) | Objectenlijst mediaan (p95) | Inspector mediaan | Volledige `render()` mediaan (p95) | SVG DOM-elementen |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 10 | 0,8 (1,0) | 0,8 (1,1) | 3,3 (4,2) | 20,7 (21,9) | <0,1 | 31,5 (33,0) | 99 |
| 100 | 1,9 (2,1) | 2,1 (2,9) | 9,3 (9,9) | 903,3 (947,3) | <0,1 | 940,8 (981,8) | 372 |

De inspector was in deze twee runs vrijwel leeg omdat geen object geselecteerd was; de cijfers zijn geen representatieve meting van een volledig gevuld eigenschappenpaneel. De objectlijstmeting omvat zowel JavaScript-opbouw van de lijstmarkup als de synchronische DOM-wijziging daarvan. De `innerHTML`-meting hierboven betreft alleen de canvas-SVG.

### 4.3 Frame- en geheugenmetingen

De headless-proef leverde geen betrouwbare frametijdverdeling op: Edge draait hier zonder zichtbare compositor/presentatie, en de instrumentation veranderde de gebeurtenis- en RAF-belasting. Daarom rapporteert dit verslag geen mediane/p95-frametijd of aantallen overschrijdingen van 16,7/33,3/50 ms als gebruikersvloeiendheidsresultaat. Wel staat vast dat een gemeten synchronische `render()` bij 100 objecten bijna 1 seconde JavaScript uitvoerde; zo'n taak kan niet binnen één 16,7 ms-frame worden afgerond.

`performance.memory.usedJSHeapSize` was circa 9,2 MB na de 10-object-run en 13,0 MB na de 100-object-run. Dit is één headless heapwaarneming zonder gecontroleerde garbage collection, dus geen geheugentrend of leakmeting. Browserlayout- en painttijd vereisen tracing/profiling in een zichtbaar venster en zijn hier niet gescheiden gemeten.

## 5. Bevindingen per onderzoeksvraag

| Onderdeel | Bewijsstatus | Bevinding |
|---|---|---|
| SVG-generatie | Gemeten | Lineaire groei in de gemeten mixed fixtures; 2.000 objecten kost mediaan 123 ms in Node. Bij 100 objecten was de browsergeneratie circa 1,9 ms. |
| `innerHTML`-vervanging | Gemeten, klein in deze fixtures | Circa 0,8 ms bij 10 en 2,1 ms bij 100 objecten. Het vervangen van de volledige boom blijft structureel werk, maar was hier geen grootste JavaScript-bottleneck. Browserlayout/paint na vervanging zijn niet gemeten. |
| Overlays/handvatten | Bronpad gecontroleerd; geselecteerde fixture niet gemeten | Overlaywerk gebeurt na elke canvasrender, maar het gemeten lege-selection-pad was verwaarloosbaar. Geselecteerde overlays vragen een aparte proef. |
| Objectenlijst en inspector | Objectenlijst bewezen als dominante browserkosten; inspector niet representatief | 100 objecten: lijst mediaan 903 ms tegenover SVG 1,9 ms. Beide worden bij navigatie opnieuw opgebouwd. Inspector was nagenoeg leeg zonder selectie. |
| Geometrie/dependents | Gedeeltelijk gemeten | Renderer en enkele midpoint-dependents zitten in fixtures. Geen geprofileerde sleep van een bronobject met een grote afhankelijke keten; de bijdrage van constructieherberekening is daarom nog onzeker. |
| Snapping/hit-testing/rechten | Snapping gemeten; broninspectie voor de rest | Snapping op 500 objecten: 7.184 kandidaten, warm mediaan 16,6 ms en cold 101 ms. Hover is per RAF gecoalesceerd, maar de hit-test scant kandidaatobjecten. Per rij wordt een permissiecheck uitgevoerd; de autorisatiekosten zijn niet apart geïsoleerd. |
| Tekst/formules | Beperkte tekst gemeten | Er zijn statische tekstobjecten en labels; Rich Math/MathJax-achtige formuleweergave is niet apart gemeten. Assetlading kan een extra volledige render uitlokken nadat de math-fragmenten klaar zijn. |
| Synchronische renders/RAF | Bronpad bewezen; absolute framekwaliteit niet gemeten | Panpointermoves stellen maximaal één rendercallback per RAF in. Wheel-zoom blijft synchroon per event en kan binnen één frame meerdere volledige renders plannen. Hovercoalescing voorkomt meerdere hit-tests per RAF, maar niet de volledige lijstbouw die een daaropvolgende update uitvoert. |
| Geschiedenis/serialisatie | Bronpad bewezen; tijd niet geïsoleerd | Iedere zoomstap neemt voor/na-documentgeschiedenis op en serialiseert het document. Dit maakt zoom extra duur bij grote documenten, maar er is geen aparte stopwatch voor capture/record. |

Het bestaande Edge performance-regressiescript (0E) is gestart, maar de volledige 10/100/500-run is in deze audit niet afgerond binnen de beschikbare auditlooptijd. De gerichte Node-suite is wel volledig uitgevoerd. Er is dus geen nieuw Edge-regressie-PASS voor de volledige 0E-browsertest geregistreerd.

## 6. Oorzaken versus vermoedens

**Bewezen door timing en codepad:** `render()` voert bij navigatie ook de viewlist- en inspectorbouw uit; de viewlist domineert bij 100 objecten. SVG-generatie neemt merkbaar toe met objectaantal, maar is in de gemeten 100-objecteditor veel kleiner dan de viewlist. `zoom()` is synchroon en neemt tweemaal per wheelstap een geschiedenis-/documentopname. Panrendering en hoverafhandeling hebben al RAF-coalescing.

**Nog niet bewezen:** hoeveel een grote afhankelijke constructiegraaf aan objectversleep toevoegt; de bijdrage van complexe formules; layout/paint en compositorpresentatie op een echt scherm; aparte hit-test-/autorisatietijden; schaal van inspector met rijk geselecteerd object; geheugenlekkage over lange sessies.

## 7. Beoordeling van optimalisaties A–E

| Optie | Verwachte winst | Complexiteit | Regressierisico en randvoorwaarden | Advies |
|---|---|---|---|---|
| **A. Invalidatie per verantwoordelijkheid** | Zeer hoog voor puur navigeren: voorkom herbouw van objectlijst/inspector wanneer alleen bounds veranderen. | Middel | Verkeerde invalidatie kan selectie, permissions, lagen, status en overlaytoestand verouderen. `EditorApp` blijft eigenaar van render- en pointerlifecycle; autorisatie niet cachen als toestemming. | Eerste implementatiestap. Expliciete view/canvas/UI invalidatie en state-tests. |
| **B. Framecoalescing** | Hoog voor wheel-zoom bursts en resterende synchrone navigatie-updates. Panmoves en hover zijn al deels gecoalesceerd. | Laag–middel | Zoom moet cursoranker, zoomgrenzen, foutfeedback en één begrijpelijke undo-semantiek behouden. Leg een zoomreeks vast als één geschiedenisstap of behoud expliciet de bestaande semantics; verifieer voordat code wordt aangepast. | Samen met A, na vastleggen van historygedrag. |
| **C. Tijdelijke SVG-transformatie** | Potentieel hoog tijdens pan/zoom, omdat dezelfde SVG niet bij iedere stap opnieuw hoeft te worden opgebouwd. | Middel | Lagen/clip, assen buiten viewbox, overlays, labelposities en wiskundige hit-tests moeten exact aansluiten; definitieve SVG moet na navigatie weer uit renderer komen. Geen exportverschil. | Kleine pan-proef na A/B; zoom-transformatie apart beoordelen. |
| **D. Incrementele SVG-updates** | Hoog bij enkele gewijzigde objecten tussen veel statische objecten. | Hoog | Z-order, hidden layers, afhankelijke objecten, labels/meting, selectiestatus, restricted-mode-redactie, overlays en exportpariteit. Risico op tweede renderwaarheid. | Uitstellen tot A–C onvoldoende blijken en er een volledige paritytestmatrix is. |
| **E. Geometrie-/tekstcaching** | Hoog voor herhaalde snapping en dure statische berekeningen; onbekend voor formulefragmenten. | Middel–hoog | Cachekeys moeten geometry, afhankelijkheden, instellingen en math-bronnen omvatten; geen onbegrensde groei of stale permissions. Cache alleen zuivere outputs, niet autorisatie. | Alleen gerichte caches met expliciete invalidatie en geheugengrens. |

## 8. Gefaseerd vervolgplan

1. **PERF-1.2a:** scheid invalidatie van canvas, overlays, inspector en viewlist; laat navigatie de laatste twee overslaan. Behoud één centrale render- en pointereigenaar. Leg tests vast voor selectie, wijzigende rechten, lagen, undo/redo en annuleren.
2. **PERF-1.2b:** bundel wheel-zoomupdates per RAF en bepaal/documenteer undo-groepering. Test cursoranker, zoomlimiet, wheelbursts en immediate cancel/commit.
3. **PERF-1.2c:** vergelijk tijdelijke SVG-pantransformatie met volledige rerender, daarna eventueel zoom. Houd geometrische hit-testing op actuele viewporttransformatie en gebruik de normale renderer voor eindtoestand/export.
4. **PERF-1.2d:** pas als nodig, profileer bronobject-sleep met midpoint-/intersectionketens, rijke formules, geselecteerde overlayhandvatten en permissiemodus. Onderzoek daarna gerichte geometrie-/tekstrendercaches.
5. Herhaal met zichtbare Edge op een afgesproken doelapparaat; registreer RAF-interval, Long Tasks, `render`-deelmetingen en browser performance trace/layout/paint. Definieer vooraf een acceptatiegrens voor p95 en dropped frames.

## 9. Risicoanalyse en aanvullende tests

- History: zoomcoalescing mag geen onverwachte undo-stap- of redo-wijziging opleveren.
- Mathematische juistheid: caching/renderoptimalisaties mogen modelcoördinaten, constructierecepten en exacte waarden niet aanpassen.
- Interactie: Escape, pointercancel, blur, pointer capture verlies, actieve drag en pending RAF moeten cleanup behouden.
- Snapping/hit-testing: huidige screen-space tolerantie, prioriteit en candidate exclusions exact vergelijken.
- Autorisatie: restricted-mode objectredactie en commandvalidatie mogen geen cache of UI-skip omzeilen.
- Export: SVG-/PNG-export blijft gebaseerd op bestaande normale rendersemantiek en blijft identiek aan canvasinhoud zonder tijdelijke transformatie.
- Geheugen: cachecapaciteit, documentvervanging en dispose/init meenemen.
- Tekst: Math-fragments, fontfallback, rijke tekst, dynamische waarden en asset-load-resolve testen.
- Uitgevoerde validatie: `npm test` — **748/748 PASS**. De auditbenchmarks zijn aanvullend. De volledige Node-suite na een gedeelde testinfrastructuurwijziging en de volledige Edge-suite blijven gates voor de implementatiemijlpaal; de audit wijzigde die infrastructuur niet.

## 10. PERF-1.2-besluit

**Aanbeveling: GO voor een afzonderlijke PERF-1.2a/b-implementatiebranch**, beperkt tot A en B en met de in sectie 9 genoemde behoudstests. De dominante browserkost is aangetoond en het voorgestelde begin grijpt de navigatierender aan zonder een tweede renderer te introduceren. Tijdelijke transformatie of incrementele SVG (C/D) vereisen een volgende expliciete review nadat A/B op een echt doelapparaat is gemeten. Dit advies voert PERF-1.2 niet uit en verandert de aparte goedkeuringspoort niet.
