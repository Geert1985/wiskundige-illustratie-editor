# M-PATH.0-V — Verificatie en pariteit

Datum: 17 oktober 2026. Branch: `codex/m-path-0-universal-point-tool`.
Onderzochte implementatiecommit: `e67bf92`; onderstaande correcties volgen op die commit.
Normatief: contract v1.0.1, §§3–10 en M-PATH.0-V. De gebruiker gaf expliciet GO voor V; het eerdere verbod op nieuwe Edge-runs blijft gevolgd.

## Resultaat

De verificatie vond twee M-PATH.0-fouten die in deze fase zijn hersteld:

1. `EditorApp.renderPointPlacementPreview` plaatste de polygonrandhighlight met absolute CSS-schermcoördinaten in de SVG. Bij canvasoffsets of schaalaanpassing kwam de highlight daardoor niet op de juiste rand. De overlay gebruikt nu `renderer.mapX/mapY`, dezelfde SVG-ruimte als de brongeometrie. Een Node-regressie controleert beide eindpunten en weigert gebruik van de schermtransformatie.
2. De radiale alias componeerde alle bestaande segmentplannen, inclusief vectoren en maatlijnen. De sidebar beperkte zich conform contract tot lijnstukken en polygonranden. Een gedeelde referentiefilter en `pointOnObjectPlans` worden nu gebruikt bij radiaal aanbod, uitvoering en sidebarselectie. De Node-regressie weigert vector, maatlijn, rechte, halfrechte en punt; een volledige polygon zonder expliciete rand levert geen plan, een exacte edge-ref behoudt haar index.

Geen model-, schema-, recept- of permission-runtimewijziging. Geen merge naar main.

## Pariteitsmatrix

| Aspect | Bestaande ingangen | Universele ingang | Bewijs en beperking |
|---|---|---|---|
| Lijnstuk / polygonrand | pointOnSegment | Zelfde recept en getypeerde bron | Bestaande Node-dekking; gedeelde projectie/clamp-regressie; eerdere gerichte Edge-pass |
| Cirkel | pointOnCircle | Zelfde recept en periodieke parameter | Node-projectietest; eerdere gerichte Edge-pass |
| Ellips | pointOnEllipse | Zelfde recept, nearest-projectie | Node-projectietest; eerdere gerichte Edge-pass |
| Bronselectie | Lijn/cirkel direct; ellips met staging | Alle dragers twee stappen | Bewust contractverschil; eerdere gerichte Edge-pass voor staging en één creatie |
| Polygonrand | Vaste edge-index en parameter | Dezelfde identiteit | Nieuwe Node-plan-/highlighttests; eerdere Edge-clamp en radiale edge-prefill |
| Sidebar / radiaal | Concrete bronrollen | Gedeelde aliasfilter en concrete serviceplannen | Twee gevonden pariteitsfouten hersteld; browserhercontrole van deze fixes nog open |
| Historie en cancel | Bestaande command/history | Concrete construction.create en cancel | Eerdere gerichte Edge-pass voor Undo/Redo, Escape en pointercancel |
| Opslag en export | Bestaande recepten/schema's | Dezelfde persistente objecten | Productiemodel en serializers ongewijzigd; bestaande Node-suite |
| Rechten | Concrete allowedTools/sourceTools | Concrete controle bij selectie/commit | Statische controle; restricted-browsermatrix blijft open |
| Oude knoppen | Aanwezig | Aanwezig naast alias | Nog geen verwijdering of definitieve omschakeling |

## Testregistratie

- In M-PATH.0-I: `npm test` 744/744 PASS; gerichte Edge-suites voor alias en split-tools PASS. Dit is historisch bewijs voor e67bf92, geen browser-PASS voor de huidige correcties.
- In deze V-fase: `node --test tests/point-on-object-alias.test.cjs` — 4/4 PASS, geen skips.
- `npm test` — 746/746 PASS, nul fouten, nul skips; uitgevoerd na de productiecorrecties.
- Nieuwe Edge-runs: SKIP op uitdrukkelijke instructie van de gebruiker. De eerdere volledige Edge-poging faalde op een daarna gecorrigeerde catalogusfixture; de herhaling werd gestopt. Geen volledige Edge-PASS.
- Handmatige gebruikersacceptatie: niet geregistreerd. De GO voor starten van V is geen verklaring dat alle dragers handmatig zijn geaccepteerd.

## Beslissing

**NO-GO voor definitieve omschakeling, verwijderen van oude knoppen en merge op basis van deze verificatie.** De twee aangetroffen codefouten zijn gecorrigeerd en gericht met Node gecontroleerd. Browsercontrole van de actuele fixes, de open restricted-/schermschalenmatrix en expliciete gebruikersacceptatie blijven open. De beperkte V-verificatie is hiermee gerapporteerd; volledige contractacceptatie is nog niet aangetoond. Geen algemene release-PASS.

De branch is gebaseerd op 9eb8165; zes later lokaal bekende main-commits zijn niet geïntegreerd. Integratiecontrole blijft onderdeel van een afzonderlijke mergebeslissing. Bij lokaal openen na deze wijzigingen is een harde refresh nodig wegens de bestaande assetcachetoken.
