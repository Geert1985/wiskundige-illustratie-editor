# Teksteditor — uitvoeringsplan

Versie 1.4.0 - 2026-10-12. Status: T3 geimplementeerd; wacht op T3-gebruikersacceptatie. T4 niet gestart.

Normatief ontwerp: [TEXT-EDITOR-ARCHITECTURE.md](TEXT-EDITOR-ARCHITECTURE.md). Alle werkzaamheden uitsluitend op `chatgpt/editor-development`; geen merge naar main. Bestaande wijzigingen buiten scope blijven onaangeroerd.

## Volgorde en acceptatie

Fase 0-correcties → toestemming voor P0-tech → proefrapport en keuzeacceptatie → expliciet T1-akkoord → T1 → acceptatie → T2 → acceptatie → T3 → acceptatie → T4 → acceptatie én definitieve rekencontractgoedkeuring → T5a → acceptatie → T5b → acceptatie → T5c → acceptatie → T5d → acceptatie.

Een groene suite is geen gebruikersacceptatie. Iedere stap eindigt met rapport, commit/push op ontwikkelbranch en handmatige testinstructies. Preview, veiligheid en export worden vanaf hun eerste relevante milestone getest; T4/T5d zijn geen uitstel voor eerdere correctheid.

## P0-tech - afgerond

De geisoleerde render/font- en ProseMirror-proeven staan in [TEXT-EDITOR-PREFLIGHT-REPORT.md](TEXT-EDITOR-PREFLIGHT-REPORT.md). Ze zijn uitgevoerd voor T1-toestemming. T1 gebruikt de vervangbare ProseMirror-adapter en de geteste lokale fontassets, onder voorbehoud van de resterende handmatige checks in het T1-rapport.

## T1 - Gestructureerde tekst en invoer

Status: geimplementeerd op chatgpt/editor-development; wacht op handmatige test en acceptatie. Rich text gebruikt documentversie 7 en textSchema 1, omdat documentversie 6 al cirkelpuntenverdelingen declareert.

- Opgeleverd: veilig textContent-model, alinea's, hardBreaks en marks, begrensde ProseMirror-adapter, editor voor nieuwe en statische bestaande teksten, typed text.commit, revisie-, lock- en categoriespecifieke permission checks, lokale editor undo, document undo/redo, JSON/replay en offline SVG-fontembedding.
- Legacy dynamische tekst behoudt textBinding. Bestaande bindingen worden niet automatisch gemigreerd of geopend in de rich editor. Toegestane legacy stijlwijziging blijft via het bestaande stijlpad en verandert de binding niet.
- Tests: historische T1-cijfers staan in het T1-rapport; historische volledige T2-regressie: 418/418 Node-tests; actuele T3-uitslag staat in het T3-rapport. Restricted JSON/SVG en v7 met v6-distributies, groepen en lagen vallen onder regressiecriteria.
- De expliciete opdracht "Begin met T2" autoriseerde T2; resterende handmatige T1-controles blijven open. T3-meerdere bronnen, T4-wrapping/exportvoltooiing en T5-rekenengine vallen buiten deze stap.

Handmatige acceptatiechecklist: meerdere alinea's; Shift+Enter; fragmentopmaak; editor undo/redo; annuleren versus bevestigen; statische bestaande tekst via inspector; undo/redo van commit; JSON opslaan/herladen; offline SVG en rastering; fullscreen; oude dynamische tekstbinding; echte IME en schermlezer. IME en schermlezer blijven expliciet niet uitgevoerd tot er bewijs uit een echte input-/AT-omgeving is. Zie TEXT-EDITOR-T1-REPORT.md.

## T2 — Symbolen en formules

Status: uitgevoerd na expliciete starttoestemming. [T2-REPORT.md](T2-REPORT.md) bevat proefresultaten, contract, testbewijs en beperkingen. De onderstaande taken zijn uitgevoerd; handmatige IME/AT/visuele acceptatie blijft open. Stop na rapportage en push; geen T3 zonder nieuwe toestemming.

1. Afzonderlijke formulebibliotheekproef met gemeten code/assets, lokale fonts, baseline en offline SVG-rastering. MathJax/KaTeX/alternatief zijn kandidaten; keuze pas na resultaten. Leg whitelist, rendererquotas en sanitized SVG vast.
2. Activeer math-fragment en tekstschema 2; bronnotatie is autoritatief. Bouw Ω-paneel met zoeken en alle gevraagde categorieën.
3. Bewaar cursorbookmarks; formule invoegen, openen, wijzigen, verplaatsen en verwijderen als atomair fragment. Voeg toegankelijke labels toe.
4. Test x²+y²=r², sin²(θ)+cos²(θ)=1, breuk en wortel tussen tekst, inclusief kleuren/rotatie/zoom, SVG én PNG-rendering. Test onveilige macro's en stale async-resultaten.
5. Opslag/exportgate voor math: source roundtrip/heropenen, mixed SVG/PNG, redactie en legacybinding-stylematrix. T2-REPORT.md en acceptatie.

## T3 — Meerdere dynamische velden

Status: uitgevoerd na expliciet T3-akkoord. [T3-CONTRACT.md](T3-CONTRACT.md) en [T3-REPORT.md](T3-REPORT.md) leggen schema, bronnen, migratie, actuele tests en beperkingen vast. Geen T4 zonder afzonderlijke toestemming.

1. Text-values en reverse dependency-index; expliciete bronstatussen en restricted redactie. Hergebruik bestaande formattering en ondersteunde eigenschappen.
2. Activeer dynamicValue/schema 3; uitsluitend expliciete T3-migratie volgens sectie 16: prefix/atom/suffix, geërfde styles, legacyStaticText, grants en één historyactie. Test identieke formatering/binding, source remap en herstel; geen automatische conversie bij openen.
3. Bouw {}-paneel met bron/eigenschap/notatie; meerdere velden behouden hun eigen marks. Coördinatenpaar kan uit x/y worden samengesteld. Diameter/vectorcomponenten alleen na afzonderlijk gevalideerde geometrieadapter; niet als bestaande ondersteuning claimen.
4. Test bewegen, schaal/graden/radialen, bronwissen/undo, locks, verborgen bronnen, ingetrokken rechten, duplicatie met/zonder bronnen, JSON/SVG en replay.
5. Opslag/exportgate voor dynamicValue: IDs/formats roundtrip, actuele geautoriseerde SVG/PNG-snapshot en ontbrekende/denied bronnen. T3-REPORT.md en acceptatie. Handmatig twee bronnen en drie velden gebruiken, daarna één bron wissen en herstellen.

## T4 — Afwerking en export

1. Gemengde lay-out, optionele vaste breedte/wrapping, dynamische bounds en stabiele positie afronden.
2. Productie-SVG/PNG-export met assetreadiness, zelfstandige fonts/glyphs, rasterlimieten en foutafhandeling.
3. Keyboard/focus/tabvolgorde, Escape, responsive dialog en fullscreen audit. Schermlezerlabels naast visuele glyphuitvoer verifiëren.
4. Offline roundtrip/export, screenshotvergelijking en load/performance meten. Volledige regressie; T4-REPORT.md en acceptatie.

## T5a — Veilige rekenkern

1. Eerst afzonderlijke definitieve goedkeuring van architectuur sectie 14 (dimensies, eenheden, hoekwaarden, UI-adjacency, normalisatie, printer en grensgevallen); geen T5a start zolang dit open is. Daarna grammatica, typed AST, parser/printer en quotas zonder eval/Function.
2. Pure quantity-engine met lengte-/hoekexponenten en physical/abstract-ruimte; ruwe geometrieadapter zet schaal/SI/rad één keer om.
3. Functies, domeinfouten, expliciete numerieke toleranties en afrondingsbeleid. Tests voor precedence, omgekeerde eenheden, samengestelde dimensies, powers/roots en graden/radialen.
4. Herbruikbare API los van UI; AST serialize/deserialize en parse(print(AST))-gelijkheid, security-/wiskundige regressie inclusief alle voorbeeldrijen. Bestaande document/exportregressie. T5a-REPORT.md en acceptatie vóór calculator-UI.

## T5b — Rekenmachine

1. ∑-dialog met invoer, wetenschappelijk toetsenbord, typed bronchips, live resultaat, precisie en hoek-/eenheidskeuze.
2. Private draft, duidelijke domeinfouten, bronrechten en async/revisiegedrag. De latere invoegactie wordt pas met T5c geactiveerd; geen nog niet ondersteunde inhoud opslaan.
3. Handmatig vaste en dynamische formules, expliciete weergave van UI-genormaliseerde operators, foutcorrectie, annuleren en fullscreen. Alleen eventuele private draftopslag testen; geen documentfragment vóór T5c. Bestaande exportregressie. T5b-REPORT.md en acceptatie.

## T5c — Berekende inlinevelden

1. Activeer calculatedValue/schema 4 en Invoegen in tekst. Bewaar AST en getypeerde bronreferenties; heropen bestaande velden.
2. Drie weergavemodi uit dezelfde AST; meerdere bronnen, veilige presentatienamen, bronremapping en dependency-updates.
3. Verifieer πr² bij 2 en 3 cm (12,57 en 28,27 cm²), afwijkende schaal, units en dynamische hoeken zonder dubbele conversie. Positie/opmaak blijven gelijk.
4. Import/export/undo/replay, restricted redactie, AST-bronnen en alle drie modi in JSON/SVG/PNG-rastering. Elke uitkomstafronding gebruikt ≈ waar nodig. T5c-REPORT.md en acceptatie.

## T5d — Kwaliteitsaudit

1. Volledige Node/Edge, netwerkloze SVG/PNG, oude documenten, permissions/locks, fuzz-/quotafixtures, accessibility en prestatievergelijking.
2. Visuele matrix met gemengde tekst, symbolen, formules, meerdere waarden/berekeningen, zoom en rotatie.
3. Documentformaat, technische contracten, gebruikersinstructies en roadmap actualiseren. T5d-REPORT.md met exacte aantallen, commit, risico's en nog nodige handmatige controles. Expliciete finale gebruikersacceptatie.

## Rapportage en fase 0

Per rapport: gewijzigde bestanden, geïmplementeerde scope, werkelijk uitgevoerde tests (pass/fail/skip), visueel bewijs, resterende risico's, commit en handmatige controles. Niet-uitgevoerde checks krijgen geen PASS.

Historische fase-0-baseline: 364 Node-tests geslaagd, 0 mislukt/overgeslagen; 1 volledige Edge-suite geslaagd (exit 0). De huidige auditcorrectie wijzigt uitsluitend documentatie; geen nieuwe feature/proeftests uitgevoerd. De eerstvolgende beslissing betreft ontwerpakkoord en toestemming voor de beperkte P0-tech-proeven, nog geen T1-integratie.

## Audittraceerbaarheid en definitie van gereed

| Bevinding | Uitvoering en gate |
|---|---|
| B1 v7 | T1: alle locaties uit versiecontroleregistratie; elke versie/routefixture; geen corrupte export of legacy extensionverlies |
| B2 rechten | T1 typed command/policy/diff; T3 references en T5c expressions pas bij hun feature. Iedere introducerende stap test denial/projectie/revisie/epoch/history |
| B3 fonts | P0-tech vóór integratie; criteria/keuze goedgekeurd, geen vooraf vaststaande glyphpaden |
| B4 rekencontract | Definitief akkoord vóór T5a; voorbeeldmatrix als wiskundige tests; T5c toetst display met dezelfde AST |
| B5 ProseMirror | P0-tech vóór integratie; hard failures of ontbrekend IME-bewijs houden keuze open |
| B6 legacybinding | T1/T2 style-only en volledige levenscyclusmatrix; T3 expliciete migratie met grants/backup/undo |
| B7 export | Iedere milestone volgt architectuur sectie 17; productie-PNG-UI in T4 stelt eerdere rastergate niet uit |

Definitieve randvoorwaarden versus open implementatiekeuzes: architectuur sectie 18. Auditprobleem/bron/oplossing/risico/criterium: [TEXT-EDITOR-ARCHITECTURE-AUDIT-RESOLUTION.md](TEXT-EDITOR-ARCHITECTURE-AUDIT-RESOLUTION.md).


## T1-uitvoering ? status 1.2.0

T1 is uitgevoerd na expliciet akkoord. De rich-textstructuur is opgenomen in documentformaat **v7**: v6 was al vereist door de cirkelpuntenverdeling en mag niet opnieuw worden toegewezen. De schema-, editor-, command-, permissie-, SVG- en exportwijzigingen zijn uitgewerkt in [TEXT-EDITOR-T1-REPORT.md](TEXT-EDITOR-T1-REPORT.md). Dit rapport vervangt de eerdere toekomsttijdtekst van T1 hierboven waar die niet meer klopt.

Implementatie omvat ProseMirror via lokaal gebundelde adapter, gestructureerd model schema 1, `text.commit`, categoriespecifieke restricted checks, legacy-bindingbehoud, inspector bewerken, undo/redo, JSON v7 en offline font-embedded rich SVG. Geen formule-, dynamische inlineveld- of T2/T3-functie is gestart.

Acceptatiegate die resteert: handmatige IME/schermlezerchecks en gebruikersscenario?s uit het T1-rapport. T1 wordt niet als volledig geaccepteerd aangemerkt voor die checks. Test de browsereditor op paragrafen/Shift+Enter, fragmentopmaak, annuleren/bevestigen, bestaande tekst bewerken, undo/redo, herladen, fullscreen en zelfstandige offline SVG/PNG.
