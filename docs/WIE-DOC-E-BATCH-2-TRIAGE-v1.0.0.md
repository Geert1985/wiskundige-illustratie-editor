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

## 5. Besluit

**GO voor een gerichte, lokale verwijzingsscan van vier kandidaten. NO-GO voor onmiddellijk verplaatsen.** Vier rapporten hebben een expliciete acceptatie-/integratieketen; de overige veertien worden niet stilzwijgend als volledig geaccepteerd behandeld. DOC-C's zeven gearchiveerde documenten worden niet opnieuw aangeraakt.
