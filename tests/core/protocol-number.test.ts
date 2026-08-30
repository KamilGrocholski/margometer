/**
 * The shapes the protocol writes a percentage and a share in.
 *
 * The arithmetic is proved in `tests/libs/number-text.test.ts`; what is proved here is the width
 * `captures/` measured, and that text of another width is not read as a percentage.
 */

import { assertEquals } from "@std/assert";
import {
    composeHealthPercentText,
    getHealthPercentFromText,
    getShareFromText,
    HEALTH_PERCENT_PLACES,
} from "@/src/core/protocol-number.ts";

Deno.test("a percentage is read at the width the recordings state and no other", () => {
    assertEquals(getHealthPercentFromText("70.07"), 70.07, "two places is what was measured");
    assertEquals(getHealthPercentFromText("0.00"), 0, "and nothing left is read at that width");
    assertEquals(getHealthPercentFromText("100.00"), 100, "as is everything left");

    assertEquals(getHealthPercentFromText("70.0"), null, "one place is a shape nobody wrote");
    assertEquals(getHealthPercentFromText("70.070"), null, "and three places is another");
    assertEquals(getHealthPercentFromText("70"), null, "a percentage always carries its fraction");
    assertEquals(getHealthPercentFromText("-1.00"), null, "and is never below nothing");
});

Deno.test("a share is read in both spellings the recordings carry", () => {
    assertEquals(getShareFromText("30"), 30, "a share written whole");
    assertEquals(getShareFromText("22.5"), 22.5, "and a share written with a fraction");
    assertEquals(getShareFromText("0"), 0, "zero is a share, not a refusal");
    assertEquals(getShareFromText("nope"), null, "while text that is not a number states none");
});

Deno.test("a percentage writes back at the width it is read at", () => {
    assertEquals(HEALTH_PERCENT_PLACES, 2, "the width the recordings were measured at");
    assertEquals(composeHealthPercentText(70.07), "70.07", "a percentage keeps its places");
    assertEquals(composeHealthPercentText(70), "70.00", "one written whole is filled out to them");
    assertEquals(composeHealthPercentText(0), "0.00", "and so is nothing left");
    assertEquals(
        getHealthPercentFromText(composeHealthPercentText(70.07)),
        70.07,
        "and reads back",
    );
});
