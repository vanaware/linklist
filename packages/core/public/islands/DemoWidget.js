// Demo widget island — shows two-way reactivity from a plain browser ES module.
// It reuses the app's single Preact + Signals instance via
// `globalThis.linklistRuntime` (no second Preact, no build step). Reference it
// with a block like:
//   { "format": "island", "island": "DemoWidget", "params": { "title": "Try me" } }
//
// Layout is pure, mobile-first BeerCSS: every child is a full-width block or a
// short label row that stacks naturally, so the card adapts from narrow phones to
// the capped desktop column with no fixed widths to overflow. State uses
// `useSignal` (persisted on the component) rather than a bare `signal()` inside
// the render body, which would reset on every re-render.
const { html, useSignal } = globalThis.linklistRuntime || {};

export function DemoWidget({ title = "Demo widget" } = {}) {
  const enabled = useSignal(false);
  const name = useSignal("");

  return html`
    <article class="card">
      <h5>${title}</h5>
      <label class="row">
        <input
          type="checkbox"
          checked=${enabled.value}
          onInput=${(e) => (enabled.value = e.target.checked)}
        />
        <span>Enable the greeting</span>
      </label>
      <div class="field">
        <input
          placeholder="Your name"
          value=${name.value}
          onInput=${(e) => (name.value = e.target.value)}
        />
      </div>
      ${enabled.value
        ? html`<p>Hello, <strong>${name.value || "stranger"}</strong>!</p>`
        : html`<p>Enable the greeting to say hello.</p>`}
    </article>
  `;
}

export default DemoWidget;
