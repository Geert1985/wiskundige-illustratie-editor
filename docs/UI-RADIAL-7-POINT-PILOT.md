# UI-RADIAL-7A/B — Puntobject pilot

**Datum:** 2026-10-14  
**Basis:** \`codex/ui-radial-wheel-preview-design\` (UI-RADIAL-6, compact 322 px)  
**Branch:** \`codex/ui-radial-7-point-context-constructions\`  
**Scope:** één geselecteerd \`point\`-object; overige objecttypen, assenstelsel en groepen houden hun bestaande radiaalmenu.  
**Status:** implementatie op eigen branch; geen merge naar \`main\`.

## UI-RADIAL-7A — eigenschappen zonder overlap (uitsluitend één punt)

Het zesdelige wiel toont voor een punt nu **Constructie, Uiterlijk, Geometrie, Labels, Acties, Alles**.

| Categorie | Inhoud |
|---|---|
| **Constructie** | Contextueel beschikbare bestaande gereedschappen, zie 7B |
| **Uiterlijk** | Bestaande puntstijl: lijnkleur, vulkleur, lijndikte/-patroon, dekking |
| **Geometrie** | Bestaande puntcoördinaten en coördinatenprojecties; eventuele cirkelpuntenverdeling |
| **Labels** | Eén labelschakelaar, hulp bij positioneren door slepen op canvas |
| **Acties** | Bestaande compacte inspector-iconen (tonen/verbergen, lock, dupliceren, verwijderen, groepen indien toepasselijk) |
| **Alles** | Volledige bestaande inspector, inclusief relaties/broninformatie en geautoriseerde acties |

Geen tweede coördinatenprojectiekaart onder Labels; geen actietoolbar onder Labels. \`Alles\` is bewust een totaaloverzicht, geen apart eigenaarschap van eigenschappen.

De labelschakelaar gebruikt de **bestaande** \`data-edit="showLabel"\`-eventafhandeling van de inspector. Er is geen nieuwe objectmutator toegevoegd. Verboden wijzigingen blijven uitgeschakeld.

## UI-RADIAL-7B — contextuele constructie vanuit één punt

De actie \`Constructie\` bevat een dynamische lijst die is afgeleid van:
- De gedeelde \`ToolCatalog.list('sidebar')\`, waaruit alleen daadwerkelijk geïmplementeerde gereedschappen met een stabiele \`construct:...\`-ID worden getoond.
- De gedeelde \`ConstructionService.contract(kind).sourceRoles\`: het eerste bronslot moet \`point\` zijn en de constructie moet extra bronnen vereisen.
- \`ConstructionService.referencesForRole(point,'point',kind)\`: het geselecteerde object moet daadwerkelijk geldig zijn als **eerste** puntbron.
- De bestaande bevoegdheden \`toolAllowed(toolId)\`, \`canvasSelectable(point)\` en eventueel \`capabilities(point.id).sourceTools\` bij beperkte permissiemodus.

Daardoor verschijnen, voor zover beschikbaar en toegestaan, onder meer:
\`construct:midpoint\`, \`construct:perpendicularBisector\`, \`construct:lineBetweenPoints\`, \`construct:circleByCenterPoint\`, \`construct:triangleFromPoints\`, \`construct:anglePoints\` en \`construct:bisector\`.

**Opmerking:** voor functies met een ander eerste bronobject, zoals \`perpendicular\` (\`line,point\`), is de eerste-punt-voorinvulling niet geldig. Zulke constructies worden in deze bewuste pilot niet aangeboden. Dit is geen belofte dat elk denkbaar constructietype al geïmplementeerd is.

Bij kiezen van een optie:
1. Sluit het radiaalmenu.
2. Activeer het gekozen bestaande gereedschap via \`EditorApp.setTool\`.
3. Zet \`interaction.mode='construction'\` met \`sources:[{objectId: geselecteerdPunt.id}]\`.
4. Toon de bestaande hint voor bronindex 1.
5. Laat \`constructionPick\`, \`constructionSourcesAt\`, \`constructionClick\`, \`ConstructionService\` en \`construction.create\` de resterende bronnen, afhankelijkheden, validering, Undo/Redo en persistente constructie beheren.

Er is **geen tweede constructie-engine** en geen wijziging van het document-/constructieschema. Bij Esc/annuleren gelden de bestaande interactieregels.

## Gewijzigde bestanden

- \`editor-radial-properties.js\`: puntgebonden zes categorieën, expliciete exclusieve secties, nieuwe constructielijst uit bestaande catalogus en contract.
- \`editor.js\`: één kleine, gecontroleerde \`startConstructionFromPoint()\`-adapter naar de bestaande constructie-interactie.
- \`editor.css\`: zwevende constructielijst met toetsenbord-/hoverstijl en geïsoleerde puntactie-opmaak.
- \`editor.html\`: cacheversies \`ui-radial-7\`.

## Handmatige acceptatiescenario's

1. Selecteer vrij punt P1; open het wiel: zes categorieën inclusief Constructie.
2. Open Geometrie: x, y en coördinatenprojecties. Open Labels: enkel labelinstellingen; géén coördinatenprojecties of actiebar.
3. Open Acties: bestaande **kleine** iconen, zonder dubbel naamveld.
4. Open Alles: inspectordetails en bronnen nog beschikbaar.
5. Kies Constructie → Lijnstuk door twee punten; P1 is al eerste bron, kies P2 en controleer gekoppeld lijnstuk.
6. Herhaal voor Cirkel via punten en Driehoek via punten; bij de driehoek hoeven alleen P2 en P3 nog gekozen te worden.
7. Kies een andere categorie; de positie van het wiel blijft gelijk.
8. Annuleer een halfvoltooide constructie met Esc; er verschijnt geen onbedoeld object.
9. Controleer geldig/onzichtbaar/vergrendeld punt en beperkte leermodus: alleen geldige, geautoriseerde bronnen en gereedschappen.
10. Selecteer cirkel, rechte, groep of meerdere objecten: het oude radiaalmenu blijft intact.

**Teststatus:** geen geautomatiseerde tests uitgevoerd, conform eerdere instructie. Deze branch is een gerichte **functionele pilot** voor visuele acceptatie, niet een gevalideerde release.


## UI-RADIAL-7C — vlottere puntselectie en alleen rechtsklik (14 oktober 2026)

**Gevraagd:** de puntmarkering vlotter kunnen selecteren en verslepen; geen permanent zichtbaar eigenschappenicoon; de puntcategorie Labels vervangen door Relaties.

### Wijzigingen
- Het losse `radialPropertiesTrigger`-element en de gerelateerde JS-/CSS-bediening zijn verwijderd. De radiale bediening wordt niet meer na een linkermuisklik naast de selectie getoond; links klikken en slepen blijven voor de normale canvasinteractie.
- De bestaande rechtermuisknoproute opent rechtstreeks het radiaalmenu op een selecteerbaar canvasobject. Document-capture onderschept `contextmenu` om het browsermenu te blokkeren; `pointerup` blijft als fallback voor browsers waarbij `contextmenu` al tijdens de rechtsklikinteractie wordt verzonden. Rechts-sleep-kaderselectie mag geen radiaalmenu activeren.
- In `EditorApp.hitAt` heeft een selecteerbaar punt tijdens selectiemodus een voorkeurszone van maximaal 11 CSS-pixels vanaf zijn weergegeven positie. Expliciete label-, veelhoekhoekpunt- en lijneindpuntgrepen behouden voorrang, om hun versleepfunctie niet onbedoeld te breken.
- Voor het **puntobject** zijn de zes categorieën nu: **Constructie, Uiterlijk, Geometrie, Relaties, Acties, Alles**. Het eerdere, uitsluitend voor de pilot toegevoegde label-detailblok is verwijderd. Label tonen/verbergen blijft beschikbaar via het kleine icoon onder Acties (en in het volledige overzicht Alles).
- De bestaande sectie `data-property-section="relations"` wordt opnieuw gebruikt voor bronrelaties, constructieparameters en laagtoewijzing. Geen tweede relaties- of objectmodel.
- De cacheversies in `editor.html` zijn verhoogd naar `ui-radial-8`.

### Aandachtspunten voor handmatige controle
1. Linksklik op en sleep een vrij punt. Er mag geen apart eigenschappenicoon verschijnen.
2. Rechtsklik op een geselecteerd en niet-geselecteerd punt. Alleen het WIE-radiaalmenu verschijnt, niet het browsercontextmenu.
3. Rechts-sleep om een selectiegebied te trekken: geen radiaalmenu.
4. Controleer onder Relaties onder meer de bestaande laaginstelling en eventuele constructiebronnen.
5. Onder Acties: bestaande kleine iconen, inclusief label tonen/verbergen.
6. Vergelijk Constructie, Geometrie, Uiterlijk en Alles met de eerdere UI-RADIAL-7A/B-pilot; overige objecttypen blijven hun bestaande categorieën behouden.
7. Controleer interactie met overlappende objecten; de voorkeur voor punten geldt binnen 11 pixels, maar objectlabels/grepen zijn uitgezonderd.

**Teststatus:** geen geautomatiseerde of browsertests uitgevoerd, conform eerdere afspraak. Bronbestanden en push zijn statisch gecontroleerd; niet gemerged naar `main`.


## UI-RADIAL-8 — Cirkel en lineaire objecten (14 oktober 2026)

**Status:** doorontwikkeling op **dezelfde branch** \`codex/ui-radial-7-point-context-constructions\`, geen merge naar main. Deze sectie is een aanvulling op de eerdere puntpilot, die behouden blijft.

### Gedekte enkelvoudige selecties

- \`point\` (eerder UI-RADIAL-7, ongewijzigde eerste-punt-bronvolgorde).
- \`circle\` — cirkel.
- \`line\` — lijnstuk.
- \`straight\` — rechte.
- \`ray\` — halfrechte.
- \`vector\` — vector.

Bij een van deze geselecteerde objecten toont het zesdelige wiel: **Constructie · Uiterlijk · Geometrie · Relaties · Acties · Alles**. De eerder verwijderde losse eigenschappenknop wordt niet teruggebracht; openen gebeurt door rechtsklikken op de geometrie. Categorieën blijven zonder overlap: **Maat- en meetinstellingen** voor lijn/cirkel vallen onder **Geometrie**, **Relaties** bevat bestaande constructiebronnen en laagtoewijzing, **Acties** gebruikt alleen de bestaande kleine acties (inclusief labels), **Alles** biedt het volledige bestaande overzicht. Het radiaalwiel behoudt de compacte navy/gold-UI.

### Contextuele constructies uit bestaande toolcatalogus

- Op basis van \`ToolCatalog.list('sidebar')\`, \`ConstructionService.contract(kind).sourceRoles\` en \`ConstructionService.referencesForRole\`; alleen **geïmplementeerde** en toegestane gereedschappen zijn zichtbaar.
- **Cirkel:** onder meer punt op cirkel, raaklijn, snijpunt van twee cirkels, snijpunt lijn-cirkel, cirkelsector-/cirkelsegmentgebied, omtrek en oppervlakte (wanneer beschikbaar/geautoriseerd).
- **Lijnstuk:** onder meer loodlijn, evenwijdige, lijnsnijpunten, lijn-cirkelsnijpunten, punt op lijnstuk, middenpunt, middelloodlijn en hoek t.o.v. x-as waar contract/gereedschap beschikbaar is.
- **Rechte, halfrechte, vector:** toepasselijke lineaire constructies, bijvoorbeeld snijpunt, loodlijn, evenwijdige en hoek t.o.v. x-as. Halfrechte omvat indien beschikbaar ook oorsprong.
- **Geen dubbele geometrische kern:** \`EditorApp.startConstructionFromObject()\` is een kleine adapter die de bron vastlegt en de bestaande \`constructionClick\`/\`construction.create\`-pijplijn hergebruikt.
- **Bron op positie 2:** het geselecteerde object kan ook een latere bronrol vullen. Voor \`lineCircleIntersection\` kan de geselecteerde cirkel vooraf als tweede bron worden vastgelegd; de gebruiker kiest dan alleen nog de rechte.
- **Punt op pad:** na keuze van een cirkel/lijnstuk kiest de gebruiker expliciet een plaats op de geometrie, binnen 12 schermpixels van rand of lijn. De bestaande \`projectParameter()\` berekent vervolgens de afhankelijke parameter; er ontstaat geen statisch kopiepunt.
- **Gereedschappen met één bron** (zoals omtrek/oppervlakte/hoek t.o.v. x-as) worden rechtstreeks aangemaakt via de bestaande \`construction.create\`-opdracht, inclusief Undo/Redo en modelvalidatie.
- **Lijnstuk als twee bronnen:** \`midpoint\` en \`perpendicularBisector\` gebruiken expliciet de bestaande begin-/eindpuntverwijzingen van het lijnstuk; er hoeven geen aparte puntobjecten aangemaakt te worden.
- **Bewuste uitsluitingen:** \`distributedPointOnCircle\` vereist een afzonderlijke cirkelverdelings-/groepsoperatie; \`angleDirections\` vereist expliciete hoekarmrichting en mag niet op basis van een willekeurige oriëntatie worden ingevuld. Deze ontbreken daarom nog in de contextlijst, in plaats van een misleidende of ongeldige actie aan te bieden.


- **Selectiegemak:** cirkel, lijnstuk, rechte, halfrechte en vector krijgen bij normale canvasselectie een gerichte 11px-hitzone als er geen eerder geldig exact object geraakt werd. Puntselectie en expliciete labels/eindpuntgrepen behouden hun eigen voorrang.

### Handmatige acceptatie na het uitchecken

1. Rechtsklik op cirkel, lijnstuk, rechte, halfrechte en vector. Alle hebben **Constructie** en exclusieve categorieën. Er verschijnt geen los eigenschappenicoon.
2. Cirkel → **Punt op cirkel**: klik een plaats nabij de cirkelrand, controleer dynamische bronrelatie, versleep broncirkel, Undo/Redo.
3. Cirkel → **Raaklijn**: kies een tweede punt buiten de cirkel en verifieer de raaklijn.
4. Cirkel → **Snijpunt lijn-cirkel**: de cirkel moet vooraf als tweede bron vastliggen; kies een rechte en controleer het resultaat.
5. Lijnstuk → **Middenpunt** en **Middelloodlijn**: resultaat volgt het lijnstuk.
6. Lijnstuk → **Punt op lijnstuk**: klik nabij het segment, controleer het gekoppelde punt.
7. Rechte → **Evenwijdige / Loodlijn**: kies nog een punt, controleer uitkomst. Herhaal waar zinvol met halfrechte/vector.
8. **Geometrie** toont brongeometrie en maatinstellingen; **Relaties** bevat broninformatie en laagtoewijzing; **Acties** bevat compacte iconen en geen dubbele labels.
9. Selecteer een punt: de reeds goedgekeurde UI-RADIAL-7A/B-functionaliteit blijft intact.
10. Controleer onbevoegde/geblokkeerde/verborgen objecten, fullscreen, linksverslepen en contextueel rechtsklikgedrag.

**Teststatus:** geen geautomatiseerde of browsertests uitgevoerd, conform de eerdere afspraak. De implementatie is alleen door bron-/GitHub-controle bekeken. Er is nog **geen releasevalidatie** of merge naar \`main\`.
