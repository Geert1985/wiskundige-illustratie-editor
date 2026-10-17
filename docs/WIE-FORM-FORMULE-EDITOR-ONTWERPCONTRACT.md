# WIE-FORM — Formule-editor als gedeelde werkruimte

**Ontwerp- en architectuurcontract v1.0.0 — 17 oktober 2026**  
**Status:** productrichting door gebruiker bevestigd; documentatieconcept, nog geen technische ontwerpacceptatie of implementatie-GO.  
**Repository:** `Geert1985/wiskundige-illustratie-editor`  
**Gerelateerde contracten:** [TXT-FORM](WIE-TXT-FORM-DYNAMISCHE-FORMULES-CONTRACT.md) · [WIE-ALG](WIE-ALG-INTERACTIEVE-ALGEBRA-ONTWERPCONTRACT.md) · [Teksteditorarchitectuur](TEXT-EDITOR-ARCHITECTURE.md) · [Roadmap](DEVELOPMENT-ROADMAP.md).

## 1. Expliciet productbesluit

**WIE-FORM is een afzonderlijke, volwaardige Formule-editor/-werkruimte binnen de bestaande Wiskundige Illustratie Editor.** Geen tweede externe applicatie, los project of gekopieerde formule-engine. Dezelfde Formule-editor wordt vanuit verschillende contexten gestart, vergelijkbaar met de beoogde gedeelde wetenschappelijke rekenmachine:

1. **Vanuit de Wiskundige Teksteditor:** nieuwe formule opstellen, bestaande formule openen/bewerken, resultaat of afleiding invoegen/terugschrijven.
2. **Als zelfstandige WIE-werkruimte:** formules samenstellen en later uitgebreide vergelijkingen/afleidingen onderzoeken, zonder dat de gebruiker eerst tekst hoeft te maken.
3. **Vanuit een geometrisch object of een dynamisch meetveld:** de bijbehorende formule openen, met geautoriseerde geometrische bron- en rolreferenties.

Deze drie **toegangspaden delen dezelfde formulewerkruimte, representatie, presentatie en veiligheidsregels**, niet drie editors met eigen waarheid. De gekozen productrichting is definitief als ontwerpvoorkeur; concrete vensterplaatsing, knoppen en technische implementatie moeten in FORM.0 worden gevalideerd.

## 2. Verantwoordelijkheidsverdeling

| Deel | Eigen verantwoordelijkheid | Geen verantwoordelijkheid |
|---|---|---|
| **WIE-FORM** | Centrale UI/werkruimte voor formule-invoer en -bewerking, structureel navigeren, wiskundige opmaak, interactie met formulemodel, previews en terugkeerworkflow | Geen zelfstandige CAS, geen tweede rekenmotor, geen verborgen geometrische mutatie |
| **TXT-FORM** | Gekoppelde geometrische meetwaarde als numeriek resultaat, symbolische formule of gecontroleerde uitwerking; bron-/rolbinding, naamgeving, dimensies | Geen eigen afzonderlijke visuele formule-engine, geen algebraïsche transformaties |
| **WIE-ALG** | Toekomstige transformatie-engine en interactieve ALG-UI **bovenop WIE-FORM**: structurele selectie, meerdere termen, herschrijven, drag/drop, didactische stappen, regels en verificatie | Geen tweede Formule-editor of ongecontroleerde algebra→geometrie-koppeling |
| **Bestaande WIE-teksteditor** | Documenttekst, rich-text-inlinevelden, opmaak, alinea's, plaatsing, host-commit, geschiedenis en export | Geen duplicatie van WIE-FORM of van wiskundige verificatie |
| **Bestaande T5a-/meet-/constructiediensten** | Beschikbare numerieke berekeningen, eenheden, getypeerde bronrechten, geometrische afhankelijkheden | Geen impliciete symbolische CAS/algemene equation solver |

**Belangrijk:** gebruikersinvoer en *rendering* delen een canonieke betekenis. De bestaande `MathSource`/LaTeX is slechts een veilige presentatienotatie; de huidige `ExpressionAST` is een numerieke reken-AST en nog **geen** symbolisch bewijs-/herschrijfmodel.

## 3. Functionele UX-werkruimten

### 3.1 Eigen formulewerkruimte

- Een compacte maar schaalbare formule-editor met eigen werktitel, formulecanvas, formulesymbolen-/bouwstenenpalet, selectietool, contextacties en resultaat-/previewgedeelte.
- In WIE als afzonderlijke werkruimte, desgewenst schermvullend. Geïntegreerd met bestaand WIE-donkerblauw/goud, responsiviteit, fullscreenbeleid, focusafhandeling en toetsenbordbediening.
- Vanuit de teksteditor opent dezelfde editor **met de geselecteerde formule**. Terugkeer naar de oorspronkelijke tekstcursor-/fragmentpositie is deterministisch; geen verliezen van rijke opmaak, lopende edits of bronbindingsmetadata.
- Vanuit geometrie opent dezelfde editor met het corresponderende formule-/bronrecept; de originele object-ID en toegewezen zijderollen blijven behouden.
- Eén commando `Formule invoegen` of `Bewerking toepassen` afhankelijk van context, expliciet sluiten/annuleren en duidelijke bronstatus. Exacte schermindeling is nog een wireframebesluit, geen productcode-instructie.

### 3.2 Invoer, presentatie en opmaak

- BASIS: getallen, letters/variabelen, Griekse symbolen, functies, operatoren, haakjes, breuken, wortels, indices, exponenten, vergelijkingen en wiskundige uitlijning.
- UITBREIDBAAR: matrix- en stelselnotatie, integralen/sommen, meervoudige regels, verwijzingen naar dynamische geometrische grootheden; werkelijke ondersteunde invoer wordt per fase vastgelegd.
- Toetsenbord en palet zijn equivalente invoerpaden, beide canoniseren naar dezelfde gevalideerde structuur. Geplakte LaTeX krijgt geen uitvoerbaarheid of betrouwbare semantiek zonder expliciete parse, controle en eventuele migratie.
- Render- en exportlaag hergebruiken waar correct de bestaande `MathSource`, `MathFragments` en rich-text-/SVG-/PNG-contracten. Niet alle toekomstige wiskundige notatie wordt bij voorbaat als ondersteund beschouwd.

### 3.3 Toekomstige WIE-ALG-modus

WIE-ALG opent **binnen dezelfde WIE-FORM-werkruimte**, niet in een tweede algebra-app. Dan kunnen naast de formule-editor contextueel verschijnen: structurele selectie, multi-selectie, drag-doelmarkeringen, geldige transformatieopties, wiskundige voorwaarden, een afleidingsgeschiedenis en een didactische uitlegmodus. De complexe regel-, oplossingsset- en bewijsengine komt uitsluitend in ALG-fasen, niet in de basis-FORM-UI.

## 4. Start- en terugkeercontract

| Startcontext | Invoer bij openen | Toegestane toepassing |
|---|---|---|
| **Teksteditor: nieuwe formule** | Leeg of geselecteerde invoegsuggestie + vastgelegde rich-text-bookmark | Eén nieuwe inline/blockformule of reeks afleidingsstappen in de huidige teksteditorsessie |
| **Teksteditor: bestaande formule** | Geselecteerd getypeerd formulefragment en editorhistory-context | Vervangt alleen het juiste fragment; behoudt omliggende content/opmaak |
| **WIE als werkruimte** | Nieuw wiskundig werkblad of bewust geselecteerde formule | Bewaart werkblad met nog te ontwerpen opslagcontract of expliciet invoegen in WIE-document |
| **Geometrisch object** | Bron-ID, toegestane eigenschap, geldige semantische rolverwijzingen en actuele view | Lezen, herschrijven of gericht terugplaatsen van formulepresentatie; **geen** geometrische writeback |

**Sessieregels:**
1. Openen creëert een **tijdelijke formulewerksessie** met vastgelegde origin, bron-/documentrevisie en permission epoch. Er is geen impliciete documentmutatie.
2. Live-preview mag alleen met geautoriseerde snapshots werken; wijzigingen in rechten/bron/revisie maken de oude preview onbruikbaar en vereisen hercontrole.
3. `Toepassen` kiest expliciet de doelactie: **insert**, **replace**, **return expression** of later **insert derivation**. De host valideert en commit één atomaire actie met bijbehorende Undo/Redo.
4. `Annuleren`/Escape/heropenen mag geen in-flight transacties, geschiedenisstappen, ongewenste tekst- of geometrische wijzigingen achterlaten. Hostverwijzingen worden correct vrijgegeven.
5. Bestaande teksteditor heeft zijn eigen lokale rich-text-history; formule-editor kan een **eigen tijdelijke bewerkgeschiedenis** hebben. Alleen bevestigde resultaten gaan in de oorspronkelijke host-geschiedenis. Undo/Redo en focus mogen niet concurreren.
6. Geen autosave van tijdelijke formulegegevens naar een document zonder expliciete productspecificatie; documentbewaring van een zelfstandige formulewerkruimte krijgt een eigen schema-/UX-contract.

## 5. Canoniek formulemodel en gedeelde services

**Doel is één semantisch gevalideerde representatie van formules,** herbruikbaar door TXT-FORM, WIE-FORM en uiteindelijk WIE-ALG. Formulepresentatie wordt niet de enige bron van waarheid. Besluit echter **pas na de FORM.0/TXT-FORM.0-preflight** of de eerste fase al een beperkte structurele representatie nodig heeft, dan wel hoe bestaande `math`- en `dynamicValue`-atomen compatibel behouden blijven.

Logische verantwoordelijkheid, geen vooraf verplichte bestandsindeling:
- `FormulaModel`: getypeerde operators, operandstructuur, symbolen, bronrollen en versievaste identiteit waar toepasselijk.
- `FormulaWorkspaceController`: gedeelde editorbediening en origin-aware sessie.
- `FormulaPresentation`: gevalideerde typesetting/preview en toegankelijke alternatieve tekst.
- `FormulaHostAdapter`: autorisatie en gecontroleerde hand-off naar rich text, geometrische formule of afzonderlijke WIE-werkruimte.
- Toekomstige `WIE-ALG` transformatie- en verifierdiensten bovenop/naast het formele model.

Geen tweede `MeasurementUnits`, `ExpressionEngine`, `ConstructionService`, exporter of autorisatiesysteem. Maak het verschil tussen **functieformule** en **vergelijking**, **exact** en **benaderend**, **getypeerde symbolische variabele** en **geometrische alias**, **statistische voorstelling** en **mathematische waarheid** zichtbaar.

## 6. Veiligheid, compatibiliteit en kwaliteit

- Berekenbaarheid, toegankelijkheid, bronrechten, documentrevision/permission epoch en read-only-versus-write-grenzen blijven bij de bestaande sessie-/engine-architectuur.
- De editor mag nooit verborgen/geblokkeerde geometrische data via preview, autocomplete, foutmelding, rendercache, kopiëren of export onthullen.
- Oude `math`-inlinefragmenten en `dynamicValue`, legacy `textBinding`, T1–T5-tekstschema's en bestaande bronverwijzingen blijven functioneel. Nieuw model wordt niet stilzwijgend over oude vrije LaTeX heen geschreven.
- Geen nieuwe persistente documentvelden, versies of typewijzigingen zonder apart afgeronde ontwerp-/migratiegate, atomaire import en volledige JSON-/SVG-/PNG-roundtrip.
- Inclusieve UX: toetsenbordtoegankelijke structurele navigatie, focus, label van symbolen, duidelijke beperkingen in plaats van schijnbare maar niet werkende opties.
- Relevante Node-/Edge-/browser-tests en handmatige tests verplicht bij de implementatie, inclusief fullscreen, copy/paste, undo/redo, restricted source, wijzigen van bronwaarden en cancelled edits.

## 7. Fasering

| Fase | Output | Status |
|---|---|---|
| **FORM.0** | **Read-only preflight + UX/architectuurcontract:** inventariseer huidige tekst- en formule-invoer, bestaande math/dynamicValue/AST, T5b-integratiepatroon, workflows, document- en permissiegrenzen; wireframes, schemaopties, eerste verticale slice | ontwerpvoorbereiding, geen code-GO |
| **FORM.1** | Eén centrale formulewerkruimte met invoer-/previewbasis en veilig openen uit WIE + teksteditor, terugplaatsen/bewerken zonder verlies van data; beperkte ondersteunde notatie | gepland, afzonderlijke goedkeuring |
| **FORM.2** | Geometrische formule-toegang, dynamische TXT-FORM-presentaties, gedeelde rolreferenties; uitbreiding notaties en formule-UX | gepland, afzonderlijke goedkeuring |
| **FORM.3** | Voorbereiding/inpassing structurele selectie en WIE-ALG-UI in dezelfde werkruimte; **geen** automatische CAS-scope | gereserveerd |
| **ALG.0–ALG.4** | Afzonderlijke semantische algebra-/verificatie-/drag-/didactische fasen volgens [ALG-contract](WIE-ALG-INTERACTIEVE-ALGEBRA-ONTWERPCONTRACT.md) | toekomstig, aparte gates |

**Afhankelijkheden:** FORM.0 en TXT-FORM.0 moeten elkaar informeren over de kleinste compatibele gegevensrepresentatie; hun read-only audits kunnen gecoördineerd/parallel gebeuren. De simpele TXT-FORM-numerieke weergave wordt **niet kunstmatig geblokkeerd** door de toekomstige standalone FORM.1-UI. WIE-ALG implementeert geen tweede formulewerkruimte en vereist vooraf gevalideerde symbolische structuur.

## 8. Expliciet buiten scope van dit besluit

- Geen zelfstandige extern geïnstalleerde app of tweede repository.
- Geen onmiddellijke vervanging van de bestaande teksteditor en diens huidig formule-invoerpaneel.
- Geen CAS, algebra-oplosser, versleepbare termen, uitgebreide matrixengine of plots als onderdeel van FORM.1.
- Geen impliciete algebra→geometrie-terugkoppeling; indien gewenst later eigen constraint-/permission-contract.
- Geen productiecode, nieuwe tools, menus of documentversies als gevolg van **alleen deze documentatie**.

## 9. Goedkeurings- en verificatiepoorten

Dit is een **goedgekeurde productrichting**, geen afgesloten gedetailleerd implementatiecontract. FORM.0 moet onder meer toetsen: (a) één runtime/één bronwaarheid; (b) open/return/commit/cancel vanuit alle drie contexten; (c) model/render/undo/export-compatibiliteit; (d) actuele autorisatie en stale-sessionpreventie; (e) een testbaar, minimaal startpakket zonder ALG-afhankelijkheid. Elke volgende fase krijgt eigen contract, expliciete toestemming, bewijs van tests, handmatige acceptatie en gecontroleerde merge. Andere WIE-roadmapprioriteiten veranderen hierdoor niet.
