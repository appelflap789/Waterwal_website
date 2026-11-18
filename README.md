# Waterwal — website

Nederlandstalige landingspagina voor Waterwal-zakken (waterabsorberende zakken zonder zand).
Een bezoeker vult een adres in, ziet per overstromingsscenario hoe diep het water kan komen,
krijgt een zakkenadvies en kan zich op de wachtlijst zetten. Er wordt niets verkocht.

Geen build-stap: open `index.html` in een browser. De site staat op GitHub Pages (`CNAME` → waterwal.eu).

```
index.html               de pagina
privacy.html             privacyverklaring (bevat nog [invulvelden])
assets/css/tokens.css    ontwerpkeuzes: kleur, lettertype, afronding, golf
assets/css/styles.css    opmaak van alle onderdelen
assets/js/config.js      instellingen: zakmaten, prijs, scenario's, Worker-adres
assets/js/main.js        gedrag: adres zoeken, resultaat, advies, kaart, wachtlijst
assets/js/tune.js        ontwerppaneel, alleen geladen met ?tune
assets/img/              productfoto's
worker/                  Cloudflare Worker (tussenstation naar de overstromingsdata + wachtlijst)
PLAN.md                  het oorspronkelijke bouwplan
```

## Het ontwerp aanpassen

Open de site met `?tune` achter het adres (bijvoorbeeld `index.html?tune`). Rechts verschijnt een
paneel. Kies een richting (Polder, Diep, Signaal) en draai aan kleur, lettertype, afronding en de
waterlijn. Tevreden? Klik **Exporteer tokens** en plak het blok in `assets/css/tokens.css`, over het
stuk tussen `TUNE:START` en `TUNE:END`. Kies je een ander lettertype, pas dan ook de Google
Fonts-regel in de `<head>` van `index.html` en `privacy.html` aan (de export zegt welke).

Handig: `?tune=diep` of `?tune=signaal` opent meteen die richting. `?adres=Kerkstraat 2 Tiel` vult
een adres in en start de check.

## Waar de data vandaan komt

| Wat | Bron |
|---|---|
| Adres zoeken | PDOK Locatieserver (gratis, rechtstreeks vanuit de browser) |
| Waterdiepte per scenario | LIWO van Rijkswaterstaat, lagen "Maximale waterdiepte Nederland" kaart 1 t/m 5 |
| Type gebied (achter een dijk of niet) | PDOK, risicogebieden Richtlijn Overstromingsrisico's |
| Achtergrondkaart | PDOK BRT Achtergrondkaart |

Kaart 1 t/m 5 zijn de kansklassen grote, middelgrote, kleine, zeer kleine en extreem kleine kans.
Dat staat in het Deltares-rapport "Technische uitgangspunten en methode LIWO afgeleide kaarten"
(november 2025). Kaart 5 is dezelfde kaart als op overstroomik.nl.
De site toont kaart 1 t/m 4 als knoppen. Kaart 5 en de herhalingstijden staan er bewust niet op.
Het oordeel bovenaan (hoog, gemiddeld, laag, minimaal of geen overstromingsrisico) komt uit een
andere LIWO-kaart: de plaatsgebonden overstromingskans, de kans per jaar dat het op die plek nat wordt.

LIWO laat browsers niet rechtstreeks meelezen. Daarom vraagt de site de dieptes op via de Worker:
`https://waterwal-risk.waterwal.workers.dev/risk?lat=..&lon=..`

## De Worker

Staat in `worker/` en draait op Cloudflare (account van de eigenaar, naam `waterwal-risk`).
Opnieuw uitrollen na een wijziging:

```
cd worker
export CLOUDFLARE_API_TOKEN=...   # nooit in een bestand zetten: deze repo is openbaar
export CLOUDFLARE_ACCOUNT_ID=...
npx wrangler deploy
```

## Wat nog moet gebeuren voor livegang

1. **Wachtlijst aanzetten.** De Worker stuurt inschrijvingen door naar Brevo, maar heeft daarvoor
   gegevens nodig. Tot die er zijn krijgt een bezoeker de melding "De wachtlijst staat nog niet aan".
   Maak in Brevo een lijst met de attributen `POSTCODE` (tekst), `ADVIES_ZAKKEN` (getal),
   `KLEUR` (tekst) en `SCENARIO` (tekst). Zet daarna in de map `worker`:
   ```
   npx wrangler secret put BREVO_API_KEY
   npx wrangler secret put BREVO_LIST_ID
   npx wrangler secret put BREVO_DOI_TEMPLATE_ID   # optioneel: bevestigingsmail (double opt-in)
   ```
2. **Zakmaten meten.** Alle maten in `BAG` in `assets/js/config.js` zijn aannames (60 cm lang,
   12 cm per laag, stapel tot 60 cm). Het advies en de tekeningen rekenen ermee.
3. **Privacyverklaring invullen.** Bedrijfsnaam, KvK-nummer en contactadres in `privacy.html`.
4. **Licentie van de LIWO-data nagaan** en de bronvermelding in de footer zo nodig aanpassen.
5. **Publiceren.** Het werk staat op de branch `makeover`. Pas na samenvoegen met `main` en een
   push staat het op waterwal.eu.

## Aannames in de teksten

- "Ongeveer 300 kilo zand" voor 20 zandzakken gaat uit van 15 kilo per gevulde zandzak.
- "Past op een plank of onder het bed" is afgeleid van de foto van het vacuümpak, niet gemeten.
- Het advies bij zout water (vooraf laten opzwellen met kraanwater) is gangbaar voor dit soort
  zakken, maar staat niet in de specificaties van de leverancier. Nagaan.
- Er staan geen testimonials op de site. Voeg ze pas toe als ze echt zijn.
