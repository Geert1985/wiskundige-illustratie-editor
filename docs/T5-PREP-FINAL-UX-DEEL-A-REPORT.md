# T5-prep Deel A — UX-opleverrapport

Versie 1.0.0 — 2026-10-12

Branch: `chatgpt/editor-development`
Status: geïmplementeerd en geautomatiseerd gecontroleerd; wacht op handmatige acceptatie.

## Resultaat

De teksteditor gebruikt een permanent tweekolomsvenster. Het invoerpaneel heeft precies twee tabs: **Formule** en **Waarden**. De formulecatalogus staat in Formule naast het LaTeX-bronveld, de zoek-/categoriebediening, live preview en de expliciete actie **Formule invoegen**. De tekstcomposer heeft nu een wit vlak met donkere tekst, zodat zwarte tekst leesbaar blijft.

Een catalogusklik voegt LaTeX in op de bewaarde selectie of cursorpositie in het bronveld. Structuursjablonen selecteren hun eerste invulpositie. Catalogusklikken veranderen alleen de formule-draft; ze maken of vervangen geen formule-atoom. Een bestaand of nieuw formule-atoom wordt pas na de expliciete invoeg-/bijwerkactie aan de ProseMirror-tekst toegevoegd. Normale Unicode-tekst typen en plakken in de editor blijft beschikbaar.

De dynamische waarden gebruiken hun bestaande bronkeuze, berekening, permissies, validatie en transacties. De eerder verwijderde tekstbreedtebediening blijft weg; de bestaande `textContent.width` blijft behouden en wordt bij openen, annuleren, toepassen, opslag en export niet genormaliseerd.

## Wijzigingen

- `editor.html`, `editor.css`: tweedelige invoernavigatie, gecombineerde formule/cataloguspaneelindeling en wit tekstvlak met donkere tekst.
- `text-insert-panel.js`, `text-math-input.js`: LaTeX-invoeging op cursor/selectie, placeholderselectie, gescheiden concepten voor formule en dynamische waarde, behoud van de bronselectie bij focusverplaatsing.
- `text-dynamic-value-editor.js`: bijwerken van bestaande dynamische-waardebediening en fout-/previewfeedback binnen het permanente paneel.
- `editor.js`, `rich-text-editor.js`, `rich-text-editor.bundle.js`, `text-editor-ux.js`: behoud van de permanente editorwerkruimte en compatibiliteit met bestaande editor-/documentbediening.
- `tests/browser-rich-math.cjs`, `tests/browser-rich-values.cjs`, `tests/browser-rich-layout.cjs`, `tests/browser-text-editor-modernization.cjs`, `tests/browser-text-editor-ux.cjs`, `tests/text-editor-ux.test.cjs`: tests bijgewerkt voor de tweedelige UI, LaTeX-broncontract, wit tekstvlak en behouden documentbreedte.
- Architectuur, uitvoeringsplan, roadmap en featurebacklog bijgewerkt om het actuele contract en de openstaande handmatige acceptatie vast te leggen.

Er is geen documentversie, tekstschema, permissiemodel, MathSource-validator, MathFragments-contract of exportcontract gewijzigd. T5a–T5d en Deel B canvas-resizing zijn niet gestart.

## Verificatie

- `node --test --test-reporter=spec tests/*.test.cjs` — **457 geslaagd, 0 mislukt, 0 overgeslagen**, exitcode 0.
- `npm.cmd run test:edge` — **geslaagd**, exitcode 0. De volledige Edge-integratiesuite rapporteerde `pageErrors: []`. De rich-text-, formule-, dynamische-waarden-, lay-out- en fullscreencontroles zijn uitgevoerd.
- Formule-interactie: zoeken en categorieën, LaTeX-opdracht zoeken, cursorinvoeging, selectie vervangen, eerste placeholder selecteren, catalogus zonder directe atoommutatie, preview, ongeldige formulefeedback, expliciet invoegen/bijwerken en lokale undo/redo zijn door de Edge-suite uitgevoerd.
- Regressies: dynamische-bronrechten en restricted chooser, documentgeschiedenis, openen/annuleren/opslaan/herladen, fullscreen/Escape, JSON-roundtrip, SVG-export en offline SVG-naar-PNG-controles zijn in dezelfde Edge-suite uitgevoerd.
- `npm.cmd run build:text` — **geslaagd**. `rich-text-editor`: 219.017 bytes, gzip 68.287 bytes, SHA-256 `514c226ff714d4affa76b22441c11d0bbd86011ae77feebc59abe77de89cd5bf`. Math-rendererbuild: 1.645.994 bytes, gzip 569.782 bytes, SHA-256 `4428d112a106fa821f941475ba868dd674b4f9ca142335f6c0d23c7cca0b1815`.
- `git diff --check` — **geslaagd**.

## Screenshots

De screenshots zijn gegenereerd door de Edge-integratietest in `docs/images/t5-prep-final-ux/`.

- [Volledige editor met wit tekstvlak](images/t5-prep-final-ux/01-editor-desktop.png)
- [Formulebron, catalogus en live preview](images/t5-prep-final-ux/04-formula-catalog.png)
- [Formulesjabloon met eerste placeholder](images/t5-prep-final-ux/05-template-placeholder.png)
- [Dynamische waarden](images/t5-prep-final-ux/11-values-tab.png)
- [Korte desktopvensterhoogte](images/t5-prep-final-ux/10-editor-short-window.png)

De browsercontrole heeft ook tablet- en smalle-scherm-layouts doorlopen. Mobiele optimalisatie was geen hoofddoel; die weergave is alleen op basisbediening en overflow gecontroleerd.

## Niet uitgevoerd / resterend

- Handmatige visuele acceptatie door de gebruiker is **niet uitgevoerd**; dit rapport is geen acceptatieverklaring.
- Handmatige IME/composition-invoer en toetsenbord-/schermlezerreview zijn **niet uitgevoerd**.
- Er is geen handmatige controle uitgevoerd op elk individueel legacydocument; compatibiliteit is afgedekt door bestaande Node-/Edge-regressies en het onveranderde documentmodel.

Na push stopt de uitvoering voor handmatige acceptatie. Er is geen toestemming gegeven om T5a–T5d of canvas-resizing te starten.
