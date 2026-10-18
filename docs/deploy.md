# Deploy

The build output in `packages/server/build/dist` is a **fully static, self-contained**
site that uses only **relative** asset paths. That means the same folder works served from
a domain root (`https://you.com/`) or a subfolder
(`https://you.com/linklist/`, the default for GitHub *project* pages) with **zero base-path
configuration**.

## Build first

```bash
deno task build        # esbuild  → packages/server/build/dist  (dev bundle)
deno task build:dist   # esbuild  → packages/core/dist          (minified prod bundle)
```

> Locked-down containers where the esbuild subprocess can't start: use
> `deno task build:deno` (Deno's in-process bundler) to produce the same
> `packages/server/build/dist` output. CI uses esbuild normally.

## GitHub Pages (automated)

The `.github/workflows/pages.yml` workflow builds and deploys automatically. Trigger it by:

- pushing a tag matching `v*.*` (e.g. `v0.2.0`), or
- running it manually from the **Actions** tab (`workflow_dispatch`).

What it does:

1. installs Deno (pinned by `.tool-versions`) and dependencies (`deno ci`);
2. runs the full gate (`deno task tests`);
3. builds the site (`deno task esbuild` → the `linklist` target writes
   `packages/server/build/dist`);
4. adds a `.nojekyll` file and copies `index.html` → `404.html` (so client-side routes
   resolve on a GitHub Pages *project* subfolder);
5. uploads `packages/server/build/dist` as the Pages artifact and deploys.

Enable Pages once in your repo: **Settings → Pages → Source: GitHub Actions**.

For a **user/organization** page (`https://<user>.github.io/`) the same artifact works —
relative paths just resolve at the root instead.

## Any other static host

Build locally (or in the host's CI) and upload the `dist` folder.

| Host | Build command | Output / publish directory |
| --- | --- | --- |
| Netlify | `deno task build` | `packages/server/build/dist` |
| Cloudflare Pages | `deno task build` | `packages/server/build/dist` |
| Vercel | `deno task build` | `packages/server/build/dist` |
| Nginx / S3 / … | build, then copy | `packages/server/build/dist` |

No SPA fallback rewriting is required beyond serving `index.html` for unknown routes —
the site is a single page, and the workflow already writes `404.html` for GitHub Pages.

## Custom domain

1. Add a `CNAME` file (or your host's equivalent) containing the domain, e.g.
   `links.example.com`.
2. Point your DNS at the host (GitHub Pages: an `A`/`CNAME` record as documented by
   GitHub).
3. Never hardcode the domain anywhere else: absolute URLs used for Open Graph / canonical
   / JSON-LD come from `seo.url` in `config.json`, so set that to your final URL.

```jsonc
{ "seo": { "url": "https://links.example.com" } }
```

## Checklist before going live

- [ ] `deno task validate-config <your config.json>` passes.
- [ ] `seo.url`, `seo.title`, `seo.description`, `seo.image` and `seo.twitter` are set
      (they drive the social preview card and JSON-LD).
- [ ] `theme.preset` is one of your CSS presets and the color tokens look right.
- [ ] Analytics stay `"none"` unless you actually want them.
