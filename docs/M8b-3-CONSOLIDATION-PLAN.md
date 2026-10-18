# M8b-3 — Consolidatie- en eindacceptatieopdracht

**Documentversie:** 1.0.0  
**Status:** preflight en statische repository-audit uitgevoerd; uitvoerbare regressiecontrole nog open  
**Datum:** 2026-10-16  
**Uitvoerbranch:** `codex/m8b-3-final-consolidation`  
**Geverifieerde basis:** `main` op `141f6c6c0722b5adca02d5ab5ff03d836c8b2320`  
**Featureacceptatie:** M8b-1 via PR #21; M8b-2/2b/2c handmatig geaccepteerd en via PR #22 gemerged.  
**Mergebeleid:** géén automatische merge naar `main`; gebruiker geeft expliciete GO/NO-GO.

## 1. Doel en grens

Sluit het volledige M8b-traject af door een **gerichte regressie- en compatibiliteitsaudit** op de reeds goedgekeurde code. M8b-3 voegt **geen nieuwe functies** toe. Behoud het huidige `parallelogramBySideAngle`-polygonrecept, de vaste A/B-bronrollen en vertexindexen, individuele metingen, bestaande-Q-plaatsing, ±90°-/gelijke-zijdensnaps en `sideLengthMode:"matchAB"`.

Bestaande contracten en tests zijn leidend voor de gewenste invarianten, voor zover niet uitdrukkelijk door latere gebruikersbesluiten vervangen. Vermijd grootschalige refactoring, nieuwe objecttypen of schemawijzigingen. Los uitsluitend aantoonbare regressies op; documenteer voor iedere fix de reproductie en het geschonden contract.

## 2. Reeds uitgevoerde preflight — controleerbare feiten

1. Op 16 oktober 2026 stond `main` op `141f6c6c0722b5adca02d5ab5ff03d836c8b2320`, ná de merge van PR #22 en de documentenregistratie.
2. PR #22 bevat de volledige M8b-2/2b/2c-keten; de laatste featurecommit was `9bfbfa2e7fc0b89e7aeef4f99f3f27804af062b6`.
3. De repository bevat de gerichte Node-tests `tests/parallelogram-m8b.test.cjs`, `parallelogram-m8b2.test.cjs`, `parallelogram-m8b2b.test.cjs` en `parallelogram-m8b2c.test.cjs`; ook de vier bijbehorende Edge-modules zijn aanwezig.
4. `package.json` gebruikt `npm test` = `node --test tests/*.test.cjs` en `npm run test:edge` = `node tests/browser.cjs`. De Edge-runner heeft de gerichte schakelaars `M8B1_ONLY`, `M8B2_ONLY`, `M8B2B_ONLY` en `M8B2C_ONLY` (controleer de actuele exacte namen voordat ze worden aangeroepen).
5. De **laatst gerapporteerde**, niet onafhankelijk opnieuw uitgevoerde M8b-2c-tests waren 705/705 Node-tests PASS en een volledige Edge-suite PASS zonder page errors.
6. GitHub Actions op `main` toont succesvolle **Pages-builds** voor zowel de PR #22-merge als de latere documentatie-HEAD. Dat is **geen bewijs** van `npm test` of `npm run test:edge` op `main`.

**Belangrijk:** deze preflight omvat alleen GitHub-codelezing en vergelijking van repositorybestanden. Er is in deze audit nog **geen** lokale Node- of Edge-suite gestart. Codex moet de werkelijke tests op de uitcheckte branch uitvoeren en rapporteren.

## 3. Geconstateerd documentatieverschil (DOC-1)

Het M8b-ontwerpcontract v1.3.0 bevat nog historische normatief geformuleerde uitspraken die de later goedgekeurde wijzigingen tegenspreken:

- §3: tekst dat `side:0`, `side:3`, `angle:0` op nieuwe parallellogrammen **standaard zichtbaar** zijn; de goedgekeurde M8b-2b-standaard is **alle tien standaard verborgen**.
- §6.2: een oude Edge-testbeschrijving met **standaard drie zichtbare labels**; de testverwachting is inmiddels gewijzigd.
- De vroege versiesecties verwijzen alleen naar schema 8; §9 introduceert correct schema 9 voor `matchAB`. Maak duidelijk welk deel historische fasebeschrijving is en welk deel actueel normatief is.
- De contractheader en onderste implementatiestatus zeggen nog dat M8b-2/2b/2c niet op `main` staan; PR #22 heeft ze inmiddels geïntegreerd.

**Uitvoering DOC-1:** corrigeer de tegenstrijdigheden **zonder** het historische besluitspoor te verwijderen. Leg vast dat de finale productsemantiek uit M8b-2b/2c prioriteit heeft; verhoog de contractdocumentversie naar v1.3.1 (uitsluitend documentatiecorrectie) en voeg een changelog/acceptatiestatus toe. Zorg dat roadmap en `AGENTS.md` overeenkomen.

## 4. Regressie- en compatibiliteitsmatrix

| Domein | Verplichte scenario's | Bestaand bewijs / tekort |
|---|---|---|
| Wiskundige invarianten | Algemeen parallellogram, gespiegeld, gedraaid; vaste `sideLength`; `matchAB` exact als `|AB|`; ±90°; vierkant blijft vierkant bij bronverplaatsing | M8b-1 en M8b-2c Node-fixtures; opnieuw draaien |
| Ongeldige geometrie | A=B, nul/180°, niet-eindig, buiten coördinatenlimieten; geen stale vertices/labels; herstel met identieke bron-/objectreferenties | Bestaande Node-fixtures; afhankelijkheden mee controleren |
| Afhankelijke polygonconstructies | Middenpunt AB/BC/CD/DA, punt op rand, parallel/loodrecht/middelloodlijn, regio en gemeten waarden; behoud van polygonrandindex | M8b-2b tests, M8b-2c afhankelijke randpuntfixture; vul alleen hiaten |
| Naamgeving en weergave | A/B hernoemen, C/D afgeleid; bijbehorende maatlabels en inspector; hoekboog of rechtehoekmarkering alleen indien ingeschakeld; alle labels standaard verborgen | Node + Edge M8b-2b; geen dubbele labelwaarheid |
| Constructie-interactie | Q als eenmalige plaatsing, numerieke invoer heeft voorrang; 90°- en gelijke-zijdensnap onafhankelijk, gecombineerd en met hysterese; toggle tijdens stap 3 consistent | Edge M8b-2b/2c; laatste lengteveldcorrectie |
| Historie/lifecycle | Aanmaak en moduswissel elk één Undo/Redo-stap; annulering, toolwissel, fullscreen en preview-opruimen; SemanticSequence | Gerichte bestaande tests; documenteer ontbrekende combinaties |
| Persistente documenten | Legacy schema 8 (vaste lengte), schema 9 (matchAB), gemengd met schema 6/7-ellipsen, regio's, individuele metingen; JSON opslaan/herladen; atomair afwijzen van onbekende of foutief gelabelde schema's | M8b-1/2/2c Node-fixtures; minstens één echte gemengde eind-tot-eind roundtrip |
| Export/rechten | Restricted JSON, SVG en PNG; verborgen/ongeautoriseerde bronnen, afgeleide labels en eigenschappen; geen informatielek; locked en read-only bediening | Bestaande beperkte exporttests; gerichte aandacht voor schema 9 |
| Regresie andere functies | Gewone polygonen, driehoeken, ellipsen, hoekmetingen, regio's, radiaalmenu, selectie en lagen | Volledige Node + Edge-suite, geen assertions versoepelen |

Prioriteer op **feitelijke dekking**. Voeg geen zinloze duplicaatfixtures toe; maak waar nodig één expliciete gemengde documentfixture voor schema 9 + ellips + regio + GEO-UI-metingen + afhankelijke randconstructie.

## 5. Werkwijze voor Codex

1. Controleer `git status`, de actuele HEAD van `main`, en de nieuwe featurebranch. Gebruik geen impliciete lokale wijzigingen. Lees `AGENTS.md`, dit document, M8b-contract v1.3.0 en de verslagen van M8b-1/2/2b/2c.
2. **Baseline:** run eenmaal `npm test` en `npm run test:edge` op deze exacte codebasis. Vermeld platform, Node-versie, Edge-versie, commando's, aantallen, duur en elke testfout. Controleer of de browser werkelijk Microsoft Edge is, niet een stille fallback.
3. Voer een gerichte analyse van de matrix uit. Hergebruik bestaande tests; voeg uitsluitend ontbrekende, materieel relevante tests toe.
4. Corrigeer DOC-1. Als een echte productbug opduikt: leg reproductie vast, maak een minimale fix, draai eerst gerichte test(s). Maak geen ongevraagde nieuwe features.
5. Voer vóór oplevering **opnieuw** `npm test` en `npm run test:edge` uit. Bij codewijzigingen ook relevante export-/rechten-/replayfixtures. Behoud alle bestaande assertions en garanties.
6. Werk roadmap (nieuwe documentversie) en `AGENTS.md` uitsluitend waar feitelijke M8b-3-status verandert. Registreer wat uitgevoerd en geverifieerd is, niet wat gepland was.

Efficiëntie: vermijd een volledige regressiesuite na elke kleine documentcorrectie; de dubbele full-suite (baseline en eindpoort) is voldoende tenzij een concrete bug een extra run vereist.

## 6. Opleveringsrapport en bewijs

Maak `docs/archive/doc-e-batch-2/M8b-3-CONSOLIDATION-REPORT.md` met **documentversie 1.0.0**:

- Baseline `main`-SHA, werkbranch en commitlijst.
- Auditmatrix: elk domein PASS / FAIL / PARTIAL / NOT RUN, met concrete testrefs.
- Werkelijke baseline- en eindtestcommando's, aantallen, browser/Node-versies, duur en geobserveerde fouten.
- Nieuwe of aangepaste tests inclusief waarom bestaand bewijs niet volstond.
- Exacte afwijkingen en minimale fixes, of expliciet **geen productiecode gewijzigd**.
- Compatibiliteitsmatrix legacy v1–v10 / `constructionSchema:8/9`, gemengde documenten en fail-closed tests.
- Restricted/exportbeoordeling, restpunten en expliciete GO/NO-GO.
- Handmatige laatste acceptatie: ruit/vierkant dynamisch; bronhernoeming; middelpunt op zijde; schema-9 rondgang.

## 7. Stop- en mergebeleid

Push de volledige M8b-3-uitkomst naar `codex/m8b-3-final-consolidation`.

**Niet mergen naar `main`, niet herbasen op latere onaangekondigde wijzigingen, en geen PR automatisch mergen.** Stop na het rapport en testbewijzen voor code-review en expliciete gebruikers-GO. Het eerdere akkoord voor M8b-2/2b/2c geldt niet automatisch als acceptatie van M8b-3.

**Buiten scope:** nieuw generiek constraint-systeem, extra snaphaken, derde permanente Q-bron, vrije hoekpuntgrepen, vectortransformaties, nieuwe kegelsneden, brede refactoring of nieuw schema.

---

**Status bij aanmaak:** statische preflight uitgevoerd; uit te voeren door Codex zijn de daadwerkelijke baseline-tests, eventuele gerichte nieuwe tests, de DOC-1-correctie, de finale volledige suites en het consolidatierapport.
