# Release checks and test scope

Release checked on **September 20, 2026**.

## Results

**35/35 dependency-free Node tests passed.** They cover aspect-ratio dimensions,
resolution scaling, clamping, safe-rectangle math, independent platform presets,
caption adjustments, crop/fit/pan geometry, input type/size validation, URL safety,
and download filenames.

**64/64 Chromium browser assertions passed.** They cover demo initialization, local
PNG upload, export download completion, exported dimensions and pixels, clean vs
reference differences, transparent guide alpha, fit backgrounds, square crops,
three-platform comparisons, resolution caps, zoom/drag/keyboard positioning,
custom margins, caption resets, headline warnings, toggles, unsupported/corrupt
input handling, object-URL cleanup, local WebM frame seeking, video-to-PNG export,
reset, privacy dialog behavior, form labels, safe owner-link configuration,
affiliate disclosure/escaping, and large landscape export.

No JavaScript runtime errors or unexpected third-party HTTP requests were observed
in the tested fixture. Horizontal overflow checks passed at widths 320, 360, 390,
740, 768, 900, 1024, 1280, and 1440 pixels.

## Environment limitation: be precise about what passed

The available Chromium browser disallowed URL navigation through an environment
policy. Browser tests therefore used the included **in-memory HTML/CSS/JavaScript
fixture**, on a blank page, with CSP bypassed in the test context. It executes the
same shipped files and uses real browser file decoding, Canvas drawing, and PNG
downloads, but **it is not a complete test of deployed HTTP navigation, browser CSP
enforcement, or GitHub Pages publishing**. The application files themselves retain
the restrictive CSP.

A local HTTP resource check separately confirms that static assets are served at
the expected repository subpath. HTML references, IDs, and script syntax are also
checked. The normal `browser_smoke.py` mode is written to use HTTP with the shipped
CSP on an unrestricted developer machine.

## Not verified

No live GitHub repository or hosted domain was created. No real support-provider
checkout, payment, affiliate attribution, ad-network integration, earnings, search
indexing, or hosting-policy approval was tested.

This is Chromium testing, not certification across browsers. Safari/iOS, Firefox,
and every video codec/container combination have not been tested. A synthetic WebM
was used for the video test. Browser support for MOV/MP4 depends on codecs, so the
UI handles unsupported decoding with an error. There has been no independent
security audit, WCAG conformance audit, or real-platform accuracy certification.

## Re-run locally

```sh
node --test tests/core.test.js
python -m pip install playwright pillow
python -m playwright install chromium
python tests/browser_smoke.py
```

The browser suite creates a temporary HTTP server and writes results to
`test-results/` (git-ignored). It needs no accounts. `CHROMIUM_PATH` can point to an
existing compatible executable. Set `FRAMEKIND_TEST_IN_MEMORY=1` only when URL
navigation is prohibited, recognizing the narrower coverage described above.

## Before launch

Test your actual deployed URL, its resource paths/CSP, a real phone, a real image,
a browser-supported video, every export type, and your configured support link.
Confirm host permission for the intended use and keep all accuracy/privacy claims
consistent with any modifications you make.
