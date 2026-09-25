# Caddie — Pocket Caddie V1.3.2

A mobile-first, local-first golf PWA: scorekeeper, caddie and coaching context. Static HTML/CSS/JavaScript on GitHub Pages. No backend, accounts, AI API, GPS, mapping, analytics, external font or runtime dependency. Operating cost remains $0.

## Course Library and round flow

Home (Where are we playing?) → course → tee → Start Round → Course Overview → Game Plan → Hole 1.

Every fresh load/reload opens Home, even with an active round. Resume Round prominently identifies course, tee, active hole and relative score for scored holes, then goes directly to the saved active hole. It never restores the last viewed application screen. Backgrounding without a reload leaves the current screen intact.

Nevel Meade / Blue is the only production course/tee. All verified course facts, 18 holes, advice and stock yardages are preserved. The existing 50° wedge at 108 yd is retained alongside the other eleven clubs. No handicap or tendencies existed in the prior data; those remain unset rather than inferred.

The round selector provides named Overview, Game Plan, hole and Summary destinations without a slide counter. Arrows and horizontal swipes outside controls navigate within the round; Previous is disabled on Hole 1. Game Plan’s forward action and Summary’s back arrow return to the active hole. Home is not part of round navigation. Content scrolls independently of the footer. Each hole has direct Summary access. Back to Hole X follows the active hole, not the last page viewed. A scored active hole advances on Next/forward swipe; entering a result on a later unscored hole also advances it. Browsing or editing earlier scores does not.

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

Finish Round requires a score on every hole and deliberate confirmation. Other tracking fields may remain unrecorded. Successful finalization returns Home; the stored summary is read-only and remains exportable through Round History. Exit to Home in the active Summary saves without finishing; a failed save keeps the round screen open with a warning. Overview and Game Plan remain intentional reference destinations in the round selector. No Home/Library button occupies active hole screens. Round History is a simple recent-round list; no automated deletion or analytics. Exporting never deletes a round. Storage/quota errors are shown, and failed finalization does not clear the active round. Conflicting writes from another tab are rejected instead of silently replacing newer memory; reload before continuing in that case.

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

`caddie-v1.3.2-round-navigation-1` precaches the app shell, modules, player, catalog and all catalog course files. Same-origin resources retain the existing network-first/cache-fallback policy. Old Caddie caches are removed after successful installation; unrelated caches remain. Local scorecards are not in the service-worker cache. The manifest, icons and iPhone metadata are unchanged. First use needs an online load; subsequent library, scoring, history, export/context generation and normal advice work offline. The external ChatGPT conversation needs connectivity.

## Automated checks

Use Node for:

- `node tests/results.test.cjs` — scores, totals, partial par, validation and par-3 handling.
- `node tests/data.test.cjs` — complete old-to-new data preservation, original verified facts/yardages/strategy, UTF-8/mojibake.
- `node tests/coach.test.cjs` — original full export and active-hole rules.
- `node tests/memory.test.cjs` — snapshots, history/completion, multi-course/tee projection, migration, live context/recent holes/notes/player, event metadata and comprehensive export.
- `node tests/browser.test.cjs` — retained 18-hole UI regression suite, score + and low/exact entry, persistence, clipboard, summaries, navigation, contrast/touch targets/layouts, storage failure, offline reload and service-worker migration from `903da2e` with an existing scorecard.
- `node tests/navigation.test.cjs` — Home launch from every round view, explicit setup/start, active-hole resume, state preservation, reference navigation, failed Exit, replacement cancellation, offline finish/history/export and relaunch.
- `node tests/v13-browser.test.cjs` — library/tee UI, protected rounds, current-hole live context, copy-before-open, popup/clipboard/PWA fallback, events, completion/quota failure, history/retrieval/export, tee preference and round isolation, offline multi-course, conflicting tabs and invalid schemas.

The two browser suites use an existing Playwright installation and Microsoft Edge, or `BROWSER_PATH`. No browser-testing package is shipped to golfers. Tests run isolated localhost contexts and never touch the user's real saved round. `REVIEW_SCREENSHOT=<path>.png` optionally captures review images. `tests/fixtures/v1-round.json` is the unchanged old data used only by regressions.

## Earlier V1.3 acceptance coverage (use V1.3.2 flow below)

1. Upgrade an existing installed V1.2 PWA online with saved scores/notes. Verify migration, active hole, and original data after relaunch.
2. Select Nevel Meade → Blue → Start → overview → Game Plan → Hole 1. Verify one-handed controls, outdoor legibility, portrait/landscape safe areas and larger text.
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
7. Close/relaunch Caddie. In V1.3.2, verify Home appears, then use Resume Round to return to the saved current hole. This supersedes V1.3.1 automatic page restoration.
8. Repeat with JUST COPY: it must remain in Caddie, produce fresh context and log exactly one request.
9. Repeat in Safari and with browser routing chosen for ChatGPT (or on a device without the native app) to verify the normal web fallback. Native versus web selection is controlled by iOS.
10. Test denied clipboard access where possible: no automatic navigation/event, clear feedback, manual selection and retry available, all round data retained. Test offline scoring/context copying; the external conversation itself requires connectivity.

Native-app routing and actual iPhone lifecycle behavior remain mandatory human acceptance; desktop emulation cannot certify either. Do not merge automatically.


## V1.3.2 — Home and round lifecycle

Previously launch restored the active round's last page, setup previewed Overview/Game Plan before creation, every round screen linked back to Course Library, and finalization opened the historical summary. Now application screens (Home, tee/setup and history) sit outside round navigation. Starting establishes the round before Overview. Resume uses `activeHole`; navigation-only `page` stays in the existing record for compatibility but is never the launch/resume destination. The existing selector is retained for intentional references and hole browsing; its X/21 counter is removed. Hole 18 leads to Summary without finalizing. Finish validates and atomically archives before returning Home. Exit only saves and returns Home.

No storage key/schema change or new migration is required. V1.3 snapshots, IDs, timestamps, results, notes, events, preferences and history remain intact. Existing V1.1/V1.2 migration still runs, followed by Home and explicit Resume. No changes to course/player data, scoring rules, Ask Caddie modules/context/visuals/launching, comprehensive export, or the history model. CSS changes only retarget the existing bottom-action spacing to Exit to Home. No new infrastructure/dependencies/costs.

Validation: all seven suites above pass, plus syntax and UTF-8/data checks and `git diff --check`. The browser upgrade test passes from both original V1.2 (`903da2e`, default) and latest merged V1.3.1 (`UPGRADE_BASELINE=759dc0f`). Desktop Edge mobile emulation covers offline lifecycle, touch targets, scroll, safe-area padding simulations and clipboard behavior; it does not certify actual iOS app routing or lifecycle.

### Exact installed-iPhone acceptance for V1.3.2 — required before merge

Use an HTTPS build of the feature branch installed to Home Screen. The main Pages URL will still serve the previous release until merge. Use a test round/profile; do not clear real saved rounds. For the clean-start case, use a profile without an active round or intentionally finish an existing test round.

1. Launch Caddie with no active round.
2. Verify Home / Where are we playing? appears first and Start Round/course selection is clear.
3. Select Nevel Meade.
4. Select Blue.
5. Tap Start Round.
6. Verify Course Overview, Blue yardage/rating/slope and unchanged course facts.
7. Continue to Game Plan.
8. Continue to Hole 1.
9. Verify no Course Library or persistent Home control appears on the hole.
10. Verify no X/21 counter; check one-handed arrows, dropdown and scrolling in portrait/landscape with safe areas.
11. Record Hole 1 score 5, tee Fairway, GIR No, putts 2 and penalties 0.
12. Advance to Hole 2.
13. Record Hole 2 score 5, tee Left, GIR No, putts 2 and penalties 0.
14. Advance to Hole 3.
15. Record Hole 3 score 5, tee Fairway, GIR Yes, putts 2, penalties 0 and note “Navigation test H3”.
16. Open Round Summary; expect 15 strokes, +2 over the first three holes, 2/3 FIR, 1 GIR, 6 putts and 0 penalties.
17. Tap Back to Hole 3.
18. Verify entries; use the selector to reference Overview and Game Plan, then Go to Hole 3. Look ahead at Hole 14 without entering results and return through Summary to Hole 3.
19. Open Summary and tap Exit to Home.
20. Verify prominent Resume Round.
21. Verify Nevel Meade, Blue, Hole 3 and +2.
22. Close Caddie completely.
23. Relaunch from Home Screen.
24. Verify Home appears first.
25. Verify Resume Round remains available.
26. Tap Resume Round.
27. Verify direct return to Hole 3, bypassing Overview/Game Plan.
28. Verify all results and the H3 note remain.
29. Use Ask Caddie / JUST COPY and verify fresh Hole 3 context, score, notes and clubs. Then test COPY CONTEXT & OPEN CHATGPT with the native app installed; paste in Golf Coach manually.
30. Return to Caddie and verify state and Ask count. If iOS reloaded it, expect Home and use Resume; if merely backgrounded, expect the existing screen/sheet.
31. Exit through Summary to Home, select Nevel Meade / Blue and Start New Round.
32. Cancel the replacement confirmation; verify the original round survives.
33. Resume the original Hole 3 round.
34. After an online load, enable airplane mode; relaunch to Home, Resume and enter all remaining hole scores (par is convenient). Test previous/next/swipes, normal/+ score entry and notes with the keyboard visible.
35. Advance from Hole 18 to Summary; verify the round is still active and totals/notes/export are reviewable.
36. Tap Finish Round and confirm. Optional tracking fields may remain blank; missing scores must prevent finishing.
37. Verify Home appears and Resume Round disappears only after successful saving.
38. Open Round History; verify the completed round remains after offline reload.
39. Open that round; verify all 18 results, H3 note and Ask events remain represented.
40. Copy for Golf Coach; verify comprehensive results, notes, Ask count/holes and final coaching instruction. Return Home and verify starting another round leaves history intact.

Do not merge until human iPhone acceptance is complete. Local storage remains device/browser-local, and finalization still requires all holes scored; neither behavior changes in this release.
