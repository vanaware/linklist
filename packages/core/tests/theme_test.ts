import {
  assert,
  assertEquals,
  assertNotEquals,
  assertStringIncludes,
} from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import {
  presetVariable,
  readableInk,
  readableLink,
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
    assertStringIncludes(css, "--ll-primary: #ff0066;",);
    assertStringIncludes(css, "--ll-radius: 18px;",);
    assertEquals(css.includes("--ll-text",), false,);
  });

  it("derives a readable --ll-on-primary alongside a custom primary", () => {
    const light = tokensToCss({ primary_color: "#c4b5fd", },);
    assertStringIncludes(light, "--ll-on-primary: #1e1b2e;",);
    const dark = tokensToCss({ primary_color: "#171922", },);
    assertStringIncludes(dark, "--ll-on-primary: #ffffff;",);
  });

  it("derives a contrast-safe --ll-link for text roles", () => {
    // Lavender on a light background must darken to reach AA.
    const css = tokensToCss(
      { primary_color: "#a78bfa", background_color: "#f5f6fb", },
    );
    const link = /--ll-link: (#[0-9a-f]{6});/.exec(css,)?.[1];
    assert(link !== undefined, `missing --ll-link in ${css}`,);
    assertNotEquals(link, "#a78bfa",);
    // A readable color is returned untouched.
    assertStringIncludes(
      tokensToCss({ primary_color: "#4f46e5", background_color: "#ffffff", },),
      "--ll-link: #4f46e5;",
    );
  });

  it("maps the shadow preset to a concrete value", () => {
    const css = tokensToCss({ shadow: "medium", },);
    assertStringIncludes(css, "--ll-shadow: 0 6px 16px",);
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

describe("readableLink", () => {
  it("keeps colors that already clear the contrast bar", () => {
    assertEquals(readableLink("#4f46e5", "#ffffff",), "#4f46e5",);
  });

  it("darkens a light brand color on light backgrounds", () => {
    const out = readableLink("#a78bfa", "#f5f6fb",);
    assert(/^#[0-9a-f]{6}$/.test(out,), out,);
    // Blending toward black lowers every channel, but the hue must survive:
    // the red byte stays in the purple band, never near-black.
    const r = parseInt(out.slice(1, 3,), 16,);
    assert(r <= 0xa7 && r >= 0x50, `darkened red out of band: ${out}`,);
  });

  it("lightens a dark brand color on dark backgrounds", () => {
    const out = readableLink("#4f46e5", "#0e0f13",);
    assert(/^#[0-9a-f]{6}$/.test(out,), out,);
    assert(parseInt(out.slice(3, 5,), 16,) >= 0x46, out,);
  });

  it("returns the input for unparsable colors", () => {
    assertEquals(readableLink("nonsense", "#ffffff",), "nonsense",);
  });
});

describe("presetVariable", () => {
  it("reads a hex custom property from preset CSS", () => {
    assertEquals(
      presetVariable(":root { --ll-background: #0e0f13; }", "--ll-background",),
      "#0e0f13",
    );
    assertEquals(
      presetVariable(":root { --ll-background: #0e0f13; }", "--ll-missing",),
      undefined,
    );
  });
});

describe("resolveThemeCss", () => {
  it("joins preset base with token overrides", () => {
    const css = resolveThemeCss(
      { preset: "minimal-dark", custom: { primary_color: "#123456", }, },
      ":root { --ll-background: #0e0f13; --ll-radius: 10px; }",
    );
    assertStringIncludes(css, "--ll-radius: 10px;",);
    assertStringIncludes(css, "--ll-primary: #123456;",);
    // --ll-link is derived against the PRESET background via fallback.
    assert(/--ll-link: #[0-9a-f]{6};/.test(css,), css,);
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
