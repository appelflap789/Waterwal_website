# Waterwal — website mock-up

A two-page static mock-up for Waterwal water-absorbing flood bags. No build step,
no dependencies: open `index.html` in a browser.

```
index.html            Homepage — the scroll story, ending in a buy CTA
buy.html              Packs, a sizing calculator, and a dummy checkout
assets/css/styles.css All styling (design tokens at the top)
assets/js/main.js     All behaviour (no libraries)
```

## What it does

**Homepage** — hero with a cross-section illustration of a doorway holding water back,
a stat strip, an old-way/new-way contrast, three how-it-works steps, an interactive
storage-space comparison (the core USP), use cases, full specification, testimonials,
FAQ accordion, and a closing CTA to the buy page.

**Buy page** — three pack tiers, a calculator that turns "metres of frontage × height"
into a bag count and recommends a pack, a quantity stepper, a live order summary,
a delivery form, and a confirmation screen. Nothing is sent anywhere and no payment
is taken.

## Positioning it was built to

Calm and reassuring rather than alarmist. The fear of flooding is the reason someone
is on the page, so the copy names it once and then spends the rest of its time being
the answer to it. The unique selling point — that the product takes up almost no
space — is given its own full section with a drawn-to-scale comparison, because
storage is the objection that kills flood-barrier purchases.

## Everything here that is a placeholder

All of it is invented for the mock-up and needs replacing before this goes anywhere near
a customer:

- **Product figures** — 420 g dry, 18 kg activated, 62 × 26 × 2 cm, 3–5 min activation,
  10-year shelf life, −20 °C to 60 °C. Plausible for a sodium-polyacrylate flood bag,
  but not measured.
- **Comparison numbers** — 20 sandbags at 0.47 m³ / 420 kg versus 20 Waterwal bags at
  0.0064 m³ / 8.4 kg, and the 73:1 storage ratio the grid draws. Derived from the dry
  dimensions above, so they move if those move. The grid is in `MODES` in `main.js`.
- **Prices** — €59 / €179 / €449, free shipping over €100, €6.95 below it.
  In `TIERS` in `main.js`.
- **Testimonials** — clearly labelled "Placeholder testimonial" in the markup and on
  screen. Do not ship real-looking quotes until you have real ones.
- **Sizing rule** — the calculator assumes each bag is 62 cm long and 11 cm high, so
  roughly two bags per metre per layer. Worth validating against a real stack.

Both pages carry a sand-coloured banner at the top saying it is a mock-up. Remove the
`.mock-note` div from both files when the content becomes real.

## Notes for taking it further

- Design tokens (colour, radius, shadow, type) are the `:root` block in `styles.css` —
  change the palette there and the whole site follows.
- Fonts are Fraunces (display) and Inter (text), loaded from Google Fonts. Self-host
  them if the site needs to work offline.
- The page is light-mode only by deliberate choice; there is no dark palette to maintain.
- Checked at 1440px and 400px wide; no horizontal overflow at either.
