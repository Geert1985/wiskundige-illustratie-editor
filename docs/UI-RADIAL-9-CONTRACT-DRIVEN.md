# UI-RADIAL-9 — Generieke contractgestuurde contextuele constructies

**Versie:** 1.0.0  
**Datum:** 14 oktober 2026  
**Branch:** `codex/ui-radial-7-point-context-constructions`  
**Basis:** UI-RADIAL-7A/B (punt) en UI-RADIAL-8 (cirkel, lijnstuk, rechte, halfrechte, vector)  
**Status:** geïmplementeerd op ontwikkelbranch; geen merge naar `main`; **geen tests uitgevoerd**.

## Doel

Een nieuw objecttype of constructiegereedschap mag geen nieuwe `if(object.type === ...)`-regel in het radiaalmenu vereisen. Het radiaalmenu krijgt contextueel beschikbare constructies uit **één bron van waarheid**: het normale gereedschapregister en de bronreferentiecontracten van `ConstructionService`.

## Technisch contract

- **`ConstructionService.contextualPlans(object, kind)`** is de nieuwe centrale bronplan-API. Ze raadpleegt `contract(kind).sourceRoles` en `referencesForRole(object, role, kind)`, die op hun beurt de bestaande `referenceOptions` en validatieregels gebruiken.
- De API retourneert benoemde, getypeerde plannen met `key`, `mode`, `sourceIndex` en `sources`. Modi:
  - `prefill`: de geselecteerde bron ligt vast in een bepaalde bronrol; de overige bronnen komen uit de bestaande canvasconstructie-interactie.
  - `complete`: alle bronreferenties liggen vast; `construction.create` wordt meteen via het bestaande commando uitgevoerd.
  - `placement`: een padgebonden punt vereist nog een klik voor de parameterpositie; bestaande projectie-/validatieregels blijven verantwoordelijk.
- **`RadialProperties.contextConstructions()`** leest `ToolCatalog.list('sidebar')`, filtert `implemented`-gereedschappen en toepasbare rechten, en toont het eerste aangeboden plan per gereedschap.
- **`EditorApp.startContextConstruction(toolId, objectId, planKey)`** vervangt de afzonderlijke starters voor punten en lijn-/cirkelobjecten. Hij valideert opnieuw de actuele selectie, het gereedschap, de rechten en het bronplan voordat hij uitvoert. Er ontstaat geen afzonderlijke geometrische implementatie.
- **`constructionClick()`** behoudt de bestaande bronvolgorde en de reeds geïmplementeerde `radialPrefill`-invoeging voor geselecteerde bronnen die als tweede of latere bron dienen.

## Wat verschijnt nu zonder objecttypelijst in de UI?

- **Punt** → bestaande puntconstructies; geselecteerd punt wordt vooraf ingevuld.
- **Cirkel** → cirkelconstructies, snijpunten, raaklijn, regio's, omtrek/oppervlakte, binnen geldende rechten en toolcontracten.
- **Lijnstuk/rechte/halfrechte/vector** → toepasselijke lineaire constructies. Voor een *lijnstuk* blijven de bestaande speciale middenpunt- en middelloodlijnconstructies via de twee expliciete eindpunten beschikbaar.
- **Driehoek** (`polygon` met drie hoekpunten) → zwaartepunt, omcentrum, hoogtepunt, incentrum, ingeschreven cirkel, Eulerrechte, negenpuntscirkel enzovoort, voor zover geïmplementeerd en toegestaan.
- **Andere veelhoek** → onder meer veelhoekgebied, omtrek en oppervlakte op basis van `polygon`/`figure`-bronrollen.
- **Toekomstig objecttype** → komt automatisch in aanmerking zodra de normale constructieservice voor dat type passende rolreferenties levert en het gewenste gereedschap in `ToolCatalog` als geïmplementeerd geregistreerd is.

## Bewuste grenzen

1. **Niet magisch:** een nieuw objecttype moet wel worden toegevoegd aan het normale objectmodel, de constructieservice (`referenceOptions`/`accepts`) en, waar nodig, geometrische berekeningen en de gereedschapscatalogus. Er is **geen extra wijziging in het radiaalmenu** nodig voor geldige *volledige objectreferenties*.
2. **Objectonderdelen:** een veelhoekrand of specifiek hoekpunt is niet hetzelfde als een volledig geselecteerd veelhoekobject. Subonderdelen hebben een expliciete keuze-interactie nodig en worden niet willekeurig vooraf ingevuld. Dat is een afzonderlijke toekomstige UX-uitbreiding.
3. **Speciale externe workflows:** `distributedPointOnCircle` en `angleDirections` worden door de centrale service bewust niet voorgesteld als gewone voorinvulconstructies. Zij vereisen respectievelijk een verdelingstransactie of expliciete hoekarmrichting.
4. **Samengestelde bronplan-uitzondering:** `midpoint` en `perpendicularBisector` kunnen direct met de expliciete begin-/eindpuntreferenties van een **lijnstuk** worden voltooid. Een oneindige rechte krijgt niet zomaar een middenpunt.
5. **Padpositionering:** de bestaande plaatsingsinteractie ondersteunt de huidige padgebonden gereedschappen `pointOnCircle` en `pointOnSegment`. Nieuwe krommen of parametertypen vergen waar nodig een nieuwe geometrische projectieadapter in de constructieservice/editor.
6. **Permissies en model:** zichtbaarheid, restricted-source-rechten, `toolAllowed`, gedeelde `construction.create`-validatie, Undo/Redo en documentopslag worden gerespecteerd. De radial UI maakt geen directe geometrische objects.
7. **Vormgeving en bediening:** het compacte wiel en de zes categorieën blijven gehandhaafd; openen via rechtsklik, geen automatisch eigenschappenicoon.

## Handmatige acceptatiescenario's

1. Punten: lijnstuk en driehoek via bestaande punten met eerste bron vooraf ingevuld.
2. Lijnstuk: middenpunt/middelloodlijn direct; punt op lijnstuk met tweede plaatsingsklik.
3. Cirkel: raaklijn, cirkelsnijpunt; cirkel als tweede rol in lijn-cirkel-snijpunt.
4. Driehoek: bijzonder punt of Eulerrechte met reeds ingevulde gehele driehoek als bron.
5. Veelhoek: `polygonRegion`, omtrek en oppervlakte rechtstreeks via `figure`/`polygon`.
6. Verborgen, ongeldige en restricted-source objecten mogen geen ongeoorloofde constructies tonen of uitvoeren.
7. Andere objecten zonder passende hele-objectrollen houden hun bestaande radiaalmenu.
8. Rechtermuisknop versus linkermuisknop en fullscreen; categorie- en labelafhandeling; selectie en Undo/Redo.

**Validatie:** alleen de gepushte bronbestanden, assetversies en commitverschillen statisch gecontroleerd. Geen tests, build, JavaScript-uitvoering of browsercontrole. De branch is nog geen gevalideerde release.
