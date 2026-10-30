# Long Run — scorecard verification and data decisions

Update: [the later all-18-hole integration](../long-run-hole-sketches/README.md) adds labeled, approximate Long Run sketches to the live app code. The zero-illustration statements below document V1.5 as originally delivered, not the newer integration.

Verified 2026-10-29. All hole data comes from one municipal scorecard version: **22–23**, hosted in the August 2022 directory and still attached to the municipal course listing. This verifies the currently published card, not an assertion that the course remeasured every hole in 2026.

## Primary sources

- [Municipal course listing](https://louisvilleky.gov/golf-course/long-run-golf-course): address, public municipal course, 18 holes, par 72, front/back characteristics and linked scorecard. Its summary lists Blue 6,902 / White 6,565 / Red 5,378, which conflict with the attached card.
- [Municipal score side](https://louisvilleky.gov/sites/default/files/2022-08/Longrun-score.jpg): sole authority for tee/hole yardages, par, stroke indexes and printed ratings used here. Image SHA-256: `e024c9892bf2d049a9a561e2e121549a43a235c469331f46cbc138fa6383dbdb`.
- [Municipal map/rules side](https://louisvilleky.gov/sites/default/files/2022-08/Longrun-map.jpg): identifies the driving range left of #9 and right of #18 as out of bounds. Image SHA-256: `347871ee47778f124353eb04c7d66c1b8fb52244ba425908146cea9d45976d00`.
- [Official operator](https://metroparksgolf.net/longrun/): open/flatter front nine, tighter/tree-lined/hilly back nine, two double-dogleg par fives, driving range and practice green. Its Learn More link redirected to Charlie Vettiner during research; that course's data is excluded. The operator description does not identify which two par fives are double doglegs, so recommendations do not assign them to specific holes.

The page itself returned an access denial to direct requests, but both original municipal JPG attachments were successfully retrieved and visually read. References are linked, not bundled: the illustrations carry a Bench Craft copyright, and publication by a municipality does not establish reuse rights.

## Tee reconciliation

| Tee | Front | Back | Total | Printed rating / slope | Availability |
| --- | ---: | ---: | ---: | --- | --- |
| Blue | 3,344 | 3,509 | 6,853 | Men 72.3 / 128 | Playable |
| White | 3,213 | 3,366 | 6,579 | Men 70.9 / 124 | Playable |
| Yellow | 2,860 | 2,944 | 5,804 | Men 67.3 / 117; Women 73.0 / 123 | Playable |
| Red | 2,678 | 2,670 | 5,348 | Men 65.2 / 107; Women 70.2 / 122 | Playable |
| Orange | 1,927 | **1,948 printed; 1,898 summed** | **3,875 printed; 3,825 summed** | Not printed | Visible, disabled pending course clarification |

All playable tees independently sum to their printed front/back/total yardages. Each nine is par 36; all tees use the card's par-72 row. No Gray, Teal or combined tees are added. Yellow and Orange are included because the actual official scorecard explicitly verifies their existence, despite their omission from the page summary.

The upper handicap row is used for Blue/White/Yellow and the lower printed row for Red/Orange. These are the rows as printed, not newly calculated difficulty rankings. They are separate from gendered course ratings, which are labeled explicitly. The application does not calculate handicap-adjusted net scores. Orange is not repaired by changing one hole or silently replacing its total. Its original values stay in the source data, and both the UI and round-projection layer prevent starting it until the discrepancy is resolved.

### Hole-by-hole transcription

The authoritative transcription is [long-run.json](../../data/courses/long-run.json), with every hole's tee-specific yards, par and printed handicap row. `tests/v15-data.test.cjs` checks all 90 yardages against a separate transcription, all pars/handicap rows, ratings, sums and the deliberate Orange quarantine. This is source validation, not just a check of total yardage.

### Third-party discrepancies — excluded

- [Golfify](https://www.golfify.io/courses/long-run-golf-course) lists Blue 6,902 with 72.4/132, White 6,559 and Red 5,351, with different individual hole lengths. Those values are not substituted for municipal card values.
- [Zomma](https://zommagolf.com/courses/ky/long-run-golf-course) repeats municipal-summary totals (6,902/6,565/5,378) while its individual rows sum to 6,853/6,579/5,348. Its Red par and rating descriptions also diverge. No hybrid dataset is created from that page.
- [Aimy](https://aimy.golf/courses/long-run-golf-course-louisville-ky.html) agrees with several score-side totals but adds Gray and other rating variants. Agreement is corroboration, not permission to expand the verified municipal card.

## Personalized recommendations

`strategy.js` projects advice into the new round snapshot using the selected tee's actual hole length and the existing player's stock bag. Par threes select the nearest stock distance; par fours balance driver versus 3H and the resulting approach; par fives favor visible landing areas and a comfortable wedge plan. Arithmetic is explicitly described as an estimate, not a carry or measured landing location. Confirm wind, lie and actual playing distance on course.

Only the #9/#18 range boundaries are treated as verified hole-specific hazards. Elsewhere, targets are conditional (“widest visible landing area” / middle of green), hazards are marked unverified and the safest miss is chosen from visible room. There are no invented bunker locations, water carries, dogleg directions or narrow landing coordinates. Full plan, hazard, safest miss and approach fields remain in snapshots and live context; the UI uses concise prose rather than repeating each field.

## Hole illustration coverage

**0 of 18 Long Run and 0 of 18 Nevel Meade holes have production illustrations in V1.5.** The municipal map was reviewed, but reproduction/derivative rights have not been established, and no independently verified, reusable hole geometry was obtained. No copyrighted artwork or traced fairways are shipped. The compact “Hole layout not yet verified” row is intentional; play and scoring continue normally.

The reusable renderer is fully implemented and tested with an explicitly synthetic, non-production fixture. Its screenshot is labeled **test only** and is never represented as Long Run geography. Add factual geometry only after verification and licensing review; see [the layout contract](hole-layouts.md).
