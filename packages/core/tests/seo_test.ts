import { assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import {
  buildHead,
  buildJsonLd,
  escapeHtml,
  faviconDataUri,
  safeJson,
} from "../src/lib/seo.ts";
import type { LinklistConfig, } from "../src/lib/types.ts";

const config: LinklistConfig = {
  profile: {
    name: "Jane Doe",
    tagline: "Maker",
    url: "https://jane.dev/",
    description: "Jane's links",
    twitter: "@janedoe",
  },
  blocks: [
    {
      type: "link",
      format: "row",
      link: { title: "GitHub", url: "https://github.com/jane", },
    },
    {
      type: "link",
      format: "row",
      link: { title: "Site", url: "https://jane.dev", },
    },
  ],
  theme: { preset: "violet", custom: { primary_color: "#2200aa", }, },
};

describe("escapeHtml / safeJson", () => {
  it("escapes HTML-significant characters", () => {
    assertEquals(
      escapeHtml(`<a href="x">&</a>`,),
      "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
    );
  });
  it("escapes '<' so embedded JSON cannot close a script tag", () => {
    assertEquals(safeJson({ a: "</script>", },).includes("<",), false,);
  });
});

describe("buildJsonLd", () => {
  it("emits a Person with sameAs profile links", () => {
    const ld = buildJsonLd(config,);
    assertEquals(ld["@type"], "Person",);
    assertEquals(ld.name, "Jane Doe",);
    assertEquals((ld.sameAs as string[]).length, 2,);
  });
  it("collects sameAs from every link block, ignoring others", () => {
    const ld = buildJsonLd({
      ...config,
      blocks: [
        {
          type: "link",
          format: "row",
          link: { title: "A", url: "https://a.test", },
        },
        { type: "section", title: "About", body: "text", },
        {
          type: "link",
          format: "button",
          link: { title: "B", url: "https://b.test", },
        },
        {
          type: "link",
          format: "card",
          link: { title: "C", url: "https://c.test", },
        },
      ],
    },);
    assertEquals(ld.sameAs, [
      "https://a.test",
      "https://b.test",
      "https://c.test",
    ],);
  });
});

describe("buildHead", () => {
  const head = buildHead(config,);
  it("includes title, OG profile type and canonical", () => {
    assertStringIncludes(head, "<title>Jane Doe</title>",);
    assertStringIncludes(head, 'property="og:type" content="profile"',);
    assertStringIncludes(head, 'rel="canonical" href="https://jane.dev/"',);
  });
  it("includes twitter handle and JSON-LD", () => {
    assertStringIncludes(head, 'name="twitter:site" content="@janedoe"',);
    assertStringIncludes(head, "application/ld+json",);
  });
});

describe("faviconDataUri", () => {
  it("builds an inline SVG data-URI from the initial", () => {
    const uri = faviconDataUri("Jane", "#2200aa",);
    assertStringIncludes(uri, "data:image/svg+xml,",);
    assertStringIncludes(decodeURIComponent(uri.split(",",)[1] ?? "",), "J",);
  });
});
