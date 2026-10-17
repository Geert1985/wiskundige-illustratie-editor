# M-PATH.0-A3 — Acceptatie en mergebesluit

Datum: 17 oktober 2026. Repository: `Geert1985/wiskundige-illustratie-editor`.
Branch: `codex/m-path-0-universal-point-tool`.
Onderzochte featurecommit: `f5d77aa0cf68c987aef809fef9215bfcffb91132`.
Normatief: `WIE-M-PATH-0-Ontwerp-en-implementatiecontract-v1.0.1.md`.

## Definitieve acceptatieregistratie

| Onderdeel | Status |
|---|---|
| Handmatige acceptatie | GO |
| Definitieve UI-omschakeling | Uitgevoerd; definitieve A2-interface door gebruiker geaccepteerd |
| Node-regressie | 748/748 PASS |
| Gerichte Node-tests | 6/6 PASS |
| Gerichte Edge-suites | 11/11 PASS |
| Restricted-permissiematrix | PASS |
| Volledige Edge-regressie | Niet afgerond |
| Gebruikersbesluit | GO met expliciete acceptatie van restrisico |

De gebruiker heeft in de A3-opdracht expliciet bevestigd dat functionaliteit en A2-interface zijn geaccepteerd, dat de drie legacyknoppen mochten verdwijnen en dat de mergevoorbereiding mag doorgaan ondanks de onderbroken volledige Edge-regressie. Dit is autorisatie voor voorbereiding en documentatie; de daadwerkelijke merge vereist afzonderlijk expliciet GO.

De testuitslagen zijn overgenomen uit `M-PATH-0-V2-EINDVERIFICATIE.md`; in A3 zijn geen nieuwe Node- of Edge-tests uitgevoerd. De oorspronkelijke handmatige acceptatie, A2- en V2-rapporten blijven ongewijzigd. Het V2-NO-GO betrof een **onvoorwaardelijke technische vrijgave** wegens ontbrekende volledige Edge-dekking. Het huidige gebruikersbesluit accepteert die beperking; het verandert de testuitslag niet in PASS.

## Expliciet geaccepteerd restrisico

De laatste volledige Edge-run is op gebruikersverzoek tijdens `ellipseControlPoint` beëindigd. Er zijn 36 voorafgaande modules afgerond zonder testfout; voor de lopende module en de daaropvolgende modules ontbreekt een eindresultaat binnen die volledige run. De afzonderlijke gerichte ellipsbesturingspuntflow is wel geslaagd. Eerdere pogingen zijn onderbroken wegens gedeeld branchgebruik of gestopt op een ontbrekende lokale PNG-testdependency; die dependency is daarna beschikbaar gemaakt en de betrokken gerichte suite slaagde.

**De volledige Edge-regressie is niet PASS. Positieve gerichte verificatie garandeert geen volledige regressiedekking.** Niet alle overige functies, volgorde-effecten en interacties tussen modules zijn in één volledige eindrun gevalideerd. Daardoor kunnen buiten de gerichte dekking nog regressies aanwezig zijn. Ook is de schermschaalcontrole beperkt tot geautomatiseerde browsercontexten met deviceScaleFactor 1/2; fysieke Windows-DPI-instellingen zijn niet gewijzigd. Dit is het door de gebruiker expliciet geaccepteerde restrisico; er is geen open aangetoonde M-PATH.0-productiefout geregistreerd.

## Architecturale eindcontrole — statisch, geen nieuwe functionaliteit

| Invariant | Broncontrole en bestaand bewijs | Uitkomst |
|---|---|---|
| Eén zichtbare universele ingang | `editor.html:44` bevat één `data-tool="construct:pointOnObject"`. `ToolCatalog` leidt sidebar, zoeken en fullscreen uit het manifest af; `editor-radial-properties.js:530` gebruikt dezelfde catalogus. | Conform |
| Geen afzonderlijke legacyknoppen | Geen concrete `pointOnSegment`-, `pointOnCircle`- of `pointOnEllipse`-knop in het manifest. A2-catalogustests en gerichte V2-browserflows controleren de surfaces. | Conform |
| Bestaande persistente recepten | `construction-service.js` definieert de drie soorten; `pathKind` en parameterregels zijn behouden. De service verschilt niet van actuele main. | Conform |
| Documentcompatibiliteit en geen nieuw aliasrecept | Model, engine, geometrie en constructieservice verschillen niet van main. De alias bestaat alleen in de UI-dispatch; V2 Node/roundtrip controleert bestaande concrete recepten en weigert `contract('pointOnObject')`. | Conform |
| Geen schema- of permissiemodelwijziging | Geen wijziging aan `permission-runtime.js`, model, schema's of serializers tegenover main. `editor.js:88`, `pointOnObjectCandidates` en `radialPathPlacement` controleren de concrete tool-/bronrechten opnieuw; de bestaande runtime blijft beslissen. | Conform |
| Vaste polygon-edge-index | `pointOnObjectReference`/`pointOnObjectPlans` gebruiken expliciete edge-ref; staging bewaart `state.sources`, commit geeft dezelfde bronnen door. De bestaande service projecteert en klemt op die geïndexeerde zijde. V2 controleert drag, Undo/Redo en bronupdate zonder zijdewisseling. | Conform |
| Bestaande ConstructionService | `editor.js:595` e.v. gebruikt `projectParameter`, `line`, `contextualPlans` en getypeerde referenties; commit via bestaande `construction.create`. Radiaal start via bestaande `startContextConstruction`. | Conform |
| Alleen ondersteunde dragers | Gedeelde filter accepteert lijnstuk, expliciete polygonzijde, cirkel en ellips; vector, maatlijn, rechte en halfrechte zijn in V2 uitgesloten voor sidebar en radiaal. | Conform |
| Inline objecthernoemen behouden | `beginObjectRename`/`viewRenameKeyDown` en hun eventaansluiting blijven aanwezig; de M-PATH-diff wijzigt deze code niet. Gerichte V2 `OBJECT_RENAME_ONLY` is PASS. | Conform; geen nieuwe browser-PASS geclaimd |

De statische manifestinventarisatie telt precies 1 universele ingang en 0 legacy-ingangen. Een tekstvergelijking van het volledige `beginObjectRename`/`viewRenameKeyDown`-blok met actuele main bevestigt dat dit blok ongewijzigd is. Geen architecturale afwijking of functionele blokkering gevonden bij deze gerichte eindcontrole. Geen brede audit, productiecorrectie of refactor uitgevoerd.

## Merge-readiness en wijzigingshygiëne

- Geïsoleerde bestaande werkboom `m-path-v2-verification` gebruikt; werkboom bij aanvang schoon. De andere taak op `codex/perf-1-baseline-audit` en haar experimentbestanden zijn niet gewijzigd of opgenomen.
- Actuele remote refs expliciet opgehaald. Remote feature en lokale HEAD waren beide `f5d77aa0cf68c987aef809fef9215bfcffb91132` (afstand `0 0`).
- Actuele `origin/main`: `a734048ba7822aa504ece7294383a9e54077cb81`. De featurebranch stond bij aanvang **11 commits vooruit, 0 achter**. `git merge-base --is-ancestor origin/main HEAD` retourneerde 0; de merge-base is exact actuele main.
- Alle main-wijzigingen zijn dus al opgenomen. Er is geen nieuwe integratieafwijking die een aanvullende gerichte integratietest of synchronisatie vereist. Integratie naar deze main kan als fast-forward en heeft daardoor geen inhoudelijke mergeconflicten; er is geen merge uitgevoerd.
- De volledige diff tegenover main omvat vóór A3 27 bestanden: uitsluitend M-PATH-UI/adaptercode, bijbehorende tests en vijf M-PATH-rapporten. Geen bestanden van parallelle projecten, experimentele benchmarks, screenshots, dependency-installaties of schemawijzigingen in de wijzigingenset.
- A3 voegt uitsluitend dit document en de roadmapwijziging toe. Historische roadmapstatussen zijn expliciet opgevolgd; M-PATH.0 is nog niet als gemerged gemarkeerd. M-PATH.1–3 en andere milestones blijven ongestart.
- `git diff --check origin/main HEAD` signaleert bestaande Markdown-hardbreakspaties en een lege slotregel in de historische A-/I-rapporten. Dit is geen mergeconflict of productieafwijking; die historische documenten worden niet herschreven. De eigen A3-diff wordt afzonderlijk op whitespace gecontroleerd.

## Definitief advies

**READY FOR MERGE — met expliciet door de gebruiker geaccepteerd restrisico van de niet-afgeronde volledige Edge-regressie.**

Dit is een voorbereidingsadvies op de hierboven gecontroleerde main-basis. Er zijn geen open inhoudelijke mergeconflicten of aangetoonde architecturale blokkeringen. De ontbrekende volledige Edge-dekking blijft een werkelijke verificatiebeperking. Een eventueel later gewijzigde main vereist opnieuw een actuele branch-/integratiecontrole.

Er is geen merge naar main geautoriseerd of uitgevoerd in A3. Deze stap stopt na commit en push van uitsluitend de A3-documentatie en roadmapwijzigingen op de featurebranch; een afzonderlijk expliciet gebruikers-GO blijft vereist voor de daadwerkelijke merge.
