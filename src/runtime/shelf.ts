/**
 * The fights a reader can go back to (`docs/design.md` §8). **The payloads, never a figure**: what
 * is stored is what the game delivered, thinned as a recording is, so every number a row states is
 * derived by the code that is running (`develop ADR 0026`).
 *
 * A write that the store refuses is answered by asking for less: the oldest fight nobody pinned
 * goes, and the same shelf is offered again. A pin outranks the rotation and the refusal both.
 */

import { assert } from "@std/assert/assert";
import { encodeJson, parseJson } from "@/libs/json-text.ts";
import { err, ok, type Result } from "@/libs/result.ts";
import {
    type FieldKeys,
    getListField,
    getNumberField,
    getRecordField,
    getStatedTextField,
    isRecord,
    type UnknownRecord,
} from "@/libs/unknown-value.ts";
import {
    type KeyValueStore,
    STORE_FAILURE,
    STORE_KEY,
    type StoreFailure,
} from "@/src/game/browser-store.ts";
import { CALLS_MAXIMUM } from "@/src/game/fight-capture.ts";
import type { FightPlace } from "@/src/game/fight-place.ts";

/** A shelf holds this many fights and no more, the oldest nobody pinned dropped first. */
export const KEPT_MAXIMUM = 20;
/**
 * Three, because a shelf of version 2 holds this repository's reading of a fight (messages and a
 * cast we extracted) where this one holds what the game sent. The two are not halves of one shape,
 * so a shelf of another version is dropped whole (`develop ADR 0026`).
 */
const SHELF_VERSION = 3;
const SHELF_KEY = STORE_KEY.fights;

export interface KeptFight {
    /** Stated by the caller, which owns the clock. Zero is a moment like any other. */
    openedAt: number;
    /** One payload per call the game made, thinned as a recording is thinned. */
    payloads: readonly unknown[];
    place: FightPlace | null;
    /** Which client it was read off, so a fight re-read later says what it was recorded on. */
    gameBuild: string | null;
    /** Kept by the reader against the rotation. */
    isPinned: boolean;
}

export interface ShelfContents {
    readonly fights: readonly KeptFight[];
}

/** The rotation is stated, never silent: what a write left on the shelf, and what it dropped. */
export interface ShelfWritten {
    contents: ShelfContents;
    droppedOpenedAt: readonly number[];
}

export const SHELF_FAILURE = {
    unreadable: "shelf-unreadable",
    unwritable: "shelf-unwritable",
    versionUnknown: "shelf-version-unknown",
    everySlotPinned: "every-slot-pinned",
    refusedAfterRotation: "store-refused-after-rotation",
    fightAlreadyKept: "fight-already-kept",
    fightNotKept: "fight-not-kept",
} as const;

export type ShelfFailure =
    | StoreFailure
    | { kind: typeof SHELF_FAILURE.unreadable }
    | { kind: typeof SHELF_FAILURE.unwritable }
    | { kind: typeof SHELF_FAILURE.versionUnknown; version: number | null }
    | { kind: typeof SHELF_FAILURE.everySlotPinned; maximum: number }
    | { kind: typeof SHELF_FAILURE.refusedAfterRotation; attempts: number }
    | { kind: typeof SHELF_FAILURE.fightAlreadyKept; openedAt: number }
    | { kind: typeof SHELF_FAILURE.fightNotKept; openedAt: number };

type ShelfField = "version" | "fights";
const SHELF_FIELDS: FieldKeys<ShelfField> = { version: "version", fights: "fights" };
type FightField = "openedAt" | "payloads" | "place" | "gameBuild" | "isPinned";
const FIGHT_FIELDS: FieldKeys<FightField> = {
    openedAt: "openedAt",
    payloads: "payloads",
    place: "place",
    gameBuild: "gameBuild",
    isPinned: "isPinned",
};
type PlaceField = "mapName" | "x" | "y";
const PLACE_FIELDS: FieldKeys<PlaceField> = { mapName: "mapName", x: "x", y: "y" };

/**
 * At start: durable state into memory. A fight that does not read back is dropped, and the rest of
 * the shelf stands; a shelf that does not read back at all is a failure the reader is told about.
 */
export function openShelf(store: KeyValueStore): Result<ShelfContents, ShelfFailure> {
    const stored = store.read(SHELF_KEY);
    if (!stored.ok) return stored;
    if (stored.value === null) return ok({ fights: [] });
    const parsed = parseJson(stored.value);
    if (!parsed.ok) return err({ kind: SHELF_FAILURE.unreadable });
    if (!isRecord(parsed.value)) return err({ kind: SHELF_FAILURE.unreadable });
    const version = getNumberField(parsed.value, SHELF_FIELDS, "version");
    const stated = version.ok ? version.value : null;
    if (stated !== SHELF_VERSION) {
        return err({ kind: SHELF_FAILURE.versionUnknown, version: stated });
    }
    const listed = getListField(parsed.value, SHELF_FIELDS, "fights", KEPT_MAXIMUM);
    if (!listed.ok) return err({ kind: SHELF_FAILURE.unreadable });
    const fights: KeptFight[] = [];
    for (const value of listed.value ?? []) {
        const fight = readKeptFight(value);
        if (fight !== null) fights.push(fight);
    }
    assert(fights.length <= KEPT_MAXIMUM, "a shelf read back stays inside its stated bound");
    return ok({ fights });
}

/** A fight kept once. A second fight under the same moment is refused, never merged. */
export function keepFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    fight: KeptFight,
): Result<ShelfWritten, ShelfFailure> {
    assert(fight.payloads.length > 0, "a fight kept was kept from something");
    assert(fight.payloads.length <= CALLS_MAXIMUM, "and stays inside a recording's bound");
    if (shelf.fights.some((one) => one.openedAt === fight.openedAt)) {
        return err({ kind: SHELF_FAILURE.fightAlreadyKept, openedAt: fight.openedAt });
    }
    const next = [...shelf.fights, fight];
    const pinned = next.filter((one) => one.isPinned).length;
    if (pinned >= KEPT_MAXIMUM) {
        if (next.length > KEPT_MAXIMUM) {
            return err({ kind: SHELF_FAILURE.everySlotPinned, maximum: KEPT_MAXIMUM });
        }
    }
    return writeShelf(store, shelf, next);
}

export function pinFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
    isPinned: boolean,
): Result<ShelfWritten, ShelfFailure> {
    if (!shelf.fights.some((one) => one.openedAt === openedAt)) {
        return err({ kind: SHELF_FAILURE.fightNotKept, openedAt });
    }
    const next = shelf.fights.map((one) => one.openedAt === openedAt ? { ...one, isPinned } : one);
    return writeShelf(store, shelf, next);
}

export function removeKeptFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
): Result<ShelfWritten, ShelfFailure> {
    const next = shelf.fights.filter((one) => one.openedAt !== openedAt);
    if (next.length === shelf.fights.length) {
        return err({ kind: SHELF_FAILURE.fightNotKept, openedAt });
    }
    return writeShelf(store, shelf, next);
}

/**
 * The shelf written, and what of it went down. The rotation keeps the newest and everything the
 * reader pinned; a refusal drops the oldest unpinned fight and offers the rest again, once per
 * fight it holds at most.
 */
function writeShelf(
    store: KeyValueStore,
    before: ShelfContents,
    fights: readonly KeptFight[],
): Result<ShelfWritten, ShelfFailure> {
    let held = rotateShelf(fights);
    for (let attempts = 1; attempts <= KEPT_MAXIMUM + 1; attempts += 1) {
        const text = encodeJson({ version: SHELF_VERSION, fights: held }, 0);
        if (!text.ok) return err({ kind: SHELF_FAILURE.unwritable });
        const written = store.write(SHELF_KEY, text.value);
        if (written.ok) return ok(writeShelfDropped(before, fights, held));
        if (written.error.kind === STORE_FAILURE.unavailable) return written;
        const shorter = dropOldestUnpinned(held);
        if (shorter === null) return err({ kind: SHELF_FAILURE.refusedAfterRotation, attempts });
        held = shorter;
    }
    assert(held.length === 0, "a shelf offered once per fight it holds has nothing left to drop");
    return err({ kind: SHELF_FAILURE.refusedAfterRotation, attempts: KEPT_MAXIMUM + 1 });
}

/** What was offered and did not go down: the rotation, stated rather than silent. */
function writeShelfDropped(
    before: ShelfContents,
    offered: readonly KeptFight[],
    held: readonly KeptFight[],
): ShelfWritten {
    const kept = new Set(held.map((one) => one.openedAt));
    const dropped = offered.filter((one) => !kept.has(one.openedAt)).map((one) => one.openedAt);
    assert(
        dropped.length + held.length === offered.length,
        "every fight offered is kept or dropped",
    );
    assert(before.fights.length <= KEPT_MAXIMUM, "the shelf before was inside its bound");
    return { contents: { fights: held }, droppedOpenedAt: dropped };
}

/** What a full shelf keeps: the newest, and everything the reader pinned. */
function rotateShelf(fights: readonly KeptFight[]): KeptFight[] {
    let held = [...fights];
    for (let dropped = 0; dropped < fights.length; dropped += 1) {
        if (held.length <= KEPT_MAXIMUM) break;
        const shorter = dropOldestUnpinned(held);
        if (shorter === null) break;
        held = shorter;
    }
    assert(held.length <= fights.length, "a rotation never grows the shelf it was handed");
    return held.length <= KEPT_MAXIMUM ? held : held.slice(0, KEPT_MAXIMUM);
}

function dropOldestUnpinned(fights: readonly KeptFight[]): KeptFight[] | null {
    const at = fights.findIndex((one) => !one.isPinned);
    if (at === -1) return null;
    const held = [...fights];
    held.splice(at, 1);
    assert(held.length + 1 === fights.length, "dropping the oldest drops exactly one");
    return held;
}

/**
 * Null for anything this version does not recognise, whole fight and all. A payload nobody can read
 * is a fight dropped, not a payload skipped: a gap mid-fight decodes to figures that look right.
 */
function readKeptFight(value: unknown): KeptFight | null {
    if (!isRecord(value)) return null;
    const openedAt = getNumberField(value, FIGHT_FIELDS, "openedAt");
    if (!openedAt.ok) return null;
    if (openedAt.value === null) return null;
    if (openedAt.value < 0) return null;
    const payloads = getListField(value, FIGHT_FIELDS, "payloads", CALLS_MAXIMUM);
    if (!payloads.ok) return null;
    if (payloads.value === null) return null;
    if (payloads.value.length === 0) return null;
    if (!payloads.value.every(isRecord)) return null;
    const gameBuild = getStatedTextField(value, FIGHT_FIELDS, "gameBuild");
    return {
        openedAt: openedAt.value,
        payloads: [...payloads.value],
        place: readKeptPlace(value),
        gameBuild: gameBuild.ok ? gameBuild.value : null,
        isPinned: value[FIGHT_FIELDS.isPinned] === true,
    };
}

/** A place that does not read back is nobody's place, not a fight dropped. */
function readKeptPlace(fight: UnknownRecord): FightPlace | null {
    const place = getRecordField(fight, FIGHT_FIELDS, "place");
    if (!place.ok) return null;
    if (place.value === null) return null;
    const mapName = getStatedTextField(place.value, PLACE_FIELDS, "mapName");
    const x = getNumberField(place.value, PLACE_FIELDS, "x");
    const y = getNumberField(place.value, PLACE_FIELDS, "y");
    const read = {
        mapName: mapName.ok ? mapName.value : null,
        x: x.ok ? x.value : null,
        y: y.ok ? y.value : null,
    };
    if (read.mapName !== null) return read;
    if (read.x !== null) return read;
    if (read.y === null) return null;
    return read;
}
