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

Handmatige eindacceptatie blijft open. Geen merge naar main of uitbreiding naar M8-INT.1/.2/.3/M-PATH.

## Aanvullende correctie: contextuele veelhoekzijde

ConstructionService.contextualPlans bood voor een specifieke polygonrand geen lineIntersection/lineCircleIntersection-plan aan. Deze bestaande lijnrolrecepten gebruiken nu hetzelfde rand-prefillpad als parallel/perpendicular, met exact objectId, part edge en index. De bestaande contextcontroller en autorisatie blijven eigenaar van starten en uitvoeren.

Verificatie: volledige Node-suite 713/713 geslaagd; gerichte Edge-intersectiesuite geslaagd met pageErrors: []. Aanvullend zijn driehoek, vierhoek en vijfhoek in beide bronvolgordes gecontroleerd op contextueel aanbod, exacte rand-prefill, twee direct gemaakte punten en ongewijzigde opgeslagen bronreferenties. Geen nieuwe solver of schemawijziging.
