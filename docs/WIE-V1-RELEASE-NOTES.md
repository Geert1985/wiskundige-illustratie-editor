# WIE v1.0.0 — release notes

**Status:** release candidatevoorbereiding. Deze notities beschrijven de beoogde eerste officiële release; ze vormen op zichzelf geen publicatie of definitieve vrijgave.

## Eerste release

WIE is een zelfstandige browsereditor voor wiskundige illustraties. WIE v1.0.0 brengt de geometrische model- en constructieworkflows, opgemaakte wiskundige tekst en bestandsuitwisseling samen in één editor.

## Kernfunctionaliteit

- Geometrische objecten: punten, lijnstukken, rechte lijnen, halfrechten, vectoren, cirkels, veelhoeken, hoeken, maatlijnen, ellipsen en gebieden.
- Gekoppelde constructies en afhankelijkheden, met onder meer snijpunten, middenpunten, middelloodlijnen, loodlijnen, evenwijdigen, bissectrices, raaklijnen, ellipsen en parallellogrammen.
- Enkelvoudige en meervoudige selectie, persistente groepen, lagen en objecteigenschappen.
- Omtrek-, oppervlakte- en objectgebonden meetinstellingen voor de ondersteunde geometrie, plus dynamische meetwaarden in de Wiskundige Teksteditor.
- Opgemaakte doorlopende tekst met inline LaTeX en formuleweergave.
- Undo/Redo, browserlokale conceptopslag, JSON import/export en SVG-/PNG-export.
- Assen, raster, navigatie met pannen/zoomen en canvas-fullscreen.

## Documentcompatibiliteit

De appversie **1.0.0** is onafhankelijk van de JSON-documentversie. De releasecandidate leest geldige documentversies 1–10 en schrijft de laagste versie die de gebruikte functies kan opslaan (v2–v10). Functieschema's zoals construction, rich text, region, ellipse en measurement worden aanvullend gedeclareerd en gevalideerd. Import wordt geweigerd wanneer objecten of schema's ongeldig zijn of een toekomstige versie niet wordt ondersteund. Zie [DOCUMENT-FORMAT.md](../DOCUMENT-FORMAT.md) voor de versievoorwaarden.

Oudere WIE-versies kunnen nieuwe documentversies, objecttypen of feature-schema's weigeren. Werk met een actuele WIE-versie wanneer een bestand nieuwere functies gebruikt; open en sla zo'n bestand niet opnieuw op met een oudere versie die die functies niet kent.

## Bekende beperkingen

- WIE is standalone en is niet geïntegreerd in de navigatie of beheerschermen van de From Zero 2 Infinity-hoofdapplicatie.
- Browserlokale conceptopslag is geen back-updienst of synchronisatie. Exporteer belangrijke documenten als JSON en bewaar ze zelf.
- De prestaties hangen af van browser, apparaat en document. Historische metingen laten zien dat dichte documenten met circa 500 objecten een aparte stresstestcategorie vormen; koude geometrische berekeningen kunnen daar merkbare tijd kosten. De metingen in [PERFORMANCE.md](../PERFORMANCE.md) zijn geen algemene snelheidsbelofte.
- Er is geen formele browsercompatibiliteitsmatrix; Microsoft Edge is het gebruikte doel voor de gerichte browserregressies.

## Bewust uitgesteld of buiten scope

- M7-VEC-FUND is alleen als ontwerp goedgekeurd en is geen geïmplementeerde v1.0-functie.
- Geplande items of lege subgroepen in de gereedschapscatalogus zijn geen actieve gereedschappen.
- Een volledige formule-editor, symbolische CAS, vergelijkingstransformaties en didactische algebra horen bij **WAT**, het afzonderlijke Wiskundige Analyse- en Transformatietool-project, niet bij WIE.

## Handmatige gebruikersacceptatie

De producteigenaar heeft handmatig geaccepteerd dat fullscreen met Escape in Microsoft Edge wordt verlaten en dat meervoudige selectie behouden blijft wanneer het radiaalmenu wordt geopend. Dit zijn handmatige acceptaties; ze zijn geen geautomatiseerd testbewijs en worden hier niet als geautomatiseerde PASS gepresenteerd.

## Minimale vereisten en gebruik

- Node.js 22 of nieuwer om de lokale server en Node-testcommando's uit te voeren.
- Een actuele browser met SVG, Canvas en Pointer Events. Microsoft Edge is de browser waarop gerichte browserverificaties zijn uitgevoerd; ondersteuning van andere browsers is niet formeel gecertificeerd.
- Voor de Edge-regressietests: Playwright volgens de lockfile en een geïnstalleerde Microsoft Edge.

Start lokaal met `npm run serve` en open <http://127.0.0.1:8080/>. Zie [README.md](../README.md) voor gebruik en scope.

## Voorgestelde definitieve releaseprocedure

1. Laat deze releasecandidate en de definitieve notities beoordelen; merge de goedgekeurde wijziging naar `main`.
2. Controleer de uiteindelijke releasecommit en bevestig dat die de goedgekeurde kandidaat bevat.
3. Maak op die commit de Git-tag `v1.0.0`.
4. Publiceer een GitHub Release met de goedgekeurde release-notities.
5. Voer aanvullende distributiestappen alleen uit wanneer de producteigenaar een bestaande bestemming en procedure heeft bevestigd.

Deze branch maakt geen tag aan en publiceert geen release. `package.json` blijft `private: true`; npm-publicatie is geen onderdeel van de voorgestelde procedure.
