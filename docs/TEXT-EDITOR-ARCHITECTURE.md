# Geavanceerde teksteditor — architectuur T1–T5

Versie 1.1.0 — 2026-10-11 — **gecorrigeerd voorstel, fase 0; niet definitief goedgekeurd**.

Repository: Geert1985/wiskundige-illustratie-editor. Branch: `chatgpt/editor-development`. Onderzochte baseline: `64ba1a29213a448df75e579fc9fb414667a31bee`.

Dit document beschrijft toekomstige implementatie, geen reeds geleverde functionaliteit. De masteropdracht vereist expliciete goedkeuring na fase 0 en na iedere milestone, inclusief T5a–d. T1 is niet gestart. Zie [implementatieplan](TEXT-EDITOR-IMPLEMENTATION-PLAN.md).

Audit B1–B7 is verwerkt in secties 11–18 en [audit resolution](TEXT-EDITOR-ARCHITECTURE-AUDIT-RESOLUTION.md). Die secties preciseren het eerdere voorstel en zijn leidend bij verschil. Bibliotheek- en fontkeuzes blijven open tot afzonderlijk goedgekeurde technische proeven resultaat leveren.

## 1. Inventaris van de huidige implementatie

| Onderdeel | Bevinding en gevolg |
|---|---|
| Model (`model.js`) | Vrije tekst heeft `x`, `y`, `text`, `rotation` en objectstijl. Geen alinea's of fragmentopmaak. Tekststijl bevat fontSize, fontFamily en anchor. Modelwaarden worden genormaliseerd en losgekoppeld van invoer. |
| Binding (`model.js`, `MI.DynamicText`) | Eén optionele `textBinding`: schema 1, sourceId, property, precision, prefix, suffix. Strikte sleutels en typen; precisie null of 0–10; prefix/suffix maximaal 2000 tekens. Bron moet een niet-tekstobject zijn. |
| Beschikbare waarden | name/label; lengte van line/vector/dimension; radius/perimeter/area van circle; perimeter/area van polygon; angle; x/y van point. Diameter, coördinatenpaar en vectorcomponenten zijn geen bestaande bindingeigenschappen. Deze niet stilzwijgend als ondersteund presenteren. |
| Constructies | Geometrische recepten blijven de eigenaar van afgeleide geometrie. Constructietekst voor oppervlakte/omtrek gebruikt een eigen labelpad. Vrije dynamische tekst leest bronnen, maar is geen geometrische constructie. |
| Renderer (`renderer.js`) | Vrije tekst wordt één escaped SVG-text-element. Rotatie en anchor bestaan; er is geen expliciete meerregelige lay-out. Rendering ontvangt een bronmap. |
| Selectie (`editor.js`, `rectangle-selection.js`, `index.js`) | Tekstselectie gebruikt getBBox/getScreenCTM van het eerste text-element; fallback-hitdetectie gebruikt het anker. Meerdere runs en formulepaden vereisen gezamenlijke inhoudsgrenzen. |
| Invoer (`editor.html`, `editor.js`) | Native dialog met één tekstinput. Private pendingText bewaart de tekenpositie. Inspector heeft statische tekst of één binding met bron/eigenschap/notatie. Geen fragmentselectie. |
| Eenheden (`measurement-geometry.js`) | MeasurementUnits past schaal één keer toe op lengte, kwadratisch op oppervlakte. mm/cm/m/km en abstracte e. AngleMeasurements berekent graden en zet bij formatteren naar radialen om. |
| Formaten (`model.js`, `DOCUMENT-FORMAT.md`) | Writer kiest v2, v3 bij constructies, v4 bij groepen, v5 bij lagen. Constructieschema 1–4 is onafhankelijk. Import valideert eerst; Engine-preflight controleert grid/axes/presentation, nog geen rijke tekst. Geen rich-textschema. |
| Geschiedenis (`editor-history.js`) | Documentsnapshots en selectie, maximaal 100 items met geheugenbudget van 16 MiB; no-op wordt niet opgenomen. Restricted history is privaat. |
| Replay (`semantic-sequence.js`) | Getypeerde commandallowlist, maximaal 1000 stappen, 4 MiB, 100000 nodes en diepte 64. Replay via AuthorCommands op een aparte Engine. Geen bewijs van authenticiteit of beoordeling. |
| Permissies (`permission-runtime.js`) | Veldgrants, bronleesrechten, locks, projectie en exportfiltering bestaan. Nieuw model mag bestaande stijlrechten niet tot willekeurige bron-/AST-wijzigingen verheffen. Export bevat een expliciete version===5-lagencheck die voor v6 aangepast moet worden. |
| Export/fullscreen | JSON en SVG beschikbaar. Geen productie-PNG-export gevonden; browser-dynamic-angles en browser-point-projections rasteren SVG in tests. Native dialogs werken boven fullscreen; Escape mag fullscreen niet verlaten. |
| Fonts/dependencies | editor.html haalt Source Sans 3 van Google Fonts. Geen runtime-editorbibliotheek of frontendbundler; Playwright is devdependency. Netwerkonafhankelijke rich-text-export vraagt lokale fontassets. |
| Tests/documentatie | Node-tests en echte Edge-run via tests/browser.cjs. Bestaande contracten voor dynamische tekst, eenheden, permissies, replay en formaten blijven normatief voor legacy. package.json verlangt Node 22; tests/README noemt nog Node 20. Formaatdocument bevat historische v2-tekst naast latere uitbreidingen. |

Een ontbrekende/ongeldige dynamische bron toont nu `niet beschikbaar`, met prefix/suffix; verwijderen hoeft het tekstobject niet te verwijderen. Deze herstelbaarheid moet behouden blijven. Duplicatie remapt al constructiebronnen bij een gekopieerde graaf; nieuwe inline bronverwijzingen moeten expliciet mee worden genomen.

## 2. Applicatie-eigen inhoudsmodel

Bewaar het bestaande tekstobject met ID, positie, rotatie, lagen en groepen. Voeg optioneel `textContent` toe. De opslagstructuur is onafhankelijk van ProseMirror of een andere invoerbibliotheek. Voorbeeld voor T1:

```json
{
  "schema": 1,
  "defaults": {"fontId": "sans", "fontSize": 16, "color": "#222222"},
  "width": null,
  "paragraphs": [{
    "id": "p1", "align": "left", "lineHeight": 1.25,
    "runs": [
      {"id": "r1", "kind": "text", "text": "Oppervlakte ", "marks": {}},
      {"id": "r2", "kind": "text", "text": "A", "marks": {"bold": true}}
    ]
  }]
}
```

- Marks: bold, italic, underline, strike, script (`none`, `super`, `sub`), fontId, fontSize en color. Super/sub sluiten elkaar uit. Uitlijning behoort bij de alinea.
- Enter maakt een alinea; Shift+Enter een getypeerde `hardBreak`. Lege alinea's blijven bestaan. Geen HTML, CSS-strings, URL's of uitvoerbare inhoud in het model.
- Fragment-ID's zijn lokaal binnen een tekstobject. Normalisatie voegt aangrenzende equivalente tekstruns samen; kopiëren/replay gebruikt deterministische lokale IDs.
- `width:null` betekent natuurlijke breedte en expliciete afbrekingen. Uitlijning gebruikt de breedste alinea. Optionele vaste tekstbreedte en automatische wrapping volgen in T4.
- Voorstel limieten: 20000 Unicode-codepunten, 2048 runs, 128 alinea's, 1 MiB per tekstobject; aanvullend een documentbudget. Nieuwe fontgroottes 6–120 SVG-eenheden. Bestaande afwijkende legacywaarden worden niet door deze nieuwe limiet vernietigd.
- Een afgeleide platte `.text` blijft een niet-autoritatieve fallback. Dynamische fallback bevat veilige placeholders, geen gecachte brongeheimen.

Latere discriminated-unionvarianten, nog niet geldig in T1:

| Type | Autoritatieve inhoud |
|---|---|
| math (T2) | source: gecontroleerde TeX-subset, marks; geen opgeslagen renderer-HTML/SVG |
| dynamicValue (T3) | binding: sourceId/property; format: precisie, eenheidskeuze, prefix/suffix; marks |
| calculatedValue (T5c) | expression: schema + getypeerde AST; format: weergavemodus, precisie, eenheids-/hoekkeuze; marks |

Een AST bewaart stabiele bron-IDs; zichtbare namen zijn geen sleutels. Eventuele oorspronkelijke invoerspelling moet bij herparsen dezelfde AST opleveren. Geen tweede onafhankelijke formulewaarheid.

## 3. Formaat en migratie

Voorstel: document v6 zodra rich text aanwezig is, met afzonderlijke tekstschemaversie. Tekstschema 1=T1, 2=T2, 3=T3, 4=T5c. Onbekende toekomstige fragmenten worden vóór mutatie afgewezen. Constructieschema's blijven onafhankelijk. Vervang exacte versievergelijkingen voor lagen door feature-/minimumversiechecks.

Ongewijzigde legacydocumenten blijven v1–5 lezen en hun bestaande writerpad gebruiken. Statische tekst wordt pas bij bevestigen van een bewerking naar textContent omgezet. Annuleren migreert niets. T1 behoudt bestaande dynamische bindings en hun inspector; gebonden inhoud wordt niet tot statische tekst afgevlakt. T3 kan die binding bij een bevestigde bewerking omzetten naar prefix + dynamicValue + suffix; bewaar de bestaande statische terugval voor expliciet ontkoppelen. textBinding en textContent zijn wederzijds uitsluitend.

Constructietekst voor oppervlakte/omtrek blijft receptgestuurd; vrij bewerken vraagt eerst bewust losmaken. Ontbrekende bron-IDs blijven in auteursdocumenten bewaard zodat undo herstel mogelijk maakt. Duplicatie van alleen tekst behoudt bron-IDs; duplicatie met bronnen remapt uitsluitend meegekopieerde IDs. Import, duplicatie, exportprojectie en replay krijgen dezelfde validator. Oude applicatieversies mogen v6 afwijzen; stil verlies van opmaak is geen downgradebeleid.

## 4. Modules en transacties

Voorgestelde modules:

| Module | Verantwoordelijkheid |
|---|---|
| text-content.js | Schema, normalisatie, migratie, quotas |
| text-editor.js | Dialog, editoradapter, selectiebookmarks, private draft/history |
| text-values.js | Getypeerde bronwaarden, beschikbaarheid, formattering |
| text-dependencies.js | Omgekeerde index sourceId → tekstobject/fragment |
| text-layout.js | Advances, ascent/descent, regels, baseline, totale bounds |
| text-svg.js | Gedeelde SVG-uitvoer voor preview, canvas en export |
| math-fragments.js | Begrensde formuleadapter, assetreadiness, cache |
| expression-engine.js | Pure parser, typecontrole en evaluator |
| text-calculator.js | Rekenmachine en bronkiezer |
| export-service.js | Expliciete assetvoorbereiding, zelfstandige SVG en PNG |

Pipeline: geautoriseerde snapshot → waarden oplossen → lay-out → SVG. De bestaande synchrone Engine.renderSVG blijft beschikbaar voor legacy en voorbereide assets. Een expliciete asynchrone voorbereidings-/exportlaag wacht op fonts/formules; geen impliciete wijziging naar Promise. Resultaten van oude async-taken worden verworpen op documentrevisie, inhoudshash en permission epoch.

Voorstel één getypeerde `text.commit`-actie voor maken/bewerken. Payload bevat doel (nieuw/bestaand), inhoud en verwachte revisie. AuthorCommands, restricted runtime en semantic replay valideren deze centraal. Autorisatie vergelijkt wijzigingen per categorie: inhoud, opmaak en bronnen. Geen algemene vrijbrief voor een complete AST via bestaande stijlgrants.

De dialog bewerkt uitsluitend een private draft. Lokale undo/redo tijdens typen verandert documentgeschiedenis niet. OK levert één atomaire documentactie; Annuleren nul. Controleer bij OK opnieuw bronrechten, locks, bestaan en revisie. Bij conflict niet stil overschrijven. Native Escape sluit eerst een kindpaneel, dan de dialog; fullscreen blijft actief. Import/dispose en gewijzigde selectie mogen geen stale draft bevestigen.

Toolbaracties bewaren tekstselectie via editorbookmarks. Formule- en waardeatomen zijn met toetsenbord selecteerbaar, verplaatsbaar en opnieuw te openen. Test IME, Unicode, plakken en cursorposities naast atomen. Het dialoogontwerp volgt de bestaande donkere UI en gele accenten; een afzonderlijke eerder besproken mockup was niet beschikbaar voor deze analyse.

## 5. Lay-out, fonts en export

Gebruik dezelfde inline boxen voor preview/canvas/export: advance, ascent, descent en baseline. Regelhoogte is de maximale benodigde hoogte, inclusief scripts/formules. Onderstrepen/doorhalen zijn gecontroleerde geometrie. Behoud legacy anchor/rotatie; gewijzigde veldbreedte verandert nooit x/y. Selectie gebruikt de gezamenlijke inhoudsgrenzen, niet het eerste text-element.

Voorgestelde offline strategie: kleine lokale, gelicentieerde fontallowlist met reguliere/vette/cursieve varianten en Griekse dekking. SVG-text met ingesloten fonts en glyphpaden zijn gelijkwaardige proefkandidaten; er is nog geen gekozen uitvoerstrategie. JSON behoudt bewerkbare tekst. Toegankelijke tekst moet bij beide uitvoervormen worden bewezen. Sectie 13 bepaalt de verplichte vergelijking vóór volledige T1-integratie. Complexe wereldwijde schriftvorming wordt niet zonder bewijs geclaimd. Legacy SVG-tekst behoudt zijn bestaande pad.

MathJax-SVG krijgt unieke ID-prefixen en uitsluitend lokale glyphreferenties. Valideer uitvoertags/attributen; geen foreignObject, externe links, scripts of netwerkfonts. De bronnotatie blijft leidend. Alle renderlocaties gebruiken dezelfde formulebaseline.

T2 moet al SVG-naar-PNG-formulerendering testen. T4 levert de productie-PNG-route via zelfstandige SVG → Image → canvas.toBlob, inclusief afmetingen-/geheugenlimieten en URL-revocation. Offline tests blokkeren netwerk. Export wacht expliciet op assets of geeft een duidelijke fout; nooit gedeeltelijke stille uitvoer.

## 6. Dynamische bronnen en beveiliging

Tekstafhankelijkheden zijn een alleen-lezen presentatielaag boven de geometrische graaf. Geen tekst-naar-tekst of berekend-veld-naar-veld-bronnen in T1–T5; daarmee ontstaan geen nieuwe cycli. Herbouw de reverse index na import/undo; invalideer bij geometrie, eenheids-/hoekinstellingen, rechtenepoch en relevante zichtbaarheid. Deel geen resultaten tussen autorisatiecontexten.

| Bronstatus | Beleid |
|---|---|
| Geldig | Formatter gebruikt ruwe geometrie en bestaande notatieregels |
| Verwijderd/ongeldig | Veld blijft met generieke niet-beschikbaarstatus; undo kan herstellen |
| Verborgen in auteursmodus | Leesbare bron mag blijven bijdragen; zichtbaarheid is geen verwijdering |
| Restricted | Voor nieuwe inlinevelden zowel read als display vereisen; legacybeleid niet ongemerkt wijzigen |
| Vergrendeld | Lezen indien toegestaan; geen bronmutatie vanuit de teksteditor |
| Rechten ingetrokken | Cache en preview ongeldig; geen oude bronwaarde laten staan |

Publieke projectie en restricted export verwijderen verboden IDs, namen en AST-inhoud. Vervang een niet-geautoriseerd berekend veld als geheel door een generieke literal; gedeeltelijke substitutie kan gegevens lekken. Auteursopslag houdt herstelbare verwijzingen. Preview, DOM, fouten, export en replay mogen geen alternatieve lekroute vormen.

Validateer diepe objecten, verboden prototypes/accessors, onbekende sleutels, aantallen en strings vóór render/mutatie. Plakken wordt naar schema vertaald; geen willekeurige HTML opslaan. TeX heeft een eigen allowlist en complexiteitslimieten; renderer-safety alleen is onvoldoende. Geen eval, Function, JavaScript-membertoegang, assignments, lussen, imports of netwerkfuncties.

## 7. T5: parser, dimensies en numeriek contract

Voorkeur: kleine applicatie-eigen Pratt-parser en pure evaluator, herbruikbaar zonder UI/geometrie. AST-nodes: number/quantity, constant, source, unary, binary, call. Alleen benoemde functies uit een vaste tabel.

```text
sum     := product ((+ | -) product)*
product := unary ((* | /) unary)*
unary   := (+ | -) unary | power
power   := primary (^ unary)?
primary := number [unit] | pi | e | source | '(' sum ')' | function(args)
```

Machten zijn rechtsassociatief; -2^2 = -4 en 2^-2 is geldig. UI normaliseert decimale komma; argumenten gebruiken puntkomma in Nederlandse invoer. De kern vereist expliciete vermenigvuldiging; sectie 14 bepaalt welke ondubbelzinnige UI-invoer naar een expliciete operator mag worden vertaald. Bronchips worden getypeerde tokens, nooit door naamherkenning gelezen.

Functies: sqrt, abs, sin/cos/tan, asin/acos/atan, ln, log10, exp, floor, ceil, trunc en round met gecontroleerd aantal decimalen. Voorstel limieten: 2048 invoertekens, 512 tokens, 256 AST-nodes, diepte 32, 1024 evaluatiestappen, 64 bronverwijzingen; aanvullend documentwerkbudget. Geen CAS of complexe getallen.

Interne quantity: eindige binary64-waarde, dimensie-exponenten voor lengte en hoek, en physical/abstract-eenheidsruimte. Fysieke basis is meter/radiaal. Abstracte e kan zonder kalibratie niet bij fysieke lengte worden opgeteld. Dimensieloze waarden zijn neutraal.

- Geometrieadapter leest ruwe waarden, past documentschaal één keer toe en zet naar SI om; oppervlakte gebruikt schaal². Huidige hoekwaarden in graden worden één keer naar radiaal omgezet. Nooit geformatteerde strings terugparsen.
- Optellen/aftrekken vereist gelijke dimensies en compatibele eenheidsruimte. Product/quotiënt telt exponenten op/af; gelijke lengtes delen levert dimensieloos.
- Dimensionele machten vereisen constante gehele exponenten, voorlopig -8..8. sqrt vereist niet-negatieve waarde en even dimensie-exponenten. Dimensionele fractionele machten worden afgewezen.
- abs behoudt dimensie. Afronden gebeurt in de expliciet gekozen weergave-eenheid en converteert terug, niet ongemerkt in meter. Voor samengestelde dimensies moet die eenheid bepaald zijn.
- Trigonometrie accepteert een getypeerde hoek in radiaal. Een dimensieloze invoer volgt de formulekeuze document/graden/radialen. Inverse trigonometrie levert een hoek. ln/log10/exp vereisen dimensieloos.
- Deling door exact nul, ongeldige domeinen en niet-eindige uitkomsten zijn fouten. Nabij nul niet algemeen tot nul afronden. Voor tan geldt een expliciete, te testen singulariteitstolerantie (voorstel |cos(x)|≤1e-12); inverse trigonometrie krijgt geen ruime stille clamping.
- Bereken zonder tussentijdse displayafronding. Binary64 is geen arbitraire precisie; vermeld dit bij extreme waarden. Domeinfouten zijn duidelijk maar bevatten geen verboden bronnamen.

De drie weergavemodi komen uit dezelfde AST en geautoriseerde snapshot: resultaat, symbolische formule met resultaat, ingevulde waarden met resultaat. Namen worden escaped; haakjes en eenheden blijven wiskundig correct. Voor πr²: r=2 cm → 12,57 cm²; r=3 cm → 28,27 cm². Bij andere documentschaal mag geen tweede schaalfactor ontstaan.

## 8. Bibliotheekafweging

Dit zijn voorstellen; geen dependency is geïnstalleerd en bundelgroottes zijn nog niet gemeten.

| Kandidaat | Afweging |
|---|---|
| Eigen contenteditable | Weinig dependencies, maar veel risico rond selectie, IME, plakken, undo en atomen. Niet de voorkeur. |
| ProseMirror | Kandidaat voor uitsluitend de invoeradapter, onderworpen aan de verplichte proef in sectie 15. Persistente inhoud blijft ons eigen model. Lokale reproduceerbare bundle nodig. |
| KaTeX | HTML/MathML-uitvoer en trustinstellingen zijn bruikbaar, maar extra conversie nodig voor onze SVG-first renderer. |
| MathJax SVG | T2-kandidaat: SVG-glyphuitvoer past rechtstreeks. Async fontdata en omvang vragen readiness, lokale assets en meting vóór keuze. |
| OpenType.js | Kandidaat voor fontmetrics/glyphpaden; licenties, kerning en schriftdekking eerst bewijzen. Geen claim van volledige complexe shaping. |
| Eigen expressie-engine | Kleine expliciete grammatica met eigen dimensies voorkomt onnodige generieke programmeermogelijkheden. Meer eigen wiskundige tests vereist. |

Primaire bronnen: [ProseMirror guide](https://prosemirror.net/docs/guide/), [KaTeX opties](https://katex.org/docs/options), [KaTeX veiligheid](https://katex.org/docs/security), [MathJax SVG](https://docs.mathjax.org/en/v4.0/options/output/svg.html), [MathJax async typesetting](https://docs.mathjax.org/en/latest/web/typeset.html), [OpenType.js](https://github.com/opentypejs/opentype.js). De keuze voor MathJax is een architectuurafweging, geen gemeten performancevoordeel. MathJax local fontCache ondersteunt lokale glyphreferenties; dat vervangt geen applicatiesanitizer.

T1/T2-spikes moeten exacte gepinde versies, gzip/raw code- en fontomvang, licenties, cold/warm render en offline export meten. Voorlopige budgetten ter bespreking: editorcode 250 KiB gzip exclusief fonts, formulecode/data 2 MiB, fonts 3 MiB. Overschrijding vraagt onderbouwde herkeuze; deze getallen zijn geen testresultaten. Assets lokaal en lazy-loaded, geen runtime-CDN.

## 9. Teststrategie en risico's

Iedere milestone: gerichte Node-tests, volledige bestaande Node-suite, relevante echte Edge-tests plus volledige regressierun, visuele controle, JSON/SVG en undo/replay. Vermeld exacte aantallen en onderscheid één browsersuite van haar modules/checks.

Nieuwe regressies dekken schema/malformed input, legacyv1–5 en v6, groepen/lagen, bronduplicatie, locks/grants, restricted redactie, één OK/zero Cancel, revisieconflicten en semantische replay. T5 voegt precedence, dimensies, conversies, domeinen, quotas en parser-print-parser-roundtrip toe.

Edge: echte fragmentselectie, sneltoetsen, IME/plakken, caret rond atomen, fullscreen/Escape, modal focus, responsive 390/760/1159/1446 px, late async-resultaten en ingetrokken rechten. Visueel: alle fontfaces, 12/16/32 pt-equivalent, Grieks, super/sub, lege regels, breuken/wortels, rotatie, zoom en veranderende dynamische breedte. Zelfstandige SVG/PNG testen met netwerk geblokkeerd. Belastingsmetingen met 10/100/500 objecten en 1/10/100 velden; thresholds pas na baseline vastleggen.

Belangrijkste risico's: fontshaping en exportgelijkheid; libraryomvang; async races; bronlekken via caches/fallbacks; onjuiste dubbele schaal/hoekconversie; v6-compatibiliteit met oude readers; IME/selectiecomplexiteit. Securityfixtures omvatten HTML/SVG/TeX-injectie, diepe AST, prototype-invoer en veranderende permissies.

Besluitstatus en goedkeuringspoorten staan in sectie 18. ProseMirror, fonttechniek en formulebibliotheek zijn geen definitieve keuzes. Het verfijnde rekencontract moet vóór T5a afzonderlijk definitief worden goedgekeurd.

## 10. Fase-0-verificatie

Op de ongewijzigde runtimebaseline uitgevoerd: `node --test tests/*.test.cjs`: **364 geslaagd, 0 mislukt, 0 overgeslagen**. `node tests/browser.cjs`: **1 volledige Edge-suite geslaagd**, exitcode 0. De suite rapporteert named checks, geen uniform aantal individuele tests; aantallen niet kunstmatig optellen. Logs zijn lokaal opgeslagen als text-editor-phase0-node.txt en text-editor-phase0-edge.json.

Geen T1–T5-featuretests uitgevoerd: de features zijn nog niet geïmplementeerd. Fase 0 wijzigt uitsluitend documentatie. Rapporten T1-REPORT t/m T5d-REPORT worden pas na uitvoering van het betreffende checkpoint aangemaakt.

## 11. B1 — Formele compatibiliteits- en migratiematrix

De huidige constante MODEL_VERSION is 2, geen maximum-reader-versie. `model.version` blijft intern 2; de writer kiest 2–5 op features. Deze twee begrippen worden in T1 expliciet gescheiden: legacy basisversie 2, reader maximum 6 en minimale schrijfversie per feature. Het verhogen van MODEL_VERSION alleen zou v3–5-validatie omzeilen en is verboden.

| Invoer | Huidige toelating/interpretatie | Nieuwe reader en migratie | Schrijven zonder rich text / met rich text |
|---|---|---|---|
| v1 of ontbrekende versie | Legacy objecten; distinct label herstelt name wanneer name leeg/ID is | Zelfde eenmalige labelmigratie; geen textContent bij alleen openen | Minimaal v2 / v6 na expliciet bevestigd omzetten |
| v2 | Basisobjecten; historische onbekende rootextensions blijven opaque | Zelfde gedrag; bekende rich-textsleutels mogen niet als opaque doorglippen | v2, of 3/4/5 door bestaande features / v6 |
| v3 | constructionSchema 1–4 vereist voor v3-toelating | Bestaande recept-/asschema's valideren; geen nieuwe tekstmigratie bij openen | v3 zolang constructies aanwezig zijn / v6 |
| v4 | groupSchema 1 en groups-array vereist; constructies vragen geldig schema | Groepen, leden en constructies blijven intact | v4 zolang groepen aanwezig zijn, anders minimumfeatures / v6 |
| v5 | layerSchema 1 en layers-array vereist; groups indien aanwezig vragen schema 1 | Lagen/groepen volledig valideren en behouden | v5 zolang lagen aanwezig zijn / v6 |
| v6 | Wordt nu afgewezen | Vereist root textSchema 1–4 én ten minste één textContent; arrays/schemaversies voor aanwezige groups/layers; constructionSchema voor aanwezige recepten. Alle onderdelen vóór commit valideren | v6 zolang rich text aanwezig is; zonder rich text alleen door expliciete normalisatie naar minimale featureversie |

v6 root `textSchema` is de hoogste vereiste inhoudsversie van aanwezige tekstobjecten. Iedere textContent houdt zijn eigen schema; een fragment mag alleen in zijn minimale/latere ondersteunde schema voorkomen. T1 accepteert root/object 1, T2 tot 2, T3 tot 3, T5c tot 4. Root lager dan een object, onbekende hogere versie of textContent in v1–5: atomair afwijzen. Geen stil fallback-renderen van onbekende rijke inhoud.

Een bestaande opaque root `layers`/`groups`-extension in oudere documenten mag bij v6-upgrade niet overschreven of stil als organisatie geïnterpreteerd worden. Detecteer gereserveerde-sleutelconflict vóór bevestiging en weiger migratie met duidelijke melding; bestaande legacy opslag blijft intact. Deze randgevallen zijn al bekend in tests/layers.test.cjs. Een oudere reader wijst v6 expliciet af. Er is geen automatische v6→v5-afvlakexport.

### Volledige inventaris van productie-documentversiecontroles

Repositoryzoekactie over alle eigen JavaScriptbestanden, exclusief node_modules/vendor. Onderstaande locaties bevatten de gevonden documentversievertakkingen; regelnummers verwijzen naar runtimebaseline 64ba1a2 (documentatiecommit cc23585 wijzigt ze niet).

| Locatie | Huidige controle | Vereiste T1-wijziging en regressie |
|---|---|---|
| model.js:11,164,256,262 | MODEL_VERSION=2, interne versie en publieke constante | Readermaximum apart introduceren; alle oude invalid-schemafixtures blijven afwijzen |
| model.js:219 | Writer kiest lagen 5, groepen 4, constructies 3, anders 2 | Rich text heeft prioriteit 6; overige schemas onafhankelijk; mixed rich+groups+layers+axis-arm recepten roundtrip |
| model.js:222–223 | Ontbrekend→1, numeric/integer/range; exacte uitzonderingen 3/4/5 | Expliciete dispatch per v1–6, geen open `>=6`; v0, fractioneel, v7, verkeerd/missend schema atomair afwijzen |
| model.js:231 | Root exclusions groups bij >=4; layers bij ===5 | v6 textSchema/organisatie uit opaque extras houden; legacy extensions en conflicten testen |
| model.js:238 | ===1 label→name | Alleen v1; openen/herladen mag name niet opnieuw veranderen |
| model.js:250 | >=4 constructieschema vereist | Voor v6 eveneens; schema 1–4 en vereisten voor axis/arm blijven exact |
| model.js:251–253 | ===5 groepsschemacheck/lagen; >=4 groepsvalidatie | Featurevalidatie voor v6, ontbrekende members/schema afwijzen, bestaande v4/v5-regels bewaren |
| permission-runtime.js:177 | Restricted JSON-lagen alleen doc.version===5 | Aanwezige lagen valideren/exporteren voor v5 én v6; textSchema berekenen uit geprojecteerde inhoud, niet alleen origineel overnemen |
| editor.js:844 | Nieuw leeg document literal version:2 | Bewust v2 houden; eerste rich commit kiest v6 via writer |

Aanvullende paden zonder eigen documentversievergelijking: `index.js:185–199` Engine.load (stagingmodel; createDocumentRenderer:20–28 doet presentation/grid/axes-preflight, geen tekstpreflight); `editor.js:847–879` JSON/import; `editor-startup.js:13–15` DraftStore.restore via Engine.load en `editor-bootstrap.js:12–16` koppeling (geen draft in restricted); `editor-history.js:9,27–33` snapshots/restore; `permission-runtime.js:155–166` undo/reset/replace/meta changes via e.load; `persistent-groups.js` en `document-layers.js` valideren structuren maar kiezen geen documentversie; `semantic-sequence.js:13–18` baseline/candidates via Engine. Deze moeten v6-fixtures krijgen en mogen geen zelfstandig permissieverruimende decoder toevoegen. T1 voegt expliciet rich-schema/lay-outpreflight toe vóór documentvervanging; bestaande presentation-preflight is geen bewijs daarvan.

`semantic-sequence.js:17–18` gebruikt **artifact version 1**, niet documentversie. Die blijft 1; voeg text.commit expliciet aan commandallowlist toe. Record bevat operation/payload/createdIds; live revisie/epoch worden tijdens replay opnieuw gebonden, niet als historische globale revisie meegesleept. Test v2-baseline→v6 via commit, v6-baseline met lagen, deterministische IDs en gedeeltelijke replay. Oude artefacten blijven hetzelfde resultaat opleveren. Runtime policy/command/schema-versies zijn eveneens aparte contracten.

Regressiematrix: elk v1–v6-fixture via model, Engine, browserimport, lokale draft, history, author JSON/SVG, restricted JSON/SVG en replay waar toegestaan; geldige/ongeldige schema's, groepen/lagen, ontbrekende bron, provenance-onafhankelijke extensions. Bij geweigerde import blijft zowel document als selectie/history onaangeroerd. Voor alle exportuitvoer moet opnieuw importeren slagen of de route expliciet vooraf geweigerd zijn.

## 12. B2 — Permissiematrix en text.commit

Nieuwe policyvoorstelvelden: objectregel `textCapabilities` met booleans `content`, `format`, `math`, `references`, `expressions`, `migrateLegacy`; sourceobjectregel `textSourceProperties` met expliciete eigenschapallowlist. Ontbrekende velden zijn false/leeg in restricted mode. Nieuwe policy schema 2 is nodig; schema-1-policies behouden legacygedrag en geven geen nieuwe rich rechten. Author mag de categorieën gebruiken binnen schema/locks/quotas. Dit zijn toekomstige contractvelden, geen bestaande API.

| Wijziging | Benodigde rechten naast doel-read/display en unlocked | Extra controles |
|---|---|---|
| Gewone tekst, alinea/hardBreak; bestaande atomen verplaatsen | content | Alleen toegestane nodewijziging; identiteiten/bindings blijven gelijk |
| Marks/defaults/uitlijning/regelhoogte | format | Semantische inhoud en alle bron-/AST-identiteiten exact gelijk |
| Math-bron invoegen/wijzigen/verwijderen | content + math | TeX-whitelist/quotas, geen bronrechten omdat dit presentatienotatie is |
| dynamicValue invoegen/verwijderen/rebinden; bronproperty wijzigen | content + references | Iedere nieuwe/gehouden actieve bron read+display en property in textSourceProperties; type/applicability |
| calculatedValue invoegen/wijzigen/verwijderen | content + expressions; references indien bronnen aanwezig | AST/dimensies/quotas; bronallowlist per source-node; geen AST via format |
| Precisie/unit/weergavemodus/prefix/suffix van bestaand veld | format | Bron/AST gelijk; veilige strings; beschikbare eenheid/dimensie; prefix/suffix geen ongecontroleerde HTML |
| Legacy stylewijziging | Bestaand propertyFields voor werkelijk gewijzigde style.* | textBinding blijft byte-semantisch gelijk; geen automatische rich migratie |
| Legacy→inline migratie T3 | migrateLegacy + content + references + format als marks veranderen | Bronbeleid en volledige legacyvertaling; geen extra rechten door equivalentieclaim |
| Nieuw rich object | allowedTools create:text + categoriegrants uit createdObjectRules | x/y gevalideerd als createpositie; ID toegewezen door model; geen locked/visible/construction in payload |

Verwijderen van een dynamic/calculated atom vereist zijn eigen categorie ook als content is toegestaan: anders kan een leerling een beschermde bron/resultaat omzeilen. Verplaatsen van een bestaand atom met content-recht verandert zijn payload niet. Alle gewone writepaden (`object.create`, setProperties, patchBatch, duplicatie en facade) moeten dezelfde categorieanalyse gebruiken of rich writes afwijzen; geen bypass naast text.commit.

### Concrete toekomstige commandopayloads

Gebruik de bestaande commandenvelope; `expectedDocumentRevision` staat niet óók in payload. Onderstaand rich commit past alleen kleur aan; basisinhoud en binding worden door canonical diff vergeleken.

```json
{
  "schema": 1, "operation": "text.commit", "expectedDocumentRevision": 12,
  "payload": {
    "target": {"kind": "existing", "id": "text-4"},
    "content": {"schema": 1, "defaults": {"fontId": "sans", "fontSize": 16, "color": "#222222"}, "width": null,
      "paragraphs": [{"id": "p1", "align": "left", "lineHeight": 1.25,
        "runs": [{"id": "r1", "kind": "text", "text": "Straal", "marks": {"color": "#cc0000"}}]}]}
  }
}
```

Voor nieuw object vervang target door `{"kind":"new","position":{"x":1,"y":2}}`; geen clientobject-ID, géén positie in existing target. Naam/rotatie/organisatie wijzigen via hun eigen bestaande commando's. Legacy-edit gebruikt een alternatief payloadveld `legacyStylePatch`, bijvoorbeeld `{"target":{"kind":"existing","id":"text-7"},"legacyStylePatch":{"fill":"#cc0000","fontSize":20}}`, wederzijds uitsluitend met content. Alleen aanwezige stylevelden mogen veranderen; bestaande text/textBinding blijven behouden.

T3 bronfragmentvoorbeeld (binnen een schema-3-contentpayload):

```json
{"id":"d1","kind":"dynamicValue","binding":{"sourceId":"circle-2","property":"radius"},
 "format":{"precision":2,"unitMode":"document","prefix":"","suffix":""},"marks":{}}
```

T5c berekend fragmentvoorbeeld (schema-4-content):

```json
{"id":"c1","kind":"calculatedValue","expression":{"schema":1,"ast":
 {"kind":"binary","op":"*","left":{"kind":"constant","name":"pi"},
  "right":{"kind":"binary","op":"^","left":{"kind":"source","sourceId":"circle-2","property":"radius"},
   "right":{"kind":"number","value":2}}}},
 "format":{"mode":"result","precision":2,"unitMode":"document","angleMode":"document"},"marks":{}}
```

Geen clientclaim `changedCategories` vertrouwen. Canonical diff scheidt marks/format van inhoud, source IDs/properties en AST; node-ID-renaming mag niet als opmaak worden geclassificeerd. Quotas en alle keys/types vóór autorisatie; vervolgens server/runtime-eigen bronwaarden gebruiken. Opgeslagen AST mag geen client-inferred dimension of uitkomst bepalen.

### Commit-, conflict- en exportscenario's

1. Alleen format=true: rood maken toegestaan; tegelijk "Straal" naar "Diameter" veranderen geweigerd. Geen gedeeltelijke commit.
2. references=true maar circle-2 heeft read=false, display=false of radius niet in allowlist: invoegen/rebinden geweigerd, generieke fout zonder brongegevens. Source lock blokkeert lezen niet; target lock blokkeert iedere wijziging.
3. expressions=false: wijziging πr²→2πr of verwijderen van calculated atom geweigerd, ook met format/content=true.
4. Draft geopend bij revisie 12, geometrie/document verandert naar 13: OK met 12 geeft STALE_TRANSACTION; gebruiker moet opnieuw laden. Geen automatische rebase. Editor start een runtime begin-handle; epoch hoort bij dat opaque handle, niet bij clientpayload. Policywijziging invalideert handle/previews ook als documentRevision gelijk blijft.
5. Nieuwe rechte bron met read/display maar zonder textSourceProperties: geen inline binding. Bestaande legacy textBinding blijft volgens schema-1 readbeleid werken; geen automatische uitbreiding naar schema-2 grants.
6. Bestaande verborgen auteurbron blijft uitleesbaar. Restricted nieuwe bron vereist effectieve display inclusief laag/objectbeschikbaarheid. Bron geometrisch ongeldig: beschikbaarheidsplaceholder, geen NaN; schema en ID mogen behouden blijven in author document.
7. Restricted renderer/preview/projectie/JSON/SVG verwijdert niet-toegestane brongegevens en vervangt het hele verboden atom door plain "niet beschikbaar". Geen AST/ID/naam/resultaat in fallback, title/desc, errors of cached SVG. Rest van tekst blijft opgemaakt.
8. Restricted JSON na redactie bepaalt opnieuw textSchema/documentversion en bewaart lagen/groepen volgens bestaande closureweigering. Geen origineel v6 met ontbrekend textSchema of onleesbare raw payload exporteren. PNG gebruikt uitsluitend geautoriseerde zelfstandige SVG.
9. Undo/redo via private vertrouwde geschiedenis; policywisseling wist geschiedenis zoals nu. Opnieuw huidige doelrechten/locks/bronrechten controleren vóór restore; een historische AST geeft geen huidige leesgrant. Author replay is geen restricted-authorisatiebewijs.

Commit is atomair: normalize → expectedrevision/handleepoch → doelrechten/locks → diffgrants → bronnen → schema/type/dimension/quotas → candidate/renderpreflight → één geschiedenisactie. Async preview wordt op revisie+epoch+hash weggegooid. Volledige typed inhoud komt niet in de restricted UI als de projectie deze verbiedt. Backend/hostpolicy is de vertrouwensgrens; UI-disabled knoppen zijn alleen feedback.

Aanvullende vereiste codewijziging: `permission-runtime.js:249–252` AuthorCommands gebruikt momenteel steeds revision=0 en een verse context; de restricted runtime heeft wel een echte revision/epoch. Voor T1 krijgt author-editing een persistente revisiecontroller (of expliciet dezelfde transactionservice) die elke documentverandering telt, inclusief import/history/direct facade. Alleen expectedRevision op 0 laten staan voldoet niet aan het conflictcontract. Test author én restricted draft met tussentijdse documentmutatie. Replay bindt aan zijn geïsoleerde kandidaatcontroller en bewaart geen live epoch. Dit is ontwerpwerk, niet nu geïmplementeerd.

## 13. B3 — Verplichte render-/fontproef

Vóór volledige T1-integratie, na afzonderlijke toestemming voor voorbereiding, vergelijk A: SVG-text/tspan met lokale/ingesloten fonts en B: glyphpaden met dezelfde fontbestanden/metrics. Een hybride variant mag als derde kandidaat worden gemeten. Geen keuze voor OpenType.js, fontfamilie of paduitvoer voordat de resultaten zijn gereviewd. Download/installeren en prototypecode behoren niet tot deze documentatieopdracht.

Vaste corpus: Nederlands met accenten en gecombineerd accent (`é`, `e`+combining acute), Grieks αβθΩπ, operatoren ≤≥±×÷, AV/To/Wa/fi, emoji/supplementair codepunt, gemengde fonts en alle vier faces, superscript/subscript, lege alinea, multiline en lange namen. Test 12/16/32 SVG-eenheden, rotatie 0/37/90 graden en zoom 44/100/163/400%. Onondersteunde glyphs moeten expliciet een vaste fallback gebruiken of invoer duidelijk weigeren; geen stille tofu of verdwijnen.

| Aspect | Objectief acceptatiecriterium voor de proef |
|---|---|
| Afmetingen/baseline | Zelfde fixture preview/canvas/export: baseline-afwijking ≤0,5 CSS-px bij 100%; boundsverschil ≤max(1 CSS-px, 1% van fixturebreedte/hoogte). Meet met documentfonts geladen en expliciete transform |
| Kerning/Unicode | Geen verloren codepunten; combining accent boven juiste glyph; AV/To-advance binnen 1% van gekozen fontreferentie; emoji/fallbackbeleid zichtbaar en gedocumenteerd |
| Weergavekwaliteit | Geen clipping/overlap op corpus; screenshots bij alle faces/zooms plus pixelmeting na gelijke rasterisatie: maximaal 1% pixels met kanaalverschil >16 buiten verklaarde antialiasrand |
| Selectie | Volledige tekstbounds omvatten alle zichtbare glyphs/decoration; tekstdrag/rotatie verandert geen inhoud of relatieve baseline |
| Offline SVG/PNG | Zelfstandige SVG opent in Edge met externe netwerkrequests geblokkeerd; rasterisatie zonder tainted canvas of ontbrekende tekst; 0 onverwachte externe assetrequests |
| Toegankelijkheid | Eén logische leesvolgorde, geen dubbel uitgesproken glyphs; zin/Unicode en formulebeschrijving beschikbaar in DOM en SVG-title/desc; handmatige Edge-schermlezercontrole vereist. title/desc alleen is geen vooraf bewezen PASS |
| Bestandsgrootte | Rapporteer raw/gzip SVG voor 1/10/100 tekstobjecten, unieke/herhaalde glyphs en fontassets apart. Voorlopig corpus van 100 objecten (maximaal 200 tekens/object) ≤3 MiB raw zelfstandige SVG; geen onbegrensde fontduplicatie per run |
| Snelheid | Op benoemde referentiemachine: 100-object warm lay-out+render mediaan ≤100 ms, P95 ≤200 ms (20 runs); koude assettijd apart. Geen zichtbare stale tekst na late fonts |
| Onderhoud | Gepinde versies, licenties voor distributie/embedding, reproduceerbare assets, fontfallbackstrategie en vervangbare adapter gedocumenteerd |

De thresholds zijn voorgestelde beoordelingsnormen, geen metingen. Registreer machine/browser/OS, fontversies, meetmethode, verschillen en beperkingen. Het corpus is vast voor A/B. Een kandidaat faalt bij verloren inhoud, lek, ontoegankelijke inhoud of offlinefout ongeacht snelheid. Bij geen kandidaat die alle harde eisen haalt: rapporteer blokkade en alternatief; niet stil een requirement laten vallen. Definitieve render-/fontkeuze pas na akkoord op proefrapport.

## 14. B4 — Verfijnd rekencontract, goedkeuringspoort vóór T5a

Dit contract is een concreet voorstel en moet vóór T5a definitief worden goedgekeurd. Presentatieformules (T2) en berekenbare expressies (T5) zijn verschillende talen; TeX is geen evaluatorinvoer.

### Hoeveelheden en eenheden

Interne dimensie wordt exact bijgehouden als gehele exponenten `(Lphysical, Labstract, A)`. Dit preciseert de eerdere physical/abstract-vlag: producten van fysieke en abstracte lengte worden geweigerd in deze eerste versie; delen van twee lengtes in dezelfde ruimte kan tot dimensieloos reduceren. Een dimensieloze factor kan beide schalen. Lengte en oppervlakte zijn L¹ en L², geen los type zonder exponent. Hoek is A¹, intern radiaal; hoek²/hoekverhoudingen zijn getypeerde samengestelde dimensies.

Unitliteral ondersteunt mm, cm, m, km, deg, rad en abstract `unit` (zichtbare e); suffix cm² e.d. normaliseert naar exponent. `e` zonder unitcontext is de constante exp(1), nooit automatisch abstracte lengteeenheid. JSON bewaart finite numerieke literal plus getypeerde unit/exponent; evaluator converteert bij lezen precies eenmaal. Display maakt geen nieuwe AST.

Voor dynamische lengte q: raw geometry × document scale × metersPerDocumentUnit; oppervlakte: raw × scale² × metersPerUnit²; x/y idem lengte. Legacy zonder meta.measurement: abstracte lengte met scale=1, niet stil cm. AngleMeasurements.value levert graden volgens huidige kleinste/gericht-modus; adapter maakt radiaal, geen herinterpretatie van getekende armen. Unitoverride verandert weergave, nooit hoekgeometrie.

Optellen vereist gelijke exponenten. Dimensionele exponent moet een compile-time constante integer -8..8 zijn; AST-bron als exponent wordt geweigerd, ook als huidige waarde toevallig 2 is. Totale exponenten binnen -8..8; square root halveert alleen even exponenten. Negatieve dimensionloze basis mag slechts integer macht; 0^0 en 0 tot negatieve macht worden geweigerd. Geen rationele dimensies in eerste versie.

Expliciet `round(q;digits;unit)` voor dimensionele q: unit moet dezelfde dimensie hebben. `floor/ceil/trunc(q;unit)` idem. Zonder unit alleen dimensieloos; standaard functie telt argumenten exact. Gewone displayprecisie staat buiten AST. Zo geeft round(1,234 cm;1;cm) 1,2 cm, zonder onverwacht naar hele meters af te ronden.

Trigonometrie: sin/cos/tan accepteert A¹ of dimensieloos; A¹ altijd intern rad, dimensieloos gebruikt angleMode/documentkeuze op evaluatietijdstip. asin/acos/atan vereist dimensieloos en levert A¹. `sin(30 deg)` blijft 0,5 bij elke documenthoekkeuze; `sin(30)` verandert bij wissel van graden naar rad. ln/log10/exp vereisen dimensieloos; abs houdt dimensie. Samengestelde output drukt exponenten expliciet uit (`cm⁻¹`, `cm·rad`, `rad²`), geen oppervlakte-eenheid voor een dimensieloze verhouding.

### UI-invoer, AST en weergave

De UI mag alleen ondubbelzinnige adjacency expanderen naar expliciete `*`: `2π`, `2(3+4)`, `(2+3)(4+5)`, getal gevolgd door bronchips, π gevolgd door bronchip. Een getal met erkende unitsuffix is één quantityliteral, géén product. Functienaam + haakje is call. Onbekende identifiers, `sin 30`, twee losse getallen (`2 3`) en vrije bronnaam `r(C)` worden geweigerd; kies eerst de typed bronchip. Laat de genormaliseerde expressie vóór bevestiging zien. Decimalekomma en argumentpuntkomma worden alleen door tokenizer genormaliseerd; geen regexvervanging van willekeurige namen.

AST-normalisatie: whitelist keys/types, canonical operators/constants/units, verwijder syntaxhaakjes maar behoud boomstructuur, finite literal/-0→0, deterministische local IDs voor editoratomen. Geen commutatieve herschikking, constantevouwing over bronwaarden of algebraïsche vereenvoudiging: binary64-volgorde en bronidentiteit blijven behouden. Parse(print(AST)) moet dezelfde canonical AST opleveren. Getaluitvoer in canonical invoer moet roundtrip-precisie hebben; displayafronding wordt nooit opnieuw ingevoerd als waarheid.

Formuleprinter gebruikt precedentie en noodzakelijke haakjes. Symbolische source-node toont veilige actuele naam en property, met onderscheid bij dubbele namen; rekent altijd op ID. Substitutiemodus toont quantities in compatibele gekozen units met haakjes, inclusief negatieve waarden en machten. Precision is display-only; toon `≈` wanneer een berekend/substitueerd getal afgerond is. Een optioneel label `A` is presentatie, geen assignmentnode. Ontbrekende bron geeft het hele resultaat unavailable, nooit nul.

| Invoer/scenario | Verwacht resultaat/gedrag |
|---|---|
| 2 cm + 30 mm | 5 cm, gelijke dimensie na unitconversie |
| 2 cm * 3 cm; 6 cm² / 2 cm | 6 cm²; 3 cm |
| 2 cm + 3 cm² | DIMENSION_MISMATCH |
| 2 unit + 3 cm; 2 unit * 3 cm | UNIT_SPACE_MISMATCH; geen automatische kalibratie |
| 2 cm / 4 cm | 0,5 dimensieloos |
| sqrt(9 cm²); sqrt(4 cm) | 3 cm; NON_INTEGER_DIMENSION |
| (2 cm)^2; (2 cm)^0,5; (2 cm)^[x(P)] | 4 cm²; INVALID_DIMENSION_POWER; niet-constante exponent geweigerd |
| -2^2; 2^3^2; 2^-2 | -4; 512; 0,25 |
| sqrt(-1); ln(0); asin(1,01); 1/0; 0^0 | Afzonderlijke domein-/deling-/machtfout, geen NaN/Infinity |
| 1/(1e-14) | Finite 1e14; kleine noemer niet stil als nul behandelen |
| exp(1000) | NON_FINITE_RESULT |
| tan(90 deg) | SINGULARITY bij expliciete |cos|≤1e-12; nabijgrens testen |
| asin(1) | π/2 rad of 90°; input >1 niet ruim clampen |
| sin(30 deg); asin(0,5) | 0,5; π/6 rad of 30° |
| Dynamic angle met value 90° en display rad | Adapter π/2; sin(bron)=1, geen tweede conversie |
| πr², raw r=2, scale=1 cm | ≈12,57 cm²; raw r=3 → ≈28,27 cm² |
| Zelfde geometrie, scale=2 cm | r=4 cm → ≈50,27 cm²; scale slechts één keer toegepast |
| 0,1+0,2 | Binary64-resultaat, display 0,3; geen exact-decimaalclaim |
| 2π; 2(3+4); 2 3 | UI toont 2*π; 2*(3+4); laatste geweigerd |
| Bron verwijderd of read ingetrokken | unavailable/redactie; geen gecachte formulewaarde |

Precision 0–10; format van negatieve afgeronde nul als 0. Numerieke nabijheidsvergelijkingen alleen in tests/singulariteitsbeleid, geen generieke epsilon die alle inputs wijzigt. T5a-acceptatie moet tolerantiegrenzen, overflow/underflow en platformdeterminisme binnen binary64 expliciet bewijzen. Exacte algemene algebra/equivalentie is buiten scope.

## 15. B5 — Afgebakende ProseMirror-proef

Gebruik een geïsoleerde demo met één eigen textContent-adapter, geen Engine/runtime-productieintegratie en geen opgeslagen ProseMirror-JSON. Fake math/dynamic/calculated atomen volstaan; geen echte brongegevens of calculator. Dependenties pas na expliciete goedkeuring van de voorbereidingsstap. Dit is een selectieproef, geen T1-implementatie.

| Proef | Acceptatie |
|---|---|
| Fragmentselectie | Voorwaarts/achterwaarts over twee alinea's; marks uitsluitend op geselecteerde codepunten; toolbar behoudt bookmark |
| Cursor | Arrow/Home/End, Shift-selectie, delete/backspace naast atom en Unicode/combining input; geen vastgelopen caret of verdwenen atom |
| Inlineatomen | Eén selecteerbaar/verplaatsbaar/verwijderbaar geheel; attribuutwijziging heropent editor; gewone input wijzigt niet ongemerkt bron-ID/AST |
| IME | Echte compositie in Edge met beschikbare OS-IME, compositionstart/update/end plus undo; geen dubbele tekens of splitsen actieve compositie. Synthetische events alleen zijn onvoldoende bewijs; ontbrekende echte IME blijft open gate |
| Plakken | Plain text, multiline en rich HTML; alleen toegestane marks naar eigen model; scripts/links/styles/URLs niet opgeslagen; quotas gecontroleerd |
| Lokale history | Typen/opmaak/plakken undo/redo in draft; Cancel laat originele bytes gelijk; één gesimuleerd OK levert één hostactie; globale shortcuts niet tegelijkertijd afgevuurd |
| Fullscreen/dialog | Focus/bookmarks bij toolbar/palet, Escape sluit kindpaneel/dialog maar geen fullscreen; responsive 390/760/1159 px zonder onbereikbare bediening |
| Onafhankelijke opslag | Eigen JSON→adapter→eigen JSON canonical gelijk voor alle fixtures; onbekende PM-attributen worden niet gepersist; eigen JSON blijft bruikbaar zonder PM-runtime |
| Omvang/onderhoud | Exact modules/versies/licenties/build raw/gzip en API-adapter beschreven; voorlopig editorbudget 250 KiB gzip; geen runtime-CDN |

Alle functionele/security/roundtripchecks zijn harde criteria. Elke case apart pass/fail/not executed; geen brede PASS zonder IME/accessibilitybewijs. Als hard criterium faalt: herstel en opnieuw testen, of vergelijk een alternatief tegen exact dezelfde corpusmatrix. Eigen contenteditable is ook aan deze eisen gebonden. Keuze en eventuele budgetafwijking expliciet voorleggen, niet automatisch fallback implementeren.

## 16. B6 — Legacy dynamische tekst per milestone

| Stap | Openen/bewerken | OK/opslag | Annuleren |
|---|---|---|---|
| T1 | Binding als onveranderbare preview; bestaande broninspector blijft. Dialog kan objectbrede legacy styles aanpassen; fragmentopmaak op de binding is nog niet beschikbaar | legacyStylePatch verandert uitsluitend toegestane stylevelden; exact dezelfde textBinding en statische `.text`; geen textContent/v6 door alleen format | Geen inhoud/style/schema/historywijziging |
| T2 | Zelfde beleid. Formule-invoegen in legacygebonden tekst wordt niet aangeboden; bestaande gewone/rich tekst ondersteunt math | Geen impliciet afvlakken om een formule toe te voegen. Alleen legacy styles of expliciet bestaande bindinginspector | Zelfde nulwijzigingsgarantie |
| T3 | Expliciete actie "Omzetten naar inline dynamische tekst"; eerst rechten en bronstatus controleren, dan draft prefix/dynamic/suffix | Eén commit: prefix/suffix als text-runs; binding atom behoudt sourceId/property/precision; leeg prefix/suffix niet als lege run nodig; unitMode=document. Alle runs erven legacy font/fill en alinea anchor links/midden/rechts; positie/rotatie exact gelijk | Houd oorspronkelijke legacyrepresentatie intact |

Bij T3-omzetting bewaar originele `.text` als getypeerde objectmetadata `legacyStaticText` (string met dezelfde limiet als legacytext), niet als zichtbare rijke run. Het is alleen de statische terugval bij expliciete ontkoppeling, nooit een cache van een dynamische waarde. Stijl wordt in rich defaults/marks overgenomen; geen dubbele actieve textBinding. Validator behandelt legacyStaticText als bekende optionele text-objectkey en restricted projectie controleert hem. Undo herstelt oorspronkelijke volledige binding/style; redo de rijke variant. Fallback uit `.text` voor rich rendering blijft safe en afgeleid; deze twee rollen mogen niet dezelfde key gebruiken.

Een format-only gebruiker zonder migratiegrant mag legacy styles wijzigen maar niet omzetten. In author kan ontbrekende bron als unavailable worden gemigreerd met behoud van ID; restricted omzetting wordt geweigerd bij ontbrekende read/display/propertygrant. Weigering blokkeert geen legacy display die volgens oud contract toegestaan is. Bindinginspector blijft in T1/T2 dezelfde readvalidatie gebruiken; geen stil nieuw displayrecht daarop toepassen.

Verplichte fixtures per T1/T2/T3: gebonden tekst met prefix/suffix, null/0/10 precision, eigen font/fill/rotation, ontbrekende bron en verborgen/locked bron. Voor elke fixture: openen, Cancel, format OK, save/reload, duplicate tekst alleen en samen met bron, undo/redo en restricted. Bewijs binding-equality vóór/na format OK in T1/T2; bij T3 vergelijking van vertaalde payload/formatteruitkomst vóór/na bronbeweging en unitwijziging. Test ook geen extra source-ID na redactie en geen verloren legacyStaticText bij author roundtrip.

## 17. B7 — Opslag/export als gate bij introductie

| Checkpoint | Nieuwe inhoud | Verplicht vóór acceptatie |
|---|---|---|
| T1 | text/hardBreak/marks/paragraphs | JSON+draftherladen, SVG rich en legacy, SVG→PNG-rasterfixture, restricted JSON/SVG, undo/replay; fonts offline |
| T2 | math | JSON/formuleheropenen, zelfstandige sanitized SVG, PNG-rasterfixture met fraction/root/Unicode/baseline, restricted/legacyregressie |
| T3 | dynamicValue | JSON behoudt IDs/formats, export actuele geautoriseerde snapshot, missing/denied bron redactie, PNG van gemengde tekst, source remap en unitupdates |
| T4 | Wrap/layout en productie-PNG | Alle eerdere paden plus echte exportbediening, sizing/memory/readiness, accessibility en offline audit |
| T5a | AST als rekenkernwaarde, nog geen documentfragment | AST encode/decode/print roundtrip, quotas/typefixtures; bestaande JSON/SVG/rasterregressies |
| T5b | Private calculator draft | Draft serialize/restore voor proef indien aangeboden, Cancel nul documentwijzigingen; geen inline saveclaim; bestaande export ongewijzigd |
| T5c | calculatedValue | AST+bronnen+3 modes JSON roundtrip, zelfstandige SVG/PNG-rastering, restricted redactie, actuele/ontbrekende bron, history/replay |
| T5d | Audit | Volledige matrix; geen eerste ontdekplek voor exportondersteuning van een eerder type |

Productie-PNG-bediening mag T4 blijven; werkende offline SVG-rastering is al T1 en bij elk nieuw fragmenttype vereist. Exportfout is blokkerend voor die milestone. Onafhankelijke herimport van author JSON én restricted JSON moet geldig zijn; export van onvolledige organisatieclosure mag conform bestaand beleid vooraf geweigerd worden, nooit corrupt JSON teruggeven.

## 18. Besluiten en beperkte voorbereiding

Vaste randvoorwaarden uit de opdracht: alleen documentatie nu; geen T1/dependencyinstallatie; onafhankelijke typed opslag, geen uitvoerbare HTML/JS; behoud legacybindings; één OK/nul Cancel; author/restrictedvertrouwensgrens; opslag/export vanaf eerste fragment; afzonderlijke acceptatiepoorten en ontwikkelbranch.

Uitgewerkte ontwerpbesluiten in dit voorstel (nog onder architectuurgoedkeuring): expliciete v1–v6-dispatch; aparte tekst- en policyschema's; categoriegrants/canonical diff; T1/T2-legacy format zonder migratie; T3 expliciete omzetting; UI→expliciete AST-operators; SI/radiaaladapter. Het rekencontract vraagt bovendien een aparte definitieve goedkeuring vóór T5a.

Nog open: SVG-text/glyph/hybride, concrete fonts/shapingdekking/licenties, editorbibliotheek en gepinde modules, formulebibliotheek, gemeten bundel-/performancebudgetten. Er zijn geen proefresultaten; bestaande Node/Edge-baseline bewijst geen van deze nieuwe keuzes.

Voorgestelde volgende stap **P0-tech**, alleen na expliciete toestemming: geïsoleerde ProseMirror- en font/renderproeven onder `experiments/text-editor-preflight/`, met lokale tijdelijke/gepinde proefdependencies en fixtures. Geen productie-integratie, modelwijziging of T1-feature. Resultaat `TEXT-EDITOR-PREFLIGHT-REPORT.md` bevat meetdata, pass/fail/not executed per criterium en onderbouwde keuzes. Rapport eerst voorleggen; pas na acceptatie en expliciet T1-akkoord volledig integreren. Formulebibliotheekproef volgt apart vóór T2; rekencontractreview vóór T5a.
