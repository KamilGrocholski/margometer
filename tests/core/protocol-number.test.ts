/**
 * The shape the protocol writes a percentage in.
 *
 * The arithmetic is proved in `tests/libs/number-text.test.ts`. What is proved here is the width
 * the recordings measured, and that text of another width is not read as a percentage.
 */

import { assertStrictEquals } from "@std/assert";
import {
    encodeHealthPercent,
    HEALTH_PERCENT_PLACES,
    parseHealthPercent,
} from "#/src/core/protocol-number.ts";

Deno.test("a percentage is read at the width the recordings state and no other", () => {
    assertStrictEquals(parseHealthPercent("70.07"), 70.07, "two places is what was measured");
    assertStrictEquals(parseHealthPercent("0.00"), 0, "and nothing left is read at that width");
    assertStrictEquals(parseHealthPercent("0.01"), 0.01, "as is the least above it");
    assertStrictEquals(parseHealthPercent("100.00"), 100, "as is everything left");

    assertStrictEquals(parseHealthPercent("70.0"), null, "one place is a shape nobody wrote");
    assertStrictEquals(parseHealthPercent("70.070"), null, "and three places is another");
    assertStrictEquals(parseHealthPercent("70"), null, "a percentage always carries its fraction");
    assertStrictEquals(parseHealthPercent(".07"), null, "and its whole part");
    assertStrictEquals(parseHealthPercent("-1.00"), null, "and is never below nothing");
});

Deno.test("a percentage writes back at the width it is read at", () => {
    assertStrictEquals(HEALTH_PERCENT_PLACES, 2, "the width the recordings were measured at");
    assertStrictEquals(encodeHealthPercent(70.07), "70.07", "a percentage keeps its places");
    assertStrictEquals(encodeHealthPercent(70), "70.00", "one written whole is filled out");
    assertStrictEquals(encodeHealthPercent(0), "0.00", "and so is nothing left");
    assertStrictEquals(parseHealthPercent(encodeHealthPercent(70.07)), 70.07, "and reads back");
});
