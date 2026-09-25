/**
 * Where a fight is happening, asked of the client's own state, because the protocol says none of
 * it: its only candidate, `battleground`, is the picture behind the fight and two worlds share one.
 * Properties, never `getCords()`: calling into somebody else's program is a larger intrusion than
 * reading it.
 */

import { parseInteger } from "#/libs/number-text.ts";
import { callForeign, err, ok, type Result } from "#/libs/result.ts";
import {
    type FieldKeys,
    getNumberField,
    getRecordField,
    getStatedTextField,
    getTextField,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import { readPageEngines } from "./engine-battle.ts";
import type { FightPlace } from "./fight-place.ts";
import { PAGE_READ_FAILURE, PAGE_READING, type PageReadFailure } from "./page-reading.ts";

export interface PlacePort {
    readPlace(): Result<FightPlace, PageReadFailure>;
}

/**
 * Carried from v1's reading of production build `53XkBRxF` and development build
 * `1781609507010`: the map is `Engine.map.d.name` and the position `Engine.hero.d.x` and `.y`.
 */
type EngineField = "map" | "hero";
type HeldField = "data";
type PlaceField = "mapName" | "x" | "y";

const ENGINE_FIELDS: FieldKeys<EngineField> = { map: "map", hero: "hero" };
const HELD_FIELDS: FieldKeys<HeldField> = { data: "d" };
const PLACE_FIELDS: FieldKeys<PlaceField> = { mapName: "name", x: "x", y: "y" };

/** The first spelling of the game that says anything wins: two spellings are one game. */
export function initPagePlace(page: unknown): PlacePort {
    return {
        readPlace() {
            const read = callForeign(() => readPageEngines(page).map(readEnginePlace));
            if (!read.ok) return read;
            for (const place of read.value) {
                if (place !== null) return ok(place);
            }
            return err({ kind: PAGE_READ_FAILURE.absent, reading: PAGE_READING.place });
        },
    };
}

/** The three fields fail apart rather than together: a map mid-load has none of them. */
function readEnginePlace(engine: UnknownRecord): FightPlace | null {
    const map = readEngineData(engine, "map");
    const hero = readEngineData(engine, "hero");
    let mapName: string | null = null;
    if (map !== null) {
        const name = getStatedTextField(map, PLACE_FIELDS, "mapName");
        if (name.ok) mapName = name.value;
    }
    const x = hero === null ? null : readCoordinate(hero, "x");
    const y = hero === null ? null : readCoordinate(hero, "y");
    if (mapName !== null) return { mapName, x, y };
    if (x !== null) return { mapName, x, y };
    if (y === null) return null;
    return { mapName, x, y };
}

function readEngineData(engine: UnknownRecord, field: EngineField): UnknownRecord | null {
    const held = getRecordField(engine, ENGINE_FIELDS, field);
    if (!held.ok) return null;
    if (held.value === null) return null;
    const data = getRecordField(held.value, HELD_FIELDS, "data");
    if (!data.ok) return null;
    return data.value;
}

/** Either spelling, because the client itself does arithmetic on one and compares the other. */
function readCoordinate(hero: UnknownRecord, field: "x" | "y"): number | null {
    const text = getTextField(hero, PLACE_FIELDS, field);
    if (text.ok) {
        if (text.value !== null) return parseInteger(text.value);
    }
    const stated = getNumberField(hero, PLACE_FIELDS, field);
    if (!stated.ok) return null;
    return stated.value;
}
