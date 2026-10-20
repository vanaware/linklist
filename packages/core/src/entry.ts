/**
 * @file entry.ts
 * @description Browser entry point, bundled by buildit into `dist/linklist.js`.
 * It fetches `./config.json` from the static folder at runtime (resolved
 * relative to the document, so it works at a domain root OR under a subfolder),
 * validates it, runs the built-in plugins, applies the theme, and renders the
 * full Preact `App` into `#app`. The document <head> metadata is NOT touched
 * here: it is finalized into `index.html` at build time (before publishing to
 * the static host), so crawlers and link-preview scrapers see it without JS.
 * This file is intentionally NOT exported from `mod.ts` so non-browser code
 * never pulls in DOM APIs.
 */
import { h, render, } from "preact";
import { App, } from "./components/App.ts";
import { mergePluginOutputs, runPlugins, } from "./plugins/engine.ts";
import { builtinPlugins, } from "./plugins/mod.ts";
import { parseAndValidate, } from "./lib/schema.ts";
import { setConfig, } from "./components/state.ts";
import { resolveThemeCss, themeBodyClass, } from "./lib/theme.ts";
import type { LinklistConfig, } from "./lib/types.ts";

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

/** Browser `fetchJson` for plugins: JSON in, throws on a non-2xx response. */
async function fetchJson(url: string,): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json", },
  },);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`,);
  }
  return await response.json();
}

/** Apply theme mode + tokens (and the bundled preset stylesheet). */
async function applyTheme(config: LinklistConfig,): Promise<void> {
  const doc = globalThis.document;
  if (!doc) return;

  doc.body.className = themeBodyClass(config.theme,);

  // A bundled preset ships its stylesheet next to the page; fetch it so the
  // token overrides in `theme.custom` layer on top of the real preset CSS.
  let presetCss = "";
  if (config.theme.preset) {
    try {
      const response = await fetch(
        relative(`./${config.theme.preset}.css`,),
        { cache: "no-store", },
      );
      if (response.ok) presetCss = await response.text();
    } catch {
      // Preset CSS is optional; the token overrides below still style the page.
    }
  }

  const css = resolveThemeCss(config.theme, presetCss,);
  const style = doc.getElementById("linklist-theme",) ??
    doc.createElement("style",);
  style.id = "linklist-theme";
  style.textContent = css;
  if (!style.parentNode) doc.head.appendChild(style,);
}

/**
 * One-time migration cleanup: earlier builds of this site registered a
 * `sw.js` service worker that now serves stale cached pages. The current
 * build ships no service worker, so unregister any leftovers and drop only
 * the caches they own before booting.
 */
// `ServiceWorkerRegistration.keys()` exists in browsers but is missing from
// Deno's DOM lib; declare the tiny slice we use.
interface RegistrationWithKeys extends ServiceWorkerRegistration {
  readonly keys?: () => Promise<{ cacheNames: string[] }>;
}

async function purgeStaleServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map(async (registration,) => {
        const reg = registration as RegistrationWithKeys;
        const keys = reg.keys ? await reg.keys() : undefined;
        const cacheNames = keys?.cacheNames ?? [];
        await Promise.all(
          cacheNames.map((name,) => caches.delete(name,)),
        );
        await reg.unregister();
      },),
    );
  } catch {
    // Best-effort; never block the first paint.
  }
}

async function boot(): Promise<void> {
  purgeStaleServiceWorkers();

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
    return;
  }

  // Built-in plugins, each failure isolated so one bad fetch can't break the page.
  const outputs = await runPlugins(builtinPlugins, {
    config: base,
    fetchJson,
    warn,
  },);
  const config = mergePluginOutputs(base, outputs,);

  setConfig(config,);
  await applyTheme(config,);
  render(h(App, { config, },), mount,);
}

boot();
