/**
 * The figures, over the fights that produced them.
 *
 * Every sample runs through the decoder rather than being handed a typed event: what the panel
 * will draw has to survive the whole path, and a statistic built on an invented event proves
 * nothing about the protocol.
 */

import { assert, assertEquals } from "@std/assert";
import { composeTeamHeals } from "@/src/core/combatant-health.ts";
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
    const statistics = composeFightStatistics(decodeFightMessages([ABSORBED], null), new Map());
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
    const statistics = composeFightStatistics(decodeFightMessages([POISON], null), new Map());
    const bitten = statistics.byCombatantId.get(-255967);
    assertEquals(bitten?.damageTakenApplied, 140, "the tick is health this combatant lost");
    assertEquals(statistics.dealtByNobody, 140, "and the log ties it to no attacker at all");
    assertEquals(bitten?.healthRestored, 0, "which is not healing, and zero is a reading");
});

Deno.test("health restored is not damage, and its own key says who gave it", () => {
    const statistics = composeFightStatistics(decodeFightMessages([HEAL], null), new Map());
    const healed = statistics.byCombatantId.get(482845);
    assertEquals(healed?.healthRestored, 99, "the health the protocol says came back");
    assertEquals(healed?.damageTakenApplied, 0, "no total of damage moved");
    assertEquals(statistics.dealtByNobody, 0, "and no attacker was invented to balance it");
    // `heal` carries `_Cause:_ the subject's own` in `docs/protocol-keys.md`, so the giver is the
    // one healed — on the published help's word, and not because the grammar names one end.
    assertEquals(healed?.healthGiven, 99, "the same combatant is credited with giving it");
    assertEquals(statistics.givenByNobody, 0, "so none of it is left charged to nobody");
});

/**
 * A key the help does not call the subject's own is charged to nobody unless something announced
 * it. `bandage` is the shape: both ends are one person and the help still says the cause is the
 * message actor rather than the subject, so it never joins the self-sourced list on the grammar.
 */
Deno.test("a restoring key nothing announced and no help claims is charged to nobody", () => {
    const bandaged = "482845=100.00;0;bandage=40";
    const statistics = composeFightStatistics(decodeFightMessages([bandaged], null), new Map());
    const healed = statistics.byCombatantId.get(482845);
    assertEquals(healed?.healthRestored, 40, "the health still came back");
    assertEquals(healed?.healthGiven, 0, "and this combatant is credited with none of it");
    assertEquals(statistics.givenByNobody, 40, "the whole of it stands apart, charged to nobody");
});

/** The one healing shape whose giver the protocol names outright, in the actor slot of the cast. */
Deno.test("a cast credits its caster with everything it put back, member by member", () => {
    const roster = composeCombatantRoster([
        { id: 1, name: "Gracz 1", side: 1, profession: "w", level: 40, healthMaximum: 1000 },
        { id: 2, name: "Gracz 2", side: 1, profession: "m", level: 40, healthMaximum: 2000 },
    ]);
    const events = decodeFightMessages([
        "1=100.00;0;step",
        "2=100.00;0;step",
        "1=50.00;0;poison=500",
        "2=50.00;0;poison=1000",
        "1=50.00;1=50.00;tspell=Fala leczenia;skillId=199;healall_per=30",
    ], roster);
    const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
    assertEquals(statistics.byCombatantId.get(1)?.healthGiven, 900, "the caster gave both shares");
    assertEquals(statistics.byCombatantId.get(2)?.healthGiven, 0, "and the other member gave none");
    assertEquals(statistics.givenByNobody, 0, "with nothing left charged to nobody");
    assertEquals(
        statistics.totals.healthGiven,
        statistics.totals.healthRestored,
        "and it balances",
    );
});

/**
 * The share of restored health a giver can be read for, over the whole corpus. A figure rather
 * than an inequality, because what this pins is the reading rule and not a direction: a rule that
 * quietly stopped crediting the self-sourced keys would still satisfy "most of it".
 */
Deno.test("the corpus says who gave nine points of health in ten", () => {
    let restored = 0;
    let given = 0;
    let nobody = 0;
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
        const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
        restored += statistics.totals.healthRestored;
        given += statistics.totals.healthGiven;
        nobody += statistics.givenByNobody;
    }
    assertEquals(restored, 3_755_729, "the health the recordings put back, 2026-08-29");
    assertEquals(given, 3_401_739, "of which this much has a giver the reading can name");
    assertEquals(nobody, 353_990, "and the rest is `heal_target` and `bandage` nothing announced");
    assertEquals(given + nobody, restored, "every point put back is counted once on each side");
});

Deno.test("a fight nothing was read from states nothing rather than zeroes", () => {
    const statistics = composeFightStatistics([], new Map());
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
        const statistics = composeFightStatistics(events, new Map());
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

Deno.test("a cast sized reaches the figures, and one nobody could place is counted", () => {
    const roster = composeCombatantRoster([
        { id: 1, name: "Gracz 1", side: 1, profession: "w", level: 40, healthMaximum: 1000 },
        { id: 2, name: "Gracz 2", side: 1, profession: "m", level: 40, healthMaximum: 2000 },
    ]);
    const events = decodeFightMessages([
        "1=100.00;0;step",
        "2=100.00;0;step",
        "1=50.00;0;poison=500",
        "2=50.00;0;poison=1000",
        "1=50.00;1=50.00;tspell=Fala leczenia;skillId=199;healall_per=30",
    ], roster);
    const sized = composeFightStatistics(events, composeTeamHeals(events, roster));
    assertEquals(sized.byCombatantId.get(1)?.healthRestored, 300, "a share of the first pool");
    assertEquals(sized.byCombatantId.get(2)?.healthRestored, 600, "and of the second");
    assertEquals(sized.castsUnplaced, 0, "with nothing left unplaced");

    const unsized = composeFightStatistics(events, new Map());
    assertEquals(unsized.byCombatantId.get(1)?.healthRestored, 0, "unsized, it restores nothing");
    assertEquals(unsized.castsUnplaced, 1, "and the cast is counted as one nobody placed");
});

Deno.test("what the recordings restore is mostly what a cast put back", () => {
    let restored = 0;
    let unplaced = 0;
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
        const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
        restored += statistics.totals.healthRestored;
        unplaced += statistics.castsUnplaced;
    }
    assertEquals(unplaced, 0, "every cast the corpus holds is sized onto its side");
    assert(restored > 2_000_000, "and the health they put back is most of what was restored");
});

Deno.test("a blow is cut by what it was dealt with and by whom it reached", () => {
    const statistics = composeFightStatistics(decodeFightMessages([ABSORBED], null), new Map());
    const dealer = statistics.byCombatantId.get(467968);
    assertEquals(dealer?.damageDealtByElement.get("dmgd"), 1012, "the element the key names");
    assertEquals(dealer?.damageDealtByOpponent.get("-10000249"), 1012, "and the end it reached");
    const target = statistics.byCombatantId.get(-10000249);
    assertEquals(target?.damageTakenByElement.get("dmgd"), 1012, "the same figure, the other way");
    assertEquals(target?.damageTakenByOpponent.get("467968"), 1012, "and from whom");
});

Deno.test("every cut of a combatant comes to that combatant's own total", () => {
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
        const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
        for (const [combatantId, figures] of statistics.byCombatantId) {
            let byElement = 0;
            for (const amount of figures.damageDealtByElement.values()) byElement += amount;
            assertEquals(
                byElement,
                figures.damageDealtApplied,
                `${path}: ${combatantId} by element`,
            );
            let byOpponent = 0;
            for (const amount of figures.damageDealtByOpponent.values()) byOpponent += amount;
            // Not every blow names its target, so what the cuts hold is at most the total: what
            // is missing from this one is damage nobody could be charged with taking.
            assert(byOpponent <= figures.damageDealtApplied, `${path}: ${combatantId} by opponent`);
        }
    }
});
