# Constructiebronnen — hover en gekozen-bronfeedback

Datum: 9 oktober 2026. Branch: chatgpt/math-illustration-stabilization. Uitgangspunt: 0fe92442693d8b6fdf57f789b7ef0d41f7169d87.

## Oplossing

Constructiegereedschappen tonen blauwgroene hoverfeedback en een pointercursor bij een geschikte bron. Gekozen bronnen blijven goud gemarkeerd tot voltooien, annuleren of toolwisselen. De huidige constructiestap bepaalt de geschikte bronrol. Hover en klik delen constructionSourcesAt; de bestaande screen-space bronresolver met 12 CSS-pixels blijft leidend. Ook de shortcuts voor hoek, veelhoekhoekpunt, middenpunt en figuurmeting gebruiken deze gedeelde keuze.

De bestaande requestAnimationFrame-hoverketen en editor-only overlays worden hergebruikt. Constructie-hover veroorzaakt geen volledige canvasrender per pointermove en geen modelmutatie. Bronrechten gebruiken sourceTools, onafhankelijk van gewone selectCanvas-rechten. Verborgen of ongeldige bronconstructies lichten niet op; locks blijven het gebruiken als bron toestaan waar dat al toegestaan was. Er komen geen bewerkingshandles of multiselectieframes op constructiebronnen.

## Tests

284/284 Node-tests PASS, geen skips. Nieuwe browser-construction-hover.cjs controleert bronrol, 12px-tolerance op twee zoomniveaus, hover/klikovereenkomst, blijvend gekozen-bronaccent, vergrendeld bronpunt, overlappende lijnen, annulering en export. De gerichte echte Edge-proef slaagt. Volledige echte Edge-suite met alle 26 browsermodules PASS; pageErrors leeg. git diff --check PASS. Desktopbronfeedback visueel gecontroleerd. Technisch oordeel: PASS.

## Bestanden en beperkingen

editor.js, editor-enhancements.js, editor.html en tests/browser.cjs; nieuwe tests/browser-construction-hover.cjs. Geen documentformaat, geometrische constructieformules of permissiecontract gewijzigd.

De markering betreft het bronobject. Bij een zijde of hoekpunt van een veelhoek wordt de veelhoek gemarkeerd; er is nog geen afzonderlijk accent uitsluitend op de betreffende zijde of het hoekpunt. Visuele gebruikersacceptatie blijft open.

Implementatiecommit: 33d15e18dc32dcc4eab1efd907d403451ee732c9.
