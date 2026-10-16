# M8-INT.0 — Preflight

Datum: 2026-10-17 · Branch: `codex/m8-int-0-universal-intersection`

## Repository en contractpoort

- Repository: `Geert1985/wiskundige-illustratie-editor`; werkboom was schoon op `main`.
- Beginbranch: actuele `main`; begin-HEAD: `bf5d4b6744b58abe9662a1845da08f56263ec377` (`origin/main`, na fetch op 2026-10-17). De featurebranch is bijgewerkt vanaf deze commit.
- `editor.html` laadt geometrie/model vóór `construction-service.js`, daarna renderer, engine en interaction helpers, vervolgens permissions en editor/bootstrap. `tool-catalog.js` laadt vóór editor/search/bootstrap.
- `docs/M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md` v1.0.0 staat op actuele `origin/main`; status in het contract is goedgekeurd ontwerp zonder eerdere implementatie-GO. De gebruiker heeft nu expliciet M8-INT.0-implementatie, tests, documentatie en push op de featurebranch opgedragen. Dit is de afzonderlijke implementatie-autorisatie; de contractstatus hoeft niet aangepast te worden.
- Contract-/opdrachtmatch: M8-INT.0 beperkt tot de drie bestaande recepten, bewaart branchidentiteit en assenrollen, voegt preview met optionele selectie en één atomaire commit toe, houdt de drie gespecialiseerde knoppen zichtbaar, en doet geen schemasprong. Geen fundamenteel conflict gevonden. De opdracht vraagt bovendien export-, hit/snap-, toetsenbord-, annulering- en browserregressies als acceptatiebewijs.

## Bestaande bronrollen en domeinen

| Recept | Getypeerde rollen | Axis-referentie toegestaan | Bestaande oplossingstak |
|---|---|---|---|
| `lineIntersection` | `line`, `line` | beide rollen | één oplossing |
| `lineCircleIntersection` | `line`, `circle` | lijnrol | 0/1 |
| `circleCircleIntersection` | `circle`, `circle` | geen | 0/1; bronvolgorde bepaalt links/rechts |

`ConstructionService.referenceOptions`/`referencesForRole` biedt volledige lineaire objecten en een polygonrand als `{objectId, part:'edge', index}`. `LinearGeometry.accepts` bewaart de domeinen: `straight` oneindig, `ray` halfoneindig, en `line`, `vector`, `dimension` en polygonranden eindig. Asbronnen zijn getypeerde cartesische referenties en worden per recept/rol beperkt; lijn–lijn laat beide rollen toe, lijn–cirkel alleen de lijnrol. Een volledige polygon is geen lineaire rolbron.

De bestaande regels zijn leidend: lineair snijpunt heeft een degeneratiegrens `1e-9`, determinantgrens `1e-12` en domeintolerantie `1e-9`; lijn–cirkel bewaart branch 0/1 volgens geordende lijnparameter en filtert kandidaten tegen het domein; cirkel–cirkel bewaart branch 0/1 t.o.v. de gerichte centrumlijn en omwisselen van bronnen keert de geometrie om. Een raakpunt levert branch 0. Bestaande constructie-resolutie bewaart branch-ID's bij tijdelijke ongeldigheid.

## Transacties, UI en beveiliging

- `Engine.construct` berekent lijn–cirkel-/cirkel–cirkelkandidaten, filtert alleen geometrisch geldige branches, en voegt ze aan een tijdelijke `IllustrationModel` toe voordat die wordt gecommit. De bestaande `construction.create`-command/geschiedenis verzorgt de editortransactie; gedeeltelijke bron-/modelmutatie is niet toegestaan.
- De huidige interactie gebruikt `constructionClick`, `constructionPick` en `ConstructionService`-bronrollen; instructies komen uit `editor-tool-instructions.js`. De drie bestaande gespecialiseerde tools staan in de sidebar-markup. `ToolCatalog` bouwt de gedeelde sidebar/fullscreencatalogus uit `editor.html`; zoeken en fullscreen lezen dezelfde catalogus. Het contextuele radiaalmenu gebruikt getypeerde `contextualPlans`, maar bronpaarselectie is een aparte tweebronneninteractie.
- Bestaande capability-, `toolAllowed`-, lock- en restricted-sourcevalidatie wordt zowel in UI-aanbod/selectie als opnieuw in `construction.create` toegepast. Axes hebben aanvullende expliciete bronrechten. De nieuwe workflow moet deze bestaande validatie behouden bij preview én commit.
- Renderer/export en snap/hit-test gebruiken het persistente model. Tijdelijke markers horen dus in de bestaande preview-overlay, buiten model en indexen.

## Testbaseline en vervolg

- Actuele-main-baseline op `bf5d4b6744b58abe9662a1845da08f56263ec377`, vóór productiecodewijziging: `npm test` **706/706 PASS**, 0 failures/skips; `npm run test:edge` **PASS**, alle gerapporteerde browsermodules geslaagd, `pageErrors: []`.
- Bestaande gerichte dekking omvat `tests/line-intersection.test.cjs`, `tests/line-circle-intersection.test.cjs`, `tests/circle-circle.test.cjs`, constructie-/permissietests en browserinteracties.

## Implementatieplan na contractbevestiging

1. Leg contractinterpretatie en source/branch-matrix vast; test eerst een pure dispatcher die normaliseert zonder cirkelvolgorde te veranderen.
2. Voeg kandidatenpreview en tijdelijke individuele selectie toe aan de bestaande interactieflow, zonder modelwijziging.
3. Commit geselecteerde kandidaten via één geautoriseerd history-command en hergebruik de drie bestaande recepten.
4. Werk toolcatalogus, instructies, toegankelijkheid, manifest/cache-token en documentatie bij; behoud gespecialiseerde tools en schemas.
5. Voeg onafhankelijke numerieke en browseracceptatietests toe, voer volledige Node- en Edge-regressie uit, rapporteer resterende handmatige acceptatie.
