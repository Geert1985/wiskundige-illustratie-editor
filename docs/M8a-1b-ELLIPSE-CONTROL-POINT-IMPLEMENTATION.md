# M8a-1b — Ellips met permanent besturingspunt Q

**Documentversie:** 1.0.0  
**Uitgangsbasis:** `origin/main` `9da6e2a50d8aa08a1e11ee95e3b8a46e8f650da7`  
**Featurebranch:** `codex/m8a-1b-ellipse-control-point`  
**Contract:** [M8a-ELLIPSEN-CONTRACT.md](M8a-ELLIPSEN-CONTRACT.md) v1.1.0  
**Status:** productiecode en gerichte tests zijn geïmplementeerd op de featurebranch. De volledige Edge-regressie en handmatige browseracceptatie zijn door de gebruiker overgenomen en staan nog open. Er is geen merge naar `main` uitgevoerd.

## Architectuurcontrole en testimpactmatrix

De repository bevat M8a-1 en M8a-2 op de gecontroleerde `main`. Het bestaande `ellipseByFociAndSum`-recept heeft twee puntbronnen en een verplichte opgeslagen `sumDistance`. `EllipseGeometry.resolve()` valideert en rekent daaruit de ellips; `fromDefinition()` voedt inspector, renderer en export. `pointOnEllipse` is een bestaand padpunt met canonieke parameter en gebruikt dezelfde ellipsdefinitie en `nearest()`-projectie.

`ConstructionService` bezit receptrollen, bronvalidatie, dependency resolution/cascade, contextual plans en recoverable invalidity. `EditorApp` bezit drie-staps bronselectie, canvaspreview, annulering, `construction.create` en `changeDocument()`-historygrens. `PermissionRuntime` valideert de tool en iedere bron bij geautoriseerde `construction.create`; gewone punten worden via `create:point` gemaakt. `DocumentModel` valideert en exporteert recept-/schemarelaties, terwijl `SemanticSequence` registreert toegestane bewerkingen voor deterministische replay. Renderer en `ellipseInspector()` lezen `EllipseGeometry` en de bestaande meetschaal.

### Testimpactmatrix (vóór productiecode)

| Onderdeel | Bestaande eigenaar | Gerichte uitbreiding | Bestaande regressies |
|---|---|---|---|
| Resolver en bronafleiding | `EllipseGeometry.resolve/fromDefinition`; `ConstructionService.evaluate/resolve` | Geometrische invariant S, rotaties/cirkel, dynamische Q/F₁/F₂, invaliditeit/herstel en niet-eindige invoer | `ellipse-geometry`, `ellipse-model`, `construction-contract` |
| Receptrollen en acycliciteit | `ConstructionService.contract/validateReferences`, dependency graph | Exact drie puntbronnen; directe/indirecte eigen-afhankelijkheid; import/source-update-cycle rejects | `construction-contract`, `documents`, `linked-paths` |
| Schema en persistence | `DocumentModel.toJSON/fromJSON`; restricted export projector | schema 6 blijft legacy, schema 7 bevat nieuw recept plus oude recepten; mixed JSON roundtrip; onbekend schema/recept atomair afwijzen | `documents`, `ellipse-model`, `ellipse-permissions` |
| Vrije Q + ellips atomiciteit | `PermissionRuntime` command runtime, engine transaction, `changeDocument` history, `SemanticSequence` | Punt- en ellipscreatie één actie; weigering/rollback, permissions voor `create:point` én constructie, één undo/redo en replay | `history`, `permissions`, `ellipse-permissions`, nieuwe Q-specifieke modeltests |
| Bestaande Q-interactie | `EditorApp.constructionClick`, source hit testing/snapping | Herken geldig punt in derde rol; geen onbedoelde bron/duplicaat; Q preview en bestaande drie stappen | nieuwe `browser-ellipse-control-point.cjs`, `browser-ellipse-interaction.cjs` |
| Preview en cancel | Bestaand animation-frame/SVG-previewpad en cancel lifecycle | Bestaand Q versus cursor Q, geen document/history-mutatie, Escape/toolwechsel/pointercancel, meting van previewcalls en redraws | browserpreviewtests en nieuwe Edge-casechecklist |
| Eigenschappen en slepen | `ellipseInspector`, object drag/property command, `MeasurementUnits` | Q-bronverwijzing; S read-only voor nieuw recept; legacy S blijft schrijfbaar; Q ordinary point; geen self-contour-snap | `ellipse-model`, `ellipse-permissions`, nieuwe Edge-checks |
| `pointOnEllipse` | Bestaande bronparameter `p`, `nearest`, `construction.setParameter` | P blijft op nieuwe ellips, volgt bronbeweging met behouden p; P-drag wijzigt Q/S niet | `point-on-ellipse`, `ellipse-model`, nieuwe browserintegratie |
| Catalogus, radial, UI, export | `ToolCatalog`, `contextualPlans`, `startContextConstruction`, renderer/exporter | Nieuw ID overal, legacy tool niet als nieuwe methode aangeboden; restricted projectie; SVG/PNG en legacy import | toolpanel/radial-, export-, browser- en volledige regressies |

### Schema-besluit

Document v9 en `ellipseSchema:1` blijven staan. `constructionSchema:7` wordt alleen vereist zodra `ellipseByFociAndPoint` voorkomt. Schema 6 blijft vereist voor bestaande `ellipseByFociAndSum` en `pointOnEllipse`; hun serialized brondata wordt niet gemigreerd. Reader 7 accepteert alle schema-6-recepten plus het nieuwe getypeerde recept. Reader 6 wijst nieuwe schema-7-documenten atomair af. Er wordt geen Q verzonnen voor legacy-ellipsen. Het contract beschrijft dit beleid normatief vóór implementatie.

## Implementatiebeslissingen

* `ellipseByFociAndPoint` gebruikt exact drie puntbronnen. Q wordt bewaard; `sumDistance` wordt bij elke evaluatie uit `|QF₁|+|QF₂|` afgeleid via dezelfde `EllipseGeometry`-kern.
* Een vrije Q en de ellips worden in één `construction.create`-transactie gemaakt. Bestaande puntobjecten kunnen als Q dienen. De editor toont de afgeleide S alleen-lezen voor het nieuwe recept; de bestaande somafstandconstructie behoudt haar invoer.
* Het nieuwe recept vereist `constructionSchema:7`; oudere schema-6-documenten en -recepten behouden hun opgeslagen vorm. Nieuwe imports worden schema-aware gevalideerd.
* Bij een tijdelijk ongeldige Q-ellips of een punt-op-ellips daarvan worden de stale berekende geometrievelden verwijderd; de definitie en bronrollen blijven herstelbaar. Bestaande legacy-invaliditysemantiek blijft ongemoeid.
* Restricted authoring controleert puntcreatie, exacte toolgrant, beide focusrechten en ellipscreatie atomair. De Edge-check bracht daarnaast een ontbrekende `renderPreview`-methode in de rendererfacade aan het licht; die is aangesloten.

## Gewijzigde bestanden en commits

Productiecode: `ellipse-geometry.js`, `construction-service.js`, `model.js`, `index.js`, `permission-runtime.js`, `editor.js`, `renderer.js`, `editor-radial-properties.js`, `editor-tool-instructions.js` en `editor.html`. Nieuwe dekking staat in `tests/ellipse-control-point.test.cjs` en `tests/browser-ellipse-control-point.cjs`; `tests/browser.cjs` integreert de browsercheck en bestaande tests verwachten het bijgewerkte cachetoken.

Documentatie: dit verslag, het normatieve addendum in `M8a-ELLIPSEN-CONTRACT.md` en de actuele status in `DEVELOPMENT-ROADMAP.md`. Commits: `ce20ffc` contract/architectuur; `c54329e` geometrie/model/rechten; `6321c02` tool en interactie. De test-/rapportagecommit volgt na de laatste Node-run.

## Verificatie

* `npm test` — **665/665 geslaagd**.
* Gerichte Edge-acceptatie: PowerShell `$env:ELLIPSE_CONTROL_POINT_ONLY='1'; node tests/browser.cjs` — **geslaagd**. Bestaand Q, vrije Q met atomische undo/redo, linked point, legacy somafstand, save/reload, restricted automatic Q en SVG/PNG zijn gecontroleerd; geen page errors.
* Edge-previewmeting in dezelfde gerichte run: 205 objecten; 12 bursts van 40 pointerbewegingen. Burst p50 **164.4 ms**, p95 **169.3 ms**, maximum **169.3 ms**. Preview-update p50 **0.4 ms**, p95 **0.5 ms**, maximum **0.5 ms**; 12 preview-updates en **0** volledige canvassrenders tijdens de pointerbewegingen.
* De volledige `npm run test:edge`-regressie is na de laatste wijzigingen niet afgerond. De gebruiker voert de browserregressie en praktische UI-acceptatie zelf uit; deze openstaande controle wordt niet als geslaagd gerapporteerd.

## Handmatige acceptatiechecklist

- [x] Automatische gerichte browsercontrole: bestaand Q, vrije Q, legacy S, save/reload, SVG/PNG en restricted automatic Q.
- [x] Previewprestatie gemeten: waarden hierboven; geen volledige redraw tijdens pointerbewegingen.
- [ ] Handmatige UI-controle door gebruiker: driestapsinteractie, previewannulering, Q/F₁/F₂ slepen, P op ellips slepen en lock/restricted gedrag.
- [ ] Volledige Edge-regressie na de laatste wijzigingen.
- [ ] Gebruikersacceptatie en besluit over eventuele latere merge naar `main`.

## Technisch oordeel

**Voorwaardelijke technische GO voor review:** volledige Node-regressie en gerichte Edge-acceptatie zijn groen, inclusief de expliciete previewmeting. **Volledige M8a-1b-acceptatie blijft open** tot de volledige Edge-regressie en handmatige browseracceptatie door de gebruiker zijn afgerond. Geen merge naar `main` is uitgevoerd of onderdeel van deze branchpublicatie.
