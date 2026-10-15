# M8a-1 — command- en permissie-integratie

Datum: 2026-10-15. Branch: `Codex/M8a`, vervolg op `4c9eb86`.

Status: geïmplementeerd op de ontwikkelbranch en gericht geautomatiseerd getest. Geen main-integratie, handmatige Edge-acceptatie of volledige M8a-acceptatie.

## Gedrag en contract

- `construction.create` vereist voor `ellipseByFociAndSum` twee getypeerde puntbronnen en een positieve eindige `sumDistance` in modelafstand. Het oudere `parameter`-veld en `extent` worden voor dit recept geweigerd. Andere recepten weigeren `sumDistance`.
- Het afzonderlijke author-only commando `construction.setSumDistance` heeft payload `{id, sumDistance}`. Het respecteert locks, valideert de nieuwe geometrie en weigert ongeldige invoer atomair. Een bestaande tijdelijk ongeldige ellips kan door een geldige nieuwe afstandsom herstellen. `construction.setParameter` blijft uitsluitend voor bestaande padparameters.
- Restricted-creatie via het constructierecept vereist het gereedschapsrecht plus actuele bronrechten op beide brandpunten. Geometriebewerking, rotatie, directe creatie van zelfstandige ellipsen, duplicatie, ontkoppeling en constructieparameterbewerking blijven author-only. Stijl en labels volgen bestaande property grants. Het verplaatsen van brandpunten volgt bestaande indirectGeometry/allowIndirectInvalid-regels.
- De projectie controleert lees-, weergave-, beschikbaarheids- en constructiebronrechten. Afgeschermde ellipsen en hun constructieafhankelijken verdwijnen uit leesmodellen, capabilities, selectie, snapaanbod, constructie-informatie, previewresultaten en exportprojectie. Tekstverwijzingen worden geredigeerd. De iteratieve berekening wordt per document/policy gecachet; een policywijziging vernieuwt de projectie en maakt bestaande transactiehandles ongeldig.
- Restricted JSON leidt v9, ellipseSchema 1 en constructionSchema 6 af uit de geprojecteerde ellipsen en recepten. Berekende ellipsvelden worden verwijderd. Een zelfstandige ellips behoudt haar primaire definitieparameters. De combinatie met regio's, rijke tekst, asreferenties en lagen is getest.
- Semantische sequences ondersteunen het nieuwe commando en deterministische replay.
- Sectie 4.1 van het ellipscontract is in overeenstemming gebracht met het normatieve addendum over zelfstandige ellipsen.

## Gevonden en herstelde integratiefouten

Gewone ellipsupdates bevatten eerder de eigen berekende velden van het model, die de strikte importvalidator terecht afwees. Updates verwijderen deze velden nu vóór normalisatie en berekenen ze opnieuw. Na ontkoppeling kon constructionSchema 6 bovendien als oud rootveld blijven bestaan. Actieve constructieschemavelden worden nu uit de bewaarde rootextensies gehaald en opnieuw uit de actuele recepten afgeleid.

## Gewijzigde bestanden

`permission-runtime.js`, `model.js`, `semantic-sequence.js`, `editor.html` (gedeelde scriptcachetoken), `tests/ellipse-permissions.test.cjs`, `docs/M8a-ELLIPSEN-CONTRACT.md`, `docs/DEVELOPMENT-ROADMAP.md` en dit verslag.

## Uitgevoerde verificatie

Laatste gerichte Node-run: **135 tests geslaagd**, inclusief **9 nieuwe ellipscommand-/permissietests**.

```powershell
node --test --test-reporter=dot tests/ellipse-permissions.test.cjs tests/permissions.test.cjs tests/linked-paths.test.cjs tests/construction-contract.test.cjs tests/documents.test.cjs tests/regions-contract.test.cjs tests/history.test.cjs tests/persistent-groups.test.cjs tests/layers.test.cjs tests/ellipse-model.test.cjs tests/ellipse-geometry.test.cjs
git diff --check
```

Beide commando's eindigden met exitcode 0. De nieuwe tests behandelen getypeerde invoer, atomaire weigeringen, locks, herstel, author-only bewerking, restricted bronrechten, ingetrokken rechten, cachevernieuwing, ongeldige previews na beleidswijziging, indirecte invaliditeit, freeze, undo/redo, replay, tekstredactie en gemengde JSON-roundtrip.

## Open vervolg

Renderer, hit-testing, snapping-geometrie, driestapsinteractie en eigenschappen zijn nog niet aangesloten. Er is geen ellipsgereedschap in de UI geactiveerd. Ellipscontouren in SVG/PNG, Edge-/DOM-controles, volledige regressie en handmatige gebruikersacceptatie blijven open. Deze Node-tests bevestigen de command-/documentprojectie; zij bewijzen nog geen visuele export of browsergedrag. Punt-op-ellips en de latere gedeelde M8c-kern behoren niet tot deze deelstap.
