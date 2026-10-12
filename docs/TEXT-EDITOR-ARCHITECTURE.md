# Geavanceerde teksteditor — architectuur T1–T5

Versie 1.12.0 - 2026-10-12 - Verduidelijking rekencontract: hoekdimensies, afronding en underflow. Voorstel wacht op definitieve goedkeuring; T5a niet gestart.

Repository: Geert1985/wiskundige-illustratie-editor. Branch: `chatgpt/editor-development`. Onderzochte baseline: `64ba1a29213a448df75e579fc9fb414667a31bee`.

Sectie 1 bewaart de historische inventaris van fase 0. Secties 19-21 beschrijven de geleverde T1-T3-implementatie en zijn leidend voor hun actuele status. Sectie 23 beschrijft T4; sectie 24 legt T5-prep als ontwerp/prototype vast; T5a–T5d blijven afzonderlijke rekenmilestones. De gebruiker gaf expliciete T2-starttoestemming; eerdere handmatige T1-controles zijn daarmee niet als uitgevoerd gemarkeerd. Zie [implementatieplan](TEXT-EDITOR-IMPLEMENTATION-PLAN.md).

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

Oud voorstel: document v6 zodra rich text aanwezig is, met afzonderlijke tekstschemaversie; dit is door T1-amendement sectie 19 bijgewerkt naar v7. Tekstschema 1=T1, 2=T2, 3=T3, 4=T5c. Onbekende toekomstige fragmenten worden vóór mutatie afgewezen. Constructieschema's blijven onafhankelijk. Vervang exacte versievergelijkingen voor lagen door feature-/minimumversiechecks.

Ongewijzigde legacydocumenten blijven v1–5 lezen en hun bestaande writerpad gebruiken. Statische tekst wordt pas bij bevestigen van een bewerking naar textContent omgezet. Annuleren migreert niets. T1 behoudt bestaande dynamische bindings en hun inspector; gebonden inhoud wordt niet tot statische tekst afgevlakt. T3 kan die binding bij een bevestigde bewerking omzetten naar prefix + dynamicValue + suffix; bewaar de bestaande statische terugval voor expliciet ontkoppelen. textBinding en textContent zijn wederzijds uitsluitend.

Constructietekst voor oppervlakte/omtrek blijft receptgestuurd; vrij bewerken vraagt eerst bewust losmaken. Ontbrekende bron-IDs blijven in auteursdocumenten bewaard zodat undo herstel mogelijk maakt. Duplicatie van alleen tekst behoudt bron-IDs; duplicatie met bronnen remapt uitsluitend meegekopieerde IDs. Import, duplicatie, exportprojectie en replay krijgen dezelfde validator. Oude applicatieversies mogen v7 afwijzen; stil verlies van opmaak is geen downgradebeleid.

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
| expression-engine.js | UI-onafhankelijke parser, AST, dimensies, eenheden en evaluator (T5a) |
| calculator-source-adapter.js (voorgesteld) | Gedeelde geautoriseerde geometrie-quantitysnapshot voor beide calculatormodi en calculatedValue |
| text-calculator.js (voorgesteld) | Eén herbruikbare interface met zelfstandige en inline hostadapter (T5b/T5c); geen eigen evaluator |
| export-service.js | Expliciete assetvoorbereiding, zelfstandige SVG en PNG |

Pipeline: geautoriseerde snapshot → waarden oplossen → lay-out → SVG. De bestaande synchrone Engine.renderSVG blijft beschikbaar voor legacy en voorbereide assets. Een expliciete asynchrone voorbereidings-/exportlaag wacht op fonts/formules; geen impliciete wijziging naar Promise. Resultaten van oude async-taken worden verworpen op documentrevisie, inhoudshash en permission epoch.

Voorstel één getypeerde `text.commit`-actie voor maken/bewerken. Payload bevat doel (nieuw/bestaand), inhoud en verwachte revisie. AuthorCommands, restricted runtime en semantic replay valideren deze centraal. Autorisatie vergelijkt wijzigingen per categorie: inhoud, opmaak en bronnen. Geen algemene vrijbrief voor een complete AST via bestaande stijlgrants.

De teksteditor- en inline-dialog bewerken uitsluitend een private draft. De zelfstandige calculator heeft uitsluitend sessiestaat zonder documentcommit (sectie 22). Lokale undo/redo tijdens typen verandert documentgeschiedenis niet. OK levert één atomaire documentactie; Annuleren nul. Controleer bij OK opnieuw bronrechten, locks, bestaan en revisie. Bij conflict niet stil overschrijven. Native Escape sluit eerst een kindpaneel, dan de dialog; fullscreen blijft actief. Import/dispose en gewijzigde selectie mogen geen stale draft bevestigen.

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

Interne quantity: eindige binary64-waarde, dimensie-exponenten voor lengte en hoek, en physical/abstract-eenheidsruimte. Fysieke basis is meter/radiaal. Abstracte u kan zonder kalibratie niet bij fysieke lengte worden opgeteld. Dimensieloze waarden zijn neutraal.

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

Belangrijkste risico's: fontshaping en exportgelijkheid; libraryomvang; async races; bronlekken via caches/fallbacks; onjuiste dubbele schaal/hoekconversie; v7-compatibiliteit met oude readers; IME/selectiecomplexiteit. Securityfixtures omvatten HTML/SVG/TeX-injectie, diepe AST, prototype-invoer en veranderende permissies.

Besluitstatus en goedkeuringspoorten staan in sectie 18. ProseMirror, fonttechniek en formulebibliotheek zijn geen definitieve keuzes. Het verfijnde rekencontract moet vóór T5a afzonderlijk definitief worden goedgekeurd.

## 10. Fase-0-verificatie

Op de ongewijzigde runtimebaseline uitgevoerd: `node --test tests/*.test.cjs`: **364 geslaagd, 0 mislukt, 0 overgeslagen**. `node tests/browser.cjs`: **1 volledige Edge-suite geslaagd**, exitcode 0. De suite rapporteert named checks, geen uniform aantal individuele tests; aantallen niet kunstmatig optellen. Logs zijn lokaal opgeslagen als text-editor-phase0-node.txt en text-editor-phase0-edge.json.

Geen T1–T5-featuretests uitgevoerd: de features zijn nog niet geïmplementeerd. Fase 0 wijzigt uitsluitend documentatie. Rapporten T1-REPORT t/m T5d-REPORT worden pas na uitvoering van het betreffende checkpoint aangemaakt.

## 11. B1 - Compatibiliteits- en migratiematrix

Het goedgekeurde voorstel v1.1.0 wees versie 6 toe aan rijke tekst. Die versie was al in gebruik voor verdeling van cirkelpunten. Daarom gebruikt T1 documentversie 7 voor rijke tekst en blijft v6 ongewijzigd. Deze correctie vervangt eerdere verwijzingen die rich text aan v6 koppelen.

De interne MODEL_VERSION blijft 2 en is niet de maximale reader-versie. De writer kiest de minimale featureversie: v2 basis, v3 constructies, v4 groepen, v5 lagen, v6 cirkelpuntenverdelingen, v7 rijke tekst. Rijke tekst krijgt voorrang, met behoud van alle aanwezige featureschema's.

| Invoer | Lezen en valideren | Schrijven zonder/met rijke tekst |
|---|---|---|
| v1 of ontbrekend | Legacy objectformaat; bestaande eenmalige label-naar-name-migratie. Geen tekstmigratie bij openen. | Bestaande minimale featureversie / v7 pas na expliciete rich-tekstbewerking. |
| v2 | Basisgeometrie; onbekende root-extensies blijven opaque. | v2 of v3-v6 als bestaande features dat vereisen / v7. |
| v3 | constructionSchema 1-4 valideren voor recepten en as-/hoekreferenties. | v3 wanneer constructies dat vereisen / v7. |
| v4 | groupSchema 1 en groups valideren; recepten behouden. | v4 wanneer groepen dat vereisen / v7. |
| v5 | layerSchema 1 en layers valideren; groepen indien aanwezig valideren. | v5 wanneer lagen dat vereisen / v7. |
| v6 | circleDistributionSchema 1 en een geldige niet-lege verdeling vereisen; leden en constructies wederzijds controleren. Groepen/lagen blijven geldig. | v6 zolang verdelingen dat vereisen / v7. |
| v7 | textSchema 1 en ten minste een geldig textContent-object vereisen; aanwezige constructies, verdelingen, groepen en lagen valideren voor commit. | v7 zodra rijke tekst aanwezig is. |

T1 ondersteunt alleen root textSchema 1. textContent is verboden in v1-v6; onbekende hogere tekstschema's worden geweigerd. Onbekende rijke inhoud wordt nooit stil teruggebracht tot platte tekst. Readers ouder dan v7 moeten het document weigeren in plaats van opmaak weg te laten.

Een v7-document mag rijke tekst combineren met de v6-cirkelpuntenverdeling en de v3-v5 schema's voor constructies, groepen en lagen. Een conflict tussen een gereserveerde root-key en een opaque legacy-extensie blokkeert de upgrade voordat er iets verandert. Een mislukte load/import behoudt model, renderer, selectie en geschiedenis. Bestaande textBinding blijft exact gelijk; T1 migreert of opent zulke teksten niet automatisch in de rich editor.

### Versiecontroles en regressies

- model.js houdt interne MODEL_VERSION apart; de writer kiest v7 voor textContent en importeert expliciet v1-v7. Test onbekende/fractionele versies, ontbrekend/verkeerd textSchema, rich text in v1-v6, gemengde v6-verdeling plus v7-tekst en atomaire fouten.
- model.js behoudt afzonderlijke validatie van constructionSchema, groupSchema, layerSchema en circleDistributionSchema in v7. Test groepen, lagen en verdelingen samen met rijke tekst, plus conflicten met gereserveerde extensies.
- Engine.load, JSON-import, lokale draft, geschiedenis en semantische replay gebruiken dezelfde loader en zijn atomair.
- Restricted JSON-export bepaalt de versie opnieuw op basis van de geprojecteerde leesbare objecten. Een projectie met rijke tekst gebruikt v7/textSchema 1, neemt alleen geldige toegestane groepen/lagen/verdelingen mee en weigert onvolledige bronrelaties. Restricted SVG embedt lokale fonts alleen als rich text aanwezig is.
- Policy- en commandoversies staan los van documentversies; semantische sequence blijft artifact version 1. text.commit wordt als een enkele bewerking opnieuw afgespeeld.

Regressiepoort: v1-v7-fixtures door model, Engine, import, draft, geschiedenis, author/restricted JSON en SVG, replay en legacy statische/dynamische tekst. Iedere geweigerde import behoudt de bestaande status. Export moet opnieuw importeerbaar zijn of vooraf worden geweigerd.

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
8. Restricted JSON na redactie bepaalt opnieuw textSchema/documentversion en bewaart lagen/groepen volgens bestaande closureweigering. Geen origineel v7 met ontbrekend textSchema of onleesbare raw payload exporteren. PNG gebruikt uitsluitend geautoriseerde zelfstandige SVG.
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

Dit contract is inhoudelijk voorwaardelijk goedgekeurd. De drie verduidelijkingen hieronder en de [aanvullende acceptatiespecificatie](T5A-NUMERIC-ACCEPTANCE.md) zijn voorstellen die nog definitieve gebruikersgoedkeuring vragen. Deze documentatie op `chatgpt/t5-calculator` start T5a niet en wijzigt geen overige roadmapvoorwaarden. Presentatieformules (T2) en berekenbare expressies (T5) zijn verschillende talen; TeX is geen evaluatorinvoer.

### Hoeveelheden en eenheden

Interne dimensie wordt exact bijgehouden als gehele exponenten `(Lphysical, Labstract, A)`. Dit preciseert de eerdere physical/abstract-vlag: producten van fysieke en abstracte lengte worden geweigerd in deze eerste versie; delen van twee lengtes in dezelfde ruimte kan tot dimensieloos reduceren. Een dimensieloze factor kan beide schalen. Lengte en oppervlakte zijn L¹ en L², geen los type zonder exponent. Een zuivere hoek heeft dimensie `(0,0,1)` = A¹, intern radiaal. Hoekproducten hebben opgetelde exponenten; een verhouding van twee zuivere hoeken heeft A⁰ en is dimensieloos, geen samengestelde hoekdimensie.

Unitliteral ondersteunt mm, cm, m, km, deg, rad en abstract `unit` (zichtbare u; geen wijziging aan oudere eenheidsmetadata); suffix cm² e.d. normaliseert naar exponent. `e` zonder unitcontext is de constante exp(1), nooit automatisch abstracte lengteeenheid. JSON bewaart finite numerieke literal plus getypeerde unit/exponent; evaluator converteert bij lezen precies eenmaal. Display maakt geen nieuwe AST.

Voor dynamische lengte q: raw geometry × document scale × metersPerDocumentUnit; oppervlakte: raw × scale² × metersPerUnit²; x/y idem lengte. Legacy zonder meta.measurement: abstracte lengte met scale=1, niet stil cm. AngleMeasurements.value levert graden volgens huidige kleinste/gericht-modus; adapter maakt radiaal, geen herinterpretatie van getekende armen. Unitoverride verandert weergave, nooit hoekgeometrie.

Optellen vereist gelijke exponenten. Dimensionele exponent moet een compile-time constante integer -8..8 zijn; AST-bron als exponent wordt geweigerd, ook als huidige waarde toevallig 2 is. Totale exponenten binnen -8..8; square root halveert alleen even exponenten. Negatieve dimensionloze basis mag slechts integer macht; 0^0 en 0 tot negatieve macht worden geweigerd. Geen rationele dimensies in eerste versie.

Expliciet `round(q;digits;unit)` voor dimensionele q: unit moet dezelfde dimensie hebben. `floor/ceil/trunc(q;unit)` idem. Zonder unit alleen dimensieloos; standaard functie telt argumenten exact. Gewone displayprecisie staat buiten AST. Zo geeft round(1,234 cm;1;cm) 1,2 cm, zonder onverwacht naar hele meters af te ronden.

Trigonometrie: sin/cos/tan accepteert A¹ of dimensieloos; A¹ altijd intern rad, dimensieloos gebruikt angleMode/documentkeuze op evaluatietijdstip. asin/acos/atan vereist dimensieloos en levert A¹. `sin(30 deg)` blijft 0,5 bij elke documenthoekkeuze; `sin(30)` verandert bij wissel van graden naar rad. ln/log10/exp vereisen dimensieloos; abs houdt dimensie. Samengestelde output drukt exponenten expliciet uit (`cm⁻¹`, `cm·rad`, `rad²`), geen oppervlakte-eenheid voor een dimensieloze verhouding.

### 14.1 Hoekdimensie, graden en verhoudingen — verduidelijkingsvoorstel

`A` is een semantische dimensie van deze engine: radiaal wordt hier niet stil met dimensieloos vereenzelvigd. `rad` en `deg` zijn eenheden van hetzelfde A¹-type; `1 deg` wordt eenmaal omgerekend met de binary64-factor `π/180`, `1 rad` met factor 1. De constante `pi`/`π` blijft dimensieloos; `π * 1 rad` is een hoek. Dat onderscheid beschermt dimensiecontrole en de bestaande documenthoekkeuze. Geen nieuwe hoeksoort of wijziging van de geometrische hoekmeting.

Alleen dimensies `(0,0,0)` en `(0,0,1)` zijn geldig als invoer voor sin/cos/tan. Lengte, A², A⁻¹ en lengte·hoek worden geweigerd met `DIMENSION_MISMATCH`. A¹ wordt direct als radiaal geëvalueerd; dimensieloos volgt de expliciete evaluatoroptie `angleMode` (graden/radialen), door de host uit de documentkeuze resolved. Die optie verandert geen quantity/AST en voegt geen blijvende hoekdimensie toe. Een ratio bewaart geen verborgen graden-/radialenlabel. `sin((90 deg)/(1 deg))` betekent daarom sin(90) en volgt angleMode; `sin((90 deg)/(1 rad))` betekent sin(ongeveer π/2) en volgt eveneens angleMode. Voor een expliciet getypeerde radiaalhoek gebruik `(ratio) * 1 rad`.

Optellen van hoek en dimensieloos, ook nul, is ongeldig; hoek + hoek converteert naar dezelfde radiaalbasis. Vermenigvuldigen/delen gebruikt de gewone exponentregels: hoek/hoek → dimensieloos; hoek/getal → A¹; getal/hoek → A⁻¹; hoek*hoek → A². Uitvoer kiest graden/radialen uitsluitend voor het hoekdeel, met de juiste macht van de conversiefactor: rad² → deg² gebruikt `(180/π)^2`, rad⁻¹ → deg⁻¹ gebruikt `(180/π)^-1`. Dimensieloze ratios krijgen geen hoekeenheid en accepteren geen graden-/radialen-unitoverride; een dergelijke override geeft `DIMENSION_MISMATCH`. Documentschaal voor lengte beïnvloedt hoeken nooit.

Geen impliciete modulo 2π, omzetting naar kleinste hoek, herstel van teken of snapping naar speciale hoeken. Bestaande kleinste/gerichte geometriewaarden behouden hun betekenis. Inverse functies leveren hoofdwaarden A¹: asin in [-π/2,π/2], acos in [0,π], atan in (-π/2,π/2); een displaykeuze converteert die waarde alleen. `sin(π rad)` en `cos(90 deg)` mogen een kleine binary64-rest opleveren; een nabijheidstest is geen toestemming om de engine-uitkomst tot nul te wijzigen. De bestaande tan-singulariteitsregel blijft gelden.

### 14.2 Exacte regel voor round — verduidelijkingsvoorstel

Handtekeningen: `round(q;digits)` uitsluitend voor dimensieloos; `round(q;digits;unit)` uitsluitend voor dimensionele q met exact overeenkomende dimensie/eenheidsruimte. `digits` moet evalueren naar een eindige dimensieloze gehele waarde 0–10; ontbrekende/extra argumenten en andere digits zijn fouten (`INVALID_ARGUMENT`). Dit voegt geen compile-time-constantbeperking toe aan dit functieargument: een geldige expressie is toegestaan onder de bestaande bronrechten en quotas. De unit is een getypeerde, eindige positieve conversiefactor in de canonical basis en dezelfde dimensie als q, ook voor samengestelde dimensies. Geen impliciete documenteenheid of extra functie-argumenten.

De decimalen worden afgerond naar de dichtstbijzijnde stap `10^-digits`; bij een **exact half** wordt van nul af afgerond (half-away-from-zero). Dit geldt symmetrisch voor negatieve getallen. Afzonderlijk daarvan gebruikt terugconversie naar binary64 round-to-nearest, ties-to-even. Het gebruik van deze twee regels moet expliciet gescheiden blijven.

Normatieve definitie: neem de exacte rationale waarde van de al geëvalueerde finite binary64-q, dus haar bitwaarde, niet de oorspronkelijke invoertekst of een korte decimalerepresentatie. Laat v die waarde zijn, f de exacte rationale waarde van de binary64-unitfactor (f=1 voor dimensieloos), d=digits en z=(v/f)*10^d. Bereken de integer `n = sign(z) * floor(abs(z)+1/2)` exact; bij z=0 is n=0. Het resultaat is de dichtstbijzijnde binary64 bij de rationale waarde `(n/10^d)*f`, met ties-to-even. Het behoudt de dimensie van q. Exacte rationale tussenstappen zijn uitsluitend een begrensde technische afrondingsmethode; de quantity-engine blijft binary64 en wordt geen CAS of algemene arbitrary-precision-engine. Een implementatie mag een gelijkwaardige methode kiezen als alle grensfixtures hetzelfde resultaat bewijzen.

Geen tussentijdse binary64-vermenigvuldiging met 10^d die een halfgrens verschuift of onnodig overflow veroorzaakt; geen generieke epsiloncorrectie, `Math.round` of `toFixed` als normatieve definitie. `Math.round` kiest in JavaScript bij een half richting +∞ en wijkt voor negatieve halves af van dit voorstel. Het gekozen round-contract levert bijvoorbeeld round(2,5;0)=3 en round(-2,5;0)=-3. De binary64-literal 1,005 ligt onder de echte decimale halfgrens: round(1,005;2)=1,00; round(-1,005;2)=-1,00. Een eerdere evaluatie of unitconversie kan een halfgrens ook verschuiven: er wordt geen oorspronkelijke decimalebedoeling gereconstrueerd. Canonical output bewaart de daadwerkelijke binary64-resultaatwaarde; `≈` en displayprecisie blijven presentatie.

`round` mag bewust naar nul kwantiseren; canonical nul en zichtbare afgeronde nul zijn positief 0. Als de exact gekwantiseerde rationale uitkomst niet nul is maar de uiteindelijke binary64-conversie naar nul onderloopt, geldt 14.3. Overflow blijft `NON_FINITE_RESULT`. `floor/ceil/trunc` behouden hun bestaande richtingsregel en unitvereiste; hun bedoelde nuluitkomsten zijn evenmin underflow. Alle overige domein-, dimensie-, unit-, quota- en machtregels blijven van kracht.

### 14.3 Underflow, subnormale waarden en nul — verduidelijkingsvoorstel

Definieer N=`2^-1022` (kleinste positieve normale binary64) en S=`2^-1074` (kleinste positieve subnormale binary64). Een finite resultaat met 0<abs(q)<N is geldig: behoud zijn waarde, teken en dimensie, inclusief ±S; geen flush-to-zero, minimale positieve clamp of epsilon-normalisatie. Een actuele evaluatie mag een niet-persistente `SUBNORMAL_RESULT`-waarschuwing geven wegens verminderde relatieve precisie. Deze diagnostiek bevat geen verboden brongegevens en wordt geen AST-/documentwaarde. Controleer alle tussenresultaten; een later normaal resultaat wist eerdere rangefouten niet.

**Onbedoelde underflow naar nul is een fout `NUMERIC_UNDERFLOW`, geen geldig resultaat 0.** Dit geldt wanneer de exacte bewerking op de aangeleverde binary64-operanden een niet-nulwaarde heeft, maar binary64 +0/-0 oplevert. Ook bij unit-/schaalconversie, degree→rad, parsing van een lexicaal niet-nulgetal en terugconversie uit round. Detecteer dit vóór -0-normalisatie. Een niet-nulresultaat kleiner dan S mag op ±S afronden en blijft geldig; bij absolute exacte waarde S/2 rondt ties-to-even naar nul en treedt de fout op. Zolang een resultaat nog niet nul is, is gewone gradual underflow toegestaan, ook als het resultaat inexact is.

Nul is geldig bij exacte algebraïsche cancellation, een werkelijk aangeleverde nul en expliciete quantisatie door round/floor/ceil/trunc. Voor de bestaande functies zijn exacte nulgevallen: abs/sqrt/sin/tan/asin/atan bij invoer 0, acos bij 1, ln/log10 bij 1; exp heeft voor finite invoer geen exacte nul. Een geldige macht met nulbasis en positieve exponent is nul; 0^0/negatieve exponent blijft een domeinfout. Geen algemene test `result===0` zonder onderscheid tussen deze gevallen en rangeverlies. Guards gebruiken de operatie en oorspronkelijke operands; voor benaderde functies moet de gekozen numerieke route onderloop en echte nul aantoonbaar onderscheiden. Wanneer een library dat niet kan bewijzen, voldoet die route niet aan dit contract; dat is een implementatierisico voor T5a, geen nu gemaakte bibliotheekkeuze.

Alle unitconversies/adapterstappen vallen onder hetzelfde rangebeleid. Een bron die al 0 aanlevert geldt als supplied zero; de adapter claimt geen detectie van historisch rekenverlies binnen bestaande geometriecode. Underflow in zijn eigen conversies wordt wel geweigerd. Ontbrekende/verboden bronnen blijven unavailable en worden nooit numeric zero. Numerieke fouten zijn generiek en geven geen bron-ID/naam/waarde prijs. Een subnormaal resultaat dat alleen door displayprecisie als 0 verschijnt behoudt de niet-nulwaarde voor vervolgcalculaties en toont `≈` plus een veilige indicatie dat een niet-nulwaarde is afgerond; canonical/scientific notatie blijft beschikbaar. Print/AST-roundtrip mag subnormale waarden niet verliezen.

ECMAScript ondersteunt gradual underflow; transcendentale Math-functies zijn implementation-approximated en garanderen geen engine-onafhankelijke laatste bit. Acceptatietests voor exacte reken-/roundgrenzen gebruiken exacte bitvergelijking en onafhankelijke rationale fixtures; transcendentalen gebruiken afzonderlijk vastgelegde toleranties en moeten bij nul-/underflowgrenzen de juiste classificatie bewijzen. Geen absolute tolerantie van 1e-12 gebruiken om S en 0 als gelijk te accepteren. Bronnen voor de platformbeperking: [ECMA-262 Number-type](https://tc39.es/ecma262/#sec-ecmascript-language-types-number-type), [Math.round](https://tc39.es/ecma262/#sec-math.round), [Math.exp](https://tc39.es/ecma262/#sec-math.exp). Deze projectregels zijn een voorstel, geen claim dat JavaScript de engineguards al levert.

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
| tan(90 deg) | SINGULARITY bij expliciete \|cos\|≤1e-12; nabijgrens testen |
| asin(1) | π/2 rad of 90°; input >1 niet ruim clampen |
| sin(30 deg); asin(0,5) | 0,5; π/6 rad of 30° |
| Dynamic angle met value 90° en display rad | Adapter π/2; sin(bron)=1, geen tweede conversie |
| πr², raw r=2, scale=1 cm | ≈12,57 cm²; raw r=3 → ≈28,27 cm² |
| Zelfde geometrie, scale=2 cm | r=4 cm → ≈50,27 cm²; scale slechts één keer toegepast |
| 0,1+0,2 | Binary64-resultaat, display 0,3; geen exact-decimaalclaim |
| 2π; 2(3+4); 2 3 | UI toont 2*π; 2*(3+4); laatste geweigerd |
| Bron verwijderd of read ingetrokken | unavailable/redactie; geen gecachte formulewaarde |

Precision 0–10; format van negatieve afgeronde nul als 0, na de rangecontrole in 14.3. Numerieke nabijheidsvergelijkingen alleen in tests/singulariteitsbeleid, geen generieke epsilon die alle inputs wijzigt. T5a-acceptatie moet tolerantiegrenzen, overflow/underflow en platformverschillen binnen binary64 expliciet bewijzen; exacte bitgelijkheid voor transcendentale functies op ieder platform wordt niet verondersteld. De bestaande voorbeeldmatrix blijft verplicht en wordt aangevuld door [T5A-NUMERIC-ACCEPTANCE.md](T5A-NUMERIC-ACCEPTANCE.md). Exacte algemene algebra/equivalentie is buiten scope.

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
| T1 | Binding als onveranderbare preview; bestaande broninspector blijft. Dialog kan objectbrede legacy styles aanpassen; fragmentopmaak op de binding is nog niet beschikbaar | legacyStylePatch verandert uitsluitend toegestane stylevelden; exact dezelfde textBinding en statische `.text`; geen textContent/v7 door alleen format | Geen inhoud/style/schema/historywijziging |
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
| T5b | Eén calculator, twee private gebruiksmodi | Zelfstandig via hoofdwerkbalk en inline via ∑: gelijke quantities, nul object-/document-/historymutaties, Cancel nul wijzigingen; geen calculatedValue vóór T5c; bestaande exportregressie |
| T5c | calculatedValue | AST+bronnen+3 modes JSON roundtrip, zelfstandige SVG/PNG-rastering, restricted redactie, actuele/ontbrekende bron, history/replay |
| T5d | Audit | Volledige matrix; geen eerste ontdekplek voor exportondersteuning van een eerder type |

Productie-PNG-bediening mag T4 blijven; werkende offline SVG-rastering is al T1 en bij elk nieuw fragmenttype vereist. Exportfout is blokkerend voor die milestone. Onafhankelijke herimport van author JSON én restricted JSON moet geldig zijn; export van onvolledige organisatieclosure mag conform bestaand beleid vooraf geweigerd worden, nooit corrupt JSON teruggeven.

## 18. Besluiten en beperkte voorbereiding

Vaste randvoorwaarden uit de opdracht: alleen documentatie nu; geen T1/dependencyinstallatie; onafhankelijke typed opslag, geen uitvoerbare HTML/JS; behoud legacybindings; één OK/nul Cancel; author/restrictedvertrouwensgrens; opslag/export vanaf eerste fragment; afzonderlijke acceptatiepoorten en ontwikkelbranch.

Uitgewerkte ontwerpbesluiten in dit voorstel (nog onder architectuurgoedkeuring): expliciete v1–v6-dispatch; aparte tekst- en policyschema's; categoriegrants/canonical diff; T1/T2-legacy format zonder migratie; T3 expliciete omzetting; UI→expliciete AST-operators; SI/radiaaladapter. Het rekencontract vraagt bovendien een aparte definitieve goedkeuring vóór T5a.

Nog open: SVG-text/glyph/hybride, concrete fonts/shapingdekking/licenties, editorbibliotheek en gepinde modules, formulebibliotheek, gemeten bundel-/performancebudgetten. Er zijn geen proefresultaten; bestaande Node/Edge-baseline bewijst geen van deze nieuwe keuzes.

Voorgestelde volgende stap **P0-tech**, alleen na expliciete toestemming: geïsoleerde ProseMirror- en font/renderproeven onder `experiments/text-editor-preflight/`, met lokale tijdelijke/gepinde proefdependencies en fixtures. Geen productie-integratie, modelwijziging of T1-feature. Resultaat `TEXT-EDITOR-PREFLIGHT-REPORT.md` bevat meetdata, pass/fail/not executed per criterium en onderbouwde keuzes. Rapport eerst voorleggen; pas na acceptatie en expliciet T1-akkoord volledig integreren. Formulebibliotheekproef volgt apart vóór T2; rekencontractreview vóór T5a.


## 19. T1-uitvoering en correctie (1.2.0)

T1 voegt textContent schema 1 toe als applicatie-eigen structuur voor alinea's, tekstfragmenten, harde regeleinden en gevalideerde opmaak. ProseMirror is alleen de invoeradapter, geladen uit een lokaal gebundelde ESM-module. Formules, dynamische inlinewaarden, automatische tekstomloop en vaste breedte vallen buiten T1.

Rijke tekst gebruikt documentformaat v7 en textSchema 1, omdat v6 al is toegewezen aan cirkelpuntenverdelingen. Bestaande v1-v6-documenten behouden hun betekenis. v7 bewaart aanwezige cirkelpuntenverdelingen, groepen, lagen en constructieschema's. De applicatie embedt lokale Source Sans 3- en Source Serif 4-fonts in SVG met rijke tekst; bestaande SVG-uitvoer blijft gelijk. Licenties staan bij de fontbestanden in experiments/text-editor-preflight/fonts.

Het getypeerde text.commit-commando controleert revisie, doel, slot, permissiecategorieen en expliciete migratiebevoegdheid atomair. Legacy textBinding-objecten openen niet in de rich editor; het bestaande stijlpad behoudt hun binding. Zie TEXT-EDITOR-T1-REPORT.md voor resultaten en beperkingen.

## 20. T2-contract en uitvoering (1.3.0)

T2 is gestart op expliciete gebruikersopdracht. [T2-REPORT.md](T2-REPORT.md) bevat de formuleproef en testbewijzen. De historische keuzes uit sectie 18 zijn voor T1/T2 ingevuld: lokale ProseMirror-adapter, lokale tekstfonts en MathJax 3.2.2-glyphpaden. Dit is geen volledige IME/AT-goedkeuring. T3–T5 en het definitieve T5a-rekencontract blijven open.

### Opslag en bronnotatie

Document v7 accepteert `textSchema: 1 | 2`. Schema 1 blijft text/hardBreak; schema 2 voegt `{id,kind:"math",source,marks}` toe. De writer declareert het hoogste aanwezige schema, ook na restricted filtering. Schema 2 mag na formuleverwijdering behouden blijven. Schema 3/4 en dynamic/calculated-fragmenten worden nog geweigerd. JSON bevat bron en gevalideerde marks; geen HTML, SVG, glyphcache of bibliotheekdocument. De afgeleide `.text`-fallback bevat leesbare bronnotatie.

`MathSource` is een presentatiegrammatica, geen rekenkern. De whitelist ondersteunt onder meer Griekse letters, operators, breuken, wortels, trigonometrie, scripts en gegroepeerde haakjes. HTML, URLs, externe assets, macrodefinities, uitbreidingsloaders, comments en onbekende opdrachten worden geweigerd. Quota: 2048 brontekens, 256 tokens, diepte 32, 128 formules per tekstobject, 512 per document en 8192 documenttokens. Import/add/update controleren het totale budget vóór mutatie. Dit is een beperkte TeX-subset, geen algemene LaTeX-import.

### Modulegrenzen en assets

| Module | Verantwoordelijkheid |
|---|---|
| `model.js`, `math-source.js` | Applicatieschema, bronvalidatie, documentversie en quota; geen editor-/MathJax-import |
| `text-content-diff.js` | Pure semantische categorieverschillen; geen rechten of UI-state |
| `permission-runtime.js` | Actuele grants/locks/revisie, getypeerde commit, history en restricted export |
| `math-renderer.js` | Build-only MathJax-adapter; bron naar begrensde, gesanitiseerde SVG-box |
| `math-fragments.js` | Lazy lokale assets, begrensde cache en gedeelde formule-SVG |
| `text-metrics.js`, `rich-text-renderer.js` | Fontmetingen en mixed baseline-layout; T1-renderroute behouden voor tekst zonder formules |
| `rich-text-editor.js` | ProseMirror-adapter, atomische nodeview, bookmarks en lokale history |
| `text-insert-panel.js`, `editor.js` | Symbool-/formuledraft respectievelijk dialooglevenscyclus en commandodispatch |

`npm run build:text` reproduceert bundles/fontmetingen uit gepinde experiment-lockfiles. Inputs en SHA-256 staan in `experiments/math-fragments-preflight/build-results.json`. MathJax gebruikt ingebouwde TeX-glyphpaden, `fontCache:none`, geen CDN/autoload. Output: gecontroleerde SVG-vormen/attributen, maximaal 4096 nodes/65536 bytes per box. Cache: 128 boxes/4 MiB. Gewone fontkeuze verandert het wiskundige TeX-font niet; bold/italic zijn formulevarianten.

De synchrone SVG-API meldt ontbrekende formule-assets; hosts voeren eerst `await MI.MathFragments.load()` uit. De editor regelt readiness bij openen/renderherstel/export. Late callbacks gebruiken de actuele staat en mogen een geannuleerde draft niet terugbrengen. Kleuren gaan expliciet naar color/fill/stroke; ascent/descent bepalen baselines. Uitlijning blijft ten opzichte van het objectanker. Mixed tekst gebruikt fontadvances zonder kerning/ligaturen; wrapping en uitgebreide shaping blijven T4-werk.

### Interactie en autorisatie

Ω bewaart een bookmark en biedt tien categorieën plus zoeken. Ondersteunde fontglyphs worden tekst; ontbrekende glyphs gebruiken de veilige math-atomroute. ƒ(x) opent bron/preview en bevriest de editor. Bevestigen valideert dezelfde draftselectie. Dubbelklik of Enter op een geselecteerde atom opent de formule. Verplaatsen behoudt ID/bron/marks; delete/undo werken atomisch. Escape sluit eerst het kindpaneel, daarna de editor; fullscreen blijft behouden. Eén documentbevestiging levert één `text.commit`.

| Bewerking | Vereiste categorieën naast normale target-/revisiegrants |
|---|---|
| Gewone inhoud of bestaande atom verplaatsen | `content`; `format` als opmaak wijzigt |
| Marks/defaults/alineaopmaak | `format` |
| Formule toevoegen/verwijderen/bron wijzigen | `content` + `math`; ook `format` als opmaak wijzigt |
| Nieuw object/duplicaat | create/duplicate + created `content` + `format`; ook `math` wanneer formules aanwezig zijn |

Bronnen verwisselen tussen behouden atom-IDs geldt als bronwijziging, ook bij dezelfde bronmultiset. Verschoven text-markgrenzen mogen format-rechten niet omzeilen. De diff is conservatief bij gemengde text-marks: een lengtewijziging die grenzen wijzigt kan `format` vereisen. Uniform opgemaakte tekst kan met inhoudsrechten van lengte veranderen. Execute hercontroleert policy-epoch/revisie; afwijzing is atomair. De dialoog bewaart de openingsrevisie en behoudt de draft bij conflict.

### Legacy en acceptatie

Geen T3-migratie: legacy `textBinding` blijft buiten de rich editor. Format/history en author-save/reload behouden de binding exact. Bestaande duplicatie bewaart `sourceId`, ook als de bron samen gekopieerd wordt; geen stilzwijgende remapping. Restricted export redigeert een ontbrekende/onleesbare bron volgens het bestaande contract en kan de binding verwijderen; trusted owner-inspect behoudt het origineel. Zie de 12-fixturematrix in het rapport.

JSON/replay/restricted SVG, fullscreen en offline SVG→PNG zijn bij introductie getest. Echte OS-IME, schermlezer, handmatige visuele/externe-vieweracceptatie zijn niet uitgevoerd. T4 behoudt productie-PNG-bediening/wrapping. T3 start pas na afzonderlijke toestemming.

## 21. T3 — dynamische inlinevelden (1.4.0)

De gebruiker heeft T3 expliciet toegestaan. [T3-CONTRACT.md](T3-CONTRACT.md) legt het vooraf vastgelegde implementatiecontract vast; [T3-REPORT.md](T3-REPORT.md) bevat actuele testbewijzen en acceptatiegrenzen. De historische T3-stopregels hierboven zijn hierdoor opgevolgd. T4/T5 zijn niet gestart.

`textContent.schema:3` en document v7/`textSchema:3` activeren `dynamicValue`. Het fragment bevat uitsluitend `{id,kind,binding:{sourceId,property},format:{precision,unitMode,angleMode,prefix,suffix},marks}`. Schema 1/2 blijven geldig en schema 4 blijft geweigerd. Ondersteunde eigenschappen zijn de bestaande naam/label, lengte, straal, omtrek, oppervlakte, hoek en punt-x/y; geen diameter, vectorcomponenten of asbindingen. Een coördinatenpaar bestaat uit twee velden met gewone interpunctie. Canonical format vult ontbrekende angleMode met document aan.

`text-values.js` valideert en resolveert huidige bronwaarden. unitMode ondersteunt document, none (alleen suffix verbergen), u/dimensionless en mm/cm/m/km. Fysieke omzetting gebruikt MeasurementUnits precies eenmaal; fysieke/abstracte menging levert unavailable. angleMode=document respecteert bestaande bron-/documentinstellingen; deg/rad zijn veldspecifieke overrides. Statussen: ok, missing, invalid, unsupported en denied. Numerieke overflow, ongeldige legacy-eenheidsmetadata en waarden boven 4096 codepunten tonen een begrensde placeholder. 128 velden per tekstobject en 512 per document gelden naast bestaande rijke-tekstquota. Er worden geen uitkomsten gecachet of opgeslagen.

`text-dependencies.js` bouwt een tijdelijke omgekeerde index op immutable objects-snapshots (sourceId→objectId/fragmentId); `Engine.getTextDependents` biedt deze aan. Renderer en editor-preview lezen actuele snapshots, inclusief bronwijziging, metadata, delete/undo en policyverandering. Gewijzigde veldbreedte wijzigt x/y/rotatie niet. De nieuwe nodeview bewaart binding/format/marks; interne previewmutaties worden niet teruggeparsed naar de inhoud. DOM-updates worden overgeslagen als de waarde gelijk blijft. Lokale undo, echte drag en bookmarkinvoeging zijn getest.

In restricted mode vereist iedere actieve bron effectieve read+display (inclusief laag/objectbeschikbaarheid) en de eigenschap in textSourceProperties. Een source lock blokkeert lezen niet. Author leest hidden/locked bronnen en behoudt ontbrekende IDs voor herstel. Iedere geweigerde restricted atom wordt geheel plain “niet beschikbaar”; bron-ID/property/naam/notatie en eerdere waarde verdwijnen uit facade, JSON/SVG, previews en commandresultaten. Static backup wordt niet openbaar geprojecteerd. Het hoogste behouden schema wordt opnieuw gedeclareerd; een schema-3-tekst met alleen plain redactie blijft schema 3 mogen behouden.

`text.commit` controleert content/references bij invoegen, verwijderen en rebinden; format bij marks/notatie. Bestaande onveranderde atomen verplaatsen vergt content; alle eerdere en voorgestelde actieve bronnen worden opnieuw gevalideerd. Restricted rich bewerken en statisch herstellen worden geweigerd zolang eerdere velden niet-toegestane of onbeschikbare bronnen hebben; een geredigeerde DTO mag private bindings niet impliciet afvlakken. Een trusted author kan deze wel herstellen. Nieuwe objecten/duplicaten controleren hun eigen created grants plus bronrechten. Het bestaande textSourceProperties-policyveld heeft een afzonderlijke eigenschapallowlist; het wordt niet meer als geometrieveld beoordeeld. Runtime-dialogen gebruiken een begin/commit-handle met revision/epoch; contextwijziging sluit de draft. De Author-dialog bewaart zijn openingsrevisie. Geen automatische rebase.

Legacy omzetting is uitsluitend expliciet: `text.commit` met migrateLegacy:true, een schema-3-draft prefix/veld/suffix, overgenomen toegestane font/kleur/anchor en server-owned `legacyStaticText`. Positie/rotatie/organisatie blijven behouden; één OK is één geschiedenisactie, Cancel is nul. Unsupported font/color/size of collision met een opaque legacy-backupkey weigert de omzetting. Oude schema-1/2 en niet-rijke objectextensies met dezelfde key blijven inert; typed backup en herstel gelden pas vanaf schema 3. `text.restoreStatic` herstelt bewust het oorspronkelijke statische tekstveld; undo kan de gehele legacybinding terugbrengen. Duplicatie van inlinevelden remapt uitsluitend daadwerkelijk meegekopieerde bronnen. Bestaande legacy bindings blijven hun eerdere duplicatiepad gebruiken.

Voor nieuwe builds schrijft `scripts/build-text-editor.cjs` naar `experiments/text-editor-build/build-results.json`; historische T2-proefbestanden blijven intact. T3 installeert geen nieuwe dependencies. T4-wrapping/PNG-bediening en T5-calculaties blijven buiten scope. Real OS-IME, schermlezer, handmatige externe viewers en fysieke visuele acceptatie zijn niet uitgevoerd.


## 22. T5 — zelfstandige en inline wetenschappelijke rekenmachine (1.5.0)

**Status:** functioneel goedgekeurde documentatie-uitbreiding, niet geïmplementeerd. T3 blijft de bestaande geleverde scope; deze opdracht start of herstart T3/T4/T5 niet. Documentformaat **v7**, onafhankelijke textSchema-versies, het gestructureerde tekstmodel en legacycompatibiliteit blijven gelden. Secties 7 en 14 blijven het mathematische contract; de afzonderlijke definitieve goedkeuring daarvan vóór T5a blijft vereist. Deze sectie preciseert de eerdere algemene calculatorbeschrijvingen zonder die eisen af te zwakken.

### Laaggrenzen en hergebruik

| Stap | Technisch contract | Afzonderlijke acceptatiepoort |
|---|---|---|
| T5a | Veilige, UI-onafhankelijke parser, typed/canonical AST, dimensie- en eenheidscontrole, evaluatie en formuleprinter; geen eval/Function | Mathematisch contract definitief goedgekeurd vóór start; kernproeven geaccepteerd vóór T5b |
| T5b | Eén herbruikbare wetenschappelijke calculator-interface, bereikbaar zelfstandig vanuit de hoofdwerkbalk en inline via ∑; beide uitsluitend voorbereiden/evalueren | Beide modi apart getest, numerieke pariteit en nul documentmutaties bewezen; acceptatie vóór T5c |
| T5c | Dezelfde component voegt calculatedValue/schema 4 in een private tekstdraft in en bewerkt bestaande velden; geen tweede calculator | Opslag, rechten, history en alle drie weergavemodi bewezen; acceptatie vóór T5d |
| T5d | Audit van zelfstandige én inline integratie, veiligheid, toegankelijkheid, fullscreen en export | Expliciete finale acceptatie; niet-uitgevoerde handmatige controles blijven open |

De kern mag niet afhankelijk zijn van ProseMirror, DOM, tekstobjecten, calculator-interface of het geometrische documentmodel. Hij accepteert gevalideerde AST, getypeerde quantities en expliciete evaluatieopties; levert quantity of begrensde foutcodes. Namen, bronselectie, documentcontext, autorisatie en levenscyclus worden buiten de kern afgehandeld. Geen TeX als evaluatorinvoer. Dezelfde AST-normalisatie, precedence, UI-adjacencyregels, quotas, binary64-beperkingen, SI/radiaalconversie en domeinfouten uit sectie 14 gelden in beide modi.

Eén gedeelde **bronadapter** zet actuele, geautoriseerde geometrische waarden om naar immutable typed quantities. Hergebruik de bestaande geometrie-/DynamicText-applicability en bronrechten; parse nooit displaystrings. Lengte/x/y gebruiken documentschaal één keer, oppervlakte schaal² en fysieke basiseenheden; hoeken gebruiken de bestaande kleinste/gerichte waarde en worden één keer naar radiaal geconverteerd. Documenteenheden, precisie en graden/radialen zijn expliciete instellingen, inclusief legacydefaults en abstract u/dimensieloos. Getypeerde hoekliterals zoals `30 deg` behouden hun betekenis onafhankelijk van de documenthoekkeuze. Niet-ondersteunde eigenschappen worden geweigerd; geen automatische uitbreiding naar andere bronsoorten.

De interface gebruikt twee dunne hostadapters voor openen/sluiten, focus en context; bronkiezer, wetenschappelijk toetsenbord, parser/evaluatie-aanroep, notatie, foutpresentatie en resultaatweergave zijn gedeeld. De calculator is een zelfstandige applicatiefunctie, geen zelfstandig tweede rekenproduct. Toekomstige functiegrafieken, parametrische constructies en oefeningen kunnen dezelfde kern via eigen gevalideerde adapters hergebruiken. Dit is uitsluitend een hergebruikgrens, geen geleverde toekomstige functionaliteit.

### Zelfstandige modus

Een herkenbare rekenmachineknop in de hoofdwerkbalk opent de gedeelde interface op een leeg document, zonder tekstobject of selectie te vereisen. De calculator werkt ook in canvasfullscreen; de toegang blijft bereikbaar. Ondersteun vaste numerieke waarden, constante/functionele wetenschappelijke invoer uit sectie 7, typed dynamische geometrische bronchips, automatische herberekening, precisie, eenheidskeuze, graden/radialen en duidelijke fouten.

Alle invoer, lokale calculator-undo en opties blijven private sessiestaat. Openen, evalueren, bronwijzigingen, wisselen van opties, sluiten, Escape en annuleren creëren **geen documentobject**, voeren **geen documentmutatie** uit en voegen **geen document-undo-item** toe. Documentrevisie, selectie en bestaande historycursor blijven intact. Geen calculatordraft/resultaat in document-JSON, semantic replay of documentexport. Sessieherstel/opslag is niet standaard voorzien; eventuele latere private opslag vereist een afzonderlijk privacy-/autorisatiecontract.

**Resultaat kopiëren** is uitsluitend een expliciete actie, nooit een automatische clipboardwrite. Kopieer alleen een op dat moment opnieuw gevalideerd toegestaan resultaat in de gekozen notatie. Blokkeer kopiëren bij unavailable/stale/fout; toon clipboardweigering zonder documentactie. Bewaar geen verboden IDs/namen in clipboard of foutdetails.

### Inline modus en calculatedValue

De knop **∑** opent dezelfde component vanuit de teksteditor en bewaart de selectiebookmark. T5b biedt alleen formulevoorbereiding en evaluatie; **Invoegen in tekst is nog niet beschikbaar**. Sluiten of annuleren herstelt focus/bookmark en laat zowel de tekstdraft als het document ongemoeid. Geen AST via een T2-math- of T3-dynamicValue-fragment opslaan.

Vanaf T5c voegt **Invoegen in tekst** een getypeerd `calculatedValue`-fragment (textSchema 4 binnen v7) in de private tekstdraft in. Bewaar gevalideerde expression-schema/AST, typed bronreferenties, format en marks; geen evaluator-/bibliotheekdocument, HTML, gecachte bronwaarde of resultaat als waarheid. De drie modi blijven: **alleen resultaat**, **formule met resultaat**, **formule met ingevulde waarden en resultaat**. Alle drie komen uit dezelfde AST en geautoriseerde snapshot; haakjes, dimensies, escaped toegestane namen en `≈` volgen sectie 14.

Een bestaand berekend veld opent via dezelfde calculator met AST/format en private wijzigingen. Annuleren behoudt het veld exact; bevestigen vervangt alleen dat fragment in de draft. Pas de buitenste teksteditor-OK doet één atomische `text.commit`/documenthistoryactie. Bronrechten, expression/content/reference/formatgrants, targetlock, revisie en permission epoch worden opnieuw gecontroleerd volgens sectie 12. Standalone evaluatie verleent nooit text.commit-rechten. Oude textBinding, schema 1–3, bronremapping en v7-import blijven compatibel; geen automatische legacyconversie.

### Identieke bronbeveiliging en actuele resultaten

Beide modi gebruiken dezelfde adapter en evaluatie-/autorisatieregels. In restricted gebruik vereist elke bron effectieve read **en** display, object-/laagbeschikbaarheid en de toepasselijke bestaande eigenschapgrant; verborgen/ongeldige of ontoegankelijke meetgegevens zijn niet leesbaar via standalone. Een source lock verleent geen extra rechten en blokkeert toegestaan lezen niet. Auteursregels voor hidden/locked bronnen blijven conform secties 6/21; een standalone ingang omzeilt geen hostpolicy. Tekstschrijfrechten zijn alleen aanvullend nodig bij T5c-commit, niet voor een toegestane zelfstandige berekening.

Filter bronkiezer en veilige presentatienamen vóór UI-uitvoer. Geweigerde bron-ID, naam, meetwaarde of AST mag niet verschijnen in DOM, toegankelijkheidslabels, errors, diagnostics, kopieeruitvoer of restricted JSON/SVG. Bij een geweigerde bron wordt de **hele berekening** generiek unavailable/redacted, nooit deels gesubstitueerd of nul. Geen nieuwe tekst-naar-tekst of calculatedValue-naar-calculatedValue-bronnen en geen autorisatie via vrije bronnaamherkenning.

Elke evaluatie bindt aan sessie-/documentidentiteit, documentrevisie, permission epoch, eenheids-/hoekinstellingen, AST/format en draftgeneratie. Autorisatiewijziging invalideert onmiddellijk bronchips/presentatienamen, previews en kopieerstatus; sluit of reset een draft volgens de bestaande runtimelevenscyclus zonder verboden inhoud vast te houden. Import/dispose/contextwissel annuleert lopend werk. Bronverwijdering/ongeldige geometrie toont unavailable; undo/herstel vraagt een nieuwe toegestane snapshot en herberekening. Oude async-uitkomsten worden verworpen; geen oud resultaat laten staan tijdens een ongeldige context. Cache is optioneel, uitsluitend ephemeral en contextgebonden; geen delen tussen actors/epochs/documenten, geen persistente waardecache en altijd rechtencontrole vóór preview/kopiëren/export/commit. Bestaande private bronvelden mogen niet impliciet door een geredigeerde draft worden afgevlakt (sectie 21).

### Verplichte acceptatiematrix (nog niet uitgevoerd)

| Scenario | Poort en objectief bewijs |
|---|---|
| Hoofdwerkbalk, leeg document: `2+3*4` | T5b: exact 14; vergelijk JSON, objectcount, documentrevisie, selectie en historycursor vóór/na openen/evalueren/sluiten: ongewijzigd, geen undo-item |
| `sin(30 deg)` | T5a/T5b: 0,5 met absolute binary64-testtolerantie ≤1e-12; degree/radian documentwissel verandert de getypeerde literal niet; displayprecisie apart testen |
| Bronchip cirkelstraal, `π * r^2` | T5b: r=2 cm geeft ≈12,57 cm²; wijzig naar 3 cm: automatisch ≈28,27 cm². De calculator wijzigt de bron niet; geometriecommando is de enige historyactie. Test afwijkende schaal, unitconversie, bronwissen/undo en invalidity |
| Zelfde AST/snapshot in beide modi | T5b: identieke interne quantity/dimensie/eenheidsruimte binnen vastgelegde tolerance, plus identieke formatuitvoer bij gelijke opties; vaste en dynamische formules, rad/deg en foutenmatrix |
| Restricted bronlekken | T5b/T5c: hidden/read-/display-/property-denial, laagvisibility en epochrevocation; geen verboden ID/naam/waarde in UI/AT/error/clipboard/export; kopiëren/commit geblokkeerd, geen cachehergebruik. Vergelijk beide modi |
| Berekend veld invoegen en heropenen | T5c: dezelfde calculator, drie modi, Cancel exact gelijk, één buitenste OK/undo, redo, source remap, JSON save/import/reload, replay en actuele standalone SVG/offline SVG→PNG; geen cached result in JSON |
| Focus, toetsenbord, Escape, fullscreen, annuleren | T5b/T5c: beide ingangen, toetsenbordbronselectie, foutcorrectie, focusreturn; Escape sluit eerst child paneel/calculator en inline daarna teksteditor, zonder fullscreenexit; private undo gescheiden van documentundo; annuleren nul mutaties |

Voer Node-kern-/adaptertests en afzonderlijke Edge-tests per context uit; T5d herhaalt de gecombineerde matrix inclusief accessibility en offline export. Echte IME/AT, OS-clipboard en fysieke visuele controles alleen PASS bij daadwerkelijk bewijs; anders expliciet niet uitgevoerd. T5b doet bestaande opslag/exportregressie, maar claimt geen nieuwe inline-opslag. T5c moet nieuwe schema-4-opslag en export onmiddellijk bewijzen, niet uitstellen tot T5d.

**Nog vast te leggen vóór de relevante poort:** definitieve toleranties/singulariteitsgrenzen en kern-API vóór T5a; precieze toolbarplaatsing/iconografie, responsive presentatie, focus-/Escape-detail en clipboardformaat vóór T5b; definitieve calculatedValue-payload en passende commandgrants vóór T5c. Het functionele één-kern/één-interfacecontract, beide ingangen, nul standalone-documentmutaties en drie inline-weergavemodi staan vast. Deze open technische keuzes zijn geen toestemming om een milestone te starten.


## 23. T4 — wrapping, export en bediening (1.6.0)

Uitgevoerd op expliciete opdracht. [T4-CONTRACT.md](T4-CONTRACT.md) en [T4-REPORT.md](T4-REPORT.md) bevatten scope, meetbewijs en beperkingen. Eerdere T4-stopregels zijn hiermee opgevolgd; T5 is niet gestart. Document v7/textSchema 1–3 en legacybeleid blijven ongewijzigd.

`textContent.width` is null (automatisch) of een positieve vaste breedte in SVG-pixels, in hetzelfde stelsel als de fontgrootte. Width vereist formatrechten en heeft eigen lokale editor-undo; alleen buitenste OK commit naar het document. Ordinary tekst wrapt bij whitespace en lange woorden bij Unicode-graphemegrenzen. Formules en opgeloste dynamische waarden blijven ondeelbaar: een te brede atom loopt zichtbaar over, zonder clipping/verlies. Marks, hardBreaks, alineauitlijning, gemengde ascender/descender, scriptshift, anchor en rotatie blijven behouden. De renderer deelt de layout voor canvas/export en laat glyphbounds door de bestaande screen-space-selectie meten. Rich legacy zonder vaste breedte behoudt zijn compatibility renderer. De editoradapter gebruikt de opgeslagen defaultfont/kleur/grootte naast fragmentmarks.

`export-service.js` verzorgt expliciete math/font-readiness, SVG en PNG. Engine.renderSVG blijft synchroon voor voorbereide assets. Zelfstandige SVG bevat lokale fonts voor rich én bestaande tekst/labels; geen nieuwe fonts of rendererbibliotheek. PNG is afgeleid van toegestane SVG-export en gebruikt dezelfde document.exportSVG-grant; er is geen zelfstandige PNG-permissiebypass. Hostguards binden delivery aan documentrevisie, permission epoch, exportrequest, viewport en actieve editor. Bron-/policywijzigingen of dispose tijdens wachten leveren een generieke fout, geen stale download. Export voegt geen metadata of documentactie toe; reeds bestaande edits worden vóór de exportsnapshot afgerond. Opslaan bewaart afwezige lege legacy-metadata.

De eerdere Chromium SVG→Image-proef gebruikte fallbackfonts. Fontnamen met numerieke delen zijn nu expliciet gequote, zodat hun CSS geldig is. De PNG-route is bovendien onafhankelijk van webfontloading in Image-decoding en meet uitsluitend geautoriseerde native SVG-tekst met geladen lokale fonts en maakt per text-element een tijdelijke transparante bitmap op dezelfde glyphposities. In-place vervanging behoudt SVG-laagvolgorde, parentopacity en transformaties; de resterende geometrie/formulepaden worden vervolgens via SVG→Image→canvas gerasterd. PNG-schaal verhoogt ook de interne tekstrasterresolutie. Publieke SVG blijft font-embedded tekst; deze private bitmaps komen niet in JSON of opgeslagen fragmenten. Geen foreignObject, externe resources of nieuwe OpenType/glyphpadkeuze.

Rastergate: maximaal 8192 pixels per zijde, 16777216 outputpixels, schaal >0 en ≤4; afzonderlijk maximaal 16777216 tijdelijke tekstpixels en 65536 graphemes. Afmetingen worden vóór allocatie gecontroleerd. Native-text-indexverlies, decode-timeout (30 s), canvas-/toBlob-fout en budgetoverschrijding worden expliciet geweigerd. Tijdelijke DOM en Blob-URLs worden altijd verwijderd. Kleuren/focus/keyboardlabels, dialogscrolling en Escape/fullscreen zijn geautomatiseerd gecontroleerd; echte IME/AT, externe viewers/clipboard en fysieke visuele acceptatie blijven niet uitgevoerd. Complexe wereldwijde shaping buiten de bestaande fontdekking is niet bewezen.

T5's één-kern/één-interfacecontract uit sectie 22 blijft functioneel goedgekeurd ontwerp. T5a start pas na T4-acceptatie, definitieve rekencontractgoedkeuring en expliciete starttoestemming.

## 24. T5-prep — teksteditor en gedeelde wiskundige invoer (1.8.0)

T5-prep is de voorbereidende UI-modernisering tussen T4 en T5a; T5a–T5d blijven ongewijzigd gereserveerd voor de rekenengine en calculator. De normale roadmap-gate vraagt eerst T4-acceptatie; voor deze uitvoering gaf de gebruiker afzonderlijk toestemming na gerichte regressiecontrole. De open handmatige T4-acceptatie blijft hierdoor ongewijzigd. De prototypeproef en productie-integratie gelden niet als T4-acceptatie.

De goedgekeurde UI-richting is een donkere, compacte editor met terughoudende gouden accenten, een Nederlandse interface, één zoekveld met categoriechips en een contextpaneel als desktopoverlay of begrensde mobiele sheet. De invoeradapter kiest expliciet tussen Unicode in tekst en gevalideerde LaTeX in formules. Formules behouden selectie-/cursorplaatsing; sjablonen selecteren aanvankelijk het eerste argument. Tab-navigatie tussen argumenten blijft afhankelijk van een afzonderlijke succesvolle gebruiksproef.

Architectuurgrenzen voor latere implementatie: SymbolCatalog blijft UI- en documentonafhankelijk; MathInput beheert invoeging naar de juiste host; FormulaEditor bedient bestaande MathSource-validatie en MathFragments-preview; TextEditor blijft eigenaar van de ProseMirror-editor en private tekstdraft. Dynamische meetwaarden gebruiken uitsluitend bestaande geautoriseerde bronopties en resolver; het prototype gebruikt mocks en is geen bewijs van bronrechten. Geen berekende expressies of calculatorfunctionaliteit valt onder T5-prep.

De productie-integratie is uitgevoerd na gerichte T4-regressiecontrole, terwijl de afzonderlijke T4-handmatige acceptatie open bleef. I1-I4 behouden document v7, textSchema 1-3, legacy textBinding, MathSource, MathFragments, geautoriseerde bronopties en de bestaande commit-/exportpaden. Er zijn geen modelvelden, parser/evaluator of dependencies toegevoegd. De volledige teststatus en open handmatige controles staan in [T5-PREP-INTEGRATION-REPORT.md](T5-PREP-INTEGRATION-REPORT.md); het prototypebewijs blijft in [T5-PREP-UI-PROTOTYPE-REPORT.md](T5-PREP-UI-PROTOTYPE-REPORT.md). De integratie wacht op afzonderlijke gebruikersacceptatie. T4 is hiermee niet geaccepteerd en T5a is niet gestart.

## 25. Productie-integratie T5-prep — modulegrenzen en status (1.8.0)

De productiedialoog gebruikt een vaste editorruimte met overliggende contextpanelen en onderbalkacties. I1 groepeert bestaande werkbalkfuncties en behoudt tekstcommando's. I2 voegt `TextSymbolCatalog` toe als pure data-/zoekmodule zonder DOM, documentmodel, ProseMirror of MathJax. I3 scheidt `TextMathInput` (host/cursorinvoeging) en `TextFormulaEditor` (veilige validatie, preview en stale-request-afhandeling); de ProseMirror-bookmark en de UTF-16 selectie in het formuleveld blijven aparte selecties. I4 scheidt `TextDynamicValueEditor` en gebruikt alleen `sourceOptions`, `resolveTextValue`, `TextValues` en de bestaande typed text.commit-draft.

`TextInsertPanel` is de host/controller die de modi opent, bookmarks bewaart en annuleert. Het is geen eigenaar van formulegrammatica, symbolendata of meetwaardebeleid. Catalogusitems hebben stabiele ID's, categorie, Unicode, LaTeX/formulemapping of sjabloonbron en Nederlandstalige/Engelstalige zoektermen. Gewone tekst behoudt Unicode-invoeging; LaTeX-context gebruikt alleen `MathSource`-toegestane representaties. Sjablonen selecteren het eerste invulargument; Tab-navigatie is niet geïmplementeerd.

De dynamische waardencontroller bewaart bestaande bronschema's en formattingvelden; hij berekent geen waarden zelf en maakt geen mockbronopties. Bij afwezige of ingetrokken rechten blijft de bestaande resolver de bron verbergen of als niet beschikbaar tonen en weigert de bestaande commit-/exportcontrole ongeoorloofde data. Compatibiliteits- en exporttests zijn onderdeel van de huidige regressie, niet uitgesteld naar T4/T5d.

## 26. T5-prep UX-verfijning teksteditor (1.9.0)

**Status:** UX-integratie technisch uitgevoerd op `chatgpt/editor-development`; wacht op handmatige gebruikersacceptatie. Dit wijzigt geen documentvelden, textSchema-versies, documentversie, transactiegrenzen, permissies of exportschema's. T4 handmatige acceptatie blijft open; T5a–T5d zijn niet gestart.

De toolbar houdt bestaande textContent-waarden aan. Lettergroottes zijn centrale puntpresets in `TextEditorUX` en worden naar de bestaande SVG-/CSS-pixeleenheid geconverteerd met 96/72 px per punt: 12 pt→16 px, 16 pt→64/3 px, 20 pt→80/3 px en 28 pt→112/3 px. Alleen de nieuwe keuze is beperkt tot deze vier opties; bestaande waarden blijven exact en krijgen een aangepaste status. Gemengde selectie toont geen actief preset. `fontSize` blijft hetzelfde bestaande rich mark in dezelfde opslagstructuur.

`EditorColor.palette` is de enige paletbron; `EditorColor.renderPalette` bouwt zowel de bestaande geometrische kleurkiezer als de rich-textkiezer uit dezelfde kleurenlijst. Een aangepaste documentkleur blijft ongewijzigd en krijgt een expliciete status totdat de gebruiker bewust een paletkleur kiest. De text-toolbar gebruikt geen vrije RGB-invoer; de geometrische kleurbediening behoudt haar bestaande werking.

Tekstbreedte blijft `null` of een positieve breedte van 1–1.000.000 SVG-pixels zoals de bestaande modelvalidator voorschrijft. De nieuwe horizontale slider beeldt deze grenzen logaritmisch af op 100.000 stappen; bestaande exacte waarden worden bij openen en bij annuleren behouden. Tijdens muis-/toetsenbordinteractie wijzigt alleen een CSS-preview de beschikbare tekstbreedte, waarna de bestaande ProseMirror-layout direct opnieuw omloopt. Loslaten/beëindigen commit één lokale history-transactie; Escape herstelt de startwaarde zonder die geschiedenis te wijzigen. Buitenste Annuleren verwerpt nog steeds de gehele private tekst-draft.

Uitlijning blijft op het bestaande ProseMirror-paragraafattribuut `align`; de drie iconen passen de betrokken paragrafen in één lokale geschiedenisactie aan. De toolbar publiceert actieve/mixed status op basis van de ProseMirror-selectie, inclusief formule- en dynamische waarde-atomen, en leest undo/redo diepte uit dezelfde ProseMirror-history. Expliciete kleur-/lettergrootte-/lettertypekeuzes vervangen alleen de betreffende mark, zodat andere marks behouden blijven. Undo/redo blijft gescheiden van de documentgeschiedenis.

De desktopwerkbalk groepeert de breedteslider in een omkaderde bediening direct naast de tekstopmaak, zodat breedte niet als losstaand control oogt. Symbolen, formules en dynamische waarden zijn compacte icoonknoppen zonder zichtbare tekst; toegankelijke namen en tooltips blijven beschikbaar. Op smallere schermen mogen groepen omvallen of scrollen; desktop is het primaire verfijningsdoel en mobiele presentatie is geen acceptatieblokkade. De bestaande contextpanelen blijven overlays die de dialooghoogte niet veranderen. De symboolinvoeging heet overal “Symbolen & structuren” en blijft dezelfde `TextSymbolCatalog`, `TextMathInput`, `TextFormulaEditor` en bestaande formule-atomroute gebruiken.

Normatief testrapport en afbeeldingen: [T5-PREP-UX-REFINEMENT-REPORT.md](T5-PREP-UX-REFINEMENT-REPORT.md). Handmatige IME-/schermlezercontrole is niet uitgevoerd en blijft open; automatische browserresultaten gelden niet als gebruikersacceptatie. Deze UX-verfijning geeft geen toestemming om T5a te starten.

## 27. T5-prep Deel A — permanente teksteditorwerkruimte (1.11.0)

**Status:** technisch geïntegreerd op `chatgpt/editor-development`; wacht op handmatige acceptatie. Alleen de editorbediening verandert. T4-handmatige acceptatie blijft open, T5a–T5d zijn niet gestart en canvas-resizing uit Deel B is niet uitgevoerd.

De invoegmogelijkheden vormen een permanent linker paneel met exact twee tabs: **Formule** en **Waarden**. De formulecatalogus (symbolen, operators en structuursjablonen) staat binnen Formule; er is geen afzonderlijk Symbooltabblad. Het ProseMirror-werkvlak blijft permanent daarnaast zichtbaar op een witte achtergrond met donkere tekst voor contrast. Tabwissels sluiten geen open formule- of waardeconceptdraft; het concept blijft lokaal totdat het wordt bevestigd of expliciet geannuleerd. Een open concept blokkeert de buitenste Toepassen/Toevoegen-actie totdat het is afgerond. Escape annuleert eerst het actieve invoegconcept; een volgende Escape kan de teksteditor sluiten. Focus, bestaande MathInput-/FormulaEditor-/TextDynamicValueEditor-routes, bookmarks, bronrechten en de bestaande `text.commit`-grens blijven leidend.

Catalogusselectie schrijft uitsluitend LaTeX in het bronveld op de opgeslagen selectie/cursorpositie. Een gewone catalogusterm vervangt de selectie en laat de cursor erna; een structuur met invulvelden selecteert de eerste placeholder. De selectiebookmark blijft behouden wanneer focus naar zoeken of categorie wisselt. Catalogusinteractie creëert of vervangt nooit zelf een formule-atoom; alleen **Formule invoegen** bevestigt de draft en gebruikt de bestaande teksttransactie. De gewone Unicode-invoer en -plakactie in de ProseMirror-tekst blijven intact.

De tijdelijke invoegoverlay, overlaysluiting en tekstbreedteslider zijn uit de actieve UI verwijderd. De bestaande optionele `textContent.width` blijft als document-/renderattribuut behouden: openen, toepassen, annuleren en export wijzigen haar niet. Alleen nieuwe invoer voor breedte is verwijderd; historische aangepaste breedtes worden niet genormaliseerd of gemigreerd. Er zijn geen documentversies, schema's, permissies, opslag- of exportcontracten gewijzigd. Symbolen-/formulecatalogus, presetgroottes, gedeeld kleurenpalet, uitlijningsiconen, actieve opmaak en ProseMirror undo/redo blijven bestaande infrastructuur gebruiken.

De desktopdialoog heeft een vaste tweekolomsindeling met blijvende invoertabs, opmaakwerkbalk, wit editoroppervlak en vaste actiezone. Bij smallere breedtes stapelt de indeling; dit is een bedieningsfallback, geen primaire ontwerpdoelstelling. Historische sectie 26 beschrijft de vorige UX-checkpoint en is door deze sectie voor de definitieve Deel A-indeling vervangen waar ze conflicteert.

Rapport en screenshotbewijs: [T5-PREP-FINAL-UX-DEEL-A-REPORT.md](T5-PREP-FINAL-UX-DEEL-A-REPORT.md). Geen Deel B-werk of calculatorimplementatie is door deze update geautoriseerd.
