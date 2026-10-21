/**
 * @file Footer.ts
 * @description The page footer. It always shows a "Made with linklist · vN"
 * brand line (the version is the **package** version, stamped at build time),
 * and — when enabled — a "Last updated <date>" note taken from
 * `footer.updated` (the author-maintained **content** date) or a custom
 * `footer.label`. Pure: it renders from props only, never reading the clock, so
 * output stays deterministic between build and browser.
 */
import { html, } from "htm/preact";
import { brandText, } from "../lib/brand.ts";
import { APP_VERSION, } from "../version.ts";
import { MarkdownText, } from "./MarkdownText.ts";

export interface FooterProps {
  /** Show the last-updated / label note line above the brand. */
  showUpdated?: boolean;
  /** Content last-updated date (`YYYY-MM-DD`) for the auto note. */
  updated?: string;
  /** Custom Markdown note that overrides the auto last-updated line. */
  label?: string;
}

export function Footer(
  { showUpdated, updated, label, }: FooterProps = {},
) {
  // The note only appears when requested AND there is something to say; the
  // custom label wins over the auto "Last updated" line.
  const note = showUpdated
    ? (label ?? (updated ? `Last updated ${updated}` : undefined))
    : undefined;
  // `APP_VERSION` is the package version (empty until the build stamps it);
  // brandText normalizes any leading "v" and degrades when it is unknown.
  const brand = brandText(APP_VERSION,);

  return html`
    <footer class="footer">
      ${note
      ? html`<div class="footer-note"><${MarkdownText} text=${note} inline=${true} /></div>`
      : null}
      <div class="footer-brand">${brand}</div>
    </footer>
  `;
}
