# WIE — Centrale documentatie-index

**Documentversie:** 1.0.0  
**Peildatum:** 18 oktober 2026  
**Scope:** WIE — Wiskundige Illustratie Editor, binnen From Zero 2 Infinity  
**Status:** navigatie- en statusindex voor `develop`, geen nieuw functioneel contract of implementatie-GO.

Deze index is het **startpunt voor documentatie**, zowel voor ontwikkelaars als voor Codex. Hij is geen vervanging van de inhoudelijke contracten, de repositorycode, de acceptatierapporten of de releasebewijzen. Controleer bij elke nieuwe opdracht eerst de actuele branch, commit, werkelijk geladen modules en goedgekeurde productbesluiten.

## 1. Begin hier

| Vraag | Lees eerst | Gebruik |
|---|---|---|
| Wat bevat de uitgebrachte editor? | [WIE v1.0.0 — release notes](WIE-V1-RELEASE-NOTES.md) · [Hoofd-README](../README.md) | De **vrijgegeven scope**, beperkingen en startinstructies |
| Wat is op dit moment geïntegreerd of gepland? | [Development Roadmap](DEVELOPMENT-ROADMAP.md) · [Feature Backlog](FEATURE-BACKLOG.md) | De **actuele kopstatus** boven de historische checkpoints; backlog is geen automatische GO |
| Welke afspraken gelden voor Codex en branches? | [AGENTS.md](../AGENTS.md) | Bronvoorrang, afbakening, autorisatie, tests en Git-protocol |
| Welke technische contracten moet ik raadplegen? | [§2 — Architectuur](#2-technische-basis-en-contracten) · [§3 — Onderwerpen](#3-ontwerp-en-ontwikkelonderwerpen) | Kies alleen de relevante normatieve en aanvullende documenten |
| Wat vereist nog expliciete acceptatie? | [§4 — Openstaande poorten](#4-openstaande-acceptaties-en-restrisicos) | Voorkom dat oude PASS-rapporten als gebruikersacceptatie gelden |
| Waar zijn oude verslagen gebleven? | [Historisch archief](archive/README.md) · [§5](#5-historie-releasebewijs-en-archief) | Bewijs, oude besluiten, eerdere implementaties en padmigraties |

### Versie- en statusregels

- `main` bevat de stabiele **[WIE v1.0.0-release](https://github.com/Geert1985/wiskundige-illustratie-editor/releases/tag/v1.0.0)** op commit `4257e40d9ee85595844c5cfdd36e4d9b822cdda5`. De `v1.0.0`-tag is onveranderlijke releasehistorie.
- `develop` is de integratiebasis voor toekomstige ontwikkelingen en documentatie; **ontwikkel- en archiefwijzigingen op `develop` zijn niet automatisch onderdeel van v1.0.0**.
- Onderscheid altijd **ontwerp goedgekeurd**, **op een featurebranch geïmplementeerd**, **gericht getest**, **handmatig geaccepteerd**, **gemerged** en **officieel gereleased**. Dat zijn verschillende statussen.
- Gedateerde statuszinnen in historische secties blijven herleidbare momentopnamen. Raadpleeg de actuele statuskop, release-inhoud en broncode voordat je conclusies trekt.
- Bij spanning tussen document en code: de code toont de feitelijke toestand; het recentste expliciet goedgekeurde productbesluit bepaalt het gewenste gedrag. Meld een conflict vóór wijzigingen (zie [AGENTS.md](../AGENTS.md)).

## 2. Technische basis en contracten

De hierna genoemde documenten zijn **inhoudelijke referenties voor hun eigen domein**, maar niet elke paragraaf beschrijft automatisch de nieuwste implementatiestatus.

| Domein | Startdocument | Reikwijdte |
|---|---|---|
| Documentdata en compatibiliteit | [DOCUMENT-FORMAT.md](../DOCUMENT-FORMAT.md) | JSON-formaat, schema's, roundtrip en legacy |
| Geometrische constructies | [CONSTRUCTIONS.md](../CONSTRUCTIONS.md) | Gekoppelde objecten en afhankelijkheden |
| Architectuur en servicegrenzen | [CORE-1](CORE-1-ARCHITECTURE-DESIGN.md) | Gedeelde geometrie-, autorisatie- en gereedschapsarchitectuur; bevat ook historische checkpoints |
| Radiaalmenu en constructietoegang | [UI-RADIAL-9](UI-RADIAL-9-CONTRACT-DRIVEN.md) | Actuele contractgestuurde contextinteractie, in samenhang met [AGENTS.md](../AGENTS.md) |
| Gereedschapslevenscyclus | [Lifecycle-ontwerp](WIE-GEREEDSCHAPSLEVENSCYCLUS-Contract-v1.0.0.md) | UX- en controllerafspraken; toets beoogde status aan de [roadmap](DEVELOPMENT-ROADMAP.md) |
| Interactie en weergave | [INTERACTION-RENDER.md](../INTERACTION-RENDER.md) · [SNAPPING.md](../SNAPPING.md) | Input, rendering en snapping |
| Objectmodellen | [LINEAR-OBJECTS.md](../LINEAR-OBJECTS.md) · [POLYGONS.md](../POLYGONS.md) | Lineaire geometrie en veelhoeken |
| Metingen, groepen en eigenschappen | [MEASUREMENTS-GROUPS.md](../MEASUREMENTS-GROUPS.md) · [STYLES.md](../STYLES.md) | Metingen, documentorganisatie en opmaak |
| Selectie en mutatie | [MUTATION-SELECTION.md](../MUTATION-SELECTION.md) | Bewerkings- en selectiegrenzen |
| Prestaties | [PERFORMANCE.md](../PERFORMANCE.md) | Beperkingen en historische meetmethoden, geen algemene prestatiegarantie |
| Testdocumentatie | [tests/README.md](../tests/README.md) | Relevante gerichte Node-/browserproeven en testinstructies |

## 3. Ontwerp- en ontwikkelonderwerpen

### Geometrie en constructies

- **M8a — Ellipsen:** [ellipscontract](M8a-ELLIPSEN-CONTRACT.md). Kernfasen M8a-1, M8a-2 en M8a-1b zijn vóór v1.0.0 op `main` geïntegreerd; latere voorstellen zijn niet vanzelf vrijgegeven.
- **M8b — Parallellogrammen:** [M8b-contract](M8b-PARALLELLOGRAMMEN-CONTRACT.md). M8b-3 is definitief geaccepteerd en geïntegreerd; [historisch eindbewijs](archive/doc-e-batch-2/M8b-3-CONSOLIDATION-REPORT.md).
- **M8-INT — Snijpunten:** [overkoepelend contract](M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md) en [lijn–ellips](M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md). M8-INT.0/.1 zijn geïntegreerd; [historische eindrapporten](archive/doc-e-batch-2/README.md) zijn gearchiveerd.
- **M8-INT.3 — Kegelsneden onderling:** [hoofdontwerp](M8-INT-3-KEGELSNEDEN-SNIJPUNTEN-ONTWERPCONTRACT.md) en [A-MVP-identiteitscontract](M8-INT-3-A-MVP-IDENTITEITSCONTRACT.md). **Optie A eerst**, optie B is [uitgesteld onderzoek](M8-INT-3-SOLUTIONKEY-IDENTITEITSCONTRACT.md); eerdere ontwerp-/preflightresultaten zijn geen automatische code- of merge-GO.
- **M-PATH.0 — Punt op object:** [contract v1.0.1](WIE-M-PATH-0-Ontwerp-en-implementatiecontract-v1.0.1.md) en [bijbehorende preflight](M-PATH-0-PREFLIGHT-REPORT.md). Dit document bevat historische stop-/preflightpoorten; controleer de feitelijke releasecode en recentere rapporten vóór een nieuwe opdracht.
- **M7-VEC-FUND — Vectorfundament:** [goedgekeurd ontwerpcontract](M7-VEC-FUND-CONTRACT.md), **geen vrijgegeven implementatie-GO**. Dit is te onderscheiden van de vrije vector die reeds in v1.0 bestaat en van de aparte M7a–c-transformaties.

### Tekst, formules en algebra

- **Bestaande teksteditor:** [TEXT-EDITOR-ARCHITECTURE.md](TEXT-EDITOR-ARCHITECTURE.md) en [implementatieplan](TEXT-EDITOR-IMPLEMENTATION-PLAN.md); de [release notes](WIE-V1-RELEASE-NOTES.md) zijn leidend voor de daadwerkelijk beschikbare v1.0-tekstfuncties.
- **WIE-TXT-FORM:** [dynamische formules en meetwaarden — ontwerp](WIE-TXT-FORM-DYNAMISCHE-FORMULES-CONTRACT.md), [read-only architectuuraudit](WIE-TXT-FORM-0-ARCHITECTUURAUDIT-v1.0.0.md). Het bredere nieuwe formule-uitwerkingscontract is **niet impliciet gereleased** door bestaande dynamische waarden of inline LaTeX.
- **T5b — Wetenschappelijke rekenmachine:** [UX-/integratiecontract](WIE-T5b-UX-Contract-v1.0.2.md); **afzonderlijke implementatie- en acceptatiepoort**. T5c berekende inlinefragmenten zijn eveneens niet automatisch vrijgegeven.
- **WAT — Wiskundige Analyse- en Transformatietool:** een **zelfstandige toekomstige webapp** voor visuele formulemanipulatie en symbolische algebra, geen ingebouwde WIE-formule-editor. De [WIE-FORM](WIE-FORM-FORMULE-EDITOR-ONTWERPCONTRACT.md)- en [WIE-ALG](WIE-ALG-INTERACTIEVE-ALGEBRA-ONTWERPCONTRACT.md)-documenten zijn **vervallen historische WIE-richtingen**, geen actieve WIE-implementatieopdrachten en evenmin automatisch een definitief WAT-contract.

### Andere geplande onderwerpen

- [Productvisie](PRODUCT-VISION.md) beschrijft ook een toekomstige cursusviewer en assessment-runtime; die zijn niet zonder meer mee gereleased in de zelfstandige WIE-editor.
- [Feature Backlog](FEATURE-BACKLOG.md) en [Development Roadmap](DEVELOPMENT-ROADMAP.md) bevatten de verdere prioriteiten. Pas na afzonderlijk productbesluit, status-/codepreflight en acceptatiepoort ontstaat uitvoeringsautorisatie.

## 4. Openstaande acceptaties en restrisico's

**Let op:** de lijsten hieronder geven de **documentaire status van de audits op 18 oktober 2026**. Ze claimen geen nieuwe handmatige verificatie; latere expliciete besluiten kunnen de status wijzigen.

| Dossier | Aandachtspunt | Bron |
|---|---|---|
| DOC-A — vijf oorspronkelijke verslagen | `CONSTRUCTION-HOVER`, `FULL-CANVAS-AXES`, `BISECTOR-CLIP-SPLIT-TOOLS`, `M2c-VISUAL-FINISH` en `M2c-INSPECTOR-FEEDBACK`: bij de eerste archiveringsaudit **openstaande gebruikersacceptatie**; daarom niet verplaatst | [DOC-A classificatie](WIE-DOC-A-BATCH-1-CONTENT-REVIEW.md) |
| DOC-E — veertien extra rapporten | Een deel heeft nog open acceptatie, gedateerde premergeclaims of onvolledig gereconcilieerde status; **niet als gesloten markeren door de v1.0-release alleen** | [DOC-E triagematrix](WIE-DOC-E-BATCH-2-TRIAGE-v1.0.0.md) |
| Gereedschapslifecycle L4/L5 | Eerder gerapporteerde beperkingen van browser-/native-dialog-/Escape-controle en gerichte testdekking: status apart verifiëren | [L4-rapport](WIE-TOOL-L4-REPORT.md) · [L5.2-rapport](WIE-TOOL-L5-2-REPORT.md) |
| Toekomstige contracten | Bijvoorbeeld M7-VEC-FUND, T5b/T5c, M8-INT.3 en delen van WIE-TXT-FORM hebben afzonderlijke GO-/preflightgrenzen | De contracten in [§3](#3-ontwerp-en-ontwikkelonderwerpen) |
| Historische externe links | Oude externe GitHub-bloblinks na DOC-C/DOC-E-archivering zijn niet uitputtend gecontroleerd | [Archiefindex](archive/README.md) · [DOC-E rapport](WIE-DOC-E-BATCH-2-TRIAGE-v1.0.0.md) |

Open acceptatie betekent niet noodzakelijk dat de functionaliteit ontbreekt of defect is. Een automatisch testresultaat, PR-merge en handmatig gebruikersakkoord moeten **apart** worden geregistreerd.

## 5. Historie, releasebewijs en archief

- [WIE v1.0.0 — officiële release notes](WIE-V1-RELEASE-NOTES.md) en [releasegate-rapport](WIE-V1-RELEASE-GATE-2-REPORT.md): historische releasegrondslag.
- [Centrale archiefindex](archive/README.md): **11 gearchiveerde rapporten** uit twee afzonderlijk gecontroleerde batches; inclusief het historische fullscreen/Escape-verslag.
- [DOC-A: oorspronkelijke inventaris](WIE-DOC-INVENTORY-v1.0.0.md), [documentatie-audit](WIE-DOC-AUDIT-v1.1.0.md) en [DOC-A/DOC-C-verwijzings- en pilotrapport](WIE-DOC-A-BATCH-1-CONTENT-REVIEW.md): classificatie en eerste migratie.
- [DOC-E triage, verwijzingspreflight en uitvoeringsbijlage](WIE-DOC-E-BATCH-2-TRIAGE-v1.0.0.md): tweede archiveringsronde en expliciet opengebleven vragen.
- Overige gedateerde `*-REPORT.md`, preflight-, verificatie- en implementatiebestanden **buiten het archief** blijven beschikbaar als historisch bewijs, maar zijn niet automatisch huidige ontwerpnormen of uitvoeringsopdrachten.

## 6. Werkwijze bij wijzigingen aan documentatie

1. Werk vanaf een eigen branch op de actuele `develop`, tenzij een expliciete release- of hotfixopdracht anders bepaalt.
2. Verifieer de feitelijke code/status, normatieve ontwerpversie, gebruikersacceptatie en inkomende/uitgaande verwijzingen **voordat** je een status wijzigt of document verplaatst.
3. Bewaar historische statuspassages en testbewijzen; voeg liever een gedateerde annotatie of migratiebijlage toe dan een vroegere conclusie te herschrijven.
4. Houd links van deze index, `AGENTS.md`, roadmap, contracten en archiefindices correct. Verplaats historische rapporten alleen met expliciete mapping, referentiescan en afzonderlijke PR.
5. Voer **gerichte** link-, syntaxis- en diffcontroles uit. Vraag geen volledige Node-/Edge-run voor documentatie-only wijzigingen.
6. Merge pas na beoordeling volgens het Git-/releasebeleid. `main` en `v1.0.0` mogen door deze index geen wijzigingen krijgen.

Deze index wordt bijgewerkt wanneer de geldige documentatie-ingangen of expliciete acceptatiebesluiten veranderen; de releasehistorie blijft bestaan.
