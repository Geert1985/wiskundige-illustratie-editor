# WIE STAB-1 — Integratie- en regressietestrapport

**Versie:** 1.0.0
**Datum:** 15 oktober 2026
**Repository:** `Geert1985/wiskundige-illustratie-editor`
**Branch:** `codex/stab-1-integration-regression`
**Auditbasis:** `8603355046da9c762e5a9e2b69fd7c9fc2b04899` (audit HEAD; niet de actuele main)
**Gecontroleerde uitgangscommit:** `ccacb0ddeb54d561fe0eddbc5d2280515fd67f74` (`origin/main`, PR #13)
**Geteste eindcommit:** `27d8ac692e74736c790c1a0a1e9b88e58135a5bd` (implementatie, tests en documentatie; het rapport staat in de daaropvolgende documentatiecommit).

## 1. Samenvatting en scope

STAB-1 controleert de integratie van de bestaande domein-, UI-, permissie-, historie- en exportpaden en actualiseert verouderde tests op de huidige `main`-basis. Er zijn geen nieuwe objecttypen, documentversies, schema’s, dependencies of feature-engine toegevoegd. Productiewijzigingen zijn beperkt tot concrete integratie-/selectie-/responsivefouten en de gedeelde JavaScript-cacheversie.

De bijgevoegde read-only audit is beoordeeld als **contextuele bevindingen**, niet als uitvoerinstructies. De geplakte STAB-1-opdracht bepaalt de uit te voeren scope. De audit onderzocht commit `8603355`; `origin/main` is tijdens deze opdracht verdergegaan tot `ccacb0d` (PR #13). Voorspelde auditfails zijn niet als uitgevoerde fails gerapporteerd.

**Technisch oordeel:** PASS voor de uitgevoerde automatische controles; handmatige gebruikersacceptatie blijft apart open.

## 2. Architectuur- en integratiebevindingen

De gecontroleerde code behoudt de gedeelde architectuur:

- `IllustrationModel` en `ConstructionService` blijven de bron van documentvalidatie, getypeerde constructies en dynamische afhankelijkheden.
- `Engine` en `SvgRenderer` blijven eigenaar van documentmutaties en geometrische presentatie; scherm-/canvasweergave en SVG-export gebruiken dezelfde modelwaarheid.
- `PermissionRuntime` en de geautoriseerde commandopaden blijven de autorisatiegrens; UI-acties roepen bestaande commando’s aan.
- `EditorApp` beheert pointer-/toetsenbordinteractie; bootstrap injecteert services en beëindigt de vorige editorlifecycle.
- RadialProperties consumeert `ConstructionService.contextualPlans` en `ToolCatalog`; de tabbed sidebar routeert laagmutaties via bestaande laagcommando’s.
- `tests/architecture.test.cjs` inventariseert het geladen `editor.html`-manifest, exports, laadvolgorde en evaluatiefouten. De dependencycatalogus is bijgewerkt naar 49 modules.

De 49 klassieke scripts blijven gedeeld afhankelijk van volgorde en `window.FZI.MathIllustration`. Dit is een onderhoudsrisico, geen reden voor een ES-modulemigratie binnen STAB-1. De repository heeft geen afzonderlijke GitHub Actions-workflow; de hieronder vermelde lokale uitvoeringen zijn dus geen CI-resultaten.

## 3. Auditconflicten STAB-1-A01 t/m A05

| ID | Uitkomst op actuele basis | Behandeling |
|---|---|---|
| A01 — architectuurmanifest | Herbeoordeeld tegen 49 script-tags; de bijgewerkte manifesttest slaagt | Alle 49 laden worden gecontroleerd; de drie eerder ontbrekende UI-modules zijn opgenomen als side-effectmodules zonder geforceerde namespace-export. |
| A02 — cacheversies | Bevestigd op `ccacb0d`: asset-specifieke versies botsten met het gedeelde releasebeleid | Alle 49 JavaScript-URL’s delen `stab-1-20261015`. De Edge-check behoudt de oudere gecachte `model.js`-variant en toetst vier tekenhulpmiddelen. |
| A03 — gereedschap-/lagenpaneel | Verouderde `<summary>`-verwachting vervangen | De Node-tests controleren de goedgekeurde tool/layer-tabs, unieke toolcatalogus-ID’s en Basislaag. |
| A04 — linkerzijbalk | Verouderde uitklapbare Gereedschappen-sectie vervangen | De Node-tests toetsen huidige tabsemantiek, zoek-/layoutstructuur, focus en gedrag. |
| A05 — browsernavigatie | Verouderde `Lagen en objecten`-accordion vervangen | Edge gebruikt de tabinterface en controleert tabwissel, lagenboom, selectie en responsiviteit. |

Geen test is overgeslagen of uitgezet om een PASS te forceren. Assertions zijn bijgewerkt waar de goedgekeurde actuele UI/semantiek veranderde; nieuwe labels, source editing, keyboardgedrag en integratie-invarianten blijven expliciet getest.

## 4. Gewijzigde en toegevoegde bestanden

### Productie

- `editor-radial-properties.js`
- `editor.css`
- `editor.html`
- `editor.js`

### Documentatie

- `docs/DEVELOPMENT-ROADMAP.md`
- `docs/FEATURE-BACKLOG.md`
- `docs/JAVASCRIPT-DEPENDENCIES.md`
- `docs/STAB-1-IMPLEMENTATION-AND-TEST-REPORT.md` (dit rapport)

### Tests

- `tests/architecture.test.cjs`
- `tests/browser-area-menu.cjs`
- `tests/browser-asset-compat.cjs`
- `tests/browser-audit-final.cjs`
- `tests/browser-axes-grid.cjs`
- `tests/browser-axis-references.cjs`
- `tests/browser-bisector-clip.cjs`
- `tests/browser-canvas-fullscreen.cjs`
- `tests/browser-construction-contract.cjs`
- `tests/browser-construction-hover.cjs`
- `tests/browser-constructions.cjs`
- `tests/browser-dynamic-angles.cjs`
- `tests/browser-dynamic-text.cjs`
- `tests/browser-full-canvas-axes.cjs`
- `tests/browser-history.cjs`
- `tests/browser-inputs.cjs`
- `tests/browser-inspector-feedback.cjs`
- `tests/browser-layers.cjs`
- `tests/browser-lifecycle.cjs`
- `tests/browser-linked-paths.cjs`
- `tests/browser-linked-tangent.cjs`
- `tests/browser-measurements-groups.cjs`
- `tests/browser-minimal-object-list.cjs`
- `tests/browser-permissions.cjs`
- `tests/browser-persistent-groups.cjs`
- `tests/browser-point-projections.cjs`
- `tests/browser-polygon.cjs`
- `tests/browser-radial-menu.cjs`
- `tests/browser-rectangle-selection.cjs`
- `tests/browser-regions.cjs`
- `tests/browser-rich-layout.cjs`
- `tests/browser-rich-math.cjs`
- `tests/browser-rich-text.cjs`
- `tests/browser-rich-values.cjs`
- `tests/browser-selection.cjs`
- `tests/browser-semantic-sequence.cjs`
- `tests/browser-sidebar-navigation.cjs`
- `tests/browser-snapping.cjs`
- `tests/browser-split-tools.cjs`
- `tests/browser-stacked-tools.cjs`
- `tests/browser-styles.cjs`
- `tests/browser-text-editor-modernization.cjs`
- `tests/browser-tool-menu.cjs`
- `tests/browser-tool-panel-reorganization.cjs`
- `tests/browser-ui-modernization.cjs`
- `tests/browser-ui-refinements.cjs`
- `tests/browser-units-scale.cjs`
- `tests/browser.cjs`
- `tests/helpers.cjs`
- `tests/interactions.test.cjs`
- `tests/left-sidebar-navigation.test.cjs`
- `tests/lifecycle.test.cjs`
- `tests/radial-petals.test.cjs`
- `tests/text-editor-ux.test.cjs`
- `tests/tool-panel-reorganization.test.cjs`
- `tests/browser-region-presentation.cjs`

## 5. Bestaande en nieuwe tests

- Bestaande Node-architectuur-, lifecycle-, constructie-, permissie-, regio-, laag-, tekst- en exporttests zijn behouden en afgestemd op de actuele UI.
- `tests/browser-region-presentation.cjs` is onderdeel van de standaard volledige Edge-runner en blijft ook afzonderlijk oproepbaar via `UI_RADIAL_10_ONLY=1`. De check toetst regiofill/randkleur/opacity, `fill='none'`, precisie 0–3 en legacy-clamping, legacy-labelpositie, constructiepaneelscroll/sticky heading en een echte muisversleping van het regiolabel.
- Voor de regiolabelversleping controleert Edge de zichtbare labelpositie en modeloffsets vóór en na slepen, daarna expliciet na Undo en Redo; vervolgens worden opslag en herladen vergeleken.
- Edge-cases zijn geactualiseerd voor regionale bronrollen, constructie-inputs, tangent-hover, tabbediening, laagdrag, volle-canvas-clipping, UI-RADIAL-11/12 en assetversies.
- Coverage is kwalitatief geïnventariseerd; geen instrumented line-/branch-/mutation-coverage is uitgevoerd en er wordt geen percentage geclaimd.

## 6. Uitgevoerde verificatie

Omgeving: Node `v22.18.0`, npm `10.9.3`, Playwright `1.62.1`, Microsoft Edge `155.0.4283.45`, Windows. Edge gebruikt de bestaande headless Playwright-launcher.

| Commando | Resultaat |
|---|---|
| `npm test` | 624 passed, 0 failed, 0 skipped; laatste correctieronde 15.27 s. |
| `npm run test:edge` | Geslaagd op Microsoft Edge; de standaard volledige runner omvat ook de regio-presentatietest en eindigt met `pageErrors: []`. |
| Gerichte Edge-subsets | Gebieden, canvasselectie, assets, radial menu, lagen, constructies, tekstbindingen, hoek- en puntprojecties, meeteenheden, tabnavigatie en responsive toolgroepen zijn ook afzonderlijk uitgevoerd; de integrale run is het afsluitende bewijs. |
| `git diff --check` | Geslaagd na laatste edits. |

Browser `pageErrors` van de uiteindelijke integrale run: 0.

### Aanvullende correctieronde

De regio-presentatietest was vóór deze correctieronde wel aanwezig en afzonderlijk selecteerbaar, maar ontbrak in het standaardpad van `tests/browser.cjs`. De standaard Edge-runner roept hem nu aan het einde aan en rapporteert `regionPresentation`. De check herstelt na afloop het normale viewport en sluit het paneel.

De eerder gesimuleerde offsetwijziging is vervangen door een muisdrag van het SVG-regiolabel met asserts op de modeloffsets en zichtbare labelpositie vóór/na drag en na Undo/Redo. De opslag-/herlaadassertie blijft daarna actief. Downloadasserties in de bestaande browsercheck lezen de door Playwright beheerde tijdelijke downloadbestanden; de kopieën in `test-results` blijven beschikbaar als artefacten.

Na deze correctie zijn `npm test` opnieuw uitgevoerd (624 geslaagd, geen failures of skips), `npm run test:edge` volledig uitgevoerd met Microsoft Edge (alle checks geslaagd, `pageErrors: []`) en `git diff --check` gecontroleerd. De gerichte uitvoering `UI_RADIAL_10_ONLY=1 npm run test:edge` slaagde eveneens; de standaardrun bevat dezelfde regio-presentatiecheck.

## 7. Kwalitatieve dekking en resterende hiaten

| Risico | Dekking in deze opdracht | Resterend |
|---|---|---|
| Architectuurmanifest/laadvolgorde | Exact manifest-, export-, load-order- en VM-evaluatiechecks | Dynamische runtime-callgraph blijft buiten statische architectuurtest. |
| Model/schema/JSON | Bestaande import/export-, schema-, atomicity- en roundtriptests | Geen gemeten codecoverage. |
| Constructies/regio’s | Gerichte Node/Edge-tests voor directed regions, bronrollen, invalidity/recovery, berekende labels en exports | Nieuwe geometrische objecttypen/functies buiten scope. |
| Rechten | Command- en UI-tests in restricted sessions, hidden/locked sources en directe bypasspogingen | Handmatige assistive-technology- en devicecontrole. |
| Undo/redo/lifecycle | Document-, rich-text-, regio-, drag-, label-, color- en laagmutaties | IME, fysiek touchgedrag en externe vieweracceptatie handmatig. |
| UI-TABS/lagen | Muis/keyboard, drag, groep, lock/restricted, historie, opslag en responsive routes | Handmatige UX-acceptatie blijft apart. |
| UI-COLOR/PANEL/TOOLBAR | Palette/HEX/native input, cancel/apply, zichtbare/ARIA-labels, panelcontent en toolbar/historie in suite | Visueel contrast/focus en diverse viewportconfiguraties door gebruiker te beoordelen. |
| Browserfouten | Eindrun controleert `pageErrors` op nul | Geen CI-workflow en geen geautomatiseerde cross-browsermatrix. |

## 8. Productiedefecten en gerichte correcties

- Regio-objecten dragen berekende `regionGeometry`, `regionArea` en `regionStatus` in het actuele model; de generieke patchvalidator verwijdert die alleen uit de validatiekandidaat voordat hij een stijl-/eigenschapswijziging valideert. Persistente modelwaarheid en commandvalidatie veranderen niet.
- Pointerselectie geeft voor daadwerkelijk geraakt SVG-punt prioriteit aan de visueel bovenste point; lege-canvasfallback gebruikt de bedoelde 8 CSS-pixel-tolerantie.
- Mobiele sidebar krijgt haar verborgen basisstatus terug onder de breakpointregel, terwijl de expliciet geopende toolsdrawer zichtbaar blijft.
- `RadialProperties` initialiseert event-disposers vóór een vroege constructorreturn, zodat gedeeltelijke/fake-DOM-initialisatie veilig kan worden opgeruimd.
- Asserttestverwachtingen voor moderne tabs, radial inspector, palette, assetversies en clipped SVG-endpoints volgen de actuele goedgekeurde werking en behouden de relevante gedragscontrole.

## 9. Open risico’s en blockers

Geen technische blocker gevonden. De automatische suites slagen. Handmatige visuele/toegankelijkheidsacceptatie, fysieke touch-, IME- en screenreadertests en externe SVG/PNG-viewers zijn niet automatisch gevalideerd en blijven aan de gebruiker.

## 10. Handmatige gebruikersacceptatie

- [ ] Radial menu en UI-RADIAL-11/12 bij punten, lijn/constructie, cirkel, tekst en meervoudige selectie; hover, focus, draggreep, label en lockknoppen.
- [ ] Regiofill/randkleur/`none`, precisieslider 0–3, label slepen, oude `areaDisplay.position`-weergave en viewportscroll.
- [ ] Tools/Layers-tab, zoeken, keyboardfocus, groepsdrag, locks en responsive layout.
- [ ] Color dialog (preset/HEX/native), Cancel/Escape/Apply, focusring en kleurcontrast.
- [ ] Undo/Redo-knoppen en afzonderlijke document-/rich-text-historie met keyboard.
- [ ] Handmatige IME/screenreader/touch en SVG/PNG-controle in externe viewer.

## 11. Technisch advies

**PASS.** De Node-suite (624/624) en de volledige Edge-run slagen; `pageErrors` is leeg en `git diff --check` slaagt. De geteste implementatiecommit wordt hierboven vermeld. Handmatige acceptatie staat los van dit technische oordeel; dit is geen mergebesluit.
