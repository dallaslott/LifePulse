# Life Pulse Roadmap

This roadmap starts from the v4 dashboard architecture: a single GitHub Pages app, a scheduled `live-data.json` feed, a versioned sports dataset, and private developer diagnostics.

## Completed in the current local-review phase

- **What's Next**: one ordered view of upcoming personal, sky, calendar, civic, and major sports dates. It uses the existing astronomy calculations and schedule datasets, so it does not add API usage.
- **Your Life Timeline**: the existing milestone card now includes a filterable history for Highlights, Personal, World, Sky, Sports, and Tech. Detailed sports and sky histories remain scrollable and user-facing source drawers stay separate from developer metadata.
- **Collapsible dashboard hierarchy**: eight ordered content groups reduce scrolling, remember each device's open/closed choices, and include Expand All and Collapse All controls.
- **Born Then / Living Now**: grouped World & Society, Everyday Costs, and Major Life Costs comparisons, backed by a dedicated annually reviewed dataset with clear median, average, and estimate labels.
- **Focused Life Atlas and location comparison**: birth-sky and daylight dial, clarified birthday patterns, technology-age milestones, generation overlap, world-age estimate, birthday-year progress ring, and optional Birthplace/Current Residence population comparisons using browser-compatible city search.
- **Birthday and holiday celebrations**: personalized birthday recognition plus themed messages and motion for major U.S. holidays, calculated locally with reduced-motion support and no additional feed usage.

## Phase 3 - Born Then / Living Now - Implemented for local review

The comparison is implemented with compact Then / Now values, plain-language changes, and three logical groups. World and civic facts reuse the existing scheduled feed; the dedicated cost-of-living dataset covers housing, rent, vehicles, a clearly labeled meal estimate, movies, household income, Disney admission, public four-year tuition, and federal minimum wage. Values before a source series begins say Not Tracked Yet (or Not Open Yet for Walt Disney World) instead of inventing a number.

## Phase 4 - Shareable Life Pulse Card - Implemented for local review

The existing share card now has Cosmic, Milestone, and Minimal templates, privacy switches for name and birthplace, and an optional highlight selected from the life timeline. Privacy choices carry through the preview, PNG export, copied summary, and generated share link. All rendering remains in the browser; no profile data is uploaded to a rendering service.

## Phase 5 - Data Health Dashboard

Expand hidden Diagnostics with a readable component table: source, last success, age, next scheduled check, coverage end, and fallback status. Add a single overall state of Healthy, Attention, or Stale. This remains developer-only; normal Source drawers continue to explain the card rather than the backend.

## Phase 6 - Meteor Showers and Visible Sky Events - Implemented for local review

A versioned sky-events.json calendar now covers major meteor showers, planetary conjunctions, oppositions, greatest elongations, and season markers. **Meteor Shower** and **Sky Highlight** cards feed the Cosmic section, What's Next, Source drawers, and supported recent timeline events. NASA GSFC decade data supplies calculated dates through 2100, while International Meteor Organization guidance supplements annual shower visibility. The GitHub workflow checks the calendar on an annual review date and commits only changed data, requiring no API key or daily credits.

A later location-aware refinement can estimate Moon interference, local horizon visibility, and best viewing hours using the matched birthplace coordinates.

The mobile density pass keeps text-heavy cosmic summaries in a readable single column on phones, shortens event headlines, and leaves routine sports detail behind Source so numbers and dates remain easy to scan.
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

## Future discovery backlog

- Local climate-change comparison using maintained historical normals and present-day conditions.
- Interactive birthplace-to-hometown map with distance, direction, time zones, and population context.
- Then/Now comparison slider for culture, prices, technology, and major milestones.
- Personal Orbit and Cosmic Calendar graphics for birthdays, planetary returns, holidays, sky events, and sports dates.
- NASA/JPL near-Earth visitor card with the closest notable approach and plain-language distance comparisons.
- Optional Surprise Me interaction that surfaces one rotating, source-backed LifePulse fact.
- Extend official population histories internationally when a consistent city-level source and matching strategy are available.



