# Plugins

Plugins fetch remote data and contribute extra **links** or **sections** to the page.
They run wherever the host puts them — in the browser for the static site, or at build
time for the future SaaS tier — and they **only fire when you opt them in via config**.
Nothing is fetched by default, and there is no analytics or tracking.

The key design rule: a plugin never reaches for `fetch` or the filesystem itself. The
host injects those capabilities through the `PluginContext`, which is what makes the same
plugin reusable in the browser, at build time, and in tests (with a mocked fetch).

## The contract

From `@vanaware/linklist-core`:

```ts
interface LinklistPlugin {
  name: string;                                   // unique id, used in logs
  run(ctx: PluginContext): Promise<PluginOutput>; // return data contributions
}

interface PluginContext {
  config: LinklistConfig;                         // validated, read-only source of truth
  fetchJson(url: string): Promise<unknown>;       // provided by the host; mocked in tests
  warn(message: string): void;                     // non-fatal, human-readable warning
}

interface PluginOutput {
  links?: LinkItem[];         // appended to the link list
  sections?: ContentSection[]; // appended after the links
}
```

Orchestration (also exported by core):

- `runPlugins(plugins, ctx)` runs plugins **in order and isolates failures** — a plugin
  that throws (a rate-limited or offline fetch, say) only logs a warning and is skipped,
  so the page still renders.
- `mergePluginOutputs(config, outputs)` returns a **new** config with links/sections
  appended; the original is never mutated.

The browser entry (`packages/core/src/entry.ts`) wires this up: it supplies `fetchJson`
as a real `fetch` (JSON, `accept: application/json`), runs the built-in plugins, then
merges their output before rendering.

## Built-in: `github-repos`

Enable it by listing repositories as `owner/repo`:

```jsonc
{ "plugins": { "github_repos": ["vanaware/linklist", "vanaware/buildit"] } }
```

For each repo it calls `https://api.github.com/repos/<owner>/<repo>` for the star count
and `…/releases/latest` for the tag, then emits a single **"GitHub"** section
(placement `after`) as a Markdown list, e.g.:

```markdown
- [vanaware/linklist](https://github.com/vanaware/linklist) — ★ 12 · v0.1.9
```

Behavior notes:

- A repo with no releases returns `404`; the plugin keeps just the stars (expected).
- Requests are **unauthenticated** when running in the browser, so they share GitHub's
  low per-IP anonymous rate limit. Keep the list short.
- Any failure is isolated: the section is skipped and the rest of the page renders.

The built-in plugins live in core (`builtinPlugins` in `packages/core/src/plugins/mod.ts`,
re-exported from `@vanaware/linklist-core`). To add a first-party plugin, implement
`LinklistPlugin`, drop it under `packages/core/src/plugins/`, export it, and append it to
`builtinPlugins`.

> `plugins.youtube_channel` and `plugins.rss_feed` are validated config slots reserved
> for future plugins; they do nothing yet. Runtime third-party `plugin.js` scripts are
> intentionally deferred until the plugin engine is stable.
