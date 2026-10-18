# M8b-3 — Consolidatie- en eindacceptatierapport

**Documentversie:** 1.0.1

**Datum:** 16 oktober 2026

**Repository:** `Geert1985/wiskundige-illustratie-editor`

**Featurebranch:** `codex/m8b-3-final-consolidation`

**Gecontroleerde `main`-basis:** `141f6c6c0722b5adca02d5ab5ff03d836c8b2320`

**Baselinecode:** `50a897fbb6a30caf981b499f7fd0b6e86f8a067f`

**Uitkomst:** volledige technische regressiepoort PASS; gebruiker heeft M8b-3 op 16 oktober 2026 definitief geaccepteerd; geïntegreerd op `main` via [PR #23](https://github.com/Geert1985/wiskundige-illustratie-editor/pull/23) (mergecommit `fdf5d4fc49ddd4dcb05a8b4b5178cd78cd23d883`).

## Samenvatting

M8b-3 consolideert en verifieert de reeds goedgekeurde M8b-code zonder nieuwe productfunctionaliteit. De baseline op branch-HEAD `50a897f` slaagde voor 705/705 Node-tests en de volledige Edge-suite. De audit vond geen reproduceerbaar productdefect. Wel ontbrak één geïntegreerde JSON-roundtripfixture waarin schema 9, beide ellipsconstructieschema's, een regio, individuele metingen én een afhankelijke polygonrandconstructie samen voorkomen. De bestaande schema-9-test is uitgebreid om die combinatie en dynamische herberekening na laden expliciet te bewijzen.

Er is **geen productiecode gewijzigd**. De eindpoort slaagde opnieuw met 705/705 Node-tests en een volledige Edge-suite zonder page errors. Het technische oordeel is GO voor code-review en handmatige gebruikersacceptatie; dit is geen gebruikersacceptatie of mergegoedkeuring.

## Branch en commits

| Commit | Inhoud |
|---|---|
| `141f6c6` | Gecontroleerde `main`-basis na PR #22 |
| `056d40f` | M8b-3-auditplan en regressiepoort gestart |
| `cbb700f` | Contractcorrecties naar v1.3.1 |
| `50a897f` | Auditplan, contract en roadmapregistratie op featurebranch |
| `3c18374` | Gecombineerde schema-9-/afhankelijkheidsfixture |
| Documentatiestatuscommit | Dit rapport en de bijgewerkte roadmap/AGENTS-status; laatste commit op de opgeleverde featurebranch |

De initiële testbasis was schoon op `codex/m8b-3-final-consolidation`. `origin/main` is tijdens deze uitvoering opgehaald en bevestigd als `141f6c6`. De featurebranch is daarvan afgeleid. De remote featurebranch is na uitvoering naar dezelfde branch gepusht; `main` is niet gewijzigd.

## Auditmatrix

| Domein | Oordeel | Bestaand bewijs en uitkomst |
|---|---|---|
| Wiskundige invarianten | PASS | `tests/parallelogram-m8b.test.cjs`: onafhankelijke verwachte vertices, negatieve oriëntatie, omtrek/oppervlakte, rechthoek/ruit/vierkant en bronverplaatsing. `tests/parallelogram-m8b2c.test.cjs`: exacte `matchAB`, vier gelijke zijden en behoud van vierkant bij bronverplaatsing. |
| Ongeldigheid en herstel | PASS | M8b-1- en M8b-2c-tests controleren samenvallende A/B, verwijderde verouderde vertices, object-/receptidentiteit en herstel. M8b-2-tests controleren dat geen stale metingen worden getoond en labels met dezelfde sleutel herstellen. |
| Afhankelijke polygonconstructies | PASS | `tests/parallelogram-m8b2b.test.cjs`: polygonrand-/vertexplannen, alle vier randmiddens en stabiele indexen. `tests/parallelogram-m8b2c.test.cjs`: `pointOnSegment` op randindex 1 blijft ongeldig bij degeneratie en herstelt op dezelfde dependency. De nieuwe gemengde fixture controleert die randreferentie ook na JSON-roundtrip en bronverplaatsing. |
| Naamgeving, meetwaarden en SVG | PASS | M8b-2b-tests controleren live A/B-namen en geometrische hoekmarkering in SVG. M8b-2-tests controleren metingen, labels en invaliditeitsweergave. |
| Plaatsingsinteractie en snaps | PASS | `tests/browser-parallelogram-m8b.cjs`, `tests/browser-parallelogram-ux-m8b2b.cjs` en `tests/browser-parallelogram-constraints-m8b2c.cjs` worden opgenomen in de volledige Edge-run: Q is geen bron, numerieke invoer, ±90°- en gelijke-zijdensnap, combinatie en moduswissels zijn gedekt. |
| Geschiedenis en lifecycle | PASS | Node-tests controleren atomair author-commando, één semantische modusovergang en deterministische `SemanticSequence`-replay. Edge-tests controleren aanmaak Undo/Redo, inspectorwissels en annulering. Volledige suite geslaagd. |
| Documenten en schema's | PASS | Vaste constructies houden `constructionSchema:8`; `matchAB` vraagt schema 9; individuele metingen blijven documentversie 10/`measurementSchema:1`. De uitgebreide roundtrip omvat ellipse schema 6 (`ellipseByFociAndSum`), schema 7 (`ellipseByFociAndPoint` plus `pointOnEllipse`), regio schema 1, polygonen, metingen en randafhankelijkheid. Import/export behoudt het document en de dependency, die na bronverplaatsing opnieuw oplost. |
| Restricted rechten en export | PASS | M8b-1- en M8b-2c-tests controleren JSON-export/projectie, schema 8/9 en fail-closed weigering bij ontbrekende bronrechten. M8b-2-tests controleren verborgen of niet-geautoriseerde bronnen en export. Geen regressie aangetroffen. |
| Regressie buiten M8b | PASS | Volledige `npm test` en `npm run test:edge` omvatten polygonen, driehoeken, ellipsen, regio's, metingen, radiaalmenu, selectie, lagen en overige bestaande functionaliteit. |

## Schema- en documentcompatibiliteit

| Inhoud | Writer/importbeleid | Verificatie |
|---|---|---|
| Legacy documenten en constructies v1–v10 | Bestaande documentmigraties blijven leidend; geen documentversie 11 voor M8b | Volledige bestaande Node-suite PASS; schema-importfixtures blijven ongewijzigd |
| Ellipsrecepten `constructionSchema:6` | Legacy `ellipseByFociAndSum` blijft ondersteund | M8b-1 mixed-schema- en ellipstest; geïntegreerde eindfixture |
| Ellipsrecepten `constructionSchema:7` | Driebronnenellips en afhankelijke `pointOnEllipse` blijven ondersteund | `tests/ellipse-control-point.test.cjs`; geïntegreerde eindfixture |
| Vast parallellogram `constructionSchema:8` | `sideLength` is bepalend; geen `sideLengthMode` vereist | `tests/parallelogram-m8b.test.cjs`; M8b-1 Edge-roundtrip |
| `matchAB` parallellogram `constructionSchema:9` | `sideLengthMode:"matchAB"` blijft persistent; schema 8 met deze modus wordt geweigerd | `tests/parallelogram-m8b2c.test.cjs`, restricted export en nieuwe gecombineerde roundtrip |
| Gemengd document | Documentversie 10, `measurementSchema:1`, constructieschema 9, ellipse-schema 1 en regio-schema 1 blijven gelijktijdig behouden | Uitgebreide schema-9-test roundtript het gemengde document en controleert vervolgens de edge-afhankelijkheid na een bronupdate |

De nieuwe fixture vult dus een echte samenhangende-dekkingkloof aan; de bestaande losse fixturegaranties zijn behouden. Er is geen schema-, objecttype- of runtimecompatibiliteitswijziging nodig gebleken.

## Uitgevoerde verificatie

Omgeving: Windows, Node.js `v22.18.0`, npm `10.9.3`, Microsoft Edge `155.0.4283.45`. De Edge-runner rapporteerde de Edge-user-agent expliciet (`Edg/155.0.4283.45`), dus er was geen fallbackbrowser.

| Fase | Commando | Resultaat | Duur |
|---|---|---|---:|
| Baseline op `50a897f` | `npm test` | PASS — 705/705, 0 mislukt | 15,3 s testduur (15,3 s Node-reported) |
| Baseline op `50a897f` | `npm run test:edge` | PASS — volledige browser-suite, `pageErrors: []` | 262,5 s |
| Gerichte integratietest | `node --test tests/parallelogram-m8b2c.test.cjs` | PASS — 7/7 | 0,55 s |
| Eindpoort na testuitbreiding | `npm test` | PASS — 705/705, 0 mislukt | 14,1 s testduur (15,7 s elapsed) |
| Eindpoort na testuitbreiding | `npm run test:edge` | PASS — volledige browser-suite, `pageErrors: []` | 242,6 s |

De Node-testcount bleef 705 doordat de aanvullende assertions binnen één bestaande testfixture staan. Tijdens de eerste proef van de fixture was de onafhankelijke verwachte randmiddelpuntcoördinaat verkeerd ingeschat; de test faalde op `6 != 5`. De verwachte waarde is aan de wiskundige geometrie aangepast naar `(6,3)`, waarna de gerichte test en volledige eindpoort slaagden. Dit was een fout in de nieuwe testverwachting, geen productdefect.

## Productiecode, tests en afwijkingen

- Productiecode: **niet gewijzigd**.
- Nieuwe tests: geen nieuwe testfunctie; de bestaande schema-9-roundtriptest in `tests/parallelogram-m8b2c.test.cjs` is uitgebreid met een schema-7-ellips, `pointOnEllipse` en een gekoppeld polygonrandpunt. Na laden controleert de test zowel de stabiele randreferentie als de herberekende positie bij verplaatsing van B.
- Geen assertions verwijderd of verzwakt.
- Baseline- en eindtests zijn op de gecontroleerde branch uitgevoerd. De Edge-suite schrijft bestaande screenshots opnieuw; die door tests gegenereerde wijzigingen zijn teruggezet en niet opgenomen.

## Restpunten en handmatige acceptatie

De geautomatiseerde regressiepoort is volledig groen. Een browserautomatisering kan geen persoonlijke visuele eindacceptatie namens de gebruiker vastleggen. Handmatig te bevestigen:

1. Construeer en versleep een ruit en vierkant; controleer blijvende gelijke zijden en vorm.
2. Hernoem A/B en controleer de puntnamen, afgeleide C/D en maatlabels.
3. Construeer een middelpunt of punt op een polygonrand; verplaats de bron en controleer de stabiele randindex.
4. Sla een schema-9-document met schema-6/7-ellips, regio en GEO-UI-metingen op en laad het opnieuw.
5. Controleer Undo/Redo en beperkte export met ontbrekende bronrechten.

## Technisch oordeel

**Technisch GO voor code-review en handmatige eindacceptatie.** De schema-8/9-regels, gemengde documenten, randafhankelijkheden, invaliditeit/herstel, semantische geschiedenis, fail-closed export en volledige regressies zijn geverifieerd. **Geen merge-GO:** gebruikersacceptatie blijft open; er is niet naar `main` gemerged.


## Definitieve acceptatie en integratie — 16 oktober 2026

De gebruiker heeft na de code-review van M8b-3 expliciet de **definitieve eindacceptatie** gegeven en meegedeeld de merge zelf uit te voeren. GitHub bevestigt vervolgens dat [PR #23](https://github.com/Geert1985/wiskundige-illustratie-editor/pull/23) op 16 oktober 2026 is gemerged in `main`, met mergecommit `fdf5d4fc49ddd4dcb05a8b4b5178cd78cd23d883` en feature-HEAD `c235cdc6e4fed46297a95ecc26798af4a5c8c3f2`.

**Definitieve status: M8b-3 geaccepteerd en geïntegreerd. Het volledige M8b-traject is afgerond.** De hierboven genoemde testresultaten zijn afkomstig uit de Codex-regressie op de featurebranch; deze documentatieregistratie heeft geen nieuwe Node- of Edge-suite uitgevoerd en wijzigt geen productiecode.
