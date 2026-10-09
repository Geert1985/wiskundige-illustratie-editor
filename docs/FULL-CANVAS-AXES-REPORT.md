# Canvasbrede assen

Datum: 9 oktober 2026. Branch: chatgpt/math-illustration-stabilization. Uitgangspunt: 105e42273ea9269b5c5c0342dddc6efd1fa573ed.

## Wijziging

De zichtbare X- en Y-as lopen tot de randen van het canvas, ook in de lege ruimte die door preserveAspectRatio="xMidYMid meet" ontstaat. Asletters verhuizen mee naar het uiteinde.

De renderer markeert de editorassen alleen bij render(...,{editorCanvas:true}). In het centrale renderpad gebruikt SvgRenderer.fitCanvasAxes de bestaande CoordinateTransform om canvasranden naar SVG-coordinaten te vertalen. Alleen assenlijnen en asletters worden bijgewerkt. Geen extra renderpad, enginebounds-mutatie, asvervorming of documentveld. Raster/ticks en alle objecten behouden hun bestaande mathematische verdeling. Standalone SVG-export behoudt de oorspronkelijke uitvoer en documentbounds. Aszichtbaarheid en domeinregels blijven gelden.

## Verificatie

Alle 284 Node-tests PASS, geen skips. Nieuwe browser-full-canvas-axes.cjs faalde op de oorspronkelijke versie en controleert vervolgens exacte canvasranden op 1480x668, 1011x900 en 390x844, gelijke X/Y-schaal, documentinvariant, zichtbaarheid, undo en afwezigheid van editor-only markers in SVG-export. Desktopweergave visueel gecontroleerd. Volledige echte Edge-suite: alle 27 browsermodules PASS; pageErrors leeg. git diff --check PASS. Technisch oordeel: PASS.

## Bestanden

renderer.js, editor.js, editor.html, tests/browser.cjs, tests/browser-full-canvas-axes.cjs.

Geen nieuwe milestone of overige functionaliteit gestart. Visuele gebruikersacceptatie blijft open.

Implementatiecommit: c2b31e60cec3f01ad81d8a16fcdc1e64c90666ef.
