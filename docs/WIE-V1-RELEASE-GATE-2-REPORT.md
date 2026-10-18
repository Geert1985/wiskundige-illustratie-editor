# WIE v1.0 — Release Gate 2

**Datum:** 2026-10-18
**Referentie:** Release Gate 1 — CONDITIONAL GO
**Basis:** `origin/main` = `ffd8b3d8a3f80a1e4a8fadee8c098cc0f4191ce5`
**Werkbranch:** `codex/wie-v1-release-gate-2`

## A. Baseline

De gecontroleerde `origin/main` is PR #49, mergecommit `ffd8b3d8a3f80a1e4a8fadee8c098cc0f4191ce5`. De verificatie is uitgevoerd in een aparte worktree op die commit. De bestaande checkout `repository/` is niet gewijzigd; de al aanwezige staged wijzigingen staan er nog. De branch bevat uitsluitend de twee testwijzigingen en dit rapport.

`node --version`: `v22.18.0`. Gerichte Edge-module: Microsoft Edge `155.0.4283.45`, headless Playwright, zonder page errors. Er is geen volledige Node- of Edge-run uitgevoerd.

PR #49 wijzigde tekstformuleweergave en tekstsubmitvalidatie. De merge wijzigde geen `renderer.js`, drag-/zoom-/coordinate-transformcode of prestatiebestanden. Er is dus geen nieuwe rendering-, drag- of zoomimplementatie geïdentificeerd sinds de vorige prestatie-audit.

## B. Testmatrix

| Onderdeel | Exacte opdracht / bewijs | Resultaat |
|---|---|---|
| Documentintegriteit en lifecycle, inclusief de bijgewerkte paralleltest | `node --test tests/documents.test.cjs tests/lifecycle.test.cjs` | **PASS — 166/166**, 0 mislukt, 0 overgeslagen. Parallel voltooit exact eenmaal; object/documentmutatie, selectie, één history-entry en undo/redo zijn geassert. |
| Actuele formulecatalogus, annuleren, focus, canvasannulering en kleurdialoog | `$env:NODE_PATH=(Resolve-Path ..\wie-txt-form-poc-inline\node_modules).Path; node scripts/run-browser-module.cjs browser-tool-escape.cjs` | **PASS** in Edge 155. Inline `\pi` wordt in lopende tekst ingevoegd; Escape annuleert de niet-bevestigde tekst zonder document/history-mutatie en herstelt focus. Canvas Escape ruimt interactie/preview/pointercapture op zonder history. Escape sluit de kleurendialoog zonder document-/toolmutatie. Geen page errors. |
| Syntax en whitespace | `node --check tests/lifecycle.test.cjs`; `node --check tests/browser-tool-escape.cjs`; `git diff --check` | **PASS**. |
| Teksteditorintegratie, invalid-LaTeX-savebeveiliging, heropenen/JSON-roundtrip, SVG/PNG en rich text | Release Gate 1-bewijs: Edge met afzonderlijk `WIE_TXT_FORM_POC_ONLY=1` en `RICH_TEXT_ONLY=1` | **Historisch PASS** in Gate 1; niet opnieuw gedraaid. |
| Document/construction/permission/history-tests en L4 Node-selector | Gate 1 geselecteerde runs | **Historisch PASS**: 60/60 respectievelijk 9/9; niet opnieuw gedraaid. |
| Gate 1-prestatieproeven | Bestaande `PERF_1_2A_ONLY` en `PERF_1_2B1_ONLY` Edge-proeven | **Historisch PASS**; geen nieuwe benchmark gedraaid. |
| Tweestaps nested Escape van de formule-editor | De huidige zichtbare UI gebruikt een blijvend cataloguspaneel dat een formule inline invoegt; er is geen apart afsluitbaar formule-subvenster op deze route. | **NOT RUN / onbewezen voor een nested subeditor.** De oude `#mathSource`-selector was verouderd. De bijgewerkte module bewijst de huidige invoeg- en annuleringroute, niet het gevraagde twee-Escape-contract van een afzonderlijk subvenster. |
| Fullscreen verlaten via browser-Escape en consistente zichtbare UI | Broninspectie van `syncFullscreen()`, `toggleCanvasFullscreen()` en `fullscreenchange`-handler; geen zichtbare/headed controle | **NOT RUN** in een echte browser-fullscreencontext. Bronpad laat WIE’s canvas-fullscreenstatus en bediening actief bij `fullscreenElement === null`; werkelijke browser-eventvolgorde en layout blijven onbewezen. |

## C. Bevindingen

### Aangetoonde defecten

Geen P0/P1/P2/P3-productdefect aangetoond.

De verouderde lifecycletest verwachtte ten onrechte nul centrale completion voor `construct:parallel`. De architectuur- en recente testcontracten vereisen centrale L3.2-completion. De test is aangepast en slaagt met exact één completion, correcte selectie/documentstatus en undo/redo. Dit was een verouderd testcontract, geen aangetoond productdefect.

### Risico's en bewijsleemten

- **P2 — restrisico, geen defect aangetoond:** de nested formule-subeditor Escape-prioriteit is niet bewezen tegen de huidige zichtbare editor. Het huidige formulecataloguspaneel blijft staan en voegt formules inline in; het sluit niet als een afzonderlijke nested dialoog. De actuele inline-invoeging, één Escape-annulering en focusherstel zijn wel browsermatig getest.
- **P2 — restrisico, geen defect aangetoond:** browser-fullscreen-Escape en de zichtbare interface na het native `fullscreenchange`-event zijn alleen bronmatig beoordeeld. Er is geen headed fullscreenproef gedaan.
- De eerste uitvoering van de oude browsermodule bereikte geen gebruikersgedrag omdat selector `#mathSource` niet meer bestaat. Dat is historische testveroudering; de bijgewerkte module slaagt op de actuele UI-route.

### Bewust buiten scope

Er is geen rendering-/performance-refactor of stressbenchmark uitgevoerd. Circa 500 objecten blijven de aparte stresstestcategorie. Er is geen oordeel gegeven over bredere volledigheid van alle v1.0-workflows buiten de bestaande Gate 1-bewijzen en hierboven genoemde gerichte controles.

## D. Releasecriteria

| Criterium | Status |
|---|---|
| Basis vastgelegd op actuele `origin/main`; bestaande wijzigingen behouden | **Voldaan** |
| Correctie parallel lifecycle-test en gerichte document/lifecycle-suite | **Voldaan** |
| Actuele formule-invoeging, cancel, focus, canvas Escape en kleurendialoog | **Gedeeltelijk voldaan** — current inline-route bewezen; aparte nested Escape-route niet aanwezig/bewezen |
| Fullscreen-Escape consistente zichtbare UI | **Onbewezen** — alleen broninspectie |
| Geen brede suite- of benchmarkcampagne | **Voldaan** |
| Teksteditorhistorisch bewijs (formules, invalid draft, save/reopen, export) | **Voldaan in Gate 1; niet opnieuw uitgevoerd** |

## E. Blokkades

Geen aangetoonde releaseblokkerende P0/P1-problemen. De openstaande bewijsleemten zijn fullscreen-Escape en de afwijking tussen het oude tweestaps Escape-acceptatiecriterium en de huidige inline-catalogus-UI. Deze zijn geen bewezen defecten, maar verhinderen een onvoorwaardelijke GO op basis van deze audit.

## F. Advies voor Release Gate 3

1. Producteigenaar bevestigt dat het huidige inline formulecatalogusgedrag de bedoelde formuleworkflow is en dat er geen nested-subeditor Escape-contract meer geldt.
2. Voer één headed Edge-controle uit voor native fullscreen verlaten met Escape; controleer canvas, bediening en fullscreenknop na `fullscreenchange`.
3. Behoud de twee gerichte regressietests als onderdeel van de release-checklist.
4. Behandel circa 500-objectdocumenten alleen als aparte stresstest; gebruik circa 100 objecten als representatief normaal gebruik, overeenkomstig het bestaande PERF-rapport.

## Prestatiecontext

De bestaande `PERFORMANCE.md` meet op 2026-10-08 met Edge 154, Node 22.18 en viewport 1280×900. Voor 100 objecten rapporteert de historische Edge warm-snapmediaan **2,80 → 0,80 ms** en pointer-burstwerk **395,9 → 7,7 ms**, met rendercount **20 → 1**. Voor 500 objecten zijn de overeenkomstige waarden **42,50 → 8,10 ms**, **2475,1 → 148,0 ms**, en **20 → 1**. Burstwerk is geen volledige interactie-/frametijd. De 500-objectfixture telt 94.760 snapkandidaten; koude intersectie-/invalidatiewerk blijft O(n²). Dit is historische, apparaatgebonden meetinformatie en geen nieuwe releasebenchmark.

**Beoordeling: CONDITIONAL GO voor Release Gate 3.** Geen kritisch defect is aangetoond; sluit of accepteer de twee genoemde bewijsleemten expliciet. Dit rapport is geen definitieve vrijgave van WIE v1.0.
