/**
 * @file IslandBlock.ts
 * @description Renders an interactive island block as a hydration placeholder.
 * The real component ships as a plain ES module in `public/islands/<name>.js`
 * and is loaded + hydrated at runtime by the browser entry (`entry.ts`), which
 * finds it through the `data-island` marker below (the props JSON rides in
 * `data-props`). Keeping this component a static placeholder means server-side
 * rendering and tests stay pure/deterministic — there is no dynamic `import()`
 * here. Until (or if) the island resolves, the fallback text stays visible, so
 * the page is never blank and never throws.
 */
import { html, } from "htm/preact";
import type { IslandBlock as IslandBlockData, } from "../lib/types.ts";

export interface IslandBlockProps {
  block: IslandBlockData;
}

export function IslandBlock({ block, }: IslandBlockProps,) {
  const props = JSON.stringify(block.params ?? {},);
  return html`
    <div class="block-island" data-island=${block.name} data-props=${props}>
      <p class="small-text">Loading ${block.name}…</p>
    </div>
  `;
}
