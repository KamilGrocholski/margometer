/**
 * The fights a reader can go back to, and what of one is worth keeping.
 *
 * **Inputs, never figures.** What is stored is what the game said — the cast and the messages —
 * so a reading is always re-derived by the code that is running rather than restored from an
 * older version's arithmetic. The store is handed in and never reached for: the origin belongs to
 * the game, no quota is assumed, and a refusal to write is an answer rather than an error.
 *
 * Everything read back is validated: a shelf that cannot be understood is dropped, never trusted
 * into a figure.
 */

import { assert } from "@std/assert";
import type { Combatant } from "@/src/core/combatant-roster.ts";
import type { FightOutcome } from "@/src/core/fight-statistics.ts";
import type { BrowserStore } from "@/src/game/browser-store.ts";
import type { FightPlace } from "@/src/game/engine-place.ts";
import {
    composeJsonText,
    getNumberFromUnknown,
    getTextFromUnknown,
    getValueFromJsonText,
    isRecord,
} from "@/src/core/unknown-reading.ts";

/** A shelf holds this many fights and no more, oldest dropped first. */
const MAXIMUM_KEPT = 20;
/**
 * Two, because a shelf written by the version before this one carries no seat and no outcome, and
 * a row drawn from it would say nothing about how the fight went. A shelf of another version is
 * dropped whole rather than read in halves.
 */
const SHELF_VERSION = 2;

export interface KeptFight {
    /** Stated by the caller, which owns the clock. Zero is a moment like any other. */
    openedAt: number;
    combatants: Combatant[];
    /** One list per call the engine made, so a replay is the fight as it was delivered. */
    payloads: readonly (readonly string[])[];
    /** Where it was fought, as much of it as the client would say. */
    place: FightPlace | null;
    /**
     * Which side was the reader's, and how the game said the fight ended — **inputs, like the
     * messages beside them.** A row on the shelf says how a fight went, and working that out of
     * the payloads would mean decoding twenty fights to draw twenty rows.
     */
    readerSide: number | null;
    outcome: FightOutcome | null;
    /**
     * Kept by the reader against the rotation. A shelf written before pins existed carries none,
     * and reads back as a shelf with nothing pinned — which is what it was.
     */
    isPinned: boolean;
}

function getMessagesFromValue(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;
    assert(value.length >= 0, "a list of messages has a length, however short");
    const messages: string[] = [];
    for (const message of value) {
        const text = getTextFromUnknown(message);
        if (text === null) return null;
        messages.push(text);
    }
    assert(messages.length === value.length, "a payload kept is a payload read back whole");
    return messages;
}

function getPayloadsFromValue(value: unknown): string[][] | null {
    if (!Array.isArray(value)) return null;
    assert(value.length >= 0, "a list of payloads has a length, however short");
    const payloads: string[][] = [];
    for (const stated of value) {
        const messages = getMessagesFromValue(stated);
        if (messages === null) return null;
        payloads.push(messages);
    }
    assert(payloads.length === value.length, "a fight kept is a fight read back whole");
    return payloads;
}

/**
 * Our own names, not the client's. A shelf is written by this repository and read back by it, so
 * reading it with the reader for the game's fields would tie every stored fight to the client's
 * spelling — and a rename of theirs would quietly empty shelves that are perfectly readable.
 */
function getKeptCombatantFromValue(value: unknown): Combatant | null {
    if (!isRecord(value)) return null;
    const id = getNumberFromUnknown(value.id);
    if (id === null) return null;
    const name = getTextFromUnknown(value.name);
    if (name === null) return null;
    const side = getNumberFromUnknown(value.side);
    if (side === null) return null;
    assert(name.length > 0, "a name kept says something");
    return {
        id,
        name,
        side,
        profession: getTextFromUnknown(value.profession),
        level: getNumberFromUnknown(value.level),
        healthMaximum: getNumberFromUnknown(value.healthMaximum),
    };
}

function getCombatantsFromValue(value: unknown): Combatant[] | null {
    if (!Array.isArray(value)) return null;
    const combatants: Combatant[] = [];
    for (const stated of value) {
        const combatant = getKeptCombatantFromValue(stated);
        if (combatant === null) return null;
        combatants.push(combatant);
    }
    assert(combatants.length === value.length, "a cast kept is a cast read back whole");
    return combatants;
}

/**
 * A place that does not read back is nobody's place, not a fight dropped: the place is what a
 * fight was fought at, and a fight is worth keeping without it. The three fields fail apart, as
 * they do when they are read off the client.
 */
function getKeptPlaceFromValue(value: unknown): FightPlace | null {
    if (!isRecord(value)) return null;
    const place: FightPlace = {
        mapName: getTextFromUnknown(value.mapName),
        x: getNumberFromUnknown(value.x),
        y: getNumberFromUnknown(value.y),
    };
    assert(place.mapName === null || place.mapName.length > 0, "a name kept says something");
    if (place.mapName !== null) return place;
    if (place.x !== null) return place;
    if (place.y === null) return null;
    return place;
}

/** The names a side was stated under, or null for anything that is not a list of them. */
function getKeptNamesFromValue(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;
    assert(value.length >= 0, "a side kept is a list with a length");
    const names: string[] = [];
    for (const stated of value) {
        const name = getTextFromUnknown(stated);
        if (name === null) return null;
        names.push(name);
    }
    assert(names.length === value.length, "a side kept is a side read back whole");
    return names;
}

/**
 * How the fight ended, or nothing. A fight kept before it ended has none, and so has one whose
 * outcome does not read back — which is a row that says when and where and stops there.
 */
function getKeptOutcomeFromValue(value: unknown): FightOutcome | null {
    if (!isRecord(value)) return null;
    const wonNames = getKeptNamesFromValue(value.wonNames);
    const lostNames = getKeptNamesFromValue(value.lostNames);
    if (wonNames === null || lostNames === null) return null;
    assert(wonNames.length >= 0, "a side that was kept is a list, however short");
    assert(lostNames.length >= 0, "and so is the other");
    return { wonNames, lostNames, isDrawn: value.isDrawn === true };
}

/** Null for anything a reader of this version does not recognise, whole fight and all. */
function getKeptFightFromValue(value: unknown): KeptFight | null {
    if (!isRecord(value)) return null;
    const openedAt = getNumberFromUnknown(value.openedAt);
    if (openedAt === null) return null;
    const combatants = getCombatantsFromValue(value.combatants);
    if (combatants === null) return null;
    const payloads = getPayloadsFromValue(value.payloads);
    if (payloads === null) return null;
    assert(combatants.length >= 0, "a cast kept is a list, however short");
    assert(openedAt >= 0, "a moment kept is not before the epoch");
    return {
        openedAt,
        combatants,
        payloads,
        place: getKeptPlaceFromValue(value.place),
        readerSide: getNumberFromUnknown(value.readerSide),
        outcome: getKeptOutcomeFromValue(value.outcome),
        isPinned: value.isPinned === true,
    };
}

/** Whatever of the shelf reads back. A fight that does not is dropped, and the rest still stand. */
export function readKeptFights(store: BrowserStore, key: string): KeptFight[] {
    assert(key.length > 0, "a shelf is asked for by name");
    const stored = store.read(key);
    if (stored === null) return [];
    const shelf = getValueFromJsonText(stored);
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
 * What a shelf keeps when it is full: the newest, and everything the reader pinned.
 *
 * A pin is the one thing on the shelf that outranks the rotation, so the oldest **unpinned**
 * fight is what goes. Where every slot is pinned there is nothing to drop, and the newest fight
 * is the one that does not arrive — which the shelf says outright rather than dropping a fight
 * the reader asked it to hold.
 */
export function composeKeptRotation(fights: readonly KeptFight[]): KeptFight[] {
    assert(fights.length >= 0, "a shelf holds the fights it holds");
    if (fights.length <= MAXIMUM_KEPT) return [...fights];
    const held = [...fights];
    let over = held.length - MAXIMUM_KEPT;
    for (let at = 0; at < held.length && over > 0; at += 1) {
        const fight = held[at];
        if (fight === undefined) continue;
        if (fight.isPinned) continue;
        held.splice(at, 1);
        at -= 1;
        over -= 1;
    }
    // Every slot pinned: the newest is what does not arrive, because nothing else may go.
    assert(held.length >= MAXIMUM_KEPT, "a rotation drops no more than it had to");
    return held.length <= MAXIMUM_KEPT ? held : held.slice(0, MAXIMUM_KEPT);
}

/** Whether the shelf had to refuse the newest fight, which is what a reader is told about. */
export function getIsEverySlotPinned(fights: readonly KeptFight[]): boolean {
    if (fights.length <= MAXIMUM_KEPT) return false;
    const unpinned = fights.filter((one) => !one.isPinned).length;
    assert(unpinned >= 0, "a shelf holds the fights nobody pinned, however few");
    return fights.length - unpinned >= MAXIMUM_KEPT;
}

/** The newest kept, the oldest unpinned dropped, and false where the browser would not have it. */
export function writeKeptFights(store: BrowserStore, key: string, fights: KeptFight[]): boolean {
    assert(key.length > 0, "a shelf is written by name");
    const held = composeKeptRotation(fights);
    assert(held.length <= MAXIMUM_KEPT, "a shelf written stays inside its stated bound");
    assert(held.length <= fights.length, "keeping the newest never invents one");
    const text = composeJsonText({ version: SHELF_VERSION, fights: held });
    if (text === null) return false;
    assert(text.length > 0, "a shelf written as text says something");
    return store.write(key, text);
}
