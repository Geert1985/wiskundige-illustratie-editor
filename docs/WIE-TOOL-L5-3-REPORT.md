# WIE-TOOL-L5.3 — Pilot Punt via declaratieve lifecycle

Datum: 17 oktober 2026  
Branch: `codex/wie-tool-l5-3-point-pilot`  
Basis: actuele `origin/main` `705cdd889c7d1e7f9877716864f90818faa5b538`, inclusief L5.2 via PR #44  
Scope: audit van `point`, minimale integratieverificatie en gerichte tests

## 1. Uitkomst

De puntcreatieroute gebruikt al de centrale L5.2-registratie en completion. De audit vond geen productie-integratiekloof. Daarom bevat L5.3 alleen drie gerichte lifecycletests, dit rapport en de roadmapstatus; `editor.js`, `editor.html` en `tool-catalog.js` zijn niet aangepast.

**Beoordeling: GO voor de L5.3-pilotcontracten op basis van de uitgevoerde gerichte Node-verificatie.** De eerder geaccepteerde L4-browser/native-dialogbeperking blijft apart open en is in deze fase niet opnieuw onderzocht. Er is geen browser- of Edge-resultaat geclaimd.

## 2. Huidige route en L5.2-integratie

| Stap | Huidige eigenaar en gedrag | Status |
|---|---|---|
| Registratie inlezen | De `point`-knop in `editor.html` declareert `data-lifecycle="repeat"` en `data-interaction-adapter="point"`. `ToolCatalog.build()` in `tool-catalog.js` leest die attributen in en `create()` valideert lifecycle en adapter. | Bewezen door broncode en catalogustest. |
| Activeren | De gereedschapsknop roept `setTool('point')` aan. `setTool()` controleert toegang, ruimt een voorgaande interactie op en zet `this.tool`. | Bewezen door broncode; activeringsgedrag wordt via de lifecyclefixture gebruikt. |
| Canvasinput en positie | `pointerDown()` controleert de pointer/tooltoegang, zet de canvaspositie om en `snap()` bepaalt de definitieve positie. | Bewezen door broncode en gerichte lifecycleproef. |
| Create-commando | De handler maakt `{type:'point', x, y}` en roept `createObject()` aan; dit gebruikt het bestaande `object.create`-commando met tool-ID `create:point`. `changeDocument()` behoudt de bestaande command-, autorisatie- en historygrens. | Bewezen door broncode; succesvolle tests gebruiken de echte lokale command- en historyinfrastructuur. |
| Uitkomst verwerken | `changeDocument()` retourneert `{ok:true,result,error:null}` of vangt de fout en retourneert `{ok:false,...}`. De point-handler geeft die uitkomst door aan `completeToolInteraction()`. | Bewezen door broncode en succes-/foutproeven. |
| Selectie en lifecycle | Bij succes wordt het nieuwe ID geselecteerd. `completeToolInteraction()` haalt `lifecycle` van de toolentry op uit `this.toolCatalog`; `repeat` laat `point` actief. | Bewezen door broncode en integratietest. |
| Herhaalde creatie | Een volgende canvasklik loopt opnieuw door dezelfde `pointerDown()`-route zonder heractivering. | Bewezen door twee opeenvolgende succesvolle creaties in één testsessie. |

De catalogusmetadata vervangt geen gespecialiseerde punt-handler: omzetting en snapping van coördinaten, de payload voor `object.create` en selectie blijven bij de editorroute. Alleen lifecyclebeleid komt uit de centrale registratie. Er bestaat geen afzonderlijke point-lifecyclemap; de resterende `MI.ToolLifecyclePolicies`-view is in L5.2 afgeleid voor compatibiliteit en wordt niet door deze point-route geraadpleegd.

## 3. Succes, fout, annulering en historie

Succes maakt per klik één punt, roept de centrale completion één keer met een succesvolle `canvas`-uitkomst aan, selecteert dat nieuwe punt en houdt Punt actief. De test maakt direct daarna zonder nieuwe toolkeuze een tweede punt. Undo verwijdert alleen de tweede creatie en redo herstelt de opgeslagen documentstaat.

Bij een commandfout wordt de completionfunctie wel met de mislukte uitkomst aangeroepen, zoals de bestaande handler dat doet. De centrale completion retourneert direct `false` voor `outcome.ok === false`: er volgt dus geen **succesvolle** completion en de actieve tool wijzigt niet. De snapshotgeschiedenis registreert geen entry wanneer het document onveranderd bleef. De test herstelt daarna het echte commando en bewijst dat retry via dezelfde tool slaagt. De foutproef injecteert een fout op de `execute()`-grens; zij is geen afzonderlijke runtime-permissionstest.

Escape zonder lopende canvasgesture volgt de L4-annuleringsroute: de actieve Puntmodus keert terug naar Selecteren, de bestaande selectie blijft behouden en het document/history blijven gelijk. Een expliciete toolwissel vanaf Punt maakt evenmin een object of history-entry. De L5.3-tests gebruiken de bestaande EditorApp-cancel- en toolwisselpaden, maar voeren geen browser-/native-dialoginteractie uit.

## 4. Gewijzigde bestanden

- `tests/lifecycle.test.cjs`: drie L5.3-tests voor registratie/succes/repeat/history, mislukte create/retry en Escape/toolwissel.
- `docs/DEVELOPMENT-ROADMAP.md`: L5.2 als geïntegreerd via PR #44 geregistreerd; L5.3-status, basiscommit en verificatie toegevoegd.
- `docs/WIE-TOOL-L5-3-REPORT.md`: dit audit- en verificatierapport.

Geen productieaanpassing was nodig; de 36 andere gereedschappen zijn niet gewijzigd.

## 5. Verificatie

Uitgevoerd op de L5.3-branch:

```text
node --test --test-name-pattern="WIE-TOOL-L5.3" tests/lifecycle.test.cjs
3/3 geselecteerde tests PASS

node --test tests/tool-catalog.test.cjs
5/5 tests PASS

node --check editor.js
PASS

node --check tests/lifecycle.test.cjs
PASS

git diff --check
PASS
```

Geen volledige Node-suite, browsermodule of Edge-run uitgevoerd.

## 6. Resterende risico's en bewijsgrenzen

- De fouttest injecteert een execute-fout om de bestaande `changeDocument()`-rollback-/completiongrens te bewaken. Een aparte geweigerde RuntimeSession-autorisatie is in L5.3 niet opnieuw gesimuleerd; permissie-engine en commandvalidatie zijn ongewijzigd.
- Escape, focus, pointercapture en native kleur-/tekstdialogprioriteiten zijn hier niet browserbewezen. Het L4-rapport documenteert de ontbrekende Playwright-browserverificatie; dit bekende risico blijft open.
- De tests bewijzen de puntpilotroute in de bestaande DOM-/EditorApp-fixture. Zij bewijzen geen handmatige UX-acceptatie of volledige regressievrijheid van WIE.

## 7. Advies voor L5.4

Kies één volgende adapterfamilie of één beperkte route op basis van concreet contractrisico. Begin met een route-audit en voeg tests toe die de geregistreerde adapter aan de bestaande handler koppelen, zonder op basis van alleen de adapterstring een nieuwe dispatcher in te voeren. Behoud de command-, autorisatie- en history-eigenaarschap. Verwijder de tijdelijke `MI.ToolLifecyclePolicies`-view pas wanneer tests en eventuele consumers er niet meer van afhankelijk zijn. L5.4 is niet gestart.
