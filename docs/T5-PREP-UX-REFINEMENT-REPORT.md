# T5-prep — UX-verfijning teksteditor

Versie 1.2.0 — 2026-10-12

Repository: `Geert1985/wiskundige-illustratie-editor`

Branch: `chatgpt/editor-development`
Status: technisch uitgevoerd; wacht op handmatige acceptatie. T5a is niet gestart.

## Resultaa

De rich-textwerkbalk is compacter gemaakt en de bediening voor tekstopmaak, breedte, symbolen, berekeningen en dynamische waarden is verfijnd. Dit is een UI-wijziging. Het documentmodel, de documentversie, tekstfragment-schema's, autorisatie, opslag en exportpaden zijn niet gewijzigd.

## Wijzigingen

- `Symbolen` heet nu **Symbolen & structuren**; de toegankelijke naam en tooltip zijn mee aangepast. De bestaande centrale catalogus en MathInput-route blijven in gebruik.
- Lettergroottes gebruiken vier centrale presets: Klein 12 pt, Normaal 16 pt, Groot 20 pt en Titel 28 pt. In de bestaande SVG-pixel-eenheid zijn dat respectievelijk 16, 21⅓, 26⅔ en 37⅓ px (96/72 px per punt). De UI toont semantische namen; een andere bestaande waarde blijft exact behouden en verschijnt als `Aangepast (… pt)`. Gemengde formaten worden niet als één formaat voorgesteld.
- Tekst gebruikt hetzelfde zevenkleurige palet en dezelfde kleurdefinities als geometrische objecten via `EditorColor`. Een bestaande willekeurige RGB/hexkleur blijft ongewijzigd totdat de gebruiker expliciet een paletkleur kiest; de knop toont de actuele kleur of een aangepaste/gemengde status.
- De vrije breedte-invoer is vervangen door een horizontale logaritmische slider binnen de bestaande grenzen 1–1.000.000 document-px, met 100.000 sliderstappen. De precieze documentwaarde blijft behouden totdat de gebruiker de slider bedient. De breedte en wrapping worden live als preview bijgewerkt. Een afgeronde drag wordt één lokale undo-stap; Escape herstelt de breedte van vóór de huidige drag. Annuleren van het tekstvenster verwerpt de volledige onopgeslagen tekstdraft.
- Het alineamenu is vervangen door links-, centreer- en rechts-uitlijnen. Actieve toestanden zijn zichtbaar en toegankelijk; bij gemengde selecties toont de UI een gemengde status. Meerregelige uitlijning behoudt de bestaande regelhoogte.
- Vet, cursief, onderstrepen, doorhalen, superscript en subscript spiegelen de cursor-/selectiestatus. Een opmaakkeuze vervangt alleen dezelfde markering en behoudt andere markeringen.
- Lokale undo/redo is als compacte werkbalkknoppen bereikbaar en wordt uitgeschakeld wanneer de lokale ProseMirror-geschiedenis geen actie toestaat. De buitenste documentgeschiedenis blijft apart.
- De werkbalk is verdeeld in tekstopmaak en breedte/invoegen/geschiedenis, met responsive regels voor desktop, tablet, telefoon en lage vensters.
- In de verfijningsronde na visuele beoordeling zijn de zichtbare labels onder Symbolen, Formule en Waarde verwijderd; toegankelijke namen en tooltips blijven. De breedteslider staat nu in een subtiel omkaderde groep direct naast tekstopmaak. De nadruk van de handmatige visuele acceptatie ligt op desktop; mobiel is geen blokkade.

## Gewijzigde implementatiebestanden

- `editor.html`, `editor.css`, `editor.js`
- `editor-color.js`, `text-editor-ux.js`
- `rich-text-editor.js`, `rich-text-editor.bundle.js`, `rich-text-editor-loader.js`
- `experiments/text-editor-build/build-results.json`
- `tests/architecture.test.cjs`, `tests/helpers.cjs`, `tests/lifecycle.test.cjs`, `tests/browser.cjs`, `tests/browser-rich-layout.cjs`
- Nieuwe gerichte tests: `tests/text-editor-ux.test.cjs`, `tests/browser-text-editor-ux.cjs`
- Bijgewerkte visuele bewijsbeelden: `experiments/text-editor-integration/screenshots/`

De wijziging in de Node-testbootstrap laadt de nieuwe gedeelde editorservices en modelleert enkele DOM-methoden die nu door de werkbalk worden gebruikt. Dit voorkomt dat oudere unit-/integratietests falen door een onvolledig testelement.

## Testresultaten

### Node

`npm test` — follow-up na de compacte werkbalk: **PASS: 457/457**, 0 mislukt, 0 overgeslagen; duur 10,108.919 ms.

De suite bevat onder meer centrale preset/palet-/slidercontracten, architectuurvolgorde, tekstschema, permissies, legacycompatibiliteit, opslag, undo/redo en document-/geometrische regressies.

### Edge

`npm run test:edge` — **PASS**, proces eindigde met exitcode 0. De volledige Edge-browserregressiesuite doorliep de bestaande browserregressies en de nieuwe UX-scenario's. Voor de UX-integratie rapporteerde de runner alle 15 checks als `passed` en `pageErrors: []`, inclusief `compactInsertionButtons` en `widthControlGroupedWithFormatting`.

De UX-integratiecontrole rapporteerde alle onderstaande checks als geslaagd en `pageErrors: []`: label Symbolen & structuren; presets en behoud van afwijkende waarden; gedeeld palet en behoud van aangepaste kleuren; behoud van overige markeringen; gemengde markeringen en uitlijning; uitlijning over alinea's met undo/redo; breedtepreview en behoud van een aangepaste breedte; één undo-stap per drag; toetsenbordbediening en undo/redo; Escape-annulering; annuleren van de volledige tekstdraft en documentcompatibiliteit; responsive bediening.

De integrale browserregressies omvatten tevens rich-text en wiskundige fragmenten, JSON-roundtrip, fullscreen (`fullscreenEscape`, `fullscreenKeyboardEscape`), offline SVG/PNG-rendering (`offlineSvgPng`, `offlineSvgDownload`, `offlinePngDownload`) en bestaande restricted-/legacycontroles. De bestaande layout-exportcontrole vergeleek 2.496.000 pixelbytes zonder verschil; de rasterexport leverde 1000×624 PNG op. Geen functionaliteit uit T5a is gestart.

### Build

`npm run build:text` — **PASS**. De gegenereerde editorbundle is 219.288 bytes (68.396 bytes gzip), SHA-256 `3cd01f11781ab1d6c1135746e463f392178903e0c08ef98aa8bd854cb5208a56`. De MathJax-renderer is 1.645.994 bytes (569.782 bytes gzip), SHA-256 `4428d112a106fa821f941475ba868dd674b4f9ca142335f6c0d23c7cca0b1815`.

## Screenshots

De screenshots zijn bewijs van de testweergave, geen vervanging voor handmatige acceptatie.

1. Volledige werkbalk: [01-toolbar-desktop.png](images/t5-prep-ux/01-toolbar-desktop.png)
2. Lettergroottemenu: [02-font-size-preset.png](images/t5-prep-ux/02-font-size-preset.png)
3. Gedeeld kleurenpalet: [03-shared-palette.png](images/t5-prep-ux/03-shared-palette.png)
4. Gemengde en actieve opmaak: [04-mixed-format-state.png](images/t5-prep-ux/04-mixed-format-state.png)
5. Uitlijningsiconen: [05-alignment-icons.png](images/t5-prep-ux/05-alignment-icons.png)
6. Breedteslider en live preview: [06-width-slider-preview.png](images/t5-prep-ux/06-width-slider-preview.png)
7. Mobiele werkbalk: [07-toolbar-mobile.png](images/t5-prep-ux/07-toolbar-mobile.png)
8. Symbolen & structuren: [08-symbols-structures.png](images/t5-prep-ux/08-symbols-structures.png)

## Behouden compatibiliteit en beperkingen

- De bestaande documentversie en `textContent`-schema's zijn niet gewijzigd. Er is geen migratie of herschrijving van documenten toegevoegd.
- Bestaande aangepaste lettergroottes, kleuren en breedtes worden bij openen en bevestigen niet naar presets afgerond. Kleuren van punten en lijnen blijven dezelfde editor-kleurcomponent gebruiken.
- De bestaande ProseMirror-transactie- en geschiedenispaden blijven verantwoordelijk voor rich-textundo/redo; de breedtepreview wordt pas na bevestiging van de slider aan die lokale geschiedenis toegevoegd.
- Automatische tests bewijzen layout-/responsive maten, maar geen volledige toegankelijkheidsaudit met schermlezer of IME-test met elke OS-invoermethode.
- De resterende acceptatie is handmatig: controleer de werkbalk op de doelapparaten, toetsenbord/focus en schermlezer, sleepbreedte en Escape, gemengde selectie, custom waarden, en de bestaande kleurkiezer voor punten/lijnen. Pas na die acceptatie start geen volgende milestone vanzelf; T5a wacht op een aparte opdracht.

## Bijgewerkte ontwerpdocumenten

- Architectuur: versie 1.9.0, UI-contract voor T5-prep UX toegevoegd.
- Implementatieplan: versie 1.9.0, UX-checkpoint toegevoegd.
- Roadmap: versie 1.8.0, UX checkpoint toegevoegd.
- Featurebacklog: versie 1.3.0, implementatiestatus verduidelijkt.

## Vervolgverfijning waardenpaneel — 2026-10-12

Na de eerdere test- en rapportageronde is het tabblad **Waarden** opnieuw ingedeeld. Bronobject en eigenschap staan naast elkaar; decimalen gebruiken een slider van 0 tot en met 3; de eigenschapsafhankelijke keuzelijst **Eenheid** bevat zowel passende meeteenheden als hoekeenheden; voor- en achtervoegsel staan naast elkaar. De voorbeeldwaarde heeft meer ruimte naast **Waarde invoegen** en **Annuleren** staat gecentreerd onderaan het paneel.

Een bestaande precisiewaarde buiten 0–3 blijft ongewijzigd zolang de slider niet wordt bediend. De bestaande aparte `unitMode`- en `angleMode`-velden blijven in het documentmodel behouden; de enkele gebruikerskeuze wordt naar die velden vertaald.

Voor deze vervolgwijziging zijn op verzoek geen Node- of Edge-tests uitgevoerd. De bestaande resultaten hierboven dateren van vóór deze vervolgwijziging en gelden dus niet als validatie ervan. De bijgewerkte browserstappen staan in `tests/browser-rich-values.cjs`; handmatige/browserverificatie en regressietests blijven door de gebruiker uit te voeren.
