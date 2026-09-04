/**
 * A fight assembled the way the game delivers it: one payload at a time, in order.
 *
 * The recordings hold every call the engine made, so a session fed from them is the add-on's own
 * path end to end — the roster comes from the payloads rather than from the snapshots, which is
 * the difference that matters in the last test here.
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { composeCombatantRoster } from "@/src/core/combatant-roster.ts";
import { decodeFightMessages } from "@/src/core/fight-decoder.ts";
import {
    addPayloadToSession,
    composeBattleSession,
    getFightFromSession,
} from "@/src/game/battle-session.ts";
import {
    getRecordedCombatants,
    getRecordedEngineUpdates,
    getRecordedPayloads,
    getRecordingPaths,
} from "@/tests/recorded-fight.ts";

/** The one recording whose calls carry no snapshot, so its roster can only come from a payload. */
const NO_SNAPSHOTS =
    "captures/2026-08-24-tempest-tropiciel-vs-centaury-auto-1786514810315-0.8.1.json";

function replay(path: string) {
    const session = composeBattleSession();
    for (const update of getRecordedEngineUpdates(path)) addPayloadToSession(session, update);
    return getFightFromSession(session);
}

Deno.test("a fight nobody has seen is not a fight holding nothing", () => {
    assertEquals(getFightFromSession(composeBattleSession()), null, "there is no fight to read");
    const session = composeBattleSession();
    addPayloadToSession(session, null);
    assertEquals(getFightFromSession(session), null, "and what is not a payload starts none");
    // A list is an object to `typeof`, and one reaching here used to open a fight nobody fought.
    addPayloadToSession(session, ["0;0;txt=a"]);
    assertEquals(getFightFromSession(session), null, "a list is not a payload either");
});

Deno.test("a recording replayed call by call reads as the whole of itself", () => {
    for (const path of getRecordingPaths()) {
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
    const [first, second] = getRecordingPaths();
    assert(first !== undefined && second !== undefined, "two recordings to run together");
    const session = composeBattleSession();
    for (const update of getRecordedEngineUpdates(first)) addPayloadToSession(session, update);
    const opened = getFightFromSession(session);
    for (const update of getRecordedEngineUpdates(second)) addPayloadToSession(session, update);
    const replaced = getFightFromSession(session);
    assert(opened !== null && replaced !== null, "both fights were read");
    assertEquals(replaced.payloads, getRecordedEngineUpdates(second).length, "only the second");
    const alone = replay(second);
    assertEquals(replaced.events.length, alone?.events.length, "and it reads as it would alone");
});

Deno.test("a payload says how many messages it carried, and the count is held to it", () => {
    const session = composeBattleSession();
    addPayloadToSession(session, { init: 1, mi: [0, 0, 0], m: ["0;0;txt=a", "0;0;txt=b"] });
    assertEquals(getFightFromSession(session)?.messagesLost, 1, "one was stated and not read");

    const renamed = composeBattleSession();
    addPayloadToSession(renamed, { init: 1, mi: [0, 0], messages: ["0;0;txt=a", "0;0;txt=b"] });
    assertEquals(getFightFromSession(renamed)?.messagesLost, 2, "a rename of `m` is caught whole");

    const witnessGone = composeBattleSession();
    addPayloadToSession(witnessGone, { init: 1, m: ["0;0;txt=a"] });
    assertEquals(getFightFromSession(witnessGone)?.messagesLost, 0, "and a lost witness is silent");

    // Two calls, each losing one: what is lost accumulates across a fight rather than standing
    // for whatever the last payload happened to lose.
    addPayloadToSession(session, { mi: [0, 0], m: ["0;0;txt=c"] });
    assertEquals(getFightFromSession(session)?.messagesLost, 2, "and every call adds to the count");
});

Deno.test("every recording is read whole, by the count the payloads themselves state", () => {
    for (const path of getRecordingPaths()) {
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
    const asText = composeBattleSession();
    addPayloadToSession(asText, { init: 1, myteam: "2" });
    assertEquals(getFightFromSession(asText)?.readerSide, 2, "stated as text, as the corpus does");

    const asNumber = composeBattleSession();
    addPayloadToSession(asNumber, { init: 1, myteam: 2 });
    assertEquals(getFightFromSession(asNumber)?.readerSide, 2, "and stated as a number");

    const silent = composeBattleSession();
    addPayloadToSession(silent, { init: 1 });
    assertEquals(getFightFromSession(silent)?.readerSide, null, "a payload that says nothing");
});

/** It arrives on the opening payload only, so a later one saying nothing must not take it away. */
Deno.test("the reader's own side is kept once seen, and cleared when a fight opens", () => {
    const session = composeBattleSession();
    addPayloadToSession(session, { init: 1, myteam: "1" });
    addPayloadToSession(session, { m: ["0;0;txt=a"] });
    assertEquals(getFightFromSession(session)?.readerSide, 1, "a later payload takes nothing away");

    addPayloadToSession(session, { init: 1 });
    assertEquals(getFightFromSession(session)?.readerSide, null, "and a new fight starts over");
});

Deno.test("every recording states its reader's side, on the payload that opens the fight", () => {
    for (const path of getRecordingPaths()) {
        const session = composeBattleSession();
        const [first] = getRecordedEngineUpdates(path);
        addPayloadToSession(session, first);
        assertEquals(
            getFightFromSession(session)?.readerSide,
            1,
            `${path}: the opening payload states the reader's own side`,
        );
    }
});

Deno.test("a session says whether it saw the payload that opened the fight", () => {
    const fromStart = composeBattleSession();
    addPayloadToSession(fromStart, { init: 1, myteam: "1" });
    addPayloadToSession(fromStart, { m: ["0;0;txt=a"] });
    assertEquals(
        getFightFromSession(fromStart)?.hasJoinedInProgress,
        false,
        "a fight watched from its opening payload lost nothing before it",
    );

    const joined = composeBattleSession();
    addPayloadToSession(joined, { m: ["0;0;txt=a"] });
    assertEquals(
        getFightFromSession(joined)?.hasJoinedInProgress,
        true,
        "and one whose first payload is anything else began before the reading did",
    );
    addPayloadToSession(joined, { m: ["0;0;txt=b"] });
    assertEquals(
        getFightFromSession(joined)?.hasJoinedInProgress,
        true,
        "which no later payload undoes, having arrived after the same opening",
    );

    addPayloadToSession(joined, { init: 1 });
    assertEquals(
        getFightFromSession(joined)?.hasJoinedInProgress,
        false,
        "a fight that opens is watched whole, whatever the one before it was",
    );
});

Deno.test("no recording is a fight joined in progress, and each says so", () => {
    for (const path of getRecordingPaths()) {
        const fight = replay(path);
        assertExists(fight, `${path}: the replay produced a fight`);
        assertEquals(
            fight.hasJoinedInProgress,
            false,
            `${path}: a recording carries the payload that opened its fight`,
        );
    }
});

/** One warrior, stated as the payloads state them: keyed by id, with the mask beside the pool. */
function composeStatusPayload(mask: number, messages: readonly string[]): Record<string, unknown> {
    return { w: { "482845": { id: 482845, buffs: mask } }, m: [...messages] };
}

const OPENING = { init: 1, myteam: 1, w: { "482845": { id: 482845, name: "Gracz 1", team: 1 } } };

Deno.test("a bit going on opens one episode, and going off closes that one", () => {
    const session = composeBattleSession();
    for (const payload of [OPENING, composeStatusPayload(8, []), composeStatusPayload(8, [])]) {
        addPayloadToSession(session, payload);
    }
    assertEquals(session.statusEpisodes.length, 1, "a bit stated twice is one episode, not two");
    assertEquals(session.statusEpisodes[0]?.bit, 3, "and it is the bit the mask set");
    assertEquals(
        session.statusEpisodes[0]?.toEventIndex,
        null,
        "still standing while it is stated",
    );

    addPayloadToSession(session, composeStatusPayload(0, []));
    assertEquals(session.statusEpisodes.length, 1, "the mask going quiet opens nothing new");
    assertEquals(session.statusEpisodes[0]?.toEventIndex, 0, "it closes the one that was open");

    addPayloadToSession(session, composeStatusPayload(8, []));
    assertEquals(session.statusEpisodes.length, 2, "and the bit set again is a second episode");
});

/**
 * ⚠️ **A first sighting is not the moment the game set the bit.** Read from a fight already going,
 * the length is short by an amount nothing states, and the episode has to say so.
 */
Deno.test("a status standing when a combatant is first seen says the count is short", () => {
    const joined = composeBattleSession();
    addPayloadToSession(joined, composeStatusPayload(8, []));
    assertEquals(joined.statusEpisodes[0]?.wasStandingAtFirstSight, true, "nobody saw it start");

    const watched = composeBattleSession();
    addPayloadToSession(watched, OPENING);
    addPayloadToSession(watched, composeStatusPayload(0, []));
    addPayloadToSession(watched, composeStatusPayload(8, []));
    assertEquals(watched.statusEpisodes[0]?.wasStandingAtFirstSight, false, "this one was watched");
});

Deno.test("a fight opening again leaves no episode of the fight before it", () => {
    const session = composeBattleSession();
    addPayloadToSession(session, composeStatusPayload(8, []));
    assert(session.statusEpisodes.length > 0, "there is something to lose");
    addPayloadToSession(session, OPENING);
    assertEquals(session.statusEpisodes, [], "a fight opens carrying nothing standing");
});
