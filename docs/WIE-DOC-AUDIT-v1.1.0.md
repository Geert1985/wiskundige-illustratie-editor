# WIE v1.1 — Documentatie-audit en archiveringsvoorstel

**Versie:** 1.0.0  
**Datum:** 2026-10-18  
**Status:** audit/voorstel; **geen archiverings-GO**  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Werkbranch:** `chore/wie-v1-1-docs-audit`, vertakt van `develop` op `4257e40d9ee85595844c5cfdd36e4d9b822cdda5`  
**Referentie-release:** WIE v1.0.0, tag `v1.0.0`, dezelfde SHA.

## 1. Scope en methode

Inventarisatie van alle `.md`-bestanden in de volledige, niet-afgekorte Git-tree van `develop` (totaal **201**, waaronder **183** in `docs/`). De bestandslijst en eerste indeling staan in [de inventaris](WIE-DOC-INVENTORY-v1.0.0.md). Rubrieken zijn primair uit bestandsnamen afgeleid; enkele belangrijke bestanden zijn inhoudelijk steekproefsgewijs gelezen. **Er is geen volledige inhoudelijke audit van alle 201 bestanden en geen volledige linkgraph-analyse uitgevoerd.** Bewijs- en ontwerpstatus mogen niet uitsluitend uit namen worden afgeleid.

Geen code-, workflow-, test-, release- of bestaande documentatiebestanden aangepast. Geen archiefmigratie, hernoeming of verwijdering.

## 2. Bevindingen

1. **Hoge historische documentatiedichtheid.** De inventaris telt **104** bestanden die op basis van hun naam vooral rapporten/audits/verificatie zijn. Die zijn potentiële archiefkandidaten, **niet automatisch verplaatsbaar**.
2. **Actieve toegang tot historische rapporten.** `AGENTS.md` verwijst rechtstreeks naar meerdere oudere UI- en M8b-rapporten; `docs/DEVELOPMENT-ROADMAP.md` verwijst rechtstreeks naar de reeks `WIE-TOOL-L1` t/m `L5`-rapporten. Verplaatsen zonder linkmigratie kan de Codex-instructies en de historische traceerbaarheid beschadigen.
3. **Achterlopende statusclaims.** `docs/FEATURE-BACKLOG.md` (kopdatum 2026-10-15) noemt M8a/M8b nog 'ontwerp, niet geïmplementeerd', terwijl `main` bij v1.0.0 al geaccepteerde implementaties bevat. `docs/DEVELOPMENT-ROADMAP.md` (kopdatum 2026-10-17) bevat tijdgebonden branch-/mergecheckpoints. `docs/TEXT-EDITOR-ARCHITECTURE.md` verwijst nog naar oudere T5b/T5c-fasestatus; verifieer tegen v1.0 voordat dit als actuele instructie wordt gebruikt.
4. **Vervallen productrichting in WIE.** `docs/WIE-FORM-FORMULE-EDITOR-ONTWERPCONTRACT.md` en `docs/WIE-ALG-INTERACTIEVE-ALGEBRA-ONTWERPCONTRACT.md` zijn al expliciet historisch gemarkeerd. De volwaardige formule-/algebra-app hoort bij **WAT**, niet bij WIE. Bewaar de ideeën, maar voorkom dat oude WIE-contracten als actieve Codex-opdracht worden geïnterpreteerd.
5. **Versies en alias-documenten.** `docs/M7a-VECTORFUNDAMENT-CONTRACT.md` is een compatibiliteitsalias naar M7-VEC-FUND; laat de alias voorlopig staan. `WIE-M-PATH-0` kent documentversies v1.0.0/v1.0.1; de geldende status moet op inhoud en goedkeuringsgeschiedenis beoordeeld worden.
6. **Releasebewijs behouden.** `docs/WIE-V1-RELEASE-NOTES.md` is de huidige releasebron; `docs/WIE-V1-RELEASE-GATE-2-REPORT.md` is historisch bewijs en kan pas na verwijzingscontrole naar een release-archief. De v1.0.0-tag zelf mag nooit worden herschreven.
7. **Licenties bij assets.** De experimentmappen bevatten licenties en third-party notices. Deze zijn geen gewone testverslagen en mogen niet los van hun afhankelijkheden worden geherstructureerd.

## 3. Voorgestelde documentatiestructuur op `develop`

```text
README.md                  # gebruikersingang
AGENTS.md                  # operationele code-agentregels
DOCUMENT-FORMAT.md        # actueel bestandscontract
CONSTRUCTIONS.md, ...     # kerntechnische documentatie
docs/
  README.md               # nieuwe inhoudsindex (latere stap)
  DEVELOPMENT-ROADMAP.md  # actieve roadmap, opgeschoond na statusverificatie
  FEATURE-BACKLOG.md      # actuele backlog
  PRODUCT-VISION.md       # productvisie, met expliciet scope-onderscheid
  ...                     # actieve ontwerpcontracten/ADR's
  releases/
    v1.0.0/                # optionele samenvatting/acceptatie-index
  archive/
    v1.0/
      audits/
      implementation-reports/
      verification/
      superseded-designs/
    cross-project/         # historische WIE-FORM/WIE-ALG, verwijzingen naar WAT
```

Dit is een **conceptindeling**; paden, aliases en verplaatsingen zijn nog niet goedgekeurd.

## 4. Gefaseerde uitvoering met gates

**DOC-A — classificatie/afhankelijkheden (eerst).** Controleer alle potentiële archiefbestanden inhoudelijk in batches (bijvoorbeeld 10–20) en inventariseer **alle** Markdown-links plus platte bestands-/padverwijzingen in Markdown, code, tests, scripts en configuratie. Label ieder bestand: ACTIEF / HISTORISCH / VERVALLEN / ALIAS / ONBESLIST. Stel een expliciete 'oud pad → nieuw pad'-mapping op. Bepaal document-eigenaar en contractvoorrang; stop bij onduidelijkheid.

**DOC-B — actuele ingangspunten.** Pas eerst de topdocumenten aan de v1.0.0-baseline en v1.1-plannen aan: `AGENTS.md`, `docs/DEVELOPMENT-ROADMAP.md`, `docs/FEATURE-BACKLOG.md`, `docs/TEXT-EDITOR-ARCHITECTURE.md`. Leg vast dat `main` uitsluitend stabiele releases bevat; featurebranches vertrekken vanuit `develop`. Deze wijzigingen blijven gescheiden van de historische archiveringsverplaatsingen.

**DOC-C — pilotverplaatsing.** Verplaats **maximaal 10 expliciet goedgekeurde** historische rapporten op een afzonderlijke `chore/docs-archive-pilot`-branch vanaf de dan actuele `develop`. Werk alle inkomende/uitgaande relatieve links, platte padverwijzingen en inhoudsindex bij; gebruik een alias op het oude pad waar externe referenties/contracten dat vereisen.

**DOC-D — gerichte validatie.** Verifieer dat alle interne relatieve Markdown-links blijven werken, dat actuele `AGENTS.md`-/README-/architectuurverwijzingen niet kapot zijn en dat `git diff --check` slaagt. Gebruik alleen relevante kleine controles; **geen volledige Edge-run** voor documentverplaatsingen.

**DOC-E — goedkeuring.** Controleer de diff en classificatielijst, vraag producteigenaar GO/NO-GO voor de archiverings-PR naar `develop`. `main` en de bestaande tag `v1.0.0` worden niet gewijzigd.

## 5. Grenzen en risico's

- **Geen massale automatische verhuisactie.** Oude documenten hebben mogelijk actieve normatieve passages of externe GitHub-verwijzingen.
- **Git-geschiedenis blijft bestaan** na verplaatsing, maar dit garandeert niet dat actuele padlinks blijven functioneren.
- **Geen exacte volledigheidsclaim voor linkimpact** op basis van deze eerste inventaris; dat moet vóór de pilot worden bewezen.
- **Niet migreren naar WAT** zonder expliciet WAT-repository- en eigenaarschapsbesluit; een historisch WIE-document is niet automatisch een WAT-contract.
- **Geen automatische tests claimen**: deze audit vereist geen browser- of Node-test en heeft die niet uitgevoerd.

## 6. Besluitvoorstel

**GO voor DOC-A (inhoudelijke classificatie en volledige linkimpact-analyse); NO-GO voor directe bulkarchivering.** `docs/` bevat omvangrijke historie en de actieve ingangspunten bevatten aantoonbaar verouderde statusinformatie, maar voor verplaatsingen moet eerst referentiële integriteit worden vastgesteld.

De volgende actie na acceptatie van dit rapport is een *gerichtsgewijze inhouds- en verwijzingsaudit* op `develop`, niet het verplaatsen van alle bestanden tegelijk.
