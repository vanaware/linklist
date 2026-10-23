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
  "blocks": [
    { "format": "row", "title": "GitHub", "url": "https://github.com/yourhandle" },
    { "format": "text", "title": "About", "body": "I build **privacy-first** tools.\n\n- Deno\n- Preact" }
  ]
}
```

Every block is a **pure, self-contained item** that names one predefined `format`. The
`format` decides both how it renders and which fields it needs: `row`/`button`/`card` are
link formats (need `title` + `url`), `text` is a Markdown section (`card_text` wraps it in
a card), `figure` a standalone image (`card_figure` wraps it in a card) and `island` an
interactive component. The order of `blocks` is the order on screen —
links, sections, figures and islands interleave freely (consecutive link blocks group into
one list).

## 7. Add an interactive island

To drop real interactivity (a counter, a form, a widget) into the static page, add an
`island` block that names a plain-JS component in `public/islands/` and passes it props:

```jsonc
{
  "blocks": [
    /* … */, { "format": "island", "island": "Counter", "params": { "start": 3, "step": 2 } }
  ]
}
```

The block shows a static placeholder first, then hydrates the component in place using the
app's single shared Preact/Signals runtime — no second copy, no build step, and the page
never breaks if the island fails to load. See [Islands](islands.md) for authoring your own.

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
- [Islands](islands.md)
- [Deploy](deploy.md)
- [API reference](api-reference.md)
