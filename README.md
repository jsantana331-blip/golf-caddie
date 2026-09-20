# Caddie
Personal mobile golf caddie PWA, served as static files on GitHub Pages.

## V1.1 round experience
Course Overview → Game Plan → 18 Hole Caddie pages → Round Summary.
Use the bottom selector or arrows to navigate. Swipe outside result controls to move between pages. Content scrolls independently of navigation.

Results save immediately on this device under `caddie:<pathname>:results:v1.1:<round.id>`. Old A/R/P keys are ignored and untouched. The saved page resumes on reload. Unrecorded fields stay blank rather than counting as zero; summaries show the number of recorded holes. Score-relative-to-par uses only scored holes. Par 3 tee accuracy is N/A. Putts 3+ and penalties 2+ reveal exact-count controls so totals remain accurate. Tap a selected quick choice to clear it. Start a new round from Summary only after copying the current scorecard; replacement requires confirmation. This release stores one current round, not round history.

## Current round / data
Nevel Meade — Blue tees. `data/current-round.json` holds course facts, club distances, game plan, and all 18 strategy records plus conversational advice. Missing course facts display Unknown. Course par and par counts come from hole data. No live weather or external scoring integration is used.

When replacing the course/round data, assign a new stable `id` to prevent results from a different round being reused. Keep `holes`, `clubs`, and `gamePlan` structured. Bump the service-worker cache name whenever shipping changed assets/data.

## Offline / installation
Manifest, icons, relative URLs and Apple Home Screen metadata are preserved. The worker precaches the complete shell including data and result calculations, then activates immediately and removes only old Caddie caches. Online requests refresh cached resources; offline navigation falls back to the shell. Initial use requires a successful online load. An already-open page shows its loaded version until reopened/reloaded; no forced reload interrupts score entry.

## Checks
Run `node tests/results.test.cjs` for round totals, partial results, validation, and par-3 handling. No build step or runtime packages are needed. Serve this folder over localhost or HTTPS for service-worker checks.

Before merging, test on an iPhone: installed Home Screen launch, update from the prior installed version while online then relaunch, airplane-mode reload, all controls with the keyboard open, horizontal scorecard scrolling, swipe navigation outside controls, and result persistence after closing the app. Clearing browser data removes locally stored results. There is no cloud sync, GPS, shot-by-shot tracking, AI service, or TheGrint API integration.

Additional regression checks:

- `node tests/data.test.cjs` compares course facts, club distances and hole strategy against the original `5d1bf91` data and scans tracked text for malformed UTF-8/mojibake.
- `node tests/browser.test.cjs` uses Playwright with installed Microsoft Edge (or `BROWSER_PATH`) and a temporary localhost server under `/golf-caddie/`. Make the `playwright` package available to Node to run it. It checks all 18 holes, tracker controls, exact-count clearing, persistence, scorecard calculations, partial rounds, mobile layouts, swipe protection, unavailable storage, offline reload and updating the production service worker. It uses isolated browser contexts and does not access your saved round.

The pre-merge fixes restore arrow, degree and dash characters, use natural hazard descriptions, keep quick-choice highlights in sync with exact scores, and let selected 3+/2+ buttons clear exact counts. That release used cache `caddie-v1.1-round-results-2`; the round ID and storage key are unchanged so recorded results survive the update.


## V1.1.1 Golf Coach export and active hole
Round Summary offers **Copy for Golf Coach** for either a partial or completed round. The plain-text report includes course details, the same totals as the summary, recorded-field counts, all 18 hole rows and notes, followed by the coaching prompt. A hole counts as completed when its score is recorded; missing values remain unrecorded. Copy uses the Clipboard API. If unavailable or denied, a selectable report appears for manual copy/paste. Nothing is sent to ChatGPT automatically.

Every hole has a fixed **Round Summary** shortcut above previous/next navigation. During an incomplete round, **Back to Hole X** returns to the persisted active hole. Browsing with the page selector, scorecard, previous arrow or swipes does not by itself change the active hole. Next/forward swipe from the scored active hole advances it to the next hole. Recording a result on a later, previously unscored hole also advances it; editing earlier results does not move it backward. A new round starts at Hole 1.

Existing V1.1 results keep the same key and schema version. An added `activeHole` field records progression separately from `page`. For older saved rounds without this field, the last hole with a recorded result initializes it (or Hole 1 if empty), never the last viewed page. The V1.1.1 worker uses cache `caddie-v1.1.1-coach-export-1`.

Run `node tests/coach.test.cjs` for export and active-hole rules, alongside the existing results, data and browser suites. The browser suite now checks the corrected Course Overview data, actual clipboard copying, denied/unavailable clipboard fallback, legacy state migration, active-hole progression versus browsing, and offline use after an upgrade from V1.1.

Before merging V1.1.1 on an actual iPhone: copy a partial report into the Golf Coach project; verify manual text selection when clipboard access is unavailable; check the fixed Summary shortcut with the keyboard open; play/score Hole 8, look ahead to Hole 14, and return through Summary; advance normally to Hole 9; close and relaunch from the Home Screen, including offline.
