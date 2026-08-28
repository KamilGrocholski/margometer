/**
 * Reading a value nobody typed: a payload from the engine, a recording off disk.
 *
 * `typeof null` is `"object"`, so the null case is a line of its own rather than a clause of the
 * first. Every reading answers null instead of throwing, because what to do about a shape the
 * game did not send is the caller's to decide.
 */

import { assert } from "@std/assert";

export function isRecord(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object") return false;
    return value !== null;
}

export function getNumberFromUnknown(value: unknown): number | null {
    if (typeof value !== "number") return null;
    if (!Number.isFinite(value)) return null;
    assert(Number.isFinite(value), "a number that was read is a number a reading can use");
    return value;
}

export function getTextFromUnknown(value: unknown): string | null {
    if (typeof value !== "string") return null;
    if (value.length === 0) return null;
    assert(value.length > 0, "text that was read says something");
    return value;
}
