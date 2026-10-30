# Long Run — all 18 sketches in the actual app

This change fixes the screenshot-reported issue. The prior PR added only a standalone design gallery; it did not change the active-hole renderer or production layout data. This PR wires **18 original, approximate scorecard sketches into the actual Long Run hole screens**. It is not another gallery-only delivery.

[All 18 sketches](all-18-sketches.png) · [Contact-sheet page](gallery.html) · [Hole 5 before](hole-5-before.png) · [Hole 5 in the real app](hole-5-in-app.png)

More real-app captures: [Hole 2](hole-2-in-app.png), [Hole 7](hole-7-in-app.png), [Hole 11](hole-11-in-app.png), [Hole 14](hole-14-in-app.png), [Hole 15](hole-15-in-app.png), [Hole 18](hole-18-in-app.png).

## Visible behavior

Every Long Run hole now has a compact SVG sketch beneath the recommendation and above Ask Caddie / Record Score. Each carries the visible caption **Scorecard sketch · Approximate, not to scale. Tee area shared across tees.** Water-bearing sketches also identify the water edge as illustrative. The selected tee's verified yardage/par/handicap remain in the actual hole header; the diagram does not pretend to locate that individual colored tee.

All Blue, White, Yellow and Red rounds use their corresponding hole's sketch. Orange's source-data discrepancy and disabled selection are unchanged; the shared route can support that tee if its scorecard is later resolved. Previewing and tab navigation retain their existing playing-hole behavior. Nothing about the drawing changes a score, recommendation, saved snapshot, history or Ask Caddie context.

Nevel Meade still has no source map in this task, so its unavailable state is unchanged. “Each hole” here covers all 18 Long Run holes from the captured Long Run scorecard review.

## Evidence and uncertainty

The [municipal map/rules side](https://louisvilleky.gov/sites/default/files/2022-08/Longrun-map.jpg) was reviewed in full and in enlarged detail views. Broad route bends, green-area relationships and terrain context were manually interpreted per hole, separately from the numerical scorecard. No route was inferred from yardage/par alone. Each entry in [the application manifest](../../data/layouts/index.json) records its `routingEvidence`, source URL/hash and uncertainty note.

These are original procedural ribbons and symbols, not crops, source-image pixels, or traced fairway contours. A constant ribbon width and generic green/tee-area symbols are deliberate sketch conventions. Curves depict coarse routing; they are not surveyed fairway edges. Wooded context is illustrative and does not establish tree positions or counts. No bunker edges, carry distances, pin positions or landing/target zones are added. Water context is included only for the opening area (#1), the front-nine finishing area (#9), the eastern finishing corridor (#14) and #15's approach, where water appears in the source map. The drawn patch outlines and exact proximity to play remain approximate; no carry is implied.

The manifest keeps two distinct evidence classes:

- `holes`: surveyed/verified geometry under the original source/rights validator; still empty in production.
- `schematics`: the 18 explicitly illustrative sketches. They do **not** pass the verified-layout validator or set `verified: true`. A separate validator requires the reviewed reference, original artwork status, bounded route coordinates and explicit illustrative precision; it rejects unsupported targets, bunkers and distances.

A future verified layout takes precedence over its sketch. Missing/invalid optional data still falls back safely. Keeping sketches distinct lets the pilot display useful visual concepts now without falsely certifying precise geography.

## Integration and offline delivery

- `data/layouts/index.json`: 18 distinct source-guided sketch entries and coverage metadata, shared across tee identities without claiming exact tee locations.
- `hole-layout.js`: reusable schematic validation, lookup and SVG rendering alongside the existing verified-layout path. The existing `app.js` call automatically uses these entries; no prototype switch or separate page is required.
- `styles.css`: compact diagram sizing and a readable precision caption.
- `service-worker.js`: cache bumped to `caddie-v1.5.1-long-run-sketches-1`. The local manifest and renderer already belong to the precached shell; no paid service or remote map request is introduced.
- New sketch unit/browser tests and updated Long Run assertions verify **visible drawings**, rather than merely testing that no drawing exists.
- Documentation/contact-sheet captures use the same renderer and manifest as gameplay.

The app changes become visible after this PR is merged and GitHub Pages deploys it. Reopen/reload the installed PWA after deployment so it loads the new renderer and worker. **No clearing of browser storage is needed.** The currently deployed main remains unchanged while this PR is open.

## Validation

All 12 suites passed: results, data, coach, memory, v15-data, browser, navigation, v13-browser, v14-browser, v15-browser, hole-sketches and hole-sketches-browser. The full browser suite also passed upgrade checks from both V1.2 and the actual deployed main `8280908`.

Focused coverage verifies all 18 sketches for five tee identities, all 18 actual screens on each of the four playable tees, visible captions, no “not verified” fallback for populated Long Run data, verified-layout precedence, unsupported-detail rejection, HTML escaping and malformed data fallback. Existing scoring/history/lifecycle/handoff regressions remain in place.

The new real-app upgrade test starts by serving **main's actual code and service worker**. It creates a saved Long Run round, previews Hole 5, captures the old unavailable row, installs the new worker, reloads/resumes, then verifies the real sketch and unchanged scores/notes/history/events. It checks every hole, mobile viewports (320×568, 375×667, 390×844, 430×932 and 844×390), scroll access to Record Score, and offline drawing/scoring/relaunch. Screenshots are desktop Edge mobile emulation, not physical iPhone testing.

Reproduce:

```
node tests/hole-sketches.test.cjs
node tests/hole-sketches-browser.test.cjs
node tests/v15-browser.test.cjs
```

`build-gallery.cjs` regenerates the contact-sheet HTML from the actual renderer. The upgrade test captures its PNG and the real app screenshots. Syntax, UTF-8/data integrity, unchanged course/player/scoring data, and whitespace checks are included in the final audit.

## Pilot check after deployment

1. Reopen Caddie after the new Pages deployment; retain all local data.
2. Resume Long Run and preview Hole 5. Verify the sketch appears in place of the unavailable row and the playing-hole label remains correct.
3. Browse all 18 holes using the selector. Verify each has a sketch and the approximate/shared-tee caption; compare the broad routing with the printed scorecard. Note any questionable route interpretation for a follow-up correction.
4. Select other playable tees in a test round. Confirm their actual yardages change and no precise colored-tee location is implied by the shared sketch.
5. Scroll and record a score with the keyboard shown, visit Summary/History, and use Ask Caddie. Confirm earlier records and handoff events remain correct.
6. After an online load, relaunch in airplane mode and check sketches, scoring and saved notes.

Physical iPhone testing remains post-merge pilot validation, not a PR publication barrier. This PR is left unmerged for the owner's review. No automatic merge is enabled.
