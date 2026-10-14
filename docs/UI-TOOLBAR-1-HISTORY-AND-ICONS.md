# UI-TOOLBAR-1 — Geschiedenis en titelbalkiconen

**Versie:** 1.0.0  
**Datum:** 2026-10-14  
**Branch:** `codex/ui-radial-7-point-context-constructions`  
**Status:** geïmplementeerd en gepusht op ontwikkelbranch, nog niet naar `main` gemerged; **geen automatische of browsertests gedraaid**.

## Goedgekeurde UI-afspraak

1. Hoofdeditor: de knoppen **Ongedaan** (`undoBtn`) en **Opnieuw** (`redoBtn`) staan voortaan als **enkel SVG-icoon** in de lichte werkvlakbalk `#navigationTools`, rechts van de bestaande navigatie-/fullscreenknoppen. De knoppen zijn **verwijderd uit de donkere hoofdtitelbalk**.
2. Wiskundige Tekst Editor: `richUndo` en `richRedo` staan als **enkel SVG-icoon** in de `rich-text-toolbar` **direct na het icoon Rechts uitlijnen**, gegroepeerd en visueel gescheiden met een korte rand. De geschiedenis knoppen staan niet langer in de teksteditortitelbalk.
3. Zowel documentgeschiedenis als tekstgeschiedenis behouden hun **eigen aparte Undo/Redo-commandostack**. De bestaande button-IDs, clickhandlers, gehandhaafde disabled-state, Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z-sneltoetsen, keyboardfocus en `aria-label` zijn behouden. Er zijn geen duplicaatknoppen gemaakt.
4. De zichtbare producttitel, browserpaginatitel en footer gebruiken **Wiskundige Illustratie Editor**.
5. **Opslaan** toont een herkenbare SVG-**diskette** met tekst `Opslaan`, in plaats van een decoratief blokteken.
6. **Meer** (beide titelbalken) toont hetzelfde SVG-**ellipsis**-pictogram (drie horizontale stippen) met tekst `Meer`; ook fontgrootte, gewicht, uitlijning en afmetingen van titelbalkknoppen zijn consistent.
7. **Toevoegen** in de Wiskundige Tekst Editor toont een SVG-**plusteken** met tekst `Toevoegen` in plaats van het oude blokteken. De bestaande submitactie en het annuleren blijven intact.
8. Nieuwe knoppen blijven semantische `button`-elementen. `Meer` blijft een bestaande `details/summary`-menubediening met toetsenbordtoegang, geen nieuwe menuengine.
9. De nieuwe pictogrammen worden als inline SVG opgenomen in `editor.html` en delen stijlen via `editor.css`; geen externe afbeeldingsbestanden of bibliotheken nodig.

## Wijzigingen

- `editor.html`: plaatsing en inhoud van knoppen, titel, cacheversie `ui-toolbar-1`.
- `editor.css`: herbruikbare SVG-afmetingen, titelbalk-typografie, icoongroepen, responsive/disabled-state.

`editor.js`, `text-workspace.js` en de rich-text-engine zijn **niet functioneel gewijzigd**; de bestaande undo/redo-handlers blijven rechtstreeks naar dezelfde IDs wijzen.

## Acceptatiecontrole

1. Maak een object, verplaats het, klik hoofdcanvas **Ongedaan** en **Opnieuw**; controleer dezelfde geschiedenis en disabled-state als vóór de verplaatsing.
2. Open de Wiskundige Tekst Editor, typ iets en kies de twee icoonknoppen naast **Rechts uitlijnen**; controleer dat alleen de **tekstgeschiedenis** wordt bediend.
3. Controleer in beide modes de sneltoetsen, zichtbare keyboard-focus, tooltip en toegankelijke knopnamen.
4. Test Opslaan, Meer-menu in beide titelbalken, Toevoegen, Annuleren en hun reeds bestaande acties.
5. Controleer klein scherm, zoom, fullscreen en horizontaal ombreken van de rich-text-toolbar.
6. Controleer dat de hoofd- en teksteditortitelbalk geen dubbele geschiedenisacties meer bevatten.

**Verificatie:** statische GitHub-broncontrole op unieke IDs, plaatsing, SVG-iconen, ongewijzigde history handlers en CSS. **Geen automatische of browserregressietests** uitgevoerd.
