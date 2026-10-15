# GEO-UI implementation report

**Contract:** `WIE-GEO-UI-Geometrie-en-Metingencontract-v1.1.0.md`  
**Branch:** `codex/geo-ui-full-implementation`  
**Base:** `5403954` (`origin/main`, 2026-10-15)  
**Status:** in uitvoering; geen tests uitgevoerd, conform opdracht.

## GEO-UI-1 — Uniforme eigenschappenpanelen

De bestaande inspecteursecties worden in het eenobjectpaneel onder twee afzonderlijk inklapbare hoofdsecties gegroepeerd: **Object en geometrie** en **Metingen**. Coördinaten/definitieparameters, projecties, cirkelverdelingen en ellipsgeometrie vallen onder Object en geometrie. De bestaande maatbediening, hoekmeting en regio-oppervlaktebediening vallen onder Metingen. De radiale actie **Meting** filtert dezelfde bestaande sectie; er is geen tweede modelstate toegevoegd.

**Gewijzigd:** `editor.js`, `editor-radial-properties.js`.  
**Model/schema:** ongewijzigd.  
**Controle:** code-inspectie en `git diff --check`; geen tests, browsercontrole of build uitgevoerd.

## GEO-UI-2 — Meetsemantiek

Rechten en halfrechten hebben geen eindige lengte: ze krijgen geen maatbediening meer in de inspecteur en de renderer tekent hun oude `showMeasurement`-waarde niet langer als maatlabel. De legacywaarde blijft bij import/export behouden. Een expliciete formatteringsaanroep voor deze objecten meldt `geen eindige lengte`. Vectorlabels duiden de reeds bestaande eindpunt-afgeleide norm aan als `(norm)`.

Hoekweergave blijft aangesloten op de bestaande `AngleMeasurements`-document- en objectinstellingen; lengte- en oppervlakteformattering blijven de bestaande documenteenheid/schaal respectievelijk schaal² gebruiken. `M7-VEC-FUND` is op de basisbranch alleen een ontwerpcontract. Daarom zijn vectorcomponenten, richting en zin niet toegevoegd; er is geen tweede vectorsysteem gebouwd.

**Gewijzigd:** `editor.js`, `measurement-geometry.js`, `renderer.js`.  
**Compatibiliteit:** legacy `showMeasurement` op rechten/halfrechten blijft opgeslagen maar wordt niet langer als eindige maat geïnterpreteerd.  
**Controle:** code-inspectie en `git diff --check`; geen tests, browsercontrole of build uitgevoerd.

## GEO-UI-3 — Onafhankelijke metingen en maatlabels

Nog niet uitgevoerd.
