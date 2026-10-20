import { assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { renderToString, } from "preact-render-to-string";
import {
  renderInlineMarkdown,
  renderMarkdown,
} from "../src/components/markdown.ts";

// The renderer returns Preact children; render-to-string gives us a stable HTML
// snapshot to assert against without needing a DOM.
const toHtml = (node: unknown,) =>
  renderToString(node as Parameters<typeof renderToString>[0],);

describe("renderMarkdown", () => {
  it("renders block content with inline formatting", () => {
    const html = toHtml(
      renderMarkdown("Hello **world**, see [docs](https://x.dev)",),
    );
    assertStringIncludes(html, "<p>",);
    assertStringIncludes(html, "<strong>world</strong>",);
    assertStringIncludes(html, '<a href="https://x.dev">docs</a>',);
  });

  it("renders unordered lists", () => {
    const html = toHtml(renderMarkdown("- a\n- b",),);
    assertStringIncludes(html, "<ul>",);
    assertStringIncludes(html, "<li>",);
  });

  it("drops raw HTML nodes for safety", () => {
    const html = toHtml(renderMarkdown("<script>alert(1)</script>",),);
    assertEquals(html.includes("<script>",), false,);
  });

  it("returns null for empty input", () => {
    assertEquals(renderMarkdown("",), null,);
  });
});

describe("renderInlineMarkdown", () => {
  it("does not wrap inline content in a paragraph", () => {
    const html = toHtml(renderInlineMarkdown("a **b**",),);
    assertEquals(html.includes("<p>",), false,);
    assertStringIncludes(html, "<strong>b</strong>",);
  });
});
