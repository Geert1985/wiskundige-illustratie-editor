# WIE DOC-A — Verwijzingsscan archiefkandidaten

**Versie:** 1.1.0
**Datum:** 2026-10-18
**Status van oorspronkelijke scan:** read-only inventarisatie voltooid; op dat moment **geen toestemming om te archiveren**. De later afzonderlijk opgedragen DOC-C-uitvoering is hieronder vastgelegd.
**PR:** #53, concept, niet gemerged
**Scanbranch:** `chore/wie-v1-1-doc-a-batch-1`
**Scancommit:** `05c06adb28b4ba3532671bef3e5f1008ef290d2f`
**PR-basis:** `develop` op `5f206f5b89926b927dcb816ff18346d675e9b971`

## Methode en reikwijdte

De scan is uitgevoerd op een schone lokale worktree van de PR-branch. Alle twaalf kandidaatbestanden bestaan op hun huidige paden. Voor elke exacte bestandsnaam is `git grep -I -n -i -F` op de volledige tracked repositorysnapshot uitgevoerd. Daarmee zijn Markdown, HTML, JS/TS, CSS, JSON, scripts en overige tracked tekstbestanden doorzocht op bestandsnamen en expliciete paden. Daarnaast zijn alle Markdown-linkdoelen in de twaalf kandidaten uitgelezen en gecontroleerd.

**Resultaat:** geen inkomende verwijzingen gevonden in productiecode, configuratie of tests. Alle gevonden inkomende repositoryverwijzingen staan in dit DOC-A-rapport, `docs/WIE-DOC-INVENTORY-v1.0.0.md` en, voor twee kandidaten, `docs/DEVELOPMENT-ROADMAP.md`. De zoekactie onderzocht de huidige tracked repositorysnapshot; GitHub-commentaren, externe documenten, andere branches en vrije tekst buiten deze repository zijn niet volledig doorzocht.

Voorstel voor een uniforme bestemming (bestaat nog niet): `docs/archive/doc-a-batch-1/<bestandsnaam>`. Dit is alleen een doelpadvoorstel. Er zijn geen documenten verplaatst of verwijderd.

## Beoordeling per kandidaat

### 1. `docs/CANVAS-GRID-CONTROLS-VERIFICATION.md`

- **Status/normatief belang:** historisch verificatieverslag, implementatiecommit `bd8829f`; rapporteert 286 Node-tests en 30 Edge-modules PASS. Het noemt equal-scale-, bounds-, snapping- en gridrandeigenschappen. De actuele code en bestaande renderer-/coördinatentransformatiecontracten zijn normatief; dit verslag is bewijs, geen contract.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 40). Geen andere hits.
- **Uitgaand:** geen Markdown-links of expliciete documentpaden.
- **Bestemming:** `docs/archive/doc-a-batch-1/CANVAS-GRID-CONTROLS-VERIFICATION.md`.
- **Correctie/alias:** bij een latere verplaatsing de twee inventarisverwijzingen naar de nieuwe locatie bijwerken. Geen compatibiliteitsalias nodig voor de gevonden interne links; externe URL's zijn niet onderzocht.
- **Oordeel:** **veilig te archiveren** als historische verificatie, na indexcorrecties.

### 2. `docs/FULLSCREEN-CANVAS-VERIFICATION.md`

- **Status/normatief belang:** historisch verificatieverslag; bevat gerichte native fullscreen-/Escape-controle en visuele beoordeling. De producteigenaar heeft fullscreen–Escape later handmatig geaccepteerd. Huidige code en gebruikersacceptatie bepalen gedrag; dit bestand is nuttige release-traceerbaarheid, niet het actuele contract.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 53). Geen andere hits.
- **Uitgaand:** geen Markdown-links of expliciete documentpaden.
- **Bestemming:** `docs/archive/doc-a-batch-1/FULLSCREEN-CANVAS-VERIFICATION.md`.
- **Correctie/alias:** actualiseer de indexverwijzingen bij verplaatsing. Houd het bestand volledig in Git-geschiedenis en behoud een link vanuit een toekomstige release-evidence-index. Een alias is niet nodig voor gevonden repo-links.
- **Oordeel:** **veilig te archiveren** als bewijs, mits de traceerbaarheid naar de handmatige acceptatie behouden blijft.

### 3. `docs/CONSTRUCTION-HOVER-REPORT.md`

- **Status/normatief belang:** historisch implementatie- en testverslag; vermeldt 284/284 Node-tests en Edge-controles PASS, maar zegt expliciet dat visuele gebruikersacceptatie openstaat. Actuele constructiebronrollen en autorisatiecontracten zijn normatief; dit verslag is geen contract.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 44). Geen andere hits.
- **Uitgaand:** geen Markdown-links. Bevat repo-bestandspaden in lopende tekst (`editor.js`, `editor-enhancements.js`, `tests/...`); dit zijn geen klikbare links en vereisen geen Markdown-doelcorrectie.
- **Bestemming:** `docs/archive/doc-a-batch-1/CONSTRUCTION-HOVER-REPORT.md`.
- **Correctie/alias:** indexverwijzingen bijwerken. Eerst nagaan of de expliciet openstaande visuele acceptatie later is gegeven; zo niet, moet die open status vindbaar blijven en niet door archivering worden verhuld.
- **Oordeel:** **nader onderzoeken** wegens openstaande acceptatiestatus.

### 4. `docs/POINT-CONSTRUCTION-MENU-REPORT.md`

- **Status/normatief belang:** historisch split-menuverslag met gerichte en volledige Edge-testresultaten. De actuele gereedschapcatalogus en UI-contracten zijn normatief. De roadmap linkt het verslag nog als achtergronddetail.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 143); `docs/DEVELOPMENT-ROADMAP.md` (regel 362, relatieve Markdown-link).
- **Uitgaand:** geen Markdown-links of expliciete documentpaden.
- **Bestemming:** `docs/archive/doc-a-batch-1/POINT-CONSTRUCTION-MENU-REPORT.md`.
- **Correctie/alias:** wijzig de roadmaplink naar `archive/doc-a-batch-1/POINT-CONSTRUCTION-MENU-REPORT.md` (relatief vanaf `docs/`); actualiseer inventaris en dit rapport bij daadwerkelijke verhuizing. Geen interne compatibiliteitsalias nodig als alle gevonden verwijzingen worden bijgewerkt.
- **Oordeel:** **veilig te archiveren** als historisch bewijs, na roadmap- en indexcorrectie.

### 5. `docs/LINE-SEGMENT-BEHAVIOR-REPORT.md`

- **Status/normatief belang:** historisch implementatie-/regressieverslag over vrije lijnstukken versus gekoppelde `lineBetweenPoints`. Die productsemantiek is nog actief en normatief vastgelegd in `LINEAR-OBJECTS.md`, de huidige code en constructiecontracten. Het verslag zelf blijft historisch bewijs; de roadmap linkt er nog naar.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 61); `docs/DEVELOPMENT-ROADMAP.md` (regel 370, relatieve Markdown-link).
- **Uitgaand:** geen Markdown-links. De genoemde bestanden `permission-runtime.js`, `editor.js`, `index.js`, `editor.html`, `editor-tool-instructions.js`, `LINEAR-OBJECTS.md` en regressietests zijn tekstuele repo-padverwijzingen, geen linkdoelen.
- **Bestemming:** `docs/archive/doc-a-batch-1/LINE-SEGMENT-BEHAVIOR-REPORT.md`.
- **Correctie/alias:** wijzig de roadmaplink naar `archive/doc-a-batch-1/LINE-SEGMENT-BEHAVIOR-REPORT.md`; actualiseer inventaris en dit rapport. Houd `LINEAR-OBJECTS.md` als de huidige vindbare normatieve uitleg. Geen alias nodig als de gevonden links worden aangepast.
- **Oordeel:** **veilig te archiveren** als implementatiebewijs, niet als vervanging van het actuele contract.

### 6. `docs/LINKED-SHAPE-MENU-REPORT.md`

- **Status/normatief belang:** zeer kort historisch split-menuverslag (10 oktober 2026), met 38 Edge-modules als PASS. De beschreven combinatie met “Lijnstuk via punten” is later opgesplitst; actuele bediening/code zijn leidend. Geen normatieve contractinhoud.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 62). Geen andere hits.
- **Uitgaand:** geen Markdown-links. `FEATURE-GAP-ANALYSIS.md` is alleen in een historische zin genoemd; het bestand is niet gecontroleerd of als link gebruikt.
- **Bestemming:** `docs/archive/doc-a-batch-1/LINKED-SHAPE-MENU-REPORT.md`.
- **Correctie/alias:** actualiseer de inventarisverwijzingen bij verplaatsing; geen gevonden interne alias nodig.
- **Oordeel:** **veilig te archiveren** als gedateerd bewijs.

### 7. `docs/FULL-CANVAS-AXES-REPORT.md`

- **Status/normatief belang:** historisch renderer-/assenverslag met 284 Node-tests en 27 Edge-modules als PASS; het vermeldt expliciet dat visuele gebruikersacceptatie openstaat. De actuele coordinate-transform-/renderercode en eventuele actuele UI-contracten zijn normatief.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 52). Geen andere hits.
- **Uitgaand:** geen Markdown-links; bron- en testbestanden worden als gewone padtekst genoemd.
- **Bestemming:** `docs/archive/doc-a-batch-1/FULL-CANVAS-AXES-REPORT.md`.
- **Correctie/alias:** indexverwijzingen bijwerken. Eerst de expliciet openstaande visuele acceptatie reconciliëren met latere gebruikersbesluiten.
- **Oordeel:** **nader onderzoeken** wegens de niet-afgesloten acceptatievermelding.

### 8. `docs/GEO-UI-ELLIPSE-LABEL-ANCHORS-REPORT.md`

- **Status/normatief belang:** historische oorzaak-/reparatieanalyse en regressiebewijs voor ellipsmeetlabels; vermeldt gerichte en volledige testresultaten en geen bekende resterende beperking. De actuele `ellipse-geometry`, meet-/rendererlogica en tests zijn normatief; het verslag is waardevolle debugginghistorie.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 55). Geen andere hits.
- **Uitgaand:** geen Markdown-links. `tests/geo-ui-measurements.test.cjs` staat als tekstueel pad genoemd.
- **Bestemming:** `docs/archive/doc-a-batch-1/GEO-UI-ELLIPSE-LABEL-ANCHORS-REPORT.md`.
- **Correctie/alias:** inventaris bijwerken; laat het regressiepad/testbestand intact. Geen gevonden interne alias nodig.
- **Oordeel:** **veilig te archiveren** als opgelost defect- en regressiebewijs.

### 9. `docs/BISECTOR-CLIP-SPLIT-TOOLS-REPORT.md`

- **Status/normatief belang:** historisch renderer-/UI-verslag met 286 Node-tests en 29 Edge-modules als PASS. Het meldt expliciet dat visuele gebruikersacceptatie nog open is. Huidige geometrie-, transform- en UI-contracten zijn normatief.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 39). Geen andere hits.
- **Uitgaand:** geen Markdown-links; bron- en testbestanden staan alleen als repo-padtekst genoemd.
- **Bestemming:** `docs/archive/doc-a-batch-1/BISECTOR-CLIP-SPLIT-TOOLS-REPORT.md`.
- **Correctie/alias:** indexverwijzingen bijwerken en eerst de openstaande visuele acceptatie statusmatig reconciliëren.
- **Oordeel:** **nader onderzoeken**.

### 10. `docs/TOOL-MENU-REORGANIZATION-REPORT.md`

- **Status/normatief belang:** gedateerd menu-implementatieverslag, gebaseerd op een oudere roadmapversie; beschrijft placeholders en verwijderde menu-items. De huidige `ToolCatalog`, editor-UI en actuele roadmap zijn leidend. De inhoud is geen actueel contract.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 174). Geen inkomende verwijzing gevonden vanuit de roadmap.
- **Uitgaand:** één relatieve Markdown-link naar `DEVELOPMENT-ROADMAP.md` (regel 16); die link bestaat nu.
- **Bestemming:** `docs/archive/doc-a-batch-1/TOOL-MENU-REORGANIZATION-REPORT.md`.
- **Correctie/alias:** na verplaatsing wordt de link `../../DEVELOPMENT-ROADMAP.md`. Werk de inventaris en dit DOC-A-rapport bij. Geen gevonden interne compatibiliteitsalias nodig.
- **Oordeel:** **veilig te archiveren** als historische status, na correctie van de uitgaande link.

### 11. `docs/M2c-VISUAL-FINISH-REPORT.md`

- **Status/normatief belang:** historisch CSS-/visueel afwerkingsverslag; rapporteert 281 Node-tests en de volledige Edge-suite PASS, maar laat visuele gebruikersacceptatie expliciet open. Huidige styles en UI-afspraken zijn normatief.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 85). Geen andere hits.
- **Uitgaand:** geen Markdown-links. `editor.css` en `editor.html` worden genoemd als tekstuele wijzigingspaden.
- **Bestemming:** `docs/archive/doc-a-batch-1/M2c-VISUAL-FINISH-REPORT.md`.
- **Correctie/alias:** actualiseer de indexverwijzingen; eerst de openstaande visuele acceptatie reconciliëren.
- **Oordeel:** **nader onderzoeken**.

### 12. `docs/M2c-INSPECTOR-FEEDBACK-REPORT.md`

- **Status/normatief belang:** historisch verslag van zeven inspectorwijzigingen; testresultaten zijn gerapporteerd, maar gebruikersacceptatie staat expliciet open. De actuele inspector-/radialcontracten en code zijn normatief; dit verslag is test-/besluitgeschiedenis.
- **Inkomend:** dit rapport; `docs/WIE-DOC-INVENTORY-v1.0.0.md` (regel 81). Geen andere hits.
- **Uitgaand:** geen Markdown-links. Het noemt `editor.js`, `editor.css`, `editor.html` en `tests/...` als tekstuele repo-paden.
- **Bestemming:** `docs/archive/doc-a-batch-1/M2c-INSPECTOR-FEEDBACK-REPORT.md`.
- **Correctie/alias:** actualiseer de indexverwijzingen; eerst de openstaande gebruikersacceptatie reconciliëren.
- **Oordeel:** **nader onderzoeken**.

## Uitgaande padverwijzingen en aliasbeleid

Elf documenten hebben geen lokale Markdown-linkdoelen; alleen `TOOL-MENU-REORGANIZATION-REPORT.md` bevat een lokale relatieve Markdown-link die door verhuizing moet worden aangepast. Verschillende verslagen noemen bron- en testbestanden in code of lopende tekst. Dat zijn geen Markdown-links. De repository hanteert die notaties als paden vanaf de repositoryroot; houd die conventie aan of maak ze bij een toekomstige archivering expliciet rootrelatief. De gerapporteerde code- en testbestanden zijn niet archiefkandidaten.

Voor interne verwijzingen is een compatibiliteitsalias niet noodzakelijk wanneer de twee indexbestanden en twee roadmaplinks hierboven bij een echte verhuizing worden bijgewerkt. Externe hyperlinks naar `blob/main/docs/<oude-naam>` zijn buiten deze repositoryscan niet vastgesteld. Als behoud van zulke URL's vereist is, maak dan bij de latere archiveringsopdracht een korte stub op het oude pad met de nieuwe locatie; voer dat nu niet uit.

## Voorstel eerste proefarchivering

Maximaal zeven kandidaten worden voorgesteld voor een eerste batch. Verplaats ze pas in een afzonderlijk goedgekeurde archiveringsopdracht en wijzig dan in dezelfde wijziging de vermelde index-/roadmaplinks:

1. `CANVAS-GRID-CONTROLS-VERIFICATION.md`
2. `FULLSCREEN-CANVAS-VERIFICATION.md` — bewaar expliciete verwijzing als historisch fullscreen-/Escape-bewijs.
3. `POINT-CONSTRUCTION-MENU-REPORT.md` — eerst roadmaplink bijwerken.
4. `LINE-SEGMENT-BEHAVIOR-REPORT.md` — eerst roadmaplink bijwerken; `LINEAR-OBJECTS.md` blijft de norm.
5. `LINKED-SHAPE-MENU-REPORT.md`
6. `GEO-UI-ELLIPSE-LABEL-ANCHORS-REPORT.md`
7. `TOOL-MENU-REORGANIZATION-REPORT.md` — eerst uitgaande roadmaplink aanpassen.

De vijf rapporten met expliciet openstaande gebruikersacceptatie (constructiehover, canvasbrede assen, bissectriceclip/split-tools, M2c visuele afwerking en M2c inspector) blijven voorlopig op hun huidige pad totdat de acceptatiestatus is opgehelderd. Dit is geen oordeel dat de implementaties defect zijn.

## Besluit

De repositorybrede verwijzingsinventaris voor de twaalf kandidaten is uitgevoerd. Alle gevonden interne inbound- en outboundverwijzingen zijn hierboven vastgelegd. **GO voor voorbereiding van een beperkte proefarchivering van de zeven genoemde bestanden, onder voorwaarde dat de index- en roadmaplinks in dezelfde wijziging worden gecorrigeerd.** **Geen uitvoerings-GO voor verplaatsen/verwijderen in deze opdracht.** De vijf kandidaten met expliciet openstaande gebruikersacceptatie blijven behouden. Externe URL's blijven een bewijsleemte; gebruik bij de latere uitvoeringsopdracht een oud-pad-stub als linkbehoud vereist is. PR #53 blijft concept; `main` en tag `v1.0.0` zijn niet gewijzigd.

## DOC-C-uitvoering — eerste proefarchivering (2026-10-18)

Deze uitvoeringsbijlage registreert de afzonderlijk opgedragen en uitgevoerde proefarchivering. Zij vervangt de historische scanbevindingen en het eerdere besluitvoorstel hierboven niet.

De volgende zeven documenten zijn met `git mv` verplaatst naar `docs/archive/doc-a-batch-1/`:

1. `docs/CANVAS-GRID-CONTROLS-VERIFICATION.md` → `docs/archive/doc-a-batch-1/CANVAS-GRID-CONTROLS-VERIFICATION.md`
2. `docs/FULLSCREEN-CANVAS-VERIFICATION.md` → `docs/archive/doc-a-batch-1/FULLSCREEN-CANVAS-VERIFICATION.md`
3. `docs/POINT-CONSTRUCTION-MENU-REPORT.md` → `docs/archive/doc-a-batch-1/POINT-CONSTRUCTION-MENU-REPORT.md`
4. `docs/LINE-SEGMENT-BEHAVIOR-REPORT.md` → `docs/archive/doc-a-batch-1/LINE-SEGMENT-BEHAVIOR-REPORT.md`
5. `docs/LINKED-SHAPE-MENU-REPORT.md` → `docs/archive/doc-a-batch-1/LINKED-SHAPE-MENU-REPORT.md`
6. `docs/GEO-UI-ELLIPSE-LABEL-ANCHORS-REPORT.md` → `docs/archive/doc-a-batch-1/GEO-UI-ELLIPSE-LABEL-ANCHORS-REPORT.md`
7. `docs/TOOL-MENU-REORGANIZATION-REPORT.md` → `docs/archive/doc-a-batch-1/TOOL-MENU-REORGANIZATION-REPORT.md`

De twee roadmapverwijzingen zijn bijgewerkt naar de archiefpaden; de uitgaande roadmaplink in het Tool Menu-verslag is bijgewerkt naar `../../DEVELOPMENT-ROADMAP.md`. De oorspronkelijke v1.0-documenteninventaris bleef als historische momentopname intact; een migratiebijlage koppelt de oude en nieuwe paden. De [archiefindex](archive/doc-a-batch-1/README.md) houdt alle zeven documenten vindbaar en markeert het fullscreen-/Escape-verslag expliciet als historisch releasebewijs.

De vijf rapporten met openstaande acceptatie zijn niet verplaatst en hun acceptatiestatus is niet gewijzigd: `CONSTRUCTION-HOVER-REPORT.md`, `FULL-CANVAS-AXES-REPORT.md`, `BISECTOR-CLIP-SPLIT-TOOLS-REPORT.md`, `M2c-VISUAL-FINISH-REPORT.md` en `M2c-INSPECTOR-FEEDBACK-REPORT.md`.

Gerichte DOC-C-controles: precies zeven Git-renames aangetoond; alle zeven nieuwe bestanden aanwezig; oorspronkelijke inhoud byte-voor-byte gelijk (Tool Menu vergeleken na het terugdraaien van de enige goedgekeurde relatieve-linkwijziging); lokale Markdown-linkdoelen in de zeven rapporten, index en gewijzigde documentatie geldig; de vijf uitgesloten acceptatierapporten aanwezig en ongewijzigd; `git diff --check` geslaagd. Er zijn geen Node- of Edge-tests uitgevoerd omdat dit documentatieverplaatsingen zijn. De broninventarisatie onderzocht de repositorysnapshot; externe GitHub-URL's en verwijzingen buiten de repository blijven buiten bereik. Er zijn daarom geen oude-pad-compatibiliteitsaliassen toegevoegd.
