# Project Guidelines: @vanaware/linklist (Deno + Preact link-in-bio generator)

Welcome! This file (`AGENTS.md`) is automatically injected into the AI's system
instructions. `@vanaware/linklist` is a **link-in-bio site generator**: it turns a
single `config.json` into a fast, accessible, private page that deploys to GitHub
Pages (or Netlify / Vercel / Cloudflare Pages / Nginx).

It was originally derived from `@vanaware/mdBlog`, but the mdBlog engine has since been
removed. linklist reuses only that engine's UI stack — **Preact + `@preact/signals`,
BeerCSS, and a self-contained Markdown renderer** — to render a single bio page driven
by `config.json` (no article tree, no islands, no service worker). Follow these rules
strictly.

## 0. Language Rule (hard)

All source code, identifiers, comments, JSDoc, log messages, test names, docs and
commit messages are written in **English**. No exceptions.

## 1. Runtime & Environment (Pure Deno)

- **Deno Only**: runs entirely on Deno (see `.tool-versions`). Do NOT run
  `npm install` or rely on Node-only APIs.
- **Dependency Management**: dependencies are declared in `deno.jsonc` using
  `jsr:` and `npm:` specifiers. `npm:` specifiers are resolved by Deno and do NOT
  create a local `node_modules` — they are allowed (e.g. `npm:arktype`).
- **Validation**: config is validated with **ArkType** (type-first, via `npm:`).
- **JSR Publication (deferred)**: only `@vanaware/linklist` is ever a publication
  candidate; `@vanaware/linklist-server` is a dev-only static server and must stay
  `publish: false` permanently. Core is currently `publish: false`. The
  `.github/workflows/jsr-publish.yml` workflow is re-added as a release GATE: it
  runs `deno task lint:doc` and requires `packages/core/README.md`, so it fails
  today by design. Keep core JSR-clean anyway (complete JSDoc, valid
  `deno doc --lint`, README with an executable example per
  `docs/publish-jsr-rules.md`) and only then flip `publish: true`.
- **Bundling**: build with `@vanaware/buildit` (`deno task esbuild` / `denobuild`),
  emitting the static site into the server `build/dist/` directory.

## 2. Framework & State Management

- **Preact, not React**: use Preact via `htm/preact` (`html` tagged templates).
- **State via Signals**: all reactive state uses `@preact/signals`
  (`signal` / `computed` / `effect`). Do NOT use `useState`/`useEffect`/`useContext`
  for global or complex state; centralize signals/actions/derived state in the
  state module. The few allowed `useEffect` calls are for post-commit DOM work only.
- **Components**: keep UI modularized in `packages/core/src/components/`. There are no
  islands / `hydrateIslands()` — the page is a single client-rendered Preact tree.
- **Everything in core**: the theme engine (`core/src/lib/theme.ts`) lives in
  `packages/core`, alongside the shared `linklist-base.css` and the brand-skin CSS in
  `packages/core/themes`. There is no separate themes package, and no runtime
  third-party `theme.script` hook until the engine is stable.
- **Markdown for user text**: end-user text (bio / about / section copy, link
  subtitle, footer) is authored as **Markdown** and rendered by the self-contained
  GFM → Preact VNode renderer in `core/src/components/markdown.ts` (`renderMarkdown` /
  `renderInlineMarkdown`; raw HTML is dropped for XSS safety). Prefer Markdown for
  rich, editable copy.

## 3. UI & Styling (BeerCSS)

- **BeerCSS (Material Design 3)** is the styling system. No Tailwind CSS.
- **Pure BeerCSS markup**: components emit BeerCSS tags/classes directly (`a.button`,
  `ul.grid` + `li.s12.m6`, `img.circle`/`img.round`, `h*`, `.small-text`/`.medium-text`,
  bare `<i>` Material glyphs). Do NOT reintroduce a namespaced `--ll-*` token system or
  bespoke component classes; the reserved `.icon` class must never be used to style an
  icon. `docs/beercss.md` is the source of truth for available classes/tokens.
- **Theming**: dark/light come from BeerCSS's own `body.dark`/`body.light`; `mode: "auto"`
  is resolved without FOUC by a small inline `<head>` script. `config.theme.preset` selects
  a **brand skin** (`violet`, `indigo`) that overrides only BeerCSS color tokens, and
  `config.theme.custom` (`primary_color`, `font_family`) maps onto those tokens via
  `theme.ts` `tokensToCss` — never hand-written layout CSS. Shared, color-free layout
  (column width, landmark reset, full-width buttons, vertical rhythm) lives once in
  `linklist-base.css`.
- **Open decision (tracked in `CURRENT.md`)**: whether BeerCSS + fonts are served
  from a **CDN** (as mdBlog does today) or **self-hosted** in the bundle. Prefer
  self-hosting when it does not compromise the simplicity of the pipeline; until
  decided, follow the existing CDN pattern.
- **Icons**: Google Material Symbols via the `<i>icon_name</i>` pattern, plus
  inline brand SVGs (e.g. Simple Icons) selected by name in config.

## 4. Product Goals (non-negotiable, reconcile with the stack)

- **Performance**: aim for a high Lighthouse score; ship minimal, code-split JS.
- **Accessibility**: target **WCAG 2.1 AA** — semantic landmarks, visible focus,
  correct ARIA, keyboard order, `alt` required for avatars, real `<a>` links.
- **Privacy off-by-default**: analytics / click counting are DISABLED unless the
  config explicitly enables them. No user tracking.
- **Static, portable output**: the build (`deno task esbuild` / `denobuild`) emits a
  self-contained site under `dist/` (`index.html` with a finalized SEO head, theme CSS,
  assets, favicon, `manifest.json`, `robots.txt`, `linklist.js`).
- **Progressive enhancement (static head + client body)**: the document `<head>`
  (title, OG, Twitter, JSON-LD, theme-color, favicon) and the PWA `manifest.json` are
  baked into `index.html` at BUILD time by `packages/core/src/cli.ts build` (task
  `linklist:build`), using the pure builders in `lib/seo.ts` + `lib/generate.ts` — so
  crawlers and no-JS link-preview scrapers read real metadata. `linklist.js` then
  hydrates the page body (theme, Preact) at runtime. There is NO runtime DOM
  head-injection (`applyHead` was removed); the served shell already carries the head.

## 5. Testing Standard

- **BDD Style**: tests use `@std/testing/bdd` (`describe` / `it`); assertions use
  `@std/assert`. Do NOT use raw `Deno.test()` for new tests.
- **Testability**: pure validation/render logic is unit-tested without network;
  IO-backed code is tested with injected/mocked I/O.
- **Command**: `deno task test` (or `deno task tests` for the full gate).

## 6. Architecture & SaaS Readiness

- **Decouple schema + render logic from I/O**: keep `packages/core` free of
  filesystem/network. The only DOM-aware module is the browser entry
  (`core/src/entry.ts`, bundled to `linklist.js`, not exported from `mod.ts`);
  the little filesystem I/O the tooling needs lives in `scripts/`. This keeps
  `core` reusable by a future hosted SaaS. Keep `core` self-contained.
- **Build is declarative (buildit)**: the whole static-site build (clean output,
  copy the shell/themes/config, bundle the entry, stamp the version) is driven by
  `scripts/esbuild.jsonc` targets, not by a bespoke CLI command.
- **Config is a single `config.json`** (JSON, not YAML) so the same object can
  later be served like a database record by the paid tier; keep it serializable
  and versioned.

## 7. Offline, PWA & Deployment

- **Relative base paths (GitHub Pages subfolder support)**: never hardcode
  repository names or root-absolute paths; derive paths from the document base so
  the site works under any deployment folder and any static host.
- **Manifest**: PWA manifest lives in the public assets; assets in `public/` are
  copied into the distribution during build.
- **Custom domain**: documented in the README (CNAME + DNS), never hardcoded.
- **CI/CD**: `.github/workflows/pages.yml` builds and deploys the site
  (`packages/server/build/dist`); `ci.yml` runs the test/lint/format gate. (JSR
  publishing is deferred — see §1.)

## 8. Development Workflow & Continuous Validation

- **Mandatory verification** after any change: `npm run lint` (runs `deno check`)
  and `deno task test`.
- **Proactive unit tests**: every new function/utility/complex branch gets a
  `@std/testing/bdd` test without being asked.
- **Incremental delivery**: work milestone by milestone and pause for confirmation
  before large or destructive blocks. Update `CURRENT.md` with status and next task.

We are developing `@vanaware/linklist` following a planned directive. For current
status and the next task, read `CURRENT.md`.
