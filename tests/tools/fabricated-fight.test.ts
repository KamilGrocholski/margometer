/**
 * What the fabricated fight is worth, against `docs/protocol-keys.md`.
 *
 * The fight is composed here and never written: a guard that needed the file on disk would be a
 * guard that only runs where somebody has already run the tool. What it holds is the reason the
 * tool exists — every key the register calls `decoded` is stated at least once, and the whole
 * thing goes back through the chain `src/userscript-entry.ts` runs with nothing left unread.
 */

import { assert, assertEquals, assertExists, assertStrictEquals, assertThrows } from "@std/assert";
import { composeFightReplay } from "@/tools/fight-replay.ts";
import { getUnreadMessages } from "@/src/core/fight-statistics.ts";
import { FROZEN_AURA_TURNS } from "@/frozen/aura-turns.ts";
import {
    composeAuraTurnsBySkillId,
    composeFightStandings,
    composeShoutsBySkillId,
    PROVOCATION_KEY,
} from "@/src/core/aura-standing.ts";
import { MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import {
    CLOSING_SHOUTS,
    composeFabricatedCaptureText,
    composeFabricatedFight,
    composeFabricationShape,
    composeShapeText,
    FABRICATED_WORLD,
    type FabricatedFight,
    FABRICATION_FIELDS,
    isFabricatedPath,
} from "@/tools/fabricated-fight.ts";
import { FabricatedFightError } from "@/tools/margometer-tool-error.ts";
import { getRegisteredKeys, REGISTER_PATH } from "@/tools/protocol-key-shape.ts";

const DECODED_VERDICT = "decoded";
const SEGMENT_SEPARATOR = ";";
const VALUE_SEPARATOR = "=";
/** Both ends of a message come first, and neither is a key. */
const SIDE_SEGMENTS = 2;
/** What the script holds, read off the fight that reaches all of it rather than stated here. */
const ACTS_SCRIPTED = 41;
/** The rounds a shape nobody argued with runs, read off that shape rather than spelled again. */
const DEFAULT_ROUNDS = composeFabricationShape().rounds;

/**
 * A key the register calls `decoded` that no message can state, each with why. The list is the
 * one way past this guard, so an entry without a reason is an entry that should not be here.
 */
const NOT_A_MESSAGE_KEY: Record<string, string> = {
    // The family the client reads by shape rather than by name; every member of it is a key, and
    // the script states six pairs of them.
    "?dmg*": "a family read by shape, and no key a message ever writes",
};

/** The register's own reader, so one walk answers what a heading says (**C15**). */
function getRegisterVerdicts(register: string): Map<string, string> {
    return new Map(getRegisteredKeys(register).map((one) => [one.key, one.verdict]));
}

/** The keys one message states, which is every segment after its two ends. */
function getKeysOfMessage(message: string): string[] {
    const segments = message.split(SEGMENT_SEPARATOR).slice(SIDE_SEGMENTS);
    assert(segments.length >= 0, "a message states no fewer keys than none");
    return segments.map((segment) => {
        const at = segment.indexOf(VALUE_SEPARATOR);
        return at === -1 ? segment : segment.slice(0, at);
    });
}

Deno.test("the readers know a decoded heading and a key from a message", () => {
    const sample = "### `+crit` — decoded\n### `+swing` — investigated\nnot a heading\n";
    const read = getRegisterVerdicts(sample);
    assertStrictEquals(read.get("+crit"), DECODED_VERDICT, "a decoded heading is read as one");
    assertStrictEquals(read.get("+swing"), "investigated", "and one that was only looked at");
    assertStrictEquals(read.size, 2, "and a line that is no heading is no entry");

    assertEquals(
        getKeysOfMessage("500001=97.45;600001=70.07;+dmgd=466;+crit"),
        ["+dmgd", "+crit"],
        "a key is read with its value off, and both ends are skipped",
    );
    assertEquals(getKeysOfMessage("0;0"), [], "a message stating nothing states no key");
});

const FIGHT = composeFabricatedFight();
/**
 * Both endings, because the register's decoded keys are spread across them: `flee` is stated by
 * one and `winner`/`loser` by the other, and no single fight puts all three in front of anybody.
 */
const FLED = composeFabricatedFight(composeFabricationShape(2, 6, 20, "fled"));
const MESSAGES = [...FIGHT.calls, ...FLED.calls].flatMap((call) => call.messages);
const REPLAY = composeFightReplay({
    name: "fabricated",
    calls: FIGHT.calls.map((call) => call.payload),
    hasSnapshot: false,
});

Deno.test("what the fabricator writes states every key the register calls decoded", () => {
    const verdicts = getRegisterVerdicts(Deno.readTextFileSync(REGISTER_PATH));
    assert(verdicts.size > 0, "the register names keys");
    const stated = new Set(MESSAGES.flatMap(getKeysOfMessage));
    assert(stated.size > 0, "and the fabricated fight states keys of its own");
    const unstated: string[] = [];
    for (const [key, verdict] of verdicts) {
        if (verdict !== DECODED_VERDICT) continue;
        if (key in NOT_A_MESSAGE_KEY) continue;
        if (!stated.has(key)) unstated.push(key);
    }
    assertEquals(unstated, [], "a decoded key the fabricated fight never puts in front of anybody");
});

Deno.test("every exemption names a key the register really carries", () => {
    const verdicts = getRegisterVerdicts(Deno.readTextFileSync(REGISTER_PATH));
    const gone = Object.keys(NOT_A_MESSAGE_KEY).filter((key) => !verdicts.has(key));
    assertEquals(gone, [], "an exemption for a key the register no longer names");
    const reasons = Object.values(NOT_A_MESSAGE_KEY).filter((reason) => reason.length === 0);
    assertEquals(reasons, [], "an exemption carrying no reason");
});

Deno.test("the fabricated fight goes through the chain with nothing left unread", () => {
    assertStrictEquals(
        getUnreadMessages(REPLAY.statistics),
        0,
        "a message the panel could not read",
    );
    assertStrictEquals(REPLAY.reading.messagesLost, 0, "a message the payload said it carried");
    assert(REPLAY.reading.isOver, "and the fight it composed reached its end");
    assert(!REPLAY.reading.hasJoinedInProgress, "and was read from its own opening");
});

Deno.test("the fabricated fight fields ten players against ten", () => {
    const combatants = [...REPLAY.roster.byId.values()];
    assertStrictEquals(combatants.length, 20, "a fabricated fight fields twenty");
    assertStrictEquals(REPLAY.reading.readerSide, 1, "and states which side the reader is on");
    const ours = combatants.filter((one) => one.side === REPLAY.reading.readerSide);
    assertStrictEquals(ours.length, 10, "ten of them ours");
    assertStrictEquals(combatants.length - ours.length, 10, "and ten of them theirs");
    const professions = new Set(combatants.map((one) => one.profession));
    assert(professions.size >= 4, "across more than one profession");
});

Deno.test("the fabricated fight puts something in every part of the panel", () => {
    assert(REPLAY.statistics.outcome !== null, "a fight that ended says who won it");
    const figures = [...REPLAY.statistics.byCombatantId.values()];
    assertStrictEquals(figures.length, 20, "and a figure for every combatant");
    assert(figures.every((one) => one.damageDealtApplied > 0), "each of whom dealt something");
    assert(figures.every((one) => one.damageTakenApplied > 0), "and each of whom took something");
    assert(figures.every((one) => one.turnsTaken > 0), "and each of whom took a turn");
    assert(figures.some((one) => one.healthGiven > 0), "somebody restored somebody else");
    assert(figures.some((one) => one.turnsLost > 0), "and somebody spent a turn on nothing");
    assert(figures.some((one) => one.blowsCritical > 0), "and somebody struck a critical blow");
    assert(figures.some((one) => one.skills.size > 0), "and somebody was named under a skill");
    assert(REPLAY.statistics.totals.damagePrevented > 0, "the fight prevented something");
    // The four the corpus cannot show. Two of them reach a pinned row, and two reach no row at
    // all — which is the only place they can be looked at (**ADR 0082**, `CONTEXT.md`).
    assert(REPLAY.statistics.dealtByNobody > 0, "somebody was struck by nobody the game named");
    assert(REPLAY.statistics.takenByNobody > 0, "and somebody struck nobody it named");
    assert(REPLAY.statistics.byNeitherEnd > 0, "health went out with neither end named");
    assert(REPLAY.statistics.restoredToNobody > 0, "and came back to nobody named either");
});

Deno.test("a fabricated fight is written only where git is told not to look", () => {
    assert(isFabricatedPath("fabricated/10v10-long.json"), "the directory git ignores");
    assert(!isFabricatedPath("captures/10v10-long.json"), "and never the evidence directory");
    assert(!isFabricatedPath("fabricated.json"), "nor a file merely named after it");
});

Deno.test("the file a fabricated fight is written as says so three times over", () => {
    const written = composeFabricatedCaptureText(FIGHT);
    const document = JSON.parse(written);
    assertStrictEquals(document[FABRICATION_FIELDS.isFabricated], true, "the envelope says so");
    assertStrictEquals(document.world, FABRICATED_WORLD, "the world it states says so");
    assert(`${document[FABRICATION_FIELDS.fabricatedBy]}`.length > 0, "and what wrote it is named");
    assertStrictEquals(document.gameBuild, null, "a fight nobody fought came off no build");
});

Deno.test("a shape past what a roster or a recording holds is refused, not composed", () => {
    assertThrows(
        () => composeFabricationShape(11),
        FabricatedFightError,
        "is not between 1 and 10",
    );
    assertThrows(() => composeFabricationShape(1, 26, 0), FabricatedFightError, "level 0");
    assertThrows(
        () => composeFabricationShape(10, 200),
        FabricatedFightError,
        "past the 2000 a recording is read within",
    );
    assertStrictEquals(composeFabricationShape(1, 1, 1).perSide, 1, "and one a side is a fight");
});

Deno.test("the shape a fight was composed at is readable off the shape itself", () => {
    assertStrictEquals(composeShapeText(composeFabricationShape()), "10v10-lvl92-r26");
    assertStrictEquals(composeShapeText(composeFabricationShape(1, 8, 5)), "1v1-lvl5-r8");
    assertStrictEquals(
        composeFabricationShape().scale,
        1,
        "the default is what every scale is 1 of",
    );
});

/**
 * ⚠️ **Without the scaling a low-level fight is over on the first blow.** The script's figures
 * were written against the pool of a level-92 combatant, and 940 of them against a level-5 pool
 * kills outright — the fight ends in round one and states a fraction of the register.
 */
Deno.test("a fight at another level is fought at that level's figures", () => {
    const duel = composeFabricatedFight(composeFabricationShape(1, 8, 5));
    assertStrictEquals(duel.warriors.length, 2, "one a side is two combatants");
    assert(duel.warriors.every((one) => one.healthMaximum < 2000), "small pools at level 5");
    const replay = composeFightReplay({
        name: "duel",
        calls: duel.calls.map((call) => call.payload),
        hasSnapshot: false,
    });
    assertStrictEquals(
        getUnreadMessages(replay.statistics),
        0,
        "a message the panel could not read",
    );
    assertStrictEquals(replay.reading.messagesLost, 0, "a message the payload said it carried");
    const figures = [...replay.statistics.byCombatantId.values()];
    assert(figures.every((one) => one.damageDealtApplied > 0), "each of them dealt something");
    assert(figures.every((one) => one.turnsTaken > 0), "and each of them took a turn");
});

/**
 * No recording carries an escape, so the fabricator is the only place the panel's `ucieczka` can
 * be put in front of a browser at all. What it writes has to be the shape the client reads: the
 * combatant in the actor slot, and nothing named on the side the fight was won from.
 */
Deno.test("a fight the script breaks off states an escape and names no side", () => {
    const fled = composeFabricatedFight(composeFabricationShape(2, 6, 20, "fled"));
    const replay = composeFightReplay({
        name: "fled",
        calls: fled.calls.map((call) => call.payload),
        hasSnapshot: false,
    });
    assertStrictEquals(getUnreadMessages(replay.statistics), 0, "the escape leaves nothing unread");
    const outcome = replay.statistics.outcome;
    assertExists(outcome, "a fight broken off still says how it ended");
    assertStrictEquals(outcome.isFled, true, "and what it says is that somebody escaped");
    assertEquals(outcome.wonNames, [], "no side won it");
    assertEquals(outcome.lostNames, [], "and no side lost it");
    assertStrictEquals(outcome.isDrawn, false, "which is not the same claim as a draw");
});

Deno.test("the ending the script was not asked for is the one it has always written", () => {
    const outcome = REPLAY.statistics.outcome;
    assertExists(outcome, "the default fight ends the way it did before the flag existed");
    assertStrictEquals(outcome.isFled, false, "nobody escaped it");
    assert(outcome.wonNames.length > 0, "a side won it");
    assert(outcome.lostNames.length > 0, "and a side lost it");
    assertStrictEquals(composeShapeText(composeFabricationShape()), "10v10-lvl92-r26");
});

/** A reader taking a short fight for full coverage of the register reads a wrong conclusion. */
Deno.test("a fight says how far down the script it reached", () => {
    assertStrictEquals(FIGHT.actsReached, ACTS_SCRIPTED, "a long fight reaches every act");
    const duel = composeFabricatedFight(composeFabricationShape(1, 8, 5));
    assertStrictEquals(duel.actsReached, 16, "and one of sixteen turns reaches sixteen of them");
    assert(duel.actsReached < ACTS_SCRIPTED, "which is fewer than the script carries");
});

/** What both refusals say, whichever side the script's own figures left standing. */
const REFUSED_CLOSING = "no shout closes the fight";

/** The turns the published table dates, which is the only source stating a shout's length. */
const DATED = {
    turnsBySkillId: composeAuraTurnsBySkillId(FROZEN_AURA_TURNS.skills),
    shoutsBySkillId: composeShoutsBySkillId(FROZEN_AURA_TURNS.shouts),
};

/** Whom the fight left held at its last call, read the way the panel reads it. */
function getProvokedAtClose(fight: FabricatedFight, name: string) {
    const replay = composeFightReplay({
        name,
        calls: fight.calls.map((call) => call.payload),
        hasSnapshot: false,
    });
    const reading = replay.reading;
    return {
        replay,
        held: composeFightStandings(reading.events, DATED, reading.roster).provocations,
    };
}

/**
 * ⚠️ **Where the act rotation lands a shout is not a shape anybody chose.** Measured 2026-09-22 at
 * ten a side, level 92: the script reaches its shout once every 41 turns, so how many were still
 * held at the last call fell out of wherever the rounds stopped — 20 at 20 rounds, 10 at the
 * default 26, with nothing saying which. `MAXIMUM_PROVOKED` is the whole roster
 * (`src/ui/panel-standing.ts`) and the corpus cannot show it, so the fixture for it has to be
 * guaranteed rather than found.
 *
 * ⚠️ **The count alone does not prove the flag did it**, which is what mutating the call away
 * showed on 2026-09-22: at 20 rounds the rotation already ended on twenty, so the guard stayed
 * green with the two turns gone. The shape below is the default 26, where it does not — and the
 * last two turns are read for the shout itself, so this bites whatever the rotation later does.
 */
Deno.test("a fight closing on shouts leaves everybody on the board held", () => {
    const shape = composeFabricationShape(10, DEFAULT_ROUNDS, 92, "settled", true);
    const fight = composeFabricatedFight(shape);
    const shouted = fight.calls.slice(-1 - CLOSING_SHOUTS, -1);
    assertStrictEquals(shouted.length, CLOSING_SHOUTS, "two turns stand before the closing call");
    assert(
        shouted.every((call) => call.messages.some((one) => one.includes(`${PROVOCATION_KEY}=`))),
        "and each of them is spent on a shout",
    );
    const { replay, held } = getProvokedAtClose(fight, "shouted");
    assertStrictEquals(replay.roster.byId.size, MAXIMUM_COMBATANTS, "a ten-a-side fields twenty");
    assertStrictEquals(held.length, MAXIMUM_COMBATANTS, "and closes with each of them held");
    assertStrictEquals(
        new Set(held.map((one) => one.provokedId)).size,
        MAXIMUM_COMBATANTS,
        "each of them once, nobody twice",
    );
    const casters = new Set(held.map((one) => one.casterId));
    assertStrictEquals(casters.size, 2, "by two shouters");
    const sides = new Set([...casters].map((id) => replay.roster.byId.get(id)?.side));
    assertStrictEquals(sides.size, 2, "one on each side, which is what holds both of them at once");
    assertStrictEquals(getUnreadMessages(replay.statistics), 0, "and the two turns read clean");
    assertStrictEquals(replay.reading.messagesLost, 0, "with no message the payload said it had");
});

/**
 * The boundary from the other side (**W5**): the smallest board there is. What the flag promises is
 * everybody, not twenty — a guard pinned to twenty would pass a duel that held nobody.
 */
Deno.test("the smallest board closes on shouts holding both of its own", () => {
    const duel = composeFabricatedFight(composeFabricationShape(1, 8, 5, "settled", true));
    const { replay, held } = getProvokedAtClose(duel, "shouted duel");
    assertStrictEquals(replay.roster.byId.size, 2, "one a side is two combatants");
    assertStrictEquals(held.length, 2, "and both of them end the fight held");
    assertStrictEquals(new Set(held.map((one) => one.casterId)).size, 2, "each by the other");
});

/**
 * A side nobody is left on shouts at nobody and is shouted at by nobody. Refused rather than
 * closed on one shout, which would write a file that looks like it closed on two.
 *
 * ⚠️ **Which side the script wipes is its own arithmetic and not a promise**, so the refusal is
 * read by what it refuses rather than by the side it names — a figure moving elsewhere in the
 * script would otherwise redden this over nothing.
 */
Deno.test("a shape whose fight wipes a side is refused the closing shouts", () => {
    assertThrows(
        () => composeFabricatedFight(composeFabricationShape(1, 40, 5, "settled", true)),
        FabricatedFightError,
        REFUSED_CLOSING,
    );
    assertThrows(
        () => composeFabricatedFight(composeFabricationShape(5, 60, 92, "settled", true)),
        FabricatedFightError,
        REFUSED_CLOSING,
    );
    const duel = composeFabricatedFight(composeFabricationShape(1, 8, 5, "settled", true));
    assert(duel.calls.length > 0, "and a fight both sides come out of is composed");
});

Deno.test("a fight closing on shouts says so in its shape, and the default says nothing", () => {
    assertStrictEquals(
        composeShapeText(composeFabricationShape(10, 26, 92, "settled", true)),
        "10v10-lvl92-r26-shouts",
    );
    assertStrictEquals(
        composeShapeText(composeFabricationShape(2, 6, 20, "fled", true)),
        "2v2-lvl20-r6-fled-shouts",
    );
    assertStrictEquals(
        composeShapeText(composeFabricationShape()),
        "10v10-lvl92-r26",
        "and a shape nobody asked it of carries no word of it",
    );
    assertStrictEquals(
        composeFabricatedFight(composeFabricationShape(10, DEFAULT_ROUNDS, 92, "settled", true))
            .calls.length - composeFabricatedFight().calls.length,
        CLOSING_SHOUTS,
        "the flag adds the two turns and nothing else, so an old file is byte-identical",
    );
});
