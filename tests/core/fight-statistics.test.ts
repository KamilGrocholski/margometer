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

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: a blow absorption stood in front
 * of.
 */
const ABSORBED =
    "467968=100.00;-10000249=99.69;+pierce;+dmgd=1557;+acdmg=16;-absorb=545;-dmgd=1012";
/**
 * `2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json`: health moving with nobody at the
 * other end.
 */
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

/**
 * `2026-08-12-experimental-tancerz-vs-wojownik-1781609507010-none.json`: damage stated against a
 * name, on the
 * announcement that dealt it. The name is resolved through a roster, so the sample carries one.
 */
const NAMED_DAMAGE =
    "195782=96.83;114881=80.61;tspell=Zdruzgotanie;skillId=39;+oth_dmg=1529,a,Gracz 1(80.61%);" +
    "combo-max=3";

/**
 * A figure stated against a name is damage its announcement dealt, and the skill row is the only
 * place it can be read: it is not a swing, so no count of blows accounts for it, and a section
 * that skipped it would close the whole of it into the row for a blow nothing announced.
 */
Deno.test("damage stated against a name is charged to the skill that announced it", () => {
    const roster = composeCombatantRoster([
        { id: 195782, name: "Gracz 2", side: 1, profession: "t", level: 100, healthMaximum: 5000 },
        { id: 114881, name: "Gracz 1", side: 2, profession: "w", level: 100, healthMaximum: 5000 },
    ]);
    const events = decodeFightMessages([NAMED_DAMAGE], roster);
    const statistics = composeFightStatistics(events, new Map());
    const dealer = statistics.byCombatantId.get(195782);
    assertEquals(dealer?.damageDealtApplied, 1529, "the figure reaches whoever announced it");
    const skill = dealer?.skills.get("Zdruzgotanie");
    assertEquals(skill?.dealt, 1529, "and the skill row holds the whole of it");
    assertEquals(skill?.dealtByOpponent.get("114881"), 1529, "cut by the name it was stated of");
    assertEquals(dealer?.blowsStruck, 0, "no blow was struck: this rides one aimed elsewhere");
    assertEquals(dealer?.blowsWithoutSkill, 0, "so no blow is counted as standing behind nothing");
    assertEquals(skill?.blows, 0, "and the skill's own count of swings holds none either");
});

/** An announcement of the game's own that nothing of the damage family follows. */
const AURA =
    "466476=94.30;466476=94.30;tspell=Aura ochrony;skillId=76;aura-ac_per=20;aura-resall=15";
/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: the announcement `ABSORBED` swings
 * under.
 */
const ANNOUNCED = "467968=100.00;-10000249=100.00;tspell=Zatruta strzała;skillId=232";
/**
 * `2026-08-12-experimental-tancerz-vs-wojownik-1781609507010-none.json`: the same shape with a
 * block in front of it,
 * so the swing went out and landed nothing.
 */
const BLOCKED = [
    "114881=95.35;195782=96.83;tspell=Błyskawiczny cios;skillId=209",
    "114881=95.35;195782=96.83;+dmg=1259;+dmgo=839;+acdmg=17;-blok=378;-dmg=0",
];

/**
 * The two counts a skill row keeps apart, and the panel reads the second: an announcement that
 * never swung is not a thing damage was dealt with, whatever it declared.
 */
Deno.test("an announcement counts a use, and a swing only where one went out", () => {
    const alone = composeFightStatistics(decodeFightMessages([AURA], null), new Map());
    const aura = alone.byCombatantId.get(466476)?.skills.get("Aura ochrony");
    assertEquals(aura?.uses, 1, "the announcement was made once");
    assertEquals(aura?.blows, 0, "and nothing was struck under it");
    assertEquals(aura?.dealt, 0, "so it dealt nothing, which is a reading and not a gap");
    const struck = composeFightStatistics(
        decodeFightMessages([ANNOUNCED, ABSORBED], null),
        new Map(),
    );
    const arrow = struck.byCombatantId.get(467968)?.skills.get("Zatruta strzała");
    assertEquals(arrow?.uses, 1, "the same one announcement");
    assertEquals(arrow?.blows, 1, "with one swing behind it");
    assertEquals(arrow?.dealt, 1012, "landing what that blow landed");
});

Deno.test("a swing that landed nothing is still a swing under its announcement", () => {
    const statistics = composeFightStatistics(decodeFightMessages(BLOCKED, null), new Map());
    const skill = statistics.byCombatantId.get(114881)?.skills.get("Błyskawiczny cios");
    assertEquals(skill?.dealt, 0, "a block stopped the whole of it");
    assertEquals(skill?.blows, 1, "and the swing that was stopped still went out");
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

/**
 * The same key with the announcement it was stated on, which is where the giver comes from
 * (`docs/protocol-keys.md`, `_Cause:_ the announcement's actor`). The healer is not the healed
 * here, so a reading that took the message's own slots would credit the wrong person.
 */
Deno.test("a restoring key credits whoever announced it, and names the skill on their row", () => {
    const announced = "469657=95.78;445202=100.00;tspell=Leczenie ran;skillId=78;heal_target=11733";
    const statistics = composeFightStatistics(decodeFightMessages([announced], null), new Map());
    assertEquals(statistics.givenByNobody, 0, "nothing is left charged to nobody");
    const healer = statistics.byCombatantId.get(469657);
    assertEquals(healer?.healthGiven, 11733, "the announcer is credited with giving it");
    assertEquals(healer?.healthRestored, 0, "and with receiving none of it");
    assertEquals(healer?.skills.get("Leczenie ran")?.restored, 11733, "under the skill's own name");
    const healed = statistics.byCombatantId.get(445202);
    assertEquals(healed?.healthRestored, 11733, "the health reached the target slot");
    assertEquals(healed?.healthGiven, 0, "which gave none of it");
});

/**
 * What an opened pair adds up: an announcement's own row, or the key, and never both.
 *
 * The key stands on the giver's row here and nowhere else on it, because the pair names whoever
 * received the health — which is whose cause the key is. A flat cut of a giver by key would word
 * their row with somebody else's.
 */
Deno.test("health between two is charged to the skill that announced it, or to the key", () => {
    const announced = "469657=95.78;445202=100.00;tspell=Leczenie ran;skillId=78;heal_target=11733";
    const statistics = composeFightStatistics(
        decodeFightMessages([announced, HEAL], null),
        new Map(),
    );
    const healer = statistics.byCombatantId.get(469657);
    assertEquals(healer?.healthGivenByReceiver.get("445202"), 11733, "the pair holds the figure");
    assertEquals(
        healer?.skills.get("Leczenie ran")?.restoredByOpponent.get("445202"),
        11733,
        "and the announcement's own row holds the whole of it",
    );
    assertEquals(
        healer?.healthGivenWithoutSkillByReceiverAndSource.get("445202"),
        undefined,
        "so no key stands beside it, which would state the figure twice",
    );
    // The other branch, on a key the help calls the subject's own: nothing announced it, so the
    // pair of them with themselves is where it stands.
    const alone = statistics.byCombatantId.get(482845);
    assertEquals(alone?.healthGivenByReceiver.get("482845"), 99, "a self-sourced pair is a pair");
    assertEquals(
        [...alone?.healthGivenWithoutSkillByReceiverAndSource.get("482845") ?? []],
        [["heal", 99]],
        "and the key the protocol wrote it under is what the pair holds",
    );
    assertEquals(alone?.skills.size, 0, "with no announcement to hold it instead");
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
    const cast = statistics.byCombatantId.get(1)?.skills.get("Fala leczenia");
    assertEquals(cast?.restored, 900, "the skill that announced it holds what it put back");
    assertEquals(cast?.restoredByOpponent.get("2"), 600, "cut by whom each share reached");
    assertEquals(
        statistics.totals.healthGiven,
        statistics.totals.healthRestored,
        "and it balances",
    );
});

/**
 * The share of restored health a giver can be read for, over the whole corpus. Figures rather
 * than an inequality, because what this pins is the reading rule and not a direction: a rule that
 * quietly stopped crediting the self-sourced keys would still satisfy "most of it".
 *
 * The material answers for every point, which is a claim about the material and not a law — the
 * test above keeps the shape of a key nothing announces, so the nought here is a reading and not
 * a branch that has gone dead.
 */
Deno.test("the corpus says who gave every point of health it put back", () => {
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
    assertEquals(restored, 3_755_729, "the health the recordings put back, 2026-08-30");
    assertEquals(given, 3_755_729, "all of which has a giver the reading can name");
    assertEquals(nobody, 0, "and none of it is left charged to nobody");
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

/**
 * Every cut of a figure is a cut **of that figure**: the two flat ones and the one that cuts by
 * both ends at once have to come to the same total, or the panel is drawing a figure nobody has.
 */
Deno.test("a cut by both ends comes to the same figure as the cut by one", () => {
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
        const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
        for (const [combatantId, figures] of statistics.byCombatantId) {
            const where = `${path}: ${combatantId}`;
            for (
                const [flat, deep] of [
                    [figures.damageDealtByOpponent, figures.damageDealtByOpponentAndKind],
                    [figures.damageTakenByOpponent, figures.damageTakenByOpponentAndKind],
                ] as const
            ) {
                for (const [other, amount] of flat) {
                    const kinds = deep.get(other);
                    assert(kinds !== undefined, `${where}: a pair cut by one end and not by both`);
                    let total = 0;
                    for (const figure of kinds.values()) total += figure;
                    assertEquals(total, amount, `${where}: the two cuts disagree about ${other}`);
                }
            }
            // And every skill is a part of what its announcer dealt or put back, never more.
            let dealt = 0;
            let restored = 0;
            for (const skill of figures.skills.values()) {
                dealt += skill.dealt;
                restored += skill.restored;
            }
            assert(dealt <= figures.damageDealtApplied, `${where}: a skill dealt more than they`);
            assert(restored <= figures.healthGiven, `${where}: a skill put back more than they`);
            assert(
                figures.blowsWithoutSkill <= figures.blowsStruck,
                `${where}: more blows nothing announced than blows`,
            );
        }
    }
});

/**
 * The inequality an opened pair on the screen about what reached this combatant rests on, over
 * every recording. The announcements are the **attacker's**, so the panel reads them off that
 * combatant's row and closes what is left against `Zwykły cios` — and a sum that overshot would
 * leave `composePairParts` asserting rather than drawing.
 *
 * Both edges are counted as well as summed. An inequality passes trivially where the left side is
 * always nothing, so a pair holding the whole of its figure under announcements and a pair holding
 * none of it must both occur, or the rule is being read on faith.
 */
Deno.test("what one dealt another is the announcements aimed at them, and never more", () => {
    let whole = 0;
    let none = 0;
    let between = 0;
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
        const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
        for (const [combatantId, figures] of statistics.byCombatantId) {
            for (const [other, kinds] of figures.damageTakenByOpponentAndKind) {
                let total = 0;
                for (const figure of kinds.values()) total += figure;
                let held = 0;
                for (
                    const skill of statistics.byCombatantId.get(Number(other))?.skills.values() ??
                        []
                ) {
                    held += skill.dealtByOpponent.get(`${combatantId}`) ?? 0;
                }
                assert(
                    held <= total,
                    `${path}: ${other} announced more against ${combatantId} than reached them`,
                );
                if (total === 0) continue;
                if (held === 0) none += 1;
                else if (held === total) whole += 1;
                else between += 1;
            }
        }
    }
    assert(whole > 0, "some pair holds the whole of its figure under announcements");
    assert(none > 0, "and some pair holds none of it, so the closing row has something to say");
    assert(between > 0, "and some holds part, which is the case both edges leave out");
});

/**
 * The equation an opened healing pair rests on, over every recording.
 *
 * A section that came to less than the figure over it is a column of shares adding to
 * ninety-something, and a reader cannot tell a missing figure from one that was never there. The
 * two branches are counted as well as summed: a writer that had stopped charging the keys would
 * still balance, by charging everything to the skills.
 */
Deno.test("what one gave another is the skills announced for it plus the keys, exactly", () => {
    let pairs = 0;
    let announced = 0;
    let stated = 0;
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = getRecordedPayloads(path).flatMap((one) => decodeFightMessages(one, roster));
        const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
        for (const [combatantId, figures] of statistics.byCombatantId) {
            for (const [other, amount] of figures.healthGivenByReceiver) {
                pairs += 1;
                let held = 0;
                for (const skill of figures.skills.values()) {
                    const figure = skill.restoredByOpponent.get(other) ?? 0;
                    if (figure > 0) announced += 1;
                    held += figure;
                }
                const keys = figures.healthGivenWithoutSkillByReceiverAndSource.get(other);
                for (const figure of keys?.values() ?? []) {
                    stated += 1;
                    held += figure;
                }
                assertEquals(
                    held,
                    amount,
                    `${path}: ${combatantId} to ${other} is not what its parts hold`,
                );
            }
            // The same equation on the receiving side, which is the one the panel's own section
            // is built from: what reached this combatant is the announcements aimed at them plus
            // the keys nothing announced, and nothing is left over to close a section against.
            let reached = 0;
            for (const held of statistics.byCombatantId.values()) {
                for (const skill of held.skills.values()) {
                    reached += skill.restoredByOpponent.get(`${combatantId}`) ?? 0;
                }
            }
            for (const figure of figures.healthRestoredWithoutSkillBySource.values()) {
                reached += figure;
            }
            assertEquals(
                reached,
                figures.healthRestored,
                `${path}: what reached ${combatantId} is not what its parts hold`,
            );
            // And the other way round, so a pair written on one row and not the other is a
            // finding rather than a section that quietly lists nobody.
            for (const giver of figures.healthRestoredByGiver.keys()) {
                const held = statistics.byCombatantId.get(Number(giver));
                assert(
                    held?.healthGivenByReceiver.has(`${combatantId}`) === true,
                    `${path}: ${giver} healed ${combatantId} on one row only`,
                );
            }
        }
    }
    assert(pairs > 0, "the corpus holds pairs to check this on");
    assert(announced > 0, "some of them stand on an announcement");
    assert(stated > 0, "and some on a key the game named with nothing announced in front of it");
});

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: a critical blow that pierced and
 * destroyed armour.
 */
const CRITICAL = "467968=100.00;-10000249=99.69;+crit;+pierce;+dmgd=1557;+acdmg=16;-dmgd=1012";
/** The same shape with the defending side's own flag on it, which is not the striker's. */
const EVADED = "467968=100.00;-10000249=99.69;-evade;+dmgd=900;-dmgd=0";
/** A key the register refuses an end: decoded, and charged to nobody until somebody knows. */
const UNSETTLED = "467968=100.00;-10000249=99.69;-tenacity;+dmgd=100;-dmgd=100";

Deno.test("what fired beside a blow lands on the row of whoever it belongs to", () => {
    const statistics = composeFightStatistics(decodeFightMessages([CRITICAL], null), new Map());
    const striker = statistics.byCombatantId.get(467968);
    const struck = statistics.byCombatantId.get(-10000249);
    assertEquals(
        [...striker?.procsWhenStriking ?? []],
        [["+crit", 1], ["+pierce", 1]],
        "the striker's",
    );
    assertEquals(
        striker?.blowsCritical,
        1,
        "and the blow is counted as one that landed critically",
    );
    assertEquals(
        [...striker?.procsWhenStruck ?? []],
        [],
        "and nothing of it is theirs defensively",
    );
    assertEquals(
        [...struck?.procsWhenStriking ?? []],
        [],
        "the struck combatant swung nothing here",
    );
    assertEquals([...struck?.procsWhenStruck ?? []], [], "and fired nothing of their own either");
    assertEquals([...striker?.statisticsDestroyed ?? []], [["acdmg", 16]], "what it took off them");
    assertEquals(
        [...struck?.statisticsDestroyed ?? []],
        [],
        "which is charged to the striker alone",
    );
});

Deno.test("a flag the defence fired is the defence's, whichever sign the key wears", () => {
    const statistics = composeFightStatistics(decodeFightMessages([EVADED], null), new Map());
    assertEquals(
        [...statistics.byCombatantId.get(-10000249)?.procsWhenStruck ?? []],
        [["-evade", 1]],
        "an evade sits on the row of whoever evaded, not of whoever was evaded",
    );
    assertEquals(
        [...statistics.byCombatantId.get(467968)?.procsWhenStriking ?? []],
        [],
        "and never on the striker's, which is what reading the sign would have got wrong",
    );
    assertEquals(statistics.byCombatantId.get(467968)?.blowsCritical, 0, "nothing critical here");
});

Deno.test("a proc nobody can place is charged to nobody rather than to whoever was handy", () => {
    const statistics = composeFightStatistics(decodeFightMessages([UNSETTLED], null), new Map());
    assertEquals(
        statistics.unreadMessages,
        0,
        "the key is read: it is whose it is that is unknown",
    );
    for (const figures of statistics.byCombatantId.values()) {
        assertEquals([...figures.procsWhenStriking], [], "and no row is handed it as theirs");
        assertEquals([...figures.procsWhenStruck], [], "at either end of the blow it rode");
    }
});

Deno.test("what a defence stopped is kept as the sum and as the defences it is made of", () => {
    const statistics = composeFightStatistics(decodeFightMessages([ABSORBED], null), new Map());
    const target = statistics.byCombatantId.get(-10000249);
    assertEquals(target?.damagePrevented, 545, "the one number a counter states");
    assertEquals(
        [...target?.damagePreventedByDefence ?? []],
        [["absorb", 545]],
        "and which of them",
    );
});

Deno.test("the hardest blow is the hardest blow, and no total can be read back to one", () => {
    const messages = [
        "467968=100.00;-10000249=99.69;+dmg=600;-dmg=500",
        "467968=100.00;-10000249=99.69;+dmg=900;-dmg=800",
        "467968=100.00;-10000249=99.69;+dmg=200;-dmg=100",
    ];
    const statistics = composeFightStatistics(decodeFightMessages(messages, null), new Map());
    assertEquals(statistics.byCombatantId.get(467968)?.damageDealtApplied, 1400, "three blows");
    assertEquals(
        statistics.byCombatantId.get(467968)?.damageDealtBlowLargest,
        800,
        "and the hardest",
    );
    assertEquals(
        statistics.byCombatantId.get(-10000249)?.damageTakenBlowLargest,
        800,
        "at both ends",
    );
});

Deno.test("every recording places what a blow carried, and places none of it twice", () => {
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        const events = decodeFightMessages(getRecordedPayloads(path).flat(), roster);
        const statistics = composeFightStatistics(events, composeTeamHeals(events, roster));
        for (const [id, figures] of statistics.byCombatantId) {
            let cut = 0;
            for (const [, amount] of figures.damagePreventedByDefence) cut += amount;
            assertEquals(cut, figures.damagePrevented, `${path} ${id} stops what its defences did`);
            assert(
                figures.damageDealtBlowLargest <= figures.damageDealtApplied,
                `${path} ${id}: one blow is never more than every blow`,
            );
            assert(
                figures.blowsCritical <= figures.blowsStruck,
                `${path} ${id}: a critical blow is a blow they struck`,
            );
        }
    }
});
