# Hole Layout contract

Current integration: [all 18 Long Run scorecard sketches](../long-run-hole-sketches/README.md) now use a separate `schematics` data class. They are deliberately approximate and do not pass the verified-geometry validator. The contract below still governs measured/verified layouts.

`hole-layout.js` is a pure HTML/SVG renderer. It has no dependency on scoring, round memory, player advice or coaching context. `data/layouts/index.json` is loaded separately from course data; no geometry enters a round snapshot or export. A fetch error, malformed manifest or two-second timeout falls back to the compact unavailable state. The renderer uses numeric polygons rather than injected SVG markup, paths or remote image URLs.

The manifest is schema 1 with a `holes` array. Each entry names `courseId`, `teeId` and `hole`, so a verified tee position cannot silently be reused for another tee. Each entry needs:

- `source`: `verified: true`, an HTTPS `url`, `verifiedAt` (`YYYY-MM-DD`), `license`, nonempty `attribution` and `redistributionAllowed: true`.
- `tee`: two finite numeric coordinates in a normalized 0–100 square.
- `fairway` and `green`: polygons of at least three finite coordinate pairs.
- Optional `bunkers`, `water` and `trees`: arrays of polygons.
- Optional `description`: accessible text, escaped before rendering.
- Optional `target`: `position` plus its own verified/licensed `source`. General hole geometry alone does not justify a recommended landing zone.

These fields record a maintainer's source review, not an automated guarantee that geography is true or rights are sufficient. Check the original evidence, permitted use, tee identity and currency before adding production data. Do not set verification flags merely to make a visual appear. Preserve attribution and any license obligations. Do not infer polygons, directions or markers from par or yardage. A centerline without verified fairway/green extent is insufficient for this silhouette renderer.

The diagram displays an overhead silhouette, tee marker and supported terrain; it has no scale or measured-distance labels. It is responsive, restrained and decorative only in presentation, with a descriptive accessible image and source caption. It is not GPS or a navigation map. Verified production geometry remains empty for both courses. Long Run has 18 original illustrative scorecard sketches; Nevel Meade retains the unavailable state. The licensed-data code path is tested with synthetic fixtures; no synthetic geometry is bundled with the application.

All production geometry resides in the locally precached manifest. No remote asset request is made during play, so future verified entries will be available after the ordinary online PWA installation. Adding separate assets would require explicitly extending precaching and its regression tests.
