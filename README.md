# Life Pulse — GitHub Pages Ready

This package contains a static version of your app prepared for GitHub Pages.

## Files
- `index.html` — main app file
- `sports-data-v4.json` — local sports dataset loaded by the app
- `.nojekyll` — keeps GitHub Pages from applying Jekyll processing

## Important after upload
1. In `index.html`, replace:
   - `YOUR-USERNAME`
   - `YOUR-REPO-NAME`
2. Save and push again so the social sharing/canonical URL matches your real GitHub Pages URL.

## Notes
- The app is mostly self-contained and uses a relative path for `sports-data-v4.json`, which works well on GitHub Pages.
- Some live features depend on third-party APIs and may occasionally fall back if those services block browser requests or CORS.
