# WIE-TOOL-L3.4 — Centrale lifecycle voor Snijpunt en contextconstructies

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l3-4-intersection-context-lifecycle`.
Basis: actuele `origin/main` `6581935`, met L3.3c geïntegreerd via PR #39.

## Resultaat

De gewone Snijpunt-route en directe contextconstructies met een volledig `complete`-plan melden een geslaagde `construction.create` nu bij `EditorApp.completeToolInteraction()`. Snijpunt gebruikt de bestaande `single`-gereedschapspolicy en keert na succes terug naar Selecteren. Directe contextconstructies gebruiken dezelfde centrale completion met context-complete-semantiek: de huidige tool blijft actief en een onafhankelijke canvasinteractie wordt niet gewist.

De lifecyclecatalogus blijft uitsluitend echte gereedschaps-ID's bevatten. `completeToolInteraction()` controleert de policy van het betrokken gereedschap en onderscheidt daarna `origin:'context-complete'`. Dat contextpad schrijft de resulterende selectie, status en render bij, maar ruimt de bestaande interactiestaat, preview, feedback en pointercapture niet op. Er is geen tweede policycatalogus toegevoegd.

## Snijpunt-callflow en uitkomsten

1. `intersectionClick()` vraagt de bestaande rolbewuste picker om bronopties. Geen optie houdt het gereedschap actief zonder interactie of documentmutatie. Meerdere opties blijven tijdelijk als `pendingSourceOptions` beschikbaar voor de keuze in de instructies.
2. `acceptIntersectionSource()` voegt de gekozen bron toe en roept na twee bronnen `MI.IntersectionDispatcher.evaluate()` aan. Een niet-ondersteunde combinatie houdt de eerste bron vast. Een combinatie die niet is toegestaan, een niet-beschikbare bron en nul geometrische kandidaten volgen hun bestaande afwijzingspad; er is geen lifecycle-completion.
3. Bij kandidaten voert de bestaande route één `construction.create`-commando uit met de opgeloste recepttool en bronnen. Een commandofout laat de eerste bron staan, geeft eventuele pointercapture vrij en toont de fout. De gebruiker kan de tweede bron opnieuw kiezen.
4. Alleen bij `outcome.ok` én een niet-lege gemaakte-objectenlijst roept de adapter `completeToolInteraction()` aan met `toolId:'construct:intersection'`, `origin:'canvas'` en alle gemaakte IDs. De centrale `single`-policy ruimt interactie, preview en feedback op, geeft capture vrij, selecteert alle resultaten en schakelt naar Selecteren. De adapter zet daarna `intersectionCompleted=true`, omdat `setTool('select')` die bestaande marker reset. De status behoudt het gemaakte aantal.
5. Als het commando formeel slaagt maar geen object retourneert, wordt geen succes geclaimd en vindt geen completion plaats. De eerste bron blijft beschikbaar voor herstel. Dit is afzonderlijk getest naast nul geometrische kandidaten.

Een lijn-lijn-snijding levert één geselecteerd punt op. De lijn-cirkelcasus met twee oplossingen behoudt beide geselecteerde punten. Beide resultaten vormen één lokaal undo-stap; redo herstelt het document en de selectie. Een commando-uitzondering wordt gevolgd door een succesvolle retry in één history-stap.

`intersectionCompleted` wordt in de actuele bron alleen gezet of gereset; er zijn geen lezers gevonden. De marker wordt na deze migratie behouden voor compatibiliteit, maar is geen actieve beslisser voor pointer- of toolgedrag.

## Directe contextconstructies

`startContextConstruction()` valideert nog steeds geselecteerd object, toolbeschikbaarheid, capability en het bestaande serviceplan. Alleen een niet-universeel `plan.mode === 'complete'` neemt de directe route. Die roept `changeDocument(..., {cancelInteraction:false})` aan, zodat de bestaande `cancelInteraction`-standaard voor andere documentacties behouden blijft.

Het callbackresultaat moet een array bevatten. De gemaakte ID's en nieuwe selectie worden vóór het registreren van de lokale history-snapshot bijgewerkt; daardoor herstellen undo en redo respectievelijk de bronselectie en de resultaatselectie. Een commandofout of lege resultaatlijst bereikt de centrale completion niet en behoudt de oude selectie en tool. Een succesvolle context-completion geeft de echte constructietool-ID door, zodat de lifecyclecontroller de geregistreerde policy blijft valideren, maar gebruikt `origin:'context-complete'` om toolwissel en opruiming van een onafhankelijke interactie over te slaan.

De gerichte test voert een directe midpoint-contextactie uit vanuit zowel Selecteren als Lijn. In de Lijn-casus blijven dezelfde interactieobjectreferentie, preview, feedback en pointercapture bestaan. De selectie van het nieuwe object wordt wel toegepast en maakt deel uit van undo/redo. Dit is bewust routegedrag: de contextactie beëindigt alleen haar eigen documentmutatie; ze bezit geen tijdelijke canvasinteractie om op te ruimen.

Contextplannen met `mode:'prefill'` zijn niet veranderd. Ze activeren het gereedschap, plaatsen broninformatie in de normale interactiestaat en wachten op de canvasactie. De regressie controleert dat er vóór de latere constructie geen completion of documenthistory ontstaat.

## Foutafhandeling, annulering en geschiedenis

- Snijpunt zonder bron, ongeldige broncombinatie, geen geometrische kandidaten en succesvolle commandaanroep zonder objectresultaat: gereedschap blijft Snijpunt; geen completion of documentmutatie. Bij ongeldige paren en ontbrekende snijpunten blijft de eerste bron staan.
- Snijpunt-commandofout: geen completion of history; eerste bron blijft staan en opnieuw kiezen kan slagen.
- `Esc` tijdens pending Snijpunt-bronselectie: bestaande annulering schakelt naar Selecteren, wist de interactie en preview, en maakt geen history-entry.
- Direct context-commando geweigerd of zonder objectresultaat: geen centrale completion; vorige tool en selectie blijven behouden.
- Direct context-succes: selectie wordt vóór de lokale history-opname geschreven. Undo verwijdert de constructie en herstelt de bronselectie; redo herstelt de constructie en resultaatselectie.
- Context-prefill: de centrale completion wordt pas na de daadwerkelijke canvasconstructie aangeroepen.

`changeDocument()` voert de bestaande history-opname uit en runt het render/invalidate-pad ook bij fout. RuntimeHistory blijft de door de runtime vastgelegde commandgeschiedenis volgen; deze gerichte nieuwe tests gebruiken de bestaande EditorApp-testfixture en er is geen volledige runtime-, browser- of Edge-run gedaan.

## Consistentie en resterende aandachtspunten

Na deze fase heeft een geslaagde Snijpunt-canvasconstructie dezelfde centrale cleanup- en `single`-tooltransitie als de andere enkelvoudige constructiegereedschappen. Directe context-completeacties delen de centrale succesgrens, selectieafhandeling en status/render, met behoud van de contextregel dat de voorafgaande tool actief blijft. Context-prefill blijft terecht een onvoltooide, canvasgestuurde interactie.

De adapters blijven verantwoordelijk voor bronmatching, geometrievalidatie, herstelbare bronstatus en het onderscheiden van geen resultaat. De centrale controller blijft verantwoordelijk voor geslaagde completion, selectie en lifecyclecleanup. Voor direct context-complete geldt een context-origin-pad in dezelfde controller; een volgende lifecyclefase kan dit expliciete origin-contract documenteren als vaste publieke API als meer contextacties worden gemigreerd.

## Gerichte validatie

- `node --test --test-name-pattern="WIE-TOOL-L3.4|WIE-TOOL-L1 intersection refusal|WIE-TOOL-L1 context complete" tests/lifecycle.test.cjs` — 8/8 PASS.
- `node --test --test-name-pattern="WIE-TOOL-L3\.(3c|3b|3a|2|1)" tests/lifecycle.test.cjs` — 19/19 PASS.
- `node --check editor.js` en `node --check tests/lifecycle.test.cjs` — PASS.
- `git diff --check` — PASS.
- Geen volledige Node-suite en geen Edge/browser-run uitgevoerd.

## Scope

Alleen L3.4 is uitgevoerd. De wijziging is niet gemerged. L3.5 is niet gestart.
