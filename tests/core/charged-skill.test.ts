/**
 * The special blow being made ready, and the two ends of it the protocol names.
 *
 * The samples are the edges a reading over a whole fight cannot show — a payload that says nothing
 * about the combatant, an end nothing names, and the turn a mark is allowed to outlive. **W5**: a
 * charge at nothing elapsed is a boundary and has one turn beside it.
 */

import { assertEquals, assertStrictEquals } from "@std/assert";
import { BATTLE_EVENT, type BattleEvent } from "@/src/core/battle-event.ts";
import {
    CHARGED_SKILL_STATES,
    CHARGED_SKILLS_MAXIMUM,
    type ChargedSkillStanding,
    type ChargedSkillStatement,
    prepareChargedSkills,
} from "@/src/core/charged-skill.ts";
import { CHARGE_BROKEN_KEY } from "@/src/core/protocol-key.ts";

const MONSTER = -10000249;
const PLAYER = 441419;
const BLOW = "Symfonia żywiołów";

function charging(turnsElapsed: number, turnsStated = 3): ChargedSkillStatement[] {
    return [{ combatantId: MONSTER, charge: { skillName: BLOW, turnsElapsed, turnsStated } }];
}

/** The shape that ends a charge: the combatant stated, and no charge on them. */
function stateless(): ChargedSkillStatement[] {
    return [{ combatantId: MONSTER, charge: null }];
}

function announce(skillName: string): BattleEvent[] {
    return [{
        kind: BATTLE_EVENT.skillUsed,
        actorId: MONSTER,
        targetId: null,
        actorHealthPercent: null,
        targetHealthPercent: null,
        skillName,
        skillId: null,
        declared: [],
    }];
}

function breakCharge(targetId: number): BattleEvent[] {
    return [{
        kind: BATTLE_EVENT.attack,
        actorId: PLAYER,
        targetId,
        actorHealthPercent: null,
        targetHealthPercent: null,
        raw: [],
        applied: [],
        prevented: [],
        destroyed: [],
        procs: [CHARGE_BROKEN_KEY],
        declared: [],
        announced: null,
    }];
}

Deno.test("a charge opens at nothing elapsed, and the next turn stands beside it", () => {
    const opened = prepareChargedSkills([], charging(0), [], 10);
    assertEquals(opened.length, 1, "the envelope stated one charge and one stands");
    assertStrictEquals(opened[0]?.turnsElapsed, 0, "a charge that has just opened has run none");
    assertStrictEquals(opened[0]?.state, "charging", "and is running rather than over");

    const moved = prepareChargedSkills(opened, charging(1), [], 11);
    assertStrictEquals(moved[0]?.turnsElapsed, 1, "and the figure is the game's own, not counted");
    assertStrictEquals(moved[0]?.turnsStated, 3, "beside how long the whole of it runs");
});

Deno.test("a payload saying nothing about the combatant leaves the charge standing", () => {
    const opened = prepareChargedSkills([], charging(1), [], 10);
    const silent = prepareChargedSkills(opened, [], [], 11);
    assertEquals(silent.length, 1, "a payload states only what moved, so silence changes nothing");
    assertStrictEquals(silent[0]?.turnsElapsed, 1, "and the charge is where it was left");
});

Deno.test("the blow's own announcement is what says it struck", () => {
    const opened = prepareChargedSkills([], charging(3), [], 10);
    const struck = prepareChargedSkills(opened, stateless(), announce(BLOW), 11);
    assertEquals(struck.length, 1, "a charge that landed leaves a mark rather than nothing");
    assertStrictEquals(struck[0]?.state, "struck", "and the mark says which end it came to");
    assertStrictEquals(struck[0]?.turnsElapsed, 3, "holding the figures it stopped on");
});

Deno.test("a dispel aimed at the charging combatant is what says it was broken", () => {
    const opened = prepareChargedSkills([], charging(1), [], 10);
    const broken = prepareChargedSkills(opened, stateless(), breakCharge(MONSTER), 11);
    assertStrictEquals(
        broken[0]?.state,
        "broken",
        "the key names the end and the target names whose",
    );
    assertStrictEquals(broken[0]?.turnsElapsed, 1, "and the charge stopped where it stopped");
});

Deno.test("a dispel aimed at somebody else says nothing about this charge", () => {
    const opened = prepareChargedSkills([], charging(1), [], 10);
    const gone = prepareChargedSkills(opened, stateless(), breakCharge(PLAYER), 11);
    assertEquals(gone, [], "a charge ending under nothing nameable leaves no mark at all");
});

Deno.test("an end nothing names leaves no mark, because a word for it would be ours", () => {
    const opened = prepareChargedSkills([], charging(2), [], 10);
    const gone = prepareChargedSkills(opened, stateless(), [], 11);
    assertEquals(gone, [], "the combatant fell, or it went under something unread");
});

Deno.test("a mark stands the turn it was made on and no longer", () => {
    const opened = prepareChargedSkills([], charging(3), [], 10);
    const struck = prepareChargedSkills(opened, stateless(), announce(BLOW), 11);
    assertStrictEquals(struck[0]?.endedAtOrdinal, 11, "the mark remembers the turn it was made on");

    const sameTurn = prepareChargedSkills(struck, [], [], 11);
    assertEquals(sameTurn.length, 1, "the turn it ended on is the turn it is still drawn");

    const nextTurn = prepareChargedSkills(sameTurn, [], [], 12);
    assertEquals(nextTurn, [], "and one turn later there is nothing left to draw");
});

Deno.test("a fight the game numbers no turn on holds a mark for one payload", () => {
    const opened = prepareChargedSkills([], charging(3), [], null);
    const struck = prepareChargedSkills(opened, stateless(), announce(BLOW), null);
    assertStrictEquals(struck[0]?.endedAtOrdinal, null, "there was no turn to remember");
    assertEquals(prepareChargedSkills(struck, [], [], null), [], "so the next payload takes it");
});

Deno.test("a new charge replaces the mark the last one left", () => {
    const opened = prepareChargedSkills([], charging(3), [], 10);
    const struck = prepareChargedSkills(opened, stateless(), announce(BLOW), 11);
    assertStrictEquals(struck[0]?.state, "struck", "a mark stands after the blow landed");
    const again = prepareChargedSkills(struck, charging(0, 4), [], 11);
    assertEquals(again.length, 1, "and the charge that starts under it takes its place");
    assertStrictEquals(again[0]?.state, "charging", "rather than standing beside it");
});

function chargingMany(count: number): ChargedSkillStatement[] {
    const many: ChargedSkillStatement[] = [];
    for (let at = 0; at < count; at += 1) {
        many.push({
            combatantId: -at - 1,
            charge: { skillName: BLOW, turnsElapsed: 0, turnsStated: 2 },
        });
    }
    return many;
}

Deno.test("more charges than the bound states are clamped rather than refused", () => {
    const atBound = prepareChargedSkills([], chargingMany(CHARGED_SKILLS_MAXIMUM), [], 10);
    assertStrictEquals(atBound.length, CHARGED_SKILLS_MAXIMUM, "every charge up to the bound");
    const past = prepareChargedSkills([], chargingMany(CHARGED_SKILLS_MAXIMUM + 1), [], 10);
    assertStrictEquals(
        past.length,
        CHARGED_SKILLS_MAXIMUM,
        "the band draws what it stated it would",
    );
    assertEquals(
        past.map((one) => one.combatantId),
        atBound.map((one) => one.combatantId),
        "and the ones it draws are the first the envelope stated",
    );
});

/** The other charger's blow landing says nothing about this one: the verdict is the announcer's. */
Deno.test("a blow of the same name landed by somebody else ends no charge of one's own", () => {
    const both = prepareChargedSkills(
        [],
        [...charging(1), {
            combatantId: PLAYER,
            charge: { skillName: BLOW, turnsElapsed: 1, turnsStated: 3 },
        }],
        [],
        1,
    );
    assertEquals(both.length, 2, "two combatants make the same blow ready");
    const announcedByPlayer: BattleEvent[] = announce(BLOW).map((one) =>
        one.kind === BATTLE_EVENT.skillUsed ? { ...one, actorId: PLAYER } : one
    );
    const next = prepareChargedSkills(
        both,
        [...stateless(), { combatantId: PLAYER, charge: null }],
        announcedByPlayer,
        2,
    );
    assertEquals(next.map((one) => [one.combatantId, one.state]), [[PLAYER, "struck"]]);
});

/** The three states a charge passes through are the vocabulary's, and each is reached. */
Deno.test("a charge reaches every state the vocabulary names, and no other", () => {
    const opened = prepareChargedSkills([], charging(1), [], 10);
    const struck = prepareChargedSkills(opened, stateless(), announce(BLOW), 11);
    const broken = prepareChargedSkills(opened, stateless(), breakCharge(MONSTER), 11);
    const reached: ChargedSkillStanding[] = [...opened, ...struck, ...broken];
    assertEquals(reached.map((one) => one.state), [...CHARGED_SKILL_STATES], "in that order");
});

/** A mark made on a numbered turn, and a next payload numbering none: the mark goes with it. */
Deno.test("a mark made on a numbered turn goes when the game stops numbering them", () => {
    const opened = prepareChargedSkills([], charging(3), [], 10);
    const struck = prepareChargedSkills(opened, stateless(), announce(BLOW), 11);
    assertStrictEquals(struck[0]?.endedAtOrdinal, 11, "the mark remembers its turn");
    assertEquals(
        prepareChargedSkills(struck, [], [], null),
        [],
        "and a turn nobody numbers ends it",
    );
});
