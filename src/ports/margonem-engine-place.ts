/**
 * Where a fight is happening, asked of the client's own state, because the protocol says none of
 * it: its only candidate, `battleground`, is the picture behind the fight and two worlds share one.
 * Properties, never `getCords()`: calling into somebody else's program is a larger intrusion than
 * reading it.
 */

import { parseInteger } from "#/libs/number-text.ts";
import * as errors from "#/libs/errors.ts";
import {
    type FieldKeys,
    getNumberField,
    getStatedTextField,
    getTextField,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import { readMargonemEngineRecord, readMargonemEngines } from "./margonem-engine-battle.ts";
import type { FightPlace } from "./fight-place.ts";
import { MARGONEM_VALUE, type MargonemReadFailure, MargonemValueAbsent } from "./margonem-value.ts";

export interface MargonemEnginePlacePort {
    readPlace(): FightPlace | MargonemReadFailure;
}

/**
 * Carried from v1's reading of production build `53XkBRxF` and development build
 * `1781609507010`: the map is `Engine.map.d.name` and the position `Engine.hero.d.x` and `.y`.
 */
type PlaceField = "mapName" | "x" | "y";

const PLACE_FIELDS: FieldKeys<PlaceField> = { mapName: "name", x: "x", y: "y" };

/** The first spelling of the game that says anything wins: two spellings are one game. */
export function initMargonemEnginePlace(browserWindow: unknown): MargonemEnginePlacePort {
    return {
        readPlace() {
            const places = errors.attempt(() =>
                readMargonemEngines(browserWindow).map(readMargonemEnginePlace)
            );
            if (places instanceof Error) return places;
            for (const place of places) {
                if (place !== null) return place;
            }
            return new MargonemValueAbsent(MARGONEM_VALUE.place);
        },
    };
}

/** The three fields fail apart rather than together: a map mid-load has none of them. */
function readMargonemEnginePlace(engine: UnknownRecord): FightPlace | null {
    const map = readMargonemEngineRecord(engine, "map");
    const hero = readMargonemEngineRecord(engine, "hero");
    let mapName: string | null;
    if (map === null) {
        mapName = null;
    } else {
        const name = getStatedTextField(map, PLACE_FIELDS, "mapName");
        if (name instanceof Error) mapName = null;
        else mapName = name;
    }
    const x = hero === null ? null : readHeroCoordinate(hero, "x");
    const y = hero === null ? null : readHeroCoordinate(hero, "y");
    if (mapName !== null) return { mapName, x, y };
    if (x !== null) return { mapName, x, y };
    if (y === null) return null;
    return { mapName, x, y };
}

/** Either spelling, because the client itself does arithmetic on one and compares the other. */
function readHeroCoordinate(hero: UnknownRecord, field: "x" | "y"): number | null {
    const text = getTextField(hero, PLACE_FIELDS, field);
    if (!(text instanceof Error)) {
        if (text !== null) return parseInteger(text);
    }
    const stated = getNumberField(hero, PLACE_FIELDS, field);
    if (stated instanceof Error) return null;
    return stated;
}
