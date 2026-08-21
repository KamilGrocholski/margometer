/**
 * The two error hierarchies, held apart.
 *
 * §9.5 makes them deliberately disjoint so that a `catch` in the add-on cannot
 * swallow a tool's error believing it caught its own, and this is the file that
 * proves it: neither base answers to the other, both are abstract, and every
 * subclass carries a `code` and a branded `name` so nothing has to match on
 * message text. It is also the one place in `tests/` that reads both bases, which
 * §9.1 permits for exactly this reason.
 */

import { describe, expect, test } from "bun:test";
import { MargoMeterError } from "@/src/core/margometer-error.ts";
import { ProtocolMessageFormatError } from "@/src/core/protocol-message.ts";
import { FightDumpFormatError, parseFightDump } from "@/tools/fight-dump-parser.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

describe("errors thrown by the add-on", () => {
  const error = new ProtocolMessageFormatError("bad side", "0;x;step");

  // The whole point of the base: the console shows whose error this is before
  // it shows anything else. The add-on shares a console with the game.
  test("says it belongs to MargoMeter before saying anything else", () => {
    expect(error.name).toBe("MargoMeter/ProtocolMessageFormat");
    expect(String(error)).toStartWith("MargoMeter/ProtocolMessageFormat:");
  });

  test("carries a code that matches its name", () => {
    expect(error.code).toBe("ProtocolMessageFormat");
    expect(error.name).toBe(`MargoMeter/${error.code}`);
  });

  test("keeps the detail of what went wrong", () => {
    expect(error.message).toContain("bad side");
    expect(error.message).toContain("0;x;step");
  });

  // A `catch` receives `unknown`. This is the check that our errors can be told
  // apart from the game's and from other add-ons' at exactly that moment.
  test("is recognisable as ours after being caught as unknown", () => {
    const caught: unknown = error;
    expect(caught instanceof MargoMeterError).toBe(true);
    expect(caught instanceof ProtocolMessageFormatError).toBe(true);
    expect(caught instanceof MargoMeterToolError).toBe(false);
  });

  test("still behaves as an Error", () => {
    expect(error).toBeInstanceOf(Error);
    expect(error.stack).toBeTruthy();
  });
});

describe("errors thrown by the tooling", () => {
  const error = new FightDumpFormatError("wpisy[0].nr", "a finite number", "x");

  test("says it belongs to the MargoMeter tooling", () => {
    expect(error.name).toBe("MargoMeterTool/FightDumpFormat");
    expect(error.code).toBe("FightDumpFormat");
  });

  // Two hierarchies on purpose. A catch meant for one must not swallow the
  // other — they run in different worlds and mean different things.
  test("is not an add-on error, and vice versa", () => {
    expect(error instanceof MargoMeterToolError).toBe(true);
    expect(error instanceof MargoMeterError).toBe(false);
  });

  // Without `cause`, the only thing left of a JSON failure is our own sentence,
  // and the position the parser choked on — the useful part — is gone.
  test("keeps the underlying failure in `cause` when wrapping one", () => {
    let thrown: unknown;
    try {
      parseFightDump("{ not json");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(FightDumpFormatError);
    expect((thrown as Error).cause).toBeInstanceOf(Error);
  });
});
