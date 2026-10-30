# Cohesive Caddie theme and responsive Play

The prior release distinguished destinations through separate color and typography treatments, making Home and Play feel unrelated. This refinement uses one system-font hierarchy, one light canvas, shared forest actions, and consistent spacing. Destinations differ through composition: a welcoming course list on Home, a contextual forest navigation header in Play, and ruled scorecard results in Rounds. The conversational recommendation and ChatGPT handoff remain the center of the Caddie identity.

## Research and interpretation

Reviewed October 30, 2026. These are primary-source design references, not evidence that a specific styling choice causes commercial success. No third-party app artwork or code is copied.

| Reference | Evidence | Application to Caddie |
| --- | --- | --- |
| [Apple: Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views) | Predictable scrolling and separation between controls and content | One main scroll container; pinned header with an opaque, legible edge |
| [Apple: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | Tabs identify stable app destinations rather than content actions | Keep Home / Play / Rounds fixed and predictable; contextual controls stay in Play |
| [Apple: Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) | Tools act on current content and orient the user | Keep hole picker, previous/next, Summary and round menu available while scrolling |
| [Apple: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | Motion guidance for interface feedback | Short, optional state transitions; reduced-motion users get immediate changes |
| [Arccos: App](https://www.arccosgolf.com/pages/arccos-app) | Club distances, shot strategy and a journal of actual rounds are primary features | Emphasize the next-shot decision and real saved progress; no invented insights or live AI |
| [Golfshot: Scoring and statistics](https://golfshot.com/golf-scorecard-app) | Quick digital scoring and historical progress | Keep score entry close to the hole view and distinguish recorded progress from hole previews |

The shared conversational theme is our design interpretation of those principles. It uses Caddie's existing identity, not a replica of another app. GPS, subscriptions, tracking hardware and embedded AI remain outside scope.

## Interaction changes

- **Pinned, compacting hole header:** remains visible while advice and diagrams scroll. Above 64px of content scroll it tightens; it expands near the top (below 12px). Separate thresholds prevent boundary jitter. It never hides the picker, navigation, yardage, Summary or menu. Short viewports start with tighter spacing so scoring stays reachable.
- **Real progress:** Home resume and the Play header show scored-hole count, relative score and recorded strokes with a semantic progress element. These derive from existing `RoundResults.stats`, not viewed-hole position. Previewing Hole 18 does not imply the golfer has completed 18 holes. Nothing new is stored in snapshots.
- **Focused layout sheet:** Expand layout opens the same source-reviewed geometry at a larger width, with its approximate/not-to-scale caption intact. Escape or Close restores focus. Layouts without data have no expansion control. No new geography or target is generated.
- **Motion:** header padding/type and progress changes use small CSS transitions only when reduced motion is not requested. No looping or decorative animation and no animation library.

The existing score sheet, partial Finish, Exit, Cancel, Ask Caddie handoff, local memory, history and exports are preserved. The cache version is `caddie-v1.5.3-cohesive-play-1`; storage keys and schema are unchanged. No API, backend, remote assets, dependencies or operating costs added.

## Mobile visual review

[Before/after contact sheet](screenshots/comparison.png). Baseline: deployed main `6f6f94e`. Captures use actual app renders in isolated Edge at 390×844; the pinned/compact example uses 320×700. Home and Course Library remain one destination.

| View | Before | After |
| --- | --- | --- |
| Home with active round | [Before](screenshots/before-home-resume.png) | [After](screenshots/after-home-resume.png) |
| Home / library without a round | [Before](screenshots/before-home.png) | [After](screenshots/after-home.png) |
| Tee selection | [Before](screenshots/before-tee-selection.png) | [After](screenshots/after-tee-selection.png) |
| Overview | [Before](screenshots/before-course-overview.png) | [After](screenshots/after-course-overview.png) |
| Game Plan | [Before](screenshots/before-game-plan.png) | [After](screenshots/after-game-plan.png) |
| Active hole | [Before](screenshots/before-active-hole.png) | [After](screenshots/after-active-hole.png) |
| Hole layout | [Before](screenshots/before-hole-layout.png) | [After](screenshots/after-hole-layout.png) |
| Ask Caddie | [Before](screenshots/before-ask-caddie.png) | [After](screenshots/after-ask-caddie.png) |
| Score entry | [Before](screenshots/before-score-entry.png) | [After](screenshots/after-score-entry.png) |
| Summary | [Before](screenshots/before-round-summary.png) | [After](screenshots/after-round-summary.png) |
| History | [Before](screenshots/before-round-history.png) | [After](screenshots/after-round-history.png) |

New states: [pinned compact header](screenshots/after-collapsed-header.png), [focused layout](screenshots/after-expanded-layout.png).

Reviewed all screens together. Removed the separate cream/serif Home identity; retained the successful forest Play emphasis. Reworked a letterboxed layout-sheet first pass and tightened the short-screen header after a regression caught Record Score sitting too low. Existing historical screenshots elsewhere in the repo are retained as release evidence.

## Validation

All 14 suites passed: results, data, coach, memory, v15-data, hole-sketches, browser, navigation, v13-browser, v14-browser, v15-browser, hole-sketches-browser, dynamic-ios-browser and cohesive-play-browser. The full browser suite also passed with `UPGRADE_BASELINE=6f6f94e` (current deployed main), in addition to the legacy baseline. Syntax and diff whitespace checks passed. Final diff review found no blockers.

New assertions cover shared computed canvas/font, actual score-derived progress, preview isolation, pinned header coordinates, stable scroll position after compaction, return-to-top expansion, picker interaction from the pinned header, layout-sheet Escape/focus and unchanged saved memory, source/precision caption, five viewports, partial status and reduced motion. Existing suites retain scoring, notes, resume, partial save, cancellation/quota safety, history isolation, Ask copy/open/fallback/events, Golf Coach export and offline data/sketch/scoring coverage. No page errors observed.

No physical iPhone test is claimed; Safari/PWA safe areas, keyboard and browser chrome remain post-merge pilot checks, not publication or merge gates. Existing sketches remain approximate source-reviewed illustrations; Nevel Meade still uses its honest unavailable state where geometry is absent.

## Post-merge pilot steps

1. Open the updated app online once. Check the same type and canvas on Home, Play and Rounds; resume the existing round.
2. On Play, scroll down. Verify the header stays pinned and becomes compact while hole controls remain operable. Scroll to the top and verify it expands.
3. Preview another hole. The progress count must stay unchanged; the preview label must distinguish the playing hole.
4. Record a score and close the sheet. Check the scored count and totals update. Return Home and verify the same progress and saved round.
5. Expand a Long Run layout; verify the caption, close it, and continue scoring. On an unsupported layout, normal play must still work.
6. Open Ask Caddie and copy to ChatGPT; return and confirm the round remains. Finish a partial round, inspect its blank unscored holes and export. Check prior history remains after canceling another active round.
7. After one online load, use airplane mode to relaunch, resume, inspect a layout and save a score. Relaunch again and check persistence.

Leave the PR unmerged until the owner approves it.

