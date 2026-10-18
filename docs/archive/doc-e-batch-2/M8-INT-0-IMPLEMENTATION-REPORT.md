# M8-INT.0 — Implementatieverslag v1.1.0

Datum: 2026-10-17
Branch: `codex/m8-int-0-universal-intersection`
Normatief contract: v1.1.0, overgenomen uit `origin/main` commit `084837f5`.

## Correctieronde

Na de tweede ondubbelzinnige bron maakt één geautoriseerd construction.create-commando alle geldige snijpunten. Het gereedschap blijft actief voor een nieuw bronpaar. Individuele puntselectie, resultatenpreview, confirm en selectedBranches-UI-staat zijn verwijderd. Bij bronoverlap blijft uitsluitend de toegankelijke bronkeuzelijst beschikbaar. Contextueel starten, bronhover en scrollbare instructies blijven behouden.

Legacycommando’s zonder selectedBranches filteren ongeldige takken; raakpunten en begrensde lijnen met uitsluitend branch 1 werken opnieuw. Een expliciete ongeldige branchselectie wordt atomair geweigerd. Bestaande recepten, bronvolgorde, branches, schema’s en afhankelijkheden blijven behouden. De oude drie menuknoppen blijven zichtbaar tot handmatige acceptatie.

## Verificatie

- Volledige Node-suite: 713/713 geslaagd, 0 failures/skips.
- Gerichte Edge-test: onmiddellijke constructie van beide branches, geen preview/confirm, annulering vóór de tweede bron en één Undo/Redo-transactie geslaagd; pageErrors: [].
- Volledige Edge-suite: geslaagd, pageErrors: []. Eerdere runs vonden een interferentie van het scrollpaneel met parallellogramplaatsing; opgelost door muisopvang te beperken tot de bronkeuzelijst. De gerichte parallellogramregressie slaagt eveneens.

Op 17 oktober 2026 heeft de gebruiker M8-INT.0 handmatig geaccepteerd. De drie oude zichtbare knoppen bleven op dat moment nog aanwezig; de volgende UI-consolidatie verwijdert uitsluitend die presentatie-ingangen. Geen merge naar main of uitbreiding naar M8-INT.1/.2/.3/M-PATH.

## Aanvullende correctie: contextuele veelhoekzijde

ConstructionService.contextualPlans bood voor een specifieke polygonrand geen lineIntersection/lineCircleIntersection-plan aan. Deze bestaande lijnrolrecepten gebruiken nu hetzelfde rand-prefillpad als parallel/perpendicular, met exact objectId, part edge en index. De bestaande contextcontroller en autorisatie blijven eigenaar van starten en uitvoeren.

Verificatie: volledige Node-suite 713/713 geslaagd; gerichte Edge-intersectiesuite geslaagd met pageErrors: []. Aanvullend zijn driehoek, vierhoek en vijfhoek in beide bronvolgordes gecontroleerd op contextueel aanbod, exacte rand-prefill, twee direct gemaakte punten en ongewijzigde opgeslagen bronreferenties. Geen nieuwe solver of schemawijziging.

## M8-INT.0 — UI-consolidatie en handmatige acceptatie

De gebruiker heeft M8-INT.0 op **17 oktober 2026** handmatig geaccepteerd. Na deze acceptatie zijn de drie oude zichtbare ingangen (`construct:lineIntersection`, `construct:lineCircleIntersection`, `construct:circleCircleIntersection`) uit de sidebarcatalogus verwijderd. De universele `construct:intersection` staat als enige snijpuntgereedschap onder **Constructies → Puntconstructies**. De gedeelde catalogus verzorgt dezelfde lijst voor zoeken, fullscreen en het contextuele radiaalmenu; regressies controleren alle vier de oppervlakken.

De oude recepten, tool-/command-ID’s voor compatibiliteit, solvers, bronrollen, branchidentiteiten, autorisatie, JSON-import/export, afhankelijkheden, replay en undo/redo blijven behouden. De Edge-fixtures maken oude recepten via de bestaande `construction.create`-commando’s zonder legacyknoppen; de Node-suite blijft de recept-, branch-, permissie- en documentregressies uitvoeren. De universal contexttest controleert aanbod voor lijn, cirkel en polygonzijden in beide bronvolgordes en voor driehoeken, vierhoeken en vijfhoeken.

`origin/main` is bijgewerkt tot `5bf2bed` en op dezelfde featurebranch geïntegreerd via mergecommit `9fbac18`; de twee commits bevatten het contract v1.1.0 (`084837f`) en roadmap v2.8.23 (`5bf2bed`). Er waren geen mergeconflicten en er zijn geen commits van andere featurebranches opgenomen. De UI-consolidatie is vastgelegd in codecommit `084a210`.

### Eindverificatie

- `npm test`: **713 tests, 713 geslaagd, 0 mislukt, 0 overgeslagen**.
- `npm run test:edge`: **geslaagd**, inclusief de volledige browsermatrix; `pageErrors: []`. De Edge-runner aggregeert de losse browserasserties niet tot één totaalteller.
- De toolcatalogus bevat **39** zichtbare werkende tools, precies **1** zichtbaar snijpuntgereedschap en **0** zichtbare legacy-snijknoppen. Zoeken, fullscreen en contextueel aanbod zijn gecontroleerd.
- `git diff --check`: geslaagd. De Edge-suite wijzigde bestaande screenshots; die testartefacten zijn teruggezet en niet opgenomen.

### Gewijzigde bestanden en commits

- Main-synchronisatie: `9fbac18` (integreert uitsluitend `084837f` en `5bf2bed`).
- Productie-UI: `editor.html`, commit `084a210`.
- Catalogus-, zoek-, fullscreen-, radiaal- en receptregressies: `tests/browser-circle-circle.cjs`, `tests/browser-line-circle.cjs`, `tests/browser-line-intersection.cjs`, `tests/browser-split-tools.cjs`, `tests/browser-tool-panel-reorganization.cjs`, `tests/browser-universal-intersection.cjs`, `tests/left-sidebar-navigation.test.cjs` en `tests/tool-panel-reorganization.test.cjs`, commit `084a210`.
- Status/documentatie: dit verslag en `docs/DEVELOPMENT-ROADMAP.md`, vastgelegd na codecommit `084a210`.

**Resterend:** niets open voor M8-INT.0 binnen deze consolidatie. De merge naar `main` vereist nog de afzonderlijke goedkeuring van de gebruiker. M8-INT.1, M8-INT.2, M8-INT.3 en M-PATH blijven gepland en zijn niet geïmplementeerd.
