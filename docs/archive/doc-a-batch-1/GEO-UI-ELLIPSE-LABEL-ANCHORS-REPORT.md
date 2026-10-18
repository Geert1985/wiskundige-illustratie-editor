# GEO-UI: ellipsmeetlabels

## Oorspronkelijke fout

`measurementAnchor()` gebruikte `object.c` als middelpunt met de terugvalwaarde `{x: object.cx, y: object.cy}`. Bij opgeloste ellipsen is `c` echter een numerieke brandpuntsafstand. De berekening las daardoor `c.x` en `c.y` als `undefined`; SVG kreeg ongeldige coördinaten, waardoor labels bovenaan verschenen en niet goed te verslepen waren.

Tijdens de browsercontrole kwam daarnaast een tweede oorzaak voor het mislukken van slepen aan het licht: de optimistische inspector-update stuurde afgeleide ellipsvelden naar de validator voor bewerkbare velden. Die update werd afgewezen met `Onbekend ellips-objectveld.`

## Oplossing

- Ellipsankers worden nu vanaf het geometrische middelpunt `(cx, cy)` berekend.
- De grote en kleine as gebruiken expliciete geroteerde eenheidsvectoren. De halve-as- en aslabels liggen op hun juiste uiteinden; excentriciteit ligt op de geroteerde kleine as; oppervlakte ligt in het middelpunt.
- Voor lokale inspector-validatie worden afgeleide ellipsvelden verwijderd; afhankelijke ellipsen valideren alleen hun bewerkbare definitievelden. De bestaande document- en modelnormalisatie blijft leidend.
- Node- en Edge-regressietests dekken numerieke brandpuntsafstand, de zes waarden, eindige SVG-coördinaten, rotatie, onafhankelijke labelposities en afhankelijke herberekening.

## Testresultaten

- `npm test`: **673 geslaagd, 0 mislukt, 0 overgeslagen**.
- `npm run test:edge`: **geslaagd**, procesexitcode 0; de volledige bestaande Edge-suite rondde af en meldde `pageErrors: []`.
- Gerichte Node-test `tests/geo-ui-measurements.test.cjs`: **8/8 geslaagd**.
- Gerichte echte Edge-run (Playwright met Microsoft Edge): **7/7 gerapporteerde controles geslaagd**, geen JavaScript-paginatiefouten. Dit omvat zes afzonderlijke labelversleepacties met isolatiecontrole, geldige SVG-uitvoer, verbergen/herstellen, undo/redo, opslaan/heropenen, vrije en afhankelijke ellipsen, rotatie en herberekening.

## Geometrische en documentdekking

De zes afzonderlijk geteste meetlabels zijn grote halve as, kleine halve as, grote as, kleine as, excentriciteit en oppervlakte. Vrije ellipsen zijn getest met en zonder rotatie op verschillende middelpunten. Afhankelijke ellipsen zijn getest met horizontale en geroteerde brandpuntslijnen en na verplaatsing van de brandpunten. Node-regressies controleren de exacte ankerformules en v10-SVG; bestaande tests controleren v10-meetdocumenten en compatibiliteit met oudere ellipsdocumenten.

## Beperkingen

Geen resterende bekende beperking voor deze fout. De volledige browser-suite rapporteert geen geaggregeerd aantal assertions; daarom is de suite als geheel met exitcode en paginatiefouten gerapporteerd en zijn de gerichte regressiecontroles apart geteld.
