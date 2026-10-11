# Teksteditor — uitvoeringsplan

Versie 1.0.0 — 2026-10-11. Status: fase-0-voorstel, wacht op goedkeuring.

Normatief ontwerp: [TEXT-EDITOR-ARCHITECTURE.md](TEXT-EDITOR-ARCHITECTURE.md). Alle werkzaamheden uitsluitend op `chatgpt/editor-development`; geen merge naar main. Bestaande wijzigingen buiten scope blijven onaangeroerd.

## Volgorde en acceptatie

Fase 0 → expliciete goedkeuring → T1 → acceptatie → T2 → acceptatie → T3 → acceptatie → T4 → acceptatie → T5a → acceptatie → T5b → acceptatie → T5c → acceptatie → T5d → acceptatie.

Een groene suite is geen gebruikersacceptatie. Iedere stap eindigt met rapport, commit/push op ontwikkelbranch en handmatige testinstructies. Preview, veiligheid en export worden vanaf hun eerste relevante milestone getest; T4/T5d zijn geen uitstel voor eerdere correctheid.

## T1 — Gestructureerde tekst en invoer

1. Leg schema, limieten, migratie en typed text.commit vast. Fixtures voor lege/alinea-/legacytekst, v6 met groepen/lagen, ongeldige inhoud, restricted velden en replay.
2. Meet een lokale ProseMirror/fontproef: selectie, IME, fontfaces, kerning, glyphpaden, licentie, bundelomvang. Bevestig keuzes tegen architectuurbudgetten vóór volledige integratie.
3. Implementeer text-content, modelvalidatie, formaatschrijven/lezen, fijnmazige commandautorisatie en atomair geschiedenisgedrag. Behoud bestaande bindings en constructietekst.
4. Bouw Tekst bewerken met toolbar, geselecteerde-fragmentopmaak, alinea's/hardBreak, lettertype/grootte/kleur/uitlijning, private undo, Annuleren/OK en SVG-preview.
5. Implementeer gedeelde lay-out/SVG en totale selectiegrenzen. Inspector opent dezelfde editor. Behoud anker, rotatie, drag, fullscreen en bestaande statische export.
6. Volledige regressie, offline SVG-proef, visuele vergelijking en T1-REPORT.md met exacte resultaten en beperkingen.

Handmatig: maak twee alinea's; formatteer afzonderlijke woorden; voeg sub/superscript toe; bekijk preview/canvas; annuleer een wijziging; bevestig en undo/redo; heropen JSON; controleer SVG en fullscreen. Open ook een oude dynamische tekst zonder verlies van binding.

## T2 — Symbolen en formules

1. MathJax/alternatief-spike met gemeten code/assets, lokale fonts, baseline en offline SVG-rastering. Leg whitelist, rendererquotas en sanitized SVG vast.
2. Activeer math-fragment en tekstschema 2; bronnotatie is autoritatief. Bouw Ω-paneel met zoeken en alle gevraagde categorieën.
3. Bewaar cursorbookmarks; formule invoegen, openen, wijzigen, verplaatsen en verwijderen als atomair fragment. Voeg toegankelijke labels toe.
4. Test x²+y²=r², sin²(θ)+cos²(θ)=1, breuk en wortel tussen tekst, inclusief kleuren/rotatie/zoom, SVG én PNG-rendering. Test onveilige macro's en stale async-resultaten.
5. T2-REPORT.md en acceptatie.

## T3 — Meerdere dynamische velden

1. Text-values en reverse dependency-index; expliciete bronstatussen en restricted redactie. Hergebruik bestaande formattering en ondersteunde eigenschappen.
2. Activeer dynamicValue/schema 3; gecontroleerde migratie van één bestaande binding naar meerdere runs. Geen stil verlies van statische terugval.
3. Bouw {}-paneel met bron/eigenschap/notatie; meerdere velden behouden hun eigen marks. Coördinatenpaar kan uit x/y worden samengesteld. Diameter/vectorcomponenten alleen na afzonderlijk gevalideerde geometrieadapter; niet als bestaande ondersteuning claimen.
4. Test bewegen, schaal/graden/radialen, bronwissen/undo, locks, verborgen bronnen, ingetrokken rechten, duplicatie met/zonder bronnen, JSON/SVG en replay.
5. T3-REPORT.md en acceptatie. Handmatig twee bronnen en drie velden gebruiken, daarna één bron wissen en herstellen.

## T4 — Afwerking en export

1. Gemengde lay-out, optionele vaste breedte/wrapping, dynamische bounds en stabiele positie afronden.
2. Productie-SVG/PNG-export met assetreadiness, zelfstandige fonts/glyphs, rasterlimieten en foutafhandeling.
3. Keyboard/focus/tabvolgorde, Escape, responsive dialog en fullscreen audit. Schermlezerlabels naast visuele glyphuitvoer verifiëren.
4. Offline roundtrip/export, screenshotvergelijking en load/performance meten. Volledige regressie; T4-REPORT.md en acceptatie.

## T5a — Veilige rekenkern

1. Grammatica, typed AST, parser/printer en quotas zonder eval/Function.
2. Pure quantity-engine met lengte-/hoekexponenten en physical/abstract-ruimte; ruwe geometrieadapter zet schaal/SI/rad één keer om.
3. Functies, domeinfouten, expliciete numerieke toleranties en afrondingsbeleid. Tests voor precedence, omgekeerde eenheden, samengestelde dimensies, powers/roots en graden/radialen.
4. Herbruikbare API los van UI; security-/wiskundige regressie. T5a-REPORT.md en acceptatie vóór calculator-UI.

## T5b — Rekenmachine

1. ∑-dialog met invoer, wetenschappelijk toetsenbord, typed bronchips, live resultaat, precisie en hoek-/eenheidskeuze.
2. Private draft, duidelijke domeinfouten, bronrechten en async/revisiegedrag. De latere invoegactie wordt pas met T5c geactiveerd; geen nog niet ondersteunde inhoud opslaan.
3. Handmatig vaste en dynamische formules, foutcorrectie, annuleren en fullscreen. T5b-REPORT.md en acceptatie.

## T5c — Berekende inlinevelden

1. Activeer calculatedValue/schema 4 en Invoegen in tekst. Bewaar AST en getypeerde bronreferenties; heropen bestaande velden.
2. Drie weergavemodi uit dezelfde AST; meerdere bronnen, veilige presentatienamen, bronremapping en dependency-updates.
3. Verifieer πr² bij 2 en 3 cm (12,57 en 28,27 cm²), afwijkende schaal, units en dynamische hoeken zonder dubbele conversie. Positie/opmaak blijven gelijk.
4. Import/export/undo/replay, restricted redactie en SVG-verificatie. T5c-REPORT.md en acceptatie.

## T5d — Kwaliteitsaudit

1. Volledige Node/Edge, netwerkloze SVG/PNG, oude documenten, permissions/locks, fuzz-/quotafixtures, accessibility en prestatievergelijking.
2. Visuele matrix met gemengde tekst, symbolen, formules, meerdere waarden/berekeningen, zoom en rotatie.
3. Documentformaat, technische contracten, gebruikersinstructies en roadmap actualiseren. T5d-REPORT.md met exacte aantallen, commit, risico's en nog nodige handmatige controles. Expliciete finale gebruikersacceptatie.

## Rapportage en fase 0

Per rapport: gewijzigde bestanden, geïmplementeerde scope, werkelijk uitgevoerde tests (pass/fail/skip), visueel bewijs, resterende risico's, commit en handmatige controles. Niet-uitgevoerde checks krijgen geen PASS.

Fase 0: 364 Node-tests geslaagd, 0 mislukt/overgeslagen; 1 volledige Edge-suite geslaagd (exit 0). Alleen documentatie toegevoegd/aangevuld. De gebruikersbeslissing betreft nu de architectuurkeuzes en toestemming voor T1; er is nog geen nieuwe teksteditor om handmatig te testen.
