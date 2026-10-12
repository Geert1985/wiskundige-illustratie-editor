# Wiskundige Tekst Editor — geïntegreerde werkruimte

Versie 1.2.0 — 2026-10-12.
Status: volledige UI-implementatie geleverd; gebruikersacceptatie nog niet uitgevoerd.
Branch: `chatgpt/text-editor-full-workspace`.
Basis: `chatgpt/t5-calculator`, commit `ec750d3e793e40bdfac9acc683b24307600cc3d6`.
De oplevercommit wordt na commit en push in het opleverbericht genoemd; dit rapport hoort bij dezelfde wijzigingenset.

**Geen tests uitgevoerd op verzoek van de gebruiker.** Geen automatische of handmatige tests, syntax-/testcommando's, browsersessies, screenshots, nieuwe tests of nieuwe dependencies. De code is uitsluitend gelezen, aangepast en statisch beredeneerd. De eerdere T5a-testresultaten zijn geen bewijs voor deze UI-refactoring.

## 1. Onderzoek en oorspronkelijke problemen

De bestaande editor gebruikte `textDialog.showModal()` met meerdere opeengestapelde CSS-regels voor beperkte dialoogafmetingen. De invoerkolom bevatte zowel invoer, een afzonderlijk scrollende catalogus, preview als sticky acties. Beperkte hoogte liet weinig plaats over voor de catalogus. De volledige tekstsubmit stond onderaan. Twee JSON-knoppen waren disabled placeholders zonder handlers.

`Editor.openRichText/submitText/closeText` beheert de tekstsessie, ProseMirror-adapter, verwachte documentrevisie, restricted epoch/transactie en terugkeerfocus. TextInsertPanel beheert formulebookmarks, broninvoer en concepten. TextFormulaEditor gebruikt de bestaande MathSource/MathFragments-validatie en rendering. TextDynamicValueEditor gebruikt de bestaande geautoriseerde bronopties, TextValues-formattering en editor.insertValue. Geen van deze domeincontracten is vervangen.

De gebruiker corrigeerde tijdens uitvoering de basisbranch van main naar t5-calculator. De al begonnen UX-wijzigingen zijn op de genoemde T5a-commit overgezet. De twee overlapplaatsen betroffen dezelfde bestaande leeg-conceptcorrecties; deze zijn behouden. Er is geen T5a-code teruggedraaid. De vooraf aanwezige `docs/FEATURE-GAP-ANALYSIS.md` is niet gewijzigd of opgenomen.

## 2. Architectuur en geïntegreerde modus

De bestaande dialog-container blijft als semantische sessieroot beschikbaar, maar gebruikt `show()` en viewportvullende CSS in plaats van een modal overlay. De nieuwe `TextWorkspace`-presentatieservice voegt de tijdelijke bodymodus toe, verbergt de illustratorheader/main en zet deze inert. Er wordt geen browservenster geopend en geen Fullscreen API aangeroepen. Reeds actief applicatie-/browserfullscreen wordt niet gewijzigd.

Focus wordt binnen de sessie gehouden; Tab/Shift+Tab cycleren door zichtbare bediening. Achterliggende illustratorhotkeys worden tijdens tekstbewerking niet bereikt. De closeText-route herstelt de oorspronkelijke inert-status en verwijdert listeners. De bestaande terugkeerfocus wordt daarna gebruikt. Laden/mount-fouten gebruiken dezelfde opruimroute. Eventuele commit-/autorisatiefouten worden ook in de zichtbare sessiestatus getoond.

Opmaak, ProseMirror, MathSource/MathFragments, documentmodellen, rich-textschema's, bronrechten, lokale history en documenthistory blijven hun bestaande logica gebruiken. Geen calculatorinterface, calculatedValue, T6-import/export, nieuwe opslag of nieuwe wiskundesyntax.

## 3. Drie kolommen en scrollgedrag

Desktopgrid: `minmax(230px,1fr) minmax(0,2fr) minmax(230px,1fr)`, ongeveer 25/50/25 waar de beschikbare ruimte dat toelaat. De middenkolom heeft een nul-minimum voor flexibele verdeling. Alle paneelketens en de hoofdgrid gebruiken min-height:0 en min-width:0.

Links blijven de tabs boven de scrollregio. Formule bevat LaTeX, zoeken, categorie en dezelfde centrale catalogus/templates. Waarden bevat bronobject/eigenschap, precisieslider, eigenschapsafhankelijke eenheid en prefix/suffix. De catalogus scrollt mee met het invoerpaneel; de aparte catalogus-scrollcontainer en vaste hoogte zijn verwijderd.

Midden behoudt de opmaakwerkbalk en het witte tekstcanvas. Lange tekst scrollt binnen de surface; het documentbreedtegedrag van bestaande tekst blijft via de bestaande ProseMirror maxWidth behouden.

Rechts staat Formulevoorbeeld met de bestaande live rendering, of Waardevoorbeeld met dezelfde bronfeedback. Slechts de actieve context is zichtbaar; een oud formulevoorbeeld wordt bij Waarden verborgen. Previewinhoud kan scrollen. Annuleren en Formule invoegen/bijwerken of Waarde invoegen staan buiten de scrollregio. Foutfeedback staat in dezelfde rechterkolom en heeft een begrensde scrollruimte.

De oorspronkelijke preview-/knop-ID's zijn verplaatst, niet gekopieerd. Invoegservices zoeken feedback binnen de dialog-root. Er is één formule-evaluator/renderroute en één dynamische-invoegroute. Escape in de invoer-/feedbackcontext annuleert het actieve concept; elders verlaat Escape de tekstsessie. De knop Annuleren bij de preview sluit de volledige tekstsessie niet.

## 4. Werkbalk, bevestigen en annuleren

Bovenaan: Ongedaan, Opnieuw, Toevoegen of Wijzigingen opslaan, Meer, Sluiten. De hoofdsubmit is goud; de kleinere context-invoegknoppen hebben een ondergeschikte accentstijl. De oude submit onderaan is verwijderd.

Toevoegen gebruikt dezelfde submitText-workflow voor één nieuw tekstobject. Wijzigingen opslaan gebruikt dezelfde target-id voor een bestaand object. Bookmarks, formule-/waarde-invoeging, lokale undo en autorisatie/revisiecontrole blijven bestaan. Onvoltooide concepten blokkeren volgens de bestaande workflow de volledige commit en geven feedback.

Sluiten en de behouden volledige Annuleren-knop onderaan gebruiken closeText en verwerpen niet-bevestigde sessie-inhoud. Bevestiging sluit de sessie via de bestaande commitworkflow. Er is geen autosave toegevoegd, geen tweede history en geen nieuwe bevestigingsdialoog; de bestaande expliciete annuleringsemantiek blijft behouden. Sluiten vermeldt expliciet 'zonder opslaan' in de tooltip/toegankelijke naam.

## 5. Meer en JSON

Het menu bundelt uitsluitend de bestaande JSON Importeren/Exporteren-placeholders met iconen. Deze blijven disabled en de toelichting vermeldt dat tekst-JSON later beschikbaar komt. Op de basisbranch bestaan geen handlers voor deze tekstknoppen. Hen actief maken zou nieuwe T6-functionaliteit of een onbedoelde globale illustratie-import binnen een open teksttransactie toevoegen, wat de opdracht expliciet uitsluit.

De globale illustratie-JSON-laden/exporteren-handlers in de hoofdapplicatie blijven intact en bereikbaar na het verlaten van de teksteditor. Geen formaat, validatieregel of autorisatieregel verandert.

Meer gebruikt native details/summary voor muis, Enter/Space. Escape sluit uitsluitend het open menu en geeft focus terug. Buitenklik/focus buiten het menu sluit het. Pijltoetsen openen het en richten de menu-inhoud; huidige disabled opties worden overgeslagen. Het menu staat boven de panelen en heeft een viewportbegrensde breedte. Er zijn geen extra menuacties toegevoegd.

## 6. Responsief ontwerp en code-afwerking

- Tot 1100px: compactere breedtes/knoppen en een nadrukkelijk groter middengewicht.
- Tot 820px: links invoer over de hoogte, midden tekst met feedback eronder; acties naast feedback.
- Tot 540px: invoer, tekst en feedback in drie begrensde rijen. De bovenbalk kan wrappen.
- Tot 560px hoogte: kleinere paddings/bediening; zelfstandige content-scrollregio's blijven bestaan.

De oude opeengestapelde beperkte dialoog-, tweekoloms-, sticky-actie- en catalogushoogteregels zijn vervangen door één samenhangend stylesheetblok. Overbodige globale rich-textlayoutregels zijn verwijderd. De oude hoofdsubmit is verwijderd; sessie-Annuleren en hulpsessiestatus blijven. Release-cachetokens zijn voor alle editorassets gezamenlijk verhoogd. Geen bestanden verwijderd.

## 7. Gewijzigde bestanden

| Bestand | Wijziging |
|---|---|
| editor.html | Werkbalk, Meer, verplaatste contextpreview/acties en nieuwe presentatieservice |
| editor.css | Schermvullende modus, drie kolommen, scrollketens en compacte breakpoints; oude layout verwijderd |
| editor.js | Open/close aansluiten op TextWorkspace, labels hoofdcommit en zichtbare sessiestatus |
| text-workspace.js | Nieuwe geïsoleerde presentatie-, focus- en menucontroller |
| text-insert-panel.js | Feedback/acties via sessieroot, contextwisseling en Escape voor rechterpaneel |
| text-dynamic-value-editor.js | Actieve tab via de invoerregio binnen de gedeelde root |
| docs/TEXT-EDITOR-ARCHITECTURE.md | v1.14.0, sectie 29; mathematisch contract behouden |
| docs/TEXT-EDITOR-IMPLEMENTATION-PLAN.md | v1.13.0, afzonderlijke UX-oplevering en acceptatie |
| docs/DEVELOPMENT-ROADMAP.md | v2.2.0, UX-status en aparte milestonegrenzen |
| docs/TEXT-EDITOR-FULL-WORKSPACE-REPORT.md | Dit rapport v1.0.0 |

## 8. Aandachtspunten en nog niet uitgevoerde acceptatie

De interface is geïmplementeerd maar niet functioneel/visueel bewezen. Vooral native nonmodal dialog met eigen focus/inert-regime, actieve fullscreenmodus, beperkte hoogte/browserzoom, menu/paletpositionering en terugkeerfocus moeten door de gebruiker gecontroleerd worden. Bestaande testselectors die preview/knoppen uitsluitend binnen textInsertPanel zoeken weerspiegelen niet meer hun nieuwe locatie; tests zijn niet aangepast of uitgevoerd. Dit is geen claim dat de bestaande suites voor deze UX-wijziging slagen.

De JSON-tekstacties blijven bewust niet operationeel omdat ze op de basis niet operationeel waren. Toekomstige tekstimport/export blijft een afzonderlijke opdracht. De oorspronkelijke T5a-engine en zijn contract zijn aanwezig vanuit de aangewezen basis, maar geen T5b/T5c is gestart.

## 9. Handmatige checklist — volledig open

1. Open nieuwe en bestaande tekst: schermvullende werkruimte, drie desktopkolommen, witte surface; sluit terug naar dezelfde illustratie/selectie.
2. Controleer beperkte hoogte, laptopbreedte, smalle vensters en browserzoom: alle catalogussymbolen bereikbaar, tabs zichtbaar, geen overlappende knoppen of globale horizontale scrollbar.
3. Selecteer tekst/cursorpositie, kies formuletemplate, wijzig LaTeX: live rechterpreview, correcte foutfeedback, invoegen op bewaarde selectie; heropen/bewerk een formule.
4. Annuleer een formuleconcept: tekst blijft behouden. Wissel Formule/Waarden zonder invoeging: geen oude preview/acties of ongewenste wijzigingen.
5. Kies dynamische bron/eigenschap en wijzig precisie, eenheid, voor-/achtervoegsel: correcte waarde rechts; voeg in en herbewerk. Controleer ontbrekende/verboden bronnen met restricted rechten.
6. Gebruik vet/cursief/scripts, lettertype/grootte, kleur en uitlijning; controleer gemengde selecties, kopiëren/plakken, pijlen en cursorbehoud.
7. Gebruik lokale Ongedaan/Opnieuw voor tekst, formule en waarde. Bevestig daarna en controleer documentundo/redo: één tekstcommit, geen duplicaat bij bestaand object.
8. Gebruik Toevoegen/Wijzigingen opslaan bovenaan. Controleer lege tekst, openstaand concept, gewijzigde bronrechten en revisieconflict; meldingen blijven leesbaar.
9. Gebruik volledige Annuleren, Sluiten en Escape: niet-bevestigde sessie-inhoud wordt verworpen, eerder bevestigde documentinhoud blijft; focus keert terug.
10. Open Meer met muis/Enter/Space/pijlen; sluit met Escape/buitenklik. JSON-placeholders blijven disabled; globale illustratie-JSON blijft na sluiten werken.
11. Controleer Tab/Shift+Tab, Escape in submenu/palet/concept, geen achterliggende illustratorhotkeys, en openen/sluiten binnen bestaande applicatie- en browserfullscreen.
12. Sla documenten op/herlaad; controleer legacybindings, bestaande afwijkende opmaak/breedte, JSON/SVG/PNG-export via de bestaande illustratorfuncties.

Geen van deze controles is door Codex uitgevoerd. Wacht op gebruikersacceptatie; geen automatische merge naar main of start van volgende milestones.

## 10. Visuele vervolgcorrecties op gebruikersfeedback

Deze sectie is leidend boven de oorspronkelijke beschrijving van footer en bovenbalk in secties 2–9.

De bovenbalk hergebruikt nu rechtstreeks de hoofdapplicatieklassen topbar, brand, brand-logo, eyebrow, top-actions en file-menu. De titelstijl is gedeeld tussen h1 en de teksteditor-h2, inclusief de bestaande responsieve regels. Afzonderlijke kleinere headerlettergroottes en knopstijlen zijn verwijderd. Ongedaan/Opnieuw/Meer gebruiken dezelfde bestaande tekens; de hoofdbevestiging gebruikt het bestaande opslagpictogram.

De formule- en waardeactieknoppen volgen nu direct op hun preview in plaats van onderaan de rechterkolom. Previewinhoud kan bij ruimtegebrek krimpen/scrollen; contextacties behouden hun plaats in de normale paneelflow.

De onderste sessiebalk en zijn dubbele Annuleren-knop zijn verwijderd. De bovenste Sluiten-knop heet nu Annuleren en gebruikt dezelfde bestaande closeText-route. Autorisatie-, revisie- en conceptmeldingen blijven bereikbaar in een lege-tot-nodig live meldingsregio in de rechterkolom; geen permanente footer/statusbalk.

Ook deze vervolgcorrecties zijn niet getest op verzoek van de gebruiker. Handmatig te controleren: overeenkomst hoofdheader, positie onder preview, bereikbaarheid bij lange formules en beperkte hoogte, bovenste Annuleren, Escape, zichtbaarheid van commitfouten en herstel van focus. De footercontrole uit de oorspronkelijke checklist is vervangen door deze nieuwe plaatsing.

## 11. Herhaald dynamische waarden invoegen

Oorzaak: na succesvolle invoeging werd de actieve value-draft afgesloten en de knop disabled, terwijl bronselectie en preview zichtbaar bleven. Alleen opnieuw openen van de tab maakte een nieuwe draft.

Correctie: de knopbeschikbaarheid volgt de huidige bronvalidatie, zonder een permanent actief concept te eisen. Na succesvolle invoeging worden positie/bookmark en pending-status afgesloten, blijven gekozen bron-/opmaakinstellingen staan en wordt het voorbeeld opnieuw ververst. Een volgende invoegklik opent pas dan een nieuw concept met de actuele tekstbookmark en zonder oude updatepositie. Daardoor blijft de volledige tekstcommit mogelijk tussen invoegingen; het laatste bronveld wordt niet door een oude bewerkingspositie opnieuw aangepast. Bestaande expliciete atoomediting en stale-bookmarkcontrole blijven aanwezig. Iedere klik ververst tevens bronfeedback voordat invoeging wordt toegestaan.

Ook de focusroute bij een openstaand waardeconcept gebruikt nu de verplaatste invoegknop in de sessieroot. Geen tests uitgevoerd. Handmatig controleren: meerdere invoegingen zonder tabwissel, verplaatste cursor/nieuwe alinea, gewijzigde bron/eigenschap/opmaak, bestaand veld bewerken, lokale undo/redo, tussentijds volledige commit, annuleren en gewijzigde bronrechten.
