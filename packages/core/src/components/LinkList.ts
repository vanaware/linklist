/**
 * @file LinkList.ts
 * @description Renders a run of consecutive link blocks as one accessible list
 * using pure BeerCSS markup: a `<ul class="grid">` of `<li>` cells, each holding
 * an `<a class="button">`. The block's `format` drives both the button size and
 * the grid span: `row` is a full-width line (`s12`), while `button`/`card` sit in
 * a two-column grid (`s12 m6` — one column on phones, two on wider screens, with
 * `card` additionally using `.button.large`). Each item is a semantic anchor with
 * an optional round thumbnail or brand icon, a title and a Markdown subtitle,
 * plus correct `target`/`rel` handling for `new_tab`/`nofollow`.
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
 * Map a block's predefined format to BeerCSS button classes. `row` and `button`
 * both render the standard `.button`; `card` is the larger `.button.large`.
 */
function buttonClass(format: LinkBlock["format"],): string {
  return format === "card" ? "button large" : "button";
}

/**
 * Map a format to its grid-cell span. A `row` is a full-width line (`s12`);
 * `button` and `card` are half-width cells that pair into two columns on wider
 * screens (`s12 m6`). Presentation (spacing, sizing) still lives in BeerCSS.
 */
function spanClass(format: LinkBlock["format"],): string {
  return format === "row" ? "s12" : "s12 m6";
}

export interface LinkRowProps {
  link: LinkItem;
  format: LinkBlock["format"];
}

export function LinkRow({ link, format, }: LinkRowProps,) {
  return html`
    <li class=${spanClass(format,)}>
      <a
        class=${buttonClass(format,)}
        href=${link.url}
        target=${link.new_tab ? "_blank" : undefined}
        rel=${relFor(link,)}
      >
        ${link.image
      ? html`
            <img
              class="circle"
              src=${link.image}
              alt=${link.image_alt ?? ""}
              width="48"
              height="48"
            />
          `
      : link.icon
        ? html`<${BrandIcon} name=${link.icon} />`
        : null}
        <span>
          <span>${link.title}</span>
          ${link.subtitle
      ? html`
              <span class="small-text">
                <${MarkdownText} text=${link.subtitle} inline=${true} />
              </span>
            `
      : null}
        </span>
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
    <nav aria-label="Links">
      <ul class="grid">
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
