# Caddie V1.6 design review

The Home, Play, and Rounds tabs follow the existing round lifecycle. Caddie remains a static, offline-capable PWA with local round storage.

## Screen changes

| Screen | V1.6 |
| --- | --- |
| [Home](screenshots/home.png) | Warm cream, a serif welcome, and a single resume action grouped with active-round context. |
| [Course Library](screenshots/course-library.png) | Ruled course rows with flag icons, location, and preferred tee details. |
| [Course Overview](screenshots/course-overview.png) | Serif course name and a ruled strip for tee, distance, and par. |
| [Game Plan](screenshots/game-plan.png) | A margin rule sets off the scoring mission. Compact briefing rows keep each topic next to its guidance. |
| [Current Hole](screenshots/current-hole.png) | Forest header with course and tee, hole facts, and progress. A large club recommendation and labeled target lead the briefing. The score action stays above the tab bar. |
| [Hole Diagram](screenshots/hole-diagram.png) | Existing layout art appears inline and opens in a focused sheet with the original source caption. |
| [Ask Caddie](screenshots/ask-caddie.png) | An inline invitation opens a conversational sheet with explicit clipboard and ChatGPT actions. Context continues to follow the active hole. |
| [Score Entry](screenshots/score-entry.png) | Grouped options, visible selection states, and a fixed Done footer in the native dialog. |
| [Round Summary](screenshots/round-summary.png) | Ruled totals and tabular figures lead into the scorecard and round actions. |
| [Round History](screenshots/round-history.png) | Compact rows group course, tee, date, and round status beside right-aligned scores. |

The comparisons use the same Long Run Blue round at 390 × 844 in headless Edge. The left column shows main at `819c454`. The right column shows V1.6. The Course Library shares the Home route, so its comparison shows Home before a round is started.

## Design tokens

- Forest `#153D30`, warm cream `#F4F0E7`, charcoal `#202522`, white `#FFFFFF`, and earth brown `#806447` define the brand palette.
- `--canvas-play`, `--on-green-muted`, `--line-warm`, `--tint-green`, and `--tint-earth` support surface and text contrast.
- `--display-font` adds a system serif for editorial headings. The base stack uses the platform sans serif and tabular numerals.
- `--radius-control`, `--radius-sheet`, `--touch`, `--content-gutter`, and `--content-top` set shared control, sheet, and spacing dimensions.
- Inline stroke icons cover the tabs, hole navigation, summary, menu, target, hazards, score entry, and layout expansion. Ask Caddie retains its Caddie mark.

## iPhone acceptance steps

Use a deployed HTTPS build that serves this branch. The screenshots and automated tests use browser emulation. Installed iPhone behavior is a separate pilot check.

1. Open the test URL in Safari. Tap Share, Add to Home Screen, then Add. Launch Caddie from the Home Screen. Confirm Home, Play, and Rounds fit above the Home indicator. Check a portrait and landscape orientation.
2. On Home, confirm Nevel Meade and Long Run are listed. Tap Long Run, choose Blue, tap Start Round, then proceed through Course Overview and Game Plan to Hole 1. Confirm the course, tee, yardage, par, handicap, club, and target are readable.
3. Tap the hole selector, preview Hole 5, and open Expand layout. Confirm the diagram retains its scorecard-sketch caption and approximate scale notice. Close the sheet, then try the previous and next controls.
4. Tap Ask Caddie from a preview. Check that its context names the active hole. Try Just copy context and paste into a temporary note. Reopen the sheet, tap Copy context & open ChatGPT, then paste into the intended Golf Coach conversation. Confirm the text is present before sending anything. Return to Caddie.
5. Return to the active hole. Tap Record Score. Enter a score, tee result if applicable, GIR, putts, penalties, and a note. With the keyboard open, confirm the note and Done remain reachable. Dismiss the keyboard, tap Done, and check the score button reads Score followed by the recorded value and Edit.
6. Open the round menu and tap Exit to Home. Tap Resume Round, confirm the round and score survive, then close and relaunch the Home Screen app. Confirm the same round is available.
7. With Caddie already loaded once online, enable Airplane Mode and turn off Wi-Fi. Relaunch Caddie, resume the round, review a Long Run layout, record or edit a score, then open Round Summary. Copy the Golf Coach report and paste it into a note.
8. Still offline, tap Finish & Save and accept. Open Rounds, confirm Partial status and the expected score, then open the saved scorecard. Reconnect, start another round, open its summary, and use Cancel Round. Confirm the saved partial round is still in Rounds.
9. Enable Reduce Motion in iPhone accessibility settings. Repeat tab switching, the hole picker, and score entry. Check Larger Text and confirm controls and information remain reachable at the device's selected size.

Long Run diagrams retain their existing schematic precision. ChatGPT launch requires connectivity. The repository adds no runtime dependency or service.
