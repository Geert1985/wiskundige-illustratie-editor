# M2c — Verwerking van zeven UI-opmerkingen

Datum: 9 oktober 2026. Uitgangspunt: bc831d553c0360db94962ad22dc08a84924d3c4c, chatgpt/math-illustration-stabilization.

## Uitgevoerd

1. Vulkleur is een klikbaar kleurstaal; zonder vulling toont het een transparant staal.
2. Objecten heeft geen eigen scrollvenster of maximale hoogte meer. Bij ruimtegebrek scrolt de gehele linkerzijbalk; de lagenlijst behoudt haar eigen begrensde lijst.
3. Geometrische invoervelden tonen maximaal twee decimalen. Het document behoudt volledige precisie. Een daadwerkelijk bewerkt veld bewaart de ingevoerde waarde; selectie, render of focus/blur wijzigen niets.
4. De objectkop toont eenmaal de naam en het objecttype. Het dubbele ID is verwijderd; naamwijziging blijft beschikbaar bij Object en geometrie.
5. Dekking is een slider van 0 tot 100%, met zichtbare waarde en keyboardbediening.
6. Uiterlijk staat als eerste eigenschappenrubriek onder de objectkop.
7. Groeperen, groep opheffen, zichtbaarheid, dupliceren, vergrendelen en verwijderen staan als SVG-iconen bovenaan. Alle behouden aria-labels, tooltips en bestaande autorisatiepaden. Constructierelaties, losmaken en laagtoewijzing blijven onder Relaties en organisatie.

## Verificatie

281/281 Node-tests geslaagd, geen skips. De nieuwe browser-inspector-feedback.cjs controleert sectievolgorde, kleurstaal, actie-iconen, ontbreken van intern scrollvenster, weergaveafronding zonder documentmutatie, keyboard-dekking en undo. De bestaande stijltest gebruikt de sliders, en controleert de onderliggende weigering van ongeldige dekking via de engine. Lifecycle-tests verwachten twee decimalen uitsluitend voor de weergegeven invoervelden; geometrische en lifecycle-asserties zijn behouden. Geen golden fixtures gewijzigd.

Volledige echte Edge-suite PASS, inclusief alle 24 browsermodules; pageErrors leeg. Technisch oordeel: PASS. Gebruikersacceptatie blijft open.

## Bestanden

editor.js, editor.css, editor.html, tests/browser-styles.cjs, tests/browser-lifecycle.cjs, tests/browser.cjs en tests/browser-inspector-feedback.cjs.

## Grenzen

Geen documentformaat, geometrische engine, constructiegraph of permissiecontract gewijzigd. Geen volgende milestone gestart. Veel uitgeklapte categorieën vereisen scrollen van de gehele zijbalk. Groepsacties behouden hun bestaande beperkingen; ongeldige acties worden uitgeschakeld of via het bestaande commandpad geweigerd.
