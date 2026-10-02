/**
 * Which combatant is the reader, asked of the client's own state as its id: the client keys its own
 * warrior in a fight by the hero's id (ADR 0014), and the protocol names only the reader's side.
 * A property, never `getId()`: calling into somebody else's program is a larger intrusion than
 * reading it.
 */

import { parseInteger } from "#/libs/number-text.ts";
import * as errors from "#/libs/errors.ts";
import {
    type FieldKeys,
    getNumberField,
    getRecordField,
    getTextField,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import { readGameEngines } from "./game-battle.ts";
import { GAME_VALUE, type GameReadFailure, GameValueAbsent } from "./game-value.ts";

export interface GameHeroPort {
    readHeroId(): number | GameReadFailure;
}

/** Production build `Bb28FQty`, fetched 2026-09-27: `this.getId=()=>this.d.id` on the hero. */
type GameEngineField = "hero";
type HeldField = "data";
type HeroField = "id";

const ENGINE_FIELDS: FieldKeys<GameEngineField> = { hero: "hero" };
const HELD_FIELDS: FieldKeys<HeldField> = { data: "d" };
const HERO_FIELDS: FieldKeys<HeroField> = { id: "id" };

/** The first spelling of the game that states an id wins: two spellings are one game. */
export function initGameHero(browserWindow: unknown): GameHeroPort {
    return {
        readHeroId() {
            const heroIds = errors.attempt(() =>
                readGameEngines(browserWindow).map(readGameHeroId)
            );
            if (heroIds instanceof Error) return heroIds;
            for (const id of heroIds) {
                if (id !== null) return id;
            }
            return new GameValueAbsent(GAME_VALUE.hero);
        },
    };
}

/** Null where the engine holds no hero, or an id that is not a whole number above nought. */
function readGameHeroId(engine: UnknownRecord): number | null {
    const heroObject = getRecordField(engine, ENGINE_FIELDS, "hero");
    if (heroObject instanceof Error) return null;
    if (heroObject === null) return null;
    const heroData = getRecordField(heroObject, HELD_FIELDS, "data");
    if (heroData instanceof Error) return null;
    if (heroData === null) return null;
    let id: number | null;
    // Read the id in either spelling, as a tile is read.
    readId: {
        // A client that states a number as text states the number.
        const text = getTextField(heroData, HERO_FIELDS, "id");
        if (!(text instanceof Error)) {
            if (text !== null) {
                id = parseInteger(text);
                break readId;
            }
        }
        const stated = getNumberField(heroData, HERO_FIELDS, "id");
        if (stated instanceof Error) {
            id = null;
            break readId;
        }
        id = stated;
    }
    if (id === null) return null;
    if (!Number.isSafeInteger(id)) return null;
    if (id <= 0) return null;
    return id;
}
