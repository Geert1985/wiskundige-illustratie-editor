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

Nog niet uitgevoerd.

## GEO-UI-3 — Onafhankelijke metingen en maatlabels

Nog niet uitgevoerd.
