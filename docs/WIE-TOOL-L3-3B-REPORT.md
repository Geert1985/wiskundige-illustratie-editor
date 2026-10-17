# WIE-TOOL-L3.3b — Centrale lifecycle voor de ellipsconstructie

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l3-3b-ellipse-lifecycle`.
Basis: actuele `origin/main` commit `47d0f93feeb1d165ec4ada4d41c13cfbf7a4aaed`, met L3.3a via merge PR #37.

## Resultaat

De gewone canvasroute voor `construct:ellipseByFociAndPoint` roept na een geslaagde `construction.create` nu `completeToolInteraction()` aan met de geregistreerde `single`-policy. Die controller beëindigt de interactie, geeft pointercapture vrij, wist preview en feedback, bewaart de expliciete ellipsselectie en activeert Selecteren. Bij een ongeldige positie of commandofout vindt geen completion plaats. Geometrie, Q-preview, commandoformaat, recept en bronvolgorde zijn niet gewijzigd.

## Bestaande callflow en commitgrens

De gewone canvasroute loopt via `pointerDown()` naar `constructionClick()`:

1. De eerste twee geldige puntselecties worden opgeslagen als de brandpunten. Er is nog geen documentmutatie of lifecycle-completion.
2. Na het tweede brandpunt zet `constructionClick()` `ellipsePlacement` aan. `ellipsePlacementPreview()` zoekt optioneel een bestaand punt Q met de bestaande point-picker; anders gebruikt zij de pointerpositie als tijdelijke Q. `MI.EllipseGeometry.resolve()` bepaalt geldigheid en preview. Pointerbeweging wijzigt alleen interactie-/renderpreviewstaat.
3. De bevestigingsklik valideert Q opnieuw. Een ongeldige geometrie toont de bestaande foutmelding, houdt de bronselectie en plaatsingsinteractie beschikbaar en voert geen documentcommando uit.
4. Een geldige klik verstuurt één `construction.create`-commando binnen één `changeDocument(..., {cancelInteraction:false})`.
5. Pas bij `outcome.ok` wordt de centrale completion met tool-ID `construct:ellipseByFociAndPoint` aangeroepen. Policy `single` zet de tool terug naar `select`.

Een nieuw Q wordt in dat ene commando als kandidaatpunt toegevoegd en de ellips wordt vervolgens met beide brandpunten en dat punt geconstrueerd. Als de gebruiker een bestaand Q kiest, bevat hetzelfde commando de drie bestaande bronreferenties en wordt alleen de ellips aangemaakt. De route selecteert in beide gevallen uitsluitend de ellips; een nieuw Q wordt niet aan de selectie toegevoegd.

### Atomiciteitsbewijs

Dit is situatie A: één bestaande atomaire commandotransactie. `PermissionRuntime.authorizeCommand()` bouwt op `newKernel()` een kandidaatmodel. De Q-tak voegt Q aan die kandidaat toe en construeert daarna de ellips. Alleen wanneer de hele autorisatie en constructie slagen, geeft de functie de kandidaat terug. `AuthorCommands.execute()` publiceert dan pas het kandidaatmodel op het document; `RuntimeSession.#apply()` doet hetzelfde voor runtimegebruik en registreert de enkele historystap bij commit. Een exception tijdens de ellipsconstructie publiceert de kandidaat met Q dus niet. `changeDocument()` maakt geen aparte transactie of rollbackmechanisme.

De gerichte fouttest injecteert een fout in `Engine.construct()` nadat `Engine.add()` Q aan het kandidaatmodel heeft toegevoegd. Het document en de history blijven ongewijzigd; er verschijnt geen Q of ellips. Dezelfde bronselectie en plaatsingsinteractie blijven beschikbaar voor retry. Dit test de daadwerkelijke interne foutgrens van het ene geautoriseerde commando, niet alleen een fout vóór uitvoering.

## Fouten, annulering, selectie en afhankelijkheden

- **Brandpuntselectie:** blijft een tijdelijke canvasinteractie; er ontstaat geen completion vóór bevestiging.
- **Ongeldige Q:** preview wordt als ongeldig getoond; geen `construction.create`, documentwijziging, historystap of completion. De positie kan opnieuw worden gekozen.
- **Commandofout na kandidaat-Q:** kandidaat wordt verworpen; geen gedeeltelijke creatie, succesmelding of toolreset. Pointercapture wordt vrijgegeven en de invoer blijft herstelbaar. Retry maakt één ellips en, indien nodig, één Q.
- **Bestaand Q:** alleen een geldige bestaande puntreferentie wordt als derde bron gebruikt; de ellips blijft van die puntbron afhankelijk.
- **Afhankelijkheden:** de ellipsbronlijst bevat beide brandpunten en Q. Gerichte tests verplaatsen zowel een brandpunt als Q en controleren dat de ellips opnieuw wordt berekend.
- **Selectie en historie:** alleen de ellips is geselecteerd. Aanmaak levert één history-entry op; undo verwijdert de volledige constructie en redo herstelt objecten en bronreferenties.
- **Esc:** vóór commit gebruikt de bestaande `cancel()`/toetsenbordroute. Zij wist de tijdelijke interactie en preview, geeft capture vrij en maakt geen objecten/historystap.
- **Contextuele invoer:** ellipsbronplannen met `prefill` vervolgen via dezelfde `constructionClick()`-plaatsingsroute en delen dus deze centrale completion. Een directe contextactie met planmodus `complete` volgt de algemene `startContextConstruction()`-route; de centrale toolcompletion wordt daar bewust niet aangeroepen en de voorafgaande toolmodus blijft behouden. Voor de ellips is in deze wijziging geen aparte directe context-completevariant toegevoegd.

## Gewijzigde bestanden

- `editor.js`: succesvolle ellipsplaatsing delegeert cleanup, selectie en `single`-toolreset aan `completeToolInteraction()`; foutpad houdt expliciete veilige pointerrelease en retry-interactie.
- `tests/lifecycle.test.cjs`: nieuwe tests voor nieuwe/bestaande Q, preview, centrale completion, selectie, dynamische bronafhankelijkheden, undo/redo, ongeldige Q, Esc en een fout na kandidaat-Q-creatie plus retry.
- `docs/WIE-TOOL-L3-3B-REPORT.md`: dit verslag.
- `docs/DEVELOPMENT-ROADMAP.md`: branchstatus bijgewerkt.

## Gerichte verificatie

Uitgevoerd:

```powershell
node --test --test-reporter=spec --test-name-pattern='WIE-TOOL-L3\.3b|WIE-TOOL-L3\.3a|WIE-TOOL-L3\.2 generic|WIE-TOOL-L2 canvas midpoint|WIE-TOOL-L2 Snijpunt|WIE-TOOL-L1 ellipseByFociAndPoint' tests/lifecycle.test.cjs
node --check editor.js
node --check tests/lifecycle.test.cjs
git diff --check
```

De geselecteerde lifecycle-run slaagde met **12/12 tests**. Beide syntaxchecks en `git diff --check` slagen. De selectie bevatte L3.3b, L3.3a, generieke L3.2, L2-Middenpunt/Snijpunt en de bestaande L1-ellips-fout/retrycontrole. Geen volledige Node-suite, Edge-run of browserregressiesuite uitgevoerd.

## Beoordeling

**GO voor L3.3b binnen de onderzochte canvas- en commandogrenzen.** De centrale completion volgt aantoonbaar alleen na succesvolle commit; beide Q-modi, afhankelijke herberekening, selectie, history, invalidatie, fout/retry en Esc zijn gericht getest. De implementatie voegt geen tweede transactie- of lifecyclelaag toe.

Resterend verificatierisico: echte browser-eventvolgorde, visuele preview en native pointercapture zijn niet opnieuw in Edge gecontroleerd, conform opdracht. De specifieke failure-injection test gebruikt de bestaande gesimuleerde DOM-fixture, maar faalt binnen de echte candidate-commanduitvoering.

Status bij oplevering wordt bijgewerkt met commit- en pushresultaat; deze fase merge’t niet naar `main` en start L3.3c niet.
