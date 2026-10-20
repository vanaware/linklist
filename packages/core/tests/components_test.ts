import { assertEquals, assertStringIncludes, } from "@std/assert";
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
  links: [
    {
      title: "GitHub",
      url: "https://github.com/jane",
      icon: "github",
      new_tab: true,
    },
    {
      title: "Blog",
      url: "https://jane.dev",
      subtitle: "my *blog*",
      button: true,
      nofollow: true,
    },
  ],
  theme: { preset: "minimal-dark", mode: "dark", },
  sections: [{ title: "About", body: "hello **there**", placement: "after", },],
  plugins: { show_last_updated: true, },
};

const toHtml = (node: unknown,) =>
  renderToString(node as Parameters<typeof renderToString>[0],);

describe("App", () => {
  const html = toHtml(
    App({ config, timestamp: Date.parse("2026-01-02T00:00:00Z",), },),
  );

  it("renders the profile header with Markdown bio", () => {
    assertStringIncludes(html, "Jane Doe",);
    assertStringIncludes(html, "<strong>open</strong>",);
    assertStringIncludes(html, 'alt="Jane"',);
  });

  it("renders link rel/target semantics", () => {
    assertStringIncludes(html, 'target="_blank"',);
    assertStringIncludes(html, 'rel="noopener noreferrer"',);
    assertStringIncludes(html, 'rel="nofollow"',);
    assertStringIncludes(html, '<a href="https://jane.dev"',);
  });

  it("renders inline Markdown in a link subtitle", () => {
    assertStringIncludes(html, "<em>blog</em>",);
  });

  it("renders the section title and last-updated footer", () => {
    assertStringIncludes(html, "About",);
    assertStringIncludes(html, "2026-01-02",);
  });

  it("shows an empty state when no config is available", () => {
    assertStringIncludes(toHtml(App({},),), "No configuration loaded.",);
  });
});
