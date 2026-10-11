# Geavanceerde teksteditor — architectuur T1–T5

Versie 1.0.0 — 2026-10-11 — **voorstel, fase 0**.

Repository: Geert1985/wiskundige-illustratie-editor. Branch: `chatgpt/editor-development`. Onderzochte baseline: `64ba1a29213a448df75e579fc9fb414667a31bee`.

Dit document beschrijft toekomstige implementatie, geen reeds geleverde functionaliteit. De masteropdracht vereist expliciete goedkeuring na fase 0 en na iedere milestone, inclusief T5a–d. T1 is niet gestart. Zie [implementatieplan](TEXT-EDITOR-IMPLEMENTATION-PLAN.md).

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
| Formaten (`model.js`, `DOCUMENT-FORMAT.md`) | Writer kiest v2, v3 bij constructies, v4 bij groepen, v5 bij lagen. Constructieschema 1–4 is onafhankelijk. Import valideert eerst en Engine doet renderer-preflight. Geen rich-textschema. |
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

Voorgestelde offline strategie: kleine lokale, gelicentieerde fontallowlist met reguliere/vette/cursieve varianten en Griekse dekking. Rich-text-export gebruikt glyphpaden met gedeelde fontmetrics; dit vermijdt ontbrekende geïnstalleerde fonts. JSON behoudt bewerkbare tekst; SVG krijgt title/desc voor toegankelijke tekst. Keerzijde: geëxporteerde glyphpaden zijn niet als gewone SVG-tekst bewerkbaar. Deze keuze vraagt goedkeuring en een T1-proef met kerning, scripts en licenties. Complexe wereldwijde schriftvorming wordt niet zonder bewijs geclaimd. Legacy SVG-tekst behoudt zijn bestaande pad.

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

Machten zijn rechtsassociatief; -2^2 = -4 en 2^-2 is geldig. UI normaliseert decimale komma; argumenten gebruiken puntkomma in Nederlandse invoer. Vermenigvuldiging is expliciet, ook na symboolinvoer. Bronchips worden getypeerde tokens, nooit door naamherkenning gelezen.

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
| ProseMirror | Voorkeur voor uitsluitend de invoeradapter: schema en transacties passen bij fragmenten/atomen. Persistente inhoud blijft ons eigen model. Lokale reproduceerbare bundle nodig. |
| KaTeX | HTML/MathML-uitvoer en trustinstellingen zijn bruikbaar, maar extra conversie nodig voor onze SVG-first renderer. |
| MathJax SVG | Voorkeur voor T2: SVG-glyphuitvoer past rechtstreeks. Async fontdata en omvang vragen readiness, lokale assets en meting. |
| OpenType.js | Kandidaat voor fontmetrics/glyphpaden; licenties, kerning en schriftdekking eerst bewijzen. Geen claim van volledige complexe shaping. |
| Eigen expressie-engine | Kleine expliciete grammatica met eigen dimensies voorkomt onnodige generieke programmeermogelijkheden. Meer eigen wiskundige tests vereist. |

Primaire bronnen: [ProseMirror guide](https://prosemirror.net/docs/guide/), [KaTeX opties](https://katex.org/docs/options), [KaTeX veiligheid](https://katex.org/docs/security), [MathJax SVG](https://docs.mathjax.org/en/v4.0/options/output/svg.html), [MathJax async typesetting](https://docs.mathjax.org/en/latest/web/typeset.html), [OpenType.js](https://github.com/opentypejs/opentype.js). De keuze voor MathJax is een architectuurafweging, geen gemeten performancevoordeel. MathJax local fontCache ondersteunt lokale glyphreferenties; dat vervangt geen applicatiesanitizer.

T1/T2-spikes moeten exacte gepinde versies, gzip/raw code- en fontomvang, licenties, cold/warm render en offline export meten. Voorlopige budgetten ter bespreking: editorcode 250 KiB gzip exclusief fonts, formulecode/data 2 MiB, fonts 3 MiB. Overschrijding vraagt onderbouwde herkeuze; deze getallen zijn geen testresultaten. Assets lokaal en lazy-loaded, geen runtime-CDN.

## 9. Teststrategie en risico's

Iedere milestone: gerichte Node-tests, volledige bestaande Node-suite, relevante echte Edge-tests plus volledige regressierun, visuele controle, JSON/SVG en undo/replay. Vermeld exacte aantallen en onderscheid één browsersuite van haar modules/checks.

Nieuwe regressies dekken schema/malformed input, legacyv1–5 en v6, groepen/lagen, bronduplicatie, locks/grants, restricted redactie, één OK/zero Cancel, revisieconflicten en semantische replay. T5 voegt precedence, dimensies, conversies, domeinen, quotas en parser-print-parser-roundtrip toe.

Edge: echte fragmentselectie, sneltoetsen, IME/plakken, caret rond atomen, fullscreen/Escape, modal focus, responsive 390/760/1159/1446 px, late async-resultaten en ingetrokken rechten. Visueel: alle fontfaces, 12/16/32 pt-equivalent, Grieks, super/sub, lege regels, breuken/wortels, rotatie, zoom en veranderende dynamische breedte. Zelfstandige SVG/PNG testen met netwerk geblokkeerd. Belastingsmetingen met 10/100/500 objecten en 1/10/100 velden; thresholds pas na baseline vastleggen.

Belangrijkste risico's: fontshaping en exportgelijkheid; libraryomvang; async races; bronlekken via caches/fallbacks; onjuiste dubbele schaal/hoekconversie; v6-compatibiliteit met oude readers; IME/selectiecomplexiteit. Securityfixtures omvatten HTML/SVG/TeX-injectie, diepe AST, prototype-invoer en veranderende permissies.

Goed te keuren keuzes: ProseMirror-adapter met lokale build; lokale beperkte fonts en glyphpaden voor portable rich SVG; MathJax als te toetsen T2-kandidaat; v6 met expliciete migratie; expliciete afbrekingen in T1 en automatische wrapping in T4; conservatieve read+display-regel voor nieuwe restricted velden; reële binary64-rekenkern zonder CAS.

## 10. Fase-0-verificatie

Op de ongewijzigde runtimebaseline uitgevoerd: `node --test tests/*.test.cjs`: **364 geslaagd, 0 mislukt, 0 overgeslagen**. `node tests/browser.cjs`: **1 volledige Edge-suite geslaagd**, exitcode 0. De suite rapporteert named checks, geen uniform aantal individuele tests; aantallen niet kunstmatig optellen. Logs zijn lokaal opgeslagen als text-editor-phase0-node.txt en text-editor-phase0-edge.json.

Geen T1–T5-featuretests uitgevoerd: de features zijn nog niet geïmplementeerd. Fase 0 wijzigt uitsluitend documentatie. Rapporten T1-REPORT t/m T5d-REPORT worden pas na uitvoering van het betreffende checkpoint aangemaakt.
