# M8-INT.1 — implementatieverslag

**Documentversie:** 1.1.0  
**Definitieve status:** geïmplementeerd, handmatig geaccepteerd en geïntegreerd op `main` via [PR #28](https://github.com/Geert1985/wiskundige-illustratie-editor/pull/28)  
Datum: 17 oktober 2026  
Featurebranch: `codex/m8-int-1-line-ellipse`  
Startpunt: `origin/main` / `9577be5dc346b4dd74739495a01e925a555cb34c`  
Contract: [M8-INT.1 lijn–ellips v1.0.0](../../M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md)\
Preflight: [M8-INT-1-PREFLIGHT.md](../../M8-INT-1-PREFLIGHT.md)

## Resultaat

M8-INT.1 is geïmplementeerd in het bestaande gereedschap **Snijpunt**. De UI accepteert lijn en ellips in beide bronvolgordes, ook via het contextmenu van de ellips. Na de tweede ondubbelzinnige bronkeuze maakt WIE alle actuele geldige snijpunten onmiddellijk; er is geen resultatenkeuze of extra bevestiging. Specifieke polygonzijden blijven opgeslagen als `{objectId, part:'edge', index}`.

De solver gebruikt de actuele canonieke `EllipseGeometry`, normaliseert de lokale coördinaten en de kwadratische vergelijking, bewaart de gerichte branches 0 en 1 vóór domeinfiltering en controleert eindigheid, domein en geometrische residuen. Een discriminant binnen de numerieke foutgrens wordt als onbeslist gerapporteerd en maakt geen fantoompunt. Lijnstuk-, vector-, maatlijn-, halfrechte-, rechte-, as- en polygonranddomeinen volgen de bestaande bronregels.

Het persistente gespecialiseerde recept is `lineEllipseIntersection`; het gebruikt de bestaande `ConstructionService`, dispatcher, command/history-, permission- en replaypaden. `constructionSchema:10` wordt uitsluitend geschreven wanneer het document een lijn–ellipsrecept bevat. Importvalidatie, restricted exports en rechten controleren dezelfde featuregate. Lege oplossingen muteren model en history niet; afhankelijke punten behouden hun IDs en volgen recovery en bronrebind. De drie bestaande intersectionrecepten en M8-INT.0 blijven compatibel. Cirkel–ellips en ellips–ellips zijn niet toegevoegd.

## Verificatie

- Nulmeting op `main`: `npm test` 713/713; volledige `npm run test:edge` geslaagd, `pageErrors: []`.
- Gerichte lijn–ellips Node-suite: **22/22 geslaagd**.
- Volledige `npm test`: **735/735 geslaagd**, 0 mislukt, 0 overgeslagen.
- Gerichte Edge-browseracceptatie: ellips-context; bronvolgordes lijn→ellips en ellips→lijn; driehoek-, vierhoek- en vijfhoekrand, in beide bronvolgordes; canonieke bronreferenties; schema 10; `pageErrors: []`.
- Volledige `npm run test:edge`: **geslaagd**, met `pageErrors: []`. De bestaande runner rapporteert de volledige scenario-uitkomsten als JSON en geen enkel geaggregeerd testtotaal.
- `git diff --check`: geen whitespacefouten.

## Acceptatiestatus en commits

**Afgesloten op 17 oktober 2026.** De gebruiker heeft de implementatie inclusief de laatste UX-correctie (automatische terugkeer naar Selecteren na geslaagd Snijpunt) handmatig beoordeeld en goedgekeurd. De featurebranch `codex/m8-int-1-line-ellipse` is daarop via [PR #28](https://github.com/Geert1985/wiskundige-illustratie-editor/pull/28) naar `main` gemerged. De op de featurebranch gerapporteerde testresultaten blijven historisch testbewijs; de suites zijn na de merge bij deze documentatiestatuswijziging niet onafhankelijk opnieuw uitgevoerd.

Fasecommits:

- `3753f22c` — preflight vastgelegd vóór productiecode.
- `91acf917` — analytische lijn–ellipsoplosser en tests.
- `ae6ccb86` — persistent recept, schema 10, lifecycle en permissions.
- `0db536f9` — universele intersection-UI en contextuele bronkeuze.


## UX-correctie: automatisch afsluiten

Na succesvolle creatie schakelt de universele Snijpunt-tool via de bestaande toolwissel terug naar Selecteren, met behoud van nieuwe puntselectie en succesmelding. De documenttransactie ruimt de broninteractie vooraf op; een geweigerde, mislukte of lege constructie activeert deze succesafhandeling niet. Deze expliciet goedgekeurde afspraak vervangt het eerdere herhaalgedrag. Contractversies: hoofdcontract 1.1.2, lijn–ellips 1.0.1.

Verificatie van de afsluitcorrectie: `npm test` **735/735 geslaagd**; volledige `npm run test:edge` **geslaagd**, exit 0, `pageErrors: []`. Browserregressies controleren één/twee punten, behoud van selectie, geen resterende instructies, nul-oplossingen, een geweigerde transactie, contextuele starts en atomair Undo/Redo. Geometrische lijn–ellipsregressies blijven groen.

Aanvullend `M8_INT_ONLY=1 npm run test:edge`: geslaagd, `pageErrors: []`, inclusief automaticSelectAndSelection, zeroSolutionsStayActive en failedTransactionStaysActive. De contextmenutest selecteert nu het object voordat het aanbod wordt opgevraagd.

## Definitieve acceptatie en integratie

- **Handmatige gebruikersacceptatie:** GO, 17 oktober 2026, inclusief de UX-correctie voor het afsluiten van het universele Snijpunt-gereedschap na succesvolle constructie.
- **Merge naar `main`:** door de gebruiker uitgevoerd via [PR #28](https://github.com/Geert1985/wiskundige-illustratie-editor/pull/28); integratie op `main` via GitHub-branchvergelijking bevestigd (0 featurecommits vóór `main`).
- **UI-gedrag na succes:** `construct:intersection` schakelt naar `select`; nieuw aangemaakte punten blijven geselecteerd; Undo/Redo blijft één transactie.
- **Bij nul geldige snijpunten:** geen mutatie/history en het gereedschap blijft actief.
- **Testbasis vóór merge:** door Codex gerapporteerd: `npm test` 735/735 PASS; volledige `npm run test:edge` PASS zonder `pageErrors`; gerichte M8-INT-Edge-suite PASS.
- **Scope:** M8-INT.1 afgesloten. M8-INT.2 en M8-INT.3 zijn niet geïmplementeerd.

