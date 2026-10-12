# T5-prep — rapport UI-prototype

Versie 1.0.0 — 2026-10-12
Repository: Geert1985/wiskundige-illustratie-editor
Branch: chatgpt/editor-development
Status: geïsoleerd prototype gereed voor beoordeling; productie-integratie niet gestart

## Resultaat en beslispoort

De T5-prep ontwerpkeuzes zijn vastgelegd in moderniseringsvoorstel v1.1.0, architectuur v1.7.0, uitvoeringsplan v1.7.0 en roadmap v1.6.0. Een zelfstandig browserprototype staat in experiments/text-editor-modernization/. De bestaande productie-teksteditor, de ProseMirror-runtime, documentmodel/schema, MathSource-validator, MathFragments-renderer, permissies, documentopslag en exportcode zijn niet aangepast. De prototypebestanden vormen geen runtime-integratie.

T4 is technisch afgerond volgens T4-REPORT.md, maar de daarin genoemde handmatige gebruikersacceptatie is in deze taak niet bevestigd. Daarom is dit alleen de vooraf toegestane voorbereidende ontwerp-/prototypewerkzaamheden. T4 is niet als geaccepteerd gemarkeerd. Stop na deze oplevering; productie-integratie van T5-prep en T5a vereisen de latere gates en expliciete toestemming. De bestaande calculatorindeling T5a–T5d blijft intact.

## Vastgelegde keuzes

| Onderwerp | Besluit |
|---|---|
| Volgorde | T5-prep na T4-acceptatie en vóór T5a; handmatige T4-acceptatie blijft open |
| Contextpaneel | Desktop-overlay; begrensde mobiele sheet met eigen scroll |
| Symbolen | Eén zoekveld en categoriechips, Nederlandse UI, zoekwoorden Nederlands en Engels |
| Hostinvoeging | Unicode voor tekst; door bestaande MathSource gevalideerde LaTeX voor formules |
| Sjablonen | Eerste argument wordt geselecteerd; Tab-navigatie wacht op aparte betrouwbaarheidstest |
| Architectuur | SymbolCatalog, MathInput, FormulaEditor en TextEditor blijven gescheiden verantwoordelijkheden |
| Opslag en wiskunde | Documentmodel/schema ongewijzigd; calculator, evaluator en nieuwe parser buiten scope |

## Prototype

De proef bestaat uit index.html, styles.css, app.js, symbol-catalog.js, math-input.js en test-prototype.cjs, plus screenshots. Hij toont een mock canvas met de nieuwe editor als overlay. De editor heeft titel/context, tekstopmaak- en alineagroepen, schrijfruimte en een vaste actievoet. Het contextpaneel toont symbolen, formulebewerking of dynamische waarde-instellingen; op kleine schermen is het een begrensde sheet.

De catalogus heeft 34 symbolen in 10 categorieën, met Nederlandse/Engelse zoektermen en expliciete Unicode- en LaTeX-waarden. Gewone tekst gebruikt Unicode. Formules voegen LaTeX in op de cursor of vervangen de huidige selectie. Breuk- en wortelsjablonen markeren hun eerste invulvak en vervangen dat bij typen. MathSource valideert alle 34 catalogus-LaTeX-representaties; MathFragments/MathJax levert de lokale formulepreview. Een onveilige/onbekende opdracht zoals href wordt afgewezen.

De dynamische-waardenkaart heeft alleen voorbeeldbronnen en een vaste mockwaarde. Zij demonstreert de beoogde bediening en presentatie, maar roept de echte bronadapter, formatter, permissies, opslag of documentcommando's niet aan. De dialooginhoud wordt nooit naar het echte document opgeslagen. Dit prototype is dus geen bewijs van werking of autorisatie van dynamische productievelden.

## Screenshots en visuele vergelijking

| Bewijs | Bestand | Bevinding |
|---|---|---|
| Bestaande rich-teksteditor | [01-existing-editor.png](../experiments/text-editor-modernization/screenshots/01-existing-editor.png) | Huidige vorm en bediening als vergelijkingsbaseline |
| Nieuwe tekstopmaak | [02-prototype-text.png](../experiments/text-editor-modernization/screenshots/02-prototype-text.png) | Meer gegroepeerde primaire acties en vaste onderbalk |
| Tekstsymboolkiezer | [03-prototype-symbol-picker.png](../experiments/text-editor-modernization/screenshots/03-prototype-symbol-picker.png) | Zoeken/filteren naast schrijfruimte |
| Formulecatalogus | [04-prototype-formula-catalog.png](../experiments/text-editor-modernization/screenshots/04-prototype-formula-catalog.png) | Bestaande validatie/preview en invoegcatalogus in dezelfde context |
| Sjablooncursor | [05-prototype-formula-template.png](../experiments/text-editor-modernization/screenshots/05-prototype-formula-template.png) | Eerste breukargument geselecteerd en invoegbaar |
| Formulevoorbeeld | [06-prototype-formula.png](../experiments/text-editor-modernization/screenshots/06-prototype-formula.png) | Gevalideerde offline formulepreview |
| Mock meetwaarde | [07-prototype-values.png](../experiments/text-editor-modernization/screenshots/07-prototype-values.png) | Waarde-instellingen blijven in overlay |
| Smartphone | [08-prototype-mobile.png](../experiments/text-editor-modernization/screenshots/08-prototype-mobile.png) | Sheet, interne scroll en zichtbare hoofdacties |
| Lage vensterhoogte | [09-prototype-short-window.png](../experiments/text-editor-modernization/screenshots/09-prototype-short-window.png) | Dialog past binnen korte viewport |

Het prototype houdt het canvas en de omliggende applicatie contextueel in beeld en concentreert de invoerfuncties in één zijpaneel. De vaste primaire dialoogacties blijven los van de paneelscroll bereikbaar. Op mobiel verandert het paneel in een schermbrede begrensde sheet. Dit zijn prototypewaarnemingen; er is geen head-to-head gebruikersstudie of visuele beoordeling door de gebruiker uitgevoerd.

## Tests

Uitgevoerd met Microsoft Edge 155.0.4283.45 via Playwright en een tijdelijke localhostserver die alleen de repository serveerde. Er zijn geen nieuwe dependencies geïnstalleerd.

Resultaat: **PASS**, exitcode 0; 34 catalogusitems, 10 categorieën, nul browser page errors. De test controleert:

- bestaande editor en prototype leveren screenshots;
- alle 34 LaTeX-representaties passeren de productievalidator MathSource;
- zoeken, categorieën, symboleninvoeging in tekst op opgeslagen cursorpositie;
- formulecursorinvoeging en vervangen van selectie midden in de formule;
- eerste invulpositie en typen door het slot van breuk- en wortelsjabloon;
- lokale MathJax-preview werkt zonder externe fonts; onveilige opdracht wordt geweigerd;
- genest Escape sluit eerst de catalogus en daarna de formulemodus; annuleren herstelt de demotekst;
- mock-meetwaarde wordt bijgewerkt en als mock inline-element ingevoegd;
- Tab-focus blijft binnen de dialoog;
- geen horizontale document-/dialoogoverflow, dialooghoogte blijft bij openen van paneel gelijk en actievoet blijft zichtbaar.

| Viewport | Dialooghoogte | Dialoog scrollbreedte/clientbreedte | Actievoet zichtbaar |
|---|---:|---:|---|
| 1280 × 900 | 760 px | 998 / 998 px | ja |
| 768 × 900 | 760 px | 738 / 738 px | ja |
| 390 × 844 | 834 px | 378 / 378 px | ja |
| 1280 × 580 | 564 px | 998 / 998 px | ja |

Handmatig/niet uitgevoerd: echte IME-compositie; toetsenbordbediening met fysieke apparatuur; schermlezer en andere assistieve technologie; echte productiebronkeuze, bronlees-/displayrechten en intrekking; ProseMirror-bookmarkintegratie in de nieuwe panelen; aanmaken/bewerken van productieobjecten; productie-JSON/undo/redo/replay; daadwerkelijke SVG/PNG-roundtrip in andere viewers; gebruikersbeoordeling van de screenshots. Geen van deze punten is als PASS geclaimd.

## Vergelijking en ontwerpbeoordeling

De proef valideert de technische richting voor de catalogus en LaTeX-invoeging zonder tweede parser, plus de vaste editorvoet en responsieve paneelvorm. De directe formule-invoeging werkt in de standalone HTML-inputselectie. Dat bewijst op zichzelf niet dat de ProseMirror-bookmark behouden blijft wanneer in productie focus naar een contextpaneel wisselt; die integratie vereist gerichte tests.

Nog te beoordelen: uiteindelijke desktopbreedte en overlayplaatsing; compactheid van de werkbalk; leesbaarheid van symbolen op mobiel; gedrag met echte formules, tekstlengtes en fonts; Tab-navigatie tussen meerdere templateargumenten. Het eerste argument is getest; Tab is nadrukkelijk niet geïmplementeerd/geaccepteerd.

## Integratierisico's en aanbevolen volgorde

1. Rond T4 handmatige acceptatie en eventuele noodzakelijke correcties af.
2. Laat de gebruiker het voorstel, prototype en dit rapport beoordelen. Geen productie-integratie zonder expliciete toestemming.
3. Bouw na die toestemming de UI-structuur in de bestaande dialoghost en behoud de huidige ProseMirror-transactiegrens, rich-text undo, focus/bookmarkherstel en lokale export-readiness.
4. Integreer per incrementeel fragmenttype opslag, undo/redo, JSON, restricted-projectie, SVG en offline PNG; behoud legacytext en bestaande textBinding.
5. Hergebruik uitsluitend MathSource/MathFragments. Valideer elk Unicode-/LaTeX-paar tegen dezelfde whitelist en test offline fonts/glyphs. Verbreed die whitelist pas met expliciet bewijs.
6. Sluit dynamische waarden aan via dezelfde geautoriseerde sourceOptions/resolveValue-routes als productie. Controleer display/read grants, locks, revisions en permission epoch; de prototype-mock mag nooit als fallback in productie terechtkomen.
7. Test na de productie-integratie Node/Edge, echte IME/AT waar beschikbaar en save/reload/export. T5a blijft afzonderlijk afhankelijk van T4-acceptatie, T5-prep-acceptatie en de definitieve mathematische goedkeuring.

## Open punten

- Handmatige T4-acceptatie: nog vereist.
- Gebruikersbeoordeling van het prototype en toestemming voor integratie: nog vereist.
- Tab-navigatie tussen templateargumenten: bewust niet besloten; alleen toevoegen na proef.
- IME, schermlezers, echte bronrechten en productie-export: niet onderzocht door deze geïsoleerde prototypeproef.
- Definitieve mathematische contractgoedkeuring vóór T5a: blijft een onafhankelijke gate.
