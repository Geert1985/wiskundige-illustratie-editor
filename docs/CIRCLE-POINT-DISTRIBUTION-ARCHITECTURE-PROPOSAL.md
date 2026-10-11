# Voorstel: gelijkmatige puntenverdeling op een cirkel

Status: **Fase A — ontwerp ter goedkeuring; implementatie niet gestart.**

## Huidige architectuur

- `construction-service.js` registreert `pointOnCircle` als een gewone afgeleide puntconstructie met één cirkelbron en een eigen hoekparameter `parameter` (een omloopfractie). De resolver berekent elk punt uit dat objectrecept.
- `model.js` bewaart objecten met constructierecepten en valideert bestaande documentschema's. Documentversie 5 is momenteel gereserveerd voor lagen; groeps- en laagvalidatie bevat versiegebonden controles. Onbekende documentvelden worden als extensies bewaard, maar hebben daardoor geen gevalideerde semantiek of consistente mutatielevenscyclus.
- `ConstructionService.resolve` bouwt afhankelijkheden uit objectbronnen. Afhankelijke objecten volgen bronwijzigingen en verwijderen volgt de bestaande constructie-afstammelingen.
- De inspector toont voor één `pointOnCircle`-punt een positieslider. Het punt is een normaal selecteerbaar punt en kan als bron van een volgende constructie dienen.
- Undo/redo, semantische replay en restricted sessies muteren via gevalideerde commando's. Import en export lopen via het documentmodel.

## Voorgesteld contract

### Herbruikbare geometrie

Voeg een zuivere `regular-geometry.js`-module toe met `pointsOnCircle({cx, cy, radius, count, startAngle})`. De invoerhoek en uitvoerberekeningen zijn in radialen; de UI converteert graden alleen aan de rand. De module accepteert eindige coördinaten, een eindige straal `>= 0` en een geheel aantal punten van minimaal 1. `count` wordt door de editor verder beperkt tot 1–24. De uitvoer is deterministisch, in tegenwijzerzin en zonder inputmutatie. De functie maakt geen editorobjecten.

### Canonieke distributie en stabiele punten

Bewaar één canonieke distributierecord in het document, bijvoorbeeld:

```json
{
  "id": "circle-distribution-1",
  "circleId": "circle-1",
  "count": 4,
  "startAngle": 0,
  "pointIds": ["point-4", "point-5", "point-6", "point-7"]
}
```

`pointIds[k]` identificeert het resultaat op index `k`. De punten blijven gewone puntobjecten en blijven bruikbare constructiebronnen. Een distributiepunt krijgt een afzonderlijk constructierecept dat de cirkelbron plus `distributionId` en `index` bewaart. Aantal en beginhoek staan uitsluitend in de distributierecord; ze worden niet per punt gekopieerd. De bestaande `pointOnCircle`-recepten en hun omloopparameter blijven onaangeroerd.

Een broncirkelwijziging herberekent de volledige distributie en de afgeleide constructies downstream. Een hoekwijziging doet hetzelfde. De eerste index correspondeert met `startAngle`, de volgende punten volgen `startAngle + 2πk/count`.

### Aantal aanpassen en verwijderen

Bij verhogen blijven alle bestaande IDs op hun index behouden; nieuwe hogere indices krijgen nieuwe IDs. Bij verlagen blijft het prefix behouden. Verwijderen wordt als één atomaire wijziging geweigerd wanneer een te verwijderen punt wordt gebruikt door een andere constructie. De melding benoemt dat het punt eerst moet worden losgekoppeld of dat de afhankelijke constructie moet worden verwijderd. Er worden geen verweesde constructies of stille cascadeverwijderingen gemaakt.

Een distributie is geen nieuw visueel objecttype en er komt geen algemeen groepssysteem bij. De objectlijst blijft de bestaande gewone puntresultaten tonen. Een eventuele hiërarchische presentatie van die punten valt buiten deze beperkte stap.

### Documentcompatibiliteit

De nieuwe canonieke collectie heeft documentsemantiek nodig. Daarom stel ik een expliciete `circleDistributionSchema: 1` voor en documentversie **6**, met een strikte migratiematrix:

- v1–v5 blijven op exact hetzelfde pad geladen en behouden hun bestaande constructies, groepen, lagen en metadata.
- v6 is vereist zodra distributies aanwezig zijn; v6 valideert schema, unieke distributie-ID's, broncirkels, count, hoek, indexen en één-op-één verwijzingen van `pointIds` naar de juiste puntrecepten.
- v1–v5 worden niet automatisch omgezet naar distributies. Een bestaande enkelvoudige `pointOnCircle` blijft een enkel punt, en gebruiker kan deze later expliciet uitbreiden via de inspector.
- `toJSON`, lagen/groepen, import/export, dupliceren, verwijderen, undo/redo en semantische replay moeten v6 correct bewaren. Oude documentschema's blijven byte-semantisch gelijk waar huidige normalisatie dat al garandeert.

Dit vereist aanpassing van de versievertakkingen in `model.js`; met name de huidige `version===5`-laagchecks mogen v6 niet afwijzen of lagen verliezen. De migratie is behoudend: er is geen automatische herschrijving van oude puntconstructies.

### Commando-, permissie- en undo-grens

Gebruik één semantisch commando, bijvoorbeeld `circleDistribution.set`, dat `create`, `count` en `startAngle` als wijzigingsvormen afhandelt of apart benoemde schema-validaties heeft. Het commando controleert toestemming voor de broncirkel, distributierecord en alle gewijzigde puntobjecten; beperkte sessies mogen geen members buiten hun objectrechten creëren, verwijderen of uitlezen. Een count-wijziging die geblokkeerd wordt door afhankelijke punten is volledig atomair: document, ID-allocator, geschiedenis en revision blijven ongewijzigd.

Eén gebruikershandeling (slidercommit of hoekwijziging) wordt één undo-stap. Slider-preview mag tijdelijk presenteren, maar schrijft niet tussentijds naar het document; annuleren herstelt exact de beginwaarden. Opslaan en export serialiseren dezelfde gevalideerde v6-documenttoestand.

## Bestanden voor fase B

Waarschijnlijke productiewijzigingen: `regular-geometry.js`, `model.js`, `construction-service.js`, de commando-/restricted-runtime- en semantische-replaylagen, `editor.js`, `editor.html` en de scriptinventaris/load-order. Tests voor de geometriekern, modelmigratie, constructiedependency, permissies, inspector/browsergedrag, undo/redo, dupliceren en JSON/SVG-export. De exacte lijst wordt na goedkeuring bij uitvoering bevestigd.

## Risico's en acceptatiepunten

1. **Schema 6 raakt versiepoorten voor lagen/groepen.** Accepteer fase B alleen als v1–v6 inclusief combinaties distributies + lagen/groepen worden geopend en opgeslagen zonder verlies.
2. **Een centraal register moet synchroon blijven met objecten.** Import valideert beide richtingen en telt iedere distributiepunt-ID exact eenmaal; create/update/remove zijn atomair.
3. **Countverlagen kunnen afhankelijke constructies breken.** Geweigerde verlaging laat document, IDs, undo-stack en revision ongewijzigd; toegestane verlaging behoudt IDs van indexen die blijven bestaan.
4. **Dupliceren vraagt distributie-ID's en punt-ID's opnieuw uit te geven.** Een duplicaat van de volledige distributie krijgt nieuwe IDs en houdt dezelfde cirkelbron alleen als die bron deel van de gedupliceerde selectie is; anders moet productgedrag expliciet worden gekozen vóór implementatie.
5. **Restricted policy kan gedeeltelijke verdelingen lekken.** Alleen geautoriseerde sources/results mogen zichtbaar zijn; gedeeltelijke of onvolledige toegang wordt geweigerd in plaats van een inconsistent aantal te tonen.
6. **Hoekconversie en degeneratie.** Interne radialen en UI-graden worden expliciet getest; radius nul wordt volgens bestaand `pointOnCircle`-beleid ongeldig verklaard.

## Open keuzes vóór fase B

- Bij dupliceren van een distributie zonder cirkel in dezelfde selectie: blokkeren, of duplicaat aan dezelfde broncirkel koppelen? Mijn voorstel is koppelen aan dezelfde cirkel met nieuwe distributie- en punt-ID's, onder voorwaarde dat bronleesrechten aanwezig zijn.
- Moet de objectlijst punten onder een kopje van de distributie groeperen? Dit is niet nodig voor correcte geometry; mijn voorstel is de bestaande lijststructuur behouden en geen algemene groepering bouwen.
- Heeft de inspector naast slider-invoer ook een numeriek veld nodig? De specificatie laat dat afhangen van de bestaande UI; mijn voorstel is een slider met direct numeriek veld alleen als dezelfde controlstijl elders al wordt gebruikt.

Er is nog geen geometrische module, modelwijziging, UI of distributietest geïmplementeerd. Voor fase B wacht ik op expliciete goedkeuring van dit contract en de open keuzes.
