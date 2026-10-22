/**
 * @file App.ts
 * @description Root component: composes the profile header and the page's
 * content from `config.blocks` — the ordered flow (link blocks, Markdown
 * sections and figures) where declaration order IS display
 * order. Consecutive link blocks render together as one list. Reads from the
 * `configSignal` store unless a `config` prop is passed (the latter keeps
 * server-side rendering and tests pure/deterministic).
 */
import { html, } from "htm/preact";
import type { VNode, } from "preact";
import { configSignal, } from "./state.ts";
import type { Block, LinkBlock, LinklistConfig, } from "../lib/types.ts";
import { ContentSection, } from "./ContentSection.ts";
import { Footer, } from "./Footer.ts";
import { ImageBlock, } from "./ImageBlock.ts";
import { LinkList, } from "./LinkList.ts";
import { ProfileHeader, } from "./ProfileHeader.ts";

/** Props for the root {@linkcode App} component. */
export interface AppProps {
  /** Config to render; falls back to the shared `configSignal` store. */
  config?: LinklistConfig;
}

/**
 * Render the ordered blocks, grouping each run of consecutive link blocks into
 * a single {@linkcode LinkList}. Section and image blocks break the run and
 * render inline.
 */
function renderBlocks(blocks: Block[],): VNode[] {
  const nodes: VNode[] = [];
  let run: LinkBlock[] = [];
  const flush = () => {
    if (run.length === 0) return;
    nodes.push(
      html`<${LinkList} blocks=${run} key=${`links-${nodes.length}`} />`,
    );
    run = [];
  };
  blocks.forEach((block, i,) => {
    if (block.type === "link") {
      run.push(block,);
      return;
    }
    flush();
    if (block.type === "section") {
      nodes.push(html`<${ContentSection} section=${block} key=${`b${i}`} />`,);
    } else if (block.type === "image") {
      nodes.push(html`<${ImageBlock} block=${block} key=${`b${i}`} />`,);
    }
  },);
  flush();
  return nodes;
}

/**
 * Root component: renders the profile header, then every `blocks` entry in
 * order, then the optional footer.
 *
 * @param props - Optional `config` (otherwise read from `configSignal`).
 * @returns The rendered page VNode, or an empty-state notice without a config.
 */
export function App(props: AppProps = {},): VNode {
  const config = (props.config ?? configSignal.value) as LinklistConfig | null;
  if (!config) {
    return html`<div class="empty">No configuration loaded.</div>`;
  }

  const mode = config.theme?.mode ?? "auto";

  return html`
    <main
      class="linklist"
      data-theme=${config.theme.preset}
      data-mode=${mode}
    >
      <${ProfileHeader} profile=${config.profile} />
      ${renderBlocks(config.blocks,)}
      <${Footer}
        showUpdated=${config.footer?.show_last_updated}
        updated=${config.footer?.updated}
        label=${config.footer?.label}
      />
    </main>
  `;
}
