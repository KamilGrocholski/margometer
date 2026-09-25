/**
 * The two broad catches: what each turns into a record, and that a clean run is left alone.
 */

import { assertEquals, assertStrictEquals, assertThrows } from "@std/assert";
import { assert } from "@std/assert/assert";
import { callForeign, err, ok, RESULT_FAILURE, runGuarded } from "#/libs/result.ts";

Deno.test("a value and a failure are records with a discriminant", () => {
    assertEquals(ok(0), { ok: true, value: 0 }, "zero is a value like any other");
    assertEquals(ok(1), { ok: true, value: 1 }, "and so is its neighbour");
    assertEquals(
        err({ kind: "x" }),
        { ok: false, error: { kind: "x" } },
        "a failure keeps its kind",
    );
    assertThrows(() => err({ kind: "" }), Error, "a failure names its kind");
});

Deno.test("a call into somebody else's code answers its value, or what it threw", () => {
    assertEquals(callForeign(() => 7), ok(7), "a call that returns is its value");
    const thrown = new TypeError("somebody else's");
    const failed = callForeign((): number => {
        throw thrown;
    });
    assertStrictEquals(failed.ok, false, "a call that throws is a failure");
    if (failed.ok) return;
    assertStrictEquals(failed.error.kind, RESULT_FAILURE.foreignThrew, "named as foreign");
    assertStrictEquals(failed.error.cause, thrown, "and carrying what was thrown");
});

Deno.test("an assertion at a boundary is a broken invariant, and a clean step a value", () => {
    assertEquals(runGuarded(() => "drawn"), ok("drawn"), "a step that holds is its value");
    const broken = runGuarded(() => assert(false, "an invariant of ours"));
    assertStrictEquals(broken.ok, false, "a step whose assertion fires is a failure");
    if (broken.ok) return;
    assertStrictEquals(broken.error.kind, RESULT_FAILURE.invariantBroken, "named as ours");
});
