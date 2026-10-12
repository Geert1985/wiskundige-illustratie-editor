# M6a-contract — Driehoekcentra

Contractversie: 1.1.0  
Status: concept ter goedkeuring; M6a-code is nog niet gestart.  
Datum: 2026-10-12  
Basis: `main`, commit `bcd0655`; wijziging gepubliceerd op `chatgpt/m6a-triangle-centers`.

## Doel en afbakening

M6a voegt drie afzonderlijke, dynamische constructies toe: zwaartepunt (`centroid`), middelpunt van de omgeschreven cirkel (`circumcenter`) en hoogtepunt (`orthocenter`). Elk resultaat is één gekoppeld punt dat de bestaande construction graph, semantic commands, undo/redo, permissies, inspector, renderer en export hergebruikt.

M6a voegt geen bissectrices, incirkel, Eulerlijn, negenpuntscirkel of nieuw documentobjecttype toe. Die horen bij M6b of latere stappen. Documentversie 7 blijft ongewijzigd.

## Bronnen en bediening

- Elke constructie neemt exact één bron van de conceptuele rol `triangle`.
- Rol `triangle` accepteert uitsluitend een bestaand object met type `polygon` en exact drie hoekpunten. Een cirkel, andere veelhoek, losse punten of object van een ander type voldoet niet.
- De gebruiker kiest de hele driehoek door erop te klikken. De persisted bronreferentie is `{objectId}`; hoekpunten worden niet in het recept gekopieerd.
- De rol is één gedeelde, normatieve regel voor bronselectie en pickeropties, service-/constructievalidatie, documentimport en semantic replay. Elke route valideert het gerefereerde object opnieuw volgens dezelfde rol; een aangeleverd recept, command of bestand kan die regel niet omzeilen.
- Driehoekcentra zijn afzonderlijke gereedschappen in het bestaande puntconstructiemenu. Ze volgen de bestaande tooltoestemming, bronselectie, statusinstructies, geschiedenis en annuleringsinteractie.
- De volgorde van de drie hoekpunten verandert de geometrische uitkomst niet.

## Wiskundige semantiek en numerieke methode

Noem de geordende hoekpunten A, B en C. De berekening gebruikt voor **alle drie** centra dezelfde genormaliseerde lokale coördinaten. Stel:

- `s = max(|B−A|, |C−A|, |C−B|)` (maximale Euclidische zijde),
- `u = (B−A)/s`, `v = (C−A)/s`,
- `q = cross(u,v)`.

Als de bron geldig is, bereken dan lokaal en schaal terug:

- **Zwaartepunt G:** `G = A + s·(u+v)/3`.
- **Circumcentrum O:** bepaal `o` uit `2·dot(o,u)=dot(u,u)` en `2·dot(o,v)=dot(v,v)`, bij voorkeur met de expliciete 2×2 determinantformule op de genormaliseerde waarden; `O = A + s·o`.
- **Hoogtepunt H:** `H = A + s·(u+v−2o)`, equivalent aan `H = A+B+C−2O`.

De lokale genormaliseerde vorm beperkt overflow in tussenstappen en gevoeligheid voor een gemeenschappelijke translatie. De gebruikelijke floating-point afronding blijft gelden; resultaten worden niet stilzwijgend begrensd of als exact voorgesteld.

### Uniforme degeneratieregel

Alle drie M6a-constructies gebruiken dezelfde geldigheidsgrens:

`abs(q) > 1e-12`.

Eerst moeten de vertices eindig zijn en moet `s > 0` gelden. Bij `s = 0` of `abs(q) <= 1e-12` is de bron `DEGENERATE_TRIANGLE`. **Dit geldt bewust ook voor het zwaartepunt**, hoewel het rekenkundig gemiddelde ook bij collineaire punten bestaat. De uniforme productregel behandelt een ontaarde configuratie niet als driehoek voor een van de M6a-centra.

Deze grens is relatief aan de maximale zijde en dus onafhankelijk van documenteenheid, absolute schaal en zoom. Een polygon van precies drie vertices met collineaire of bijna-collineaire coördinaten blijft een structureel geldige `triangle`-bron, maar de berekende constructie krijgt de recoverable status `DEGENERATE_TRIANGLE`.

### Invariantcontroles en foutstatussen

Controleer na de berekening de meetkundige invarianten met tolerantie die zowel driehoekschaal als floating-point-precisie en grootte van de absolute coördinaten meeneemt. Gebruik dimensieloze residuen waar mogelijk: onderlinge afstanden van O tot A/B/C moeten overeenkomen; H−A moet loodrecht staan op B−C (en cyclisch); G moet overeenkomen met `(A+B+C)/3`; en de onderlinge controle `H = 3G−2O` moet binnen de schaalbewuste tolerantie gelden. Een niet-eindig residu levert `NON_FINITE_RESULT` op. Een eindig residu buiten tolerantie levert `INVARIANT_FAILURE` op. In beide gevallen wordt de geometrie ongeldig en verschijnt nooit een schijnbaar geldig centrum.

Hanteer deze foutvolgorde:

1. Structureel ongeldige rol of referentie (verkeerd objecttype, geen polygon of vertexaantal ≠ 3): `INVALID_REFERENCE`; bij import wordt het document atomair afgewezen.
2. Structureel geldige driehoek met eindige vertices maar `s = 0` of `abs(q) <= 1e-12`: `DEGENERATE_TRIANGLE`.
3. Niet-eindige invoer, tussenresultaten, centrumcoördinaten of invariantresidu: `NON_FINITE_RESULT`.
4. Eindige centrumcoördinaten die buiten de bestaande toegestane absolute documentcoördinatenlimiet `1e12` vallen: `COORDINATE_LIMIT`.

`INVARIANT_FAILURE` is apart gereserveerd voor een eindige, maar ontoereikende invariantresiducontrole; dit is geen degeneratie-, niet-eindige- of limietfout.

De drie runtime-invalid statuses volgen de bestaande recoverable-invalid-regels. Bij geldige bron maar ongeldige uitkomst wordt geen benaderd, oud-stale of stilzwijgend begrensd centrum getoond. De productcode moet bij import niet-eindige vertexdata volgens de bestaande documentvalidatie atomair afwijzen; de `NON_FINITE_RESULT` runtime-status dekt niet-eindige berekeningen die met structureel toegelaten input ontstaan.

### Verplichte grenswaardefixtures

Gebruik vooraf vastgelegde fixtures op beide zijden van de relatieve grens, naast exact gelijk aan de grens. Bijvoorbeeld A=(0,0), B=(1,0), C=(1,t), waarvoor `s` en `q` rechtstreeks uit dezelfde fixtureberekening worden gecontroleerd:

- `abs(q) < 1e-12` → `DEGENERATE_TRIANGLE`;
- `abs(q) = 1e-12` → `DEGENERATE_TRIANGLE`;
- `abs(q) > 1e-12` maar dicht bij de grens → geldig indien invariantresiduen binnen tolerantie blijven.

Leg `t` als binary64-fixturewaarde vooraf vast en assert zowel de berekende `q` als de status; vermijd een fixture waarvan decimaletekst alleen veronderstelt dat het determinant exact op de grens valt. Voeg ook geldige en degeneratieve fixtures toe bij grote translatie, zeer kleine/grote toegestane schaal en uitkomsten nabij `1e12`. Grensfixtures verifiëren tegelijk dat constructieselectie/import de structurele rol `triangle` correct toepast en de rekenengine daarna de geometrische degeneratie beslist.

## Dynamiek en ongeldige bronnen

De constructie bewaart uitsluitend de stabiele driehoek-ID. Verplaatsen of anderszins toegelaten aanpassen van de bronvertices herberekent het centrum automatisch. Het wijzigen van vertexaantal terwijl er constructiedependents zijn blijft onderhevig aan de bestaande topology-protectieregel. Een ongeldige bron of berekening maakt het resultaat ongeldig volgens de bestaande ConstructionService-regels. Herstel van de geometrie herstelt hetzelfde resultaatobject en dezelfde ID. Bronverwijdering volgt het bestaande cascadebeleid.

Een afgeleid centrum blijft een normaal punt en kan als bron van andere toegestane constructies dienen. Bestaande lock-, bron-, create-, read-, display- en restricted-projectieregels blijven gelden; er komt geen uitzonderingspad voor M6a.

## Opslag en compatibiliteit

Elk recept slaat het constructietype en de enkele `{objectId}`-bron op. Nieuwe M6a-recepten vereisen constructionSchema 2 volgens het bestaande schema-mechanisme. Objecttype `point`, documentversie 7, legacybestanden en bestaande schema 1–4-documenten blijven verder ongewijzigd leesbaar en schrijfbaar. Documenten zonder M6a-recept behouden hun bestaande minimale schema. Oudere readers moeten nieuwe M6a-recepten afwijzen volgens de bestaande onbekende-constructieregel in plaats van ze los te koppelen.

## Acceptatiebewijs voor de implementatiefase

Per constructie afzonderlijk controleren:

1. Gelijkzijdige en algemene scalene driehoek; juiste meetkundige invariant.
2. Rechthoekige driehoek: circumcentrum op de hypotenusemiddens en hoogtepunt op de rechte hoek.
3. Stomphoekige driehoek: circumcentrum en hoogtepunt liggen buiten de driehoek waar verwacht.
4. Vertexvolgorde/permutaties geven hetzelfde punt binnen vastgelegde numerieke tolerantie.
5. Collineaire en onder/op de relatieve grens bijna-collineaire vertices leveren gecontroleerd `DEGENERATE_TRIANGLE`; fixtures net boven de grens blijven geldig als invariantcontrole slaagt.
6. Translatie, schaal, negatieve coördinaten en documentcoördinaten nabij de toegestane limiet; onderscheid tussen `DEGENERATE_TRIANGLE`, `NON_FINITE_RESULT`, `COORDINATE_LIMIT` en `INVARIANT_FAILURE`.
7. Bron verplaatsen, bron ongeldig maken/herstellen en bron verwijderen; identiteits-, dependent-, geschiedenis- en cascadegedrag.
8. Semantische replay, JSON-roundtrip, render/SVG, undo/redo en foutieve import atomair afwijzen, inclusief toepassing van rol `triangle`.
9. Restricted author/course/assessment: alleen bij toegestane tool, bron en punt-capabilities; geen verborgen bron of resultaat uitlekken.
10. Node-regressies en gerichte Edge-integratie voor gereedschapsmenu, pointerselectie, preview/hover, fullscreen en SVG.

Numerieke toetsen gebruiken onafhankelijke, vooraf bepaalde referentiepunten, grenswaardefixtures en schaalbewuste toleranties. Geen acceptatieclaim volgt uit een onuitgevoerde test.

## Poorten en open voorwaarden

Dit is contractversie 1.1.0 ter expliciete goedkeuring; er is geen M6a-productiecode geschreven. Volgens de roadmap staan gecombineerde Edge-regressies en handmatige T4/T5-prep-controles nog open. Hun status verandert niet door deze contractupdate. M6a-implementatie start pas na jouw expliciete goedkeuring van dit contract en afhandeling of expliciete beoordeling van toepasselijke open controles. M6b blijft een afzonderlijke milestone.
