# Plugins

Plugins fetch remote data and contribute extra **links** or **sections** to the page.
They run wherever the host puts them — in the browser for the static site, or at build
time for the future SaaS tier — and they **only fire when you add a matching block**.
Nothing is fetched by default, and there is no analytics or tracking.

The key design rule: a plugin never reaches for `fetch` or the filesystem itself. The
host injects those capabilities through the `PluginContext`, which is what makes the same
expander reusable in the browser, at build time, and in tests (with a mocked fetch).

## A plugin is a block that carries its own data

There is no global `plugins` section. A plugin is just a `{ "format": "repos" }` block,
placed exactly where you want its output to appear:

```jsonc
{
  "blocks": [
    { "format": "row", "title": "GitHub", "url": "https://github.com/janedoe" },
    { "format": "repos", "repos": ["vanaware/linklist", "vanaware/buildit"] }, // ← position *and* data
    { "format": "text", "title": "About", "body": "…" }
  ]
}
```

The validator classifies this block as `{ type: "plugin", name: "github-repos", repos }`,
and at build/boot `resolveBlocks` replaces it **in place** with the blocks the expander
returns (`link` and/or `section` blocks). A `repos` block with an empty list — or one
whose fetch fails — simply vanishes; the rest of the page renders.

## The contract

From `@vanaware/linklist`:

```ts
interface PluginContext {
  fetchJson(url: string): Promise<unknown>; // provided by the host; mocked in tests
  warn(message: string): void;              // non-fatal, human-readable warning
}

interface BlockExpander {
  name: string;                                             // matches the block's plugin id
  expand(repos: string[], ctx: PluginContext): Promise<Block[]>; // blocks to splice in place
}
```

Orchestration (also exported by core):

- `resolveBlocks(config, ctx, expanders)` walks `config.blocks`: each `plugin` block is
  replaced **in place** by its expander's `expand(repos, ctx)` output; other blocks pass
  through untouched, so the declared order is the final display order and the config is
  never mutated. Expansion is async because fetchers run here; per-item failure isolation
  lives inside each expander.

The browser entry (`packages/core/src/entry.ts`) wires this up: it supplies `fetchJson`
as a real `fetch` (JSON, `accept: application/json`) and calls `resolveBlocks` with the
`builtinExpanders` before rendering.

## Built-in: `github-repos`

Add a `{ "format": "repos" }` block listing repositories as `owner/repo`:

```jsonc
{
  "blocks": [
    /* … */
    { "format": "repos", "repos": ["vanaware/linklist", "vanaware/buildit"] }
  ]
}
```

For each repo it calls `https://api.github.com/repos/<owner>/<repo>` for the star count
and `…/releases/latest` for the tag, then emits a single **"GitHub"** section at the
block's position as a Markdown list, e.g.:

```markdown
- [vanaware/linklist](https://github.com/vanaware/linklist) — ★ 12 · v0.1.9
```

Behavior notes:

- A repo with no releases returns `404`; the line keeps just the stars (expected).
- A repo whose metadata fetch fails degrades to a plain `- [owner/repo](…)` link, so one
  bad fetch cannot break the section.
- Requests are **unauthenticated** when running in the browser, so they share GitHub's
  low per-IP anonymous rate limit. Keep the list short.
- The static (`cli.ts`) build never fetches: plugin blocks are only resolved in the
  browser (or at build time by a future server tier), so the `<noscript>`/JSON-LD output
  reflects authored link blocks only.

The built-in expanders live in core (`builtinExpanders` in `packages/core/src/plugins/mod.ts`,
re-exported from `@vanaware/linklist`). To add a first-party plugin, implement a
`BlockExpander`, drop it under `packages/core/src/plugins/`, export it, and append it to
`builtinExpanders`. The static build also needs a `plugin` block name it recognizes to
bake data — for now the only built-in is `github-repos`.

> Runtime third-party `plugin.js` scripts are intentionally deferred until the expander
> engine is stable.
