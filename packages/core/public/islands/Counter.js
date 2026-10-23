// Interactive counter island — plain HTML+ES, runs in the browser with NO build
// step. It reuses the single Preact + Signals instance the app bundle publishes
// on `globalThis.linklistRuntime`, so it never loads a second copy of Preact and
// its signal reacts against the app's graph. Add a block like
//   { "format": "island", "island": "Counter", "params": { "start": 3, "step": 2 } }
// and the entry point hydrates this file from ./islands/Counter.js automatically.
//
// State uses `useSignal`, not a bare `signal()`: the island is re-rendered on
// every change, and a signal created inside the render body would be rebuilt
// from scratch each time (resetting the count). `useSignal` stores it on the
// component so the value persists and the UI updates.
//
// Layout is pure BeerCSS. The title/description are ordinary block text (they
// wrap); the four compact controls share one centered `.row`. The controls are
// small, so they always fit a single line — even on a ~320px phone — and stay
// close together instead of spreading across a grid.
const { html, useSignal } = globalThis.linklistRuntime || {};

export function Counter({
  start = 0,
  step = 1,
  label = "Interactive counter",
} = {}) {
  const count = useSignal(Number(start) || 0);
  const inc = () => (count.value += Number(step));
  const dec = () => (count.value -= Number(step));
  const reset = () => (count.value = Number(start) || 0);

  return html`
    <article class="card">
      <h5>${label}</h5>
      <p>Hydrated with the app's Preact + Signals.</p>
      <div class="row center-align">
        <button class="circle" onClick=${dec} aria-label="Decrease">−</button>
        <span class="chip primary">${count.value}</span>
        <button class="circle primary" onClick=${inc} aria-label="Increase">
          +
        </button>
        <button class="circle transparent" onClick=${reset} aria-label="Reset">
          ↺
        </button>
      </div>
    </article>
  `;
}

export default Counter;
