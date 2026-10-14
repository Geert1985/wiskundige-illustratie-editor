# UI-RADIAL-10 — Scrollbereik en regio-eigenschappen

**Versie:** 1.0.0  
**Datum:** 2026-10-14  
**Branch:** `codex/ui-radial-7-point-context-constructions`  
**Scope:** contextueel constructievenster; vulkleur en oppervlaktelabel van `polygonRegion`, `circleSectorRegion` en `circleSegmentRegion` (de gebruiker meldde met name cirkelsector/cirkelsegment).  
**Status:** code op branch gepusht; **niet** naar `main` gemerged; geen automatische of browserechte regressietests gedraaid.

## Bevindingen en oplossingen

### 1. Scrollbare constructielijst binnen de werkruimte

**Oorzaak:** het zwevende paneel had al `overflow:auto`, maar de ingestelde `max-height` was onafhankelijk van de **werkelijke, geklemde top-coördinaat** en de schermonderkant. Bij een menu laag in het canvas kon de onderrand van het paneel onder de viewport terechtkomen, waardoor niet alle constructies bereikbaar waren.

**Oplossing:**
- `RadialProperties.place()` bepaalt `viewportBottom`, `available` en de toegestane `top`; daaruit volgt een expliciete `maxHeight`, berekend op basis van de vrije ruimte **onder** het zwevende paneel.
- `editor.css`: `overflow-y:auto`, `overflow-x:hidden`, `overscroll-behavior:contain`, een zichtbare scrollbar en `scrollbar-gutter:stable` voor de lange lijst.
- De header blijft sticky; bij het openen van een nieuwe categorie begint de scrollpositie opnieuw bovenaan.
- De vorm en schaal van het compacte zesdelige radiaalwiel zijn ongewijzigd.

### 2. Vulkleur van sector/segment

- `editor.js`: voor regio-objecten is **Vulkleur** het standaarddoel van de gewone kleuractie in de objectlijst. In `Uiterlijk` blijft een expliciete `Vulkleur`-knop en wordt de randkleur afzonderlijk **Randkleur** genoemd.
- Gebruik uitsluitend het bestaande kleurvenster en `style.fill`-/`style.stroke`-commando en bestaande permission checks. Er is geen tweede kleur- of stijlopslag.
- `renderer.js`: een expliciete `style.fill='none'` betekent nu ook werkelijk transparant in SVG; de renderer overschrijft dat niet langer met de standaardkleur `#f4c84a`.
- De bestaande `style.opacity` en andere stijlvelden blijven intact.

### 3. Oppervlakteprecisie en labelpositie

- Regio-inspector → Oppervlakte: **slider met gehele stap 1, minimum 0, maximum 3 en standaard 2 decimalen**. Het actuele slidergetal wordt naast het veld getoond; wijziging wordt opgeslagen via bestaand `object.setProperties`-pad `areaDisplay.precision`.
- `RegionGeometry.format()` gebruikt **effectief 2 decimalen** bij een oudere `precision:null` en begrenst de **weergegeven** precisie tot 3. Oudere documenten met precisie boven 3 kunnen nog worden geladen; de opgeslagen waarde wordt niet stilzwijgend gemigreerd. De actuele slider geeft maximaal 3 aan en volgt het vernieuwde bereik bij de eerstvolgende wijziging.
- De oorspronkelijke velden `Labelpositie`, `Horizontale offset` en `Verticale offset` zijn **uit de UI verwijderd**.
- Het oppervlaktegetal van de regio wordt gerenderd met dezelfde `renderLabel()`-implementatie, CSS-klasse `.object-label` en `data-label-id` als overige versleepbare labels. De eerdere expliciete `pointer-events="none"` is verwijderd.
- Verslepen gebruikt **de bestaande** `labelOffsetX`/`labelOffsetY`-eigenschappen en dragcontroller inclusief historische wijzigingen en permissies. Geen aparte regio-specifieke drag-interactie.
- Voor **oude documenten** worden bestaande `areaDisplay.position`-offsets nog toegepast bij het eerste renderen, zodat hun label niet verspringt. De nieuwe drag-offset wordt daarbovenop toegepast. De oude schemavelden blijven voor lezen/compatibiliteit geldig, alleen de configuratieknoppen verdwijnen.
- Regiongeometrie, dynamische oppervlakteberekening en opgeslagen constructieafhankelijkheden worden niet gewijzigd.

## Bestandsgrenzen

- `editor-radial-properties.js`: viewportafhankelijke scrollbegrenzing, scroll reset.
- `editor.css`: scrollport en slider.
- `editor.js`: regio-kleuractie, vul-/randkleurbenaming, precisieslider/uitvoer, verwijderen positieconfiguratie.
- `renderer.js`: regulier sleepbaar oppervlaktelabel en correcte transparante vulling.
- `region-geometry.js`: weergaveprecisie 0–3, fallback 2 bij `null`.
- `editor.html`: cacheversies voor alle gewijzigde assets.

## Handmatige acceptatie

1. Kies punt met een lange constructielijst, open het wiel onderaan of rechts in het canvas; **alle opties** zijn via scrollen bereikbaar en de kop blijft zichtbaar. Wissel categorie en controleer terugkeer naar de bovenkant.
2. Herhaal voor cirkel, rechte, driehoek en in fullscreen/responsive.
3. Maak cirkelsector en cirkelsegment; selecteer beide apart → Uiterlijk → **Vulkleur**. Wijzig, controleer SVG-weergave en Undo/Redo. Test ook `geen vulling` en **Randkleur** onafhankelijk.
4. Toon Oppervlakte: een nieuw gebied toont standaard **2** decimalen. Slider van **0 → 1 → 2 → 3** verandert telkens het getal én het label. Opslaan/herladen moet waarden behouden.
5. Sleep de zichtbare oppervlaktemeting rechtstreeks op het canvas, controleer selectie/drag, Undo/Redo, export en behoud van positie na bronwijziging.
6. Open een ouder bestand met `areaDisplay.position.mode='offset'`: geen plotselinge verschuiving; de oude invoervelden komen niet terug, maar nieuwe versleping werkt.
7. Controleer rechten, vergrendelde/verborgen regio's en algemene labels; deze mogen niet per ongeluk hun bevoegdheden verliezen.

**Teststatus:** statische bron- en GitHub-controle. Geen Node/Edge/browsertests gedraaid overeenkomstig eerdere afspraak; handmatige acceptatie van deze nieuwe veranderingen nog open.
