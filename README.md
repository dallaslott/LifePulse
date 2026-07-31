# Life Pulse â€” GitHub Pages edition

Life Pulse turns a birth date into a personal dashboard with live age calculations, lifetime estimates, zodiac and numerology details, historical context, sports facts, and birth-location weather.

## Local review

Double-click `index.html` to review the current version on this computer. Nothing is published by opening it. See `LOCAL-REVIEW.md` for the walkthrough.

## Main files

- `index.html` â€” the complete Life Pulse experience
- `sports-data-v4.json` â€” versioned historical sports facts
- `live-data.json` â€” the most recent scheduled daily feed
- `scripts/update-live-data.mjs` â€” refreshes all 12 horoscope signs
- `.github/workflows/pages.yml` â€” refreshes data and publishes GitHub Pages

## Publishing

Publishing is intentionally postponed until the local review is approved. When approved, GitHub Pages will continue using:

`https://dallaslott.github.io/LifePulse/`

The repository's Pages source must be set to **GitHub Actions** before the new scheduled workflow can publish.

## Data behavior

- GitHub refreshes the daily horoscope feed every three hours.
- The published page uses `live-data.json` first.
- If scheduled data is unavailable, the browser tries the horoscope source directly.
- If both routes fail, the built-in zodiac reading remains available.
- Historical birthplace weather continues to use Open-Meteo.
