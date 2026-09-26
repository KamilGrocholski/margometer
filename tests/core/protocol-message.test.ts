/**
 * The grammar, against every message the recordings carry.
 *
 * Each sample below is a transcript copied from the recording it is named against: a guess about
 * the protocol's own text would be a claim about the game.
 */

import { assert, assertEquals, assertInstanceOf, assertStrictEquals } from "@std/assert";
import {
    encodeProtocolMessage,
    MESSAGE_END,
    type MessageEnd,
    ParameterKeyEmpty,
    parseProtocolMessage,
    SEGMENTS_MAXIMUM,
    SegmentsExceeded,
    SideUnreadable,
} from "#/src/core/protocol-message.ts";
import { readRecordedFights } from "#/tests/recorded-fights.ts";

/** `2026-08-04-tempest-lowca-vs-odyncze-1785244275300-none.json`, the samples' own fight. */
const HIT = "482845=100.00;-161518=70.07;+dmgd=466;+acdmg=5;-dmgd=223";
const KILLING_HIT = "482845=100.00;-161518=0.00;+dmgd=485;+acdmg=5;-dmgd=248";
const STEP = "-255967=100.00;0;step";
const OUTCOME = "0;0;winner=Gracz 1";
/** `2026-08-06-tempest-grupa-vs-hildur-1785244275300-none.json`: a side without a percentage. */
const ANNOUNCEMENT = "-10000249;0;tspell=Struna płomienna";

Deno.test("both ends are read, with the health each states", () => {
    const hit = parseOrFail(HIT);
    assertEquals(hit.actor, { combatantId: 482845, healthPercent: 100 }, "the actor is read");
    assertEquals(hit.target, { combatantId: -161518, healthPercent: 70.07 }, "the target is read");
    assertStrictEquals(hit.parameters.length, 3, "every segment past the ends is a parameter");
    assertEquals(hit.parameters[0], { key: "+dmgd", value: "466" }, "a parameter keeps its text");
});

function parseOrFail(text: string) {
    const parsed = parseProtocolMessage(text);
    assert(!(parsed instanceof Error), `"${text}" parses`);
    return parsed;
}

Deno.test("a health of nothing is a reading, and nobody is not", () => {
    const killing = parseOrFail(KILLING_HIT);
    assertEquals(killing.target, { combatantId: -161518, healthPercent: 0 }, "zero is a reading");
    assertStrictEquals(parseOrFail(STEP).target, null, "`0` is nobody, not a combatant");
    const announcement = parseOrFail(ANNOUNCEMENT);
    assertEquals(announcement.actor, { combatantId: -10000249, healthPercent: null }, "no health");
});

Deno.test("a message naming neither end still parses", () => {
    const outcome = parseOrFail(OUTCOME);
    assertStrictEquals(outcome.actor, null, "the game named no actor");
    assertStrictEquals(outcome.target, null, "the game named no target");
    assertEquals(outcome.parameters[0], { key: "winner", value: "Gracz 1" }, "a value may space");
});

Deno.test("a segment with no value is a key on its own", () => {
    const critical = parseOrFail("482845=100.00;-161518=21.34;+crit;+dmgd=612");
    assertEquals(critical.parameters[0], { key: "+crit", value: null }, "null is not an empty");
    const empty = parseOrFail("0;0;txt=");
    assertEquals(empty.parameters[0], { key: "txt", value: "" }, "an empty value is stated");
});

Deno.test("what the grammar does not cover is refused, and says which end", () => {
    const { actor, target } = MESSAGE_END;
    expectSideUnreadable(parseProtocolMessage("482845"), target, "a message with no target");
    expectSideUnreadable(parseProtocolMessage(""), actor, "empty text names no actor");
    expectSideUnreadable(parseProtocolMessage("gracz;0;step"), actor, "an id that is not a number");
    expectSideUnreadable(parseProtocolMessage("0;1=70.7;step"), target, "a health one place wide");
    expectSideUnreadable(
        parseProtocolMessage("1=70.070;0;step"),
        actor,
        "a health three places wide",
    );
    const keyless = parseProtocolMessage("0;0;step;=5");
    assertInstanceOf(keyless, ParameterKeyEmpty, "a value with no key");
    assertStrictEquals(keyless.index, 1, "a value with no key");
});

function expectSideUnreadable(read: unknown, end: MessageEnd, message: string): void {
    assertInstanceOf(read, SideUnreadable, message);
    assertStrictEquals(read.end, end, message);
}

Deno.test("an id past what a number holds exactly is refused, not rounded", () => {
    const highest = parseOrFail("9007199254740991;0;step");
    assertEquals(highest.actor, { combatantId: 9007199254740991, healthPercent: null }, "the last");
    const refused = parseProtocolMessage("9007199254740992;0;step");
    expectSideUnreadable(refused, MESSAGE_END.actor, "and the first past it");
});

Deno.test("a message is read up to its bound, and refused one segment past it", () => {
    const parameters = Array.from({ length: SEGMENTS_MAXIMUM - 2 }, () => "step");
    const atBound = ["0", "0", ...parameters].join(";");
    assertStrictEquals(parseOrFail(atBound).parameters.length, SEGMENTS_MAXIMUM - 2, "all read");
    const exceeded = parseProtocolMessage(`${atBound};step`);
    assertInstanceOf(exceeded, SegmentsExceeded, "one past is counted");
    assertEquals(
        [exceeded.segments, exceeded.maximum],
        [SEGMENTS_MAXIMUM + 1, SEGMENTS_MAXIMUM],
        "one past is counted",
    );
    const further = parseProtocolMessage(`${atBound};step;step`);
    assertInstanceOf(further, SegmentsExceeded, "two past is refused too");
    assertEquals(
        [further.segments, further.maximum],
        [SEGMENTS_MAXIMUM + 2, SEGMENTS_MAXIMUM],
        "counted",
    );
});

Deno.test("every message in every recording parses and writes back unchanged", () => {
    const recordings = readRecordedFights();
    let read = 0;
    let nobodyNamed = 0;
    for (const recording of recordings) {
        for (const message of recording.messages) {
            read += 1;
            const parsed = parseProtocolMessage(message);
            assert(!(parsed instanceof Error), `${recording.path}: "${message}" is refused`);
            assertStrictEquals(encodeProtocolMessage(parsed), message, recording.path);
            if (parsed.actor === null) nobodyNamed += 1;
        }
    }
    assert(read > recordings.length, "the recordings carry messages, not just files");
    assert(nobodyNamed > 0, "the protocol does state a message with no actor");
});
