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

/** Null only where the value is not text. Text saying nothing is text, and answers itself. */
export function getTextFromUnknown(value: unknown): string | null {
    if (typeof value !== "string") return null;
    assert(typeof value === "string", "a value read as text is text");
    return value;
}

/** Whether text states anything is a judgment, so it is asked for by name and never folded in. */
export function getStatedTextFromUnknown(value: unknown): string | null {
    const text = getTextFromUnknown(value);
    if (text === null) return null;
    if (text.length === 0) return null;
    assert(text.length > 0, "text that states something says something");
    return text;
}
