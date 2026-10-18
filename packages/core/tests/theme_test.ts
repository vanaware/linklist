import { assertEquals, assertStringIncludes, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import {
  resolveThemeCss,
  themeBodyClass,
  themeColor,
  tokensToCss,
} from "../src/theme.ts";

describe("tokensToCss", () => {
  it("returns empty string when there are no tokens", () => {
    assertEquals(tokensToCss(undefined,), "",);
    assertEquals(tokensToCss({},), "",);
  });

  it("emits only the provided overrides", () => {
    const css = tokensToCss({ primary_color: "#ff0066", radius: "18px", },);
    assertStringIncludes(css, "--primary: #ff0066;",);
    assertStringIncludes(css, "--radius: 18px;",);
    assertEquals(css.includes("--text",), false,);
  });

  it("maps the shadow preset to a concrete value", () => {
    const css = tokensToCss({ shadow: "medium", },);
    assertStringIncludes(css, "--shadow: 0 3px 10px",);
  });
});

describe("resolveThemeCss", () => {
  it("joins preset base with token overrides", () => {
    const css = resolveThemeCss(
      { preset: "minimal-dark", custom: { primary_color: "#123456", }, },
      ":root { --radius: 10px; }",
    );
    assertStringIncludes(css, "--radius: 10px;",);
    assertStringIncludes(css, "--primary: #123456;",);
  });
});

describe("theme mode and color", () => {
  it("defaults the body class to auto", () => {
    assertEquals(themeBodyClass({ preset: "x", },), "auto",);
    assertEquals(themeBodyClass({ preset: "x", mode: "dark", },), "dark",);
  });

  it("uses the primary color for theme-color, else a default", () => {
    assertEquals(themeColor({ preset: "x", },), "#6750a4",);
    assertEquals(
      themeColor({ preset: "x", custom: { primary_color: "#abcdef", }, },),
      "#abcdef",
    );
  });
});
