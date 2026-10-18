# T5b MathLive POC — evaluatie

**Branch:** `test/t5b-mathlive-poc`  
**Basis:** `origin/develop` — `ff62099f851454846bb442f28b790f33cedb02c0`  
**Doel:** geïsoleerd onderzoeken hoe MathLive kan aansluiten op T5b; geen productie-integratie of documentmutaties.

## Uitkomst

De POC toont dat MathLive als formule-invoer kan werken met zowel de CortexJS Compute Engine als de bestaande WIE T5a `ExpressionEngine`. Beide routes geven voor de vier beperkte voorbeelden dezelfde numerieke uitkomst binnen tolerantie: `2+3×4`, `√81`, `sin(30 deg)` en `π×2²`.

**Aanbeveling: variant B als vervolgrichting.** Gebruik MathLive voor de invoerervaring en stuur gevalideerde, beperkte invoertokens naar de bestaande T5a-parser en evaluator. Dat behoudt WIE's bestaande getypeerde quantities, eenheden, foutcodes, hoekopties en route voor geautoriseerde geometrische bronnen. De MathLive-output wordt niet rechtstreeks als vertrouwde AST behandeld. De POC-adapter normaliseert alleen de ASCIIMath-spelling `d e g` naar `deg`, waarna de T5a-parser alle syntaxis opnieuw whitelist.

Variant A is nuttig voor snelle, brede formule-evaluatie en symbolische mogelijkheden. De Compute Engine accepteert een ander en ruimer expressiemodel, zodat numerieke, dimensionele, trigonometrische en foutsemantiek opnieuw op het WIE-contract afgestemd en gevalideerd moeten worden. Een aparte Compute Engine-evaluator in productie zou de eis van één gedeelde T5a-rekenkern doorbreken; een vertaling naar de T5a-AST zou alsnog een beveiligde adapter vereisen.

## Vergelijking

| Eigenschap | A — MathLive + Compute Engine | B — MathLive + WIE T5a |
|---|---|---|
| Invoer | MathLive `<math-field>`; uitgebreide LaTeX naar Compute Engine | Dezelfde MathLive-invoer; ASCIIMath naar beperkte adapter en T5a-parser |
| Rekenuitvoer | Compute Engine numerieke benadering; kan daarnaast exact/symbolisch rekenen | T5a quantities en bestaande binary64-/domeinregels |
| WIE-eenheden en geometriebronnen | Niet aangesloten in deze POC; vereist aparte dimensionele en autorisatieadapter | Bestaande AST, eenheden en `ExpressionSources` blijven eigenaar; hostadapter zelf is hier niet aangesloten |
| Parsergrens | Parseert LaTeX volgens Compute Engine-regels; ruimer dan T5a | Bestaande strikte T5a-grammar weigert niet-toegestane output |
| Verschil dat zichtbaar is | Resultaat als ruwe decimale tekst | WIE-formattering gebruikt Nederlandse komma en `≈` bij afronding |
| Productierisico | Dubbele rekensemantiek, scopegroei en nieuwe bron-/unitadapter | ASCIIMath-naar-T5a-conversie moet expliciet begrensd, getest en onderhouden worden |
| Oordeel | Geschikt als zelfstandige rekenmotor voor andere doelen; geen directe vervanging van T5a | Beste aansluiting op T5b's bestaande architectuur, mits de inputadapter wordt gevalideerd |

MathLive levert zelf een bewerkbaar mathfield en virtueel toetsenbord. De POC gebruikt geen MathLive-rekenmachinewebsite of iframe; hij gebruikt de officiële lokale `mathlive`-package. De voorbeeldset bewijst geen volledige MathLive-/T5a-pariteit, eenheden, typed source-chips, bronrechten, clipboard, focus-/fullscreen-lifecycle, IME of screenreaderbediening.

## Architectuur en afbakening

Alle POC-bestanden en de vastgepinde packages staan onder `experiments/t5b-mathlive-poc/`. De pagina laadt alleen de drie T5a-modules die nodig zijn voor vergelijking en maakt geen wijziging aan `editor.html`, productiecode, scripts, documentversies, schema's, exports of permissies. De kleine statische server stelt alleen de experimentbestanden en deze drie expliciet toegestane read-only WIE-modules beschikbaar.

Versies: MathLive `0.111.1`, Compute Engine `0.156.0`, Playwright `1.62.1`. MathLive en Compute Engine zijn MIT-gelicentieerd. De POC verandert geen WIE-bestand en geen editor-/documentstatus.

## Gerichte validatie

| Controle | Resultaat |
|---|---|
| `npm run test:poc` | 2/2 Node-tests PASS: vier dimensionless/hoekvoorbeelden voor T5a en Compute Engine |
| `node test/browser-smoke.cjs` | 4/4 voorbeelden voor beide routes PASS in headless Edge; page errors leeg |
| `npm install` audit | 0 kwetsbaarheden gemeld voor deze geïsoleerde dependency-set |
| Volledige Node-/Edge-suite | Niet uitgevoerd; buiten POC-scope |

De Edge-proef werd gericht met verhoogde procesrechten uitgevoerd nadat sandbox-Edge de tijdelijke browserprofielmap niet kon maken. De eerste POC-run vond een MIME-typefout voor `.mjs` en een ASCIIMath-afwijking (`d e g`); beide zijn in de POC-server/adapter hersteld. De uiteindelijke proef dekt alleen de benoemde voorbeelden.

## Volgende poort

Deze POC geeft geen starttoestemming voor T5b-productiecode. Het branchresultaat wordt gepusht voor review; er is geen automatische merge. Beoordeel eerst deze variantkeuze en POC. Vereiste T5b-UX-, privacy-, bronrechten-, lifecycle- en regressiecriteria blijven van kracht voor een latere implementatieopdracht.
