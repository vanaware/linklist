# API reference — `@vanaware/linklist-core`

The public surface is re-exported from `packages/core/src/mod.ts`. Core is **pure**: it
performs no filesystem or network access and touches the DOM only when you call the
explicitly browser-aware helpers (`applyHead`, the render runtime). The one DOM-aware
module is the **browser entry** (`entry.ts`), which is *not* exported from `mod.ts` — it is
the bundled application bootstrap.

Import everything from the package root:

```ts
import { validateConfig, renderMarkdown, App } from "@vanaware/linklist-core";
```

---

## Types

Described in full in the [Configuration reference](configuration.md).

| Type | Purpose |
| --- | --- |
| `LinklistConfig` | Top-level config object. |
| `Profile`, `LinkItem`, `ContentSection` | Identity, links, Markdown blocks. |
| `ThemeConfig`, `ThemeTokens` | Appearance. |
| `SeoConfig`, `AnalyticsConfig`, `PluginsConfig` | Metadata, analytics, plugins. |
| `IO` | Reactive I/O seam (`readText`, optional `readBytes`). |

---

## Validation (`schema.ts`)

Built on ArkType plus semantic cross-field checks. Pure — no I/O.

```ts
const configType: ArkType            // the structural type for LinklistConfig

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
else render(result.data);
```

---

## Markdown (`markdown.ts`)

CommonMark + GFM (tables, strikethrough, task lists) rendered straight to Preact VNodes.
Raw HTML is dropped, so output is XSS-safe. Used for `bio`, `tagline`, section bodies,
link subtitles and the footer.

```ts
function renderMarkdown(markdown: string): ComponentChildren        // block-level
function renderInlineMarkdown(markdown: string): ComponentChildren  // inline only
```

---

## Reactive state (`state.ts`)

Central store on `@preact/signals` (the project forbids `useState`/`useEffect` for global
state).

```ts
export { computed, signal } from "@preact/signals"

const configSignal: Signal<LinklistConfig | null>   // null until setConfig()
function setConfig(config: LinklistConfig | null): void
const linksSignal:  Computed<LinkItem[]>            // [] before a config
const themeSignal:  Computed<string>                // preset name (defaults "minimal-dark")
```

---

## Components (`components/*`)

Preact + `htm/preact` functions, styled with BeerCSS semantic classes. They read from the
signals above (or explicit props where noted).

| Export | Notes |
| --- | --- |
| `App` (`AppProps`) | Root: renders profile, sections and links (takes a `config` prop). |
| `ProfileHeader` | Name (`<h1>`), tagline, bio, avatar, location. |
| `LinkList`, `LinkRow` | The link list; `LinkRow` renders one `LinkItem`. |
| `ContentSectionView` | One `ContentSection` (heading + Markdown body). |
| `MarkdownText` | Renders a Markdown string inline or as a block. |
| `BrandIcon` | Icon for a `LinkItem.icon` name (Material symbols). |
| `Footer` | Last-updated / custom footer line with the build version stamp. |

```ts
import { h, render } from "preact";
import { App, setConfig } from "@vanaware/linklist-core";
setConfig(validConfig);                     // optional: also drives the signals
render(h(App, { config: validConfig }), document.getElementById("app"));
```

---

## Theme (`theme.ts`)

Pure string/CSS helpers. The caller supplies the preset CSS; core never reads the
filesystem.

```ts
function tokensToCss(tokens?: ThemeTokens): string        // :root { … } overrides (may be "")
function resolveThemeCss(theme: ThemeConfig, presetCss: string): string
function themeBodyClass(theme?: ThemeConfig): string      // "auto" | "light" | "dark"
function themeColor(theme?: ThemeConfig): string          // theme-color meta (default "#6750a4")
```

---

## SEO metadata (`seo.ts`)

Pure builders returning strings; the entry (`head.ts`) applies them to the live DOM. The
SaaS tier reuses them verbatim.

```ts
function buildHead(config: LinklistConfig, opts?: { baseUrl?: string }): string  // <title>+meta+link+JSON-LD
function buildJsonLd(config: LinklistConfig): Record<string, unknown>            // schema.org Person
function faviconDataUri(name: string, color: string): string                    // inline SVG initial tile
function escapeHtml(value: string): string
function safeJson(value: unknown): string                                        // escapes "<"
```

---

## Runtime head injection (`head.ts`)

Browser DOM, but safe to import in non-DOM environments (it only touches `document` when
`applyHead` runs).

```ts
function headFragment(config: LinklistConfig): string                 // == buildHead(config)
function applyHead(config: LinklistConfig, doc?: Document): void     // idempotent; tags nodes data-ll-head
```

---

## Plugins (`plugin.ts`)

The contract and orchestration. Full walkthrough in [Plugins](plugins.md).

```ts
interface LinklistPlugin { name: string; run(ctx: PluginContext): Promise<PluginOutput> }
interface PluginContext  { config; fetchJson(url); warn(message) }
interface PluginOutput   { links?: LinkItem[]; sections?: ContentSection[] }

function runPlugins(plugins: LinklistPlugin[], ctx: PluginContext): Promise<PluginOutput[]>
function mergePluginOutputs(config: LinklistConfig, outputs: PluginOutput[]): LinklistConfig
```

Core also ships its default plugins: `builtinPlugins` (the list core runs) and
`githubReposPlugin` are exported from `@vanaware/linklist-core` (from `plugins/mod.ts`).
There is no separate plugins package.

---

## Version

```ts
export const CORE_VERSION = "0.1.0";   // kept in sync with the workspace by the build tooling
```

---

## Browser entry (`entry.ts`)

Not part of `mod.ts`. This is the bundle's `main`: it fetches `./config.json` (relative, so
it works under any base path), runs `parseAndValidate`, feeds failures to an error view,
otherwise installs the config with `setConfig`, runs the built-in plugins, merges their
output, calls `applyHead`, applies the theme (body class + preset CSS + `theme.custom`
tokens), and renders `<App/>`. Nothing is
pre-rendered and the config is never embedded — this is pure client render.
