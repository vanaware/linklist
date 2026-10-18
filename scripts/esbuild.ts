/// <reference lib="deno.ns" />

/**
 * @file esbuild.ts
 * @description CLI of the build orchestrator based on native esbuild.
 * Delegates execution to the @vanaware/buildit library
 * and loads the declarative configuration from esbuild.jsonc.
 */

import { esBuildCli, } from "@vanaware/buildit/cli/esbuild";

if (import.meta.main) {
  const cli = esBuildCli();
  await cli.parse(Deno.args,);
}
