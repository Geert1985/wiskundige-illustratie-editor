# M8b-2b — UX- en geometrie-integratie

**Documentversie:** 1.0.1  
**Datum:** 16 oktober 2026  
**Status:** handmatig geaccepteerd; geïntegreerd in `main` via PR #22 op 16 oktober 2026 (zie integratieregistratie onderaan).  
**Basis:** `codex/m8b-2-measurements-inspector`, commit `c608cbc567edd566c0c68c55473def221cfade78`  
**Featurebranch:** `codex/m8b-2b-ux-geometry-integration`

## Doel en architectuur

M8b-2b werkt de gebruikerservaring rond parallellogrammen en bestaande polygonranden bij. Het behoudt één polygongeometrie, de bestaande MeasurementGeometry-labelroute, ConstructionService-contextplannen, geautoriseerde commando's en renderer. Er is geen nieuw objecttype, meetlabelsysteem of constructieworkflow toegevoegd.

Het M8b-contract is bijgewerkt naar v1.2.0. Voor nieuwe parallellogrammen zijn alle tien individuele metingen standaard verborgen. Bestaande zichtbaarheid wordt behouden. Positie, waarde en labelinstellingen blijven in `object.measurements` opgeslagen.

Polygonhoekmetingen tonen een geometrische boog en bij een exacte rechte hoek een vierkantmarkering. De labelpositie gebruikt de binnenhoekbisector. Ongeldige polygongeometrie levert geen verouderde boog of label op. Parallellogramlabels gebruiken live namen van A en B als bronobjecten; C en D blijven afgeleide namen. Generieke bronpuntnamen worden alleen bij veilige naamruimte en toegestane naamrechten naar A en B aangepast, in dezelfde creatiehistorieactie.

## Gerealiseerde zes wijzigingen

1. Alle tien individuele maatlabels staan standaard uit; opgeslagen voorkeuren worden behouden.
2. Binnenhoeklabels krijgen een afgeleide boog, of een vierkantmarkering bij 90 graden.
3. Labels volgen echte bronnamen; veilige generieke bronpunten kunnen atomair A/B worden.
4. Een bestaand bevoegd punt kan tijdelijk als Q worden gekozen zonder derde receptbron.
5. De preview toont de hoek en vrije plaatsing snapt met hysterese naar exact ±90 graden.
6. De radiale context op polygonranden gebruikt bestaande edge-/vertexreferenties voor constructies.

## Interactie en contextconstructies

In de derde parallellogramstap selecteert een klik op een bestaand, zichtbaar en toegestaan punt binnen de bestaande puntselectietolerantie dat punt als tijdelijke Q-plaatsing. Q wordt geen constructiebron. Een vrije muispositie gebruikt bestaande snapping en krijgt een hysteretische ±90°-snap binnen de contracttolerantie; bestaande Q en exacte numerieke invoer slaan deze hoek-snap over. De preview toont de hoekmarkering en waarde.

Rechtsklikken op een polygonrand bewaart de randindex als contextreferentie in het bestaande radiale menu. Middenpunt en middelloodlijn gebruiken de twee aangrenzende vertexreferenties; punt-op-rand gebruikt de edge-referentie; parallel en loodrecht nemen de edge als eerste bron. Er wordt geen lijnobject als tussenstap gemaakt. Bestaande PolygonGeometry-resolutie houdt afhankelijke constructies actueel.

## Gewijzigde bestanden

- `measurement-geometry.js`, `renderer.js`, `index.js`: standaardinstellingen, live naam- en labeltekst, hoekbogen en rechtehoekmarkering.
- `editor.js`, `editor-radial-properties.js`, `construction-service.js`: bestaande Q-selectie, vrije hoek-snap, veilige bronhernoeming en randcontextplannen via de bestaande interactie-/commandoroutes.
- `tests/parallelogram-m8b2b.test.cjs`: standaardstatus, meetkundige hoekmarkering, live namen, randreferenties en restricted rechten.
- `tests/browser-parallelogram-ux-m8b2b.cjs`: echte Edge-interacties voor Q, dynamische namen, randcontext, afhankelijke constructies, snaps, numerieke invoer, undo/redo, conflictgedrag en opslag/laden.
- `tests/browser.cjs`, `tests/browser-parallelogram-measurements-m8b2.cjs`, `tests/parallelogram-m8b.test.cjs`, `tests/parallelogram-m8b2.test.cjs`: gerichte selectie en verwachtingen bijgewerkt voor de contractwijziging.
- `docs/M8b-PARALLELLOGRAMMEN-CONTRACT.md`: contract v1.2.0.
- `docs/DEVELOPMENT-ROADMAP.md`: actuele branchstatus; M8b-3 blijft open.

## Schema en rechten

Er is geen schema- of documentversiewijziging nodig. Parallellogrammen blijven `constructionSchema:8`; GEO-UI-metingen blijven `measurementSchema:1` met documentversie 10 wanneer aanwezig. Alle verborgen brontoegang en randconstructies blijven via bestaande bron-/gereedschapsrechten lopen. De gerichte restricted-test controleert weigering zonder documentmutatie en succes met expliciete tool- en bronrechten. Bestaande fail-closed M8b-1-export blijft ongewijzigd.

## Testimpactmatrix

| Onderdeel | Nieuwe/gewijzigde dekking | Resultaat |
|---|---|---|
| Alle individuele parallellogrammetingen standaard verborgen | Node, JSON-roundtrip en Edge | PASS |
| Hoekbogen, rechtehoekvierkant, binnenhoek en invalidatie | Node/SVG en Edge | PASS |
| Live bronpuntnamen en hoek-/zijlabels | Node/SVG en Edge | PASS |
| Tijdelijke bestaande Q en geen permanente Q-bron | Edge, documentinspectie en verplaatsing Q na creatie | PASS |
| Vrije ±90°-snap, gedraaide basis, exacte numerieke hoek | Edge | PASS |
| Randcontext voor middenpunt en punt-op-rand | Edge via echt radiaal contextmenu | PASS |
| Randplannen voor middelloodlijn, parallel en loodrecht | Node-plan/referentietest | PASS |
| Afhankelijke constructies na parameterwijziging | Node en Edge | PASS |
| Restricted gereedschap-/bronrechten en atomiciteit | Node | PASS |
| M8b-1, M8b-2, ellipsen en bestaande polygonregressies | volledige Node- en Edge-suites | PASS |

## Uitgevoerde verificatie

Gerichte Node-tests: `node --test tests/parallelogram-m8b2b.test.cjs` — **7/7 PASS**.  
Gerichte Edge-test: `$env:M8B2B_ONLY='1'; npm run test:edge` — **PASS**. Resultaten: bestaande Q tijdelijk; dynamische namen; veilige hernoeming met undo/redo en naamconflict; echte randcontext voor middenpunt en punt-op-rand; afhankelijke update; positieve en negatieve ±90°-snap bij gedraaide basis; numerieke invoer zonder snap; ronde-trip; geen browserfouten.  
Volledige `npm test` — **698/698 PASS**. Volledige `npm run test:edge` — **PASS**, inclusief bestaande suites en zonder browserfouten (`pageErrors: []`).

## Bekende beperkingen en handmatige acceptatie

Automatische bronhernoeming is alleen mogelijk wanneer beide bronnamen generiek zijn, A/B nog niet door andere objecten worden gebruikt en het bestaande naamcommando geautoriseerd is. Bij conflict blijven namen staan; labels blijven de actuele bronobjectnamen gebruiken. Bestaande Q wordt alleen geselecteerd wanneer die binnen de puntselectietolerantie ligt en aan de zicht-/toegangsfilters voldoet.

Handmatige acceptatiechecklist:

- [ ] Maak parallellogrammen met positieve en negatieve oriëntatie; controleer preview en exacte ±90°.
- [ ] Klik op een bestaand toegestaan punt Q en controleer dat geen blijvende bron wordt toegevoegd.
- [ ] Selecteer een bron met een aangepaste naam en controleer de maatlabelnamen.
- [ ] Controleer hoekbogen, rechtehoekmarkering en verplaatsbare individuele labels.
- [ ] Rechtsklik op polygonranden en gebruik middenpunt, middelloodlijn, punt-op-rand, parallel en loodrecht.
- [ ] Versleep bronnen en verander L/θ; controleer afhankelijke punten.
- [ ] Controleer undo/redo, opslag/laden en restricted gebruikersrechten.
- [ ] Controleer normale editor en fullscreen.

## Branch en commits

Featurebranch: `codex/m8b-2b-ux-geometry-integration`. Basiscommit: `c608cbc567edd566c0c68c55473def221cfade78`.

- `0f3b386` — meetweergave, dynamische namen en hoekmarkeringen.
- `f750b9e` — Q-plaatsing, hoekpreview en gebruikersinteractie.
- Laatste commit — polygonrandcontextconstructies, Node-regressies, roadmap en dit verslag.

HEAD bij oplevering: deze laatste commit op de genoemde featurebranch.

**Technisch oordeel:** GO voor gebruikersacceptatie. De volledige Node- en Edge-regressiesuites zijn PASS. Geen automatische merge; M8b-2b wacht op handmatige acceptatie. M8b-3 blijft open.

## Integratieregistratie — 16 oktober 2026

Na de oorspronkelijke featurebranch-oplevering heeft de gebruiker de M8b-2-, M8b-2b- en M8b-2c-keten handmatig geaccepteerd. De integratie naar `main` is uitgevoerd via [Pull Request #22](https://github.com/Geert1985/wiskundige-illustratie-editor/pull/22) (mergecommit `0b8e7a4f9eb50c5f196c33ccdf63cbdbcce773f6`; laatste featurecommit `9bfbfa2e7fc0b89e7aeef4f99f3f27804af062b6`). De historische implementatie- en teststatussen hierboven hebben betrekking op de oorspronkelijke oplevering. De finale M8b-2c-implementatie omvat aanvullend het correct gesynchroniseerde lengteveld; de zichtbaarheid van drie meetlabels uit het oorspronkelijke M8b-2-ontwerp is in M8b-2b vervangen door standaard verborgen individuele metingen. **M8b-3 blijft open.**
