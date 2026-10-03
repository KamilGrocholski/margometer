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
    getTextField,
    type UnknownRecord,
} from "#/libs/unknown-value.ts";
import { readMargonemEngineRecord, readMargonemEngines } from "./margonem-engine-battle.ts";
import { MARGONEM_VALUE, type MargonemReadFailure, MargonemValueAbsent } from "./margonem-value.ts";

export interface MargonemEngineHeroPort {
    readHeroId(): number | MargonemReadFailure;
}

/** Production build `Bb28FQty`, fetched 2026-09-27: `this.getId=()=>this.d.id` on the hero. */
type HeroField = "id";

const HERO_FIELDS: FieldKeys<HeroField> = { id: "id" };

/** The first spelling of the game that states an id wins: two spellings are one game. */
export function initMargonemEngineHero(browserWindow: unknown): MargonemEngineHeroPort {
    return {
        readHeroId() {
            const heroIds = errors.attempt(() =>
                readMargonemEngines(browserWindow).map(readMargonemEngineHeroId)
            );
            if (heroIds instanceof Error) return heroIds;
            for (const id of heroIds) {
                if (id !== null) return id;
            }
            return new MargonemValueAbsent(MARGONEM_VALUE.hero);
        },
    };
}

/** Null where the engine holds no hero, or an id that is not a whole number above nought. */
function readMargonemEngineHeroId(engine: UnknownRecord): number | null {
    const heroData = readMargonemEngineRecord(engine, "hero");
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
