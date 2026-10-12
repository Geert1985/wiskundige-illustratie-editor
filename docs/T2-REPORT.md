# T2 — Symbolen en inline formules

Versie 1.0.0 — 2026-10-12. Repository `Geert1985/wiskundige-illustratie-editor`, branch `chatgpt/editor-development`. Onderzochte T1-baseline: `40679547ba61885253b1a8b18e802bdee9fe18a3`.

De gebruiker gaf expliciet opdracht **Begin met T2**. T2 is uitgevoerd; gebruikersacceptatie staat open. Resterende handmatige T1-controles zijn daarmee niet als geslaagd aangemerkt. **T3 is niet gestart.** Publicatie betreft uitsluitend de ontwikkelbranch.

Implementatie- en bewijscommit: `b99217fae7bad97f19aab54c408fb95a4109a09c`. Een aansluitende documentatiecommit voegt deze verwijzing toe; productiecode en testbewijzen blijven gelijk aan de geteste implementatiecommit.

## Opgeleverd

- Ω-paneel met zoeken en tien categorieën: Grieks, rekenen, gelijkheden/ongelijkheden, verzamelingen, geometrie, pijlen, logica, machten/wortels, breuken en functies. Cursorbookmarks blijven behouden. Glyphs uit de lokale tekstfonts worden tekst; ontbrekende glyphs, zoals ∈ en ℝ, gebruiken veilige formuleatomen.
- ƒ(x)-paneel met bronnotatie, live preview, duidelijke validatiefouten en atomisch invoegen/bewerken. Dubbelklik of Enter op een geselecteerde formule heropent de bron. Drag, delete/backspace en lokale undo behouden de atomische inhoud.
- Applicatie-eigen `textContent` schema 2 in document v7. Formulebron en marks zijn autoritatief; JSON bevat geen HTML/SVG/renderercache/ProseMirror-document. Schema 1 en v1–v6 blijven compatibel volgens het bestaande contract. Toekomstige fragmenttypen blijven geweigerd.
- Gedeelde formuleglyphpaden voor editor, canvas en SVG. Gemengde baseline-layout, kleur, bold/italic, script, decorations, alinea's, uitlijning rond het objectanker en rotatie. Bestaande T1-tekst zonder formules behoudt zijn renderroute.
- Category-aware `text.commit`, duplicatiegrants, locks/revisies, policy-intrekking, restricted export, JSON/history/replay en offline SVG→PNG-regressie.

Geen rekenengine, brongebonden inlinevelden, automatische wrapping of nieuwe productie-PNG-exportknop. Deze behoren tot T3–T5/T4.

## Afzonderlijke bibliotheekproef en keuze

De reproduceerbare proef staat in `experiments/math-fragments-preflight/`: package/lockfile, `probe.cjs`, `results.json`, `build-results.json`, `audit-results.json` en `verification.json`. De productie-adapter is apart ontwikkeld en vervolgens lokaal gebundeld. KaTeX wordt uitsluitend voor de vergelijking gebruikt.

| Eigenschap | MathJax 3.2.2 | KaTeX 0.19.0 |
|---|---:|---:|
| Gemeten JS raw bytes | 1.645.994 | 272.868 |
| gzip bytes | 569.782 | 76.584 |
| Gemeten output | Begrensde, zelfstandige SVG-glyphpaden | HTML met CSS/fontafhankelijkheid |
| Directe standalone SVG in proef | Ja | Nee |
| Externe formulefonts bij gebruik | 0 | Niet als offline SVG bewezen |

De MathJax-meting bevat de gebundelde adapter en fontpaden. KaTeX betreft zijn minified JS, zonder CSS/fonts; het is geen totaal-downloadvergelijking. **MathJax is gekozen** omdat dezelfde zelfstandige SVG-box direct in editor, canvas en offline export bruikbaar is. De grotere lazy bundle is een expliciete afweging. MathJax 3.2.2 is een gepinde oudere versie, geen claim van nieuwste versie; een toekomstige upgrade vereist opnieuw deze proef.

| Bron | MathJax koude conversie ms | Gemiddelde van 10 warme conversies ms | SVG-body bytes | KaTeX conversie ms |
|---|---:|---:|---:|---:|
| `x^2+y^2=r^2` | 37,306 | 3,964 | 4109 | 11,286 |
| `\sin^2(\theta)+\cos^2(\theta)=1` | 5,615 | 3,821 | 7064 | 3,587 |
| `\frac{1}{2}` | 3,086 | 1,088 | 1004 | 2,479 |
| `\sqrt{x+1}` | 3,854 | 1,536 | 1770 | 2,408 |
| `\alpha+\beta\leq\pi` | 1,598 | 1,445 | 2417 | 0,554 |

Eenmalige koude bundle-import in Node: 199,658 ms. Dit zijn lokale microbenchmarks, geen browser-SLA of statistische platformvergelijking. Breedte/ascent/descent/nodecounts per fixture staan in `results.json`.

MathJax gebruikt `fontCache:none`, inline paths en gecontroleerde SVG-elementen/attributen. Geen `<use>`, IDs/href, externe resources, foreignObject, scripts of geserialiseerde MathJax-HTML. Grenzen: 2048 bronchars, 256 tokens, nesting 32, 128 formules/tekst, 512/document en 8192 documenttokens; maximaal 4096 outputnodes en 65536 bodybytes/box. Cache: 128 boxes/4 MiB. De bron-whitelist weigert macro's, URLs, HTML, comments en onbekende opdrachten. Het is een beperkte presentatie-TeX-subset; algemene LaTeX-environments/matrices zijn niet beschikbaar. Vergelijkingssymbolen kunnen via Ω of ondersteunde opdrachten zoals `\leq` worden ingevoerd.

Build: `npm ci` in beide experimentdirectories, vervolgens root `npm run build:text`. Geen runtime-CDN. De laatste herbouw leverde dezelfde SHA-256's op:

- Editor: 213936 bytes / gzip 66803; `bf7961f67790725a37b5f3391274082a132f3c8ec7ef1bbec81d65d5a885e702`.
- Math: 1645994 bytes / gzip 569782; `4428d112a106fa821f941475ba868dd674b4f9ca142335f6c0d23c7cca0b1815`.
- Fontadvance-tabel: 90649 bytes, gegenereerd uit de bestaande lokale fontassets.

`npm audit` voor de formuleproef: exit 0, **0 bekende kwetsbaarheden** (info/low/moderate/high/critical alle 0). KaTeX en de build-transitive xmldom zijn daarvoor gepind naar 0.19.0 respectievelijk 0.9.12. Xmldom/speech-rule-engine/autoload komen niet in de runtimebundle. Auditdatum/bewijs is lokaal; geen algemene veiligheidsgarantie.

Bronnen voor het proefcontract: [MathJax SVG-options](https://docs.mathjax.org/en/v3.0/options/output/svg.html), [KaTeX API](https://katex.org/docs/api), [KaTeX opties](https://katex.org/docs/options) en [KaTeX veiligheid](https://katex.org/docs/security). De keuze berust op de uitgevoerde proef, niet uitsluitend op documentatie.

## Uitgevoerde regressie en bewijs

Omgeving: Windows, Node 22.18.0, npm 10.9.3, headless Microsoft Edge 155.0.4283.45. `verification.json` bewaart de volledige laatste Edge-resultaatstructuur en Node-samenvatting. De ruwe lokale logs staan in de genegeerde `test-results/`-directory; screenshotbewijs wordt als `experiments/math-fragments-preflight/t2-fullscreen.png` vastgelegd.

| Uitvoering | Resultaat |
|---|---|
| Volledige `npm test` | **418/418 PASS**, 0 fail/cancelled/skipped/todo; laatste duur 9641,4469 ms |
| Volledige `npm run test:edge` | **PASS**, exit 0; 48 geladen testmodules naast de hoofdproef; `pageErrors: []` |
| Nieuwe Node T2-module | 16 afzonderlijke tests; opgenomen in de volledige Node-run |
| Gerichte `browser-rich-math.cjs` | 16 benoemde controles PASS; `pageErrors: []`; 4 offline rasterfixtures |
| `npm run build:text` | Exit 0; dezelfde bundlehashes bij herbouw |
| Formuleproef `npm audit` | Exit 0; 0 kwetsbaarheden |
| `git diff --check` | Geen whitespacefouten |

De nieuwe browsercontroles zijn: symbolsAndCategories, missingGlyphPaths, keyboardFormulaApply, staleCommit, bookmarks, formulaInsertEdit, atomDeleteUndo, atomDrag, unsafeSource, history, sourceRoundtrip, cancel, fullscreenEscape, stalePreview, offlineSvgPng en zoom. Drag controleert werkelijk gewijzigde atomvolgorde; delete/undo controleert exact herstel. Fullscreen test eerst Escape van kindpaneel en daarna dialoog, met behoud van canvasfullscreen. De koude loader wordt vertraagd en daarna geannuleerd; een late preview mag niet terugkomen.

Offline rastercorpus: `x^2+y^2=r^2`, `\sin^2(\theta)+\cos^2(\theta)=1`, `\frac{1}{2}` en `\sqrt{x^2+y^2}`. Tijdens rastering staat de browsercontext offline; zelfstandige SVG decodeert naar Image/canvas en PNG. Iedere fixture bevat rode formulepixels, eindige geometrie en geen externe SVG-referenties. De gerichte run telde respectievelijk 93/252/22/112 rode pixels; de definitieve volledige suite telde **88/242/23/109**, zoals vastgelegd in `verification.json` (viewport/historie kunnen pixels beïnvloeden). Drie echte toolbarzoomstanden behouden formulebreedte en exact dezelfde documentobjecten. Baseline/lineheight/alignment/rotatie/color/readiness zijn tevens in Node getest.

Node dekt veilige bron/syntax/quotas, exact schema, bounded output, v7 roundtrip/duplicatie/failed import, typed replay/history, content/format/math-grants, gemarkeerde atomverplaatsing, verboden opmaakgrens-/bronwissels, locks/stale revisions, restricted export/redactie, policy-intrekking, created duplicate grants en legacybindingen. De bestaande volledige suite blijft geometrie, assen, lagen/groepen, constructies, permissies, fullscreen en oudere bestanden testen.

### Herstelde problemen tijdens uitvoering

1. Een dubbele contenteditable-host verstoorde focus; alleen het echte ProseMirror-element is nu de editing host. Lokale toolbar undo/redo geeft focus terug aan de editor.
2. Formulebevestiging en daaropvolgende delete konden één lokale historygroep vormen; expliciete historygrenzen scheiden die acties.
3. MathJax currentColor liet kleur niet overal volgen; color/fill/stroke worden expliciet doorgegeven en rode rasterpixels getest.
4. Escape volgde eerder het fullscreen-propertypad; open teksteditor/kindpaneel krijgen nu hun eigen afhandeling.
5. Author-conflict werd niet tegen de openingsrevisie gecontroleerd; de dialoog bewaart deze revisie en weigert overschrijven met behoud van draft.
6. Alleen een bronmultiset vergelijken zou bronnenwissels tussen atoms toestaan zonder math-grant. Vergelijking gebruikt nu behouden IDs en bronpayloads. Opmaakgrenzen zijn apart beschermd; onveranderde gekleurde atoms kunnen met content-grant verplaatst worden.
7. Gemengde uitlijning was eerst blokrelatief; deze is naar hetzelfde objectanker als T1 gecorrigeerd. Whitespace wordt expliciet behouden en de advance-layout schakelt ligaturen uit.
8. Testharnas/stubs en locators zijn bijgewerkt voor de echte editorhost/nieuwe modules. De nieuwe zoomtest had een vals alarm door `NaN` in base64-fontdata; de assertion controleert nu geometrieattributen. Functionaliteit is niet verwijderd om tests te laten slagen.

## Legacy dynamische tekst

T2 migreert/flattened geen `textBinding` en biedt daarop geen formule-invoeging aan. De 12 Node-fixtures combineren precisie null/0/10 met normale/hidden/locked/missing bron, prefix/suffix en eigen stijl/rotatie. Format OK, undo/redo, author save/reload, dupliceren tekst alleen en samen met bron behouden de binding exact. Restricted trusted owner-inspect behoudt de oorspronkelijke binding; publieke export van een ontbrekende/onleesbare bron redigeert volgens het bestaande contract.

Bestaande legacyduplicatie bewaart de oorspronkelijke `sourceId`, ook bij samen kopiëren. Dit is bewust niet ongemerkt gewijzigd tijdens T2; T3 moet zijn expliciete migratie/remapping testen. De volledige legacy-browsermodule test bestaande bindinginspector/persistence/fullscreen. Een volledige handmatige open/Cancel/OK-matrix voor alle twaalf fixtures is **niet uitgevoerd**.

## Onderhoudbaarheid en beperkingen

Formulelayout is uit de algemene renderer gehaald naar `rich-text-renderer.js`; schema/validatie blijven in de domeinlaag, bronrendering achter een kleine adapter, permissies achter commandodispatch en UI achter de draftadapter. `text-content-diff.js` voorkomt verdere groei van inline runtimevergelijkingen. Bundles zijn reproduceerbare distributie, geen handmatig te wijzigen bron. Architectuurinventaris/loadvolgorde is bijgewerkt. Dit geeft T3/T5 getypeerde uitbreidingspunten zonder ProseMirror-documenten in het model te bewaren.

Open grenzen: grotere lazy MathJax-bundle; vaste TeX-formulefonts naast sans/seriftekst; mixed advances zonder kerning/ligaturen; conservatieve formatgrant bij gewijzigde grenzen van gemengd opgemaakte tekst. Synchrone externe Engine-hosts moeten vóór formule-SVG expliciet `await MI.MathFragments.load()` doen; een koude directe call geeft een duidelijke fout. Wrapping/uitgebreide shaping/productie-PNG blijven T4, dynamische velden T3, berekeningen T5. Volledige productgoedkeuring wordt niet geclaimd.

## Handmatige acceptatie — NIET UITGEVOERD

1. Echte Windows-IME-compositie binnen tekst en naast formuleatomen, met lokale undo.
2. Schermlezer: Ω/ƒ(x), formulebronlabels, atomselectie en keyboardfocus. Automatische aria-labelchecks bewijzen geen AT-gebruik.
3. Visuele beoordeling op echte apparaten: grote breuk/wortel naast kleine tekst, serif/sans, bold/italic, kleuren, uitlijning, meerdere alinea's, zoom en rotatie.
4. OS-clipboard/rich paste en SVG openen in externe viewers; browserrastering vervangt deze controles niet.
5. Volledige handmatige legacybinding-lifecyclematrix en gebruikersacceptatie.

Praktische gebruikerstest: maak tekst “Voor ”, voeg π via Ω in, voeg een breuk via ƒ(x) in en typ “ na”. Heropen de breuk, wijzig naar `\sqrt{x^2+y^2}`, verplaats/verwijder en undo. Bevestig, test document undo/redo, JSON opslaan/herladen en SVG-export. Herhaal in fullscreen; Escape sluit eerst het formulepaneel en dan de teksteditor, zonder fullscreen te verlaten. Controleer dat een bestaande dynamische tekst na stijlwijziging zijn bron blijft volgen.

Wacht op gebruikersacceptatie van T2. Start geen T3 op basis van uitsluitend groene geautomatiseerde tests.
