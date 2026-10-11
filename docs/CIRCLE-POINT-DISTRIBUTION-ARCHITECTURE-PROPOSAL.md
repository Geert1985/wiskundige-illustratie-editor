# Voorstel: gelijkmatige puntenverdeling op een cirkel

Status: **Fase B — contract aangevuld en voorwaardelijk goedgekeurd; implementatie uitgevoerd.**

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

## Voorwaardelijke fase-B-besluiten (aanvulling)

Deze aanvulling vervangt conflicterende eerdere open keuzes hierboven en is het uitvoeringscontract. Fase B is toegestaan; er is geen botsing met fundamentele modelregels.

- `pointOnCircle` blijft bij import onveranderd. De gebruiker ziet `Aantal punten = 1`; een verhoging converteert in-place naar index 0, behoudt ID, stijl, label en afhankelijke constructies, en schrijft `startAngle = 2π × parameter` radialen. De resolver gebruikt dezelfde factor en trigonometrie zodat index 0 dezelfde coördinaten houdt. Conversie is één undo-transactie. Count terug naar 1 behoudt het distributierecord.
- Prefix-ID's blijven stabiel. Count verlagen verwijdert alleen de staart en wordt atomair geweigerd als een te verwijderen punt door een andere constructie wordt gebruikt. Individuele punten kunnen niet worden verwijderd of losgemaakt. Volledige verwijdering wist record en punten atomair; afhankelijke constructies worden vooraf getoond en cascade vereist bevestiging. Broncirkelverwijdering volgt het bestaande cascadebeleid en wist het record.
- Volledige distributie dupliceren maakt nieuwe distributie- en punt-ID's. De cirkel wordt gedeeld tenzij die in dezelfde selectie zit; in dat geval gebruikt de kopie de gedupliceerde cirkel. Een enkel punt of onvolledige selectie wordt expliciet geweigerd, zonder onafhankelijke kopie.
- `regular-geometry.js` is zuiver en onafhankelijk. De UI-limiet is 1–24; de module ondersteunt aantallen tot 100000 en weigert grotere invoer vóór allocatie. Hoeken blijven canoniek radialen; de UI toont graden.
- Documentversie 6 bevat `circleDistributionSchema:1`; groepen en lagen blijven behouden. v1–v5 blijven leesbaar en worden nooit automatisch geconverteerd. v6 valideert de register/puntrelatie strikt in beide richtingen. Alle laagpoorten accepteren v5 en v6. Gedeeltelijke of verweesde import wordt atomair geweigerd.
- Inspector-preview wijzigt tijdelijk de editorweergave maar niet opgeslagen toestand of geschiedenis. Annuleren herstelt exact; bevestigen levert één undo-stap. Selectie van elk distributielid toont dezelfde centrale eigenschappen.
- Verplichte tests dekken geometrie inclusief >24, precisiebehoud, dynamische herberekening, identiteit, count verhogen/verlagen/blokkering, direct verwijderen/detach, volledige verwijdering, broncascade, volledige/partiële duplicatie, v1–v6 met groepen/lagen, roundtrip, restricted rechten/export, undo/redo, replay, JSON/SVG en browserpreview. Het rapport bevat meetresultaten, niet-uitgevoerde handmatige tests en complexiteitsaudit. Er wordt geen automatische veelhoekconstructie toegevoegd.

De bovengrens 100000 is uitsluitend een praktische veiligheidslimiet van de herbruikbare module; de editor zelf blijft voorlopig begrensd op 24.