/**
 * @file schema_smoke_test.ts
 * @description Baseline test for the M0 scaffold: the core module loads and
 * exposes a version. Replaced by real validator tests in M1.
 */
import { describe, it, } from "@std/testing/bdd";
import { assertMatch, } from "@std/assert";
import { CORE_VERSION, } from "../src/mod.ts";

describe("@vanaware/linklist-core scaffold", () => {
  it("exposes a semantic version", () => {
    assertMatch(CORE_VERSION, /^\d+\.\d+\.\d+$/,);
  });
});
