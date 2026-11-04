# Clypse Beauty — Astro / Cloudflare Worker

Allowlisted static migration of https://www.clypsebeauty.com captured 2026-11-04.
The supplied ZIP was unavailable, and the target repository was empty, so this is a fresh rebuild; no prior git history could be recovered.

## Architecture

- `source-html/`: original HTML for the 11 authorised pages, never the hacked sitemap.
- `html/`: prepared raw HTML plus branded 404. These are rendered by `src/pages/[...slug].astro` and `404.astro`.
- `public/`: original WordPress asset paths, including Elementor lazy chunks, fonts and media.
- `worker/index.js`: static asset serving, apex → www, `/cart/` and `/checkout/` → `/shop/`, form endpoint.
- `worker/forms.js`: allowlisted Elementor forms, same-origin validation, server-side Turnstile hostname verification, KV storage and email delivery status.
- `wrangler.jsonc`: Worker `clypsebeauty`, account `1b2e351cbb39ab6b80efe36ca3577fe5`.

## Build and deployment

```sh
npm ci
npm test
npm run build
npx wrangler deploy
```

Workers Builds: repository `camster91/clypsebeauty-site`, branch `main`, root `/`, build `npm run build`, deploy `npx wrangler deploy`.
Do not add production domain routes until Cameron explicitly approves cutover.
Preview: https://clypsebeauty.camster915391.workers.dev (noindex via Worker).

## Forms

POST `/wp-admin/admin-ajax.php`, action `elementor_pro_forms_send_form`.
Allowed form IDs: newsletter `045ee22`, contact `3f054749`, Kami booking `d98dd4e`.

Bindings:
- `SUBMISSIONS`: KV namespace `ea10b4ec822745119f0ed43842a55393` (90-day retention).
- Secret `TURNSTILE_SECRET_KEY`: existing widget `0x4AAAAAABAvRNbS4GPTEK6Q`. Never commit the secret.
- `EMAIL_FROM=website@forms.clypsebeauty.com`.
- `FORM_RECIPIENT`: awaiting Cameron's supplied address.
- `EMAIL`: `send_email` binding restricted with `destination_address` to that verified recipient.
- `EMAIL_READY=true` only once recipient, binding and delivery test are complete.

Until email is ready the endpoint returns 503 and does not pretend submissions succeeded.
The client shows a visible error. An accepted request is stored before email is attempted;
failed email delivery is retained in KV and returned as an error. KV is private, never served by a public endpoint.

Email Routing is enabled ONLY for `forms.clypsebeauty.com`. Apex Google MX, SPF and Google DKIM must remain unchanged.

No checkout: product and shop purchase controls link to `/contact/`.
Unknown URLs return a genuine 404. Only the 11 real pages appear in sitemap.xml.

## Capture notes

`python scripts/rip.py` needs requests and beautifulsoup4 and deliberately only visits the page allowlist.
`python scripts/extras.py` downloads Elementor core lazy chunks. `python scripts/prepare.py` prepares the raw templates and localizes asset references.
Two original Poppins subset files returned 403; matching style/weight files are recovered from official Google Fonts.
Do not run the capture scripts as part of production builds; builds use the committed snapshot.

## Cutover and rollback

1. Confirm all 11 pages, assets, desktop/tablet/mobile menus, product contact links, 404, cart redirect and all 3 form types on workers.dev.
2. Confirm the chosen verified recipient receives the test emails and KV records say sent.
3. Ask Cameron before adding custom domains `clypsebeauty.com` and `www.clypsebeauty.com`.
4. Original apex A: `82.180.129.200` (proxied); www CNAME: `clypsebeauty.com` (proxied). Keep Hostinger intact through verification.
5. Add both Worker custom domains, verify apex redirects to www and repeat smoke tests.
6. Compare mail DNS against the pre-migration Google records; do not change them.
7. Roll back by removing only the new Worker custom-domain mappings and restoring those original website DNS records. Never roll back mail records.
8. Hostinger deletion is safe only after live verification passes and a restorable WordPress backup exists for anything still needed.
