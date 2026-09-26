/**
 * The fights a reader can go back to (`docs/design.md` §8). **The payloads, never a figure**: what
 * is stored is what the game delivered, thinned as a recording is, so every number a row states is
 * derived by the code that is running (`develop ADR 0026`).
 *
 * A write that the store refuses is answered by asking for less: the oldest fight nobody pinned
 * goes, and the same shelf is offered again. A pin outranks the rotation and the refusal both.
 */

import { assert } from "@std/assert/assert";
import { encodeJson, parseJson } from "#/libs/json-text.ts";
import {
    type FieldKeys,
    getListField,
    getNumberField,
    getRecordField,
    getStatedTextField,
    isRecord,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import {
    type KeyValueStore,
    STORE_KEY,
    type StoreFailure,
    StoreUnavailable,
} from "#/src/game/browser-store.ts";
import { CALLS_MAXIMUM } from "#/src/game/fight-capture.ts";
import type { FightPlace } from "#/src/game/fight-place.ts";

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

export class ShelfUnreadable extends Error {
    override readonly name = "ShelfUnreadable";

    constructor(options?: ErrorOptions) {
        super(undefined, options);
    }
}

export class ShelfUnwritable extends Error {
    override readonly name = "ShelfUnwritable";

    constructor(options?: ErrorOptions) {
        super(undefined, options);
    }
}

export class ShelfVersionUnknown extends Error {
    override readonly name = "ShelfVersionUnknown";
    readonly version: number | null;

    constructor(version: number | null, options?: ErrorOptions) {
        super(undefined, options);
        this.version = version;
    }
}

export class EverySlotPinned extends Error {
    override readonly name = "EverySlotPinned";
    readonly maximum: number;

    constructor(maximum: number, options?: ErrorOptions) {
        super(undefined, options);
        this.maximum = maximum;
    }
}

/** The store refused every shelf the rotation offered it; the last refusal is the cause. */
export class RotationRefused extends Error {
    override readonly name = "RotationRefused";
    readonly attempts: number;

    constructor(attempts: number, options?: ErrorOptions) {
        super(undefined, options);
        this.attempts = attempts;
    }
}

export class FightAlreadyKept extends Error {
    override readonly name = "FightAlreadyKept";
    readonly openedAt: number;

    constructor(openedAt: number, options?: ErrorOptions) {
        super(undefined, options);
        this.openedAt = openedAt;
    }
}

export class FightNotKept extends Error {
    override readonly name = "FightNotKept";
    readonly openedAt: number;

    constructor(openedAt: number, options?: ErrorOptions) {
        super(undefined, options);
        this.openedAt = openedAt;
    }
}

export type ShelfFailure =
    | StoreFailure
    | ShelfUnreadable
    | ShelfUnwritable
    | ShelfVersionUnknown
    | EverySlotPinned
    | RotationRefused
    | FightAlreadyKept
    | FightNotKept;

type ShelfField = "version" | "fights";
type FightField = "openedAt" | "payloads" | "place" | "gameBuild" | "isPinned";
type PlaceField = "mapName" | "x" | "y";

/** A shelf holds this many fights and no more, the oldest nobody pinned dropped first. */
export const KEPT_MAXIMUM = 20;
/**
 * Three, because a shelf of version 2 holds this repository's reading of a fight (messages and a
 * cast we extracted) where this one holds what the game sent. The two are not halves of one shape,
 * so a shelf of another version is dropped whole (`develop ADR 0026`).
 */
const SHELF_VERSION = 3;
const SHELF_KEY = STORE_KEY.fights;
const SHELF_FIELDS: FieldKeys<ShelfField> = { version: "version", fights: "fights" };
const FIGHT_FIELDS: FieldKeys<FightField> = {
    openedAt: "openedAt",
    payloads: "payloads",
    place: "place",
    gameBuild: "gameBuild",
    isPinned: "isPinned",
};
const PLACE_FIELDS: FieldKeys<PlaceField> = { mapName: "mapName", x: "x", y: "y" };

/**
 * At start: durable state into memory. A fight that does not read back is dropped, and the rest of
 * the shelf stands; a shelf that does not read back at all is a failure the reader is told about.
 */
export function openShelf(store: KeyValueStore): ShelfContents | ShelfFailure {
    const stored = store.read(SHELF_KEY);
    if (stored instanceof Error) return stored;
    if (stored === null) return { fights: [] };
    const parsed = parseJson(stored);
    if (parsed instanceof Error) return new ShelfUnreadable({ cause: parsed });
    if (!isRecord(parsed)) return new ShelfUnreadable();
    const version = getNumberField(parsed, SHELF_FIELDS, "version");
    const stated = version instanceof Error ? null : version;
    if (stated !== SHELF_VERSION) return new ShelfVersionUnknown(stated);
    const listed = getListField(parsed, SHELF_FIELDS, "fights", KEPT_MAXIMUM);
    if (listed instanceof Error) return new ShelfUnreadable({ cause: listed });
    const fights: KeptFight[] = [];
    for (const value of listed ?? []) {
        const fight = readKeptFight(value);
        if (fight !== null) fights.push(fight);
    }
    assert(fights.length <= KEPT_MAXIMUM, "a shelf read back stays inside its stated bound");
    return { fights };
}

/**
 * Null for anything this version does not recognise, whole fight and all. A payload nobody can read
 * is a fight dropped, not a payload skipped: a gap mid-fight decodes to figures that look right.
 */
function readKeptFight(value: unknown): KeptFight | null {
    if (!isRecord(value)) return null;
    const openedAt = getNumberField(value, FIGHT_FIELDS, "openedAt");
    if (openedAt instanceof Error) return null;
    if (openedAt === null) return null;
    if (openedAt < 0) return null;
    const payloads = getListField(value, FIGHT_FIELDS, "payloads", CALLS_MAXIMUM);
    if (payloads instanceof Error) return null;
    if (payloads === null) return null;
    if (payloads.length === 0) return null;
    if (!payloads.every(isRecord)) return null;
    const gameBuild = getStatedTextField(value, FIGHT_FIELDS, "gameBuild");
    return {
        openedAt,
        payloads: [...payloads],
        place: readKeptPlace(value),
        gameBuild: gameBuild instanceof Error ? null : gameBuild,
        isPinned: value[FIGHT_FIELDS.isPinned] === true,
    };
}

/** A place that does not read back is nobody's place, not a fight dropped. */
function readKeptPlace(fight: UnknownRecord): FightPlace | null {
    const place = getRecordField(fight, FIGHT_FIELDS, "place");
    if (place instanceof Error) return null;
    if (place === null) return null;
    const mapName = getStatedTextField(place, PLACE_FIELDS, "mapName");
    const x = getNumberField(place, PLACE_FIELDS, "x");
    const y = getNumberField(place, PLACE_FIELDS, "y");
    const read = {
        mapName: mapName instanceof Error ? null : mapName,
        x: x instanceof Error ? null : x,
        y: y instanceof Error ? null : y,
    };
    if (read.mapName !== null) return read;
    if (read.x !== null) return read;
    if (read.y === null) return null;
    return read;
}

/** A fight kept once. A second fight under the same moment is refused, never merged. */
export function keepFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    fight: KeptFight,
): ShelfWritten | ShelfFailure {
    assert(fight.payloads.length > 0, "a fight kept was kept from something");
    assert(fight.payloads.length <= CALLS_MAXIMUM, "and stays inside a recording's bound");
    if (shelf.fights.some((one) => one.openedAt === fight.openedAt)) {
        return new FightAlreadyKept(fight.openedAt);
    }
    const next = [...shelf.fights, fight];
    const pinned = next.filter((one) => one.isPinned).length;
    if (pinned >= KEPT_MAXIMUM) {
        if (next.length > KEPT_MAXIMUM) return new EverySlotPinned(KEPT_MAXIMUM);
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
): ShelfWritten | ShelfFailure {
    let held = rotateShelf(fights);
    let refused: StoreFailure | null = null;
    for (let attempts = 1; attempts <= KEPT_MAXIMUM + 1; attempts += 1) {
        const text = encodeJson({ version: SHELF_VERSION, fights: held }, 0);
        if (text instanceof Error) return new ShelfUnwritable({ cause: text });
        const written = store.write(SHELF_KEY, text);
        if (!(written instanceof Error)) return writeShelfDropped(before, fights, held);
        if (written instanceof StoreUnavailable) return written;
        refused = written;
        const shorter = dropOldestUnpinned(held);
        if (shorter === null) return new RotationRefused(attempts, { cause: refused });
        held = shorter;
    }
    assert(held.length === 0, "a shelf offered once per fight it holds has nothing left to drop");
    return new RotationRefused(KEPT_MAXIMUM + 1, { cause: refused });
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

function dropOldestUnpinned(fights: readonly KeptFight[]): KeptFight[] | null {
    const at = fights.findIndex((one) => !one.isPinned);
    if (at === -1) return null;
    const held = [...fights];
    held.splice(at, 1);
    assert(held.length + 1 === fights.length, "dropping the oldest drops exactly one");
    return held;
}

export function pinFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
    isPinned: boolean,
): ShelfWritten | ShelfFailure {
    if (!shelf.fights.some((one) => one.openedAt === openedAt)) return new FightNotKept(openedAt);
    const next = shelf.fights.map((one) => one.openedAt === openedAt ? { ...one, isPinned } : one);
    return writeShelf(store, shelf, next);
}

export function removeKeptFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
): ShelfWritten | ShelfFailure {
    const next = shelf.fights.filter((one) => one.openedAt !== openedAt);
    if (next.length === shelf.fights.length) return new FightNotKept(openedAt);
    return writeShelf(store, shelf, next);
}

/**
 * The whole shelf into another store, as a reader moving it asks: the fights go first, and the
 * store they came from is emptied by `deleteShelf` only once they stand in the new one.
 */
export function writeShelfContents(
    store: KeyValueStore,
    shelf: ShelfContents,
): ShelfWritten | ShelfFailure {
    assert(shelf.fights.length <= KEPT_MAXIMUM, "a shelf moved is inside its stated bound");
    return writeShelf(store, shelf, shelf.fights);
}

/** The key the shelf is under, gone: a reader who moved it wants nothing left behind. */
export function deleteShelf(store: KeyValueStore): undefined | StoreFailure {
    return store.remove(SHELF_KEY);
}

/** What a full shelf keeps: the newest, and everything the reader pinned. */
export function rotateShelf(fights: readonly KeptFight[]): KeptFight[] {
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
