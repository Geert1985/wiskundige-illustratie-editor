# M6a-rapport — Driehoekcentra

Implementatieversie: 1.0.0
Contractbasis: goedgekeurd contract 1.1.0, `main` commit `bcd0655`
Werkbranch: `chatgpt/m6a-triangle-centers`

## Implementatie

De drie afzonderlijke dynamische puntconstructies `centroid`, `circumcenter` en `orthocenter` zijn toegevoegd. Ze gebruiken alle de gedeelde bronrol `triangle`: een bestaande polygon met precies drie vertices. Het recept bewaart alleen `{objectId}`. De bestaande construction graph herberekent het punt bij bronwijzigingen, bewaart hetzelfde resultaat-ID wanneer de driehoek tijdelijk ontaardt en verwijdert afhankelijke constructies volgens het bestaande cascadebeleid.

De constructies zijn toegevoegd aan het bestaande puntconstructiemenu met instructies, bronselectie en foutstatussen. Ze blijven gekoppelde puntobjecten en gebruiken constructionSchema 2, de bestaande permissiecontroles, geschiedenis, semantic commands/replay, JSON-opslag en SVG-renderer/export.

Een noodzakelijke integratiecorrectie was nodig in de bestaande polygonvalidator. Die validator wees bijna-collineaire driehoeken al af met een absolute tolerantiedrempel voordat M6a de contractuele relatieve grens kon toepassen. De validator laat nu die degeneratiecontroles uitsluitend achterwege voor exact-driehoekige polygonen die als bron van een M6a-constructie worden gebruikt. Exact samenvallende vertices blijven ongeldig; niet-gekoppelde polygonen en gewone polygonbewerking behouden hun bestaande validatieregels. Import blijft atomair en de ConstructionService valideert de bronrol alsnog.

## Numerieke methode en keuzes

Alle drie berekeningen gebruiken genormaliseerde lokale coördinaten: `s` is de maximale Euclidische zijde, `u=(B−A)/s`, `v=(C−A)/s` en `q=cross(u,v)`. De circumcenter gebruikt de determinantoplossing van de twee lokale dot-productvergelijkingen. Het zwaartepunt wordt lokaal berekend als `(u+v)/3`; het hoogtepunt als `u+v−2o`. De uitkomst wordt pas daarna teruggeschaald en naar documentcoördinaten vertaald.

De gemeenschappelijke degeneratiegrens is inclusief: `abs(q) <= 1e-12` geeft voor alle drie `DEGENERATE_TRIANGLE`, ook voor het zwaartepunt. De grensfixtures gebruiken A=(0,0), B=(1,0), C=(0,t); daarin is `s=1` in binary64 en de tests controleren de feitelijke `q`-waarde zowel net onder, exact op als net boven de grens.

De schaalbewuste invariantcontroles werken in het genormaliseerde lokale frame. De relatieve close-controle gebruikt `128 * Number.EPSILON` (`2.842170943040401e-14`) maal `max(1, |x|, |y|)`. De controles vergelijken de drie afstanden van O, dimensieloze loodrechtheidsresiduen van de hoogtelijnen, een onafhankelijk geordende berekening van G, en `H=3G−2O`. Een niet-eindige waarde of residu geeft `NON_FINITE_RESULT`; een eindige invariantafwijking geeft `INVARIANT_FAILURE`. Centrumcoördinaten buiten `±1e12` geven `COORDINATE_LIMIT`. Er wordt niet stilzwijgend begrensd.

Grote gemeenschappelijke translaties worden vóór de meetkundige berekening afgetrokken door het lokale frame. Een test controleert alle vertexpermutaties en een driehoek nabij de absolute documentlimiet met representabele increments. De bestaande inputcoördinatenlimiet blijft `1e12`.

## Gewijzigde bestanden

- `construction-service.js`
- `model.js`
- `polygon-geometry.js`
- `editor.js`
- `editor-tool-instructions.js`
- `editor.html`
- `tests/triangle-centers.test.cjs`
- `tests/browser-triangle-centers.cjs`
- `tests/browser.cjs`
- `docs/M6a-REPORT.md`

De bestaande niet-gevolgde `docs/FEATURE-GAP-ANALYSIS.md` is niet gewijzigd of meegenomen.

## Testresultaten

- `node --test tests/*.test.cjs` — **581 geslaagd, 0 mislukt, 0 overgeslagen**.
- Gerichte M6a Node-regressies in `tests/triangle-centers.test.cjs` — **8 geslaagd, 0 mislukt, 0 overgeslagen**. Gedekt zijn de drie constructies, gelijkzijdige/scalene/rechthoekige/stomphoekige driehoeken, permutaties, grote translaties, de drie grensfixtures, alle numerieke foutstatussen, dynamisch herstel, bronrol/import, schema 2, replay, cascade en restricted permissies.
- Gerichte Edge-integratie via `M6A_ONLY=1 node tests/browser.cjs` — **geslaagd**: drie gereedschappen aangemaakt via de UI; bronwijziging, degeneratie en herstel gecontroleerd; undo/redo en SVG-uitvoer gecontroleerd; geen paginafouten.
- De volledige Edge-harness `node tests/browser.cjs` is gestart maar stopte vóór de M6a-module bij een bestaande niet-M6a-controle: `tests/browser-inputs.cjs:26` liep 30 seconden vast op `[data-select-object="p"]`, dat niet zichtbaar was. De overige volledige Edge-controles zijn daardoor in die run niet afgerond. De M6a Edge-regressie is afzonderlijk wel uitgevoerd en geslaagd.

## Bekende beperkingen en handmatige acceptatie

De volledige Edge-harness moet opnieuw worden uitgevoerd nadat de bestaande `browser-inputs.cjs`-selector-/zichtbaarheidsfout is opgelost. Dit viel buiten M6a en is niet aangepast. Een volledige handmatige acceptatie in de zichtbare browser is niet uitgevoerd.

Handmatige acceptatiepunten:

1. Kies elk van de drie gereedschappen en selecteer een driehoek in de editor; controleer dat er één gekoppeld punt verschijnt.
2. Controleer de driehoekscentra bij een gelijkzijdige, algemene, rechthoekige en stomphoekige driehoek.
3. Versleep bronvertices; controleer live herberekening en stabiele resultaat-ID.
4. Maak de bron collineair en herstel hem; controleer de foutmelding, verborgen ongeldige uitkomst en herstel.
5. Controleer undo/redo, JSON opslaan/heropenen, SVG-export en rechten in een restricted project.
6. Controleer fullscreen en pointerselectie aan de rand van de driehoek.

M6b is niet gestart en er is niets naar `main` gemerged.
