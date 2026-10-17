# M8-INT.3-A0 — Implementatiepreflight

**Datum:** 17 oktober 2026
**Uitgangspunt:** origin/main e0b157fce4a17368016982193cdf9d5f0f04f911 (merge PR #32)
**Branch:** codex/m8-int-3-a0-implementation-preflight
**Scope:** read-only architectuur- en numerieke audit; alleen dit rapport is toegevoegd.
**Besluit:** CONDITIONAL GO voor M8-INT.3-B na de numerieke gate in §20. Geen productiecode- of merge-GO.

## 1. Executive summary

De bestaande constructiearchitectuur is geschikt. Eén ConstructionService registreert getypeerde recepten/bronrollen; de dependency resolver rekent constructies topologisch opnieuw uit; modelwijzigingen valideren en resolven vóór commit; command-, permission-, history-, export- en universele Snijpunt-paden bestaan. De uitbreiding kan deze paden hergebruiken zonder tweede documentmodel of geometrie-engine.

Op main bestaat nog geen .3-productierecept, solutionKey, schema 11 of UI-aanpassing. Ontbrekende bronnen, malformed recepten en cycles worden atomair afgewezen. Tijdelijke geometrische degeneratie behoudt het recept en object-ID als herstelbaar ongeldig object.

Numeriek is de hoofdpoort nog open. A2.1 certificeert volledige wortelsets en multipliciteiten voor expliciet exacte rationale invoer, maar niet voor algemene WIE-rotaties. A2.1b vindt geroteerde kandidaten snel, maar bewijst hun volledigheid niet; 15°, 45° en 60° eindigen daarom veilig als NUMERIC_UNRESOLVED. Een klein residu of vier kandidaten bewijst geen complete rootset.

Voorgesteld wordt een stateless, immutable solutionKey per punt plus minimale familyId-informatie om siblings uit één createactie als één injectieve toewijzingsset te valideren. Dit is geen continuatieregister. De solver berekent eerst de volledige actuele rootset; daarna matcht een aparte resolver roots aan vaste, disjuncte cyclische sectoren op de canoniek eerste bron. Geen root-rank als identiteit, geen bewegingsgeschiedenis, geen automatische optie-B-migratie.

CONDITIONAL GO: de bestaande architectuur en het gefaseerde plan zijn uitvoerbaar. Vóór productiecode moet een volledige, praktisch bruikbare solver de normale 15°/45°/60°-rotaties plus raakcontacten veilig oplossen. Zonder die bewijspoort blijft de implementatie NO-GO; onvolledige sets mogen geen punten opleveren.

## 2. Branch en uitgangscommit

- De oorspronkelijke checkout stond op codex/perf-1-baseline-audit, HEAD ff82dd79f3d06e20fa59f6c7ba6ed6c662b03403, met reeds staged wijzigingen. Die checkout is onaangeroerd.
- De eerste lokale origin/main was 5c57bb4f3b69b635876abe1c0e1824d76a12f7f4. Eerste fetch mislukte tijdelijk door DNS/threadfout. GitHub-connector bevestigde main e0b157fce4a17368016982193cdf9d5f0f04f911 (PR #32). Een volgende git fetch slaagde.
- De preflightbranch is uiteindelijk vanaf de actuele origin/main e0b157fce4a17368016982193cdf9d5f0f04f911 gemaakt. De aparte worktree was eerst van de oude ref afgetakt, bevatte toen geen wijzigingen en is vóór rapportwijziging naar de actuele main gerebased.
- Geen werk uit de staged checkout is overgenomen. Alleen dit rapport is gewijzigd.

## 3. Gecontroleerde documentversies

| Document | Gecontroleerde versie/status |
|---|---|
| AGENTS.md | 1.0.8, 2026-10-16 |
| docs/DEVELOPMENT-ROADMAP.md | 2.8.40, 2026-10-17 |
| docs/M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md | 1.1.6 |
| docs/M8-INT-3-KEGELSNEDEN-SNIJPUNTEN-ONTWERPCONTRACT.md | 1.0.3 |
| docs/M8-INT-3-A-MVP-IDENTITEITSCONTRACT.md | 1.0.0 |
| docs/M8-INT-1-LIJN-ELLIPS-ONTWERPCONTRACT.md | 1.0.1 |
| CONSTRUCTIONS.md | Actuele architectuurbeschrijving; geen versienummer |
| DOCUMENT-FORMAT.md | Actueel featuregate-overzicht; delen historisch gemarkeerd |
| docs/CORE-1-ARCHITECTURE-DESIGN.md | 1.2.2 |
| docs/UI-RADIAL-9-CONTRACT-DRIVEN.md | 1.1.1 |

A1, A2.1 en A2.1b-rapporten zijn uit de lokale onderzoeksrefs gelezen. Ze zijn als historisch onderzoek gebruikt; geen onderzoeksbranch is naar main gekopieerd.

## 4. Audit A — bestaande constructiearchitectuur

### Recepten, opslag en bronvalidatie

Een recept staat inline op het afhankelijke object: construction bevat kind, sources en receptvelden. ConstructionService registreert resultaatsoort, getypeerde bronrollen, branches en berekende velden. validate/validateReferences controleren receptvelden, bron-ID's, object- en onderdeeltypen, rolvolgorde en cycles. Polygonranden bewaren bijvoorbeeld een expliciete edge-index.

Bestaande recepten zijn lineIntersection, lineCircleIntersection, circleCircleIntersection en lineEllipseIntersection. De eerste heeft één oplossing; de andere huidige recepten gebruiken historische branch 0/1. Die semantiek moet ongewijzigd blijven; nieuwe 1–4-oplossingen mogen geen branch:0..3-patroon introduceren.

### Resolutie, herstel en historie

ConstructionService.resolve gebruikt een iteratieve postordertraversal, detecteert cycles en herberekent afgeleiden vanuit actuele bronnen. Model add/update/load roept de resolver aan vóór commit van de nieuwe modelstaat. Missende bron, verkeerd type, malformed recept of cycle wordt atomair geweigerd. Tijdelijke degeneratie laat construction bestaan, markeert constructionValid false, verbergt het object bij render/hit/snap/export en kan later herstellen.

Engine.constructIntersection bouwt een tijdelijk model, voegt daarin de gekozen punten toe en wisselt daarna het model. EditorApp.acceptIntersectionSource routeert create via het bestaande command- en changeDocument/historypad, selecteert de nieuwe IDs en schakelt na succes naar select. Bij nul oplossingen wordt geen command/history-entry gemaakt en blijft Snijpunt actief. M8-INT.3 moet dit uitbreiden naar een volledige, gecertificeerde set en alle sleutels als één transactie.

Undo/Redo herstelt de semantische documenttoestand en herberekent deterministisch. Bronverwijdering cascadeert; Undo herstelt afhankelijkheden. Bestaande duplicatie van een geconstrueerd object levert een vrije snapshot. Nieuwe familie-key duplicatie/rebindregels moeten expliciet worden vastgelegd.

### Dispatcher, ToolCatalog en contextmenu

ToolCatalog bezit de zichtbare universele tool construct:intersection. IntersectionDispatcher classificeert bronrollen en normaliseert bestaande bronvolgordes. EditorApp gebruikt ConstructionService.contextualPlans/referencesForRole; radiaalmenu bevat geen nieuwe type-allowlist. De huidige intersection-kindlijst en picker moeten intern worden uitgebreid, maar de UI krijgt geen afzonderlijke paar-knoppen.

Een afzonderlijk runtime-session.js bestaat niet in deze checkout; restricted runtime-/commandautorisatie zit in permission-runtime.js. index.js en het geladen editor.html-manifest blijven onderdeel van de integratie.

## 5. Audit B — voorstel definitieve solutionKey

Een slot op elk punt alleen is onvoldoende voor strict sibling-/familievalidatie. Sla daarom in elke key een immutable familyId op. Geen aparte persistente familie-/continuatieregistry.

    {
      "kind": "circleEllipseIntersection",
      "sources": [{"objectId":"C1"},{"objectId":"E1"}],
      "solutionKey": {
        "schema": 1, "familyId": "P1", "slot": 0,
        "firstFrame": "canonical-conic-v1",
        "frameKind": "circle-world",
        "anchorT": 0.095, "leftReach": 0.08,
        "rightReach": 0.08, "guardT": 0.005,
        "crossing": "positive"
      }
    }

Waarden zijn illustratief. familyId is uniek voor één createactie (advies: stabiel afgeleid van/equal aan eerste nieuwe point-ID; exacte regel vóór implementatie). slot is initiële creatie-index 0..3, geen actuele solverindex. Aparte acties op dezelfde bronnen zijn onafhankelijke families en mogen dezelfde geometrische positie bevatten. Geen revision, checkpoint, witness of padgeschiedenis.

Circle–ellipse wordt altijd naar circle, ellipse genormaliseerd. Ellipse–ellipse wordt deterministisch op object-ID geordend. De cirkelparameter gebruikt wereld +x als naad en wereldgerichte positieve hoek. Een niet-circulaire ellipse gebruikt de gevalideerde EllipseGeometry pointAt(t)-frame; brandpuntellipsen nemen de door EllipseGeometry.resolve bepaalde as. Een a=b-ellipse heeft geen geometrisch unieke hoofd-as: gebruik een expliciet wereldframe; een niet-stateless reconstrueerbare overgang tussen frames geeft AMBIGUOUS_BRANCH. Focuscoïncidentie is degeneraat.

Bij creatie: bereken de volledige wortelset, sorteer tijdelijk op parameter in het canonieke eerste frame, bepaal cyclische buurmidpunten en vorm onderling disjuncte kernsectoren met guardzones. De som van solverpositie-onzekerheid en framefout moet aantoonbaar kleiner zijn dan de guardmarge. Sla voldoende grensconventie op om inclusiviteit strict te valideren; alleen anchor/reach laat randgevallen ambigu.

Voor nul/één wortel zijn aparte omtrek-/singletonregels nodig. Tangency gebruikt crossing=tangent en bewezen multipliciteit. Een singleton die later splitst mag niet willekeurig een van de takken kiezen. Bij meervoudig contact is hoogstens één zichtbaar punt per familie toegestaan; overige betrokken keys blijven persistent en herstelbaar ongeldig.

Resolver groepeert siblings via familyId uitsluitend om dubbele toewijzing en inconsistente keys te detecteren. Iedere actuele root kan hoogstens één key matchen; onafhankelijke families delen geen exclusiviteit. Alle keyvelden immutable. Import weigert unknown fields/versies, NaN/Infinity, verkeerde range, dubbele family-slot, verkeerde bronrollen en inconsistente recipe-kind.

## 6. Herberekening, matching en invalidatiestatus

1. Valideer actuele bronnen/frame en verkrijg volledige onderscheiden rootset plus foutintervallen en multipliciteiten. Nooit een partial result.
2. Toets per key of precies één root in de eigen open kernsector en buiten guards ligt.
3. Los familiebrede matching injectief op. Geen greedy nearest-root, modelvolgorde of actuele rootrank. Meerdere geldige matchings betekent ambigu.
4. Behoud point.id, key, naam, stijl, label, laag/groep en afhankelijke constructies. Bronmutatie creëert geen nieuwe punten.
5. Dezelfde stateless geometrie die opnieuw één root per sector oplevert, herstelt dezelfde objecten.

Statusvoorstel: VALID bij één gecertificeerde root in eigen kernsector; AMBIGUOUS_BRANCH bij sector-/frame-/tangentambiguïteit of meerdere mogelijke mappings; NUMERIC_UNRESOLVED als volledigheid, multipliciteit, scheiding, positie of budget niet bewezen is; SOURCE_INVALID bij ongeldige bron; COINCIDENT_CONICS alleen bij bewezen samenvallende contouren. NO_REAL_INTERSECTION is create-uitkomst, geen reden om opgeslagen recepten te verwijderen. Een onbewezen nulcount mag niet als nul worden getoond.

## 7. Audit C — numerieke haalbaarheid

| Methode | Beoordeling |
|---|---|
| Analytische quartic + residucontrole | Snel; max vier geïsoleerde wortels in reguliere gevallen, maar residu en gewone doubles bewijzen geen volledigheid. Kwetsbaar bij hoge multipliciteit/ill-conditioning. |
| Adaptieve floating-point isolatie | Nuttig voor kandidaten en eenvoudige wortels; even-multipliciteitswortels/volledige rootcount niet bewezen zonder globale telmethode. |
| A2.1 exacte Sturm/GCD | Volledige count en multipliciteit voor exacte rationale invoer; 52/52 onderzoekstests, vierde-orde 4→1→4. Niet alle WIE-rotaties; interactieprestaties begrensd. |
| A2.1b trig-interval + kandidaten | Snelle kandidaatdetectie en onderzochte trigomhullingen; geen gecertificeerde algemene rootcount. 15°/45°/60° leveren vier kandidaten maar eindstatus NUMERIC_UNRESOLVED. |
| Voorgestelde gecertificeerde hybride | Exact dyadische/rationale coëfficiëntvorming vanuit de werkelijke resolved WIE-frames; kandidaten sturen isolatie; globale interval-Descartes/Bernstein-subdivision of gevalideerde Sturm-Habicht/resultanttelling; interval Newton/Krawczyk voor simpele roots; square-free/GCD voor multipliciteit; onafhankelijke residuomhullingen op beide conics. Nog niet geïmplementeerd of bewezen in deze scope. |

De MVP-solver moet de volledige projectieve parametercirkel met twee begrensde charts afdekken, chartnaad dubbel gecontroleerd, bestaan/uniqueness of multipliciteit aantonen, lokale isolatie-aantallen gelijkstellen aan globale telling, beide bronresiduen toetsen en bij budget-/conditioneringsfalen NUMERIC_UNRESOLVED zonder roots teruggeven. Math.sin/cos plus nextUp rond de library-uitkomst bewijst geen trigomhulling. Interval Newton alleen behandelt meervoudige wortels niet. Een hogere dedup-epsilon is geen oplossing.

De A2.1 exacte kern is een onafhankelijke oracle/startpunt. Maar een WIE-MVP die gewone 15°, 45°, 60° rotaties standaard unresolved laat, is contractueel onvoldoende. De boven beschreven hybride is een verdedigbaar onderzoekspad, nog geen production solver. Solver en identiteitsresolver blijven gescheiden.

## 8. Geometrische configuraties

Doelscope na bewijs: circle–ellipse en ellipse–ellipse, vrije en brandpuntgestuurde niet-gedegenereerde ellipsen, 0–4 geïsoleerde eindige reële roots, gewone rotaties, tangency/multipliciteit en beide bronvolgordes.

Fail-closed totdat bewijs bestaat: zeer dunne ellips, grote offsets/coördinaten, bijna-coincidentie, zeer nabijgelegen roots, hoge multipliciteit die niet geclassificeerd is, frame/assenwisseling, bijna-degeneratie, overflow en onduidelijke parameternaad. Gelijke contouren alleen COINCIDENT_CONICS wanneer bewezen; anders unresolved. Geen pixel-/polygon-approximatie.

## 9. Audit D — schema en serialisatie

model.js kiest nu constructionSchema op basis van aanwezige recepten; lineEllipseIntersection vereist schema 10. Voorstel: schema 11 voor ten minste één .3-recept met solutionKey, zonder top-level documentversion bump tenzij feitelijke readernoodzaak wordt aangetoond.

Schema 1–10 en oude recipes/branches blijven ongewijzigd. Schema 11 moet werken zonder lineEllipseIntersection en in mixed documenten alle oude recipes behouden. Strict import valideert recipe-kind, twee role refs, key schema, family/slot uniciteit, ranges en source graph vóór model commit. Writer kiest minimale noodzakelijke schema; oude docs upgraden niet ongemerkt. x/y is alleen afgeleide geometrie; point.id en solutionKey zijn persistente identiteit. Geen continuation schema, registry, witness, windinglog of checkpoints.

Verwijderen van één punt behoudt de overige familieleden. Dupliceren levert volgens huidig beleid een vrije snapshot; mocht een duplicate op enig pad keys behouden, krijgt die een nieuwe familyId. Rebind verandert de key niet; niet herkenbare bronmapping blijft herstelbaar ongeldig.

## 10. Permissions en security

Interne tools/receptrechten: construct:circleEllipseIntersection en construct:ellipseEllipseIntersection; zichtbaar blijft uitsluitend construct:intersection. Voeg concrete tool-ID's toe aan ToolCatalog, dispatch en command validator. Geen automatische rechtenovererving van andere snijpuntrecepten.

Bij aanbod én uitvoering moeten actuele toolAllowed, beide bronobjecten, visibility/read/display, recipe-specifieke sourceTools en create/batch-objectlimieten worden gecontroleerd via bestaand RuntimeSession/permission pad. Geen hidden/locked/denied objectinfo of key via contextmenu, preview, errordetail, cache, history, SVG/PNG of restricted JSON. Hele batch all-or-none.

## 11. Undo/Redo en afhankelijkheden

1–4 punten plus keys vormen één semantische command/history-entry; Undo verwijdert alles, Redo herstelt dezelfde IDs/keys. Bestaande resolver herberekent family en downstream graph bij iedere bronupdate. Invalid siblings blijven in graph; recovery behoudt labels/stijl/layer/group en children. Bronverwijdering cascadeert via huidige regels; Undo herstelt de set.

## 12. UI en interactie

Hergebruik Snijpunt: activeer, kies twee objecten, volledige rootset, atomair create, selecteer alle nieuwe punten, terug naar Selecteren. Nul, coincidentie zonder geïsoleerde roots, unresolved of permission failure: geen object/history; tool blijft actief. Bronambiguïteit blijft objectkeuze, geen rootpuntkeuze.

Integreer via contextualPlans/referencesForRole, tool catalog en bestaande editor. Geen aparte zichtbare cirkel–ellips-/ellips–ellipsknoppen. Verifieer beide source orders, radial menus van cirkel en ellips, fullscreen, restricted mode, locks/visibility, snap/hit testing en SVG/PNG. Ongeldige punten volgen bestaande suppression gate.

## 13. Optie-B migratie

Versioneer solutionKey onafhankelijk; houd solver en resolver gescheiden; oude A-documenten blijven leesbaar zonder B-runtime. Normale load/export/herberekening migreert niet.

Latere expliciete upgrade is een geautoriseerde, undoable transactie. Alleen een actuele ondubbelzinnige A-wortel wordt starttoestand van nieuw B-checkpoint. Behoud point IDs, bronnen, stijl, labels, lagen en descendants. Historische bewegingen zijn niet reconstrueerbaar. Ambigue/ongeldige A-punten worden niet omgezet. B-schema/history/permission krijgt een eigen besluit; geen B-code in A-MVP.

## 14. Implementatieplan B — cirkel–ellips

1. Bouw pure solver/result-module; definieer WIE-double semantics, full-root proof, multipliciteit, budget en safe-fail.
2. Registreer circleEllipseIntersection en strict A-key validity in ConstructionService; implementeer family-wide stateless resolver.
3. Voeg dispatcher canonical role order, atomic 1–4 create, command/replay/import, permission en minimum schema 11 toe in bestaande modules.
4. Voeg tool-ID's intern toe aan ToolCatalog, permission catalog, EditorApp kind list/source picker/context plans; zichtbare UI blijft universeel.
5. Werk scriptmanifest en pas na acceptatie constructie-/documentatiecontracten bij.
6. Node tests: INT-301–306 independent exact oracles, roots/multiplicities, sectors/frames, 4→2/3→4, import/rebind/duplicate/replay/permission; alle legacy recipes.
7. Edge: both source orders, circle/ellipse radial, atomic 4-point create, Selecteren, no-root/unresolved no-op, undo/redo, restricted permissions, invalid/recovery, snap/hit/export.
8. Handmatige acceptatie: gewone 15°/45°/60°, 0–4, tangencies, movement/recovery, labels/style/children, fullscreen.

## 15. Implementatieplan C — ellips–ellips

Herbruik bewezen solver/key machine. Voeg ellipseEllipseIntersection toe; canonieke object-ID-bronvolgorde en beide parametrische frames. Test twee geroteerde vrije ellipsen, twee focusgestuurde en gemengde ellipsen; gelijke/bijna gelijke contouren; vier crossings; hogere multipliciteit; near roots/thin ellipses; sector guard en herstel. C start pas na B-acceptatie plus eigen GO.

## 16. Implementatieplan D — eindacceptatie

Volledige npm test en npm run test:edge; schema 1–10 roundtrip plus mixed schema 11; malformed/unknown keys/refs/families; restricted/default-deny tool/source/create permissions; batch create, undo/redo/replay; downstream invalidity/recovery; SVG/PNG, hit/snap; beide bronvolgordes, radial/fullscreen handmatig. Rapporteer exact counts, skips, scope, statuscodes en performance. Implementatierapport en aparte gebruikersacceptatie/merge-GO. Geen automatische merge.

## 17. Teststrategie

### A-ID-001 t/m A-ID-015

001: vier root IDs/keys, één Undo, Selecteren. 002: kleine beweging behoudt IDs/naam/label. 003: 4→2→4 fixed-sector herstel. 004: 4→3→4 max één family contact zichtbaar. 005: sectoroverschrijding expliciet invalid, geen stille sprong. 006: cyclische 0/2π naad. 007: import/export/Undo/Redo exact reproduceerbaar. 008: objectvolgorde-onafhankelijk. 009: invalid focus ellipse en descendants herstellen. 010: beide pair soorten/source orders. 011: null/coincident/unresolved/denied is no-op, tool actief. 012: mixed schema/duplicate/rebind/restricted/export/snap/hit/SVG/PNG. 013: 0–4, fourth-order, near roots, normal rotation and fail-closed extremes. 014: aparte create acties op dezelfde sources vormen onafhankelijke families. 015: geen automatische B-upgrade; A werkt zonder B.

### INT-301 t/m INT-323

301 vier; 302 nul; 303 twee raakpunten; 304 externe enkelvoudige tangent; 305 drie inclusief tangent; 306 coincidente circle/ellipse; 307 equivalent 90° frames, vier; 308 twee; 309 één tangent; 310 nul; 311 drie met a=b ellipse; 312 equivalente contour; 313 beide bronvolgordes; 314 A-sectorherstel 4→2/3/1→4; 315 naad/gelijke x-y wortels; 316 0/15/45/60/90 rotaties; 317 dun/grote offset/near tangent; 318 save/load/replay/undo/rebind/duplicate/layer/dependents; 319 schemas/malformed; 320 restricted; 321 UI/radial/success/failure; 322 invalid/recovery/export/hit/snap; 323 alle vier bestaande recipe regressies.

Daarbij schema 1–10 en onbekende key versions, missende sources/roles, rebind, individual/batch duplicate/delete, Undo/Redo, restricted capabilities, import/export, vrije en focusgestuurde deformation en NUMERIC_UNRESOLVED. 180° continue monodromie is uitsluitend optie B; A test vaste sectorpolicy.

## 18. Risico's

- Hoog: volledige worteltelling en multipliciteit; onvolledige roots creëren blijvende foute punten.
- Hoog: solver moet WIE resolved double-frame semantiek gebruiken, niet stilzwijgend ideale input reconstrueren.
- Hoog: cirkel/a=b-ellipse/focus-frame heeft niet-unieke as; framewisseling maakt identity ambigu.
- Hoog: sector guards, singleton, tangency keeper en nabije wortels vragen bewijs en precieze inclusiviteit.
- Middel/hoog: A2.1 gewone exacte roots benchmarkte circa 107 ms median; extreme nabijheid circa 7.9 s in A2.1b rerun. Kandidatenscan circa 1 ms is geen eindsolver; echte browserrespons en cancellation niet bewezen.
- Middel: bestaande selectedBranches command accepteert max twee 0/1 values; nieuw 1–4 batch vraagt strikte family-validatie en runtime-limieten.
- Middel: schema 11, importer, ToolCatalog, restricted projection en exportvalidatie moeten synchroon blijven.

## 19. Open beslissingen en advies

1. FamilyId: advies ja, minimal immutable ID in elke key, geen registry; leg ID generatie/duplicate vast.
2. Frame gauge voor cirkelvormige, focusgestuurde en axis-switch ellips: ambiguity fail-closed waar stateless herstel ontbreekt.
3. Sector endpoint/guard en singleton-policy exact definiëren; root error plus frame error moet strikt onder guard vallen.
4. Tangency keeper: bij geen unieke A-sector match alle betrokken keys invalid, geen keuze via modelvolgorde.
5. Bevestig schema 11, geen top-level bump, object invalidity/reasoncode schema.
6. Kies proof implementation/library en browserbouw; geen gevalideerde dependency is nu geselecteerd.
7. Stel werkbudget/deadline/performance in zonder fail-closed te verzwakken.

## 20. GO-beoordeling

### CONDITIONAL GO — M8-INT.3-B na solverbewijs

Constructie-, model-, dispatcher-, command-, permission-, history- en UI-architectuur is bruikbaar; legacy recipes kunnen intact blijven; schema 11 is een voorstelbare featuregate; A-key is gescheiden van solver en optie B vereist geen huidige checkpointarchitectuur. Een exact-dyadische/gecertificeerde interval-hybride is een concreet onderzoekspad.

Maar huidige onderzoeksuitvoering is geen productiegeschikte solver. A2.1 heeft beperkte exacte inputsemantiek en kostensignalen; A2.1b heeft kandidaatdetectie maar geen algemene volledige rootcount. De contractuele gewone 15°/45°/60° gevallen blijven unresolved en dit is expliciet onvoldoende voor de beoogde MVP. Daarom autoriseert deze conditional beoordeling geen productie-rootsetcode vóór demonstratie van volledige onafhankelijke bewijsresultaten en bruikbare prestaties voor die normale gevallen, tangency/multiplicity en no-partial-result budget exhaustion. Als die poort niet haalbaar blijkt, wordt het NO-GO tenzij gebruiker de scope wijzigt.

Na die gate is voor B nog aparte gebruikers-GO nodig; C volgt na B-acceptatie en aparte GO; D/merge blijven aparte besluiten. Geen implementatie is gestart.

### Verificatie uitgevoerd

- npm test op e0b157fce4a17368016982193cdf9d5f0f04f911: **754/754 PASS**, 0 failed, 0 skipped.
- De eerste uitvoering van npm run test:edge stopte vóór de eerste suite omdat Playwright niet vindbaar was in de schone worktree.
- De tweede uitvoering van npm run test:edge gebruikte de bestaande repository/node_modules en Edge-installatie. De run bereikte V2 suite: selection. De volledige run is daarna op expliciet gebruikersverzoek afgebroken; status **incompleet**, geen suite-eindtelling en geen PASS geclaimd.
- Geen nieuwe M8-INT.3-productietests of solverprototypes uitgevoerd: A0 stond alleen read-only verificatie toe. De bestaande researchresultaten zijn uit de rapporten beoordeeld, niet opnieuw gerund. Geen handmatige UX-acceptatie uitgevoerd.

---

**A0-resultaat:** read-only implementatiepreflight afgerond. Productiecode ongewijzigd. Wacht op rapportreview en afzonderlijke B-autorisatie.

