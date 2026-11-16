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
assets/js/config.js   window.WATERWAL: WORKER_URL, BAG (dimensions/price), SCENARIOS (k1..k5 +
                      LIWO layer names), ZONES (A-D copy), OPENINGS, map URLs
assets/js/main.js     one IIFE, numbered sections: helpers, computeAdvice, scene, address
                      search, result/chips, advice, map, waitlist, page chrome
assets/js/tune.js     Tweakpane panel; injected by main.js only when the URL has ?tune
assets/css/tokens.css tunable tokens between TUNE:START/TUNE:END, derived tokens below
assets/css/styles.css components; reads tokens only (no hard-coded brand colours)
worker/src/index.js   Cloudflare Worker: GET /risk, POST /subscribe
```

## Data flow

1. Autocomplete: PDOK Locatieserver `suggest` (browser, CORS ok) → `lookup` by id, or `free`
   when the visitor just presses enter. Gives `centroide_ll` + `postcode`.
2. `GET {WORKER_URL}/risk?lat&lon` → `{scenarios:[{id:'k1',depth_m:null|number}…], zones:[{code,description}]}`.
   The Worker does 5 LIWO WMS GetFeatureInfo calls (`GRAY_INDEX`, metres, -9999 = dry) plus one
   PDOK WMS GetFeatureInfo as `text/plain` (the JSON variant ships MBs of polygon geometry).
   LIWO sends no CORS headers, which is the only reason the Worker exists.
3. Kaart1–5 = grote / middelgrote / kleine / zeer kleine / extreem kleine kans (verified in the
   Deltares LIWO method report, Nov 2025). Labels and frequencies live in `SCENARIOS`, not the Worker.
4. Map: Leaflet 1.9.4 from cdnjs, loaded lazily after the first successful check. LIWO WMS tiles
   load directly (images need no CORS).

Worker CORS allow-list: waterwal.eu, www.waterwal.eu, localhost. `/risk` also allows the
`null` origin so the page works when opened from disk; `/subscribe` does not.
`/subscribe` returns 503 `not_configured` until `BREVO_API_KEY` + `BREVO_LIST_ID` secrets exist.

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
