/**
 * What the fabricated fight is worth, against `docs/protocol-keys.md` and against this tree's
 * readers.
 *
 * The fight is composed here and never written to disk: a guard that needed the file would be a
 * guard that only runs where somebody has already run the tool. What it holds is the reason the
 * tool exists — every key the register calls `decoded` is stated at least once — and that the
 * text it writes is read back as a recording is, through the runtime's chain, with nothing unread.
 */

import { assert, assertEquals, assertExists, assertStrictEquals, assertThrows } from "@std/assert";
import { parseJson } from "#/libs/json-text.ts";
import { getNumberField, isRecord } from "#/libs/unknown-value.ts";
import { replayFightStandings } from "#/src/core/aura-standing.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { SESSION_OPTIONS } from "#/src/core/fight-session.ts";
import { countUnreadMessages } from "#/src/core/fight-statistics.ts";
import { PROVOCATION_KEY } from "#/src/core/protocol-key.ts";
import { parseProtocolMessage } from "#/src/core/protocol-message.ts";
import { FILE_FIELD } from "#/src/runtime/fight-file.ts";
import { replayFightPayloads } from "#/src/runtime/fight-reading.ts";
import { composeRuntimeTables } from "#/src/userscript-entry.ts";
import { readRecordedFight, type RecordedFight } from "#/tests/recorded-fights.ts";
import {
    CLOSING_SHOUTS,
    createFabricatedFight,
    encodeFabricatedFight,
    FABRICATED_DIRECTORY,
    FABRICATED_WORLD,
    type FabricatedFight,
    FABRICATION_ENDING,
    FABRICATION_FIELDS,
    formatFabricationShape,
    isFabricatedPath,
    requireFabricationShape,
} from "#/tools/fabricated-fight.ts";
import { REGISTER_PATH } from "#/tools/help-claim-register.ts";
import { FabricatedFightError } from "#/tools/margometer-tool-error.ts";
import { DAMAGE_FAMILY_HEADING, parseRegisteredKeys } from "#/tools/protocol-key-shape.ts";
import {
    DECODER_TABLES,
    type ReplayedFight,
    replayRecordedMaterial,
} from "#/tools/recorded-material.ts";
import { composeTurnGrades, TURN_VERDICT, WITNESS_KEYS } from "#/tools/turn-count.ts";

const DECODED_VERDICT = "decoded";
/** What the script holds, read off the fight that reaches all of it rather than stated here. */
const ACTS_SCRIPTED = 41;
/** The rounds a shape nobody argued with runs, read off that shape rather than spelled again. */
const DEFAULT_ROUNDS = requireFabricationShape().rounds;
/** What both refusals say, whichever side the script's own figures left standing. */
const REFUSED_CLOSING = "no shout closes the fight";
const STATED_SKILLS = composeRuntimeTables().tooltip.statedSkills;

/**
 * A key the register calls `decoded` that no message can state, each with why. The list is the
 * one way past this guard, so an entry without a reason is an entry that should not be here.
 */
const NOT_A_MESSAGE_KEY: Record<string, string> = {
    [DAMAGE_FAMILY_HEADING]: "a family read by shape, and no key a message ever writes",
};

const FIGHT = createFabricatedFight();
/**
 * Both endings, because the register's decoded keys are spread across them: `flee` is stated by
 * one and `winner`/`loser` by the other, and no single fight puts all three in front of anybody.
 */
const FLED = createFabricatedFight(requireFabricationShape(2, 6, 20, FABRICATION_ENDING.fled));
const DUEL = createFabricatedFight(requireFabricationShape(1, 8, 5));
const REPLAY = replayFabricatedFight(FIGHT, "fabricated");

Deno.test("what the fabricator writes states every key the register calls decoded", () => {
    const registered = parseRegisteredKeys(Deno.readTextFileSync(REGISTER_PATH));
    assert(registered.length > 0, "the register names keys");
    const messages = [...FIGHT.calls, ...FLED.calls].flatMap((call) => call.messages);
    const stated = new Set(messages.flatMap(readMessageKeys));
    assert(stated.size > 0, "and the fabricated fight states keys of its own");
    const unstated = registered
        .filter((entry) => entry.verdict === DECODED_VERDICT)
        .filter((entry) => !(entry.key in NOT_A_MESSAGE_KEY))
        .filter((entry) => !stated.has(entry.key))
        .map((entry) => entry.key);
    assertEquals(unstated, [], "a decoded key the fabricated fight never puts in front of anybody");
});

/** The keys one message states, off the grammar the decoder reads it by. */
function readMessageKeys(message: string): string[] {
    const parsed = parseProtocolMessage(message);
    assert(parsed.ok, `${message} is a message the grammar reads`);
    return parsed.value.parameters.map((parameter) => parameter.key);
}

Deno.test("every exemption names a key the register really carries", () => {
    const registered = parseRegisteredKeys(Deno.readTextFileSync(REGISTER_PATH));
    const keys = new Set(registered.map((entry) => entry.key));
    const gone = Object.keys(NOT_A_MESSAGE_KEY).filter((key) => !keys.has(key));
    assertEquals(gone, [], "an exemption for a key the register no longer names");
    const reasons = Object.values(NOT_A_MESSAGE_KEY).filter((reason) => reason.length === 0);
    assertEquals(reasons, [], "an exemption carrying no reason");
});

Deno.test("the fabricated fight goes through the chain with nothing left unread", () => {
    const view = REPLAY.reading.view;
    assertStrictEquals(countUnreadMessages(REPLAY.reading.figures.statistics), 0, "unread");
    assertStrictEquals(view.messagesLost, 0, "a message the payload said it carried");
    assert(view.isOver, "and the fight it composed reached its end");
    assert(!view.hasJoinedInProgress, "and was read from its own opening");
});

Deno.test("the fabricated fight fields ten players against ten", () => {
    const view = REPLAY.reading.view;
    const combatants = [...view.roster.byId.values()];
    assertStrictEquals(combatants.length, COMBATANTS_MAXIMUM, "a fabricated fight fields twenty");
    assertStrictEquals(view.readerSide, 1, "and states which side the reader is on");
    const ours = combatants.filter((one) => one.side === view.readerSide);
    assertStrictEquals(ours.length, 10, "ten of them ours");
    assertStrictEquals(combatants.length - ours.length, 10, "and ten of them theirs");
    const professions = new Set(combatants.map((one) => one.profession));
    assert(professions.size >= 4, "across more than one profession");
});

Deno.test("the fabricated fight puts something in every part of the panel", () => {
    const statistics = REPLAY.reading.figures.statistics;
    assert(statistics.outcome !== null, "a fight that ended says who won it");
    const figures = [...statistics.byCombatantId.values()];
    assertStrictEquals(figures.length, COMBATANTS_MAXIMUM, "and a figure for every combatant");
    assert(figures.every((one) => one.damageDealtApplied > 0), "each of whom dealt something");
    assert(figures.every((one) => one.damageTakenApplied > 0), "and each of whom took something");
    assert(figures.every((one) => one.turnsTaken > 0), "and each of whom took a turn");
    assert(figures.some((one) => one.healthGiven > 0), "somebody restored somebody else");
    assert(figures.some((one) => one.turnsLost > 0), "and somebody spent a turn on nothing");
    assert(figures.some((one) => one.blowsCritical > 0), "and somebody struck a critical blow");
    assert(figures.some((one) => one.skills.size > 0), "and somebody was named under a skill");
    assert(statistics.totals.damagePrevented > 0, "the fight prevented something");
    // The four the corpus cannot show. Two of them reach a pinned row, and two reach no row at
    // all — which is the only place they can be looked at (`develop ADR 0082`, `CONTEXT.md`).
    assert(statistics.dealtByNobody > 0, "somebody was struck by nobody the game named");
    assert(statistics.takenByNobody > 0, "and somebody struck nobody it named");
    assert(statistics.byNeitherEnd > 0, "health went out with neither end named");
    assert(statistics.restoredToNobody > 0, "and came back to nobody named either");
});

/**
 * The client's keys the fabricator spells for want of an exported map (N13), held to the reader
 * that takes each: the health maximum and the charge to `src/game/engine-warrior.ts`, the witness
 * of the turn to `tools/turn-count.ts`. A misspelt one reads as a field the game did not send.
 */
Deno.test("every key the fabricator spells on its own is one a reader here takes", () => {
    const roster = REPLAY.reading.view.roster;
    for (const warrior of FIGHT.warriors) {
        const read = roster.byId.get(warrior.id);
        assertExists(read, `${warrior.name} is in the roster`);
        assertStrictEquals(read.healthMaximum, warrior.healthMaximum, "at the maximum it states");
    }
    const opening = replayFightPayloads([FIGHT.calls[0]!.payload], DECODER_TABLES, SESSION_OPTIONS);
    assert(opening.ok, "the opening is a call the chain reads");
    assertExists(opening.value, "and opens a fight");
    assertStrictEquals(opening.value.view.chargedSkills.length, 1, "with one skill charging");
    // A payload naming no holder is passed over by the grading, so the witness is counted here.
    const witnessed = DUEL.calls.filter((call) => {
        const holder = getNumberField(call.payload, WITNESS_KEYS, "holder");
        return holder.ok && holder.value !== null;
    });
    assertStrictEquals(witnessed.length, DUEL.calls.length - 1, "each call but the last names one");
    const [grade] = composeTurnGrades([readFabricatedFight(DUEL, "duel")]);
    assertExists(grade, "the duel is graded against the game's own numbering");
    assertStrictEquals(grade.verdict, TURN_VERDICT.always, "and every turn lands where it says");
});

/** The fight as the file a reader would open, read back the way a tool reads a recording. */
function readFabricatedFight(fight: FabricatedFight, name: string): RecordedFight {
    const document = parseJson(encodeFabricatedFight(fight));
    assert(document.ok, "a fabricated fight is written as JSON");
    return readRecordedFight(`${FABRICATED_DIRECTORY}/${name}.json`, document.value);
}

Deno.test("a fabricated fight is written only where git is told not to look", () => {
    assert(isFabricatedPath("fabricated/10v10-long.json"), "the directory git ignores");
    assert(!isFabricatedPath("captures/10v10-long.json"), "and never the evidence directory");
    assert(!isFabricatedPath("fabricated.json"), "nor a file merely named after it");
    assert(!isFabricatedPath("fabricated/../captures/x.json"), "nor a path climbing out of it");
});

Deno.test("the file a fabricated fight is written as says so three times over", () => {
    const document = parseJson(encodeFabricatedFight(FIGHT));
    assert(document.ok, "the file is JSON");
    assert(isRecord(document.value), "and an envelope");
    const envelope = document.value;
    assertStrictEquals(envelope[FABRICATION_FIELDS.isFabricated], true, "the envelope says so");
    assertStrictEquals(envelope[FILE_FIELD.world], FABRICATED_WORLD, "the world it states says so");
    assert(`${envelope[FABRICATION_FIELDS.fabricatedBy]}`.length > 0, "and what wrote it is named");
    assertStrictEquals(envelope[FILE_FIELD.gameBuild], null, "it came off no build");
});

Deno.test("a shape past what a roster or a recording holds is refused, not composed", () => {
    assertThrows(
        () => requireFabricationShape(11),
        FabricatedFightError,
        "is not between 1 and 10",
    );
    assertThrows(() => requireFabricationShape(0), FabricatedFightError, "is not between 1 and 10");
    assertThrows(() => requireFabricationShape(1, 26, 0), FabricatedFightError, "level 0");
    assertThrows(() => requireFabricationShape(1, 0), FabricatedFightError, "0 rounds");
    assertThrows(
        () => requireFabricationShape(10, 200),
        FabricatedFightError,
        "past the 2000 a recording is read within",
    );
    assertStrictEquals(requireFabricationShape(1, 1, 1).perSide, 1, "and one a side is a fight");
    assertStrictEquals(requireFabricationShape(10, 99).rounds, 99, "and 1982 calls is one too");
});

Deno.test("the shape a fight was composed at is readable off the shape itself", () => {
    assertStrictEquals(formatFabricationShape(requireFabricationShape()), "10v10-lvl92-r26");
    assertStrictEquals(formatFabricationShape(requireFabricationShape(1, 8, 5)), "1v1-lvl5-r8");
    assertStrictEquals(
        requireFabricationShape().scale,
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
    assertStrictEquals(DUEL.warriors.length, 2, "one a side is two combatants");
    assert(DUEL.warriors.every((one) => one.healthMaximum < 2000), "small pools at level 5");
    const replay = replayFabricatedFight(DUEL, "duel");
    const statistics = replay.reading.figures.statistics;
    assertStrictEquals(countUnreadMessages(statistics), 0, "a message the panel could not read");
    assertStrictEquals(replay.reading.view.messagesLost, 0, "a message the payload carried");
    const figures = [...statistics.byCombatantId.values()];
    assert(figures.every((one) => one.damageDealtApplied > 0), "each of them dealt something");
    assert(figures.every((one) => one.turnsTaken > 0), "and each of them took a turn");
});

function replayFabricatedFight(fight: FabricatedFight, name: string): ReplayedFight {
    const recorded = readFabricatedFight(fight, name);
    const [replayed] = replayRecordedMaterial({ material: name, fights: [recorded] });
    assertExists(replayed, "a fabricated fight is replayed as a recording is");
    return replayed;
}

/**
 * No recording carries an escape, so the fabricator is the only place the panel's `ucieczka` can
 * be put in front of a browser at all. What it writes has to be the shape the client reads: the
 * combatant in the actor slot, and nothing named on the side the fight was won from.
 */
Deno.test("a fight the script breaks off states an escape and names no side", () => {
    const replay = replayFabricatedFight(FLED, "fled");
    const statistics = replay.reading.figures.statistics;
    assertStrictEquals(countUnreadMessages(statistics), 0, "the escape leaves nothing unread");
    const outcome = statistics.outcome;
    assertExists(outcome, "a fight broken off still says how it ended");
    assertStrictEquals(outcome.isFled, true, "and what it says is that somebody escaped");
    assertEquals(outcome.wonNames, [], "no side won it");
    assertEquals(outcome.lostNames, [], "and no side lost it");
    assertStrictEquals(outcome.isDrawn, false, "which is not the same claim as a draw");
});

Deno.test("the ending nobody asked for is a side winning and a side losing", () => {
    const outcome = REPLAY.reading.figures.statistics.outcome;
    assertExists(outcome, "the default fight says how it ended");
    assertStrictEquals(outcome.isFled, false, "nobody escaped it");
    assert(outcome.wonNames.length > 0, "a side won it");
    assert(outcome.lostNames.length > 0, "and a side lost it");
});

/** A reader taking a short fight for full coverage of the register reads a wrong conclusion. */
Deno.test("a fight says how far down the script it reached", () => {
    assertStrictEquals(FIGHT.actsReached, ACTS_SCRIPTED, "a long fight reaches every act");
    assertStrictEquals(DUEL.actsReached, 16, "and one of sixteen turns reaches sixteen of them");
    assert(DUEL.actsReached < ACTS_SCRIPTED, "which is fewer than the script carries");
});

/**
 * ⚠️ **Where the act rotation lands a shout is not a shape anybody chose.** Measured 2026-09-22 at
 * ten a side, level 92: the script reaches its shout once every 41 turns, so how many were still
 * held at the last call fell out of wherever the rounds stopped — 20 at 20 rounds, 10 at the
 * default 26, with nothing saying which. `PROVOKED_MAXIMUM` is the whole roster
 * (`src/ui/panel-standing.ts`) and the corpus cannot show it, so the fixture for it has to be
 * guaranteed rather than found.
 *
 * ⚠️ **The count alone does not prove the flag did it**: at 20 rounds the rotation already ended on
 * twenty, so a guard there stays green with the two turns gone. The shape below is the default 26,
 * where it does not — and the last two turns are read for the shout itself.
 */
Deno.test("a fight closing on shouts leaves everybody on the board held", () => {
    const shape = requireFabricationShape(10, DEFAULT_ROUNDS, 92, FABRICATION_ENDING.settled, true);
    const fight = createFabricatedFight(shape);
    const shouted = fight.calls.slice(-1 - CLOSING_SHOUTS, -1);
    assertStrictEquals(shouted.length, CLOSING_SHOUTS, "two turns stand before the closing call");
    assert(
        shouted.every((call) => call.messages.some((one) => one.includes(`${PROVOCATION_KEY}=`))),
        "and each of them is spent on a shout",
    );
    const { replay, held } = readProvokedAtClose(fight, "shouted");
    const roster = replay.reading.view.roster;
    assertStrictEquals(roster.byId.size, COMBATANTS_MAXIMUM, "a ten-a-side fields twenty");
    assertStrictEquals(held.length, COMBATANTS_MAXIMUM, "and closes with each of them held");
    const provoked = new Set(held.map((one) => one.provokedId));
    assertStrictEquals(provoked.size, COMBATANTS_MAXIMUM, "each of them once, nobody twice");
    const casters = new Set(held.map((one) => one.casterId));
    assertStrictEquals(casters.size, 2, "by two shouters");
    const sides = new Set([...casters].map((id) => roster.byId.get(id)?.side));
    assertStrictEquals(sides.size, 2, "one on each side, which is what holds both of them at once");
    const statistics = replay.reading.figures.statistics;
    assertStrictEquals(countUnreadMessages(statistics), 0, "and the two turns read clean");
    assertStrictEquals(replay.reading.view.messagesLost, 0, "with no message lost");
});

/** Whom the fight left held at its last call, read the way the panel reads it. */
function readProvokedAtClose(fight: FabricatedFight, name: string) {
    const replay = replayFabricatedFight(fight, name);
    const held = replayFightStandings(replay.reading.view, STATED_SKILLS).provocations;
    return { replay, held };
}

/**
 * The boundary from the other side (**W5**): the smallest board there is. What the flag promises is
 * everybody, not twenty — a guard pinned to twenty would pass a duel that held nobody.
 */
Deno.test("the smallest board closes on shouts holding both of its own", () => {
    const shape = requireFabricationShape(1, 8, 5, FABRICATION_ENDING.settled, true);
    const { replay, held } = readProvokedAtClose(createFabricatedFight(shape), "shouted duel");
    assertStrictEquals(replay.reading.view.roster.byId.size, 2, "one a side is two combatants");
    assertStrictEquals(held.length, 2, "and both of them end the fight held");
    assertStrictEquals(new Set(held.map((one) => one.casterId)).size, 2, "each by the other");
});

/**
 * A side nobody is left on shouts at nobody and is shouted at by nobody. Refused rather than
 * closed on one shout, which would write a file that looks like it closed on two. ⚠️ **Which side
 * the script wipes is its own arithmetic and not a promise**, so the refusal is read by what it
 * refuses rather than by the side it names.
 */
Deno.test("a shape whose fight wipes a side is refused the closing shouts", () => {
    const settled = FABRICATION_ENDING.settled;
    assertThrows(
        () => createFabricatedFight(requireFabricationShape(1, 40, 5, settled, true)),
        FabricatedFightError,
        REFUSED_CLOSING,
    );
    assertThrows(
        () => createFabricatedFight(requireFabricationShape(5, 60, 92, settled, true)),
        FabricatedFightError,
        REFUSED_CLOSING,
    );
    const duel = createFabricatedFight(requireFabricationShape(1, 8, 5, settled, true));
    assert(duel.calls.length > 0, "and a fight both sides come out of is composed");
});

Deno.test("a fight closing on shouts says so in its shape, and the default says nothing", () => {
    const settled = FABRICATION_ENDING.settled;
    const fled = FABRICATION_ENDING.fled;
    assertStrictEquals(
        formatFabricationShape(requireFabricationShape(10, 26, 92, settled, true)),
        "10v10-lvl92-r26-shouts",
    );
    assertStrictEquals(
        formatFabricationShape(requireFabricationShape(2, 6, 20, fled, true)),
        "2v2-lvl20-r6-fled-shouts",
    );
    assertStrictEquals(
        createFabricatedFight(requireFabricationShape(10, DEFAULT_ROUNDS, 92, settled, true))
            .calls.length - FIGHT.calls.length,
        CLOSING_SHOUTS,
        "the flag adds the two turns and nothing else, so a fight without it is the same fight",
    );
});
