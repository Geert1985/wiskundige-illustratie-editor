# UI-RADIAL-1 — Contextueel eigenschappenmenu

<!-- DOC-RADIAL-1: historie en voorrang, 2026-10-14 -->
> **HISTORISCH DOCUMENT — geen actuele implementatieopdracht.** Dit bestand beschrijft de ontwerp- of uitvoeringsfase op de genoemde datum/branch. Voor het **huidige radiaalmenu** zijn [UI-RADIAL-9-CONTRACT-DRIVEN.md](UI-RADIAL-9-CONTRACT-DRIVEN.md), [AGENTS.md](../AGENTS.md) en [roadmap v2.8.0](DEVELOPMENT-ROADMAP.md) leidend. Latere gebruikersbesluiten hebben de eerdere keuze voor een vaste rechter eigenschappenbalk en een automatisch eigenschappenicoon vervangen: nu rechtsklik, compacte zesdelige ring, zwevende inspector en contractgestuurde constructies. Bronplan- en startfunctieafspraken uit oudere versies zijn vervangen door `ConstructionService.contextualPlans` en `EditorApp.startContextConstruction`. Overige wiskundige/historische observaties blijven referenties voor hun eigen fase. Oudere testresultaten of statussen zijn **geen actuele regressie-PASS** en de branch is nog niet naar `main` gemerged.


**Datum:** 14 oktober 2026  
**Basisbranch:** `codex/ui-sidebar-tabs-layer-drag`  
**Implementatiebranch:** `codex/ui-radial-context-properties`  
**Status:** geïmplementeerd en gepusht; **tests bewust niet uitgevoerd op verzoek van de gebruiker**. Geen merge naar `main`.

## Doel en gebruik

- De permanente rechter eigenschappenbalk is uit de werkruimte verwijderd. De linker gereedschappen-/lagentabbladen blijven staan.
- Selecteer een object: er verschijnt een klein ⚙-icoon bij de laatste canvasinteractie. Klik dit icoon om een radiaal menu te openen.
- Een gewone rechtermuisklik op selecteerbare geometrie opent eveneens het menu. De bestaande rechtermuisknop-sleepbeweging blijft bestemd voor kaderselectie.
- De zes radiale acties zijn contextafhankelijk: vrij object, afhankelijke constructie, tekst, assenstelsel, gemengde selectie of groep.
- De objectnaam staat in het midden. Gewone objecten en bestaande groepen kunnen daar hernoemd worden; de naam van het assenstelsel is nog niet als persistente metadata geïmplementeerd.
- De secties openen een **zwevend contextueel detailpaneel**. `Alles` toont de bestaande volledige inspector, zodat numerieke velden, bronrelaties, regio-oppervlakte, hoekinstellingen, eenheden en overige bestaande eigenschappen bereikbaar blijven.
- Uiterlijk en acties gebruiken dezelfde bestaande geautoriseerde commands en undo/redo. Er is geen tweede model, renderpad, kleurservice, regio- of geometrie-engine.
- Door op Escape of buiten het menu te klikken sluit het radiaalmenu, zonder het geselecteerde object te verwijderen. In fullscreen blijft de editor fullscreen.

## Verwerkte wijzigingen

| Bestand | Wijziging |
|---|---|
| `editor-radial-properties.js` | Context-/capability-afhankelijke radiale bedieningslaag, detailfilter, quick actions, group rename, toetsenbord/viewport/interactielifecycle |
| `editor.html` | Verplaats inspector van de rechterkolom naar een zwevend detailoppervlak; voeg radiaal wiel/trigger toe; behoud technische inspector-ID's |
| `editor.css` | Twee kolommen (linkerbalk + canvas), radiale styling, zwevende detailweergave en responsieve afmetingen |
| `editor.js` | Radiale lifecycle in `init/render/dispose`, assencontext, kleurbediening voor REG-2-gebieden |
| `model.js`, `index.js`, `permission-runtime.js` | `group.rename` als geautoriseerde auteurshandeling, met validatie en documentpersistente naam |
| `semantic-sequence.js` | Voeg `group.rename` toe aan de bestaande gecontroleerde replay-allowlist |

## Functionele en architecturale grenzen

1. Het zwevende venster hergebruikt de **oude inspector-DOM en edit-events**, maar is geen rechter zijbalk meer. Verwijder deze onderliggende inspector niet: de radiale secties zijn presentatie boven op dezelfde logica.
2. Voor tekst is de bestaande rijke tekstwerkruimte de eigenaar van inhoud en opmaak. Het radiale menu opent die werkruimte; het heeft geen eigen teksteditor.
3. Afgeleide constructies houden hun bronafhankelijkheden; directe geometrische editing wordt niet door het radiaalmenu toegevoegd.
4. Het assenstelsel behoudt voorlopig de vaste naam **Assenstelsel**, want er is geen goedgekeurd persistente asstelseltitel-contract.
5. Beperkte leermodi blijven onder de bestaande `PermissionRuntime`. `group.rename` is alleen voor author toegestaan.
6. Menu-items voor acties worden slechts aangeboden wanneer er een relevante selectie is; het commando blijft bij uitvoering opnieuw valideren.

## Nog handmatig te beoordelen (niet getest)

- [ ] Vrij object selecteren, icoon openen, naam wijzigen, stijl wijzigen en Undo/Redo.
- [ ] Vrije driehoek en gekoppelde driehoek: directe bronafhankelijke geometrie mag niet wijzigbaar worden.
- [ ] Rechtermuisklik opent het wiel; rechtermuisknop-slepen behoudt kaderselectie.
- [ ] REG-2-cirkelsector en -segment: opvulkleur, boogmodus, oppervlakteweergave en export.
- [ ] Assenstelsel: assen, raster, eenheden, hoekinstellingen.
- [ ] Multiselectie: gemengde stijlwaarden, groep maken, hernoemen en opheffen.
- [ ] Rich text, labels, kleurkiezer, Dialog/Escape en fullscreen.
- [ ] Mobiel/tablet, toetsenbordfocus en schermlezer.
- [ ] Echte Edge/browser-regressies, Node-tests, JSON/SVG/PNG-roundtrips en security/restricted-flow.

**Belangrijk:** er zijn **geen** tests, build, syntaxischeck of runtimecontroles uitgevoerd. De branch is bedoeld voor visuele gebruikersinspectie; compatibiliteit en volledige functionele pariteit zijn nog niet geverifieerd.


## UI-RADIAL-2 — correcties na gebruikersfeedback (14 oktober 2026)

**Branch:** `codex/ui-radial-context-properties` · **uitvoering:** bronwijzigingen gepusht; geen tests uitgevoerd zoals eerder gevraagd.

1. De losse actieknoppen in het detailpaneel zijn vervangen door compacte SVG-iconen met begrijpelijke `title`-tooltips en `aria-label`-namen. De bestaande `data-radial-quick`-acties en permissieroutes worden onveranderd aangeroepen.
2. Een categoriewissel voert altijd `renderQuickActions()` uit. De actiecontainer wordt bij iedere andere categorie expliciet geleegd en verborgen, zodat actie-iconen niet achterblijven; bij updates binnen de acties worden de iconen en labels opnieuw bepaald.
3. Het browser-eigen contextmenu wordt op het canvas in selectiemodus met `preventDefault()` onderdrukt; de bestaande rechts-sleep-kaderselectie en het contextuele radiaalmenu blijven afzonderlijke interacties.
4. `angle` en `rightAngle` zijn van **Meten & analyseren** naar **Vrije objecten** verhuisd. `Hoek (statisch)` heet voortaan **Hoek**. De nu lege subgroep **Hoeken tekenen en meten** is verwijderd. Gereedschap-ID's en bestaande commando's blijven identiek, en de fullscreencatalogus wordt uit dezelfde DOM afgeleid.
5. Assetversies in `editor.html` zijn verhoogd zodat de browser nieuwe CSS, editor- en radiaalmenucode ophaalt.

**Nog niet gevalideerd:** browserhandelingen en geautomatiseerde tests, inclusief contextmenu-interactie in Edge, categoriewissels, mobiele bediening en fullscreen. Alleen GitHub-bestanden en branchverschillen zijn gecontroleerd; er is geen merge naar `main`.


## UI-RADIAL-3 — vaste positie, enkelvoudige acties en browsercontextmenu (14 oktober 2026)

**Implementatiebranch:** `codex/ui-radial-context-properties`. Deze wijziging volgt op gebruikersfeedback met een screenshot waarop de actieknoppen dubbel zichtbaar waren.

- **Radiaalmenu blijft op zijn positie:** pointer-up boven het geopende wiel of het zwevende eigenschappenvenster wijzigt de bewaarde ankerpositie niet meer. Een categoriewissel toont alleen andere details.
- **Verplaatsing uitsluitend bewust:** boven in het midden van het wiel staat een sleepgreep (`radial-drag-handle`). Sleep met muis/touch of verplaats met de pijltjestoetsen terwijl de greep focus heeft (Shift = grotere stappen). De positie verandert alleen door deze bediening of wanneer een andere selectie het menu opnieuw initialiseert.
- **Geen dubbele actie-iconen:** de tijdelijke, grote `radial-quick-actions`-rij met duplicaatcommando's is volledig verwijderd uit module, HTML en CSS. `Acties` toont alleen de reeds bestaande compacte, geautoriseerde inspector-acties; de overige eigenschappencategorieën blijven gescheiden.
- **Browsermenu op geselecteerde objecten:** `contextmenu` wordt nu in de capturefase van het document onderschept wanneer de gebeurtenis op de selecteerbare canvasruimte of het radiaalmenu terechtkomt. Daardoor maakt het geen verschil dat het radiaalmenu bij de voorafgaande pointer-up boven de oorspronkelijke SVG-objecten verschijnt. Rechts-sleep-kaderselectie blijft eigendom van de bestaande interactieruntime.
- **Cache:** CSS- en radiaalmodules in `editor.html` gebruiken de nieuwe `ui-radial-3` cachetoken.

**Niet uitgevoerd:** Node-tests, Edge/browsertests, build- of syntaxchecks, overeenkomstig de eerdere wens om geen tests uit te voeren. Alleen statische bron- en GitHub-versiecontrole. Handmatige acceptatie: selecteer een object, rechtsklik herhaaldelijk, wissel alle categorieën en controleer vaste positie; sleep de greep; controleer fullscreen, toetsenbord, werkelijke SVG-hit targets en rechts-sleep-kaderselectie. Geen merge naar `main`.
