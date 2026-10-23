/**
 * @file ContentSection.ts
 * @description A user-authored Markdown block placed before or after the link
 * list (the "about" / custom sections feature).
 */
import { html, } from "htm/preact";
import type { ContentSection as Section, } from "../lib/types.ts";
import { MarkdownText, } from "./MarkdownText.ts";

export interface ContentSectionProps {
  section: Section;
}

export function ContentSection({ section, }: ContentSectionProps,) {
  return html`
    <section>
      ${section.title ? html`<h5>${section.title}</h5>` : null}
      ${section.body ? html`<${MarkdownText} text=${section.body} />` : null}
    </section>
  `;
}
