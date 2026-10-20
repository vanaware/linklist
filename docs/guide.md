# Guide

This guide takes you from an empty folder to a published link-in-bio page.

## 1. Prerequisites

- [Deno 2.x](https://deno.com) (the exact version is pinned in `.tool-versions`).
- A GitHub account (or any static host) to publish to.

No `npm install`, no global toolchain — Deno resolves every dependency from the
`deno.jsonc` import maps.

## 2. Get the source

```bash
git clone https://github.com/vanaware/linklist.git
cd linklist
```

Everything is a monorepo workspace, so dependencies install on first run:

```bash
deno install
```

## 3. Write your config

Your entire page is one file. Start from a template:

```bash
mkdir -p site
cp docs/templates/minimal.config.json site/config.json   # bare-bones starter
# …or copy the fully-annotated example:
# cp packages/core/public/config.json site/config.json
```

Edit `site/config.json`: your name, your links, a theme preset. The full field list is in
the [Configuration reference](configuration.md). Point your editor at the schema for
autocomplete by adding, at the top of the file:

```jsonc
{ "$schema": "https://vanaware.github.io/linklist/config.schema.json", /* … */ }
```

## 4. Validate

Catch mistakes with friendly, path-pointed messages before you build:

```bash
deno task validate-config site/config.json
# ✔ site/config.json is a valid linklist config.
```

## 5. Preview locally

```bash
deno task dev
```

This runs `denobuild` (the `linklist:build` codegen writes `index.html`,
`manifest.json` and `robots.txt`, then the app is bundled and the static assets, theme
CSS and your `config.json` are copied into `packages/server/build/dist`) and then serves
that folder. Open the printed URL. The body renders in the browser from `config.json`,
so edits to the config show up on reload.

> **Sandbox note**: on some locked-down containers the esbuild subprocess cannot start.
> If `deno task esbuild` fails with `ChildProcess.unref`, use the in-process fallback:
> `deno task denobuild` then `deno task dev`. CI runners build with esbuild normally.

## 6. Add rich text

Anything shown as user copy accepts **Markdown** (CommonMark + GitHub Flavored Markdown):
`profile.bio`, `profile.tagline`, section `body`, each link's `subtitle`, and the footer.
Links, lists, headings and emphasis are rendered to real Preact nodes; raw HTML is
dropped, so the output stays XSS-safe.

```jsonc
{
  "sections": [
    { "title": "About", "body": "I build **privacy-first** tools.\n\n- Deno\n- Preact", "placement": "after" }
  ]
}
```

## 7. Extend with data

Turn on the built-in GitHub plugin to show stars and the latest release of repos you
maintain:

```jsonc
{ "plugins": { "github_repos": ["vanaware/linklist"] } }
```

See [Plugins](plugins.md) for the contract and for loading third-party plugin/theme
scripts at runtime.

## 8. Build for production

```bash
deno task esbuild     # esbuild engine    → packages/server/build/dist
deno task denobuild   # Deno in-process   → packages/server/build/dist
```

Both first run `deno task linklist:build`, which generates `index.html`,
`manifest.json` and `robots.txt` (with the SEO `<head>` baked in) into
`packages/core/public` for the bundler to copy.

The output in `packages/server/build/dist` is fully self-contained and uses relative
paths, so it works at a domain root **or** under a project-page subfolder.

## 9. Deploy

- **GitHub Pages**: push a `v*.*` tag (or run the *Deploy Example to GitHub Pages*
  workflow) — see [Deploy](deploy.md).
- **Anything else**: run the build and upload `packages/server/build/dist`.

---

## Where to go next

- [Configuration reference](configuration.md)
- [Theming](theming.md)
- [Plugins](plugins.md)
- [Deploy](deploy.md)
- [API reference](api-reference.md)
