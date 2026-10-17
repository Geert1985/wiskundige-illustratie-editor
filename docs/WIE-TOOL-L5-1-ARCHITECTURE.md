# WIE-TOOL-L5.1 — Architectuuraudit declaratieve gereedschapsregistratie

Datum: 17 oktober 2026
Branch: `codex/wie-tool-l5-1-declarative-registration-design`
Basis: actuele `origin/main` `89ffb3da0f8bdd9ed67eecfcb666634c1eea75a1` (merge PR #42, L4).
Scope: read-only architectuuraudit en ontwerp; geen productiecode gewijzigd.

## 1. Samenvatting

WIE heeft één catalogus voor de zichtbare gereedschappen, maar nog geen declaratieve levenscyclusregistratie in die catalogus. `ToolCatalog` leest de 37 zichtbare gereedschaps-ID's uit `editor.html`; `EditorApp` controleert die bij opstart tegen een tweede, handmatig bijgehouden lijst `TOOL_LIFECYCLE` in `editor.js`. De lifecyclelijst legt op dit moment alleen `repeat` of `single` vast. Interactietypen, succesroutes, commando's, contextacties en annuleringsgedrag zitten in editorhandlers en constructieservices.

Het centrale gedrag werkt inmiddels voor de normale creatieroutes: `completeToolInteraction()` voert bij canvas-success cleanup uit, draagt selectie over en past `repeat`/`single` toe. `cancel()` rolt een lopende interactie terug; `cancelActiveInteraction({reason:'escape'})` coördineert Escape. De 37 gereedschappen zijn verdeeld in 12 herhaalbare vrije gereedschappen en 25 eenmalige gekoppelde constructies. Dat externe onderscheid is stabiel, maar een nieuw gereedschap vereist nog wijzigingen op meerdere plaatsen en de startupcontrole valideert de policywaarden en routekoppelingen niet volledig.

**Voorkeur: optie A, de bestaande `ToolCatalog` uitbreiden tot de enige registratiebron.** Behoud de bestaande catalogus-API en tool-ID's. Verrijk geïmplementeerde entries met alleen metadata die gedrag aanstuurt; laat editorhandlers, geometrie, autorisatie, commands en history eigenaar van hun specialisaties. `TOOL_LIFECYCLE` kan tijdens de migratie een tijdelijke adapter naar de catalogus blijven, daarna verdwijnen. Dit breidt de huidige catalogus uit en introduceert geen tweede toolcatalogus.

**Beoordeling L5.1: CONDITIONAL GO voor ontwerp en L5.2-preflight.** Het huidige contract en de bestaande code bieden een goede migratiebasis. Voor implementatie moeten de semantiek van `single` bij objectacties, context-complete, meerdere resultaten, async tekstcommit en de precieze omvang van declaratieve adapters in L5.2 worden vastgesteld. Deze audit geeft geen productie-implementatie-GO.

Bewijslabels in dit rapport: **Bewezen** betekent direct zichtbaar in actuele broncode of bestaande gerichte rapport-/testdekking. **Afgeleid** betekent een architectuurconclusie uit die bronnen. **Open** betekent dat broncode alleen geen gedragsbewijs levert.

## 2. Huidige architectuur

### Registratie en presentatie

- `editor.html` bevat per beschikbaar creatiegereedschap een `data-tool`-ID. Selecteren (`select`) is een aparte navigatiemodus en behoort niet tot de 37 lifecycle-entries.
- `tool-catalog.js` (`MI.ToolCatalog.build/create`) leest categorieën, zichtbare tools, geplande placeholders en splitgroepen uit de markup. De catalogus controleert unieke categorie-, tool- en split-ID's, werkende entries met tool- en command-ID, en niet-interactieve geplande entries. Sidebar, fullscreenkiezer en contextlijsten hergebruiken deze catalogus.
- `commandToolId` wordt afgeleid als `construct:*` voor constructies en `create:<id>` voor overige tools. Dit is een autorisatie-/tool-ID, geen universele commandoperatie. De teksttool gebruikt bijvoorbeeld `text.commit`; constructies gebruiken doorgaans `construction.create`; de vrije tekenroute kan `linear.draw` of `object.create` uitvoeren.
- `editor.js` bevat `TOOL_LIFECYCLE`, een tweede lijst met dezelfde 37 IDs en de policy `repeat` of `single`. `EditorApp` vergelijkt bij een niet-lege catalogus het aantal entries en controleert dat elke catalogus-ID een policy heeft. De tijdelijke lege testfixture wordt overgeslagen.

**Bewezen duplicatie:** ID's staan in de HTML-catalogus én opnieuw in `TOOL_LIFECYCLE`; labeling en presentatie zijn alleen in de markup. Lifecycle staat alleen in de policy-map. Command-tool-ID wordt weer door de catalogusbouwer afgeleid. De daadwerkelijke commandoperatie wordt door routecode bepaald. Het zijn dus verschillende gegevens met gedeeltelijke overlap, geen complete gedeelde registratie.

### Activering, completion, commands en history

`EditorApp.setTool(tool)` controleert eerst `toolAllowed`, sluit dialogs, annuleert de bestaande interactie via `cancel()`, sluit mobiele panelen, zet navigatie terug op Selecteren, wist tijdelijke regio-invoer en activeert de tool. Een toolwissel wordt dus behandeld als force-cleanup, niet als een succesvolle completion of Escape.

`changeDocument(fn, {cancelInteraction=true})` is de synchrone command-/historygrens voor de lokale editor. Standaard annuleert deze een lopende interactie, voert `fn` uit, retourneert `{ok,result,error}`, registreert de history-snapshot en rendert. Plaatsingscommits gebruiken soms `cancelInteraction:false` om invoer te bewaren totdat het commando slaagt. Runtimecommando's gaan door `PermissionRuntime`; lokale gebruikerscommando's door `AuthorCommands`. Deze autorisatie- en historylagen worden niet vervangen door lifecyclebeleid.

`completeToolInteraction({toolId,outcome,origin,selection,successMessage})` weigert een onjuiste/ontbrekende `outcome.ok`, controleert dat `toolId` een policy-entry heeft, en kent twee bedoelde origins:

| Origin | Huidige verantwoordelijkheid |
|---|---|
| `canvas` (default) | Wist interactie, geeft pointercapture vrij, wist preview/feedback, past resultaatselectie toe; `single` roept `setTool('select')` aan en `repeat` laat de tool actief. |
| `context-complete` | Past selectie/status/render toe, maar laat tool, onafhankelijke interactie, preview, feedback en pointercapture intact. |

Succesadapter en toolpolicy zijn daardoor al gedeeltelijk gecentraliseerd, maar de aanroep blijft bij de concrete handler. De centrale functie valideert `origin` niet expliciet; een onbekende niet-lege origin valt in de canvas-cleanup-branch en mist de expliciete successtatus. Bij een policywaarde anders dan `single` valt de uitvoering in de repeat-branch. Dat is een **bewezen validatiegat**, niet een huidige fout met de bevroren, geldige constanten.

### Interacties, context en constructies

`EditorApp` in `editor.js` is de controller voor pointer-, keyboard-, teken- en constructie-interacties. De standaardroute voor gekoppelde creatie loopt via `constructionClick()` en het bestaande `construction.create`-commando; `ConstructionService` beheert recept-/bronrolvalidatie en geometrische uitkomsten. Speciale handlers blijven nodig voor Snijpunt, Punt op object, ellips-Q en parallellogramplaatsing. Polygoon-/hoekgereedschappen verzamelen punten via `polygonClick()` en valideren vóór `finishPolygon()`.

Contextaanbod komt uit `RadialProperties.contextConstructions()`, dat de catalogus raadpleegt en passende `ConstructionService.contextualPlans()` aanbiedt. `EditorApp.startContextConstruction()` controleert de actuele bron, selectie, catalogus, plan en autorisatie opnieuw. Een `complete`-plan voert direct een actie uit met `context-complete`; `prefill` start de normale canvasinteractie met vooraf ingevulde bron; `placement` start een plaatsingsinteractie. Snijpunt en Punt op object hebben aanvullende adapters vanwege hun universele/concrete receptstructuur.

Dezelfde UI-tool-ID impliceert niet één bronvorm of commandoperatie. De contextplannen zijn uitbreidbaar via constructiecontracten, maar interactiestappen en preview blijven deels gereedschapsspecifiek.

## 3. Registratiematrix van 37 gereedschappen

De matrix beschrijft alle huidige werkende `data-tool`-IDs. Gereedschappen in een rij delen het genoemde succespad; de IDs blijven individueel opgesomd om de volledigheid en het huidige beleid controleerbaar te maken. Voor elk constructie-ID geldt policy `single`; voor elk vrij creatie-ID geldt `repeat`.

| Gereedschap-ID(s) / UI-naam | Policy | Interactie en succes-/commandroute | Annulering en context | Bronnen / uitzonderingen |
|---|---|---|---|---|
| `point` — Punt | `repeat` | Eén canvaspunt → `changeDocument()` → `object.create` → centrale canvas-completion; het punt blijft geselecteerd en `point` blijft actief. | `cancel()` ruimt een lopende interactie op; ongeldige/ontoegestane actie voltooit niet. Geen construction context-plan. | `editor.html`, `editor.js` (`pointerDown`, `changeDocument`, `completeToolInteraction`), `tool-catalog.js`; L3.1/L3.5. |
| `line` — Lijnstuk; `straight` — Rechte; `ray` — Halfrechte; `vector` — Vector; `circle` — Cirkel; `dimension` — Lengtemaat | `repeat` | Gedeelde `draw`-gesture, `resolveDraw()` preview, `commit()` en command/historygrens. Lijnstuk en halfrechte gebruiken `linear.draw`; rechte, vector, cirkel en maat gebruiken `object.create` met hun bestaande tool-ID. Completion wist de gesture; hetzelfde gereedschap blijft actief. | Ongeldige/korte preview commit niet. Escape/toolwissel/onderbreking annuleert en ruimt preview/capture op; geweigerd commando completeert niet. | `editor.js` (`pointerDown`, draw/`commit`, `resolveDraw`); `interaction-resolver.js`; L1/L3.1/L3.5. **Opmerking:** Lengtemaat is inhoudelijk een meting maar volgt de vrije `dimension`-creatielifecycle. |
| `triangle` — Driehoek; `polygon` — Veelhoek | `repeat` | Gedeelde meerpuntsinteractie via `polygonClick()`, expliciete Enter of sluiten, `PolygonGeometry.validate`, daarna `object.create`; succesvolle `finishPolygon()` roept centraal completion aan. | Tussenpunten zijn geen succes. Escape annuleert de volledige onafgeronde vorm. Validatiefout houdt vertices open; commandfout houdt de vertices herstelbaar en geeft capture vrij. | `editor.js` (`polygonClick`, `finishPolygon`, `keyDown`), `polygon-geometry.js`; L3.1/L4. |
| `angle` — Hoek; `rightAngle` — Rechte hoek | `repeat` | Dezelfde meerpuntsadapter, met drie punten en `MeasurementGeometry.validateAngle()` vóór `object.create`. Succes behoudt de tool. | Geen completion vóór derde punt, geldige hoek en geaccepteerd commando. Ongeldige geometrie blijft herstelbaar. Escape annuleert. | `editor.js` (`polygonClick`, `finishPolygon`), `measurement-geometry.js`; L3.1/L4. |
| `text` — Tekst | `repeat` | Klik bewaart `pendingText` en opent de rijke editor; geen canvas-gesture/pointercapture. `submitText()` voert async editor-/commandvoorbereiding uit en commit via `text.commit`. Alleen succesvolle nieuwe tekst roept centrale completion aan; `text` blijft actief. | Escape annuleert editor/pending invoer volgens de L4-prioriteiten. Leeg, sluiten/annuleren, bestaande tekst bewerken of commitfout is geen nieuwe creatie-completion; commitfout houdt invoer open voor retry. | `editor.js` (`openRichText`, `submitText`), `text-workspace.js`, `rich-text-editor.js`, `text-insert-panel.js`; L3.5/L4. **Uniek:** async/subeditorroute en bestaand-objectbewerking buiten de create-policy. |
| `construct:midpoint` — Middenpunt; `construct:perpendicular` — Loodlijn; `construct:perpendicularBisector` — Middelloodlijn; `construct:bisector` — Bissectrice; `construct:lineBetweenPoints` — Lijnstuk door twee punten; `construct:parallel` — Evenwijdige; `construct:tangent` — Raaklijn; `construct:circleByCenterPoint` — Cirkel via punten; `construct:triangleFromPoints` — Driehoek via punten; `construct:centroid` — Zwaartepunt; `construct:circumcenter` — Middelpunt omgeschreven cirkel; `construct:orthocenter` — Hoogtepunt; `construct:incenter` — Incentrum; `construct:incircle` — Ingeschreven cirkel; `construct:eulerLine` — Eulerrechte; `construct:ninePointCircle` — Negenpuntscirkel; `construct:anglePoints` — Hoek via punten; `construct:angleDirections` — Hoek tussen richtingen; `construct:polygonRegion` — Veelhoekgebied; `construct:circleSectorRegion` — Cirkelsector; `construct:circleSegmentRegion` — Cirkelsegment | `single` | Gewone constructies gebruiken bronpickers/rolcontracten in `constructionClick()`, definitieve validatie en `construction.create`, vervolgens centrale canvas-completion → Selecteren. Tussenliggende picks/parameter- of extentkeuzes maken geen history/completion. | `cancel()`/Escape ruimt bronnen, preview, feedback en capture op en maakt geen history-entry. Geometrie-, bron- en commandoverwerping completeert niet; bronnen blijven waar de route herstelbaar is. | `editor.js`, `construction-service.js`, `construction-contract.js`/contractdata, `tool-catalog.js`; L2/L3.2/L3.5/L4. Sommige generieke tools hebben bron-/parameterkeuzes en dus niet allemaal dezelfde interactievorm. |
| `construct:pointOnObject` — Punt op object | `single` | Universele UI-tool, maar uitvoerbare recepten zijn `pointOnSegment`, `pointOnCircle`, `pointOnEllipse`; bronrolselectie plus projectie/plaatsing → `construction.create` → centrale completion → Selecteren. | Ongeschikte bron of projectie en commandfout completeert niet; bron-/plaatsingsinteractie blijft volgens retrypad bestaan. Escape ruimt de onafgemaakte route op. | `editor.js` (`constructionClick`, point-placement handlers, `startContextConstruction`), `ConstructionService`, `construction-service.js`; L3.3a/L4. **Uitzondering:** UI-ID is generieker dan het concrete runtime-/permission-tool-ID. |
| `construct:intersection` — Snijpunt | `single` | Universele tool kiest twee bronnen; `IntersectionDispatcher` kiest daarna een concreet recept. Alleen een ondersteunde broncombinatie, toegestane operatie en niet-lege resultaatlijst leidt tot `construction.create` en centrale canvas-completion. Eén of meer snijpunten worden geselecteerd; daarna Selecteren. | Na eerste bron blijft de interactie pending. Ongeldige/ondersteunde combinatie, nul snijpunten, geen resultaat of commandfout completeert niet; eerste bron blijft voor herstel staan. Escape ruimt pending bronnen en preview op. | `editor.js` (`acceptIntersectionSource`, `intersectionClick`), `intersection-dispatcher.js`, `startContextConstruction`; L1/L3.4/L4. **Uitzondering:** één UI-ID routeert naar meerdere concrete constructies en mogelijk meerdere resultaten. |
| `construct:ellipseByFociAndPoint` — Ellips via twee brandpunten en besturingspunt | `single` | Gespecialiseerde F₁/F₂-bronselectie en Q-plaatsing; `commitEllipsePlacement()`/de speciale constructionroute gebruikt `construction.create`; centrale completion → Selecteren. Bestaand of nieuw Q volgt eigen receptvertakking. | Q/preview en bronselectie blijven tijdelijk; ongeldige plaatsing/fout completeert niet. Escape geeft capture vrij, wist preview en annuleert pending Q/bronstaat zonder gedeeltelijk object. | `editor.js` (ellipse placement), `construction-service.js`, `construction-contract.js`; L3.3b/L4. **Uitzondering:** plaatsingsinteractie met atomische Q+ellipsroute. |
| `construct:parallelogramBySideAngle` — Parallellogram via zijde en hoek | `single` | Twee puntbronnen plus numerieke zijde/hoek, preview en bevestiging; `commitParallelogramPlacement()` valideert de resultaatvorm en roept `construction.create` aan, daarna centrale completion → Selecteren. | Ongeldige parameters/geometrie of geweigerd create-commando voltooit niet en behoudt herstelbare invoer. Optionele hernoeming van bronpunten kan een fout geven ná geslaagde geometrie; dat is een gedocumenteerd gedeeltelijk succes met melding, niet een rollback/retry van het object. Escape annuleert vóór commit. | `editor.js` (`commitParallelogramPlacement`), `construction-service.js`; L3.3c/L4. **Uitzondering:** numerieke parameterinteractie plus afzonderlijke optionele hernoemcommando's. |

**Telling:** vrije/herhaalbare entries: 12 (`point`, zes draw-tools, vier polygon-/hoek-tools, `text`). Gekoppelde/eenzame entries: 25 (21 generieke tools en de vier gespecialiseerde tools Punt op object, Snijpunt, Ellips en Parallellogram). Totaal: 37. De UI-catalogus bevat daarnaast `select` als modus en geplande placeholders zonder interactieve ID; die zijn geen creatiegereedschappen.

De 21 tools in de generieke rij zijn afzonderlijk zichtbaar in `editor.html` en `TOOL_LIFECYCLE`; de rijgroepering betekent niet dat iedere geometrie hetzelfde aantal bronnen, preview of parameterstappen heeft. De L3.2-rapportage noemt verschillen zoals tangent met twee resultaten, bisector-/armselectie en sector-/segment-extentkeuze.

## 4. Duplicatie en registratiegaten

1. **ID's dubbel vastgelegd:** `data-tool`-markup en `TOOL_LIFECYCLE` moeten handmatig gelijk blijven. Opstartcontrole vangt ontbrekende lifecycledekking in de normale app op, maar definieert geen registratieobject dat UI, controller en tests allemaal consumeren.
2. **Commandbetekenis verspreid:** `commandToolId` is een afgeleide autorisatie-ID. Werkelijke operations zitten in adapters (`object.create`, `linear.draw`, `construction.create`, `text.commit`, en soms meerdere). Een metadata-veld `command: 'construction.create'` zou bij punten/tekst/context de verkeerde waarheid suggereren.
3. **Policy niet volledig gevalideerd:** onbekend gereedschap bij completion geeft een TypeError, maar policytype/enum wordt niet bij catalogusopbouw/start gevalideerd. Een geldige truthy afwijkende policy doorloopt de `else`-repeat-route.
4. **Completion-callsite duplicatie:** handlers moeten zelf de lifecyclefunctie aanroepen. De gedeelde draw-, polygon- en constructieroutes reduceren duplicatie, maar speciale routecode blijft.
5. **Cancel is gedragsmatig, niet declaratief:** generieke `cancel()` heeft specifieke rollbacktakken voor object-/groeps-/labeldrag, padparameters, distributie, camera, runtime-transactie en pointercapture. Er is geen registratieveld dat bewijst dat iedere actieve interactie een passende cancel-adapter heeft.
6. **Twee tool-ID-ruimten:** UI-ID (`construct:pointOnObject`) en concrete autorisatie-/recept-ID's kunnen verschillen. Ook commandtool-ID en commandoperation zijn verschillende begrippen.
7. **Contextmodi zijn een apart contract:** `complete`, `prefill`, `placement` komen uit constructieserviceplannen; het zijn geen lifecyclepolicies. Gelijke naamvelden zouden die semantiek ten onrechte samenvoegen.
8. **Geen duplicate completion-token:** de huidige functie heeft geen expliciete interactie-id/idempotency check. De onderzochte actuele callsites roepen centraal eenmaal aan; algemene exact-once-garantie volgt niet uit de functiehandtekening.

## 5. Vergelijking van registratieopties

Schaal: Laag / Gemiddeld / Hoog is relatief aan de andere opties voor de huidige 37 tools.

| Criterium | A — bestaande ToolCatalog uitbreiden | B — `TOOL_LIFECYCLE` uitbreiden | C — aparte registry met adapters |
|---|---|---|---|
| Architecturale eenvoud | **Hoog.** Breidt de al door UI en context gebruikte entries uit; lifecyclecontroller kan entry per ID lezen. | Gemiddeld. Policy kan rijker worden, maar UI-entries blijven in catalogus en moeten gevalideerd/gekoppeld blijven. | Laag. Extra registry plus adapters en load-/initialisatiegrens. |
| Migratierisico | **Laag–gemiddeld.** Behoud `ToolCatalog.list/getTool`; eerst compatibiliteitsadapter. HTML/catalogusopbouw is wel runtimebron. | Gemiddeld. Directe lifecyclebron blijft editor-specifiek; rijke interactiemetadata dreigt tweede catalogus te worden. | Hoog. Brede koppeling aan catalogus, editor, context, command en manifest. |
| Onderhoudbaarheid | **Hoog** bij alleen gedragssturende metadata en goede validators. | Gemiddeld; policy blijft centraal, maar andere eigenschappen staan verspreid. | Gemiddeld na migratie, laag tijdens overgang; aparte registry kan een echte centrale bron zijn, maar mag geen parallelle duplicatie worden. |
| Compatibiliteit met 37 bestaande tools | **Hoog.** IDs blijven uit markup komen; in kleine groepen wordt metadata toegevoegd en gecontroleerd. | Hoog voor de bestaande policy, maar niet genoeg om UI-catalogus te vervangen. | Gemiddeld; adapter moet 37 bestaande IDs en speciale routes mappen. |
| Testbaarheid | **Hoog.** `ToolCatalog.create()` en lifecycle-controller zijn geïsoleerd testbaar; markupintegratie kan completeness afdwingen. | Hoog voor policytest; lagere dekking op ontbrekende catalogusinteractie-/contextadapter. | Hoog potentieel, maar tests moeten registry, adapter en elk consumercontract testen. |
| Uitbreidbaarheid | Hoog voor declaratieve velden waarvan centrale code het gedrag uitvoert. | Gemiddeld; wordt rijk, maar domeinvermenging met editorpolicy waarschijnlijk. | Hoog, als alle consumers registry-gebaseerd worden en geen oude bronnen overblijven. |
| Risico dubbele configuratie | **Laagst** als ID en lifecyclemetadata binnen dezelfde catalogusentry staan; HTML bevat nog altijd UI-markup, maar dat is al de huidige catalogusbron. | Hoog bij UI-ID + lifecycle-ID + interaction metadata op verschillende plaatsen. | Hoog zolang markup en registry beide tooldefinities blijven; laag alleen wanneer de registry volledig canoniek wordt en catalogus uitsluitend een weergaveadapter is. |
| Impact op UI/commands | Laag; behoud markup, `commandToolId` en bestaande dispatcher. | Laag–gemiddeld; lifecyclecentralisatie blijft in editor.js; commandroute blijft apart. | Hoog; consumer-/manifestintegratie vereist, met kans op UI-/commandkoppeling. |

### Gemotiveerde voorkeur

Kies **A**, met strikte grens: `ToolCatalog` blijft de ene bron voor toolidentiteit/status en bevat lifecyclemetadata per geïmplementeerde entry. Het betekent niet dat een catalogus declaratieve geometrie-algoritmen, commandimplementaties of annuleringscode gaat bevatten. De controller consumeert de metadata; de concrete handler blijft de geschikte interactie-/completionadapter.

De voorkeur geldt alleen als de huidige markupgedreven catalogus in L5.2 geschikt blijkt voor betrouwbare statische volledigheidscontrole. Als build-/testtooling de DOM-markup niet robuust kan uitlezen, blijft A mogelijk met een getest declaratief catalogusobject als enige ID-bron dat zowel aan UI-markup als runtime wordt gekoppeld. Dat moet een expliciete subkeuze zijn; geen tweede parallelle lijst. Optie C is alleen een fallback als die registry `ToolCatalog` daadwerkelijk vervangt als autoriteit, niet als extra lijst.

## 6. Voorgesteld declaratief contract

Doelvorm (conceptueel; veldnamen zijn voorstel, geen bestaande API):

```js
{
  id: 'construct:parallel',
  status: 'implemented',
  lifecycle: 'single',
  interaction: 'construction-sources',
  completion: 'construction-create',
  cancellation: 'editor-interaction'
}
```

| Veld | Status | Reden / grens |
|---|---|---|
| `id` | Verplicht | Bestaande stabiele UI-/tool-ID. Geen nieuwe alias of tweede ID voor dezelfde tool. |
| `status` | Verplicht (bestaand) | `implemented` versus `planned`; alleen `implemented` kan lifecyclemetadata dragen. |
| `lifecycle` | Verplicht voor creatietools | Enum `repeat`/`single`; controller voert de overgang uit. Valideer bij registratie, niet pas na succesvolle invoer. |
| `interactionAdapter` (of beperkt `interaction`-type) | Verplicht, kan per gedeelde familie | Wijst naar bestaande handlerfamilie/adapter: `point`, `draw`, `polygon`, `text`, `construction-sources`, of expliciete gespecialiseerde route. Het veld claimt geen geometrische validiteit. |
| `completionAdapter` | Alleen verplicht als niet veilig afleidbaar | Verwijzing naar bestaande route die aanvaarde uitkomst aan centrale completion meldt. Kan vaak uit interaction family volgen; context-complete blijft onderscheiden. Vermijd `commandOperation` als zogenaamd universele successbron. |
| `cancelAdapter` | Alleen verplicht wanneer extra interactiespecifieke cleanup nodig is | Generieke rollback is eigendom van `EditorApp.cancel()`; adapterlabel registreert bestaande gespecialiseerde cleanup/eigenaarschap, geen tweede cancelimplementatie. Een test moet cancel-route daadwerkelijk uitvoeren. |
| `contextModes` | Optioneel, afgeleid uit bestaande plannen | Alleen opnemen als het aanbod/control validatie stuurt. Anders `contextualPlans()` blijft autoriteit; voeg geen duplicaat van planuitkomsten toe. |
| `commandToolId` | Bestaand; behouden als authorization mapping | Niet gelijk aan een daadwerkelijke operation. Universal tools kunnen concrete toegestane tool-ID's projecteren. Geen semantische hernoeming zonder runtimecontrole. |
| `commandOperation` | Niet opnemen als algemene verplichte metadata | Succesroutes kunnen variëren of sequentieel zijn; operation wordt door adapter uitgevoerd en gevalideerd door de bestaande commandlaag. Alleen opnemen voor declaratieve commandbinding als een route echt één operation heeft en centrale dispatch die gebruikt. |
| Bronnen, geometrievaliditeit, preview, resultaatvorm, undo-semantiek | Niet declareren als policy | Bestaan al in `ConstructionService`, interaction-/commandcontracten en editorresultaten; registratie kan die correctheid niet garanderen. |

**Gedeelde family defaults:** voorkom 37 herhalingen van adapterstrings wanneer expliciete groepen het gedrag al eenduidig bepalen, maar verberg geen uitzonderingen. Een entry kan een directe waarde hebben; een catalogusgroep kan een getest default leveren. De resulterende genormaliseerde entry moet alle benodigde metadata expliciet tonen, en conflicterende overrides moeten bij build falen.

## 7. Centrale lifecycle en annulering

### Automatiseren

- De controller kan op succes policy ophalen, uitsluitend geldige enumwaarden accepteren, `single`/`repeat` toepassen en canvascleanup/selectie synchroniseren.
- Een gedeelde completionwrapper kan outcome-contract, toegestane origin, successtatus en eenmaal-afhandeling controleren. De concrete adapter blijft beslissen wanneer de geometrie en het commandresultaat werkelijk succesvol zijn.
- Generieke cleanup (interactie-eigenaarschap, capture, preview, feedback) kan na expliciete canvas-success/cancel door de bestaande editorcontroller worden uitgevoerd.
- Registratie kan bewaken dat een geïmplementeerde tool een adapterfamilie, lifecyclewaarde en cancelroute heeft.
- Dezelfde lifecycleentry kan aanbieden en starten helpen valideren, terwijl runtime/autorisatie en commandvalidatie altijd opnieuw beslissen.

### Niet automatiseren

- Geometrische bronvaliditeit, oplossing/aantal uitkomsten, toegestane tolerantie en previewvorm.
- Hoeveel bron-/parameter-/plaatsingsstappen nodig zijn en wanneer de interactie klaar is.
- Asynchrone commit- of retryregels van `text.commit`.
- Of resultaatselectie één, meerdere of geen leesbare IDs bevat.
- Hoe een contextplan `complete`, `prefill` of `placement` betekenis krijgt; `context-complete` is geen canvas-success met andere tekst.
- Specifieke rollback van runtime transactie, padpunt, distributie, label, groep, objectpreview, camera of tijdelijke geometrie zolang de editorhandler die beheert.

Contractregistratie vermindert vergeten bedrading en detecteert bepaalde mismatches. Ze bewijst niet dat een adapter correcte geometrie, atomiciteit, autorisatie, accessibility of history heeft.

### Verschillende exits blijven verschillend

| Exit / interruptie | Doelgedrag |
|---|---|
| Succesvolle canvas-completion | Alleen na geldig, geaccepteerd resultaat; cleanup, selectie en lifecyclebeleid. |
| Context-complete | Commit directe actie, behoudt voorafgaande tool en onafhankelijke pending interactie. |
| Escape | Volgt L4-prioriteiten: subeditor/dialog/paneel eerst; daarna één canvascancel; zonder annuleerbare state een no-op. |
| Toolwissel | Forceert cleanup vóór nieuwe modus, zonder completion/history uit een onafgemaakte interactie. |
| Documentreset/load/import | Force-cleanup volgens reset-/loadpad, niet als Escape of succes behandelen. |
| Pointercancel/blur/lost capture/dispose | Interruptie-eigenaar annuleert/ruimt op; geen lifecyclecompletion. |
| Commandfout/ongeldige invoer | Geen succescompletion/toolreset. Behoud invoer alleen waar de handler retry veilig ondersteunt. |

L4 bewijst geselecteerde Node-routes en documenteert de browserbeperking: de echte nested text-subeditor, native color-dialog-cancelvolgorde, focus/capture en browser-fullscreen-eventvolgorde zijn niet in Edge geverifieerd. De L4-browsermodule kon niet starten omdat Playwright ontbrak. Dit blijft een bestaande beperking en wordt niet door L5 opgelost; herhaal of claim geen browserpass zonder werkelijke browser-run.

## 8. Validatiecontract

| Controle | Statisch/buildbaar? | Gedragsmatige verificatie blijft nodig? | Voorgestelde controle |
|---|---|---|---|
| Elke zichtbare `implemented` creatietool heeft lifecycleregistratie | Ja, indien markup/catalogus in test/build wordt gelezen | Ja, voor dynamisch opgebouwde toolpresentaties | Catalogus normaliseert alle zichtbare entries; editor start alleen met volledige catalogus. Test 37/37 en onverwachte tool. |
| Geen dubbele tool-ID | Ja | Nee voor dezelfde input | Bestaande `ToolCatalog.create()` behoudt dubbele-ID-check; test in cataloguscontract. |
| Lifecyclepolicy is exact `repeat` of `single` | Ja | Gedrag van beide enumleden gericht testen | Valideer enum bij catalogusconstructie; test onbekende/leeg/niet-string. |
| Interactieadapter bestaat en is bekend | Gedeeltelijk | Ja: adapter wordt aangeroepen en integreert goed | Adapter-registry/type union + modulemanifestcontrole; representatieve echte handlerproeven. |
| Commandkoppeling is geldig | Gedeeltelijk; operations kunnen per route variëren | Ja, runtime-autorisatie en payload staan centraal | Valideer alleen expliciete adapterbinding tegen bestaande commandoperationcatalogus. Verwar `commandToolId` niet met operation. |
| Lifecycle-/interactiecombinatie geldig | Ja voor beperkte enumeraties | Ja voor async/context en routes | Combinatieregels (bv. text-dialog niet generieke pointer gesture); tests per uitzondering. |
| Iedere interactie heeft cancelroute | Statische verwijzing kan worden afgedwongen | Ja, state rollback/capture/preview/history bewijzen | Verplicht generieke of specifieke cancel-adaptermetadata; tests voor begin → cancel per interactiefamilie. |
| Elke succesvolle creatieroute meldt centrale completion | Gedeeltelijk, met search/AST/source checks | Ja, om outcome en selectie/history te bewijzen | Broncontrole op create-/commit adapters + spy/controller tests voor succes én fout. Geen claim van volledige statische bewijsbaarheid bij callbacks. |
| Contextactie-ID verwijst naar bestaande tool | Ja, `contextConstructions` leest de catalogus; runtime start hercontroleert | Ja, rechten/verouderde bron/plankeuze | Behoud de huidige catalogusfilter + startvalidatie; tests voor ontbrekende/ongeautoriseerde tool/plan. |
| Geen niet-creërende actie als creatietool | Gedeeltelijk via productdefinitie/status | Ja, semantiek beoordelen | `kind: 'create'` alleen expliciet wanneer nodig; houd `select`, navigatie, inspector/context-actie buiten creatielifecycle-ID's. |
| Success is éénmaal en geschiedenis klopt | Niet statisch bewijsbaar | Ja | Gerichte integration-tests voor callbacks, commandexception, retry, multi-output, undo/redo en duplicate invocation. |

Statische validatie ontdekt ontbrekende en fout gevormde metadata. Tests blijven nodig voor echte pointer-/keyboardinteracties, toegangscontrole, commandfouten, async tekst, resultatenselectie en rollback.

## 9. Gefaseerde migratie

Geen big bang. Elke fase behoudt bestaande ID's, commands en editorhandlers en maakt expliciete rollback mogelijk.

| Fase | Wijziging / impact | Acceptatiecriteria | Terugval | Gerichte tests |
|---|---|---|---|---|
| L5.2 — registratiecontract + validator | Breid `ToolCatalog`-entryschema uit met lifecycle en een adaptertype; genereer genormaliseerde entries uit bestaande catalogusbron. Laat `EditorApp` tijdelijk een compatibele view aan `TOOL_LIFECYCLE` leveren. Geen gedragswijziging. | Alle 37 entries exact eenmaal; policy-enum valide; bestaande sidebar/fullscreen/context/toegang blijft gelijk; onbekende adapter en missende entry falen vroeg. | Lezen uit huidige `TOOL_LIFECYCLE` zolang runtimeconsumers nog niet om zijn; geen policygedrag wijzigen. | `tool-catalog.test.cjs`, startup-completeness en gerichte snapshot van bestaande lifecycle. |
| L5.3 — vrije tool-pilot | Eén eenvoudige tool (`point`) consumeert de genormaliseerde catalogusentry voor completion; overige tools blijven legacy-pad. | Succes repeat/selectie/history; geweigerd create behoudt tool en geen false history; Escape en toolwissel blijven gelijk. | Adapter leest de oude policy-map. | Punt lifecycle/fout/retry/undo en catalogus contracttests. |
| L5.4 — gedeelde families | Migreer gedeelde `draw`, `polygon`, daarna 21 generieke constructieentries. Verplaats policylookup per route zonder geometry/commands te wijzigen. | Per familie success, invalid, commandfailure, cancel, selection, preview/capture en undo. 12 repeat- en 21 single-entries blijven gelijk. | Gefaseerd terugschakelen van consumers, geen rollback van catalogusvalidatie. | Relevante gerichte `lifecycle.test.cjs`, construction contracts, draw/polygon tests. |
| L5.5 — gespecialiseerde en context/async | Migreer Snijpunt, Punt op object, ellips, parallellogram en tekst. Houd `canvas` en `context-complete` aparte completion modes. | Multi-output, source retention/retry, Q/placement, parallellogram gedeeltelijk succes, text new/edit/failure/async, context preserve/prefill alle expliciet getest. | Per adapter kan bestaande handler completion direct blijven aanroepen met tijdelijke policyview. | L3.3a/b/c, L3.4/3.5/L4 gerichte tests; geen veronderstelde Edge PASS. |
| L5.6 — legacy opruimen | Verwijder `TOOL_LIFECYCLE` zodra alle consumers registry-derived metadata gebruiken; houd adapters enkel waar routeverschil echt bestaat. | Source search toont één toolregister; geen succesvolle create omzeilt completion; tests bewaken die grens. Roadmap/docs opgeschoond. | Laat compatibiliteitslaag staan als consumers achterlopen; geen tweede registry toestaan. | Alle gerichte registry-/lifecycle-/contextchecks; bredere suite pas als aparte opdracht. |

Fasevolgorde kan na L5.2 worden aangepast op basis van wat bestaande tests aantonen; L5.1 start L5.2 niet automatisch.

## 10. Risicoanalyse

| Risico | Wat codebasis laat zien | Ontwerpmaatregel |
|---|---|---|
| UI-ID versus command-ID | `commandToolId` autoriseert; sommige tools mappen anders naar concrete operations of capabilities. | Veldnamen exact scheiden: `id`, `commandToolId`, adapter. Operation alleen declareren als de centrale dispatcher het echt gebruikt. |
| Registratie-/scriptvolgorde | `editor.html` laadt catalogus en services in vaste volgorde; editor leest `MI.ToolCatalog` bij constructie. | Registry/catalogus mag geen `EditorApp`, `ConstructionService` of runtime importeren; validatie na afhankelijkheden maar vóór editorstart. |
| Circulaire afhankelijkheid | `EditorApp` consumeert catalogus, services en commandautoriteit. Terugverwijzen vanuit catalogus naar editor bindt lagen. | Catalogus houdt alleen data en pure validatie; adapters worden door editor aangeleverd of benoemd als stabiele types. |
| Dubbele bron van waarheid | Huidige IDs/policies zijn dubbel; registry kan derde lijst worden. | Eén canonical bron; catalogus is preferred. Compatibiliteitsadapter heeft einddatum en completeness-test. |
| Runtime-autorisatie | Toolweergave filtert allowed state; operation controleert opnieuw bij uitvoering. Contextstarter checkt opnieuw. | Metadata is geen toestemming. Behoud `toolAllowed`, capabilities en command preflight/execute. |
| Undo/redo en commandgrens | `changeDocument` registreert snapshots; runtime heeft eigen history. Placement kan edits bewust tot commit behouden. | Lifecycle alleen na geaccepteerde outcome; geen registry wrapper die commits buiten bestaande history/eigenaren doet. |
| Multi-output/selectie | Snijpunt/tangent kan meer dan één object opleveren; text runtime kan leesbaar resultaat afschermen. | Completion ontvangt geselecteerde IDs van adapter. Geen aanname “één tool → één object”. |
| Asynchrone tekst | Editor bewaart `pendingText`, rich editor state, transaction handle, new/edit targets; echte commit is async/editor-specifiek. | Text-adapter blijft gespecialiseerd; annuleer/commit zijn afzonderlijke async resultaten. Geen universele pointer completion. |
| Context `complete` versus `prefill` | Direct complete bewaart actieve tool/interactie; prefill start de canvasroute. | Contextplanmodus is afzonderlijk van lifecycle policy; test document/history/selectie en onafhankelijke interactie. |
| Pointercapture en preview | `cancel()` en completion beheren capture/preview generiek, maar sommige plaatsing previews gebruiken frames en specifieke cancelbranches. | Cancel-adaptermetadata + familiegerichte rollbacktests; geen veronderstelling dat het verwijderen van `interaction` genoeg is. |
| Previewgeometrie en geldigheid | Services bepalen resolver-/construction preview en reden van invaliditeit. | Geen algoritme of geometrievaliditeit in registry configureren. |
| Bestaande gespecialiseerde cancellation | `cancel()` heeft legacy-specifieke herstelbranches; L4 geeft prioriteit aan overlays/dialogen boven canvas. | Registry registreert eigenaarschap, maar `Esc`-ladder blijft centraal en subcomponent-first; native dialogs behouden hun eigen event. |
| Onbedoelde gedragswijziging | Een verkeerde policy wisselt repeat/single na succes en beïnvloedt toolwisseling direct merkbaar. | Maak migratie metadata-only eerst; bevries huidig gedrag met gerichte tests en vergelijk bestaande tool-ID/policy per entry. |
| Statische claims | Callback/async code kan een zoektest omzeilen of completion op onjuiste success plaatsen. | Combineer buildlint/source check met gedragstest. Noem contractvalidatie geen bewijs van semantische correctheid. |
| Browserrestrisico L4 | L4 meldt niet uitgevoerde gerichte Edge-module door `MODULE_NOT_FOUND: playwright`; native dialog-/focus-/browser-eventvolgorde blijft ongetest. | Neem dit als bestaand restrisico in elke opvolgdocumentatie; L5-registry lost browserbewijs niet op. |

## 11. Openstaande ontwerpbeslissingen

1. Blijft bestaande HTML-markup expliciet drager van lifecycle-/adaptermetadata, of krijgt `ToolCatalog` eerst een canonieke definitie die markup als UI-projectie gebruikt? Beide moeten één runtimewaarheid opleveren.
2. Hoe noem je `interactionAdapter`-families en op welke laag worden ze gevalideerd zonder dat `tool-catalog.js` editorimplementaties importeert?
3. Is `single` een toolbeleid of het standaardbeleid voor succesvolle canvascompletion? Context-complete behoudt de tool ongeacht `single`; dit verschil moet API-contractueel helder blijven.
4. Welke betekenis hebben herbruikbare contextacties die geen nieuwe objecten maken voor lifecyclecompletion? Ze zijn geen creatietool completion alleen omdat er een policy-entry bestaat.
5. Hoe identificeert de controller exact één pending interactie voor dubbele of late async completion, zonder generation-ID in elk bestaand handlerpad te forceren?
6. Moeten `commandToolId` en operations ooit samen geregistreerd worden? Huidige code toont dat dit twee dimensies zijn; L5.2 moet eerst een echte dispatcher-consumer vereisen voor operationmetadata.
7. Waar blijft de bron voor contextplannen: expliciet metadata in registry of uitsluitend `ConstructionService.contextualPlans()`? Voorkeur hier is afleiding uit de service.

## 12. L5.2-acceptatiecriteria

- Er is precies één canonical registratiepad voor tool-ID en lifecyclemetadata; geen nieuwe schaduwcatalogus.
- Alle 37 huidige geïmplementeerde creatietools zijn uniek geregistreerd, met één van exact `repeat`/`single` en een bekende interactie-/completionadapterfamilie.
- `select`, navigatie, contextacties en geplande placeholders worden niet als creatietool gemodelleerd.
- Bestaande `ToolCatalog`-consumers (sidebar, fullscreen, context) blijven dezelfde IDs/status/labels leveren; UI-markup en permissiegedrag veranderen niet.
- `TOOL_LIFECYCLE` blijft hoogstens een tijdelijke, geteste compatibiliteitsview; een verkeerde policy of onbekende origin faalt vroeg in plaats van stil als `repeat` te gedragen.
- Registry-validatie test ontbrekende en dubbele ID, ontbrekende adapter, onbekende policy, invalid status/interaction combinatie, en onjuist commandtool-ID zonder `construction.create` te verwarren met toolautorisatie.
- Representatieve gedragstests bewijzen repeat/single, canvas versus context-complete, succes versus commandfout, resultaatselectie en history; canceltests bewijzen cleanup van interactie, capture, preview, bronstatus en geen history.
- Het L4-browserrestrisico blijft expliciet open zolang de echte gerichte Edge-test niet is uitgevoerd.
- Alleen documentatie-/gerichte testresultaten die werkelijk zijn uitgevoerd worden als PASS gerapporteerd; L5.2 gaat niet automatisch over in pilotimplementatie zonder afzonderlijke opdracht.

## 13. Uitgevoerde verificatie en besluit

**Bronbasis is bevestigd:** lokale `origin/main` is bijgewerkt naar `89ffb3da0f8bdd9ed67eecfcb666634c1eea75a1`; de commit is merge PR #42 voor L4. Gerichte broninspectie omvat `AGENTS.md`, het lifecyclecontract, roadmap, L1–L4-rapporten, `editor.html`, `tool-catalog.js`, `editor.js`, `construction-service.js`, `interaction-resolver.js` en lifecycle-/catalogusregressies.

Er zijn in deze ontwerp/auditfase geen Node-, Edge- of browserregressietests gedraaid. De opdracht vraagt alleen gerichte controles waar nodig; deze rapportage is documentatie-only. L4-browserrestrisico is opgenomen als onopgelost bewijs.

**Beoordeling: CONDITIONAL GO voor L5.1-ontwerp en voorbereiding van L5.2.** De bestaande ToolCatalog is de beste uitbreidingsbasis, mits L5.2 voorkomt dat markup, registry en policy-map parallelle waarheden blijven. De open beslissingen hierboven moeten worden besloten voordat codewijzigingen starten. Geen L5.2-implementatie is gestart of geautoriseerd.
