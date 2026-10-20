import { assert, } from "@std/assert";
import { describe, it, } from "@std/testing/bdd";
import { linklistCommand, } from "../src/cli.ts";

describe("linklist CLI", () => {
  it("registers the build and validate subcommands", () => {
    assert(linklistCommand.getCommand("build",),);
    assert(linklistCommand.getCommand("validate",),);
  });
});
