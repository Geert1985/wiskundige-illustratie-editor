# T5a — technische opvolging na onafhankelijke statische audit

Versie 1.0.0 — 2026-10-12.
Branch: `chatgpt/text-editor-full-workspace`.
Basis voor deze opvolging: `d30f6d5` (gecombineerde T5a- en tekstwerkruimteversie).
Status: T5a inhoudelijk aanvaard door gebruiker; twee technische opvolgpunten geïmplementeerd, uitvoering van tests nog open. Geen merge naar main en geen T5b-start.

## 1. Parsernesting

Broncode: `expression-ast.js`, parseTokens, primary, unary en nested.

De oorspronkelijke nested-guard om unary omvat ook de aanroep power → primary → sum → product → unary voor haakjes en functieargumenten. Geneste haakjes om een getal leverden dus al een gecontroleerde QUOTA_EXCEEDED op bij overschrijding van de recursiequota, ondanks hun later ondiepe AST. De audit signaleerde terecht dat hiervoor geen afzonderlijke expliciete syntaxcontrole stond; het was geen vastgesteld onbegrensd recursiepad.

Er staat nu een iteratieve controle over de gevalideerde tokens vóór recursive descent: opening van haakjes telt omhoog; nesting boven limits.depth (32) levert QUOTA_EXCEEDED. Een sluitend haakje zonder opening of niet-afgesloten haakjes leveren INVALID_SYNTAX. Functieaanroepen tellen hetzelfde mee. Stringinvoer, typed tokens en canonical parsePrinted gebruiken ditzelfde pad. Bestaande character-, token-, AST-, recursie- en evaluatielimieten blijven behouden. Hun combinatie mag al onder de syntaxgrens een expressie weigeren: bijvoorbeeld de basis-unary-call telt ook mee in de recursiegrens. De syntactische grens is geen garantie dat iedere syntactisch minder diepe expressie alle overige quota passeert.

De bestaande quota-test is aangevuld met 30 geneste haakjes om een getal, 33 haakjes, 33 functieaanroepen en equivalent typed-tokeninvoer. Geen nieuwe testbestanden of nieuwe suites. Deze assertions zijn niet uitgevoerd; geen nieuwe PASS-claim.

## 2. Browsertests voor de huidige werkruimte

De bestaande annuleringstests gebruiken nu de volledige Annuleren-knop #textDialogClose in plaats van de verwijderde footerknop #textCancel. Dit betreft browser-inputs, post-m5a-ux, rich-layout, rich-math, rich-text, rich-values, split-tools, text-editor-modernization en text-editor-ux. Hun bestaande snapshot-, history-, annulerings-, fullscreen-, legacy-, restricted- en exportcontroles blijven aanwezig.

Browser-text-editor-modernization is aangepast aan de huidige UI:

- Branding via de gedeelde .brand-logo/.eyebrow onder de tekstheader.
- Bestaand-objectsubmit: het opslagpictogram en Wijzigingen opslaan.
- JSON-placeholders onder Meer, nog disabled; menu openen en Escape behouden de controle op bereikbaarheid en betekenis.
- Headergrootte/typografie vergelijken met de hoofdbediening. De oude eis dat ook verborgen JSON-menuopties dezelfde rechthoek hebben als iedere headerknop is vervangen door de nieuwe door de gebruiker verlangde hoofdapplicatiestijl.
- Preview en formule-invoegknop binnen #textFeedbackPanel; formuleactie-rij vervangt de verdwenen footer in de zichtbaarheidscontrole.
- Viewportvullende oorsprong/breedte/hoogte; brede linkerkolom ongeveer 25% in plaats van de oude 36%; de smalle verticale indeling begint bij 540px.
- De controle dat de footer verwijderd is, plus de bestaande canvas-, catalogus-, cursor-, template-, validatie-, undo/redo-, bron-tab-, breedtecompatibiliteits- en documentannuleringstests blijven aanwezig.

Geen functionele assertions op de rekenmotor of numerieke referentiefixtures zijn verwijderd. De afzonderlijke T5a-browsermodule blijft in de volledige Edge-suite opgenomen. De numerieke fixtures blijven ongewijzigd en blijven verplicht voor iedere toekomstige runtimecontrole.

## 3. Uitvoering en resterende mergegate

**Geen tests uitgevoerd**, conform de bestaande gebruikersinstructie. Geen Node-/Edge-run, browserbediening, screenshots, syntaxverificatie of productiebuild nodig voor deze wijzigingen. Uitsluitend statische codelezing en aanpassing. De eerdere 573 Node-tests en Edge-resultaten gelden voor de toenmalige T5a-versie, niet als resultaat van de gecombineerde branch na deze opvolging.

Voor merge naar main moet de gebruiker de huidige volledige Node- en Edge-suite uitvoeren, met bijzonder aandacht voor parserquota, numerieke referenties, rich-text/math/waarden, de aangepaste layouttests, fullscreen, restricted bronrechten, annuleren en offline SVG/PNG-export. Eventuele nieuwe fouten blijven te herstellen; de selectors zijn bijgewerkt maar hun uitvoering is niet bewezen. T5b behoudt zijn afzonderlijke expliciete startpoort.

De commit van deze opvolging wordt na commit/push in het opleverbericht vermeld.
