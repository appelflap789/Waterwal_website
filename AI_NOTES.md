# AI build notes — read this before editing

Context for whichever AI session edits this site next, so you don't have to
re-derive decisions from the CSS/JS alone. `README.md` is the user-facing doc
(what's placeholder, what to replace); this file is the *how it's wired*
reference. Keep both up to date when you make structural changes.

## Stack

Plain HTML/CSS/JS. No build step, no framework, no npm. Two fonts loaded from
Google Fonts (`Fraunces` display serif, `Inter` body sans) via `<link>` in each
page's `<head>`. Everything else is self-contained in the three asset files.
Open `index.html` directly in a browser — nothing needs serving.

```
index.html              Homepage
buy.html                Packs / calculator / checkout
assets/css/styles.css   All styling — one shared file for both pages
assets/js/main.js       All behaviour — one shared file, feature-detects per page
README.md               User-facing: what's placeholder, what to replace before launch
AI_NOTES.md             This file
```

## Design brief this was built against

Answers from the original `/grill-me` pass — if the user asks for something that
contradicts these, it's a deliberate change, not a mistake to "fix back":

- **Language:** English.
- **Tone:** calm / reassuring / premium — *not* alarmist. The fear of flooding is
  named once in the "honest version" section and then the whole rest of the page
  is the reassurance. Avoid adding urgency/countdown/siren language unless asked.
- **Scope:** homepage + a buy page with dummy checkout (no real payment, no real
  order placed — both pages say so in the sand-coloured `.mock-note` banner).
- **The core USP** is storage space, not flood protection per se — protection is
  table stakes, "fits in a shoebox instead of a pallet" is the actual pitch. It
  has its own dedicated section (`#space` in index.html) with an interactive
  to-scale comparison, not just a bullet point. Treat that section as the most
  important one on the page.

## CSS architecture (`assets/css/styles.css`)

- **Design tokens** live in `:root` at the top: `--paper/--paper-2/--paper-3`
  (backgrounds), `--ink/--ink-2/--ink-3` (text, darkest to lightest), `--marine`
  and `--marine-2` (brand teal, primary buttons/dark sections), `--aqua`
  (accent, used sparingly — icons, the italic word in the H1), `--sand` (the
  mock-up banner only). Change the palette by editing these, not by hunting for
  hex codes in rules.
- Radii: `--r-sm` (inputs) through `--r-xl` (cards, hero art, buy summary).
  Shadows: `--shadow-sm/md/lg`, all a soft marine tint, not pure black.
- Section rhythm: `.section` = generous vertical padding, `.section--tight` =
  less, `.section--paper2` = the `--paper-2` off-white band (alternates with
  plain `--paper` for visual rhythm down the page), `.section--marine` = dark
  band (used once, for `#specs`).
- `.reveal` + `.reveal.in` is the scroll-in-view fade/rise animation, toggled by
  an `IntersectionObserver` in JS. `--d` inline custom property staggers delay
  per element. Respects `prefers-reduced-motion` (both in CSS transition and in
  JS, which skips the observer and just adds `.in` immediately).
- Buy-page-only styles are appended at the bottom of the same file, after a
  `Buy page` comment banner — search for `.buy-hero` to find the start.
- Responsive: single breakpoint pattern, mostly `@media (max-width: 900px)` or
  `860px` collapsing 3-col/2-col grids to 1 column, and `max-width: 860px` for
  nav → hamburger. Tested at 1440px and a true 400px viewport (iframe, not just
  a narrow headless window — headless Chromium/Edge has a minimum window width
  around 500px, so to actually test phone width you must load the page inside
  an `<iframe width="400">`, not just shrink `--window-size`).

## JS architecture (`assets/js/main.js`)

Single IIFE, no modules, no build step. Organized as independent guarded blocks
— each one does `var el = $('#whatever'); if (el) { ... }` so the same file
loads on both pages without erroring on missing elements. When adding a new
interactive piece, follow that pattern rather than assuming both pages share DOM.

Blocks, top to bottom:
1. Sticky header shadow toggle (`.is-stuck` on scroll)
2. Mobile nav open/close
3. `.reveal` scroll-in animation (`IntersectionObserver`)
4. Animated counting numbers (`[data-count]` — the stat strip)
5. FAQ accordion (max-height transition, one open at a time)
6. **Storage comparison grid** (`#volumeVisual` / `#compareFacts` / `.segmented`
   tabs) — this is the USP section. Data lives in the `MODES` object:
   `sandbags: { units: 73, rows: [...] }` / `waterwal: { units: 1, rows: [...] }`.
   `units` = how many of the 80 grid squares light up (grid is fixed 10×8 = 80
   cells). The numbers in `rows` (storage space, weight, etc.) are typed as
   HTML strings, not computed — if you change the bag dimensions in the spec
   section, you must manually update these to match, they don't derive from
   each other.
7. Everything below `if (!tiersEl) return;` only runs on `buy.html`.

### Buy page state (`buy.html` via `main.js`)

- `TIERS` array is the single source of truth for pack data: `{id, name, bags,
  price, best, desc, meta}`. Add/remove/reprice packs here — the tier cards,
  the calculator's "best fit" logic, and the order summary all read from this
  array, nothing is hardcoded elsewhere.
- `state = { tier, qty }` is the whole order state. `render()` at the bottom
  redraws the summary panel from `state` — call it after any state mutation.
- The calculator (`recalc()`) assumes **62 cm bag length, 11 cm layer height**
  (matches the spec table on the homepage — `#specs`). It computes bags-needed
  from width/height inputs, then picks whichever tier minimizes a
  `waste*2 + cost/10` score — i.e. biased toward not overbuying, tie-broken by
  price. If you change bag dimensions, update the `62` and `11` literals in
  `recalc()` to match the homepage spec table.
- "Place order" (`#placeOrder`) only validates that name + email are non-empty
  (turns the empty field's border red briefly). It does not send data anywhere
  — it swaps `#buyLayout` for `#confirm` client-side. There is no backend.
  Wiring this to a real order system is a from-scratch task, not a tweak.

## Content wiring between the two pages

`index.html` and `buy.html` are hand-synced duplicates for the header/footer/nav
— there's no shared partial/include mechanism (plain HTML has none without a
build step). **If you edit the nav, footer, or brand mark, do it in both files**
or they'll drift. Search for `class="site-header"` and `class="site-footer"` in
each.

Numbers that must stay consistent across files if changed:
- Bag dimensions (420 g / 18 kg / 62×26×2 cm / 11 cm activated height) appear in:
  `index.html` stat strip, `index.html` `#specs` table, `assets/js/main.js`
  `MODES` comparison facts, `assets/js/main.js` `recalc()` (the `62` / `11`
  literals).
- Pack prices/sizes appear only in `TIERS` in `main.js` (buy page reads them
  live) — but the homepage CTA copy and hero caption ("six bags", "under four
  minutes") are hand-written prose, not derived, so check those by eye too if
  you change the underlying figures.

## Verification method used while building

No test framework. Visual checks were done by rendering the actual files with
headless Edge (`msedge.exe --headless=new`) and reading the resulting PNG
screenshots — this caught real bugs (a `<figure>` UA-stylesheet margin breaking
the testimonials grid, dark-on-dark text in the CTA band, an SVG wave not
spanning its container) that a code read-through missed. If you make a
non-trivial visual change, prefer actually rendering it over eyeballing the
markup — this codebase has already proven that trap once.

JS was syntax-checked with `node --check` (Windows node at
`/mnt/c/Program Files/nodejs/node.exe`, since there's no Linux node in this
WSL environment). The buy-page order flow and the FAQ/comparison toggles were
smoke-tested by injecting a small driver `<script>` that clicks through the
flow on `load` and screenshotting the result — a cheap substitute for a real
test suite in a static-file-only project.

## Known placeholders (see README.md for the full list)

Everything numeric (prices, weights, activation time, shelf life, the
73-vs-1 storage ratio) and all three testimonials are invented for the mock-up.
Testimonials are explicitly labeled "Placeholder testimonial" in the visible
copy — don't quietly swap in realistic-looking fake quotes, replace them with
real ones or leave the label.

