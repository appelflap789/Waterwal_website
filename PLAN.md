# Waterwal — makeover-plan (bouwopdracht)

> Dit document is de bouwopdracht voor de volgende sessie. Lees ook
> `ui-design-guidance.md` (ontwerpregels), `Zakken info.txt` (productinfo) en
> `AI_NOTES.md` (hoe de huidige site in elkaar zit — wordt grotendeels vervangen).
> Opgesteld 2026-11-16. Beslissingen hieronder zijn met de eigenaar afgestemd;
> niet "terugdraaien" zonder te vragen.

---

## 1. Doel in één zin

Een Nederlandstalige landingspagina waar een bezoeker zijn adres invult, ziet hoe
diep het water bij hem kan komen per overstromingsscenario, een zakkenadvies met
prijs krijgt, en zijn e-mail achterlaat op de wachtlijst.

## 2. Vastgestelde beslissingen

| Onderwerp | Beslissing |
|---|---|
| Taal | **Alleen Nederlands.** `lang="nl"`, geen taalschakelaar. Engelse teksten en de taalfunctie uit de laatste commit verwijderen. |
| Doel | **Alleen een wachtlijst.** Geen checkout of betaling. `buy.html` verdwijnt (zie §9). |
| Producten | Twee zakken, allebei SAP-gevuld, niet-geweven stof, zwellen in 3–4 min op met zoet water, eenmalig gebruik, vacuümverpakt. **Zwart (321335W) heeft handvatten**, **wit (321334W) niet**. Foto's: `inside_3000x0.webp` (zwart), `inside_3000x0 2.webp` (wit). |
| Prijs | **€10 per zak, losse zakken.** Het advies rekent in losse zakken (geen sets van 20). Beide kleuren €10. |
| E-mailopslag | **Formulierdienst**: Brevo (EU, gratis tier, double opt-in). MailerLite mag als alternatief. Geen eigen backend. |
| Ontwerptool | **Tweakpane** in de site, verborgen achter `?tune`. Geen build-stap. Zie §6. |
| Data-proxy | **Cloudflare Worker** (de eigenaar heeft een Cloudflare-account plus API-token). Zie §4 en §10. |
| Hosting | Blijft **GitHub Pages** met `CNAME` → `waterwal.eu`. |
| Stack | Plain HTML/CSS/JS, geen framework, geen npm voor de site zelf. Externe libs via een CDN met een vast versienummer. |
| Toon | Rustig, geruststellend, eerlijk. Niet alarmerend: geen sirenes, geen countdowns. Angst één keer benoemen, de rest is het antwoord. |

## 3. Paginastructuur (één pagina: `index.html`)

1. **Hero + adresveld** (dé CTA). Kop met de belofte, één invoerveld
   "Postcode + huisnummer of adres" met autocomplete en een knop "Check mijn adres".
   Secundaire knop: "Zet me op de wachtlijst" (scrollt naar §8).
   Visueel: een doorsnede van een huis/voordeur met een **waterlijn** (zie §6, concept).
2. **Resultaat** (verborgen tot er een adres is gekozen):
   - Adres en kaart (Leaflet) met de overstromingslaag van het gekozen scenario.
   - **Scenariokiezer**: aanklikbare chips per kansklasse (§4.3). Elke chip toont
     de kans ("1× per 100 jaar") en de waterdiepte op dit adres. Actieve chip is
     gevuld; scenario's zonder water staan grijs met "droog".
   - Grote waarde: "Tot **43 cm** water" voor het actieve scenario. De waterlijn in
     de illustratie beweegt mee.
   - Het type gebied uit PDOK (bv. "beschermd door primaire dijk" / "buitendijks").
   - Bronvermelding en disclaimer (§4.5).
3. **Zakkenadvies**: kleine configurator.
   - Openingen: standaard 1 voordeur (90 cm). Toe te voegen: achterdeur, garagedeur
     (240 cm), kelderraam, terrasdeur, of een eigen breedte.
   - Uitkomst: aantal zakken, aantal lagen, totaalprijs (€10 per zak), keuze
     zwart (handvatten) of wit. Uitleg in één regel hoe het gestapeld wordt.
   - Bij water > max. stapelhoogte (§5): eerlijke melding, geen zakken pushen.
4. **Waarom Waterwal**: de USP opslagruimte ("plat in een kast in plaats van een
   pallet zand"). Bestaand idee uit de huidige site, nieuw vormgegeven.
5. **Zo werkt het**: 3 stappen (plat bewaren → nat maken → 3–4 min later een dam).
6. **De twee zakken**: productkaarten met foto, zwart vs wit (handvatten).
7. **FAQ**: o.a. "Werkt het met zout water?" (nee, alleen zoet; staat in de specs),
   "Herbruikbaar?" (nee, eenmalig), "Hoe lang houdbaar?" (placeholder),
   "Hoe betrouwbaar is de kaart?".
8. **Wachtlijst**: e-mail (verplicht), toestemmingscheckbox. Als er een advies is,
   gaan postcode (alleen cijfers + letters, géén huisnummer), aantal zakken en
   kleur mee als attributen. Succes-state met micro-interactie.
9. **Footer**: privacyverklaring (eigen `privacy.html`), bronvermelding van de data, contact.

Mobiel eerst: alles werkt op 360 px breed zonder horizontale scroll.

## 4. Overstromingsdata — wat er is en hoe het werkt

Alles hieronder is op 2026-11-16 **live getest**.

### 4.1 Adres → coördinaat: PDOK Locatieserver (gratis, geen key, CORS ok)

```
Suggest:  https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=<tekst>&fq=type:adres&rows=6
Lookup:   https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?id=<id>&fl=weergavenaam,centroide_ll,postcode
Free:     https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=<tekst>&fq=type:adres&rows=1
```
`centroide_ll` is `POINT(lon lat)` in WGS84. Deze calls mogen rechtstreeks vanuit
de browser (getest: `Access-Control-Allow-Origin: *`). Debounce de suggest-calls op
~200 ms.

### 4.2 Coördinaat → waterdiepte: LIWO GeoServer (Rijkswaterstaat)

Dezelfde bron die achter overstroomik.nl zit. Rasterlagen met de **maximale
waterdiepte in meters** per scenario:

```
WMS: https://basisinformatie-overstromingen.nl/liwo/geoserver/wms
Lagen: LIWO_Basis:MaximaleWaterdiepteNederland_Kaart1 … _Kaart5
```

Punt-query (GetFeatureInfo, geeft JSON terug):
```
?service=WMS&version=1.1.1&request=GetFeatureInfo
&layers=<laag>&query_layers=<laag>&srs=EPSG:4326
&bbox=<lon-d>,<lat-d>,<lon+d>,<lat+d>&width=3&height=3&x=1&y=1
&info_format=application/json            (d = 0.0005)
```
Antwoord: `features[0].properties.GRAY_INDEX`. `-9999` = droog of geen data,
anders de diepte in meters.
Testpunt `lon 4.53, lat 51.92` (Rotterdam-oost) gaf Kaart1–3 = droog en
Kaart4–5 = 0,43 m. Amsterdam Damrak en Utrecht-centrum gaven overal droog.

**Geen CORS-header** → de browser mag deze waarde niet uitlezen. Daarom de Worker (§4.4).
De kaart *tonen* kan wel direct: WMS-tiles als `<img>` hebben geen CORS nodig.

> ⚠️ **Eerst verifiëren (taak 1 van fase 1):**
> - **Welke kansklasse hoort bij Kaart1–5.** Vermoedelijke indeling volgens de
>   ROR/LIWO-handboeken: Kaart1 ≈ grote kans (~1/10 per jaar), Kaart2 ≈ middelgrote
>   kans (~1/100), Kaart3 ≈ kleine kans (~1/1.000), Kaart4 ≈ zeer kleine kans /
>   buitengewone gebeurtenis (~1/10.000), Kaart5 ≈ extreem kleine kans
>   (~1/100.000). **Niet bevestigd.** Controleer in de LIWO-viewer
>   (basisinformatie-overstromingen.nl, thema "Maximale waterdiepte") of mail
>   liwo@rws.nl. Leg de mapping vast in één `SCENARIOS`-config.
> - **Zijn de waarden echte meters of legendaklassen?** In de LIWO-viewer zijn
>   klik-labels legendaklassen. Onze ruwe waarde (0,43287) lijkt continu, dus meters.
>   Vergelijk 3–4 punten met overstroomik.nl.
> - **Licentie/bronvermelding** van de LIWO-data opzoeken en in de footer zetten.

Andere lagen in dezelfde GeoServer, nuttig als uitbreiding:
`MaximaleWaterdiepte_A_PrimairOnbeschermd_Kaart*` en `_B_PrimairBeschermd_Kaart*`.
Haal de volledige lijst op met `request=GetCapabilities`.

### 4.3 Type gebied: PDOK OGC API (CC0, CORS ok)

```
https://api.pdok.nl/rws/overstromingen-risicogebied/ogc/v1/collections/risk_zone/items?f=json&bbox=<lon-d>,<lat-d>,<lon+d>,<lat+d>
```
`properties.description` geeft bijvoorbeeld "Rijn type B - beschermd langs
hoofdwatersysteem" of "Maas type D - onbeschermd langs regionaal water". Vertaal de
typen naar korte, begrijpelijke labels:
- A = primair, onbeschermd/buitendijks
- B = beschermd door primaire keringen
- C = beschermd door regionale keringen
- D = onbeschermd langs regionaal water

Geen resultaat = buiten de ROR-risicogebieden.

### 4.4 Cloudflare Worker `waterwal-risk`

Map `worker/` in deze repo (`worker/src/index.js` + `worker/wrangler.toml`).

```
GET /risk?lat=51.92&lon=4.53
→ 200 {
  "scenarios": [
    {"id":"k1","depth_m":null}, {"id":"k2","depth_m":null}, {"id":"k3","depth_m":null},
    {"id":"k4","depth_m":0.43}, {"id":"k5","depth_m":0.43}
  ],
  "zone": {"code":"B","description":"Rijn type B - beschermd langs hoofdwatersysteem"} | null,
  "source": "LIWO / Rijkswaterstaat, PDOK"
}
```
- De 5 LIWO-calls en de PDOK-call **parallel** uitvoeren (`Promise.all`). `-9999` → `null`.
- Valideer dat lat/lon binnen NL liggen (bbox 50.7–53.7 / 3.2–7.3), anders 400.
- `Access-Control-Allow-Origin`: alleen `https://waterwal.eu` en `http://localhost:*`.
- Cache per afgeronde coördinaat (4 decimalen) via de Cache API, 7 dagen.
- Labels en kansen staan **niet** in de Worker, maar in de front-end (`SCENARIOS`).
  Dan kun je teksten aanpassen zonder opnieuw te deployen.
- Timeout per upstream-call ~8 s. Bij een fout: 502 met `{"error":"bron niet bereikbaar"}`.
  De front-end toont dan een vriendelijke melding plus een link naar overstroomik.nl.
- Deploy met `npx wrangler deploy`. Route: `api.waterwal.eu/risk` als het domein in
  Cloudflare staat, anders `waterwal-risk.<subdomein>.workers.dev`.

### 4.5 Disclaimer (verplicht in de UI, kort)

"Indicatie op basis van landelijke overstromingsscenario's van Rijkswaterstaat
(LIWO). Geen garantie. Bij dreiging: volg NL-Alert en de gemeente." Plus een link
naar overstroomik.nl.

### 4.6 Kaart

Leaflet 1.9.4 (cdnjs). Achtergrond: PDOK BRT-Achtergrondkaart grijs (WMTS, gratis).
Overlay: LIWO WMS-laag van het actieve scenario, 60% dekking. Een marker op het adres.
Op mobiel is de kaart niet-interactief (geen scroll-trap) totdat je erop tikt.

## 5. Zakkenadvies — rekenregel

Alle productmaten zijn **aannames (placeholder)**. Zet ze in één `BAG`-config
bovenaan `main.js`, met een commentaar dat ze nog gemeten moeten worden:

```js
const BAG = {
  lengthM: 0.60,        // effectieve lengte per zak, opgezwollen  (AANNAME)
  overlapM: 0.10,       // overlap tussen zakken in een laag        (AANNAME)
  layerHeightM: 0.12,   // hoogte per laag, opgezwollen             (AANNAME)
  maxStackM: 0.60,      // max. verantwoorde stapelhoogte           (AANNAME)
  freeboardM: 0.10,     // marge boven de verwachte waterstand
  reserve: 0.10,        // 10% extra
  priceEUR: 10,
};
```

Per opening met breedte `w` en waterdiepte `d` (actief scenario):
- `effectief = lengthM - overlapM` (0,50 m)
- `perLaag = ceil(w / effectief) + 1` (+1 voor aansluiting op de kozijnen)
- `lagen = clamp(ceil((d + freeboardM) / layerHeightM), 1, ceil(maxStackM / layerHeightM))`
- Lagen verspringen (metselverband): zakken per opening = `perLaag × lagen`
- Totaal = `ceil(som × (1 + reserve))`. Prijs = totaal × €10.

Speciale gevallen:
- **Alle scenario's droog** → "Volgens de landelijke kaart loopt je adres geen
  overstromingsrisico vanuit rivieren of zee. Wateroverlast door hevige regen kan
  wel." Advies: een basispakket van 1 laag per opening (minstens 6 zakken).
- **`d + freeboard > maxStackM`** → toon het maximale advies én de eerlijke melding:
  "Bij meer dan ~50 cm water houden zakken het niet tegen. Zorg voor een droge
  verdieping en volg de instructies van de gemeente." Geen upsell.
- Het actieve scenario is standaard het **meest waarschijnlijke scenario met
  water**. De gebruiker kan het wisselen met de chips; het advies rekent live mee.

Laat de uitkomst zien met een kleine visualisatie: de zakken als blokjes in lagen,
tegen een deuropening.

## 6. Design — aanpak en Tweakpane

**Concept "De waterlijn"** (voorstel, mag verfijnd worden): een dunne horizontale
lijn die door de hero loopt, door de illustratie van een voordeur. Zodra er een
resultaat is, stijgt de lijn naar de berekende diepte voor het gekozen scenario,
en daarna stapelen de zakken zich ervoor. Wisselen van scenario animeert de lijn.
Dat is het unieke, persoonlijke moment van de site: *jouw* deur, *jouw* waterstand.
Respecteer `prefers-reduced-motion`.

Volg `ui-design-guidance.md`:
- **Eén font**. Voorstel: Inter, of een sans met meer karakter zoals "Instrument
  Sans" of "Geist". Grote koppen met letter-spacing −2 tot −3% en line-height 1.1–1.2.
- Max. 6 lettergroottes.
- **Eén primaire merkkleur** (diep water-blauw/teal) met een ramp. Semantische
  kleuren voor de scenario-chips en diepte: neutraal/groen = droog, geel = beperkt,
  rood = diep. Gebruik ze spaarzaam.
- 4-pt spacingsysteem. Zachte schaduwen: als je de schaduw als eerste ziet, is hij te sterk.
- Alle states: hover, active, focus, disabled, loading (adres opzoeken),
  error (adres niet gevonden, bron down), success (op wachtlijst).
- Tekst op foto's alleen met een gradient of progressieve blur.
- Light mode is de basis. Dark mode is optioneel; bouw tokens zo dat het later kan.

**Tweakpane-werkwijze:**
- Laad `tweakpane@4.0.5` (ESM via cdn.jsdelivr.net) **alleen** als de URL `?tune` bevat.
  Normale bezoekers laden het niet.
- Het paneel stuurt CSS custom properties op `:root` live aan:
  - kleuren: primary-hue/-sat/-light (de ramp wordt afgeleid), achtergrond, accent
  - typografie: font-familie (keuzelijst), basisgrootte, schaal-ratio, kop-tracking
  - vorm: radius, schaduwsterkte, spacing-eenheid
  - waterlijn: kleur, golfamplitude, golfsnelheid, animatieduur
  - een "simuleer resultaat"-knop met een diepte-slider, om de animatie zonder adres te tunen
- Knop **"Exporteer tokens"** → kopieert een `:root { … }`-blok. Plak dat in `assets/css/tokens.css`.
- Presets: bouw 2–3 duidelijk verschillende richtingen als startpunt (bv. "Polder" =
  licht/kalk/teal, "Diep" = donker marine, "Signaal" = wit met één felle kleur). De
  eigenaar kiest en tweakt.

Figma, DialKit en Toolcraft worden bewust niet gebruikt: geen build-stap, en de
eigenaar tweakt live in de echte pagina.

## 7. Wachtlijst (Brevo)

- De eigenaar maakt in Brevo een lijst "Wachtlijst Waterwal" en een formulier met
  double opt-in. Attributen: `POSTCODE` (tekst), `ADVIES_ZAKKEN` (getal),
  `KLEUR` (zwart/wit), `SCENARIO` (tekst).
- Gebruik **niet** het standaard Brevo-embedscript (lelijk, zware CSS). Doe een
  eigen `fetch` POST naar de form-action-URL van het Brevo-formulier, of een kleine
  route in dezelfde Worker die de Brevo API aanroept (key als Worker-secret). Die
  tweede optie heeft de voorkeur: nette foutafhandeling en geen key in de browser.
- AVG: een expliciete checkbox ("Ja, mail me als Waterwal te koop is"), een link
  naar `privacy.html`, en alleen de postcode (geen huisnummer) opslaan.
- Tot de Brevo-gegevens er zijn: een stub die bij submit een succes-state toont en
  `console.info` logt. Duidelijk markeren als TODO.

## 8. Bestanden na de makeover

```
index.html               de landingspagina (alles uit §3)
privacy.html             korte privacyverklaring (placeholder-tekst, NL)
assets/css/tokens.css    design tokens (output van Tweakpane-export)
assets/css/styles.css    componenten en layout, leest alleen tokens
assets/js/main.js        UI, adres-autocomplete, resultaat, advies, wachtlijst
assets/js/config.js      SCENARIOS, BAG, WORKER_URL, BREVO-instellingen
assets/js/tune.js        Tweakpane-paneel (dynamisch geladen bij ?tune)
assets/img/              geoptimaliseerde productfoto's (webp, ~1200 px breed)
worker/src/index.js      Cloudflare Worker (/risk, later /subscribe)
worker/wrangler.toml
README.md, AI_NOTES.md   bijwerken naar de nieuwe situatie
```
Verplaats de foto's uit de root naar `assets/img/` met namen als `zak-zwart.webp`
en `zak-wit.webp`. `Zakken info.txt` en `ui-design-guidance.md` mogen blijven
staan als bronmateriaal.

## 9. Fasering met acceptatiecriteria

**Fase 0 — opruimen**
- Er staan niet-gecommitte wijzigingen in de 4 sitebestanden. Die zijn grotendeels
  regeleinde-ruis (~115 echte regels). Commit ze eerst als "wip before makeover"
  zodat er niets verloren gaat. Zet daarna `.gitattributes` met `* text=auto eol=lf`.
- Verwijder `buy.html` en de taalfunctie. ✅ Site laadt zonder JS-fouten.

**Fase 1 — data (zonder design)**
- Verifieer de Kaart1–5-mapping, meters vs. klassen en de licentie (§4.2).
- Bouw en deploy de Worker. ✅ `curl …/risk?lat=51.92&lon=4.53` geeft k4/k5 ≈ 0,43
  terug, en Damrak overal `null`.
- Bouw een kale pagina met adres-autocomplete → resultaat-JSON → chips → advies.
  ✅ Werkt voor 5 testadressen, waaronder een buitendijks adres, een polder en een hoog/droog adres.

**Fase 2 — design-systeem met Tweakpane**
- `tokens.css`, `tune.js`, 2–3 presets, de waterlijn-animatie met simulatieknop.
- ✅ De eigenaar kiest een richting en exporteert de tokens.

**Fase 3 — volledige pagina**
- Alle secties uit §3 in het gekozen design, alle states uit §6, kaart (§4.6).
- ✅ Visueel gecontroleerd met headless Edge op 1440 px en 390 px (390 px via een
  `<iframe width="390">`, zie AI_NOTES "Verification method"). Geen horizontale
  overflow. Lighthouse toegankelijkheid ≥ 95.

**Fase 4 — wachtlijst en livegang**
- Brevo koppelen (§7), `privacy.html`, README/AI_NOTES bijwerken, Worker-CORS op het echte domein.
- ✅ Een testinschrijving komt in Brevo binnen met attributen. De double-opt-in-mail komt aan.

## 10. Beveiliging en geheimen — belangrijk

- **De GitHub-repo is publiek** (`appelflap789/Waterwal_website`). De Cloudflare
  API-token en het account-ID komen **nooit** in een bestand in deze repo, dus ook
  niet in `wrangler.toml`, dit plan of de README.
- Wrangler leest de token uit de omgeving: `export CLOUDFLARE_API_TOKEN=…` in de
  shell, of `npx wrangler login`. Het account-ID mag via `CLOUDFLARE_ACCOUNT_ID` in
  de omgeving.
- Een Brevo API-key alleen als Worker-secret: `npx wrangler secret put BREVO_API_KEY`.
- Zet `worker/.dev.vars` en `.wrangler/` in `.gitignore`.

## 11. Open punten en placeholders (voor de eigenaar)

- Echte zakmaten (droog en opgezwollen), gewicht en houdbaarheid → `BAG` in `config.js`.
- Bevestiging van de Kaart1–5 → kansklasse-mapping (§4.2).
- Brevo-account en formulier (§7).
- Privacyverklaring: tekst nakijken. Is er een KvK-nummer of contactadres voor de footer?
- Testimonials: weglaten tot er echte zijn. Geen nep-quotes.
