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

/** A function, a symbol, `undefined`: written as no JSON text rather than refused. */
export class JsonTextAbsent extends Error {
    override readonly name = "JsonTextAbsent";
}

export class JsonUnwritable extends Error {
    override readonly name = "JsonUnwritable";

    constructor(cause: errors.Caught) {
        super(undefined, { cause });
    }
}

export function parseJson(text: string): JsonValue | JsonUnreadable {
    const parsed = errors.attempt(() => readJsonValue(JSON.parse(text)));
    if (parsed instanceof Error) return new JsonUnreadable(parsed);
    assert(text.length > 0, "text that parsed says something");
    return parsed;
}

/** Without a reviver, `JSON.parse` answers nothing but these (ECMA-262 §25.5.1). */
function readJsonValue(value: unknown): JsonValue {
    if (value === null) return value;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value;
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value;
    assert(isRecord(value), "JSON text parses into a value JSON has");
    return value;
}

/** `indentSpaces` where a person will read the result; none where only a reader will. */
export function encodeJson(
    value: unknown,
    indentSpaces: number,
): string | JsonTextAbsent | JsonUnwritable {
    assert(Number.isSafeInteger(indentSpaces), "text is indented by a whole count of spaces");
    assert(indentSpaces >= 0, "of none or more");
    const written = errors.attempt((): string | undefined =>
        JSON.stringify(value, null, indentSpaces)
    );
    if (written instanceof Error) return new JsonUnwritable(written);
    if (written === undefined) return new JsonTextAbsent();
    assert(written.length > 0, "a value written as text says something");
    return written;
}
