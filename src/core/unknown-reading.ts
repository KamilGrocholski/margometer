/**
 * Reading a value nobody typed — a payload from the engine, a recording off disk. Every reading
 * answers null rather than throwing: a shape the game did not send is the caller's to judge.
 */

import { assert } from "@std/assert";

/** A list is an object to `typeof`, and one standing for a record opened a fight nobody fought. */
export function isRecord(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object") return false;
    if (value === null) return false;
    return !Array.isArray(value);
}

export function getNumberFromUnknown(value: unknown): number | null {
    if (typeof value !== "number") return null;
    if (!Number.isFinite(value)) return null;
    assert(Number.isFinite(value), "a number that was read is a number a reading can use");
    return value;
}

/**
 * `JSON.parse` throws on anything it does not like and answers `any` on everything else, so its
 * result arrives here as `unknown` and is walked by whoever wanted a shape.
 */
export function getValueFromJsonText(text: string): unknown {
    assert(typeof text === "string", "text to read is text");
    try {
        const value: unknown = JSON.parse(text);
        return value;
    } catch {
        // Stored text nobody can read is stored text nobody keeps: the caller answers null.
        return null;
    }
}

/** Null where the value cannot be written — a cycle, or something with no text of its own. */
export function composeJsonText(value: unknown): string | null {
    try {
        const text: unknown = JSON.stringify(value);
        assert(text === undefined || typeof text === "string", "writing answers text or nothing");
        return getTextFromUnknown(text);
    } catch {
        // Writing is refused rather than thrown: what to do about it belongs to the caller.
        return null;
    }
}

export function getTextFromUnknown(value: unknown): string | null {
    if (typeof value !== "string") return null;
    if (value.length === 0) return null;
    assert(value.length > 0, "text that was read says something");
    return value;
}
