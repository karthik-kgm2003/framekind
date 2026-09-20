# Start here

You have a working static website called **Framekind**, a creator-layout checker.
It has no build process, backend, database, API keys, or runtime package installs.

## 1. Add your own support link

Open `config.js` in a text editor. Find:

```js
donationUrl: "",
```

Paste your existing, full **HTTPS donation/profile URL** between those quotes.
Leave the trailing comma. Do not paste payment credentials or API keys.

The button is deliberately disabled until a valid HTTPS URL is configured. It opens
an external page; this website never collects payment information. No real donation
URL or payment account has been created for you.

Your name is set to `Karthik`. Change `developerName` in the same file as needed.

## 2. Try it locally

From this directory, with Python installed:

```sh
python -m http.server 8000
```

Open `http://localhost:8000` in your browser. Stop the server with Ctrl+C.
This local server only serves the site files; the editor has no media-upload API.

## 3. Publish static files

For GitHub Pages, review the hosting restriction below first. Then create a public
repository, such as `framekind`, and upload the **contents of this directory**, not
the ZIP and not an extra outer folder. `index.html` must be at the repository root.

In the repository, open **Settings -> Pages -> Build and deployment**. Select
**Deploy from a branch**, choose **main** and **/(root)**, and save. GitHub shows the
site address and deployment status there. The included relative paths also work
when the site is under a repository subpath.

No GitHub Actions workflow, npm command, API key, or environment variable is required.

### Important hosting restriction

GitHub says Pages must not be used as free hosting for an online business,
e-commerce site, or a site primarily directed at commercial transactions or
commercial SaaS. This package is technically compatible with Pages, but that is
**not a determination that your intended monetized use is permitted**. An external
support button does not settle that question. Review GitHub's terms or seek
clarification from GitHub before monetizing there. You can retain the source
repository and deploy these same static files on another suitable host.

Official documentation, reviewed September 20, 2026:

```text
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
```

## 4. Check your live site

Open it on a phone and a desktop. Upload an image, try the platform buttons,
download a clean PNG and a guide PNG, and verify that your support button opens
your actual donation profile. Test a small video supported by your browser too.

Do not assume a working link proves that a payment account is configured correctly.
No live deployment or financial transaction was performed for this release.

## 5. Optional affiliate links

`recommendedTools` in `config.js` accepts approved links with `name`, `description`,
and `url` fields. The entire section stays hidden when the array is empty. With
valid entries, it appears before the final support section, with an affiliate
disclosure and `rel="sponsored noopener noreferrer"` on each outgoing link.

No ad network or affiliate account is connected. See `docs/MONETIZATION.md` before
adding advertising scripts or changing the privacy promises.
