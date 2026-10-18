# T5b MathLive + CortexJS POC-2 — bronnen en eenheden

## Demonstratie en architectuur

De geïsoleerde POC voegt een mockcirkel toe met instelbare straal en mm/cm/m. De interne binding is een getypeerd record `{sourceId, property}` (`circle-1`, `radius`); de formule toont alleen `r`. De resolver controleert bronbestaan, eigenschap, geometrische geldigheid, toegangsstatus, numerieke waarde en eenheid voordat de waarde aan de formuleadapter wordt gegeven. Foutmeldingen tonen geen bron-ID of bronwaarde.

Lengtes worden intern naar centimeters omgerekend; oppervlakte wordt in cm² gepresenteerd. Dimensies worden exponenten op getypeerde waarden. De POC weigert optelling van lengte en oppervlakte. CortexJS blijft de parser/evaluator; de WIE-adapter verzorgt binding, bronrechten, dimensies, eenheden, revisies en resultaatbeleid. De hoofd T5a-route blijft intact.

De demo start met `r=2 cm`; de MathLive-formule `πr²` geeft exact `4π cm²` en een numerieke benadering. Wijziging van straal werkt de uitkomst opnieuw bij; `3 cm` geeft `9π cm²`. Ook omtrek, lengtesom, dimensieconflict, ongeldig, verwijderd en ontoegankelijk zijn beschikbaar. Verwijderen kan via de statuskeuze en herstel door terug te schakelen naar geldig.

## CortexJS en T5a

CortexJS levert MathLive-LaTeX parsing, exacte symbolische evaluatie waar ondersteund en numerieke evaluatie. T5a blijft de bestaande beperkte numerieke route en referentie. Geen van beide mag zelf geometrische toegang autoriseren. De eenheden- en bronnenlaag hoort bij een WIE-adapter; CortexJS kent geen WIE bronidentiteit, rechten of geometrische revisies. CortexJS is bruikbaar als rekenkern achter zo'n adapter, onder voorbehoud van expliciete tests voor operatoren en resultaatnotatie.

De POC gebruikt één beperkte substitutieadapter voor de geometrische placeholder en heeft geen algemene unit algebra. Numerieke waarden zijn IEEE getallen; symbolische exactheid voor de cirkelvoorbeelden komt van π en gehele straalwaarden in CortexJS. Afronding gebeurt alleen in de presentatie. Eenheden worden niet aan MathJSON als vrije symbolen toegevoegd.

## Herberekening en risico's

Elke wijziging verhoogt een revisie en maakt de vorige uitkomst onmiddellijk niet actueel. Na evaluatie wordt zowel requestgeneratie als bronrevisie gecontroleerd. De mock toont bron verwijderd/ongeldig/rechten ingetrokken; productie moet autorisatie opnieuw uitvoeren in de gezaghebbende ExpressionSources-laag en nooit vertrouwen op UI-status. Deze pagina simuleert rechten lokaal en is geen beveiligingsgrens.

Hoeken blijven RAD/DEG-instelling uit POC-1 en vormen geen lengte-eenheid. Eenheden voor hoeken, samengestelde eenheden, onzekerheidspropagatie, complexe bronnen, race-condities onder echte parallelle documentmutaties, en officiële WIE-eenhedenregels vragen verdere adaptertests. Voor reële productie moet de binding aan stabiele document/object-identiteiten, property allowlist, autorisatie en revisie uit ExpressionSources worden gekoppeld.

## Tests

- `npm run test:poc2`: conversie mm/cm/m, dimensieproduct en dimensieweigering, bronbinding met verwijdering/herstel/invaliditeit/toegangsintrekking, verouderde async-uitkomst.
- `npm run test:poc1`: bestaande MathLive/CortexJS-proeven.
- `node --check app.js` en `node --check geometry-poc.mjs`.
- Browser-smoketest: geprobeerd; Playwright kon niet starten omdat de Chromium executable ontbreekt. Edge is in deze poging niet bruikbaar gestart. Browsercontrole lokaal uitvoeren via de sectie Dynamische bron: cirkel.

## Advies

**CONDITIONAL GO** voor een POC-3 met mock ExpressionSources-adapter en expliciete numerieke/unitcontracten. Geen productie-integratie voordat autorisatie, eenheden, bronrevisies en formuleopslag als WIE-contract zijn vastgesteld. Aanbevolen eerstvolgende stap: laat de bestaande ExpressionSources-laag achter een mock-geometry provider werken met gecontroleerde rechten en eenheden, en voer de browserinteracties lokaal na.
