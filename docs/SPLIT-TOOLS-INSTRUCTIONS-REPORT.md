# Split-buttons, tekstgrootteslider, instructies en aslabels

Datum: 9 oktober 2026. Uitgangspunt: de08ccaf8853aaf96a7a93fc75fbb75ba364490f. Branch: chatgpt/math-illustration-stabilization.

## Uitgevoerd

- Tekstgrootte is een slider van 1 tot 96 px, met stap 1 en waardeweergave. Geimporteerde grotere tekstgroottes vergroten het slidermaximum en worden behouden. Het bestaande stylecommand en undo/redo blijven leidend.
- Lijnstuk/Rechte/Halfrechte/Vector vormen een split-button. De hoofdknop activeert direct de gekozen tool; de afzonderlijke smalle onderrand opent de lijst. De onderrand vervangt het pijltje zodat namen volledig passen.
- Driehoek/Veelhoek gebruiken dezelfde split-buttonimplementatie. Cirkel staat afzonderlijk naast deze knop onder Figuren.
- Beide groepen bewaren onafhankelijk hun voorkeur in localStorage: fzi-math-illustration-linear-tool en fzi-math-illustration-figure-tool. Dit is uitsluitend editorvoorkeur, geen documentdata of historietoestand. Ongeldige opgeslagen waarden en storagefouten vallen veilig terug op de standaardkeuze.
- Een beperkt runtimeprofiel toont een toegestane tool als hoofdkeuze, of schakelt de groep uit. De opgeslagen voorkeur verleent geen rechten; setTool en bestaande commandautorisatie blijven gelden.
- Menus worden binnen de zichtbare zijbalk uitgelijnd en openen waar mogelijk omhoog bij onvoldoende ruimte onderaan. Keyboardbediening: Enter/Space, ArrowDown openen, pijlen/Home/End kiezen, Enter activeren, Escape sluiten en focus teruggeven. Slechts een keuzelijst staat tegelijk open; buitenklik sluit.
- Teken-/meet-/constructie-instructies verschijnen in het lege eigenschappenpaneel. De bestaande live statusnode is verplaatst naar rechts; de canvas-overlay met instructies is verwijderd. Objecteigenschappen blijven bestaan als er een selectie is.
- Extra schaalmarkeringen en cijferlabels vullen de canvasbrede assen aan buiten de documentbounds. De renderer gebruikt dezelfde CoordinateTransform en hoofdstap, met de bestaande ticklimiet. X/Y-schaal, documentbounds, snapping, JSON en standalone SVG-export blijven ongewijzigd. Randlabels worden alleen toegevoegd waar ze volledig passen.

## Verificatie

284/284 Node-tests PASS, geen skips. Volledige echte Edge-suite met alle 28 browsermodules PASS; pageErrors leeg. git diff --check PASS. Desktopmenu, volledige naam Halfrechte, rechterinstructies en tekstslider visueel gecontroleerd.

Nieuwe browser-split-tools.cjs controleert directe hoofdactie, keuze zonder documentmutatie, keyboard en Escapefocus, onafhankelijke voorkeuren na reload, cirkelcategorie, menu binnen paneel, volledige naam, geimporteerde grote tekstgrootte met keyboard/undo, instructies rechts, extra aslabels en toegestane/geweigerde runtimegereedschappen. Alle bestaande geometrische regressies zijn behouden. De browserhelper opent de nieuwe keuzelijsten via echte klikken. De negatieve fontSize=0-test controleert de onderliggende enginevalidatie omdat de slider geen 0 kan invoeren. Geen golden fixtures gewijzigd.

## Bestanden en commit

editor.js, editor.html, editor.css, renderer.js; tests/browser.cjs, browser-tool-menu.cjs, browser-styles.cjs en de nieuwe browser-split-tools.cjs.

Implementatiecommit: 9ebb8d5bcae04d55b7fd7642dd3c4037371b4f84.

Technisch oordeel: PASS. Visuele gebruikersacceptatie blijft open. Geen documentformaatwijziging en geen volgende milestone gestart.
