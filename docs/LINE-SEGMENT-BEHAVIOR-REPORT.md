# Lijnstukgedrag: rapport

Branch: `chatgpt/editor-development`

## Uitkomst

Een actie in **Basisobjecten → Lijnstuk** maakt nu één vrij `line`-object. Het object heeft twee bewerkbare eindpunten, kan als geheel worden versleept en veroorzaakt geen losse documentpunten. De halfrechte blijft het bestaande aparte gedrag houden: een `ray` met een gekoppeld beginpunt.

De gekoppelde variant staat nu rechtstreeks in **Constructies → Lijnstuk door twee punten**. De gebruiker kiest daar twee verschillende bestaande puntobjecten; de resulterende lijn verwijst naar beide punten, is afgeleid en volgt die punten. De gereedschapsinstructies noemen de eerste en tweede puntselectie afzonderlijk. Dubbel kiezen van hetzelfde punt of twee samenvallende punten wordt geweigerd, waarna de tweede keuze opnieuw kan.

## Technische wijziging

- `permission-runtime.js`: `linear.draw` voor `line` maakt één vrij lijnobject. De bestaande rayconstructie en de vereiste permissies voor het ray-beginpunt blijven behouden.
- `editor.js`: lijnstukconstructie filtert bronnen tot gewone puntobjecten, voorkomt degeneraat/dubbel bronpaar en geeft overlappende punten bij canvasselectie voorrang zodat een punt op een lijnstuk als bron kan worden gekozen.
- `index.js`: gelijke hit-testafstanden geven stabiel voorrang aan punten, onafhankelijk van documentvolgorde.
- `editor.html`: `Lijnstuk door twee punten` is een direct zichtbare knop in Constructies. De eerdere splitgroep met “Cirkel via punten” is verwijderd; beide gereedschappen staan als eigen keuzes.
- `editor-tool-instructions.js`, `LINEAR-OBJECTS.md` en regressietests zijn bijgewerkt.

## Compatibiliteit

Bestaande objecten en constructierecepten `lineBetweenPoints` blijven ongewijzigd. Oude illustraties met gewone `line`-objecten blijven vrije lijnstukken. Nieuwe basislijnstukken worden opgeslagen als één standaard lijnobject; rayobjecten blijven gekoppeld aan hun oorsprongspunt. Er is geen documentformaatwijziging nodig.

## Verificatie

- `npm.cmd test` — **375 tests geslaagd, 0 mislukt**.
- `npm.cmd run test:edge` — **geslaagd** in Microsoft Edge; de volledige bestaande browserregressieset eindigde met `pageErrors: []`. De gerichte browsercontroles voor lijnstuk tekenen, linked source drag, directe constructiekeuze, fullscreen en ray/vector/straight zijn geslaagd.
- `git diff --check` — geslaagd; alleen Git-waarschuwingen over LF/CRLF-normalisatie.

De browsertests dekken het vrije lijnstuk (één object, endpoint-bewerking, slepen als geheel, opslaan/herladen), de zichtbare constructieknop, gekoppelde bronpunten, niet-verplaatsbaarheid van de afgeleide lijn, volgen na verplaatsen van een bronpunt, afwijzing van dubbele punten en het ongewijzigde ray/vector/straight-pad.

## Beperkingen

De constructie is alleen beschikbaar via twee reeds bestaande puntobjecten. Vrije basislijnstukken maken geen puntobjecten aan; wie daarna een lijnstuk nodig heeft dat aan benoemde punten gekoppeld blijft, gebruikt **Lijnstuk door twee punten**. De halfrechte blijft haar eigen gekoppelde oorsprong behandelen.
