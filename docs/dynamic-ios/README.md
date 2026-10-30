# Dynamic iOS visual system — V1.5 addendum

This extends the deployed V1.5 and all-18 Long Run sketch work. No scoring, persistence, course, recommendation, layout data, or handoff model changes.

## Three environments

- **Clubhouse:** warm light canvas, editorial serif headline, numbered course-library rows, and a prominent Resume action when a round exists. Course selection stays directly on Home; there is no duplicate library navigation. No course photographs were added because no approved photography assets were supplied.
- **Caddie:** forest hole header with light metadata, large club/target, an open advice column, integrated diagram, dark conversational handoff entry, and separate white Record Score action. Course Overview uses a fact strip; Game Plan uses an emphasized mission followed by compact briefing rows.
- **Journal:** white canvas, ink divider, prominent strokes/relative score, explicit Complete/Partial badges, ruled history entries, scorecard table, and compact performance metrics. Active Summary retains its Play tab selection because the round is still in progress.

## Tokens and reusable treatments

`styles.css` defines environment canvases, forest/on-forest text, muted text, accent, and sheet radius. Native system typography handles operational content; Georgia provides the Clubhouse editorial headline without remote fonts.

| Content | Treatment |
| --- | --- |
| Recommendation | `.recommendation`: club, target, single strategy column with narrow accent rule |
| Hole layout | `.hole-layout`: integrated muted-ground illustration with honest source/precision caption |
| Important hazard | Existing verified hazard remains inside conversational strategy (Long Run 9/18); no duplicate hazard card or invented warning |
| Course facts | `.course-primary`, `.course-secondary`, `.course-facts`: metric strip and reference rows |
| Scoring summary | `.round-totals`, `.totals`: ruled score strip, large primary numbers |
| Conversation entry | `.ask-control`, `#ask-sheet`: distinct forest entry and context handoff sheet; no simulated conversation |
| Round milestones | Existing holes-scored counter and Complete/Partial status are emphasized; no fabricated achievement feed |
| History | `.history-entry`, `.round-badge`: ruled scorecard rows, text labels independent of color |

Sheets have a shared grabber affordance, bounded scrolling, grouped score choices, and an explicit Done action. The grabber is visual only; no unimplemented drag gesture is promised. Bottom tabs retain fixed placement, 44px+ controls, safe-area support, and visible selected backgrounds. Press feedback respects reduced motion. Native dialogs retain focus containment and existing focus restoration.

## Visual review

[Before/after contact sheet](screenshots/comparison.png). All captures are actual app renders in isolated desktop Edge at 390×844, not physical iPhone tests. The baseline is deployed main `aba1cac`.

| View | Before | After |
| --- | --- | --- |
| Home / Course Library (one destination) | [Before](screenshots/before-home.png) | [After](screenshots/after-home.png) |
| Tee selection | [Before](screenshots/before-tee-selection.png) | [After](screenshots/after-tee-selection.png) |
| Course Overview | [Before](screenshots/before-course-overview.png) | [After](screenshots/after-course-overview.png) |
| Game Plan | [Before](screenshots/before-game-plan.png) | [After](screenshots/after-game-plan.png) |
| Active Hole | [Before](screenshots/before-active-hole.png) | [After](screenshots/after-active-hole.png) |
| Hole Layout | [Before](screenshots/before-hole-layout.png) | [After](screenshots/after-hole-layout.png) |
| Ask Caddie | [Before](screenshots/before-ask-caddie.png) | [After](screenshots/after-ask-caddie.png) |
| Score Entry | [Before](screenshots/before-score-entry.png) | [After](screenshots/after-score-entry.png) |
| Round Summary | [Before](screenshots/before-round-summary.png) | [After](screenshots/after-round-summary.png) |
| Round History | [Before](screenshots/before-round-history.png) | [After](screenshots/after-round-history.png) |

Inspected the full set together: different compositions identify destination, advice is not a card stack, diagrams stay between advice and actions, sheets remain distinct from the main canvas, and historical results read as a journal. Empty history naturally has unused space rather than invented filler.

## Validation and pilot steps

Run the existing twelve suites plus `tests/dynamic-ios-browser.test.cjs` using the bundled Node runtime and Playwright/Edge. The new suite captures both versions, checks environment identity, partial status, five viewport action access (320×568, 375×667, 390×844, 430×932, 844×390), hole sheet access, reduced-motion preference, and page errors. Existing suites cover course totals/tees, 18-hole play, scoring, persistence, resume, partial Finish, cancellation, history isolation, clipboard/handoff/event logging, Golf Coach export, and offline PWA upgrade.

Post-merge pilot guide (not a publication or merge gate):

1. Open the deployed app online once, close/reopen; Home should launch with the Clubhouse headline.
2. Resume an existing round; confirm prior scores/notes, forest hole header, club/target, diagram, Ask Caddie and Record Score.
3. Switch Home → Rounds → Play; verify the round and playing hole survive. Preview another hole, then return to the current hole.
4. Open Ask Caddie; copy context and return from ChatGPT. Verify active-hole context and saved scores are retained.
5. Enter score, putts, penalties and a note. Test the keyboard and Done at the smallest device text/zoom settings you use.
6. Review Summary and Golf Coach export; finish a partial round. Verify blank holes stay blank and Journal says Partial. Check a prior complete round still says Complete.
7. Start another round, cancel its confirmation once, then confirm cancellation; prior historical rounds must remain.
8. After online load, use airplane mode to reopen, resume, switch holes and record a score. Reopen again and verify it persists.

No physical device testing is claimed. Light appearance is the release target. Hole sketches remain approximate, not surveyed geography; no new geography is introduced here. No dependencies, AI API, backend, remote assets or operating costs were added. The service-worker cache version changes without changing storage keys/schema or clearing local rounds.

### Recorded results

All 13 suites passed: `results`, `data`, `coach`, `memory`, `v15-data`, `hole-sketches`, `browser`, `navigation`, `v13-browser`, `v14-browser`, `v15-browser`, `hole-sketches-browser`, `dynamic-ios-browser`. The full browser suite also passed with `UPGRADE_BASELINE=aba1cac` (currently deployed main), in addition to its legacy baseline. No page errors were observed. JavaScript syntax and `git diff --check` passed.

Contrast calculations for the new normal-text pairings: white/forest 12.10:1; muted light/forest 8.16:1; body/Play canvas 13.11:1; muted/Clubhouse canvas 5.52:1; Partial badge 5.90:1; Complete badge 7.67:1; course index 4.82:1. Disabled controls remain visibly subdued.

Final review found no blockers. Runtime changes are limited to presentation markup, CSS, and the service-worker cache name. Round lifecycle, storage keys/schema, scoring, course/player data, and Ask handoff code are unchanged. Physical Safari/PWA status-bar and keyboard behavior remain pilot validation items, not merge gates.
