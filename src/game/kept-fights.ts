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
import {
    composeJsonText,
    getNumberFromUnknown,
    getTextFromUnknown,
    getValueFromJsonText,
    isRecord,
} from "@/src/core/unknown-reading.ts";

/** A shelf holds this many fights and no more, oldest dropped first. */
const MAXIMUM_KEPT = 20;
const SHELF_VERSION = 1;

export interface KeptFight {
    /** Stated by the caller, which owns the clock. Zero is a moment like any other. */
    openedAt: number;
    combatants: Combatant[];
    /** One list per call the engine made, so a replay is the fight as it was delivered. */
    payloads: string[][];
}

export interface FightStore {
    read(key: string): string | null;
    /** False where the browser refused, which is an answer and not a failure. */
    write(key: string, value: string): boolean;
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
    return { openedAt, combatants, payloads };
}

/** Whatever of the shelf reads back. A fight that does not is dropped, and the rest still stand. */
export function readKeptFights(store: FightStore, key: string): KeptFight[] {
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

/** The newest kept, the oldest dropped, and false where the browser would not have it. */
export function writeKeptFights(store: FightStore, key: string, fights: KeptFight[]): boolean {
    assert(key.length > 0, "a shelf is written by name");
    const held = fights.slice(-MAXIMUM_KEPT);
    assert(held.length <= MAXIMUM_KEPT, "a shelf written stays inside its stated bound");
    assert(held.length <= fights.length, "keeping the newest never invents one");
    const text = composeJsonText({ version: SHELF_VERSION, fights: held });
    if (text === null) return false;
    assert(text.length > 0, "a shelf written as text says something");
    return store.write(key, text);
}
