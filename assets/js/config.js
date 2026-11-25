/* Waterwal — instellingen. Alles wat je zonder programmeren wilt aanpassen staat hier. */
window.WATERWAL = {
  // Cloudflare Worker (zie worker/). Wordt alleen nog gebruikt voor /subscribe (wachtlijst).
  WORKER_URL: 'https://waterwal-risk.waterwal.workers.dev',

  // ── De zak ──────────────────────────────────────────────────────────────
  // LET OP: de maten hieronder zijn AANNAMES. Meet een echte, opgezwollen zak
  // en vul de waarden in; het advies en de tekening rekenen automatisch mee.
  BAG: {
    lengthM: 0.60,       // lengte van een opgezwollen zak                (AANNAME)
    overlapM: 0.10,      // overlap tussen zakken in dezelfde laag        (AANNAME)
    layerHeightM: 0.12,  // hoogte van één laag, opgezwollen              (AANNAME)
    maxStackM: 0.60,     // hoogste stapel die we verantwoord vinden      (AANNAME)
    freeboardM: 0.10,    // marge boven de verwachte waterstand
    reserve: 0.10,       // 10% extra zakken
    minBags: 6,          // kleinste advies
    helpLimitCm: 50,     // tot deze waterhoogte zeggen we "zakken kunnen helpen"
    rainDefaultCm: 20,   // waterhoogte waarmee we rekenen als het water te diep is of zonder adres
    priceEUR: 10,        // prijs per zak
  },

  // ── Data: alleen de Klimaateffectatlas "waterdiepte bij hevige neerslag" ─────
  // Gemaakt met tools/hevige-regen/ (zie AI_NOTES.md). Per postcodegebied één .js-bestand,
  // zodat de site ook werkt als je index.html direct van je schijf opent.
  ADRES_URL: 'assets/data/adressen/{pc4}.js',
  AREA_NAME: 'Utrecht en directe omgeving',

  // Twee buien. Per bui: kaartlaag met water op straat en kaartlaag met de panden in FCAB-kleur.
  SCENARIOS: [
    { id: 'r70', name: 'Bui van 70 mm', when: 'een bui van 70 mm in een uur', freq: 'gemiddeld eens per 100 jaar',
      water: 'assets/tiles/regen70-utrecht/{z}/{x}/{y}.png', gebouwen: 'assets/tiles/gebouwen70-utrecht/{z}/{x}/{y}.png',
      bron: 'FCAB-omgevingsscore van de Klimaateffectatlas' },
    { id: 'r90', name: 'Bui van 90 mm', when: 'een bui van 90 mm in een uur', freq: 'gemiddeld eens per 250 jaar',
      water: 'assets/tiles/regen90-utrecht/{z}/{x}/{y}.png', gebouwen: 'assets/tiles/gebouwen90-utrecht/{z}/{x}/{y}.png',
      bron: 'berekend volgens de FCAB-methode uit de 90 mm-kaart van de Klimaateffectatlas' },
  ],

  // FCAB-klassen (omgevingsscore wateroverlast): waterdiepte tegen de gevel, kleuren uit de .sld.
  // red = telt als "rood" op de kaart (vanaf 10 cm).
  KLASSEN: {
    1: { name: 'Onbekend',   range: 'geen gegevens',   color: '#b2b2b2', level: 'onbekend' },
    2: { name: 'Geen',       range: '0 tot 2 cm',      color: '#ffffff', level: 'geen' },
    3: { name: 'Zeer laag',  range: '2 tot 10 cm',     color: '#ffbebe', level: 'zeerlaag' },
    4: { name: 'Laag',       range: '10 tot 15 cm',    color: '#ff7f7f', level: 'laag', red: true },
    5: { name: 'Middel',     range: '15 tot 20 cm',    color: '#ff0000', level: 'middel', red: true },
    6: { name: 'Hoog',       range: '20 tot 30 cm',    color: '#700000', level: 'hoog', red: true },
    7: { name: 'Zeer hoog',  range: 'meer dan 30 cm',  color: '#280000', level: 'zeerhoog', red: true },
  },
  // Waterdiepte op straat (kaartlaag), kleuren uit de .sld van de waterdieptekaart.
  WATER_LEGEND: [
    { label: '2–10 cm', color: '#b6edf0' }, { label: '10–15 cm', color: '#74b4e8' },
    { label: '15–20 cm', color: '#1f83e0' }, { label: '20–30 cm', color: '#1d44b8' },
    { label: 'meer dan 30 cm', color: '#002673' },
  ],
  TILES: { minNative: 13, maxNative: 16, bounds: [[51.98265, 4.93942], [52.18179, 5.24656]] },

  // Soorten openingen in het zakkenadvies (breedte in cm).
  OPENINGS: [
    { type: 'voordeur',    label: 'Voordeur',    w: 90 },
    { type: 'achterdeur',  label: 'Achterdeur',  w: 90 },
    { type: 'garagedeur',  label: 'Garagedeur',  w: 240 },
    { type: 'kelderraam',  label: 'Kelderraam',  w: 80 },
    { type: 'eigen',       label: 'Eigen maat',  w: 100 },
  ],

  // Kaart en adres zoeken (PDOK). Deze bepalen niets aan de uitkomst, alleen waar je adres ligt.
  BASEMAP: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png',
  PDOK_SEARCH: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1',
};
