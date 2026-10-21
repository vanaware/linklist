/**
 * @file LinkList.ts
 * @description Renders a run of consecutive link blocks as one accessible list.
 * Each item is a semantic anchor with an optional image thumbnail or brand icon,
 * title and Markdown subtitle, plus correct `target`/`rel` handling for
 * `new_tab`/`nofollow`. The block's predefined `format` (row / button / card)
 * selects the presentation via an `is-` variant class.
 */
import { html, } from "htm/preact";
import type { LinkBlock, LinkItem, } from "../lib/types.ts";
import { BrandIcon, } from "./BrandIcon.ts";
import { MarkdownText, } from "./MarkdownText.ts";

/** Compose the `rel` attribute from the link's open/nofollow flags. */
function relFor(link: LinkItem,): string | undefined {
  const rel: string[] = [];
  if (link.new_tab) rel.push("noopener", "noreferrer",);
  if (link.nofollow) rel.push("nofollow",);
  return rel.length ? rel.join(" ",) : undefined;
}

/**
 * Map a block's predefined format to its styling class. `is-` prefixed to
 * avoid colliding with BeerCSS's own `.button` component styles; `row` is the
 * bare default (no extra class).
 */
function formatClass(format: LinkBlock["format"],): string {
  if (format === "button") return "is-button";
  if (format === "card") return "is-card";
  return "";
}

export interface LinkRowProps {
  link: LinkItem;
  format: LinkBlock["format"];
}

export function LinkRow({ link, format, }: LinkRowProps,) {
  const cls = ["link", formatClass(format,),].filter(Boolean,).join(" ",);

  return html`
    <li class=${cls}>
      <a
        href=${link.url}
        target=${link.new_tab ? "_blank" : undefined}
        rel=${relFor(link,)}
      >
        ${link.image
          ? html`
            <span class="link-icon">
              <img
                class="thumb"
                src=${link.image}
                alt=${link.image_alt ?? ""}
                width="48"
                height="48"
              />
            </span>
          `
          : link.icon
          ? html`<span class="link-icon"><${BrandIcon} name=${link.icon} /></span>`
          : null}
        <span class="link-body">
          <span class="link-title">${link.title}</span>
          ${link.subtitle
            ? html`
              <span class="link-subtitle">
                <${MarkdownText} text=${link.subtitle} inline=${true} />
              </span>
            `
            : null}
        </span>
        ${link.new_tab
          ? html`<i class="icon chevron" aria-hidden="true">open_in_new</i>`
          : null}
      </a>
    </li>
  `;
}

export interface LinkListProps {
  /** Consecutive link blocks, rendered together as one list. */
  blocks: LinkBlock[];
}

export function LinkList({ blocks, }: LinkListProps,) {
  return html`
    <nav class="links-nav" aria-label="Links">
      <ul class="links">
        ${blocks.map((block, i,) =>
          html`
            <${LinkRow}
              link=${block.link}
              format=${block.format}
              key=${i}
            />
          `
        )}
      </ul>
    </nav>
  `;
}
