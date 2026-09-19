# Caddie
Personal mobile golf caddie PWA, served as static files on GitHub Pages.

## V1.1 round experience
Course Overview → Game Plan → 18 Hole Caddie pages → Round Summary.
Use the bottom selector or arrows to navigate. Swipe outside result controls to move between pages. Content scrolls independently of navigation.

Results save immediately on this device under `caddie:<pathname>:results:v1.1:<round.id>`. Old A/R/P keys are ignored and untouched. The saved page resumes on reload. Unrecorded fields stay blank rather than counting as zero; summaries show the number of recorded holes. Score-relative-to-par uses only scored holes. Par 3 tee accuracy is N/A. Putts 3+ and penalties 2+ reveal exact-count controls so totals remain accurate. Tap a selected quick choice to clear it. Start a new round from Summary only after copying the current scorecard; replacement requires confirmation. This release stores one current round, not round history.

## Current round / data
Nevel Meade — Blue tees. `data/current-round.json` holds course facts, club distances, game plan, and all 18 original strategy records plus conversational advice. Missing course facts display Unknown. Course par and par counts come from hole data. No live weather or external scoring integration is used.

When replacing the course/round data, assign a new stable `id` to prevent results from a different round being reused. Keep `holes`, `clubs`, and `gamePlan` structured. Bump the service-worker cache name whenever shipping changed assets/data.

## Offline / installation
Manifest, icons, relative URLs and Apple Home Screen metadata are preserved. The worker precaches the complete shell including data and result calculations, then activates immediately and removes only old Caddie caches. Online requests refresh cached resources; offline navigation falls back to the shell. Initial use requires a successful online load. An already-open page shows its loaded version until reopened/reloaded; no forced reload interrupts score entry.

## Checks
Run `node tests/results.test.cjs` for round totals, partial results, validation, and par-3 handling. No build step or runtime packages are needed. Serve this folder over localhost or HTTPS for service-worker checks.

Before merging, test on an iPhone: installed Home Screen launch, update from the prior installed version while online then relaunch, airplane-mode reload, all controls with the keyboard open, horizontal scorecard scrolling, swipe navigation outside controls, and result persistence after closing the app. Clearing browser data removes locally stored results. There is no cloud sync, GPS, shot-by-shot tracking, AI service, or TheGrint API integration.
