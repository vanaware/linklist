/**
 * @file entry.ts
 * @description Browser entry point, bundled by buildit into `dist/linklist.js`.
 * It fetches `./config.json` from the static folder at runtime (resolved
 * relative to the document, so it works at a domain root OR under a subfolder),
 * validates it, applies the theme, and
 * renders the full Preact `App` into `#app`. Any `island` blocks are then
 * hydrated: each is a plain ES module in `./islands/<name>.js` loaded on demand
 * and rendered in place through the SAME Preact/Signals runtime the bundle
 * publishes on `globalThis.linklistRuntime` (a single shared instance, never a
 * duplicate). The document <head> metadata is NOT touched
 * here: it is finalized into `index.html` at build time (before publishing to
 * the static host), so crawlers and link-preview scrapers see it without JS.
 * This file is intentionally NOT exported from `mod.ts` so non-browser code
 * never pulls in DOM APIs.
 */
import { h, hydrate, render, } from "preact";
import { html, } from "htm/preact";
import {
  batch,
  computed,
  effect,
  signal,
  useComputed,
  useSignal,
} from "@preact/signals";
import { App, } from "./components/App.ts";
import { parseAndValidate, } from "./lib/schema.ts";
import { setConfig, } from "./components/state.ts";
import { themeBodyClass, tokensToCss, } from "./lib/theme.ts";
import type { LinklistConfig, } from "./lib/types.ts";

declare global {
  // The Preact/Signals surface islands reuse so they never load their own copy.
  // Defined once, on the module that owns the only bundled Preact instance.
  var linklistRuntime: LinklistRuntime | undefined;
}

/** The runtime utilities {@linkcode linklistRuntime} exposes to island modules. */
export interface LinklistRuntime {
  h: typeof h;
  render: typeof render;
  hydrate: typeof hydrate;
  html: typeof html;
  signal: typeof signal;
  computed: typeof computed;
  effect: typeof effect;
  batch: typeof batch;
  useSignal: typeof useSignal;
  useComputed: typeof useComputed;
}

// Publish the shared runtime BEFORE any island module can import it, so every
// island reacts against this single Preact/Signals graph. Assigned on
// `globalThis` (the bundle is an ES module — a bare top-level write would throw
// in strict mode).
globalThis.linklistRuntime = {
  h,
  render,
  hydrate,
  html,
  signal,
  computed,
  effect,
  batch,
  useSignal,
  useComputed,
};

/** Resolve `path` next to the current document (root- and subfolder-safe). */
function relative(path: string,): string {
  return new URL(path, globalThis.location.href,).href;
}

function messageOf(error: unknown,): string {
  return error instanceof Error ? error.message : String(error,);
}

/** Report a non-fatal warning (kept on one line, prefixed for the console). */
function warn(message: string,): void {
  console.warn(`[linklist] ${message}`,);
}

/**
 * Apply the theme: the dark/light/auto mode (BeerCSS `<body>` class) and the
 * brand token overrides from `config.theme.custom`.
 *
 * The `base` + `preset` stylesheets are already static `<link>`s in the head
 * (emitted by `generate.ts`), so here we only inline the small `:root { … }`
 * token block that layers the brand color over the preset. For an explicit
 * `dark`/`light` mode the class is baked into `<body>` at build time; `auto` is
 * resolved from `prefers-color-scheme` (and kept in sync live) since BeerCSS has
 * no `auto` class of its own.
 */
async function applyTheme(config: LinklistConfig,): Promise<void> {
  const doc = globalThis.document;
  if (!doc) return;

  const mode = config.theme?.mode ?? "auto";
  if (mode === "auto") {
    const mq = globalThis.matchMedia?.("(prefers-color-scheme: dark)",);
    const sync = () => {
      doc.body.classList.toggle("dark", Boolean(mq?.matches,),);
      doc.body.classList.remove("light",);
    };
    sync();
    mq?.addEventListener?.("change", sync,);
  } else {
    doc.body.className = themeBodyClass(config.theme,);
  }

  const css = tokensToCss(config.theme.custom,);
  const style = doc.getElementById("linklist-theme",) ??
    doc.createElement("style",);
  style.id = "linklist-theme";
  style.textContent = css;
  if (!style.parentNode) doc.head.appendChild(style,);
}

/** A safe island module name (mirrors the validator): letters/digits/_/-, no path chars. */
const ISLAND_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;

/**
 * Hydrate every island placeholder in `root`. Each `[data-island]` element names
 * a `./islands/<name>.js` module loaded on demand; its `data-props` JSON becomes
 * the component's props. On success the bundled `render` replaces the static
 * fallback with the live component (sharing the single bundled Preact
 * instance). On any failure the static fallback simply stays visible — the page
 * never breaks.
 */
async function hydrateIslands(root: HTMLElement,): Promise<void> {
  const nodes = Array.from(
    root.querySelectorAll("[data-island]",) as NodeListOf<HTMLElement>,
  );
  await Promise.all(nodes.map(async (el,) => {
    if (el.dataset.islandHydrated === "true") return;
    const name = el.dataset.island;
    if (!name || !ISLAND_NAME.test(name,)) return;
    try {
      const props = JSON.parse(el.dataset.props ?? "{}",);
      const url = relative(`./islands/${name}.js`,);
      const mod = (await import(url,)) as Record<string, unknown>;
      const Comp = mod[name] ?? mod.default;
      if (typeof Comp !== "function") {
        el.dataset.islandMissing = "true";
        warn(`island "${name}" exported no component`,);
        return;
      }
      // Preact's render() appends into a non-empty container instead of clearing
      // it, so drop the static "Loading…" fallback first or it would linger
      // beside the live component. Only mark hydrated on success, so a failed
      // island leaves its fallback (and can be retried) rather than a false flag.
      el.replaceChildren();
      render(h(Comp as () => ReturnType<typeof h>, props,), el,);
      el.dataset.islandHydrated = "true";
    } catch (error) {
      // Leave the fallback in place; a missing island must never blank the page.
      el.dataset.islandMissing = "true";
      warn(`island "${name}" failed to load: ${messageOf(error)}`);
    }
  }),);
}

async function boot(): Promise<void> {
  const doc = globalThis.document;
  const mount = doc?.getElementById("app",);
  if (!doc || !mount) return;

  let base: LinklistConfig;
  try {
    const response = await fetch(relative("./config.json",), {
      cache: "no-store",
    },);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`,);
    }
    const result = parseAndValidate(await response.text(),);
    if (!result.ok) {
      console.error("[linklist] invalid config.json:", result.errors,);
      render(h("div", { class: "error", }, "Invalid config.json.",), mount,);
      return;
    }
    base = result.data;
  } catch (error) {
    warn(`could not load config.json: ${messageOf(error,)}`,);
    // The build-time <noscript> fallback only paints with JS off, so render
    // a visible message instead of leaving a blank page (mirrors the
    // invalid-config branch above).
    render(
      h("div", { class: "error", }, "Could not load config.json.",),
      mount,
    );
    return;
  }

  const config = base;

  setConfig(config);
  await applyTheme(config);
  render(h(App, { config }), mount);
  await hydrateIslands(mount);
}

boot();
