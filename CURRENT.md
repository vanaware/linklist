# @vanaware/linklist — Status & Next Task

`@vanaware/linklist` is a link-in-bio site generator derived from `@vanaware/mdBlog`.
Read `AGENTS.md` for the rules; this file tracks decisions, milestone status and the
next task.

## Confirmed architecture decisions

- **UI stack — retained from mdBlog**: Preact + `@preact/signals` (components/state),
  **BeerCSS** for styling (loaded via **CDN**, exactly as mdBlog does today), and the
  **Markdown** pipeline for user-authored text.
- **Render model — pure client render (mdBlog-style)**: the build copies a static
  `index.html` shell (generic fallback head + `<noscript>`) into the output dir;
  `linklist.js` fetches `./config.json` at runtime (relative, so it works at a domain
  root OR subfolder), validates it, runs plugins, applies the per-config SEO head to
  the live DOM (`core/src/head.ts` → `applyHead`), applies the theme and renders the
  whole Preact `App` into `#app`. Nothing is pre-rendered and the config is NEVER
  embedded — no-JS visitors get only the `<noscript>` notice.
- **Build = buildit only (no CLI)**: `deno task build` runs the `linklist` target in
  `scripts/esbuild.jsonc`, which (1) wipes `packages/server/build/dist`, (2) copies
  the static shell + the sample `config.json` (`packages/core/public`) + theme CSS
  (`packages/core/themes`) + the config schema (`packages/core/schema`) into it, and
  (3) bundles `core/src/entry.ts` → `linklist.js`.
  `deno task build:dist` is the minified prod twin. **The preferred engine is esbuild**;
  `deno task build:deno` runs the same build through Deno's IN-PROCESS bundler
  (`scripts/denobuild.jsonc`) for sandboxes where esbuild's subprocess cannot spawn.
  `deno task dev` = `build` then the `packages/server` static server (`serveDir`) on the
  port from `packages/server/.env` (`PORT`, 3000 or 8000) — the dir `pages.yml` deploys.
- **Markdown is allowed in**: `profile.bio` / `tagline`, dedicated about/section
  blocks, per-link `subtitle`, and the footer line (not plugin output areas, for now).
- **Config**: a single `config.json` (JSON, not YAML) validated with **ArkType**
  (`npm:arktype`). Structure mirrors `packages/core/src/types.ts`.
- **No CLI package**: the former `packages/cli` is gone. Config validation lives in
  `scripts/validate.ts` (`deno task validate-config <path>`); the build is declarative
  (buildit) and preview uses `packages/server`.
- **Publishing scope**: `@vanaware/linklist-server` is a dev aid (local static preview
  server for development and tests) — it is NOT a library and will never be published;
  it stays `publish: false` permanently. The only future JSR publication candidate is
  `@vanaware/linklist-core` (currently deferred, see `docs/publish-jsr-rules.md`).
- **Themes & built-in plugins live in core**: BeerCSS presets are selectable via
  `config.theme.preset` + token overrides and live in
  `packages/core/themes/{minimal-dark,light-simple}.css`, merged with `config.theme.custom`
  by `core/src/theme.ts`. The plugin engine (`core/src/plugin.ts`) and the default plugins
  (`core/src/plugins/`, exporting `builtinPlugins`) are also in core — there is **no**
  separate themes or plugins package. There are no runtime third-party extension hooks
  (`theme.script` / `plugins.scripts`) until the engine is stable.
- **Language**: all code, comments, logs, tests and docs are written in English.

## Milestones

- ✅ **M0** — Revised `AGENTS.md`; scaffolded `core` / `cli` / `themes` / `plugins`;
  wired the workspace; delivered the JSON config schema (`example/config.json`,
  `example/config.schema.json`).
- ✅ **M1** — Config validator in `core/src/schema.ts` (ArkType structural rules +
  semantic cross-field checks: URL validity, `avatar ⇒ avatar_alt`, provider-required
  ids, non-empty links, `owner/repo`). Friendly, path-pointed errors. `validate-config`
  command in `cli` (`@cliffy/command`). Tests green (12 validator cases + 2 CLI e2e).
- ✅ **M2** — Rendering runtime in `core` (no `mdblog` dependency): a self-contained
  Markdown→Preact VNode renderer (`src/markdown.ts`, GFM, XSS-safe — raw HTML dropped),
  central state via `@preact/signals` (`src/state.ts`), and BeerCSS-classed components
  (`ProfileHeader`, `LinkList`/`LinkRow`, `ContentSection`, `MarkdownText`, `BrandIcon`,
  `Footer`, root `App`). Added the `sections` content-block + `plugins.footer_label` to
  the schema/types/example (Markdown in bio, tagline, sections, subtitles, footer).
  Tests green via `preact-render-to-string` snapshots (7 suites / 23 steps); CLI, lint
  and fmt all clean.
- ✅ **M2b** — Replaced the raw-CSS placeholders with two BeerCSS-aligned presets
  (`packages/themes/css/minimal-dark.css`, `light-simple.css`) covering every component
  class, plus a pure theme resolver in `core/src/theme.ts` (`tokensToCss`,
  `resolveThemeCss`, `themeBodyClass`, `themeColor`). Token overrides + color-scheme mode
  flow from `config.theme`.
- ✅ **M3** — Static assembly. `core/src/seo.ts` (pure head/OG/Twitter/JSON-LD/manifest/
  sitemap/robots + `renderIndexHtml`) and `core/src/render.ts` (`prerender` via
  `preact-render-to-string`). CLI `build` command (validate → resolve theme → pre-render →
  emit `dist/{index.html,manifest.json,sitemap.xml,robots.txt}`) with `--out`,
  `--base-url`, `--no-bundle`; `preview` static server (`@std/http`, port `$PORT`/3000).
  Browser entry `core/src/entry.ts` (kept out of `mod.ts`) fetches `./config.json`
  at runtime and renders the final page in the browser. The `app.js` bundle is
  produced by **buildit** from `scripts/esbuild.jsonc` (`linklist` dev +
  `linklist-dist` prod targets → `packages/server/build/dist`). Root tasks
  `deno task build` / `bundle` / `site` / `preview` / `dev`.
- ✅ **M4** — Build-time plugin system. Pure contract + orchestration in
  `core/src/plugin.ts` (`LinklistPlugin` / `PluginContext` with an **injected**
  `fetchJson`, `runPlugins` isolates per-plugin failures, `mergePluginOutputs` appends
  without mutating). First plugin `github-repos` (`packages/plugins/src/github_repos.ts`)
  renders GitHub stars + latest release as a static Markdown section, registered in
  `builtinPlugins`. `build` runs plugins by default (`--no-plugins` skips; `GITHUB_TOKEN`
  raises rate limits). Also made the build **host-path agnostic**: internal assets use
  relative `./` paths (serve from a domain root OR `/subfolder/`), while absolute
  canonical/OG/sitemap URLs come from `config.seo.url`. Tests: 25 suites / 51 steps green
  (linklist packages, offline via `--no-plugins` + mocked `fetchJson`).
- ✅ **M4b** — Client-render pivot (buildit-only): removed the `cli` package and the
  build-time pre-render (`render.ts`). `index.html` is now a static shell and
  `linklist.js` (bundled from `core/src/entry.ts`) fetches `config.json`, validates,
  runs plugins, injects the SEO head at runtime (`core/src/head.ts` → `applyHead`),
  applies the theme (preset CSS fetched from the static dir + token overrides) and
  renders. Plugins now run in the browser (built-in + optional third-party
  `theme.script` / `plugins.scripts` via `import()`); the whole build (clean +
  copyFiles + bundle + version) is declared in `scripts/esbuild.jsonc`; the footer
  shows `v<APP_VERSION>`. No service worker. Gates: check/lint/fmt clean, 19 suites /
  43 steps green.
- ✅ **M5** — Removed the mdBlog engine. Deleted `packages/mdblog` (all 57
  source/test/asset files), dropped it from the workspace and from `versionPaths`, and
  stripped its `mdblog`/`dist` targets from `scripts/esbuild.jsonc`,
  `scripts/denobuild.jsonc` and `scripts/watch.jsonc` (watch now rebuilds `linklist`).
  Repointed CI: `pages.yml` builds the default `linklist` esbuild target into
  `packages/server/build/dist` and the stale Service-Worker rationale was removed; the
  `jsr-publish.yml` workflow was deleted (all packages are `publish:false`, so
  `lint:doc:all` was dropped from the `tests` composite). Renamed the server package
  `@mdblog/server` → `@vanaware/linklist-server`. `deno task tests` (check:all + lint +
  fmt:check + test) is fully green for the whole workspace (19 suites / 43 steps).
- ✅ **M5b** — Documentation & onboarding polish. Rewrote the docs for linklist and
  deleted the obsolete mdBlog articles (`islands.md`, `wire-format.md`, `flows.md`,
  `syntax-and-islands.md`). The `docs/` set is now: `README.md` (index), `guide.md`
  (getting started), `configuration.md` (full `config.json` reference), `theming.md`,
  `plugins.md`, `deploy.md` (GitHub Pages + other hosts + custom domain) and a rewritten
  `api-reference.md` (the `@vanaware/linklist-core` public surface). Reframed
  `publish-jsr-rules.md` as a deferred-publishing guide (matches the removed JSR workflow).
  Added root `CONTRIBUTING.md`, a `templates/` starter (`minimal.config.json` + README), a
  Documentation section + token-name fix in `README.md`, and cleaned the stale "`cli`"
  references in `schema.ts`/`theme.ts` header comments. `deno task tests` stays green.
- ✅ **M5c** — Core consolidation. Folded the standalone `packages/themes` (CSS presets →
  `packages/core/themes/`) and `packages/plugins` (`github_repos` + `builtinPlugins` →
  `packages/core/src/plugins/`) into `packages/core`; `entry.ts` imports `builtinPlugins`
  locally and `mod.ts` re-exports them. Removed the third-party extension hooks
  (`config.theme.script`, `config.plugins.scripts`) from the types, validator, `entry.ts`
  and the JSON schema — the engine ships defaults-only until stable (runtime `theme.js` /
  `plugin.js` discovery is deferred). Deleted both packages, dropped them from the workspace
  and `versionPaths`, repointed the `esbuild`/`denobuild`/`watch`/`export` configs, `AGENTS.md`
  and all docs. `deno task tests` green (19 suites / 44 steps); `build:deno` still emits the
  full static site.
- ✅ **M5d** — Example → core. Moved `example/config.json` →
  `packages/core/public/config.json` (the annotated sample that also powers the official
  site) and `example/config.schema.json` → `packages/core/schema/config.schema.json`, then
  deleted the `example/` dir. Build `copyFiles` now ships `config.json` from `public` and
  publishes the schema from `packages/core/schema` — both land at the dist root so
  `https://vanaware.github.io/linklist/config.schema.json` resolves; the `linklist` `$schema`
  key, templates and all docs point at that published URL. `deno task tests` green;
  `build:deno` emits both files into dist.
- ✅ **M5e** — Templates → docs. Moved the root `templates/` dir (minimal starter
  `config.json` + its README) into `docs/templates/`, since it is onboarding material.
  Repointed the root `README.md`, `docs/README.md` (new index entry), `docs/guide.md`
  (`cp docs/templates/…`) and the moved README's relative links. The `export.jsonc`
  `docs` mode already covers `docs/**` — no build/CI change needed.
- ⏭️ **M6 (next)** — Lighthouse + WCAG 2.1 AA checklist on the built example; document
  results.

## Known environment note

The mdBlog package is gone, so `deno task tests` runs the linklist packages only and is
fully green. esbuild still cannot run in THIS container (its npm subprocess fails with
`ChildProcess.unref` undefined even with `-A`) — a sandbox limitation, not a code bug, and
CI runners build fine. For a working local preview here, run `deno task build:deno` (Deno's
in-process bundler) to emit `linklist.js`, then `deno task serve`. Note that a
previously-installed mdBlog Service Worker can keep serving cached pages on an origin
(`:8000`) even after removal — clear the site data or use a fresh port (`:3000`).
