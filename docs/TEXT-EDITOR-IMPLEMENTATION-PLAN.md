# Teksteditor — uitvoeringsplan

Versie 1.1.0 — 2026-10-11. Status: auditcorrecties B1–B7 verwerkt; wacht op expliciete goedkeuring.

Normatief ontwerp: [TEXT-EDITOR-ARCHITECTURE.md](TEXT-EDITOR-ARCHITECTURE.md). Alle werkzaamheden uitsluitend op `chatgpt/editor-development`; geen merge naar main. Bestaande wijzigingen buiten scope blijven onaangeroerd.

## Volgorde en acceptatie

Fase 0-correcties → toestemming voor P0-tech → proefrapport en keuzeacceptatie → expliciet T1-akkoord → T1 → acceptatie → T2 → acceptatie → T3 → acceptatie → T4 → acceptatie én definitieve rekencontractgoedkeuring → T5a → acceptatie → T5b → acceptatie → T5c → acceptatie → T5d → acceptatie.

Een groene suite is geen gebruikersacceptatie. Iedere stap eindigt met rapport, commit/push op ontwikkelbranch en handmatige testinstructies. Preview, veiligheid en export worden vanaf hun eerste relevante milestone getest; T4/T5d zijn geen uitstel voor eerdere correctheid.

## P0-tech — Voorstel voor beperkte voorbereiding vóór T1

Nog niet geautoriseerd of uitgevoerd. Geen dependencyinstallatie, prototype of productieaanpassing in deze documentatiecorrectie.

1. Na afzonderlijke toestemming: maak alleen `experiments/text-editor-preflight/` met eigen fixtures, proefconfiguratie en gepinde lokale dependencies. Geen imports vanuit de productie-entrypoints, geen wijziging van root-runtimebundles/model/commands.
2. Voer renderproef A SVG-text met embedded fonts versus B glyphpaden uit; gebruik exact corpus/thresholds uit architectuur sectie 13. Meet bounds/baselines, kerning, Unicode/fallback, screenshots, raw/gzipomvang, offline SVG/PNG, accessibility en warm/cold performance. Geen font-/renderbibliotheek kiezen vóór meetresultaten.
3. Voer ProseMirror-proef uit tegen sectie 15: echte selectie/caret, fake atomen, IME, paste, lokale history, fullscreen/dialog en eigen JSON-roundtrip. Echte OS-IME en schermlezercontrole vereisen apart bewijs; unavailable test blijft expliciet not executed en houdt keuzeacceptatie open.
4. Rapporteer in TEXT-EDITOR-PREFLIGHT-REPORT.md: machine/browser/versies/licenties, scripts/fixtures, alle pass/fail/not executed, hardecriteriafailures, bundelbudget en keuze/alternatief. Geen T1-PASS of gebruikersacceptatie claimen.
5. Push proefresultaat alleen op ontwikkelbranch wanneer die stap wordt toegestaan; vraag acceptatie van proefkeuzes én toestemming voor T1. Faalcriteria mogen niet zonder toestemming versoepeld worden.

## T1 — Gestructureerde tekst en invoer

1. Voorwaarde: geaccepteerd P0-tech-rapport en expliciet T1-akkoord. Leg schema, limieten, migratie en typed text.commit vast; implementeer de complete versiecontroleregistratie uit sectie 11, inclusief rootextras/conflicten en restricted lagenexport.
2. Bouw fixtures voor v1–v6 en elke load/exportroute; policy schema 2, textCapabilities/textSourceProperties, canonical diff, revisie/epoch, denied writes en legacy styles volgens secties 12/16. Geen algemene textContent-grant via style.*.
3. Implementeer text-content, modelvalidatie, formaatschrijven/lezen, fijnmazige commandautorisatie en atomair geschiedenisgedrag. Behoud bestaande bindings en constructietekst.
4. Bouw Tekst bewerken met toolbar, geselecteerde-fragmentopmaak, alinea's/hardBreak, lettertype/grootte/kleur/uitlijning, private undo, Annuleren/OK en SVG-preview.
5. Implementeer gedeelde lay-out/SVG en totale selectiegrenzen. Inspector opent dezelfde editor. Behoud anker, rotatie, drag, fullscreen en bestaande statische export.
6. Blokkerende exportgate: JSON/draft, author/restricted SVG, SVG→PNG-rasterfixtures, fonts offline, history/replay en v6 met organisatie. Volledige regressie, visuele vergelijking en T1-REPORT.md met exacte resultaten en beperkingen.

Handmatig: maak twee alinea's; formatteer afzonderlijke woorden; voeg sub/superscript toe; bekijk preview/canvas; annuleer een wijziging; bevestig en undo/redo; heropen JSON; controleer SVG en fullscreen. Open ook een oude dynamische tekst zonder verlies van binding.

## T2 — Symbolen en formules

1. Afzonderlijke formulebibliotheekproef met gemeten code/assets, lokale fonts, baseline en offline SVG-rastering. MathJax/KaTeX/alternatief zijn kandidaten; keuze pas na resultaten. Leg whitelist, rendererquotas en sanitized SVG vast.
2. Activeer math-fragment en tekstschema 2; bronnotatie is autoritatief. Bouw Ω-paneel met zoeken en alle gevraagde categorieën.
3. Bewaar cursorbookmarks; formule invoegen, openen, wijzigen, verplaatsen en verwijderen als atomair fragment. Voeg toegankelijke labels toe.
4. Test x²+y²=r², sin²(θ)+cos²(θ)=1, breuk en wortel tussen tekst, inclusief kleuren/rotatie/zoom, SVG én PNG-rendering. Test onveilige macro's en stale async-resultaten.
5. Opslag/exportgate voor math: source roundtrip/heropenen, mixed SVG/PNG, redactie en legacybinding-stylematrix. T2-REPORT.md en acceptatie.

## T3 — Meerdere dynamische velden

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
| B1 v6 | T1: alle locaties uit versiecontroleregistratie; elke versie/routefixture; geen corrupte export of legacy extensionverlies |
| B2 rechten | T1 typed command/policy/diff; T3 references en T5c expressions pas bij hun feature. Iedere introducerende stap test denial/projectie/revisie/epoch/history |
| B3 fonts | P0-tech vóór integratie; criteria/keuze goedgekeurd, geen vooraf vaststaande glyphpaden |
| B4 rekencontract | Definitief akkoord vóór T5a; voorbeeldmatrix als wiskundige tests; T5c toetst display met dezelfde AST |
| B5 ProseMirror | P0-tech vóór integratie; hard failures of ontbrekend IME-bewijs houden keuze open |
| B6 legacybinding | T1/T2 style-only en volledige levenscyclusmatrix; T3 expliciete migratie met grants/backup/undo |
| B7 export | Iedere milestone volgt architectuur sectie 17; productie-PNG-UI in T4 stelt eerdere rastergate niet uit |

Definitieve randvoorwaarden versus open implementatiekeuzes: architectuur sectie 18. Auditprobleem/bron/oplossing/risico/criterium: [TEXT-EDITOR-ARCHITECTURE-AUDIT-RESOLUTION.md](TEXT-EDITOR-ARCHITECTURE-AUDIT-RESOLUTION.md).
