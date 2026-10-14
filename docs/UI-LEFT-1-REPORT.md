# UI-LEFT-1 — Linkerkolom: inklappen, zoeken en leesbaarheid

**Status:** implementatie gepusht naar `codex/ui-left-sidebar-navigation`; nog niet naar `main` gemerged.
**Basisbranch:** `codex/reg-2-dynamic-regions`.
**Reikwijdte:** editorlinkerkolom. Geen wijzigingen aan meetkundige constructies, documentmodel of rechtencontracten.

## Uitgevoerd

1. Acht hoofdcategorieën van Gereedschappen zijn standaard ingeklapt; Gereedschappen zelf blijft open zodat zoeken meteen beschikbaar is.
2. Vijf bestaande subgroepen hebben een afzonderlijke knop met `aria-expanded` en gekoppeld inhoudspaneel: Puntconstructies, Lijnconstructies, Cirkelconstructies, Driehoekconstructies, Hoeken tekenen en meten. Alle vijf zijn standaard dicht.
3. Lagen en objecten, Illustratie en Bediening staan standaard dicht.
4. Zoekveld onder Gereedschappen filtert op titel van gereedschap, technische tool-ID, hoofd- of subcategorie. Ook keuzemogelijkheden in bestaande split-tool-menu's zijn doorzoekbaar. Tijdens filteren gaan uitsluitend relevante hoofdcategorieën en subgroepen open, wordt niet-relevante inhoud verborgen en wordt een resultaatmelding getoond. Wissen/Escape herstelt de voorafgaande open/dicht-status.
5. Breder linkerpaneel op desktop/tablet/mobiel, grotere koppen en gereedschaplabels, tekstomloop voor lange namen, geen noodzakelijke nieuwe tool-ID's of kopieën van functies.
6. UI-T1 browserhelper aangepast zodat bestaande tests gereedschappen binnen dichtgeklapte subgroepen nog kunnen activeren; de bestaande responsiviteitstest opent de subgroepen nu vóór de geometrische grenscontrole.

## Code

- `editor.html`: semantische knoppen, zoekveld, standaardstatus, nieuwe scriptreferentie.
- `editor.css`: breedte, typografie, tekstomloop, visuele open/dicht-status, zoekfeedback.
- `editor-tool-search.js`: geïsoleerde DOM-logica voor subgroepen en zoekfilter; geen engine- of documentmutaties.
- `tests/browser-tool-menu.cjs`, `tests/browser-tool-panel-reorganization.cjs`, `tests/browser.cjs`: bestaande Edge-harness aangepast.
- `tests/left-sidebar-navigation.test.cjs`: statische Node-controles.
- `tests/browser-sidebar-navigation.cjs`: Edge-acceptatiescenario's, waaronder responsieve breedten en documentonveranderlijkheid.

## Verificatie en openstaande acceptatie

**Uitgevoerd in de beschikbare GitHub-/JavaScript-omgeving:** bestanden zijn op de branch teruggelezen, script-/testbestanden zijn met de V8 JavaScript-parser gecontroleerd, markup-aantallen en tool-ID-uniciteit zijn nagezien, en de branchediff is met de REG-2-basis vergeleken. Er werden geen fouten gevonden in die beperkte controles.

**Niet uitgevoerd:** `node --test tests/*.test.cjs`, `node tests/browser.cjs`, `UI_LEFT_ONLY=1 node tests/browser.cjs`, en de handmatige desktop-/tablet-/mobielacceptatie. De huidige omgeving heeft geen checkout of lokaal Edge-testproces voor deze repository. Deze controles moeten vóór de merge nog op een lokale checkout of via Codex/CI worden uitgevoerd. Eventuele regressies eerst op deze branch oplossen.

## Acceptatiepunten

- Aanvang: alle acht gereedschapscategorieën, vijf subgroepen en de drie andere zijsecties dicht, maar Gereedschappen open en zoekveld bruikbaar.
- Cirkelsector, cirkelsegment en andere REG-2-gereedschappen blijven intact.
- Lange naam ‘Middelpunt omgeschreven cirkel’ past binnen knop/zijbalk; ook op 800px en 390px breedte.
- ‘Negenpuntscirkel’ en ‘Punt op cirkel’ zijn vindbaar; geen zoekresultaat geeft een heldere melding.
- Wissen van zoekterm herstelt handmatig opengeklapte subgroepen; standaard zoekactie verandert document, geschiedenis en eigenschappen niet.
- Split-menu's, fullscreen-gereedschapscatalogus en permissiegedrag blijven ongewijzigd.

## Wijziging op verzoek: alle gereedschapsknoppen rechtstreeks zichtbaar (2026-10-14)

De zeven bestaande split-tool-groepen zijn in de linkerkolom vervangen door hun afzonderlijke gereedschapsknoppen. In `Vrije objecten` verschijnen nu rechtstreeks **Punt, Lijnstuk, Rechte, Halfrechte, Vector, Driehoek, Veelhoek en Cirkel**. Hetzelfde principe geldt voor punt- en lijnconstructies en meet-/hoekgereedschappen.

De bestaande `data-tool`-ID's en de opbouw van de catalogus voor de fullscreen-chooser blijven behouden; de actieve tool wordt nog steeds via het bestaande `setTool`-pad gekozen. De zoekfunctie filtert nu afzonderlijke gereedschapsknoppen in plaats van split-menu-containers.

**Verzoek gebruiker:** geen tests uitvoeren. Daarom zijn voor deze wijziging geen Node-, browser- of handmatige tests uitgevoerd. Bestaande tests die de oude split-menu-interface veronderstellen, moeten vóór een toekomstige test-/mergegate nog aan de nieuwe UI worden aangepast. De featurebranch is niet naar `main` gemerged.
