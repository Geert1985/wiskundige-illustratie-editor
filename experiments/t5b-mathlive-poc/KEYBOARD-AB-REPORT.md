# T5b MathLive POC — toetsenbordvarianten A/B

**Branch:** `test/t5b-mathlive-poc`  
**Uitgangscommit:** `b5c46a87c633c7c334a39940520403460e4037bc`

## Vergelijking

| Variant | Bediening | Mogelijkheden |
| --- | --- | --- |
| A — Standaard MathLive | MathLive’s eigen virtuele toetsenbord met de standaard layoutkeuze. | Vertrouwde MathLive-toetsen en navigatie; breedste standaard wiskundige invoer. |
| B — WIE-toetsenbord | Eigen donkerblauw paneel, direct verbonden met hetzelfde Mathfield. | Cijfers, decimale komma, operatoren, haakjes, breuk-, macht- en wortelsjablonen, π, sin/cos/tan, cursorpijlen, Backspace en SHIFT naar asin/acos/atan. |

Beide varianten bewaren dezelfde Mathfield-inhoud bij het wisselen. In B wordt MathLive’s toetsenbord verborgen en de ingebouwde toetsenbordknop uit de Mathfield gehaald om dubbele toetsenborden te voorkomen. De knoppen gebruiken alleen MathLive `executeCommand()`-invoerbewerkingen. De CortexJS- en T5a-resultaatkaarten blijven onveranderde technische referenties.

## Resultaten

- Gerichte POC-unitset: **4/4 geslaagd**.
- Statische controles: `node --check` voor de browser-smoketest en server; `git diff --check` geslaagd.
- In-app browsercontrole: A en B geopend; dezelfde formule `π × 2²` bleef behouden bij heen-en-weer wisselen; B gaf `≈12,56637061` via de T5a-route. SHIFT toonde asin/acos/atan en keerde na een inverse-functietoets terug. Cursor-links gevolgd door Backspace verwijderde de verwachte invoer. Een wortelsjabloon gaf een MathLive-placeholder.
- Geautomatiseerde browser-smoketest: **niet uitgevoerd**. Edge sloot meteen af onder de sandbox; Playwright’s gebundelde Chromium ontbreekt op deze host. Er is geen browserpakket geïnstalleerd en geen regressiesuite gestart.

## Screenshots

De standaard MathLive-toetsenbordweergave (A) en het WIE-paneel (B) zijn tijdens de in-app browsercontrole als screenshots vastgelegd en visueel beoordeeld in het Codex-taskgesprek. De geblokkeerde lokale Playwright-runtime kon de screenshots niet naar bestanden exporteren. Een volgende browserrun met Edge of Playwright Chromium aanwezig schrijft ze naar `artifacts/keyboard-standard.png`, `artifacts/keyboard-wie.png` en `artifacts/keyboard-wie-mobile.png`.

## Aandachtspunten en voorlopig advies

- De eigen WIE-layout geeft meer visuele samenhang en directe toegang tot de gebruikelijke cijfers, operatoren en T5a-functies. Standaard MathLive biedt een rijkere generieke symbolenbibliotheek.
- Kleine schermen krijgen een gestapelde, scrollbare keypadindeling met toetsen van minimaal 48 CSS-pixels. De CSS-breakpoint is ingericht; een echte mobiele browsermeting was niet beschikbaar.
- Assistentietechnologie en volledige toetsenbord-only tabnavigatie zijn niet geautomatiseerd beoordeeld. SHIFT heeft een zichtbare actieve toestand en `aria-pressed`; toetsen hebben Nederlandstalige labels.
- `=` wordt als formule-invoer naar MathLive gestuurd. De bestaande T5a-parser ondersteunt geen vergelijkingsvergelijkingen, dus dit teken zelf is geen berekencommando.
- `sin(30 deg)` kan volgens de bestaande T5a binary64-uitkomst `≈0,5` tonen. Dit toetsenbord wijzigt de bestaande benaderingssemantiek niet.

**Voorlopig advies:** neem B mee naar een gebruikerstest naast A. B sluit beter aan op de WIE-huisstijl en de gevraagde compacte dagelijkse keypad. Houd A beschikbaar als referentie en voor MathLive’s bredere standaard symbolenaanbod. Deze POC is geen productie-integratieadvies.
