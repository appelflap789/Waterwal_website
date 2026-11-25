# AI build notes — read this before editing

How the site is wired, for whichever AI session edits it next. `README.md` is the
owner-facing doc (Dutch); `PLAN.md` is the original brief. Rebuilt 2026-11-16; the
old English two-page mock-up (buy page, translations) is gone on purpose.

## Decisions that are settled (don't "fix back")

- Dutch only. Waitlist only, no checkout. €10 per loose bag. Black bag has handles, white has none.
- Tone: calm and honest. When water is deeper than a stack can hold (~50 cm) the site says so
  and falls back to a 20 cm "heavy rain" calculation instead of recommending more bags.
- No invented product figures or testimonials. Bag dimensions are flagged assumptions in `config.js`.
- Plain HTML/CSS/JS, no build step, no npm for the site. Hosted on GitHub Pages.
- The GitHub repo is public: never write the Cloudflare token, account ID or Brevo key to any file.

## Files

```
assets/js/config.js   window.WATERWAL: WORKER_URL (waitlist only), BAG (dimensions/price),
                      ADRES_URL, SCENARIOS (r70/r90 + tile URLs), KLASSEN (FCAB), TILES, OPENINGS
assets/data/adressen/ per-postcode address files (generated, see tools/hevige-regen)
assets/tiles/         own map tiles: regen70/90 (water), gebouwen70/90 (FCAB colours)
tools/hevige-regen/   data pipeline (Python), see "Data flow"
assets/js/main.js     one IIFE, numbered sections: helpers, computeAdvice, scene, address
                      search, result/chips, advice, map, waitlist, page chrome
assets/js/tune.js     Tweakpane panel; injected by main.js only when the URL has ?tune
assets/css/tokens.css tunable tokens between TUNE:START/TUNE:END, derived tokens below
assets/css/styles.css components; reads tokens only (no hard-coded brand colours)
worker/src/index.js   Cloudflare Worker: GET /risk, POST /subscribe
```

## Data flow (rebuilt 2026-11-25: heavy rain only, no LIWO)

The owner decided the check uses ONLY the Klimaateffectatlas "waterdiepte bij hevige neerslag"
data: the 70 mm/1 h and 90 mm/1 h water-depth GeoTIFFs and the FCAB omgevingsscore wateroverlast
(download portal kea-downloadportal.cas-platform.nl, CC BY 4.0, cite "Klimaateffectatlas, 2026").
LIWO/Rijkswaterstaat is gone from the page; the Worker is only used for `/subscribe`. PDOK is still
used for the address search and the base map (location only, never for the outcome).
Coverage: the 12 Utrecht tiles the owner has (Utrecht + direct surroundings).

1. Address: PDOK Locatieserver `suggest` → `lookup`/`free` with `adresseerbaarobject_id` + postcode.
   Not an address (street/postcode) → "kies een adres met huisnummer".
2. `assets/data/adressen/<pc4>.js` is loaded as a `<script>` (not fetch, so `index.html` also works
   opened from disk) and calls `WATERWAL_ADRES(pc4, {vboId: "k70,k90,d70,d90,f"})`. Missing file or id
   → "nog geen gegevens, alleen Utrecht en directe omgeving".
   k = FCAB class 1..7 (config `KLASSEN`), d = p99 water depth against the facade in cm,
   f = 1 when k70 is FCAB's own value.
3. 70 mm uses FCAB's own `waterdiepte_klasse`/`waterdiepte_p99` per BAG pand. FCAB does not exist for
   90 mm, so we compute it the FCAB way: 99th percentile of water depth in a 0.5 m ring outside the
   pand (calibrated: on 2561 Utrecht panden this reproduces FCAB's 70 mm class in 93%).
4. Result: verdict box in the FCAB colour of the chosen storm, headline "Tot X cm" (p99), two chips
   (70 / 90 mm). The chip drives drawing, advice and map. >50 cm → tooDeep, advice falls back to 20 cm.
5. Map (Leaflet): base map + water tiles + building tiles of the chosen storm, checkboxes per layer.
   All tiles are our own PNGs (z13-16, Leaflet upscales to 19; building tiles are 512 px for sharpness).

Pipeline (`tools/hevige-regen/`, raw data in Desktop/wateroverlast, outside the public repo):
`fetch_bag.py` (BAG panden + verblijfsobjecten in the tiles) → `extract_fcab.py` (cut the national
FCAB GeoPackage to the area) → `pand_stats.py --buffer 0.5` on 70 and 90 mm (p99 per pand; numpy +
zstandard, conda env `main`) → `build_adressen.py` → `assets/data/adressen/`.
Tiles: `make_tiles.py` (water, per storm) → `assets/tiles/regen70-utrecht`, `regen90-utrecht`;
`make_fcab_tiles.py` (buildings; `--csv` for 90 mm) → `gebouwen70-utrecht`, `gebouwen90-utrecht`.
`calibrate_fcab.py` documents how the 0.5 m ring was chosen. RD↔WGS84 via Schreutelaar formulas (~0.3 m).
New area: download its tiles, run the pipeline, widen `TILES.bounds` and `AREA_NAME` in config.js.

## State and rendering (`main.js`)

`state` holds everything: `mode` (idle | result | manual), `risk`, `scenario`, `viewDepthM`
(water level in the hero drawing), `adviceCm` (what the advice calculates with), `tooDeep`,
`custom` (visitor moved the slider), `openings`, `color`.

- `selectScenario(id)` sets depth/advice from the scenario, then calls `renderHeadline`,
  `renderScene`, `renderAdvice`, `updateMapLayer`.
- The slider sets `custom = true` and drives both the advice and the drawing.
- `computeAdvice(cm, openings)`: per opening `ceil(w / (length - overlap)) + 1` bags per layer,
  layers = `ceil((depth + freeboard) / layerHeight)` capped at `maxStack / layerHeight`, +10%
  reserve, minimum `minBags`. Uses an epsilon `ceil` because 0.6/0.12 > 5 in floating point.

## The hero drawing ("de waterlijn")

Inline SVG in `index.html`, viewBox 560×400, ground at y=330, 1.2 px per cm. The water groups
have class `.sc-level` and move with the CSS custom property `--level` (px) set on `#scene`;
the rise duration, wave speed and wave height are tokens. Bags are drawn by `drawSceneBags`.
`.is-flooded` on `#scene` shows water indoors (stack overtopped); `.is-dry` hides the water.

## Tweakpane (`?tune`)

`tune.js` keeps a params object `P`, maps it to CSS custom properties on `:root`, saves it to
localStorage (only read back when `?tune` is present) and exports a `:root {}` block.
`?tune=polder|diep|signaal` starts from a preset. `WATERWAL.api.simulate(depthM)` and
`.replayBags()` exist for the panel.

## Verifying changes

Headless Edge works for screenshots: `msedge.exe --headless=new --screenshot=… --window-size=…`.
Two traps found while building:
- `--virtual-time-budget` fast-forwards the page's own fetch timeouts, so live lookups "fail".
  Instead serve the folder on localhost and delay the load event (e.g. an `<img>` from a slow
  endpoint) so the screenshot waits for real network time.
- Headless windows can't go narrower than ~500 px. For phone width, load the page in an
  `<iframe width="390">`. An iframe taller than the window also lets you screenshot lower
  parts of the page by offsetting it.
Deep link for tests: `index.html?adres=Kerkstraat 2e-11 Tiel` (10 cm / 40 cm),
`?adres=Achterom 20 Lopik` (88 cm, too deep), `?adres=Noordendijk 250 Dordrecht` (dry).
JS syntax: `node --check`.

## Redesign (2026-11-25)
Designed with the Impeccable skill (PRODUCT.md, .impeccable/surfaces) and Claude Design (canvas "Waterwal redesign"). White ground, logo green (tokens.css --p-h 163), Bricolage Grotesque + Hanken Grotesk. Sections: hero (address check + door photo), #uitkomst (result + map, hidden until a check), #advies (drawing + openings + summary), waarom (two photos), zo-werkt-het (dark band), zakken, vragen, wachtlijst. All JS ids unchanged. Photos in assets/img/*.webp are AI-generated (Nano Banana, prompts embedded in assets/plates/*.png) and labelled as such on the page.
