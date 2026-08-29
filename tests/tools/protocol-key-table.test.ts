/**
 * The key table: the readers over invented bundles, and the frozen table over real material.
 *
 * Nothing of the client is stored here — the samples are written to have its **shape**, which is
 * what the tool reads. The last test puts two independent sources against each other: keys
 * lifted from the client's own switch, and keys the server sent during real fights.
 */

import { assert, assertEquals, assertThrows } from "@std/assert";
import { FROZEN_PROTOCOL_KEYS } from "@/frozen/protocol-keys.ts";
import { parseProtocolMessage } from "@/src/core/protocol-message.ts";
import { getRecordedMessages, getRecordingPaths } from "@/tests/recorded-fight.ts";
import { getComputedKeyFamily, getProtocolKeys } from "@/tools/protocol-key-table.ts";
import { ProtocolKeyTableError } from "@/tools/margometer-tool-error.ts";

/** The literal-second spelling, which is how build `53XkBRxF` writes the default branch. */
const NEWER_BUNDLE =
    'e.manageBattleEffects(t);switch(q[0]){case"+crit":a();break;case"blok":b();break;' +
    'default:q[0].substr(1,3)=="dmg"?q[0].charAt(0)=="+"?c():d():e()}';

/** The literal-first spelling of build `1786514810315`, with a local the minifier named `y`. */
const OLDER_BUNDLE =
    'x.manageBattleEffects(t);switch(y[0]){case"+crit":a();break;case"blok":b();break;' +
    'default:"dmg"==y[0].substr(1,3)?"+"==y[0].charAt(0)?c():d():e()}';

/** The same switch bundled with backticks, which is taste and not meaning. */
const BACKTICK_BUNDLE = NEWER_BUNDLE.split('"').join("`");

Deno.test("the keys come out of the switch, whatever the bundler's taste", () => {
    assertEquals(getProtocolKeys(NEWER_BUNDLE), ["+crit", "blok"], "quoted and sorted");
    assertEquals(getProtocolKeys(OLDER_BUNDLE), ["+crit", "blok"], "and a subject named y");
    assertEquals(
        getProtocolKeys(BACKTICK_BUNDLE),
        ["+crit", "blok"],
        "and one written in backticks",
    );
});

Deno.test("a bundle this no longer recognises stops, rather than shortening the table", () => {
    // The failure that is worth having: a freeze that threw where the switch had been
    // restructured is why the table was never quietly cut down to whatever still parsed.
    assertThrows(() => getProtocolKeys("var a=1;"), ProtocolKeyTableError, "restructured");
    assertThrows(
        () => getProtocolKeys("e.manageBattleEffects(t);switch(q[0]){default:f()}"),
        ProtocolKeyTableError,
        "case labels",
    );
});

Deno.test("the family the client recognises by shape is read in both orders", () => {
    const newer = getComputedKeyFamily(NEWER_BUNDLE);
    assertEquals(newer, { marker: "dmg", markerAt: 1, markerLength: 3, dealtSign: "+" }, "newer");
    assertEquals(getComputedKeyFamily(OLDER_BUNDLE), newer, "the older order says the same thing");
    assertThrows(() => getComputedKeyFamily("var a=1;"), ProtocolKeyTableError);
});

Deno.test("the frozen table says which build it came from, and holds no repetition", () => {
    const { keys, gameBuild, computedFamily } = FROZEN_PROTOCOL_KEYS;
    assert(keys.length > 0, "a table that was lifted names something");
    assert(gameBuild.length >= 8, "a build id is at least the eight characters both forms share");
    assertEquals(new Set(keys).size, keys.length, "a key is named once");
    assertEquals([...keys], [...keys].sort(), "and the order is the one a re-freeze reproduces");
    assert(computedFamily.marker.length > 0, "the family has a marker");
    assert(computedFamily.dealtSign.length > 0, "and a sign saying whose figure it is");
});

Deno.test("every key a real fight carried is one the client knows", () => {
    const { keys, computedFamily } = FROZEN_PROTOCOL_KEYS;
    const named = new Set<string>(keys);
    const { marker, markerAt, markerLength } = computedFamily;
    const seen = new Set<string>();
    for (const path of getRecordingPaths()) {
        for (const message of getRecordedMessages(path)) {
            for (const parameter of parseProtocolMessage(message).parameters) {
                seen.add(parameter.key);
            }
        }
    }
    assert(seen.size > 0, "there are keys in the recordings to check");
    const unrecognised = [...seen]
        .filter((key) => !named.has(key))
        .filter((key) => key.slice(markerAt, markerAt + markerLength) !== marker)
        .sort();
    assertEquals(unrecognised, [], "the material carries a key the client does not branch on");
});
