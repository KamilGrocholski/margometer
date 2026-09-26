/**
 * Asking the running client what the player's own copy calls something (`docs/design.md` §5). The
 * panel asks only where this repository has no word of its own, and no sentence of the game's is
 * written down here. What is refused, and why each refusal exists: `develop ADR 0024`.
 */

import { assert } from "@std/assert/assert";
import * as errors from "#/libs/errors.ts";
import { isRecord } from "#/libs/unknown-value.ts";
import { PAGE_READING, type PageReadFailure, PageReadingAbsent } from "./page-reading.ts";

export interface DictionaryPort {
    /** The category is the client's own filing: an id filed outside `default` needs its name. */
    readLabel(labelId: string, category?: string): string | PageReadFailure;
}

/**
 * Read on production build `53XkBRxF` (2026-08-25) and in development build `1781609507010`:
 * `_t(name, parameters, category)` over `__translations`. ⚠️ **Ask only for an id the client
 * knows** — one it does not is queued with a timer armed to report it before `_t` answers nothing.
 */
const TRANSLATE_FIELD = "_t";
/** The client's own template syntax: the signs it prefixes, and what opens and closes a hole. */
const DIRECTION_SIGNS = "+-";
const HOLE_MARK = "%";
const FULL_STOP = ".";
/** An entry is a label with at most a hole in it; this is far past any the game states. */
export const ENTRY_LENGTH_MAXIMUM = 4096;

export function initPageDictionary(page: unknown): DictionaryPort {
    return {
        readLabel(labelId, category) {
            assert(labelId.length > 0, "an id asked of the client is one the panel named");
            if (category !== undefined) assert(category.length > 0, "and filed somewhere");
            const entry = errors.attempt(() => readPageDictionaryEntry(page, labelId, category));
            if (entry instanceof Error) return entry;
            if (entry === null) return new PageReadingAbsent(PAGE_READING.label);
            // An answer past the bound is no label, and the answer is the game's: refused, never
            // asserted against, from inside a card the panel is composing.
            if (entry.length > ENTRY_LENGTH_MAXIMUM) {
                return new PageReadingAbsent(PAGE_READING.label);
            }
            const label = parseLabel(entry);
            if (label === null) return new PageReadingAbsent(PAGE_READING.label);
            return label;
        },
    };
}

/** Null where no lookup stands on the page, which is every page but the game's, or no text came. */
function readPageDictionaryEntry(page: unknown, labelId: string, category?: string): string | null {
    if (!isRecord(page)) return null;
    const translate = page[TRANSLATE_FIELD];
    if (typeof translate !== "function") return null;
    const entry: unknown = Reflect.apply(translate, page, [labelId, null, category]);
    if (typeof entry !== "string") return null;
    return entry;
}

/** Exported because it is the only place the rule can be checked: the dictionary is not here. */
export function parseLabel(entry: string): string | null {
    assert(
        entry.length <= ENTRY_LENGTH_MAXIMUM,
        "an entry read for a label stays inside that bound",
    );
    if (hasHole(entry)) return null;
    const first = entry[0];
    const isSigned = first === undefined ? false : DIRECTION_SIGNS.includes(first);
    const unsigned = (isSigned ? entry.slice(1) : entry).trim();
    assert(unsigned.length <= entry.length, "taking a sign off never lengthens an entry");
    const label = (unsigned.endsWith(FULL_STOP) ? unsigned.slice(0, -1) : unsigned).trim();
    if (label.length === 0) return null;
    assert(!hasHole(label), "a label carries no hole the client would have filled");
    assert(label.length <= entry.length, "and is no longer than the entry it was read out of");
    return label;
}

/** Two marks with nothing between them is a hole, and any second mark is by definition that. */
function hasHole(entry: string): boolean {
    assert(entry.length <= ENTRY_LENGTH_MAXIMUM, "text walked for a hole stays inside its bound");
    const open = entry.indexOf(HOLE_MARK);
    if (open === -1) return false;
    return entry.indexOf(HOLE_MARK, open + 1) !== -1;
}
