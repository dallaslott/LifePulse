# Reviewing Life Pulse on this computer

Nothing in this folder is published automatically from your computer.

## Open the local preview

1. Double-click `index.html`.
2. Enter a sample profile and choose a birthplace from the suggestion list.
3. Select **Launch Tracker**.
4. Confirm the dashboard is divided into eight collapsible sections and only **Right Now** begins open on a first visit. If this browser has remembered an earlier test, use **Collapse All** first.
5. Open and close several sections, reload the page, and confirm those choices are remembered. Test **Expand All** and **Collapse All**.
6. Below **Next Birthday**, review **What's Next**. Confirm every item has its own line, a `MM/DD/YYYY` date, and a useful days-away label.
7. Open **Your Life Story**, then try the Highlights, Personal, World, Sky, Sports, and Tech filters in **Your Life Timeline**.
8. Open **Your Starting World** and review **Born Then / Living Now**, then **Born Into This World**. Confirm the snapshot is organized as **Your Birth Moment**, **World Snapshot**, and **Culture & Technology**, with **Weather at Your Birth** first.
9. Open **Cosmic & Astrology** to review **Current Sky**, the eclipse cards, **View Daily Horoscope**, and **View Zodiac Profile**.
10. Open **Share Your Pulse** and switch between Cosmic, Milestone, and Minimal. Confirm the preview changes immediately.
11. Turn off **Show Name** and **Show Birthplace**. Confirm both disappear from the card, then use **Copy Summary** and verify the name is omitted.
12. Choose a **Timeline Highlight** and confirm its date, category, title, and description appear as one compact block. Choose **No Timeline Highlight** to remove it.
13. Save each card style and confirm the PNG contains only the card, uses the chosen style, and respects the privacy switches.
14. Narrow the browser to phone width and confirm section headings, share controls, chevrons, and global controls remain easy to tap and that the collapsed page is substantially shorter.

## Sky events

1. Open **Cosmic & Astrology** and find **Meteor Shower** and **Sky Highlight**.
2. Confirm each card places its date on a separate line and gives practical viewing guidance.
3. Select **Source** on both cards. Confirm the visible explanation discusses the event and observing context, without workflow or programming details.
4. Open **What's Next** and confirm the next meteor peak and next planetary event appear in chronological order when they fall within the displayed range.
5. Open **Your Life Story**, select the Sky timeline filter, and confirm supported recent sky-calendar events appear without duplicates.
6. At phone width, confirm the Cosmic section becomes a clean single column, event names stay compact, dates do not collide with Source, routine sports summaries stay behind Source, and no card creates horizontal scrolling.

The local file preview uses an embedded 2026-2027 calendar because browsers commonly block local JSON requests. GitHub Pages reads the full versioned sky-events.json file covering 2025-2028. The workflow reviews coverage annually and advances it without using a paid API.

## Birthday and holiday celebration

When the saved birth month and day match today's date, **Right Now** shows a personalized Happy Birthday message and a longer confetti celebration. With sound enabled, a short synthesized Happy Birthday melody finishes before the normal background track begins. On supported holidays, it shows a themed message and animation instead. If a birthday and holiday coincide, the birthday remains primary and the holiday is acknowledged in the same card. The interface respects the device's Reduce Motion setting.

For local review, use the **Celebration Preview** controls fixed at the bottom of the page. Choose a birthday or holiday and select **Show Preview**; the current profile launches if necessary. Select **Use Actual Date** to leave preview mode. These controls are disabled automatically on the published GitHub Pages site.

The local page includes the astronomy calculator, but a browser may block scheduled JSON and outside web feeds when the address starts with `file:///`. In that case, the layout and built-in fallbacks can still be reviewed here; the final scheduled values are verified after GitHub Actions publishes the site.

## Publishing

The GitHub Pages source remains **GitHub Actions**. The workflow refreshes the feed every day at 7:17 UTC and also runs whenever files are committed to `main` or **Run workflow** is selected manually.


