/**
 * The fights a reader can go back to, and what of one is worth keeping.
 *
 * **The payloads, never a figure.** What is stored is what the game delivered, thinned by the rule
 * a recording is thinned by, so every number a row states is derived by the code that is running
 * and a decoder that learns a key reaches back over the whole shelf. **ADR 0026.**
 *
 * The store is handed in and never reached for, a shelf that will not fit asks for less rather
 * than assuming a quota, and everything read back is validated.
 */

import { assert } from "@std/assert";
import type { BrowserStore } from "@/src/game/browser-store.ts";
import type { FightPlace } from "@/src/game/engine-place.ts";
import { MAXIMUM_CALLS } from "@/src/game/fight-capture.ts";
import { composeJsonWriting, getJsonReading } from "@/libs/json-text.ts";
import {
    getNumberFromUnknown,
    getStatedTextFromUnknown,
    isRecord,
} from "@/libs/unknown-reading.ts";

/** A shelf holds this many fights and no more, the oldest nobody pinned dropped first. */
export const MAXIMUM_KEPT = 20;
/**
 * Three, because a shelf written by the version before this one holds this repository's reading of
 * a fight — the messages, and a cast we extracted — where this one holds what the game sent. The
 * two are not halves of one shape, so a shelf of another version is dropped whole. **ADR 0026.**
 */
const SHELF_VERSION = 3;

export interface KeptFight {
    /** Stated by the caller, which owns the clock. Zero is a moment like any other. */
    openedAt: number;
    /**
     * One payload per call the game made, thinned as `game/fight-capture.ts` thins a recording,
     * and read back the way a recording's calls are: the shelf and `captures/` hold one thing.
     */
    payloads: readonly unknown[];
    place: FightPlace | null;
    /** Which client it was read off, so a fight re-read later says what it was recorded on. */
    gameBuild: string | null;
    /** Kept by the reader against the rotation. */
    isPinned: boolean;
}

/** What a write left on the shelf, which is not always what it was handed. **ADR 0021**. */
export type ShelfWriting =
    | { isOk: true; fights: KeptFight[] }
    | { isOk: false; error: "unwritable" | "refused" };

/**
 * A payload nobody can read is a fight dropped, not a payload skipped: a gap in the middle of a
 * fight decodes to figures that look like a fight and are not one.
 */
function getKeptPayloadsFromValue(value: unknown): unknown[] | null {
    if (!Array.isArray(value)) return null;
    if (value.length === 0) return null;
    if (value.length > MAXIMUM_CALLS) return null;
    const payloads: unknown[] = [];
    for (const stated of value) {
        if (!isRecord(stated)) return null;
        payloads.push(stated);
    }
    assert(payloads.length === value.length, "a fight kept is a fight read back whole");
    assert(payloads.length <= MAXIMUM_CALLS, "and stays inside the bound a recording states");
    return payloads;
}

/**
 * A place that does not read back is nobody's place, not a fight dropped: the place is what a
 * fight was fought at, and a fight is worth keeping without it. The three fields fail apart, as
 * they do when they are read off the client.
 */
function getKeptPlaceFromValue(value: unknown): FightPlace | null {
    if (!isRecord(value)) return null;
    const place: FightPlace = {
        mapName: getStatedTextFromUnknown(value.mapName),
        x: getNumberFromUnknown(value.x),
        y: getNumberFromUnknown(value.y),
    };
    assert(place.mapName === null || place.mapName.length > 0, "a name kept says something");
    if (place.mapName !== null) return place;
    if (place.x !== null) return place;
    if (place.y === null) return null;
    return place;
}

/** Null for anything a reader of this version does not recognise, whole fight and all. */
function getKeptFightFromValue(value: unknown): KeptFight | null {
    if (!isRecord(value)) return null;
    const openedAt = getNumberFromUnknown(value.openedAt);
    if (openedAt === null) return null;
    const payloads = getKeptPayloadsFromValue(value.payloads);
    if (payloads === null) return null;
    assert(openedAt >= 0, "a moment kept is not before the epoch");
    assert(payloads.length > 0, "a fight kept was kept from something");
    return {
        openedAt,
        payloads,
        place: getKeptPlaceFromValue(value.place),
        gameBuild: getStatedTextFromUnknown(value.gameBuild),
        isPinned: value.isPinned === true,
    };
}

export function readKeptFights(store: BrowserStore, key: string): KeptFight[] {
    assert(key.length > 0, "a shelf is asked for by name");
    const stored = store.read(key);
    if (stored === null) return [];
    const reading = getJsonReading(stored);
    if (!reading.isOk) return [];
    const shelf = reading.value;
    if (!isRecord(shelf)) return [];
    assert(stored.length > 0, "a shelf that read back as a record was text to begin with");
    if (getNumberFromUnknown(shelf.version) !== SHELF_VERSION) return [];
    if (!Array.isArray(shelf.fights)) return [];
    const kept: KeptFight[] = [];
    assert(Array.isArray(shelf.fights), "a shelf that is read holds a list of fights");
    for (const stated of shelf.fights) {
        const fight = getKeptFightFromValue(stated);
        if (fight === null) continue;
        kept.push(fight);
    }
    assert(kept.length <= MAXIMUM_KEPT, "a shelf read back stays inside its stated bound");
    return kept;
}

/**
 * The shelf with its oldest unpinned fight gone, or nothing where every fight left is pinned.
 *
 * A pin is the one thing on the shelf that outranks the rotation, and it outranks the store's
 * refusal for the same reason: it is the reader's own answer.
 */
function composeShelfWithoutOldestUnpinned(fights: readonly KeptFight[]): KeptFight[] | null {
    for (let at = 0; at < fights.length; at += 1) {
        const fight = fights[at];
        if (fight === undefined) continue;
        if (fight.isPinned) continue;
        const held = [...fights];
        held.splice(at, 1);
        assert(held.length + 1 === fights.length, "dropping the oldest drops exactly one");
        return held;
    }
    return null;
}

/**
 * What a shelf keeps when it is full: the newest, and everything the reader pinned.
 *
 * Where every slot is pinned there is nothing to drop, and the newest fight is the one that does
 * not arrive — which the shelf says outright rather than dropping a fight the reader asked it to
 * hold.
 */
export function composeKeptRotation(fights: readonly KeptFight[]): KeptFight[] {
    if (fights.length <= MAXIMUM_KEPT) return [...fights];
    let held = [...fights];
    for (let dropped = 0; dropped < fights.length; dropped += 1) {
        if (held.length <= MAXIMUM_KEPT) break;
        const shorter = composeShelfWithoutOldestUnpinned(held);
        if (shorter === null) break;
        held = shorter;
    }
    assert(held.length >= MAXIMUM_KEPT, "a rotation drops no more than it had to");
    assert(held.length <= fights.length, "and never grows the shelf it was handed");
    return held.length <= MAXIMUM_KEPT ? held : held.slice(0, MAXIMUM_KEPT);
}

export function getIsEverySlotPinned(fights: readonly KeptFight[]): boolean {
    if (fights.length <= MAXIMUM_KEPT) return false;
    const unpinned = fights.filter((one) => !one.isPinned).length;
    assert(unpinned >= 0, "a shelf holds the fights nobody pinned, however few");
    return fights.length - unpinned >= MAXIMUM_KEPT;
}

/**
 * The shelf written, and what of it went down. A refusal is answered by asking for less rather
 * than by holding a constant chosen against a quota `SECURITY.md` forbids assuming: the oldest
 * fight nobody pinned goes, and the same shelf is offered again. **ADR 0026.**
 */
export function writeKeptFights(
    store: BrowserStore,
    key: string,
    fights: KeptFight[],
): ShelfWriting {
    assert(key.length > 0, "a shelf is written by name");
    let held = composeKeptRotation(fights);
    assert(held.length <= MAXIMUM_KEPT, "a shelf written stays inside its stated bound");
    assert(held.length <= fights.length, "keeping the newest never invents one");
    for (let offered = 0; offered <= MAXIMUM_KEPT; offered += 1) {
        const writing = composeJsonWriting({ version: SHELF_VERSION, fights: held });
        if (!writing.isOk) return { isOk: false, error: "unwritable" };
        assert(writing.text.length > 0, "a shelf written as text says something");
        if (store.write(key, writing.text)) return { isOk: true, fights: held };
        const shorter = composeShelfWithoutOldestUnpinned(held);
        if (shorter === null) return { isOk: false, error: "refused" };
        held = shorter;
    }
    assert(held.length === 0, "a shelf offered once per fight it holds has nothing left to drop");
    return { isOk: false, error: "refused" };
}
