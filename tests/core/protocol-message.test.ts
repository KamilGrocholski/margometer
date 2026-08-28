/**
 * The grammar, against every message the recordings carry.
 *
 * Each sample below is a transcript, copied from the recording it is named against — a guess
 * about the protocol's own text would be a claim about the game.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import {
    composeProtocolMessage,
    parseProtocolMessage,
    ProtocolMessageFormatError,
} from "@/src/core/protocol-message.ts";
import { getRecordedMessages, getRecordingPaths } from "@/tests/recorded-fight.ts";

/** `2026-08-04-tempest-lowca-vs-odyncze.json`, the fight this file's samples are taken from. */
const HIT = "482845=100.00;-161518=70.07;+dmgd=466;+acdmg=5;-dmgd=223";
const KILLING_HIT = "482845=100.00;-161518=0.00;+dmgd=485;+acdmg=5;-dmgd=248";
const STEP = "-255967=100.00;0;step";
const OUTCOME = "0;0;winner=Gracz 1";
/** `2026-08-06-tempest-grupa-vs-hildur.json`: a side stated without a percentage. */
const ANNOUNCEMENT = "-10000249;0;tspell=Struna płomienna";

Deno.test("both ends are read, with the health each states", () => {
    const hit = parseProtocolMessage(HIT);
    assertEquals(hit.actor, { combatantId: 482845, healthPercent: 100 }, "the actor is read");
    assertEquals(hit.target, { combatantId: -161518, healthPercent: 70.07 }, "the target is read");
    assertEquals(hit.parameters.length, 3, "every segment past the two ends is a parameter");
    assertEquals(hit.parameters[0], { key: "+dmgd", value: "466" }, "a parameter keeps its text");
});

Deno.test("a health of nothing is a reading, and nobody is not", () => {
    const killing = parseProtocolMessage(KILLING_HIT);
    assertEquals(killing.target, { combatantId: -161518, healthPercent: 0 }, "zero is a reading");
    assertEquals(parseProtocolMessage(STEP).target, null, "`0` is nobody, not a combatant");
    const announcement = parseProtocolMessage(ANNOUNCEMENT);
    assertEquals(announcement.actor, { combatantId: -10000249, healthPercent: null }, "no health");
});

Deno.test("a message naming neither end still parses", () => {
    const outcome = parseProtocolMessage(OUTCOME);
    assertEquals(outcome.actor, null, "the game named no actor");
    assertEquals(outcome.target, null, "the game named no target");
    assertEquals(outcome.parameters[0], { key: "winner", value: "Gracz 1" }, "a value may space");
});

Deno.test("a segment with no value is a key on its own", () => {
    const critical = parseProtocolMessage("482845=100.00;-161518=21.34;+crit;+dmgd=612");
    assertEquals(critical.parameters[0], { key: "+crit", value: null }, "null is not an empty");
    const empty = parseProtocolMessage("0;0;txt=");
    assertEquals(empty.parameters[0], { key: "txt", value: "" }, "an empty value is stated");
});

Deno.test("what the grammar does not cover is refused, and says which half", () => {
    assertThrows(() => parseProtocolMessage("482845"), ProtocolMessageFormatError, "one segment");
    assertThrows(() => parseProtocolMessage("gracz;0;step"), ProtocolMessageFormatError, "side");
    assertThrows(() => parseProtocolMessage("1=70.7;0;step"), ProtocolMessageFormatError, "health");
    assertThrows(
        () => parseProtocolMessage("1=70.070;0;step"),
        ProtocolMessageFormatError,
        "health",
    );
});

Deno.test("an id past what a number holds exactly is refused, not rounded", () => {
    const highest = parseProtocolMessage("9007199254740991;0;step");
    assertEquals(highest.actor, { combatantId: 9007199254740991, healthPercent: null }, "the last");
    assertThrows(
        () => parseProtocolMessage("9007199254740992;0;step"),
        ProtocolMessageFormatError,
        "id",
    );
});

Deno.test("every message in every recording parses and writes back unchanged", () => {
    const paths = getRecordingPaths();
    let read = 0;
    let nobodyNamed = 0;
    for (const path of paths) {
        for (const message of getRecordedMessages(path)) {
            read += 1;
            const parsed = parseProtocolMessage(message);
            assertEquals(composeProtocolMessage(parsed), message, `${path} lost a field`);
            if (parsed.actor === null) nobodyNamed += 1;
        }
    }
    assert(read > paths.length, "the recordings carry messages, not just files");
    assert(nobodyNamed > 0, "the protocol does state a message with no actor");
});
