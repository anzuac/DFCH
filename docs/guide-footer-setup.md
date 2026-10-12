# Guide footer

The Cloudflare guide build reads the last Git committer timestamp touching guide HTML, CSS, JS, gift data or images. It displays Asia/Taipei time. A rebuild alone does not advance it. Unavailable Git history displays a dash, never the build time.

## One-time Cloudflare setup

1. Create a D1 database named `dfch-guide-stats`.
2. In the `dfch` Pages project's production settings, add a D1 database binding named exactly `GUIDE_STATS` and select that database.
3. Redeploy the production site after saving the binding.

The first successful page view creates the counter table automatically. No SQL import is required. Keep the same database on future deployments to retain the count. Bindings must be configured in Cloudflare; this repository does not create account resources.

Only full page loads on `dfch.pages.dev` POST once to `/api/guide-views`; tabs and language changes do not increment it. Reloads count. Preview hosts do not count. This is a basic page-view counter, not unique visitor analytics or bot-proof analytics. No visitor identifiers are stored. Failed or unconfigured requests display a dash. `_routes.json` limits function invocation to this API; static pages remain served as assets.

The counter uses an atomic SQLite upsert in D1, so simultaneous page loads do not overwrite increments. The code is deployed as a Pages advanced-mode worker; it is not offered as a downloadable frontend asset.

Official setup reference: https://developers.cloudflare.com/pages/functions/bindings/#d1-databases
