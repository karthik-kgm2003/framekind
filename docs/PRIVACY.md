# Privacy implementation notes

These notes describe the unmodified release, not every future deployment.

- Selected media is decoded locally using Image/video elements and browser object
  URLs. Canvas renders the previews and produces downloadable PNG files.
- Media, original filenames, canvas settings, and headline text are not sent to a
  backend. The app contains no fetch/XHR/WebSocket transport or form submission.
- No local storage, cookies, saved projects, analytics, remote fonts, or third-party
  executable code are used. Reloading clears the application state.
- Replacing a file, returning to the demo, and resetting release the active media
  object URL. Temporary export URLs are revoked after a delay so downloads can
  complete. A generation token prevents a stale file load replacing a newer one.
- Hosting access logs are outside the app's control. The hosting service can see
  ordinary page-resource requests, even though media uploads do not occur.
- External support, partner, source-code, and documentation links lead to other
  services. Their tracking, payments, and policies are separate. The page uses a
  no-referrer policy and `noopener noreferrer` for external links; partner links
  additionally use `sponsored`.
- File validation is defensive, not a guarantee against every malformed input or
  browser vulnerability. Decoding huge/corrupt media can still use resources.
  This project has not undergone an independent security audit.

The deployed host may support stronger HTTP response headers beyond the meta CSP.
Evaluate them for your hosting environment. Do not claim they have been configured
by this static package. A meta CSP does not provide every capability of a response
header policy.

Update the visible privacy note in `index.html`, the FAQ, and this document before
adding advertising, analytics, login, cloud storage, remote processing, tracking,
embeds, or other integrations. Keeping the old copy after adding data collection
would make the privacy promises inaccurate.
