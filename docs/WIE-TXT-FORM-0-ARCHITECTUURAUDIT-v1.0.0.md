# WIE-TXT-FORM.0 — Read-only architectuuraudit

**Versie:** 1.0.0  
**Datum:** 17 oktober 2026  
**Scope:** WIE-TXT-FORM — dynamische numerieke meetwaarden, symbolische geometrische formules en uitwerkingen in de bestaande Wiskundige Teksteditor  
**Bron:** `Geert1985/wiskundige-illustratie-editor`, `main` op commit `39893b8c2c95b5cd08de01b3a9aac27579471df6`  
**Normatief doelcontract:** [WIE-TXT-FORM v1.3.0](WIE-TXT-FORM-DYNAMISCHE-FORMULES-CONTRACT.md)  
**Besluit:** **CONDITIONAL GO voor de uitwerking van TXT-FORM.1; NO-GO voor onmiddellijke productiecode zonder aanvullend ontwerp-/migratiecontract.**  
**Auditsoort:** statische bron-, scriptmanifest-, contract- en testinventarisatie via verbonden GitHub-repository. **Geen checkout, geen codewijziging, geen Node-/Edge-tests uitgevoerd en geen handmatige browseracceptatie.**

## 1. Executive summary

TXT-FORM is technisch realiseerbaar als een **beperkte uitbreiding van de bestaande rijke teksteditor en meet-/renderketen**, zonder ingebouwde aparte formule-editor en zonder symbolische algebra-engine. WIE heeft al:

- getypeerde, live gekoppelde `dynamicValue`-inlinefragmenten met `sourceId` + `property`;
- een apart statisch `math`-fragment met veilige LaTeX-presentatie;
- een bestaande ProseMirror-werkruimte en atomair `text.commit`;
- object-/onderdeelreferenties voor veelhoekhoekpunten en -zijden;
- een meetservice voor individuele polygonzijden, cirkels en ellipsen;
- autorisatie, bronredactie, Undo/Redo, JSON- en SVG-/PNG-export met belangrijke bestaande regressietests.

**Maar:** de getypeerde inline-bronbinding heeft nog geen formule-/rol-/weergavemodel; de dynamische-bronkeuze biedt geen individuele polygonzijden, ellipsen of regio's; een gegenereerde formule vereist een **andere renderroute** dan de huidige waarde-tekst; geometrische vormclassificatie is niet gelijk aan een bewezen, duurzaam rechthoekconstraint; de huidige schema-/rechtenlaag zou extra metadata niet toelaten. Een uitsluitend visuele UI-patch is daarom onvoldoende.

**Afbakening blijft strikt:** WAT is een zelfstandige webapplicatie voor de geavanceerde Formule-editor, symbolische algebra, slepen, vergelijkingen en afleidingen. TXT-FORM krijgt geen CAS, algebra-AST, nieuwe formulewerkruimte of automatische WAT-connector.

## 2. Methode, status en onderzochte bronketen

Alle onderstaande bronpaden zijn op `main` in GitHub nagelezen. Een niet-uitgevoerde test wordt nergens als PASS behandeld. Het feitelijke codegedrag, niet een historisch contract, is uitgangspunt.

| Schakel | Actuele bestanden | Auditbevinding |
|---|---|---|
| Gebruikersinterface | [editor.html](../editor.html), [text-insert-panel.js](../text-insert-panel.js), [text-dynamic-value-editor.js](../text-dynamic-value-editor.js), [editor.js](../editor.js) | Er zijn al aparte tabs **Formule** (statische LaTeX) en **Waarden** (brongebonden tekst). Bron- en eigenschapskeuze, precisie, eenheid, voor-/achtervoegsel en preview bestaan. |
| Rich text | [rich-text-editor.js](../rich-text-editor.js), [rich-text-editor.bundle.js](../rich-text-editor.bundle.js), [text-content-diff.js](../text-content-diff.js), [text-workspace.js](../text-workspace.js) | ProseMirror kent atomische `math`- en `dynamicValue`-nodes. Undo/Redo, bookmarks en toepassen/annuleren bestaan; wijzigingsrechten gebruiken getypeerde diff-categorieën. |
| Binding en afhankelijkheid | [text-values.js](../text-values.js), [text-dependencies.js](../text-dependencies.js), [model.js](../model.js) | Stabiele ID/properties, beperkte formats, live resolutie, redactie, validatie en reverse dependency index zijn aanwezig. Geen semantisch formule-recept of `edge`-binding in de tekstvelden. |
| Geometrie en maten | [measurement-geometry.js](../measurement-geometry.js), [polygon-geometry.js](../polygon-geometry.js), [construction-service.js](../construction-service.js), [ellipse-geometry.js](../ellipse-geometry.js) | Lengtes per zijde (`side:i`), hoeken (`angle:i`), oppervlakte, omtrek, halve assen en constructiereferenties zijn aanwezig, maar niet één-op-één ontsloten aan dynamische tekst. |
| Wiskundige presentatie | [math-source.js](../math-source.js), [math-fragments.js](../math-fragments.js), [rich-text-renderer.js](../rich-text-renderer.js), [renderer.js](../renderer.js) | MathSource valideert een begrensde LaTeX-subset en MathFragments maakt SVG; actuele `dynamicValue` wordt vóór SVG-rendering opgelost naar **platte tekst**, niet een SVG-wiskundeformule. |
| Beveiliging/export | [permission-runtime.js](../permission-runtime.js), [export-service.js](../export-service.js), [DOCUMENT-FORMAT.md](../DOCUMENT-FORMAT.md) | Bronrechten bestaan per object/eigenschap, tekstwijzigingen als `text.commit`, redactie en restricted export. Alle nieuwe bronafhankelijke factoren en namen vergen autorisatiecontrole. |
| Numerieke kern | [expression-ast.js](../expression-ast.js), [expression-engine.js](../expression-engine.js), [expression-sources.js](../expression-sources.js) | Aanwezige getypeerde **numerieke** AST/evaluator is geen symbolic/CAS. De drie expression-scripts staan niet in het huidige `editor.html`-scriptmanifest; implementatie mag niet aannemen dat zij standaard als browservaardige dienst beschikbaar zijn. |

## 3. Feitelijke model- en schema-inventaris

### 3.1 Wat nu al wordt opgeslagen

Het bestaande vrije `text`-object kan `textContent` dragen. `TextContent.validate` in [model.js, regels 61–80](../model.js#L61-L80) accepteert `schema:1,2,3` en de inline-runkinds `text`, `hardBreak`, bij schema ≥2 `math` en bij schema ≥3 `dynamicValue`. Onbekende sleutels en kinds worden afgewezen. Een `dynamicValue` draagt:

```json
{
  "kind": "dynamicValue",
  "binding": { "sourceId": "C", "property": "area" },
  "format": {
    "precision": null,
    "unitMode": "document",
    "angleMode": "document",
    "prefix": "",
    "suffix": ""
  }
}
```

De run heeft daarnaast `id` en `marks` in de werkelijke tekststructuur. De **huidige** `TextValues.validate` staat uitsluitend `sourceId` en `property` als binding toe; `format` mag geen `displayMode`, `formulaId` of `roleAliases` bevatten ([text-values.js, regels 4–13](../text-values.js#L4-L13)). Een prototype met zulke velden is dus **geen importeerbaar huidig schema**.

Documentexport kiest de laagst toepasselijke hoofdversie, tot **documentversie 10** bij individuele metingen; gestructureerde tekst maakt gebruik van `textSchema` met momenteel uitsluitend **1, 2 of 3** ([model.js, regels 320–324](../model.js#L320-L324), [373–375](../model.js#L373-L375)). Bestaande versies niet impliciet herschrijven of oude lezers stilzwijgend laten verarmen.

Huidige grenzen: 128 alinea's, 2048 runs, 20.000 tekstcodepunten, circa 1 MiB gevalideerde gestructureerde tekst ([model.js, regel 14](../model.js#L14)); 128 dynamische bronvelden per tekst, 512 per document, 4096 getoonde codepunten per waarde ([text-values.js, regels 4–6](../text-values.js#L4-L6)). Een nieuw formulefragment moet deze of expliciet gekozen aanvullende budgetten naleven.

### 3.2 Beschikbare bronproperties

De feitelijke tekstbron-allowlist staat in [model.js, regels 87–104](../model.js#L87-L104):

- alle niet-tekstobjecten: `name`, `label`;
- eindige lijnstukken, vectoren, maatlijnen: `length`;
- cirkel: `radius`, `perimeter`, `area`;
- veelhoek: `perimeter`, `area`;
- hoek: `angle`; punt: `x`, `y`;
- **geen directe dynamische ellips-, regio-, polygonzijde- of polygonhoekproperty**.

De **afzonderlijke** meetsleutels in [measurement-geometry.js, regels 46–72](../measurement-geometry.js#L46-L72) zijn uitgebreider: cirkel `radius/diameter/circumference/area`, ellips `semiMajor/semiMinor/majorAxis/minorAxis/eccentricity/area`, veelhoek `side:i/angle:i/perimeter/area`. Deze kloof moet bij TXT-FORM.1 expliciet worden gesloten, maar zonder de huidige bron-/permission-semantiek voor bestaande tekstvelden te breken.

De huidige `MeasurementUnits.figureValue` kan een cirkel of polygon behandelen, maar is **geen generieke ellipsoppervlaktefunctie**. Ellipswaarden komen via `MeasurementGeometry.measurementValue` en opgeloste ellipsgeometrie; de adapter moet het correcte bestaande pad gebruiken, geen ongeschikte `figureValue(ellipse)`-aanroep.

## 4. Geometrische referenties en formulecorrectheid

### 4.1 Bestaande onderdeelreferenties

`ConstructionService.referenceOptions` levert voor polygonen expliciete `{objectId,part:"vertex",index}` en `{objectId,part:"edge",index}`-referenties ([construction-service.js, regels 19–35](../construction-service.js#L19-L35), [89–93](../construction-service.js#L89-L93)). `MeasurementGeometry.measurementValue` kan de lengte van `side:i` berekenen uit opeenvolgende vertices ([measurement-geometry.js, regels 58–70](../measurement-geometry.js#L58-L70)).

Dit maakt een **rol-/indexgebonden zijdesymbool** zoals `a` technisch goed haalbaar, mits vooraf gekozen wordt hoe het reageert op topologiewijzigingen, kopiëren en source-remapping.

### 4.2 Werkelijke puntnamen versus synthetische namen

`MeasurementGeometry.vertexNames` genereert standaard `A,B,C,...` als **weergavefallback** en hergebruikt bij `parallelogramBySideAngle` hoogstens de namen van de eerste twee echte puntbronnen ([measurement-geometry.js, regel 89](../measurement-geometry.js#L89)). De overige vertices zijn niet noodzakelijk zelfstandige benoemde puntobjecten.

**Consequentie:** een getoonde `|AB|` kan **niet** alleen uit die letters bewijzen dat A en B echte, aan het object gekoppelde punten zijn. In TXT-FORM worden standaard eigen **zijdesymbolen** toegestaan; de modus **Puntnamen** verschijnt alleen als betrouwbare, identiteitsvaste puntbindingsrollen beschikbaar zijn. Nooit toevallig nabijgelegen punten of duplicaten op basis van labels herkennen.

### 4.3 Rechthoek-/vierkantbewijs is een afzonderlijke capability

WIE heeft een constructierecept `parallelogramBySideAngle` en de methode `ConstructionService.parallelogramShape`, die voor het **actuele** opgeloste vierhoekobject op basis van numerieke tolerantie de labels `Parallellogram`, `Rechthoek`, `Ruit` en `Vierkant` teruggeeft ([construction-service.js, regels 256–258](../construction-service.js#L256-L258)). Dit is een nuttige **vormclassificatie**, maar geen algemeen bewijs dat een willekeurige vrijgetekende vierhoek onder alle latere bewerkingen rechthoekig blijft.

**Besluit:** een recept `rectangle.area = a·b` mag alleen aangeboden worden wanneer het broncontract de rechthoekrelatie in de huidige toestand met de juiste strengheid garandeert; voor een **duurzaam** formulecontract is bovendien vast te leggen welke constructieparameter/constraint die relatie behoudt. Bij verlies van de rechtshoekige invariant moet de formule niet stilzwijgend een fout resultaat tonen. Vrije vierhoeken krijgen nooit automatisch een rechthoekrecept op basis van een optisch gelijke vorm.

Voor een driehoek met `A=½bh` moet ook de **loodrechte hoogte** expliciet te bepalen zijn; een willekeurige andere zijde is geen hoogte. Voor ellips geldt `A=πab` met **halve** aslengten. Generieke polygonoppervlakte blijft wiskundig geldig via de bestaande algemene oppervlakteberekening, maar een eenvoudige `a·b`-symboliek is niet universeel.

### 4.4 Capabilitymatrix (statische audit)

| Bron/eigenschap | Numeriek via huidige tekstvelden | Geometrische waarden elders | Symbolisch doelrecept | Gate |
|---|---|---|---|---|
| Cirkel: oppervlakte, omtrek | **Ja** | `r`, `πr²`, `2πr` | **Ja, laag risico** | Dezelfde meetwaarheid, status, eenheden |
| Vrije veelhoek: oppervlakte/omtrek | **Ja** | Zijdesleutels `side:i` | Algemene omtreksom mogelijk | Alias/topologie, maximaal aantal kanten |
| Driehoek: oppervlakte | **Ja**, als polygon | Drie zijden en oppervlakte | `½bh` pas met geldige loodrechte hoogte | Hoogtesemantiek en symbolische rollen |
| Rechthoek: oppervlakte/omtrek | **Alleen als polygonwaarde** | `parallelogramShape`, zijdeparameters | `ab`, `2(a+b)` **conditioneel** | Constraint-/bewijs- en dynamische geldigheid |
| Vierkant: oppervlakte | **Alleen als polygonwaarde** | Vierkantclassificatie van parametrische parallellogram | `a²` **conditioneel** | Rechthoek én gelijke-zijdeninvariant |
| Ellips: oppervlakte | **Nee** | `measurementValue(...,"area")`, `a,b` | `πab`, haalbaar na nieuwe bronadapter | Eigenschap-/permissionbridge |
| Regio: oppervlakte | **Nee** | `regionArea` en regio-renderer | Alleen geschikte expliciete geometrische recepten | Regiobron-/rechtencontract |
| Lijnstuk: lengte | **Ja** | Lengte | `|AB|` alleen bij echte eindpunten | Puntnaamidentiteit |

## 5. Presentatielaag en formeel opslagkeuzepunt

### 5.1 Huidige renderroute

De bestaande SVG-renderer zet dynamische bronwaarden via `TextValues.renderContent` om in **letterlijke tekstfragmenten** ([text-values.js, regel 32](../text-values.js#L32), [renderer.js, regels 319–323](../renderer.js#L319-L323)). De `RichTextRenderer` genereert alleen voor `kind:"math"` een `MathFragments.svg` en gebruikt voor andere runs SVG-tekst ([rich-text-renderer.js, regels 8–15 en 26–38](../rich-text-renderer.js#L8-L38)). `MathFragments.has` kijkt eveneens uitsluitend naar `math`-runs. **Een dynamische formule renderen is dus meer dan een andere previewstring teruggeven.**

Een nieuwe presentatieadapter moet naar óf veilig gegenereerde, gevalideerde wiskundenotatie óf tekst omzetten volgens dezelfde canvas-/exportregels. Voor formules moeten beschikbaarheid/lazy-loading van `MathFragments`, lay-out/breedte en aria-tekst expliciet gecontroleerd worden.

### 5.2 Ontwerpalternatieven

**Alternatief A — `dynamicValue` uitbreiden:** nieuw `presentation`-attribuut of modus. Voordeel: bestaande bronvelden/editnode; nadeel: `TextValues.validate`, atom paint, `TextContentDiff`, redactie, schema-/rendergrenzen, bestaande imports en permissions hebben allemaal bestaande, nauwe semantiek. Oude schema-3-readers wijzen onbekende velden af.

**Alternatief B — nieuwe expliciete atomische runkind, bijvoorbeeld `dynamicMeasurement`:** gescheiden numerieke legacy-waarden en nieuwe symbolische/formulepresentaties. Voordeel: helder contract per veld, schema-evolutie en permissions; nadeel: nieuw run-/ProseMirror-node, editorbundle, validator, renderer, SVG-preload, dependency-index, migratie en redactie nodig.

**Auditvoorkeur: B, onder voorbehoud van een afzonderlijk schema-/veiligheidsontwerp.** Bewaar oude `dynamicValue` ongewijzigd; voeg voor nieuwe velden een getypeerde semantische identiteit toe, bijvoorbeeld `binding.sourceId/property`, `formulaId/formulaVersion`, `displayMode`, `notation`, `roleAliases`, `precision/unitMode`. **Geen gecachete resultaten, SVG, numerieke dubbelboekhouding of uitvoerbare LaTeX.** Een nieuwe **textSchema-versie (kandidaat 4)** is waarschijnlijk correcter dan schema 3 stil te verruimen. Onderzoek alle hoofd-documentversies 7–10 en oude lezers; formele schema-API nog **niet goedgekeurd**.

De grootste valkuil: **eenzelfde objectproperty als `area` autoriseert niet vanzelf het tonen van alle numerieke onderliggende factoren**, bijvoorbeeld `radius`, `side:i`, `semiMajor` of namen van puntbronnen. De preview, renderer en export moeten per werkelijk geconsumeerde bron-/rolproperty dezelfde permissioncheck hanteren. Een zuiver symbolische, niet-onthullende formule kan een andere autorisatiebehoefte hebben dan een numerieke substitutie; definieer dit expliciet, niet via `author`-specifieke shortcuts voor beperkte sessies.

## 6. Permission-, geschiedenis- en exportmatrix

De huidige beperkte host controleert `textCapabilities.content/format/references/math` en de bronpermissies in `text.commit` ([permission-runtime.js, regels 165–180](../permission-runtime.js#L165-L180)); `sourceAllowed` vereist lees-/weergaverechten, beschikbaarheid en `textSourceProperties`, en `projectText` verwijdert ongeautoriseerde dynamische verwijzingen ([permission-runtime.js, regels 233–242](../permission-runtime.js#L233-L242)).

`TextContentDiff.changes` vergelijkt nu `math` en `dynamicValue`, met aparte `content/format/math/references`-categorieën ([text-content-diff.js](../text-content-diff.js)). `TextDependencies.forSource` indexeert nu alleen `dynamicValue` en legacy `textBinding` ([text-dependencies.js](../text-dependencies.js)). `RichTextEditor` kent uitsluitend de twee relevante bestaande inline-atomen ([rich-text-editor.js, regels 12–31](../rich-text-editor.js#L12-L31)). Een nieuw formuleveld moet **alle** schakels bereiken; een ontbrekende schakel kan rechten, geschiedenis, export of updates breken.

| Scenario | Verplicht gedrag | Risico |
|---|---|---|
| Nieuw/gewijzigd formuleveld in author-mode | Exact één `text.commit` bij bewaren; annuleren niets | Editor-/schema-inconsistentie |
| Restricted source/property | Geen naam, coördinaat, factorwaarde of formule-metadata lek; bronstatus `niet beschikbaar` | **Hoog** |
| Status-/geometry-update | Op basis van actuele bron-ID en rol, geen nieuwe persistente meetwaarde | Middel |
| Bronverwijdering/herstel | Zelfde binding en placeholder; Undo/herstel bij dezelfde ID | Middel |
| Dupliceer bron en tekst | Correcte selectieve remapping van **alle** rol- en formulebronreferenties | **Hoog** |
| Hernoem punt/zijde | Alleen echte puntbindingen hernoemen; aliassen behouden rolintegriteit | Hoog |
| Opslaan/laden/import/oud document | Atomaire validatie, oude `math` en `dynamicValue` blijven exact functioneren | **Hoog** |
| SVG/PNG/offline/browser | Dezelfde geautoriseerde formule als teksteditor, zonder font-/math-assetfouten | **Hoog** |
| Permission epoch of gewijzigde revisie | Asynchrone preview/commit kan geen verouderde private gegevens publiceren | **Hoog** |
| Veel objecten / veel dynamische velden | Gebonden resolverkosten, geen per-field volledige objectindex rebuild bij elke paint | Middel |

**Prestatiepunt:** `editor.js.resolveTextValue` bouwt bij elke aanroep `new Map(this.engine.model.objects.map(...))` ([editor.js, regel 549](../editor.js#L549)). Vandaag is dat een werkend, eenvoudig pad, maar bij frequente previews met veel dynamische formules is het een **potentiële schaalrisico**, niet een gemeten performancebug. Onderzoek één geautoriseerde snapshot/resolver per render-/revisiecyclus met correcte invalidatie; geen algemene rendererrefactor zonder noodzaak.

## 7. Aanbevolen MVP TXT-FORM.1

**Conservatieve end-to-end vertical slice, met beperkt risico en maximaal architectuurbewijs:**

1. Hergebruik `Waarden` in de bestaande teksteditor; voeg voor **nieuwe** gekoppelde formulevelden de keuzemodi `Waarde` en `Formule` toe, en behoud het huidige oude `dynamicValue`-gedrag zonder migratie.
2. Start met **cirkeloppervlakte `A=πr²` en omtrek `P=2πr`** omdat de bestaande tekstbron en meetservice beide typen al ondersteunen. Dit bewijst de gehele nieuwe atoom-, math-render-, bronrecht- en documentketen zonder nieuwe polygonvorminvarianten.
3. Voeg pas een **rechthoekoppervlakte `A=a·b`** toe wanneer de expliciete rechthoek-capability/-constraint (en het dynamisch verlies daarvan) formeel in de fase-1-implementatie wordt goedgekeurd en getest. Het blijft een **prioritaire usecase**, geen afgeschafte eis; enkel niet ten koste van wiskundige correctheid.
4. `Uitwerking` (waarde-invulling), factorprecisie, eenheden, selectie van echte puntnamen en brede objectcatalogus volgen in TXT-FORM.2. Geen symboolbewerkingsengine.
5. De beperking wordt aan de gebruiker getoond: voor ongeschikte objecten **Formule niet beschikbaar**, terwijl de bestaande numerieke waarde wel beschikbaar kan blijven.

Een alternatieve tranche `TXT-FORM.1b` voor bewezen parametrische rechthoeken kan na een goede capability-spike in **dezelfde implementatiemilestone** vallen, zolang numerieke/dynamische regels expliciet in het contract staan. Geen verplichting om toekomstige WAT-componenten te gebruiken.

## 8. Formele open punten vóór implementatie-GO

| Gate | Verplicht expliciet besluit | Voorstel |
|---|---|---|
| **G1 — Schema/inline-atoom** | Nieuw runkind versus uitbreiding `dynamicValue`; document-/textSchema-versie en backcompat | Nieuw `dynamicMeasurement`, **kandidaat textSchema 4** |
| **G2 — Geometrische recepten** | Exacte broncapaciteit per object/recept, puntnaam- versus edge-aliasbeleid, geldig/ongeldig/herstel | Begin cirkel; rechthoek enkel bewezen constraint |
| **G3 — Waarde/formule-rendercontract** | Typeveilige formulepresentatie, bestaande math-assets, één canvas/export-waarheid en afronding | Centrale presentatie-resolver zonder CAS |
| **G4 — Autorisatiebronnetwerk** | Source/property-permissie per gemeten factor, puntnaam en voorgesteld recept, duplicatie en restricted projection | Minimaal-privilege per feitelijk gebruikte bron |
| **G5 — UX/commit** | Preview, moduskeuze, bewerken, ongedaan, annuleren, niet-beschikbaar, beperkte rechten | Breid `Waarden`-tab minimaal uit |
| **G6 — Testbudget** | Volledige relevante Node-/Edge-matrix, negatieve schema-/securityfixtures, handmatige beoordelingscriteria | Eerst doelgerichte tests, dan volledige regressie en handmatige acceptatie |

**No-go-condities:** onduidelijke formulewaarheid, afgeronde substitutie die als exacte gelijkheid wordt gepresenteerd, pseudo-puntnamen als echte referenties, verborgen factorinfo in restricted modus, silently lost atoms bij oude readers, ontbrekende SVG-/PNG-pariteit of implementatie van WAT-functies in WIE.

## 9. Bestaande tests en nieuwe minimale regressiematrix

**Bestaande geautomatiseerde bewijzen in repository, alleen statisch geïnventariseerd:**

- [tests/text-editor-t3.test.cjs](../tests/text-editor-t3.test.cjs): bronbinding, live resolutie, dynamische waarden, schema 3, autorisatie, duplicatie/remapping, migratie, redactie, replay, schaal, invaliditeit;
- [tests/browser-rich-values.cjs](../tests/browser-rich-values.cjs): de echte waarden-UI, selectie, herbewerkingsgedrag, bronbeweging, optionele math, restricted rechten, SVG/PNG, Undo/Redo;
- [tests/text-editor-t2.test.cjs](../tests/text-editor-t2.test.cjs), [tests/text-editor-t4.test.cjs](../tests/text-editor-t4.test.cjs), [tests/browser-rich-math.cjs](../tests/browser-rich-math.cjs), [tests/browser-rich-layout.cjs](../tests/browser-rich-layout.cjs): math, layout, fonts, formules en export;
- [tests/geo-ui-measurements.test.cjs](../tests/geo-ui-measurements.test.cjs), [tests/browser-parallelogram-measurements-m8b2.cjs](../tests/browser-parallelogram-measurements-m8b2.cjs): individuele kanten/hoekwaarden, ellips en zichtbare metingen;
- [tests/permissions.test.cjs](../tests/permissions.test.cjs), [tests/expression-sources.test.cjs](../tests/expression-sources.test.cjs): restricted-permissies en bestaande numerieke bronadapter.

**Nieuwe TXT-FORM-fixtures nodig:** `circle.area`, `circle.perimeter`, dynamische bronmutatie, getypte render naar formulemath (UI/canvas/SVG/PNG), import en export in alle toepasselijke documentversies, author+restricted met misbruikfixtures, bronverwijdering/herstel, clone/remap, formulaId/schemafouten, naamwijzigingen/alliassen, rechthoek-parallellogram-negatieven, ellips halve-assenberekening, dimensie-/afrondingsindicatie, verdwenen privileges tijdens preview, rich-text-Undo/Redo, keyboard/focus en grote tekst-/objectdatasets.

**Uitvoervolgorde zodra een aparte GO bestaat:** `npm run build:text` indien rich-text-editorbron/bundle wijzigt → gerichte Node-tests → gerichte Edge-modules → `npm test` → `npm run test:edge` → handmatige acceptatie. De bestaande tests/README bevat verdere browserinstructies. **Audit heeft geen van deze commando's uitgevoerd.**

## 10. Besluit, volgende actie en formele grenzen

**AUDITUITKOMST: CONDITIONAL GO (ontwerp).** De architectuur is passend; TXT-FORM.1 is niet veilig als louter UI-aanpassing. Eerst moet een **TXT-FORM.1 technisch implementatiecontract v1.0.0** worden vastgesteld met G1–G6, status- en permissiematrix, exact eerste formulecatalogus, schema-/migratiebesluit en verplichte tests. Daarna kan de gebruiker **afzonderlijk** implementatie-GO geven. Dit rapport autoriseert geen productiecode.

De komende implementatie wordt uitsluitend in WIE uitgevoerd. **WAT is geen dependency en geen deelnemer aan deze milestone.** WIE-FORM/WIE-ALG zijn vervallen WIE-ontwerpsporen. Oudere andere WIE-trajecten, branches, M-PATH-status, permissions en documenten worden door dit rapport niet gewijzigd.

**Vier afzonderlijke statussen:** audit uitgevoerd = **ja, statisch**; implementatiecontract goedgekeurd = **nee**; productie-implementatie = **nee**; Node/Edge/handmatige acceptatie = **niet uitgevoerd**.
