import { describe, expect, test } from "bun:test";
import { assert, assertDefined, AssertionFailure } from "@/libs/assert.ts";
import { MargoMeterError } from "@/src/core/margometer-error.ts";
import { MargoMeterToolError } from "@/tools/margometer-tool-error.ts";

describe("assert", () => {
  test("lets a satisfied invariant through", () => {
    expect(() => assert(true, "always true")).not.toThrow();
  });

  test("throws on a broken invariant, quoting it", () => {
    expect(() => assert(false, "two side segments")).toThrow(AssertionFailure);
    expect(() => assert(false, "two side segments")).toThrow("two side segments");
  });

  test("narrows the type it asserted", () => {
    const value: string | null = "present" as string | null;
    assert(value !== null, "value is present");
    // Reaching `.length` without a cast is the assertion doing its job.
    expect(value.length).toBe(7);
  });
});

describe("assertDefined", () => {
  test("returns the value it was given", () => {
    expect(assertDefined("present", "value is present")).toBe("present");
  });

  test("throws on null and on undefined", () => {
    expect(() => assertDefined(null, "value is present")).toThrow(AssertionFailure);
    expect(() => assertDefined(undefined, "value is present")).toThrow(AssertionFailure);
  });

  // A truthiness check here would reject values the caller meant to allow, and
  // `0` is a perfectly ordinary combatant id offset or damage figure.
  test("lets falsy values that are defined through", () => {
    expect(assertDefined(0, "value is present")).toBe(0);
    expect(assertDefined("", "value is present")).toBe("");
    expect(assertDefined(false, "value is present")).toBe(false);
  });
});

describe("a broken assertion", () => {
  const failure = new AssertionFailure("two side segments");

  test("says it belongs to MargoMeter", () => {
    expect(failure.name).toBe("MargoMeter/Assertion");
    expect(String(failure)).toStartWith("MargoMeter/Assertion:");
  });

  // The whole reason this sits outside both hierarchies: a code exists so that
  // someone can recognise a failure and handle it. Nobody handles a broken
  // invariant — the only correct response is to fix the program — so a code
  // here would promise a reaction that does not exist.
  test("carries no error code, because nothing is meant to handle it", () => {
    expect("code" in failure).toBe(false);
  });

  test("is neither an add-on error nor a tooling error", () => {
    const caught: unknown = failure;
    expect(caught instanceof AssertionFailure).toBe(true);
    expect(caught instanceof MargoMeterError).toBe(false);
    expect(caught instanceof MargoMeterToolError).toBe(false);
  });

  test("keeps a stack, which is what says where it broke", () => {
    expect(failure.stack).toBeTruthy();
  });
});
