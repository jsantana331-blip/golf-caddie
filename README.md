# Caddie — Pocket Caddie V1.3

A mobile-first, local-first golf PWA: scorekeeper, caddie and coaching context. Static HTML/CSS/JavaScript on GitHub Pages. No backend, accounts, AI API, GPS, mapping, analytics, external font or runtime dependency. Operating cost remains $0.

## Course Library and round flow

Where are we playing? → course → tee → Course Overview → Game Plan → Start round → Hole 1.

Nevel Meade / Blue is the only production course/tee. All verified course facts, 18 holes, advice and stock yardages are preserved. The existing 50° wedge at 108 yd is retained alongside the other eleven clubs. No handicap or tendencies existed in the prior data; those remain unset rather than inferred.

The page selector and arrows browse; horizontal swipes outside controls also navigate. Content scrolls independently of the footer. Each hole has direct Summary access. Back to Hole X follows the active hole, not the last page viewed. A scored active hole advances on Next/forward swipe; entering a result on a later unscored hole also advances it. Browsing or editing earlier scores does not.

Course/tee browsing never replaces an active round. The start screen offers Resume when one exists. Starting another round requires confirmation: an incomplete scorecard is deliberately replaced; an all-scored scorecard is archived before the new round starts. Failed storage writes preserve the previous active round.

## Data architecture

- `data/player.json`: schema 1, stable player ID, profile, optional handicap, stock bag yardages, supported tendencies and existing swing cue. No invented profile or tendencies.
- `data/courses/index.json`: schema 1 course catalog with local filenames and legacy migration identifiers.
- `data/courses/nevel-meade.json`: stable course ID, permanent course facts, separate stable tee IDs, rating/slope/yardage, tee-specific holes and strategy. No duplicated player data or transient weather forecast.
- `memory.js`: pure course projection, round creation, migration, completion, snapshots and event metadata.
- `results.js`: unchanged score validation, calculations and base full-round export.
- `caddie-context.js`: pure live context and comprehensive player/round export generation.
- `handoff.js`: accessible modal sheet, clipboard/manual fallback and optional external navigation.
- `app.js`: local persistence and UI flows. `styles.css` retains the cream/green/earth Pocket Caddie system.

Add a course by adding a structured JSON file and catalog entry. Each tee supplies its complete hole yardages and supported strategy, plus total yardage, rating and slope; optional tee-specific mission/Game Plan override course-level values. The service worker discovers and precaches every catalog course automatically. Bump its cache version whenever shipping assets or course changes. Do not add unverified production course data. The browser tests synthesize a clearly labeled second course and shorter tee in their localhost server only.

## Local round memory

Storage key: `caddie:<pathname>:memory:v1.3`. One schema-3 envelope contains separate `active`, `history`, `preferences.tees` (course ID → tee ID) and `migrations` collections. One localStorage write atomically archives and clears a round; no database is introduced.

Each round uses schema 1 and a unique UUID, course/tee IDs, start time, separate course/tee and player snapshots, results, active hole, saved page, score-completion order and Ask Caddie events. History also stores completion time and front/back/total/relative-to-par/performance totals. Snapshots keep prior rounds accurate after future catalog or player edits. Player bag data is not duplicated in course records.

Scores, FIR, GIR, putts, penalties and notes save on entry. Unrecorded values remain distinct from zero/false. Par-3 tee results are N/A. Quick Score choices run from par−1 through par+3; the highest + choice reveals an exact score input, including the ability to enter any legitimate score from 1. Putts 3+ and penalties 2+ reveal exact counts. Tap a selected choice to clear it.

Complete round & save requires a score on every hole and deliberate confirmation. Other tracking fields may remain unrecorded. The stored summary is read-only and remains exportable. Round History is a simple recent-round list; no automated deletion or analytics. Exporting never deletes a round. Storage/quota errors are shown, and failed finalization does not clear the active round. Conflicting writes from another tab are rejected instead of silently replacing newer memory; reload before continuing in that case.

Local history is durable within this browser/profile, not a cloud backup. Browser data removal, device loss, private browsing or storage eviction can remove it. Storage capacity is finite; a full store reports failure rather than pruning history. V1.3 has no history deletion/editor/import UI or partial-round finalization.

## Migration

On first V1.3 launch with no new store, the known V1.1/V1.2 `caddie:<pathname>:results:v1.1:nevel-meade-blue-v1` scorecard is copied into a snapshot-based active round. Results, notes, start date, saved page and active-hole state are retained; the original key and old A/R/P keys are untouched. An all-scored migrated card still requires intentional finalization. Legacy data has no completion timestamps, so migrated recent-hole ordering initially uses course order. New entries track actual score-completion order; editing an existing score does not reorder it.

The presence of a V1.3 store prevents repeat migration, including after completion. Invalid JSON or unknown schemas are preserved without overwrite; the UI reports the issue and blocks replacing unreadable records. If storage itself is unavailable, a new in-memory round can still be used with a visible warning, but it cannot be finalized durably until storage works.

## Ask Caddie

Every active hole's result heading has the same compact Caddie intelligence control: a first-party C mark, restrained ring and three nodes, plus a small sparkle. It uses no OpenAI/ChatGPT logo or outside asset. A native modal dialog provides focus containment, a close control and Escape dismissal.

Live context is generated at copy time from the saved active hole, even while looking ahead. It includes supported hole strategy, player yardages/profile, completed-hole score/FIR/GIR/putts/penalties with recorded counts, the three most recently scored holes, and every meaningful hole note. Unfinished-hole metrics are excluded from live aggregate calculations; the normal summary retains its existing all-entered-field totals. No live-shot inputs or recommendation engine are added.

JUST COPY copies and logs one event. COPY CONTEXT & OPEN CHATGPT copies and logs before attempting the standard HTTPS handoff in both browser and installed PWA modes. An explicit Open ChatGPT link remains available if automatic launching is blocked. Only ChatGPT home is targeted; no context is sent in a URL, no automatic paste occurs, and no Project or conversation is selected. The user pastes in their existing Golf Coach conversation and describes the unpredictable live shot by text or voice.

Clipboard denial/unavailability exposes selectable context. The golfer confirms “I've copied it” after manual copying to record that handoff; the app cannot independently observe manual clipboard operations. A failed copy records no event and never changes scoring or active hole. Events contain round ID, active hole, timestamp/order, completed-hole count, score and relative-to-par at request time; no external conversation/response is collected.

## Full Golf Coach export

Copy for Golf Coach remains separate from the compact live handoff. Active and historical summaries export course/tee/rating/slope, score and recorded-field counts, front/back totals, all hole results and notes, player context/yardages, round dates/ID and Ask Caddie request count/holes. The existing coaching-analysis instruction remains the final paragraph. Clipboard failure retains the existing manual-selection fallback.

## Offline and updates

`caddie-v1.3.1-chatgpt-handoff-1` precaches the app shell, modules, player, catalog and all catalog course files. Same-origin resources retain the existing network-first/cache-fallback policy. Old Caddie caches are removed after successful installation; unrelated caches remain. Local scorecards are not in the service-worker cache. The manifest, icons and iPhone metadata are unchanged. First use needs an online load; subsequent library, scoring, history, export/context generation and normal advice work offline. The external ChatGPT conversation needs connectivity.

## Automated checks

Use Node for:

- `node tests/results.test.cjs` — scores, totals, partial par, validation and par-3 handling.
- `node tests/data.test.cjs` — complete old-to-new data preservation, original verified facts/yardages/strategy, UTF-8/mojibake.
- `node tests/coach.test.cjs` — original full export and active-hole rules.
- `node tests/memory.test.cjs` — snapshots, history/completion, multi-course/tee projection, migration, live context/recent holes/notes/player, event metadata and comprehensive export.
- `node tests/browser.test.cjs` — retained 18-hole UI regression suite, score + and low/exact entry, persistence, clipboard, summaries, navigation, contrast/touch targets/layouts, storage failure, offline reload and service-worker migration from `903da2e` with an existing scorecard.
- `node tests/v13-browser.test.cjs` — library/tee UI, protected rounds, current-hole live context, copy-before-open, popup/clipboard/PWA fallback, events, completion/quota failure, history/retrieval/export, tee preference and round isolation, offline multi-course, conflicting tabs and invalid schemas.

The two browser suites use an existing Playwright installation and Microsoft Edge, or `BROWSER_PATH`. No browser-testing package is shipped to golfers. Tests run isolated localhost contexts and never touch the user's real saved round. `REVIEW_SCREENSHOT=<path>.png` optionally captures review images. `tests/fixtures/v1-round.json` is the unchanged old data used only by regressions.

## Required actual-iPhone acceptance — do not merge yet

1. Upgrade an existing installed V1.2 PWA online with saved scores/notes. Verify migration, active hole, and original data after relaunch.
2. Select Nevel Meade → Blue → overview → Game Plan → Start. Verify one-handed controls, outdoor legibility, portrait/landscape safe areas and larger text.
3. Enter normal/+ scores, tee results, GIR, putts, penalties and notes with the keyboard open. Test vertical scrolling, arrows, swipe protection and horizontal scorecard scrolling.
4. Play/score Hole 8, look ahead to Hole 14, open Ask Caddie and Summary, and return to Hole 8. Advance normally and relaunch.
5. Test JUST COPY into the existing Golf Coach conversation. Confirm current-hole context, partial metrics, notes and yardages. Test the open-link workflow in Safari and Home Screen modes and return to Caddie without state loss.
6. Deny clipboard access or use manual copy: select text, copy, confirm, and verify one logged event. Test offline context generation; ChatGPT itself requires a connection.
7. Browse courses/tees during play; cancel replacement and resume. Complete all 18 scores, finalize, reopen History and copy the comprehensive report including Ask Caddie usage. Start a fresh round and verify the earlier round remains unchanged.
8. After successful online caching, use airplane mode to relaunch, score, view History and copy reports. Test the next online update without clearing browser storage.

Do not merge until human iPhone acceptance is complete.


## V1.3.1 — copy-first native ChatGPT handoff

Previously, installed PWAs skipped automatic opening entirely and desktop/browser mode attempted the plain homepage. Now `external-coach.js` isolates a single HTTPS destination and launch attempt: `https://chatgpt.com/#native`. It uses `window.open` with `_blank` and `noopener,noreferrer`, preserving Caddie's page. The visible fallback anchor uses the identical destination. No custom scheme, app-install detection, polling, redirect chain, Project identifier, context-in-URL or API is used.

Research checked on September 25, 2026: [ChatGPT's published Apple association file](https://chatgpt.com/.well-known/apple-app-site-association) explicitly associates `/` with fragment `native` with ChatGPT home and describes starting a new in-app conversation. This is a standard HTTPS universal link, not a guarantee of native launch from JavaScript. [Apple's universal-link documentation](https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html) explains native routing, web fallback and the influence of user preferences. [Apple TN3155](https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links) provides device-level diagnostics. `/open-app` and `/app` were intentionally avoided because the association file describes their fallback as the App Store rather than ChatGPT web. Caddie does not fetch this association file at runtime.

Sequence: generate unchanged current context → await clipboard success → save the existing event → show “✓ Context copied — opening ChatGPT” → attempt launch. JUST COPY continues to show its existing success message and never launches. Copy failure reveals the existing manual-copy flow and re-enables both actions without launching or adding an event.

iOS chooses native ChatGPT or its web experience. User preferences, app installation, and loss of transient activation during asynchronous clipboard work can prevent automatic app/tab opening. A website cannot reliably distinguish native launch from a blocked popup (with `noopener`, a null return is not proof of failure). A short timer changes only feedback if Caddie remains visible: “✓ Context copied. Open ChatGPT and paste into Golf Coach.” Returning to Caddie also clears the opening message. Neither the timer nor the return handler retries navigation, records events, or changes round/page state. Closing the sheet or beginning another copy cancels pending feedback. The real Open ChatGPT link lets the golfer retry with a direct tap. Clipboard retry hides the previous link until copy succeeds again.

All existing suites still apply. Focused browser assertions verify delayed-copy ordering, event persistence and confirmation before launch, the exact HTTPS URL, JUST COPY without navigation, installed-PWA attempts, null/throw launch fallbacks and unchanged round state. Run the browser suite with `UPGRADE_BASELINE=a587a77` to additionally verify offline upgrade from merged V1.3; its default still checks migration from V1.2.

### Exact iPhone acceptance for V1.3.1

Use an HTTPS build of this feature branch, Caddie installed to Home Screen, the ChatGPT iOS app installed, and an active test round. Do not clear browser storage.

1. Start/resume the test round. Score Hole 1, then advance to Hole 2 (or another hole beyond Hole 1).
2. Enter tee/GIR/putts/penalty results and at least one distinctive note. Note the selected course, tee, active hole, score and existing Ask request count in Copy for Golf Coach.
3. Tap Ask Caddie → COPY CONTEXT & OPEN CHATGPT.
4. Verify copy confirmation. Record whether iOS opens the native ChatGPT app, ChatGPT web, or leaves Caddie visible. If still in Caddie, use the Open ChatGPT link; it must not log a second request.
5. Select Golf Coach manually if needed and paste. Verify active hole, course/tee, current score, recent completed holes, notes, hole strategy and player yardages. Nothing should be automatically pasted or submitted.
6. Return to Caddie via the app switcher. Close the sheet if it remains open. Verify the same viewed/active hole, scores, notes and selected tee. Open Summary and copy the full report; verify the Ask request count increased by exactly one and identifies the correct hole.
7. Close/relaunch Caddie. Verify it resumes the saved round/page/current hole rather than opening Course Library.
8. Repeat with JUST COPY: it must remain in Caddie, produce fresh context and log exactly one request.
9. Repeat in Safari and with browser routing chosen for ChatGPT (or on a device without the native app) to verify the normal web fallback. Native versus web selection is controlled by iOS.
10. Test denied clipboard access where possible: no automatic navigation/event, clear feedback, manual selection and retry available, all round data retained. Test offline scoring/context copying; the external conversation itself requires connectivity.

Native-app routing and actual iPhone lifecycle behavior remain mandatory human acceptance; desktop emulation cannot certify either. Do not merge automatically.
