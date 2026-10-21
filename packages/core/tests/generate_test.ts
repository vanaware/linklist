import { assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import {
  generateSite,
  renderIndexHtml,
  renderManifest,
  renderRobotsTxt,
} from "../src/lib/generate.ts";
import type { LinklistConfig, } from "../src/lib/types.ts";

const config: LinklistConfig = {
  profile: {
    name: "Jane Doe",
    tagline: "Maker",
    avatar: "./assets/avatar.svg",
    avatar_alt: "Jane",
    title: "Jane — links",
    url: "https://jane.dev/",
    description: "Jane's links",
    lang: "pt",
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
    { type: "section", title: "About", body: "**secret prose**", },
    { type: "plugin", name: "github-repos", repos: ["a/b",], },
  ],
  theme: { preset: "minimal-dark", custom: { primary_color: "#2200aa", }, },
};

describe("renderIndexHtml", () => {
  const html = renderIndexHtml(config,);
  it("emits a full document with the config language", () => {
    assertStringIncludes(html, "<!DOCTYPE html>",);
    assertStringIncludes(html, '<html lang="pt">',);
  });
  it("bakes the per-config SEO head into the static HTML", () => {
    assertStringIncludes(html, "<title>Jane — links</title>",);
    assertStringIncludes(html, 'property="og:type" content="profile"',);
    assertStringIncludes(html, 'rel="canonical" href="https://jane.dev/"',);
  });
  it("links the manifest, BeerCSS and the app bundle", () => {
    assertStringIncludes(html, 'rel="manifest" href="./manifest.json"',);
    assertStringIncludes(html, "beercss@3.7.12",);
    assertStringIncludes(html, '<script type="module" src="./linklist.js">',);
  });
  it("renders a no-JS fallback with every link", () => {
    assertStringIncludes(html, "<noscript>",);
    assertStringIncludes(html, "https://github.com/jane",);
    assertStringIncludes(html, "https://jane.dev",);
  });
  it("bakes the Made with linklist brand into the no-JS fallback", () => {
    assertStringIncludes(html, "Made with linklist",);
    const versioned = renderIndexHtml(config, { version: "v9.9.9", },);
    assertStringIncludes(versioned, "Made with linklist · v9.9.9",);
  });
  it("keeps section bodies and plugin anchors out of the fallback", () => {
    assertStringIncludes(html, "Jane Doe",); // profile header still present
    assertEquals(html.includes("secret prose",), false,);
    assertEquals(html.includes("github-repos",), false,);
  });
  it("honors profile.hide in the fallback", () => {
    const hidden: LinklistConfig = {
      ...config,
      profile: { ...config.profile, hide: ["tagline", "avatar",], },
    };
    // `hide` is screen-only: the noscript body must drop the fields, while
    // the <head> (og:image / description) keeps publishing the data.
    const page = renderIndexHtml(hidden,);
    const noscript = page.slice(
      page.indexOf("<noscript>",),
      page.indexOf("</noscript>",),
    );
    assertEquals(noscript.includes("Maker",), false,);
    assertEquals(noscript.includes("avatar.svg",), false,);
    assertStringIncludes(page.split("</head>",)[0]!, "avatar.svg",);
  });
});

describe("renderManifest", () => {
  it("is valid JSON derived from the config, pointing at the avatar", () => {
    const manifest = JSON.parse(renderManifest(config,),) as Record<
      string,
      unknown
    >;
    assertEquals(manifest.name, "Jane — links",);
    assertEquals(manifest.short_name, "Jane Doe",);
    assertEquals(manifest.theme_color, "#2200aa",);
    const icons = manifest.icons as Array<Record<string, string>>;
    assertEquals(icons[0]?.src, "./assets/avatar.svg",);
    assertEquals(icons[0]?.type, "image/svg+xml",);
  });
  it("still emits a generated icon when there is no avatar", () => {
    const noAvatar: LinklistConfig = {
      ...config,
      profile: { name: "Sam", },
    };
    const manifest = JSON.parse(renderManifest(noAvatar,),) as {
      icons: unknown[];
    };
    assertEquals(manifest.icons.length >= 1, true,);
  });
});

describe("renderRobotsTxt", () => {
  it("allows every crawler by default", () => {
    const robots = renderRobotsTxt(config,);
    assertStringIncludes(robots, "User-agent: *",);
    assertStringIncludes(robots, "Allow: /",);
  });
});

describe("generateSite", () => {
  it("returns index.html, manifest.json and robots.txt in order", () => {
    assertEquals(generateSite(config,).map((f,) => f.name), [
      "index.html",
      "manifest.json",
      "robots.txt",
    ],);
  });
});
