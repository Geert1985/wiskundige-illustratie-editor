# WIE — UI-RADIAL-12: centrale cirkel en segmentafstand

**Versie:** 1.0.0  
**Datum:** 2026-10-15  
**Branch:** `WIE/Radiaalmenu`  
**Status:** Geïmplementeerd, gerichte controles geslaagd. Volledige Edge- en regressiesuite blijft een acceptatiestap.

## Goedgekeurde visuele referentie

De door de gebruiker goedgekeurde afbeelding verfijnt UI-RADIAL-11 op twee plaatsen:

1. Zes buitenste segmenten met iets meer zichtbare tussenruimte, zonder de zes functies, de rotaties of de interactie te wijzigen.
2. Een brede, gebogen zwarte objectnaambalk in de middencirkel. Daaronder twee symmetrische gebogen knoppen: links label tonen/verbergen (T), rechts positie vergrendelen/ontgrendelen.

## Implementatie

- `editor-radial-properties.js`: `SEGMENT_SHAPE`, `SEGMENT_INSET` en `SEGMENT_SHEEN` zijn horizontaal versmald. De drie onderste hub-SVG-paden zijn opnieuw getekend als afzonderlijke, symmetrische en binnen de middencirkel begrensde vlakken.
- `editor.css`: gouden contour rond de zwarte naambalk, nieuwe bovenpositie en breedte van het transparante naamveld; T en sloticoon zijn groter en hun native HTML-knoppen zijn breder, zonder overlap.
- `editor.html`: cacheversie `radialmenu-4` voor CSS en radiaal-JavaScript.
- `tests/radial-petals.test.cjs`: nieuwe contourgeometrie en cacheversies worden gecontroleerd.
- `tests/browser-radial-menu.cjs`: tests toegevoegd voor segmentbreedte, de drie hubvormen en gescheiden klikvlakken.

## Gecontroleerd

- Codegerichte radiaaltests: 2/2 geslaagd op de actuele bestanden van de branch.
- Geïsoleerde Chromium-proef op 70% schaal: zes segmenten, transparante naaminput, het naamveld volledig binnen de cirkel, geen overlap tussen naamveld en knoppen, geen overlap tussen beide knoppen en knoppen binnen de cirkelrand.

**Beperking:** de Chromium-proef is een geïsoleerde representatie van het bijgewerkte ontwerp, niet een volledige WIE-render. `npm test` en `npm run test:edge` zijn hier nog niet uitgevoerd.

## Acceptatie in de editor

1. Selecteer een punt, lijnstuk, cirkel, dynamische constructie en meervoudige selectie: bekijk of de zes buitenste segmenten correct afstanden behouden.
2. Controleer de objectnaam en de T-/slotknoppen op de normale browserschaal, op smallere schermen en in fullscreen.
3. Controleer rename (Enter, blur), T aan/uit, slot aan/uit, focus, Escape en draghandle; het objectmodel blijft ongewijzigd behalve de bedoelde eigenschap.
4. Controleer de bestaande Acties-panelen en de werking na object verbergen.
5. Voer `npm test` en `npm run test:edge` uit voordat `main` wordt bijgewerkt.
