/**
 * @file LinkList.ts
 * @description The core link list. Each item is a semantic anchor with an
 * optional icon, title and Markdown subtitle, plus correct `target`/`rel`
 * handling for `new_tab` and `nofollow`.
 */
import { html, } from "htm/preact";
import type { LinkItem, } from "../lib/types.ts";
import { BrandIcon, } from "./BrandIcon.ts";
import { MarkdownText, } from "./MarkdownText.ts";

/** Compose the `rel` attribute from the link's open/nofollow flags. */
function relFor(link: LinkItem,): string | undefined {
  const rel: string[] = [];
  if (link.new_tab) rel.push("noopener", "noreferrer",);
  if (link.nofollow) rel.push("nofollow",);
  return rel.length ? rel.join(" ",) : undefined;
}

export interface LinkRowProps {
  link: LinkItem;
}

export function LinkRow({ link, }: LinkRowProps,) {
  // `is-` prefixed variants: bare `button`/`featured` would collide with
  // BeerCSS's own `.button` component styles.
  const cls = [
    "link",
    link.button ? "is-button" : "",
    link.featured ? "is-featured" : "",
  ].filter(Boolean,).join(" ",);

  return html`
    <li class=${cls}>
      <a
        href=${link.url}
        target=${link.new_tab ? "_blank" : undefined}
        rel=${relFor(link,)}
      >
        ${link.icon
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
  links: LinkItem[];
}

export function LinkList({ links, }: LinkListProps,) {
  return html`
    <nav class="links-nav" aria-label="Links">
      <ul class="links">
        ${links.map((link, i,) => html`<${LinkRow} link=${link} key=${i} />`)}
      </ul>
    </nav>
  `;
}
