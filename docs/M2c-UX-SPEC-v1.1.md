# M2c - UI/UX-modernisering: specificatie 1.1

Datum: 2026-10-09. Status: ontwerp goedgekeurd als visuele richting; implementatie na expliciete goedkeuring uitgevoerd; functionele en visuele eindacceptatie open. Deze M2c is een afzonderlijk UX-traject na M4a en geen hernummering van de bestaande roadmap.

Bron: gebruikersspecificatie 1.1 en bijgevoegde goedgekeurde afbeelding 10003.jpg. Normatieve scope en inventarisafwijkingen staan in M2c-IMPLEMENTATION-PLAN.md. De originele afbeelding wordt als docs/M2c-REFERENCE-v1.1.jpg bewaard.

## Normatieve vereisten

| ID | Vereiste |
|---|---|
| UX01 | Drie gebieden: links gereedschappen/Weergave/lagen, centraal licht werkvlak, rechts contextuele eigenschappen. Donkerblauw/antraciet, goudgeel accent, consistente lijniconen en typografie. |
| UX02 | Titelhoek met infinity-icoon, FROM ZERO 2 INFINITY en Wiskundige illustratie-editor. Altijd Ongedaan, Opnieuw, Opslaan, Meer. |
| UX03 | Meer bevat Nieuw document, JSON laden, JSON exporteren, SVG exporteren. Muis, toetsenbord en vernietigingsbevestigingen behouden. Overige documentmetadata blijft bereikbaar. |
| UX04 | Geen grote selectieknoppen in Objecten; selectiefunctionaliteit verhuist naar werkbalk. Vier onafhankelijk uitklapbare categorieen: Basisobjecten, Figuren, Meten, Constructies; alle tools en sneltoetsen behouden. |
| UX05 | Weergave bevat Assenstelsel en Raster. Snappunten verdwijnt uitsluitend uit de zichtbare bediening; gedrag en opgeslagen vlag blijven behouden. |
| UX06 | Assenstelsel naam/icoon selecteert configuratie en accentueert de rij; aparte schakelaar wijzigt alleen zichtbaarheid. Geen geometrisch asobject toevoegen. |
| UX07 | Rechterpaneel: enkel object, multiselectie, assenconfiguratie of neutrale instructie. Uitklapbare secties. Locks, validatie en M2b blijven afdwingen. |
| UX08 | Alle bestaande inspectoreigenschappen en acties behouden: naam/type/ID, geometrie, maatlabels, tekstgrootte, stijl, labels, constructies, groepen, lagen, dupliceren/verwijderen/locks/zichtbaarheid. Nieuwe gemeenschappelijke eigenschappen atomair. |
| UX09 | Coordinatenkeuzelijst met Cartesiaans, Logaritmisch, Semilogaritmisch, Pool. Alleen daadwerkelijk bestaande systemen activeren; ontbrekende systemen vereisen aparte goedkeuring. Geen nieuwe transformformules in UX-milestone. |
| UX10 | Bestaande X/Y-as, aslabels/getallen, nulpunt, raster en automatische verdeling behouden. Gezamenlijke instellingen niet stil splitsen. |
| UX11 | Asstijl, losse label/getalkleur/grootte, pijlen, primaire/secundaire rasterlijnen, handmatige rasterstijl en oorsprongsmarkering eerst onderzoeken; alleen toevoegen bij aantoonbaar kleine compatibele oplossing en goedkeuring. |
| UX12 | Compacte werkbalk: Selectie, Kaderselectie, Pannen, zoom in/uit, percentage, herstellen. Geen dubbele as/rasterinstellingen. |
| UX13 | Lagen visueel moderniseren; alle huidige namen/volgorde/zichtbaarheid/toewijzing/verwijdersemantiek en object-/groeplijst behouden. |
| UX14 | Desktop en responsive layout; paneelwijziging verandert geen geometrie, constructies of documentbounds. Alle muis- en toetsenbordinteracties behouden. |
| UX15 | Geen engine/graph-herschrijving, nieuwe documentversie voor uiterlijk, ongeautoriseerde mutaties, dubbele controllers of renderpaden. JSON en SVG compatibel. |
| UX16 | Tests-first per submilestone, volledige Node/echte Edge-suite, visuele vergelijking en toegankelijkheid; per stap rapport. M2c afgerond na functionele EN visuele gebruikersacceptatie. |

## Traceerbare ontwerpwijzigingen

1.1 is de gebruikersspecificatie. Repository-inspectie toont dat drie coordinatenopties placeholders zijn, aslabels/getallen gezamenlijk zijn en nulpunt het getal 0 is. Dit zijn gedocumenteerde implementatieverschillen, geen stil gewijzigde productvereisten. Gevraagde uitbreidingen blijven als vervolgvereisten behouden.

## Uitvoering en acceptatie

Nu uitsluitend analyse, plan en projectdocumentatie. STOP voor productiecode. Daarna vier afzonderlijke gates M2c.1-M2c.4 uit het implementatieplan, elk met regressiebewijs en acceptatie. Geen M4b-werk in dit traject. Golden fixtures worden niet aangepast om regressies te verbergen.

## Opleverstatus

De volledige uitvoering is later expliciet geautoriseerd. Zie M2c-REPORT.md en gateverslagen. Deze wijziging betreft status, geen stil gewijzigde geometrische vereisten.
