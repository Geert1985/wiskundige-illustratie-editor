# UI-COLOR-1 — Kleurenpalet en kleurkiezer

**Versie:** 1.0.0  
**Datum:** 2026-10-14  
**Branch:** `codex/ui-radial-7-point-context-constructions`  
**Status:** UI op ontwikkelbranch gepusht; **niet naar `main` gemerged**, nog geen gebruikersacceptatie en geen geautomatiseerde/browserregressietests uitgevoerd.

## Productafspraak

Het modale venster **Kleur wijzigen** moet een compacte, goed leesbare, donkerblauwe/gouden stijl hebben die aansluit op het radiaalmenu en de titelbalk. De kleurkiezer blijft één gedeeld component voor bestaande objectstijlen (waaronder regio-vulkleur en randkleur); geen tweede opslag, model of kleurenengine.

- Bovenaan twee duidelijke voorbeelden: **Huidig** en **Nieuw**, met leesbare kleurcode. `none` krijgt een schaakbordachtergrond en rode diagonale streep.
- **Snelle kleuren:** twaalf benoemde, visueel uitgebalanceerde presets in een 6×2 raster met grotere afgeronde vierkante swatches, hover- en toetsenbordfocus, geselecteerde gouden rand en `aria-pressed`. De bestaande zeven kleuren blijven beschikbaar; vijf extra neutrale/heldere kleuren worden toegevoegd.
- **Geen vulling** verschijnt uitsluitend bij `style.fill`, op een eigen rij onder de presets; de bestaande directe actie blijft intact.
- **Eigen kleur:** de bestaande HEX-tekstinvoer blijft de canonieke waarde voor de kleuractie. Ernaast staat een native `input type=color` voor een willekeurige kleur; beide worden synchroon gehouden met de presets en de voorbeeldvakken.
- **Ongeldige HEX-code:** `aria-invalid`, en **Toepassen** wordt uitgeschakeld. Zodra een geldige code of preset wordt gekozen, is de knop opnieuw actief.
- **Bestaande transacties behouden:** preset-, HEX- en native-kleurkeuzes tonen dezelfde directe objectpreview als voorheen; **Annuleren** herstelt de vorige stijl, **Toepassen** bevestigt de bestaande preview/Undo-geschiedenis en runtime-transactie. `none` blijft `none` wanneer zonder kleurwijziging op Toepassen wordt geklikt.
- **Compatibiliteit:** bestaande kleuren `#RGB` worden bij openen genormaliseerd naar `#RRGGBB`. Een ontbrekende `style.fill` krijgt als voorbeeld de rendererstandaard `#f4c84a`, geen foutieve aanduiding `none`. De opgeslagen objectstijl wordt alleen gewijzigd na een expliciete keuze.
- Het dialoogvenster blijft responsief, heeft een begrensde hoogte en blijft bedienbaar met toetsenbord, Escape en native kleurkiezer.

## Gewijzigde bestanden

- `editor.html`: nieuwe semantische opbouw van het dialoogvenster, twee previewvakken, native kleurkiezer en assetversies.
- `editor.css`: vormgeving, grid, focus/selected, mobiele layout en contrast.
- `editor-color.js`: twaalf presets, selectie-ARIA, afzonderlijke transparantieactie.
- `editor.js`: synchroon bijwerken van preview, HEX, native kleurkiezer en selectie; behoud van bestaande geschiedenis- en permissieafhandeling.

## Acceptatiecriteria (handmatig nog open)

1. Open een puntkleur, kies een preset, verander daarna de HEX-code en daarna de native kleurkiezer: de canvaspreview en **Nieuw** volgen alle drie; **Huidig** blijft onveranderd.
2. **Annuleren** en Escape herstellen de oorspronkelijke kleur; **Toepassen** en Undo/Redo gedragen zich als vóór de UI-wijziging.
3. Kies een cirkelsector/-segment: **Vulkleur**, **Randkleur** en **Geen vulling** werken onafhankelijk. Een transparante regio blijft transparant als je het venster opent en zonder wijzigingen sluit.
4. Probeer een ongeldige HEX-code en corrigeer deze; selectie, disabled-state en focus werken.
5. Controleer zowel desktop als smal scherm, fullscreen, tabnavigatie, focusring, tooltip, kleurcontrast en de Wiskundige Tekst Editor (gedeelde presets).
6. Controleer bestaande objectkleuren, import/export en permissies.

**Teststatus:** alleen statische code- en GitHub-verificatie; geen automatische tests of browsersessies gedraaid.
