/**
 * @file App.ts
 * @description Root component: composes the profile header, before-sections,
 * the link list, after-sections and the optional footer from the validated
 * config. Reads from the `configSignal` store unless a `config` prop is passed
 * (the latter keeps server-side rendering and tests pure/deterministic).
 */
import { html, } from "htm/preact";
import type { VNode, } from "preact";
import { configSignal, } from "./state.ts";
import type { LinklistConfig, } from "../lib/types.ts";
import { ContentSection, } from "./ContentSection.ts";
import { Footer, } from "./Footer.ts";
import { LinkList, } from "./LinkList.ts";
import { ProfileHeader, } from "./ProfileHeader.ts";

/** Props for the root {@linkcode App} component. */
export interface AppProps {
  /** Config to render; falls back to the shared `configSignal` store. */
  config?: LinklistConfig;
  /** Build timestamp for the footer (defaults to now). */
  timestamp?: number;
}

/**
 * Root component: composes profile header, before-sections, link list,
 * after-sections and the optional footer into the BeerCSS page tree.
 *
 * @param props - Optional `config` (otherwise read from `configSignal`).
 * @returns The rendered page VNode, or an empty-state notice without a config.
 */
export function App(props: AppProps = {},): VNode {
  const config = (props.config ?? configSignal.value) as LinklistConfig | null;
  if (!config) {
    return html`<div class="empty">No configuration loaded.</div>`;
  }

  const sections = config.sections ?? [];
  const before = sections.filter((s,) => s.placement === "before");
  const after = sections.filter((s,) => s.placement !== "before");
  const mode = config.theme?.mode ?? "auto";

  return html`
    <main
      class="linklist"
      data-theme=${config.theme.preset}
      data-mode=${mode}
    >
      <${ProfileHeader} profile=${config.profile} />
      ${before.map((section, i,) =>
        html`<${ContentSection} section=${section} key=${`before-${i}`} />`
      )}
      <${LinkList} links=${config.links} />
      ${after.map((section, i,) =>
        html`<${ContentSection} section=${section} key=${`after-${i}`} />`
      )}
      ${config.plugins?.show_last_updated
        ? html`
          <${Footer}
            label=${config.plugins.footer_label}
            timestamp=${props.timestamp ?? Date.now()}
          />
        `
        : null}
    </main>
  `;
}
