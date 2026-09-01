/**
 * Asking the running client what the player's own copy calls something.
 *
 * The panel asks only where this repository has no word of its own, so a mechanic nobody here has
 * read a name for is named by the game rather than by us, and no sentence of the game's is written
 * down here (`NOTICE.md`). What is refused, and why each refusal exists: **ADR 0024**.
 */

import { assert } from "@std/assert/assert";
import { isRecord } from "@/libs/unknown-reading.ts";

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
const MAXIMUM_ENTRY = 4096;

export type TranslateLabel = (id: string) => string | null;

/** Two marks with nothing between them is a hole, and any second mark is by definition that. */
function hasHole(entry: string): boolean {
    assert(entry.length <= MAXIMUM_ENTRY, "text walked for a hole stays inside its stated bound");
    const open = entry.indexOf(HOLE_MARK);
    if (open === -1) return false;
    assert(open >= 0, "a mark found sits somewhere in the text");
    return entry.indexOf(HOLE_MARK, open + 1) !== -1;
}

/** Exported because it is the only place the rule can be checked: the dictionary is not here. */
export function getLabelFromEntry(entry: string): string | null {
    assert(entry.length <= MAXIMUM_ENTRY, "an entry read for a label stays inside that bound");
    if (hasHole(entry)) return null;
    const first = entry[0];
    const isSigned = first !== undefined && DIRECTION_SIGNS.includes(first);
    const unsigned = (isSigned ? entry.slice(1) : entry).trim();
    assert(unsigned.length <= entry.length, "taking a sign off never lengthens an entry");
    const label = (unsigned.endsWith(FULL_STOP) ? unsigned.slice(0, -1) : unsigned).trim();
    if (label.length === 0) return null;
    assert(!hasHole(label), "a label carries no hole the client would have filled");
    assert(label.length <= entry.length, "and is no longer than the entry it was read out of");
    return label;
}

/** Null on a page with no game on it, which is every page but the one. */
export function readDictionaryFromPage(page: unknown): TranslateLabel | null {
    if (!isRecord(page)) return null;
    const translate = page[TRANSLATE_FIELD];
    if (typeof translate !== "function") return null;
    assert(TRANSLATE_FIELD.length > 0, "the client's own field is named before it is read");
    return (id: string): string | null => {
        assert(id.length > 0, "an id asked of the client is one the panel named");
        let entry: unknown;
        // The game's own page state, read outbound (AGENTS.md E5).
        try {
            entry = (translate as (name: string) => unknown)(id);
        } catch {
            return null;
        }
        if (typeof entry !== "string") return null;
        assert(entry.length <= MAXIMUM_ENTRY, "an answer the game gave stays inside it too");
        return getLabelFromEntry(entry);
    };
}
