# Life Pulse — GitHub Pages edition

Life Pulse turns a birth date into a personal dashboard with live age calculations, lifetime estimates, zodiac and numerology details, historical context, sports facts, and birth-location weather.

## Local review

Open `index.html` directly for layout and calculation review. Browser security may block same-site web feeds from a `file:///` address, so the published GitHub Pages version is the reliable place to verify daily data.

## Important files

- `index.html` — the complete Life Pulse experience
- `sports-data-v4.json` — versioned historical sports facts
- `live-data.json` — the most recent scheduled daily feed
- `scripts/update-live-data.mjs` — validates and refreshes all 12 horoscope signs
- `.github/workflows/pages.yml` — refreshes data and publishes GitHub Pages

## Published site

https://dallaslott.github.io/LifePulse/

The repository's Pages source must be set to **GitHub Actions**.

## Daily horoscope provider

Life Pulse prefers FreeAstroAPI V2 because it supplies an explicit date, generation timestamp, structured scores, and sign-specific content. Its API key stays private in GitHub Actions and is never included in `index.html`.

To enable the primary provider:

1. Create a FreeAstroAPI account and API key at https://www.freeastroapi.com/.
2. In the LifePulse GitHub repository, open **Settings → Secrets and variables → Actions**.
3. Choose **New repository secret**.
4. Name the secret `FREE_ASTRO_API_KEY` and paste the key as its value.
5. Open **Actions → Refresh Life Pulse and publish Pages → Run workflow**.

Until the secret is added, the updater uses the existing Free Horoscope API and labels it **Legacy Daily Feed** instead of presenting it as the verified primary source.

## Data behavior

- GitHub refreshes and republishes the daily feed once per day, with manual runs available.
- Every reading must match today's date, the requested sign, and minimum content checks.
- Text repeated across different dates is rejected.
- If today's providers fail validation, Life Pulse may show the most recent successful reading for up to seven days as **Previous Reading**.
- If no current or recent reading is available, it shows **Built-In Fallback**.
- The browser requests `live-data.json` without cache so phones receive the latest deployment.
- Historical birthplace weather continues to use Open-Meteo.