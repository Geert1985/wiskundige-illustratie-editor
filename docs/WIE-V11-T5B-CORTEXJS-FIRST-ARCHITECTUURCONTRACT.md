# WIE v1.1.0 — MathLive + CortexJS-first architectuurcontract

- **Contract-ID:** WIE-V11-T5B-CX
- **Documentversie:** 0.3.0
- **Datum:** 18 oktober 2026
- **Status:** **ONTWERPVOORSTEL — gekozen doelrichting, technische haalbaarheid en productie-GO nog niet bewezen**
- **Repository:** Geert1985/wiskundige-illustratie-editor
- **Branch voor ontwerp/review:** chore/v11-cortexjs-first-architecture (afgetakt van actuele remote develop)
- **Productbesluit:** Optie B — MathLive als wiskundige invoer en CortexJS Compute Engine als **beoogde enige productierekenengine** voor WIE, inclusief wetenschappelijk rekenen én symbolische algebra.
- **Releasegrens:** Opname in WIE v1.1.0 is afhankelijk van afzonderlijke haalbaarheids-, ontwerp-, implementatie- en release-GO's.
- **Bestaande referentie:** T5a blijft ongewijzigd en bruikbaar zolang CortexJS niet aantoonbaar alle benodigde productiegarranties heeft overgenomen. Geen voortijdige verwijdering of automatische fallback.
- **Bewijsbasis:** MathLive/CortexJS POC-3 op test/t5b-mathlive-poc @ 644da423a8d8a692fff32dbe26c20779d3d3194f. Volgens POC-rapport 41/41 gerichte mocktests geslaagd; geen echte WIE-ExpressionSources-integratie en geen browser-smoketest.

## 1. Waarom dit contract v0.3.0?

De producteigenaar wil **symbolische algebra ook in WIE zelf** en wil WIE niet afhankelijk maken van een mogelijke toekomstige zelfstandige WAT-applicatie. Daarom is op 18 oktober 2026 expliciet **optie B** gekozen: onderzoeken en voorbereiden van **één centrale CortexJS-rekenengine** achter een MathLive-interface, in plaats van permanent T5a en CortexJS als twee onafhankelijke productie-evaluators te onderhouden.

Dit is een gewijzigd architectuur- en productdoel ten opzichte van:
- het eerdere hybride T5a-first-contractvoorstel v0.2.0 (alleen buiten de repository opgesteld);
- docs/WIE-V1.1.0-ROADMAP-VOORSTEL.md v0.2.0 (roadmapvariant B: twee releasewerkstromen, niet hetzelfde als *rekenengine-optie B*);
- docs/WIE-T5b-UX-Contract-v1.0.2.md en delen van docs/DEVELOPMENT-ROADMAP.md / AGENTS.md die T5a als enige productierekenroute voorschrijven;
- docs/WIE-TXT-FORM-DYNAMISCHE-FORMULES-CONTRACT.md v1.3.0 dat geavanceerde algebra eerder aan WAT voorbehield.

**Conflictregel:** dit document registreert een **nieuwe gekozen doelrichting**, maar herziet de bovengenoemde normatieve documenten **niet stilzwijgend**. Codex moet tegenstrijdigheden inventariseren en concrete noodzakelijke wijzigingen voorstellen. Daadwerkelijke harmonisatie volgt uitsluitend na aparte goedkeuring. Roadmapvariant B als releaseplanning blijft bestaan totdat afzonderlijk herzien.

## 2. Doelarchitectuur

```text
WIE hoofdinterface ──┐
                     ├─> gedeelde MathLive-formule-invoer / typed bindings
WIE teksteditor ─────┘                   |
                              begrensde MathJSON / AST-validatie
                                          |
                              WIE-integratie-/veiligheidslaag
                              - allowlist en complexiteitsquota
                              - echte WIE-bronautorisatie
                              - immutable geautoriseerde snapshot
                              - broninstantie, documentrevisie, epoch
                              - eenheden, dimensies, hoeken
                              - resultaat- en lifecycleguard
                                          |
                              CortexJS Compute Engine
                              - numeriek en symbolisch
                              - exact / benaderd
                              - gecontroleerde CAS-operaties
                                          |
                              WIE-presentatie en exportgrens
```

**WIE beheert de geometrische en documentwaarheid; CortexJS beheert uitsluitend de gevalideerde wiskundige evaluatie.** De aanwezigheid van CortexJS verleent geen lees- of schrijfrechten op WIE-objecten. Bron- en beleidscontrole bevinden zich **buiten** de engine, in een te ontwerpen en te reviewen WIE-hostadapter.

Geen nieuwe geometrie-engine, geen parallelle documentopslag en geen direct onbeveiligd `resolveSource()`-kanaal in de UI of CortexJS.

### 2.1 T5a tijdens de migratie

- **Huidige productie:** T5a/ExpressionAST/ExpressionEngine en de bestaande WIE ExpressionSources-façades blijven verantwoordelijk voor alle bestaande gebruikersroutes.
- **Onderzoeksfase:** CortexJS draait alleen geïsoleerd of in afzonderlijk geautoriseerde testharnassen, zonder productiebronnen bloot te stellen.
- **Vergelijkingsfase:** de engines kunnen in **tests** op dezelfde gecontroleerde fixtures worden vergeleken; geen twee concurrerende waarheden in de UI, geen stilzwijgende runtime-fallback.
- **Omschakelfase:** een apart go/no-go-besluit bepaalt of een productroute op CortexJS wordt overgezet. T5a wordt pas vervangen/verwijderd na aangetoonde gelijkwaardigheid voor die route en expliciete regressie- en releaseacceptatie.
- Een tijdelijke technische coexistence tijdens migratie is toegestaan, maar **niet** het gewenste permanente architectuurmodel.

## 3. Functionele doelmogelijkheden

### 3.1 Wetenschappelijke calculator

MathLive-toetsenbord en tekstinvoer, gebruikelijke operatoren, machten, wortels, goniometrie, DEG/RAD, getypeerde eenheden, numerieke resultaten, correcte afronding en kopiëren. Eén gedeelde calculatorcore met dunne hosts in WIE en in de teksteditor; in de eerste fase uitsluitend vluchtige sessiestaat.

### 3.2 Symbolische functionaliteit binnen WIE

Beoogde afzonderlijk af te bakenen operaties:
- symbolisch vereenvoudigen, bijvoorbeeld `3x + 2x → 5x`;
- factoriseren, bijvoorbeeld `x² − 9 → (x − 3)(x + 3)`;
- uitwerken, substitueren en exacte algebraïsche expressies evalueren;
- vergelijkingen oplossen waar de gekozen domein- en oplossingssemantiek dit toelaat.

Dit zijn **functionele doelen, geen reeds bewezen CortexJS-API-claims of releasebeloftes**. Elke bewerking vraagt een bewezen allowlist, definitie van reëel/complex domein, aannames, exacte versus numerieke oplossingsstatus, begrensde compute-budgetten en onafhankelijke verificatie. Geen onbegrensde CAS-workspace of didactische termdrag/drop zonder een apart ontwerpbesluit.

### 3.3 Relatie met WAT / TXT-FORM

WIE moet zijn calculator en basis-symbolische algebra **zelfstandig** kunnen aanbieden, ook als WAT nooit gebouwd wordt. WAT kan later een uitgebreidere aparte applicatie worden, maar is geen dependency.

TXT-FORM behoudt zijn eigen gecontroleerde geometrische formule-/meetwaardetraject. Dit contract autoriseert **geen** nieuwe persistente inline-CAS-schema's, documentversie, rich-text-workspace of automatische formulepersistentie. De bestaande statische formuletab blijft intact.

## 4. Productieve geometrische bronbinding is een aparte veiligheidsgrens

De POC bouwde structurele MathJSON-binding, dimensieanalyse en een publicatieguard tegen `MockGeometrySources`. Dat **bewijst niet** dat de productie-ExpressionSources- en RuntimeSession-autorisatie werkt met CortexJS.

De bestaande `expression-sources.js` biedt geautoriseerde `createAuthor(engine)` en `createRestricted(session)` met `evaluate(ast)`, geen veilige publieke `resolveSource()`-dienst voor een externe evaluator. De restricted route gebruikt `RuntimeSession.getExpressionSource()`, bronrechten, documentrevisie en `permissionEpoch`.

Een nieuwe geautoriseerde hostadapter voor CortexJS is daarom **een ontwerp- en beveiligingsopdracht, geen directe API-koppeling**.

Minimumcontract:
1. Bronreferenties ontstaan uitsluitend uit een **expliciete geautoriseerde selectie**; zichtbare labels of een getypte `r` zijn nooit bronidentiteiten.
2. De parser/adapter accepteert een strikt beperkt en versieerbaar structureel MathJSON-/AST-contract, met bron- en functieallowlists, begrensde diepte, hoeveelheid, evaluatiekosten en uitvoertijd waar technisch afdwingbaar.
3. Alle relevante bronnen en hun werkelijke rechten worden gecontroleerd **vóór** evaluatie, en relevante revisies, source-identity en rechten worden **opnieuw** gecontroleerd **vóór publicatie**.
4. CortexJS krijgt uitsluitend een immutable en geautoriseerde momentopname van noodzakelijke **getypeerde waarden**; geen `RuntimeSession`, geen kernelobject, geen bronprovider met brede opzoekrechten en geen ongefilterde document-JSON.
5. Autorisatie voor author en restricted moet overeenkomen met de bestaande WIE-capabilities, inclusief verborgen/ongeldige bronnen, beleidswissel en disposed sessions.
6. Bronverwijdering, undo/redo, ID-hergebruik, herladen, documentwissel en permissionwijzigingen maken oude bindings ongeldig of vereisen expliciete herselectie; geen stille binding naar een nieuwe instantie met dezelfde ID.
7. De publicatieguard gebruikt formule-/requestgeneraties, documentrevisie en permission epoch; de nieuwste geldige aanvraag wint. Een oud of ingetrokken resultaat is onmiddellijk niet zichtbaar/kopieerbaar.
8. Geen ongeautoriseerde ID, label, waarde of beleidsreden in DOM, ARIA, klembord, logs, debug-uitvoer of export; restricted fouten zijn generiek.
9. Geen bronwaarde mag worden geëvalueerd of gepubliceerd op grond van uitsluitend POC-mockmetadata.
10. Productie-API-uitbreidingen worden vooraf afzonderlijk ontworpen en gereviewd. Een façade die veilig T5a-AST evalueert mag **niet** zonder bewijs worden vervangen door een onbegrensde waarde-resolver.

**Open kernvraag:** ontwerp het kleinste veilige hostcontract dat CortexJS als evaluator gebruikt zonder WIE's author/restricted-grens te omzeilen; vergelijk een streng geautoriseerde typed-snapshotservice met een andere even smalle, expliciet geverifieerde brug. Geen keuze vooraf als al bewezen presenteren.

## 5. Wiskundige semantiek en equivalentie

T5a blijft tot vervanging de referentie voor:
- operatorprecedentie, unair min, functies/arity en domeinfouten;
- eenheden, fysieke versus abstracte/dimensieloze dimensies, samengestelde eenheden, schaalfactoren en `scale²` bij oppervlakte;
- lengtes in canonieke meters, hoeken in radialen, privé DEG/RAD versus expliciete eenheidsliteral;
- bronproperties zoals lengte, straal, omtrek, oppervlakte, hoek en coördinaten;
- Nederlandse decimale komma, cosmetische nullen, `≈` versus `=`, exactheid en meetprecisie;
- numerieke grensgevallen, singulariteiten, niet-eindige resultaten en quota.

**Geen automatische semantische gelijkwaardigheid** aannemen. Leg een expliciete migratie-/conformantiematrix op met actuele T5a-features en negatieve tests. Een verschil wordt geclassificeerd als correct gewenste uitbreiding, incompatibiliteit of blocker, vóórdat de productiecode omschakelt.

Symbolische uitdrukkingen met onbekende variabelen mogen zonder bewezen dimensie niet als geldige brongebonden grootheid worden aangemerkt. Rekenregels rond exacte algebra en gemeten geometrische waarden moeten apart herkenbaar zijn.

## 6. Hosts, resultaatcontract en lifecycle

- Eén gedeelde MathLive/CortexJS-calculatorcore, twee dunne UI-hosts (algemene WIE-balk en teksteditor), volgens het bestaande T5b-UX-contract voor focus, responsiviteit, toetsen en Escape.
- Evaluatiestatus onderscheidt minstens: invoer ongeldig, bron niet beschikbaar, niet geautoriseerd (zonder detaillek), bezig, verouderd, actueel en berekening mislukt.
- Presentatie onderscheiden: invoerexpressie, geautoriseerde bronbinding, exacte algebraïsche vorm, numerieke benadering, dimensie, eenheid, bronkwaliteit en kopieerbaarheid.
- Rekenactie is **document- en history-neutraal**; geen verborgen rich-text-/modelmutatie. Permanente tekst wordt alleen via een bestaande expliciet geautoriseerde teksttransactie geplaatst.
- Kopiëren controleert de actuele publicatie-/rechtenstatus; uitsluitend geautoriseerde zichtbare tekst via `text/plain`.
- Echte Edge/browser-smoke is een aparte acceptatie-eis: MathLive-keyboard, focus, typwerk, bronchips, mobiel, fullscreen/Escape en clipboard.

## 7. Dependencies en prestaties

- POC-versies waren MathLive `0.111.1` en CortexJS Compute Engine `0.156.0` in een geïsoleerde npm-omgeving. **Niet automatisch vaststellen als definitieve productieversies**.
- Productie-inpassing vereist expliciete pinning, lockfile, lokale assets/fonts/keyboard, statische/offline werking, script/module-integratie, CSP, licenties/transitieve notices en fail-safe laden.
- CortexJS-complexiteit moet gecontroleerd worden bij input en evaluatie; controleer compute-budget, limieten en noodzaak van timeboxing of isolatie vóór onbetrouwbare gebruikersinvoer.
- Geen performanceclaims uit een mocktest of uit niet-gelopen browsersuites afleiden.

## 8. Migratieplan en vrijgavepoorten

| Poort | Opdracht | Toegestaan |
|---|---|---|
| **CX-0** | Read-only haalbaarheids- en veiligheidsaudit voor **CortexJS als enige doelengine**, met werkelijke huidige `develop` en POC-3 | **Volgende opdracht; geen codewijzigingen** |
| **CX-1** | Na aparte GO: geïsoleerde **echte** author/restricted-hostadapterproef tegen WIE-runtime, met veilige getypeerde snapshots en mini-tests | Nog geen GO |
| **CX-2** | Na aparte GO: T5a↔CortexJS-conformantiematrix (eenheden, hoeken, functies, numerieke en dimensiesemantiek) en CAS-scope/proeven | Nog geen GO |
| **CX-3** | Na aparte GO: gedeelde calculatorcore, officiële dependencies en UI-hosts, met gerichte echte autorisatie-/browserproeven | Nog geen GO |
| **CX-4** | Na bewezen equivalentie en afzonderlijke goedkeuring: gecontroleerde omschakeling van bestaande T5a-routes; later eventuele verwijdering T5a | Nog geen GO |
| **R1** | Beperkte releaseacceptatie met aparte v1.1.0-scope- en releasebeslissing | Nog geen GO |

**Voorgaande opdracht V11-C1.2 MathLive→T5a-adapter:** **gepauzeerd** door het nieuwe productbesluit. Niet uitvoeren zonder een nieuw expliciet besluit. Het POC-3-werk blijft intact op de testbranch.

## 9. Auditmatrix voor CX-0

CX-0 moet minimaal elk punt kwalificeren als **BEWEZEN**, **GEDEELTELIJK**, **ONBEWEZEN** of **BLOKKEREND**, met exact codebewijs en kleinste vervolgstap:

| ID | Onderwerp |
|---|---|
| CXA-01 | MathLive → structureel MathJSON zonder ongewenste semantiekverschuiving |
| CXA-02 | MathJSON-operatorallowlist, bronbinding, limieten en injection-/spoofingafweer |
| CXA-03 | Reële author- en restricted-autorisatie voor een CortexJS-hostadapter |
| CXA-04 | Immutable getypeerde snapshots zonder brede source-/kerneltoegang |
| CXA-05 | Documentrevision, permission epoch, broninstantie en ID-hergebruik |
| CXA-06 | UI-invalidering, requestvolgorde en veiliger kopiëren |
| CXA-07 | SI, abstracte eenheden, dimensies en samengestelde eenheden |
| CXA-08 | Hoeken, DEG/RAD, goniometrie en bronhoeken |
| CXA-09 | Numerieke/parsing-/foutsemantiek versus T5a |
| CXA-10 | Symbolisch vereenvoudigen, factoriseren, oplossen: gevalideerde scope |
| CXA-11 | Exactheid, meetprecisie, formattering en Nederlandse locale |
| CXA-12 | Offline distributie, dependencies, CSP en licenties |
| CXA-13 | Kosten-/tijdlimieten en robuuste verwerking van onbetrouwbare invoer |
| CXA-14 | Twee hosts, tekst-/documentschema, export en geschiedenis |
| CXA-15 | Verificatieplan: mocktests versus echte WIE-tests versus browser |
| CXA-16 | Roadmap/AGENTS/T5b/TXT-FORM-conflicten en concreet harmonisatievoorstel |

## 10. Architectuur- en roadmapbesluiten die nog openstaan

1. **Productie-autorisatiecontract** voor CortexJS is niet vastgesteld; géén code-GO.
2. Exacte symbolische CAS-functies en releasefasering: WIE wil deze functionaliteit uiteindelijk zelf aanbieden, maar geen impliciete toezegging voor alles binnen v1.1.0.
3. Scopeverschil met bestaande roadmap: de eerdere beperking "geen algemene symbolische algebra in WIE v1.1.0" en T5a-only-evaluatorvereisten moeten later **expliciet** worden herzien. Dit contract is daarvoor de onderbouwde wijzigingsaanvraag, geen stille supersessie.
4. T5a-verwijdering vereist aparte gelijkwaardigheid, tests en afwikkeling van alle bestaande gebruikerspaden.
5. De tijdelijke onderzoeksbranch en POC-code worden niet rechtstreeks naar `develop` of `main` gemerged.

## 11. Test- en uitvoeringsbeleid

- CX-0 is **read-only**. Geen productiecode-, roadmap-, AGENTS-, document- of schemawijzigingen, geen test- of dependency-installatie als dat de werkboom wijzigt.
- Alleen relevante korte verificaties indien echt nodig; **geen volledige Node-/Edge-run**. Browserstatus en historische testdata afzonderlijk melden.
- Houd eventuele bestaande gestagede wijzigingen in lokale checkouts onaangeroerd. Raadpleeg actuele remote `develop`, niet automatisch verouderde lokale `origin/develop`.
- Na CX-0 eerst contractreview met producteigenaar. Pas dan een aparte kleine Codex-implementatieopdracht voor CX-1.

## 12. Versiebeheer en referenties

| Versie | Datum | Betekenis |
|---|---|---|
| v0.1.0 | 2026-10-18 | Eerdere hybride ontwerprichtlijn |
| v0.2.0 | 2026-10-18 | T5a-first als eerste productieroute, CortexJS slechts optioneel |
| **v0.3.0** | **2026-10-18** | **Nieuw productbesluit: MathLive + CortexJS-first, één doelengine, T5a tijdelijk als referentie/fallback tijdens migratie** |

Referenties:
- [WIE v1.1.0 roadmapvoorstel](WIE-V1.1.0-ROADMAP-VOORSTEL.md)
- [Algemene ontwikkelroadmap](DEVELOPMENT-ROADMAP.md)
- [T5b UX-contract](WIE-T5b-UX-Contract-v1.0.2.md)
- [TXT-FORM-contract](WIE-TXT-FORM-DYNAMISCHE-FORMULES-CONTRACT.md)
- [Repository-instructies](../AGENTS.md)
- [POC-3-rapport op de testbranch](https://github.com/Geert1985/wiskundige-illustratie-editor/blob/644da423a8d8a692fff32dbe26c20779d3d3194f/docs/T5B-MATHLIVE-POC-3-REPORT.md)

**Dit contract autoriseert uitsluitend de read-only CX-0-audit. Er is geen productiecode-, schema-, roadmapupdate-, merge- of release-GO.**
