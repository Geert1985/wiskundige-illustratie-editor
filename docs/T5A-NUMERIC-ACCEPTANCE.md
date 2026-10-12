# T5a — aanvullende numerieke acceptatiespecificatie

Versie 1.1.0 — 2026-10-12. Status: contractinhoud van 1.0.0 definitief goedgekeurd; 56 scenario's geautomatiseerd in T5a. Technische uitvoering wacht op gebruikersacceptatie; T5b/T5c niet gestart.

Repository: `Geert1985/wiskundige-illustratie-editor`; branch: `chatgpt/t5-calculator`. Normatief goedgekeurd contract: [sectie 14, inhoud van architectuur 1.12.0](TEXT-EDITOR-ARCHITECTURE.md#14-b4--verfijnd-rekencontract-goedkeuringspoort-vóór-t5a). De hieronder bewaarde scenario's zijn zonder versoepeling geautomatiseerd in `tests/expression-cases.js`, met aanvullende bronadapter- en onafhankelijke referentietests. Uitvoeringsbewijs en feitelijke resultaten: [T5a-REPORT.md](T5a-REPORT.md). Calculator-UI- en calculatedValue-opslagtests blijven voor T5b/T5c.

De drie aanvullingen vervangen geen bestaande eisen of fixtures. De oorspronkelijke matrix in sectie 14 en de security-, quota-, AST-, bronadapter-, export- en milestonepoorten blijven verplicht. T4-/T5-prep-handmatige acceptatie wordt hiermee niet voltooid. De contractgoedkeuringspoort is vervuld; T5a-uitvoering is afzonderlijk geautoriseerd en wacht nu op faseacceptatie.

## 1. Meetmethode en onafhankelijke verwachtingen

- Assert telkens quantitywaarde, volledige dimensietuple en fout-/rangeclassificatie. Een afgeronde displaystring alleen is geen bewijs.
- `N=2^-1022`, `S=2^-1074`. `prev(x)`/`next(x)` betekenen direct aangrenzende binary64-bitpatronen. Gebruik een onafhankelijke fixturegenerator/bitdecoder, niet de toekomstige parser of evaluator als verwachtingsgenerator. S/N zijn testnotatie, geen nieuwe identifiers in de expressietaal; injecteer typed quantities of equivalente geaccepteerde literals.
- Reken-/roundgrenzen: bit-exacte verwachting, inclusief positive-zero-normalisatie na rangecontrole. Round-oracle gebruikt exact rationale binary64-operanden en unitfactoren zoals in 14.2; geen Math.round/toFixed of dezelfde productiehelper.
- Hoekconversies/transcendentalen: reguliere waarden absolute fout ≤1e-12, en daarnaast exacte dimensie/eenheid/classificatie. Deze tolerantie verleent geen nul-snapping, algemene inputclamp of onderloopvrijstelling. Ze geldt niet voor subnormale fixtures.
- Subnormale elementaire bewerkingen: exacte bits. Transcendentale subnormale fixtures: onafhankelijke hoge-precisiereferentie omzetten naar binary64, maximaal 2 ULP bij de gekozen Node-/Edge-runtime én juiste nonzero/subnormal-classificatie. Een bibliotheek zonder bewijs van die grens faalt de gate. Bewaar referentiewaarden, oracleversie en methode in het latere testrapport; niet alleen een rounded decimal snapshot.
- Test Node en Edge op afzonderlijk gerapporteerde versies/platforms. Bitidentiteit tussen alle JS-platforms voor transcendentale functies is geen standaardgarantie. Concrete engineverschillen worden gerapporteerd en mogen fout-/underflowclassificatie niet veranderen.
- T5a test de UI-onafhankelijke kern en de bestaande externe bronadapter. Dezelfde context-/weergavegevallen krijgen pas hun daadwerkelijke calculator-UI-tests bij T5b en inlineopslagtests bij T5c; die milestones starten hier niet.

## 2. Hoekdimensies en verhoudingen

| ID | Invoer/handeling | Verwachte acceptatie |
|---|---|---|
| A01 | `1 rad`, `180 deg`, `π * 1 rad` | Alle A¹=(0,0,1); intern respectievelijk 1, ongeveer π, ongeveer π. Literalunits/AST blijven roundtrip gelijk |
| A02 | `π`, `180`, `(180 deg)/(1 deg)` | Alle dimensieloos=(0,0,0); ratio ongeveer 180, zonder verborgen hoekeenheid |
| A03 | `90 deg + 1 rad` | A¹; intern ongeveer π/2+1. Geen tweede conversie door display-/documentkeuze |
| A04 | `1 rad + 1`, `1 rad + 0` | Beide DIMENSION_MISMATCH; dimensieloze nul krijgt geen impliciete dimensie |
| A05 | `(2 rad)*(3 rad)`; `(6 rad²)/(2 rad)` | A² met waarde 6; A¹ met waarde 3. Eerdere integer-exponentregels blijven gelden |
| A06 | `(1 rad)^-1`; `1 m * 1 rad` | A⁻¹ met waarde 1; (1,0,1) met waarde 1. Correcte samengestelde unitprinter |
| A07 | A²/A⁻¹/lengte·hoek in sin/cos/tan | DIMENSION_MISMATCH; geen impliciete stripping van dimensies |
| A08 | `sin(30 deg)`, documenthoekkeuze deg→rad | Ongeveer 0,5 in beide keuzes, output dimensieloos |
| A09 | `sin(30)`, dezelfde wissel | Gradenmodus ongeveer 0,5; radialenmodus ongeveer -0,9880316240928618 |
| A10 | `sin((90 deg)/(1 deg))` | Dimensieloze ratio volgt angleMode: graden ongeveer 1; radialen ongeveer 0,8939966636005579 |
| A11 | `sin((90 deg)/(1 rad))` | Graden ongeveer 0,0274121335920443; radialen ongeveer 1. Ratio bewaart geen radialenlabel |
| A12 | `sin(((90 deg)/(1 rad)) * 1 rad)` | Ongeveer 1 bij beide documentkeuzes; expliciet getypeerde hoek |
| A13 | `asin(-1)`, `acos(-1)`, `atan(1)` | A¹-hoofdwaarden ongeveer -π/2, π, π/4; display -90°, 180°, 45°. asin/acos buiten [-1,1] blijven domeinfout |
| A14 | Typed quantity `-450 deg` en bestaande gerichte bronhoek | Teken en waarde behouden; geen modulo/kleinste-hoekconversie door de rekenengine. Bronadapter volgt bestaande geometrische meetmodus |
| A15 | `sin(π * 1 rad)`, `cos(90 deg)` | Binnen reguliere tolerantie bij 0, zonder expliciete snapping. Test afzonderlijk dat evaluator geen epsilon-zero-cleanup invoert |
| A16 | A²=1 rad² in deg²; A⁻¹=1 rad⁻¹ in deg⁻¹ | Weergavefactoren respectievelijk (180/π)^2 en (180/π)^-1; interne quantity/AST gelijk |
| A17 | Dimensieloze hoekratio met deg/rad-unitoverride | DIMENSION_MISMATCH; geen toegevoegde unit/hoekdimensie. Gewone dimensionless-weergave ongewijzigd |
| A18 | Documentlengteschaal/unit wisselt; bestaande 90°-bron | A¹ blijft ongeveer π/2 rad; sin(bron) ongeveer 1; alleen host-UI-format mag veranderen |
| A19 | Typed bronhoek ontbreekt/read of display ingetrokken | Bestaande unavailable/redactie; geen nul, brondata of cached quantity; geen afgezwakte permissieregels |

Test iedere geschikte A-rij ook op AST encode/decode en parse(print(AST))-gelijkheid. Een uitkomst heeft geen impliciete invloed op de opgeslagen literalunit.

## 3. Round: halves, negatieve getallen en binary64-grenzen

| ID | Invoer/fixture | Verwachte acceptatie |
|---|---|---|
| R01 | `round(2,5;0)`, `round(-2,5;0)` | Exact 3, -3; half-away-from-zero |
| R02 | `round(1,25;1)`, `round(-1,25;1)` | Binary64 van 1,3 en -1,3; exacte half in beide richtingen |
| R03 | round(prev(2,5);0), round(next(2,5);0) | Exact 2, 3 |
| R04 | round(prev(-2,5);0), round(next(-2,5);0) | Exact -3, -2; prev is de meer negatieve buur |
| R05 | `round(1,005;2)`, `round(-1,005;2)` | Exact 1, -1; binary64-invoer onder de decimale halfgrens, geen epsilon of reconstructie van invoertekst |
| R06 | `round(2,675;2)`, `round(-2,675;2)` | Binary64 van 2,67, -2,67; geen tussentijdse x*100 die deze grens verschuift |
| R07 | `round(0,1+0,2;1)` | Binary64 van 0,3; geen decimal-exact-claim voor eerdere som |
| R08 | `round(-0,4;0)` en round(-0;0) | Canonical positieve 0; bits controleren. Bedoelde quantisatie is geen NUMERIC_UNDERFLOW |
| R09 | `round(1,25 m;1;m)`, `round(-1,25 m;1;m)` | Binary64 van ±1,3 meter, fysieke L¹ behouden |
| R10 | Zelfde canonical q, round met expliciete cm versus m | Independent rational oracle gebruikt q/f per gekozen unit. Onderlinge verschillen zijn uitsluitend de gekozen afrondingsstap; geen impliciete documentunit. Geen verwachte halves op basis van oorspronkelijke unitliteraltekst aannemen |
| R11 | `round(1,234 cm;1;cm)` | Ongeveer 1,2 cm; oracle levert exacte canonical bits. Scale/displaywissel verandert AST-functieunit niet |
| R12 | `round(1,25 rad;1;rad)`; dezelfde q met deg | A¹ behouden; respectievelijk radiaal- en gradenstap. Gegarandeerde half alleen als de exacte q/f-verhouding een half is |
| R13 | q=1,25 m², digits=1, typed m²-unit | Binary64 van 1,3 m²; exponent/ruimte behouden. Unit m geeft DIMENSION_MISMATCH |
| R14 | `round(1 m;0)`, dimensionless q met derde unitargument, verkeerde unitruimte | Weigeren volgens handtekening/dimensie/ruimte; geen fallback naar documentunit |
| R15 | digits -1, 11, 0,5, 1 rad; extra/ontbrekende arguments | INVALID_ARGUMENT. Digits 0 en 10 geaccepteerd |
| R16 | `round(1e308;10)` | Exact dezelfde finite binary64 als input; geen overflow door naïeve vermenigvuldiging met 10^10 |
| R17 | Decimaleliterals rond 2^53, gevolgd door round(...;0) | Eerst literalconversie naar binary64; round behoudt aangeleverde waarde, herstelt geen verloren invoerbits |
| R18 | Canonical resultaat/print/display | Binary64-waarde en unittyped AST roundtrip; displayprecision wijzigt geen resultaat; bestaand ≈-beleid behouden |
| R19 | `round(1,234;1+1)`; digits via toegestane dimensieloze bronexpressie | Geldige integer 2 geeft binary64 van 1,23; geen extra constantbeperking voor digits. Verboden/ontbrekende bronnen blijven geweigerd/unavailable |

Gebruik voor R03/R04/R17 een exact bit-/rationale fixturelog. Test daarnaast alle bestaande floor/ceil/trunc-richtingen, vooral negatieve inputs, en controleer dat die niet door half-away-from-zero vervangen zijn.

## 4. Underflow en subnormale waarden

| ID | Invoer/fixture | Verwachte acceptatie |
|---|---|---|
| U01 | N, prev(N)=N-S, S, -S | Bits en dimensies behouden; N normaal, de overige subnormaal. Geen flush/clamp |
| U02 | N/2; S+S; S*0,75 | Exacte bits: N/2, 2S, S. De laatste is inexact maar nonzero en geldig |
| U03 | S/2; S*(-0,5) | NUMERIC_UNDERFLOW, ook bij exacte half en negatief zero-sign; geen canonical geldige 0 |
| U04 | S/4; -S/4; 1e-300*1e-100 | NUMERIC_UNDERFLOW |
| U05 | `(S/2)*2` | Fout blijft bij eerste node; geen folding/cancellation over fout om later S terug te geven |
| U06 | S-S; S*0; 0/S | Geldige canonical positieve 0. 1/0 blijft delingsfout |
| U07 | `sin(0)`, `asin(0)`, `atan(0)`, `acos(1)`, `ln(1)`, `sqrt(0)` | Geldige 0, nooit onterechte underflowfout |
| U08 | `exp(-1000)` | NUMERIC_UNDERFLOW; geen beschikbaar resultaat 0 |
| U09 | `exp(-744)` | Nonzero subnormale binary64; oraclevergelijking ≤2 ULP en juiste classificatie. Geen absolute 1e-12-tolerantie |
| U10 | `1e-400`, `-1e-400` als literal | NUMERIC_UNDERFLOW bij parsing; lexicaal nonzero mag niet 0 worden. `0e-400` wel geldige 0 |
| U11 | S-meterliteral; S-centimeterliteral; S-gradenliteral | Meter geldig S; cm en deg conversies lopen naar nul onder: NUMERIC_UNDERFLOW. Raw literal S eerst behouden |
| U12 | Bronadapter nonzero raw met subnormale schaal/unit | eigen schaal-/SI-/rad-conversiestappen volgen dezelfde foutenregels; geen ongeautoriseerde broninformatie in diagnostiek |
| U13 | Bronadapter bestaande raw=0 | Supplied zero, geldige 0 waar eigenschap dat toestaat; geen claim dat adapter eerder geometrisch rekenverlies detecteert |
| U14 | round(S;0); floor(S); trunc(-S) | Geldige bedoelde nul, positief gecanonicaliseerd; ceil(S)=1. Dit is quantisatie, geen foutonderloop |
| U15 | S als waarde met precision=2 | Display kan ≈0 tonen met veilige nonzero-indicatie; quantity blijft S; canonical/scientific uitvoer parsebaar en roundtrip exact |
| U16 | S in AST encode/decode/print/parse | Exacte bitwaarde S behouden; geen gecachte afgeronde displaywaarde als waarheid |
| U17 | Bron read/display ingetrokken tijdens preview, subnormale waarde in cache | Bestaande redactie/epochregels; geen waarde, waarschuwing met brondata of cached result uitlekken |
| U18 | `exp(1000)` en extreme eindige deling/power | NON_FINITE_RESULT; bestaande overflowregel behouden, onderscheid van NUMERIC_UNDERFLOW |

Voor benaderde functies zijn next-representable-input-fixtures aan beide zijden van de exp-zero-grens en de normal/subnormal-grens gegenereerd met Python Decimal (precisie 1200); kleine sin-inputs en ln bij 1 worden aanvullend getoetst. Het oraclebewijs staat in `tests/fixtures/expression-reference.json` en het T5a-rapport. De overige goedgekeurde regels blijven gelden: nulgevallen per functie van rangeverlies onderscheiden; een geaccepteerde subnormale tussenwaarde kan gevolgd worden door een geldige normale waarde.

## 5. Gevonden onduidelijkheden en voorgestelde oplossing

| Bestaande formulering/beperking | Verduidelijking | Risico/restbeslissing |
|---|---|---|
| Sectie 14 noemt hoekverhoudingen samengestelde dimensies | Gecorrigeerd: A¹/A¹=A⁰ en dimensieloos; A²/A⁻¹ blijven samengesteld | Dimensieloze trig volgt bestaand angleMode, ook voor ratios; dit zichtbare gedrag vraagt definitief akkoord |
| Radiaal kan buiten deze engine wiskundig als dimensieloos worden behandeld | Engine behoudt expliciet semantisch A¹-type, zoals al ontworpen | Geen SI-typeclaim; automatische unitstripping zou het bestaande contract schenden |
| Round had geen halfregel; Math.round past negatieve halves anders toe | Symmetrische half-away-from-zero op exacte opgeslagen binary64-quantity; afzonderlijke ties-to-even-binary64-conversie | 1,005→1,00 is bewust binary64-beleid; geen nieuwe decimale opslag/engine |
| Onbepaalde decimal-round-tussenstappen | Exact rationale definitie voorkomt dubbele afronding en scaling-overflow | Implementatiemethode is nog vrij; exacte fixturegelijkheid verplicht, bounded scratch-arithmetic valt onder quotas |
| Alleen nonfinite-resultaten werden expliciet fouten genoemd | Nieuwe specifieke NUMERIC_UNDERFLOW voor onbedoelde nonzero→zero; subnormaal blijft geldig | Operationele guards voor transcendentalen moeten later bewezen worden; geen libraryselectie nu |
| Negatieve nul werd direct genormaliseerd | Eerst rangecontrole, dan canonical positive zero | Exacte/bedoelde nul moet onderscheiden blijven van -0 door onderloop |
| Platformdeterminisme kon als laatste-bitgarantie worden gelezen | Exacte grenzen bit-exact; benaderde functies apart oracle/tolerantie plus classificatie | ECMAScript garandeert geen bitidentiteit voor alle transcendentale functies. De kern-API en overige reeds open T5a-tolerantiekeuzes blijven apart open |

Geen conflict met v7, textSchema 1–3, legacybindings, veilige parser/AST, bronrechten, documentschaal, de drie latere calculatedValue-modi of exportpoorten gevonden. De bestaande tan-guard |cos(x)|≤1e-12, geen ruime inverse-trig-clamp, dimensional-powergrenzen, unitspaces, parse/print-gelijkheid en nul-documentmutaties in de toekomstige standalone calculator blijven behouden.

## 6. Oplevering en grenzen

Historische documentatieoplevering 1.0.0: uitsluitend architectuurcontract en acceptatiespecificatie, geen productiecode. De 56 tabelrijen blijven inhoudelijk behouden. Deze 1.1.0-statusupdate registreert de inmiddels afzonderlijk geautoriseerde T5a-implementatie en bewijslinks; het contract is niet gewijzigd.

Historische verificatie 1.0.0: documentchecks en 22 numerieke referentiecontroles, toen nog geen applicatie-engine-test. Actueel: alle A01–A19, R01–R19 en U01–U18 zijn afzonderlijke Node-/Edge-scenariogroepen. Node- en Edge-bronadaptergroepen toetsen A18/A19/R19/U12/U13/U17 met de werkelijke geometry-/permissionruntime. Onafhankelijke 912 round- en 19 transcendentale fixtures toetsen bits, ULP en rangeclassificatie. Exacte aantallen en volledige regressiestatus staan in het [T5a-rapport](T5a-REPORT.md); een groeps-PASS claimt geen niet-uitgevoerde toekomstige calculator-UI/inline-exporttest.

**Stoppoort:** T5a-gebruikersacceptatie en afzonderlijke toestemming voor T5b afwachten. Geen calculator-UI of nieuwe tekstfragmentopslag in T5a.
