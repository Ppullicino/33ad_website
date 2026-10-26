# 33AD

Placeholder website for 33AD, a location-based VR experience walking through
the Passion of Jesus Christ across five physical stages.

Plain HTML/CSS/JS, no build step — open `index.html` directly in a browser.

## Structure

- `index.html` — main scrolling landing page (hero, about, stage timeline, location, booking CTA, FAQ teaser, footer).
- `pages/stages/` — one detail page per stage (`stage-01.html`…`stage-05.html`), plus `_template.html` to copy for a new one.
- `pages/tickets.html`, `pages/faq.html` — deeper content pages.
- `css/variables.css` — color, type, and spacing tokens (the design system).
- `css/reset.css`, `css/main.css`, `css/stage.css` — base reset, shared site styles, and stage-page-specific styles.
- `js/main.js` — mobile nav toggle and scroll-reveal animation.
- `assets/icons/` — inline SVG icon set. `assets/images/placeholders/` — drop real photography/renders here as they arrive.

## Design system

Dark, cinematic base (`--bg-void`, `--bg-surface`) with an aged-gold accent
(`--gold`) for sacred/headline moments, a crimson accent (`--crimson`) used
sparingly for the passion/sacrifice motif, and a cyan "glow" accent
(`--glow`) for interactive/tech moments — keeping the tone reverent but
unmistakably VR. Headlines use `Cormorant Garamond` (dramatic serif); UI and
body copy use `Space Grotesk` (clean geometric sans). All tokens live in
`css/variables.css` — change them there to re-theme the whole site.

## Adding a new stage

1. Copy `pages/stages/_template.html` to `pages/stages/stage-0N.html`.
2. Replace the stage number and title, and write the body copy.
3. Fix the prev/next links in `.stage-nav` to point at the neighboring stages.
4. Add a matching `.stage-card` link to the timeline in `index.html`.

## Filling in placeholders

Everything marked "Placeholder" — copy, pricing, address/hours, contact
details, social links, and the map/venue image — is meant to be replaced
incrementally as real content is finalized. Image sections currently render
as CSS gradient boxes (`.placeholder-box`) so the layout holds with zero
image assets; swap in real images under `assets/images/` as they're ready.
