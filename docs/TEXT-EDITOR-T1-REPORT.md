# T1-rapport - Rich-texteditor en gestructureerd tekstmodel

Versie 1.0.0 - 2026-10-12. Branch: chatgpt/editor-development. Status: klaar voor gebruikerstest; nog niet volledig geaccepteerd.

## Opgeleverd

- textContent schema 1 bevat getypeerde alinea's, tekstfragmenten en harde regeleinden, met begrensde invoer en gevalideerde opmaak. De platte .text blijft een compatibele terugvalwaarde; rich content is leidend.
- De productie-editor gebruikt een vervangbare ProseMirror-adapter in rich-text-editor.js en een lokaal gebundelde ESM-module in rich-text-editor.bundle.js (210489 bytes), geladen via rich-text-editor-loader.js. De rootdependencyset is niet veranderd; proefdependencies staan onder experiments/text-editor-preflight/.
- text.commit is een revisiegecontroleerd en atomair geschiedenis-/replaycommando. Restricted bewerkingen onderscheiden inhoud, opmaak en expliciete legacy-migratie. Locks, dynamische bindings en constructietekst worden geweigerd als rijke tekst daarmee onveilig te wijzigen is. Legacy stijlpatches behouden textBinding.
- De editor werkt voor nieuwe vrije tekst en bestaande statische tekst via de inspector. Annuleren, bevestigen en document undo/redo gebruiken de documentgeschiedenis; editor undo/redo is lokaal.
- Documenten met rijke tekst gebruiken v7 en textSchema 1. v6 blijft gereserveerd voor cirkelpuntenverdelingen. De reader ondersteunt v1-v6 en v7 kan verdelingen, groepen en lagen bewaren.
- De editor en zelfstandige SVG gebruiken lokale Source Sans 3- en Source Serif 4-fonts. Rich SVG embedt fonts voor offline export; bestaande SVG voor legacytekst blijft bytecompatibel. Fontbronnen en licenties staan in experiments/text-editor-preflight/fonts/.

## Verificatie

- npm.cmd test: 402 geslaagd, 0 mislukt, 0 overgeslagen (Node 22.18.0).
- node --test tests/text-editor-t1.test.cjs tests/architecture.test.cjs: 10 geslaagd, 0 mislukt.
- npm.cmd run test:edge: niet volledig uitgevoerd. Een Edge-run bereikte tests/browser-rich-text.cjs maar faalde omdat de proef op Vet klikte met alleen een cursor. De proef selecteert nu eerst tekst. Latere Edge-starts werden door de omgeving afgesloten voor de test kon lopen. De aangepaste rich-textproef, fullscreenchecks en offline SVG-naar-PNG-proef zijn NIET UITGEVOERD.
- Handmatige gebruikerstests, echte OS-IME-invoer en schermlezerchecks: NIET UITGEVOERD. Daarvoor is een echte interactieve input-/toegankelijkheidsomgeving nodig.
- Fontbundle: 2341296 bytes als base64-JavaScript; originele TTF-bestanden samen 1755752 bytes volgens het P0-rapport. SVG embedt de fonts alleen als rijke tekst aanwezig is.

## Beperkingen en risico's

- T1 is klaar voor gebruikerstest maar niet volledig geaccepteerd voordat de Edge-suite en handmatige checks slagen.
- Volledige dekking van complexe schriften, emoji en alle Unicode-glyphs is niet bewezen. Formulefragmenten vallen onder T2.
- Automatische tekstomloop, vaste breedte, berekende expressies en meerdere dynamische velden zijn niet opgenomen. Legacy gebonden tekst behoudt het bestaande gedrag; rich editing van gebonden tekst vraagt een expliciete latere migratie.
- Ingebedde fonts voegen ongeveer 2,34 MB toe aan een zelfstandige SVG met rijke tekst. Omvang en prestaties moeten voor release opnieuw worden beoordeeld.

## Handmatige testlijst

1. Maak twee alinea's en voeg met Shift+Enter een harde regeleinde toe.
2. Selecteer tekstfragmenten en test vet, cursief, onderstrepen, sub-/superscript, kleur, lettertype, grootte en uitlijning. Controleer canvas en editor undo/redo.
3. Annuleer wijzigingen en controleer dat het document gelijk blijft. Bevestig een aparte wijziging en test document undo/redo.
4. Bewerk bestaande statische tekst via de inspector, sla JSON op/herlaad en controleer de opmaak.
5. Exporteer JSON en SVG. Open de SVG zonder netwerk en rasteriseer naar PNG. Controleer een oud document met dynamische tekst en behoud van de binding.
6. Herhaal in fullscreen. Test afzonderlijk IME en een schermlezer; noteer browser, OS en ondersteunende technologie.

T1 wacht op deze tests en expliciete acceptatie voordat T2 begint.
