# PERF-1.2a — Implementatiestart en acceptatiecontract

**Status:** klaar voor uitvoering door Codex; productieoptimalisatie nog niet geïmplementeerd.  
**Basis:** `main` na merge van PERF-1.1, commit `939af5f86a60d6894a3e109a5c2396de31e315be`.  
**Branch:** `codex/perf-1-2a-render-invalidation`.  
**Referentie:** [PERF-1-BASELINE-AUDIT.md](PERF-1-BASELINE-AUDIT.md).

## Doel
Scheid canvas-/viewportinvalidatie van updates aan objectenlijst, inspector en bedieningspanelen. Elimineer de bewezen onnodige herbouw van `renderViewList()` tijdens zuiver pannen en zoomen. Behoud één centrale render- en pointereigenaar in `EditorApp`.

## Uitvoering
1. Controleer actuele HEAD, schone werkboom, en lees audit plus de actuele code op deze branch (niet de oude auditbranch).
2. Leg karakteriseringstests vast voor pan, zoom, selectie, permissies, documentmutaties, lagen, labels, geschiedenis, text/math en restricted mode.
3. Definieer expliciete invalidatieredenen en de afhankelijkheden van canvas, overlays, objectenlijst, inspector en bediening. Onzekere paden moeten terugvallen op een volledige correcte update.
4. Implementeer uitsluitend de veilige navigatieoptimalisatie: een viewportwijziging mag geen herbouw van een inhoudelijk ongewijzigde objectenlijst/inspector veroorzaken. Behoud huidig zoom-/undo-gedrag; geen wheel-eventcoalescing in deze fase.
5. Bewaak statuswijzigingen die méér dan canvas beïnvloeden (selectie, objectcreatie/verwijdering, lagen, permissions/epoch, undo/redo, preview, afhankelijke waarden, fullscreen, documentimport).
6. Meet met dezelfde PERF-1.1-fixtures vóór en na in dezelfde browseromgeving, minimaal 10/100 en indien uitvoerbaar 500 objecten. Rapporteer per navigatieactie aantal lijst-/inspectorrenders, SVG/DOM-tijden en totale synchronische werktijd; probeer framemetrics in zichtbaar Edge.
7. Voer gerichte tests tijdens het ontwikkelen en de volledige `npm test` en `npm run test:edge` vóór acceptatie uit. Verzwak geen tests en meld elke niet-uitgevoerde controle.
8. Lever `docs/PERF-1.2a-IMPLEMENTATION-REPORT.md` met diff-overzicht, invalidatiematrix, gemeten winst, regressies, risico's, testbewijs, commit-SHA en GO/NO-GO voor PERF-1.2b.

## Buiten scope
Geen geometrie- of documentformaatwijzigingen; geen autorisatiecaching; geen nieuw renderpad, productieafhankelijkheden, incrementele SVG, tijdelijke pan-transformaties of nieuwe zoomgeschiedenis. Niet mergen naar `main` zonder expliciete gebruikersacceptatie.
