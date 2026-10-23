import { assert, assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import {
  readableInk,
  themeBodyClass,
  themeColor,
  tokensToCss,
} from "../src/lib/theme.ts";

describe("tokensToCss", () => {
  it("returns empty string when there are no tokens", () => {
    assertEquals(tokensToCss(undefined,), "",);
    assertEquals(tokensToCss({},), "",);
  });

  it("emits BeerCSS color tokens (never the old --ll-* namespace)", () => {
    const css = tokensToCss({ primary_color: "#ff0066", },);
    assertStringIncludes(css, "--primary: #ff0066;",);
    assert(/--on-primary: #[0-9a-f]{6};/.test(css,), css,);
    assert(/--primary-container: #[0-9a-f]{6};/.test(css,), css,);
    assert(/--on-primary-container: #[0-9a-f]{6};/.test(css,), css,);
    assertEquals(css.includes("--ll-",), false,);
  });

  it("derives a readable --on-primary ink from the chosen primary", () => {
    // A light brand takes dark ink; a dark brand takes light ink.
    assertStringIncludes(
      tokensToCss({ primary_color: "#c4b5fd", },),
      "--on-primary: #1e1b2e;",
    );
    assertStringIncludes(
      tokensToCss({ primary_color: "#171922", },),
      "--on-primary: #ffffff;",
    );
  });

  it("maps font_family to the BeerCSS --font token", () => {
    assertStringIncludes(
      tokensToCss({ font_family: "Georgia, serif", },),
      "--font: Georgia, serif;",
    );
  });

  it("only emits the tokens that are present", () => {
    const css = tokensToCss({ font_family: "Georgia, serif", },);
    assertStringIncludes(css, "--font: Georgia, serif;",);
    assertEquals(css.includes("--primary",), false,);
  });
});

describe("readableInk", () => {
  it("picks dark ink on light fills and light ink on dark fills", () => {
    assertEquals(readableInk("#c4b5fd",), "#1e1b2e",);
    assertEquals(readableInk("#171922",), "#ffffff",);
    assertEquals(readableInk("#a78bfa",), "#1e1b2e",);
  });

  it("falls back to the dark ink for unparsable colors", () => {
    assertEquals(readableInk("not-a-color",), "#1e1b2e",);
  });

  it("honors custom ink candidates", () => {
    assertEquals(readableInk("#ffffff", "#111111", "#222222",), "#111111",);
  });
});

describe("theme mode and color", () => {
  it("maps mode to a BeerCSS body class (auto and default resolve to empty)", () => {
    // BeerCSS has no `auto` class: the inline head script resolves it, so the
    // static body class stays empty for both auto and an unspecified mode.
    assertEquals(themeBodyClass({ preset: "x", },), "",);
    assertEquals(themeBodyClass({ preset: "x", mode: "auto", },), "",);
    assertEquals(themeBodyClass({ preset: "x", mode: "dark", },), "dark",);
    assertEquals(themeBodyClass({ preset: "x", mode: "light", },), "light",);
  });

  it("uses the primary color for theme-color, else a default", () => {
    assertEquals(themeColor({ preset: "x", },), "#6750a4",);
    assertEquals(
      themeColor({ preset: "x", custom: { primary_color: "#abcdef", }, },),
      "#abcdef",
    );
  });
});
