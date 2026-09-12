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
    assertLess,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { AssertionError } from "@std/assert/assertion-error";
import type { BattleEvent } from "@/src/core/battle-event.ts";
import { decodeFightMessages, MAXIMUM_MESSAGES } from "@/src/core/fight-decoder.ts";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import {
    BLOWS_GRANTED,
    getRecordedCombatants,
    getRecordedPayloads,
    readRecordingPaths,
} from "@/tests/recorded-fight.ts";
import {
    composeTurnStanding,
    getTurnOpener,
    NO_TURN_STANDING,
} from "@/src/core/fight-statistics.ts";

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
    const event = getOnlyAttack(decodeFightMessages([ABSORBED], null, BLOWS_GRANTED));
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
    const event = getOnlyAttack(decodeFightMessages([THIRD_BLOW], null, BLOWS_GRANTED));
    if (event.kind !== "attack") return;
    assertEquals(event.raw.length, 3, "two damage keys and the pair with no marker");
    assertEquals(event.raw[2], { element: "thirdatt", amount: 1168 }, "raw, by name");
    assertEquals(event.applied[0], { element: "dmg", amount: 0 }, "nothing landed, and says so");
    assertEquals(event.applied[1], { element: "thirdatt", amount: 59 }, "applied, by name");
    assertEquals(event.prevented, [{ defence: "blok", amount: 363 }], "a block stopped 363");
});

Deno.test("a key with no meaning yet leaves the rest of the message read", () => {
    const events = decodeFightMessages([UNREAD], null, BLOWS_GRANTED);
    assertEquals(events.length, 2, "what was read, and what could not be");
    const [used, unread] = events;
    assertStrictEquals(used?.kind, "skill-used", "the announcement is still an event");
    assertEquals(used.skillName, "Zdrowa atmosfera", "with the name the protocol stated");
    assertStrictEquals(unread?.kind, "unknown-message", "and the unread key is its own event");
    assertEquals(unread.unreadKeys, ["whatever_per"], "named, one entry per occurrence");
    assertEquals(unread.combatantIds, [469657], "with the end the grammar stated, once");
});

Deno.test("a message the grammar refuses is an event, not a silence", () => {
    const events = decodeFightMessages(["gracz;0;step"], null, BLOWS_GRANTED);
    assertEquals(events.length, 1, "one event");
    const event = events[0];
    assertStrictEquals(
        event?.kind,
        "unknown-message",
        "the refusal reaches the panel as a reading",
    );
    assertEquals(event.unreadKeys, [], "no key was reached, which is not a claim about keys");
    assertEquals(event.combatantIds, [], "and no end was read either");
    assertStrictEquals(event.unreadCause, "grammar-refused", "under the cause that left it so");
    // The message itself and not the parser's sentence about it: a maintainer chasing this can
    // put the message back through the parser, which the sentence would not have let them do.
    assertStrictEquals(event.message, "gracz;0;step", "carrying what was refused, to be looked at");
});

Deno.test("health moves on the key's own slot, and its sign is the key's", () => {
    const restored = decodeFightMessages([HEAL], null, BLOWS_GRANTED);
    assertEquals(restored.length, 1, "a heal alone in its message is one event");
    assertStrictEquals(restored[0]?.kind, "health-change", "and it is health moving");
    assertEquals(restored[0].combatantId, 482845, "on the actor, where the key states it");
    assertEquals(restored[0].amount, 99, "restored, so positive");
    assertEquals(restored[0].healthPercent, 100, "with where they stand once it is in");

    const lost = decodeFightMessages([POISON], null, BLOWS_GRANTED);
    assertStrictEquals(lost[0]?.kind, "health-change", "poison moves health too");
    assertEquals(lost[0].amount, -140, "and takes it, which is the key's own sign");
    assertEquals(lost[0].declared, [{ effect: "poison", amount: 14, text: "14" }], "not health");
});

Deno.test("a heal the client states as a loss is read as one", () => {
    const events = decodeFightMessages([NEGATIVE_HEAL], null, BLOWS_GRANTED);
    assertStrictEquals(events[0]?.kind, "health-change", "the key is still a health movement");
    assertEquals(events[0].amount, -92, "the sign the protocol wrote survives the key's own");
});

Deno.test("the one key of the family that means the target", () => {
    const events = decodeFightMessages([HEAL_TARGET], null, BLOWS_GRANTED);
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
    const events = decodeFightMessages([HEAL_TARGET], null, BLOWS_GRANTED);
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
    const events = decodeFightMessages([HEAL], null, BLOWS_GRANTED);
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
/**
 * `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: the announcement of a skill the
 * published table grants an attack to, and the two blows it sent.
 */
const GRANTED_ANNOUNCEMENT = "441390=100.00;-10000249=99.60;tspell=Podwójne trafienie;skillId=239";
const GRANTED_FIRST = "441390=100.00;-10000249=99.57;+dmgd=926;+dmgf=138;+dmgc=799;+resdmg=2;" +
    "-absorb=44;-absorbm=294;-dmgd=81;-dmgc=8";
const GRANTED_SECOND = "441390=100.00;-10000249=99.40;+pierce;+dmgd=809;+dmgf=105;+dmgc=799;" +
    "+resdmg=2;-absorb=283;-absorbm=814;-dmgd=526;-dmgf=7;-dmgc=21";
/** The same recording: the message the game sent straight after the pair, which is not a blow. */
const STEP_AFTER = "459132=98.49;0;step";
/**
 * ⚠️ **No recording carries the one skill the table grants two attacks to.** Its announcement is
 * written out here because only a grant of two puts a blow this decoder must refuse *inside* what
 * a standing still has left to spend — at a grant of one the budget runs out first, and the
 * condition being probed is never reached. The id is `frozen/blows-granted.ts`'s.
 */
const GRANTED_TWICE = "441390=100.00;-10000249=99.60;tspell=Demoniczne cięcie;skillId=283";
/**
 * `2026-08-12-tempest-grupa-vs-draugr-2-1786514810315-none.json`: an announcement the table cannot
 * be asked about, its one blow, and the announcer's own poison ticking straight after it.
 */
const UNBOUNDED_ANNOUNCEMENT = "-10000243;0;tspell=Kosa zastępcy";
const UNBOUNDED_BLOW = "-10000243=25.19;439807=69.90;-poison_lowdmg_per=13;+dmg=2385;" +
    "-blok=716;-dmg=1111";
const TICK_ON_THE_ANNOUNCER = "-10000243=25.11;0;poison=136,20";

Deno.test("an announcement is an event, and its id may be missing", () => {
    const events = decodeFightMessages([ANNOUNCEMENT], null, BLOWS_GRANTED);
    const used = events.filter((event) => event.kind === "skill-used");
    assertEquals(used.length, 1, "the announcement is read");
    assertStrictEquals(used[0]?.kind, "skill-used", "and it is a skill being used");
    assertEquals(used[0].skillName, "Struna płomienna", "by the name the protocol states");
    assertEquals(used[0].skillId, null, "with no id, which the game leaves out often enough");
    assertEquals(used[0].actorId, -10000249, "and the combatant who used it");
});

Deno.test("the glue is the client's, and the same actor is our condition", () => {
    const glued = decodeFightMessages([ANNOUNCEMENT, BLOW_AFTER], null, BLOWS_GRANTED);
    const attack = glued.find((event) => event.kind === "attack");
    assertStrictEquals(attack?.kind, "attack", "the blow after the announcement is read");
    assertEquals(attack.announced?.skillName, "Struna płomienna", "and carries what announced it");
    assertEquals(attack.announced?.actorId, -10000249, "with the announcer named");

    const apart = decodeFightMessages(
        [ANNOUNCEMENT_ELSEWHERE, BLOW_BY_ANOTHER],
        null,
        BLOWS_GRANTED,
    );
    const other = apart.find((event) => event.kind === "attack");
    assertStrictEquals(other?.kind, "attack", "somebody else's blow is read too");
    assertEquals(other.announced, null, "and takes no skill that was never theirs");
});

/**
 * ⚠️ **This read the opposite until 2026-09-12, and the sample is why.** `Struna płomienna`
 * announces with no id, and the published table is the **player's**, keyed by one — so there the
 * table cannot say how many blows the skill strikes, and the reach is the announcer's own run.
 * The corpus caught this skill striking twice three times over. **ADR 0078.**
 */
Deno.test("an announcement the table cannot be asked about reaches its own run", () => {
    const events = decodeFightMessages([ANNOUNCEMENT, BLOW_AFTER, BLOW_AFTER], null, BLOWS_GRANTED);
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 2, "both blows are read");
    assertEquals(attacks[0]?.announced?.skillName, "Struna płomienna", "the first rides it");
    assertEquals(attacks[1]?.announced?.skillName, "Struna płomienna", "and so does the second");
});

Deno.test("a message that is no blow ends a reach the table could not bound", () => {
    const events = decodeFightMessages(
        [ANNOUNCEMENT, BLOW_AFTER, STEP_AFTER, BLOW_AFTER],
        null,
        BLOWS_GRANTED,
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 2, "both blows are read");
    assertEquals(attacks[0]?.announced?.skillName, "Struna płomienna", "the first rides it");
    assertEquals(attacks[1]?.announced, null, "and a step between the two ends the standing");
});

Deno.test("another combatant's blow ends a reach the table could not bound", () => {
    const events = decodeFightMessages(
        [ANNOUNCEMENT, BLOW_AFTER, BLOW_BY_ANOTHER, BLOW_AFTER],
        null,
        BLOWS_GRANTED,
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 3, "all three blows are read");
    assertEquals(attacks[1]?.announced, null, "the blow that is not the announcer's takes none");
    assertEquals(attacks[2]?.announced, null, "and the standing does not step over it to reach on");
});

Deno.test("a name the game did not take from its table is read where one is named", () => {
    const events = decodeFightMessages([CUSTOM], null, BLOWS_GRANTED);
    const used = events.filter((event) => event.kind === "skill-used");
    assertStrictEquals(
        used[0]?.kind,
        "skill-used",
        "one combatant at both ends, so nobody is guessed at",
    );
    assertEquals(used[0].skillName, "Przelotna elfia kołysanka", "read like any other name");

    // No recording carries this shape; it probes the rule the register states for the key.
    const twoEnds = decodeFightMessages(
        ["47010=100.00;38205=100.00;tcustom=Kołysanka"],
        null,
        BLOWS_GRANTED,
    );
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
    const events = decodeFightMessages([AGAINST_NAMES], roster, BLOWS_GRANTED);
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
    const events = decodeFightMessages([AGAINST_NAMES], null, BLOWS_GRANTED);
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
    const events = decodeFightMessages([BLANK_ELEMENT], null, BLOWS_GRANTED);
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
    const events = decodeFightMessages([DECLARED_ON_BLOW], null, BLOWS_GRANTED);
    assertEquals(events.length, 1, "nothing was left unread");
    assertStrictEquals(events[0]?.kind, "attack", "the blow is the event");
    assertEquals(events[0].declared, [{ effect: "+taken_dmg", amount: 254, text: "254" }], "read");
    assertEquals(events[0].applied.length, 3, "beside the figures a total does count");
});

Deno.test("what an announcement states about its skill rides the announcement", () => {
    const events = decodeFightMessages([DECLARED_ON_SKILL], null, BLOWS_GRANTED);
    const used = events.find((event) => event.kind === "skill-used");
    assertStrictEquals(used?.kind, "skill-used", "the announcement is the event");
    assertEquals(used.declared.map((one) => one.effect), ["active_block_per", "combo-max"], "both");
    assertEquals(used.declared[0]?.amount, 15, "with the figure the protocol stated");
    assertEquals(events.filter((one) => one.kind === "unknown-message").length, 0, "nothing left");
});

Deno.test("a message about nobody's health is a declaration of its own", () => {
    const logged = decodeFightMessages([LOG_LINE], null, BLOWS_GRANTED);
    assertStrictEquals(logged[0]?.kind, "declaration", "a log line happens to nobody");
    assertEquals(logged[0].combatantId, null, "and names nobody");
    assertEquals(logged[0].declared[0]?.text, "Locha: zdobyto Skóra z dzika", "text, not a figure");
    assertEquals(
        logged[0].declared[0]?.amount,
        null,
        "which is not a number and is not read as one",
    );

    const stepped = decodeFightMessages([STEP_TAKEN], null, BLOWS_GRANTED);
    assertStrictEquals(stepped[0]?.kind, "declaration", "a step is a declaration too");
    assertEquals(stepped[0].combatantId, -255967, "and this one names whose it is");
    assertEquals(stepped[0].declared, [{ effect: "step", amount: null, text: null }], "no value");
});

Deno.test("a key read only while it states nothing goes unread once it states something", () => {
    const silent = decodeFightMessages(
        ["1=50.00;2=50.00;+dmg=10;-dmg=10;+legbon_holytouch"],
        null,
        BLOWS_GRANTED,
    );
    assertStrictEquals(silent[0]?.kind, "attack", "the blow is read");
    assertEquals(silent[0].declared[0]?.effect, "+legbon_holytouch", "and the flag beside it");

    // The client composes this key with a hole for a figure; no recording has ever filled it.
    const stated = decodeFightMessages(
        ["1=50.00;2=50.00;+dmg=10;-dmg=10;+legbon_holytouch=7"],
        null,
        BLOWS_GRANTED,
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
    const won = decodeFightMessages([WON], null, BLOWS_GRANTED);
    assertStrictEquals(won[0]?.kind, "fight-outcome", "the outcome is an event");
    assertEquals(won[0].result, "won", "of the side the key names");
    assertEquals(won[0].combatantNames, ["Gracz 1"], "by name, because the message states no id");

    const lost = decodeFightMessages([LOST], null, BLOWS_GRANTED);
    assertStrictEquals(lost[0]?.kind, "fight-outcome", "the other key is the other side");
    assertEquals(lost[0].result, "lost", "which lost");
    assertEquals(lost[0].combatantNames, ["Odyniec", "Odyniec", "Locha"], "each name on its own");
});

Deno.test("a fight nobody won is stated on the winners' key alone", () => {
    // No recording carries either shape: the register reads them off the client's own branch.
    const drawn = decodeFightMessages(["0;0;winner=?"], null, BLOWS_GRANTED);
    assertStrictEquals(drawn[0]?.kind, "fight-outcome", "the mark is read");
    assertEquals(drawn[0].result, "drawn", "as a fight nobody won");
    assertEquals(drawn[0].combatantNames, [], "naming nobody, which is the whole of what it says");

    const refused = decodeFightMessages(["0;0;loser=?"], null, BLOWS_GRANTED);
    assertStrictEquals(
        refused[0]?.kind,
        "unknown-message",
        "the same mark on the other key is not read",
    );
    assertEquals(refused.filter((one) => one.kind === "fight-outcome").length, 0, "no side of `?`");
});

/**
 * The escape arrives on a key of its own, and the client never reads that key's value — it takes
 * the name and the health percent off the actor slot instead. So both shapes are proved here:
 * neither is the one the material settles, because the material carries no escape at all.
 */
Deno.test("a fight an escape broke off is read on its own key, valued or bare", () => {
    const bare = decodeFightMessages(["500001=94.75;0;flee"], null, BLOWS_GRANTED);
    assertStrictEquals(bare[0]?.kind, "fight-outcome", "the bare key is an outcome");
    assertEquals(bare[0].result, "fled", "of a fight nobody finished");
    assertEquals(bare[0].combatantNames, [], "naming no side, because the key names none");
    assertEquals(bare.filter((one) => one.kind === "unknown-message").length, 0, "nothing unread");

    const valued = decodeFightMessages(["500001=94.75;0;flee=1"], null, BLOWS_GRANTED);
    assertStrictEquals(valued[0]?.kind, "fight-outcome", "and so is the valued one");
    assertEquals(valued[0].result, "fled", "which says the same thing");
    assertEquals(valued[0].combatantNames, [], "and names nobody either");
});

Deno.test("an escape beside a stated winner is still what the fight came to", () => {
    const both = decodeFightMessages(
        ["500001=94.75;0;flee", "0;0;winner=Gracz 1"],
        null,
        BLOWS_GRANTED,
    );
    const outcomes = both.filter((one) => one.kind === "fight-outcome");
    assertEquals(outcomes.length, 2, "both messages are read, and neither swallows the other");
    assertEquals(outcomes[0]?.result, "fled", "the escape as the escape");
    assertEquals(outcomes[1]?.result, "won", "and the side the protocol named as named");
});

/**
 * What stands behind the entry in `docs/protocol-keys.md`: the escape is read off the client's own
 * branch and the published help, and the material says nothing either way. A recording of one
 * would turn this red, which is the point — it is the day the entry gets a measurement.
 */
Deno.test("no recording carries an escape, which is why the register cites the client", () => {
    let fled = 0;
    let ended = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const payload of getRecordedPayloads(path)) {
            for (const event of decodeFightMessages(payload, roster, BLOWS_GRANTED)) {
                if (event.kind !== "fight-outcome") continue;
                ended += 1;
                if (event.result === "fled") fled += 1;
            }
        }
    }
    assert(ended > 0, "the walk reached the messages that state an ending");
    assertEquals(fled, 0, "and not one of them is an escape");
});

/**
 * The claim `docs/protocol-keys.md` files `-dmga` under, and the one the panel's word rests on:
 * the published help says the ordinary reductions do not reach this damage, and a protocol that
 * reports no reduction has no raw side to report either. A `+dmga` is therefore a finding rather
 * than a gap — it would mean something reduces the key after all, and the word would be wrong.
 * The applied count stands beside it so a walk that has stopped finding the element reddens too.
 */
Deno.test("the one element with no raw half still has an applied one", () => {
    let raw = 0;
    let applied = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const payload of getRecordedPayloads(path)) {
            for (const event of decodeFightMessages(payload, roster, BLOWS_GRANTED)) {
                if (event.kind !== "attack") continue;
                raw += event.raw.filter((one) => one.element === "dmga").length;
                applied += event.applied.filter((one) => one.element === "dmga").length;
            }
        }
    }
    assert(applied > 0, "the corpus states this element at all");
    assertEquals(raw, 0, "and never states a raw side for it");
});

/**
 * What `9f039ab` left open: `Zwykły cios` counts a blow the game announced nothing over, and the
 * one granted-attack effect that reaches the protocol at all is this pair. If it arrived as a blow
 * of its own the count would report one swing as two, so the claim the register makes of it —
 * fired **alongside** the ordinary attack — is the claim that keeps the figure honest, and this is
 * where it is re-earned rather than read.
 */
Deno.test("the extra attack rides an ordinary blow and never arrives as one", () => {
    let carried = 0;
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const payload of getRecordedPayloads(path)) {
            for (const event of decodeFightMessages(payload, roster, BLOWS_GRANTED)) {
                if (event.kind !== "attack") continue;
                const elements = [...event.raw, ...event.applied].map((one) => one.element);
                if (!elements.includes("thirdatt")) continue;
                carried += 1;
                assert(
                    elements.some((one) => one !== "thirdatt"),
                    "a blow rolling the extra attack states the ordinary one too",
                );
            }
        }
    }
    assert(carried > 0, "the corpus rolls the extra attack at all");
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
        if (event.result === "won" || event.result === "lost") {
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
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        for (const payload of getRecordedPayloads(path)) {
            const events = decodeFightMessages(payload, roster, BLOWS_GRANTED);
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
    const events = decodeFightMessages([TWO_HEALED], roster, BLOWS_GRANTED);
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
        readRecordingPaths().length * 2,
        "each fight ends once, twice over",
    );
});

/**
 * The bound both ways, which nothing drove until the constant was exported. A payload carrying a
 * whole fight is the shape it exists for, so the sample is one message repeated: what is measured
 * here is the length the decoder accepts, not what the messages say.
 */
Deno.test("a payload is decoded up to the stated bound, and refused past it", () => {
    const one = "0;0;txt=a";
    const full = new Array(MAXIMUM_MESSAGES).fill(one);
    const events = decodeFightMessages(full, null, BLOWS_GRANTED);
    assertEquals(events.length, MAXIMUM_MESSAGES, "a payload at the bound decodes whole");
    assertThrows(
        () => decodeFightMessages([...full, one], null, BLOWS_GRANTED),
        AssertionError,
        "a payload stays inside its stated bound",
    );
});

/**
 * The headroom, measured rather than written into the bound's own comment (**V5**). A recording
 * arriving whose opening call is nearer the bound than this reddens here, which is the moment the
 * figure would otherwise have to be re-earned by hand.
 */
Deno.test("no recording carries a payload anywhere near the bound", () => {
    let longest = 0;
    for (const path of readRecordingPaths()) {
        for (const payload of getRecordedPayloads(path)) {
            if (payload.length > longest) longest = payload.length;
        }
    }
    assert(longest > 0, "the recordings carry messages at all");
    assertLess(longest * 8, MAXIMUM_MESSAGES, "and the widest of them is far inside the bound");
});

/**
 * ⚠️ **The budget is spent on the announcer's own blows and on nothing else.** The three cases
 * below are the whole of what ends a standing early, and each is written out because no recording
 * puts the announcement of a granted skill in front of any of them. **ADR 0078.**
 */
Deno.test("a granted announcement reaches the second blow, and stops there", () => {
    const events = decodeFightMessages(
        [GRANTED_ANNOUNCEMENT, GRANTED_FIRST, GRANTED_SECOND, BLOW_AFTER],
        null,
        BLOWS_GRANTED,
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 3, "three blows are read");
    assertEquals(attacks[0]?.announced?.skillName, "Podwójne trafienie", "the first is announced");
    assertEquals(attacks[1]?.announced?.skillName, "Podwójne trafienie", "and so is the second");
    assertEquals(attacks[2]?.announced, null, "the third is past what the table granted");
});

Deno.test("a message that is no blow ends a standing the table paid for", () => {
    const events = decodeFightMessages(
        [GRANTED_ANNOUNCEMENT, GRANTED_FIRST, STEP_AFTER, GRANTED_SECOND],
        null,
        BLOWS_GRANTED,
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 2, "both blows are read");
    assertEquals(attacks[0]?.announced?.skillName, "Podwójne trafienie", "the first is announced");
    assertEquals(attacks[1]?.announced, null, "and a step between the two ends the standing");
});

Deno.test("another combatant's blow ends a standing rather than being skipped over", () => {
    const events = decodeFightMessages(
        [GRANTED_TWICE, GRANTED_FIRST, BLOW_BY_ANOTHER, GRANTED_SECOND],
        null,
        BLOWS_GRANTED,
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 3, "all three blows are read");
    assertEquals(attacks[0]?.announced?.skillName, "Demoniczne cięcie", "the first rides it");
    assertEquals(attacks[1]?.announced, null, "the blow that is not the announcer's takes none");
    assertEquals(attacks[2]?.announced, null, "and the standing does not step over it to reach on");
});

Deno.test("a grant of two reaches three blows of the announcer's own, and no fourth", () => {
    const events = decodeFightMessages(
        [GRANTED_TWICE, GRANTED_FIRST, GRANTED_SECOND, GRANTED_FIRST, GRANTED_SECOND],
        null,
        BLOWS_GRANTED,
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 4, "four blows are read");
    assertEquals(attacks[2]?.announced?.skillName, "Demoniczne cięcie", "the third still rides it");
    assertEquals(attacks[3]?.announced, null, "and the fourth is past what the table granted");
});

Deno.test("a table granting nothing leaves the announcement reaching one message", () => {
    const events = decodeFightMessages(
        [GRANTED_ANNOUNCEMENT, GRANTED_FIRST, GRANTED_SECOND],
        null,
        new Map(),
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(
        attacks[0]?.announced?.skillName,
        "Podwójne trafienie",
        "the first still rides it",
    );
    assertEquals(attacks[1]?.announced, null, "and with no grant behind it the second does not");
});

/**
 * ⚠️ **Past the message the client glues it to, a standing reaches a blow and nothing else.** A
 * reach the table could not bound outlives its own blows otherwise, and lands on whatever the
 * announcer does next: this tick picked up `Kosa zastępcy` while the rule was being written. No
 * figure reads it — the amount is a loss, and only the restoring branch asks what announced it —
 * so nothing on screen would have moved, and a heal standing there would have been credited to
 * the skill. **ADR 0078.**
 */
Deno.test("a movement standing behind a reach takes no skill from it", () => {
    const events = decodeFightMessages(
        [UNBOUNDED_ANNOUNCEMENT, UNBOUNDED_BLOW, TICK_ON_THE_ANNOUNCER],
        null,
        BLOWS_GRANTED,
    );
    const struck = events.find((event) => event.kind === "attack");
    assertEquals(struck?.announced?.skillName, "Kosa zastępcy", "the blow rides the announcement");
    const moved = events.find((event) => event.kind === "health-change");
    assertStrictEquals(moved?.kind, "health-change", "the tick on the announcer is read");
    assertEquals(moved.announced, null, "and takes no skill for standing behind one");
});

/**
 * ⚠️ **A bound nothing ever reaches is a number rather than a bound.** The longest run of an
 * announcer's own blows over `captures/` is two, so the material never meets
 * `MAXIMUM_BLOWS_GRANTED` and only a payload written by hand can show it binding at all.
 */
Deno.test("a reach the table could not bound still stops where the bound says", () => {
    const nine = Array.from({ length: 9 }, () => BLOW_AFTER);
    const events = decodeFightMessages([ANNOUNCEMENT, ...nine], null, BLOWS_GRANTED);
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 9, "every blow is read");
    assertEquals(attacks[7]?.announced?.skillName, "Struna płomienna", "the eighth still rides it");
    assertEquals(attacks[8]?.announced, null, "and the ninth is past what the bound allows");
});

/**
 * The claim above is a property of this corpus under this rule, not a theorem: a blow past what
 * the table granted would still stand mid-strike under no announcement. No recording carries one
 * — 0 runs of three after an announcement — so it is written out rather than left unsaid.
 */
Deno.test("a blow past what the table granted takes no skill, and opens no turn", () => {
    const events = decodeFightMessages(
        [GRANTED_ANNOUNCEMENT, GRANTED_FIRST, GRANTED_SECOND, GRANTED_SECOND],
        null,
        BLOWS_GRANTED,
    );
    let standing = NO_TURN_STANDING;
    const openers: (number | null)[] = [];
    for (const event of events) {
        openers.push(event.kind === "attack" ? getTurnOpener(event, standing) : null);
        standing = composeTurnStanding(event, standing);
    }
    const attacks = events.filter((event) => event.kind === "attack");
    assertEquals(attacks.length, 3, "three blows are read");
    assertEquals(attacks[2]?.announced, null, "the third is past what the table granted");
    assertStrictEquals(openers.at(-1), null, "and it opens no turn, so the two readings disagree");
});
