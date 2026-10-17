# V1.4.1 — Pocket Caddie visual refinement

Built from main `d8b8664`. This changes presentation only. Course/player JSON, scoring, memory, context generation, ChatGPT handoff, exports, Finish Round and round replacement behavior are retained. The current application has no standalone Cancel Round action; this release does not add one. Finish still requires all scores.

The hole selector is the single visible primary identifier; the heading remains available to assistive technology. A preview status appears when viewing another hole. Navigation does not edit results or change the playing hole by itself. Ask Caddie explicitly identifies the playing hole when previewing, and still hands off to ChatGPT. Record Score edits the viewed hole under the existing progression rules.

The original advice supplies the main recommendation. Hole 18 has an explicitly edited three-sentence presentation retaining the approach and 3H warning. Original plan/advice/hazard/expected approach fields stay intact in course data, round snapshots, Ask context and exports. Repetitive Avoid/Leaves and Full Hole Plan UI are removed. No fields are concatenated into a generated recommendation.

## Review images

Desktop Edge mobile emulation (390 × 844), not physical iPhone captures. Before/after Home, Hole, Score and Summary use the same isolated fixture: Nevel Meade Blue, playing Hole 3, three scores of 5, two putts each, zero penalties and a note. Other captures show supporting screens with regression-test fixtures; fixture-only courses are not production additions.

| Screen | Before | After |
| --- | --- | --- |
| Home | [Before](screenshots/before-home.png) | [After](screenshots/after-home.png) |
| Active Hole | [Before](screenshots/before-hole.png) | [After](screenshots/after-hole.png) |
| Score Entry | [Before](screenshots/before-score.png) | [After](screenshots/after-score.png) |
| Round Summary | [Before](screenshots/before-summary.png) | [After](screenshots/after-summary.png) |

Additional screens: [Course Overview](screenshots/after-course.png), [Game Plan](screenshots/after-game.png), [Course selection](screenshots/additional-library.png), [Ask Caddie](screenshots/additional-ask.png), [Rounds](screenshots/additional-history.png).

## Exact iPhone acceptance steps — before merge

Use an HTTPS preview of this branch in Safari and installed to the Home Screen. Main GitHub Pages continues to serve main until merge. Use a test profile/round; do not clear real saved rounds. Desktop tests cannot certify iOS routing, safe areas or the physical keyboard.

1. Launch Home; select Nevel Meade → Blue → Start Round. Verify unchanged course facts, then Game Plan → Hole 1. Check the aligned white surfaces and charcoal text on each screen.
2. Verify one visible primary hole identifier (the selector), 374 yd, Par 4 / HCP 12, Driver and Left-center. Read the concise recommendation; there should be no repeated Avoid/Leaves or Full Hole Plan block.
3. Open the selector and preview Hole 14. Verify “Preview · playing Hole 1” and that Ask Caddie identifies playing Hole 1. Open Ask Caddie → JUST COPY and paste into a scratch note: context must identify active Hole 1. Close the sheet. Verify no scores or playing-hole progression changed from previewing.
4. Return to Hole 1. Record score 5, Fairway, GIR No, putts 2, penalties 0 and note “V1.4.1 H1”. Done, reopen, and verify all fields. Test clearing a selected value, 7+ then exact score 12, and invalid 0/decimal entry; restore score 5. Invalid input must not replace the last valid result.
5. Next to Hole 2. Record score 5, Fairway, GIR No, putts 2, penalties 0. Next to Hole 3 and enter the same values plus note “V1.4.1 H3”. Preview Hole 18; verify three recommendation sentences retain the ~175-yard approach, conditional attack and 3H bunker warning. Previewing must preserve playing Hole 3 and all entries.
6. Tap Play; verify return to Hole 3. Visit Home and Rounds, then Play again. Open Summary: expect 15 strokes, +2, 3/3 fairways, 0 GIR, 6 putts and 0 penalties. Copy for Golf Coach and verify notes, results and Ask event count.
7. On Hole 3, Ask Caddie → COPY CONTEXT & OPEN CHATGPT. Verify copied context before handoff. Paste manually into Golf Coach; confirm course, tee, active hole, original strategy and clubs. Return to Caddie and verify exactly one new request event. If automatic opening fails, test the direct Open ChatGPT link. Also check JUST COPY without navigation.
8. Check portrait and landscape on a compact iPhone and a notched iPhone: readable selector and metadata; Ask Caddie and Record Score readily accessible; no sideways page overflow; Home/Play/Rounds above the home indicator with no excess tab padding. Test large system text/page zoom and scroll when necessary.
9. Open Score Entry and type a long note with the keyboard shown. Scroll fields, reach Done, dismiss via Close and verify saved text. Check no controls are obscured by keyboard or safe areas. Open Ask and the round menu in landscape; verify scrolling and dismissal.
10. Background and return, then fully close/relaunch. A reload opens Home; Resume returns to the playing hole with all results, notes and requests preserved. Use the round menu for Course Overview/Game Plan and return to the current hole.
11. After an online load, enable airplane mode, relaunch, Resume, record/edit results and copy Golf Coach context. Verify the full cached shell and course load offline. External ChatGPT requires connectivity.
12. Try Finish Round with missing scores: it must refuse. Start a new round from Home and cancel the replacement confirmation: the original round must survive. These existing behaviors must be unchanged.
13. Complete remaining holes with par scores, then Summary → Finish Round → confirm. Verify Home, no Resume for that completed round, and the saved round under Rounds. Relaunch offline, open its read-only summary and export; verify all scores, notes and Ask requests. Start another test round and confirm history remains.

Do not merge automatically. Human visual/device acceptance and explicit approval of the specific PR remain required.

## Automated validation

All eight repository suites passed: results, data, coach, memory, browser, navigation, v13-browser and v14-browser. The browser suite also passed a second run with `UPGRADE_BASELINE=d8b8664` to check offline upgrade from current main; the default run checks the older V1.2 migration. Coverage includes all 18 holes, precise/invalid scores, missing versus zero/false, notes, par-3 rules, partial totals, persistence/relaunch, readonly history, Golf Coach exports, Ask copy/open/fallback and event counts, conflicting tabs, corrupt data, quota failure, offline shell/data and mobile/landscape layouts. Syntax and `git diff --check` pass. The rotation test exposed an Ask sheet height issue; both layout and keyboard viewport limits now apply, and the suite passes.

The full diff was inspected: no production data, scoring, memory, context or handoff module changes; no dependencies/services added. The service worker cache version is advanced for the updated assets. Regression expectations change only for intentional presentation/copy and the cache version. Physical iPhone visual/keyboard/safe-area testing and native ChatGPT routing remain outstanding. No merge has been performed.

Reproduce with an available Playwright installation and Edge: run each `node tests/<suite>.test.cjs` listed in the main README. For paired captures, run `tests/v14-browser.test.cjs` with `REVIEW_SCREENSHOT=review/screenshots/before.png` and `CAPTURE_BASELINE=d8b8664`; unset the baseline and use `REVIEW_SCREENSHOT=review/screenshots/after.png`. The baseline capture path now supports V1.4 scoring sheets as well as earlier inline scoring.
