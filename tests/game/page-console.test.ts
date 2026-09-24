/**
 * The console line a defect is told once on: branded, so it is never read as the game's, and a
 * console that refuses it is not the exception the page sees.
 */

import { assertEquals } from "@std/assert";
import { initPageConsole } from "@/src/game/page-console.ts";

Deno.test("the line is branded with the kind, and carries the detail beside it", () => {
    const written: unknown[][] = [];
    const port = initPageConsole({ error: (...values) => void written.push(values) });
    const detail = { kind: "invariant-broken", cause: "x" };
    port.writeBrandedLine("reading", detail);
    assertEquals(written, [["MargoMeter/Panel reading", detail]], "one line, brand first");
});

Deno.test("a console that throws is discarded without escaping", () => {
    let asked = 0;
    const port = initPageConsole({
        error: () => {
            asked += 1;
            throw new Error("a console that will not write");
        },
    });
    port.writeBrandedLine("engine", null);
    assertEquals(asked, 1, "the console was asked, and its refusal went no further");
});
