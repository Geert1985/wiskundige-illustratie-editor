# WIE-TOOL-L2 — Centrale gereedschapslevenscyclus

Datum: 17 oktober 2026. Branch: `codex/wie-tool-l2-central-lifecycle`.
Basis: actuele `origin/main` na de L1-merge, `dcd72a7fa55ce425c01eb3cef8077c33dc1c0ebe`.

## Resultaat en afbakening

L2 voegt een centrale, succesbewuste afrondingsfunctie toe en registreert een expliciet levenscyclusbeleid voor alle 37 zichtbare geïmplementeerde gereedschappen. Twaalf vrije teken- en invoergereedschappen hebben beleid `repeat`; 25 gekoppelde constructiegereedschappen hebben beleid `single`. Dit beleid beschrijft de gewenste afronding, maar migreert in deze fase alleen vrije lijncreatie en de canvasroute voor Middenpunt naar de centrale controller.

Bij succesvolle lijncreatie ruimt `completeToolInteraction()` de interactie, pointercapture, preview en feedback op en laat het gereedschap actief. Bij een mislukte documentactie wordt de completion geweigerd en blijft de lijnmodus actief. Bij succesvolle canvas-Middenpuntconstructie selecteert de functie de nieuwe constructie en keert terug naar Selecteren. Bij fout blijven de eerder gekozen bron en constructiemodus beschikbaar voor een retry.

De overige constructieroutes, waaronder generieke gekoppelde constructies, padpunt, ellips, parallellogram, Snijpunt, objectafhankelijke contextacties en constructies die meerdere objecten opleveren, houden hun bestaande L1-afhandeling. De `select`-modus is geen creatiegereedschap en heeft daarom geen policy-entry. L3 en verdere migratie van routes vallen buiten deze opdracht.

## Techniek

`TOOL_LIFECYCLE` in `editor.js` is een bevroren beleidstabel en is via `MI.ToolLifecyclePolicies` inspecteerbaar. Bij het opbouwen van een niet-lege gereedschapscatalogus controleert de editor dat ieder geïmplementeerd gereedschap een policy heeft en dat er geen extra policy-entry bestaat. Een lege catalogus wordt alleen door de minimale testfixture gebruikt; in de app wordt het register tegen de zichtbare catalogus gecontroleerd.

`completeToolInteraction({toolId, outcome, origin, selection})` doet niets als `outcome.ok` niet waar is en weigert onbekende gereedschappen met een fout. Bij succes ruimt de functie interactiestaat, pointercapture, preview en feedback op, past optioneel de selectie toe en volgt de geregistreerde `single`- of `repeat`-policy. `changeDocument()` blijft verantwoordelijk voor de synchrone commanduitkomst en historyregistratie.

Vrije lijncreatie gebruikt `changeDocument()` zodat een commandexception geen succesgedreven lifecycle-afronding kan veroorzaken. De canvas-Middenpuntroute roept de controller alleen aan na een geslaagde `construction.create`; op fout blijft de eerste bron staan en wordt pointercapture vrijgegeven zodat de gebruiker de constructie kan herstellen.

## Gewijzigde bestanden

- `editor.js`: beleidstabel, cataloguscontrole en centrale completion; migratie van lijn en canvas-Middenpunt.
- `tests/lifecycle.test.cjs`: zes L2-tests voor registerdekking, completionvoorwaarden, herhaalde lijncreatie, fout/retry en bewust niet-gemigreerde routes.
- `docs/WIE-TOOL-L2-REPORT.md`: dit verslag.
- `docs/DEVELOPMENT-ROADMAP.md`: actuele L2-branchstatus; geen main-integratieclaim.

## Verificatie

Uitgevoerd vanuit de branchcheckout:

```powershell
node --test tests/lifecycle.test.cjs
node --check editor.js
git diff --check
```

**112/112 lifecycle-tests PASS.** De suite bevat ook de bestaande L1- en lifecycle-regressietests. Aanvullend slagen de JavaScript-syntaxcontrole en whitespacecontrole. Er is geen volledige Node-suite, browserregressiesuite of Edge-run uitgevoerd; de tests gebruiken de bestaande gesimuleerde DOM-fixture.

De nieuwe tests bewijzen dat de policytabel overeenkomt met alle 37 zichtbare gereedschappen, completion alleen op succes plaatsvindt, lijncreatie herhaalbaar blijft, mislukte lijncreatie geen document/historywijziging of completion geeft, Middenpunt bij fout herstelbaar blijft en bij succes naar Selecteren terugkeert. Ze bevestigen ook dat parallelconstructie, Snijpunt en context-complete buiten de centrale completion blijven.

## Status

Commit `0c1dd34` bevat de implementatie en tests. De branch is naar GitHub gepusht. De branch is nog niet handmatig geaccepteerd, als PR ingediend of gemerged naar `main`. Geen Edge-run uitgevoerd. L3 is niet gestart.
