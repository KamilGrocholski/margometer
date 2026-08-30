/**
 * JSON text read into a value, and a value written back out as text.
 *
 * Both directions answer whether they worked, because `null` cannot say it: JSON carries `null`
 * as a value of its own, and `undefined` has no JSON text at all. **ADR 0021.**
 */

import { assert } from "@std/assert";

/** `cause` is what the reader threw, so a caller can say where the text stopped making sense. */
export type JsonReading =
    | { isOk: true; value: unknown }
    | { isOk: false; error: "unreadable"; cause: unknown };

/** `nothing` is a value with no JSON text of its own, and nothing threw, so its cause is null. */
export type JsonWriting =
    | { isOk: true; text: string }
    | { isOk: false; error: "nothing" | "unwritable"; cause: unknown };

export function getJsonReading(text: string): JsonReading {
    assert(typeof text === "string", "text to read is text");
    try {
        const value: unknown = JSON.parse(text);
        return { isOk: true, value };
    } catch (cause) {
        return { isOk: false, error: "unreadable", cause };
    }
}

/** `indentSpaces` where a person will read the result; omitted where only a reader will. */
export function composeJsonWriting(value: unknown, indentSpaces = 0): JsonWriting {
    assert(indentSpaces >= 0, "text is indented by nothing or by something");
    let written: unknown = undefined;
    try {
        written = JSON.stringify(value, null, indentSpaces);
    } catch (cause) {
        return { isOk: false, error: "unwritable", cause };
    }
    // A function, a symbol and `undefined` are written as nothing rather than refused.
    if (written === undefined) return { isOk: false, error: "nothing", cause: null };
    assert(typeof written === "string", "a value that was written was written as text");
    return { isOk: true, text: written };
}
