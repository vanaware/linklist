/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

/**
 * @file build.ts
 * @description CLI of the build orchestrator based on Deno.bundle (denobuild).
 * Delegates execution to the @vanaware/buildit library
 * and loads the declarative configuration from denobuild.jsonc.
 */

import { denoBuildCli, } from "@vanaware/buildit/cli/denobuild";

if (import.meta.main) {
  const cli = denoBuildCli();
  await cli.parse(Deno.args,);
}
