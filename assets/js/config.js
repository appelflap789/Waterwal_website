/* Waterwal — instellingen. Alles wat je zonder programmeren wilt aanpassen staat hier. */
window.WATERWAL = {
  // Cloudflare Worker (zie worker/). /risk = overstromingsdata, /subscribe = wachtlijst.
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
    helpLimitCm: 50,     // tot deze waterhoogte zeggen we "zakken kunnen helpen" (bijv. 30 of 50)
    rainDefaultCm: 20,   // waterhoogte waarmee we rekenen als een scenario te diep is
    priceEUR: 10,        // prijs per zak
  },

  // ── Overstromingsscenario's ─────────────────────────────────────────────
  // id's komen overeen met de Worker (k1..k5 = LIWO "Maximale waterdiepte Nederland" kaart 1..5).
  // Kansklassen volgens Deltares/Rijkswaterstaat (LIWO afgeleide kaarten, nov 2025).
  SCENARIOS: [
    // Scenario's = overstromingen van verschillende zwaarte (LIWO kaart 1-4), met de officiële
    // namen. Hoe kleiner de kans, hoe zwaarder de overstroming, dus het water stijgt van k1
    // naar k4. Kaart 5 (extreem kleine kans) tonen we bewust niet; de Worker levert hem wel.
    { id: 'k1', name: 'Grote kans',       layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart1' },
    { id: 'k2', name: 'Middelgrote kans', layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart2' },
    { id: 'k3', name: 'Kleine kans',      layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart3' },
    { id: 'k4', name: 'Zeer kleine kans', layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart4' },
  ],

  // Het oordeel per adres. Komt uit de LIWO-kaart "plaatsgebonden overstromingskans"
  // (kans per jaar dat het op deze plek nat wordt), klassen 1-5:
  // 5 groot (>1/30), 4 middelgroot (1/30-1/300), 3 klein (1/300-1/3.000),
  // 2 zeer klein (1/3.000-1/30.000), 1 extreem klein (<1/30.000).
  RISK: {
    hoog:     { label: 'Hoog overstromingsrisico',     text: 'Je adres ligt op een plek waar een overstroming relatief vaak voorkomt.' },
    gemiddeld:{ label: 'Gemiddeld overstromingsrisico', text: 'Je adres kan overstromen. Dat is niet waarschijnlijk, maar ook niet uitzonderlijk.' },
    laag:     { label: 'Laag overstromingsrisico',     text: 'Een overstroming op je adres is onwaarschijnlijk, maar niet uitgesloten.' },
    minimaal: { label: 'Minimaal overstromingsrisico', text: 'Alleen bij een uitzonderlijk zware overstroming komt hier water.' },
    geen:     { label: 'Geen overstromingsrisico',     text: 'Op de kaarten van Rijkswaterstaat komt hier geen water van rivieren, meren of zee.' },
  },
  RISK_BY_CLASS: { 5: 'hoog', 4: 'gemiddeld', 3: 'laag', 2: 'minimaal', 1: 'minimaal' },
  // Reserve als de kanskaart ontbreekt: het eerste scenario waarin het adres nat wordt.
  RISK_BY_FIRST_WET: { k1: 'hoog', k2: 'gemiddeld', k3: 'laag', k4: 'minimaal', k5: 'minimaal' },

  // Uitleg bij het type gebied (PDOK, Richtlijn Overstromingsrisico's).
  ZONES: {
    A: 'Buitendijks: je adres ligt niet achter een dijk langs een grote rivier, een meer of de zee.',
    B: 'Je adres ligt achter een primaire dijk (grote rivieren, meren of zee).',
    C: 'Je adres ligt achter een regionale kering, zoals een boezemkade.',
    D: 'Je adres ligt onbeschermd langs regionaal water, zoals een beek of kanaal.',
  },

  // Soorten openingen in het zakkenadvies (breedte in cm).
  OPENINGS: [
    { type: 'voordeur',    label: 'Voordeur',    w: 90 },
    { type: 'achterdeur',  label: 'Achterdeur',  w: 90 },
    { type: 'garagedeur',  label: 'Garagedeur',  w: 240 },
    { type: 'kelderraam',  label: 'Kelderraam',  w: 80 },
    { type: 'eigen',       label: 'Eigen maat',  w: 100 },
  ],

  // Kaart
  LIWO_WMS: 'https://basisinformatie-overstromingen.nl/liwo/geoserver/wms',
  BASEMAP: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png',
  PDOK_SEARCH: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1',
};
