# M-PATH.0-A2 — Definitieve UI-omschakeling

**Datum:** 17 oktober 2026  
**Branch:** `codex/m-path-0-universal-point-tool`  
**Remote basiscommit:** `f19ab93854f59319dafa6a7414b903c0be31980a`  
**Normatief contract:** `WIE-M-PATH-0-Ontwerp-en-implementatiecontract-v1.0.1.md`  
**Autorisatie:** expliciete gebruikers-GO voor verwijderen van de legacyknoppen vóór de definitieve regressieverificatie. Handmatige acceptatie staat in `M-PATH-0-A-HANDMATIGE-ACCEPTATIE.md`.

## Uitgangsbasis

Remote main en de bestaande featurebranch zijn opgehaald. De checkout is gecontroleerd op f19ab938, gelijk aan de actuele remote featurebranch en met 0 commits achter origin/main. De eerdere main-integratie voor inline objecthernoemen blijft behouden. De nog niet opgeleverde lokale V2-browseruitbreidingen zijn vooraf in een stash bewaard; ze maken geen deel uit van A2. Na het veiligstellen zijn de betrokken tracked bestanden naar de remote basis hersteld en was de werkboom schoon.

De lopende volledige Edge-test van V2 is op de nieuwe gebruikersopdracht gestopt. Resultaten uit die eerdere, onderbroken fase worden niet als A2-resultaat opgevoerd.

## UI-wijziging

De drie afzonderlijke knoppen zijn uit `editor.html` verwijderd:

- `construct:pointOnSegment` — Punt op lijnstuk.
- `construct:pointOnCircle` — Punt op cirkel.
- `construct:pointOnEllipse` — Punt op ellips.

`construct:pointOnObject` is nu de enige punt-op-drageringang onder Constructies → Puntconstructies. De totale catalogus heeft 37 werkende gereedschappen in plaats van 40.

`ToolCatalog` bouwt de catalogus vanuit deze HTML. Sidebar, zoekfunctie en fullscreen gebruiken daardoor dezelfde enkele ingang. Het radiaalmenu leest eveneens de gedeelde catalogus; de verwijderde concrete tool-ID's krijgen daar geen afzonderlijke menu-ingang meer. Er is geen extra objecttypefilter of tweede radiale catalogus toegevoegd. De bestaande universele bronfilter blijft vectoren, maatlijnen, rechten en halfrechten uitsluiten.

De instructiepresenter heeft nu een expliciete tweestapsuitleg voor Punt op object. De gedeelde assetcachetoken is verhoogd naar `m-path-0-a2-20261017`.

## Behouden functionaliteit

De persistente recepten `pointOnSegment`, `pointOnCircle` en `pointOnEllipse`, hun getypeerde bronreferenties, parameterberekeningen en dependencygedrag zijn ongewijzigd. Er is geen nieuw persistent aliaskind, schema of documentmigratie toegevoegd.

`ConstructionService`, model, engine, permission-runtime en serializers zijn niet aangepast. Concrete allowedTools/sourceTools blijven leidend. De bestaande interne editor-/service-ingangen voor concrete soorten blijven beschikbaar voor compatibiliteit en gedeelde functionaliteit; A2 verwijdert geen interne API enkel omdat de bijbehorende zichtbare knop verdwijnt. Er was geen afzonderlijke knopeventhandler om weg te halen: de knoppen gebruikten de bestaande generieke catalogusdispatch.

## Gewijzigde bestanden

| Bestand(en) | Wijziging |
|---|---|
| `editor.html` | Drie knoppen verwijderd, gedeelde cachetoken verhoogd. |
| `editor-tool-instructions.js` | Tweestapsuitleg en hint voor de universele ingang. |
| `tests/point-on-object-ui-switch.test.cjs` | Nieuwe gerichte Node-controles voor één catalogusingang, vier dragers en roundtrip van de concrete recepten. |
| `tests/tool-panel-reorganization.test.cjs`, `tests/left-sidebar-navigation.test.cjs` | Verwachte catalogusinhoud en telling aangepast naar 37. |
| `tests/radial-petals.test.cjs`, `tests/browser-asset-compat.cjs` | Verwachte gedeelde cachetoken bijgewerkt. |
| `tests/browser-split-tools.cjs`, `tests/browser-tool-panel-reorganization.cjs`, `tests/browser-sidebar-navigation.cjs` | Nieuwe punttool-lijst, catalogustelling en zoekterm. |
| `tests/browser-linked-paths.cjs`, `tests/browser-linked-tangent.cjs` | Verwijderde knopselecties vervangen door universele bronkeuze plus bevestiging; onderliggende recept-/dragasserties behouden. |
| `tests/browser-ellipse-control-point.cjs`, `tests/browser-point-on-ellipse.cjs`, `tests/browser-parallelogram-ux-m8b2b.cjs` | Sidebar/fullscreen/radiale knopselecties via de universele ingang; concrete recepten en bronasserties behouden. |
| `tests/browser-point-on-object.cjs` | Extra verwachtingen voor afwezigheid van legacyknoppen en oude zoekresultaten. |
| `docs/M-PATH-0-A2-UI-OMschakeling.md` | Dit rapport. |

## Uitgevoerde gerichte verificatie

Exact Node-commando:

```powershell
node --test tests/point-on-object-ui-switch.test.cjs tests/point-on-object-alias.test.cjs tests/tool-panel-reorganization.test.cjs tests/left-sidebar-navigation.test.cjs tests/tool-catalog.test.cjs tests/editor-tool-instructions.test.cjs tests/linked-paths.test.cjs tests/point-on-ellipse.test.cjs tests/radial-petals.test.cjs tests/architecture.test.cjs
```

**35/35 PASS**, 0 fouten, 0 skips.

Daaronder vallen: één universele catalogusingang, afwezigheid van de drie legacyknoppen, vier concrete bronroutes, vaste edge-index en clamp, uitsluiting van niet-ondersteunde dragers, behoud van de drie concrete recepten, JSON-roundtrip en bestaande legacy-parameter-/permissiecontroles.

Aanvullend: `node --check` op de 10 gewijzigde `tests/browser*.cjs`-bestanden — syntaxcontrole PASS; dit voert geen browserflows uit. `git diff --check` — geen whitespacefouten. Broncontrole vond geen expliciete legacy data-tool-, data-canvas-tool- of data-radial-construct-ingangen meer in de productie-UI.

**Niet uitgevoerd in A2:** `npm test`, Edge-browserflows en volledige V2-regressiesuite. Dit is overeenkomstig de expliciete fasegrens van de gebruiker. De aangepaste browserverwachtingen zijn nog niet als browser-PASS gevalideerd.

## Status en resterend risico

De gevraagde UI-omschakeling is uitgevoerd op de featurebranch. Gerichte Node-verificatie is positief; de volledige Node-/Edge-regressie volgt afzonderlijk in M-PATH.0-V2, op deze omgeschakelde stand. Met name de aangepaste browserklikflows en de daadwerkelijke zoek-/radiale/fullscreenweergave moeten daar opnieuw worden uitgevoerd. De eerdere handmatige acceptatie wordt niet omgezet in een geautomatiseerde A2-PASS.

Geen merge naar main. Geen V2-suite gestart na deze omschakeling. De bestaande recepten en interne API's blijven behouden.
