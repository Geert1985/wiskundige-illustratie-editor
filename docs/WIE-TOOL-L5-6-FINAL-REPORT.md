# WIE-TOOL-L5.6 — Eindconsolidatie gereedschapslevenscyclus

Datum: 17 oktober 2026  
Branch: `codex/wie-tool-l5-6-final-consolidation`  
Basis: remote `main` na PR #47 (`3dfb902f0954670c74352e634cde1208c4706125`)  
Lokale basiscommit: `3530c0fed423747d9a9dd55adcefc25e926df8f7`  
Tree voor beide bronnen: `c69b0d57d3df88847f988a42741843dbc8af7a5e`

## 1. Samenvatting L0–L5.6

De WIE-TOOL-fasen hebben het lifecyclecontract vastgelegd, de onbetrouwbare commandresultaatgrens verbeterd, centrale completion en Escape-annulering ingevoerd, 37 toolregistraties declaratief gemaakt en de gedeelde en gespecialiseerde succesroutes gemigreerd en gericht gecontroleerd. L5.6 bevestigt de canonieke registratie en completiongrens, verwijdert de ongebruikte afgeleide `MI.ToolLifecyclePolicies`-view, vult de ontbrekende expliciete test voor een ontbrekende tool-ID aan en levert het ontwikkelcontract voor toekomstige tools.

PR #47 is aantoonbaar gemerged naar `main`. De lokale `git fetch origin main` faalde met `getaddrinfo() thread failed to start`; de via GitHub API bevestigde remote-main tree (`c69b0d57…`) is exact gelijk aan de lokale L5.5-basis-tree (`c69b0d57…`). De branch is op die identieke inhoud gestart.

## 2. Eindinventaris en canonieke registratie

De 37 bestaande creatiegereedschappen staan eenmaal als knoppen in `editor.html`. `ToolCatalog.build()` en `ToolCatalog.create()` in `tool-catalog.js` valideren en normaliseren deze declaraties. De verdeling is:

| Interactiefamilie | Aantal | Gereedschappen |
|---|---:|---|
| `point` | 1 | `point` |
| `draw` | 6 | `line`, `straight`, `ray`, `vector`, `circle`, `dimension` |
| `polygon` | 4 | `triangle`, `polygon`, `angle`, `rightAngle` |
| `construction` | 22 | `construct:intersection` plus de 21 generieke constructies hieronder |
| `placement` | 3 | `construct:pointOnObject`, `construct:ellipseByFociAndPoint`, `construct:parallelogramBySideAngle` |
| `text` | 1 | `text` |

De 21 generieke `construction`-tools zijn `midpoint`, `perpendicular`, `perpendicularBisector`, `bisector`, `lineBetweenPoints`, `parallel`, `tangent`, `circleByCenterPoint`, `triangleFromPoints`, `centroid`, `circumcenter`, `orthocenter`, `incenter`, `incircle`, `eulerLine`, `ninePointCircle`, `anglePoints`, `angleDirections`, `polygonRegion`, `circleSectorRegion` en `circleSegmentRegion`, alle onder prefix `construct:`.

Lifecycletelling: **12 `repeat`** (punt, 6 draw, 4 polygon, tekst) en **25 `single`** (22 construction en 3 placement). Navigatiemodi blijven buiten deze creatiecatalogus. De zes adapterwaarden typeren de bestaande route; er is geen algemene adapterdispatcher.

## 3. Completionroutes voor alle 37 tools

De routecontrole vond geen succesvolle creatieroute van de 37 tools die de centrale canvascompletion overslaat. De dekking is per gedeelde handler bewezen, niet door 37 losse handmatige browseracties:

| Groep | Voltooiingsroute | Resultaat en lifecycle |
|---|---|---|
| `point` | `pointerDown()` → `object.create` → `changeDocument()` → `completeToolInteraction()` | Punt geselecteerd; `repeat` houdt Punt actief. |
| 6 `draw` | gedeelde drawgesture/commit → `linear.draw` voor `line`/`ray`, anders `object.create` → centrale completion | Preview/capture opgeruimd, object geselecteerd; `repeat`. |
| 4 `polygon` | gedeelde polygoninput; `triangle`/`angle`/`rightAngle` voltooien op laatste geldige punt, `polygon` op Enter → `object.create` → centrale completion | Geldige vorm geselecteerd; `repeat`. Tussenstappen creëren geen documentobject/history. |
| 21 generieke constructies | `constructionClick()` → bron-/invoerstappen → `construction.create` → centrale completion | Volledige resultaatselectie, tijdelijke status verwijderd; `single` keert terug naar `select`. |
| `construct:intersection` | `IntersectionDispatcher` evalueert bronnen; één `construction.create` kan meerdere punten maken → één completion | Alle snijpunten geselecteerd; `single`. Geen/unieke geldige uitkomst of weigering completeert niet. |
| 3 `placement` | gespecialiseerde bron-/parameter-/previewhandler → `construction.create` → centrale completion | Punt/ellips/vorm geselecteerd; `single`. Ellips met nieuw Q is atomair; parallellogram-hernoeming is optioneel en volgt na geometriesucces. |
| `text` | `submitText()` → gevalideerde `text.commit` → centrale completion alleen voor `target.kind:'new'` | Nieuwe tekst geselecteerd; `repeat`. Bestaande tekstbewerking is geen creatiecompletion. |

`context-complete` deelt de centrale completionfunctie maar behoudt tool en onafhankelijke interactie; `prefill` volgt de gewone canvasroute en voltooit pas na de latere create. Object bewerken, hernoemen, verwijderen, stijlaanpassing, preview, bronselectie en tussenstappen zijn niet automatisch creaties.

## 4. Architectuur en exitgedrag

- **Activatie:** `setTool()` controleert tooltoegang, sluit relevante dialogs, annuleert/ruimt de vorige interactie op, zet navigatiemodus naar `select` en activeert de tool. Catalogusmetadata komt uit de knop in `editor.html`.
- **Completion:** `completeToolInteraction()` staat alleen `canvas` en `context-complete` toe, vereist `outcome.ok`, controleert de tool/policy in `ToolCatalog`, synchroniseert selectie en handelt canvascleanup/policy af. `single` roept `setTool('select')` aan; `repeat` houdt de tool actief. `context-complete` behoudt tool en interactie.
- **Command/history:** bestaande handlers roepen geautoriseerde commands aan. `changeDocument()` produceert een expliciete succes-/foutuitkomst; exceptions leiden niet naar completion. Command-/runtime-/historylagen blijven eigenaar van autorisatie, mutatie, atomiciteit en Undo/Redo. Lifecyclebeleid voert zelf geen documentmutatie uit.
- **Annulering:** `cancel()` ruimt interactiestatus, capture, previews/feedback en tijdelijke mutaties op; bestaande eventhandlers behandelen `pointercancel`, `lostpointercapture` en window `blur` als annulering. `setTool()` force-cleant bij toolwissel. Dialog-/paneelprioriteiten in `keyDown()` laten eerst de UI-eigenaar Escape verwerken; canvas-Escape gebruikt `cancelActiveInteraction()` en keert terug naar `select`.
- **Meerstaps-/foutgedrag:** ongeldige invoer kan herstelbaar actief blijven; incomplete invoer is geen succes. Commandfout/permission denial completeert niet en bewaart waar veilig invoer voor retry. Escape bij onvoltooide constructie maakt geen gedeeltelijk object/history.
- **Exact eenmaal:** synchrone createhandlers noemen completion één keer na geaccepteerde commit. Meerdere outputobjecten worden met één completion verwerkt. Tekst heeft expliciete tests voor gelijktijdige submits tijdens async formulevoorbereiding en een late callback na toolwissel. Er is geen algemene idempotency-/generation-tokenarchitectuur; de garantie geldt voor de huidige handlerflows en tests, niet als universeel protocol voor toekomstige async commands.

## 5. Compatibiliteitsview

Bronzoek in productie, tests, browsermodules en scripts vóór wijziging vond `MI.ToolLifecyclePolicies` alleen als `editor.js`-producer en als testfixture/assertie. Er was geen actieve productie-, browser-, editorintegratie- of externe compatibiliteitsconsumer zichtbaar. Completion leest al rechtstreeks `this.toolCatalog.getTool(toolId).lifecycle`.

Daarom is de view in L5.6 verwijderd. De testfixture creëert die niet meer; de 37-tool levenscycletest leest de catalogus direct. Een bronzoek na wijziging levert geen `ToolLifecyclePolicies` of `TOOL_LIFECYCLE`-referenties buiten historische documentatie op. Er is geen tweede beleidsbron ontstaan.

## 6. Validator en gerichte wijziging

`ToolCatalog.create()` controleert: ongeldige/ontbrekende geïmplementeerde ID of command-ID, dubbele tool-ID, ongeldige status, ontbrekende/onbekende lifecycle, ontbrekende/onbekende adapter, navigatiemodus als creatietool, interactieve metadata in geplande placeholders en ongeldige splitgroepen. De centrale completion test onbekende origin en onbekende tool/policy. Eén expliciete test ontbrak voor de al bestaande ontbrekende-ID-validatie; L5.6 voegde die regressieassertie toe.

De gerichte lifecycle-run vond ook een verouderde L2-test die voor `construct:parallel` nog nul centrale completions verwachtte. Deze route is in L3.2 naar de centrale `single`-route gemigreerd; de assertion is bijgewerkt om de huidige completion te toetsen. Productcode voor dit gedrag is niet gewijzigd.

## 7. Nieuwe-toolcontract en ontwikkelproces

[WIE-TOOL-NEW-TOOL-CONTRACT-v1.0.0](WIE-TOOL-NEW-TOOL-CONTRACT-v1.0.0.md) beschrijft de huidige catalogus, bestaande adapters en handlers, command-/historygrens, completion-origin, fouten, annulering en tests. Het bevat een verplicht en conditioneel afvinkbaar stappenplan. Er wordt geen toekomstige dispatcher/API als bestaand voorgesteld.

## 8. Verificatie

Werkelijk uitgevoerd op deze branch:

```text
node --test tests/tool-catalog.test.cjs
6/6 PASS (inclusief 37 IDs, policies/families, gespecialiseerde metadata, en ontbrekende ID)

node --test --test-name-pattern="WIE-TOOL-L[1-5]" tests/lifecycle.test.cjs
65/65 geselecteerde tests PASS (volledige lifecycle-, route-, fout-, Escape-, toolwissel- en tekst-racegevallen)

node --test tests/ellipse-control-point.test.cjs tests/ellipse-permissions.test.cjs tests/construction-contract.test.cjs tests/automatic-text-layer.test.cjs tests/text-editor-t1.test.cjs
42/42 PASS

node --check editor.js
node --check tests/lifecycle.test.cjs
node --check tests/tool-catalog.test.cjs
git diff --check
PASS
```

De eerste lifecyclecontrole vóór de correctie faalde op de verouderde L2-testverwachting (verwachtte nul completion, kreeg één); de bijgewerkte gerichte run is daarna 65/65 geslaagd. Geen volledige Node-suite, Edge-run of browsermodule uitgevoerd.

## 9. Resterende risico's en browserverificatie

De L4 browsermodule is eerder niet uitgevoerd doordat Playwright ontbrak. L5.6 start geen browserinstallatie of brede browserregressie. Node-fixtures bewijzen niet de native dialogvolgorde, werkelijke browserfocus, fysieke pointercapture, fullscreen-Escape of werkelijke tekstsubeditor-/browser-eventvolgorde.

Open toekomstig werk is één begrensde browserverificatie van `tests/browser-tool-escape.cjs` via de bestaande `node scripts/run-browser-module.cjs browser-tool-escape.cjs`-runner zodra de voorgeschreven Playwright- en Edge-omgeving beschikbaar is. Acceptatiecriteria: eerste Escape sluit alleen het formule-invoegpaneel en behoudt editor/tekst; tweede Escape sluit de teksteditor zonder commit; Escape annuleert de canvasgesture zonder history; native kleurendialoog sluit zonder actieve canvas-tool te annuleren. Voer dit uit als afzonderlijke browseracceptatie; claim geen Node-gedreven browser-PASS.

## 10. Beoordeling

| Onderdeel | Beoordeling | Basis/beperking |
|---|---|---|
| Registratiearchitectuur | **GO** | Eén markupgedreven `ToolCatalog`, 37 unieke tools; 12 repeat / 25 single; zes gevalideerde adapterfamilies. |
| Lifecyclecompletion | **GO** | Alle bekende create-routes bereiken centrale completion na succes; gerichte handler-/routeasserties slagen. |
| Annulering | **GO voor Node-/handlercontract** | Fout, Escape, toolwissel en pointeronderbrekingen zijn afgebakend; echte browserevents blijven open. |
| Compatibiliteit | **GO** | Ongebruikte view verwijderd; geen consumer gevonden; tests gebruiken canonieke catalogus. |
| Testbaarheid | **GO voor gerichte contracten** | Registry-, lifecycle-, command-, history-, text-race- en gespecialiseerde tests slagen. |
| Uitbreidbaarheid | **GO** | Nieuwe-toolcontract legt huidige extensiepunten en checklist vast; geen dispatcher toegevoegd. |
| Browseracceptatie | **CONDITIONAL GO** | L4-gerichte browsermodule en echte focus/native-dialog/pointercapture-events zijn nog niet bewezen. |

**Formele eindbeoordeling: CONDITIONAL GO.** De architectuur- en Node-contracten voldoen voor consolidatie. WIE-TOOL is gereed voor architecturale afsluiting op die scope; volledige browseracceptatie blijft een afzonderlijke open poort. Er is geen structureel codeprobleem gevonden dat een nieuwe lifecyclefase vereist.
