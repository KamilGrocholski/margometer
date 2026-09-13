/**
 * The frozen skill table, held to the corpus and to the rule that derived the smaller of the two.
 *
 * This is where the reader is proved against the real page: the frozen module is a transcript of
 * what the game served, so a reader that stopped matching it shows here rather than in a sample.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import { FROZEN_BLOWS_GRANTED } from "@/frozen/blows-granted.ts";
import { FROZEN_SKILL_DURATIONS } from "@/frozen/skill-durations.ts";
import {
    composeAuraTurnsBySkillId,
    getStatedTurnsFromEffects,
    isTeamWideKey,
    PROVOCATION_KEY,
} from "@/src/core/aura-standing.ts";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { composeCombatantRoster, MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import { composeBlowsGrantedBySkillId, decodeFightMessages } from "@/src/core/fight-decoder.ts";
import {
    BLOWS_GRANTED,
    getRecordedCombatants,
    getRecordedPayloads,
    readRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** The game's word for the effect, spelled here because this file reads the frozen rows. */
const BLOWS_GRANTED_KEY = "add_attacks";

/** Every skill the corpus announces beside a key reaching more than one combatant. */
function getCastSkillIds(): Map<number, string> {
    const found = new Map<number, string>();
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events: BattleEvent[] = [];
        for (const messages of getRecordedPayloads(path)) {
            events.push(...decodeFightMessages(messages, roster, BLOWS_GRANTED));
        }
        for (const event of events) {
            if (event.kind !== "skill-used") continue;
            if (event.skillId === null) continue;
            if (!event.declared.some((one) => isTeamWideKey(one.effect))) continue;
            found.set(event.skillId, event.skillName);
        }
    }
    return found;
}

Deno.test("all three frozen files were taken off the same page, on the same fetch", () => {
    assertStrictEquals(
        FROZEN_AURA_TURNS.fetchedAt,
        FROZEN_SKILL_DURATIONS.fetchedAt,
        "a side's table derived from a page other than the one beside it dates nothing",
    );
    assertStrictEquals(
        FROZEN_BLOWS_GRANTED.fetchedAt,
        FROZEN_SKILL_DURATIONS.fetchedAt,
        "and neither does a grant",
    );
    assert(FROZEN_SKILL_DURATIONS.skills.length > 0, "and the page served skills");
});

/**
 * ⚠️ **Only the membership is re-earnable here, and the count is not.**
 * `FROZEN_SKILL_DURATIONS` keeps keys and turns and drops the value, which is the whole of what
 * this key states — the same split the shouts already carry. What holds the count is
 * `tests/tools/skill-table.test.ts`, against a transcript of the page. **ADR 0078.**
 */
Deno.test("the skills granting a blow are the rows of the table carrying that key", () => {
    const carrying = FROZEN_SKILL_DURATIONS.skills
        .filter((one) => one.effects.some((effect) => effect.key === BLOWS_GRANTED_KEY))
        .map((one) => one.id);
    assertEquals(
        FROZEN_BLOWS_GRANTED.skills.map((one) => one.id),
        carrying,
        "every skill the page states it on is frozen, and nothing else is",
    );
    assert(carrying.length > 0, "and the page states it on something");
    for (const skill of FROZEN_BLOWS_GRANTED.skills) {
        assert(Number.isSafeInteger(skill.blowsGrantedMinimum), `${skill.id}: a count is whole`);
        assert(skill.blowsGrantedMinimum > 0, `${skill.id}: and a grant is worth a blow`);
    }
    assertStrictEquals(
        composeBlowsGrantedBySkillId(FROZEN_BLOWS_GRANTED.skills).size,
        FROZEN_BLOWS_GRANTED.skills.length,
        "and each of them is keyed once",
    );
});

Deno.test("the side's table is what the rule derives from the whole one, and nothing else", () => {
    const derived: { id: number; turns: number }[] = [];
    for (const skill of FROZEN_SKILL_DURATIONS.skills) {
        const turns = getStatedTurnsFromEffects(skill.effects);
        if (turns === null) continue;
        derived.push({ id: skill.id, turns });
    }
    assertEquals(
        [...FROZEN_AURA_TURNS.skills],
        derived,
        "the judgement about which keys reach a side is written once, in core",
    );
    // ⚠️ **Both sides of that comparison come from the rule**, so a rule that changed and a file
    // re-frozen under it agree by construction. What cannot agree by construction is the rule
    // still choosing: one that kept everything, or nothing, would answer here and not there.
    assert(derived.length > 0, "the rule reaches skills at all");
    assert(
        derived.length < FROZEN_SKILL_DURATIONS.skills.length,
        "and leaves some out — a rule keeping every skill is one that stopped choosing",
    );
});

/**
 * ⚠️ **The whole of ADR 0078's second half rests on this, and it is the reason it is here.** An
 * announcement carrying no id is read as one the table cannot be asked about, and its reach falls
 * to the bound. That reading is only honest while every id the game **does** send is one the table
 * carries: an id it did not would be read as "the table says nothing extra", the reach would be
 * one message, and a multi-hit skill would go quietly back into `Zwykły cios`.
 */
Deno.test("every skill the corpus announces by id is one the published table carries", () => {
    const dated = new Set<number>(FROZEN_SKILL_DURATIONS.skills.map((one) => one.id));
    const missed = new Map<number, string>();
    let stated = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const messages of getRecordedPayloads(path)) {
            for (const event of decodeFightMessages(messages, roster, BLOWS_GRANTED)) {
                if (event.kind !== "skill-used") continue;
                if (event.skillId === null) continue;
                stated += 1;
                if (dated.has(event.skillId)) continue;
                missed.set(event.skillId, event.skillName);
            }
        }
    }
    assertEquals([...missed], [], "an id the reach would read as a table saying nothing extra");
    assert(stated > 0, "the corpus announces by id at all");
});

Deno.test("every skill the corpus casts at a side is one the published table dates", () => {
    const dated = composeAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills);
    const cast = getCastSkillIds();
    const missed = [...cast]
        .filter(([id]) => !dated.has(id))
        .map(([id, name]) => `${id} (${name})`);
    assert(cast.size > 0, "the corpus casts something at a side");
    assertEquals(missed, [], "a cast the panel would draw with no duration beside it");
});

/**
 * The shout is frozen apart because its table value is a **count of characters** where every other
 * key states a share, and because its own turns are not the skill's longest — `Wyzywający okrzyk`
 * runs a debuff for five and provokes for three. **ADR 0063.**
 */
Deno.test("the frozen shouts are the shout rows of the table, and nothing else is", () => {
    const derived: { id: number; turns: number }[] = [];
    for (const skill of FROZEN_SKILL_DURATIONS.skills) {
        const shout = skill.effects.find((one) => one.key === PROVOCATION_KEY);
        if (shout === undefined) continue;
        assert(shout.turns.length > 0, `${skill.id}: a shout the table dates`);
        derived.push({ id: skill.id, turns: Math.max(...shout.turns) });
    }
    // ⚠️ **The count is not re-earnable here.** `FROZEN_SKILL_DURATIONS` keeps keys and turns and
    // drops the value in front of the `@`, which is the whole of what a shout states. What holds
    // the count is `tests/tools/skill-table.test.ts`, against a transcript of the page.
    assertEquals(
        FROZEN_AURA_TURNS.shouts.map((one) => ({ id: one.id, turns: one.turns })),
        derived,
        "every skill carrying the key is frozen, at the turns that key states",
    );
    assert(FROZEN_AURA_TURNS.shouts.length > 0, "and there are shouts to freeze");
});

Deno.test("a shout covers a count of characters, and a side holds at most ten", () => {
    for (const shout of FROZEN_AURA_TURNS.shouts) {
        assert(Number.isSafeInteger(shout.coverageMinimum), `${shout.id}: a count is whole`);
        assert(shout.coverageMinimum > 0, `${shout.id}: and a shout covers somebody`);
        // Past a side, the count would reach every opposing side there can be and the panel's
        // seven-or-more branch would be dead. Measured 2026-09-08: both state six.
        assert(
            shout.coverageMinimum < MAXIMUM_COMBATANTS / 2,
            `${shout.id}: a count reaching a whole side would leave nothing to say`,
        );
        assert(shout.turns > 0, `${shout.id}: and it holds for stated turns`);
    }
    assert(FROZEN_AURA_TURNS.shouts.length > 0, "there are shouts to ask this of");
});

Deno.test("a duration the table states is a whole number of turns, above nothing", () => {
    for (const skill of FROZEN_AURA_TURNS.skills) {
        assert(Number.isSafeInteger(skill.turns), `${skill.id}: a duration is whole turns`);
        assert(skill.turns > 0, `${skill.id}: and an effect running no turns is not standing`);
    }
    assert(FROZEN_AURA_TURNS.skills.length > 0, "there are skills reaching a side");
});
