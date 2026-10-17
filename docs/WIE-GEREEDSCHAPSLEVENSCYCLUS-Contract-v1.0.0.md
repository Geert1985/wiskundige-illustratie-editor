# WIE — Uniform gereedschapslevenscyclus — Ontwerpcontract v1.0.0

**Status:** Ontwerpvoorstel ter goedkeuring  
**Datum:** 17 oktober 2026  
**Basis:** `WIE-AUDIT-GEREEDSCHAPSLEVENSCYCLUS.md`, onderzochte main `e0b157fce4a17368016982193cdf9d5f0f04f911`  
**Scope:** UX- en controllercontract; geen implementatie of wijziging van geometrische algoritmen.

## 1. Besluit en doel

**Besluit A:** bestaand hoofdonderscheid behouden. Vrije creatie (inclusief Lengtemaat en Tekst) is herhaalbaar; gekoppelde constructie is eenmalig. Directe contextacties en inspectoreigenschappen bewaren de voorafgaande toolmodus. Selecteren is de standaardmodus.

Doel: uniforme afhandeling van succes, fouten, annulering, selectie, tijdelijke invoer, instructies en toolwissel zonder nieuwe mutatie- of history-engine.

## 2. Begrippen

- **Tool:** blijvende gebruikersmodus (`tool`), bijvoorbeeld `line` of `construct:midpoint`.
- **Interactie:** tijdelijke meerstapstoestand (`interaction`) met bronnen, preview, pointer, numerieke invoer.
- **Actie:** directe context-/inspectorbewerking zonder noodzakelijk actieve constructietool.
- **Commit:** geautoriseerde documentmutatie via bestaande command-/historygrens.
- **Succes:** het bedoelde commando is daadwerkelijk aanvaard en afgerond; geen stil ingeslikte fout. Het aantal nieuw gemaakte objecten is niet universeel de succesmaat (eigenschapswijzigingen kunnen nul nieuwe objecten maken).
- **Voltooiing:** succesvolle afsluiting van één interactie; niet noodzakelijk beëindiging van de tool.

## 3. Normatieve lifecyclepolicy

| Policy | Betekenis | Gereedschappen/ingangen |
|---|---|---|
| `repeat` | Na geslaagde interactie nieuwe invoer mogelijk met dezelfde tool | `point`, `line`, `straight`, `ray`, `vector`, `circle`, `triangle`, `polygon`, `angle`, `rightAngle`, `dimension`, `text` |
| `single` | Na geslaagde interactie terug naar `select` | Alle 25 zichtbare `construct:*`-tools in de audit; ook nieuwe gekoppelde constructies tenzij contract anders bepaalt |
| `preserve` | Geen wijziging van voorafgaande toolmodus | Directe `context-complete`-acties, inspectoracties en eigenschapscommando's |

`select` blijft `select` en is geen creatietool. Context-`prefill` en `placement` starten een echte constructietool en vallen bij voltooiing onder `single`. Programmatische legacyrecepten vormen geen zelfstandige UI-tools en krijgen geen nieuwe zichtbaarheid door dit contract.

## 4. Statusovergangen

| Gebeurtenis | Verwachte overgang | Selectie/invoer |
|---|---|---|
| Tool kiezen | Annuleer oude onvoltooide interactie; activeer gekozen toegestane tool | Ruim preview en tijdelijke bronnen op; synchroniseer instructie |
| Geldige tussenstap | Tool en interactie blijven actief | Bewaar geldige bronnen en invoer |
| Geslaagde `repeat`-commit | Interactie naar idle, tool ongewijzigd | Ruim preview/capture/RAF op; nieuwe actie mogelijk |
| Geslaagde `single`-commit | Interactie naar idle, tool naar `select` | Bewaar relevante nieuw gemaakte selectie volgens bestaande UX; synchroniseer instructie |
| Geslaagde `preserve`-actie | Voorafgaande tool ongewijzigd | Actie ruimt alleen eigen tijdelijke toestand op |
| Corrigeerbare invoerfout | Geen completion en geen toolreset | Bewaar bruikbare bronnen, toon specifieke fout |
| Commandoweigering/fout | Geen succesmelding en geen succesreset | Geen half gecommitte document; herstel invoer waar veilig |
| Bronnen verdwenen/rechten vervallen | Ongeldige interactie veilig annuleren | Tool blijft standaard actief tenzij rechten op tool zelf vervallen; dan veilige selectiemodus |
| Esc bij bovenliggende UI | Sluit eerst relevante dialoog/menu | Tool niet automatisch verlaten |
| Esc op canvas zonder blokkerende UI | Annuleer interactie en keer terug naar `select` | Instructies en selectie synchroniseren |
| Blur/pointercancel | Bestaande veilige annulering respecteren | Niet impliciet tool beëindigen |

**Selectiebehoud:** de bestaande intentie van de Snijpunt-flow (nieuwe snijpunten selecteren) mag niet verloren gaan door een uniforme reset. Selectieregels per commandotype blijven expliciet en worden getest.

## 5. Resultaatcontract van documentacties

De huidige `changeDocument()` slikt exceptions in, waardoor een aanroeper soms succes meldt na een mislukte mutatie. Maak een expliciete resultaatgrens, bijvoorbeeld:

```js
{ ok: true, value: commandResult }
{ ok: false, error: normalizedError }
```

Een exception mag nooit worden vertaald naar `ok: true`. De lifecycle-handler krijgt pas een `success`-event na bevestigde commit. Valideer succes per commandotype, niet uitsluitend via `created.length > 0`. Houd bestaande permission-, history- en transactionsemantiek intact. Vermijd een tweede `execute()`-pad of dubbele commit.

## 6. Centrale controllergrens

Ontwerp een enkele controllerfunctie of -module met conceptuele operaties:

- `activateTool(toolId, origin)`
- `completeInteraction({toolId, origin, outcome, selection})`
- `cancelInteraction({reason, scope})`
- `finishDirectAction({outcome, previousTool})`

Dit zijn **conceptuele API-namen**, geen verplichte exports of bestaande functies. De implementatie mag aansluiten op `setTool()`, `cancel()` en `changeDocument()` om regressierisico te beperken.

Bij succes: bevestig commit; beëindig tijdelijke interactie; release pointercapture waar van toepassing; annuleer verouderde preview-/RAF-werkzaamheden; wis tijdelijke numerieke waarden en bronselecties; pas policy toe; werk instructies/status/toolbar bij; herstel of behoud relevante selectie. Deze volgorde moet transactioneel veilig zijn en mag geen reeds gecommitte mutatie terugdraaien.

## 7. Speciale adapters

- **Snijpunt:** universele dispatcher, mogelijke meerdere nieuwe punten, bronambiguïteit, behoud nieuwe selectie en `intersectionCompleted`-semantiek.
- **Punt op object:** bronselectie en geometrische plaatsing met tolerantie; pas na geslaagde commit `single`.
- **Ellips:** Q-plaatsing en mogelijk gecombineerde creatie van Q en ellips in één commandotransactie.
- **Parallellogram:** numerieke velden, preview en bevestiging; ongeldige invoer houdt plaatsing open.
- **Context-complete:** uitvoer zonder activatie van een tool; behoud voorafgaande modus; rapporteer werkelijk resultaat.
- **Tekst:** sluit editor pas op een punt waarop foutafhandeling geen stil verlies van invoer veroorzaakt; `repeat` na succes.

Adapters beheren stappen en geometriespecifieke invoer, maar definiëren niet zelfstandig een afwijkende succes-/annuleerpolicy.

## 8. Invarianten

1. Een mislukte documentmutatie mag nooit een succesmelding of succesgedreven toolreset veroorzaken.
2. Een voltooide `repeat`-actie behoudt dezelfde tool en laat geen actieve preview/capture achter.
3. Een voltooide `single`-actie eindigt in `select`, met gesynchroniseerde instructie en toolbar.
4. Een `preserve`-actie verandert de tool niet, ook wanneer de actie vanuit een andere tool gestart werd.
5. Geen onvoltooide geometrie of onbedoelde history-entry na annulering.
6. PermissionRuntime en bestaande commandvalidatie blijven gezaghebbend.
7. Herhaalde voltooiing of dubbele pointer-events mogen geen dubbele commit veroorzaken.
8. Nieuwe tools moeten expliciet in de policycatalogus worden opgenomen; ontbrekende configuratie wordt in ontwikkeling/test als fout gemeld, niet stil geraden.

## 9. Implementatiestrategie in kleine stappen

**Fase L0 — Contract en testmatrix:** inventaris bevriezen, lifecycle-verwachtingen vastleggen; nog geen productcode.  
**Fase L1 — Betrouwbaar commandresultaat:** herstel de foutsignaalgrens van `changeDocument()` en de getroffen aanroepers; test commandweigering en herstel.  
**Fase L2 — Centrale completion:** voeg policyregister en gemeenschappelijke success-/cleanup-route toe; migreer eerst één vrije tool en één generieke constructie.  
**Fase L3 — Speciale routes:** Snijpunt, Punt op object, Ellips, Parallellogram, Tekst en context-complete; behoud hun specifieke stappen.  
**Fase L4 — Esc en consistentie:** harmoniseer UI-prioriteit, instructies, tijdelijke waarden en selectie.  
**Fase L5 — Gerichte regressie en acceptatie:** kleine Node-/controllerproeven plus beperkte browserproeven; geen volledige Edge-run als standaardvereiste.

Elke fase krijgt een aparte review en acceptatie; geen ongevraagde merge naar `main`.

## 10. Minimale acceptatiematrix

| Scenario | Verwachting |
|---|---|
| Twee opeenvolgende vrije lijnstukken | Beide gemaakt; `line` blijft actief |
| Driehoek via vrije tool | Na derde geldig punt `triangle` actief |
| Middenpunt via canvas | Na commit `select` |
| Middenpunt via directe contextactie vanuit andere tool | Vorige tool behouden |
| Snijpunt met meerdere resultaten | Eén succesvolle transactie; `select`; nieuwe punten selecteerbaar |
| Geen geldig snijpunt | Geen completion; bronherstel volgens bestaande flow |
| Punt op object met ongeldige plaatsing | Geen object; tool en plaatsing actief |
| Foutinjectie Punt op object/Ellips/Parallellogram | Geen succesmelding, geen succesreset, geen gedeeltelijke mutatie |
| Ongeldige parallellogramwaarde | Geen commit; plaatsing behouden |
| Esc tijdens constructie | Geen half object; `select`; correcte instructie |
| Esc met teksteditor open | Eerst dialoog sluiten; tool blijft `text` |
| Commandweigering na tekstvalidatie | Invoer niet stil verliezen |
| Toolwissel tijdens preview | Vorige preview weg, nieuwe tool actief |
| Pointercancel/blur | Veilig annuleren zonder onverwachte toolreset |
| Geen rechten voor constructie | Geen ongeautoriseerde commit of valse succesmelding |

## 11. Buiten scope

Geen verandering aan geometrische recepten, objectmodellen, rechtenbeleid, snijpuntalgoritmen, renderingarchitectuur of volledige UI-herinrichting. Geen algemene instelling voor herhaalbaarheid (optie C is uitdrukkelijk niet gekozen).

## 12. Open implementatiedetails

De exacte selectie na een gewone constructie, het herstelmodel voor onherstelbare commandfouten en de technische API-signaturen worden bij L1/L2 op basis van de actuele broncode uitgewerkt. Ze mogen niet stilzwijgend tot gewijzigd gebruikersgedrag leiden.

**Goedkeuringsvoorwaarde:** eerst dit contract bevestigen, daarna L1 afzonderlijk voorbereiden en uitvoeren.
