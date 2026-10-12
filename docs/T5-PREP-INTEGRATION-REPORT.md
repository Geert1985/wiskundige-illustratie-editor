# T5-prep — Integratierapport teksteditor (I1-I4)

Versie 1.0.0 — 2026-10-12  
Repository: `Geert1985/wiskundige-illustratie-editor`  
Branch: `chatgpt/editor-development`  
Status: technisch geleverd; wacht op handmatige T5-prep-acceptatie. T4-handmatige acceptatie blijft afzonderlijk open. T5a is niet gestart.

## Samenvatting

De goedgekeurde teksteditorinterface en gedeelde wiskundige invoer zijn in productie geïntegreerd in I1-I4. De wijziging blijft in de presentatie-/interactielaag. ProseMirror, document v7, rich-textschema's 1-3, `text.commit`, `MathSource`, `MathFragments`, dynamische bronrechten, geschiedenis en export zijn behouden. Er zijn geen modelvelden, documentmigraties of dependencies toegevoegd. De geïsoleerde prototype-mock voor meetwaarden is niet meegenomen.

## Uitvoering per fase

| Fase | Oplevering | Testbewijs |
|---|---|---|
| I1 — editorinterface | Donkere responsieve dialoog; gegroepeerde werkbalk; vaste acties; overlay voor invoer; objectnaam en context in de titel. Sluiten/annuleren laat de draft ongemuteerd. | Edge: vensters 1280×900, 768×900, 390×844 en 1280×580; geen horizontale overflow; actiebalk en contextpaneel zichtbaar; afsluiten zonder commit. Alle vier controles geslaagd. |
| I2 — symbolencatalogus | Nieuwe DOM-/documentonafhankelijke `TextSymbolCatalog`; 97 stabiele entries in 13 categorieën; Nederlandse en Engelse synoniemen; Unicode, LaTeX, formulemapping en templates gescheiden. | Node: 2 cataloguscontracttests geslaagd; alle mappings gevalideerd met `MathSource`; unieke IDs en accents-ongevoelige zoekfilters. Edge: categorie, zoeken, Unicode-invoeging en formuletemplate geslaagd. |
| I3 — cursor- en formule-invoer | `TextMathInput` beheert ProseMirror-bookmarks en UTF-16-selecties in het LaTeX-veld afzonderlijk. `TextFormulaEditor` valideert met de bestaande whitelist, rendert met `MathFragments` en negeert verouderde previews. Een sjabloon selecteert zijn eerste argument. | Node: 3 invoeg-/previewtests geslaagd. Edge: vervanging van het geselecteerde wortelargument door `\theta`, formulepreview, invoegen als één math-atoom en annuleren zonder documentwijziging geslaagd. Bestaande rich-math-, undo/redo- en offline exportchecks geslaagd. |
| I4 — dynamische waarden | `TextDynamicValueEditor` bevat bron-, eigenschaps-, precisie-, eenheids-, hoekeenheids-, prefix/suffix- en previewbediening. Waarden gaan uitsluitend via bestaande bronopties, `resolveTextValue`, `TextValues` en de bestaande tekstcommit. | Edge `browser-rich-values`: 20 gemelde controles geslaagd, waaronder restricted bronkeuze, policy-intrekking/redactie, stale revision, legacy-migratie, herladen, fullscreen, undo/redo en offline SVG/PNG. Node T1-T4 contracttests bleven groen. |

## Veranderde bestanden

- `editor.html`, `editor.css`, `editor.js`: dialoogopmaak, gedeelde assetcacheversie en titelvelden via vaste IDs. De vaste-ID-aanpassing herstelt bovendien teksttool-lifecycletests.
- `text-symbol-catalog.js`: centrale symbolendata, categorieën en zoekfunctie.
- `text-math-input.js`, `text-formula-editor.js`: formule-/cursorinvoeging, eerste templatepositie, preview en stale-resultaatcontrole.
- `text-dynamic-value-editor.js`, `text-insert-panel.js`: aparte dynamische-waardencontroller en dunne modus-/paneelhost.
- `tests/architecture.test.cjs`, `tests/text-symbol-catalog.test.cjs`, `tests/text-math-input.test.cjs`, `tests/browser-rich-math.cjs`, `tests/browser-rich-values.cjs`, `tests/browser-text-editor-modernization.cjs`: modulecontracten en browserregressie.
- Vier bijgewerkte screenshots onder `experiments/text-editor-integration/screenshots/`.
- `TEXT-EDITOR-ARCHITECTURE.md`, `TEXT-EDITOR-IMPLEMENTATION-PLAN.md`, `DEVELOPMENT-ROADMAP.md`, `T5-TEXT-EDITOR-MODERNIZATION-PROPOSAL.md` en dit rapport: actuele status en modulegrenzen.

## Moduleverantwoordelijkheden

`TextSymbolCatalog` is data en zoeken; het kent geen DOM of editor. `TextMathInput` vertaalt een catalogusitem naar tekstinvoeging, een formule-atoom of invoeging op de formuleveldselectie; het bewaart geen documentstaat. `TextFormulaEditor` valideert en toont uitsluitend previews met de bestaande MathSource/MathFragments-paden. `TextDynamicValueEditor` beheert alleen de dynamische-waardeninterface en vraagt toegestane opties/waarden aan de bestaande editorservices. `TextInsertPanel` bewaart de ProseMirror-bookmark, opent de juiste modus en herstelt focus. `editor.js` blijft eigenaar van de private tekst-draft, permissies en buitenste commit.

## Verschillen met het prototype

De productieversie gebruikt echte `sourceOptions` en `resolveTextValue`; de prototype-mock is verwijderd uit de productieflow. In gewone tekst worden Griekse symbolen als Unicode ingevoegd, terwijl formulecontext gevalideerde LaTeX-commando's invoegt. Eenheden- en hoeknotatie gebruiken bestaande instellingen. De dialogacties blijven vast zichtbaar en het invoerpaneel schuift als overlay over de editor zonder de dialooghoogte te vergroten. Tab-navigatie door templateargumenten is niet toegevoegd.

## Volledige regressie en compatibiliteit

- `npm.cmd test`: **454 tests geslaagd, 0 mislukt**.
- `npm.cmd run test:edge`: **54 browsermodules geslaagd**, Edge `pageErrors: []`. De suite bevat rich text, formules, dynamische waarden, fullscreen, JSON-roundtrip en offline SVG-/PNG-export.
- Voor productie-integratie: gerichte T4-tests **12/12**, gecombineerde T1-T4-tests **54/54** en volledige Edge-regressie groen. Dit was regressiebewijs, geen T4-gebruikersacceptatie.
- Aanvullende gerichte Edge-resultaten: `browser-rich-math.cjs` slaagde voor 16 benoemde controleclusters, inclusief vier offline formule-rastercases; `browser-rich-values.cjs` slaagde voor 20 benoemde controles; de nieuwe responsieve editorcheck slaagde voor 4 viewports en formule-/catalogusinteracties.
- De architectuurtest bevestigt scriptvolgorde en afhankelijkheden. Alle 97 catalogusitems hebben unieke IDs; alle aanwezige LaTeX/formule- en templatebronnen passeren `MathSource`.
- Document v7, bestaande textSchema 1-3, legacy `textBinding`, JSON-velden, replay en exports zijn ongewijzigd. De Edge- en Node-tests voor v6-documenten, legacy dynamische tekst, restricted projectie, undo/redo en export bleven groen.

## Beveiliging en rechten

De catalogus accepteert geen invoerbron of documentobject-ID. Formules passeren vóór preview en commit de bestaande begrensde `MathSource`-validator. Dynamische bronkeuzes komen van de actieve `textSourceOptions()`-filter; previews komen van `resolveTextValue()` en `TextValues`. Restricted tests bevestigen dat niet-toegankelijke bronopties ontbreken en dat een policy-intrekking broninformatie redacteert. De bestaande revision-, lock-, permission-epoch-, export- en stale-deliverycontroles blijven verantwoordelijk voor weigering; de nieuwe controllers vervangen die checks niet.

## Beperkingen en niet-uitgevoerde controles

- T4 wacht nog op de expliciete handmatige acceptatie; deze regressies sluiten die poort niet.
- T5-prep wacht op handmatige beoordeling van de productie-integratie en de bijgewerkte screenshots.
- Echte IME-invoer, schermlezer/assistieve technologie en handmatige toetsenbordcontrole met diverse OS/browsercombinaties zijn niet uitgevoerd.
- Er is geen cross-platform font-/renderacceptatie uitgevoerd. De bestaande offline SVG-/PNG-tests slagen wel in Edge.
- Tab-navigatie door meerdere formuletemplateargumenten ontbreekt bewust.
- De volledige suite is uitgevoerd in Microsoft Edge; andere browserengines zijn niet handmatig getest.

## Commits

- I1: `9856791` — responsive editor dialog shell.
- I2: `8b69cd5` — centrale zoekbare symbolencatalogus.
- I3: `8790536` — formulecursor-/template-adapters.
- I3-correctie: `20d8d9c` — gewone tekst behoudt Unicode; formulecontext gebruikt TeX-mapping.
- I4 (dynamische-waardencontroller, versiecache en compatibiliteitscorrecties): `f410db27dced31f61c16ec3e5b12f86b7e6e7290`.

## Volgende stap

Handmatige acceptatie van de T5-prep-productie-integratie, inclusief de screenshots en de zichtbare dialoog/paneelinteractie. T4-handmatige acceptatie blijft een afzonderlijke openstaande poort. Start T5a pas na T4-acceptatie, T5-prep-acceptatie, definitieve goedkeuring van het mathematische rekencontract en afzonderlijke expliciete starttoestemming.
