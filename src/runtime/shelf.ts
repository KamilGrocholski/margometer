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
} from "#/libs/unknown-value.ts";
import {
    type KeyValueStore,
    STORE_KEY,
    type StoreFailure,
    StoreUnavailable,
} from "#/src/ports/browser-store.ts";
import { CALLS_MAXIMUM } from "#/src/ports/fight-capture.ts";
import type { FightPlace } from "#/src/ports/fight-place.ts";

export interface KeptFight {
    /** Stated by the caller, which owns the clock. Zero is a moment like any other. */
    readonly openedAt: number;
    /** One payload per call the game made, thinned as a recording is thinned. */
    readonly payloads: readonly unknown[];
    readonly place: FightPlace | null;
    /**
     * The hero's id as the client stated it when the fight opened, which is how its own warrior is
     * keyed (ADR 0014). Null on a fight kept before the id was, and on a page that stated none.
     */
    readonly readerId: number | null;
    /** Which client it was read off, so a fight re-read later says what it was recorded on. */
    readonly margonemClientBuild: string | null;
    /** Kept by the reader against the rotation. */
    readonly isPinned: boolean;
}

export interface ShelfContents {
    readonly fights: readonly KeptFight[];
}

/** What a shelf opened to, and how many of the fights it held did not read back. */
export interface ShelfOpened extends ShelfContents {
    readonly fightsUnreadable: number;
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

/** Fights the store held that this version does not read back, dropped and counted. */
export class KeptFightsUnreadable extends Error {
    override readonly name = "KeptFightsUnreadable";
    readonly count: number;

    constructor(count: number) {
        super();
        this.count = count;
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
    | KeptFightsUnreadable
    | EverySlotPinned
    | RotationRefused
    | FightAlreadyKept
    | FightNotKept;

type ShelfField = "version" | "fights";
type FightField =
    | "openedAt"
    | "payloads"
    | "place"
    | "readerId"
    | "margonemClientBuild"
    | "isPinned";
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
    readerId: "readerId",
    margonemClientBuild: "gameBuild",
    isPinned: "isPinned",
};
const PLACE_FIELDS: FieldKeys<PlaceField> = { mapName: "mapName", x: "x", y: "y" };

/**
 * At start: durable state into memory. A fight that does not read back is dropped and counted, and
 * the rest of the shelf stands; a shelf that does not read back at all is a failure.
 */
export function openShelf(store: KeyValueStore): ShelfOpened | ShelfFailure {
    const stored = store.read(SHELF_KEY);
    if (stored instanceof Error) return stored;
    if (stored === null) return { fights: [], fightsUnreadable: 0 };
    const parsed = parseJson(stored);
    if (parsed instanceof Error) return new ShelfUnreadable({ cause: parsed });
    if (!isRecord(parsed)) return new ShelfUnreadable();
    const version = getNumberField(parsed, SHELF_FIELDS, "version");
    const stated = version instanceof Error ? null : version;
    if (stated !== SHELF_VERSION) return new ShelfVersionUnknown(stated);
    const listed = getListField(parsed, SHELF_FIELDS, "fights", KEPT_MAXIMUM);
    if (listed instanceof Error) return new ShelfUnreadable({ cause: listed });
    const fights: KeptFight[] = [];
    for (const storedFight of listed ?? []) {
        let fight: KeptFight | null;
        // Read the fight, or null where this version does not recognise it, whole fight and all.
        readFight: {
            // A payload nobody can read is a fight dropped, not a payload skipped: a gap mid-fight
            // decodes to figures that look right.
            if (!isRecord(storedFight)) {
                fight = null;
                break readFight;
            }
            const openedAt = getNumberField(storedFight, FIGHT_FIELDS, "openedAt");
            if (openedAt instanceof Error) {
                fight = null;
                break readFight;
            }
            if (openedAt === null) {
                fight = null;
                break readFight;
            }
            if (openedAt < 0) {
                fight = null;
                break readFight;
            }
            const payloads = getListField(storedFight, FIGHT_FIELDS, "payloads", CALLS_MAXIMUM);
            if (payloads instanceof Error) {
                fight = null;
                break readFight;
            }
            if (payloads === null) {
                fight = null;
                break readFight;
            }
            if (payloads.length === 0) {
                fight = null;
                break readFight;
            }
            if (!payloads.every(isRecord)) {
                fight = null;
                break readFight;
            }
            const margonemClientBuild = getStatedTextField(
                storedFight,
                FIGHT_FIELDS,
                "margonemClientBuild",
            );
            let place: FightPlace | null;
            // Read the place: one that does not read back is nobody's place, not a fight dropped.
            readPlace: {
                const stored = getRecordField(storedFight, FIGHT_FIELDS, "place");
                if (stored instanceof Error) {
                    place = null;
                    break readPlace;
                }
                if (stored === null) {
                    place = null;
                    break readPlace;
                }
                const mapName = getStatedTextField(stored, PLACE_FIELDS, "mapName");
                const x = getNumberField(stored, PLACE_FIELDS, "x");
                const y = getNumberField(stored, PLACE_FIELDS, "y");
                const statedPlace = {
                    mapName: mapName instanceof Error ? null : mapName,
                    x: x instanceof Error ? null : x,
                    y: y instanceof Error ? null : y,
                };
                if (statedPlace.mapName !== null) {
                    place = statedPlace;
                    break readPlace;
                }
                if (statedPlace.x !== null) {
                    place = statedPlace;
                    break readPlace;
                }
                if (statedPlace.y === null) {
                    place = null;
                    break readPlace;
                }
                place = statedPlace;
            }
            let readerId: number | null;
            // Read the reader's id: one that does not read back is nobody's, not a fight dropped.
            readReaderId: {
                const id = getNumberField(storedFight, FIGHT_FIELDS, "readerId");
                if (id instanceof Error) {
                    readerId = null;
                    break readReaderId;
                }
                if (id === null) {
                    readerId = null;
                    break readReaderId;
                }
                if (!Number.isSafeInteger(id)) {
                    readerId = null;
                    break readReaderId;
                }
                if (id <= 0) {
                    readerId = null;
                    break readReaderId;
                }
                readerId = id;
            }
            fight = {
                openedAt,
                payloads: [...payloads],
                place,
                readerId,
                margonemClientBuild: margonemClientBuild instanceof Error
                    ? null
                    : margonemClientBuild,
                isPinned: storedFight[FIGHT_FIELDS.isPinned] === true,
            };
        }
        if (fight !== null) fights.push(fight);
    }
    assert(fights.length <= KEPT_MAXIMUM, "a shelf read back stays inside its stated bound");
    const fightsUnreadable = (listed ?? []).length - fights.length;
    assert(fightsUnreadable >= 0, "a fight read back is one the store held");
    return { fights, fightsUnreadable };
}

/** A fight kept once. A second fight under the same moment is refused, never merged. */
export function writeKeptFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    fight: KeptFight,
): ShelfWritten | ShelfFailure {
    assert(fight.payloads.length > 0, "a fight kept was kept from something");
    assert(fight.payloads.length <= CALLS_MAXIMUM, "and stays inside a recording's bound");
    if (shelf.fights.some((keptFight) => keptFight.openedAt === fight.openedAt)) {
        return new FightAlreadyKept(fight.openedAt);
    }
    const fightsAfter = [...shelf.fights, fight];
    const pinned = fightsAfter.filter((keptFight) => keptFight.isPinned).length;
    if (pinned >= KEPT_MAXIMUM) {
        if (fightsAfter.length > KEPT_MAXIMUM) return new EverySlotPinned(KEPT_MAXIMUM);
    }
    return writeShelf(store, shelf, fightsAfter);
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
    let offered = rotateShelf(fights);
    let refused: StoreFailure | null = null;
    for (let attempts = 1; attempts <= KEPT_MAXIMUM + 1; attempts += 1) {
        const text = encodeJson(
            { version: SHELF_VERSION, fights: offered.map(encodeKeptFight) },
            0,
        );
        if (text instanceof Error) return new ShelfUnwritable({ cause: text });
        const written = store.write(SHELF_KEY, text);
        if (!(written instanceof Error)) {
            // Say what was offered and did not go down: the rotation, stated rather than silent.
            const keptOpenedAts = new Set(offered.map((keptFight) => keptFight.openedAt));
            const dropped = fights.filter((keptFight) => !keptOpenedAts.has(keptFight.openedAt))
                .map((keptFight) => keptFight.openedAt);
            assert(
                dropped.length + offered.length === fights.length,
                "every fight offered is kept or dropped",
            );
            assert(before.fights.length <= KEPT_MAXIMUM, "the shelf before was inside its bound");
            return { contents: { fights: offered }, droppedOpenedAt: dropped };
        }
        if (written instanceof StoreUnavailable) return written;
        refused = written;
        const shorter = dropOldestUnpinned(offered);
        if (shorter === null) return new RotationRefused(attempts, { cause: refused });
        offered = shorter;
    }
    assert(
        offered.length === 0,
        "a shelf offered once per fight it holds has nothing left to drop",
    );
    return new RotationRefused(KEPT_MAXIMUM + 1, { cause: refused });
}

/**
 * Each field under the key the shelf stores it by, in `develop`'s order, and the id only where there
 * is one, so a fight kept without it is written as `develop` wrote it and a shelf round-trips
 * through either (ADR 0014).
 */
function encodeKeptFight(fight: KeptFight): Record<string, unknown> {
    assert(fight.payloads.length > 0, "a fight written was kept from something");
    const encoded: Record<string, unknown> = {
        [FIGHT_FIELDS.openedAt]: fight.openedAt,
        [FIGHT_FIELDS.payloads]: fight.payloads,
        [FIGHT_FIELDS.place]: fight.place,
        [FIGHT_FIELDS.margonemClientBuild]: fight.margonemClientBuild,
        [FIGHT_FIELDS.isPinned]: fight.isPinned,
    };
    if (fight.readerId === null) return encoded;
    assert(fight.readerId > 0, "an id written is one the page stated");
    return { ...encoded, [FIGHT_FIELDS.readerId]: fight.readerId };
}

function dropOldestUnpinned(fights: readonly KeptFight[]): KeptFight[] | null {
    const fightIndex = fights.findIndex((keptFight) => !keptFight.isPinned);
    if (fightIndex === -1) return null;
    const remaining = [...fights];
    remaining.splice(fightIndex, 1);
    assert(remaining.length + 1 === fights.length, "dropping the oldest drops exactly one");
    return remaining;
}

export function writeKeptFightPin(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
    isPinned: boolean,
): ShelfWritten | ShelfFailure {
    if (!shelf.fights.some((keptFight) => keptFight.openedAt === openedAt)) {
        return new FightNotKept(openedAt);
    }
    const fightsAfter = shelf.fights.map((keptFight) =>
        keptFight.openedAt === openedAt ? { ...keptFight, isPinned } : keptFight
    );
    return writeShelf(store, shelf, fightsAfter);
}

export function deleteKeptFight(
    store: KeyValueStore,
    shelf: ShelfContents,
    openedAt: number,
): ShelfWritten | ShelfFailure {
    const fightsAfter = shelf.fights.filter((keptFight) => keptFight.openedAt !== openedAt);
    if (fightsAfter.length === shelf.fights.length) return new FightNotKept(openedAt);
    return writeShelf(store, shelf, fightsAfter);
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
    return store.delete(SHELF_KEY);
}

/** What a full shelf keeps: the newest, and everything the reader pinned. */
export function rotateShelf(fights: readonly KeptFight[]): KeptFight[] {
    let rotated = [...fights];
    for (let dropped = 0; dropped < fights.length; dropped += 1) {
        if (rotated.length <= KEPT_MAXIMUM) break;
        const shorter = dropOldestUnpinned(rotated);
        if (shorter === null) break;
        rotated = shorter;
    }
    assert(rotated.length <= fights.length, "a rotation never grows the shelf it was handed");
    return rotated.length <= KEPT_MAXIMUM ? rotated : rotated.slice(0, KEPT_MAXIMUM);
}
