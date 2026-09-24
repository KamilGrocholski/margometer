/**
 * The published tables the tests read, as `develop:frozen/` froze them. The add-on is handed them
 * by whoever holds a frozen reading; until this branch carries one, the tests hold the copy, dated
 * by the fetch it was taken from.
 */

import {
    indexAuraTurnsBySkillId,
    indexShoutsBySkillId,
    type StatedSkills,
} from "@/src/core/aura-standing.ts";
import { type DecoderTables, indexBlowsGrantedBySkillId } from "@/src/core/fight-decoder.ts";

/** `develop:frozen/blows-granted.ts`, fetched 2026-09-23T08:58:25.997Z. */
export const BLOWS_GRANTED: DecoderTables = {
    blowsGrantedBySkillId: indexBlowsGrantedBySkillId([
        { id: 97, blowsGrantedMinimum: 1 },
        { id: 239, blowsGrantedMinimum: 1 },
        { id: 283, blowsGrantedMinimum: 2 },
    ]),
};

/** `develop:frozen/aura-turns.ts`, fetched 2026-09-23T08:58:25.997Z. */
export const AURA_TURNS = {
    skills: [
        { id: 25, turns: 2 },
        { id: 76, turns: 8 },
        { id: 89, turns: 8 },
        { id: 123, turns: 8 },
        { id: 188, turns: 5 },
        { id: 206, turns: 2 },
        { id: 212, turns: 8 },
        { id: 219, turns: 8 },
        { id: 244, turns: 8 },
        { id: 264, turns: 8 },
        { id: 285, turns: 40 },
        { id: 298, turns: 8 },
    ],
    shouts: [
        { id: 25, turns: 3, coverageMinimum: 6 },
        { id: 188, turns: 3, coverageMinimum: 6 },
    ],
} as const;

export const STATED_SKILLS: StatedSkills = {
    turnsBySkillId: indexAuraTurnsBySkillId(AURA_TURNS.skills),
    shoutsBySkillId: indexShoutsBySkillId(AURA_TURNS.shouts),
};

/** `develop:frozen/buff-bits.ts`, read off game build `Bb28FQty`: the position is the bit. */
export const BUFF_BITS = [
    "deep_wound",
    "wound",
    "critical_deep_wound",
    "poisoned",
    "fire",
    "swow_down",
    "speed_up",
    "frostbite",
    "shock",
] as const;
