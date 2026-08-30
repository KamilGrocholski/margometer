/**
 * Where a fight is happening, asked of the client's own state, because the protocol says none of
 * it — its only candidate, `battleground`, is the picture behind the fight and two worlds share
 * one. Properties, never `getCords()`: calling into somebody else's program is a larger intrusion
 * than reading it, and it can throw for reasons that are none of ours.
 */

import { assert } from "@std/assert";
import { getIntegerFromText } from "@/libs/number-text.ts";
import { ENGINE_SPELLINGS, getEnginesFromPage } from "@/src/game/engine-attachment.ts";
import { getNumberFromUnknown, getTextFromUnknown, isRecord } from "@/libs/unknown-reading.ts";

/**
 * Carried from v1's reading of production build `53XkBRxF` and development build
 * `1781609507010`: the map is `Engine.map.d.name` and the position `Engine.hero.d.x` and `.y`.
 */
const ENGINE_MAP_FIELD = "map";
const ENGINE_HERO_FIELD = "hero";
const ENGINE_DATA_FIELD = "d";
const MAP_NAME_FIELD = "name";
const HERO_X_FIELD = "x";
const HERO_Y_FIELD = "y";

/** Three fields that fail apart rather than together: a map mid-load has none of them. */
export interface FightPlace {
    mapName: string | null;
    x: number | null;
    y: number | null;
}

function getDataFromEngineField(engine: unknown, field: string): Record<string, unknown> | null {
    assert(field.length > 0, "a field of the client's is named");
    if (!isRecord(engine)) return null;
    const held = engine[field];
    if (!isRecord(held)) return null;
    const data = held[ENGINE_DATA_FIELD];
    if (!isRecord(data)) return null;
    assert(isRecord(data), "the bag the client keeps its state in is keyed");
    return data;
}

/** Either spelling, because the client itself does arithmetic on one and compares the other. */
function getCoordinateFromValue(value: unknown): number | null {
    const text = getTextFromUnknown(value);
    if (text !== null) {
        const written = getIntegerFromText(text);
        assert(written === null || Number.isSafeInteger(written), "a tile is a whole number");
        return written;
    }
    const stated = getNumberFromUnknown(value);
    assert(stated === null || Number.isFinite(stated), "a tile that was read is a number");
    return stated;
}

/** Null where the page said nothing, so *no game here* is not *a game that would not say*. */
export function getPlaceFromEngine(engine: unknown): FightPlace | null {
    try {
        const map = getDataFromEngineField(engine, ENGINE_MAP_FIELD);
        const hero = getDataFromEngineField(engine, ENGINE_HERO_FIELD);
        const place: FightPlace = {
            mapName: map === null ? null : getTextFromUnknown(map[MAP_NAME_FIELD]),
            x: hero === null ? null : getCoordinateFromValue(hero[HERO_X_FIELD]),
            y: hero === null ? null : getCoordinateFromValue(hero[HERO_Y_FIELD]),
        };
        assert(place.mapName === null || place.mapName.length > 0, "a name read says something");
        assert(place.x === null || Number.isFinite(place.x), "a tile read is a number");
        if (place.mapName !== null) return place;
        if (place.x !== null) return place;
        if (place.y === null) return null;
        return place;
    } catch {
        // Reaching into another program's object graph can throw where a page is being torn
        // down, and this runs inside the engine's own call stack. The mark is the reading
        // itself: nothing known about the place, which the panel shows as unknown (E5).
        return null;
    }
}

/**
 * The place off whichever spelling of the game the page holds. The first that says anything wins:
 * a page carrying both spellings carries one game behind them, so two answers cannot disagree.
 */
export function getPlaceFromPage(page: unknown): FightPlace | null {
    const engines = getEnginesFromPage(page);
    assert(engines.length <= ENGINE_SPELLINGS, "a page holds a game in two spellings and no more");
    for (const engine of engines) {
        const place = getPlaceFromEngine(engine);
        if (place !== null) return place;
    }
    return null;
}
