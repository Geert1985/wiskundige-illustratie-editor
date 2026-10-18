# WIE-TOOL-L3.5 — Teksttool en integratiecontrole

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l3-5-text-integration`.
Basis: actuele `origin/main` `321d3f8`, met L3.4 via PR #40.

## Bestaande tekst-callflow

De zichtbare tool-ID is `text`; de policy in `TOOL_LIFECYCLE` is al `repeat`. De catalogus vertaalt die UI-ID voor documentautorisatie naar `create:text`. De centrale lifecycle gebruikt de UI-ID `text`.

**Nieuwe tekst plaatsen:** `pointerDown()` voert `snap()` uit, bewaart het resultaat in `pendingText`, maakt het veld `textValue` leeg en opent `openRichText()`. Tekst krijgt geen canvas-`interaction` of pointercapture; de teksteditor en `pendingText` zijn de tijdelijke invoer. In een runtime-sessie opent `openRichText()` een transaction handle voor `text.commit`; bij auteurgebruik wordt het bestaande `AuthorCommands`-pad gebruikt. `submitText()` haalt de inhoud uit de rijke editor, controleert bestaande open invoer, lege tekst, formuleweergave, documentrevisie en commandorechten, en richt `text.commit` op `target.kind:'new'` met de vastgelegde canvaspositie.

Voor deze wijziging sloot `submitText()` de editor en vernietigde pending invoer vóórdat het command werd uitgevoerd. Een commandofout ná de preflight liet de status zien, maar het bewerkbare invoerscherm was al gesloten. De succesvolle route stelde `selectedId` in, maar riep `completeToolInteraction()` niet aan.

**Bestaande tekst bewerken:** inspectorbediening roept `openRichText(id)` aan. `submitText()` herkent dit via `textEditId` en richt hetzelfde `text.commit` op `target.kind:'existing'`. Dit wijzigt het bestaande object; het maakt geen nieuw tekstobject en hoort niet bij de `text`-creatielifecycle.

**Annuleren en leeg:** `closeText()` annuleert een nog openstaande runtime handle, vernietigt de editor en wist `pendingText`/`textEditId`. `Esc` in de teksteditor sluit eerst die editor. Een lege `TextContent.plain()` keert terug vóór het commando; de editor blijft open, dus er is geen commit, completion of nieuwe history-entry.

## Nieuwe completion en scheiding van edit

Na de aanpassing voert `submitText()` het command binnen `changeDocument(...,{cancelInteraction:false})` uit terwijl de invoer nog bestaat. Bij een exception blijft de editor open. In runtime-modus is een door `RuntimeSession.commit()` verbruikte handle opnieuw begonnen met dezelfde actuele payload en revisie wanneer dat lukt; als herstart niet wordt toegestaan, blijft de tekst zichtbaar en rapporteert de bestaande stale-/permissioncontrole dat de editor opnieuw geopend moet worden.

Na geslaagde creatie stelt de commandcallback de resultaatselectie in vóór de history-snapshot. Daarna roept de adapter eenmaal `completeToolInteraction({toolId:'text',outcome,origin:'canvas',selection})` aan en sluit de teksteditor opgeruimd. `repeat` ruimt de completionstoestand op, maar laat `text` actief; een volgende canvasklik start meteen een nieuwe tekstinvoer. Completion volgt op `outcome.ok`, dus op de geaccepteerde `text.commit`; een eventueel afgeschermd runtime-resultaat zonder leesbaar ID leidt niet tot een verzonnen selectie.

Bij `target.kind:'existing'` stelt de submitcallback geen nieuwe selectie in en roept geen creatie-completion aan. `changeDocument()` maakt één geschiedenisgrens voor de wijziging. De tool, primaire selectie en volledige selectie blijven staan; bij de tests bleef ook een vooraf bestaande onafhankelijke interactie, pointercapture, preview en feedback intact. `closeText()` ruimt alleen de tijdelijke teksteditor op.

## Fout-, invoer-, selectie- en historygedrag

- **Succesvolle nieuwe tekst:** geselecteerd resultaat indien het command een leesbaar ID retourneert; `text` blijft actief; editor/pending invoer wordt opgeruimd; één history-entry.
- **Twee nieuwe teksten:** twee afzonderlijke commands en history-entries; beide tekstobjecten behouden hun inhoud. Undo/redo loopt afzonderlijk door beide resultaten en herstelt de bijbehorende selectie.
- **Lege tekst:** bestaande no-op blijft behouden; geen command, completion of lege history-entry; editor blijft open.
- **Annuleren vóór commit:** `closeText()` annuleert de runtime handle en verwijdert tijdelijke invoer; geen object, completion of history-entry; tool blijft `text`.
- **Commandweigering:** geen completion of document-/historymutatie; tekst, positie en editor blijven beschikbaar. De test herstelt de commandadapter en bevestigt retry met exact één creatie/completion.
- **Bestaande tekst bewerken:** blijft `target.kind:'existing'`, behoudt tool en selectie, creëert geen object en krijgt geen creatie-completion. Undo/redo herstelt de oude en nieuwe inhoud.
- **Geschiedenis:** de nieuwe resultaatselectie wordt in de callback vóór `history.record()` bijgewerkt. Daarmee herstelt redo ook de nieuwe tekstselectie. Centrale completion schrijft zelf geen documentmutatie of tweede history-entry.

De tests gebruiken de bestaande gesimuleerde DOM-fixture. De retrytest injecteert een synchrone commandexception na geslaagde preflight met de lokale `AuthorCommands`-adapter. De runtime-herstart van een verbruikte handle is in deze fase bronmatig gecontroleerd; de bestaande `RuntimeSession`-tests controleren autorisatie, atomiciteit en history van `text.commit`, maar deze lifecycletest simuleert geen volledige PermissionRuntime-editorworkflow.

## Integratie-audit: lifecyclematrix van alle geregistreerde tools

`editor.html` bevat 37 geïmplementeerde tools naast `select`; de cataloguscontrole in `editor.js` vergelijkt deze IDs met alle entries van `TOOL_LIFECYCLE`. De bestaande registertest controleert de volledige 37-ID-dekking. De tabel noemt iedere geregistreerde tool; tools binnen een gedeelde rij gebruiken dezelfde productie-successbranch.

| Gereedschap-ID's | Policy | Succesroute en lifecycle | Fout/cleanupbeoordeling |
|---|---|---|---|
| `point` | `repeat` | `pointerDown()` → `object.create` → centrale completion; punt blijft actief | Commandfout wordt door `changeDocument()` teruggegeven; centrale functie weigert `outcome.ok:false`. |
| `line`, `straight`, `ray`, `vector`, `circle`, `dimension` | `repeat` | Gedeelde draw-interactie → `commit()` → bestaande `linear.draw` of `object.create` → centrale completion; tool blijft actief | Ongeldige/korte preview commit niet; exception wordt geen succes. `commit()` ruimt de gesture zelf vóór de documentmutatie op. |
| `triangle`, `polygon`, `angle`, `rightAngle` | `repeat` | `polygonClick()`/Enter → `finishPolygon()` valideert → `object.create` → centrale completion; tool blijft actief | Tussenpunten voltooien niet; validatie- of commandfout maakt geen false completion. Polygonvertices zijn op commandfout herstelbaar. |
| `text` | `repeat` | `pointerDown()` → `pendingText`/`openRichText()` → `submitText()` → `text.commit` → centrale completion → editor cleanup; tool blijft actief | Leeg/annuleren/edit/fout scheiden van nieuwe creatie; fout laat invoer open voor retry. Specifiek getest in L3.5. |
| `construct:midpoint`, `construct:perpendicular`, `construct:perpendicularBisector`, `construct:bisector`, `construct:lineBetweenPoints`, `construct:parallel`, `construct:tangent`, `construct:circleByCenterPoint`, `construct:triangleFromPoints`, `construct:centroid`, `construct:circumcenter`, `construct:orthocenter`, `construct:incenter`, `construct:incircle`, `construct:eulerLine`, `construct:ninePointCircle`, `construct:anglePoints`, `construct:angleDirections`, `construct:polygonRegion`, `construct:circleSectorRegion`, `construct:circleSegmentRegion` | `single` | Gedeelde `constructionClick()` → één `construction.create` → centrale completion → Selecteren | Bron-, arm-, extent- en geometriecontroles blijven vóór commit. Fout behoudt bruikbare bronnen; representatieve routes zijn getest, niet ieder contract individueel uitgevoerd. |
| `construct:pointOnObject` | `single` | `radialPathPlacement()` projecteert op vastgelegde bron → `construction.create` → centrale completion → Selecteren | Eerste klik is alleen bron/preview; tolerantie en commandfout voltooien niet; retry bewaart bron. |
| `construct:ellipseByFociAndPoint` | `single` | Ellips-Q-plaatsing → atomair `construction.create` → centrale completion → Selecteren | Ongeldige Q/fout voltooit niet; candidate-Q en ellips zijn één commandtransactie. |
| `construct:parallelogramBySideAngle` | `single` | Parameter/preview → `commitParallelogramPlacement()` → `construction.create` → centrale completion → Selecteren | Ongeldige invoer en commandweigering behouden parameters; optionele bronhernoemfout volgt expliciet bestaand gedeeltelijk-succescontract. |
| `construct:intersection` | `single` | `intersectionClick()`/`acceptIntersectionSource()` → dispatcher → `construction.create` → centrale completion → Selecteren | Ambiguïteit, ongeldig paar, nul kandidaten, fout en lege resultaten voltooien niet; meerdere resultaten blijven geselecteerd. |

Dit omvat 12 `repeat`-tools en 25 `single`-constructies. Voor de 21 gedeelde generieke constructies is de lifecycle-identiteit bronmatig vastgesteld via dezelfde gedeelde commitbranch; de representatieve regressietest dekt generieke constructie, naast de afzonderlijke fase-tests voor de overige adapterfamilies.

## Context, origin en afwijkingen

`completeToolInteraction()` ondersteunt in de actuele code de standaard `origin:'canvas'` en de expliciete `origin:'context-complete'`. Canvas voert de gewone cleanup uit: interactie nullen, capture vrijgeven, preview/feedback wissen, selectie toepassen en policy volgen. `single` schakelt via `setTool('select')`; `repeat` laat de tool actief. `context-complete` vereist nog steeds een bekende toolpolicy, maar schrijft selectie/status/render bij zonder toolwissel of opruiming van een onafhankelijke interactie. `origin` wordt nog niet gevalideerd; een onbekende waarde loopt door het canvascleanup-pad maar krijgt geen generieke canvas-successtatus. Er zijn momenteel geen callsites met zo'n onbekende waarde; dit is een kleine API-hardeningkans, geen waargenomen lifecycle-afwijking.

Direct context-`complete` gebruikt de geregistreerde policy-tool-ID met `origin:'context-complete'` en behoudt de voorafgaande tool. Context-`prefill` activeert het constructiegereedschap en wacht op de normale canvascompletion. Beide zijn in L3.4 gericht getest.

De bronzoeking vond geen succesvolle geregistreerde creatieroute meer die na L3.5 de centrale completion omzeilt. Rechtstreekse `this.tool='select'`-toewijzingen staan in Escape/Ctrl+A, startup/document-reset en onbeschikbare-tool-fallback; die zijn annulering, selectie, reset of veiligheidsfallback, geen succesvolle objectcreatie. `setTool('select')` in `completeToolInteraction()` is de bedoelde `single`-transitie. Overige directe `text.commit`-aanroepen zijn bestaande-objectbewerkingen/migratie; dupliceren, `text.restoreStatic`, inspector- en geometrieacties zijn objectacties en geen creatie door een geregistreerde tool.

De controller valideert de `outcome` en tool-ID, bewaart meervoudige selectie, geeft pointercapture vrij en ruimt preview/feedback op voor canvascompletion. Zij registreert zelf geen history en voegt geen tweede documentcommando toe. De contextvariant laat de bestaande actieve interactie intact. De centrale completion is niet idempotent: actuele adapters roepen haar eenmaal aan na hun commandgrens, maar de functie heeft geen duplicate-completion-token. Een tweede aanroep na dezelfde `outcome` zou daarom opnieuw cleanup/status uitvoeren; er is geen dubbele callsite gevonden. Algemene Esc-prioriteit blijft buiten L3.5.

## Validatie en beoordeling

Uitgevoerd:

```powershell
node --test --test-name-pattern="text form commits|empty text is not committed|WIE-TOOL-L3.5 text" tests/lifecycle.test.cjs
node --test --test-name-pattern="WIE-TOOL-L3.5 editing existing text" tests/lifecycle.test.cjs
node --test --test-name-pattern="WIE-TOOL-L3.5|text form commits|empty text is not committed|WIE-TOOL-L3.1 free point|WIE-TOOL-L3.2 generic linked constructions|WIE-TOOL-L3.3a point-on-object routes complete centrally|WIE-TOOL-L3.3b ellipse completes centrally|WIE-TOOL-L3.3c parallelogram preview|WIE-TOOL-L3.4 intersection single|WIE-TOOL-L3.4 context-complete uses|WIE-TOOL-L3.4 context prefill|WIE-TOOL-L2 registers every visible catalog tool explicitly|WIE-TOOL-L2 completion requires success and rejects unknown policies" tests/lifecycle.test.cjs
node --check editor.js
node --check tests/lifecycle.test.cjs
git diff --check
```

De tekstchecks slaagden met **4/4** plus de aparte editcheck **1/1**. De integratiecheck slaagde met **15/15**: de vijf tekst-/editproeven, de volledige catalogus-/controllercontroles en representatieve routes voor iedere gevraagde toolfamilie en contextmodus. Beide syntaxchecks en `git diff --check` zijn geslaagd. Er is geen volledige Node-suite, Edge-run of brede browserregressiesuite uitgevoerd, conform opdracht.

**Beoordeling: GO voor de technische L3.5-scope.** De tekstcreatie gebruikt centrale `repeat`-completion; twee achtereenvolgende teksten, selectie, undo/redo, lege invoer, annulering, fout/retry en bestaande tekstbewerking zijn gericht getest. Alle 37 geregistreerde tool-ID's zijn op beleid en succesroute geïnventariseerd. Er is geen waargenomen creatieroute die na L3.5 het lifecyclecontract omzeilt.

Resterende risico's: de nieuwe editor-retrytest gebruikt de lokale commandadapter; runtime-handleherstart is bronmatig beoordeeld naast bestaande command-/runtime-tests, niet end-to-end via de editor. Er is geen echte browser/focus/pointercapture-run gedaan. `origin` accepteert nog onbekende waarden zonder validatiefout en `completeToolInteraction()` heeft geen expliciete duplicate-callbescherming; actuele callsites bieden daarvoor geen aanwijzing voor een fout, maar beide zijn documenteerbare hardeningpunten. Geen algemene Esc-herziening of ander L4-werk is gestart.

L3.5 is technisch afgerond op deze branch; handmatige acceptatie, PR-review en main-merge blijven afzonderlijke statussen. Geen wijzigingen aan constructiegeometrie, schema, formule-editor of command/historyarchitectuur.
