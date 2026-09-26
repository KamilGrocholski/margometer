/**
 * The one broad catch: what it turns a throw into, and that a clean run is left alone.
 */

import { assertInstanceOf, assertStrictEquals } from "@std/assert";
import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";

Deno.test("a call that returns is its value, zero and its neighbour alike", () => {
    assertStrictEquals(errors.attempt(() => 0), 0, "zero is a value like any other");
    assertStrictEquals(errors.attempt(() => 1), 1, "and so is its neighbour");
});

Deno.test("a call that throws is caught, carrying what was thrown", () => {
    const thrown = new TypeError("somebody else's");
    const failed = errors.attempt((): number => {
        throw thrown;
    });
    assertInstanceOf(failed, errors.Caught, "a call that throws is a failure");
    assertStrictEquals(failed.cause, thrown, "and carries what was thrown");
    assertStrictEquals(failed.name, "Caught", "named as its class is");
});

Deno.test("an assertion that fires is caught like any throw, and a thrown non-Error too", () => {
    const broken = errors.attempt(() => assert(false, "an invariant of ours"));
    assertInstanceOf(broken, errors.Caught, "a step whose assertion fires is a failure");
    const odd = errors.attempt((): string => {
        throw "text";
    });
    assertInstanceOf(odd, errors.Caught, "whatever was thrown is wrapped");
    assertStrictEquals(odd.cause, "text", "and kept as it was");
});
