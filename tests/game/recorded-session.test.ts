/**
 * The recordings run the add-on's own way: every call through the envelope, then into the session.
 *
 * The cast comes off the payloads here, as the add-on reads it, and never off the snapshots. That
 * is the difference that matters for the one recording whose calls carry no snapshot at all.
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import { decodePayloadMessages } from "#/src/core/fight-decoder.ts";
import {
    commitPayload,
    type FightSession,
    type FightView,
    getFightView,
    initFightSession,
    preparePayload,
    SESSION_OPTIONS,
} from "#/src/core/fight-session.ts";
import { readPayloadEnvelope } from "#/src/game/payload-envelope.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import {
    lookupRecordedFight,
    readRecordedFights,
    type RecordedFight,
    replayRecordedFight,
} from "#/tests/recorded-fights.ts";

/** A recording whose calls carry no snapshot, so its cast can only come from a payload. */
const NO_SNAPSHOTS =
    "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json";

function view(session: FightSession, path: string): FightView {
    const found = getFightView(session);
    assertExists(found, `${path}: the replay produced a fight`);
    return found;
}

function apply(session: FightSession, update: unknown, path: string): void {
    const record = readPayloadEnvelope(update);
    assert(record.ok, `${path}: a call is read by the envelope`);
    const prepared = preparePayload(session, record.value, BLOWS_GRANTED);
    assert(prepared.ok, `${path}: and is inside every bound`);
    commitPayload(session, prepared.value);
}

/** The fight after every call, in order, as the panel would have read it. */
function replayEach(fight: RecordedFight, visit: (view: FightView) => void): void {
    const session = initFightSession(SESSION_OPTIONS);
    for (const update of fight.updates) {
        apply(session, update, fight.path);
        visit(view(session, fight.path));
    }
}

Deno.test("a recording replayed call by call reads as the whole of itself", () => {
    for (const fight of readRecordedFights()) {
        const replayed = view(replayRecordedFight(fight), fight.path);
        const context = { roster: replayed.roster, standing: null, tables: BLOWS_GRANTED };
        const decoded = fight.payloads.flatMap((one) => decodePayloadMessages(one, context).events);
        assertEquals(replayed.events, decoded, `${fight.path}: the session lost or invented one`);
        assertStrictEquals(replayed.payloadsApplied, fight.updates.length, `${fight.path}: every`);
        assert(replayed.isOver, `${fight.path}: every recording carries the end of its fight`);
    }
});

Deno.test("a fight that opens replaces the one standing before it", () => {
    const [first, second] = readRecordedFights();
    assert(first !== undefined, "a first recording to run");
    assert(second !== undefined, "and a second to run after it");
    const session = replayRecordedFight(first);
    for (const update of second.updates) apply(session, update, second.path);
    const replaced = view(session, second.path);
    assertStrictEquals(replaced.payloadsApplied, second.updates.length, "only the second");
    const alone = view(replayRecordedFight(second), second.path);
    assertEquals(replaced.events, alone.events, "and it reads as it would alone");
});

Deno.test("every recording is read whole, by the count the payloads themselves state", () => {
    for (const fight of readRecordedFights()) {
        const replayed = view(replayRecordedFight(fight), fight.path);
        assertStrictEquals(replayed.messagesLost, 0, `${fight.path}: a stated message went unread`);
        assertStrictEquals(replayed.messagesRead, fight.messages.length, `${fight.path}: all read`);
    }
});

Deno.test("a fight whose calls carry no snapshot still has a cast", () => {
    const fight = lookupRecordedFight(NO_SNAPSHOTS);
    const replayed = view(replayRecordedFight(fight), fight.path);
    assertEquals(fight.combatants.length, 0, "the snapshots state nobody");
    assertEquals(replayed.roster.byId.size, 3, "and the opening payload states all three");
    const placed = replayed.events.filter((event) =>
        event.kind === "damage-to-named-combatant" && event.targetId !== null
    );
    assertEquals(placed.length, 1, "so the figure stated against a name lands on somebody");
});

/**
 * ⚠️ **Which side, and not that it is the first.** Every recording until 2026-09-09 was written
 * from side 1, and a test asserting the `1` passed for the wrong reason until one written from side
 * 2 showed the difference.
 */
Deno.test("every recording states its reader's side, on the payload that opens the fight", () => {
    const sides = new Set<number>();
    for (const fight of readRecordedFights()) {
        const opening = readPayloadEnvelope(fight.updates[0]);
        assert(opening.ok, `${fight.path}: the opening call is read`);
        const readerSide = opening.value.readerSide;
        assertExists(readerSide, `${fight.path}: the opening payload states the reader's own side`);
        assert(readerSide === 1 || readerSide === 2, `${fight.path}: one of the two sides`);
        sides.add(readerSide);
    }
    assertEquals([...sides].sort(), [1, 2], "the corpus is written from both sides of a fight");
});

/** `develop ADR 0072`: read both ways, so a reader that stopped finding either fails loudly. */
Deno.test("no recording states a fight the game runs itself and a turn at once", () => {
    let running = 0;
    let numbered = 0;
    for (const fight of readRecordedFights()) {
        for (const update of fight.updates) {
            const record = readPayloadEnvelope(update);
            assert(record.ok, `${fight.path}: a call is read`);
            if (record.value.isOnAuto !== true) {
                if (record.value.turnStatement !== null) numbered += 1;
                continue;
            }
            running += 1;
            assertEquals(record.value.turnStatement, null, `${fight.path}: numbers no turn`);
        }
    }
    assert(running > 0, "the corpus carries payloads stating a fight the game ran itself");
    assert(numbered > 0, "and payloads where it numbered a turn instead");
});

Deno.test("no recording is a fight joined in progress, and each says so", () => {
    for (const fight of readRecordedFights()) {
        const replayed = view(replayRecordedFight(fight), fight.path);
        assertStrictEquals(replayed.hasJoinedInProgress, false, `${fight.path}: opened here`);
    }
});

/**
 * The join between the payload's own mask and the walk that times it: the one thing neither the
 * core test nor the envelope test can see, because each is handed what the other would pass.
 */
Deno.test("what the payloads said somebody carries reaches the view", () => {
    let carrying = 0;
    for (const fight of readRecordedFights()) {
        const replayed = view(replayRecordedFight(fight), fight.path);
        if (replayed.carriedStatuses.length > 0) carrying += 1;
        for (const one of replayed.carriedStatuses) {
            assert(one.turnsElapsed >= 0, `${fight.path}: a status stands for turns that passed`);
            assert(one.bit >= 0, `${fight.path}: and at a position in the mask`);
        }
    }
    assert(carrying > 0, "somebody in the corpus is carrying something the game stated");
});

/**
 * ⚠️ **A bonus that fires once a fight fires once a fight, not once a session.** A fight that opens
 * has to take the walk away, or a rescue spent in one fight reads as spent in every one after it.
 */
Deno.test("a fight that opens takes the legendary bonuses of the one before it away", () => {
    const carried = readRecordedFights().find((fight) =>
        view(replayRecordedFight(fight), fight.path).legendaryStandings.length > 0
    );
    assertExists(carried, "a recording where one of the two bonuses stands at the end");
    const session = replayRecordedFight(carried);
    apply(session, { init: 1, m: ["0;0;txt=a"] }, carried.path);
    const after = view(session, carried.path);
    assertEquals(after.legendaryStandings, [], "the new fight holds none of them");
    assertEquals(after.carriedStatuses, [], "nor any status, which is reset the same way");
});

/**
 * ⚠️ **The walk is tested on heals it composes itself**, so a key spelled one way there and another
 * by the decoder passes green while no heal is ever counted. This is the seam: every recording,
 * call by call, must show a run at each count under the bound, and never at the bound.
 */
Deno.test("Dotyk anioła counts the heals the decoder reads, over every recording", () => {
    const counts = new Set<number>();
    for (const fight of readRecordedFights()) {
        replayEach(fight, (replayed) => {
            for (const one of replayed.legendaryStandings) {
                if (one.holytouchHealsGiven !== null) counts.add(one.holytouchHealsGiven);
            }
        });
    }
    assertEquals([...counts].sort(), [0, 1, 2], "every count under three, and three never");
});

/**
 * What is held is the **shape**: a charge never runs past what the game says it runs for, a mark
 * never outlives the turn it was made on, and the two ends the protocol names are the only two.
 */
Deno.test("every recording states charges the panel can hold", () => {
    const states = { charging: 0, struck: 0, broken: 0 };
    for (const fight of readRecordedFights()) {
        replayEach(fight, (replayed) => {
            const ordinal = replayed.turnStatement?.ordinal ?? null;
            for (const held of replayed.chargedSkills) {
                assert(held.turnsElapsed >= 0, `${fight.path}: a charge runs no fewer than none`);
                assert(held.turnsElapsed <= held.turnsStated, `${fight.path}: nor past its own`);
                assert(held.skillName.length > 0, `${fight.path}: it names the blow`);
                states[held.state] += 1;
                if (held.state === "charging") {
                    assertStrictEquals(held.endedAtOrdinal, null, `${fight.path}: no end yet`);
                    continue;
                }
                if (held.endedAtOrdinal === null) continue;
                if (ordinal === null) continue;
                assert(ordinal <= held.endedAtOrdinal, `${fight.path}: a mark outlived its turn`);
            }
        });
    }
    assert(states.charging > 0, "the corpus states charges the panel would draw");
    assert(states.struck > 0, "blows that landed");
    assert(states.broken > 0, "and blows that were taken away");
});
