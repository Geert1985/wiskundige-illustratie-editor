# UI-PANEL-1 — Gedeelde vormgeving eigenschappenpanelen

**Versie:** 1.0.0  
**Datum:** 2026-10-14  
**Branch:** `codex/ui-radial-7-point-context-constructions`  
**Status:** geïmplementeerd op featurebranch, nog niet naar `main` gemerged; handmatige browseracceptatie open.

## Ontwerpbesluit

De door de gebruiker goedgekeurde preview van het paneel **Geometrie** is voortaan de **standaard** voor alle contextuele eigenschappenpanelen van de Wiskundige Illustratie Editor. De preview is een **visuele referentie**, geen verzoek om het paneel fysiek groter te maken. De huidige compacte afmetingen en scrollbegrenzing van UI-RADIAL-10 blijven behouden.

De gedeelde opmaak geldt voor Geometrie, Uiterlijk, Relaties, Metingen, Labels, Acties, Alles, puntprojecties, regio-oppervlakten en andere via het bestaande inspector-model gerenderde `<details data-property-section>`-secties. Dezelfde vormtaal wordt toegepast waar het assen-/rasterpaneel dit bestaande sectiepatroon gebruikt.

### Visuele standaard

- Donkerblauw/goud: subtiele donkerblauwe gradiënt, goudaccenten in de titel en sectiekoppen, dunne koele contouren, afgeronde sectiekaarten.
- Iedere uitklapbare sectie: compacte eigen kaart, duidelijke header, **SVG-pictogram**, chevron voor open/dicht en duidelijke scheiding tussen kop en inhoud.
- Consistente labeltypografie, select-/tekst-/getalvelden, checkboxen, sliders, kleurknoppen, focusringen, instructieve informatievakken en objectacties.
- Voor directe numerieke coördinatenvelden (zoals x/y en x1/y1) staat het label links en het getal rechts in dezelfde rij. Andere langere labels behouden hun eigen logische opbouw.
- Informerende `.help-text` in een discreet donkerblauw informatievak met info-symbool, leesbare tekst en voldoende contrast.
- Het zwevende paneel behoudt de bestaande beperkte breedte, viewportveilige hoogte, sticky titel en interne scrollbar.

### Architectuur

- **Één gedeeld CSS-systeem:** `editor.css`, uitsluitend gescoped onder `.radial-detail-pane`. Geen aparte HTML/CSS-kopieën per objecttype of radiaalcategorie.
- **Eén presentatiehelper:** `RadialProperties.decoratePropertySections()` plaatst idempotent een semantisch decoratief SVG-icoon (`aria-hidden=true`) in de bestaande native `summary` van iedere propertysectie. De iconen gebruiken de bestaande `SEGMENT_ICONS`; `PROPERTY_ICONS` koppelt propertysecties aan hun beeldtaal.
- `applyFilter()` voert de decoratie uit op de actuele inspector-DOM, ook na rerendering. Bestaande `details`-open/dicht-status, sectiefiltering, inspector-events, objectrechten, data-attributen, commandopaden en Undo/Redo blijven onveranderd.
- De secties blijven native `details/summary`, met toetsenbordfocus en duidelijke visuele focus.
- Voor toekomstige propertysecties: gebruik `data-property-section` en voeg desgewenst een pictogrammapping toe. Geen tweede component per paneel introduceren.

## Gewijzigde bestanden

- `editor.css`: gedeelde sectiekaarten en formuliercomponenten.
- `editor-radial-properties.js`: idempotente SVG-iconen voor sectiekoppen.
- `editor.html`: cacheversies van de gewijzigde assets.

## Handmatige acceptatie (open)

1. Selecteer een **punt**: open Geometrie en controleer de twee kaarten Coördinatenprojecties en Object en geometrie, hun iconen, checkbox, select, x/y-rijen en informatietekst.
2. Controleer **Uiterlijk, Relaties, Acties, Alles** en open/dicht van secties; functies, rechten en opslag mogen niet wijzigen.
3. Controleer lijnstuk, rechte, cirkel, veelhoek, cirkelsector, cirkelsegment, dynamische tekst, multiselectie en het assenstelsel. Dezelfde kaart- en veldstijl moet terugkomen waar er `data-property-section`-secties zijn.
4. Test labels, vul-/randkleur, precisieslider, constructiebronnen, contextuele constructielijst, Undo/Redo en lange scrolllijsten.
5. Test smal browservenster, fullscreen, keyboardtabbing, focusringen, disabled velden en lange sectienamen.
6. Controleer dat het radiaalwiel en de plaatsing/afmetingen van het detailvenster niet groter zijn geworden.

**Verificatie:** broncode-/GitHub-controle; geen geautomatiseerde of browserregressietests uitgevoerd.
