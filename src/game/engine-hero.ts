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
import { readPageEngines } from "./engine-battle.ts";
import { PAGE_READING, type PageReadFailure, PageReadingAbsent } from "./page-reading.ts";

export interface HeroPort {
    readHeroId(): number | PageReadFailure;
}

/** Production build `Bb28FQty`, fetched 2026-09-27: `this.getId=()=>this.d.id` on the hero. */
type EngineField = "hero";
type HeldField = "data";
type HeroField = "id";

const ENGINE_FIELDS: FieldKeys<EngineField> = { hero: "hero" };
const HELD_FIELDS: FieldKeys<HeldField> = { data: "d" };
const HERO_FIELDS: FieldKeys<HeroField> = { id: "id" };

/** The first spelling of the game that states an id wins: two spellings are one game. */
export function initPageHero(page: unknown): HeroPort {
    return {
        readHeroId() {
            const read = errors.attempt(() => readPageEngines(page).map(readEngineHeroId));
            if (read instanceof Error) return read;
            for (const id of read) {
                if (id !== null) return id;
            }
            return new PageReadingAbsent(PAGE_READING.hero);
        },
    };
}

/** Null where the engine holds no hero, or an id that is not a whole number above nought. */
function readEngineHeroId(engine: UnknownRecord): number | null {
    const held = getRecordField(engine, ENGINE_FIELDS, "hero");
    if (held instanceof Error) return null;
    if (held === null) return null;
    const hero = getRecordField(held, HELD_FIELDS, "data");
    if (hero instanceof Error) return null;
    if (hero === null) return null;
    const id = readHeroIdField(hero);
    if (id === null) return null;
    if (!Number.isSafeInteger(id)) return null;
    if (id <= 0) return null;
    return id;
}

/** Either spelling, as a tile is read: a client that states a number as text states the number. */
function readHeroIdField(hero: UnknownRecord): number | null {
    const text = getTextField(hero, HERO_FIELDS, "id");
    if (!(text instanceof Error)) {
        if (text !== null) return parseInteger(text);
    }
    const stated = getNumberField(hero, HERO_FIELDS, "id");
    if (stated instanceof Error) return null;
    return stated;
}
