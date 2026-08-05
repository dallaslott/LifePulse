# LifePulse local review package

This folder mirrors the files that should be uploaded to GitHub after local review. Nothing in this folder has been published automatically.

## Review locally

Open `index.html` in a browser. Launch a saved or test profile and review the card layout, line breaks, zodiac icon, Current Sky copy, and hidden Diagnostics (click the build label five times). Local `file:///` security can block JSON/web requests; that is expected and does not indicate a Pages failure.

## What changed

- Schema-v4 data registry with freshness, fallback, source, and coverage metadata
- IERS leap-second announcements, World Bank population history, NASA climate history, and USAGov civic reference
- Optional EIA gas feed with automatic AAA fallback
- Calculated Moon/eclipses and future election dates; accurate Chinese-calendar zodiac; birthplace-timezone DST counting
- Smooth age clock with heavy cards throttled to once per minute
- Expanded Self-Check and hidden per-component diagnostics
- Automatic presidential and leap-second timeline reconciliation, plus finite sports/schedule coverage warnings
- Eastern and Western Conference NBA title cards, including the verified 2026 Knicks result and corrected 2025 Thunder clinching date
- Date-gated annual NFL, NBA, and MLB champion refreshes that make no request until a result could be final
- Automatic visible release numbers through generated `version.json`, with acknowledged cache-busting mobile updates
- Pre-deploy data validation and weekly dependency monitoring

## GitHub upload set

Upload/replace these paths while preserving their folders:

- `index.html`
- `README.md`
- `package.json`
- `sports-data-v4.json`
- `scripts/update-sports-data.mjs`
- `scripts/update-live-data.mjs`
- `scripts/validate-live-data.mjs`
- `.github/workflows/pages.yml`
- `.github/dependabot.yml`

After committing, GitHub Actions will generate `live-data.json` and `version.json`, validate them, and only then deploy GitHub Pages.

`EIA_API_KEY` is optional. Without it, the app keeps using AAA. Sports result automation still requires a future choice of a trusted/licensed provider; coverage monitoring is already active.

