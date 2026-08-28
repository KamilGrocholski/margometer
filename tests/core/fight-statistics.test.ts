/**
 * The figures, over the fights that produced them.
 *
 * Every sample runs through the decoder rather than being handed a typed event: what the panel
 * will draw has to survive the whole path, and a statistic built on an invented event proves
 * nothing about the protocol.
 */

import { assert, assertEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeFightStatistics } from "@/src/core/fight-statistics.ts";
import {
    getRecordedCombatants,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** `2026-08-06-tempest-grupa-vs-hildur.json`: a blow absorption stood in front of. */
const ABSORBED =
    "467968=100.00;-10000249=99.69;+pierce;+dmgd=1557;+acdmg=16;-absorb=545;-dmgd=1012";
/** `2026-08-04-tempest-lowca-vs-odyncze.json`: health moving with nobody at the other end. */
const POISON = "-255967=19.27;0;poison=140,14";
const HEAL = "482845=100.00;0;heal=99";

Deno.test("a blow lands on both of its ends, and raw stays apart from applied", () => {
    const statistics = composeFightStatistics(decodeFightMessages([ABSORBED], null));
    const dealer = statistics.byCombatantId.get(467968);
    assertEquals(dealer?.damageDealtRaw, 1557, "what the attacker put out");
    assertEquals(dealer?.damageDealtApplied, 1012, "and what of it landed");
    assertEquals(dealer?.damageTakenApplied, 0, "the attacker took nothing here");
    const target = statistics.byCombatantId.get(-10000249);
    assertEquals(target?.damageTakenApplied, 1012, "the target lost what landed");
    assertEquals(target?.damagePrevented, 545, "and a defence stopped this much of it");
    assertEquals(statistics.unreadMessages, 0, "nothing about this blow went unread");
});

Deno.test("health moving without an attacker is taken by somebody and dealt by nobody", () => {
    const statistics = composeFightStatistics(decodeFightMessages([POISON], null));
    const bitten = statistics.byCombatantId.get(-255967);
    assertEquals(bitten?.damageTakenApplied, 140, "the tick is health this combatant lost");
    assertEquals(statistics.dealtByNobody, 140, "and the log ties it to no attacker at all");
    assertEquals(bitten?.healthRestored, 0, "which is not healing, and zero is a reading");
});

Deno.test("health restored is not damage, and nobody is credited with giving it", () => {
    const statistics = composeFightStatistics(decodeFightMessages([HEAL], null));
    const healed = statistics.byCombatantId.get(482845);
    assertEquals(healed?.healthRestored, 99, "the health the protocol says came back");
    assertEquals(healed?.damageTakenApplied, 0, "no total of damage moved");
    assertEquals(statistics.dealtByNobody, 0, "and no attacker was invented to balance it");
});

Deno.test("a fight nothing was read from states nothing rather than zeroes", () => {
    const statistics = composeFightStatistics([]);
    assertEquals(statistics.byCombatantId.size, 0, "no combatant is invented");
    assertEquals(statistics.unreadMessages, 0, "and nothing went unread either");
});

Deno.test("every point applied is counted once at each end, in every recording", () => {
    let dealt = 0;
    let taken = 0;
    let fights = 0;
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path).flatMap((payload) =>
            decodeFightMessages(payload, roster)
        );
        const statistics = composeFightStatistics(events);
        let fightDealt = statistics.dealtByNobody;
        let fightTaken = statistics.takenByNobody;
        for (const figures of statistics.byCombatantId.values()) {
            assert(figures.damageDealtRaw >= 0, `${path}: a total below nothing`);
            assert(figures.damageTakenApplied >= 0, `${path}: a total below nothing`);
            fightDealt += figures.damageDealtApplied;
            fightTaken += figures.damageTakenApplied;
        }
        assertEquals(fightDealt, fightTaken, `${path}: a point landed at one end only`);
        dealt += fightDealt;
        taken += fightTaken;
        fights += 1;
    }
    assertEquals(fights, getRecordingPaths().length, "every recording was totalled");
    assert(dealt > 0, "the recordings carry damage");
    assertEquals(dealt, taken, "and it balances across all of them");
});
