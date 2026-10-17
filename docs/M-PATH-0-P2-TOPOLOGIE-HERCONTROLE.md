# M-PATH.0-P2 — Gerichte topologiehercontrole

**Datum:** 17 oktober 2026
**Repository:** `Geert1985/wiskundige-illustratie-editor`
**Branch:** `codex/m-path-0-p2-topologie-hercontrole`
**Onderzochte `main`-commit:** `9eb8165a2e3ab1acae65a592736add9e5204ae71` (`docs(M-PATH): corrigeer terminologie parameter in v1.0.1`)
**Normatief document:** `docs/WIE-M-PATH-0-Ontwerp-en-implementatiecontract-v1.0.1.md`, in het bijzonder §5.1–5.5
**Eerder rapport:** `docs/M-PATH-0-PREFLIGHT-REPORT.md` op `codex/m-path-0-preflight` (historisch NO-GO; commit `c671c38eb9e03123c6b41e4f9fba1cc485f377ee`)
**Tests:** geen uitgevoerd; dit is een statische, read-only codehercontrole.

## Conclusie

Contract v1.0.1 lost de eerdere topologieblokkering op door identiteit expliciet aan `(objectId, edge-index i, parameter t)` te koppelen. Gewone vertexupdates, ook een generieke gelijke-lengte `vertices`-array-update, zijn indexgebonden coördinatenupdates. Alleen een bestaande expliciete herordeningsoperatie zou extra bescherming vereisen.

De actuele code heeft geen polygon-vertex reorder-/renumber-commando en geen pad gevonden dat vertex-array-elementen sorteert of omkeert. Polygonmutaties die wel bestaan bewaren de indexvolgorde; berekende polygonen bouwen vertices volgens een vaste bron-/receptvolgorde op. De bestaande guard op vertexaantal blijft van kracht. Ik vond geen bestaande route die stilzwijgend indices permuteert.

**Advies: GO-aanbeveling voor de volgende beslissingspoort: afzonderlijke M-PATH.0-I-goedkeuring door de gebruiker.** Dit P2-rapport sluit alleen de topologische NO-GO uit de eerste preflight. Het geeft geen toestemming om M-PATH.0-I te implementeren, te mergen of oude gereedschapsingangen te verwijderen.

## Mutatiematrix

| Route | Concrete implementatie | Classificatie | Indexeffect en bestaande bescherming |
|---|---|---|---|
| Individuele vertexdrag | `EditorApp.pointerMove` → `InteractionResolver.polygonVertex` → `object.setGeometry` (auteur) of dezelfde geometry-fields in runtime; `editor.js` toont alleen bestaande indexhandles | **Indexgebonden vervorming** | Resolver kopieert de array en vervangt alleen `vertices[index]`; geen reorder. `PolygonGeometry.validate` valideert de nieuwe vorm. Ongeldige drag resulteert in de oude array als patch. |
| Numerieke hoekpuntvelden | `editor.js` selection panel maakt patch van bestaande array, met alleen gekozen `i` en `x`/`y`; auteurroute `updateObject`, restricted route `object.setGeometry` met `vertices[i].x/y` | **Indexgebonden vervorming** | Alleen gekozen vertexcoördinaat verandert; volledige arrayvolgorde blijft gelijk. Rechten en shape-validatie gelden via bestaande commando-/modelgrens. |
| Gewone polygonverplaatsing | `InteractionResolver.translatePolygon` plus `EditorApp.updateObject`; genereert `vertices.map(p => ({...p,x:p.x+dx,y:p.y+dy}))` | **Indexgebonden vervorming** | Pure translatie, zelfde aantal en volgorde. Geen topologie-guard anders dan bestaande polygonvalidatie/dependency-regels. |
| Groepstransactie met polygon | `InteractionResolver.translateGroup` → `MeasurementGeometry.translate` voor geselecteerde objecten; runtime gebruikt `object.translate`; auteurpatches worden via batch toegepast | **Indexgebonden vervorming** | Polygontranslate projecteert dezelfde delta op elk bestaand vertexrecord; volgorde en arraylengte blijven behouden. Geen reorderpad. |
| `IllustrationModel.update` / `Engine.updateMany` | `model.js` `update` valideert update en normaliseert object; `index.js` `updateMany` past expliciete patches op een modelkopie toe | **Indexgebonden vervorming** bij `vertices`-coördinaten; vertexaantalwijziging is topologiestructuurwijziging | Generieke gelijke-lengte array geldt volgens v1.0.1 als index-update. Nieuwe arrays worden niet geremapt. `ConstructionService.validateUpdate` weigert gewijzigde vertexaantallen voor gerefereerde vertices/edges en triangle-bronnen. |
| `object.setGeometry` | `PermissionRuntime` valideert geometry-fields en schrijft via `applyFields` naar `Engine.update` | **Indexgebonden vervorming** | Toegestane paths zijn geometry fields, o.a. `vertices[i].x/y`; geen reorder-intentie of indexmapping. Computed polygonvelden kunnen niet vrij worden aangepast. |
| `object.setProperties` | `PermissionRuntime.applyFields(...,'properties')` accepteert alleen property paths; geometry paths vallen buiten `propertyFields` | **Niet van toepassing** op vertices | `vertices` wijzigen via deze operatie wordt als ongeldig geweigerd; numerieke vertexvelden lopen via `object.setGeometry`. Geen polygon reorder. |
| `object.patchBatch` | `PermissionRuntime` zet `vertices` in `fieldsOfPatch` om naar afzonderlijke `vertices[i].x/y`-velden en voert die via `applyFields` en `Engine.update` uit; editor gebruikt dit voor gecombineerde geometry-/propertypatches | **Indexgebonden vervorming** als vertices meegaan | Patch bevat waarden, geen reorder-token. Restricted `fieldsOfPatch` vereist voor een vertices-patch dezelfde arraylengte; gelijke-lengte elementen behouden hun index. De modelcountguard blijft ook voor overige updatepaden gelden. |
| Vertices wijzigen die door driehoeksrecepten worden bepaald | `triangleFromPoints` berekent `vertices = sources.map((ref,index)=>point(...))`; resolve bewaart receptvolgorde | **Indexgebonden, constructiegedreven vervorming** | Bronvolgorde bepaalt vaste hoekpuntindices; bronverplaatsing herberekent bij dezelfde positie in de bronlijst. Geen sortering/remapping. Polygon is berekend en niet vrij geometrisch editbaar. |
| Driehoeksbron voor centrumrecepten | `triangleCenter`/`triangleM6b` leest `vertices[0..2]` in vaste arrayvolgorde | **Geen mutatie van polygon** | Alleen afgeleide punt-/cirkelgeometrie wordt bijgewerkt. De polygon-array blijft ongewijzigd; bij ongeldige bron gelden bestaande validiteits-/herstelsemantiek. |
| Parallellogramconstructie en parameterupdate | `parallelogramResult` bouwt `[A,B,C,D]`; `construction.setParallelogramParameters` past recipeparameters aan en `ConstructionService.resolve` evalueert opnieuw | **Indexgebonden, constructiegedreven vervorming** | Recept behoudt vaste vertexvolgorde A/B/C/D; verandert vorm/maat via dezelfde slotmapping, niet door indices te permuteren. Berekende `vertices` zijn computed fields. |
| `object.duplicate` / `Engine.duplicateMany` | Kopie neemt vertices in bestaande volgorde mee; geometrische delta gebruikt `MeasurementGeometry.translate`. Bij complete groepskopie worden bestaande constructiebronnen naar nieuwe IDs gemapt | **Bronvervanging** (nieuw object-ID); kopie behoudt indexvolgorde | Edge-ref op een gekopieerd polygon blijft dezelfde index; indien construction wordt gerebonden in complete groep blijft `part`/`index` behouden. Geen indexpermutatie. |
| `construction.detach` / `IllustrationModel.detachConstructions` | Verwijdert `construction`/`constructionValid` van geselecteerde berekende objecten; resolve behoudt actuele geometrie | **Niet van toepassing** op bronpolygonindices | Detach maakt geen vertexreordering. Een afhankelijke punt-edge-ref wordt niet aangepast. Een gedetacht polygon behoudt op dat moment de reeds berekende vertexvolgorde. |
| Import / `IllustrationModel.load` / `document.replace` | Importeert en valideert de volledige documentobjecten, dan `ConstructionService.resolve`; documentvervanging laadt een nieuwe modelinstantie | **Bronvervanging/inlezen** | Importarray is de nieuwe bronvolgorde en edge-indices worden volgens die array geïnterpreteerd; er wordt geen vergelijking of heuristische remap met oude live objecten uitgevoerd. Onjuiste vertex-/receptvalidatie faalt vóór modelcommit. |
| Undo/Redo | `EditorHistory.restore` herlaadt een JSON-snapshot; restricted history laadt vastgelegde `before`/`after` snapshots | **Bron-/documentstatusherstel** | Herstelt opgeslagen arrayvolgorde exact; geen sortering, permutatie of remapping tijdens replay. |
| Delete / cascade / nieuw object met zelfde uiterlijk | `object.delete`, `ConstructionService.descendants`, daarna eventueel afzonderlijke create/import | **Bronverwijdering/vervanging** | Bronnen worden op ID gevolgd. Een andere ID bindt bestaande edge-ref niet opnieuw; cascade/dependencyvalidatie blijft eigenaar. |
| Polygon aanmaken | `finishPolygon` slaat de door de gebruiker gekozen vertexlijst op na `PolygonGeometry.validate` | **Geen mutatie van bestaande bron** | Klikvolgorde is de nieuwe polygonvolgorde. Geen bestaande afhankelijke edge-ref kan hierdoor stilzwijgend wijzigen. |
| Vertexaantal wijzigen | `model.update` → `ConstructionService.validateUpdate`; document-/polygonvalidatie | **Topologische structuurwijziging** | Bestaande guard weigert wijziging als afhankelijke vertex-/edge-ref of volledige triangle-bron bestaat. Deze bescherming blijft onveranderd. |
| Expliciet herordenen / edge renumberen | Geen UI-actie, command, model-API of servicefunctie aangetroffen | **Niet aanwezig** | Geen huidige route om te blokkeren of remappen; contract v1.0.1 verlangt geen hypothetische API toe te voegen. |

## Onderbouwing en codeverwijzingen

### Identiteit, update en validatie

- `construction-service.js`: `line(o,s)` resolveert edge `i` rechtstreeks naar `vertices[i]` en `vertices[(i+1)%n]` (rond regel 276). De projectie-/evaluate-/resolve-keten gebruikt deze bronref zonder indexconversie.
- `construction-service.js`: `validateUpdate(objects,current,patch)` beschermt gerefereerde topologie tegen een wijziging van `vertices.length` (rond regels 90–96). De check maakt geen vergelijking op basis van coördinaten en blokkeert gelijke-lengte updates niet.
- `model.js`: `IllustrationModel.update` roept `validateUpdate` aan, maakt `nextData` door patch op huidig object toe te passen, valideert via `normaliseObject` en herberekent dependencies met `ConstructionService.resolve` (rond regels 229–244).
- `polygon-geometry.js`: `validate` bouwt een nieuwe map met dezelfde arrayloopvolgorde, controleert coördinaten, degeneratie en kruisende zijden; het sorteert of herschikt de vertices niet.

### Editor- en commando-ingangen

- `interaction-resolver.js`: `polygonVertex` vervangt uitsluitend de gekozen array-index; `translatePolygon` vertaalt dezelfde vertices in dezelfde volgorde; `translateGroup` past per object dezelfde indexbehoudende `MeasurementGeometry.translate` toe (rond regels 6–25).
- `editor.js`: numerieke vertexingave bouwt een map die alleen gekozen index/veld wijzigt (rond regels 450–462); polygonhandles starten een vertex-interactie; `pointerMove` maakt voor runtime `object.setGeometry` met `vertices[i].x/y` en voor auteur dezelfde type-patch; polygon/group objectdrag gebruikt de resolver (rond regels 970–1097).
- `editor.js`: `updateObject` splitst geometry-only updates naar `object.setGeometry`, property-only naar `object.setProperties`, en gemengde updates naar `object.patchBatch` (rond regels 116–127; exacte code is op commit geverifieerd).
- `permission-runtime.js`: `object.setGeometry`, `object.setProperties` en `object.patchBatch` gebruiken `applyFields`; property-only velden moeten in `propertyFields` zitten, geometry velden in `geometryFields`; elk resulteert in `e.update` (rond regels 29–42 en 150–157). Er is geen polygon-specifieke permutationstap.

### Constructie, kopie en lifecycle

- `construction-service.js`: `triangleFromPoints` bewaart bronvolgorde in `sources.map`; `parallelogramResult` bouwt vaste volgorde `[A,B,C,D]` (rond regels 256–257); `resolve` evalueert die berekende polygonen opnieuw volgens het recipe (rond regels 259–270 en 329–335).
- `index.js`: `Engine.duplicateMany` kopieert normale polygonvertices via `MeasurementGeometry.translate`; complete groepskopieën mappen alleen bron-IDs, niet onderdeelindices (rond regels 119–131).
- `model.js`: `detachConstructions` haalt alleen constructionvelden weg en resolveert resterende objecten; geen vertexmutatie (rond regels 259–263).
- `model.js`/`index.js`: `load` valideert objecten en resolved het volledige nieuwe document; `Engine.load` vervangt de modelinstantie pas nadat `IllustrationModel.load` gelukt is (`model.js` rond regels 321–374; `index.js` rond regels 232–239).
- `editor-history.js`: `capture` bewaart `toJSON`; `restore`, `undo` en `redo` laden de snapshot zonder vertices te transformeren (rond regels 7–28). Restricted undo/redo laadt dezelfde history snapshots via `PermissionRuntime`.

### Zoekcontrole op herordening

De productiecode is doorzocht op vertex-/edge-sortering en `.reverse()`/`.sort()`-gebruik in polygonmutatiepaden. De gevonden `.sort()`-aanroepen betreffen o.a. numerieke snijpuntwortels, hit-/snapprioriteit en command-/digestvolgorde. De gevonden `.reverse()`-aanroepen betreffen dependency-traversal, groeps-/laagpresentatie of menuvolgorde. Geen van deze bewerkingen wordt toegepast op een polygon `vertices`-array of op een `edge.index`-referentie.

## Bestaande topologievalidatie

De bestaande vertex-countguard blijft de relevante harde topologiebescherming: bij afhankelijke onderdeelrefs (`vertex`/`edge`) of whole-object triangle-bronnen weigert `ConstructionService.validateUpdate` een andere vertexlengte. Daarbovenop weigert `PolygonGeometry.validate` ongeldige polygonvormen. Restricted geometriewrites gaan door dezelfde `IllustrationModel.update`-validatie; autorisatie voorkomt dat computed polygonvelden worden overschreven. Geen aanvullende M-PATH.0-guard is nodig voor generieke gelijke-lengte coördinaatupdates onder de v1.0.1-indexconventie.

## Resterende risico's en grenzen

1. Een externe caller kan een gelijke-lengte array bewust met omgekeerde fysieke vertexvolgorde aanleveren. Volgens §5.2 van v1.0.1 is dat in een generiek updatepad nog steeds een **indexgebonden coördinatenupdate**: refs blijven naar dezelfde array-index wijzen; het systeem claimt niet de materiële identiteit van een herkende rand te bewaren. Een apart vertex-identiteitscontract valt buiten M-PATH.0.
2. Volledige documentimport/vervanging bepaalt de vertexvolgorde uit het aangeleverde document. Validatie garandeert structurele geldigheid, geen semantische overeenkomst met een eerder geladen document. Dit is de door contract genoemde bronvervanging/inleesgrens.
3. Er is geen expliciete reorder-API aangetroffen. Als zo'n operatie later wordt ontworpen, vereist die een apart contract en moet ze afhankelijke refs atomair weigeren of correct remappen.
4. Deze P2 controleert uitsluitend topologie-mutatiepaden. Zij heropent geen overige implementatievragen uit P, zoals aliasdispatch, previewpariteit, ambiguity UX, permissiepariteit of tests.
5. Er zijn geen tests uitgevoerd; dit rapport claimt geen geautomatiseerde of handmatige PASS.

## GO/NO-GO voor de volgende beslissingspoort

**GO-aanbeveling voor afzonderlijke gebruikersbeslissing over M-PATH.0-I.** De oude NO-GO-topologieblokkering is volgens de normatieve vaste-indexsemantiek van v1.0.1 opgelost: alle aangetroffen bestaande mutatieroutes bewaren vertexvolgorde of zijn document-/bronvervanging; er is geen bestaande stille indexpermutatie. De vertex-countguard en polygonvalidatie blijven intact.

Dit is alleen een positieve P2-topologie-uitkomst. De gebruiker moet nog afzonderlijk GO geven voor M-PATH.0-I. Geen productiecode, schema, contract of bestaande menu-ingang is in deze P2 gewijzigd.
