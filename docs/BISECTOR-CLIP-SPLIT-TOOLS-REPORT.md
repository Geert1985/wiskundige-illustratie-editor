# Bissectriceweergave, brede knoppen en extra split-buttons

Datum: 9 oktober 2026. Branch: chatgpt/math-illustration-stabilization. Uitgangspunt: 5af2f9ad2215fab76cb3c7d5a2c8d80aa9c58377.

## Oorzaak en oplossing

Een bissectrice is een gekoppelde halfrechte. De SVG-root houdt gelijke X/Y-schaal en kan daardoor zichtbare canvasruimte buiten de opgeslagen bounds tonen. Driehoekhoekpunten in die ruimte werden wel getekend, maar de halfrechte werd op de oude documentbounds afgeknipt. Haar begin leek daardoor te verschuiven bij zoomen.

CoordinateTransform.forViewport en visibleBounds bepalen de werkelijk zichtbare canvasgrenzen met dezelfde meet-transformatie als de SVG. Het centrale renderpad geeft deze grenzen expliciet als clipBounds mee. Rechten, halfrechten en vectoren, inclusief preview, gebruiken die grens in de editor. Geen documentbounds-, constructie-, snapping- of opslagmutatie. Standalone render/SVG-export behoudt de documentgrenzen. Geen extra renderpad of mutable viewportstate in de renderer.

## UI

Desktopzijbalk 300 px, bij smallere desktop 280 px. Mobiele lade maximaal 300 px. Namen zoals Middelloodlijn blijven volledig zichtbaar.

Nieuwe groepen: Hoek/Rechte hoek; Lengtemaat/Omtrek/Oppervlakte; Loodlijn/Middelloodlijn. Alle gebruiken de bestaande split-buttonimplementatie, onderrand als menu-indicatie, directe hoofdactie, keyboardbediening, permissiecontrole en afzonderlijk bewaarde voorkeur. Bestaande objecten en gereedschappen blijven behouden.

## Verificatie

286/286 Node-tests PASS: alle 284 bestaande plus 2 nieuwe voor gelijke schaal/letterboxgrenzen en ray-clipping zonder verandering van standalone uitvoer. Volledige echte Edge-suite met alle 29 browsermodules PASS; pageErrors leeg. git diff --check PASS. Geen golden fixtures gewijzigd.

Nieuwe browser-bisector-clip.cjs reproduceert een driehoekhoekpunt op y=3.3 buiten document-yMax=3 en verifieert de zichtbare ray-origin bij zoom, uitzoomen en resize, gelijke voorspelde/DOM-transformatie, onveranderde geometrie en volledige knopnaam. Browser-split-tools controleert ook de drie nieuwe keuzelijsten binnen het zijpaneel. Screenshot visueel gecontroleerd.

## Bestanden en commit

coordinate-transform.js, renderer.js, editor.js, editor.html, editor.css; tests/viewport-rendering.test.cjs, browser-bisector-clip.cjs, browser-split-tools.cjs en browser.cjs.

Implementatiecommit: 21046fbfd0acabf82d3403494f2cea4fe19585e9.

Technisch oordeel: PASS. Visuele gebruikersacceptatie blijft open. Geen volgende milestone gestart.
