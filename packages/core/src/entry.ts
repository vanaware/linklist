/**
 * @file entry.ts
 * @description Browser entry point, bundled by buildit into `dist/linklist.js`.
 * It fetches `./config.json` from the static folder at runtime (resolved
 * relative to the document, so it works at a domain root OR under a subfolder),
 * validates it, applies the theme, and
 * renders the full Preact `App` into `#app`. The document <head> metadata is NOT touched
 * here: it is finalized into `index.html` at build time (before publishing to
 * the static host), so crawlers and link-preview scrapers see it without JS.
 * This file is intentionally NOT exported from `mod.ts` so non-browser code
 * never pulls in DOM APIs.
 */
import { h, render, } from "preact";
import { App, } from "./components/App.ts";
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

  // The validated config renders as-is. There is no runtime data fetching;
  // interactive island blocks may arrive in a future release.
  const config = base;

  setConfig(config,);
  await applyTheme(config,);
  render(h(App, { config, },), mount,);
}

boot();
