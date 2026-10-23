# Islands

An **island** is a small interactive Preact component you drop into the ordered
`blocks` flow of an otherwise static page. It recovers the `@vanaware/mdBlog`
island idea (a folder of plain `.js` components hydrated in place) but adapted to
linklist's **pure-blocks** model: instead of a special Markdown syntax, an island
is just another block with `format: "island"`.

Everything around an island stays static and crawlable. The island only "wakes
up" once `linklist.js` has rendered the page and loaded that one module.

## 1. Add an island block

An island block names which component to load and (optionally) passes it props
as a plain `params` object:

```jsonc
{
  "blocks": [
    { "format": "row", "title": "GitHub", "url": "https://github.com/janedoe" },
    { "format": "island", "island": "Counter", "params": { "start": 3, "step": 2 } }
  ]
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `island` | string | **yes** | The island file name: loaded from `./islands/<island>.js`. A safe identifier only — letters, digits, `_` and `-`, starting with a letter (no slashes or `.`). |
| `params` | object | no | Passed verbatim as the component's props. Any JSON object. |

An island block breaks a run of consecutive link blocks like any other block, so
it sits on its own line in the layout.

## 2. How it renders

1. **Before hydration** the server-generated page shows a static placeholder:
   `<div class="block-island" data-island="Counter" data-props="{…}">` with a
   "Loading Counter…" note. This means the block has real markup even with no JS,
   and no-JS/crawler users never see a broken hole (the `<noscript>` fallback
   simply skips islands).
2. **After `linklist.js` renders** the app, the entry point scans for every
   `[data-island]` placeholder, reads its `data-props` JSON, and dynamically
   imports `./islands/<name>.js`.
3. **On success** the loaded component is rendered into the placeholder, sharing
   the app's single Preact instance. **On any failure** (missing file, network
   error, no exported component) the placeholder stays — the page never breaks
   and never throws.

## 3. The single shared runtime (`globalThis.linklistRuntime`)

linklist's whole client is one bundle (`linklist.js`) that owns the **only** copy
of Preact and `@preact/signals`. Before rendering, `entry.ts` publishes that
runtime on `globalThis.linklistRuntime`:

```ts
globalThis.linklistRuntime = {
  h, render, hydrate, html,
  signal, computed, effect, batch, useSignal, useComputed,
};
```

An island module **must** reuse these instead of importing its own `preact` —
that is the whole point: two Preact copies would break hooks, signals and
hydration. This is the same "single shared instance" guarantee the island
roadmap depends on.

## 4. Authoring an island

Islands are **plain browser ES modules** — no build step, no framework import.
Put a file in `packages/core/public/islands/<Name>.js` that reads the shared
runtime and exports a component under **the same name as the file** (a `default`
export also works). The build copies `public/islands/**` into `dist/islands/`.

```js
// packages/core/public/islands/Counter.js
const { html, useSignal } = globalThis.linklistRuntime || {};

export function Counter({ start = 0, step = 1, label = "Counter" } = {}) {
  // useSignal (not a bare signal()) so the value survives re-renders.
  const count = useSignal(Number(start) || 0);
  return html`
    <article class="card">
      <h5>${label}</h5>
      <div class="row center-align">
        <button class="circle" onClick=${() => (count.value -= step)}>−</button>
        <span class="chip primary">${count.value}</span>
        <button class="circle primary" onClick=${() => (count.value += step)}>+</button>
      </div>
    </article>
  `;
}

export default Counter;
```

> **State must live in `useSignal`, not `signal()`.** The app re-runs a
> component's function on every render, so a `signal()` created inside the body is
> rebuilt from its initial value each time — clicks appear to do nothing. The
> runtime bridge exposes `useSignal` / `useComputed` precisely so island state is
> stored on the component and updates propagate.

Style the island with the same **BeerCSS** semantic classes the rest of the page
uses (`card`, `row`, `button`, `chip`, …) — no custom CSS.

> **Keep islands responsive.** BeerCSS `.row` is `display: flex` with
> `white-space: nowrap`, so it never wraps. Put only short, compact controls in a
> `.row` (they fit a single line even on a ~320px phone) and center them with
> `center-align` (a `.row` helper — **not** `.center`, which is an
> absolute-position helper). Long or wrapping text belongs in normal block
> `<p>`/`<h*>`, not squeezed into a nowrap row. For many wide items that must
> reflow, use a `.grid` with fraction spans (`s6 m3`) instead — grid columns are
> percentages of the card, so they can never overflow.

## 5. Theming: islands follow the page

An island is plain BeerCSS markup, and the whole linklist page is now **pure
BeerCSS** too: colors come from BeerCSS's own tokens (`--surface-container-*`,
`--on-surface`, `--primary`, …), which flip with `body.light` / `body.dark`. The
page `<body>` carries the resolved mode (see [Theming](theming.md)), so an
island automatically matches the current brand **skin**, its `theme.custom`
overrides and the light/dark **mode** — no extra work needed. Just use semantic
BeerCSS classes and never hardcode a color.

## 6. Reusing one island (state is isolated)

The same island file can appear in **many blocks at once** — e.g. two
`Counter` blocks with different `params`. Each block renders its own placeholder
and is hydrated into its **own** Preact root with its **own** `useSignal` state,
so the counters never interfere: incrementing one leaves the other untouched.
This is exactly why island state must use `useSignal` (per component) rather
than a module-level `signal` (which would be shared by every instance).

## 7. Bundled examples

Two example islands ship in `packages/core/public/islands/` and are referenced
from the sample config:

- **`Counter.js`** — a counter with `start` / `step` / `label` props, driven by a
  `signal`.
- **`DemoWidget.js`** — two-way reactivity (a checkbox + text input) proving
  signals hydrate against the app's runtime.

Reference them with:

```jsonc
{ "format": "island", "island": "DemoWidget", "params": { "title": "Try me" } }
```

## Security notes

- The `island` name is validated as a bare identifier and is the **only** thing
  interpolated into the module URL (`./islands/<name>.js`), so it can never
  traverse a path (`../`) or point at an arbitrary URL.
- `params` become component **props**, rendered through Preact/htm — never as raw
  HTML — so they cannot inject markup.
- Loading an island is a normal dynamic `import()` of a same-origin static file.
  Only ship islands you authored; a third-party `.js` in `public/islands/` runs
  with full page privileges.

---

See [Configuration reference](configuration.md) for the full block list and
[API reference](api-reference.md) for the `IslandBlock` type and the runtime
bridge.
