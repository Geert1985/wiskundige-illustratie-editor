# WIE — Wiskundige Illustratie Editor

WIE **v1.0.0** is een zelfstandige browsereditor voor het maken en delen van wiskundige illustraties.

## Starten

Voor lokaal gebruik is Node.js 22 of nieuwer nodig. Vanuit de repositorymap:

```sh
npm run serve
```

Open daarna <http://127.0.0.1:8080/>. WIE is een zelfstandige webapp en kan ook via `editor.html` worden geopend vanaf een geschikte statische webserver. De editor werkt in een actuele browser met SVG-, Canvas- en Pointer Events-ondersteuning. Microsoft Edge is de browser waarop de gerichte browserregressies zijn uitgevoerd; er is geen formele compatibiliteitsmatrix voor andere browsers.

## Functies in de v1.0-scope

- **Geometrie:** punten, lijnstukken, rechte lijnen, halfrechten, vectoren, cirkels, veelhoeken (waaronder driehoeken), hoeken, maatlijnen, ellipsen en gebieden.
- **Constructies:** gekoppelde constructies en snijpunten, waaronder middenpunten, middelloodlijnen, loodlijnen, evenwijdigen, bissectrices, raaklijnen, ellipsen en parallellogrammen. Afgeleide objecten volgen hun bronobjecten waar het constructierecept dat ondersteunt.
- **Selectie en organisatie:** enkelvoudige en meervoudige selectie, groeperen, lagen, objecteigenschappen, zichtbaarheid, vergrendeling en labels.
- **Metingen:** omtrek, oppervlakte en objectgebonden meetinstellingen voor ondersteunde geometrie. Meetwaarden kunnen als dynamische waarden in de wiskundige teksteditor worden gebruikt.
- **Tekst:** opgemaakte doorlopende tekst met inline LaTeX, tekstlabels en formuleweergave.
- **Geschiedenis en bestanden:** Undo/Redo, browserlokale conceptopslag, JSON import/export en illustratie-export naar SVG en PNG.
- **Werkvlak:** wiskundige coördinaten, assen en raster, pannen, zoomen en canvas-fullscreen.

De editor valideert geïmporteerde documenten voordat de modelstatus wordt vervangen. JSON is het bewerkbare documentformaat; SVG en PNG zijn uitvoerformaten.

## Bekende beperkingen

- WIE is zelfstandig en is niet gekoppeld aan de routes of beheerschermen van de hoofdapplicatie.
- Oudere WIE-versies herkennen mogelijk niet alle nieuwere objecttypen, documentversies of schema's. Die versies horen onbekende inhoud te weigeren in plaats van die stilzwijgend te verwijderen; gebruik een actuele WIE-versie voor bestanden met nieuwe functies.
- Prestatiemetingen zijn apparaat- en browsergebonden. De historische meting gebruikt 10, 100 en 500 gemengde objecten; 500 objecten is een afzonderlijke stresstestcategorie. Bij grote, dichte documenten blijven koude geometrische berekeningen relatief duur. Zie [PERFORMANCE.md](PERFORMANCE.md); de gerapporteerde tijden zijn geen algemene snelheids- of frametijdbelofte.
- Browserlokale concepten blijven afhankelijk van de lokale browseropslag. Exporteer belangrijke illustraties als JSON en bewaar die zelf.

## Uitgesteld en buiten scope

Niet alle zichtbare categorieën of geplande catalogusitems zijn actieve gereedschappen. Vectorfundament (M7-VEC-FUND) en toekomstige uitbreidingen worden niet als v1.0-functionaliteit aangeboden zolang ze alleen als ontwerp of placeholder bestaan. De volwaardige formule-editor, symbolische CAS, vergelijkingstransformaties en didactische algebra behoren tot **WAT**, een afzonderlijk project; ze zijn geen onderdeel van WIE v1.0. Zie [CONSTRUCTIONS.md](CONSTRUCTIONS.md), [de actuele UI-RADIAL-9-afspraken](docs/UI-RADIAL-9-CONTRACT-DRIVEN.md) en [de roadmap](docs/DEVELOPMENT-ROADMAP.md) voor ontwikkelstatus; roadmapvermeldingen zijn geen belofte dat een functie in WIE v1.0 zit.

## Documenten en compatibiliteit

De applicatieversie **1.0.0** is niet hetzelfde als de JSON-documentversie. WIE leest geldige documentversies 1–10 en schrijft de laagste versie die de gebruikte functies kan beschrijven; documenten met onafhankelijke meetinstellingen kunnen bijvoorbeeld documentversie 10 vereisen. Oudere WIE-versies kunnen nieuwere documenten weigeren. Zie [DOCUMENT-FORMAT.md](DOCUMENT-FORMAT.md) voor versievoorwaarden en compatibiliteit.

## Versies en publicatie

Officiële GitHub Releases verwijzen naar een getagde commit op `main` en bijbehorende release-notities. Distributie naar een andere bestemming vereist een afzonderlijk bevestigd publicatieproces. `package.json` behoudt `private: true`; npm-publicatie is geen onderdeel van de releaseprocedure.

## Ontwikkel- en regressiecontroles

Vereist voor de Node-tests is Node.js 22 of nieuwer. De gerichte tests en browserregressies zijn beschreven in [tests/README.md](tests/README.md). De volledige suites zijn:

```sh
npm test
npm run test:edge
```

De Edge-suite gebruikt Playwright en een geïnstalleerde Microsoft Edge. De volledige Edge-suite bevat ook prestatieproeven en is geen vereiste om de editor te starten. Releasegerichte controles horen de goedgekeurde, relevante testgroepen te kiezen.

## Technische contracten

- [Documentformaat](DOCUMENT-FORMAT.md)
- [Constructies en afhankelijkheden](CONSTRUCTIONS.md)
- [Metingen en groepen](MEASUREMENTS-GROUPS.md)
- [Teksteditorarchitectuur](docs/TEXT-EDITOR-ARCHITECTURE.md)
- [Historische prestatiemetingen en grenzen](PERFORMANCE.md)
- [Roadmap en ontwikkelstatus](docs/DEVELOPMENT-ROADMAP.md)
