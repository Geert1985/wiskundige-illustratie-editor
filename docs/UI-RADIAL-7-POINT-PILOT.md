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
