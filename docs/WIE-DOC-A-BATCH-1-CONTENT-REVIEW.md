# WIE DOC-A — Historische rapporten, eerste inhoudelijke steekproef

**Versie:** 1.0.0  
**Datum:** 2026-10-18  
**Status:** voorlopige classificatie; **geen archiverings-GO**  
**Bron:** `develop` op `5f206f5b89926b927dcb816ff18346d675e9b971` (PR #52 gemerged)  
**Doel:** selecteer een beperkte pilotgroep; analyseer daarna eerst alle inkomende verwijzingen.

## Inhoudelijk bekeken bestanden

| Bestand | Inhoudelijke rol | Voorlopig besluit |
|---|---|---|
| `docs/CANVAS-GRID-CONTROLS-VERIFICATION.md` | Historisch verificatiebewijs raster/knoppen | Archiefkandidaat |
| `docs/FULLSCREEN-CANVAS-VERIFICATION.md` | Historisch bewijs fullscreen en Escape | Archiefkandidaat, behoud release-traceerbaarheid |
| `docs/CONSTRUCTION-HOVER-REPORT.md` | Implementatie- en testverslag constructiehover | Archiefkandidaat |
| `docs/POINT-CONSTRUCTION-MENU-REPORT.md` | Historisch puntconstructiemenu | Archiefkandidaat |
| `docs/LINE-SEGMENT-BEHAVIOR-REPORT.md` | Oorspronkelijke vrije/gekoppelde lijnstuksemantiek | Archiefkandidaat, controleer contractverwijzingen |
| `docs/LINKED-SHAPE-MENU-REPORT.md` | Historisch split-knopverslag | Archiefkandidaat |
| `docs/FULL-CANVAS-AXES-REPORT.md` | Historische assenimplementatie | Archiefkandidaat |
| `docs/GEO-UI-ELLIPSE-LABEL-ANCHORS-REPORT.md` | Foutoorzaak en reparatie ellipsmeetlabels | Archiefkandidaat; regressieachtergrond bewaren |
| `docs/BISECTOR-CLIP-SPLIT-TOOLS-REPORT.md` | Bissectrice-rendering en gereedschapmenu's | Archiefkandidaat |
| `docs/TOOL-MENU-REORGANIZATION-REPORT.md` | Gedateerd menu-implementatieverslag | Archiefkandidaat, bevat roadmaplink |
| `docs/M2c-VISUAL-FINISH-REPORT.md` | Visuele afwerkingsronde | Archiefkandidaat |
| `docs/M2c-INSPECTOR-FEEDBACK-REPORT.md` | Historische correcties objectinspector | Archiefkandidaat |

Deze classificatie is gebaseerd op de inhoud van deze twaalf bestanden, niet uitsluitend op hun namen. `Archiefkandidaat` betekent uitdrukkelijk niet dat het document al veilig verplaatst kan worden.

## Referentiële risico's

De oorspronkelijke inventaris en audit (PR #52) wijzen op actuele afhankelijkheden uit `AGENTS.md`, `docs/DEVELOPMENT-ROADMAP.md` en andere contracten naar eerdere rapporten. Van de twaalf kandidaten bevat `TOOL-MENU-REORGANIZATION-REPORT.md` bovendien een uitgaande link naar `DEVELOPMENT-ROADMAP.md`. Het verplaatsen van een bestand kan uitgaande relatieve links én inkomende verwijzingen verbreken.

Een volledig Git-repositorybreed overzicht van inkomende Markdown- en platte bestandsnaamverwijzingen is **NIET UITGEVOERD**. De poging tot een geautomatiseerde Markdown-brede scan liep tegen een limiet van de gebruikte GitHub-verbinding aan; er mogen geen conclusies over afwezige backlinks uit worden getrokken.

## Vervolgpoort — DOC-A-verwijzingsscan

Voer een **lokale, read-only scan op een schone worktree van de huidige `develop`** uit voor bovenstaande twaalf exacte bestandsnamen:

1. Onderzoek verwijzingen in Markdown, HTML, JS/TS, JSON, scripts en configuratie; detecteer relatieve Markdown-links, expliciete paden, platte bestandsnamen en GitHub-bloblinks waar van toepassing.
2. Leg voor elk van de twaalf kandidaten alle gevonden bronbestanden en de soorten verwijzingen vast.
3. Controleer uitgaande relatieve links vanuit elke kandidaat en de juiste doelpaden na een mogelijke verhuizing.
4. Leg `oude pad → voorgestelde archiefpad` vast, inclusief noodzakelijke linkupdates of compatibiliteitsalias.
5. Controleer bij elk bestand of normatieve of actuele passages nog elders actief worden gebruikt.

Rapporteer onzekerheden en grensgevallen. Voer **geen** hernoemingen, verwijderingen, bulkarchivering of productiewijzigingen uit. Geen volledige Edge- of Node-tests; alleen deze document-/referentiescan.

## Besluit

**GO voor een read-only DOC-A-verwijzingsanalyse. NO-GO voor archivering totdat alle inkomende en uitgaande verwijzingen voor een beperkte pilotgroep gecontroleerd zijn.** `main` en tag `v1.0.0` blijven onaangeroerd.
