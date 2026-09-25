/**
 * What a recording says about where it was taken, beyond the fight (`docs/design.md` §11): the
 * world, read off the page's host, and the browser, in its own words. Neither is guessed: a page
 * that states none gets the word saying nobody knows, and a browser that says nothing gets null.
 */

import { assert } from "@std/assert/assert";
import { callForeign } from "@/libs/result.ts";
import { isRecord } from "@/libs/unknown-value.ts";

export interface SurroundingsPort {
    readWorld(): string;
    readUserAgent(): string | null;
}

/** In a file's name and its envelope, where the world would go. */
export const WORLD_UNKNOWN = "unknown";

/**
 * ⚠️ **Read through the prototype, not as own fields**: a browser keeps `navigator.userAgent` on
 * `Navigator.prototype`, so the own-field readers of `libs/unknown-value.ts` would find nothing.
 */
const LOCATION_FIELD = "location";
const HOST_FIELD = "hostname";
const NAVIGATOR_FIELD = "navigator";
const USER_AGENT_FIELD = "userAgent";
const HOST_SEPARATOR = ".";

export function initPageSurroundings(page: unknown): SurroundingsPort {
    return {
        readWorld() {
            const read = callForeign(() => readPageText(page, LOCATION_FIELD, HOST_FIELD));
            if (!read.ok) return WORLD_UNKNOWN;
            return parseWorld(read.value ?? "");
        },
        readUserAgent() {
            const read = callForeign(() => readPageText(page, NAVIGATOR_FIELD, USER_AGENT_FIELD));
            if (!read.ok) return null;
            return read.value;
        },
    };
}

/**
 * ⚠️ **A page with no hostname gives `""`**, and the first label of `""` is `""` — not nullish, so
 * a recording carried a world of nothing and a file named with a hole where the answer goes. Seen
 * on a `file://` page, in v1.
 */
export function parseWorld(host: string): string {
    const end = host.indexOf(HOST_SEPARATOR);
    const world = end === -1 ? host : host.slice(0, end);
    assert(world.length <= host.length, "a world is part of the host it was read off");
    if (world.length === 0) return WORLD_UNKNOWN;
    return world;
}

/** Null where the page holds no such text, or holds it empty: nothing stated is no answer. */
function readPageText(page: unknown, held: string, field: string): string | null {
    assert(held.length > 0, "a field of the page is asked for by name");
    if (!isRecord(page)) return null;
    const record = page[held];
    if (!isRecord(record)) return null;
    const text = record[field];
    if (typeof text !== "string") return null;
    if (text.length === 0) return null;
    return text;
}
