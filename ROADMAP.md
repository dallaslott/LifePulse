# Life Pulse Roadmap

This roadmap starts from the v4 dashboard architecture: a single GitHub Pages app, a scheduled `live-data.json` feed, a versioned sports dataset, and private developer diagnostics.

## Completed in the current local-review phase

- **What's Next**: one ordered view of upcoming personal, sky, calendar, civic, and major sports dates. It uses the existing astronomy calculations and schedule datasets, so it does not add API usage.
- **Your Life Timeline**: the existing milestone card now includes a filterable history for Highlights, Personal, World, Sky, Sports, and Tech. Detailed sports and sky histories remain scrollable and user-facing source drawers stay separate from developer metadata.
- **Collapsible dashboard hierarchy**: eight ordered content groups reduce scrolling, remember each device's open/closed choices, and include Expand All and Collapse All controls.
- **Born Then / Living Now**: a compact comparison of population, gasoline, temperature, the U.S. president, and everyday technology using already-maintained data routes and local reference anchors.
- **Birthday and holiday celebrations**: personalized birthday recognition plus themed messages and motion for major U.S. holidays, calculated locally with reduced-motion support and no additional feed usage.

## Phase 3 - Born Then / Living Now - Implemented for local review

The two-column comparison is implemented with compact values, changes, and plain-language labels. It reuses the current population, climate, gasoline, president, and technology-era data already maintained by Life Pulse. Missing historical values disappear gracefully rather than show technical errors.

## Phase 4 - Shareable Life Pulse Card

Extend the existing share card instead of building a second card. Add a compact template selector, privacy switches for name and birthplace, and an optional timeline highlight. Keep all generation in the browser; no profile data should be uploaded to a rendering service.

## Phase 5 - Data Health Dashboard

Expand hidden Diagnostics with a readable component table: source, last success, age, next scheduled check, coverage end, and fallback status. Add a single overall state of Healthy, Attention, or Stale. This remains developer-only; normal Source drawers continue to explain the card rather than the backend.

## Phase 6 - Meteor Showers and Visible Sky Events

Add a versioned `sky-events.json` calendar for major annual meteor showers, conjunctions, and visibility windows. Prefer annual schedule reconciliation over daily API calls. A future location-aware layer can estimate local viewing time, Moon interference, and horizon visibility using the existing matched birthplace coordinates.

## Phase 7 - Better Mobile Installation

Add a web app manifest, purpose-built icons, and a conservative service worker. Cache the interface shell, but always request `version.json` and live data with freshness checks. The existing Update Available control remains the authority for deploying a new dashboard version and prevents stale mobile installs.

## Suggested order

1. Review and publish the collapsible hierarchy + Born Then / Living Now release.
2. Improve the existing share card.
3. Expand Data Health before adding another scheduled dataset.
4. Add sky events.
5. Add installable-app support last, after the caching rules are tested on both iPhone and Android.

## Architecture hooks already available

- Scheduled feed component registry and freshness metadata
- Versioned release and Update Available behavior
- Matched birthplace coordinates kept in the browser
- Reusable Since Birth / All Time source drawer controls
- Versioned sports history and gated annual reconciliation
- Astronomy Engine calculations and cached historical searches
- Existing share-card image export
- Hidden Diagnostics and Self-Check
