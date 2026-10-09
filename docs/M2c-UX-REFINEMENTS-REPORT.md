# M2c ? Selectiecontrast en zichtbaar lagenpaneel

Datum: 2026-10-09. Oordeel: **PASS**; visuele gebruikersacceptatie blijft open.

## Wijzigingen

Selectie gebruikt nu een transparante gouden halo van 10 CSSpx met witte contrastbasis. Hover gebruikt een smallere blauwgroene halo van 4 CSSpx. Beide blijven achter de originele geometrie; oorspronkelijke kleur, stijl en documentdata worden niet gewijzigd. Multiselectiekader en selectielabel gebruiken dezelfde warme accentfamilie. Deze editorpresentatie komt niet in definitieve SVG-export.

De lijst bestond al, maar stond onder toevoegen/uitleg en buiten het zicht. Tools en lagen hebben nu eigen scrollruimte. De lagenlijst heeft minimaal 200px ruimte, toont objecten ingesprongen onder hun bestaande laag en plaatst toevoegen onder de lijst. De naam Nieuwe laag is een invoerveld; de compacte plusknop voegt de laag toe. De geselecteerde objectrij wordt bij selectiewissel zichtbaar gemaakt; scrollpositie blijft bij andere renders behouden. Zonder documentlagen verschijnt Objecten zonder lagen; lege documenten krijgen een duidelijke instructie. Geen impliciete documentlaag toegevoegd.

Native details open/sluiten en responsive drawers blijven via dezelfde EditorApp-render/lifecycle functioneren. Korte schermen kunnen de zijbalk als geheel scrollen. Geen nieuw pointerpad, documentversie of geometrische functionaliteit.

## Verificatie

Tests-first: de nieuwe browserproef faalde vooraf op de oude blauwe selectie. Vervolgens zijn contrast, transparantie, behoud van zwarte objectstijl, direct zichtbare laag/objectrijen op1280x720, heropening van het paneel, objectselectie, unlayered/empty en export gecontroleerd.

Node: **281/281 PASS**. Volledige echte Edge-suite: **PASS**, alle23 modules inclusief uiRefinements; pageErrors: []. Bestaande selectiepresentatietest verwacht nu expliciet10px in plaats van5px, zonder andere assertions te verwijderen. Golden fixtures ongewijzigd. git diff --check PASS.

Geteste productiecommit: `e221da6157162672e975aa26136ba1fb91082fb7`. Testscommit: `dda30f0`. Branch: chatgpt/math-illustration-stabilization. Gewijzigd: editor-enhancements.js, editor.css, editor.html, editor.js, browser-selection-presentation.cjs, browser.cjs en nieuwe browser-ui-refinements.cjs.

Ververs de preview om de nieuwe accentkleuren en laagindeling te beoordelen. Veel lagen/objecten blijven scrollen vereisen; de selectie en laagstructuur worden nu in het beschikbare paneel getoond.
