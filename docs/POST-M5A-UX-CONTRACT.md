# Post-M5a standaardinstellingen en instructies

Datum: 2026-10-10. Scope: eerste twee afgesproken aanvullingen.

Nieuwe editor-documenten starten met raster aan; expliciet opgeslagen zichtbaarheid blijft behouden. De zelfstandige renderer en historische documenten krijgen geen migratie. Nieuwe constructies krijgen centraal rood #e63946: stroke voor lijnen en stroke/fill voor punten. Gewone tekenobjecten blijven hun bestaande stijl gebruiken. Herberekening bewaart handmatige overrides, import kleurt niets om.

Alle teken-, meet- en constructietools hebben centrale declaratieve instructies, bovenaan Eigenschappen, naast bereikbare objecteigenschappen. Actieve stap vet met Stap X van N, voltooide stappen gemarkeerd. Vrije veelhoeken gebruiken een oplopende stap met variabel totaal. Alternatieve selecties worden beschreven. Ongeldige selecties behouden de stap, annuleren en toolwissel herstellen de toolstatus. Fullscreen gebruikt dezelfde instructies in de bestaande instructiestrook. Toegankelijke status, geordende stappen en aria-current; geen extra pointercontroller of documentvelden.

Verificatie: Node regressies voor centrale stijl en behoud, declaratieve tooldekking/progressie; echte Edge-events voor nieuw document/import, stapprogressie, ongeldige selectie, Escape, alternatieven en fullscreen. Geen M5b, eenheden, dynamische tekst, vectoren of verzamelingen implementeren.
