/**
 * One call of the engine read into the session's record, and every way the envelope refuses one.
 *
 * The refusals are written out by hand, because no recording carries any of them: a bound on what
 * the game sent is checked here and nowhere past it, so here is where it has to be seen to bite.
 */

import { assert, assertEquals, assertStrictEquals } from "@std/assert";
import { err } from "#/libs/result.ts";
import { COMBATANTS_MAXIMUM } from "#/src/core/combatant-roster.ts";
import { MESSAGES_MAXIMUM } from "#/src/core/fight-decoder.ts";
import {
    ENVELOPE_FAILURE,
    type EnvelopeField,
    readPayloadEnvelope,
} from "#/src/game/payload-envelope.ts";
import {
    commitPayload,
    getFightView,
    initFightSession,
    preparePayload,
    SESSION_OPTIONS,
} from "#/src/core/fight-session.ts";
import { BLOWS_GRANTED } from "#/tests/frozen-tables.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";

const QUEUE_ENTRIES_MAXIMUM = 1024;

Deno.test("what is not a keyed object is not a payload", () => {
    const refused = err({ kind: ENVELOPE_FAILURE.payloadNotRecord });
    assertEquals(readPayloadEnvelope(null), refused, "nothing is not one");
    assertEquals(readPayloadEnvelope(["0;0;txt=a"]), refused, "and a list of messages is not one");
    assertEquals(readPayloadEnvelope("m"), refused, "nor is text");
    assert(readPayloadEnvelope({}).ok, "while a payload stating nothing is one");
});

Deno.test("a field of the wrong shape refuses the payload, and says which field is ours", () => {
    assertEquals(readPayloadEnvelope({ m: "0;0;txt=a" }), malformed("messages"), "`m` no list");
    assertEquals(readPayloadEnvelope({ m: ["0;0;txt=a", 5] }), malformed("messages"), "no text");
    assertEquals(readPayloadEnvelope({ mi: 3 }), malformed("messagesStated"), "`mi` no list");
    assertEquals(readPayloadEnvelope({ myteam: true }), malformed("readerSide"), "a flag side");
    assertEquals(readPayloadEnvelope({ myteam: "one" }), malformed("readerSide"), "a word side");
    assertEquals(readPayloadEnvelope({ auto: [] }), malformed("isOnAuto"), "a list for auto");
    const queue = { turns_warriors: { x: 1 } };
    assertEquals(readPayloadEnvelope(queue), malformed("turnStatement"), "an unnumbered queue");
    const whose = { turns_warriors: { 7: "11" } };
    assertEquals(readPayloadEnvelope(whose), malformed("turnStatement"), "and nobody's turn");
    assertEquals(readPayloadEnvelope({ w: "one" }), malformed("combatants"), "text is no cast");
});

function malformed(field: EnvelopeField) {
    return err({ kind: ENVELOPE_FAILURE.payloadFieldMalformed, field });
}

Deno.test("a list past its bound refuses the payload, and one at it does not", () => {
    const full = new Array(MESSAGES_MAXIMUM).fill(0);
    assert(readPayloadEnvelope({ mi: full }).ok, "a count at the bound is read");
    assertEquals(
        readPayloadEnvelope({ mi: [...full, 0] }),
        err({
            kind: ENVELOPE_FAILURE.payloadFieldTooLong,
            field: "messagesStated",
            count: MESSAGES_MAXIMUM + 1,
            maximum: MESSAGES_MAXIMUM,
        }),
        "and one past it is refused, not cut",
    );
    const queue: Record<string, number> = {};
    for (let ordinal = 1; ordinal <= QUEUE_ENTRIES_MAXIMUM; ordinal += 1) queue[ordinal] = 1;
    assert(readPayloadEnvelope({ turns_warriors: queue }).ok, "a queue at its bound is read");
    queue[QUEUE_ENTRIES_MAXIMUM + 1] = 1;
    assertEquals(
        readPayloadEnvelope({ turns_warriors: queue }),
        err({
            kind: ENVELOPE_FAILURE.payloadFieldTooLong,
            field: "turnStatement",
            count: QUEUE_ENTRIES_MAXIMUM + 1,
            maximum: QUEUE_ENTRIES_MAXIMUM,
        }),
        "and one past it is refused",
    );
});

Deno.test("a cast is read up to a full fight, and one warrior past it is refused", () => {
    const warriors = Array.from({ length: COMBATANTS_MAXIMUM + 1 }, (_, at) => ({
        id: at + 1,
        name: `Gracz ${at + 1}`,
        team: at % 2,
    }));
    const full = warriors.slice(0, COMBATANTS_MAXIMUM);
    assertStrictEquals(readOk({ w: full }).combatants.length, COMBATANTS_MAXIMUM, "twenty");
    const keyed = Object.fromEntries(full.map((one) => [`${one.id}`, one]));
    assertStrictEquals(readOk({ w: keyed }).combatants.length, COMBATANTS_MAXIMUM, "keyed too");
    const past = err({
        kind: ENVELOPE_FAILURE.payloadFieldTooLong,
        field: "combatants" as const,
        count: COMBATANTS_MAXIMUM + 1,
        maximum: COMBATANTS_MAXIMUM,
    });
    assertEquals(readPayloadEnvelope({ w: warriors }), past, "a listed twenty-first is refused");
    const keyedPast = Object.fromEntries(warriors.map((one) => [`${one.id}`, one]));
    assertEquals(readPayloadEnvelope({ w: keyedPast }), past, "and so is a keyed one");
});

function readOk(payload: unknown) {
    const record = readPayloadEnvelope(payload);
    assert(record.ok, "the payload is read");
    return record.value;
}

Deno.test("a combatant stated twice in one payload refuses it", () => {
    const one = { id: 3, name: "Gracz 3", team: 1 };
    assertEquals(
        readPayloadEnvelope({ w: [one, { ...one, name: "Gracz 4" }] }),
        err({
            kind: ENVELOPE_FAILURE.payloadCombatantRepeated,
            combatantId: 3,
        }),
        "one id, two combatants",
    );
    const partial = { id: 3, buffs: 1 };
    assert(readPayloadEnvelope({ w: [one, partial] }).ok, "a partial entry beside it is no second");
});

Deno.test("the reader's side and the game's own running are read as text or as a number", () => {
    assertStrictEquals(readOk({ myteam: "2" }).readerSide, 2, "as text, as the corpus states it");
    assertStrictEquals(readOk({ myteam: 2 }).readerSide, 2, "and as a number");
    assertStrictEquals(readOk({}).readerSide, null, "and a payload saying nothing says nothing");
    assertStrictEquals(readOk({ auto: "1" }).isOnAuto, true, "the game running it, as text");
    assertStrictEquals(readOk({ auto: 0 }).isOnAuto, false, "handed back, as a number");
    assertStrictEquals(readOk({ auto: "0" }).isOnAuto, false, "and as text");
    assertStrictEquals(
        readOk({ auto: "2" }).isOnAuto,
        true,
        "any number but none is on, as the client's `parseInt` reads it",
    );
    assertStrictEquals(readOk({}).isOnAuto, null, "and silence is neither");
});

/** `develop ADR 0072` and the queue's own reading: only the least entry is a statement. */
Deno.test("the queue's least ordinal is the turn in hand, and the rest is forecast", () => {
    const stated = readOk({ turns_warriors: { 8: 12, 7: 11, 9: 13 } }).turnStatement;
    assertEquals(stated, { ordinal: 7, combatantId: 11 }, "the least, wherever it is listed");
    assertStrictEquals(readOk({ turns_warriors: {} }).turnStatement, null, "an empty queue");
    assertStrictEquals(readOk({}).turnStatement, null, "and no queue at all");
});

Deno.test("an empty message is passed over, and counts as lost against what was stated", () => {
    const record = readOk({ mi: [0, 0, 0], m: ["0;0;txt=a", "", "0;0;txt=b"] });
    assertEquals(record.messages, ["0;0;txt=a", "0;0;txt=b"], "two read");
    assertStrictEquals(record.messagesStated, 3, "out of three stated");
    const session = initFightSession(SESSION_OPTIONS);
    const prepared = preparePayload(session, { ...record, isInit: true }, BLOWS_GRANTED);
    assert(prepared.ok, "the payload is prepared");
    commitPayload(session, prepared.value);
    assertStrictEquals(getFightView(session)?.messagesLost, 1, "and the empty one is lost");
    assertStrictEquals(readOk({ m: [] }).messagesStated, null, "no `mi` states no count");
    assertStrictEquals(readOk({ mi: [] }).messagesStated, 0, "while an empty one states none");
});

Deno.test("a fight opens and ends on the presence of a key, whatever it holds", () => {
    assert(readOk({ init: 1 }).isInit, "`init` opens one");
    assert(readOk({ init: 0 }).isInit, "whatever it says");
    assert(!readOk({}).isInit, "and its absence opens none");
    assert(readOk({ endBattle: null }).isEnd, "`endBattle` ends one, whatever it holds");
    assert(!readOk({ m: [] }).isEnd, "and its absence ends none");
    assert(!readOk(Object.create({ init: 1 })).isInit, "a key off the prototype is no key");
});

Deno.test("every recorded call is read, and none refused", () => {
    let calls = 0;
    for (const fight of readRecordedFights()) {
        for (const update of fight.updates) {
            const record = readPayloadEnvelope(update);
            assert(record.ok, `${fight.path}: call ${calls} is read`);
            calls += 1;
        }
    }
    assert(calls > readRecordedFights().length, "the recordings hold calls, not only files");
});
