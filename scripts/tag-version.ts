/// <reference lib="deno.ns" />

/**
 * @file tag-version.ts
 * @description CLI that creates and publishes a git tag from the deno.json[c] version.
 * Generates tags in the vMAJOR.MINOR format and pushes them to the remote repository.
 */

import { tagVersionCli, } from "@vanaware/buildit/cli/tag-version";

if (import.meta.main) {
  const cli = tagVersionCli();
  await cli.parse(Deno.args,);
}
