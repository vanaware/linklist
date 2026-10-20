/**
 * @file markdown.ts
 * @description Minimal, safe Markdown → Preact VNode renderer for user-authored
 * text blocks (bio, about/section bodies, link subtitles, footer).
 *
 * It uses the `mdast-util-from-markdown` + GFM extension libraries and produces
 * Preact VNodes directly (no intermediate wire AST), keeping `@vanaware/linklist`
 * fully self-contained with no dependency on any other package.
 * Because it builds real VNodes there is no `dangerouslySetInnerHTML` and raw
 * HTML nodes are ignored, keeping rendering XSS-safe.
 */
import { type ComponentChildren, Fragment, h, } from "preact";
import { fromMarkdown, } from "mdast-util-from-markdown";
import { gfmFromMarkdown, } from "mdast-util-gfm";
import { gfm, } from "micromark-extension-gfm";

/** A loose mdast node — we only rely on `type`, `children` and a few fields. */
interface MdNode {
  type: string;
  children?: MdNode[];
  value?: string;
  depth?: number;
  url?: string;
  alt?: string;
  title?: string;
  ordered?: boolean;
  lang?: string;
}

/** Map mdast phrasing/text nodes to Preact VNodes. */
function textNode(node: MdNode,): ComponentChildren {
  switch (node.type) {
    case "text":
      return node.value ?? "";
    case "strong":
      return h("strong", null, ...mapChildren(node,),);
    case "emphasis":
      return h("em", null, ...mapChildren(node,),);
    case "delete":
      return h("del", null, ...mapChildren(node,),);
    case "inlineCode":
      return h("code", null, node.value ?? "",);
    case "link":
      return h("a", { href: node.url ?? "#", }, ...mapChildren(node,),);
    case "image":
      return h("img", { src: node.url ?? "", alt: node.alt ?? "", },);
    case "break":
      return h("br", null,);
    default:
      return null;
  }
}

/** Map any mdast node (block or phrasing) to a Preact VNode. */
function mapNode(node: MdNode,): ComponentChildren {
  switch (node.type) {
    case "paragraph":
      return h("p", null, ...mapChildren(node,),);
    case "heading": {
      const level = `h${Math.min(Math.max(node.depth ?? 1, 1,), 6,)}`;
      return h(level, null, ...mapChildren(node,),);
    }
    case "list":
      return h(node.ordered ? "ol" : "ul", null, ...mapChildren(node,),);
    case "listItem":
      return h("li", null, ...mapChildren(node,),);
    case "blockquote":
      return h("blockquote", null, ...mapChildren(node,),);
    case "code":
      return h(
        "pre",
        null,
        h(
          "code",
          { class: node.lang ? `language-${node.lang}` : undefined, },
          node.value ?? "",
        ),
      );
    case "thematicBreak":
      return h("hr", null,);
    case "table":
      return h("table", null, ...mapChildren(node,),);
    case "tableRow":
      return h("tr", null, ...mapChildren(node,),);
    case "tableCell":
      return h("td", null, ...mapChildren(node,),);
    case "html":
      // Raw HTML from user markdown is intentionally dropped for safety.
      return null;
    default:
      return textNode(node,);
  }
}

/** Recursively map a node's children, dropping nulls. */
function mapChildren(node: MdNode,): ComponentChildren[] {
  return (node.children ?? []).map(mapNode,).filter((child,) => child !== null);
}

function parse(md: string,): MdNode {
  const options = {
    extensions: [gfm(),],
    mdastExtensions: [gfmFromMarkdown(),],
  };
  // The mdast/micromark packages ship separate copies of `micromark-util-types`,
  // so the `Extension` types are nominally incompatible across versions even
  // though they are structurally identical. Bridge the mismatch here.
  return fromMarkdown(
    md,
    options as unknown as Parameters<typeof fromMarkdown>[1],
  ) as unknown as MdNode;
}

/**
 * Render a Markdown string to a block-level VNode tree (paragraphs, headings,
 * lists, etc.), suitable for a `bio` or `section.body`.
 *
 * @param markdown - Raw Markdown text.
 * @returns A Preact fragment of the rendered blocks (or null when empty).
 * @example
 * ```ts
 * import { renderMarkdown } from "@vanaware/linklist";
 * const node = renderMarkdown("Hello **world**");
 * ```
 */
export function renderMarkdown(markdown: string,): ComponentChildren {
  const children = (parse(markdown,).children ?? []).map(mapNode,).filter((
    n,
  ) => n !== null);
  if (children.length === 0) return null;
  return h(Fragment, null, ...children,);
}

/**
 * Render a Markdown string as **inline** content (no block wrappers), suitable
 * for a link `subtitle`, a `tagline`, or the footer line.
 *
 * @param markdown - Raw Markdown text.
 * @returns A Preact fragment of inline nodes (or null when empty).
 */
export function renderInlineMarkdown(markdown: string,): ComponentChildren {
  const blocks = parse(markdown,).children ?? [];
  if (blocks.length === 0) return null;
  const inline = blocks.flatMap((block,) =>
    block.children && block.children.length > 0
      ? mapChildren(block,)
      : [mapNode(block,),].filter((n,) => n !== null)
  );
  return h(Fragment, null, ...inline,);
}
