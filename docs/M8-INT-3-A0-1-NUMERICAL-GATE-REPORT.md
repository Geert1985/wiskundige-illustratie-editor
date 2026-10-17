# WIE M8-INT.3-A0.1 — numerieke implementatiegate

**Datum:** 17 oktober 2026; **branch:** `codex/m8-int-3-a0-1-numerical-gate`; **basis:** actuele `origin/main` op `e0b157fce4a17368016982193cdf9d5f0f04f911`.
**Status:** afgesloten research-spike; uitsluitend onderzoeksbestanden en dit rapport zijn gewijzigd.
**Conclusie:** **NO-GO voor de productiepoort B op basis van dit prototype**. De beperkte cirkel–ellipsmatrix wordt exact gecertificeerd, maar representatieve geroteerde solves duren seconden en de ellips–ellips-proef blijft unresolved. Er is geen productie-GO.

## 1. Samenvatting

Deze spike testte of exacte algebra op de feitelijk opgeloste WIE-geometrie de algemene intervalquartic-route kan vermijden. Het prototype neemt de opgeloste `cx`, `cy`, `a`, `b` en de door de WIE-geometrie berekende `u`/`v`-assen. Iedere JavaScript `Number` wordt exact als IEEE-754-dyadische rationale geïnterpreteerd. Het vormt daarmee de kegelsnede die bij die feitelijke assen hoort, reduceert de tweede kegelsnede met twee rationale parametrisatiekaarten tot quartics, en telt/isoleert de wortels met GCD- en Sturm-bewijzen.

Voor cirkel–ellips leveren de gewone, exact vastgelegde invoeren bij 15°, 45°, 60° en 90° elk vier onderscheiden wortels. De onafhankelijke analytische controle bewijst de vier tellingen ook los van de solver. Raakmultipliciteiten 2 en 4, kaartgrenzen, een bijna-coïncidente contour en een zeer nabije wortelpaartest werden eveneens gecertificeerd. De solver geeft bij het ellips–ellips-budget en bij budgetuitputting `NUMERIC_UNRESOLVED` en `roots:null`.

De hoge kosten zijn de blokkade: de 45°-solve is mediaan **6.319,100 ms**, en de close-pair-case mediaan **1.112,271 ms**. Een ongeroteerde vierpuntscase kost 184,784 ms. De oude A2.1 exacte referentie kostte voor een gewone exact-rationale vierpuntscase gemiddeld 113,18 ms; A2.1b's submilliseconde scan was alleen een kandidatenzoeker en leverde geen gecertificeerde wortelset. Deze spike toont dus juistheid op de eerste cirkel–ellipssubset, geen voldoende interactieve prestatie.

## 2. Branch, commits en bronversies

- Nieuwe branch `codex/m8-int-3-a0-1-numerical-gate` is schoon aangemaakt vanaf de toen actuele `origin/main` **`e0b157fce4a17368016982193cdf9d5f0f04f911`**.
- De A0-preflight is gelezen vanaf `codex/m8-int-3-a0-implementation-preflight` (laatste bekende commit `ca2d380b13ab1a070155a9c94c6e4343238dfa21`).
- A2.1 is gelezen vanaf lokale onderzoeksbranch/commit `edef720e52838e4d9c6bbdc00bb3e3a41d071044`; A2.1b vanaf `1fb49db05b6985a05e7b7c1667d595560961cccf`. Deze research-branches zijn referentie gebleven; er zijn geen bestanden ervan automatisch gemerged. De huidige remote fetchconfiguratie bood niet alle oude A2-refs aan.
- Normatieve actuele versies op de start-`main`: `AGENTS.md` 1.0.8, roadmap 2.8.40, M8-INT hoofdcontract 1.1.6, M8-INT.3 contract 1.0.3 en A-MVP-identiteitscontract 1.0.0.
- Nieuw onderzoek staat alleen in `research/m8-int-3-a0-1/`; het rapport staat in `docs/`. Er is geen productiecode, packageconfiguratie, documentformat of manifest gewijzigd.

## 3. Eerdere numerieke blokkade

A2.1 bewijst complete wortelsets en multipliciteiten voor exacte rationale broncoëfficiënten en exacte rationale orthonormale frames. De geroteerde WIE-bronnen vielen daarbuiten. A2.1b omsloot trigonometrische waarden en vond snelle numerieke kandidaten, maar had geen globale intervalwortelteller; kandidaten waren daarom niet autoritatief. De 15°-, 45°- en 60°-gevallen eindigden daar veilig unresolved.

A0 liet de productiepoort B afhankelijk van een prototype dat de normale rotaties volledig certificeert, tangenties correct behandelt, geen gedeeltelijke rootset publiceert en een praktische interactieve route aannemelijk maakt. Deze spike pakt eerst de feitelijke WIE-double-geometrie aan, zodat ze geen ideale hoek of niet-opgeslagen waarde certificeert.

## 4. Feitelijke WIE-ellips en contourverschil

`EllipseGeometry.fromDefinition` leest `cx`, `cy`, `a`, `b`, `rotation` en berekent met JavaScript `Math.cos(rotation)` en `Math.sin(rotation)`:

```text
u = (c, s)
v = (-s, c)
pointAt(t) = center + a*cos(2πt)*u + b*sin(2πt)*v
```

Voor een focusgestuurde ellips haalt de testfixture `center`, `a`, `b`, `u` en `v` rechtstreeks uit `EllipseGeometry.resolve`. Het prototype gebruikt dus niet een eerder afgeronde theoretische `sqrt`-as of een opnieuw geïnterpreteerde gradenhoek. Het behandelt de werkelijk geretourneerde Number-waarden als exacte dyadische coëfficiënten.

`c²+s²` is in het algemeen niet exact 1. Zet `q=c²+s²`. De opgeloste `pointAt`-contour wordt exact beschreven door:

```text
((c·dx + s·dy)/(a·q))² + ((−s·dx + c·dy)/(b·q))² = 1
```

Daarom is `q` behouden bij het opbouwen van de impliciete kegelsnede; aannemen dat `(c,s)` exact unit-length is zou een andere conic beschrijven.

De renderer maakt de SVG-ellips met `a`, `b` en een geroteerde hoek `atan2(u.y,u.x)`. Die SVG-rotatie normaliseert de asrichting impliciet; ze gebruikt dus niet letterlijk de licht geschaalde dyadische `u/v`-basis van `pointAt`. Voor de vier rotatiefixtures was `q−1` respectievelijk `3,74e−17`, `−2,03e−17`, `2,41e−17` en `3,75e−33`. De maximale semiafstand van de onge-normaliseerde `pointAt`-assen tot de genormaliseerde frame was in deze fixtures hoogstens **3,74e−17 modelunits**. De renderer rondt daarnaast getallen via `number()` af op zes decimalen: voor een willekeurige hoek is de hoekbijdrage maximaal ongeveer `max(a,b)·8,73e−9` modelunits; `cx`, `cy`, `rx` en `ry` hebben afzonderlijk maximaal `0,5e−6` scherm-unit afronding. De geteste 15°/45°/60°/90° SVG-hoeken vielen op deze zesdecimalengrens praktisch exact.

De algebra certificeert de continue reële conic die door de exacte dyadische opgeloste framecoëfficiënten wordt gedefinieerd. Zij certificeert geen pixels, SVG-serialisatie, browser-renderer of de laatste afrondingsfout van iedere afzonderlijke `pointAt`-evaluatie. De runtime-`Math.sin/cos`-uitkomst moet in een productieadapter uit dezelfde opgeloste WIE-runtime worden doorgegeven; opnieuw berekenen in een andere runtime kan andere laatste bits opleveren. Dit onderscheid is expliciet gehouden.

## 5. Exact-dyadische algebra als route

**Resultaat: juistheidsroute geschikt voor een begrensde cirkel–ellipskern; op de huidige uitvoering te traag voor productie.**

Een `Number` wordt met `DataView` uit de IEEE-754-bits exact naar `n/2^k` omgezet. Voor bron A wordt een rationale parametrisatie met `z∈[-1,1)` gebruikt. Twee charts met tegenovergestelde tekens bedekken de volledige conic precies eenmaal; `z=1` wordt uitgesloten en `z=-1` inbegrepen zodat chartgrenswortels niet dubbel tellen.

Na substitutie van de parametrisatie in de exacte impliciete vergelijking van bron B, en vermenigvuldiging met de strikt positieve noemer `(1+z²)²`, ontstaat per chart een polynoom van maximaal graad vier. Er worden daardoor geen noemerwortels toegevoegd of verloren. `gcd(p,p')` en squarefree-lagen bepalen onderscheiden wortels en multipliciteiten; Sturm-variatieverschillen tellen exact; rationale bisectie isoleert ieder resultaat. De output bevat z-interval, rationele x/y-box, multipliciteit en bewijsnotitie. Alle x/y-boxen worden door kleine intervalresiduasserties op beide exacte bronconics gecontroleerd.

De exacte algebra vermindert de noodzaak van een algemene intervalquartic-wortelteller **voor deze bronsemantiek**: zodra de opgeloste `u/v`-doubles beschikbaar zijn, zijn de impliciete coëfficiënten exact rationaal. Dit lost bron-/renderprovenance niet op en levert geen snelheidswinst op zichzelf.

## 6. Prototype en volledigheidsargument

Solver: `research/m8-int-3-a0-1/conic-intersections.cjs`; de geïsoleerde rationele Sturm/GCD-helper is `quartic-isolator.cjs`. Conceptuele interface:

```js
solveConicIntersections(sourceA, sourceB, options)
```

Een ellipsbron geeft de gevalideerde `cx/cy/a/b` plus de `u/v` uit de actuele `EllipseGeometry`-resolver. Een cirkelbron geeft `cx/cy/r`. Ongeldige of overlimiet-bronnen geven `SOURCE_INVALID`. Identieke contouren geven `COINCIDENT_CONICS`. Een volledig bewezen lege set geeft `CERTIFIED_NONE`. Alleen complete geïsoleerde rootsets geven `CERTIFIED_ROOTS`. Werk-/bitbudget, niet-ondersteunde of anders onbesliste gevallen geven `NUMERIC_UNRESOLVED` met `roots:null`.

De eerstbronparametrisatie bedekt beide halve kegelsneden, de tweede bron is een exacte rationale polynoomvergelijking, Sturm bewijst het aantal distincte wortels in ieder interval en de squarefree-GCD-lagen bepalen multipliciteit. Omdat beide chartintervallen halfopen dezelfde grensconventie gebruiken, wordt iedere parameterplaats eenmaal geteld. De positiebox volgt uit rationale intervalterugtransformatie. Een numeriek kandidaatpunt kan dus geen ontbrekende root verbergen of een onvolledig resultaat autoritatief maken.

Het prototype is niet formeel geverifieerd; BigInt/JavaScript-runtime, implementatiefouten en de beschreven render-/evaluatieverschillen blijven trust boundaries. De onafhankelijke controle hieronder beperkt maar elimineert dat risico niet.

## 7. Onafhankelijke analytische controles

`independent-oracles.cjs` importeert de solver niet. Voor NUM-008–011 controleert het de echte opgeloste `c/s`-doubles als dyadische rationals en verifieert exact dat:

```text
b²(c²+s²) < r² < a²(c²+s²)
```

De radiale norm van een ellips is strikt monotoon binnen elk van de vier hoofdassenkwadranten. Omdat de cirkelradius strikt tussen de twee extremen ligt, is er precies één kruising per kwadrant: vier verschillende reële roots. Dat is een onafhankelijke volledigheidsredenering voor 15°/45°/60°/90°, niet alleen een residucheck.

Voor NUM-007 is de eenheidscirkel vergeleken met de ellips `(x−0)²/0,5² + (y−0,75)²/0,25² = 1`. Na positieve schaling kan de tweede contour worden geschreven als `x²+4y²−6y+2=0`; op de cirkel is het verschil `3(y−1)²`. Er is één gemeenschappelijk punt `(0,1)` en de nul heeft orde vier langs de cirkel, onafhankelijk bevestigd.

Voor NUM-002 zijn twee gelijke cirkels met straal 2 en onderlinge afstand 1 gebruikt; de analytische twee-puntsuitkomst komt overeen. NUM-005 is de eenheidscirkel versus `x²/4+y²=1` (twee dubbele contacten), NUM-014 twee gelijke ellipsen met een dyadische translatie (subtractie reduceert tot één x-coördinaat en twee y-oplossingen), en NUM-016 zet beide roots op de chartgrens. Dit zijn gerichte fixtures, geen volledig onafhankelijk tweede implementatie van elk polynoom.

## 8. Resultaten NUM-001 t/m NUM-020

De complete, reproduceerbare invoer en rationele boxes staan in `research/m8-int-3-a0-1/fixtures/matrix-results.json`. De matrix/asserties zijn volledig uitgevoerd met Node v22.18.0; **20/20 assertions geslaagd**. “Geslaagd” betekent dat de vereiste status/count/multipliciteit en fail-closed-invariant overeenkomen; NUM-012, NUM-019 en NUM-020 zijn bewust geldige negatieve/onbesliste acceptatie-uitkomsten.

| ID | Fixture | Werkelijke uitkomst | Beoordeling |
|---|---|---|---|
| NUM-001 | Cirkel–ellips, geen kruising | `CERTIFIED_NONE`, 0 | PASS |
| NUM-002 | Gewone twee kruisingen | `CERTIFIED_ROOTS`, 2, `[1,1]` | PASS |
| NUM-003 | Vier kruisingen | `CERTIFIED_ROOTS`, 4, `[1,1,1,1]` | PASS |
| NUM-004 | Eén raakpunt | `CERTIFIED_ROOTS`, 1, `[2]` | PASS |
| NUM-005 | Twee losse raakpunten | `CERTIFIED_ROOTS`, 2, `[2,2]` | PASS |
| NUM-006 | Eén tangent plus twee simpele kruisingen | `CERTIFIED_ROOTS`, 3, `[2,1,1]` | PASS |
| NUM-007 | Vierde-ordecontact | `CERTIFIED_ROOTS`, 1, `[4]` | PASS |
| NUM-008 | Rotatie 15° | `CERTIFIED_ROOTS`, 4, `[1,1,1,1]` | PASS; onafhankelijke kwadranttelling |
| NUM-009 | Rotatie 45° | `CERTIFIED_ROOTS`, 4, `[1,1,1,1]` | PASS; onafhankelijke kwadranttelling |
| NUM-010 | Rotatie 60° | `CERTIFIED_ROOTS`, 4, `[1,1,1,1]` | PASS; onafhankelijke kwadranttelling |
| NUM-011 | Rotatie 90° | `CERTIFIED_ROOTS`, 4, `[1,1,1,1]` | PASS; `rotation` blijft de WIE-Number-invoer, geen perfecte kwartslagvervanging |
| NUM-012 | Twee verschillend geroteerde ellipsen | `NUMERIC_UNRESOLVED`, `roots:null`, budget 4.000 | PASS als gedocumenteerde solvergrens; geen rootcount geclaimd |
| NUM-013 | Identieke contouren | `COINCIDENT_CONICS`, 0 geïsoleerde roots | PASS |
| NUM-014 | Bijna-samenvallende ellipsen, translatie `2⁻⁴⁰` | `CERTIFIED_ROOTS`, 2, `[1,1]` | PASS |
| NUM-015 | Zeer nabije roots, translatie één representabele stap `2⁻⁵³` na 0,5 | `CERTIFIED_ROOTS`, 2, `[1,1]` | PASS; y-boxcentra circa `±1,0222112·10⁻⁸`, afstand circa `2,0444224·10⁻⁸` |
| NUM-016 | Roots op de projectieve chartgrens | `CERTIFIED_ROOTS`, 2, `[2,2]` | PASS; eenmaal geteld |
| NUM-017 | Cirkelvormige ellips | `CERTIFIED_ROOTS`, 2, `[1,1]` | PASS; rotation/frame-semantieken blijven brongebonden |
| NUM-018 | Ellips uit actuele focusresolver | `CERTIFIED_ROOTS`, 4, `[1,1,1,1]` | PASS; velden rechtstreeks uit `EllipseGeometry.resolve` |
| NUM-019 | Overloop/ongeldige semias | `SOURCE_INVALID`, `roots:null` | PASS; geen geometrieclaim |
| NUM-020 | Budget 8 operaties | `NUMERIC_UNRESOLVED`, `roots:null` | PASS; geen gedeeltelijke wortelset |

## 9. Foutgrenzen en conditioneringsgebied

- Input `Number`-waarden, inclusief `Math.cos/sin`-uitvoer en door focusresolver opgeloste `a/b/cx/cy`, worden exact als die dyadische waarden behandeld; er wordt geen “mooie” decimal of ideale hoek teruggeconstrueerd.
- Invoer vereist een niet-ontaarde cirkel/ellips met positieve radius/assen, geldige hoofd-asvolgorde `a≥b`, geldige WIE-`u/v`-relatie en contourbounds binnen `10¹²` modelunits.
- Rationale coëfficiënten en quartics hebben geen afrondfout binnen de solver. Root-isolatie gebruikt standaard een parameterbreedte ten hoogste `2⁻⁴⁸` (NUM-015 `2⁻⁸⁰`); de exacte gerapporteerde x/y-boxen zijn rationele omsluitingen, geen afgeronde puntclaims.
- Een bit- of operatiebudget is een researchlimiet, geen harde wall-clockdeadline. NUM-012 demonstreert veilig budgetfalen; `NUMERIC_UNRESOLVED` heeft altijd `roots:null`.
- De nabijheidsfixture scheidt wortels op ongeveer `2,04·10⁻⁸` modelunits. Dat toont deze fixture aan, geen garantie voor arbitrarily close roots; onvoldoende budget eindigt unresolved.
- A2.1's extreem-nabije rationale case vergde seconden en deze spike verkort dat niet principieel. Geen exhaustieve grenzen voor enorme offsets, dunne ellipsen, overflow, alle slechte conditionering of browsergeheugen zijn bewezen.
- Exacte rootproof geldt voor de continue conic van de opgeloste dyadische framewaarden. Een eindige `pointAt`-berekening, SVG-sampling/serialisatie en cross-browser `Math`-verschillen zijn geen onderdeel van het Sturm-certificaat.

## 10. Prestaties en vergelijking

Node v22.18.0, Windows-host; één warm-up en vijf gemeten herhalingen per profiel, zonder CPU-isolatie. Ruwe tijden en operation counts: `research/m8-int-3-a0-1/fixtures/performance-results.json`.

| Profiel | Status / roots | Mediaan | Maximum | Rationale operaties per solve |
|---|---|---:|---:|---:|
| Gewone ongeroteerde vierpuntscase | certified / 4 | 184,784 ms | 191,981 ms | 59.590 |
| Gewone 45° vierpuntscase | certified / 4 | 6.319,100 ms | 6.745,551 ms | 72.142 |
| Enkelvoudige raakfixture | certified / 1, m=2 | 1,079 ms | 1,728 ms | 1.062 |
| Vierde-ordecontact | certified / 1, m=4 | 0,916 ms | 1,266 ms | 1.218 |
| Zeer nabije wortelpair | certified / 2 | 1.112,271 ms | 1.146,528 ms | 49.481 |

A2.1 rapporteerde 113,18 ms gemiddeld voor een gewone exacte vierpuntscase en 781,41 ms voor een exact rationale dunne geroteerde ellips. De inputs zijn niet identiek; dit is context, geen gecontroleerde benchmarkvergelijking. A2.1b's circa 0,184 ms kandidaatprobe was geen gecertificeerde solver. De huidige 45°-tijd van 6,32 seconden is voor een interactieve complete solve ongeschikt en loopt ver achter op beide vergelijkingspunten. De bescheiden optimalisatie in deze spike hergebruikt een opgebouwde Sturm-reeks binnen de bisectieboom; ze verandert het proofmodel niet en bracht de geroteerde solve niet naar een bruikbare tijd.

## 11. Mogelijke vervolgstappen voor prestatie, niet automatisch gestart

1. Profileer de BigInt-/rationale PRS en vervang herhaalde rationale Euclidische delingen door fraction-free/subresultant Sturm-reeksen met positieve inhoudnormalisatie; vergelijk elke uitkomst met huidige exacte fixtures en onafhankelijke telling.
2. Normaliseer broncoëfficiënten tot primitieve gehele polynomen voordat de PRS start; meet bitgroei en operation counts per Euclidische stap.
3. Behoud numerieke isolator of intervalstart alleen als kandidaatversneller; tel globaal exact en eis lokale boxen. Een snelle kandidaatlijst blijft niet-autoritatief.
4. Bepaal vooraf een browserlatency- en annuleringsbudget; een Worker kan hoofdthreadblokkering voorkomen, maar maakt een zes seconden exacte berekening niet op zichzelf snel.
5. Blijf voor de eerste productiepoort op cirkel–ellips focussen. Vereis voor ellips–ellips eerst een volledige bounded-work certificaatroute; deze spike claimt die niet.

Geen uitgebreide optimalisatie, fuzzcampagne, browserbenchmark of productie-integratie is gestart.

## 12. Twee correcties uit A0

**Edge-testbeleid:** deze wijziging bevat geen UI- of productiecode. Geen `npm run test:edge`, andere browserregressie of volledige `npm test` is gestart. De NUM-matrix is een direct Node-onderzoekscommando, plus een aparte Node analytische oracle en vijf beperkte performanceprofielen.

**Bronvolgorde ellips–ellips:** het A-MVP-contract v1.0.0 schrijft voor ellips–ellips de **oorspronkelijke bij creatie gekozen bronvolgorde** voor. De sortering op object-ID die A0 voorstelde, spreekt dat tegen. Het bestaande normatieve A-MVP-contract blijft leidend: bronvolgorde bewaren. Er is geen identiteitsresolver geïmplementeerd.

## 13. Ondersteund gebied en resterende risico's

Bewezen subset: WIE-resolved circles/ellipses waarvan de opgeloste finite doubles binnen de bounds vallen, exact dyadisch geïnterpreteerd; volledige, niet-ontaarde conics; de hierboven geteste cirkel–ellipsgevallen inclusief vier normale rotaties, contacten, coincidentie, één nabij-paarfixture en budget-fail-safe. Ellips–ellips kan alleen als identieke contour (`COINCIDENT_CONICS`) of unresolved met deze beperkte werkbudgetproef worden geclaimd; een gewone complete ellips–ellips-rootset is niet aangetoond.

Resterende risico's zijn: rootcoëfficiënt-/PRS-bitgroei en secondenlatentie bij rotatie; verschil tussen de continue opgeloste conic en eindige `pointAt`/SVG; niet-geformaliseerde runtime-libm-provenance; beperkte onafhankelijke implementatie van alle posities/multipliciteiten; afwezigheid van harde wall-clockinterruptie; nog niet gedemonstreerde ellips–ellipscertificering.

## 14. Advies voor M8-INT.3-B

**NO-GO voor productiecode B op basis van deze gate.** De resultaten bewijzen dat exacte dyadische algebra de gewone cirkel–ellipsrotaties volledig kan tellen en isoleren, inclusief 15°/45°/60°, maar de representatieve 45° solve van 6,55 s is geen praktische interactieve route. De twee verschillende ellipsen zijn met het begrensde prototype ook niet gecertificeerd. De huidige proef laat dus het numerieke idee slagen en de productiegate niet.

Een volgende, afzonderlijk geautoriseerde researchgate moet eerst een fraction-free/subresultant exact isolator demonstreren met dezelfde volledige onafhankelijke fixturedekking, een afgesproken browserlatencybudget en fail-closed annulering. Ellips–ellips blijft uit de eerste scope totdat een vergelijkbare complete route bewezen is. Ook na een positieve numerieke gate is een afzonderlijke gebruikers-GO nodig vóór productie-implementatie. Deze opdracht start geen volgende fase.

## 15. Tests en verificatie uitgevoerd

- `node research/m8-int-3-a0-1/run-matrix.cjs`: **20/20 assertions PASS**, direct opnieuw uitgevoerd na solverwijzigingen. Volledige suite/Edge/browserregressies niet uitgevoerd.
- `node research/m8-int-3-a0-1/independent-oracles.cjs`: analytische 15°/45°/60°/90° vier-root-checks en fourth-order identiteitscheck PASS.
- `node research/m8-int-3-a0-1/performance.cjs`: vijf profielen, telkens één warm-up plus vijf herhalingen; alle vijf bleven op de verwachte gecertificeerde status/rootcount.
- Eén eerdere matrixpoging werd na NUM-011 onderbroken toen een verschillende ellips–ellips-case langer dan 15 seconden bleef rekenen. De fixture kreeg daarna een klein expliciet budget van 4.000 operaties; de definitieve complete matrix eindigde veilig op `NUMERIC_UNRESOLVED` met `roots:null`.
- Een test ontdekte dat budgetuitputting tijdens exacte bronopbouw aanvankelijk als `SOURCE_INVALID` werd gerapporteerd. Dit is in de researchfunctie gecorrigeerd; de definitieve NUM-020 controle bevestigt `NUMERIC_UNRESOLVED`, `roots:null`.
- Niet uitgevoerd: `npm test`, `npm run test:edge`, volledige browserregressie, langdurige stress/fuzzing, handmatige UI-acceptatie of productietests. Dit is een geïsoleerde research-spike; geen UI-wijziging.

**Eindstatus:** onderzoeksartefacten en rapport zijn klaar voor review. Geen productiecode, schema, identiteit, UI of roadmap aangepast; geen merge naar `main`; geen automatische start van M8-INT.3-B.
