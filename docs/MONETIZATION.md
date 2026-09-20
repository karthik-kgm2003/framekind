# Support, affiliates, and advertising

## Shipped state

The product is free. No export is paywalled. The core tool works without an account.
There is no embedded checkout, ad code, affiliate SDK, revenue reporting, or payment
backend. No account was created or approved on your behalf.

The optional support section is the last substantial section, after the tool,
instructions, FAQs, and any enabled partner recommendations. Support links also
appear in the navigation and beneath the export button, without interrupting work.

## Support link

Set `donationUrl` in `config.js` to your existing HTTPS support/profile URL. The
button opens that provider in a new tab with `noopener noreferrer`. Your provider
handles its own account verification, payments, fees, receipts, and policies.

Empty/invalid settings leave a disabled button and an owner setup note. This is
intentional: do not publish a made-up recipient address. Test the actual profile
and confirm that it belongs to you before announcing the site.

Do not imply that independent-developer support is a tax-deductible charitable
contribution. This package does not provide payment, tax, or legal advice.

## Affiliate links

Use only programs that have approved you and products you can honestly describe.
Add objects with `name`, `description`, and `url` to `recommendedTools`. The app
shows a plain-language commission disclosure and marks the outgoing links as
`sponsored`, with `noopener noreferrer`. The section remains hidden if empty.

The recommendation cards do not make third-party requests until a user follows a
link. The destination may have its own attribution and privacy behavior. Tracking
that occurs after navigation is not controlled by this app.

No earnings, conversion rates, search rankings, or affiliate approvals are promised.
The built tool is not, by itself, an established income stream.

## Advertising

No display ads are installed. That preserves the shipped privacy model. Before
adding an ad network, confirm host permission, network approval, consent needs,
placement policies, and accurate privacy/disclosure text. Do not add fake publisher
IDs or publish an invented ads.txt entry.

The current CSP intentionally disallows third-party ad scripts and remote
connection requests. Do not weaken it without understanding the change. An ad
script executing on the same page as an editor may be able to access page data.
A safer design to evaluate is keeping ads on separate informational pages while
leaving the media editor free of third-party executable code.

The primary security context for third-party scripts is OWASP's Third Party
JavaScript Management Cheat Sheet. Reassess the architecture before implementation.

```text
https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html
```

## Hosting is a separate decision

GitHub Pages restricts online-business, transaction-focused, and commercial SaaS
hosting. A working external support button is not proof of permission. Review
GitHub's terms for your use case and use another appropriate static host when
needed. The source repository can remain separate from the deployment host.

```text
https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
```

## Practical rollout

Configure the real support URL, publish on permitted hosting, check the actual
live upload/export flow, and ask creators to use it on real work. Test partner
recommendations only after you have an approved and relevant offer. Add advertising
only after reviewing the privacy and hosting implications. Keep claims about safe
zones qualified; no monetization option should depend on overstating accuracy.
