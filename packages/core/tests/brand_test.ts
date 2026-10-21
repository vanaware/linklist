/**
 * @file brand_test.ts
 * @description Unit tests for the shared footer brand helper used by both the
 * runtime footer and the build-time `<noscript>` fallback.
 */
import { assertEquals, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { brandText, } from "../src/lib/brand.ts";

describe("brandText", () => {
  it("renders the product name with a normalized version", () => {
    assertEquals(brandText("0.2.5",), "Made with linklist · v0.2.5",);
    assertEquals(brandText("v0.2.5",), "Made with linklist · v0.2.5",);
  });

  it("keeps a build-metadata suffix verbatim", () => {
    assertEquals(
      brandText("0.2.5#mvio7h7a",),
      "Made with linklist · v0.2.5#mvio7h7a",
    );
  });

  it("degrades to the bare name without a version", () => {
    assertEquals(brandText(), "Made with linklist",);
    assertEquals(brandText("",), "Made with linklist",);
  });
});
