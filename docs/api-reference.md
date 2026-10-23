# API reference — `@vanaware/linklist`

The public surface is re-exported from `packages/core/src/mod.ts`. Core is **pure**: the
public engine (`lib/` + `cli.ts` pieces) performs no filesystem or network
access — it returns types, strings and command objects. Side effects live only at two
edges: the **browser entry** (`entry.ts`, bundled into `linklist.js`, *not* exported) and
the **CLI writers** (`cli.ts`, exported as command objects that never run on import).

### Why `mod.ts` and the bundled `linklist.js` are two surfaces

`index.html` loads exactly one script, `./linklist.js` — the bundle of `entry.ts`. It
boots itself on import (fetch → validate → theme → render), so it
cannot be a library export: importing it would run all of that. `mod.ts` is the
opposite contract — the same engine with **zero import-time side effects**, for
embedding in your own tooling or the future SaaS tier:

| | `entry.ts` → `linklist.js` | `mod.ts` → `@vanaware/linklist` |
| --- | --- | --- |
| Loaded by | `index.html` (the static site) | your code (`import` / JSR) |
| Side effects on import | starts the app | none |
| I/O | fetches `./config.json`, presets | caller supplies everything |
| Use when | you host the ready-made page | you validate, generate or script yourself |

Import from the package root:

```ts
import { parseAndValidate, generateSite, linklistCommand } from "@vanaware/linklist";
```

The Preact runtime (`components/`, `markdown.ts`, `state.ts`) and the raw ArkType
`configType` are **internal** — they are not re-exported from `mod.ts` because npm
type graphs (preact/signals/arktype) cannot pass JSR doc-lint as a public surface.
Consume them through the bundle or monorepo deep imports (see the sections below).

---

## Types

Described in full in the [Configuration reference](configuration.md).

| Type | Purpose |
| --- | --- |
| `LinklistConfig` | Top-level config object (`blocks` is the ordered page content; `footer` optional). |
| `Profile`, `LinkItem`, `ContentSection` | Identity (screen fields + head-only overrides + `hide`), links (incl. `image`/`image_alt`), Markdown bodies. |
| `Block`, `LinkBlock`, `SectionBlock`, `ImageBlock`, `IslandBlock` | The `blocks[]` discriminated union the validator builds from each authored block's `format`. |
| `BlockFormat` | `"row" \| "button" \| "card" \| "text" \| "figure" \| "island"` — the predefined presentation each block names. |
| `FooterConfig` | Optional footer line (`show_last_updated`, `label`). |
| `ProfileField` | `"tagline" \| "bio" \| "avatar" \| "location"` — values accepted by `profile.hide`. |
| `ThemeConfig`, `ThemeTokens` | Appearance. |

---

## Validation (`lib/schema.ts`)

Built on ArkType plus a **block classifier** and semantic cross-field checks: every
authored `blocks[]` item names a `format`, and `validateConfig` builds each one's
discriminated render shape (`row`/`button`/`card` → a `link`, `text`/`card_text` →
a `section` (`card_text` sets `framed: true`), `figure`/`card_figure` → an `image`
(`card_figure` sets `framed: true`), `island` → an `island` with a validated safe
`name`) before returning the typed config.
Pure — no I/O.

```ts
// internal (arktype is an npm dependency; `configType` is not JSR-public)
const configType: Type<LinklistConfig>

function validateConfig(raw: unknown): ValidationResult
function parseAndValidate(jsonText: string): ValidationResult

type ValidationResult = ValidationSuccess | ValidationFailure
interface ValidationSuccess { ok: true;  data: LinklistConfig }
interface ValidationFailure { ok: false; errors: string[] }     // path-pointed, human-readable
```

`parseAndValidate` is `JSON.parse` + `validateConfig` with a friendly error when the JSON
itself is malformed. Use it on raw `config.json` text; use `validateConfig` on an
already-parsed object.

```ts
const result = parseAndValidate(await Deno.readTextFile("config.json"));
if (!result.ok) console.error(result.errors);
else generateSite(result.data);      // or your own consumer
```

---

## Markdown (`components/markdown.ts`) — internal

Not exported from `mod.ts` (npm type graph). Inside the bundle / monorepo:

CommonMark + GFM (tables, strikethrough, task lists) rendered straight to Preact VNodes.
Raw HTML is dropped, so output is XSS-safe. Used for `bio`, `tagline`, section bodies,
link subtitles and the footer.

```ts
function renderMarkdown(markdown: string): ComponentChildren        // block-level
function renderInlineMarkdown(markdown: string): ComponentChildren  // inline only
```

---

## Reactive state (`components/state.ts`) — internal

Not exported from `mod.ts` (npm type graph). Central store on `@preact/signals`
(the project forbids `useState`/`useEffect` for global state).

```ts
const configSignal: Signal<LinklistConfig | null>   // null until setConfig()
function setConfig(config: LinklistConfig | null): void
```

---

## Components (`components/*`) — internal

Not exported from `mod.ts` (npm type graph); they run inside `linklist.js`. Preact +
`htm/preact` functions, styled with BeerCSS semantic classes. They read from the
signals above (or explicit props where noted).

| Export | Notes |
| --- | --- |
| `App` (`AppProps`) | Root: renders the profile header, then `config.blocks` in declared order (takes a `config` prop). |
| `ProfileHeader` | Name (`<h1>`, always), tagline, bio, avatar, location — skipping fields listed in `profile.hide`. |
| `LinkList`, `LinkRow` | Consecutive `link` blocks grouped into one list; `LinkRow` renders one `LinkItem` in its `format` (image thumbnail when `image` is set, else `icon`). |
| `ContentSection` | One `section` block (heading + Markdown body). |
| `ImageBlock` | One `image` block — a `<figure>` with `<img>` (alt guaranteed) and optional `<figcaption>`. |
| `IslandBlock` | One `island` block — a static `[data-island]` placeholder (+ `data-props` JSON) that `entry.ts` hydrates from `./islands/<name>.js` at runtime. |
| `MarkdownText` | Renders a Markdown string inline or as a block. |
| `BrandIcon` | Icon for a `LinkItem.icon` name (Material symbols). |
| `Footer` | Last-updated / custom footer line with the build version stamp. |

```ts
// monorepo deep import only — not part of the JSR surface
import { h, render } from "npm:preact";
import { App } from "./packages/core/src/components/App.ts";
render(h(App, { config: validConfig }), document.getElementById("app"));
```

---

## Theme (`lib/theme.ts`)

Pure string/CSS helpers. `theme.custom` maps onto **BeerCSS design tokens**
(`--primary`, `--on-primary`, `--primary-container`, `--on-primary-container`,
`--font`); surfaces and elevation stay owned by BeerCSS per light/dark mode.

```ts
function tokensToCss(tokens?: ThemeTokens): string  // :root { … } BeerCSS token block (may be "")
function readableInk(background: string, darkInk?: string, lightInk?: string): string
function themeBodyClass(theme?: ThemeConfig): string      // "dark" | "light" | "" (auto, resolved at runtime)
function themeColor(theme?: ThemeConfig): string          // theme-color meta (default "#6750a4")
```

---

## SEO metadata builders (`lib/seo.ts`)

Pure functions returning strings — no DOM, no filesystem. The generated head is baked
into `index.html` at build time (see `generate.ts`), so crawlers and link-preview
scrapers read it without JavaScript. The SaaS tier reuses these verbatim.

```ts
function buildHead(config: LinklistConfig, opts?: { baseUrl?: string }): string  // <title>+meta+link+JSON-LD
function buildJsonLd(config: LinklistConfig, base?: string): Record<string, unknown>  // schema.org Person
function faviconDataUri(name: string, color: string): string                    // inline SVG initial tile
function escapeHtml(value: string): string
function safeJson(value: unknown): string                                        // escapes "<"
```

---

## Static site generation (`lib/generate.ts`)

Turn a validated config into the full text of the publishable files. Pure — the CLI
writes these outputs; a future server can stream them. The HTML shell is embedded in
code (no template file).

```ts
interface GeneratedFile { name: string; content: string }

function renderIndexHtml(config, opts?: { baseUrl?: string }): string   // complete index.html (head baked in, no-JS fallback)
function renderManifest(config): string                                 // PWA manifest; icons reference profile.avatar
function renderRobotsTxt(config, opts?: { baseUrl?: string }): string   // allow-all crawler policy
function generateSite(config, opts?: { baseUrl?: string }): GeneratedFile[]  // the three files
```

---

## CLI (`cli.ts`)

A Cliffy program (`linklistCommand`) with `build` and `validate` subcommands, exported
as the root command object plus `buildSiteFiles` — importing never runs anything.
`build` writes `generateSite` output into the public folder (defaults `--config
packages/core/public/config.json`, `--out packages/core/public`); `validate` replaces the
former `scripts/validate.ts` and defaults to the same config path. Reach subcommands via
`linklistCommand.getCommand("build")` if needed. Drive them with `deno task linklist:build`
and `deno task validate-config [path]`.

```ts
async function buildSiteFiles(config, outDir: string, opts?: { baseUrl?: string }): Promise<string[]>
const linklistCommand: Command   // .command("build") + .command("validate [path]")
```

---

## Version

The version is not exported from `mod.ts`: `src/version.ts` is generated and
stamped (`__APP_VERSION__`) by the buildit scripts on every build, and consumed
by the `Footer` component as `APP_VERSION`. Treat it as build metadata, not API.

---

## Browser entry (`entry.ts`)

Not part of `mod.ts`. This is the bundle's `main`: it fetches `./config.json` (relative, so
it works under any base path), runs `parseAndValidate`, feeds failures to an error view,
otherwise installs the config with `setConfig`, applies the theme (body class +
preset CSS + `theme.custom` tokens), and renders `<App/>`. The `<head>` is NOT touched here
— it is finalized into `index.html` at build time. The body is client-rendered and the
config is never embedded.

Before rendering, the entry publishes the shared Preact/Signals surface on
`globalThis.linklistRuntime` (`h`, `render`, `hydrate`, `html`, `signal`, `computed`,
`effect`, `batch`, `useSignal`, `useComputed`), then — after the app mounts — hydrates
every `[data-island]` placeholder by dynamically importing its `./islands/<name>.js`
module and rendering the exported component with the `data-props` as props. Islands
reuse this single Preact instance (never a second copy); a missing/failed island simply
leaves the static placeholder in place. See [Islands](islands.md).
