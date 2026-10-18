/**
 * @file head.ts
 * @description Runtime head injection. The static `index.html` shell carries a
 * minimal generic head; once `config.json` is fetched, {@linkcode applyHead}
 * turns the per-config metadata (from `seo.ts/buildHead`) into real DOM nodes so
 * JS-capable crawlers (and the browser tab) see the correct title, Open Graph,
 * Twitter card, canonical and JSON-LD. It is a no-offense module: it only touches
 * `document` when {@linkcode applyHead} is actually called, so it stays safe to
 * import in non-DOM environments (tests, future server reuse).
 */
import { buildHead, } from "./seo.ts";
import type { LinklistConfig, } from "./types.ts";

/** The generated head fragment (title + meta + link + JSON-LD) as an HTML string. */
export function headFragment(config: LinklistConfig,): string {
  return buildHead(config,);
}

/**
 * Apply the config's metadata to the live document head. Re-running replaces
 * previously injected nodes (tagged with `data-ll-head`), so a config change or a
 * client re-render stays idempotent. No-ops when there is no `document`.
 *
 * @param config - The validated linklist configuration.
 * @param doc - Target document (defaults to the global one; injectable for tests).
 */
export function applyHead(
  config: LinklistConfig,
  doc: Document | undefined = globalThis.document,
): void {
  if (!doc || !doc.head) return;

  // Drop any metadata we injected before so repeated calls don't accumulate.
  doc.querySelectorAll("[data-ll-head]",).forEach((node,) => node.remove());

  // Parse the fragment off-line, then move the nodes into <head>.
  const template = doc.createElement("template",);
  template.innerHTML = headFragment(config,);

  const fragment = doc.createDocumentFragment();
  for (const element of Array.from(template.content.children,)) {
    if (element.tagName === "TITLE") {
      doc.title = element.textContent ?? "";
      continue;
    }
    element.setAttribute("data-ll-head", "1",);
    fragment.appendChild(element,);
  }
  doc.head.appendChild(fragment,);
}
