# @vanaware/linklist — Status & Next Task

`@vanaware/linklist` is a link-in-bio site generator derived from `@vanaware/mdBlog`.
Read `AGENTS.md` for the rules; this file tracks decisions, milestone status and the
next task.

## Confirmed architecture decisions

- **UI stack — retained from mdBlog**: Preact + `@preact/signals` (components/state),
  **BeerCSS** for styling (loaded via **CDN**, exactly as mdBlog does today), and the
  **Markdown** pipeline for user-authored text.
- **Render model — static head + client-rendered body**: the build bakes the
  per-profile SEO `<head>`, the PWA `manifest.json` and `robots.txt` into real files
  (via `core/src/lib/generate.ts`), so crawlers and link-preview scrapers read the
  metadata **without JavaScript**. `index.html` also ships a generic `<noscript>`
  Linklist fallback listing the profile links. At runtime `linklist.js` (from
  `core/src/entry.ts`) fetches `./config.json` (relative, so it works at a domain root
  OR subfolder), validates it, runs plugins, applies the theme and hydrates the Preact
  `App` into `#app` — it no longer injects the head (`applyHead`/`headFragment` are
  gone). The config is still NEVER embedded; no-JS visitors get the `<noscript>`
  fallback only.
- **Build = codegen + buildit**: `deno task linklist:build` runs the core Cliffy CLI
  (`core/src/cli.ts build`) to write `index.html` / `manifest.json` / `robots.txt` into
  `packages/core/public`, then the bundler task (`esbuild` or `denobuild`) copies
  `public` + theme CSS (`packages/core/themes`) + the config schema
  (`packages/core/schema`) into `packages/server/build/dist` and bundles
  `core/src/entry.ts` → `linklist.js`. **The preferred engine is esbuild**;
  `deno task denobuild` runs the same build through Deno's IN-PROCESS bundler
  (`scripts/denobuild.jsonc`) for sandboxes where esbuild's subprocess cannot spawn.
  Both tasks chain `linklist:build` first. `deno task dev` = `denobuild` then the
  `packages/server` static server (`serveDir`) on the port from `packages/server/.env`
  (`PORT`, 3000 or 8000) — the dir `pages.yml` deploys. The generated
  `public/{index.html,manifest.json,robots.txt}` are build artifacts and are
  **git-ignored** (regenerated on every build, so a fresh clone needs no manual step).
- **Markdown is allowed in**: `profile.bio` / `tagline`, dedicated about/section
  blocks, per-link `subtitle`, and the footer line (not plugin output areas, for now).
- **Config**: a single `config.json` (JSON, not YAML) validated with **ArkType**
  (`npm:arktype`). Structure mirrors `packages/core/src/lib/types.ts`.
- **CLI lives in core** (reverses the earlier "no CLI package" stance): the former
  `packages/cli` is gone, but a small Cliffy program (`core/src/cli.ts`, exported from
  `mod.ts` as command objects that never run on import) now owns two commands — `build`
  (static-site codegen) and `validate [path]` (config validation, formerly
  `scripts/validate.ts`, now deleted). Drive them with `deno task linklist:build` and
  `deno task validate-config <path>`.
- **Publishing scope**: `@vanaware/linklist-server` is a dev aid (local static preview
  server for development and tests) — it is NOT a library and will never be published;
  it stays `publish: false` permanently. The only future JSR publication candidate is
  `@vanaware/linklist` (currently deferred, see `docs/publish-jsr-rules.md`).
- **Themes & built-in plugins live in core**: BeerCSS presets are selectable via
  `config.theme.preset` + token overrides and live in
  `packages/core/themes/{minimal-dark,light-simple}.css`, merged with `config.theme.custom`
  by `core/src/lib/theme.ts`. The plugin engine (`core/src/plugins/engine.ts`) and the default plugins
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
  class, plus a pure theme resolver in `core/src/lib/theme.ts` (`tokensToCss`,
  `resolveThemeCss`, `themeBodyClass`, `themeColor`). Token overrides + color-scheme mode
  flow from `config.theme`.
- ✅ **M3** — Static assembly. `core/src/lib/seo.ts` (pure head/OG/Twitter/JSON-LD/manifest/
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
  `api-reference.md` (the `@vanaware/linklist` public surface). Reframed
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
- ✅ **M5f** — Design polish & visual QA (pure BeerCSS). Redesigned both presets
  (hero profile, elevated link cards with icon tiles/chevrons, gradient featured
  variant) and namespaced every theme token as `--ll-*` so BeerCSS-owned MD3 vars
  can never override them. A browser-preview audit then caught three real bugs,
  all fixed: (1) BeerCSS paints `header`/`footer` with a light
  `--surface-container` — added a `.linklist` landmark reset so profile/footer sit
  on the page background; (2) `li.link.button` was hijacked by BeerCSS's `.button
  component` — variant classes renamed to `is-button`/`is-featured`; (3) brand
  names (`mastodon`, …) are not Material ligatures — `BrandIcon` now ships 13
  inline simple-icons SVGs. Also added: `readableInk` (WCAG luminance-based
  on-primary ink auto-derived from any custom `primary_color`), a placeholder
  `public/assets/avatar.svg`, and a one-time stale-Service-Worker purge in
  `entry.ts`. Verified in-browser: landmark contrast 16:1, GitHub button 6.17:1
  (AA), equal card widths, 0 SW registrations. This also kickstarts M6 (the AA
  checklist half); Lighthouse still to do.
- ✅ **M5g** — Link-row width parity + responsive layout. Live measurement showed
  the link cards (~258px) were narrower than every other block (~404px): BeerCSS
  sets `justify-content: flex-start` on `ul`, so `.links`' implicit single `auto`
  grid track sized to max-content instead of filling. Fixes in both presets:
  explicit `grid-template-columns: 1fr` on `.links`, `white-space: normal` added
  to the landmark reset (BeerCSS forces `nowrap` on `nav`), and
  `overflow-wrap: anywhere` on titles. Responsiveness: `#app { width: 100% }` +
  `margin-inline: auto` on `.linklist` (the shrink-wrapped flex-item mount was
  capping the column below its `max-width`), a `max-width: 24rem` query (tighter
  gutters, smaller avatar/name) and a `min-width: 48rem` query (44rem column,
  2-column link grid). Verified in-browser at 360/682/900/1400: card widths ==
  sections, no horizontal overflow, 44rem cap reached and centered.
- ✅ **M5h** — All-theme visual audit + `--ll-link` contrast guard. Rendered and
  audited BOTH presets in-browser (first time `light-simple` was ever rendered):
  the preset itself is AA-clean, but the audit exposed that a config's custom
  `primary_color` used as _text_ (section/footer links, icon tints, focus rings)
  can fall to 2.5:1 on a light background. Added `readableLink()` (blends the
  brand hue toward black/white in 5% steps until ≥4.5:1 vs the background) and a
  new `--ll-link` token: presets use it for all text/icon/focus roles, with
  `:root { --ll-link: var(--ll-primary) }` fallback; `tokensToCss` derives it
  against `custom.background_color` or the preset's own `--ll-background`
  (new `presetVariable()` parser in `resolveThemeCss`). Chevron opacity 0.6→0.8.
  Approved screenshots of each theme saved to `docs/assets/screenshots/` and
  embedded in `README.md` (Theming) and `docs/theming.md` (which also got its
  stale pre-`--ll-*` token table and preset guidance fixed).
- ✅ **M5i** — Core source refactor & API surface cleanup. Folded `head.ts` into
  `seo.ts` (`applyHead`/`headFragment` were a thin shell over `buildHead`), moved
  the plugin engine to `plugins/engine.ts`, and relocated the render-support
  modules `state.ts` + `markdown.ts` into `components/` (their only consumers).
  Deleted the dead exports (`IO` type, `CORE_VERSION` const, `schema_smoke_test.ts`);
  `version.ts` stays (buildit-generated, consumed by `Footer`). Unified the package
  name: every doc/JSDoc reference to the stale `@vanaware/linklist-core` now reads
  `@vanaware/linklist` (the actual `deno.jsonc` name). Documented WHY the public
  API (`mod.ts`, side-effect-free) and the bundle (`entry.ts` → `linklist.js`,
  self-booting) are two surfaces of one engine — they intentionally differ; a
  comparison table now lives in `docs/api-reference.md`. Further consolidated the
  pure engine under `core/src/lib/` (`types.ts`, `schema.ts`, `theme.ts`, `seo.ts`);
  `src/` now holds only `mod.ts`, `entry.ts`, `version.ts`, `components/` and `plugins/`.
- ✅ **M6** — Build-time static head + site codegen CLI. Added
  `core/src/lib/generate.ts` (pure `renderIndexHtml` / `renderManifest` /
  `renderRobotsTxt` / `generateSite` — the full text of each file is embedded in code,
  no template read/modify, reusable by a future server) and `core/src/cli.ts` (Cliffy
  `linklistCommand` with `build` + `validate` subcommands + `buildSiteFiles`, exported
  from `mod.ts`, guarded by `import.meta.main`). Removed `applyHead`/`headFragment`
  from `seo.ts` and the `applyHead` call from `entry.ts` — the head is now baked at
  build. Added `@cliffy/command` to core; added the `linklist:build` task and chained
  it into `esbuild`/`denobuild`; repointed `validate-config` to the CLI and deleted
  `scripts/validate.ts`; fixed `dev` (it referenced a nonexistent `build`). New tests
  (`generate_test.ts`, `cli_test.ts`) + `seo_test.ts` cleanup: 25 suites / 61 steps
  green; verified `linklist:build` writes baked head + manifest and `denobuild` ships
  them to dist with 0 `applyHead` in the bundle.
- ⏭️ **M7 (next)** — Lighthouse + WCAG 2.1 AA checklist on the built example; document
  results (AA contrast portion already covered in M5f).

## Known environment note

The mdBlog package is gone, so `deno task tests` runs the linklist packages only and is
fully green. esbuild still cannot run in THIS container (its npm subprocess fails with
`ChildProcess.unref` undefined even with `-A`) — a sandbox limitation, not a code bug, and
CI runners build fine. For a working local preview here, run `deno task denobuild`
(Deno's in-process bundler; it runs `linklist:build` first) to emit the codegen files +
`linklist.js`, then `deno task dev` to serve `packages/server/build/dist`. Note that a
previously-installed mdBlog Service Worker can keep serving cached pages on an origin
(`:8000`) even after removal — clear the site data or use a fresh port (`:3000`).
