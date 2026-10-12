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

## Testresultaten en regressiecontrole

- `node --test tests/*.test.cjs` — **582 geslaagd, 0 mislukt, 0 overgeslagen**.
- `node tests/browser.cjs` in Microsoft Edge — **volledige suite geslaagd**; geen paginafouten. De run bevatte ook de 73 formule-enginechecks, 912 onafhankelijke afrondingsfixtures, 19 transcendentale referentiechecks en 14 bronadapterchecks.
- De M6a Edge-regressie in dezelfde run slaagde: de drie tools, dynamische herberekening, tijdelijke degeneratie en herstel, geschiedenis en SVG-uitvoer.
- Nieuwe polygonregressie in `tests/triangle-centers.test.cjs` — ordinary driehoeken blijven aan de bestaande geometrievalidatie onderworpen; vier- en vijfhoek blijven geldig; een zelfsnijdende polygonimport wordt atomair geweigerd; bestaande vertexreferenties blokkeren topologiewijzigingen; alle drie M6a-centra bewaren een tijdelijk degeneratieve bron door JSON-roundtrip en herstellen met hetzelfde centrum-ID.

## Oorzaak en correcties van de afsluitende Edge-regressie

De eerste Edge-fout op `tests/browser-inputs.cjs` was geen timingprobleem en de selector was niet onjuist. De selector bestond, maar de hoofdwerkruimte bleef door `body.text-workspace-open` verborgen omdat Escape in de ProseMirror-invoer de gebeurtenis kon afvangen vóór de bestaande handler op de modeless tekstwerkruimte. Daardoor was `[data-select-object="p"]` aanwezig maar had die geen zichtbaar klikgebied. Dit was een productregressie in de Escape-afhandeling.

`text-workspace.js`, `text-insert-panel.js` en de integratie in `editor.js` laten Escape nu de juiste prioriteit volgen: een formule- of waardedraft annuleren, een open menu laten sluiten, en anders de tekstwerkruimte sluiten. De native dialog-cancel wordt aan dezelfde prioriteitslogica gekoppeld. `tests/browser-inputs.cjs` wacht nu expliciet op het sluiten van de werkruimte vóór het punt opnieuw wordt geselecteerd; de oorspronkelijke assertions voor Escape, geen extra commit en objectaantal zijn behouden.

De volgende Edge-controles legden twee gewijzigde UI-aannames bloot, geen productiefouten: de verborgen JSON-knoppen in een gesloten `details`-menu werden met een toegankelijke rolzoeker gezocht; de test gebruikt nu de bestaande stabiele element-ID's en behoudt beide bestaan-/disabled-controles. Daarnaast telde `browser-split-tools.cjs` zes puntconstructies, terwijl M6a er drie toevoegt; de verwachting is bijgewerkt naar negen en controleert expliciet `centroid`, `circumcenter` en `orthocenter`. Geen assertions zijn verwijderd of afgezwakt.

## Bekende beperkingen en handmatige acceptatie

De geautomatiseerde regressies zijn geslaagd in headless Microsoft Edge. Een handmatige, zichtbare browseracceptatie is niet uitgevoerd. De numerieke resultaten zijn getest in de huidige Edge/JavaScript-runtime; zoals eerder vastgelegd blijft transcendentale floating-point-uitkomst verificatie afhankelijk van de runtime.

Handmatige acceptatiepunten:

1. Kies elk van de drie gereedschappen en selecteer een driehoek; controleer dat één gekoppeld punt verschijnt.
2. Controleer de driehoekscentra bij een gelijkzijdige, algemene, rechthoekige en stomphoekige driehoek.
3. Versleep bronvertices; controleer live herberekening en stabiele resultaat-ID.
4. Maak de bron collineair en herstel hem; controleer de foutmelding, ongeldige uitkomst en herstel.
5. Controleer undo/redo, JSON opslaan/heropenen, SVG-export en rechten in een restricted project.
6. Controleer fullscreen en pointerselectie aan de rand van de driehoek.

M6b is niet gestart en er is niets naar `main` gemerged.