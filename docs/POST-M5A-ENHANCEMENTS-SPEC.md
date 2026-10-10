# Post-M5a uitbreidingen — functionele specificatie

Versie: 1.3.0
Datum: 2026-10-10
Status: goedgekeurde productwensen; technische uitwerking en implementatie nog te plannen
Project: From Zero 2 Infinity — Wiskunde Illustrator
Basis: main, na M5a; zie M5a-REPORT.md en DEVELOPMENT-ROADMAP.md.

## Doel en afbakening
Leg de in het overleg afgesproken uitbreidingen vast zonder te suggereren dat ze al geïmplementeerd of getest zijn. De bestaande roadmap blijft geldig. Concrete milestone-nummers na M5a zijn voorstellen en geen autorisatie voor Codex.

## 1. Dynamische tekstobjecten
- Tekstobjecten kunnen statische tekst of een dynamische verwijzing naar één of meer bestaande geometrische objecten bevatten.
- Ondersteunde bronwaarden als doel: objectnaam/label, lengte, omtrek, oppervlakte, straal, hoek en coördinaten, voor zover mathematisch toepasselijk en door de meetengine ondersteund.
- Het eigenschappenpaneel biedt bronobject, eigenschap, precisie, voor- en achtervoegsel. Latere uitbreiding: tekstsjablonen met meerdere velden, bijvoorbeeld `Lengte AB = {waarde}`.
- Referenties zijn gebaseerd op stabiele object-ID's, niet op de zichtbare naam. Hernoemen en verplaatsen van bronnen werkt de weergave automatisch bij.
- Bij verwijderde of tijdelijk ongeldige bron: duidelijk 'niet beschikbaar' tonen; gedrag bij definitieve verwijdering en cascade moet vooraf expliciet worden gespecificeerd.
- Geen willekeurige JavaScript-expressies of onveilige evaluatie; gebruik gevalideerde, getypeerde bindings.
- Metingen gebruiken de documenteenheid, schaal en precisie. Wiskundige notatie zoals |AB| en Opp(△ABC) is gewenst.

## 2. Raster en standaardkleur constructies
- Bij een nieuw document staat het raster standaard **aan**.
- Bestaande opgeslagen documenten behouden hun opgeslagen rasterzichtbaarheid; geen ongevraagde migratie.
- Nieuw aangemaakte constructieobjecten krijgen standaard een **rode lijnkleur**, waar een lijnstijl toepasselijk is (bijv. middelloodlijn, bissectrice, raaklijn, gekoppeld lijnstuk). Voor puntconstructies, zoals punt op cirkel, is een passende rode puntstijl gewenst.
- De gebruiker kan de kleur/stijl achteraf wijzigen; herberekening van de afhankelijkheidsgraaf mag deze override niet wissen.
- De exacte lijst constructietypes en het precieze rood (kleur-token) moeten bij implementatie centraal worden vastgelegd.

## 3. Raaklijn via punt op cirkel
- Behoud de bestaande raaklijnfunctionaliteit.
- Laat bij de tool 'Raaklijn' een bestaand punt op een geselecteerde cirkel kiezen, met name een M5a gekoppeld punt-op-cirkel.
- Gevalsonderscheid: punt buiten de cirkel -> twee mogelijke raaklijnen; punt op de cirkel -> één raaklijn; punt binnen de cirkel -> geen reële raaklijn. De UX moet duidelijk omgaan met twee oplossingen en degeneratie.
- Voor cirkelmiddelpunt C=(a,b) en raakpunt P=(x0,y0) is de raaklijn `(x0-a)(x-x0)+(y0-b)(y-y0)=0`; deze staat loodrecht op CP.
- De raaklijn volgt het gekoppelde raakpunt en de cirkel dynamisch, met stabiele objectidentiteit, correcte invalidatie, undo/redo, locks, permissies, import/export en replay.
- Verifieer compatibiliteit met bestaande tangent-recepten en het constructionSchema; maak geen impliciete schemawijziging.

## 4. Contextuele stapsgewijze instructies
- Voor **elk** teken- en constructiegereedschap verschijnen bij activering onmiddellijk instructies bovenaan de rechterzijbalk 'Eigenschappen'.
- Duidelijke stappen: 'Stap 1 van N', actieve stap groot/vet en visueel benadrukt, voltooide stappen met statusindicator.
- De instructies volgen de werkelijke toolstatus en wijzigen na elke geldige bronselectie. Voor meervoudige oplossingswijzen, zoals raaklijnen, zijn contextafhankelijke stappen nodig.
- Ongeldige selecties tonen een begrijpelijke melding en houden de huidige stap actief. Escape, annuleren, toolwissel en voltooien herstellen een consistente toestand.
- Zonder actief tekengereedschap toont de zijbalk gewone objecteigenschappen. Instructies mogen noodzakelijke objecteigenschappen niet onbereikbaar maken.
- Gebruik een centrale declaratieve instructiedefinitie per tool, met toegankelijkheid voor toetsenbord en schermlezers.

## 5. Eenheden, schaal en meetnotatie — definitieve keuze
- **Standaard bij nieuwe documenten: centimeter (cm)**; dit vervangt het eerdere voorstel voor abstracte eenheden als standaard.
- Standaardschaal: **1 coördinateneenheid = 1 cm**; standaardprecisie: **2 decimalen**.
- Lengte en omtrek: cm; oppervlakte: cm²; hoeken: graden (°).
- Alternatieve lengte-eenheden: abstracte eenheid (e), mm, m, km; de oppervlakte-eenheid wordt overeenkomstig e², mm², m² of km².
- Instellingen horen in het rechter eigenschappenpaneel bij **Assenstelsel → Eenheden en schaal**, niet in een afzonderlijke algemene instellingenpagina.
- Aanpasbaar: lengte-eenheid, schaalfactor en aantal decimalen. Schaalfactor moet eindig en strikt positief zijn.
- Fysieke eenheden worden toegepast op weergegeven meetwaarden: lengte = coördinatenlengte × schaal; oppervlakte = coördinatenoppervlakte × schaal². Hoeken worden niet door de lengteschaal beïnvloed.
- Zoomniveau is onafhankelijk van fysieke schaal. Wijziging van eenheid/schaal wijzigt **geen** geometrische coördinaten, constructierelaties of objectidentiteiten.
- Eenheden verschijnen automatisch bij lengtes, omtrekken, oppervlaktes, relevante meetlabels en dynamische tekstwaarden; geen dubbele suffixen.
- Bewaar documentinstellingen in een versieerbare, compatibele vorm. Bestaande documenten zonder eenhedenmetadata krijgen een expliciet te bepalen legacy-weergave om onverwachte betekeniswijziging te vermijden; dit is een open migratiebesluit.

## Voorgestelde fasering
1. Kleine UX-correcties: raster aan bij nieuw document en rode standaardstijl voor constructies.
2. Contextuele, toegankelijke stapsgewijze instructies voor alle tools.
3. M5b-kandidaat: raaklijn in gekoppeld punt op cirkel.
4. Eenheden/schaal/meetnotatie en dynamische tekstbindingen; technische afhankelijkheid: eenhedencontract vóór formattering van dynamische waarden.

## Acceptatiecriteria (overkoepelend)
- Node-unit- en regressietests; Edge-browserinteracties inclusief echte pointer-events waar relevant.
- Undo/redo, opslag, import/export, vergrendeling, autorisatie (author/course/assessment), semantische replay en bestaande constructies blijven correct.
- Bewijs dat eenheden/zoom geen geometrie wijzigen, kleur-override herberekening overleeft en dynamische bindings geen dangling/ongecontroleerde referenties introduceren.
- Handmatige visuele acceptatie door de gebruiker na iedere afgebakende milestone.

## Nog te beslissen tijdens technisch ontwerp
- Exacte kleurcode en toepasselijke constructietypes.
- Precies gedrag van dynamische tekst na definitieve bronverwijdering.
- Legacy-documenten zonder eenhedenmetadata en gewenste migratie.
- Schema/API-aanpassingen, precieze milestone-indeling en prioriteit.

Dit document is een **specificatie en backlog-aanvulling**, geen implementatieopdracht.

## 6. Verzamelingen — drie representaties (besloten 2026-10-10)
De editor moet **alle drie** de onderstaande representaties ondersteunen. Dit is een productvereiste, nog niet geïmplementeerd.

### 6.1 Venn- en Euler-diagrammen
- Universele verzameling U; benoemde verzamelingen A, B, C enz.; elementen en lidmaatschapsrelaties.
- Venn-diagrammen voor 2 en 3 verzamelingen; Euler-diagrammen voor deelverzamelingen en disjuncte verzamelingen.
- Semantische operaties unie (∪), doorsnede (∩), verschil (\\), complement en deelverzameling (⊆), inclusief leegte (∅).
- Gebieden semantisch correct arceren/inkleuren; de geometrische overlap van getekende vormen mag niet zonder meer de verzamelingenrelatie bepalen.
- Elementen kunnen visueel geplaatst worden; toekomstig gebruik in interactieve oefeningen is gewenst.

### 6.2 Verzamelingen op de getallenlijn
- Intervallen met open, gesloten en halfopen grenzen; onbegrensde intervallen en oneindigheid.
- Correcte eindpuntmarkeringen, inkleuring en intervalnotatie, bijvoorbeeld [a,b], (a,b], (-∞,b).
- Unie, doorsnede en verschil van intervallen; meerdere losse intervalcomponenten.
- Coördinaatwaarden en grenzen blijven consistent bij verschuiven, zoomen en aanpassen van het assenstelsel.

### 6.3 Verzamelingen in het coördinatenvlak
- Puntenverzamelingen en vlakgebieden, met grenzen uit eenvoudige ongelijkheden, zoals x ≥ a, y < b, x²+y² ≤ r², voor zover het systeem de representatie betrouwbaar kan evalueren.
- Open/gesloten grens zichtbaar onderscheiden (bijvoorbeeld gestreept versus doorgetrokken).
- Gebieden kleuren/arceren, combinaties via ∪, ∩ en verschil, en waar mogelijk bijbehorende wiskundige notatie tonen.
- Maak onderscheid tussen een louter getekende vorm en een **semantisch gedefinieerde verzameling**.
- Domeinbegrenzing, numerieke robuustheid en correcte weergave bij zoom/assenstelselwijzigingen expliciet specificeren.

### Technische en pedagogische randvoorwaarden
- Eén gedeelde, getypeerde semantische representatie voor verzamelingen en operaties, met afzonderlijke weergaven voor Venn/Euler, getallenlijn en coördinatenvlak waar toepasselijk.
- Definieer zorgvuldig welke conversies tussen representaties wiskundig geldig zijn; niet elke abstracte verzameling heeft een interval- of vlakweergave.
- Geen interpretatie van willekeurige gebruikerscode; gevalideerde expressies en veilige evaluatie.
- Respecteer bestaande permissies, objectvergrendeling, undo/redo, import/export, versiebeheer, toegankelijkheid en de teststrategie.
- Plan als afzonderlijke toekomstige milestone **Verzamelingen en diagrammen**; scope eerst opdelen in kleine, toetsbare submilestones.

## 7. Regelmatige veelhoeken — nieuw voorgesteld gereedschap (2026-10-10)
Status: productvoorstel, nog niet geïmplementeerd; definitieve UX-acceptatie bij milestone.

- Voeg gereedschap **Regelmatige veelhoek** toe naast de bestaande vrije veelhoek.
- Aantal zijden n is geheel en minimaal 3; voorgestelde praktische UI-grens 100, technisch te valideren.
- Interactie: kies middelpunt en hoekpunt op de omgeschreven cirkel; genereer n gelijkmatig verdeelde hoekpunten, gelijke zijden en gelijke binnenhoeken.
- Eigenschappen: n, middelpunt, omgeschreven straal, rotatiehoek, zijde, omtrek en oppervlakte. Wijzigingen moeten de figuur consistent herberekenen.
- Wiskunde: hoekstap 2π/n; zijde s=2R sin(π/n); omtrek P=ns; oppervlakte A=(n/2)R² sin(2π/n). Definieer degenerate invoer (R=0) expliciet.
- Optioneel in latere stap: constructie op basis van één zijde of twee aangrenzende hoekpunten; ingeschreven cirkel/apothema.
- Behoud objectidentiteit en handmatig aangepaste stijlen bij herberekening. Compatibiliteit met metingen, dynamische tekst, eenheden, locks, undo/redo, import/export, permissions en semantische replay vereist.
- Node-tests op invariantie van zijden/hoeken, rotatie, metingen en degeneratie; Edge-tests op creëren, wijzigen en slepen.
- Plan als afgebakende toekomstige milestone; geen implementatie zonder afzonderlijke opdracht.

## 8. Vectoren — uitbreiding van bestaand vectorgereedschap (2026-10-10)
Status: productvoorstel; de editor heeft al een basisgereedschap Vector, maar de hieronder beschreven bewerkingen zijn niet automatisch als geïmplementeerd te beschouwen.

- Behoud het bestaande vectorgereedschap. Voorzie gekoppelde vector AB met begin- en eindpunt als stabiele bronreferenties en een vrije vector gedefinieerd door componenten.
- Eigenschappen: componenten (vx, vy), grootte/norm, richting/hoek, naam en stijl; waar passend eenheden volgens documentinstellingen. Vectorcomponenten en norm hebben lengtedimensie, hoek in graden, inproduct heeft kwadratische dimensie wanneer beide vectoren lengtedimensie hebben.
- Semantische vectoroperaties: optellen, aftrekken, scalair vermenigvuldigen, inproduct, hoek tussen niet-nulvectoren, projectie op niet-nulvector, eventueel loodrechte component. Definieer nulvectorgevallen en degeneratie expliciet.
- Visualisaties: kop-staartmethode, parallellogramregel, componenten langs assen en vectorprojecties. Een vrije vector moet kunnen worden verplaatst zonder componenten te veranderen; een gebonden vector volgt zijn bronpunten.
- Alle afgeleide objecten volgen bronwijzigingen via de bestaande constructiegraaf; objectidentiteit, stijloverrides, locks, permissies, undo/redo, import/export en semantische replay blijven correct.
- Toekomstige integratie met dynamische tekstlabels, animaties, fysica en oefeningen; geen impliciete uitbreiding naar 3D in deze scope.
- Ontwerp eerst een mathematisch en technisch contract, met Node- en Edge-regressietests, en deel implementatie op in kleine milestones.
