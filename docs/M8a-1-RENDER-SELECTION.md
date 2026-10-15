# M8a-1 — SVG-rendering, selectie en snapping

Datum: 2026-10-15. Branch: `Codex/M8a`, vervolg op `b532621`.

Status: deze afgebakende deelstap is geïmplementeerd en gericht getest met Node en headless Microsoft Edge. Geen merge naar main en geen volledige M8a-acceptatie. Het ellipsgereedschap is niet in de UI geactiveerd.

## Implementatie

`renderer.js` tekent één analytische SVG `ellipse`, met getransformeerd centrum, twee halve assen en omgekeerd rotatieteken wegens de SVG-y-as. De halve assen worden met volledige getalprecisie geschreven, zodat een zeer smalle geldige ellips niet door de algemene afronding op zes decimalen een nulstraal krijgt. De rotatie wordt uit de gevalideerde richtingsvector afgeleid, ook bij grote eindige rotatieparameters. De contour wordt binnen de bestaande clipBounds begrensd via een clipgroep om het geroteerde element. Stijl, opacity, labels en lagen blijven via de bestaande renderpaden lopen. Berekende geometrie en documentgegevens worden niet gewijzigd tijdens rendering.

`EllipseGeometry.nearest` blijft de zuivere wiskundige bron voor de dichtstbijzijnde contourpositie. Een optionele affiene mapping maakt de afstand werkelijk Euclidisch in de meetruimte, inclusief niet-uniforme CSS-transformaties en shear. De twee getransformeerde halve assen worden tot hoofdassen gereduceerd. In het eerste kwadrant wordt de unieke binnenste stationaire positie met maximaal 96 bisectiestappen gezocht; centrum- en asgevallen worden apart analytisch behandeld. Geen poolhoekbenadering of contourpolygoon. Ongeldige definities, niet-eindige resultaten en numeriek singuliere mappings leveren geen kandidaat op.

`index.js` gebruikt deze afstand voor puntselectie in modelruimte en CSS-pixels. Het binnengebied van een ellips blijft bij puntselectie uitgesloten, ook bij vulling; er wordt geen extra centrumobject getekend. De bestaande selectieprioriteit van punten blijft behouden. `rectangle-selection.js` gebruikt analytische extrema voor volledige insluiting en analytische contourkruisingen voor kruissectie. Een klein kader geheel in het lege binnengebied selecteert de ellips niet.

`SnapService` berekent per ellips één virtueel contourpunt bij de actuele pointer. Dit wordt niet opgeslagen in het document of toegevoegd aan een onbeperkte samplelijst. Het gebruikt dezelfde nearest-functie, bestaande CSS-snaptolerantie en deterministische prioriteitsvergelijking. Zelf-/downstream-uitsluiting, beschikbaarheid, laagzichtbaarheid en bestaande snaprechten worden gerespecteerd. De prioriteit is 3, gelijk aan cirkelcentrum en vóór raster. Er worden geen ellipsintersecties aangeboden.

De bestaande restricted-facade/projectie voedt zowel renderer, selectie als snapservice. De browserproef bevestigt dat het intrekken van een brandpuntrecht de ellipsen, IDs en labels ook uit de gegenereerde SVG-DOM verwijdert.

## Verificatie

Laatste gerichte Node-run: **182 tests geslaagd**, **0 fouten**, waaronder **9 nieuwe rendering-/selectietests**. Dit is een selectie van bestaande en nieuwe suites en geen volledige projectregressie.

```powershell
node --test tests/ellipse-render-selection.test.cjs tests/ellipse-permissions.test.cjs tests/ellipse-model.test.cjs tests/ellipse-geometry.test.cjs tests/snapping.test.cjs tests/rectangle-selection.test.cjs tests/selection-presentation.test.cjs tests/mutation-selection.test.cjs tests/construction-presentation.test.cjs tests/construction-contract.test.cjs tests/permissions.test.cjs tests/documents.test.cjs tests/regions-contract.test.cjs tests/history.test.cjs tests/linked-paths.test.cjs tests/persistent-groups.test.cjs tests/layers.test.cjs
node tests/browser-ellipse-render.cjs
git diff --check
```

De Node-tests bevatten 120 deterministisch gegenereerde affiene ellipsgevallen met onafhankelijke normaaloffset-orakels. Voor aanvullende binnen-/buitenqueries wordt een onafhankelijk dicht bemonsterde contour als globale bovengrens gebruikt. Verder: rotaties 0/45/90/135 graden, cirkelvariant, zeer smalle ellips, volledige numerieke straalprecisie, CSS-zoom/pan/shear, randafstand, puntprioriteit, marquee, virtuele snaps, zelf-/downstream-uitsluiting, verborgen lagen, invaliditeit/herstel en restricted SVG-/labelredactie.

De gerichte Edge-proef gebruikt het echte editor.html-scriptmanifest en afzonderlijke testscènes. Bevestigd:

- Vier correcte ellipsrotaties via browser-SVG-geometrie, 32 contourpunten per rotatie.
- Selectie en snapping met een pointer op 4,5 CSS-pixels afstand; afwijzing bij 1 pixel tolerantie en in het interieur.
- Clipping na rasterisatie van de zelfstandige SVG naar een PNG-canvas: zichtbare linkercontour aanwezig, afgeknipte rechtercontour afwezig.
- Restricted DOM zonder ellipsen, private IDs en labels na ingetrokken bronrechten.
- `pageErrors: []`.

De eerste Edge-start binnen de sandbox mislukte door het tijdelijke browserprofiel. De proef is daarna succesvol buiten de sandbox uitgevoerd. Eén testfixture is gecorrigeerd naar de verplichte documentversie 9; dat betrof het testdocument, geen productfout.

Lokale, genegeerde testartefacten: `test-results/ellipse-render-edge.png` (vier rotaties) en `test-results/ellipse-clipping.png` (rasterclipping). Beide zijn visueel bekeken. Zij worden niet als bronbestanden gecommit.

## Prestatiemeting en grenzen

In headless Edge: 200 gekoppelde ellipsen, tien rondes begin/preview/cancel met een bewegend brandpunt. Laatste run: mediaan **41,6 ms**, maximum **65,7 ms** per ronde. Duizend gecachete leesmodeltoegangen kostten samen **14,5 ms**. Een eerdere run gaf 55,7 ms mediaan en 71,1 ms maximum. Dit meet de volledige command-/previewketen, niet uitsluitend de projectiecache of het tekenen.

Deze lokale meting bewijst geen vloeiende 60-fps-interactie bij 200 ellipsen. De volgende interactiestap moet de pointer-/previewfrequentie en kosten opnieuw beoordelen. Er is geen tussentijdse grote architectuurrefactoring uitgevoerd.

Numeriek niet-representeerbare contourdetails onder een singuliere of extreem slecht geconditioneerde mapping geven geen projectiekandidaat. Er blijft een afzonderlijke acceptatiepoort voor extreme coördinaten in een echte bedieningssessie.

## Gewijzigde bestanden en open werk

`ellipse-geometry.js`, `renderer.js`, `index.js`, `rectangle-selection.js`, `snap-service.js`, `editor.html` (scriptcachetoken), `tests/ellipse-render-selection.test.cjs`, `tests/browser-ellipse-render.cjs`, het ellipscontract, de roadmap en dit verslag.

De driestapsconstructie F1 → F2 → Q, live preview/annulering, S-eigenschappeneditor en UI-activering volgen in een afzonderlijke deelstap. Punt-op-ellips valt onder M8a-2. De hier uitgevoerde rasterproef bevestigt de renderketen maar vervangt geen volledige SVG/PNG-exportbediening, uitgebreide restricted DOM-/clipboard-/ARIA-controle, complete Edge-interactie/regressie of handmatige gebruikersacceptatie. M8c wordt niet vooruitlopend geïmplementeerd.
