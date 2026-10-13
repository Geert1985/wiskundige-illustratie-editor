# G-TRI1 — Driehoek via drie bestaande punten

**Rapportversie:** 1.0.0
**Branch:** `codex/g-tri1-triangle-from-points`
**Basis:** `main` op `dcb3df30f2e5fd57d7d8f3933b96990130f4d70` (UI-T1 geïntegreerd)
**Document-/constructieschema:** documentversie 7 blijft behouden; nieuwe constructie gebruikt `constructionSchema: 2`.

## Implementatie

G-TRI1 is toegevoegd als constructierecept `triangleFromPoints` met resultaat `polygon`, berekend veld `vertices` en drie geordende bronrollen `point`. Het recept bevat drie afzonderlijke `{ "objectId": "…" }`-verwijzingen. Alleen drie verschillende, bestaande, geautoriseerde objecten van type `point` zijn geldig; polygonhoekpunten en lijnuiteinden worden niet als bron geaccepteerd. De bestaande constructievalidatie, `ConstructionService`, dependency-resolver, command- en permissiegrenzen, geschiedenis en semantische replay blijven het uitvoeringspad.

Het gereedschap staat onder **Gereedschappen → Constructies → Driehoekconstructies**. De editor vraagt achtereenvolgens punt A, B en C. Een al gekozen bron kan niet opnieuw worden gekozen. De resulterende driehoek is selecteerbaar en opmaakbaar. De vertices zijn berekende velden en de constructie levert geen verplaatsplan op; de bronpunten verplaatsen de driehoek.

De vormcontrole werkt met lokale verschillen vanaf A en genormaliseerde coördinaten. De schaal is de langste van de drie zijden; de determinant is `(ABx/s)*(ACy/s) - (ABy/s)*(ACx/s)`. `|determinant| <= 1e-12` geeft `DEGENERATE_TRIANGLE`, overeenkomstig de bestaande inclusieve, relatieve M6a-grens. De controle is gedeeld met de M6a-driehoekcentra; de bestaande centrumformules en invariantcontroles zijn behouden.

Bij tijdelijke degeneratie bewaart de resolver de actuele broncoördinaten in hetzelfde polygon-ID en zet `constructionValid` op false. Ongeldige afhankelijke geometrie wordt niet weergegeven en afhankelijke centra krijgen `SOURCE_INVALID`. Na herstel worden dezelfde objecten opnieuw geldig. Een constructiespecifieke polygonvalidatieoptie laat uitsluitend G-TRI1-driehoeken met een expliciet `triangleFromPoints`-recept degeneratieve vertices door de model-/JSON-rondtrip; gewone polygonen behouden hun bestaande validatie. Onbekende constructierecepten worden afgewezen.

De enige noodzakelijke integratiecorrectie buiten de nieuwe tool is dat de resolver `constructionValid` baseert op `evaluation.valid`, in plaats van alleen op de aanwezigheid van geometrie. Dat maakt het mogelijk om een degeneratieve driehoek geometrisch actueel te houden terwijl zij ongeldig en verborgen blijft. Voor bestaande constructies, die bij ongeldigheid geen geometrie opleveren, blijft het bestaande gedrag gelijk.

## Gewijzigde bestanden

- `construction-service.js` — recept, bronvalidatie, genormaliseerde degeneratiecontrole en status.
- `index.js` — weigert creatie wanneer evaluatie ongeldig is.
- `model.js` en `polygon-geometry.js` — beperkte opslag-/importondersteuning voor tijdelijke degeneratie.
- `editor.html`, `editor.js`, `editor-tool-instructions.js` — gereedschap, bronselectie en stapsgewijze aanwijzingen.
- `tests/g-tri1-triangle-from-points.test.cjs` — Node-regressies.
- `tests/browser-g-tri1-triangle-from-points.cjs` — Edge-integraties.
- `tests/browser.cjs` — volledige en gefocuste browser-suite-integratie.
- `tests/tool-panel-reorganization.test.cjs`, `tests/browser-tool-panel-reorganization.cjs` — catalogusverwachting bijgewerkt van 32 naar 33 actieve gereedschappen.

## Testresultaten

Uitgevoerd op 13 oktober 2026.

| Suite | Resultaat |
|---|---:|
| `node --test tests/*.test.cjs` | **593 geslaagd, 0 mislukt, 0 overgeslagen** |
| `node tests/browser.cjs` in Microsoft Edge 155 (headless) | **geslaagd, 0 paginafouten** |
| Edge-suite: expliciet gerapporteerde `passed`-statusvelden | **491 geslaagd** |
| G-TRI1 Edge-scenario's | **7/7 geslaagd** |
| Gefocuste UI-T1 Edge-controle | **33 actieve gereedschappen, 8 categorieën; geslaagd** |

De Edge-suite bevat onder meer de bestaande M6a-centra en regressiecontroles voor rijke tekst, permissies, constructies, geschiedenis, fullscreen en exports. De numerieke Edge-controles rapporteerden 73 contractgevallen, 912 onafhankelijke afrondingsreferenties, 19 transcendentale referenties en 14 adaptergevallen zonder mislukte fixtures.

De zeven G-TRI1-browsercontroles bevestigden de geordende canvasselectie, dynamische vertices, undo/redo, degeneratie en JSON-herstel, compatibiliteit met M6a-centra, SVG-export en offline PNG-export. De Node-tests controleren aanvullend bron-ID-uniciteit, uitsluitend hele puntobjecten, restrictieve bronrechten, documentversie 7 met constructionSchema 2, de inclusieve `1e-12`-grens, semantische replay en afwijzing van onbekende recepten.

## Bekende beperkingen en handmatige acceptatie

Er zijn geen bekende implementatieblokkades. De Edge-integratietests zijn headless uitgevoerd. Handmatige acceptatie in de zichtbare desktopinterface blijft daarom gewenst voor de drie opeenvolgende puntklikken, actieve bronfeedback, het opmaken/selecteren zonder verslepen en het waarnemen van degeneratie en herstel op het canvas. De test dekt autorisatie met Node-permissiefixtures; controleer desgewenst ook een echte beperkte projectconfiguratie.

M6b is niet gestart. Deze branch is niet naar `main` gemerged.
