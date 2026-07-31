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
- U.S. national gas average from AAA

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
