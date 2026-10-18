# Gereedschappenmenu herstructurering — implementatierapport

- **Opdracht:** v1.0.0 met bindende aanvulling v1.1.0
- **Branch:** `codex/ui-tools-menu-reorganization`
- **Basis:** actuele `origin/main`, commit `a5355b3fe2ba205925511af2f8d89b6f7ad0938b`
- **Roadmap:** v2.8.18

## Uitvoering

- De vijf geplande items zijn uit **Vrije objecten** verwijderd.
- **Cirkel via punten** staat onder **Constructies → Kegelsneden** met dezelfde ID; de lege subcategorie Cirkelconstructies is verwijderd.
- **Punt op ellips** staat uitsluitend onder **Constructies → Puntconstructies**.
- **Vectoren** is zichtbaar als lege, niet-uitklapbare subcategorie met milestone `M7-VEC-FUND`; er is geen vectorgereedschap of tool-ID toegevoegd.
- De menu-ingangen voor `construct:perimeter` en `construct:area` zijn verwijderd. Berekening, constructierecepten, afhankelijke herberekening, maatlabels, inspector, geschiedenis en documentopslag/-export bleven behouden.
- **Gecombineerde meting** is een niet-interactieve placeholder. De zijpaneelzoekfunctie vindt placeholders en telt ze mee; de fullscreenkiezer toont de placeholder met tooltip zonder hem activeerbaar te maken.
- Het primaire-functieclassificatieprincipe is vastgelegd in de [ontwikkelroadmap](../../DEVELOPMENT-ROADMAP.md).

## Verificatie

- `npm test` — **706/706 geslaagd**, geen overgeslagen tests.
- `npm run test:edge` — **geslaagd**, geen browserpaginafouten. De volledige suite omvatte de bijgewerkte toolpanel- en zoekscenario’s.
- Gerichte Edge-checks `TOOL_PANEL_ONLY`, `UI_LEFT_ONLY`, `AREA_MENU_ONLY` en `SPLIT_TOOLS_ONLY` — alle geslaagd. Hiermee zijn placeholderzoekgedrag en tellers, fullscreenweergave, lege Vectoren-groep, metingslabels, undo/redo, herladen, SVG-export en subgroepbediening gecontroleerd.
- `git diff --check` — geslaagd.

Er zijn in de gewijzigde catalogus geen bijkomende classificatieproblemen vastgesteld die deze opdracht rechtvaardigen om te verplaatsen. Andere tools zijn daarom niet heringedeeld. De uitvoerbare berekeningen en documentsemantiek voor omtrek en oppervlakte zijn ongewijzigd; alleen hun menuvermeldingen zijn vervallen.

## Advies

**GO voor beoordeling en merge naar `main`**, op basis van de volledige groene Node- en Edge-regressies. De featurebranch is gepusht; er is geen merge uitgevoerd. Merge blijft afhankelijk van afzonderlijke toestemming.
