# M8-INT.0 — Implementatieverslag

Datum: 2026-10-17  
Branch: `codex/m8-int-0-universal-intersection`  
Contract: `docs/M8-INT-SNIJPUNTEN-ONTWERPCONTRACT.md` v1.0.0 op actuele `origin/main`

## Oplevering

- Eén vindbare tool `Snijpunt` toegevoegd aan `Constructies > Puntconstructies`; de drie bestaande gespecialiseerde ingangen blijven zichtbaar tot handmatige eindacceptatie.
- Bronparen worden op bestaande getypeerde receptrollen gedispatched. Cirkel–lijn wordt veilig genormaliseerd naar het bestaande lijn–cirkelrecept; cirkelvolgorde en branchidentiteiten blijven behouden.
- Ondersteund in M8-INT.0: lijn/halfrechte/lijnstuk/vector/dimension/polygonrand tegen dezelfde lineaire bronnen, lijn/cirkel, cirkel/cirkel, en assen uitsluitend in bestaande toegestane receptrollen.
- Bij overlappende bronkeuzes vraagt de editor expliciet welke bron bedoeld is. Niet-ondersteunde paren en paren zonder geldige eindige oplossing blijven onderscheiden.
- Geldige oplossingen verschijnen als tijdelijke preview. De gebruiker kan afzonderlijke takken met toetsenbord of muis aan- en uitzetten. Bevestiging maakt één of meer bestaande afhankelijke point-recepten in één history-transactie; lege selectie en annulering veranderen het document niet.
- Commit herberekent en controleert de kandidaten en gebruikt bestaande tool-, bron-, zichtbaarheids- en axisrechten. De persistente `construction.kind`, bronnen en `branch` blijven ongewijzigd; geen documentschemawijziging.
- Previewmarkeringen blijven buiten model, hit-/snapindex en SVG/PNG-export. De generieke UI-tool wordt niet als persistente constructiesoort in het contextmenu aangeboden.

## Verificatie

Preflight op actuele `origin/main` (`bf5d4b6744b58abe9662a1845da08f56263ec377`): Node 706/706 geslaagd; volledige Edge-suite geslaagd met `pageErrors: []`.

Op deze featurebranch:

- Gerichte dispatcher-, opdracht-, legacyrecept- en architectuurtests: 23/23 geslaagd.
- `npm test`: **712/712 geslaagd**, 0 mislukt, 0 overgeslagen.
- Gerichte Edge-test voor universeel snijpunt: geslaagd; previewtoggle per toetsenbord, annuleren zonder mutatie, branch 1 selectief committen, undo en export zonder preview; `pageErrors: []`.
- Gerichte Edge-tests voor de sidebar-catalogus en volledige toolcatalogus: geslaagd; 42 tools, fullscreencatalogus en toetsenbordnavigatie.
- `npm run test:edge`: **geslaagd**, alle browsermodules gerapporteerd, `pageErrors: []`.
- De Edge-suite schrijft bestaande documentatiescreenshots opnieuw; alle gegenereerde wijzigingen in `docs/images` zijn na de run teruggezet.

## Acceptatiegrens

De geautomatiseerde .0-regressies zijn groen. Handmatige gebruikersacceptatie is niet in deze automatiseringsrun uitgevoerd. Conform het contract blijven de drie oude gespecialiseerde ingangen daarom staan. M8-INT.1/.2/.3 en het verbergen van legacy-ingangen zijn niet onderdeel van deze branch.

## Commits

- `777ae70` — preflight en contractmatch.
- `9865332` — getypeerde dispatcher, laadregistratie en dispatchtests.
- Volgende gefaseerde commits — implementatie-interactie/transactie en regressies/dit verslag.
