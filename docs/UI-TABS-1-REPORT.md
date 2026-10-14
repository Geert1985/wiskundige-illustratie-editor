# UI-TABS-1 — Vast tabblad Gereedschappen / Lagen en objecten

**Basis:** `codex/ui-left-sidebar-navigation`
**Branch:** `codex/ui-sidebar-tabs-layer-drag`
**Status:** gepusht; niet naar main gemerged.

## Geïmplementeerd

- Het linkerzijpaneel bevat twee selecteerbare ARIA-tabbladen, `Gereedschappen` en `Lagen en objecten`. De eerste tab is standaard actief; klikken en links/rechts/Home/End wisselen de tab met bijbehorende focus.
- De tabstrip staat buiten het scrollende tabpaneel. De bestaande zoekfunctie staat boven de toolcatalogus en blijft via `position: sticky` zichtbaar wanneer de gereedschappen worden gescrold.
- `Lagen en objecten` toont lagen en hun objecten, gevolgd door de bestaande secties Illustratie en Bediening.
- Een nieuw leeg editor-document (bij opstart of via Nieuw) heeft onmiddellijk een `Basislaag` met `layerSchema: 1`, documentversie 5, ID `layer-1`, zichtbaarheid aan en lege `members`. Nieuwe objecten worden automatisch aan de bovenste zichtbare laag gekoppeld door de bestaande modelimplementatie.
- Objectregels in de laaglijst zijn `draggable` in een vrije editorsessie. Een drop op een laag voert via het bestaande `layer.assign`-command een wijziging door die undo/redo en groepsinvarianten gebruikt. Groepsleden worden samen verplaatst, restricted sessions blokkeren drag/drop.
- Een gemarkeerde doellaag geeft feedback bij verslepen. De bestaande inspector-keuzelijst blijft de niet-dragbediening voor laageigendom.

## Gewijzigde code

- `editor.html`: tabstructuur en scriptreferenties.
- `editor.css`: vaste tabstrip, sticky zoekbalk en laag-dropstijlen.
- `editor-sidebar-tabs.js`: tabbediening en native HTML drag/drop.
- `editor-bootstrap.js`: basislaag in eerste editor-document.
- `editor.js`: basislaag in Nieuw-document, draggable objectregels, scrollherstel van de nieuwe laagtab.

## Reikwijdte en migratie

Bestaande geïmporteerde documenten behouden hun oorspronkelijke structuur. In het bijzonder wordt een legacy-document zonder laagschema niet stilzwijgend herschreven tijdens import. Dit betekent dat de expliciete basislaag voor **nieuwe illustraties** geldt. Een bestaand legacy-document zonder lagen blijft in de bestaande compatibiliteitsweergave 'Objecten zonder lagen' totdat de gebruiker een laag aanmaakt. Een eventueel verplicht migratiebeleid voor dergelijke documenten vraagt een apart schema-/compatibiliteitsbesluit.

## Verificatie

De wijziging is rechtstreeks op GitHub gepusht. Er is geen Node-, Edge- of handmatige interactietest uitgevoerd. Voor merge dienen tab-/sticky-positionering, laden en bewaren, undo/redo, restricted mode, slepen van groepsleden en responsive layouts afzonderlijk geaccepteerd te worden. Oudere browsertests die de vroegere `#layersSection`-details of een aanvankelijk laagloos document veronderstellen, moeten op de nieuwe UX worden aangepast. 
