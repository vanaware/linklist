# @vanaware/linklist — Documentation

`@vanaware/linklist` turns a single `config.json` into a fast, accessible, private
link-in-bio page that you can host on GitHub Pages or any static host. The page is
rendered entirely in the browser: the build emits a tiny static `index.html` shell plus
`linklist.js`, which fetches `./config.json` at runtime, validates it, runs content
plugins, applies the SEO head, resolves the theme and renders the Preact app.

## Reading order

1. **[Guide](guide.md)** — install, configure, preview, build and ship your first page.
2. **[Configuration reference](configuration.md)** — every field of `config.json`, with
   validation rules and examples.
3. **[Theming](theming.md)** — presets and token overrides.
4. **[Plugins](plugins.md)** — the built-in `github-repos` plugin and the plugin contract.
5. **[Deploy](deploy.md)** — GitHub Pages, other static hosts and custom domains.
6. **[API reference](api-reference.md)** — the public surface of
   `@vanaware/linklist-core` (for embedding the engine in your own tooling or the future
   SaaS tier).
7. **[Site templates](templates/README.md)** — starter `config.json` files (e.g.
   `minimal.config.json`) ready to copy and edit.

## Key facts

- **Runtime**: Deno 2.x (pure — no Node runtime, no `node_modules` workflow).
- **UI**: Preact + `@preact/signals`, styled with BeerCSS (Material Design 3) via CDN.
- **Config**: one `config.json` (JSON, not YAML), validated with ArkType.
- **Render model**: pure client render — nothing is pre-rendered and the config is never
  embedded. No-JS visitors get the `<noscript>` notice.
- **Privacy**: no analytics or click tracking unless you explicitly enable it.
- **Build**: declarative, driven by [`@vanaware/buildit`](https://jsr.io/@vanaware/buildit)
  (`scripts/esbuild.jsonc` / `scripts/denobuild.jsonc`). No bespoke CLI.
- **Packages**: `@vanaware/linklist-core` (schema, render runtime, the theme + plugin
  engines and the built-in plugins — the only JSR publication candidate) and
  `@vanaware/linklist-server` (a local static preview server for development and tests —
  never published). Everything ships in core — there is no separate themes or plugins
  package.

> See `CURRENT.md` in the repository root for project status and the current milestone.
