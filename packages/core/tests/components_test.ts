import { assert, assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { renderToString, } from "preact-render-to-string";
import { App, } from "../src/components/App.ts";
import type { LinklistConfig, } from "../src/lib/types.ts";

const config: LinklistConfig = {
  profile: {
    name: "Jane Doe",
    tagline: "**maker**",
    bio: "I build **open** tools",
    avatar: "avatar.png",
    avatar_alt: "Jane",
  },
  blocks: [
    {
      type: "link",
      format: "row",
      link: {
        title: "GitHub",
        url: "https://github.com/jane",
        icon: "github",
        new_tab: true,
      },
    },
    {
      type: "link",
      format: "button",
      link: {
        title: "Blog",
        url: "https://jane.dev",
        subtitle: "my *blog*",
        nofollow: true,
      },
    },
    { type: "section", title: "About", body: "hello **there**", },
    {
      type: "image",
      image: "./assets/figure.svg",
      image_alt: "A figure",
      caption: "See the *guide*",
    },
    { type: "island", name: "Counter", params: { start: 3, step: 2, }, },
    {
      type: "link",
      format: "card",
      link: {
        title: "Podcast",
        url: "https://podcast.jane.dev",
        image: "./assets/cover.svg",
        image_alt: "Podcast cover art",
      },
    },
  ],
  theme: { preset: "violet", mode: "dark", },
  footer: { show_last_updated: true, updated: "2026-01-02", },
};

const toHtml = (node: unknown,) =>
  renderToString(node as Parameters<typeof renderToString>[0],);

describe("App", () => {
  const html = toHtml(App({ config, },),);

  it("renders the profile header with Markdown bio", () => {
    assertStringIncludes(html, "Jane Doe",);
    assertStringIncludes(html, "<strong>open</strong>",);
    assertStringIncludes(html, 'alt="Jane"',);
  });

  it("renders link rel/target semantics as pure BeerCSS buttons", () => {
    assertStringIncludes(html, 'target="_blank"',);
    assertStringIncludes(html, 'rel="noopener noreferrer"',);
    assertStringIncludes(html, 'rel="nofollow"',);
    assertStringIncludes(html, '<a class="button" href="https://jane.dev"',);
  });

  it("renders inline Markdown in a link subtitle", () => {
    assertStringIncludes(html, "<em>blog</em>",);
  });

  it("renders the section title and content last-updated footer", () => {
    assertStringIncludes(html, "About",);
    assertStringIncludes(html, "Last updated 2026-01-02",);
  });

  it("always shows the package brand line", () => {
    assertStringIncludes(html, "Made with linklist",);
    // Brand renders even when the page configures no footer at all.
    const bare: LinklistConfig = { ...config, footer: undefined, };
    assertStringIncludes(
      toHtml(App({ config: bare, },),),
      "Made with linklist",
    );
  });

  it("renders the last-updated note and brand on separate lines", () => {
    assertStringIncludes(html, "Last updated 2026-01-02",);
    assertStringIncludes(html, "Made with linklist",);
    // They must not run together on one line (the original bug).
    assertEquals(html.includes("2026-01-02Made with linklist",), false,);
  });

  it("hides the last-updated note when show_last_updated is off", () => {
    const off: LinklistConfig = {
      ...config,
      footer: { show_last_updated: false, updated: "2026-01-02", },
    };
    const page = toHtml(App({ config: off, },),);
    assertEquals(page.includes("Last updated",), false,);
    assertStringIncludes(page, "Made with linklist",);
  });

  it("renders blocks in their declared interleaved order", () => {
    const at = [
      html.indexOf("https://github.com/jane",), // link block (row)
      html.indexOf("hello",), // section
      html.indexOf("https://podcast.jane.dev",), // trailing card link
    ];
    assert(at.every((pos,) => pos !== -1), `missing markers: ${at}`,);
    assertEquals([...at,].sort((a, b,) => a - b), at,); // strictly ordered
  });

  it("turns link.image into a round thumbnail with its alt text", () => {
    assertStringIncludes(html, 'class="circle"',);
    assertStringIncludes(html, 'src="./assets/cover.svg"',);
    assertStringIncludes(html, 'alt="Podcast cover art"',);
  });

  it("renders a standalone image block as a figure with a caption", () => {
    assertStringIncludes(html, '<figure class="block-image">',);
    assertStringIncludes(html, 'src="./assets/figure.svg"',);
    assertStringIncludes(html, 'alt="A figure"',);
    assertStringIncludes(html, "<figcaption",);
  });

  it("wraps a framed (card_text / card_figure) block in a BeerCSS card", () => {
    const framed: LinklistConfig = {
      ...config,
      blocks: [
        {
          type: "link",
          format: "row",
          link: { title: "A", url: "https://a.test", },
        },
        { type: "section", title: "Note", body: "pinned", framed: true, },
        {
          type: "image",
          image: "./assets/figure.svg",
          image_alt: "A figure",
          framed: true,
        },
      ],
    };
    const page = toHtml(App({ config: framed, },),);
    // BeerCSS's card look is the `article` ELEMENT (there is no `.card` class),
    // so both framed blocks emit `<article class="card block-framed">`.
    assertEquals(
      page.split('<article class="card block-framed">',).length - 1,
      2,
    );
    assertStringIncludes(page, "pinned",);
    // The framed figure keeps its semantic `<figure class="block-image">` inside.
    assertStringIncludes(page, '<figure class="block-image">',);
    // Un-framed blocks (the base config) must NOT emit the framed article.
    assertEquals(html.includes("block-framed",), false,);
    assertStringIncludes(html, "<section>",); // plain About stays a <section>
  });

  it("renders an island block as a hydration placeholder (name + props)", () => {
    assertStringIncludes(html, 'class="block-island"',);
    assertStringIncludes(html, 'data-island="Counter"',);
    assertStringIncludes(html, "data-props=",);
    assertStringIncludes(html, "Loading Counter",);
    // Island props ride along as JSON for the runtime to hand the component.
    assertStringIncludes(html, "start",);
  });

  it("skips profile fields listed in profile.hide", () => {
    const hidden: LinklistConfig = {
      ...config,
      profile: { ...config.profile, hide: ["bio", "avatar",], },
    };
    const page = toHtml(App({ config: hidden, },),);
    assertEquals(page.includes("<strong>open</strong>",), false,);
    assertEquals(page.includes("avatar.png",), false,);
    assertStringIncludes(page, "Jane Doe",); // name always shows
    assertStringIncludes(page, "<strong>maker</strong>",); // tagline kept
  });

  it("shows an empty state when no config is available", () => {
    assertStringIncludes(toHtml(App({},),), "No configuration loaded.",);
  });
});
