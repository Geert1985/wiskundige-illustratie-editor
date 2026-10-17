# WIE-ALG — Interactieve Algebra- en Vergelijkingseditor

**Concept- en architectuurcontract v1.0.0 — 17 oktober 2026**  
**Status:** gebruikersvisie en productrichting bevestigd; **langetermijn-roadmap, uitsluitend documentatie**. Geen technische implementatie-, schema-, branch-, PR- of productiecode-GO.  
**Project:** From Zero 2 Infinity / Wiskundige Illustratie Editor  
**Referenties:** [TXT-FORM v1.1.0](WIE-TXT-FORM-DYNAMISCHE-FORMULES-CONTRACT.md), [teksteditorarchitectuur](TEXT-EDITOR-ARCHITECTURE.md), [ontwikkelroadmap](DEVELOPMENT-ROADMAP.md).

## 1. Visie

Een vergelijking bestaat uit **selecteerbare semantische elementen**, niet enkel tekens of gerenderde LaTeX. De gebruiker kan termen en deeluitdrukkingen aanklikken, gezamenlijk selecteren, groeperen, verslepen, contextgevoelig herschrijven en het wiskundig effect onmiddellijk zien. De editor bewaart én verklaart de toegepaste regel, inclusief aannames en oplossingsverzamelingen.

Voorbeeld:
```text
2(x + 3) = 14
x + 3 = 14 / 2       [deel beide leden door 2; 2 ≠ 0]
x = 14 / 2 - 3       [trek 3 af van beide leden]
x = 4                [vereenvoudig]
```

Een term naar de andere kant **slepen** is een intentie voor een geldige bewerking op **beide leden**, niet een letterlijke tekstverplaatsing of een generieke tekenswitch. Een voorlopige preview verklaart de ingreep vóór bevestiging.

## 2. Productgedrag

### 2.1 Manipulatie binnen een expressie
- Selecteer één term, een subexpressie, meerdere gelijksoortige termen of een volledige factor; selecties respecteren de AST-structuur.
- Contextgereedschappen tonen **uitsluitend toepasbare** regels: herschikken, gelijksoortige termen combineren, haakjes uitwerken, factoren buiten haakjes brengen, breuken reduceren, substitueren en identiteiten toepassen.
- Selectie en drag-and-drop tonen magnetische, geldige bestemmingen; ongeldige targets geven feedback en veroorzaken **geen** mutatie. Toegankelijk toetsenbord-/menualternatief is verplicht.
- Verschillende mathematisch geldige herschrijvingen mogen als keuzemogelijkheden verschijnen; het programma kiest niet stilzwijgend een andere bedoeling.

### 2.2 Manipulatie van vergelijkingen/ongelijkheden
- Sleep `+3` van links naar rechts: WIE stelt **3 van beide leden aftrekken** voor.
- Sleep factor `2` van `2(x+3)=14`: WIE stelt **beide leden delen door 2** voor.
- Bij delen door `x` controleer en vermeld `x ≠ 0`; indien dit niet bewezen is, moet de procedure gevallen splitsen of weigeren.
- Bij kwadrateren, worteltrekken, breuken of andere mogelijk niet-bijectieve transformaties volgt een expliciet **equivalentie-/implicatie-/oplossingscontrolecontract**, nooit impliciet behoud van dezelfde oplossingsverzameling.
- Bij ongelijkheden moet vermenigvuldigen/delen met een bewezen negatieve factor het teken omkeren. Bij onbekend teken: gevallen splitsen of bewerking uitstellen/weigeren.
- Reële en eventueel later complexe domeinen, uitsluitingen, deelgebieden, nuldelingen, meervoudige oplossingen en absolute waarden worden semantisch beheerd.

### 2.3 Didactiek en afleiding
- **Vrije modus:** directe manipulatie met wiskundig gecontroleerde feedback.
- **Didactische modus:** benoemt de bewerking, voor- en naveronderstellingen, deelstappen en eventuele controle van oplossingen.
- De afleidingsgeschiedenis is een reeks getypeerde **TransformationStep**-records, geen uitsluitend gekopieerde tekstregels. Elke stap kan worden bekeken, ongedaan gemaakt, opnieuw toegepast en in de teksteditor ingevoegd.
- Een algebra-transactie is afzonderlijk toetsbaar en deterministisch; presentatie, selectie en animatie veranderen de mathematische betekenis niet.

## 3. Wiskundige contracten

1. **Semantische transformatie:** leg het gebruikte herschrijfregel-ID, regelversie, invoer, uitvoer, variabelendomein, aannames en resultaatrelatie vast.
2. **Equivalentieklasse:** onderscheid identiteit, equivalente vergelijking, gevolg/implicatie en slechts kandidaat-oplossing. Bewaar de juiste oplossingsset en uitsluitingen.
3. **Geen stilzwijgende foutieve annulering:** `x/x` wordt pas `1` onder `x≠0`; `√(x²)` wordt op reële domeinen `|x|`, niet `x`.
4. **Geen schijnexactheid:** werk exact waar ondersteund; anders benoem de numerieke benadering. De huidige T5a-numerieke engine is geen symbolische CAS of bewijsengine.
5. **Dimensionaliteit:** grootheden uit geometrie en rekenmachine houden hun getypeerde eenheden. Optellen vereist compatibele dimensies; trigonometrische, exponentiële en andere operatoren hebben expliciete domein-/dimensieregels.
6. **Externe formules:** algebra mag de brongeometrie niet direct wijzigen op grond van een herschrijfstap; zie §6.

### 3.1 Voorbeelden met expliciete voorwaarden

| Begin | Ingrijpactie | Correcte uitkomst of voorwaarde |
|---|---|---|
| `3x + 2x + 7` | selecteer `3x` en `2x`, combineer | `5x + 7` |
| `x(x+2)` | werk haakjes uit | `x²+2x` |
| `x²+5x+6` | factoriseer | `(x+2)(x+3)` |
| `x²=9` | los op over ℝ | `x=-3` **of** `x=3` |
| `x/x=1` | vereenvoudig | alleen voor `x≠0` |
| `x²=4` | worteltrekken | `|x|=2`, dus `x=±2` |
| `-2x<6` | deel door `-2` | `x>-3` |
| `sin²(x)+cos²(x)` | identiteit | `1` voor reële x |

Deze voorbeelden zijn **toekomstige acceptatiefixtures**, geen bewijs dat de huidige WIE-kern ze kan uitvoeren.

## 4. Gegevensmodel en servicegrenzen

**Vereist ontwerppatroon:** een getypeerde, gevalideerde **symbolische AST**, gescheiden van zowel LaTeX-presentatie als de reeds bestaande getypeerde **numerieke** `ExpressionAST`. Onderzoek in ALG.0 hoe AST-nodes, eenheden, bronadapters en evaluatie hergebruikt kunnen worden; **niet** blind aannemen dat de huidige numerieke AST vergelijkingen, onbekenden, herschrijfregels of oplossingsverzamelingen ondersteunt.

Logische lagen:
1. `AlgebraDocument/ExpressionModel`: canonieke expressie-/vergelijkingsstructuur, variabelen, domeinen, gebonden bronreferenties en beperkingen;
2. `AlgebraSelection/Interaction`: structurele selecties, multi-selectie, drag-targets, voorvertoning en toetsenbordalternatief;
3. `TransformationRegistry`: getypeerde regels met precondities, equivalentie-/implicatiegaranties en expliciete varianten;
4. `TransformationVerifier`: onafhankelijke validatie van toepasbaarheid, voorwaarden, dimensies, oplossingsverzamelingen of bewijsgrens;
5. `AlgebraHistory/Derivation`: controleerbare stapgeschiedenis met Undo/Redo en deterministische replay;
6. adapters naar **bestaande** teksteditor, calculator en geometrie, zonder parallelle berekening of bronautorisatie.

De persistente representatie krijgt uitsluitend na ALG.0 een expliciet schema- en migratiecontract; sla niet louter drag-coördinaten, HTML of LaTeX als wiskundige waarheid op. Veranderingen in herschrijfregels vereisen regelschema-/versiebeleid. Voorbeeld **concept**, geen implementatieschema:

```json
{
  "kind": "transformationStep",
  "ruleId": "equation.subtractBothSides",
  "ruleVersion": 1,
  "selectionPath": ["left", "sum", 1],
  "assumptions": [],
  "relation": "equivalent",
  "before": "<typed-expression>",
  "after": "<typed-expression>"
}
```

## 5. Gebruikersinterface en feedback

- Inline algebra-editor in/naast de Wiskundige Teksteditor, consistent met WIE-contextmenu's en het donkerblauw/gouden ontwerpsysteem.
- Versleepbaar structureel geselecteerde term/expressie, met gemarkeerde bestemmingen, voorgestelde mathematische operatie, live-preview en expliciete bevestiging.
- Geen verdwijnende selectie, spontane algebra of automatische commit na een ongeldige drop; Escape annuleert, Enter bevestigt, Undo herstelt.
- Regelbeschrijvingen, voorwaarden, selecties en afleidingen toegankelijk via toetsenbord en schermlezer.
- Animaties zijn presentatielaag en mogen geen teken-, operator- of referentiemutaties veroorzaken.
- Leestermen correct ondanks herschikking (bijv. eenheid, symboolalias en referentie blijven aan de juiste AST-node gebonden).

## 6. Dynamische geometrie en eventuele tweerichtingskoppeling

**Eerste integratierichting: geometrie → algebra.** Een WIE-rechthoek met `A=a·b` levert een brongebonden formule en actuele meetwaarden. ALG kan formeel herschrijven tot `b=A/a` met `a≠0`. Bij bronverandering worden waarden opnieuw bepaald, niet de constructie omgekeerd aangepast.

**Eventueel later: algebra → geometrie** (afzonderlijke ontwerp- en autorisatie-GO). Een gebruiker kan een variabele of constraint expliciet kiezen om geometrie aan te sturen, maar dit vereist een bewezen oplosbaar constraintcontract, uniciteit/branchkeuze, permissioncheck, voorspelbare conflict-/degeneratieafhandeling en één atomair construction/history-commando. **Geen impliciete geometrische writeback, geen ongevraagde vormverandering door een algebraïsche herschikking.**

Nauwkeurig onderscheid tussen formule-identiteit, wiskundige variabele, geometrische bron-ID, vertex/edge-rol en getoond label. TXT-FORM borgt het noodzakelijke voorwerk.

## 7. Veiligheid, compatibiliteit en prestaties

- **Geen `eval`, vrije JavaScript-uitvoering, HTML/LaTeX als parserautoriteit, niet-gevalideerde rewrites of veronderstelde CAS-correctheid.**
- Valideer complexiteitslimieten (AST-diepte, aantal stappen, tijd-/geheugenbudget), bronrechten, documentrevision/permission-epoch en deterministische replay.
- Geen data van verboden geometrische bronnen via previews, reken-/transformatieresultaten, tooltip, kopie, export, history of cache.
- Legacy statische `math`-velden blijven statisch; bestaande `dynamicValue` en TXT-FORM-velden blijven compatibel. Geen automatische migratie van vrije LaTeX naar uitvoerbare algebra zonder expliciete succesvolle parse en toestemming.
- Canvas, teksteditor, stand-alone SVG/PNG en documentroundtrip tonen dezelfde geautoriseerde wiskundige betekenis.
- UI en CAS hoeven niet monolithisch te worden: formeel geteste kleine transformaties krijgen voorrang op een brede onbewezen regelcatalogus.

## 8. Roadmap en afhankelijkheden

| Fase | Doel | Implementatiestatus |
|---|---|---|
| **ALG.0** | Read-only wiskundige/architecturale audit, numerieke versus symbolische AST, datamodel, veiligheids-/bewijsstrategie, concept-UX en scope van eerste slice | uitsluitend ontwerp |
| **ALG.1** | Structurele selectie en beperkte, geteste lokale herschrijfregels, inclusief voorwaarden en history | toekomstig, aparte GO |
| **ALG.2** | Contextgevoelige algebraïsche drag-and-drop, inclusief verplaatsen tussen vergelijkingsleden, preview en equivalente beideleden-operaties | toekomstig, aparte GO |
| **ALG.3** | Didactische afleidingsweergave, multi-selectie, meer regels, oplossingscontrole en export | toekomstig, aparte GO |
| **ALG.4** | Geometrie-/TXT-FORM-/rekenmachine-integratie, met eventueel afzonderlijk te ontwerpen tweerichtingsconstraints | toekomstig, aparte GO |

**Afhankelijkheden:** stabiele TXT-FORM-structuur en rolreferenties; bestaande T5a/T5b-reken- en eenhedencontracten; semantische transformatie- en bewijsstrategie; eigen opslag-, rechten- en testschema. ALG.0 mag wel conceptueel parallel worden onderzocht, maar ALG.1+ start niet impliciet bij afronding van TXT-FORM.

## 9. Acceptatie- en stopcriteria

- Reproduceerbare structurele selecties van term, factor, subexpressie, meerdere gelijksoortige termen.
- Toepasbare niet-toepasbare/voorwaardelijke rewrite expliciet onderscheiden; geen foutieve simplificatie bij nuldelers, wortels of onbekend teken.
- Regelresultaat controleerbaar op equivalentie, implicatie, voorwaarden en (waar van toepassing) oplossingsverzameling; onafhankelijke wiskundige testfixtures.
- Drag-annulering en mislukte drop schrijven geen document/history; geldige actie exact één atomaire Undo-stap.
- Behoud labels, objectbindingen, dimensies, schermlezers, beveiliging, import/export en versievaste history.
- Geen regressie in bestaande geometrie, teksteditorsessies, vrije LaTeX, dynamische meetwaarden en rekenmachine.

**Go/no-go:** geen productiecode vóór een afzonderlijk goedgekeurde ALG.0-eindrapportage en fasecontract. Statuswoorden `ontwerp`, `goedgekeurd`, `geïmplementeerd`, `getest`, `handmatig geaccepteerd`, `gemerged` zijn niet uitwisselbaar.
