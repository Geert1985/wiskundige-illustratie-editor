# WIE v1.1.0 — Roadmapvoorstel

- **Documentversie:** 0.2.0
- **Peildatum:** 18 oktober 2026
- **Status:** **VOORSTEL — niet goedgekeurd als releasescope of implementatieopdracht**
- **Repository:** `Geert1985/wiskundige-illustratie-editor`
- **Basis:** `develop` op `a411aa3dd4b22027ed230bcbdbedb0c8111526be`; stabiele WIE-release `v1.0.0` op `main` `4257e40d9ee85595844c5cfdd36e4d9b822cdda5`
- **Normatieve context:** [centrale documentatie-index](README.md), [actuele roadmap en historische checkpoints](DEVELOPMENT-ROADMAP.md), [featurebacklog](FEATURE-BACKLOG.md), [v1.0.0 release notes](WIE-V1-RELEASE-NOTES.md), [AGENTS.md](../AGENTS.md).

## 1. Visie en aanbeveling

WIE v1.0.0 bevat reeds een brede zelfstandige illustratie-editor: dynamische geometrie, meetwaarden, rijke tekst en export. De volgende versie bouwt voort op die basis zonder bestaande documentsemantiek te herschrijven.

**Bijgestelde planningsrichting van de producteigenaar (18 oktober 2026): neem ook de reeds in ontwikkeling zijnde T5b-rekenmachine op als expliciet beoogde WIE v1.1.0-functionaliteit.** WIE-TXT-FORM.1 blijft daarnaast een afzonderlijk gefaseerde kandidaat. Beide trajecten respecteren WIE's bestaande rekeneigenaarschap en staan los van de zelfstandige WAT-app.

**Voorkeursvariant B — twee functionele trajecten met afzonderlijke gates:**

1. **G0:** korte acceptatie- en risicoanalyse van de actuele ontwikkelbasis.
2. **C0/C1:** de lopende MathLive-POC afronden en een technisch T5b-integratiecontract goedkeuren.
3. **C2:** na afzonderlijk implementatie-GO één gedeelde wetenschappelijke rekenmachine voor WIE en de teksteditor bouwen, beperkt tot invoeren, evalueren, tonen en kopiëren.
4. **F1/F2:** TXT-FORM.1 technisch voorbereiden en, alleen na eigen GO, de beperkte dynamische cirkelformules voor oppervlakte en omtrek ontwikkelen.
5. **R1:** gerichte compatibiliteits-, test- en gebruikersacceptatie, gevolgd door een afzonderlijk release-GO.

**Prioritering:** de calculator is een expliciete beoogde v1.1.0-kernfunctie, omdat het onderzoek al loopt. TXT-FORM.1 blijft eveneens de aanbevolen release-uitbreiding, maar kan naar een volgende versie doorschuiven wanneer het schema-/veiligheidscontract niet tijdig gereed of goedgekeurd is. Bij blokkade van beide features is alleen na nieuw productbesluit een stabiliteitsrelease toegestaan.

**Let op verschillende variant-B-labels:** *roadmapvariant B* is deze releasescope. *T5b-POC-variant B* betekent MathLive-invoer met de bestaande WIE-T5a-evaluator, tegenover POC-variant A met CortexJS Compute Engine.

## 2. Basis, beperkingen en expliciet open werk

### 2.1 Al uitgeleverd; niet opnieuw plannen als nieuw

- WIE v1.0.0 [release notes](WIE-V1-RELEASE-NOTES.md) vormen de vrijgegeven productscope. M8a-ellipsen, M8b-parallellogrammen, M8-INT.0/.1 en de bestaande teksteditor zijn geen nieuwe v1.1.0-features.
- **Fullscreen + Escape:** de producteigenaar accepteerde expliciet het gedrag dat browser-fullscreen via Escape kan worden verlaten; zie de v1.0.0-[release notes](WIE-V1-RELEASE-NOTES.md). Het oudere [releasegate-2-rapport](WIE-V1-RELEASE-GATE-2-REPORT.md) bevatte daarvoor destijds een *bewijsleemte*. Die oude bewijsleemte wordt **niet** achteraf omgezet in een bewezen defect en de geaccepteerde UX wordt niet stilzwijgend gewijzigd.
- **Punt op object/M-PATH.0:** er zijn oudere NO-GO- en latere implementatie-/acceptatiecheckpoints. De [ontwerpcontractversie](WIE-M-PATH-0-Ontwerp-en-implementatiecontract-v1.0.1.md) alleen beschrijft niet de nieuwste integratiestatus. Controleer actuele code en releasescope alvorens een nieuwe M-PATH-opdracht te maken.
- Documentatieconsolidatie, twee archiveringsbatches en [de centrale index](README.md) staan op `develop`, **niet** op de getagde v1.0.0-release.

### 2.2 Risico's/vragen die een korte triage verdienen

- [DOC-A dossier](WIE-DOC-A-BATCH-1-CONTENT-REVIEW.md): vijf historische rapporten met destijds openstaande handmatige gebruikersacceptatie.
- [DOC-E triage](WIE-DOC-E-BATCH-2-TRIAGE-v1.0.0.md): veertien andere historische dossiers die open acceptatie, gedateerde premergeclaims of een apart browserbewijs kunnen bevatten. Een oud rapport geldt niet automatisch als releaseblokker; eerst de actuele code, gebruikersbesluiten en relevantie controleren.
- Gereedschapslifecycle (Escape/nested tekst-/dialoogroutes): [L4-rapport](WIE-TOOL-L4-REPORT.md) en [L5.2-rapport](WIE-TOOL-L5-2-REPORT.md). Gebruik alleen gerichte echte browserchecks wanneer een actuele route/risico onduidelijk blijft.
- Prestaties: [historische nulmeting](PERF-1-BASELINE-AUDIT.md), [invalidatiewijziging](PERF-1.2a-IMPLEMENTATION-REPORT.md) en [dragoptimalisatie](PERF-1.2b1-DRAG-INVALIDATION-REPORT.md). Werk met **circa 100 gemengde objecten als representatieve controle** en **circa 500 als afzonderlijke stresscase**, zonder historische machinegebonden cijfers als algemene SLA te publiceren.
- Documentcompatibiliteit, permissies, Undo/Redo, layer-/objectlabelgedrag, rich-text-formulefragmenten en JSON-/SVG-/PNG-pariteit vormen regressiegevoelige grenzen. Alleen het werkelijk geraakte deel hoeft tijdens normale featureontwikkeling opnieuw getest te worden.

### 2.3 Externe afhankelijkheden en raakvlak WAT

- **WAT — Wiskundige Analyse- en Transformatietool** is een apart project voor symbolische algebra, formuletransformaties, visuele termmanipulatie en algemene CAS-functionaliteit. **Geen algemene symbolische algebra-engine binnen WIE v1.1.0.**
- De bestaande [WIE-TXT-FORM v1.3.0](WIE-TXT-FORM-DYNAMISCHE-FORMULES-CONTRACT.md) gaat over brongebonden *geometrische formulepresentatie* in WIE; niet over vrije algebraïsche transformaties.
- **T5b — rekenmachine: expliciet beoogd voor v1.1.0.** Het [bestaande UX-/integratiecontract](WIE-T5b-UX-Contract-v1.0.2.md) blijft de vertrekbasis voor één component met twee WIE-hosts.
- Het lopende experiment is de [MathLive-POC op `test/t5b-mathlive-poc`](https://github.com/Geert1985/wiskundige-illustratie-editor/tree/test/t5b-mathlive-poc), met [POC-rapport](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/test/t5b-mathlive-poc/docs/T5B-MATHLIVE-POC-REPORT.md). GitHub toont experimentele commits **niet op de actuele `develop`**. Een proefresultaat is geen bewijs van productie-integratie.
- **Technische voorkeursroute (POC-optie B):** MathLive als formule-input, beperkte en gevalideerde adapter, daarna de bestaande WIE-T5a-rekenkern. De CortexJS Compute Engine is een vergeleken onderzoeksvorm, geen tweede productie-engine; WAT blijft een aparte applicatie.
- De uitbreiding [M7-VEC-FUND](M7-VEC-FUND-CONTRACT.md) is als ontwerp goedgekeurd; de zelfstandige vectorfundamentimplementatie en latere transformaties zijn **niet** impliciet onderdeel van v1.1.0.
- [M8-INT.3](M8-INT-3-KEGELSNEDEN-SNIJPUNTEN-ONTWERPCONTRACT.md): keuze **optie A eerst**, optie B later als afzonderlijk groeipad; onderzoek/implementatie is momenteel gepauzeerd en vergt nieuw expliciet GO voor hervatting.

## 3. Voorgestelde werkpakketten en poorten

| ID | Prioriteit | Resultaat | Status van dit voorstel | Vrijgavepoort |
|---|---|---|---|---|
| **V11-G0** | Verplicht, eerst | Baseline en acceptatie-/risicoregister op actuele `develop` | Te besluiten | Producteigenaar accepteert **scope**, niet automatisch de uitkomsten van oude audits |
| **V11-Q1** | Hoog | Kleine gerichte UX-/stabiliteitscorrecties, alleen voor bevestigde problemen | Voorwaardelijk | Reproduceerbaar scenario, klein contract, gerichte Node/Edge of handmatige check |
| **V11-P1** | Hoog | Performance- en documentintegriteitsbaseline vóór nieuwe dynamische formulevelden | Onderdeel van G0/Q1 waar relevant | Geen meetbare/regressieve verslechtering in representatieve gevallen; geen algemene refactor zonder bewijs |
| **V11-F1** | Hoog, nieuwe hoofdfeature | TXT-FORM.1 technisch ontwerp- en migratiecontract (G1–G6) | [Audit: CONDITIONAL GO voor ontwerp](WIE-TXT-FORM-0-ARCHITECTUURAUDIT-v1.0.0.md) | Producteigenaar keurt compleet implementatiecontract apart goed |
| **V11-F2** | Alleen na F1-GO | TXT-FORM.1 vertical slice: cirkeloppervlakte/-omtrek, `Waarde`/`Formule`, dynamische bronbinding | Niet geïmplementeerd/vrijgegeven door dit voorstel | Gerichte tests, privacy/schema/export, handmatige acceptatie, PR naar `develop` |
| **V11-R1** | Verplicht voor release | Stabilisatieronde, releasenotities, compatibiliteits- en acceptatiematrix | Nog niet gestart | Expliciet release-GO; `release/v1.1.0` → PR `main` → tag/release |

De werkpakketten zijn **geen kalenderplanning, technische inschatting of Codex-uitvoeringsautorisatie**. Een concrete taak wordt afzonderlijk uitgewerkt en gefaseerd goedgekeurd.

### V11-G0 — Baseline en acceptatietriage

**Doel:** betrouwbare, kleine basis vóór nieuwe wijzigingen.

- Vergelijk de actuele `develop`-HEAD met de v1.0.0-tag en registreer werkelijk aanwezige functionaliteit per relevante module/PR.
- Classificeer elk nog open auditpunt als **actueel defect**, **ontbrekend bewijs**, **historisch reeds afgedaan** of **bewust geaccepteerde beperking**. Registreer uitsluitend controleerbare feiten, de verantwoordelijke en exacte reproduceerstappen.
- Breng uit DOC-A de vijf dossiers en uit DOC-E de veertien dossiers onder in een **kort acceptatieregister**; dit is geen opdracht om negentien volledige browserproeven uit te voeren.
- Bevestig de reeds vastgelegde fullscreen-Escape-keuze en bestaand radiaalmenu-/multi-selectgedrag; heropen geen afgesloten UX-besluit zonder concrete nieuwe reden.
- Controleer de impact van `TXT-FORM.1` op bestaande documentversies, bron-/permissionprojectie en teksteditorbundel.

**Oplevering:** `docs/WIE-V1.1-ACCEPTATIE-EN-RISICOREGISTER.md` als voorstel; top 3–5 concrete ingrepen of expliciet 'geen defect geconstateerd'.

**Gate:** alleen bewezen en relevante P0/P1-problemen blokkeren op voorhand de volgende codefase; open historische notities zijn niet automatisch blokkades.

### V11-Q1 — Gericht stabiliteitswerk

Alleen waar G0 aantoonbaar problemen of onvoldoende testbewijs voor *kritieke actuele workflows* vindt.

- Controleer bijvoorbeeld bronselectie, toolwissel/annuleren, toetsenbordfocus, open/dicht van rich-text-paneel, gedeelde geselecteerde objecten en export in de werkelijk betrokken interactie.
- Kies per defect een mini-issue met verwacht/feitelijk gedrag, kleinste correctie, targeted tests en expliciete eindacceptatie. Geen massale UI-herschrijving.
- Behoud één eigenaar voor objectmutatie/history, renderwaarheid en autorisatie; maak geen dubbele calculator-/interactiekern.

**Gate:** geen nieuw P0/P1-regressieprobleem; relevante bewijs- en acceptatieketen traceerbaar.

### V11-P1 — Performance- en compatibiliteitscontrole

- Hergebruik gerichte bestaande PERF-fixtures; herbaseline alleen wanneer de nieuwe implementatie of branch wezenlijk verschilt. Ontbrekende gegevens blijven 'niet gemeten'.
- Meet waar TXT-FORM.1 nieuwe resolver-/rendererbelasting introduceert, met aandacht voor `resolveTextValue` en bronrechten. De statische [TXT-FORM.0-audit](WIE-TXT-FORM-0-ARCHITECTUURAUDIT-v1.0.0.md) noemt herhaalde indexconstructie als **potentieel schaalrisico, niet als bewezen defect**.
- Controleer fail-closed import, historische documentversies, bronverwijdering/herstel, duplicatie, autorisatie, Undo/Redo en export **alleen waar het nieuwe veld deze grenzen raakt**.
- Documenteer de hardware-/browsercontext; geen fictieve prestatie-SLA of vereiste nul milliseconden. Geen incrementele SVG-renderarchitectuur als standaard v1.1-taak.

### V11-F1 — TXT-FORM.1: contract vóór code

Uitgangspunt: [WIE-TXT-FORM v1.3.0](WIE-TXT-FORM-DYNAMISCHE-FORMULES-CONTRACT.md) plus [TXT-FORM.0-audit](WIE-TXT-FORM-0-ARCHITECTUURAUDIT-v1.0.0.md). **De audit heeft CONDITIONAL GO voor nadere technische uitwerking, niet voor productie-implementatie.**

Formuleer een zelfstandig **`WIE-TXT-FORM.1-Technisch-Implementatiecontract-v1.0.0`** met expliciete uitkomst voor:

1. G1 — typed inlinefragment, textSchema-/documentversie, backward compatibility en roundtrip.
2. G2 — precies bewezen geometrische broncapaciteiten en formules; begin met cirkelomtrek en -oppervlakte.
3. G3 — één gecontroleerde formulepresentatie voor editor, canvas, SVG en PNG; juiste afronding/eenheden.
4. G4 — autorisatie op ieder gebruikte bron en factor, inclusief restricted mode en async revisiewijzigingen.
5. G5 — minimaal UI-verloop via bestaand **Waarden**-paneel; preview, heropenen, annuleren, Undo/Redo en 'niet beschikbaar'.
6. G6 — realistische, kleine test-/acceptatiematrix. Begin gericht en vraag **geen volledige Edge-run** zonder expliciet besluit.

Vast te leggen **NO-GO**-voorwaarden: stille documentinformatieverliezen, verzonnen wiskundige punt-/zijderollen, onbetrouwbare formulewaarheid, restricted bronlek, gebrek aan exportpariteit, scopeverschuiving naar WAT-CAS.

### V11-F2 — TXT-FORM.1: kleine functionele slice (optioneel in v1.1)

**Minimum acceptance criteria na technische ontwerp-GO:**

- Vanuit één bestaande cirkel kan een tekstfragment de modus **Waarde** of **Formule** tonen voor `A = πr²` en `P = 2πr`; waarde blijft afkomstig van dezelfde geometrische meetwaarheid, niet een tweede onafhankelijke waarheid.
- Verander straal of verplaats/transformeer de bron: relevante waarden volgen dynamisch, binnen expliciet bewijsbare ondersteuning. Een ongeldig/verwijderd/verboden bronobject geeft veilig **niet beschikbaar**; object-ID, history en opslag blijven coherent.
- Bestaande `dynamicValue`-fragmenten openen en bewaren zonder ongevraagde migratie of mutatie van historische content.
- Bewijs JSON-roundtrip, onbevoegde bronprojectie, Undo/Redo, editor-/SVG-/PNG-pariteit en correcte beperkte formuleselectie met een handmatige WIE-acceptatie.
- **Niet in F2:** `Uitwerking` met substitutiestappen, alle polygonformules, ongetypeerde vrije formule-CAS, vergelijkingstransformaties en WAT-integratie. Rechthoekoppervlakte `A=a·b` pas na een bewezen rechthoekcapability, afzonderlijke scopebeslissing en tests.

**Fallback:** wanneer F1 niet wordt goedgekeurd of F2 niet veilig past, release v1.1.0 als kleinere kwaliteit-/stabiliteitsupdate en plan F2 in een volgende versie.

### V11-R1 — Releasevoorbereiding en acceptatie

- Vergelijk `develop` met de vastgestelde scope; een succesvolle feature-PR is niet dezelfde gebeurtenis als de release naar `main`.
- Voer een **risicogebaseerde, gerichte regressiematrix** uit en leg uitgevoerde/overgeslagen tests eerlijk vast. Alleen bij uitzonderlijk breed code- of schema-effect bespreekt de producteigenaar een groter testbudget; **geen automatische volledige Edge-run**.
- Laat producteigenaar de nieuwe gebruikerservaring en resterende risico's expliciet aftekenen.
- Publiceer `WIE v1.1.0` pas na expliciet release-GO via `release/v1.1.0`, pull request naar de beschermde `main`, tag en GitHub Release. Zorg dat `develop` en releasegeschiedenis consistent blijven.
- Werk centrale [documentatie-index](README.md), release-notities, statusregistratie en enkel relevante technische contracten bij; verplaats geen oude rapporten als verborgen bijtaak.

## 4. Bewust buiten de voorgestelde v1.1.0-commitscope

| Traject | Waarde | Waarom nu niet bundelen? | Volgende logische gate |
|---|---|---|---|
| **M7-VEC-FUND** en meetkundige transformaties | Verbeterde vectorconstructies en latere translatie/rotatie | Eigen gegevensmodel, afhankelijke constructies en acceptatiepad | Nieuwe implementatiepreflight en apart GO |
| **M8-INT.3 kegelsnedensnijpunten** | Snijpunten cirkel–ellips en ellips–ellips | Numerieke betrouwbaarheid, `solutionKey`, tangenties en identiteitsbehoud zijn zelfstandig risicovol; traject bewust gepauzeerd | Optie-A-preflight en expliciet hervattingsbesluit |
| **T5b/T5c / MathLive-verkenning** | Herbruikbare rekenmachine en berekende tekstwaarden | Vermijd dubbele engines, niet-geratificeerde UX en onbedoelde WAT-afhankelijkheid | Haalbaarheidsspiegeling, architectuur- en scopekeuze, aparte spike |
| **WIE-TXT-FORM.2/.3** | Uitwerkingen, bredere formulecatalogus, hergebruik | Hogere schema-/permissie-/wiskundige bewijscomplexiteit | Eerst formele acceptatie van F2 en nieuw contract |
| **Gecombineerde meting** | Meetwaardensom en geometrische vereniging in afzonderlijke fasen | Optellen van metingen is anders dan geometrische unie; elk verdient eigen algoritmische en UX-poort | Contract en twee onafhankelijke implementatiebesluiten |
| **Cursusviewer, assessment, WAT-CAS** | Breder From Zero 2 Infinity-platform | Andere productgrenzen en releasecyclus | Eigen project-/architectuurbesluit |
| **Massale documentatiearchivering** | Minder ruis | Eerste twee batches en centrale index zijn afgerond; meer archiveren vergroot in v1.1 weinig gebruikerswaarde | Alleen gerichte audit als blokkade ontstaat |

Deze onderwerpen blijven op de brede roadmap/backlog staan. **Buiten v1.1** betekent niet afgewezen of vergeten.

## 5. Scopevarianten voor productbesluit

| Keuze | Betekenis | Voordeel | Nadeel |
|---|---|---|---|
| **A — Kleine stabiliteitsrelease** | G0, gerichte Q1/P1, R1; geen nieuwe formuleslice | Korter risico- en releasepad | Weinig nieuwe zichtbare functionaliteit |
| **B — Evenwichtig (advies)** | A plus F1 en, alleen bij GO, **F2 met 2 cirkelformules** | Één gebruikerszichtbare verbetering met afgedekt risico | Schema-/permissions-/exportontwerp moet eerst worden afgerond |
| **C — Brede featureversie** | B plus vectoren, kegelsneden of calculator | Meer zichtbare functies | Meerdere grote risicopaden, uitgestelde release en moeilijkere regressies; **niet aanbevolen** |

**Voorgesteld productbesluit:** keur voor v1.1.0 **optie B als planningsrichting** goed. Geef eerst alleen **GO voor V11-G0** en de uitwerking van **F1 als technisch contract**. Implementatie van F2, daadwerkelijke Q1-fixes en de release zelf blijven afzonderlijke beslissingen. Houd optie A beschikbaar als terugval.

## 6. Veilig ontwikkel- en samenwerkingsprotocol

1. Iedere taak start vanaf actuele `develop` in een afzonderlijke branch; noteer start-SHA, scope, niet-doelen en relevante bestaande contracten.
2. Eerst een kleine, brongegronde inventaris en exact wijzigingscontract; daarna minimale implementatie met gerichte red/green-tests.
3. Geen nieuwe dubbele render-, command-, authorisatie- of rekeneigenaars. WIE/WAT-grenzen blijven expliciet.
4. Documenteer uitgevoerde testcommando's, handmatige acceptance, resterende risico's en compatibiliteitsbewijs; claim nooit niet-uitgevoerde Edge-/browserproeven als PASS.
5. Laat de producteigenaar de afzonderlijke ontwerp-, implementatie-, PR-merge- en releasepoorten controleren. `main` en de bestaande tag `v1.0.0` blijven stabiel.

## 7. Open besluitregister

| ID | Vraag | Status |
|---|---|---|
| D-01 | Wordt **optie B** de beoogde v1.1.0-scope, met optie A als fallback? | **Voorgesteld; goedkeuring nodig** |
| D-02 | Mogen we **V11-G0** (gerichte acceptatie-/risicoreconciliatie) uitvoeren? | **Voorgesteld; goedkeuring nodig** |
| D-03 | Mogen we het **TXT-FORM.1-technisch implementatiecontract** (G1–G6) voorbereiden? | **Voorgesteld; goedkeuring nodig** |
| D-04 | Welke actuele, aantoonbare Q1-defecten verdienen reparatie in v1.1? | **Niet bewezen of geprioriteerd zonder G0** |
| D-05 | Is het veilig en gewenst om **F2** in v1.1 te implementeren? | **Geen GO; afhankelijk van F1** |
| D-06 | Mogen uitgestelde trajecten (M8-INT.3, vectoren, T5b, WAT) mee in de releasescope? | **Voorstel: nee; eigen poorten** |
| D-07 | Heeft v1.1 aan alle acceptatie- en releasecriteria voldaan? | **Nog geen release-GO** |

**Belangrijk:** dit document is een **ontwerpvoorstel v0.1.0** en wordt niet door publicatie op `develop` automatisch een normatief releasescopecontract. Het bestaande [DEVELOPMENT-ROADMAP.md](DEVELOPMENT-ROADMAP.md) blijft de geïntegreerde planning en historische traceerbaarheid bevatten; na expliciet productbesluit kunnen de goedgekeurde v1.1-mijlpalen daar als korte actuele samenvatting aan worden toegevoegd.
