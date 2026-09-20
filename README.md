# Framekind

**Give your content room to shine.**

A free, local-first creator-layout checker, built as a static site. Check images
and video frames with editable, illustrative Reels, TikTok, and Shorts layouts.
The independent-developer support section is at the end of the page.

**New to deployment? Read `START-HERE.md` first.**

## Features

- Image input: JPG, PNG, WebP, up to 25 MB; drag-and-drop or file picker.
- Video frame input: browser-supported MP4, WebM, MOV, and M4V, up to 200 MB.
- 9:16, 4:5, 1:1, and 16:9 canvases. Non-vertical layouts are generic crop previews.
- Fill/fit, zoom, dragging, arrow-key panning, position sliders, background color.
- Three approximate vertical platform presets, editable margins, caption-space
  options, simulated interface controls, and optional rule-of-thirds grid.
- A temporary test headline with size, position, color, and guide-overlap feedback.
- Single preview and side-by-side three-platform comparison.
- Four PNG exports: layout reference, clean image, transparent guide, comparison.
- 720/1080/2160-pixel short-edge exports; comparison cells cap at 1080 pixels each.
- Responsive layout, labeled controls, keyboard access, reduced-motion support,
  privacy dialog, and honest guide limitations.
- Configurable external support link, optional repository link, and optional,
  explicitly disclosed affiliate cards. No placeholder affiliate destinations.

## Important boundaries

The presets are **editable editorial estimates**, not official measurements or
platform-certified safe zones. This is a manual check, not OCR or automatic text
analysis. Only the temporary headline created in this tool has overlap feedback.
Real interfaces vary. Always inspect the actual posting preview.

Video files are used for **still-frame PNG exports**, not video playback/rendering,
audio work, transcoding, or video download. Codec support depends on the browser.
Images over 40 megapixels are rejected after the browser reads their dimensions.
Large files can still strain a phone; use smaller inputs on limited devices.

Clean exports do not include test text or overlays. Layout and guide exports
include an illustrative-reference label. Large exports do not restore missing
source detail. Work is not saved between reloads.

## Run

```sh
python -m http.server 8000
```

Open `http://localhost:8000`. No package install or build is needed to run the site.

## Configure

All owner settings are in `config.js`:

```js
window.FRAMEKIND_CONFIG = Object.freeze({
  developerName: "Karthik",
  donationUrl: "",       // Your existing, full HTTPS support/profile URL.
  donationLabel: "Support my work",
  repositoryUrl: "",     // Optional, full HTTPS source-repository URL.
  recommendedTools: []   // Optional approved partner links; see below.
});
```

Only HTTPS URLs without embedded credentials are linked. Empty or invalid URLs
keep the corresponding action hidden or disabled. The sample configuration never
sends a donation to a placeholder account. All public configuration is visible to
visitors: **never store secret keys here**.

To add a partner card, add an object to `recommendedTools` with a nonempty `name`,
a short `description`, and your approved full HTTPS `url`. Up to six cards render.
Unsafe URLs are skipped. Copy is rendered as text, never HTML.

Framekind is a working brand for this package. Review the name before launch and
edit `index.html`, `app.js`, and the favicon as appropriate for your own branding.
The visible developer credit is configured separately.

## Project layout

```text
framekind/
  index.html             Page, controls, FAQs, privacy note, support section
  styles.css             Responsive design (no external fonts)
  config.js              Developer, support, repository, optional partner links
  core.js                Pure geometry, input validation, safe URL helpers
  app.js                 Local file loading, Canvas rendering, interactions
  assets/favicon.svg     Original vector brand mark
  .nojekyll              Plain static-file publishing
  START-HERE.md          Setup and GitHub Pages instructions
  README.md              Product and engineering notes
  docs/                  Monetization, guide methodology, privacy, QA scope
  tests/core.test.js      Node's built-in test runner; no package dependencies
  tests/browser_smoke.py  Optional Playwright/Pillow test runner
  tests/fixtures/         Tiny original raster and synthetic video test files
```

Only `index.html`, `styles.css`, `config.js`, `core.js`, `app.js`, `assets/`, and
`.nojekyll` are needed for the deployed tool. Documentation/tests may stay in your
repository; they do not run in visitors' browsers. Relative asset references are
used throughout, with no router or rewrite rules.

## Privacy and security model

The unmodified app does not upload media or transmit filenames, crop settings, or
test text. It uses Canvas and browser object URLs, releases replaced file URLs,
validates supported file types/sizes, and offers no remote-image URL import.
SVG, GIF, HEIC, empty, unsupported, and unreadable input files are rejected.

There are no ad scripts, analytics, third-party libraries, external font calls,
cookies, local storage, accounts, backend services, or API keys in this release.
The host can still receive normal access logs. External support/partner websites
have their own policies. A restrictive meta CSP blocks connection requests and
third-party scripts; see the code for the exact directives.

This is not a security certification. The privacy statement must be reviewed if
you add advertising, analytics, embeds, integrations, or a backend. Do not simply
remove the CSP and keep the original privacy claims.

## Test

Geometry and validation, using Node's built-in test runner:

```sh
node --test tests/core.test.js
```

Optional full-browser smoke suite (development dependencies only):

```sh
python -m pip install playwright pillow
python -m playwright install chromium
python tests/browser_smoke.py
```

The normal smoke suite starts a local HTTP server and serves the repo at a
`/framekind/` subpath with the shipped CSP. A documented in-memory fallback exists
for restricted environments; its limitations are in `docs/TESTING.md`.

## Deployment and business use

Read `START-HERE.md` for GitHub Pages setup. GitHub's restrictions on business,
commercial transactions, and commercial SaaS hosting require reviewing your use
case. Technical Pages compatibility is not permission for any monetization model.
No live site, ad account, affiliate enrollment, donation account, or payment
integration has been created by this package.

Choose your preferred source-code license before publishing. This package does
not preselect a license or claim that the working brand is available to register.
