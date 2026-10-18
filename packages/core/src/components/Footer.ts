/**
 * @file Footer.ts
 * @description Optional footer line (Markdown). Defaults to a "Last updated"
 * note; the timestamp is passed in by the build so the output is deterministic.
 */
import { html, } from "htm/preact";
import { APP_VERSION, } from "../version.ts";
import { MarkdownText, } from "./MarkdownText.ts";

export interface FooterProps {
  label?: string;
  /** Build timestamp (ms since epoch). */
  timestamp: number;
}

export function Footer({ label, timestamp, }: FooterProps,) {
  const date = new Date(timestamp,).toISOString().slice(0, 10,);
  const base = label ?? `Last updated ${date}`;
  // `APP_VERSION` is empty until the build stamps __APP_VERSION__ into version.ts;
  // it may already carry a leading "v", so normalize to avoid a "vv" double prefix.
  const version = APP_VERSION.replace(/^v/, "",);
  const text = version ? `${base} · v${version}` : base;
  return html`
    <footer class="footer">
      <${MarkdownText} text=${text} inline=${true} />
    </footer>
  `;
}
