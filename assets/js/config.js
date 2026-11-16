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
    rainDefaultCm: 20,   // waterhoogte waarmee we rekenen als een scenario te diep is
    priceEUR: 10,        // prijs per zak
  },

  // ── Overstromingsscenario's ─────────────────────────────────────────────
  // id's komen overeen met de Worker (k1..k5 = LIWO "Maximale waterdiepte Nederland" kaart 1..5).
  // Kansklassen volgens Deltares/Rijkswaterstaat (LIWO afgeleide kaarten, nov 2025).
  SCENARIOS: [
    { id: 'k1', name: 'Grote kans',          freq: 'ongeveer 1× per 10 jaar',      layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart1' },
    { id: 'k2', name: 'Middelgrote kans',    freq: 'ongeveer 1× per 100 jaar',     layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart2' },
    { id: 'k3', name: 'Kleine kans',         freq: 'ongeveer 1× per 1.000 jaar',   layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart3' },
    { id: 'k4', name: 'Zeer kleine kans',    freq: 'ongeveer 1× per 10.000 jaar',  layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart4' },
    { id: 'k5', name: 'Extreem kleine kans', freq: 'ongeveer 1× per 100.000 jaar', layer: 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart5' },
  ],

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
    { type: 'terrasdeur',  label: 'Schuifpui',   w: 180 },
    { type: 'garagedeur',  label: 'Garagedeur',  w: 240 },
    { type: 'kelderraam',  label: 'Kelderraam',  w: 80 },
    { type: 'eigen',       label: 'Eigen maat',  w: 100 },
  ],

  // Kaart
  LIWO_WMS: 'https://basisinformatie-overstromingen.nl/liwo/geoserver/wms',
  BASEMAP: 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png',
  PDOK_SEARCH: 'https://api.pdok.nl/bzk/locatieserver/search/v3_1',
};
