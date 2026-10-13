# Codex — uitvoeringsplan voor nieuwe geometrie-/UI-trajecten
Versie: 1.0.0 · 2026-10-13 · status: geplande taken, geen implementatie-opdracht.

## Bronnen (in deze volgorde)
1. `docs/DEVELOPMENT-ROADMAP.md` v2.5.0: globale prioriteit en fasegrenzen.
2. `docs/GEOMETRY-TOOLS-REGIONS-RADIAL-ARCHITECTURE-v1.0.0.md`: normatief gedrags- en architectuurcontract voor alle vier uitbreidingen.
3. `docs/FEATURE-BACKLOG.md` v1.7.0: functionele volledigheid.
4. `docs/TOOL-PANEL-REORGANIZATION-REPORT.md` en `docs/M6A-TRIANGLE-CENTERS-CONTRACT.md`: referenties van afzonderlijke ontwikkelbranches, **niet** bewijs dat hun code op main staat.
5. Actuele code, tests en manifest zijn uiteindelijk de bron van waarheid voor wat werkelijk geïmplementeerd is.

## Werkwijze
Begin met **SYNC-0** en lever een korte statusmatrix: `main` SHA, relevante featurebranches/SHAs, concrete merged/unmerged code, bestaande M6a-centra en categorieën, relevante grants/schema's, open kwaliteitspoorten, conflicts. Documenteer conflicten en hergebruik de recentste juiste branchbasis; merge geen losstaande ontwikkelingen zonder gebruikersakkoord.

Vervolgens in aparte opdrachten en branches:
- **CORE-1 — ontwerp**: actualiseer de pure herbruikbare functies/API-interfaces na audit van bestaande services. Maak geen nieuwe algemene geometry engine of productcode voordat ontwerp-acceptatie er is. Model **GPT-6 High**.
- **UI-T1 — implementatie**: Vrije objecten met cirkel/driehoek/veelhoek, daaronder Constructies; ontbrekende Gebieden & opvulling; exact 8 categorieën, geen gewijzigde `data-canvas-tool` IDs, werkende M6a-knoppen en inert placeholders. Begin op correcte toolpanelbranch. Model **GPT-6.1 Sol Medium**; eindcontrole **GPT-6 High**.
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
Inspecteer `main`, `codex/tool-panel-reorganization` en de eventuele M6a-/driehoekbranches. Vergelijk daadwerkelijk beschikbare code, docs, manifests, tool-ID's, polygon/triangle-model en rechten met `docs/GEOMETRY-TOOLS-REGIONS-RADIAL-ARCHITECTURE-v1.0.0.md` en de roadmap v2.5.0. Lever een compacte SYNC-0 inventaris van verschil, risico, aanbevolen merge-/implementatievolgorde en exact welke ontwerpkeuzes nog gebruikersgoedkeuring vereisen. Wijzig in deze eerste opdracht **geen productiecode**, maak geen nieuwe mockups en start geen latere mijlpalen. Gebruik GPT-6 High.
