# Codex — uitvoeringsplan voor nieuwe geometrie-/UI-trajecten

<!-- DOC-RADIAL-1: historie en voorrang, 2026-10-14 -->
> **HISTORISCH DOCUMENT — geen actuele implementatieopdracht.** Dit bestand beschrijft de ontwerp- of uitvoeringsfase op de genoemde datum/branch. Voor het **huidige radiaalmenu** zijn [UI-RADIAL-9-CONTRACT-DRIVEN.md](UI-RADIAL-9-CONTRACT-DRIVEN.md), [AGENTS.md](../AGENTS.md) en [roadmap v2.8.0](DEVELOPMENT-ROADMAP.md) leidend. Latere gebruikersbesluiten hebben de eerdere keuze voor een vaste rechter eigenschappenbalk en een automatisch eigenschappenicoon vervangen: nu rechtsklik, compacte zesdelige ring, zwevende inspector en contractgestuurde constructies. Bronplan- en startfunctieafspraken uit oudere versies zijn vervangen door `ConstructionService.contextualPlans` en `EditorApp.startContextConstruction`. Overige wiskundige/historische observaties blijven referenties voor hun eigen fase. Oudere testresultaten of statussen zijn **geen actuele regressie-PASS** en de branch is nog niet naar `main` gemerged.

Versie: 1.0.1 · 2026-10-13 · status: geplande taken, geen implementatie-opdracht.

## Bronnen (in deze volgorde)
1. `docs/DEVELOPMENT-ROADMAP.md` v2.5.0: globale prioriteit en fasegrenzen.
2. `docs/GEOMETRY-TOOLS-REGIONS-RADIAL-ARCHITECTURE-v1.0.0.md`: normatief gedrags- en architectuurcontract voor alle vier uitbreidingen.
3. `docs/FEATURE-BACKLOG.md` v1.7.0: functionele volledigheid.
4. `docs/TOOL-PANEL-REORGANIZATION-REPORT.md` en `docs/M6A-TRIANGLE-CENTERS-CONTRACT.md`: historische specificaties/rapporten waarvan de corresponderende M6a- en toolpanelimplementatie inmiddels op `main` staat.
5. Actuele code, tests en manifest zijn uiteindelijk de bron van waarheid voor wat werkelijk geïmplementeerd is.

## Werkwijze
**SYNC-0 is uitgevoerd** door Codex op main SHA `54b2f55027b69c39875f7ea4a5ebe8b16f1d2bde`, zonder codewijzigingen of nieuwe tests. M6a-centra en de bestaande paneelimplementatie zijn geïntegreerd; UI-T1, G-TRI1, UI-R1/2, REG-1/2 zijn nog niet geïmplementeerd. Gebruik voortaan de actuele main als basis en respecteer open handmatige acceptatie. Historische rapporten noemen 585 Node PASS en 54 Edge-modules; herverifieer wanneer de volgende codewijziging dat vereist.

Vervolgens in aparte opdrachten en branches:
- **CORE-1 — ontwerp**: actualiseer de pure herbruikbare functies/API-interfaces na audit van bestaande services. Maak geen nieuwe algemene geometry engine of productcode voordat ontwerp-acceptatie er is. Model **GPT-6 High**.
- **UI-T1 — implementatie**: Vrije objecten met cirkel/driehoek/veelhoek, daaronder Constructies; ontbrekende Gebieden & opvulling; exact 8 categorieën, geen gewijzigde `data-canvas-tool` IDs, werkende M6a-knoppen en inert placeholders. Begin vanaf actuele `main`; bestaande toolpanelcode is daar al geïntegreerd. Model **GPT-6.1 Sol Medium**; eindcontrole **GPT-6 High**.
- **G-TRI1 — implementatie**: drie bestaande punten A/B/C, één geconstrueerd `polygon` met drie vertices, typed construction sources, dynamiek, recoverable invalid, niet slepen, M6a-triangle-input, JSON/undo/SVG/PNG, author/restricted. Model **GPT-6 High**. Neem eerst expliciet ontwerpbesluit over constructor/schema-aanpassing en ontvang gebruikers-GO wanneer structureel nodig.
- **UI-R1 — ontwerp**: visueel/keyboard/ARIA/context contract radiaalmenu, preserving inspector access. Model **GPT-6 High**.
- **UI-R2 — implementatie**: generieke RadialMenu + geautoriseerde per-object property-acties, terugval naar volledige rechter inspector. Model **GPT-6 High** architectuur, **GPT-6.1 Sol Medium** vormgeving.
- **REG-1 — ontwerp**: minor/major sector/segment sweep, polygon area, dimensies/units, geschiktheid voor labels, rollen/permissies/geometry persistence, onafhankelijke expected numeric fixtures. Model **GPT-6 High**.
- **REG-2 — implementatie**: eerste release samen **ingekleurde afhankelijk regio's én optioneel oppervlaktewaarde-label**, met testmatrix uit architectuur. Model **GPT-6 High** wiskunde en **Sol Medium** inspector/menus.
- **UI-R3** en **REG-3** uitsluitend met extra opdracht, omdat zij UI-veldpariteit respectievelijk M11/M12/boolean contracts vereisen.

## Per pakket verplicht
- Schrijf vooraf de bestaande en nieuwe testgevallen op; vermijd honderden duplicatieve snapshot-/rapportbestanden.
- Gebruik bestaande productieapp; **geen externe mockups**.
- Behoud originele schema-/permissiecontrole; restricted bronnen nooit via DOM, tooltip, clipboard, SVG, JSON of stale caches uitlekken.
- Renaming van UI-categorie mag niets veranderen aan opgeslagen objecttype of commando-ID.
- Node en werkelijke Edge in scope, gerichte tests vóór relevante volledige regressie; rapporteer run-command, PASS/FAIL/SKIP en handmatige ontbrekende checks zonder fictief bewijs.
- Een geconstrueerde driehoek is niet rechtstreeks versleepbaar. Een geometrisch gebied berekent echte oppervlakte; een radialmenu voert geen eigen modelwrites uit.
- Rapportage: **één compact implementatierapport per afgebakende mijlpaal**, met veranderde bestanden, API's, schema/permission-diff, testresultaten, risico's, screenshots uit echte app waar UI verandert, en branch + commit-SHA.
- Commit en push naar featurebranch; **niet automatisch naar main mergen**. Wacht op expliciete gebruikersacceptatie vóór de volgende implementatiefase.

## Eerste Codex-opdracht (copy/paste)
**Volgende opdracht — CORE-1:** inspecteer op actuele `main` de bestaande construction graph, polygon/triangle-bronrol, units/formatting, inspectorcommands, gereedschapscatalogus en permissies. Lever een concreet hergebruik-/API-ontwerp voor `resolveRegionGeometry`, `computeRegionArea`, gedeelde eigenschappenacties en declaratieve toolindeling; toon bestaande functies die al voldoen en identificeer uitsluitend noodzakelijke adapters. Voeg test- en schema-/permissiecontracten toe en stop vóór productiecode. Gebruik GPT-6 High.
