/**
 * The frozen skill table, held to the corpus and to the rule that derived the smaller tables. The
 * frozen module is a transcript of what the game served, so a reader that stopped matching the page
 * shows here rather than in a sample. The corpus is read the add-on's way, through
 * `tools/recorded-material.ts`.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { FROZEN_AURA_TURNS } from "#/frozen/aura-turns.ts";
import { FROZEN_BLOWS_GRANTED } from "#/frozen/blows-granted.ts";
import { FROZEN_SKILL_DURATIONS } from "#/frozen/skill-durations.ts";
import { indexAuraTurnsBySkillId, lookupStatedTurns } from "#/src/core/aura-standing.ts";
import { BATTLE_EVENT, type SkillUsedEvent } from "#/src/core/battle-event.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { indexBlowsGrantedBySkillId } from "#/src/core/fight-decoder.ts";
import { isTeamWideKey, PROVOCATION_KEY } from "#/src/core/protocol-key.ts";
import { readRecordedMaterial, replayRecordedMaterial } from "#/tools/recorded-material.ts";
import { BLOWS_GRANTED_KEY } from "#/tools/skill-table.ts";

Deno.test("all three frozen files were taken off the same page, on the same fetch", () => {
    assertStrictEquals(
        FROZEN_AURA_TURNS.fetchedAt,
        FROZEN_SKILL_DURATIONS.fetchedAt,
        "a side's table derived from a page other than the one beside it dates nothing",
    );
    assertStrictEquals(FROZEN_BLOWS_GRANTED.fetchedAt, FROZEN_SKILL_DURATIONS.fetchedAt, "a grant");
    assert(FROZEN_SKILL_DURATIONS.skills.length > 0, "and the page served skills");
});

/**
 * ⚠️ **Only the membership is re-earnable here, not the count**: the whole table keeps keys and
 * turns and drops the value, which is all this key states. `tests/tools/skill-table.test.ts` holds
 * the count, against a sample of the page (`develop ADR 0078`).
 */
Deno.test("the skills granting a blow are the rows of the table carrying that key", () => {
    const carrying = FROZEN_SKILL_DURATIONS.skills
        .filter((one) => one.effects.some((effect) => effect.key === BLOWS_GRANTED_KEY))
        .map((one) => one.id);
    assertEquals(FROZEN_BLOWS_GRANTED.skills.map((one) => one.id), carrying, "and nothing else");
    assert(carrying.length > 0, "the page states it on something");
    for (const skill of FROZEN_BLOWS_GRANTED.skills) {
        assert(Number.isSafeInteger(skill.blowsGrantedMinimum), `${skill.id}: a count is whole`);
        assert(skill.blowsGrantedMinimum > 0, `${skill.id}: and a grant is worth a blow`);
    }
    assertStrictEquals(
        indexBlowsGrantedBySkillId(FROZEN_BLOWS_GRANTED.skills).size,
        FROZEN_BLOWS_GRANTED.skills.length,
        "each of them is keyed once",
    );
});

Deno.test("the side's table is what the rule derives from the whole one, and nothing else", () => {
    const derived: { id: number; turns: number }[] = [];
    for (const skill of FROZEN_SKILL_DURATIONS.skills) {
        const turns = lookupStatedTurns(skill.effects);
        if (turns !== null) derived.push({ id: skill.id, turns });
    }
    assertEquals([...FROZEN_AURA_TURNS.skills], derived, "which keys reach a side is core's");
    // ⚠️ **Both sides of that comparison come from the rule**, so what cannot agree by construction
    // is the rule still choosing: one keeping everything, or nothing, answers here and not there.
    assert(derived.length > 0, "the rule reaches skills at all");
    assert(derived.length < FROZEN_SKILL_DURATIONS.skills.length, "and leaves some out");
});

/**
 * ⚠️ **`develop ADR 0078`'s second half rests on this.** An announcement carrying no id reaches as
 * far as the bound allows, and that is honest only while every id the game does send is one the
 * table carries: an id it lacked would read as "nothing extra", and a multi-hit skill would go
 * quietly back into `Zwykły cios`.
 */
Deno.test("every skill the corpus announces by id is one the published table carries", () => {
    const dated = new Set<number>(FROZEN_SKILL_DURATIONS.skills.map((one) => one.id));
    const announced = readAnnouncedSkills();
    const missed = announced.filter((one) => !dated.has(one.skillId ?? -1));
    assert(announced.length > 0, "the corpus announces by id at all");
    assertEquals(missed.map((one) => `${one.skillId} ${one.skillName}`), [], "an id undated");
});

function readAnnouncedSkills(): SkillUsedEvent[] {
    const found: SkillUsedEvent[] = [];
    for (const { reading } of replayRecordedMaterial(readRecordedMaterial([]))) {
        for (const event of reading.view.events) {
            if (event.kind !== BATTLE_EVENT.skillUsed) continue;
            if (event.skillId !== null) found.push(event);
        }
    }
    return found;
}

Deno.test("every skill the corpus casts at a side is one the published table dates", () => {
    const dated = indexAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills);
    const cast = readAnnouncedSkills()
        .filter((event) => event.declared.some((one) => isTeamWideKey(one.effect)));
    const missed = cast.filter((event) => !dated.has(event.skillId ?? -1));
    assert(cast.length > 0, "the corpus casts something at a side");
    assertEquals(missed.map((one) => `${one.skillId} ${one.skillName}`), [], "a cast undated");
});

/**
 * A shout is frozen apart: its table value is a count of characters where every other key states
 * a share, and its turns are not the skill's longest (`develop ADR 0063`).
 */
Deno.test("the frozen shouts are the shout rows of the table, and nothing else is", () => {
    const derived: { id: number; turns: number }[] = [];
    for (const skill of FROZEN_SKILL_DURATIONS.skills) {
        const shout = skill.effects.find((one) => one.key === PROVOCATION_KEY);
        if (shout === undefined) continue;
        assert(shout.turns.length > 0, `${skill.id}: a shout the table dates`);
        derived.push({ id: skill.id, turns: Math.max(...shout.turns) });
    }
    assertEquals(
        FROZEN_AURA_TURNS.shouts.map((one) => ({ id: one.id, turns: one.turns })),
        derived,
        "every skill carrying the key is frozen, at the turns that key states",
    );
    assert(FROZEN_AURA_TURNS.shouts.length > 0, "and there are shouts to freeze");
});

Deno.test("a shout covers a count of characters, and never a whole side", () => {
    for (const shout of FROZEN_AURA_TURNS.shouts) {
        assert(Number.isSafeInteger(shout.coverageMinimum), `${shout.id}: a count is whole`);
        assert(shout.coverageMinimum > 0, `${shout.id}: and a shout covers somebody`);
        // Measured 2026-09-08: both state six. A count reaching a whole side leaves nothing to say.
        assert(shout.coverageMinimum < COMBATANTS_MAXIMUM / 2, `${shout.id}: short of a side`);
        assert(shout.turns > 0, `${shout.id}: and it holds for stated turns`);
    }
});

Deno.test("a duration the table states is a whole number of turns, above nothing", () => {
    for (const skill of FROZEN_AURA_TURNS.skills) {
        assert(Number.isSafeInteger(skill.turns), `${skill.id}: a duration is whole turns`);
        assert(skill.turns > 0, `${skill.id}: and an effect running no turns is not standing`);
    }
    assert(FROZEN_AURA_TURNS.skills.length > 0, "there are skills reaching a side");
});
