/**
 * BuildIt Watch CLI Entry Point.
 * Delegated to the @vanaware/buildit utility.
 */
import { watchCli, } from "@vanaware/buildit/cli/watch";

if (import.meta.main) {
  await watchCli().parse(Deno.args,);
}
