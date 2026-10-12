# T4 — Afwerking, wrapping en productie-export

Versie 1.0.0, 2026-10-12. Repository Geert1985/wiskundige-illustratie-editor; branch chatgpt/editor-development. Baseline: `10e7c48ceec8cea168395608a01369efe6158279`.

Uitgevoerd na expliciete opdracht “voer T4 uit”. Vooraf vastgelegd contract: [T4-CONTRACT.md](T4-CONTRACT.md). **Technisch opgeleverd voor gebruikersacceptatie; T5 is niet gestart.** Groene automatische tests vervangen geen handmatige IME/AT- of finale productacceptatie.

## Wat is geleverd

- Optionele Breedte (px) in de teksteditor: leeg betekent automatisch; vaste breedte wrapt gewone tekst bij whitespace en lange woorden op graphemegrenzen. Formules en bronvelden blijven ondeelbare atomen en mogen zichtbaar overlopen. Alinea's, hardBreaks, gemengde fonts/sizes, scripts, kleuren, alignment en rotatie blijven behouden. Text-width is formatdata in bestaande schema 1–3, geen nieuwe documentversie.
- Width is onderdeel van de ProseMirror-draft en lokale undo/redo. Cancel is privé; buitenste OK blijft één text.commit/documenthistoryactie met bestaande rechten/revisie/epoch/locks. Width vereist formatrechten. De adapter gebruikt de opgeslagen defaultfont/grootte/kleur; glyphbounds volgen de bestaande screen-space-selectie zonder anchorverplaatsing.
- PNG exporteren naast SVG exporteren in Meer. Gedeelde ExportService bereidt lokale math/fonts voor, levert zelfstandige SVG en begrensde PNG. Beide vereisen document.exportSVG; PNG is een afgeleide uitvoer, geen nieuwe grant of command bypass. Geen automatische wijziging van documentmeta bij beeldexport. Afwezige lege legacy-metadata blijft ook bij opslaan afwezig.
- De deliveryguard controleert documentrevisie, permission epoch, requestserial, viewport en editorlevenscyclus. Verouderde/ingetrokken export wordt niet gedownload. Rasterafmetingen/schaal worden vóór allocatie gevalideerd; fouten zijn zichtbaar en Blob-URLs/tijdelijke DOM worden opgeruimd.
- Focus keert terug na annuleren/sluiten; dialogen scrollen binnen de viewport. Keyboard/Tab, Escape zonder fullscreenexit en responsive 1280/390-screenshots zijn gecontroleerd. Bestaande T1–T3- en geometriefuncties blijven aanwezig.

## Fontcorrectie en PNG-pipeline

De vergelijking met native SVG en CSS-validatie ontdekten bestaande problemen: Chromium Image-decoding gebruikte fallbackletters ondanks embedded SVG-webfonts. Fontnamen met numerieke delen (Source Sans 3/Source Serif 4) stonden bovendien op enkele plaatsen ongequote en waren ongeldige CSS. Deze namen zijn nu gequote in de SVG- en editorpresentatie, zonder legacy-documentstrings te wijzigen. Alleen een technisch decodeerbare PNG was onvoldoende bewijs van fontkwaliteit.

SVG blijft bewerkbare native tekst met ingesloten lokale fonts, inclusief bestaande tekst/labels. PNG meet geautoriseerde native SVG-tekst met de daadwerkelijk geladen lokale fonts, maakt per text-element een tijdelijke transparante bitmap op dezelfde glyphposities en vervangt dat element **in-place**. Daarna rastert de gewone SVG→Image→canvas-route geometrie en formulepaden. Dit behoudt laagvolgorde, parentopacity en transformaties en vermijdt een tweede glyphparser. Hogere PNG-schaal verhoogt ook de interne tekstrasterresolutie. De bitmaps zijn private intermediates: geen JSON/cache, geen wijziging aan publieke SVG, geen foreignObject of nieuwe dependency.

Rasterlimieten: maximaal 8192 px per zijde, 16777216 outputpixels, schaal >0 en ≤4. Aanvullend maximaal 16777216 tijdelijke tekstpixels en 65536 graphemes. Een te groot tekstbitmapvlak of niet-verliesvrije native karakterindex wordt expliciet geweigerd. Decode-timeout is 30 s; null/error toBlob faalt duidelijk. Complexe shaping buiten de bestaande lokale fontdekking is niet volledig bewezen.

## Werkelijk uitgevoerde verificatie

Windows; Node 22.18.0, npm 10.9.3; headless Edge 155.0.4283.45. Machinebewijs: [T4-verification.json](../experiments/text-editor-build/T4-verification.json). Ruwe logs in genegeerde test-results/t4-node-full.log en t4-edge-full.log; gerichte runs eveneens uitgevoerd.

| Run | Definitief resultaat |
|---|---|
| npm test | **449/449 PASS**, exit 0; fail/cancelled/skipped/todo allemaal 0; 10119.0557 ms |
| npm run test:edge | **50 modules plus hoofdproef PASS**, exit 0; pageErrors leeg |
| Nieuwe Node-module text-editor-t4.test.cjs | 12 tests in volledige suite |
| T4 Edge-module browser-rich-layout.cjs | 16 benoemde controles PASS, plus pixel-, font-/laag- en meetproeven |
| npm run build:text | Exit 0; geen dependencies geïnstalleerd |
| git diff --check | Geen whitespacefouten |

Node-dekking: width/content/anchor/rotation/JSON, graphemegrenzen, indivisibele math/bronwaarden, scriptmetrics/alignment/breaks, formatclassificatie/validatie, rasterbudgets, geldige gequote SVG-fontnamen zonder legacy-opslagwijziging, stale SVG-readiness, decode/null-blob-URLcleanup, revoked delivery, restricted formatgrant/undo/atomiciteit en numeric-SVG-tests zonder base64-falsepositive.

Edge-dekking: mixed wrapping en defaultfont, atomic values/math, width-local-history, Cancel/focus, documentundo/redo, fullscreen/Tab/Escape, echte offline SVG/PNG-downloads, export zonder documentmutatie, rasterlimitfout, toegankelijke labels, responsive dialogen, restricted redactie, grantdenial en epochwijziging vóór delivery. De volledige suite herhaalt daarnaast T1/T2/T3, legacy-import/save/reload, bronmutaties, permissies, groepen/lagen, geometrie, unit/angle notation en bestaande exportpaden.

### Exacte meetresultaten

- Herhaalde productie-PNG-rastering: 2496000 RGBA-bytes vergeleken, **0 verschillen**. Dit bewijst deterministische herhaling, geen pixelidentiteit met browser-tekst-antialiasing.
- Native SVG-screenshot versus PNG bij dezelfde 1000×624-afmetingen: 2724/624000 pixels boven kanaaldelta 16 (**0.4365%**); gate <1% over het gehele frame. Kleine antialiasverschillen blijven zichtbaar. Een witte achtergrond maakt deze maat minder streng dan een glyph-only vergelijking; geen perfecte glyph-/wereldschriftgelijkheid geclaimd.
- Vijf lokale faces (sans regular/bold/italic/bold-italic, serif regular) gerasterd bij schaal 2, 37° rotatie, underline, super/subscript, Latin/Greek/combining: alle vijf PNG's decodeerbaar, 82036–86541 bytes. Deze matrix bewijst renderbaarheid, niet volledige handmatige fontacceptatie.
- Laagtest: rode tekst achter zwart vlak **0** rode pixels; tekst vóór dat vlak **407** rode pixels.
- Offline downloadfixture: PNG 43752 bytes. De oudere rechtstreekse SVG→Image-reference telt 2884 inkpixels; die route is geen fontreferentie voor de gecorrigeerde productie-PNG.
- Warm mixed-layoutgemiddelde over 100 uitvoeringen: 0.0830 ms. Pagina DOMContentLoaded 272.40 ms, 40 scriptresources / 4748953 transferbytes in deze lokale run. Geen brede hardwarebenchmark of algemene performancegarantie.
- Editorbundle 217605 raw / 67752 gzip; SHA-256 `7514cd92ef28adb5f1e6795545608be7bbff527695ceb52fe593ad475fbdff80`. Mathbundle ongewijzigd: `4428d112a106fa821f941475ba868dd674b4f9ca142335f6c0d23c7cca0b1815`.

Screenshots zijn daadwerkelijk bekeken: [1280 editor](../experiments/text-editor-build/t4-editor-1280.png), [390 editor](../experiments/text-editor-build/t4-editor-390.png), [PNG-export](../experiments/text-editor-build/t4-export.png), [native SVG-reference](../experiments/text-editor-build/t4-native-canvas.png).

## Gevonden en opgeloste fouten

Width werd opgeslagen maar nog niet gebruikt door de renderer. Dat pad gebruikt nu mixed layout/wrapping. De adapter bewaart width in lokale documentattrs/history en gebruikt de juiste defaultfont. Beeldexport vulde onbedoeld ontbrekende lege metadata in; dat gebeurt niet meer. Save behoudt diezelfde legacyafwezigheid. De CSS-fontfamilies zijn gevalideerd en gequote; de PNG-route is onafhankelijk van Image-webfontloading gemaakt met native-font-bitmaps met behoud van SVG-laagvolgorde. Nieuwe exportcode is geregistreerd in de scriptdependency-/architecturemanifesttests.

Oude tests zochten NaN/Infinity over het hele SVG-bestand en vonden toevallige letters in base64-fontbytes, nu fonts ook in legacy/label-export zijn ingebed. Die controles sluiten uitsluitend data:font/ttf-base64-payloads uit; numerieke SVG-waarden en de overige overlay/leakchecks blijven gecontroleerd. Een nieuwe Node-test bewijst dat echte x1="NaN" nog wordt ontdekt. De bestaande geometry.svg-goldenfixture is uitsluitend aangepast voor gequote font-family-attributen; geometrie/coordinaten en de strikte XML-vergelijking blijven behouden. Geen functionaliteit is verwijderd om tests te laten slagen.

## Handmatige acceptatie en beperkingen

**NIET UITGEVOERD:** echte Windows-IME-compositie, schermlezer/AT, OS-clipboard/externe SVG-viewers, fysieke apparaat-/font-/touchacceptatie en complexe wereldwijde shaping buiten de bestaande fontdekking. Geautomatiseerde keyboard/labels/screenshots vervangen dit bewijs niet. Unsupported/overgrote native tekst kan PNG expliciet laten falen; SVG blijft beschikbaar. Pixels/fontantialiasing verschillen per viewer/platform.

1. Herlaad editor.html (F5) om cachetoken text-t4-1 te laden. Maak tekst met gewone woorden, formule en dynamische bronwaarde. Zet Breedte op 180 en daarna 90; gewone tekst moet herlopen, velden/formules heel blijven. Maak leeg voor automatische breedte.
2. Test lokale undo/redo van de breedte; Cancel verandert het document niet. Bevestig en controleer één documentundo/redo. Sleep een bronpunt/wijzig de straal en controleer actuele veldwaarde, glyphbounds en dezelfde tekstpositie.
3. Exporteer via Meer naar SVG en PNG, ook offline. Vergelijk fonts, kleuren, scripts, rotatie en tekst achter/vóór een vlak. Open SVG ook in de viewer die je werkelijk gebruikt.
4. Open de teksteditor in fullscreen; Tab/focus en kindpaneel-Escape moeten werken. Escape sluit de teksteditor zonder fullscreenexit. Test op kleine viewport en met jouw IME/schermlezer indien van toepassing.

Wacht op T4-gebruikersacceptatie. T5a vereist daarna nog definitieve rekencontractgoedkeuring en expliciete starttoestemming; de functioneel goedgekeurde zelfstandige/inline-calculator is uitsluitend ontwerp.

## Commitregistratie

De geteste T4-implementatie staat in commit `1f3c0854371cf5144bb547d3a4f93d8b087153ed`. Deze verslagcommit bevat uitsluitend de SHA-registratie en het bijgewerkte machineleesbare testbewijs. De volledige testsuite is uitgevoerd op de genoemde implementatiecommit.
