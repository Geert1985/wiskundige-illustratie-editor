# M6b — Uitgebreide driehoekconstructies

**Rapportversie:** 1.0.0  
**Branch:** `codex/g-tri1-triangle-from-points`  
**Basis:** gepushte G-TRI1-branch; documentversie 7 en `constructionSchema: 2` behouden  
**Status:** geïmplementeerd en getest; wacht op handmatige gebruikersacceptatie. Niet gemerged naar `main`.

## Implementatie

M6b voegt vier getypeerde recepten met één bestaande `triangle`-bron toe aan de huidige `ConstructionService`:

| Tool-ID | Resultaat | Constructie |
|---|---|---|
| `construct:incenter` | `point` | Incentrum, gewogen met de lengten van de overstaande zijden |
| `construct:incircle` | `circle` | Middelpunt en straal van de ingeschreven cirkel |
| `construct:eulerLine` | `straight` | Rechte door circumcentrum en orthocentrum |
| `construct:ninePointCircle` | `circle` | Cirkel met middelpunt halverwege circumcentrum en orthocentrum |

De gereedschappen staan onder **Gereedschappen → Constructies → Driehoekconstructies**. De M6b-placeholdergroep is verwijderd en de vier werkende gereedschappen staan direct in de bestaande driehoeksubgroep. De gedeelde toolcatalogus exposeert ze ook in de fullscreen-gereedschapskiezer. Bronselectie, dependency-resolver, command-, permissie-, history-, renderer- en exportpaden blijven de bestaande architectuur gebruiken. M6a en G-TRI1 zijn niet vervangen.

## Wiskundige en numerieke keuzes

Alle constructies eisen dezelfde `triangle`-rol: een polygon met precies drie vertices. De berekening gebruikt lokale genormaliseerde coördinaten ten opzichte van A. `s` is de langste zijde, `u=(B−A)/s`, `v=(C−A)/s` en `q=cross(u,v)`. De bestaande relatieve M6a-grens geldt ongewijzigd: `|q| <= 1e-12` geeft degeneratie.

Noem de genormaliseerde zijden tegenover respectievelijk A, B en C `a=|v−u|`, `b=|v|` en `c=|u|`. Het lokale incentrum is `(b·u+c·v)/(a+b+c)` en de inradius is `s·|q|/(a+b+c)`. De implementatie controleert dat de afstanden van het incentrum tot de drie zijden overeenkomen met de berekende inradius binnen `128·Number.EPSILON` op genormaliseerde waarden.

Voor de Eulerrechte worden O en H met de bestaande M6a-formules in hetzelfde lokale frame berekend. Als `|H−O| <= 128·Number.EPSILON·max(1,|O|,|H|)`, is de richting op binary64-precisie niet bepaalbaar en retourneert de constructie `UNDEFINED_EULER_LINE`. Dit omvat de gelijkzijdige driehoek, waar de Eulerrechte niet uniek is. De negenpuntscirkel gebruikt lokaal `(O+H)/2` als middelpunt en `|O|/2` als straal; de berekende afstanden tot de drie zijmiddens dienen als invariantcontrole met dezelfde 128-ULP-schaaltolerantie.

Niet-eindige uitkomsten en cirkelstralen die naar nul onderlopen worden afgewezen als `NON_FINITE_RESULT`. De bestaande absolute coördinatenlimiet `1e12` blijft gelden via de gewone evaluator. Een ongeldig G-TRI1-bronobject maakt downstream constructies tijdelijk `SOURCE_INVALID`; herstel van de drie punten herstelt dezelfde resultaatobjecten en IDs. Een rechtstreeks aangeboden, structureel geldige maar geometrisch ontaarde driehoek geeft `DEGENERATE_TRIANGLE`.

## Opslag, compatibiliteit en permissies

De nieuwe recepten vallen onder constructionSchema 2. Documentversie 7, objecttypen, bestaande constructierecepten en schema’s worden niet verhoogd of gewijzigd. Recepten bewaren alleen hun bestaande `{objectId}`-driehoekreferentie; geometrie wordt opnieuw uit de huidige bron berekend. Import en semantic replay gebruiken de gewone recipe- en bronvalidatie, zodat onbekende of ongeldige constructies niet stilzwijgend worden losgekoppeld. Restricted sessies gebruiken dezelfde toegestane tool- en bronrechten als andere constructies.

## Tests en resultaten

| Uitvoering | Resultaat |
|---|---|
| `node --test tests/*.test.cjs` | **599 geslaagd, 0 mislukt, 0 overgeslagen** |
| Gerichte M6b Edge-run (`M6B_ONLY=1`) | Exit 0; alle vier tool-ID’s en berekende referenties; dynamische geschiedenis; degeneratie/JSON-herstel; SVG en offline PNG; gelijkzijdige Euler-uitzondering; `pageErrors: []` |
| Volledige Edge-suite (`node tests/browser.cjs`) | Exit 0; Edge **155 headless**; `pageErrors: []`; suite bevat fullscreen-, permissie-, editor-, import/export- en nieuwe M6b-integratiecontroles |

De onafhankelijke 3-4-5-referentiedriehoek gaf I=(1,1), r=1, O=(2,1.5), H=(0,0), negenpuntsmiddelpunt=(1,0.75) en negenpuntsstraal=1.25. Node-tests controleren aanvullend de schema-/JSON-roundtrip, G-TRI1-afhankelijkheid, behoud van IDs, `1e-12`-grens, equilateral ambiguity, coordinate-limit/underflow, semantische replay, beperkte bronrechten en gelijktijdig gebruik van de drie M6a-centra. Edge controleert canvasbronselectie, undo/redo, degeneratie en herstel na JSON-roundtrip en beide exportformaten.

De Edge-runner geeft geen algemeen assertiontotaal af. Daarom rapporteert dit document de letterlijke runneruitkomst (exitcode, browserbuild en page-errorlijst), zonder een niet-bestaand totaalaantal tests te suggereren.

## Gewijzigde bestanden

- `construction-service.js`
- `editor-tool-instructions.js`
- `editor.js`
- `editor.html`
- `tests/triangle-m6b.test.cjs`
- `tests/browser-triangle-m6b.cjs`
- `tests/browser.cjs`
- `tests/tool-panel-reorganization.test.cjs`
- `tests/browser-tool-panel-reorganization.cjs`
- `docs/M6B-REPORT.md`

## Beperkingen en handmatige acceptatie

Bijna-gelijkzijdige driehoeken waarvan O en H op de gekozen binary64-tolerantie samenvallen, krijgen eveneens `UNDEFINED_EULER_LINE`; dat voorkomt een instabiele willekeurige richting. Handmatig te accepteren zijn de bediening en labels in de toolgroep, het uiterlijk en de eigenschappen van de twee cirkels en rechte, en het herstelgedrag in de interactieve editor. Deze handmatige acceptatie is niet door de geautomatiseerde suite afgevinkt.
