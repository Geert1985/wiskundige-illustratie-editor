# M8a-1b — Ellips met permanent besturingspunt Q

**Documentversie:** 1.0.0  
**Uitgangsbasis:** `origin/main` `9da6e2a50d8aa08a1e11ee95e3b8a46e8f650da7`  
**Featurebranch:** `codex/m8a-1b-ellipse-control-point`  
**Contract:** [M8a-ELLIPSEN-CONTRACT.md](M8a-ELLIPSEN-CONTRACT.md) v1.1.0  
**Status:** implementatie loopt; er is nog geen codewijziging verricht bij het vastleggen van deze architectuurcontrole.

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

Wordt aangevuld nadat de codecontrole de definitieve transactievorm en UI-keuzes heeft vastgesteld.

## Gewijzigde bestanden en commits

Wordt aangevuld tijdens implementatie.

## Verificatie

Exacte commando's en werkelijke resultaten worden na uitvoering ingevuld. De gerapporteerde historische basis is 659 geslaagde Node-tests plus een geslaagde volledige Edge-suite; dit zijn bronclaims uit M8a-2, geen M8a-1b-testresultaten.

## Handmatige acceptatiechecklist

- [ ] Bestaand Q selecteren en vrije Q plaatsen.
- [ ] Live preview, annulering en zichtbare keuze tussen bestaand/nieuw punt.
- [ ] Q verslepen; F₁/F₂ verplaatsen; geometrie en S volgen.
- [ ] Punt P op ellips plaatsen/verslepen; parameter blijft bij bronwijziging behouden.
- [ ] Legacy v9/schema-6 ellips openen en S invoeren.
- [ ] Undo/Redo, save/reload, SVG/PNG, lock en restricted bronrechten.
- [ ] Performance: preview p50/p95/max, frameupdates en volledige redraws.

## Technisch oordeel

Nog niet beoordeeld. Technisch GO/NO-GO wordt ingevuld na gerichte en volledige regressieverificatie. Handmatige gebruikersacceptatie en merge naar `main` blijven afzonderlijke gates.
