# Voorstel — Modernisering teksteditor en gedeelde wiskundige invoer

Versie 1.2.0 — 2026-10-12
Repository: Geert1985/wiskundige-illustratie-editor  
Branch: chatgpt/editor-development  
Scope: goedgekeurd T5-prep-ontwerp, prototype en I1-I4-productie-integratie. De calculator-milestones T5a–T5d zijn niet gestart.

## Status en besluitpoort

De T4-implementatie blijft wachten op formele handmatige gebruikersacceptatie. De T5-prep-productie-integratie is uitgevoerd op expliciete opdracht na gerichte T4-regressiecontrole, zonder T4 namens de gebruiker af te sluiten. I1-I4 zijn technisch opgeleverd op chatgpt/editor-development; zie [T5-PREP-INTEGRATION-REPORT.md](T5-PREP-INTEGRATION-REPORT.md) voor commits en testbewijs. T5a–T5d blijven afzonderlijke calculator-milestones. T5a vereist nog steeds definitieve goedkeuring van het rekencontract én afzonderlijke starttoestemming.

De productie-integratie behoudt ProseMirror, MathSource, MathFragments, typed text.commit, de bestaande bronrechten, v7/document-schema's en legacy textBinding. Ze wijzigt de vormgeving en invoeglaag, niet het documentmodel. De I1-I4 implementatie is niet gelijk aan T4-acceptatie of T5-prep-gebruikersacceptatie.

## 1. Huidige architectuur

### Dialoog en vormgeving

De teksteditor staat als native dialog in editor.html. De dialoog bevat een horizontale tekstopmaakwerkbalk, een stabiele rich-textsurface, daaronder één textInsertPanel voor symbolen, formulebewerking en dynamische waarden, en de acties onderaan. Het paneel groeit in de documentflow wanneer het wordt geopend. De bestaande CSS begrenst de dialooghoogte en laat die scrollen, maar het invoerpaneel is zelf geen overlay of compacte zijkaart. De acties zijn niet als vaste onderbalk ontworpen. Dit verklaart de gemelde instabiliteit van de vensterhoogte en het risico dat de acties buiten beeld raken.

De werkbalk bevat al basisopmaak, superscript/subscript, lettertype, grootte, kleur, alinea-uitlijning, breedte, symbolen, dynamische waarden, formules en lokale undo/redo. T4 voegde breedte, wrapping, responsive afmetingen, focusherstel en fullscreengedrag toe. De modernisering moet deze bestaande functies ordenen en compact presenteren, niet vervangen.

### Rich-text en selectie

rich-text-editor.js is de ProseMirror-adapter. Het vertaalt het applicatiemodel naar een privé ProseMirror-document en terug; JSON bewaart geen ProseMirror-document. Tekst, alinea's, hardBreaks, marks, formule-atomen en dynamische waarde-atomen hebben verschillende typen. De adapter biedt selectiebookmarks, herstel van een bookmark, tekstinvoeging, formule- en waarde-invoeging, lokale undo/redo en handlers voor het bewerken van atomische velden. Een bookmark wordt alleen hersteld als het oorspronkelijke ProseMirror-document nog actueel is.

text-insert-panel.js bewaart die ProseMirror-bookmark terwijl het invoerpaneel de rich editor tijdelijk niet-bewerkbaar maakt. Bij sluiten wordt de bookmark hersteld en krijgt de editor focus terug. Dit is een bruikbare basis voor popovers. Er bestaat echter nog geen cursor-/selectiecontract voor het invoegen in het LaTeX-inputveld zelf: het formuleveld is een gewone input en de huidige paneelcode opent er geen symbolenkiezer bovenop.

### Symbolen, LaTeX en preview

De symbolen en categorieën staan momenteel als vaste arrays in text-insert-panel.js. Er is een Griekse, Engelse en Nederlandse benaming, maar geen zelfstandige doorzoekbare catalogusmodule met stabiele IDs en aparte Unicode-, LaTeX- en sjabloonrepresentaties. Sommige symbolen hebben een glyphSource en worden daardoor als formule-atoom ingevoegd wanneer een fontglyph ontbreekt; andere worden als Unicode-tekst in de rich editor gezet. Die contextafhankelijke keuze is nu verweven met de klikhandler.

LaTeX-invoer volgt een andere route. math-source.js valideert een begrensde presentatietaal en weigert onbekende/actieve inhoud; deze taal is geen rekenmachine-evaluator. math-fragments.js gebruikt de bestaande MathJax-bundle om een begrensde zelfstandige SVG-box te maken. Dezelfde formulebron wordt in editor, model en renderer opnieuw gevalideerd. De formule-preview roept de bestaande MathFragments-route aan en heeft een serial-check voor verouderde asynchrone resultaten. Deze renderer en whitelist moeten behouden blijven; de symbolencatalogus mag geen tweede formuleparser of evaluatiemodel introduceren.

Momenteel kan de gebruiker vanuit gewone tekst het symbolenpaneel of de formulebewerker openen. Een bestaande formule wordt via dubbelklik of Enter als atom geselecteerd en heropend. Binnen die formulebewerker bestaat alleen het LaTeX-veld, de preview, toepassen en foutmelding. Het symbolenpaneel en de formuleditor zijn wederzijds exclusieve modi; er is dus geen directe invoeging op de cursorpositie in een formule.

### Dynamische tekst en documentintegratie

Hetzelfde invoerpaneel heeft een derde modus voor dynamische waarden. De bron- en eigenschapsopties worden door editor.js gefilterd met de actieve bronrechten; MI.TextValues valideert binding en notatie en resolveValue levert de actuele waarde. De editor toont onder meer precisie, eenheid, hoekeenheid, prefix en suffix. Invoegen en bewerken veranderen de private tekstdraft; de buitenste text.commit valideert rechten, locks, revisie en permission epoch. JSON bevat de getypeerde binding, terwijl SVG de actuele toegestane waarde rendert.

Deze grenzen zijn belangrijk: verplaats geometriebronautorisatie niet naar een visuele popover of de symbolencatalogus. Het modulaire UI-ontwerp moet dezelfde resolvers en commitgrens gebruiken, inclusief T3-redactie en T4-exportguards.

### Modules, overlap en historische correcties

De relevante verantwoordelijkheden zijn al herkenbaar, maar de invoer-UI is gegroeid in één controller:

- editor.js beheert dialooglevenscyclus, geselecteerd object, revisions/permission epoch, bronopties, het buitenste commit en focusherstel.
- rich-text-editor.js is de vervangbare ProseMirror-adapter en beheert rich-textselectie, atomische velden en lokale geschiedenis.
- text-insert-panel.js bevat tegelijk de lokale symbolendata, zoeken/categoriefilter, formulebron/preview, dynamische waarde-instellingen, invoeging en focus/annulering.
- math-source.js en math-fragments.js scheiden veilige formulevalidatie van MathJax-weergave.
- text-content/model.js, permission-runtime.js, text-values.js en renderer.js blijven eigenaar van opgeslagen inhoud, rechten, bronresolutie en SVG.

Historie toont een opeenvolgende T1→T2→T3→T4-uitbreiding op dezelfde editorarchitectuur. T2 bracht symbolen en formules samen in text-insert-panel.js; T3 voegde dynamische waarden aan dezelfde module toe; T4 voegde breedte en export/focusgedrag toe. Ik vind geen tweede productieformule-renderer of tweede rich-textdocumentmodel. Wel is er overlappende verantwoordelijkheid binnen text-insert-panel.js en een verborgen textValue fallback in de buitenste editor voor oude/plain invoer. Die fallback is compatibiliteitsgedrag, geen tweede zichtbare editor. Verwijder hem niet zonder een afzonderlijke compatibiliteitsinventaris.

T4 bevat concrete fixes voor stale exports, fontfamilienamen, metadata en native-font-PNG-rasterisatie. T2 en T3 hebben eveneens afzonderlijke fixes en rapporten voor stale preview/permission states. Het voorstel vraagt daarom geen brede herschrijving: behoud adapter, transactiegrens, parser en renderer en verplaats alleen verantwoordelijkheden waar de nieuwe tests een concreet voordeel tonen.

## 2. Ontwerpvoorstel voor de gebruikersinterface

Gebruik een donkere dialoog die aansluit op het bestaande thema, met goud alleen voor actieve of primaire acties. Verdeel de dialoog in drie zones met vaste hiërarchie:

1. Een compacte titel-/contextregel met naam van het object of “Nieuwe tekst”.
2. Een gegroepeerde werkbalk en centrale, stabiele editorruimte.
3. Een onderbalk die binnen de dialoog zichtbaar blijft, met Annuleren en Toevoegen/Toepassen.

Groepeer de werkbalk in Tekst, Invoegen en Alinea. Houd frequente opmaak direct bereikbaar. Lettertype, grootte en kleur kunnen compacter worden gegroepeerd; behoud een toegankelijke naam voor elk veld. Zet Symbolen, Formule en Dynamische waarde onder één Invoegen-groep. Breedte en uitlijning horen bij Alinea/opmaak. Toon een actieve markering wanneer een opmaakkeuze op de selectie of invoerpositie van toepassing is.

Op desktop blijft de editorhoogte stabiel. Een contextpop-over of smal zijpaneel toont de symbolencatalogus, formule-invoer/preview of waarde-instellingen. Het opent binnen de dialoog en duwt de editor en onderbalk niet omlaag. Waarde-instellingen kunnen intern scrollen. Op kleine schermen wordt het paneel een begrensd overlay-/sheetgebied met eigen scrolling; de editor blijft bereikbaar en de onderste acties blijven in beeld. Houd de editor zelf scrollbaar en respecteer de viewporthoogte. De exacte paneelbreedtes en breakpoint moeten in de eerste UI-proef tegen 1280-, tablet- en 390-pixel screenshots worden afgesteld.

De formulemodus krijgt een LaTeX-invoerveld en live preview in hetzelfde contextpaneel. Een knop Symbolen opent daar de universele catalogus zonder de formulebewerking te verlaten. Ongeldige invoer houdt de bron bewerkbaar, toont een concrete fout en schakelt toepassen uit. De invoeg-/bewerkknop heet bij een nieuw tekstobject Toevoegen en bij een bestaand object Toepassen.

## 3. Catalogus en invoegarchitectuur

### Centrale SymbolCatalog

Maak één UI-onafhankelijke, immutable catalogus met expliciete categorieën en stabiele items. Een definitie bevat ten minste:

- stabiele id en categorie;
- zichtbaar label, Unicode-vorm en Nederlandse/Engelse zoekwoorden;
- LaTeX-representatie voor formulecontext, waar beschikbaar;
- type simple-symbol of template;
- voor een template: LaTeX-fragment en expliciete invulplaatsen.

De catalogus bezit geen DOM, ProseMirror, MathJax, documentmodel, source IDs of rekenlogica. Zoeken en categorie-filtering horen bij de catalogus-API of een pure helper, niet bij de UI-renderhandler. Leg mappinggevallen expliciet vast: elk catalogusitem geeft aan of het in gewone tekst Unicode is, in een formule LaTeX is, of als formule-atoom moet worden gebruikt omdat lokale tekstfonts geen glyph hebben. Geen stil verlies of leeg karakter.

Minimale categorieën: Griekse letters; rekenkundige operatoren; relaties; verzamelingenleer; logica; analyse/calculus; vectoren/pijlen; meetkunde; en wiskundige structuren. Houd gewone symbolen gescheiden van sjablonen voor breuk, wortel, som en integraal. Voeg alleen opdrachten toe die de bestaande MathSource-whitelist accepteert; onbeschikbare TeX-structuren blijven uitgeschakeld of krijgen een expliciet niet-beschikbaar label totdat de presentatielaag ze veilig ondersteunt.

### MathInput als invoegadapter

Een kleine contextadapter zet een catalogusitem om in de actieve invoerrepresentatie:

- Gewone ProseMirror-tekst: Unicode invoegen op de opgeslagen bookmark; een selectie vervangen; daarna editorfocus herstellen.
- Formuleveld: LaTeX invoegen op de vastgelegde selectionStart/selectionEnd van het inputveld; selectie vervangen; caret/focus herstellen; de bestaande MathSource-validatie en preview laten draaien.
- Formulesjabloon: template invoegen en caret selecteren op de eerste lege argumentpositie. Houd posities expliciet ten opzichte van de ingevoegde LaTeX-string; vermijd conventies die een cursor achteraan laten staan.

Bewaar twee afzonderlijke selectietoestanden: de ProseMirror-bookmark waarmee de formule/modal is geopend, en de formule-inputrange die hoort bij de LaTeX-editor. Bij openen van de popover wordt de formule-inputrange vastgelegd; bij activeren van een catalogusitem wordt die hersteld na focuswissel. Annuleren sluit de catalogus zonder formulewijziging en keert terug naar dezelfde tekstselectie. Acceptatie wijzigt alleen de private tekstdraft. De buitenste Annuleren blijft alle wijzigingen verwerpen.

Test ook async grenzen: een late font-/formulepreview, het sluiten van de formulekaart, objectwissel of permission-epochwijziging mag geen oud resultaat terugschrijven. De catalogus zelf krijgt geen brondata of toestemming; dynamische waardeselectie blijft via de bestaande geautoriseerde host lopen.

### FormulaEditor en TextEditor

Behoud MI.MathSource als presentatievalidator en MI.MathFragments als SVG-renderer. Een FormulaEditor-controller kan de invoerbron, cursorrange, previewstatus en validatiefout beheren en MathInput-context bieden. Hij kent geen ProseMirror-document of documentcommit. De TextEditor-host verbindt hem met de bestaande atomselectie, marks, bron-/waardehandlers en text.commit-lifecycle.

Breid geen API uit omwille van architectuurplaatjes. Eerst kan text-insert-panel.js worden opgesplitst in een pure catalogus, een formule-controller en een dunne paneelhost, als de UI-tests deze grenzen bevestigen. De bestaande broninstellingen kunnen in de UI als eigen kaart/paneel blijven en hun resolvercontract behouden. Geen nieuwe evaluatie-API, geen LaTeX-naar-AST evaluatie en geen documentmodelwijziging.

Voor de toekomstige calculator mag dezelfde catalogus worden gebruikt. De calculator krijgt een afzonderlijke invoegadapter naar zijn eigen getypeerde expressie-input en T5a-engine; LaTeX is daarbij geen intern rekenformaat. Dit blijft alleen een uitbreidingspunt, geen calculatorimplementatie in deze modernisering.

## 4. Compatibiliteit en gegevensbehoud

De voorgestelde modernisering is primair UI en pure invoerlogica. Behoud documentversie 7 en textContent-schema 1, 2 en 3. Behoud bestaande tekst, marks, breedte, math-source, dynamische bindingen en format ongewijzigd. Nieuwe symbolen voegen bestaande Unicode-tekst of bestaande gevalideerde math-atomen in; nieuwe formule-sjablonen bewaren alleen de bestaande math.source-string. Er is geen automatische migratie.

Een catalogusversie is UI-/codeversie en wordt niet naar document-JSON geschreven. Stabiele catalogus-ID's zijn geen documentfragment-ID's. Bestaande formules moeten zonder herschrijven kunnen worden geopend, geannuleerd, toegepast en opnieuw opgeslagen. dynamischeValue-velden blijven getypeerde schema-3-runs; geen UI-refresh mag een bronbinding of format laten vallen. Verborgen legacy-textBinding blijft via de bestaande migration-/stylepaden behandeld en mag niet langs de nieuwe formule- of catalogusadapter migreren.

Opslag- en exportacceptatie blijven gelden bij elk fragment dat wordt aangepast: JSON roundtrip/herladen, SVG en offline PNG, math-atomen en bronwaarden, restricted redactie, undo/redo en legacy documentfixtures.

## 5. Test- en acceptatieplan

### Catalogus

- Alle IDs uniek en stabiel; categorieën volledig; zoektermen werken hoofdletterongevoelig en met Nederlandse namen.
- Unicode-/LaTeX-mapping is expliciet; unsupported glyphs geven veilige formuleweergave of duidelijke onbeschikbaarheid.
- Sjablonen voor breuk, wortel, som en integraal valideren tegen de whitelist of zijn expliciet uitgeschakeld. Geen item passeert MathSource door UI-escape.
- Catalogus bevat geen DOM- of documentafhankelijkheden en maakt geen calculator- of evaldependency.

### Invoeging en formulebewerking

- Unicode invoegen in lege tekst en midden in tekstrun; selectie vervangen; caret en ProseMirror-bookmark over popover/focuswissel behouden.
- LaTeX-symbolen op begin, midden en einde van een formule invoegen; geselecteerde formuletekst vervangen; caret na invoeging juist herstellen.
- Template-invoeging plaatst de cursor in de eerste invulpositie; Tab of expliciete navigatie kan door invulposities gaan zonder documentcontent te verstoren.
- Formule-preview ververst bij elke geldige wijziging. Onjuiste/verboden TeX geeft fout en blokkeert toepassen; late resultaten na sluiten of annuleer worden genegeerd.
- Annuleren van popover, formulekaart en buitenste dialoog houdt respectievelijk de eerdere formule, private draft en opgeslagen documentstatus intact.

### Rich text, brondata en export

- Bewerken/annuleren/bevestigen van dynamische velden behoudt binding, property, precision, unit, angle, prefix, suffix en marks.
- Bronrechten, hidden/denied/stale waarden, permission-intrekking, locks, documentrevisies en restricted redactie gedragen zich identiek aan de bestaande tests.
- Undo/redo: lokale opmaak/formulewijziging; buitenste text.commit als één documentactie; opnieuw openen en annuleren na import.
- Test bestaande en nieuwe v7 documenten met schema 1–3, oudere v1–v6 fixtures, legacy textBinding, groepen/lagen en denied-source exports.
- SVG en offline PNG met gemengde tekst, elk catalogussymbool, iedere formuletemplate, dynamische waarde, marks, rotatie, vaste breedte, offline assets en laagvolgorde.

### Interface en toegankelijkheid

- Desktop/tablet/390px en lage viewporthoogte: editor blijft bruikbaar, panelen scrollen binnen hun gebied en acties blijven bereikbaar; openen/sluiten vergroot de dialoog niet onverwacht.
- Tabvolgorde, zichtbare focus, labels/statusmeldingen, toetsenbordselectie, Escape-hiërarchie en focusherstel voor toolbar, popover en dialog.
- Handmatige IME-compositie en schermlezerproef in Edge/Windows blijven expliciete controles; automatiseerbare keyboardchecks vervangen ze niet.
- Fullscreen, offline gebruik, open/annuleer/heropen, selectie op atom, documentundo/redo en export worden in Edge getest.

Gebruik bestaande testlagen waar passend: tests/text-editor-t1.test.cjs t/m text-editor-t4.test.cjs, tests/browser-rich-text.cjs, browser-rich-math.cjs, browser-rich-values.cjs en browser-rich-layout.cjs, plus document-, permission-, import/history-, replay-, fullscreen- en exporttests. Voeg alleen gerichte tests toe voor nieuwe catalogus- en input-adaptercontracten. Per implementatiemijlpaal zijn Node- en Edge-regressie en opslag/export van de betrokken bestaande fragmenttypen verplicht.

## 6. Bestanden en verantwoordelijkheden die vermoedelijk geraakt worden

| Bestand/module | Waarschijnlijke rol bij goedgekeurde implementatie |
|---|---|
| editor.html / editor.css | Compacte toolbar, stabiele dialoogzones, responsive contextpaneel en bereikbare actiebalk |
| text-insert-panel.js | Terugsnoeien tot paneelhost/controller; geen hardcoded catalogus behouden |
| nieuwe symbol-catalog.js (alleen indien nuttig na proef) | Pure categorieën, stabiele items, zoekmetadata, Unicode/LaTeX/template mappings |
| nieuwe math-input.js (alleen indien nuttig na proef) | Contextafhankelijke invoeg- en cursoradapter; geen evaluator |
| rich-text-editor.js | Alleen beperkte bookmark/invoeg API als bestaande API aantoonbaar tekortschiet |
| editor.js | Dialoghost/focus/commit/lifecycle; autorisatie blijft bij bestaande service |
| math-source.js / math-fragments.js | Bestaande validator en renderer behouden; whitelist alleen wijzigen na apart bewijs |
| tests/text-editor-*.cjs en tests/browser-rich-*.cjs | Gerichte tests voor catalogus, cursor/selection, UI en export |
| build/test manifesten | Registratie van nieuwe browserbestanden en modulevolgorde indien nieuwe modules gekozen worden |

Wijzig geen model.js, permission-runtime.js, text-content schema of exportcontract voor uitsluitend een UI-verbetering.

## 7. Risico's, complexiteit en volgorde

Belangrijkste risico's zijn cursorposities verliezen bij focuswissel, TeX-inserts toestaan die de whitelist afwijst, fontglyphs die in één context ontbreken, onbedoelde conversie van math-atomen naar tekst, en verlies van dynamicValue-referenties bij heropenen/toepassen. ProseMirror bookmarks zijn documentgebonden; LaTeX selectionStart/End zijn aparte UTF-16 offsets. Dit moet als twee adaptercontracten worden getest.

Geschatte omvang: middelgroot tot groot, circa 6–10 ontwikkelaarsdagen voor catalogus, formule-contextinvoeging, dialooglayout en volledige Node/Edge-integratie, plus handmatige IME/AT-acceptatie en eventuele iteratie op visueel ontwerp. Dit is een raming, geen gemeten doorlooptijd. Het meeste risico ligt in selectie-/focusbeheer en responsive dialooggedrag; bestaande math parser, renderer en documentmodel verlagen het opslag- en wiskunderisico.

Uitvoering van de goedgekeurde I1-I4-volgorde:

1. T4 regressie is vóór integratie gericht en na integratie volledig herhaald; formele handmatige acceptatie blijft open.
2. De gebruiker heeft productie-integratie van I1-I4 expliciet opgedragen.
3. Catalogus-, cursor-, preview- en dynamische-waardenlogica zijn geïntegreerd via aparte controllers met de bestaande parser, renderer en rechtenservices.
4. Gerichte en volledige Node/Edge-tests controleren bewerken, selectie, anuleren, undo/redo, rechten, JSON, SVG/PNG en fullscreen; de integratierapportage bevat de exacte aantallen.
5. Echte IME-/AT-tests en handmatige eindbeoordeling zijn niet uitgevoerd.
6. T5a blijft apart: pas starten na T4-acceptatie, T5-prep-acceptatie, definitieve goedkeuring van het rekencontract en expliciete starttoestemming.

## 8. Vastgelegde ontwerpkeuzes (1.2.0)

De gebruiker heeft het voorstel voorwaardelijk goedgekeurd en opdracht gegeven de keuzes vast te leggen en een geïsoleerd prototype te bouwen.

| Onderwerp | Besluit |
|---|---|
| Milestone en volgorde | T5-prep I1-I4 is op expliciete opdracht uitgevoerd na gerichte T4-regressie; T4-handmatige acceptatie blijft open. T5-prep wacht op eigen gebruikersacceptatie en start T5a niet. |
| Desktopcontextpaneel | Compacte overlay naast de schrijfruimte, zonder de dialooghoogte te veranderen. |
| Mobiele contextinterface | Begrensde sheet met eigen scrollgebied; hoofdacties blijven zichtbaar. |
| Symbolencatalogus | Eén zoekveld met filterchips over 10 categorieën. |
| Sjabloonnavigatie | Invoegen selecteert betrouwbaar het eerste argument. Tab-navigatie alleen toevoegen nadat een aparte proef betrouwbaarheid aantoont. |
| Onbekende glyphs | Elke catalogusvermelding kiest expliciet Unicode voor tekst en gevalideerde LaTeX voor formules. |
| Taal en zoekwoorden | Nederlandse interface, Nederlandstalige en Engelstalige zoekwoorden. |
| Vormgeving | Donker thema met terughoudende gouden accenten, afgestemd op de bestaande applicatie. |
| Documentmodel | Ongewijzigd; geen nieuwe opslagvelden, documentversie of migratie in T5-prep. |
| Rekenfunctionaliteit | Buiten scope; het bestaande T5a–T5d-contract en de nummering blijven behouden. |

### T5-prep-prototype-uitkomst (historisch)

Een geïsoleerd prototype staat in experiments/text-editor-modernization/. Het demonstreert een tekstdialoog, invoegwerkbalk, symbolencatalogus, formulebewerking op cursor/selectie, breuk- en wortelsjablonen met eerste argumentselectie, dynamische-waardepaneel met mockgegevens, Escape/focus en responsieve overlay/sheet. De bestaande MathSource-validator en MathFragments/MathJax-renderer leveren formulevalidatie en lokale preview; er is geen tweede parser of renderer toegevoegd. De mock-waardeselector is expliciet niet gekoppeld aan productiebronnen en doet geen autorisatie- of documentwerk.

Het prototype was geïsoleerd en wijzigde geen productie-editor; het blijft de visuele bronreferentie. De productie-integratie is afzonderlijk uitgevoerd en beschreven in [T5-PREP-INTEGRATION-REPORT.md](T5-PREP-INTEGRATION-REPORT.md). T5-prep wacht op handmatige gebruikersacceptatie. De technische oplevering start T5a niet.

## 10. T5-prep productie-integratie (1.2.0)

I1 levert de responsieve editor-shell en overlay. I2 haalt symbolen naar een pure centrale catalogus. I3 scheidt ProseMirror-hostinvoeging, formuleveldselectie, templateposities en preview. I4 gebruikt een zelfstandige controller voor dynamische waarden die alleen bestaande geautoriseerde bronopties, TextValues en resolver gebruikt. Document v7, textSchema 1-3, exports en legacy textBinding blijven behouden.

De integratie is technisch gereed, gepusht op de ontwikkelbranch en wacht op handmatige acceptatie. T4-handmatige acceptatie blijft eveneens open. Echte IME-/schermlezercontroles en finale handmatige visuele review zijn niet uitgevoerd. T5a blijft buiten scope en vereist afzonderlijk akkoord.
