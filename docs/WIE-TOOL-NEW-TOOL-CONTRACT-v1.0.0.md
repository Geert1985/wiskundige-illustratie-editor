# WIE — Contract voor nieuwe gereedschappen v1.0.0

**Status:** actuele ontwikkelreferentie  
**Datum:** 17 oktober 2026  
**Scope:** toevoegen van een UI-gereedschap aan de bestaande editorarchitectuur; geen nieuwe dispatcher of commandlaag.

Dit contract beschrijft de huidige werking van WIE. De zichtbare toolknoppen in `editor.html` leveren metadata aan `ToolCatalog` (`tool-catalog.js`). `EditorApp` (`editor.js`) beheert de bestaande interactiehandlers, annulering en `completeToolInteraction()`. Commands, autorisatie en history blijven bij de bestaande command-/runtime-/modelgrenzen. Een adapternaam in de catalogus beschrijft een route; hij dispatcht die route niet.

## 1. Verplichte registratie

1. Kies een stabiel, uniek `data-tool`-ID. Gebruik de bestaande ID-conventie en verander bestaande ID's niet als onderdeel van een nieuwe tool.
2. Plaats de knop in de bestaande categorie/subcategorie van `editor.html`, met label, presentatie en de bestaande toegankelijke bediening.
3. Declareer `data-lifecycle="repeat"` of `data-lifecycle="single"` op dezelfde knop. `repeat` laat het gereedschap na geslaagde canvascreatie actief; `single` keert na geslaagde canvascreatie terug naar `select`.
4. Declareer een van de bestaande adapters: `point`, `draw`, `polygon`, `construction`, `placement` of `text`. Dit is gecontroleerde metadata voor de bestaande handlerfamilie, geen generieke dispatchopdracht.
5. De catalogus leidt de huidige `commandToolId`-mapping af en controleert stabiele tool-/command-ID's, lifecycleenum, adapterenum, implementatiestatus, dubbele ID's, navigatiemodi en interactieve metadata op geplande placeholders. `commandToolId` is een autorisatiemapping; het is niet noodzakelijk de commandoperatie die de route uitvoert.
6. Voeg geen tweede ID-, lifecycle- of adapterlijst toe. Niet-creatieve modi (`select`, `pan`, `zoomIn`, `zoomOut`) horen niet in het creatieregister. Geplande placeholders krijgen geen interactieve toolmetadata.

## 2. Interactie en bronnen

Implementeer de nieuwe interactie in de passende bestaande `EditorApp`-handler(s) en domeinservice(s). Beschrijf en test:

- hoe de tool wordt gestart en welke rechten/bronbeschikbaarheid vóór aanbod en uitvoering worden gecontroleerd;
- welke bronrollen, parameters en tussenstappen nodig zijn;
- waar tijdelijke interactiestatus wordt bewaard;
- hoe preview, pointercapture en eventuele animation-framewerkzaamheden worden beheerd;
- welk invoerprobleem herstelbaar is en welke status de gebruiker dan kan corrigeren.

Gebruik voor geometrische broncontracten en contextual plans de bestaande `ConstructionService` (`construction-service.js`), voor snijpuntselectie de bestaande `IntersectionDispatcher`, en voor tekst de bestaande tekstservices. Voeg geen parallelle model-, geometrie-, permissie- of geschiedenisbron toe.

## 3. Command, resultaat en history

1. Valideer invoer en geometrie voordat de commit plaatsvindt. Een preview of tussenstap is geen documentcreatie.
2. Voer de bestaande geautoriseerde commandoperatie uit. De command-/runtimegrens blijft verantwoordelijk voor autorisatie, payloadvalidatie, atomiciteit en resultaat.
3. Geef de definitieve commanduitkomst door vóór lifecyclecompletion. In de gebruikelijke synchrone editorroute retourneert `changeDocument()` `{ok, result, error}` en callers completeren uitsluitend wanneer `ok` waar is.
4. Laat documentmutaties via de bestaande historygrens lopen. Annulering, mislukte validatie en geweigerde commands mogen geen gecommitte gedeeltelijke geometrie of lege history-entry opleveren.
5. Selecteer het juiste resultaat. Een command dat meerdere objecten oplevert, kan al die IDs in één completion/selectiestap doorgeven. Test ook de bestaande undo/redo-semantiek.
6. Bestaande-objectbewerking, verwijderen, hernoemen of een eigenschapswijziging is niet automatisch een nieuwe creatie en krijgt alleen creatiecompletion als de feitelijke route een nieuwe interactie voltooit.

## 4. Completion

Roep `completeToolInteraction({toolId, outcome, origin, selection})` alleen aan nadat de bedoelde command is geaccepteerd en afgerond. De centrale functie weigert onbekende origins, niet-succesvolle outcomes, onbekende tools en ongeldige policies.

- Voor `origin: 'canvas'` ruimt de centrale grens de actieve interactie, capture, preview en feedback op, synchroniseert de resultaatselectie en past de geregistreerde policy toe. `single` keert terug naar `select`; `repeat` blijft actief.
- Voor `origin: 'context-complete'` wordt de zelfstandige contextactie afgerond en kan resultaatselectie/status worden bijgewerkt, terwijl de actieve tool en onafhankelijke interactie behouden blijven.
- Context-`prefill` start de gewone canvasinteractie. Het voltooit dus pas na de latere geslaagde canvascommand.
- `preserve` is geen lifecyclewaarde in `ToolCatalog`; directe bewerkingen die de actieve tool behouden zijn geen reden om een derde cataloguspolicy in te voeren.

Houd route-eigen geometrie, bronkeuze en timing in de bestaande handler. Voer completion niet uit bij elke tussenstap of alleen omdat een handler is aangeroepen. Bewaak één completion per geaccepteerde gebruikersactie via de bestaande status-/callbackflow; voeg geen algemene generation-token- of idempotencylaag toe zonder afzonderlijk aangetoond probleem en besluit.

## 5. Fouten, retry en annulering

- Ongeldige maar herstelbare invoer houdt de benodigde interactiestatus actief en bereikt geen completion.
- Geometrisch onmogelijke invoer en commandweigering maken geen vals succes. Behoud bruikbare invoer voor retry waar de bestaande route dat veilig doet.
- Escape volgt de bestaande prioriteitsvolgorde in `EditorApp.keyDown()`: eerst eigenaar van editor/paneel/dialog/menu; daarna annuleert Escape op canvas de actieve interactie en keert terug naar `select`.
- Toolwissel loopt via `setTool()`, sluit relevante dialogs en force-cleant de vorige interactie zonder completion.
- Documentreset en documentvervanging gebruiken de bestaande cleanup-/resetroutes.
- `pointercancel`, `lostpointercapture` en window `blur` zijn onderbrekingen en mogen geen succesvolle completion veroorzaken. De huidige handlers annuleren de bijbehorende interactie; verifieer per nieuwe route of tijdelijke preview/status eveneens wordt opgeruimd.
- Teksteditor sluiten is annulering wanneer er geen nieuwe tekst gecommit is. Bewerken van bestaande tekst mag geen creatiecompletion uitvoeren.

## 6. Verplichte tests

Breid bestaande tests uit met kleine, routegerichte gevallen. Test minimaal:

- catalogusregistratie, unieke ID, lifecycle en bekende adapter;
- één geldige creatie: command, centrale completion, policy, resultaatselectie en history;
- ongeldige invoer, commandfout/weigering en herstelbare retry zonder vals succes;
- annulering vóór voltooiing zonder documentmutatie of history-entry;
- undo/redo voor de voltooide commit;
- contextactie/-prefill wanneer de tool dat ondersteunt.

Voeg conditioneel toe:

- alle resultaten en selectie bij multi-output;
- bronrollen, permissies en runtimebeperkingen bij afhankelijke constructies;
- numerieke invoer, preview, bevestiging en gedeeltelijk succes bij plaatsing;
- bestaande versus nieuwe tekst, concurrerende submit en late callback bij asynchrone voorbereiding;
- pointercapture-, `pointercancel`-, `lostpointercapture`- en `blur`-cases bij pointerinteracties.

Gebruik alleen uitgevoerde, gerichte testcommando's als bewijs. Node-fixtures bewijzen geen browserfocus, native dialogvolgorde of fysieke pointercapture.

## 7. Checklist per nieuw gereedschap

### Verplicht

- [ ] Uniek, stabiel ID en knop in `editor.html`.
- [ ] Correct `repeat`/`single`-beleid en bestaande adaptermetadata.
- [ ] Geen duplicaatregister; `ToolCatalog` accepteert de registratie.
- [ ] Bestaande handler/service, bronnen en rechten vóór aanbieden én uitvoeren gecontroleerd.
- [ ] Definitieve commanduitkomst vóór centrale completion; fout/annulering voltooit niet.
- [ ] Resultaatselectie, history en undo/redo gecontroleerd.
- [ ] Gerichte succes-, fout/retry- en canceltests uitgevoerd.
- [ ] Roadmap en implementatierapport noemen branch/commit, echte testcommando's en open bewijsgrenzen.

### Alleen indien van toepassing

- [ ] Contextplan (`complete`, `prefill` of `placement`) en behoud van onafhankelijke interactiestatus.
- [ ] Meerdere resultaatobjecten en atomaire selectie.
- [ ] Gespecialiseerde bronrollen, runtime-/permissiebeperkingen of constructierecept.
- [ ] Meerstapsinvoer, numerieke parameters, preview en herstel van ongeldige waarden.
- [ ] Async-preflight, dubbele submit en callback na annulering/toolwissel.
- [ ] Browserverificatie voor native dialogs, focus, pointercapture of fullscreen toetsenbordgedrag.

## 8. Bewijsgrens

De centrale Node-/handlercontracten kunnen gericht worden getest zonder een volledige Edge-run. De aparte L4-browserverificatie is vereist voor browserafhankelijke acceptatie: native dialogvolgorde, browserfocus, fysieke pointercapture, fullscreen-Escape en werkelijke tekstsubeditor-events. Behandel deze punten als open zolang die beperkte browsercontrole niet is uitgevoerd.
