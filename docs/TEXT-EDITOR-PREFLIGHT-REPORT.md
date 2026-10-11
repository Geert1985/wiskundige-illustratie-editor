# Teksteditor — P0-tech proefrapport

Versie 1.0.0 — 2026-10-11. Repository: Geert1985/wiskundige-illustratie-editor. Branch: `chatgpt/editor-development`. Uitgangspunt: c18e44bb82fa336abca876a1e2348d68ea43d2bf; architectuur en plan 1.1.0. De gebruiker heeft uitsluitend P0-tech toegestaan.

**Conclusie:** de automatische ProseMirror-interactieproef is geslaagd. SVG-text met lokale, ingesloten fonts is de aanbevolen renderkandidaat voor verdere beoordeling. De geteste glyphpadroute met OpenType.js 2.0.0 is afgekeurd wegens niet-eindige SVG-coördinaten, zichtbaar tekstverlies en kerningafwijkingen. **Geen volledige technische goedkeuring:** echte OS-IME en handmatige schermlezercontrole zijn niet uitgevoerd; volledige baseline-/selectieafwerking is nog niet bewezen. T1 is niet gestart.

## 1. Scope, bestanden en reproduceerbaarheid

Alle prototypecode, lokale package/lock, dependencies, fonts, fixtures, scripts en resultaten staan in [experiments/text-editor-preflight](../experiments/text-editor-preflight/README.md). Geen productie-entrypoint importeert deze map. Root package.json/package-lock, model, renderer, editor en runtime zijn niet gewijzigd. De bestaande ongetrackte FEATURE-GAP-ANALYSIS.md is buiten scope gebleven.

Belangrijkste bestanden: content.cjs (eigen prototype-opslag), adapter.js (ProseMirror-adapter), render.js (A/B-fontweergave), probe.js/index.html/style.css (geïsoleerde demo), build.cjs, acquire-fonts.cjs, tests/content.test.cjs, tests/edge.cjs, reproduce-path-defects.cjs en summarize.cjs. Er is geen echte geometrybinding, v6-migratie, text.commit, permissie-implementatie of calculator toegevoegd.

Reproductiecommando's in de README. `npm.cmd ci` gebruikt uitsluitend de lokale package-lock; fontacquisitie gebruikt opgenomen upstream commits en SHA256. Dist, npm-cache/node_modules en de 72 volledige rastermatrixbestanden zijn genegeerd; deze worden opnieuw gegenereerd. Geselecteerde beelden/SVGs, hashes, ruwe timingdata en logs zijn bewaard. Geen runtime-CDN.

## 2. Machine, dependencies en licenties

| Onderdeel | Werkelijk gebruikt |
|---|---|
| OS/CPU | Windows build 10.0.26200, x64; AMD Ryzen 7 5800H; 16 logische cores; 15,35 GiB RAM |
| Node/Edge | Node v22.18.0; geïnstalleerde Microsoft Edge 155.0.4283.45, headless, deviceScaleFactor 1 |
| ProseMirror | model 1.25.12; state 1.4.4; view 1.42.6; commands 1.7.2; history 1.5.1; keymap 1.2.3; transitive transform 1.12.2 |
| Render/bouw/test | OpenType.js 2.0.0; esbuild 0.28.2; pngjs 7.0.0; Playwright 1.62.1 |
| Code-licenties | ProseMirror/OpenType.js/esbuild/pngjs en genoemde transitieve editorlibraries MIT; Playwright Apache-2.0. Exacte tree/licenties in results/build.json en package-lock.json |
| Sansfonts | Source Sans 3 **3.052**, Regular/Bold/Italic/BoldItalic; Adobe source-sans commit 87b37a2daaed80fcb8e8ccb0085c4d72ddade12e |
| Serif | Source Serif 4 **4.005**, Regular; Adobe source-serif commit 80d3f8894c09c937bebfa9011247d2e1c79fd6f4 |
| Fontlicenties | Originele OFL-licentieteksten naast ongewijzigde TTF-bestanden; URLs/hash/bytes in fonts/manifest.json |

Fonts zijn lokaal verworven, niet in Windows geïnstalleerd. De proef bewijst geen volledige serif-facecollectie of globale schriftdekking. Licentieteksten blijven bij distributie nodig; T1 moet ook exportmetadata/licentieverspreiding expliciet afwerken. Primaire referenties: [ProseMirror guide](https://prosemirror.net/docs/guide/), [OpenType.js repository](https://github.com/opentypejs/opentype.js), [Adobe Source Sans](https://github.com/adobe-fonts/source-sans), [Adobe Source Serif](https://github.com/adobe-fonts/source-serif). Gemeten bevindingen komen uit deze proef, niet uit productclaims van de libraries.

## 3. Exacte testresultaten

| Uitgevoerde run | Geslaagd | Mislukt | Overgeslagen / niet uitgevoerd |
|---|---:|---:|---:|
| Geïsoleerde Node-tests | 7 | 0 | 0 overgeslagen |
| Bestaande productie-Node-suite, ongewijzigde code | 364 | 0 | 0 overgeslagen |
| Finale echte Edge-proef, 25 benoemde checks | 24 | **1** | 0 automatische checks overgeslagen |
| Vereiste handmatige controles | 0 bewezen | — | **2 niet uitgevoerd:** echte OS-IME en schermlezer |

Edge exitcode is 1 door de expliciet falende glyphpadcheck. Die failure blijft zichtbaar in de runner; PNG-creatie zonder exception wordt niet als glyphvolledigheid geïnterpreteerd. Geen volledige PASS voor P0-tech. De bestaande volledige productie-Edge-suite is deze stap niet opnieuw gedraaid; de eerdere fase-0-run is historisch bewijs, geen nieuwe testclaim.

Bewijs: [finale Edge-resultaten](../experiments/text-editor-preflight/results/edge.json), [samenvatting](../experiments/text-editor-preflight/results/summary.json), [proef-Node-log](../experiments/text-editor-preflight/results/node-tests.txt), [baseline-Node-log](../experiments/text-editor-preflight/results/baseline-node.txt). Exacte cases, browsererrors, netwerkrequests en timingreeksen zijn daarin opgenomen.

Eerste run: 17 checks geslaagd/3 mislukt; daarvan betroffen twee testverwachtingen/synchronisatie (italic-toggle op reeds cursieve selectie en native selection-eventtiming) en één Escape-routing. De prototype-Escape-handler is vervolgens expliciet laagbewust gemaakt. Eerste render-medianen 123,25 ms (text) en 600,85 ms (path) overschreden het budget. Metric-/pathcaching en lokale padtransforms verbeterden de warmtest. De eerste en tussenruns blijven bewaard als edge-initial.json, edge-before-escape.json en edge-before-standalone.json; het rapport gebruikt de finale run, geen geselecteerde gunstigste timing.

## 4. Render-/fontproef: methode en resultaat

Kandidaat A: browser-native SVG-text met font-face-data-URLs; één fontdefinitie per gebruikte face per zelfstandige SVG. Kandidaat B: OpenType.js-shapes naar SVG-path met lokale translate-transforms en cached metrics/paths; geen externe fontassets in de geëxporteerde paden.

Hetzelfde corpus voor beide: Nederlandse accenten, decomposed e+acute, Grieks αβθΩπ, ≤≥±×÷, AV/To/Wa/fi/ffi, lange tekst, mixed faces, super/sub, multiline en lege ruimte. Vijf faces; alle vier inhoudsgroepen tegen alle faces in een aanvullende 20-object-rasterfixture. Volledige matrix: **36 combinaties** (12/16/32 eenheden × 0/37/90° × 44/100/163/400% zoom), beide kandidaten: **72 PNGs**. Representatief bewijs in [corpus-text.png](../experiments/text-editor-preflight/results/corpus-text.png), [corpus-path.png](../experiments/text-editor-preflight/results/corpus-path.png), [alle faces A](../experiments/text-editor-preflight/results/all-faces-text.png), [alle faces B](../experiments/text-editor-preflight/results/all-faces-path.png).

Onondersteunde 😀 wordt voor alle vijf faces en beide renderkandidaten expliciet met UNSUPPORTED_GLYPH geweigerd; geen stille OS-emoji-fallback. ProseMirror-opslag bewaart dat codepunt wel correct. Omdat editor en renderer geïsoleerd zijn, is een complete eindgebruikersflow voor deze weigering nog geen gerealiseerde T1-functie. Fontdekking/fallbackbeleid blijft een expliciet productbesluit.

### Afmetingen, kerning en beeldvergelijking

- Native SVG-advance versus Canvas-fontreferentie bij AV/To/fi en alle faces/sizes: maximale afwijking **0,198%**, onder de 1%-norm. OpenType-pathadvance maximaal **9,762%**, dus afgekeurd. Voor Regular 16: AV native 16,719986 versus path 16,944; To native 16,191986 versus path 17,248.
- Zelfstandige SVG in een verse Edge-pagina, met externe requests geblokkeerd: dezelfde A-bounds als inline bij 16 eenheden (468,537079 × 503), exact dezelfde B-bounds (470,825562 × 499,279999). B-gelijke bounds bewijzen geen inhoudsvolledigheid; die output bevat verloren glyphs.
- Baselineposities worden door hetzelfde prototype-SVG vastgelegd; programmatic translation verandert noch inhoud noch relatieve y-posities/bounds. De gecombineerde inhoudsgroep wordt gemeten, niet alleen het eerste text-element. Dit bewijst de prototype-anchorinvariant, **niet** productie-selectie/drag/rotatie-integratie of onafhankelijk subpixel-baselinebewijs voor alle gevallen. Die harde afwerking blijft open.
- Inline A-screenshot versus A-export-PNG bij 12/16/32, 100%/0°: maximaal **3,060%** verschil over alle pixels met kanaaldelta >16; na 3×3 ink-boundary-exclusie maximaal **0,1273%**. Dat ligt onder de 1%-norm buiten de verklaarde antialiasrand. De ink-relatieve verschillen zijn hoog (tot 71,17% bij dunne kleine tekst): de randmaskering is een meetheuristiek en geen bewijs van perfecte glyphgelijkheid. B-inline en B-PNG hebben 0 pixelverschil in die controles, maar vertonen hetzelfde tekstverlies.
- De 36 transformgevallen zijn daadwerkelijk gerasterd en A/B-vergeleken. A/B-visuele equivalence is niet geslaagd door B-glyphverlies/kerning; die failure wordt niet door kleine procentuele verschillen in een witte canvasachtergrond overstemd.

Visueel geïnspecteerd: opgeslagen A/B-corpusbeelden en responsive demo. A toont de Nederlandse/Griekse tekst en scripts; B laat delen van regels weg. Geen claim van visuele handcontrole op alle 72 afbeeldingen, andere platforms of alle Unicode-schriften.

### Glyphpaddefect: reproduceerbaar negatief bewijs

[path-defects.json](../experiments/text-editor-preflight/results/path-defects.json) en reproduce-path-defects.cjs tonen dat de pathcommand-inputs finite zijn, maar `toPathData(3)` bij bepaalde strings NaN schrijft. Minimal Regular-prefix: `Nederlands: café, naïe`; Serif: `Nede`. Ook Bold/BoldItalic reproduceren de serialisatiefout; losse individuele tekens volstaan niet altijd als reproducer.

Bij inspectie van OpenType.js 2.0.0 dist-code gebruikt roundDecimal een stringgebaseerde exponentverschuiving op het fractionele deel. Dat is een mogelijke verklaring bij waarden dicht bij gehele coördinaten; de proef bewijst de foutgrens **finite commands → niet-finite serialisatie**, geen volledig geaudite oorzaak of libraryfix. Er is geen custom serializer, alternatieve fontparser, andere OpenType.js-versie of HarfBuzz-shapingproef uitgevoerd. De afkeuring geldt voor deze concrete route, niet voor ieder denkbaar glyphpadrenderer.

### Bestandsgrootte

Bytes, inclusief ingesloten gebruikte fonts voor A; raw/gzip. Unieke corpusvariant voegt per object een index toe. Ieder object blijft onder 200 tekens.

| Objecten | A herhaald | A uniek | B herhaald | B uniek |
|---:|---:|---:|---:|---:|
| 1 | 576361 / 255124 | 576367 / 255128 | 30164 / 10785 | 30661 / 10937 |
| 10 | 2351873 / 1043224 | 2351906 / 1043286 | 282264 / 98140 | 288067 / 100203 |
| 100 | 2443689 / 1047685 | 2444235 / 1048903 | 2872130 / 987699 | 2986043 / 1028960 |

Beide finale 100-objectexports blijven onder 3 MiB raw. A heeft vaste fontoverhead, maar dupliceert fonts niet per object/run. Fontassets apart: **1755752 bytes raw**, **837623 bytes gzip** (vijf TTFs). Ingesloten base64-fontdata maakt de SVG groter dan de oorspronkelijke fontbytes. B's omvang is geen voordeel dat inhoudsverlies kan rechtvaardigen.

### Bundles en performance

| Bundle / meting | Resultaat |
|---|---:|
| Alleen editoradapter + ProseMirror | 214102 bytes raw; **66985 bytes gzip** (<250 KiB) |
| Renderer/OpenType-experiment | 250243 raw; 70484 gzip |
| Gehele proef | 466485 raw; 138467 gzip |
| Koude fontacquisitie in pagina + parsing/load | **400,90 ms**; localhost en deze machine |
| A 100-object warm lay-out/render | mediaan **36,90 ms**, P95 **45,90 ms** |
| B 100-object warm lay-out/render | mediaan **47,95 ms**, P95 **52,00 ms** |

20 ruwe runs per kandidaat, één warmup, mediaan middelste twee, nearest-rank P95; SVG maken, DOM invoegen en getBBox om layout af te dwingen. Geen rastertijd/interaction paint in deze warmmeting; cold netwerk over internet is niet gemeten. Budget ≤100 ms mediaan/≤200 ms P95 gehaald op deze machine, niet automatisch op tragere apparaten. Prototypecaches zijn onbegrensd; productie vraagt lifecycle-/permission-/quota-aware caches.

Offline bewijs: **0 externe assetrequests**, **0 page errors**, PNG-canvas niet tainted; zelfstandige SVG opent met fonts/semantische desc in een verse pagina. B kan ondanks malformed paths openen: dat is geen succesvolle inhoudsexport. Font-face embedding/licenties/assets zijn reproduceerbaar vastgelegd. Selecteerbare SVG-text is onderhoudbaar en toegankelijker te inspecteren dan paths; echte schermlezeruitspraak is nog niet bewezen.

## 5. ProseMirror-proef

Alle onderstaande automatische cases zijn in echte Edge uitgevoerd; fake math/dynamicValue/calculatedValue-atomen gebruiken geen productiebronnen.

| Criterium | Resultaat en bewijsgrens |
|---|---|
| Fragmentselectie | Geslaagd: forward/backward, cross-paragraph, native muisselectie, marks alleen op selectie, toolbarbookmark |
| Cursor | Geslaagd: native Ctrl+Home/Home/End/Shift+Arrow, delete/backspace en beweging naast atomen; Unicode/combining input blijft intact |
| Inlineatomen | Geslaagd: node selection, hele atom wissen, API-move, **native drag/drop**, dubbelklik/heropenen en payloadwijziging; bronpayload blijft bij gewoon typen behouden |
| IME | **Niet uitgevoerd:** echte OS-IME-compositie/undo. Headless keyboard.insertText is geen vervanging; geen synthetic-event-PASS geclaimd |
| Plakken | Geslaagd via ClipboardEvent/DataTransfer in Edge: plain multiline, rich bold, script/URL/CSS/unknownattrs verwijderd, oversized paste atomair geweigerd. OS-clipboardhardwarepad niet bewezen |
| Lokale history | Geslaagd: native Ctrl+Z/Y in draft; Cancel oorspronkelijke hostbytes/0 acties; OK één gesimuleerde hostactie en heropenbare eigen inhoud |
| Fullscreen/dialog | Geslaagd voor CSS-canvasmodus: palet-Escape, dialog-Escape, modus blijft; bookmark/focus hersteld. Browser/OS-native fullscreen niet getest |
| Responsive | Geslaagd bij 390/760/1159px: dialog binnen viewport, knoppen bereikbaar; screenshots bewaard |
| Onafhankelijke opslag | Geslaagd: eigen JSON→PM→eigen JSON canonical gelijk voor tekst/marks/alinea's/hardBreak/drie atomtypes; Node-reader werkt zonder PM-dependency |
| Toegankelijkheid | Alleen gedeeltelijk bewijs: DOM accessibility tree heeft editor/knop/atomnamen; handmatige schermlezercheck **niet uitgevoerd** |
| Omvang/build | Geslaagd binnen budget; gepinde lokale modules/lock, reproduceerbare build/hashes |

De adapter hernummerde p/r-ID's op positie. Het bewijst geen productie-IDstabiliteit, text.commit, bronremapping, v6-migraties, restricted redactie of semantische replay. Hosthistory is gesimuleerd, de echte applicatiehistory is niet geïntegreerd. Dat is de bedoelde P0-tech-scope, geen voltooide T1-functionaliteit.

## 6. Acceptatiestatus en aanbevolen keuzes

| Technische keuze | Aanbeveling | Goedkeuringsstatus |
|---|---|---|
| ProseMirror | Aanbevolen als vervangbare invoeradapter op grond van automatische interacties en omvang | **Voorwaardelijk**, echte IME/schermlezer blijven harde open punten |
| Native SVG-text + ingesloten fonts | Aanbevolen renderkandidaat voor verdere goedkeuring: juiste kerning, offline output en haalbare omvang/performance | **Voorwaardelijk**, volledige baseline/selection/accessibility en Unicodebeleid nog afwerken/beoordelen |
| OpenType.js 2.0.0→toPathData(3) met deze TTFs | Niet gebruiken als goedgekeurde T1-exportbasis | **Afgekeurd**: NaN/glyphverlies en kerning >1% |
| Source Sans 3 / Serif 4 | Bruikbare proefassets voor geteste tekens; geen volledige fontcatalogus of fallbackkeuze | Voorstel; overige seriffaces/emoji/complex scripts niet bewezen |
| Formulerenderer | Geen keuze gemaakt; valt onder aparte T2-proef | Niet onderzocht in P0-tech |

Deze proef is voldoende uitgevoerd om kandidaten en blokkades te onderscheiden, maar niet voldoende om alle harde criteria af te tekenen. Een alternatief voor ProseMirror is nog niet nodig op grond van automatische failures; de IME-gate moet eerst echte input krijgen. Indien een pathstrategie toch gewenst is: eerst een afzonderlijk toegestane serializer/shaping-/alternatieve-libraryproef, niet stil dezelfde pipeline accepteren.

## 7. Open handmatige tests en vervolgbeslissing

**Niet uitgevoerd — echte OS-IME:** open de geïsoleerde demo in Edge met een werkelijke IME; composeer tekst over een selectie en naast elk atomtype; bevestig/annuleer compositie; undo/redo; paletfocus en Escape tijdens compositie; noteer OS/IME/Edge, composition-events en geen dubbele/gesplitste inhoud. Ontbrekende beschikbare IME blijft expliciet een open gate.

**Niet uitgevoerd — schermlezer:** gebruik de afgesproken Edge/schermlezercombinatie; doorloop dialog/editor/toolbar/palet/atoms met toetsenbord, controleer één leesvolgorde, geen dubbele glyphuitspraak en correcte editor-/atomlabels. Open zelfstandige A-SVG en PNG-toegankelijkheidspad; noteer wat werkelijk wordt uitgesproken. title/desc alleen is geen PASS.

Daarnaast vereist ontwerpacceptatie een beslissing over fontdekking/emojiweigering en hoe de nog onvolledig bewezen baseline/selectionaspecten vóór volledige T1-integratie worden afgesloten. Dit rapport doet geen toestemmingsclaim voor aanvullende prototype- of productieontwikkeling.

Resultaten worden uitsluitend naar `chatgpt/editor-development` gepusht. **Na deze oplevering stopt het werk. T1 begint alleen na expliciete toestemming van de gebruiker.**
