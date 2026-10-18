# WIE DOC-E — Tweede archiveringsronde: status- en verwijzingstriage

**Documentversie:** 1.0.0
**Datum:** 18 oktober 2026
**Status:** read-only inhoudelijke triage; **geen archiverings-GO**
**Repository:** `Geert1985/wiskundige-illustratie-editor`
**Baseline:** `develop` op `1ec3b482222d7486f82ff094687628dcc59508eb` (na DOC-D, PR #55)
**Werkbranch:** `chore/wie-v1-1-doc-e-batch-2-triage`

## 1. Doel en afbakening

Na de geslaagde DOC-C-pilot van zeven historische verslagen worden **18 aanvullende documenten** inhoudelijk geselecteerd en op hun acceptatiestatus beoordeeld. Het doel is een veilige tweede archiefbatch te vormen. Daarnaast zijn 18 oudere M2c/M3–M5b-/meting-/tekstverslagen verkend; die bevatten vrijwel allemaal expliciet nog openstaande handmatige acceptatie op de oorspronkelijke peildatum. Die oudere groep is daarom **niet zonder aanvullend besluit** als bulkarchiefbatch voorgedragen.

Het bestaan van een v1.0-release, een eerdere test-PASS of een merge naar `main` bewijst **niet automatisch** dat alle afzonderlijke historische UX-/handmatige acceptatiepunten zijn afgesloten.

De classificatie is op basis van de inhoud van de 18 rapporten en controle van sleuteldocumenten (`AGENTS.md`, roadmap, backlog, inventaris, release-notities en relevante contracten). Dit is **geen repositorybrede `git grep`** van alle bestanden. Alleen aangetroffen/verifieerbare verwijzingen worden hieronder genoemd.

## 2. Beoordeling van 18 documenten

| Document onder `docs/` | Status bij triage | Waarom | Voorstel |
|---|---|---|---|
| `UI-LAYERS-LABEL-1-REPORT.md` | Gedeeltelijk afgesloten | Gebruiker keurde kernscenario en integratie goed; extra scenario's/eigen documenten nog expliciet open | **Voorlopig behouden** |
| `UI-LAYERS-TEXT-1-REPORT.md` | Gedeeltelijk afgesloten | Gebruiker keurde kernscenario en integratie goed; aanvullende oude-document-/laaggevallen open | **Voorlopig behouden** |
| `M8b-3-CONSOLIDATION-REPORT.md` | Geaccepteerd/geïntegreerd | Definitieve acceptatie vastgelegd; PR #23 gemerged | **Pilotkandidaat** |
| `M8-INT-0-IMPLEMENTATION-REPORT.md` | Geaccepteerd/geïntegreerd | Handmatige acceptatie 17 oktober; PR #27 vermeld in roadmap | **Pilotkandidaat** |
| `M8-INT-1-IMPLEMENTATION-REPORT.md` | Geaccepteerd/geïntegreerd | Handmatige acceptatie incl. UX-correctie 17 oktober; PR #28 gemerged | **Pilotkandidaat** |
| `M8a-1b-ELLIPSE-CONTROL-POINT-IMPLEMENTATION.md` | Historische status onvolledig | Verslag meldt onafgeronde handmatige/browseracceptatie; implementatie is later via PR #17 gemerged | **Reconciliatie vereist** |
| `M8a-2-POINT-ON-ELLIPSE-IMPLEMENTATION.md` | Geaccepteerd/geïntegreerd | Expliciete gebruikersacceptatie 15 oktober; PR #16 gemerged | **Pilotkandidaat** |
| `WIE-TOOL-L2-REPORT.md` | Historisch checkpoint | Rapport meldt status vóór PR/merge; roadmap meldt latere PR #34; geen zelfstandige expliciete gebruikersacceptatie afgeleid | **Reconciliatie vereist** |
| `WIE-TOOL-L3-1-REPORT.md` | Historisch checkpoint | Gerichte implementatiecontrole; roadmap meldt integratie PR #35 | **Reconciliatie vereist** |
| `WIE-TOOL-L3-2-REPORT.md` | Historisch checkpoint | Gerichte implementatiecontrole; roadmap meldt integratie PR #36 | **Reconciliatie vereist** |
| `WIE-TOOL-L3-3A-REPORT.md` | Historisch checkpoint | Gerichte implementatiecontrole; integratiehistorie op roadmap | **Reconciliatie vereist** |
| `WIE-TOOL-L3-3B-REPORT.md` | Historisch checkpoint | Gedateerd premergeverslag; latere integratiegeschiedenis op roadmap | **Reconciliatie vereist** |
| `WIE-TOOL-L3-3C-REPORT.md` | Historisch checkpoint | Gedateerd premergeverslag; latere integratiegeschiedenis op roadmap | **Reconciliatie vereist** |
| `WIE-TOOL-L3-4-REPORT.md` | Historisch checkpoint | Verslag bevat oude niet-mergeclaim; latere integratie op roadmap | **Reconciliatie vereist** |
| `WIE-TOOL-L3-5-REPORT.md` | Historisch checkpoint | Teksttool-implementatiebewijs; aanvullende lifecycle-/acceptatiegrenzen bewaren | **Reconciliatie vereist** |
| `WIE-TOOL-L4-REPORT.md` | Open technisch restrisico | Native browser-/dialog-Escape-verificatie apart begrensd; niet gelijkstellen aan volledige releaseacceptatie | **Voorlopig behouden** |
| `WIE-TOOL-L5-2-REPORT.md` | CONDITIONAL GO (historisch) | L4-browserrestrisico expliciet buiten de gerichte Node-contractverificatie | **Voorlopig behouden** |
| `WIE-TOOL-L5-3-REPORT.md` | Gericht GO (historisch) | Pilot-Nodecontract GO, maar browserdekking uit L4 niet opnieuw onderzocht | **Voorlopig behouden** |

**Telling:** 18 beoordeeld; **4 pilotkandidaten** met expliciet afgesloten gebruikersacceptatie en integratie; **14 voorlopig behouden of nader reconciliëren**. De overige 14 zijn niet noodzakelijk defect of onbruikbaar: hun documentair bewijs is eenvoudigweg niet volledig genoeg om openstaande checkpoints als afgehandeld te labelen.

## 3. Tweede pilotbatch — alleen kandidaten voor een latere, afzonderlijke uitvoeringsopdracht

| Huidig pad | Voorlopig archiefpad |
|---|---|
| `docs/M8b-3-CONSOLIDATION-REPORT.md` | `docs/archive/doc-e-batch-2/M8b-3-CONSOLIDATION-REPORT.md` |
| `docs/M8-INT-0-IMPLEMENTATION-REPORT.md` | `docs/archive/doc-e-batch-2/M8-INT-0-IMPLEMENTATION-REPORT.md` |
| `docs/M8-INT-1-IMPLEMENTATION-REPORT.md` | `docs/archive/doc-e-batch-2/M8-INT-1-IMPLEMENTATION-REPORT.md` |
| `docs/M8a-2-POINT-ON-ELLIPSE-IMPLEMENTATION.md` | `docs/archive/doc-e-batch-2/M8a-2-POINT-ON-ELLIPSE-IMPLEMENTATION.md` |

**Bekende verwijzingen uit de gerichte controle:**

- `AGENTS.md` verwijst rechtstreeks naar `M8b-3-CONSOLIDATION-REPORT.md`; de roadmap verwijst er eveneens naar. Die links moeten bij een eventuele verhuizing gelijktijdig worden aangepast.
- De roadmap linkt tweemaal naar `M8-INT-0-IMPLEMENTATION-REPORT.md` en tweemaal naar `M8-INT-1-IMPLEMENTATION-REPORT.md`.
- `docs/WIE-DOC-INVENTORY-v1.0.0.md` bevat historische padvermeldingen van alle vier; **houd de oorspronkelijke inventaris ongewijzigd** en voeg na een daadwerkelijke verplaatsing een nieuwe migratiebijlage toe.
- `M8-INT-1-IMPLEMENTATION-REPORT.md` heeft uitgaande relatieve links naar `M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md` en `M8-INT-1-PREFLIGHT.md`; na verhuizing vanaf `docs/archive/doc-e-batch-2/` worden dit `../../M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md` respectievelijk `../../M8-INT-1-PREFLIGHT.md`.
- Externe GitHub-bloblinks, referenties in andere branches, platte tekst in overige repositorybestanden en eventuele niet-Markdown-verwijzingen zijn **niet uitputtend onderzocht**. Er is dus geen bewijs dat er geen andere verwijzingen bestaan.

**Historische bewijsketen:** de vier rapporten bevatten acceptatie-, regressie- en implementatie-informatie voor WIE v1.0; de archiefindex moet vanuit de roadmap/documentatie-index vindbaar blijven. Hun historische statuspassages mogen niet stilzwijgend worden herschreven.

## 4. Volgende noodzakelijke gate — volledige repositoryverwijzingsscan voor deze vier paden

Gebruik een schone lokale worktree met de **actuele** `develop` als uitgangspunt:

1. Verifieer de vier kandidaatbestanden op de actuele `develop`; leg SHA, inhouds- en acceptatiestatus vast.
2. Voer voor iedere exacte bestandsnaam en beide volledige padvarianten een **read-only `git grep` over alle tracked tekstbestanden** uit, inclusief Markdown, JS/TS, HTML, JSON, CSS, scripts, tests en configuratie.
3. Maak per kandidaat een expliciete lijst inkomende Markdown-links, overige padvermeldingen en uitgaande relatieve links.
4. Controleer de voorgestelde bestemmingen en compatibiliteitsbehoefte (stubs alleen indien noodzakelijk), met een `oud → nieuw`-mapping.
5. Noteer buiten-scope externe URLs en handmatige gebruikersacceptaties; claim geen volledige dekking daarvan.
6. Voer **geen verplaatsingen of verwijderingen** uit tijdens deze gate; maak geen nieuwe productiecode.
7. Voer alleen gerichte document-/linkchecks uit; geen volledige Node- of Edge-tests.

Na succesvolle controle kan een aparte, kleine DOC-E-archiverings-PR naar `develop` volgen. Corrigeer de inkomende/uitgaande verwijzingen en voeg archiefindex/migratiebijlage toe in dezelfde commitserie; bescherm `main` en release-tag `v1.0.0`.

## DOC-E repositorybrede verwijzingsscan — preflightresultaat (2026-10-18)

Deze aanvulling bewaart de oorspronkelijke triage en voegt de gevraagde volledige gerichte verwijzingsscan toe. Er zijn in deze preflight **geen bestanden verplaatst of verwijderd**.

### Baseline en methode

- Branch: `chore/wie-v1-1-doc-e-batch-2-preflight`; gecontroleerde baseline: `ff62099f851454846bb442f28b790f33cedb02c0`.
- Per exacte basename, oud pad `docs/<naam>` en voorgesteld pad `docs/archive/doc-e-batch-2/<naam>` is `git grep -n -I -i -F` op de volledige tracked repositorysnapshot uitgevoerd. Dit dekt alle tracked tekstbestanden; Git's `-I` negeert binaire bestanden.
- Uitgaande Markdown-doelen van de vier kandidaten zijn afzonderlijk uitgelezen; alle huidige lokale doelen bestaan.
- De document-SHA's hieronder zijn Git blob-SHA's van de gecontroleerde baseline, waarmee de exacte historische broninhoud is geïdentificeerd.
- Externe GitHub-verwijzingen naar oude blob-URL's, vrije tekst buiten deze repository en verwijzingen in niet-uitgecheckte branches zijn niet gescand.

### Verificatiematrix en padmapping

| Huidig → voorgesteld pad | Inkomende verwijzingen op deze baseline | Uitgaande relatieve links | Compatibiliteitsbestand | Acceptatie-/regressiebewijs |
|---|---|---|---|---|
| `docs/M8b-3-CONSOLIDATION-REPORT.md` → `docs/archive/doc-e-batch-2/M8b-3-CONSOLIDATION-REPORT.md` | Actieve Markdown-links: `AGENTS.md` regel 70; `docs/DEVELOPMENT-ROADMAP.md` regels 254 en 268. Platte padvermelding: `docs/M8b-3-CONSOLIDATION-PLAN.md` regel 68. Historische inventaris-/triagevermeldingen: `docs/WIE-DOC-INVENTORY-v1.0.0.md` regel 137 en deze triage. | Geen lokale relatieve links; de PR #23-links in het verslag zijn absolute GitHub-URL's. | Niet nodig voor aangetroffen interne verwijzingen; die links zijn in een latere archiverings-PR bij te werken. Externe oude blob-URL's zijn onbewezen. | Definitieve gebruikersacceptatie 16 okt. 2026 en merge PR #23 vastgelegd; 705/705 Node en volledige Edge-regressie gerapporteerd. Baselineblob `ab525fa074f5b6dad945b46f85454100669e69f6`, 10.319 bytes. |
| `docs/M8-INT-0-IMPLEMENTATION-REPORT.md` → `docs/archive/doc-e-batch-2/M8-INT-0-IMPLEMENTATION-REPORT.md` | Actieve Markdown-links: `docs/DEVELOPMENT-ROADMAP.md` regels 208 en 231. Platte padvermelding: `docs/M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md` regel 434. Historische inventaris-/triagevermeldingen: inventaris regel 116 en deze triage. | Geen lokale relatieve links. | Niet nodig voor aangetroffen interne verwijzingen; die links zijn in een latere archiverings-PR bij te werken. Externe oude blob-URL's zijn onbewezen. | Gebruikersacceptatie 17 okt. 2026 staat in het verslag; de roadmap bevestigt integratie via PR #27. Het verslag rapporteert 713/713 Node en gerichte plus volledige Edge PASS. Baselineblob `0139c0325bd52c7188671f79e614e58bf6bfa2e2`, 5.548 bytes. |
| `docs/M8-INT-1-IMPLEMENTATION-REPORT.md` → `docs/archive/doc-e-batch-2/M8-INT-1-IMPLEMENTATION-REPORT.md` | Actieve Markdown-links: `docs/DEVELOPMENT-ROADMAP.md` regels 208 en 237. Platte padvermelding: `docs/M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md` regel 258. Historische inventaris-/triagevermeldingen: inventaris regel 118 en deze triage. | Twee lokale links moeten bij verhuizing worden gewijzigd: `M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md` → `../../M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md`; `M8-INT-1-PREFLIGHT.md` → `../../M8-INT-1-PREFLIGHT.md`. PR #28-links zijn absolute GitHub-URL's en blijven gelijk. | Niet nodig voor aangetroffen interne verwijzingen als bovenstaande links mee worden bijgewerkt. Externe oude blob-URL's zijn onbewezen. | Gebruikersacceptatie inclusief UX-correctie en integratie via PR #28 staan in het verslag; 735/735 Node, gerichte M8-INT-Edge en volledige Edge PASS met `pageErrors: []` gerapporteerd. Baselineblob `aa36679d7949cf4939321b881dcafdb3549d33bd`, 5.622 bytes. |
| `docs/M8a-2-POINT-ON-ELLIPSE-IMPLEMENTATION.md` → `docs/archive/doc-e-batch-2/M8a-2-POINT-ON-ELLIPSE-IMPLEMENTATION.md` | Geen inkomende operationele Markdown-link of code/config/testpad gevonden. Alleen de historische DOC-E-triage (regel 50) en inventaris (regel 129) noemen het pad. | Geen lokale relatieve links; PR #16- en Actions-links zijn absolute GitHub-URL's. | Geen interne alias nodig; er zijn geen actieve in-repository inkomende links gevonden. Externe oude blob-URL's zijn onbewezen. | Gebruikersacceptatie 15 okt. 2026 en PR #16 staan in het verslag; 659/659 Node en volledige Edge PASS gerapporteerd. De eerste Edge-poging strandde eerder op een bestaande teksteditor-timeout; poging 2 slaagde, oorzaak van de eerste timeout bleef onbekend. Baselineblob `ed7d2de709b056ec17a6726efc59472eb98361f8`, 10.439 bytes. |

### Uitvoering bij een latere archiveringsopdracht

1. Werk de drie M8b-links in `AGENTS.md`/roadmap volgens de matrix bij; werk de vier M8-INT-links in de roadmap bij en corrigeer de twee volledige padvermeldingen in de relevante M8-INT-contracten.
2. Wijzig de twee relatieve links in het M8-INT.1-verslag naar `../../...`; de overige drie verslagen hebben geen uitgaande relatieve link die door deze bestemming verandert.
3. Behoud `docs/WIE-DOC-INVENTORY-v1.0.0.md` als historische snapshot en voeg pas bij een daadwerkelijke verhuizing een expliciet gemarkeerde migratiebijlage toe. Werk een actuele archiefindex bij zodat de vier rapporten en de fullscreen-/releasebewijsketen vindbaar blijven.
4. Een oude-pad-stub is voor de gevonden interne verwijzingen niet vereist. Voeg er alleen een toe als later concreet gebruik van externe oude GitHub-blob-URL's wordt aangetoond.

**Bewijsgrens/risico:** de vier volledige rapporten op deze baseline bevatten de historische acceptatiebesluiten, testuitkomsten en genoemde uitzonderingen; hun blobs zijn in deze preflight niet gewijzigd. Dit bevestigt behoud in Git op deze basis, niet dat externe links of niet-uitgecheckte branches alle verwijzingen hebben bijgewerkt. De rapporten zelf mogen bij een latere verplaatsing inhoudelijk niet worden herschreven.

**Oordeel DOC-E verwijzingspreflight: CONDITIONAL GO voor een afzonderlijke archiverings-PR**, op voorwaarde dat de drie M8b-verwijzingen, de vier M8-INT-roadmaplinks, de twee volledige contractpadvermeldingen en de twee uitgaande M8-INT.1-links in dezelfde wijziging worden gecorrigeerd, de inventaris als snapshot behouden blijft en de archiefindex wordt toegevoegd. **Deze scan geeft geen uitvoerings-GO om nu te verplaatsen**; externe oude blob-URL's blijven onbewezen.

## 5. Besluit

**GO voor een gerichte, lokale verwijzingsscan van vier kandidaten. NO-GO voor onmiddellijk verplaatsen.** Vier rapporten hebben een expliciete acceptatie-/integratieketen; de overige veertien worden niet stilzwijgend als volledig geaccepteerd behandeld. DOC-C's zeven gearchiveerde documenten worden niet opnieuw aangeraakt.

## DOC-E uitvoering — archiveringsbatch 2 (18 oktober 2026)

**Uitvoerings-GO:** door producteigenaar verleend na de CON­DITIONAL-GO-preflight; de uitvoering staat afzonderlijk op `chore/wie-v1-1-doc-e-batch-2-archive` voor een PR naar `develop`. Dit besluit en deze bijlage wijzigen de historische preflight of oudere onbesliste acceptaties niet.

**Vier historische rapporten verplaatst** naar `docs/archive/doc-e-batch-2/` zonder hun acceptatie-, regressie- of andere bewijsinhoud te herschrijven:

- `docs/M8b-3-CONSOLIDATION-REPORT.md` → `docs/archive/doc-e-batch-2/M8b-3-CONSOLIDATION-REPORT.md` (M8b-3-consolidatie).
- `docs/M8-INT-0-IMPLEMENTATION-REPORT.md` → `docs/archive/doc-e-batch-2/M8-INT-0-IMPLEMENTATION-REPORT.md` (M8-INT.0).
- `docs/M8-INT-1-IMPLEMENTATION-REPORT.md` → `docs/archive/doc-e-batch-2/M8-INT-1-IMPLEMENTATION-REPORT.md` (M8-INT.1).
- `docs/M8a-2-POINT-ON-ELLIPSE-IMPLEMENTATION.md` → `docs/archive/doc-e-batch-2/M8a-2-POINT-ON-ELLIPSE-IMPLEMENTATION.md` (M8a-2).

**Verwijzingen gelijktijdig gemigreerd:**

- Zeven inkomende Markdown-links: één in `AGENTS.md` en zes in `docs/DEVELOPMENT-ROADMAP.md`.
- Drie expliciete repo-padvermeldingen: in `docs/M8b-3-CONSOLIDATION-PLAN.md`, `docs/M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md` en `docs/M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md`.
- Twee uitgaande relatieve Markdown-links in het verplaatste `M8-INT-1-IMPLEMENTATION-REPORT.md`, naar `../../M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md` en `../../M8-INT-1-PREFLIGHT.md`.
- [DOC-E archiefindex](archive/doc-e-batch-2/README.md), [centrale archiefindex](archive/README.md) en tweede migratiebijlage bij de [oorspronkelijke inventaris](WIE-DOC-INVENTORY-v1.0.0.md) houden de bewijzen vindbaar; het eerste DOC-C-archief blijft behouden.

De definitieve verificatie van archiefbestanden, SHA's, interne links, achtergebleven verwijzingen, diff en PR vindt in de uitvoerings-PR plaats en mag alleen als PASS worden gerapporteerd na daadwerkelijke verificatie.

**Restrisico:** oude externe `blob/main/docs/...`-links en verwijzingen buiten de repository waren niet volledig te onderzoeken. Er zijn geen oude-pad-stubs toegevoegd; maak die alleen wanneer concreet externe linkgebruik blijkt. Productiecode, tests, de 14 overige triagerapporten, `main` en release-tag `v1.0.0` horen buiten deze wijziging te blijven.
