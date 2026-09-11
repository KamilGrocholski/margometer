/**
 * The special blow being made ready, and the two ends of it the protocol names.
 *
 * The corpus test at the foot is what states this over every recording; the samples above it are
 * the edges a reading over a whole fight cannot show — a payload that says nothing about the
 * combatant, an end nothing names, and the turn a mark is allowed to outlive. **W5**: a charge
 * at nothing elapsed is a boundary and has one turn beside it.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import {
    CHARGE_BROKEN_KEY,
    type ChargedSkillStatement,
    composeChargedSkills,
    MAXIMUM_CHARGED_SKILLS,
} from "@/src/core/charged-skill.ts";
import { addPayloadToFight, composeFightUnderway } from "@/src/game/fight-underway.ts";
import { getRecordedEngineUpdates, readRecordingPaths } from "@/tests/recorded-fight.ts";

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
        kind: "skill-used",
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
        kind: "attack",
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
    const opened = composeChargedSkills([], charging(0), [], 10);
    assertEquals(opened.length, 1, "the envelope stated one charge and one stands");
    assertStrictEquals(opened[0]?.turnsElapsed, 0, "a charge that has just opened has run none");
    assertStrictEquals(opened[0]?.state, "charging", "and is running rather than over");

    const moved = composeChargedSkills(opened, charging(1), [], 11);
    assertStrictEquals(moved[0]?.turnsElapsed, 1, "and the figure is the game's own, not counted");
    assertStrictEquals(moved[0]?.turnsStated, 3, "beside how long the whole of it runs");
});

Deno.test("a payload saying nothing about the combatant leaves the charge standing", () => {
    const opened = composeChargedSkills([], charging(1), [], 10);
    const silent = composeChargedSkills(opened, [], [], 11);
    assertEquals(silent.length, 1, "a payload states only what moved, so silence changes nothing");
    assertStrictEquals(silent[0]?.turnsElapsed, 1, "and the charge is where it was left");
});

Deno.test("the blow's own announcement is what says it struck", () => {
    const opened = composeChargedSkills([], charging(3), [], 10);
    const struck = composeChargedSkills(opened, stateless(), announce(BLOW), 11);
    assertEquals(struck.length, 1, "a charge that landed leaves a mark rather than nothing");
    assertStrictEquals(struck[0]?.state, "struck", "and the mark says which end it came to");
    assertStrictEquals(struck[0]?.turnsElapsed, 3, "holding the figures it stopped on");
});

Deno.test("a dispel aimed at the charging combatant is what says it was broken", () => {
    const opened = composeChargedSkills([], charging(1), [], 10);
    const broken = composeChargedSkills(opened, stateless(), breakCharge(MONSTER), 11);
    assertStrictEquals(
        broken[0]?.state,
        "broken",
        "the key names the end and the target names whose",
    );
    assertStrictEquals(broken[0]?.turnsElapsed, 1, "and the charge stopped where it stopped");
});

Deno.test("a dispel aimed at somebody else says nothing about this charge", () => {
    const opened = composeChargedSkills([], charging(1), [], 10);
    const gone = composeChargedSkills(opened, stateless(), breakCharge(PLAYER), 11);
    assertEquals(gone, [], "a charge ending under nothing nameable leaves no mark at all");
});

Deno.test("an end nothing names leaves no mark, because a word for it would be ours", () => {
    const opened = composeChargedSkills([], charging(2), [], 10);
    const gone = composeChargedSkills(opened, stateless(), [], 11);
    assertEquals(gone, [], "the combatant fell, or it went under something unread");
});

Deno.test("a mark stands the turn it was made on and no longer", () => {
    const opened = composeChargedSkills([], charging(3), [], 10);
    const struck = composeChargedSkills(opened, stateless(), announce(BLOW), 11);
    assertStrictEquals(struck[0]?.endedAtOrdinal, 11, "the mark remembers the turn it was made on");

    const sameTurn = composeChargedSkills(struck, [], [], 11);
    assertEquals(sameTurn.length, 1, "the turn it ended on is the turn it is still drawn");

    const nextTurn = composeChargedSkills(sameTurn, [], [], 12);
    assertEquals(nextTurn, [], "and one turn later there is nothing left to draw");
});

Deno.test("a fight the game numbers no turn on holds a mark for one payload", () => {
    const opened = composeChargedSkills([], charging(3), [], null);
    const struck = composeChargedSkills(opened, stateless(), announce(BLOW), null);
    assertStrictEquals(struck[0]?.endedAtOrdinal, null, "there was no turn to remember");
    assertEquals(composeChargedSkills(struck, [], [], null), [], "so the next payload takes it");
});

Deno.test("a new charge replaces the mark the last one left", () => {
    const opened = composeChargedSkills([], charging(3), [], 10);
    const struck = composeChargedSkills(opened, stateless(), announce(BLOW), 11);
    assertStrictEquals(struck[0]?.state, "struck", "a mark stands after the blow landed");
    const again = composeChargedSkills(struck, charging(0, 4), [], 11);
    assertEquals(again.length, 1, "and the charge that starts under it takes its place");
    assertStrictEquals(again[0]?.state, "charging", "rather than standing beside it");
});

Deno.test("more charges than the bound states are clamped rather than refused", () => {
    const many: ChargedSkillStatement[] = [];
    for (let at = 0; at < MAXIMUM_CHARGED_SKILLS + 3; at += 1) {
        many.push({
            combatantId: -at - 1,
            charge: { skillName: BLOW, turnsElapsed: 0, turnsStated: 2 },
        });
    }
    const held = composeChargedSkills([], many, [], 10);
    assertStrictEquals(
        held.length,
        MAXIMUM_CHARGED_SKILLS,
        "the band draws what it stated it would",
    );
});

/**
 * Every recording, walked through the game layer the panel itself uses. The figures are not
 * written down: what is held is the **shape** — a charge never runs past what the game says it
 * runs for, a mark never outlives the turn it was made on, and both ends the protocol names are
 * the only two ever marked.
 */
Deno.test("every recording states charges the panel can hold", () => {
    const paths = readRecordingPaths();
    assert(paths.length > 0, "there are recordings to read");
    let charging = 0;
    let struck = 0;
    let broken = 0;
    for (const path of paths) {
        const underway = composeFightUnderway();
        for (const payload of getRecordedEngineUpdates(path)) {
            addPayloadToFight(underway, payload);
            const ordinal = underway.turnStatement?.ordinal ?? null;
            for (const held of underway.chargedSkills) {
                assert(held.turnsElapsed >= 0, `${path}: a charge runs no fewer than nothing`);
                assert(
                    held.turnsElapsed <= held.turnsStated,
                    `${path}: and no further than the game says it runs`,
                );
                assert(
                    held.skillName.length > 0,
                    `${path}: a charge names the blow it makes ready`,
                );
                if (held.state === "charging") {
                    charging += 1;
                    assertStrictEquals(
                        held.endedAtOrdinal,
                        null,
                        `${path}: a running charge has no end`,
                    );
                    continue;
                }
                if (held.state === "struck") struck += 1;
                if (held.state === "broken") broken += 1;
                if (held.endedAtOrdinal === null) continue;
                if (ordinal === null) continue;
                assert(
                    ordinal <= held.endedAtOrdinal,
                    `${path}: a mark never outlives the turn it was made on`,
                );
            }
        }
    }
    assert(charging > 0, "the corpus states charges the panel would draw");
    assert(struck > 0, "blows that landed");
    assert(broken > 0, "and blows that were taken away");
});
