# WIE-TOOL-L5.2 — Centrale gereedschapsregistratie en contractvalidator

Datum: 17 oktober 2026

Branch: `codex/wie-tool-l5-2-registry-validation`

Basis: actuele `origin/main` `f26daa1fc6d1ecff43db57d81f3b0da34561f758`, inclusief de gemergede L5.1-audit.

Scope: declaratieve metadata en validatie; geen geometrische algoritmen, commandoperaties of handlerroutes gewijzigd.

## 1. Samenvatting

De bestaande markupgedreven `ToolCatalog` is uitgebreid tot de canonieke registratie voor alle 37 beschikbare creatiegereedschappen. Elke bestaande `<button data-tool>` in de gereedschapscatalogus draagt nu ook `data-lifecycle` en `data-interaction-adapter`. `ToolCatalog.build()` leest deze waarden uit dezelfde entries die al sidebar, fullscreenkiezer en contextaanbod voeden; `ToolCatalog.create()` valideert en bevriest de genormaliseerde registratie.

De lifecyclecontroller leest de policy uit `this.toolCatalog.getTool(toolId)`. De onafhankelijk bijgehouden `TOOL_LIFECYCLE`-map is verwijderd. `MI.ToolLifecyclePolicies` blijft voor tests en eventuele tijdelijke compatibiliteitsconsumers bestaan, maar wordt alleen bij `EditorApp`-constructie uit de catalogusentries afgeleid. Succes op `canvas` en `context-complete` behoudt de bestaande betekenis; een onbekende completion-origin wordt nu vroeg en expliciet geweigerd.

**Beoordeling: CONDITIONAL GO.** De registratie-, completion- en geselecteerde lifecyclecontracten zijn gericht getest. De afzonderlijke L4-beperking rond echte browser/native-dialogvolgorde blijft open; L5.2 heeft die browserdekking niet opnieuw uitgevoerd of als opgelost aangemerkt.

## 2. Gekozen registratiestructuur

Er is geen aparte registry of lijst met tool-ID's toegevoegd. De bestaande `editor.html`-toolknoppen blijven de bron van toolidentiteit, label/presentatie en implementatiestatus. De twee nieuwe declaratieve attributen zijn onderdeel van diezelfde entry. De catalogus projecteert deze attributen als `lifecycle` en `interactionAdapter` op de bestaande catalogusentry.

De runtime-API `list()`, `getTool()`, splitgroepen, UI-labels, iconen, tool-ID's en `commandToolId`-afleiding zijn behouden. De werkelijke commandoperatie is niet geregistreerd: bijvoorbeeld `construct:*` als `commandToolId` is de tool-/autorisatie-ID, niet de operation `construction.create`.

## 3. Canonieke bron van waarheid

- Tool-ID, label, presentatie, lifecycle en adapterfamilie: entry in `editor.html`, gelezen en gevalideerd door `ToolCatalog`.
- Lifecycle-uitvoering na succes: `EditorApp.completeToolInteraction()` leest de policy van de catalogusentry.
- Tijdelijke compatibiliteitsview: `MI.ToolLifecyclePolicies` wordt uit de actieve catalogus opgebouwd; geen tweede policybron.
- Geometrie, invoerstappen, previews, commandautorisatie, history en annulering: bestaande editor-, service- en commandroutes blijven eigenaar.

De HTML-structuur en alle 37 bestaande tool-ID's zijn behouden. `select`, `pan`, `zoomIn` en `zoomOut` worden als niet-creatiemodi geweigerd wanneer ze per ongeluk als catalogusentry worden aangeboden. Geplande placeholders kunnen lifecycle-/adaptermetadata noch interactieve ID-/commandvelden dragen.

## 4. Definitieve adapterfamilies

De metadata beschrijft de bestaande invoer-/interactieroute. Zij registreert of activeert geen uitvoeringsdispatcher.

| Familie | Aantal | Bestaande route / afbakening |
|---|---:|---|
| `point` | 1 | Vrij punt: één canvaspunt en create-commit. |
| `draw` | 6 | Gedeelde vrije tekeninteractie: `line`, `straight`, `ray`, `vector`, `circle`, `dimension`. Lengtemaat is inhoudelijk een meting, maar gebruikt de gedeelde draw-interactie. |
| `polygon` | 4 | Meerpuntsroute: `triangle`, `polygon`, `angle`, `rightAngle`. |
| `construction` | 22 | Bron-/receptgestuurde constructieroute, inclusief de universele `construct:intersection`-routering. |
| `placement` | 3 | Gespecialiseerde bron-/plaatsingsroute: `construct:pointOnObject`, `construct:ellipseByFociAndPoint`, `construct:parallelogramBySideAngle`. |
| `text` | 1 | Asynchrone teksteditor/commitroute. |

De aantallen tellen op tot 37. Lifecycletelling blijft 12 `repeat` en 25 `single`. Alle 37 huidige ID's en hun familie zijn vastgelegd in de gerichte cataloguscontracttest. Dit is een gecontroleerde beschrijving van bestaande code, geen bewijs dat elke handler altijd bereikbaar of geometrisch correct is.

## 5. Validatieregels en bewijsgrenzen

`ToolCatalog.create()` verwerpt:

- Een niet-ondersteunde implementatiestatus of ongeldig entry-object.
- Ontbrekend ID/`commandToolId` op een geïmplementeerde tool, dubbele tool-ID's en dubbele categorie-/split-ID's (bestaande controles blijven behouden).
- Een lifecycle anders dan exact `repeat` of `single`, met `Unknown lifecycle policy for tool: ...`.
- Ontbrekende of onbekende adapterfamilies, met `Missing interaction adapter for tool: ...` respectievelijk `Unknown interaction adapter for tool: ...`.
- Een navigatiemodus als creatietool en een geplande placeholder met interactieve metadata.

`completeToolInteraction()` weigert een completion-origin buiten `canvas` en `context-complete` met `Unknown completion origin: ...`, ook voordat het outcome verder wordt verwerkt. Een geslaagde completion voor een ID die niet in de catalogus staat, faalt expliciet. `context-complete` blijft de bestaande policy behouden en laat onafhankelijke interactie-/toolstatus ongemoeid.

**Registratievalidatie (statisch):** ID/status/metadata zijn afkomstig uit dezelfde ingelezen catalogusentries; ontbreken of fouten in de metadata van een zichtbare implemented-entry falen tijdens catalogusopbouw. De test vergelijkt de actuele inventaris met de L5.1-baseline van 37 IDs, lifecycleaantallen en adapterfamilies.

**Structurele adaptervalidatie (statisch):** alleen de zes toegestane familienamen kunnen in productie worden toegelaten. De catalogus importeert geen handlermodules en kan dus niet bewijzen dat een familiecode werkelijk door elke tool wordt aangeroepen.

**Gedragsvalidatie (tests):** representatieve bestaande routeproeven controleren punt-/teken- en tekstherhaling, generieke single-constructies, meerresultaatselectie, context-prefill, mislukte commits en L4-annulering. Niet alle 37 tools zijn opnieuw één voor één interactief doorlopen; er is geen volledige browser- of suite-run uitgevoerd.

## 6. Gewijzigde bestanden

- `editor.html`: lifecycle-/adapterattributen voor de 37 bestaande creatietools; gedeeld klassieke-scriptcachetoken verhoogd.
- `tool-catalog.js`: metadata ophalen, geldige lifecycle-/adapterenum afdwingen en navigatie-/planned-entrygrenzen aanscherpen.
- `editor.js`: lifecyclemap verwijderd; afgeleide compatibiliteitsview toegevoegd; completion gebruikt catalogusentry en accepteert alleen bekende origins.
- `tests/tool-catalog.test.cjs`: catalogusfouten, geplande tools, 37-ID-inventaris, lifecycleaantallen en adaptergroepen.
- `tests/lifecycle.test.cjs`: catalogusgebaseerde fixtures, lifecycleview/completionregressies en onbekende origin.
- `tests/point-on-object-ui-switch.test.cjs`: fixtures gebruiken de catalogusmetadata en sluiten `select` uit van creatieentries.
- `tests/browser-asset-compat.cjs`, `tests/left-sidebar-navigation.test.cjs`, `tests/radial-petals.test.cjs`: cachetokenverwachtingen bijgewerkt.
- `docs/DEVELOPMENT-ROADMAP.md`: L5.2-implementatie en status geregistreerd.
- `docs/WIE-TOOL-L5-2-REPORT.md`: dit verslag.

## 7. Compatibiliteitsstrategie

De toolknoppen, ID's, labels, iconen, categorieën, splitmenu's en commandtool-ID's zijn behouden. De editorhandlers en geometrieservices zijn niet herschreven. `repeat`/`single`, selectie na succes, context-complete, commanddispatch, permissies, Undo/Redo, previews, pointercapture en Escape blijven via bestaande code lopen. Het gedeelde release-cachetoken is bijgewerkt volgens de bestaande projectconventie en de bijbehorende kleine asset-/UI-contracttests zijn aangepast.

## 8. Gerichte testresultaten

Geslaagd:

```text
node --test tests/tool-catalog.test.cjs tests/point-on-object-ui-switch.test.cjs tests/browser-asset-compat.cjs tests/left-sidebar-navigation.test.cjs tests/radial-petals.test.cjs
12/12 PASS

node --test --test-name-pattern="WIE-TOOL-L5.2|WIE-TOOL-L3.4 context prefill|WIE-TOOL-L3.2 generic linked constructions|WIE-TOOL-L3.5|WIE-TOOL-L4" tests/lifecycle.test.cjs
16/16 geselecteerde tests PASS

node --test --test-name-pattern="WIE-TOOL-L3.4 context-complete|WIE-TOOL-L1 context complete" tests/lifecycle.test.cjs
3/3 geselecteerde tests PASS

node --check op alle gewijzigde JavaScriptbron- en testbestanden
PASS

git diff --check
PASS
```

Geen volledige Node-suite, browsermodule of volledige Edge-run uitgevoerd.

## 9. Bekende beperkingen

- De catalogus valideert bekende familienamen en hun handmatig gecontroleerde indeling, maar voert geen statische handler-/modulekoppeling uit. Een adapterlabel is metadata, geen garantie dat de route bestaat.
- De verwachte L5.1-inventaris van 37 IDs wordt in tests bewaakt. Runtimecatalogus kan zelf alleen entries valideren die de actuele UI-markup aanbiedt; zonder aparte ID-bron kan runtime niet weten dat een geheel verwijderde toolknop een vroegere tool was.
- `MI.ToolLifecyclePolicies` is een tijdelijke test-/compatibiliteitsview. Er zijn in productiecode geen resterende policyconsumers naast `completeToolInteraction()` gevonden; latere opruiming kan de view verwijderen zodra externe/testconsumers geen compatibiliteit meer nodig hebben.

## 10. Resterende risico's

- Het L4-rapport meldt dat de gerichte Edge-module niet kon starten door ontbrekende Playwright (`MODULE_NOT_FOUND`). Native dialoogvolgorde, echte browserfocus/capture en fullscreen-Escape zijn daarmee nog niet browserbewezen. L5.2 voert geen browserrun uit en lost dit restrisico niet op.
- De metadata-indeling kan structureel geldig zijn terwijl er een foutieve handlerkoppeling bestaat. Een latere migratie die consumers op `interactionAdapter` laat dispatchen, vereist aparte route-/gedragstests en valt buiten L5.2.
- Geen volledige applicatieregressie is uitgevoerd; de uitgevoerde checks zijn beperkt tot catalogus, relevante lifecyclepaden en kleine UI-/cachecontracten.

## 11. Beoordeling

**CONDITIONAL GO voor L5.2.** De centrale registratie, early validation en geselecteerde regressies voldoen aan de implementatiescope. De L4-browserbeperking blijft een reeds gedocumenteerd risico en is geen L5.2-PASS. Er is geen merge naar `main` uitgevoerd.

## 12. Aanbeveling voor L5.3

Start met één pilottool (`point`) die bij succesvolle completion de genormaliseerde catalogusentry gebruikt. Behoud de bestaande `completeToolInteraction()`-grens en wijzig geen handlerfamilies tegelijk. Test succes/herhaling, geweigerde create zonder history/completion, selectie en undo/redo. Behandel vervolgens de resterende families gefaseerd; verwijder de compatibiliteitsview pas nadat geen consumers hem meer nodig hebben. L5.3 is niet gestart.
