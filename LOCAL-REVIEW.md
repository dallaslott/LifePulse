# Reviewing Life Pulse on this computer

Nothing in this folder is published automatically from your computer.

## Open the local preview

1. Double-click `index.html`.
2. Enter a sample profile and choose a birthplace from the suggestion list.
3. Select **Launch Tracker**.
4. Review **Current Sky**, the eclipse cards, population, gas, and **Today's Life Pulse**.
5. Use **View Daily Horoscope** and **View Zodiac Profile** to compare the two views.

The local page includes the astronomy calculator, but a browser may block scheduled JSON and outside web feeds when the address starts with `file:///`. In that case, the layout and built-in fallbacks can still be reviewed here; the final scheduled values are verified after GitHub Actions publishes the site.

## Publishing

The GitHub Pages source remains **GitHub Actions**. The workflow refreshes the feed every day at 7:17 UTC and also runs whenever files are committed to `main` or **Run workflow** is selected manually.
