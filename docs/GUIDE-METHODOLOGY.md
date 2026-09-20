# Guide methodology and maintenance

## What the presets are

The initial margins below are original, illustrative editorial choices, expressed
as percentages of a 9:16 canvas. They are **not transcribed from platform screenshots
or official safe-zone templates** and have not been measured or platform-certified.
Their purpose is to make layout planning possible while clearly allowing adjustment.

| Preset | Top | Bottom | Left | Right |
| --- | ---: | ---: | ---: | ---: |
| Reels | 12% | 22% | 6% | 17% |
| TikTok | 13% | 25% | 6% | 18% |
| Shorts | 14% | 24% | 6% | 18% |

Compact captions subtract five percentage points from the preset bottom margin.
Expanded captions add six. Those changes are also assumptions, not measurements.
Changing the caption option deliberately resets custom margins for that platform.
Custom margins persist while switching platforms during a session.

All individual margins are bounded from 0% to 40%, keeping a nonempty center.
The custom non-vertical crop buffer begins at 5% per side. No platform UI is shown
for 4:5, 1:1, or 16:9. Comparison sheets always use three vertical layouts.

## What the app does not establish

There is no single guaranteed visible rectangle across all screen sizes, caption
lengths, placements, languages, accessibility settings, product versions, and
account-specific features. The simplified interface mocks are not current app
screenshots. In particular, organic-post guidance must not be inferred from an
advertising template without verifying its applicability.

The app does not recognize text, faces, logos, or other important objects already
inside your uploaded media. Only the optional, app-created headline has a computed
bounding rectangle and a comparison against the selected guide area.

## Primary-source context reviewed September 20, 2026

TikTok's auction in-feed ad documentation says safe zones depend on dimensions,
caption length, and additional formats, and notes preview/live differences.
Google's vertical-video ad guidance says overlays and buttons can vary with format,
campaign type, and screen. These support the need for caution, **not the numerical
values chosen above**.

```text
https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en
https://support.google.com/google-ads/answer/9128498?hl=en
```

## Improving the presets

Before promoting a preset as measured, define the exact app, placement, language,
device dimensions, OS/app version, account state, and caption assumptions. Capture
reference screens with permission, record the measurements and date, test exports,
and update the visible labels and this document. Add a distinct preset for a
materially different ad/organic placement rather than silently changing scope.

The editable starting values live in `core.js`. Example UI drawing is in
`drawMockUI()` in `app.js`. The UI and the guide margins are intentionally separate:
changing guide margins does not pretend to move the platform's own interface.
