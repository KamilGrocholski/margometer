/**
 * JSON text read into a value, and a value written back out as text.
 *
 * Both directions answer whether they worked, because `null` cannot say it: JSON carries `null` as
 * a value of its own, and `undefined` has no JSON text at all (`develop ADR 0021`). The two calls
 * are the platform's, so they stand inside `callForeign` (`AGENTS.md` E4).
 */

import { assert } from "@std/assert/assert";
import { callForeign, err, ok, type Result } from "./result.ts";

export const JSON_FAILURE = {
    unreadable: "json-unreadable",
    nothing: "json-nothing",
    unwritable: "json-unwritable",
} as const;

export type JsonFailure =
    | { kind: typeof JSON_FAILURE.unreadable; cause: unknown }
    /** A function, a symbol, `undefined`: written as no JSON text rather than refused. */
    | { kind: typeof JSON_FAILURE.nothing }
    | { kind: typeof JSON_FAILURE.unwritable; cause: unknown };

export function parseJson(text: string): Result<unknown, JsonFailure> {
    const parsed = callForeign((): unknown => JSON.parse(text));
    if (!parsed.ok) return err({ kind: JSON_FAILURE.unreadable, cause: parsed.error.cause });
    assert(text.length > 0, "text that parsed says something");
    return ok(parsed.value);
}

/** `indentSpaces` where a person will read the result; none where only a reader will. */
export function encodeJson(value: unknown, indentSpaces: number): Result<string, JsonFailure> {
    assert(Number.isSafeInteger(indentSpaces), "text is indented by a whole count of spaces");
    assert(indentSpaces >= 0, "of none or more");
    const written = callForeign((): string | undefined =>
        JSON.stringify(value, null, indentSpaces)
    );
    if (!written.ok) return err({ kind: JSON_FAILURE.unwritable, cause: written.error.cause });
    if (written.value === undefined) return err({ kind: JSON_FAILURE.nothing });
    assert(written.value.length > 0, "a value written as text says something");
    return ok(written.value);
}
