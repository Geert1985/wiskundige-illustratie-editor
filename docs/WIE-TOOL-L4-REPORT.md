# WIE-TOOL-L4 — Uniforme annulering en Escape-prioriteiten

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l4-cancellation-escape`.
Basis: `origin/main` `d8281584dfcac6e43b7f613ac40f162132c03b0e`, merge PR #41; bevat L3.5 (`cf706c5`).

## Uitkomst

De audit vond een concrete inconsistentie in de globale Escape-afhandeling. `EditorApp.keyDown()` annuleerde ook wanneer Selecteren al actief en er geen interactie was, maakte dan de selectie leeg en activeerde Selecteren opnieuw. Een mobiel eigenschappen- of gereedschapspaneel sloot alleen vóór de canvasannulering als er géén interactie bestond. De editorfallback voor een geopende teksteditor sloot de editor rechtstreeks en kon de specifieke annulering van een formule-/waarde-invoeging overslaan als Escape toch tot de window-handler doordrong.

De minimale wijziging laat subcomponenten en native dialogen hun eigen Escape verwerken. De window-handler sluit eerst een bovenliggende interface en retourneert. Daarna coördineert `cancelActiveInteraction({reason:'escape'})` één canvasannulering, inclusief de bedoelde overgang naar Selecteren. Zonder annuleerbare tool-/interactietoestand doet Escape niets. Bestaande geforceerde onderbrekingen blijven `cancel()`/`closeDialogs()` gebruiken en lopen niet door de Escape-prioriteitenladder.

## Inventaris van Escape-eigenaars

| Bron | Toestand | Afhandeling | Prioriteit/eigenaarschap |
|---|---|---|---|
| `text-insert-panel.js` | Formule- of dynamische-waardedraft actief | Annuleert alleen de draft, herstelt de editorbookmark en stopt propagatie | Hoogste WIE-subeditorlaag; teksteditor blijft open |
| `text-workspace.js` | Tekstmenu, invoegmodus, rich-text-editor of teksteditor actief | Menu sluit afzonderlijk; dialog/workspace verwerkt Escape; capture-fallback dekt editor-keymaps die propagatie afvangen | Subcomponent eerst, teksteditor pas bij een volgende Escape |
| `editor.js` rich-colormenu | Tekstkleurpopover open | Verbergt popover, herstelt focus en stopt propagatie | Boven teksteditor |
| `editor-radial-properties.js` | Radiaalmenu/detail geopend en geen native dialog open | Sluit menu en herstelt canvasfocus in document-capturefase | Boven globale editorhandler; native `dialog[open]` krijgt voorrang |
| `editor-tool-search.js` | Zoekveld heeft een zoekterm | Wist zoekterm, filtert opnieuw en stopt propagatie | Alleen als er daadwerkelijk tekst staat; leeg veld delegeert naar editor |
| `editor.js` `viewRenameKeyDown()` | Inline naamveld actief | Escape stopt propagatie en rerendert de opgeslagen naam | Inline editor bezit de gebeurtenis |
| `editor.js` `keyDown()` | Tekstdialoog actief | Delegeert aan `textWorkspace.handleCancel()`; sluit alleen als workspace geen afhandeling heeft | Tekstdraft/invoegpaneel vóór de volledige editor |
| Native `#colorDialog` | Kleurkiezer open | Native `cancel`-event roept `closeColor(true)` aan | Native dialoog; globale handler laat Escape door |
| Native `#textDialog` | Teksteditor open | Native `cancel`-event roept `handleCancel()` aan en sluit pas als geen subeditor Escape consumeert | Native dialog plus workspace/subeditor-contract |
| `editor.js` `keyDown()` | Canvas-tools-menu, splitmenu of bestandsmenu open | Sluit alleen het menu en retourneert | Tijdelijke interface vóór canvas |
| `editor.js` `keyDown()` | Mobiel tools-/eigenschappenpaneel of fullscreen-eigenschappenpaneel open | Sluit het paneel en retourneert; selectie en onderliggende interactie blijven staan | Tijdelijke interface vóór canvas |
| `editor.js` `cancelActiveInteraction()` | Canvasgesture, plaatsing, pending bronnen, tijdelijke distributiepreview, actieve niet-Selecteren-tool of navigatiemodus | Roept één keer `cancel()` aan, zet tool/navigatie naar Selecteren en synchroniseert instructies/render | Canvasannulering; geen completion |
| Geen eigenaar | Selecteren, geen interactie/preview/actieve modus | Geen actie | Geen onnodige state- of selectiewijziging |
| Browser Fullscreen API | Escape wordt voor fullscreen verlaten gereserveerd | `fullscreenchange` synchroniseert de weergave; deze route annuleert geen interactie | Browser beslist over verlaten fullscreen; WIE forceert behoud niet |

Andere keyboardhandlers zoals toolgrid-, canvasmenu- en sidebar-tabnavigatie verwerken geen Escape. Ze vallen door naar de bestaande eigenaar of de centrale editorroute. De experimentele `experiments/text-editor-modernization/app.js` is een geïsoleerd prototype en geen geladen editorroute; het is daarom niet aangepast.

## Annulerings- en prioriteitenmatrix

| Niveau | Actieve toestand | Escape-actie | Onderliggende toestand |
|---|---|---|---|
| 1 | Formule-/waarde-editor, rich-color-/tekstmenu of inline subeditor | Alleen subeditor annuleren/sluiten; gebeurtenis consumeren | Teksteditor, ingevoerde tekst en canvasstatus behouden |
| 2 | Native kleur-/tekstdialoog, bestands-/tool-/splitmenu, mobiel of fullscreen-paneel, radiaalmenu | Alleen de dialoog/overlay sluiten via zijn eigenaar | Onderliggende canvasinteractie blijft behouden waar zij nog bestaat |
| 3 | Teksteditor met nieuwe tekst of bestaande tekst in bewerking | Runtime-handle annuleren en alleen editor/pending tekst sluiten | Tool, document, history en onafhankelijke canvasinteractie behouden |
| 4 | Canvasgesture of plaatsingsstap | Interactie rollbacken, preview/feedback opruimen, capture vrijgeven; naar Selecteren | Document/history onveranderd; bestaande selectie herstellen |
| 5 | Pending bronselectie, Snijpunt, context-prefill of meerpuntsconstructie | De volledige onvoltooide canvasconstructie annuleren en naar Selecteren | Geen command/completion/history; bronnen en preview verwijderen |
| 6 | Actieve gereedschapsmodus zonder lopende interactie | Tool/navigatiemodus naar Selecteren | Selectie/document/history behouden |
| 7 | Geen annuleerbare toestand | Geen actie | Alle state behouden |

Een geldige `context-complete`-actie is al gecommit en heeft geen pending interactie; Escape behandelt die actie niet achteraf als constructie. `context-prefill` maakt wel de normale canvasinteractie aan en volgt niveau 5. Als een eerder actieve tool door context-complete behouden bleef, kan Escape die expliciete toolmodus afsluiten, maar er is geen contextactie meer om terug te draaien.

## Concrete codewijzigingen

- `editor.js` voegt `cancelActiveInteraction({reason:'escape'})` toe als coördinator voor Escape op canvas. De bestaande `cancel()` blijft de rollback-/cleanupprimitive voor gestures en expliciete onderbrekingen.
- `keyDown()` retourneert bij reeds geconsumeerde Escape-gebeurtenissen, delegeert tekstannulering aan `textWorkspace.handleCancel()`, en laat de native kleurendialoog zelf de `cancel`-gebeurtenis afhandelen.
- Mobiele en fullscreen overlays sluiten vóór canvasannulering, ook als er interactiestatus aanwezig is. Sluiten wist niet langer de selectie.
- Een actieve canvasinteractie annuleert nog steeds in één Escape naar Selecteren. Een volgende Escape met Selecteren en geen pending toestand is nu een no-op.
- De fullscreen-eigenschappenoverlay wordt gesloten zonder `preventDefault()` wanneer browser-fullscreen actief is. De browser kan zijn Fullscreen API-regel toepassen; de `fullscreenchange`-listener voert zelf geen tweede annulering uit.
- Succesvolle `completeToolInteraction()`-paden, `origin:'canvas'` en `origin:'context-complete'` zijn niet gewijzigd. Annulering roept de completion niet aan.
- `tests/lifecycle.test.cjs` voegt negen gerichte L4-proeven toe: idle no-op, lijnannulering/dubbele Escape, paneelprioriteit, invoegpaneeldelegatie, native kleurdialoogprioriteit, bestaande tekstbewerking, tekstfout gevolgd door Escape, context-prefill en expliciete toolwissel. Bestaande familie-/reset-/capturetests worden hergebruikt. `tests/browser-tool-escape.cjs` bevat een compacte echte-browsercontrole voor nested tekstinvoeging, canvasannulering en de native kleurendialoog.

## Familie- en interruptiecontrole

| Familie/route | Vastgesteld gedrag en verificatie |
|---|---|
| Vrij tekenen: lijn en gedeelde gesture | Nieuwe L4-lijntest en bestaande M1-annulering controleren rollback, selection restore, pointercapture en preview. |
| Driehoek/veelhoek | Bestaande test controleert Escape na meerstapsinvoer; polygon-blur/pointercancel/New/dispose-tests controleren onvoltooide cleanup. |
| Generieke constructiebron | Bestaande test `construction source selection Escape cleans up without adding an object` controleert bronannulering. |
| Snijpunt | L3.4 Escape-regressie controleert pending-bronnen, geen completion/history en previewcleanup. |
| Punt op object | L3.3a Escape-regressie controleert onafgemaakte bron-/plaatsingsinteractie. |
| Ellips | L3.3b Escape-regressie controleert Q-plaatsing en capture/previewcleanup. |
| Parallellogram | L3.3c Escape-regressie controleert parameterplaatsing en geen history/completion. |
| Tekst nieuw | L3.5 test plus nieuwe commandfout/Escape-test controleren editor-, pending- en runtimehandlecleanup zonder commit. |
| Tekst bewerken | Nieuwe test annuleert niet-gecommitte wijzigingen; geselecteerd tekstobject en onafhankelijke interactie/capture/preview blijven behouden. |
| Formule-/waarde-invoeging | Nieuwe adaptergrensproef controleert dat de editor fallback een geconsumeerde subeditor-Escape niet dubbel afhandelt. Bestaande browserproeven documenteren de echte formulepanelstappen; deze zijn in L4 niet uitgevoerd. |
| Context-prefill/-complete | Nieuwe prefill-Escape-test; bestaande L3.4-contextcomplete regressies behouden het onderscheid tussen directe completion en pending canvasconstructie. |
| Toolwissel en documentreset | Nieuwe expliciete toolwisseltest en bestaande New/polygon-resettest controleren force-cleanup zonder completion/history. Openen/importeren gebruikt dezelfde `closeDialogs()` + `cancel()`-grens. |
| Undo/Redo, blur, pointercancel, lost capture, dispose | Bestaande tests controleren rollback vóór geschiedenisactie, venster-/pointeronderbreking en dispose. Deze paden blijven buiten de Escape-prioriteitenladder. |

`cancel()` is een cleanup-/rollbackprimitive: het annuleert runtime-transacties, herstelt tijdelijk bewogen objecten, padpunten, groepsgeometrie of camera, zet selectie terug en geeft capture vrij. Het wist preview/feedback en registreert zelf geen history. De distributiepreview laadt haar opgeslagen beginmoment terug. De nieuwe Escape-coördinator roept dit alleen aan als een annuleerbare toestand bestaat. `setTool()`, `newDocument()`, `loadDocument()`, import, undo/redo, permission-contextwijzigingen en dispose houden hun bestaande geforceerde cleanup; ze lopen bewust niet door de Escape-ladder.

## Resterende risico's en bewijsgrenzen

- De nieuwe tests gebruiken de repositoryfixture met gesimuleerde DOM. Native dialog-cancelvolgorde, echte focusverplaatsing, browsercapture en fullscreen-reservering zijn bronmatig beoordeeld, niet in Edge gevalideerd.
- De formule-/waarde-Escape-proef controleert de editor-workspace-delegatie met een kleine adapterstub. Het echte paneel heeft eigen capture-/bubble-handlers in `text-workspace.js`/`text-insert-panel.js`; eerder bestaande browserproeven tonen de bedoelde nested Escape-stappen, maar zijn niet opnieuw gedraaid.
- Het color-dialogpad vertrouwt op het native `cancel`-event en is niet door een browser-run bevestigd. De windowhandler consumeert geen Escape zolang de kleurendialoog open staat.
- Escape tijdens browser-fullscreen kan fullscreen beëindigen volgens browsergedrag. WIE annuleert niet vanuit `fullscreenchange`; de suite bewijst niet welke browser de gebruiker gebruikt of welke fullscreen-eventvolgorde die browser levert.
- `cancel()` behoudt een aantal oudere gespecialiseerde rollbacktakken (`pathPoint`, distributiepunt en runtime-transactie). De bestaande regresstests controleren distributie-, drag- en constructieannulering, maar niet elk type-objectdrag in elke runtime-/restricted-configuratie.
- Pointercapture-/preview-eigenaarschap is gericht getest in de fixture; een volledige browser-, Edge- of restricted-runtime-regressie is niet uitgevoerd.

## Validatie en besluit

Gerichte commandoregressie:

```powershell
node --test --test-name-pattern="WIE-TOOL-L4|M1 all cancellation paths|text form commits|empty text is not committed|unfinished polygons|triangle and multi-click polygon|construction source selection Escape|WIE-TOOL-L3.1 free point|WIE-TOOL-L3.2|WIE-TOOL-L3.3a unsupported source and Escape|WIE-TOOL-L3.3b invalid Q stays|WIE-TOOL-L3.3c Escape|WIE-TOOL-L3.4 Escape|WIE-TOOL-L3.4 context prefill|WIE-TOOL-L3.5" tests/lifecycle.test.cjs
node --check editor.js
node --check tests/lifecycle.test.cjs
node --check tests/browser-tool-escape.cjs
git diff --check
```

De lifecycleselectie slaagde **27/27**. De gerichte Edge-module is aangemaakt, maar `node scripts/run-browser-module.cjs browser-tool-escape.cjs` kon niet starten omdat de checkout de module `playwright` niet heeft (`MODULE_NOT_FOUND`). De browserproef is dus niet PASS en moet in een omgeving met Playwright/Edge worden uitgevoerd. Geen volledige Node-suite, Edge-run, browserregressiesuite of prestatietest is uitgevoerd.

**Beoordeling: CONDITIONAL GO.** De centrale Escape-route en alle geselecteerde Node-tests slagen; de echte nested-editor-, native-dialog- en browser-eventvolgorde is nog niet geverifieerd doordat Playwright ontbreekt. PR/merge en handmatige browseracceptatie blijven aparte stappen.
