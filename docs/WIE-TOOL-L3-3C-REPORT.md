# WIE-TOOL-L3.3c — Centrale lifecycle voor Parallellogram

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l3-3c-parallelogram-lifecycle`.
Basis: actuele `origin/main` mergecommit `3dadfe0` (PR #38), met L3.3b inbegrepen.

## Resultaat en callflow

De canvasroute voor `construct:parallelogramBySideAngle` gebruikt na een geslaagde constructie de bestaande `completeToolInteraction()` met policy `single`. De controller bewaart de gemaakte polygonselectie, beëindigt de plaatsingsinteractie, geeft pointercapture vrij, wist preview en feedback en schakelt naar Selecteren. Ongeldige parameters en een geweigerd `construction.create`-commando voltooien de interactie niet.

De gewone invoer loopt als volgt:

1. De canvasadapter selecteert twee puntbronnen. Na de tweede bron wordt tijdelijke `parallelogramPlacement`-toestand aangemaakt, met de bestaande standaardlengte, hoek, eenheidsinstellingen en preview.
2. Canvasbewegingen berekenen positie, snap, hoek, zijde en optionele `matchAB`-keuze in interactiestaat. Numerieke `input`-events zetten `numericPinned`, converteren de lengte volgens de bestaande schaal en de hoek volgens documenteenheden, en verversen dezelfde preview. Geen van deze tussenstappen voert een documentcommando uit.
3. Canvasbevestiging of de bevestigingsknop roept `commitParallelogramPlacement()` aan. Die functie berekent de preview opnieuw en vereist `reasonCode === 'VALID'`. Dezelfde geldigheidscontrole geldt ook bij numerieke bevestiging; een ongeldige lengte/hoek houdt de interactie open.
4. Na geldige invoer wordt één `construction.create`-commando uitgevoerd met bron-ID's, zijde, gerichte hoek en optioneel `sideLengthMode:'matchAB'`. Dit is de verplichte mutatie die de parallellogramconstructie maakt.
5. De bestaande optionele bronhernoeming probeert daarna nul, één of twee `object.setProperties`-commando's uit te voeren. Een exception wordt afzonderlijk vastgelegd; zij maakt de al gecommitte constructie niet ongedaan en opent geen duplicerende retry.
6. Als het constructiecommando slaagt, ontvangt de centrale controller de policy-tool-ID, het commandresultaat en de bestaande selectie-ID's. Een optionele hernoemfout wordt via `successMessage` als expliciete status getoond. Daardoor schrijft de controller rechtstreeks de relevante waarschuwing zonder eerst een generieke succesmelding te tonen.

De geometrische berekening blijft in `ConstructionService.parallelogramPreview()`/de bestaande constructieservice en het geregistreerde `parallelogramBySideAngle`-recept. Geen geometrie-, parameter-, permissie- of schemaregel is aangepast.

## Mutatie- en historygrenzen

De constructie zelf is één geautoriseerd `construction.create`-commando en heeft daarmee een eigen kandidaat-/commandogrens. Bronhernoeming is geen onderdeel van dat commando: elk bronpunt krijgt zo nodig een apart `object.setProperties`-commando. `changeDocument()` is hier een synchrone historywrapper, geen rollbacktransactie over die commando's.

- **Lokale `EditorHistory`:** `commitParallelogramPlacement()` legt één snapshot vóór de callback vast en registreert na afloop één snapshot. Een geldige constructie plus eventuele gedeeltelijke hernoeming vormt daarom één undo-stap, ook al waren het meerdere commandocommits. Undo herstelt zowel de bronnamen als de documenttoestand; redo herstelt precies de vastgelegde eindtoestand.
- **`RuntimeHistory`:** `capture()` leest alleen de documentrevisie en `record()` doet niets. `RuntimeSession.#apply()` registreert elke gewijzigde opdracht afzonderlijk. Daardoor zijn de constructie en eventuele gewijzigde bronhernoemingen afzonderlijke runtime-undo-stappen. Bij een fout op de tweede naamopdracht kan de geschiedenis dus de constructie en de eerste hernoeming als twee stappen bevatten. Er wordt geen enkelvoudige transactie geclaimd.
- **Hernoemvoorwaarden:** alleen generieke puntnamen worden naar A en B hernoemd; bestaande naamconflicten of ontbrekende `object.setProperties`-rechten slaan de optionele actie via de bestaande prechecks over. Een exception tijdens uitvoering wordt opgevangen. De constructie blijft geldig; als niet beide namen konden worden bijgewerkt, meldt de UI expliciet: “Parallellogram toegevoegd; bronpunten konden niet allemaal worden hernoemd.” Er is geen automatische verwijdering of retry.

Dit behoudt de bestaande scheiding tussen verplichte geometrie en optionele naamgeving zonder een transactielaag toe te voegen. De naamcommando's blijven afzonderlijke mutaties en de runtime kan daarom een gedeeltelijke optionele hernoeming tonen in zijn stap-voor-stap history.

## Fout-, selectie- en annuleringsgedrag

- Bronselectie en parameterwijziging veroorzaken geen lifecycle-completion of documentmutatie.
- Ongeldige numerieke invoer toont de bestaande ongeldige preview; de definitieve commit wordt geweigerd en invoer blijft bewerkbaar.
- Commandweigering toont de commandofout, laat tool, bronnen en numerieke waarden in de plaatsingsinteractie staan, geeft pointercapture vrij en veroorzaakt geen historymutatie/completion. Retry na herstel maakt één parallellogram.
- Een fout in een optioneel naamcommando is geen mislukte constructie: de bestaande vorm blijft geselecteerd, de centrale lifecycle sluit af en de waarschuwing benoemt dat de bronnamen niet allemaal zijn bijgewerkt.
- Succes selecteert alleen de aangemaakte parallellogramvorm. De vorm blijft afhankelijk van dezelfde twee bronpunten en van de bestaande parameters. Verplaatsen van een bronpunt herberekent de vorm.
- Esc vóór commit gebruikt de bestaande annuleringsroute: tijdelijke interactie en preview verdwijnen, capture wordt vrijgegeven en er blijft geen document- of historymutatie achter.

## Gewijzigde bestanden

- `editor.js`: succesvolle Parallellogram-afronding migreert naar centrale completion; `completeToolInteraction()` accepteert een optionele statusoverride zodat de bronhernoemwaarschuwing niet door de generieke successtatus wordt overschreven.
- `tests/lifecycle.test.cjs`: gerichte lifecycle-, preview-/parameter-, invalidatie-, commandofout/retry-, Esc-, selectie-, afhankelijkheids-, undo/redo- en gedeeltelijke hernoemtests; de bestaande L1-waarschuwingstest volgt de explicietere tekst.
- `docs/WIE-TOOL-L3-3C-REPORT.md`: dit verslag.
- `docs/DEVELOPMENT-ROADMAP.md`: L3.3c-branchstatus.

## Gerichte verificatie

Uitgevoerd:

```powershell
node --test --test-reporter=spec --test-name-pattern='WIE-TOOL-L3\.3c|WIE-TOOL-L3\.3b|WIE-TOOL-L3\.3a|WIE-TOOL-L3\.2 generic|WIE-TOOL-L1 (parallelogramBySideAngle|optional source naming)|WIE-TOOL-L3\.1 free point' tests/lifecycle.test.cjs
node --check editor.js
node --check tests/lifecycle.test.cjs
git diff --check
```

De geselecteerde lifecycle-run slaagde met **17/17 tests** (inclusief de nieuwe L3.3c-tests en regressiecontroles voor L3.3b, L3.3a, L3.2 en de vrije `repeat`-tool). De twee syntaxchecks en whitespacecontrole slagen. Geen volledige Node-suite, Edge-run, browserregressiesuite of prestatietest uitgevoerd.

## Beoordeling

**GO voor L3.3c binnen de onderzochte canvas- en bestaande command-/historygrenzen.** De verplichte constructie wordt centraal afgerond na een aanvaard commandresultaat. Commandofouten en ongeldige invoer veroorzaken geen completion. Optionele hernoeming is expliciet onderscheiden en getest bij gedeeltelijk succes. Lokale en runtime-history hebben verschillende stapgrenzen; die worden hierboven feitelijk vermeld.

Resterend risico: echte browser-eventvolgorde, DOM-disable-state van de bevestigingsknop en native pointercapture zijn niet met Edge gevalideerd, conform opdracht. Runtime-history is bronmatig gecontroleerd; de lifecyclefixture gebruikt lokale `EditorHistory` voor de gedeeltelijke-hernoemtest.

Commit- en pushstatus worden bij oplevering in dit verslag ingevuld. Er wordt niet naar `main` gemerged en L3.4 wordt niet gestart.
