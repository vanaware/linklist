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
  },
  links: [
    { title: "GitHub", url: "https://github.com/jane", },
    { title: "Site", url: "https://jane.dev", },
  ],
  theme: { preset: "minimal-dark", custom: { primary_color: "#2200aa", }, },
  seo: {
    title: "Jane — links",
    url: "https://jane.dev/",
    description: "Jane's links",
    lang: "pt",
  },
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
