/**
 * @file head_test.ts
 * @description Unit tests for runtime head injection. `headFragment` is the pure
 * string builder (asserted here); `applyHead` only touches the DOM, so in Deno
 * (no `document`) it must be a safe no-op rather than throwing.
 */
import { assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { applyHead, headFragment, } from "../src/head.ts";
import type { LinklistConfig, } from "../src/types.ts";

const config: LinklistConfig = {
  profile: { name: "Jane Doe", tagline: "Maker", },
  links: [{ title: "Site", url: "https://jane.dev", },],
  theme: { preset: "minimal-dark", custom: { primary_color: "#2200aa", }, },
  seo: {
    title: "Jane — links",
    url: "https://jane.dev/",
    twitter: "@janedoe",
  },
};

describe("headFragment", () => {
  const html = headFragment(config,);
  it("emits the per-config title, OG type and JSON-LD", () => {
    assertStringIncludes(html, "<title>Jane — links</title>",);
    assertStringIncludes(html, 'property="og:type" content="profile"',);
    assertStringIncludes(html, "application/ld+json",);
  });
});

describe("applyHead", () => {
  it("is a safe no-op when there is no DOM document", () => {
    applyHead(config, undefined,); // explicit no document
    applyHead(config,); // global has no `document` under Deno
  });
});
