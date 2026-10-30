# Long Run hole visual concepts

Three original, source-guided SVG concepts for design review, based on merged V1.5 (`65285ce`). **Design-only: not installed in production and not marked verified in the layout manifest.**

[Open the interactive gallery](index.html) or view [the comparison](comparison.png).

| Hole | iPhone mockup | Original vector | Basis |
| --- | --- | --- | --- |
| 5 | [Preview](hole-5-iphone.png) | [SVG](hole-5-concept.svg) | Short route/green connection and surrounding wooded corridor interpreted from the municipal map |
| 12 | [Preview](hole-12-iphone.png) | [SVG](hole-12-concept.svg) | Direct diagonal route and wooded corridor interpreted from the map; longer par-three presentation |
| 15 | [Preview](hole-15-iphone.png) | [SVG](hole-15-concept.svg) | Longer eastern corridor, southern green and water near the approach interpreted from the map |

## What is supported

The [municipal map/rules side](https://louisvilleky.gov/sites/default/files/2022-08/Longrun-map.jpg) provides broad route, green-area and terrain relationships. Hole numbers, Blue-tee yardages/par/handicap and recommendations in the mockups come from the existing V1.5 course data and stock-distance planner. The source image was visually inspected at full resolution and in a local detail crop. The crop and original image are not included in this PR.

These diagrams are independently composed SVGs. They do not contain source-image pixels, traced outlines, copied tree symbols, advertisements or the source illustrator's styling. They visualize broad geographic relationships, not an exact reconstruction of the published artwork. All three are rotated schematically to place the green above the tee; compass directions and scale are not implied.

## What remains unresolved

Fairway widths, precise contours, individual colored-tee positions, green dimensions, bunker identities/edges, water boundaries, measured carries and target zones are not verified. The diagrams deliberately use generic illustrative contours and a tee-area symbol rather than claiming those measurements. Hole 15's water relationship is source-supported; the drawn patch's exact outline and position are approximate. Wooded edges indicate broad corridor context, not a survey or individual tree inventory. No bunker or landing-zone marker has been invented.

A design approval would accept the presentation and visual hierarchy; it would not certify unresolved geography, tee-specific accuracy or the right to reuse the original illustration. Promoting any geometry to the gameplay manifest requires a separate source/rights review under the existing layout contract. This prototype does not change those flags or mislabel concepts as verified course data.

[Source facts and unresolved details](source-facts.json) retain the evidence distinctions for each hole, plus the original reference image hash. The original illustration is linked for research, not redistributed.

## Interaction and validation

The self-contained gallery opens locally without a server, dependencies or network access. Compare all three concepts or select a single hole. Mock scoring, navigation and Ask Caddie controls disclose that they are a visual prototype; they never change saved rounds, log handoffs or open ChatGPT.

`node design/long-run-hole-layout-concepts/build.cjs` regenerates the gallery/SVG files from the current stylesheet, V1.5 course/player data and the source notes. `capture.cjs` uses an available development Playwright/Edge installation to capture the comparison and 390×844 previews. It checks selector controls, source labels, visual placement before the actions, actions above tabs at 390×844, and no horizontal overflow at 320×568. All checks passed; no page errors or external requests occurred. See [validation.json](validation.json).

No physical iPhone test is claimed. Application files, scoring, round history, persistence, Ask Caddie, production recommendations and `data/layouts/index.json` are unchanged. This PR is a reviewable design artifact, not a production rollout. Do not merge or promote without the owner's direction.
