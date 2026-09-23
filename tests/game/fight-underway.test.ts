/**
 * A fight assembled the way the game delivers it: one payload at a time, in order.
 *
 * The recordings hold every call the engine made, so a session fed from them is the add-on's own
 * path end to end — the roster comes from the payloads rather than from the snapshots, which is
 * the difference that matters in the last test here.
 */

import {
    assert,
    assertEquals,
    assertExists,
    assertFalse,
    assertNotStrictEquals,
    assertThrows,
} from "@std/assert";
import { AssertionError } from "@std/assert/assertion-error";
import { composeCombatantRoster, MAXIMUM_COMBATANTS } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages, MAXIMUM_MESSAGES } from "@/src/core/fight-decoder.ts";
import {
    addPayloadToFight,
    composeFightUnderway,
    getReadingFromFight,
    readTurnStatement,
} from "@/src/game/fight-underway.ts";
import {
    BLOWS_GRANTED,
    getRecordedCombatants,
    getRecordedEngineUpdates,
    getRecordedPayloads,
    readRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** The one recording whose calls carry no snapshot, so its roster can only come from a payload. */
const NO_SNAPSHOTS =
    "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json";

function replay(path: string) {
    const underway = composeFightUnderway();
    for (const update of getRecordedEngineUpdates(path)) {
        addPayloadToFight(underway, update, BLOWS_GRANTED);
    }
    return getReadingFromFight(underway);
}

Deno.test("a fight nobody has seen is not a fight holding nothing", () => {
    assertEquals(getReadingFromFight(composeFightUnderway()), null, "there is no fight to read");
    const underway = composeFightUnderway();
    addPayloadToFight(underway, null, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway), null, "and what is not a payload starts none");
    // A list is an object to `typeof`, so one reaching here would open a fight nobody fought.
    addPayloadToFight(underway, ["0;0;txt=a"], BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway), null, "a list is not a payload either");
});

Deno.test("a recording replayed call by call reads as the whole of itself", () => {
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        let decoded = 0;
        for (const payload of getRecordedPayloads(path)) {
            decoded += decodeFightMessages(payload, roster, BLOWS_GRANTED).length;
        }
        const fight = replay(path);
        assertExists(fight, `${path}: the replay produced a fight`);
        assertEquals(fight.events.length, decoded, `${path}: the session lost or invented one`);
        assertEquals(fight.payloads, getRecordedEngineUpdates(path).length, `${path}: every call`);
        assert(fight.isOver, `${path}: every recording carries the end of its fight`);
    }
});

Deno.test("a fight that opens replaces the one standing before it", () => {
    const [first, second] = readRecordingPaths();
    assert(first !== undefined, "a first recording to run");
    assert(second !== undefined, "and a second to run after it");
    const underway = composeFightUnderway();
    for (const update of getRecordedEngineUpdates(first)) {
        addPayloadToFight(underway, update, BLOWS_GRANTED);
    }
    const opened = getReadingFromFight(underway);
    for (const update of getRecordedEngineUpdates(second)) {
        addPayloadToFight(underway, update, BLOWS_GRANTED);
    }
    const replaced = getReadingFromFight(underway);
    assert(opened !== null, "the fight that opened was read");
    assert(replaced !== null, "and so was the one that replaced it");
    assertEquals(replaced.payloads, getRecordedEngineUpdates(second).length, "only the second");
    const alone = replay(second);
    assertEquals(replaced.events.length, alone?.events.length, "and it reads as it would alone");
});

Deno.test("a payload says how many messages it carried, and the count is held to it", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(
        underway,
        { init: 1, mi: [0, 0, 0], m: ["0;0;txt=a", "0;0;txt=b"] },
        BLOWS_GRANTED,
    );
    assertEquals(getReadingFromFight(underway)?.messagesLost, 1, "one was stated and not read");

    const renamed = composeFightUnderway();
    addPayloadToFight(
        renamed,
        { init: 1, mi: [0, 0], messages: ["0;0;txt=a", "0;0;txt=b"] },
        BLOWS_GRANTED,
    );
    assertEquals(getReadingFromFight(renamed)?.messagesLost, 2, "a rename of `m` is caught whole");

    const witnessGone = composeFightUnderway();
    addPayloadToFight(witnessGone, { init: 1, m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(witnessGone)?.messagesLost, 0, "and a lost witness is silent");

    // Two calls, each losing one: what is lost accumulates across a fight rather than standing
    // for whatever the last payload happened to lose.
    addPayloadToFight(underway, { mi: [0, 0], m: ["0;0;txt=c"] }, BLOWS_GRANTED);
    assertEquals(
        getReadingFromFight(underway)?.messagesLost,
        2,
        "and every call adds to the count",
    );
});

/**
 * A count of what could not be read says whether to act on it only against what it is out of, so
 * the reading counts what it took beside what it lost. Counted as it goes rather than walked for
 * at draw time: the panel redraws per payload. **ADR 0070.**
 */
Deno.test("a reading counts what it took, beside what it never got", () => {
    const underway = composeFightUnderway();
    assertEquals(getReadingFromFight(underway), null, "a fight nobody has seen has no count");

    addPayloadToFight(
        underway,
        { init: 1, mi: [0, 0, 0], m: ["0;0;txt=a", "0;0;txt=b"] },
        BLOWS_GRANTED,
    );
    assertEquals(getReadingFromFight(underway)?.messagesRead, 2, "two arrived and were read");
    assertEquals(getReadingFromFight(underway)?.messagesLost, 1, "and one was stated and lost");

    addPayloadToFight(underway, { m: ["0;0;txt=c"] }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway)?.messagesRead, 3, "and every call adds to it");

    // **W5**: a payload carrying nothing is a boundary, and it moves neither figure.
    addPayloadToFight(underway, { m: [] }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway)?.messagesRead, 3, "a payload with none adds none");

    // A fight starting inside the same session counts from nothing again, as the rest does.
    addPayloadToFight(underway, { init: 1, m: ["0;0;txt=d"] }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway)?.messagesRead, 1, "and a new fight starts over");
});

Deno.test("every recording is read whole, by the count the payloads themselves state", () => {
    for (const path of readRecordingPaths()) {
        const fight = replay(path);
        assertEquals(fight?.messagesLost, 0, `${path}: a message the payload stated went unread`);
    }
});

Deno.test("a fight whose calls carry no snapshot still has a cast", () => {
    const fight = replay(NO_SNAPSHOTS);
    assertExists(fight, "the recording produced a fight");
    assertEquals(getRecordedCombatants(NO_SNAPSHOTS).length, 0, "the snapshots state nobody");
    assertEquals(fight.roster.byId.size, 3, "and the opening payload states all three");
    const placed = fight.events.filter((event) =>
        event.kind === "damage-to-named-combatant" && event.targetId !== null
    );
    assertEquals(placed.length, 1, "so the figure stated against a name lands on somebody");
});

/**
 * Which side is the reader's own is the client's answer and never the protocol's, so it is read
 * off the payload rather than off any message. Both spellings, because the recordings state it as
 * text and the client compares loosely.
 */
Deno.test("the reader's own side is read off the payload, in either spelling", () => {
    const asText = composeFightUnderway();
    addPayloadToFight(asText, { init: 1, myteam: "2" }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(asText)?.readerSide, 2, "stated as text, as the corpus does");

    const asNumber = composeFightUnderway();
    addPayloadToFight(asNumber, { init: 1, myteam: 2 }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(asNumber)?.readerSide, 2, "and stated as a number");

    const silent = composeFightUnderway();
    addPayloadToFight(silent, { init: 1 }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(silent)?.readerSide, null, "a payload that says nothing");
});

/** It arrives on the opening payload only, so a later one saying nothing must not take it away. */
Deno.test("the reader's own side is kept once seen, and cleared when a fight opens", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, myteam: "1" }, BLOWS_GRANTED);
    addPayloadToFight(underway, { m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    assertEquals(
        getReadingFromFight(underway)?.readerSide,
        1,
        "a later payload takes nothing away",
    );

    addPayloadToFight(underway, { init: 1 }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway)?.readerSide, null, "and a new fight starts over");
});

/**
 * ⚠️ **Which side, and not that it is the first.** Every recording until 2026-09-09 was written by
 * somebody on side 1, and this test asserted the `1` rather than the statement — until
 * `captures/2026-09-09-tempest-duet-vs-wojownik-…`, written from side 2, showed the difference.
 */
Deno.test("every recording states its reader's side, on the payload that opens the fight", () => {
    const sides = new Set<number>();
    for (const path of readRecordingPaths()) {
        const underway = composeFightUnderway();
        const [first] = getRecordedEngineUpdates(path);
        addPayloadToFight(underway, first, BLOWS_GRANTED);
        const readerSide = getReadingFromFight(underway)?.readerSide ?? null;
        assertNotStrictEquals(
            readerSide,
            null,
            `${path}: the opening payload states the reader's own side`,
        );
        assert(readerSide === 1 || readerSide === 2, `${path}: and it is one of the two sides`);
        if (readerSide !== null) sides.add(readerSide);
    }
    assertEquals([...sides].sort(), [1, 2], "the corpus is written from both sides of a fight");
});

Deno.test("a fight the game runs itself is read off the payload, in either spelling", () => {
    const asText = composeFightUnderway();
    addPayloadToFight(asText, { init: 1, auto: "1" }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(asText)?.isOnAuto, true, "stated as text, as the corpus does");

    const asNumber = composeFightUnderway();
    addPayloadToFight(asNumber, { init: 1, auto: 1 }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(asNumber)?.isOnAuto, true, "and stated as a number");

    const byHand = composeFightUnderway();
    addPayloadToFight(byHand, { init: 1, auto: "0" }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(byHand)?.isOnAuto, false, "a fight the reader is fighting");

    const silent = composeFightUnderway();
    addPayloadToFight(silent, { init: 1 }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(silent)?.isOnAuto, false, "and one that says nothing at all");
});

/** It arrives on the payload that turns it on, so a later one saying nothing must not end it. */
Deno.test("a fight the game runs itself is kept once seen, and cleared when a fight opens", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, auto: "1" }, BLOWS_GRANTED);
    addPayloadToFight(underway, { m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway)?.isOnAuto, true, "a later payload takes it away");

    addPayloadToFight(underway, { auto: "0" }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway)?.isOnAuto, false, "but the game's own word does");

    addPayloadToFight(underway, { auto: "1" }, BLOWS_GRANTED);
    addPayloadToFight(underway, { init: 1 }, BLOWS_GRANTED);
    assertEquals(getReadingFromFight(underway)?.isOnAuto, false, "and a new fight starts over");
});

/**
 * **ADR 0072.** The game stops numbering while it runs the fight, so the statement standing is one
 * from before it started — which is what the window drew as `Teraz` until this was read.
 */
Deno.test("the turn the game stated does not stand once it runs the fight itself", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(
        underway,
        { init: 1, auto: "0", turns_warriors: { 7: 11, 8: 12 } },
        BLOWS_GRANTED,
    );
    assertEquals(
        getReadingFromFight(underway)?.turnStatement,
        { ordinal: 7, combatantId: 11 },
        "the queue's least ordinal is the turn in hand",
    );

    addPayloadToFight(underway, { auto: "1" }, BLOWS_GRANTED);
    assertEquals(
        getReadingFromFight(underway)?.turnStatement,
        null,
        "and none of it survives auto",
    );

    addPayloadToFight(underway, { auto: "0", turns_warriors: { 9: 12 } }, BLOWS_GRANTED);
    assertEquals(
        getReadingFromFight(underway)?.turnStatement,
        { ordinal: 9, combatantId: 12 },
        "a fight handed back numbers turns again",
    );
});

/**
 * The measurement the rule stands on, read both ways so a reader that has stopped finding its
 * subject fails as loudly as one that finds too much: the corpus carries fights the game ran
 * itself **and** fights it numbered, and no payload is both.
 */
Deno.test("no recording states a fight the game runs itself and a turn at once", () => {
    let running = 0;
    let numbered = 0;
    for (const path of readRecordingPaths()) {
        for (const update of getRecordedEngineUpdates(path)) {
            const underway = composeFightUnderway();
            addPayloadToFight(underway, update, BLOWS_GRANTED);
            const stated = readTurnStatement(update);
            if (getReadingFromFight(underway)?.isOnAuto !== true) {
                if (stated !== null) numbered += 1;
                continue;
            }
            running += 1;
            assertEquals(stated, null, `${path}: a fight the game runs itself numbers no turn`);
        }
    }
    assert(running > 0, "the corpus carries payloads stating a fight the game ran itself");
    assert(numbered > 0, "and payloads where it numbered a turn instead");
});

Deno.test("a session says whether it saw the payload that opened the fight", () => {
    const fromStart = composeFightUnderway();
    addPayloadToFight(fromStart, { init: 1, myteam: "1" }, BLOWS_GRANTED);
    addPayloadToFight(fromStart, { m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    assertEquals(
        getReadingFromFight(fromStart)?.hasJoinedInProgress,
        false,
        "a fight watched from its opening payload lost nothing before it",
    );

    const joined = composeFightUnderway();
    addPayloadToFight(joined, { m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    assertEquals(
        getReadingFromFight(joined)?.hasJoinedInProgress,
        true,
        "and one whose first payload is anything else began before the reading did",
    );
    addPayloadToFight(joined, { m: ["0;0;txt=b"] }, BLOWS_GRANTED);
    assertEquals(
        getReadingFromFight(joined)?.hasJoinedInProgress,
        true,
        "which no later payload undoes, having arrived after the same opening",
    );

    addPayloadToFight(joined, { init: 1 }, BLOWS_GRANTED);
    assertEquals(
        getReadingFromFight(joined)?.hasJoinedInProgress,
        false,
        "a fight that opens is watched whole, whatever the one before it was",
    );
});

Deno.test("no recording is a fight joined in progress, and each says so", () => {
    for (const path of readRecordingPaths()) {
        const fight = replay(path);
        assertExists(fight, `${path}: the replay produced a fight`);
        assertEquals(
            fight.hasJoinedInProgress,
            false,
            `${path}: a recording carries the payload that opened its fight`,
        );
    }
});

/**
 * A payload lands whole or not at all. The reads run first, so a bound tripped anywhere in them
 * leaves the fight exactly as it stood — rather than counting a payload whose events never
 * arrived, and leaving an `endBattle` that never closed the fight.
 */
Deno.test("a payload past the bound moves nothing, and closes no fight", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, m: ["0;0;txt=a", "0;0;txt=b"] }, BLOWS_GRANTED);
    const stood = getReadingFromFight(underway);
    assertExists(stood, "a fight stands before the oversized payload arrives");

    const over = new Array(MAXIMUM_MESSAGES + 1).fill("0;0;txt=c");
    assertThrows(
        () => addPayloadToFight(underway, { endBattle: 1, m: over }, BLOWS_GRANTED),
        AssertionError,
        "a payload stays inside its stated bound",
    );

    const after = getReadingFromFight(underway);
    assertExists(after, "and the fight is still there afterwards");
    assertEquals(after.payloads, stood.payloads, "the payload that failed was not counted");
    assertEquals(after.messagesRead, stood.messagesRead, "nor were its messages read");
    assertEquals(after.messagesByPayload.length, 1, "nor kept");
    assertEquals(after.events.length, stood.events.length, "and it left no events behind");
    assertFalse(after.isOver, "and the `endBattle` it carried closed nothing");
});

/**
 * A cast the game would field: ten a side, each stated in full, keyed by id as the client keys
 * its own warriors.
 */
function composeFullCast(): Record<string, unknown> {
    const cast: Record<string, unknown> = {};
    for (let at = 0; at < MAXIMUM_COMBATANTS; at += 1) {
        const id = at + 1;
        cast[`${id}`] = {
            id,
            name: `Postac${id}`,
            team: at < MAXIMUM_COMBATANTS / 2 ? 1 : 2,
            prof: "w",
            lvl: 100,
            hp: { max: 1000 },
        };
    }
    return cast;
}

Deno.test("a cast stated twice is one cast, and a fight of twenty survives the restatement", () => {
    const cast = composeFullCast();
    assertEquals(Object.keys(cast).length, MAXIMUM_COMBATANTS, "the sample is a full fight");
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, w: cast, m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    const opened = getReadingFromFight(underway);
    assertExists(opened, "the fight stands on its opening payload");
    assertEquals(opened.roster.byId.size, MAXIMUM_COMBATANTS, "and holds everybody in it");

    // The second sighting is what ends the fight where the bound is wrong: forty names reach a
    // bound counting twenty, and every payload after this one fails the same way (**E5**).
    addPayloadToFight(underway, { w: cast, m: ["0;0;txt=b"] }, BLOWS_GRANTED);
    const after = getReadingFromFight(underway);
    assertExists(after, "a payload restating the cast leaves the fight standing");
    assertEquals(after.roster.byId.size, MAXIMUM_COMBATANTS, "and the cast is the same people");
    assertEquals(after.payloads, 2, "the payload was read rather than refused");
    assertEquals(after.messagesRead, 2, "and its message with it");
});

Deno.test("a name stated by two people resolves to nobody, however often each is stated", () => {
    const cast = { 1: { id: 1, name: "Odyniec", team: 1 }, 2: { id: 2, name: "Odyniec", team: 2 } };
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, w: cast, m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    addPayloadToFight(underway, { w: cast, m: ["0;0;txt=b"] }, BLOWS_GRANTED);
    const after = getReadingFromFight(underway);
    assertExists(after, "the fight stands");
    // The replacement must not resolve an ambiguity by overwriting: two people keep one name.
    assertEquals(after.roster.idByName.get("Odyniec"), null, "a name two people answer to");
});

/**
 * The reset is one of the writes, so it waits with them: a fight that opened past the bound left
 * `hasFight` standing over no payload, which its own reader asserts against on every draw.
 */
Deno.test("a fight that opens past the bound leaves the one standing, whole", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    const stood = getReadingFromFight(underway);
    assertExists(stood, "a fight stands before the oversized one tries to open");

    const over = new Array(MAXIMUM_MESSAGES + 1).fill("0;0;txt=c");
    assertThrows(
        () => addPayloadToFight(underway, { init: 1, m: over }, BLOWS_GRANTED),
        AssertionError,
        "a payload stays inside its stated bound",
    );

    const after = getReadingFromFight(underway);
    assertExists(after, "the fight that stood can still be read");
    assertEquals(after.payloads, stood.payloads, "with its own payload count");
    assertEquals(after.events, stood.events, "and its own events");
    assertFalse(after.hasJoinedInProgress, "and it was not made a fight joined late");

    addPayloadToFight(underway, { init: 1, m: ["0;0;txt=b"] }, BLOWS_GRANTED);
    const opened = getReadingFromFight(underway);
    assertExists(opened, "the next fight to open opens");
    assertEquals(opened.payloads, 1, "on its own");
    assertFalse(opened.hasJoinedInProgress, "and from its first payload");
});

/**
 * The join between the payload's own mask and the walk that times it — the one thing neither the
 * core test nor the window test can see, because each is handed what the other would have passed.
 * Found by a mutation that cut the mask at the handover and lit nothing (**W4**).
 */
Deno.test("what the payloads said somebody carries reaches the reading", () => {
    let carrying = 0;
    let recordings = 0;
    for (const path of readRecordingPaths()) {
        const fight = replay(path);
        assertExists(fight, `${path}: the replay produced a fight`);
        recordings += 1;
        if (fight.carriedStatuses.length > 0) carrying += 1;
        for (const one of fight.carriedStatuses) {
            assert(one.turnsElapsed >= 0, `${path}: a status stands for turns that passed`);
            assert(one.bit >= 0, `${path}: and at a position in the mask`);
        }
    }
    assert(recordings > 0, "the corpus was there to read");
    assert(carrying > 0, "and somebody in it is carrying something the game stated");
});

/**
 * **W5: zero is a boundary.** A fight nobody has sent a payload for carries nothing, which is a
 * reading of the mask and not the reading failing to happen.
 */
Deno.test("a fight with no payload behind it says nobody is carrying anything", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    const reading = getReadingFromFight(underway);
    assertExists(reading, "the fight opened");
    assertEquals(reading.carriedStatuses, [], "and states no status for anybody");
});

/**
 * ⚠️ **A bonus that fires once a fight fires once a fight, not once a session.** The walk that
 * holds the two legendary bonuses is kept between payloads like the statuses beside it, so a
 * fight that opens has to take it away — or somebody who spent their last rescue in one fight
 * carries `wykorzystany` into every fight after it, and a run of the other one dates from a fight
 * nobody is in any more.
 */
Deno.test("a fight that opens takes the legendary bonuses of the one before it away", () => {
    const carried = readRecordingPaths().find((path) =>
        (replay(path)?.legendaryStandings.length ?? 0) > 0
    );
    assertExists(carried, "a recording where one of the two bonuses stands at the end");
    const underway = composeFightUnderway();
    for (const update of getRecordedEngineUpdates(carried)) {
        addPayloadToFight(underway, update, BLOWS_GRANTED);
    }
    const before = getReadingFromFight(underway);
    assert((before?.legendaryStandings.length ?? 0) > 0, "the first fight ends holding one");
    addPayloadToFight(underway, { init: 1, m: ["0;0;txt=a"] }, BLOWS_GRANTED);
    const after = getReadingFromFight(underway);
    assertExists(after, "and the fight that opened was read");
    assertEquals(after.legendaryStandings, [], "the new fight holds none of them");
    assertEquals(after.carriedStatuses, [], "nor any status, which is reset the same way");
});

/**
 * ⚠️ **The walk is tested on heals it composes itself**, so a key spelled one way there and
 * another by the decoder passes it green while no heal is ever counted. This is the seam: every
 * recording, payload by payload, through the decoder, must show a run at each count under the
 * bound — and never at the bound, because the payload carrying the last heal takes the row away.
 */
Deno.test("Dotyk anioła counts the heals the decoder reads, over every recording", () => {
    const counts = new Set<number>();
    for (const path of readRecordingPaths()) {
        const underway = composeFightUnderway();
        for (const update of getRecordedEngineUpdates(path)) {
            addPayloadToFight(underway, update, BLOWS_GRANTED);
            for (const one of getReadingFromFight(underway)?.legendaryStandings ?? []) {
                if (one.holytouchHealsGiven !== null) counts.add(one.holytouchHealsGiven);
            }
        }
    }
    assertEquals([...counts].sort(), [0, 1, 2], "every count under three, and three never");
});
