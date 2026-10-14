# UI-RADIAL-4 — Previewgetrouw, technisch programmeerbaar radiaalmenu

**Datum:** 14 oktober 2026  
**Basisbranch:** \`codex/ui-radial-context-properties\`  
**Implementatiebranch:** \`codex/ui-radial-wheel-preview-design\`  
**Status:** code gepusht naar nieuwe featurebranch; geen merge naar main.

## Ontwerpdoel

Vertaal de door de gebruiker goedgekeurde afbeelding van het radiaalmenu naar echte browsercomponenten, **zonder de afbeelding zelf als achtergrond of als knop te gebruiken**. De preview toont een elegante ivoorkleurige cirkel met gouden buitenring, zes donkerblauwe, afgeronde radiale segmenten, gouden pictogrammen en een centrale donkerblauwe cirkel met naamveld en zespunts-sleepgreep.

Deze UI-RADIAL-4-implementatie bouwt voort op UI-RADIAL-3 en behoudt alle bestaande contextafhankelijke categorieën, inspectordetails, constructie- en groepsfunctionaliteit, permission checks, gegevenspersistente opdrachten en Undo/Redo. De permanente rechterbalk blijft verwijderd.

## Wijzigingen

- **\`editor-radial-properties.js\`**: zes SVG-vormsegmenten met gebogen trapeziumcontour, SVG-pictogrammen en semantische HTML-knoppen met \`aria-label\` en \`aria-pressed\`; ivoorkleurige cirkelachtergrond met gouden rand en zes spaken; dynamisch contextbijschrift (\`CONSTRUCTIE\`, \`OBJECT\`, \`TEKST\`, \`ASSENSTELSEL\`, \`SELECTIE\` en \`GROEP\`); zespunts-sleepgreep in midden; knoptekst tegenrotatie houdt labels rechtop; actieve sectie krijgt subtiele selectiefeedback.
- **\`editor.css\`**: consolideert de verspreide eerdere radiale CSS-aanvullingen in één coherente \`UI-RADIAL-4\`-sectie. Schaalbare 460×460 vectorlayout, navy/ivory/gold, afgeronde SVG-wedges, zachte schaduwen, ivoorkleurige ring, goudomlijnde middenzone, centrering van naam en pictogrammen, toetsenbordfocus en responsive inspector.
- **\`editor.html\`**: bijgewerkte CSS- en radiaalmodulecacheversie \`ui-radial-4\` voor het opnieuw laden van browsers.

## Renderingcontract

- **Geen bitmap-afhankelijkheid:** de goedgekeurde afbeeldingspreview is de visuele referentie, niet een noodzakelijke asset in het programma. Nieuwe objectnamen, andere categorieën, high DPI en browserzoom blijven daarom mogelijk.
- **Eén bron voor gedrag:** \`CONTENT\`, \`choose()\`, \`showDetail()\`, de bestaande inspector en geautoriseerde commando's blijven leidend; alleen presentatie en positionering zijn vervangen.
- **Vaste positie:** \`anchor\` verandert niet wanneer een categorie aangeklikt wordt; het bestaande sleepgreepje en de pijltjestoetsen verplaatsen het gehele wiel.
- **Schaalbaarheid:** de interne vormgeving gebruikt vaste 460×460 vectorcoördinaten; \`place()\` past uitsluitend de globale schaal aan de canvasafmetingen aan.
- **Bestaande quick actions:** de actie-detailkaart hergebruikt de reeds bestaande kleine inspector-iconen; er zijn geen extra grote duplicaatknoppen.
- **Contextmenu:** documentcapture blokkeert het native browsercontextmenu binnen de selecteerbare canvas-/radiale regio, conform UI-RADIAL-3.

## Aanvaarding en beperkingen

Het doel is de preview **visueel zo dicht mogelijk te benaderen met echte DOM/CSS/SVG-code**. Een exacte pixel-voor-pixel-identiteit met een gegenereerde rasterafbeelding is niet gegarandeerd: lettertype-rendering, de werkelijke canvasgrootte, browserzoom en viewport beïnvloeden de weergave.

Op expliciet eerder verzoek zijn **geen geautomatiseerde tests of browsertests** uitgevoerd. Alleen de gepushte bronbestanden en branchverschillen zijn statisch gecontroleerd. Voer voor een merge handmatige browsercontrole uit voor categorieklikken, hover/focus, rechtsklikken, groepsnaam wijzigen, slepen via de zespuntsgreep, fullscreen, responsiveness en SVG/JSON-opslag.


## UI-RADIAL-5 — visuele verfijning (14 oktober 2026)

Op expliciet verzoek na beoordeling van de browserweergave zijn de onderstaande details verfijnd:

- De standaardgrootte van het volledige wiel is **88%** van de UI-RADIAL-4-weergave (circa 12% kleiner); kleinere canvassen blijven adaptief schalen.
- Het pictogram bij **Geometrie** is een herkenbare driehoek met cirkel in plaats van een abstracte ruit.
- Het pictogram bij **Relaties** toont drie gekoppelde knooppunten in plaats van een bliksemsymbool.
- Het centrale invoerveld voor de objectnaam is versmald van **159 px naar 143 px**.
- De reeds aanwezige markering van de actieve categorie is **ongewijzigd** gebleven.
- CSS- en JavaScript-cacheversies zijn bijgewerkt naar `ui-radial-5`.

Alle aanpassingen betreffen presentatie. Er zijn geen objectmodellen, commandobewerkingen, constructierelaties of bestaande eigenschapscategorieën gewijzigd. **Geen tests uitgevoerd**, conform de eerdere afspraak. Deze branch is nog niet gemerged naar `main`.


## UI-RADIAL-6 — Compacte afmetingen zoals eerste menu (14 oktober 2026)

Op verzoek van de gebruiker is de goedgekeurde gebogen navy/gold-vorm behouden, maar de standaardafmetingen zijn teruggebracht naar de eerste compacte versie.

- Maximale schaal `0.70` op de vectorbasis `460×460`: circa **322×322 px** wanneer er voldoende ruimte is; in kleine canvassen verder adaptief.
- Segmentlabel: `16 px × .70 ≈ 11,2 px` effectief.
- Segmenticoon: `35 px × .70 ≈ 24,5 px` effectief.
- Centraal objectbijschrift: `14 px × .70 ≈ 9,8 px` effectief.
- Centrale objectnaam: `18 px × .70 ≈ 12,6 px` effectief.
- Centrale cirkel: `192 px × .70 ≈ 134 px`; centraal naamveld `143 px × .70 ≈ 100 px`.
- De visuele geometrie, gouden omlijning, gekoppelde-knooppunten- en geometrie-iconen, actieve categorieweergave en bestaande interacties blijven intact.
- Assetversie verhoogd naar `ui-radial-6`.

**Validatie:** alleen GitHub-bestanden gecontroleerd; **geen tests of browseruitvoering**, conform eerdere afspraak. Nog niet gemerged naar `main`.
