/**
 * @file MarkdownText.ts
 * @description Component wrapper around the Markdown renderer. Use `inline`
 * for single-line contexts (tagline, link subtitle, footer) and leave it off
 * for block content (bio, section body).
 */
import type { ComponentChildren, } from "preact";
import { renderInlineMarkdown, renderMarkdown, } from "../markdown.ts";

export interface MarkdownTextProps {
  text: string;
  /** Render as inline nodes without block wrappers. */
  inline?: boolean;
}

export function MarkdownText(
  { text, inline, }: MarkdownTextProps,
): ComponentChildren {
  if (!text) return null;
  return inline ? renderInlineMarkdown(text,) : renderMarkdown(text,);
}
