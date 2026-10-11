# Teksteditor — afhandeling architectuuraudit B1–B7

Versie 1.0.0 — 2026-10-11. Status: ontwerpcorrecties voorgesteld, geen definitieve architectuurgoedkeuring of T1-implementatie.

Repository Geert1985/wiskundige-illustratie-editor; branch chatgpt/editor-development. Onderzochte runtimebaseline 64ba1a2; vorige documentatie cc23585. Bronregelnummers hieronder verwijzen naar die ongewijzigde code. Dit rapport beschrijft oplossingen in het ontwerp, niet dat hun code/tests al bestaan.

Leidend: [architectuur 1.1.0](TEXT-EDITOR-ARCHITECTURE.md), [plan 1.1.0](TEXT-EDITOR-IMPLEMENTATION-PLAN.md). Alleen deze drie documenten worden in deze correctie gewijzigd. Bestaande FEATURE-GAP-ANALYSIS.md blijft onaangeroerd.

## B1 — Documentformaat v6

**Probleem:** eerdere beschrijving gaf geen formele migratiematrix en onvoldoende inventaris van exacte versiecontroles. Alleen MODEL_VERSION verhogen zou de bestaande validatievoorwaarden veranderen; layers verdwijnen bij een naïeve v6-uitbreiding.

**Bron:** model.js:11/219/222–223/231/238/250–256; permission-runtime.js:177; editor.js:844; index.js:185–199; editor-history.js:9/27–33; persistent-groups.js en document-layers.js; semantic-sequence.js:13–18. Repositorybrede zoekactie vond documentversievertakkingen uitsluitend in model, permission-runtime en het nieuwe-documentliteral in editor. Replay version 1 is een ander artefactformaat.

**Gekozen ontwerpoplossing:** expliciete v1–v6-dispatch, readermaximum los van basisversie, root/object textSchema en feature-afhankelijke schemas. Formele matrix in sectie 11. Lagen/groepen in v6 valideren/exporteren op aanwezigheid; gereserveerde oude opaque rootextensions niet overschrijven. Restricted export bepaalt versies na projectie. Replayartifact blijft version 1 met expliciete nieuwe commandallowlist.

**Risico:** corrupte restricted JSON, stille organisatie-/extensionverliezen en te permissieve reader. Oude readers kunnen v6 niet lezen; geen automatische flatten-downgrade.

**Acceptatie:** alle v1–v6/routefixtures uit sectie 11; ongeldige schemas atomair afgewezen; mixed rich+lagen+groepen+constructies/assen behouden; restricted JSON opnieuw importeerbaar; bestaande replay-ID's onveranderd. Dit moet T1 uitvoeren, nu niet getest.

## B2 — Autorisaties

**Probleem:** inhoud/marks/bron/AST in één payload konden bestaande fieldgrants onbedoeld uitbreiden; revisie en autorisatie-epoch waren onvoldoende concreet.

**Bron:** permission-runtime.js:23/39–52 (velden/policy), 85/96 (commandenvelope/revisie), 100–110 (writable/binding), 143–166 (create/duplicate/history/postvalidatie), 169–177 (projectie/export), 208/236–239 (policyepoch/handles); semantic-sequence.js:5/16 (allowlist/replay). AuthorCommands staat in permission-runtime.js, geen afzonderlijk author-commands.js-bestand.

**Gekozen ontwerpoplossing:** policy schema 2 met default-deny textCapabilities en textSourceProperties, canonical diff van echte veranderingen, concrete text.commit/legacyStylePatch en bron-/ASTpayloads in sectie 12. Alle alternatieve writepaden dezelfde grens. Bestaande envelope expectedDocumentRevision; opaque runtimehandle borgt epoch. AuthorCommands:249–252 heeft nu een constante revisie 0; een persistente author-revisiecontroller is daarom een expliciete T1-vereiste. Gehele verboden atomen redacteren, geen partial evaluatorlek.

**Risico:** UI/facade/export/cache kan typed broninformatie lekken; oude policygrants mogen niet als nieuwe toestemming gelden; ondoordachte undo kan rechten herstellen.

**Acceptatie:** format-only content/AST-wijziging geweigerd; source read/display/propertydeny, targetlock, stale revision/epoch en mixed payload atomair geweigerd. Toegestane kleurwijziging behoudt binding. JSON/SVG/PNG/title/DOM bevat geen verboden IDs/namen/resultaten. Trusted history blijft onder huidige rechten. Concrete scenario's 1–9 worden gerichte Node/Edge-fixtures bij introductie van de betreffende categorie.

## B3 — Rendering en fonts

**Probleem:** paduitvoer was te sterk als keuze gepresenteerd zonder metingen van shaping/export/a11y/omvang.

**Bron:** renderer.js tekstbranch (één SVG-text-element); editor.js:textSelectionGeometry rond 542; rectangle-selection.js tekstgeometrie; editor.html:7 (extern font); tests/browser-dynamic-angles.cjs en browser-point-projections.cjs (SVG-rastertests).

**Gekozen ontwerpoplossing:** verplichte geïsoleerde A/B-proef SVG-text met embedded fonts versus glyphpaden, optioneel hybride; identiek corpus en objectieve matrix sectie 13. Geen definitieve font-/rendererbibliotheekkeuze. Rapporteer daadwerkelijke metrics/licenties en schermlezergedrag.

**Risico:** Unicode/kerningverlies, niet-portable fonts, te grote uitvoer, pathtekst slecht toegankelijk. SVG-title/desc alleen bewijst geen toegankelijkheid.

**Acceptatie:** baseline≤0,5 px, bounds≤max(1 px,1%), corpus zonder verlies/clipping, offline SVG/PNG zonder externe requests, leesvolgorde gecontroleerd, gemeten grootte/performance binnen voorgestelde budgets. Review proefrapport vóór integratie; zonder resultaat geen keuze-PASS.

## B4 — Formule-engine

**Probleem:** dimensieruimte, hoekconversie, implicit multiplication en symbolische weergave waren onvoldoende precies; afronding in verkeerde eenheid kon wiskundig fout worden.

**Bron:** measurement-geometry.js:angleLabel/value, MeasurementUnits.settings/format en unitFactors; model.js:dynamicText/textPropertiesFor. Bestaande formatter levert afgeronde strings en mag geen evaluatiebron zijn.

**Gekozen ontwerpoplossing:** sectie 14 definieert exponentdimensies, SI/radadapter, legacy abstracte ruimte, unitliteral/constante e, begrensde dimensionele powers, rounding met expliciete unit, UI-adjacency→expliciete AST, canonical normalisatie zonder algebraïsche herordening en AST-gebaseerde printer met ≈ voor afronding. Uitgewerkte geldige/ongeldige/grensgevallen.

**Risico:** dubbele schaal/conversie, verwisselen unit e/constante e, ambiguity, overflow, resultaat wijzigen via displayprecision of verkeerd haakjesgebruik.

**Acceptatie:** contract moet definitief goedgekeurd zijn vóór T5a. Alle voorbeeldrijen, units/dimensies, parser-printer-roundtrip, numerieke domeinen/quotas en typed sourcegrants testen. πr² 2/3 cm plus afwijkende scale; directed/smallest bronhoek blijft de bestaande betekenis houden. Geen tests nu uitgevoerd voor niet-bestaande engine.

## B5 — ProseMirror

**Probleem:** voorkeur voor bibliotheek zonder eigen-selectie/IME/atom/history-proef.

**Bron:** editor.html:textDialog/textForm; editor.js:submitText/closeText/textinput en modal events; editor-history.js; huidige package.json heeft geen rich editor runtime. Bron voor librarykandidaat blijft de gelinkte primaire documentatie in architectuur sectie 8; geen nieuwe API-/versieclaim in deze correctie.

**Gekozen ontwerpoplossing:** geïsoleerde kandidaatadapter met fake inlineatomen en eigen canonical JSON, matrix sectie 15. Geen PM-document als opslag; geen productieintegratie. Vergelijk alternatief alleen tegen dezelfde harde eisen.

**Risico:** caret/bookmarkverlies, dubbele global/local undo, corrupte IME, unsafe HTML-plakinhoud, lock-in en bundleomvang.

**Acceptatie:** iedere case selectie/caret/atom/IME/paste/history/fullscreen/roundtrip apart bewezen, geen hard failure. Echte IME ontbreekt→not executed/open gate. Gepinde modules/licenties/gzip gemeten en review keuze vóór T1. Deze opdracht installeert niets.

## B6 — Bestaande dynamische tekst

**Probleem:** niet vastgelegd hoe rich-formatbewerkingen binding behouden voordat dynamicValue beschikbaar is; statische backup versus derived fallback door elkaar.

**Bron:** model.js:61–77 (binding/value), 84 (validatie), normaliseObject/textstyle; editor.js:391/977/1016 (bindinginspector/staticinput); permission-runtime.js:110/166/172; index.js:duplicateMany rond 96.

**Gekozen ontwerpoplossing:** T1/T2 immutable bindingpreview en alleen legacyStylePatch; geen inline formule in legacybinding. T3 bewuste prefix/atom/suffixmigratie, styles overnemen, schema-3, originele statische text in typed legacyStaticText, actieve textBinding verwijderen. Format-only krijgt geen migratiegrant. Matrix sectie 16.

**Risico:** binding afvlakken, fallback overschrijven met bronwaarde, mismatch bij units of duplicatie, restrictedbronlek.

**Acceptatie:** openen/Cancel/OK/save/reload/duplicate/undo/redo/restricted per milestone; T1/T2 binding semantisch exact gelijk na opmaak; T3 bron/property/precision/style/positie en backup behouden, source remap correct. Ontbrekende/denied bron volgens onderscheid author/legacy/restrictednew. Tests nog te implementeren.

## B7 — Export per milestone

**Probleem:** T4 mocht eerder typen hun ontbrekende exportondersteuning pas ontdekken.

**Bron:** index.js:175–199 (serialization/load/render); permission-runtime.js:177 (filtered JSON/SVG); renderer.js tekstbranch; bestaande rasterfixtures in browsertests. Productie-PNG-export bestaat nog niet.

**Gekozen ontwerpoplossing:** blokkerende milestone/exportmatrix sectie 17. T1 rich, T2 math, T3 dynamic en T5c calculated moeten direct JSON/SVG/offline PNG-rastering/restricted/history/replay ondersteunen. T4 voegt bediening/productiekwaliteit toe, geen eerdere inhoudscompatibiliteit.

**Risico:** typeverlies, assets niet gereed, stale/ongeautoriseerde waarden, corrupte v6-projectie.

**Acceptatie:** author/restricted JSON herimport, actuele snapshot en zelfstandige SVG/PNG-rastering voor ieder nieuw fragment. Onvolledige closure expliciet geweigerd, nooit corrupt teruggegeven. Geen milestoneacceptatie met bekende exportfout.

## Besluitstatus en eerstvolgende toestemming

**Vaste randvoorwaarden:** alleen documentatie nu; geen productiecode/dependencies/T1; eigen typed opslag en veiligheidsgrens; bindingbehoud; één OK/zero Cancel; export vanaf introductie; ontwikkelbranch en aparte acceptaties.

**Uitgewerkte voorstellen die architectuurgoedkeuring vragen:** v6-dispatch/textSchema, policy schema 2/categoriegrants, canonical diff/text.commit, legacy migratieprotocol, quantities/AST/UI-normalisatie. **Nog open door meetdata:** fonts/renderstrategie, ProseMirror/alternatief, formulebibliotheek, exacte dependencies/budgets en Unicodebereik. Rekencontract moet apart definitief goedgekeurd worden vóór T5a.

**Voorgestelde beperkte voorbereiding:** P0-tech in geïsoleerde experiments-directory, uitsluitend render/font- en ProseMirrorproeven; pas na expliciete toestemming dependencies/prototype. Geen productie-APIwijziging. Rapport met meetresultaten/keuze voorleggen vóór T1. Scope en gates staan in het plan.

## Verificatie van deze documentatiecorrectie

Broncode gelezen en versiecontroles repositorybreed geïnventariseerd. Geen productiecode, dependencies of tests toegevoegd/gewijzigd. Uitgevoerde documentatiecontrole: drie documenten correct UTF-8 en gesloten codefences; tien lokale link-/JSON-voorbeeldentries geldig; B1–B7 in alle drie traceerbaar; architectuur/plan versie 1.1.0, dit rapport 1.0.0. `git diff --check` geslaagd. Deze controles zijn documentatievalidatie, geen runtime- of featuretests.

De historische runtimebaseline blijft 364 Node-tests geslaagd, 0 mislukt/overgeslagen en één volledige Edge-suite geslaagd tijdens oorspronkelijke fase 0. Die suite is voor deze documentatiecorrectie niet opnieuw uitgevoerd; er is geen nieuwe runtimewijziging. Geen preflight-, T1- of formule-enginetest-PASS geclaimd. De ontwerpcorrecties wachten op expliciete goedkeuring.
