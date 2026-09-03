/**
 * The first decoding step, over the blows the recordings carry.
 *
 * Every sample is a transcript from the recording named beside it. The corpus test states what
 * holds over all of them, which is where a key family that stops being read would show.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertStrictEquals,
    assertStringIncludes,
} from "@std/assert";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
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
 * A probe, and it has to be: no recording carries an unread key any more. The shape is a real
 * announcement from `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json` with a key the
 * register has never
 * seen put beside it, which is what the next protocol change will look like.
 */
const UNREAD = "469657=87.63;469657=87.63;tspell=Zdrowa atmosfera;skillId=79;whatever_per=30";
/**
 * `2026-08-12-experimental-tancerz-vs-wojownik-1781609507010-none.json`: the pair the family rule
 * cannot reach.
 */
const THIRD_BLOW = "114881=80.80;195782=98.67;+dmg=1210;+dmgo=896;+thirdatt=1168;+acdmg=90;" +
    "-blok=363;-dmg=0;-thirdatt=59";
/**
 * `2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json`: health moving with nobody at the
 * other end.
 */
const HEAL = "482845=100.00;0;heal=99";
const POISON = "-255967=19.27;0;poison=140,14";
/**
 * `2026-08-12-tempest-grupa-vs-hildur-1-1786514810315-none.json`: the client's own `heal` stating a
 * loss.
 */
const NEGATIVE_HEAL = "467968=99.52;0;heal=-92";
/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: the one key read off the target
 * slot. Chosen from
 * the 41 of its 117 occurrences whose two ends are different people — on the other 76 a reader
 * that took the actor would pass, which is what a first draft of this test did.
 */
const HEAL_TARGET = "469657=95.78;445202=100.00;tspell=Leczenie ran;skillId=78;heal_target=11733";

function getOnlyAttack(events: readonly BattleEvent[]): BattleEvent {
    assertEquals(events.length, 1, "the message decoded to one event");
    const event = events[0];
    assertExists(event, "a list of one has a first member");
    assertEquals(event.kind, "attack", "and that event is a blow");
    return event;
}

Deno.test("a blow reads as raw, applied, and what a defence stopped", () => {
    const event = getOnlyAttack(decodeFightMessages([ABSORBED], null));
    if (event.kind !== "attack") return;
    assertEquals(event.actorId, 467968, "the actor is the message's own");
    assertEquals(event.targetHealthPercent, 99.69, "the target's health rides the blow");
    assertEquals(event.raw, [{ element: "dmgd", amount: 1557 }], "before reduction");
    assertEquals(event.applied, [{ element: "dmgd", amount: 1012 }], "after it");
    assertEquals(event.prevented, [{ defence: "absorb", amount: 545 }], "and what stopped 545");
    assertEquals(event.destroyed, [{ statistic: "acdmg", amount: 16 }], "armour is not damage");
    assertEquals(event.procs, ["+pierce"], "a proc states no figure");
});

Deno.test("the third blow is read by name, and a zero is a reading", () => {
    const event = getOnlyAttack(decodeFightMessages([THIRD_BLOW], null));
    if (event.kind !== "attack") return;
    assertEquals(event.raw.length, 3, "two damage keys and the pair with no marker");
    assertEquals(event.raw[2], { element: "thirdatt", amount: 1168 }, "raw, by name");
    assertEquals(event.applied[0], { element: "dmg", amount: 0 }, "nothing landed, and says so");
    assertEquals(event.applied[1], { element: "thirdatt", amount: 59 }, "applied, by name");
    assertEquals(event.prevented, [{ defence: "blok", amount: 363 }], "a block stopped 363");
});

Deno.test("a key with no meaning yet leaves the rest of the message read", () => {
    const events = decodeFightMessages([UNREAD], null);
    assertEquals(events.length, 2, "what was read, and what could not be");
    const [used, unread] = events;
    assertStrictEquals(used?.kind, "skill-used", "the announcement is still an event");
    assertEquals(used.skillName, "Zdrowa atmosfera", "with the name the protocol stated");
    assertStrictEquals(unread?.kind, "unknown-message", "and the unread key is its own event");
    assertEquals(unread.unreadKeys, ["whatever_per"], "named, one entry per occurrence");
    assertEquals(unread.combatantIds, [469657], "with the end the grammar stated, once");
});

Deno.test("a message the grammar refuses is an event, not a silence", () => {
    const events = decodeFightMessages(["gracz;0;step"], null);
    assertEquals(events.length, 1, "one event");
    const event = events[0];
    assertStrictEquals(
        event?.kind,
        "unknown-message",
        "the refusal reaches the panel as a reading",
    );
    assertEquals(event.unreadKeys, [], "no key was reached, which is not a claim about keys");
    assertEquals(event.combatantIds, [], "and no end was read either");
    assertStringIncludes(event.reason, "side", "the reason names the half that failed");
});

Deno.test("health moves on the key's own slot, and its sign is the key's", () => {
    const restored = decodeFightMessages([HEAL], null);
    assertEquals(restored.length, 1, "a heal alone in its message is one event");
    assertStrictEquals(restored[0]?.kind, "health-change", "and it is health moving");
    assertEquals(restored[0].combatantId, 482845, "on the actor, where the key states it");
    assertEquals(restored[0].amount, 99, "restored, so positive");
    assertEquals(restored[0].healthPercent, 100, "with where they stand once it is in");

    const lost = decodeFightMessages([POISON], null);
    assertStrictEquals(lost[0]?.kind, "health-change", "poison moves health too");
    assertEquals(lost[0].amount, -140, "and takes it, which is the key's own sign");
    assertEquals(lost[0].declared, [{ effect: "poison", amount: 14, text: "14" }], "not health");
});

Deno.test("a heal the client states as a loss is read as one", () => {
    const events = decodeFightMessages([NEGATIVE_HEAL], null);
    assertStrictEquals(events[0]?.kind, "health-change", "the key is still a health movement");
    assertEquals(events[0].amount, -92, "the sign the protocol wrote survives the key's own");
});

Deno.test("the one key of the family that means the target", () => {
    const events = decodeFightMessages([HEAL_TARGET], null);
    const restored = events.filter((event) => event.kind === "health-change");
    assertEquals(restored.length, 1, "one figure moved health");
    assertStrictEquals(restored[0]?.kind, "health-change", "and it is the healing");
    assertEquals(restored[0].combatantId, 445202, "read off the target slot, not the actor");
    assertEquals(restored[0].amount, 11733, "restored");
    assertEquals(restored[0].healthPercent, 100, "with where the healed stands, not the healer");
    const used = events.filter((event) => event.kind === "skill-used");
    assertEquals(used.length, 1, "the announcement beside it is an event of its own");
    assertEquals(events.filter((one) => one.kind === "unknown-message").length, 0, "nothing left");
});

/**
 * The announcement is in the same breath as the figure, and reading only the message before loses
 * it: `heal_target` is charged to the announcement's actor (`docs/protocol-keys.md`), so an
 * announcement nothing picks up leaves the health with no giver and no name.
 */
Deno.test("a figure stated on an announcement rides that announcement, not the one before", () => {
    const events = decodeFightMessages([HEAL_TARGET], null);
    const restored = events.find((event) => event.kind === "health-change");
    assertStrictEquals(restored?.kind, "health-change", "the healing is read");
    assertExists(restored.announced, "and it carries the announcement it was stated on");
    assertEquals(restored.announced.skillName, "Leczenie ran", "by the name the game wrote");
    assertEquals(restored.announced.skillId, 78, "with the id beside it");
    assertEquals(restored.announced.actorId, 469657, "and the healer, off the actor slot");
    assertEquals(restored.combatantId, 445202, "who is not the combatant the health reached");
});

/** The other side of it: a message announcing nothing carries no announcement of its own. */
Deno.test("a figure on a message that announces nothing rides nothing", () => {
    const events = decodeFightMessages([HEAL], null);
    const restored = events.find((event) => event.kind === "health-change");
    assertStrictEquals(restored?.kind, "health-change", "the healing is read all the same");
    assertEquals(restored.announced, null, "and states no skill, because the message states none");
});

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: an announcement with no id, and the
 * blow after it.
 */
const ANNOUNCEMENT = "-10000249;0;tspell=Struna płomienna";
const BLOW_AFTER = "-10000249=100.00;445202=87.34;+dmgf=2471;+dmgc=4967;+acdmg=50;-blok=2231;" +
    "-legbon_facade=20;-dmgf=829;-dmgc=2193";
/** The same recording: an announcement whose next message is somebody else's blow entirely. */
const ANNOUNCEMENT_ELSEWHERE = "441390=100.00;441390=100.00;tspell=Podwójny dech;skillId=89;" +
    "aura-sa_per=20";
const BLOW_BY_ANOTHER = "467968=100.00;-10000249=99.41;+dmgd=1553;-absorb=354;+injure=98;-dmgd=658";
/**
 * `2026-08-25-luvia-grupa-vs-draugr-none-none.json`: a name the game did not take from its skill
 * table.
 */
const CUSTOM = "47010=100.00;47010=100.00;tcustom=Przelotna elfia kołysanka;healall_per=10";

Deno.test("an announcement is an event, and its id may be missing", () => {
    const events = decodeFightMessages([ANNOUNCEMENT], null);
    const used = events.filter((event) => event.kind === "skill-used");
    assertEquals(used.length, 1, "the announcement is read");
    assertStrictEquals(used[0]?.kind, "skill-used", "and it is a skill being used");
    assertEquals(used[0].skillName, "Struna płomienna", "by the name the protocol states");
    assertEquals(used[0].skillId, null, "with no id, which the game leaves out often enough");
    assertEquals(used[0].actorId, -10000249, "and the combatant who used it");
});

Deno.test("the glue is the client's, and the same actor is our condition", () => {
    const glued = decodeFightMessages([ANNOUNCEMENT, BLOW_AFTER], null);
    const attack = glued.find((event) => event.kind === "attack");
    assertStrictEquals(attack?.kind, "attack", "the blow after the announcement is read");
    assertEquals(attack.announced?.skillName, "Struna płomienna", "and carries what announced it");
    assertEquals(attack.announced?.actorId, -10000249, "with the announcer named");

    const apart = decodeFightMessages([ANNOUNCEMENT_ELSEWHERE, BLOW_BY_ANOTHER], null);
    const other = apart.find((event) => event.kind === "attack");
    assertStrictEquals(other?.kind, "attack", "somebody else's blow is read too");
    assertEquals(other.announced, null, "and takes no skill that was never theirs");
});

Deno.test("an announcement reaches only the message straight after it", () => {
    const events = decodeFightMessages([ANNOUNCEMENT, BLOW_AFTER, BLOW_AFTER], null);
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 2, "both blows are read");
    assertStrictEquals(attacks[0]?.kind, "attack", "the first rides the announcement");
    assertStrictEquals(attacks[1]?.kind, "attack", "the second is its own");
    assertEquals(attacks[1].announced, null, "the glue does not carry past one message");
});

Deno.test("a name the game did not take from its table is read where one is named", () => {
    const events = decodeFightMessages([CUSTOM], null);
    const used = events.filter((event) => event.kind === "skill-used");
    assertStrictEquals(
        used[0]?.kind,
        "skill-used",
        "one combatant at both ends, so nobody is guessed at",
    );
    assertEquals(used[0].skillName, "Przelotna elfia kołysanka", "read like any other name");

    // No recording carries this shape; it probes the rule the register states for the key.
    const twoEnds = decodeFightMessages(["47010=100.00;38205=100.00;tcustom=Kołysanka"], null);
    assertEquals(twoEnds.filter((event) => event.kind === "skill-used").length, 0, "not read");
    const unread = twoEnds.find((event) => event.kind === "unknown-message");
    assertStrictEquals(unread?.kind, "unknown-message", "it goes back to unread instead");
    assertEquals(unread.unreadKeys, ["tcustom"], "naming the key, so the panel can say which");
});

/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: one blow stating ten figures
 * against ten names. The
 * message's own target is `Gracz 4`; the other nine are named here and nowhere else.
 */
const AGAINST_NAMES = "-10000249=99.57;445202=36.65;-poison_lowdmg_per=10;" +
    "+oth_dmg=8570,g,Gracz 4(36.65%);-poison_lowdmg_per=10;+oth_dmg=8868,g,Gracz 10(70.85%)";
/**
 * `2026-08-15-tempest-grupa-vs-draugr-1-1786514810315-none.json`: the element member written blank.
 */
const BLANK_ELEMENT = "-10000542=2.12;439807=0.00;+oth_dmg=2579, ,Gracz 1(8.97%)";
const HILDUR = "captures/2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json";

Deno.test("damage stated against a name reaches the person it names", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(HILDUR));
    const events = decodeFightMessages([AGAINST_NAMES], roster);
    const hits = events.filter((event) => event.kind === "damage-to-named-combatant");
    assertEquals(hits.length, 2, "each name carries its own figure");
    assertStrictEquals(
        hits[0]?.kind,
        "damage-to-named-combatant",
        "the first is the message's own target",
    );
    assertEquals(hits[0].targetId, 445202, "which the roster resolves like any other name");
    assertStrictEquals(
        hits[1]?.kind,
        "damage-to-named-combatant",
        "the second is somebody else entirely",
    );
    assertEquals(hits[1].targetName, "Gracz 10", "named here and nowhere else in the message");
    assertEquals(hits[1].targetId, 475890, "and put on that combatant, not on the blow's target");
    assertEquals(hits[1].targetHealthPercent, 70.85, "with where the named combatant stands");
    assertEquals(hits[1].damage, { element: "dmgg", amount: 8868 }, "already reduced, no pair");
});

Deno.test("a name nothing can resolve keeps its figure and says whose it is not", () => {
    const events = decodeFightMessages([AGAINST_NAMES], null);
    const hits = events.filter((event) => event.kind === "damage-to-named-combatant");
    assertStrictEquals(
        hits[0]?.kind,
        "damage-to-named-combatant",
        "the figure is read without a roster",
    );
    assertEquals(hits[0].targetId, null, "and lands on nobody rather than on a guess");
    assertEquals(hits[0].targetName, "Gracz 4", "while the name the game stated is kept");
});

Deno.test("a blank element is the plain one, not an element of its own", () => {
    const events = decodeFightMessages([BLANK_ELEMENT], null);
    const hits = events.filter((event) => event.kind === "damage-to-named-combatant");
    assertStrictEquals(hits[0]?.kind, "damage-to-named-combatant", "the figure is read");
    assertEquals(hits[0].damage.element, "dmg", "the same element the family's own keys carry");
});

/**
 * `2026-08-12-tempest-grupa-vs-draugr-1-1786514810315-none.json`: a blow with a figure no total
 * counts beside it.
 */
const DECLARED_ON_BLOW = "477718=100.00;-10000234=95.59;+dmgd=924;+dmgc=766;+acdmg=18;" +
    "+taken_dmg=254;-dmgd=291;-dmgc=295;-dmga=254";
/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: what an announcement states about
 * its skill.
 */
const DECLARED_ON_SKILL = "445202=81.04;445202=81.04;tspell=Osłona tarczą;skillId=206;" +
    "active_block_per=15;heal_target=334;combo-max=1";
/**
 * `2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json`: a line for the client's own log,
 * and a step.
 */
const LOG_LINE = "0;0;txt=Locha: zdobyto Skóra z dzika";
const STEP_TAKEN = "-255967=100.00;0;step";

Deno.test("what no total counts rides the blow it was stated on", () => {
    const events = decodeFightMessages([DECLARED_ON_BLOW], null);
    assertEquals(events.length, 1, "nothing was left unread");
    assertStrictEquals(events[0]?.kind, "attack", "the blow is the event");
    assertEquals(events[0].declared, [{ effect: "+taken_dmg", amount: 254, text: "254" }], "read");
    assertEquals(events[0].applied.length, 3, "beside the figures a total does count");
});

Deno.test("what an announcement states about its skill rides the announcement", () => {
    const events = decodeFightMessages([DECLARED_ON_SKILL], null);
    const used = events.find((event) => event.kind === "skill-used");
    assertStrictEquals(used?.kind, "skill-used", "the announcement is the event");
    assertEquals(used.declared.map((one) => one.effect), ["active_block_per", "combo-max"], "both");
    assertEquals(used.declared[0]?.amount, 15, "with the figure the protocol stated");
    assertEquals(events.filter((one) => one.kind === "unknown-message").length, 0, "nothing left");
});

Deno.test("a message about nobody's health is a declaration of its own", () => {
    const logged = decodeFightMessages([LOG_LINE], null);
    assertStrictEquals(logged[0]?.kind, "declaration", "a log line happens to nobody");
    assertEquals(logged[0].combatantId, null, "and names nobody");
    assertEquals(logged[0].declared[0]?.text, "Locha: zdobyto Skóra z dzika", "text, not a figure");
    assertEquals(
        logged[0].declared[0]?.amount,
        null,
        "which is not a number and is not read as one",
    );

    const stepped = decodeFightMessages([STEP_TAKEN], null);
    assertStrictEquals(stepped[0]?.kind, "declaration", "a step is a declaration too");
    assertEquals(stepped[0].combatantId, -255967, "and this one names whose it is");
    assertEquals(stepped[0].declared, [{ effect: "step", amount: null, text: null }], "no value");
});

Deno.test("a key read only while it states nothing goes unread once it states something", () => {
    const silent = decodeFightMessages(["1=50.00;2=50.00;+dmg=10;-dmg=10;+legbon_holytouch"], null);
    assertStrictEquals(silent[0]?.kind, "attack", "the blow is read");
    assertEquals(silent[0].declared[0]?.effect, "+legbon_holytouch", "and the flag beside it");

    // The client composes this key with a hole for a figure; no recording has ever filled it.
    const stated = decodeFightMessages(
        ["1=50.00;2=50.00;+dmg=10;-dmg=10;+legbon_holytouch=7"],
        null,
    );
    const unread = stated.find((event) => event.kind === "unknown-message");
    assertStrictEquals(unread?.kind, "unknown-message", "a figure arriving there is not read");
    assertEquals(unread.unreadKeys, ["+legbon_holytouch"], "it is reported, loudly");
});

/**
 * `2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json`: how that fight ended, on the two
 * keys it takes.
 */
const WON = "0;0;winner=Gracz 1";
const LOST = "0;0;loser=Odyniec, Odyniec, Locha";

Deno.test("a fight ends on two keys, each naming its own side", () => {
    const won = decodeFightMessages([WON], null);
    assertStrictEquals(won[0]?.kind, "fight-outcome", "the outcome is an event");
    assertEquals(won[0].result, "won", "of the side the key names");
    assertEquals(won[0].combatantNames, ["Gracz 1"], "by name, because the message states no id");

    const lost = decodeFightMessages([LOST], null);
    assertStrictEquals(lost[0]?.kind, "fight-outcome", "the other key is the other side");
    assertEquals(lost[0].result, "lost", "which lost");
    assertEquals(lost[0].combatantNames, ["Odyniec", "Odyniec", "Locha"], "each name on its own");
});

Deno.test("a fight nobody won is stated on the winners' key alone", () => {
    // No recording carries either shape: the register reads them off the client's own branch.
    const drawn = decodeFightMessages(["0;0;winner=?"], null);
    assertStrictEquals(drawn[0]?.kind, "fight-outcome", "the mark is read");
    assertEquals(drawn[0].result, "drawn", "as a fight nobody won");
    assertEquals(drawn[0].combatantNames, [], "naming nobody, which is the whole of what it says");

    const refused = decodeFightMessages(["0;0;loser=?"], null);
    assertStrictEquals(
        refused[0]?.kind,
        "unknown-message",
        "the same mark on the other key is not read",
    );
    assertEquals(refused.filter((one) => one.kind === "fight-outcome").length, 0, "no side of `?`");
});

interface CorpusTally {
    attacks: number;
    moved: number;
    announced: number;
    byName: number;
    resolved: number;
    restored: number;
    unsized: number;
    declared: number;
    turnsLost: number;
    outcomes: number;
    glued: number;
    unread: number;
}

/** What must hold of one event, whatever it is, asserted where the event is counted. */
function countEvent(tally: CorpusTally, event: BattleEvent, path: string): void {
    if (event.kind === "unknown-message") {
        tally.unread += 1;
        return;
    }
    if (event.kind === "health-change") {
        tally.moved += 1;
        assert(event.source.length > 0, `${path}: a movement with no key`);
        assertExists(event.combatantId, `${path}: health moved for nobody`);
        return;
    }
    if (event.kind === "damage-to-named-combatant") {
        tally.byName += 1;
        assert(event.targetName.length > 0, `${path}: a figure against no name`);
        if (event.targetId !== null) tally.resolved += 1;
        return;
    }
    if (event.kind === "fight-outcome") {
        tally.outcomes += 1;
        assert(event.combatantNames.every((one) => one.length > 0), `${path}: an unnamed member`);
        if (event.result !== "drawn") {
            assert(event.combatantNames.length > 0, `${path}: a side with no member`);
        }
        return;
    }
    if (event.kind === "healing-to-named-combatant") {
        tally.restored += 1;
        assert(event.amount >= 0, `${path}: healing that took health away`);
        assert(event.targetName.length > 0, `${path}: healing against no name`);
        return;
    }
    if (event.kind === "declaration") {
        tally.declared += 1;
        assert(event.declared.length > 0, `${path}: a declaration stating nothing`);
        return;
    }
    if (event.kind === "turn-lost") {
        tally.turnsLost += 1;
        assertExists(event.combatantId, `${path}: a turn lost by nobody the roster holds`);
        return;
    }
    if (event.kind === "unaccounted-health") {
        tally.unsized += 1;
        assertExists(event.declaredShare, `${path}: a share stated as nothing`);
        assertExists(event.combatantId, `${path}: a cast nobody made`);
        return;
    }
    if (event.kind === "skill-used") {
        tally.announced += 1;
        assert(event.skillName.length > 0, `${path}: an announcement naming nothing`);
        return;
    }
    tally.attacks += 1;
    if (event.announced !== null) {
        tally.glued += 1;
        assertEquals(event.announced.actorId, event.actorId, `${path}: another's skill`);
    }
    assertEquals(event.raw.length > 0, event.applied.length > 0, `${path}: raw alone`);
    if (event.procs.length > 0) assert(event.raw.length > 0, `${path}: a proc rode nothing`);
}

function getCorpusTally(): CorpusTally {
    const tally: CorpusTally = {
        attacks: 0,
        moved: 0,
        announced: 0,
        byName: 0,
        resolved: 0,
        restored: 0,
        unsized: 0,
        declared: 0,
        turnsLost: 0,
        outcomes: 0,
        glued: 0,
        unread: 0,
    };
    for (const path of getRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const payload of getRecordedPayloads(path)) {
            const events = decodeFightMessages(payload, roster);
            assert(events.length >= payload.length, `${path}: a message decoded to nothing`);
            for (const event of events) countEvent(tally, event, path);
        }
    }
    return tally;
}

/**
 * `2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none.json`: one group blow dropping two
 * holders below the
 * threshold at once. A reader counting messages rather than segments loses the second.
 */
const TWO_HEALED = "-10005001=74.30;466747=0.00;legbon_lastheal=10564,Gracz 8(42.00%);" +
    "+oth_dmg=9315,g,Gracz 8(42.00%);legbon_lastheal=10550,Gracz 5(44.00%);" +
    "+oth_dmg=9613,g,Gracz 5(44.00%);+oth_dmg=9613,g,Gracz 9(0.00%)";
const AUTO = "captures/2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none.json";

Deno.test("healing stated by name is read from the value, never from a slot", () => {
    const roster = composeCombatantRoster(getRecordedCombatants(AUTO));
    const events = decodeFightMessages([TWO_HEALED], roster);
    const restored = events.filter((event) => event.kind === "healing-to-named-combatant");
    assertEquals(restored.length, 2, "both holders are healed in the one message");
    assertStrictEquals(restored[0]?.kind, "healing-to-named-combatant", "the first is read");
    assertEquals(restored[0].amount, 10564, "with the figure the value states first");
    assertEquals(restored[0].targetName, "Gracz 8", "and the name it states second");
    assertEquals(restored[0].targetHealthPercent, 42, "where that combatant stands after it");
    assertExists(restored[0].targetId, "which the roster resolves");
    assertStrictEquals(
        restored[1]?.kind,
        "healing-to-named-combatant",
        "and the second is not lost",
    );
    assertEquals(restored[1].targetName, "Gracz 5", "who is somebody else again");
    assert(
        restored[0].targetId !== 466747 && restored[1].targetId !== 466747,
        "neither is the combatant either slot of the message names",
    );
});

Deno.test("every message in every recording decodes, and the pairs hold", () => {
    const tally = getCorpusTally();
    assert(tally.attacks > 0, "the recordings carry blows");
    assert(tally.moved > 0, "and health moving outside them");
    assert(tally.announced > 0, "and skills announced beside both");
    assert(tally.glued > 0, "and blows the game itself glued to a skill");
    assert(tally.byName > 0, "and damage stated against a name");
    assert(tally.restored > 0, "and healing stated the same way");
    assert(tally.unsized > 0, "and a share stated about a whole side, which no row can carry");
    assert(tally.declared > 0, "and messages that state something and report nothing");
    assert(tally.resolved > tally.byName / 2, "most of which a roster can put on somebody");
    // Every key `captures/` carries is read now, so the panel says nothing is missing — which is
    // a claim about the material rather than about the decoder, and the probes above are what
    // hold the other half.
    assertEquals(tally.unread, 0, "and nothing in the recordings goes unread any more");
    assertEquals(
        tally.outcomes,
        getRecordingPaths().length * 2,
        "each fight ends once, twice over",
    );
});
