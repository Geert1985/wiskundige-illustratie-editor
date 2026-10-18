# WIE-TOOL-L5.4 — Audit gedeelde gereedschapsfamilies

Datum: 17 oktober 2026  
Branch: `codex/wie-tool-l5-4-shared-tool-families`  
Basis: actuele `origin/main` `01c4ac64eda18dcc74a268697f7534191fc3a121` (L5.3 via PR #45)  
Scope: L5.4a gedeelde vrije tekengereedschappen, L5.4b meerpuntstools en L5.4c de 21 generieke constructiegereedschappen

## 1. Uitkomst

De drie onderzochte families gebruiken al de gedeclareerde lifecycle in `ToolCatalog` en de centrale `completeToolInteraction()` op hun bestaande succesroutes. De audit vond geen integratiekloof die productiecodewijziging rechtvaardigt. Deze oplevering voegt gerichte integratietests en documentatie toe; `editor.js`, `editor.html` en de command-/geometriecode zijn niet aangepast.

**GO voor de afgebakende L5.4-contracten op basis van gerichte Node-verificatie. CONDITIONAL GO voor bredere UX-acceptatie zolang de eerder vastgelegde L4-browser/native-dialogcontrole openstaat.** Er is in L5.4 geen browser- of Edge-run uitgevoerd en er wordt geen browsergedrag geclaimd.

## 2. Architectuur en eigenaarschap

`editor.html` declareert per creatiegereedschap lifecycle- en adaptermetadata. `ToolCatalog.build()` leest deze waarden in en `ToolCatalog.create()` valideert ze. De adapterfamilie is typerende metadata; zij dispatcht zelf geen invoerhandler. De concrete route blijft bij de editor en bestaande services.

Na een succesvolle canvasactie roept de route `completeToolInteraction()` aan. Deze centrale functie controleert de uitkomst, ruimt de interactiestatus op, geeft pointercapture vrij, wist de preview en past de resultaatselectie toe. De lifecyclepolicy komt uit de catalogus. `repeat` houdt de huidige tool actief; `single` zet de editor terug op Selecteren. De completioncontroller maakt zelf geen documentmutatie of history-entry. De bestaande `changeDocument()`/commandgrens blijft eigenaar van mutatie, autorisatie en geschiedenis.

Bij meerstapsinvoer zijn bronkeuze, voorlopige vertices en previews tussenstappen, geen succesvolle constructies. Alleen het uiteindelijke geaccepteerde create-commando is completion. Ongeldige geometrie, onvolledige invoer en geweigerde/uitzonderlijke create-commando's leveren geen geslaagde completion op. Annuleren via Escape en expliciete toolwissel volgen de afzonderlijke cancel-/cleanuproute; die roept de succescompletion niet aan.

Het project bevat geen `construction-contract.js`. De concrete constructiedefinities, `MI.ConstructionService.contract` en contextplannen staan in `construction-service.js`; dat is de relevante contractbron voor deze audit.

## 3. Gereedschapsmatrix

| Gereedschapsnaam | Betrokken bronbestand(en) | Afsluitgedrag na succesvolle voltooiing | Technische oorzaak of verantwoordelijke functie | Uitzonderingen | Consistentiebeoordeling |
|---|---|---|---|---|---|
| Lijn (`line`) | `editor.html`, `editor.js`, `tool-catalog.js`, `tests/lifecycle.test.cjs` | Blijft actief (`repeat`). | Gedeelde draw-gesture en `linear.draw`; succesvolle uitkomst gaat naar `completeToolInteraction()`, dat de cataloguspolicy toepast. | Een mislukte commandouitkomst voltooit niet. Escape annuleert een lopende gesture via de L4-cancelroute. | Consistent met de andere vrije draw tools. |
| Rechte (`straight`) | `editor.html`, `editor.js`, `tool-catalog.js`, `tests/lifecycle.test.cjs` | Blijft actief (`repeat`). | Gedeelde draw-gesture; create via bestaande `object.create`-route en centrale completion. | Zelfde fout- en cancelgrens als de drawfamilie. | Consistent. |
| Halflijn (`ray`) | `editor.html`, `editor.js`, `tool-catalog.js`, `tests/lifecycle.test.cjs` | Blijft actief (`repeat`). | Gedeelde draw-gesture; `linear.draw`; centrale completion. | Commandweigering geeft geen succescompletion. | Consistent; gebruikt de lineaire commandvariant van de gedeelde familie. |
| Vector (`vector`) | `editor.html`, `editor.js`, `tool-catalog.js`, `tests/lifecycle.test.cjs` | Blijft actief (`repeat`). | Gedeelde draw-gesture; `object.create`; centrale completion. | Geen aparte levenscyclusuitzondering aangetoond. | Consistent. |
| Cirkel (`circle`) | `editor.html`, `editor.js`, `tool-catalog.js`, `tests/lifecycle.test.cjs` | Blijft actief (`repeat`). | Gedeelde draw-gesture; `object.create`; centrale completion. | Ongeldige/afgebroken gesture is geen succesvolle creatie. | Consistent. |
| Lengtemaat (`dimension`) | `editor.html`, `editor.js`, `tool-catalog.js`, `tests/lifecycle.test.cjs` | Blijft actief (`repeat`). | Gedeelde draw-gesture; bestaand `object.create`-pad voor het dimension-object; centrale completion. | Het model bewaart berekende lengte; geen lifecycle-uitzondering aangetoond. | Consistent met draw; semantisch meetobject maar lifecyclematig een vrije creatie. |
| Driehoek (`triangle`) | `editor.html`, `editor.js`, `tool-catalog.js`, `tests/lifecycle.test.cjs`, `polygon-geometry.js` | Blijft actief (`repeat`) na geldige vorm. | Polygoninteractie verzamelt punten; na geometrievalidatie slaat de bestaande create-route het object op en roept centrale completion aan. | Te weinig punten, ongeldige geometrie of mislukte create voltooit niet. Nieuwe vorm begint met schone vertices; Escape annuleert de lopende vorm. | Consistent met de overige meerpuntstools. |
| Veelhoek (`polygon`) | Dezelfde familiebronnen als driehoek | Blijft actief (`repeat`) na afsluiten en geldige validatie. | Vertices worden als tussenstatus opgebouwd; Enter sluit de meerpuntsconstructie en triggert daarna pas create/completion. | Open/onvolledige polygoon maakt geen object; ongeldige vorm en Escape maken geen history-entry. | Consistent, met eigen expliciete Enter-afsluiting. |
| Hoek (`angle`) | `editor.html`, `editor.js`, `tool-catalog.js`, `tests/lifecycle.test.cjs`, `measurement-geometry.js` | Blijft actief (`repeat`) na geldige vorm. | Meerpuntsinteractie en hoekvalidatie; completion volgt op succesvolle objectcreatie. | Onvolledige punten en ongeldige hoekvolgorde/geometry voltooien niet. | Consistent; geometrievalidatie is tool-specifiek, lifecycle niet. |
| Rechte hoek (`rightAngle`) | Dezelfde familiebronnen als hoek | Blijft actief (`repeat`) na geldige vorm. | Meerpuntsinteractie, hoekvalidatie en centrale completion na create. | Ongeldige/onvolledige vorm en Escape voltooien niet. | Consistent. |
| Generieke constructies (21 IDs, hieronder) | `editor.html`, `editor.js`, `tool-catalog.js`, `construction-service.js`, `tests/lifecycle.test.cjs` | Keert na geslaagde constructie terug naar Selecteren (`single`). | `constructionClick()` verzamelt rollen/bronnen via ConstructionService; na geldige broncombinatie voert de bestaande route `construction.create` uit en geeft het resultaat door aan `completeToolInteraction()`. | Bronkeuze is geen completion. Ongeldige broncombinatie, geometrisch lege uitkomst of commandofout voltooit niet; herstelbare bronkeuze blijft beschikbaar waar bestaande handler dat ondersteunt. Multi-resultaat (Raaklijn) selecteert beide resultaten maar maakt één create/completion/historystap. | De 21 delen één policy en generieke centrale route; details van bronrollen en payload blijven terecht bij ConstructionService. |

De 21 generieke ID's zijn `construct:midpoint`, `construct:perpendicular`, `construct:perpendicularBisector`, `construct:bisector`, `construct:lineBetweenPoints`, `construct:parallel`, `construct:tangent`, `construct:circleByCenterPoint`, `construct:triangleFromPoints`, `construct:centroid`, `construct:circumcenter`, `construct:orthocenter`, `construct:incenter`, `construct:incircle`, `construct:eulerLine`, `construct:ninePointCircle`, `construct:anglePoints`, `construct:angleDirections`, `construct:polygonRegion`, `construct:circleSectorRegion` en `construct:circleSegmentRegion`.

De L5.4c-verificatie combineert daadwerkelijke EditorApp-routeproeven voor alle genoemde constructies: de 12 al door L3.2 bestreken vormen en de negen resterende vormen in de nieuwe L5.4-test. Een afzonderlijke catalogustest controleert dat alle 21 `single` + `construction` declareren. Gespecialiseerde `construct:intersection`, `construct:pointOnObject`, `construct:ellipseByFociAndPoint` en `construct:parallelogramBySideAngle` zijn geen onderdeel van de 21; hun routes zijn in eerdere L3-fasen behandeld. `point` is de L5.3-pilot en `text` heeft een eigen editor-/commitroute.

## 4. Verschillen tussen familie- en interactietypen

- **Vrij tekenen en meten:** zes gereedschappen delen een gesture-/preview-/pointer-up-flow en zijn alle `repeat`. Lengtemaat is inhoudelijk een meetobject, maar volgt qua creatie de drawfamilie. `line` en `ray` gebruiken de lineaire commandvariant; de overige vier gebruiken `object.create`. Die commandkeuze verandert de lifecyclepolicy niet.
- **Meerpuntstekenen:** de vier tools delen vertexopbouw en preview. Driehoek, hoek en rechte hoek kunnen op de finale geldige puntinvoer worden afgerond; een vrije polygoon sluit op Enter. Herstart na succes wist de vorige vertexstatus. Tussenpunten zijn geen objecten en maken geen history-entry.
- **Generieke constructies:** bronselectie volgt de `ConstructionService`-rollen en kan meerdere stappen beslaan. Het uiteindelijke create-commando is één completion. Eén constructie kan meerdere objecten opleveren; selectie is dan meervoudig terwijl lifecyclecompletion één keer plaatsvindt.
- **Objectafhankelijke gespecialiseerde routes:** de 21 generieke constructies omvatten geen punt-op-object, ellips op brandpunten, parallellogramplaatsing of snijpunt. Deze hebben eigen meerstaps-/plaatsingsdetails en hun bestaande routes zijn al centraal gemigreerd in L3.3a–L3.4. Context-`complete` houdt de actieve tool en onafhankelijke interactie aan; context-`prefill` wacht op de latere canvasklik. Dit is geen uitzondering binnen de L5.4-families.
- **Tekst:** tekst is één van de 12 `repeat`-gereedschappen uit de bredere catalogus, maar niet een vrij draw- of meerpuntstool. De editor heeft een eigen `text.commit`-route en overlay-Escape-prioriteit; het is eerder in L3.5 behandeld.

Deze afbakening is bewezen door de catalogus, de routecode en genoemde gerichte tests. Er is geen nieuwe plaatsingshandler uitgevonden voor L5.4; de bestaande `placement`-adapter wordt niet gebruikt door de 21 generieke vormen in deze audit.

## 5. Activeren, succes, fout en annuleren

Activeren gebeurt vanuit de bestaande gereedschapsbediening via `setTool()`. Die controleert de bestaande toegang en ruimt een voorgaande interactie op voordat het nieuwe tool-ID actief wordt. De tests roepen de EditorApp-interactieroutes aan; dit bewijst de route-integratie maar geen visuele browserervaring.

Bij succes is het commandresultaat leidend. De centrale completion weigert een mislukte uitkomst. Een succesvolle completion ruimt tijdelijke interactiestatus op, laat de centrale controller de cataloguspolicy toepassen en bewaart de bestaande selectie-/pointer-/previewregels. Documentmutatie en undo/redo blijven onder de bestaande command- en historylagen.

Bij ongeldige geometrie komt de constructie niet op de creategrens. Bij een commandweigering of uitzondering wordt geen succesvolle completion gemeld. Tests voor constructies bewijzen dat representatieve bronkeuzes herstelbaar blijven; ze simuleren niet ieder fouttype voor elk van de 21 vormen afzonderlijk. De bestaande L3.1-regressie controleert dat een geometrisch ongeldige driehoek niet gelijk wordt behandeld aan een commandweigering en dat een volgende geldige poging kan slagen.

Escape loopt via `cancelActiveInteraction({reason:'escape'})` wanneer er een annuleerbare canvasinteractie bestaat; annuleren is gescheiden van succescompletion en history. Een expliciete toolwissel force-clean’t pending interactie. De L5.4-tests controleren Escape tijdens een nieuwe meerpuntgesture en toolwissel/foutgedrag via bestaande L3/L4-regressies. Volledige prioriteit van overlays, focus en native dialoog-events is niet in deze Node-tests bewezen.

## 6. Verificatie en bewijsgrenzen

Op de L5.4-branch opnieuw uitgevoerd:

```text
node --test --test-name-pattern="WIE-TOOL-L5.4a|WIE-TOOL-L5.4b|WIE-TOOL-L5.4c|WIE-TOOL-L3.1 command failures|WIE-TOOL-L3.1 triangle polygon angle and right angle|WIE-TOOL-L3.1 invalid triangle geometry|WIE-TOOL-L3.2 generic|WIE-TOOL-L3.4 context|WIE-TOOL-L4 Escape cancels a free line|WIE-TOOL-L4 explicit tool switch" tests/lifecycle.test.cjs
14/14 geselecteerde tests PASS

node --test tests/tool-catalog.test.cjs tests/construction-contract.test.cjs tests/constructions.test.cjs
31/31 tests PASS

node --check tests/lifecycle.test.cjs
PASS

git diff --check
PASS
```

De gerichte tests bewezen: zes vrije tekenroutes met herhaalde creatie; geldige en ongeldige meerpuntroutes, herstart en Escape; metadata van alle 21 generieke constructies; daadwerkelijke EditorApp-successroutes voor alle 21 door de nieuwe negen routeproeven plus de bestaande twaalf L3.2-proeven te combineren; selectie/history/undo/redo; representatieve commandfout/retry; context-complete/prefill; en L4-canvasannulering/toolwisselregressie.

Niet uitgevoerd: volledige Node-suite, `tests/browser-tool-escape.cjs`, Edge-run, handmatige browseracceptatie en runtime-autorisatieweigering voor elk individueel gereedschap. De bekende L4-beperking (Playwright ontbrak in de betreffende eerdere checkout, waardoor native dialoog-/browser-eventvolgorde onbewezen bleef) blijft daarom open. De L5.4-Node-tests bewijzen geen browserfocus of native dialooggedrag. Een execute-fouttest is geen runtime-permissietest.

## 7. Gewijzigde bestanden

- `tests/lifecycle.test.cjs`: drie L5.4-tests die de gedeelde drawfamilie, meerpuntfamilie en generieke constructiefamilie aan de bestaande catalogus-/EditorApp-routes koppelen.
- `docs/DEVELOPMENT-ROADMAP.md`: roadmapversie 2.8.52 en L5.4-status, branchbasis, testresultaat en vervolgadvies.
- `docs/WIE-TOOL-L5-4-REPORT.md`: dit auditrapport.

Productiecode is niet gewijzigd. Er is geen volledige suite of browser-/Edge-run gestart.

## 8. Consistentie en aanbevelingen

De succeslevenscyclus is consistent binnen de onderzochte declaratieve families: catalogusmetadata levert policy, bestaande featurehandlers blijven verantwoordelijk voor geometry/input/commandpayload en `completeToolInteraction()` past de policy toe na geaccepteerd succes. Het onderscheid `repeat` versus `single` is expliciet en testbaar. De feitelijke verschillen zitten in de invoer- en geometriehandlers, niet in een parallel lifecyclebeleid.

Aanbevelingen voor uniform beheer:

1. Houd lifecyclepolicy uitsluitend in de gevalideerde catalogusmetadata en behandel adapterlabels niet als dispatchinstructie.
2. Laat alle featurehandlers hun bestaande commanduitkomst expliciet aan één completiongrens geven; completion moet fout, annulering en succes gescheiden houden.
3. Behoud familiegerichte contracttests plus enkele routeproeven met echte `EditorApp`/command/historyintegratie. Een declaratiecheck alleen bewijst niet dat een route completion aanroept.
4. Behoud een expliciet annuleringscontract: Escape annuleert eerst de actuele overlay/subeditor volgens prioriteit, daarna hoogstens één canvasinteractie; annulering voltooit nooit en maakt geen history-entry.
5. Pak in L5.5 hoogstens de resterende gespecialiseerde `single`-families of adapter-/routegrenzen aan. Neem de al gemigreerde punt-op-object-, ellips-, parallellogram- en snijpuntroutes alleen opnieuw op bij concreet gevonden inconsistentie.
6. Plan de ontbrekende gerichte browserverificatie van L4 afzonderlijk zodra de voorgeschreven Playwright/Edge-runner beschikbaar is; markeer die acceptatie niet als bewezen door Node-fixtures.

## 9. Definitieve beoordeling

**L5.4a: GO** voor de zes vrije teken-/meetcreatieroutes op basis van de geselecteerde tests.  
**L5.4b: GO** voor de vier meerpuntstools op basis van de geselecteerde tests.  
**L5.4c: GO** voor de declaratie en centrale completionroutes van de 21 generieke constructies op basis van de gecombineerde L5.4/L3.2-tests.  
**L5.4 totaal: CONDITIONAL GO** voor bredere gebruikersacceptatie, uitsluitend omdat de eerder bekende L4-browser/native-dialogeventvolgorde openstaat; de afgebakende L5.4 Node-contracten zijn geslaagd. De branch is niet naar `main` gemerged.
