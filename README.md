# Life Pulse — GitHub Pages edition

Life Pulse turns a birth date into a personal dashboard with live age calculations, lifetime estimates, zodiac and numerology details, historical context, sports facts, astronomy, and birth-location weather.

## Local review

Open `index.html` directly for layout and calculation review. The bundled `vendor/astronomy.browser.min.js` makes the Current Sky and birthplace eclipse calculation available locally. Browser security may still block `live-data.json` and other web feeds from a `file:///` address, so the published GitHub Pages version is the reliable place to verify scheduled data.

## Important files

- `index.html` — the complete Life Pulse experience
- `sports-data-v4.json` — versioned historical sports facts
- `live-data.json` — the most recent scheduled daily feed
- `scripts/update-live-data.mjs` — refreshes horoscope, astronomy, population, and gas data
- `package.json` — pins Astronomy Engine to a tested version
- `vendor/astronomy.browser.min.js` — supports private, on-device eclipse visibility calculations
- `.github/workflows/pages.yml` — refreshes data and publishes GitHub Pages

## Published site

https://dallaslott.github.io/LifePulse/

The repository's Pages source must be set to **GitHub Actions**.

## Scheduled data

GitHub Actions runs daily and publishes one cache-busted `live-data.json` file containing:

- Verified daily horoscopes for all 12 signs
- Current Moon phase and illumination
- Previous/next Full Moon and next New Moon
- Next global solar and lunar eclipses
- Current planetary retrograde status
- World population from Worldometer
- U.S. national gas average from EIA when configured, with AAA fallback
- IERS leap-second announcements
- World Bank historical population
- NASA GISTEMP climate history
- USAGov civic reference
- Component freshness and sports-coverage metadata

Astronomy dates and planetary motion are calculated with Astronomy Engine, which is tested against JPL Horizons and NOVAS data. When a matched birthplace is saved, the browser calculates the next solar eclipse for those coordinates without sending the birthplace to an astronomy service.

## Daily horoscope provider

Life Pulse prefers FreeAstroAPI V2 because it supplies an explicit date, generation timestamp, structured scores, and sign-specific content. Its API key stays private in GitHub Actions and is never included in `index.html`.

To enable the primary provider:

1. Create a FreeAstroAPI account and API key at https://www.freeastroapi.com/.
2. In the LifePulse GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Choose **New repository secret**.
4. Name the secret `FREE_ASTRO_API_KEY` and paste the key as its value.
5. Open **Actions → Refresh Life Pulse and publish Pages → Run workflow**.

Until the secret is added, the updater uses the existing Free Horoscope API and labels it **Legacy Daily Feed** instead of presenting it as the verified primary source.

## Fallback behavior

- Horoscope text must match today's date, requested sign, and minimum content checks.
- Repeated horoscope text across different dates is rejected.
- The most recent successful horoscope may be retained for up to seven days.
- Population and gas values may be retained for up to fourteen days if a source is temporarily unavailable.
- Built-in astronomical estimates and historical anchors remain visible if the scheduled feed cannot load.
- The browser requests `live-data.json` without cache so phones receive the latest deployment.
- Historical birthplace weather continues to use Open-Meteo.
## Diagnostics and Self-Check

Diagnostics is a developer-only panel. After a profile launches, tap or click the build label five times quickly to open or close it. **Run Self-Check** makes a fresh request for the published daily JSON and validates its schema, all 12 horoscopes, freshness, astronomy, population, and gas sections. It also checks browser storage, sharing, the astronomy calculator, and required layout elements. Technical dataset and calculation notes in card Source drawers are shown only while developer Diagnostics is open.

Leap-second history is refreshed against the latest IERS Bulletin C. December 31, 2016 remains the last actual insertion date because IERS has not introduced another leap second; the feed also carries the latest no-change or future announcement.


## Data longevity and freshness

The scheduled feed uses schema 4. Every updateable component has a registry entry with its status, source, retrieval time, expiration time, fallback state, and—where relevant—coverage end. The hidden Self-Check reads that registry and reports missing, unavailable, or expired components.

Finite timelines use a baseline-plus-reconciliation pattern so they cannot silently age out. IERS replaces the leap-second event history, USAGov verifies and can extend the presidential term timeline, and `sports-data-v4.json` replaces sports results and major-event schedules. Self-Check separately reports expired schedule coverage or a completed sports season whose champion has not yet been added. Intentionally editorial eras remain labeled curated rather than being mistaken for live facts.

NFL, NBA, and MLB champion checks are date-gated. The daily workflow makes no sports-result request until a league's projected completion date and skips that league entirely once the year's champion is present. The current gates are February 15 for the Super Bowl, June 24 for the NBA Finals, and November 6 for the World Series. A confirmed winner is validated, written to `sports-data-v4.json`, committed by GitHub Actions with `[skip ci]`, and included in the same Pages deployment. If a championship is delayed or the source is temporarily unavailable, the next scheduled run retries it.

Historical Source drawers use a reusable Since Your Birth / All Time view. Championship lists identify consecutive defenses as B2B, 3-Peat, or longer streaks; the same range control is used for Presidents, leap seconds, palindrome dates, curated technology eras, Olympics, World Cups, Blue Moons, and calculated eclipse histories. Long histories scroll inside the drawer, and provider or backend metadata remains visible only in Diagnostics.

Authoritative or calculation-first routes now include:

- IERS Bulletin C for current leap-second announcements, while the full historical event list remains available offline
- World Bank annual population history for birth-year comparisons
- NASA GISTEMP v4 annual global temperature history
- USAGov for the current U.S. president reference
- Astronomy Engine for Moon phases, Blue Moons, eclipses, local eclipse visibility, and retrogrades
- Worldometer for the current population estimate
- U.S. EIA weekly gasoline data when `EIA_API_KEY` is configured, with AAA as the automatic fallback
- Open-Meteo for matched birthplace timezone and historical weather
- A validated local sports dataset with explicit result and schedule coverage dates, including lifetime NFL, MLB, and NBA championship splits by conference or league

`version.json` is generated with each feed refresh and receives an automatic release number such as `v4.27.1` (data schema, GitHub workflow run, run attempt). The current version appears subtly beside the build label; local-file previews show `v4.local`. Hosted browsers check for a new release at startup, whenever the tab becomes visible, and every 15 minutes. If a newer deployment exists, an **Update Available** button appears. Selecting it acknowledges that release and reloads through a versioned URL so mobile browsers do not keep presenting the same update or reuse an old cached page.

## Optional EIA gasoline key

The existing AAA route remains active without setup. To prefer the more stable U.S. Energy Information Administration API, create an EIA API key and add it as the repository Actions secret `EIA_API_KEY`. The key is used only inside GitHub Actions and is never published.

## Validation and maintenance

`scripts/validate-live-data.mjs` runs after every refresh and before Pages packaging. It verifies schema 4, the automatic release-number format, all twelve horoscope signs, astronomy, current comparisons, authoritative reference histories, registered component freshness, a future sports event, and the match between `version.json` and `live-data.json`. A failed validation stops that deployment.

Dependabot checks the pinned npm dependency and GitHub Actions versions weekly. Astronomy Engine remains pinned until an update is reviewed and merged.

Live age counters update four times per second, while the heavier lifetime, calendar, source-drawer, and card calculations run once per minute or on an explicit profile/control change. This keeps the dashboard responsive on phones without making the displayed age feel less live.

Editorial concepts, generation names, cultural eras, technology eras, personality copy, and estimates such as steps or meals remain clearly curated rather than presented as live facts. Annual NFL, NBA, and MLB champions are automatically checked through Wikimedia after their date gates; the remaining sports records stay coverage-monitored and editorially validated.



