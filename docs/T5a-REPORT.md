# T5a — veilige onafhankelijke rekenmotor: implementatie en tests

Versie 1.0.0 — 2026-10-12. Branch: `chatgpt/t5-calculator`. Implementatiebaseline: `f84693ff6e2610c29e6bb63fa7e6bd27d5d63360`, na definitieve goedkeuring van architectuur sectie 14 v1.12.0 en numerieke acceptatie v1.0.0. De commit-SHA van deze oplevering wordt na commit/push in het opleverbericht vermeld.

**Status:** T5a geïmplementeerd en technisch getest; wacht op gebruikersacceptatie. T5b-interface, T5c calculatedValue-tekstvelden, textSchema 4, nieuwe documentopslag en andere milestones zijn niet gestart. Geen nieuwe dependencies. De goedgekeurde wiskundige regels zijn niet gewijzigd.

## 1. Geleverde scope en modulegrenzen

| Bestand | Verantwoordelijkheid |
|---|---|
| `expression-numeric.js` | Finite/rangeguards, literal-underflow, operationele nulclassificatie, begrensde exacte rationale afronding en ties-to-even-terugconversie naar binary64 |
| `expression-ast.js` | Veilige grammatica, whitelistfuncties/units, typed source-tokens, UI-onafhankelijke normalisatie, strikte AST-validatie, schema-1-codec en canonical parser/printer |
| `expression-engine.js` | Immutable quantities, gehele dimensietuples, domeinen, powers/roots, evaluatie, unit-/displayformattering en veilige symbolische/substitutiepresentatie |
| `expression-sources.js` | Afzonderlijke geometry/policyhostadapter, huidige read/display/property/laagrechten, documentschaal en SI/rad-conversie, verse snapshot en revision/epoch-controles |
| `permission-runtime.js` | Eén nieuw read-only `getExpressionSource`-pad dat bestaande `sourceAllowed`-regels hergebruikt; geen nieuwe grants, commanden of schrijfroute |

De drie kernmodules draaien in Node zonder window/document/ProseMirror/geometriemodel. De browserexports staan onder `FZI.MathIllustration`; de kern is nog niet in de normale editorwerkbalk geladen. De hostadapter wordt afzonderlijk geladen na de kern en bestaande geometrie-/permissionservices. Er is één evaluator; toekomstige zelfstandige en inline calculatorhosts kunnen dezelfde API gebruiken.

Codecs beschrijven een zelfstandig expression-schema-1-artefact. Dat is geen nieuwe documentversie of textSchema en geen opgeslagen calculatorresultaat. Document v7, legacybindings, rich text schemas 1–3 en bestaande JSON/SVG/PNG-paden blijven intact.

## 2. API en concrete bediening zonder UI

```js
const E = require('./expression-engine.js');
const ast = E.parse('sin(30 deg)');
const result = E.evaluate(ast, { angleMode: 'rad' });
// result.quantity: { value: ongeveer 0.5, dimension: [0, 0, 0] }
const display = E.format(result.quantity, { precision: 2 });
const artifact = E.encode(ast);
const restored = E.decode(artifact);
const canonical = E.print(ast); // {text, bindings}; typed references remain separate
const reparsed = E.parsePrinted(canonical);
```

Kern-API: parse/parseTokens/normalizeInput/validate, print/parsePrinted, encode/decode, quantity/evaluate/format/formula. `evaluate` ontvangt alleen angleMode en een host-owned resolveSource-callback. Bare names, assignments, JavaScript-memberaccess, eval/Function, netwerkfuncties en TeX zijn geen evaluatorinvoer. Een bronchip is een getypeerd `{type:'source',sourceId,property}`-token; een zichtbare bronnaam wordt nooit als bron geparseerd.

Zonder documenthost gebruikt de pure kern radialen als default voor dimensieloze trigonometrie. Beide adapterfactories leveren expliciet de huidige documenthoekkeuze, legacy graden. Typed deg/rad-literals behouden hun betekenis. Displayunits/precision worden expliciet aan format geleverd; format retourneert ook de onveranderde quantity, scientific/canonical waarde en een roundedNonzero-indicatie.

Unitdescriptors bevatten name/exponent of maximaal drie expliciete factoren. Bijvoorbeeld `round(1.25 m*rad;1;m*rad)` gebruikt de volledige (1,0,1)-dimensie; m als afrondingsunit wordt geweigerd. Unicode-eenheden zoals cm² en rad⁻¹ worden naar dezelfde unitexponenten genormaliseerd. Unicode-eenheden zoals cm² en rad⁻¹ worden naar dezelfde unitexponenten genormaliseerd. Canonical tekst behoudt unit/^; presentatie toont u en superscripts/dot-notatie. Dimensieloze ratios krijgen geen verborgen hoekunit. Geen modulo/snapping naar speciale hoeken.

AST-normalisatie gebruikt canonical keys, constants/units, unary representatie van negatieve literals en positieve nul. Geen bronvouwing, commutatieve sortering of algebraïsche herschikking. Canonical parser/printer behoudt haakjes, associativiteit, dimensies en source-identiteit; bindings staan in een apart typed kanaal. Presentation labels worden uitsluitend door de geautoriseerde host geleverd en escaped; de core vraagt eerst de bronquantity op voordat een label of substitutie wordt getoond.

## 3. Binary64 en exact round-bewijs

Een finite double wordt via DataView ontleed naar zijn exacte dyadische rationale. Round berekent de stap in de expliciet gekozen unit exact met begrensde BigInt-tussenwaarden, past half-away-from-zero toe en converteert de rationale uitkomst eenmaal naar binary64 met nearest/ties-to-even. Er is geen x*10^digits-doubletussenstap, generieke epsilon of reconstructie van oorspronkelijke decimaletekst.

De implementatie behoudt 1.005→1.00 en 2.675→2.67 bij twee decimalen, symmetrische negatieve halves, buurwaarden rond ±2.5, intended positive zero en finite round(1e308;10). Dimensies en expliciete unitfactor blijven behouden. Floor/ceil/trunc behouden hun richting en expliciete unitregels. Binary64-conversie kan een unitgrens verschuiven; er is geen verborgen herstel van decimale bedoelingen. Bijvoorbeeld de exacte verhouding van de stored double 1 meter en de stored unitfactor 0.01 kan net onder 100 liggen; unitgevoelige floor/trunc volgen die stored waarden. Dit is de gekozen binary64/exact-quantisatieaanpak, geen decimale-precisieclaim.

Onafhankelijk bewijs: `scripts/generate-expression-reference.py` gebruikt uitsluitend Python stdlib Fraction, een vaste seed 512014 en geen JavaScript-enginecode. De generator levert 912 exact-rationale roundfixtures: positieve/negatieve halves en hun neighbors, uiterste doubles/subnormals, vier precisies en drie unitfactoren. De verwachtingsbits zijn gecommit in `tests/fixtures/expression-reference.json`; Node/Edge vergelijken exacte bits.

Scratch-arithmetic blijft een implementatiemethode: quantities en AST-numbers zijn finite binary64. Rational-to-float weigert >8192-bit tussenwaarden; expressiequota begrenzen aantallen. Dit introduceert geen CAS, complexe getallen of algemeen arbitrary-precision-calculator.

## 4. Underflow: haalbaarheid, bewijs en grenzen

Vroeg gecontroleerd vóór volledige integratie: een onafhankelijke Decimal(precision=1200)-proef vergeleek zeven exp-gevallen, inclusief drie opeenvolgende inputdoubles rond `-1075*ln(2)`. Node onderscheidde de zero/subnormal-classificatie correct. Er is geen hard geval gevonden dat wijziging van het goedgekeurde contract vereiste.

De guards onderscheiden nul op basis van operands en functie-identiteiten. Voor finite binary64-radianen zijn alle inputs rationale dyadische getallen: sin/tan hebben alleen bij input 0 een exacte nul; cos heeft daar geen nul (π is irrationaal). Exp is voor finite input strikt positief. Andere toegestane nulgevallen zijn expliciet: asin/atan/abs/sqrt bij 0, acos bij 1, ln/log10 bij 1, nulbasis met positieve macht, exacte cancellation en expliciete quantisatie. Een onverwachte ±0 wordt vóór normalisatie NUMERIC_UNDERFLOW. Een niet-nul subnormaal resultaat blijft behouden en krijgt SUBNORMAL_RESULT-diagnostiek; geen flush-to-zero of epsilonclamp.

Dezelfde rangebewaking geldt voor unit-/schaal-/degree-conversies en ieder tussenresultaat; latere vermenigvuldiging mag eerdere onderloop niet repareren. Een werkelijk aangeleverde raw geometry-zero blijft supplied zero, conform het contract; er wordt geen detectie van historisch rekenverlies binnen bestaande geometriecode geclaimd.

De gecommitte referentiematrix bevat 19 onafhankelijke gevallen: 10 exp-inputs (normale/subnormale en zero-grenzen), zes kleine sin-inputs met een Decimal-Taylorreferentie en drie ln-inputs rond 1. Tests controleren zero-classificatie en normaal/subnormaal afzonderlijk, met maximaal 2 ULP; er wordt geen absolute 1e-12-test gebruikt om S en nul gelijk te verklaren. Gewone trigvoorbeelden behouden de geaccordeerde absolute tolerantie ≤1e-12. Tan behoudt de bestaande |cos|≤1e-12-guard; inverse trig krijgt geen ruime clamp.

Dit bewijst de expliciete nulguards en de referentiefixtures in de benoemde Node/Edge-versies. JS Math blijft implementation-approximated: er is geen claim dat iedere transcendentaal voor alle 2^64 bitpatronen op ieder platform identieke laatste bits heeft. Nieuwe runtimes moeten dezelfde referentie-/classificatiegate opnieuw doorlopen. Geen contractwijziging of bibliotheekafhankelijkheid toegevoegd.

## 5. Beveiliging en bronadapter

Strikte whitelists controleren keys, types, prototypes, accessors, arrays, cyclus-/diepte-/groottequota en source-properties vóór evaluatie. Het AST accepteert geen cached value of inferred dimension. De canonical tekst-/tokenquota worden ook bij AST-invoer gecontroleerd; codec/print vormt geen bypass. Limieten: 2048 teksttekens, 512 tokens, 256 nodes, diepte 32, 1024 stappen, 64 source-verwijzingen, 65536 codecbytes. Numerieke helperdata zijn geen publieke AST-inputtypen.

Restricted adapter: RuntimeSession-brandcontrole; sourceAllowed vereist bestaande effectieve read én display, laag/objectbeschikbaarheid, geldige geometrie, toepasselijkheid en textSourceProperties-grant. Locks blokkeren toegestaan lezen niet. De bridge geeft geen object, naam, ID of ongeautoriseerde waarde terug. Errors bevatten generieke codes. De author-factory accepteert de restricted facade niet.

Per evaluatie worden actuele bronnen gelezen; identieke bronnen krijgen binnen die ene run dezelfde immutable quantity. Geen cache tussen runs. Runtime epoch/revisie vóór/na de run verwerpt policy- of documentwissels, ook als een bron net gelezen is. Geteste gevallen: read/display/property-denial, verborgen object/laag, locked source, verwijderd/ongeldig source en herstel, policyrevocation/disposal, reentrant revision/epoch change, legacy e/u en dimensionless, signed coordinates, schaal² voor oppervlakte en raw graden→rad.

Snapshot-/formatterfouten hebben geen documenteffect. Node/Edge controleren document JSON, objecten, revisie, history, selectie en SVG vóór/na berekening. Bronbeweging/wissen/undo/redo zijn de bestaande hostcommando's; alleen die handelingen muteren het document.

## 6. Uitgevoerde tests en exacte resultaten

| Run | Feitelijk resultaat |
|---|---|
| Gerichte T5a Node-tests | 116 tests PASS, 0 FAIL/cancel/skip; 56 aanvullende cases + 17 groepen voor alle 20 oorspronkelijke matrixrijen + 11 kern/securitygroepen + één 912-fixture-oraclegroep + 19 transcendentaaltests + 12 echte bronadaptergroepen |
| Volledige Node-suite, `node --test tests/*.test.cjs` | 573 PASS, 0 FAIL/cancel/skip/todo; zie `test-results/t5a-full-node.log` |
| Edge T5a-kern en bronadapter | 73/73 contractgroepen, 912/912 exact-roundfixtures, 19/19 transcendentale fixtures en 14/14 echte adaptergroepen; 0 fouten in de definitieve volledige Edge-run |
| Volledige Edge-suite, `node tests/browser.cjs` | PASS; alle suiteonderdelen voltooid, pageErrors = []; fullscreen en offline SVG→PNG PASS |

Referentiemachine: Windows/win32 x64, Node v22.18.0; Edge 155.0.4283.45, headless. Initiële Edge-start binnen de sandbox faalde door browserproces-/tempmaprechten en voerde geen suite uit; de feitelijke Edge-tests draaien met normale Windows-processpermissies. De generator gebruikt Python 3.13 stdlib, precision 1200. De volledige Edge-run bevat onder meer rich-text/math/values/layout, legacydocumenten, permissies, import/export, offline SVG→PNG en fullscreen. De nieuwe numerieke module is ook aan die bestaande suite toegevoegd.

Logs staan in de bestaande ignored `test-results`-map. De volledige Edge-uitkomst, Node-totalen en diagnostische metingen staan ook in [gecommitte testbewijs](test-evidence/T5a.json); reproduceerbare fixtures en tests zijn meegeleverd. Geen OS-clipboard-, echte IME-/schermlezer- of fysieke gebruikersacceptatie uitgevoerd. Er bestaat in T5a geen calculatorinterface waarop die nieuwe interacties al getest zouden kunnen worden.

## 7. Gevonden bestaande regressies en beperkte correcties

De eerste volledige Node-run had 568 PASS en één FAIL: een lifecycle-test verwachtte het inmiddels door de gebruiker verwijderde tekst-fontsizeveld in de inspector. Edge stopte aanvankelijk op dezelfde oude tekstkleur/fontsize-selectors in browser-inputs, browser-styles en browser-split-tools. Deze vier tests zijn aan de **bestaande goedgekeurde main-bediening** aangepast: tekst bewerken via rich-text/presets/palet; aangepaste legacygroottes en annuleren blijven getest; model-opacity/fieldcompatibiliteit, extensies, export en documentundo/redo blijven gecontroleerd. Er is geen verwijderde UI teruggebouwd en geen oorspronkelijke functionaliteitscontrole geschrapt.

De verdere Edge-run vond twee bestaande leeg-conceptmeldingen tijdens Formula/Values-tabwissels. Minimale reparaties: `text-insert-panel.js` valideert een lege formule niet en invalideert een oudere preview; `text-dynamic-value-editor.js` toont voor een ontbrekende bronselectie een normale lege staat met disabled Invoegen in plaats van een malformed-binding-error. Niet-lege formules en daadwerkelijke bindings blijven dezelfde security-/permissionvalidatie gebruiken. Deze regressiecorrecties veranderen geen schema, rekencontract of T5b-interface.

De suites genereren bestaande T5-prep-screenshots opnieuw. Die machine-afhankelijke screenshotwijzigingen worden niet onderdeel van deze codeoplevering. De vooraf aanwezige untracked `docs/FEATURE-GAP-ANALYSIS.md` blijft onaangeroerd.

## 8. Onderhoud en resterende acceptatie

Geen rich-text/rekenlogica aan model.js of renderer.js toegevoegd. Numeric/AST/engine zijn vervangbare pure modules; de adapter is het enige geometriecontact en de read-only bridge het enige contact met de bestaande restricted kern. De parser/evaluator/codec en shared testcases zijn zonder calculator te gebruiken. Een toekomstige T5b-component hoeft niet opnieuw units, evaluator of autorisatie te implementeren.

Informele warme Node-meting: 20 runs van 100 evaluaties na vijf warm-ups van `sin(30 deg)+sqrt(9)+round(2.675;2)`: mediaan 17.9505 ms en P95 23.2091 ms per batch. De vier modules samen meten 32452 bytes raw en 9553 bytes gzip. Dit is diagnostiek, geen nieuwe acceptatienorm. Geen prestaties van een toekomstige UI of worker geclaimd.

Resterend: gebruikersreview van API, binary64/unitgrensgedrag en foutcodes; eerder niet-uitgevoerde handmatige T4/T5-prep-controles blijven apart geregistreerd. Calculatorentrypoints, focus/Escape/fullscreenbediening van de calculator, clipboard, UI-pariteit en source-labelpresentatie in de toekomstige interface horen bij T5b. calculatedValue, inline commitgrants, textSchema 4 en drie export-/opslagmodi horen bij T5c. Geen van die stappen is gestart.

**Stop na commit/push:** wacht op T5a-acceptatie en afzonderlijke expliciete GO voor T5b.
