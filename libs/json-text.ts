/**
 * JSON text read into a value, and a value written back out as text.
 *
 * Both directions answer with a failure of their own, because `null` cannot say it: JSON carries
 * `null` as a value of its own, and `undefined` has no JSON text at all (`develop ADR 0021`). The
 * two calls are the platform's, so they stand inside `attempt` (`AGENTS.md` E4).
 */

import { assert } from "@std/assert/assert";
import * as errors from "./errors.ts";
import { isRecord, type UnknownRecord } from "./unknown-value.ts";

/**
 * What `JSON.parse` answers, read one level deep: the level a caller branches on, and one an
 * `Error` does not fit, so a failure beside it is still asked about.
 */
export type JsonValue = null | boolean | number | string | readonly unknown[] | UnknownRecord;

export class JsonUnreadable extends Error {
    override readonly name = "JsonUnreadable";

    constructor(cause: errors.Caught) {
        super(undefined, { cause });
    }
}

/**
 * Refused, or a function, a symbol or `undefined`, which have no JSON text: `cause` is `null` for
 * those. No caller does anything different between the two.
 */
export class JsonUnwritable extends Error {
    override readonly name = "JsonUnwritable";

    constructor(cause: errors.Caught | null) {
        super(undefined, { cause });
    }
}

/** What `JSON.stringify` clamps a larger indent to (ECMA-262 §25.5.2). */
const INDENT_SPACES_MAXIMUM = 10;

export function parseJson(text: string): JsonValue | JsonUnreadable {
    const parsed = errors.attempt((): JsonValue => {
        const parsedText: unknown = JSON.parse(text);
        // Without a reviver, `JSON.parse` answers nothing but these (ECMA-262 §25.5.1).
        if (parsedText === null) return parsedText;
        if (typeof parsedText === "boolean") return parsedText;
        if (typeof parsedText === "number") return parsedText;
        if (typeof parsedText === "string") return parsedText;
        if (Array.isArray(parsedText)) return parsedText;
        assert(isRecord(parsedText), "JSON text parses into a value JSON has");
        return parsedText;
    });
    if (parsed instanceof Error) return new JsonUnreadable(parsed);
    assert(text.length > 0, "text that parsed says something");
    return parsed;
}

export function encodeJson(
    encodable: unknown,
    indentSpaces: number,
): string | JsonUnwritable {
    assert(Number.isSafeInteger(indentSpaces), "text is indented by a whole count of spaces");
    assert(indentSpaces >= 0, "of none or more");
    assert(indentSpaces <= INDENT_SPACES_MAXIMUM, "and no more than the platform writes");
    const written = errors.attempt((): string | undefined =>
        JSON.stringify(encodable, null, indentSpaces)
    );
    if (written instanceof Error) return new JsonUnwritable(written);
    if (written === undefined) return new JsonUnwritable(null);
    assert(written.length > 0, "a value written as text says something");
    return written;
}
