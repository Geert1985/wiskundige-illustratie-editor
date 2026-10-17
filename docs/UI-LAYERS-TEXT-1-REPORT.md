# UI-LAYERS-TEXT-1 — Ontwerp en implementatie

Datum: 17 oktober 2026. Branch: `codex/ui-layers-label-toggle`.
Uitgangspunt: actuele lokale HEAD en opgehaalde remote HEAD beide `65a360d`.
Implementatiecommit: `405b944`; dit verslag en architectuurafspraken volgen in een documentatiecommit.
Status per 17 oktober 2026: handmatige test door de gebruiker als geslaagd bevestigd; integratie van dezelfde featurebranch naar `main` uitdrukkelijk goedgekeurd. UI-LAYERS-LABEL-1 behouden. Zie het acceptatieregister onderaan.

## Functioneel gedrag en centrale routering

`DocumentLayers.creationPlan(type, layers, meta, objects, allocate, options)` is de gedeelde pure router. `IllustrationModel.add()` normaliseert en resolveert eerst het object, maakt daarna het plan en valideert de volledige kandidaat voordat objecten, lagen en metadata gezamenlijk worden gepubliceerd. Een fout herstelt ook de ID-teller. Er is geen actieve-laagwissel in de UI en geen nieuwe creatie-engine.

Een nieuwe `text` krijgt de bestaande automatische tekstlaag. Ontbreekt die, dan ontstaat één gewone laag met standaardnaam **Tekst**. Een document zonder expliciete lagen krijgt daarbij eerst een Basislaag met alle bestaande objecten; hun onderlinge volgorde en eigenschappen blijven behouden. Gewone tekst, `text.commit` met opmaak/formules/dynamische waarden en constructies met een `text`-resultaat gebruiken hetzelfde modelpad. Een inline formule blijft een fragment binnen één tekstobject.

Nieuwe andere objecttypen gaan naar de bovenste zichtbare laag waarvan de ID niet de automatische tekstlaag-ID is. De huidige editor heeft geen actieve-laagstatus; er wordt dus geen nieuwe UI-keuze bijgehouden. Zonder expliciete lagen blijft gewone geometrie onverdeeld volgens het legacygedrag. Zonder zichtbare gewone laag wordt geometriecreatie geweigerd; de automatische tekstlaag is nooit een stille fallback.

Bewerken (`update`, bestaande `text.commit`, legacy-migratie) routeert niet opnieuw. Handmatige laagtoewijzing blijft behouden. Laden/importeren herschikt geen oude tekst en maakt geen laag aan.

### Bewuste duplicatiesemantiek

Duplicaten behouden de bestaande oorspronkelijke laag en groepsstructuur, via expliciete interne kopieplaatsing in dezelfde router. Dit voorkomt dat een gekopieerde groep met tekst en geometrie over lagen wordt gesplitst of een legacygroep onbedoeld migreert. Een duplicatie maakt daarom geen automatische tekstlaag aan. Een tekstkopie naar een verborgen doellaag wordt geweigerd; bestaande geometriekopie-semantiek blijft behouden. Deze interne modeloptie is geen nieuw commandoargument en is niet via de beperkte facade beschikbaar.

## Duurzame identiteit en opslag

Optionele metadata: `meta.automaticTextLayerId`, een niet-lege string die naar een bestaande laag moet verwijzen. `DocumentLayers.automaticTextLayer()` valideert dit bij laden en routeren. Een verkeerde typewaarde, null, lege of ontbrekende referentie wordt afgewezen. De gewone laagrecords blijven gesloten `{id,name,visible,members}`; `layerSchema:1` blijft ongewijzigd. De documentversie volgt de bestaande regels (lagen minimaal 5, rijke tekst minimaal 7, eventuele andere features hoger); geen nieuw versienummer.

Hernoemen, herschikken en opslaan/herladen behouden de laag-ID. Een handmatige laag genaamd Tekst wordt nooit op naam herkend. Verwijderen wist de verwijzing en behoudt de bestaande overdracht van leden naar de aangrenzende laag. De volgende nieuwe tekst maakt opnieuw één automatische laag. `clear` verwijdert de identiteit; Nieuw begint via de bestaande resetroute met één Basislaag.

Onbekende legacy `layers/layerSchema`-extensies worden niet overschreven: automatische eerste laagcreatie weigert dezelfde botsing als handmatige laagcreatie. Een oude applicatieversie kent de nieuwe routeringsbetekenis van de metadata niet; gebruik voor het voortzetten van deze workflow de bijgewerkte editor. Het gezamenlijke cachetoken is `ui-layers-text1-20261017`.

## Transacties, geschiedenis en fouten

De bestaande author/runtime-commandoroute werkt op een kandidaatmodel. Eén `text.commit` of `object.create` bevat zowel de eerste laag als het tekstobject. De bestaande `changeDocument`/historygrens maakt dit één Undo/Redo-stap. Ongedaan maken herstelt exact het document van vóór de actie; redo herstelt lagen, object en identiteit samen. Hetzelfde geldt voor verwijderen/herstellen van de tekstlaag. Semantische replay bewaart dezelfde uitkomst.

Verborgen automatische tekstlaag: nieuwe tekstcreatie stopt zonder mutaties, in plaats van onzichtbare tekst of een tweede laag te maken. De teksteditor toont een begrijpelijke melding en behoudt de draft bij Toepassen. Er bestaat geen laag-lockfunctionaliteit; er is geen nieuwe lock ingevoerd. Bestaande objectlocks en editautorisatie blijven via de bestaande commands gelden.

## Beperkte modus

`layer.create` en `layer.assign` blijven author-only. Een centrale controle na kandidaatuitvoering weigert iedere impliciete nieuwe laag-ID in beperkte modus (`MODE_DENIED`), ook via `object.create`, `text.commit` en tekstproducerende constructies. Er is geen permissie-uitbreiding. Een auteur moet de automatische laag dus vooraf in het document voorbereiden.

Hergebruik van een bestaande zichtbare automatische tekstlaag is gewone initiële plaatsing van een nieuw object, zoals de bestaande impliciete geometrieplaatsing; het verleent geen recht om bestaande objecten te verplaatsen. Tool-, tekstcontent-, opmaak-, formule-, bronveld- en overige creatierechten blijven gelden. Bewerkingsrechten voor bestaande tekst wijzigen niet. De UI verklaart dat automatische laagcreatie in deze modus niet mag.

JSON-export bewaart de identiteit wanneer alle laagleden geautoriseerd zijn. De bestaande fail-closed export bij onleesbare leden blijft strikt. Een ellipse-permissietest controleert daarom nu de geredigeerde objectprojectie én expliciete exportweigering. De T3-creatietest bereidt de laag als auteur voor; een afzonderlijke test bewijst dat een beperkte gebruiker haar niet zelf kan laten ontstaan.

## Uitgevoerde validatie

- `node --check model.js`: PASS.
- `node --test tests/automatic-text-layer.test.cjs`: vier gerichte tests PASS.
- `node --test --test-name-pattern=UI-LAYERS-TEXT tests/lifecycle.test.cjs`: één gerichte history/resettest PASS.
- `node --test tests/layers.test.cjs tests/text-editor-t3.test.cjs tests/ellipse-permissions.test.cjs`: 42/42 PASS.
- Finale `npm test`: **742/742 PASS**, nul failures/skips, na de laatste productiecodewijziging.
- Gerichte headless Edge via PowerShell `$env:<KEUZE>='1'; node tests/browser.cjs`:

| Keuze | Resultaat / relevante dekking |
|---|---|
| `TEXT_LAYERS_ONLY` | PASS; eerste rijke tekst + laag in één Undo/Redo, hergebruik, hernoemen, handmatige verplaatsing + bewerking, geometrie, T-knoppen, verborgen-laagafbreking, roundtrip, verwijderen/heraanmaken |
| `RICH_TEXT_ONLY` | PASS; echte ProseMirror-opmaak, alinea's, annuleren, history, JSON en SVG/PNG |
| `RICH_MATH_ONLY` | PASS; formule-invoer/bewerken, history, atomgedrag, bron-roundtrip, SVG/PNG |
| `RICH_VALUES_ONLY` | PASS; dynamische waarden gemengd met formules, actuele bronnen, save/reload, migratie, beperkte rechten en redacties |
| `LAYERS_ONLY` | PASS; bestaande laagacties, groepen/locks, drag, paint/hit, import/history, beperkte runtime |
| `LAYER_LABELS_ONLY` | PASS; bestaande object-/laag-T-knoppen, mixed, keyboard/focus, locks en smalle zijbalk |
| `ASSET_COMPAT_ONLY` | PASS; gezamenlijk cachetoken en vier geometrische tekengereedschappen met gesimuleerde oude modelcache |

Alle genoemde browserruns eindigden zonder page errors. `TEXT_LAYERS_ONLY` en volledige Node-suite zijn na de laatste wijziging opnieuw uitgevoerd. Het volledige gecombineerde Edge-regressieprogramma is niet uitgevoerd. De `RICH_VALUES_ONLY`-fixture verwijdert bewust een object; haar laagleden worden nu overeenkomstig gefilterd, zonder productievalidatie af te zwakken. Cachetokenasserties zijn bijgewerkt naar dezelfde releasewaarde.

Screenshot `test-results/ui-layers-text.png` visueel bekeken: Tekst en Basislaag gebruiken de gewone laagweergave, bestaande oog-/T-/laagacties blijven zichtbaar. Overlappende canvasteksten in deze test zijn bewust op dezelfde testpositie geplaatst; er is geen nieuwe plaatsingslogica.

Gerichte Node-dekking omvat daarnaast gewone modelcreatie, meetconstructietekst, geometrische constructies, bovenste gewone zichtbare laag, naambotsing, oude tekst zonder migratie, behoud van handmatige toewijzing, groepsduplicatie, verborgen tekstkopie, ongeldige metadata, falende creatie en ID-teller, legacy-extensies, rich schema 3 met formule/bronveld, semantische replay en beperkte creatie/export/history.

## Gewijzigde bestanden

Productie: `document-layers.js`, `model.js`, `index.js`, `permission-runtime.js`, `editor.js`, `editor.html`.
Nieuwe tests: `tests/automatic-text-layer.test.cjs`, `tests/browser-automatic-text-layer.cjs`.
Bestaande tests/runner: `tests/lifecycle.test.cjs`, `tests/browser.cjs`, `tests/browser-rich-values.cjs`, `tests/text-editor-t3.test.cjs`, `tests/ellipse-permissions.test.cjs`, `tests/browser-asset-compat.cjs`, `tests/left-sidebar-navigation.test.cjs`, `tests/radial-petals.test.cjs`.
Documentatie: dit rapport, `AGENTS.md`, `docs/DEVELOPMENT-ROADMAP.md`, `docs/M3c-LAYER-SCHEMA-ADR.md`, `docs/CORE-1-ARCHITECTURE-DESIGN.md`.

## Handmatige acceptatie

Gebruikersacceptatie blijft open: eigen oudere documenten, hernoemen/herschikken en slepen, nieuwe tekst versus geometrie, verborgen doellagen en cursusdocumenten met vooraf voorbereide tekstlaag. Toekomstige tekstgereedschappen moeten dezelfde centrale modelroutering gebruiken; geen tijdelijke UI-laagwissel, nieuwe naamheuristiek of tweede routingpad.

## Gebruikersacceptatie en integratie — 17 oktober 2026

De gebruiker bevestigde de handmatige test als geslaagd en gaf expliciet opdracht: “ok, registreer de test als geslaagd en push naar main”. Deze acceptatie betreft de opgeleverde featurebranch met labelbediening en automatische tekstlaag, tot en met `895ecf7`. Er is geen afzonderlijke claim dat ieder handmatig scenario apart is afgetekend.

De branch sluit rechtstreeks aan op actuele `origin/main` `7a67837`. Integratie gebeurt als fast-forward van `main`, inclusief deze acceptatieregistratie. De eerdere vermeldingen van open acceptatie of geen merge beschrijven de oorspronkelijke opleverstatus; dit register is de actuele status. De al vastgelegde automatische testresultaten blijven behouden; voor deze documentatie- en integratiestap zijn geen nieuwe tests uitgevoerd.
