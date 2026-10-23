/**
 * @file ContentSection.ts
 * @description A user-authored Markdown block placed before or after the link
 * list (the "about" / custom sections feature). A plain section renders inline;
 * a `framed` one (from `format: "card_text"`) is wrapped in an `<article>`, which
 * in BeerCSS carries the card surface (elevation + padding + radius + tinted
 * background) — the same treatment islands get (the effect is the `article`
 * ELEMENT, not a `.card` class).
 */
import { html, } from "htm/preact";
import type { ContentSection as Section, } from "../lib/types.ts";
import { MarkdownText, } from "./MarkdownText.ts";

export interface ContentSectionProps {
  section: Section;
}

export function ContentSection({ section, }: ContentSectionProps,) {
  const inner = [
    section.title ? html`<h5>${section.title}</h5>` : null,
    section.body ? html`<${MarkdownText} text=${section.body} />` : null,
  ];
  return section.framed
    ? html`<article class="card block-framed">${inner}</article>`
    : html`<section>${inner}</section>`;
}
