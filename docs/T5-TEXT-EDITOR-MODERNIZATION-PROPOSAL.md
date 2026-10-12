# Voorstel — Modernisering teksteditor en gedeelde wiskundige invoer

Versie 1.0.0 — 2026-10-12  
Repository: Geert1985/wiskundige-illustratie-editor  
Branch: chatgpt/editor-development  
Scope: architectuuraudit en ontwerp. Er is geen productiecode gewijzigd en T5-implementatie is niet gestart.

## Status en besluitpoort

De ontwikkelbranch staat op commit dd09b2d. T4-code is geïntegreerd op die branch; de laatste T4-regressie telde 449/449 Node-tests en 50 Edge-testmodules. Het T4-rapport noemt de implementatie technisch opgeleverd, maar vraagt nog handmatige gebruikersacceptatie. Deze audit sluit die acceptatie niet namens de gebruiker af. De bestaande roadmap vereist bovendien definitieve goedkeuring van het rekencontract vóór T5a.

Er is een naamconflict dat vóór uitvoering moet worden opgelost: de huidige architectuur gebruikt T5a–T5d al voor de veilige rekenkern en de zelfstandige/inline rekenmachine. Dit voorstel beschrijft een tweede initiatief dat eveneens T5 heet. Aanbeveling: positioneer de teksteditor-modernisering als afzonderlijke voorbereidende milestone na T4-acceptatie en vóór T5a, onder een naam als T5-prep. Zo kan de catalogus vóór de calculator worden hergebruikt en hoeft de bestaande T5a–T5d-indeling niet dubbel te worden gebruikt. Werk de roadmap en acceptatievolgorde pas bij na expliciete goedkeuring van dit voorstel.

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

Aanbevolen volgorde na akkoord:

1. Sluit eerst T4 handmatige acceptatie en keur het T4 resultaat expliciet goed; los open punten op voordat een nieuwe milestone begint.
2. Beslis over de milestoneconflictnaam en plaatsing van dit werk ten opzichte van T5a–T5d. Keur daarnaast het bestaande wiskundige contract goed voordat T5a wordt gestart.
3. Maak een geïsoleerde UI-proef met vaste editorhoogte, contextpaneel en sticky actiebalk; meet desktop/mobile screenshots en toetsenbordroute.
4. Implementeer en test daarna de pure catalogusmapping zonder editorwijziging. Beoordeel whitelistdekking en fontfallbacks.
5. Voeg MathInput voor tekst en formule toe; bewijs begin/midden/einde, selectie, templatecursor, cancel, focus en stale preview in Edge.
6. Integreer de compacte dynamische waardenkaart via bestaande sourceOptions/resolveValue. Verifieer grants, T3-schema en T4-export.
7. Draai volledige regressie, offline JSON/SVG/PNG en handmatige IME/AT-controles; rapporteer feitelijke uitkomsten en stop voor gebruikersacceptatie.

## 8. Open ontwerpkeuzes voor goedkeuring

1. Milestone-ID: T5-prep vóór de calculator, of een andere expliciete naam/plaatsing? De bestaande roadmap reserveert T5a–T5d voor de calculator.
2. Desktopcontextpaneel: overlay boven editorruimte of rechter zijpaneel binnen de dialoog? Aanbeveling: overlay op desktop, begrensde sheet op smalle schermen, met geen verandering aan de dialoghoogte.
3. Zoekt de catalogus tegelijk in alle categorieën en toont hij categorie-filters, of opent iedere werkbalkknop een vooraf gefilterde categorie? Aanbeveling: één zoekveld plus filterchips.
4. Integraal- en sommatie-invoervelden: zijn ze beperkt tot de bestaande MathSource-syntax en eerste cursorpositie, of is Tab-navigatie tussen lege argumenten een vereiste? Aanbeveling: implementeer Tab-navigatie alleen als proef betrouwbaarheid aantoont.
5. Onbekende Unicode-/fontglyphs: automatisch als formule-atoom invoegen of de gebruiker expliciet laten kiezen? Aanbeveling: catalogusitem bepaalt expliciet de route, met zichtbare formulepresentatie.
6. Taal: alleen Nederlandstalige labels/zoekwoorden of ook Engelse zoekwoorden zoals de huidige lijst? Aanbeveling: beide zoeken, Nederlandse interface.

## Opleveringsstatus

Dit document is het ontwerpvoorstel. Er zijn voor deze opdracht geen tests uitgevoerd en geen implementatie- of roadmapbestanden gewijzigd. Productiecode en dependencies zijn ongemoeid gelaten. De implementatiepoort blijft gesloten totdat T4 handmatig is geaccepteerd, de milestonevolgorde is vastgelegd en dit voorstel expliciet is goedgekeurd.
