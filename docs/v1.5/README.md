# Caddie V1.5 — release review

Update: [the later all-18-hole integration](../long-run-hole-sketches/README.md) adds labeled, approximate Long Run sketches to the live app code. The zero-illustration statements below document V1.5 as originally delivered, not the newer integration.

Branch: `feature/v1.5-long-run-ios-redesign`

Base: main `85e3710` (latest main inspected before implementation)

Delivery: PR against main, **do not merge**.

## Delivered experience

- Long Run in the same course/tee/setup/Overview/Game Plan/18-hole flow as Nevel Meade. No course-specific UI or scoring logic.
- Four playable Long Run tees: Blue, White, Yellow and Red. The official card also verifies Orange, but its inconsistent totals are explained and selection is disabled at both UI and data-projection layers.
- One visible primary hole identifier opens an accessible, two-nine selector sheet. The grid shows recorded scores and the actual playing hole. Previous/next remain; no form-style dropdown, duplicate heading or page count. Previewing saves only view state, not results/progression; scoring still follows existing progression rules.
- A compact active-hole hierarchy: club, target, conversational advice, layout/unavailable state, integrated Ask Caddie and Record Score. The consolidated stylesheet removes stacked recommendation cards and repeated override layers, uses neutral text/surfaces and restrained forest-green accents, and keeps Home/Play/Rounds compact above safe areas. A fixed app root keeps focus changes from scrolling the whole PWA; content and sheets own scrolling.
- Familiar score-entry fields in an immediately saving bottom sheet, with 48px scoring choices, exact-value controls, notes and a persistent Done footer. Layout, keyboard viewport sizing, reduced motion and focus behavior are retained.
- Summary emphasizes strokes, relative score, holes scored and the detailed scorecard before supporting statistics. History and saved summaries clearly distinguish partial rounds. Finish & Save accepts incomplete rounds, preserves blanks and atomically archives. Confirmed Cancel Round removes only the active scorecard; Exit saves and returns Home.
- Ask Caddie remains a clipboard/ChatGPT handoff with live round/player context and event logging. No embedded AI is implied or added. Source-supported safest-miss information is included in live context for the new course.

### Lifecycle discrepancy resolved

The release brief described partial finishing and Cancel Round as existing behavior. Latest main actually required 18 scores and had no cancel action. This PR implements those requested capabilities explicitly, rather than pretending they already existed. The score calculations in `results.js` are unchanged. New `status: partial|complete` metadata is additive; old full histories without status still validate, and the storage key/schema are unchanged. Historical snapshots, player data and Nevel Meade data remain intact.

Very old application versions do not understand saved partial histories and will refuse to read them rather than overwrite them. Use V1.5 after creating partial history; downgrading is not supported. Local data remains device/browser-local.

## Long Run source and tee validation

See [full source reconciliation](long-run-verification.md), verified 2026-10-29. The municipal score side is the sole scorecard version used; summary pages and third-party records are not mixed into it.

| Tee | Out | In | Total | Result |
| --- | ---: | ---: | ---: | --- |
| Blue | 3,344 | 3,509 | 6,853 | 18 holes / par 72 / Men 72.3, slope 128 |
| White | 3,213 | 3,366 | 6,579 | 18 holes / par 72 / Men 70.9, slope 124 |
| Yellow | 2,860 | 2,944 | 5,804 | 18 holes / par 72 / Men 67.3/117; Women 73.0/123 |
| Red | 2,678 | 2,670 | 5,348 | 18 holes / par 72 / Men 65.2/107; Women 70.2/122 |
| Orange | 1,927 | 1,948 printed (1,898 summed) | 3,875 printed (3,825 summed) | Disabled pending clarification; rating/slope not printed |

All 90 printed hole yardages, both handicap rows and the par row are transcribed and tested. All four playable tee totals reconcile. Orange has no guessed correction. No Gray/Teal/combo tees are added. Unknown hazards are explicitly unverified, and arithmetic planning is based on the selected tee and the existing stock bag.

## Hole visuals and rights

The reusable component, styling, evidence/rights guards, tee-specific lookup, target-source guard and offline loading are delivered. **Production coverage is 0/18 Long Run and 0/18 Nevel Meade.** No hole geography or target coordinates are fabricated. The copyrighted municipal illustration is referenced, not redistributed or traced. Missing geometry displays one compact line and never prevents scoring. Optional data failures/timeouts also fall back safely.

A separate, explicitly synthetic test fixture verifies silhouettes, tee/terrain rendering, responsive presentation and offline caching. Its [test-only screenshot](screenshots/long-run-synthetic-layout-test-only.png) demonstrates the renderer, **not Long Run geography**. No synthetic geometry is in production assets. See [the layout data contract](hole-layouts.md) before adding verified licensed entries.

## Screenshots

Desktop Edge mobile emulation at 390 × 844; no physical iPhone testing was performed. Before/after pairs use the same isolated Nevel Meade fixture: playing Hole 3, three scores of 5, two putts per hole, zero penalties and an H3 note. Course expansion is the intentional difference on Home. Long Run captures use separate test rounds; no real user data is touched.

| Screen | Before V1.5 | V1.5 |
| --- | --- | --- |
| Home | [Before](screenshots/before-home.png) | [After](screenshots/after-home.png) |
| Active hole | [Before](screenshots/before-hole.png) | [After](screenshots/after-hole.png) |
| Score entry | [Before](screenshots/before-score.png) | [After](screenshots/after-score.png) |
| Summary | [Before](screenshots/before-summary.png) | [After](screenshots/after-summary.png) |

Long Run: [course library](screenshots/long-run-home.png), [tee selection](screenshots/long-run-tees.png), [Overview](screenshots/long-run-overview.png), [Game Plan](screenshots/long-run-game.png), [active hole](screenshots/long-run-hole.png), [hole selector](screenshots/long-run-picker.png), [score entry](screenshots/long-run-score.png), [partial summary](screenshots/long-run-partial-summary.png), [Rounds](screenshots/long-run-history.png).

## Files changed

- `data/courses/index.json`, `data/courses/long-run.json`: catalog expansion and versioned primary-source data.
- `strategy.js`: stock-distance planning projected at round creation; existing course recommendations unchanged.
- `hole-layout.js`, `data/layouts/index.json`: pure SVG renderer, source/rights checks and explicit empty production coverage.
- `app.js`, `styles.css`: native-feeling selector, compact interface, score/history presentation and confirmed lifecycle actions. Geometry fetch is optional with a two-second deadline.
- `memory.js`, `caddie-context.js`: protected partial history, active-only cancellation and explicit partial export/safest-miss context. Existing results, notes, snapshots and events retained.
- `index.html`, `service-worker.js`: load/cache local new modules, course and geometry manifest; cache `caddie-v1.5-long-run-ios-1`.
- `tests/v15-data.test.cjs`, `tests/v15-browser.test.cjs`: source/geometry/lifecycle and complete multi-tee coverage.
- Existing `browser`, `memory`, `navigation`, `ui-helpers`, `v13-browser` and `v14-browser` test files: public-control expectations updated for the picker, expanded library, partial-finish confirmation and cache version; earlier regressions retained.
- `README.md`, `docs/v1.4-acceptance.md`, `review/README.md`: current behavior and historical-checklist notices.
- This directory: source documentation, component contract, release report and screenshots.

Unchanged: Nevel Meade JSON, player JSON, scoring rules/calculations, external handoff and clipboard modules, manifest and icons. No dependency, backend, authentication, GPS, analytics or paid service is added. Operating cost remains $0 on GitHub Pages.

## Validation

All ten suites passed on 2026-10-29, covering the retained regressions and new behavior:

```
node tests/results.test.cjs
node tests/data.test.cjs
node tests/coach.test.cjs
node tests/memory.test.cjs
node tests/v15-data.test.cjs
node tests/browser.test.cjs
node tests/navigation.test.cjs
node tests/v13-browser.test.cjs
node tests/v14-browser.test.cjs
node tests/v15-browser.test.cjs
```

The full browser suite additionally runs with `UPGRADE_BASELINE=85e3710` to exercise upgrade from the actual main base; its default `903da2e` verifies the older V1.2 migration. Checks include unrelated-cache preservation, offline relaunch, existing results retention, blocked storage, quota/conflicting-tab failures, invalid schemas, all Nevel Meade fields, all 18 Long Run holes on each playable tee, actual tee routing, complete and partial archive/export, confirmed cancellation without history loss, and Ask copy/open/manual fallback/event counts. New renderer fixtures verify offline assets and missing/invalid/unlicensed geometry fallback. Unit tests guard against invented per-hole directional targets in generic strategies.

Responsive checks cover 320×568, 375×667, 390×844, 430×932, landscape 844×390, a reduced keyboard-height viewport, large root text, focus restoration, 44px-or-larger navigation targets, 48px scoring choices, no sideways document overflow, safe-area padding simulations and reduced motion. Pixel contrast checks retain the existing minimum 4.5:1 for small text palette pairs. Syntax, UTF-8/data integrity and whitespace checks are also run.

Screenshots can be regenerated with `REVIEW_SCREENSHOT=docs/v1.5/screenshots/after.png` on the V1.4 browser suite and `REVIEW_SCREENSHOT=docs/v1.5/screenshots/long-run.png` on the V1.5 browser suite. For the before pair, use `CAPTURE_BASELINE=85e3710` on the V1.4 suite. Playwright and Edge are development tools already present on the host, not shipped dependencies.

## Exact iPhone pilot steps

These steps are post-merge pilot validation, not a barrier to PR publication/review. This particular PR remains unmerged because the owner explicitly requested **DO NOT MERGE**. For pre-merge viewing, use an HTTPS preview serving this branch; main GitHub Pages will continue to show main until a later authorized merge. Use an isolated test profile/round; do not clear real browser storage.

1. Launch Safari/Home Screen Caddie. Verify Home first, Home/Play/Rounds above the home indicator and a resumable active round when one exists. Select Long Run; verify the address/source documentation against the municipal scorecard.
2. Verify Blue, White, Yellow and Red selectable; Orange must show its arithmetic issue and remain unavailable. Check explicit Men/Women rating labels. Do not interpret missing Orange ratings as zero.
3. Start Blue. Verify Overview total 6,853 / par 72 / Men 72.3/128, then Game Plan. Go to Hole 1: 425 yd, par 4, HCP 5, Driver and a practical estimated approach. Check concise guidance and the small unavailable-layout line. No invented fairway map should appear.
4. Tap the hole heading. Verify the 18-hole grid, front/back groups, selected state, playing dot and recorded-score placeholders. Preview Hole 14, then close/reopen the sheet. Playing Hole 1 and results must not change from browsing.
5. While previewing, open Ask Caddie → JUST COPY. Paste into a scratch note: current context must be Blue Hole 1, 425 yd, with current scores, notes, stock clubs and supported strategy. Return without changing results.
6. Return to Hole 1 and Record Score: 5, Fairway, GIR No, putts 2, penalties 0, note “Long Run V1.5 H1”. Verify immediate saving, Done, Close and reopen. Test 7+ → 12, invalid 0/decimal input, clearing a choice, then restore 5. Invalid values must not overwrite the valid result.
7. Next to Hole 2, record 6 with two putts; Next to Hole 3. Open Summary: 11 strokes, +2 for two scored holes, with unscored holes blank. Return to the active hole. Switch Home → Rounds → Play and verify the active hole, results and notes survive.
8. Check #9 range-left and #18 range-right warnings against current local rules. Other holes must not assert unverified bunker/water/dogleg coordinates. Open a par 3 and verify tee results N/A.
9. Test portrait, landscape, a compact and a notched iPhone, large text/page zoom, selector scrolling, scorecard horizontal scrolling, reduced motion and one-handed taps. Open Score Entry with the keyboard shown; scroll to notes and Done, dismiss/reopen and verify saved text. Ensure the whole app does not drift outside the viewport after repeated sheets/navigation.
10. Ask Caddie → COPY CONTEXT & OPEN CHATGPT. Verify copy confirmation, paste manually into Golf Coach and confirm playing hole/course/tee and original context. Return and check exactly one new Ask event in export. If opening fails, use the explicit Open ChatGPT link; clipboard denial must retain manual-copy fallback and round state. No in-app AI answer should be presented.
11. Exit to Home, fully close/relaunch, Resume. Home remains the launch destination; Resume returns to the playing hole, not a preview. From the round menu open Overview and Game Plan, then return to Play.
12. After an online load, enable airplane mode. Relaunch, Resume, browse all holes, edit results and copy context/export. The unavailable-layout state must remain compact and gameplay usable. External ChatGPT still needs connectivity.
13. In Summary, Finish & Save and cancel the confirmation once. Then confirm saving the two-hole partial round. Home should appear only after success. Open Rounds: expect “Partial · 2/18”; open it read-only, verify 11 strokes / +2, original notes/events and all 16 unscored holes blank. Export must say “Finished — Partial”. Relaunch offline and verify the same saved record.
14. Start another Long Run round. Record one hole, open Summary → Cancel Round. Dismiss once and verify the active round survives; confirm next time and verify only that active round disappears. All previous complete/partial histories must remain. Exit to Home must never cancel or finalize.
15. Repeat tee setup with White, Yellow and Red. Spot-check Hole 1 (418 / 368 / 354) and the displayed tee totals. Finish an all-par 18-hole test round: expect 72/E and complete status. Start/resume Nevel Meade and verify its original Blue 6,253-yard data, recommendations, history and export remain intact.

## Review and remaining limits

No physical iPhone test is claimed. Native ChatGPT routing, actual device keyboard/safe areas, haptics and outdoor legibility are observed during pilot use. Dark mode, GPS, embedded AI and geometry acquisition are outside the implemented scope. No heavy animation or haptic library is added.

Before any future merge, review the explicit source-limited outcomes: **Orange disabled** and **no production hole illustrations**. Enabling Orange needs course clarification; enabling diagrams needs verified reusable geometry/rights. Neither is solved by inventing data or by assuming municipal publication grants illustration rights. The PR is intentionally left open for owner review, with no automatic merge configured.
