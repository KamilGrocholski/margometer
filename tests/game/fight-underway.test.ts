/**
 * A fight assembled the way the game delivers it: one payload at a time, in order.
 *
 * The recordings hold every call the engine made, so a session fed from them is the add-on's own
 * path end to end — the roster comes from the payloads rather than from the snapshots, which is
 * the difference that matters in the last test here.
 */

import { assert, assertEquals, assertExists, assertNotStrictEquals } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import {
    addPayloadToFight,
    composeFightUnderway,
    getReadingFromFight,
} from "@/src/game/fight-underway.ts";
import {
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
    for (const update of getRecordedEngineUpdates(path)) addPayloadToFight(underway, update);
    return getReadingFromFight(underway);
}

Deno.test("a fight nobody has seen is not a fight holding nothing", () => {
    assertEquals(getReadingFromFight(composeFightUnderway()), null, "there is no fight to read");
    const underway = composeFightUnderway();
    addPayloadToFight(underway, null);
    assertEquals(getReadingFromFight(underway), null, "and what is not a payload starts none");
    // A list is an object to `typeof`, and one reaching here used to open a fight nobody fought.
    addPayloadToFight(underway, ["0;0;txt=a"]);
    assertEquals(getReadingFromFight(underway), null, "a list is not a payload either");
});

Deno.test("a recording replayed call by call reads as the whole of itself", () => {
    for (const path of readRecordingPaths()) {
        const roster = composeCombatantRoster(getRecordedCombatants(path));
        let decoded = 0;
        for (const payload of getRecordedPayloads(path)) {
            decoded += decodeFightMessages(payload, roster).length;
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
    assert(first !== undefined && second !== undefined, "two recordings to run together");
    const underway = composeFightUnderway();
    for (const update of getRecordedEngineUpdates(first)) addPayloadToFight(underway, update);
    const opened = getReadingFromFight(underway);
    for (const update of getRecordedEngineUpdates(second)) addPayloadToFight(underway, update);
    const replaced = getReadingFromFight(underway);
    assert(opened !== null && replaced !== null, "both fights were read");
    assertEquals(replaced.payloads, getRecordedEngineUpdates(second).length, "only the second");
    const alone = replay(second);
    assertEquals(replaced.events.length, alone?.events.length, "and it reads as it would alone");
});

Deno.test("a payload says how many messages it carried, and the count is held to it", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, mi: [0, 0, 0], m: ["0;0;txt=a", "0;0;txt=b"] });
    assertEquals(getReadingFromFight(underway)?.messagesLost, 1, "one was stated and not read");

    const renamed = composeFightUnderway();
    addPayloadToFight(renamed, { init: 1, mi: [0, 0], messages: ["0;0;txt=a", "0;0;txt=b"] });
    assertEquals(getReadingFromFight(renamed)?.messagesLost, 2, "a rename of `m` is caught whole");

    const witnessGone = composeFightUnderway();
    addPayloadToFight(witnessGone, { init: 1, m: ["0;0;txt=a"] });
    assertEquals(getReadingFromFight(witnessGone)?.messagesLost, 0, "and a lost witness is silent");

    // Two calls, each losing one: what is lost accumulates across a fight rather than standing
    // for whatever the last payload happened to lose.
    addPayloadToFight(underway, { mi: [0, 0], m: ["0;0;txt=c"] });
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

    addPayloadToFight(underway, { init: 1, mi: [0, 0, 0], m: ["0;0;txt=a", "0;0;txt=b"] });
    assertEquals(getReadingFromFight(underway)?.messagesRead, 2, "two arrived and were read");
    assertEquals(getReadingFromFight(underway)?.messagesLost, 1, "and one was stated and lost");

    addPayloadToFight(underway, { m: ["0;0;txt=c"] });
    assertEquals(getReadingFromFight(underway)?.messagesRead, 3, "and every call adds to it");

    // **W5**: a payload carrying nothing is a boundary, and it moves neither figure.
    addPayloadToFight(underway, { m: [] });
    assertEquals(getReadingFromFight(underway)?.messagesRead, 3, "a payload with none adds none");

    // A fight starting inside the same session counts from nothing again, as the rest does.
    addPayloadToFight(underway, { init: 1, m: ["0;0;txt=d"] });
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
    addPayloadToFight(asText, { init: 1, myteam: "2" });
    assertEquals(getReadingFromFight(asText)?.readerSide, 2, "stated as text, as the corpus does");

    const asNumber = composeFightUnderway();
    addPayloadToFight(asNumber, { init: 1, myteam: 2 });
    assertEquals(getReadingFromFight(asNumber)?.readerSide, 2, "and stated as a number");

    const silent = composeFightUnderway();
    addPayloadToFight(silent, { init: 1 });
    assertEquals(getReadingFromFight(silent)?.readerSide, null, "a payload that says nothing");
});

/** It arrives on the opening payload only, so a later one saying nothing must not take it away. */
Deno.test("the reader's own side is kept once seen, and cleared when a fight opens", () => {
    const underway = composeFightUnderway();
    addPayloadToFight(underway, { init: 1, myteam: "1" });
    addPayloadToFight(underway, { m: ["0;0;txt=a"] });
    assertEquals(
        getReadingFromFight(underway)?.readerSide,
        1,
        "a later payload takes nothing away",
    );

    addPayloadToFight(underway, { init: 1 });
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
        addPayloadToFight(underway, first);
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

Deno.test("a session says whether it saw the payload that opened the fight", () => {
    const fromStart = composeFightUnderway();
    addPayloadToFight(fromStart, { init: 1, myteam: "1" });
    addPayloadToFight(fromStart, { m: ["0;0;txt=a"] });
    assertEquals(
        getReadingFromFight(fromStart)?.hasJoinedInProgress,
        false,
        "a fight watched from its opening payload lost nothing before it",
    );

    const joined = composeFightUnderway();
    addPayloadToFight(joined, { m: ["0;0;txt=a"] });
    assertEquals(
        getReadingFromFight(joined)?.hasJoinedInProgress,
        true,
        "and one whose first payload is anything else began before the reading did",
    );
    addPayloadToFight(joined, { m: ["0;0;txt=b"] });
    assertEquals(
        getReadingFromFight(joined)?.hasJoinedInProgress,
        true,
        "which no later payload undoes, having arrived after the same opening",
    );

    addPayloadToFight(joined, { init: 1 });
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
