# M1 — Rechthoekselectie

## Regels vóór implementatie

Een rechtermuisknopdrag in Selecteren start één `marquee`-interactie in EditorApp. Pas vanaf 3 CSS-pixels verplaatsing is dit een selectie; een gewone rechterklik houdt zijn contextmenu. De richting in schermcoördinaten bepaalt de regel: links naar rechts volledig omsluiten, rechts naar links raken. De grenzen zijn inclusief, met uitsluitend een numerieke epsilon (geen snaptolerance).

Punten gebruiken hun mathematische positie. Lijnstukken/vectoren en hoekarmen gebruiken segmenten. Rechten en halfrechten gebruiken hun zichtbare, op de viewport geknipte geometrie. Cirkels en polygonen worden als gesloten geometrische gebieden getest, onafhankelijk van vulling; hun bounding box alleen is onvoldoende. Tekst en uitsluitend meetlabels gebruiken de daadwerkelijk gerenderde tekstbegrenzing (SVG getBBox, inclusief rotatie). Decoratieve labels, markerdiameter, pijlpunten, lijndikte en maatstreepjes vergroten de mathematische selectiegeometrie niet. Hoeken testen zowel de armen als hun boog of rechtehoekmarkering. Cirkelbogen gebruiken analytische snijpunten en extrema, ook bij een hoek van 180 graden. Deze expliciete selectiepolicy verandert geen objectgeometrie of documentformaat.

Verborgen objecten, ongeldig geworden constructies en niet-eindige/degenerate geometrie worden uitgesloten. Vergrendelde objecten blijven selecteerbaar. De bestaande beperkingen op bewerken blijven gelden.

Modifiers worden bij de start vastgelegd. Geen modifier vervangt, Shift verenigt, Ctrl of Meta wisselt lidmaatschap; Ctrl/Meta wint bij combinatie met Shift. Elke preview rekent opnieuw vanaf de oorspronkelijke selectie, zodat toggle niet oscilleert. De documentvolgorde bepaalt de volgorde van nieuwe IDs. Preview, highlights, lijst en inspector tonen dezelfde selectie. Commit neemt de laatste pointer-up-positie mee, ook buiten het canvas. Annuleren herstelt de oorspronkelijke selectie. Geen selectie-interactie schrijft geometrie of voegt een undo-stap toe.

## Toetsenbord

In Selecteren begint K (of de knop Kaderselectie) een toetsenbordkader in het midden van de viewport. Pijlen verplaatsen de cursor 10 CSS-pixels; Alt+pijl 1 pixel. Eerste Enter zet het beginpunt vast, tweede Enter bevestigt. C wisselt omsluiten/raken. Modifiers bij K of de knop bepalen vervangen/toevoegen/wisselen. Escape annuleert. In invoervelden wordt K niet onderschept. Pointerinvoer neemt een toetsenbordkader niet over. Statusmeldingen leggen fase, regel en bediening uit.

Pointercancel, blur, captureverlies, Escape, Nieuw en dispose gebruiken de bestaande cancel/teardown. Alleen het contextmenu van een daadwerkelijk gesleepte rechterknopselectie wordt onderdrukt. De overlay loopt door het bestaande centrale renderpad en gebruikt CoordinateTransform; er komt geen tweede pointercontroller.

## Verificatie

Nieuwe pure geometrie- en modifiertests, controller/lifecycle-tests en echte Edge-proeven; eerst rood, daarna groen. Bestaande 133 Node-tests, volledige Edge-suite en golden fixtures blijven behouden.
