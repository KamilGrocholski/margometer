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
    assertInstanceOf,
    AssertionError,
    assertLess,
    assertNotInstanceOf,
    assertStrictEquals,
    assertThrows,
} from "@std/assert";
import { BATTLE_EVENT, type BattleEvent } from "#/src/core/battle-event.ts";
import {
    type CombatantRoster,
    COMBATANTS_MAXIMUM,
    indexCombatantRoster,
} from "#/src/core/combatant-roster.ts";
import {
    decodeMessage,
    decodePayloadMessages,
    type DecoderTables,
    EndUnreadable,
    HEALTH_CHANGE_MEMBERS_MAXIMUM,
    MESSAGE_END,
    MESSAGE_PARTS_MAXIMUM,
    MESSAGES_MAXIMUM,
    NAME_LENGTH_MAXIMUM,
    UnreadMessage,
} from "#/src/core/fight-decoder.ts";
import { composeTurnStanding, lookupTurnOpener, NO_TURN_STANDING } from "#/src/core/turn-clock.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import {
    decodeRecordedFight,
    lookupRecordedFight,
    readRecordedFights,
} from "#/tests/recorded-fights.ts";

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

const NO_GRANTS: DecoderTables = { blowsGrantedBySkillId: new Map() };

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
/**
 * `2026-09-11-luvia-grupa-vs-amaimon-Cl9U89Zr-0.15.0.json`, the one recording carrying
 * `+woundpoison` as the set stood 2026-09-11: a deep wound something weakened, announced with a
 * percentage where an unweakened one is announced with nothing at all.
 */
const WEAKENED_WOUND =
    "28940=98.72;-10016678=97.30;+dmgd=1139;+acdmg=16;+woundpoison=50;+taken_dmg=239;" +
    "-dmgd=272;-dmga=239";

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
 * `2026-10-04-tempest-grupa-vs-umibozu-DHSqC3Uh-0.22.0.json`: a monster's announcement with no id,
 * the heal it gave itself on the message glued to it, and its blow after that. The game numbers one
 * turn for the three.
 */
const SELF_HEALING_ANNOUNCEMENT = "-10007253;0;tspell=Kuya Kuya";
const SELF_HEAL = "-10007253=95.94;439765=58.51;npc_heal=29631";
const BLOW_AFTER_SELF_HEAL = "-10007253=95.94;439765=55.15;-poison_lowdmg_per=20;+dmg=2571;" +
    "+dmgo=2437;+acdmg=60;-dmg=575;-dmgo=447";
/** The same recording: a heal on a combatant other than the announcer. */
const HEAL_ON_ANOTHER = "471804=22.40;0;heal=512";
/**
 * No recording carries these after an announcement: a tick taking health off the announcer, and a
 * message that decodes to nothing at all.
 */
const TICK_ON_ANNOUNCER = "-10007253=95.90;0;poison=42";
const NOTHING_READ = "-10007253=95.90;0;whatever_per=30";
/**
 * ⚠️ **No recording carries the one skill the table grants two attacks to.** Its announcement is
 * written out here because only a grant of two puts a blow this decoder must refuse *inside* what
 * a standing still has left to spend — at a grant of one the budget runs out first, and the
 * condition being probed is never reached. The id is `develop:frozen/blows-granted.ts`'s.
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
 * A fight file a player saved on build `Bb28FQty` on 2026-09-27, off the shelf and so outside
 * `captures/`: a bandage that raises its caster's resistances as well.
 */
const RESISTANCES_ON_SKILL = "10295=86.96;10295=86.96;tspell=Opatrywanie ran;skillId=237;" +
    "bandage=0;resfire_per=13;resfrost_per=13;reslight_per=13";
/**
 * `2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json`: a line for the client's own log,
 * its words and the NPC's name replaced, since the game's sentences are not ours to keep; and a
 * step.
 */
const LOG_LINE = "0;0;txt=Potwór 1: x";
const STEP_TAKEN = "-255967=100.00;0;step";

/**
 * `2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json`: how that fight ended, on the two
 * keys it takes.
 */
const WON = "0;0;winner=Gracz 1";
const LOST = "0;0;loser=Odyniec, Odyniec, Locha";

/**
 * `2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none.json`: one group blow dropping two
 * holders below the
 * threshold at once. A reader counting messages rather than segments loses the second.
 */
const TWO_HEALED = "-10005001=74.30;466747=0.00;legbon_lastheal=10564,Gracz 8(42.00%);" +
    "+oth_dmg=9315,g,Gracz 8(42.00%);legbon_lastheal=10550,Gracz 5(44.00%);" +
    "+oth_dmg=9613,g,Gracz 5(44.00%);+oth_dmg=9613,g,Gracz 9(0.00%)";
const AUTO = "captures/2026-08-23-tempest-grupa-vs-hildur-auto-1786514810315-none.json";

Deno.test("a blow reads as raw, applied, and what a defence stopped", () => {
    const event = getOnlyAttack(decode([ABSORBED]));
    if (event.kind !== "attack") return;
    assertStrictEquals(event.actorId, 467968, "the actor is the message's own");
    assertStrictEquals(event.targetHealthPercent, 99.69, "the target's health rides the blow");
    assertEquals(event.raw, [{ element: "dmgd", amount: 1557 }], "before reduction");
    assertEquals(event.applied, [{ element: "dmgd", amount: 1012 }], "after it");
    assertEquals(event.prevented, [{ defence: "absorb", amount: 545 }], "and what stopped 545");
    assertEquals(event.destroyed, [{ statistic: "acdmg", amount: 16 }], "armour is not damage");
    assertEquals(event.procs, ["+pierce"], "a proc states no figure");
});

function getOnlyAttack(events: readonly BattleEvent[]): BattleEvent {
    assertStrictEquals(events.length, 1, "the message decoded to one event");
    const event = events[0];
    assertExists(event, "a list of one has a first member");
    assertStrictEquals(event.kind, "attack", "and that event is a blow");
    return event;
}

/** One payload, decoded from no standing: the events a panel reads, unread messages included. */
function decode(
    messages: readonly string[],
    roster: CombatantRoster | null = null,
    tables: DecoderTables = BLOWS_GRANTED,
): BattleEvent[] {
    return [
        ...decodePayloadMessages(messages, { roster, announcementStanding: null, tables }).events,
    ];
}

/**
 * ⚠️ **A wound is a wound whether or not something weakened it.** `+wound` carries no figure and
 * reaches the card as a proc; this one carries a percentage, and a reader taking only valueless
 * keys left a weakened wound off the card while an unweakened one stood on it — a hole in what a
 * player sees that turned on something they cannot see. The figure itself is **not** read: what
 * the percentage is taken off is unsettled (`docs/protocol-keys.md`).
 */
Deno.test("a wound something weakened reaches the card, and its share does not", () => {
    const event = getOnlyAttack(decode([WEAKENED_WOUND]));
    if (event.kind !== "attack") return;
    assertEquals(event.procs, ["+woundpoison"], "the announcement is a proc like any other");
    assertEquals(
        event.declared.filter((declaredEffect) => declaredEffect.effect === "+woundpoison"),
        [],
        "and states nothing, because the share it carries is a unit no total here keeps",
    );
    assertEquals(event.raw, [{ element: "dmgd", amount: 1139 }], "the blow it rides is read whole");
    assertEquals(event.destroyed, [{ statistic: "acdmg", amount: 16 }], "armour with it");
});

Deno.test("the third blow is read by name, and a zero is a reading", () => {
    const event = getOnlyAttack(decode([THIRD_BLOW]));
    if (event.kind !== "attack") return;
    assertStrictEquals(event.raw.length, 3, "two damage keys and the pair with no marker");
    assertEquals(event.raw[2], { element: "thirdatt", amount: 1168 }, "raw, by name");
    assertEquals(event.applied[0], { element: "dmg", amount: 0 }, "nothing landed, and says so");
    assertEquals(event.applied[1], { element: "thirdatt", amount: 59 }, "applied, by name");
    assertEquals(event.prevented, [{ defence: "blok", amount: 363 }], "a block stopped 363");
});

Deno.test("a key with no meaning yet leaves the rest of the message read", () => {
    const events = decode([UNREAD]);
    assertStrictEquals(events.length, 2, "what was read, and what could not be");
    const [used, unread] = events;
    assertStrictEquals(used?.kind, "skill-used", "the announcement is still an event");
    assertStrictEquals(used.skillName, "Zdrowa atmosfera", "with the name the protocol stated");
    assertStrictEquals(unread?.kind, "unknown-message", "and the unread key is its own event");
    assertEquals(unread.unreadKeys, ["whatever_per"], "named, one entry per occurrence");
    assertEquals(unread.combatantIds, [469657], "with the end the grammar stated, once");
});

Deno.test("a message the grammar refuses is an event, not a silence", () => {
    const events = decode(["gracz;0;step"]);
    assertStrictEquals(events.length, 1, "one event");
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
    const restored = decode([HEAL]);
    assertStrictEquals(restored.length, 1, "a heal alone in its message is one event");
    assertStrictEquals(restored[0]?.kind, "health-change", "and it is health moving");
    assertStrictEquals(restored[0].combatantId, 482845, "on the actor, where the key states it");
    assertStrictEquals(restored[0].amount, 99, "restored, so positive");
    assertStrictEquals(restored[0].healthPercent, 100, "with where they stand once it is in");

    const lost = decode([POISON]);
    assertStrictEquals(lost[0]?.kind, "health-change", "poison moves health too");
    assertStrictEquals(lost[0].amount, -140, "and takes it, which is the key's own sign");
    assertEquals(lost[0].declared, [{ effect: "poison", amount: 14, text: "14" }], "not health");
});

Deno.test("a heal the client states as a loss is read as one", () => {
    const events = decode([NEGATIVE_HEAL]);
    assertStrictEquals(events[0]?.kind, "health-change", "the key is still a health movement");
    assertStrictEquals(events[0].amount, -92, "the sign the protocol wrote survives the key's own");
});

Deno.test("the one key of the family that means the target", () => {
    const events = decode([HEAL_TARGET]);
    const restored = events.filter((event) => event.kind === "health-change");
    assertStrictEquals(restored.length, 1, "one figure moved health");
    assertStrictEquals(restored[0]?.kind, "health-change", "and it is the healing");
    assertStrictEquals(restored[0].combatantId, 445202, "read off the target slot, not the actor");
    assertStrictEquals(restored[0].amount, 11733, "restored");
    assertStrictEquals(
        restored[0].healthPercent,
        100,
        "with where the healed stands, not the healer",
    );
    const used = events.filter((event) => event.kind === "skill-used");
    assertStrictEquals(used.length, 1, "the announcement beside it is an event of its own");
    assertStrictEquals(
        events.filter((event) => event.kind === "unknown-message").length,
        0,
        "nothing left",
    );
});

/**
 * The announcement is in the same breath as the figure, and reading only the message before loses
 * it: `heal_target` is charged to the announcement's actor (`docs/protocol-keys.md`), so an
 * announcement nothing picks up leaves the health with no giver and no name.
 */
Deno.test("a figure stated on an announcement rides that announcement, not the one before", () => {
    const events = decode([HEAL_TARGET]);
    const restored = events.find((event) => event.kind === "health-change");
    assertStrictEquals(restored?.kind, "health-change", "the healing is read");
    assertExists(restored.announced, "and it carries the announcement it was stated on");
    assertStrictEquals(restored.announced.skillName, "Leczenie ran", "by the name the game wrote");
    assertStrictEquals(restored.announced.skillId, 78, "with the id beside it");
    assertStrictEquals(restored.announced.actorId, 469657, "and the healer, off the actor slot");
    assertStrictEquals(restored.combatantId, 445202, "who is not the combatant the health reached");
});

/** The other side of it: a message announcing nothing carries no announcement of its own. */
Deno.test("a figure on a message that announces nothing rides nothing", () => {
    const events = decode([HEAL]);
    const restored = events.find((event) => event.kind === "health-change");
    assertStrictEquals(restored?.kind, "health-change", "the healing is read all the same");
    assertStrictEquals(
        restored.announced,
        null,
        "and states no skill, because the message states none",
    );
});

Deno.test("an announcement is an event, and its id may be missing", () => {
    const events = decode([ANNOUNCEMENT]);
    const used = events.filter((event) => event.kind === "skill-used");
    assertStrictEquals(used.length, 1, "the announcement is read");
    assertStrictEquals(used[0]?.kind, "skill-used", "and it is a skill being used");
    assertStrictEquals(used[0].skillName, "Struna płomienna", "by the name the protocol states");
    assertStrictEquals(used[0].skillId, null, "with no id, which the game leaves out often enough");
    assertStrictEquals(used[0].actorId, -10000249, "and the combatant who used it");
});

Deno.test("the glue is the client's, and the same actor is our condition", () => {
    const glued = decode([ANNOUNCEMENT, BLOW_AFTER]);
    const attack = glued.find((event) => event.kind === "attack");
    assertStrictEquals(attack?.kind, "attack", "the blow after the announcement is read");
    assertStrictEquals(
        attack.announced?.skillName,
        "Struna płomienna",
        "and carries what announced it",
    );
    assertStrictEquals(attack.announced?.actorId, -10000249, "with the announcer named");

    const apart = decode(
        [ANNOUNCEMENT_ELSEWHERE, BLOW_BY_ANOTHER],
    );
    const anotherBlow = apart.find((event) => event.kind === "attack");
    assertStrictEquals(anotherBlow?.kind, "attack", "somebody else's blow is read too");
    assertStrictEquals(anotherBlow.announced, null, "and takes no skill that was never theirs");
});

/**
 * ⚠️ **This read the opposite until 2026-09-12, and the sample is why.** `Struna płomienna`
 * announces with no id, and the published table is the **player's**, keyed by one — so there the
 * table cannot say how many blows the skill strikes, and the reach is the announcer's own run.
 * The corpus caught this skill striking twice three times over. `develop ADR 0078`.
 */
Deno.test("an announcement the table cannot be asked about reaches its own run", () => {
    const events = decode([ANNOUNCEMENT, BLOW_AFTER, BLOW_AFTER]);
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 2, "both blows are read");
    assertStrictEquals(attacks[0]?.announced?.skillName, "Struna płomienna", "the first rides it");
    assertStrictEquals(
        attacks[1]?.announced?.skillName,
        "Struna płomienna",
        "and so does the second",
    );
});

Deno.test("a message that is no blow ends a reach the table could not bound", () => {
    const events = decode(
        [ANNOUNCEMENT, BLOW_AFTER, STEP_AFTER, BLOW_AFTER],
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 2, "both blows are read");
    assertStrictEquals(attacks[0]?.announced?.skillName, "Struna płomienna", "the first rides it");
    assertStrictEquals(attacks[1]?.announced, null, "and a step between the two ends the standing");
});

Deno.test("another combatant's blow ends a reach the table could not bound", () => {
    const events = decode(
        [ANNOUNCEMENT, BLOW_AFTER, BLOW_BY_ANOTHER, BLOW_AFTER],
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 3, "all three blows are read");
    assertStrictEquals(
        attacks[1]?.announced,
        null,
        "the blow that is not the announcer's takes none",
    );
    assertStrictEquals(
        attacks[2]?.announced,
        null,
        "and the standing does not step over it to reach on",
    );
});

Deno.test("a glued heal on the announcer hands the reach on to the blow after it", () => {
    const handed = decode([SELF_HEALING_ANNOUNCEMENT, SELF_HEAL, BLOW_AFTER_SELF_HEAL]);
    const blow = handed.find((event) => event.kind === "attack");
    assertStrictEquals(blow?.kind, "attack", "the blow after the heal is read");
    assertStrictEquals(blow.announced?.skillName, "Kuya Kuya", "and rides the announcement");

    const elsewhere = decode([SELF_HEALING_ANNOUNCEMENT, HEAL_ON_ANOTHER, BLOW_AFTER_SELF_HEAL]);
    const plain = elsewhere.find((event) => event.kind === "attack");
    assertStrictEquals(plain?.kind, "attack", "a blow after somebody else's heal is read");
    assertStrictEquals(
        plain.announced,
        null,
        "and rides nothing, because that heal ended the reach",
    );

    const twice = decode([SELF_HEALING_ANNOUNCEMENT, SELF_HEAL, SELF_HEAL, BLOW_AFTER_SELF_HEAL]);
    const late = twice.find((event) => event.kind === "attack");
    assertStrictEquals(late?.kind, "attack", "a blow after a second heal is read");
    assertStrictEquals(late.announced, null, "and only the glued message hands the reach on");

    const ticked = decode([SELF_HEALING_ANNOUNCEMENT, TICK_ON_ANNOUNCER, BLOW_AFTER_SELF_HEAL]);
    const struck = ticked.find((event) => event.kind === "attack");
    assertStrictEquals(struck?.kind, "attack", "a blow after a tick on the announcer is read");
    assertStrictEquals(struck.announced, null, "and health taken off them hands nothing on");

    const unread = decode([SELF_HEALING_ANNOUNCEMENT, NOTHING_READ, BLOW_AFTER_SELF_HEAL]);
    const after = unread.find((event) => event.kind === "attack");
    assertStrictEquals(after?.kind, "attack", "a blow after a message nothing was read from");
    assertStrictEquals(after.announced, null, "rides nothing: a heal is what hands a reach on");
});

Deno.test("a name the game did not take from its table is read where one is named", () => {
    const events = decode([CUSTOM]);
    const used = events.filter((event) => event.kind === "skill-used");
    assertStrictEquals(
        used[0]?.kind,
        "skill-used",
        "one combatant at both ends, so nobody is guessed at",
    );
    assertStrictEquals(used[0].skillName, "Przelotna elfia kołysanka", "read like any other name");

    // No recording carries this shape; it probes the rule the register states for the key.
    const twoEnds = decode(
        ["47010=100.00;38205=100.00;tcustom=Kołysanka"],
    );
    assertStrictEquals(
        twoEnds.filter((event) => event.kind === "skill-used").length,
        0,
        "not read",
    );
    const unread = twoEnds.find((event) => event.kind === "unknown-message");
    assertStrictEquals(unread?.kind, "unknown-message", "it goes back to unread instead");
    assertEquals(unread.unreadKeys, ["tcustom"], "naming the key, so the panel can say which");
});

Deno.test("damage stated against a name reaches the person it names", () => {
    const roster = indexRecordedRoster(HILDUR);
    const events = decode([AGAINST_NAMES], roster);
    const hits = events.filter((event) => event.kind === "damage-to-named-combatant");
    assertStrictEquals(hits.length, 2, "each name carries its own figure");
    assertStrictEquals(
        hits[0]?.kind,
        "damage-to-named-combatant",
        "the first is the message's own target",
    );
    assertStrictEquals(hits[0].targetId, 445202, "which the roster resolves like any other name");
    assertStrictEquals(
        hits[1]?.kind,
        "damage-to-named-combatant",
        "the second is somebody else entirely",
    );
    assertStrictEquals(
        hits[1].targetName,
        "Gracz 10",
        "named here and nowhere else in the message",
    );
    assertStrictEquals(
        hits[1].targetId,
        475890,
        "and put on that combatant, not on the blow's target",
    );
    assertStrictEquals(hits[1].targetHealthPercent, 70.85, "with where the named combatant stands");
    assertEquals(hits[1].damage, { element: "dmgg", amount: 8868 }, "already reduced, no pair");
});

function indexRecordedRoster(path: string): CombatantRoster {
    return indexCombatantRoster(lookupRecordedFight(path).combatants);
}

Deno.test("a name nothing can resolve keeps its figure and says whose it is not", () => {
    const events = decode([AGAINST_NAMES]);
    const hits = events.filter((event) => event.kind === "damage-to-named-combatant");
    assertStrictEquals(
        hits[0]?.kind,
        "damage-to-named-combatant",
        "the figure is read without a roster",
    );
    assertStrictEquals(hits[0].targetId, null, "and lands on nobody rather than on a guess");
    assertStrictEquals(hits[0].targetName, "Gracz 4", "while the name the game stated is kept");
});

Deno.test("a blank element is the plain one, not an element of its own", () => {
    const events = decode([BLANK_ELEMENT]);
    const hits = events.filter((event) => event.kind === "damage-to-named-combatant");
    assertStrictEquals(hits[0]?.kind, "damage-to-named-combatant", "the figure is read");
    assertStrictEquals(
        hits[0].damage.element,
        "dmg",
        "the same element the family's own keys carry",
    );
});

Deno.test("what no total counts rides the blow it was stated on", () => {
    const events = decode([DECLARED_ON_BLOW]);
    assertStrictEquals(events.length, 1, "nothing was left unread");
    assertStrictEquals(events[0]?.kind, "attack", "the blow is the event");
    assertEquals(events[0].declared, [{ effect: "+taken_dmg", amount: 254, text: "254" }], "read");
    assertStrictEquals(events[0].applied.length, 3, "beside the figures a total does count");
});

Deno.test("what an announcement states about its skill rides the announcement", () => {
    const events = decode([DECLARED_ON_SKILL]);
    const used = events.find((event) => event.kind === "skill-used");
    assertStrictEquals(used?.kind, "skill-used", "the announcement is the event");
    assertEquals(used.declared.map((declaredEffect) => declaredEffect.effect), [
        "active_block_per",
        "combo-max",
    ], "both");
    assertStrictEquals(used.declared[0]?.amount, 15, "with the figure the protocol stated");
    assertStrictEquals(
        events.filter((event) => event.kind === "unknown-message").length,
        0,
        "nothing left",
    );
});

Deno.test("a bandage that also raises its caster's resistances is read whole", () => {
    const events = decode([RESISTANCES_ON_SKILL]);
    assertStrictEquals(
        events.filter((event) => event.kind === "unknown-message").length,
        0,
        "nothing left",
    );
    const used = events.find((event) => event.kind === "skill-used");
    assertStrictEquals(used?.kind, "skill-used", "the announcement is the event");
    assertEquals(used.declared, [
        { effect: "resfire_per", amount: 13, text: "13" },
        { effect: "resfrost_per", amount: 13, text: "13" },
        { effect: "reslight_per", amount: 13, text: "13" },
    ], "each resistance with the figure the protocol stated");
});

Deno.test("a message about nobody's health is a declaration of its own", () => {
    const logged = decode([LOG_LINE]);
    assertStrictEquals(logged[0]?.kind, "declaration", "a log line happens to nobody");
    assertStrictEquals(logged[0].combatantId, null, "and names nobody");
    assertStrictEquals(
        logged[0].declared[0]?.text,
        "Potwór 1: x",
        "text, not a figure",
    );
    assertStrictEquals(
        logged[0].declared[0]?.amount,
        null,
        "which is not a number and is not read as one",
    );

    const stepped = decode([STEP_TAKEN]);
    assertStrictEquals(stepped[0]?.kind, "declaration", "a step is a declaration too");
    assertStrictEquals(stepped[0].combatantId, -255967, "and this one names whose it is");
    assertEquals(stepped[0].declared, [{ effect: "step", amount: null, text: null }], "no value");
});

Deno.test("a key read only while it states nothing goes unread once it states something", () => {
    const silent = decode(
        ["1=50.00;2=50.00;+dmg=10;-dmg=10;+legbon_holytouch"],
    );
    assertStrictEquals(silent[0]?.kind, "attack", "the blow is read");
    assertStrictEquals(
        silent[0].declared[0]?.effect,
        "+legbon_holytouch",
        "and the flag beside it",
    );

    // The client composes this key with a hole for a figure; no recording has ever filled it.
    const stated = decode(
        ["1=50.00;2=50.00;+dmg=10;-dmg=10;+legbon_holytouch=7"],
    );
    const unread = stated.find((event) => event.kind === "unknown-message");
    assertStrictEquals(unread?.kind, "unknown-message", "a figure arriving there is not read");
    assertEquals(unread.unreadKeys, ["+legbon_holytouch"], "it is reported, loudly");
});

Deno.test("a fight ends on two keys, each naming its own side", () => {
    const won = decode([WON]);
    assertStrictEquals(won[0]?.kind, "fight-outcome", "the outcome is an event");
    assertStrictEquals(won[0].result, "won", "of the side the key names");
    assertEquals(won[0].combatantNames, ["Gracz 1"], "by name, because the message states no id");

    const lost = decode([LOST]);
    assertStrictEquals(lost[0]?.kind, "fight-outcome", "the other key is the other side");
    assertStrictEquals(lost[0].result, "lost", "which lost");
    assertEquals(lost[0].combatantNames, ["Odyniec", "Odyniec", "Locha"], "each name on its own");
});

Deno.test("a fight nobody won is stated on the winners' key alone", () => {
    // No recording carries either shape: the register reads them off the client's own branch.
    const drawn = decode(["0;0;winner=?"]);
    assertStrictEquals(drawn[0]?.kind, "fight-outcome", "the mark is read");
    assertStrictEquals(drawn[0].result, "drawn", "as a fight nobody won");
    assertEquals(drawn[0].combatantNames, [], "naming nobody, which is the whole of what it says");

    const refused = decode(["0;0;loser=?"]);
    assertStrictEquals(
        refused[0]?.kind,
        "unknown-message",
        "the same mark on the other key is not read",
    );
    assertStrictEquals(
        refused.filter((event) => event.kind === "fight-outcome").length,
        0,
        "no side of `?`",
    );
});

/**
 * The escape arrives on a key of its own, and the client never reads that key's value — it takes
 * the name and the health percent off the actor slot instead. So both shapes are proved here:
 * neither is the one the material settles, because the material carries no escape at all.
 */
Deno.test("a fight an escape broke off is read on its own key, valued or bare", () => {
    const bare = decode(["500001=94.75;0;flee"]);
    assertStrictEquals(bare[0]?.kind, "fight-outcome", "the bare key is an outcome");
    assertStrictEquals(bare[0].result, "fled", "of a fight nobody finished");
    assertEquals(bare[0].combatantNames, [], "naming no side, because the key names none");
    assertStrictEquals(
        bare.filter((event) => event.kind === "unknown-message").length,
        0,
        "nothing unread",
    );

    const valued = decode(["500001=94.75;0;flee=1"]);
    assertStrictEquals(valued[0]?.kind, "fight-outcome", "and so is the valued one");
    assertStrictEquals(valued[0].result, "fled", "which says the same thing");
    assertEquals(valued[0].combatantNames, [], "and names nobody either");
});

Deno.test("an escape beside a stated winner is still what the fight came to", () => {
    const both = decode(
        ["500001=94.75;0;flee", "0;0;winner=Gracz 1"],
    );
    const outcomes = both.filter((event) => event.kind === "fight-outcome");
    assertStrictEquals(
        outcomes.length,
        2,
        "both messages are read, and neither swallows the other",
    );
    assertStrictEquals(outcomes[0]?.result, "fled", "the escape as the escape");
    assertStrictEquals(outcomes[1]?.result, "won", "and the side the protocol named as named");
});

/**
 * What stands behind the entry in `docs/protocol-keys.md`: the escape is read off the
 * client's own branch and the published help, and the material says nothing either way. A
 * recording of one would turn this red, which is the point: it is the day the entry gets a
 * measurement.
 */
Deno.test("no recording carries an escape, which is why the register cites the client", () => {
    let fled = 0;
    let ended = 0;
    for (const fight of readRecordedFights()) {
        for (const event of decodeRecordedFight(fight).events) {
            if (event.kind !== "fight-outcome") continue;
            ended += 1;
            if (event.result === "fled") fled += 1;
        }
    }
    assert(ended > 0, "the walk reached the messages that state an ending");
    assertStrictEquals(fled, 0, "and not one of them is an escape");
});

/**
 * The claim `docs/protocol-keys.md` files `-dmga` under, and the one the panel's word
 * rests on: the published help says the ordinary reductions do not reach this damage, and a
 * protocol that reports no reduction has no raw side to report either. A `+dmga` is therefore a
 * finding rather than a gap: it would mean something reduces the key after all.
 * The applied count stands beside it so a walk that has stopped finding the element reddens too.
 */
Deno.test("the one element with no raw half still has an applied one", () => {
    let raw = 0;
    let applied = 0;
    for (const fight of readRecordedFights()) {
        for (const event of decodeRecordedFight(fight).events) {
            if (event.kind !== "attack") continue;
            raw += event.raw.filter((figure) => figure.element === "dmga").length;
            applied += event.applied.filter((figure) => figure.element === "dmga").length;
        }
    }
    assert(applied > 0, "the corpus states this element at all");
    assertStrictEquals(raw, 0, "and never states a raw side for it");
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
    for (const fight of readRecordedFights()) {
        for (const event of decodeRecordedFight(fight).events) {
            if (event.kind !== "attack") continue;
            const elements = [...event.raw, ...event.applied].map((figure) => figure.element);
            if (!elements.includes("thirdatt")) continue;
            carried += 1;
            assert(
                elements.some((elementKey) => elementKey !== "thirdatt"),
                "a blow rolling the extra attack states the ordinary one too",
            );
        }
    }
    assert(carried > 0, "the corpus rolls the extra attack at all");
});

Deno.test("healing stated by name is read from the value, never from a slot", () => {
    const roster = indexRecordedRoster(AUTO);
    const events = decode([TWO_HEALED], roster);
    const restored = events.filter((event) => event.kind === "healing-to-named-combatant");
    assertStrictEquals(restored.length, 2, "both holders are healed in the one message");
    assertStrictEquals(restored[0]?.kind, "healing-to-named-combatant", "the first is read");
    assertStrictEquals(restored[0].amount, 10564, "with the figure the value states first");
    assertStrictEquals(restored[0].targetName, "Gracz 8", "and the name it states second");
    assertStrictEquals(restored[0].targetHealthPercent, 42, "where that combatant stands after it");
    assertExists(restored[0].targetId, "which the roster resolves");
    assertStrictEquals(
        restored[1]?.kind,
        "healing-to-named-combatant",
        "and the second is not lost",
    );
    assertStrictEquals(restored[1].targetName, "Gracz 5", "who is somebody else again");
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
    // Every key `captures/` carries is read now, so the panel says nothing is missing:
    // a claim about the material rather than about the decoder, and the probes above are what
    // hold the other half.
    assertStrictEquals(tally.unread, 0, "and nothing in the recordings goes unread any more");
    assertStrictEquals(
        tally.outcomes,
        readRecordedFights().length * 2,
        "each fight ends once, twice over",
    );
});

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
    for (const fight of readRecordedFights()) {
        const events = decodeRecordedFight(fight).events;
        assert(
            events.length >= fight.messages.length,
            `${fight.path}: a message decoded to nothing`,
        );
        for (const event of events) countEvent(tally, event, fight.path);
    }
    return tally;
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
        assert(event.combatantNames.every((name) => name.length > 0), `${path}: an unnamed member`);
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
        assertStrictEquals(event.announced.actorId, event.actorId, `${path}: another's skill`);
    }
    assertStrictEquals(event.raw.length > 0, event.applied.length > 0, `${path}: raw alone`);
    if (event.procs.length > 0) assert(event.raw.length > 0, `${path}: a proc rode nothing`);
}

/**
 * The bound both ways, which nothing drove until the constant was exported. A payload carrying a
 * whole fight is the shape it exists for, so the sample is one message repeated: what is measured
 * here is the length the decoder accepts, not what the messages say.
 */
Deno.test("a payload is decoded up to the stated bound, and refused past it", () => {
    const message = "0;0;txt=a";
    const full = new Array(MESSAGES_MAXIMUM).fill(message);
    const events = decode(full);
    assertStrictEquals(events.length, MESSAGES_MAXIMUM, "a payload at the bound decodes whole");
    assertThrows(
        () => decode([...full, message]),
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
    for (const fight of readRecordedFights()) {
        for (const payload of fight.payloads) {
            if (payload.length > longest) longest = payload.length;
        }
    }
    assert(longest > 0, "the recordings carry messages at all");
    assertLess(longest * 8, MESSAGES_MAXIMUM, "and the widest of them is far inside the bound");
});

/**
 * ⚠️ **The budget is spent on the announcer's own blows and on nothing else.** The three cases
 * below are the whole of what ends a standing early, and each is written out because no recording
 * puts the announcement of a granted skill in front of any of them. `develop ADR 0078`.
 */
Deno.test("a granted announcement reaches the second blow, and stops there", () => {
    const events = decode(
        [GRANTED_ANNOUNCEMENT, GRANTED_FIRST, GRANTED_SECOND, BLOW_AFTER],
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 3, "three blows are read");
    assertStrictEquals(
        attacks[0]?.announced?.skillName,
        "Podwójne trafienie",
        "the first is announced",
    );
    assertStrictEquals(
        attacks[1]?.announced?.skillName,
        "Podwójne trafienie",
        "and so is the second",
    );
    assertStrictEquals(attacks[2]?.announced, null, "the third is past what the table granted");
});

Deno.test("a message that is no blow ends a standing the table paid for", () => {
    const events = decode(
        [GRANTED_ANNOUNCEMENT, GRANTED_FIRST, STEP_AFTER, GRANTED_SECOND],
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 2, "both blows are read");
    assertStrictEquals(
        attacks[0]?.announced?.skillName,
        "Podwójne trafienie",
        "the first is announced",
    );
    assertStrictEquals(attacks[1]?.announced, null, "and a step between the two ends the standing");
});

Deno.test("another combatant's blow ends a standing rather than being skipped over", () => {
    const events = decode(
        [GRANTED_TWICE, GRANTED_FIRST, BLOW_BY_ANOTHER, GRANTED_SECOND],
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 3, "all three blows are read");
    assertStrictEquals(attacks[0]?.announced?.skillName, "Demoniczne cięcie", "the first rides it");
    assertStrictEquals(
        attacks[1]?.announced,
        null,
        "the blow that is not the announcer's takes none",
    );
    assertStrictEquals(
        attacks[2]?.announced,
        null,
        "and the standing does not step over it to reach on",
    );
});

Deno.test("a grant of two reaches three blows of the announcer's own, and no fourth", () => {
    const events = decode(
        [GRANTED_TWICE, GRANTED_FIRST, GRANTED_SECOND, GRANTED_FIRST, GRANTED_SECOND],
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 4, "four blows are read");
    assertStrictEquals(
        attacks[2]?.announced?.skillName,
        "Demoniczne cięcie",
        "the third still rides it",
    );
    assertStrictEquals(
        attacks[3]?.announced,
        null,
        "and the fourth is past what the table granted",
    );
});

Deno.test("a table granting nothing leaves the announcement reaching one message", () => {
    const events = decode(
        [GRANTED_ANNOUNCEMENT, GRANTED_FIRST, GRANTED_SECOND],
        null,
        NO_GRANTS,
    );
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(
        attacks[0]?.announced?.skillName,
        "Podwójne trafienie",
        "the first still rides it",
    );
    assertStrictEquals(
        attacks[1]?.announced,
        null,
        "and with no grant behind it the second does not",
    );
});

/**
 * ⚠️ **Past the message the client glues it to, a standing reaches a blow and nothing else.** A
 * reach the table could not bound outlives its own blows otherwise, and lands on whatever the
 * announcer does next: this tick picked up `Kosa zastępcy` while the rule was being written. No
 * figure reads it — the amount is a loss, and only the restoring branch asks what announced it —
 * so nothing on screen would have moved, and a heal standing there would have been credited to
 * the skill. `develop ADR 0078`.
 */
Deno.test("a movement standing behind a reach takes no skill from it", () => {
    const events = decode(
        [UNBOUNDED_ANNOUNCEMENT, UNBOUNDED_BLOW, TICK_ON_THE_ANNOUNCER],
    );
    const struck = events.find((event) => event.kind === "attack");
    assertStrictEquals(
        struck?.announced?.skillName,
        "Kosa zastępcy",
        "the blow rides the announcement",
    );
    const moved = events.find((event) => event.kind === "health-change");
    assertStrictEquals(moved?.kind, "health-change", "the tick on the announcer is read");
    assertStrictEquals(moved.announced, null, "and takes no skill for standing behind one");
});

/**
 * ⚠️ **A bound nothing ever reaches is a number rather than a bound.** The longest run of an
 * announcer's own blows over `captures/` is two, so the material never meets
 * `MAXIMUM_BLOWS_GRANTED` and only a payload written by hand can show it binding at all.
 */
Deno.test("a reach the table could not bound still stops where the bound says", () => {
    const five = Array.from({ length: 5 }, () => BLOW_AFTER);
    const events = decode([ANNOUNCEMENT, ...five]);
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 5, "every blow is read");
    assertStrictEquals(
        attacks[3]?.announced?.skillName,
        "Struna płomienna",
        "the fourth still rides it",
    );
    assertStrictEquals(attacks[4]?.announced, null, "and the fifth is past what the bound allows");
});

/**
 * The claim above is a property of this corpus under this rule, not a theorem: a blow past what
 * the table granted would still stand mid-strike under no announcement. No recording carries one,
 * 0 runs of three after an announcement, so it is written out rather than left unsaid.
 */
Deno.test("a blow past what the table granted takes no skill, and opens no turn", () => {
    const events = decode([GRANTED_ANNOUNCEMENT, GRANTED_FIRST, GRANTED_SECOND, GRANTED_SECOND]);
    let standing = NO_TURN_STANDING;
    const openers: (number | null)[] = [];
    for (const event of events) {
        openers.push(event.kind === "attack" ? lookupTurnOpener(event, standing) : null);
        standing = composeTurnStanding(event, standing);
    }
    const attacks = events.filter((event) => event.kind === "attack");
    assertStrictEquals(attacks.length, 3, "three blows are read");
    assertStrictEquals(attacks[2]?.announced, null, "the third is past what the table granted");
    assertStrictEquals(openers.at(-1), null, "and it opens no turn, so the two readings disagree");
});

/**
 * Probes, every one: no recording states any of these shapes (measured 2026-09-21, 0 of every
 * value over `captures/`), and each once reached an assertion instead of the unread row,
 * which on the fight's last message left it never over, and on any other lost the payload whole.
 */
Deno.test("a value the game's own text can spell goes unread, and never into an assertion", () => {
    assertEquals(
        getOnlyUnread(decode(["0;0;winner=Gracz 1, , Gracz 2"])),
        ["winner"],
        "a side listing a member called nothing",
    );
    assertEquals(
        getOnlyUnread(decode(["1=50.00;0;tspell="])),
        ["tspell"],
        "an announcement naming nothing",
    );
    const wide = `1=50.00;0;tspell=${"x".repeat(NAME_LENGTH_MAXIMUM + 1)}`;
    assertEquals(
        getOnlyUnread(decode([wide])),
        ["tspell"],
        "and one naming more than the bound holds",
    );
    assertEquals(
        getOnlyUnread(
            decode(
                ["1=50.00;2=50.00;+oth_dmg=-5,,Gracz 3(40.00%)"],
            ),
        ),
        ["+oth_dmg"],
        "damage stated against a name below nothing",
    );
    assertEquals(
        getOnlyUnread(
            decode(["1=50.00;2=50.00;+dmg=-5;-dmg=-5"]),
        ),
        ["+dmg", "-dmg"],
        "and a blow's own figures below nothing, which leave no blow behind them",
    );
});

/** The one event of a message, which is left unread, and the keys it names as unread. */
function getOnlyUnread(events: readonly BattleEvent[]): readonly string[] {
    assertStrictEquals(events.length, 1, "the message decoded to one event");
    const event = events[0];
    assertExists(event, "a list of one has a first member");
    assertStrictEquals(event.kind, "unknown-message", "and that event is a message unread");
    return event.unreadKeys;
}

/**
 * A key spelled like a member every object carries. Indexed straight, the tables answered with
 * the language's own `constructor` for a key they never held, and the decoder invented an event.
 */
Deno.test("a key spelled like what every object carries is unread, not an inherited answer", () => {
    assertEquals(
        getOnlyUnread(decode(["1=50.00;2=50.00;constructor=5"])),
        ["constructor"],
        "a valued one reaches no table",
    );
    const events = decode(
        ["1=50.00;2=50.00;+dmg=5;-dmg=5;toString"],
    );
    assertEquals(
        events.map((event) => event.kind),
        ["attack", "unknown-message"],
        "a bare one either",
    );
    const [blow, unread] = events;
    assertEquals(blow?.kind === "attack" ? blow.procs : null, [], "and it is no proc of the blow");
    assertEquals(unread?.kind === "unknown-message" ? unread.unreadKeys : null, ["toString"]);
});

/**
 * A message with a key nobody reads is a failure of that message, and the failure still carries
 * what was read beside the key: the payload's figures do not go short for it.
 */
Deno.test("an unread message is a failure that keeps what it read", () => {
    const decoded = decodeMessage(UNREAD, {
        roster: null,
        announcementStanding: null,
        tables: BLOWS_GRANTED,
    });
    assertInstanceOf(decoded, UnreadMessage, "a message with a key nobody reads is a failure");
    assertStrictEquals(decoded.unreadCause, "unknown-key", "under the cause that left it so");
    assertEquals(decoded.keys, ["whatever_per"], "naming the key");
    assertEquals(decoded.events.map((event) => event.kind), ["skill-used"], "and what was read");
    assertExists(
        decoded.announcementStanding,
        "the announcement it made still stands for the next one",
    );

    const payload = decodePayloadMessages([UNREAD], {
        roster: null,
        announcementStanding: null,
        tables: BLOWS_GRANTED,
    });
    assertStrictEquals(payload.unread.length, 1, "the payload counts the message once");
    const kinds = payload.events.map((event) => event.kind);
    assertEquals(kinds, ["skill-used", "unknown-message"], "and keeps both halves, in order");
});

Deno.test("a message read whole is no failure, and one of no parameters is", () => {
    const context = { roster: null, announcementStanding: null, tables: BLOWS_GRANTED };
    assertNotInstanceOf(decodeMessage(ABSORBED, context), Error, "a blow read whole");
    const empty = decodeMessage("0;0", context);
    assertInstanceOf(empty, UnreadMessage, "a message stating nothing is read as nothing");
    assertStrictEquals(empty.unreadCause, "no-parameter", "and says why");
    assertEquals(empty.events, [], "carrying nothing read");
});

Deno.test("a message the grammar refuses carries the refusal it met as its cause", () => {
    const context = { roster: null, announcementStanding: null, tables: BLOWS_GRANTED };
    const refused = decodeMessage("a;0;x", context);
    assertInstanceOf(refused, UnreadMessage, "an end that is no number is a message unread");
    assertStrictEquals(refused.unreadCause, "grammar-refused", "and the grammar refused it");
    assertInstanceOf(refused.cause, EndUnreadable, "the refusal travels on as its cause");
    assertStrictEquals(refused.cause.end, MESSAGE_END.actor, "naming the end it could not read");
    const empty = decodeMessage("0;0", context);
    assertInstanceOf(empty, UnreadMessage, "a message the grammar took and nothing read");
    assertStrictEquals(empty.cause, undefined, "met no refusal below it");
});

Deno.test("a message the grammar refuses ends a standing, as no blow does", () => {
    const events = decode([ANNOUNCEMENT, "gracz;0;step", BLOW_AFTER]);
    const attack = events.find((event) => event.kind === BATTLE_EVENT.attack);
    assertStrictEquals(attack?.kind, BATTLE_EVENT.attack, "the blow after it is read");
    assertStrictEquals(attack.announced, null, "and takes nothing from before the refusal");
});

/**
 * The standing a payload ends on is handed back, so a caller can decide whether an announcement
 * reaches into the next call. `develop` starts every call from none.
 */
Deno.test("the standing a payload ends on is what the next may start from", () => {
    const opening = decodePayloadMessages([ANNOUNCEMENT], {
        roster: null,
        announcementStanding: null,
        tables: BLOWS_GRANTED,
    });
    assertExists(opening.announcementStanding, "an announcement at a payload's end still stands");
    const carried = decodePayloadMessages([BLOW_AFTER], {
        roster: null,
        announcementStanding: opening.announcementStanding,
        tables: BLOWS_GRANTED,
    });
    const blow = carried.events.find((event) => event.kind === BATTLE_EVENT.attack);
    assertStrictEquals(blow?.kind, BATTLE_EVENT.attack, "the blow in the next payload is read");
    assertStrictEquals(
        blow.announced?.skillName,
        "Struna płomienna",
        "and rides what was handed over",
    );
    const fresh = decode([BLOW_AFTER]);
    const alone = fresh.find((event) => event.kind === BATTLE_EVENT.attack);
    assertStrictEquals(
        alone?.kind === BATTLE_EVENT.attack ? alone.announced : "?",
        null,
        "not alone",
    );
});

/**
 * Probes, every one: the recordings never reach these branches, and each was a mutation that lit
 * nothing until it was written out here.
 */
Deno.test("a proc is read on a blow while it states nothing, or where the table lets it", () => {
    const bare = decode(["1=50.00;2=50.00;+dmg=10;-dmg=10;+crit"]);
    assertEquals(bare.map((event) => event.kind), ["attack"], "a proc on a blow is part of it");
    assertEquals(getOnlyUnreadAfterAttack(decode(["1=50.00;2=50.00;+dmg=10;-dmg=10;+crit=5"])), [
        "+crit",
    ], "and a proc the table reads bare goes unread once it states a figure");
    const valued = [
        "+woundpoison",
        "+woundfrost",
        "+woundmagic",
        "+of_woundpoison",
        "+of_woundmagic",
    ];
    for (const key of valued) {
        const events = decode([`1=50.00;2=50.00;+dmg=10;-dmg=10;${key}=50`]);
        assertEquals(
            events.map((event) => event.kind),
            ["attack"],
            `${key} is read with its figure`,
        );
    }
    assertEquals(
        getOnlyUnread(decode(["1=50.00;2=50.00;+crit"])),
        ["+crit"],
        "and alone it is not",
    );
});

function getOnlyUnreadAfterAttack(events: readonly BattleEvent[]): readonly string[] {
    assertEquals(events.map((event) => event.kind), ["attack", "unknown-message"], "a blow, then");
    const unread = events[1];
    assertStrictEquals(unread?.kind, "unknown-message", "what could not be read");
    return unread.unreadKeys;
}

Deno.test("an id announced with no name is unread, because nothing can put it on screen", () => {
    assertEquals(getOnlyUnread(decode(["1=50.00;0;skillId=239"])), ["skillId"], "the id alone");
});

Deno.test("an id that is no number is unread, and the name beside it still announces", () => {
    const events = decode(["1=50.00;2=40.00;tspell=Cios;skillId=x1"]);
    const unread = events.find((event) => event.kind === BATTLE_EVENT.unknownMessage);
    assertStrictEquals(unread?.kind, BATTLE_EVENT.unknownMessage, "the message is marked");
    assertEquals(unread.unreadKeys, ["skillId"], "on the id it could not read");
    const numbered = decode(["1=50.00;2=40.00;tspell=Cios;skillId=239"]);
    assertEquals(
        numbered.filter((event) => event.kind === BATTLE_EVENT.unknownMessage),
        [],
        "while an id that is a number leaves nothing unread",
    );
});

Deno.test("what an announcement states stands on it, and on no declaration beside it", () => {
    const events = decode([DECLARED_ON_SKILL]);
    const kinds = events.map((event) => event.kind);
    assertEquals(kinds, ["health-change", "skill-used"], "the healing, and the announcement");
});

Deno.test("a share stated about a whole side is read as the figure it states", () => {
    const shared = decode([CUSTOM]).find((event) => event.kind === BATTLE_EVENT.unaccountedHealth);
    assertStrictEquals(shared?.kind, BATTLE_EVENT.unaccountedHealth, "the share is read");
    assertStrictEquals(shared.declaredShare, 10, "as the ten the value states");
    assertStrictEquals(shared.combatantId, 47010, "cast by the actor");
});

Deno.test("a name holding a bracket of its own runs to the last opener", () => {
    const hit = decode(["1=50.00;2=50.00;+oth_dmg=5,g,Gracz (1)(40.00%)"]);
    const named = hit.find((event) => event.kind === BATTLE_EVENT.damageToNamedCombatant);
    assertStrictEquals(named?.kind, BATTLE_EVENT.damageToNamedCombatant, "the figure is read");
    assertStrictEquals(named.targetName, "Gracz (1)", "with the bracket kept in the name");
    assertStrictEquals(named.targetHealthPercent, 40, "and the percentage after it");
});

Deno.test("a turn lost is read by shape: the longest name, and never a sentence that stops", () => {
    const roster = indexCombatantRoster([
        { id: 1, name: "Gracz 1", side: 1, profession: "w", level: 1, healthMaximum: 100 },
        { id: 2, name: "Gracz 1 - Cień", side: 2, profession: "w", level: 1, healthMaximum: 100 },
    ]);
    const [lost] = decode(["0;0;txt=Gracz 1 - Cień - x"], roster);
    assertStrictEquals(lost?.kind, BATTLE_EVENT.turnLost, "the sentence is a turn lost");
    assertStrictEquals(lost.combatantId, 2, "by the longest name it opens with");
    const [stopped] = decode(["0;0;txt=Gracz 1 - x."], roster);
    assertStrictEquals(stopped?.kind, BATTLE_EVENT.declaration, "a sentence that stops is not one");
    const [nameless] = decode(["0;0;txt=Gracz 1 - x"]);
    assertStrictEquals(
        nameless?.kind,
        BATTLE_EVENT.declaration,
        "and nothing is read without a cast",
    );
});

/** Every message here is invented: no recording comes near either bound. */
Deno.test("one message's parts are read up to their bound, and a part past it is unread", () => {
    const blow = (procs: number) =>
        ["1=90.00;2=80.00;-dmg=1", ...Array.from({ length: procs }, () => "+pierce")].join(";");
    const atBound = getOnlyAttack(decode([blow(MESSAGE_PARTS_MAXIMUM)]));
    if (atBound.kind !== BATTLE_EVENT.attack) return;
    assertStrictEquals(atBound.procs.length, MESSAGE_PARTS_MAXIMUM, "a full list is read");
    const events = decode([blow(MESSAGE_PARTS_MAXIMUM + 1)]);
    const [attack, unread] = events;
    assertStrictEquals(attack?.kind, BATTLE_EVENT.attack, "the blow is still read");
    assertStrictEquals(attack.procs.length, MESSAGE_PARTS_MAXIMUM, "as far as its bound");
    assertStrictEquals(unread?.kind, BATTLE_EVENT.unknownMessage, "and the rest is said unread");
    assertEquals(unread.unreadKeys, ["+pierce"], "naming the part past the bound");
});

Deno.test("a shout naming everybody a fight holds is read, and one naming more is unread", () => {
    const names = (count: number) =>
        Array.from({ length: count }, (_, index) => `Gracz ${index + 1}`).join(", ");
    const shout = "1=100.00;1=100.00;tspell=Okrzyk;skillId=1;shout=";
    const [fullShout] = decode([shout + names(COMBATANTS_MAXIMUM)]);
    assertStrictEquals(fullShout?.kind, BATTLE_EVENT.skillUsed, "a shout over a full fight");
    assertEquals(fullShout.declared.map((declared) => declared.effect), ["shout"], "is read");
    const [used, unread] = decode([shout + names(COMBATANTS_MAXIMUM + 1)]);
    assertStrictEquals(used?.kind, BATTLE_EVENT.skillUsed, "the skill is still announced");
    assertEquals(used.declared, [], "without the shout");
    assertStrictEquals(unread?.kind, BATTLE_EVENT.unknownMessage, "which is said unread");
    assertEquals(unread.unreadKeys, ["shout"], "by its key");
});

/** Each shout inside the bound, two of them past it: a cast holds the names of one. */
Deno.test("a second shout in one message is unread, so a cast never holds two", () => {
    const names = (from: number) =>
        Array.from({ length: COMBATANTS_MAXIMUM }, (_, index) => `Gracz ${from + index}`).join(
            ", ",
        );
    const [used, unread] = decode([
        `1=100.00;1=100.00;tspell=Okrzyk;skillId=1;shout=${names(1)};shout=${names(21)}`,
    ]);
    assertStrictEquals(used?.kind, BATTLE_EVENT.skillUsed, "the skill is announced");
    assertEquals(used.declared.map((declared) => declared.text), [names(1)], "with the first");
    assertStrictEquals(unread?.kind, BATTLE_EVENT.unknownMessage, "and the second is unread");
    assertEquals(unread.unreadKeys, ["shout"], "by its key");
});

Deno.test("a second name or id of a skill is unread, never written over the first", () => {
    const [named, secondName] = decode(["1=100.00;0;tspell=Pierwsza;tspell=Druga"]);
    assertStrictEquals(named?.kind, BATTLE_EVENT.skillUsed, "the skill is announced");
    assertStrictEquals(named.skillName, "Pierwsza", "under the first name it was given");
    assertStrictEquals(secondName?.kind, BATTLE_EVENT.unknownMessage, "and the second is unread");
    assertEquals(secondName.unreadKeys, ["tspell"], "by its key");
    const [identified, secondId] = decode(["1=100.00;0;tspell=Pierwsza;skillId=5;skillId=6"]);
    assertStrictEquals(identified?.kind, BATTLE_EVENT.skillUsed, "one id is read");
    assertStrictEquals(identified.skillId, 5, "the first");
    assertStrictEquals(secondId?.kind, BATTLE_EVENT.unknownMessage, "and the second is unread");
    assertEquals(secondId.unreadKeys, ["skillId"], "by its key");
    const [bothIds] = decode(["1=100.00;0;skillId=5;skillId=6"]);
    assertStrictEquals(bothIds?.kind, BATTLE_EVENT.unknownMessage, "with no name, nothing stands");
    assertEquals(bothIds.unreadKeys, ["skillId", "skillId"], "and both ids are unread");
});

/**
 * Probes, every one: no recording comes near either bound, 2 members and 10 names a side at most
 * over the 37 recordings in `captures/` on 2026-10-06.
 */
Deno.test("a side naming everybody a fight holds is read, and one naming more is unread", () => {
    const names = (count: number) =>
        Array.from({ length: count }, (_, index) => `Gracz ${index + 1}`).join(", ");
    const [won] = decode([`0;0;winner=${names(COMBATANTS_MAXIMUM)}`]);
    assertStrictEquals(won?.kind, BATTLE_EVENT.fightOutcome, "a side as wide as a fight");
    assertStrictEquals(won.combatantNames.length, COMBATANTS_MAXIMUM, "is read whole");
    assertEquals(
        getOnlyUnread(decode([`0;0;loser=${names(COMBATANTS_MAXIMUM + 1)}`])),
        ["loser"],
        "and one naming a character more is unread by its key",
    );
});

Deno.test("health stated with members up to their bound is read, and past it is unread", () => {
    const tick = (members: number) => `1=50.00;0;poison=136${",20".repeat(members - 1)}`;
    const [moved] = decode([tick(HEALTH_CHANGE_MEMBERS_MAXIMUM)]);
    assertStrictEquals(moved?.kind, BATTLE_EVENT.healthChange, "a value at the bound");
    assertStrictEquals(moved.amount, -136, "keeps its figure");
    assertStrictEquals(
        moved.declared.length,
        HEALTH_CHANGE_MEMBERS_MAXIMUM - 1,
        "and everything stated beside it",
    );
    assertEquals(
        getOnlyUnread(decode([tick(HEALTH_CHANGE_MEMBERS_MAXIMUM + 1)])),
        ["poison"],
        "and a member past it leaves the key unread",
    );
});

/** No recording states more than everything: 100.00 at the most, 2026-10-06. */
Deno.test("a share past the whole of a pool is unread, at an end and against a name", () => {
    const context = { roster: null, announcementStanding: null, tables: BLOWS_GRANTED };
    assertNotInstanceOf(decodeMessage("1=100.00;0;step", context), Error, "everything left");
    const refused = decodeMessage("1=100.01;0;step", context);
    assertInstanceOf(refused, UnreadMessage, "and a hundredth more at an end is no end");
    assertStrictEquals(refused.unreadCause, "grammar-refused", "which the grammar refuses");
    assertInstanceOf(refused.cause, EndUnreadable, "as an end it could not read");
    const whole = decode(["1=50.00;2=50.00;+oth_dmg=5,,Gracz 3(100.00%)"])[0];
    assertStrictEquals(whole?.kind, BATTLE_EVENT.damageToNamedCombatant, "a name at everything");
    assertStrictEquals(whole.targetHealthPercent, 100, "stands where it is stated");
    const past = decode(["1=50.00;2=50.00;+oth_dmg=5,,Gracz 3(100.01%)"])[0];
    assertStrictEquals(past?.kind, BATTLE_EVENT.damageToNamedCombatant, "and one past it");
    assertStrictEquals(past.targetHealthPercent, null, "keeps its figure and no share");
});
